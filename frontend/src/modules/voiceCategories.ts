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
  parentCategoryName?: string;
  subItems?: string[];
}

export const COMMON_CATEGORY_ICONS: Record<string, string> = {
  apple: "🍎",
  fruit: "🍎",
  fruits: "🍎",
  banana: "🍌",
  vegetable: "🥦",
  vegetables: "🥦",
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
  bird: "🦜",
  birds: "🦜",
  fish: "🐟",
  sea: "🐬",
  "sea creatures": "🐬",
  "sea animals": "🐬",
  wild: "🦁",
  "wild animals": "🦁",
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
  breakfast: "🥞",
  lunch: "🥪",
  dinner: "🍲",
  dessert: "🍰",
  desserts: "🍰",
  nature: "🌿",
  body: "🖐️",
  "body parts": "🖐️",
};

export const SUGGESTED_COLORS = [
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

export function getCategoryIconForName(name: string): string {
  if (!name) return "📁";
  const lookupKey = name.trim().toLowerCase();
  if (COMMON_CATEGORY_ICONS[lookupKey]) return COMMON_CATEGORY_ICONS[lookupKey];
  for (const [k, ic] of Object.entries(COMMON_CATEGORY_ICONS)) {
    if (lookupKey.includes(k) || k.includes(lookupKey)) {
      return ic;
    }
  }
  return "📁";
}

export function getCategoryColorForName(name: string): string {
  if (!name) return SUGGESTED_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return SUGGESTED_COLORS[hash % SUGGESTED_COLORS.length];
}

/**
 * Filter out filler words, stuttering, speech recognition noise, and boilerplate speech prefixes.
 * Retains delimiters like commas or newlines if present.
 */
export function cleanVoiceSpeechName(raw: string): string {
  if (!raw) return "";
  let text = raw.trim();

  // 1. Remove speech filler sounds
  text = text.replace(/\b(uh|um|er|ah|hmm|haan|acha|please|plz)\b/gi, " ");

  // 2. Normalize common Urdu / Hindi phrasing
  text = text.replace(/^(.*?)\s+(?:ki|ka|ke)\s+categor(?:y|ies)\s+(?:banao|banayein|karo|bana\s+do)/gi, "$1");
  text = text.replace(/\b(?:categor(?:y|ies)|shelf|shelves|subcategor(?:y|ies))\s+(?:banao|banayein|karo|bana\s+do)\b/gi, " ");
  text = text.replace(/\b(?:banao|banayein|bana\s+do)\b/gi, " ");

  // 3. Strip long boilerplate English command phrases
  const prefixes = [
    /^(?:please\s+)?(?:can\s+you\s+)?(?:create|make|add|build|open)\s+(?:bulk\s+)?(?:categories|shelves|subcategories|sub-categories|words)\s+(?:of|for|with)?\s+/i,
    /^(?:please\s+)?(?:can\s+you\s+)?(?:create|make|add|build|open)\s+(?:a\s+|an\s+|the\s+|new\s+)?(?:categor(?:y|ies)|shelf|shelves|folder|folders|subcategor(?:y|ies)|sub-categor(?:y|ies))\s+(?:of|for|with)?\s+(?:the\s+)?(?:name|title)\s+(?:of|is|as)?\s+/i,
    /^(?:the\s+)?(?:categor(?:y|ies)|shelf|shelves|folder|folders|subcategor(?:y|ies)|sub-categor(?:y|ies))\s+(?:of|for)?\s+(?:the\s+)?(?:name|title)\s+(?:of|is|as)?\s+/i,
    /^(?:the\s+)?(?:name|title)\s+(?:of\s+)?(?:the\s+)?(?:categor(?:y|ies)|shelf|shelves)?\s+(?:is|as|of)?\s+/i,
    /^(?:please\s+)?(?:can\s+you\s+)?(?:create|make|add|build|open)\s+(?:a\s+|an\s+|the\s+|new\s+|bulk\s+)?(?:categor(?:y|ies)|shelf|shelves|folder|folders|subcategor(?:y|ies)|sub-categor(?:y|ies))\s+(?:of|for|called|named)?\s+/i,
    /^(?:a\s+|an\s+|the\s+)?new\s+(?:categor(?:y|ies)|shelf|shelves|folder|folders|subcategor(?:y|ies)|sub-categor(?:y|ies))\s+(?:of|for|called|named)?\s+/i,
    /^(?:the\s+|bulk\s+)?(?:categor(?:y|ies)|shelf|shelves|folder|folders|subcategor(?:y|ies)|sub-categor(?:y|ies)|words)\s+(?:of|for|called|named)?\s+/i,
    /^(?:please\s+)?(?:can\s+you\s+)?(?:add|create|make)\s+(?:the\s+|bulk\s+)?(?:word|words)\s+(?:of|for|called)?\s+/i,
  ];

  for (const regex of prefixes) {
    text = text.replace(regex, "");
  }

  // 4. Strip stray leading prepositions and noise words
  text = text.replace(/^(?:bulk\s+|all\s+|of\s+name\s+of|name\s+of|of\s+|for\s+|to\s+|called\s+|named\s+|is\s+|a\s+|an\s+|the\s+)+/gi, "");

  // 5. Strip trailing prepositions/filler
  text = text.replace(/\s+(?:please|banao)$/gi, "");

  // 6. Clean punctuation while preserving commas and newlines
  text = text.replace(/["'?!.]/g, " ").replace(/[ \t]+/g, " ").trim();

  return text;
}

/** Single item cleaner */
function cleanSingleItem(str: string): string {
  if (!str) return "";
  let clean = cleanVoiceSpeechName(str);
  clean = clean.replace(/[,;]/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Intelligent parser for full voice commands spoken by a parent or child.
 * Supports:
 * - Single category / subcategory / word
 * - Bulk categories / subcategories / words (comma, "and", "aur", "اور", etc.)
 * - Hierarchical commands: "Category Fruits with subcategories Citrus, Berries, Tropical"
 */
export function parseVoiceCategoryCommand(raw: string): ParsedVoiceResult {
  const lower = (raw || "").toLowerCase();

  // 1. Detect Intent
  let intent: "category" | "subcategory" | "words" = "category";
  if (
    lower.includes("sub category") ||
    lower.includes("sub-category") ||
    lower.includes("sub categories") ||
    lower.includes("sub-categories") ||
    lower.includes("sub folder") ||
    lower.includes("subfolder") ||
    lower.includes("sub folders")
  ) {
    intent = "subcategory";
  } else if (
    lower.includes("add word") ||
    lower.includes("new word") ||
    lower.includes("add words") ||
    lower.includes("words of") ||
    lower.includes("words") ||
    lower.includes("alfaaz") ||
    lower.includes("lafz")
  ) {
    intent = "words";
  }

  // 2. Check for Hierarchical Command:
  // e.g. "Category Fruits with subcategories Citrus, Berries, Tropical"
  // or "Shelf Animals with subcategories Dogs, Cats, Birds"
  // or "Fruits : Apple, Banana, Orange"
  let parentCategoryName: string | undefined;
  let subItems: string[] | undefined;

  const hierarchicalMatch = raw.match(
    /(?:category|shelf|folder)?\s*(.*?)\s+(?:with\s+(?:the\s+)?(?:subcategories|sub-categories|sub\s+folders|words)|having\s+(?:subcategories|words)|:\s*)(.*)/i
  );
  if (hierarchicalMatch && hierarchicalMatch[1] && hierarchicalMatch[2]) {
    const parentCandidate = cleanSingleItem(hierarchicalMatch[1]);
    const childrenBlock = hierarchicalMatch[2];
    const parsedChildren = childrenBlock
      .split(/(?:,|\n|;|\s+and\s+|\s+aur\s+|\s+اور\s+|\s+plus\s+|\s+&\s+)+/i)
      .map(cleanSingleItem)
      .filter((s) => s.length > 0);

    if (parentCandidate && parsedChildren.length > 0) {
      parentCategoryName = parentCandidate;
      subItems = parsedChildren;
      const icon = getCategoryIconForName(parentCandidate);
      const color = getCategoryColorForName(parentCandidate);
      const imageUri = getPictogramUrl(parentCandidate) || undefined;
      return {
        intent: "category",
        cleanName: parentCandidate,
        items: [parentCandidate],
        icon,
        color,
        imageUri,
        rawText: raw,
        parentCategoryName,
        subItems,
      };
    }
  }

  // 3. Normal Clean Name & Multi-item Splitting
  const cleanedText = cleanVoiceSpeechName(raw);

  // Split multiple items if comma, semicolon, newline, "and", "aur", "اور", "&", or "plus" are present
  let items: string[] = [];
  const delimiterRegex = /(?:,|\n|;|\s+and\s+|\s+aur\s+|\s+اور\s+|\s+plus\s+|\s+&\s+)+/i;

  if (delimiterRegex.test(cleanedText)) {
    items = cleanedText
      .split(delimiterRegex)
      .map(cleanSingleItem)
      .filter((s) => s.length > 0);
  } else if (cleanedText) {
    const single = cleanSingleItem(cleanedText);
    if (single) items = [single];
  }

  const cleanName = items[0] || "New Category";

  // Determine Icon & Color
  const icon = getCategoryIconForName(cleanName);
  const color = getCategoryColorForName(cleanName);

  // Try to match standard pictogram
  const imageUri = getPictogramUrl(cleanName) || undefined;

  return {
    intent,
    cleanName,
    items: items.length > 0 ? items : [cleanName],
    icon,
    color,
    imageUri,
    rawText: raw,
  };
}
