import { Router } from "express";
import multer from "multer";
import { config } from "../config.js";

export const audioRouter = Router();

// keep the uploaded clip in memory — voice words are short (a few seconds)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

/**
 * POST /audio/transcriptions   (multipart/form-data)
 * fields: file (audio), model? (default whisper-1), language?, prompt?
 * → { text }
 */
audioRouter.post("/audio/transcriptions", upload.single("file"), async (req, res) => {
  if (!config.openaiKey) return res.status(503).json({ error: "Speech-to-text is not configured on the server." });
  if (!req.file) return res.status(400).json({ error: "An audio file is required (field name: file)." });

  try {
    const form = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype || "audio/m4a" });
    form.append("file", blob, req.file.originalname || "speech.m4a");
    form.append("model", req.body?.model || "whisper-1");
    if (req.body?.language) form.append("language", req.body.language);
    form.append(
      "prompt",
      req.body?.prompt || "A single short everyday word for a picture card, e.g. juice, apple, happy.",
    );

    const upstream = await fetch(`${config.openaiBase}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.openaiKey}` },
      body: form,
    });

    const json = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: json?.error?.message || `OpenAI error ${upstream.status}` });
    }
    const text = String(json.text || "").trim().replace(/[.。!?]+$/, "");
    return res.json({ text });
  } catch (err) {
    console.error("[audio] transcription failed:", err.message);
    return res.status(502).json({ error: "Could not reach the speech service." });
  }
});
