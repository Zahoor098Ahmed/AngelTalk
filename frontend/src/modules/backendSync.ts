import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  listCategories,
  restoreBackup,
  notifyListeners,
} from "./customCategories";
import { loadChildren, saveChildren } from "./storage";
import type { ChildProfile, CustomCategory, CustomWord, DiagnosisType } from "../types";

export const BACKEND_URL =
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_BACKEND_URL) || "http://localhost:4000";

const ACCESS_TOKEN_KEY = "angeltalk_access_token";
const REFRESH_TOKEN_KEY = "angeltalk_refresh_token";
const PIN_TOKEN_KEY = "angeltalk_pin_token";
const LAST_SYNC_KEY = "angeltalk_last_sync_timestamp";

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
  serverConnected: boolean;
}

let syncStatus: SyncStatus = {
  isSyncing: false,
  lastSyncedAt: null,
  error: null,
  serverConnected: false,
};

type SyncListener = (status: SyncStatus) => void;
const syncListeners = new Set<SyncListener>();

function emitStatus() {
  syncListeners.forEach((listener) => {
    try {
      listener({ ...syncStatus });
    } catch {
      /* ignore */
    }
  });
}

export function subscribeSyncStatus(fn: SyncListener): () => void {
  syncListeners.add(fn);
  fn({ ...syncStatus });
  return () => {
    syncListeners.delete(fn);
  };
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken),
    AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
    AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
    AsyncStorage.removeItem(PIN_TOKEN_KEY),
  ]);
}

/**
 * Checks server reachability
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${BACKEND_URL}/health`, { signal: controller.signal });
    clearTimeout(timer);
    const ok = res.ok;
    syncStatus.serverConnected = ok;
    emitStatus();
    return ok;
  } catch {
    syncStatus.serverConnected = false;
    emitStatus();
    return false;
  }
}

/**
 * Standard fetch with auth header & automatic token refresh
 */
export async function authFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const pinToken = await AsyncStorage.getItem(PIN_TOKEN_KEY);
  if (pinToken) {
    headers.set("x-pin-token", pinToken);
  }

  const url = `${BACKEND_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  let res = await fetch(url, { ...options, headers });

  // Handle 401 token refresh
  if (res.status === 401 && !endpoint.includes("/auth/")) {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          if (data.data?.accessToken && data.data?.refreshToken) {
            await setTokens(data.data.accessToken, data.data.refreshToken);
            headers.set("Authorization", `Bearer ${data.data.accessToken}`);
            res = await fetch(url, { ...options, headers });
          }
        } else {
          await clearTokens();
        }
      } catch {
        /* ignore refresh network fail */
      }
    }
  }

  return res;
}

/**
 * Register account with backend
 */
export async function backendRegister(data: {
  email: string;
  password: string;
  fullName: string;
  role?: string;
  pin?: string;
}) {
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Registration failed");
  }
  if (json.data?.accessToken && json.data?.refreshToken) {
    await setTokens(json.data.accessToken, json.data.refreshToken);
  }
  return json.data;
}

/**
 * Sign In with backend
 */
export async function backendLogin(email: string, pass: string) {
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Sign in failed");
  }
  if (json.data?.accessToken && json.data?.refreshToken) {
    await setTokens(json.data.accessToken, json.data.refreshToken);
  }
  return json.data;
}

/**
 * Perform bidirectional delta sync:
 * 1. Push local changes to cloud
 * 2. Pull server changes to local
 */
export async function syncBidirectional(): Promise<{ pushed: number; pulled: number }> {
  const token = await getAccessToken();
  if (!token) {
    return { pushed: 0, pulled: 0 };
  }

  syncStatus.isSyncing = true;
  syncStatus.error = null;
  emitStatus();

  try {
    const children = loadChildren();
    const activeChild = children[0];
    if (!activeChild) {
      syncStatus.isSyncing = false;
      emitStatus();
      return { pushed: 0, pulled: 0 };
    }

    const categories = listCategories();
    const mutations: Array<{
      table: string;
      id: string;
      action: "upsert" | "delete";
      clientUpdatedAt: string;
      data: Record<string, unknown>;
    }> = [];

    const now = new Date().toISOString();

    // 1. Prepare shelf and word mutations from local categories
    for (let cIdx = 0; cIdx < categories.length; cIdx++) {
      const cat = categories[cIdx];
      mutations.push({
        table: "shelves",
        id: cat.id,
        action: "upsert",
        clientUpdatedAt: now,
        data: {
          childId: activeChild.id,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          order: cIdx,
        },
      });

      for (let wIdx = 0; wIdx < cat.words.length; wIdx++) {
        const w = cat.words[wIdx];
        mutations.push({
          table: "words",
          id: w.id,
          action: "upsert",
          clientUpdatedAt: now,
          data: {
            childId: activeChild.id,
            shelfId: cat.id,
            label: w.label,
            phrase: w.phrase || w.label,
            imageUri: w.imageUri,
            color: w.color,
            order: wIdx,
          },
        });
      }
    }

    let pushedCount = 0;
    // Push in chunks of 50
    for (let i = 0; i < mutations.length; i += 50) {
      const batch = mutations.slice(i, i + 50);
      const pushRes = await authFetch("/api/v1/sync/push", {
        method: "POST",
        body: JSON.stringify({ mutations: batch }),
      });
      if (pushRes.ok) {
        const resJson = await pushRes.json();
        pushedCount += (resJson.data?.results?.filter((r: { status: string }) => r.status === "applied")?.length || 0);
      }
    }

    // 2. Pull delta updates
    const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
    const pullUrl = lastSync ? `/api/v1/sync/pull?since=${encodeURIComponent(lastSync)}` : "/api/v1/sync/pull";
    const pullRes = await authFetch(pullUrl);

    let pulledCount = 0;
    if (pullRes.ok) {
      const pullJson = await pullRes.json();
      const tables = pullJson.data?.tables || {};

      // Merge remote children if any
      if (tables.children && tables.children.length > 0) {
        const remoteChildren: ChildProfile[] = tables.children.map((rc: { _id: string; name: string; age: number; diagnoses?: DiagnosisType[] }) => ({
          id: rc._id,
          name: rc.name,
          age: rc.age,
          diagnoses: rc.diagnoses || ["general"],
          allowedTags: ["aac"],
          embedding: [],
          enrolledAt: Date.now(),
          stars: 10,
          badges: [],
        }));
        saveChildren(remoteChildren);
      }

      // Merge remote shelves and words if present
      if (tables.shelves && tables.shelves.length > 0) {
        const remoteShelves = tables.shelves;
        const remoteWords = tables.words || [];

        const incomingCategories: CustomCategory[] = remoteShelves.map((rShelf: { _id: string; name: string; color?: string; icon?: string }) => {
          const shelfWords: CustomWord[] = remoteWords
            .filter((rw: { shelfId: string }) => rw.shelfId === rShelf._id)
            .map((rw: { _id: string; label: string; phrase?: string; imageUri?: string; color?: string }) => ({
              id: rw._id,
              label: rw.label,
              phrase: rw.phrase || rw.label,
              imageUri: rw.imageUri,
              color: rw.color,
            }));

          return {
            id: rShelf._id,
            name: rShelf.name,
            color: rShelf.color || "#4CAF50",
            icon: rShelf.icon,
            words: shelfWords,
          };
        });

        restoreBackup({ categories: incomingCategories }, "merge");
        notifyListeners();
        pulledCount += incomingCategories.length;
      }

      if (pullJson.data?.syncedAt) {
        await AsyncStorage.setItem(LAST_SYNC_KEY, pullJson.data.syncedAt);
        syncStatus.lastSyncedAt = pullJson.data.syncedAt;
      }
    }

    syncStatus.isSyncing = false;
    syncStatus.serverConnected = true;
    emitStatus();

    return { pushed: pushedCount, pulled: pulledCount };
  } catch (err: unknown) {
    syncStatus.isSyncing = false;
    syncStatus.error = err instanceof Error ? err.message : "Sync error";
    emitStatus();
    throw err;
  }
}

/**
 * Persists child bio data and clinical contact updates directly to MongoDB Atlas
 */
export async function syncChildBioData(child: ChildProfile): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;

  try {
    const now = new Date().toISOString();
    const mutations: Array<{
      table: string;
      id: string;
      action: "upsert";
      clientUpdatedAt: string;
      data: Record<string, unknown>;
    }> = [
      {
        table: "children",
        id: child.id,
        action: "upsert",
        clientUpdatedAt: now,
        data: {
          name: child.name,
          age: child.age,
          diagnoses: child.diagnoses || ["general"],
          photoUrl: child.photoUrl,
        },
      },
    ];

    if (child.doctorContact) {
      mutations.push({
        table: "passcards",
        id: `passcard_${child.id}`,
        action: "upsert",
        clientUpdatedAt: now,
        data: {
          childId: child.id,
          name: child.name,
          emergencyContact: child.doctorContact.phone || "",
          physicianName: child.doctorContact.doctorName || "",
        },
      });
    }

    await authFetch("/api/v1/sync/push", {
      method: "POST",
      body: JSON.stringify({ mutations }),
    });
  } catch (err) {
    console.warn("Auto-sync bio data to Atlas deferred:", err);
  }
}
