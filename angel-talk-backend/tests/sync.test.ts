import request from "supertest";
import { setupTestDb, clearTestDb, teardownTestDb } from "./test-helpers";
import { Express } from "express";
import { v4 as uuidv4 } from "uuid";

let app: Express;

beforeAll(async () => {
  app = await setupTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

describe("Sync Engine Integration Tests", () => {
  it("should pull empty state initially with syncedAt timestamp", async () => {
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: "syncparent@test.com",
      password: "Password123!",
      fullName: "Sync Parent",
      role: "parent",
    });
    const token = regRes.body.data.accessToken;

    const pullRes = await request(app)
      .get("/api/v1/sync/pull")
      .set("Authorization", `Bearer ${token}`);

    expect(pullRes.status).toBe(200);
    expect(pullRes.body.success).toBe(true);
    expect(pullRes.body.data.syncedAt).toBeDefined();
    expect(pullRes.body.data.hasMore).toBe(false);
  });

  it("should push shelf and word mutations and pull them back", async () => {
    // 1. Register parent & create child
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: "syncparent2@test.com",
      password: "Password123!",
      fullName: "Sync Parent 2",
      role: "parent",
    });
    const token = regRes.body.data.accessToken;

    const childRes = await request(app)
      .post("/api/v1/children")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Yousef",
        age: 5,
        diagnoses: ["speech_delay"],
      });
    const childId = childRes.body.data._id;

    // 2. Push shelf mutation
    const shelfId = uuidv4();
    const wordId = uuidv4();
    const pushRes = await request(app)
      .post("/api/v1/sync/push")
      .set("Authorization", `Bearer ${token}`)
      .send({
        mutations: [
          {
            table: "shelves",
            id: shelfId,
            action: "upsert",
            clientUpdatedAt: new Date().toISOString(),
            data: {
              childId,
              name: "Food",
              icon: "food-apple",
              color: "#4CAF50",
              order: 0,
            },
          },
          {
            table: "words",
            id: wordId,
            action: "upsert",
            clientUpdatedAt: new Date().toISOString(),
            data: {
              childId,
              shelfId,
              label: "Apple",
              phrase: "I want an apple",
              color: "#E91E63",
              order: 0,
            },
          },
        ],
      });

    expect(pushRes.status).toBe(200);
    expect(pushRes.body.success).toBe(true);
    expect(pushRes.body.data.results.length).toBe(2);
    expect(pushRes.body.data.results[0].status).toBe("applied");
    expect(pushRes.body.data.results[1].status).toBe("applied");

    // 3. Pull sync and verify both records are returned
    const pullRes = await request(app)
      .get("/api/v1/sync/pull")
      .set("Authorization", `Bearer ${token}`);

    expect(pullRes.status).toBe(200);
    expect(pullRes.body.data.tables.shelves).toBeDefined();
    expect(pullRes.body.data.tables.shelves.some((s: { _id: string }) => s._id === shelfId)).toBe(true);
    expect(pullRes.body.data.tables.words).toBeDefined();
    expect(pullRes.body.data.tables.words.some((w: { _id: string }) => w._id === wordId)).toBe(true);
  });

  it("should reject push mutations targeting another user's child", async () => {
    // Parent 1 creates child
    const res1 = await request(app).post("/api/v1/auth/register").send({
      email: "user1@test.com",
      password: "Password123!",
      fullName: "User 1",
    });
    const token1 = res1.body.data.accessToken;

    const childRes = await request(app)
      .post("/api/v1/children")
      .set("Authorization", `Bearer ${token1}`)
      .send({ name: "Child 1", age: 4, diagnoses: ["general"] });
    const childId = childRes.body.data._id;

    // Parent 2 tries to push to Parent 1's child
    const res2 = await request(app).post("/api/v1/auth/register").send({
      email: "user2@test.com",
      password: "Password123!",
      fullName: "User 2",
    });
    const token2 = res2.body.data.accessToken;

    const pushRes = await request(app)
      .post("/api/v1/sync/push")
      .set("Authorization", `Bearer ${token2}`)
      .send({
        mutations: [
          {
            table: "shelves",
            id: uuidv4(),
            action: "upsert",
            clientUpdatedAt: new Date().toISOString(),
            data: { childId, name: "Hacked Shelf" },
          },
        ],
      });

    expect(pushRes.status).toBe(200);
    expect(pushRes.body.data.results[0].status).toBe("rejected");
    expect(pushRes.body.data.results[0].reason).toContain("Unauthorized access");
  });
});

