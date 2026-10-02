import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CustomCategory, CustomWord, TileSize, LanguageCode } from "../types";
import { starterLabel, wordLabel, canonicalWordEn, translateDynamic } from "./i18n";
import { getPictogramUrl } from "./aacPictograms";
import { VERB_FORMS_LIST, getVerbForms, generateAllVerbForms, isContinuousForm, type VerbForms } from "./verbForms";

const SEED_WORD_EN: Record<string, string[]> = {
  Core: ["I", "am", "is", "are", "was", "I want", "More", "Help", "No", "Yes", "All done", "I need", "I feel", "I like", "Can I have", "Please", "Thank you", "Stop", "Go", "to", "the", "Look", "Where"],
  Food: ["Water", "Milk", "Juice", "Apple", "Banana", "Bread", "Cookie", "Rice", "Chicken", "Snack", "Pizza", "Sandwich", "Fruit"],
  Feelings: ["Happy", "Sad", "Hungry", "Thirsty", "Tired", "Excited", "Scared", "Angry", "Hurt", "Sick", "Calm", "Loved"],
  People: ["Mom", "Dad", "Me", "You", "Teacher", "Friend", "Brother", "Sister", "Grandma", "Grandpa", "Doctor", "Baby"],
  Actions: [],
  Places: ["Home", "School", "Park", "Playground", "Bathroom", "Outside", "Bedroom", "Kitchen", "Car", "Store"],
  Things: ["Ball", "Toy", "Book", "Tablet", "Shoes", "Blanket", "Clothes", "Cup", "Backpack"],
};

/** Set before the first ensureCategoriesLoaded() so the starter board seeds in the chosen language. */
let seedLang: LanguageCode = "en-US";
export function setSeedLanguage(lang: LanguageCode) {
  seedLang = lang;
}

const KEY = "kiddocare_custom_categories";
const BACKUP_VERSION = 2;

const FOLDER_COLORS = ["#2f6d62", "#4a7fe6", "#c98a3d", "#8a6bc9", "#5c9a58", "#c96b6b"];

let cache: CustomCategory[] = [];
let loaded = false;

type CategoriesListener = () => void;
const listeners = new Set<CategoriesListener>();

export function subscribeCategories(listener: CategoriesListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error(e);
    }
  });
}

const DELETED_KEYS_STORAGE = "kiddocare_deleted_items_v2";
let deletedItemKeys: Set<string> = new Set();
let deletedKeysLoaded = false;

async function ensureDeletedKeysLoaded() {
  if (deletedKeysLoaded) return;
  try {
    const raw = await AsyncStorage.getItem(DELETED_KEYS_STORAGE);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        deletedItemKeys = new Set(arr);
      }
    }
  } catch {}
  deletedKeysLoaded = true;
}

function persistDeletedKeys() {
  AsyncStorage.setItem(DELETED_KEYS_STORAGE, JSON.stringify([...deletedItemKeys])).catch(() => {});
}

export function isDeletedCategory(name: string, parentId?: string | null): boolean {
  const norm = (name || "").trim().toLowerCase();
  if (deletedItemKeys.has(`cat::${norm}`)) return true;
  if (parentId && deletedItemKeys.has(`subcat::${parentId}::${norm}`)) return true;
  return false;
}

const VERB_FORM_TAGS = ["1st", "2nd", "3rd", "4th"] as const;

/**
 * True when the caregiver deleted this word from this category. Verb forms are
 * tracked per tag so deleting the 2nd form "Shared" does not hide the 3rd form "Shared".
 */
export function isDeletedWord(catId: string, label: string, verbFormTag?: CustomWord["verbFormTag"]): boolean {
  const norms = new Set([(label || "").trim().toLowerCase()]);
  const en = (canonicalWordEn(label) || "").trim().toLowerCase();
  if (en) norms.add(en);
  // Older deletions were stored under the localized (Arabic/Urdu) label only
  const localized = (wordLabel(label, seedLang) || "").trim().toLowerCase();
  if (localized) norms.add(localized);
  for (const norm of norms) {
    if (!norm) continue;
    if (deletedItemKeys.has(`word::${catId}::${norm}`)) return true;
    if (deletedItemKeys.has(`word::label::${norm}`)) return true;
    if (verbFormTag && deletedItemKeys.has(`word::${catId}::${verbFormTag}::${norm}`)) return true;
  }
  return false;
}

export function unblockDeletedWord(catId: string, label: string, wordId?: string) {
  const norms = new Set([(label || "").trim().toLowerCase()]);
  const en = (canonicalWordEn(label) || "").trim().toLowerCase();
  if (en) norms.add(en);
  for (const norm of norms) {
    deletedItemKeys.delete(`word::${catId}::${norm}`);
    deletedItemKeys.delete(`word::label::${norm}`);
    VERB_FORM_TAGS.forEach((t) => deletedItemKeys.delete(`word::${catId}::${t}::${norm}`));
  }
  if (wordId) {
    deletedItemKeys.delete(`word::id::${wordId}`);
  }
  persistDeletedKeys();
}

/** Bring older records up to the current shape without recreating anything. */
function migrate(list: CustomCategory[]): CustomCategory[] {
  return list.map((c, i) => {
    return {
      ...c,
      color: c.color ?? FOLDER_COLORS[i % FOLDER_COLORS.length],
      icon: c.icon ?? "📁",
      hidden: c.hidden ?? false,
      parentCategoryId: c.parentCategoryId ?? null,
      order: typeof c.order === "number" ? c.order : i,
      source: c.source ?? "manual",
      words: (c.words ?? []).map((w, wi) => ({
        ...w,
        imageUri: w.imageUri || getPictogramUrl(w.label) || undefined,
        size: w.size ?? "md",
        useTextToSpeech: w.useTextToSpeech ?? !w.audioUri,
        order: typeof w.order === "number" ? w.order : wi,
        hidden: w.hidden ?? false,
        useCount: w.useCount ?? 0,
        lastUsedAt: w.lastUsedAt,
        isCustom: w.isCustom ?? (c.source === "manual" ? true : undefined),
      })),
    };
  });
}

export async function ensureCategoriesLoaded(): Promise<void> {
  await ensureDeletedKeysLoaded();
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = migrate(raw ? (JSON.parse(raw) as CustomCategory[]) : []);
  } catch {
    cache = [];
  }
  loaded = true;
  if (cache.length === 0) {
    seedStarterBoard();
  } else {
    // If Core was deleted by user, record in deletedItemKeys so it never resurrects
    const hasCore = cache.some(
      (c) =>
        (c.name || "").toLowerCase() === "core" ||
        c.name === "بنیادی" ||
        c.name === "أساسي"
    );
    if (!hasCore && cache.length > 0) {
      deletedItemKeys.add("cat::core");
      deletedItemKeys.add("cat::بنیادی");
      deletedItemKeys.add("cat::أساسي");
      persistDeletedKeys();
    }
    ensureAllStandardCategories();
    cleanAndDeduplicateCategories();
    retranslateSeedBoard(seedLang);
    refreshSayItForMeImages();
  }
}

/**
 * One-time repair for installs that seeded the "Say It For Me" board before
 * its per-sentence pictogram map existed (they got the generic word-split
 * fallback image, e.g. every card showing the same "want"/"help" hand icon).
 * Recomputes each word's image from its English source text and only writes
 * if it actually changed, so it's cheap to call on every load.
 */
function refreshSayItForMeImages() {
  const enWords = STARTER.find((s) => s.name === "Say It For Me")?.words.map(([label]) => label);
  if (!enWords) return;
  const cat = cache.find((c) => (FOLDER_EN_BY_LANG[c.name.toLowerCase()] ?? c.name) === "Say It For Me");
  if (!cat) return;
  let changed = false;
  cat.words.forEach((w, i) => {
    if (!w.imageUri) {
      const en = enWords[i];
      const correctUri = en ? getPictogramUrl(en) : null;
      if (correctUri) {
        w.imageUri = correctUri;
        changed = true;
      }
    }
  });
  if (changed) {
    cache = [...cache];
    persist();
  }
}

// --- starter board -------------------------------------------------------

const STARTER: { name: string; icon: string; color?: string; words: [string, string][] }[] = [
  {
    name: "Core",
    icon: "💬",
    color: "#2f6d62",
    words: [
      ["I", "🧒"],
      ["am", "✨"],
      ["is", "✨"],
      ["are", "✨"],
      ["was", "✨"],
      ["I want", "➕"],
      ["More", "➕"],
      ["Help", "❓"],
      ["No", "➖"],
      ["Yes", "✓"],
      ["All done", "⭐"],
      ["I need", "🤲"],
      ["I feel", "💭"],
      ["I like", "❤️"],
      ["Can I have", "🙏"],
      ["Please", "🤲"],
      ["Thank you", "🙏"],
      ["Stop", "🛑"],
      ["Go", "🚶"],
      ["to", "➡️"],
      ["the", "🔹"],
    ],
  },
  {
    name: "People",
    icon: "♡",
    color: "#c96b6b",
    words: [],
  },
  {
    name: "Feelings",
    icon: "😊",
    color: "#e67e22",
    words: [],
  },
  {
    name: "Actions",
    icon: "⚡",
    color: "#c98a3d",
    words: [],
  },
  {
    name: "Food",
    icon: "🍴",
    color: "#5c9a58",
    words: [],
  },
  {
    name: "Places",
    icon: "🏛️",
    color: "#4a7fe6",
    words: [],
  },
  {
    name: "Things",
    icon: "✨",
    color: "#8a6bc9",
    words: [],
  },
  {
    name: "Red",
    icon: "🎨",
    color: "#d9534f",
    words: [
      ["Red", "🔴"],
      ["Blue", "🔵"],
      ["Yellow", "🟡"],
      ["Green", "🟢"],
      ["Orange", "🟠"],
      ["Purple", "🟣"],
    ],
  },
  {
    name: "Say It For Me",
    icon: "🗨️",
    color: "#d9534f",
    words: [
      ["I want to eat", "🍽️"],
      ["I want to drink", "🥤"],
      ["I need the bathroom", "🚻"],
      ["I am happy", "😊"],
      ["I am sad", "😢"],
      ["I am in pain", "😣"],
      ["I want to play", "🎈"],
      ["I am sleepy", "😴"],
      ["I need help", "🙋"],
      ["I want to go outside", "🌳"],
      ["I love you", "❤️"],
      ["I am hungry", "🍎"],
      ["I am thirsty", "💧"],
      ["Thank you very much", "🙏"],
      ["Please help me", "🙏"],
      ["I don't feel well", "🤒"],
      ["I want my mom", "👩"],
      ["I want my dad", "👨"],
      ["Can we go home", "🏠"],
      ["I am scared", "😨"],
    ],
  },
  {
    name: "Schools",
    icon: "🏫",
    color: "#2f6d62",
    words: [
      ["School", "🏫"],
      ["Teacher", "👩‍🏫"],
      ["Class", "🧑‍🤝‍🧑"],
      ["Chair", "🪑"],
      ["Desk", "🛋️"],
      ["Recess", "🛝"],
      ["Crayons", "🖍️"],
      ["Blocks", "🧱"],
      ["Fire Drill", "🚨"],
      ["Slide", "🛝"],
      ["Swing", "🪵"],
      ["Book", "📖"],
      ["Numbers", "🔢"],
    ],
  },
  {
    name: "Sports",
    icon: "⚽",
    color: "#c96b6b",
    words: [
      ["Soccer", "⚽"],
      ["Basketball", "🏀"],
      ["Running", "🏃"],
      ["Swimming", "🏊"],
      ["Playground", "🛝"],
      ["Ride Bike", "🚲"],
    ],
  },
  {
    name: "Hygiene",
    icon: "🛁",
    color: "#8a6bc9",
    words: [
      ["Wash Hands", "🧼"],
      ["Brush Teeth", "🪥"],
      ["Toilet", "🚽"],
      ["Shower", "🚿"],
      ["Clean Up", "🧹"],
    ],
  },
  {
    name: "Music",
    icon: "🎸",
    color: "#d46cae",
    words: [
      ["Sing", "🎤"],
      ["Dance", "💃"],
      ["Guitar", "🎸"],
      ["Piano", "🎹"],
      ["Listen", "👂"],
      ["Song", "🎵"],
    ],
  },
];

// Helper to capitalize words
function capWord(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Complete A-Z Verbs mapping: each letter contains its verbs, each verb has 1st, 2nd, 3rd, and 4th forms
const VERBS_A_TO_Z: Record<string, { base: string; past: string; participle: string; continuous: string; emoji: string }[]> = {
  A: [
    { base: "ask", past: "asked", participle: "asked", continuous: "asking", emoji: "❓" },
    { base: "answer", past: "answered", participle: "answered", continuous: "answering", emoji: "💡" },
    { base: "agree", past: "agreed", participle: "agreed", continuous: "agreeing", emoji: "🤝" },
    { base: "arrive", past: "arrived", participle: "arrived", continuous: "arriving", emoji: "🛬" },
  ],
  B: [
    { base: "bake", past: "baked", participle: "baked", continuous: "baking", emoji: "🧁" },
    { base: "be", past: "was", participle: "been", continuous: "being", emoji: "✨" },
    { base: "bite", past: "bit", participle: "bitten", continuous: "biting", emoji: "🦷" },
    { base: "blow", past: "blew", participle: "blown", continuous: "blowing", emoji: "💨" },
    { base: "break", past: "broke", participle: "broken", continuous: "breaking", emoji: "💔" },
    { base: "breathe", past: "breathed", participle: "breathed", continuous: "breathing", emoji: "🌬️" },
    { base: "bring", past: "brought", participle: "brought", continuous: "bringing", emoji: "🎁" },
    { base: "brush", past: "brushed", participle: "brushed", continuous: "brushing", emoji: "🪥" },
    { base: "build", past: "built", participle: "built", continuous: "building", emoji: "🧱" },
    { base: "buy", past: "bought", participle: "bought", continuous: "buying", emoji: "🛍️" },
  ],
  C: [
    { base: "call", past: "called", participle: "called", continuous: "calling", emoji: "📞" },
    { base: "carry", past: "carried", participle: "carried", continuous: "carrying", emoji: "🎒" },
    { base: "catch", past: "caught", participle: "caught", continuous: "catching", emoji: "⚾" },
    { base: "choose", past: "chose", participle: "chosen", continuous: "choosing", emoji: "✅" },
    { base: "clean", past: "cleaned", participle: "cleaned", continuous: "cleaning", emoji: "🧹" },
    { base: "climb", past: "climbed", participle: "climbed", continuous: "climbing", emoji: "🧗" },
    { base: "close", past: "closed", participle: "closed", continuous: "closing", emoji: "🚪" },
    { base: "color", past: "colored", participle: "colored", continuous: "coloring", emoji: "🖍️" },
    { base: "come", past: "came", participle: "come", continuous: "coming", emoji: "🏃" },
    { base: "cook", past: "cooked", participle: "cooked", continuous: "cooking", emoji: "🍳" },
    { base: "count", past: "counted", participle: "counted", continuous: "counting", emoji: "🔢" },
    { base: "cry", past: "cried", participle: "cried", continuous: "crying", emoji: "😢" },
    { base: "cut", past: "cut", participle: "cut", continuous: "cutting", emoji: "✂️" },
  ],
  D: [
    { base: "dance", past: "danced", participle: "danced", continuous: "dancing", emoji: "💃" },
    { base: "do", past: "did", participle: "done", continuous: "doing", emoji: "✨" },
    { base: "draw", past: "drew", participle: "drawn", continuous: "drawing", emoji: "🎨" },
    { base: "dream", past: "dreamed", participle: "dreamed", continuous: "dreaming", emoji: "💭" },
    { base: "drink", past: "drank", participle: "drunk", continuous: "drinking", emoji: "🥤" },
    { base: "drive", past: "drove", participle: "driven", continuous: "driving", emoji: "🚗" },
    { base: "drop", past: "dropped", participle: "dropped", continuous: "dropping", emoji: "💧" },
  ],
  E: [
    { base: "eat", past: "ate", participle: "eaten", continuous: "eating", emoji: "🍽️" },
    { base: "enter", past: "entered", participle: "entered", continuous: "entering", emoji: "🚪" },
    { base: "exercise", past: "exercised", participle: "exercised", continuous: "exercising", emoji: "🏋️" },
    { base: "explain", past: "explained", participle: "explained", continuous: "explaining", emoji: "🗣️" },
  ],
  F: [
    { base: "fall", past: "fell", participle: "fallen", continuous: "falling", emoji: "🍂" },
    { base: "feel", past: "felt", participle: "felt", continuous: "feeling", emoji: "💓" },
    { base: "fight", past: "fought", participle: "fought", continuous: "fighting", emoji: "🥊" },
    { base: "find", past: "found", participle: "found", continuous: "finding", emoji: "🔎" },
    { base: "fix", past: "fixed", participle: "fixed", continuous: "fixing", emoji: "🔧" },
    { base: "fly", past: "flew", participle: "flown", continuous: "flying", emoji: "✈️" },
    { base: "fold", past: "folded", participle: "folded", continuous: "folding", emoji: "📄" },
    { base: "forget", past: "forgot", participle: "forgotten", continuous: "forgetting", emoji: "🙈" },
  ],
  G: [
    { base: "get", past: "got", participle: "got", continuous: "getting", emoji: "🤲" },
    { base: "give", past: "gave", participle: "given", continuous: "giving", emoji: "🤲" },
    { base: "go", past: "went", participle: "gone", continuous: "going", emoji: "🚶" },
    { base: "grow", past: "grew", participle: "grown", continuous: "growing", emoji: "🌱" },
  ],
  H: [
    { base: "have", past: "had", participle: "had", continuous: "having", emoji: "📦" },
    { base: "hear", past: "heard", participle: "heard", continuous: "hearing", emoji: "👂" },
    { base: "help", past: "helped", participle: "helped", continuous: "helping", emoji: "🆘" },
    { base: "hide", past: "hid", participle: "hidden", continuous: "hiding", emoji: "🫣" },
    { base: "hit", past: "hit", participle: "hit", continuous: "hitting", emoji: "💥" },
    { base: "hold", past: "held", participle: "held", continuous: "holding", emoji: "🤲" },
    { base: "hop", past: "hopped", participle: "hopped", continuous: "hopping", emoji: "🐰" },
    { base: "hug", past: "hugged", participle: "hugged", continuous: "hugging", emoji: "🫂" },
  ],
  I: [
    { base: "imagine", past: "imagined", participle: "imagined", continuous: "imagining", emoji: "🌈" },
    { base: "introduce", past: "introduced", participle: "introduced", continuous: "introducing", emoji: "🤝" },
    { base: "invite", past: "invited", participle: "invited", continuous: "inviting", emoji: "✉️" },
  ],
  J: [
    { base: "join", past: "joined", participle: "joined", continuous: "joining", emoji: "🤝" },
    { base: "jog", past: "jogged", participle: "jogged", continuous: "jogging", emoji: "🏃" },
    { base: "jump", past: "jumped", participle: "jumped", continuous: "jumping", emoji: "🦘" },
  ],
  K: [
    { base: "keep", past: "kept", participle: "kept", continuous: "keeping", emoji: "🔒" },
    { base: "kick", past: "kicked", participle: "kicked", continuous: "kicking", emoji: "⚽" },
    { base: "kiss", past: "kissed", participle: "kissed", continuous: "kissing", emoji: "😘" },
    { base: "knock", past: "knocked", participle: "knocked", continuous: "knocking", emoji: "🚪" },
    { base: "know", past: "knew", participle: "known", continuous: "knowing", emoji: "💡" },
  ],
  L: [
    { base: "laugh", past: "laughed", participle: "laughed", continuous: "laughing", emoji: "😄" },
    { base: "learn", past: "learned", participle: "learned", continuous: "learning", emoji: "🧠" },
    { base: "leave", past: "left", participle: "left", continuous: "leaving", emoji: "🚪" },
    { base: "like", past: "liked", participle: "liked", continuous: "liking", emoji: "❤️" },
    { base: "listen", past: "listened", participle: "listened", continuous: "listening", emoji: "👂" },
    { base: "look", past: "looked", participle: "looked", continuous: "looking", emoji: "👀" },
    { base: "love", past: "loved", participle: "loved", continuous: "loving", emoji: "💖" },
  ],
  M: [
    { base: "make", past: "made", participle: "made", continuous: "making", emoji: "🛠️" },
    { base: "meet", past: "met", participle: "met", continuous: "meeting", emoji: "🤝" },
    { base: "move", past: "moved", participle: "moved", continuous: "moving", emoji: "📦" },
  ],
  N: [
    { base: "need", past: "needed", participle: "needed", continuous: "needing", emoji: "🤲" },
    { base: "nod", past: "nodded", participle: "nodded", continuous: "nodding", emoji: "👍" },
    { base: "notice", past: "noticed", participle: "noticed", continuous: "noticing", emoji: "👁️" },
  ],
  O: [
    { base: "open", past: "opened", participle: "opened", continuous: "opening", emoji: "🚪" },
    { base: "order", past: "ordered", participle: "ordered", continuous: "ordering", emoji: "📝" },
  ],
  P: [
    { base: "paint", past: "painted", participle: "painted", continuous: "painting", emoji: "🖌️" },
    { base: "paste", past: "pasted", participle: "pasted", continuous: "pasting", emoji: "📋" },
    { base: "play", past: "played", participle: "played", continuous: "playing", emoji: "🎮" },
    { base: "point", past: "pointed", participle: "pointed", continuous: "pointing", emoji: "👉" },
    { base: "pull", past: "pulled", participle: "pulled", continuous: "pulling", emoji: "🫷" },
    { base: "push", past: "pushed", participle: "pushed", continuous: "pushing", emoji: "🫸" },
    { base: "put", past: "put", participle: "put", continuous: "putting", emoji: "📥" },
  ],
  Q: [
    { base: "quit", past: "quit", participle: "quit", continuous: "quitting", emoji: "⏹️" },
    { base: "question", past: "questioned", participle: "questioned", continuous: "questioning", emoji: "❓" },
  ],
  R: [
    { base: "read", past: "read", participle: "read", continuous: "reading", emoji: "📖" },
    { base: "rest", past: "rested", participle: "rested", continuous: "resting", emoji: "🛋️" },
    { base: "ride", past: "rode", participle: "ridden", continuous: "riding", emoji: "🚴" },
    { base: "ring", past: "rang", participle: "rung", continuous: "ringing", emoji: "🔔" },
    { base: "run", past: "ran", participle: "run", continuous: "running", emoji: "🏃" },
  ],
  S: [
    { base: "say", past: "said", participle: "said", continuous: "saying", emoji: "💬" },
    { base: "see", past: "saw", participle: "seen", continuous: "seeing", emoji: "👀" },
    { base: "share", past: "shared", participle: "shared", continuous: "sharing", emoji: "🤝" },
    { base: "show", past: "showed", participle: "shown", continuous: "showing", emoji: "👉" },
    { base: "sing", past: "sang", participle: "sung", continuous: "singing", emoji: "🎤" },
    { base: "sit", past: "sat", participle: "sat", continuous: "sitting", emoji: "🪑" },
    { base: "sleep", past: "slept", participle: "slept", continuous: "sleeping", emoji: "🛏️" },
    { base: "smell", past: "smelled", participle: "smelled", continuous: "smelling", emoji: "👃" },
    { base: "smile", past: "smiled", participle: "smiled", continuous: "smiling", emoji: "😊" },
    { base: "speak", past: "spoke", participle: "spoken", continuous: "speaking", emoji: "🗣️" },
    { base: "spell", past: "spelled", participle: "spelled", continuous: "spelling", emoji: "🔤" },
    { base: "stand", past: "stood", participle: "stood", continuous: "standing", emoji: "🧍" },
    { base: "stop", past: "stopped", participle: "stopped", continuous: "stopping", emoji: "🛑" },
    { base: "study", past: "studied", participle: "studied", continuous: "studying", emoji: "📚" },
    { base: "swim", past: "swam", participle: "swum", continuous: "swimming", emoji: "🏊" },
  ],
  T: [
    { base: "take", past: "took", participle: "taken", continuous: "taking", emoji: "🤏" },
    { base: "talk", past: "talked", participle: "talked", continuous: "talking", emoji: "💬" },
    { base: "taste", past: "tasted", participle: "tasted", continuous: "tasting", emoji: "👅" },
    { base: "teach", past: "taught", participle: "taught", continuous: "teaching", emoji: "👩‍🏫" },
    { base: "tell", past: "told", participle: "told", continuous: "telling", emoji: "🗣️" },
    { base: "think", past: "thought", participle: "thought", continuous: "thinking", emoji: "💭" },
    { base: "throw", past: "threw", participle: "thrown", continuous: "throwing", emoji: "🎯" },
    { base: "touch", past: "touched", participle: "touched", continuous: "touching", emoji: "👉" },
    { base: "try", past: "tried", participle: "tried", continuous: "trying", emoji: "🎯" },
    { base: "turn", past: "turned", participle: "turned", continuous: "turning", emoji: "🔄" },
  ],
  U: [
    { base: "understand", past: "understood", participle: "understood", continuous: "understanding", emoji: "💡" },
    { base: "use", past: "used", participle: "used", continuous: "using", emoji: "📱" },
  ],
  V: [
    { base: "visit", past: "visited", participle: "visited", continuous: "visiting", emoji: "🚗" },
    { base: "view", past: "viewed", participle: "viewed", continuous: "viewing", emoji: "👓" },
  ],
  W: [
    { base: "wait", past: "waited", participle: "waited", continuous: "waiting", emoji: "⏳" },
    { base: "wake", past: "woke", participle: "woken", continuous: "waking", emoji: "⏰" },
    { base: "walk", past: "walked", participle: "walked", continuous: "walking", emoji: "🚶" },
    { base: "want", past: "wanted", participle: "wanted", continuous: "wanting", emoji: "➕" },
    { base: "wash", past: "washed", participle: "washed", continuous: "washing", emoji: "🧼" },
    { base: "watch", past: "watched", participle: "watched", continuous: "watching", emoji: "📺" },
    { base: "wear", past: "wore", participle: "worn", continuous: "wearing", emoji: "👗" },
    { base: "win", past: "won", participle: "won", continuous: "winning", emoji: "🏆" },
    { base: "wish", past: "wished", participle: "wished", continuous: "wishing", emoji: "⭐" },
    { base: "work", past: "worked", participle: "worked", continuous: "working", emoji: "💼" },
    { base: "write", past: "wrote", participle: "written", continuous: "writing", emoji: "✏️" },
  ],
  X: [
    { base: "x-ray", past: "x-rayed", participle: "x-rayed", continuous: "x-raying", emoji: "🩻" },
  ],
  Y: [
    { base: "yawn", past: "yawned", participle: "yawned", continuous: "yawning", emoji: "🥱" },
    { base: "yell", past: "yelled", participle: "yelled", continuous: "yelling", emoji: "📢" },
  ],
  Z: [
    { base: "zip", past: "zipped", participle: "zipped", continuous: "zipping", emoji: "🤐" },
    { base: "zoom", past: "zoomed", participle: "zoomed", continuous: "zooming", emoji: "🏎️" },
  ],
};

/** Among duplicate matches, pick the copy the caregiver customised (their own picture/edits). */
function preferCustomized(candidates: CustomWord[]): CustomWord | undefined {
  return candidates.find((w) => w.isCustom) ?? candidates[0];
}

/** True when the uri is just the automatic pictogram for one of these labels (not a picture the user chose). */
function isAutoPicture(uri: string | undefined, labels: (string | undefined)[]): boolean {
  if (!uri) return true;
  return labels.some((l) => !!l && getPictogramUrl(l) === uri);
}

/**
 * When a word being added already exists in the category (same word, same verb form),
 * update that word with what the user picked instead of creating a duplicate that a
 * later clean-up would throw away along with the user's picture.
 */
function mergeIntoExistingWord(
  c: CustomCategory,
  incoming: Partial<CustomWord> & { label: string },
): boolean {
  const en = (canonicalWordEn(incoming.label) || incoming.label).trim().toLowerCase();
  const tag = incoming.verbFormTag;
  const existing = preferCustomized(
    c.words.filter(
      (w) =>
        (canonicalWordEn(w.label) || w.label).trim().toLowerCase() === en &&
        (tag ? (w.verbFormTag ?? tag) === tag : !w.verbFormTag),
    ),
  );
  if (!existing) return false;
  const autoLabels = [incoming.label, en, incoming.verbForms?.base, capWord(incoming.verbForms?.base || "")];
  if (incoming.imageUri && (!isAutoPicture(incoming.imageUri, autoLabels) || !existing.imageUri)) {
    existing.imageUri = incoming.imageUri;
  }
  if (incoming.color) existing.color = incoming.color;
  if (incoming.audioUri) {
    existing.audioUri = incoming.audioUri;
    existing.useTextToSpeech = incoming.useTextToSpeech ?? false;
  }
  if (incoming.verbForms) existing.verbForms = incoming.verbForms;
  if (tag) existing.verbFormTag = tag;
  existing.hidden = false;
  existing.isCustom = true;
  return true;
}

/** Returns the letter ("a".."z") if this category is a "Verbs X" sub-category, else null. */
function verbSubLetter(c: CustomCategory): string | null {
  if (!c.parentCategoryId) return null;
  const candidates = [c.seedName, canonicalWordEn(c.name), FOLDER_EN_BY_LANG[(c.name || "").toLowerCase()], c.name];
  for (const n of candidates) {
    const m = /^verbs ([a-z])$/i.exec((n || "").trim());
    if (m) return m[1].toLowerCase();
  }
  return null;
}

/** The letter a verb word belongs under: first letter of its 1st form (fell/fallen/falling -> "f"). */
function verbLetterOf(label: string): string | null {
  const en = (canonicalWordEn(label) || label || "").trim().toLowerCase();
  if (!en) return null;
  const vf = getVerbForms(en) || generateAllVerbForms(en);
  const letter = (vf?.base || en).charAt(0);
  return /[a-z]/.test(letter) ? letter : null;
}

/** For a word added to a "Verbs X" folder, the "Verbs Y" folder it actually belongs in (same parent). */
function verbBucketIdFor(catId: string, label: string): string {
  const cat = cache.find((c) => c.id === catId);
  if (!cat) return catId;
  const own = verbSubLetter(cat);
  const letter = verbLetterOf(label);
  if (!own || !letter || own === letter) return catId;
  const target = cache.find((c) => c.parentCategoryId === cat.parentCategoryId && verbSubLetter(c) === letter);
  return target?.id ?? catId;
}

/**
 * Every "Verbs X" folder holds only verbs whose 1st form starts with X.
 * Words in the wrong folder are moved to the right one (or dropped if already there).
 */
function enforceVerbLetterBuckets(): boolean {
  let changed = false;
  const subs = cache.filter((c) => verbSubLetter(c));
  const touched = new Set<CustomCategory>();
  for (const sub of subs) {
    const letter = verbSubLetter(sub)!;
    const keep: CustomWord[] = [];
    for (const w of sub.words) {
      const wl = verbLetterOf(w.label);
      if (!wl || wl === letter) {
        keep.push(w);
        continue;
      }
      changed = true;
      touched.add(sub);
      const target = subs.find((s) => s.parentCategoryId === sub.parentCategoryId && verbSubLetter(s) === wl);
      if (!target || isDeletedWord(target.id, w.label, w.verbFormTag)) continue;
      const wEn = (canonicalWordEn(w.label) || w.label).trim().toLowerCase();
      const dup = target.words.some(
        (tw) =>
          (canonicalWordEn(tw.label) || tw.label).trim().toLowerCase() === wEn &&
          (tw.verbFormTag ?? null) === (w.verbFormTag ?? null),
      );
      if (!dup) {
        target.words.push({ ...w, order: target.words.length });
        touched.add(target);
      }
    }
    sub.words = keep;
  }
  touched.forEach((c) => {
    c.words = sortWordsForCategory(c.words, c.name).map((w, i) => ({ ...w, order: i }));
  });
  return changed;
}

// Generates alphabetical Actions subcategories where every verb appears strictly in 1st -> 2nd -> 3rd -> 4th order
const ACTION_VERB_SUBCATEGORIES = Object.entries(VERBS_A_TO_Z).map(([letter, rawList]) => {
  const list = [...rawList].sort((a, b) => a.base.localeCompare(b.base, undefined, { sensitivity: "base" }));
  const words: [string, string, ("1st" | "2nd" | "3rd" | "4th")?][] = [];
  list.forEach((v) => {
    words.push([capWord(v.base), v.emoji, "1st"]);
    words.push([capWord(v.past), v.emoji, "2nd"]);
    words.push([capWord(v.participle), v.emoji, "3rd"]);
    words.push([capWord(v.continuous), v.emoji, "4th"]);
  });
  return {
    parentCategory: "Actions",
    name: `Verbs ${letter}`,
    icon: letter === "A" ? "🅰️" : letter === "B" ? "🅱️" : "🔤",
    words,
  };
});

export const STARTER_SUBCATEGORIES: {
  parentCategory: string;
  name: string;
  icon: string;
  words: [string, string, ("1st" | "2nd" | "3rd" | "4th")?][];
}[] = [
  // --- Food Subcategories ---
  {
    parentCategory: "Food",
    name: "Drinks",
    icon: "🥤",
    words: [
      ["Water", "💧"],
      ["Milk", "🥛"],
      ["Juice", "🧃"],
      ["Apple Juice", "🧃"],
      ["Orange Juice", "🍊"],
      ["Hot Chocolate", "☕"],
      ["Tea", "🍵"],
      ["Soda", "🥤"],
      ["Smoothie", "🥤"],
      ["Lemonade", "🍋"],
    ],
  },
  {
    parentCategory: "Food",
    name: "Fast Food",
    icon: "🍕",
    words: [
      ["Pizza", "🍕"],
      ["Burger", "🍔"],
      ["French Fries", "🍟"],
      ["Hot Dog", "🌭"],
      ["Chicken Nuggets", "🍗"],
      ["Taco", "🌮"],
      ["Sandwich", "🥪"],
      ["Fried Chicken", "🍗"],
      ["Onion Rings", "🧅"],
    ],
  },
  {
    parentCategory: "Food",
    name: "Fruits",
    icon: "🍎",
    words: [
      ["Apple", "🍎"],
      ["Banana", "🍌"],
      ["Orange", "🍊"],
      ["Strawberry", "🍓"],
      ["Grapes", "🍇"],
      ["Watermelon", "🍉"],
      ["Peach", "🍑"],
      ["Mango", "🥭"],
      ["Pineapple", "🍍"],
      ["Pear", "🍐"],
      ["Cherries", "🍒"],
    ],
  },
  {
    parentCategory: "Food",
    name: "Vegetables",
    icon: "🥦",
    words: [
      ["Carrot", "🥕"],
      ["Broccoli", "🥦"],
      ["Corn", "🌽"],
      ["Potato", "🥔"],
      ["Cucumber", "🥒"],
      ["Tomato", "🍅"],
      ["Peas", "🫛"],
      ["Lettuce", "🥬"],
      ["Onion", "🧅"],
      ["Pepper", "🫑"],
    ],
  },
  {
    parentCategory: "Food",
    name: "Breakfast & Meals",
    icon: "🍳",
    words: [
      ["Eggs", "🍳"],
      ["Pancakes", "🥞"],
      ["Waffles", "🧇"],
      ["Cereal", "🥣"],
      ["Toast", "🍞"],
      ["Rice", "🍚"],
      ["Noodles", "🍜"],
      ["Pasta", "🍝"],
      ["Soup", "🍲"],
      ["Grilled Cheese", "🥪"],
    ],
  },
  {
    parentCategory: "Food",
    name: "Snacks & Sweets",
    icon: "🍪",
    words: [
      ["Cookie", "🍪"],
      ["Ice Cream", "🍦"],
      ["Cake", "🎂"],
      ["Donut", "🍩"],
      ["Chips", "🥔"],
      ["Popcorn", "🍿"],
      ["Candy", "🍬"],
      ["Chocolate", "🍫"],
      ["Cupcake", "🧁"],
      ["Pretzel", "🥨"],
    ],
  },

  // --- People Subcategories ---
  {
    parentCategory: "People",
    name: "Family",
    icon: "👨‍👩‍👧",
    words: [
      ["Mom", "👩"],
      ["Dad", "👨"],
      ["Brother", "👦"],
      ["Sister", "👧"],
      ["Baby", "👶"],
      ["Grandma", "👵"],
      ["Grandpa", "👴"],
      ["Aunt", "👩"],
      ["Uncle", "👨"],
      ["Cousin", "🧑"],
      ["Pet", "🐶"],
    ],
  },
  {
    parentCategory: "People",
    name: "Friends & School",
    icon: "👩‍🏫",
    words: [
      ["Teacher", "👩‍🏫"],
      ["Friend", "🧑‍🤝‍🧑"],
      ["Classmate", "🧑"],
      ["Principal", "👨‍💼"],
      ["Aide", "👩‍💼"],
      ["Student", "🧑‍🎓"],
      ["Me", "🧒"],
      ["You", "👉"],
    ],
  },
  {
    parentCategory: "People",
    name: "Helpers & Therapists",
    icon: "🩺",
    words: [
      ["Doctor", "👨‍⚕️"],
      ["Nurse", "👩‍⚕️"],
      ["Speech Therapist", "🗣️"],
      ["OT", "🩺"],
      ["PT", "🏃"],
      ["Police", "👮"],
      ["Firefighter", "👨‍🚒"],
      ["Driver", "🚌"],
    ],
  },

  // --- Feelings Subcategories ---
  {
    parentCategory: "Feelings",
    name: "Happy & Calm",
    icon: "😊",
    words: [
      ["Happy", "😊"],
      ["Excited", "🤩"],
      ["Proud", "🦁"],
      ["Calm", "😌"],
      ["Loved", "🥰"],
      ["Relaxed", "🧘"],
      ["Silly", "😜"],
      ["Energetic", "⚡"],
      ["Safe", "🛡️"],
    ],
  },
  {
    parentCategory: "Feelings",
    name: "Hard Feelings",
    icon: "😢",
    words: [
      ["Sad", "😢"],
      ["Angry", "😠"],
      ["Frustrated", "😤"],
      ["Scared", "😨"],
      ["Worried", "😟"],
      ["Confused", "😕"],
      ["Jealous", "😒"],
      ["Lonely", "🥺"],
      ["Bored", "🥱"],
    ],
  },
  {
    parentCategory: "Feelings",
    name: "Body Sensations",
    icon: "🤒",
    words: [
      ["Tired", "😴"],
      ["Hungry", "🍎"],
      ["Thirsty", "💧"],
      ["Sick", "🤒"],
      ["Hurt", "🤕"],
      ["Cold", "🥶"],
      ["Hot", "🥵"],
      ["Itchy", "🦟"],
      ["Full", "🫄"],
      ["Dizzy", "😵"],
    ],
  },

  // --- Places Subcategories ---
  {
    parentCategory: "Places",
    name: "Home",
    icon: "🏡",
    words: [
      ["Home", "🏠"],
      ["Bedroom", "🛏️"],
      ["Living Room", "🛋️"],
      ["Kitchen", "🍳"],
      ["Bathroom", "🚻"],
      ["Backyard", "🌳"],
      ["Outside", "🏕️"],
      ["Car", "🚗"],
      ["Bed", "🛏️"],
      ["Couch", "🛋️"],
      ["Dining Room", "🍽️"],
    ],
  },
  {
    parentCategory: "Places",
    name: "School & Community",
    icon: "🏫",
    words: [
      ["School", "🏫"],
      ["Classroom", "🏫"],
      ["Playground", "🛝"],
      ["Cafeteria", "🍽️"],
      ["Library", "📚"],
      ["Gym", "🏀"],
      ["Bus", "🚌"],
      ["Park", "🌳"],
      ["Hallway", "🚶"],
      ["Street", "🛣️"],
    ],
  },
  {
    parentCategory: "Places",
    name: "Health & Clinic",
    icon: "🏥",
    words: [
      ["Doctor Office", "🏥"],
      ["Dentist Clinic", "🦷"],
      ["Hospital", "🏥"],
      ["Therapy Clinic", "🩺"],
      ["Clinic", "🏥"],
      ["Pharmacy", "💊"],
    ],
  },
  {
    parentCategory: "Places",
    name: "Fun Outings",
    icon: "🏬",
    words: [
      ["Store", "🏪"],
      ["Supermarket", "🛒"],
      ["Mall", "🏬"],
      ["Restaurant", "🍽️"],
      ["Zoo", "🦁"],
      ["Beach", "🏖️"],
      ["Movie Theater", "🎬"],
      ["Pool", "🏊"],
    ],
  },

  // --- Things Subcategories ---
  {
    parentCategory: "Things",
    name: "Toys & Tech",
    icon: "🧸",
    words: [
      ["Tablet", "📱"],
      ["Phone", "📞"],
      ["Toy Car", "🚗"],
      ["Doll", "🪆"],
      ["Blocks", "🧱"],
      ["Puzzle", "🧩"],
      ["Ball", "⚽"],
      ["Toy", "🧸"],
      ["Video Game", "🎮"],
      ["Train", "🚂"],
      ["Teddy Bear", "🧸"],
    ],
  },
  {
    parentCategory: "Things",
    name: "School Supplies",
    icon: "🎒",
    words: [
      ["Backpack", "🎒"],
      ["Pencil", "✏️"],
      ["Crayon", "🖍️"],
      ["Scissors", "✂️"],
      ["Glue", "🧴"],
      ["Paper", "📄"],
      ["Book", "📖"],
      ["Marker", "🖊️"],
      ["Ruler", "📏"],
      ["Eraser", "🧼"],
    ],
  },
  {
    parentCategory: "Things",
    name: "Clothes",
    icon: "👕",
    words: [
      ["Shirt", "👕"],
      ["Pants", "👖"],
      ["Shoes", "👟"],
      ["Socks", "🧦"],
      ["Jacket", "🧥"],
      ["Hat", "🧢"],
      ["Pajamas", "🩳"],
      ["Dress", "👗"],
      ["Shorts", "🩳"],
      ["Boots", "🥾"],
      ["Clothes", "👕"],
      ["Blanket", "🧶"],
    ],
  },
  {
    parentCategory: "Things",
    name: "Bathroom & Hygiene",
    icon: "🛁",
    words: [
      ["Toothbrush", "🪥"],
      ["Toothpaste", "🧴"],
      ["Soap", "🧼"],
      ["Shampoo", "🧴"],
      ["Towel", "🧖"],
      ["Hairbrush", "💇"],
      ["Toilet Paper", "🧻"],
      ["Shower", "🚿"],
      ["Cup", "🥤"],
    ],
  },

  // --- Actions Alphabetical A to Z Subcategories ---
  ...ACTION_VERB_SUBCATEGORIES,
];

// Built-in folder names (starter board + bulk-build seed lists), by language.
const FOLDER_NAMES: Partial<Record<LanguageCode, Record<string, string>>> = {
  "ar-SA": {
    Core: "أساسي", Food: "طعام", Feelings: "مشاعر", People: "أشخاص", Actions: "أفعال",
    Places: "أماكن", Things: "أشياء", Red: "أحمر",
    Schools: "مدرسة", Sentences: "جمل", Tools: "أدوات", Emotion: "عاطفة", Attributes: "صفات",
    Sports: "رياضة", Hygiene: "نظافة", Music: "موسيقى", "Say It For Me": "قلها لي",
    "My Words": "كلماتي", "New Folder": "مجلد جديد",
    // Subcategories
    Drinks: "مشروبات", "Fast Food": "وجبات سريعة", Fruits: "فواكه", Vegetables: "خضروات",
    "Breakfast & Meals": "فطور ووجبات", "Snacks & Sweets": "وجبات خفيفة وحلويات",
    Family: "العائلة", "Friends & School": "الأصدقاء والمدرسة", "Helpers & Therapists": "المساعدون والمعالجون",
    "Happy & Calm": "سعيد وهادئ", "Hard Feelings": "مشاعر صعبة", "Body Sensations": "أحاسيس الجسد",
    Home: "منزل", "School & Community": "المدرسة والمجتمع", "Health & Clinic": "الصحة والعيادة", "Fun Outings": "نزهات ممتعة",
    "Toys & Tech": "ألعاب وتكنولوجيا", "School Supplies": "أدوات مدرسية", Clothes: "ملابس", "Bathroom & Hygiene": "حمام ونظافة",
    Animals: "حيوانات", Colors: "ألوان", Shapes: "أشكال",
    Vehicles: "مركبات", "Body Parts": "أجزاء الجسم", Weather: "الطقس",
    Jobs: "وظائف", Instruments: "آلات موسيقية",
    Furniture: "أثاث", "Days of the Week": "أيام الأسبوع", Months: "الشهور", Numbers: "أرقام", Letters: "حروف",
    Snacks: "وجبات خفيفة", Toys: "ألعاب", Dessert: "حلويات",
    Breakfast: "فطور", Lunch: "غداء", Dinner: "عشاء", Kitchen: "مطبخ", Bedroom: "غرفة نوم",
    Park: "حديقة", Hospital: "مستشفى", Store: "متجر", Mall: "مركز تسوق",
    Airport: "مطار", Playground: "ملعب", Garden: "حديقة", Beach: "شاطئ", Farm: "مزرعة",
    Zoo: "حديقة حيوان", Classroom: "فصل دراسي", Office: "مكتب", Bathroom: "حمام",
    "Wild Animals": "حيوانات برية", "Farm Animals": "حيوانات المزرعة", "Sea Animals": "حيوانات بحرية",
    Pets: "حيوانات أليفة", "Hot Drinks": "مشروبات ساخنة", "Cold Drinks": "مشروبات باردة",
    "Outdoor Toys": "ألعاب خارجية", "Indoor Toys": "ألعاب داخلية",
    Dairy: "منتجات ألبان", Sweets: "حلويات", Meat: "لحوم", Tech: "تكنولوجيا",
    Electronics: "إلكترونيات", Art: "فنون", Books: "كتب",
    ...Object.fromEntries("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((L) => [`Verbs ${L}`, `أفعال ${L}`])),
  },
  "ur-PK": {
    Core: "بنیادی", Food: "کھانا", Feelings: "احساسات", People: "لوگ", Actions: "کام",
    Places: "مقامات", Things: "چیزیں", Red: "لال",
    Schools: "اسکول", Sentences: "جملے", Tools: "اوزار", Emotion: "جذبات", Attributes: "خصوصیات",
    Sports: "کھیل", Hygiene: "صفائی", Music: "موسیقی", "Say It For Me": "میرے لیے کہو",
    "My Words": "میرے الفاظ", "New Folder": "نیا فولڈر",
    // Subcategories
    Drinks: "مشروبات", "Fast Food": "فاسٹ فوڈ", Fruits: "پھل", Vegetables: "سبزیاں",
    "Breakfast & Meals": "ناشتہ اور کھانا", "Snacks & Sweets": "ناشتہ اور مٹھائیاں",
    Family: "خاندان", "Friends & School": "دوست اور اسکول", "Helpers & Therapists": "مددگار اور معالج",
    "Happy & Calm": "خوش اور پرسکون", "Hard Feelings": "مشکل احساسات", "Body Sensations": "جسمانی احساسات",
    Home: "گھر", "School & Community": "اسکول اور کمیونٹی", "Health & Clinic": "صحت اور کلینک", "Fun Outings": "تفریحی مقامات",
    "Toys & Tech": "کھلونے اور ٹیک", "School Supplies": "اسکول کا سامان", Clothes: "کپڑے", "Bathroom & Hygiene": "بیت الخلاء اور صفائی",
    Animals: "جانور", Colors: "رنگ", Shapes: "شکلیں",
    Vehicles: "گاڑیاں", "Body Parts": "جسم کے حصے", Weather: "موسم",
    Jobs: "پیشے", "Days of the Week": "ہفتے کے دن", Months: "مہینے",
    Snacks: "ناشتہ", Toys: "کھلونے", Dessert: "میٹھے کھانے",
    Breakfast: "ناشتہ", Lunch: "دوپہر کا کھانا", Dinner: "رات کا کھانا", Kitchen: "باورچی خانہ", Bedroom: "سونے کا کمرہ",
    Park: "پارک", Hospital: "ہسپتال", Store: "دکان", Mall: "شاپنگ مال",
    Airport: "ہوائی اڈہ", Playground: "کھیل کا میدان", Garden: "باغ", Beach: "ساحل", Farm: "فارم",
    Zoo: "چڑیا گھر", Classroom: "کلاس روم", Office: "دفتر", Bathroom: "بیت الخلاء",
    "Wild Animals": "جنگلی جانور", "Farm Animals": "پالتو جانور", "Sea Animals": "سمندری جانور",
    Pets: "پالتو جانور", "Hot Drinks": "گرم مشروبات", "Cold Drinks": "ٹھنڈے مشروبات",
    "Outdoor Toys": "باہر کے کھلونے", "Indoor Toys": "گھر کے کھلونے",
    Dairy: "ڈیری", Sweets: "مٹھائیاں", Meat: "گوشت", Tech: "ٹیکنالوجی",
    Electronics: "الیکٹرانکس", Art: "آرٹ", Books: "کتابیں",
    ...Object.fromEntries("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((L) => [`Verbs ${L}`, `کام ${L}`])),
  },
};
function folderName(en: string, lang: LanguageCode = seedLang) {
  return FOLDER_NAMES[lang]?.[en] ?? FOLDER_NAMES[seedLang]?.[en] ?? en;
}

// reverse map: any localised folder name → its English anchor
const FOLDER_EN_BY_LANG: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const lang of Object.keys(FOLDER_NAMES) as LanguageCode[]) {
    for (const [en, local] of Object.entries(FOLDER_NAMES[lang] ?? {})) m[local.toLowerCase()] = en;
  }
  for (const en of Object.keys(FOLDER_NAMES["ar-SA"] ?? {})) m[en.toLowerCase()] = en;
  // Critical canonical anchors
  m["مشاعر"] = "Feelings";
  m["عاطفة"] = "Feelings";
  m["احساسات"] = "Feelings";
  m["جذبات"] = "Feelings";
  m["emotion"] = "Feelings";
  m["emotions"] = "Feelings";
  m["feeling"] = "Feelings";
  m["feelings"] = "Feelings";
  m["feelings2"] = "Feelings";
  m["أشخاص"] = "People";
  m["لوگ"] = "People";
  m["أفعال"] = "Actions";
  m["کام"] = "Actions";
  m["طعام"] = "Food";
  m["کھانا"] = "Food";
  m["أماكن"] = "Places";
  m["مقامات"] = "Places";
  m["أشياء"] = "Things";
  m["چیزیں"] = "Things";
  m["أساسي"] = "Core";
  m["بنیادی"] = "Core";
  m["قلها لي"] = "Say It For Me";
  m["میرے لیے کہو"] = "Say It For Me";
  return m;
})();

let isTranslatingPending = false;
async function translatePendingAsync(
  items: { type: "cat" | "word"; id: string; catId?: string; originalText: string }[],
  targetLang: LanguageCode
) {
  if (isTranslatingPending || items.length === 0) return;
  isTranslatingPending = true;
  let hasUpdates = false;

  try {
    for (const item of items) {
      if (targetLang !== seedLang) break; // language changed in the meantime
      const translated = await translateDynamic(item.originalText, targetLang);
      if (translated && translated.toLowerCase() !== item.originalText.toLowerCase()) {
        if (item.type === "cat") {
          const targetCat = cache.find((c) => c.id === item.id);
          if (targetCat && targetCat.name === item.originalText) {
            targetCat.name = translated;
            hasUpdates = true;
          }
        } else if (item.type === "word" && item.catId) {
          const targetCat = cache.find((c) => c.id === item.catId);
          const targetWord = targetCat?.words.find((w) => w.id === item.id);
          if (targetWord && targetWord.label === item.originalText) {
            targetWord.label = translated;
            targetWord.phrase = translated;
            hasUpdates = true;
          }
        }
      }
    }
  } finally {
    isTranslatingPending = false;
    if (hasUpdates) {
      cache = [...cache];
      persist();
    }
  }
}

/**
 * Re-translate vocabulary and categories across the entire board.
 * Covers all categories (built-in + caregiver created) and words.
 * Performs instantaneous synchronous translation with comprehensive dictionaries & cache,
 * and dynamically translates any remaining custom items in the background.
 */
export function retranslateSeedBoard(lang: LanguageCode) {
  seedLang = lang;
  cleanAndDeduplicateCategories();
  let changed = false;
  const isTargetArabic = lang === "ar-SA" || lang === "ur-PK";
  const pendingAsyncItems: { type: "cat" | "word"; id: string; catId?: string; originalText: string }[] = [];

  for (const cat of cache) {
    if (cat.isCustom) continue;
    // 1. Category name translation
    const rawCatName = cat.name.trim();
    if (lang === "en-US") {
      const enCat = canonicalWordEn(rawCatName) || FOLDER_EN_BY_LANG[rawCatName.toLowerCase()] || rawCatName;
      if (enCat !== cat.name) {
        cat.name = enCat;
        changed = true;
      }
    } else {
      const enCat = canonicalWordEn(rawCatName) || FOLDER_EN_BY_LANG[rawCatName.toLowerCase()] || rawCatName;
      const localizedName = FOLDER_NAMES[lang]?.[enCat] || wordLabel(enCat, lang);
      if (localizedName && localizedName.toLowerCase() !== rawCatName.toLowerCase()) {
        cat.name = localizedName;
        changed = true;
      } else if (isTargetArabic && !/[\u0600-\u06FF]/.test(cat.name)) {
        pendingAsyncItems.push({ type: "cat", id: cat.id, originalText: cat.name });
      }
    }

    // 2. Words translation
    cat.words.forEach((w) => {
      if (w.isCustom) return;
      const rawWordLabel = w.label.trim();
      if (lang === "en-US") {
        const en = canonicalWordEn(rawWordLabel);
        if (en && en !== w.label) {
          w.label = en;
          w.phrase = en;
          changed = true;
        }
      } else {
        const en = canonicalWordEn(rawWordLabel);
        const localized = wordLabel(en, lang);

        if (localized && localized.toLowerCase() !== rawWordLabel.toLowerCase()) {
          w.label = localized;
          w.phrase = localized;
          changed = true;
        } else if (isTargetArabic && !/[\u0600-\u06FF]/.test(w.label)) {
          pendingAsyncItems.push({ type: "word", id: w.id, catId: cat.id, originalText: w.label });
        }
      }
    });
  }

  if (changed) {
    cache = [...cache];
    persist();
  }

  // 3. Dynamic background translation for any remaining custom words/categories
  if (pendingAsyncItems.length > 0 && isTargetArabic) {
    translatePendingAsync(pendingAsyncItems, lang);
  }
}

function ensureAllStandardCategories() {
  let changed = false;
  const now = Date.now();

  STARTER.forEach((s, idx) => {
    if (isDeletedCategory(s.name)) return;
    const sName = s.name.toLowerCase();
    const hit = cache.find((c) => {
      if (c.parentCategoryId) return false;
      const en = (canonicalWordEn(c.name) || FOLDER_EN_BY_LANG[c.name.toLowerCase()] || c.name).trim().toLowerCase();
      return (
        en === sName ||
        c.name.toLowerCase() === sName ||
        c.name.toLowerCase() === folderName(s.name).toLowerCase()
      );
    });
    if (!hit) {
      cache.push({
        id: uid("cat"),
        name: folderName(s.name),
        createdAt: now,
        updatedAt: now,
        source: "seed",
        grouping: "none",
        color: s.color || FOLDER_COLORS[idx % FOLDER_COLORS.length],
        icon: s.icon,
        parentCategoryId: null,
        order: idx,
        words: s.words.map(([label, emoji], wi) => {
          const localized = starterLabel(label, seedLang) || label;
          return {
            id: uid("w"),
            label: localized,
            phrase: localized,
            emoji,
            imageUri: getPictogramUrl(label) || undefined,
            useTextToSpeech: true,
            size: "md" as TileSize,
            order: wi,
            useCount: wi % 2 === 0 ? (wi === 0 || wi === 4 ? 2 : 1) : 0,
            lastUsedAt: wi % 2 === 0 ? Date.now() : undefined,
          };
        }),
      });
      changed = true;
    } else if (s.name === "Core") {
      // Ensure Core has all the key starter words from the screenshot
      s.words.forEach(([label, emoji], wi) => {
        if (!isDeletedWord(hit.id, label) && !hit.words.some((w) => w.label.toLowerCase() === label.toLowerCase())) {
          hit.words.push({
            id: uid("w"),
            label,
            phrase: label,
            emoji,
            imageUri: getPictogramUrl(label) || undefined,
            useTextToSpeech: true,
            size: "md" as TileSize,
            order: hit.words.length,
            useCount: label === "I want" || label === "Yes" ? 2 : label === "All done" ? 1 : 0,
            lastUsedAt: label === "I want" || label === "Yes" || label === "All done" ? Date.now() : undefined,
          });
          changed = true;
        }
      });
    }
  });

  // 1. Remove obsolete seed subcategories under Actions that are not in current STARTER_SUBCATEGORIES
  const actionsCat = cache.find(
    (c) =>
      !c.parentCategoryId &&
      (c.name.toLowerCase() === "actions" || (FOLDER_EN_BY_LANG[c.name.toLowerCase()] ?? c.name).toLowerCase() === "actions")
  );
  if (actionsCat) {
    const validActionSubNames = new Set(
      STARTER_SUBCATEGORIES.filter((s) => s.parentCategory === "Actions").map((s) => s.name.toLowerCase())
    );
    const toRemove = cache.filter(
      (c) => c.parentCategoryId === actionsCat.id && c.source === "seed" && !validActionSubNames.has(c.name.toLowerCase())
    );
    if (toRemove.length > 0) {
      const removeIds = new Set(toRemove.map((c) => c.id));
      cache = cache.filter((c) => !removeIds.has(c.id));
      changed = true;
    }
  }

  // 2. Ensure standard sub-categories exist and have their words populated in exact sequence
  STARTER_SUBCATEGORIES.forEach((sub, subIdx) => {
    const parent = cache.find(
      (c) =>
        !c.parentCategoryId &&
        (c.name.toLowerCase() === sub.parentCategory.toLowerCase() ||
          (FOLDER_EN_BY_LANG[c.name.toLowerCase()] ?? c.name).toLowerCase() === sub.parentCategory.toLowerCase())
    );
    if (!parent) return;

    if (isDeletedCategory(sub.name, parent.id)) {
      return; // Never recreate a subcategory deleted by user
    }

    let subCat = cache.find(
      (c) =>
        c.parentCategoryId === parent.id &&
        ((c.seedName && c.seedName.toLowerCase() === sub.name.toLowerCase()) ||
          (canonicalWordEn(c.name) || FOLDER_EN_BY_LANG[c.name.toLowerCase()] || c.name).toLowerCase() === sub.name.toLowerCase() ||
          c.name.toLowerCase() === sub.name.toLowerCase() ||
          c.name.toLowerCase() === folderName(sub.name).toLowerCase())
    );

    if (!subCat) {
      subCat = {
        id: uid("cat"),
        name: folderName(sub.name),
        createdAt: now,
        updatedAt: now,
        source: "seed",
        grouping: "none",
        color: parent.color,
        icon: sub.icon,
        parentCategoryId: parent.id,
        order: subIdx,
        words: [],
        seedName: sub.name,
      };
      cache.push(subCat);
      changed = true;
    } else {
      if (!subCat.seedName) subCat.seedName = sub.name;
      if (!subCat.isCustom) {
        const targetName = folderName(sub.name);
        if (subCat.name !== targetName && (canonicalWordEn(subCat.name) || FOLDER_EN_BY_LANG[subCat.name.toLowerCase()] || subCat.name).toLowerCase() === sub.name.toLowerCase()) {
          subCat.name = targetName;
          changed = true;
        }
      }
    }

    // Populate and synchronize words for this sub-category in strict sequential order
    const usedExistingIds = new Set<string>();
    const targetWords = sub.words
      .filter(([label, , verbFormTag]) => !isDeletedWord(subCat!.id, label, verbFormTag))
      .map(([label, emoji, verbFormTag], wi) => {
        const existing = preferCustomized(subCat!.words.filter((w) => {
          if (usedExistingIds.has(w.id)) return false;
          if (w.seedLabel && w.seedLabel.toLowerCase() === label.toLowerCase()) {
            return !(verbFormTag && w.verbFormTag) || w.verbFormTag === verbFormTag;
          }
          const en = (canonicalWordEn(w.label) || w.label).toLowerCase();
          const matchesLabel = en === label.toLowerCase() || w.label.toLowerCase() === label.toLowerCase();
          if (!matchesLabel) return false;
          if (verbFormTag && w.verbFormTag) {
            return w.verbFormTag === verbFormTag;
          }
          return true;
        }));
        if (existing) usedExistingIds.add(existing.id);
        const localized = wordLabel(label, seedLang) || label;
        return {
          id: existing?.id ?? uid("w"),
          label: existing?.isCustom ? existing.label : localized,
          phrase: existing?.isCustom ? existing.phrase : localized,
          emoji: existing?.emoji || emoji || "🔹",
          imageUri: existing?.imageUri || getPictogramUrl(label) || undefined,
          color: existing?.color,
          audioUri: existing?.audioUri,
          useTextToSpeech: existing?.useTextToSpeech ?? true,
          size: existing?.size ?? "md",
          order: wi,
          useCount: existing?.useCount ?? 0,
          verbFormTag: verbFormTag ?? existing?.verbFormTag,
          hidden: existing?.hidden ?? false,
          isCustom: existing?.isCustom,
          seedLabel: label,
        };
      });

    // Preserve any custom words the parent added to this category
    const isVerbSub = sub.name.toLowerCase().includes("verbs ") || sub.parentCategory.toLowerCase() === "actions";
    const customParentWords = subCat.words.filter((w) => {
      if (usedExistingIds.has(w.id)) return false; // already kept above
      if (w.isCustom) return true;
      const en = (canonicalWordEn(w.label) || w.label).toLowerCase();
      if (isVerbSub) {
        return !sub.words.some(([swLabel]) => swLabel.toLowerCase() === en || swLabel.toLowerCase() === w.label.toLowerCase());
      }
      return !sub.words.some(([swLabel, , swTag]) => {
        const matchesLabel = swLabel.toLowerCase() === en || swLabel.toLowerCase() === w.label.toLowerCase();
        if (!matchesLabel) return false;
        if (swTag && w.verbFormTag) return swTag === w.verbFormTag;
        return true;
      });
    });
    const combinedWords = [
      ...targetWords,
      ...customParentWords.map((cw, i) => ({ ...cw, order: targetWords.length + i })),
    ];

    if (
      subCat.words.length !== combinedWords.length ||
      subCat.words.some(
        (w, i) =>
          w.label !== combinedWords[i]?.label ||
          w.verbFormTag !== combinedWords[i]?.verbFormTag ||
          w.hidden !== combinedWords[i]?.hidden
      )
    ) {
      subCat.words = combinedWords;
      changed = true;
    }
  });

  // Ensure priority shelves appear first: Core, People, Feelings, Actions, Food, Places, Things, Red
  const priorityOrder = ["core", "people", "feelings", "actions", "food", "places", "things", "red", "say it for me"];
  cache.forEach((c) => {
    const enName = (FOLDER_EN_BY_LANG[c.name.toLowerCase()] ?? c.name).toLowerCase();
    const pIdx = priorityOrder.indexOf(enName);
    if (pIdx !== -1) {
      if (c.order !== pIdx) {
        c.order = pIdx;
        changed = true;
      }
    }
  });

  if (changed) {
    persist();
  }
}

function seedStarterBoard() {
  const now = Date.now();
  cache = STARTER.map((s, i) => ({
    id: uid("cat"),
    name: folderName(s.name),
    createdAt: now,
    updatedAt: now,
    source: "seed",
    grouping: "none",
    color: s.color || FOLDER_COLORS[i % FOLDER_COLORS.length],
    icon: s.icon,
    parentCategoryId: null,
    order: i,
    words: s.words.map(([label, emoji], wi) => {
      const localized = starterLabel(label, seedLang) || label;
      return {
        id: uid("w"),
        label: localized,
        phrase: localized,
        emoji,
        imageUri: getPictogramUrl(label) || undefined,
        useTextToSpeech: true,
        size: "md" as TileSize,
        order: wi,
      };
    }),
  }));
  persist();
}

function persist(): void {
  try {
    const raw = JSON.stringify(cache);
    AsyncStorage.setItem(KEY, raw).catch((err) => {
      console.warn("[customCategories] AsyncStorage setItem failed:", err);
      try {
        const leanCache = cache.map((cat) => ({
          ...cat,
          words: cat.words.map((w) => {
            if (w.imageUri && w.imageUri.startsWith("data:") && w.imageUri.length > 50000) {
              return { ...w, imageUri: getPictogramUrl(w.label) || undefined };
            }
            return w;
          }),
        }));
        AsyncStorage.setItem(KEY, JSON.stringify(leanCache)).catch(() => {});
      } catch {}
    });
  } catch (e) {
    console.error("[customCategories] persist serialization failed:", e);
  }
  notifyListeners();
}

export function listCategories(): CustomCategory[] {
  return [...cache].sort(byOrder);
}

export function getCategory(id: string): CustomCategory | undefined {
  return cache.find((c) => c.id === id);
}

export function categoryWordCount(): number {
  return cache.reduce((s, c) => s + c.words.length, 0);
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function byLabel(a: CustomWord, b: CustomWord): number {
  return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
}

/** Create a new category from reviewed words in one batch write. */
export function createCategory(input: {
  name: string;
  source: CustomCategory["source"];
  icon?: string;
  color?: string;
  imageUri?: string;
  words: { label: string; phrase: string; emoji: string; imageUri?: string }[];
}): CustomCategory {
  const now = Date.now();
  const sorted = [...input.words].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  const topCount = cache.filter((c) => !c.parentCategoryId).length;
  const cat: CustomCategory = {
    id: uid("cat"),
    name: input.name.trim() || "Untitled",
    createdAt: now,
    updatedAt: now,
    source: input.source,
    grouping: sorted.length > 12 ? "alpha-range" : "none",
    color: input.color ?? FOLDER_COLORS[topCount % FOLDER_COLORS.length],
    icon: input.icon ?? "📁",
    imageUri: input.imageUri,
    parentCategoryId: null,
    order: topCount,
    words: sorted.map((w, i) => ({
      id: uid("w"),
      label: w.label.trim(),
      phrase: w.phrase.trim() || w.label.trim(),
      emoji: w.emoji || "🔹",
      imageUri: w.imageUri,
      useTextToSpeech: true,
      size: "md" as TileSize,
      order: i,
      isCustom: true,
    })),
  };
  cache = [cat, ...cache];
  persist();
  return cat;
}

function mutate(id: string, fn: (c: CustomCategory) => void): CustomCategory | undefined {
  const cat = cache.find((c) => c.id === id);
  if (!cat) return undefined;
  fn(cat);
  cat.updatedAt = Date.now();
  cache = [...cache];
  persist();
  return cat;
}

export function renameCategory(id: string, name: string) {
  return mutate(id, (c) => {
    c.name = name.trim() || c.name;
  });
}

export function updateCategory(
  id: string,
  patch: Partial<Pick<CustomCategory, "name" | "icon" | "color" | "imageUri">>
): CustomCategory | undefined {
  return mutate(id, (c) => {
    if (patch.name !== undefined && patch.name.trim().length > 0) {
      c.name = patch.name.trim();
      c.isCustom = true;
    }
    if (patch.icon !== undefined) { c.icon = patch.icon; c.isCustom = true; }
    if (patch.color !== undefined) { c.color = patch.color; c.isCustom = true; }
    if (patch.imageUri !== undefined) { c.imageUri = patch.imageUri; c.isCustom = true; }
  });
}

export function deleteCategory(id: string) {
  const cat = cache.find((c) => c.id === id);
  if (cat) {
    deletedItemKeys.add(`cat::${(cat.name || "").trim().toLowerCase()}`);
    deletedItemKeys.add(`cat::id::${cat.id}`);
    if (cat.parentCategoryId) {
      deletedItemKeys.add(`subcat::${cat.parentCategoryId}::${(cat.name || "").trim().toLowerCase()}`);
    }
    persistDeletedKeys();
  }
  cache = cache.filter((c) => c.id !== id);
  persist();
}

export function setGrouping(id: string, grouping: CustomCategory["grouping"]) {
  return mutate(id, (c) => {
    c.grouping = grouping;
  });
}

export function updateWord(
  catId: string,
  wordId: string,
  patch: Partial<Pick<CustomWord, "label" | "phrase" | "emoji" | "imageUri" | "audioUri" | "useTextToSpeech" | "size" | "color" | "hidden" | "isCustom">>,
) {
  let targetCatId = catId;
  let targetCat = cache.find((c) => c.id === targetCatId);
  if (!targetCat || !targetCat.words.some((x) => x.id === wordId)) {
    const found = cache.find((c) => c.words.some((x) => x.id === wordId));
    if (found) {
      targetCatId = found.id;
    }
  }

  return mutate(targetCatId, (c) => {
    const w = c.words.find((x) => x.id === wordId);
    if (!w) return;

    if (patch.label) {
      unblockDeletedWord(targetCatId, patch.label, wordId);
    }

    const oldBase = (w.verbForms?.base || "").trim().toLowerCase();
    const oldEnLabel = (canonicalWordEn(w.label) || w.label).trim().toLowerCase();
    const oldVForms = w.verbForms || generateAllVerbForms(oldEnLabel);

    Object.assign(w, patch);
    w.isCustom = true;

    const newEnLabel = (canonicalWordEn(w.label) || w.label).trim().toLowerCase();
    const newVForms = patch.label ? (generateAllVerbForms(newEnLabel) || oldVForms) : oldVForms;
    if (newVForms) {
      w.verbForms = newVForms;
    }

    // If this word is a verb, synchronize image, emoji, color, and hidden across sibling verb forms
    const activeVf = newVForms || oldVForms;
    if (activeVf) {
      const targetBases = new Set<string>();
      if (activeVf.base) targetBases.add(activeVf.base.toLowerCase());
      if (oldBase) targetBases.add(oldBase);
      if (oldVForms?.base) targetBases.add(oldVForms.base.toLowerCase());

      const targetForms = new Set<string>([
        activeVf.base.toLowerCase(),
        activeVf.past.toLowerCase(),
        activeVf.participle.toLowerCase(),
        activeVf.continuous.toLowerCase(),
      ]);
      if (oldVForms) {
        targetForms.add(oldVForms.base.toLowerCase());
        targetForms.add(oldVForms.past.toLowerCase());
        targetForms.add(oldVForms.participle.toLowerCase());
        targetForms.add(oldVForms.continuous.toLowerCase());
      }

      const siblings = c.words.filter((other) => {
        if (other.id === w.id) return false;
        if (other.verbForms?.base && targetBases.has(other.verbForms.base.toLowerCase())) return true;
        const otherEn = (canonicalWordEn(other.label) || other.label).trim().toLowerCase();
        return targetForms.has(otherEn);
      });

      siblings.forEach((sib) => {
        if ("imageUri" in patch) sib.imageUri = patch.imageUri;
        if (patch.emoji) sib.emoji = patch.emoji;
        if (patch.color) sib.color = patch.color;
        if (patch.hidden !== undefined) sib.hidden = patch.hidden;
        if (newVForms) {
          sib.verbForms = newVForms;
          if (patch.label && w.verbFormTag === "1st" && sib.verbFormTag) {
            if (sib.verbFormTag === "2nd") {
              const loc = capWord(wordLabel(newVForms.past, seedLang) || newVForms.past);
              sib.label = loc;
              sib.phrase = loc;
            } else if (sib.verbFormTag === "3rd") {
              const loc = capWord(wordLabel(newVForms.participle, seedLang) || newVForms.participle);
              sib.label = loc;
              sib.phrase = loc;
            } else if (sib.verbFormTag === "4th") {
              const loc = capWord(wordLabel(newVForms.continuous, seedLang) || newVForms.continuous);
              sib.label = loc;
              sib.phrase = loc;
            }
          }
        }
      });
    }

    c.words = sortWordsForCategory(c.words, c.name);
    c.words.forEach((item, idx) => {
      item.order = idx;
    });
  });
}

export function removeWord(catId: string, wordId: string) {
  let targetCatId = catId;
  let targetCat = cache.find((c) => c.id === targetCatId);
  if (!targetCat || !targetCat.words.some((x) => x.id === wordId)) {
    const found = cache.find((c) => c.words.some((x) => x.id === wordId));
    if (found) {
      targetCatId = found.id;
    }
  }

  return mutate(targetCatId, (c) => {
    const targetWord = c.words.find((w) => w.id === wordId);
    if (targetWord) {
      // Record every name this word can be re-seeded under (shown label, English
      // source, seed label) so no load/repair step brings it back.
      const norms = new Set<string>();
      [targetWord.label, canonicalWordEn(targetWord.label), targetWord.seedLabel].forEach((l) => {
        const n = (l || "").trim().toLowerCase();
        if (n) norms.add(n);
      });
      norms.forEach((n) => {
        deletedItemKeys.add(
          targetWord.verbFormTag ? `word::${targetCatId}::${targetWord.verbFormTag}::${n}` : `word::${targetCatId}::${n}`,
        );
      });
      deletedItemKeys.add(`word::id::${targetWord.id}`);
      persistDeletedKeys();
    }
    c.words = c.words.filter((w) => w.id !== wordId).map((w, i) => ({ ...w, order: i }));
  });
}

/**
 * Universal category word sorter:
 * Non-verb categories are sorted alphabetically.
 * Verb categories (Verbs A-Z and Action shelves) are strictly sorted by:
 * Base Verb (A to Z) -> 1st Form -> 2nd Form -> 3rd Form -> 4th Form.
 */
export function sortWordsForCategory(words: CustomWord[], catName: string): CustomWord[] {
  const isVerbCategory =
    catName.toLowerCase().includes("verb") ||
    (canonicalWordEn(catName) || "").toLowerCase().includes("verb") ||
    words.some((w) => !!w.verbFormTag);

  if (!isVerbCategory) {
    return [...words].sort((a, b) => (a.label || "").localeCompare(b.label || "", undefined, { sensitivity: "base" }));
  }

  const formWeight = (w: CustomWord, vf?: VerbForms | null): number => {
    const lbl = (canonicalWordEn(w.label) || w.label).toLowerCase().trim();
    // The stored tag wins: translated labels can collide (Arabic أقول = "say" and "saying")
    if (w.verbFormTag === "4th") return 4;
    if (w.verbFormTag === "3rd") return 3;
    if (w.verbFormTag === "2nd") return 2;
    if (w.verbFormTag === "1st") return 1;
    if (vf && lbl === vf.base.toLowerCase()) return 1;
    if (isContinuousForm(lbl) || (vf && lbl === vf.continuous.toLowerCase())) return 4;
    if (!vf) return 1;
    if (lbl === vf.base.toLowerCase()) return 1;
    if (lbl === vf.past.toLowerCase()) return 2;
    if (lbl === vf.participle.toLowerCase()) return 3;
    return 1;
  };

  return [...words].sort((a, b) => {
    const aEn = (canonicalWordEn(a.label) || a.label).trim();
    const bEn = (canonicalWordEn(b.label) || b.label).trim();
    const aVf = getVerbForms(aEn) || generateAllVerbForms(aEn);
    const bVf = getVerbForms(bEn) || generateAllVerbForms(bEn);
    const aRoot = aVf?.base.toLowerCase() ?? aEn.toLowerCase();
    const bRoot = bVf?.base.toLowerCase() ?? bEn.toLowerCase();

    if (aRoot !== bRoot) {
      return aRoot.localeCompare(bRoot, undefined, { sensitivity: "base" });
    }
    const aWeight = formWeight(a, aVf);
    const bWeight = formWeight(b, bVf);
    if (aWeight !== bWeight) {
      return aWeight - bWeight;
    }
    return (a.order ?? 0) - (b.order ?? 0);
  });
}

export function cleanAndDeduplicateCategories() {
  let changed = false;

  // Purge any categories or sub-categories that were deleted by the caregiver
  const beforeLen = cache.length;
  cache = cache.filter((c) => !isDeletedCategory(c.name, c.parentCategoryId));
  if (cache.length !== beforeLen) changed = true;

  // 1. Unify all "Feelings" / "Emotion" / "مشاعر" / "عاطفة" / "احساسات" / "جذبات" categories into one primary Feelings category
  const allFeelingsCats = cache.filter(
    (c) =>
      !c.parentCategoryId &&
      ((canonicalWordEn(c.name) || "").toLowerCase() === "feelings" ||
        (FOLDER_EN_BY_LANG[c.name.toLowerCase()] ?? "").toLowerCase() === "feelings")
  );
  if (allFeelingsCats.length > 1) {
    const primary = allFeelingsCats[0];
    primary.name = folderName("Feelings", seedLang);
    for (let i = 1; i < allFeelingsCats.length; i++) {
      const dup = allFeelingsCats[i];
      dup.words.forEach((w) => {
        const wEn = (canonicalWordEn(w.label) || w.label).toLowerCase();
        if (!primary.words.some((pw) => (canonicalWordEn(pw.label) || pw.label).toLowerCase() === wEn)) {
          primary.words.push(w);
        }
      });
      cache = cache.filter((c) => c.id !== dup.id);
    }
    changed = true;
  }

  // 2. Deduplicate categories by name, scoped to their parent (so sub-categories are not merged into root shelves)
  const seenCatNames = new Set<string>();
  const uniqueCats: CustomCategory[] = [];
  for (const c of cache) {
    const parentKey = c.parentCategoryId ? c.parentCategoryId : "root";
    const enName = (canonicalWordEn(c.name) || FOLDER_EN_BY_LANG[c.name.toLowerCase()] || c.name).trim().toLowerCase();
    const key = `${parentKey}::${enName}`;
    if (!key) continue;
    if (seenCatNames.has(key)) {
      const existing = uniqueCats.find((ec) => {
        const ecParentKey = ec.parentCategoryId ? ec.parentCategoryId : "root";
        const ecEn = (canonicalWordEn(ec.name) || FOLDER_EN_BY_LANG[ec.name.toLowerCase()] || ec.name).trim().toLowerCase();
        return `${ecParentKey}::${ecEn}` === key;
      });
      if (existing) {
        c.words.forEach((w) => {
          const wEn = (canonicalWordEn(w.label) || w.label).toLowerCase();
          if (!existing.words.some((ew) => (canonicalWordEn(ew.label) || ew.label).toLowerCase() === wEn)) {
            existing.words.push(w);
          }
        });
      }
      changed = true;
    } else {
      seenCatNames.add(key);
      uniqueCats.push(c);
    }
  }
  cache = uniqueCats;

  // 3. Normalize standard shelf names to active language
  for (const c of cache) {
    if (!c.parentCategoryId) {
      const en = (canonicalWordEn(c.name) || FOLDER_EN_BY_LANG[c.name.toLowerCase()] || c.name).trim();
      const standardTab = BOTTOM_CATEGORIES.find((bc) => bc.key.toLowerCase() === en.toLowerCase());
      if (standardTab && !c.isCustom) {
        const expectedName = folderName(standardTab.key, seedLang);
        if (c.name !== expectedName) {
          c.name = expectedName;
          changed = true;
        }
      }
    }
  }

  // 4. Deduplicate words in each category canonically (preserving distinct verb forms)
  for (const c of cache) {
    const seenWords = new Map<string, number>();
    const uniqueWords: CustomWord[] = [];
    for (const w of c.words) {
      const tagPrefix = w.verbFormTag ? `${w.verbFormTag}::` : "";
      const key = `${tagPrefix}${(canonicalWordEn(w.label) || w.label).trim().toLowerCase()}`;
      if (!key) continue;
      const idx = seenWords.get(key);
      if (idx === undefined) {
        seenWords.set(key, uniqueWords.length);
        uniqueWords.push(w);
      } else {
        // Keep the copy the caregiver customised (their own picture), not the default seed copy
        if (w.isCustom && !uniqueWords[idx].isCustom) uniqueWords[idx] = w;
        changed = true;
      }
    }
    if (uniqueWords.length !== c.words.length) {
      c.words = uniqueWords.map((w, i) => ({ ...w, order: i }));
      changed = true;
    }
  }

  // Keep each "Verbs X" folder strictly to verbs starting with X (e.g. Fall never sits in Verbs D)
  if (enforceVerbLetterBuckets()) changed = true;

  // 5. Ensure all verb subcategories under Actions have complete, strictly ordered 1st, 2nd, 3rd, and 4th forms
  const actionsCat = cache.find(
    (c) =>
      !c.parentCategoryId &&
      (c.name.toLowerCase() === "actions" || (FOLDER_EN_BY_LANG[c.name.toLowerCase()] ?? c.name).toLowerCase() === "actions")
  );
  if (actionsCat) {
    for (const [letter, rawList] of Object.entries(VERBS_A_TO_Z)) {
      const subCat = cache.find(
        (c) =>
          c.parentCategoryId === actionsCat.id &&
          ((canonicalWordEn(c.name) || FOLDER_EN_BY_LANG[c.name.toLowerCase()] || c.name).toLowerCase() === `verbs ${letter.toLowerCase()}` ||
            c.name.toLowerCase() === `verbs ${letter.toLowerCase()}` ||
            c.name.toLowerCase() === folderName(`Verbs ${letter}`).toLowerCase())
      );
      if (subCat) {
        const list = [...rawList].sort((a, b) => a.base.localeCompare(b.base, undefined, { sensitivity: "base" }));
        const standardVerbWords = new Set<string>();
        list.forEach((v) => {
          standardVerbWords.add(v.base.toLowerCase().trim());
          standardVerbWords.add(v.past.toLowerCase().trim());
          standardVerbWords.add(v.participle.toLowerCase().trim());
          standardVerbWords.add(v.continuous.toLowerCase().trim());
        });

        const customWords = subCat.words.filter((w) => {
          if (w.isCustom) return true;
          const en = (canonicalWordEn(w.label) || w.label).toLowerCase().trim();
          return !standardVerbWords.has(en) && !standardVerbWords.has(w.label.toLowerCase().trim());
        });

        const usedExistingIds = new Set<string>();
        let cleanWords: CustomWord[] = [];
        let orderIndex = 0;

        list.forEach((v) => {
          const forms: { word: string; tag: "1st" | "2nd" | "3rd" | "4th" }[] = [
            { word: v.base, tag: "1st" },
            { word: v.past, tag: "2nd" },
            { word: v.participle, tag: "3rd" },
            { word: v.continuous, tag: "4th" },
          ];

          const anyExistingImg = subCat.words.find((w) => {
            const en = (canonicalWordEn(w.label) || w.label).toLowerCase().trim();
            return (en === v.base.toLowerCase() || en === v.past.toLowerCase() || en === v.participle.toLowerCase() || en === v.continuous.toLowerCase()) && !!w.imageUri;
          })?.imageUri;

          forms.forEach((f) => {
            if (isDeletedWord(subCat.id, f.word, f.tag)) return; // deleted by caregiver
            let existing = preferCustomized(subCat.words.filter((w) => {
              if (usedExistingIds.has(w.id)) return false;
              const en = (canonicalWordEn(w.label) || w.label).toLowerCase().trim();
              const isMatch = en === f.word.toLowerCase() || w.label.toLowerCase().trim() === f.word.toLowerCase();
              return isMatch && w.verbFormTag === f.tag;
            }));
            if (!existing) {
              existing = subCat.words.find((w) => {
                if (usedExistingIds.has(w.id)) return false;
                const en = (canonicalWordEn(w.label) || w.label).toLowerCase().trim();
                return en === f.word.toLowerCase() || w.label.toLowerCase().trim() === f.word.toLowerCase();
              });
            }
            if (existing) usedExistingIds.add(existing.id);

            const localized = wordLabel(f.word, seedLang) || f.word;
            const capText = capWord(localized);
            cleanWords.push({
              id: existing?.id ?? uid("w"),
              label: capText,
              phrase: capText,
              emoji: v.emoji || existing?.emoji || "⚡",
              imageUri: existing?.imageUri || anyExistingImg || getPictogramUrl(f.word) || undefined,
              audioUri: existing?.audioUri,
              useTextToSpeech: existing?.useTextToSpeech ?? true,
              size: "md",
              order: orderIndex++,
              verbFormTag: f.tag,
              hidden: existing?.hidden ?? false,
              isCustom: existing?.isCustom,
            });
          });
        });

        const handledCustomBases = new Set<string>();
        customWords.forEach((cw) => {
          if (usedExistingIds.has(cw.id)) return; // already placed as a standard form above
          const enLabel = (canonicalWordEn(cw.label) || cw.label).trim();
          // Leftover duplicate of a standard form — the standard loop already kept one copy
          if (standardVerbWords.has(enLabel.toLowerCase())) return;
          const v = generateAllVerbForms(enLabel);
          if (v) {
            const baseKey = v.base.toLowerCase();
            if (handledCustomBases.has(baseKey)) return;
            handledCustomBases.add(baseKey);

            const forms: { word: string; tag: "1st" | "2nd" | "3rd" | "4th" }[] = [
              { word: v.base, tag: "1st" },
              { word: v.past, tag: "2nd" },
              { word: v.participle, tag: "3rd" },
              { word: v.continuous, tag: "4th" },
            ];

            const anyExistingImg = subCat.words.find((w) => {
              const en = (canonicalWordEn(w.label) || w.label).toLowerCase().trim();
              return (en === v.base.toLowerCase() || en === v.past.toLowerCase() || en === v.participle.toLowerCase() || en === v.continuous.toLowerCase()) && !!w.imageUri;
            })?.imageUri;

            forms.forEach((f) => {
              if (isDeletedWord(subCat.id, f.word, f.tag)) return; // deleted by caregiver
              let existing = subCat.words.find((w) => {
                if (usedExistingIds.has(w.id)) return false;
                const en = (canonicalWordEn(w.label) || w.label).toLowerCase().trim();
                const isMatch = en === f.word.toLowerCase() || w.label.toLowerCase().trim() === f.word.toLowerCase();
                return isMatch && (w.verbFormTag ? w.verbFormTag === f.tag : true);
              });
              if (existing) usedExistingIds.add(existing.id);

              const localized = wordLabel(f.word, seedLang) || f.word;
              const capText = capWord(localized);
              cleanWords.push({
                id: existing?.id ?? uid("w"),
                label: capText,
                phrase: capText,
                emoji: v.emoji || cw.emoji || existing?.emoji || "⚡",
                imageUri: existing?.imageUri || cw.imageUri || anyExistingImg || getPictogramUrl(f.word) || getPictogramUrl(v.base) || undefined,
                audioUri: existing?.audioUri || cw.audioUri,
                useTextToSpeech: existing?.useTextToSpeech ?? cw.useTextToSpeech ?? true,
                size: "md",
                order: orderIndex++,
                verbFormTag: f.tag,
                hidden: existing?.hidden ?? cw.hidden ?? false,
                isCustom: true,
              });
            });
          } else {
            cleanWords.push({ ...cw, isCustom: true, order: orderIndex++ });
          }
        });

        cleanWords = sortWordsForCategory(cleanWords, subCat.name).map((w, i) => ({ ...w, order: i }));

        if (
          subCat.words.length !== cleanWords.length ||
          subCat.words.some(
            (w, i) =>
              w.id !== cleanWords[i]?.id ||
              w.label !== cleanWords[i]?.label ||
              w.verbFormTag !== cleanWords[i]?.verbFormTag ||
              w.order !== cleanWords[i]?.order
          )
        ) {
          subCat.words = cleanWords;
          changed = true;
        }
      }
    }
  }

  // Ensure essential sentence building words exist in Core, Actions, and Places
  const coreCat = cache.find((c) => (FOLDER_EN_BY_LANG[c.name.toLowerCase()] ?? c.name).toLowerCase() === "core");
  if (coreCat) {
    const essentialCore: [string, string][] = [
      ["I", "🧒"],
      ["am", "✨"],
      ["is", "✨"],
      ["are", "✨"],
      ["was", "✨"],
      ["to", "➡️"],
      ["the", "🔹"],
    ];
    for (const [wLabel, wEmoji] of [...essentialCore].reverse()) {
      if (!isDeletedWord(coreCat.id, wLabel) && !coreCat.words.some((w) => w.label.toLowerCase() === wLabel.toLowerCase())) {
        coreCat.words.unshift({
          id: uid("word"),
          label: wLabel,
          phrase: wLabel,
          emoji: wEmoji,
          color: "#E2EFE9",
          size: "md",
          order: 0,
          useTextToSpeech: true,
        });
        changed = true;
      }
    }
    coreCat.words.forEach((w, i) => { w.order = i; });
  }

  // Ensure that ANY category with child subcategories has ZERO loose words outside its subcategories.
  // All words must belong strictly inside the child subcategories.
  const parentIdsWithSubCats = new Set<string>();
  for (const c of cache) {
    if (c.parentCategoryId) {
      parentIdsWithSubCats.add(c.parentCategoryId);
    }
  }

  for (const c of cache) {
    if (parentIdsWithSubCats.has(c.id) && c.words.length > 0) {
      // Find subcategories belonging to this parent
      const subCatsOfParent = cache.filter((sc) => sc.parentCategoryId === c.id);
      if (subCatsOfParent.length > 0) {
        // Move any words from parent into appropriate child subcategory or first child if not already present
        for (const w of c.words) {
          const wLower = (canonicalWordEn(w.label) || w.label).trim().toLowerCase();
          const matchingInSub = subCatsOfParent
            .flatMap((sc) => sc.words)
            .find((sw) => (canonicalWordEn(sw.label) || sw.label).trim().toLowerCase() === wLower);

          if (matchingInSub && w.isCustom) {
            if (w.imageUri) matchingInSub.imageUri = w.imageUri;
            if (w.audioUri) matchingInSub.audioUri = w.audioUri;
            if (w.color) matchingInSub.color = w.color;
            if (w.verbForms) matchingInSub.verbForms = w.verbForms;
            if (w.verbFormTag) matchingInSub.verbFormTag = w.verbFormTag;
            matchingInSub.isCustom = true;
          } else if (!matchingInSub) {
            let targetSub = subCatsOfParent[0];
            const pName = (canonicalWordEn(c.name) || FOLDER_EN_BY_LANG[c.name.toLowerCase()] || c.name).toLowerCase();
            if (pName.includes("people") || pName.includes("لوگ") || pName.includes("أشخاص")) {
              if (["mom", "dad", "brother", "sister", "baby", "grandma", "grandpa", "aunt", "uncle", "cousin", "pet"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("family")) || targetSub;
              } else if (["teacher", "friend", "classmate", "principal", "aide", "student", "me", "you"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("friend") || (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("school")) || targetSub;
              } else {
                targetSub = subCatsOfParent.find((sc) => (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("helper") || (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("therapist")) || targetSub;
              }
            } else if (pName.includes("food") || pName.includes("کھانا") || pName.includes("طعام")) {
              if (["water", "milk", "juice", "tea", "coffee", "soda", "smoothie", "lemonade", "drink"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("drink")) || targetSub;
              } else if (["pizza", "burger", "fries", "taco", "nuggets", "hot dog"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("fast")) || targetSub;
              } else if (["apple", "banana", "orange", "berry", "grape", "melon", "peach", "fruit"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("fruit")) || targetSub;
              } else if (["carrot", "broccoli", "corn", "potato", "cucumber", "tomato", "veg", "peas", "lettuce"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("veg")) || targetSub;
              } else if (["cookie", "ice cream", "cake", "donut", "candy", "chocolate", "chips", "snack", "sweet"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("snack") || (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("sweet")) || targetSub;
              } else {
                targetSub = subCatsOfParent.find((sc) => (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("meal") || (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("breakfast")) || targetSub;
              }
            } else if (pName.includes("place") || pName.includes("مقام") || pName.includes("أماكن")) {
              if (["home", "bedroom", "kitchen", "bed", "couch", "bathroom", "house", "backyard"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("home")) || targetSub;
              } else if (["school", "playground", "park", "library", "gym", "class", "pool", "beach", "zoo"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("school") || (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("community")) || targetSub;
              } else {
                targetSub = subCatsOfParent.find((sc) => (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("errand") || (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("health")) || targetSub;
              }
            } else if (pName.includes("thing") || pName.includes("چیز") || pName.includes("أشياء")) {
              if (["toy", "ball", "doll", "blocks", "puzzle", "car", "train", "game", "bubbles"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("toy") || (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("play")) || targetSub;
              } else if (["book", "tablet", "phone", "backpack", "paper", "pencil", "tech"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("school") || (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("tech")) || targetSub;
              } else if (["shirt", "pants", "shoes", "socks", "jacket", "hat", "clothes", "blanket"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("clothe")) || targetSub;
              } else {
                targetSub = subCatsOfParent.find((sc) => (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("hygiene") || (canonicalWordEn(sc.name) || sc.name).toLowerCase().includes("bath")) || targetSub;
              }
            } else if (pName.includes("action") || pName.includes("verb") || pName.includes("کام") || pName.includes("أفعال")) {
              const letter = verbLetterOf(w.label) || wLower[0] || "a";
              targetSub = subCatsOfParent.find((sc) => verbSubLetter(sc) === letter) || targetSub;
            }
            targetSub.words.push({ ...w, isCustom: w.isCustom ?? true, order: targetSub.words.length });
          }
        }
      }
      c.words = [];
      changed = true;
    }
  }

  // 1. Separate Verbs vs Places / Food / Things / People / Feelings:
  // Words with 1st, 2nd, 3rd, 4th forms belong strictly in "Actions".
  // Remove verb forms & action verbs from Places, Food, Things, Feelings, People.
  // Clean all verbFormTag and verbForms outside Actions.

  const getRootShelfName = (cat: CustomCategory): string => {
    let curr: CustomCategory | undefined = cat;
    let depth = 0;
    while (curr && curr.parentCategoryId && depth < 10) {
      const parentId: string = curr.parentCategoryId;
      curr = cache.find((x) => x.id === parentId);
      depth++;
    }
    const raw = curr?.name || cat.name || "";
    return (FOLDER_EN_BY_LANG[raw.toLowerCase()] ?? raw).toLowerCase();
  };

  const allActionVerbs = new Set<string>();
  for (const v of VERB_FORMS_LIST) {
    allActionVerbs.add(v.base.toLowerCase().trim());
    allActionVerbs.add(v.past.toLowerCase().trim());
    allActionVerbs.add(v.participle.toLowerCase().trim());
    allActionVerbs.add(v.continuous.toLowerCase().trim());
  }
  [
    "go to", "come here", "want", "wanted", "needing", "needed", "liked", "liking",
    "stop", "stopped", "stopping", "eating", "drank", "drinking", "chewing",
    "cooking", "cooked", "baking", "baked", "washing", "washed", "cleaning", "cleaned",
    "reading", "watching", "watched", "writing", "playing", "played", "sleeping", "slept"
  ].forEach((v) => allActionVerbs.add(v));

  const LEGIT_PLACES = new Set([
    "home", "house", "park", "store", "shop", "school", "classroom", "playground",
    "bathroom", "bedroom", "kitchen", "outside", "yard", "backyard", "living room",
    "dining room", "bed", "couch", "car", "bus", "library", "gym", "cafeteria",
    "hallway", "hospital", "clinic", "pharmacy", "doctor office", "doctor's office",
    "dentist clinic", "dentist's office", "therapy clinic", "supermarket", "mall",
    "restaurant", "zoo", "beach", "pool", "movie theater", "cinema"
  ]);

  const LEGIT_FOODS = new Set([
    "water", "milk", "juice", "apple juice", "orange juice", "hot chocolate", "tea", "coffee",
    "soda", "smoothie", "lemonade", "toast", "fish", "chicken", "meat", "beef", "egg", "eggs",
    "cheese", "rice", "bread", "soup", "salad", "fruit", "fruits", "vegetable", "vegetables",
    "apple", "banana", "orange", "strawberry", "grape", "grapes", "watermelon", "peach",
    "mango", "pineapple", "pear", "cherry", "cherries", "carrot", "broccoli", "corn", "potato",
    "potatoes", "cucumber", "tomato", "tomatoes", "peas", "lettuce", "onion", "pepper", "pizza",
    "burger", "french fries", "fries", "hot dog", "chicken nuggets", "taco", "sandwich",
    "fried chicken", "onion rings", "chips", "popcorn", "cookie", "cookies", "cake", "ice cream",
    "donut", "candy", "chocolate", "cupcake", "pretzel", "snack", "snacks", "pancakes",
    "waffles", "cereal", "noodles", "pasta", "grilled cheese"
  ]);

  for (const c of cache) {
    const shelf = getRootShelfName(c);
    const isActionsShelf =
      shelf.includes("action") ||
      shelf.includes("verb") ||
      (c.name || "").toLowerCase().includes("action") ||
      (c.name || "").toLowerCase().includes("verb");

    if (!isActionsShelf) {
      // Strip any verb tags and verb forms outside Actions for non-custom words
      for (const w of c.words) {
        if (!w.isCustom) {
          if (w.verbFormTag) {
            delete w.verbFormTag;
            changed = true;
          }
          if (w.verbForms) {
            delete w.verbForms;
            changed = true;
          }
        }
      }

      // If this is Places (shelf or subcategory of Places):
      if (shelf === "places") {
        const before = c.words.length;
        c.words = c.words.filter((w) => {
          if (w.isCustom) return true;
          const lbl = (w.label || "").trim().toLowerCase();
          if (LEGIT_PLACES.has(lbl)) return true;
          if (allActionVerbs.has(lbl)) return false;
          return true;
        });
        if (c.words.length !== before) changed = true;
      }

      // If this is Food (shelf or subcategory of Food):
      if (shelf === "food") {
        const before = c.words.length;
        c.words = c.words.filter((w) => {
          if (w.isCustom) return true;
          const lbl = (w.label || "").trim().toLowerCase();
          if (LEGIT_FOODS.has(lbl)) return true;
          if (allActionVerbs.has(lbl)) return false;
          return true;
        });
        if (c.words.length !== before) changed = true;
      }

      // If Things, People, Feelings: purge action verbs
      if (shelf === "things" || shelf === "people" || shelf === "feelings") {
        const before = c.words.length;
        c.words = c.words.filter((w) => {
          if (w.isCustom) return true;
          const lbl = (w.label || "").trim().toLowerCase();
          if (shelf === "things" && (lbl === "book" || lbl === "watch" || lbl === "brush" || lbl === "toy" || lbl === "ball")) return true;
          if (shelf === "people" && (lbl === "help" ? false : true)) {
            if (allActionVerbs.has(lbl)) return false;
            return true;
          }
          if (shelf === "feelings") {
            if (allActionVerbs.has(lbl) && lbl !== "love" && lbl !== "like") return false;
            return true;
          }
          if (allActionVerbs.has(lbl)) return false;
          return true;
        });
        if (c.words.length !== before) changed = true;
      }
    }
  }

  // 2. Sorting for ALL categories (except Core & Say It For Me):
  // Regular categories are sorted alphabetically. Verb categories are strictly sorted:
  // Base Verb (alphabetical) -> 1st Form -> 2nd Form -> 3rd Form -> 4th Form.
  for (const c of cache) {
    const enName = (FOLDER_EN_BY_LANG[c.name.toLowerCase()] ?? c.name).toLowerCase();
    if (enName !== "core" && enName !== "say it for me") {
      c.words = sortWordsForCategory(c.words, c.name);
      c.words.forEach((w, i) => { w.order = i; });
    }
  }

  // 3. Alphabetical (A to Z) sorting for sub-categories under any shelf:
  const subCats = cache.filter((c) => !!c.parentCategoryId);
  const byParent: Record<string, CustomCategory[]> = {};
  for (const sc of subCats) {
    const p = sc.parentCategoryId!;
    if (!byParent[p]) byParent[p] = [];
    byParent[p].push(sc);
  }
  for (const p in byParent) {
    byParent[p].sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
    byParent[p].forEach((sc, i) => { sc.order = i; });
  }

  // Ensure priority shelves appear first
  const priority = ["core", "people", "feelings", "actions", "food", "places", "things", "red", "say it for me"];
  cache.forEach((c) => {
    const enName = (FOLDER_EN_BY_LANG[c.name.toLowerCase()] ?? c.name).toLowerCase();
    const pIdx = priority.indexOf(enName);
    if (pIdx !== -1 && c.order !== pIdx) {
      c.order = pIdx;
      changed = true;
    }
  });

  if (changed) {
    persist();
  }
}

export function addWord(
  catId: string,
  word: {
    label: string;
    phrase?: string;
    emoji?: string;
    imageUri?: string;
    audioUri?: string;
    useTextToSpeech?: boolean;
    size?: TileSize;
    color?: string;
    verbForms?: CustomWord["verbForms"];
    verbFormTag?: CustomWord["verbFormTag"];
    isCustom?: boolean;
  },
) {
  let cleanLabel = word.label.trim();
  let cleanPhrase = (word.phrase ?? word.label).trim() || cleanLabel;
  // A verb added inside "Verbs X" goes to the folder of its own first letter
  catId = verbBucketIdFor(catId, cleanLabel);
  unblockDeletedWord(catId, cleanLabel);

  if (["ar-SA", "ur-PK"].includes(seedLang) && !/[\u0600-\u06FF]/.test(cleanLabel) && /[a-zA-Z]/.test(cleanLabel)) {
    const sync = wordLabel(cleanLabel, seedLang);
    if (sync && sync.toLowerCase() !== cleanLabel.toLowerCase()) {
      cleanLabel = sync;
      cleanPhrase = sync;
    } else {
      const orig = cleanLabel;
      translateDynamic(orig, seedLang).then((t) => {
        if (t && t !== orig) {
          mutate(catId, (c) => {
            const w = c.words.find((x) => x.label === orig);
            if (w) {
              w.label = t;
              w.phrase = t;
            }
          });
        }
      });
    }
  }

  // Check if this word is a verb and should be automatically expanded into 1st, 2nd, 3rd, and 4th forms
  const enWord = (canonicalWordEn(word.label) || word.label).trim();
  const vForms = !word.verbFormTag ? (word.verbForms || generateAllVerbForms(enWord)) : null;

  return mutate(catId, (c) => {
    if (vForms) {
      const forms: { word: string; enWord: string; tag: "1st" | "2nd" | "3rd" | "4th" }[] = [
        { word: capWord(wordLabel(vForms.base, seedLang) || vForms.base), enWord: vForms.base, tag: "1st" },
        { word: capWord(wordLabel(vForms.past, seedLang) || vForms.past), enWord: vForms.past, tag: "2nd" },
        { word: capWord(wordLabel(vForms.participle, seedLang) || vForms.participle), enWord: vForms.participle, tag: "3rd" },
        { word: capWord(wordLabel(vForms.continuous, seedLang) || vForms.continuous), enWord: vForms.continuous, tag: "4th" },
      ];
      forms.forEach((f) => {
        unblockDeletedWord(catId, f.word);
        const merged = mergeIntoExistingWord(c, {
          label: f.word,
          imageUri: word.imageUri,
          color: word.color,
          audioUri: word.audioUri,
          useTextToSpeech: word.useTextToSpeech,
          verbForms: vForms,
          verbFormTag: f.tag,
        });
        if (merged) return;
        c.words.push({
          id: uid("w"),
          label: f.word,
          phrase: f.word,
          emoji: vForms.emoji || word.emoji || "⚡",
          imageUri: word.imageUri || getPictogramUrl(f.enWord) || getPictogramUrl(vForms.base) || undefined,
          color: word.color,
          audioUri: word.audioUri,
          useTextToSpeech: word.useTextToSpeech ?? !word.audioUri,
          size: word.size ?? "md",
          order: c.words.length,
          useCount: 0,
          verbForms: vForms,
          verbFormTag: f.tag,
          isCustom: true,
        });
      });
      c.words = sortWordsForCategory(c.words, c.name);
      c.words.forEach((w, i) => { w.order = i; });
    } else if (!mergeIntoExistingWord(c, { ...word, label: cleanLabel })) {
      c.words.push({
        id: uid("w"),
        label: cleanLabel,
        phrase: cleanPhrase,
        emoji: word.emoji || "🔹",
        imageUri: word.imageUri || getPictogramUrl(cleanLabel) || undefined,
        color: word.color,
        audioUri: word.audioUri,
        useTextToSpeech: word.useTextToSpeech ?? !word.audioUri,
        size: word.size ?? "md",
        order: c.words.length,
        useCount: 0,
        verbForms: word.verbForms,
        verbFormTag: word.verbFormTag,
        isCustom: true,
      });
      c.words = sortWordsForCategory(c.words, c.name);
      c.words.forEach((w, i) => { w.order = i; });
    }
  });
}

/** Add multiple words to a category in a single batch write */
export function addWordsBulk(
  catId: string,
  words: {
    label: string;
    phrase?: string;
    emoji?: string;
    imageUri?: string;
    audioUri?: string;
    useTextToSpeech?: boolean;
    size?: TileSize;
    color?: string;
    verbForms?: CustomWord["verbForms"];
    verbFormTag?: CustomWord["verbFormTag"];
    isCustom?: boolean;
  }[],
) {
  const pendingWords: string[] = [];

  const processedWords = words.map((word) => {
    let cleanLabel = word.label.trim();
    let cleanPhrase = (word.phrase ?? cleanLabel).trim() || cleanLabel;
    unblockDeletedWord(catId, cleanLabel);

    if (["ar-SA", "ur-PK"].includes(seedLang) && !/[\u0600-\u06FF]/.test(cleanLabel) && /[a-zA-Z]/.test(cleanLabel)) {
      const sync = wordLabel(cleanLabel, seedLang);
      if (sync && sync.toLowerCase() !== cleanLabel.toLowerCase()) {
        cleanLabel = sync;
        cleanPhrase = sync;
      } else {
        pendingWords.push(cleanLabel);
      }
    }

    return {
      ...word,
      label: cleanLabel,
      phrase: cleanPhrase,
    };
  });

  if (pendingWords.length > 0) {
    (async () => {
      for (const orig of pendingWords) {
        const t = await translateDynamic(orig, seedLang);
        if (t && t !== orig) {
          mutate(catId, (c) => {
            const w = c.words.find((x) => x.label === orig);
            if (w) {
              w.label = t;
              w.phrase = t;
            }
          });
        }
      }
    })();
  }

  return mutate(catId, (c) => {
    processedWords.forEach((word) => {
      const cleanLabel = word.label.trim();
      if (!cleanLabel) return;
      if (mergeIntoExistingWord(c, { ...word, label: cleanLabel })) return;
      c.words.push({
        id: uid("w"),
        label: cleanLabel,
        phrase: (word.phrase ?? cleanLabel).trim() || cleanLabel,
        emoji: word.emoji || "🔹",
        imageUri: word.imageUri || getPictogramUrl(cleanLabel) || undefined,
        color: word.color,
        audioUri: word.audioUri,
        useTextToSpeech: word.useTextToSpeech ?? !word.audioUri,
        size: word.size ?? "md",
        order: c.words.length,
        useCount: 0,
        verbForms: word.verbForms,
        verbFormTag: word.verbFormTag,
        isCustom: true,
      });
    });
    c.words = sortWordsForCategory(c.words, c.name);
    c.words.forEach((w, i) => { w.order = i; });
    // Bulk-added verbs inside "Verbs X" are moved to their own letter folders
    if (verbSubLetter(c)) enforceVerbLetterBuckets();
  });
}

// --- board helpers (folders) -------------------------------------------

function byOrder(a: CustomCategory, b: CustomCategory) {
  return (a.order ?? 0) - (b.order ?? 0);
}

export function topLevelCategories(): CustomCategory[] {
  return cache
    .filter((c) => !c.parentCategoryId && !!c.name && c.name.trim().length > 0)
    .sort(byOrder);
}

export function childCategories(parentId: string): CustomCategory[] {
  return cache
    .filter((c) => c.parentCategoryId === parentId && !!c.name && c.name.trim().length > 0)
    .sort(byOrder);
}

/** Same as topLevelCategories()/childCategories(), but with parent-hidden
 * folders removed — what the child-facing Talk board should actually render.
 * Parent-facing screens (My Categories, admin) keep using the un-filtered
 * versions above so a hidden folder can still be found and un-hidden. */
export function visibleTopLevelCategories(): CustomCategory[] {
  return topLevelCategories().filter((c) => !c.hidden);
}
export function visibleChildCategories(parentId: string): CustomCategory[] {
  return childCategories(parentId).filter((c) => !c.hidden);
}

export function createBlankCategory(input: {
  name: string;
  color?: string;
  icon?: string;
  imageUri?: string;
  parentCategoryId?: string | null;
}): CustomCategory {
  const now = Date.now();
  const siblings = cache.filter((c) => (c.parentCategoryId ?? null) === (input.parentCategoryId ?? null));
  const cat: CustomCategory = {
    id: uid("cat"),
    name: input.name.trim() || "New Category",
    createdAt: now,
    updatedAt: now,
    source: "manual",
    grouping: "none",
    color: input.color ?? FOLDER_COLORS[siblings.length % FOLDER_COLORS.length],
    icon: input.icon ?? "📁",
    imageUri: input.imageUri,
    parentCategoryId: input.parentCategoryId ?? null,
    order: siblings.length,
    words: [],
  };
  cache = [...cache, cat];
  persist();
  return cat;
}

/** Create multiple categories/shelves in a single batch write */
export function createBlankCategoriesBulk(
  categories: {
    name: string;
    color?: string;
    icon?: string;
    imageUri?: string;
    parentCategoryId?: string | null;
  }[],
): CustomCategory[] {
  const now = Date.now();
  const createdList: CustomCategory[] = [];

  for (const input of categories) {
    const name = input.name.trim();
    if (!name) continue;
    const parentId = input.parentCategoryId ?? null;
    const siblings = cache.filter((c) => (c.parentCategoryId ?? null) === parentId);
    const cat: CustomCategory = {
      id: uid("cat"),
      name,
      createdAt: now,
      updatedAt: now,
      source: "manual",
      grouping: "none",
      color: input.color ?? FOLDER_COLORS[siblings.length % FOLDER_COLORS.length],
      icon: input.icon ?? "📁",
      imageUri: input.imageUri || getPictogramUrl(name) || undefined,
      parentCategoryId: parentId,
      order: siblings.length,
      words: [],
    };
    cache.push(cat);
    createdList.push(cat);
  }

  if (createdList.length > 0) {
    cache = [...cache];
    persist();
  }
  return createdList;
}

export function updateCategoryMeta(id: string, patch: Partial<Pick<CustomCategory, "name" | "color" | "icon" | "imageUri">>) {
  return mutate(id, (c) => Object.assign(c, patch));
}

/** Parent control: show/hide a whole folder on the child-facing Talk board.
 * When hiding or showing a category, cascades to all words and sub-categories
 * inside it so words don't need to be hidden separately. */
export function setCategoryHidden(id: string, hidden: boolean) {
  // 1. Cascade to any sub-categories under this category
  const childCats = cache.filter((sc) => sc.parentCategoryId === id);
  for (const childCat of childCats) {
    mutate(childCat.id, (sc) => {
      sc.hidden = hidden;
      if (sc.words && Array.isArray(sc.words)) {
        sc.words.forEach((w) => {
          w.hidden = hidden;
        });
      }
    });
  }

  // 2. Cascade to the category itself and all words inside it
  return mutate(id, (c) => {
    c.hidden = hidden;
    if (c.words && Array.isArray(c.words)) {
      c.words.forEach((w) => {
        w.hidden = hidden;
      });
    }
  });
}

/** Parent control: show/hide a single word inside a folder, without deleting it. */
export function setWordHidden(catId: string, wordId: string, hidden: boolean) {
  let targetCatId = catId;
  let targetCat = cache.find((c) => c.id === targetCatId);
  if (!targetCat || !targetCat.words.some((x) => x.id === wordId)) {
    const found = cache.find((c) => c.words.some((x) => x.id === wordId));
    if (found) {
      targetCatId = found.id;
    }
  }
  return mutate(targetCatId, (c) => {
    const w = c.words.find((x) => x.id === wordId);
    if (w) w.hidden = hidden;
  });
}

/** Bump a tile's tap count + last-used timestamp, wherever it lives (used for the child-facing board's core-words injection, where the owning folder isn't the one currently open). */
export function recordWordUseByWordId(wordId: string) {
  for (const c of cache) {
    const w = c.words.find((x) => x.id === wordId);
    if (w) {
      w.useCount = (w.useCount ?? 0) + 1;
      w.lastUsedAt = Date.now();
      cache = [...cache];
      persist();
      return;
    }
  }
}

/**
 * 90-Second Personalized Board Builder (Tala Parity)
 * Creates a top-priority "⭐️ [Name]'s World" category seeded with the child's
 * real favorite foods, family members, activities and essential functional phrase cards.
 */
export function createPersonalizedFavoritesCategory(
  childName: string,
  favourites: {
    foods: string[];
    family: string[];
    activities: string[];
  }
): CustomCategory {
  const catName = childName.trim() ? `⭐️ ${childName.trim()}'s World` : "⭐️ My Favorites";
  // Remove existing personalized category if it exists
  cache = cache.filter((c) => !c.name.startsWith("⭐️"));

  const now = Date.now();
  const words: CustomWord[] = [];

  // Essential instant request cards (GLP phrase-first)
  const essentials: [string, string, string][] = [
    ["Yes", "Yes, please!", "✅"],
    ["No", "No, thank you.", "❌"],
    ["Help", "Can someone please help me?", "🆘"],
    ["More", "Can I have some more, please?", "➕"],
    ["Break", "I need a quiet break, please.", "🧘"],
    ["All done", "I am all done now, thank you!", "⭐"],
  ];
  for (const [lbl, phr, emj] of essentials) {
    words.push({
      id: uid("w_fav"),
      label: lbl,
      phrase: phr,
      emoji: emj,
      imageUri: getPictogramUrl(lbl) || undefined,
      color: "#D5E8DF",
      useTextToSpeech: true,
      size: "md",
      order: words.length,
      useCount: 0,
    });
  }

  // Foods
  for (const food of (favourites.foods || [])) {
    if (!food.trim()) continue;
    const clean = food.trim();
    words.push({
      id: uid("w_food"),
      label: clean,
      phrase: `I want ${clean.toLowerCase()}, please.`,
      emoji: "🍽️",
      imageUri: getPictogramUrl(clean) || undefined,
      color: "#FFF0B8",
      useTextToSpeech: true,
      size: "md",
      order: words.length,
      useCount: 0,
    });
  }

  // Family / Important People
  for (const person of (favourites.family || [])) {
    if (!person.trim()) continue;
    const clean = person.trim();
    words.push({
      id: uid("w_fam"),
      label: clean,
      phrase: `I want to see ${clean}!`,
      emoji: "❤️",
      imageUri: getPictogramUrl(clean) || undefined,
      color: "#FCD6D6",
      useTextToSpeech: true,
      size: "md",
      order: words.length,
      useCount: 0,
    });
  }

  // Activities
  for (const act of (favourites.activities || [])) {
    if (!act.trim()) continue;
    const clean = act.trim();
    words.push({
      id: uid("w_act"),
      label: clean,
      phrase: `Can I play ${clean.toLowerCase()}?`,
      emoji: "🎮",
      imageUri: getPictogramUrl(clean) || undefined,
      color: "#D6ECFA",
      useTextToSpeech: true,
      size: "md",
      order: words.length,
      useCount: 0,
    });
  }

  const cat: CustomCategory = {
    id: uid("cat_fav"),
    name: catName,
    createdAt: now,
    updatedAt: now,
    source: "manual",
    grouping: "none",
    color: "#EAB308",
    icon: "⭐",
    parentCategoryId: null,
    order: -1, // always first!
    words,
  };

  cache = [cat, ...cache];
  // Re-index orders
  cache.forEach((c, idx) => {
    c.order = idx;
  });
  persist();
  return cat;
}

/** Delete a category and any sub-folders under it. */
export function deleteCategoryDeep(id: string) {
  const ids = new Set<string>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of cache) {
      if (c.parentCategoryId && ids.has(c.parentCategoryId) && !ids.has(c.id)) {
        ids.add(c.id);
        grew = true;
      }
    }
  }
  for (const cid of ids) {
    const cat = cache.find((c) => c.id === cid);
    if (cat) {
      deletedItemKeys.add(`cat::${(cat.name || "").trim().toLowerCase()}`);
      deletedItemKeys.add(`cat::id::${cat.id}`);
      if (cat.parentCategoryId) {
        deletedItemKeys.add(`subcat::${cat.parentCategoryId}::${(cat.name || "").trim().toLowerCase()}`);
      }
    }
  }
  persistDeletedKeys();
  cache = cache.filter((c) => !ids.has(c.id));
  persist();
}

export function reorderCategory(id: string, dir: "up" | "down") {
  const cat = cache.find((c) => c.id === id);
  if (!cat) return;
  const sibs = cache.filter((c) => (c.parentCategoryId ?? null) === (cat.parentCategoryId ?? null)).sort(byOrder);
  const idx = sibs.findIndex((c) => c.id === id);
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= sibs.length) return;
  [sibs[idx], sibs[swap]] = [sibs[swap], sibs[idx]];
  sibs.forEach((c, i) => (c.order = i));
  cache = [...cache];
  persist();
}

/** One-click A–Z sort for any category (existing or new). */
export function sortAlphabetical(id: string) {
  return mutate(id, (c) => {
    c.words = sortWordsForCategory(c.words, c.name).map((w, i) => ({ ...w, order: i }));
  });
}

export type MoveKind = "up" | "down" | "start" | "end";

export function moveWord(catId: string, wordId: string, kind: MoveKind) {
  return mutate(catId, (c) => {
    const idx = c.words.findIndex((w) => w.id === wordId);
    if (idx < 0) return;
    const arr = [...c.words];
    const [item] = arr.splice(idx, 1);
    if (kind === "up") arr.splice(Math.max(0, idx - 1), 0, item);
    else if (kind === "down") arr.splice(Math.min(arr.length, idx + 1), 0, item);
    else if (kind === "start") arr.unshift(item);
    else arr.push(item);
    c.words = arr.map((w, i) => ({ ...w, order: i }));
  });
}

/** Group ordered words into alphabetical ranges (A–E, F–J, ...). */
export function groupIntoAlphaRanges(words: CustomWord[], bucketSize = 5): { label: string; words: CustomWord[] }[] {
  const sorted = [...words].sort(byLabel);
  const buckets: { label: string; words: CustomWord[] }[] = [];
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  for (let i = 0; i < letters.length; i += bucketSize) {
    const from = letters[i];
    const to = letters[Math.min(letters.length - 1, i + bucketSize - 1)];
    const inRange = sorted.filter((w) => {
      const first = (w.label[0] || "#").toUpperCase();
      return first >= from && first <= to;
    });
    if (inRange.length) buckets.push({ label: from === to ? from : `${from}–${to}`, words: inRange });
  }
  const other = sorted.filter((w) => {
    const first = (w.label[0] || "#").toUpperCase();
    return first < "A" || first > "Z";
  });
  if (other.length) buckets.push({ label: "#", words: other });
  return buckets;
}

// --- board helpers (feature-additive) ------------------------------------

export const BOTTOM_CATEGORIES: { key: string; icon: string; label: string; enFallback: string; color: string }[] = [
  { key: "Core", icon: "💬", label: "Core", enFallback: "Core", color: "#2f6d62" },
  { key: "People", icon: "♡", label: "People", enFallback: "People", color: "#c96b6b" },
  { key: "Feelings", icon: "😊", label: "Feelings", enFallback: "Feelings", color: "#e67e22" },
  { key: "Actions", icon: "⚡", label: "Actions", enFallback: "Actions", color: "#c98a3d" },
  { key: "Food", icon: "🍴", label: "Food", enFallback: "Food", color: "#5c9a58" },
  { key: "Places", icon: "🏛️", label: "Places", enFallback: "Places", color: "#4a7fe6" },
  { key: "Things", icon: "✨", label: "Things", enFallback: "Things", color: "#8a6bc9" },
  { key: "Red", icon: "🎨", label: "Red", enFallback: "Red", color: "#d9534f" },
  { key: "Say It For Me", icon: "🗨️", label: "Say It For Me", enFallback: "Say It For Me", color: "#d9534f" },
  { key: "Schools", icon: "🏫", label: "Schools", enFallback: "Schools", color: "#2f6d62" },
  { key: "Sports", icon: "⚽", label: "Sports", enFallback: "Sports", color: "#c96b6b" },
  { key: "Hygiene", icon: "🛁", label: "Hygiene", enFallback: "Hygiene", color: "#8a6bc9" },
  { key: "Music", icon: "🎸", label: "Music", enFallback: "Music", color: "#d46cae" },
];

export function bottomTabCategories(lang?: LanguageCode): { id: string; name: string; icon: string; color: string }[] {
  const activeLang = lang || seedLang;
  const top = visibleTopLevelCategories();
  const out: { id: string; name: string; icon: string; color: string }[] = [];

  // Match known categories first (in consistent standard order) ONLY if they exist and are not deleted or hidden
  for (const tab of BOTTOM_CATEGORIES) {
    if (
      isDeletedCategory(tab.key) ||
      isDeletedCategory(tab.label) ||
      isDeletedCategory(tab.enFallback)
    ) {
      continue;
    }
    const hit = top.find((c) => {
      const en = (canonicalWordEn(c.name) || FOLDER_EN_BY_LANG[c.name.toLowerCase()] || c.name).toLowerCase();
      return (
        en === tab.key.toLowerCase() ||
        c.name.toLowerCase() === tab.key.toLowerCase() ||
        c.name.toLowerCase() === tab.label.toLowerCase() ||
        c.name.toLowerCase() === tab.enFallback.toLowerCase() ||
        c.name.toLowerCase() === folderName(tab.key, activeLang).toLowerCase()
      );
    });
    if (hit && !hit.hidden) {
      out.push({
        id: hit.id,
        name: folderName(tab.key, activeLang) || wordLabel(tab.key, activeLang) || tab.label,
        icon: hit.icon || tab.icon,
        color: hit.color || tab.color,
      });
    }
  }

  // Include any other user-created top-level shelves (e.g. "My Angel's World", etc.)
  for (const c of top) {
    const en = (canonicalWordEn(c.name) || FOLDER_EN_BY_LANG[c.name.toLowerCase()] || c.name).toLowerCase();
    const isStandard = BOTTOM_CATEGORIES.some((bc) => bc.key.toLowerCase() === en);
    if (!isStandard && !out.some((x) => x.id === c.id)) {
      out.push({
        id: c.id,
        name: wordLabel(c.name, activeLang),
        icon: c.icon || "📁",
        color: c.color || "#2f6d62",
      });
    }
  }

  return out;
}

export function coreWords(): CustomWord[] {
  const coreCat = topLevelCategories().find((c) => {
    const en = (canonicalWordEn(c.name) || FOLDER_EN_BY_LANG[c.name.toLowerCase()] || c.name).toLowerCase();
    return en === "core" || c.name === "أساسي" || c.name === "بنیادی";
  });
  if (!coreCat) return [];
  const priority = ["I", "am", "want", "is", "are", "you", "more", "stop", "help", "yes", "no", "go", "like"];
  const sorted = coreCat.words.filter((w) => !w.hidden).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const p = [...sorted].sort((a, b) => {
    const aEn = canonicalWordEn(a.label);
    const bEn = canonicalWordEn(b.label);
    const ai = priority.indexOf(aEn);
    const bi = priority.indexOf(bEn);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return p.slice(0, 12);
}

// --- Backup / export -------------------------------------------------------

export interface BackupFile {
  version: number;
  exportedAt: number;
  categoryCount: number;
  wordCount: number;
  imageCount: number;
  categories: CustomCategory[];
}

export function buildBackup(): BackupFile {
  const categories = [...cache];
  return {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    categoryCount: categories.length,
    wordCount: categories.reduce((s, c) => s + c.words.length, 0),
    imageCount: categories.reduce((s, c) => s + c.words.filter((w) => !!w.imageUri).length, 0),
    categories,
  };
}

export interface RestoreReport {
  ok: boolean;
  restoredCategories: number;
  restoredWords: number;
  restoredImages: number;
  issues: string[];
}

/** Restore from a backup object and self-check against its manifest. */
export function restoreBackup(data: unknown, mode: "replace" | "merge" = "replace"): RestoreReport {
  const issues: string[] = [];
  const file = data as Partial<BackupFile>;
  if (!file || !Array.isArray(file.categories)) {
    return { ok: false, restoredCategories: 0, restoredWords: 0, restoredImages: 0, issues: ["File is not a valid BloomSpeech backup."] };
  }

  const incoming = file.categories.filter((c): c is CustomCategory => !!c && Array.isArray((c as CustomCategory).words));
  if (incoming.length !== file.categories.length) issues.push("Some categories were malformed and skipped.");

  cache = mode === "replace" ? incoming : mergeById(cache, incoming);
  loaded = true;
  persist();

  const restoredWords = cache.reduce((s, c) => s + c.words.length, 0);
  const restoredImages = cache.reduce((s, c) => s + c.words.filter((w) => !!w.imageUri).length, 0);

  if (typeof file.categoryCount === "number" && mode === "replace" && file.categoryCount !== cache.length) {
    issues.push(`Manifest expected ${file.categoryCount} categories but restored ${cache.length}.`);
  }
  if (typeof file.wordCount === "number" && mode === "replace" && file.wordCount !== restoredWords) {
    issues.push(`Manifest expected ${file.wordCount} words but restored ${restoredWords}.`);
  }
  if (typeof file.imageCount === "number" && mode === "replace" && file.imageCount !== restoredImages) {
    issues.push(`Manifest expected ${file.imageCount} images but restored ${restoredImages}.`);
  }

  return { ok: issues.length === 0, restoredCategories: cache.length, restoredWords, restoredImages, issues };
}

function mergeById(existing: CustomCategory[], incoming: CustomCategory[]): CustomCategory[] {
  const map = new Map(existing.map((c) => [c.id, c]));
  for (const c of incoming) map.set(c.id, c);
  return [...map.values()];
}
