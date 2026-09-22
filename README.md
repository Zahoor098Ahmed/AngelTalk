# BloomSpeech

AAC Talk Board — a child taps a picture, the app speaks it aloud. Fully standalone: no dependency on BloomLearn at runtime, no shared code, no shared backend.

See `DOCUMENTATION.md` in this folder for the full technical writeup (screens, components, data models, storage keys, design tokens).

## Run the frontend

```bash
cd frontend
npm install
npm run web       # or: npm run android / npm run ios
```

Opens at `http://localhost:8098` (or whatever port you pass to `expo start --web --port <n>`).

## Run the backend (optional)

The app runs fully offline without this — it's only needed for AI image generation, Whisper speech-to-text, and Pixabay web image search (used by "Add by Voice").

```bash
cd backend
npm install
npm start          # listens on http://localhost:8787
```

Fill in `backend/.env` (copy from `.env.example`) with your own `OPENAI_API_KEY` / `PIXABAY_KEY` before starting it for real use.

To have the frontend actually call this backend instead of running fully offline, set before `npm run web`:

```bash
EXPO_PUBLIC_AI_PROXY_URL=http://localhost:8787
```

## Independence

This app has its own `frontend/package.json` and `backend/package.json`, its own Expo bundle id (`com.timeglobaltech.bloomspeech`), and its own backend port (`8787`). Nothing in this folder imports from or calls `../BloomLearn`.
