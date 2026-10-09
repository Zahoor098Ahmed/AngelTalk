import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Pictures the caregiver has picked anywhere (App Library, Chrome Search, gallery, camera),
 * remembered on the device so they show again under "⭐ Used" in the App Library.
 */
export interface UsedPicture {
  url: string;
  name: string;
  at: number;
}

const KEY = "angeltalk_used_pictures_v1";
const MAX = 300;
let list: UsedPicture[] = [];
let loadPromise: Promise<void> | null = null;

export function ensureUsedPicturesLoaded(): Promise<void> {
  if (!loadPromise) {
    loadPromise = AsyncStorage.getItem(KEY)
      .then((raw) => {
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) list = parsed.filter((p) => p && typeof p.url === "string");
      })
      .catch(() => {
        list = [];
      });
  }
  return loadPromise;
}

/** Newest first. */
export function getUsedPictures(): UsedPicture[] {
  return list;
}

export function rememberPicture(url: string, name: string): void {
  if (!url) return;
  const label = (name || "").trim() || "Picture";
  list = [{ url, name: label, at: Date.now() }, ...list.filter((p) => p.url !== url)].slice(0, MAX);
  AsyncStorage.setItem(KEY, JSON.stringify(list)).catch(() => {});
}
