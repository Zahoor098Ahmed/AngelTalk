import { Schema, model } from "mongoose";
import { baseSyncSchemaDefinition, baseSchemaOptions } from "./base.schema";

export interface IEmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface IPasscard {
  _id: string;
  ownerId: string;
  childId: string;
  emergencyContacts: IEmergencyContact[];
  communicationStyle: string;
  sensoryTriggers: string[];
  calmingStrategies: string[];
  allergies: string[];
  dietaryRestrictions?: string;
  specialInstructions?: string;
  clientUpdatedAt: Date;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const EmergencyContactSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, required: true },
  },
  { _id: false }
);

const PasscardSchema = new Schema<IPasscard>(
  {
    ...baseSyncSchemaDefinition,
    emergencyContacts: {
      type: [EmergencyContactSchema],
      default: [],
    },
    communicationStyle: {
      type: String,
      default: "Visual AAC communicator",
    },
    sensoryTriggers: {
      type: [String],
      default: [],
    },
    calmingStrategies: {
      type: [String],
      default: [],
    },
    allergies: {
      type: [String],
      default: [],
    },
    dietaryRestrictions: {
      type: String,
      default: "",
    },
    specialInstructions: {
      type: String,
      default: "",
    },
  },
  baseSchemaOptions
);

PasscardSchema.index({ childId: 1 }, { unique: true });
PasscardSchema.index({ ownerId: 1, updatedAt: -1 });

export const Passcard = model<IPasscard>("Passcard", PasscardSchema);
