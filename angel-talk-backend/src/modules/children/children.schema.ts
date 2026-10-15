import { z } from "zod";

export const createChildSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  age: z.number().int().min(1).max(25),
  diagnoses: z
    .array(
      z.enum([
        "autism",
        "down_syndrome",
        "speech_delay",
        "adhd",
        "hearing_impairment",
        "visual_impairment",
        "dyslexia",
        "cerebral_palsy",
        "intellectual_disability",
        "sensory_processing",
        "non_verbal",
        "general",
      ])
    )
    .default(["general"]),
  photoUrl: z.string().optional(),
  settings: z
    .object({
      language: z.enum(["en-US", "ar-SA", "ur-PK", "hi-IN", "es-ES", "fr-FR"]).default("ar-SA"),
      voiceType: z.enum(["boy", "girl", "woman", "man"]).default("boy"),
      boardMode: z.enum(["phrase", "sentence"]).default("phrase"),
      bilingualDisplay: z.boolean().default(false),
      simpleMode: z.boolean().default(true),
      speechRate: z.number().min(0.5).max(1.5).default(0.9),
      boardColumns: z.number().int().min(2).max(6).default(3),
      highContrast: z.boolean().default(false),
      hapticsEnabled: z.boolean().default(true),
    })
    .optional(),
});

export const updateChildSchema = z.object({
  name: z.string().min(1).trim().optional(),
  age: z.number().int().min(1).max(25).optional(),
  diagnoses: z
    .array(
      z.enum([
        "autism",
        "down_syndrome",
        "speech_delay",
        "adhd",
        "hearing_impairment",
        "visual_impairment",
        "dyslexia",
        "cerebral_palsy",
        "intellectual_disability",
        "sensory_processing",
        "non_verbal",
        "general",
      ])
    )
    .optional(),
  photoUrl: z.string().optional(),
});

export const updateChildSettingsSchema = z.object({
  language: z.enum(["en-US", "ar-SA", "ur-PK", "hi-IN", "es-ES", "fr-FR"]).optional(),
  voiceType: z.enum(["boy", "girl", "woman", "man"]).optional(),
  boardMode: z.enum(["phrase", "sentence"]).optional(),
  bilingualDisplay: z.boolean().optional(),
  simpleMode: z.boolean().optional(),
  speechRate: z.number().min(0.5).max(1.5).optional(),
  boardColumns: z.number().int().min(2).max(6).optional(),
  highContrast: z.boolean().optional(),
  hapticsEnabled: z.boolean().optional(),
});

