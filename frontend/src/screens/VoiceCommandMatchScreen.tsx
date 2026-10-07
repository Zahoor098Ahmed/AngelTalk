import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../context/SettingsContext";
import { t, type TKey } from "../modules/i18n";
import { speak } from "../modules/tts";
import { selectFeedback as haptic } from "../modules/haptics";
import { voiceAvailable, startListening, stopListening } from "../modules/voice";
import { ensurePhraseLibraryLoaded, findMatchingPhrase } from "../modules/phraseMatch";
import type { PhraseMatch } from "../types";
import { colors, radius, radiusSm } from "../theme";
import BigButton from "../components/BigButton";

interface Props {
  onBack: () => void;
}

type Phase = "idle" | "listening" | "processing" | "matched" | "no-match" | "error";

const SAMPLE_PHRASES: { labelKey: TKey; phrase: string; icon: string }[] = [
  { labelKey: "vcmSampleOnTable", phrase: "The book is on the table", icon: "📘" },
  { labelKey: "vcmSampleUnderTable", phrase: "The book is under the table", icon: "🔲" },
  { labelKey: "vcmSampleInSomething", phrase: "The book is in something", icon: "📦" },
  { labelKey: "vcmSampleAboveTable", phrase: "The book is above the table", icon: "🎈" },
  { labelKey: "vcmSampleNearTable", phrase: "The book is near the table", icon: "🪑" },
];

export default function VoiceCommandMatchScreen({ onBack }: Props) {
  const { settings } = useSettings();
  const lang = settings.language;
  const tt = (k: TKey) => t(k, lang);

  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [heard, setHeard] = useState<string>("");
  const [match, setMatch] = useState<PhraseMatch | null>(null);
  const [errorText, setErrorText] = useState<string>("");

  // Animated mic pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const autoStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    ensurePhraseLibraryLoaded().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (phase === "listening") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.22,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Auto stop after 5.5 seconds of listening so child doesn't have to tap stop
      autoStopTimer.current = setTimeout(() => {
        handleFinishSpeaking();
      }, 5500);
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      if (autoStopTimer.current) {
        clearTimeout(autoStopTimer.current);
        autoStopTimer.current = null;
      }
    }
    return () => {
      if (autoStopTimer.current) clearTimeout(autoStopTimer.current);
    };
  }, [phase]);

  function reset() {
    stopListening().catch(() => {});
    setPhase("idle");
    setHeard("");
    setMatch(null);
    setErrorText("");
  }

  async function beginListen() {
    if (phase === "listening" || phase === "processing") return;
    haptic();
    setHeard("");
    setMatch(null);
    setErrorText("");
    try {
      const ok = voiceAvailable();
      if (!ok) {
        setPhase("listening");
        setHeard(tt("vcmListeningPlaceholder"));
        setTimeout(() => {
          processSpokenText("The book is on the table");
        }, 2200);
        return;
      }
      setPhase("listening");
      setHeard(tt("vcmListeningPlaceholder"));

      const started = await startListening({
        lang,
        onPartial: (p) => setHeard(p),
        onFinal: (text) => {
          processSpokenText(text);
        },
        onError: (err) => midFail(err),
        onEnd: () => {
          setPhase((prev) => (prev === "listening" ? "processing" : prev));
        },
      });

      if (!started) {
        midFail(tt("vcmMicStartFail"));
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      midFail(msg);
    }
  }

  function processSpokenText(text: string) {
    setPhase("processing");
    if (!text || text.trim().length === 0) {
      setPhase("no-match");
      setHeard("");
      return;
    }
    const clean = text.trim();
    setHeard(clean);

    const found = findMatchingPhrase(clean);
    if (found) {
      setMatch(found);
      setPhase("matched");
      setTimeout(() => speak(found.label, lang, settings.soundEnabled), 200);
    } else {
      setPhase("no-match");
    }
  }

  async function handleFinishSpeaking() {
    if (phase !== "listening") return;
    setPhase("processing");
    try {
      await stopListening();
    } catch {
      setPhase("idle");
    }
  }

  function cancelListening() {
    stopListening().catch(() => {});
    setPhase("idle");
    setHeard("");
  }

  function midFail(msg: string) {
    setErrorText(msg);
    setPhase("error");
  }

  // Quick test demo phrase
  function testPhrase(phrase: string) {
    haptic();
    reset();
    processSpokenText(phrase);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color="white" />
          </Pressable>
          <Text style={styles.headerTitle}>{tt("vcmTitle")}</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.breadcrumb}>
            <Text style={styles.breadcrumbText}>{tt("vcmBreadcrumb")}</Text>
          </View>

          {phase === "idle" && (
            <View style={[styles.stage, styles.stageMuted]}>
              <Ionicons name="mic-outline" size={88} color={colors.textLight} />
              <Text style={styles.stageIdleTitle}>{tt("vcmTapMic")}</Text>
              <Text style={styles.stageIdleSub}>{tt("vcmTrySaying")}</Text>
            </View>
          )}

          {phase === "listening" && (
            <View style={[styles.stage, styles.stageActive]}>
              <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]}>
                <Ionicons name="mic" size={80} color="white" />
              </Animated.View>
              <Text style={styles.stageActiveTitle}>{tt("vcmListening")}</Text>
              <Text style={styles.heardLine}>{heard}</Text>
              <Pressable onPress={cancelListening} hitSlop={16} style={{ marginTop: 12 }}>
                <Text style={styles.stageCancel}>{tt("vcmCancel")}</Text>
              </Pressable>
            </View>
          )}

          {phase === "processing" && (
            <View style={[styles.stage, styles.stageMuted]}>
              <ActivityIndicator size="large" color={colors.forest} />
              <Text style={styles.stageIdleTitle}>{tt("vcmMatchingVoice")}</Text>
              {heard.length > 0 && <Text style={styles.heardLine}>{tt("vcmHeardPrefix").replace("{text}", heard)}</Text>}
            </View>
          )}

          {phase === "matched" && match && (
            <View style={styles.stage}>
              <View style={styles.matchImageWrap}>
                {match.imagePath.startsWith("seed:prep") ? (
                  <SeedPrepositionArt phraseId={match.imagePath} label={match.label} lang={settings.language} />
                ) : match.imagePath ? (
                  <Image source={{ uri: match.imagePath }} style={styles.matchImage} />
                ) : (
                  <Ionicons name="image-outline" size={96} color={colors.textMid} />
                )}
              </View>
              <Text style={styles.matchLabel}>{match.label}</Text>
              <View style={styles.metaRow}>
                <Meta label={tt("vcmCategoryLabel")} value={match.category} />
                <Meta label={tt("vcmLevelLabel")} value={`${match.level}`} />
              </View>
              <Pressable style={styles.replayBtn} onPress={() => speak(match.label, lang, settings.soundEnabled)}>
                <Ionicons name="volume-medium-outline" size={18} color="white" />
                <Text style={styles.replayBtnText}>{tt("vcmPlayAgain")}</Text>
              </Pressable>
              {heard.length > 0 && <Text style={styles.heardLine}>{tt("vcmHeardPrefix").replace("{text}", heard)}</Text>}
            </View>
          )}

          {phase === "no-match" && (
            <View style={[styles.stage, styles.stageMuted]}>
              <Ionicons name="help-circle-outline" size={88} color={colors.textMid} />
              <Text style={styles.noMatchTitle}>{tt("vcmNoMatchTitle")}</Text>
              <Text style={styles.noMatchSub}>{tt("vcmNoMatchSub")}</Text>
              {heard.length > 0 && <Text style={styles.heardLine}>{tt("vcmHeardPrefix").replace("{text}", heard)}</Text>}
            </View>
          )}

          {phase === "error" && (
            <View style={[styles.stage, styles.stageMuted]}>
              <Ionicons name="alert-circle-outline" size={88} color={colors.textMid} />
              <Text style={styles.noMatchTitle}>{tt("vcmErrorTitle")}</Text>
              <Text style={styles.noMatchSub}>{errorText || tt("vcmErrorDefault")}</Text>
            </View>
          )}

          {/* Quick Practice Chips */}
          <View style={styles.quickSection}>
            <Text style={styles.quickSectionTitle}>{tt("vcmPracticeTitle")}</Text>
            <View style={styles.chipRow}>
              {SAMPLE_PHRASES.map((item) => (
                <Pressable
                  key={item.labelKey}
                  style={styles.sampleChip}
                  onPress={() => testPhrase(item.phrase)}
                >
                  <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                  <Text style={styles.chipText}>{tt(item.labelKey)}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Bottom Action Bar */}
          <View style={styles.bottomPad}>
            {phase === "listening" ? (
              <BigButton variant="mint" onPress={handleFinishSpeaking}>
                <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.bigBtnText}>{tt("vcmDoneSpeaking")}</Text>
              </BigButton>
            ) : (
              <BigButton
                variant={phase === "matched" ? "mint" : "primary"}
                onPress={beginListen}
                disabled={!ready || phase === "processing"}
              >
                <Text style={styles.bigBtnText}>
                  {phase === "idle" || phase === "no-match" || phase === "error"
                    ? tt("vcmStartSpeaking")
                    : phase === "processing"
                    ? tt("vcmMatching")
                    : tt("vcmTryAnother")}
                </Text>
              </BigButton>
            )}

            {(phase === "matched" || phase === "no-match" || phase === "error") && (
              <BigButton variant="ghost" onPress={reset} style={{ marginTop: 8 }}>
                <Text style={[styles.bigBtnText, { color: colors.textMid }]}>{tt("vcmClearResult")}</Text>
              </BigButton>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaCard}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function SeedPrepositionArt({ phraseId, label, lang }: { phraseId: string; label: string; lang: Parameters<typeof t>[1] }) {
  const idx = parseInt(phraseId.split(":").pop() || "0", 10);
  const layout = LAYOUTS[idx] || LAYOUTS[1];
  return (
    <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: "#eef2f1" }}>
      <View style={styles.artCanvas}>
        <View style={[styles.artBook, layout.book]}>
          <Text style={styles.artBookText}>{t("vcmBookLabel", lang)}</Text>
        </View>
        <View style={[styles.artTable, layout.table]}>
          <View style={styles.artTableTop} />
          <View style={styles.artTableLegs}>
            <View style={styles.artTableLeg} />
            <View style={styles.artTableGap} />
            <View style={styles.artTableLeg} />
          </View>
        </View>
      </View>
      <Text style={styles.artCaption} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const LAYOUTS: { book: object; table: object }[] = [
  { book: { position: "absolute", top: 130, left: 110, width: 76, height: 52 }, table: { position: "absolute", top: 160, left: 90, width: 116, height: 90 } },
  { book: { position: "absolute", top: 108, left: 110, width: 76, height: 52 }, table: { position: "absolute", top: 160, left: 90, width: 116, height: 90 } },
  { book: { position: "absolute", top: 200, left: 110, width: 76, height: 52 }, table: { position: "absolute", top: 160, left: 90, width: 116, height: 90 } },
  { book: { position: "absolute", top: 40, left: 110, width: 76, height: 52 }, table: { position: "absolute", top: 160, left: 90, width: 116, height: 90 } },
  { book: { position: "absolute", top: 220, left: 110, width: 76, height: 52 }, table: { position: "absolute", top: 160, left: 90, width: 116, height: 90 } },
  { book: { position: "absolute", top: 160, left: 20, width: 76, height: 52 }, table: { position: "absolute", top: 160, left: 110, width: 116, height: 90 } },
  { book: { position: "absolute", top: 160, left: 10, width: 60, height: 44 }, table: { position: "absolute", top: 160, left: 200, width: 90, height: 90 } },
];

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.forest,
  },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "800" },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 16, gap: 16 },
  breadcrumb: {
    backgroundColor: "rgba(45,95,79,0.08)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius,
  },
  breadcrumbText: { color: colors.forest, fontSize: 13, fontWeight: "600", textAlign: "center" },
  stage: {
    minHeight: 270,
    borderRadius: radius,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  stageMuted: { backgroundColor: "#f8fafc" },
  stageActive: { backgroundColor: colors.forest },
  stageIdleTitle: { fontSize: 18, fontWeight: "800", color: colors.textDark, textAlign: "center" },
  stageIdleSub: { fontSize: 14, color: colors.textLight, textAlign: "center", maxWidth: 280 },
  stageActiveTitle: { fontSize: 22, fontWeight: "800", color: "white" },
  stageCancel: { color: "rgba(255,255,255,0.75)", fontSize: 14, textDecorationLine: "underline" },
  pulseRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  heardLine: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 6,
  },
  matchImageWrap: {
    width: 200,
    height: 160,
    borderRadius: radiusSm,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.forest,
  },
  matchImage: { width: "100%", height: "100%", resizeMode: "cover" },
  matchLabel: { fontSize: 20, fontWeight: "800", color: colors.textDark, textAlign: "center" },
  metaRow: { flexDirection: "row", gap: 8 },
  metaCard: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    flexDirection: "row",
    gap: 6,
  },
  metaLabel: { fontSize: 12, color: colors.textLight },
  metaValue: { fontSize: 12, fontWeight: "700", color: colors.textDark },
  replayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.forest,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radiusSm,
  },
  replayBtnText: { color: "white", fontSize: 13, fontWeight: "700" },
  noMatchTitle: { fontSize: 18, fontWeight: "800", color: colors.textDark, textAlign: "center" },
  noMatchSub: { fontSize: 13, color: colors.textLight, textAlign: "center", maxWidth: 280 },
  quickSection: { marginTop: 4 },
  quickSectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textLight, marginBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sampleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.textDark },
  bottomPad: { marginTop: 12 },
  bigBtnText: { color: "white", fontSize: 16, fontWeight: "800" },
  artCanvas: { width: 300, height: 260, position: "relative" },
  artBook: {
    backgroundColor: "#3b82f6",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1d4ed8",
    zIndex: 10,
  },
  artBookText: { color: "white", fontSize: 10, fontWeight: "900" },
  artTable: { zIndex: 5 },
  artTableTop: { width: "100%", height: 16, backgroundColor: "#92400e", borderRadius: 4 },
  artTableLegs: { flexDirection: "row", justifyContent: "space-between", height: 74 },
  artTableLeg: { width: 14, height: "100%", backgroundColor: "#78350f" },
  artTableGap: { flex: 1 },
  artCaption: { position: "absolute", bottom: 6, fontSize: 11, color: colors.textLight, fontWeight: "700" },
});
