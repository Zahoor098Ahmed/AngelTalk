import { Schema, model } from "mongoose";
import { baseSyncSchemaDefinition, baseSchemaOptions } from "./base.schema";

export interface IShelf {
  _id: string;
  ownerId: string;
  childId: string;
  name: string;
  seedName?: string;
  icon?: string;
  imageUri?: string;
  color?: string;
  order: number;
  hidden: boolean;
  source: "manual" | "voice" | "list" | "seed";
  parentId?: string | null;
  clientUpdatedAt: Date;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const ShelfSchema = new Schema<IShelf>(
  {
    ...baseSyncSchemaDefinition,
    name: {
      type: String,
      required: true,
      trim: true,
    },
    seedName: {
      type: String,
    },
    icon: {
      type: String,
    },
    imageUri: {
      type: String,
    },
    color: {
      type: String,
    },
    order: {
      type: Number,
      default: 0,
    },
    hidden: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      enum: ["manual", "voice", "list", "seed"],
      default: "manual",
    },
    parentId: {
      type: String,
      default: null,
      index: true,
    },
  },
  baseSchemaOptions
);

ShelfSchema.index({ ownerId: 1, updatedAt: -1 });
ShelfSchema.index({ childId: 1, updatedAt: -1 });
ShelfSchema.index({ childId: 1, parentId: 1, order: 1 });
ShelfSchema.index({ childId: 1, deletedAt: 1 });

export const Shelf = model<IShelf>("Shelf", ShelfSchema);
