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
  text = text.replace(/\b(?:alfaaz|lafz|words|word)\s+(?:banao|banayein|dalo|rakho|add\s+karo|karo)\b/gi, " ");
  text = text.replace(/^(?:alfaaz|lafz|words|word|categories|subcategories|shelves)\s*[:=-]?\s*/gi, "");
  text = text.replace(/^(?:catogirese|catogies|subcatogirese)\s*[:=-]?\s*/gi, "");
  text = text.replace(/\b(?:banao|banayein|bana\s+do)\b/gi, " ");

  // 3. Strip long boilerplate English command phrases
  const prefixes = [
    /^(?:please\s+)?(?:can\s+you\s+)?(?:create|make|add|build|open)\s+(?:bulk\s+)?(?:categories|shelves|subcategories|sub-categories|words|alfaaz)\s+(?:of|for|with)?\s+/i,
    /^(?:please\s+)?(?:can\s+you\s+)?(?:create|make|add|build|open)\s+(?:a\s+|an\s+|the\s+|new\s+)?(?:categor(?:y|ies)|shelf|shelves|folder|folders|subcategor(?:y|ies)|sub-categor(?:y|ies))\s+(?:of|for|with)?\s+(?:the\s+)?(?:name|title)\s+(?:of|is|as)?\s+/i,
    /^(?:the\s+)?(?:categor(?:y|ies)|shelf|shelves|folder|folders|subcategor(?:y|ies)|sub-categor(?:y|ies))\s+(?:of|for)?\s+(?:the\s+)?(?:name|title)\s+(?:of|is|as)?\s+/i,
    /^(?:the\s+)?(?:name|title)\s+(?:of\s+)?(?:the\s+)?(?:categor(?:y|ies)|shelf|shelves)?\s+(?:is|as|of)?\s+/i,
    /^(?:please\s+)?(?:can\s+you\s+)?(?:create|make|add|build|open)\s+(?:a\s+|an\s+|the\s+|new\s+|bulk\s+)?(?:categor(?:y|ies)|shelf|shelves|folder|folders|subcategor(?:y|ies)|sub-categor(?:y|ies))\s+(?:of|for|called|named)?\s+/i,
    /^(?:a\s+|an\s+|the\s+)?new\s+(?:categor(?:y|ies)|shelf|shelves|folder|folders|subcategor(?:y|ies)|sub-categor(?:y|ies))\s+(?:of|for|called|named)?\s+/i,
    /^(?:the\s+|bulk\s+)?(?:categor(?:y|ies)|shelf|shelves|folder|folders|subcategor(?:y|ies)|sub-categor(?:y|ies)|words|alfaaz)\s+(?:of|for|called|named)?\s+/i,
    /^(?:please\s+)?(?:can\s+you\s+)?(?:add|create|make)\s+(?:the\s+|bulk\s+)?(?:word|words|alfaaz|lafz)\s+(?:of|for|called)?\s+/i,
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

// --- Full-tree voice plan (shelves -> sub-categories -> words in ONE utterance) ---

/** Every node has a stable id so the caregiver can rename/remove it and keep its picture. */
export interface VoicePlanWord {
  id: string;
  name: string;
}

export interface VoicePlanSub {
  id: string;
  name: string;
  words: VoicePlanWord[];
}

export interface VoicePlanShelf {
  id: string;
  /** null = no shelf was spoken; use the shelf selected in the modal */
  name: string | null;
  subs: VoicePlanSub[];
  /** Words spoken right after the shelf with no sub-category in between */
  words: VoicePlanWord[];
}

export interface VoicePlan {
  shelves: VoicePlanShelf[];
  /** true when the utterance mixes levels (shelf + subs, sub + words, ...) */
  nested: boolean;
  shelfCount: number;
  subCount: number;
  wordCount: number;
}

type MarkerKind = "shelf" | "sub" | "words";

// Sub-category variants must come before plain "category" so "sub category" wins.
const PLAN_MARKER_RE = new RegExp(
  "(^|[^a-z\\u0600-\\u06FF])(" +
    [
      // sub-category + common speech-engine mishearings ("sub period", "sub catgires", "sab category")
      "s[ua]b[\\s-]?[ck]at[aeiou]?g[a-z]*", "s[ua]b[\\s-]?periods?", "sub[\\s-]?cat(?:s)?", "sub[\\s-]?folders?",
      "سب\\s?کیٹیگریز?", "سب\\s?کیٹگری", "ذیلی\\s?زمرہ", "فئات\\s?فرعية", "فئة\\s?فرعية",
      // category + mishearings ("catgires", "catagory", "catogirese", "katgori"); never plain "cat"
      "[ck]at[aeiou]?g[a-z]*", "shel(?:f|ves)", "folders?",
      "کیٹیگریز?", "کیٹگری", "زمرہ", "فئات", "فئة",
      "words?", "alfaaz", "lafz", "الفاظ", "لفظ", "كلمات", "كلمة", "کلمات",
    ].join("|") +
    ")(?=$|[^a-z\\u0600-\\u06FF])",
  "gi",
);

function markerKind(m: string): MarkerKind {
  const s = m.toLowerCase();
  if (/^s[ua]b|سب|ذیلی|فرعية/.test(s)) return "sub";
  if (/^(word|alfaaz|lafz)|الفاظ|لفظ|كلم|کلم/.test(s)) return "words";
  return "shelf";
}

function markerIsPlural(m: string): boolean {
  const s = m.toLowerCase();
  return /(ies|ves|s|se|alfaaz|الفاظ|كلمات|کلمات|فئات|یز)$/.test(s);
}

// Connector / command words that can sit at the edges of a spoken item ("fruits with", "add", "in it")
const EDGE_FILLER_RE =
  /^(?:create|make|add|build|new|the|a|an|with|having|has|have|named|called|name|of|in|it|inside|under|into|to|for|then|also|please|is|are|which|that|banao|banayein|bana|do|karo|mein|me|main|ke|ki|ka|andar|aur|and|اور|في|و|میں|کے|کی|کا|بناؤ|بنائیں)$/i;

/**
 * Trim command words from the edges of an item. A single remaining word is kept
 * (AAC words like "me", "is", "do" are real words) unless `all` is set (lead text).
 */
function stripEdgeFillers(item: string, all = false): string {
  const tokens = item.split(/\s+/).filter(Boolean);
  const min = all ? 0 : 1;
  while (tokens.length > min && EDGE_FILLER_RE.test(tokens[0])) tokens.shift();
  while (tokens.length > min && EDGE_FILLER_RE.test(tokens[tokens.length - 1])) tokens.pop();
  return tokens.join(" ");
}

function splitPlanItems(content: string, plural: boolean, isLead = false): string[] {
  let text = content.replace(/["'?!.]/g, " ").replace(/\b(?:uh|um|er|ah|hmm)\b/gi, " ").trim();
  // "a new one called toys" / "the name of book" -> only what follows the naming phrase
  const afterName = text.replace(/^.*\b(?:called|named|titled|name\s+of|name\s+is|naam)\b\s*/i, "").trim();
  if (afterName && afterName !== text) text = afterName;
  if (!text) return [];
  const delim = /(?:,|\n|;|\s+and\s+|\s+aur\s+|\s+اور\s+|\s+و\s+|\s+plus\s+|\s+&\s+|\s+then\s+)+/i;
  let parts = delim.test(text) ? text.split(delim) : [text];
  parts = parts.map((p) => stripEdgeFillers(p, isLead)).filter(Boolean);
  // Speech engines often drop commas: "categories fruits animals vehicles"
  if (plural && parts.length === 1 && !delim.test(text) && parts[0].includes(" ")) {
    const tokens = parts[0].split(/\s+/);
    const kept = tokens.filter((w) => !EDGE_FILLER_RE.test(w));
    parts = kept.length > 0 ? kept : tokens;
  }
  // Drop pieces that are only a command word ("citrus and add words ..." -> "add")
  const commandOnly = /^(?:create|make|add|build|new|with|having|then|also|please|named|called|banao|banayein|bana|karo|بناؤ|بنائیں)$/i;
  return parts
    .filter((p) => !commandOnly.test(p.trim()))
    .map((p) => p.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" "))
    .filter((p) => p.length > 0);
}

/**
 * Parse one spoken sentence into a full tree, e.g.
 * "category fruits sub category citrus words orange, lemon sub category berries words strawberry
 *  category animals sub categories pets and farm"
 * Each "category/shelf" starts a new shelf, each "sub category" a new sub-category under the
 * current shelf, and "words" add words to the current sub-category.
 */
export function parseVoicePlan(raw: string): VoicePlan {
  const text = (raw || "").replace(/\s+/g, " ").trim();
  const segments: { kind: MarkerKind | "lead"; plural: boolean; content: string }[] = [];
  const re = new RegExp(PLAN_MARKER_RE.source, "gi");
  let last = 0;
  let pendingKind: MarkerKind | "lead" = "lead";
  let pendingPlural = false;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const markerStart = m.index + m[1].length;
    segments.push({ kind: pendingKind, plural: pendingPlural, content: text.slice(last, markerStart) });
    pendingKind = markerKind(m[2]);
    pendingPlural = markerIsPlural(m[2]);
    last = markerStart + m[2].length;
  }
  segments.push({ kind: pendingKind, plural: pendingPlural, content: text.slice(last) });

  const shelves: VoicePlanShelf[] = [];
  let curShelf: VoicePlanShelf | null = null;
  let curSub: VoicePlanSub | null = null;
  const implicitShelf = (): VoicePlanShelf => {
    if (!curShelf) {
      curShelf = { id: `s${shelves.length}`, name: null, subs: [], words: [] };
      shelves.push(curShelf);
    }
    return curShelf;
  };
  const toWords = (parentId: string, start: number, names: string[]): VoicePlanWord[] =>
    names.map((name, k) => ({ id: `${parentId}.w${start + k}`, name }));

  segments.forEach((seg, i) => {
    let kind = seg.kind;
    if (kind === "lead") {
      // Unmarked text at the start: "fruits with subcategories ..." -> shelf, "fruits words ..." -> sub-category
      // No keyword heard at all ("create a the name of book" — engine dropped "category"):
      // treat it as shelf name(s), with command words stripped -> "Book"
      const next = segments[i + 1]?.kind;
      kind = next === "words" ? "sub" : "shelf";
    }
    let items = splitPlanItems(seg.content, seg.plural, seg.kind === "lead");
    // A shelf / sub-category can't be named just "of", "the", "and" ("sub period of subcategory ...")
    if (kind !== "words") items = items.filter((it) => !EDGE_FILLER_RE.test(it.toLowerCase()));
    if (items.length === 0) return;
    if (kind === "shelf") {
      items.forEach((name) => {
        const s: VoicePlanShelf = { id: `s${shelves.length}`, name, subs: [], words: [] };
        shelves.push(s);
        curShelf = s;
      });
      curSub = null;
    } else if (kind === "sub") {
      const s = implicitShelf();
      items.forEach((name) => {
        const sub: VoicePlanSub = { id: `${s.id}.b${s.subs.length}`, name, words: [] };
        s.subs.push(sub);
        curSub = sub;
      });
    } else {
      const target: VoicePlanSub | VoicePlanShelf = curSub ?? implicitShelf();
      target.words.push(...toWords(target.id, target.words.length, items));
    }
  });

  return summarizeVoicePlan(shelves);
}

/** Recompute counts / nesting for a (possibly edited) list of shelves. */
export function summarizeVoicePlan(shelves: VoicePlanShelf[]): VoicePlan {
  const subCount = shelves.reduce((n, s) => n + s.subs.length, 0);
  const wordCount = shelves.reduce((n, s) => n + s.words.length + s.subs.reduce((k, sub) => k + sub.words.length, 0), 0);
  const nested = shelves.some(
    (s) => (s.name !== null && (s.subs.length > 0 || s.words.length > 0)) || s.subs.some((sub) => sub.words.length > 0),
  );
  return {
    shelves,
    nested,
    shelfCount: shelves.filter((s) => s.name !== null).length,
    subCount,
    wordCount,
  };
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
    lower.includes("sub cat") ||
    lower.includes("subcat") ||
    lower.includes("subcatogirese") ||
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
    lower.includes("word") ||
    lower.includes("alfaaz") ||
    lower.includes("lafz")
  ) {
    intent = "words";
  } else if (
    lower.includes("category") ||
    lower.includes("categories") ||
    lower.includes("catogirese") ||
    lower.includes("catogies") ||
    lower.includes("shelf") ||
    lower.includes("shelves")
  ) {
    intent = "category";
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
