import { Schema, model } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { DiagnosisType, VerbFormTag } from "../common/types";

export interface ITemplateWord {
  label: string;
  phrase: string;
  translations: Record<string, string>; // { "ar-SA": "ماء", "ur-PK": "پانی" }
  emoji?: string;
  imageUri?: string;
  color?: string;
  verbFormTag?: VerbFormTag;
  order: number;
}

export interface ISeedTemplate {
  _id: string;
  name: string; // e.g. "Food", "Actions", "Feelings", "Quick Access"
  seedName: string;
  icon?: string;
  color?: string;
  words: ITemplateWord[];
  forDiagnoses: DiagnosisType[];
  active: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const TemplateWordSchema = new Schema(
  {
    label: { type: String, required: true },
    phrase: { type: String, required: true },
    translations: { type: Map, of: String, default: {} },
    emoji: { type: String },
    imageUri: { type: String },
    color: { type: String },
    verbFormTag: { type: String, enum: ["first", "s_es", "second", "third", "fourth"] },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const SeedTemplateSchema = new Schema<ISeedTemplate>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    seedName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    icon: {
      type: String,
    },
    color: {
      type: String,
    },
    words: {
      type: [TemplateWordSchema],
      default: [],
    },
    forDiagnoses: {
      type: [String],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    _id: false,
  }
);

export const SeedTemplate = model<ISeedTemplate>("SeedTemplate", SeedTemplateSchema);
