/**
 * Removes the demo / test data so the database (and the admin panel) only shows real data:
 *  - the demo family made by scripts/seed.ts with SEED_DEMO=true (parent@angeltalk.sa, child "Rayan")
 *  - accounts made by automated tests (family-e2e…@devices.angeltalk.app)
 *  - everything that belongs to their children (board, usage, schedule, journal, passcard…)
 *  - the 12 sample verbs of the demo seed (the app's own verbs come from "npm run seed:catalog")
 *
 *   npm run db:remove-demo
 */
import "dotenv/config";
import mongoose from "mongoose";

const DEMO_EMAILS = ["parent@angeltalk.sa"];
const TEST_EMAIL = /^family-e2e.*@devices\.angeltalk\.app$/;
const CHILD_COLLECTIONS = [
  "shelves", "words", "scheduletasks", "passcards", "usagesummaries", "carelogs", "therapygoals",
  "clinicalnotes", "gamesprogresses", "sentencelogs", "socialstories", "careteams", "consents", "faceembeddings",
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI!, { serverSelectionTimeoutMS: 30000 });
  const db = mongoose.connection.db!;
  const present = new Set((await db.listCollections().toArray()).map((c) => c.name));

  const users = await db
    .collection("users")
    .find({ $or: [{ email: { $in: DEMO_EMAILS } }, { email: TEST_EMAIL }] }, { projection: { email: 1 } })
    .toArray();
  const userIds = users.map((u) => u._id);
  // test children stay behind (archived) when their account was already deleted in the admin panel
  const children = await db
    .collection("children")
    .find({ $or: [{ ownerId: { $in: userIds } }, { name: "E2E Kid" }, { _id: /^child_e2e_/ }] }, { projection: { name: 1 } })
    .toArray();
  const childIds = children.map((c) => c._id);
  console.log(`Demo/test accounts: ${users.map((u) => u.email).join(", ") || "none"}`);
  console.log(`Their children: ${children.map((c) => c.name).join(", ") || "none"}`);

  for (const name of CHILD_COLLECTIONS) {
    if (!present.has(name)) continue;
    const r = await db.collection(name).deleteMany({ $or: [{ childId: { $in: childIds } }, { ownerId: { $in: userIds } }] });
    if (r.deletedCount) console.log(`  ${name.padEnd(16)} removed ${r.deletedCount}`);
  }
  for (const [name, field] of [["refreshtokens", "userId"], ["devices", "userId"]] as const) {
    if (!present.has(name)) continue;
    const r = await db.collection(name).deleteMany({ [field]: { $in: userIds } });
    if (r.deletedCount) console.log(`  ${name.padEnd(16)} removed ${r.deletedCount}`);
  }
  const kids = await db.collection("children").deleteMany({ _id: { $in: childIds } });
  const accts = await db.collection("users").deleteMany({ _id: { $in: userIds } });
  console.log(`  children         removed ${kids.deletedCount}`);
  console.log(`  users            removed ${accts.deletedCount}`);

  // sample verbs of the demo seed have no "source"; app verbs are "app", admin-made ones "admin"
  const verbs = await db.collection("verbgroups").deleteMany({ source: { $exists: false } });
  console.log(`  sample verbs     removed ${verbs.deletedCount}  (run "npm run seed:catalog" to add the app's verbs)`);

  // test leftovers in the admin content
  const tpl = await db.collection("seedtemplates").deleteMany({ name: /^E2E /, source: { $ne: "app" } });
  const tv = await db.collection("verbgroups").deleteMany({ base: /e2e$/ });
  if (tpl.deletedCount || tv.deletedCount) console.log(`  test folders/verbs removed ${tpl.deletedCount + tv.deletedCount}`);

  await mongoose.disconnect();
})().catch((e) => {
  console.error("Failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
