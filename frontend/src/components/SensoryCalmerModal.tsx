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

export default function SensoryCalmerModal({ visible, onClose }: Props) {
  const { settings } = useSettings();
  const lang = settings.language;
  const isRtl = lang.startsWith("ar") || lang.startsWith("ur");

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [breathingActive, setBreathingActive] = useState(true);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Breathing animation cycle
  useEffect(() => {
    if (!visible || !breathingActive) return;

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
  }, [visible, breathingActive, phaseIdx]);

  const currentPhase = PHASES[phaseIdx];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={[styles.header, isRtl && { flexDirection: "row-reverse" }]}>
            <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center", gap: 10, flex: 1 }}>
              <View style={styles.badge}>
                <Ionicons name="leaf" size={20} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, isRtl && { textAlign: "right" }]}>{t("scmTitle", lang)}</Text>
                <Text style={[styles.subTitle, isRtl && { textAlign: "right" }]}>{t("scmSubTitle", lang)}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Ionicons name="close" size={22} color="#64748b" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* 4-4-4-4 Paced Breathing Bubble */}
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
    borderRadius: 24,
    width: "100%",
    maxWidth: 480,
    maxHeight: "92%",
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  header: {
    backgroundColor: "#0f172a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "white", fontSize: 16.5, fontWeight: "800" },
  subTitle: { color: "#94a3b8", fontSize: 11.5, marginTop: 2 },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: "#1e293b",
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
  },
  sectionDesc: {
    fontSize: 12.5,
    color: "#64748b",
    marginTop: 4,
    lineHeight: 18,
    textAlign: "center",
  },
  breathingContainer: {
    alignItems: "center",
    width: "100%",
  },
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
  phaseTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  phaseDuration: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  breathingTip: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },
  cycleIndicators: {
    flexDirection: "row",
    gap: 6,
    marginTop: 16,
    alignItems: "center",
  },
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 22,
  },
  pauseResumeText: {
    fontSize: 13.5,
    fontWeight: "700",
  },
});
