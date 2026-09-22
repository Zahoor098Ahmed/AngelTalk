import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import type { ContentReviewEntry, PhraseLevel, ReviewStatus } from "../types";
import { createPhraseMatch } from "./phraseMatch";

export type { ReviewStatus };

const KEY = "kiddocare_content_review_queue";

let cache: ContentReviewEntry[] = [];
let loaded = false;

const QUEUE_DIR = `${FileSystem.documentDirectory}review-queue/`;
async function ensureDir() {
  try {
    const info = await FileSystem.getInfoAsync(QUEUE_DIR);
    if (!info.exists) await FileSystem.makeDirectoryAsync(QUEUE_DIR, { intermediates: true });
  } catch {
    /* ignore */
  }
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function ensureContentQueueLoaded(): Promise<void> {
  if (loaded) return;
  await ensureDir();
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as ContentReviewEntry[]) : [];
  } catch {
    cache = [];
  }
  loaded = true;
}

function persist(): void {
  AsyncStorage.setItem(KEY, JSON.stringify(cache)).catch(() => {});
}

export function reloadContentQueue() {
  AsyncStorage.getItem(KEY)
    .then((raw) => {
      cache = raw ? (JSON.parse(raw) as ContentReviewEntry[]) : [];
    })
    .catch(() => {
      cache = [];
    });
  loaded = true;
}

export function listQueueEntries(status: ReviewStatus | "all" = "all"): ContentReviewEntry[] {
  const filtered = status === "all" ? cache : cache.filter((e) => e.status === status);
  return [...filtered].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return b.createdAt - a.createdAt;
  });
}

export function queueCounts() {
  return {
    total: cache.length,
    pending: cache.filter((e) => e.status === "pending").length,
    approved: cache.filter((e) => e.status === "approved").length,
    rejected: cache.filter((e) => e.status === "rejected").length,
  };
}

export function getQueueEntry(id: string): ContentReviewEntry | undefined {
  return cache.find((e) => e.id === id);
}

/**
 * Pipeline entry point: GDL manual ingest (and any other future auto-extract)
 * uses this to submit candidate phrase/image pairs to the review queue.
 *
 * Oxford content (Section 6.1) MUST NEVER pass through here because the
 * extraction step in that case must be fully manual (no AI/OCR); any Oxford
 * entry is added directly via the PhraseMatch management screen by a human
 * typing it in by hand.
 */
export function submitToReviewQueue(input: {
  phrase: string;
  suggestedVariations?: string[];
  imagePath: string;
  suggestedLabel: string;
  suggestedCategory?: string;
  suggestedLevel?: PhraseLevel;
  source: string;
  sourceLicense: string;
}): ContentReviewEntry {
  const entry: ContentReviewEntry = {
    id: uid("rq"),
    phrase: input.phrase.trim(),
    suggestedVariations: (input.suggestedVariations || []).map((s) => s.trim()).filter(Boolean),
    imagePath: input.imagePath,
    suggestedLabel: input.suggestedLabel.trim(),
    suggestedCategory: (input.suggestedCategory || "Imported").trim() || "Imported",
    suggestedLevel: input.suggestedLevel || 2,
    source: input.source.trim() || "Unknown source",
    sourceLicense: input.sourceLicense.trim() || "Unspecified",
    status: "pending",
    createdAt: Date.now(),
    reviewedAt: null,
    reviewerNote: null,
  };
  cache = [entry, ...cache];
  persist();
  return entry;
}

/**
 * Edit fields of a pending review entry before the reviewer clicks approve
 * (e.g. fix a typo in suggestedLabel, swap/crop the image).
 */
export function updatePendingEntry(
  id: string,
  patch: Partial<Pick<ContentReviewEntry, "phrase" | "suggestedVariations" | "imagePath" | "suggestedLabel" | "suggestedCategory" | "suggestedLevel" | "source" | "sourceLicense" | "reviewerNote">>,
): ContentReviewEntry | undefined {
  const idx = cache.findIndex((e) => e.id === id);
  if (idx < 0) return undefined;
  const next = { ...cache[idx] } as ContentReviewEntry;
  if (typeof patch.phrase === "string") next.phrase = patch.phrase.trim();
  if (Array.isArray(patch.suggestedVariations)) next.suggestedVariations = patch.suggestedVariations.map((s) => s.trim()).filter(Boolean);
  if (typeof patch.imagePath === "string") next.imagePath = patch.imagePath;
  if (typeof patch.suggestedLabel === "string") next.suggestedLabel = patch.suggestedLabel.trim();
  if (typeof patch.suggestedCategory === "string") next.suggestedCategory = patch.suggestedCategory.trim() || "Imported";
  if (typeof patch.suggestedLevel === "number") next.suggestedLevel = patch.suggestedLevel;
  if (typeof patch.source === "string") next.source = patch.source.trim() || next.source;
  if (typeof patch.sourceLicense === "string") next.sourceLicense = patch.sourceLicense.trim() || next.sourceLicense;
  if (typeof patch.reviewerNote === "string") next.reviewerNote = patch.reviewerNote || null;
  cache[idx] = next;
  persist();
  return next;
}

/**
 * Approve a pending item and publish it to the live PhraseMatch library.
 * Attaches bookSource + licenseRef for GDL attribution compliance (Section 6.2
 * — CC-BY derivative attribution required).
 */
export function approveEntry(id: string): boolean {
  const idx = cache.findIndex((e) => e.id === id);
  if (idx < 0) return false;
  const entry = cache[idx];
  const now = Date.now();
  createPhraseMatch({
    triggerPhrases: [entry.phrase, ...entry.suggestedVariations],
    imagePath: entry.imagePath,
    label: entry.suggestedLabel,
    category: entry.suggestedCategory,
    level: entry.suggestedLevel,
    bookSource: entry.source,
    licenseRef: entry.sourceLicense,
  });
  cache[idx] = { ...entry, status: "approved", reviewedAt: now };
  persist();
  return true;
}

export function rejectEntry(id: string, note?: string): boolean {
  const idx = cache.findIndex((e) => e.id === id);
  if (idx < 0) return false;
  cache[idx] = { ...cache[idx], status: "rejected", reviewedAt: Date.now(), reviewerNote: note ? note.trim() : cache[idx].reviewerNote };
  persist();
  return true;
}

export function deleteQueueEntry(id: string): void {
  cache = cache.filter((e) => e.id !== id);
  persist();
}

export function clearReviewed() {
  cache = cache.filter((e) => e.status === "pending");
  persist();
}

/** Image import helper — copies an incoming file into the queue directory. */
export async function importQueueImage(srcUri: string, entryId: string): Promise<string> {
  await ensureDir();
  const ext = srcUri.includes(".png") ? "png" : "jpg";
  const dest = `${QUEUE_DIR}${entryId}.${ext}`;
  try {
    const info = await FileSystem.getInfoAsync(srcUri);
    if (info.exists && srcUri.startsWith("file://")) {
      try {
        await FileSystem.copyAsync({ from: srcUri, to: dest });
        return dest;
      } catch {
        return srcUri;
      }
    }
  } catch {
    /* fall through */
  }
  if (srcUri.startsWith("http") || srcUri.startsWith("data:")) {
    try {
      const { uri } = await FileSystem.downloadAsync(srcUri, dest);
      return uri;
    } catch {
      return srcUri;
    }
  }
  return srcUri;
}
