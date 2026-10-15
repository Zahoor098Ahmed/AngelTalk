import { Schema, model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IDevice {
  _id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  platform: "ios" | "android" | "web";
  pushToken?: string;
  lastActiveAt: Date;
  revokedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const DeviceSchema = new Schema<IDevice>(
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
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    deviceName: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      enum: ["ios", "android", "web"],
      required: true,
    },
    pushToken: {
      type: String,
    },
    lastActiveAt: {
      type: Date,
      default: () => new Date(),
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

DeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

export const Device = model<IDevice>("Device", DeviceSchema);
