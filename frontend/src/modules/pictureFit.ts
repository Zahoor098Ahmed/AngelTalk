/**
 * How a word picture should fill its square box.
 *
 * AAC symbols and logos are drawings on a plain background: show them whole ("contain").
 * Real photos (Chrome/Wikipedia search, Pixabay, gallery, camera) fill the box edge to edge
 * ("cover") instead of sitting in a strip with white bands above and below.
 */
// (OpenSymbols serves its symbol sets from a CDN under /libraries/<set>/)
const SYMBOL_SOURCES = /arasaac\.org|opensymbols\.org|cloudfront\.net\/libraries\/|mulberry|globalsymbols|\.svg(?:\.png)?(?:\?|$)|^data:image\/svg/i;

export function pictureFit(uri?: string | null): "contain" | "cover" {
  if (!uri) return "contain";
  return SYMBOL_SOURCES.test(uri) ? "contain" : "cover";
}
