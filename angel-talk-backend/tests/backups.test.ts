import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { createHash, randomBytes, createCipheriv } from "crypto";
import express from "express";
import request from "supertest";
import { localDay, nextLocalMidnight } from "../src/modules/backups/backup-time";
import { EncryptedBackupStore, encryptedBackups, assertBackupProof, type EncryptedBackup } from "../src/modules/backups/backups.service";
import { backupsRouter } from "../src/modules/backups/backups.routes";
import { errorHandler } from "../src/middleware/error-handler";

let directory: string, store: EncryptedBackupStore;
const proof = "a".repeat(64);
const id = createHash("sha256").update(proof).digest("hex");
function encrypted(label = "PRIVATE_CUSTOM_WORD"): EncryptedBackup {
  const nonce = randomBytes(12), cipher = createCipheriv("aes-256-gcm", randomBytes(32), nonce);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify({ label, category: "PRIVATE_CATEGORY" })), cipher.final()]);
  return { version: 1, algorithm: "AES-256-GCM", sealed: Buffer.concat([nonce, ciphertext, cipher.getAuthTag()]).toString("base64"), createdAt: "2026-11-16T12:00:00.000Z", timeZone: "Asia/Karachi", autoEnabled: true };
}
beforeEach(async () => { directory = await fs.mkdtemp(path.join(os.tmpdir(), "angeltalk-backup-test-")); store = new EncryptedBackupStore(directory); });
afterEach(async () => { store.stop(); jest.restoreAllMocks(); await fs.rm(directory, { recursive: true, force: true }); });

describe("Daily backups in the device time zone", () => {
  it.each([
    ["Asia/Karachi", "2026-11-16T18:59:59Z", "2026-11-16T19:00:00.000Z"],
    ["Asia/Riyadh", "2026-11-16T20:59:59Z", "2026-11-16T21:00:00.000Z"],
    ["Asia/Kathmandu", "2026-11-16T18:14:59Z", "2026-11-16T18:15:00.000Z"],
    ["America/New_York", "2026-03-08T05:00:00Z", "2026-03-09T04:00:00.000Z"],
    ["America/New_York", "2026-11-01T04:00:00Z", "2026-11-02T05:00:00.000Z"],
    ["Australia/Sydney", "2026-10-03T14:00:00Z", "2026-10-04T13:00:00.000Z"],
  ])("schedules midnight correctly in %s at %s", (zone, now, expected) => {
    expect(nextLocalMidnight(new Date(now), zone).toISOString()).toBe(expected);
  });
  it("creates the completed day's encrypted copy without requiring the phone app to run", async () => {
    const original = encrypted();
    await store.put(id, original, new Date("2026-11-16T12:00:00Z"));
    await store.archiveDue(id, new Date("2026-11-16T18:59:59Z"));
    expect((await store.status(id)).lastDailyBackup).toBeUndefined();
    const changed = encrypted("NEW_DAY_WORD");
    await store.put(id, changed, new Date("2026-11-16T19:00:01Z"));
    const daily = JSON.parse(await fs.readFile(path.join(directory, id, "daily", "2026-11-16.json"), "utf8"));
    expect(daily.sealed).toBe(original.sealed);
    expect((await store.get(id)).sealed).toBe(changed.sealed);
    expect((await store.status(id)).nextBackupAt).toBe("2026-11-17T19:00:00.000Z");
  });
  it("survives a backend restart, catches up missed midnights and retains 30 days", async () => {
    await store.put(id, encrypted(), new Date("2026-09-01T12:00:00Z"));
    const restarted = new EncryptedBackupStore(directory);
    await restarted.archiveDue(id, new Date("2026-11-16T20:00:00Z"));
    expect((await restarted.get(id)).sealed).toBeTruthy();
    const days = (await fs.readdir(path.join(directory, id, "daily"))).sort();
    expect(days.length).toBeLessThanOrEqual(30);
    expect(days[days.length - 1]).toBe("2026-11-16.json");
  });
  it("honors disabled automatic backups", async () => {
    await store.put(id, { ...encrypted(), autoEnabled: false }, new Date("2026-11-16T12:00:00Z"));
    await store.archiveDue(id, new Date("2026-11-20T20:00:00Z"));
    expect((await store.status(id)).lastDailyBackup).toBeUndefined();
  });
});

describe("Private recovery-code storage", () => {
  it("keeps only ciphertext on disk and can recover it independently of MongoDB", async () => {
    const backup = encrypted(); await store.put(id, backup);
    const saved = await fs.readFile(path.join(directory, id, "latest.json"), "utf8");
    expect(saved).not.toContain("PRIVATE_CUSTOM_WORD"); expect(saved).not.toContain("PRIVATE_CATEGORY");
    expect(saved).not.toContain(proof);
    const reinstalledServer = new EncryptedBackupStore(directory);
    expect(await reinstalledServer.get(id)).toEqual(backup);
  });
  it("rejects wrong recovery proof and unsafe identifiers", () => {
    expect(() => assertBackupProof(id, proof)).not.toThrow();
    expect(() => assertBackupProof(id, "b".repeat(64))).toThrow();
    expect(() => assertBackupProof("../outside", proof)).toThrow();
  });
  it("allows encrypted upload/download with recovery proof, but rejects plaintext and another vault's proof", async () => {
    jest.spyOn(encryptedBackups, "put").mockImplementation((...args) => store.put(...args));
    jest.spyOn(encryptedBackups, "get").mockImplementation((...args) => store.get(...args));
    jest.spyOn(encryptedBackups, "status").mockImplementation((...args) => store.status(...args));
    const app = express(); app.use(express.json()); app.use("/backups", backupsRouter); app.use(errorHandler);
    const auth = `Bearer ${proof}`, envelope = encrypted();
    expect((await request(app).put(`/backups/${id}`).set("Authorization", auth).send(envelope)).status).toBe(200);
    const downloaded = await request(app).get(`/backups/${id}`).set("Authorization", auth);
    expect(downloaded.status).toBe(200); expect(downloaded.body.data.sealed).toBe(envelope.sealed);
    expect(downloaded.headers["cache-control"]).toBe("no-store");
    expect((await request(app).get(`/backups/${id}`).set("Authorization", `Bearer ${"b".repeat(64)}`)).status).toBe(403);
    expect((await request(app).put(`/backups/${id}`).set("Authorization", auth).send({ ...envelope, words: ["UNENCRYPTED"] })).status).toBe(400);
    expect((await request(app).put(`/backups/${id}`).set("Authorization", auth).send({ ...envelope, timeZone: "Invalid/Timezone" })).status).toBe(400);
  });
});
