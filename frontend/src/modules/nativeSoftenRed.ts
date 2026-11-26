/**
 * Phone (Android/iOS) version of the web's red softening in normalizeWordImage.ts.
 * The web lightens strong reds on a canvas; phones have no canvas, so the same rule runs as a
 * Skia shader. Each result is saved once in the phone's cache and reused, so it is instant next time.
 * Anything that fails returns null and the original picture is shown, so a picture is never lost.
 */
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

type Mode = true | "health";

// Same numbers as normalizeWordImage.ts (default and "health" rules), on 0–255 colour values.
const SKSL = `
uniform shader image;
uniform float mode;
half4 main(float2 p) {
  half4 c = image.eval(p);
  if (c.a <= 0.0) return c;
  float3 rgb = float3(c.rgb) / float(c.a) * 255.0;
  float r = rgb.r; float g = rgb.g; float b = rgb.b;
  float dom = r - max(g, b);
  float amount = 0.0;
  if (mode > 1.5) {
    if (r >= 105.0 && dom > 24.0 && abs(g - b) <= dom * 0.7) amount = min(0.45, (dom - 24.0) * 0.007);
  } else {
    if (r >= 130.0 && dom >= 34.0 && abs(g - b) <= dom * 0.65) amount = min(0.33, (dom - 34.0) * 0.0035);
  }
  rgb = rgb + (255.0 - rgb) * amount;
  return half4(half3(rgb / 255.0 * float(c.a)), c.a);
}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let skiaMod: any | null | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let effect: any | null | undefined;
function getSkia() {
  if (skiaMod !== undefined) return skiaMod;
  try {
    // loaded lazily: if the native module is missing, pictures just stay as they are
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    skiaMod = require("@shopify/react-native-skia");
    effect = skiaMod.Skia.RuntimeEffect.Make(SKSL);
    if (!effect) skiaMod = null;
  } catch {
    skiaMod = null;
  }
  return skiaMod;
}

const memory = new Map<string, string>();
const pending = new Map<string, Promise<string | null>>();
// several pictures at once (downloads overlap), but not so many that scrolling stutters
const MAX_PARALLEL = 4;
let running = 0;
const waiting: (() => void)[] = [];
function slot(): Promise<void> {
  if (running < MAX_PARALLEL) {
    running += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => waiting.push(() => { running += 1; resolve(); }));
}
function release() {
  running -= 1;
  waiting.shift()?.();
}

function cacheName(uri: string, mode: Mode): string {
  let h = 5381;
  const s = `${mode}:${uri}`;
  for (let i = 0; i < s.length; i += 1) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return `softred_v1_${String(mode)}_${h.toString(36)}_${s.length}.png`;
}

/** Already softened and in memory (no waiting). */
export function cachedSoftRed(uri: string, mode: Mode): string | undefined {
  return memory.get(`${mode}:${uri}`);
}

async function loadBytes(uri: string): Promise<Uint8Array | null> {
  if (uri.startsWith("data:")) {
    const comma = uri.indexOf(",");
    if (comma < 0 || !/;base64$/i.test(uri.slice(0, comma)) || /svg/i.test(uri.slice(0, comma))) return null;
    const S = getSkia();
    const data = S?.Skia.Data.fromBase64(uri.slice(comma + 1));
    return data ? (data as unknown as Uint8Array) : null;
  }
  if (!/^(https?|file):/i.test(uri) || /\.svg(\?|$)/i.test(uri)) return null;
  const S = getSkia();
  // Skia's own native download is much faster than moving the bytes through JavaScript
  try {
    const data = await S?.Skia.Data.fromURI(uri);
    if (data) return data as unknown as Uint8Array;
  } catch {
    /* fall back to fetch */
  }
  const res = await fetch(uri);
  if (!res.ok) return null;
  return S ? (S.Skia.Data.fromBytes(new Uint8Array(await res.arrayBuffer())) as unknown as Uint8Array) : null;
}

async function soften(uri: string, mode: Mode): Promise<string | null> {
  const S = getSkia();
  if (!S || !effect) return null;
  const dir = FileSystem.cacheDirectory;
  if (!dir) return null;
  const file = `${dir}${cacheName(uri, mode)}`;
  const info = await FileSystem.getInfoAsync(file);
  if (info.exists) return file;

  const raw = await loadBytes(uri);
  if (!raw) return null;
  const { Skia, TileMode, FilterMode, MipmapMode } = S;
  const image = Skia.Image.MakeImageFromEncoded(raw);
  if (!image) return null;
  const w = image.width();
  const h = image.height();
  if (!w || !h || w > 2048 || h > 2048) return null;
  const surface = Skia.Surface.Make(w, h);
  if (!surface) return null;
  const canvas = surface.getCanvas();
  const child = image.makeShaderOptions(TileMode.Clamp, TileMode.Clamp, FilterMode.Linear, MipmapMode.None);
  const shader = effect.makeShaderWithChildren([mode === "health" ? 2 : 1], [child]);
  const paint = Skia.Paint();
  paint.setShader(shader);
  canvas.drawRect(Skia.XYWHRect(0, 0, w, h), paint);
  surface.flush();
  const b64 = surface.makeImageSnapshot().encodeToBase64();
  if (!b64) return null;
  await FileSystem.writeAsStringAsync(file, b64, { encoding: FileSystem.EncodingType.Base64 });
  return file;
}

/** The softened picture as a local file, or null to keep the original. Phones only. */
export function softenRedNative(uri: string, mode: Mode): Promise<string | null> {
  if (Platform.OS === "web" || !uri) return Promise.resolve(null);
  const key = `${mode}:${uri}`;
  const hit = memory.get(key);
  if (hit) return Promise.resolve(hit);
  const inFlight = pending.get(key);
  if (inFlight) return inFlight;
  const job = slot()
    .then(() => soften(uri, mode))
    .catch((error) => {
      console.warn("[softenRed] kept the original picture:", uri.slice(0, 80), error);
      return null;
    })
    .then((out) => {
      release();
      pending.delete(key);
      if (out) memory.set(key, out);
      return out;
    });
  pending.set(key, job);
  return job;
}
