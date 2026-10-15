import { Schema, model } from "mongoose";
import { baseSyncSchemaDefinition, baseSchemaOptions } from "./base.schema";

export interface ISentenceLog {
  _id: string;
  ownerId: string;
  childId: string;
  words: string[];
  text: string;
  length: number;
  spokenAt: Date;
  clientUpdatedAt: Date;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const SentenceLogSchema = new Schema<ISentenceLog>(
  {
    ...baseSyncSchemaDefinition,
    words: {
      type: [String],
      required: true,
      default: [],
    },
    text: {
      type: String,
      required: true,
    },
    length: {
      type: Number,
      required: true,
      default: 0,
    },
    spokenAt: {
      type: Date,
      default: () => new Date(),
      index: true,
    },
  },
  baseSchemaOptions
);

SentenceLogSchema.index({ ownerId: 1, updatedAt: -1 });
SentenceLogSchema.index({ childId: 1, updatedAt: -1 });
SentenceLogSchema.index({ childId: 1, spokenAt: -1 });

export const SentenceLog = model<ISentenceLog>("SentenceLog", SentenceLogSchema);
