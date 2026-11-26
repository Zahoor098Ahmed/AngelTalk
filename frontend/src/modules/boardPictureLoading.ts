import { Image, Platform } from "react-native";
import type { CustomCategory } from "../types";
import { categoryPictureFor, getCategory, visibleChildCategories } from "./customCategories";
import { canonicalWordEn } from "./i18n";
import pictures from "./uniquePictures";
import { normalizeWordImage } from "./normalizeWordImage";
import { softenRedNative } from "./nativeSoftenRed";

export function boardPictureOptions(current?: CustomCategory | null) {
  const folder = (current?.seedName || current?.name)?.toLowerCase();
  const names = new Set<string>();
  const visited = new Set<string>();
  let category = current;
  while (category && !visited.has(category.id)) {
    visited.add(category.id);
    names.add((category.seedName || category.name).toLowerCase());
    category = category.parentCategoryId ? getCategory(category.parentCategoryId) : undefined;
  }
  const sports = names.has("sports and fitness");
  const crisp: boolean | "detail" = sports ? "detail" : !names.has("food and drinks") && !names.has("alphabets and numerals");
  const softenRed: boolean | "health" = !sports && (names.has("health and medical") ? "health" : true);
  return { pictureFolder: sports ? "sports and fitness" : folder, crisp, softenRed };
}

// Start only the leading tiles on interaction, leaving bandwidth for the selected folder.
export function warmBoardCategory(category?: CustomCategory | null) {
  if (!category) return;
  const options = boardPictureOptions(category);
  const seen = new Set<string>();
  function warm(uri: string | undefined, folderTile: boolean) {
    if (!uri || seen.has(uri) || uri.startsWith("data:image/svg")) return;
    seen.add(uri);
    if (Platform.OS === "web") {
      void normalizeWordImage(uri, folderTile || options.crisp, folderTile ? false : options.softenRed, folderTile);
    } else if (!folderTile && options.softenRed) {
      // phones: start softening the reds as soon as the folder is tapped, like the web does
      void softenRedNative(uri, options.softenRed === "health" ? "health" : true);
    } else {
      void Image.prefetch(uri).catch(() => {});
    }
  }
  const limit = 8;
  const folders = visibleChildCategories(category.id).slice(0, limit);
  for (const folder of folders) warm(categoryPictureFor(folder).uri, true);
  if (folders.length === limit) return;
  const words = category.words.filter(w => !w.hidden).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  for (const word of words.slice(0, limit - folders.length)) {
    const label = canonicalWordEn(word.label) || word.label;
    const base = word.verbForms?.base || word.seedLabel || word.label;
    const scoped = !word.isCustom && pictures[`${options.pictureFolder}::${(canonicalWordEn(base) || base).trim().toLowerCase()}`];
    warm(scoped || word.imageUri || pictures[label.trim().toLowerCase()], false);
  }
}
