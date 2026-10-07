import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  I18nManager,
  Alert,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import type { ChildProfile, CustomCategory, CustomWord, TabScreen } from "../types";
import { useSettings } from "../context/SettingsContext";
import {
  ensureCategoriesLoaded,
  topLevelCategories,
  visibleTopLevelCategories,
  visibleChildCategories,
  getCategory,
  createBlankCategory,
  bottomTabCategories,
  coreWords,
  setSeedLanguage,
  retranslateSeedBoard,
  recordWordUseByWordId,
  subscribeCategories,
} from "../modules/customCategories";
import { playWord, playSentence, stopSentence, type SpokenWord } from "../modules/audio";
import { dictUrl } from "../modules/imageLibrary";
import { getPictogramUrl } from "../modules/aacPictograms";
import { recordWordUsage, recordSentencePlayed, recordCorrectionUsed } from "../modules/storage";
import { ensurePredictionLoaded, learnSentence, predictNext, suggestionTiles } from "../modules/wordPrediction";
import { tapFeedback, selectFeedback } from "../modules/haptics";
import { t, wordLabel, canonicalWordEn } from "../modules/i18n";
import LangBadge from "../components/LangBadge";
import Mascot from "../components/Mascot";
import TabBar from "../components/TabBar";
import AddByVoiceScreen from "./AddByVoiceScreen";
import { colors } from "../theme";
import { getVerbForms, detectVerbForm, isContinuousForm } from "../modules/verbForms";

interface Props {
  child: ChildProfile;
  tab: TabScreen;
  onTabChange: (tab: TabScreen) => void;
  onOpenCategories?: (categoryId?: string) => void;
  labels: Record<TabScreen, string>;
}

interface Chip extends SpokenWord {
  id: string;
  emoji: string;
  imageUri?: string;
}

/** Formats a sequence of AAC words from multiple categories into a natural English daily routine sentence */
export function formatNaturalEnglishSentence(rawWords: string[]): string {
  if (!rawWords || rawWords.length === 0) return "";
  const tokens = rawWords.map((w) => w.trim()).filter(Boolean);
  if (tokens.length === 0) return "";
  if (tokens.length === 1) {
    const single = tokens[0] || "";
    return single.charAt(0).toUpperCase() + single.slice(1);
  }

  let text = tokens.join(" ");

  // Ensure standalone 'i' is capitalized as pronoun
  text = text.replace(/\bi\b/g, "I");

  // Auxiliary insertion for present continuous verbs if missing:
  // e.g. "I going school" -> "I am going school", "I eating apple" -> "I am eating apple"
  text = text.replace(/\bI\s+(going|eating|drinking|playing|sleeping|coming|washing|reading|watching|helping|walking|running|cleaning)\b/gi, (_, verb) => `I am ${verb.toLowerCase()}`);

  // Movement verbs with destination prepositions:
  // "going school" / "go school" / "went school" -> "... to school"
  text = text.replace(/\b(go|going|went|gone|walk|walking|walked|run|running|ran)\s+(school|class|hospital|doctor|dentist|church|mosque|work)\b/gi, (_, verb, place) => `${verb} to ${place.toLowerCase()}`);

  // Movement verbs with places that take 'to the':
  // "going park" -> "going to the park"
  text = text.replace(/\b(go|going|went|gone|walk|walking|walked)\s+(park|playground|bathroom|washroom|toilet|store|market|kitchen|bedroom|zoo|beach)\b/gi, (_, verb, place) => `${verb} to the ${place.toLowerCase()}`);

  // Prevent "to home" or "to the home": "going home" is natural English
  text = text.replace(/\b(go|going|went|gone)\s+(?:to\s+(?:the\s+)?)?home\b/gi, (_, verb) => `${verb} home`);

  // Already has auxiliary: "am going school" -> "am going to school"
  text = text.replace(/\b(am|is|are|was|were)\s+going\s+(school)\b/gi, (_, aux, place) => `${aux} going to ${place.toLowerCase()}`);
  text = text.replace(/\b(am|is|are|was|were)\s+going\s+(park|playground|bathroom|washroom|store|market|zoo)\b/gi, (_, aux, place) => `${aux} going to the ${place.toLowerCase()}`);

  // General "to" with places if "to school", "to park"
  text = text.replace(/\bto\s+(park|bathroom|washroom|kitchen|playground|store|bedroom|zoo|beach)\b/gi, (_, place) => `to the ${place.toLowerCase()}`);

  // Normalizations for daily routine AAC combinations:
  // "I want eat" -> "I want to eat", "I want go" -> "I want to go"
  text = text.replace(/\bI want\s+(eat|drink|play|go|sleep|wash|read|watch|clean|help)\b/gi, (_, verb) => `I want to ${verb.toLowerCase()}`);
  text = text.replace(/\bI like\s+(eat|drink|play|read|watch)\b/gi, (_, verb) => `I like to ${verb.toLowerCase()}`);
  text = text.replace(/\bI need\s+(eat|drink|sleep|wash|go)\b/gi, (_, verb) => `I need to ${verb.toLowerCase()}`);

  // "play toy" -> "play with toy", "playing toy" -> "playing with toy"
  text = text.replace(/\b(play|playing|played)\s+(toy|toys|ball|blocks|tablet|doll)\b/gi, (_, verb, item) => `${verb} with ${item.toLowerCase()}`);

  // "Mom help" -> "Mom, help"
  text = text.replace(/\b(Mom|Dad|Teacher|Doctor|Friend)\s+help\b/gi, (_, person) => `${person}, help`);

  // Polite comma before please: "water please" -> "water, please"
  text = text.replace(/\s+please\b/gi, ", please");

  // Clean double spaces
  text = text.replace(/\s{2,}/g, " ").trim();

  // Natural typography casing: capitalize initial word and proper nouns ("I", "Mom", "Dad"),
  // lowercase other mid-sentence words ("Going" -> "going", "School" -> "school")
  const properNouns = new Set(["I", "Mom", "Dad", "Teacher", "Doctor"]);
  const sentenceWords = text.split(/\s+/).map((w, idx) => {
    if (idx === 0) return w.charAt(0).toUpperCase() + w.slice(1);
    if (properNouns.has(w) || w === "I") return w;
    return w.toLowerCase();
  });
  let formatted = sentenceWords.join(" ");

  // Capitalize first character
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);

  // Ensure ending punctuation
  if (!/[.!?]$/.test(formatted)) {
    formatted += ".";
  }

  return formatted;
}

/** Card pictogram illustration with automatic ARASAAC lookup and emoji fallback */
function CardPic({
  label,
  imageUri,
  emoji,
  size = 44,
}: {
  label: string;
  imageUri?: string;
  emoji: string;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const enLabel = canonicalWordEn(label) || label;
  const uri = useMemo(() => {
    return (
      imageUri ||
      getPictogramUrl(enLabel) ||
      getPictogramUrl(label) ||
      (!imgError ? dictUrl(enLabel) || dictUrl(label) : null)
    );
  }, [imageUri, label, enLabel, imgError]);

  if (uri && !imgError) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size }}
        resizeMode="contain"
        onError={() => setImgError(true)}
      />
    );
  }
  return <Text style={{ fontSize: Math.max(18, Math.round(size * 0.72)) }}>{emoji || "🔹"}</Text>;
}

export default function AACBoardScreen({ child, tab, onTabChange, onOpenCategories, labels }: Props) {
  const { settings, update } = useSettings();
  const lang = settings.language;
  const boardMode = settings.boardMode || "phrase";
  const bilingual = settings.bilingualDisplay || false;
  const voiceType = settings.voiceType || "boy";
  const { width } = useWindowDimensions();

  // Responsive columns: supports density levels (1, 2, 4, 8, 16, 28, 35+) or window dimensions
  const cols = useMemo(() => {
    if (child.buttonDensity) {
      if (child.buttonDensity === 1) return 1;
      if (child.buttonDensity === 2) return 2;
      if (child.buttonDensity <= 4) return 2;
      if (child.buttonDensity <= 8) return 3;
      if (child.buttonDensity <= 16) return 4;
      if (child.buttonDensity <= 28) return 6;
      return 7;
    }
    if (width >= 880) return 7;
    if (width >= 680) return 6;
    if (width >= 500) return 5;
    return Math.min(5, Math.max(3, settings.boardColumns || 4));
  }, [width, settings.boardColumns, child.buttonDensity]);

  // Scale the picture to the tile's actual box size instead of a fixed
  // constant — on wide screens with few columns a hardcoded small icon was
  // left floating in a mostly-empty card.
  const cardPicSize = Math.round(Math.min(130, Math.max(36, (width / cols) * 0.5)));

  const [ready, setReady] = useState(false);
  const [path, setPath] = useState<string[]>([]); // category id stack
  const [sentence, setSentence] = useState<Chip[]>([]);
  const [tick, setTick] = useState(0); // re-read after edits elsewhere
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceTarget, setVoiceTarget] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    void ensurePredictionLoaded();
    ensureCategoriesLoaded().then(() => {
      setReady(true);
      // Auto-select "Core" (or first category) on load so communication cards appear immediately
      const tabs = bottomTabCategories(lang);
      const coreTab =
        tabs.find((t) => {
          const en = (canonicalWordEn(t.name) || t.name).toLowerCase();
          return en === "core" || t.name === "بنیادی" || t.name === "أساسي";
        }) ?? tabs[0];
      if (coreTab?.id) {
        setPath([coreTab.id]);
      }
    });
  }, []);

  // Keep the built-in folder/word names in sync with the *actual* current
  // language, independent of whichever screen last toggled it (or of any
  // start-up race between settings hydrating and categories loading) — a
  // stale seedLang at load time could otherwise leave folder names like
  // "Schools"/"Sports" translated even while the app is set to English.
  useEffect(() => {
    if (!ready) return;
    setSeedLanguage(lang);
    retranslateSeedBoard(lang);
    // The sentence-building strip holds its own frozen copy of each tapped
    // word's text, so it doesn't pick up retranslateSeedBoard's changes to
    // the underlying category data — re-translate the chips in place too,
    // otherwise a phrase spoken in one language stays stuck in it even
    // after the whole rest of the board has switched.
    setSentence((prev) => prev.map((c) => ({ ...c, label: wordLabel(c.label, lang) })));
    setTick((n) => n + 1);
  }, [ready, lang]);

  const currentId = path[path.length - 1] ?? null;
  const current = currentId ? getCategory(currentId) : null;
  const folders: CustomCategory[] = useMemo(
    () => (currentId ? visibleChildCategories(currentId) : visibleTopLevelCategories()),
    [currentId, ready, tick],
  );
  const isCoreGridMode = child.pageSetStyle === "core-grid";

  const isCore = useMemo(() => {
    if (!current) return true;
    const en = (canonicalWordEn(current.name) || current.name).toLowerCase();
    return en === "core" || current.name === "أساسي" || current.name === "بنیادی";
  }, [current]);

  const rawWords: CustomWord[] = useMemo(() => {
    if (isCoreGridMode && (!currentId || isCore)) {
      // Fixed-position core words locked at top slots for motor-memory
      const cores = coreWords();
      const nonCores = current ? current.words.filter((w: CustomWord) => !w.hidden && !cores.some((c) => canonicalWordEn(c.label).toLowerCase() === canonicalWordEn(w.label).toLowerCase())) : [];
      return [...cores, ...nonCores];
    }
    return current ? [...current.words].filter((w) => !w.hidden).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : [];
  }, [current, currentId, isCoreGridMode, isCore, ready, tick]);

  const isActionsCategory = useMemo(() => {
    if (!current) return false;
    const isActName = (str: string) => {
      const n = (str || "").trim().toLowerCase();
      return (
        n.includes("action") ||
        n.includes("verb") ||
        n.includes("افعال") ||
        n.includes("أفعال") ||
        n.includes("کام")
      );
    };
    if (isActName(current.name)) return true;
    if (current.parentCategoryId) {
      const parent = getCategory(current.parentCategoryId);
      if (parent && isActName(parent.name)) return true;
    }
    return false;
  }, [current]);

  const words: CustomWord[] = useMemo(() => {
    // If current shelf has child subcategories/folders, loose words belong strictly INSIDE those folders
    if (folders.length > 0) return [];
    let list = rawWords;
    if (child.buttonDensity && child.buttonDensity > 0) {
      list = rawWords.slice(0, child.buttonDensity);
    }
    return list;
  }, [rawWords, folders.length, child.buttonDensity]);

  // Real-time live sync: recompute whenever caregiver edits, adds, hides, or deletes any word or category
  useEffect(() => {
    const unsub = subscribeCategories(() => {
      setTick((n) => n + 1);
    });
    return unsub;
  }, []);

  // If the open category was deleted or hidden by the caregiver, safely fall back to Core
  useEffect(() => {
    if (ready && currentId) {
      const cat = getCategory(currentId);
      if (!cat || cat.hidden) {
        const tabs = bottomTabCategories(lang);
        const coreTab =
          tabs.find((t) => {
            const en = (canonicalWordEn(t.name) || t.name).toLowerCase();
            return en === "core" || t.name === "بنیادی" || t.name === "أساسي";
          }) ?? tabs[0];
        setPath(coreTab?.id ? [coreTab.id] : []);
      }
    }
  }, [currentId, ready, tick, lang]);

  // Predictive next-word tiles under the sentence strip ("I" -> want, need, like…)
  const suggestions: CustomWord[] = useMemo(
    () => (ready && sentence.length > 0 ? suggestionTiles(predictNext(sentence.map((c) => c.label)), lang) : []),
    [ready, sentence, lang, tick],
  );

  const bottomTabs = useMemo(() => (ready ? bottomTabCategories(lang) : []), [ready, tick, lang]);

  function speakWords(): SpokenWord[] {
    return sentence.map((c) => ({
      label: wordLabel(c.label, lang),
      audioUri: c.audioUri,
      useTextToSpeech: c.useTextToSpeech,
    }));
  }

  /** Child taps "Make a word": add straight into the open folder, or a "My Words" folder. */
  function startVoiceAdd() {
    selectFeedback();
    let target = currentId;
    if (!target) {
      const existing = topLevelCategories().find((c) => c.name.toLowerCase() === "my words");
      const folder = existing ?? createBlankCategory({ name: "My Words", icon: "🗣️" });
      target = folder.id;
      setPath([folder.id]);
    }
    setVoiceTarget(target);
    setVoiceOpen(true);
  }

  function tapWord(w: CustomWord) {
    tapFeedback();
    recordWordUsage(child.id, w.label);
    recordWordUseByWordId(w.id);
    const isPhraseMode = boardMode === "phrase";
    const spokenText = wordLabel(w.phrase || w.label, lang);
    // Instant clear pronunciation of tapped card in selected voice
    void playWord(
      { label: spokenText, phrase: spokenText, audioUri: w.audioUri, useTextToSpeech: w.useTextToSpeech },
      lang,
      settings.speechRate,
      voiceType,
      isPhraseMode
    );
    // Always add tapped word to sentence strip at the top
    setSentence((prev) => [
      ...prev,
      {
        id: `${w.id}-${prev.length}-${Date.now().toString(36).slice(-4)}`,
        label: spokenText,
        emoji: w.emoji,
        imageUri: w.imageUri || getPictogramUrl(canonicalWordEn(w.phrase || w.label)) || undefined,
        audioUri: w.audioUri,
        useTextToSpeech: w.useTextToSpeech,
      },
    ]);
  }

  function removeChipAt(index: number) {
    tapFeedback();
    recordCorrectionUsed(child.id);
    setSentence((prev) => prev.filter((_, i) => i !== index));
  }

  function undoLastChip() {
    if (sentence.length === 0) return;
    tapFeedback();
    recordCorrectionUsed(child.id);
    setSentence((prev) => prev.slice(0, -1));
  }

  /** "I made a mistake" attention action + calm TTS prompt */
  function attentionMistake() {
    selectFeedback();
    recordCorrectionUsed(child.id);
    const msg = t("iMadeMistake", lang);
    Speech.stop();
    Speech.speak(msg, { language: lang, rate: settings.speechRate, pitch: 1 });
    Alert.alert(t("iMadeMistake", lang), t("undoOrClearMsg", lang), [
      { text: t("closeBtn", lang), style: "cancel" },
      { text: t("undoLastWordBtn", lang), style: "default", onPress: () => undoLastChip() },
      { text: t("clearAllBtn", lang), style: "destructive", onPress: () => setSentence([]) },
    ]);
  }

  function openFolder(id: string) {
    selectFeedback();
    setPath((p) => [...p, id]);
  }

  function goCrumb(idx: number) {
    setPath((p) => p.slice(0, idx)); // idx 0 = Home
  }

  async function speakSentence() {
    if (sentence.length === 0 || speaking) return;
    tapFeedback();
    setSpeaking(true);
    const labels = sentence.map((c) => wordLabel(c.label, lang));
    recordSentencePlayed(child.id, labels);
    learnSentence(labels);

    // Natural English formatting across categories for daily routine sentences
    const spokenText = lang === "en-US" ? formatNaturalEnglishSentence(labels) : labels.join(" ");

    try {
      if (lang === "en-US" && !sentence.some((c) => c.audioUri && c.useTextToSpeech !== true)) {
        await playSentence([{ label: spokenText, useTextToSpeech: true }], lang, settings.speechRate, voiceType);
      } else {
        await playSentence(speakWords(), lang, settings.speechRate, voiceType);
      }
    } finally {
      setSpeaking(false);
    }
  }

  function handleBack() {
    tapFeedback();
    if (path.length > 1) {
      setPath((p) => p.slice(0, -1));
      return;
    }
    const tabs = bottomTabCategories(lang);
    const coreTab =
      tabs.find((t) => {
        const en = (canonicalWordEn(t.name) || t.name).toLowerCase();
        return en === "core" || t.name === "بنیادی" || t.name === "أساسي";
      }) ?? tabs[0];
    if (coreTab?.id && path[0] !== coreTab.id) {
      setPath([coreTab.id]);
      return;
    }
    onTabChange("home");
  }

  function openBottomTab(idOrNull: string | null) {
    if (!idOrNull) return;
    selectFeedback();
    setPath([idOrNull]);
  }

  const tileSize = { width: `${100 / cols}%` as const };
  const title = current ? wordLabel(current.name, lang) : t("talk", lang);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Top Header */}
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.navBtn}
            accessibilityLabel={t("back", lang)}
          >
            <Ionicons
              name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
              size={20}
              color={colors.forest}
            />
          </Pressable>

          <Pressable
            onPress={() => {
              tapFeedback();
              const tabs = bottomTabCategories(lang);
              const coreTab =
                tabs.find((t) => {
                  const en = (canonicalWordEn(t.name) || t.name).toLowerCase();
                  return en === "core" || t.name === "بنیادی" || t.name === "أساسي";
                }) ?? tabs[0];
              if (coreTab?.id) setPath([coreTab.id]);
              else setPath([]);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.navBtn}
            accessibilityLabel={t("home", lang)}
          >
            <Ionicons name="home" size={18} color={colors.forest} />
          </Pressable>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>

          {/* Clean Oops/Mistake button */}
          <Pressable
            onPress={attentionMistake}
            style={styles.mistakeHeaderBtn}
            accessibilityLabel={t("iMadeMistake", lang)}
          >
            <Ionicons name="alert-circle-outline" size={15} color="#ffffff" />
            <Text style={styles.mistakeHeaderBtnText}>{t("oopsBtn", lang)}</Text>
          </Pressable>

          {/* Voice Add button */}
          <Pressable
            onPress={startVoiceAdd}
            style={styles.voiceHeaderBtn}
            accessibilityLabel={t("makeAWord", lang)}
          >
            <Ionicons name="mic" size={16} color="#ffffff" />
          </Pressable>

          <LangBadge />

          <Pressable
            onPress={() => onTabChange("home")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.navBtn}
            accessibilityLabel={t("settings", lang)}
          >
            <Ionicons name="grid-outline" size={18} color={colors.forest} />
          </Pressable>
        </View>

        {/* Top Sentence Strip (Miniature Cards + Orange Trash Button + Green Speak Button) */}
        <View style={styles.msgBar}>
          <View style={{ flex: 1 }}>
            {sentence.length > 0 && (
              <View style={styles.liveSentenceTextWrap}>
                <Ionicons name="chatbubble-ellipses" size={13} color={colors.forest} />
                <Text style={styles.liveSentenceText} numberOfLines={1}>
                  "{lang === "en-US" ? formatNaturalEnglishSentence(sentence.map((c) => wordLabel(c.label, "en-US"))) : sentence.map((c) => wordLabel(c.label, lang)).join(" ")}"
                </Text>
              </View>
            )}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.msgScroll}
              keyboardShouldPersistTaps="handled"
            >
              {sentence.length === 0 ? (
                <View style={styles.placeholderWrap}>
                  <Ionicons name="chatbubbles-outline" size={20} color={colors.textLight} />
                  <Text style={styles.msgPlaceholder}>{t("buildSentence", lang)}</Text>
                </View>
              ) : (
                sentence.map((c, idx) => (
                  <View key={c.id} style={styles.miniCard}>
                    <View style={styles.miniCardMedia}>
                      <CardPic label={c.label} imageUri={c.imageUri} emoji={c.emoji} size={50} />
                    </View>
                    <Text style={styles.miniCardText} numberOfLines={1}>
                      {wordLabel(c.label, lang)}
                    </Text>
                    <Pressable
                      onPress={() => removeChipAt(idx)}
                      style={styles.miniCardClose}
                      hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
                      accessibilityLabel={`Remove ${wordLabel(c.label, lang)}`}
                    >
                      <Ionicons name="close" size={12} color="#ffffff" />
                    </Pressable>
                  </View>
                ))
              )}
            </ScrollView>
          </View>

          {/* Action buttons matching the tablet photo */}
          <View style={styles.msgActions}>
            <Pressable
              onPress={() => {
                if (sentence.length === 0) return;
                tapFeedback();
                stopSentence();
                setSentence([]);
              }}
              disabled={sentence.length === 0}
              style={[styles.trashBtn, sentence.length === 0 && styles.btnDisabled]}
              accessibilityLabel={t("clearSentence", lang)}
            >
              <Ionicons name="trash" size={20} color="#ffffff" />
            </Pressable>

            <Pressable
              onPress={speakSentence}
              disabled={sentence.length === 0 || speaking}
              style={[
                styles.speakBtn,
                sentence.length === 0 && styles.btnDisabled,
                speaking && styles.speakBtnActive,
              ]}
              accessibilityLabel={t("speakSentence", lang)}
            >
              <Ionicons
                name={speaking ? "volume-high" : "volume-medium"}
                size={24}
                color="#ffffff"
              />
            </Pressable>
          </View>
        </View>

        {/* Next-word suggestions, shown as board tiles */}
        {suggestions.length > 0 && (
          <View style={styles.suggestWrap}>
            <View style={styles.suggestHeader}>
              <Ionicons name="bulb" size={13} color={colors.forest} />
              <Text style={styles.suggestHeaderText}>{lang === "ar-SA" ? "الكلمة التالية" : lang === "ur-PK" ? "اگلا لفظ" : "Next word"}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestScroll}>
              {suggestions.map((w) => (
                <Pressable
                  key={w.id}
                  onPress={() => tapWord(w)}
                  style={({ pressed }) => [styles.tile, styles.wordTile, styles.suggestTile, pressed && styles.tilePressed]}
                  accessibilityLabel={wordLabel(w.label, lang)}
                >
                  <View style={styles.wordBody}>
                    <CardPic label={w.label} imageUri={w.imageUri} emoji={w.emoji} size={52} />
                  </View>
                  <View style={styles.wordLabelBar}>
                    <Text style={styles.wordLabelText} numberOfLines={1}>
                      {wordLabel(w.label, lang)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Tala Subcategory Breadcrumb Bar */}
        {path.length > 1 && (
          <View style={styles.breadcrumbBar}>
            <Pressable
              onPress={handleBack}
              style={styles.breadcrumbBackBtn}
              accessibilityLabel="Back to previous category"
            >
              <Ionicons
                name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
                size={14}
                color={colors.forest}
              />
              <Text style={styles.breadcrumbBackText}>
                {wordLabel(getCategory(path[path.length - 2])?.name ?? t("back", lang), lang)}
              </Text>
            </Pressable>
            <Ionicons
              name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"}
              size={12}
              color="#94a3b8"
            />
            <View style={styles.breadcrumbCurrentPill}>
              <Text style={styles.breadcrumbCurrentText} numberOfLines={1}>
                {current?.icon ? `${current.icon} ` : ""}{wordLabel(current?.name ?? "", lang)}
              </Text>
              {words.length > 0 && (
                <View style={styles.breadcrumbCountBadge}>
                  <Text style={styles.breadcrumbCountText}>{words.length}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Main Grid: Responsive AAC cards */}
        <ScrollView
          style={styles.gridScroll}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {!ready ? null : (
            <>
              {folders.map((f) => {
                const c = f.color ?? colors.forest;
                const childCount = f.words?.length || 0;
                return (
                  <View key={f.id} style={[styles.cell, tileSize]}>
                    <Pressable
                      onPress={() => openFolder(f.id)}
                      style={({ pressed }) => [
                        styles.tile,
                        styles.folderTile,
                        { borderColor: c, backgroundColor: c + "08" },
                        pressed && styles.tilePressed,
                      ]}
                    >
                      <View style={styles.folderTopTab}>
                        <View style={[styles.folderTabPill, { backgroundColor: c }]}>
                          <Ionicons name="folder-open" size={9} color="#ffffff" />
                          <Text style={styles.folderTabPillText}>{wordLabel("Folder", lang)}</Text>
                        </View>
                        {childCount > 0 && (
                          <View style={[styles.folderCountPill, { borderColor: c + "40" }]}>
                            <Text style={[styles.folderCountText, { color: c }]}>
                              {childCount}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={[styles.folderBody, { backgroundColor: c + "10" }]}>
                        {f.imageUri ? (
                          <CardPic
                            label={f.name}
                            imageUri={f.imageUri}
                            emoji={f.icon ?? "📁"}
                            size={cardPicSize}
                          />
                        ) : (
                          <Text style={styles.folderIcon}>{f.icon ?? "📁"}</Text>
                        )}
                      </View>
                      <View style={[styles.folderLabelBar, { backgroundColor: c }]}>
                        <Text style={styles.folderLabelText} numberOfLines={1}>
                          {wordLabel(f.name, lang)}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                );
              })}

              {words.map((w) => {
                let vTag = isActionsCategory ? (w.verbFormTag || detectVerbForm(w.label)) : null;
                if (vTag) {
                  const enLbl = (canonicalWordEn(w.label) || w.label).toLowerCase().trim();
                  const vf = getVerbForms(enLbl);
                  if (vf && vf.base.toLowerCase() === enLbl) {
                    // Base verbs ending in "ing" (sing, bring, ring) are always 1st form
                    vTag = "1st";
                  } else if (vTag === "1st" && isContinuousForm(enLbl)) {
                    vTag = "4th";
                  }
                }
                return (
                  <View key={w.id} style={[styles.cell, tileSize]}>
                    <Pressable
                      onPress={() => tapWord(w)}
                      style={({ pressed }) => [
                        styles.tile,
                        styles.wordTile,
                        pressed && styles.tilePressed,
                      ]}
                    >
                      {/* Verb Form Badge (1st Form, 2nd Form, 3rd Form, 4th Form) */}
                      {vTag && (
                        <View
                          style={[
                            styles.verbFormBadge,
                            vTag === "1st" && styles.verbFormBadge1st,
                            vTag === "2nd" && styles.verbFormBadge2nd,
                            vTag === "3rd" && styles.verbFormBadge3rd,
                            vTag === "4th" && styles.verbFormBadge4th,
                          ]}
                        >
                          <Text
                            style={[
                              styles.verbFormBadgeText,
                              vTag === "1st" && styles.verbFormBadgeText1st,
                              vTag === "2nd" && styles.verbFormBadgeText2nd,
                              vTag === "3rd" && styles.verbFormBadgeText3rd,
                              vTag === "4th" && styles.verbFormBadgeText4th,
                            ]}
                          >
                            {vTag} {lang === "ar-SA" ? "تصريف" : lang === "ur-PK" ? "فارم" : "Form"}
                          </Text>
                        </View>
                      )}

                      {boardMode === "phrase" && w.phrase && w.phrase !== w.label && (
                        <View style={styles.phraseBadge}>
                          <Ionicons name="chatbubble-ellipses" size={10} color="#0284c7" />
                        </View>
                      )}
                      <View style={styles.wordBody}>
                        <CardPic
                          label={w.label}
                          imageUri={w.imageUri}
                          emoji={w.emoji}
                          size={cardPicSize}
                        />
                      </View>
                      <View style={styles.wordLabelBar}>
                        <Text style={styles.wordLabelText} numberOfLines={1}>
                          {wordLabel(w.label, lang)}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                );
              })}

              {folders.length === 0 && words.length === 0 && (
                <View style={{ width: "100%", alignItems: "center", gap: 10, paddingVertical: 12 }}>
                  <Mascot mood="thinking" size={70} animate={false} />
                  <Text style={styles.emptyBoard}>{t("emptyFolder", lang)}</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Category Navigation Bar (Tools, Emotion, Attributes, Sentences, Schools, Sports, Hygiene, Music) */}
      <View style={styles.bottomBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomRow}
        >
          {bottomTabs.map((bt) => {
            const active = currentId === bt.id;
            return (
              <Pressable
                key={bt.name}
                onPress={() => openBottomTab(bt.id)}
                style={[styles.bottomTab, active && styles.bottomTabActive]}
                disabled={!bt.id}
              >
                <View
                  style={[
                    styles.bottomTabIcon,
                    active && { backgroundColor: (bt.color || colors.forest) + "28" },
                  ]}
                >
                  <CardPic label={bt.name} emoji={bt.icon} size={28} />
                </View>
                <Text
                  style={[
                    styles.bottomTabLabel,
                    active && { color: bt.color || colors.forest, fontWeight: "800" },
                    !bt.id && { color: colors.textLight },
                  ]}
                  numberOfLines={1}
                >
                  {wordLabel(bt.name, lang)}
                </Text>
                {active && (
                  <View
                    style={[
                      styles.activeIndicator,
                      { backgroundColor: bt.color || colors.forest },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main navigation TabBar */}
      <TabBar active={tab} onChange={onTabChange} labels={labels} />

      <AddByVoiceScreen
        visible={voiceOpen}
        presetCategoryId={voiceTarget}
        childMode
        onClose={() => setVoiceOpen(false)}
        onSaved={() => setTick((t) => t + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnGhost: { backgroundColor: "transparent", borderColor: "transparent" },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: colors.textDark,
    marginLeft: 4,
  },
  mistakeHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.orangeDeep,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  mistakeHeaderBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  voiceHeaderBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },

  // Sentence Strip
  msgBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 112,
  },
  msgScroll: {
    alignItems: "center",
    paddingRight: 6,
    paddingLeft: 4,
    flexGrow: 1,
  },
  placeholderWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingLeft: 6,
  },
  msgPlaceholder: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: "600",
  },
  liveSentenceTextWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingTop: 2,
    paddingBottom: 4,
  },
  liveSentenceText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.forestDark,
    fontStyle: "italic",
  },

  // Next-word suggestion row
  suggestWrap: {
    marginHorizontal: 10,
    marginBottom: 6,
  },
  suggestHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  suggestHeaderText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.forestDark,
  },
  suggestScroll: {
    gap: 8,
    paddingRight: 8,
  },
  suggestTile: {
    width: 92,
    aspectRatio: undefined,
    height: 104,
  },

  // Mini Card in Sentence Strip
  miniCard: {
    width: 86,
    height: 96,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginRight: 10,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  miniCardMedia: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  miniCardText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#1e293b",
    textAlign: "center",
    width: "100%",
  },
  miniCardClose: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.orangeDeep,
    borderWidth: 1.5,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  // Strip Action Buttons
  msgActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 6,
  },
  trashBtn: {
    width: 44,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.orangeDeep,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  speakBtn: {
    width: 58,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  speakBtnActive: {
    backgroundColor: "#059669",
    transform: [{ scale: 1.05 }],
  },
  btnDisabled: {
    opacity: 0.35,
  },

  // Grid
  gridScroll: {
    flex: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 6,
    paddingBottom: 20,
  },
  cell: {
    padding: 4,
  },
  tile: {
    aspectRatio: 0.95,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  tilePressed: {
    transform: [{ scale: 0.95 }],
    borderColor: colors.forest,
  },

  // Word card styles
  wordTile: {
    backgroundColor: "#ffffff",
  },
  wordBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    padding: 6,
  },
  wordLabelBar: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  wordLabelText: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 12,
    textAlign: "center",
  },

  // Folder card styles
  folderTile: {
    borderWidth: 2,
  },
  folderTopTab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingTop: 5,
  },
  folderTabPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  folderTabPillText: {
    color: "#ffffff",
    fontSize: 8.5,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  folderCountPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  folderCountText: {
    fontSize: 8.5,
    fontWeight: "800",
  },
  folderBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  folderIcon: {
    fontSize: 36,
  },
  folderLabelBar: {
    paddingVertical: 5,
    paddingHorizontal: 3,
    alignItems: "center",
  },
  folderLabelText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 12,
    textAlign: "center",
  },
  emptyBoard: {
    color: colors.textLight,
    fontSize: 14,
    textAlign: "center",
    padding: 36,
    width: "100%",
  },

  // Category Tab Bar at bottom
  bottomBar: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 4,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 6,
  },
  bottomTab: {
    alignItems: "center",
    width: 66,
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 2,
    position: "relative",
  },
  bottomTabActive: {
    backgroundColor: "#f1f5f9",
  },
  bottomTabIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  bottomTabLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textDark,
    textAlign: "center",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: 12,
    right: 12,
    height: 3,
    borderRadius: 2,
  },

  // Verb Form Pill Badge (1st Form, 2nd Form, 3rd Form, 4th Form)
  verbFormBadge: {
    position: "absolute",
    top: 5,
    left: 5,
    zIndex: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  verbFormBadge1st: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  verbFormBadge2nd: {
    backgroundColor: "#f0f9ff",
    borderColor: "#bae6fd",
  },
  verbFormBadge3rd: {
    backgroundColor: "#faf5ff",
    borderColor: "#e9d5ff",
  },
  verbFormBadge4th: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
  },
  verbFormBadgeText: {
    fontSize: 8.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  verbFormBadgeText1st: {
    color: "#065f46",
  },
  verbFormBadgeText2nd: {
    color: "#0369a1",
  },
  verbFormBadgeText3rd: {
    color: "#6b21a8",
  },
  verbFormBadgeText4th: {
    color: "#b45309",
  },

  // Tala Subcategory Breadcrumb Navigation Bar
  breadcrumbBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 8,
  },
  breadcrumbBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  breadcrumbBackText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.forest,
  },
  breadcrumbCurrentPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#e0f2fe",
  },
  breadcrumbCurrentText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#0369a1",
  },
  breadcrumbCountBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: "#0284c7",
  },
  breadcrumbCountText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#ffffff",
  },

  editCategoriesHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.forest,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 4,
  },
  editCategoriesHeaderBtnText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "700",
  },
  breadcrumbEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bae6fd",
    marginLeft: "auto",
  },
  breadcrumbEditText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284c7",
  },
  phraseBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    zIndex: 2,
    backgroundColor: "#e0f2fe",
    borderRadius: 6,
    padding: 2,
  },
  secondaryLabelText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.forest,
    marginTop: 1,
  },
});
