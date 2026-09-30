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

  function handleHeroAudioIntro() {
    tapFeedback();
    const personalizedIntro = `${greeting} ${child.name}! ${t("heroSpeechPrompt", lang)}`;
    speak(personalizedIntro, lang, settings.soundEnabled);
  }

  function handleMascotTap() {
    tapFeedback();
    const prompt = `${t("heroMascotSay", lang).replace("💬", "").trim()}! ${greeting} ${child.name}!`;
    speak(prompt, lang, settings.soundEnabled);
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
          {/* 🌟 HERO SHOWCASE SECTION (Pediatric AAC Voice Companion) */}
          <View style={styles.heroCard}>
            {/* Ambient decorative backdrop discs for premium visual depth */}
            <View style={styles.heroDecorCircle1} pointerEvents="none" />
            <View style={styles.heroDecorCircle2} pointerEvents="none" />

            {/* Top Tag & Audio Speaker Row */}
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{t("heroBadge", lang)}</Text>
              </View>
              <Pressable
                onPress={handleHeroAudioIntro}
                style={({ pressed }) => [styles.heroAudioBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.94 }] }]}
                accessibilityLabel="Listen to voice welcome"
              >
                <Ionicons name="volume-high" size={17} color="#ffffff" />
              </Pressable>
            </View>

            {/* Headline & App Purpose */}
            <Text style={styles.heroHeadline}>
              {t("heroHeadline", lang)}
            </Text>
            <Text style={styles.heroSubhead}>
              {t("heroSubhead", lang)}
            </Text>

            {/* Interactive Mascot Companion & Live Progress Chips */}
            <View style={styles.heroMascotRow}>
              <Pressable
                onPress={handleMascotTap}
                style={({ pressed }) => [styles.heroMascotWrap, pressed && { transform: [{ scale: 0.96 }] }]}
                accessibilityLabel="Tap mascot companion"
              >
                <View style={styles.heroMascotBubble}>
                  <Text style={styles.heroMascotBubbleText}>{t("heroMascotSay", lang)}</Text>
                </View>
                <Mascot mood="happy" size={54} animate={!settings.reduceMotion} />
              </Pressable>

              <View style={styles.heroStatsCol}>
                <View style={styles.heroStatChip}>
                  <Text style={{ fontSize: 13 }}>💬</Text>
                  <Text style={styles.heroStatNum}>{weekWords}</Text>
                  <Text style={styles.heroStatLabel} numberOfLines={1}>{t("heroWordsCount", lang)}</Text>
                </View>
                <View style={styles.heroStatChip}>
                  <Text style={{ fontSize: 13 }}>⭐</Text>
                  <Text style={styles.heroStatNum}>{child.stars ?? 0}</Text>
                  <Text style={styles.heroStatLabel} numberOfLines={1}>{t("heroStarsCount", lang)}</Text>
                </View>
                <View style={styles.heroStatChip}>
                  <Text style={{ fontSize: 13 }}>🎯</Text>
                  <Text style={styles.heroStatNum}>{therapyProgressPct}%</Text>
                  <Text style={styles.heroStatLabel} numberOfLines={1}>{t("heroDailyGoal", lang)}</Text>
                </View>
              </View>
            </View>

            {/* Primary & Secondary Action CTAs */}
            <View style={styles.heroActionsRow}>
              <Pressable
                onPress={() => {
                  tapFeedback();
                  onTabChange("speak");
                }}
                style={({ pressed }) => [styles.heroPrimaryBtn, pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 }]}
                accessibilityLabel="Open Talking Board"
              >
                <Ionicons name="chatbubbles" size={17} color={colors.forestDark} />
                <Text style={styles.heroPrimaryBtnText}>{t("heroOpenBoard", lang)}</Text>
                <Ionicons name="arrow-forward" size={15} color={colors.forestDark} />
              </Pressable>

              <Pressable
                onPress={() => {
                  tapFeedback();
                  onTabChange("schedule");
                }}
                style={({ pressed }) => [styles.heroSecondaryBtn, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]}
                accessibilityLabel="Open Daily Schedule"
              >
                <Ionicons name="calendar-outline" size={16} color="#ffffff" />
                <Text style={styles.heroSecondaryBtnText}>{t("heroOpenSchedule", lang)}</Text>
              </Pressable>
            </View>
          </View>

          {/* 2. Urgent Needs Express Communication Bar */}
          <View style={styles.urgentSection}>
            <View style={styles.urgentSectionHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                <View style={styles.urgentHeaderDot} />
                <Ionicons name="flash" size={15} color={colors.forest} />
                <Text style={styles.sectionHeadingSmall}>{t("quickExpressHeading", lang)}</Text>
              </View>
              <View style={styles.urgentBadgeMicro}>
                <Ionicons name="volume-medium-outline" size={12} color={colors.textMid} />
                <Text style={styles.urgentBadgeMicroText}>{t("quickExpressSub", lang)}</Text>
              </View>
            </View>
            <View style={[styles.urgentGrid, isSmallPhone && { gap: 6 }, isTablet && { gap: 12 }]}>
              {[
                { label: "Help", phraseKey: "needHelpPhrase" as TKey, emoji: "🆘", color: "#FFF1F2", borderColor: "#FECDD3", textColor: "#BE123C" },
                { label: "Water", phraseKey: "needWaterPhrase" as TKey, emoji: "💧", color: "#F0F9FF", borderColor: "#BAE6FD", textColor: "#0369A1" },
                { label: "Bathroom", phraseKey: "needBathroomPhrase" as TKey, emoji: "🚻", color: "#FEFCE8", borderColor: "#FEF08A", textColor: "#A16207" },
                { label: "Stop", phraseKey: "pleaseStopPhrase" as TKey, emoji: "🛑", color: "#FFF7ED", borderColor: "#FED7AA", textColor: "#C2410C" },
              ].map((u) => (
                <Pressable
                  key={u.label}
                  onPress={() => handleUrgentNeed(u.phraseKey)}
                  style={({ pressed }) => [
                    styles.urgentTile,
                    { backgroundColor: u.color, borderColor: u.borderColor },
                    isSmallPhone && { paddingVertical: 10, borderRadius: 14 },
                    isTablet && { paddingVertical: 18, borderRadius: 20 },
                    pressed && { transform: [{ scale: 0.94 }], opacity: 0.9 },
                  ]}
                  accessibilityLabel={`Express ${u.label}`}
                >
                  <View style={styles.urgentTileIconWrap}>
                    <Text style={{ fontSize: isSmallPhone ? 22 : isTablet ? 30 : 25 }}>{u.emoji}</Text>
                  </View>
                  <Text
                    style={[
                      styles.urgentTileLabel,
                      { color: u.textColor, fontSize: isSmallPhone ? 11.5 : isTablet ? 14 : 12 },
                    ]}
                    numberOfLines={1}
                  >
                    {u.label === "Bathroom" ? t("bathroom", lang) : wordLabel(u.label, lang)}
                  </Text>
                  <View style={[styles.urgentTileWaveBadge, { backgroundColor: u.borderColor }]}>
                    <Ionicons name="volume-high" size={9} color={u.textColor} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 3. Emotional Mood Check-In Widget */}
          <View style={styles.moodSection}>
            <View style={styles.moodHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                <Ionicons name="heart" size={15} color="#ec4899" />
                <Text style={styles.sectionHeadingSmall}>{t("moodQuestion", lang)}</Text>
              </View>
              {selectedMood ? (
                <View style={styles.selectedMoodTag}>
                  <Ionicons name="checkmark-circle" size={12} color="#166534" />
                  <Text style={styles.selectedMoodTagText}>
                    {t("feelingTag", lang)} {wordLabel(selectedMood, lang)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.moodHintText}>Tap to share</Text>
              )}
            </View>
            <View style={[styles.moodRow, isSmallPhone && { gap: 4 }, isTablet && { gap: 12 }]}>
              {[
                { label: "Happy", emoji: "😃", bg: "#f0fdf4", border: "#bbf7d0", color: "#166534" },
                { label: "Calm", emoji: "😌", bg: "#f0f9ff", border: "#bae6fd", color: "#0369a1" },
                { label: "Excited", emoji: "🤩", bg: "#fefce8", border: "#fef08a", color: "#b45309" },
                { label: "Sad", emoji: "😢", bg: "#faf5ff", border: "#e9d5ff", color: "#6b21a8" },
                { label: "Tired", emoji: "😴", bg: "#f8fafc", border: "#e2e8f0", color: "#475569" },
              ].map((m) => {
                const isSel = selectedMood === m.label;
                return (
                  <Pressable
                    key={m.label}
                    onPress={() => handleSelectMood(m.label)}
                    style={({ pressed }) => [
                      styles.moodBtn,
                      { backgroundColor: m.bg, borderColor: isSel ? colors.forest : m.border },
                      isSmallPhone && { paddingVertical: 9, borderRadius: 14 },
                      isTablet && { paddingVertical: 16, borderRadius: 18 },
                      isSel && styles.moodBtnActive,
                      pressed && { transform: [{ scale: 0.94 }] },
                    ]}
                  >
                    {isSel && (
                      <View style={styles.moodActiveDot}>
                        <Ionicons name="checkmark" size={9} color="#ffffff" />
                      </View>
                    )}
                    <Text style={{ fontSize: isSmallPhone ? 22 : isTablet ? 30 : 25 }}>{m.emoji}</Text>
                    <Text
                      style={[
                        styles.moodBtnText,
                        { color: isSel ? colors.forestDark : m.color, fontSize: isSmallPhone ? 10.5 : isTablet ? 13 : 11.5 },
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
              tapFeedback();
              if (activeTherapyGoal.category === "speech") onTabChange("speak");
              else if (activeTherapyGoal.category === "occupational") onTabChange("schedule");
              else onTabChange("games");
            }}
            style={({ pressed }) => [styles.therapyBanner, pressed && { transform: [{ scale: 0.99 }], opacity: 0.95 }]}
          >
            <View style={styles.therapyBannerHeader}>
              <View style={styles.therapyBadgeWrap}>
                <Ionicons name="medkit-outline" size={12} color="#ffffff" />
                <Text style={styles.therapyBadgeText}>{t("therapyTargetBadge", lang)}</Text>
              </View>
              <View style={styles.therapyStarReward}>
                <Text style={{ fontSize: 13 }}>⭐</Text>
                <Text style={styles.therapyStarText}>+5 {t("stars", lang)}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 }}>
              <View style={styles.therapyIconCircle}>
                <Text style={{ fontSize: 26 }}>
                  {activeTherapyGoal.category === "speech" ? "🗣️" : activeTherapyGoal.category === "sensory" ? "🌿" : "📅"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.therapyTitle}>{activeTherapyGoal.title}</Text>
                <Text style={styles.therapySub}>
                  {activeTherapyGoal.prescribedBy || t("doctorsPlan", lang)} · {t("tapToPracticeNow", lang)}
                </Text>
              </View>
              {activeTherapyGoal.completed ? (
                <View style={styles.therapyCheckCircle}>
                  <Ionicons name="checkmark-sharp" size={16} color="white" />
                </View>
              ) : (
                <View style={styles.therapyArrowCircle}>
                  <Ionicons name="chevron-forward" size={16} color={colors.forest} />
                </View>
              )}
            </View>

            {/* Progress Bar with modern sleek track */}
            <View style={styles.therapyProgressContainer}>
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
            </View>

            <View style={styles.therapyProgressTextRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.therapyProgressNum}>
                  {activeTherapyGoal.currentCount} / {activeTherapyGoal.targetCount} {activeTherapyGoal.unit}
                </Text>
                <Text style={styles.therapyPercentPill}>
                  {therapyProgressPct}%
                </Text>
              </View>
              <Text style={[styles.therapyActionHint, activeTherapyGoal.completed && { color: colors.greenDeep }]}>
                {activeTherapyGoal.completed ? t("completedToday", lang) : t("startExercise", lang)}
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
                <Text style={{ fontSize: 26 }}>📖</Text>
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

  /* ========================================================
     1. HERO SHOWCASE SECTION (20-Year UX Master Polish)
     ======================================================== */
  heroCard: {
    backgroundColor: colors.forestDark,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    gap: 12,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#0f281e",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  heroDecorCircle1: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  heroDecorCircle2: {
    position: "absolute",
    bottom: -30,
    left: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(201, 154, 46, 0.12)",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  heroBadgeText: {
    color: "#a7f3d0",
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  heroAudioBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  heroHeadline: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  heroSubhead: {
    color: "rgba(255, 255, 255, 0.88)",
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "500",
  },
  heroMascotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.12)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 2,
    gap: 12,
  },
  heroMascotWrap: {
    alignItems: "center",
    position: "relative",
  },
  heroMascotBubble: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  heroMascotBubbleText: {
    color: colors.forestDark,
    fontSize: 10,
    fontWeight: "900",
  },
  heroStatsCol: {
    flex: 1,
    gap: 6,
  },
  heroStatChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 7,
  },
  heroStatNum: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 12.5,
  },
  heroStatLabel: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
  heroActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  heroPrimaryBtn: {
    flex: 1.4,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroPrimaryBtnText: {
    color: colors.forestDark,
    fontSize: 13,
    fontWeight: "900",
  },
  heroSecondaryBtn: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  heroSecondaryBtnText: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "800",
  },

  /* ========================================================
     2. URGENT EXPRESS COMMUNICATION (Tactile Squircles)
     ======================================================== */
  urgentSection: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#e8edf2",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  urgentSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  urgentHeaderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.forest,
  },
  urgentBadgeMicro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  urgentBadgeMicroText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMid,
  },
  urgentGrid: { flexDirection: "row", gap: 8 },
  urgentTile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 4,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  urgentTileIconWrap: {
    marginBottom: 2,
  },
  urgentTileLabel: {
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  urgentTileWaveBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.75,
  },

  /* ========================================================
     3. EMOTIONAL MOOD CHECK-IN
     ======================================================== */
  moodSection: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#e8edf2",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  moodHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeadingSmall: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "#64748b",
    letterSpacing: 0.6,
  },
  selectedMoodTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  selectedMoodTagText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#166534",
  },
  moodHintText: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: "600",
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  moodBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 2,
    gap: 4,
    position: "relative",
  },
  moodBtnActive: {
    borderColor: colors.forest,
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  moodActiveDot: {
    position: "absolute",
    top: -5,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  moodBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },

  /* ========================================================
     4. DOCTOR THERAPY TARGET CARD
     ======================================================== */
  therapyBanner: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
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
    gap: 5,
    backgroundColor: colors.forest,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 9,
  },
  therapyBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  therapyStarReward: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  therapyStarText: {
    color: "#b45309",
    fontSize: 11,
    fontWeight: "900",
  },
  therapyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    alignItems: "center",
    justifyContent: "center",
  },
  therapyTitle: {
    fontSize: 15.5,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.2,
  },
  therapySub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  therapyCheckCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.greenDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  therapyArrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  therapyProgressContainer: {
    marginTop: 4,
  },
  therapyProgressTrack: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    overflow: "hidden",
  },
  therapyProgressFill: {
    height: "100%",
    borderRadius: 6,
  },
  therapyProgressTextRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  therapyProgressNum: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "800",
  },
  therapyPercentPill: {
    fontSize: 11,
    color: colors.forest,
    fontWeight: "900",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  therapyActionHint: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.forest,
  },

  /* 4 Quick Tiles Grid */
  sectionTitle: { fontSize: 13, fontWeight: "800", color: colors.textDark, letterSpacing: 0.5 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 4 },
  quickTile: {
    width: "48%",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 15,
    gap: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.75)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  quickTileTablet: {
    width: "23.4%",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  quickIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  quickLabel: { fontSize: 14.5, fontWeight: "900", color: colors.textDark, letterSpacing: -0.2 },
  quickDesc: { fontSize: 11, color: colors.textMid, lineHeight: 15.5 },

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
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "rgba(45,95,79,0.08)",
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.forest,
  },
  scheduleContainer: { gap: 10 },
  scheduleContainerTablet: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#e8edf2",
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  scheduleRowTablet: {
    width: "48.8%",
  },
  scheduleRowNow: { backgroundColor: colors.card, borderColor: colors.forest, borderWidth: 2 },
  scheduleIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  scheduleLabel: { fontSize: 14.5, fontWeight: "800", color: colors.textDark },
  scheduleTime: { fontSize: 12, color: colors.textLight, marginTop: 2, fontWeight: "600" },
  checkBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.greenDeep, alignItems: "center", justifyContent: "center" },
  nowBadge: { backgroundColor: colors.forest, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  nowBadgeText: { color: "white", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
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
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#fed7aa",
    padding: 16,
    marginTop: 6,
    marginBottom: 6,
    shadowColor: "#c98a3d",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
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
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    alignItems: "center",
    justifyContent: "center",
  },
  socialStoryTitle: {
    fontSize: 15.5,
    fontWeight: "900",
    color: colors.textDark,
  },
  socialStorySub: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: 2,
    lineHeight: 16.5,
  },
  socialStoryArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  newBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#b45309",
    letterSpacing: 0.5,
  },
});
