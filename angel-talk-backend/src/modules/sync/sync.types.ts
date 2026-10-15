import { CareTeamPermission, SyncAction } from "../../common/types";

export interface SyncMutationItem {
  id: string; // client record UUID
  table: string; // collection name, e.g. "shelves", "words"
  action: SyncAction; // "UPSERT" | "DELETE" | "INCREMENT"
  data?: Record<string, unknown>;
  clientUpdatedAt: string; // ISO timestamp
}

export type MutationResultStatus = "applied" | "skipped_stale" | "rejected";

export interface SyncMutationResult {
  id: string;
  status: MutationResultStatus;
  reason?: string;
}

export interface SyncPushResponse {
  results: SyncMutationResult[];
  syncedAt: string;
}

export interface SyncPullResponse {
  syncedAt: string;
  cursor?: string | null;
  hasMore: boolean;
  tables: Record<string, unknown[]>;
}

export interface TableConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any;
  allowedFields: string[];
  requiredPermission?: CareTeamPermission;
  ownerOnly?: boolean;
  hasOwnerId?: boolean;
  additiveCounters?: string[];
}

