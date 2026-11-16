import { imageContentBounds } from "./imageContentBounds";

const CACHE_LIMIT = 256;
const cache = new Map<string, Promise<string>>();
const queue: Array<() => void> = [];
let active = 0;
function pump() {
  while (active < 4 && queue.length) {
    active++;
    queue.shift()!();
  }
}

/** All web word pictures share trimmed margins, regardless of their source. */
export function normalizeWordImage(uri: string): Promise<string> {
  const existing = cache.get(uri);
  if (existing) {
    cache.delete(uri); cache.set(uri, existing);
    return existing;
  }
  const pending = new Promise<string>((resolve) => {
    queue.push(() => {
      const img = new window.Image();
      let settled = false;
      const finish = (result: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        img.onload = null; img.onerror = null;
        active--; resolve(result); pump();
      };
      const timer = setTimeout(() => finish(uri), 12000);
      // Public symbol CDNs allow CORS. If a custom host does not, retain the original image.
      if (/^https?:/i.test(uri)) img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const scale = Math.min(1, 512 / Math.max(img.naturalWidth, img.naturalHeight));
          const scan = document.createElement("canvas");
          scan.width = Math.max(1, Math.round(img.naturalWidth * scale));
          scan.height = Math.max(1, Math.round(img.naturalHeight * scale));
          const ctx = scan.getContext("2d", { willReadFrequently: true });
          if (!ctx) return finish(uri);
          ctx.drawImage(img, 0, 0, scan.width, scan.height);
          const bounds = imageContentBounds(ctx.getImageData(0, 0, scan.width, scan.height).data, scan.width, scan.height);
          const output = document.createElement("canvas");
          const fit = 256 / Math.max(bounds.width, bounds.height);
          output.width = Math.max(1, Math.round(bounds.width * fit));
          output.height = Math.max(1, Math.round(bounds.height * fit));
          const out = output.getContext("2d");
          if (!out) return finish(uri);
          const width = output.width, height = output.height;
          out.imageSmoothingEnabled = true;
          out.imageSmoothingQuality = "high";
          out.drawImage(img,
            bounds.x * img.naturalWidth / scan.width, bounds.y * img.naturalHeight / scan.height,
            bounds.width * img.naturalWidth / scan.width, bounds.height * img.naturalHeight / scan.height,
            0, 0, width, height);
          finish(output.toDataURL("image/png"));
        } catch {
          finish(uri);
        }
      };
      img.onerror = () => finish(uri);
      img.src = uri;
    });
    pump();
  });
  cache.set(uri, pending);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  return pending;
}

