/**
 * Collects the data that is hard-coded in the Angel Talk app (frontend/src) and shown in its screens,
 * as plain documents, one array per MongoDB collection. Bundled and run by build-catalog.ts.
 *
 *  - the default board goes to "seedtemplates" and the verbs to "verbgroups" (the collections the
 *    backend and the admin panel already use), so nothing is stored twice
 *  - features the app does not show (social stories, quick onboarding, voice commands) are left out
 *
 * The default board is produced by the app's own seeding code (exactly what a fresh install shows),
 * so the database always matches the app.
 */
import * as cats from "../../../frontend/src/modules/customCategories";
import * as i18n from "../../../frontend/src/modules/i18n";
import * as verbs from "../../../frontend/src/modules/verbForms";
import * as pictos from "../../../frontend/src/modules/aacPictograms";
import * as library from "../../../frontend/src/modules/builtInImageLibrary";
import * as librarySeed from "../../../frontend/src/modules/librarySeed";
import * as prediction from "../../../frontend/src/modules/wordPrediction";
import * as grammar from "../../../frontend/src/modules/sentenceGrammar";
import * as storage from "../../../frontend/src/modules/storage";
import arasaacDict from "../../../frontend/src/modules/arasaacDict.json";

type Doc = { _id: string; [k: string]: unknown };
type Mod = Record<string, unknown>;

const LANGS = ["ar-SA", "ur-PK"] as const;
const slug = (s: string) =>
  (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "x";
const arasaacUrl = (id: number) => `https://static.arasaac.org/pictograms/${id}/${id}_500.png`;

/** Plain JSON copy (Sets/Maps become arrays/objects, functions are dropped). */
function plain(v: unknown, depth = 0): unknown {
  if (depth > 12) return undefined;
  if (v instanceof Set) return [...v].map((x) => plain(x, depth + 1));
  if (v instanceof Map) return Object.fromEntries([...v].map(([k, x]) => [String(k), plain(x, depth + 1)]));
  if (Array.isArray(v)) return v.map((x) => plain(x, depth + 1)).filter((x) => x !== undefined);
  if (typeof v === "function" || typeof v === "symbol") return undefined;
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) {
      const p = plain(x, depth + 1);
      if (p !== undefined) out[k] = p;
    }
    return out;
  }
  return v;
}
const isData = (v: unknown) =>
  v instanceof Set || v instanceof Map || Array.isArray(v) || (!!v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype);

/** Unique _id inside one collection. */
function uniquer() {
  const seen = new Map<string, number>();
  return (id: string) => {
    const n = seen.get(id) ?? 0;
    seen.set(id, n + 1);
    return n === 0 ? id : `${id}~${n + 1}`;
  };
}

function translationsOf(text: string, kind: "word" | "folder"): Record<string, string> {
  const out: Record<string, string> = {};
  const folders = (cats as Mod).FOLDER_NAMES as Record<string, Record<string, string>> | undefined;
  for (const lang of LANGS) {
    const t = kind === "folder" && folders?.[lang]?.[text] ? folders[lang][text] : i18n.wordLabel(text, lang as never);
    if (t && t !== text) out[lang] = t;
  }
  return out;
}

/** Screens keep some data (games, onboarding presets) as module constants: load each one on its own. */
function screenConstants(): Record<string, Mod> {
  const out: Record<string, Mod> = {};
  const load: Record<string, () => Mod> = {
    GamesScreen: () => require("../../../frontend/src/screens/GamesScreen"),
    MyCategoriesScreen: () => require("../../../frontend/src/screens/MyCategoriesScreen"),
    AddByVoiceScreen: () => require("../../../frontend/src/screens/AddByVoiceScreen"),
    LandingScreen: () => require("../../../frontend/src/screens/LandingScreen"),
    AccessibilityScreen: () => require("../../../frontend/src/screens/AccessibilityScreen"),
    ParentDashboardScreen: () => require("../../../frontend/src/screens/ParentDashboardScreen"),
  };
  for (const [name, fn] of Object.entries(load)) {
    try {
      out[name] = fn();
    } catch (e) {
      console.warn(`[catalog] could not read ${name}: ${(e as Error).message}`);
    }
  }
  return out;
}

const isConst = (k: string) => /^[A-Z][A-Z0-9_]*$/.test(k);

export async function buildCatalog(): Promise<Record<string, Doc[]>> {
  const C: Record<string, Doc[]> = {};

  // ---- 1. Default board -> seedtemplates: one template per folder that holds words ----
  cats.setSeedLanguage("en-US" as never);
  await cats.ensureCategoriesLoaded();
  const board = cats.listCategories();
  const byId = new Map(board.map((c) => [c.id, c]));
  const pathOf = (c: (typeof board)[number]): string[] => {
    const parent = c.parentCategoryId ? byId.get(c.parentCategoryId) : undefined;
    return parent ? [...pathOf(parent), c.name] : [c.name];
  };
  const FORM_TAG: Record<string, string> = { "1st": "first", s: "s_es", "2nd": "second", "3rd": "third", "4th": "fourth" };
  const tplId = uniquer();
  C.seedtemplates = board
    .filter((c) => c.words.length > 0)
    .map((c, order) => {
      const path = pathOf(c);
      const seedName = tplId(path.map(slug).join("/"));
      const words = [...c.words]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((w, i) => ({
          label: w.label,
          phrase: w.phrase || w.label,
          translations: translationsOf(w.label, "word"),
          emoji: w.emoji,
          imageUri: w.imageUri,
          ...(w.verbFormTag ? { verbFormTag: FORM_TAG[w.verbFormTag] } : {}),
          order: i,
        }));
      return {
        _id: "app-" + seedName.replace(/\//g, "-"),
        name: path.join(" / "),
        seedName,
        description: `${words.length} cards from the "${path.join(" / ")}" folder of the app`,
        icon: c.icon,
        color: c.color,
        imageUri: c.imageUri,
        nameTranslations: translationsOf(c.name, "folder"),
        words,
        forDiagnoses: [],
        active: true,
        order,
        source: "app",
      } as Doc;
    });
  C.catalog_bottom_tabs = cats.BOTTOM_CATEGORIES.map((b, i) => ({ _id: b.key, ...b, order: i }));

  // ---- 2. Verbs -> verbgroups: every verb the app knows with all 5 forms ----
  const verbMap = new Map<string, Doc>();
  const aToZ = ((cats as Mod).VERBS_A_TO_Z || {}) as Record<string, { base: string; past: string; participle: string; continuous: string; emoji: string }[]>;
  const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
  const form = (t: string) => ({ text: cap(t), translations: translationsOf(t, "word") });
  const addVerb = (v: { base: string; past: string; participle: string; continuous: string; emoji?: string }) => {
    const base = v.base.toLowerCase();
    verbMap.set(base, {
      _id: "app-verb-" + slug(base),
      base,
      emoji: v.emoji ?? verbMap.get(base)?.emoji,
      forms: { first: form(base), s_es: form(verbs.sFormOf(base)), second: form(v.past), third: form(v.participle), fourth: form(v.continuous) },
      active: true,
      source: "app",
    });
  };
  verbs.VERB_FORMS_LIST.forEach((v) => addVerb(v));
  Object.values(aToZ).forEach((list) => list.forEach((v) => addVerb(v)));
  C.verbgroups = [...verbMap.values()].sort((a, b) => String(a.base).localeCompare(String(b.base)));
  const vm = verbs as Mod;
  C.catalog_verb_rules = [
    { _id: "known_regular_verbs", words: plain(vm.KNOWN_REGULAR_VERBS) },
    { _id: "known_non_verbs", words: plain(vm.KNOWN_NON_VERBS) },
    { _id: "base_ing_verbs", words: plain(vm.BASE_ING_VERBS) },
    { _id: "s_form_irregular", map: plain(vm.S_FORM_IRREGULAR) },
  ].filter((d) => (d as Doc).words !== undefined || (d as Doc).map !== undefined) as Doc[];

  // ---- 3. Translations: words, folder names and every screen text, per language ----
  const im = i18n as Mod;
  const trId = uniquer();
  const tr: Doc[] = [];
  for (const [lang, table] of [["ar-SA", im.WORD_AR], ["ur-PK", im.WORD_UR]] as const) {
    for (const [en, text] of Object.entries((table || {}) as Record<string, string>)) tr.push({ _id: trId(`word:${lang}:${slug(en)}`), type: "word", lang, en, text });
  }
  for (const [lang, table] of Object.entries(((cats as Mod).FOLDER_NAMES || {}) as Record<string, Record<string, string>>)) {
    for (const [en, text] of Object.entries(table)) tr.push({ _id: trId(`folder:${lang}:${slug(en)}`), type: "folder", lang, en, text });
  }
  for (const [lang, table] of Object.entries((im.T || {}) as Record<string, Record<string, unknown>>)) {
    for (const [key, text] of Object.entries(table)) if (typeof text === "string") tr.push({ _id: trId(`ui:${lang}:${key}`), type: "ui", lang, key, text });
  }
  for (const [lang, table] of Object.entries((im.GAME_ANSWERS || {}) as Record<string, Record<string, string>>)) {
    for (const [en, text] of Object.entries(table)) tr.push({ _id: trId(`game:${lang}:${slug(en)}`), type: "game", lang, en, text });
  }
  C.catalog_translations = tr;
  C.catalog_languages = i18n.LANGUAGES.map((l, i) => ({ _id: (l as { code: string }).code, ...(plain(l) as object), order: i }));
  C.catalog_starter_words = Object.entries(i18n.STARTER_WORDS).map(([lang, words]) => ({ _id: lang, lang, words }));

  // ---- 4. Pictures: curated pictogram map + the full ARASAAC dictionary + the picture library ----
  const picId = uniquer();
  C.catalog_pictograms = [
    ...Object.entries(pictos.AAC_PICTOGRAM_MAP).map(([word, url]) => ({ _id: picId(`map:${slug(word)}`), word, url, source: "curated" })),
    ...Object.entries(arasaacDict as Record<string, number>).map(([word, id]) => ({ _id: picId(`arasaac:${slug(word)}`), word, arasaacId: id, url: arasaacUrl(id), source: "arasaac-dictionary" })),
  ];
  const lib = library as Mod;
  C.catalog_image_library = [
    ...(((lib.CURATED_SYMBOLS || []) as Doc[]).map((s) => ({ ...s, _id: `symbol:${s.id}`, kind: "symbol" }))),
    ...(((lib.SYMBOL_CATEGORIES || []) as { key?: string; id?: string }[]).map((c, i) => ({ ...(plain(c) as object), _id: `category:${c.key ?? c.id ?? i}`, kind: "category", order: i }))),
    { _id: "seed_words", kind: "seed-words", words: librarySeed.SEED_LIST },
  ];

  // ---- 6. Word & phrase suggestions, sentence grammar ----
  const pm = prediction as Mod;
  C.catalog_word_prediction = [
    ...Object.entries((pm.RULES || {}) as Record<string, string[]>).map(([after, next]) => ({ _id: `rule:${slug(after)}`, kind: "next-words", after, next })),
    ...["FEELINGS", "FOODS", "PLACES", "DO_VERBS", "FALLBACK"].filter((k) => pm[k]).map((k) => ({ _id: `group:${k.toLowerCase()}`, kind: "word-group", name: k, words: plain(pm[k]) })),
    ...(pm.PHRASE_ALIASES ? [{ _id: "phrase_aliases", kind: "aliases", map: plain(pm.PHRASE_ALIASES) }] : []),
  ] as Doc[];
  C.catalog_sentence_grammar = Object.entries(grammar as Mod)
    .filter(([k, v]) => isConst(k) && isData(v))
    .map(([k, v]) => ({ _id: k, name: k, value: plain(v) }));

  // ---- 7. Games ----
  const screens = screenConstants();
  const games = screens.GamesScreen || {};
  C.catalog_games = Object.entries(games)
    .filter(([k, v]) => isConst(k) && isData(v))
    .map(([k, v]) => ({ _id: k, name: k, items: plain(v) }));

  // ---- 8. App defaults and every other constant list ----
  const sm = storage as Mod;
  const constants: Doc[] = [];
  if (sm.DEFAULT_SETTINGS) constants.push({ _id: "storage.DEFAULT_SETTINGS", module: "storage", name: "DEFAULT_SETTINGS", value: plain(sm.DEFAULT_SETTINGS) });
  if (sm.DEFAULT_USAGE) constants.push({ _id: "storage.DEFAULT_USAGE", module: "storage", name: "DEFAULT_USAGE", value: plain(sm.DEFAULT_USAGE) });
  if (sm.defaultTags) constants.push({ _id: "storage.defaultTags", module: "storage", name: "defaultTags", value: plain(sm.defaultTags) });
  const cm = cats as Mod;
  for (const k of ["FOLDER_COLORS", "SEED_WORD_EN", "FOLDER_ALIASES"]) if (cm[k] !== undefined) constants.push({ _id: `customCategories.${k}`, module: "customCategories", name: k, value: plain(cm[k]) });
  const used = new Set(["GamesScreen"]);
  for (const [screen, mod] of Object.entries(screens)) {
    if (used.has(screen)) continue;
    for (const [k, v] of Object.entries(mod)) if (isConst(k) && isData(v)) constants.push({ _id: `${screen}.${k}`, module: screen, name: k, value: plain(v) });
  }
  C.catalog_app_constants = constants;

  return C;
}
