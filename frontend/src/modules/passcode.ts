import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * 4-digit admin passcode that gates the edit tools and the exit from kiosk
 * mode. Stored in the device keystore (SecureStore); falls back to AsyncStorage
 * if SecureStore is unavailable.
 */

const STORE_KEY = "kiddocare_admin_pin";

let cached: string | null = null;
let loaded = false;

async function read(): Promise<string | null> {
  try {
    const v = await SecureStore.getItemAsync(STORE_KEY);
    if (v != null) return v;
  } catch {
    /* fall through */
  }
  try {
    return await AsyncStorage.getItem(STORE_KEY);
  } catch {
    return null;
  }
}

async function write(pin: string | null) {
  try {
    if (pin) await SecureStore.setItemAsync(STORE_KEY, pin);
    else await SecureStore.deleteItemAsync(STORE_KEY);
    return;
  } catch {
    /* fall through */
  }
  try {
    if (pin) await AsyncStorage.setItem(STORE_KEY, pin);
    else await AsyncStorage.removeItem(STORE_KEY);
  } catch {
    /* ignore */
  }
}

export async function loadPasscode(): Promise<void> {
  if (loaded) return;
  cached = await read();
  loaded = true;
}

export function hasPasscode(): boolean {
  return !!cached && cached.length === 4;
}

export async function setPasscode(pin: string): Promise<boolean> {
  if (!/^\d{4}$/.test(pin)) return false;
  cached = pin;
  await write(pin);
  return true;
}

export async function clearPasscode(): Promise<void> {
  cached = null;
  await write(null);
}

/** true when there is no passcode yet (any entry allowed) or the pin matches. */
export function checkPasscode(pin: string): boolean {
  if (!hasPasscode()) return true;
  return pin === cached;
}

export const verifyPasscode = checkPasscode;
