import { SYNC_TABLE_REGISTRY } from "./sync.registry";
import {
  SyncMutationItem,
  SyncMutationResult,
  SyncPullResponse,
  SyncPushResponse,
} from "./sync.types";
import { Child } from "../../models/Child";
import { CareTeam } from "../../models/CareTeam";
import { assertChildAccess } from "../../middleware/auth";
import { AuthenticatedUser, CareTeamPermission } from "../../common/types";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../common/errors";

const PULL_LIMIT = 200;

export class SyncService {
  public static async pull(
    user: AuthenticatedUser,
    since?: string,
    cursor?: string
  ): Promise<SyncPullResponse> {
    // 1. Crucial: capture syncedAt timestamp BEFORE executing any queries
    const syncedAt = new Date().toISOString();

    // 2. Discover all children accessible by this user
    let accessibleChildIds: string[] = [];
    const permissionsByChildId: Record<string, Set<CareTeamPermission>> = {};

    if (user.role === "admin" || user.role === "superadmin") {
      const allChildren = await Child.find({}, { _id: 1 });
      accessibleChildIds = allChildren.map((c) => c._id);
    } else {
      const [ownedChildren, careMemberships] = await Promise.all([
        Child.find({ ownerId: user.id }, { _id: 1 }),
        CareTeam.find({ userId: user.id, status: "active" }),
      ]);

      const ownedIds = ownedChildren.map((c) => c._id);
      accessibleChildIds = [...ownedIds];

      for (const mem of careMemberships) {
        if (!accessibleChildIds.includes(mem.childId)) {
          accessibleChildIds.push(mem.childId);
        }
        if (!permissionsByChildId[mem.childId]) {
          permissionsByChildId[mem.childId] = new Set();
        }
        for (const p of mem.permissions) {
          permissionsByChildId[mem.childId].add(p);
        }
      }
    }

    if (accessibleChildIds.length === 0) {
      return {
        syncedAt,
        hasMore: false,
        tables: {},
      };
    }

    const tablesResult: Record<string, unknown[]> = {};
    let totalItemsFetched = 0;
    let hasMore = false;
    let nextCursor: string | null = null;

    const baseFilter: Record<string, unknown> = {
      $or: [{ childId: { $in: accessibleChildIds } }, { _id: { $in: accessibleChildIds } }],
    };

    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        baseFilter.updatedAt = { $gt: sinceDate };
      }
    }

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        baseFilter.updatedAt = { $gt: cursorDate };
      }
    }

    // Query each table in the registry
    for (const [tableName, config] of Object.entries(SYNC_TABLE_REGISTRY)) {
      if (totalItemsFetched >= PULL_LIMIT) {
        hasMore = true;
        break;
      }

      // Respect clinical access: skip clinical tables if user has no view_clinical permission
      if (
        (tableName === "carelogs" || tableName === "therapygoals" || tableName === "clinicalnotes") &&
        user.role !== "admin" &&
        user.role !== "superadmin"
      ) {
        // filter out children for which this user does not have view_clinical
        const allowedClinicalChildIds = accessibleChildIds.filter((cid) => {
          // If owned, allowed
          if (permissionsByChildId[cid] === undefined) return true; // owned
          return permissionsByChildId[cid]?.has("view_clinical");
        });
        if (allowedClinicalChildIds.length === 0) {
          tablesResult[tableName] = [];
          continue;
        }
      }

      const queryFilter = tableName === "children"
        ? { _id: { $in: accessibleChildIds }, ...(baseFilter.updatedAt ? { updatedAt: baseFilter.updatedAt } : {}) }
        : { childId: { $in: accessibleChildIds }, ...(baseFilter.updatedAt ? { updatedAt: baseFilter.updatedAt } : {}) };

      const records = await config.model
        .find(queryFilter)
        .sort({ updatedAt: 1 })
        .limit(PULL_LIMIT - totalItemsFetched);

      tablesResult[tableName] = records;
      totalItemsFetched += records.length;

      if (records.length > 0) {
        const lastRecord = records[records.length - 1];
        if (lastRecord.updatedAt) {
          nextCursor = new Date(lastRecord.updatedAt).toISOString();
        }
      }
    }

    return {
      syncedAt,
      cursor: nextCursor,
      hasMore,
      tables: tablesResult,
    };
  }

  /**
   * Applies a batch of changes from a device. Works in bulk — the children, the existing records
   * and the writes each take one database round trip per table — so a whole board (1,000+ words)
   * goes through quickly even on a slow connection. Rules per record are unchanged:
   * access check, child match, last-write-wins on clientUpdatedAt, additive counters.
   */
  public static async push(
    user: AuthenticatedUser,
    mutations: SyncMutationItem[]
  ): Promise<SyncPushResponse> {
    if (!Array.isArray(mutations)) {
      throw new BadRequestError("Mutations payload must be an array");
    }

    if (mutations.length > 500) {
      throw new BadRequestError("Cannot push more than 500 mutations per batch");
    }

    const results: (SyncMutationResult | undefined)[] = new Array(mutations.length);
    const reject = (i: number, reason: string) => (results[i] = { id: mutations[i].id, status: "rejected", reason });

    // 1. shape checks
    type Prepared = { i: number; m: SyncMutationItem; childId: string; clientTime: Date };
    const prepared: Prepared[] = [];
    mutations.forEach((m, i) => {
      if (!SYNC_TABLE_REGISTRY[m.table]) {
        reject(i, `Unknown sync table: ${m.table}`);
        return;
      }
      const clientTime = new Date(m.clientUpdatedAt);
      if (isNaN(clientTime.getTime())) {
        reject(i, "Invalid clientUpdatedAt timestamp");
        return;
      }
      const childId = (m.data?.childId as string) || (m.table === "children" ? m.id : undefined);
      if (!childId) {
        reject(i, "Missing childId in mutation");
        return;
      }
      prepared.push({ i, m, childId, clientTime });
    });

    // 2. access: all children of this batch in one query
    const childIds = [...new Set(prepared.map((p) => p.childId))];
    const children = await Child.find({ _id: { $in: childIds } }).select("ownerId deletedAt").lean();
    const childById = new Map<string, { ownerId: string; deletedAt?: Date | null }>(
      children.map((c) => [String(c._id), { ownerId: c.ownerId, deletedAt: c.deletedAt }])
    );
    const accessCache = new Map<string, boolean>();
    const hasAccess = async (p: Prepared): Promise<boolean | "retry"> => {
      const config = SYNC_TABLE_REGISTRY[p.m.table];
      const child = childById.get(p.childId);
      // a device pushing a child profile that is not on the server yet creates it for its own account
      if (!child && p.m.table === "children") return true;
      const key = `${p.childId}:${config.requiredPermission || "default"}:${config.ownerOnly ? 1 : 0}`;
      const known = accessCache.get(key);
      if (known !== undefined) return known;
      let ok = false;
      if (child && !child.deletedAt && child.ownerId === user.id) ok = true;
      else {
        try {
          const full = await assertChildAccess(user, p.childId, config.requiredPermission);
          ok = !(config.ownerOnly && full.ownerId !== user.id && user.role !== "superadmin");
        } catch (err) {
          // a database hiccup is not a "no": leave it for the device to send again next time
          if (!(err instanceof NotFoundError || err instanceof ForbiddenError)) return "retry";
          ok = false;
        }
      }
      accessCache.set(key, ok);
      return ok;
    };
    const allowed: Prepared[] = [];
    for (const p of prepared) {
      const access = await hasAccess(p);
      if (access === "retry") reject(p.i, "Temporary server problem, please send again");
      else if (access) allowed.push(p);
      else reject(p.i, "Unauthorized access to child data or insufficient permissions");
    }

    // 3. per table: read the existing records once, then write everything in one bulk call
    const byTable = new Map<string, Prepared[]>();
    allowed.forEach((p) => byTable.set(p.m.table, [...(byTable.get(p.m.table) ?? []), p]));
    // children first, so the records that belong to a new child find its owner
    const tables = [...byTable.keys()].sort((a, b) => Number(b === "children") - Number(a === "children"));

    for (const table of tables) {
      const config = SYNC_TABLE_REGISTRY[table];
      const items = byTable.get(table)!;
      const existingDocs = await config.model.find({ _id: { $in: items.map((p) => p.m.id) } }).lean();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingById = new Map<string, any>(existingDocs.map((d: { _id: unknown }) => [String(d._id), d]));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ops: any[] = [];
      const opOwner: number[] = []; // op index -> mutation index

      for (const p of items) {
        const { m, childId, clientTime } = p;
        const existing = existingById.get(m.id);
        if (existing) {
          const existingChildId = existing.childId || existing._id;
          if (String(existingChildId) !== childId) {
            reject(p.i, "Security rejection: childId does not match existing document");
            continue;
          }
          if (existing.clientUpdatedAt && clientTime <= new Date(existing.clientUpdatedAt)) {
            results[p.i] = { id: m.id, status: "skipped_stale", reason: "Server has a newer or identical clientUpdatedAt timestamp" };
            continue;
          }
        }

        if (m.action === "DELETE") {
          if (existing) {
            ops.push({ updateOne: { filter: { _id: m.id }, update: { $set: { deletedAt: new Date(), clientUpdatedAt: clientTime } } } });
            opOwner.push(p.i);
          } else results[p.i] = { id: m.id, status: "applied" };
          continue;
        }

        if (m.action === "INCREMENT") {
          const inc: Record<string, number> = {};
          for (const field of config.additiveCounters ?? []) {
            const delta = Number(m.data?.[field]) || 0;
            if (delta > 0) inc[field] = delta;
          }
          if (existing && Object.keys(inc).length > 0) {
            ops.push({ updateOne: { filter: { _id: m.id }, update: { $inc: inc, $set: { clientUpdatedAt: clientTime } } } });
            opOwner.push(p.i);
          } else results[p.i] = { id: m.id, status: "applied" };
          continue;
        }

        // UPSERT
        const data: Record<string, unknown> = {};
        for (const key of config.allowedFields) if (m.data?.[key] !== undefined) data[key] = m.data[key];
        data.clientUpdatedAt = clientTime;
        if (table === "carelogs" && !data.loggedBy) data.loggedBy = user.id;
        if (table !== "children") {
          data.childId = childId;
          const owner = childById.get(childId)?.ownerId;
          if (owner) data.ownerId = owner;
        }
        for (const counter of config.additiveCounters ?? []) {
          if (existing && m.data?.[counter] !== undefined) data[counter] = Math.max(Number(existing[counter]) || 0, Number(m.data[counter]) || 0);
        }

        if (existing) {
          ops.push({ updateOne: { filter: { _id: m.id }, update: { $set: { ...data, deletedAt: null } } } });
        } else {
          const doc = { ...data, _id: m.id, deletedAt: null, ...(table === "children" ? { ownerId: user.id } : {}) };
          const invalid = new config.model(doc).validateSync();
          if (invalid) {
            reject(p.i, invalid.message);
            continue;
          }
          ops.push({ insertOne: { document: doc } });
          if (table === "children") childById.set(childId, { ownerId: user.id, deletedAt: null });
        }
        opOwner.push(p.i);
      }

      if (ops.length === 0) continue;
      const failed = new Map<number, string>();
      try {
        await config.model.bulkWrite(ops, { ordered: false });
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const writeErrors: any[] = (err as any)?.writeErrors ?? (err as any)?.result?.result?.writeErrors ?? [];
        if (writeErrors.length === 0) {
          ops.forEach((_op, k) => failed.set(k, (err as Error).message || "Database update failed"));
        } else {
          for (const we of writeErrors) failed.set(Number(we.index ?? we.err?.index), we.errmsg ?? we.err?.errmsg ?? "Database update failed");
        }
      }
      ops.forEach((_op, k) => {
        const i = opOwner[k];
        results[i] = failed.has(k) ? { id: mutations[i].id, status: "rejected", reason: failed.get(k) } : { id: mutations[i].id, status: "applied" };
      });
    }

    return {
      results: results.map((r, i) => r ?? { id: mutations[i].id, status: "rejected", reason: "Not processed" }),
      syncedAt: new Date().toISOString(),
    };
  }
}

