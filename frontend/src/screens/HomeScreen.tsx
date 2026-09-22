import { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { ChildProfile, TabScreen, TherapyGoal } from "../types";
import { useSettings } from "../context/SettingsContext";
import { speak } from "../modules/tts";
import { tapFeedback } from "../modules/haptics";
import { t, wordLabel, type TKey } from "../modules/i18n";
import { getUsage, recordScheduleAdherence, updateChild } from "../modules/storage";
import { useResponsive } from "../modules/responsive";
import LangBadge from "../components/LangBadge";
import Mascot from "../components/Mascot";
import SoftBackdrop from "../components/SoftBackdrop";
import TabBar from "../components/TabBar";
import { colors, radius, radiusLg } from "../theme";

interface Props {
  child: ChildProfile;
  tab: TabScreen;
  onTabChange: (tab: TabScreen) => void;
  onOpenMore: () => void;
  labels: Record<TabScreen, string>;
}

type QuickItem = {
  labelKey: TKey;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  iconColor: string;
  desc: string;
  go: (p: Props) => void;
};

const QUICK_ACCESS: QuickItem[] = [
  {
    labelKey: "qCommunicate",
    icon: "chatbubble-ellipses",
    bg: colors.blue,
    iconColor: colors.blueDeep,
    desc: "Tap pictures to speak words & sentences",
    go: (p) => p.onTabChange("speak"),
  },
  {
    labelKey: "todaysSchedule",
    icon: "calendar",
    bg: colors.yellow,
    iconColor: colors.yellowDeep,
    desc: "Follow daily visual routine step-by-step",
    go: (p) => p.onTabChange("schedule"),
  },
  {
    labelKey: "qActivities",
    icon: "game-controller",
    bg: colors.green,
    iconColor: colors.greenDeep,
    desc: "Play speech, emotion & puzzle games",
    go: (p) => p.onTabChange("games"),
  },
  {
    labelKey: "pOverview",
    icon: "stats-chart",
    bg: colors.purple,
    iconColor: colors.purpleDeep,
    desc: "Word counts, weekly reports & doctor IEP",
    go: (p) => p.onTabChange("progress"),
  },
];

const TODAY_PREVIEW = [
  { icon: "🍳", labelKey: "sBreakfast" as TKey, time: "08:00", state: "done" as const, color: colors.yellow },
  { icon: "🧩", labelKey: "sPlayTime" as TKey, time: "09:00", state: "done" as const, color: colors.green },
  { icon: "💬", labelKey: "sAacSession" as TKey, time: "10:30", state: "now" as const, color: colors.blue },
  { icon: "🍽️", labelKey: "sLunch" as TKey, time: "12:00", state: "upcoming" as const, color: colors.orange },
];

export default function HomeScreen(props: Props) {
  const { child, tab, onTabChange, onOpenMore, labels } = props;
  const { settings } = useSettings();
  const { isSmallPhone, isTablet } = useResponsive();
  const lang = settings.language;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("morning", lang) : hour < 17 ? t("afternoon", lang) : t("evening", lang);

  const usage = useMemo(() => getUsage(child.id), [child.id]);
  const weekWords = usage.wordsByDay.reduce((s, v) => s + v, 0);

  const [scheduleItems, setScheduleItems] = useState(TODAY_PREVIEW);

  function toggleScheduleItem(idx: number) {
    tapFeedback();
    setScheduleItems((prev) => {
      const next = prev.map((item, i) => {
        if (i !== idx) return item;
        const nextState: "done" | "now" | "upcoming" = item.state === "done" ? "upcoming" : "done";
        speak(
          t(item.labelKey, lang) + (nextState === "done" ? ". Finished! Great job!" : ""),
          lang,
          settings.soundEnabled
        );
        return { ...item, state: nextState };
      });
      const doneCount = next.filter((i) => i.state === "done").length;
      const percent = Math.round((doneCount / next.length) * 100);
      recordScheduleAdherence(child.id, percent);
      if (next[idx].state === "done") {
        updateChild({ ...child, stars: (child.stars ?? 0) + 1 });
      }
      return next;
    });
  }

  function handleOpenScheduleItem(item: (typeof TODAY_PREVIEW)[number]) {
    tapFeedback();
    speak(t(item.labelKey, lang), lang, settings.soundEnabled);
    if (item.labelKey === "sAacSession") {
      onTabChange("speak");
    } else {
      onTabChange("schedule");
    }
  }

  // Active Doctor Therapy Goal
  const activeTherapyGoal: TherapyGoal = useMemo(() => {
    if (child.therapyGoals && child.therapyGoals.length > 0) {
      const incomplete = child.therapyGoals.find((g) => !g.completed);
      if (incomplete) return incomplete;
      return child.therapyGoals[0];
    }
    return {
      id: "default_speech",
      title: t("defaultSpeechGoalTitle", lang),
      category: "speech",
      targetCount: 3,
      currentCount: Math.min(3, weekWords),
      unit: t("unitWords", lang),
      completed: weekWords >= 3,
      prescribedBy: t("doctorsDailyGoal", lang),
      assignedDate: new Date().toISOString(),
    };
  }, [child.therapyGoals, weekWords, lang]);

  const therapyProgressPct = Math.min(
    100,
    Math.round((activeTherapyGoal.currentCount / activeTherapyGoal.targetCount) * 100)
  );

  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  function handleSelectMood(moodLabel: string) {
    tapFeedback();
    setSelectedMood(moodLabel);
    speak(`${t("sayIAmFeeling", lang)} ${wordLabel(moodLabel, lang)}!`, lang, settings.soundEnabled);
  }

  function handleUrgentNeed(phraseKey: TKey) {
    tapFeedback();
    speak(t(phraseKey, lang), lang, settings.soundEnabled);
  }

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
                <Mascot mood="happy" size={44} animate={!settings.reduceMotion} />
                <View>
                  <Text style={styles.greeting}>{greeting} 👋</Text>
                  <Text style={styles.name}>{child.name}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={styles.starBadgeHeader}>
                  <Text style={{ fontSize: 13 }}>⭐</Text>
                  <Text style={styles.starBadgeHeaderText}>{child.stars ?? 0}</Text>
                </View>
                <LangBadge dark />
                <Pressable
                  onPress={onOpenMore}
                  style={styles.settingsBtn}
                  hitSlop={8}
                  accessibilityLabel="Settings and Menu"
                >
                  <Ionicons name="grid-outline" size={18} color="white" />
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.body, isTablet && styles.bodyTablet]}
          showsVerticalScrollIndicator={false}
        >
          {/* 2. Urgent Needs Express Communication Bar */}
          <View style={styles.urgentSection}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="flash" size={15} color={colors.forest} />
              <Text style={styles.sectionHeadingSmall}>{t("quickExpressHeading", lang)}</Text>
            </View>
            <View style={[styles.urgentGrid, isSmallPhone && { gap: 6 }, isTablet && { gap: 12 }]}>
              {[
                { label: "Help", phraseKey: "needHelpPhrase" as TKey, emoji: "🆘", color: "#fee2e2", textColor: "#b91c1c" },
                { label: "Water", phraseKey: "needWaterPhrase" as TKey, emoji: "💧", color: "#e0f2fe", textColor: "#0369a1" },
                { label: "Bathroom", phraseKey: "needBathroomPhrase" as TKey, emoji: "🚻", color: "#fef3c7", textColor: "#b45309" },
                { label: "Stop", phraseKey: "pleaseStopPhrase" as TKey, emoji: "🛑", color: "#ffedd5", textColor: "#c2410c" },
              ].map((u) => (
                <Pressable
                  key={u.label}
                  onPress={() => handleUrgentNeed(u.phraseKey)}
                  style={({ pressed }) => [
                    styles.urgentTile,
                    { backgroundColor: u.color },
                    isSmallPhone && { paddingVertical: 10, borderRadius: 12 },
                    isTablet && { paddingVertical: 16, borderRadius: 16 },
                    pressed && { transform: [{ scale: 0.96 }] },
                  ]}
                  accessibilityLabel={`Express ${u.label}`}
                >
                  <Text style={{ fontSize: isSmallPhone ? 22 : isTablet ? 28 : 24 }}>{u.emoji}</Text>
                  <Text
                    style={[
                      styles.urgentTileLabel,
                      { color: u.textColor, fontSize: isSmallPhone ? 11 : isTablet ? 13.5 : 12 },
                    ]}
                  >
                    {u.label === "Bathroom" ? t("bathroom", lang) : wordLabel(u.label, lang)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 3. Emotional Mood Check-In Widget */}
          <View style={styles.moodSection}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="heart" size={15} color="#ec4899" />
                <Text style={styles.sectionHeadingSmall}>{t("moodQuestion", lang)}</Text>
              </View>
              {selectedMood && (
                <View style={styles.selectedMoodTag}>
                  <Text style={styles.selectedMoodTagText}>
                    {t("feelingTag", lang)} {wordLabel(selectedMood, lang)} ✓
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.moodRow, isSmallPhone && { gap: 4 }, isTablet && { gap: 12 }]}>
              {[
                { label: "Happy", emoji: "😃", bg: "#dcfce7", color: "#166534" },
                { label: "Calm", emoji: "😌", bg: "#e0f2fe", color: "#0369a1" },
                { label: "Excited", emoji: "🤩", bg: "#fef3c7", color: "#b45309" },
                { label: "Sad", emoji: "😢", bg: "#ede9fe", color: "#6b21a8" },
                { label: "Tired", emoji: "😴", bg: "#f1f5f9", color: "#475569" },
              ].map((m) => {
                const isSel = selectedMood === m.label;
                return (
                  <Pressable
                    key={m.label}
                    onPress={() => handleSelectMood(m.label)}
                    style={({ pressed }) => [
                      styles.moodBtn,
                      { backgroundColor: m.bg },
                      isSmallPhone && { paddingVertical: 8, borderRadius: 12 },
                      isTablet && { paddingVertical: 14, borderRadius: 16 },
                      isSel && styles.moodBtnActive,
                      pressed && { transform: [{ scale: 0.95 }] },
                    ]}
                  >
                    <Text style={{ fontSize: isSmallPhone ? 22 : isTablet ? 30 : 26 }}>{m.emoji}</Text>
                    <Text
                      style={[
                        styles.moodBtnText,
                        { color: m.color, fontSize: isSmallPhone ? 10 : isTablet ? 12.5 : 11 },
                        isSel && { fontWeight: "900" },
                      ]}
                      numberOfLines={1}
                    >
                      {wordLabel(m.label, lang)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 4. Doctor's Daily Therapy Target Card */}
          <Pressable
            onPress={() => {
              if (activeTherapyGoal.category === "speech") onTabChange("speak");
              else if (activeTherapyGoal.category === "occupational") onTabChange("schedule");
              else onTabChange("games");
            }}
            style={({ pressed }) => [styles.therapyBanner, pressed && { transform: [{ scale: 0.99 }] }]}
          >
            <View style={styles.therapyBannerHeader}>
              <View style={styles.therapyBadgeWrap}>
                <Ionicons name="flag" size={13} color="white" />
                <Text style={styles.therapyBadgeText}>{t("therapyTargetBadge", lang)}</Text>
              </View>
              <View style={styles.therapyStarReward}>
                <Text style={{ fontSize: 12 }}>⭐</Text>
                <Text style={styles.therapyStarText}>+5 {t("stars", lang)}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 }}>
              <View style={styles.therapyIconCircle}>
                <Text style={{ fontSize: 24 }}>
                  {activeTherapyGoal.category === "speech" ? "🗣️" : activeTherapyGoal.category === "sensory" ? "🌿" : "📅"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.therapyTitle}>{activeTherapyGoal.title}</Text>
                <Text style={styles.therapySub}>
                  {activeTherapyGoal.prescribedBy || t("doctorsPlan", lang)} · {t("tapToPracticeNow", lang)}
                </Text>
              </View>
              {activeTherapyGoal.completed && (
                <View style={styles.therapyCheckCircle}>
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
              )}
            </View>

            {/* Progress Bar */}
            <View style={styles.therapyProgressTrack}>
              <View
                style={[
                  styles.therapyProgressFill,
                  {
                    width: `${therapyProgressPct}%`,
                    backgroundColor: activeTherapyGoal.completed ? colors.greenDeep : colors.forest,
                  },
                ]}
              />
            </View>
            <View style={styles.therapyProgressTextRow}>
              <Text style={styles.therapyProgressNum}>
                {activeTherapyGoal.currentCount} / {activeTherapyGoal.targetCount} {activeTherapyGoal.unit}
              </Text>
              <Text style={styles.therapyActionHint}>
                {activeTherapyGoal.completed ? t("completedToday", lang) : t("startExercise", lang)} →
              </Text>
            </View>
          </Pressable>

          {/* 5. Four Primary Navigation Tiles */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
            <Text style={styles.sectionTitle}>{t("quickAccess", lang)}</Text>
            <Text style={{ fontSize: 12, color: colors.textMid, fontWeight: "600" }}>Tap to open</Text>
          </View>
          <View style={styles.quickGrid}>
            {QUICK_ACCESS.map((q) => (
              <Pressable
                key={q.labelKey}
                onPress={() => q.go(props)}
                style={({ pressed }) => [
                  styles.quickTile,
                  isTablet && styles.quickTileTablet,
                  { backgroundColor: q.bg },
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
              >
                <View style={styles.quickIconBadge}>
                  <Ionicons name={q.icon} size={isTablet ? 26 : 22} color={q.iconColor} />
                </View>
                <Text style={[styles.quickLabel, isTablet && { fontSize: 16 }]}>{t(q.labelKey, lang)}</Text>
                <Text style={styles.quickDesc} numberOfLines={2}>{q.desc}</Text>
              </Pressable>
            ))}
          </View>

          {/* 6. Today's Routine Highlights */}
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="calendar-outline" size={16} color={colors.forest} />
              <Text style={styles.sectionTitle}>{t("todaySchedule", lang)}</Text>
            </View>
            <Pressable
              onPress={() => {
                tapFeedback();
                onTabChange("schedule");
              }}
              style={styles.seeAllBtn}
              hitSlop={8}
            >
              <Text style={styles.seeAllText}>{t("viewFullSchedule", lang)}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.forest} />
            </Pressable>
          </View>

          <View style={[styles.scheduleContainer, isTablet && styles.scheduleContainerTablet]}>
            {scheduleItems.map((item, i) => (
              <Pressable
                key={i}
                onPress={() => handleOpenScheduleItem(item)}
                style={({ pressed }) => [
                  styles.scheduleRow,
                  isTablet && styles.scheduleRowTablet,
                  item.state === "now"
                    ? styles.scheduleRowNow
                    : { backgroundColor: item.state === "done" ? colors.cardMuted : colors.card },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                ]}
              >
                <View style={[styles.scheduleIcon, { backgroundColor: item.color }]}>
                  <Text style={{ fontSize: isTablet ? 22 : 18 }}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.scheduleLabel,
                      isTablet && { fontSize: 16 },
                      item.state === "done" && { textDecorationLine: "line-through", color: colors.textLight },
                    ]}
                  >
                    {t(item.labelKey, lang)}
                  </Text>
                  <Text style={styles.scheduleTime}>{item.time}</Text>
                </View>

                {/* Status indicator / interactive checkmark */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleScheduleItem(i);
                  }}
                  hitSlop={8}
                >
                  {item.state === "done" ? (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={14} color="white" />
                    </View>
                  ) : item.state === "now" ? (
                    <View style={styles.nowBadge}>
                      <Text style={styles.nowBadgeText}>{t("happeningNow", lang).toUpperCase()}</Text>
                    </View>
                  ) : (
                    <View style={styles.upcomingBadge}>
                      <Ionicons name="ellipse-outline" size={22} color={colors.textLight} />
                    </View>
                  )}
                </Pressable>
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
  greeting: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },
  name: { color: "white", fontSize: 22, fontWeight: "900", marginTop: 2 },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  starBadgeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  starBadgeHeaderText: { color: "white", fontSize: 13, fontWeight: "800" },

  body: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 28, gap: 14 },
  bodyTablet: { maxWidth: 860, alignSelf: "center", width: "100%", paddingHorizontal: 28 },

  /* Urgent Needs Express Bar */
  urgentSection: {
    backgroundColor: "#ffffff",
    borderRadius: radiusLg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  urgentGrid: { flexDirection: "row", gap: 8 },
  urgentTile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 14,
    gap: 4,
  },
  urgentTileLabel: { fontWeight: "800" },

  /* Emotional Mood Check-In */
  moodSection: {
    backgroundColor: "#ffffff",
    borderRadius: radiusLg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeadingSmall: { fontSize: 12, fontWeight: "800", color: "#64748b", letterSpacing: 0.5 },
  selectedMoodTag: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  selectedMoodTagText: { fontSize: 11, fontWeight: "700", color: "#166534" },
  moodRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  moodBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
    gap: 4,
  },
  moodBtnActive: { borderColor: colors.forest, backgroundColor: "#ffffff" },
  moodBtnText: { fontSize: 11, fontWeight: "700" },

  /* Doctor Therapy Target Card */
  therapyBanner: {
    backgroundColor: "white",
    borderRadius: radiusLg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  therapyBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  therapyBadgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.forest,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  therapyBadgeText: { color: "white", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  therapyStarReward: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  therapyStarText: { color: "#b45309", fontSize: 11, fontWeight: "800" },
  therapyIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  therapyTitle: { fontSize: 15.5, fontWeight: "800", color: "#0f172a" },
  therapySub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  therapyCheckCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.greenDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  therapyProgressTrack: {
    height: 9,
    backgroundColor: "#f1f5f9",
    borderRadius: 5,
    overflow: "hidden",
    marginTop: 6,
  },
  therapyProgressFill: {
    height: "100%",
    borderRadius: 5,
  },
  therapyProgressTextRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  therapyProgressNum: { fontSize: 12, color: "#64748b", fontWeight: "700" },
  therapyActionHint: { fontSize: 12, fontWeight: "800", color: colors.forest },

  /* 4 Quick Tiles Grid */
  sectionTitle: { fontSize: 13, fontWeight: "800", color: colors.textDark, letterSpacing: 0.5 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 4 },
  quickTile: {
    width: "48%",
    borderRadius: radiusLg,
    paddingVertical: 18,
    paddingHorizontal: 14,
    gap: 6,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.04)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  quickTileTablet: {
    width: "23.4%",
    paddingVertical: 20,
    paddingHorizontal: 14,
  },
  quickIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  quickLabel: { fontSize: 14.5, fontWeight: "800", color: colors.textDark },
  quickDesc: { fontSize: 11, color: colors.textMid, lineHeight: 15 },

  /* Schedule section */
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 2,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  seeAllText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.forest,
  },
  scheduleContainer: { gap: 10 },
  scheduleContainerTablet: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: radiusLg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  scheduleRowTablet: {
    width: "48.8%",
  },
  scheduleRowNow: { backgroundColor: colors.card, borderColor: colors.forest, borderWidth: 2 },
  scheduleIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  scheduleLabel: { fontSize: 15, fontWeight: "700", color: colors.textDark },
  scheduleTime: { fontSize: 12.5, color: colors.textLight, marginTop: 2 },
  checkBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.greenDeep, alignItems: "center", justifyContent: "center" },
  nowBadge: { backgroundColor: colors.forest, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  nowBadgeText: { color: "white", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  upcomingBadge: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
});
