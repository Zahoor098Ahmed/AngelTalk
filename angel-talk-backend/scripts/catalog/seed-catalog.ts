/**
 * Saves the data that is hard-coded in the Angel Talk app (and shown in its screens) into MongoDB.
 *
 *   npm run seed:catalog             -> write to the database in MONGO_URI
 *   npm run seed:catalog -- --dry    -> only build it and save catalog-export.json (no database)
 *
 *  - default board  -> seedtemplates (one template per folder, shown in the admin panel "Templates")
 *  - verbs          -> verbgroups    (shown in the admin panel "Verbs")
 *  - everything else (translations, pictures, games, suggestions…) -> catalog_* collections
 *
 * Run it again whenever the app's built-in data changes: only new or changed documents are written,
 * removed ones are deleted, nothing is duplicated. Templates/verbs added in the admin panel and all
 * user data (users, children, their shelves and words…) are never touched.
 */
import "dotenv/config";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { buildCatalog } from "./build-catalog";

const DRY = process.argv.includes("--dry");
const BATCH = 500;

/** Collections from earlier versions of this script, or for features the app does not show. */
const RETIRED = ["catalog_categories", "catalog_words", "catalog_verbs", "catalog_social_stories", "catalog_onboarding_presets", "socialstories"];
/** Sample templates written by scripts/seed.ts that are not part of the app. */
const SAMPLE_TEMPLATE_SEEDNAMES = ["core", "food", "feelings", "people", "places", "saudi_culture"];

type Doc = { _id: string; [k: string]: unknown };
/** Atlas connections sometimes drop mid-way: retry a step a few times before giving up. */
async function withRetry<T>(what: string, fn: () => Promise<T>, tries = 5): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= tries) throw e;
      console.log(`  (${what}: ${e instanceof Error ? e.message : e}; retrying ${i}/${tries - 1})`);
      await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
}
const hashOf = (d: Doc) => crypto.createHash("sha1").update(JSON.stringify(d)).digest("hex");

async function syncCollection(
  db: mongoose.mongo.Db,
  name: string,
  docs: Doc[],
  owned: Record<string, unknown>,
): Promise<{ added: number; updated: number; removed: number; unchanged: number }> {
  const col = db.collection<Doc>(name);
  const existing = new Map<string, string | undefined>();
  const current = await withRetry(`read ${name}`, () => col.find(owned, { projection: { contentHash: 1 } }).toArray());
  for (const d of current) existing.set(String(d._id), d.contentHash as string | undefined);

  const now = new Date();
  const changed = docs
    .map((d) => ({ d, h: hashOf(d) }))
    .filter(({ d, h }) => existing.get(d._id) !== h);
  for (let i = 0; i < changed.length; i += BATCH) {
    const part = changed.slice(i, i + BATCH);
    await withRetry(`write ${name}`, () => col.bulkWrite(
      part.map(({ d, h }) => ({
        replaceOne: { filter: { _id: d._id }, replacement: { ...d, contentHash: h, updatedAt: now, createdAt: (d.createdAt as Date) ?? now }, upsert: true },
      })),
      { ordered: false },
    ));
  }
  const keep = new Set(docs.map((d) => d._id));
  const stale = [...existing.keys()].filter((id) => !keep.has(id));
  if (stale.length) await withRetry(`clean ${name}`, () => col.deleteMany({ _id: { $in: stale } }));

  const added = changed.filter(({ d }) => !existing.has(d._id)).length;
  return { added, updated: changed.length - added, removed: stale.length, unchanged: docs.length - changed.length };
}

async function main() {
  const started = Date.now();
  const catalog = (await buildCatalog()) as Record<string, Doc[]>;
  const names = Object.keys(catalog).sort();

  console.log("\nBuilt from the app source:");
  for (const n of names) console.log(`  ${n.padEnd(28)} ${String(catalog[n].length).padStart(6)} documents`);

  if (DRY) {
    const out = path.resolve(process.cwd(), "catalog-export.json");
    fs.writeFileSync(out, JSON.stringify(catalog, null, 2));
    console.log(`\nDry run: nothing written to the database. Saved ${out}`);
    return;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set (angel-talk-backend/.env)");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000 });
  const db = mongoose.connection.db!;
  console.log(`\nDatabase "${db.databaseName}":`);

  // 1. clean-up: retired collections and the sample templates that are not part of the app
  const present = new Set((await db.listCollections().toArray()).map((c) => c.name));
  for (const name of RETIRED) {
    if (present.has(name)) {
      await db.collection(name).drop();
      console.log(`  removed collection ${name}`);
    }
  }
  const samples = await db.collection("seedtemplates").deleteMany({ source: { $ne: "app" }, seedName: { $in: SAMPLE_TEMPLATE_SEEDNAMES } });
  if (samples.deletedCount) console.log(`  removed ${samples.deletedCount} sample templates that are not in the app`);

  // 2. verbs already in "verbgroups" (added in the admin panel) are kept as they are, never doubled
  if (catalog.verbgroups) {
    const taken = new Set(
      (await db.collection("verbgroups").find({ source: { $ne: "app" } }, { projection: { base: 1 } }).toArray()).map((v) => String(v.base)),
    );
    const skipped = catalog.verbgroups.filter((v) => taken.has(String(v.base))).length;
    catalog.verbgroups = catalog.verbgroups.filter((v) => !taken.has(String(v.base)));
    if (skipped) console.log(`  ${skipped} verbs already exist in verbgroups (kept as they are)`);
  }

  // ...and a template made in the admin panel with the same name wins over the app's copy
  if (catalog.seedtemplates) {
    const taken = new Set(
      (await db.collection("seedtemplates").find({ source: { $ne: "app" } }, { projection: { seedName: 1 } }).toArray()).map((t) => String(t.seedName)),
    );
    catalog.seedtemplates = catalog.seedtemplates.filter((t) => !taken.has(String(t.seedName)));
  }

  // 3. write
  // a catalog_* collection whose fingerprint did not change is skipped without reading it
  const meta = await withRetry("read catalog_meta", () => db.collection<Doc>("catalog_meta").findOne({ _id: "catalog" }));
  const oldPrints = (meta?.fingerprints ?? {}) as Record<string, string>;
  const prints: Record<string, string> = {};
  const summary: [string, Awaited<ReturnType<typeof syncCollection>>][] = [];
  for (const name of names) {
    const owned = name.startsWith("catalog_") ? {} : { source: "app" };
    prints[name] = hashOf({ _id: name, docs: catalog[name].map(hashOf) });
    if (name.startsWith("catalog_") && oldPrints[name] === prints[name]) {
      summary.push([name, { added: 0, updated: 0, removed: 0, unchanged: catalog[name].length }]);
      continue;
    }
    summary.push([name, await syncCollection(db, name, catalog[name], owned)]);
  }
  await withRetry("write catalog_meta", () =>
    db.collection<Doc>("catalog_meta").replaceOne(
      { _id: "catalog" },
      { _id: "catalog", syncedAt: new Date(), collections: Object.fromEntries(names.map((n) => [n, catalog[n].length])), fingerprints: prints },
      { upsert: true },
    ),
  );

  console.log("");
  for (const [n, s] of summary) {
    console.log(`  ${n.padEnd(28)} new ${String(s.added).padStart(6)}   changed ${String(s.updated).padStart(5)}   removed ${String(s.removed).padStart(5)}   unchanged ${String(s.unchanged).padStart(6)}`);
  }
  console.log(`\nFinished in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error("\nCatalog seed failed:", e instanceof Error ? e.message : e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
