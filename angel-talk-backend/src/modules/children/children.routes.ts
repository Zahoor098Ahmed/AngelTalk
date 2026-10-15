import { Router, Request, Response, NextFunction } from "express";
import { ChildrenService } from "./children.service";
import { authenticate, AuthenticatedRequest, requirePin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createChildSchema, updateChildSchema, updateChildSettingsSchema } from "./children.schema";
import { sendSuccess } from "../../common/response";

export const childrenRouter = Router();

childrenRouter.get(
  "/children",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const children = await ChildrenService.listChildren(user);
      sendSuccess(res, children);
    } catch (err) {
      next(err);
    }
  }
);

childrenRouter.post(
  "/children",
  authenticate,
  validate({ body: createChildSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const child = await ChildrenService.createChild(user.id, req.body);
      sendSuccess(res, child, "Child profile created successfully", 201);
    } catch (err) {
      next(err);
    }
  }
);

childrenRouter.get(
  "/children/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const child = await ChildrenService.getChild(user, String(req.params.id));
      sendSuccess(res, child);
    } catch (err) {
      next(err);
    }
  }
);

childrenRouter.put(
  "/children/:id",
  authenticate,
  requirePin,
  validate({ body: updateChildSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const child = await ChildrenService.updateChild(user, String(req.params.id), req.body);
      sendSuccess(res, child, "Child profile updated successfully");
    } catch (err) {
      next(err);
    }
  }
);

childrenRouter.put(
  "/children/:id/settings",
  authenticate,
  validate({ body: updateChildSettingsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const child = await ChildrenService.updateSettings(user, String(req.params.id), req.body);
      sendSuccess(res, child, "Settings updated successfully");
    } catch (err) {
      next(err);
    }
  }
);

childrenRouter.delete(
  "/children/:id",
  authenticate,
  requirePin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      await ChildrenService.deleteChild(user, String(req.params.id));
      sendSuccess(res, null, "Child profile and all associated data deleted successfully");
    } catch (err) {
      next(err);
    }
  }
);

