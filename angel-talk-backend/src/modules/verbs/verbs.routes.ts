import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth";
import { VerbGroup, IVerbGroup } from "../../models/VerbGroup";
import { sendSuccess } from "../../common/response";
import { LRUCache } from "lru-cache";

export const verbsRouter = Router();

// Cache verb list in memory for 10 minutes (rarely changes)
const verbCache = new LRUCache<string, IVerbGroup[]>({
  max: 10,
  ttl: 10 * 60 * 1000,
});

verbsRouter.get(
  "/verbs",
  authenticate,
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cached = verbCache.get("all_verbs");
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        sendSuccess(res, cached);
        return;
      }

      const verbs = await VerbGroup.find({ active: true }).sort({ base: 1 });
      verbCache.set("all_verbs", verbs);
      res.setHeader("X-Cache", "MISS");
      sendSuccess(res, verbs);
    } catch (err) {
      next(err);
    }
  }
);

