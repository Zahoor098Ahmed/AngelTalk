import { Router } from "express";

export const sceneRouter = Router();

const SCENE_STYLE =
  "flat matte children's book illustration, single clear centred subject, plain white background, " +
  "soft calm colours, bold simple outlines, no text, no watermark, consistent educational style";

const UPSTREAM = process.env.SCENE_UPSTREAM || "https://image.pollinations.ai/prompt";

/**
 * GET /scene/:prompt?width=&height=&seed=&model=
 * Streams back a generated image. Fronts a free image engine (Pollinations by
 * default) so the app has one stable endpoint and the server can add caching
 * or rate-limiting later without an app update.
 */
sceneRouter.get("/scene/:prompt", async (req, res) => {
  const prompt = String(req.params.prompt || "").trim();
  if (!prompt) return res.status(400).json({ error: "prompt is required" });

  const width = Math.min(1024, Number(req.query.width) || 768);
  const height = Math.min(1024, Number(req.query.height) || 768);
  const seed = Number(req.query.seed) || 0;
  const model = String(req.query.model || "flux");

  const url =
    `${UPSTREAM}/${encodeURIComponent(`${decodeURIComponent(prompt)}. ${SCENE_STYLE}`)}` +
    `?width=${width}&height=${height}&seed=${seed}&nologo=true&model=${encodeURIComponent(model)}`;

  try {
    const upstream = await fetch(url);
    if (!upstream.ok || !upstream.body) return res.status(502).json({ error: "Image engine unavailable" });
    res.set("Content-Type", upstream.headers.get("content-type") || "image/jpeg");
    res.set("Cache-Control", "public, max-age=604800");
    const buf = Buffer.from(await upstream.arrayBuffer());
    return res.send(buf);
  } catch (err) {
    console.error("[scene] failed:", err.message);
    return res.status(502).json({ error: "Could not reach the image engine" });
  }
});
