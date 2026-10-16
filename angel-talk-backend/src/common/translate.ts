import mongoose from "mongoose";
import { logger } from "./logger";

/**
 * English -> Arabic / Urdu for things typed in the admin panel, so the admin writes English only.
 *  1. the app's own dictionary (catalog_translations, saved by "npm run seed:catalog")
 *  2. words translated earlier (translation_cache)
 *  3. online: Google Cloud Translation (if GOOGLE_TRANSLATE_API_KEY is set), the free Google endpoint,
 *     then MyMemory; saved in translation_cache for next time
 * If nothing works (offline), the field is simply left empty and the app shows English.
 */

export const TARGET_LANGS = ["ar-SA", "ur-PK"] as const;
type Lang = (typeof TARGET_LANGS)[number];
const SHORT: Record<Lang, string> = { "ar-SA": "ar", "ur-PK": "ur" };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function fromDictionary(en: string, lang: Lang): Promise<string | undefined> {
  const db = mongoose.connection.db;
  if (!db) return undefined;
  const doc = await db.collection("catalog_translations").findOne({ type: "word", lang, en: new RegExp(`^${escape(en)}$`, "i") });
  return typeof doc?.text === "string" ? doc.text : undefined;
}

async function fromCache(key: string): Promise<string | undefined> {
  const doc = await mongoose.connection.db?.collection<{ _id: string; text: string }>("translation_cache").findOne({ _id: key });
  return doc?.text;
}

async function getJson(url: string, init?: Parameters<typeof fetch>[1]): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { ...(init ?? {}), signal: controller.signal } as Parameters<typeof fetch>[1]);
    return res.ok ? await res.json() : undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

/** Official Google Cloud Translation (only when GOOGLE_TRANSLATE_API_KEY is set). */
async function googleCloud(en: string, lang: Lang): Promise<string | undefined> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) return undefined;
  const data = (await getJson(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: en, source: "en", target: SHORT[lang], format: "text" }),
  })) as { data?: { translations?: { translatedText?: string }[] } } | undefined;
  return data?.data?.translations?.[0]?.translatedText?.trim() || undefined;
}

/** The free Google endpoint the app also uses (can be rate-limited). */
async function googleFree(en: string, lang: Lang): Promise<string | undefined> {
  const data = (await getJson(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${SHORT[lang]}&dt=t&q=${encodeURIComponent(en)}`,
  )) as unknown[][][] | undefined;
  const text = (data?.[0] ?? []).map((part) => (Array.isArray(part) ? part[0] : "")).join("").trim();
  return text || undefined;
}

/** MyMemory, a free translation service (backup). */
async function myMemory(en: string, lang: Lang): Promise<string | undefined> {
  const data = (await getJson(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(en)}&langpair=en|${SHORT[lang]}`)) as
    | { responseStatus?: number; responseData?: { translatedText?: string } }
    | undefined;
  const text = data?.responseData?.translatedText?.trim();
  if (!text || Number(data?.responseStatus) !== 200 || /MYMEMORY|QUERY LENGTH/i.test(text) || text.toLowerCase() === en.toLowerCase()) {
    return undefined;
  }
  return text;
}

async function online(en: string, lang: Lang): Promise<string | undefined> {
  return (await googleCloud(en, lang)) ?? (await googleFree(en, lang)) ?? (await myMemory(en, lang));
}

export async function translateTo(text: string, lang: Lang): Promise<string | undefined> {
  const en = (text || "").trim();
  if (!en || /[؀-ۿ]/.test(en)) return undefined;
  const key = `${lang}:${en.toLowerCase()}`;
  try {
    const known = (await fromDictionary(en, lang)) ?? (await fromCache(key));
    if (known) return known;
    const fresh = await online(en, lang);
    if (fresh) {
      await mongoose.connection.db
        ?.collection<{ _id: string; text: string; en: string; lang: string; createdAt: Date }>("translation_cache")
        .updateOne({ _id: key }, { $set: { text: fresh, en, lang, createdAt: new Date() } }, { upsert: true });
    }
    return fresh;
  } catch (err) {
    logger.warn({ err }, "translation failed");
    return undefined;
  }
}

/** Keeps translations the admin typed; fills the empty ones. */
export async function fillTranslations(text: string, existing?: Record<string, string> | Map<string, string> | null): Promise<Record<string, string>> {
  const out: Record<string, string> = existing instanceof Map ? Object.fromEntries(existing) : { ...(existing ?? {}) };
  await Promise.all(
    TARGET_LANGS.map(async (lang) => {
      if (out[lang]?.trim()) return;
      const t = await translateTo(text, lang);
      if (t) out[lang] = t;
    }),
  );
  return out;
}

/** Runs async jobs a few at a time (keeps the translator from being flooded). */
export async function inBatches<T>(items: T[], size: number, fn: (item: T) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += size) await Promise.all(items.slice(i, i + size).map(fn));
}
