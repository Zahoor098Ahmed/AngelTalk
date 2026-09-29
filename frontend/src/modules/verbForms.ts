/**
 * English Verb Forms Module for Special Needs AAC & Sentence Building:
 * Supports 1st Form (Base/Present), 2nd Form (Past Simple),
 * 3rd Form (Past Participle), and 4th Form (Present Participle / -ing).
 */

export interface VerbForms {
  base: string; // 1st form: e.g. "go", "eat", "play"
  past: string; // 2nd form: e.g. "went", "ate", "played"
  participle: string; // 3rd form: e.g. "gone", "eaten", "played"
  continuous: string; // 4th form: e.g. "going", "eating", "playing"
  emoji: string;
}

export const VERB_FORMS_LIST: VerbForms[] = [
  // --- Core & High Frequency ---
  { base: "go", past: "went", participle: "gone", continuous: "going", emoji: "🚶" },
  { base: "eat", past: "ate", participle: "eaten", continuous: "eating", emoji: "🍽️" },
  { base: "drink", past: "drank", participle: "drunk", continuous: "drinking", emoji: "🥤" },
  { base: "play", past: "played", participle: "played", continuous: "playing", emoji: "🎮" },
  { base: "sleep", past: "slept", participle: "slept", continuous: "sleeping", emoji: "🛏️" },
  { base: "come", past: "came", participle: "come", continuous: "coming", emoji: "🏃" },
  { base: "wash", past: "washed", participle: "washed", continuous: "washing", emoji: "🧼" },
  { base: "read", past: "read", participle: "read", continuous: "reading", emoji: "📖" },
  { base: "watch", past: "watched", participle: "watched", continuous: "watching", emoji: "📺" },
  { base: "help", past: "helped", participle: "helped", continuous: "helping", emoji: "🆘" },
  { base: "walk", past: "walked", participle: "walked", continuous: "walking", emoji: "🚶" },
  { base: "run", past: "ran", participle: "run", continuous: "running", emoji: "🏃" },
  { base: "see", past: "saw", participle: "seen", continuous: "seeing", emoji: "👀" },
  { base: "open", past: "opened", participle: "opened", continuous: "opening", emoji: "🚪" },
  { base: "close", past: "closed", participle: "closed", continuous: "closing", emoji: "🚪" },
  { base: "clean", past: "cleaned", participle: "cleaned", continuous: "cleaning", emoji: "🧹" },
  { base: "give", past: "gave", participle: "given", continuous: "giving", emoji: "🤲" },
  { base: "take", past: "took", participle: "taken", continuous: "taking", emoji: "🤏" },
  { base: "want", past: "wanted", participle: "wanted", continuous: "wanting", emoji: "➕" },
  { base: "need", past: "needed", participle: "needed", continuous: "needing", emoji: "🤲" },
  { base: "like", past: "liked", participle: "liked", continuous: "liking", emoji: "❤️" },
  { base: "love", past: "loved", participle: "loved", continuous: "loving", emoji: "💖" },
  { base: "make", past: "made", participle: "made", continuous: "making", emoji: "🛠️" },
  { base: "do", past: "did", participle: "done", continuous: "doing", emoji: "✨" },
  { base: "have", past: "had", participle: "had", continuous: "having", emoji: "📦" },

  // --- Daily Activities & Routines ---
  { base: "cook", past: "cooked", participle: "cooked", continuous: "cooking", emoji: "🍳" },
  { base: "bake", past: "baked", participle: "baked", continuous: "baking", emoji: "🧁" },
  { base: "brush", past: "brushed", participle: "brushed", continuous: "brushing", emoji: "🪥" },
  { base: "comb", past: "combed", participle: "combed", continuous: "combing", emoji: "💇" },
  { base: "dress", past: "dressed", participle: "dressed", continuous: "dressing", emoji: "👕" },
  { base: "wear", past: "wore", participle: "worn", continuous: "wearing", emoji: "👗" },
  { base: "sit", past: "sat", participle: "sat", continuous: "sitting", emoji: "🪑" },
  { base: "stand", past: "stood", participle: "stood", continuous: "standing", emoji: "🧍" },
  { base: "rest", past: "rested", participle: "rested", continuous: "resting", emoji: "🛋️" },
  { base: "wake", past: "woke", participle: "woken", continuous: "waking", emoji: "⏰" },
  { base: "wait", past: "waited", participle: "waited", continuous: "waiting", emoji: "⏳" },
  { base: "stop", past: "stopped", participle: "stopped", continuous: "stopping", emoji: "🛑" },

  // --- Communication & Social ---
  { base: "talk", past: "talked", participle: "talked", continuous: "talking", emoji: "💬" },
  { base: "speak", past: "spoke", participle: "spoken", continuous: "speaking", emoji: "🗣️" },
  { base: "say", past: "said", participle: "said", continuous: "saying", emoji: "💬" },
  { base: "tell", past: "told", participle: "told", continuous: "telling", emoji: "🗣️" },
  { base: "ask", past: "asked", participle: "asked", continuous: "asking", emoji: "❓" },
  { base: "answer", past: "answered", participle: "answered", continuous: "answering", emoji: "💡" },
  { base: "listen", past: "listened", participle: "listened", continuous: "listening", emoji: "👂" },
  { base: "hear", past: "heard", participle: "heard", continuous: "hearing", emoji: "👂" },
  { base: "smile", past: "smiled", participle: "smiled", continuous: "smiling", emoji: "😊" },
  { base: "laugh", past: "laughed", participle: "laughed", continuous: "laughing", emoji: "😄" },
  { base: "cry", past: "cried", participle: "cried", continuous: "crying", emoji: "😢" },
  { base: "hug", past: "hugged", participle: "hugged", continuous: "hugging", emoji: "🫂" },
  { base: "kiss", past: "kissed", participle: "kissed", continuous: "kissing", emoji: "😘" },
  { base: "share", past: "shared", participle: "shared", continuous: "sharing", emoji: "🤝" },

  // --- School & Learning ---
  { base: "learn", past: "learned", participle: "learned", continuous: "learning", emoji: "🧠" },
  { base: "study", past: "studied", participle: "studied", continuous: "studying", emoji: "📚" },
  { base: "write", past: "wrote", participle: "written", continuous: "writing", emoji: "✏️" },
  { base: "draw", past: "drew", participle: "drawn", continuous: "drawing", emoji: "🎨" },
  { base: "paint", past: "painted", participle: "painted", continuous: "painting", emoji: "🖌️" },
  { base: "color", past: "colored", participle: "colored", continuous: "coloring", emoji: "🖍️" },
  { base: "count", past: "counted", participle: "counted", continuous: "counting", emoji: "🔢" },
  { base: "spell", past: "spelled", participle: "spelled", continuous: "spelling", emoji: "🔤" },
  { base: "cut", past: "cut", participle: "cut", continuous: "cutting", emoji: "✂️" },
  { base: "paste", past: "pasted", participle: "pasted", continuous: "pasting", emoji: "📋" },
  { base: "fold", past: "folded", participle: "folded", continuous: "folding", emoji: "📄" },

  // --- Movement, Sports & Actions ---
  { base: "jump", past: "jumped", participle: "jumped", continuous: "jumping", emoji: "🦘" },
  { base: "hop", past: "hopped", participle: "hopped", continuous: "hopping", emoji: "🐰" },
  { base: "swim", past: "swam", participle: "swum", continuous: "swimming", emoji: "🏊" },
  { base: "dance", past: "danced", participle: "danced", continuous: "dancing", emoji: "💃" },
  { base: "sing", past: "sang", participle: "sung", continuous: "singing", emoji: "🎤" },
  { base: "ride", past: "rode", participle: "ridden", continuous: "riding", emoji: "🚴" },
  { base: "drive", past: "drove", participle: "driven", continuous: "driving", emoji: "🚗" },
  { base: "fly", past: "flew", participle: "flown", continuous: "flying", emoji: "✈️" },
  { base: "fall", past: "fell", participle: "fallen", continuous: "falling", emoji: "🍂" },
  { base: "climb", past: "climbed", participle: "climbed", continuous: "climbing", emoji: "🧗" },
  { base: "catch", past: "caught", participle: "caught", continuous: "catching", emoji: "⚾" },
  { base: "throw", past: "threw", participle: "thrown", continuous: "throwing", emoji: "🎯" },
  { base: "kick", past: "kicked", participle: "kicked", continuous: "kicking", emoji: "⚽" },
  { base: "push", past: "pushed", participle: "pushed", continuous: "pushing", emoji: "🫸" },
  { base: "pull", past: "pulled", participle: "pulled", continuous: "pulling", emoji: "🫷" },
  { base: "hold", past: "held", participle: "held", continuous: "holding", emoji: "🤲" },
  { base: "carry", past: "carried", participle: "carried", continuous: "carrying", emoji: "🎒" },
  { base: "drop", past: "dropped", participle: "dropped", continuous: "dropping", emoji: "💧" },

  // --- Cognitive & Perception ---
  { base: "think", past: "thought", participle: "thought", continuous: "thinking", emoji: "💭" },
  { base: "know", past: "knew", participle: "known", continuous: "knowing", emoji: "💡" },
  { base: "feel", past: "felt", participle: "felt", continuous: "feeling", emoji: "💓" },
  { base: "find", past: "found", participle: "found", continuous: "finding", emoji: "🔎" },
  { base: "look", past: "looked", participle: "looked", continuous: "looking", emoji: "👀" },
  { base: "touch", past: "touched", participle: "touched", continuous: "touching", emoji: "👉" },
  { base: "smell", past: "smelled", participle: "smelled", continuous: "smelling", emoji: "👃" },
  { base: "taste", past: "tasted", participle: "tasted", continuous: "tasting", emoji: "👅" },
  { base: "show", past: "showed", participle: "shown", continuous: "showing", emoji: "👉" },
  { base: "buy", past: "bought", participle: "bought", continuous: "buying", emoji: "🛍️" },
  { base: "bring", past: "brought", participle: "brought", continuous: "bringing", emoji: "🎁" },
  { base: "build", past: "built", participle: "built", continuous: "building", emoji: "🧱" },
  { base: "fix", past: "fixed", participle: "fixed", continuous: "fixing", emoji: "🔧" },
  { base: "break", past: "broke", participle: "broken", continuous: "breaking", emoji: "💔" },
  { base: "put", past: "put", participle: "put", continuous: "putting", emoji: "📥" },
  { base: "leave", past: "left", participle: "left", continuous: "leaving", emoji: "🚪" },
  { base: "meet", past: "met", participle: "met", continuous: "meeting", emoji: "🤝" },
  { base: "choose", past: "chose", participle: "chosen", continuous: "choosing", emoji: "✅" },
  { base: "exercise", past: "exercised", participle: "exercised", continuous: "exercising", emoji: "🏋️" },
  { base: "breathe", past: "breathed", participle: "breathed", continuous: "breathing", emoji: "🌬️" },

  // --- Additional High Frequency & Irregular Verbs ---
  { base: "get", past: "got", participle: "gotten", continuous: "getting", emoji: "🤲" },
  { base: "keep", past: "kept", participle: "kept", continuous: "keeping", emoji: "🔐" },
  { base: "begin", past: "began", participle: "begun", continuous: "beginning", emoji: "▶️" },
  { base: "bite", past: "bit", participle: "bitten", continuous: "biting", emoji: "🦷" },
  { base: "blow", past: "blew", participle: "blown", continuous: "blowing", emoji: "💨" },
  { base: "cut", past: "cut", participle: "cut", continuous: "cutting", emoji: "✂️" },
  { base: "dig", past: "dug", participle: "dug", continuous: "digging", emoji: "⛏️" },
  { base: "draw", past: "drew", participle: "drawn", continuous: "drawing", emoji: "🎨" },
  { base: "drive", past: "drove", participle: "driven", continuous: "driving", emoji: "🚗" },
  { base: "fall", past: "fell", participle: "fallen", continuous: "falling", emoji: "🍂" },
  { base: "feed", past: "fed", participle: "fed", continuous: "feeding", emoji: "🍼" },
  { base: "fight", past: "fought", participle: "fought", continuous: "fighting", emoji: "🥊" },
  { base: "forget", past: "forgot", participle: "forgotten", continuous: "forgetting", emoji: "❓" },
  { base: "freeze", past: "froze", participle: "frozen", continuous: "freezing", emoji: "❄️" },
  { base: "grow", past: "grew", participle: "grown", continuous: "growing", emoji: "🌱" },
  { base: "hang", past: "hung", participle: "hung", continuous: "hanging", emoji: "🪝" },
  { base: "hide", past: "hid", participle: "hidden", continuous: "hiding", emoji: "🙈" },
  { base: "hit", past: "hit", participle: "hit", continuous: "hitting", emoji: "🎯" },
  { base: "hurt", past: "hurt", participle: "hurt", continuous: "hurting", emoji: "🤕" },
  { base: "lose", past: "lost", participle: "lost", continuous: "losing", emoji: "🔍" },
  { base: "pay", past: "paid", participle: "paid", continuous: "paying", emoji: "💳" },
  { base: "ride", past: "rode", participle: "ridden", continuous: "riding", emoji: "🚴" },
  { base: "ring", past: "rang", participle: "rung", continuous: "ringing", emoji: "🔔" },
  { base: "send", past: "sent", participle: "sent", continuous: "sending", emoji: "✉️" },
  { base: "shake", past: "shook", participle: "shaken", continuous: "shaking", emoji: "🤝" },
  { base: "shine", past: "shone", participle: "shone", continuous: "shining", emoji: "✨" },
  { base: "shoot", past: "shot", participle: "shot", continuous: "shooting", emoji: "🏀" },
  { base: "shut", past: "shut", participle: "shut", continuous: "shutting", emoji: "🚪" },
  { base: "sing", past: "sang", participle: "sung", continuous: "singing", emoji: "🎤" },
  { base: "sink", past: "sank", participle: "sunk", continuous: "sinking", emoji: "⚓" },
  { base: "sit", past: "sat", participle: "sat", continuous: "sitting", emoji: "🪑" },
  { base: "spend", past: "spent", participle: "spent", continuous: "spending", emoji: "💰" },
  { base: "stand", past: "stood", participle: "stood", continuous: "standing", emoji: "🧍" },
  { base: "sweep", past: "swept", participle: "swept", continuous: "sweeping", emoji: "🧹" },
  { base: "swim", past: "swam", participle: "swum", continuous: "swimming", emoji: "🏊" },
  { base: "swing", past: "swung", participle: "swung", continuous: "swinging", emoji: "🪵" },
  { base: "teach", past: "taught", participle: "taught", continuous: "teaching", emoji: "👩‍🏫" },
  { base: "tear", past: "tore", participle: "torn", continuous: "tearing", emoji: "📄" },
  { base: "wake", past: "woke", participle: "woken", continuous: "waking", emoji: "⏰" },
  { base: "wear", past: "wore", participle: "worn", continuous: "wearing", emoji: "👗" },
  { base: "win", past: "won", participle: "won", continuous: "winning", emoji: "🏆" },
  { base: "write", past: "wrote", participle: "written", continuous: "writing", emoji: "✏️" },
];

const LOOKUP_MAP = new Map<string, VerbForms>();
for (const v of VERB_FORMS_LIST) {
  LOOKUP_MAP.set(v.base.toLowerCase(), v);
  LOOKUP_MAP.set(v.past.toLowerCase(), v);
  LOOKUP_MAP.set(v.participle.toLowerCase(), v);
  LOOKUP_MAP.set(v.continuous.toLowerCase(), v);
}

/** Check if a word ends with a short consonant-vowel-consonant (CVC) pattern */
function isCVC(word: string): boolean {
  if (word.length < 3) return false;
  const vowels = "aeiou";
  const lastChar = word[word.length - 1];
  const midChar = word[word.length - 2];
  const thirdChar = word[word.length - 3];
  // W, X, Y are not doubled in English
  if ("wxy".includes(lastChar)) return false;
  return !vowels.includes(thirdChar) && vowels.includes(midChar) && !vowels.includes(lastChar);
}

/** Rule-based regular verb conjugator for any regular English verb */
export function conjugateRegularVerb(rawBase: string): VerbForms {
  const base = rawBase.trim().toLowerCase();
  let past = "";
  let participle = "";
  let continuous = "";

  // Past / Participle (2nd & 3rd Form)
  if (base.endsWith("e")) {
    past = base + "d";
  } else if (base.endsWith("y") && base.length > 2 && !"aeiou".includes(base[base.length - 2])) {
    past = base.slice(0, -1) + "ied";
  } else if (isCVC(base)) {
    past = base + base[base.length - 1] + "ed";
  } else {
    past = base + "ed";
  }
  participle = past; // For regular verbs, 3rd form = 2nd form

  // Continuous / -ing (4th Form)
  if (base.endsWith("ie")) {
    continuous = base.slice(0, -2) + "ying";
  } else if (base.endsWith("ee")) {
    continuous = base + "ing";
  } else if (base.endsWith("e") && base.length > 2) {
    continuous = base.slice(0, -1) + "ing";
  } else if (isCVC(base)) {
    continuous = base + base[base.length - 1] + "ing";
  } else {
    continuous = base + "ing";
  }

  return {
    base,
    past,
    participle,
    continuous,
    emoji: "⚡",
  };
}

/**
 * Recovers the base root from an inflected form (e.g. "played" -> "play", "eating" -> "eat", "dancing" -> "dance")
 */
function extractRoot(word: string): string {
  const w = word.trim().toLowerCase();
  if (w.endsWith("ing") && w.length > 4) {
    const stem = w.slice(0, -3);
    // e.g. stopping -> stop, swimming -> swim, clapping -> clap
    if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
      return stem.slice(0, -1);
    }
    // e.g. making -> make, dancing -> dance, baking -> bake, riding -> ride
    if (LOOKUP_MAP.has(stem + "e") || KNOWN_REGULAR_VERBS.has(stem + "e")) return stem + "e";
    // e.g. crying -> cry, flying -> fly
    if (w.endsWith("ying") && stem.length >= 2) {
      const yForm = stem.slice(0, -1) + "y";
      if (LOOKUP_MAP.has(yForm) || KNOWN_REGULAR_VERBS.has(yForm)) return yForm;
    }
    if (LOOKUP_MAP.has(stem) || KNOWN_REGULAR_VERBS.has(stem)) return stem;
    // General silent-e heuristic (e.g. smiling -> smile)
    if (stem.length >= 3 && !isKnownNonVerb(stem + "e")) {
      return stem + "e";
    }
    return stem;
  }
  if (w.endsWith("ed") && w.length > 3) {
    const stem = w.slice(0, -2);
    // e.g. stopped -> stop
    if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
      return stem.slice(0, -1);
    }
    // e.g. danced -> dance, loved -> love
    if (w.endsWith("ed") && stem.endsWith("e")) return stem;
    if (LOOKUP_MAP.has(stem + "e") || KNOWN_REGULAR_VERBS.has(stem + "e")) return stem + "e";
    if (w.endsWith("ied") && w.length > 4) return w.slice(0, -3) + "y";
    return stem;
  }
  if (w.endsWith("es") && w.length > 4) {
    const stem = w.slice(0, -2);
    if (LOOKUP_MAP.has(stem) || KNOWN_REGULAR_VERBS.has(stem)) return stem;
    if (LOOKUP_MAP.has(stem + "e") || KNOWN_REGULAR_VERBS.has(stem + "e")) return stem + "e";
  }
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) {
    const stem = w.slice(0, -1);
    if (LOOKUP_MAP.has(stem) || KNOWN_REGULAR_VERBS.has(stem)) return stem;
  }
  return w;
}

/** Check if a word is a verb and return its 4 forms */
export function getVerbForms(label: string): VerbForms | null {
  const clean = (label || "").trim().toLowerCase();
  if (!clean) return null;

  // Direct match in dictionary
  const direct = LOOKUP_MAP.get(clean);
  if (direct) return direct;

  // Multi-word phrase starting with a verb (e.g. "go home", "eat apple")
  const parts = clean.split(/\s+/);
  if (parts.length > 1) {
    const first = parts[0];
    const rest = parts.slice(1).join(" ");
    const v = LOOKUP_MAP.get(first);
    if (v) {
      return {
        base: `${v.base} ${rest}`,
        past: `${v.past} ${rest}`,
        participle: `${v.participle} ${rest}`,
        continuous: `${v.continuous} ${rest}`,
        emoji: v.emoji,
      };
    }
  }

  // Check if stem or inflected form matches
  const root = extractRoot(clean);
  const rootMatch = LOOKUP_MAP.get(root);
  if (rootMatch) return rootMatch;

  return null;
}

// Common regular verbs for children AAC, routines, actions, and school
export const KNOWN_REGULAR_VERBS = new Set([
  // Routines & Self-care
  "wash", "clean", "brush", "comb", "dress", "bathe", "shower", "flush", "wipe",
  "rest", "relax", "yawn", "stretch", "cough", "sneeze",
  // Food & Kitchen
  "cook", "bake", "fry", "boil", "cut", "chop", "slice", "peel", "stir", "mix",
  "pour", "spill", "feed", "chew", "taste", "lick", "serve", "heat", "cool",
  // Movement & Play
  "walk", "jump", "hop", "skip", "crawl", "climb", "march", "dance", "jog",
  "slide", "swing", "stumble", "roll", "bounce", "spin", "balance", "exercise",
  // Hand Actions & Manipulation
  "touch", "press", "tap", "knock", "click", "clap", "wave", "point", "push",
  "pull", "lift", "drop", "pick", "carry", "hold", "hug", "grab", "squeeze",
  "kick", "pass", "hit", "strike", "build", "fix", "repair", "assemble", "stack",
  "open", "close", "shut", "lock", "unlock", "turn", "twist", "bend", "fold",
  "wrap", "pack", "unpack", "load", "unload", "tie", "untie", "fasten",
  // Social & Emotion
  "talk", "ask", "answer", "explain", "shout", "whisper", "scream", "cry",
  "smile", "laugh", "giggle", "cheer", "greet", "share", "help", "care",
  "comfort", "tease", "apologize", "agree", "refuse", "interrupt",
  "like", "love", "hate", "enjoy", "prefer", "worry", "fear", "hope", "wish", "miss", "trust",
  // Learning & Arts
  "learn", "study", "teach", "practice", "test", "quiz", "check", "correct",
  "draw", "paint", "color", "scribble", "sketch", "trace", "erase", "paste",
  "glue", "tape", "staple", "count", "calculate", "measure", "spell", "pronounce",
  // Housework & Daily Tasks
  "sweep", "mop", "vacuum", "scrub", "dust", "polish", "tidy", "organize", "sort",
  "rinse", "dry", "iron", "empty", "fill", "dispose", "recycle",
  // Digital & Sensory
  "watch", "listen", "play", "record", "film", "photograph", "snap", "scroll",
  "swipe", "zoom", "type", "print", "search", "browse", "charge", "plug", "unplug",
  "look", "smell", "taste", "feel", "notice", "wait", "start", "stop", "finish", "pause", "resume",
  "want", "need"
]);

// Comprehensive dictionary of nouns, objects, foods, vehicles, animals, and non-verbs
// Nouns in this set will NEVER be mistaken for verbs or converted to verb forms
export const KNOWN_NON_VERBS = new Set([
  // Vehicles & Transport
  "car", "cars", "truck", "trucks", "bus", "buses", "van", "vans", "bike", "bikes",
  "bicycle", "motorcycle", "train", "trains", "plane", "planes", "airplane", "boat",
  "boats", "ship", "ships", "tractor", "taxi", "scooter", "helicopter", "ambulance",
  "rocket", "submarine", "automobile", "wagon", "cart", "jeep", "auto", "vehicle",
  "mehran", "corolla", "civic", "honda", "toyota", "suzuki", "kia", "hyundai", "ford",
  "bmw", "audi", "mercedes",
  // Foods & Drinks
  "apple", "apples", "banana", "bananas", "orange", "oranges", "strawberry", "strawberries",
  "mango", "mangoes", "grape", "grapes", "watermelon", "pineapple", "peach", "pear",
  "plum", "cherry", "cherries", "lemon", "lime", "potato", "potatoes", "tomato", "tomatoes",
  "onion", "onions", "carrot", "carrots", "cucumber", "broccoli", "corn", "peas", "salad",
  "soup", "pizza", "burger", "burgers", "sandwich", "sandwiches", "bread", "toast", "rice",
  "pasta", "noodle", "noodles", "egg", "eggs", "cheese", "butter", "yogurt", "milk", "juice",
  "water", "tea", "coffee", "soda", "cookie", "cookies", "biscuit", "biscuits", "cake",
  "cakes", "donut", "donuts", "pastry", "chocolate", "candy", "candies", "ice cream",
  "popcorn", "chips", "snack", "snacks", "meat", "chicken", "beef", "fish", "mutton",
  "pancake", "pancakes", "waffle", "waffles", "cereal", "honey", "jam", "sauce", "ketchup",
  // Objects & Household Furniture
  "table", "tables", "chair", "chairs", "stool", "couch", "sofa", "bed", "beds", "pillow",
  "pillows", "blanket", "blankets", "sheet", "mattress", "desk", "cupboard", "wardrobe",
  "shelf", "shelves", "drawer", "drawers", "door", "doors", "window", "windows", "wall",
  "floor", "ceiling", "roof", "stairs", "lamp", "lamps", "light", "bulb", "fan", "fans",
  "mirror", "clock", "clocks", "phone", "phones", "mobile", "telephone", "computer",
  "computers", "laptop", "tablet", "ipad", "tv", "television", "remote", "charger", "cable",
  "battery", "plug", "socket", "book", "books", "notebook", "paper", "pen", "pens", "pencil",
  "pencils", "eraser", "sharpener", "ruler", "scissors", "glue", "tape", "bag", "bags",
  "backpack", "box", "boxes", "carton", "bottle", "bottles", "cup", "cups", "glass", "mug",
  "plate", "plates", "dish", "dishes", "bowl", "bowls", "spoon", "spoons", "fork", "forks",
  "knife", "knives", "pan", "pot", "kettle", "toaster", "microwave", "fridge", "freezer",
  "oven", "stove", "sink", "tap", "faucet", "bathtub", "toilet", "towel", "towels", "soap",
  "shampoo", "toothbrush", "toothpaste", "tissue", "diaper", "diapers", "bin", "trash",
  // Clothes & Wearables
  "shirt", "shirts", "t-shirt", "top", "blouse", "pants", "trousers", "jeans", "shorts",
  "leggings", "skirt", "skirts", "dress", "dresses", "sweater", "sweaters", "jumper",
  "hoodie", "cardigan", "jacket", "jackets", "coat", "coats", "raincoat", "pajamas",
  "underwear", "vest", "socks", "shoes", "boots", "sneakers", "sandals", "slippers",
  "hat", "hats", "cap", "caps", "beanie", "scarf", "gloves", "mittens", "belt", "glasses",
  "sunglasses",
  // Animals
  "dog", "dogs", "puppy", "puppies", "cat", "cats", "kitten", "kittens", "bird", "birds",
  "parrot", "pigeon", "sparrow", "duck", "ducks", "chicken", "hen", "rooster", "cow", "cows",
  "calf", "bull", "buffalo", "horse", "horses", "pony", "donkey", "sheep", "lamb", "goat",
  "pig", "pigs", "rabbit", "rabbits", "bunny", "mouse", "mice", "rat", "hamster", "elephant",
  "lion", "lions", "tiger", "tigers", "bear", "bears", "panda", "monkey", "monkeys", "ape",
  "gorilla", "giraffe", "zebra", "deer", "fox", "wolf", "camel", "hippo", "rhino", "snake",
  "lizard", "turtle", "frog", "shark", "whale", "dolphin", "octopus", "crab", "penguin",
  "seal", "bee", "ant", "spider", "butterfly",
  // Places & Buildings
  "home", "house", "houses", "apartment", "flat", "room", "rooms", "bedroom", "living room",
  "kitchen", "bathroom", "garage", "garden", "yard", "school", "schools", "classroom",
  "nursery", "office", "clinic", "hospital", "store", "stores", "shop", "shops", "supermarket",
  "mall", "restaurant", "cafe", "park", "parks", "playground", "zoo", "museum", "library",
  "cinema", "gym", "pool", "beach", "sea", "ocean", "lake", "river", "forest", "mountain",
  "mountains", "farm", "airport", "station", "street", "road", "city", "town", "village",
  // People & Family
  "mom", "mommy", "mother", "dad", "daddy", "father", "brother", "sister", "baby", "babies",
  "child", "children", "kid", "kids", "boy", "boys", "girl", "girls", "man", "men", "woman",
  "women", "grandpa", "grandma", "uncle", "aunt", "cousin", "family", "friend", "friends",
  "teacher", "teachers", "doctor", "nurse", "police", "driver", "student", "students",
  // Nature & Weather
  "sun", "moon", "star", "stars", "sky", "cloud", "clouds", "rain", "rainbow", "snow",
  "ice", "wind", "air", "fire", "sand", "stone", "rock", "rocks", "tree", "trees", "grass",
  "flower", "flowers", "leaf", "leaves",
  // Body Parts
  "head", "face", "eye", "eyes", "ear", "ears", "nose", "mouth", "teeth", "tooth",
  "tongue", "neck", "shoulder", "shoulders", "arm", "arms", "hand", "hands", "finger",
  "fingers", "thumb", "chest", "tummy", "stomach", "leg", "legs", "knee", "knees",
  "foot", "feet", "toe", "toes", "hair",
  // Colors & Adjectives
  "red", "blue", "green", "yellow", "orange", "purple", "pink", "brown", "black", "white",
  "gray", "grey", "happy", "sad", "angry", "tired", "hungry", "thirsty", "sick", "scared",
  "excited", "big", "small", "little", "hot", "cold", "fast", "slow", "good", "bad", "new",
  "old", "clean", "dirty", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten",
  // Pronouns, Prepositions & Common AAC Particles
  "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them", "my",
  "your", "his", "our", "their", "this", "that", "these", "those", "in", "on", "at", "to",
  "for", "with", "the", "a", "an", "yes", "no", "please", "thanks", "hello", "bye"
]);

/** Check if a word is a known noun or non-verb */
export function isKnownNonVerb(word: string): boolean {
  const w = (word || "").trim().toLowerCase();
  if (!w) return false;
  if (KNOWN_NON_VERBS.has(w)) return true;
  // Check plurals ending with 's' or 'es'
  if (w.endsWith("s") && KNOWN_NON_VERBS.has(w.slice(0, -1))) return true;
  if (w.endsWith("es") && KNOWN_NON_VERBS.has(w.slice(0, -2))) return true;
  // Multi-word phrases ending with a noun (e.g. "merhan car", "red apple", "toy car")
  const tokens = w.split(/\s+/);
  if (tokens.length > 1) {
    const last = tokens[tokens.length - 1];
    if (KNOWN_NON_VERBS.has(last)) return true;
  }
  return false;
}

/** Check if a word is an actual English verb */
export function isVerb(word: string): boolean {
  const clean = (word || "").trim().toLowerCase();
  if (!clean || clean.length < 2) return false;
  // If it's a known non-verb and not directly in the verb dictionary, it is NOT a verb
  if (isKnownNonVerb(clean) && !LOOKUP_MAP.has(clean)) return false;
  if (LOOKUP_MAP.has(clean)) return true;
  if (KNOWN_REGULAR_VERBS.has(clean)) return true;
  // Multi-word phrase starting with a verb (e.g. "eat apple", "go home")
  const parts = clean.split(/\s+/);
  if (parts.length > 1) {
    const first = parts[0];
    if (LOOKUP_MAP.has(first) || KNOWN_REGULAR_VERBS.has(first)) return true;
  }
  // Check stem for inflected forms (e.g. "cooking", "played")
  const root = extractRoot(clean);
  if (root !== clean && (LOOKUP_MAP.has(root) || KNOWN_REGULAR_VERBS.has(root))) {
    return true;
  }
  return false;
}

/**
 * Universal verb generator: generates 1st, 2nd, 3rd, and 4th forms
 * ONLY for genuine English verbs. Returns null if the word is a NOUN or non-verb.
 */
export function generateAllVerbForms(inputWord: string): VerbForms | null {
  const clean = (inputWord || "").trim().toLowerCase();
  if (!clean) return null;

  // 1. If it's a known noun / non-verb and not directly in the verb dictionary, return null!
  if (isKnownNonVerb(clean) && !LOOKUP_MAP.has(clean)) {
    return null;
  }

  // 2. Direct dictionary match
  const existing = getVerbForms(clean);
  if (existing) return existing;

  // 3. Known regular verb
  if (KNOWN_REGULAR_VERBS.has(clean)) {
    return conjugateRegularVerb(clean);
  }

  // 4. Multi-word phrase starting with a verb
  const parts = clean.split(/\s+/);
  if (parts.length > 1) {
    const first = parts[0];
    const rest = parts.slice(1).join(" ");
    if (LOOKUP_MAP.has(first) || KNOWN_REGULAR_VERBS.has(first)) {
      const v = getVerbForms(first) || conjugateRegularVerb(first);
      return {
        base: `${v.base} ${rest}`,
        past: `${v.past} ${rest}`,
        participle: `${v.participle} ${rest}`,
        continuous: `${v.continuous} ${rest}`,
        emoji: v.emoji,
      };
    }
  }

  // 5. Check root for inflected verbs (e.g. "cleaning" -> "clean", "eating" -> "eat", "playing" -> "play")
  const root = extractRoot(clean);
  if (root !== clean) {
    if (LOOKUP_MAP.has(root)) return getVerbForms(root);
    if (KNOWN_REGULAR_VERBS.has(root)) return conjugateRegularVerb(root);
    if (!isKnownNonVerb(root) && root.length >= 3) {
      return conjugateRegularVerb(root);
    }
  }

  // Otherwise, it's NOT a verb (e.g. "car", "apple", "merhan car") -> null!
  return null;
}

/** Check if a word is likely a verb (safe wrapper around isVerb) */
export function isLikelyVerb(word: string): boolean {
  return isVerb(word);
}

/** Returns which form the given word label is (1st, 2nd, 3rd, 4th) */
export function detectVerbForm(label: string): "1st" | "2nd" | "3rd" | "4th" | null {
  const clean = (label || "").trim().toLowerCase();
  const v = getVerbForms(clean);
  if (!v) return null;
  if (v.continuous.toLowerCase() === clean) return "4th";
  if (v.past.toLowerCase() === clean) return "2nd";
  if (v.participle.toLowerCase() === clean && v.participle.toLowerCase() !== v.past.toLowerCase()) return "3rd";
  if (v.base.toLowerCase() === clean) return "1st";
  return "1st";
}

/** Transform a verb word into a specific form (1st, 2nd, 3rd, 4th) */
export function transformVerbToForm(label: string, form: "1st" | "2nd" | "3rd" | "4th"): string {
  const v = getVerbForms(label) || generateAllVerbForms(label);
  if (!v) return label;
  switch (form) {
    case "1st":
      return v.base.charAt(0).toUpperCase() + v.base.slice(1);
    case "2nd":
      return v.past.charAt(0).toUpperCase() + v.past.slice(1);
    case "3rd":
      return v.participle.charAt(0).toUpperCase() + v.participle.slice(1);
    case "4th":
      return v.continuous.charAt(0).toUpperCase() + v.continuous.slice(1);
  }
}
