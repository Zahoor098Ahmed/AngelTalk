import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CustomCategory, CustomWord, TileSize, LanguageCode } from "../types";
import { starterLabel, wordLabel } from "./i18n";
import { getPictogramUrl } from "./aacPictograms";
import { VERB_FORMS_LIST } from "./verbForms";

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

export function isDeletedWord(catId: string, label: string): boolean {
  const norm = (label || "").trim().toLowerCase();
  if (deletedItemKeys.has(`word::${catId}::${norm}`)) return true;
  if (deletedItemKeys.has(`word::label::${norm}`)) return true;
  return false;
}

/** Bring older records up to the current shape without recreating anything. */
function migrate(list: CustomCategory[]): CustomCategory[] {
  const parentsWithChildren = new Set(
    list.filter((x) => !!x.parentCategoryId).map((x) => x.parentCategoryId!)
  );

  return list.map((c, i) => {
    const hasChildren = parentsWithChildren.has(c.id);
    return {
      ...c,
      color: c.color ?? FOLDER_COLORS[i % FOLDER_COLORS.length],
      icon: c.icon ?? "📁",
      hidden: c.hidden ?? false,
      parentCategoryId: c.parentCategoryId ?? null,
      order: typeof c.order === "number" ? c.order : i,
      source: c.source ?? "manual",
      words: hasChildren
        ? []
        : (c.words ?? []).map((w, wi) => ({
            ...w,
            imageUri: w.imageUri || getPictogramUrl(w.label) || undefined,
            size: w.size ?? "md",
            useTextToSpeech: w.useTextToSpeech ?? !w.audioUri,
            order: typeof w.order === "number" ? w.order : wi,
            hidden: w.hidden ?? false,
            useCount: w.useCount ?? 0,
            lastUsedAt: w.lastUsedAt,
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
    const en = enWords[i];
    const correctUri = en ? getPictogramUrl(en) : null;
    if (correctUri && w.imageUri !== correctUri) {
      w.imageUri = correctUri;
      changed = true;
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
  Y: [
    { base: "yawn", past: "yawned", participle: "yawned", continuous: "yawning", emoji: "🥱" },
    { base: "yell", past: "yelled", participle: "yelled", continuous: "yelling", emoji: "📢" },
  ],
  Z: [
    { base: "zip", past: "zipped", participle: "zipped", continuous: "zipping", emoji: "🤐" },
    { base: "zoom", past: "zoomed", participle: "zoomed", continuous: "zooming", emoji: "🏎️" },
  ],
};

// Generates alphabetical Actions subcategories where every verb appears strictly in 1st -> 2nd -> 3rd -> 4th order
const ACTION_VERB_SUBCATEGORIES = Object.entries(VERBS_A_TO_Z).map(([letter, list]) => {
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
    Schools: "مدرسة", Sentences: "جمل", Tools: "أدوات", Emotion: "مشاعر", Attributes: "صفات",
    Sports: "رياضة", Hygiene: "نظافة", Music: "موسيقى", "Say It For Me": "قلها لي",
    "My Words": "كلماتي", "New Folder": "مجلد جديد",
    Animals: "حيوانات", Fruits: "فواكه", Vegetables: "خضروات", Colors: "ألوان", Shapes: "أشكال",
    Vehicles: "مركبات", "Body Parts": "أجزاء الجسم", Clothes: "ملابس", Weather: "الطقس", Family: "العائلة",
    Jobs: "وظائف", Instruments: "آلات موسيقية", "School Supplies": "أدوات مدرسية",
    Furniture: "أثاث", Feelings2: "مشاعر", "Days of the Week": "أيام الأسبوع", Months: "الشهور", Numbers: "أرقام", Letters: "حروف",
  },
  "ur-PK": {
    Core: "بنیادی", Food: "کھانا", Feelings: "احساسات", People: "لوگ", Actions: "کام",
    Places: "مقامات", Things: "چیزیں", Red: "لال",
    Schools: "اسکول", Sentences: "جملے", Tools: "اوزار", Emotion: "جذبات", Attributes: "خصوصیات",
    Sports: "کھیل", Hygiene: "صفائی", Music: "موسیقی", "Say It For Me": "میرے لیے کہو",
    "My Words": "میرے الفاظ", "New Folder": "نیا فولڈر",
    Animals: "جانور", Fruits: "پھل", Vegetables: "سبزیاں", Colors: "رنگ", Shapes: "شکلیں",
    Vehicles: "گاڑیاں", "Body Parts": "جسم کے حصے", Clothes: "کپڑے", Weather: "موسم", Family: "خاندان",
    Jobs: "پیشے", "School Supplies": "اسکول کا سامان", "Days of the Week": "ہفتے کے دن", Months: "مہینے",
  },
};
function folderName(en: string) {
  return FOLDER_NAMES[seedLang]?.[en] ?? en;
}

// reverse map: any localised folder name → its English anchor
const FOLDER_EN_BY_LANG: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const lang of Object.keys(FOLDER_NAMES) as LanguageCode[]) {
    for (const [en, local] of Object.entries(FOLDER_NAMES[lang] ?? {})) m[local.toLowerCase()] = en;
  }
  for (const en of Object.keys(FOLDER_NAMES["ar-SA"] ?? {})) m[en.toLowerCase()] = en;
  return m;
})();

/**
 * Re-translate the built-in vocabulary (starter board + bulk-generated
 * categories, PLUS the individual words inside any user-created category)
 * into the given language. Words come from a fixed dictionary, so a
 * caregiver's own genuinely custom word (not in the dictionary) is left
 * untouched — only text that matches a known AAC word/phrase translates.
 * Call this whenever the language changes.
 */
export function retranslateSeedBoard(lang: LanguageCode) {
  let changed = false;
  for (const cat of cache) {
    const isSeedFamily = ["seed", "generated", "list", "voice"].includes(cat.source);

    // folder name — only rename folders we generated ourselves; a caregiver's
    // own custom folder name (e.g. "Zahoor's Favorites") is left alone.
    if (isSeedFamily) {
      const enName = FOLDER_EN_BY_LANG[cat.name.toLowerCase()] ?? cat.name;
      const newName = FOLDER_NAMES[lang]?.[enName] ?? (lang === "en-US" ? enName : cat.name);
      if (newName !== cat.name) {
        cat.name = newName;
        changed = true;
      }
    }

    // words — always attempt translation. Seed folders map by position for
    // perfect accuracy; any other category (including a "manual" folder
    // built via quick-start templates, pasted lists, or voice-add) falls
    // back to dictionary lookup, which is a safe no-op for genuinely
    // custom text that isn't recognized AAC vocabulary.
    const enName2 = isSeedFamily ? (FOLDER_EN_BY_LANG[cat.name.toLowerCase()] ?? cat.name) : null;
    const enWords = enName2 ? SEED_WORD_EN[enName2] : undefined;
    cat.words.forEach((w, i) => {
      const en = enWords?.find((e) => e.toLowerCase() === w.label.toLowerCase()) ?? enWords?.[i];
      const localized = en ? starterLabel(en, lang) : wordLabel(w.label, lang);
      if (localized && localized !== w.label) {
        w.label = localized;
        w.phrase = localized;
        changed = true;
      }
    });
  }
  if (changed) {
    cache = [...cache];
    persist();
  }
}

function ensureAllStandardCategories() {
  let changed = false;
  const existingMap = new Map(cache.map((c) => [c.name.toLowerCase(), c]));
  const now = Date.now();

  STARTER.forEach((s, idx) => {
    if (isDeletedCategory(s.name)) return;
    const sName = s.name.toLowerCase();
    const localizedName = folderName(s.name).toLowerCase();
    const hit = existingMap.get(sName) || existingMap.get(localizedName);
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
        c.name.toLowerCase() === sub.name.toLowerCase()
    );

    if (!subCat) {
      subCat = {
        id: uid("cat"),
        name: sub.name,
        createdAt: now,
        updatedAt: now,
        source: "seed",
        grouping: "none",
        color: parent.color,
        icon: sub.icon,
        parentCategoryId: parent.id,
        order: subIdx,
        words: [],
      };
      cache.push(subCat);
      changed = true;
    }

    // Populate and synchronize words for this sub-category in strict sequential order
    const targetWords = sub.words
      .filter(([label]) => !isDeletedWord(subCat!.id, label))
      .map(([label, emoji, verbFormTag], wi) => {
        const existing = subCat!.words.find(
          (w) => w.label.toLowerCase() === label.toLowerCase()
        );
        const localized = starterLabel(label, seedLang) || label;
        return {
          id: existing?.id ?? uid("w"),
          label: localized,
          phrase: localized,
          emoji: emoji || existing?.emoji || "🔹",
          imageUri: existing?.imageUri || getPictogramUrl(label) || undefined,
          color: existing?.color,
          audioUri: existing?.audioUri,
          useTextToSpeech: existing?.useTextToSpeech ?? true,
          size: existing?.size ?? "md",
          order: wi,
          useCount: existing?.useCount ?? 0,
          verbFormTag: verbFormTag ?? existing?.verbFormTag,
          hidden: existing?.hidden ?? false,
        };
      });

    // Preserve any custom words the parent added to this category
    const customParentWords = subCat.words.filter(
      (w) => !sub.words.some(([swLabel]) => swLabel.toLowerCase() === w.label.toLowerCase())
    );
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
  AsyncStorage.setItem(KEY, JSON.stringify(cache)).catch(() => {});
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
    }
    if (patch.icon !== undefined) c.icon = patch.icon;
    if (patch.color !== undefined) c.color = patch.color;
    if (patch.imageUri !== undefined) c.imageUri = patch.imageUri;
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
  patch: Partial<Pick<CustomWord, "label" | "phrase" | "emoji" | "imageUri" | "audioUri" | "useTextToSpeech" | "size" | "color" | "hidden">>,
) {
  return mutate(catId, (c) => {
    const w = c.words.find((x) => x.id === wordId);
    if (w) Object.assign(w, patch);
  });
}

export function removeWord(catId: string, wordId: string) {
  return mutate(catId, (c) => {
    const targetWord = c.words.find((w) => w.id === wordId);
    if (targetWord) {
      const normLabel = (targetWord.label || "").trim().toLowerCase();
      deletedItemKeys.add(`word::${catId}::${normLabel}`);
      deletedItemKeys.add(`word::id::${targetWord.id}`);
      persistDeletedKeys();
    }
    c.words = c.words.filter((w) => w.id !== wordId).map((w, i) => ({ ...w, order: i }));
  });
}


export function cleanAndDeduplicateCategories() {
  let changed = false;

  // Merge legacy "Emotion" into "Feelings" if both exist
  const feelingsCat = cache.find((c) => c.name.toLowerCase() === "feelings" || c.name.toLowerCase() === "احساسات");
  const emotionCat = cache.find((c) => c.name.toLowerCase() === "emotion" || c.name.toLowerCase() === "جذبات");
  if (feelingsCat && emotionCat && feelingsCat.id !== emotionCat.id) {
    emotionCat.words.forEach((w) => {
      if (!feelingsCat.words.some((fw) => fw.label.toLowerCase() === w.label.toLowerCase())) {
        feelingsCat.words.push(w);
      }
    });
    cache = cache.filter((c) => c.id !== emotionCat.id);
    changed = true;
  }

  // Deduplicate categories by name, scoped to their parent (so sub-categories are not merged into root shelves)
  const seenCatNames = new Set<string>();
  const uniqueCats: CustomCategory[] = [];
  for (const c of cache) {
    const parentKey = c.parentCategoryId ? c.parentCategoryId : "root";
    const key = `${parentKey}::${(c.name || "").trim().toLowerCase()}`;
    if (!key) continue;
    if (seenCatNames.has(key)) {
      const existing = uniqueCats.find((ec) => {
        const ecParentKey = ec.parentCategoryId ? ec.parentCategoryId : "root";
        return `${ecParentKey}::${ec.name.trim().toLowerCase()}` === key;
      });
      if (existing) {
        c.words.forEach((w) => {
          if (!existing.words.some((ew) => ew.label.toLowerCase() === w.label.toLowerCase())) {
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

  // Deduplicate words in each category
  for (const c of cache) {
    const seenWords = new Set<string>();
    const uniqueWords: CustomWord[] = [];
    for (const w of c.words) {
      const key = (w.label || "").trim().toLowerCase();
      if (!key) continue;
      if (!seenWords.has(key)) {
        seenWords.add(key);
        uniqueWords.push(w);
      } else {
        changed = true;
      }
    }
    if (uniqueWords.length !== c.words.length) {
      c.words = uniqueWords.map((w, i) => ({ ...w, order: i }));
      changed = true;
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
      if (!coreCat.words.some((w) => w.label.toLowerCase() === wLabel.toLowerCase())) {
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
          const wLower = (w.label || "").trim().toLowerCase();
          const alreadyInSub = subCatsOfParent.some((sc) =>
            sc.words.some((sw) => (sw.label || "").trim().toLowerCase() === wLower)
          );
          if (!alreadyInSub) {
            let targetSub = subCatsOfParent[0];
            const pName = (c.name || "").toLowerCase();
            if (pName.includes("people") || pName.includes("لوگ") || pName.includes("أشخاص")) {
              if (["mom", "dad", "brother", "sister", "baby", "grandma", "grandpa", "aunt", "uncle", "cousin", "pet"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => sc.name.toLowerCase().includes("family")) || targetSub;
              } else if (["teacher", "friend", "classmate", "principal", "aide", "student", "me", "you"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => sc.name.toLowerCase().includes("friend") || sc.name.toLowerCase().includes("school")) || targetSub;
              } else {
                targetSub = subCatsOfParent.find((sc) => sc.name.toLowerCase().includes("helper") || sc.name.toLowerCase().includes("therapist")) || targetSub;
              }
            } else if (pName.includes("food") || pName.includes("کھانا") || pName.includes("طعام")) {
              if (["water", "milk", "juice", "tea", "coffee", "soda", "smoothie", "lemonade", "drink"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => sc.name.toLowerCase().includes("drink")) || targetSub;
              } else if (["pizza", "burger", "fries", "taco", "nuggets", "hot dog"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => sc.name.toLowerCase().includes("fast")) || targetSub;
              } else if (["apple", "banana", "orange", "berry", "grape", "melon", "peach", "fruit"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => sc.name.toLowerCase().includes("fruit")) || targetSub;
              } else if (["carrot", "broccoli", "corn", "potato", "cucumber", "tomato", "veg", "peas", "lettuce"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => sc.name.toLowerCase().includes("veg")) || targetSub;
              } else if (["cookie", "ice cream", "cake", "donut", "candy", "chocolate", "chips", "snack", "sweet"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => sc.name.toLowerCase().includes("snack") || sc.name.toLowerCase().includes("sweet")) || targetSub;
              } else {
                targetSub = subCatsOfParent.find((sc) => sc.name.toLowerCase().includes("meal") || sc.name.toLowerCase().includes("breakfast")) || targetSub;
              }
            } else if (pName.includes("place") || pName.includes("مقام") || pName.includes("أماكن")) {
              if (["home", "bedroom", "kitchen", "bed", "couch", "bathroom", "house", "backyard"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => sc.name.toLowerCase().includes("home")) || targetSub;
              } else if (["school", "playground", "park", "library", "gym", "class", "pool", "beach", "zoo"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => sc.name.toLowerCase().includes("school") || sc.name.toLowerCase().includes("community")) || targetSub;
              } else {
                targetSub = subCatsOfParent.find((sc) => sc.name.toLowerCase().includes("errand") || sc.name.toLowerCase().includes("health")) || targetSub;
              }
            } else if (pName.includes("thing") || pName.includes("چیز") || pName.includes("أشياء")) {
              if (["toy", "ball", "doll", "blocks", "puzzle", "car", "train", "game", "bubbles"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => sc.name.toLowerCase().includes("toy") || sc.name.toLowerCase().includes("play")) || targetSub;
              } else if (["book", "tablet", "phone", "backpack", "paper", "pencil", "tech"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => sc.name.toLowerCase().includes("school") || sc.name.toLowerCase().includes("tech")) || targetSub;
              } else if (["shirt", "pants", "shoes", "socks", "jacket", "hat", "clothes", "blanket"].some((k) => wLower.includes(k))) {
                targetSub = subCatsOfParent.find((sc) => sc.name.toLowerCase().includes("clothe")) || targetSub;
              } else {
                targetSub = subCatsOfParent.find((sc) => sc.name.toLowerCase().includes("hygiene") || sc.name.toLowerCase().includes("bath")) || targetSub;
              }
            } else if (pName.includes("action") || pName.includes("verb") || pName.includes("کام") || pName.includes("أفعال")) {
              const letter = (w.label.trim()[0] || "A").toUpperCase();
              targetSub = subCatsOfParent.find((sc) => sc.name.toLowerCase() === `verbs ${letter.toLowerCase()}`) || targetSub;
            }
            targetSub.words.push({ ...w, order: targetSub.words.length });
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
      // Strip any verb tags and verb forms outside Actions
      for (const w of c.words) {
        if (w.verbFormTag) {
          delete w.verbFormTag;
          changed = true;
        }
        if (w.verbForms) {
          delete w.verbForms;
          changed = true;
        }
      }

      // If this is Places (shelf or subcategory of Places):
      if (shelf === "places") {
        const before = c.words.length;
        c.words = c.words.filter((w) => {
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

  // 2. Alphabetical (A to Z) sorting for ALL categories (except Core & Say It For Me):
  for (const c of cache) {
    const enName = (FOLDER_EN_BY_LANG[c.name.toLowerCase()] ?? c.name).toLowerCase();
    if (enName !== "core" && enName !== "say it for me") {
      c.words.sort((a, b) => (a.label || "").localeCompare(b.label || "", undefined, { sensitivity: "base" }));
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
  },
) {
  return mutate(catId, (c) => {
    c.words.push({
      id: uid("w"),
      label: word.label.trim(),
      phrase: (word.phrase ?? word.label).trim() || word.label.trim(),
      emoji: word.emoji || "🔹",
      imageUri: word.imageUri,
      color: word.color,
      audioUri: word.audioUri,
      useTextToSpeech: word.useTextToSpeech ?? !word.audioUri,
      size: word.size ?? "md",
      order: c.words.length,
      useCount: 0,
      verbForms: word.verbForms,
      verbFormTag: word.verbFormTag,
    });
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
  }[],
) {
  return mutate(catId, (c) => {
    words.forEach((word) => {
      const cleanLabel = word.label.trim();
      if (!cleanLabel) return;
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
      });
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
  return mutate(catId, (c) => {
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
    c.words = [...c.words].sort(byLabel).map((w, i) => ({ ...w, order: i }));
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

export function bottomTabCategories(): { id: string | null; name: string; icon: string; color: string }[] {
  const top = topLevelCategories();
  const out: { id: string | null; name: string; icon: string; color: string }[] = [];
  for (const tab of BOTTOM_CATEGORIES) {
    const hit = top.find(
      (c) =>
        c.name.toLowerCase() === tab.key.toLowerCase() ||
        c.name.toLowerCase() === tab.label.toLowerCase() ||
        c.name.toLowerCase() === tab.enFallback.toLowerCase() ||
        c.name.toLowerCase() === folderName(tab.key).toLowerCase()
    );
    if (hit?.hidden) continue; // parent hid this folder from the child board
    if (hit) {
      out.push({ id: hit.id, name: hit.name, icon: hit.icon || tab.icon, color: hit.color || tab.color });
    } else {
      out.push({ id: null, name: tab.label, icon: tab.icon, color: tab.color });
    }
  }
  return out;
}

export function coreWords(): CustomWord[] {
  const coreCat = topLevelCategories().find((c) => (c.name || "").toLowerCase() === "core");
  if (!coreCat) return [];
  const priority = ["I", "am", "want", "is", "are", "you", "more", "stop", "help", "yes", "no", "go", "like"];
  const sorted = coreCat.words.filter((w) => !w.hidden).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const p = [...sorted].sort((a, b) => {
    const ai = priority.indexOf(a.label);
    const bi = priority.indexOf(b.label);
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
