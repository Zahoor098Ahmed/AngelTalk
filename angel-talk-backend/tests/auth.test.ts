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

describe("Auth Module Integration Tests", () => {
  const validUser = {
    email: "parent@test.com",
    password: "Password123!",
    fullName: "Ahmad Parent",
    role: "parent",
    pin: "1234",
  };

  it("should successfully register a new parent user", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it("should reject registration with duplicate email", async () => {
    await request(app).post("/api/v1/auth/register").send(validUser);

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("CONFLICT");
  });

  it("should reject invalid password format during registration", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "simple@test.com",
        password: "weak",
        fullName: "Test",
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it("should authenticate valid user on login", async () => {
    await request(app).post("/api/v1/auth/register").send(validUser);

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: validUser.email,
        password: validUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it("should reject login with wrong password", async () => {
    await request(app).post("/api/v1/auth/register").send(validUser);

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: validUser.email,
        password: "WrongPassword123!",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should rotate refresh token and revoke on reuse", async () => {
    const regRes = await request(app).post("/api/v1/auth/register").send(validUser);
    const initialRefresh = regRes.body.data.refreshToken;

    // First refresh: works and rotates
    const refRes1 = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: initialRefresh });

    expect(refRes1.status).toBe(200);
    expect(refRes1.body.data.accessToken).toBeDefined();
    expect(refRes1.body.data.refreshToken).toBeDefined();
    expect(refRes1.body.data.refreshToken).not.toBe(initialRefresh);

    // Reuse of previous revoked refresh token: triggers reuse detection & revokes all
    const reuseRes = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: initialRefresh });

    expect(reuseRes.status).toBe(401);
  });

  it("should verify PIN and return PIN token", async () => {
    const regRes = await request(app).post("/api/v1/auth/register").send(validUser);
    const token = regRes.body.data.accessToken;

    const pinRes = await request(app)
      .post("/api/v1/auth/verify-pin")
      .set("Authorization", `Bearer ${token}`)
      .send({ pin: "1234" });

    expect(pinRes.status).toBe(200);
    expect(pinRes.body.success).toBe(true);
    expect(pinRes.body.data.pinToken).toBeDefined();
  });

  it("should lock PIN after 5 consecutive failed attempts", async () => {
    const regRes = await request(app).post("/api/v1/auth/register").send(validUser);
    const token = regRes.body.data.accessToken;

    for (let i = 0; i < 4; i++) {
      const failRes = await request(app)
        .post("/api/v1/auth/verify-pin")
        .set("Authorization", `Bearer ${token}`)
        .send({ pin: "9999" });
      expect(failRes.status).toBe(401);
    }

    // 5th attempt locks the account
    const lockRes = await request(app)
      .post("/api/v1/auth/verify-pin")
      .set("Authorization", `Bearer ${token}`)
      .send({ pin: "9999" });

    expect(lockRes.status).toBe(423); // Locked
    expect(lockRes.body.code).toBe("PIN_LOCKED");
  });
});

