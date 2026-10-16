/** Lists every collection in the database with its document count:  npm run db:status */
import "dotenv/config";
import mongoose from "mongoose";

(async () => {
  await mongoose.connect(process.env.MONGO_URI!, { serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db!;
  console.log(`Database "${db.databaseName}"`);
  const cols = (await db.listCollections().toArray()).map((c) => c.name).sort();
  for (const name of cols) console.log(`  ${name.padEnd(30)} ${String(await db.collection(name).countDocuments()).padStart(7)}`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error("Could not read the database:", e instanceof Error ? e.message : e);
  process.exit(1);
});
