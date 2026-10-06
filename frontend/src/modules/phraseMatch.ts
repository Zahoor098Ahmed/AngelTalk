import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import type { PhraseMatch, PhraseLevel } from "../types";

export type { PhraseLevel };

const KEY = "kiddocare_phrase_library";

let cache: PhraseMatch[] = [];
let loaded = false;

/** Ensure the local folder for PhraseMatch images exists. */
const IMG_DIR = `${FileSystem.documentDirectory}phrases/`;
async function ensureDir() {
  try {
    const info = await FileSystem.getInfoAsync(IMG_DIR);
    if (!info.exists) await FileSystem.makeDirectoryAsync(IMG_DIR, { intermediates: true });
  } catch {
    /* ignore */
  }
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\u0621-\u064A\u0660-\u0669\u0900-\u097F\u0600-\u06FF]/g, " ").replace(/\s+/g, " ").trim();
}

export async function ensurePhraseLibraryLoaded(): Promise<void> {
  if (loaded) return;
  await ensureDir();
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as PhraseMatch[]) : [];
  } catch {
    cache = [];
  }
  loaded = true;
  if (cache.length === 0) seedStarterPrepositions();
}

function persist(): void {
  AsyncStorage.setItem(KEY, JSON.stringify(cache)).catch(() => {});
}

/**
 * Section 3.4 — Seed the library with a prepositions starter set using one
 * consistent object pair (book + table) covering in/on/under/above/below/near/far.
 * Images are rendered as simple composed text-tokens initially so the screen
 * works fully offline; a therapist may swap them for real photos via the
 * admin editor at any time.
 */
const PREPOSITION_SEED: {
  label: string;
  phrases: string[];
  category: string;
  level: PhraseLevel;
  glyph: string;
}[] = [
  { label: "The book is in something", phrases: ["book in", "in the", "inside", "book inside"], category: "Prepositions", level: 1, glyph: "📘▫️" },
  { label: "The book is on the table", phrases: ["book on table", "on the table", "on top", "on top of table"], category: "Prepositions", level: 1, glyph: "📘🔲" },
  { label: "The book is under the table", phrases: ["book under table", "under the table", "underneath", "below table"], category: "Prepositions", level: 1, glyph: "🔲▫️📘" },
  { label: "The book is above the table", phrases: ["book above table", "above the table", "over the table", "over"], category: "Prepositions", level: 2, glyph: "📘\n🔲" },
  { label: "The book is below the table", phrases: ["book below table", "below", "beneath"], category: "Prepositions", level: 2, glyph: "🔲\n📘" },
  { label: "The book is near the table", phrases: ["book near table", "next to", "beside", "close to"], category: "Prepositions", level: 2, glyph: "📘 🔲" },
  { label: "The book is far from the table", phrases: ["book far", "far from table", "far away", "distant"], category: "Prepositions", level: 3, glyph: "📘      🔲" },
];

function seedStarterPrepositions() {
  const now = Date.now();
  cache = PREPOSITION_SEED.map((p, i) => ({
    id: uid("ph"),
    triggerPhrases: p.phrases,
    imagePath: `seed:prep:${i}`,
    label: p.label,
    category: p.category,
    level: p.level,
    bookSource: null,
    licenseRef: "Built-in starter set — Angel Talk",
    createdAt: now,
    updatedAt: now,
    matchCount: 0,
  }));
  persist();
}

/** Reload from AsyncStorage — used after a backup restore. */
export async function reloadPhraseLibrary(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as PhraseMatch[]) : [];
  } catch {
    cache = [];
  }
  loaded = true;
}

export function listPhraseMatches(): PhraseMatch[] {
  return [...cache].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function listCategories(): string[] {
  const set = new Set(cache.map((p) => p.category).filter(Boolean));
  return [...set].sort();
}

export function filterPhraseMatches(opts: {
  category?: string | null;
  level?: PhraseLevel | null;
  bookSource?: string | null;
  search?: string;
}): PhraseMatch[] {
  const q = opts.search ? normalize(opts.search) : "";
  return cache.filter((p) => {
    if (opts.category && p.category !== opts.category) return false;
    if (opts.level && p.level !== opts.level) return false;
    if (opts.bookSource && (p.bookSource ?? "") !== opts.bookSource) return false;
    if (q) {
      const hay = normalize(`${p.label} ${p.triggerPhrases.join(" ")} ${p.category}`);
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getPhraseMatch(id: string): PhraseMatch | undefined {
  return cache.find((p) => p.id === id);
}

/**
 * Match raw free-form spoken text against the library. Enhanced with:
 * 1. Exact phrase match
 * 2. Substring needle match
 * 3. All-token set match
 * 4. Fuzzy token overlap (>60% common tokens)
 * 5. Spatial core-keyword matching (e.g. "under", "inside", "on", "above", "below", "near", "far")
 *
 * Returns the best matching entry or null. Increments matchCount on the stored entry.
 */
export function findMatchingPhrase(spoken: string): PhraseMatch | null {
  const text = normalize(spoken);
  if (!text) return null;

  const spokenTokens = text.split(/\s+/).filter(Boolean);
  if (spokenTokens.length === 0) return null;

  let bestEntry: PhraseMatch | null = null;
  let highestScore = 0;

  for (const entry of cache) {
    let entryScore = 0;

    for (const raw of entry.triggerPhrases) {
      const needle = normalize(raw);
      if (!needle) continue;

      if (text === needle) {
        entryScore = Math.max(entryScore, 100);
        break;
      }

      if (text.includes(needle) || needle.includes(text)) {
        entryScore = Math.max(entryScore, 85);
      }

      const needleTokens = needle.split(/\s+/).filter(Boolean);
      if (needleTokens.length === 0) continue;

      // Count matching tokens
      const matchedTokens = needleTokens.filter((tok) => text.includes(tok));
      const overlapRatio = matchedTokens.length / needleTokens.length;

      if (overlapRatio === 1) {
        entryScore = Math.max(entryScore, 75);
      } else if (overlapRatio >= 0.5) {
        entryScore = Math.max(entryScore, 50 + Math.round(overlapRatio * 20));
      }

      // Check key spatial/preposition keywords specifically
      const spatialKeywords = ["in", "inside", "on", "top", "under", "underneath", "below", "above", "over", "near", "beside", "close", "far", "distant"];
      for (const kw of spatialKeywords) {
        if (needleTokens.includes(kw) && spokenTokens.includes(kw)) {
          entryScore = Math.max(entryScore, 65);
        }
      }
    }

    if (entryScore > highestScore) {
      highestScore = entryScore;
      bestEntry = entry;
    }
  }

  // Threshold score of 50 or above is accepted
  if (bestEntry && highestScore >= 50) {
    console.log(`[phraseMatch] Matched "${spoken}" to "${bestEntry.label}" (score: ${highestScore})`);
    return hit(bestEntry);
  }

  return null;
}

function hit(entry: PhraseMatch): PhraseMatch {
  const idx = cache.findIndex((p) => p.id === entry.id);
  if (idx >= 0) {
    cache[idx] = { ...cache[idx], matchCount: cache[idx].matchCount + 1, updatedAt: Date.now() };
    persist();
    return cache[idx];
  }
  return entry;
}

export function resetMatchCounts(): void {
  cache = cache.map((p) => ({ ...p, matchCount: 0 }));
  persist();
}

/**
 * Copy any source image (uri) into the phrases directory and return its new
 * local path. The same PhraseMatch.imagePath is used by both starter seed
 * entries (seed:…) and imported/downloaded images.
 */
export async function importImage(srcUri: string, phraseId: string): Promise<string> {
  await ensureDir();
  const ext = srcUri.includes(".png") ? "png" : "jpg";
  const dest = `${IMG_DIR}${phraseId}.${ext}`;
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

export function createPhraseMatch(input: {
  triggerPhrases: string[];
  imagePath: string;
  label: string;
  category: string;
  level: PhraseLevel;
  bookSource?: string | null;
  licenseRef?: string | null;
}): PhraseMatch {
  const now = Date.now();
  const entry: PhraseMatch = {
    id: uid("ph"),
    triggerPhrases: [...new Set(input.triggerPhrases.map((s) => s.trim()).filter(Boolean))],
    imagePath: input.imagePath,
    label: input.label.trim(),
    category: input.category.trim() || "Uncategorized",
    level: input.level,
    bookSource: input.bookSource ?? null,
    licenseRef: input.licenseRef ?? null,
    createdAt: now,
    updatedAt: now,
    matchCount: 0,
  };
  cache = [entry, ...cache];
  persist();
  return entry;
}

export function updatePhraseMatch(id: string, patch: Partial<Pick<PhraseMatch, "triggerPhrases" | "imagePath" | "label" | "category" | "level" | "bookSource" | "licenseRef">>): PhraseMatch | undefined {
  const idx = cache.findIndex((p) => p.id === id);
  if (idx < 0) return undefined;
  const next = { ...cache[idx], updatedAt: Date.now() } as PhraseMatch;
  if (patch.triggerPhrases) next.triggerPhrases = [...new Set(patch.triggerPhrases.map((s) => s.trim()).filter(Boolean))];
  if (typeof patch.imagePath === "string") next.imagePath = patch.imagePath;
  if (typeof patch.label === "string") next.label = patch.label.trim();
  if (typeof patch.category === "string") next.category = patch.category.trim() || "Uncategorized";
  if (typeof patch.level === "number") next.level = patch.level;
  if ("bookSource" in patch) next.bookSource = patch.bookSource ?? null;
  if ("licenseRef" in patch) next.licenseRef = patch.licenseRef ?? null;
  cache[idx] = next;
  persist();
  return next;
}

export function deletePhraseMatch(id: string): void {
  cache = cache.filter((p) => p.id !== id);
  persist();
}

/** Total counts for the progress / admin overview. */
export function phraseStats() {
  const total = cache.length;
  const perLevel: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const perCategory: Record<string, number> = {};
  const matched = cache.reduce((s, p) => s + p.matchCount, 0);
  for (const p of cache) {
    perLevel[p.level] = (perLevel[p.level] || 0) + 1;
    perCategory[p.category] = (perCategory[p.category] || 0) + 1;
  }
  return { total, perLevel, perCategory, matched };
}

/** Backup/restore parity with customCategories. */
export function buildPhraseBackup() {
  return {
    version: 1,
    exportedAt: Date.now(),
    phraseCount: cache.length,
    phrases: [...cache],
  };
}

export interface PhraseRestoreReport {
  ok: boolean;
  restored: number;
  issues: string[];
}

export function restorePhraseBackup(data: unknown, mode: "replace" | "merge" = "merge"): PhraseRestoreReport {
  const issues: string[] = [];
  const file = data as { phrases?: unknown[] };
  if (!file || !Array.isArray(file.phrases)) {
    return { ok: false, restored: 0, issues: ["Phrase backup file is not valid."] };
  }
  const incoming = file.phrases.filter(
    (p): p is PhraseMatch => !!p && typeof (p as PhraseMatch).label === "string" && Array.isArray((p as PhraseMatch).triggerPhrases),
  );
  if (incoming.length !== file.phrases.length) issues.push("Some phrase entries were malformed and skipped.");
  if (mode === "replace") cache = incoming;
  else {
    const map = new Map(cache.map((c) => [c.id, c]));
    for (const p of incoming) map.set(p.id, p);
    cache = [...map.values()];
  }
  loaded = true;
  persist();
  return { ok: issues.length === 0, restored: cache.length, issues };
}
