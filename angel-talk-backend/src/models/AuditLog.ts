import { Schema, model } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { AuditAction } from "../common/types";

export interface IAuditLog {
  _id: string;
  actorId: string; // User ID who took the action
  action: AuditAction;
  targetType: string; // e.g. "user", "child", "face", "device", "careteam"
  targetId?: string;
  meta: Record<string, unknown>;
  ip?: string;
  createdAt?: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    actorId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      index: true,
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    _id: false,
  }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = model<IAuditLog>("AuditLog", AuditLogSchema);
