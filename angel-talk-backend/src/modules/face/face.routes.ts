import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, AuthenticatedRequest, requirePin, assertChildAccess } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { Child } from "../../models/Child";
import { FaceEmbedding } from "../../models/FaceEmbedding";
import { AuditLog } from "../../models/AuditLog";
import { env } from "../../config/env";
import { sendSuccess } from "../../common/response";

export const faceRouter = Router();

const enrollSchema = z.object({
  vectors: z
    .array(
      z
        .array(z.number())
        .length(128, "Each embedding must be exactly 128 numbers")
        .refine((arr) => arr.every((n) => typeof n === "number" && Number.isFinite(n)), {
          message: "All 128 vector values must be finite numbers",
        })
    )
    .min(3, "At least 3 face frames required for reliable enrollment")
    .max(5, "At most 5 face frames accepted"),
  consentGiven: z.literal(true, {
    errorMap: () => ({ message: "Explicit parental biometric consent is strictly required" }),
  }),
});

const identifySchema = z.object({
  vector: z
    .array(z.number())
    .length(128, "Query embedding must be exactly 128 numbers")
    .refine((arr) => arr.every((n) => typeof n === "number" && Number.isFinite(n)), {
      message: "Vector values must be finite numbers",
    }),
});

// Euclidean distance calculation: sqrt(sum((a_i - b_i)^2))
function euclideanDistance(v1: number[], v2: number[]): number {
  let sum = 0;
  for (let i = 0; i < 128; i++) {
    const diff = v1[i] - v2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// 1. Enroll child face vectors (Requires PIN + Guardian consent)
faceRouter.post(
  "/children/:id/face-enroll",
  authenticate,
  requirePin,
  validate({ body: enrollSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const child = await assertChildAccess(user, String(req.params.id));

      const now = new Date();
      child.face = {
        consent: true,
        consentAt: now,
        version: 1,
        enrolledAt: now,
      };
      child.clientUpdatedAt = now;
      await child.save();

      // Only store vectors in server DB if FACE_SERVER_TEMPLATES=true (default false for sovereign builds)
      if (env.FACE_SERVER_TEMPLATES) {
        // Delete any old vectors
        await FaceEmbedding.deleteMany({ childId: child._id });
        const docs = req.body.vectors.map((vec: number[]) => ({
          ownerId: child.ownerId,
          childId: child._id,
          vector: vec,
          isEnrolment: true,
        }));
        await FaceEmbedding.insertMany(docs);
      }

      await AuditLog.create({
        actorId: user.id,
        action: "face.enrolled",
        targetType: "face",
        targetId: child._id,
        meta: { frameCount: req.body.vectors.length, storedOnServer: env.FACE_SERVER_TEMPLATES },
      });

      sendSuccess(res, { enrolled: true, enrolledAt: now }, "Face AI enrollment completed successfully");
    } catch (err) {
      next(err);
    }
  }
);

// 2. Delete face biometric data (Permanently erases vectors & revokes consent)
faceRouter.delete(
  "/children/:id/face",
  authenticate,
  requirePin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const child = await assertChildAccess(user, String(req.params.id));

      child.face = {
        consent: false,
        consentAt: null,
        version: 1,
        enrolledAt: null,
      };
      child.clientUpdatedAt = new Date();
      await child.save();

      // Permanently remove all stored vectors
      await FaceEmbedding.deleteMany({ childId: child._id });

      await AuditLog.create({
        actorId: user.id,
        action: "face.deleted",
        targetType: "face",
        targetId: child._id,
        meta: {},
      });

      sendSuccess(res, null, "Biometric face data permanently erased");
    } catch (err) {
      next(err);
    }
  }
);

// 3. Identify child by face vector (Searches ONLY the logged-in account's consented children)
faceRouter.post(
  "/children/face-identify",
  authenticate,
  validate({ body: identifySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const queryVector: number[] = req.body.vector;

      // Find children belonging to this user who have consented face enrollment
      const consentedChildren = await Child.find({
        ownerId: user.id,
        deletedAt: null,
        "face.consent": true,
      });

      if (consentedChildren.length === 0) {
        sendSuccess(res, { matched: false, reason: "No enrolled children with face consent on this account" });
        return;
      }

      if (!env.FACE_SERVER_TEMPLATES) {
        // In government sovereign mode, matching is executed strictly on-device in SQLite.
        sendSuccess(res, {
          matched: false,
          serverMode: "on-device-only",
          message: "Face recognition is configured for client-side matching only in sovereign government mode.",
        });
        return;
      }

      const childIds = consentedChildren.map((c) => c._id);
      const embeddings = await FaceEmbedding.find({ childId: { $in: childIds } }).select("+vector");

      if (embeddings.length === 0) {
        sendSuccess(res, { matched: false, reason: "No face vectors enrolled on server" });
        return;
      }

      let bestMatch: { childId: string; distance: number } | null = null;

      for (const emb of embeddings) {
        const dist = euclideanDistance(queryVector, emb.vector);
        if (!bestMatch || dist < bestMatch.distance) {
          bestMatch = { childId: emb.childId, distance: dist };
        }
      }

      const MATCH_THRESHOLD = 0.5;
      if (bestMatch && bestMatch.distance < MATCH_THRESHOLD) {
        const matchedChild = consentedChildren.find((c) => c._id === bestMatch!.childId);
        sendSuccess(res, {
          matched: true,
          childId: matchedChild?._id,
          name: matchedChild?.name,
          distance: Number(bestMatch.distance.toFixed(4)),
        });
      } else {
        sendSuccess(res, {
          matched: false,
          distance: bestMatch ? Number(bestMatch.distance.toFixed(4)) : null,
          threshold: MATCH_THRESHOLD,
        });
      }
    } catch (err) {
      next(err);
    }
  }
);

