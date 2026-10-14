import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  Share,
  Linking,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { tapFeedback } from "../modules/haptics";
import { useSettings } from "../context/SettingsContext";
import { t } from "../modules/i18n";
import type { ChildProfile, TherapyGoal, CareLogEntry } from "../types";
import { DIAGNOSIS_LABELS } from "../types";

interface Props {
  visible: boolean;
  onClose: () => void;
  child: ChildProfile;
  totalWords: number;
  uniqueWords: number;
  wordsThisWeek: number;
  sentencesSpoken: number;
  longestSentenceLength: number;
  longestSentenceWords: string[];
  avgAdherence: number;
  topWords: [string, number][];
  therapyGoals: TherapyGoal[];
  careLogs: CareLogEntry[];
  consecutiveDays: number;
}

export default function ShareProgressModal({
  visible,
  onClose,
  child,
  totalWords,
  uniqueWords,
  wordsThisWeek,
  sentencesSpoken,
  longestSentenceLength,
  longestSentenceWords,
  avgAdherence,
  topWords,
  therapyGoals,
  careLogs,
  consecutiveDays,
}: Props) {
  const { settings } = useSettings();
  const lang = settings.language;
  const isRtl = lang.startsWith("ar") || lang.startsWith("ur");

  const [copied, setCopied] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  // Generate clean, formatted clinical report text
  const reportText = useMemo(() => {
    const today = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const diagnosesStr =
      child.diagnoses.map((d) => DIAGNOSIS_LABELS[d] || d).join(", ") || "General AAC Support";

    const topWordsStr =
      topWords.length > 0
        ? topWords.map(([w, c]) => `${w} (${c}x)`).join(", ")
        : "No word records yet";

    const goalsStr =
      therapyGoals.length > 0
        ? therapyGoals
            .map(
              (g) =>
                `• [${g.category.toUpperCase()}] ${g.title}: ${g.currentCount}/${g.targetCount} ${g.unit} (${
                  g.completed ? "COMPLETED" : "In Progress"
                })`
            )
            .join("\n")
        : "• No prescribed clinical goals set yet.";

    const journalStr =
      careLogs.length > 0
        ? careLogs
            .slice(0, 3)
            .map(
              (l) =>
                `• ${new Date(l.date).toLocaleDateString()}: Mood=${l.mood}${
                  l.meltdownDurationMin ? `, Meltdown=${l.meltdownDurationMin}min` : ""
                }${l.communicationWins ? `, Wins: ${l.communicationWins}` : ""}${
                  l.notes ? ` (${l.notes})` : ""
                }`
            )
            .join("\n")
        : "• No recent journal observations logged.";

    return `=====================================================
ANGEL TALK CLINICAL PROGRESS & THERAPY REPORT
=====================================================
Patient / Child: ${child.name} (Age: ${child.age} yrs)
Clinical Diagnoses: ${diagnosesStr}
Enrolled: ${new Date(child.enrolledAt).toLocaleDateString()}
Report Date: ${today}

COMMUNICATION PERFORMANCE METRICS:
-----------------------------------------------------
• Cumulative Words Communicated: ${totalWords} word taps
• Unique Vocabulary Diversity: ${uniqueWords} unique words
• Words Communicated This Week: ${wordsThisWeek} words
• Full Sentences Constructed: ${sentencesSpoken} sentences
• Longest Sentence Spoken: ${
      longestSentenceLength > 0
        ? `${longestSentenceLength} words ("${longestSentenceWords.join(" ")}")`
        : "None yet"
    }
• Visual Routine Adherence: ${avgAdherence}% average
• Consecutive Days Active: ${consecutiveDays} days

TOP COMMUNICATIVE VOCABULARY:
-----------------------------------------------------
${topWordsStr}

PRESCRIBED THERAPY GOALS:
-----------------------------------------------------
${goalsStr}

RECENT CAREGIVER OBSERVATIONS:
-----------------------------------------------------
${journalStr}

=====================================================
Sent securely via Angel Talk AAC & Pediatric Support Portal.`;
  }, [
    child,
    totalWords,
    uniqueWords,
    wordsThisWeek,
    sentencesSpoken,
    longestSentenceLength,
    longestSentenceWords,
    avgAdherence,
    topWords,
    therapyGoals,
    careLogs,
    consecutiveDays,
  ]);

  // Copy report to clipboard with fallback
  async function handleCopy() {
    tapFeedback();
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(reportText);
      } else if (typeof document !== "undefined") {
        const textArea = document.createElement("textarea");
        textArea.value = reportText;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  // Open WhatsApp with pre-filled report
  function handleWhatsApp() {
    tapFeedback();
    const encoded = encodeURIComponent(reportText);
    const url = `https://wa.me/?text=${encoded}`;
    Linking.openURL(url).catch(() => {
      handleCopy();
    });
  }

  // Open Email client with pre-filled report
  function handleEmail() {
    tapFeedback();
    const subject = encodeURIComponent(`Angel Talk Clinical Progress Report - ${child.name}`);
    const body = encodeURIComponent(reportText);
    const url = `mailto:?subject=${subject}&body=${body}`;
    Linking.openURL(url).catch(() => {
      handleCopy();
    });
  }

  // Native share sheet or Web share API
  async function handleSystemShare() {
    tapFeedback();
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({
          title: `Angel Talk Report - ${child.name}`,
          text: reportText,
        });
        return;
      }
      await Share.share({
        message: reportText,
        title: `${child.name}_Progress_Report.txt`,
      });
    } catch {
      handleCopy();
    }
  }

  // Download .txt file (works in all web browsers)
  function handleDownload() {
    tapFeedback();
    try {
      if (typeof document !== "undefined") {
        const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${child.name.replace(/\s+/g, "_")}_Clinical_Progress_Report.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        handleCopy();
      }
    } catch {
      handleCopy();
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          {/* Header */}
          <View style={[styles.headerRow, isRtl && { flexDirection: "row-reverse" }]}>
            <View style={{ flexDirection: isRtl ? "row-reverse" : "row", alignItems: "center", gap: 10, flex: 1 }}>
              <View style={styles.badgeIcon}>
                <Ionicons name="document-text" size={20} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, isRtl && { textAlign: "right" }]}>
                  {t("shareProgressTitle", lang)}
                </Text>
                <Text style={[styles.subTitle, isRtl && { textAlign: "right" }]}>
                  {t("shareProgressSub", lang)}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748b" />
            </Pressable>
          </View>

          {/* Copied Feedback Toast */}
          {copied && (
            <View style={styles.copiedBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#15803d" />
              <Text style={styles.copiedBannerText}>Report copied to clipboard!</Text>
            </View>
          )}

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Child Profile Summary Banner */}
            <View style={[styles.profileBanner, isRtl && { flexDirection: "row-reverse" }]}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarText}>{child.name[0]?.toUpperCase() ?? "C"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.childMeta}>
                  {child.age} years old · Enrolled {new Date(child.enrolledAt).toLocaleDateString()}
                </Text>
                <View style={[styles.diagRow, isRtl && { flexDirection: "row-reverse" }]}>
                  {child.diagnoses.map((d) => (
                    <View key={d} style={styles.diagBadge}>
                      <Text style={styles.diagBadgeText}>{DIAGNOSIS_LABELS[d] || d}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Quick Share Options Bar */}
            <Text style={styles.sectionHeading}>Share directly with Doctor or SLP:</Text>
            <View style={styles.quickShareGrid}>
              <Pressable onPress={handleWhatsApp} style={[styles.quickShareBtn, { backgroundColor: "#25D366" }]}>
                <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                <Text style={styles.quickShareBtnText}>WhatsApp</Text>
              </Pressable>

              <Pressable onPress={handleEmail} style={[styles.quickShareBtn, { backgroundColor: "#2563eb" }]}>
                <Ionicons name="mail" size={18} color="#FFFFFF" />
                <Text style={styles.quickShareBtnText}>Email</Text>
              </Pressable>

              <Pressable onPress={handleCopy} style={[styles.quickShareBtn, { backgroundColor: "#1e293b" }]}>
                <Ionicons name={copied ? "checkmark" : "copy-outline"} size={18} color="#FFFFFF" />
                <Text style={styles.quickShareBtnText}>{copied ? "Copied!" : "Copy Report"}</Text>
              </Pressable>

              <Pressable onPress={handleDownload} style={[styles.quickShareBtn, { backgroundColor: colors.forest }]}>
                <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                <Text style={styles.quickShareBtnText}>Download .txt</Text>
              </Pressable>
            </View>

            {/* Key Clinical Performance Metrics Grid */}
            <Text style={styles.sectionHeading}>Key Performance Metrics:</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricVal}>{totalWords}</Text>
                <Text style={styles.metricLbl}>Total Words</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricVal}>{uniqueWords}</Text>
                <Text style={styles.metricLbl}>Unique Words</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricVal}>{wordsThisWeek}</Text>
                <Text style={styles.metricLbl}>This Week</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricVal}>{sentencesSpoken}</Text>
                <Text style={styles.metricLbl}>Sentences</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricVal}>{avgAdherence}%</Text>
                <Text style={styles.metricLbl}>Routine Adherence</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricVal}>{consecutiveDays}d</Text>
                <Text style={styles.metricLbl}>Streak</Text>
              </View>
            </View>

            {/* Top Vocabulary Words */}
            {topWords.length > 0 && (
              <View style={styles.cardBox}>
                <View style={styles.cardBoxHeader}>
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.forest} />
                  <Text style={styles.cardBoxTitle}>Top Communicative Vocabulary</Text>
                </View>
                <View style={styles.topWordsWrap}>
                  {topWords.map(([w, c]) => (
                    <View key={w} style={styles.wordPill}>
                      <Text style={styles.wordPillText}>{w}</Text>
                      <Text style={styles.wordPillCount}>{c}x</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Prescribed Therapy Goals */}
            <View style={styles.cardBox}>
              <View style={styles.cardBoxHeader}>
                <Ionicons name="flag-outline" size={16} color="#0284c7" />
                <Text style={styles.cardBoxTitle}>Prescribed Therapy Goals ({therapyGoals.length})</Text>
              </View>
              {therapyGoals.length === 0 ? (
                <Text style={styles.emptyText}>No prescribed therapy goals logged yet.</Text>
              ) : (
                therapyGoals.map((g) => (
                  <View key={g.id} style={styles.goalRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.goalTitle}>{g.title}</Text>
                      <Text style={styles.goalMeta}>
                        Category: {g.category.toUpperCase()} · Target: {g.targetCount} {g.unit}
                      </Text>
                    </View>
                    <View style={[styles.goalBadge, g.completed && styles.goalBadgeDone]}>
                      <Text style={[styles.goalBadgeText, g.completed && styles.goalBadgeTextDone]}>
                        {g.completed ? "Done" : `${g.currentCount}/${g.targetCount}`}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Formatted Report Preview Toggle */}
            <Pressable
              onPress={() => setShowFullText((prev) => !prev)}
              style={styles.toggleReportBtn}
            >
              <Ionicons
                name={showFullText ? "chevron-up-circle" : "chevron-down-circle"}
                size={18}
                color="#475569"
              />
              <Text style={styles.toggleReportBtnText}>
                {showFullText ? "Hide Full Text Preview" : "View Full Formatted Text Report"}
              </Text>
            </Pressable>

            {showFullText && (
              <View style={styles.reportPreviewBox}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text selectable style={styles.reportMonospaceText}>
                    {reportText}
                  </Text>
                </ScrollView>
              </View>
            )}
          </ScrollView>

          {/* Footer Bar */}
          <View style={[styles.footerRow, isRtl && { flexDirection: "row-reverse" }]}>
            <Pressable onPress={handleSystemShare} style={styles.systemShareBtn}>
              <Ionicons name="share-outline" size={18} color="#334155" />
              <Text style={styles.systemShareBtnText}>More Options</Text>
            </Pressable>

            <Pressable onPress={handleCopy} style={styles.mainActionBtn}>
              <Ionicons name={copied ? "checkmark-circle" : "copy"} size={18} color="#FFFFFF" />
              <Text style={styles.mainActionBtnText}>
                {copied ? "Copied to Clipboard" : "Copy Complete Report"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 620,
    maxHeight: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  badgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16.5,
    fontWeight: "800",
    color: "#0f172a",
  },
  subTitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  copiedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#dcfce7",
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#bbf7d0",
  },
  copiedBannerText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#15803d",
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 14,
  },
  profileBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 16,
    padding: 14,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  childName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1e3a8a",
  },
  childMeta: {
    fontSize: 12,
    color: "#475569",
    marginTop: 2,
  },
  diagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  diagBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diagBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1d4ed8",
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginTop: 4,
  },
  quickShareGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickShareBtn: {
    flex: 1,
    minWidth: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  quickShareBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricCard: {
    flex: 1,
    minWidth: 90,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  metricVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  metricLbl: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
    textAlign: "center",
  },
  cardBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  cardBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  cardBoxTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
  },
  topWordsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  wordPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  wordPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  wordPillCount: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#2563eb",
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  goalTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  goalMeta: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  goalBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  goalBadgeDone: {
    backgroundColor: "#DCFCE7",
  },
  goalBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0369A1",
  },
  goalBadgeTextDone: {
    color: "#15803d",
  },
  emptyText: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic",
  },
  toggleReportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    marginTop: 4,
  },
  toggleReportBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#475569",
  },
  reportPreviewBox: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 14,
    maxHeight: 220,
  },
  reportMonospaceText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 11,
    color: "#cbd5e1",
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  systemShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
  systemShareBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  mainActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#2563eb",
  },
  mainActionBtnText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
