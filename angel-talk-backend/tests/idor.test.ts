import request from "supertest";
import { setupTestDb, clearTestDb, teardownTestDb } from "./test-helpers";
import { Express } from "express";

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

describe("IDOR Protection & Multi-Child Isolation Tests", () => {
  it("should prevent Parent B from accessing or modifying Parent A's child (404 anti-enumeration)", async () => {
    // 1. Register Parent A
    const resA = await request(app).post("/api/v1/auth/register").send({
      email: "parenta@test.com",
      password: "Password123!",
      fullName: "Parent A",
      role: "parent",
    });
    const tokenA = resA.body.data.accessToken;

    // 2. Register Parent B
    const resB = await request(app).post("/api/v1/auth/register").send({
      email: "parentb@test.com",
      password: "Password123!",
      fullName: "Parent B",
      role: "parent",
    });
    const tokenB = resB.body.data.accessToken;

    // 3. Parent A creates Child A
    const childRes = await request(app)
      .post("/api/v1/children")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Omar",
        age: 6,
        diagnoses: ["autism"],
      });
    expect(childRes.status).toBe(201);
    const childAId = childRes.body.data._id;

    // 4. Parent A can view Child A
    const viewA = await request(app)
      .get(`/api/v1/children/${childAId}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(viewA.status).toBe(200);
    expect(viewA.body.data.name).toBe("Omar");

    // 5. Parent B tries to view Child A: MUST return 404 (NOT 403, preventing IDOR probe)
    const viewB = await request(app)
      .get(`/api/v1/children/${childAId}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(viewB.status).toBe(404);
    expect(viewB.body.success).toBe(false);

    // 6. Parent B's children list should be empty
    const listB = await request(app)
      .get("/api/v1/children")
      .set("Authorization", `Bearer ${tokenB}`);
    expect(listB.status).toBe(200);
    expect(listB.body.data.length).toBe(0);
  });
});

