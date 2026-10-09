import { Pressable, Text, StyleSheet, Alert } from "react-native";
import { useSettings } from "../context/SettingsContext";
import { applyLanguageDirection, t } from "../modules/i18n";
import { retranslateSeedBoard, setSeedLanguage } from "../modules/customCategories";
import { colors } from "../theme";

interface LangBadgeProps {
  dark?: boolean;
}

export default function LangBadge({ dark }: LangBadgeProps) {
  const { settings, update } = useSettings();
  const isEnglish = settings.language === "en-US";

  function toggle() {
    const nextLang = isEnglish ? "ar-SA" : "en-US";
    update({ language: nextLang });
    setSeedLanguage(nextLang);
    retranslateSeedBoard(nextLang);
    const flipped = applyLanguageDirection(nextLang);
    if (flipped) Alert.alert(nextLang === "ar-SA" ? "العربية" : "English", t("reopenForLanguage", nextLang));
  }

  return (
    <Pressable onPress={toggle} style={[styles.badge, { backgroundColor: dark ? "rgba(255,255,255,0.2)" : colors.forest }]}>
      <Text style={styles.text}>{isEnglish ? "عربي" : "EN"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Centred in its row and as tall as the neighbouring header buttons
  badge: {
    minHeight: 42,
    minWidth: 58,
    paddingHorizontal: 16,
    borderRadius: 21,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: "white", fontWeight: "800", fontSize: 15, textAlign: "center", includeFontPadding: false },
});
