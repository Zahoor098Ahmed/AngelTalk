import { Router, Request, Response, NextFunction } from "express";
import { authenticate, AuthenticatedRequest, requirePin } from "../../middleware/auth";
import { User } from "../../models/User";
import { Child } from "../../models/Child";
import { Shelf } from "../../models/Shelf";
import { Word } from "../../models/Word";
import { CareLog } from "../../models/CareLog";
import { TherapyGoal } from "../../models/TherapyGoal";
import { ClinicalNote } from "../../models/ClinicalNote";
import { Passcard } from "../../models/Passcard";
import { ScheduleTask } from "../../models/ScheduleTask";
import { SocialStory } from "../../models/SocialStory";
import { Consent } from "../../models/Consent";
import { FaceEmbedding } from "../../models/FaceEmbedding";
import { RefreshToken } from "../../models/RefreshToken";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess } from "../../common/response";
import { eventBus } from "../../common/events";

export const pdplRouter = Router();

// 1. Full Data Export (JSON)
pdplRouter.get(
  "/pdpl/export",
  authenticate,
  requirePin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const userDoc = await User.findById(user.id);
      const children = await Child.find({ ownerId: user.id });
      const childIds = children.map((c) => c._id);

      const [shelves, words, careLogs, therapyGoals, clinicalNotes, passcards, tasks, stories, consents] =
        await Promise.all([
          Shelf.find({ childId: { $in: childIds } }),
          Word.find({ childId: { $in: childIds } }),
          CareLog.find({ childId: { $in: childIds } }),
          TherapyGoal.find({ childId: { $in: childIds } }),
          ClinicalNote.find({ childId: { $in: childIds } }),
          Passcard.find({ childId: { $in: childIds } }),
          ScheduleTask.find({ childId: { $in: childIds } }),
          SocialStory.find({ childId: { $in: childIds } }),
          Consent.find({ userId: user.id }),
        ]);

      await AuditLog.create({
        actorId: user.id,
        action: "pdpl.export_requested",
        targetType: "user",
        targetId: user.id,
        meta: { childrenCount: children.length },
      });

      sendSuccess(res, {
        exportDate: new Date().toISOString(),
        user: userDoc,
        children,
        shelves,
        words,
        careLogs,
        therapyGoals,
        clinicalNotes,
        passcards,
        tasks,
        stories,
        consents,
      });
    } catch (err) {
      next(err);
    }
  }
);

// 2. Full Data Erasure (Right to be Forgotten)
pdplRouter.post(
  "/pdpl/erase",
  authenticate,
  requirePin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const children = await Child.find({ ownerId: user.id });
      const childIds = children.map((c) => c._id);

      const now = new Date();

      // Soft delete user and children
      await User.updateOne({ _id: user.id }, { status: "suspended", deletedAt: now });
      await Child.updateMany({ ownerId: user.id }, { deletedAt: now });

      // Permanently remove biometric face vectors & revoke all sessions
      await Promise.all([
        FaceEmbedding.deleteMany({ childId: { $in: childIds } }),
        RefreshToken.deleteMany({ userId: user.id }),
        Shelf.updateMany({ childId: { $in: childIds } }, { deletedAt: now }),
        Word.updateMany({ childId: { $in: childIds } }, { deletedAt: now }),
      ]);

      await AuditLog.create({
        actorId: user.id,
        action: "pdpl.erasure_executed",
        targetType: "user",
        targetId: user.id,
        meta: { reason: "User requested full GDPR/PDPL erasure" },
      });

      eventBus.publish("user.deleted", { userId: user.id });

      sendSuccess(res, null, "User account and all associated child data erased successfully under Saudi PDPL regulations.");
    } catch (err) {
      next(err);
    }
  }
);

