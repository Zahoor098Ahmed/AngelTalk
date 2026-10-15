import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { z } from "zod";
import { authenticate, AuthenticatedRequest, assertChildAccess } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { S3Service } from "./s3.service";
import { TTSService } from "./tts.adapter";
import { ttsRateLimiter } from "../../middleware/rate-limiter";
import { env } from "../../config/env";
import { sendSuccess } from "../../common/response";
import { BadRequestError, AppError } from "../../common/errors";

export const mediaRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

const uploadUrlSchema = z.object({
  childId: z.string().min(1, "childId is required"),
  contentType: z.string().min(1, "contentType is required"),
  fileSize: z.number().optional(),
});

// 1. Presigned Upload URL for photos and recorded voice notes
mediaRouter.post(
  "/media/upload-url",
  authenticate,
  validate({ body: uploadUrlSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      await assertChildAccess(user, req.body.childId, "edit_board");

      const result = await S3Service.generatePresignedUploadUrl(
        req.body.childId,
        req.body.contentType,
        req.body.fileSize
      );

      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// 2. High-speed TTS Audio Proxy
mediaRouter.get(
  ["/audio/tts", "/tts"],
  ttsRateLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const text = String(req.query.text || req.query.q || "").trim();
      if (!text) {
        throw new BadRequestError("Missing 'text' or 'q' query parameter");
      }

      const lang = String(req.query.lang || req.query.tl || "ar-SA");
      const voice = String(req.query.voice || "boy");
      const rate = Number(req.query.rate) || 0.9;

      const audioBuffer = await TTSService.getSpeechAudio(text, lang, voice, rate);

      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      res.send(audioBuffer);
    } catch (err) {
      next(err);
    }
  }
);

// 3. OpenAI Whisper Audio Transcription Proxy (Feature flagged)
mediaRouter.post(
  "/audio/whisper",
  authenticate,
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!env.ENABLE_WHISPER) {
        throw new AppError("Whisper voice transcription is disabled by server configuration.", 503, "FEATURE_DISABLED");
      }

      if (!env.OPENAI_API_KEY) {
        throw new AppError("OPENAI_API_KEY is not configured on the server.", 503, "API_KEY_MISSING");
      }

      if (!req.file) {
        throw new BadRequestError("Audio file is required (field name: 'file')");
      }

      const form = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype || "audio/m4a" });
      form.append("file", blob, req.file.originalname || "speech.m4a");
      form.append("model", "whisper-1");
      if (req.body?.language) {
        form.append("language", req.body.language);
      }
      form.append(
        "prompt",
        req.body?.prompt || "Category, sub category, words for autism AAC communication card."
      );

      const upstream = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
        body: form,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json = (await upstream.json().catch(() => ({}))) as any;
      if (!upstream.ok) {
        throw new AppError(json?.error?.message || `Whisper API failed with ${upstream.status}`, 502);
      }

      sendSuccess(res, { text: String(json.text || "").trim() });
    } catch (err) {
      next(err);
    }
  }
);

// 4. ARASAAC Clinical Pictogram Search Proxy
mediaRouter.get(
  "/images/search",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = String(req.query.q || "").trim();
      if (!q) {
        sendSuccess(res, { hits: [] });
        return;
      }

      const upstream = await fetch(`https://api.arasaac.org/api/pictograms/en/search/${encodeURIComponent(q)}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = (await upstream.json().catch(() => [])) as any[];

      const hits = (Array.isArray(items) ? items : []).slice(0, 24).map((p: { _id: number | string }) => ({
        id: `ara_${p._id}`,
        thumb: `https://static.arasaac.org/pictograms/${p._id}/${p._id}_300.png`,
        full: `https://static.arasaac.org/pictograms/${p._id}/${p._id}_500.png`,
        source: "arasaac",
        name: q,
        license: "CC BY-NC-SA",
      }));

      sendSuccess(res, { hits });
    } catch (err) {
      next(err);
    }
  }
);

// 5. OpenAI DALL-E Image Generation Proxy (Feature flagged)
mediaRouter.post(
  "/images/generate",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!env.ENABLE_IMAGE_GEN) {
        throw new AppError("AI image generation is disabled by server configuration.", 503, "FEATURE_DISABLED");
      }

      if (!env.OPENAI_API_KEY) {
        throw new AppError("OPENAI_API_KEY is not configured on the server.", 503, "API_KEY_MISSING");
      }

      const prompt = String(req.body?.prompt || "").trim();
      if (!prompt) {
        throw new BadRequestError("Prompt is required");
      }

      const sensoryPrompt = `Flat matte children's book illustration of "${prompt}" for a communication card. Plain white background, gentle outlines, calm colors, no text, suitable for autism AAC.`;

      const upstream = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: sensoryPrompt,
          size: "1024x1024",
          n: 1,
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json = (await upstream.json().catch(() => ({}))) as any;
      if (!upstream.ok) {
        throw new AppError(json?.error?.message || `Image generation failed with status ${upstream.status}`, 502);
      }

      sendSuccess(res, { data: json.data || [] });
    } catch (err) {
      next(err);
    }
  }
);

// 6. Scene Generator (Pollinations upstream)
mediaRouter.get(
  "/scene/:prompt",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const prompt = String(req.params.prompt || "").trim();
      if (!prompt) {
        throw new BadRequestError("Prompt is required");
      }

      const width = Math.min(1024, Number(req.query.width) || 768);
      const height = Math.min(1024, Number(req.query.height) || 768);
      const seed = Number(req.query.seed) || 0;

      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

      const upstream = await fetch(url);
      if (!upstream.ok || !upstream.body) {
        throw new AppError("Scene image engine unavailable", 502);
      }

      res.setHeader("Content-Type", upstream.headers.get("content-type") || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=604800");
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.send(buf);
    } catch (err) {
      next(err);
    }
  }
);

