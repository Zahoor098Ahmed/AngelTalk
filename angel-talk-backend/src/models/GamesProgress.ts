import { Schema, model } from "mongoose";
import { baseSyncSchemaDefinition, baseSchemaOptions } from "./base.schema";
import { GameType } from "../common/types";

export interface IGamesProgress {
  _id: string;
  ownerId: string;
  childId: string;
  gameType: GameType;
  score: number;
  starsEarned: number;
  playedAt: Date;
  clientUpdatedAt: Date;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const GamesProgressSchema = new Schema<IGamesProgress>(
  {
    ...baseSyncSchemaDefinition,
    gameType: {
      type: String,
      enum: ["letters", "numbers", "shapes", "colors", "animals", "food", "emotions"],
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    starsEarned: {
      type: Number,
      default: 0,
    },
    playedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  baseSchemaOptions
);

GamesProgressSchema.index({ ownerId: 1, updatedAt: -1 });
GamesProgressSchema.index({ childId: 1, updatedAt: -1 });
GamesProgressSchema.index({ childId: 1, playedAt: -1 });

export const GamesProgress = model<IGamesProgress>("GamesProgress", GamesProgressSchema);
