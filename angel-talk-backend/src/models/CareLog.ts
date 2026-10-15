import { Schema, model } from "mongoose";
import { baseSyncSchemaDefinition, baseSchemaOptions } from "./base.schema";
import { MoodType } from "../common/types";

export interface ICareLog {
  _id: string;
  ownerId: string;
  childId: string;
  date: Date;
  mood: MoodType;
  sensoryTriggers: string[];
  meltdownDurationMin: number;
  communicationWins?: string;
  notes?: string;
  loggedBy: string; // User ID
  clientUpdatedAt: Date;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const CareLogSchema = new Schema<ICareLog>(
  {
    ...baseSyncSchemaDefinition,
    date: {
      type: Date,
      default: () => new Date(),
      index: true,
    },
    mood: {
      type: String,
      enum: ["happy", "calm", "frustrated", "overwhelmed", "tired"],
      required: true,
    },
    sensoryTriggers: {
      type: [String],
      default: [],
    },
    meltdownDurationMin: {
      type: Number,
      default: 0,
    },
    communicationWins: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    loggedBy: {
      type: String,
      required: true,
    },
  },
  baseSchemaOptions
);

CareLogSchema.index({ ownerId: 1, updatedAt: -1 });
CareLogSchema.index({ childId: 1, updatedAt: -1 });
CareLogSchema.index({ childId: 1, date: -1 });

export const CareLog = model<ICareLog>("CareLog", CareLogSchema);

