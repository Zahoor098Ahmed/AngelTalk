import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { assertBackupProof, encryptedBackups } from "./backups.service";
import { sendSuccess } from "../../common/response";
import { BadRequestError } from "../../common/errors";

const timeZone = z.string().min(1).max(100).refine(zone => { try { new Intl.DateTimeFormat("en", { timeZone: zone }); return true; } catch { return false; } }, "Invalid device time zone");
const envelope = z.object({
  version: z.literal(1), algorithm: z.literal("AES-256-GCM"),
  sealed: z.string().min(40).max(45 * 1024 * 1024).regex(/^[A-Za-z0-9+/]+={0,2}$/),
  createdAt: z.string().datetime(), timeZone, autoEnabled: z.boolean(),
}).strict();
export const backupsRouter = Router();
backupsRouter.use(rateLimit({ windowMs: 60000, max: 30, standardHeaders: true, legacyHeaders: false }));
backupsRouter.use("/:id", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  try { assertBackupProof(String(req.params.id), (req.headers.authorization || "").replace(/^Bearer /, "")); next(); } catch (error) { next(error); }
});
backupsRouter.put("/:id", async (req, res, next) => {
  try {
    const parsed = envelope.safeParse(req.body);
    if (!parsed.success || parsed.data.sealed.length % 4 !== 0) throw new BadRequestError("Invalid encrypted backup. Plaintext content is not accepted.");
    sendSuccess(res, await encryptedBackups.put(String(req.params.id), parsed.data));
  } catch (error) { next(error); }
});
backupsRouter.get("/:id", async (req, res, next) => {
  try { sendSuccess(res, await encryptedBackups.get(String(req.params.id))); } catch (error) { next(error); }
});
backupsRouter.get("/:id/status", async (req, res, next) => {
  try { sendSuccess(res, await encryptedBackups.status(String(req.params.id))); } catch (error) { next(error); }
});
backupsRouter.post("/:id/preferences", async (req, res, next) => {
  try {
    const parsed = z.object({ autoEnabled: z.boolean(), timeZone }).strict().safeParse(req.body);
    if (!parsed.success) throw new BadRequestError("Invalid backup preferences");
    sendSuccess(res, await encryptedBackups.preferences(String(req.params.id), parsed.data.autoEnabled, parsed.data.timeZone));
  } catch (error) { next(error); }
});
