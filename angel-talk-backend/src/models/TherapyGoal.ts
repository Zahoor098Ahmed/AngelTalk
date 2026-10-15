import { Schema, model } from "mongoose";
import { baseSyncSchemaDefinition, baseSchemaOptions } from "./base.schema";
import { TherapyCategory } from "../common/types";

export interface ITherapyGoal {
  _id: string;
  ownerId: string;
  childId: string;
  title: string;
  category: TherapyCategory;
  targetCount: number;
  currentCount: number;
  unit: string;
  completed: boolean;
  prescribedBy?: string; // SLP user name / ID
  assignedDate: Date;
  notes?: string;
  clientUpdatedAt: Date;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const TherapyGoalSchema = new Schema<ITherapyGoal>(
  {
    ...baseSyncSchemaDefinition,
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["speech", "occupational", "behavioral", "sensory"],
      required: true,
    },
    targetCount: {
      type: Number,
      required: true,
      min: 1,
    },
    currentCount: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      default: "times",
    },
    completed: {
      type: Boolean,
      default: false,
    },
    prescribedBy: {
      type: String,
    },
    assignedDate: {
      type: Date,
      default: () => new Date(),
    },
    notes: {
      type: String,
    },
  },
  baseSchemaOptions
);

TherapyGoalSchema.index({ ownerId: 1, updatedAt: -1 });
TherapyGoalSchema.index({ childId: 1, updatedAt: -1 });
TherapyGoalSchema.index({ childId: 1, completed: 1 });

export const TherapyGoal = model<ITherapyGoal>("TherapyGoal", TherapyGoalSchema);
