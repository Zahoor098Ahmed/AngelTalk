import { getPictogramUrl } from "./aacPictograms";
import { generateAllVerbForms } from "./verbForms";
import type { TileSize } from "../types";

export interface ParsedVoiceResult {
  intent: "category" | "subcategory" | "words";
  cleanName: string;
  items: string[];
  icon: string;
  color: string;
  imageUri?: string;
  rawText: string;
}

const COMMON_CATEGORY_ICONS: Record<string, string> = {
  apple: "🍎",
  fruit: "🍎",
  fruits: "🍎",
  banana: "🍌",
  food: "🍴",
  drink: "🥤",
  drinks: "🥤",
  snack: "🥨",
  snacks: "🥨",
  pizza: "🍕",
  burger: "🍔",
  "fast food": "🍔",
  animal: "🐶",
  animals: "🐶",
  pet: "🐱",
  pets: "🐱",
  vehicle: "🚗",
  vehicles: "🚗",
  car: "🚗",
  cars: "🚗",
  transport: "🚌",
  toy: "🧸",
  toys: "🧸",
  game: "🎮",
  games: "🎮",
  school: "🏫",
  places: "🏛️",
  place: "🏛️",
  park: "🌳",
  home: "🏠",
  house: "🏠",
  sport: "⚽",
  sports: "⚽",
  clothes: "👕",
  clothing: "👕",
  color: "🎨",
  colors: "🎨",
  feeling: "😊",
  feelings: "😊",
  people: "♡",
  family: "👨‍👩‍👧",
  action: "⚡",
  actions: "⚡",
  verb: "⚡",
  verbs: "⚡",
  weather: "☀️",
  music: "🎸",
  hygiene: "🛁",
  bathroom: "🚻",
  kitchen: "🍳",
  doctor: "👨‍⚕️",
  hospital: "🏥",
};

const SUGGESTED_COLORS = [
  "#235E50", // forest
  "#4A7FE6", // royal blue
  "#E67E22", // warm orange
  "#8A6BC9", // purple
  "#5C9A58", // green
  "#C96B6B", // coral red
  "#D46CAE", // magenta
  "#0284C7", // ocean
  "#D97706", // amber
];

/**
 * Filter out filler words, stuttering, speech recognition noise, and boilerplate speech prefixes.
 * Examples:
 * "create category of name of apple" -> "Apple"
 * "make a category of name of fruits" -> "Fruits"
 * "category of name of fast food" -> "Fast Food"
 * "apple ki category banao" -> "Apple"
 * "add shelf toys" -> "Toys"
 */
export function cleanVoiceSpeechName(raw: string): string {
  if (!raw) return "";
  let text = raw.trim();

  // 1. Remove speech filler sounds
  text = text.replace(/\b(uh|um|er|ah|hmm|haan|acha|please|plz)\b/gi, " ");

  // 2. Normalize common Urdu / Hindi phrasing
  // e.g. "apple ki category banao" -> "apple"
  text = text.replace(/^(.*)\s+(ki|ka|ke)\s+categor(y|ies)\s+(banao|banayein|karo|bana\s+do)/gi, "$1");
  text = text.replace(/\b(categor(y|ies)|shelf)\s+(banao|banayein|karo|bana\s+do)\b/gi, " ");
  text = text.replace(/\b(banao|banayein|bana\s+do)\b/gi, " ");

  // 3. Strip long boilerplate English command phrases (order matters: longest first)
  const prefixes = [
    // "create category of name of..."
    /^(?:please\s+)?(?:can\s+you\s+)?(?:create|make|add|build|open)\s+(?:a\s+|an\s+|the\s+|new\s+)?(?:categor(?:y|ies)|shelf|folder)\s+(?:of|for|with)?\s+(?:the\s+)?(?:name|title)\s+(?:of|is|as)?\s+/i,
    // "category of name of..."
    /^(?:the\s+)?(?:categor(?:y|ies)|shelf|folder)\s+(?:of|for)?\s+(?:the\s+)?(?:name|title)\s+(?:of|is|as)?\s+/i,
    // "name of category is..." / "name of..."
    /^(?:the\s+)?(?:name|title)\s+(?:of\s+)?(?:the\s+)?(?:categor(?:y|ies)|shelf)?\s+(?:is|as|of)?\s+/i,
    // "create a new category of / for / called..."
    /^(?:please\s+)?(?:can\s+you\s+)?(?:create|make|add|build|open)\s+(?:a\s+|an\s+|the\s+|new\s+)?(?:categor(?:y|ies)|shelf|folder)\s+(?:of|for|called|named)?\s+/i,
    // "new category of..."
    /^(?:a\s+|an\s+|the\s+)?new\s+(?:categor(?:y|ies)|shelf|folder)\s+(?:of|for|called|named)?\s+/i,
    // "category of..."
    /^(?:the\s+)?(?:categor(?:y|ies)|shelf|folder)\s+(?:of|for|called|named)?\s+/i,
    // "add word / words..."
    /^(?:please\s+)?(?:can\s+you\s+)?(?:add|create|make)\s+(?:the\s+)?(?:word|words)\s+/i,
  ];

  for (const regex of prefixes) {
    text = text.replace(regex, "");
  }

  // 4. Strip stray leading prepositions and noise words left over like "of ", "name of ", "to "
  text = text.replace(/^(?:of\s+name\s+of|name\s+of|of\s+|for\s+|to\s+|called\s+|named\s+|is\s+|a\s+|an\s+|the\s+)+/gi, "");

  // 5. Strip trailing prepositions/filler like " please", " category", " of"
  text = text.replace(/\s+(?:please|categor(?:y|ies)|shelf|banao)$/gi, "");
  text = text.replace(/\s+(?:of|for|to|the|a|an)$/gi, "");

  // 6. Clean punctuation & excessive spaces
  text = text.replace(/["'?!.;:,]/g, " ").replace(/\s+/g, " ").trim();

  // 7. Title-case words nicely
  return text
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Intelligent parser for full voice commands spoken by a parent.
 */
export function parseVoiceCategoryCommand(raw: string): ParsedVoiceResult {
  const lower = (raw || "").toLowerCase();
  const cleanName = cleanVoiceSpeechName(raw);

  // Detect Intent
  let intent: "category" | "subcategory" | "words" = "category";
  if (lower.includes("sub category") || lower.includes("sub-category") || lower.includes("sub folder")) {
    intent = "subcategory";
  } else if (lower.includes("add word") || lower.includes("new word") || lower.includes("add words") || lower.includes("words of")) {
    intent = "words";
  }

  // Split multiple items if comma, "and", or newlines are spoken
  let items: string[] = [];
  if (cleanName.includes(" And ") || cleanName.includes(",")) {
    items = cleanName
      .split(/(?:\s+And\s+|,|\n)+/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  } else if (cleanName) {
    items = [cleanName];
  }

  // Determine Icon
  const lookupKey = cleanName.toLowerCase();
  let icon = COMMON_CATEGORY_ICONS[lookupKey];
  if (!icon) {
    for (const [k, ic] of Object.entries(COMMON_CATEGORY_ICONS)) {
      if (lookupKey.includes(k) || k.includes(lookupKey)) {
        icon = ic;
        break;
      }
    }
  }
  if (!icon) {
    icon = intent === "words" ? "🔹" : "📁";
  }

  // Pick color pseudo-randomly based on string hash for consistency
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = (hash * 31 + cleanName.charCodeAt(i)) >>> 0;
  }
  const color = SUGGESTED_COLORS[hash % SUGGESTED_COLORS.length];

  // Try to match standard pictogram
  const imageUri = getPictogramUrl(cleanName) || (items[0] ? getPictogramUrl(items[0]) : undefined) || undefined;

  return {
    intent,
    cleanName: cleanName || "New Category",
    items: items.length > 0 ? items : [cleanName || "New Category"],
    icon,
    color,
    imageUri,
    rawText: raw,
  };
}
