import AsyncStorage from "@react-native-async-storage/async-storage";
import { cloudProfile } from "./cloudProfiles";
import type { ChildProfile } from "../types";

export const BACKEND_URL =
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_BACKEND_URL) || "http://localhost:4000";

const ACCESS_TOKEN_KEY = "angeltalk_access_token";
const REFRESH_TOKEN_KEY = "angeltalk_refresh_token";
const PIN_TOKEN_KEY = "angeltalk_pin_token";

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

/** Kept for older callers; private boards are never uploaded or pulled. */
export async function syncBidirectional(): Promise<{ pushed: number; pulled: number }> {
  const { syncNow } = await import("./cloudConnect");
  await syncNow();
  return { pushed: 0, pulled: 0 };
}

/** Only the basic profile is eligible for the central users/children directory. */
export async function syncChildBioData(child: ChildProfile): Promise<void> {
  if (!(await getAccessToken())) return;
  try {
    await authFetch("/api/v1/sync/push", {
      method: "POST",
      body: JSON.stringify({ mutations: [{
        table: "children", id: child.id, action: "UPSERT",
        clientUpdatedAt: new Date().toISOString(), data: cloudProfile(child),
      }] }),
    });
  } catch (error) {
    console.warn("Profile sync deferred:", error);
  }
}
