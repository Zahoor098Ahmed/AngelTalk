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
import { BadRequestError } from "../../common/errors";

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

    const results: SyncMutationResult[] = [];
    const accessCheckCache = new Map<string, boolean>();

    for (const mutation of mutations) {
      const config = SYNC_TABLE_REGISTRY[mutation.table];
      if (!config) {
        results.push({
          id: mutation.id,
          status: "rejected",
          reason: `Unknown sync table: ${mutation.table}`,
        });
        continue;
      }

      const clientTime = new Date(mutation.clientUpdatedAt);
      if (isNaN(clientTime.getTime())) {
        results.push({
          id: mutation.id,
          status: "rejected",
          reason: "Invalid clientUpdatedAt timestamp",
        });
        continue;
      }

      const childId = (mutation.data?.childId as string) || (mutation.table === "children" ? mutation.id : undefined);
      if (!childId) {
        results.push({
          id: mutation.id,
          status: "rejected",
          reason: "Missing childId in mutation",
        });
        continue;
      }

      // Check permission with cache
      const cacheKey = `${childId}:${config.requiredPermission || "default"}`;
      let hasAccess = accessCheckCache.get(cacheKey);
      if (hasAccess === undefined) {
        try {
          const child = await assertChildAccess(user, childId, config.requiredPermission);
          if (config.ownerOnly && child.ownerId !== user.id && user.role !== "superadmin") {
            hasAccess = false;
          } else {
            hasAccess = true;
          }
        } catch {
          hasAccess = false;
        }
        accessCheckCache.set(cacheKey, hasAccess);
      }

      if (!hasAccess) {
        results.push({
          id: mutation.id,
          status: "rejected",
          reason: "Unauthorized access to child data or insufficient permissions",
        });
        continue;
      }

      try {
        // Find existing record
        const existing = await config.model.findById(mutation.id);

        if (existing) {
          // Verify childId matches existing doc (security cross-child injection check)
          const existingChildId = existing.childId || existing._id;
          if (existingChildId !== childId) {
            results.push({
              id: mutation.id,
              status: "rejected",
              reason: "Security rejection: childId does not match existing document",
            });
            continue;
          }

          // Last-Write-Wins (LWW) Conflict Resolution
          if (existing.clientUpdatedAt && clientTime <= existing.clientUpdatedAt) {
            results.push({
              id: mutation.id,
              status: "skipped_stale",
              reason: "Server has a newer or identical clientUpdatedAt timestamp",
            });
            continue;
          }
        }

        // Action: DELETE
        if (mutation.action === "DELETE") {
          if (existing) {
            existing.deletedAt = new Date();
            existing.clientUpdatedAt = clientTime;
            await existing.save();
          }
          results.push({ id: mutation.id, status: "applied" });
          continue;
        }

        // Action: INCREMENT (Additive telemetry)
        if (mutation.action === "INCREMENT") {
          if (existing && config.additiveCounters) {
            const incOps: Record<string, number> = {};
            for (const field of config.additiveCounters) {
              const delta = Number(mutation.data?.[field]) || 0;
              if (delta > 0) {
                incOps[field] = delta;
              }
            }
            if (Object.keys(incOps).length > 0) {
              await config.model.updateOne(
                { _id: mutation.id },
                {
                  $inc: incOps,
                  $set: { clientUpdatedAt: clientTime },
                }
              );
            }
          }
          results.push({ id: mutation.id, status: "applied" });
          continue;
        }

        // Action: UPSERT
        const sanitizedData: Record<string, unknown> = {};
        if (mutation.data) {
          for (const key of config.allowedFields) {
            if (mutation.data[key] !== undefined) {
              sanitizedData[key] = mutation.data[key];
            }
          }
        }

        sanitizedData.clientUpdatedAt = clientTime;
        if (mutation.table !== "children") {
          sanitizedData.childId = childId;
          const childDoc = await Child.findById(childId);
          if (childDoc) {
            sanitizedData.ownerId = childDoc.ownerId;
          }
        }

        if (existing) {
          // If additive counters exist, merge them additively
          if (config.additiveCounters) {
            for (const counter of config.additiveCounters) {
              if (mutation.data?.[counter] !== undefined) {
                const currentVal = Number(existing[counter]) || 0;
                const newVal = Number(mutation.data[counter]) || 0;
                sanitizedData[counter] = Math.max(currentVal, newVal);
              }
            }
          }

          Object.assign(existing, sanitizedData);
          existing.deletedAt = null; // Un-delete if re-upserted
          await existing.save();
        } else {
          sanitizedData._id = mutation.id;
          sanitizedData.deletedAt = null;
          await config.model.create(sanitizedData);
        }

        results.push({ id: mutation.id, status: "applied" });
      } catch (err) {
        results.push({
          id: mutation.id,
          status: "rejected",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          reason: (err as any).message || "Database update failed",
        });
      }
    }

    return {
      results,
      syncedAt: new Date().toISOString(),
    };
  }
}

