# Angel Talk — Full Technical Documentation

> **Update:** This app is a standalone Expo project at `Angel Talk/` (own `package.json`, `app.json`, `App.tsx`, bundle id `com.timeglobaltech.angeltalk`). Everything below describes the underlying feature set accurately. Files genuinely shared with BloomLearn (§13) were duplicated into both apps rather than symlinked/shared via a workspace package, as a pragmatic first pass — see the split's final report for the tradeoff.

## 1. Overview

Talk Board is the core AAC (Augmentative and Alternative Communication) communication feature: a non-verbal or speech-delayed child taps a picture on a grid, and the app speaks the word or sentence out loud (**Picture → Voice**). It is the feature a child uses many times a day, every day, to make requests, answer questions, and express feelings without needing to speak or type.

**End user:** the child directly (large touch targets, symbol-first, minimal reading required), with a parent/therapist/teacher in an editing role behind a PIN gate to build and manage vocabulary.

**Core user flow:** A parent enrolls a child (face photo or manual profile), then builds/curates a personal picture vocabulary (from a large built-in ARASAAC symbol library, the phone's photo gallery, an internet image search, or by generating an image with AI). The child opens the Talk board, taps through categories to find a picture, taps it, and the app speaks the word/phrase aloud — building toward full sentences via a sentence strip. A parent can review "unknown request" pictures the child searched for, moderate what gets added, and match spoken phrases back to existing pictures.

## 2. Tech Stack

- **Framework:** React Native 0.81.5 on Expo SDK ~54.0.37
- **Language:** TypeScript ~5.9.2, strict function components
- **State management:** No Redux/Zustand — plain React `useState`/`useMemo` per screen, plus one app-wide `SettingsContext` (React Context) for language/accessibility settings
- **Navigation:** No navigation library — `App.tsx` is a single hand-written state machine (`screen` string + `go(screen)` function) that conditionally renders one screen component at a time
- **Storage:** `@react-native-async-storage/async-storage` 2.2.0 (on web, this transparently falls back to `window.localStorage` using the same string keys — verified empirically this session)
- **Speech output:** `expo-speech` (via a shared `tts.ts` wrapper) and, for board audio playback with word-by-word sentence building, a custom `audio.ts` module
- **Camera/photo input:** `expo-camera` (face login), `expo-image-picker` (gallery uploads for custom word pictures)

## 3. Dependency List (used by Talk Board's own files)

| Library | Version | Used for | File(s) |
|---|---|---|---|
| `expo-speech` (via `tts.ts`) | ~14.0.7 | Speaking tapped words/sentences aloud | `AACBoardScreen.tsx`, `MyCategoriesScreen.tsx`, `CategoryBuilderScreen.tsx`, `PhraseMatchLibraryScreen.tsx`, `VoiceCommandMatchScreen.tsx`, `AddByVoiceScreen.tsx` |
| `expo-camera` | ~17.0.8 | Face-login capture (shared onboarding, see §13) | `FaceScanScreen.tsx`, `EnrollChildScreen.tsx` |
| `expo-image-picker` | ~17.0.11 | Pick a photo from the gallery as a word's picture | `AddByVoiceScreen.tsx`, `ContentReviewQueueScreen.tsx`, `MyCategoriesScreen.tsx` (via `WordEditor`) |
| `@expo/vector-icons` (Ionicons) | ^15.0.3 | All icon glyphs across every Talk Board screen | all screens listed in §5 |
| `@react-native-async-storage/async-storage` | 2.2.0 | Persisting categories/words, phrase library, content review queue, admin PIN | `customCategories.ts`, `phraseMatch.ts`, `contentQueue.ts`, `passcode.ts` |
| `expo-secure-store` | ~15.0.8 | Admin PIN storage (falls back to AsyncStorage where unavailable, e.g. web) | `passcode.ts` |
| `expo-haptics` (via `haptics.ts`) | ~15.0.8 | Tap feedback vibration | `AACBoardScreen.tsx`, `VoiceCommandMatchScreen.tsx` |
| `react-native-svg` | 15.12.1 | Mascot illustration | `Mascot.tsx` (shared component, see §13) |

Not used by Talk Board's own code but present in the monorepo for other features: `expo-audio` (voice recording — used by Picture Talk and by `AddByVoiceScreen`'s speech capture, see §13), `expo-image-manipulator`, `jpeg-js`.

## 4. Folder & File Structure (Talk Board's files within the current repo)

```
src/screens/
  AACBoardScreen.tsx          — the child-facing communication grid itself
  CategoryBuilderScreen.tsx   — parent tool: build a category by typed/voice command
  MyCategoriesScreen.tsx      — parent tool: manage/edit/reorder/hide categories & words
  AddByVoiceScreen.tsx        — parent/child tool: add one new word by speaking it (photo + AI image + gallery + web search sources)
  PhraseMatchLibraryScreen.tsx— parent tool: manage the phrase-matching library
  VoiceCommandMatchScreen.tsx — child-facing: speak a phrase, app finds & speaks the matching board phrase
  ContentReviewQueueScreen.tsx— parent tool: approve/reject pictures a child's search queued up

src/components/
  WordEditor.tsx              — shared word-edit form used inside MyCategoriesScreen
  QuickActionBar.tsx          — quick "Help/Water/Bathroom/Stop" express row on the board
  BracketFrame.tsx            — decorative framing used around picture tiles

src/modules/
  aacPictograms.ts            — the built-in ARASAAC symbol → image URL map
  customCategories.ts         — category/word CRUD + AsyncStorage persistence
  commandParser.ts            — parses a typed or spoken "create category X with words A, B, C" command
  phraseMatch.ts               — phrase-library storage + fuzzy matching for VoiceCommandMatchScreen
  contentQueue.ts              — "pending review" picture queue storage
  contentFilter.ts             — inappropriate-content filtering for anything a child/parent adds
  wordImage.ts                 — emoji fallback + AI image generation + image caching for a word
  imageLibrary.ts              — local picture library index/cache (shared with Picture Talk, see §13)
  imageSearch.ts               — Pixabay web image search + download (the "internet picture" source)
  librarySeed.ts / bookVocab*  — pre-seeded starter vocabulary content
  arasaacDict.json             — the raw ARASAAC symbol dictionary data
  audio.ts                     — word/sentence playback + voice-clip recording (shared, see §13)
```

## 5. Screens

### `AACBoardScreen.tsx`
- **Purpose:** the main communication board the child uses.
- **Renders:** a category selector, a grid of picture tiles for the active category, a "Say It For Me" full-sentence category, a sentence-building strip at the top (tap multiple words to build "I want water"), a Quick Access express row (Help/Water/Bathroom/Stop), and an entry point into `AddByVoiceScreen` for adding a new word on the fly.
- **State:** active category id, the in-progress sentence strip array, tap-feedback/animation state.
- **Navigates to/from:** entered from Home (`onTabChange("speak")`), can open `AddByVoiceScreen` as a modal.
- **Flow:** `Home → AACBoardScreen (tab: speak) → tap category → tap picture tile → playWord()/speak() → (optional) add to sentence strip → playSentence()`.

### `CategoryBuilderScreen.tsx`
- **Purpose:** parent-facing tool to create a new category (and seed it with starter words) via a typed or spoken command, e.g. "Fruits: apple, banana, orange".
- **Renders:** a text/voice input, a preview of parsed items (via `commandParser.parseCategoryCommand`), emoji/AI-image assignment per word, and a save action (`customCategories.createCategory`).
- **State:** raw command text, parsed item list, per-item resolved image.
- **Navigates to/from:** reached from `MyCategoriesScreen`, behind `PinGate`.

### `MyCategoriesScreen.tsx`
- **Purpose:** parent's category/word management hub — the "edit everything" screen.
- **Renders:** list of all categories (with hide/show toggle — `CustomCategory.hidden`), each category's words, tap-to-preview-speak, export/share, and entry into `WordEditor` per word and `CategoryBuilderScreen` for new categories.
- **State:** expanded/selected category, editor-modal visibility.
- **Navigates to/from:** reached from the Parent Hub / admin area behind `PinGate`; opens `CategoryBuilderScreen` and `WordEditor`.

### `AddByVoiceScreen.tsx`
- **Purpose:** the fastest path to add one new word — speak it, and the app builds the whole word entry (transcription → image → category placement) for you. This is the screen that already substantially answers the client's "create vocabulary by voice command" ask from Idea 1 (see §13 for what's *not* yet covered).
- **Renders:** a multi-step flow (`Step = "speak" | "confirm" | "image" | "category" | "done"`) — record voice → transcribe (`aiImage.transcribeAudio`) → confirm word text → pick/generate a picture (AI-generated via `generateWordImage`, web search via `imageSearch.searchImages`, or gallery via `expo-image-picker`) → assign to a category (`presetCategoryId` or the folder picker) → save (`customCategories.addWord`).
- **State:** current step, recorded audio, transcribed text, candidate images, selected category.
- **Navigates to/from:** opened as a modal from `AACBoardScreen` (child-mode) or from category management (parent-mode, `childMode` prop distinguishes wording).

### `PhraseMatchLibraryScreen.tsx`
- **Purpose:** parent tool to manage the library of phrases `VoiceCommandMatchScreen` can recognize.
- **Renders:** list of `PhraseMatch` entries, add/edit/delete, each with an optional custom photo.
- **State:** phrase list, edit-modal state.

### `VoiceCommandMatchScreen.tsx`
- **Purpose:** child speaks a phrase out loud; the app listens (`modules/voice.ts`) and finds the closest matching phrase in the library (`phraseMatch.findMatchingPhrase`), then speaks/confirms it back. A second, complementary way into the same "communicate" goal as tapping pictures.
- **Renders:** a big microphone button, listening state, matched-phrase confirmation card.
- **State:** listening flag, transcript, matched result.

### `ContentReviewQueueScreen.tsx`
- **Purpose:** parent moderation queue — when a child (via `AddByVoiceScreen`'s search/AI path) adds an image, it can be queued here for parent approval before it becomes a permanent board tile.
- **Renders:** list of `ContentReviewEntry` items with the pending image, approve/reject actions.
- **State:** queue list, filter by `ReviewStatus`.

## 6. Components (Talk Board–specific)

| Component | File | Props | Purpose | Used in |
|---|---|---|---|---|
| `WordEditor` | `components/WordEditor.tsx` | word, onSave, onDelete (exact prop shape not fully audited — flagged) | Edit a single word's label/image/phrase | `MyCategoriesScreen` |
| `QuickActionBar` | `components/QuickActionBar.tsx` | onPress handlers per quick word | The express Help/Water/Bathroom/Stop row | `AACBoardScreen` |
| `BracketFrame` | `components/BracketFrame.tsx` | children, size | Decorative bracket framing around a tile | `AACBoardScreen` |

Components used by Talk Board but shared with other parts of the app (`PinGate`, `Mascot`, `LangBadge`, `TabBar`, `Card`, `BigButton`) are documented once in §13, not duplicated here.

## 7. Functions & Logic (key non-trivial functions)

| Function | File | Does |
|---|---|---|
| `getPictogramUrl(label)` | `aacPictograms.ts` | Looks up a word label in the ARASAAC map and returns an image URL, or `null` if no built-in symbol exists (caller then falls back to emoji/custom image) |
| `createCategory(name, words)` / `addWord(categoryId, word)` | `customCategories.ts` | Persist a new category or word into the in-memory cache + fire-and-forget `AsyncStorage.setItem` |
| `parseCategoryCommand(text)` | `commandParser.ts` | Parses free text like "Fruits: apple, banana" into a structured `ParsedCategoryCommand` (category name + word list) |
| `findMatchingPhrase(transcript)` | `phraseMatch.ts` | Fuzzy-matches a spoken transcript against the stored phrase library, returns the best match or `null` |
| `searchImages(query)` / `downloadTileImage(hit)` | `imageSearch.ts` | Calls the Pixabay API for a keyword, returns `ImageHit[]`; downloads/caches a chosen result locally |
| `resolveEmoji(word)` / `generateImageForWord(word)` | `wordImage.ts` | Emoji fallback lookup; AI-image generation fallback when no ARASAAC/gallery/web image is chosen |
| `playWord(word)` / `playSentence(words)` | `audio.ts` | Speaks one word, or plays a built sentence strip word-by-word with natural pauses |

## 8. Data Models / Types (used by Talk Board)

From `types.ts`:
- **`CustomCategory`**: `{ id, name, icon, words: CustomWord[], hidden?: boolean }` — a parent-defined vocabulary folder; `hidden` is the parent-controlled show/hide toggle.
- **`CustomWord`**: `{ id, label, phrase?, imageUri?, emoji?, ... }` — one board tile's data: its spoken label, an optional full phrase (for "Say It For Me"-style cards), and its picture source.
- **`ParsedCategoryCommand`**: `{ categoryName, words: string[] }` — output of `commandParser.parseCategoryCommand`.
- **`PhraseMatch`**: `{ id, phrase, imageUri?, ... }` — one entry in the voice-command phrase library.
- **`ContentReviewEntry`**: `{ id, imageUri, word, status: ReviewStatus, ... }`, `ReviewStatus = "pending" | "approved" | "rejected"`.
- **`TileSize`**: `'sm' | 'md' | 'lg'` — board grid density setting.

`ChildProfile`, `AppSettings`, `LanguageCode` are shared models — see §13.

## 9. Design System

- **Colors** (`theme.ts`, shared file — Talk Board uses these tokens): `bg #f5f0e6` (page background), `card #ffffff`, `forest #2d5f4f` / `forestDark #1f4437` / `forestLight #e3ede8` (brand green), pastel tile colors `blue #cfe0ec`, `yellow #f3e3bd`, `green #d9e8d3`, `pink #f3d9d9`, `orange #f0ddc4`, `purple #e3d9ef` (each with a "Deep" variant for text/icons on that tile), `textDark #2b2a26` / `textMid #6f6a5e` / `textLight #a39d8c`, `danger #c45`.
- **Radius tokens:** `radius 20`, `radiusSm 14`, `radiusLg 28`.
- **Typography:** no custom font family loaded — system default font, with size driven by the shared `fontSizeScale` accessibility setting (`small/medium/large/xlarge`).
- **Icons:** Ionicons (`@expo/vector-icons`) throughout; pictures themselves come from three sources — the ARASAAC symbol set (clinical AAC standard, `arasaacDict.json`), custom photos (gallery), and Pixabay web search results.

## 10. Storage / Data Persistence

| Key | Stores | Shape |
|---|---|---|
| `kiddocare_custom_categories` | All categories and their words | `CustomCategory[]` |
| `kiddocare_phrase_library` | Voice-command phrase library | `PhraseMatch[]` |
| `kiddocare_content_review_queue` | Pending picture-approval queue | `ContentReviewEntry[]` |
| `kiddocare_library_index` | Local image cache index (shared with Picture Talk, §13) | index map |
| `kiddocare_image_cache` | Per-word resolved image cache | map |
| `kiddocare_admin_pin` | 4-digit parent PIN (shared, §13) | string |

## 11. Accessibility Features

- **Font size** (`AppSettings.fontSize`): small/medium/large/xlarge, scales all board text via `fontSizeScale`.
- **High contrast**: alternate palette mode (shared `SettingsContext` flag).
- **Reduce motion**: disables tile bounce/animation on the board.
- **Board density / tile size**: `boardColumns` setting + `TileSize` per word control grid density.
- **Haptics**: tap feedback vibration on picture tap, toggleable.

## 12. Internationalization (i18n)

- Supported languages: English (`en-US`) and Arabic (`ar-SA`) are fully translated and actively maintained; `types.ts` also declares `ur-PK`, `hi-IN`, `es-ES`, `fr-FR` as language codes but these are not confirmed fully translated.
- Translation strings live in the shared `modules/i18n.ts` (`t(key, lang)` function, `TKey` type).
- Arabic triggers full RTL layout mirroring (verified visually via screenshot capture this session).
- `canonicalWordEn()` in `i18n.ts` recovers a word's canonical English anchor regardless of displayed language — used when matching a spoken/typed word back to its category regardless of UI language.

## 13. Known Limitations / Not Yet Built / Ambiguous Items

- **Voice-command category creation (Idea 1) is more built than the earlier plan assumed.** `AddByVoiceScreen.tsx` already does speech → transcription → image → category placement for a single **word**. What's still missing is doing the same thing at the **category** level purely by voice (today `CategoryBuilderScreen` accepts a spoken/typed command string, but it's typed into a text box, not a live microphone capture in that screen — confirm with client whether `AddByVoiceScreen`'s pattern already satisfies the ask or a dedicated flow is still wanted).
- **Web image search already exists** (`imageSearch.ts`, Pixabay-backed) — this closes the "download from the internet" part of Idea 1 more than previously documented, contingent on a Pixabay API key being configured (`EXPO_PUBLIC_PIXABAY_KEY`; falls back gracefully via `hasPixabayKey()` if absent).
- **Shared/ambiguous files** — these are used by Talk Board but are not exclusively its own; do not move them into Talk Board's app folder without also checking Picture Talk's needs:
  - `modules/audio.ts` — word/sentence playback (Talk Board) AND voice-clip recording used by `AddByVoiceScreen` AND Picture Talk's `SentencePictureScreen`/learning-engine voice practice.
  - `modules/voice.ts` — speech-to-text listening, used by `VoiceCommandMatchScreen` and `AddByVoiceScreen` (Talk Board) AND `SentencePictureScreen` (Picture Talk).
  - `modules/aiImage.ts` — AI image generation + Whisper transcription, used by `AddByVoiceScreen`/`CategoryBuilderScreen` (Talk Board) AND `SentencePictureScreen` (Picture Talk, more heavily).
  - `modules/imageLibrary.ts` — local image cache, used by both products.
  - `modules/passcode.ts` + `components/PinGate.tsx` — the parent PIN gate protects screens in both products.
  - `modules/faceEngine.ts`, `FaceScanScreen.tsx`, `EnrollChildScreen.tsx` — child login/enrollment, needed before either product can identify which child is using the device.
  - `types.ts` (`ChildProfile`, `AppSettings`, `LanguageCode`), `modules/i18n.ts`, `theme.ts`, `context/SettingsContext.tsx`, `components/Mascot.tsx`, `SoftBackdrop.tsx`, `BigButton.tsx`, `Card.tsx`, `LangBadge.tsx`, `TabBar.tsx` — cross-app UI/data primitives.
- **Not part of Talk Board at all** (belong to neither product per the client's 2-app split, and are out of scope here): Games, Daily Lesson, Skill Path, Voice Practice (the Learning Engine), Visual Schedule, Rewards, Doctor Panel, Parent Hub/Dashboard, Admin Panel, Calm Down, Accessibility settings screen. These currently live in the same `App.tsx` router and would need their own decision (a 3rd app? shared shell? retired?) — not addressed by this document.
- **`SentencePictureScreen.tsx` is NOT part of Talk Board** — it is a substantial, separate speech-to-picture feature that belongs conceptually to **Picture Talk**; see that app's documentation, §13, for why it may actually be the better home for Idea 2's "speak a sentence, see a picture" brief than `TellMeScreen`.

## 14. How to Run This App

Talk Board does not yet exist as its own installable app — it currently runs as part of the combined KiddoCare Expo project. Until the split is performed:

```bash
cd frontend
npm install
npm run web      # or: npm run android / npm run ios
```

Then navigate: Landing → Face Scan → (select/enroll a child) → Home → tap "Communicate" (routes to `AACBoardScreen`).
