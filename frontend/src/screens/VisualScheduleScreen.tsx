import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { ChildProfile, TabScreen } from "../types";
import { useSettings } from "../context/SettingsContext";
import { speak } from "../modules/tts";
import { recordScheduleAdherence, updateChild } from "../modules/storage";
import { t, wordLabel, type TKey } from "../modules/i18n";
import { tapFeedback } from "../modules/haptics";
import { useResponsive } from "../modules/responsive";
import LangBadge from "../components/LangBadge";
import TabBar from "../components/TabBar";
import { colors, radius } from "../theme";

interface Props {
  child: ChildProfile;
  tab: TabScreen;
  onTabChange: (tab: TabScreen) => void;
  labels: Record<TabScreen, string>;
}

type ItemState = "done" | "now" | "upcoming";

interface ScheduleItem {
  id: string;
  time: string;
  label: string;
  emoji: string;
  state: ItemState;
}

type RoutinePreset = "allday" | "morning" | "bedtime" | "therapy";

const PRESETS: Record<RoutinePreset, { title: string; icon: string; items: ScheduleItem[] }> = {
  allday: {
    title: "All Day",
    icon: "sunny",
    items: [
      { id: "ad_1", time: "08:00", label: "Breakfast Time", emoji: "🍳", state: "done" },
      { id: "ad_2", time: "09:00", label: "Play & Learning", emoji: "🧩", state: "done" },
      { id: "ad_3", time: "10:30", label: "AAC Speech Session", emoji: "💬", state: "now" },
      { id: "ad_4", time: "12:00", label: "Healthy Lunch", emoji: "🍽️", state: "upcoming" },
      { id: "ad_5", time: "13:00", label: "Quiet Rest Time", emoji: "😴", state: "upcoming" },
      { id: "ad_6", time: "15:00", label: "Sensory Playground", emoji: "⭐", state: "upcoming" },
    ],
  },
  morning: {
    title: "Morning",
    icon: "alarm",
    items: [
      { id: "m_1", time: "07:30", label: "Wake Up & Stretch", emoji: "☀️", state: "done" },
      { id: "m_2", time: "07:45", label: "Brush Teeth", emoji: "🪥", state: "now" },
      { id: "m_3", time: "08:00", label: "Wash Face & Dress", emoji: "👕", state: "upcoming" },
      { id: "m_4", time: "08:15", label: "Eat Breakfast", emoji: "🥣", state: "upcoming" },
      { id: "m_5", time: "08:45", label: "Pack Backpack", emoji: "🎒", state: "upcoming" },
    ],
  },
  bedtime: {
    title: "Bedtime",
    icon: "moon",
    items: [
      { id: "b_1", time: "19:00", label: "Family Dinner", emoji: "🍲", state: "done" },
      { id: "b_2", time: "19:45", label: "Warm Bath", emoji: "🛁", state: "now" },
      { id: "b_3", time: "20:00", label: "Pajamas & Brush Teeth", emoji: "🪥", state: "upcoming" },
      { id: "b_4", time: "20:15", label: "Read Storybook", emoji: "📖", state: "upcoming" },
      { id: "b_5", time: "20:30", label: "Lights Out & Sleep", emoji: "🌙", state: "upcoming" },
    ],
  },
  therapy: {
    title: "Therapy",
    icon: "medkit",
    items: [
      { id: "t_1", time: "10:00", label: "Sensory Warmup", emoji: "🌿", state: "done" },
      { id: "t_2", time: "10:15", label: "Speech AAC Practice", emoji: "🗣️", state: "now" },
      { id: "t_3", time: "10:45", label: "Fine Motor Skills", emoji: "🎨", state: "upcoming" },
      { id: "t_4", time: "11:00", label: "Star Reward & Free Play", emoji: "⭐", state: "upcoming" },
    ],
  },
};

export function getScheduleVectorTheme(emojiOrId?: string, label?: string) {
  const l = (label || "").toLowerCase();
  const e = emojiOrId || "";

  if (l.includes("breakfast") || l.includes("eat") || l.includes("cereal") || e === "🍳" || e === "🥣") {
    return {
      icon: "cafe" as keyof typeof Ionicons.glyphMap,
      bg: "#fef3c7",
      color: "#b45309",
      border: "#fde68a",
    };
  }
  if (l.includes("lunch") || l.includes("dinner") || l.includes("meal") || e === "🍽️" || e === "🍲") {
    return {
      icon: "restaurant" as keyof typeof Ionicons.glyphMap,
      bg: "#ffedd5",
      color: "#c2410c",
      border: "#fed7aa",
    };
  }
  if (l.includes("play") || l.includes("learning") || l.includes("puzzle") || e === "🧩") {
    return {
      icon: "extension-puzzle" as keyof typeof Ionicons.glyphMap,
      bg: "#dcfce7",
      color: "#15803d",
      border: "#bbf7d0",
    };
  }
  if (l.includes("aac") || l.includes("speech") || l.includes("practice") || e === "💬" || e === "🗣️") {
    return {
      icon: "chatbubbles" as keyof typeof Ionicons.glyphMap,
      bg: "#e0f2fe",
      color: "#0284c7",
      border: "#bae6fd",
    };
  }
  if (l.includes("rest") || l.includes("sleep") || l.includes("lights out") || l.includes("quiet") || e === "😴" || e === "🌙") {
    return {
      icon: "moon" as keyof typeof Ionicons.glyphMap,
      bg: "#f3e8ff",
      color: "#7e22ce",
      border: "#e9d5ff",
    };
  }
  if (l.includes("sensory") || l.includes("playground") || l.includes("park") || l.includes("warmup") || e === "🌿") {
    return {
      icon: "leaf" as keyof typeof Ionicons.glyphMap,
      bg: "#d1fae5",
      color: "#059669",
      border: "#a7f3d0",
    };
  }
  if (l.includes("wake") || l.includes("stretch") || e === "☀️") {
    return {
      icon: "sunny" as keyof typeof Ionicons.glyphMap,
      bg: "#fef9c3",
      color: "#ca8a04",
      border: "#fef08a",
    };
  }
  if (l.includes("teeth") || l.includes("brush") || e === "🪥") {
    return {
      icon: "sparkles" as keyof typeof Ionicons.glyphMap,
      bg: "#e0f2fe",
      color: "#0284c7",
      border: "#bae6fd",
    };
  }
  if (l.includes("dress") || l.includes("clothes") || l.includes("pajamas") || e === "👕") {
    return {
      icon: "shirt" as keyof typeof Ionicons.glyphMap,
      bg: "#ffedd5",
      color: "#c2410c",
      border: "#fed7aa",
    };
  }
  if (l.includes("pack") || l.includes("backpack") || e === "🎒") {
    return {
      icon: "briefcase" as keyof typeof Ionicons.glyphMap,
      bg: "#f1f5f9",
      color: "#475569",
      border: "#cbd5e1",
    };
  }
  if (l.includes("bath") || l.includes("wash") || e === "🛁") {
    return {
      icon: "water" as keyof typeof Ionicons.glyphMap,
      bg: "#e0f2fe",
      color: "#0284c7",
      border: "#bae6fd",
    };
  }
  if (l.includes("read") || l.includes("book") || l.includes("story") || e === "📖") {
    return {
      icon: "book" as keyof typeof Ionicons.glyphMap,
      bg: "#ccfbf1",
      color: "#0f766e",
      border: "#99f6e4",
    };
  }
  if (l.includes("motor") || l.includes("art") || l.includes("fine motor") || e === "🎨") {
    return {
      icon: "color-palette" as keyof typeof Ionicons.glyphMap,
      bg: "#fce7f3",
      color: "#be185d",
      border: "#fbcfe8",
    };
  }
  if (l.includes("reward") || l.includes("star") || e === "⭐" || e === "🎉") {
    return {
      icon: (e === "🎉" ? "ribbon" : "star") as keyof typeof Ionicons.glyphMap,
      bg: "#fef3c7",
      color: "#d97706",
      border: "#fde68a",
    };
  }

  return {
    icon: "calendar" as keyof typeof Ionicons.glyphMap,
    bg: "#f8fafc",
    color: "#64748b",
    border: "#e2e8f0",
  };
}

export default function VisualScheduleScreen({ child, tab, onTabChange, labels }: Props) {
  const { settings } = useSettings();
  const { isSmallPhone, isTablet, isLargeTablet } = useResponsive();
  const lang = settings.language;
  const [activePreset, setActivePreset] = useState<RoutinePreset>("allday");
  const [items, setItems] = useState<ScheduleItem[]>(PRESETS.allday.items);
  const [viewMode, setViewMode] = useState<"timeline" | "first_then">("timeline");
  const [addTaskModal, setAddTaskModal] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("11:00");
  const [newTaskEmoji, setNewTaskEmoji] = useState("⭐");

  // Load preset items
  function switchPreset(preset: RoutinePreset) {
    tapFeedback();
    setActivePreset(preset);
    setItems(PRESETS[preset].items);
  }

  function toggle(idx: number) {
    tapFeedback();
    setItems((prev) => {
      const next = prev.map((item, i) => {
        if (i !== idx) return item;
        const nextState: ItemState = item.state === "done" ? "upcoming" : "done";
        speak(
          wordLabel(item.label, lang) + (nextState === "done" ? t("finishedGreatJob", lang) : ""),
          lang,
          settings.soundEnabled
        );
        return { ...item, state: nextState };
      });
      const percent = Math.round((next.filter((i) => i.state === "done").length / next.length) * 100);
      recordScheduleAdherence(child.id, percent);
      return next;
    });
  }

  function handleCreateTask() {
    if (!newTaskTitle.trim()) {
      Alert.alert(t("requiredAlertTitle", lang), t("requiredAlertMsg", lang));
      return;
    }
    const newItem: ScheduleItem = {
      id: "custom_" + Date.now(),
      time: newTaskTime.trim() || "12:00",
      label: newTaskTitle.trim(),
      emoji: newTaskEmoji,
      state: "upcoming",
    };
    setItems((prev) => [...prev, newItem]);
    setAddTaskModal(false);
    setNewTaskTitle("");
    Alert.alert("Task Added", `"${newItem.label}" was added to your schedule.`);
  }

  function handleReadSchedule() {
    tapFeedback();
    const currentTask = items.find((i) => i.state === "now") || items.find((i) => i.state === "upcoming");
    if (currentTask) {
      speak(`${t("rightNowTimeFor", lang)} ${wordLabel(currentTask.label, lang)}.`, lang, settings.soundEnabled);
    } else {
      speak(t("allTasksFinished", lang), lang, settings.soundEnabled);
    }
  }

  useEffect(() => {
    const percent = Math.round((items.filter((i) => i.state === "done").length / items.length) * 100);
    recordScheduleAdherence(child.id, percent);
  }, []);

  const doneCount = items.filter((i) => i.state === "done").length;
  const percent = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  // First-Then tasks computation
  const currentTask = items.find((i) => i.state === "now") || items.find((i) => i.state === "upcoming") || items[0];
  const nextTask = items.find((i) => i.state === "upcoming" && i.id !== currentTask?.id) || items[items.length - 1];

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={[styles.headerInner, isTablet && styles.headerInnerTablet]}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title} numberOfLines={1}>{t("todaysSchedule", lang)}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{t("visualRoutineSubtitle", lang)}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <Pressable onPress={handleReadSchedule} style={styles.listenBtn} hitSlop={6}>
                <Ionicons name="volume-high" size={18} color="white" />
                <Text style={styles.listenBtnText}>{t("readAloudBtn", lang)}</Text>
              </Pressable>
              <LangBadge />
            </View>
          </View>
        </View>

        {/* View Mode & Preset Selector Row */}
        <View style={styles.controlsBar}>
          <View style={[styles.controlsInner, isTablet && styles.controlsInnerTablet]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
              {(Object.keys(PRESETS) as RoutinePreset[]).map((pKey) => {
                const p = PRESETS[pKey];
                const sel = activePreset === pKey;
                return (
                  <Pressable
                    key={pKey}
                    onPress={() => switchPreset(pKey)}
                    style={[styles.presetChip, sel && styles.presetChipActive]}
                  >
                    <Ionicons
                      name={p.icon as any}
                      size={14}
                      color={sel ? colors.forest : "#64748b"}
                    />
                    <Text style={[styles.presetChipText, sel && styles.presetChipTextActive]}>
                      {wordLabel(p.title, lang)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Toggle View: Timeline vs First-Then */}
            <View style={styles.viewToggleWrap}>
              <Pressable
                onPress={() => {
                  tapFeedback();
                  setViewMode("timeline");
                }}
                style={[styles.viewToggleBtn, viewMode === "timeline" && styles.viewToggleBtnActive]}
              >
                <Ionicons
                  name="list"
                  size={16}
                  color={viewMode === "timeline" ? colors.forest : "#64748b"}
                />
              </Pressable>
              <Pressable
                onPress={() => {
                  tapFeedback();
                  setViewMode("first_then");
                }}
                style={[styles.viewToggleBtn, viewMode === "first_then" && styles.viewToggleBtnActive]}
              >
                <Ionicons
                  name="arrow-forward-circle"
                  size={16}
                  color={viewMode === "first_then" ? colors.forest : "#64748b"}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={[styles.body, isTablet && styles.bodyTablet]} showsVerticalScrollIndicator={false}>
          {/* Progress Bar Card */}
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                {doneCount}/{items.length} {t("activitiesCompletedSuffix", lang)}
              </Text>
              <Text style={styles.progressPercent}>{percent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>
          </View>

          {/* ================= FIRST-THEN BOARD MODE ================= */}
          {viewMode === "first_then" && (() => {
            const ftFirstTheme = getScheduleVectorTheme(currentTask?.emoji, currentTask?.label);
            const ftNextTheme = getScheduleVectorTheme(nextTask?.emoji, nextTask?.label);
            return (
              <View style={[styles.firstThenCard, isTablet && styles.firstThenCardTablet]}>
                <View style={styles.firstThenHeader}>
                  <Ionicons name="sparkles" size={18} color="#f59e0b" />
                  <Text style={styles.firstThenTitle}>{t("firstThenBoardTitle", lang)}</Text>
                </View>
                <Text style={styles.firstThenSub}>{t("firstThenSubtitle", lang)}</Text>

                <View style={[styles.firstThenRow, isSmallPhone && { gap: 4 }, isTablet && { gap: 16 }]}>
                  {/* FIRST */}
                  <View style={[styles.ftBox, isTablet && styles.ftBoxTablet, isSmallPhone && styles.ftBoxSmallPhone, { borderColor: colors.blueDeep, backgroundColor: "#eff6ff" }]}>
                    <View style={[styles.ftBadge, { backgroundColor: colors.blueDeep }]}>
                      <Text style={styles.ftBadgeText}>{t("firstLabel", lang)}</Text>
                    </View>
                    <View style={[styles.ftIconCircle, { backgroundColor: ftFirstTheme.bg, borderColor: ftFirstTheme.border }]}>
                      <Ionicons name={ftFirstTheme.icon} size={isTablet ? 36 : isSmallPhone ? 24 : 30} color={ftFirstTheme.color} />
                    </View>
                    <Text style={[styles.ftTitle, isTablet && { fontSize: 17 }, isSmallPhone && { fontSize: 12 }]}>
                      {currentTask ? wordLabel(currentTask.label, lang) : t("activityFallback", lang)}
                    </Text>
                    <Text style={styles.ftTime}>{currentTask?.time}</Text>
                  </View>

                  {/* ARROW */}
                  <View style={styles.ftArrowWrap}>
                    <Ionicons name="arrow-forward" size={isTablet ? 36 : 28} color="#94a3b8" />
                  </View>

                  {/* THEN */}
                  <View style={[styles.ftBox, isTablet && styles.ftBoxTablet, isSmallPhone && styles.ftBoxSmallPhone, { borderColor: colors.greenDeep, backgroundColor: "#f0fdf4" }]}>
                    <View style={[styles.ftBadge, { backgroundColor: colors.greenDeep }]}>
                      <Text style={styles.ftBadgeText}>{t("thenLabel", lang)}</Text>
                    </View>
                    <View style={[styles.ftIconCircle, { backgroundColor: ftNextTheme.bg, borderColor: ftNextTheme.border }]}>
                      <Ionicons name={ftNextTheme.icon} size={isTablet ? 36 : isSmallPhone ? 24 : 30} color={ftNextTheme.color} />
                    </View>
                    <Text style={[styles.ftTitle, isTablet && { fontSize: 17 }, isSmallPhone && { fontSize: 12 }]}>
                      {nextTask ? wordLabel(nextTask.label, lang) : t("rewardPlayFallback", lang)}
                    </Text>
                    <Text style={styles.ftTime}>{nextTask?.time}</Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => {
                    const idx = items.findIndex((i) => i.id === currentTask?.id);
                    if (idx >= 0) toggle(idx);
                  }}
                  style={[styles.ftCompleteBtn, isTablet && { paddingVertical: 16 }]}
                >
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={[styles.ftCompleteBtnText, isTablet && { fontSize: 15 }]}>{t("markFirstDoneBtn", lang)}</Text>
                </Pressable>
              </View>
            );
          })()}

          {/* ================= TIMELINE LIST MODE ================= */}
          {viewMode === "timeline" && (
            <View style={[styles.timeline, isTablet && styles.timelineTablet]}>
              {items.map((item, idx) => {
                const isNow = item.state === "now";
                const isDone = item.state === "done";
                const itemTheme = getScheduleVectorTheme(item.emoji, item.label);
                return (
                  <View key={item.id} style={styles.timelineRow}>
                    <View style={styles.timelineRail}>
                      <Pressable
                        onPress={() => toggle(idx)}
                        style={[
                          styles.railDot,
                          isDone && { backgroundColor: colors.greenDeep, borderColor: colors.greenDeep },
                          isNow && { backgroundColor: colors.blueDeep, borderColor: colors.blueDeep },
                        ]}
                      >
                        {isDone && <Ionicons name="checkmark" size={14} color="white" />}
                        {isNow && <View style={styles.pulsingDot} />}
                      </Pressable>
                      {idx < items.length - 1 && <View style={styles.railLine} />}
                    </View>

                    <Pressable
                      onPress={() => toggle(idx)}
                      style={[
                        styles.card,
                        isTablet && styles.cardTablet,
                        isDone && styles.cardDone,
                        isNow && styles.cardNow,
                      ]}
                    >
                      <View style={[styles.itemEmojiWrap, { backgroundColor: itemTheme.bg, borderColor: itemTheme.border }, isTablet && { width: 50, height: 50, borderRadius: 16 }]}>
                        <Ionicons name={itemTheme.icon} size={isTablet ? 24 : 20} color={itemTheme.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.cardLabel,
                            isTablet && { fontSize: 17 },
                            isDone && { textDecorationLine: "line-through", color: "#94a3b8" },
                          ]}
                        >
                          {wordLabel(item.label, lang)}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                          <View
                            style={[
                              styles.statusChip,
                              isDone && { backgroundColor: "#dcfce7" },
                              isNow && { backgroundColor: "#dbeafe" },
                              item.state === "upcoming" && { backgroundColor: "#fef3c7" },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusChipText,
                                isDone && { color: "#166534" },
                                isNow && { color: "#1e40af" },
                                item.state === "upcoming" && { color: "#b45309" },
                              ]}
                            >
                              {isDone ? t("statusCompleted", lang) : isNow ? t("statusHappeningNow", lang) : t("statusUpcoming", lang)}
                            </Text>
                          </View>
                          <Text style={styles.cardTime}>{item.time}</Text>
                        </View>
                      </View>

                      <Ionicons
                        name={isDone ? "checkmark-circle" : "ellipse-outline"}
                        size={24}
                        color={isDone ? colors.greenDeep : "#cbd5e1"}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

          {/* Add Routine Task Button */}
          <Pressable onPress={() => setAddTaskModal(true)} style={[styles.addTaskBtn, isTablet && styles.addTaskBtnTablet]}>
            <Ionicons name="add-circle" size={20} color={colors.forest} />
            <Text style={styles.addTaskBtnText}>{t("addCustomRoutineTask", lang)}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      <TabBar active={tab} onChange={onTabChange} labels={labels} />

      {/* Add Task Modal */}
      <Modal visible={addTaskModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, isTablet && styles.modalCardTablet]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("addCustomRoutineActivity", lang)}</Text>
              <Pressable onPress={() => setAddTaskModal(false)} hitSlop={6}>
                <Ionicons name="close" size={22} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12, paddingVertical: 10 }}>
              <Text style={styles.inputLabel}>{t("activityNameLabel", lang)}</Text>
              <TextInput
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder={t("activityNamePlaceholder", lang)}
                style={styles.inputField}
              />

              <Text style={styles.inputLabel}>{t("scheduledTimeLabel", lang)}</Text>
              <TextInput
                value={newTaskTime}
                onChangeText={setNewTaskTime}
                placeholder={t("scheduledTimePlaceholder", lang)}
                style={styles.inputField}
              />

              <Text style={styles.inputLabel}>{t("activityIconLabel", lang)}</Text>
              <View style={styles.emojiGrid}>
                {["🪥", "🎒", "🍽️", "💊", "🧘", "🎨", "🧩", "🛁", "📖", "🚗", "⭐", "😴"].map((em) => (
                  <Pressable
                    key={em}
                    onPress={() => setNewTaskEmoji(em)}
                    style={[styles.emojiBtn, newTaskEmoji === em && styles.emojiBtnActive]}
                  >
                    <Text style={{ fontSize: 22 }}>{em}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.modalActions}>
                <Pressable onPress={() => setAddTaskModal(false)} style={styles.btnSecondary}>
                  <Text style={styles.btnSecondaryText}>{t("cancel", lang)}</Text>
                </Pressable>
                <Pressable onPress={handleCreateTask} style={styles.btnPrimary}>
                  <Ionicons name="add" size={18} color="white" />
                  <Text style={styles.btnPrimaryText}>{t("addToScheduleBtn", lang)}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    width: "100%",
  },
  headerInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    gap: 10,
  },
  headerInnerTablet: {
    maxWidth: 860,
    alignSelf: "center",
  },
  title: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  subtitle: { fontSize: 12, color: "#64748b", marginTop: 1 },
  listenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.forest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexShrink: 0,
  },
  listenBtnText: { color: "white", fontSize: 12, fontWeight: "700" },

  controlsBar: {
    backgroundColor: "#ffffff",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingRight: 12,
    width: "100%",
  },
  controlsInner: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  controlsInnerTablet: {
    maxWidth: 860,
    alignSelf: "center",
  },
  presetScroll: { paddingHorizontal: 16, gap: 8 },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
  },
  presetChipActive: { backgroundColor: "#ecfdf5" },
  presetChipText: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  presetChipTextActive: { color: colors.forest, fontWeight: "800" },

  viewToggleWrap: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 2,
    marginLeft: 6,
  },
  viewToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewToggleBtnActive: { backgroundColor: "#ffffff" },

  body: { padding: 16, gap: 14, paddingBottom: 60, width: "100%" },
  bodyTablet: { maxWidth: 860, alignSelf: "center", width: "100%", paddingHorizontal: 28 },

  progressCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
    width: "100%",
  },
  progressCardTablet: { maxWidth: 860 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressText: { fontSize: 13, color: "#475569", fontWeight: "700" },
  progressPercent: { fontSize: 15, fontWeight: "900", color: colors.greenDeep },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f1f5f9",
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.greenDeep, borderRadius: 4 },

  /* First-Then Board */
  firstThenCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 12,
    width: "100%",
  },
  firstThenCardTablet: {
    maxWidth: 860,
    padding: 24,
    borderRadius: 22,
  },
  firstThenHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  firstThenTitle: { fontSize: 15, fontWeight: "900", color: "#0f172a", letterSpacing: 0.5 },
  firstThenSub: { fontSize: 12, color: "#64748b", lineHeight: 16 },
  firstThenRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 8 },
  ftBox: {
    flex: 1,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 2,
    padding: 14,
    gap: 4,
  },
  ftBoxTablet: {
    padding: 22,
    borderRadius: 20,
  },
  ftBoxSmallPhone: {
    padding: 8,
    borderRadius: 12,
  },
  ftBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  ftBadgeText: { color: "white", fontSize: 10.5, fontWeight: "800" },
  ftIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  ftTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a", textAlign: "center" },
  ftTime: { fontSize: 11, color: "#64748b" },
  ftArrowWrap: { alignItems: "center", justifyContent: "center" },
  ftCompleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.forest,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ftCompleteBtnText: { color: "white", fontWeight: "800", fontSize: 13.5 },

  /* Timeline */
  timeline: { gap: 6, width: "100%" },
  timelineTablet: { maxWidth: 860 },
  timelineRow: { flexDirection: "row", gap: 12 },
  timelineRail: { alignItems: "center", width: 24 },
  railDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  pulsingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "white" },
  railLine: { width: 2, flex: 1, backgroundColor: "#e2e8f0", marginVertical: 2 },
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTablet: {
    padding: 18,
    borderRadius: 18,
  },
  cardNow: { borderColor: colors.blueDeep, borderWidth: 2, backgroundColor: "#f0f9ff" },
  cardDone: { backgroundColor: "#f8fafc", opacity: 0.8 },
  itemEmojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  statusChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusChipText: { fontSize: 10.5, fontWeight: "700" },
  cardTime: { fontSize: 11.5, color: "#64748b" },

  addTaskBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: colors.forest,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
    width: "100%",
  },
  addTaskBtnTablet: {
    maxWidth: 860,
    alignSelf: "center",
  },
  addTaskBtnText: { color: colors.forest, fontWeight: "800", fontSize: 13.5 },

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
    maxWidth: 440,
  },
  modalCardTablet: {
    maxWidth: 540,
    padding: 24,
    borderRadius: 22,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  inputLabel: { fontSize: 12, fontWeight: "700", color: "#475569", marginTop: 6 },
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
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  emojiBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emojiBtnActive: { backgroundColor: "#eff6ff", borderColor: colors.blueDeep },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 14 },
  btnSecondary: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnSecondaryText: { color: "#475569", fontWeight: "700", fontSize: 13 },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.forest,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnPrimaryText: { color: "white", fontWeight: "700", fontSize: 13 },
});
