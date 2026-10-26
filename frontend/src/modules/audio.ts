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

// Speaking speed for spoken audio clips (online Arabic/Urdu voice). 1 = normal (Settings "Normal" = 0.9).
let ttsPlaybackRate = 1;
export function setSpeechSpeed(rate: number): void {
  ttsPlaybackRate = Math.max(0.5, Math.min(2, (rate || 0.9) / 0.9));
}

function playClip(uri: string, rate = 1): Promise<void> {
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
        audio.playbackRate = rate;
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
    try {
      if (rate !== 1) (player as unknown as { setPlaybackRate?: (r: number) => void }).setPlaybackRate?.(rate);
    } catch {
      /* speed is a nicety */
    }
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

export function preloadTTS(text: string, langCode: "ar" | "ur" | "de" | "fr" | "es" | "en" = "ar"): void {
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

export function playOnlineTTS(text: string, langCode: "ar" | "ur" | "de" | "fr" | "es" | "en"): Promise<boolean> {
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

        audio.playbackRate = ttsPlaybackRate;
        currentPlayingWebAudio = audio;
        audio.onended = () => {
          if (currentPlayingWebAudio === audio) currentPlayingWebAudio = null;
          finish(true);
        };
        const backendUrl = (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_BACKEND_URL) || "http://localhost:4000";
        const backendProxyUrl = `${backendUrl}/api/tts?q=${encodeURIComponent(cleanText)}&tl=${langCode}`;

        const tryFallback = () => {
          try {
            const altBackend = new Audio(backendProxyUrl);
            altBackend.playbackRate = ttsPlaybackRate;
            currentPlayingWebAudio = altBackend;
            altBackend.onended = () => {
              if (currentPlayingWebAudio === altBackend) currentPlayingWebAudio = null;
              finish(true);
            };
            altBackend.onerror = () => {
              try {
                const direct = new Audio(directUrl);
                direct.playbackRate = ttsPlaybackRate;
                currentPlayingWebAudio = direct;
                direct.onended = () => {
                  if (currentPlayingWebAudio === direct) currentPlayingWebAudio = null;
                  finish(true);
                };
                direct.onerror = () => {
                  if (currentPlayingWebAudio === direct) currentPlayingWebAudio = null;
                  finish(false);
                };
                direct.play().catch(() => finish(false));
              } catch {
                finish(false);
              }
            };
            altBackend.play().catch(() => {
              try {
                const direct = new Audio(directUrl);
                direct.playbackRate = ttsPlaybackRate;
                currentPlayingWebAudio = direct;
                direct.onended = () => {
                  if (currentPlayingWebAudio === direct) currentPlayingWebAudio = null;
                  finish(true);
                };
                direct.onerror = () => {
                  if (currentPlayingWebAudio === direct) currentPlayingWebAudio = null;
                  finish(false);
                };
                direct.play().catch(() => finish(false));
              } catch {
                finish(false);
              }
            });
          } catch {
            finish(false);
          }
        };

        audio.onerror = tryFallback;
        audio.play().catch(tryFallback);

        setTimeout(() => finish(true), 4000);
        return;
      }

      playClip(proxyUrl, ttsPlaybackRate).then(() => resolve(true)).catch(() => {
        playClip(directUrl, ttsPlaybackRate).then(() => resolve(true)).catch(() => resolve(false));
      });
    } catch {
      resolve(false);
    }
  });
}

const GERMAN_LETTER_SPEECH: Record<string, string> = {
  A: "A", B: "Be", C: "Ce", D: "De", E: "E", F: "Ef", G: "Ge", H: "Ha", I: "I", J: "Jot",
  K: "Ka", L: "El", M: "Em", N: "En", O: "O", P: "Pe", Q: "Qu", R: "Er", S: "Es", T: "Te",
  U: "U", V: "Vau", W: "We", X: "Ix", Y: "Ypsilon", Z: "Zet", Ä: "Ä", Ö: "Ö", Ü: "Ü", ß: "Eszett",
};

const FRENCH_LETTER_SPEECH: Record<string, string> = {
  A: "a", B: "bé", C: "cé", D: "dé", E: "e", F: "effe", G: "gé", H: "ache", I: "i", J: "ji",
  K: "ka", L: "elle", M: "emme", N: "enne", O: "o", P: "pé", Q: "cu", R: "erre", S: "esse", T: "té",
  U: "u", V: "vé", W: "double vé", X: "ixe", Y: "i grec", Z: "zède",
};

const SPANISH_LETTER_SPEECH: Record<string, string> = {
  A: "a", B: "be", C: "ce", D: "de", E: "e", F: "efe", G: "ge", H: "hache", I: "i", J: "jota",
  K: "ka", L: "ele", M: "eme", N: "ene", Ñ: "eñe", O: "o", P: "pe", Q: "cu", R: "erre", S: "ese",
  T: "te", U: "u", V: "uve", W: "uve doble", X: "equis", Y: "ye", Z: "zeta",
};

export function parseAlphaNumSpeech(
  raw: string,
  emoji?: string
): { text: string; targetLang?: "ar-SA" | "de-DE" | "fr-FR" | "es-ES" | "en-US" } {
  const s = (raw || "").trim().replace(/\.$/, "");
  const emojiLang: "ar-SA" | "de-DE" | "fr-FR" | "es-ES" | "en-US" | undefined =
    emoji === "🇩🇪"
      ? "de-DE"
      : emoji === "🇫🇷"
      ? "fr-FR"
      : emoji === "🇪🇸"
      ? "es-ES"
      : emoji === "🇸🇦"
      ? "ar-SA"
      : emoji === "🔠" || emoji === "🔡" || emoji === "🔢"
      ? "en-US"
      : undefined;

  // 1. Arabic format: "ا - ألف (Alif)" or "٠ - صفر (0 - Zero)" or legacy "٠ (0) - صفر (Sifr)" / "ا (Alif)"
  const arDashMatch = s.match(/^([\u0621-\u064A\u0660-\u0669]+)\s*-\s*([\u0600-\u06FF\s]+)\s*\([^)]+\)$/);
  if (arDashMatch) {
    return { text: arDashMatch[2].trim(), targetLang: "ar-SA" };
  }
  const arLegacyNum = s.match(/^[\u0660-\u0669]+\s*\([^)]+\)\s*-\s*([^\s(]+)/);
  if (arLegacyNum) {
    return { text: arLegacyNum[1].trim(), targetLang: "ar-SA" };
  }
  const arLegacyLet = s.match(/^([\u0621-\u064A])\s*\(([^)]+)\)$/);
  if (arLegacyLet) {
    return { text: arLegacyLet[1].trim(), targetLang: "ar-SA" };
  }

  // 2. Foreign Numeral format: "0 - null (Zero)", "0 - zéro (Zero)", "0 - cero (Zero)"
  const numDashMatch = s.match(/^\d+\s*-\s*([^\s(]+)(?:\s*\([^)]+\))?$/);
  if (numDashMatch) {
    const word = numDashMatch[1].trim();
    const low = word.toLowerCase();
    const detectedLang =
      emojiLang ||
      (["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn"].includes(low)
        ? "de-DE"
        : ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"].includes(low)
        ? "fr-FR"
        : ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez"].includes(low)
        ? "es-ES"
        : "en-US");
    return { text: word, targetLang: detectedLang };
  }

  // 3. English Numeral format: "0 (Zero)", "20 (Twenty)"
  const enNumParen = s.match(/^\d+\s*\(([^)]+)\)$/);
  if (enNumParen) {
    return { text: enNumParen[1].trim(), targetLang: "en-US" };
  }

  // 4. Foreign Alphabet format: "A - aa (Ay)", "B - bé (Bee)", "C - ce (See)", "W - uve doble (Dabalyoo)"
  const letDashMatch = s.match(/^([a-zA-Z\u00C0-\u017F])\s*-\s*([^()]+)\s*\(([^)]+)\)$/);
  if (letDashMatch) {
    const ch = letDashMatch[1].trim();
    const nativePron = letDashMatch[2].trim();
    const lowPron = nativePron.toLowerCase();
    const detectedLang =
      emojiLang ||
      (["aa", "bee", "tsee", "dee", "ee", "gee", "haa", "yot", "kaa", "koo", "oo", "pee", "tee", "fow", "vee", "üpsilon", "tset", "ä", "ö", "ü", "ess-tset"].includes(lowPron)
        ? "de-DE"
        : ["bé", "cé", "dé", "èf", "jé", "ash", "jee", "èl", "èm", "èn", "pé", "ku", "èr", "ès", "té", "vé", "doobl-vé", "ee-grek", "zèd"].includes(lowPron)
        ? "fr-FR"
        : ["be", "ce", "de", "efe", "ge", "hache", "jota", "ele", "eme", "ene", "eñe", "pe", "cu", "erre", "ese", "te", "uve", "uve doble", "equis", "ye", "zeta"].includes(lowPron)
        ? "es-ES"
        : "en-US");
    if (detectedLang === "de-DE") {
      return { text: GERMAN_LETTER_SPEECH[ch] || nativePron, targetLang: "de-DE" };
    }
    if (detectedLang === "fr-FR") {
      return { text: FRENCH_LETTER_SPEECH[ch] || nativePron, targetLang: "fr-FR" };
    }
    if (detectedLang === "es-ES") {
      return { text: SPANISH_LETTER_SPEECH[ch] || nativePron, targetLang: "es-ES" };
    }
    return { text: ch, targetLang: detectedLang };
  }

  // 5. Single letter with parentheses: "A (Ay)", "a (Ay)", "à (a grave)"
  const letterMatch = s.match(/^([a-zA-Z\u00C0-\u017F])\s*\(([^)]+)\)$/);
  if (letterMatch) {
    const ch = letterMatch[1];
    if (emojiLang === "fr-FR") return { text: ch, targetLang: "fr-FR" };
    if (emojiLang === "de-DE") return { text: GERMAN_LETTER_SPEECH[ch] || ch, targetLang: "de-DE" };
    if (emojiLang === "es-ES") return { text: SPANISH_LETTER_SPEECH[ch] || ch, targetLang: "es-ES" };
    return { text: ch, targetLang: "en-US" };
  }

  return { text: s, targetLang: emojiLang };
}

async function speakWord(
  text: string,
  lang: LanguageCode,
  rate: number,
  voiceType: import("../types").VoiceType = "boy",
  emoji?: string
): Promise<void> {
  const parsed = parseAlphaNumSpeech(text, emoji);
  let textToSpeak = parsed.text;
  if (!textToSpeak) return;
  setSpeechSpeed(rate);

  // Only translate general board words when NOT speaking a language-specific Alphabet/Numeral card
  if (!parsed.targetLang) {
    if (lang === "ar-SA" && !/[\u0600-\u06FF]/.test(textToSpeak)) {
      textToSpeak = wordLabel(textToSpeak, "ar-SA") || textToSpeak;
    } else if (lang === "ur-PK" && !/[\u0600-\u06FF]/.test(textToSpeak)) {
      textToSpeak = wordLabel(textToSpeak, "ur-PK") || textToSpeak;
    } else if (lang === "en-US" && /[\u0600-\u06FF]/.test(textToSpeak)) {
      textToSpeak = canonicalWordEn(textToSpeak) || textToSpeak;
    }
  }

  const hasArabicScript = /[\u0600-\u06FF]/.test(textToSpeak);
  const speechLang: string =
    parsed.targetLang ||
    (lang === "ar-SA" || hasArabicScript ? "ar-SA" : lang === "ur-PK" ? "ur-PK" : "en-US");

  const profile = {
    boy: { pitch: 1.25, rateMultiplier: 1.0 },
    girl: { pitch: 1.38, rateMultiplier: 1.0 },
    woman: { pitch: 1.08, rateMultiplier: 0.96 },
    man: { pitch: 0.82, rateMultiplier: 0.92 },
  }[voiceType] || { pitch: 1.25, rateMultiplier: 1.0 };

  const finalRate = Math.max(0.5, Math.min(1.5, rate * profile.rateMultiplier));

  // Check if a genuine system voice for the target language is installed on this device/browser
  let nativeVoiceFound = false;
  let chosenVoice: string | undefined;
  const langPrefix = speechLang.split("-")[0].toLowerCase();

  if (typeof window !== "undefined" && window.speechSynthesis) {
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const match = voices.find((v) => {
          const l = (v.lang || "").toLowerCase();
          if (langPrefix === "ur") return l.startsWith("ur") || l.startsWith("hi");
          return l.startsWith(langPrefix);
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

  // For Arabic, Urdu, German, French, or Spanish:
  // Play authentic online TTS audio stream so it always pronounces in the genuine native language!
  const isNonEnglishTarget = ["ar", "ur", "de", "fr", "es"].includes(langPrefix);
  if (isNonEnglishTarget && (!nativeVoiceFound || parsed.targetLang)) {
    const ok = await playOnlineTTS(textToSpeak, langPrefix as "ar" | "ur" | "de" | "fr" | "es");
    if (ok) return;

    return new Promise((resolve) => {
      try {
        Speech.speak(textToSpeak, {
          language: speechLang,
          voice: chosenVoice,
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
          if (isNonEnglishTarget) {
            playOnlineTTS(textToSpeak, langPrefix as "ar" | "ur" | "de" | "fr" | "es")
              .then(() => finish())
              .catch(() => finish());
          } else {
            finish();
          }
        },
      });
    } catch {
      clearTimeout(timer);
      if (isNonEnglishTarget) {
        void playOnlineTTS(textToSpeak, langPrefix as "ar" | "ur" | "de" | "fr" | "es");
      }
      finish();
    }
  });
}

export interface SpokenWord {
  label: string;
  phrase?: string;
  emoji?: string;
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
    await speakWord(textToSpeak, lang, rate, voiceType, word.emoji);
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
  const hasLanguageSpecificTile = words.some((w) => !!parseAlphaNumSpeech(w.phrase || w.label, w.emoji).targetLang);
  if (!hasCustomAudio && !hasLanguageSpecificTile) {
    // Speak continuous natural sentence
    const fullText = words.map((w) => w.label.trim()).filter(Boolean).join(" ");
    if (fullText) {
      await speakWord(fullText, lang, rate, voiceType);
    }
    return;
  }

  // Sequenced playback for custom recorded clips or language-specific Alphabet/Numeral tiles
  for (const w of words) {
    await playWord(w, lang, rate, voiceType, true);
    await new Promise((r) => setTimeout(r, 120));
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
