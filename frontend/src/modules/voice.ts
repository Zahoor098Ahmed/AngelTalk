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
  /**
   * true = onPartial/onFinal always receive the WHOLE session transcript so far
   * (every sentence spoken since the mic opened), not just the latest segment.
   */
  accumulate?: boolean;
  /** Initial text to prepend to accumulated transcript if continuing a previous session */
  initialText?: string;
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
let isExplicitlyStopped = false;
let sessionAccumulatedText = "";
let lastFinalSessionText = "";
let silenceTimer: any = null;

export function isListening() {
  return listening;
}

function clearSilenceTimeout() {
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }
}

function resetSilenceTimeout() {
  clearSilenceTimeout();
  if (activeHandlers?.accumulate) {
    silenceTimer = setTimeout(() => {
      // Auto-stop after 60 seconds of continuous silence to avoid dangling mic
      stopListening().catch(() => {});
    }, 60000);
  }
}

export async function startListening(h: VoiceHandlers): Promise<boolean> {
  const lang = h.lang || "en-US";
  activeHandlers = h;
  isExplicitlyStopped = false;
  sessionAccumulatedText = (h.initialText || "").trim();
  lastFinalSessionText = "";
  clearSilenceTimeout();

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

      function spawnWebRecognition() {
        if (isExplicitlyStopped || !activeHandlers) return;
        const rec = new (Rec as NonNullable<typeof Rec>)();
        rec.lang = lang;
        rec.continuous = true;
        rec.interimResults = true;

        rec.onresult = (e: WSEvent) => {
          resetSilenceTimeout();
          if (activeHandlers?.accumulate) {
            let sessionInterim = "";
            let sessionFinal = "";
            let lastIsFinal = true;
            for (let i = 0; i < e.results.length; i++) {
              const r = e.results[i];
              if (r.isFinal) {
                sessionFinal += " " + r[0].transcript;
              } else {
                sessionInterim += " " + r[0].transcript;
              }
              lastIsFinal = r.isFinal;
            }
            if (sessionFinal.trim()) {
              lastFinalSessionText = sessionFinal.trim();
            }
            const currentTotalFinal = [sessionAccumulatedText, sessionFinal].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
            const currentTotalWithInterim = [currentTotalFinal, sessionInterim].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

            if (!currentTotalWithInterim) return;
            if (lastIsFinal) {
              activeHandlers.onFinal?.(currentTotalWithInterim);
            } else {
              activeHandlers.onPartial?.(currentTotalWithInterim);
            }
            return;
          }

          let interim = "";
          let final = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) final += r[0].transcript;
            else interim += r[0].transcript;
          }
          if (interim) activeHandlers?.onPartial?.(interim.trim());
          if (final) activeHandlers?.onFinal?.(final.trim());
        };

        rec.onerror = (e: unknown) => {
          const errType = String((e as { error?: string })?.error ?? "");
          if (errType === "no-speech" || errType === "aborted") return;
          if (errType === "not-allowed" || errType === "service-not-allowed") {
            isExplicitlyStopped = true;
            listening = false;
            clearSilenceTimeout();
            activeHandlers?.onError?.(errType);
            activeHandlers?.onEnd?.();
            return;
          }
          // Non-fatal errors can happen when restarting; avoid breaking user's flow
        };

        rec.onend = () => {
          if (isExplicitlyStopped || !activeHandlers) {
            listening = false;
            clearSilenceTimeout();
            activeHandlers?.onEnd?.();
            return;
          }
          // If accumulate mode is enabled and user hasn't explicitly stopped,
          // bridge Chrome's silence auto-cutoff by rolling this session's finals into base and restarting after 150ms
          if (activeHandlers.accumulate) {
            if (lastFinalSessionText) {
              sessionAccumulatedText = [sessionAccumulatedText, lastFinalSessionText].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
              lastFinalSessionText = "";
            }
            setTimeout(() => {
              if (!isExplicitlyStopped && activeHandlers) {
                try {
                  spawnWebRecognition();
                } catch {
                  listening = false;
                  clearSilenceTimeout();
                  activeHandlers?.onEnd?.();
                }
              }
            }, 150);
            return;
          }
          listening = false;
          clearSilenceTimeout();
          activeHandlers?.onEnd?.();
        };

        webInstance = rec;
        try {
          rec.start();
          listening = true;
        } catch {
          // If start throws due to audio concurrency, retry in 200ms
          setTimeout(() => {
            if (!isExplicitlyStopped && activeHandlers) {
              try {
                rec.start();
                listening = true;
              } catch {
                /* fallback to ending */
              }
            }
          }, 200);
        }
      }

      spawnWebRecognition();
      resetSilenceTimeout();
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
  isExplicitlyStopped = true;
  listening = false;
  clearSilenceTimeout();
  const handlers = activeHandlers;
  activeHandlers = null;

  // Stop web recognition
  if (webInstance) {
    try {
      webInstance.onend = null;
      webInstance.onerror = null;
      webInstance.stop();
      webInstance = null;
    } catch {
      /* ignore */
    }
  }
  handlers?.onEnd?.();

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
