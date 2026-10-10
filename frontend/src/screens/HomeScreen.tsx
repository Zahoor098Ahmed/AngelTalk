import { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { ChildProfile, TabScreen } from "../types";
import { useSettings } from "../context/SettingsContext";
import { t, type TKey } from "../modules/i18n";
import { getUsage } from "../modules/storage";
import { getPictogramUrl } from "../modules/aacPictograms";
import { tapFeedback } from "../modules/haptics";
import SmartImage from "../components/SmartImage";
import { useResponsive } from "../modules/responsive";
import LangBadge from "../components/LangBadge";
import Mascot from "../components/Mascot";
import SoftBackdrop from "../components/SoftBackdrop";
import TabBar from "../components/TabBar";
import { colors, radiusLg } from "../theme";

interface Props {
  child: ChildProfile;
  tab: TabScreen;
  onTabChange: (tab: TabScreen) => void;
  onOpenMore: () => void;
  onOpenSocialStories?: () => void;
  labels: Record<TabScreen, string>;
}

type QuickItem = {
  labelKey: TKey;
  /** ARASAAC word used as the tile's picture */
  picture: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  iconColor: string;
  desc: string;
  go: (p: Props) => void;
};

const QUICK_ACCESS: QuickItem[] = [
  {
    labelKey: "qActivities",
    picture: "play",
    icon: "game-controller",
    bg: colors.green,
    iconColor: colors.greenDeep,
    desc: "Play speech, emotion & puzzle games",
    go: (p) => p.onTabChange("games"),
  },
  {
    labelKey: "pOverview",
    picture: "graph",
    icon: "stats-chart",
    bg: colors.purple,
    iconColor: colors.purpleDeep,
    desc: "Word counts, weekly reports & doctor IEP",
    go: (p) => p.onTabChange("progress"),
  },
];

export default function HomeScreen(props: Props) {
  const { child, tab, onTabChange, onOpenMore, labels } = props;
  const { settings } = useSettings();
  const { isTablet } = useResponsive();
  const lang = settings.language;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("morning", lang) : hour < 17 ? t("afternoon", lang) : t("evening", lang);
  const tr = (en: string, ar: string, ur: string) => (lang === "ar-SA" ? ar : lang === "ur-PK" ? ur : en);

  const usage = useMemo(() => getUsage(child.id), [child.id]);
  const weekWords = usage.wordsByDay.reduce((sum, v) => sum + v, 0);

  const STATS: { icon: keyof typeof Ionicons.glyphMap; tint: string; bg: string; value: number; label: string }[] = [
    { icon: "star", tint: "#d97706", bg: "#fef3c7", value: child.stars ?? 0, label: tr("Stars", "نجوم", "ستارے") },
    { icon: "chatbubbles", tint: "#2563eb", bg: "#dbeafe", value: weekWords, label: tr("Words this week", "كلمات هذا الأسبوع", "اس ہفتے کے الفاظ") },
    { icon: "flame", tint: "#ea580c", bg: "#ffedd5", value: usage.consecutiveDays ?? 0, label: tr("Days in a row", "أيام متتالية", "لگاتار دن") },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <SoftBackdrop
          shapes={[
            { size: 90, top: -20, right: -20, color: "rgba(45,95,79,0.06)" },
            { size: 60, top: 120, left: -20, color: "rgba(201,138,61,0.05)" },
          ]}
        />

        {/* 1. Header Banner */}
        <View style={styles.header}>
          <View style={[styles.headerInner, isTablet && styles.headerInnerTablet]}>
            <View style={styles.headerTop}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Mascot mood="happy" size={58} animate={!settings.reduceMotion} />
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <Ionicons
                      name={hour < 12 ? "sunny-outline" : hour < 17 ? "partly-sunny-outline" : "moon-outline"}
                      size={16}
                      color="rgba(255,255,255,0.8)"
                    />
                    <Text style={styles.greeting}>{greeting}</Text>
                  </View>
                  <Text style={styles.name}>{child.name}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={styles.starBadgeHeader}>
                  <Ionicons name="star" size={17} color="#fbbf24" />
                  <Text style={styles.starBadgeHeaderText}>{child.stars ?? 0}</Text>
                </View>
                <LangBadge dark />
                <Pressable
                  onPress={onOpenMore}
                  style={styles.settingsBtn}
                  hitSlop={8}
                  accessibilityLabel="Settings and Menu"
                >
                  <Ionicons name="grid-outline" size={23} color="white" />
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.body, isTablet && styles.bodyTablet]}
          showsVerticalScrollIndicator={false}
        >
          {/* Start talking — the main thing a child comes here to do */}
          <Pressable
            onPress={() => {
              tapFeedback();
              onTabChange("speak");
            }}
            style={({ pressed }) => [styles.heroCard, pressed && { transform: [{ scale: 0.99 }] }]}
            accessibilityLabel="Start talking"
          >
            <View style={styles.heroAccent} />
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={styles.heroKicker}>{tr("TALK BOARD", "لوحة الكلام", "بات چیت بورڈ")}</Text>
              <Text style={[styles.heroTitle, isTablet && { fontSize: 24, lineHeight: 31 }]}>
                {tr("What do you want to say today?", "ماذا تريد أن تقول اليوم؟", "آج آپ کیا کہنا چاہتے ہیں؟")}
              </Text>
              <View style={styles.heroBtn}>
                <Ionicons name="chatbubble-ellipses" size={18} color="#ffffff" />
                <Text style={styles.heroBtnText}>{tr("Start Talking", "ابدأ الكلام", "بات شروع کریں")}</Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" />
              </View>
            </View>
            <View style={[styles.heroPicBox, isTablet && styles.heroPicBoxTablet]}>
              {getPictogramUrl("talk") ? (
                <SmartImage source={{ uri: getPictogramUrl("talk")! }} style={styles.heroPic} />
              ) : (
                <Ionicons name="chatbubbles" size={48} color={colors.forest} />
              )}
            </View>
          </Pressable>

          {/* Little progress strip */}
          <View style={styles.statsRow}>
            {STATS.map((st) => (
              <View key={st.icon} style={[styles.statCard, isTablet && styles.statCardTablet]}>
                <View style={[styles.statIcon, { backgroundColor: st.bg }]}>
                  <Ionicons name={st.icon} size={20} color={st.tint} />
                </View>
                <View style={{ flexShrink: 1 }}>
                  <Text style={styles.statValue}>{st.value}</Text>
                  <Text style={styles.statLabel} numberOfLines={2}>{st.label}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Quick Access */}
          <Text style={styles.sectionTitle}>{t("quickAccess", lang)}</Text>
          <View style={styles.quickGrid}>
            {QUICK_ACCESS.map((q) => (
              <Pressable
                key={q.labelKey}
                onPress={() => q.go(props)}
                style={({ pressed }) => [styles.quickTile, pressed && { transform: [{ scale: 0.98 }] }]}
              >
                <Ionicons name="chevron-forward" size={16} color="#b6bec8" style={styles.quickChevron} />
                <View style={[styles.quickIconBadge, { backgroundColor: q.bg }]}>
                  {getPictogramUrl(q.picture) ? (
                    <SmartImage source={{ uri: getPictogramUrl(q.picture)! }} style={styles.quickPic} />
                  ) : (
                    <Ionicons name={q.icon} size={isTablet ? 34 : 30} color={q.iconColor} />
                  )}
                </View>
                <Text style={[styles.quickLabel, isTablet && { fontSize: 16 }]} numberOfLines={1}>{t(q.labelKey, lang)}</Text>
                <Text style={styles.quickDesc} numberOfLines={2}>{q.desc}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Main 5-Tab Navigation Bar */}
      <TabBar active={tab} onChange={onTabChange} labels={labels} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.forest,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerInner: {
    width: "100%",
  },
  headerInnerTablet: {
    maxWidth: 860,
    alignSelf: "center",
  },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { color: "rgba(255,255,255,0.85)", fontSize: 16, fontWeight: "600" },
  name: { color: "white", fontSize: 28, fontWeight: "900", marginTop: 2 },
  settingsBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  starBadgeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  starBadgeHeaderText: { color: "white", fontSize: 16, fontWeight: "800" },

  body: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 28, gap: 14 },
  bodyTablet: { maxWidth: 860, alignSelf: "center", width: "100%", paddingHorizontal: 28 },

  /* Quick Access */
  sectionTitle: { fontSize: 17, fontWeight: "900", color: colors.textDark, marginTop: 6 },
  quickGrid: { flexDirection: "row", gap: 12 },
  quickTile: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: radiusLg,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: "#e8edf2",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickChevron: { position: "absolute", top: 12, right: 10 },
  quickIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  quickLabel: { fontSize: 15, fontWeight: "800", color: colors.textDark },
  quickDesc: { fontSize: 12, color: colors.textMid, lineHeight: 16 },
  quickPic: { width: 44, height: 44 },

  /* Start Talking card */
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingVertical: 20,
    paddingLeft: 24,
    paddingRight: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e8edf2",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  heroAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 6, backgroundColor: colors.forest },
  heroKicker: { color: colors.forest, fontSize: 12, fontWeight: "900", letterSpacing: 1.2 },
  heroTitle: { color: colors.textDark, fontSize: 20, fontWeight: "900", lineHeight: 26 },
  heroBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.forest,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  heroBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  heroPicBox: {
    width: 96,
    height: 96,
    borderRadius: 22,
    backgroundColor: "#eef6f1",
    alignItems: "center",
    justifyContent: "center",
  },
  heroPicBoxTablet: { width: 124, height: 124, borderRadius: 26 },
  heroPic: { width: "78%", height: "78%" },

  /* stats strip */
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e8edf2",
  },
  statCardTablet: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  statIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 22, fontWeight: "900", color: colors.textDark },
  statLabel: { fontSize: 12, fontWeight: "600", color: colors.textMid },
});
