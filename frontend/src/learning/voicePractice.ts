import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { startRecording, stopRecordingTemp, canRecord, deleteClip } from "../modules/audio";

/**
 * Feature 4 — Voice Practice recordings.
 *
 * Deliberately separate from the single-clip-per-word "familiar voice"
 * recordings audio.ts already manages for AAC tiles (WordEditor lets a
 * parent record ONE clip that replaces TTS for that word going forward,
 * overwriting the file each time). Voice Practice instead keeps MANY
 * timestamped clips per word so progress is audible over weeks — a
 * completely different lifecycle, so it gets its own storage scheme and
 * its own directory, while reusing audio.ts's low-level record/playback
 * primitives (startRecording/stopRecordingTemp/previewClip/deleteClip)
 * rather than reinventing microphone handling.
 *
 * Non-negotiable per the design spec: recordings are NEVER scored, NEVER
 * uploaded, and NEVER leave the device. This module has no network calls at
 * all — that's enforced by omission, not by a flag.
 */

export interface VoiceClip {
  id: string;
  childId: string;
  wordId: string;
  /** The word's label at the moment it was recorded — frozen, since labels get retranslated on a language switch and a 3-week-old clip should still show what it was practicing. */
  label: string;
  uri: string;
  createdAtMs: number;
}

const CLIP_DIR = `${FileSystem.documentDirectory}voicePractice/`;
const KEY = "kiddocare_voice_practice_clips";
const MAX_CLIPS_PER_CHILD = 200;

let cache: Record<string, VoiceClip[]> = {}; // childId -> clips, newest first
let loaded = false;

async function persist(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* best-effort */
  }
}

export async function ensureVoicePracticeLoaded(): Promise<void> {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? JSON.parse(raw) : {};
  } catch {
    cache = {};
  }
  loaded = true;
}

async function ensureDir() {
  try {
    const info = await FileSystem.getInfoAsync(CLIP_DIR);
    if (!info.exists) await FileSystem.makeDirectoryAsync(CLIP_DIR, { intermediates: true });
  } catch {
    /* ignore */
  }
}

/** Newest-first, matching how Parent Hub browses them chronologically. */
export function getClipsForChild(childId: string): VoiceClip[] {
  return cache[childId] ?? [];
}

export function getClipsForWord(childId: string, wordId: string): VoiceClip[] {
  return getClipsForChild(childId).filter((c) => c.wordId === wordId);
}

export { canRecord, startRecording };

/** Stop the active recording and save it as a new, permanent, timestamped clip. */
export async function finishRecordingClip(childId: string, wordId: string, label: string): Promise<VoiceClip | null> {
  const tempUri = await stopRecordingTemp();
  if (!tempUri) return null;

  await ensureDir();
  const createdAtMs = Date.now();
  const dest = `${CLIP_DIR}${childId}_${wordId}_${createdAtMs}.m4a`;
  try {
    await FileSystem.moveAsync({ from: tempUri, to: dest });
  } catch {
    return null;
  }

  const clip: VoiceClip = { id: `vc_${createdAtMs}_${Math.random().toString(36).slice(2, 8)}`, childId, wordId, label, uri: dest, createdAtMs };
  const list = cache[childId] ?? (cache[childId] = []);
  list.unshift(clip);

  // Storage hygiene: cap at MAX_CLIPS_PER_CHILD, auto-pruning the oldest —
  // and actually delete the pruned file, not just forget about it, so the
  // cap is real and not just a metadata illusion.
  if (list.length > MAX_CLIPS_PER_CHILD) {
    const overflow = list.splice(MAX_CLIPS_PER_CHILD);
    for (const old of overflow) await deleteClip(old.uri);
  }

  await persist();
  return clip;
}

export async function deleteVoiceClip(childId: string, clipId: string): Promise<void> {
  const list = cache[childId] ?? [];
  const clip = list.find((c) => c.id === clipId);
  if (!clip) return;
  cache[childId] = list.filter((c) => c.id !== clipId);
  await deleteClip(clip.uri);
  await persist();
}

export async function deleteAllVoiceClips(childId: string): Promise<void> {
  const list = cache[childId] ?? [];
  for (const clip of list) await deleteClip(clip.uri);
  cache[childId] = [];
  await persist();
}

/** Total on-disk size of a child's practice clips, in bytes — for the Settings storage-footprint display. */
export async function getStorageFootprintBytes(childId: string): Promise<number> {
  const list = cache[childId] ?? [];
  let total = 0;
  for (const clip of list) {
    try {
      const info = await FileSystem.getInfoAsync(clip.uri);
      if (info.exists && typeof info.size === "number") total += info.size;
    } catch {
      /* ignore a missing/unreadable file rather than fail the whole total */
    }
  }
  return total;
}
