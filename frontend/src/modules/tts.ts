import * as Speech from "expo-speech";
import type { LanguageCode } from "../types";

/**
 * Text-to-speech engine optimized for children with autism and special needs.
 * Uses a clear, gentle pace (rate 0.88, pitch 1.05) and handles language fallbacks.
 */
export function speak(text: string, lang: LanguageCode | string, enabled: boolean, rate: number = 0.88): void {
  if (!enabled || !text?.trim()) return;
  try {
    Speech.stop();
    Speech.speak(text.trim(), {
      language: lang || "en-US",
      rate,
      pitch: 1.05,
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
