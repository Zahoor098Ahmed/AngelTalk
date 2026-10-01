import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { ChildProfile, TabScreen } from "../types";
import { useSettings } from "../context/SettingsContext";
import { speak } from "../modules/tts";
import { recordGamePlayed } from "../modules/storage";
import { t, gameAnswerLabel, type TKey } from "../modules/i18n";
import { tapFeedback } from "../modules/haptics";
import { useResponsive } from "../modules/responsive";
import { getPictogramUrl } from "../modules/aacPictograms";
import LangBadge from "../components/LangBadge";
import TabBar from "../components/TabBar";
import { colors, radius } from "../theme";

/** Real AAC pictogram (same ARASAAC set used on the Talk board) with an
 * emoji fallback — used by the puzzle games instead of plain emoji glyphs. */
function GamePic({ answer, emoji, size = 40 }: { answer: string; emoji: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const uri = useMemo(() => getPictogramUrl(answer), [answer]);
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
  return <Text style={{ fontSize: Math.round(size * 0.8) }}>{emoji}</Text>;
}

interface Props {
  child: ChildProfile;
  tab: TabScreen;
  onTabChange: (tab: TabScreen) => void;
  labels: Record<TabScreen, string>;
}

type GameMode = "animals" | "letters" | "numbers" | "colors" | "shapes" | "emotions" | "food" | "puzzle" | "sequence" | "jigsaw" | "sort";

interface PuzzleCard {
  id: number;
  answer: string;
  emoji: string;
  matched: boolean;
}

/** Shared with the "animals" round data below — reusing it means the memory
 * puzzle's pieces already have bilingual names via gameAnswerLabel(). */
const SEQUENCE_MAX = 6;

/** Category Sort — a categorization/classification task (a core early-learner
 * ABA/OT skill for autistic children: "which bin does this belong in?"),
 * distinct from the tap-a-card games above. */
const SORT_ANIMAL_ITEMS: { emoji: string; answer: string }[] = [
  { emoji: "🐸", answer: "Frog" },
  { emoji: "🐶", answer: "Dog" },
  { emoji: "🐱", answer: "Cat" },
  { emoji: "🐰", answer: "Rabbit" },
  { emoji: "🐮", answer: "Cow" },
];
const SORT_FOOD_ITEMS: { emoji: string; answer: string }[] = [
  { emoji: "🍎", answer: "Apple" },
  { emoji: "🍌", answer: "Banana" },
  { emoji: "🍕", answer: "Pizza" },
  { emoji: "🍪", answer: "Cookie" },
  { emoji: "🍞", answer: "Bread" },
];
interface SortItem {
  emoji: string;
  answer: string;
  category: "animal" | "food";
}
const SORT_ITEMS: SortItem[] = [
  ...SORT_ANIMAL_ITEMS.map((i) => ({ ...i, category: "animal" as const })),
  ...SORT_FOOD_ITEMS.map((i) => ({ ...i, category: "food" as const })),
];

const PUZZLE_ITEMS: { emoji: string; answer: string }[] = [
  { emoji: "🐸", answer: "Frog" },
  { emoji: "🐶", answer: "Dog" },
  { emoji: "🐦", answer: "Bird" },
  { emoji: "🐱", answer: "Cat" },
  { emoji: "🐰", answer: "Rabbit" },
  { emoji: "🐮", answer: "Cow" },
];

interface Round {
  prompt: string;
  answer: string;
  options: string[];
  say?: string;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

/** Build rounds from a list of {prompt, answer} pairs, adding 2 decoy options each. */
function buildRounds(items: { prompt: string; answer: string }[]): Round[] {
  const allAnswers = items.map((i) => i.answer);
  return shuffle(items).map((item) => {
    const decoys = shuffle(allAnswers.filter((a) => a !== item.answer)).slice(0, 2);
    return {
      prompt: item.prompt,
      answer: item.answer,
      options: shuffle([item.answer, ...decoys]),
      say: item.answer,
    };
  });
}

const ANSWER_EMOJI: Record<string, string> = {
  Frog: "🐸", Dog: "🐶", Bird: "🐦", Cat: "🐱", Rabbit: "🐰", Cow: "🐮", Pig: "🐷", Horse: "🐴",
  Red: "🟥", Orange: "🟧", Yellow: "🟨", Green: "🟩", Blue: "🟦", Purple: "🟪", Brown: "🟫", Black: "⬛",
  Circle: "🔴", Triangle: "🔺", Square: "🟦", Star: "⭐", Diamond: "🔷", Heart: "❤️",
  Happy: "😀", Sad: "😢", Angry: "😠", Scared: "😨", Sleepy: "😴", Surprised: "😲", Sick: "🤢", Loved: "🥰",
  Apple: "🍎", Banana: "🍌", Pizza: "🍕", Milk: "🥛", Cookie: "🍪", Bread: "🍞", Carrot: "🥕", Watermelon: "🍉",
};

const ANIMALS = buildRounds([
  { prompt: "🐸", answer: "Frog" },
  { prompt: "🐶", answer: "Dog" },
  { prompt: "🐦", answer: "Bird" },
  { prompt: "🐱", answer: "Cat" },
  { prompt: "🐰", answer: "Rabbit" },
  { prompt: "🐮", answer: "Cow" },
  { prompt: "🐷", answer: "Pig" },
  { prompt: "🐴", answer: "Horse" },
]);

const LETTERS_LIST = ["A", "B", "C", "D", "E", "F", "G", "H"];
const LETTER_ROUNDS: Round[] = shuffle(LETTERS_LIST).map((l) => ({
  prompt: l,
  answer: l,
  options: shuffle([l, ...shuffle(LETTERS_LIST.filter((x) => x !== l)).slice(0, 2)]),
  say: `The letter ${l}`,
}));

const NUMBER_ROUNDS: Round[] = shuffle(Array.from({ length: 10 }, (_, i) => i + 1)).map((n) => {
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((v) => v !== n);
  const decoys = shuffle(pool).slice(0, 2);
  return {
    prompt: String(n),
    answer: String(n),
    options: shuffle([String(n), ...decoys.map(String)]),
    say: `The number ${n}`,
  };
});

const COLORS_ROUNDS = buildRounds([
  { prompt: "🟥", answer: "Red" },
  { prompt: "🟧", answer: "Orange" },
  { prompt: "🟨", answer: "Yellow" },
  { prompt: "🟩", answer: "Green" },
  { prompt: "🟦", answer: "Blue" },
  { prompt: "🟪", answer: "Purple" },
  { prompt: "🟫", answer: "Brown" },
  { prompt: "⬛", answer: "Black" },
]);

const SHAPES_ROUNDS = buildRounds([
  { prompt: "🔴", answer: "Circle" },
  { prompt: "🔺", answer: "Triangle" },
  { prompt: "🟦", answer: "Square" },
  { prompt: "⭐", answer: "Star" },
  { prompt: "🔷", answer: "Diamond" },
  { prompt: "❤️", answer: "Heart" },
]);

const EMOTIONS_ROUNDS = buildRounds([
  { prompt: "😀", answer: "Happy" },
  { prompt: "😢", answer: "Sad" },
  { prompt: "😠", answer: "Angry" },
  { prompt: "😨", answer: "Scared" },
  { prompt: "😴", answer: "Sleepy" },
  { prompt: "😲", answer: "Surprised" },
  { prompt: "🤢", answer: "Sick" },
  { prompt: "🥰", answer: "Loved" },
]);

const FOOD_ROUNDS = buildRounds([
  { prompt: "🍎", answer: "Apple" },
  { prompt: "🍌", answer: "Banana" },
  { prompt: "🍕", answer: "Pizza" },
  { prompt: "🥛", answer: "Milk" },
  { prompt: "🍪", answer: "Cookie" },
  { prompt: "🍞", answer: "Bread" },
  { prompt: "🥕", answer: "Carrot" },
  { prompt: "🍉", answer: "Watermelon" },
]);

const MODE_ROUNDS: Record<GameMode, Round[]> = {
  animals: ANIMALS,
  letters: LETTER_ROUNDS,
  numbers: NUMBER_ROUNDS,
  colors: COLORS_ROUNDS,
  shapes: SHAPES_ROUNDS,
  emotions: EMOTIONS_ROUNDS,
  food: FOOD_ROUNDS,
  puzzle: [], // memory-match has its own grid state below, not round/option-based
  sequence: [], // number-sequence has its own grid state below, not round/option-based
  jigsaw: [], // picture jigsaw has its own grid state below, not round/option-based
  sort: [], // category sort has its own grid state below, not round/option-based
};

const MODES: {
  key: GameMode;
  title: string;
  subtitle: string;
  icon: string;
  ionicon: keyof typeof Ionicons.glyphMap;
  color: string;
  accent: string;
}[] = [
  { key: "animals", title: "Animal Match", subtitle: "Match the animal to its name", icon: "🐸", ionicon: "paw", color: "#dcfce7", accent: "#15803d" },
  { key: "food", title: "Food & Snacks", subtitle: "Name the food you see", icon: "🍎", ionicon: "nutrition", color: "#fee2e2", accent: "#dc2626" },
  { key: "letters", title: "Learn Letters", subtitle: "Tap the letter you see", icon: "🔤", ionicon: "text", color: "#e0f2fe", accent: "#0284c7" },
  { key: "numbers", title: "Learn Numbers", subtitle: "Tap the number you see", icon: "🔢", ionicon: "keypad", color: "#fef3c7", accent: "#d97706" },
  { key: "colors", title: "Colors", subtitle: "Name the color you see", icon: "🎨", ionicon: "color-palette", color: "#fce7f3", accent: "#be185d" },
  { key: "shapes", title: "Shapes", subtitle: "Name the shape you see", icon: "🔷", ionicon: "shapes", color: "#f3e8ff", accent: "#7e22ce" },
  { key: "emotions", title: "Emotions", subtitle: "How is this face feeling?", icon: "🙂", ionicon: "happy", color: "#ffedd5", accent: "#c2410c" },
];

const MODE_TKEY: Record<GameMode, { title: TKey; sub: TKey }> = {
  animals: { title: "gAnimalMatch", sub: "gAnimalMatchSub" },
  food: { title: "gFood", sub: "gFoodSub" },
  letters: { title: "gLearnLetters", sub: "gLearnLettersSub" },
  numbers: { title: "gLearnNumbers", sub: "gLearnNumbersSub" },
  colors: { title: "gColors", sub: "gColorsSub" },
  shapes: { title: "gShapes", sub: "gShapesSub" },
  emotions: { title: "gEmotions", sub: "gEmotionsSub" },
  puzzle: { title: "gPuzzle", sub: "gPuzzleSub" },
  sequence: { title: "gSequence", sub: "gSequenceSub" },
  jigsaw: { title: "gJigsaw", sub: "gJigsawSub" },
  sort: { title: "gSort", sub: "gSortSub" },
};

export default function GamesScreen({ child, tab, onTabChange, labels }: Props) {
  const { settings } = useSettings();
  const { isSmallPhone, isTablet, isLargeTablet } = useResponsive();
  const lang = settings.language;
  const tt = (k: TKey) => t(k, lang);
  const gTitle = (m: GameMode) => tt(MODE_TKEY[m].title);
  const gSub = (m: GameMode) => tt(MODE_TKEY[m].sub);
  const [mode, setMode] = useState<GameMode>("animals");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [roundIdx, setRoundIdx] = useState(0);
  const [tries, setTries] = useState(0);
  const [choiceCount, setChoiceCount] = useState<2 | 3>(3);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [finished, setFinished] = useState(false);
  const [puzzleCards, setPuzzleCards] = useState<PuzzleCard[]>([]);
  const [flippedIdx, setFlippedIdx] = useState<number[]>([]);
  const [puzzleBusy, setPuzzleBusy] = useState(false);
  const [sequenceTiles, setSequenceTiles] = useState<number[]>([]);
  const [sequenceNext, setSequenceNext] = useState(1);
  const [sequenceWrong, setSequenceWrong] = useState<number | null>(null);
  const [jigsawTargets, setJigsawTargets] = useState<string[]>([]);
  const [jigsawFilled, setJigsawFilled] = useState<(string | null)[]>([]);
  const [jigsawPieces, setJigsawPieces] = useState<{ answer: string; emoji: string; placed: boolean }[]>([]);
  const [jigsawSelected, setJigsawSelected] = useState<string | null>(null);
  const [jigsawWrongSlot, setJigsawWrongSlot] = useState<number | null>(null);
  const [sortQueue, setSortQueue] = useState<SortItem[]>([]);
  const [sortWrong, setSortWrong] = useState(false);

  // Polished round-in / correct-answer animations for the flashcard games.
  const promptAnim = useRef(new Animated.Value(0)).current;
  const starBurstAnim = useRef(new Animated.Value(0)).current;

  const rounds = MODE_ROUNDS[mode];
  const round = rounds[roundIdx];
  const activeMeta = useMemo(() => MODES.find((m) => m.key === mode)!, [mode]);
  const progress = (roundIdx + 1) / rounds.length;

  // Bounce the flashcard in on every new round instead of a flat cut.
  useEffect(() => {
    promptAnim.setValue(0);
    Animated.spring(promptAnim, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start();
  }, [roundIdx, mode]);

  // Pop + fade a star reward whenever an answer is marked correct.
  useEffect(() => {
    if (feedback !== "correct") return;
    starBurstAnim.setValue(0);
    Animated.sequence([
      Animated.timing(starBurstAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(starBurstAnim, { toValue: 0, duration: 400, delay: 200, useNativeDriver: true }),
    ]).start();
  }, [feedback]);

  const displayOptions = useMemo(() => {
    if (!round) return [];
    if (choiceCount === 2) {
      const wrong = round.options.find((o) => o !== round.answer) || round.options[1];
      return [round.answer, wrong].sort(() => 0.5 - Math.random());
    }
    return round.options;
  }, [round, choiceCount]);

  // Speak prompt helper
  function speakPrompt() {
    tapFeedback();
    const toSay = round.say || round.answer;
    speak(toSay, lang, settings.soundEnabled);
  }

  function choose(option: string) {
    if (feedback || finished) return;
    tapFeedback();

    if (option === round.answer) {
      const nextStreak = streak + 1;
      setFeedback("correct");
      setScore((s) => s + 1);
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setTries((tr) => tr + 1);
      speak(tt("gGreatJob"), lang, settings.soundEnabled);
      recordGamePlayed(child.id);

      setTimeout(() => {
        setFeedback(null);
        if (roundIdx + 1 >= rounds.length) {
          setFinished(true);
          speak(tt("gYouFinished"), lang, settings.soundEnabled);
        } else {
          setRoundIdx((i) => i + 1);
        }
      }, 800);
    } else {
      setFeedback("wrong");
      setStreak(0);
      setTries((tr) => tr + 1);
      speak(tt("gTryAgain"), lang, settings.soundEnabled);
      setTimeout(() => setFeedback(null), 800);
    }
  }

  function setupSequence() {
    setSequenceTiles(shuffle(Array.from({ length: SEQUENCE_MAX }, (_, i) => i + 1)));
    setSequenceNext(1);
    setSequenceWrong(null);
  }

  function tapSequenceTile(n: number) {
    if (finished) return;
    tapFeedback();
    setTries((tr) => tr + 1);
    if (n === sequenceNext) {
      speak(String(n), lang, settings.soundEnabled);
      setScore((s) => s + 1);
      if (n >= SEQUENCE_MAX) {
        setTimeout(() => {
          setFinished(true);
          speak(tt("gYouFinished"), lang, settings.soundEnabled);
        }, 300);
        recordGamePlayed(child.id);
      } else {
        setSequenceNext(n + 1);
      }
    } else {
      setSequenceWrong(n);
      speak(tt("gTryAgain"), lang, settings.soundEnabled);
      setTimeout(() => setSequenceWrong(null), 600);
    }
  }

  function setupJigsaw() {
    setJigsawTargets(shuffle(PUZZLE_ITEMS.map((p) => p.answer)));
    setJigsawFilled(Array(PUZZLE_ITEMS.length).fill(null));
    setJigsawPieces(shuffle(PUZZLE_ITEMS.map((p) => ({ ...p, placed: false }))));
    setJigsawSelected(null);
    setJigsawWrongSlot(null);
  }

  function selectJigsawPiece(answer: string) {
    if (finished) return;
    const piece = jigsawPieces.find((p) => p.answer === answer);
    if (!piece || piece.placed) return;
    tapFeedback();
    setJigsawSelected((cur) => (cur === answer ? null : answer));
  }

  function tapJigsawSlot(index: number) {
    if (finished || !jigsawSelected || jigsawFilled[index]) return;
    tapFeedback();
    setTries((tr) => tr + 1);
    if (jigsawTargets[index] === jigsawSelected) {
      const placedAnswer = jigsawSelected;
      setJigsawFilled((prev) => prev.map((v, i) => (i === index ? placedAnswer : v)));
      setJigsawPieces((prev) => prev.map((p) => (p.answer === placedAnswer ? { ...p, placed: true } : p)));
      setJigsawSelected(null);
      speak(tt("gGreatJob"), lang, settings.soundEnabled);
      setScore((s) => {
        const nextScore = s + 1;
        if (nextScore >= jigsawTargets.length) {
          setTimeout(() => {
            setFinished(true);
            speak(tt("gYouFinished"), lang, settings.soundEnabled);
          }, 300);
          recordGamePlayed(child.id);
        }
        return nextScore;
      });
    } else {
      speak(tt("gTryAgain"), lang, settings.soundEnabled);
      setJigsawWrongSlot(index);
      setTimeout(() => setJigsawWrongSlot(null), 500);
    }
  }

  function setupSort() {
    setSortQueue(shuffle(SORT_ITEMS));
    setSortWrong(false);
  }

  function chooseSortBin(category: "animal" | "food") {
    if (finished || sortQueue.length === 0) return;
    tapFeedback();
    const current = sortQueue[0];
    setTries((tr) => tr + 1);
    if (current.category === category) {
      speak(tt("gGreatJob"), lang, settings.soundEnabled);
      setSortWrong(false);
      setScore((s) => {
        const nextScore = s + 1;
        const remaining = sortQueue.slice(1);
        if (remaining.length === 0) {
          setTimeout(() => {
            setFinished(true);
            speak(tt("gYouFinished"), lang, settings.soundEnabled);
          }, 300);
          recordGamePlayed(child.id);
        } else {
          setSortQueue(remaining);
        }
        return nextScore;
      });
    } else {
      setSortWrong(true);
      speak(tt("gTryAgain"), lang, settings.soundEnabled);
      setTimeout(() => setSortWrong(false), 500);
    }
  }

  function setupPuzzle() {
    const cards = shuffle([...PUZZLE_ITEMS, ...PUZZLE_ITEMS]).map((p, i) => ({
      id: i,
      answer: p.answer,
      emoji: p.emoji,
      matched: false,
    }));
    setPuzzleCards(cards);
    setFlippedIdx([]);
    setPuzzleBusy(false);
  }

  function flipPuzzleCard(index: number) {
    if (puzzleBusy || finished) return;
    const card = puzzleCards[index];
    if (!card || card.matched || flippedIdx.includes(index)) return;
    tapFeedback();
    const nextFlipped = [...flippedIdx, index];
    setFlippedIdx(nextFlipped);
    if (nextFlipped.length < 2) return;

    setPuzzleBusy(true);
    setTries((tr) => tr + 1);
    const [i1, i2] = nextFlipped;
    const isMatch = puzzleCards[i1].answer === puzzleCards[i2].answer;

    if (isMatch) {
      speak(tt("gGreatJob"), lang, settings.soundEnabled);
      setTimeout(() => {
        setPuzzleCards((prev) => prev.map((c, i) => (i === i1 || i === i2 ? { ...c, matched: true } : c)));
        setFlippedIdx([]);
        setPuzzleBusy(false);
        setScore((s) => {
          const nextScore = s + 1;
          if (nextScore >= PUZZLE_ITEMS.length) {
            setTimeout(() => {
              setFinished(true);
              speak(tt("gYouFinished"), lang, settings.soundEnabled);
            }, 300);
            recordGamePlayed(child.id);
          }
          return nextScore;
        });
      }, 500);
    } else {
      speak(tt("gTryAgain"), lang, settings.soundEnabled);
      setTimeout(() => {
        setFlippedIdx([]);
        setPuzzleBusy(false);
      }, 900);
    }
  }

  function restart(next: GameMode = mode) {
    tapFeedback();
    setMode(next);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setRoundIdx(0);
    setTries(0);
    setFeedback(null);
    setFinished(false);
    if (next === "puzzle") setupPuzzle();
    if (next === "sequence") setupSequence();
    if (next === "jigsaw") setupJigsaw();
    if (next === "sort") setupSort();
  }

  const accuracy = tries > 0 ? Math.round((score / tries) * 100) : 100;

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header with Child Profile and Language */}
        <View style={styles.header}>
          <View style={[styles.headerInner, isTablet && styles.headerInnerTablet]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={[styles.modeHeaderIcon, { backgroundColor: activeMeta.color, borderColor: activeMeta.accent + "40", borderWidth: 1 }]}>
                  <Ionicons name={activeMeta.ionicon} size={22} color={activeMeta.accent} />
                </View>
                <View>
                  <Text style={styles.title}>{gTitle(mode)}</Text>
                  <Text style={styles.subtitle}>{tt(MODE_TKEY[mode].sub)}</Text>
                </View>
              </View>
            </View>
            <LangBadge />
          </View>
        </View>

        {/* Top Game Mode Quick Selector Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeCarousel}>
            {MODES.map((m) => {
              const isSel = m.key === mode;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => restart(m.key)}
                  style={[
                    styles.carouselChip,
                    { backgroundColor: isSel ? m.color : "#ffffff", borderColor: isSel ? m.accent : "#e2e8f0" },
                  ]}
                >
                  <Ionicons name={m.ionicon} size={15} color={isSel ? m.accent : "#64748b"} />
                  <Text style={[styles.carouselChipText, isSel && { color: m.accent, fontWeight: "800" }]}>
                    {gTitle(m.key)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={[styles.body, isTablet && styles.bodyTablet]} showsVerticalScrollIndicator={false}>
          {/* Enhanced Metrics Stat Cards */}
          <View style={styles.statRow}>
            <View style={[styles.statPill, { borderLeftColor: "#f59e0b", borderLeftWidth: 4 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="star" size={16} color="#f59e0b" />
                <Text style={styles.statValue}>{score}</Text>
              </View>
              <Text style={styles.statLabel}>{tt("gScore")}</Text>
            </View>

            <View style={[styles.statPill, { borderLeftColor: "#ef4444", borderLeftWidth: 4 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="flame" size={16} color="#ef4444" />
                <Text style={[styles.statValue, { color: streak > 1 ? "#dc2626" : colors.textDark }]}>
                  {streak}
                </Text>
              </View>
              <Text style={styles.statLabel}>{tt("gStreak")}</Text>
            </View>

            <View style={[styles.statPill, { borderLeftColor: colors.forest, borderLeftWidth: 4 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="checkmark-circle" size={16} color={colors.forest} />
                <Text style={styles.statValue}>{accuracy}%</Text>
              </View>
              <Text style={styles.statLabel}>{tt("gAccuracy")}</Text>
            </View>
          </View>

          {!finished && mode === "puzzle" && (
            <View style={styles.puzzleGrid}>
              {puzzleCards.map((c, i) => {
                const shown = c.matched || flippedIdx.includes(i);
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => flipPuzzleCard(i)}
                    style={[
                      styles.puzzleCard,
                      shown && styles.puzzleCardShown,
                      c.matched && styles.puzzleCardMatched,
                    ]}
                  >
                    {shown ? <GamePic answer={c.answer} emoji={c.emoji} size={44} /> : <Text style={styles.puzzleCardText}>❓</Text>}
                  </Pressable>
                );
              })}
            </View>
          )}

          {!finished && mode === "sequence" && (
            <>
              <Text style={styles.sequenceHint}>{tt("gTapNumberN").replace("{n}", String(sequenceNext))}</Text>
              <View style={styles.puzzleGrid}>
                {sequenceTiles.map((n) => {
                  const done = n < sequenceNext;
                  const isWrong = sequenceWrong === n;
                  return (
                    <Pressable
                      key={n}
                      onPress={() => tapSequenceTile(n)}
                      disabled={done}
                      style={[
                        styles.puzzleCard,
                        done && styles.puzzleCardMatched,
                        isWrong && { borderColor: "#ef4444", backgroundColor: "#fee2e2" },
                      ]}
                    >
                      <Text style={styles.puzzleCardText}>{n}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {!finished && mode === "jigsaw" && (
            <>
              <Text style={styles.sequenceHint}>{tt("gJigsawHint")}</Text>
              <View style={styles.puzzleGrid}>
                {jigsawTargets.map((targetAnswer, i) => {
                  const filledAnswer = jigsawFilled[i];
                  const filledEmoji = filledAnswer ? PUZZLE_ITEMS.find((p) => p.answer === filledAnswer)?.emoji : null;
                  return (
                    <Pressable
                      key={i}
                      onPress={() => tapJigsawSlot(i)}
                      disabled={!!filledAnswer}
                      style={[
                        styles.jigsawSlot,
                        !!filledAnswer && styles.puzzleCardMatched,
                        jigsawWrongSlot === i && { borderColor: "#ef4444", backgroundColor: "#fee2e2" },
                      ]}
                    >
                      {filledAnswer ? <GamePic answer={targetAnswer} emoji={filledEmoji ?? ""} size={44} /> : null}
                    </Pressable>
                  );
                })}
              </View>
              <View style={[styles.puzzleGrid, { marginTop: 4 }]}>
                {jigsawPieces.map((p) => (
                  <Pressable
                    key={p.answer}
                    onPress={() => selectJigsawPiece(p.answer)}
                    disabled={p.placed}
                    style={[
                      styles.puzzleCard,
                      p.placed && { opacity: 0.2 },
                      jigsawSelected === p.answer && styles.jigsawPieceSelected,
                    ]}
                  >
                    <GamePic answer={p.answer} emoji={p.emoji} size={44} />
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {!finished && mode === "sort" && sortQueue.length > 0 && (
            <>
              <Text style={styles.sequenceHint}>{tt("gSortHint")}</Text>
              <View style={[styles.sortCard, sortWrong && { borderColor: "#ef4444", backgroundColor: "#fee2e2" }]}>
                <GamePic answer={sortQueue[0].answer} emoji={sortQueue[0].emoji} size={90} />
              </View>
              <View style={styles.sortBinRow}>
                <Pressable onPress={() => chooseSortBin("animal")} style={[styles.sortBin, { backgroundColor: "#dcfce7", borderColor: "#15803d" }]}>
                  <Text style={styles.sortBinText}>{tt("gSortAnimalsBin")}</Text>
                </Pressable>
                <Pressable onPress={() => chooseSortBin("food")} style={[styles.sortBin, { backgroundColor: "#fee2e2", borderColor: "#dc2626" }]}>
                  <Text style={styles.sortBinText}>{tt("gSortFoodBin")}</Text>
                </Pressable>
              </View>
            </>
          )}

          {!finished && mode !== "puzzle" && mode !== "sequence" && mode !== "jigsaw" && mode !== "sort" && (
            <>
              {/* Round Progress Bar */}
              <View style={[styles.progressSection, isTablet && styles.progressSectionTablet]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.roundCount}>
                    {tt("gRound")} {roundIdx + 1} {tt("of")} {rounds.length}
                  </Text>
                  <Text style={styles.roundPct}>{Math.round(progress * 100)}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: activeMeta.accent }]} />
                </View>
              </View>

              {/* Main Interactive Prompt Stage */}
              <View
                style={[
                  styles.promptCard,
                  isTablet && styles.promptCardTablet,
                  feedback === "correct" && { borderColor: colors.greenDeep, backgroundColor: "#dcfce7" },
                  feedback === "wrong" && { borderColor: "#ef4444", backgroundColor: "#fee2e2" },
                ]}
              >
                <Animated.View
                  style={{
                    transform: [{ scale: promptAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
                    opacity: promptAnim,
                  }}
                >
                  {mode === "letters" || mode === "numbers" ? (
                    <Text style={[styles.promptGlyph, isTablet && { fontSize: 104 }, isSmallPhone && { fontSize: 58 }]}>
                      {round.prompt}
                    </Text>
                  ) : (
                    <GamePic answer={round.answer} emoji={round.prompt} size={isTablet ? 130 : isSmallPhone ? 76 : 100} />
                  )}
                </Animated.View>

                {/* Hear Question Speaker Button */}
                <Pressable onPress={speakPrompt} style={styles.speakPromptBtn}>
                  <Ionicons name="volume-high" size={18} color="white" />
                  <Text style={styles.speakPromptText}>{tt("gListen")}</Text>
                </Pressable>

                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.starBurst,
                    {
                      opacity: starBurstAnim,
                      transform: [{ scale: starBurstAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.6] }) }],
                    },
                  ]}
                >
                  <Text style={{ fontSize: 40 }}>⭐</Text>
                </Animated.View>

                {feedback === "correct" && (
                  <View style={styles.feedbackBadgeSuccess}>
                    <Ionicons name="checkmark-circle" size={16} color="white" />
                    <Text style={styles.feedbackTextSuccess}>{tt("gCorrect")}</Text>
                  </View>
                )}

                {feedback === "wrong" && (
                  <View style={styles.feedbackBadgeWrong}>
                    <Ionicons name="alert-circle" size={16} color="white" />
                    <Text style={styles.feedbackTextWrong}>{tt("gTryAgain")}</Text>
                  </View>
                )}
              </View>

              {/* Difficulty Level: 2 vs 3 choices */}
              <View style={[styles.difficultyRow, isTablet && styles.difficultyRowTablet]}>
                <Text style={styles.diffLabel}>{tt("gChoicesLabel")}</Text>
                <Pressable
                  onPress={() => {
                    tapFeedback();
                    setChoiceCount(2);
                  }}
                  style={[styles.diffChip, choiceCount === 2 && styles.diffChipActive]}
                >
                  <Text style={[styles.diffChipText, choiceCount === 2 && styles.diffChipTextActive]}>
                    {tt("gEasyChoice")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    tapFeedback();
                    setChoiceCount(3);
                  }}
                  style={[styles.diffChip, choiceCount === 3 && styles.diffChipActive]}
                >
                  <Text style={[styles.diffChipText, choiceCount === 3 && styles.diffChipTextActive]}>
                    {tt("gStandardChoice")}
                  </Text>
                </Pressable>
              </View>

              {/* Multiple Choice Options Cards */}
              <View style={[styles.optionsGrid, isTablet && styles.optionsGridTablet]}>
                {displayOptions.map((opt) => {
                  const optEmoji = ANSWER_EMOJI[opt];
                  const isCorrect = feedback && opt === round.answer;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => choose(opt)}
                      style={[
                        styles.optionCard,
                        isTablet && styles.optionCardTablet,
                        isCorrect && styles.optionCardCorrect,
                        feedback === "wrong" && opt === round.answer && styles.optionCardHint,
                      ]}
                    >
                      {optEmoji ? <GamePic answer={opt} emoji={optEmoji} size={isTablet ? 32 : 26} /> : null}
                      <Text style={[styles.optionText, isTablet && { fontSize: 18 }, isCorrect && { color: "#166534", fontWeight: "900" }]}>
                        {gameAnswerLabel(opt, lang)}
                      </Text>
                      <Pressable
                        onPress={() => {
                          tapFeedback();
                          speak(opt, lang, settings.soundEnabled);
                        }}
                        style={styles.optSpeakerBtn}
                        hitSlop={8}
                      >
                        <Ionicons name="volume-medium-outline" size={isTablet ? 20 : 16} color="#64748b" />
                      </Pressable>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {/* Game Completed Celebration Card */}
          {finished && (
            <View style={[styles.finishCard, isTablet && styles.finishCardTablet]}>
              <View style={styles.celebrationIconWrap}>
                <Ionicons name="trophy" size={isTablet ? 64 : 52} color="#f59e0b" />
              </View>
              <Text style={[styles.finishTitle, isTablet && { fontSize: 26 }]}>
                {gTitle(mode)} {tt("gYouFinished")}
              </Text>
              <Text style={styles.finishSub}>
                {tt("gCompletedChallenge").replace("{name}", child.name).replace("{game}", gTitle(mode))}
              </Text>

              <View style={styles.finishStatsRow}>
                <View style={styles.finishStatBox}>
                  <Text style={[styles.finishStatNum, { color: colors.forest }]}>{accuracy}%</Text>
                  <Text style={styles.finishStatLabel}>{tt("gAccuracyLabel")}</Text>
                </View>
                <View style={styles.finishStatBox}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3, justifyContent: "center" }}>
                    <Ionicons name="star" size={16} color="#f59e0b" />
                    <Text style={[styles.finishStatNum, { color: "#f59e0b" }]}>+{score}</Text>
                  </View>
                  <Text style={styles.finishStatLabel}>{tt("starsEarnedLabel")}</Text>
                </View>
                <View style={styles.finishStatBox}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3, justifyContent: "center" }}>
                    <Ionicons name="flame" size={16} color="#dc2626" />
                    <Text style={[styles.finishStatNum, { color: "#dc2626" }]}>{bestStreak}</Text>
                  </View>
                  <Text style={styles.finishStatLabel}>{tt("bestStreakLabel")}</Text>
                </View>
              </View>

              <Pressable onPress={() => restart()} style={styles.finishBtn}>
                <Ionicons name="play" size={18} color="white" />
                <Text style={styles.finishBtnText}>{tt("gPlayAgain")}</Text>
              </Pressable>
            </View>
          )}

          {/* All Games Explorer Section */}
          <View style={styles.sectionDivider}>
            <Text style={styles.pickTitle}>{tt("exploreMoreGames")}</Text>
          </View>

          <View style={styles.gameGrid}>
            {MODES.map((m) => {
              const active = m.key === mode;
              const cardResponsiveStyle = isLargeTablet
                ? styles.gameCardLargeTablet
                : isTablet
                ? styles.gameCardTablet
                : isSmallPhone
                ? styles.gameCardSmallPhone
                : styles.gameCard;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => restart(m.key)}
                  style={[
                    styles.gameCard,
                    cardResponsiveStyle,
                    { backgroundColor: m.color, borderColor: active ? m.accent : "#e2e8f0" },
                    active && styles.gameCardActive,
                  ]}
                >
                  <View style={styles.gameCardTop}>
                    <View style={[styles.modeCardIconWrap, { backgroundColor: m.accent + "18" }]}>
                      <Ionicons name={m.ionicon} size={24} color={m.accent} />
                    </View>
                    {active && (
                      <View style={[styles.activeTag, { backgroundColor: m.accent }]}>
                        <Text style={styles.activeTagText}>{tt("playingBadge")}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.gameTileLabel, { color: "#0f172a" }]}>{gTitle(m.key)}</Text>
                  <Text style={styles.gameTileSub}>{gSub(m.key)}</Text>
                  <View style={styles.gameTileFooter}>
                    <Text style={[styles.gameRoundsText, { color: m.accent }]}>
                      {m.key === "puzzle" || m.key === "jigsaw" ? PUZZLE_ITEMS.length : m.key === "sequence" ? SEQUENCE_MAX : m.key === "sort" ? SORT_ITEMS.length : MODE_ROUNDS[m.key].length} {tt("exercisesSuffix")}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={m.accent} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>

      <TabBar active={tab} onChange={onTabChange} labels={labels} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
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
  },
  headerInnerTablet: {
    maxWidth: 840,
    alignSelf: "center",
  },
  modeHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  subtitle: { fontSize: 12, color: "#64748b", marginTop: 1 },

  /* Top Carousel */
  carouselContainer: {
    backgroundColor: "#ffffff",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modeCarousel: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 16, gap: 8 },
  carouselChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  carouselChipText: { fontSize: 12, fontWeight: "700", color: "#475569" },

  body: { padding: 18, gap: 16, alignItems: "center", paddingBottom: 60, width: "100%" },
  bodyTablet: { maxWidth: 840, alignSelf: "center", width: "100%", paddingHorizontal: 24 },

  /* Stats Pill */
  statRow: { flexDirection: "row", gap: 10, width: "100%" },
  statPill: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontWeight: "800", color: "#0f172a", fontSize: 16 },
  statLabel: { fontSize: 11, color: "#64748b", fontWeight: "600", marginTop: 2 },

  /* Progress Section */
  progressSection: { width: "100%", maxWidth: 380, gap: 6 },
  progressSectionTablet: { maxWidth: 580 },
  roundCount: { fontSize: 12, color: "#475569", fontWeight: "700" },
  roundPct: { fontSize: 12, color: "#64748b", fontWeight: "700" },
  progressTrack: {
    width: "100%",
    height: 10,
    borderRadius: 5,
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 5 },

  /* Main Prompt Stage */
  promptCard: {
    width: "100%",
    maxWidth: 380,
    minHeight: 200,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    gap: 12,
  },
  promptCardTablet: {
    maxWidth: 580,
    minHeight: 240,
    paddingVertical: 32,
    borderRadius: 28,
  },
  promptGlyph: { fontSize: 80, textAlign: "center" },
  starBurst: { position: "absolute", top: "50%", left: "50%", marginTop: -20, marginLeft: -20 },
  speakPromptBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.forest,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  speakPromptText: { color: "white", fontSize: 12, fontWeight: "700" },
  feedbackBadgeSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#16a34a",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
  },
  feedbackTextSuccess: { color: "white", fontSize: 13, fontWeight: "800" },
  feedbackBadgeWrong: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#dc2626",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
  },
  feedbackTextWrong: { color: "white", fontSize: 13, fontWeight: "800" },

  /* Memory Puzzle Grid */
  puzzleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    marginBottom: 16,
  },
  puzzleCard: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: "#e0e7ff",
    borderWidth: 1.5,
    borderColor: "#c7d2fe",
    alignItems: "center",
    justifyContent: "center",
  },
  puzzleCardShown: { backgroundColor: "#ffffff", borderColor: "#a5b4fc" },
  puzzleCardMatched: { backgroundColor: "#dcfce7", borderColor: colors.greenDeep },
  puzzleCardText: { fontSize: 34 },
  jigsawSlot: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: "#fffbeb",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#fbbf24",
    alignItems: "center",
    justifyContent: "center",
  },
  jigsawPieceSelected: { borderColor: "#a16207", borderWidth: 3, backgroundColor: "#fef3c7" },
  sortCard: {
    width: 160,
    height: 160,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  sortBinRow: { flexDirection: "row", gap: 14, width: "100%", maxWidth: 380, alignSelf: "center" },
  sortBin: { flex: 1, paddingVertical: 22, borderRadius: 18, borderWidth: 2, alignItems: "center" },
  sortBinText: { fontSize: 17, fontWeight: "800", color: "#1e293b" },
  sequenceHint: { fontSize: 15, fontWeight: "700", color: colors.textDark, textAlign: "center", marginBottom: 12 },

  /* Options Grid */
  optionsGrid: { width: "100%", maxWidth: 380, gap: 10 },
  optionsGridTablet: { maxWidth: 580, gap: 12 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  optionCardTablet: {
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderRadius: 18,
  },
  optionCardCorrect: {
    borderColor: "#16a34a",
    backgroundColor: "#f0fdf4",
    borderWidth: 2,
  },
  optionCardHint: {
    borderColor: "#16a34a",
    borderWidth: 2,
  },
  optEmoji: { fontSize: 24 },
  optionText: { flex: 1, fontWeight: "700", fontSize: 16, color: "#1e293b" },
  optSpeakerBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },

  /* Finish Card */
  finishCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    gap: 8,
    paddingVertical: 32,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 6,
  },
  finishCardTablet: {
    maxWidth: 580,
    paddingVertical: 40,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  celebrationIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#fde68a",
  },
  finishTitle: { fontSize: 22, fontWeight: "900", color: "#0f172a", textAlign: "center" },
  finishSub: { fontSize: 13, color: "#64748b", marginTop: 2 },
  finishStatsRow: { flexDirection: "row", gap: 12, marginVertical: 16, width: "100%" },
  finishStatBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  finishStatNum: { fontSize: 18, fontWeight: "900", color: "#0f172a" },
  finishStatLabel: { fontSize: 11, color: "#64748b", marginTop: 2, fontWeight: "600" },
  finishBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.forest,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 36,
  },
  finishBtnText: { color: "white", fontWeight: "800", fontSize: 15 },

  /* Game Grid Explorer */
  sectionDivider: { width: "100%", marginTop: 10, marginBottom: 2 },
  pickTitle: { fontSize: 12, fontWeight: "800", color: "#94a3b8", letterSpacing: 0.5 },
  gameGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, width: "100%" },
  gameCard: {
    width: "48%",
    borderRadius: 18,
    padding: 16,
    gap: 6,
    borderWidth: 1.5,
  },
  gameCardSmallPhone: {
    width: "100%",
  },
  gameCardTablet: {
    width: "31.5%",
    padding: 18,
  },
  gameCardLargeTablet: {
    width: "23.5%",
    padding: 18,
  },
  gameCardActive: { borderWidth: 2.5 },
  gameCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  modeCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeTagText: { color: "white", fontSize: 9.5, fontWeight: "800" },
  gameTileLabel: { fontWeight: "800", fontSize: 14.5, marginTop: 2 },
  gameTileSub: { fontSize: 11, color: "#64748b", lineHeight: 15 },
  gameTileFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  gameRoundsText: { fontSize: 11, fontWeight: "700" },

  /* Difficulty Selector */
  difficultyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    maxWidth: 380,
    justifyContent: "flex-end",
    marginTop: -4,
  },
  difficultyRowTablet: {
    maxWidth: 580,
  },
  diffLabel: { fontSize: 11.5, color: "#64748b", fontWeight: "700" },
  diffChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  diffChipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  diffChipText: { fontSize: 11, fontWeight: "700", color: "#475569" },
  diffChipTextActive: { color: "white" },
});
