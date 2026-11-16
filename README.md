# Angel Talk — AAC & Sovereign Telemetry Platform

A production-grade, offline-first AAC (Augmentative and Alternative Communication) system designed for autistic, non-verbal, and speech-delayed children, compliant with Saudi Personal Data Protection Law (PDPL).

## 📁 Monorepo Structure

```
.
├── frontend/               # Expo React Native App (Offline-First AAC, On-Device Face AI, Zero-latency speech)
├── angel-talk-backend/     # Node.js 20 + TypeScript + Express + MongoDB Atlas + Redis modular backend
├── angel-talk-admin/       # Vite + React + TypeScript + Tailwind + Recharts Sovereign Admin Portal
├── docker-compose.yml      # Orchestration for MongoDB, Redis, and Backend
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Backend API (`/angel-talk-backend`)
```bash
cd angel-talk-backend
npm install
npm run seed      # Seeds default superadmin, 25+ 5-form verb conjugations, and 6 AAC starter templates
npm run dev       # Starts Express API server on http://localhost:4000
npm test          # Runs Jest integration test suite (12 tests, 100% green)
npm run lint      # ESLint verification (0 errors)
npm run typecheck # Strict TypeScript compilation (0 errors)
```

### 2. Admin Portal (`/angel-talk-admin`)
```bash
cd angel-talk-admin
npm install
npm run dev       # Starts Vite dev server on http://localhost:5173
npm run build     # Compiles production bundle in dist/ (0 errors)
```
- Default Superadmin: `admin@angeltalk.sa`
- Default Password: `ChangeMe123!SafeAdmin`

### 3. Mobile / Web AAC Client (`/frontend`)
```bash
cd frontend
npm install
npm run web       # Starts Expo web on http://localhost:8081
npm run typecheck # Strict TypeScript compilation (0 errors)
```

---

## 🔒 Security & Architecture Decisions

1. **Child Voice Sovereign Offline-First Principle**:
   - The child's vocalization NEVER depends on internet connectivity or servers.
   - All taps, custom cards, verb conjugations, and audio synthesis play immediately on-device.
   - Cloud sync runs asynchronously in the background via delta push/pull cursors.

2. **Multi-Child Strict Data Isolation & IDOR Guards**:
   - Every child-scoped document contains `ownerId` and `childId`.
   - Access attempts by unauthorized accounts return `404 Not Found` (never `403`), completely eliminating IDOR enumeration.
   - Administrative roles are cryptographically blocked from viewing clinical therapy logs.

3. **Resilient TTS Architecture**:
   - High-definition Google Cloud Neural Wavenet voices (`ar-XA`, `ur-PK`, `en-US`) when configured.
   - Seamless, zero-timeout sovereign fallback to Google Translate TTS with browser headers when keys are absent.
   - In-memory LRU + Redis caching for sub-millisecond audio delivery.

## Device-local personal content

New installations load the complete board bundled with the app. Personal word/folder additions, edits, deletions, custom pictures, settings and activity remain on the device. Web boards and deletion markers use IndexedDB, with compatibility for existing local storage; native boards use AsyncStorage. Bundled pictures are stored as compact references while custom pictures are retained locally.

Background sync registers the installation and uploads only basic child/profile directory fields (`name`, `age`, `diagnoses`, and an existing public profile photo URL). Personal boards, word usage, sentences and care notes are not uploaded or downloaded through account sync. Shared admin catalog updates may still reach devices and respect local word deletions. Legacy personal-content upload endpoints return `410 LOCAL_ONLY_CONTENT`; private sync tables are rejected. Existing server records are not deleted by this change.

Clearing local app data removes its local copy. The encrypted recovery-backup feature below can restore customizations using the saved recovery code; ordinary account/profile sync does not transfer personal boards.

Validation: `node frontend/scripts/test-local-board-privacy.cjs`, `node frontend/scripts/test-board-reload.cjs`, frontend/backend typechecks, and the backend Jest suite.

## Encrypted recovery backups

Settings includes automatic backups, **Back up now**, **Save recovery code**, and **Find my backup / Restore this backup**. Automatic backup is enabled by default. Keep the recovery code outside the app: a newly installed app cannot find or decrypt an old backup without it. Manual JSON export/import remains available.

Expo Crypto AES-256-GCM encrypts the whole-app snapshot before upload: words, categories, deletions, settings, profiles, activity and embedded custom image/audio files. Bundled pictures use compact references. Original family sign-in credentials are included only inside this encrypted snapshot so restore reconnects the existing family. Authentication tokens, the recovery key and parent PIN are excluded. The server receives ciphertext and scheduling metadata, never the recovery/encryption key. Personal word tables remain disabled.

The latest encrypted state is saved while the app is used and after edits. The backend archives the last successful upload at local midnight using the device IANA time zone, including DST, even while the mobile app is closed. Offline/closed phones cannot send unsent changes; those retry when the app resumes online. Backend restarts catch up missed daily copies. Retention is 30 daily restore points plus the latest save.

Configure `BACKUP_STORAGE_DIR` as a persistent private backend volume (default `.data/encrypted-backups`). It is outside MongoDB and must survive backend deployments/restarts. Use HTTPS and infrastructure disaster-recovery protection in production. An ephemeral hosting filesystem cannot provide durable recovery. Deploy the new backend with the updated app; native builds need the added `expo-crypto` module.

Checks: `node frontend/scripts/test-encrypted-backups.cjs`, the existing local-board tests, and the backend Jest suite.
