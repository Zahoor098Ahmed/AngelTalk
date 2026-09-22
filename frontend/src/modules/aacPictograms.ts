/**
 * High-definition ARASAAC pictogram dictionary for AAC communication cards and categories.
 * Maps words, compound phrases, and categories to authentic, standard AAC pictograms
 * matching TouchChat / Avaz / Proloquo tablet AAC boards.
 */

import { dictUrl } from "./imageLibrary";

function arasaac(id: number): string {
  return `https://static.arasaac.org/pictograms/${id}/${id}_500.png`;
}

export const AAC_PICTOGRAM_MAP: Record<string, string> = {
  // Category Navigation Tabs (matching tablet photo)
  tools: arasaac(2922), // Hammer
  emotion: arasaac(3250), // Happy child
  attributes: arasaac(4628), // Circles with arrow / distinct
  sentences: arasaac(3345), // Child speaking / conversation
  schools: arasaac(2526), // Blackboard & eraser
  school: arasaac(3082),
  sports: arasaac(3199), // Child kicking soccer ball
  hygiene: arasaac(2443), // Handwashing / washing
  music: arasaac(2417), // Guitar
  core: arasaac(3345), // Communication
  food: arasaac(4610), // Food tray
  people: arasaac(2392), // Family / people
  actions: arasaac(2719), // Running / action
  feelings: arasaac(3250),

  // Schools category words (exact matches from user reference photo)
  teacher: arasaac(2457), // Teacher pointing to chalkboard
  class: arasaac(9814), // Classroom with children at desks
  classroom: arasaac(9814),
  chair: arasaac(3155), // Wooden school chair
  desk: arasaac(2916), // School desk
  recess: arasaac(2859), // Playground / kids playing
  crayons: arasaac(4951), // Crayons in box
  blocks: arasaac(4921), // Alphabet toy blocks
  "fire drill": arasaac(2592), // Fire alarm bell with sound waves
  "bulletin board": arasaac(2526), // Bulletin board with notes
  "pencil sharpener": arasaac(2553), // Mechanical sharpener
  sharpener: arasaac(2553),
  slide: arasaac(4759), // Playground slide
  swing: arasaac(4608), // Playground swing set
  "sensory table": arasaac(4565), // Sand / sensory table
  pens: arasaac(2282), // Cup of pens
  pen: arasaac(2282),
  "coloured pencils": arasaac(2440), // Row of colored pencils
  "colored pencils": arasaac(2440),
  bookshelf: arasaac(3279), // Bookshelf filled with books
  cafeteria: arasaac(4587), // Cafeteria / canteen
  "main hall": arasaac(3132), // Hall / auditorium
  reception: arasaac(2353), // Front reception desk
  "school store": arasaac(4882), // School store kiosk
  counting: arasaac(2714), // Hand with numbered fingers
  book: arasaac(2450), // Open green book
  learn: arasaac(2387), // Boy reading with idea bulb
  numbers: arasaac(2879), // 1 2 3 numbers
  "flash cards": arasaac(3181), // Flash cards
  crafts: arasaac(2547), // Scissors, glue and paper

  // Sentences category (matching photo top sentence bar)
  "i need help": arasaac(4570), // Child raising hand / help
  help: arasaac(4570),
  in: arasaac(5439), // Child in box / inside
  "i want": arasaac(5441), // Want / desire
  want: arasaac(5441),
  "i feel": arasaac(30197), // Feeling / emotion
  feel: arasaac(30197),
  "can i have": arasaac(7271), // Receiving / asking
  "look at this": arasaac(2474), // Looking / eyes
  look: arasaac(2474),
  "more please": arasaac(5508), // More
  more: arasaac(5508),
  "stop please": arasaac(2499), // Stop sign
  stop: arasaac(2499),
  "go to": arasaac(2432), // Walking / go
  go: arasaac(2432),
  "thank you": arasaac(4740), // Handshake / greeting
  thanks: arasaac(4740),
  yes: arasaac(5583), // Green checkmark / affirmative
  no: arasaac(5525), // Red cross / negative
  "i am": arasaac(2617), // Pointing to self
  "where is": arasaac(3418), // Question mark
  "what is that": arasaac(3418),
  "i like": arasaac(2418), // Thumbs up / like
  like: arasaac(2418),
  "i don't like": arasaac(2245), // Dislike
  "all done": arasaac(15475), // Finish / all done
  done: arasaac(15475),

  // Tools category
  hammer: arasaac(2922),
  scissors: arasaac(2591),
  glue: arasaac(2510),
  pencil: arasaac(2440),
  ruler: arasaac(2815),
  calculator: arasaac(5419),
  tape: arasaac(2325),
  eraser: arasaac(2409),
  paperclip: arasaac(2643),
  backpack: arasaac(2475),
  bag: arasaac(2475),
  notebook: arasaac(7142),
  folder: arasaac(3233),
  tablet: arasaac(2586),
  paintbrush: arasaac(2523),
  clock: arasaac(5561),

  // Emotion category
  happy: arasaac(3250),
  sad: arasaac(2606),
  angry: arasaac(2374),
  excited: arasaac(5903),
  tired: arasaac(2314),
  scared: arasaac(2261),
  calm: arasaac(3299),
  proud: arasaac(4660),
  silly: arasaac(2854),
  frustrated: arasaac(2374),
  loved: arasaac(4558),
  sick: arasaac(3308),
  surprised: arasaac(2574),
  confused: arasaac(2352),
  shy: arasaac(2484),
  hurt: arasaac(2367),

  // Attributes category
  big: arasaac(4658),
  small: arasaac(4716),
  hot: arasaac(2300),
  cold: arasaac(4652),
  fast: arasaac(5306),
  slow: arasaac(4676),
  good: arasaac(4581),
  bad: arasaac(4690),
  clean: arasaac(3351),
  dirty: arasaac(4750),
  loud: arasaac(2647),
  quiet: arasaac(5936),
  soft: arasaac(4578),
  hard: arasaac(4629),
  open: arasaac(4549),
  closed: arasaac(4596),
  up: arasaac(5388),
  down: arasaac(5355),
  out: arasaac(5475),
  same: arasaac(4667),
  different: arasaac(4628),

  // Sports category
  soccer: arasaac(3199),
  football: arasaac(3199),
  basketball: arasaac(5078),
  running: arasaac(2719),
  swimming: arasaac(2889),
  baseball: arasaac(2514),
  tennis: arasaac(3222),
  "jump rope": arasaac(5570),
  dancing: arasaac(2652),
  dance: arasaac(2652),
  playground: arasaac(2859),
  catch: arasaac(2269),
  "ride bike": arasaac(5517),
  bicycle: arasaac(2277),
  bike: arasaac(2277),
  gymnastics: arasaac(3106),
  skateboard: arasaac(2507),
  yoga: arasaac(3299),

  // Hygiene category
  "wash hands": arasaac(2443),
  "brush teeth": arasaac(2326),
  toilet: arasaac(2430),
  shower: arasaac(2370),
  "comb hair": arasaac(2512),
  comb: arasaac(2512),
  "wash face": arasaac(4939),
  "blow nose": arasaac(2887),
  "put on clothes": arasaac(2781),
  clothes: arasaac(2781),
  "drink water": arasaac(2276),
  water: arasaac(2248),
  sleep: arasaac(2369),
  "clean up": arasaac(2658),
  bandage: arasaac(3404),

  // Music category
  sing: arasaac(2315),
  guitar: arasaac(2417),
  piano: arasaac(2521),
  drums: arasaac(2578),
  drum: arasaac(2578),
  listen: arasaac(2381),
  song: arasaac(2315),
  bell: arasaac(5938),
  trumpet: arasaac(2607),
  violin: arasaac(2615),
  headphones: arasaac(5915),

  // Core words
  i: arasaac(2617),
  you: arasaac(2608),
  please: arasaac(4570),
  come: arasaac(2742),
  here: arasaac(5382),
  where: arasaac(3418),

  // Food
  milk: arasaac(2445),
  juice: arasaac(2624),
  apple: arasaac(2462),
  banana: arasaac(2530),
  bread: arasaac(2494),
  cookie: arasaac(2402),
  rice: arasaac(2259),
  chicken: arasaac(2404),
  snack: arasaac(4695),
  pizza: arasaac(2527),
  sandwich: arasaac(2281),
  fries: arasaac(2505),
  fruit: arasaac(4653),
  // "Say It For Me" full-sentence cards — explicit direct matches so the
  // sentence's core meaning wins instead of an unrelated filler word
  // (e.g. "I want to eat" would otherwise match generic "want" before "eat").
  "i want to eat": arasaac(4610), // food tray
  "i want to drink": arasaac(2248), // water/drink
  "i need the bathroom": arasaac(2430), // toilet
  "i am happy": arasaac(3250),
  "i am sad": arasaac(2606),
  "i am in pain": arasaac(2367), // hurt
  "i want to play": arasaac(2859), // playground/recess
  "i am sleepy": arasaac(2314), // tired
  "i want to go outside": arasaac(2859), // playground/recess
  "i love you": arasaac(4558), // loved
  "i am hungry": arasaac(4695), // snack
  "i am thirsty": arasaac(2248), // water/drink
  "thank you very much": arasaac(4740), // thank you
  "please help me": arasaac(4570), // help
  "i don't feel well": arasaac(3308), // sick
  "i want my mom": dictUrl("mother") || arasaac(2392),
  "i want my dad": dictUrl("father") || arasaac(2392),
  "can we go home": arasaac(2317), // house
  "i am scared": arasaac(2261),

  girl: arasaac(2484),
  boy: arasaac(2485),
  cat: arasaac(2406),
  dog: arasaac(2517),
  table: arasaac(3129),
  house: arasaac(2317),
  car: arasaac(2339),
  bus: arasaac(2262),
};

/**
 * Get authentic vector pictogram URL for any AAC card, button or category.
 * Prioritizes high-definition ARASAAC pictograms, falls back to dictionary or word extraction.
 */
export function getPictogramUrl(label: string): string | null {
  if (!label) return null;
  const lower = label.toLowerCase().trim();

  // 1. Direct match in curated AAC pictogram map
  if (AAC_PICTOGRAM_MAP[lower]) return AAC_PICTOGRAM_MAP[lower];

  // 2. Exact match in bundled ARASAAC 14,800 dictionary
  const dictHit = dictUrl(lower);
  if (dictHit) return dictHit;

  // 3. Try individual meaningful words from a multi-word phrase
  const words = lower.split(/[\s,·\-_]+/).filter((w) => w.length > 2);
  for (const w of words) {
    if (AAC_PICTOGRAM_MAP[w]) return AAC_PICTOGRAM_MAP[w];
    const hit = dictUrl(w);
    if (hit) return hit;
  }

  return null;
}
