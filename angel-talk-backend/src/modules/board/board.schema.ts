import { z } from "zod";

export const createShelfSchema = z.object({
  name: z.string().min(1, "Shelf name is required").trim(),
  seedName: z.string().optional(),
  icon: z.string().optional(),
  imageUri: z.string().optional(),
  color: z.string().optional(),
  order: z.number().default(0),
  hidden: z.boolean().default(false),
  source: z.enum(["manual", "voice", "list", "seed"]).default("manual"),
  parentId: z.string().nullable().optional(),
});

export const updateShelfSchema = z.object({
  name: z.string().min(1).trim().optional(),
  icon: z.string().optional(),
  imageUri: z.string().optional(),
  color: z.string().optional(),
  order: z.number().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().nullable().optional(),
});

export const createWordSchema = z.object({
  label: z.string().min(1, "Word label is required").trim(),
  phrase: z.string().min(1, "Spoken phrase is required").trim(),
  translations: z.record(z.string()).default({}),
  seedLabel: z.string().optional(),
  emoji: z.string().optional(),
  imageUri: z.string().optional(),
  color: z.string().optional(),
  audioUri: z.string().optional(),
  useTextToSpeech: z.boolean().default(false),
  size: z.enum(["sm", "md", "lg"]).default("md"),
  order: z.number().default(0),
  hidden: z.boolean().default(false),
  verbGroupId: z.string().nullable().optional(),
  verbFormTag: z.enum(["first", "s_es", "second", "third", "fourth"]).nullable().optional(),
});

export const updateWordSchema = z.object({
  label: z.string().min(1).trim().optional(),
  phrase: z.string().min(1).trim().optional(),
  translations: z.record(z.string()).optional(),
  emoji: z.string().optional(),
  imageUri: z.string().optional(),
  color: z.string().optional(),
  audioUri: z.string().optional(),
  useTextToSpeech: z.boolean().optional(),
  size: z.enum(["sm", "md", "lg"]).optional(),
  order: z.number().optional(),
  hidden: z.boolean().optional(),
  verbGroupId: z.string().nullable().optional(),
  verbFormTag: z.enum(["first", "s_es", "second", "third", "fourth"]).nullable().optional(),
});

export const bulkWordsSchema = z.object({
  rawText: z.string().min(1, "Raw text is required"),
  color: z.string().optional(),
});

