import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CustomWord, LanguageCode } from "../types";
import { canonicalWordEn, wordLabel } from "./i18n";
import { getPictogramUrl } from "./aacPictograms";
import { listCategories } from "./customCategories";

/**
 * Next-word suggestions for the sentence strip (like a keyboard's predictive
 * row): after "I" it offers "want", "need", "like", "am"…, each shown as a
 * picture tile. Combines what this child actually said before (learned word
 * pairs, ranked first) with simple built-in grammar rules.
 */

const KEY = "angeltalk_word_pairs_v1";
let pairs: Record<string, Record<string, number>> = {};
let loaded = false;

export async function ensurePredictionLoaded(): Promise<void> {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) pairs = JSON.parse(raw);
  } catch {
    pairs = {};
  }
  loaded = true;
}

const en = (label: string) => (canonicalWordEn(label) || label).trim().toLowerCase();

/** Learn from a sentence the child spoke out loud. */
export function learnSentence(labels: string[]) {
  const words = labels.map(en).filter(Boolean);
  for (let i = 1; i < words.length; i++) {
    const prev = words[i - 1];
    const next = words[i];
    pairs[prev] = pairs[prev] ?? {};
    pairs[prev][next] = (pairs[prev][next] ?? 0) + 1;
  }
  AsyncStorage.setItem(KEY, JSON.stringify(pairs)).catch(() => {});
}

const FEELINGS = ["happy", "sad", "hungry", "thirsty", "tired", "sick", "angry", "scared", "hot", "cold", "excited", "calm", "hurt"];
const FOODS = ["water", "milk", "juice", "apple", "banana", "bread", "rice", "chicken", "pizza", "cookie", "sandwich"];
const PLACES = ["home", "school", "park", "bathroom", "outside", "bed", "car", "store"];
const DO_VERBS = ["eat", "drink", "go", "play", "sleep", "see", "read", "watch", "sing", "dance", "swim", "wash"];

const RULES: Record<string, string[]> = {
  i: ["want", "need", "like", "am", "feel", "can", "see", "have", "go", "love", "eat", "drink", "play"],
  you: ["are", "want", "like", "can", "go", "see", "have", "help", "play"],
  we: ["are", "want", "go", "can", "play", "eat", "like", "need", "have"],
  they: ["are", "want", "go", "can", "play", "eat", "like", "have"],
  he: ["is", "wants", "likes", "needs", "can", "has", "goes", "plays", "eats"],
  she: ["is", "wants", "likes", "needs", "can", "has", "goes", "plays", "eats"],
  it: ["is", "was", "hurts", "goes", "can"],
  want: ["to", "more", ...FOODS.slice(0, 4), "help", "play", "toy"],
  wants: ["to", "more", ...FOODS.slice(0, 4), "help", "play", "toy"],
  need: ["to", "help", "bathroom", "water", "more", "a", "break"],
  needs: ["to", "help", "bathroom", "water", "more"],
  like: ["to", "you", "this", "that", "play", "music", "apple", "ball"],
  likes: ["to", "you", "this", "that", "play", "music"],
  love: ["you", "mom", "dad", "this", "to"],
  am: FEELINGS,
  is: ["happy", "sad", "here", "big", "small", "hot", "cold", "good", "my", "not"],
  are: ["happy", "sad", "here", "my", "you", "good", "not"],
  feel: FEELINGS,
  feels: FEELINGS,
  to: [...DO_VERBS, ...PLACES.slice(0, 4)],
  can: ["i", "you", "go", "play", "have", "eat", "drink", "help", "see"],
  go: ["to", "home", "outside", "school", "park", "bathroom", "now"],
  goes: ["to", "home", "outside", "school", "park"],
  eat: [...FOODS.slice(3), "now", "more"],
  eats: [...FOODS.slice(3), "now"],
  drink: ["water", "milk", "juice", "tea", "more"],
  play: ["with", "ball", "outside", "game", "toys", "now", "more"],
  plays: ["with", "ball", "outside", "game"],
  with: ["me", "you", "mom", "dad", "friend", "ball"],
  see: ["you", "mom", "dad", "this", "that", "dog", "cat"],
  watch: ["tv", "you", "this", "that"],
  have: ["a", "more", "water", "food", "toy", "ball", "pain"],
  has: ["a", "more", "toy", "ball", "pain"],
  help: ["me", "please", "you"],
  more: ["please", "water", "food", "play", "juice"],
  this: ["is", "one", "please"],
  that: ["is", "one", "please"],
  my: ["mom", "dad", "toy", "ball", "turn", "friend", "book"],
  your: ["turn", "toy", "ball", "book"],
  the: ["ball", "book", "toy", "door", "car", "dog", "cat"],
  a: ["ball", "book", "toy", "drink", "snack", "break", "hug"],
  mom: ["is", "please", "help", "come", "go"],
  dad: ["is", "please", "help", "come", "go"],
  yes: ["please", "thank you", "more"],
  no: ["thank you", "more", "stop"],
  please: ["more", "help", "stop"],
  stop: ["please", "it", "that"],
  not: FEELINGS.slice(0, 6),
};

// Multi-word core tiles end in a word that already has a rule
const PHRASE_ALIASES: Record<string, string> = {
  "i want": "want",
  "i need": "need",
  "i feel": "feel",
  "i like": "like",
  "can i have": "have",
};

const FALLBACK = ["please", "more", "and", "now", "thank you", "stop"];

/** English labels for the most likely next words, best first. */
export function predictNext(sentenceLabels: string[], max = 10): string[] {
  if (sentenceLabels.length === 0) return [];
  const last = en(sentenceLabels[sentenceLabels.length - 1]);
  const prev = sentenceLabels.length > 1 ? en(sentenceLabels[sentenceLabels.length - 2]) : "";
  const key = PHRASE_ALIASES[last] ?? last;

  const learned = Object.entries(pairs[last] ?? pairs[key] ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w);

  let rule = RULES[key] ?? RULES[key.split(/\s+/).pop() ?? ""];
  if (key === "to" && (prev === "go" || prev === "goes")) rule = PLACES;
  if (!rule) rule = FALLBACK;

  const out: string[] = [];
  for (const w of [...learned, ...rule]) {
    if (w && w !== last && !out.includes(w)) out.push(w);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Google-style completions: each is 1–2 words that would follow the sentence
 * ("I want" -> ["to", "eat"], ["more", "please"], ["water"]…).
 */
export function predictPhrases(sentenceLabels: string[], max = 4): string[][] {
  if (sentenceLabels.length === 0) return [];
  const out: string[][] = [];
  for (const first of predictNext(sentenceLabels, max)) {
    const second = predictNext([...sentenceLabels, first], 3).find((w) => !FALLBACK.includes(w));
    out.push(second ? [first, second] : [first]);
  }
  return out;
}

/** Every visible board word, keyed by its English form (first one wins). */
function boardIndex(): Map<string, CustomWord> {
  const index = new Map<string, CustomWord>();
  for (const c of listCategories()) {
    if (c.hidden) continue;
    for (const w of c.words) {
      if (w.hidden) continue;
      const k = en(w.label);
      if (!index.has(k)) index.set(k, w);
    }
  }
  return index;
}

function pictogramTile(word: string, label: string, order = 0): CustomWord {
  return {
    id: `suggest-${word}`,
    label,
    phrase: label,
    emoji: "🔹",
    imageUri: getPictogramUrl(word) || undefined,
    useTextToSpeech: true,
    size: "md",
    order,
  };
}

/**
 * Turns predicted English words into board tiles: the child's own tile when the
 * word is on the board (keeps their picture / recorded voice), otherwise a
 * pictogram tile.
 */
export function suggestionTiles(predicted: string[], lang: LanguageCode): CustomWord[] {
  const index = boardIndex();
  return predicted.map((word, i) => index.get(word) ?? pictogramTile(word, wordLabel(word, lang) || word, i));
}

/** The tile for a word the child typed ("come" -> their Come tile, or a pictogram tile). */
export function tileForText(text: string, lang: LanguageCode): CustomWord {
  const typed = text.trim();
  const key = en(typed);
  const own = boardIndex().get(key);
  if (own) return own;
  const label = /[؀-ۿ]/.test(typed) ? typed : wordLabel(key, lang) || typed;
  return pictogramTile(key, label);
}

/** Words starting with what the child is typing, board words first ("co" -> come, cookie, cold…). */
export function searchWords(partial: string, lang: LanguageCode, max = 14): CustomWord[] {
  const q = partial.trim().toLowerCase();
  if (!q) return [];
  const hits: CustomWord[] = [];
  const seen = new Set<string>();
  const add = (key: string, tile: CustomWord) => {
    if (seen.has(key) || hits.length >= max) return;
    seen.add(key);
    hits.push(tile);
  };
  const index = boardIndex();
  // exact matches first, then prefix matches
  for (const pass of ["exact", "prefix"] as const) {
    for (const [key, w] of index) {
      const shown = (wordLabel(w.label, lang) || w.label).toLowerCase();
      const ok = pass === "exact" ? key === q || shown === q : key.startsWith(q) || shown.startsWith(q);
      if (ok) add(key, w);
    }
  }
  // common words from the suggestion rules that are not on the board yet
  const vocab = new Set([...Object.keys(RULES), ...Object.values(RULES).flat()]);
  for (const word of vocab) {
    if (word.startsWith(q)) add(word, pictogramTile(word, wordLabel(word, lang) || word));
  }
  return hits;
}
