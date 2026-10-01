import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../context/SettingsContext";
import { speak, stopSpeech } from "../modules/tts";
import { tapFeedback, selectFeedback } from "../modules/haptics";
import {
  loadAllStories,
  addCustomStory,
  deleteCustomStory,
  type BUILT_IN_STORIES,
} from "../modules/socialStories";
import type { SocialStory, SocialStoryPage } from "../types";
import { colors, radius, radiusLg } from "../theme";

interface Props {
  onBack: () => void;
}

type StoryCategory = "all" | "routine" | "health" | "school" | "emotions" | "social";

const CATEGORIES: { key: StoryCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "all", label: "All Stories", icon: "sparkles" },
  { key: "routine", label: "Daily Routines", icon: "calendar" },
  { key: "health", label: "Dentist & Doctors", icon: "medkit" },
  { key: "school", label: "School & Friends", icon: "school" },
  { key: "emotions", label: "Emotions & Calm", icon: "heart" },
  { key: "social", label: "Sharing & Manners", icon: "people" },
];

export interface StoryTheme {
  iconName: keyof typeof Ionicons.glyphMap;
  bg: string;
  borderColor: string;
  iconColor: string;
  tag: string;
  tagColor: string;
  tagBg: string;
}

export function getStoryTheme(story: SocialStory): StoryTheme {
  const id = story.id.toLowerCase();
  const title = story.title.toLowerCase();

  if (id.includes("dentist") || title.includes("dentist")) {
    return {
      iconName: "sparkles",
      bg: "#eff6ff",
      borderColor: "#bfdbfe",
      iconColor: "#2563eb",
      tag: "Health & Care",
      tagColor: "#1d4ed8",
      tagBg: "#dbeafe",
    };
  }
  if (id.includes("haircut") || title.includes("haircut")) {
    return {
      iconName: "cut",
      bg: "#fefce8",
      borderColor: "#fef08a",
      iconColor: "#d97706",
      tag: "Daily Routine",
      tagColor: "#b45309",
      tagBg: "#fef3c7",
    };
  }
  if (id.includes("school") || title.includes("school")) {
    return {
      iconName: "school",
      bg: "#f0fdf4",
      borderColor: "#bbf7d0",
      iconColor: "#16a34a",
      tag: "School & Friends",
      tagColor: "#15803d",
      tagBg: "#dcfce7",
    };
  }
  if (id.includes("calm") || id.includes("overwhelmed") || title.includes("overwhelmed") || story.category === "emotions") {
    return {
      iconName: "heart",
      bg: "#faf5ff",
      borderColor: "#e9d5ff",
      iconColor: "#9333ea",
      tag: "Emotions & Calm",
      tagColor: "#7e22ce",
      tagBg: "#f3e8ff",
    };
  }
  if (id.includes("sharing") || title.includes("sharing") || title.includes("turns") || story.category === "social") {
    return {
      iconName: "people",
      bg: "#fff1f2",
      borderColor: "#fecdd3",
      iconColor: "#e11d48",
      tag: "Social Skills",
      tagColor: "#be123c",
      tagBg: "#ffe4e6",
    };
  }
  if (id.includes("doctor") || title.includes("doctor") || story.category === "health") {
    return {
      iconName: "medkit",
      bg: "#f0f9ff",
      borderColor: "#bae6fd",
      iconColor: "#0284c7",
      tag: "Dentist & Doctors",
      tagColor: "#0369a1",
      tagBg: "#e0f2fe",
    };
  }
  if (id.includes("supermarket") || title.includes("supermarket") || title.includes("shop")) {
    return {
      iconName: "cart",
      bg: "#fff7ed",
      borderColor: "#fed7aa",
      iconColor: "#ea580c",
      tag: "Community",
      tagColor: "#c2410c",
      tagBg: "#ffedd5",
    };
  }

  return {
    iconName: "book",
    bg: "#f0fdfa",
    borderColor: "#99f6e4",
    iconColor: "#0d9488",
    tag: "Social Story",
    tagColor: "#0f766e",
    tagBg: "#ccfbf1",
  };
}

export function getPageIcon(emojiOrIcon?: string, fallback: keyof typeof Ionicons.glyphMap = "book"): keyof typeof Ionicons.glyphMap {
  if (!emojiOrIcon) return fallback;
  const map: Record<string, keyof typeof Ionicons.glyphMap> = {
    "🦷": "sparkles",
    "💺": "color-wand",
    "😷": "shield-checkmark",
    "🦁": "happy",
    "🪥": "sparkles",
    "⭐": "star",
    "💇": "cut",
    "🦸": "shield",
    "💦": "water",
    "✂️": "cut",
    "✨": "sparkles",
    "🏫": "school",
    "🎒": "briefcase",
    "👩‍🏫": "heart",
    "🙋": "hand-right",
    "🛝": "game-controller",
    "🏡": "home",
    "🌪️": "thunderstorm",
    "🎧": "headset",
    "🎈": "leaf",
    "💬": "chatbubbles",
    "🧸": "gift",
    "🌈": "sunny",
    "🧩": "extension-puzzle",
    "⏳": "hourglass",
    "🔟": "timer",
    "😄": "happy",
    "🩺": "pulse",
    "📏": "fitness",
    "💓": "heart",
    "🔦": "flashlight",
    "👍": "thumbs-up",
    "🛒": "cart",
    "🍎": "nutrition",
    "💳": "card",
    "🚗": "car",
    "🌙": "moon",
    "🛁": "water",
    "📖": "book",
    "😴": "bed",
  };
  return map[emojiOrIcon] || fallback;
}

export default function SocialStoriesScreen({ onBack }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { settings } = useSettings();
  const lang = settings.language;
  const voiceType = settings.voiceType || "boy";

  const [stories, setStories] = useState<SocialStory[]>([]);
  const [activeCat, setActiveCat] = useState<StoryCategory>("all");
  const [activeStory, setActiveStory] = useState<SocialStory | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // New Custom Story Modal
  const [createModal, setCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<SocialStory["category"]>("routine");
  const [newIcon, setNewIcon] = useState("📖");
  const [newDescription, setNewDescription] = useState("");
  const [newPagesText, setNewPagesText] = useState("");

  useEffect(() => {
    loadAllStories().then(setStories);
  }, []);

  const filteredStories = stories.filter((s) => {
    if (activeCat === "all") return true;
    return s.category === activeCat;
  });

  function openStory(s: SocialStory) {
    selectFeedback();
    setActiveStory(s);
    setCurrentPage(0);
    // Read first page aloud automatically
    if (s.pages[0]) {
      speak(s.pages[0].text, lang, settings.soundEnabled, settings.speechRate, voiceType);
    }
  }

  function closeStory() {
    stopSpeech();
    setActiveStory(null);
  }

  function goToPage(idx: number) {
    if (!activeStory) return;
    tapFeedback();
    const clamped = Math.max(0, Math.min(activeStory.pages.length - 1, idx));
    setCurrentPage(clamped);
    const p = activeStory.pages[clamped];
    if (p) {
      speak(p.text, lang, settings.soundEnabled, settings.speechRate, voiceType);
    }
  }

  function readCurrentPageAloud() {
    if (!activeStory) return;
    tapFeedback();
    const p = activeStory.pages[currentPage];
    if (p) {
      speak(p.text, lang, settings.soundEnabled, settings.speechRate, voiceType);
    }
  }

  async function handleSaveCustomStory() {
    if (!newTitle.trim()) return;
    const rawPages = newPagesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const pages: SocialStoryPage[] =
      rawPages.length > 0
        ? rawPages.map((text) => ({ text, emoji: newIcon }))
        : [{ text: "Step 1 of my story.", emoji: newIcon }];

    const story: SocialStory = {
      id: "custom_" + Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      icon: newIcon || "📖",
      description: newDescription.trim() || "A personalized social story.",
      pages,
    };

    await addCustomStory(story);
    const updated = await loadAllStories();
    setStories(updated);
    setCreateModal(false);
    setNewTitle("");
    setNewDescription("");
    setNewPagesText("");
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textDark} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.headerTitle}>Visual Social Stories</Text>
          <Text style={styles.headerSub}>Read-Aloud Guides for Daily Life</Text>
        </View>
        <Pressable onPress={() => setCreateModal(true)} style={styles.addStoryBtn}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addStoryText}>New Story</Text>
        </Pressable>
      </View>

      {/* Category Pills */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.key}
              onPress={() => {
                tapFeedback();
                setActiveCat(c.key);
              }}
              style={[styles.catPill, activeCat === c.key && styles.catPillActive]}
            >
              <Ionicons
                name={c.icon as any}
                size={16}
                color={activeCat === c.key ? "#fff" : colors.textMid}
              />
              <Text style={[styles.catPillText, activeCat === c.key && styles.catPillTextActive]}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Stories Grid */}
      <ScrollView contentContainerStyle={styles.gridContent}>
        <View style={[styles.storiesGrid, isTablet && { flexDirection: "row", flexWrap: "wrap" }]}>
          {filteredStories.map((story) => {
            const theme = getStoryTheme(story);
            return (
              <Pressable
                key={story.id}
                onPress={() => openStory(story)}
                style={({ pressed }) => [
                  styles.storyCard,
                  isTablet && { width: "48.5%" },
                  pressed && { transform: [{ scale: 0.985 }] },
                ]}
              >
                <View style={styles.storyCardTop}>
                  <View style={[styles.storyIconWrap, { backgroundColor: theme.bg, borderColor: theme.borderColor }]}>
                    <Ionicons name={theme.iconName} size={isTablet ? 28 : 24} color={theme.iconColor} />
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={[styles.themeTag, { backgroundColor: theme.tagBg }]}>
                      <Text style={[styles.themeTagText, { color: theme.tagColor }]}>{theme.tag}</Text>
                    </View>
                    <View style={styles.badge}>
                      <Ionicons name="layers-outline" size={11} color="#b45309" />
                      <Text style={styles.badgeText}>{story.pages.length} Steps</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.storyTitle}>{story.title}</Text>
                <Text style={styles.storyDesc} numberOfLines={2}>
                  {story.description}
                </Text>

                <View style={styles.storyFooter}>
                  <View style={styles.audioPill}>
                    <Ionicons name="volume-medium" size={13} color="#059669" />
                    <Text style={styles.audioPillText}>Speech Read-Aloud</Text>
                  </View>
                  <View style={[styles.readBtn, { backgroundColor: colors.forest }]}>
                    <Text style={styles.readBtnText}>Read</Text>
                    <Ionicons name="arrow-forward" size={13} color="#fff" />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* INTERACTIVE FULL-SCREEN STORY READER MODAL */}
      {activeStory && (
        <Modal visible={true} animationType="slide" onRequestClose={closeStory}>
          <SafeAreaView style={styles.readerContainer} edges={["top", "bottom"]}>
            {/* Reader Header */}
            <View style={styles.readerHeader}>
              <Pressable onPress={closeStory} hitSlop={10} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.textDark} />
              </Pressable>
              <View style={{ alignItems: "center" }}>
                <Text style={styles.readerStoryTitle}>{activeStory.title}</Text>
                <Text style={styles.readerPageCount}>
                  Step {currentPage + 1} of {activeStory.pages.length}
                </Text>
              </View>
              <Pressable onPress={readCurrentPageAloud} hitSlop={10} style={styles.speakBtn}>
                <Ionicons name="volume-high" size={22} color={colors.forest} />
              </Pressable>
            </View>

            {/* Reader Card Content */}
            <View style={styles.readerBody}>
              {(() => {
                const activeTheme = getStoryTheme(activeStory);
                const pageIcon = getPageIcon(activeStory.pages[currentPage]?.emoji, activeTheme.iconName);
                return (
                  <View style={styles.readerCard}>
                    <View style={[styles.illustrationWrap, { backgroundColor: activeTheme.bg, borderColor: activeTheme.borderColor }]}>
                      <View style={styles.illustrationInnerGlow}>
                        <Ionicons
                          name={pageIcon}
                          size={isTablet ? 56 : 46}
                          color={activeTheme.iconColor}
                        />
                      </View>
                    </View>

                    <Text style={styles.pageSentenceText}>
                      {activeStory.pages[currentPage]?.text}
                    </Text>

                    {/* Listen button on card */}
                    <Pressable
                      onPress={readCurrentPageAloud}
                      style={({ pressed }) => [
                        styles.cardSpeakRow,
                        { borderColor: activeTheme.borderColor },
                        pressed && { transform: [{ scale: 0.98 }] },
                      ]}
                    >
                      <Ionicons name="play-circle" size={24} color={activeTheme.iconColor} />
                      <Text style={[styles.cardSpeakRowText, { color: activeTheme.iconColor }]}>Listen again</Text>
                    </Pressable>
                  </View>
                );
              })()}

              {/* Progress Dots */}
              <View style={styles.dotRow}>
                {activeStory.pages.map((_, i) => {
                  const activeTheme = getStoryTheme(activeStory);
                  return (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i === currentPage && [styles.dotActive, { backgroundColor: activeTheme.iconColor, width: 22 }],
                        i < currentPage && [styles.dotDone, { backgroundColor: activeTheme.iconColor, opacity: 0.45 }],
                      ]}
                    />
                  );
                })}
              </View>
            </View>

            {/* Reader Footer Navigation */}
            <View style={styles.readerFooter}>
              <Pressable
                onPress={() => goToPage(currentPage - 1)}
                disabled={currentPage === 0}
                style={[styles.navBtn, currentPage === 0 && styles.navBtnDisabled]}
              >
                <Ionicons
                  name="arrow-back"
                  size={20}
                  color={currentPage === 0 ? colors.textLight : colors.textDark}
                />
                <Text
                  style={[
                    styles.navBtnText,
                    currentPage === 0 && { color: colors.textLight },
                  ]}
                >
                  Previous
                </Text>
              </Pressable>

              {currentPage === activeStory.pages.length - 1 ? (
                <Pressable
                  onPress={() => {
                    selectFeedback();
                    speak("Great job reading! You are all done!", lang, true, settings.speechRate, voiceType);
                    closeStory();
                  }}
                  style={[styles.navBtn, styles.navBtnDone]}
                >
                  <Text style={styles.navBtnDoneText}>All Done! ⭐</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => goToPage(currentPage + 1)} style={[styles.navBtn, styles.navBtnNext]}>
                  <Text style={styles.navBtnNextText}>Next</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </Pressable>
              )}
            </View>
          </SafeAreaView>
        </Modal>
      )}

      {/* CREATE CUSTOM STORY MODAL */}
      <Modal visible={createModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.createModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Custom Social Story</Text>
              <Pressable onPress={() => setCreateModal(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.textDark} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14 }}>
              <View>
                <Text style={styles.fieldLabel}>Story Title</Text>
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="e.g. Going to Leo's Swim Class"
                  placeholderTextColor={colors.textLight}
                  style={styles.modalInput}
                />
              </View>

              <View>
                <Text style={styles.fieldLabel}>Category</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {(["routine", "health", "school", "emotions", "social"] as const).map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setNewCategory(cat)}
                      style={[
                        styles.catChoice,
                        newCategory === cat && styles.catChoiceActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.catChoiceText,
                          newCategory === cat && styles.catChoiceTextActive,
                        ]}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View>
                <Text style={styles.fieldLabel}>Icon / Emoji</Text>
                <TextInput
                  value={newIcon}
                  onChangeText={setNewIcon}
                  placeholder="🏊"
                  style={[styles.modalInput, { width: 80, textAlign: "center", fontSize: 24 }]}
                />
              </View>

              <View>
                <Text style={styles.fieldLabel}>Brief Summary</Text>
                <TextInput
                  value={newDescription}
                  onChangeText={setNewDescription}
                  placeholder="What is this story about?"
                  placeholderTextColor={colors.textLight}
                  style={styles.modalInput}
                />
              </View>

              <View>
                <Text style={styles.fieldLabel}>Story Pages (One step per line)</Text>
                <Text style={{ fontSize: 12, color: colors.textMid, marginBottom: 6 }}>
                  Type each step on a new line. Angel Talk will turn each line into a full visual page.
                </Text>
                <TextInput
                  value={newPagesText}
                  onChangeText={setNewPagesText}
                  multiline
                  numberOfLines={5}
                  placeholder={`Today we are going to swim class.\nI change into my colorful swimsuit.\nThe coach is friendly and helps me kick.\nI have fun splashing with my kickboard!\nAll done! I dry off with my towel.`}
                  placeholderTextColor={colors.textLight}
                  style={[styles.modalInput, { height: 120, textAlignVertical: "top" }]}
                />
              </View>
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <Pressable
                onPress={() => setCreateModal(false)}
                style={[styles.modalActionBtn, { backgroundColor: "rgba(0,0,0,0.06)" }]}
              >
                <Text style={{ fontWeight: "700", color: colors.textMid }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveCustomStory}
                style={[styles.modalActionBtn, { backgroundColor: colors.forest, flex: 2 }]}
              >
                <Text style={{ fontWeight: "800", color: "#fff" }}>Save Story</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf7f2",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textDark,
  },
  headerSub: {
    fontSize: 11,
    color: colors.forest,
    fontWeight: "700",
  },
  addStoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.forest,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addStoryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  catPillActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  catPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMid,
  },
  catPillTextActive: {
    color: "#ffffff",
  },
  gridContent: {
    padding: 16,
    paddingBottom: 40,
  },
  storiesGrid: {
    gap: 14,
  },
  storyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  storyCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  storyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  themeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  themeTagText: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#b45309",
  },
  storyTitle: {
    fontSize: 16.5,
    fontWeight: "800",
    color: colors.textDark,
    marginBottom: 5,
  },
  storyDesc: {
    fontSize: 13,
    color: colors.textMid,
    lineHeight: 18.5,
    marginBottom: 14,
  },
  storyFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  audioPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  audioPillText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "700",
  },
  readBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  readBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  // READER STYLES
  readerContainer: {
    flex: 1,
    backgroundColor: "#faf7f2",
  },
  readerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  readerStoryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textDark,
  },
  readerPageCount: {
    fontSize: 12,
    color: colors.textMid,
    fontWeight: "600",
    marginTop: 2,
  },
  speakBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#e8f3ee",
    alignItems: "center",
    justifyContent: "center",
  },
  readerBody: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  readerCard: {
    width: "100%",
    maxWidth: 540,
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  illustrationWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  illustrationInnerGlow: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pageSentenceText: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textDark,
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 20,
  },
  cardSpeakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  cardSpeakRowText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.forestDark,
  },
  dotRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.forest,
  },
  dotDone: {
    backgroundColor: colors.forestLight,
  },
  readerFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.1)",
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textDark,
  },
  navBtnNext: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  navBtnNextText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
  },
  navBtnDone: {
    backgroundColor: "#d97706",
    borderColor: "#d97706",
  },
  navBtnDoneText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
  },
  // MODAL STYLES
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  createModalCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#fff",
    borderRadius: radiusLg,
    padding: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textDark,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: "#fbf9f5",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.textDark,
  },
  catChoice: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#fbf9f5",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  catChoiceActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  catChoiceText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMid,
  },
  catChoiceTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
