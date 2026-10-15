import { TableConfig } from "./sync.types";
import { Child } from "../../models/Child";
import { Shelf } from "../../models/Shelf";
import { Word } from "../../models/Word";
import { ScheduleTask } from "../../models/ScheduleTask";
import { SocialStory } from "../../models/SocialStory";
import { CareLog } from "../../models/CareLog";
import { TherapyGoal } from "../../models/TherapyGoal";
import { ClinicalNote } from "../../models/ClinicalNote";
import { Passcard } from "../../models/Passcard";
import { GamesProgress } from "../../models/GamesProgress";
import { SentenceLog } from "../../models/SentenceLog";
import { UsageSummary } from "../../models/UsageSummary";

export const SYNC_TABLE_REGISTRY: Record<string, TableConfig> = {
  children: {
    model: Child,
    allowedFields: ["name", "age", "diagnoses", "photoUrl", "settings", "rewards", "face"],
    ownerOnly: true,
  },
  shelves: {
    model: Shelf,
    allowedFields: [
      "name",
      "seedName",
      "icon",
      "imageUri",
      "color",
      "order",
      "hidden",
      "source",
      "parentId",
    ],
    requiredPermission: "edit_board",
  },
  words: {
    model: Word,
    allowedFields: [
      "shelfId",
      "label",
      "phrase",
      "translations",
      "seedLabel",
      "emoji",
      "imageUri",
      "color",
      "audioUri",
      "useTextToSpeech",
      "size",
      "order",
      "hidden",
      "isCustom",
      "useCount",
      "lastUsedAt",
      "verbGroupId",
      "verbFormTag",
    ],
    requiredPermission: "edit_board",
    additiveCounters: ["useCount"],
  },
  scheduletasks: {
    model: ScheduleTask,
    allowedFields: ["title", "time", "emoji", "pictogram", "order", "dayOfWeek", "completedDates"],
    requiredPermission: "manage_schedule",
  },
  socialstories: {
    model: SocialStory,
    allowedFields: ["title", "category", "icon", "description", "coverImage", "pages"],
    requiredPermission: "edit_board",
  },
  carelogs: {
    model: CareLog,
    allowedFields: [
      "date",
      "mood",
      "sensoryTriggers",
      "meltdownDurationMin",
      "communicationWins",
      "notes",
      "loggedBy",
    ],
    requiredPermission: "write_clinical",
  },
  therapygoals: {
    model: TherapyGoal,
    allowedFields: [
      "title",
      "category",
      "targetCount",
      "currentCount",
      "unit",
      "completed",
      "prescribedBy",
      "assignedDate",
      "notes",
    ],
    requiredPermission: "write_clinical",
    additiveCounters: ["currentCount"],
  },
  clinicalnotes: {
    model: ClinicalNote,
    allowedFields: ["authorId", "date", "title", "content", "recommendations"],
    requiredPermission: "write_clinical",
  },
  passcards: {
    model: Passcard,
    allowedFields: [
      "emergencyContacts",
      "communicationStyle",
      "sensoryTriggers",
      "calmingStrategies",
      "allergies",
      "dietaryRestrictions",
      "specialInstructions",
    ],
    ownerOnly: true,
  },
  gamesprogress: {
    model: GamesProgress,
    allowedFields: ["gameType", "score", "starsEarned", "playedAt"],
    requiredPermission: "view_board",
    additiveCounters: ["score", "starsEarned"],
  },
  sentencelogs: {
    model: SentenceLog,
    allowedFields: ["words", "text", "length", "spokenAt"],
    requiredPermission: "view_board",
  },
  usagesummaries: {
    model: UsageSummary,
    allowedFields: [
      "wordTotals",
      "wordsByDay",
      "scheduleByDay",
      "lastPlayedDate",
      "longestSentenceLength",
      "longestSentenceWords",
      "sentencesSpoken",
      "correctionsUsed",
    ],
    ownerOnly: true,
    additiveCounters: ["sentencesSpoken", "correctionsUsed"],
  },
};

