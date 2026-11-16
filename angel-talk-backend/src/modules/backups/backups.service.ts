import { createHash, randomUUID, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { env } from "../../config/env";
import { ForbiddenError, NotFoundError } from "../../common/errors";
import { localDay, nextLocalMidnight } from "./backup-time";

export interface EncryptedBackup {
  version: 1;
  algorithm: "AES-256-GCM";
  sealed: string;
  createdAt: string;
  timeZone: string;
  autoEnabled: boolean;
}
interface Metadata {
  timeZone: string;
  autoEnabled: boolean;
  uploadedAt: string;
  nextBackupAt: string;
  lastDailyBackup?: string;
}
export function assertBackupProof(id: string, proof: string): void {
  if (!/^[a-f0-9]{64}$/.test(id) || !/^[a-f0-9]{64}$/.test(proof)) throw new ForbiddenError("Invalid recovery credentials");
  const actual = createHash("sha256").update(proof).digest();
  if (!timingSafeEqual(actual, Buffer.from(id, "hex"))) throw new ForbiddenError("Invalid recovery credentials");
}

/** Stores only authenticated ciphertext and scheduling metadata, outside MongoDB. */
export class EncryptedBackupStore {
  private pending = new Map<string, Promise<unknown>>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private started = false;
  constructor(private root = path.resolve(env.BACKUP_STORAGE_DIR)) {}
  private directory(id: string) {
    if (!/^[a-f0-9]{64}$/.test(id)) throw new ForbiddenError("Invalid backup identifier");
    return path.join(this.root, id);
  }
  private async lock<T>(id: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.pending.get(id) || Promise.resolve();
    const current = previous.catch(() => {}).then(operation);
    this.pending.set(id, current);
    try { return await current; } finally { if (this.pending.get(id) === current) this.pending.delete(id); }
  }
  private async atomic(file: string, value: string): Promise<void> {
    await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    const temp = `${file}.${randomUUID()}.tmp`;
    try { await fs.writeFile(temp, value, { mode: 0o600 }); await fs.rename(temp, file); }
    finally { await fs.unlink(temp).catch(() => {}); }
  }
  private async metadata(id: string): Promise<Metadata | null> {
    try { return JSON.parse(await fs.readFile(path.join(this.directory(id), "metadata.json"), "utf8")); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
  }
  private arm(id: string, metadata: Metadata): void {
    const old = this.timers.get(id); if (old) clearTimeout(old);
    this.timers.delete(id);
    if (!this.started || !metadata.autoEnabled) return;
    const delay = Math.min(2147483647, Math.max(50, new Date(metadata.nextBackupAt).getTime() - Date.now()));
    const fire = () => {
      this.archiveDue(id).catch(error => {
        console.warn("Daily encrypted backup deferred:", error.message);
        if (this.started) { const retry = setTimeout(fire, 60000); retry.unref(); this.timers.set(id, retry); }
      });
    };
    const timer = setTimeout(fire, delay);
    timer.unref(); this.timers.set(id, timer);
  }
  private async archiveUnlocked(id: string, now: Date): Promise<Metadata | null> {
    const meta = await this.metadata(id);
    if (!meta || !meta.autoEnabled) return meta;
    const directory = this.directory(id);
    let due = new Date(meta.nextBackupAt);
    if (due.getTime() <= now.getTime()) {
      const encrypted = await fs.readFile(path.join(directory, "latest.json"), "utf8");
      // A restart can catch up missed midnights; keep the most recent 30 daily restore points.
      if (now.getTime() - due.getTime() > 30 * 86400000) due = nextLocalMidnight(new Date(now.getTime() - 30 * 86400000), meta.timeZone);
      let count = 0;
      while (due.getTime() <= now.getTime() && count++ < 31) {
        const date = localDay(new Date(due.getTime() - 1), meta.timeZone);
        await this.atomic(path.join(directory, "daily", `${date}.json`), encrypted);
        meta.lastDailyBackup = date;
        due = nextLocalMidnight(new Date(due.getTime() + 1), meta.timeZone);
      }
      if (due.getTime() <= now.getTime()) due = nextLocalMidnight(now, meta.timeZone);
      meta.nextBackupAt = due.toISOString();
      await this.atomic(path.join(directory, "metadata.json"), JSON.stringify(meta));
      const days = (await fs.readdir(path.join(directory, "daily"))).filter(name => /^\d{4}-\d{2}-\d{2}\.json$/.test(name)).sort();
      for (const name of days.slice(0, Math.max(0, days.length - 30))) await fs.unlink(path.join(directory, "daily", name));
    }
    return meta;
  }
  async put(id: string, encrypted: EncryptedBackup, now = new Date()): Promise<Metadata> {
    return this.lock(id, async () => {
      const previous = await this.archiveUnlocked(id, now);
      // Capture the old day's latest upload before replacing it with a new day's changes.
      await this.atomic(path.join(this.directory(id), "latest.json"), JSON.stringify(encrypted));
      const meta: Metadata = {
        timeZone: encrypted.timeZone, autoEnabled: encrypted.autoEnabled, uploadedAt: now.toISOString(),
        nextBackupAt: previous?.timeZone === encrypted.timeZone && previous.autoEnabled
          ? previous.nextBackupAt : nextLocalMidnight(now, encrypted.timeZone).toISOString(),
        lastDailyBackup: previous?.lastDailyBackup,
      };
      await this.atomic(path.join(this.directory(id), "metadata.json"), JSON.stringify(meta));
      this.arm(id, meta); return meta;
    });
  }
  async get(id: string): Promise<EncryptedBackup> {
    await this.pending.get(id)?.catch(() => {});
    try { return JSON.parse(await fs.readFile(path.join(this.directory(id), "latest.json"), "utf8")); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new NotFoundError("No backup was found for this recovery code"); throw error; }
  }
  async status(id: string): Promise<Metadata> {
    await this.pending.get(id)?.catch(() => {});
    const meta = await this.metadata(id);
    if (!meta) throw new NotFoundError("No backup was found for this recovery code");
    return meta;
  }
  async preferences(id: string, autoEnabled: boolean, timeZone: string): Promise<Metadata> {
    return this.lock(id, async () => {
      const meta = await this.archiveUnlocked(id, new Date());
      if (!meta) throw new NotFoundError("No backup was found for this recovery code");
      meta.autoEnabled = autoEnabled; meta.timeZone = timeZone;
      meta.nextBackupAt = nextLocalMidnight(new Date(), timeZone).toISOString();
      await this.atomic(path.join(this.directory(id), "metadata.json"), JSON.stringify(meta));
      this.arm(id, meta); return meta;
    });
  }
  async archiveDue(id: string, now = new Date()): Promise<void> {
    await this.lock(id, async () => { const meta = await this.archiveUnlocked(id, now); if (meta) this.arm(id, meta); });
  }
  async start(): Promise<void> {
    if (this.started) return; this.started = true;
    await fs.mkdir(this.root, { recursive: true, mode: 0o700 });
    for (const id of await fs.readdir(this.root)) {
      if (/^[a-f0-9]{64}$/.test(id)) await this.archiveDue(id).catch(error => console.warn("Encrypted backup scheduling deferred:", error.message));
    }
  }
  stop(): void { for (const timer of this.timers.values()) clearTimeout(timer); this.timers.clear(); this.started = false; }
}
export const encryptedBackups = new EncryptedBackupStore();
