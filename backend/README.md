# KiddoCare Backend (Express)

A thin API that keeps the OpenAI (and Pixabay) keys **off the device**. The
mobile app talks to this instead of calling OpenAI directly.

```
backend/
├── src/
│   ├── index.js              app entry + middleware wiring
│   ├── config.js             reads .env
│   ├── middleware/auth.js    "Authorization: Bearer <APP_TOKEN>" check
│   └── routes/
│       ├── health.js         GET  /health              (public)
│       ├── images.js         POST /images/generations  + GET /images/search
│       └── audio.js          POST /audio/transcriptions (Whisper)
├── .env.example
├── Dockerfile
└── package.json
```

## Run locally

```bash
cd backend
cp .env.example .env      # then fill in OPENAI_API_KEY and APP_TOKEN
npm install
npm run dev               # http://localhost:8787
```

Quick check:

```bash
curl http://localhost:8787/health
```

## Endpoints

| Method | Path | Body | Returns |
|---|---|---|---|
| GET  | `/health` | – | status JSON (no auth) |
| POST | `/images/generations` | `{ "prompt": "juice", "style": "word" }` | `{ data: [{ b64_json }] }` — same shape as OpenAI |
| GET  | `/images/search` | `?q=cat&source=arasaac` (or `pixabay`) | `{ hits: [{ id, thumb, full, source }] }` |
| POST | `/audio/transcriptions` | multipart: `file` (audio), optional `language` | `{ text: "juice" }` |

All except `/health` require `Authorization: Bearer <APP_TOKEN>` when `APP_TOKEN` is set.

## Connect the app to it — via `.env`

Nothing in the app code needs editing. Set two values in **`frontend/.env`**
(copy from `frontend/.env.example`):

```ini
EXPO_PUBLIC_AI_PROXY_URL=http://192.168.1.20:8787   # your computer's LAN IP for a phone, or the deployed URL
EXPO_PUBLIC_AI_PROXY_TOKEN=                          # must equal APP_TOKEN in backend/.env
```

Then restart the Expo dev server (or rebuild the APK). With the proxy URL set the app routes:

| App feature | Endpoint it calls |
|---|---|
| Picture search (ARASAAC / Pixabay) | `GET  <url>/images/search` |
| Add-by-Voice "AI made" · Picture Talk AI | `POST <url>/images/generations` |
| Picture Talk free AI fallback | `GET  <url>/scene/:prompt` |
| Voice-to-text (record → transcribe) | `POST <url>/audio/transcriptions` |

…and sends no OpenAI/Pixabay key of its own — they stay in `backend/.env`.

Leave `EXPO_PUBLIC_AI_PROXY_URL` blank and the app runs fully offline (instant
SVG scenes, symbol search, device TTS) or with a direct in-app OpenAI key.

### Quick local test (phone on same Wi-Fi)

```bash
# terminal 1
cd backend && cp .env.example .env && npm install && npm run dev

# find your LAN IP:  ipconfig | findstr IPv4   (Windows)
# put http://<that-ip>:8787 in frontend/.env as EXPO_PUBLIC_AI_PROXY_URL

# terminal 2
cd frontend && npm start
```

## Deploy

Any Node host works — Render, Railway, Fly.io, a VPS, or Docker:

```bash
docker build -t kiddocare-backend .
docker run -p 8787:8787 --env-file .env kiddocare-backend
```

Set a **hard spending limit** on the OpenAI key in the OpenAI dashboard.

## Not built yet (planned)

- `/backup/:deviceId` GET/PUT for cloud backup & restore of the board
- Rate limiting per device
- Usage logging / cost dashboard
