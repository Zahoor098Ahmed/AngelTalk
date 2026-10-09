/**
 * Built-in AAC & Clipart Symbol Library for Angel Talk.
 * Provides curated, categorized, high-resolution communication symbols
 * stored in the app / CDN for instant one-tap selection.
 */

import { getPictogramUrl } from "./aacPictograms";
import { searchArasaacDict } from "./imageLibrary";
import { getUsedPictures } from "./usedPictures";

export interface BuiltInSymbol {
  id: string;
  name: string;
  category: "all" | "used" | "core" | "actions" | "food" | "places" | "school" | "feelings" | "people" | "animals" | "objects";
  url: string;
  emoji: string;
}

function ara(id: number): string {
  return `https://static.arasaac.org/pictograms/${id}/${id}_500.png`;
}

const CURATED_SYMBOLS: BuiltInSymbol[] = [
  // --- Core & Essentials ---
  { id: "core_i", name: "I / Me", category: "core", url: ara(2392), emoji: "🧒" },
  { id: "core_want", name: "Want", category: "core", url: ara(5441), emoji: "➕" },
  { id: "core_help", name: "Help", category: "core", url: ara(4570), emoji: "🆘" },
  { id: "core_more", name: "More", category: "core", url: ara(5528), emoji: "➕" },
  { id: "core_stop", name: "Stop", category: "core", url: ara(6207), emoji: "🛑" },
  { id: "core_yes", name: "Yes", category: "core", url: ara(6011), emoji: "✅" },
  { id: "core_no", name: "No", category: "core", url: ara(6012), emoji: "❌" },
  { id: "core_please", name: "Please", category: "core", url: ara(7271), emoji: "🤲" },
  { id: "core_thank_you", name: "Thank you", category: "core", url: ara(3345), emoji: "🙏" },
  { id: "core_alldone", name: "All done", category: "core", url: ara(6207), emoji: "⭐" },
  { id: "core_good", name: "Good", category: "core", url: ara(3250), emoji: "👍" },
  { id: "core_like", name: "Like", category: "core", url: ara(30197), emoji: "❤️" },

  // --- School & Learning ---
  { id: "sch_school", name: "School", category: "school", url: ara(3082), emoji: "🏫" },
  { id: "sch_teacher", name: "Teacher", category: "school", url: ara(2457), emoji: "👩‍🏫" },
  { id: "sch_class", name: "Classroom", category: "school", url: ara(9814), emoji: "🧑‍🤝‍🧑" },
  { id: "sch_book", name: "Book", category: "school", url: ara(2450), emoji: "📖" },
  { id: "sch_desk", name: "Desk", category: "school", url: ara(2916), emoji: "🛋️" },
  { id: "sch_chair", name: "Chair", category: "school", url: ara(3155), emoji: "🪑" },
  { id: "sch_crayons", name: "Crayons", category: "school", url: ara(4951), emoji: "🖍️" },
  { id: "sch_pencils", name: "Pencils", category: "school", url: ara(2440), emoji: "✏️" },
  { id: "sch_backpack", name: "Backpack", category: "school", url: ara(2847), emoji: "🎒" },
  { id: "sch_recess", name: "Recess / Playground", category: "school", url: ara(2859), emoji: "🛝" },
  { id: "sch_slide", name: "Slide", category: "school", url: ara(4759), emoji: "🛝" },
  { id: "sch_numbers", name: "Numbers", category: "school", url: ara(2879), emoji: "🔢" },

  // --- Actions & Verbs ---
  { id: "act_go", name: "Go / Walk", category: "actions", url: ara(2719), emoji: "🚶" },
  { id: "act_eat", name: "Eat", category: "actions", url: ara(2718), emoji: "🍽️" },
  { id: "act_drink", name: "Drink", category: "actions", url: ara(2720), emoji: "🥤" },
  { id: "act_play", name: "Play", category: "actions", url: ara(3199), emoji: "🎮" },
  { id: "act_sleep", name: "Sleep", category: "actions", url: ara(3164), emoji: "🛏️" },
  { id: "act_wash", name: "Wash hands", category: "actions", url: ara(2443), emoji: "🧼" },
  { id: "act_read", name: "Read", category: "actions", url: ara(2387), emoji: "📖" },
  { id: "act_watch", name: "Watch TV", category: "actions", url: ara(2864), emoji: "📺" },
  { id: "act_clean", name: "Clean up", category: "actions", url: ara(2843), emoji: "🧹" },
  { id: "act_open", name: "Open door", category: "actions", url: ara(6208), emoji: "🚪" },
  { id: "act_listen", name: "Listen", category: "actions", url: ara(2389), emoji: "👂" },
  { id: "act_run", name: "Run", category: "actions", url: ara(2719), emoji: "🏃" },

  // --- Food & Drinks ---
  { id: "food_water", name: "Water", category: "food", url: ara(2720), emoji: "💧" },
  { id: "food_milk", name: "Milk", category: "food", url: ara(2487), emoji: "🥛" },
  { id: "food_juice", name: "Juice", category: "food", url: ara(4610), emoji: "🧃" },
  { id: "food_apple", name: "Apple", category: "food", url: ara(2496), emoji: "🍎" },
  { id: "food_banana", name: "Banana", category: "food", url: ara(2497), emoji: "🍌" },
  { id: "food_bread", name: "Bread", category: "food", url: ara(2499), emoji: "🍞" },
  { id: "food_rice", name: "Rice", category: "food", url: ara(2502), emoji: "🍚" },
  { id: "food_cookie", name: "Cookie", category: "food", url: ara(2505), emoji: "🍪" },
  { id: "food_pizza", name: "Pizza", category: "food", url: ara(4611), emoji: "🍕" },
  { id: "food_sandwich", name: "Sandwich", category: "food", url: ara(4612), emoji: "🥪" },
  { id: "food_chicken", name: "Chicken", category: "food", url: ara(2501), emoji: "🍗" },
  { id: "food_snack", name: "Snack", category: "food", url: ara(4610), emoji: "🥨" },

  // --- Places & Locations ---
  { id: "plc_home", name: "Home / House", category: "places", url: ara(3081), emoji: "🏠" },
  { id: "plc_school", name: "School", category: "places", url: ara(3082), emoji: "🏫" },
  { id: "plc_park", name: "Park", category: "places", url: ara(3198), emoji: "🌳" },
  { id: "plc_bathroom", name: "Bathroom / Toilet", category: "places", url: ara(2844), emoji: "🚻" },
  { id: "plc_bedroom", name: "Bedroom", category: "places", url: ara(3164), emoji: "🛏️" },
  { id: "plc_kitchen", name: "Kitchen", category: "places", url: ara(2845), emoji: "🍳" },
  { id: "plc_outside", name: "Outside", category: "places", url: ara(3198), emoji: "🌳" },
  { id: "plc_store", name: "Store / Market", category: "places", url: ara(4882), emoji: "🏬" },
  { id: "plc_car", name: "Car", category: "places", url: ara(2867), emoji: "🚗" },
  { id: "plc_hospital", name: "Hospital / Doctor", category: "places", url: ara(3083), emoji: "🏥" },

  // --- Feelings & Emotions ---
  { id: "feel_happy", name: "Happy", category: "feelings", url: ara(3250), emoji: "😊" },
  { id: "feel_sad", name: "Sad", category: "feelings", url: ara(3251), emoji: "😢" },
  { id: "feel_angry", name: "Angry", category: "feelings", url: ara(3252), emoji: "😠" },
  { id: "feel_tired", name: "Tired / Sleepy", category: "feelings", url: ara(3253), emoji: "😴" },
  { id: "feel_scared", name: "Scared", category: "feelings", url: ara(3254), emoji: "😨" },
  { id: "feel_hungry", name: "Hungry", category: "feelings", url: ara(2718), emoji: "🤤" },
  { id: "feel_thirsty", name: "Thirsty", category: "feelings", url: ara(2720), emoji: "🥤" },
  { id: "feel_hurt", name: "Hurt / Pain", category: "feelings", url: ara(3255), emoji: "🤕" },
  { id: "feel_calm", name: "Calm", category: "feelings", url: ara(3250), emoji: "😌" },
  { id: "feel_excited", name: "Excited", category: "feelings", url: ara(3250), emoji: "🤩" },

  // --- People & Family ---
  { id: "ppl_mom", name: "Mom / Mother", category: "people", url: ara(2390), emoji: "👩" },
  { id: "ppl_dad", name: "Dad / Father", category: "people", url: ara(2391), emoji: "👨" },
  { id: "ppl_brother", name: "Brother", category: "people", url: ara(2393), emoji: "👦" },
  { id: "ppl_sister", name: "Sister", category: "people", url: ara(2394), emoji: "👧" },
  { id: "ppl_grandma", name: "Grandma", category: "people", url: ara(2395), emoji: "👵" },
  { id: "ppl_grandpa", name: "Grandpa", category: "people", url: ara(2396), emoji: "👴" },
  { id: "ppl_friend", name: "Friend", category: "people", url: ara(2392), emoji: "🧑‍🤝‍🧑" },
  { id: "ppl_doctor", name: "Doctor", category: "people", url: ara(2458), emoji: "👨‍⚕️" },

  // --- Toys & Objects ---
  { id: "obj_toy", name: "Toy / Blocks", category: "objects", url: ara(4921), emoji: "🧸" },
  { id: "obj_ball", name: "Ball", category: "objects", url: ara(2860), emoji: "⚽" },
  { id: "obj_tablet", name: "Tablet / iPad", category: "objects", url: ara(2865), emoji: "📱" },
  { id: "obj_shoes", name: "Shoes", category: "objects", url: ara(2848), emoji: "👟" },
  { id: "obj_clothes", name: "Clothes", category: "objects", url: ara(2849), emoji: "👕" },
  { id: "obj_blanket", name: "Blanket", category: "objects", url: ara(3164), emoji: "🛏️" },
  { id: "obj_music", name: "Music / Song", category: "objects", url: ara(2417), emoji: "🎵" },

  // --- Animals ---
  { id: "ani_cat", name: "Cat", category: "animals", url: ara(2870), emoji: "🐱" },
  { id: "ani_dog", name: "Dog", category: "animals", url: ara(2871), emoji: "🐶" },
  { id: "ani_bird", name: "Bird", category: "animals", url: ara(2872), emoji: "🐦" },
  { id: "ani_fish", name: "Fish", category: "animals", url: ara(2873), emoji: "🐟" },
  { id: "ani_horse", name: "Horse", category: "animals", url: ara(2874), emoji: "🐴" },
  { id: "ani_cow", name: "Cow", category: "animals", url: ara(2875), emoji: "🐮" },
];

/**
 * The curated list, with each picture taken from the same word -> pictogram map the board uses
 * (the hand-typed ARASAAC numbers above were often wrong: "Stop" showed a woman, "No" a calendar).
 */
export const BUILT_IN_SYMBOLS: BuiltInSymbol[] = CURATED_SYMBOLS.map((s) => ({
  ...s,
  url: getPictogramUrl(s.name.split("/")[0].trim()) || s.url,
}));

export const SYMBOL_CATEGORIES = [
  { id: "all", label: "All", icon: "✨" },
  { id: "used", label: "Used", icon: "⭐" },
  { id: "core", label: "Core", icon: "💬" },
  { id: "school", label: "School", icon: "🏫" },
  { id: "actions", label: "Actions", icon: "⚡" },
  { id: "food", label: "Food", icon: "🍴" },
  { id: "places", label: "Places", icon: "🏛️" },
  { id: "feelings", label: "Feelings", icon: "😊" },
  { id: "people", label: "People", icon: "👥" },
  { id: "objects", label: "Objects", icon: "🧸" },
  { id: "animals", label: "Animals", icon: "🐾" },
] as const;

function usedSymbols(q: string): BuiltInSymbol[] {
  return getUsedPictures()
    .filter((p) => !q || p.name.toLowerCase().includes(q))
    .map((p, i) => ({ id: `used_${i}_${p.at}`, name: p.name, category: "used" as const, url: p.url, emoji: "⭐" }));
}

/**
 * Library tab: "Used" = pictures picked before; "All" = used ones first, the curated set, and —
 * when searching — the ~15,000 bundled ARASAAC pictures (offline, free).
 */
export function searchBuiltInSymbols(query: string, category: string = "all"): BuiltInSymbol[] {
  const q = (query || "").trim().toLowerCase();
  if (category === "used") return usedSymbols(q);
  const curated = BUILT_IN_SYMBOLS.filter((item) => {
    const matchesCategory = category === "all" || item.category === category;
    // match the start of a word ("car" -> "Car", not "Scared")
    const matchesQuery = !q || item.name.toLowerCase().split(/[\s/]+/).some((w) => w.startsWith(q)) || item.category.startsWith(q);
    return matchesCategory && matchesQuery;
  });
  if (category !== "all") return curated;

  const out: BuiltInSymbol[] = [];
  const seen = new Set<string>();
  const push = (s: BuiltInSymbol) => {
    if (!s.url || seen.has(s.url)) return;
    seen.add(s.url);
    out.push(s);
  };
  usedSymbols(q).slice(0, q ? 24 : 12).forEach(push);
  curated.forEach(push);
  if (q) {
    searchArasaacDict(q, 150).forEach((d) =>
      push({ id: `ara_${d.id}`, name: d.word, category: "all", url: d.url, emoji: "🔹" }),
    );
  }
  return out;
}
