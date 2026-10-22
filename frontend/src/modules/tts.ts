import * as Speech from "expo-speech";
import type { LanguageCode, VoiceType } from "../types";
import { wordLabel, canonicalWordEn } from "./i18n";

export interface VoiceProfile {
  pitch: number;
  rateMultiplier: number;
  label: string;
  icon: string;
}

export const VOICE_PROFILES: Record<VoiceType, VoiceProfile> = {
  boy: { pitch: 1.25, rateMultiplier: 1.0, label: "Boy Voice", icon: "👦" },
  girl: { pitch: 1.38, rateMultiplier: 1.0, label: "Girl Voice", icon: "👧" },
  woman: { pitch: 1.08, rateMultiplier: 0.96, label: "Woman Voice", icon: "👩" },
  man: { pitch: 0.82, rateMultiplier: 0.92, label: "Man Voice", icon: "👨" },
};

import { Platform } from "react-native";
import { stopSentence, playOnlineTTS, setSpeechSpeed } from "./audio";
import { loadSettings } from "./storage";

let currentTtsWebAudio: any = null;

/**
 * Text-to-speech engine optimized for children with autism and special needs.
 * Supports natural Boy, Girl, Woman, and Man voice styles with adjusted pitch and cadence.
 */
export function speak(
  text: string,
  lang: LanguageCode | string,
  enabled: boolean,
  rate?: number,
  voiceType: VoiceType = "boy"
): void {
  if (!enabled || !text?.trim()) return;
  // no speed given: the one chosen in Settings
  rate = rate ?? loadSettings().speechRate ?? 0.9;
  try {
    stopSpeech();
    setSpeechSpeed(rate);
    const profile = VOICE_PROFILES[voiceType] || VOICE_PROFILES.boy;
    const finalRate = Math.max(0.5, Math.min(1.5, rate * profile.rateMultiplier));

    let textToSpeak = text.trim();
    if (lang === "ar-SA" && !/[\u0600-\u06FF]/.test(textToSpeak)) {
      textToSpeak = wordLabel(textToSpeak, "ar-SA") || textToSpeak;
    } else if (lang === "ur-PK" && !/[\u0600-\u06FF]/.test(textToSpeak)) {
      textToSpeak = wordLabel(textToSpeak, "ur-PK") || textToSpeak;
    } else if (lang === "en-US" && /[\u0600-\u06FF]/.test(textToSpeak)) {
      textToSpeak = canonicalWordEn(textToSpeak) || textToSpeak;
    }

    const hasArabicScript = /[\u0600-\u06FF]/.test(textToSpeak);
    const speechLang = (lang === "ar-SA" || hasArabicScript) ? "ar-SA" : (lang === "ur-PK" ? "ur-PK" : "en-US");

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

    // If speaking Arabic or Urdu and no native system voice is installed:
    // Play authentic Google TTS audio stream in Arabic/Urdu
    if ((speechLang === "ar-SA" || speechLang === "ur-PK") && !nativeVoiceFound) {
      const ttsLang = speechLang === "ar-SA" ? "ar" : "ur";
      void playOnlineTTS(textToSpeak, ttsLang);
      return;
    }

    Speech.speak(textToSpeak, {
      language: speechLang,
      voice: chosenVoice,
      rate: finalRate,
      pitch: profile.pitch,
      onError: () => {
        if (speechLang === "ar-SA" || speechLang === "ur-PK") {
          void playOnlineTTS(textToSpeak, speechLang === "ar-SA" ? "ar" : "ur");
        }
      },
    });
  } catch (err) {
    console.warn("[tts] speak error:", err);
  }
}

export function stopSpeech(): void {
  try {
    Speech.stop();
  } catch {
    /* ignore */
  }
  stopSentence();
  if (Platform.OS === "web" && currentTtsWebAudio) {
    try {
      currentTtsWebAudio.pause();
      currentTtsWebAudio.currentTime = 0;
    } catch {}
    currentTtsWebAudio = null;
  }
}

export function previewVoice(voiceType: VoiceType, lang: LanguageCode = "en-US"): void {
  const sample =
    lang === "ar-SA"
      ? "مرحباً! هذا صوت ملاك توك الجديد."
      : "Hi! This is my new Angel Talk voice!";
  speak(sample, lang, true, 0.9, voiceType);
}
