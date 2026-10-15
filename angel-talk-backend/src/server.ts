import mongoose from "mongoose";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./common/logger";
import { seedAll } from "../scripts/seed";

let memoryServer: { stop: () => Promise<boolean | void> } | null = null;

async function bootstrap() {
  try {
    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info(`Angel Talk Backend API listening on port ${env.PORT} (${env.NODE_ENV})`);
      logger.info(`Health check: http://localhost:${env.PORT}/api/v1/health`);
    });

    let atlasConnected = false;
    try {
      logger.info("Connecting to MongoDB Atlas...");
      await mongoose.connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        autoIndex: true,
      });
      logger.info("Connected to MongoDB Atlas successfully");
      atlasConnected = true;
      try {
        await seedAll({ closeConnection: false });
        logger.info("Atlas database auto-seeded successfully with all platform data");
      } catch (seedErr) {
        logger.warn({ seedErr }, "Database auto-seed warning");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.warn({ msg: errorMsg }, "MongoDB Atlas connection pending/auth issue. Starting instant local database...");

      try {
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        const memInstance = await MongoMemoryServer.create();
        memoryServer = memInstance;
        const memUri = memInstance.getUri();
        await mongoose.connect(memUri, { autoIndex: true });
        logger.info("Connected to instant local database. Seeding all data...");
        await seedAll({ closeConnection: false });
        logger.info("Local database 100% seeded and active for instant login!");
      } catch (localErr) {
        logger.error({ localErr }, "Could not start local memory database");
      }

      // Retry Atlas in background
      const retryInterval = setInterval(async () => {
        try {
          if (atlasConnected) {
            clearInterval(retryInterval);
            return;
          }
          const testConn = await mongoose.createConnection(env.MONGO_URI, { serverSelectionTimeoutMS: 4000 }).asPromise();
          if (testConn.readyState === 1) {
            logger.info("MongoDB Atlas authenticated and connected! Syncing...");
            await testConn.close();
            if (memoryServer) {
              await mongoose.disconnect();
              await memoryServer.stop();
              memoryServer = null;
            }
            await mongoose.connect(env.MONGO_URI, { autoIndex: true });
            await seedAll({ closeConnection: false });
            logger.info("Switched to live MongoDB Atlas successfully!");
            atlasConnected = true;
            clearInterval(retryInterval);
          }
        } catch {
          // Retry silently in background
        }
      }, 15000);
    }

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info("HTTP server closed.");
        await mongoose.connection.close(false);
        if (memoryServer) {
          await memoryServer.stop();
        }
        logger.info("Database connection closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    logger.error({ err }, "Fatal startup error");
    process.exit(1);
  }
}

bootstrap();

