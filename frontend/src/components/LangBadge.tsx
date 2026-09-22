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
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, alignSelf: "flex-start" },
  text: { color: "white", fontWeight: "700", fontSize: 12 },
});
