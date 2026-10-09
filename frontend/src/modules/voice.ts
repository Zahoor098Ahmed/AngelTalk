import { Platform } from "react-native";
import { startRecording, stopRecordingTemp } from "./audio";
import { transcribeAudio } from "./aiImage";

/**
 * Universal voice input module:
 *
 * - Web (Chrome / Edge): Real-time Web Speech API with streaming partials.
 * - Native app (APK / iOS build): the phone's own speech recognizer via expo-speech-recognition —
 *   live words while speaking, and OFFLINE when the language's offline pack is on the phone.
 * - Expo Go (no native module): records with expo-audio and transcribes with Whisper
 *   (via local proxy or OpenAI key).
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
  maxAlternatives?: number;
  onresult: ((e: WSEvent) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  onaudiostart?: (() => void) | null;
  onspeechstart?: (() => void) | null;
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

// ---------------------------------------------------------------------------
// Live mic state for the UI: "starting" -> "listening" (mic open) -> "hearing" (speech detected),
// plus a 0..1 input level and the last error. A small component subscribes, so the big
// screens don't re-render on every level tick.

export type MicStatus = "idle" | "starting" | "listening" | "hearing" | "reconnecting" | "error";
export interface MicState {
  status: MicStatus;
  level: number;
  /** true once a real input level is reported (phone recognizer); the web has no level. */
  levelAvailable: boolean;
  error: string | null;
}
let micState: MicState = { status: "idle", level: 0, levelAvailable: false, error: null };
const micListeners = new Set<(s: MicState) => void>();

export function getMicState(): MicState {
  return micState;
}
export function subscribeMicState(fn: (s: MicState) => void): () => void {
  micListeners.add(fn);
  return () => {
    micListeners.delete(fn);
  };
}
function setMic(patch: Partial<MicState>) {
  micState = { ...micState, ...patch };
  micListeners.forEach((fn) => fn(micState));
}

/** Friendly text for Web Speech API errors (null = harmless, keep going). */
function micErrorText(code: string): string | null {
  switch (code) {
    case "no-speech":
    case "aborted":
      return null;
    case "network":
      return "Speech recognition needs internet (Chrome sends the audio to Google). Check your connection and try again.";
    case "audio-capture":
      return "No microphone was found, or another app/tab is using it. Close it and try again.";
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission is blocked. Click the 🎤 icon in the address bar and allow it.";
    case "language-not-supported":
      return "This language isn't supported by the browser's speech recognition.";
    default:
      return code ? `Microphone problem (${code}). Tap the mic to try again.` : null;
  }
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
/**
 * Accumulate mode keeps listening until the user taps the mic again (pauses never end it).
 * Only a long stretch of silence releases the mic, so a forgotten mic doesn't stay on forever.
 */
const IDLE_LIMIT_MS = 5 * 60 * 1000;
let quickEnds = 0; // sessions that ended almost immediately without hearing anything
let sessionStartedAt = 0;
let sessionHadResult = false;
/** Chrome's "network" error is usually a short internet drop: reconnect a few times before giving up. */
const MAX_NETWORK_RETRIES = 8;
let networkRetries = 0;
let lastErrorWasNetwork = false;

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
      stopListening().catch(() => {});
    }, IDLE_LIMIT_MS);
  }
}

/** Stops a previous recognition and waits (briefly) until the browser has released the mic. */
function releaseWebInstance(): Promise<void> {
  const old = webInstance;
  webInstance = null;
  if (!old) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => resolve();
    old.onresult = null;
    old.onerror = null;
    old.onend = done;
    try {
      const abortable = old as unknown as { abort?: () => void };
      if (abortable.abort) abortable.abort();
      else old.stop();
    } catch {
      done();
    }
    setTimeout(done, 400);
  });
}

export async function startListening(h: VoiceHandlers): Promise<boolean> {
  const lang = h.lang || "en-US";
  activeHandlers = h;
  isExplicitlyStopped = false;
  sessionAccumulatedText = (h.initialText || "").trim();
  lastFinalSessionText = "";
  quickEnds = 0;
  networkRetries = 0;
  lastErrorWasNetwork = false;
  clearSilenceTimeout();

  // 1. Web Speech Recognition (Chrome/Edge/Web)
  const Rec = webRecognition();
  if (Rec) {
    await releaseWebInstance();
    if (activeHandlers !== h) return false; // a newer start/stop happened meanwhile

    try {
      // No separate mic stream here: opening the mic twice (meter + recognizer) made Chrome's
      // recognizer lag and drop out with "network" errors. Chrome asks for permission itself.
      setMic({ status: "starting", level: 0, levelAvailable: false, error: null });

      function spawnWebRecognition() {
        if (isExplicitlyStopped || !activeHandlers) return;
        const rec = new (Rec as NonNullable<typeof Rec>)();
        rec.lang = lang;
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        rec.onaudiostart = () => setMic({ status: "listening", error: null });
        rec.onspeechstart = () => setMic({ status: "hearing" });

        rec.onresult = (e: WSEvent) => {
          if (micState.status !== "hearing") setMic({ status: "hearing", error: null });
          sessionHadResult = true;
          networkRetries = 0;
          quickEnds = 0;
          if (!isExplicitlyStopped) resetSilenceTimeout();
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
          const message = micErrorText(errType);
          if (!message) return; // silence / restart — keep going
          // Short internet drop: keep what was said and reconnect (onend restarts the session)
          if (errType === "network" && activeHandlers?.accumulate && networkRetries < MAX_NETWORK_RETRIES) {
            networkRetries++;
            lastErrorWasNetwork = true;
            setMic({ status: "reconnecting" });
            return;
          }
          console.warn("[voice] recognition error:", errType);
          isExplicitlyStopped = true;
          listening = false;
          clearSilenceTimeout();
          setMic({ status: "error", level: 0, error: message });
          const handlers = activeHandlers;
          activeHandlers = null;
          handlers?.onError?.(message);
          handlers?.onEnd?.();
        };

        rec.onend = () => {
          if (webInstance === rec) webInstance = null;
          if (isExplicitlyStopped || !activeHandlers) {
            finishWebSession();
            return;
          }
          // Ended right away without hearing anything: Chrome refused the mic. Don't loop forever.
          // (An internet drop isn't a mic problem — those retries are counted separately.)
          const reconnecting = lastErrorWasNetwork;
          lastErrorWasNetwork = false;
          if (!reconnecting && !sessionHadResult && Date.now() - sessionStartedAt < 1500) quickEnds++;
          if (quickEnds >= 3) {
            listening = false;
            clearSilenceTimeout();
            const h = activeHandlers;
            activeHandlers = null;
            const message = "The microphone could not start. Close other tabs using the mic and try again.";
            setMic({ status: "error", level: 0, error: message });
            h?.onError?.(message);
            h?.onEnd?.();
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
            }, reconnecting ? 1000 : 150);
            return;
          }
          listening = false;
          clearSilenceTimeout();
          activeHandlers?.onEnd?.();
        };

        webInstance = rec;
        sessionStartedAt = Date.now();
        sessionHadResult = false;
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

  // 2. Native app: the phone's own recognizer (live, and offline when the language pack is installed)
  const sr = nativeSR();
  if (sr) {
    try {
      if (sr.isRecognitionAvailable()) {
        const ok = await startNativeSpeech(sr, h, lang);
        if (ok) return true;
        if (micState.status === "error") {
          activeHandlers = null;
          return false;
        }
      }
    } catch (err) {
      console.warn("[voice] native recognizer error:", err);
    }
  }

  // 3. Expo Go (no native module): record with expo-audio -> Whisper STT
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

// ---------------------------------------------------------------------------
// Native speech recognition (Android / iOS builds)

type NativeSR = {
  start(o: Record<string, unknown>): void;
  stop(): void;
  abort(): void;
  requestPermissionsAsync(): Promise<{ granted: boolean }>;
  getSupportedLocales(o: Record<string, unknown>): Promise<{ locales: string[]; installedLocales: string[] }>;
  supportsOnDeviceRecognition(): boolean;
  isRecognitionAvailable(): boolean;
  androidTriggerOfflineModelDownload?(o: { locale: string }): Promise<unknown>;
  addListener(event: string, fn: (e: any) => void): { remove(): void };
};

let nativeSRCache: NativeSR | null | undefined;
function nativeSR(): NativeSR | null {
  if (nativeSRCache !== undefined) return nativeSRCache;
  nativeSRCache = null;
  if (Platform.OS === "web") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("expo-speech-recognition").ExpoSpeechRecognitionModule as NativeSR;
    if (mod && typeof mod.start === "function") nativeSRCache = mod;
  } catch {
    /* Expo Go: native module not in this build */
  }
  return nativeSRCache;
}

let nativeSRActive = false;
let nativeSubs: { remove(): void }[] = [];

function clearNativeSubs() {
  nativeSubs.forEach((sub) => sub.remove());
  nativeSubs = [];
}

/** Uses the offline model when the phone has this language installed, so it works without internet. */
async function wantsOnDevice(sr: NativeSR, lang: string): Promise<boolean> {
  try {
    if (!sr.supportsOnDeviceRecognition()) return false;
    const { installedLocales } = await sr.getSupportedLocales({});
    const base = lang.split("-")[0].toLowerCase();
    return installedLocales.some((l) => l.toLowerCase() === lang.toLowerCase() || l.toLowerCase().split(/[-_]/)[0] === base);
  } catch {
    return false;
  }
}

async function startNativeSpeech(sr: NativeSR, h: VoiceHandlers, lang: string): Promise<boolean> {
  setMic({ status: "starting", level: 0, error: null });
  const perm = await sr.requestPermissionsAsync().catch(() => ({ granted: false }));
  if (!perm.granted) {
    const message = micErrorText("not-allowed") as string;
    setMic({ status: "error", error: message });
    h.onError?.(message);
    return false;
  }
  if (activeHandlers !== h) return false;
  const onDevice = await wantsOnDevice(sr, lang);

  clearNativeSubs();
  let accumulated = (h.initialText || "").trim();
  const join = (...parts: string[]) => parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

  nativeSubs.push(
    sr.addListener("audiostart", () => setMic({ status: "listening", error: null })),
    sr.addListener("speechstart", () => setMic({ status: "hearing" })),
    sr.addListener("volumechange", (e: { value: number }) => {
      const level = Math.max(0, Math.min(1, (e.value + 2) / 12));
      if (!micState.levelAvailable || Math.abs(level - micState.level) > 0.03) setMic({ level, levelAvailable: true });
    }),
    sr.addListener("result", (e: { isFinal: boolean; results: { transcript: string }[] }) => {
      const text = (e.results?.[0]?.transcript || "").trim();
      if (!text || !activeHandlers) return;
      if (micState.status !== "hearing") setMic({ status: "hearing" });
      resetSilenceTimeout();
      if (!activeHandlers.accumulate) {
        if (e.isFinal) activeHandlers.onFinal?.(text);
        else activeHandlers.onPartial?.(text);
        return;
      }
      if (e.isFinal) {
        accumulated = join(accumulated, text);
        activeHandlers.onFinal?.(accumulated);
      } else {
        activeHandlers.onPartial?.(join(accumulated, text));
      }
    }),
    sr.addListener("error", (e: { error: string; message?: string }) => {
      const code = String(e?.error ?? "");
      if (code === "no-speech" || code === "speech-timeout" || code === "aborted") return; // "end" restarts
      // Offline pack missing and no internet: ask Android to download it for next time
      if (code === "network" && sr.androidTriggerOfflineModelDownload) {
        sr.androidTriggerOfflineModelDownload({ locale: lang }).catch(() => {});
      }
      const message =
        code === "network"
          ? "No internet, and this language's offline speech pack isn't on the phone yet. Android is downloading it — connect to Wi-Fi once, then the mic works offline."
          : micErrorText(code) ?? `Microphone problem (${code}).`;
      isExplicitlyStopped = true;
      setMic({ status: "error", level: 0, error: message });
      const handlers = activeHandlers;
      activeHandlers = null;
      nativeSRActive = false;
      listening = false;
      clearSilenceTimeout();
      clearNativeSubs();
      handlers?.onError?.(message);
      handlers?.onEnd?.();
    }),
    sr.addListener("end", () => {
      // Older Android ends after a pause even in continuous mode: keep listening until the user taps
      if (!isExplicitlyStopped && activeHandlers?.accumulate) {
        setTimeout(() => {
          if (!isExplicitlyStopped && activeHandlers) {
            try {
              sr.start(nativeOptions);
            } catch {
              finishNativeSession();
            }
          }
        }, 150);
        return;
      }
      finishNativeSession();
    }),
  );

  const nativeOptions = {
    lang,
    interimResults: true,
    continuous: true,
    maxAlternatives: 1,
    requiresOnDeviceRecognition: onDevice,
    addsPunctuation: false,
    volumeChangeEventOptions: { enabled: true, intervalMillis: 150 },
    // Don't cut the speaker off during short thinking pauses
    androidIntentOptions: {
      EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 8000,
      EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 8000,
    },
  };
  try {
    sr.start(nativeOptions);
  } catch (e) {
    clearNativeSubs();
    const message = `The microphone could not start (${String((e as Error)?.message ?? e)}).`;
    setMic({ status: "error", error: message });
    h.onError?.(message);
    return false;
  }
  nativeSRActive = true;
  listening = true;
  console.log(`[voice] native recognizer started (${lang}, ${onDevice ? "offline" : "online"})`);
  return true;
}

function finishNativeSession() {
  if (finishTimer) {
    clearTimeout(finishTimer);
    finishTimer = null;
  }
  nativeSRActive = false;
  listening = false;
  clearSilenceTimeout();
  clearNativeSubs();
  if (micState.status !== "error") setMic({ status: "idle", level: 0 });
  const h = activeHandlers;
  activeHandlers = null;
  h?.onEnd?.();
}

let finishTimer: any = null;

/** Ends a web session: handlers get their last results first, then onEnd once. */
function finishWebSession() {
  if (finishTimer) {
    clearTimeout(finishTimer);
    finishTimer = null;
  }
  listening = false;
  clearSilenceTimeout();
  if (micState.status !== "error") setMic({ status: "idle", level: 0 });
  const h = activeHandlers;
  activeHandlers = null;
  h?.onEnd?.();
}

export async function stopListening(): Promise<void> {
  isExplicitlyStopped = true;
  listening = false;
  clearSilenceTimeout();

  // Native recognizer: stop() delivers the last words, then "end" -> finishNativeSession
  if (nativeSRActive && activeHandlers) {
    const sr = nativeSR();
    if (sr) {
      try {
        sr.stop();
        finishTimer = setTimeout(finishNativeSession, 1500);
        return;
      } catch {
        finishNativeSession();
        return;
      }
    }
  }

  // Web: stop() makes the browser send the final words, then onend fires -> finishWebSession
  if (webInstance && activeHandlers && !nativeRecording) {
    try {
      webInstance.stop();
      finishTimer = setTimeout(finishWebSession, 1500); // safety net if onend never comes
      return;
    } catch {
      /* fall through */
    }
  }

  if (micState.status !== "error") setMic({ status: "idle", level: 0 });
  const handlers = activeHandlers;
  activeHandlers = null;
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
