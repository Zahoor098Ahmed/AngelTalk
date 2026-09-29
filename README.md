# Angel Talk — AAC & Visual Communication Companion

A modern, gentle, family-first AAC (Augmentative and Alternative Communication) app built for children with autism, apraxia, and speech delays.

## 🌟 Tala vs Angel Talk: Full Feature Parity

Angel Talk combines the simplicity and personalization of **Tala** with the clinical depth of an advanced AAC platform:

1. **⚡ Whole Phrases / Tap-to-Talk Mode (Gestalt Language Processing - GLP):**
   - One-tap speaking for full functional sentences (e.g., *"I want pizza, please"*, *"Can I play iPad?"*).
   - Instant header toggle to switch between **Whole Phrases** and **Sentence Builder Strip** mode.
2. **⭐️ 90-Second Personalized Board Builder:**
   - Auto-builds a tailored communication shelf (**"⭐️ [Child's Name]'s World"**) based on their real favorite foods, family members, and favorite toys/activities.
3. **📖 Visual Social Stories Library & Interactive Reader:**
   - 8+ built-in step-by-step illustrated social stories (Dentist, Haircut, First Day of School, Calming Down, Sharing, Doctor Visit, Supermarket, Bedtime).
   - Page-by-page read-aloud with speech highlights and custom story creation for parents.
4. **🗣️ Natural Child Voice Picker:**
   - Support for 👦 Boy, 👧 Girl, 👩 Woman, and 👨 Man voice profiles with pitch/rate tuning and instant test preview.
5. **🌐 Bilingual Dual-Language Display:**
   - Simultaneous English + Arabic (or Urdu) subtitles directly on communication tiles.
6. **🧸 Family-First Simple Mode:**
   - Streamlined, high-contrast, uncluttered interface designed for families, with clinical IEP and review tools safely tucked behind the parent PIN gate.
7. **🔒 100% Offline & Private:**
   - Runs completely on-device without forced subscriptions or accounts.

---

## Run the Frontend

```bash
cd frontend
npm install
npm run web
```

Runs on `http://localhost:8098` (or custom port).

## Run the Backend (Optional)

The app runs fully offline without this — only needed for Whisper speech-to-text, DALL-E AI image generation, and Pixabay web image search.

```bash
cd backend
npm install
npm start          # listens on http://localhost:8787
```
