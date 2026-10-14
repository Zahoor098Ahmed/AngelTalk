const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Bundle the on-device face AI: model weights (.bin) and the face-api script kept as text (.txt)
config.resolver.assetExts.push("bin", "txt");

const fs = require("fs");
const path = require("path");

const ttsCacheDir = path.join(__dirname, ".cache", "tts");
try {
  if (!fs.existsSync(ttsCacheDir)) fs.mkdirSync(ttsCacheDir, { recursive: true });
} catch {}

const ttsRamCache = new Map();

function getCacheFilename(text, lang) {
  const safe = Buffer.from(`${lang}:${text}`).toString("base64url");
  return path.join(ttsCacheDir, `${safe}.mp3`);
}

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url && req.url.startsWith("/api/tts")) {
        try {
          const u = new URL(req.url, "http://localhost:8081");
          const text = (u.searchParams.get("q") || "").trim();
          const lang = (u.searchParams.get("tl") || "ar").trim();
          if (!text) {
            res.statusCode = 400;
            return res.end("Missing text parameter");
          }

          const cacheKey = `${lang}:${text}`;
          if (ttsRamCache.has(cacheKey)) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "audio/mpeg");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Cache-Control", "public, max-age=31536000");
            return res.end(ttsRamCache.get(cacheKey));
          }

          const diskFile = getCacheFilename(text, lang);
          if (fs.existsSync(diskFile)) {
            try {
              const buf = fs.readFileSync(diskFile);
              if (buf.length > 500) {
                ttsRamCache.set(cacheKey, buf);
                res.statusCode = 200;
                res.setHeader("Content-Type", "audio/mpeg");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.setHeader("Cache-Control", "public, max-age=31536000");
                return res.end(buf);
              }
            } catch {}
          }

          const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=gtx`;
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);

          fetch(targetUrl, { signal: controller.signal })
            .then((upstream) => {
              clearTimeout(timer);
              if (!upstream.ok) throw new Error(`HTTP ${upstream.status}`);
              return upstream.arrayBuffer();
            })
            .then((arrayBuf) => {
              const buf = Buffer.from(arrayBuf);
              if (buf.length > 500) {
                ttsRamCache.set(cacheKey, buf);
                try {
                  fs.writeFileSync(diskFile, buf);
                } catch {}
              }
              res.statusCode = 200;
              res.setHeader("Content-Type", "audio/mpeg");
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.setHeader("Cache-Control", "public, max-age=31536000");
              res.end(buf);
            })
            .catch((err) => {
              clearTimeout(timer);
              console.error("[metro-tts-proxy] error:", err.message);
              res.statusCode = 502;
              res.end("TTS fetch failed");
            });
          return;
        } catch (e) {
          res.statusCode = 500;
          return res.end(e.message);
        }
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
