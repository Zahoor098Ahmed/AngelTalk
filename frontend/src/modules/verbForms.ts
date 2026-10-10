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
  // Additional Complete A-Z Verbs
  { base: "agree", past: "agreed", participle: "agreed", continuous: "agreeing", emoji: "🤝" },
  { base: "arrive", past: "arrived", participle: "arrived", continuous: "arriving", emoji: "🛬" },
  { base: "be", past: "was", participle: "been", continuous: "being", emoji: "✨" },
  { base: "call", past: "called", participle: "called", continuous: "calling", emoji: "📞" },
  { base: "dream", past: "dreamed", participle: "dreamed", continuous: "dreaming", emoji: "💭" },
  { base: "enter", past: "entered", participle: "entered", continuous: "entering", emoji: "🚪" },
  { base: "explain", past: "explained", participle: "explained", continuous: "explaining", emoji: "🗣️" },
  { base: "imagine", past: "imagined", participle: "imagined", continuous: "imagining", emoji: "🌈" },
  { base: "introduce", past: "introduced", participle: "introduced", continuous: "introducing", emoji: "🤝" },
  { base: "invite", past: "invited", participle: "invited", continuous: "inviting", emoji: "✉️" },
  { base: "join", past: "joined", participle: "joined", continuous: "joining", emoji: "🤝" },
  { base: "jog", past: "jogged", participle: "jogged", continuous: "jogging", emoji: "🏃" },
  { base: "knock", past: "knocked", participle: "knocked", continuous: "knocking", emoji: "🚪" },
  { base: "move", past: "moved", participle: "moved", continuous: "moving", emoji: "📦" },
  { base: "nod", past: "nodded", participle: "nodded", continuous: "nodding", emoji: "👍" },
  { base: "notice", past: "noticed", participle: "noticed", continuous: "noticing", emoji: "👁️" },
  { base: "order", past: "ordered", participle: "ordered", continuous: "ordering", emoji: "📝" },
  { base: "point", past: "pointed", participle: "pointed", continuous: "pointing", emoji: "👉" },
  { base: "quit", past: "quit", participle: "quit", continuous: "quitting", emoji: "⏹️" },
  { base: "question", past: "questioned", participle: "questioned", continuous: "questioning", emoji: "❓" },
  { base: "try", past: "tried", participle: "tried", continuous: "trying", emoji: "🎯" },
  { base: "turn", past: "turned", participle: "turned", continuous: "turning", emoji: "🔄" },
  { base: "understand", past: "understood", participle: "understood", continuous: "understanding", emoji: "💡" },
  { base: "use", past: "used", participle: "used", continuous: "using", emoji: "📱" },
  { base: "visit", past: "visited", participle: "visited", continuous: "visiting", emoji: "🚗" },
  { base: "view", past: "viewed", participle: "viewed", continuous: "viewing", emoji: "👓" },
  { base: "wish", past: "wished", participle: "wished", continuous: "wishing", emoji: "⭐" },
  { base: "work", past: "worked", participle: "worked", continuous: "working", emoji: "💼" },
  { base: "x-ray", past: "x-rayed", participle: "x-rayed", continuous: "x-raying", emoji: "🩻" },
  { base: "yawn", past: "yawned", participle: "yawned", continuous: "yawning", emoji: "🥱" },
  { base: "yell", past: "yelled", participle: "yelled", continuous: "yelling", emoji: "📢" },
  { base: "zip", past: "zipped", participle: "zipped", continuous: "zipping", emoji: "🤐" },
  { base: "zoom", past: "zoomed", participle: "zoomed", continuous: "zooming", emoji: "🏎️" },
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
  // s / es forms: is -> be, has -> have, cries -> cry
  const irregularS: Record<string, string> = { is: "be", has: "have", does: "do", goes: "go" };
  if (irregularS[w]) return irregularS[w];
  if (w.endsWith("ies") && w.length > 4) {
    const yForm = w.slice(0, -3) + "y";
    if (LOOKUP_MAP.has(yForm) || KNOWN_REGULAR_VERBS.has(yForm)) return yForm;
  }
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
  // A
  "accept", "achieve", "acquire", "act", "adapt", "add", "address", "adjust", "admire", "admit",
  "adopt", "advance", "advise", "afford", "agree", "alert", "allow", "alter", "amaze", "amuse",
  "analyze", "announce", "annoy", "answer", "apologize", "appear", "applaud", "apply", "appoint",
  "appreciate", "approach", "approve", "argue", "arrange", "arrest", "arrive", "ask", "assist",
  "assume", "assure", "astonish", "attach", "attack", "attempt", "attend", "attract", "avoid", "awake",
  // B
  "back", "bake", "balance", "ban", "bark", "bathe", "battle", "beam", "beg", "behave", "belong",
  "blame", "bleed", "bless", "blind", "blink", "block", "bloom", "blot", "blow", "blush", "boast",
  "boil", "bolt", "bomb", "book", "boost", "borrow", "bother", "bounce", "bow", "box", "brake",
  "branch", "breathe", "brush", "bubble", "build", "bump", "burn", "bury", "buzz",
  // C
  "calculate", "call", "calm", "camp", "care", "carry", "carve", "cause", "celebrate", "challenge",
  "change", "charge", "chase", "cheat", "check", "cheer", "chew", "choke", "chop", "claim", "clap",
  "clean", "clear", "click", "climb", "cling", "clip", "close", "coach", "coil", "collect", "color",
  "comb", "combine", "comfort", "command", "communicate", "compare", "compete", "complain",
  "complete", "concentrate", "concern", "conclude", "conduct", "confess", "confirm", "confuse",
  "connect", "consider", "consist", "contain", "continue", "control", "convert", "cook", "cool",
  "cope", "copy", "correct", "cough", "count", "cover", "crack", "crash", "crawl", "cross",
  "crush", "cry", "cure", "curl", "curve", "cycle",
  // D
  "damage", "dance", "dare", "decay", "deceive", "decide", "declare", "decorate", "decrease",
  "delay", "delight", "deliver", "demand", "demonstrate", "depend", "describe", "desert", "deserve",
  "design", "destroy", "detect", "determine", "develop", "dial", "dictate", "differ", "direct",
  "disagree", "disappear", "disappoint", "discover", "discuss", "dislike", "display", "distribute",
  "dive", "divide", "divorce", "dock", "doubt", "drag", "drain", "draw", "dream", "dress",
  "drip", "drop", "drown", "drum", "dry", "dust",
  // E
  "earn", "echo", "educate", "embarrass", "employ", "empty", "encourage", "end", "enjoy", "enter",
  "entertain", "escape", "examine", "excite", "excuse", "exercise", "exist", "expand", "expect",
  "experience", "explain", "explode", "explore", "express", "extend",
  // F
  "face", "fade", "fail", "faint", "fasten", "favor", "fax", "fear", "fence", "fetch", "file",
  "fill", "film", "filter", "finish", "fire", "fish", "fit", "fix", "flap", "flash", "float",
  "flood", "flow", "flower", "fold", "follow", "fool", "force", "form", "found", "frame",
  "frighten", "fry",
  // G
  "gather", "gaze", "generate", "glow", "glue", "grab", "grade", "graduate", "grant", "grate",
  "grease", "greet", "grin", "grip", "groan", "guarantee", "guard", "guess", "guide",
  // H
  "hammer", "hand", "handle", "hang", "happen", "harass", "harm", "harness", "hate", "haunt",
  "heal", "heat", "help", "hint", "hire", "hiss", "hook", "hop", "hope", "horn", "hover",
  "hug", "hum", "hunt", "hurry",
  // I
  "identify", "ignore", "illuminate", "imagine", "imitate", "impress", "improve", "include",
  "increase", "indicate", "influence", "inform", "inject", "injure", "instruct", "intend",
  "interest", "interfere", "interrupt", "introduce", "invent", "invite", "iron", "irritate", "itch",
  // J
  "jail", "jam", "jog", "join", "joke", "judge", "juggle", "jump",
  // K
  "kick", "kiss", "kneel", "knit", "knock", "knot",
  // L
  "label", "land", "last", "laugh", "launch", "learn", "level", "lick", "lighten", "like",
  "limit", "link", "list", "listen", "live", "load", "locate", "lock", "long", "look", "love",
  // M
  "mail", "manage", "march", "mark", "marry", "match", "mate", "matter", "measure", "meddle",
  "melt", "memorize", "mend", "mention", "mess", "milk", "mine", "miss", "mix", "moan", "mop",
  "mourn", "move", "muddle", "multiply", "murder",
  // N
  "nail", "name", "need", "nest", "nod", "note", "notice", "number",
  // O
  "obey", "object", "observe", "obtain", "occupy", "occur", "offend", "offer", "open", "operate",
  "order", "organize", "overflow", "owe", "own",
  // P
  "pack", "paddle", "paint", "park", "part", "pass", "paste", "pat", "pause", "pedal", "peel",
  "peep", "perform", "permit", "phone", "photograph", "pick", "pinch", "pine", "place", "plan",
  "plant", "play", "please", "plug", "point", "poke", "polish", "pop", "possess", "post",
  "pour", "practice", "praise", "pray", "preach", "precede", "prefer", "prepare", "present",
  "preserve", "press", "pretend", "prevent", "prick", "print", "produce", "program", "promise",
  "protect", "provide", "pull", "pump", "punch", "punish", "push",
  // Q
  "question", "queue", "quit",
  // R
  "race", "radiate", "rain", "raise", "reach", "realize", "receive", "recognize", "record",
  "reduce", "reflect", "refuse", "regret", "reign", "reject", "rejoice", "relax", "release",
  "rely", "remain", "remember", "remind", "remove", "repair", "repeat", "replace", "reply",
  "report", "represent", "reproduce", "request", "rescue", "resolve", "respond", "rest",
  "restore", "retire", "return", "reveal", "rhyme", "rinse", "risk", "rob", "rock", "roll",
  "rot", "rub", "ruin", "rule", "rush",
  // S
  "sack", "sail", "satisfy", "save", "saw", "scare", "scatter", "scold", "scorch", "scrape",
  "scratch", "scream", "screw", "scribble", "scrub", "seal", "search", "secure", "select",
  "separate", "serve", "settle", "shade", "share", "shave", "shelter", "shiver", "shock",
  "shop", "shout", "show", "shrug", "sigh", "sign", "signal", "sin", "sip", "ski", "skip",
  "slap", "slip", "slow", "smash", "smell", "smile", "smoke", "snap", "snatch", "sneeze",
  "sniff", "snore", "snow", "soak", "solve", "soothe", "sound", "spare", "spark", "sparkle",
  "spell", "spill", "spoil", "spot", "spray", "sprout", "squash", "squeak", "squeal",
  "squeeze", "stain", "stamp", "stare", "start", "stay", "steer", "step", "stir", "stitch",
  "stop", "store", "strap", "strengthen", "stretch", "strip", "stroke", "stuff", "subtract",
  "succeed", "suck", "suffer", "suggest", "suit", "supply", "support", "suppose", "surprise",
  "surround", "suspect", "suspend", "switch",
  // T
  "talk", "tame", "tap", "taste", "tease", "telephone", "tempt", "terrify", "test", "thank",
  "thaw", "tick", "tickle", "tie", "time", "tip", "tire", "touch", "tour", "tow", "trace",
  "trade", "train", "transport", "trap", "travel", "treat", "tremble", "trick", "trip",
  "trot", "trouble", "trust", "try", "tug", "tumble", "turn", "twist", "type",
  // U
  "undress", "unfasten", "unlock", "unpack", "untidy", "use",
  // V
  "vanish", "visit",
  // W
  "wail", "wait", "walk", "wander", "want", "warm", "warn", "wash", "waste", "watch", "water",
  "wave", "weigh", "welcome", "whine", "whip", "whirl", "whisper", "whistle", "wink", "wipe",
  "wish", "wobble", "wonder", "work", "worry", "wrap", "wreck", "wrestle",
  // Y
  "yawn", "yell",
  // Z
  "zip", "zoom"
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
  // Abstract / noun suffixes (unless in lookup or known regular verbs)
  if (w.length > 5 && !LOOKUP_MAP.has(w) && !KNOWN_REGULAR_VERBS.has(w)) {
    if (
      w.endsWith("tion") || w.endsWith("sion") || w.endsWith("ness") ||
      w.endsWith("ment") || w.endsWith("ity") || w.endsWith("hood") ||
      w.endsWith("ship") || w.endsWith("ism") || w.endsWith("ist")
    ) {
      return true;
    }
  }
  return false;
}

/** Check if a word is an actual English verb */
export function isVerb(word: string): boolean {
  const clean = (word || "").trim().toLowerCase();
  if (!clean || clean.length < 2) return false;
  // If it's a known non-verb and not directly in the verb dictionary, it is NOT a verb
  if (isKnownNonVerb(clean) && !LOOKUP_MAP.has(clean) && !KNOWN_REGULAR_VERBS.has(clean)) return false;
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
  if (generateAllVerbForms(clean) !== null) return true;
  return false;
}

/**
 * Universal verb generator: generates 1st, 2nd, 3rd, and 4th forms
 * ONLY for genuine English verbs. Returns null if the word is a NOUN or non-verb.
 */
export function generateAllVerbForms(inputWord: string): VerbForms | null {
  const clean = (inputWord || "").trim().toLowerCase();
  if (!clean || clean.length < 2) return null;

  // 1. If it's a known noun / non-verb and not directly in the verb dictionary, return null!
  if (isKnownNonVerb(clean) && !LOOKUP_MAP.has(clean) && !KNOWN_REGULAR_VERBS.has(clean)) {
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

  // 6. If word ends with continuous -ing (e.g. "zooming", "zipping", "accepting")
  if (clean.endsWith("ing") && clean.length > 4) {
    const stem = clean.slice(0, -3);
    const candidate = stem.endsWith("y") ? stem : (stem.length >= 3 ? stem : stem + "e");
    if (!isKnownNonVerb(candidate)) {
      return conjugateRegularVerb(candidate);
    }
  }

  // Otherwise, it's NOT a verb (e.g. "car", "apple", "merhan car") -> null!
  return null;
}

/** Check if a word is likely a verb (safe wrapper around isVerb) */
export function isLikelyVerb(word: string): boolean {
  return isVerb(word);
}

// Base (1st form) verbs that themselves end in "-ing" and must NOT be treated as 4th form
const BASE_ING_VERBS = new Set([
  "sing", "bring", "ring", "swing", "sting", "cling", "fling", "sling", "spring", "string", "wring",
]);

/**
 * True when the label is a 4th form (-ing) word. Base verbs that happen to end
 * in "ing" (sing, bring, ring, swing...) return false.
 */
export function isContinuousForm(label: string): boolean {
  const clean = (label || "").trim().toLowerCase();
  if (!clean.endsWith("ing")) return false;
  const first = clean.split(/\s+/)[0];
  if (BASE_ING_VERBS.has(first)) return false;
  const v = LOOKUP_MAP.get(first);
  if (v && v.base.toLowerCase() === first) return false;
  return true;
}

/** Returns which form the given word label is (1st, 2nd, 3rd, 4th) */
export function detectVerbForm(label: string): "1st" | "2nd" | "3rd" | "4th" | null {
  const clean = (label || "").trim().toLowerCase();
  if (!clean) return null;
  if (isContinuousForm(clean)) return "4th";
  const v = getVerbForms(clean) || generateAllVerbForms(clean);
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

const S_FORM_IRREGULAR: Record<string, string> = { be: "is", have: "has", do: "does", go: "goes" };

/** The "s / es" form of a verb (he/she/it): agree -> agrees, watch -> watches, cry -> cries, have -> has. */
export function sFormOf(base: string): string {
  const clean = (base || "").trim();
  if (!clean) return clean;
  const [first, ...rest] = clean.split(/\s+/);
  const w = first.toLowerCase();
  let s: string;
  if (S_FORM_IRREGULAR[w]) s = S_FORM_IRREGULAR[w];
  else if (/(s|x|z|ch|sh|o)$/.test(w)) s = w + "es";
  else if (/[^aeiou]y$/.test(w)) s = w.slice(0, -1) + "ies";
  else s = w + "s";
  return [s, ...rest].join(" ");
}
