import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { tapFeedback } from "../modules/haptics";
import { useSettings } from "../context/SettingsContext";
import { t, type TKey } from "../modules/i18n";

interface Props {
  visible: boolean;
  onClose: () => void;
}

type BreathingPhase = "Inhale" | "Hold" | "Exhale" | "Rest";

const PHASES: { phase: BreathingPhase; duration: number; labelKey: TKey; tipKey: TKey; color: string }[] = [
  { phase: "Inhale", duration: 4000, labelKey: "scmPhaseInhale", tipKey: "scmTipInhale", color: "#60a5fa" },
  { phase: "Hold", duration: 4000, labelKey: "scmPhaseHold", tipKey: "scmTipHold", color: "#34d399" },
  { phase: "Exhale", duration: 4000, labelKey: "scmPhaseExhale", tipKey: "scmTipExhale", color: "#a78bfa" },
  { phase: "Rest", duration: 4000, labelKey: "scmPhaseRest", tipKey: "scmTipRest", color: "#38bdf8" },
];

const GROUNDING_STEPS: { count: number; icon: string; labelKey: TKey; examplesKey: TKey }[] = [
  { count: 5, icon: "eye", labelKey: "scmStepSee", examplesKey: "scmExSee" },
  { count: 4, icon: "hand-left", labelKey: "scmStepTouch", examplesKey: "scmExTouch" },
  { count: 3, icon: "volume-medium", labelKey: "scmStepHear", examplesKey: "scmExHear" },
  { count: 2, icon: "flower", labelKey: "scmStepSmell", examplesKey: "scmExSmell" },
  { count: 1, icon: "happy", labelKey: "scmStepTaste", examplesKey: "scmExTaste" },
];

export default function SensoryCalmerModal({ visible, onClose }: Props) {
  const { settings } = useSettings();
  const lang = settings.language;
  const [activeTab, setActiveTab] = useState<"breathing" | "grounding" | "ambient">("breathing");
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [breathingActive, setBreathingActive] = useState(true);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [playingAmbient, setPlayingAmbient] = useState<string | null>(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Breathing animation cycle
  useEffect(() => {
    if (!visible || !breathingActive || activeTab !== "breathing") return;

    const current = PHASES[phaseIdx];

    if (current.phase === "Inhale") {
      Animated.timing(scaleAnim, {
        toValue: 1.4,
        duration: current.duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else if (current.phase === "Exhale") {
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: current.duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }

    const timer = setTimeout(() => {
      tapFeedback();
      setPhaseIdx((prev) => (prev + 1) % PHASES.length);
    }, current.duration);

    return () => clearTimeout(timer);
  }, [visible, breathingActive, phaseIdx, activeTab]);

  function toggleGrounding(count: number) {
    tapFeedback();
    setCheckedSteps((prev) => ({ ...prev, [count]: !prev[count] }));
  }

  function toggleAmbient(soundKey: string) {
    tapFeedback();
    if (playingAmbient === soundKey) {
      setPlayingAmbient(null);
    } else {
      setPlayingAmbient(soundKey);
    }
  }

  const currentPhase = PHASES[phaseIdx];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={styles.badge}>
                <Ionicons name="leaf" size={20} color="white" />
              </View>
              <View>
                <Text style={styles.title}>{t("scmTitle", lang)}</Text>
                <Text style={styles.subTitle}>{t("scmSubTitle", lang)}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748b" />
            </Pressable>
          </View>

          {/* Sub Navigation */}
          <View style={styles.subTabBar}>
            {[
              { key: "breathing", icon: "radio-button-on", labelKey: "scmTabBreathing" as TKey },
              { key: "grounding", icon: "footsteps", labelKey: "scmTabGrounding" as TKey },
              { key: "ambient", icon: "musical-notes", labelKey: "scmTabAmbient" as TKey },
            ].map((tab) => {
              const sel = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => {
                    tapFeedback();
                    setActiveTab(tab.key as any);
                  }}
                  style={[styles.subTabBtn, sel && styles.subTabBtnActive]}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={15}
                    color={sel ? colors.forest : "#64748b"}
                  />
                  <Text style={[styles.subTabText, sel && styles.subTabTextActive]}>
                    {t(tab.labelKey, lang)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* ================= 1. PACED BREATHING ================= */}
            {activeTab === "breathing" && (
              <View style={styles.breathingContainer}>
                <Text style={styles.sectionHeader}>{t("scmBreathingHeader", lang)}</Text>
                <Text style={styles.sectionDesc}>
                  {t("scmBreathingDesc", lang)}
                </Text>

                <View style={styles.bubbleStage}>
                  <Animated.View
                    style={[
                      styles.breathingBubble,
                      {
                        backgroundColor: currentPhase.color,
                        transform: [{ scale: scaleAnim }],
                      },
                    ]}
                  >
                    <Text style={styles.phaseTitle}>{t(currentPhase.labelKey, lang)}</Text>
                    <Text style={styles.phaseDuration}>{t("scmSeconds4", lang)}</Text>
                  </Animated.View>
                </View>

                <Text style={styles.breathingTip}>{t(currentPhase.tipKey, lang)}</Text>

                <View style={styles.cycleIndicators}>
                  {PHASES.map((p, i) => (
                    <View
                      key={p.phase}
                      style={[
                        styles.cycleDot,
                        i === phaseIdx && { backgroundColor: p.color, width: 24 },
                      ]}
                    />
                  ))}
                </View>

                <Pressable
                  onPress={() => setBreathingActive(!breathingActive)}
                  style={[
                    styles.pauseResumeBtn,
                    { backgroundColor: breathingActive ? "#e2e8f0" : colors.forest },
                  ]}
                >
                  <Ionicons
                    name={breathingActive ? "pause" : "play"}
                    size={16}
                    color={breathingActive ? "#334155" : "white"}
                  />
                  <Text
                    style={[
                      styles.pauseResumeText,
                      { color: breathingActive ? "#334155" : "white" },
                    ]}
                  >
                    {breathingActive ? t("scmPauseBubble", lang) : t("scmResumeRhythm", lang)}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* ================= 2. 5-4-3-2-1 GROUNDING ================= */}
            {activeTab === "grounding" && (
              <View style={styles.groundingContainer}>
                <Text style={styles.sectionHeader}>{t("scmGroundingHeader", lang)}</Text>
                <Text style={styles.sectionDesc}>
                  {t("scmGroundingDesc", lang)}
                </Text>

                <View style={{ gap: 10, marginTop: 10 }}>
                  {GROUNDING_STEPS.map((step) => {
                    const done = !!checkedSteps[step.count];
                    return (
                      <Pressable
                        key={step.count}
                        onPress={() => toggleGrounding(step.count)}
                        style={[styles.stepCard, done && styles.stepCardDone]}
                      >
                        <View style={[styles.stepNumCircle, done && styles.stepNumCircleDone]}>
                          <Text style={[styles.stepNumText, done && styles.stepNumTextDone]}>
                            {step.count}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Ionicons
                              name={step.icon as any}
                              size={16}
                              color={done ? colors.greenDeep : colors.forest}
                            />
                            <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>
                              {t(step.labelKey, lang)}
                            </Text>
                          </View>
                          <Text style={styles.stepExamples}>{t(step.examplesKey, lang)}</Text>
                        </View>
                        <Ionicons
                          name={done ? "checkmark-circle" : "ellipse-outline"}
                          size={22}
                          color={done ? colors.greenDeep : "#cbd5e1"}
                        />
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  onPress={() => {
                    tapFeedback();
                    setCheckedSteps({});
                  }}
                  style={styles.resetBtn}
                >
                  <Ionicons name="refresh" size={16} color="#64748b" />
                  <Text style={styles.resetBtnText}>{t("scmResetChecklist", lang)}</Text>
                </Pressable>
              </View>
            )}

            {/* ================= 3. SOOTHING SOUNDS ================= */}
            {activeTab === "ambient" && (
              <View style={styles.ambientContainer}>
                <Text style={styles.sectionHeader}>{t("scmAmbientHeader", lang)}</Text>
                <Text style={styles.sectionDesc}>
                  {t("scmAmbientDesc", lang)}
                </Text>

                <View style={styles.soundGrid}>
                  {[
                    { key: "rain", titleKey: "scmSoundRainTitle" as TKey, icon: "rainy", color: "#60a5fa", descKey: "scmSoundRainDesc" as TKey },
                    { key: "ocean", titleKey: "scmSoundOceanTitle" as TKey, icon: "water", color: "#0ea5e9", descKey: "scmSoundOceanDesc" as TKey },
                    { key: "white", titleKey: "scmSoundWhiteTitle" as TKey, icon: "radio", color: "#64748b", descKey: "scmSoundWhiteDesc" as TKey },
                    { key: "wind", titleKey: "scmSoundWindTitle" as TKey, icon: "leaf", color: "#10b981", descKey: "scmSoundWindDesc" as TKey },
                  ].map((s) => {
                    const isPlaying = playingAmbient === s.key;
                    return (
                      <Pressable
                        key={s.key}
                        onPress={() => toggleAmbient(s.key)}
                        style={[styles.soundCard, isPlaying && styles.soundCardActive]}
                      >
                        <View
                          style={[
                            styles.soundIconCircle,
                            { backgroundColor: isPlaying ? s.color : "#f1f5f9" },
                          ]}
                        >
                          <Ionicons
                            name={s.icon as any}
                            size={24}
                            color={isPlaying ? "white" : s.color}
                          />
                        </View>
                        <Text style={[styles.soundTitle, isPlaying && styles.soundTitleActive]}>
                          {t(s.titleKey, lang)}
                        </Text>
                        <Text style={styles.soundDesc}>{t(s.descKey, lang)}</Text>
                        <View
                          style={[
                            styles.playBadge,
                            isPlaying && { backgroundColor: colors.forest },
                          ]}
                        >
                          <Ionicons
                            name={isPlaying ? "volume-high" : "play"}
                            size={12}
                            color={isPlaying ? "white" : "#64748b"}
                          />
                          <Text
                            style={[
                              styles.playBadgeText,
                              isPlaying && { color: "white" },
                            ]}
                          >
                            {isPlaying ? t("scmPlaying", lang) : t("scmTapToPlay", lang)}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {playingAmbient && (
                  <Pressable
                    onPress={() => setPlayingAmbient(null)}
                    style={styles.stopAllBtn}
                  >
                    <Ionicons name="stop-circle" size={18} color="#ef4444" />
                    <Text style={styles.stopAllText}>{t("scmStopAll", lang)}</Text>
                  </Pressable>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 520,
    maxHeight: "92%",
    overflow: "hidden",
    elevation: 8,
  },
  header: {
    backgroundColor: "#0f172a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "white", fontSize: 16, fontWeight: "800" },
  subTitle: { color: "#94a3b8", fontSize: 11, marginTop: 2 },
  closeBtn: { padding: 6 },

  subTabBar: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  subTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  subTabBtnActive: {
    backgroundColor: "#ffffff",
    borderBottomColor: colors.forest,
  },
  subTabText: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  subTabTextActive: { color: colors.forest, fontWeight: "800" },

  content: { padding: 18, gap: 16 },
  sectionHeader: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  sectionDesc: { fontSize: 12, color: "#64748b", marginTop: 2, lineHeight: 17 },

  /* Breathing Section */
  breathingContainer: { alignItems: "center" },
  bubbleStage: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  breathingBubble: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  phaseTitle: { color: "white", fontSize: 22, fontWeight: "900", letterSpacing: 0.5 },
  phaseDuration: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "700", marginTop: 2 },
  breathingTip: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },
  cycleIndicators: { flexDirection: "row", gap: 6, marginTop: 14, alignItems: "center" },
  cycleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#cbd5e1",
  },
  pauseResumeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 18,
  },
  pauseResumeText: { fontSize: 13, fontWeight: "700" },

  /* Grounding Section */
  groundingContainer: { gap: 10 },
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    borderRadius: 12,
  },
  stepCardDone: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  stepNumCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumCircleDone: { backgroundColor: colors.greenDeep },
  stepNumText: { fontSize: 14, fontWeight: "800", color: "#334155" },
  stepNumTextDone: { color: "white" },
  stepLabel: { fontSize: 13, fontWeight: "800", color: "#1e293b" },
  stepLabelDone: { color: colors.forest },
  stepExamples: { fontSize: 11, color: "#64748b", marginTop: 2 },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginTop: 10,
  },
  resetBtnText: { color: "#64748b", fontSize: 12.5, fontWeight: "600" },

  /* Ambient Section */
  ambientContainer: { gap: 12 },
  soundGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 6 },
  soundCard: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  soundCardActive: {
    backgroundColor: "#f0fdf4",
    borderColor: colors.greenDeep,
    borderWidth: 2,
  },
  soundIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  soundTitle: { fontSize: 14, fontWeight: "800", color: "#1e293b" },
  soundTitleActive: { color: colors.forest },
  soundDesc: { fontSize: 10.5, color: "#64748b", textAlign: "center" },
  playBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  playBadgeText: { fontSize: 10, fontWeight: "700", color: "#475569" },
  stopAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fee2e2",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  stopAllText: { color: "#b91c1c", fontWeight: "700", fontSize: 13 },
});
