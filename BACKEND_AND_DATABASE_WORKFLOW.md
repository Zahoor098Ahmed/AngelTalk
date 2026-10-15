# Angel Talk — Comprehensive Backend, Database & System Architecture Workflow

> **Document Version:** 1.0.0  
> **Target Audience:** Backend Developers, Database Architects, and LLMs (Claude 3.5 Sonnet / GPT-4o)  
> **Application Overview:** **Angel Talk** is a gentle, family-first, offline-ready **AAC (Augmentative and Alternative Communication)** platform designed for non-verbal and speech-delayed children (Autism ASD, Down Syndrome, Apraxia, Cerebral Palsy). It transforms visual picture tiles into natural spoken speech, supports multi-language communication (English, Arabic, Urdu, Hindi, Spanish, French), smart 4-form verb conjugation, on-device Face AI child identification, visual routines, social stories, and clinician/caregiver progress journals.

---

## 1. Executive Summary & Architecture Overview

### 1.1 Core Mission
The primary objective of Angel Talk is to give every child an immediate voice. Because children frequently use the app in places with poor or no internet connectivity (classrooms, cars, therapy clinics, playgrounds), **the app must be strictly Offline-First**:
1. All core talk board actions (tap-to-talk, sentence strip, shelf navigation, verb forms) must execute with **zero network latency** (< 50ms) using locally cached assets and offline TTS.
2. Changes made by caregivers (custom words, voice recordings, photo uploads, schedule items) are saved immediately to local storage (`AsyncStorage` / SQLite) and queued for background synchronization.
3. When internet connectivity is available, the client syncs deltas bi-directionally with the cloud backend (PostgreSQL + Prisma ORM + Node.js/Express or NestJS).

### 1.2 System Topology Diagram

```
+-----------------------------------------------------------------------------------+
|                           CLIENT (React Native / Expo)                            |
|                                                                                   |
|  +--------------------+   +-----------------------+   +------------------------+  |
|  | AAC Talk Board     |   | Vocabulary Builder    |   | Face AI Biometrics     |  |
|  | (Tiles, Verbs, GLP)|   | (Shelves, Voice Add)  |   | (face-api.js 128-dim)  |  |
|  +--------------------+   +-----------------------+   +------------------------+  |
|             |                         |                           |               |
|             v                         v                           v               |
|  +-----------------------------------------------------------------------------+  |
|  |                      LOCAL STORAGE & CACHE LAYER                            |  |
|  |  - AsyncStorage / WatermelonDB (Profiles, Shelves, Words, Caregiver Logs)   |  |
|  |  - Local FileSystem (Custom voice recordings, enrolled face descriptors)    |  |
|  |  - Memory & Disk TTS Cache (pre-cached audio chunks for instantaneous play) |  |
|  +-----------------------------------------------------------------------------+  |
|                                       |                                           |
|                                       v                                           |
|                            [ Offline Sync Queue ]                                 |
+-----------------------------------------------------------------------------------+
                                        | (HTTPS / WSS when online)
                                        v
+-----------------------------------------------------------------------------------+
|                         BACKEND API GATEWAY (Node.js)                             |
|                                                                                   |
|  - Auth & RBAC Middleware (JWT / Parent PIN verification)                         |
|  - RESTful API Endpoints (/api/v1/sync, /api/v1/shelves, /api/v1/children, etc.)  |
|  - Media Upload Controller (Presigned S3 / Cloudflare R2 URLs)                    |
|  - AI Proxy Services (OpenAI Whisper voice-to-board, DALL-E 3 image generation)   |
|  - Low-Latency TTS Proxy (Google/Azure/Local Neural TTS with Redis Caching)       |
+-----------------------------------------------------------------------------------+
                   |                                           |
                   v                                           v
+-------------------------------------+     +---------------------------------------+
|        DATABASE LAYER               |     |          OBJECT STORAGE               |
|  PostgreSQL 15+ (Prisma ORM)        |     |  Cloudflare R2 / AWS S3               |
|  - Users & Subscriptions            |     |  - Custom User Photos & Images        |
|  - Child Profiles & Biometrics      |     |  - Caregiver Voice Recordings (.m4a)  |
|  - Shelves, Words & Verb Forms      |     |  - ARASAAC Symbols Mirror             |
|  - Social Stories & Visual Routines |     |  - Exported Clinical PDF Reports      |
|  - Therapy Goals & Meltdown Logs    |     +---------------------------------------+
|  - Usage & Telemetry Analytics      |
+-------------------------------------+
```

---

## 2. User Personas & Role-Based Access Control (RBAC)

The system supports four distinct operational personas:

| Role | Access Scope | Key Capabilities |
|---|---|---|
| **Child (`child`)** | Locked AAC Board, Games, Schedule, Calm Down | Tap picture tiles, speak whole phrases, view daily schedule, play educational games. No settings or deletion permissions. |
| **Parent / Caregiver (`parent`)** | Full Administrative Access | PIN-protected. Add/edit/delete categories and words, record custom audio, take camera photos, track meltdown logs, manage face scan enrollment. |
| **Speech-Language Pathologist (`slp`)** | Clinical & Therapeutic Access | Prescribe therapy goals, view daily sentence length analytics, vocabulary diversity reports, write clinical observations, suggest custom AAC boards. |
| **Educator / Teacher (`educator`)** | Classroom Routine Access | Manage school-hour schedules, visual social stories for classroom behaviors, manage group vocabulary shelves. |

---

## 3. Screen-by-Screen Functional Workflow & Data Pipeline

### 3.1 AAC Communication Board (`AACBoardScreen.tsx`)
- **Primary Function**: The core speech output interface used directly by the child.
- **Workflow**:
  1. Child sees a grid of visual tiles organized by shelves (e.g., *I Want, Food, Drinks, Actions, Feelings, Places, People, Colors*).
  2. **Two Operating Modes**:
     - **Whole Phrases Mode (Gestalt Language Processing - GLP)**: Tapping a tile instantly speaks the complete phrase (e.g. Tapping "Water" speaks *"I want water please"*).
     - **Sentence Builder Strip**: Tapping tiles appends them sequentially to a top sentence bar (e.g., `[I Want]` + `[Cold]` + `[Water]`). Pressing the **"Play Sentence"** button reads the entire constructed sentence aloud using TTS.
  3. **Quick Access Bar**: Fixed emergency bar at the bottom with 4 permanent items: `Help`, `Water`, `Bathroom`, `Stop`. Always reachable regardless of category depth.
  4. **Smart Verb Conjugation Modal**:
     - Tapping any action verb opens an elegant 5-card popup showing all grammatical forms:
       - **1st Form / Base** (e.g., *Sing*, Urdu/Arabic: *المضارع*)
       - **3rd Person Singular (-s/-es)** (e.g., *Sings*, Urdu/Arabic: *المفرد*)
       - **2nd Form / Past** (e.g., *Sang*, Urdu/Arabic: *الماضي*)
       - **3rd Form / Past Participle** (e.g., *Sung*, Urdu/Arabic: *التام*)
       - **4th Form / Continuous (-ing)** (e.g., *Singing*, Urdu/Arabic: *المستمر*)
     - On desktop/tablets, all 5 forms appear in a single unclipped row. Form badges appear in a top pill so ARASAAC pictograms are 100% visible.
  5. **Multilingual & Dual-Language Display**:
     - Supports **English, Arabic (العربية), Urdu (اردو), Hindi, Spanish, French**.
     - Dual-language mode renders English alongside Arabic or Urdu on the same tile (e.g. `Water / ماء`).
     - Arabic and Urdu text automatically activates RTL layout and right-aligned typography.
  6. **Zero-Latency Audio Engine**:
     - System checks for custom caregiver recorded voice (`audioUri`). If present, plays high-fidelity `.m4a` file.
     - If not present, plays synthesized speech. Frontend Metro proxy `/api/tts` streams Google/Azure TTS and caches audio buffers in memory (`ttsRamCache`) and on local disk (`.cache/tts/`). Subsequent taps are instantaneous.

### 3.2 Category & Vocabulary Builder (`CategoryBuilderScreen.tsx` & `MyCategoriesScreen.tsx`)
- **Primary Function**: Caregiver tool to customize the child's world.
- **Workflow**:
  1. Caregiver unlocks via 4-digit PIN.
  2. Can create top-level **Shelves** (e.g., *Snacks*) or nested **Sub-Categories** (e.g., *Snacks -> Crunchy*).
  3. **Adding Words**:
     - **Single Word**: Enter word label, select color, pick pictogram or upload image, record audio.
     - **Bulk Paste**: Caregiver types or pastes comma-separated words (`"apple, banana, mango, strawberry"`). The system automatically fetches matching ARASAAC pictograms and generates cards in bulk.
     - **Voice Build**: Caregiver speaks natural sentences (see Section 3.3).
  4. **Media Assignment**:
     - Built-in library search across 14,800+ ARASAAC clinical pictograms.
     - Camera capture or device gallery upload.
     - In-app microphone audio recording with wave preview.
  5. **Visibility & Ordering**:
     - Caregiver can toggle `hidden: true` to temporarily remove a tile from the child's board without deleting historical data.
     - Sort order options: Alphabetical or Custom drag-and-drop.

### 3.3 Voice-Command Board Generator (`VoiceCommandScreen.tsx`)
- **Primary Function**: 90-second onboarding by voice.
- **Workflow**:
  1. Caregiver presses microphone button and speaks naturally in English, Urdu, or Arabic:
     > *"Create category Breakfast, sub category Cereals, words Cornflakes and Oatmeal, sub category Fruits, words Banana and Apple"*
  2. Audio is captured and processed through OpenAI Whisper API / Web Speech API.
  3. Frontend NLP Parser removes filler phrases (`"create a"`, `"the name of"`) and handles speech recognition glitches (`"catgires"` -> `"category"`, `"sub period"` -> `"sub category"`).
  4. Renders an interactive review table where the caregiver can edit, delete, or confirm the extracted hierarchy before committing to local database and backend.

### 3.4 Biometric Face AI Identification (`FaceScanScreen.tsx` & `EnrollChildScreen.tsx`)
- **Primary Function**: Non-verbal children who cannot navigate a login screen or PIN pad simply look into the camera.
- **Workflow**:
  1. Onboarding: Camera captures 3 reference frames of the child's face.
  2. `face-api.js` (running on-device via WebGL/Wasm) generates a 128-dimensional floating point descriptor vector (`Float32Array[128]`).
  3. When the app launches, the live camera scans the face, computes Euclidean distance against enrolled descriptors:
     $$\text{Distance} = \sqrt{\sum_{i=1}^{128} (v_{1}[i] - v_{2}[i])^2}$$
  4. If $\text{Distance} < 0.5$, match is confirmed in under 300ms, greeting the child by name and instantly loading their personalized AAC board and voice preferences.

### 3.5 Learning, Routine & Calm Tools
- **Visual Social Stories (`SocialStoriesScreen.tsx`)**:
  - Illustrated, read-aloud step-by-step guides for anxiety-inducing scenarios (e.g., *Visiting the Dentist*, *Getting a Haircut*, *First Day of School*, *Calming Down*).
  - Caregivers can compose custom multi-page stories with images and text.
- **Daily Visual Schedule (`ScheduleScreen.tsx`)**:
  - Morning-to-night routine checklist (*Brush Teeth -> Breakfast -> School Bus -> Therapy -> Dinner -> Bedtime*).
  - Interactive tap-to-complete with auditory praise and visual reward stars.
- **Learning Games (`GamesScreen.tsx`)**:
  - Mini-games teaching core concepts: Letters, Numbers, Shapes, Colors, Animals, Food, and Emotions.
  - Generates star economy and tracks consecutive daily streaks (`gameStreak`).
- **Sensory Calmer (`calm-down`)**:
  - Visual pacing circle for box breathing (*Inhale 4s -> Hold 4s -> Exhale 4s*) to help de-escalate sensory meltdowns.
- **Emergency Passcard (`passcard`)**:
  - One-tap viewable medical profile for teachers, babysitters, and first responders listing emergency phone numbers, sensory triggers, calming strategies, and allergies.

### 3.6 Clinician & Doctor Panel (`DoctorPanelScreen.tsx` & `ProgressScreen.tsx`)
- **Therapy Goals**: SLPs track specific metrics (e.g., *"Use 3-word sentences 10 times daily"*).
- **Care Log / Meltdown Tracker**: Caregivers log mood (`happy`, `calm`, `frustrated`, `overwhelmed`, `tired`), sensory triggers (loud noises, fluorescent lights), and meltdown duration in minutes.
- **Clinical Analytics**:
  - Total words spoken today/this week.
  - Longest sentence constructed.
  - Breakdown of requests vs. emotions.
- **Report Export**: Compiles data into an SLP/Pediatrician summary report (PDF/JSON).

---

## 4. Entity-Relationship Data Models (Prisma Schema)

Below is the complete, production-grade schema for **PostgreSQL** using **Prisma ORM**. It matches all existing TypeScript interfaces in `frontend/src/types.ts`.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// -----------------------------------------------------------------------------
// 1. User & Account Management
// -----------------------------------------------------------------------------

enum UserRole {
  PARENT
  EDUCATOR
  SLP
  ADMIN
}

enum DiagnosisType {
  AUTISM
  DOWN_SYNDROME
  SPEECH_DELAY
  ADHD
  HEARING_IMPAIRMENT
  VISUAL_IMPAIRMENT
  DYSLEXIA
  CEREBRAL_PALSY
  INTELLECTUAL_DISABILITY
  SENSORY_PROCESSING
  NON_VERBAL
  GENERAL
}

enum LanguageCode {
  EN_US
  AR_SA
  UR_PK
  HI_IN
  ES_ES
  FR_FR
}

enum VoiceType {
  BOY
  GIRL
  WOMAN
  MAN
}

enum BoardMode {
  PHRASE
  SENTENCE
}

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  passwordHash  String
  fullName      String
  role          UserRole       @default(PARENT)
  phoneNumber   String?
  parentPin     String         @default("1234") // 4-digit PIN for protected areas
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  children      ChildProfile[]
  clinicalNotes ClinicalNote[] @relation("AuthoredNotes")

  @@index([email])
}

// -----------------------------------------------------------------------------
// 2. Child Profile & Biometrics
// -----------------------------------------------------------------------------

model ChildProfile {
  id                   String          @id @default(uuid())
  userId               String
  user                 User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name                 String
  age                  Int
  diagnoses            DiagnosisType[]
  photoUrl             String?
  
  // Settings & Preferences
  language             LanguageCode    @default(EN_US)
  voiceType            VoiceType       @default(BOY)
  boardMode            BoardMode       @default(PHRASE)
  bilingualDisplay     Boolean         @default(false)
  simpleMode           Boolean         @default(true)
  speechRate           Float           @default(0.9)
  boardColumns         Int             @default(3)
  highContrast         Boolean         @default(false)
  hapticsEnabled       Boolean         @default(true)
  
  // Gamification & Rewards
  stars                Int             @default(0)
  badges               String[]        @default([])
  consecutiveDays      Int             @default(0)
  
  // Biometric Face AI
  faceConsent          Boolean         @default(false)
  faceVersion          Int             @default(1)
  enrolledAt           DateTime?
  faceEmbeddings       FaceEmbedding[]

  // Child Specific Content
  shelves              CategoryShelf[]
  socialStories        SocialStory[]
  scheduleTasks        ScheduleTask[]
  careLogs             CareLog[]
  therapyGoals         TherapyGoal[]
  clinicalNotes        ClinicalNote[]  @relation("ChildNotes")
  passcard             CaregiverPasscard?
  usageSummary         UsageSummary?

  createdAt            DateTime        @default(now())
  updatedAt            DateTime        @updatedAt

  @@index([userId])
}

model FaceEmbedding {
  id             String       @id @default(uuid())
  childId        String
  child          ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
  
  // 128-dimensional floating point vector stored as a JSON array of numbers
  vector         Json
  isEnrolment    Boolean      @default(true) // true = baseline, false = learned
  createdAt      DateTime     @default(now())

  @@index([childId])
}

// -----------------------------------------------------------------------------
// 3. AAC Shelves, Words & Verb Forms
// -----------------------------------------------------------------------------

enum TileSize {
  SM
  MD
  LG
}

enum VerbTag {
  FIRST      // 1st form (Base)
  S_ES       // 3rd singular
  SECOND     // 2nd form (Past)
  THIRD      // 3rd form (Participle)
  FOURTH     // 4th form (Continuous)
}

model CategoryShelf {
  id               String          @id @default(uuid())
  childId          String
  child            ChildProfile    @relation(fields: [childId], references: [id], onDelete: Cascade)
  
  name             String
  seedName         String?         // Reference English key for translations
  icon             String?         // Emoji icon
  imageUri         String?         // Custom photo or ARASAAC URL
  color            String?         // Hex color code (e.g. #4F46E5)
  order            Int             @default(0)
  hidden           Boolean         @default(false)
  source           String          @default("manual") // voice | list | manual | seed
  
  // Nested Folder Hierarchy
  parentCategoryId String?
  parentCategory   CategoryShelf?  @relation("SubCategories", fields: [parentCategoryId], references: [id], onDelete: Cascade)
  subCategories    CategoryShelf[] @relation("SubCategories")

  words            CustomWord[]
  
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  @@index([childId])
  @@index([parentCategoryId])
}

model CustomWord {
  id              String         @id @default(uuid())
  categoryId      String
  category        CategoryShelf  @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  label           String         // Display label
  phrase          String         // Text spoken aloud by TTS
  seedLabel       String?        // Original English seed label
  emoji           String?
  imageUri        String?        // ARASAAC URL or S3 image path
  color           String?
  audioUri        String?        // S3 URL to caregiver recorded voice
  useTextToSpeech Boolean        @default(false)
  size            TileSize       @default(MD)
  order           Int            @default(0)
  hidden          Boolean        @default(false)
  isCustom        Boolean        @default(false)
  
  // Analytics
  useCount        Int            @default(0)
  lastUsedAt      DateTime?

  // Verb Conjugation Link
  verbFormTag     VerbTag?
  verbGroupId     String?
  verbGroup       VerbConjugationGroup? @relation(fields: [verbGroupId], references: [id], onDelete: SetNull)

  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([categoryId])
  @@index([verbGroupId])
}

model VerbConjugationGroup {
  id          String       @id @default(uuid())
  base        String       // e.g. "eat"
  sForm       String       // e.g. "eats"
  past        String       // e.g. "ate"
  participle  String       // e.g. "eaten"
  continuous  String       // e.g. "eating"
  emoji       String?
  
  words       CustomWord[]
}

// -----------------------------------------------------------------------------
// 4. Learning, Routines, Stories & Calm
// -----------------------------------------------------------------------------

enum StoryCategory {
  ROUTINE
  HEALTH
  SCHOOL
  EMOTIONS
  SOCIAL
  CUSTOM
}

model SocialStory {
  id          String            @id @default(uuid())
  childId     String
  child       ChildProfile      @relation(fields: [childId], references: [id], onDelete: Cascade)
  
  title       String
  category    StoryCategory     @default(CUSTOM)
  icon        String
  description String
  coverImage  String?
  pages       SocialStoryPage[]
  
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@index([childId])
}

model SocialStoryPage {
  id            String      @id @default(uuid())
  storyId       String
  story         SocialStory @relation(fields: [storyId], references: [id], onDelete: Cascade)
  pageIndex     Int
  text          String
  imageUri      String?
  emoji         String?
  pictogramName String?

  @@index([storyId])
}

model ScheduleTask {
  id          String       @id @default(uuid())
  childId     String
  child       ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
  
  title       String
  time        String?      // e.g. "08:30 AM"
  emoji       String
  pictogram   String?
  order       Int          @default(0)
  completed   Boolean      @default(false)
  dayOfWeek   Int          // 0 = Sunday .. 6 = Saturday

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([childId])
}

model CaregiverPasscard {
  id                     String       @id @default(uuid())
  childId                String       @unique
  child                  ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
  
  emergencyContactName   String
  emergencyContactPhone  String
  secondaryContactName   String?
  secondaryContactPhone  String?
  communicationStyle     String
  sensoryTriggers        String[]
  calmingStrategies      String[]
  allergies              String[]
  dietaryRestrictions   String?
  specialInstructions    String?
  
  updatedAt              DateTime     @updatedAt
}

// -----------------------------------------------------------------------------
// 5. Clinical Logs, Therapy Goals & Analytics
// -----------------------------------------------------------------------------

enum MoodType {
  HAPPY
  CALM
  FRUSTRATED
  OVERWHELMED
  TIRED
}

enum TherapyCategory {
  SPEECH
  OCCUPATIONAL
  BEHAVIORAL
  SENSORY
}

model CareLog {
  id                  String       @id @default(uuid())
  childId             String
  child               ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
  
  date                DateTime     @default(now())
  mood                MoodType
  sensoryTriggers     String[]
  meltdownDurationMin Int          @default(0)
  communicationWins   String?
  notes               String?

  createdAt           DateTime     @default(now())

  @@index([childId])
}

model TherapyGoal {
  id           String          @id @default(uuid())
  childId      String
  child        ChildProfile    @relation(fields: [childId], references: [id], onDelete: Cascade)
  
  title        String
  category     TherapyCategory
  targetCount  Int
  currentCount Int             @default(0)
  unit         String          // e.g. "sentences/day", "taps"
  completed    Boolean         @default(false)
  prescribedBy String?
  assignedDate DateTime        @default(now())
  notes        String?

  updatedAt    DateTime        @updatedAt

  @@index([childId])
}

model ClinicalNote {
  id              String       @id @default(uuid())
  childId         String
  child           ChildProfile @relation("ChildNotes", fields: [childId], references: [id], onDelete: Cascade)
  authorId        String
  author          User         @relation("AuthoredNotes", fields: [authorId], references: [id])
  
  date            DateTime     @default(now())
  title           String
  content         String
  recommendations String[]

  createdAt       DateTime     @default(now())

  @@index([childId])
  @@index([authorId])
}

model UsageSummary {
  id                    String       @id @default(uuid())
  childId               String       @unique
  child                 ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
  
  wordTotals            Json         // Record<string, number> (wordId -> count)
  wordsByDay            Int[]        // 7 integers for Sun..Sat
  scheduleByDay         Int[]        // 7 integers for completion %
  lastPlayedDate        DateTime?
  longestSentenceLength Int          @default(0)
  longestSentenceWords  String[]
  sentencesSpoken       Int          @default(0)
  correctionsUsed       Int          @default(0)
  
  updatedAt             DateTime     @updatedAt
}
```

---

## 5. RESTful API Endpoints Specification

All endpoints are prefixed with `/api/v1`. Authentication requires a Bearer JWT token in the `Authorization` header, except for health checks and login/register.

### 5.1 Authentication & User Management
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create a parent/clinician account with email, password, and parent PIN. |
| `POST` | `/auth/login` | Authenticate and obtain JWT token. |
| `GET` | `/auth/me` | Retrieve profile of the logged-in user and linked children. |
| `POST` | `/auth/verify-pin` | Validates parent PIN before opening caregiver area. |

### 5.2 Child Profiles & Face AI
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/children` | List all child profiles under the current account. |
| `POST` | `/children` | Create a new child profile (name, age, diagnoses, voice). |
| `GET` | `/children/:id` | Get single child details, active preferences, and passcard. |
| `PUT` | `/children/:id/settings` | Update language, voiceType, boardMode, and layout density. |
| `POST` | `/children/:id/face-enroll` | Upload 128-dim vectors from 3 reference frames for Face AI. |
| `POST` | `/children/face-identify` | Accepts a 128-dim vector from live camera; returns matched `childId` if distance < 0.5. |

### 5.3 AAC Shelves & Custom Vocabulary
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/children/:childId/shelves` | Fetch all shelves, sub-categories, and words for the child. |
| `POST` | `/children/:childId/shelves` | Create a new shelf or sub-category. |
| `PUT` | `/shelves/:id` | Edit shelf name, color, icon, or hidden status. |
| `DELETE` | `/shelves/:id` | Delete a shelf and cascade to words. |
| `POST` | `/shelves/:shelfId/words` | Add a single custom word to a shelf. |
| `POST` | `/shelves/:shelfId/words/bulk`| Add multiple words from comma-separated input. |
| `PUT` | `/words/:id` | Update word label, imageUri, audioUri, or verbFormTag. |
| `DELETE` | `/words/:id` | Remove a custom word from the board. |
| `POST` | `/words/:id/tap` | Record a tap event (increments `useCount`, updates `lastUsedAt`). |

### 5.4 Media, Voice & AI Proxies
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/media/upload-url` | Generate an S3/Cloudflare R2 presigned PUT URL for photos or audio. |
| `GET` | `/audio/tts` | High-speed TTS proxy with cache header (`?text=...&lang=...&voice=...`). |
| `POST` | `/audio/whisper` | Multipart audio upload to Whisper for the Voice-Command Board generator. |
| `GET` | `/images/search` | Search ARASAAC clinical pictograms and Pixabay safe images. |
| `POST` | `/images/generate` | Proxy to OpenAI DALL-E 3 for custom AAC pictogram generation. |

### 5.5 Synchronization (Offline-First Engine)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/sync/pull?since={timestamp}` | Fetch all entities changed or deleted since the last sync date. |
| `POST` | `/sync/push` | Send a batch of local mutations (creates, updates, deletes) with client UUIDs. |

### 5.6 Routines, Clinical Logs & Reports
| Method | Endpoint | Description |
|---|---|---|
| `GET/POST`| `/children/:childId/schedule` | Get or update daily visual schedule items. |
| `GET/POST`| `/children/:childId/stories` | Get or create visual social stories. |
| `GET/POST`| `/children/:childId/care-logs` | Get or log daily mood, meltdown minutes, and triggers. |
| `GET/POST`| `/children/:childId/therapy-goals`| Clinician goal tracking (target vs. current count). |
| `GET` | `/children/:childId/report/pdf`| Download formatted PDF report for pediatricians & therapists. |

---

## 6. Offline-First Synchronization Architecture

Because Angel Talk is designed for vulnerable children, speech cannot fail when the internet drops.

### 6.1 Local-First Principles
1. **Local Writes First**: Every action (adding a word, toggling a shelf, recording a sentence, updating a schedule) writes immediately to local storage (`AsyncStorage` / SQLite).
2. **UUID Generation**: All IDs are generated on the client using UUID v4. No auto-incrementing integer IDs.
3. **Soft Deletions**: Records are marked with `deletedAt: DateTime?`. A delete mutation sets the timestamp rather than destroying the row immediately, ensuring smooth cross-device synchronization.

### 6.2 The Sync Protocol
```
CLIENT                                                           BACKEND
  |                                                                 |
  | 1. GET /api/v1/sync/pull?since=2026-10-15T09:00:00Z             |
  |---------------------------------------------------------------->|
  |                                                                 | Query DB:
  |                                                                 | updatedAt > since
  | 2. Returns changed Shelves, Words, Goals, Logs                  |
  |<----------------------------------------------------------------|
  |                                                                 |
  | Apply deltas to local SQLite / AsyncStorage                     |
  |                                                                 |
  | 3. POST /api/v1/sync/push                                       |
  |    {                                                            |
  |      mutations: [                                               |
  |        { table: "CustomWord", action: "UPSERT", data: {...} },  |
  |        { table: "CareLog",    action: "CREATE", data: {...} }   |
  |      ]                                                          |
  |    }                                                            |
  |---------------------------------------------------------------->|
  |                                                                 | Transaction:
  |                                                                 | - Check timestamps
  |                                                                 | - Last-Write-Wins
  | 4. Returns { success: true, syncedAt: "2026-10-15T10:15:00Z" }  |
  |<----------------------------------------------------------------|
  | Update lastSyncedAt locally                                     |
```

### 6.3 Conflict Resolution
- **Last-Write-Wins (LWW)**: Each entity possesses an `updatedAt` timestamp. The server accepts the mutation with the newer timestamp.
- **Additive Telemetry**: For `useCount` and `UsageSummary`, counts are merged additively ($\text{serverCount} + \text{clientDelta}$) rather than overwritten.

---

## 7. Storage, Media & Voice Strategy

1. **ARASAAC Pictograms**:
   - Built-in clinical library hosted on Cloudflare CDN (`https://static.arasaac.org/pictograms/{id}/{id}_500.png`).
   - Client caches downloaded pictograms in the local application documents directory.
2. **Caregiver Voice Recordings**:
   - Recorded as AAC-compatible `.m4a` or `.mp3` files (sampled at 44.1kHz, mono, compressed).
   - Saved locally first; uploaded asynchronously to S3/Cloudflare R2 via presigned URLs.
3. **High-Speed TTS Streaming Proxy**:
   - Endpoints `/api/v1/audio/tts` accept text, language code, and voice pitch/speed.
   - Server checks Redis cache for hash `MD5(text + lang + voice + rate)`.
   - If cached, returns `audio/mpeg` in < 20ms. If uncached, streams from TTS provider, caches buffer in Redis, and pipes response to client.

---

## 8. Master Copy-Paste Prompt for Claude

> **Instructions for the User**: Copy the exact prompt inside the block below and paste it into Claude (Claude 3.5 Sonnet / Claude 3 Opus) to generate the complete backend codebase, database migrations, controllers, and offline sync hooks!

```text
You are an expert Principal Full-Stack Engineer and Database Architect.
I am building the complete backend and database for "Angel Talk", an offline-first, family-first AAC (Augmentative and Alternative Communication) mobile application for non-verbal and speech-delayed children.

I have already finalized the complete product specification, UI screens, and frontend data models in a file named `BACKEND_AND_DATABASE_WORKFLOW.md`. Here is everything you need to know about the system:

1. CORE SYSTEM ARCHITECTURE & STACK:
   - Backend Runtime: Node.js (v18+) with Express or NestJS (TypeScript).
   - Database: PostgreSQL (v15+) with Prisma ORM.
   - Media & File Storage: AWS S3 or Cloudflare R2 (presigned URL uploads for custom photos and caregiver voice recordings).
   - Voice & AI: Whisper API proxy for voice command parsing, Google/Azure Neural TTS proxy with Redis caching for instant speech output.
   - Client Architecture: React Native / Expo (Offline-first with AsyncStorage / SQLite and bi-directional delta synchronization).

2. KEY DOMAIN ENTITIES & MODULES:
   - User & Roles: Parent/Caregiver, Speech-Language Pathologist (SLP), Educator, and Child (RBAC). 4-digit PIN protection for adults.
   - Child Profile & Biometrics: Diagnoses (Autism ASD, Down Syndrome, etc.), custom voice settings (Boy, Girl, Woman, Man), language (English, Arabic, Urdu, Hindi, Spanish, French), Face AI 128-dimensional embedding vectors (face-api.js distance < 0.5 threshold).
   - AAC Vocabulary & Shelves: Hierarchical folders (Shelves -> Sub-categories -> Words), custom pictograms (ARASAAC URLs), caregiver voice clips (.m4a), color swatches, drag-and-drop order, visibility toggling (hide from child without deleting).
   - Smart Verb Conjugation: 5 grammatical forms (1st Base, -s/-es, 2nd Past, 3rd Participle, 4th Continuous) with Arabic/Urdu badges.
   - Learning & Routines: Illustrated Social Stories, Visual Daily Schedules, Gamified Stars & Streaks, Sensory Breathing Calmer, and Emergency Passcards.
   - Clinical Panel & Telemetry: Daily care logs (meltdown minutes, sensory triggers, mood), SLP therapy goals, and PDF progress report generation.
   - Offline Synchronization: Pull/Push delta sync engine with Last-Write-Wins (LWW) conflict resolution.

3. YOUR TASK:
Generate a production-ready, clean, modular backend codebase according to best enterprise practices:
   A) `schema.prisma`: Complete PostgreSQL Prisma schema with all models, enums, relations, cascades, and indexes matching the specification above.
   B) `src/server.ts` & `src/config/`: Express server setup with CORS, helmet, rate limiting, and JWT authentication.
   C) Authentication & PIN Controller: Register, login, profile, and parent PIN verification middleware.
   D) AAC Shelves & Words Controller: CRUD for shelves, words, bulk CSV insertion, tap counting, and verb group links.
   E) Face AI Embedding Matching Route: Euclidean distance vector calculation (`Float32Array[128]`) for child identification.
   F) High-Speed TTS & Media Upload Routes: S3 presigned URL generation and TTS audio streaming proxy with in-memory/Redis caching.
   G) Offline Sync Engine: `/api/v1/sync/pull` and `/api/v1/sync/push` endpoints implementing delta sync and Last-Write-Wins conflict resolution.
   H) Seed Script (`prisma/seed.ts`): Pre-populates starter shelves (Food, Drinks, Actions, Feelings, People) and verb conjugations in English, Arabic, and Urdu.

Write high-quality TypeScript code with full type definitions, error handling, and comments. Start by generating the complete Prisma schema and the directory architecture.
```

---

## 9. Conclusion & Implementation Roadmap

1. **Phase 1: Database & Core API** (Run Prisma migration, set up PostgreSQL, configure JWT + PIN auth).
2. **Phase 2: AAC Shelf & Word Management** (CRUD endpoints, bulk upload, verb form linking).
3. **Phase 3: Media & TTS Proxy** (Cloudflare R2 presigned URLs, Redis-backed low-latency TTS proxy).
4. **Phase 4: Face AI & Biometrics** (Enrollment vector storage, sub-300ms Euclidean distance lookup).
5. **Phase 5: Offline Sync Engine** (Sync pull/push endpoints, local React Native mutation queue).
6. **Phase 6: Clinical & Reporting Module** (Therapy goals, care logs, automated PDF export for SLPs).

