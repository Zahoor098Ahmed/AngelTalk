import mongoose from "mongoose";
import { execSync } from "child_process";
import { Server } from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./common/logger";
import { seedAll } from "../scripts/seed";

let memoryServer: { stop: () => Promise<boolean | void> } | null = null;
const globalForServer = globalThis as unknown as {
  __angelTalkServer?: Server;
};

function freePortWindows(port: number) {
  try {
    if (process.platform === "win32") {
      const cmd = `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { if ($_.OwningProcess -ne ${process.pid} -and $_.OwningProcess -gt 0) { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } }"`;
      execSync(cmd, { stdio: "ignore" });
    }
  } catch {
    // Ignore errors
  }
}

async function bootstrap() {
  try {
    if (globalForServer.__angelTalkServer) {
      await new Promise<void>((resolve) => {
        globalForServer.__angelTalkServer?.close(() => resolve());
      });
    }

    const app = createApp();

    const server: Server = app.listen(env.PORT, () => {
      logger.info(`Angel Talk Backend API listening on port ${env.PORT} (${env.NODE_ENV})`);
      logger.info(`Health check: http://localhost:${env.PORT}/api/v1/health`);
    });
    globalForServer.__angelTalkServer = server;

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        logger.warn(`Port ${env.PORT} was in use. Reclaiming port ${env.PORT}...`);
        freePortWindows(env.PORT);
        setTimeout(() => {
          server.close();
          server.listen(env.PORT);
        }, 500);
      } else {
        logger.error({ err }, "HTTP server error");
      }
    });

    // 1. Start instant local database & seed immediately so login works with zero delay
    if (mongoose.connection.readyState !== 1) {
      try {
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        const memInstance = await MongoMemoryServer.create();
        memoryServer = memInstance;
        const memUri = memInstance.getUri();
        await mongoose.connect(memUri, { autoIndex: true });
        await seedAll({ closeConnection: false });
        logger.info("Database 100% seeded and ready for instant login!");
      } catch (localErr) {
        logger.error({ localErr }, "Could not start local memory database");
      }
    }

    // 2. Attempt live MongoDB Atlas connection in background
    let atlasConnected = false;
    const tryConnectAtlas = async () => {
      if (atlasConnected) return;
      try {
        const testConn = await mongoose
          .createConnection(env.MONGO_URI, { serverSelectionTimeoutMS: 15000 })
          .asPromise();
        if (testConn.readyState === 1) {
          logger.info("Connected to live MongoDB Atlas! Switching over...");
          await testConn.close();
          if (memoryServer) {
            await mongoose.disconnect();
            await memoryServer.stop();
            memoryServer = null;
          }
          await mongoose.connect(env.MONGO_URI, { autoIndex: true });
          await seedAll({ closeConnection: false });
          logger.info("Switched to live MongoDB Atlas and seeded successfully!");
          atlasConnected = true;
        }
      } catch {
        // Keep using seeded local database while Atlas whitelist/credentials are pending
      }
    };

    tryConnectAtlas();
    const retryInterval = setInterval(async () => {
      if (atlasConnected) {
        clearInterval(retryInterval);
        return;
      }
      await tryConnectAtlas();
    }, 20000);

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

