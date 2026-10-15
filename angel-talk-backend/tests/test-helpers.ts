import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { createApp } from "../src/app";
import { Express } from "express";

let mongoServer: MongoMemoryServer | null = null;
let appInstance: Express | null = null;

export async function setupTestDb(): Promise<Express> {
  process.env.NODE_ENV = "test";
  process.env.JWT_ACCESS_SECRET = "test_jwt_access_secret_1234567890_32bytes!";
  process.env.JWT_REFRESH_SECRET = "test_jwt_refresh_secret_1234567890_32bytes!";
  process.env.JWT_PIN_SECRET = "test_jwt_pin_secret_1234567890_32bytes!";

  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }

  if (!appInstance) {
    appInstance = createApp();
  }

  return appInstance;
}

export async function clearTestDb(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}

export async function teardownTestDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

