import { getPictogramUrl } from "./aacPictograms";
import { canonicalWordEn } from "./i18n";
import { downloadTileImage, searchImages, type ImageSource } from "./imageSearch";
import { getCategory, updateWord } from "./customCategories";

/**
 * Finds a picture for any word, including names and brands the AAC symbol sets don't have
 * ("Toyota", "SUV", "Suzuki"): AAC symbols first (ARASAAC, OpenSymbols), then the Wikipedia
 * article's image (no key needed), then Pixabay when a key is set.
 */
export async function findPictureForWord(word: string): Promise<string | null> {
  const term = (canonicalWordEn(word) || word).trim();
  if (!term) return null;
  // All sources at once, each capped (OpenSymbols alone can take ~10 s); best one by priority wins
  const firstHit = (source: ImageSource) =>
    withTimeout(
      searchImages(term, source, source === "opensymbols").then(({ hits }) => hits[0]?.full || hits[0]?.thumb || null),
      5000,
    );
  const [arasaac, openSymbols, wiki, pixabay] = await Promise.all([
    firstHit("arasaac"),
    firstHit("opensymbols"),
    withTimeout(wikipediaImage(term), 5000),
    firstHit("pixabay"),
  ]);
  return arasaac || openSymbols || wiki || pixabay || null;
}

/** Resolves to null if the promise fails or takes longer than `ms`. */
function withTimeout<T>(promise: Promise<T | null>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise
      .then((v) => resolve(v))
      .catch(() => resolve(null))
      .finally(() => clearTimeout(timer));
  });
}

/** Lead image of the English Wikipedia article for a term (follows redirects, e.g. "SUV"). */
async function wikipediaImage(term: string): Promise<string | null> {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term.replace(/\s+/g, "_"))}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { type?: string; thumbnail?: { source?: string }; originalimage?: { source?: string } };
    if (json.type === "disambiguation") return null;
    return json.thumbnail?.source || json.originalimage?.source || null;
  } catch {
    return null;
  }
}

const tried = new Set<string>();

/**
 * Gives every word in these categories that still has no picture (and no offline pictogram)
 * one found online, saved on the device. Each word is tried once per app session.
 */
export async function fillMissingPictures(categoryIds: string[]): Promise<number> {
  let filled = 0;
  for (const catId of categoryIds) {
    const cat = getCategory(catId);
    if (!cat) continue;
    for (const w of cat.words) {
      if (w.imageUri || tried.has(w.id)) continue;
      const en = canonicalWordEn(w.label) || w.label;
      if (getPictogramUrl(en) || getPictogramUrl(w.label)) continue;
      tried.add(w.id);
      const url = await findPictureForWord(w.label);
      if (!url) continue;
      const saved = (await downloadTileImage(url, w.id)) || url;
      updateWord(catId, w.id, { imageUri: saved });
      filled++;
    }
  }
  return filled;
}
