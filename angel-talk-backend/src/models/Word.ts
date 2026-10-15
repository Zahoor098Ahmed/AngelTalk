import { Schema, model } from "mongoose";
import { baseSyncSchemaDefinition, baseSchemaOptions } from "./base.schema";
import { TileSize, VerbFormTag } from "../common/types";

export interface IWord {
  _id: string;
  ownerId: string;
  childId: string;
  shelfId: string;
  label: string;
  phrase: string;
  translations: Map<string, string>;
  seedLabel?: string;
  emoji?: string;
  imageUri?: string;
  color?: string;
  audioUri?: string;
  useTextToSpeech: boolean;
  size: TileSize;
  order: number;
  hidden: boolean;
  isCustom: boolean;
  useCount: number;
  lastUsedAt?: Date | null;
  verbGroupId?: string | null;
  verbFormTag?: VerbFormTag | null;
  clientUpdatedAt: Date;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const WordSchema = new Schema<IWord>(
  {
    ...baseSyncSchemaDefinition,
    shelfId: {
      type: String,
      required: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    phrase: {
      type: String,
      required: true,
      trim: true,
    },
    translations: {
      type: Map,
      of: String,
      default: {},
    },
    seedLabel: {
      type: String,
    },
    emoji: {
      type: String,
    },
    imageUri: {
      type: String,
    },
    color: {
      type: String,
    },
    audioUri: {
      type: String,
    },
    useTextToSpeech: {
      type: Boolean,
      default: false,
    },
    size: {
      type: String,
      enum: ["sm", "md", "lg"],
      default: "md",
    },
    order: {
      type: Number,
      default: 0,
    },
    hidden: {
      type: Boolean,
      default: false,
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    useCount: {
      type: Number,
      default: 0,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    verbGroupId: {
      type: String,
      default: null,
      index: true,
    },
    verbFormTag: {
      type: String,
      enum: ["first", "s_es", "second", "third", "fourth"],
      default: null,
    },
  },
  baseSchemaOptions
);

WordSchema.index({ ownerId: 1, updatedAt: -1 });
WordSchema.index({ childId: 1, updatedAt: -1 });
WordSchema.index({ childId: 1, shelfId: 1, order: 1 });
WordSchema.index({ childId: 1, deletedAt: 1 });

export const Word = model<IWord>("Word", WordSchema);
