import {
  createAudioPlayer,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  AudioModule,
  RecordingPresets,
  type AudioStatus,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import * as Speech from "expo-speech";
import type { LanguageCode } from "../types";

/**
 * Voice recording + playback for communication words.
 *
 * - A word may have its own recorded clip (familiar voice) or fall back to TTS.
 * - The sentence bar plays each word in order, chaining clips and TTS.
 * - Clips are stored under the app's document directory so they survive and
 *   ship in a backup.
 */

const CLIP_DIR = `${FileSystem.documentDirectory}voice/`;

async function ensureDir() {
  try {
    const info = await FileSystem.getInfoAsync(CLIP_DIR);
    if (!info.exists) await FileSystem.makeDirectoryAsync(CLIP_DIR, { intermediates: true });
  } catch {
    /* ignore */
  }
}

// --- recording -----------------------------------------------------------

// AudioModule is a native module (loosely typed); the recorder is its class instance.
let recorder: { prepareToRecordAsync: () => Promise<void>; record: () => void; stop: () => Promise<void>; uri: string | null } | null =
  null;

export async function canRecord(): Promise<boolean> {
  try {
    const res = await requestRecordingPermissionsAsync();
    return res.granted;
  } catch {
    return false;
  }
}

export async function startRecording(): Promise<boolean> {
  if (!(await canRecord())) return false;
  try {
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    const Ctor = (AudioModule as { AudioRecorder: new (o: unknown) => NonNullable<typeof recorder> }).AudioRecorder;
    const rec = new Ctor(RecordingPresets.HIGH_QUALITY);
    await rec.prepareToRecordAsync();
    rec.record();
    recorder = rec;
    return true;
  } catch {
    recorder = null;
    return false;
  }
}

/** Stop recording and return the temporary file uri as-is (for transcription). */
export async function stopRecordingTemp(): Promise<string | null> {
  const rec = recorder;
  if (!rec) return null;
  try {
    await rec.stop();
    recorder = null;
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    return rec.uri ?? null;
  } catch {
    recorder = null;
    return null;
  }
}

/** Stop recording and move the clip into permanent storage. Returns its uri. */
export async function stopRecording(wordId: string): Promise<string | null> {
  const rec = recorder;
  if (!rec) return null;
  try {
    await rec.stop();
    const tmp = rec.uri;
    recorder = null;
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    if (!tmp) return null;
    await ensureDir();
    const dest = `${CLIP_DIR}${wordId}.m4a`;
    try {
      await FileSystem.deleteAsync(dest, { idempotent: true });
    } catch {
      /* ignore */
    }
    await FileSystem.moveAsync({ from: tmp, to: dest });
    return dest;
  } catch {
    recorder = null;
    return null;
  }
}

export async function deleteClip(uri?: string) {
  if (!uri) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    /* ignore */
  }
}

// --- playback ------------------------------------------------------------

function playClip(uri: string): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try {
        player.remove();
      } catch {
        /* ignore */
      }
      resolve();
    };
    const player = createAudioPlayer(uri);
    const sub = player.addListener("playbackStatusUpdate", (s: AudioStatus) => {
      if (s.didJustFinish) {
        sub?.remove?.();
        finish();
      }
    });
    try {
      player.play();
    } catch {
      finish();
    }
    // safety timeout so a broken clip never hangs the sentence
    setTimeout(finish, 6000);
  });
}

function speakWord(text: string, lang: LanguageCode, rate: number): Promise<void> {
  return new Promise((resolve) => {
    let resolved = false;
    const finish = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };
    // safety timeout so a stuck speech engine never hangs playback
    const timer = setTimeout(finish, 5000);

    // Language safety: If text is pure ASCII/Latin and language is set to Arabic/Urdu,
    // fallback to English voice so Android Google TTS doesn't crash or go completely silent.
    const isAscii = /^[\x00-\x7F\s.,!?'"-]+$/.test(text);
    const speechLang = isAscii && (lang === "ur-PK" || lang === "ar-SA") ? "en-US" : lang;

    try {
      Speech.speak(text, {
        language: speechLang,
        rate,
        pitch: 1.05,
        onDone: () => {
          clearTimeout(timer);
          finish();
        },
        onStopped: () => {
          clearTimeout(timer);
          finish();
        },
        onError: () => {
          clearTimeout(timer);
          finish();
        },
      });
    } catch {
      clearTimeout(timer);
      finish();
    }
  });
}

export interface SpokenWord {
  label: string;
  audioUri?: string;
  useTextToSpeech?: boolean;
}

/** Play one word: its clip if present and allowed, otherwise TTS. */
export async function playWord(word: SpokenWord, lang: LanguageCode, rate = 0.9): Promise<void> {
  Speech.stop();
  if (word.audioUri && word.useTextToSpeech !== true) {
    await playClip(word.audioUri);
  } else {
    await speakWord(word.label, lang, rate);
  }
}

/** Stop any speech currently playing. */
export function stopSentence(): void {
  try {
    Speech.stop();
  } catch {
    /* ignore */
  }
}

/** Play a whole sentence: natural coherent speech if text-to-speech, or sequenced clips. */
export async function playSentence(words: SpokenWord[], lang: LanguageCode, rate = 0.9): Promise<void> {
  stopSentence();
  if (!words || words.length === 0) return;

  const hasCustomAudio = words.some((w) => w.audioUri && w.useTextToSpeech !== true);
  if (!hasCustomAudio) {
    // Speak continuous natural sentence
    const fullText = words.map((w) => w.label.trim()).filter(Boolean).join(" ");
    if (fullText) {
      await speakWord(fullText, lang, rate);
    }
    return;
  }

  // Sequenced fallback for custom recorded parent voice clips
  for (const w of words) {
    await playWord(w, lang, rate);
    await new Promise((r) => setTimeout(r, 100));
  }
}

export function previewClip(uri: string): Promise<void> {
  return playClip(uri);
}

/**
 * Play a short, distinct, gentle tone/chime to alert a caregiver or therapist
 * that the child needs attention, independent of the sentence building flow.
 */
export async function playAttentionChime(): Promise<void> {
  Speech.stop();
  try {
    Speech.speak("Attention please", {
      language: "en-US",
      pitch: 1.4,
      rate: 1.15,
    });
  } catch {
    /* ignore */
  }
}
