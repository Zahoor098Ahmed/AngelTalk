import { Platform } from "react-native";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import type { ChildProfile } from "../types";
import detectorManifest from "./faceai-tiny_face_detector_model.json";
import landmarkManifest from "./faceai-face_landmark_68_tiny_model.json";
import recognitionManifest from "./faceai-face_recognition_model.json";

/**
 * On-device face recognition with face-api.js (MIT, github.com/vladmandic/face-api).
 *
 * A trained neural network turns a face into 128 numbers (a "descriptor"); two
 * photos of the same person give descriptors that are close together. Everything
 * runs on the device — the script and model weights ship inside the app, so no
 * server and no internet are needed.
 *
 * Web: runs directly in the page. Native: runs inside a hidden WebView
 * (components/FaceAIHost.tsx), which this module talks to by messages.
 */

export const FACE_AI_VERSION = 5;
/** Max descriptor distance for "same person" (face-api's usual value is 0.6; stricter for safety). */
export const MATCH_DISTANCE = 0.5;
/** Only learn new looks from very close matches. */
export const LEARN_DISTANCE = 0.38;
const MAX_LEARNED = 7;

export type FaceIssue = "noFace" | "notReady" | "error";
export type DescribeResult = { descriptor: number[] } | { issue: FaceIssue };

const MODEL_FILES = {
  "tiny_face_detector_model.bin": require("../../assets/faceai/tiny_face_detector_model.bin"),
  "face_landmark_68_tiny_model.bin": require("../../assets/faceai/face_landmark_68_tiny_model.bin"),
  // The 6.4 MB recognition model is stored as 7 shards (listed in its manifest);
  // TensorFlow joins them back together when loading.
  "face_recognition_model-shard1.bin": require("../../assets/faceai/face_recognition_model-shard1.bin"),
  "face_recognition_model-shard2.bin": require("../../assets/faceai/face_recognition_model-shard2.bin"),
  "face_recognition_model-shard3.bin": require("../../assets/faceai/face_recognition_model-shard3.bin"),
  "face_recognition_model-shard4.bin": require("../../assets/faceai/face_recognition_model-shard4.bin"),
  "face_recognition_model-shard5.bin": require("../../assets/faceai/face_recognition_model-shard5.bin"),
  "face_recognition_model-shard6.bin": require("../../assets/faceai/face_recognition_model-shard6.bin"),
  "face_recognition_model-shard7.bin": require("../../assets/faceai/face_recognition_model-shard7.bin"),
} as const;
const SCRIPT_FILE = require("../../assets/faceai/face-api.js.txt");
const MANIFESTS = {
  "tiny_face_detector_model-weights_manifest.json": detectorManifest,
  "face_landmark_68_tiny_model-weights_manifest.json": landmarkManifest,
  "face_recognition_model-weights_manifest.json": recognitionManifest,
};

/**
 * Code that runs where face-api runs (page or WebView). `window.__faceAIFiles`
 * maps file names to { b64 } (native, sent over) or { url } (web).
 */
export const FACE_AI_RUNTIME = `
(function () {
  function b64ToBuffer(b64) {
    var bin = atob(b64), len = bin.length, bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }
  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error("image load failed")); };
      img.src = src;
    });
  }
  window.__faceAI = {
    init: async function (manifests) {
      var files = window.__faceAIFiles || {};
      var realFetch = window.fetch.bind(window);
      async function serveModel(url) {
        var name = String(url).split("/").pop();
        if (manifests[name]) {
          return new Response(JSON.stringify(manifests[name]), { headers: { "Content-Type": "application/json" } });
        }
        var f = files[name];
        if (f && f.b64) return new Response(b64ToBuffer(f.b64));
        if (f && f.url) return realFetch(f.url);
        throw new Error("missing model file " + name);
      }
      // face-api fetches the manifests, TensorFlow fetches the weights with the
      // global fetch: answer every "/models/..." request from the bundled files.
      // (monkeyPatch resets the canvas/image factories too, so pass the DOM ones explicitly)
      faceapi.env.monkeyPatch({
        fetch: serveModel,
        Canvas: HTMLCanvasElement,
        Image: HTMLImageElement,
        createCanvasElement: function () { return document.createElement("canvas"); },
        createImageElement: function () { return document.createElement("img"); },
      });
      window.fetch = function (url, opts) {
        return String(url).indexOf("/models/") !== -1 ? serveModel(url) : realFetch(url, opts);
      };
      try { await faceapi.tf.setBackend("webgl"); } catch (e) {}
      await faceapi.tf.ready();
      if (faceapi.tf.getBackend() !== "webgl") { await faceapi.tf.setBackend("cpu"); await faceapi.tf.ready(); }
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      window.__faceAIFiles = null; // free the transferred weights
      return faceapi.tf.getBackend();
    },
    describe: async function (dataUri) {
      var img = await loadImage(dataUri);
      var options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 });
      var res = await faceapi.detectSingleFace(img, options).withFaceLandmarks(true).withFaceDescriptor();
      if (!res) {
        // Dim room / window behind the child: try once more on a brightened copy
        var canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        var ctx = canvas.getContext("2d");
        ctx.filter = "brightness(1.6) contrast(1.25)";
        ctx.drawImage(img, 0, 0);
        res = await faceapi.detectSingleFace(canvas, options).withFaceLandmarks(true).withFaceDescriptor();
      }
      if (!res) return { issue: "noFace" };
      return { descriptor: Array.from(res.descriptor) };
    },
  };
})();
`;

/**
 * face-api.js starts with "use strict", so its top-level `var faceapi` stays local
 * to the eval; this suffix publishes it as a global.
 */
export const EXPOSE_FACEAPI = "\n;window.faceapi = faceapi;";

// ---------------------------------------------------------------------------
// Loading the files

async function assetUri(mod: number): Promise<string> {
  const asset = Asset.fromModule(mod);
  await asset.downloadAsync();
  return asset.localUri ?? asset.uri;
}

async function readText(mod: number): Promise<string> {
  const uri = await assetUri(mod);
  if (Platform.OS === "web") return (await fetch(uri)).text();
  return FileSystem.readAsStringAsync(uri);
}

async function readBase64(mod: number): Promise<string> {
  return FileSystem.readAsStringAsync(await assetUri(mod), { encoding: FileSystem.EncodingType.Base64 });
}

// ---------------------------------------------------------------------------
// Native bridge (hidden WebView)

type HostSend = (msg: object) => void;
let hostSend: HostSend | null = null;
let hostReady: (() => void) | null = null;
const hostReadyPromise = new Promise<void>((resolve) => (hostReady = resolve));
const pending = new Map<string, { resolve: (v: any) => void; reject: (e: Error) => void }>();
let nextId = 1;

/** Called by FaceAIHost once its page has booted. */
export function registerFaceAIHost(send: HostSend) {
  hostSend = send;
  hostReady?.();
}

/** Called by FaceAIHost with every message from the page. */
export function handleFaceAIMessage(raw: string) {
  let msg: any;
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }
  const p = msg?.id ? pending.get(msg.id) : undefined;
  if (!p) return;
  pending.delete(msg.id);
  if (msg.error) p.reject(new Error(msg.error));
  else p.resolve(msg.result);
}

function call(op: string, payload: object = {}, timeoutMs = 60000): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!hostSend) return reject(new Error("face AI host not mounted"));
    const id = String(nextId++);
    pending.set(id, { resolve, reject });
    setTimeout(() => {
      if (pending.delete(id)) reject(new Error(`face AI ${op} timed out`));
    }, timeoutMs);
    hostSend({ id, op, ...payload });
  });
}

/** Sends a big string to the page in pieces (one huge message can stall the bridge). */
async function sendFile(name: string, text: string) {
  const CHUNK = 512 * 1024;
  const total = Math.max(1, Math.ceil(text.length / CHUNK));
  for (let i = 0; i < total; i++) {
    await call("chunk", { name, index: i, total, data: text.slice(i * CHUNK, (i + 1) * CHUNK) });
  }
}

// ---------------------------------------------------------------------------
// Public API

let initPromise: Promise<void> | null = null;

/** Loads the face AI once (a few seconds the first time). Safe to call repeatedly. */
export function ensureFaceAI(): Promise<void> {
  if (!initPromise) {
    initPromise = loadFaceAI().catch((e) => {
      initPromise = null; // allow a retry
      throw e;
    });
  }
  return initPromise;
}

async function loadFaceAI() {
  if (Platform.OS === "web") {
    const w = window as any;
    if (!w.faceapi) (0, eval)((await readText(SCRIPT_FILE)) + EXPOSE_FACEAPI);
    if (!w.__faceAI) (0, eval)(FACE_AI_RUNTIME);
    const files: Record<string, { url: string }> = {};
    for (const [name, mod] of Object.entries(MODEL_FILES)) files[name] = { url: await assetUri(mod) };
    w.__faceAIFiles = files;
    const backend = await w.__faceAI.init(MANIFESTS);
    console.log(`[faceAI] ready (${backend})`);
    return;
  }

  await hostReadyPromise;
  await sendFile("face-api.js", await readText(SCRIPT_FILE));
  await call("loadScript", { name: "face-api.js" });
  for (const [name, mod] of Object.entries(MODEL_FILES)) {
    await sendFile(name, await readBase64(mod));
  }
  const backend = await call("init", { manifests: MANIFESTS }, 120000);
  console.log(`[faceAI] ready (${backend})`);
}

/** Face descriptor of a photo, or why there is none (no face / AI not ready). */
export async function describeFace(photoUri: string): Promise<DescribeResult> {
  try {
    await ensureFaceAI();
  } catch (e) {
    console.warn("[faceAI] not ready:", e);
    return { issue: "notReady" };
  }
  try {
    // Small JPEG is plenty for the detector and keeps the bridge fast
    const small = await ImageManipulator.manipulateAsync(photoUri, [{ resize: { width: 480 } }], {
      base64: true,
      compress: 0.85,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    if (!small.base64) return { issue: "error" };
    const dataUri = `data:image/jpeg;base64,${small.base64}`;
    const result =
      Platform.OS === "web" ? await (window as any).__faceAI.describe(dataUri) : await call("describe", { dataUri });
    return result as DescribeResult;
  } catch (e) {
    console.warn("[faceAI] describe failed:", e);
    return { issue: "error" };
  }
}

// ---------------------------------------------------------------------------
// Matching

function distance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/** True when the child has a face profile made with this AI. */
export function hasFaceProfile(child: ChildProfile): boolean {
  return child.faceVersion === FACE_AI_VERSION && (child.faceDescriptors?.length ?? 0) > 0;
}

export interface FaceMatch {
  child: ChildProfile;
  distance: number;
}

/** Closest enrolled child within MATCH_DISTANCE, or null (unknown face → "Add a Child"). */
export function matchFace(descriptor: number[], children: ChildProfile[]): FaceMatch | null {
  let best: FaceMatch | null = null;
  for (const child of children) {
    if (!hasFaceProfile(child)) continue;
    const all = [...(child.faceDescriptors ?? []), ...(child.learnedFaceDescriptors ?? [])];
    const d = Math.min(...all.map((s) => distance(descriptor, s)));
    if (!best || d < best.distance) best = { child, distance: d };
  }
  if (best) console.log(`[faceAI] closest: ${best.child.name} distance=${best.distance.toFixed(3)} (match < ${MATCH_DISTANCE})`);
  return best && best.distance < MATCH_DISTANCE ? best : null;
}

/** Remember a new look of the child (newest few), keeping the enrolment photos forever. */
export function learnFace(child: ChildProfile, descriptor: number[]): ChildProfile {
  const learned = [...(child.learnedFaceDescriptors ?? []), descriptor].slice(-MAX_LEARNED);
  return { ...child, learnedFaceDescriptors: learned };
}
