export type DiagnosisType =
  | 'autism'
  | 'down-syndrome'
  | 'speech-delay'
  | 'adhd'
  | 'hearing-impairment'
  | 'visual-impairment'
  | 'dyslexia'
  | 'cerebral-palsy'
  | 'intellectual-disability'
  | 'sensory-processing'
  | 'non-verbal'
  | 'general';

export const DIAGNOSIS_LABELS: Record<DiagnosisType, string> = {
  'autism': 'Autism (ASD)',
  'down-syndrome': 'Down Syndrome',
  'speech-delay': 'Speech / Language Delay',
  'adhd': 'ADHD',
  'hearing-impairment': 'Hearing Impairment',
  'visual-impairment': 'Visual Impairment',
  'dyslexia': 'Dyslexia / Learning Disability',
  'cerebral-palsy': 'Cerebral Palsy / Motor Difficulty',
  'intellectual-disability': 'Intellectual Disability',
  'sensory-processing': 'Sensory Processing Disorder',
  'non-verbal': 'Non-verbal',
  'general': 'General Special Needs',
};

export type ContentTag =
  | 'colors' | 'numbers' | 'shapes' | 'animals' | 'music'
  | 'stories' | 'aac' | 'breathing' | 'schedule' | 'social'
  | 'motor' | 'speech' | 'art' | 'nature';

export const CONTENT_TAG_LABELS: Record<ContentTag, string> = {
  colors: '🎨 Colors',
  numbers: '🔢 Numbers',
  shapes: '🔷 Shapes',
  animals: '🐾 Animals',
  music: '🎵 Music',
  stories: '📖 Stories',
  aac: '🗣️ AAC Communication',
  breathing: '🌬️ Breathing',
  schedule: '📅 Daily Schedule',
  social: '👥 Social Skills',
  motor: '🏃 Motor Skills',
  speech: '💬 Speech Practice',
  art: '🖌️ Art',
  nature: '🌿 Nature',
};

export type TherapyCategory = 'speech' | 'occupational' | 'behavioral' | 'sensory';

export interface TherapyGoal {
  id: string;
  title: string;
  category: TherapyCategory;
  targetCount: number;
  currentCount: number;
  unit: string;
  completed: boolean;
  prescribedBy?: string;
  assignedDate: string;
  notes?: string;
}

export interface DoctorContact {
  doctorName: string;
  speciality: string;
  clinicName: string;
  phone: string;
  email: string;
  notes?: string;
}

export interface ClinicalNote {
  id: string;
  date: string;
  author: string;
  title: string;
  content: string;
  recommendations: string[];
}

export type PageSetStyle = 'category-folders' | 'core-grid';

export interface Supervisor {
  id: string;
  name: string;
  role: 'SLP' | 'OT' | 'Parent' | 'Teacher';
  email: string;
  phone?: string;
  permissions: 'read' | 'edit';
}

export interface CareLogEntry {
  id: string;
  date: string; // ISO string
  mood: "happy" | "calm" | "frustrated" | "overwhelmed" | "tired";
  sensoryTriggers?: string[];
  meltdownDurationMin?: number;
  communicationWins?: string;
  notes?: string;
}

export interface CaregiverPasscard {
  emergencyContactName: string;
  emergencyContactPhone: string;
  secondaryContactName?: string;
  secondaryContactPhone?: string;
  communicationStyle: string;
  sensoryTriggers: string[];
  calmingStrategies: string[];
  allergies: string[];
  dietaryRestrictions?: string;
  specialInstructions?: string;
}

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  diagnoses: DiagnosisType[];
  allowedTags: ContentTag[];
  embedding: number[];
  /** Face AI descriptors (128 numbers each) of the enrolment photos. */
  faceDescriptors?: number[][];
  /** Looks recognised later with high confidence (newest few); enrolment descriptors are kept forever. */
  learnedFaceDescriptors?: number[][];
  /** Face AI version the descriptors were made with (see FACE_AI_VERSION). */
  faceVersion?: number;
  enrolledAt: number;
  stars: number;
  badges: string[];
  photoUrl?: string;
  faceConsent?: boolean;
  generalConsent?: boolean;
  therapyGoals?: TherapyGoal[];
  doctorContact?: DoctorContact;
  clinicalNotes?: ClinicalNote[];
  pageSetStyle?: PageSetStyle;
  buttonDensity?: number; // 1 (beginner) .. 35+ (dense)
  supervisors?: Supervisor[];
  careLogs?: CareLogEntry[];
  passcard?: CaregiverPasscard;
  role?: UserRole;
  voiceType?: VoiceType;
  boardMode?: BoardMode;
  simpleMode?: boolean;
  bilingualDisplay?: boolean;
  favourites?: {
    foods: string[];
    family: { name: string; relation: string; photoUri?: string }[];
    activities: string[];
  };
}

export type VoiceType = 'boy' | 'girl' | 'woman' | 'man';
export type UserRole = 'parent' | 'educator' | 'slp';
export type BoardMode = 'phrase' | 'sentence'; // Phrase mode (1-tap whole phrase GLP) vs Sentence Builder

export interface SocialStoryPage {
  text: string;
  imageUri?: string;
  emoji?: string;
  pictogramName?: string;
}

export interface SocialStory {
  id: string;
  title: string;
  category: 'routine' | 'health' | 'school' | 'emotions' | 'social' | 'custom';
  icon: string;
  description: string;
  coverImage?: string;
  pages: SocialStoryPage[];
}

export type LanguageCode = 'en-US' | 'ar-SA' | 'ur-PK' | 'hi-IN' | 'es-ES' | 'fr-FR';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  rtl: boolean;
  flag: string;
}

export interface AppSettings {
  language: LanguageCode;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  highContrast: boolean;
  soundEnabled: boolean;
  reduceMotion: boolean;
  languageSelected: boolean;
  /** AAC additions */
  hapticsEnabled: boolean;
  speechRate: number;      // 0.5 (slow) .. 1.0 (normal)
  boardColumns: number;    // 2 .. 5 tiles per row
  kioskMode: boolean;      // best-effort in-app lock
  /** Angel Talk vs Tala feature parity */
  voiceType: VoiceType;
  boardMode: BoardMode;
  bilingualDisplay: boolean;
  simpleMode: boolean;
  userRole: UserRole;
}

export type AppScreen =
  | 'landing'
  | 'onboarding-quick'
  | 'face-scan'
  | 'home'
  | 'speak'
  | 'schedule'
  | 'games'
  | 'progress'
  | 'social-stories'
  | 'more'
  | 'parent-setup'
  | 'enroll-child'
  | 'parent-hub'
  | 'rewards'
  | 'calm-down'
  | 'accessibility'
  | 'doctor-panel'
  | 'category-builder'
  | 'my-categories'
  | 'sentence-picture'
  | 'phrase-library'
  | 'review-queue'
  | 'voice-command'
  | 'admin-panel'
  | 'daily-lesson'
  | 'skill-path'
  | 'voice-practice'
  | 'tell-me';

export type TabScreen = 'home' | 'speak' | 'schedule' | 'games' | 'progress';

export interface ContentItem {
  id: string;
  title: string;
  emoji: string;
  tag: ContentTag;
  minAge: number;
  maxAge: number;
  color: string;
}

// ---------------------------------------------------------------------------
// Additive feature modules (Category Builder + Sentence Picture).
// Entirely separate from the existing AAC board; only consumed by the new
// screens/modules. Nothing here touches existing data structures.
// ---------------------------------------------------------------------------

export type TileSize = 'sm' | 'md' | 'lg';

export interface CustomWord {
  id: string;
  label: string;
  phrase: string;
  emoji: string;
  imageUri?: string;
  /** Tile accent color (hex), shown as a swatch on caregiver-facing lists. */
  color?: string;
  /** Recorded voice clip (local file). When present and useTextToSpeech is not true, it is played instead of TTS. */
  audioUri?: string;
  useTextToSpeech?: boolean;
  size?: TileSize;
  order: number;
  /** Parent-only: hide this word from the child-facing Talk board without deleting it. */
  hidden?: boolean;
  /** How many times this exact tile has been tapped on the child-facing board. */
  useCount?: number;
  /** Timestamp (ms) of the last tap, for the caregiver "last used" column. */
  lastUsedAt?: number;
  /** Optional pre-computed 1st, 2nd, 3rd, 4th forms for verbs */
  verbForms?: {
    base: string;
    past: string;
    participle: string;
    continuous: string;
    emoji?: string;
  };
  /** Explicit verb form tag for display and speech (1st, s/es, 2nd, 3rd, 4th) */
  verbFormTag?: '1st' | 's' | '2nd' | '3rd' | '4th';
  /** True if this word was added, edited, or customized by the caregiver or user */
  isCustom?: boolean;
  /** Original seed English word name to preserve customized labels */
  seedLabel?: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  source: 'voice' | 'list' | 'generated' | 'manual' | 'seed';
  grouping: 'none' | 'alpha-range';
  /** Folder colour + icon shown on the board. */
  color?: string;
  icon?: string;
  /** Optional custom or library image for the category tile. */
  imageUri?: string;
  /** Parent-only: hide this whole folder from the child-facing Talk board. */
  hidden?: boolean;
  /** null / undefined = a top-level folder. Set = a sub-folder of that category. */
  parentCategoryId?: string | null;
  order?: number;
  words: CustomWord[];
  /** True if category name, icon or color was customized by user */
  isCustom?: boolean;
  /** Original seed English category name */
  seedName?: string;
}

export interface ParsedCategoryCommand {
  categoryName: string;
  requestedCount: number | null;
  explicitItems: string[];
  matchedSeed: string | null;
}

export interface SentenceScene {
  raw: string;
  adjectives: string[];
  color: string | null;
  subject: string | null;
  preposition: string | null;
  reference: string | null;
  conceptKey: string | null;
}

/** Rich scene graph for the Hybrid Smart Sentence-to-Scene engine. */
export type SceneSize = 'tiny' | 'small' | 'normal' | 'big' | 'huge';

export interface SceneEntity {
  type: string;        // e.g. "cat"
  glyph: string;       // emoji stand-in
  color: string | null;
  colorHex: string | null;
  size: SceneSize;
  count: number;       // 1..5 rendered
  action: string | null;
}

export interface SceneGraph {
  raw: string;
  subject: SceneEntity | null;
  relation: string | null;   // canonical: under | on | above | behind | in front of | beside | inside | null
  reference: SceneEntity | null;
  conceptKey: string | null;
  /** 0..1 — how well the on-device engine understood the sentence. */
  confidence: number;
}

// ---------------------------------------------------------------------------
// Section 5 — New data model additions.
// PhraseMatch: the library used by the Voice-Command Matching screen
// (Section 3.4). A single entry matches multiple trigger-phrase variations to
// one image + spoken label. Separate from the AAC tile vocabulary; stored
// and managed independently.
// ---------------------------------------------------------------------------

export type PhraseLevel = 1 | 2 | 3 | 4 | 5;

export interface PhraseMatch {
  id: string;
  /**
   * All the different ways a child or therapist might say this item (lowercase,
   * stemmed loosely — first match wins). e.g. ["on the table", "on top of table",
   * book on table"].
   */
  triggerPhrases: string[];
  /** Local image path (saved to the device document directory). */
  imagePath: string;
  /** Text spoken aloud on a match and shown under the image. */
  label: string;
  /** Human-facing category used for filtering/browsing in the admin library. */
  category: string;
  /** Difficulty / developmental level (1 = starter … 5 = advanced). */
  level: PhraseLevel;
  /** Optional provenance when this entry came from an imported book. */
  bookSource?: string | null;
  /** Optional license attribution (required for GDL / CC-BY imports). */
  licenseRef?: string | null;
  createdAt: number;
  updatedAt: number;
  /** Number of times this entry was matched successfully on the child screen. */
  matchCount: number;
}

/**
 * Admin Content Review Queue (Section 4.4). An item enters here from any
 * auto-extracted content before it is approved and published as a PhraseMatch.
 * Only approved entries are visible on the child-facing Voice-Command screen.
 */
export type ReviewStatus = "pending" | "approved" | "rejected";

export interface ContentReviewEntry {
  id: string;
  phrase: string;
  /** Optional alternate detected variations from the extraction step. */
  suggestedVariations: string[];
  imagePath: string;
  suggestedLabel: string;
  suggestedCategory: string;
  suggestedLevel: PhraseLevel;
  /** Human-readable source reference for the review context, e.g. the book page. */
  source: string;
  sourceLicense: string;
  status: ReviewStatus;
  /** Source attribution kept after being extracted (rejected reviews still hold. */
  createdAt: number;
  reviewedAt?: number | null;
  reviewerNote?: string | null;
}
