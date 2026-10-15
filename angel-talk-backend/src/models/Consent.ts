import { Schema, model } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { ConsentType } from "../common/types";

export interface IConsent {
  _id: string;
  userId: string;
  childId?: string;
  consentType: ConsentType;
  policyVersion: string;
  granted: boolean;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  revokedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const ConsentSchema = new Schema<IConsent>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    childId: {
      type: String,
      index: true,
    },
    consentType: {
      type: String,
      enum: ["data_processing", "face_biometrics", "slp_sharing"],
      required: true,
      index: true,
    },
    policyVersion: {
      type: String,
      required: true,
    },
    granted: {
      type: Boolean,
      required: true,
    },
    timestamp: {
      type: Date,
      default: () => new Date(),
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    _id: false,
  }
);

ConsentSchema.index({ userId: 1, consentType: 1, childId: 1 });

export const Consent = model<IConsent>("Consent", ConsentSchema);
