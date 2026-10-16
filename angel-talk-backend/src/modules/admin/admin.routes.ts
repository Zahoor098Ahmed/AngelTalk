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
import { Shelf } from "../../models/Shelf";
import { UsageSummary } from "../../models/UsageSummary";
import { sendSuccess } from "../../common/response";
import { NotFoundError, ForbiddenError } from "../../common/errors";
import { fillTranslations, inBatches } from "../../common/translate";

/** The admin types English only: Arabic and Urdu are filled in automatically (typed ones are kept). */
type WordBody = { label?: string; translations?: Record<string, string> };
async function translateTemplateBody(body: { name?: string; words?: WordBody[]; nameTranslations?: Record<string, string> }) {
  if (Array.isArray(body.words)) {
    await inBatches(body.words, 8, async (w) => {
      if (w?.label) w.translations = await fillTranslations(w.label, w.translations);
    });
  }
  if (typeof body.name === "string" && body.name.trim()) {
    const last = body.name.split(" / ").pop() || body.name;
    body.nameTranslations = await fillTranslations(last, body.nameTranslations);
  }
}
async function translateVerbBody(body: { forms?: Record<string, { text?: string; translations?: Record<string, string> }> }) {
  const forms = body.forms ?? {};
  await Promise.all(
    Object.values(forms).map(async (f) => {
      if (f?.text) f.translations = await fillTranslations(f.text, f.translations);
    }),
  );
}

export const adminRouter = Router();

// Guard all admin routes: require role admin or superadmin
adminRouter.use(authenticate, requireRole("admin", "superadmin"));

// 1. Dashboard numbers, all computed from the real data the app sends
const DAY_MS = 24 * 60 * 60 * 1000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

adminRouter.get(
  "/admin/stats",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(todayStart.getTime() - 6 * DAY_MS);
      const monthAgo = new Date(todayStart.getTime() - 29 * DAY_MS);
      const appUsers = { role: { $nin: ["admin", "superadmin"] } };

      const [
        usersCount,
        childrenCount,
        totalVerbs,
        totalTemplates,
        totalWords,
        activeToday,
        wordsToday,
        meltdowns,
        roles,
        usersBefore,
        newUsers,
        topFromUsage,
      ] = await Promise.all([
        User.countDocuments(appUsers),
        Child.countDocuments({ deletedAt: null }),
        VerbGroup.countDocuments({ active: true }),
        SeedTemplate.countDocuments({ active: true }),
        Word.countDocuments({ deletedAt: null }),
        UsageSummary.countDocuments({ lastPlayedDate: { $gte: todayStart } }),
        UsageSummary.aggregate([
          { $match: { lastPlayedDate: { $gte: todayStart } } },
          { $group: { _id: null, total: { $sum: { $arrayElemAt: ["$wordsByDay", now.getDay()] } } } },
        ]),
        CareLog.find({ deletedAt: null, date: { $gte: weekAgo }, mood: { $in: ["frustrated", "overwhelmed"] } }).select("date"),
        User.aggregate([{ $match: appUsers }, { $group: { _id: "$role", count: { $sum: 1 } } }]),
        User.countDocuments({ ...appUsers, createdAt: { $lt: monthAgo } }),
        User.find({ ...appUsers, createdAt: { $gte: monthAgo } }).select("createdAt"),
        UsageSummary.aggregate([
          { $project: { words: { $objectToArray: "$wordTotals" } } },
          { $unwind: "$words" },
          { $group: { _id: "$words.k", count: { $sum: "$words.v" } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),
      ]);

      // users over the last 30 days (running total)
      const perDay = new Map<string, number>();
      newUsers.forEach((u) => {
        const k = dayKey(new Date(u.createdAt as Date));
        perDay.set(k, (perDay.get(k) ?? 0) + 1);
      });
      let running = usersBefore;
      const userGrowth = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(monthAgo.getTime() + i * DAY_MS);
        running += perDay.get(dayKey(d)) ?? 0;
        return { date: d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }), users: running };
      });

      // hard moments logged in the care journal, last 7 days
      const meltdownTrends = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekAgo.getTime() + i * DAY_MS);
        const k = dayKey(d);
        return { date: d.toLocaleDateString("en-US", { weekday: "short" }), count: meltdowns.filter((m) => dayKey(new Date(m.date)) === k).length };
      });

      let topWords = topFromUsage.map((w: { _id: string; count: number }) => ({ word: w._id, count: w.count }));
      if (topWords.length === 0) {
        topWords = (await Word.find({ deletedAt: null, useCount: { $gt: 0 } }).sort({ useCount: -1 }).limit(8).select("label useCount")).map((w) => ({
          word: w.label,
          count: w.useCount,
        }));
      }

      sendSuccess(res, {
        usersCount,
        childrenCount,
        activeTodayCount: activeToday,
        wordsSpokenToday: wordsToday[0]?.total ?? 0,
        meltdownsThisWeek: meltdowns.length,
        usersByRole: Object.fromEntries(roles.map((r: { _id: string; count: number }) => [r._id, r.count])),
        userGrowth,
        meltdownTrends,
        topWords,
        totalVerbs,
        totalTemplates,
        totalWords,
        // kept for older admin builds
        totalUsers: usersCount,
        totalChildren: childrenCount,
        totalShelves: totalTemplates,
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

// 5b. Delete a user account (their children are archived, sessions revoked)
adminRouter.delete(
  "/admin/users/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const target = await User.findById(req.params.id);
      if (!target) throw new NotFoundError("User not found");
      if (target._id === actor.id) throw new ForbiddenError("You cannot delete your own account");
      if (target.role === "superadmin") throw new ForbiddenError("A superadmin account cannot be deleted");
      const now = new Date();
      await Promise.all([
        Child.updateMany({ ownerId: target._id, deletedAt: null }, { deletedAt: now }),
        RefreshToken.updateMany({ userId: target._id }, { revokedAt: now }),
      ]);
      await User.deleteOne({ _id: target._id });
      await AuditLog.create({ actorId: actor.id, action: "admin.user.delete", targetType: "user", targetId: target._id, meta: { email: target.email } });
      sendSuccess(res, null, "User deleted");
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

      const ids = children.map((c) => c._id);
      const ownerIds = [...new Set(children.map((c) => c.ownerId))];
      const [owners, wordCounts, shelfCounts, usage] = await Promise.all([
        User.find({ _id: { $in: ownerIds } }).select("email fullName role"),
        Word.aggregate([{ $match: { childId: { $in: ids }, deletedAt: null } }, { $group: { _id: "$childId", count: { $sum: 1 } } }]),
        Shelf.aggregate([{ $match: { childId: { $in: ids }, deletedAt: null } }, { $group: { _id: "$childId", count: { $sum: 1 } } }]),
        UsageSummary.find({ childId: { $in: ids } }).select("childId wordsByDay sentencesSpoken lastPlayedDate"),
      ]);
      const ownerBy = new Map(owners.map((o) => [o._id, o]));
      const wordsBy = new Map(wordCounts.map((w: { _id: string; count: number }) => [w._id, w.count]));
      const shelvesBy = new Map(shelfCounts.map((w: { _id: string; count: number }) => [w._id, w.count]));
      const usageBy = new Map(usage.map((u) => [u.childId, u]));

      sendSuccess(res, {
        children: children.map((c) => {
          const o = ownerBy.get(c.ownerId);
          const u = usageBy.get(c._id);
          return {
            ...c.toJSON(),
            owner: o ? { _id: o._id, email: o.email, fullName: o.fullName, role: o.role } : null,
            boardWords: wordsBy.get(c._id) ?? 0,
            boardShelves: shelvesBy.get(c._id) ?? 0,
            usage: u
              ? { wordsThisWeek: (u.wordsByDay || []).reduce((a, b) => a + (b || 0), 0), sentencesSpoken: u.sentencesSpoken ?? 0, lastActive: u.lastPlayedDate ?? null }
              : null,
          };
        }),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  }
);

// 6b. A child's board as the app last sent it (folders with their words)
adminRouter.get(
  "/admin/children/:id/board",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const child = await Child.findOne({ _id: req.params.id, deletedAt: null }).select("name");
      if (!child) throw new NotFoundError("Child not found");
      const [shelves, words] = await Promise.all([
        Shelf.find({ childId: child._id, deletedAt: null }).sort({ order: 1 }).select("name icon color parentId order hidden"),
        Word.find({ childId: child._id, deletedAt: null }).sort({ order: 1 }).select("shelfId label phrase emoji imageUri hidden useCount verbFormTag isCustom"),
      ]);
      const wordsBy = new Map<string, unknown[]>();
      words.forEach((w) => {
        const list = wordsBy.get(w.shelfId) ?? [];
        list.push(w.toJSON());
        wordsBy.set(w.shelfId, list);
      });
      sendSuccess(res, {
        child: { _id: child._id, name: child.name },
        shelves: shelves.map((sh) => ({ ...sh.toJSON(), words: wordsBy.get(sh._id) ?? [] })),
      });
    } catch (err) {
      next(err);
    }
  }
);

// 7. Verb Library CRUD (Admin)
adminRouter.get(
  "/admin/verbs",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, await VerbGroup.find({ active: true }).sort({ base: 1 }));
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.post(
  "/admin/verbs",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await translateVerbBody(req.body);
      const verb = await VerbGroup.create({ ...req.body, source: "admin", active: true });
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
      await translateVerbBody(req.body);
      const verb = await VerbGroup.findByIdAndUpdate(req.params.id, { ...req.body, editedByAdmin: true }, { new: true, runValidators: true });
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
      const templates = await SeedTemplate.find({ active: true }).sort({ order: 1 });
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
      const body = req.body as { name?: string; seedName?: string };
      const seedName = body.seedName || `admin-${(body.name || "folder").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
      await translateTemplateBody(req.body);
      const template = await SeedTemplate.create({ ...req.body, seedName, source: "admin", active: true });
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
      await translateTemplateBody(req.body);
      const template = await SeedTemplate.findByIdAndUpdate(req.params.id, { ...req.body, editedByAdmin: true }, { new: true, runValidators: true });
      if (!template) throw new NotFoundError("Template not found");
      sendSuccess(res, template, "Seed template updated");
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.delete(
  "/admin/templates/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // hidden instead of erased, so "npm run seed:catalog" does not bring an app folder back
      const template = await SeedTemplate.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
      if (!template) throw new NotFoundError("Template not found");
      sendSuccess(res, null, "Template removed");
    } catch (err) {
      next(err);
    }
  }
);

// 8b. App content (read-only): the built-in data of the app, saved by "npm run seed:catalog"
adminRouter.get(
  "/admin/content",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const db = mongoose.connection.db!;
      const names = (await db.listCollections().toArray()).map((c) => c.name).filter((n) => n.startsWith("catalog_") && n !== "catalog_meta").sort();
      const counts = await Promise.all(names.map((n) => db.collection(n).countDocuments()));
      const meta = await db.collection("catalog_meta").findOne({});
      sendSuccess(res, {
        syncedAt: meta?.syncedAt ?? null,
        collections: names.map((n, i) => ({ name: n, count: counts[i] })),
      });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.get(
  "/admin/content/:collection",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const name = String(req.params.collection);
      if (!/^catalog_[a-z_]+$/.test(name) || name === "catalog_meta") throw new NotFoundError("Unknown content collection");
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Number(req.query.limit) || 50);
      const search = req.query.search ? String(req.query.search).trim() : "";
      const filter: Record<string, unknown> = {};
      if (search) {
        const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = ["_id", "word", "name", "en", "text", "key", "label", "after", "title"].map((f) => ({ [f]: rx }));
      }
      const col = mongoose.connection.db!.collection(name);
      const [items, total] = await Promise.all([
        col.find(filter, { projection: { contentHash: 0 } }).sort({ _id: 1 }).skip((page - 1) * limit).limit(limit).toArray(),
        col.countDocuments(filter),
      ]);
      sendSuccess(res, { items, total, page, totalPages: Math.ceil(total / limit) });
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

