import { Platform } from "react-native";
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
import { wordLabel, canonicalWordEn } from "./i18n";

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

// Web MediaRecorder state
let webMediaRecorder: any = null;
let webAudioChunks: Blob[] = [];
let webStream: any = null;

// AudioModule is a native module (loosely typed); the recorder is its class instance.
let recorder: { prepareToRecordAsync: () => Promise<void>; record: () => void; stop: () => Promise<void>; uri: string | null } | null =
  null;

export async function canRecord(): Promise<boolean> {
  if (Platform.OS === "web") {
    return typeof navigator !== "undefined" && !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
  }
  try {
    const res = await requestRecordingPermissionsAsync();
    return res.granted;
  } catch {
    return false;
  }
}

export async function startRecording(): Promise<boolean> {
  if (Platform.OS === "web") {
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        console.warn("[audio] MediaDevices.getUserMedia not supported on this browser.");
        return false;
      }
      if (webStream) {
        try {
          webStream.getTracks().forEach((track: any) => track.stop());
        } catch {}
        webStream = null;
      }
      webStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      webAudioChunks = [];
      let mime = "";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) mime = "audio/webm;codecs=opus";
        else if (MediaRecorder.isTypeSupported("audio/webm")) mime = "audio/webm";
        else if (MediaRecorder.isTypeSupported("audio/mp4")) mime = "audio/mp4";
        else if (MediaRecorder.isTypeSupported("audio/ogg")) mime = "audio/ogg";
      }
      webMediaRecorder = mime ? new MediaRecorder(webStream, { mimeType: mime }) : new MediaRecorder(webStream);
      webMediaRecorder.ondataavailable = (e: any) => {
        if (e.data && e.data.size > 0) {
          webAudioChunks.push(e.data);
        }
      };
      webMediaRecorder.start(100);
      return true;
    } catch (err) {
      console.warn("Web audio recording start failed:", err);
      return false;
    }
  }

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
  if (Platform.OS === "web") {
    if (!webMediaRecorder) return null;
    return new Promise((resolve) => {
      const finish = () => {
        try {
          if (webStream) {
            webStream.getTracks().forEach((track: any) => track.stop());
            webStream = null;
          }
          if (webAudioChunks.length === 0) {
            webMediaRecorder = null;
            resolve(null);
            return;
          }
          const mime = webMediaRecorder?.mimeType || "audio/webm";
          const blob = new Blob(webAudioChunks, { type: mime });
          webMediaRecorder = null;
          webAudioChunks = [];
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            resolve(URL.createObjectURL(blob));
          };
          reader.readAsDataURL(blob);
        } catch {
          webMediaRecorder = null;
          resolve(null);
        }
      };

      if (webMediaRecorder.state === "recording") {
        webMediaRecorder.onstop = finish;
        try {
          webMediaRecorder.requestData();
          webMediaRecorder.stop();
        } catch {
          finish();
        }
      } else {
        finish();
      }
    });
  }

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
  if (Platform.OS === "web") {
    if (!webMediaRecorder) return null;
    return new Promise((resolve) => {
      const finish = () => {
        try {
          if (webStream) {
            webStream.getTracks().forEach((track: any) => track.stop());
            webStream = null;
          }
          if (webAudioChunks.length === 0) {
            webMediaRecorder = null;
            resolve(null);
            return;
          }
          const mime = webMediaRecorder?.mimeType || "audio/webm";
          const blob = new Blob(webAudioChunks, { type: mime });
          webMediaRecorder = null;
          webAudioChunks = [];
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            resolve(URL.createObjectURL(blob));
          };
          reader.readAsDataURL(blob);
        } catch {
          webMediaRecorder = null;
          resolve(null);
        }
      };

      if (webMediaRecorder.state === "recording") {
        webMediaRecorder.onstop = finish;
        try {
          webMediaRecorder.requestData();
          webMediaRecorder.stop();
        } catch {
          finish();
        }
      } else {
        finish();
      }
    });
  }

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
  if (Platform.OS === "web" && uri.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(uri);
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    /* ignore */
  }
}

let currentPlayingWebAudio: any = null;

function playClip(uri: string): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };

    if (Platform.OS === "web") {
      try {
        if (currentPlayingWebAudio) {
          try {
            currentPlayingWebAudio.pause();
            currentPlayingWebAudio.currentTime = 0;
          } catch {
            /* ignore */
          }
          currentPlayingWebAudio = null;
        }
        const audio = new Audio(uri);
        currentPlayingWebAudio = audio;
        audio.onended = () => {
          if (currentPlayingWebAudio === audio) currentPlayingWebAudio = null;
          finish();
        };
        audio.onerror = () => {
          if (currentPlayingWebAudio === audio) currentPlayingWebAudio = null;
          finish();
        };
        audio.play().catch(finish);
        setTimeout(finish, 6000);
        return;
      } catch {
        finish();
        return;
      }
    }

    const player = createAudioPlayer(uri);
    const sub = player.addListener("playbackStatusUpdate", (s: AudioStatus) => {
      if (s.didJustFinish) {
        sub?.remove?.();
        try {
          player.remove();
        } catch {
          /* ignore */
        }
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

const ttsAudioInstanceCache = new Map<string, HTMLAudioElement>();

export function preloadTTS(text: string, langCode: "ar" | "ur"): void {
  if (Platform.OS !== "web" || !text?.trim()) return;
  const cleanText = text.trim();
  const cacheKey = `${langCode}:${cleanText}`;
  if (ttsAudioInstanceCache.has(cacheKey)) return;
  try {
    const origin = typeof window !== "undefined" && window.location?.origin ? window.location.origin : "http://localhost:8081";
    const proxyUrl = `${origin}/api/tts?q=${encodeURIComponent(cleanText)}&tl=${langCode}`;
    const audio = new Audio(proxyUrl);
    ttsAudioInstanceCache.set(cacheKey, audio);
  } catch {
    /* ignore */
  }
}

export function playOnlineTTS(text: string, langCode: "ar" | "ur"): Promise<boolean> {
  const cleanText = (text || "").trim();
  if (!cleanText) return Promise.resolve(false);

  return new Promise((resolve) => {
    try {
      stopSentence();

      const origin = typeof window !== "undefined" && window.location?.origin ? window.location.origin : "http://localhost:8081";
      const proxyUrl = `${origin}/api/tts?q=${encodeURIComponent(cleanText)}&tl=${langCode}`;
      const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${langCode}&client=gtx`;

      if (Platform.OS === "web") {
        if (currentPlayingWebAudio) {
          try {
            currentPlayingWebAudio.pause();
            currentPlayingWebAudio.currentTime = 0;
          } catch {
            /* ignore */
          }
          currentPlayingWebAudio = null;
        }

        let done = false;
        const finish = (ok: boolean) => {
          if (done) return;
          done = true;
          resolve(ok);
        };

        const cacheKey = `${langCode}:${cleanText}`;
        let audio = ttsAudioInstanceCache.get(cacheKey);
        if (!audio) {
          audio = new Audio(proxyUrl);
          ttsAudioInstanceCache.set(cacheKey, audio);
        } else {
          try {
            audio.currentTime = 0;
          } catch {
            /* ignore */
          }
        }

        currentPlayingWebAudio = audio;
        audio.onended = () => {
          if (currentPlayingWebAudio === audio) currentPlayingWebAudio = null;
          finish(true);
        };
        audio.onerror = () => {
          try {
            const alt = new Audio(directUrl);
            currentPlayingWebAudio = alt;
            alt.onended = () => {
              if (currentPlayingWebAudio === alt) currentPlayingWebAudio = null;
              finish(true);
            };
            alt.onerror = () => {
              if (currentPlayingWebAudio === alt) currentPlayingWebAudio = null;
              finish(false);
            };
            alt.play().catch(() => finish(false));
          } catch {
            finish(false);
          }
        };
        audio.play().catch(() => {
          try {
            const alt = new Audio(directUrl);
            currentPlayingWebAudio = alt;
            alt.onended = () => {
              if (currentPlayingWebAudio === alt) currentPlayingWebAudio = null;
              finish(true);
            };
            alt.onerror = () => {
              if (currentPlayingWebAudio === alt) currentPlayingWebAudio = null;
              finish(false);
            };
            alt.play().catch(() => finish(false));
          } catch {
            finish(false);
          }
        });

        setTimeout(() => finish(true), 4000);
        return;
      }

      playClip(proxyUrl).then(() => resolve(true)).catch(() => {
        playClip(directUrl).then(() => resolve(true)).catch(() => resolve(false));
      });
    } catch {
      resolve(false);
    }
  });
}

async function speakWord(text: string, lang: LanguageCode, rate: number, voiceType: import("../types").VoiceType = "boy"): Promise<void> {
  let textToSpeak = (text || "").trim();
  if (!textToSpeak) return;

  // If language is Arabic or Urdu, ensure text is translated to the target script before speaking
  if (lang === "ar-SA" && !/[\u0600-\u06FF]/.test(textToSpeak)) {
    textToSpeak = wordLabel(textToSpeak, "ar-SA") || textToSpeak;
  } else if (lang === "ur-PK" && !/[\u0600-\u06FF]/.test(textToSpeak)) {
    textToSpeak = wordLabel(textToSpeak, "ur-PK") || textToSpeak;
  } else if (lang === "en-US" && /[\u0600-\u06FF]/.test(textToSpeak)) {
    textToSpeak = canonicalWordEn(textToSpeak) || textToSpeak;
  }

  const hasArabicScript = /[\u0600-\u06FF]/.test(textToSpeak);
  const speechLang = (lang === "ar-SA" || hasArabicScript) ? "ar-SA" : (lang === "ur-PK" ? "ur-PK" : "en-US");

  const profile = {
    boy: { pitch: 1.25, rateMultiplier: 1.0 },
    girl: { pitch: 1.38, rateMultiplier: 1.0 },
    woman: { pitch: 1.08, rateMultiplier: 0.96 },
    man: { pitch: 0.82, rateMultiplier: 0.92 },
  }[voiceType] || { pitch: 1.25, rateMultiplier: 1.0 };

  const finalRate = Math.max(0.5, Math.min(1.5, rate * profile.rateMultiplier));

  // Check if a genuine system voice for Arabic or Urdu is installed on this device/browser
  let nativeVoiceFound = false;
  let chosenVoice: string | undefined;

  if (typeof window !== "undefined" && window.speechSynthesis) {
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const match = voices.find((v) => {
          const l = (v.lang || "").toLowerCase();
          if (speechLang === "ar-SA") return l.startsWith("ar");
          if (speechLang === "ur-PK") return l.startsWith("ur") || l.startsWith("hi");
          return l.startsWith("en");
        });
        if (match) {
          nativeVoiceFound = true;
          chosenVoice = match.voiceURI || match.name;
        }
      }
    } catch {
      /* ignore */
    }
  }

  // If speaking Arabic or Urdu and no native system voice is present (e.g. desktop browsers, Windows):
  // Play authentic Google TTS audio stream so it pronounces genuine Arabic/Urdu.
  if ((speechLang === "ar-SA" || speechLang === "ur-PK") && !nativeVoiceFound) {
    const ttsLang = speechLang === "ar-SA" ? "ar" : "ur";
    const ok = await playOnlineTTS(textToSpeak, ttsLang);
    if (ok) return;

    // Do NOT fallback to English when Arabic is selected! Try Speech.speak with target language
    return new Promise((resolve) => {
      try {
        Speech.speak(textToSpeak, {
          language: speechLang,
          rate: finalRate,
          pitch: profile.pitch,
          onDone: () => resolve(),
          onError: () => resolve(),
          onStopped: () => resolve(),
        });
      } catch {
        resolve();
      }
    });
  }

  // Native speech engine execution with error fallback
  return new Promise((resolve) => {
    let resolved = false;
    const finish = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };
    const timer = setTimeout(finish, 5000);

    try {
      Speech.speak(textToSpeak, {
        language: speechLang,
        voice: chosenVoice,
        rate: finalRate,
        pitch: profile.pitch,
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
          // If native engine failed on Arabic/Urdu, immediately fallback to Google TTS
          if (speechLang === "ar-SA" || speechLang === "ur-PK") {
            playOnlineTTS(textToSpeak, speechLang === "ar-SA" ? "ar" : "ur").then(() => finish()).catch(() => finish());
          } else {
            finish();
          }
        },
      });
    } catch {
      clearTimeout(timer);
      if (speechLang === "ar-SA" || speechLang === "ur-PK") {
        void playOnlineTTS(textToSpeak, speechLang === "ar-SA" ? "ar" : "ur");
      }
      finish();
    }
  });
}

export interface SpokenWord {
  label: string;
  phrase?: string;
  audioUri?: string;
  useTextToSpeech?: boolean;
}

/** Play one word: its clip if present and allowed, otherwise TTS. */
export async function playWord(
  word: SpokenWord,
  lang: LanguageCode,
  rate = 0.9,
  voiceType: import("../types").VoiceType = "boy",
  useWholePhrase = false
): Promise<void> {
  stopSentence();
  if (word.audioUri && word.useTextToSpeech !== true) {
    await playClip(word.audioUri);
  } else {
    const textToSpeak = (useWholePhrase && word.phrase) ? word.phrase : word.label;
    await speakWord(textToSpeak, lang, rate, voiceType);
  }
}

/** Stop any speech currently playing. */
export function stopSentence(): void {
  try {
    Speech.stop();
  } catch {
    /* ignore */
  }
  if (Platform.OS === "web" && currentPlayingWebAudio) {
    try {
      currentPlayingWebAudio.pause();
      currentPlayingWebAudio.currentTime = 0;
    } catch {
      /* ignore */
    }
    currentPlayingWebAudio = null;
  }
}

/** Play a whole sentence: natural coherent speech if text-to-speech, or sequenced clips. */
export async function playSentence(
  words: SpokenWord[],
  lang: LanguageCode,
  rate = 0.9,
  voiceType: import("../types").VoiceType = "boy"
): Promise<void> {
  stopSentence();
  if (!words || words.length === 0) return;

  const hasCustomAudio = words.some((w) => w.audioUri && w.useTextToSpeech !== true);
  if (!hasCustomAudio) {
    // Speak continuous natural sentence
    const fullText = words.map((w) => w.label.trim()).filter(Boolean).join(" ");
    if (fullText) {
      await speakWord(fullText, lang, rate, voiceType);
    }
    return;
  }

  // Sequenced fallback for custom recorded parent voice clips
  for (const w of words) {
    await playWord(w, lang, rate, voiceType);
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
