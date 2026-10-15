import { SchemaDefinition } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export const baseSyncSchemaDefinition: SchemaDefinition = {
  _id: {
    type: String,
    default: () => uuidv4(),
  },
  ownerId: {
    type: String,
    required: true,
  },
  childId: {
    type: String,
    required: true,
  },
  clientUpdatedAt: {
    type: Date,
    required: true,
    default: () => new Date(),
  },
  deletedAt: {
    type: Date,
    default: null,
    index: true,
  },
};

export const baseSchemaOptions = {
  timestamps: true,
  versionKey: false as const,
  _id: false as const,
};
