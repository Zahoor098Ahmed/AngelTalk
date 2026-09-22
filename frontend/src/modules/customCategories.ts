import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CustomCategory, CustomWord, TileSize, LanguageCode } from "../types";
import { starterLabel, wordLabel } from "./i18n";
import { getPictogramUrl } from "./aacPictograms";

const SEED_WORD_EN: Record<string, string[]> = {
  Core: ["I", "am", "is", "are", "was", "I want", "More", "Help", "No", "Yes", "All done", "I need", "I feel", "I like", "Can I have", "Please", "Thank you", "Stop", "Go", "to", "the", "Look", "Where"],
  Food: ["Water", "Milk", "Juice", "Apple", "Banana", "Bread", "Cookie", "Rice", "Chicken", "Snack", "Pizza", "Sandwich", "Fruit"],
  Feelings: ["Happy", "Sad", "Hungry", "Thirsty", "Tired", "Excited", "Scared", "Angry", "Hurt", "Sick", "Calm", "Loved"],
  People: ["Mom", "Dad", "Me", "You", "Teacher", "Friend", "Brother", "Sister", "Grandma", "Grandpa", "Doctor", "Baby"],
  Actions: ["Go", "Going", "Went", "Eat", "Eating", "Drink", "Drinking", "Play", "Playing", "Sleep", "Sleeping", "Come", "Wash", "Read", "Watch", "Help", "Clean", "Open", "Go to", "Stop", "Give"],
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

/** Bring older records up to the current shape without recreating anything. */
function migrate(list: CustomCategory[]): CustomCategory[] {
  return list.map((c, i) => ({
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
    })),
  }));
}

export async function ensureCategoriesLoaded(): Promise<void> {
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
    words: [
      ["Mom", "👩"],
      ["Dad", "👨"],
      ["Me", "🧒"],
      ["You", "👉"],
      ["Teacher", "👩‍🏫"],
      ["Friend", "🧑‍🤝‍🧑"],
      ["Brother", "👦"],
      ["Sister", "👧"],
      ["Grandma", "👵"],
      ["Grandpa", "👴"],
      ["Doctor", "👨‍⚕️"],
      ["Baby", "👶"],
    ],
  },
  {
    name: "Feelings",
    icon: "😊",
    color: "#e67e22",
    words: [
      ["Happy", "😊"],
      ["Sad", "😢"],
      ["Hungry", "🍎"],
      ["Thirsty", "💧"],
      ["Tired", "😴"],
      ["Excited", "🤩"],
      ["Scared", "😨"],
      ["Angry", "😠"],
      ["Hurt", "🤕"],
      ["Sick", "🤒"],
      ["Calm", "😌"],
      ["Loved", "🥰"],
    ],
  },
  {
    name: "Actions",
    icon: "⚡",
    color: "#c98a3d",
    words: [
      ["Go", "🚶"],
      ["Going", "🚶"],
      ["Went", "🚶"],
      ["Eat", "🍽️"],
      ["Eating", "🍽️"],
      ["Drink", "🥤"],
      ["Drinking", "🥤"],
      ["Play", "🎮"],
      ["Playing", "🎮"],
      ["Sleep", "🛏️"],
      ["Sleeping", "🛏️"],
      ["Come", "🏃"],
      ["Wash", "🧼"],
      ["Read", "📖"],
      ["Watch", "📺"],
      ["Help", "🆘"],
      ["Clean", "🧹"],
      ["Open", "🚪"],
    ],
  },
  {
    name: "Food",
    icon: "🍴",
    color: "#5c9a58",
    words: [
      ["Water", "💧"],
      ["Milk", "🥛"],
      ["Juice", "🧃"],
      ["Apple", "🍎"],
      ["Banana", "🍌"],
      ["Bread", "🍞"],
      ["Cookie", "🍪"],
      ["Rice", "🍚"],
      ["Chicken", "🍗"],
      ["Snack", "🥨"],
      ["Pizza", "🍕"],
      ["Sandwich", "🥪"],
      ["Fruit", "🍓"],
    ],
  },
  {
    name: "Places",
    icon: "🏛️",
    color: "#4a7fe6",
    words: [
      ["Home", "🏠"],
      ["School", "🏫"],
      ["Park", "🌳"],
      ["Bathroom", "🚻"],
      ["Outside", "🏕️"],
      ["Bedroom", "🛏️"],
      ["Playground", "🛝"],
      ["Kitchen", "🍳"],
      ["Car", "🚗"],
      ["Store", "🏪"],
    ],
  },
  {
    name: "Things",
    icon: "✨",
    color: "#8a6bc9",
    words: [
      ["Ball", "⚽"],
      ["Toy", "🧸"],
      ["Book", "📚"],
      ["Tablet", "📱"],
      ["Shoes", "👟"],
      ["Blanket", "🧶"],
      ["Clothes", "👕"],
      ["Cup", "🥤"],
      ["Backpack", "🎒"],
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

export const STARTER_SUBCATEGORIES: {
  parentCategory: string;
  name: string;
  icon: string;
  words: [string, string][];
}[] = [
  // Food
  {
    parentCategory: "Food",
    name: "Drinks",
    icon: "🥤",
    words: [
      ["Water", "💧"],
      ["Milk", "🥛"],
      ["Juice", "🧃"],
    ],
  },
  {
    parentCategory: "Food",
    name: "Fruits",
    icon: "🍎",
    words: [
      ["Apple", "🍎"],
      ["Banana", "🍌"],
      ["Fruit", "🍓"],
    ],
  },
  {
    parentCategory: "Food",
    name: "Meals & Snacks",
    icon: "🥪",
    words: [
      ["Bread", "🍞"],
      ["Cookie", "🍪"],
      ["Rice", "🍚"],
      ["Chicken", "🍗"],
      ["Snack", "🥨"],
      ["Pizza", "🍕"],
      ["Sandwich", "🥪"],
    ],
  },
  // People
  {
    parentCategory: "People",
    name: "Family",
    icon: "👨‍👩‍👦",
    words: [
      ["Mom", "👩"],
      ["Dad", "👨"],
      ["Brother", "👦"],
      ["Sister", "👧"],
      ["Grandma", "👵"],
      ["Grandpa", "👴"],
      ["Baby", "👶"],
    ],
  },
  {
    parentCategory: "People",
    name: "Friends & Helpers",
    icon: "🧑‍🤝‍🧑",
    words: [
      ["Teacher", "👩‍🏫"],
      ["Friend", "🧑‍🤝‍🧑"],
      ["Doctor", "👨‍⚕️"],
      ["Me", "🧒"],
      ["You", "👉"],
    ],
  },
  // Feelings
  {
    parentCategory: "Feelings",
    name: "Good Feelings",
    icon: "😊",
    words: [
      ["Happy", "😊"],
      ["Excited", "🤩"],
      ["Calm", "😌"],
      ["Loved", "🥰"],
    ],
  },
  {
    parentCategory: "Feelings",
    name: "Needs & Hard Feelings",
    icon: "💭",
    words: [
      ["Sad", "😢"],
      ["Hungry", "🍎"],
      ["Thirsty", "💧"],
      ["Tired", "😴"],
      ["Scared", "😨"],
      ["Angry", "😠"],
      ["Hurt", "🤕"],
      ["Sick", "🤒"],
    ],
  },
  // Places
  {
    parentCategory: "Places",
    name: "Home",
    icon: "🏠",
    words: [
      ["Home", "🏠"],
      ["Bedroom", "🛏️"],
      ["Kitchen", "🍳"],
      ["Bathroom", "🚻"],
    ],
  },
  {
    parentCategory: "Places",
    name: "Outside & Community",
    icon: "🌳",
    words: [
      ["School", "🏫"],
      ["Park", "🌳"],
      ["Playground", "🛝"],
      ["Outside", "🏕️"],
      ["Car", "🚗"],
      ["Store", "🏪"],
    ],
  },
  // Actions
  {
    parentCategory: "Actions",
    name: "Daily Routines",
    icon: "🧼",
    words: [
      ["Eat", "🍽️"],
      ["Eating", "🍽️"],
      ["Drink", "🥤"],
      ["Drinking", "🥤"],
      ["Sleep", "🛏️"],
      ["Sleeping", "🛏️"],
      ["Wash", "🧼"],
      ["Clean", "🧹"],
    ],
  },
  {
    parentCategory: "Actions",
    name: "Play & Movement",
    icon: "🏃",
    words: [
      ["Go", "🚶"],
      ["Going", "🚶"],
      ["Went", "🚶"],
      ["Play", "🎮"],
      ["Playing", "🎮"],
      ["Come", "🏃"],
      ["Read", "📖"],
      ["Watch", "📺"],
      ["Help", "🆘"],
      ["Open", "🚪"],
    ],
  },
  // Things
  {
    parentCategory: "Things",
    name: "Toys & Tech",
    icon: "🧸",
    words: [
      ["Ball", "⚽"],
      ["Toy", "🧸"],
      ["Book", "📚"],
      ["Tablet", "📱"],
    ],
  },
  {
    parentCategory: "Things",
    name: "Daily Items",
    icon: "🎒",
    words: [
      ["Shoes", "👟"],
      ["Blanket", "🧶"],
      ["Clothes", "👕"],
      ["Cup", "🥤"],
      ["Backpack", "🎒"],
    ],
  },
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
        if (!hit.words.some((w) => w.label.toLowerCase() === label.toLowerCase())) {
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

  // Ensure standard sub-categories exist and have their words populated
  STARTER_SUBCATEGORIES.forEach((sub, subIdx) => {
    const parent = cache.find(
      (c) =>
        !c.parentCategoryId &&
        (c.name.toLowerCase() === sub.parentCategory.toLowerCase() ||
          (FOLDER_EN_BY_LANG[c.name.toLowerCase()] ?? c.name).toLowerCase() === sub.parentCategory.toLowerCase())
    );
    if (!parent) return;

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

    // Populate words for this sub-category
    sub.words.forEach(([label, emoji]) => {
      const localized = starterLabel(label, seedLang) || label;
      if (!subCat!.words.some((w) => w.label.toLowerCase() === localized.toLowerCase() || w.label.toLowerCase() === label.toLowerCase())) {
        subCat!.words.push({
          id: uid("w"),
          label: localized,
          phrase: localized,
          emoji,
          imageUri: getPictogramUrl(label) || undefined,
          useTextToSpeech: true,
          size: "md" as TileSize,
          order: subCat!.words.length,
          useCount: 0,
        });
        changed = true;
      }
    });
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

export function deleteCategory(id: string) {
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
  patch: Partial<Pick<CustomWord, "label" | "phrase" | "emoji" | "imageUri" | "audioUri" | "useTextToSpeech" | "size" | "color">>,
) {
  return mutate(catId, (c) => {
    const w = c.words.find((x) => x.id === wordId);
    if (w) Object.assign(w, patch);
  });
}

export function removeWord(catId: string, wordId: string) {
  return mutate(catId, (c) => {
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

  const actionsCat = cache.find((c) => (FOLDER_EN_BY_LANG[c.name.toLowerCase()] ?? c.name).toLowerCase() === "actions");
  if (actionsCat) {
    const essentialActions: [string, string][] = [
      ["Go", "🚶"],
      ["Going", "🚶"],
      ["Went", "🚶"],
      ["Eat", "🍽️"],
      ["Eating", "🍽️"],
      ["Drink", "🥤"],
      ["Drinking", "🥤"],
      ["Play", "🎮"],
      ["Playing", "🎮"],
    ];
    for (const [wLabel, wEmoji] of [...essentialActions].reverse()) {
      if (!actionsCat.words.some((w) => w.label.toLowerCase() === wLabel.toLowerCase())) {
        actionsCat.words.unshift({
          id: uid("word"),
          label: wLabel,
          phrase: wLabel,
          emoji: wEmoji,
          color: "#FDF6E2",
          size: "md",
          order: 0,
          useTextToSpeech: true,
        });
        changed = true;
      }
    }
    actionsCat.words.forEach((w, i) => { w.order = i; });
  }

  const placesCat = cache.find((c) => (FOLDER_EN_BY_LANG[c.name.toLowerCase()] ?? c.name).toLowerCase() === "places");
  if (placesCat) {
    const essentialPlaces: [string, string][] = [
      ["School", "🏫"],
      ["Home", "🏠"],
      ["Park", "🌳"],
      ["Playground", "🛝"],
    ];
    for (const [wLabel, wEmoji] of essentialPlaces) {
      if (!placesCat.words.some((w) => w.label.toLowerCase() === wLabel.toLowerCase())) {
        placesCat.words.push({
          id: uid("word"),
          label: wLabel,
          phrase: wLabel,
          emoji: wEmoji,
          color: "#E0EEF7",
          size: "md",
          order: placesCat.words.length,
          useTextToSpeech: true,
        });
        changed = true;
      }
    }
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
  word: { label: string; phrase?: string; emoji?: string; imageUri?: string; audioUri?: string; useTextToSpeech?: boolean; size?: TileSize; color?: string; verbForms?: CustomWord["verbForms"] },
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
