export type UserRole = "parent" | "slp" | "educator" | "admin" | "superadmin";

export type UserStatus = "active" | "suspended";

export interface User {
  _id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phoneNumber?: string;
  status: UserStatus;
  mfaEnabled: boolean;
  pinFailedAttempts: number;
  pinLockedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Child {
  _id: string;
  ownerId: string;
  name: string;
  age: number;
  diagnoses: string[];
  photoUrl?: string;
  settings: {
    language: string;
    voiceType: string;
    boardMode: string;
    bilingualDisplay: boolean;
    simpleMode: boolean;
    speechRate: number;
    boardColumns: number;
    highContrast: boolean;
    hapticsEnabled: boolean;
  };
  rewards: {
    stars: number;
    badges: string[];
    consecutiveDays: number;
    lastActiveDate: string | null;
  };
  owner?: { _id: string; email: string; fullName: string; role: string } | null;
  boardWords?: number;
  boardShelves?: number;
  usage?: { wordsThisWeek: number; sentencesSpoken: number; lastActive: string | null } | null;
  face: {
    consent: boolean;
    consentAt: string | null;
    version: number;
    enrolledAt: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface VerbFormText {
  en: string;
  ur: string;
  ar: string;
}

export interface VerbGroup {
  _id: string;
  baseKey: string;
  icon?: string;
  forms: {
    first: VerbFormText;
    s_es: VerbFormText;
    second: VerbFormText;
    third: VerbFormText;
    fourth: VerbFormText;
  };
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SeedWord {
  label: string;
  phrase: string;
  order?: number;
  verbFormTag?: string;
  emoji?: string;
  imageUri?: string;
  color?: string;
  verbKey?: string;
  translations?: Record<string, string>;
}

export interface SeedShelf {
  name: string;
  icon?: string;
  color?: string;
  words: SeedWord[];
}

export interface SeedTemplate {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  source?: string;
  editedByAdmin?: boolean;
  /** full folder only (GET /admin/templates/:id) */
  words?: SeedWord[];
  /** folder list only */
  wordCount?: number;
  wordLabels?: string[];
  targetDiagnosis?: string;
  shelves?: SeedShelf[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  _id: string;
  actorId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

export interface DashboardStats {
  usersCount: number;
  childrenCount: number;
  activeTodayCount: number;
  wordsSpokenToday: number;
  meltdownsThisWeek: number;
  usersByRole: Record<string, number>;
  userGrowth: Array<{ date: string; users: number }>;
  meltdownTrends: Array<{ date: string; count: number }>;
  topWords: Array<{ word: string; count: number }>;
  totalVerbs?: number;
  totalTemplates?: number;
  totalWords?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  issues?: unknown;
}

