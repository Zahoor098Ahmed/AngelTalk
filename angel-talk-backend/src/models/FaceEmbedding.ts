import { Schema, model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IFaceEmbedding {
  _id: string;
  ownerId: string;
  childId: string;
  vector: number[]; // Exactly 128 numbers
  isEnrolment: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const FaceEmbeddingSchema = new Schema<IFaceEmbedding>(
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
    childId: {
      type: String,
      required: true,
      index: true,
    },
    vector: {
      type: [Number],
      required: true,
      select: false, // Hidden by default for security
      validate: {
        validator: (v: number[]) => Array.isArray(v) && v.length === 128 && v.every((n) => typeof n === "number" && Number.isFinite(n)),
        message: "Face embedding vector must contain exactly 128 finite numbers",
      },
    },
    isEnrolment: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    _id: false,
  }
);

FaceEmbeddingSchema.index({ ownerId: 1, childId: 1 });

export const FaceEmbedding = model<IFaceEmbedding>("FaceEmbedding", FaceEmbeddingSchema);
