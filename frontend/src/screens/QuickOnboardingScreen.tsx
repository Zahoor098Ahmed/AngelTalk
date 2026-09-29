import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../context/SettingsContext";
import { previewVoice } from "../modules/tts";
import { tapFeedback, selectFeedback } from "../modules/haptics";
import { createPersonalizedFavoritesCategory } from "../modules/customCategories";
import { addChild, updateChild } from "../modules/storage";
import type { ChildProfile, UserRole, VoiceType, LanguageCode } from "../types";
import { colors, radius, radiusLg } from "../theme";
import Logo from "../components/Logo";

interface Props {
  onComplete: (child: ChildProfile) => void;
  onSkipToNormal?: () => void;
}

const PRESET_FOODS = [
  { label: "Pizza", emoji: "🍕" },
  { label: "Apple", emoji: "🍎" },
  { label: "Chicken Nuggets", emoji: "🍗" },
  { label: "Milk", emoji: "🥛" },
  { label: "Juice", emoji: "🧃" },
  { label: "Banana", emoji: "🍌" },
  { label: "Pasta", emoji: "🍝" },
  { label: "Ice Cream", emoji: "🍦" },
  { label: "French Fries", emoji: "🍟" },
  { label: "Water", emoji: "💧" },
  { label: "Cookie", emoji: "🍪" },
  { label: "Sandwich", emoji: "🥪" },
];

const PRESET_FAMILY = [
  { label: "Mom", emoji: "👩" },
  { label: "Dad", emoji: "👨" },
  { label: "Sister", emoji: "👧" },
  { label: "Brother", emoji: "👦" },
  { label: "Grandma", emoji: "👵" },
  { label: "Grandpa", emoji: "👴" },
  { label: "Teacher", emoji: "👩‍🏫" },
  { label: "Therapist", emoji: "🩺" },
  { label: "Pet Dog", emoji: "🐶" },
  { label: "Pet Cat", emoji: "🐱" },
];

const PRESET_ACTIVITIES = [
  { label: "iPad", emoji: "📱" },
  { label: "Blocks", emoji: "🧱" },
  { label: "Swings", emoji: "🛝" },
  { label: "Music", emoji: "🎵" },
  { label: "Coloring", emoji: "🎨" },
  { label: "Toy Trains", emoji: "🚂" },
  { label: "Bubbles", emoji: "🫧" },
  { label: "Storybook", emoji: "📚" },
  { label: "Car Ride", emoji: "🚗" },
  { label: "Swimming", emoji: "🏊" },
];

export default function QuickOnboardingScreen({ onComplete, onSkipToNormal }: Props) {
  const { settings, update } = useSettings();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [role, setRole] = useState<UserRole>("parent");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("5");
  const [voiceType, setVoiceType] = useState<VoiceType>("boy");
  const [language, setLanguage] = useState<LanguageCode>(settings.language || "en-US");

  // Favourites
  const [selectedFoods, setSelectedFoods] = useState<string[]>(["Pizza", "Apple", "Water", "Juice"]);
  const [customFood, setCustomFood] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string[]>(["Mom", "Dad"]);
  const [customFamily, setCustomFamily] = useState("");
  const [selectedActivities, setSelectedActivities] = useState<string[]>(["iPad", "Swings", "Music"]);
  const [customActivity, setCustomActivity] = useState("");

  const [generating, setGenerating] = useState(false);

  function toggleItem(list: string[], setList: (v: string[]) => void, item: string) {
    tapFeedback();
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  }

  function addCustom(
    list: string[],
    setList: (v: string[]) => void,
    val: string,
    clearVal: (v: string) => void
  ) {
    if (!val.trim()) return;
    tapFeedback();
    const clean = val.trim();
    if (!list.includes(clean)) {
      setList([...list, clean]);
    }
    clearVal("");
  }

  async function handleFinish() {
    setGenerating(true);
    selectFeedback();

    const name = childName.trim() || "My Angel";
    const age = parseInt(childAge, 10) || 5;

    // 1. Create top-priority personal category with whole-phrase cards
    createPersonalizedFavoritesCategory(name, {
      foods: selectedFoods,
      family: selectedFamily,
      activities: selectedActivities,
    });

    // 2. Create Child Profile
    const newChild: ChildProfile = {
      id: "child_" + Date.now(),
      name,
      age,
      diagnoses: ["autism", "speech-delay"],
      allowedTags: ["aac", "stories", "social", "music"],
      embedding: [],
      enrolledAt: Date.now(),
      stars: 10,
      badges: ["🌟 First Words Explorer"],
      role,
      voiceType,
      boardMode: "phrase", // Tala phrase-first GLP default
      simpleMode: true,
      bilingualDisplay: false,
      favourites: {
        foods: selectedFoods,
        family: selectedFamily.map((f) => ({ name: f, relation: f })),
        activities: selectedActivities,
      },
    };

    addChild(newChild);

    // 3. Update App Settings
    update({
      voiceType,
      boardMode: "phrase",
      simpleMode: true,
      userRole: role,
      language,
      languageSelected: true,
    });

    setTimeout(() => {
      setGenerating(false);
      onComplete(newChild);
    }, 700);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Logo size={36} />
          <View>
            <Text style={styles.brandTitle}>Angel Talk</Text>
            <Text style={styles.stepSubtitle}>90-Second Personalized Setup</Text>
          </View>
        </View>

        {onSkipToNormal && (
          <Pressable onPress={onSkipToNormal} hitSlop={10} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressBar,
            { width: step === 1 ? "25%" : step === 2 ? "50%" : step === 3 ? "75%" : "100%" },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* STEP 1: ROLE SELECTION */}
        {step === 1 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepNumber}>STEP 1 OF 3</Text>
            <Text style={styles.title}>Who is setting up Angel Talk?</Text>
            <Text style={styles.description}>
              We customize the vocabulary, tools, and layout based on your daily needs.
            </Text>

            <View style={{ gap: 12, marginTop: 16 }}>
              <Pressable
                onPress={() => {
                  tapFeedback();
                  setRole("parent");
                }}
                style={[styles.roleCard, role === "parent" && styles.roleCardActive]}
              >
                <View style={styles.roleIconWrap}>
                  <Text style={{ fontSize: 28 }}>👨‍👩‍👧</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roleTitle}>Parent or Family Member</Text>
                  <Text style={styles.roleDesc}>
                    Simple, warm home communication for my child with no technical hassle.
                  </Text>
                </View>
                <Ionicons
                  name={role === "parent" ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={role === "parent" ? colors.forest : colors.textLight}
                />
              </Pressable>

              <Pressable
                onPress={() => {
                  tapFeedback();
                  setRole("educator");
                }}
                style={[styles.roleCard, role === "educator" && styles.roleCardActive]}
              >
                <View style={styles.roleIconWrap}>
                  <Text style={{ fontSize: 28 }}>🏫</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roleTitle}>Special Educator or Teacher</Text>
                  <Text style={styles.roleDesc}>
                    Classroom routines, school subjects, and student independence.
                  </Text>
                </View>
                <Ionicons
                  name={role === "educator" ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={role === "educator" ? colors.forest : colors.textLight}
                />
              </Pressable>

              <Pressable
                onPress={() => {
                  tapFeedback();
                  setRole("slp");
                }}
                style={[styles.roleCard, role === "slp" && styles.roleCardActive]}
              >
                <View style={styles.roleIconWrap}>
                  <Text style={{ fontSize: 28 }}>🩺</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roleTitle}>Speech-Language Pathologist (SLP)</Text>
                  <Text style={styles.roleDesc}>
                    Clinical therapy goals, IEP milestone tracking, and motor planning.
                  </Text>
                </View>
                <Ionicons
                  name={role === "slp" ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={role === "slp" ? colors.forest : colors.textLight}
                />
              </Pressable>
            </View>

            <Pressable
              onPress={() => {
                selectFeedback();
                setStep(2);
              }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>Next: Child & Voice</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          </View>
        )}

        {/* STEP 2: CHILD INFO & VOICE PICKER */}
        {step === 2 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepNumber}>STEP 2 OF 3</Text>
            <Text style={styles.title}>Tell us about your child</Text>
            <Text style={styles.description}>
              Every child deserves a voice that sounds like them.
            </Text>

            <View style={{ gap: 14, marginTop: 16 }}>
              <View>
                <Text style={styles.inputLabel}>Child's First Name</Text>
                <TextInput
                  value={childName}
                  onChangeText={setChildName}
                  placeholder="e.g. Leo, Maya, Zain..."
                  placeholderTextColor={colors.textLight}
                  style={styles.textInput}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  value={childAge}
                  onChangeText={setChildAge}
                  keyboardType="numeric"
                  placeholder="5"
                  placeholderTextColor={colors.textLight}
                  style={[styles.textInput, { width: 100 }]}
                />
              </View>

              {/* Voice Options */}
              <View>
                <Text style={styles.inputLabel}>Choose Speaking Voice</Text>
                <Text style={styles.inputSubtext}>
                  Tala uses natural voices. Select a voice style for Angel Talk:
                </Text>

                <View style={styles.voiceGrid}>
                  {(
                    [
                      { key: "boy", label: "Boy Voice", icon: "👦" },
                      { key: "girl", label: "Girl Voice", icon: "👧" },
                      { key: "woman", label: "Woman Voice", icon: "👩" },
                      { key: "man", label: "Man Voice", icon: "👨" },
                    ] as const
                  ).map((v) => (
                    <Pressable
                      key={v.key}
                      onPress={() => {
                        tapFeedback();
                        setVoiceType(v.key);
                      }}
                      style={[styles.voiceCard, voiceType === v.key && styles.voiceCardActive]}
                    >
                      <Text style={{ fontSize: 28 }}>{v.icon}</Text>
                      <Text
                        style={[
                          styles.voiceCardText,
                          voiceType === v.key && { color: colors.forestDark, fontWeight: "800" },
                        ]}
                      >
                        {v.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Voice Test Preview Button */}
                <Pressable
                  onPress={() => previewVoice(voiceType, language)}
                  style={styles.testVoiceBtn}
                >
                  <Ionicons name="volume-high" size={20} color={colors.forest} />
                  <Text style={styles.testVoiceText}>Play Sample Voice</Text>
                </Pressable>
              </View>

              {/* Language Selection */}
              <View>
                <Text style={styles.inputLabel}>Board Language</Text>
                <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                  <Pressable
                    onPress={() => {
                      tapFeedback();
                      setLanguage("en-US");
                    }}
                    style={[styles.langChip, language === "en-US" && styles.langChipActive]}
                  >
                    <Text style={styles.langChipText}>English (US)</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      tapFeedback();
                      setLanguage("ar-SA");
                    }}
                    style={[styles.langChip, language === "ar-SA" && styles.langChipActive]}
                  >
                    <Text style={styles.langChipText}>العربية (Arabic)</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.btnRow}>
              <Pressable onPress={() => setStep(1)} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={18} color={colors.textMid} />
                <Text style={styles.backBtnText}>Back</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  selectFeedback();
                  setStep(3);
                }}
                style={styles.primaryBtnFlex}
              >
                <Text style={styles.primaryBtnText}>Next: Favourites</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        )}

        {/* STEP 3: PERSONALIZED FAVOURITES */}
        {step === 3 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepNumber}>STEP 3 OF 3</Text>
            <Text style={styles.title}>
              What does {childName.trim() || "your child"} love?
            </Text>
            <Text style={styles.description}>
              Instead of a generic starter board, Angel Talk automatically builds ready-to-speak
              cards for their real daily favourites!
            </Text>

            {/* Favorite Foods */}
            <View style={styles.favSection}>
              <Text style={styles.favSectionTitle}>🍽️ Favorite Foods & Drinks</Text>
              <Text style={styles.favSectionSub}>
                Cards will say: "I want [food], please!"
              </Text>
              <View style={styles.chipWrap}>
                {PRESET_FOODS.map((f) => {
                  const sel = selectedFoods.includes(f.label);
                  return (
                    <Pressable
                      key={f.label}
                      onPress={() => toggleItem(selectedFoods, setSelectedFoods, f.label)}
                      style={[styles.chip, sel && styles.chipActive]}
                    >
                      <Text style={{ fontSize: 16 }}>{f.emoji}</Text>
                      <Text style={[styles.chipText, sel && styles.chipTextActive]}>{f.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.addInputRow}>
                <TextInput
                  value={customFood}
                  onChangeText={setCustomFood}
                  placeholder="Add other favorite food..."
                  placeholderTextColor={colors.textLight}
                  style={styles.addInput}
                />
                <Pressable
                  onPress={() => addCustom(selectedFoods, setSelectedFoods, customFood, setCustomFood)}
                  style={styles.addBtn}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </Pressable>
              </View>
            </View>

            {/* Family & Loved Ones */}
            <View style={styles.favSection}>
              <Text style={styles.favSectionTitle}>❤️ Family & People</Text>
              <Text style={styles.favSectionSub}>
                Cards will say: "I want to see [person]!"
              </Text>
              <View style={styles.chipWrap}>
                {PRESET_FAMILY.map((f) => {
                  const sel = selectedFamily.includes(f.label);
                  return (
                    <Pressable
                      key={f.label}
                      onPress={() => toggleItem(selectedFamily, setSelectedFamily, f.label)}
                      style={[styles.chip, sel && styles.chipActive]}
                    >
                      <Text style={{ fontSize: 16 }}>{f.emoji}</Text>
                      <Text style={[styles.chipText, sel && styles.chipTextActive]}>{f.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.addInputRow}>
                <TextInput
                  value={customFamily}
                  onChangeText={setCustomFamily}
                  placeholder="Add name (e.g. Aunt Sarah)..."
                  placeholderTextColor={colors.textLight}
                  style={styles.addInput}
                />
                <Pressable
                  onPress={() =>
                    addCustom(selectedFamily, setSelectedFamily, customFamily, setCustomFamily)
                  }
                  style={styles.addBtn}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </Pressable>
              </View>
            </View>

            {/* Activities & Toys */}
            <View style={styles.favSection}>
              <Text style={styles.favSectionTitle}>🎮 Toys & Favorite Activities</Text>
              <Text style={styles.favSectionSub}>
                Cards will say: "Can I play [activity]?"
              </Text>
              <View style={styles.chipWrap}>
                {PRESET_ACTIVITIES.map((a) => {
                  const sel = selectedActivities.includes(a.label);
                  return (
                    <Pressable
                      key={a.label}
                      onPress={() => toggleItem(selectedActivities, setSelectedActivities, a.label)}
                      style={[styles.chip, sel && styles.chipActive]}
                    >
                      <Text style={{ fontSize: 16 }}>{a.emoji}</Text>
                      <Text style={[styles.chipText, sel && styles.chipTextActive]}>{a.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.addInputRow}>
                <TextInput
                  value={customActivity}
                  onChangeText={setCustomActivity}
                  placeholder="Add toy or special activity..."
                  placeholderTextColor={colors.textLight}
                  style={styles.addInput}
                />
                <Pressable
                  onPress={() =>
                    addCustom(
                      selectedActivities,
                      setSelectedActivities,
                      customActivity,
                      setCustomActivity
                    )
                  }
                  style={styles.addBtn}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </Pressable>
              </View>
            </View>

            {/* Submit */}
            <View style={[styles.btnRow, { marginTop: 24 }]}>
              <Pressable onPress={() => setStep(2)} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={18} color={colors.textMid} />
                <Text style={styles.backBtnText}>Back</Text>
              </Pressable>

              <Pressable
                onPress={handleFinish}
                disabled={generating}
                style={[styles.primaryBtnFlex, { backgroundColor: "#d97706" }]}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>Build Personal Board</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textDark,
    letterSpacing: -0.3,
  },
  stepSubtitle: {
    fontSize: 12,
    color: colors.forest,
    fontWeight: "700",
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  skipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMid,
  },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(0,0,0,0.06)",
    width: "100%",
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.forest,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepBox: {
    backgroundColor: "#ffffff",
    borderRadius: radiusLg,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.forest,
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textDark,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: colors.textMid,
    lineHeight: 20,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fbf9f5",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: radius,
    padding: 14,
  },
  roleCardActive: {
    borderColor: colors.forest,
    backgroundColor: "#f0f7f4",
  },
  roleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textDark,
  },
  roleDesc: {
    fontSize: 12,
    color: colors.textMid,
    marginTop: 2,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: 6,
  },
  inputSubtext: {
    fontSize: 12,
    color: colors.textMid,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#fbf9f5",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textDark,
    fontWeight: "600",
  },
  voiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  voiceCard: {
    width: "48%",
    backgroundColor: "#fbf9f5",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
    paddingVertical: 12,
    alignItems: "center",
    gap: 6,
  },
  voiceCardActive: {
    borderColor: colors.forest,
    backgroundColor: "#e8f3ee",
  },
  voiceCardText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textDark,
  },
  testVoiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#e8f3ee",
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  testVoiceText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.forestDark,
  },
  langChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#fbf9f5",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  langChipActive: {
    borderColor: colors.forest,
    backgroundColor: "#e8f3ee",
  },
  langChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textDark,
  },
  favSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  favSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textDark,
  },
  favSectionSub: {
    fontSize: 12,
    color: colors.textMid,
    marginBottom: 10,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#fbf9f5",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  chipActive: {
    borderColor: colors.forest,
    backgroundColor: "#e8f3ee",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textDark,
  },
  chipTextActive: {
    color: colors.forestDark,
    fontWeight: "700",
  },
  addInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  addInput: {
    flex: 1,
    backgroundColor: "#fbf9f5",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    color: colors.textDark,
  },
  addBtn: {
    backgroundColor: colors.forest,
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textMid,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.forest,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 20,
  },
  primaryBtnFlex: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.forest,
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
  },
});
