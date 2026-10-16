import { Schema, model } from "mongoose";
import { baseSyncSchemaDefinition, baseSchemaOptions } from "./base.schema";
import { StoryCategory } from "../common/types";

export interface ISocialStoryPage {
  text: string;
  imageUri?: string;
  emoji?: string;
  pictogramName?: string;
}

export interface ISocialStory {
  _id: string;
  ownerId: string;
  childId: string;
  title: string;
  category: StoryCategory;
  icon: string;
  description: string;
  coverImage?: string;
  pages: ISocialStoryPage[];
  clientUpdatedAt: Date;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const SocialStoryPageSchema = new Schema(
  {
    text: { type: String, required: true },
    imageUri: { type: String },
    emoji: { type: String },
    pictogramName: { type: String },
  },
  { _id: false }
);

const SocialStorySchema = new Schema<ISocialStory>(
  {
    ...baseSyncSchemaDefinition,
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["routine", "health", "school", "emotions", "social", "custom"],
      default: "custom",
    },
    icon: {
      type: String,
      default: "📖",
    },
    description: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
    },
    pages: {
      type: [SocialStoryPageSchema],
      default: [],
      validate: {
        validator: (pages: ISocialStoryPage[]) => pages.length <= 30,
        message: "A social story can have at most 30 pages",
      },
    },
  },
  // Social stories are not shown in the app right now: don't create an empty collection on start-up
  { ...baseSchemaOptions, autoCreate: false, autoIndex: false }
);

SocialStorySchema.index({ ownerId: 1, updatedAt: -1 });
SocialStorySchema.index({ childId: 1, updatedAt: -1 });
SocialStorySchema.index({ childId: 1, category: 1 });

export const SocialStory = model<ISocialStory>("SocialStory", SocialStorySchema);
