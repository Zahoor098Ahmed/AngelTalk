import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, AuthenticatedRequest } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { Consent } from "../../models/Consent";
import { sendSuccess } from "../../common/response";
import { eventBus } from "../../common/events";

export const consentsRouter = Router();

const consentSchema = z.object({
  childId: z.string().optional(),
  consentType: z.enum(["data_processing", "face_biometrics", "slp_sharing"]),
  policyVersion: z.string().min(1),
  granted: z.boolean(),
});

consentsRouter.post(
  "/consents",
  authenticate,
  validate({ body: consentSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const { childId, consentType, policyVersion, granted } = req.body;
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      const consent = await Consent.create({
        userId: user.id,
        childId,
        consentType,
        policyVersion,
        granted,
        ip,
        userAgent,
        revokedAt: granted ? null : new Date(),
      });

      eventBus.publish("consent.changed", {
        userId: user.id,
        childId,
        consentType,
        granted,
      });

      sendSuccess(res, consent, "Consent record updated successfully", 201);
    } catch (err) {
      next(err);
    }
  }
);

consentsRouter.get(
  "/consents",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const records = await Consent.find({ userId: user.id }).sort({ createdAt: -1 });
      sendSuccess(res, records);
    } catch (err) {
      next(err);
    }
  }
);

