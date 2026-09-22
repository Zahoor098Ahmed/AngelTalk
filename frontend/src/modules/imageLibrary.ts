import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import type { SceneGraph } from "../types";

/**
 * The learning picture library.
 *
 * Every picture the app finds (ARASAAC symbol search) or generates (AI) is
 * downloaded, stored on the device, and indexed by phrase + tags. So:
 *
 *   • "cat"                -> library (ARASAAC cat), saved
 *   • "blue cat"           -> library ("blue cat"), or AI once then saved
 *   • "cat sitting on the table" -> library if seen before, else AI -> saved
 *
 * Anything AI generates becomes part of the library, so the next time the
 * same sentence is spoken the picture comes from the library — instant and
 * offline. No pre-bundled 5,000 images: the library is seeded live from the
 * free ARASAAC set (30,000+ pictograms) and grows with use.
 */

const INDEX_KEY = "kiddocare_library_index";
const DIR = `${FileSystem.documentDirectory}library/`;

export type LibrarySource = "arasaac" | "opensymbols" | "mulberry" | "ai" | "photo" | "manual" | "book";

export interface LibraryEntry {
  key: string;
  uri: string; // local file
  source: LibrarySource;
  tags: string[];
  savedAt: number;
}

let index: Record<string, LibraryEntry> = {};
let loaded = false;

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?;:"'()]/g, " ")
    .replace(/\b(the|a|an|is|are|was|were|to|of|and)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

async function ensureLoaded() {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    index = raw ? JSON.parse(raw) : {};
  } catch {
    index = {};
  }
  try {
    const info = await FileSystem.getInfoAsync(DIR);
    if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  } catch {
    /* ignore */
  }
  loaded = true;
}

function persist() {
  AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index)).catch(() => {});
}

// --- keys to try, most specific first ---------------------------------

function candidateKeys(phrase: string, graph?: SceneGraph): string[] {
  const keys: string[] = [];
  const p = norm(phrase);
  if (p) keys.push(p);
  if (graph?.subject) {
    const s = graph.subject.type;
    const c = graph.subject.color;
    if (graph.relation && graph.reference) keys.push(norm(`${c ?? ""} ${s} ${graph.relation} ${graph.reference.type}`));
    if (c) keys.push(norm(`${c} ${s}`));
    keys.push(norm(s));
  }
  return [...new Set(keys.filter(Boolean))];
}

// --- ARASAAC dictionary (word -> pictogram id) -----------------------
//
// One fetch of the full ARASAAC English keyword list gives us ~13,000 daily
// words mapped to a picture id. It is small (just words + numbers), stored on
// the device, and lets any everyday word resolve to a white-background picture
// instantly — the image itself is downloaded only the first time it is shown,
// then cached in the library. This is the "5,000+ picture library" without
// bundling megabytes of images into the app.

import DICT from "./arasaacDict.json";

// ~14,800 everyday English words -> ARASAAC pictogram id, bundled with the app
// (280 KB of text, no images). Every word here resolves to a white-background
// picture with zero network round-trips for the lookup; the PNG is fetched and
// cached in the library only the first time it is shown.
const dict: Record<string, number> = DICT as Record<string, number>;
const DICT_SIZE = Object.keys(dict).length;

/** Kept for API compatibility; the dictionary is bundled, nothing to build. */
export async function buildDictionary(): Promise<number> {
  return DICT_SIZE;
}

export async function dictionaryWords(): Promise<number> {
  return DICT_SIZE;
}

// Child speech rarely matches a dictionary word exactly. This maps the common
// informal / baby words to the word ARASAAC actually indexes.
const SYNONYMS: Record<string, string> = {
  puppy: "dog", doggy: "dog", doggie: "dog", pup: "dog",
  kitty: "cat", kitten: "cat", kittie: "cat", pussycat: "cat",
  bunny: "rabbit", horsey: "horse", pony: "horse", piggy: "pig", ducky: "duck",
  birdie: "bird", cow: "cow", moo: "cow", teddy: "teddy bear",
  mom: "mother", mum: "mother", mommy: "mother", mama: "mother",
  dad: "father", daddy: "father", papa: "father",
  grandma: "grandmother", granny: "grandmother", nana: "grandmother",
  grandpa: "grandfather", nan: "grandmother",
  kid: "child", kids: "children", baba: "baby",
  tummy: "stomach", belly: "stomach", potty: "toilet", loo: "toilet",
  telly: "television", tv: "television", fridge: "refrigerator",
  choccy: "chocolate", sweets: "candy", sweetie: "candy", lolly: "lollipop",
  brekkie: "breakfast", veggies: "vegetables", spuds: "potato",
  auto: "car", motorcar: "car", lorry: "truck", plane: "airplane",
  aeroplane: "airplane", chopper: "helicopter", bike: "bicycle", cycle: "bicycle",
  choo: "train",
  jumper: "sweater", pants: "trousers", nappy: "diaper",
  specs: "glasses", brolly: "umbrella",
  poorly: "sick", ill: "sick", owie: "hurt", ouch: "hurt",
  scared: "afraid", cross: "angry", mad: "angry",
  nap: "sleep", snooze: "sleep",
  telephone: "phone", mobile: "phone", laptop: "computer", pc: "computer",
  footy: "football",
  doggo: "dog", birdy: "bird", fishy: "fish", froggy: "frog",
  larki: "girl", larka: "boy", bacha: "child", bache: "children",
  billi: "cat", billa: "cat", kutta: "dog", kuttay: "dog",
  pani: "water", doodh: "milk", roti: "bread", chawal: "rice",
  seb: "apple", kela: "banana", aam: "mango",
  gari: "car", kitab: "book", qalam: "pencil",
  ghar: "house", kursi: "chair", mez: "table",
  hathi: "elephant", sher: "lion", ghora: "horse",
  gaind: "ball", parinda: "bird", machli: "fish",
  suraj: "sun", chand: "moon", sitara: "star",
  darakht: "tree", phool: "flower",
  masjid: "mosque", madrasa: "school", basta: "backpack",
  joote: "shoes", kapre: "clothes",
};

/** Try a word, its singular, and common verb forms. */
function morphs(w: string): string[] {
  const out = [w];
  if (w.endsWith("ies") && w.length > 4) out.push(w.slice(0, -3) + "y");
  if (w.endsWith("es") && w.length > 3) out.push(w.slice(0, -2));
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) out.push(w.slice(0, -1));
  if (w.endsWith("ing") && w.length > 5) {
    out.push(w.slice(0, -3), w.slice(0, -3) + "e");
    if (w[w.length - 4] === w[w.length - 5]) out.push(w.slice(0, -4)); // running -> run
  }
  if (w.endsWith("ed") && w.length > 4) out.push(w.slice(0, -2), w.slice(0, -1));
  return [...new Set(out)];
}

/** Resolve one term to a pictogram id via the dictionary (exact, synonym, morph). */
function dictId(term: string): number | null {
  const t = norm(term);
  if (!t) return null;
  const tries = [t, SYNONYMS[t] ?? "", ...morphs(t)].filter(Boolean);
  for (const w of tries) {
    if (dict[w]) return dict[w];
    if (SYNONYMS[w] && dict[SYNONYMS[w]]) return dict[SYNONYMS[w]];
  }
  return null;
}

const STOP = new Set(["the", "a", "an", "is", "are", "was", "were", "to", "of", "and", "in", "on", "at", "with", "his", "her", "its", "this", "that", "some", "there", "then", "big", "small", "little"]);

function idUrl(id: number): string {
  return `https://static.arasaac.org/pictograms/${id}/${id}_500.png`;
}

export function dictUrl(term: string): string | null {
  const id = dictId(term);
  return id ? idUrl(id) : null;
}

// Compound nouns ARASAAC files under a different name — pin them so a variant
// never falls through to an unrelated icon.
const VARIANT_IDS: Record<string, number> = {
  "office chair": 28085, // "swivel chair"
  "desk chair": 28085,
  "swivel chair": 28085,
  "dining table": 3129,
  "kitchen table": 3129,
  sofa: 25479,
  couch: 25479,
  "bunk bed": 2939,
  "fire engine": 4925,
  "fire truck": 4925,
  "police car": 3426,
  "sports car": 3081,
  "race car": 3081,
};

function variantUrl(phrase: string): string | null {
  const id = VARIANT_IDS[norm(phrase).trim()];
  return id ? idUrl(id) : null;
}

/** the last significant word — the thing itself ("office chair" -> "chair") */
function headNoun(phrase: string): string {
  const t = norm(phrase).trim().split(" ").filter(Boolean);
  for (let i = t.length - 1; i >= 0; i--) if (t[i].length > 2 && !STOP.has(t[i])) return t[i];
  return t[t.length - 1] ?? "";
}

// --- ARASAAC live search (fallback for words not in the dictionary) --

interface ArasaacItem { _id: number; keywords?: { keyword?: string }[] }

/** A stalled network request must never hang lookupImage forever — a picture
 * slot in the scene builder has nothing else to fall back to and would be
 * stuck on its loading placeholder indefinitely otherwise. */
async function fetchWithTimeout(url: string, ms = 6000): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function arasaacFirst(term: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(`https://api.arasaac.org/api/pictograms/en/search/${encodeURIComponent(term)}`);
    if (!res || !res.ok) return null;
    const json = (await res.json()) as ArasaacItem[];
    if (!Array.isArray(json) || !json.length) return null;
    const want = norm(term).trim();
    const head = headNoun(term);
    const kws = (it: ArasaacItem) => (it.keywords ?? []).map((k) => (k.keyword ?? "").toLowerCase().trim());
    // exact keyword, then a keyword that contains the head noun as a whole word.
    // NEVER fall back to json[0] blindly — that returns unrelated icons
    // ("office chair" -> a first-aid cross).
    const exact = json.find((it) => kws(it).some((k) => k === want));
    const related = json.find((it) => kws(it).some((k) => new RegExp(`\\b${head}\\b`).test(k)));
    const pick = exact ?? related;
    if (!pick) {
      console.log(`[library] ARASAAC search "${term}" — no relevant match (head "${head}"), skipping`);
      return null;
    }
    return `https://static.arasaac.org/pictograms/${pick._id}/${pick._id}_500.png`;
  } catch {
    return null;
  }
}

/** OpenSymbols fallback: 59,000+ open-license symbols (Mulberry, Sclera, ARASAAC, Twemoji) */
export async function openSymbolsFirst(term: string, onlyCommercial = false): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(`https://www.opensymbols.org/api/v1/symbols/search?q=${encodeURIComponent(term)}`);
    if (!res || !res.ok) return null;
    const json = (await res.json()) as { id: number; name: string; image_url: string; license?: string }[];
    if (!Array.isArray(json) || !json.length) return null;
    let items = json;
    if (onlyCommercial) {
      items = items.filter((it) => {
        const lic = (it.license || "").toUpperCase();
        return !lic.includes("-NC") && !lic.includes("NC");
      });
    }
    return items[0]?.image_url ?? null;
  } catch {
    return null;
  }
}

// --- public API -----------------------------------------------------

export interface LibraryHit {
  uri: string;
  source: LibrarySource;
  fromLibrary: boolean; // true = already saved locally
}

/**
 * Look a phrase up in the library. Returns a saved local picture if we have
 * one; otherwise tries the ARASAAC seed set for the best matching term,
 * saves it, and returns that. Returns null only when nothing matches — the
 * caller then shows the instant scene or offers AI.
 */
export async function lookupImage(phrase: string, graph?: SceneGraph): Promise<LibraryHit | null> {
  await ensureLoaded();
  const keys = candidateKeys(phrase, graph);

  // 1. already in the library? (skip any legacy "book" / StoryWeaver cache)
  for (const k of keys) {
    if (index[k] && index[k].source !== "book") {
      return { uri: index[k].uri, source: index[k].source, fromLibrary: true };
    }
  }

  // ARASAAC pictograms are fixed-colour line art, so "blue dog" would come back
  // as a plain dog. When a colour is asked for, don't seed from ARASAAC — return
  // null so the caller uses AI (which draws a real blue dog) and saves it.
  if (graph?.subject?.color) return null;

  const phraseNorm = norm(phrase);
  const tokens = phraseNorm.split(" ").filter((w) => w.length > 1 && !STOP.has(w));
  const hit = async (via: string, term: string, url: string, source: LibrarySource = "arasaac"): Promise<LibraryHit> => {
    console.log(`[library] "${phrase}" -> ${via} ("${term}") ${url}`);
    const saved = await saveImage(keys[0] || term, url, { source, tags: keys });
    return { uri: saved?.uri ?? url, source, fromLibrary: false };
  };

  // 2. a pinned variant ("office chair" -> swivel chair), then an exact
  //    dictionary match on a full phrase ("fire truck")
  const pinned = variantUrl(phrase);
  if (pinned) return hit("variant", phraseNorm, pinned);
  for (const term of [...keys, graph?.subject?.type ?? ""].filter(Boolean)) {
    const url = dictUrl(term);
    if (url) return hit("dict", term, url);
  }

  // 3. a compound phrase ("office chair") -> live ARASAAC search, but only a
  //    result that actually relates to the head noun (never an unrelated icon).
  if (tokens.length >= 2) {
    const remote = await arasaacFirst(phraseNorm);
    if (remote) return hit("search", phraseNorm, remote);
  }

  // 4. scan each meaningful word ("the boy eats an apple" -> boy / eat / apple)
  for (const term of tokens) {
    const url = dictUrl(term);
    if (url) return hit("word", term, url);
  }

  // 5. live ARASAAC search for the subject / first key
  for (const term of [graph?.subject?.type, keys[0]].filter((t): t is string => !!t)) {
    const remote = await arasaacFirst(term);
    if (remote) return hit("search", term, remote);
  }

  // 6. OpenSymbols search across 59,000+ symbols (Mulberry, Sclera, Twemoji, etc.)
  for (const term of [phraseNorm, graph?.subject?.type, keys[0]].filter((t): t is string => !!t)) {
    const remote = await openSymbolsFirst(term);
    if (remote) return hit("opensymbols", term, remote, "opensymbols");
  }

  // 7. Clean educational AI illustration fallback for any rare / creative word
  if (phraseNorm && phraseNorm.length >= 2) {
    const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(phraseNorm + ", single educational object, pure plain white background, simple flat outline, no text")}?width=512&height=512&nologo=true`;
    return hit("ai", phraseNorm, aiUrl, "ai");
  }

  console.log(`[library] "${phrase}" -> no match`);
  return null;
}

/** Download and index a picture. Used for ARASAAC seeds and for AI results. */
export async function saveImage(
  phrase: string,
  remoteOrLocalUri: string,
  opts: { source: LibrarySource; tags?: string[] },
): Promise<LibraryEntry | null> {
  await ensureLoaded();
  const key = norm(phrase);
  if (!key) return null;
  try {
    const ext = remoteOrLocalUri.includes(".png") || remoteOrLocalUri.startsWith("data:image/png") ? "png" : "jpg";
    const dest = `${DIR}${hash(key)}.${ext}`;

    if (remoteOrLocalUri.startsWith("data:")) {
      await FileSystem.writeAsStringAsync(dest, remoteOrLocalUri.split(",")[1] ?? "", { encoding: FileSystem.EncodingType.Base64 });
    } else if (remoteOrLocalUri.startsWith("file:")) {
      await FileSystem.copyAsync({ from: remoteOrLocalUri, to: dest });
    } else {
      await FileSystem.downloadAsync(remoteOrLocalUri, dest);
    }

    const entry: LibraryEntry = {
      key,
      uri: dest,
      source: opts.source,
      tags: [...new Set([key, ...(opts.tags ?? [])])],
      savedAt: Date.now(),
    };
    // index under the phrase and each tag (so "blue cat" also answers "cat")
    for (const t of entry.tags) if (!index[t]) index[t] = entry;
    index[key] = entry;

    // keep the library from growing without bound
    const keys = Object.keys(index);
    if (keys.length > 6000) delete index[keys[0]];

    persist();
    return entry;
  } catch {
    return null;
  }
}

/**
 * Fill the library from the curated seed list (see librarySeed.ts). Runs in the
 * background, throttled, and picks up where it left off — safe to call on every
 * app start. Each word is fetched once from ARASAAC and saved with a white
 * background, so later it comes straight from the local library.
 */
let prewarming = false;
export async function prewarmLibrary(max = 400): Promise<void> {
  if (prewarming) return;
  prewarming = true;
  await ensureLoaded();
  try {
    const { SEED_LIST } = await import("./librarySeed");
    let done = 0;
    for (const word of SEED_LIST) {
      if (done >= max) break;
      const k = norm(word);
      if (!k || index[k]) continue;
      const url = dictUrl(word) ?? (await arasaacFirst(word));
      if (url) {
        await saveImage(word, url, { source: "arasaac", tags: [k] });
        done++;
        await new Promise((r) => setTimeout(r, 60)); // be gentle on the free API
      }
    }
  } catch {
    /* ignore — the library still seeds live on lookup */
  } finally {
    prewarming = false;
  }
}

export async function libraryCount(): Promise<number> {
  await ensureLoaded();
  return new Set(Object.values(index).map((e) => e.uri)).size;
}

export async function libraryEntries(): Promise<LibraryEntry[]> {
  await ensureLoaded();
  const seen = new Set<string>();
  const out: LibraryEntry[] = [];
  for (const e of Object.values(index)) {
    if (seen.has(e.uri)) continue;
    seen.add(e.uri);
    out.push(e);
  }
  return out.sort((a, b) => b.savedAt - a.savedAt);
}

export async function clearLibrary() {
  await ensureLoaded();
  try {
    await FileSystem.deleteAsync(DIR, { idempotent: true });
  } catch {
    /* ignore */
  }
  index = {};
  persist();
}
