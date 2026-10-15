import { Schema, model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IRefreshToken {
  _id: string;
  userId: string;
  tokenHash: string;
  userAgent?: string;
  ip?: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
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
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userAgent: {
      type: String,
    },
    ip: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0, // MongoDB TTL index
    },
    revokedAt: {
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

export const RefreshToken = model<IRefreshToken>("RefreshToken", RefreshTokenSchema);
