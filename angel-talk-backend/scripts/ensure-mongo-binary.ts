import { MongoMemoryServer } from "mongodb-memory-server";

async function main() {
  console.log("Downloading/Verifying MongoDB Memory Server binary...");
  const server = await MongoMemoryServer.create();
  console.log("MongoDB Memory Server successfully started at:", server.getUri());
  await server.stop();
  console.log("MongoDB binary cached successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to start MongoMemoryServer:", err);
  process.exit(1);
});

