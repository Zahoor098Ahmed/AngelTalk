import AsyncStorage from "@react-native-async-storage/async-storage";

const DATABASE = "angeltalk-device-data";
const STORE = "local-data";
let database: Promise<IDBDatabase> | null = null;
const writes = new Map<string, Promise<void>>();

function openDatabase(): Promise<IDBDatabase> {
  if (!database) {
    database = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DATABASE, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => { request.result.close(); database = null; };
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Local database is blocked"));
    }).catch((error) => { database = null; throw error; });
  }
  return database;
}

async function read(key: string): Promise<string | null> {
  if (typeof indexedDB !== "undefined") {
    try {
      const db = await openDatabase();
      const value = await new Promise<string | undefined>((resolve, reject) => {
        const request = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      if (value !== undefined) return value;
    } catch { /* Existing local storage remains available if IndexedDB is unavailable. */ }
  }
  return AsyncStorage.getItem(key);
}

async function write(key: string, value: string | null): Promise<void> {
  if (typeof indexedDB !== "undefined") {
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE, "readwrite");
        const store = transaction.objectStore(STORE);
        if (value === null) store.delete(key); else store.put(value, key);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error("Local save aborted"));
      });
      // Retire only this key's old copy after the database transaction commits.
      await AsyncStorage.removeItem(key).catch(() => {});
      return;
    } catch { /* Native devices and restricted browsers use AsyncStorage. */ }
  }
  if (value === null) await AsyncStorage.removeItem(key);
  else await AsyncStorage.setItem(key, value);
}

function enqueue(key: string, value: string | null): Promise<void> {
  const pending = (writes.get(key) || Promise.resolve()).catch(() => {}).then(() => write(key, value));
  writes.set(key, pending);
  const clear = () => { if (writes.get(key) === pending) writes.delete(key); };
  pending.then(clear, clear);
  return pending;
}

/** Private to this browser origin/device. Never contacts the server. */
export const deviceDataStorage = {
  async getDatabaseKeys(): Promise<string[]> {
    await Promise.all([...writes.values()].map(pending => pending.catch(() => {})));
    if (typeof indexedDB === "undefined") return [];
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE, "readonly").objectStore(STORE).getAllKeys();
      request.onsuccess = () => resolve(request.result.map(String));
      request.onerror = () => reject(request.error);
    });
  },
  async getItem(key: string): Promise<string | null> {
    await writes.get(key)?.catch(() => {});
    return read(key);
  },
  setItem(key: string, value: string): Promise<void> { return enqueue(key, value); },
  removeItem(key: string): Promise<void> { return enqueue(key, null); },
};
