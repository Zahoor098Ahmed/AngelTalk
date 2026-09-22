import type { LanguageCode } from "../types";

/**
 * Lightweight, rule-based grammar smoothing for sentences built by tapping
 * words from different AAC categories (e.g. "I" + "want" + "eat" -> "I want
 * to eat."). This is intentionally simple and safe: it only ever inserts a
 * small helper word or punctuation, never removes or reorders what the
 * child chose, so the result always still contains their original words in
 * their original order.
 *
 * English-only for now — translated vocab in other languages doesn't share
 * these small closed-class word lists, and a wrong insertion would be worse
 * than leaving the literal word order untouched.
 */

const FEELING_WORDS = new Set([
  "happy", "sad", "angry", "scared", "tired", "hurt", "sick", "excited",
  "calm", "hungry", "thirsty", "sleepy", "cold", "hot", "proud", "silly",
  "frustrated", "loved", "surprised", "confused", "shy",
]);

const VERB_AFTER_WANT = new Set([
  "eat", "drink", "play", "sleep", "read", "walk", "run", "sit", "wash",
  "open", "go", "help", "watch", "listen", "swim", "sing", "dance",
]);

const PLACE_NEEDS_TO_THE = new Set([
  "bathroom", "park", "car", "store", "kitchen", "playground", "bus",
  "school", "cafeteria", "store",
]);

const QUESTION_WORDS = new Set(["where", "what", "who", "why", "how", "when", "which"]);

const PRONOUN_BE: Record<string, string> = { i: "am", you: "are", he: "is", she: "is", we: "are", they: "are" };

/** Join tapped word labels into a smoother, grammatically-shaped sentence. */
export function smoothSentence(labelsIn: string[], lang: LanguageCode): string {
  const words = labelsIn.map((w) => w.trim()).filter(Boolean);
  if (words.length === 0) return "";
  if (lang !== "en-US") return words.join(" ");

  let out = [...words];
  let lower = out.map((w) => w.toLowerCase());

  // "I" / "you" / ... + feeling word -> insert the missing be-verb.
  if (out.length >= 2) {
    const be = PRONOUN_BE[lower[0]];
    if (be && FEELING_WORDS.has(lower[1])) {
      out.splice(1, 0, be);
      lower = out.map((w) => w.toLowerCase());
    }
  }

  // "want" + bare verb -> insert "to".
  for (let i = 0; i < out.length - 1; i++) {
    if (lower[i] === "want" && VERB_AFTER_WANT.has(lower[i + 1])) {
      out.splice(i + 1, 0, "to");
      lower = out.map((w) => w.toLowerCase());
    }
  }

  // "go" + bare place noun -> "go to the <place>".
  for (let i = 0; i < out.length - 1; i++) {
    if (lower[i] === "go" && PLACE_NEEDS_TO_THE.has(lower[i + 1])) {
      out.splice(i + 1, 0, "to", "the");
      lower = out.map((w) => w.toLowerCase());
      i += 2;
    }
  }

  let sentence = out.join(" ").replace(/\s+/g, " ").trim();
  if (!sentence) return "";
  sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  if (!/[.?!]$/.test(sentence)) {
    sentence += QUESTION_WORDS.has(lower[0]) ? "?" : ".";
  }
  return sentence;
}
