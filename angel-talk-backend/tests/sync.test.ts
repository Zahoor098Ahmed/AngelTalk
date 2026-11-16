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

  it("rejects personal shelf and word uploads and never returns boards in profile sync", async () => {
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
    expect(pushRes.body.data.results[0].status).toBe("rejected");
    expect(pushRes.body.data.results[1].status).toBe("rejected");

    // 3. Pull sync and verify both records are returned
    const pullRes = await request(app)
      .get("/api/v1/sync/pull")
      .set("Authorization", `Bearer ${token}`);

    expect(pullRes.status).toBe(200);
    expect(pullRes.body.data.tables.shelves).toBeUndefined();
    expect(pullRes.body.data.tables.words).toBeUndefined();
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
            table: "children",
            id: childId,
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


describe("Local-only personal content policy", () => {
  async function register() {
    const response = await request(app).post("/api/v1/auth/register").send({
      email: "private-board@test.com", password: "Password123!", fullName: "Private Board Parent", role: "parent",
    });
    expect(response.status).toBe(201);
    return response.body.data.accessToken as string;
  }

  it("syncs the basic child profile without private settings, activity or board data", async () => {
    const token = await register();
    const childId = uuidv4();
    const result = await request(app).post("/api/v1/sync/push").set("Authorization", `Bearer ${token}`).send({
      mutations: [{ table: "children", id: childId, action: "UPSERT", clientUpdatedAt: new Date().toISOString(), data: {
        name: "Local Board Child", age: 5, diagnoses: ["general"],
        settings: { privateWord: "PRIVATE_WORD" }, rewards: { stars: 99 }, careLogs: [{ notes: "PRIVATE_NOTE" }],
      } }],
    });
    expect(result.status).toBe(200);
    expect(result.body.data.results[0].status).toBe("applied");
    const pull = await request(app).get("/api/v1/sync/pull").set("Authorization", `Bearer ${token}`);
    expect(Object.keys(pull.body.data.tables)).toEqual(["children"]);
    expect(pull.body.data.tables.children[0].name).toBe("Local Board Child");
    expect(pull.body.data.tables.children[0].settings).toBeUndefined();
    expect(JSON.stringify(pull.body)).not.toContain("PRIVATE_WORD");
    expect(JSON.stringify(pull.body)).not.toContain("PRIVATE_NOTE");
  });

  it("rejects all old personal-content sync tables without storing records", async () => {
    const token = await register();
    const privateTables = ["shelves", "words", "usagesummaries", "sentencelogs", "carelogs", "socialstories", "scheduletasks", "passcards", "gamesprogress"];
    const result = await request(app).post("/api/v1/sync/push").set("Authorization", `Bearer ${token}`).send({
      mutations: privateTables.map(table => ({ table, id: uuidv4(), action: "UPSERT", clientUpdatedAt: new Date().toISOString(), data: { childId: uuidv4(), label: "PRIVATE_WORD", words: ["PRIVATE_WORD"] } })),
    });
    expect(result.status).toBe(200);
    expect(result.body.data.results).toHaveLength(privateTables.length);
    expect(result.body.data.results.every((item: { status: string }) => item.status === "rejected")).toBe(true);
    const { Word } = await import("../src/models/Word");
    const { Shelf } = await import("../src/models/Shelf");
    const { SentenceLog } = await import("../src/models/SentenceLog");
    expect(await Word.countDocuments()).toBe(0);
    expect(await Shelf.countDocuments()).toBe(0);
    expect(await SentenceLog.countDocuments()).toBe(0);
  });

  it("blocks legacy direct word and sentence upload routes", async () => {
    const token = await register();
    for (const endpoint of ["/shelves/legacy/words", "/children/legacy/sentence-logs", "/children/legacy/apply-template/seed"]) {
      const response = await request(app).post(`/api/v1${endpoint}`).set("Authorization", `Bearer ${token}`).send({ label: "PRIVATE_WORD", words: ["PRIVATE_WORD"] });
      expect(response.status).toBe(410);
      expect(response.body.code).toBe("LOCAL_ONLY_CONTENT");
    }
  });
});
