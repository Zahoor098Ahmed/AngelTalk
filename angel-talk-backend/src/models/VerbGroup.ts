import { Schema, model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IVerbFormItem {
  text: string;
  translations: Record<string, string>; // e.g. { "ar-SA": "يأكل", "ur-PK": "کھاتا ہے" }
}

export interface IVerbGroupForms {
  first: IVerbFormItem;
  s_es: IVerbFormItem;
  second: IVerbFormItem;
  third: IVerbFormItem;
  fourth: IVerbFormItem;
}

export interface IVerbGroup {
  _id: string;
  base: string; // unique lowercase, e.g. "eat"
  emoji?: string;
  pictogramId?: string;
  forms: IVerbGroupForms;
  active: boolean;
  /** "app" = built-in verb of the app (written by npm run seed:catalog); otherwise added in the admin panel */
  source?: string;
  editedByAdmin?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const VerbFormItemSchema = new Schema(
  {
    text: { type: String, required: true },
    translations: { type: Map, of: String, default: {} },
  },
  { _id: false }
);

const VerbGroupSchema = new Schema<IVerbGroup>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    base: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    emoji: {
      type: String,
    },
    pictogramId: {
      type: String,
    },
    forms: {
      first: { type: VerbFormItemSchema, required: true },
      s_es: { type: VerbFormItemSchema, required: true },
      second: { type: VerbFormItemSchema, required: true },
      third: { type: VerbFormItemSchema, required: true },
      fourth: { type: VerbFormItemSchema, required: true },
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    source: { type: String, index: true },
    editedByAdmin: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
    _id: false,
  }
);

export const VerbGroup = model<IVerbGroup>("VerbGroup", VerbGroupSchema);
