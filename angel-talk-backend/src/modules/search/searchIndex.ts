import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { logger } from "../../common/logger";

/**
 * In-memory search index for the admin panel. Everything searchable is kept in memory with a
 * prepared lower-case text, so a search never goes to the database and answers in milliseconds:
 *  - the app's built-in content (catalog_* collections: pictures, translations, games…)
 *  - families (users), children, board folders with their words, and verbs
 *
 * The content collections are also kept on disk (.cache/search-catalog.json) and are only read again
 * from the database when "npm run seed:catalog" changed them. People, folders and verbs are refreshed
 * every 30 seconds and right after a change made in the admin panel.
 */

type Entry<T = Record<string, unknown>> = { doc: T; text: string };

const CATALOG_FILE = path.resolve(__dirname, "../../../.cache/search-catalog.json");
const LIVE_FILE = path.resolve(__dirname, "../../../.cache/search-live.json");
const LIVE_REFRESH_MS = 30000;

/** Fields that hold something a person would search for. */
const TEXT_FIELDS = ["_id", "word", "name", "label", "title", "en", "text", "key", "after", "base", "email", "fullName", "lang", "category", "module"];

const catalog = new Map<string, Entry[]>(); // collection name -> entries
let catalogPrints: Record<string, string> = {};
let users: Entry[] = [];
let children: Entry[] = [];
let folders: Entry[] = [];
let verbs: Entry[] = [];
let liveLoadedAt = 0;
let loadingLive: Promise<void> | null = null;
let loadingCatalog: Promise<void> | null = null;

const norm = (s: unknown) => String(s ?? "").toLowerCase();

function textOf(doc: Record<string, unknown>, extra: unknown[] = []): string {
  const parts: unknown[] = TEXT_FIELDS.map((f) => doc[f]);
  if (Array.isArray(doc.next)) parts.push(...(doc.next as unknown[]));
  if (Array.isArray(doc.words) && doc.words.every((w) => typeof w === "string")) parts.push(...(doc.words as string[]).slice(0, 200));
  return parts.concat(extra).filter((p) => p !== undefined && p !== null && p !== "").map(norm).join(" \u0001 ");
}

// ---------- loading ----------

try {
  const saved = JSON.parse(fs.readFileSync(CATALOG_FILE, "utf8")) as { prints: Record<string, string>; collections: Record<string, Record<string, unknown>[]> };
  catalogPrints = saved.prints ?? {};
  for (const [name, docs] of Object.entries(saved.collections ?? {})) catalog.set(name, docs.map((doc) => ({ doc, text: textOf(doc) })));
} catch {
  /* nothing saved yet */
}

// people / folders / verbs from last time: answer at once after a restart, refresh in the background
let liveHost = "";
try {
  const saved = JSON.parse(fs.readFileSync(LIVE_FILE, "utf8")) as { host: string; users: Entry[]; children: Entry[]; folders: Entry[]; verbs: Entry[] };
  ({ users, children, folders, verbs } = saved);
  liveHost = saved.host;
  liveLoadedAt = 1; // stale on purpose: the first search refreshes it
} catch {
  /* nothing saved yet */
}

function saveLive() {
  try {
    fs.mkdirSync(path.dirname(LIVE_FILE), { recursive: true });
    fs.writeFileSync(LIVE_FILE, JSON.stringify({ host: liveHost, users, children, folders, verbs }));
  } catch {
    /* the disk copy is only a convenience */
  }
}

function saveCatalog() {
  try {
    fs.mkdirSync(path.dirname(CATALOG_FILE), { recursive: true });
    const collections = Object.fromEntries([...catalog].map(([name, entries]) => [name, entries.map((e) => e.doc)]));
    fs.writeFileSync(CATALOG_FILE, JSON.stringify({ prints: catalogPrints, collections }));
  } catch {
    /* the disk copy is only a convenience */
  }
}

/** Reads only the content collections whose fingerprint changed since last time. */
async function loadCatalog(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db || !onRealDatabase()) return;
  const meta = await db.collection("catalog_meta").findOne({}, { projection: { fingerprints: 1 } });
  const prints = (meta?.fingerprints ?? {}) as Record<string, string>;
  const names = (await db.listCollections().toArray()).map((c) => c.name).filter((n) => n.startsWith("catalog_") && n !== "catalog_meta");
  let changed = false;
  for (const name of names) {
    if (catalog.has(name) && prints[name] && catalogPrints[name] === prints[name]) continue;
    const docs = await db.collection(name).find({}, { projection: { contentHash: 0, syncedAt: 0 } }).toArray();
    catalog.set(name, docs.map((doc) => ({ doc: doc as Record<string, unknown>, text: textOf(doc as Record<string, unknown>) })));
    if (prints[name]) catalogPrints[name] = prints[name];
    changed = true;
  }
  for (const name of [...catalog.keys()]) if (!names.includes(name)) catalog.delete(name);
  if (changed) saveCatalog();
}

async function loadLive(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db || !onRealDatabase()) return;
  const [u, c, t, v] = await Promise.all([
    db.collection("users").find({}, { projection: { passwordHash: 0, pinHash: 0, mfaSecret: 0, mfaBackupCodes: 0 } }).toArray(),
    db.collection("children").find({ deletedAt: null }, { projection: { faceDescriptors: 0 } }).toArray(),
    db.collection("seedtemplates").find({ active: true }, { projection: { name: 1, icon: 1, source: 1, "words.label": 1, "words.translations": 1, "words.imageUri": 1, "words.emoji": 1 } }).toArray(),
    db.collection("verbgroups").find({ active: true }, { projection: { base: 1, emoji: 1, source: 1, forms: 1 } }).toArray(),
  ]);
  const ownerBy = new Map(u.map((x) => [String(x._id), x]));
  users = u.map((doc) => ({ doc: doc as Record<string, unknown>, text: textOf(doc as Record<string, unknown>) }));
  children = c.map((doc) => {
    const owner = ownerBy.get(String(doc.ownerId));
    return { doc: { ...doc, ownerEmail: owner?.email, ownerName: owner?.fullName }, text: textOf(doc as Record<string, unknown>, [owner?.email, owner?.fullName]) };
  });
  folders = t.map((doc) => {
    const words = (doc.words ?? []) as { label: string; translations?: Record<string, string> }[];
    return {
      doc: doc as Record<string, unknown>,
      text: textOf(doc as Record<string, unknown>, words.flatMap((w) => [w.label, ...Object.values(w.translations ?? {})])),
    };
  });
  verbs = v.map((doc) => {
    const forms = Object.values((doc.forms ?? {}) as Record<string, { text?: string; translations?: Record<string, string> }>);
    return { doc: doc as Record<string, unknown>, text: textOf(doc as Record<string, unknown>, forms.flatMap((f) => [f.text, ...Object.values(f.translations ?? {})])) };
  });
  liveLoadedAt = Date.now();
  liveHost = mongoose.connection.host || "";
  saveLive();
}

/** Refresh people / folders / verbs (in the background unless nothing is loaded yet). */
export function refreshLive(): Promise<void> {
  if (!loadingLive) {
    loadingLive = loadLive()
      .catch((err) => logger.warn({ err }, "search index: live refresh failed"))
      .finally(() => (loadingLive = null));
  }
  return loadingLive;
}

export function refreshCatalog(): Promise<void> {
  if (!loadingCatalog) {
    loadingCatalog = loadCatalog()
      .catch((err) => logger.warn({ err }, "search index: content refresh failed"))
      .finally(() => (loadingCatalog = null));
  }
  return loadingCatalog;
}

async function ensureLive() {
  if (loadingLive) await loadingLive; // a change was just made: answer with the fresh data
  if (liveLoadedAt === 0) await refreshLive();
  else if (Date.now() - liveLoadedAt > LIVE_REFRESH_MS) void refreshLive();
}

/** The server may first use a temporary local database while it connects to the real one: don't index that. */
export function onRealDatabase(): boolean {
  const host = mongoose.connection.host || "";
  const configured = process.env.MONGO_URI || "";
  const local = /^(127.0.0.1|localhost)$/.test(host);
  return !local || /127.0.0.1|localhost/.test(configured);
}

function onConnected() {
  if (!onRealDatabase()) return;
  if (liveHost !== (mongoose.connection.host || "")) {
    users = children = folders = verbs = [];
    liveLoadedAt = 0;
  }
  void refreshLive().then(refreshCatalog);
}
if (mongoose.connection.readyState === 1) setImmediate(onConnected);
mongoose.connection.on("connected", onConnected);

// ---------- searching ----------

function match(entries: Entry[], q: string): Entry[] {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return entries;
  return entries.filter((e) => terms.every((t) => e.text.includes(t)));
}

/** Exact / starts-with matches first. */
function rank(entries: Entry[], q: string, key: (d: Record<string, unknown>) => unknown): Entry[] {
  const nq = norm(q).trim();
  const score = (e: Entry) => {
    const k = norm(key(e.doc));
    return k === nq ? 0 : k.startsWith(nq) ? 1 : 2;
  };
  return entries.map((e) => [score(e), e] as const).sort((a, b) => a[0] - b[0]).map(([, e]) => e);
}

export function isCatalogReady(name: string): boolean {
  return catalog.has(name);
}

/** Page through one content collection (used by the App Content page). */
export function searchCatalog(name: string, q: string, page: number, limit: number) {
  const all = catalog.get(name) ?? [];
  const hits = q ? rank(match(all, q), q, (d) => d.word ?? d.name ?? d.en ?? d.key ?? d._id) : [...all].sort((a, b) => String(a.doc._id).localeCompare(String(b.doc._id)));
  return { items: hits.slice((page - 1) * limit, page * limit).map((e) => e.doc), total: hits.length, page, totalPages: Math.max(1, Math.ceil(hits.length / limit)) };
}

/** Families list with filters (used by the Families page). */
export async function searchUsers(opts: { q?: string; role?: string; status?: string; page: number; limit: number }) {
  await ensureLive();
  let hits = match(users, opts.q ?? "");
  if (opts.role) hits = hits.filter((e) => e.doc.role === opts.role);
  if (opts.status) hits = hits.filter((e) => e.doc.status === opts.status);
  hits = [...hits].sort((a, b) => new Date(String(b.doc.createdAt)).getTime() - new Date(String(a.doc.createdAt)).getTime());
  return {
    users: hits.slice((opts.page - 1) * opts.limit, opts.page * opts.limit).map((e) => e.doc),
    total: hits.length,
    page: opts.page,
    totalPages: Math.max(1, Math.ceil(hits.length / opts.limit)),
  };
}

/** One search box for everything. */
export async function searchEverything(q: string, limit = 6) {
  await ensureLive();
  const started = Date.now();
  const pick = (entries: Entry[], key: (d: Record<string, unknown>) => unknown) => {
    const hits = rank(match(entries, q), q, key);
    return { total: hits.length, items: hits.slice(0, limit).map((e) => e.doc) };
  };
  const folderHits = rank(match(folders, q), q, (d) => d.name);
  const nq = norm(q).trim();
  return {
    query: q,
    users: pick(users, (d) => d.email),
    children: pick(children, (d) => d.name),
    folders: {
      total: folderHits.length,
      items: folderHits.slice(0, limit).map((e) => {
        const words = ((e.doc.words ?? []) as { label: string; translations?: Record<string, string>; imageUri?: string; emoji?: string }[]).filter(
          (w) => norm(w.label).includes(nq) || Object.values(w.translations ?? {}).some((t) => norm(t).includes(nq)),
        );
        return { _id: e.doc._id, name: e.doc.name, icon: e.doc.icon, source: e.doc.source, matchingWords: words.slice(0, 8) };
      }),
    },
    verbs: pick(verbs, (d) => d.base),
    pictures: pick(catalog.get("catalog_pictograms") ?? [], (d) => d.word),
    translations: pick(catalog.get("catalog_translations") ?? [], (d) => d.en ?? d.key),
    tookMs: Date.now() - started,
    contentReady: catalog.has("catalog_pictograms"),
  };
}
