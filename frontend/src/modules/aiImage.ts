import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * AI picture generation for Picture Talk.
 *
 * Pure `fetch` — no native module, so it works in every build. The OpenAI key
 * is read from (in order):
 *   1. a key the caregiver pastes in-app (stored on device), or
 *   2. the EXPO_PUBLIC_OPENAI_API_KEY build-time env var, or
 *   3. a backend proxy URL (set AI_PROXY_URL) that holds the key server-side.
 *
 * Generated images are cached by prompt so repeat sentences are instant and
 * work offline afterwards.
 */

const KEY_STORE = "kiddocare_openai_key";
const IMG_STORE = "kiddocare_ai_image_cache";

/**
 * Optional backend proxy (see /backend). Set AI_PROXY_URL to the base URL of
 * that server (no trailing path) and the app will call
 *   <AI_PROXY_URL>/images/generations
 *   <AI_PROXY_URL>/audio/transcriptions
 * with `Authorization: Bearer <AI_PROXY_TOKEN>` and NO OpenAI key of its own.
 */
export const AI_PROXY_URL: string = process.env.EXPO_PUBLIC_AI_PROXY_URL ?? "";
export const AI_PROXY_TOKEN: string = process.env.EXPO_PUBLIC_AI_PROXY_TOKEN ?? "";

const ENV_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? "";

/** Resolve an endpoint + auth headers for a given OpenAI path. */
function endpointFor(path: string): { url: string; headers: Record<string, string> } {
  if (AI_PROXY_URL) {
    const headers: Record<string, string> = {};
    if (AI_PROXY_TOKEN) headers.Authorization = `Bearer ${AI_PROXY_TOKEN}`;
    return { url: `${AI_PROXY_URL.replace(/\/$/, "")}${path}`, headers };
  }
  return { url: `https://api.openai.com/v1${path}`, headers: { Authorization: `Bearer ${activeKey()}` } };
}

export const SENSORY_STYLE_GUIDE =
  "Flat matte children's book illustration. Single clear centred subject. " +
  "Plain white background, no scene clutter. Soft calm colours, gentle outlines. " +
  "No gloss, no reflections, no 3D shine, no text. Consistent simple style suitable " +
  "for a child with autism.";

let inMemoryKey: string | null = null;
let cache: Record<string, string> = {};
let cacheLoaded = false;

async function ensureCache() {
  if (cacheLoaded) return;
  try {
    const raw = await AsyncStorage.getItem(IMG_STORE);
    cache = raw ? JSON.parse(raw) : {};
  } catch {
    cache = {};
  }
  cacheLoaded = true;
}

export async function loadStoredKey(): Promise<void> {
  try {
    inMemoryKey = await AsyncStorage.getItem(KEY_STORE);
  } catch {
    inMemoryKey = null;
  }
}

export async function setStoredKey(key: string): Promise<void> {
  inMemoryKey = key.trim() || null;
  try {
    if (inMemoryKey) await AsyncStorage.setItem(KEY_STORE, inMemoryKey);
    else await AsyncStorage.removeItem(KEY_STORE);
  } catch {
    /* ignore */
  }
}

function activeKey(): string {
  return (inMemoryKey || ENV_KEY || "").trim();
}

/** The OpenAI key in use (shared by image generation and speech-to-text). */
export function getOpenAiKey(): string {
  return activeKey();
}

export function isAiConfigured(): boolean {
  return !!AI_PROXY_URL || !!activeKey();
}

export interface TranscriptResult {
  text?: string;
  error?: string;
  /** true when speech-to-text simply isn't set up — the caller should fall back to the keyboard, not show an error. */
  unavailable?: boolean;
}

/**
 * Speech-to-text via OpenAI Whisper. Records are made with expo-audio (already
 * a working native dep); this is a plain multipart POST — no extra native code.
 */
export async function transcribeAudio(uri: string, langHint?: string): Promise<TranscriptResult> {
  if (!isAiConfigured()) {
    return { unavailable: true, error: "Voice typing isn't set up. Use the keyboard microphone for now." };
  }
  try {
    const form = new FormData();
    form.append("file", { uri, name: "speech.m4a", type: "audio/m4a" } as unknown as Blob);
    form.append("model", "whisper-1");
    if (langHint) form.append("language", langHint);
    form.append("prompt", "A single short everyday word for a picture card, e.g. juice, apple, happy.");

    const { url, headers } = endpointFor("/audio/transcriptions");
    const res = await fetch(url, { method: "POST", headers, body: form });
    if (!res.ok) {
      // 503 = the backend has no OpenAI key -> not an error the user can fix; fall back to keyboard.
      if (res.status === 503) return { unavailable: true, error: "Voice typing isn't set up on the server. Use the keyboard microphone for now." };
      if (res.status === 401) return { error: "The OpenAI key was rejected. Check it in Settings." };
      if (res.status === 429) return { error: "OpenAI has no credit or hit a rate limit." };
      return { error: `Speech service error (${res.status}).` };
    }
    const json = (await res.json()) as { text?: string };
    const text = (json.text ?? "").trim().replace(/[.。!?]+$/, "");
    if (!text) return { error: "Didn't catch that — try again or type the word." };
    return { text };
  } catch {
    return { error: "Could not reach the speech service. Check the internet connection." };
  }
}

function promptFor(sentence: string): string {
  return `${sentence.trim()}. ${SENSORY_STYLE_GUIDE}`;
}

function hashNum(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h >>> 0;
}
function hash(s: string): string {
  return String(hashNum(s));
}

export interface AiImageResult {
  dataUri?: string;
  error?: string;
  cached?: boolean;
}

/** Generate (or fetch from cache) an illustration for a sentence. */
export async function generateSentenceImage(sentence: string, force = false): Promise<AiImageResult> {
  const clean = sentence.trim();
  if (!clean) return { error: "Type or say a sentence first." };

  await ensureCache();
  const key = hash(promptFor(clean));
  if (!force && cache[key]) return { dataUri: cache[key], cached: true };

  if (!isAiConfigured()) return { error: "AI is not connected yet. Add an OpenAI key to turn on real pictures." };

  try {
    const { url, headers } = endpointFor("/images/generations");
    const res = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-image-1", prompt: promptFor(clean), size: "1024x1024", n: 1 }),
    });

    if (!res.ok) {
      const detail = await res.text();
      if (res.status === 401) return { error: "The OpenAI key was rejected. Check the key." };
      if (res.status === 429) return { error: "OpenAI rate limit or no credit on the key." };
      return { error: `Image service error (${res.status}). ${detail.slice(0, 120)}` };
    }

    const json = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
    const item = json.data?.[0];
    let dataUri: string | undefined;
    if (item?.b64_json) dataUri = `data:image/png;base64,${item.b64_json}`;
    else if (item?.url) dataUri = item.url;

    if (!dataUri) return { error: "The image service returned no picture." };

    cache[key] = dataUri;
    // Keep only the most recent entries so AsyncStorage stays small.
    const keys = Object.keys(cache);
    if (keys.length > 12) delete cache[keys[0]];
    AsyncStorage.setItem(IMG_STORE, JSON.stringify(cache)).catch(() => {});
    return { dataUri };
  } catch {
    return { error: "Could not reach the image service. Check the internet connection." };
  }
}

export async function cachedImageFor(sentence: string): Promise<string | undefined> {
  await ensureCache();
  return cache[hash(promptFor(sentence.trim()))];
}

/**
 * AI-generate a single-word picture card (used by "Add by Voice" as an
 * alternative to searched stock images). Same OpenAI seam and cache.
 */
export async function generateWordImage(word: string, force = false): Promise<AiImageResult> {
  const clean = word.trim();
  if (!clean) return { error: "Say or type a word first." };

  await ensureCache();
  const prompt =
    `A single clear picture of "${clean}" for a communication card. ${SENSORY_STYLE_GUIDE}`;
  const key = hash(`word:${prompt}`);
  if (!force && cache[key]) return { dataUri: cache[key], cached: true };

  // No OpenAI key: use the free scene engine (Pollinations, via the backend
  // /scene route when connected, or directly). Stable seed = same word, same image.
  if (!activeKey()) {
    const seed = hashNum(`word:${clean}`) % 1000000;
    const p = encodeURIComponent(`${clean}, single object. ${SENSORY_STYLE_GUIDE}`);
    return { dataUri: `https://image.pollinations.ai/prompt/${p}?width=640&height=640&nologo=true&seed=${seed}&model=flux` };
  }

  try {
    const { url, headers } = endpointFor("/images/generations");
    const res = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-image-1", prompt, style: "word", size: "1024x1024", n: 1 }),
    });
    if (!res.ok) {
      if (res.status === 401) return { error: "The OpenAI key was rejected. Check it in Settings." };
      if (res.status === 429) return { error: "OpenAI has no credit or hit a rate limit." };
      if (res.status === 503) {
        // backend has no key — fall through to the free engine
        const seed = hashNum(`word:${clean}`) % 1000000;
        const p = encodeURIComponent(`${clean}, single object. ${SENSORY_STYLE_GUIDE}`);
        return { dataUri: `https://image.pollinations.ai/prompt/${p}?width=640&height=640&nologo=true&seed=${seed}&model=flux` };
      }
      return { error: `Image service error (${res.status}).` };
    }
    const json = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
    const item = json.data?.[0];
    const dataUri = item?.b64_json ? `data:image/png;base64,${item.b64_json}` : item?.url;
    if (!dataUri) return { error: "The image service returned no picture." };

    cache[key] = dataUri;
    const keys = Object.keys(cache);
    if (keys.length > 12) delete cache[keys[0]];
    AsyncStorage.setItem(IMG_STORE, JSON.stringify(cache)).catch(() => {});
    return { dataUri };
  } catch {
    return { error: "Could not reach the image service. Check the internet connection." };
  }
}
