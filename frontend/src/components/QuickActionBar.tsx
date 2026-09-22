import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { playAttentionChime } from "../modules/audio";
import { tapFeedback } from "../modules/haptics";
import { colors, radius } from "../theme";
import { useSettings } from "../context/SettingsContext";
import { t } from "../modules/i18n";

interface Props {
  onHome?: () => void;
  onBack?: () => void;
  onMistake?: () => void;
  mistakeDisabled?: boolean;
  onAttentionAlert?: () => void;
}

export default function QuickActionBar({
  onHome,
  onBack,
  onMistake,
  mistakeDisabled = false,
  onAttentionAlert,
}: Props) {
  const { settings } = useSettings();
  const lang = settings.language;

  function handleAttention() {
    tapFeedback();
    if (onAttentionAlert) {
      onAttentionAlert();
    } else {
      playAttentionChime();
    }
  }

  function handleMistake() {
    if (mistakeDisabled || !onMistake) return;
    tapFeedback();
    onMistake();
  }

  return (
    <View style={styles.container}>
      {/* Home Button */}
      {onHome && (
        <Pressable onPress={onHome} style={styles.actionBtn}>
          <View style={[styles.iconWrap, { backgroundColor: "#ecfdf5" }]}>
            <Ionicons name="home" size={18} color={colors.forest} />
          </View>
          <Text style={styles.actionLabel}>{t("home", lang)}</Text>
        </Pressable>
      )}

      {/* Back Button */}
      {onBack && (
        <Pressable onPress={onBack} style={styles.actionBtn}>
          <View style={[styles.iconWrap, { backgroundColor: "#eff6ff" }]}>
            <Ionicons name="arrow-back" size={18} color={colors.blueDeep} />
          </View>
          <Text style={styles.actionLabel}>{t("back", lang)}</Text>
        </Pressable>
      )}

      {/* "I Made a Mistake" Undo Button */}
      {onMistake && (
        <Pressable
          onPress={handleMistake}
          disabled={mistakeDisabled}
          style={[styles.actionBtn, mistakeDisabled && { opacity: 0.4 }]}
        >
          <View style={[styles.iconWrap, { backgroundColor: "#fff7ed" }]}>
            <Ionicons name="arrow-undo" size={18} color="#ea580c" />
          </View>
          <Text style={[styles.actionLabel, { color: "#ea580c" }]}>{t("qabMistake", lang)}</Text>
        </Pressable>
      )}

      {/* Attention / Alert Tone Button */}
      <Pressable onPress={handleAttention} style={styles.actionBtn}>
        <View style={[styles.iconWrap, { backgroundColor: "#fef3c7" }]}>
          <Ionicons name="notifications" size={18} color="#b45309" />
        </View>
        <Text style={[styles.actionLabel, { color: "#b45309" }]}>{t("qabAttention", lang)}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 64,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textDark,
  },
});
