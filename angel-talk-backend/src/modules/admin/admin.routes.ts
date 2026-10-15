import { Router, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { authenticate, AuthenticatedRequest, requireRole } from "../../middleware/auth";
import { User } from "../../models/User";
import { Child } from "../../models/Child";
import { VerbGroup } from "../../models/VerbGroup";
import { SeedTemplate } from "../../models/SeedTemplate";
import { AuditLog } from "../../models/AuditLog";
import { CareLog } from "../../models/CareLog";
import { Word } from "../../models/Word";
import { RefreshToken } from "../../models/RefreshToken";
import { sendSuccess } from "../../common/response";
import { NotFoundError, ForbiddenError } from "../../common/errors";

export const adminRouter = Router();

// Guard all admin routes: require role admin or superadmin
adminRouter.use(authenticate, requireRole("admin", "superadmin"));

// 1. System & Business Stats
adminRouter.get(
  "/admin/stats",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [totalUsers, totalChildren, totalVerbs, totalShelves] = await Promise.all([
        User.countDocuments(),
        Child.countDocuments({ deletedAt: null }),
        VerbGroup.countDocuments({ active: true }),
        SeedTemplate.countDocuments({ active: true }),
      ]);

      sendSuccess(res, {
        totalUsers,
        totalChildren,
        totalVerbs,
        totalShelves,
      });
    } catch (err) {
      next(err);
    }
  }
);

// 2. Users Management (Server-side paginated, search, filters)
adminRouter.get(
  "/admin/users",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Number(req.query.limit) || 20);
      const search = req.query.search ? String(req.query.search).trim() : "";
      const role = req.query.role ? String(req.query.role) : "";
      const status = req.query.status ? String(req.query.status) : "";

      const filter: Record<string, unknown> = {};
      if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.$or = [{ email: new RegExp(escaped, "i") }, { fullName: new RegExp(escaped, "i") }];
      }
      if (role) filter.role = role;
      if (status) filter.status = status;

      const [users, total] = await Promise.all([
        User.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        User.countDocuments(filter),
      ]);

      sendSuccess(res, {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  }
);

// 3. User Status Change (Activate / Suspend)
adminRouter.patch(
  "/admin/users/:id/status",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetUser = await User.findById(req.params.id);
      if (!targetUser) throw new NotFoundError("User not found");

      targetUser.status = req.body.status;
      if (req.body.status === "suspended") {
        targetUser.tokenVersion += 1; // instantly kill active sessions
        await RefreshToken.updateMany({ userId: targetUser._id }, { revokedAt: new Date() });
      }
      await targetUser.save();

      sendSuccess(res, targetUser, `User ${targetUser.status} successfully`);
    } catch (err) {
      next(err);
    }
  }
);

// 4. Role Change (Superadmin only)
adminRouter.patch(
  "/admin/users/:id/role",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      if (actor.role !== "superadmin") {
        throw new ForbiddenError("Only superadmin can change user roles");
      }

      const targetUser = await User.findById(req.params.id);
      if (!targetUser) throw new NotFoundError("User not found");

      targetUser.role = req.body.role;
      targetUser.tokenVersion += 1;
      await targetUser.save();

      sendSuccess(res, targetUser, "User role updated");
    } catch (err) {
      next(err);
    }
  }
);

// 5. Revoke User Sessions
adminRouter.post(
  "/admin/users/:id/revoke-sessions",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await User.updateOne({ _id: req.params.id }, { $inc: { tokenVersion: 1 } });
      await RefreshToken.updateMany({ userId: req.params.id }, { revokedAt: new Date() });
      sendSuccess(res, null, "All sessions revoked for this user");
    } catch (err) {
      next(err);
    }
  }
);

// 6. Children Overview (Read-only, NO clinical notes, NO face vectors!)
adminRouter.get(
  "/admin/children",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Number(req.query.limit) || 20);

      const [children, total] = await Promise.all([
        Child.find({ deletedAt: null })
          .select("-faceDescriptors") // Never leak biometrics
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Child.countDocuments({ deletedAt: null }),
      ]);

      sendSuccess(res, {
        children,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  }
);

// 7. Verb Library CRUD (Admin)
adminRouter.post(
  "/admin/verbs",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const verb = await VerbGroup.create(req.body);
      sendSuccess(res, verb, "Verb group added", 201);
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.put(
  "/admin/verbs/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const verb = await VerbGroup.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!verb) throw new NotFoundError("Verb group not found");
      sendSuccess(res, verb, "Verb group updated");
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.delete(
  "/admin/verbs/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await VerbGroup.findByIdAndUpdate(req.params.id, { active: false });
      sendSuccess(res, null, "Verb group deactivated");
    } catch (err) {
      next(err);
    }
  }
);

// 8. Seed Templates CRUD
adminRouter.get(
  "/admin/templates",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const templates = await SeedTemplate.find().sort({ order: 1 });
      sendSuccess(res, templates);
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.post(
  "/admin/templates",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const template = await SeedTemplate.create(req.body);
      sendSuccess(res, template, "Seed template created", 201);
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.put(
  "/admin/templates/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const template = await SeedTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!template) throw new NotFoundError("Template not found");
      sendSuccess(res, template, "Seed template updated");
    } catch (err) {
      next(err);
    }
  }
);

// 9. Anonymized Aggregate Analytics
adminRouter.get(
  "/admin/analytics",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [langDistribution, diagnosisDistribution, topWords, meltdownsPerDay] = await Promise.all([
        Child.aggregate([
          { $match: { deletedAt: null } },
          { $group: { _id: "$settings.language", count: { $sum: 1 } } },
        ]),
        Child.aggregate([
          { $match: { deletedAt: null } },
          { $unwind: "$diagnoses" },
          { $group: { _id: "$diagnoses", count: { $sum: 1 } } },
        ]),
        Word.find({ deletedAt: null })
          .sort({ useCount: -1 })
          .limit(10)
          .select("label useCount emoji"),
        CareLog.aggregate([
          { $match: { deletedAt: null } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
              totalMeltdowns: { $sum: 1 },
              avgDuration: { $avg: "$meltdownDurationMin" },
            },
          },
          { $sort: { _id: -1 } },
          { $limit: 14 },
        ]),
      ]);

      sendSuccess(res, {
        langDistribution,
        diagnosisDistribution,
        topWords,
        meltdownsPerDay,
      });
    } catch (err) {
      next(err);
    }
  }
);

// 10. Audit Logs
adminRouter.get(
  "/admin/audit-logs",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Number(req.query.limit) || 20);
      const action = req.query.action ? String(req.query.action) : undefined;

      const filter: Record<string, unknown> = {};
      if (action) filter.action = action;

      const [logs, total] = await Promise.all([
        AuditLog.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        AuditLog.countDocuments(filter),
      ]);

      sendSuccess(res, {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  }
);

// 11. System Health & Readiness
adminRouter.get(
  "/admin/health",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
      sendSuccess(res, {
        status: "ok",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: dbStatus,
        version: "1.0.0",
      });
    } catch (err) {
      next(err);
    }
  }
);

