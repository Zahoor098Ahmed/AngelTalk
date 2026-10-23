import { Schema, model } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { DiagnosisType, LanguageCode, VoiceType, BoardMode } from "../common/types";

export interface IChildSettings {
  language: LanguageCode;
  voiceType: VoiceType;
  boardMode: BoardMode;
  bilingualDisplay: boolean;
  simpleMode: boolean;
  speechRate: number; // 0.5 - 1.5
  boardColumns: number; // 2 - 6
  highContrast: boolean;
  hapticsEnabled: boolean;
  /** Talk board: verb forms shown (1st, s, 2nd, 3rd, 4th) and noun forms shown (one, many, ones, manys). */
  visibleVerbForms?: string[];
  visibleNounForms?: string[];
  /** Talk board tiles per row; 0 = automatic. */
  tilesPerRow?: number;
}

export interface IChildRewards {
  stars: number;
  badges: string[];
  consecutiveDays: number;
  lastActiveDate?: string | null; // YYYY-MM-DD
}

export interface IChildFaceMeta {
  consent: boolean;
  consentAt?: Date | null;
  version: number;
  enrolledAt?: Date | null;
}

export interface IChild {
  _id: string;
  ownerId: string;
  name: string;
  age: number;
  diagnoses: DiagnosisType[];
  photoUrl?: string;
  settings: IChildSettings;
  rewards: IChildRewards;
  face: IChildFaceMeta;
  clientUpdatedAt: Date;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const ChildSchema = new Schema<IChild>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 1,
      max: 25,
    },
    diagnoses: {
      type: [String],
      default: ["general"],
    },
    photoUrl: {
      type: String,
    },
    settings: {
      language: {
        type: String,
        default: "ar-SA", // Arabic-first for Saudi deployment
      },
      voiceType: {
        type: String,
        enum: ["boy", "girl", "woman", "man"],
        default: "boy",
      },
      boardMode: {
        type: String,
        enum: ["phrase", "sentence"],
        default: "phrase",
      },
      bilingualDisplay: {
        type: Boolean,
        default: false,
      },
      simpleMode: {
        type: Boolean,
        default: true,
      },
      speechRate: {
        type: Number,
        default: 0.9,
        min: 0.5,
        max: 1.5,
      },
      boardColumns: {
        type: Number,
        default: 3,
        min: 2,
        max: 6,
      },
      highContrast: {
        type: Boolean,
        default: false,
      },
      hapticsEnabled: {
        type: Boolean,
        default: true,
      },
      visibleVerbForms: {
        type: [String],
        default: undefined,
      },
      visibleNounForms: {
        type: [String],
        default: undefined,
      },
      tilesPerRow: {
        type: Number,
        default: 0,
        min: 0,
        max: 12,
      },
    },
    rewards: {
      stars: {
        type: Number,
        default: 0,
      },
      badges: {
        type: [String],
        default: [],
      },
      consecutiveDays: {
        type: Number,
        default: 0,
      },
      lastActiveDate: {
        type: String,
        default: null,
      },
    },
    face: {
      consent: {
        type: Boolean,
        default: false,
      },
      consentAt: {
        type: Date,
        default: null,
      },
      version: {
        type: Number,
        default: 1,
      },
      enrolledAt: {
        type: Date,
        default: null,
      },
    },
    clientUpdatedAt: {
      type: Date,
      default: () => new Date(),
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    _id: false,
  }
);

ChildSchema.index({ ownerId: 1, updatedAt: -1 });
ChildSchema.index({ ownerId: 1, deletedAt: 1 });

export const Child = model<IChild>("Child", ChildSchema);
