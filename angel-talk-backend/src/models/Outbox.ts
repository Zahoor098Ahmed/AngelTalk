import { Schema, model } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { OutboxEventType } from "../common/types";

export interface IOutbox {
  _id: string;
  eventType: OutboxEventType;
  payload: Record<string, unknown>;
  status: "pending" | "processed" | "failed";
  attempts: number;
  lastError?: string;
  processedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const OutboxSchema = new Schema<IOutbox>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastError: {
      type: String,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    _id: false,
  }
);

OutboxSchema.index({ status: 1, createdAt: 1 });

export const Outbox = model<IOutbox>("Outbox", OutboxSchema);
