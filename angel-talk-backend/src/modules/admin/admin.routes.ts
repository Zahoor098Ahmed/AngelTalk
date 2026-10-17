import { Router, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { authenticate, AuthenticatedRequest, forgetCachedAccount, requireRole } from "../../middleware/auth";
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
import { isCatalogReady, onRealDatabase, refreshLive, searchCatalog, searchEverything, searchUsers } from "../search/searchIndex";

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

// The heavy read-only pages are answered from memory and refreshed in the background, so the admin
// panel does not wait on a slow database connection. They are filled when the database connects and
// also kept on disk, so after a restart the panel opens at once even before the database answers.
const RESPONSE_TTL_MS = 30000;
type CacheEntry = { at: number; data: unknown; host: string };
const responseCache = new Map<string, CacheEntry>();
const CACHE_FILE = path.resolve(__dirname, "../../../.cache/admin-cache.json");
const dbHost = () => mongoose.connection.host || "";

try {
  const saved = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")) as Record<string, CacheEntry>;
  for (const [key, entry] of Object.entries(saved)) responseCache.set(key, { ...entry, at: 0 }); // stale: refreshed on first use
} catch {
  /* no saved answers yet */
}
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function saveCacheSoon() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
      fs.writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(responseCache)));
    } catch {
      /* the disk copy is only a convenience */
    }
  }, 2000);
}
const computing = new Map<string, Promise<unknown>>();
const computers = new Map<string, () => Promise<unknown>>();
let generation = 0; // bumps when the database connection changes

function refresh<T>(key: string): Promise<T> {
  let job = computing.get(key);
  if (!job) {
    const compute = computers.get(key);
    if (!compute) return Promise.reject(new Error(`nothing to compute for ${key}`));
    // the temporary local database used while the server connects is answered but never remembered
    if (!onRealDatabase()) return compute() as Promise<T>;
    const gen = generation;
    const host = dbHost();
    job = compute()
      .then((data) => {
        if (gen === generation) {
          responseCache.set(key, { at: Date.now(), data, host });
          saveCacheSoon();
        }
        return data;
      })
      .finally(() => {
        if (computing.get(key) === job) computing.delete(key);
      });
    computing.set(key, job);
  }
  return job as Promise<T>;
}

async function cached<T>(key: string, compute: () => Promise<T>): Promise<T> {
  computers.set(key, compute);
  const hit = responseCache.get(key);
  if (hit && (hit.host === dbHost() || !onRealDatabase())) {
    if (Date.now() - hit.at > RESPONSE_TTL_MS) refresh(key).catch(() => {});
    return hit.data as T;
  }
  return refresh<T>(key);
}

/** Put a saved verb / template straight into the remembered list, so the page shows it at once. */
function patchCachedList(key: string, doc: { _id: unknown } | null, removeId?: unknown) {
  const hit = responseCache.get(key);
  if (!hit || !Array.isArray(hit.data)) return;
  const list = hit.data as { _id: unknown }[];
  const id = String(removeId ?? doc?._id);
  const at = list.findIndex((d) => String(d._id) === id);
  const next = [...list];
  if (removeId !== undefined || !doc) {
    if (at >= 0) next.splice(at, 1);
  } else if (at >= 0) next[at] = doc;
  else next.push(doc);
  responseCache.set(key, { ...hit, data: next });
  saveCacheSoon();
}

// after any change made in the admin panel, refresh the remembered answers in the background
adminRouter.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method !== "GET") {
    res.on("finish", () => {
      // lists of people change with the action itself: read them fresh next time
      for (const key of [...responseCache.keys()]) if (/^(users|children|audit)/.test(key)) responseCache.delete(key);
      computers.forEach((_f, key) => refresh(key).catch(() => {}));
      void refreshLive(); // the search index too
    });
  }
  next();
});

/** Folder list without the words themselves (only their labels, for searching) — small and fast. */
const loadTemplates = () =>
  SeedTemplate.aggregate([
    { $match: { active: true } },
    { $sort: { order: 1 } },
    {
      $project: {
        name: 1,
        seedName: 1,
        icon: 1,
        color: 1,
        source: 1,
        editedByAdmin: 1,
        order: 1,
        nameTranslations: 1,
        wordCount: { $size: { $ifNull: ["$words", []] } },
        wordLabels: { $ifNull: ["$words.label", []] },
      },
    },
  ]);
const templateSummary = (t: { _id: unknown; words?: { label: string }[] } & Record<string, unknown>) => {
  const { words, contentHash: _h, ...rest } = t;
  return { ...rest, wordCount: words?.length ?? 0, wordLabels: (words ?? []).map((w) => w.label) };
};
const loadVerbs = () => VerbGroup.find({ active: true }).sort({ base: 1 }).lean();
async function computeContent() {
  const db = mongoose.connection.db!;
  const names = (await db.listCollections().toArray()).map((c) => c.name).filter((n) => n.startsWith("catalog_") && n !== "catalog_meta").sort();
  const counts = await Promise.all(names.map((n) => db.collection(n).estimatedDocumentCount()));
  const meta = await db.collection("catalog_meta").findOne({}, { projection: { syncedAt: 1 } });
  return { syncedAt: meta?.syncedAt ?? null, collections: names.map((n, i) => ({ name: n, count: counts[i] })) };
}

function warmAdminCache() {
  if (!onRealDatabase()) return;
  // answers that came from another database (e.g. the local one used while Atlas connects) are dropped
  const host = dbHost();
  for (const [key, entry] of responseCache) if (entry.host !== host) responseCache.delete(key);
  computing.clear();
  generation++;
  const jobs: [string, () => Promise<unknown>][] = [
    ["stats", computeStats],
    ["templates", loadTemplates],
    ["verbs", loadVerbs],
    ["content", computeContent],
  ];
  for (const [key, fn] of jobs) {
    computers.set(key, fn);
    refresh(key).catch(() => {});
  }
}
if (mongoose.connection.readyState === 1) setImmediate(warmAdminCache);
mongoose.connection.on("connected", warmAdminCache);

// 1. Dashboard numbers, all computed from the real data the app sends
const DAY_MS = 24 * 60 * 60 * 1000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

adminRouter.get(
  "/admin/stats",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, await cached("stats", computeStats));
    } catch (err) {
      next(err);
    }
  }
);

async function computeStats() {
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
        CareLog.find({ deletedAt: null, date: { $gte: weekAgo }, mood: { $in: ["frustrated", "overwhelmed"] } }).select("date").lean(),
        User.aggregate([{ $match: appUsers }, { $group: { _id: "$role", count: { $sum: 1 } } }]),
        User.countDocuments({ ...appUsers, createdAt: { $lt: monthAgo } }),
        User.find({ ...appUsers, createdAt: { $gte: monthAgo } }).select("createdAt").lean(),
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
        topWords = (await Word.find({ deletedAt: null, useCount: { $gt: 0 } }).sort({ useCount: -1 }).limit(8).select("label useCount").lean()).map((w) => ({
          word: w.label,
          count: w.useCount,
        }));
      }

      return {
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
      };
}

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

      // answered from the in-memory search index (no database query per search)
      sendSuccess(res, await searchUsers({ q: search, role, status, page, limit }));
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
      forgetCachedAccount(targetUser._id);

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
      forgetCachedAccount(targetUser._id);

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
      forgetCachedAccount(String(req.params.id));
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
      forgetCachedAccount(target._id);
      await AuditLog.create({ actorId: actor.id, action: "admin.user.delete", targetType: "user", targetId: target._id, meta: { email: target.email } });
      sendSuccess(res, null, "User deleted");
    } catch (err) {
      next(err);
    }
  }
);

// 5c. One search box for everything (families, children, folders and words, verbs, pictures,
// translations) — answered from memory in milliseconds
adminRouter.get(
  "/admin/search",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = String(req.query.q ?? "").trim().slice(0, 100);
      if (!q) {
        sendSuccess(res, { query: "", users: { total: 0, items: [] }, children: { total: 0, items: [] }, folders: { total: 0, items: [] }, verbs: { total: 0, items: [] }, pictures: { total: 0, items: [] }, translations: { total: 0, items: [] }, tookMs: 0 });
        return;
      }
      sendSuccess(res, await searchEverything(q, Math.min(20, Number(req.query.limit) || 6)));
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

      const [children, total] = await cached(`children:${JSON.stringify(req.query)}`, () => Promise.all([
        Child.find({ deletedAt: null })
          .select("-faceDescriptors") // Never leak biometrics
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Child.countDocuments({ deletedAt: null }),
      ]));

      const ids = children.map((c) => c._id);
      const ownerIds = [...new Set(children.map((c) => c.ownerId))];
      const [owners, wordCounts, shelfCounts, usage, defaultTemplates] = await cached(`children-extra:${JSON.stringify(req.query)}`, () => Promise.all([
        User.find({ _id: { $in: ownerIds } }).select("email fullName role").lean(),
        Word.aggregate([{ $match: { childId: { $in: ids }, deletedAt: null } }, { $group: { _id: "$childId", count: { $sum: 1 } } }]),
        Shelf.aggregate([{ $match: { childId: { $in: ids }, deletedAt: null } }, { $group: { _id: "$childId", count: { $sum: 1 } } }]),
        UsageSummary.find({ childId: { $in: ids } }).select("childId wordsByDay sentencesSpoken lastPlayedDate").lean(),
        SeedTemplate.aggregate([
          { $match: { active: true } },
          { $project: { name: 1, wordCount: { $size: { $ifNull: ["$words", []] } } } },
        ]),
      ]));
      const defaultMainCount = new Set(defaultTemplates.map((t: { name: string }) => t.name.split(" / ")[0].trim())).size;
      const defaultSubCount = defaultTemplates.length;
      const defaultWordCount = defaultTemplates.reduce((acc: number, t: { wordCount?: number }) => acc + (t.wordCount ?? 0), 0);

      const ownerBy = new Map(owners.map((o) => [o._id, o]));
      const wordsBy = new Map(wordCounts.map((w: { _id: string; count: number }) => [w._id, w.count]));
      const shelvesBy = new Map(shelfCounts.map((w: { _id: string; count: number }) => [w._id, w.count]));
      const usageBy = new Map(usage.map((u) => [u.childId, u]));

      sendSuccess(res, {
        children: children.map((c) => {
          const o = ownerBy.get(c.ownerId);
          const u = usageBy.get(c._id);
          const customWords = wordsBy.get(c._id) ?? 0;
          const customShelves = shelvesBy.get(c._id) ?? 0;
          return {
            ...c,
            owner: o ? { _id: o._id, email: o.email, fullName: o.fullName, role: o.role } : null,
            boardWords: customWords > 0 ? customWords : defaultWordCount,
            boardShelves: customShelves > 0 ? customShelves : defaultSubCount,
            boardMainCategories: defaultMainCount,
            hasCustomBoard: customShelves > 0,
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

// 6b. A child's board (Main Categories -> Sub-Categories -> Words)
adminRouter.get(
  "/admin/children/:id/board",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const child = await Child.findOne({ _id: req.params.id, deletedAt: null }).select("name age diagnoses settings rewards").lean();
      if (!child) throw new NotFoundError("Child not found");
      const [shelves, words] = await Promise.all([
        Shelf.find({ childId: child._id, deletedAt: null }).sort({ order: 1 }).select("name icon color parentId order hidden").lean(),
        Word.find({ childId: child._id, deletedAt: null }).sort({ order: 1 }).select("shelfId label phrase emoji imageUri hidden useCount verbFormTag isCustom translations").lean(),
      ]);

      const wordsBy = new Map<string, typeof words>();
      words.forEach((w) => {
        const list = wordsBy.get(w.shelfId) ?? [];
        list.push(w);
        wordsBy.set(w.shelfId, list);
      });

      let flatShelves = shelves.map((sh) => ({ ...sh, words: wordsBy.get(sh._id) ?? [] }));
      let usingDefaultCatalog = false;

      // If device hasn't pushed custom shelves yet, build the exact default 3-level hierarchy from SeedTemplate
      if (flatShelves.length === 0) {
        usingDefaultCatalog = true;
        const templates = await SeedTemplate.find({ active: true }).sort({ order: 1 }).select("-contentHash").lean();
        const mainMap = new Map<string, { _id: string; name: string; icon?: string; color?: string; order: number }>();
        const builtShelves: Array<{
          _id: string;
          name: string;
          icon?: string;
          color?: string;
          parentId: string | null;
          order: number;
          hidden: boolean;
          words: unknown[];
        }> = [];

        templates.forEach((tpl, idx) => {
          const parts = tpl.name.split(" / ").map((p) => p.trim()).filter(Boolean);
          const mainName = parts[0] || tpl.name;
          const subName = parts.slice(1).join(" / ");
          const tplWords = (tpl.words ?? []).map((w, wi) => ({
            _id: `${tpl._id}-w-${wi}`,
            label: w.label,
            phrase: w.phrase || w.label,
            emoji: w.emoji,
            imageUri: w.imageUri,
            verbFormTag: w.verbFormTag,
            translations: w.translations instanceof Map ? Object.fromEntries(w.translations) : w.translations,
            useCount: 0,
          }));

          if (!subName) {
            const mainId = `main-${mainName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
            mainMap.set(mainName, { _id: mainId, name: mainName, icon: tpl.icon, color: tpl.color, order: idx });
            builtShelves.push({
              _id: mainId,
              name: mainName,
              icon: tpl.icon,
              color: tpl.color,
              parentId: null,
              order: idx,
              hidden: false,
              words: tplWords,
            });
          } else {
            let main = mainMap.get(mainName);
            if (!main) {
              const mainId = `main-${mainName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
              const MAIN_ICONS: Record<string, string> = {
                People: "👨‍👩‍👧‍👦",
                Feelings: "😊",
                Actions: "🏃",
                Food: "🍎",
                Places: "🏠",
                Things: "🧸",
              };
              main = { _id: mainId, name: mainName, icon: MAIN_ICONS[mainName] || tpl.icon || "📁", color: tpl.color, order: idx };
              mainMap.set(mainName, main);
              builtShelves.push({
                _id: main._id,
                name: main.name,
                icon: main.icon,
                color: main.color,
                parentId: null,
                order: main.order,
                hidden: false,
                words: [],
              });
            }
            builtShelves.push({
              _id: String(tpl._id),
              name: subName,
              icon: tpl.icon,
              color: tpl.color,
              parentId: main._id,
              order: idx,
              hidden: false,
              words: tplWords,
            });
          }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        flatShelves = builtShelves as any;
      }

      sendSuccess(res, {
        child,
        usingDefaultCatalog,
        shelves: flatShelves,
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
      sendSuccess(res, await cached("verbs", loadVerbs));
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
      patchCachedList("verbs", verb.toObject());
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
      patchCachedList("verbs", verb.toObject());
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
      patchCachedList("verbs", null, req.params.id);
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
      const templates = await cached("templates", loadTemplates);
      sendSuccess(res, templates);
    } catch (err) {
      next(err);
    }
  }
);

// one folder with all its words
adminRouter.get(
  "/admin/templates/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const template = await cached(`template:${id}`, () => SeedTemplate.findById(id).select("-contentHash").lean());
      if (!template) throw new NotFoundError("Template not found");
      sendSuccess(res, template);
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
      patchCachedList("templates", templateSummary(template.toObject() as never));
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
      patchCachedList("templates", templateSummary(template.toObject() as never));
      responseCache.delete(`template:${template._id}`);
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
      patchCachedList("templates", null, req.params.id);
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
      sendSuccess(res, await cached("content", computeContent));
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
      if (isCatalogReady(name)) {
        sendSuccess(res, searchCatalog(name, search, page, limit));
        return;
      }
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

      const cachedAudit = await cached(`audit-v2:${JSON.stringify(req.query)}`, async () => {
        const [logs, total] = await Promise.all([
          AuditLog.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
          AuditLog.countDocuments(filter),
        ]);
        return { logs, total };
      });

      const logs = Array.isArray(cachedAudit) ? cachedAudit[0] ?? [] : cachedAudit?.logs ?? [];
      const total = Array.isArray(cachedAudit) ? cachedAudit[1] ?? 0 : cachedAudit?.total ?? logs.length;

      sendSuccess(res, {
        logs,
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
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

