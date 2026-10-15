import { Schema, model } from "mongoose";
import { baseSyncSchemaDefinition, baseSchemaOptions } from "./base.schema";

export interface IScheduleTask {
  _id: string;
  ownerId: string;
  childId: string;
  title: string;
  time?: string; // e.g. "08:30"
  emoji: string;
  pictogram?: string;
  order: number;
  dayOfWeek: number; // 0 = Sunday .. 6 = Saturday
  completedDates: string[]; // ['2026-10-15', ...]
  clientUpdatedAt: Date;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const ScheduleTaskSchema = new Schema<IScheduleTask>(
  {
    ...baseSyncSchemaDefinition,
    title: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: String,
    },
    emoji: {
      type: String,
      default: "⭐",
    },
    pictogram: {
      type: String,
    },
    order: {
      type: Number,
      default: 0,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    completedDates: {
      type: [String],
      default: [],
    },
  },
  baseSchemaOptions
);

ScheduleTaskSchema.index({ ownerId: 1, updatedAt: -1 });
ScheduleTaskSchema.index({ childId: 1, updatedAt: -1 });
ScheduleTaskSchema.index({ childId: 1, dayOfWeek: 1, order: 1 });

export const ScheduleTask = model<IScheduleTask>("ScheduleTask", ScheduleTaskSchema);
