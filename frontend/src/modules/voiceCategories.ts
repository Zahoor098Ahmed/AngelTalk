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
  truck: "🚚",
  trucks: "🚚",
  bike: "🚲",
  bikes: "🚲",
  bicycle: "🚲",
  motorcycle: "🏍️",
  bus: "🚌",
  train: "🚆",
  airplane: "✈️",
  plane: "✈️",
  boat: "⛵",
  ship: "🚢",
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

export const KNOWN_COMPOUND_PHRASES = new Set([
  "ice cream", "french fries", "hot dog", "peanut butter", "cotton candy", "mac and cheese",
  "fast food", "sour cream", "cream cheese", "apple juice", "orange juice", "fruit juice",
  "fire truck", "police car", "school bus", "monster truck", "sports car", "dump truck",
  "garbage truck", "tow truck", "race car", "train station", "roller coaster", "hot air balloon",
  "fire engine", "police officer",
  "teddy bear", "board game", "video game", "action figure", "remote control",
  "sea animals", "sea creatures", "wild animals", "farm animals", "polar bear", "guinea pig",
  "living room", "dining room", "swimming pool", "washing machine", "pencil case", "pencil sharpener",
  "body parts", "fire drill", "bulletin board", "coloured pencils", "colored pencils",
  "school store", "flash cards", "thank you", "all done", "wash hands", "watch tv", "clean up", "open door",
]);

export const SPEECH_CORRECTIONS: Record<string, string> = {
  turk: "truck",
  truk: "truck",
  trak: "truck",
  kar: "car",
  byk: "bike",
  motar: "motor",
  aeroplan: "airplane",
  aeroplane: "airplane",
  airoplane: "airplane",
  aeroplen: "airplane",
  hellicopter: "helicopter",
  helecopter: "helicopter",
  buss: "bus",
  piza: "pizza",
  burgr: "burger",
  pastta: "pasta",
  sandwitch: "sandwich",
  appel: "apple",
  bannana: "banana",
  orrange: "orange",
  straberry: "strawberry",
  strawbery: "strawberry",
  mangoo: "mango",
  vegitables: "vegetables",
  vegitable: "vegetable",
};

/**
 * Filter out filler words, stuttering, speech recognition noise, and boilerplate speech prefixes.
 * Retains delimiters like commas or newlines if present.
 */
export function cleanVoiceSpeechName(raw: string): string {
  if (!raw) return "";
  let text = raw.trim();

  // 1. Remove speech filler sounds and humming
  text = text.replace(/\b(?:uh+|um+|er+|ah+|hmm+|mmm+|mm+|mhm+|haan|acha|accha|theek|sahi|please|plz|kindly|ok|okay)\b/gi, " ");

  // 2. Normalize common Urdu / Hindi phrasing
  text = text.replace(/^(.*?)\s+(?:ki|ka|ke)\s+(?:categor(?:y|ies)|shelf|shelves|subcategor(?:y|ies)|subjects?|subtopics?)\s+(?:banao|banayein|karo|bana\s+do|dalo|rakho)/gi, "$1");
  text = text.replace(/^(.*?)\s+(?:ki|ka|ke)\s+(?:name|naam)\s+(?:ka|ki|ke)?\s+(?:categor(?:y|ies)|shelf|shelves|subcategor(?:y|ies)|subjects?|words?|alfaaz|lafz)\s+(?:banao|banayein|karo|bana\s+do|dalo|rakho)/gi, "$1");
  text = text.replace(/^(.*?)\s+(?:ka|ki|ke)\s+(?:word|words|alfaaz|lafz)\s+(?:banao|banayein|dalo|rakho|add\s+karo|karo)/gi, "$1");
  text = text.replace(/\b(?:categor(?:y|ies)|shelf|shelves|subcategor(?:y|ies)|subjects?|subtopics?)\s+(?:banao|banayein|karo|bana\s+do)\b/gi, " ");
  text = text.replace(/\b(?:alfaaz|lafz|words?|word)\s+(?:banao|banayein|dalo|rakho|add\s+karo|karo)\b/gi, " ");
  text = text.replace(/^(?:alfaaz|lafz|words?|word|categories|subcategories|shelves|subjects?|subtopics?)\s*[:=-]?\s*/gi, "");
  text = text.replace(/^(?:catogirese|catogies|subcatogirese)\s*[:=-]?\s*/gi, "");
  text = text.replace(/\b(?:banao|banayein|bana\s+do)\b/gi, " ");

  // 3. Strip long boilerplate English command phrases
  const prefixes = [
    /^(?:please\s+)?(?:can\s+you\s+)?(?:i\s+want\s+to\s+)?(?:create|make|add|build|open|put|insert)\s+(?:a\s+|an\s+|the\s+|new\s+|bulk\s+)?(?:categories|shelves|subcategories|sub-categories|subjects|subtopics|sub-topics|words|alfaaz|tiles)\s+(?:(?:of|for|with|called|named|titled)\s+)?/i,
    /^(?:please\s+)?(?:can\s+you\s+)?(?:i\s+want\s+to\s+)?(?:create|make|add|build|open|put|insert)\s+(?:a\s+|an\s+|the\s+|new\s+)?(?:category|shelf|folder|subcategory|sub-category|subject|subtopic|sub-topic|word|tile|card)\s+(?:(?:of|for|with)\s+)?(?:the\s+)?(?:name|title|naam)\s+(?:(?:of|is|as)\s+)?/i,
    /^(?:the\s+)?(?:category|categories|shelf|shelves|folder|folders|subcategory|subcategories|sub-category|sub-categories|subject|subjects|subtopic|subtopics)\s+(?:(?:of|for)\s+)?(?:the\s+)?(?:name|title|naam)\s+(?:(?:of|is|as)\s+)?/i,
    /^(?:the\s+)?(?:name|title|naam)\s+(?:of\s+)?(?:the\s+)?(?:category|categories|shelf|shelves|subcategory|subcategories|subject|subjects|word|words)?\s+(?:(?:is|as|of)\s+)?/i,
    /^(?:please\s+)?(?:can\s+you\s+)?(?:i\s+want\s+to\s+)?(?:create|make|add|build|open|put|insert)\s+(?:a\s+|an\s+|the\s+|new\s+|bulk\s+)?(?:category|categories|shelf|shelves|folder|folders|subcategory|subcategories|sub-category|sub-categories|subject|subjects|subtopic|subtopics|word|words|tile|tiles|alfaaz|lafz)\s+(?:(?:of|for|called|named|titled)\s+)?/i,
    /^(?:a\s+|an\s+|the\s+)?new\s+(?:category|categories|shelf|shelves|folder|folders|subcategory|subcategories|sub-category|sub-categories|subject|subjects|subtopic|subtopics|word|words|tile|tiles)\s+(?:(?:of|for|called|named|titled)\s+)?/i,
    /^(?:the\s+|bulk\s+)?(?:category|categories|shelf|shelves|folder|folders|subcategory|subcategories|sub-category|sub-categories|subject|subjects|subtopic|subtopics|word|words|tile|tiles|alfaaz|lafz)\s+(?:(?:of|for|called|named|titled)\s+)?/i,
    /^(?:please\s+)?(?:can\s+you\s+)?(?:add|create|make|put|insert)\s+(?:the\s+|a\s+|an\s+|bulk\s+)?(?:word|words|tile|tiles|card|cards|alfaaz|lafz)\s+(?:(?:of|for|called|named|titled)\s+)?/i,
    /^(?:word|words|tile|tiles|card|cards)\s+(?:(?:of|for|called|named|titled)\s+)?/i,
  ];

  for (const regex of prefixes) {
    text = text.replace(regex, "");
  }

  // 4. Strip stray leading naming clauses, prepositions, and noise words
  text = text.replace(/^(?:(?:by|with|in)\s+)?(?:the\s+)?(?:name|title|naam)\s+(?:of|is|as)?\s+/gi, "");
  text = text.replace(/^(?:called|named|titled)\s+/gi, "");
  text = text.replace(/^(?:bulk\s+|all\s+|of\s+name\s+of|of\s+name|of\s+the|of\s+|for\s+|to\s+|into\s+|inside\s+|with\s+|having\s+|is\s+|are\s+|a\s+|an\s+|the\s+|name\s+)+/gi, "");

  // 5. Strip trailing prepositions/filler
  text = text.replace(/\s+(?:please|banao)$/gi, "");
  text = text.replace(/[\s,.]+(?:mmm+|mm+|hmm+|uh+|um+|er+|ah+)[\s,.]*$/gi, "");

  // 6. Clean punctuation while preserving words in contractions (don't split I'd into I and d)
  text = text.replace(/\b([a-zA-Z]+)['’]([a-zA-Z]+)\b/g, "$1$2");
  text = text.replace(/["'?!.]/g, " ").replace(/[ \t]+/g, " ").trim();

  return text;
}

/** Single item cleaner */
function cleanSingleItem(str: string): string {
  if (!str) return "";
  let clean = cleanVoiceSpeechName(str);
  clean = clean.replace(/[,;]/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const words = clean.split(" ").filter(Boolean);
  const corrected = words.map((w) => {
    const low = w.toLowerCase();
    const fix = SPEECH_CORRECTIONS[low] || low;
    return fix.charAt(0).toUpperCase() + fix.slice(1).toLowerCase();
  });
  return corrected.join(" ");
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
  /** true when the user explicitly spoke "category <name>", false for lead text */
  explicitCategory?: boolean;
}

export interface VoicePlan {
  shelves: VoicePlanShelf[];
  /** true when the utterance mixes levels (shelf + subs, sub + words, ...) */
  nested: boolean;
  shelfCount: number;
  subCount: number;
  wordCount: number;
}

type MarkerKind = "shelf" | "sub" | "words" | "inside";

// Sub-category variants must come before plain "category" so "sub category" wins.
const PLAN_MARKER_RE = new RegExp(
  "(^|[^a-z\\u0600-\\u06FF])(" +
    [
      // "in it" / "us mein" (rewritten by normalizeSpokenCommand) — sub-categories after a shelf, words after a sub
      "insideit",
      // sub-category + common speech-engine mishearings & synonyms ("subject", "subtopic", "sub group")
      "s[ua]b[\\s-]?[ck]at[aeiou]?g[a-z]*",
      "s[ua]b[\\s-]?periods?",
      "sub[\\s-]?cat(?:s)?",
      "sub[\\s-]?folders?",
      "s[ua]b[\\s-]?topics?",
      "s[ua]b[\\s-]?groups?",
      "s[ua]b[\\s-]?items?",
      "s[ua]b[\\s-]?sections?",
      "s[ua]b[\\s-]?classes?",
      "s[ua]b[\\s-]?headings?",
      "s[ua]b[\\s-]?types?",
      "s[ua]b[\\s-]?divisions?",
      "s[ua]b[\\s-]?jects?",
      "subjects?",
      "سب\\s?کیٹیگریز?", "سب\\s?کیٹگری", "ذیلی\\s?زمر[ہیا]ز?", "ذیلی\\s?عنوان", "سبجیکٹ", "فئات\\s?فرعية", "فئة\\s?فرعية",
      // category + mishearings ("catgires", "catagory", "catogirese", "katgori"); never plain "cat"
      "[ck]at[aeiou]?g[a-z]*", "shel(?:f|ves)", "folders?", "topics?",
      "کیٹیگریز?", "کیٹگری", "زمر[ہیا]", "فئات", "فئة",
      "words?", "worlds?", "wards?", "alfaaz", "lafz", "alfaas", "ورڈز?", "ورڈ", "الفاظ", "لفظ", "كلمات", "كلمة", "کلمات", "tiles?", "cards?",
    ].join("|") +
    ")(?=$|[^a-z\\u0600-\\u06FF])",
  "gi",
);

function markerKind(m: string): MarkerKind {
  const s = m.toLowerCase();
  if (s === "insideit") return "inside";
  if (/^s[ua]b|subjects?|سب|ذیلی|فرعية/.test(s)) return "sub";
  if (/^(word|alfaaz|lafz|tile|card)|الفاظ|لفظ|كلم|کلم/.test(s)) return "words";
  return "shelf";
}

function markerIsPlural(m: string): boolean {
  const s = m.toLowerCase();
  return /(ies|ves|s|se|alfaaz|الفاظ|كلمات|کلمات|فئات|یز|زمرے)$/.test(s);
}

// Connector / command words that can sit at the edges of a spoken item ("fruits with", "add", "in it")
const EDGE_FILLER_RE =
  /^(?:create|make|add|build|new|the|a|an|with|having|has|have|named|called|name|of|in|it|inside|under|into|to|for|then|also|please|is|are|which|that|subject|subjects|banao|banayein|bana|do|karo|mein|me|main|ke|ki|ka|andar|aur|and|اور|في|و|میں|کے|کی|کا|بناؤ|بنائیں)$/i;

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

/**
 * Intelligent tokenizer for spoken item lists:
 * Splits space-separated items (which speech engines often produce without commas),
 * while preserving recognized compound phrases like "ice cream", "fire truck", "fast food".
 */
/** Pure command words — never a word tile even in a word list ("is", "in", "me" are real AAC words). */
const COMMAND_ONLY_RE = /^(?:create|make|add|build|new|with|having|then|also|please|named|called|subject|subjects|banao|banayein|bana|karo|بناؤ|بنائیں)$/i;

function tokenizeItemList(text: string, keepSmallWords = false, heads: Set<string> = new Set()): string[] {
  const rawWords = text.split(/\s+/).filter(Boolean);
  // A word repeated across the list is the head noun of each phrase: "red car blue car"
  if (keepSmallWords && heads.size > 0 && rawWords.length > 1) {
    const phrases: string[] = [];
    let chunk: string[] = [];
    for (const w of rawWords) {
      chunk.push(w);
      if (heads.has(w.toLowerCase())) {
        phrases.push(chunk.join(" "));
        chunk = [];
      }
    }
    if (phrases.length > 0) {
      for (const leftover of chunk) if (!COMMAND_ONLY_RE.test(leftover)) phrases.push(leftover);
      return phrases;
    }
  }
  if (rawWords.length <= 1) {
    if (rawWords.length === 1) {
      const w = rawWords[0].toLowerCase();
      const corrected = SPEECH_CORRECTIONS[w] || rawWords[0];
      return [corrected];
    }
    return [];
  }

  const items: string[] = [];
  let i = 0;
  while (i < rawWords.length) {
    const w1 = rawWords[i].toLowerCase();
    const w2 = (rawWords[i + 1] || "").toLowerCase();
    const twoWord = `${w1} ${w2}`;

    // Check if the pair forms a recognized compound phrase
    if (i + 1 < rawWords.length && (KNOWN_COMPOUND_PHRASES.has(twoWord) || COMMON_CATEGORY_ICONS[twoWord])) {
      items.push(twoWord);
      i += 2;
      continue;
    }

    // Drop speech filler sounds ("mmm", "uh", "um", etc.) and noise
    if (/^(?:uh+|um+|er+|ah+|hmm+|mmm+|mm+|avoid)$/i.test(w1)) {
      i++;
      continue;
    }
    // For categories and subcategories, drop single letters
    if (!keepSmallWords && w1.length <= 1) {
      i++;
      continue;
    }
    // In word lists, drop stray consonant fragments from speech contractions
    if (keepSmallWords && /^[b-df-hj-np-tv-zB-DF-HJ-NP-TV-Z]$/.test(w1)) {
      i++;
      continue;
    }

    const corrected = SPEECH_CORRECTIONS[w1] || rawWords[i];
    if (keepSmallWords ? !COMMAND_ONLY_RE.test(corrected) : !EDGE_FILLER_RE.test(corrected.toLowerCase())) {
      items.push(corrected);
    }
    i++;
  }
  return items;
}

function splitPlanItems(content: string, plural: boolean, isLead = false, isWordList = false, extraHeads: string[] = []): string[] {
  let text = content
    .replace(/\b([a-zA-Z]+)['’]([a-zA-Z]+)\b/g, "$1$2")
    .replace(/["'?!.]/g, " ")
    .replace(/\b(?:uh+|um+|er+|ah+|hmm+|mmm+|mm+)\b/gi, " ")
    .trim();
  // Strip naming phrases: "the name of book", "a new one called toys", "name apple", etc.
  const afterName = text.replace(/^.*\b(?:called|named|titled|name\s+of|the\s+name\s+of|name\s+is|name|naam)\b\s*/i, "").trim();
  if (afterName && afterName !== text) text = afterName;
  if (!text) return [];
  if (isWordList) text = text.replace(/^(?:(?:and|aur|plus|then|اور|و)\s+)+|(?:\s+(?:and|aur|plus|then|اور|و))+$/gi, "").trim();
  if (!text) return [];

  const delim = /(?:,|\n|;|\s+and\s+|\s+aur\s+|\s+اور\s+|\s+و\s+|\s+plus\s+|\s+&\s+|\s+then\s+)+/i;
  const rawParts = delim.test(text) ? text.split(delim) : [text];

  // Head nouns repeated in a word list ("red car and blue car") keep their phrases together;
  // the sub-category's own name counts too ("truck" words "big truck")
  const heads = new Set<string>(extraHeads.map((h) => h.toLowerCase()));
  if (isWordList) {
    const counts = new Map<string, number>();
    for (const w of text.toLowerCase().split(/[\s,;]+/).filter(Boolean)) counts.set(w, (counts.get(w) ?? 0) + 1);
    for (const [w, n] of counts) if (n >= 2 && !EDGE_FILLER_RE.test(w) && !/^(?:and|aur|plus|then)$/.test(w)) heads.add(w);
  }
  const results: string[] = [];
  for (const part of rawParts) {
    // In a word list only command words are trimmed: "is", "are", "inside" are real AAC words
    const cleaned = isWordList
      ? part.split(/\s+/).filter((tok, k, all) => !((k === 0 || k === all.length - 1) && COMMAND_ONLY_RE.test(tok))).join(" ").trim()
      : stripEdgeFillers(part, isLead);
    if (!cleaned) continue;
    // Tokenize space-separated words (e.g. "car truck" -> ["car", "truck"])
    const tokenized = tokenizeItemList(cleaned, isWordList, heads);
    if (tokenized.length > 0) {
      results.push(...tokenized);
    } else {
      results.push(cleaned);
    }
  }

  // Drop pieces that are only a command word ("citrus and add words ..." -> "add")
  return results
    .filter((p) => !COMMAND_ONLY_RE.test(p.trim()))
    .map((p) => p.split(/\s+/).map((w) => (/^[A-Z]{2,5}$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join(" "))
    .filter((p) => p.length > 0);
}

/** Whole-word (works for Arabic/Urdu script too, where \b doesn't) case-insensitive regex. */
const spokenWord = (alternatives: string) => new RegExp(`(^|[\\s,.!?،])(?:${alternatives})(?=$|[\\s,.!?،])`, "gi");

/** Ordered rewrites that turn everyday / accented / mixed-language speech into plain commands. */
/** Words that are never the name before "mein" ("car mein ..." = inside Car). */
/** Small AAC words that follow "in"/"to" in a word list without naming a target ("words inside outside home"). */
const SMALL_AAC_WORDS = new Set(["out", "outside", "inside", "in", "on", "off", "up", "down", "over", "under", "the", "a", "an", "me", "you", "it", "here", "there", "go", "stop", "more"]);
const NOT_A_TARGET = new Set(["us", "is", "uss", "iss", "sub", "category", "categories", "insideit", "words", "word", "and", "aur", "اس", "ان", "اور"]);

const SPOKEN_REWRITES: [RegExp, string | ((...m: string[]) => string)][] = [
  // Polite and filler phrases (any language)
  // (okay / so / well / hey are real AAC words too, so only drop them at the very start)
  [/^\s*(?:(?:okay|ok|so|well|hey|umm+|um+|uh+|hmm+|mmm+|mm+|er+)[\s,]+)+/i, " "],
  // Humming and noise fillers anywhere in utterance
  [/\b(?:mmm+|mm+|hmm+|uh+|um+|er+|ah+)\b/gi, " "],
  // "and I'd avoid", "I'd avoid", "avoid", "a void" mishearings for "and add word" / "words"
  [spokenWord("(?:and\\s+)?(?:i['’]?d\\s+)?(?:avoid|a\\s+void|ad\\s+void)"), " words "],
  // "world" / "worlds" / "wards" / "woods" mishearings for "word" / "words"
  [spokenWord("(?:and\\s+)?(?:add\\s+|daal(?:o)?\\s+)?(?:world|worlds|wards?|wood|woods)"), " words "],
  // Urdu / Hindi accents: "our word", "or word", "hour word", "aur word"
  [spokenWord("(?:our|or|hour|are|aur)\\s+(?:words?|world|alfaaz|lafz|alfaas)"), " words "],
  [spokenWord("(?:اور|یا)\\s+(?:الفاظ|لفظ|ورڈ|ورڈز)"), " words "],
  // "and add word", "add word", "add a word", "add words"
  [spokenWord("(?:and\\s+)?(?:i['’]?d\\s+)?(?:add|insert|put|daalo?)\\s+(?:a\\s+|an\\s+|the\\s+)?(?:words?|tiles?|cards?|alfaaz|lafz)"), " words "],
  [spokenWord("(?:and|aur|plus|then)\\s+(?:the\\s+|a\\s+)?(?:words?|word)"), " words "],
  [spokenWord("(?:words?|alfaaz|lafz)\\s+(?:of|are|is|called|named|like)"), " words "],
  [spokenWord("can you|could you|would you|will you|i want to|i wanna|i would like to|i'd like to|let's|lets|please|pls|umm+|um+|uh+|hmm+"), " "],
  [spokenWord("daal do|daldo|daalo|dalo|daal dein|rakh do|rakho|add kar do|add karo|add kardo|add karein|bana do|banado|kar do|kardo|karo|karein|kijiye|kariye|zara"), " "],
  [spokenWord("ڈال دو|ڈالو|ڈالیں|شامل کرو|شامل کریں|شامل|رکھو|رکھ دو|بنا دو|کرو|کریں|براہ کرم|مہربانی"), " "],
  [spokenWord("أضف|اضف|اضيف|أضيف|انشئ|أنشئ|اعمل|اصنع|ضع|من فضلك|لو سمحت"), " "],
  // "category" heard in pieces: "cat a gory", "kitty gory", "catty gory"
  [/\b(?:cat|kat|cad|catty|kitty|katty)\s*(?:a\s+|e\s+|i\s+)?(gor(?:y|i|ee|ie)|gories|goris)\b/gi, " category "],
  // "sub category" heard as "some / sap / sup / sob / sum category"
  [/\b(?:some|sap|sup|sob|sum|sab)\s+(categor(?:y|ies))\b/gi, " sub $1 "],
  // "in it" -> the following items belong inside the category just named
  [/\b(?:inside it|inside of it|inside that|inside this|in it|into it|in that|under it|within it)\b/gi, " insideit "],
  [/\b(?:us|is|uss|iss)\s+(?:ke\s+andar|k\s+andar|mein|mai|main|me|andar)\b/gi, " insideit "],
  [/\b(?:usmein|ismein|usme|isme|usmai|ismai|uske andar|iske andar)\b/gi, " insideit "],
  [spokenWord("اس میں|اسمیں|اس کے اندر|اسکے اندر|ان میں|فيها|فيه|بداخلها|بداخله|داخلها"), "$1 insideit "],
  // Naming the target: "add words to car ...", "in car add words ...", "car mein ...", "کار میں ..."
  [/\b(?:add\s+)?(words?)\s+(?:to|in|into|for|inside)\s+([a-z\u0600-\u06FF]+)/gi,
    (m, _w, name) => (SMALL_AAC_WORDS.has(name.toLowerCase()) ? m : ` sub category ${name} words `)],
  [/\b(?:in|inside|into|to)\s+([a-z\u0600-\u06FF]+)\s+(?:add\s+)?words?\b/gi,
    (m, name) => (SMALL_AAC_WORDS.has(name.toLowerCase()) ? m : ` sub category ${name} words `)],
  [/(^|\s)([a-z\u0600-\u06FF]+)\s+(?:ke\s+andar|k\s+andar|mein|mai|main|میں|کے\s+اندر)(?=\s|$)/gi,
    (m, lead, name) => (NOT_A_TARGET.has(name.toLowerCase()) ? m : `${lead} sub category ${name} words `)],
];

/**
 * Normalises how people actually talk before parsing: drops polite filler, fixes
 * command words a speech engine splits or mishears, and understands "in it" /
 * "us mein" / "اس میں" as "the next items go inside the category I just said".
 * e.g. "vehicles ki category banao us mein car truck bike daalo"
 *   -> "vehicles ki category banao sub categories car truck bike"
 */
export function normalizeSpokenCommand(raw: string): string {
  let text = ` ${(raw || "").replace(/\s+/g, " ")} `;
  for (const [re, replacement] of SPOKEN_REWRITES) {
    if (typeof replacement === "function") text = text.replace(re, replacement as (...m: string[]) => string);
    // spokenWord() rules capture the leading separator in group 1 — keep it
    else if (re.source.startsWith("(^|") && !replacement.startsWith("$1")) text = text.replace(re, `$1${replacement}`);
    else text = text.replace(re, replacement);
  }
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Parse one spoken sentence into a full tree, e.g.
 * "category fruits sub category citrus words orange, lemon sub category berries words strawberry
 *  category animals sub categories pets and farm"
 * Each "category/shelf" starts a new shelf, each "sub category" a new sub-category under the
 * current shelf, and "words" add words to the current sub-category.
 */
export function parseVoicePlan(raw: string): VoicePlan {
  const text = normalizeSpokenCommand(raw);
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

  // Name before the marker (Urdu/Hindi order, or "vehicles category, car sub category"):
  // an empty shelf/sub marker takes the last name said just before it.
  const lastItemOf = (content: string) => {
    const parts = content.split(/(?:,|;|\s+and\s+|\s+aur\s+|\s+اور\s+|\s+و\s+)/i);
    const tail = stripEdgeFillers(parts[parts.length - 1] ?? "", true).split(/\s+/).filter(Boolean);
    return tail.length ? tail[tail.length - 1] : "";
  };
  for (let i = segments.length - 1; i >= 1; i--) {
    const seg = segments[i];
    if (seg.kind !== "shelf" && seg.kind !== "sub") continue;
    if (stripEdgeFillers(seg.content, true)) continue;
    // a marker at the very end may just be unfinished speech — only borrow once more follows
    if (i === segments.length - 1 && !seg.content.trim()) continue;
    const prev = segments[i - 1];
    const name = lastItemOf(prev.content);
    if (!name) continue;
    const at = prev.content.toLowerCase().lastIndexOf(name.toLowerCase());
    prev.content = prev.content.slice(0, at) + prev.content.slice(at + name.length);
    seg.content = ` ${name} `;
  }
  // "truck words big truck and bike words cycle": a name right before another "words" is a sub-category
  for (let i = segments.length - 1; i >= 1; i--) {
    if (segments[i].kind !== "words" || segments[i - 1].kind !== "words") continue;
    const prev = segments[i - 1];
    const name = lastItemOf(prev.content);
    if (!name) continue;
    const at = prev.content.toLowerCase().lastIndexOf(name.toLowerCase());
    prev.content = prev.content.slice(0, at) + prev.content.slice(at + name.length);
    segments.splice(i, 0, { kind: "sub", plural: false, content: ` ${name} ` });
  }

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
    let isExplicit = false;
    if (kind === "lead") {
      // Unmarked text at the start: "fruits with subcategories ..." -> shelf, "fruits words ..." -> sub-category
      // No keyword heard at all ("create a the name of book" — engine dropped "category"):
      // treat it as shelf name(s), with command words stripped -> "Book"
      const next = segments[i + 1]?.kind;
      kind = next === "words" ? "sub" : "shelf";
    } else if (kind === "shelf") {
      isExplicit = true;
    } else if (kind === "inside") {
      // "in it": inside a sub-category -> words, inside a shelf -> sub-categories
      kind = curSub ? "words" : "sub";
    }
    const targetName = kind === "words" ? ((curSub as VoicePlanSub | null)?.name ?? (curShelf as VoicePlanShelf | null)?.name ?? "") : "";
    let items = splitPlanItems(seg.content, seg.plural, seg.kind === "lead", kind === "words", targetName ? targetName.split(/\s+/).slice(-1) : []);
    // A shelf / sub-category can't be named just "of", "the", "and", and must not be single letter or noise
    if (kind !== "words") {
      items = items.filter((it) => it.length > 1 && !EDGE_FILLER_RE.test(it.toLowerCase()) && !/^(?:avoid|mmm+|mm+)$/i.test(it));
    } else {
      items = items.filter((it) => !/^(?:avoid|mmm+|mm+|uh+|um+|er+|ah+|hmm+)$/i.test(it) && !/^[b-df-hj-np-tv-zB-DF-HJ-NP-TV-Z]$/.test(it));
    }
    if (items.length === 0) return;
    if (kind === "shelf") {
      if (!seg.plural && items.length > 1) {
        // Singular shelf marker: first item is shelf, subsequent items without sub marker become words
        const shelfName = items[0];
        const s: VoicePlanShelf = { id: `s${shelves.length}`, name: shelfName, subs: [], words: [], explicitCategory: isExplicit };
        shelves.push(s);
        curShelf = s;
        const nextKind = segments[i + 1]?.kind;
        if (!nextKind || nextKind === "shelf") {
          const remaining = items.slice(1);
          s.words.push(...toWords(s.id, s.words.length, remaining));
        }
      } else {
        items.forEach((name) => {
          const s: VoicePlanShelf = { id: `s${shelves.length}`, name, subs: [], words: [], explicitCategory: isExplicit };
          shelves.push(s);
          curShelf = s;
        });
      }
      curSub = null;
    } else if (kind === "sub") {
      const s = implicitShelf();
      // (only for a spoken "sub category" — after "us mein / inside it" every name is a sub-category)
      if (seg.kind === "sub" && !seg.plural && items.length > 1) {
        // Singular sub-category marker ("subcategory Car Suzuki ..."):
        // First item is the sub-category name ("Car"), subsequent items are words inside it!
        const subName = items[0];
        let sub = s.subs.find((b) => b.name.toLowerCase() === subName.toLowerCase());
        if (!sub) {
          sub = { id: `${s.id}.b${s.subs.length}`, name: subName, words: [] };
          s.subs.push(sub);
        }
        curSub = sub;
        const subWords = items.slice(1);
        sub.words.push(...toWords(sub.id, sub.words.length, subWords));
      } else {
        items.forEach((name) => {
          // Saying a sub-category again ("pets farm and wild … pets mein dog cat") reuses it
          const existing = s.subs.find((b) => b.name.toLowerCase() === name.toLowerCase());
          if (existing) {
            curSub = existing;
            return;
          }
          const sub: VoicePlanSub = { id: `${s.id}.b${s.subs.length}`, name, words: [] };
          s.subs.push(sub);
          curSub = sub;
        });
      }
    } else {
      const target: VoicePlanSub | VoicePlanShelf = curSub ?? implicitShelf();
      target.words.push(...toWords(target.id, target.words.length, items));
    }
  });

  return summarizeVoicePlan(shelves);
}

/**
 * Intelligent merger for multi-turn voice sessions.
 * Preserves previously added shelves, sub-categories, and words instead of overwriting them,
 * allowing the user to tap the mic multiple times to add more items seamlessly.
 */
export function mergeVoicePlan(existing: VoicePlan | null, incoming: VoicePlan): VoicePlan {
  if (!existing || existing.shelves.length === 0) return incoming;
  if (!incoming || incoming.shelves.length === 0) return existing;

  const mergedShelves: VoicePlanShelf[] = existing.shelves.map((s) => ({
    ...s,
    subs: s.subs.map((b) => ({ ...b, words: [...b.words] })),
    words: [...s.words],
  }));

  let activeShelf = mergedShelves[mergedShelves.length - 1];

  for (const inShelf of incoming.shelves) {
    if (inShelf.name !== null) {
      // 1. If active shelf is implicit (subcats or words only, no top shelf name)
      if (activeShelf.name === null && !inShelf.explicitCategory) {
        if (activeShelf.subs.length > 0) {
          const names = [inShelf.name, ...inShelf.subs.map((b) => b.name)];
          for (const name of names) {
            if (!activeShelf.subs.some((b) => b.name.toLowerCase() === name.toLowerCase())) {
              activeShelf.subs.push({
                id: `${activeShelf.id}.b${activeShelf.subs.length}`,
                name,
                words: [],
              });
            }
          }
          activeShelf.words.push(...inShelf.words);
          continue;
        } else if (activeShelf.words.length > 0) {
          const names = [inShelf.name, ...inShelf.words.map((w) => w.name)];
          for (const name of names) {
            if (!activeShelf.words.some((w) => w.name.toLowerCase() === name.toLowerCase())) {
              activeShelf.words.push({
                id: `${activeShelf.id}.w${activeShelf.words.length}`,
                name,
              });
            }
          }
          continue;
        }
      }

      // 2. If active shelf already has subcategories and incoming shelf was NOT an explicit category keyword
      if (!inShelf.explicitCategory && activeShelf.name !== null && activeShelf.subs.length > 0) {
        const subNames = [inShelf.name, ...inShelf.subs.map((b) => b.name)];
        for (const name of subNames) {
          if (!activeShelf.subs.some((b) => b.name.toLowerCase() === name.toLowerCase())) {
            activeShelf.subs.push({
              id: `${activeShelf.id}.b${activeShelf.subs.length}`,
              name,
              words: [],
            });
          }
        }
        activeShelf.words.push(...inShelf.words);
        continue;
      }

      // 3. If active shelf already has direct words (no subs) and incoming shelf was NOT explicit category keyword
      if (
        !inShelf.explicitCategory &&
        activeShelf.name !== null &&
        activeShelf.words.length > 0 &&
        activeShelf.subs.length === 0 &&
        inShelf.subs.length === 0
      ) {
        const wordNames = [inShelf.name, ...inShelf.words.map((w) => w.name)];
        for (const name of wordNames) {
          if (!activeShelf.words.some((w) => w.name.toLowerCase() === name.toLowerCase())) {
            activeShelf.words.push({
              id: `${activeShelf.id}.w${activeShelf.words.length}`,
              name,
            });
          }
        }
        continue;
      }

      // 4. Otherwise, check if this shelf already exists
      const existingShelf = mergedShelves.find(
        (s) => s.name && s.name.toLowerCase() === inShelf.name!.toLowerCase()
      );
      if (existingShelf) {
        for (const sub of inShelf.subs) {
          const existingSub = existingShelf.subs.find((b) => b.name.toLowerCase() === sub.name.toLowerCase());
          if (existingSub) {
            existingSub.words.push(...sub.words.filter((w) => !existingSub.words.some((ew) => ew.name.toLowerCase() === w.name.toLowerCase())));
          } else {
            existingShelf.subs.push({
              ...sub,
              id: `${existingShelf.id}.b${existingShelf.subs.length}`,
            });
          }
        }
        existingShelf.words.push(...inShelf.words.filter((w) => !existingShelf.words.some((ew) => ew.name.toLowerCase() === w.name.toLowerCase())));
        activeShelf = existingShelf;
      } else {
        const newShelf: VoicePlanShelf = {
          ...inShelf,
          id: `s${mergedShelves.length}`,
        };
        mergedShelves.push(newShelf);
        activeShelf = newShelf;
      }
    } else {
      // Implicit shelf (e.g. user said "sub category X" or "words Y")
      for (const sub of inShelf.subs) {
        const existingSub = activeShelf.subs.find((b) => b.name.toLowerCase() === sub.name.toLowerCase());
        if (existingSub) {
          existingSub.words.push(...sub.words.filter((w) => !existingSub.words.some((ew) => ew.name.toLowerCase() === w.name.toLowerCase())));
        } else {
          activeShelf.subs.push({
            ...sub,
            id: `${activeShelf.id}.b${activeShelf.subs.length}`,
          });
        }
      }
      if (inShelf.words.length > 0) {
        // If activeShelf has subcategories, attach words to the last subcategory
        const target = activeShelf.subs.length > 0 ? activeShelf.subs[activeShelf.subs.length - 1] : activeShelf;
        for (const w of inShelf.words) {
          if (!target.words.some((tw) => tw.name.toLowerCase() === w.name.toLowerCase())) {
            target.words.push({
              id: `${target.id}.w${target.words.length}`,
              name: w.name,
            });
          }
        }
      }
    }
  }

  return summarizeVoicePlan(mergedShelves);
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
export function parseVoiceCategoryCommand(rawInput: string): ParsedVoiceResult {
  const raw = normalizeSpokenCommand(rawInput);
  const lower = raw.toLowerCase();

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
    lower.includes("sub folders") ||
    lower.includes("subject") ||
    lower.includes("subjects") ||
    lower.includes("sub-topic") ||
    lower.includes("subtopic") ||
    lower.includes("sub group") ||
    lower.includes("subgroup") ||
    lower.includes("sub item") ||
    lower.includes("subitem") ||
    lower.includes("ذیلی") ||
    lower.includes("سبجیکٹ")
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
    lower.includes("lafz") ||
    lower.includes("tiles") ||
    lower.includes("tile")
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
    /(?:category|shelf|folder)?\s*(.*?)\s+(?:with\s+(?:the\s+)?(?:subcategories|sub-categories|subjects|sub\s+folders|words)|having\s+(?:subcategories|subjects|words)|:\s*)(.*)/i
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

  // Detect destination phrasing for single commands: "add word apple in fruits" -> word: apple, parent: fruits
  let workingRaw = raw;
  const destMatch = raw.match(/\s+(?:in|into|under|to)\s+(?:the\s+)?(?:shelf|category|sub-category|subcategory)?\s*([a-zA-Z0-9\s_-]+)$/i);
  if (destMatch && destMatch[1] && !destMatch[1].toLowerCase().includes("category")) {
    const candidateDest = cleanSingleItem(destMatch[1]);
    if (candidateDest && candidateDest.length > 1) {
      parentCategoryName = candidateDest;
      workingRaw = raw.slice(0, destMatch.index).trim();
    }
  }

  // 3. Normal Clean Name & Multi-item Splitting
  const cleanedText = cleanVoiceSpeechName(workingRaw);

  let items: string[] = [];
  const delimiterRegex = /(?:,|\n|;|\s+and\s+|\s+aur\s+|\s+اور\s+|\s+plus\s+|\s+&\s+)+/i;

  if (delimiterRegex.test(cleanedText)) {
    const rawParts = cleanedText.split(delimiterRegex);
    for (const part of rawParts) {
      const tokenized = tokenizeItemList(part);
      if (tokenized.length > 0) {
        items.push(...tokenized.map(cleanSingleItem).filter(Boolean));
      } else {
        const single = cleanSingleItem(part);
        if (single) items.push(single);
      }
    }
  } else if (cleanedText) {
    const tokenized = tokenizeItemList(cleanedText);
    if (tokenized.length > 1) {
      items = tokenized.map(cleanSingleItem).filter(Boolean);
    } else {
      const single = cleanSingleItem(cleanedText);
      if (single) items = [single];
    }
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
