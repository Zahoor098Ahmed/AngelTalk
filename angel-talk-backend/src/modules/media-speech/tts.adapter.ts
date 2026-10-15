import crypto from "crypto";
import { LRUCache } from "lru-cache";
import Redis from "ioredis";
import { env } from "../../config/env";
import { logger } from "../../common/logger";

export interface TTSAdapter {
  synthesize(text: string, lang: string, voice: string, rate: number): Promise<Buffer>;
}

// In-memory LRU cache for audio buffers (stores up to 500 clips, 24 hours TTL)
const ttsMemoryCache = new LRUCache<string, Buffer>({
  max: 500,
  ttl: 24 * 60 * 60 * 1000,
});

let redisClient: Redis | null = null;
if (env.REDIS_URL) {
  try {
    redisClient = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2, lazyConnect: true });
    redisClient.connect().catch(() => {
      redisClient = null;
    });
  } catch {
    redisClient = null;
  }
}

export function computeTTSCacheKey(text: string, lang: string, voice: string, rate: number): string {
  const raw = `${text.trim()}|${lang}|${voice}|${rate}`;
  return crypto.createHash("md5").update(raw).digest("hex");
}

export class GoogleTTSAdapter implements TTSAdapter {
  public async synthesize(text: string, lang: string, _voice: string, _rate: number): Promise<Buffer> {
    if (env.GOOGLE_TTS_API_KEY) {
      try {
        const voiceGender = _voice === "girl" || _voice === "woman" ? "FEMALE" : "MALE";
        const voiceName = lang.startsWith("ar") ? "ar-XA-Wavenet-B" : lang.startsWith("ur") ? "ur-PK-Wavenet-A" : "en-US-Neural2-D";

        const response = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${env.GOOGLE_TTS_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              input: { text },
              voice: {
                languageCode: lang,
                name: voiceName,
                ssmlGender: voiceGender,
              },
              audioConfig: {
                audioEncoding: "MP3",
                speakingRate: _rate || 0.9,
              },
            }),
          }
        );

        if (response.ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = (await response.json()) as any;
          if (data.audioContent) {
            return Buffer.from(data.audioContent, "base64");
          }
        }
        logger.warn({ status: response.status }, "Google Cloud Neural TTS failed, falling back to sovereign TTS endpoint");
      } catch (err) {
        logger.warn({ err }, "Google Cloud Neural TTS request error, falling back to sovereign TTS endpoint");
      }
    }

    // Sovereign / Fallback TTS engine (Public Google Translate TTS with proper headers)
    const targetLang = lang.split("-")[0] || "ar";
    const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${targetLang}&client=gtx`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const resp = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Referer": "https://translate.google.com/",
          "Accept": "*/*",
        },
      });

      if (!resp.ok) {
        throw new Error(`TTS provider returned HTTP ${resp.status}`);
      }

      const arrayBuf = await resp.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      if (buffer.length < 100) {
        throw new Error("TTS response buffer too small");
      }
      return buffer;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class TTSService {
  private static adapter: TTSAdapter = new GoogleTTSAdapter();

  public static async getSpeechAudio(
    text: string,
    lang = "ar-SA",
    voice = "boy",
    rate = 0.9
  ): Promise<Buffer> {
    const cacheKey = computeTTSCacheKey(text, lang, voice, rate);

    // 1. Check in-memory LRU cache
    const memCached = ttsMemoryCache.get(cacheKey);
    if (memCached) {
      return memCached;
    }

    // 2. Check Redis cache if configured
    if (redisClient) {
      try {
        const redisBase64 = await redisClient.get(`tts:${cacheKey}`);
        if (redisBase64) {
          const buf = Buffer.from(redisBase64, "base64");
          ttsMemoryCache.set(cacheKey, buf);
          return buf;
        }
      } catch (err) {
        logger.warn({ err }, "Redis TTS cache read failed");
      }
    }

    // 3. Synthesize via adapter
    const audioBuffer = await this.adapter.synthesize(text, lang, voice, rate);

    // Store in caches
    ttsMemoryCache.set(cacheKey, audioBuffer);
    if (redisClient) {
      try {
        await redisClient.set(`tts:${cacheKey}`, audioBuffer.toString("base64"), "EX", 7 * 24 * 3600);
      } catch {
        // ignore
      }
    }

    return audioBuffer;
  }
}

