import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ChildProfile, AppSettings, ContentTag, TherapyGoal, DoctorContact, ClinicalNote, CareLogEntry, CaregiverPasscard } from "../types";

const CHILDREN_KEY = "kiddocare_children";
const SETTINGS_KEY = "kiddocare_settings";
const USAGE_KEY = "kiddocare_usage";

const DEFAULT_SETTINGS: AppSettings = {
  language: "en-US",
  fontSize: "large",
  highContrast: false,
  soundEnabled: true,
  reduceMotion: false,
  languageSelected: false,
  hapticsEnabled: true,
  speechRate: 0.9,
  boardColumns: 3,
  kioskMode: false,
};

export const defaultTags: ContentTag[] = ["colors", "numbers", "shapes", "animals", "music", "stories", "art", "nature"];

export interface UsageData {
  /** Lifetime tap counts per word, used for the Vocabulary "most used words" ranking. */
  wordTotals: Record<string, number>;
  /** Word taps bucketed by day-of-week (0=Sun..6=Sat), rolling week-over-week. */
  wordsByDay: [number, number, number, number, number, number, number];
  /** Last recorded schedule-completion percentage per day-of-week. */
  scheduleByDay: [number, number, number, number, number, number, number];
  lastPlayedDate: string | null;
  /** Legacy alias preserved for backwards compatibility. Treat as consecutiveDays below. */
  gameStreak: number;
  /** Clinical name for the same value: number of consecutive days the child has used the board. */
  consecutiveDays: number;
  /** Longest sentence ever spoken (by word count). */
  longestSentenceLength: number;
  /** Word labels of the longest sentence (first occurrence). */
  longestSentenceWords: string[];
  /** Number of full sentences spoken (play-sentence events). */
  sentencesSpoken: number;
  /** Number of "I made a mistake / undo" corrections used. */
  correctionsUsed: number;
}

const DEFAULT_USAGE: UsageData = {
  wordTotals: {},
  wordsByDay: [0, 0, 0, 0, 0, 0, 0],
  scheduleByDay: [0, 0, 0, 0, 0, 0, 0],
  lastPlayedDate: null,
  gameStreak: 0,
  consecutiveDays: 0,
  longestSentenceLength: 0,
  longestSentenceWords: [],
  sentencesSpoken: 0,
  correctionsUsed: 0,
};

let childrenCache: ChildProfile[] = [];
let settingsCache: AppSettings = DEFAULT_SETTINGS;
let usageCache: Record<string, UsageData> = {};
let hydrated = false;

export async function hydrateStorage(): Promise<void> {
  try {
    const [rawChildren, rawSettings, rawUsage] = await Promise.all([
      AsyncStorage.getItem(CHILDREN_KEY),
      AsyncStorage.getItem(SETTINGS_KEY),
      AsyncStorage.getItem(USAGE_KEY),
    ]);
    childrenCache = rawChildren ? JSON.parse(rawChildren) : [];
    settingsCache = rawSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) } : DEFAULT_SETTINGS;
    usageCache = rawUsage ? migrateUsage(JSON.parse(rawUsage)) : {};
  } catch {
    childrenCache = [];
    settingsCache = DEFAULT_SETTINGS;
    usageCache = {};
  }
  hydrated = true;
}

function migrateUsage(input: Record<string, UsageData>): Record<string, UsageData> {
  const out: Record<string, UsageData> = {};
  for (const [id, u] of Object.entries(input)) {
    const base = {
      ...DEFAULT_USAGE,
      ...u,
      wordsByDay: [...(u.wordsByDay ?? DEFAULT_USAGE.wordsByDay)] as UsageData["wordsByDay"],
      scheduleByDay: [...(u.scheduleByDay ?? DEFAULT_USAGE.scheduleByDay)] as UsageData["scheduleByDay"],
    };
    out[id] = {
      ...base,
      consecutiveDays: base.consecutiveDays ?? base.gameStreak ?? 0,
      longestSentenceLength: base.longestSentenceLength ?? 0,
      longestSentenceWords: base.longestSentenceWords ?? [],
      sentencesSpoken: base.sentencesSpoken ?? 0,
      correctionsUsed: base.correctionsUsed ?? 0,
    };
  }
  return out;
}

function emptyUsage(): UsageData {
  return {
    ...DEFAULT_USAGE,
    wordTotals: {},
    wordsByDay: [...DEFAULT_USAGE.wordsByDay],
    scheduleByDay: [...DEFAULT_USAGE.scheduleByDay],
    longestSentenceWords: [],
  };
}

export function isHydrated(): boolean {
  return hydrated;
}

export function loadChildren(): ChildProfile[] {
  return childrenCache;
}

export function saveChildren(children: ChildProfile[]): void {
  childrenCache = children;
  AsyncStorage.setItem(CHILDREN_KEY, JSON.stringify(children)).catch(() => {});
}

export function addChild(child: ChildProfile): void {
  saveChildren([...childrenCache, child]);
}

export function updateChild(updated: ChildProfile): void {
  const idx = childrenCache.findIndex((c) => c.id === updated.id);
  if (idx < 0) return;
  const next = [...childrenCache];
  next[idx] = updated;
  saveChildren(next);
}

export function deleteChild(id: string): void {
  saveChildren(childrenCache.filter((c) => c.id !== id));
}

export function loadSettings(): AppSettings {
  return settingsCache;
}

export function saveSettings(settings: AppSettings): void {
  settingsCache = settings;
  AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => {});
}

function saveUsage(): void {
  AsyncStorage.setItem(USAGE_KEY, JSON.stringify(usageCache)).catch(() => {});
}

export function getUsage(childId: string): UsageData {
  return usageCache[childId] ?? DEFAULT_USAGE;
}

export function recordWordUsage(childId: string, word: string): void {
  const current = usageCache[childId] ?? emptyUsage();
  const day = new Date().getDay();
  const wordsByDay = [...current.wordsByDay] as UsageData["wordsByDay"];
  wordsByDay[day] += 1;
  usageCache[childId] = {
    ...current,
    wordTotals: { ...current.wordTotals, [word]: (current.wordTotals[word] ?? 0) + 1 },
    wordsByDay,
  };
  saveUsage();

  // Progress active speech therapy goals if present
  const child = childrenCache.find((c) => c.id === childId);
  if (child && child.therapyGoals) {
    let changed = false;
    const goals = child.therapyGoals.map((g) => {
      if (g.category === "speech" && !g.completed) {
        const nextCount = g.currentCount + 1;
        const completed = nextCount >= g.targetCount;
        changed = true;
        return { ...g, currentCount: nextCount, completed };
      }
      return g;
    });
    if (changed) {
      updateChild({ ...child, therapyGoals: goals });
    }
  }
}

export function addTherapyGoal(childId: string, goal: TherapyGoal): void {
  const child = childrenCache.find((c) => c.id === childId);
  if (!child) return;
  const currentGoals = child.therapyGoals || [];
  updateChild({ ...child, therapyGoals: [...currentGoals, goal] });
}

export function updateTherapyGoal(childId: string, goal: TherapyGoal): void {
  const child = childrenCache.find((c) => c.id === childId);
  if (!child) return;
  const currentGoals = child.therapyGoals || [];
  const next = currentGoals.map((g) => (g.id === goal.id ? goal : g));
  updateChild({ ...child, therapyGoals: next });
}

export function deleteTherapyGoal(childId: string, goalId: string): void {
  const child = childrenCache.find((c) => c.id === childId);
  if (!child) return;
  const currentGoals = child.therapyGoals || [];
  updateChild({ ...child, therapyGoals: currentGoals.filter((g) => g.id !== goalId) });
}

export function addClinicalNote(childId: string, note: ClinicalNote): void {
  const child = childrenCache.find((c) => c.id === childId);
  if (!child) return;
  const currentNotes = child.clinicalNotes || [];
  updateChild({ ...child, clinicalNotes: [note, ...currentNotes] });
}

export function deleteClinicalNote(childId: string, noteId: string): void {
  const child = childrenCache.find((c) => c.id === childId);
  if (!child) return;
  const currentNotes = child.clinicalNotes || [];
  updateChild({ ...child, clinicalNotes: currentNotes.filter((n) => n.id !== noteId) });
}

export function updateDoctorContact(childId: string, contact: DoctorContact): void {
  const child = childrenCache.find((c) => c.id === childId);
  if (!child) return;
  updateChild({ ...child, doctorContact: contact });
}

export function recordScheduleAdherence(childId: string, percent: number): void {
  const current = usageCache[childId] ?? emptyUsage();
  const day = new Date().getDay();
  const scheduleByDay = [...current.scheduleByDay] as UsageData["scheduleByDay"];
  scheduleByDay[day] = Math.round(percent);
  usageCache[childId] = { ...current, scheduleByDay };
  saveUsage();
}

export function recordGamePlayed(childId: string): void {
  const current = usageCache[childId] ?? emptyUsage();
  const todayStr = new Date().toISOString().slice(0, 10);
  if (current.lastPlayedDate === todayStr) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const wasYesterday = current.lastPlayedDate === yesterday.toISOString().slice(0, 10);
  const next = wasYesterday ? (current.consecutiveDays ?? current.gameStreak ?? 0) + 1 : 1;

  usageCache[childId] = {
    ...current,
    lastPlayedDate: todayStr,
    gameStreak: next,
    consecutiveDays: next,
  };
  saveUsage();
}

export function recordSentencePlayed(childId: string, words: string[]): void {
  const current = usageCache[childId] ?? emptyUsage();
  const len = words.length;
  const longest = len > (current.longestSentenceLength ?? 0);
  usageCache[childId] = {
    ...current,
    sentencesSpoken: (current.sentencesSpoken ?? 0) + 1,
    longestSentenceLength: longest ? len : current.longestSentenceLength,
    longestSentenceWords: longest ? words : current.longestSentenceWords,
  };
  saveUsage();
}

export function recordCorrectionUsed(childId: string): void {
  const current = usageCache[childId] ?? emptyUsage();
  usageCache[childId] = {
    ...current,
    correctionsUsed: (current.correctionsUsed ?? 0) + 1,
  };
  saveUsage();
}

export function addCareLog(childId: string, entry: CareLogEntry): void {
  const child = childrenCache.find((c) => c.id === childId);
  if (!child) return;
  const currentLogs = child.careLogs || [];
  updateChild({ ...child, careLogs: [entry, ...currentLogs] });
}

export function deleteCareLog(childId: string, entryId: string): void {
  const child = childrenCache.find((c) => c.id === childId);
  if (!child) return;
  const currentLogs = child.careLogs || [];
  updateChild({ ...child, careLogs: currentLogs.filter((l) => l.id !== entryId) });
}

export function updateCaregiverPasscard(childId: string, passcard: CaregiverPasscard): void {
  const child = childrenCache.find((c) => c.id === childId);
  if (!child) return;
  updateChild({ ...child, passcard });
}

export function incrementTherapyGoal(childId: string, goalId: string, amount: number = 1): void {
  const child = childrenCache.find((c) => c.id === childId);
  if (!child || !child.therapyGoals) return;
  const nextGoals = child.therapyGoals.map((g) => {
    if (g.id !== goalId) return g;
    const nextCount = Math.min(g.targetCount, g.currentCount + amount);
    return {
      ...g,
      currentCount: nextCount,
      completed: nextCount >= g.targetCount,
    };
  });
  updateChild({ ...child, therapyGoals: nextGoals });
}
