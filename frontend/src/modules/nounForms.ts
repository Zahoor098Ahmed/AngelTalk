/**
 * Noun forms for the Talk board's noun popup:
 *   Apple (one) · Apples (many) · Apple's (of one) · Apples' (of many)
 * A phrase changes its last word ("ice cream" -> "ice creams", "ice cream's").
 */
import type { NounFormKey } from "../types";

const IRREGULAR: Record<string, string> = {
  child: "children", man: "men", woman: "women", person: "people", mouse: "mice", tooth: "teeth",
  foot: "feet", goose: "geese", ox: "oxen", louse: "lice", die: "dice", knife: "knives", wife: "wives",
  life: "lives", leaf: "leaves", loaf: "loaves", wolf: "wolves", calf: "calves", half: "halves",
  shelf: "shelves", thief: "thieves", scarf: "scarves", elf: "elves", self: "selves", hoof: "hooves",
  cactus: "cacti", fungus: "fungi", octopus: "octopuses", potato: "potatoes", tomato: "tomatoes",
  hero: "heroes", echo: "echoes", volcano: "volcanoes", mango: "mangoes", domino: "dominoes",
  mosquito: "mosquitoes", torpedo: "torpedoes", grandchild: "grandchildren", policeman: "policemen",
  fireman: "firemen", snowman: "snowmen", gingerbread: "gingerbread", bus: "buses", quiz: "quizzes",
};
/** Same word for one and many. */
const SAME = new Set([
  "sheep", "fish", "deer", "moose", "salmon", "trout", "bison", "aircraft", "series", "species", "news",
  "rice", "bread", "milk", "water", "juice", "sugar", "salt", "pepper", "butter", "cheese", "money",
  "furniture", "luggage", "homework", "music", "information", "equipment", "jam", "honey", "flour",
  "soup", "pasta", "spaghetti", "popcorn", "cereal", "yogurt", "tea", "coffee", "chocolate", "ice",
  "sand", "snow", "rain", "hair", "grass", "toast", "corn", "lettuce", "broccoli", "celery", "meat",
  "chicken", "beef", "tuna", "shrimp", "squid", "jelly", "gum", "candy", "food", "fruit",
  "tennis", "golf", "soccer", "football", "hockey", "yoga", "karate", "badminton", "bowling", "swimming",
  "art", "math", "science", "gymnastics", "chess", "volleyball", "basketball", "baseball", "cricket", "rugby",
]);
/** Words ending in "ie" ("cookie", not "cooky"). */
const IE_WORDS = new Set(["cookie", "movie", "pie", "tie", "brownie", "smoothie", "zombie", "selfie", "rookie", "calorie", "hoodie", "veggie", "birdie", "doggie", "goalie", "lie", "magpie", "pixie", "genie", "sweetie"]);
/** Words that are already plural ("Grapes", "Jeans"): one form is the plural itself. */
const PLURAL_ONLY = new Set(["jeans", "pants", "trousers", "shorts", "pajamas", "pyjamas", "glasses", "scissors", "clothes", "leggings", "tights", "sunglasses", "goggles", "binoculars", "pliers", "tongs", "tweezers", "overalls"]);

function pluralOf(word: string): string {
  const lower = word.toLowerCase();
  const keepCase = (p: string) => (word[0] === word[0].toUpperCase() ? p.charAt(0).toUpperCase() + p.slice(1) : p);
  if (SAME.has(lower) || PLURAL_ONLY.has(lower)) return word;
  if (IRREGULAR[lower]) return keepCase(IRREGULAR[lower]);
  if (/[^aeiou]y$/i.test(word)) return word.slice(0, -1) + "ies";
  if (/(s|x|z|ch|sh)$/i.test(word)) return word + "es";
  return word + "s";
}

function singularOf(word: string): string {
  const lower = word.toLowerCase();
  const back = Object.entries(IRREGULAR).find(([, p]) => p === lower);
  if (back) return word[0] === word[0].toUpperCase() ? back[0].charAt(0).toUpperCase() + back[0].slice(1) : back[0];
  if (/ies$/i.test(word) && IE_WORDS.has(lower.slice(0, -1))) return word.slice(0, -1);
  if (/[^aeiou]ies$/i.test(word)) return word.slice(0, -3) + "y";
  if (/(ss|x|z|ch|sh)es$/i.test(word)) return word.slice(0, -2);
  if (/[^su]s$/i.test(word)) return word.slice(0, -1);
  return word;
}

/** "grapes" is many already; "glass", "bus", "tennis" are one. */
function looksPlural(word: string): boolean {
  const lower = word.toLowerCase();
  if (PLURAL_ONLY.has(lower) || Object.values(IRREGULAR).includes(lower)) return true;
  return /[^su']s$/i.test(lower) && !/(is|ss|us|ous|ics)$/i.test(lower) && lower.length > 3;
}

export type NounFormRow = { key: NounFormKey; text: string };

/** The four forms of a noun, or null when the word is not a noun phrase that has them. */
export function nounFormsOf(label: string): NounFormRow[] | null {
  const text = label.trim();
  if (!text || /[!?.,]/.test(text) || /\d/.test(text) || text.split(/\s+/).length > 3 || text.length < 2) return null;
  const words = text.split(/\s+/);
  const last = words[words.length - 1];
  const head = words.slice(0, -1).join(" ");
  const join = (w: string) => (head ? `${head} ${w}` : w);
  const lowerLast = last.toLowerCase();
  let one: string, many: string;
  if (PLURAL_ONLY.has(lowerLast)) {
    one = many = last;
  } else if (looksPlural(last)) {
    many = last;
    one = singularOf(last);
  } else {
    one = last;
    many = pluralOf(last);
  }
  const ones = PLURAL_ONLY.has(one.toLowerCase()) ? `${one}'` : `${one}'s`;
  const manys = /s$/i.test(many) ? `${many}'` : `${many}'s`;
  return [
    { key: "one", text: join(one) },
    { key: "many", text: join(many) },
    { key: "ones", text: join(ones) },
    { key: "manys", text: join(manys) },
  ];
}
