import UNIQUE_PICTURES from "./uniquePictures";
import HOME_PICTURES from "./homeCategoryPictures.json";

const PREFIX = "angeltalk-builtin-image:";
const pictures: Record<string, string> = {};
const references = new Map<string, string>();
for (const [library, data] of [["word", UNIQUE_PICTURES], ["home", HOME_PICTURES]] as const) {
  for (const [key, uri] of Object.entries(data)) {
    if (typeof uri !== "string" || !uri.startsWith("data:")) continue;
    const reference = `${PREFIX}${library}:${key}`;
    pictures[reference] = uri;
    references.set(uri, reference);
  }
}

/** Bundle pictures stay in the app once; custom pictures remain in the user's local database. */
export function serializeLocalBoard(board: unknown): string {
  return JSON.stringify(board, (key, value) => key === "imageUri" && typeof value === "string" ? references.get(value) || value : value);
}

/** Also accepts existing uncompressed boards, so upgrading preserves local edits. */
export function parseLocalBoard(raw: string): unknown {
  return JSON.parse(raw, (key, value) => key === "imageUri" && typeof value === "string" && value.startsWith(PREFIX) ? pictures[value] : value);
}
