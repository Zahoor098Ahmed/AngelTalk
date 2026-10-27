import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CustomCategory, CustomWord, TileSize, LanguageCode } from "../types";
import { starterLabel, wordLabel, canonicalWordEn, translateDynamic } from "./i18n";
import { getPictogramUrl, isOneWordGuess, pictureFixFor, hasSymbolPicture } from "./aacPictograms";
import { VERB_FORMS_LIST, getVerbForms, generateAllVerbForms, isContinuousForm, sFormOf, conjugateRegularVerb, KNOWN_REGULAR_VERBS, registerVerbForms, registerSForm, type VerbForms } from "./verbForms";
import PECS_EMOJI from "./pecsEmoji.json";
import { CLIENT_SHELVES, CLIENT_VERBS } from "./clientVocabulary";
import { PECS_SHELVES, PECS_SUBS, PECS_VERBS, PECS_FOLDER_NAMES_AR, cleanPecsWord, capFirst } from "./pecsVocabulary";
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

const KEY = "kiddocare_custom_categories_wordfile_v6";
const BACKUP_VERSION = 2;

// Other spellings caregivers use for a built-in folder (e.g. a voice-made "Subject" folder)
const FOLDER_ALIASES: Record<string, string> = { subject: "Subjects" };

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

const DELETED_KEYS_STORAGE = "kiddocare_deleted_items_wordfile_v6";
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
  } catch { }
  deletedKeysLoaded = true;
}

function persistDeletedKeys() {
  AsyncStorage.setItem(DELETED_KEYS_STORAGE, JSON.stringify([...deletedItemKeys])).catch(() => { });
}

export function isDeletedCategory(name: string, parentId?: string | null): boolean {
  const norm = (name || "").trim().toLowerCase();
  if (deletedItemKeys.has(`cat::${norm}`)) return true;
  if (parentId && deletedItemKeys.has(`subcat::${parentId}::${norm}`)) return true;
  return false;
}

const VERB_FORM_TAGS = ["1st", "s", "2nd", "3rd", "4th"] as const;

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

/** A caregiver re-creating a deleted category on purpose: lift the delete block for that name. */
export function unblockDeletedCategory(name: string, parentId?: string | null) {
  const norms = new Set([(name || "").trim().toLowerCase()]);
  const en = (canonicalWordEn(name) || "").trim().toLowerCase();
  if (en) norms.add(en);
  const localized = (folderName(name, seedLang) || wordLabel(name, seedLang) || "").trim().toLowerCase();
  if (localized) norms.add(localized);
  let changed = false;
  for (const norm of norms) {
    if (!norm) continue;
    if (deletedItemKeys.delete(`cat::${norm}`)) changed = true;
    if (parentId && deletedItemKeys.delete(`subcat::${parentId}::${norm}`)) changed = true;
    for (const key of deletedItemKeys) {
      if (key.startsWith("subcat::") && key.endsWith(`::${norm}`)) {
        deletedItemKeys.delete(key);
        changed = true;
      }
    }
  }
  if (changed) persistDeletedKeys();
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

let loadingPromise: Promise<void> | null = null;

export function ensureCategoriesLoaded(): Promise<void> {
  if (!loadingPromise) {
    loadingPromise = loadCategories().catch((e) => {
      loadingPromise = null;
      throw e;
    });
  }
  return loadingPromise;
}

async function loadCategories(): Promise<void> {
  await ensureDeletedKeysLoaded();
  if (loaded) return;
  try {
    let raw = await AsyncStorage.getItem(KEY);
    if (!raw && typeof window !== "undefined" && window.localStorage) {
      raw = window.localStorage.getItem(KEY);
    }
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
    if (!hasCore) {
      deletedItemKeys.add("cat::core");
      deletedItemKeys.add("cat::بنیادی");
      deletedItemKeys.add("cat::أساسي");
      persistDeletedKeys();
    }
  }
  // Also on a fresh install: the starter board only holds the top-level folders,
  // their sub-folders and words (Family, Drinks, Verbs A–Z…) are filled in here.
  ensureAllStandardCategories();
  cleanAndDeduplicateCategories();
  retranslateSeedBoard(seedLang);
  refreshSayItForMeImages();
  refreshGuessedPictures();
}

/** The word's own emoji, shown when it has no picture ("chipmunk" -> 🐿️). */
function wordEmoji(label: string): string | undefined {
  return (PECS_EMOJI as Record<string, string>)[label.trim().toLowerCase()];
}

/**
 * Built-in words whose picture was guessed from one of their words ("blue whale" showing the
 * color blue, "brush teeth" a hairbrush) get the picture picked for the whole word. Pictures a
 * parent chose are never touched.
 */
function refreshGuessedPictures() {
  let changed = false;
  for (const c of cache) {
    for (const w of c.words) {
      // the folder's emoji on every word ("🐾" on each animal) -> the word's own emoji
      if (!w.isCustom && w.emoji === c.icon) {
        const own = wordEmoji(w.verbForms?.base || canonicalWordEn(w.label) || w.label);
        if (own && own !== w.emoji) {
          w.emoji = own;
          changed = true;
        }
      }
      if (w.isCustom || !w.imageUri || !w.imageUri.startsWith("https://static.arasaac.org/")) continue;
      const en = (w.verbForms?.base || canonicalWordEn(w.label) || w.label).trim();
      // a picture checked by eye replaces the automatic one ("sink", "see saw"), or removes it
      // ... or the exact word from another symbol set; a guess from one of its words ("blue" for "blue whale") too
      const exact = pictureFixFor(en) !== undefined || hasSymbolPicture(en);
      if (!exact && !isOneWordGuess(en, w.imageUri) && !isOneWordGuess(w.label, w.imageUri)) continue;
      const better = getPictogramUrl(en) ?? undefined;
      if ((better || exact) && better !== w.imageUri) {
        w.imageUri = better;
        changed = true;
      }
    }
  }
  if (changed) {
    cache = [...cache];
    persist();
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
    name: "Subjects",
    icon: "🧑‍🤝‍🧑",
    color: "#6C63FF",
    words: [
      ["All", "💯"],
      ["Anybody", "🙋"],
      ["Anyone", "🙋"],
      ["Anything", "❔"],
      ["Both", "✌️"],
      ["Each", "☝️"],
      ["Everybody", "👨‍👩‍👧‍👦"],
      ["Everyone", "👨‍👩‍👧‍👦"],
      ["Everything", "🌍"],
      ["Few", "🤏"],
      ["He", "👦"],
      ["Her", "👧"],
      ["Hers", "👧"],
      ["Herself", "👧"],
      ["Him", "👦"],
      ["Himself", "👦"],
      ["His", "👦"],
      ["I", "🧒"],
      ["It", "📦"],
      ["Its", "📦"],
      ["Itself", "📦"],
      ["Many", "🔢"],
      ["Me", "🧒"],
      ["Mine", "🧒"],
      ["My", "🧒"],
      ["Myself", "🧒"],
      ["No one", "🚫"],
      ["Nobody", "🚫"],
      ["None", "🚫"],
      ["Nothing", "⭕"],
      ["Our", "🤝"],
      ["Ours", "🤝"],
      ["Ourselves", "🤝"],
      ["She", "👧"],
      ["Some", "🔹"],
      ["Somebody", "👤"],
      ["Someone", "👤"],
      ["Something", "🎁"],
      ["That", "👉"],
      ["Their", "👥"],
      ["Theirs", "👥"],
      ["Them", "👥"],
      ["Themselves", "👥"],
      ["These", "👇"],
      ["They", "👥"],
      ["This", "☝️"],
      ["Those", "👈"],
      ["Us", "🤝"],
      ["We", "🤝"],
      ["What", "❓"],
      ["Which", "🤔"],
      ["Who", "🙋"],
      ["Whom", "🙋"],
      ["Whose", "🙋"],
      ["You", "🫵"],
      ["Your", "🫵"],
      ["Yours", "🫵"],
      ["Yourself", "🫵"],
      ["Yourselves", "🫵"],
    ],
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
// Shelves from the PECS word list (Alphabet, Animals, Calendar…)
for (const shelf of PECS_SHELVES) {
  if (!STARTER.some((x) => x.name === shelf.name)) STARTER.push({ ...shelf, words: [] });
}

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

// Verbs from the PECS word list: the ones the app can conjugate ("brush", "brush teeth") join Verbs A–Z
// with all 5 forms; the others ("back rub", "high five") go to Verbs / Other.
const pecsVerbLeftovers: string[] = [];
/**
 * PDF verbs the rules cannot conjugate, with their 5 forms: 1st, s/es, 2nd, 3rd, 4th.
 * The 1st form is the PDF's own words, so each stays in its letter's folder.
 */
const PECS_PHRASE_FORMS: Record<string, [string, string, string, string, string]> = {
  "back rub": ["back rub", "back rubs", "back rubbed", "back rubbed", "back rubbing"],
  "back stroke": ["back stroke", "back strokes", "back stroked", "back stroked", "back stroking"],
  "breast stroke": ["breast stroke", "breast strokes", "breast stroked", "breast stroked", "breast stroking"],
  "cash out": ["cash out", "cashes out", "cashed out", "cashed out", "cashing out"],
  "feet on floor": ["feet on floor", "puts feet on floor", "put feet on floor", "put feet on floor", "putting feet on floor"],
  "flush toilet": ["flush toilet", "flushes toilet", "flushed toilet", "flushed toilet", "flushing toilet"],
  "food prep": ["food prep", "food preps", "food prepped", "food prepped", "food prepping"],
  "frog kick": ["frog kick", "frog kicks", "frog kicked", "frog kicked", "frog kicking"],
  "hands in lap": ["hands in lap", "puts hands in lap", "put hands in lap", "put hands in lap", "putting hands in lap"],
  "hands to yourself": ["hands to yourself", "keeps hands to yourself", "kept hands to yourself", "kept hands to yourself", "keeping hands to yourself"],
  "head massage": ["head massage", "head massages", "head massaged", "head massaged", "head massaging"],
  "hide and seek": ["hide and seek", "hides and seeks", "hid and sought", "hidden and sought", "hiding and seeking"],
  "high five": ["high five", "high fives", "high fived", "high fived", "high fiving"],
  "line up": ["line up", "lines up", "lined up", "lined up", "lining up"],
  "mow lawn": ["mow lawn", "mows lawn", "mowed lawn", "mown lawn", "mowing lawn"],
  "piggyback": ["piggyback", "piggybacks", "piggybacked", "piggybacked", "piggybacking"],
  "sledging": ["sledge", "sledges", "sledged", "sledged", "sledging"],
  "sorting": ["sort", "sorts", "sorted", "sorted", "sorting"],
  "squish with beanbag": ["squish with beanbag", "squishes with beanbag", "squished with beanbag", "squished with beanbag", "squishing with beanbag"],
  "stock shelves": ["stock shelves", "stocks shelves", "stocked shelves", "stocked shelves", "stocking shelves"],
  "stomp feet": ["stomp feet", "stomps feet", "stomped feet", "stomped feet", "stomping feet"],
  "tantrum": ["tantrum", "throws a tantrum", "threw a tantrum", "thrown a tantrum", "throwing a tantrum"],
  "image search": ["image search", "image searches", "image searched", "image searched", "image searching"],
  "internet search": ["internet search", "internet searches", "internet searched", "internet searched", "internet searching"],
  "video search": ["video search", "video searches", "video searched", "video searched", "video searching"],
  "water play": ["water play", "plays with water", "played with water", "played with water", "playing with water"],
};
/** The app's earlier A–Z verbs: still known for their forms, but the board shows only the client's verbs. */
const LEGACY_VERBS_A_TO_Z = Object.values(VERBS_A_TO_Z).flat();
registerVerbForms(LEGACY_VERBS_A_TO_Z);
for (const k of Object.keys(VERBS_A_TO_Z)) delete VERBS_A_TO_Z[k];
/** The client's verb list as spoken words ("crack (nuts)" -> "crack nuts", "jump-pool" -> "jump in pool"). */
const CLIENT_VERB_WORDS: Record<string, string> = {
  "change temperature (car)": "change temperature", "change temperature (house)": "change temperature", "crack (nuts)": "crack nuts",
  "dry hair (towel)": "dry hair", "hose (spray)": "hose", "push (button)": "push button", "jump-pool": "jump in pool",
  "kick-water": "kick water", "frisbee-play": "play frisbee", "haircut - boy": "haircut", "up": "up",
};
const clientVerbWord = (v: string) => CLIENT_VERB_WORDS[v.trim().toLowerCase()] ?? v.trim();
{
  // nouns that are on the PDF's verb list
  const NOT_VERBS = new Set(["party", "picnic", "haircut", "tantrum", "up", "piggyback", "backhand", "tubing", "sliced", "chopped"]);
  // activities whose first word is not the verb ("back rub", not "backed rub")
  const NOT_VERB_PHRASES = new Set(["back rub", "back stroke", "face painting", "hide and seek", "show and tell", "water play", "water ski"]);
  // "deliver" -> delivered, not "deliverred"
  const fixDoubling = (f: string) => f.replace(/([aeiou][^aeiou\s]*e)r(r)(ed|ing)\b/, "$1r$3");
  const pecsSingles = new Set(
    CLIENT_VERBS.map((w) => clientVerbWord(w).toLowerCase()).filter((w) => w && !w.includes(" ") && !NOT_VERBS.has(w) && !/(ing|ed)$/.test(w)),
  );
  const isKnownVerb = (w: string) => {
    const v = getVerbForms(w);
    return (!!v && v.base.toLowerCase() === w) || KNOWN_REGULAR_VERBS.has(w) || pecsSingles.has(w);
  };
  for (const rawVerb of CLIENT_VERBS) {
    const phrase = clientVerbWord(rawVerb);
    if (!phrase) continue;
    const lower = phrase.toLowerCase();
    const parts = lower.split(/\s+/);
    let vf: { base: string; past: string; participle: string; continuous: string; emoji?: string } | null = null;
    if (parts.length === 1) {
      if (NOT_VERBS.has(lower)) vf = null;
      else if (isKnownVerb(lower)) vf = getVerbForms(lower)?.base.toLowerCase() === lower ? getVerbForms(lower) : conjugateRegularVerb(lower);
      else {
        const g = generateAllVerbForms(lower); // "cooking" -> cook
        if (g && isKnownVerb(g.base.toLowerCase())) vf = g;
      }
    } else if (!NOT_VERB_PHRASES.has(lower) && isKnownVerb(parts[0])) {
      const first = getVerbForms(parts[0]);
      const v = first && first.base.toLowerCase() === parts[0] ? first : conjugateRegularVerb(parts[0]);
      const rest = parts.slice(1).join(" ");
      vf = { base: `${v.base} ${rest}`, past: `${fixDoubling(v.past)} ${rest}`, participle: `${fixDoubling(v.participle)} ${rest}`, continuous: `${fixDoubling(v.continuous)} ${rest}`, emoji: v.emoji };
    }
    // activities the rules cannot conjugate get their 5 forms written out ("high five" -> high fived)
    const written = PECS_PHRASE_FORMS[lower];
    if (written) {
      const [base, s, past, participle, continuous] = written;
      registerSForm(base, s);
      vf = { base, past, participle, continuous, emoji: "⚡" };
      registerVerbForms([vf as VerbForms]);
    }
    if (!vf) {
      if (!pecsVerbLeftovers.some((x) => x.toLowerCase() === lower)) pecsVerbLeftovers.push(phrase);
      continue;
    }
    const base = vf.base.toLowerCase();
    if (Object.values(VERBS_A_TO_Z).some((list) => list.some((v) => v.base === base))) continue;
    const letter = base[0].toUpperCase();
    if (!/[A-Z]/.test(letter)) continue;
    (VERBS_A_TO_Z[letter] ||= []).push({ base, past: vf.past, participle: vf.participle, continuous: vf.continuous, emoji: vf.emoji || "⚡" });
  }
}

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
/** "A".."Z" for the Actions › Verbs A–Z folders, otherwise null. */
/** The English name of a folder in any language ("أفعال" -> "Verbs", "حيوانات" -> "Animals"). */
export function folderEnglishName(c: CustomCategory): string {
  const raw = (c.seedName || FOLDER_EN_BY_LANG[(c.name || "").toLowerCase()] || canonicalWordEn(c.name) || c.name || "").trim();
  return FOLDER_NAMES["en-US"]?.[raw] ?? raw; // "Actions" -> "Verbs"
}

export function folderPictureFor(c: CustomCategory): { text?: string; uri?: string } {
  const enOf = (x: CustomCategory) =>
    (x.seedName || FOLDER_EN_BY_LANG[(x.name || "").toLowerCase()] || canonicalWordEn(x.name) || x.name || "").trim();
  const en = enOf(c).toLowerCase();
  // letters and numbers show themselves
  if (en === "lower case" || en === "english alphabets lowercase") return { text: "abc" };
  if (en === "upper case" || en === "english alphabets uppercase") return { text: "ABC" };
  if (en === "arabic alphabets") return { text: "أ ب ت" };
  if (en === "arabic numerals") return { text: "١٢٣" };
  if (en === "urdu alphabets") return { text: "ا ب پ" };
  if (en === "urdu numerals") return { text: "۱۲۳" };
  if (en === "french alphabets" || en === "spanish alphabets" || en === "german alphabets") return { text: "ABC" };
  if (en === "numerals" || en === "french numerals" || en === "spanish numerals" || en === "german numerals") return { text: "123" };
  // the calendar's "Dates" (days of the month), not the fruit
  if (en === "dates" && !c.isCustom) return { uri: "https://static.arasaac.org/pictograms/34799/34799_500.png" };
  if (c.imageUri) return { uri: c.imageUri };
  // "General" or "Animals" looks like its shelf (Animals / Animals -> the animals picture)
  const parent = c.parentCategoryId ? cache.find((x) => x.id === c.parentCategoryId) : undefined;
  // Calendar / Others (day, week, year, today...) is about time: an hourglass, not a second calendar next to Months
  if ((en === "others" || en === "other") && parent && enOf(parent).toLowerCase() === "calendar") {
    return { uri: "https://static.arasaac.org/pictograms/22631/22631_500.png" };
  }
  const name = (en === "general" || en === "others" || en === "other") && parent ? enOf(parent) : enOf(c);
  return { uri: getPictogramUrl(name) ?? undefined };
}

export function verbFolderLetter(c: CustomCategory): string | null {
  return verbSubLetter(c)?.toUpperCase() ?? null;
}

function verbSubLetter(c: CustomCategory): string | null {
  if (!c.parentCategoryId) return null;
  const candidates = [c.seedName, canonicalWordEn(c.name), FOLDER_EN_BY_LANG[(c.name || "").toLowerCase()], c.name];
  for (const n of candidates) {
    const m = /^verbs? ([a-z])$/i.exec((n || "").trim());
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
      // the verb itself decides the folder ("Is" -> be -> B), not the label's language
      const wl = w.verbForms?.base
        ? (w.verbForms.base.charAt(0).toLowerCase().match(/[a-z]/)?.[0] ?? null)
        : verbLetterOf(/[؀-ۿ]/.test(w.label) && w.seedLabel ? w.seedLabel : w.label);
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
const ACTION_VERB_SUBCATEGORIES = Object.entries(VERBS_A_TO_Z)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([letter, rawList]) => {
  const list = [...rawList].sort((a, b) => a.base.localeCompare(b.base, undefined, { sensitivity: "base" }));
  const words: [string, string, ("1st" | "s" | "2nd" | "3rd" | "4th")?][] = [];
  list.forEach((v) => {
    words.push([capWord(v.base), v.emoji, "1st"]);
    words.push([capWord(sFormOf(v.base)), v.emoji, "s"]);
    words.push([capWord(v.past), v.emoji, "2nd"]);
    words.push([capWord(v.participle), v.emoji, "3rd"]);
    words.push([capWord(v.continuous), v.emoji, "4th"]);
  });
  return {
    parentCategory: "Actions",
    name: `Verb ${letter}`,
    icon: letter === "A" ? "🅰️" : letter === "B" ? "🅱️" : "🔤",
    words,
  };
});

export const STARTER_SUBCATEGORIES: {
  parentCategory: string;
  name: string;
  icon: string;
  words: [string, string, ("1st" | "s" | "2nd" | "3rd" | "4th")?][];
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

/** PECS verbs without verb forms ("high five") -> the letter of the Verbs folder that holds them. */
const PECS_PLAIN_VERBS = new Map<string, string>();

/** Folder names made while splitting long PECS lists ("General A–F"), for their Arabic names. */
const pecsSplitNames: { en: string; base: string; range: string }[] = [];

/** The board as the app had it before the client's list (still used to read old Arabic labels back to English). */
const LEGACY_STARTER = [...STARTER];
const LEGACY_SUBCATEGORIES = [...STARTER_SUBCATEGORIES];

// The board is the client's list: its categories, sub-categories and words, A–Z. A word is on the board once:
// verbs (with all their forms) keep their place in Verbs A–Z, every other word stays where it first appears.
(() => {
  const norm = (w: string) => w.toLowerCase().replace(/\s+/g, " ").trim();
  const seen = new Set<string>();
  Object.values(VERBS_A_TO_Z).forEach((list) =>
    // a verb's other forms live inside its box (popup), so only the verb itself takes its place on the board
    list.forEach((v) => seen.add(norm(v.base))),
  );
  const take = (words: string[], keepCase = false): string[] => {
    const out: string[] = [];
    for (const raw of words) {
      const label = keepCase ? raw.trim() : capFirst(raw.trim());
      if (!label) continue;
      if (keepCase) {
        // letters a–z / A–Z are their own folders, not compared with other words
        if (!out.includes(label)) out.push(label);
        continue;
      }
      const key = norm(label);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(label);
    }
    return out;
  };
  const shelves: typeof STARTER = [];
  const subs: typeof STARTER_SUBCATEGORIES = [];
  for (const shelf of CLIENT_SHELVES) {
    const flat = take(shelf.words ?? []);
    shelves.push({ name: shelf.name, icon: shelf.icon, words: flat.map((w) => [w, wordEmoji(w) ?? shelf.icon] as [string, string]) });
    for (const sub of shelf.subs ?? []) {
      const words = take(sub.words, !!sub.keepCase);
      if (words.length || (sub.subs && sub.subs.length)) {
        subs.push({ parentCategory: shelf.name, name: sub.name, icon: sub.icon, words: words.map((w) => [w, (sub.keepCase ? sub.icon : wordEmoji(w)) ?? sub.icon] as [string, string]) });
      }
      for (const childSub of sub.subs ?? []) {
        const childWords = take(childSub.words, !!childSub.keepCase);
        if (childWords.length) {
          subs.push({ parentCategory: sub.name, name: childSub.name, icon: childSub.icon, words: childWords.map((w) => [w, wordEmoji(w) ?? childSub.icon] as [string, string]) });
        }
      }
    }
  }
  // verbs the app cannot conjugate ("high five" is written out; "party", "picnic" are plain tiles) in their letter's folder
  const verbSubs = new Map<string, string[]>();
  for (const p of pecsVerbLeftovers) {
    if (!/^[a-z]/i.test(p)) continue;
    const [w] = take([p]);
    if (!w) continue;
    const letter = p[0].toUpperCase();
    (verbSubs.get(letter) || verbSubs.set(letter, []).get(letter)!).push(w);
    PECS_PLAIN_VERBS.set(w.toLowerCase(), letter);
  }
  shelves.push({ name: "Actions", icon: "⚡", color: "#c98a3d", words: [] });
  STARTER.splice(0, STARTER.length, ...shelves);
  STARTER_SUBCATEGORIES.splice(0, STARTER_SUBCATEGORIES.length, ...subs, ...ACTION_VERB_SUBCATEGORIES);
  for (const [letter, words] of verbSubs) {
    const sub = STARTER_SUBCATEGORIES.find((x) => x.parentCategory === "Actions" && x.name === `Verb ${letter}`);
    if (sub) sub.words.push(...words.map((w) => [w, wordEmoji(w) ?? "⚡"] as [string, string]));
    else STARTER_SUBCATEGORIES.push({ parentCategory: "Actions", name: `Verb ${letter}`, icon: "🔤", words: words.map((w) => [w, wordEmoji(w) ?? "⚡"] as [string, string]) });
  }
})();

// Built-in folder names (starter board + bulk-build seed lists), by language.
const FOLDER_NAMES: Partial<Record<LanguageCode, Record<string, string>>> = {
  "ar-SA": {
    Core: "أساسي", Food: "طعام", Feelings: "مشاعر", People: "أشخاص", Actions: "أفعال",
    Places: "أماكن", Things: "أشياء", Red: "أحمر", Subjects: "الضمائر",
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
    Places: "مقامات", Things: "چیزیں", Red: "لال", Subjects: "ضمیریں",
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
// Arabic names for the PECS shelves / sub-categories (split folders keep their letter range)
Object.assign((FOLDER_NAMES["ar-SA"] ||= {}), PECS_FOLDER_NAMES_AR);
// Arabic and Urdu names of the client's categories and sub-categories
Object.assign(FOLDER_NAMES["ar-SA"], {
  "Alphabets and Numerals": "الحروف والأرقام", "Alphabet and Numerals": "الحروف والأرقام",
  "Arabic Alphabets": "الحروف العربية", "Arabic Numerals": "الأرقام العربية",
  "Urdu Alphabets": "الحروف الأردية", "Urdu Numerals": "الأرقام الأردية",
  "English Alphabets uppercase": "الحروف الإنجليزية الكبيرة", "English Alphabets lowercase": "الحروف الإنجليزية الصغيرة",
  Numerals: "الأرقام", "French Alphabets": "الحروف الفرنسية", "French Numerals": "الأرقام الفرنسية",
  "Spanish Alphabets": "الحروف الإسبانية", "Spanish Numerals": "الأرقام الإسبانية",
  "German alphabets": "الحروف الألمانية", "German Numerals": "الأرقام الألمانية",
  Animals: "حيوانات", Others: "أخرى", Other: "أخرى",
  Attributes: "صفات", Colours: "ألوان", Colors: "ألوان", Sizes: "الأحجام", Shapes: "أشكال", Texture: "الملمس", Material: "المواد", Quantity: "الكمية",
  Body: "الجسم", "Body parts": "أجزاء الجسم", "Body Parts": "أجزاء الجسم", Senses: "الحواس", Organs: "الأعضاء",
  Calendar: "التقويم", Days: "الأيام", Dates: "التواريخ", Months: "الأشهر",
  "Clothing and Accessories": "ملابس وإكسسوارات",
  "Computer Electronics and Accessories": "حواسيب وإلكترونيات وملحقات", "Computers, Electronics and Accessories": "حواسيب وإلكترونيات وملحقات",
  Emotions: "المشاعر", Sensations: "الأحاسيس",
  "Food and Drinks": "الأطعمة والمشروبات", "Foods and Drinks": "الأطعمة والمشروبات",
  Breads: "خبز", "Condiments, spreads and spices": "صلصات ودهون وتوابل", "Condiments, Spreads and Spices": "صلصات ودهون وتوابل",
  "Dairy and Eggs": "ألبان وبيض", Drinks: "مشروبات", Fruits: "فواكه", Meat: "لحوم", Nuts: "مكسرات", Soups: "شوربات", Sweets: "حلويات", Vegetables: "خضروات",
  "Holidays and Celebrations": "عطلات واحتفالات",
  "Hygiene and Personal Care": "النظافة والعناية الشخصية",
  "Money and Finance": "المال والمالية",
  "Music, Instruments and Equipment": "الموسيقى والآلات والمعدات", "Music, Instruments, and Equipment": "الموسيقى والآلات والمعدات",
  "Nature and Outdoor": "الطبيعة والخارج", "Nature and Outdoors": "الطبيعة والخارج",
  "Objects In": "أشياء في", Home: "المنزل", Kitchen: "المطبخ", Bedroom: "غرفة النوم", Bathroom: "الحمام", Office: "المكتب", Park: "الحديقة", School: "المدرسة", "Swimming pool": "حمام السباحة",
  "People and Characters": "الناس والشخصيات", Family: "العائلة", People: "الناس", Professions: "المهن", Pronouns: "الضمائر",
  Places: "أماكن", Preposition: "حروف الجر", Prepositions: "حروف الجر",
  "Sentence Starters, Phrases and Questions": "بدايات الجمل والعبارات والأسئلة",
  "Songs and Stories": "أغاني وقصص", "Sports and Fitness": "الرياضة واللياقة", "Tools and Supplies": "أدوات ولوازم",
  "Toys and Leisure Items": "ألعاب وترفيه", "Transportation and Travel": "المواصلات والسفر", Vehicles: "مركبات",
  ...Object.fromEntries("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((L) => [`Verb ${L}`, `أفعال ${L}`])),
});
Object.assign((FOLDER_NAMES["ur-PK"] ||= {}), {
  "Alphabets and Numerals": "حروف اور نمبر", "Alphabet and Numerals": "حروف اور نمبر",
  "Arabic Alphabets": "عربی حروف", "Arabic Numerals": "عربی نمبر",
  "Urdu Alphabets": "اردو حروفِ تہجی", "Urdu Numerals": "اردو گنتی",
  "English Alphabets uppercase": "انگریزی بڑے حروف", "English Alphabets lowercase": "انگریزی چھوٹے حروف",
  Numerals: "نمبر", "French Alphabets": "فرانسیسی حروف", "French Numerals": "فرانسیسی نمبر",
  "Spanish Alphabets": "ہسپانوی حروف", "Spanish Numerals": "ہسپانوی نمبر",
  "German alphabets": "جرمن حروف", "German Numerals": "جرمن نمبر",
  Animals: "جانور", Others: "دیگر", Other: "دیگر",
  Attributes: "خصوصیات", Colours: "رنگ", Colors: "رنگ", Sizes: "سائز", Shapes: "شکلیں", Texture: "بناوٹ", Material: "مواد", Quantity: "مقدار",
  Body: "جسم", "Body parts": "جسم کے حصے", "Body Parts": "جسم کے حصے", Senses: "حواس", Organs: "اعضاء",
  Calendar: "کیلنڈر", Days: "دن", Dates: "تاریخیں", Months: "مہینے",
  "Clothing and Accessories": "کپڑے اور لوازمات",
  "Computer Electronics and Accessories": "کمپیوٹر اور الیکٹرانکس", "Computers, Electronics and Accessories": "کمپیوٹر اور الیکٹرانکس",
  Emotions: "جذبات", Sensations: "احساسات",
  "Food and Drinks": "کھانے اور مشروبات", "Foods and Drinks": "کھانے اور مشروبات",
  Breads: "روٹی اور بریڈ", "Condiments, spreads and spices": "چٹنی، جام اور مصالحے", "Condiments, Spreads and Spices": "چٹنی، جام اور مصالحے",
  "Dairy and Eggs": "ڈیری اور انڈے", Drinks: "مشروبات", Fruits: "پھل", Meat: "گوشت", Nuts: "خشک میوہ جات", Soups: "سوپ", Sweets: "مٹھائیاں", Vegetables: "سبزیاں",
  "Holidays and Celebrations": "تہوار اور تقریبات",
  "Hygiene and Personal Care": "صفائی اور ذاتی نگہداشت",
  "Money and Finance": "پیسہ اور مالیات",
  "Music, Instruments and Equipment": "موسیقی اور ساز", "Music, Instruments, and Equipment": "موسیقی اور ساز",
  "Nature and Outdoor": "فطرت اور باہر کا ماحول", "Nature and Outdoors": "فطرت اور باہر کا ماحول",
  "Objects In": "چیزیں (مقامات میں)", Home: "گھر", Kitchen: "باورچی خانہ", Bedroom: "سونے کا کمرہ", Bathroom: "بیت الخلاء", Office: "دفتر", Park: "پارک", School: "اسکول", "Swimming pool": "سوئمنگ پول",
  "People and Characters": "لوگ اور کردار", Family: "خاندان", People: "لوگ", Professions: "پیشے", Pronouns: "ضمائر",
  Places: "مقامات", Preposition: "حروف جار", Prepositions: "حروف جار",
  "Sentence Starters, Phrases and Questions": "جملے، فقرات اور سوالات",
  "Songs and Stories": "یت اور کہانیاں", "Sports and Fitness": "کھیل اور فٹنس", "Tools and Supplies": "اوزار اور سامان",
  "Toys and Leisure Items": "کھلونے اور تفریح", "Transportation and Travel": "سواری اور سفر", Vehicles: "گاڑیاں",
  ...Object.fromEntries("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((L) => [`Verb ${L}`, `کام ${L}`])),
});
// the "Actions" shelf is called "Verbs" in English
FOLDER_NAMES["en-US"] = { ...(FOLDER_NAMES["en-US"] ?? {}), Actions: "Verbs" };
for (const split of pecsSplitNames) {
  const ar = PECS_FOLDER_NAMES_AR[split.base];
  if (ar) FOLDER_NAMES["ar-SA"]![split.en] = `${ar} ${split.range}`;
}

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
      const en = canonicalWordEn(item.originalText) || item.originalText;
      const translated = await translateDynamic(en, targetLang);
      if (translated && translated.toLowerCase() !== item.originalText.toLowerCase()) {
        if (item.type === "cat") {
          const targetCat = cache.find((c) => c.id === item.id);
          if (targetCat) {
            targetCat.name = translated;
            hasUpdates = true;
          }
        } else if (item.type === "word" && item.catId) {
          const targetCat = cache.find((c) => c.id === item.catId);
          const targetWord = targetCat?.words.find((w) => w.id === item.id);
          if (targetWord) {
            if (!/[؀-ۿ]/.test(targetWord.label)) targetWord.seedLabel = targetWord.label;
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
/**
 * English source of a word for switching the board back to English. canonicalWordEn() hands an
 * Arabic/Urdu label back unchanged when its dictionaries don't know it (e.g. words translated
 * online), so also try: the stored seed label, every built-in word's Arabic/Urdu form, and
 * finally the built-in word with the same emoji in this folder.
 */
function englishOfWord(w: CustomWord, cat: CustomCategory): string {
  const label = (w.label || "").trim();
  if (!/[؀-ۿ]/.test(label)) return label;
  if (w.seedLabel) return w.seedLabel;
  const viaDict = canonicalWordEn(label);
  if (viaDict && !/[؀-ۿ]/.test(viaDict)) return viaDict;

  const seedLists: [string, string][][] = [
    ...STARTER.map((st) => st.words),
    ...STARTER_SUBCATEGORIES.map((sub) => sub.words.map(([l, e]) => [l, e] as [string, string])),
    ...LEGACY_STARTER.map((st) => st.words),
    ...LEGACY_SUBCATEGORIES.map((sub) => sub.words.map(([l, e]) => [l, e] as [string, string])),
  ];
  for (const list of seedLists) {
    for (const [en] of list) {
      for (const lng of ["ar-SA", "ur-PK"] as LanguageCode[]) {
        if (wordLabel(en, lng) === label || starterLabel(en, lng) === label) return en;
      }
    }
  }
  const catEn = (canonicalWordEn(cat.seedName || cat.name) || FOLDER_EN_BY_LANG[(cat.name || "").toLowerCase()] || cat.name).toLowerCase();
  const starter = STARTER.find((st) => st.name.toLowerCase() === catEn);
  const byEmoji = starter?.words.filter(([, e]) => e === w.emoji) ?? [];
  if (byEmoji.length === 1) return byEmoji[0][0];
  return label;
}

/** True for the name of a built-in folder in any language, or a known alias of one. */
function isBuiltInFolderName(name: string): boolean {
  const lower = (name || "").trim().toLowerCase();
  if (!lower) return false;
  return (
    !!FOLDER_ALIASES[lower] ||
    !!FOLDER_EN_BY_LANG[lower] ||
    STARTER.some((s) => s.name.toLowerCase() === lower) ||
    STARTER_SUBCATEGORIES.some((s) => s.name.toLowerCase() === lower)
  );
}

export function retranslateSeedBoard(lang: LanguageCode) {
  seedLang = lang;
  cleanAndDeduplicateCategories();
  let changed = false;
  const isTargetArabic = lang === "ar-SA" || lang === "ur-PK";
  const pendingAsyncItems: { type: "cat" | "word"; id: string; catId?: string; originalText: string }[] = [];

  for (const cat of cache) {
    if (cat.isCustom && isBuiltInFolderName(cat.name)) cat.isCustom = false;
    // 1. Category name translation (both standard & custom)
    const rawCatName = cat.name.trim();
    if (lang === "en-US") {
      const enRaw = FOLDER_EN_BY_LANG[rawCatName.toLowerCase()] || canonicalWordEn(rawCatName) || rawCatName;
      const enKey = FOLDER_ALIASES[enRaw.toLowerCase()] ?? enRaw;
      const enCat = FOLDER_NAMES["en-US"]?.[enKey] ?? enKey; // the "Actions" shelf is shown as "Verbs"
      if (enCat !== cat.name) {
        cat.name = enCat;
        changed = true;
      }
    } else {
      const enRaw = FOLDER_EN_BY_LANG[rawCatName.toLowerCase()] || canonicalWordEn(rawCatName) || rawCatName;
      const enCat = FOLDER_ALIASES[enRaw.toLowerCase()] ?? enRaw;
      const anchor = FOLDER_EN_BY_LANG[enCat.toLowerCase()] ?? enCat; // "Verbs" -> "Actions"
      const localizedName = FOLDER_NAMES[lang]?.[enCat] || FOLDER_NAMES[lang]?.[anchor] || wordLabel(enCat, lang);
      if (localizedName && localizedName.toLowerCase() !== rawCatName.toLowerCase()) {
        cat.name = localizedName;
        changed = true;
      } else if (isTargetArabic && !/[\u0600-\u06FF]/.test(cat.name)) {
        pendingAsyncItems.push({ type: "cat", id: cat.id, originalText: cat.name });
      }
    }

    // 2. Words translation (both standard & custom)
    const parentCat = cat.parentCategoryId ? cache.find((p) => p.id === cat.parentCategoryId) : undefined;
    const isFixedLanguageSub = parentCat && folderEnglishName(parentCat).toLowerCase() === "alphabets and numerals";
    if (!isFixedLanguageSub) {
      cat.words.forEach((w) => {
        const rawWordLabel = w.label.trim();
        if (lang === "en-US") {
          const en = englishOfWord(w, cat);
          if (en && en !== w.label) {
            w.label = en;
            w.phrase = en;
            changed = true;
          }
        } else {
          const en = englishOfWord(w, cat);
          // remember the English word, so switching back to English finds it again
          // (two words can share one Arabic word, and online translations have no way back)
          if (en && !/[؀-ۿ]/.test(en) && w.seedLabel !== en) {
            w.seedLabel = en;
            changed = true;
          }
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

/** Shelves made by the first version of the PECS list, later renamed to the PDF's own names. */
const PECS_V1_SHELVES = new Set([
  "alphabet", "describing words", "clothes & accessories", "electronics", "health", "celebrations", "home & kitchen",
  "money", "nature", "phrases & questions", "tools", "transport", "activities",
]);
/** Sub-categories of that first version (and its "General A–F" style parts). */
const PECS_V1_SUBS = new Set([
  "lowercase", "uppercase", "numbers", "positions", "spreads & spices", "fruits & vegetables", "meat & fish", "more foods",
  "toys", "other", "people & characters", "more places", "general", "travel",
]);

function replacePecsV1Folders(): boolean {
  let changed = false;
  const shelfNames = new Set(STARTER.map((x) => x.name.toLowerCase()));
  const enOf = (c: CustomCategory) => (FOLDER_EN_BY_LANG[c.name.toLowerCase()] ?? canonicalWordEn(c.name) ?? c.name).trim().toLowerCase();
  // whole shelves (their words are recreated under the new names)
  for (const shelf of cache.filter((c) => !c.parentCategoryId && c.source === "seed")) {
    const en = enOf(shelf);
    if (!PECS_V1_SHELVES.has(en) || shelfNames.has(en)) continue;
    const ids = new Set([shelf.id, ...cache.filter((c) => c.parentCategoryId === shelf.id).map((c) => c.id)]);
    cache = cache.filter((c) => !ids.has(c.id));
    changed = true;
  }
  // sub-categories under shelves that stay: the shelf's own words (and the caregiver's) go back to the shelf,
  // which places them again; words that now live in another sub-category are not carried along
  const keyOf = (parentEn: string, sub: string) => `${parentEn}::${sub.toLowerCase()}`;
  const current = new Set(STARTER_SUBCATEGORIES.map((x) => keyOf(x.parentCategory.toLowerCase(), x.name)));
  const homeOf = new Map<string, Set<string>>(); // word -> the sub-categories it belongs to
  for (const x of STARTER_SUBCATEGORIES) {
    for (const [label] of x.words) {
      const k = label.toLowerCase();
      if (!homeOf.has(k)) homeOf.set(k, new Set());
      homeOf.get(k)!.add(keyOf(x.parentCategory.toLowerCase(), x.name));
    }
  }
  const shelfWords = new Map(STARTER.map((x) => [x.name.toLowerCase(), new Set(x.words.map(([l]) => l.toLowerCase()))]));
  for (const sub of cache.filter((c) => c.parentCategoryId && c.source === "seed" && c.seedName)) {
    const parent = cache.find((c) => c.id === sub.parentCategoryId);
    if (!parent) continue;
    const seed = sub.seedName!.toLowerCase();
    const base = seed.replace(/ [a-z](–[a-z])?$/, ""); // "general a–f" -> "general"
    if (/^verbs [a-z]$/.test(seed) || !PECS_V1_SUBS.has(base)) continue;
    const parentEn = enOf(parent);
    if (base === seed && current.has(keyOf(parentEn, seed))) continue;
    for (const w of sub.words) {
      const k = (canonicalWordEn(w.label) || w.label).toLowerCase();
      const keep = w.isCustom || !homeOf.has(k) || shelfWords.get(parentEn)?.has(k);
      if (keep && !parent.words.some((pw) => pw.label.toLowerCase() === w.label.toLowerCase())) parent.words.push({ ...w, order: parent.words.length });
    }
    cache = cache.filter((c) => c.id !== sub.id);
    changed = true;
  }
  // a seed word that moved to another sub-category (sweets from "Snacks & Sweets" to "Sweets") leaves its old place
  for (const sub of cache.filter((c) => c.parentCategoryId && c.seedName)) {
    const parent = cache.find((c) => c.id === sub.parentCategoryId);
    if (!parent) continue;
    const key = keyOf(enOf(parent), sub.seedName!);
    if (!current.has(key)) continue;
    const before = sub.words.length;
    sub.words = sub.words.filter((w) => {
      if (w.isCustom || w.verbFormTag) return true;
      const homes = homeOf.get((canonicalWordEn(w.label) || w.label).toLowerCase());
      return !homes || homes.has(key);
    });
    if (sub.words.length !== before) changed = true;
  }
  return changed;
}

/**
 * The board is the client's list: built-in folders that are not on it (old Core, Food, Schools… and the earlier
 * PECS folders) go. A folder that holds the caregiver's own words or folders stays, with only those in it.
 */
function removeFoldersNotInClientList(): boolean {
  let changed = false;
  const enOf = (c: CustomCategory) => folderEnglishName(c).toLowerCase();
  const shelfNames = new Set(STARTER.map((x) => (x.name === "Actions" ? "verbs" : x.name.toLowerCase())));
  shelfNames.add("actions");
  const subsOf = new Map<string, Set<string>>();
  for (const x of STARTER_SUBCATEGORIES) {
    const k = x.parentCategory === "Actions" ? "verbs" : x.parentCategory.toLowerCase();
    (subsOf.get(k) || subsOf.set(k, new Set()).get(k)!).add(x.name.toLowerCase());
  }
  const removeTree = (c: CustomCategory) => {
    const ids = new Set<string>([c.id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const x of cache) if (x.parentCategoryId && ids.has(x.parentCategoryId) && !ids.has(x.id)) { ids.add(x.id); grew = true; }
    }
    cache = cache.filter((x) => !ids.has(x.id));
    changed = true;
  };
  for (const shelf of cache.filter((c) => !c.parentCategoryId)) {
    if (shelfNames.has(enOf(shelf))) continue;
    removeTree(shelf);
  }
  for (const sub of cache.filter((c) => c.parentCategoryId)) {
    const parent = cache.find((x) => x.id === sub.parentCategoryId);
    if (!parent) { removeTree(sub); continue; }
    const pEn = (parent.seedName || enOf(parent)).toLowerCase();
    const valid = subsOf.get(pEn === "actions" ? "verbs" : pEn);
    const name = (sub.seedName || enOf(sub)).toLowerCase();
    if (valid?.has(name)) continue;
    removeTree(sub);
  }
  return changed;
}

/** Built-in words of a category without sub-categories follow the client's list; the caregiver's own words stay. */
function syncShelfWords(cat: CustomCategory, seedWords: [string, string][]): boolean {
  const used = new Set<string>();
  const target = seedWords
    .filter(([label]) => !isDeletedWord(cat.id, label))
    .map(([label, emoji], wi) => {
      const existing = preferCustomized(cat.words.filter((w) => !used.has(w.id) && !w.verbFormTag &&
        [w.seedLabel, canonicalWordEn(w.label), w.label].some((l) => (l || "").toLowerCase() === label.toLowerCase())));
      if (existing) used.add(existing.id);
      const localized = wordLabel(label, seedLang) || label;
      return {
        ...(existing ?? {}),
        id: existing?.id ?? uid("w"),
        label: existing?.isCustom ? existing.label : localized,
        phrase: existing?.isCustom ? existing.phrase : localized,
        emoji: existing?.emoji || emoji || "🔹",
        imageUri: existing?.imageUri || getPictogramUrl(label) || undefined,
        useTextToSpeech: existing?.useTextToSpeech ?? true,
        size: existing?.size ?? ("md" as TileSize),
        order: wi,
        hidden: existing?.hidden ?? false,
        seedLabel: label,
      } as CustomWord;
    });
  const own = cat.words.filter((w) => !used.has(w.id) && w.isCustom);
  const next = [...target, ...own.map((w, i) => ({ ...w, order: target.length + i }))];
  if (next.length === cat.words.length && next.every((w, i) => w.id === cat.words[i].id && w.label === cat.words[i].label)) return false;
  cat.words = next;
  return true;
}

function ensureAllStandardCategories() {
  let changed = removeFoldersNotInClientList();
  const now = Date.now();

  STARTER.forEach((s, idx) => {
    if (isDeletedCategory(s.name)) return;
    const sName = s.name.toLowerCase();
    const hit = cache.find((c) => {
      if (c.parentCategoryId) return false;
      const en = (canonicalWordEn(c.name) || FOLDER_EN_BY_LANG[c.name.toLowerCase()] || c.name).trim().toLowerCase();
      return (
        en === sName ||
        FOLDER_ALIASES[en]?.toLowerCase() === sName ||
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
    } else if (s.words.length > 0) {
      if (syncShelfWords(hit, s.words)) changed = true;
    } else if (s.name === "Actions" && !hit.isCustom && hit.name === "Actions" && folderName("Actions") !== "Actions") {
      // shown as "Verbs" now
      hit.name = folderName("Actions");
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
    } else if (s.name === "Subjects") {
      // Keep the pronoun list complete and in its A–Z order on existing installs too
      const used = new Set<string>();
      const target = s.words
        .filter(([label]) => !isDeletedWord(hit.id, label))
        .map(([label, emoji], wi) => {
          const localized = starterLabel(label, seedLang) || label;
          const existing = hit.words.find(
            (w) =>
              !used.has(w.id) &&
              ((w.seedLabel || "").toLowerCase() === label.toLowerCase() ||
                (canonicalWordEn(w.label) || w.label).toLowerCase() === label.toLowerCase() ||
                w.label === localized)
          );
          if (existing) used.add(existing.id);
          return existing
            ? { ...existing, order: wi, seedLabel: label }
            : {
              id: uid("w"),
              label: localized,
              phrase: localized,
              emoji,
              imageUri: getPictogramUrl(label) || undefined,
              useTextToSpeech: true,
              size: "md" as TileSize,
              order: wi,
              seedLabel: label,
            };
        });
      const custom = hit.words.filter((w) => !used.has(w.id) && w.isCustom);
      const next = [...target, ...custom.map((w, i) => ({ ...w, order: target.length + i }))];
      if (next.length !== hit.words.length || next.some((w, i) => w.id !== hit.words[i]?.id)) {
        hit.words = next;
        changed = true;
      }
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
    const parent =
      cache.find(
        (c) =>
          !c.parentCategoryId &&
          (c.name.toLowerCase() === sub.parentCategory.toLowerCase() ||
            (FOLDER_EN_BY_LANG[c.name.toLowerCase()] ?? c.name).toLowerCase() === sub.parentCategory.toLowerCase())
      ) ??
      cache.find(
        (c) =>
          !!c.parentCategoryId &&
          ((c.seedName && c.seedName.toLowerCase() === sub.parentCategory.toLowerCase()) ||
            folderEnglishName(c).toLowerCase() === sub.parentCategory.toLowerCase())
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
    const isFixedLangSub = sub.parentCategory.toLowerCase() === "alphabets and numerals";
    const isAlphabetSub = sub.parentCategory.toLowerCase() === "alphabets and numerals";
    const targetWords = sub.words
      .filter(([label, , verbFormTag]) => !isDeletedWord(subCat!.id, label, verbFormTag))
      .map(([label, emoji, verbFormTag], wi) => {
        const existing = preferCustomized(subCat!.words.filter((w) => {
          if (usedExistingIds.has(w.id)) return false;
          if (w.seedLabel && w.seedLabel.toLowerCase() === label.toLowerCase()) {
            return !(verbFormTag && w.verbFormTag) || w.verbFormTag === verbFormTag;
          }
          const en = isFixedLangSub ? w.label.toLowerCase() : (canonicalWordEn(w.label) || w.label).toLowerCase();
          const matchesLabel = en === label.toLowerCase() || w.label.toLowerCase() === label.toLowerCase();
          if (!matchesLabel) return false;
          if (verbFormTag && w.verbFormTag) {
            return w.verbFormTag === verbFormTag;
          }
          return true;
        }));
        if (existing) usedExistingIds.add(existing.id);
        const localized = isFixedLangSub ? label : (wordLabel(label, seedLang) || label);
        return {
          id: existing?.id ?? uid("w"),
          label: existing?.isCustom ? existing.label : localized,
          phrase: existing?.isCustom ? existing.phrase : localized,
          emoji: existing?.emoji || emoji || "🔹",
          // a built-in word nobody edited always shows today's checked picture, never one saved by an older version
          imageUri: existing?.isCustom
            ? existing.imageUri
            : (isAlphabetSub ? undefined : getPictogramUrl(label)) || undefined,
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
      if (!isVerbSub) return false; // a built-in word that is not on the client's list
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
          w.imageUri !== combinedWords[i]?.imageUri ||
          w.verbFormTag !== combinedWords[i]?.verbFormTag ||
          w.hidden !== combinedWords[i]?.hidden
      )
    ) {
      subCat.words = combinedWords;
      changed = true;
    }
  });

  // Ensure top shelves appear alphabetically (with Core first if present)
  const topShelves = cache.filter((c) => !c.parentCategoryId);
  topShelves.sort((a, b) => {
    const aIsCore = (canonicalWordEn(a.name) || a.name).toLowerCase() === "core";
    const bIsCore = (canonicalWordEn(b.name) || b.name).toLowerCase() === "core";
    if (aIsCore && !bIsCore) return -1;
    if (!aIsCore && bIsCore) return 1;
    return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
  });
  topShelves.forEach((c, idx) => {
    if (c.order !== idx) {
      c.order = idx;
      changed = true;
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
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(KEY, raw);
      } catch (e) {
        console.warn("[customCategories] window.localStorage.setItem failed:", e);
      }
    }
    AsyncStorage.setItem(KEY, raw).catch((err) => {
      console.warn("[customCategories] AsyncStorage setItem failed:", err);
      try {
        const leanCache = cache.map((cat) => ({
          ...cat,
          imageUri: cat.imageUri && cat.imageUri.startsWith("data:") && cat.imageUri.length > 50000 ? undefined : cat.imageUri,
          words: cat.words.map((w) => {
            if (w.imageUri && w.imageUri.startsWith("data:") && w.imageUri.length > 50000) {
              return { ...w, imageUri: getPictogramUrl(w.label) || undefined };
            }
            return w;
          }),
        }));
        const leanRaw = JSON.stringify(leanCache);
        if (typeof window !== "undefined" && window.localStorage) {
          try { window.localStorage.setItem(KEY, leanRaw); } catch { }
        }
        AsyncStorage.setItem(KEY, leanRaw).catch(() => { });
      } catch { }
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
  unblockDeletedCategory(cat.name);
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
  if (name.trim()) unblockDeletedCategory(name, cache.find((c) => c.id === id)?.parentCategoryId);
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
      if (["ar-SA", "ur-PK"].includes(seedLang) && !/[\u0600-\u06FF]/.test(patch.label) && /[a-zA-Z]/.test(patch.label)) {
        const sync = wordLabel(patch.label, seedLang);
        if (sync && sync.toLowerCase() !== patch.label.toLowerCase()) {
          patch.label = sync;
          patch.phrase = sync;
        } else {
          const orig = patch.label;
          translateDynamic(orig, seedLang).then((t) => {
            if (t && t !== orig) {
              mutate(targetCatId, (c) => {
                const targetW = c.words.find((x) => x.id === wordId);
                if (targetW) {
                  targetW.label = t;
                  targetW.phrase = t;
                }
              });
            }
          });
        }
      }
    }

    const oldBase = (w.verbForms?.base || "").trim().toLowerCase();
    const oldEnLabel = (canonicalWordEn(w.label) || w.label).trim().toLowerCase();
    const oldVForms = w.verbForms || generateAllVerbForms(oldEnLabel);

    Object.assign(w, patch);
    w.isCustom = true;

    const newEnLabel = (canonicalWordEn(w.label) || w.label).trim().toLowerCase();
    w.seedLabel = newEnLabel;
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
        sFormOf(activeVf.base).toLowerCase(),
      ]);
      if (oldVForms) {
        targetForms.add(sFormOf(oldVForms.base).toLowerCase());
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
            if (sib.verbFormTag === "s") {
              const loc = capWord(wordLabel(sFormOf(newVForms.base), seedLang) || sFormOf(newVForms.base));
              sib.label = loc;
              sib.phrase = loc;
            } else if (sib.verbFormTag === "2nd") {
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

export const NATURAL_ORDER_SUBCATEGORIES = new Set([
  "arabic alphabets",
  "arabic numerals",
  "urdu alphabets",
  "urdu numerals",
  "english alphabets uppercase",
  "english alphabets lowercase",
  "numerals",
  "french alphabets",
  "french numerals",
  "spanish alphabets",
  "spanish numerals",
  "german alphabets",
  "german numerals",
  "days",
  "dates",
  "months",
]);

export function isNaturalOrderCategory(catName: string): boolean {
  const en = (FOLDER_EN_BY_LANG[(catName || "").trim().toLowerCase()] || canonicalWordEn(catName) || catName).trim().toLowerCase();
  return NATURAL_ORDER_SUBCATEGORIES.has(en);
}

/**
 * Universal category word sorter:
 * Natural-sequence categories (Days, Months, Dates, Alphabets, Numerals) preserve their real-life sequence.
 * Non-verb categories are sorted alphabetically.
 * Verb categories (Verbs A-Z and Action shelves) are strictly sorted by:
 * Base Verb (A to Z) -> 1st Form -> 2nd Form -> 3rd Form -> 4th Form.
 */
export function sortWordsForCategory(words: CustomWord[], catName: string): CustomWord[] {
  const enCat = (FOLDER_EN_BY_LANG[(catName || "").trim().toLowerCase()] || canonicalWordEn(catName) || catName).trim().toLowerCase();
  if (NATURAL_ORDER_SUBCATEGORIES.has(enCat)) {
    const seedSub = STARTER_SUBCATEGORIES.find((s) => s.name.trim().toLowerCase() === enCat);
    if (seedSub) {
      const idxMap = new Map<string, number>();
      seedSub.words.forEach(([w], i) => idxMap.set(w.trim().toLowerCase(), i));
      return [...words].sort((a, b) => {
        const ka = (a.seedLabel || a.label || "").trim().toLowerCase();
        const kb = (b.seedLabel || b.label || "").trim().toLowerCase();
        const ia = idxMap.get(ka) ?? idxMap.get((canonicalWordEn(a.label) || a.label).trim().toLowerCase()) ?? 9999 + (a.order ?? 0);
        const ib = idxMap.get(kb) ?? idxMap.get((canonicalWordEn(b.label) || b.label).trim().toLowerCase()) ?? 9999 + (b.order ?? 0);
        return ia - ib;
      });
    }
    return [...words].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

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
    if (w.verbFormTag === "s") return 1.5;
    if (vf && lbl === vf.base.toLowerCase()) return 1;
    if (vf && lbl === sFormOf(vf.base).toLowerCase()) return 1.5;
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
      // its sub-categories move along, they must not be left without a parent
      cache.forEach((ch) => {
        if (ch.parentCategoryId === dup.id) ch.parentCategoryId = primary.id;
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
        // "School" merged into "Schools": its sub-categories (e.g. "Class") move along instead of being lost
        cache.forEach((ch) => {
          if (ch.parentCategoryId === c.id) ch.parentCategoryId = existing.id;
        });
      }
      changed = true;
    } else {
      seenCatNames.add(key);
      uniqueCats.push(c);
    }
  }
  cache = uniqueCats;

  // Sub-categories whose shelf vanished in an older merge (not deleted by the caregiver) were
  // invisible: bring them back as shelves so their words show again
  const liveIds = new Set(cache.map((c) => c.id));
  for (const c of cache) {
    if (c.parentCategoryId && !liveIds.has(c.parentCategoryId) && !deletedItemKeys.has(`cat::id::${c.parentCategoryId}`)) {
      c.parentCategoryId = null;
      changed = true;
    }
  }

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
      // the English word (two English words can share one Arabic word: crocodile / alligator)
      const en = /[؀-ۿ]/.test(w.label) && w.seedLabel ? w.seedLabel : canonicalWordEn(w.label) || w.label;
      const key = `${tagPrefix}${en.trim().toLowerCase()}`;
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
          verbSubLetter(c) === letter.toLowerCase()
      );
      if (subCat) {
        const list = [...rawList].sort((a, b) => a.base.localeCompare(b.base, undefined, { sensitivity: "base" }));
        const standardVerbWords = new Set<string>();
        list.forEach((v) => {
          standardVerbWords.add(v.base.toLowerCase().trim());
          standardVerbWords.add(sFormOf(v.base).toLowerCase().trim());
          standardVerbWords.add(v.past.toLowerCase().trim());
          standardVerbWords.add(v.participle.toLowerCase().trim());
          standardVerbWords.add(v.continuous.toLowerCase().trim());
        });

        // PECS verbs without forms that belong in this folder ("high five" in Verbs H)
        const plainVerbs = [...PECS_PLAIN_VERBS].filter(([, l]) => l === letter).map(([p]) => p);
        const isPlain = (w: CustomWord) => plainVerbs.includes((canonicalWordEn(w.label) || w.label).toLowerCase().trim());
        const customWords = subCat.words.filter((w) => {
          if (isPlain(w) && !w.verbFormTag) return false;
          // an old spelling of a built-in verb's form ("Bended") — the loop above makes the right one ("Bent")
          if (!w.isCustom && w.verbFormTag && w.verbForms && list.some((v) => v.base === w.verbForms!.base)) return false;
          if (w.isCustom) return true;
          const en = (canonicalWordEn(w.label) || w.label).toLowerCase().trim();
          return !standardVerbWords.has(en) && !standardVerbWords.has(w.label.toLowerCase().trim());
        });

        const usedExistingIds = new Set<string>();
        let cleanWords: CustomWord[] = [];
        let orderIndex = 0;

        list.forEach((v) => {
          const forms: { word: string; tag: "1st" | "s" | "2nd" | "3rd" | "4th" }[] = [
            { word: v.base, tag: "1st" },
            { word: sFormOf(v.base), tag: "s" },
            { word: v.past, tag: "2nd" },
            { word: v.participle, tag: "3rd" },
            { word: v.continuous, tag: "4th" },
          ];

          const baseImg = getPictogramUrl(v.base) || undefined;

          forms.forEach((f) => {
            if (isDeletedWord(subCat.id, f.word, f.tag)) return; // deleted by caregiver
            let existing = preferCustomized(subCat.words.filter((w) => {
              if (usedExistingIds.has(w.id)) return false;
              const en = (w.seedLabel || canonicalWordEn(w.label) || w.label).toLowerCase().trim();
              const isMatch = en === f.word.toLowerCase() || w.label.toLowerCase().trim() === f.word.toLowerCase();
              return isMatch && w.verbFormTag === f.tag;
            }));
            if (!existing) {
              existing = subCat.words.find((w) => {
                if (usedExistingIds.has(w.id)) return false;
                const en = (w.seedLabel || canonicalWordEn(w.label) || w.label).toLowerCase().trim();
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
              imageUri: (existing?.isCustom ? existing.imageUri : undefined) || baseImg,
              audioUri: existing?.audioUri,
              useTextToSpeech: existing?.useTextToSpeech ?? true,
              size: "md",
              order: orderIndex++,
              verbFormTag: f.tag,
              seedLabel: capWord(f.word),
              // which verb it is, so all its forms make one box on the Talk board (also "brush teeth")
              verbForms: { base: v.base, past: v.past, participle: v.participle, continuous: v.continuous, emoji: v.emoji },
              hidden: existing?.hidden ?? false,
              isCustom: existing?.isCustom,
            });
          });
        });

        plainVerbs.forEach((p) => {
          if (isDeletedWord(subCat.id, p)) return;
          const existing = subCat.words.find((w) => !w.verbFormTag && !usedExistingIds.has(w.id) && (canonicalWordEn(w.label) || w.label).toLowerCase().trim() === p);
          if (existing) usedExistingIds.add(existing.id);
          const capText = capFirst(wordLabel(capFirst(p), seedLang) || p);
          cleanWords.push({
            id: existing?.id ?? uid("w"),
            label: capText,
            phrase: capText,
            emoji: existing?.emoji || wordEmoji(p) || "⚡",
            imageUri: existing?.imageUri || getPictogramUrl(p) || undefined,
            audioUri: existing?.audioUri,
            useTextToSpeech: existing?.useTextToSpeech ?? true,
            size: "md",
            order: orderIndex++,
            hidden: existing?.hidden ?? false,
            isCustom: existing?.isCustom,
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

            const forms: { word: string; tag: "1st" | "s" | "2nd" | "3rd" | "4th" }[] = [
              { word: v.base, tag: "1st" },
              { word: sFormOf(v.base), tag: "s" },
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
                verbForms: { base: v.base, past: v.past, participle: v.participle, continuous: v.continuous, emoji: v.emoji },
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
              w.order !== cleanWords[i]?.order ||
              (!w.verbForms && !!w.verbFormTag)
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
      if (!isDeletedWord(coreCat.id, wLabel) && !coreCat.words.some((w) => [w.label, w.seedLabel, canonicalWordEn(w.label)].some((l) => (l || "").toLowerCase() === wLabel.toLowerCase()))) {
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
    const isSeedWithDirectWords =
      STARTER.some((s) => s.words.length > 0 && s.name.toLowerCase() === folderEnglishName(c).toLowerCase()) ||
      STARTER_SUBCATEGORIES.some((s) => s.words.length > 0 && s.name.toLowerCase() === (c.seedName || folderEnglishName(c)).toLowerCase());
    if (parentIdsWithSubCats.has(c.id) && c.words.length > 0 && !isSeedWithDirectWords) {
      // Find subcategories belonging to this parent
      const subCatsOfParent = cache.filter((sc) => sc.parentCategoryId === c.id);
      let generalSub: CustomCategory | undefined;
      const getGeneralSub = (): CustomCategory => {
        if (generalSub) return generalSub;
        const nameOf = (sc: CustomCategory) => (canonicalWordEn(sc.name) || sc.name).trim().toLowerCase();
        // "General", or the first part of a split one ("General A–F")
        generalSub = subCatsOfParent.find((sc) => nameOf(sc) === "general") ?? subCatsOfParent.find((sc) => nameOf(sc).startsWith("general "));
        if (!generalSub) {
          const now = Date.now();
          generalSub = {
            id: uid("cat"),
            name: folderName("General", seedLang) || "General",
            createdAt: now,
            updatedAt: now,
            source: "manual",
            grouping: "none",
            color: c.color ?? FOLDER_COLORS[0],
            icon: c.icon ?? "📁",
            imageUri: c.imageUri,
            parentCategoryId: c.id,
            order: subCatsOfParent.length,
            words: [],
          };
          cache.push(generalSub);
        }
        return generalSub;
      };
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
            } else {
              // Any other shelf: its own words go to a "General" sub-category, not into the
              // sub-category the caregiver just made (a new "Class" must not fill up with "Recess", "Slide"...)
              targetSub = getGeneralSub();
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
  // Natural-order categories (Days, Months, Dates, Alphabets, Numerals) preserve their real-life sequence.
  // Regular categories are sorted alphabetically. Verb categories are strictly sorted:
  // Base Verb (alphabetical) -> 1st Form -> 2nd Form -> 3rd Form -> 4th Form.
  for (const c of cache) {
    const enName = (FOLDER_EN_BY_LANG[c.name.toLowerCase()] ?? c.name).toLowerCase();
    if (enName !== "core" && enName !== "say it for me") {
      c.words = sortWordsForCategory(c.words, c.seedName || c.name);
      c.words.forEach((w, i) => { w.order = i; });
    }
  }

  // 3. Preserve the client's Word file order for sub-categories under any shelf:
  const subOrderMap = new Map<string, number>();
  STARTER_SUBCATEGORIES.forEach((s, i) => {
    subOrderMap.set(`${s.parentCategory.toLowerCase()}::${s.name.toLowerCase()}`, i);
  });
  const subCats = cache.filter((c) => !!c.parentCategoryId);
  const byParent: Record<string, CustomCategory[]> = {};
  for (const sc of subCats) {
    const p = sc.parentCategoryId!;
    if (!byParent[p]) byParent[p] = [];
    byParent[p].push(sc);
  }
  for (const p in byParent) {
    const parentCat = cache.find((c) => c.id === p);
    const pRaw = parentCat ? (parentCat.seedName || folderEnglishName(parentCat)) : "";
    const pEn = pRaw === "Verbs" ? "actions" : pRaw.toLowerCase();
    byParent[p].sort((a, b) => {
      const aEn = (a.seedName || folderEnglishName(a)).toLowerCase();
      const bEn = (b.seedName || folderEnglishName(b)).toLowerCase();
      const ia = subOrderMap.get(`${pEn}::${aEn}`);
      const ib = subOrderMap.get(`${pEn}::${bEn}`);
      if (ia !== undefined && ib !== undefined) return ia - ib;
      if (ia !== undefined) return -1;
      if (ib !== undefined) return 1;
      return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
    });
    byParent[p].forEach((sc, i) => { sc.order = i; });
  }

  // Ensure top shelves appear alphabetically (with Core first if present)
  const topShelves = cache.filter((c) => !c.parentCategoryId);
  topShelves.sort((a, b) => {
    const aIsCore = (canonicalWordEn(a.name) || a.name).toLowerCase() === "core";
    const bIsCore = (canonicalWordEn(b.name) || b.name).toLowerCase() === "core";
    if (aIsCore && !bIsCore) return -1;
    if (!aIsCore && bIsCore) return 1;
    return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
  });
  topShelves.forEach((c, idx) => {
    if (c.order !== idx) {
      c.order = idx;
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
      const forms: { word: string; enWord: string; tag: "1st" | "s" | "2nd" | "3rd" | "4th" }[] = [
        { word: capWord(wordLabel(vForms.base, seedLang) || vForms.base), enWord: vForms.base, tag: "1st" },
        { word: capWord(wordLabel(sFormOf(vForms.base), seedLang) || sFormOf(vForms.base)), enWord: sFormOf(vForms.base), tag: "s" },
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
      if (c.wordSortOrder !== "as-spoken") {
        c.words = sortWordsForCategory(c.words, c.name);
      }
      c.words.forEach((w, i) => { w.order = i; });
    } else if (!mergeIntoExistingWord(c, { ...word, label: cleanLabel })) {
      c.words.push({
        id: uid("w"),
        label: cleanLabel,
        phrase: cleanPhrase,
        emoji: word.emoji || "🔹",
        imageUri: word.imageUri || getPictogramUrl(enWord) || getPictogramUrl(cleanLabel) || undefined,
        color: word.color,
        audioUri: word.audioUri,
        useTextToSpeech: word.useTextToSpeech ?? !word.audioUri,
        size: word.size ?? "md",
        order: c.words.length,
        useCount: 0,
        verbForms: word.verbForms,
        verbFormTag: word.verbFormTag,
        isCustom: true,
        seedLabel: enWord,
      });
      if (c.wordSortOrder !== "as-spoken") {
        c.words = sortWordsForCategory(c.words, c.name);
      }
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
      const enWord = (canonicalWordEn(word.label) || word.label).trim();
      c.words.push({
        id: uid("w"),
        label: cleanLabel,
        phrase: (word.phrase ?? cleanLabel).trim() || cleanLabel,
        emoji: word.emoji || "🔹",
        imageUri: word.imageUri || getPictogramUrl(enWord) || getPictogramUrl(cleanLabel) || undefined,
        color: word.color,
        audioUri: word.audioUri,
        useTextToSpeech: word.useTextToSpeech ?? !word.audioUri,
        size: word.size ?? "md",
        order: c.words.length,
        useCount: 0,
        verbForms: word.verbForms,
        verbFormTag: word.verbFormTag,
        isCustom: true,
        seedLabel: enWord,
      });
    });
    if (c.wordSortOrder !== "as-spoken") {
      c.words = sortWordsForCategory(c.words, c.name);
    }
    c.words.forEach((w, i) => { w.order = i; });
    // Bulk-added verbs inside "Verbs X" are moved to their own letter folders
    if (verbSubLetter(c)) enforceVerbLetterBuckets();
  });
}

/** Set word sorting preference for a category ('alphabetical' or 'as-spoken') */
export function setCategoryWordOrder(catId: string, orderMode: "alphabetical" | "as-spoken") {
  return mutate(catId, (c) => {
    c.wordSortOrder = orderMode;
    if (orderMode === "alphabetical") {
      c.words = sortWordsForCategory(c.words, c.name);
    } else {
      c.words = [...c.words].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    c.words.forEach((w, i) => {
      w.order = i;
    });
  });
}

// --- board helpers (folders) -------------------------------------------

function byOrder(a: CustomCategory, b: CustomCategory) {
  return (a.order ?? 0) - (b.order ?? 0);
}

export function topLevelCategories(): CustomCategory[] {
  return cache
    .filter((c) => !c.parentCategoryId && !!c.name && c.name.trim().length > 0)
    .sort((a, b) => {
      const aIsCore = (canonicalWordEn(a.name) || a.name).toLowerCase() === "core";
      const bIsCore = (canonicalWordEn(b.name) || b.name).toLowerCase() === "core";
      if (aIsCore && !bIsCore) return -1;
      if (!aIsCore && bIsCore) return 1;
      return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
    });
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
  let cleanName = input.name.trim() || "New Category";

  if (["ar-SA", "ur-PK"].includes(seedLang) && !/[\u0600-\u06FF]/.test(cleanName) && /[a-zA-Z]/.test(cleanName)) {
    const sync = folderName(cleanName, seedLang) || wordLabel(cleanName, seedLang);
    if (sync && sync.toLowerCase() !== cleanName.toLowerCase()) {
      cleanName = sync;
    }
  }

  const siblings = cache.filter((c) => (c.parentCategoryId ?? null) === (input.parentCategoryId ?? null));
  const cat: CustomCategory = {
    id: uid("cat"),
    name: cleanName,
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
  unblockDeletedCategory(cat.name, cat.parentCategoryId);
  cache = [...cache, cat];
  persist();

  if (["ar-SA", "ur-PK"].includes(seedLang) && !/[\u0600-\u06FF]/.test(cat.name) && /[a-zA-Z]/.test(cat.name)) {
    const orig = cat.name;
    translateDynamic(orig, seedLang).then((t) => {
      if (t && t !== orig) {
        mutate(cat.id, (c) => {
          c.name = t;
        });
      }
    });
  }

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
  const pendingAsyncCats: { id: string; orig: string }[] = [];

  for (const input of categories) {
    let name = input.name.trim();
    if (!name) continue;

    if (["ar-SA", "ur-PK"].includes(seedLang) && !/[\u0600-\u06FF]/.test(name) && /[a-zA-Z]/.test(name)) {
      const sync = folderName(name, seedLang) || wordLabel(name, seedLang);
      if (sync && sync.toLowerCase() !== name.toLowerCase()) {
        name = sync;
      }
    }

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
    unblockDeletedCategory(name, parentId);
    cache.push(cat);
    createdList.push(cat);

    if (["ar-SA", "ur-PK"].includes(seedLang) && !/[\u0600-\u06FF]/.test(name) && /[a-zA-Z]/.test(name)) {
      pendingAsyncCats.push({ id: cat.id, orig: name });
    }
  }

  if (createdList.length > 0) {
    cache = [...cache];
    persist();
  }

  if (pendingAsyncCats.length > 0) {
    (async () => {
      for (const item of pendingAsyncCats) {
        const t = await translateDynamic(item.orig, seedLang);
        if (t && t !== item.orig) {
          mutate(item.id, (c) => {
            c.name = t;
          });
        }
      }
    })();
  }

  return createdList;
}

export function updateCategoryMeta(id: string, patch: Partial<Pick<CustomCategory, "name" | "color" | "icon" | "imageUri">>) {
  if (patch.name) unblockDeletedCategory(patch.name, cache.find((c) => c.id === id)?.parentCategoryId);
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
  { key: "Actions", icon: "⚡", label: "Verbs", enFallback: "Actions", color: "#c98a3d" },
  { key: "Color", icon: "🎨", label: "Color", enFallback: "Red", color: "#d9534f" },
  { key: "Feelings", icon: "😊", label: "Feelings", enFallback: "Feelings", color: "#e67e22" },
  { key: "Food", icon: "🍴", label: "Food", enFallback: "Food", color: "#5c9a58" },
  { key: "Hygiene", icon: "🛁", label: "Hygiene", enFallback: "Hygiene", color: "#8a6bc9" },
  { key: "Music", icon: "🎸", label: "Music", enFallback: "Music", color: "#d46cae" },
  { key: "People", icon: "♡", label: "People", enFallback: "People", color: "#c96b6b" },
  { key: "Places", icon: "🏛️", label: "Places", enFallback: "Places", color: "#4a7fe6" },
  { key: "Red", icon: "🎨", label: "Red", enFallback: "Red", color: "#d9534f" },
  { key: "Say It For Me", icon: "🗨️", label: "Say It For Me", enFallback: "Say It For Me", color: "#d9534f" },
  { key: "Schools", icon: "🏫", label: "Schools", enFallback: "Schools", color: "#2f6d62" },
  { key: "Sports", icon: "⚽", label: "Sports", enFallback: "Sports", color: "#c96b6b" },
  { key: "Subjects", icon: "📚", label: "Subjects", enFallback: "Subjects", color: "#2f6d62" },
  { key: "Things", icon: "✨", label: "Things", enFallback: "Things", color: "#8a6bc9" },
];

export function bottomTabCategories(lang?: LanguageCode): { id: string; name: string; icon: string; color: string }[] {
  const activeLang = lang || seedLang;
  const top = visibleTopLevelCategories();
  const out: { id: string; name: string; icon: string; color: string }[] = [];

  // Match known categories first ONLY if they exist and are not deleted or hidden
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
    if (hit && !hit.hidden && !out.some((x) => x.id === hit.id)) {
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

  // Sort alphabetical A-Z by display name (keeping Core first if present)
  out.sort((a, b) => {
    const aIsCore = (canonicalWordEn(a.name) || a.name).toLowerCase() === "core";
    const bIsCore = (canonicalWordEn(b.name) || b.name).toLowerCase() === "core";
    if (aIsCore && !bIsCore) return -1;
    if (!aIsCore && bIsCore) return 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

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
    return { ok: false, restoredCategories: 0, restoredWords: 0, restoredImages: 0, issues: ["File is not a valid Angel Talk backup."] };
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
