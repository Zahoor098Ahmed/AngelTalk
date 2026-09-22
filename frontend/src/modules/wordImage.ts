import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Offline visual resolution for generated words.
 *
 * v1 renders a matching emoji glyph (bundled, zero-latency, offline).
 * `generateImageForWord` is the seam for a real image source: set an
 * ImageProvider (API key + budget) and it is used and cached transparently —
 * every screen keeps calling the same function.
 */

const EMOJI: Record<string, string> = {
  // animals
  cat: "🐱", dog: "🐶", rabbit: "🐰", bunny: "🐰", horse: "🐴", cow: "🐮", pig: "🐷", sheep: "🐑", goat: "🐐",
  lion: "🦁", tiger: "🐯", bear: "🐻", panda: "🐼", koala: "🐨", monkey: "🐵", gorilla: "🦍", elephant: "🐘",
  giraffe: "🦒", zebra: "🦓", deer: "🦌", fox: "🦊", wolf: "🐺", raccoon: "🦝", hedgehog: "🦔", bat: "🦇",
  kangaroo: "🦘", camel: "🐫", llama: "🦙", buffalo: "🐃", ox: "🐂", rhino: "🦏", rhinoceros: "🦏", hippo: "🦛",
  mouse: "🐭", rat: "🐀", hamster: "🐹", squirrel: "🐿️", chicken: "🐔", rooster: "🐓", chick: "🐤", bird: "🐦",
  penguin: "🐧", owl: "🦉", eagle: "🦅", duck: "🦆", swan: "🦢", peacock: "🦚", parrot: "🦜", flamingo: "🦩",
  turkey: "🦃", dove: "🕊️", fish: "🐟", shark: "🦈", whale: "🐋", dolphin: "🐬", octopus: "🐙", squid: "🦑",
  crab: "🦀", lobster: "🦞", shrimp: "🦐", turtle: "🐢", snake: "🐍", lizard: "🦎", crocodile: "🐊", frog: "🐸",
  snail: "🐌", butterfly: "🦋", bug: "🐛", caterpillar: "🐛", ant: "🐜", bee: "🐝", ladybug: "🐞", spider: "🕷️",
  scorpion: "🦂", mosquito: "🦟", worm: "🪱", dinosaur: "🦕", dragon: "🐉", seal: "🦭",
  // fruits
  apple: "🍎", pear: "🍐", orange: "🍊", lemon: "🍋", lime: "🍈", banana: "🍌", watermelon: "🍉", melon: "🍈",
  grape: "🍇", grapes: "🍇", strawberry: "🍓", blueberry: "🫐", blackberry: "🫐", raspberry: "🍓", cherry: "🍒",
  cherries: "🍒", peach: "🍑", apricot: "🍑", mango: "🥭", pineapple: "🍍", coconut: "🥥", kiwi: "🥝",
  papaya: "🥭", fig: "🍇", plum: "🍑", pomegranate: "🍎", tomato: "🍅", avocado: "🥑",
  // vegetables
  carrot: "🥕", potato: "🥔", "sweet potato": "🍠", corn: "🌽", broccoli: "🥦", cauliflower: "🥦", cucumber: "🥒",
  "bell pepper": "🫑", pepper: "🌶️", chili: "🌶️", onion: "🧅", garlic: "🧄", ginger: "🫚", mushroom: "🍄",
  peanut: "🥜", peas: "🫛", beans: "🫘", eggplant: "🍆", lettuce: "🥬", spinach: "🥬", cabbage: "🥬",
  celery: "🥬", pumpkin: "🎃", radish: "🥕", turnip: "🥔", zucchini: "🥒",
  // food
  bread: "🍞", croissant: "🥐", baguette: "🥖", pretzel: "🥨", bagel: "🥯", pancake: "🥞", waffle: "🧇", cheese: "🧀",
  egg: "🥚", "fried egg": "🍳", bacon: "🥓", burger: "🍔", fries: "🍟", pizza: "🍕", hotdog: "🌭", sandwich: "🥪",
  taco: "🌮", burrito: "🌯", salad: "🥗", pasta: "🍝", spaghetti: "🍝", ramen: "🍜", soup: "🍲", rice: "🍚",
  sushi: "🍣", "ice cream": "🍦", donut: "🍩", cookie: "🍪", cake: "🍰", cupcake: "🧁", pie: "🥧", chocolate: "🍫",
  candy: "🍬", lollipop: "🍭", honey: "🍯", popcorn: "🍿", milk: "🥛", coffee: "☕", tea: "🍵", juice: "🧃",
  water: "💧", yogurt: "🥛",
  // colors (swatches)
  red: "🟥", "orange color": "🟧", yellow: "🟨", green: "🟩", blue: "🟦", purple: "🟪", brown: "🟫", black: "⬛",
  white: "⬜", pink: "🌸", gray: "🩶", grey: "🩶",
  // shapes
  circle: "⭕", square: "🟦", triangle: "🔺", rectangle: "🟨", star: "⭐", heart: "❤️", diamond: "🔷", oval: "🥚",
  pentagon: "⬠", hexagon: "⬡",
  // vehicles
  car: "🚗", taxi: "🚕", bus: "🚌", truck: "🚚", van: "🚐", "police car": "🚓", ambulance: "🚑", "fire truck": "🚒",
  tractor: "🚜", motorcycle: "🏍️", bike: "🚲", bicycle: "🚲", scooter: "🛴", train: "🚆", tram: "🚊", subway: "🚇",
  airplane: "✈️", plane: "✈️", helicopter: "🚁", rocket: "🚀", ship: "🚢", boat: "⛵", sailboat: "⛵", canoe: "🛶",
  submarine: "🚢",
  // body parts
  eye: "👁️", eyes: "👀", ear: "👂", nose: "👃", mouth: "👄", tongue: "👅", tooth: "🦷", teeth: "🦷", hand: "✋",
  foot: "🦶", leg: "🦵", arm: "💪", knee: "🦵", elbow: "💪", shoulder: "🧍", back: "🧍", chin: "😶", neck: "🧣",
  finger: "👆", toe: "🦶", brain: "🧠", bone: "🦴", backbone: "🦴", hair: "💇", face: "🙂", head: "🗣️",
  // clothes
  shirt: "👕", "t-shirt": "👕", pants: "👖", jeans: "👖", dress: "👗", skirt: "👗", shorts: "🩳", coat: "🧥",
  jacket: "🧥", sweater: "🧶", pajamas: "🩱", socks: "🧦", shoes: "👟", shoe: "👞", boots: "🥾", sandals: "🩴",
  hat: "🧢", cap: "🧢", crown: "👑", glasses: "👓", scarf: "🧣", gloves: "🧤", backpack: "🎒", ring: "💍",
  // weather / nature
  sun: "☀️", sunny: "☀️", cloud: "☁️", cloudy: "☁️", rain: "🌧️", snow: "❄️", snowman: "⛄", storm: "⛈️",
  lightning: "⚡", rainbow: "🌈", wind: "🌬️", tornado: "🌪️", fog: "🌫️", hot: "🥵", cold: "🥶", moon: "🌙",
  earth: "🌍", fire: "🔥", tree: "🌳", flower: "🌼", rose: "🌹", tulip: "🌷", sunflower: "🌻", leaf: "🍃",
  grass: "🌿", cactus: "🌵", seed: "🌰", seeds: "🌰", sprout: "🌱", plant: "🪴", mountain: "⛰️", ocean: "🌊",
  // family / people
  baby: "👶", boy: "👦", girl: "👧", man: "👨", woman: "👩", mother: "👩", mom: "👩", father: "👨", dad: "👨",
  grandma: "👵", grandpa: "👴", brother: "👦", sister: "👧", aunt: "👩", uncle: "👨", cousin: "🧑", family: "👪",
  friend: "🧑‍🤝‍🧑", teacher: "🧑‍🏫", doctor: "🧑‍⚕️", nurse: "🧑‍⚕️", dentist: "🦷", vet: "🧑‍⚕️", police: "👮",
  "police officer": "👮", firefighter: "🧑‍🚒", farmer: "🧑‍🌾", chef: "🧑‍🍳", cook: "🧑‍🍳", baker: "🧑‍🍳",
  artist: "🧑‍🎨", pilot: "🧑‍✈️", astronaut: "🧑‍🚀", scientist: "🧑‍🔬", waiter: "🧑‍🍳", king: "🤴", queen: "👸",
  // school / objects
  book: "📖", notebook: "📓", pencil: "✏️", pen: "🖊️", crayon: "🖍️", marker: "🖊️", eraser: "🧽", ruler: "📏",
  scissors: "✂️", glue: "🧴", folder: "📁", paint: "🎨", clock: "🕐", calendar: "📅", ball: "⚽", bell: "🔔",
  key: "🔑", lamp: "💡", phone: "📱", computer: "💻", television: "📺", tv: "📺", camera: "📷",
  // instruments
  guitar: "🎸", piano: "🎹", drum: "🥁", trumpet: "🎺", violin: "🎻", flute: "🪈", saxophone: "🎷", harp: "🎵",
  xylophone: "🎹",
  // furniture
  bed: "🛏️", chair: "🪑", table: "🪑", desk: "🪑", couch: "🛋️", sofa: "🛋️", dresser: "🗄️", bookshelf: "📚",
  mirror: "🪞", wardrobe: "🚪", door: "🚪", window: "🪟", house: "🏠", school: "🏫", hospital: "🏥",
  // sports
  soccer: "⚽", football: "🏈", basketball: "🏀", baseball: "⚾", tennis: "🎾", volleyball: "🏐", rugby: "🏉",
  cricket: "🏏", hockey: "🏒", golf: "⛳", bowling: "🎳", boxing: "🥊", swimming: "🏊", running: "🏃",
  cycling: "🚴", skating: "⛸️", skiing: "⛷️", surfing: "🏄", climbing: "🧗", dancing: "💃",
  // feelings
  happy: "😀", sad: "😢", angry: "😠", scared: "😨", surprised: "😲", sleepy: "😴", sick: "🤢", loved: "🥰",
  love: "🥰", cry: "😭", laugh: "😂", worried: "😟", calm: "😌", shy: "😳", proud: "😌", bored: "😑", excited: "🤩",
  // actions
  clap: "👏", climb: "🧗", dance: "💃", draw: "✏️", drink: "🥤", eat: "🍽️", jump: "🤸", kick: "🦵", listen: "👂",
  play: "🎯", read: "📖", run: "🏃", sing: "🎤", sit: "🪑", sleep: "😴", stand: "🧍", swim: "🏊", talk: "🗣️",
  walk: "🚶", wave: "👋", write: "✍️",
  // days / months
  monday: "1️⃣", tuesday: "2️⃣", wednesday: "3️⃣", thursday: "4️⃣", friday: "5️⃣", saturday: "6️⃣", sunday: "7️⃣",
  january: "❄️", february: "💝", march: "🌱", april: "🌧️", may: "🌸", june: "☀️", july: "🎆", august: "🏖️",
  september: "🍂", october: "🎃", november: "🍁", december: "🎄",
};

const NUMBER_WORDS: Record<string, string> = {
  one: "1️⃣", two: "2️⃣", three: "3️⃣", four: "4️⃣", five: "5️⃣", six: "6️⃣", seven: "7️⃣", eight: "8️⃣", nine: "9️⃣",
  ten: "🔟", zero: "0️⃣",
};

const FALLBACKS = ["🔹", "🟢", "🔶", "🟣", "🔵", "🟡"];

function norm(w: string): string {
  return w.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "");
}

/** Best-effort emoji for a word. Never throws; always returns something. */
export function resolveEmoji(word: string, index = 0): string {
  const n = norm(word);
  if (!n) return FALLBACKS[index % FALLBACKS.length];
  if (EMOJI[n]) return EMOJI[n];
  if (NUMBER_WORDS[n]) return NUMBER_WORDS[n];

  if (n.endsWith("es") && EMOJI[n.slice(0, -2)]) return EMOJI[n.slice(0, -2)];
  if (n.endsWith("s") && EMOJI[n.slice(0, -1)]) return EMOJI[n.slice(0, -1)];

  const parts = n.split(/\s+/);
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    if (EMOJI[last]) return EMOJI[last];
    if (EMOJI[last.replace(/s$/, "")]) return EMOJI[last.replace(/s$/, "")];
  }

  const hit = Object.keys(EMOJI).find((k) => k.includes(n) || n.includes(k));
  if (hit) return EMOJI[hit];

  return FALLBACKS[index % FALLBACKS.length];
}

/** Rotate to a different plausible glyph when "regenerate" is tapped. */
export function nextEmojiVariant(word: string, current: string): string {
  const primary = resolveEmoji(word);
  const pool = [primary, ...FALLBACKS, "🖼️", "🎴", "🏷️"];
  const idx = pool.indexOf(current);
  return pool[(idx + 1) % pool.length];
}

// --- Image generation seam ------------------------------------------------

const IMG_CACHE_KEY = "kiddocare_image_cache";
let imgCache: Record<string, string> = {};
let imgLoaded = false;

async function ensureImgCache() {
  if (imgLoaded) return;
  try {
    const raw = await AsyncStorage.getItem(IMG_CACHE_KEY);
    imgCache = raw ? JSON.parse(raw) : {};
  } catch {
    imgCache = {};
  }
  imgLoaded = true;
}

export interface ImageProvider {
  generate(prompt: string, styleGuide: string): Promise<string | null>;
}

let provider: ImageProvider | null = null;
export function setImageProvider(p: ImageProvider | null) {
  provider = p;
}

export const SENSORY_STYLE_GUIDE =
  "Flat matte children's illustration, single centered subject, plain white background, " +
  "soft calm colors, no gloss, no reflections, no 3D shine, no background scene, consistent style.";

/** Cache-first image lookup. Returns undefined when no provider is configured. */
export async function generateImageForWord(word: string): Promise<string | undefined> {
  await ensureImgCache();
  const key = norm(word);
  if (imgCache[key]) return imgCache[key];
  if (!provider) return undefined;
  try {
    const uri = await provider.generate(`${word}. ${SENSORY_STYLE_GUIDE}`, SENSORY_STYLE_GUIDE);
    if (uri) {
      imgCache[key] = uri;
      AsyncStorage.setItem(IMG_CACHE_KEY, JSON.stringify(imgCache)).catch(() => {});
      return uri;
    }
  } catch {
    /* fall through to emoji */
  }
  return undefined;
}

export function hasImageProvider(): boolean {
  return provider !== null;
}
