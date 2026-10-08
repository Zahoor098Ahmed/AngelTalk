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
import MoodFace from "../components/MoodFace";
import UrgentActionIcon from "../components/UrgentActionIcon";

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

type SchedulePreviewItem = {
  iconName: keyof typeof Ionicons.glyphMap;
  labelKey: TKey;
  time: string;
  state: "done" | "now" | "upcoming";
  color: string;
  iconColor: string;
};

const TODAY_PREVIEW: SchedulePreviewItem[] = [
  { iconName: "cafe", labelKey: "sBreakfast", time: "08:00", state: "done", color: "#fef3c7", iconColor: "#b45309" },
  { iconName: "extension-puzzle", labelKey: "sPlayTime", time: "09:00", state: "done", color: "#dcfce7", iconColor: "#15803d" },
  { iconName: "chatbubbles", labelKey: "sAacSession", time: "10:30", state: "now", color: "#e0f2fe", iconColor: "#0284c7" },
  { iconName: "restaurant", labelKey: "sLunch", time: "12:00", state: "upcoming", color: "#ffedd5", iconColor: "#c2410c" },
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
          {/* 2. Urgent Needs Express Communication Bar */}
          <View style={styles.urgentSection}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="flash" size={15} color={colors.forest} />
              <Text style={styles.sectionHeadingSmall}>{t("quickExpressHeading", lang)}</Text>
            </View>
            <View style={[styles.urgentGrid, isSmallPhone && { gap: 6 }, isTablet && { gap: 12 }]}>
              {[
                { label: "Help", phraseKey: "needHelpPhrase" as TKey, type: "help" as const, color: "#fef2f2", borderColor: "#fecaca", textColor: "#b91c1c" },
                { label: "Water", phraseKey: "needWaterPhrase" as TKey, type: "water" as const, color: "#f0f9ff", borderColor: "#bae6fd", textColor: "#0369a1" },
                { label: "Bathroom", phraseKey: "needBathroomPhrase" as TKey, type: "bathroom" as const, color: "#fefce8", borderColor: "#fde68a", textColor: "#b45309" },
                { label: "Stop", phraseKey: "pleaseStopPhrase" as TKey, type: "stop" as const, color: "#fff7ed", borderColor: "#fed7aa", textColor: "#c2410c" },
              ].map((u) => (
                <Pressable
                  key={u.label}
                  onPress={() => handleUrgentNeed(u.phraseKey)}
                  style={({ pressed }) => [
                    styles.urgentTile,
                    { backgroundColor: u.color, borderColor: u.borderColor },
                    isSmallPhone && { paddingVertical: 10, borderRadius: 14 },
                    isTablet && { paddingVertical: 16, borderRadius: 18 },
                    pressed && { transform: [{ scale: 0.96 }] },
                  ]}
                  accessibilityLabel={`Express ${u.label}`}
                >
                  <View style={styles.urgentIconCircle}>
                    <UrgentActionIcon type={u.type} size={isSmallPhone ? 30 : isTablet ? 40 : 34} />
                  </View>
                  <Text
                    style={[
                      styles.urgentTileLabel,
                      { color: u.textColor, fontSize: isSmallPhone ? 12.5 : isTablet ? 15.5 : 14 },
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
                  <Ionicons name="checkmark-circle" size={13} color="#166534" />
                  <Text style={styles.selectedMoodTagText}>
                    {t("feelingTag", lang)} {wordLabel(selectedMood, lang)}
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.moodRow, isSmallPhone && { gap: 4 }, isTablet && { gap: 12 }]}>
              {[
                { label: "Happy", mood: "Happy" as const, bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d" },
                { label: "Calm", mood: "Calm" as const, bg: "#f0f9ff", border: "#bae6fd", color: "#0369a1" },
                { label: "Excited", mood: "Excited" as const, bg: "#fefce8", border: "#fef08a", color: "#b45309" },
                { label: "Sad", mood: "Sad" as const, bg: "#faf5ff", border: "#e9d5ff", color: "#6b21a8" },
                { label: "Tired", mood: "Tired" as const, bg: "#f8fafc", border: "#e2e8f0", color: "#475569" },
              ].map((m) => {
                const isSel = selectedMood === m.label;
                return (
                  <Pressable
                    key={m.label}
                    onPress={() => handleSelectMood(m.label)}
                    style={({ pressed }) => [
                      styles.moodBtn,
                      { backgroundColor: m.bg, borderColor: isSel ? colors.forest : m.border },
                      isSmallPhone && { paddingVertical: 8, borderRadius: 14 },
                      isTablet && { paddingVertical: 14, borderRadius: 18 },
                      isSel && styles.moodBtnActive,
                      pressed && { transform: [{ scale: 0.95 }] },
                    ]}
                  >
                    <MoodFace mood={m.mood} size={isSmallPhone ? 38 : isTablet ? 52 : 46} />
                    <Text
                      style={[
                        styles.moodBtnText,
                        { color: m.color, fontSize: isSmallPhone ? 11.5 : isTablet ? 14.5 : 13 },
                        isSel && { fontWeight: "900", color: colors.forest },
                      ]}
                      numberOfLines={1}
                    >
                      {wordLabel(m.label, lang)}
                    </Text>
                    {isSel && <View style={styles.moodSelectedDot} />}
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
                <Ionicons name="ribbon-outline" size={13} color="white" />
                <Text style={styles.therapyBadgeText}>{t("therapyTargetBadge", lang)}</Text>
              </View>
              <View style={styles.therapyStarReward}>
                <Ionicons name="star" size={12} color="#b45309" />
                <Text style={styles.therapyStarText}>+5 {t("stars", lang)}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 }}>
              <View
                style={[
                  styles.therapyIconCircle,
                  {
                    backgroundColor:
                      activeTherapyGoal.category === "speech"
                        ? "#eff6ff"
                        : activeTherapyGoal.category === "sensory"
                        ? "#f0fdf4"
                        : "#fefce8",
                  },
                ]}
              >
                <Ionicons
                  name={
                    activeTherapyGoal.category === "speech"
                      ? "chatbubbles"
                      : activeTherapyGoal.category === "sensory"
                      ? "leaf"
                      : "calendar"
                  }
                  size={24}
                  color={
                    activeTherapyGoal.category === "speech"
                      ? "#2563eb"
                      : activeTherapyGoal.category === "sensory"
                      ? "#16a34a"
                      : "#ca8a04"
                  }
                />
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
                  <Ionicons name={q.icon} size={isTablet ? 34 : 30} color={q.iconColor} />
                </View>
                <Text style={[styles.quickLabel, isTablet && { fontSize: 16 }]}>{t(q.labelKey, lang)}</Text>
                <Text style={styles.quickDesc} numberOfLines={2}>{q.desc}</Text>
              </Pressable>
            ))}
          </View>

          {/* Visual Social Stories Banner (Tala Feature) */}
          <Pressable
            onPress={() => {
              tapFeedback();
              if (props.onOpenSocialStories) props.onOpenSocialStories();
              else onOpenMore();
            }}
            style={({ pressed }) => [styles.socialStoryBanner, pressed && { transform: [{ scale: 0.99 }] }]}
          >
            <View style={styles.socialStoryLeft}>
              <View style={styles.socialStoryIconCircle}>
                <Ionicons name="book" size={24} color="#0d9488" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.socialStoryTitle}>Visual Social Stories</Text>
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>TALA FEATURE</Text>
                  </View>
                </View>
                <Text style={styles.socialStorySub}>
                  Dentist visit, haircut, school routines & calming guides with read-aloud voice.
                </Text>
              </View>
            </View>
            <View style={styles.socialStoryArrow}>
              <Ionicons name="arrow-forward" size={18} color={colors.forest} />
            </View>
          </Pressable>

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
                  <Ionicons name={item.iconName} size={isTablet ? 22 : 18} color={item.iconColor} />
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
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  urgentIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  selectedMoodTagText: { fontSize: 11, fontWeight: "700", color: "#166534" },
  moodRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  moodBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  moodBtnActive: {
    borderColor: colors.forest,
    borderWidth: 2,
    backgroundColor: "#ffffff",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  moodSelectedDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.forest,
  },
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
    width: 58,
    height: 58,
    borderRadius: 29,
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
  socialStoryBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: radiusLg,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    padding: 16,
    marginTop: 6,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  socialStoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  socialStoryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
  },
  socialStoryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textDark,
  },
  socialStorySub: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: 2,
    lineHeight: 16,
  },
  socialStoryArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#f0f7f4",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  newBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#b45309",
    letterSpacing: 0.5,
  },
});
