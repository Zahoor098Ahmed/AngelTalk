import { Router, Request, Response, NextFunction } from "express";
import { SyncService } from "./sync.service";
import { authenticate, AuthenticatedRequest } from "../../middleware/auth";
import { sendSuccess } from "../../common/response";

export const syncRouter = Router();

syncRouter.get(
  "/sync/pull",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const since = req.query.since ? String(req.query.since) : undefined;
      const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

      const pullResult = await SyncService.pull(user, since, cursor);
      sendSuccess(res, pullResult);
    } catch (err) {
      next(err);
    }
  }
);

syncRouter.post(
  "/sync/push",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const mutations = req.body?.mutations || req.body;
      const pushResult = await SyncService.push(user, mutations);
      sendSuccess(res, pushResult);
    } catch (err) {
      next(err);
    }
  }
);

