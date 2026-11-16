import { TableConfig } from "./sync.types";
import { Child } from "../../models/Child";

/** Personal app content stays on the device. Sync accepts only directory/profile metadata. */
export const SYNC_TABLE_REGISTRY: Record<string, TableConfig> = {
  children: {
    model: Child,
    allowedFields: ["name", "age", "diagnoses", "photoUrl"],
    ownerOnly: true,
  },
};
