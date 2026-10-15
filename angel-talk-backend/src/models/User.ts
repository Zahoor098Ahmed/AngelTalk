import { Schema, model } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { UserRole, UserStatus } from "../common/types";

export interface IUser {
  _id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  phoneNumber?: string;
  pinHash?: string;
  pinFailedAttempts: number;
  pinLockedUntil?: Date | null;
  status: UserStatus;
  lastLoginAt?: Date;
  tokenVersion: number;
  mfaSecret?: string;
  mfaEnabled: boolean;
  mfaBackupCodes?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["parent", "slp", "educator", "admin", "superadmin"],
      default: "parent",
      index: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    pinHash: {
      type: String,
      select: false,
    },
    pinFailedAttempts: {
      type: Number,
      default: 0,
    },
    pinLockedUntil: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
      index: true,
    },
    lastLoginAt: {
      type: Date,
    },
    tokenVersion: {
      type: Number,
      default: 1,
    },
    mfaSecret: {
      type: String,
      select: false,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaBackupCodes: {
      type: [String],
      select: false,
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    _id: false,
  }
);

export const User = model<IUser>("User", UserSchema);
