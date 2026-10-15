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
