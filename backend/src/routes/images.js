import { Router } from "express";
import { config } from "../config.js";

export const imagesRouter = Router();

const SENSORY_STYLE_GUIDE =
  "Flat matte children's book illustration. Single clear centred subject. " +
  "Plain white background, no scene clutter. Soft calm colours, gentle outlines. " +
  "No gloss, no reflections, no 3D shine, no text. Consistent simple style suitable " +
  "for a child with autism.";

/**
 * POST /images/generations
 * body: { prompt, size?, model?, style? }  ("style":"word" tunes the prompt for a single-word card)
 * Mirrors the OpenAI images response shape: { data: [{ b64_json }] }
 */
imagesRouter.post("/images/generations", async (req, res) => {
  if (!config.openaiKey) return res.status(503).json({ error: "Image generation is not configured on the server." });

  const raw = String(req.body?.prompt || "").trim();
  if (!raw) return res.status(400).json({ error: "prompt is required." });

  const prompt =
    req.body?.style === "word"
      ? `A single clear picture of "${raw}" for a communication card. ${SENSORY_STYLE_GUIDE}`
      : `${raw}. ${SENSORY_STYLE_GUIDE}`;

  try {
    const upstream = await fetch(`${config.openaiBase}/images/generations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.openaiKey}` },
      body: JSON.stringify({
        model: req.body?.model || config.imageModel,
        prompt,
        size: req.body?.size || config.imageSize,
        n: 1,
      }),
    });

    const json = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: json?.error?.message || `OpenAI error ${upstream.status}` });
    }
    return res.json({ data: json.data ?? [] });
  } catch (err) {
    console.error("[images] generation failed:", err.message);
    return res.status(502).json({ error: "Could not reach the image service." });
  }
});

/**
 * GET /images/search?q=cat&source=arasaac|opensymbols|mulberry|pixabay&onlyCommercial=false
 * → { hits: [{ id, thumb, full, source, name?, license?, repo? }] }
 */
imagesRouter.get("/images/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  const source = String(req.query.source || "arasaac").toLowerCase();
  const onlyCommercial = req.query.onlyCommercial === "true";
  if (!q) return res.json({ hits: [] });

  try {
    if (source === "pixabay") {
      if (!config.pixabayKey) return res.status(503).json({ hits: [], error: "Pixabay is not configured on the server." });
      const url = `https://pixabay.com/api/?key=${config.pixabayKey}&q=${encodeURIComponent(q)}&image_type=photo&safesearch=true&per_page=24`;
      const r = await fetch(url);
      const j = await r.json().catch(() => ({}));
      const hits = (j.hits || []).map((h) => ({
        id: `pix_${h.id}`,
        thumb: h.previewURL,
        full: h.webformatURL,
        source: "pixabay",
      }));
      return res.json({ hits });
    }

    if (source === "opensymbols" || source === "mulberry") {
      const url = `https://www.opensymbols.org/api/v1/symbols/search?q=${encodeURIComponent(q)}`;
      const r = await fetch(url);
      const j = await r.json().catch(() => []);
      let items = Array.isArray(j) ? j : [];

      if (source === "mulberry") {
        items = items.filter((it) => (it.repo_key || "").toLowerCase().includes("mulberry"));
      }

      if (onlyCommercial) {
        // filter out Non-Commercial (NC) licenses: keep CC0, CC BY, CC BY-SA, Public Domain
        items = items.filter((it) => {
          const lic = (it.license || "").toUpperCase();
          return !lic.includes("-NC") && !lic.includes("NC");
        });
      }

      const hits = items.slice(0, 30).map((s) => ({
        id: `os_${s.id}`,
        thumb: s.image_url,
        full: s.image_url,
        source: s.repo_key === "mulberry" ? "mulberry" : "opensymbols",
        name: s.name,
        license: s.license,
        repo: s.repo_key,
      }));
      return res.json({ hits });
    }

    // Default ARASAAC
    const r = await fetch(`https://api.arasaac.org/api/pictograms/en/search/${encodeURIComponent(q)}`);
    const j = await r.json().catch(() => []);
    const hits = (Array.isArray(j) ? j : []).slice(0, 24).map((p) => ({
      id: `ara_${p._id}`,
      thumb: `https://static.arasaac.org/pictograms/${p._id}/${p._id}_300.png`,
      full: `https://static.arasaac.org/pictograms/${p._id}/${p._id}_500.png`,
      source: "arasaac",
      name: q,
      license: "CC BY-NC-SA",
      repo: "arasaac",
    }));
    return res.json({ hits });
  } catch (err) {
    console.error("[images] search failed:", err.message);
    return res.status(502).json({ hits: [], error: "Could not reach the image service." });
  }
});
