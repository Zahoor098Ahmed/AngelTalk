import { Schema, model } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { CareTeamRole, CareTeamPermission, CareTeamStatus } from "../common/types";

export interface ICareTeam {
  _id: string;
  childId: string;
  userId: string;
  role: CareTeamRole;
  permissions: CareTeamPermission[];
  status: CareTeamStatus;
  invitedBy: string; // User ID of the parent
  createdAt?: Date;
  updatedAt?: Date;
}

const CareTeamSchema = new Schema<ICareTeam>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    childId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["slp", "educator"],
      required: true,
    },
    permissions: {
      type: [String],
      enum: ["view_board", "edit_board", "view_clinical", "write_clinical", "manage_schedule"],
      default: ["view_board"],
    },
    status: {
      type: String,
      enum: ["pending", "active", "revoked"],
      default: "pending",
      index: true,
    },
    invitedBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    _id: false,
  }
);

CareTeamSchema.index({ childId: 1, userId: 1 }, { unique: true });
CareTeamSchema.index({ userId: 1, status: 1 });

export const CareTeam = model<ICareTeam>("CareTeam", CareTeamSchema);
