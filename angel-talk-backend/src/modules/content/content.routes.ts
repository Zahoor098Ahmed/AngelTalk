import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth";
import { SeedTemplate } from "../../models/SeedTemplate";
import { VerbGroup } from "../../models/VerbGroup";
import { sendSuccess } from "../../common/response";

/**
 * What the admin panel changed since the app last asked: board templates (folders + words) and verbs.
 * The app merges these into its own board, so words and verbs added in the admin panel reach every device.
 */
export const contentRouter = Router();

contentRouter.get(
  "/content/updates",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const syncedAt = new Date().toISOString(); // taken before reading, so nothing in between is missed
      const sinceRaw = req.query.since ? new Date(String(req.query.since)) : null;
      const since = sinceRaw && !isNaN(sinceRaw.getTime()) ? sinceRaw : null;
      const changed = since ? { updatedAt: { $gt: since } } : {};

      const [templates, verbs] = await Promise.all([
        SeedTemplate.find(changed).select("name seedName icon color words active source order updatedAt").sort({ order: 1 }),
        VerbGroup.find(changed).select("base emoji forms active source updatedAt").sort({ base: 1 }),
      ]);
      sendSuccess(res, { syncedAt, templates, verbs });
    } catch (err) {
      next(err);
    }
  }
);
