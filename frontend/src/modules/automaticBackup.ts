import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { AppState, Platform } from "react-native";
import { BACKEND_URL, clearTokens } from "./backendSync";
import { subscribeCategories } from "./customCategories";
import { backupHash, backupIdentity, newRecoveryCode, normalizeRecoveryCode, formatRecoveryCode, encryptBackupPayload, decryptBackupPayload } from "./backupCrypto";
import { captureAppSnapshot, includeLocalMedia, validateSnapshot, restoreAppSnapshot, type AppBackupSnapshot } from "./backupSnapshot";
import { nextLocalMidnight } from "./backupTime";

const CODE_KEY = "angeltalk_backup_recovery_v1";
const STATE_KEY = "angeltalk_backup_state_v1";
export interface BackupStatus { enabled: boolean; busy: boolean; lastSavedAt: string | null; error: string | null; timeZone: string; nextDailyAt: string; }
const deviceZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
let state: BackupStatus = { enabled: true, busy: false, lastSavedAt: null, error: null, timeZone: deviceZone(), nextDailyAt: nextLocalMidnight(new Date(), deviceZone()).toISOString() };
let secret = "", lastHash = "", initialized: Promise<void> | null = null, running: Promise<void> | null = null;
let started = false, restoring = false, changedAgain = false;
const listeners = new Set<(status: BackupStatus) => void>();
function emit() { listeners.forEach(listener => listener({ ...state })); }
async function saveState() { await AsyncStorage.setItem(STATE_KEY, JSON.stringify({ enabled: state.enabled, lastSavedAt: state.lastSavedAt, lastHash, timeZone: state.timeZone, nextDailyAt: state.nextDailyAt })); emit(); }
async function saveCode(code: string) {
  secret = normalizeRecoveryCode(code);
  if (Platform.OS !== "web") {
    try { await SecureStore.setItemAsync(CODE_KEY, secret); await AsyncStorage.removeItem(CODE_KEY); return; } catch {}
  }
  await AsyncStorage.setItem(CODE_KEY, secret);
}
async function initialize() {
  if (!initialized) initialized = (async () => {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    if (raw) { try { const saved = JSON.parse(raw); state.enabled = saved.enabled !== false; state.lastSavedAt = saved.lastSavedAt || null; lastHash = saved.lastHash || ""; state.timeZone = saved.timeZone || deviceZone(); state.nextDailyAt = saved.nextDailyAt || nextLocalMidnight(new Date(), deviceZone()).toISOString(); } catch { lastHash = ""; } }
    if (Platform.OS !== "web") { try { secret = await SecureStore.getItemAsync(CODE_KEY) || ""; } catch {} }
    if (!secret) secret = await AsyncStorage.getItem(CODE_KEY) || "";
    if (!secret) await saveCode(await newRecoveryCode());
    emit();
  })().catch(error => { initialized = null; throw error; });
  return initialized;
}
export function subscribeBackups(listener: (status: BackupStatus) => void) { listeners.add(listener); listener({ ...state }); return () => { listeners.delete(listener); }; }
export async function getRecoveryCode() { await initialize(); return formatRecoveryCode(secret); }
async function request(code: string, suffix: string, options: RequestInit = {}) {
  const identity = await backupIdentity(code);
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/backups/${identity.id}${suffix}`, { ...options, signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${identity.proof}` } });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || "The backup could not be reached. Check your internet connection.");
    return json.data;
  } finally { clearTimeout(timeout); }
}
export function backupNow(force = true): Promise<void> {
  if (running) { changedAgain = true; return running; }
  running = (async () => {
    await initialize();
    if (restoring || (!force && !state.enabled)) return;
    state.busy = true; state.error = null; emit();
    try {
      const timeZone = deviceZone();
      const snapshot = await captureAppSnapshot(timeZone);
      const hash = await backupHash(JSON.stringify(snapshot.entries));
      if (!force && hash === lastHash && timeZone === state.timeZone) return;
      await includeLocalMedia(snapshot);
      const sealed = await encryptBackupPayload(JSON.stringify(snapshot), secret);
      if (sealed.length > 45 * 1024 * 1024) throw new Error("This backup is larger than the current 45 MB upload limit.");
      const result = await request(secret, "", { method: "PUT", body: JSON.stringify({ version: 1, algorithm: "AES-256-GCM", sealed, createdAt: snapshot.createdAt, timeZone, autoEnabled: state.enabled }) });
      lastHash = hash; state.lastSavedAt = result.uploadedAt; state.timeZone = timeZone; state.nextDailyAt = result.nextBackupAt;
      await saveState();
    } catch (error) { state.error = error instanceof Error ? error.message : "Backup is pending. Please try again when online."; throw error; }
    finally { state.busy = false; emit(); }
  })().finally(() => {
    running = null;
    if (changedAgain) { changedAgain = false; if (!restoring && state.enabled) setTimeout(() => { void backupNow(false).catch(() => {}); }, 2000); }
  });
  return running;
}
export async function setAutomaticBackup(enabled: boolean) {
  await initialize(); state.enabled = enabled; state.timeZone = deviceZone(); await saveState();
  if (enabled) await backupNow(true);
  else {
    await running?.catch(() => {});
    if (state.lastSavedAt) await request(secret, "/preferences", { method: "POST", body: JSON.stringify({ autoEnabled: false, timeZone: state.timeZone }) });
  }
}
export async function findRecoveryBackup(code: string): Promise<AppBackupSnapshot> {
  const envelope = await request(normalizeRecoveryCode(code), "");
  if (envelope.version !== 1 || envelope.algorithm !== "AES-256-GCM" || typeof envelope.sealed !== "string") throw new Error("Unsupported backup format.");
  const snapshot: unknown = JSON.parse(await decryptBackupPayload(envelope.sealed, code)); validateSnapshot(snapshot); return snapshot;
}
export async function restoreRecoveryBackup(code: string, snapshot: AppBackupSnapshot) {
  await initialize(); restoring = true;
  try {
    await running?.catch(() => {});
    await restoreAppSnapshot(snapshot);
    await saveCode(code); await clearTokens();
    lastHash = ""; state.enabled = true; state.error = null; state.lastSavedAt = snapshot.createdAt; state.timeZone = deviceZone();
    await saveState();
    await request(secret, "/preferences", { method: "POST", body: JSON.stringify({ autoEnabled: true, timeZone: state.timeZone }) }).catch(() => {});
  } finally { restoring = false; emit(); }
}
/** Latest encrypted save protects edits; the server makes the daily copy even when the phone app is closed. */
export function startAutomaticBackups() {
  if (started) return; started = true;
  let debounce: ReturnType<typeof setTimeout> | undefined;
  const check = () => { if (!restoring) void backupNow(false).catch(() => {}); };
  void initialize().then(check).catch(error => { state.error = error.message; emit(); });
  subscribeCategories(() => {
    if (restoring) return;
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(check, 2500);
  });
  setInterval(check, 60000);
  AppState.addEventListener("change", next => { if (next === "active" || next === "background") check(); });
  if (Platform.OS === "web" && typeof window !== "undefined") window.addEventListener("online", check);
}
