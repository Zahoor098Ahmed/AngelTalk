import { Platform } from "react-native";
import { startRecording, stopRecordingTemp } from "./audio";
import { transcribeAudio } from "./aiImage";

/**
 * Universal voice input module:
 *
 * - Web (Chrome / Edge): Real-time Web Speech API with streaming partials.
 * - Native (Android / iOS / Expo): Captures high-clarity voice via expo-audio
 *   and transcribes with Whisper (via local proxy or OpenAI key).
 *
 * Provides a unified startListening / stopListening interface across platforms.
 */

export interface VoiceHandlers {
  lang?: string; // BCP-47, e.g. "en-US", "ar-SA", "ur-PK"
  onPartial?: (text: string) => void;
  onFinal?: (text: string) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}

// Minimal Web Speech API shape (RN tsconfig has no DOM lib).
interface WSResult { readonly isFinal: boolean; readonly length: number; [i: number]: { transcript: string } }
interface WSEvent { resultIndex: number; results: { length: number; [i: number]: WSResult } }
interface WSRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: WSEvent) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

function webRecognition(): (new () => WSRecognition) | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => WSRecognition;
    webkitSpeechRecognition?: new () => WSRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** true when voice input can run in this environment (web or native recording). */
export function voiceAvailable(): boolean {
  if (Platform.OS === "web") {
    return !!webRecognition();
  }
  // Native recording via expo-audio is available on mobile devices
  return true;
}

let webInstance: WSRecognition | null = null;
let listening = false;
let nativeRecording = false;
let activeHandlers: VoiceHandlers | null = null;

export function isListening() {
  return listening;
}

export async function startListening(h: VoiceHandlers): Promise<boolean> {
  const lang = h.lang || "en-US";
  activeHandlers = h;

  // 1. Web Speech Recognition (Chrome/Edge/Web)
  const Rec = webRecognition();
  if (Rec) {
    if (webInstance) {
      try {
        webInstance.onend = null;
        webInstance.onerror = null;
        webInstance.stop();
      } catch {
        /* ignore */
      }
      webInstance = null;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ audio: true });
          s.getTracks().forEach((track) => track.stop());
        } catch {
          /* ignore permission probe error */
        }
      }

      webInstance = new Rec();
      webInstance.lang = lang;
      webInstance.continuous = true;
      webInstance.interimResults = true;
      webInstance.onresult = (e: WSEvent) => {
        let interim = "";
        let final = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) final += r[0].transcript;
          else interim += r[0].transcript;
        }
        if (interim) h.onPartial?.(interim.trim());
        if (final) h.onFinal?.(final.trim());
      };
      webInstance.onerror = (e: unknown) => {
        const errType = String((e as { error?: string })?.error ?? "");
        // Don't kill listening on transient silence / no-speech
        if (errType === "no-speech") return;
        h.onError?.(errType || "voice error");
      };
      webInstance.onend = () => {
        listening = false;
        h.onEnd?.();
      };
      webInstance.start();
      listening = true;
      return true;
    } catch {
      webInstance = null;
    }
  }

  // 2. Native Mobile Audio Recording (Expo Audio -> Whisper STT)
  try {
    const ok = await startRecording();
    if (ok) {
      nativeRecording = true;
      listening = true;
      h.onPartial?.("Listening… 🎙️");
      return true;
    }
  } catch (err: any) {
    console.warn("[voice] native recording error:", err);
  }

  activeHandlers = null;
  listening = false;
  return false;
}

export async function stopListening(): Promise<void> {
  listening = false;
  const handlers = activeHandlers;
  activeHandlers = null;

  // Stop web recognition
  if (webInstance) {
    try {
      webInstance.stop();
      webInstance = null;
    } catch {
      /* ignore */
    }
  }

  // Stop native recording and transcribe
  if (nativeRecording) {
    nativeRecording = false;
    try {
      const uri = await stopRecordingTemp();
      if (uri && handlers) {
        handlers.onPartial?.("Processing speech… ⏳");
        const langHint = (handlers.lang || "en").split("-")[0];
        const res = await transcribeAudio(uri, langHint);
        if (res.text) {
          handlers.onFinal?.(res.text.trim());
        } else if (res.error) {
          handlers.onError?.(res.error);
        } else {
          handlers.onError?.("No speech detected. Please try again.");
        }
      }
    } catch (err: any) {
      handlers?.onError?.(err?.message || "Failed to process audio.");
    } finally {
      handlers?.onEnd?.();
    }
  }
}
