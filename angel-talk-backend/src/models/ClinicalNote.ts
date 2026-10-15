import { Schema, model } from "mongoose";
import { baseSyncSchemaDefinition, baseSchemaOptions } from "./base.schema";

export interface IClinicalNote {
  _id: string;
  ownerId: string;
  childId: string;
  authorId: string; // SLP / Physician User ID
  date: Date;
  title: string;
  content: string;
  recommendations: string[];
  clientUpdatedAt: Date;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const ClinicalNoteSchema = new Schema<IClinicalNote>(
  {
    ...baseSyncSchemaDefinition,
    authorId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      default: () => new Date(),
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    recommendations: {
      type: [String],
      default: [],
    },
  },
  baseSchemaOptions
);

ClinicalNoteSchema.index({ ownerId: 1, updatedAt: -1 });
ClinicalNoteSchema.index({ childId: 1, updatedAt: -1 });
ClinicalNoteSchema.index({ childId: 1, date: -1 });

export const ClinicalNote = model<IClinicalNote>("ClinicalNote", ClinicalNoteSchema);
