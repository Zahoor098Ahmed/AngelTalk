import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Share,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { ChildProfile, TabScreen, CareLogEntry, TherapyGoal } from "../types";
import { DIAGNOSIS_LABELS } from "../types";
import {
  getUsage,
  updateChild,
  addCareLog,
  deleteCareLog,
  incrementTherapyGoal,
} from "../modules/storage";
import { useSettings } from "../context/SettingsContext";
import { useResponsive } from "../modules/responsive";
import { t, diagnosisLabel, type TKey } from "../modules/i18n";
import LangBadge from "../components/LangBadge";
import TabBar from "../components/TabBar";
import EmergencyPasscardModal from "../components/EmergencyPasscardModal";
import SensoryCalmerModal from "../components/SensoryCalmerModal";
import MoodFace, { type MoodType } from "../components/MoodFace";
import { tapFeedback } from "../modules/haptics";
import { colors, radius } from "../theme";

interface Props {
  child: ChildProfile;
  tab: TabScreen;
  onTabChange: (tab: TabScreen) => void;
  onUpdateChild: (child: ChildProfile) => void;
  onNavigateAdmin?: () => void;
  labels: Record<TabScreen, string>;
}

type SubTab = "overview" | "therapy" | "journal" | "passcard" | "vocabulary" | "schedule" | "privacy";

const SUB_TABS: { key: SubTab; labelKey: TKey; icon: string }[] = [
  { key: "overview", labelKey: "tabOverview", icon: "stats-chart" },
  { key: "therapy", labelKey: "tabTherapyGoals", icon: "flag" },
  { key: "journal", labelKey: "tabCareJournal", icon: "journal" },
  { key: "passcard", labelKey: "tabPasscard", icon: "card" },
  { key: "vocabulary", labelKey: "tabVocabulary", icon: "chatbubble-ellipses" },
  { key: "schedule", labelKey: "tabSchedule", icon: "calendar" },
  { key: "privacy", labelKey: "tabPrivacy", icon: "shield-checkmark" },
];

const DAY_LETTER_KEYS: TKey[] = ["dayLetterM", "dayLetterT", "dayLetterW", "dayLetterT", "dayLetterF", "dayLetterS", "dayLetterS"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
const DAY_NAME_KEYS: TKey[] = ["dayMon", "dayTue", "dayWed", "dayThu", "dayFri", "daySat", "daySun"];

const MOODS: { key: CareLogEntry["mood"]; label: string; moodType: MoodType; color: string }[] = [
  { key: "happy", label: "Happy", moodType: "Happy", color: "#10b981" },
  { key: "calm", label: "Calm", moodType: "Calm", color: "#06b6d4" },
  { key: "frustrated", label: "Frustrated", moodType: "Sad", color: "#f59e0b" },
  { key: "overwhelmed", label: "Overwhelmed", moodType: "Sad", color: "#ef4444" },
  { key: "tired", label: "Tired", moodType: "Tired", color: "#8b5cf6" },
];

function adherenceColor(percent: number): string {
  if (percent >= 80) return colors.greenDeep;
  if (percent >= 60) return colors.yellowDeep;
  return colors.orangeDeep;
}

export default function ParentDashboardScreen({
  child,
  tab,
  onTabChange,
  onUpdateChild,
  onNavigateAdmin,
  labels,
}: Props) {
  const { settings } = useSettings();
  const { isSmallPhone, isTablet, isLargeTablet } = useResponsive();
  const lang = settings.language;
  const tt = (k: TKey) => t(k, lang);
  const dayName = (idx: number) => tt(DAY_NAME_KEYS[idx]);
  const dayLetter = (idx: number) => tt(DAY_LETTER_KEYS[idx]);
  const [subTab, setSubTab] = useState<SubTab>("overview");
  const [passcardModalOpen, setPasscardModalOpen] = useState(false);
  const [sensoryModalOpen, setSensoryModalOpen] = useState(false);
  const [journalModalOpen, setJournalModalOpen] = useState(false);

  // Journal form state
  const [logMood, setLogMood] = useState<CareLogEntry["mood"]>("calm");
  const [logMeltdown, setLogMeltdown] = useState("");
  const [logTriggers, setLogTriggers] = useState("");
  const [logWins, setLogWins] = useState("");
  const [logNotes, setLogNotes] = useState("");

  const usage = useMemo(() => getUsage(child.id), [child.id]);

  const wordsThisWeek = usage.wordsByDay.reduce((s, v) => s + v, 0);
  const scheduleDays = DAY_ORDER.map((d) => usage.scheduleByDay[d]);
  const recordedDays = scheduleDays.filter((v) => v > 0);
  const avgAdherence = recordedDays.length
    ? Math.round(recordedDays.reduce((s, v) => s + v, 0) / recordedDays.length)
    : 0;
  const topWords = Object.entries(usage.wordTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  const maxWordCount = topWords.length ? topWords[0][1] : 1;
  const wordsChart = DAY_ORDER.map((d) => usage.wordsByDay[d]);
  const maxDayWords = Math.max(1, ...wordsChart);
  const totalWords = Object.values(usage.wordTotals).reduce((s, v) => s + v, 0);
  const uniqueWords = Object.keys(usage.wordTotals).length;
  const daysActive = Math.max(1, Math.round((Date.now() - child.enrolledAt) / 86400000));
  const bestDayIdx = wordsChart.indexOf(Math.max(...wordsChart));
  const todayDayIndex = DAY_ORDER.indexOf(new Date().getDay());

  const consecutiveDays = usage.consecutiveDays ?? usage.gameStreak ?? 0;
  const sentencesSpoken = usage.sentencesSpoken ?? 0;
  const correctionsUsed = usage.correctionsUsed ?? 0;
  const longestSentenceLength = usage.longestSentenceLength ?? 0;
  const longestSentenceWords = usage.longestSentenceWords ?? [];

  const therapyGoals = child.therapyGoals || [];
  const careLogs = child.careLogs || [];

  const statusChecks: { label: string; value: boolean; detail: string }[] = [
    { label: tt("checkBoardUsedOnce"), value: totalWords > 0, detail: tt("checkBoardUsedOnceDetail").replace("{n}", String(totalWords)) },
    { label: tt("checkVocabDiversity"), value: uniqueWords >= 10, detail: tt("checkVocabDiversityDetail").replace("{n}", String(uniqueWords)) },
    { label: tt("checkConsistentSchedule"), value: avgAdherence >= 80, detail: tt("checkConsistentScheduleDetail").replace("{pct}", String(avgAdherence)) },
    { label: tt("checkMultiDayUse"), value: recordedDays.length >= 3, detail: tt("checkMultiDayUseDetail").replace("{n}", String(recordedDays.length)) },
    { label: tt("checkCumulativeVocab"), value: totalWords >= 250, detail: tt("checkCumulativeVocabDetail").replace("{n}", String(totalWords)) },
  ];
  const checksPassed = statusChecks.filter((c) => c.value).length;

  const tips: string[] = [];
  if (wordsThisWeek < 10) tips.push(tt("pTip1"));
  if (avgAdherence < 60) tips.push(tt("pTip2"));
  if (uniqueWords > 0 && uniqueWords < 8) tips.push(tt("pTip3"));
  if (daysActive > 7 && wordsThisWeek === 0) tips.push(tt("tipNoWordsThisWeek"));
  if (tips.length === 0) tips.push(tt("tipProgressOnTrack"));

  function handlePracticeGoal(goal: TherapyGoal) {
    tapFeedback();
    incrementTherapyGoal(child.id, goal.id, 1);
    const updatedGoals = (child.therapyGoals || []).map((g) => {
      if (g.id !== goal.id) return g;
      const nextCount = Math.min(g.targetCount, g.currentCount + 1);
      return { ...g, currentCount: nextCount, completed: nextCount >= g.targetCount };
    });
    const updated = { ...child, therapyGoals: updatedGoals };
    onUpdateChild(updated);
  }

  function handleSaveCareLog() {
    if (!logMood) return;
    const newEntry: CareLogEntry = {
      id: "log_" + Date.now(),
      date: new Date().toISOString(),
      mood: logMood,
      meltdownDurationMin: logMeltdown ? parseInt(logMeltdown, 10) : undefined,
      sensoryTriggers: logTriggers ? logTriggers.split(",").map((s) => s.trim()).filter(Boolean) : [],
      communicationWins: logWins.trim() || undefined,
      notes: logNotes.trim() || undefined,
    };
    addCareLog(child.id, newEntry);
    onUpdateChild({ ...child, careLogs: [newEntry, ...careLogs] });
    setJournalModalOpen(false);
    setLogMeltdown("");
    setLogTriggers("");
    setLogWins("");
    setLogNotes("");
    Alert.alert("Care Log Saved", "Today's observation entry has been added to your journal.");
  }

  function handleDeleteCareLog(id: string) {
    Alert.alert("Delete Entry?", "Remove this journal entry from your history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteCareLog(child.id, id);
          onUpdateChild({ ...child, careLogs: careLogs.filter((l) => l.id !== id) });
        },
      },
    ]);
  }

  function handleShareProgressWithDoctor() {
    const report = `📋 BLOOMSPEECH PARENT & CLINICAL PROGRESS UPDATE
Child: ${child.name} (Age ${child.age})
Diagnoses: ${child.diagnoses.map((d) => DIAGNOSIS_LABELS[d] || d).join(", ")}
Date: ${new Date().toLocaleDateString()}

📊 AAC COMMUNICATION METRICS:
• Words Tapped This Week: ${wordsThisWeek}
• Cumulative Words: ${totalWords} (${uniqueWords} unique vocabulary words)
• Full Sentences Spoken: ${sentencesSpoken}
• Longest Sentence: ${longestSentenceLength > 0 ? `${longestSentenceLength} words (${longestSentenceWords.join(" ")})` : "None yet"}
• Weekly Routine Adherence: ${avgAdherence}%
• Top Words: ${topWords.map(([w, c]) => `${w} (${c})`).join(", ") || "None"}

🎯 PRESCRIBED THERAPY GOALS:
${
  therapyGoals.length > 0
    ? therapyGoals
        .map(
          (g) =>
            `• [${g.category.toUpperCase()}] ${g.title}: ${g.currentCount}/${g.targetCount} ${g.unit} (${g.completed ? "COMPLETED" : "In Progress"})`
        )
        .join("\n")
    : "No prescribed goals currently set."
}

📔 RECENT CAREGIVER JOURNAL ENTRIES:
${
  careLogs.length > 0
    ? careLogs
        .slice(0, 3)
        .map(
          (l) =>
            `• ${new Date(l.date).toLocaleDateString()}: Mood=${l.mood}${l.meltdownDurationMin ? `, Meltdown=${l.meltdownDurationMin}min` : ""}${l.communicationWins ? `, Wins: ${l.communicationWins}` : ""}`
        )
        .join("\n")
    : "No recent journal logs."
}

Sent via BloomSpeech AAC & Pediatric Support Portal.`;

    Share.share({ message: report, title: `${child.name}_Progress_Report.txt` });
  }

  function toggleFaceConsent(value: boolean) {
    if (!value) {
      Alert.alert("Turn off face recognition?", "This will erase the stored face data for this child.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Turn off",
          style: "destructive",
          onPress: () => {
            const updated = { ...child, faceConsent: false, embedding: [] };
            updateChild(updated);
            onUpdateChild(updated);
          },
        },
      ]);
    } else {
      const updated = { ...child, faceConsent: true };
      updateChild(updated);
      onUpdateChild(updated);
    }
  }

  function toggleGeneralConsent(value: boolean) {
    const updated = { ...child, generalConsent: value };
    updateChild(updated);
    onUpdateChild(updated);
  }

  function deleteFaceData() {
    Alert.alert("Delete face data?", "This cannot be undone. The child will need to be re-enrolled to use face recognition again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updated = { ...child, embedding: [], faceConsent: false };
          updateChild(updated);
          onUpdateChild(updated);
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.headerInner, isTablet && styles.headerInnerTablet]}>
            <Pressable onPress={() => onTabChange("home")} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.textDark} />
            </Pressable>
            <Text style={styles.headerTitle}>{tt("progress")}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {onNavigateAdmin && (
                <Pressable
                  onPress={onNavigateAdmin}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: "#0f172a",
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 8,
                  }}
                >
                  <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                  <Text style={{ color: "white", fontSize: 11, fontWeight: "800" }}>{tt("adminBadge")}</Text>
                </Pressable>
              )}
              <LangBadge />
            </View>
          </View>
        </View>

        {/* Child Profile Bar */}
        <View style={[styles.childRow, isTablet && styles.childRowTablet]}>
          <View style={styles.shield}>
            <Ionicons name="document-text-outline" size={18} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.childName}>{child.name}</Text>
            <Text style={styles.childSub}>
              {tt("ageYearsEnrolledDays").replace("{age}", String(child.age)).replace("{days}", String(daysActive))} · {child.stars || 0} ⭐
            </Text>
          </View>
        </View>

        {/* Diagnoses Chips */}
        <View style={[styles.diagRow, isTablet && styles.diagRowTablet]}>
          {child.diagnoses.map((d) => (
            <View key={d} style={styles.diagChip}>
              <Text style={styles.diagChipText}>{diagnosisLabel(d, DIAGNOSIS_LABELS[d], lang)}</Text>
            </View>
          ))}
        </View>

        {/* SubTabs Navigation Bar */}
        <View style={{ width: "100%", borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabs}>
            {SUB_TABS.map((s) => {
              const active = subTab === s.key;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => {
                    tapFeedback();
                    setSubTab(s.key);
                  }}
                  style={[styles.subTabBtn, active && styles.subTabBtnActive]}
                >
                  <Ionicons
                    name={s.icon as any}
                    size={15}
                    color={active ? colors.indigo : colors.textLight}
                  />
                  <Text style={[styles.subTabText, active && { color: colors.indigo, fontWeight: "800" }]}>
                    {tt(s.labelKey)}
                  </Text>
                  {active && <View style={styles.subTabUnderline} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={[styles.body, isTablet && styles.bodyTablet]} showsVerticalScrollIndicator={false}>
          {/* ================= 1. OVERVIEW SUBTAB ================= */}
          {subTab === "overview" && (
            <>
              {/* Quick Action Banners */}
              <View style={[styles.quickActionGrid, isTablet && styles.quickActionGridTablet]}>
                {/* Emergency Passcard */}
                <Pressable
                  onPress={() => setPasscardModalOpen(true)}
                  style={[styles.actionBanner, isTablet && styles.actionBannerTablet, { backgroundColor: "#fef2f2", borderColor: "#fecaca" }]}
                >
                  <View style={[styles.actionBannerIcon, { backgroundColor: "#ef4444" }]}>
                    <Ionicons name="card" size={18} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionBannerTitle, { color: "#991b1b" }]}>
                      {tt("caregiverPasscardTitle")}
                    </Text>
                    <Text style={styles.actionBannerSub}>{tt("caregiverPasscardSub")}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#991b1b" />
                </Pressable>

                {/* Sensory Calmer Toolkit */}
                <Pressable
                  onPress={() => setSensoryModalOpen(true)}
                  style={[styles.actionBanner, isTablet && styles.actionBannerTablet, { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" }]}
                >
                  <View style={[styles.actionBannerIcon, { backgroundColor: colors.forest }]}>
                    <Ionicons name="leaf" size={18} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionBannerTitle, { color: colors.forest }]}>
                      {tt("sensoryCalmerTitle")}
                    </Text>
                    <Text style={styles.actionBannerSub}>{tt("sensoryCalmerSub")}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.forest} />
                </Pressable>

                {/* Share with Doctor */}
                <Pressable
                  onPress={handleShareProgressWithDoctor}
                  style={[styles.actionBanner, isTablet && styles.actionBannerTablet, { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }]}
                >
                  <View style={[styles.actionBannerIcon, { backgroundColor: "#2563eb" }]}>
                    <Ionicons name="share-social" size={18} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionBannerTitle, { color: "#1e40af" }]}>
                      {tt("shareProgressTitle")}
                    </Text>
                    <Text style={styles.actionBannerSub}>{tt("shareProgressSub")}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#1e40af" />
                </Pressable>
              </View>

              {/* Clinical summary table */}
              <View style={styles.tableCard}>
                <Text style={styles.cardTitle}>{tt("summaryMetricsTitle")}</Text>
                <View style={styles.table}>
                  <TableRow label={tt("totalWordTaps")} value={`${totalWords}`} />
                  <TableRow label={tt("uniqueWordsUsed")} value={`${uniqueWords}`} />
                  <TableRow label={tt("wordsThisWeek")} value={`${wordsThisWeek}`} />
                  <TableRow
                    label={tt("mostActiveDay")}
                    value={wordsChart.some((v) => v > 0) ? dayName(bestDayIdx) : "—"}
                  />
                  <TableRow label={tt("consecutiveActiveDays")} value={`${consecutiveDays}`} />
                  <TableRow label={tt("fullSentencesSpoken")} value={`${sentencesSpoken}`} />
                  <TableRow label={tt("correctionsUndoUsed")} value={`${correctionsUsed}`} />
                  <TableRow
                    label={tt("longestSentence")}
                    value={longestSentenceLength > 0 ? `${longestSentenceLength} ${tt("wordsUnit")}` : "—"}
                  />
                  {longestSentenceWords.length > 0 && (
                    <TableRow
                      label={tt("wordSequenceLabel")}
                      value={`“${longestSentenceWords.join(" ")}”`}
                      mono={false}
                      secondary
                    />
                  )}
                  <TableRow label={tt("avgRoutineAdherence")} value={`${avgAdherence}%`} />
                </View>
              </View>

              {/* Daily usage bar chart */}
              <View style={styles.card}>
                <View style={styles.chartHeaderRow}>
                  <View>
                    <Text style={styles.cardTitle}>{tt("pDailyUsage")}</Text>
                    <Text style={styles.chartSubtitle}>{tt("wordsTappedPerDaySubtitle")}</Text>
                  </View>
                  <View style={styles.totalBadge}>
                    <Ionicons name="chatbubbles" size={13} color={colors.forest} />
                    <Text style={styles.totalBadgeText}>{tt("wordsCountBadge").replace("{n}", String(wordsThisWeek))}</Text>
                  </View>
                </View>

                <View style={styles.chartRow}>
                  {wordsChart.map((v, i) => {
                    const isMax = v === maxDayWords && v > 0;
                    const isToday = i === todayDayIndex;
                    const barHeightPct =
                      maxDayWords > 0 && v > 0 ? Math.max(12, Math.round((v / maxDayWords) * 100)) : 0;
                    return (
                      <Pressable
                        key={i}
                        onPress={() => {
                          tapFeedback();
                          Alert.alert(
                            dayName(i),
                            tt("wordsCommunicatedOnDay").replace("{n}", String(v)).replace("{s}", v === 1 ? "" : "s")
                          );
                        }}
                        style={styles.chartCol}
                        hitSlop={4}
                      >
                        {/* Word count value cleanly positioned above bar */}
                        <Text
                          style={[
                            styles.chartVal,
                            isMax && styles.chartValMax,
                            isToday && styles.chartValToday,
                          ]}
                        >
                          {v}
                        </Text>

                        {/* High-contrast vertical pill track */}
                        <View style={[styles.chartTrack, isToday && styles.chartTrackToday]}>
                          {v > 0 ? (
                            <View
                              style={[
                                styles.chartBar,
                                {
                                  height: `${barHeightPct}%`,
                                  backgroundColor: isMax ? colors.forest : "#52b788",
                                },
                              ]}
                            />
                          ) : null}
                        </View>

                        {/* Day indicator with Today highlighted */}
                        <View style={[styles.dayBadge, isToday && styles.dayBadgeToday]}>
                          <Text style={[styles.chartDay, isToday && styles.chartDayToday]}>
                            {dayLetter(i)}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Legend / summary pills */}
                <View style={styles.chartFooterRow}>
                  <View style={styles.legendPill}>
                    <View style={[styles.legendDot, { backgroundColor: colors.forest }]} />
                    <Text style={styles.legendPillText}>
                      {tt("chartPeakLabel").replace("{day}", dayName(bestDayIdx)).replace("{n}", String(maxDayWords))}
                    </Text>
                  </View>
                  <View style={styles.legendPill}>
                    <View style={[styles.legendDot, { backgroundColor: "#52b788" }]} />
                    <Text style={styles.legendPillText}>{tt("chartDailyActivityLabel")}</Text>
                  </View>
                  {todayDayIndex >= 0 && (
                    <View style={styles.legendPill}>
                      <View style={[styles.legendDot, { backgroundColor: colors.forest, borderRadius: 2 }]} />
                      <Text style={styles.legendPillText}>{tt("chartTodayLabel").replace("{day}", dayLetter(todayDayIndex))}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Status checks */}
              <View style={styles.card}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <Text style={styles.cardTitle}>{tt("progressIndicatorsTitle")}</Text>
                  <Text style={styles.meta}>{checksPassed}/{statusChecks.length}</Text>
                </View>
                <View style={{ gap: 10 }}>
                  {statusChecks.map((m) => (
                    <View key={m.label} style={styles.checkRow}>
                      <Ionicons
                        name={m.value ? "checkmark" : "ellipse-outline"}
                        size={18}
                        color={m.value ? colors.greenDeep : colors.border}
                        style={{ width: 22 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.checkLabel, !m.value && { color: colors.textLight }]}>{m.label}</Text>
                        <Text style={styles.checkDetail}>{m.detail}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>{tt("pRecommendations")}</Text>
                {tips.map((tip, i) => (
                  <Text key={i} style={styles.tipLine}>
                    •  {tip}
                  </Text>
                ))}
              </View>
            </>
          )}

          {/* ================= 2. THERAPY GOALS SUBTAB ================= */}
          {subTab === "therapy" && (
            <View style={{ gap: 14 }}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Prescribed Therapy Goals</Text>
                  <Text style={styles.sectionSub}>Assigned by attending clinician or speech therapist</Text>
                </View>
              </View>

              {therapyGoals.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="flag-outline" size={48} color="#94a3b8" />
                  <Text style={styles.emptyTitle}>No Goals Prescribed Yet</Text>
                  <Text style={styles.emptySub}>
                    Attending pediatricians or SLPs can prescribe targeted therapy goals from the Doctor Panel.
                  </Text>
                </View>
              ) : (
                therapyGoals.map((goal) => {
                  const progressPct = Math.min(100, Math.round((goal.currentCount / goal.targetCount) * 100));
                  return (
                    <View key={goal.id} style={styles.goalCard}>
                      <View style={styles.goalHeaderRow}>
                        <View style={styles.goalCategoryBadge}>
                          <Text style={styles.goalCategoryText}>{goal.category.toUpperCase()}</Text>
                        </View>
                        {goal.completed ? (
                          <View style={styles.goalDoneBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#166534" />
                            <Text style={styles.goalDoneText}>Completed</Text>
                          </View>
                        ) : (
                          <Text style={styles.goalProgressNum}>
                            {goal.currentCount} / {goal.targetCount} {goal.unit}
                          </Text>
                        )}
                      </View>

                      <Text style={styles.goalTitle}>{goal.title}</Text>
                      {goal.notes ? <Text style={styles.goalNotes}>{goal.notes}</Text> : null}

                      {/* Progress Track */}
                      <View style={styles.goalTrack}>
                        <View
                          style={[
                            styles.goalFill,
                            {
                              width: `${progressPct}%`,
                              backgroundColor: goal.completed ? colors.greenDeep : colors.forest,
                            },
                          ]}
                        />
                      </View>

                      <View style={styles.goalFooter}>
                        <Text style={styles.goalPrescriber}>By: {goal.prescribedBy || "Attending Doctor"}</Text>
                        <Pressable
                          onPress={() => handlePracticeGoal(goal)}
                          disabled={goal.completed}
                          style={[
                            styles.practiceBtn,
                            goal.completed && { backgroundColor: "#e2e8f0" },
                          ]}
                        >
                          <Ionicons
                            name={goal.completed ? "checkmark" : "add-circle"}
                            size={16}
                            color={goal.completed ? "#64748b" : "white"}
                          />
                          <Text
                            style={[
                              styles.practiceBtnText,
                              goal.completed && { color: "#64748b" },
                            ]}
                          >
                            {goal.completed ? "Goal Met" : "+1 Practice"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ================= 3. CARE JOURNAL SUBTAB ================= */}
          {subTab === "journal" && (
            <View style={{ gap: 14 }}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Daily Care & Meltdown Journal</Text>
                  <Text style={styles.sectionSub}>Record mood, sensory triggers, and communication wins</Text>
                </View>
                <Pressable
                  onPress={() => setJournalModalOpen(true)}
                  style={styles.addLogBtn}
                >
                  <Ionicons name="add" size={18} color="white" />
                  <Text style={styles.addLogBtnText}>Log Day</Text>
                </Pressable>
              </View>

              {careLogs.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="journal-outline" size={48} color="#94a3b8" />
                  <Text style={styles.emptyTitle}>No Journal Entries Yet</Text>
                  <Text style={styles.emptySub}>
                    Tap "+ Log Day" to record your child's daily mood, meltdown events, and communication breakthroughs.
                  </Text>
                </View>
              ) : (
                careLogs.map((log) => {
                  const moodObj = MOODS.find((m) => m.key === log.mood) || MOODS[0];
                  return (
                    <View key={log.id} style={styles.logCard}>
                      <View style={styles.logHeader}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                          <MoodFace mood={moodObj.moodType} size={30} />
                          <View>
                            <Text style={styles.logMoodTitle}>{moodObj.label}</Text>
                            <Text style={styles.logDate}>
                              {new Date(log.date).toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </Text>
                          </View>
                        </View>
                        <Pressable
                          onPress={() => handleDeleteCareLog(log.id)}
                          style={{ padding: 4 }}
                        >
                          <Ionicons name="trash-outline" size={16} color="#94a3b8" />
                        </Pressable>
                      </View>

                      {log.meltdownDurationMin ? (
                        <View style={styles.meltdownRow}>
                          <Ionicons name="time" size={14} color="#ef4444" />
                          <Text style={styles.meltdownText}>
                            Meltdown duration: {log.meltdownDurationMin} minutes
                          </Text>
                        </View>
                      ) : null}

                      {log.sensoryTriggers && log.sensoryTriggers.length > 0 && (
                        <View style={styles.logTriggersRow}>
                          {log.sensoryTriggers.map((trig, idx) => (
                            <View key={idx} style={styles.logTriggerChip}>
                              <Text style={styles.logTriggerText}>{trig}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {log.communicationWins ? (
                        <View style={styles.logWinBox}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <Ionicons name="sparkles" size={14} color="#d97706" />
                            <Text style={styles.logWinTitle}>Communication Win:</Text>
                          </View>
                          <Text style={styles.logWinText}>{log.communicationWins}</Text>
                        </View>
                      ) : null}

                      {log.notes ? <Text style={styles.logNotes}>{log.notes}</Text> : null}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ================= 4. PASSCARD SUBTAB ================= */}
          {subTab === "passcard" && (
            <View style={{ gap: 14 }}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Caregiver Emergency Passcard</Text>
                  <Text style={styles.sectionSub}>Official emergency profile for babysitters and teachers</Text>
                </View>
                <Pressable
                  onPress={() => setPasscardModalOpen(true)}
                  style={styles.addLogBtn}
                >
                  <Ionicons name="open" size={16} color="white" />
                  <Text style={styles.addLogBtnText}>Open & Edit</Text>
                </Pressable>
              </View>

              {/* Passcard Preview Box */}
              <View style={styles.passcardPreview}>
                <View style={styles.passcardPreviewHead}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="card" size={20} color="#ef4444" />
                    <Text style={styles.passcardPreviewTitle}>{child.name}'s Passcard</Text>
                  </View>
                  <Pressable onPress={() => setPasscardModalOpen(true)} style={styles.viewBadge}>
                    <Text style={styles.viewBadgeText}>Full View</Text>
                  </Pressable>
                </View>

                <View style={{ gap: 8, marginTop: 8 }}>
                  <Text style={styles.passcardLine}>
                    <Text style={{ fontWeight: "700" }}>Emergency Contact: </Text>
                    {child.passcard?.emergencyContactName || "Parent"} (
                    {child.passcard?.emergencyContactPhone || "No phone set"})
                  </Text>
                  <Text style={styles.passcardLine}>
                    <Text style={{ fontWeight: "700" }}>Communication: </Text>
                    {child.passcard?.communicationStyle || "Uses BloomSpeech AAC Tablet"}
                  </Text>
                  <Text style={styles.passcardLine}>
                    <Text style={{ fontWeight: "700" }}>Top Sensory Triggers: </Text>
                    {child.passcard?.sensoryTriggers.join(", ") || "Loud noises, bright lights"}
                  </Text>
                  <Text style={styles.passcardLine}>
                    <Text style={{ fontWeight: "700" }}>Calming Strategies: </Text>
                    {child.passcard?.calmingStrategies.join(", ") || "Quiet room, deep squeeze"}
                  </Text>
                  <Text style={styles.passcardLine}>
                    <Text style={{ fontWeight: "700" }}>Allergies: </Text>
                    {child.passcard?.allergies.join(", ") || "No known allergies"}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setPasscardModalOpen(true)}
                  style={[styles.exportBtn, { marginTop: 14 }]}
                >
                  <Ionicons name="print" size={16} color="white" />
                  <Text style={styles.exportText}>View Printable Passcard</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ================= 5. VOCABULARY SUBTAB ================= */}
          {subTab === "vocabulary" && (
            <View style={styles.card}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Text style={styles.cardTitle}>{tt("pMostUsed")}</Text>
                <Text style={styles.meta}>Top 15 of {uniqueWords} unique</Text>
              </View>
              {topWords.length === 0 ? (
                <Text style={styles.emptyText}>{tt("pNoWordsYet")}</Text>
              ) : (
                <View style={styles.rankTable}>
                  <View style={[styles.rankRow, styles.rankHead]}>
                    <Text style={styles.rankH}>#</Text>
                    <Text style={[styles.rankH, { flex: 1 }]}>Word</Text>
                    <Text style={[styles.rankH, { textAlign: "right" }]}>Count</Text>
                    <Text style={[styles.rankH, { width: 90, textAlign: "right" }]}>Distribution</Text>
                  </View>
                  {topWords.map(([word, count], idx) => (
                    <View key={word} style={styles.rankRow}>
                      <Text style={styles.rankIdx}>{idx + 1}</Text>
                      <Text style={[styles.wordLabel, { flex: 1 }]}>{word}</Text>
                      <Text style={styles.wordCountAlign}>{count} {tt("pTimes")}</Text>
                      <View style={styles.wordTrackAlign}>
                        <View style={[styles.wordFill, { width: `${(count / maxWordCount) * 100}%` }]} />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ================= 6. SCHEDULE SUBTAB ================= */}
          {subTab === "schedule" && (
            <>
              <View style={styles.card}>
                <View style={styles.chartHeaderRow}>
                  <View>
                    <Text style={styles.cardTitle}>{tt("pWeeklyAdherence")}</Text>
                    <Text style={styles.chartSubtitle}>Routine task completion rate</Text>
                  </View>
                  <View style={styles.totalBadge}>
                    <Ionicons name="calendar" size={13} color={colors.forest} />
                    <Text style={styles.totalBadgeText}>Avg {avgAdherence}%</Text>
                  </View>
                </View>
                <View style={styles.chartRow}>
                  {scheduleDays.map((v, i) => {
                    const isToday = i === todayDayIndex;
                    return (
                      <View key={i} style={styles.chartCol}>
                        <Text style={[styles.chartVal, { fontSize: 11 }]}>{v}%</Text>
                        <View style={[styles.chartTrack, isToday && styles.chartTrackToday]}>
                          {v > 0 ? (
                            <View
                              style={[
                                styles.chartBar,
                                { height: `${Math.max(10, v)}%`, backgroundColor: adherenceColor(v) },
                              ]}
                            />
                          ) : null}
                        </View>
                        <View style={[styles.dayBadge, isToday && styles.dayBadgeToday]}>
                          <Text style={[styles.chartDay, isToday && styles.chartDayToday]}>{dayLetter(i)}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
                <View style={styles.legend}>
                  <LegendItem color={colors.greenDeep} label={tt("pLegendExcellent")} />
                  <LegendItem color={colors.yellowDeep} label={tt("pLegendGood")} />
                  <LegendItem color={colors.orangeDeep} label={tt("pLegendNeeds")} />
                </View>
              </View>

              <Pressable
                onPress={() => {
                  tapFeedback();
                  const report = `BloomSpeech Routine Adherence: ${avgAdherence}%\nActive Days: ${recordedDays.length}/7\nGenerated for: ${child.name}`;
                  Share.share({ message: report, title: "BloomSpeech_Schedule_Report.txt" });
                }}
                style={styles.exportBtn}
              >
                <Ionicons name="document-text" size={16} color="white" />
                <Text style={styles.exportText}>{tt("pExportIep")}</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  tapFeedback();
                  const printable = `📋 BLOOMSPEECH VISUAL ROUTINE CHECKLIST 📋
Child: ${child.name} (Age ${child.age})
Date: ${new Date().toLocaleDateString()}

[ ] 08:00 AM - Breakfast Time 🍳
[ ] 09:00 AM - Play & Learning 🧩
[ ] 10:30 AM - Speech & AAC Practice 💬
[ ] 12:00 PM - Healthy Lunch 🍽️
[ ] 01:00 PM - Quiet Rest & Sensory Break 😴
[ ] 03:00 PM - Outdoor Playground / Motor ⚽
[ ] 07:00 PM - Family Dinner 🍲
[ ] 08:00 PM - Brush Teeth & Bath 🪥🛁
[ ] 08:30 PM - Bedtime Story & Sleep 📖🌙

Daily Target: ${child.stars ?? 0} Stars Earned! Keep up the great work!`;
                  Share.share({ message: printable, title: `${child.name}_Routine_Checklist.txt` });
                }}
                style={[styles.exportBtn, { backgroundColor: colors.forest, marginTop: 10 }]}
              >
                <Ionicons name="print" size={16} color="white" />
                <Text style={styles.exportText}>Export Printable Routine Checklist</Text>
              </Pressable>
            </>
          )}

          {/* ================= 7. PRIVACY SUBTAB ================= */}
          {subTab === "privacy" && (
            <>
              <View style={styles.privacyInfo}>
                <Text style={styles.privacyInfoTitle}>{tt("pDataOnDevice")}</Text>
                <Text style={styles.privacyInfoLine}>{tt("pMathOnly")}</Text>
                <Text style={styles.privacyInfoLine}>{tt("pOnDeviceOnly")}</Text>
              </View>

              <View style={styles.toggleRow}>
                <View>
                  <Text style={styles.toggleLabel}>{tt("pFaceRecognition")}</Text>
                  <Text
                    style={[
                      styles.toggleSub,
                      { color: child.faceConsent !== false ? colors.greenDeep : colors.textLight },
                    ]}
                  >
                    {child.faceConsent !== false ? tt("pConsented") : tt("pNotEnabled")}
                  </Text>
                </View>
                <Switch
                  value={child.faceConsent !== false}
                  onValueChange={toggleFaceConsent}
                  trackColor={{ true: colors.greenDeep, false: colors.border }}
                  thumbColor="white"
                />
              </View>

              <View style={styles.toggleRow}>
                <View>
                  <Text style={styles.toggleLabel}>{tt("pGeneralConsent")}</Text>
                  <Text
                    style={[
                      styles.toggleSub,
                      { color: child.generalConsent !== false ? colors.greenDeep : colors.textLight },
                    ]}
                  >
                    {child.generalConsent !== false ? tt("pConsented") : tt("pNotGiven")}
                  </Text>
                </View>
                <Switch
                  value={child.generalConsent !== false}
                  onValueChange={toggleGeneralConsent}
                  trackColor={{ true: colors.greenDeep, false: colors.border }}
                  thumbColor="white"
                />
              </View>

              <Pressable onPress={deleteFaceData} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>{tt("pDeleteFace")}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <TabBar active={tab} onChange={onTabChange} labels={labels} />

      {/* Emergency Passcard Modal */}
      <EmergencyPasscardModal
        visible={passcardModalOpen}
        child={child}
        onClose={() => setPasscardModalOpen(false)}
        onUpdated={onUpdateChild}
      />

      {/* Sensory Calmer Toolkit Modal */}
      <SensoryCalmerModal
        visible={sensoryModalOpen}
        onClose={() => setSensoryModalOpen(false)}
      />

      {/* New Care Log Modal */}
      <Modal visible={journalModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, isTablet && styles.modalCardTablet]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Log Daily Care Observation</Text>
              <Pressable onPress={() => setJournalModalOpen(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12, paddingVertical: 10 }}>
              <Text style={styles.inputLabel}>Child's Overall Mood Today</Text>
              <View style={styles.moodSelectRow}>
                {MOODS.map((m) => {
                  const sel = logMood === m.key;
                  return (
                    <Pressable
                      key={m.key}
                      onPress={() => setLogMood(m.key)}
                      style={[styles.moodChip, sel && styles.moodChipActive]}
                    >
                      <MoodFace mood={m.moodType} size={24} />
                      <Text style={[styles.moodChipText, sel && styles.moodChipTextActive]}>
                        {m.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Meltdown Duration (minutes, if any)</Text>
              <TextInput
                value={logMeltdown}
                onChangeText={setLogMeltdown}
                keyboardType="number-pad"
                placeholder="0 (None), 5, 15, 30..."
                style={styles.inputField}
              />

              <Text style={styles.inputLabel}>Sensory Triggers Noticed (comma separated)</Text>
              <TextInput
                value={logTriggers}
                onChangeText={setLogTriggers}
                placeholder="Loud noise, bright lights, crowds..."
                style={styles.inputField}
              />

              <Text style={styles.inputLabel}>Communication Wins / AAC Breakthroughs</Text>
              <TextInput
                value={logWins}
                onChangeText={setLogWins}
                multiline
                placeholder="e.g. Tapped 'water' unprompted!"
                style={[styles.inputField, { height: 60 }]}
              />

              <Text style={styles.inputLabel}>Caregiver Daily Notes</Text>
              <TextInput
                value={logNotes}
                onChangeText={setLogNotes}
                multiline
                placeholder="Sleep quality, mealtime behavior, sensory responses..."
                style={[styles.inputField, { height: 70 }]}
              />

              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setJournalModalOpen(false)}
                  style={styles.btnSecondary}
                >
                  <Text style={styles.btnSecondaryText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleSaveCareLog} style={styles.btnPrimary}>
                  <Ionicons name="checkmark" size={16} color="white" />
                  <Text style={styles.btnPrimaryText}>Save Journal Log</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TableRow({
  label,
  value,
  mono,
  secondary,
}: {
  label: string;
  value: string;
  mono?: boolean;
  secondary?: boolean;
}) {
  return (
    <View style={[styles.row, secondary && { backgroundColor: "transparent" }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          mono !== false && { fontFamily: undefined, fontVariant: ["tabular-nums"] },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  headerInner: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  headerInnerTablet: {
    maxWidth: 860,
    alignSelf: "center",
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: colors.textDark,
    textAlign: "center",
    marginRight: 36,
  },
  childRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingTop: 12 },
  childRowTablet: {
    maxWidth: 860,
    alignSelf: "center",
    width: "100%",
  },
  shield: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.indigo,
    alignItems: "center",
    justifyContent: "center",
  },
  childName: { fontSize: 16, fontWeight: "800", color: colors.textDark },
  childSub: { fontSize: 12, color: colors.textMid, marginTop: 1 },
  diagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 20, marginTop: 8 },
  diagRowTablet: {
    maxWidth: 860,
    alignSelf: "center",
    width: "100%",
  },
  diagChip: { backgroundColor: colors.forestLight, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  diagChipText: { color: colors.forestDark, fontSize: 11, fontWeight: "700" },

  subTabs: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subTabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
  },
  subTabBtnActive: {
    backgroundColor: "#eff6ff",
  },
  subTabText: { fontSize: 13, color: colors.textLight, fontWeight: "600" },
  subTabUnderline: { display: "none" },

  body: { padding: 18, gap: 16, paddingBottom: 60 },
  bodyTablet: {
    maxWidth: 860,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 28,
  },

  /* Quick Actions Grid */
  quickActionGrid: { gap: 10 },
  quickActionGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionBannerTablet: {
    width: "48.8%",
  },
  actionBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBannerTitle: { fontSize: 14, fontWeight: "800" },
  actionBannerSub: { fontSize: 11, color: "#64748b", marginTop: 2 },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  cardTitle: { fontSize: 14, fontWeight: "800", color: colors.textDark, marginBottom: 6 },
  meta: { fontSize: 12, color: colors.textLight, fontWeight: "700" },

  tableCard: {
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  table: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: "hidden" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: "#fff",
  },
  rowLabel: { fontSize: 12.5, color: colors.textMid, fontWeight: "600" },
  rowValue: { fontSize: 13, fontWeight: "800", color: colors.textDark },

  chartHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chartSubtitle: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  totalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.forestLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  totalBadgeText: { fontSize: 12, fontWeight: "800", color: colors.forest },

  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 165,
    alignItems: "flex-end",
    paddingVertical: 6,
  },
  chartCol: { alignItems: "center", justifyContent: "flex-end", flex: 1, gap: 6 },
  chartTrack: {
    width: 26,
    height: 96,
    borderRadius: 13,
    backgroundColor: "#f1f5f9",
    justifyContent: "flex-end",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chartTrackToday: {
    borderColor: colors.forest,
    borderWidth: 1.5,
  },
  chartBar: { width: "100%", borderRadius: 12 },
  dayBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadgeToday: {
    backgroundColor: colors.forest,
  },
  chartDay: { fontSize: 12, fontWeight: "700", color: colors.textMid },
  chartDayToday: { color: "white" },
  chartVal: { fontSize: 12, fontWeight: "800", color: colors.textMid, minHeight: 16, textAlign: "center" },
  chartValMax: { color: colors.forest, fontWeight: "900" },
  chartValToday: { color: colors.forest },
  percentLabel: { fontSize: 10, color: colors.textMid, fontWeight: "700" },
  chartFooterRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  legendPill: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendPillText: { fontSize: 11.5, color: colors.textMid, fontWeight: "600" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 14, justifyContent: "center" },
  legendText: { fontSize: 11, color: colors.textMid },

  checkRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 2 },
  checkLabel: { fontSize: 13.5, color: colors.textDark, fontWeight: "700" },
  checkDetail: { fontSize: 11.5, color: colors.textLight, marginTop: 1 },

  rankTable: { marginTop: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: "hidden" },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: "#fff",
  },
  rankHead: { backgroundColor: colors.cardMuted, borderBottomWidth: 1 },
  rankH: { fontSize: 11, fontWeight: "800", color: colors.textMid },
  rankIdx: { fontSize: 12, fontWeight: "800", color: colors.textMid, width: 22 },
  wordLabel: { fontWeight: "800", fontSize: 14, color: colors.textDark },
  wordCountAlign: { fontSize: 12, color: colors.textMid, fontWeight: "700", width: 70, textAlign: "right" },
  wordTrackAlign: { width: 90, height: 8, borderRadius: 4, backgroundColor: colors.cardMuted, overflow: "hidden" },
  wordFill: { height: "100%", borderRadius: 4, backgroundColor: colors.indigo },

  summaryCard: { backgroundColor: colors.indigoLight, borderRadius: radius, padding: 16 },
  summaryTitle: { fontSize: 13, fontWeight: "800", color: colors.indigoDeep, marginBottom: 6 },
  tipLine: { fontSize: 13, color: colors.textDark, lineHeight: 20, marginTop: 4 },

  exportBtn: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.blueAccent,
    borderRadius: radius,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  exportText: { color: "white", fontWeight: "700", fontSize: 13.5 },

  emptyText: { color: colors.textLight, fontSize: 13, lineHeight: 20, padding: 20, textAlign: "center" },

  privacyInfo: { backgroundColor: colors.indigoLight, borderRadius: radius, padding: 16, gap: 4 },
  privacyInfoTitle: { fontSize: 13, fontWeight: "800", color: colors.indigoDeep, marginBottom: 4 },
  privacyInfoLine: { fontSize: 13, color: colors.textDark },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  toggleLabel: { fontSize: 15, fontWeight: "700", color: colors.textDark },
  toggleSub: { fontSize: 12, marginTop: 2, fontWeight: "600" },
  deleteBtn: {
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: radius,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteText: { color: colors.danger, fontWeight: "700" },

  /* Section header */
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  sectionSub: { fontSize: 11.5, color: "#64748b", marginTop: 1 },
  addLogBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.forest,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addLogBtnText: { color: "white", fontSize: 12.5, fontWeight: "700" },

  /* Therapy Goal Cards */
  goalCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  goalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goalCategoryBadge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  goalCategoryText: { fontSize: 10.5, fontWeight: "800", color: "#2563eb" },
  goalDoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  goalDoneText: { fontSize: 11, fontWeight: "700", color: "#166534" },
  goalProgressNum: { fontSize: 12, fontWeight: "800", color: "#475569" },
  goalTitle: { fontSize: 15, fontWeight: "800", color: "#1e293b" },
  goalNotes: { fontSize: 12, color: "#64748b", lineHeight: 17 },
  goalTrack: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
    marginVertical: 4,
  },
  goalFill: { height: "100%", borderRadius: 4 },
  goalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  goalPrescriber: { fontSize: 11, color: "#94a3b8" },
  practiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.forest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  practiceBtnText: { color: "white", fontSize: 12, fontWeight: "700" },

  /* Journal Cards */
  logCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  logHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logMoodTitle: { fontSize: 14, fontWeight: "800", color: "#1e293b" },
  logDate: { fontSize: 11, color: "#64748b", marginTop: 1 },
  meltdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef2f2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  meltdownText: { fontSize: 11.5, color: "#dc2626", fontWeight: "700" },
  logTriggersRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  logTriggerChip: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  logTriggerText: { fontSize: 11, color: "#991b1b", fontWeight: "600" },
  logWinBox: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 8,
    padding: 10,
  },
  logWinTitle: { fontSize: 12, fontWeight: "800", color: "#166534" },
  logWinText: { fontSize: 12.5, color: "#15803d", marginTop: 2 },
  logNotes: { fontSize: 12, color: "#475569", lineHeight: 18 },

  /* Passcard Preview */
  passcardPreview: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  passcardPreviewHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  passcardPreviewTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  viewBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  viewBadgeText: { fontSize: 11, fontWeight: "700", color: "#dc2626" },
  passcardLine: { fontSize: 12.5, color: "#334155", lineHeight: 19 },

  /* Empty State */
  emptyCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 6,
  },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: "#334155", marginTop: 4 },
  emptySub: { fontSize: 12, color: "#64748b", textAlign: "center", lineHeight: 18 },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 18,
    width: "100%",
    maxWidth: 480,
    maxHeight: "90%",
  },
  modalCardTablet: {
    maxWidth: 580,
    padding: 24,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  inputLabel: { fontSize: 12, fontWeight: "700", color: "#475569", marginTop: 4 },
  inputField: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#0f172a",
  },
  moodSelectRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  moodChip: {
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    minWidth: 60,
  },
  moodChipActive: {
    backgroundColor: "#eff6ff",
    borderColor: colors.blueDeep,
  },
  moodChipText: { fontSize: 10, fontWeight: "700", color: "#64748b", marginTop: 2 },
  moodChipTextActive: { color: colors.blueDeep },

  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 14 },
  btnSecondary: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnSecondaryText: { color: "#475569", fontWeight: "700", fontSize: 13 },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.forest,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnPrimaryText: { color: "white", fontWeight: "700", fontSize: 13 },
});
