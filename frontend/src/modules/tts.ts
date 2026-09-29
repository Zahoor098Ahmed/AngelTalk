import * as Speech from "expo-speech";
import type { LanguageCode, VoiceType } from "../types";

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

/**
 * Text-to-speech engine optimized for children with autism and special needs.
 * Supports natural Boy, Girl, Woman, and Man voice styles with adjusted pitch and cadence.
 */
export function speak(
  text: string,
  lang: LanguageCode | string,
  enabled: boolean,
  rate: number = 0.88,
  voiceType: VoiceType = "boy"
): void {
  if (!enabled || !text?.trim()) return;
  try {
    Speech.stop();
    const profile = VOICE_PROFILES[voiceType] || VOICE_PROFILES.boy;
    const finalRate = Math.max(0.5, Math.min(1.5, rate * profile.rateMultiplier));

    Speech.speak(text.trim(), {
      language: lang || "en-US",
      rate: finalRate,
      pitch: profile.pitch,
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
}

export function previewVoice(voiceType: VoiceType, lang: LanguageCode = "en-US"): void {
  const sample =
    lang === "ar-SA"
      ? "مرحباً! هذا صوت ملاك توك الجديد."
      : "Hi! This is my new Angel Talk voice!";
  speak(sample, lang, true, 0.9, voiceType);
}
