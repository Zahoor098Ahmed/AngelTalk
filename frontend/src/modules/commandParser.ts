import type { ParsedCategoryCommand } from "../types";

/**
 * On-device parsing for the Category Builder. No network / LLM: a rule-based
 * reader for commands like "make a category of animals with 40 animals" plus
 * curated seed lists so a voice command alone can populate a real category.
 */

export const SEED_LISTS: Record<string, { title: string; items: string[] }> = {
  animals: {
    title: "Animals",
    items: [
      "Ant", "Bear", "Bee", "Bird", "Butterfly", "Camel", "Cat", "Chicken", "Cow", "Crab",
      "Crocodile", "Deer", "Dog", "Dolphin", "Donkey", "Duck", "Eagle", "Elephant", "Fish", "Fox",
      "Frog", "Giraffe", "Goat", "Gorilla", "Hedgehog", "Hippo", "Horse", "Kangaroo", "Koala", "Ladybug",
      "Lion", "Lizard", "Monkey", "Mouse", "Octopus", "Owl", "Panda", "Parrot", "Penguin", "Pig",
      "Rabbit", "Raccoon", "Rhino", "Rooster", "Seal", "Shark", "Sheep", "Snail", "Snake", "Spider",
      "Squirrel", "Swan", "Tiger", "Turtle", "Whale", "Wolf", "Zebra",
    ],
  },
  fruits: {
    title: "Fruits",
    items: [
      "Apple", "Apricot", "Avocado", "Banana", "Blackberry", "Blueberry", "Cherry", "Coconut", "Fig", "Grape",
      "Kiwi", "Lemon", "Lime", "Mango", "Melon", "Orange", "Papaya", "Peach", "Pear", "Pineapple",
      "Plum", "Pomegranate", "Raspberry", "Strawberry", "Watermelon",
    ],
  },
  vegetables: {
    title: "Vegetables",
    items: [
      "Broccoli", "Cabbage", "Carrot", "Cauliflower", "Celery", "Corn", "Cucumber", "Eggplant", "Garlic", "Ginger",
      "Lettuce", "Mushroom", "Onion", "Peas", "Pepper", "Potato", "Pumpkin", "Radish", "Spinach", "Tomato",
      "Turnip", "Zucchini",
    ],
  },
  colors: {
    title: "Colors",
    items: ["Red", "Orange", "Yellow", "Green", "Blue", "Purple", "Pink", "Brown", "Black", "White", "Gray"],
  },
  shapes: {
    title: "Shapes",
    items: ["Circle", "Square", "Triangle", "Rectangle", "Oval", "Star", "Heart", "Diamond", "Pentagon", "Hexagon"],
  },
  vehicles: {
    title: "Vehicles",
    items: [
      "Airplane", "Ambulance", "Bicycle", "Boat", "Bus", "Car", "Fire truck", "Helicopter", "Motorcycle", "Police car",
      "Rocket", "Sailboat", "Scooter", "Ship", "Submarine", "Taxi", "Tractor", "Train", "Tram", "Truck", "Van",
    ],
  },
  "body parts": {
    title: "Body Parts",
    items: [
      "Arm", "Back", "Chin", "Ear", "Elbow", "Eye", "Face", "Finger", "Foot", "Hair",
      "Hand", "Head", "Knee", "Leg", "Mouth", "Neck", "Nose", "Shoulder", "Toe", "Tooth",
    ],
  },
  clothes: {
    title: "Clothes",
    items: [
      "Boots", "Cap", "Coat", "Dress", "Gloves", "Hat", "Jacket", "Jeans", "Pajamas", "Pants",
      "Scarf", "Shirt", "Shoes", "Shorts", "Skirt", "Socks", "Sweater", "T-shirt",
    ],
  },
  weather: {
    title: "Weather",
    items: ["Cloudy", "Cold", "Fog", "Hot", "Lightning", "Rain", "Rainbow", "Snow", "Storm", "Sunny", "Wind"],
  },
  family: {
    title: "Family",
    items: ["Baby", "Brother", "Dad", "Grandma", "Grandpa", "Mom", "Sister", "Aunt", "Uncle", "Cousin"],
  },
  jobs: {
    title: "Jobs",
    items: [
      "Artist", "Astronaut", "Baker", "Chef", "Dentist", "Doctor", "Farmer", "Firefighter", "Nurse", "Pilot",
      "Police officer", "Scientist", "Teacher", "Vet", "Waiter",
    ],
  },
  food: {
    title: "Food",
    items: [
      "Bread", "Burger", "Cake", "Cheese", "Cookie", "Egg", "Fries", "Ice cream", "Milk", "Pancake",
      "Pasta", "Pizza", "Rice", "Salad", "Sandwich", "Soup", "Sushi", "Taco", "Waffle", "Yogurt",
    ],
  },
  sports: {
    title: "Sports",
    items: [
      "Baseball", "Basketball", "Boxing", "Cricket", "Cycling", "Golf", "Hockey", "Running", "Skating", "Skiing",
      "Soccer", "Surfing", "Swimming", "Tennis", "Volleyball",
    ],
  },
  instruments: {
    title: "Instruments",
    items: ["Drum", "Flute", "Guitar", "Harp", "Piano", "Saxophone", "Trumpet", "Violin", "Xylophone"],
  },
  "school supplies": {
    title: "School Supplies",
    items: ["Backpack", "Book", "Crayon", "Eraser", "Folder", "Glue", "Marker", "Notebook", "Pen", "Pencil", "Ruler", "Scissors"],
  },
  furniture: {
    title: "Furniture",
    items: ["Bed", "Bookshelf", "Chair", "Couch", "Desk", "Dresser", "Lamp", "Mirror", "Table", "Wardrobe"],
  },
  feelings: {
    title: "Feelings",
    items: ["Angry", "Bored", "Calm", "Excited", "Happy", "Loved", "Proud", "Sad", "Scared", "Shy", "Sick", "Sleepy", "Surprised", "Worried"],
  },
  actions: {
    title: "Actions",
    items: [
      "Clap", "Climb", "Dance", "Draw", "Drink", "Eat", "Jump", "Kick", "Laugh", "Listen",
      "Play", "Read", "Run", "Sing", "Sit", "Sleep", "Stand", "Swim", "Talk", "Walk", "Wave", "Write",
    ],
  },
  days: {
    title: "Days of the Week",
    items: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  },
  months: {
    title: "Months",
    items: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ],
  },
};

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, hundred: 100,
};

export function seedKeys(): { key: string; title: string; count: number }[] {
  return Object.entries(SEED_LISTS).map(([key, v]) => ({ key, title: v.title, count: v.items.length }));
}

function matchSeed(name: string): string | null {
  const n = name.trim().toLowerCase();
  if (SEED_LISTS[n]) return n;
  for (const key of Object.keys(SEED_LISTS)) {
    if (n.includes(key) || key.includes(n)) return key;
    if (SEED_LISTS[key].title.toLowerCase() === n) return key;
  }
  if (SEED_LISTS[n + "s"]) return n + "s";
  if (n.endsWith("s") && SEED_LISTS[n.slice(0, -1)]) return n.slice(0, -1);
  return null;
}

function parseCount(text: string): number | null {
  const digit = text.match(/\b(\d{1,3})\b/);
  if (digit) return Math.min(200, parseInt(digit[1], 10));
  for (const [w, v] of Object.entries(NUMBER_WORDS)) {
    if (new RegExp(`\\bwith ${w}\\b|\\b${w} (items|words|animals|things|pictures)\\b`).test(text.toLowerCase())) return v;
  }
  return null;
}

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

function parseName(text: string): string {
  const t = text.trim();
  const patterns = [
    /category (?:of|for|called|named)\s+["']?([a-z0-9 &-]+?)["']?(?:\s+(?:with|using|that has|containing)\b|$)/i,
    /(?:make|create|add|build)\s+(?:an?\s+)?["']?([a-z0-9 &-]+?)["']?\s+category/i,
    /category\s*[:\-]\s*([a-z0-9 &-]+)/i,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m && m[1]) return titleCase(m[1].trim());
  }
  return "";
}

/** Split a pasted block into clean item names (comma / newline / bullet separated). */
export function parseItemList(block: string): string[] {
  return block
    .split(/[\n,;]|(?:\s\d+[.)]\s)/)
    .map((s) => s.replace(/^\s*[-*\d.)\]]+\s*/, "").trim())
    .filter((s) => s.length > 0 && s.length < 40)
    .map(titleCase)
    .filter((s, i, arr) => arr.indexOf(s) === i);
}

export function parseCategoryCommand(command: string, listBlock = ""): ParsedCategoryCommand {
  const explicitItems = listBlock.trim() ? parseItemList(listBlock) : [];
  let categoryName = parseName(command);
  const requestedCount = parseCount(command);

  if (!categoryName && command.trim()) {
    const bare = command.trim().replace(/^(make|create|add|build|a|an|the|category|of|for)\s+/gi, "");
    if (bare && bare.length < 40) categoryName = titleCase(bare);
  }

  const matchedSeed = matchSeed(categoryName || command);
  if (!categoryName && matchedSeed) categoryName = SEED_LISTS[matchedSeed].title;

  return { categoryName: categoryName || "New Category", requestedCount, explicitItems, matchedSeed };
}

export function resolveItems(parsed: ParsedCategoryCommand): { items: string[]; note: string | null } {
  if (parsed.explicitItems.length > 0) {
    const items = parsed.requestedCount ? parsed.explicitItems.slice(0, parsed.requestedCount) : parsed.explicitItems;
    return { items, note: null };
  }
  if (parsed.matchedSeed) {
    const all = SEED_LISTS[parsed.matchedSeed].items;
    if (parsed.requestedCount && parsed.requestedCount > all.length) {
      return { items: all, note: `The built-in ${SEED_LISTS[parsed.matchedSeed].title} list has ${all.length} items — added all of them.` };
    }
    return { items: parsed.requestedCount ? all.slice(0, parsed.requestedCount) : all, note: null };
  }
  return { items: [], note: "No built-in list matches that category. Paste or type the words you want and try again." };
}
