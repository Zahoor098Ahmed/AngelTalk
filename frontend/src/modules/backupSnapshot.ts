import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { deviceDataStorage } from "./deviceDataStorage";
import { buildBackup, ensureCategoriesLoaded, reloadCategoriesFromDevice, setSeedLanguage } from "./customCategories";
import { serializeLocalBoard, parseLocalBoard } from "./localBoardCodec";
import { hydrateStorage, loadSettings } from "./storage";
import { backupHash } from "./backupCrypto";

export interface AppBackupSnapshot {
  version: 1;
  createdAt: string;
  timeZone: string;
  categoryCount: number;
  wordCount: number;
  entries: Record<string, { storage: "device" | "async"; value: string }>;
  media: Record<string, string>;
}
const BOARD_KEY = "kiddocare_custom_categories_wordfile_v6";
export function canBackUpKey(key: string): boolean {
  if (key === "angeltalk_cloud_account") return true; // Encrypted account credentials reconnect the original family after reinstall.
  if (!/^(kiddocare_|angeltalk_)/.test(key)) return false;
  return !/^(angeltalk_(backup|cloud|access_token|refresh_token|pin_token|last_sync)|kiddocare_admin_pin)/.test(key);
}
async function walk(value: unknown, replace: (text: string) => Promise<string>): Promise<unknown> {
  if (typeof value === "string") return replace(value);
  if (Array.isArray(value)) return Promise.all(value.map(item => walk(item, replace)));
  if (value && typeof value === "object") return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await walk(item, replace)])));
  return value;
}
async function rewrite(raw: string, replace: (text: string) => Promise<string>): Promise<string> {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return replace(raw); }
  return JSON.stringify(await walk(parsed, replace));
}
function mime(uri: string) {
  const extension = uri.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
  return ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", m4a: "audio/mp4", mp3: "audio/mpeg", wav: "audio/wav", caf: "audio/x-caf" } as Record<string, string>)[extension || ""] || "application/octet-stream";
}
export async function captureAppSnapshot(timeZone: string): Promise<AppBackupSnapshot> {
  await ensureCategoriesLoaded();
  const databaseKeys = new Set(await deviceDataStorage.getDatabaseKeys());
  const keys = [...new Set([...await AsyncStorage.getAllKeys(), ...databaseKeys])].filter(canBackUpKey).sort();
  const entries: AppBackupSnapshot["entries"] = {};
  for (const key of keys) {
    const inDatabase = databaseKeys.has(key);
    const value = await (inDatabase ? deviceDataStorage : AsyncStorage).getItem(key);
    if (value !== null) entries[key] = { storage: inDatabase ? "device" : "async", value };
  }
  const board = buildBackup();
  entries[BOARD_KEY] = { storage: Platform.OS === "web" ? "device" : "async", value: serializeLocalBoard(board.categories) };
  return { version: 1, createdAt: new Date().toISOString(), timeZone, categoryCount: board.categoryCount, wordCount: board.wordCount, entries, media: {} };
}
export async function includeLocalMedia(snapshot: AppBackupSnapshot): Promise<void> {
  const include = async (uri: string): Promise<string> => {
    if (!/^(file:|content:|blob:)/i.test(uri) || snapshot.media[uri]) return uri;
    try {
      if (Platform.OS === "web") {
        const blob = await (await fetch(uri)).blob();
        snapshot.media[uri] = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob);
        });
      } else {
        const files = await import("expo-file-system/legacy");
        snapshot.media[uri] = `data:${mime(uri)};base64,${await files.readAsStringAsync(uri, { encoding: files.EncodingType.Base64 })}`;
      }
    } catch { throw new Error("A custom picture or audio file could not be read. Choose it again before backing up."); }
    return uri;
  };
  for (const entry of Object.values(snapshot.entries)) await rewrite(entry.value, include);
}
export function validateSnapshot(value: unknown): asserts value is AppBackupSnapshot {
  const snapshot = value as AppBackupSnapshot;
  if (!snapshot || snapshot.version !== 1 || !snapshot.entries || typeof snapshot.entries !== "object" || !snapshot.entries[BOARD_KEY]) throw new Error("This is not a complete Angel Talk app backup.");
  const board = parseLocalBoard(snapshot.entries[BOARD_KEY].value);
  if (!Array.isArray(board) || board.some(category => !category || !Array.isArray(category.words))) throw new Error("The backup board is invalid.");
  for (const [key, entry] of Object.entries(snapshot.entries)) {
    if (!canBackUpKey(key) || !entry || typeof entry.value !== "string" || !["device", "async"].includes(entry.storage)) throw new Error("The backup contains invalid app data.");
  }
  if (!snapshot.media || typeof snapshot.media !== "object") throw new Error("Invalid backup media.");
}
export async function restoreAppSnapshot(snapshot: AppBackupSnapshot): Promise<void> {
  validateSnapshot(snapshot);
  const restoredMedia = new Map<string, string>();
  for (const [original, data] of Object.entries(snapshot.media)) {
    if (typeof data !== "string" || !/^data:[^;]+;base64,/.test(data)) throw new Error("Invalid custom picture or audio in backup.");
    if (Platform.OS === "web") restoredMedia.set(original, data);
    else {
      const files = await import("expo-file-system/legacy");
      if (!files.documentDirectory) throw new Error("The device storage is not available.");
      const directory = `${files.documentDirectory}restored-backup/`;
      await files.makeDirectoryAsync(directory, { intermediates: true });
      const mediaType = data.slice(5, data.indexOf(";"));
      const extension = ({ "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "audio/mpeg": "mp3", "audio/wav": "wav", "audio/mp4": "m4a", "audio/x-caf": "caf" } as Record<string, string>)[mediaType] || "bin";
      const file = `${directory}${await backupHash(original)}.${extension}`;
      await files.writeAsStringAsync(file, data.slice(data.indexOf(",") + 1), { encoding: files.EncodingType.Base64 });
      restoredMedia.set(original, file);
    }
  }
  const currentDatabase = new Set(await deviceDataStorage.getDatabaseKeys());
  const currentKeys = [...new Set([...await AsyncStorage.getAllKeys(), ...currentDatabase])].filter(canBackUpKey);
  const previous = new Map<string, { storage: "device" | "async"; value: string | null }>();
  for (const key of new Set([...currentKeys, ...Object.keys(snapshot.entries)])) {
    const storage = currentDatabase.has(key) ? "device" : "async";
    previous.set(key, { storage, value: await (storage === "device" ? deviceDataStorage : AsyncStorage).getItem(key) });
  }
  try {
    for (const key of currentKeys) {
      await deviceDataStorage.removeItem(key); await AsyncStorage.removeItem(key);
    }
    for (const [key, entry] of Object.entries(snapshot.entries)) {
      const value = await rewrite(entry.value, async text => restoredMedia.get(text) || text);
      await (entry.storage === "device" ? deviceDataStorage : AsyncStorage).setItem(key, value);
    }
  } catch (error) {
    for (const [key, saved] of previous) {
      const storage = saved.storage === "device" ? deviceDataStorage : AsyncStorage;
      await deviceDataStorage.removeItem(key).catch(() => {}); await AsyncStorage.removeItem(key).catch(() => {});
      if (saved.value !== null) await storage.setItem(key, saved.value).catch(() => {});
    }
    throw error;
  }
  await hydrateStorage(); setSeedLanguage(loadSettings().language);
  await reloadCategoriesFromDevice();
}
