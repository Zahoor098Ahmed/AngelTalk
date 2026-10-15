import { Schema, model } from "mongoose";
import { baseSyncSchemaDefinition, baseSchemaOptions } from "./base.schema";

export interface IUsageSummary {
  _id: string;
  ownerId: string;
  childId: string;
  wordTotals: Map<string, number>;
  wordsByDay: number[]; // 7 numbers Sun..Sat
  scheduleByDay: number[]; // 7 numbers Sun..Sat completion %
  lastPlayedDate?: Date | null;
  longestSentenceLength: number;
  longestSentenceWords: string[];
  sentencesSpoken: number;
  correctionsUsed: number;
  clientUpdatedAt: Date;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const UsageSummarySchema = new Schema<IUsageSummary>(
  {
    ...baseSyncSchemaDefinition,
    wordTotals: {
      type: Map,
      of: Number,
      default: {},
    },
    wordsByDay: {
      type: [Number],
      default: [0, 0, 0, 0, 0, 0, 0],
    },
    scheduleByDay: {
      type: [Number],
      default: [0, 0, 0, 0, 0, 0, 0],
    },
    lastPlayedDate: {
      type: Date,
      default: null,
    },
    longestSentenceLength: {
      type: Number,
      default: 0,
    },
    longestSentenceWords: {
      type: [String],
      default: [],
    },
    sentencesSpoken: {
      type: Number,
      default: 0,
    },
    correctionsUsed: {
      type: Number,
      default: 0,
    },
  },
  baseSchemaOptions
);

UsageSummarySchema.index({ childId: 1 }, { unique: true });
UsageSummarySchema.index({ ownerId: 1, updatedAt: -1 });

export const UsageSummary = model<IUsageSummary>("UsageSummary", UsageSummarySchema);
