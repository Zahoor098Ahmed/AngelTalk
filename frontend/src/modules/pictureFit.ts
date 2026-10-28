import UNIQUE_PICTURES from "./uniquePictures.json";

/**
 * How a word picture should fill its square box.
 *
 * AAC symbols and logos are drawings on a plain background: show them whole ("contain").
 * Real photos (Chrome/Wikipedia search, Pixabay, gallery, camera) fill the box edge to edge
 * ("cover") instead of sitting in a strip with white bands above and below.
 */
// (OpenSymbols serves its symbol sets from a CDN under /libraries/<set>/)
const SYMBOL_SOURCES = /arasaac\.org|opensymbols\.org|cloudfront\.net\/libraries\/|mulberry|globalsymbols|openclipart\.org|\.svg(?:\.png)?(?:\?|$)|^data:image\/svg/i;

/** Symbols drawn for the app itself (half circle, semi circle): built-in data pictures, shown like other symbols. */
const BUILT_IN_DRAWINGS = new Set(Object.values(UNIQUE_PICTURES as Record<string, string>).filter((u) => u.startsWith("data:")));

export function pictureFit(uri?: string | null): "contain" | "cover" {
  if (!uri) return "contain";
  if (BUILT_IN_DRAWINGS.has(uri)) return "contain";
  return SYMBOL_SOURCES.test(uri) ? "contain" : "cover";
}
