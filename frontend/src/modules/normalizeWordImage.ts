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

/** Restore edge contrast after enlarging a small raster picture. */
function sharpenRaster(ctx: CanvasRenderingContext2D, width: number, height: number, radius: number) {
  const image = ctx.getImageData(0, 0, width, height);
  const original = image.data.slice();
  const horizontal = radius * 4;
  const vertical = width * horizontal;
  const isRed = (index: number) => {
    const red = original[index], green = original[index + 1], blue = original[index + 2];
    const dominance = red - Math.max(green, blue);
    return red >= 105 && dominance > 24 && Math.abs(green - blue) <= dominance * 0.7;
  };
  const luminance = (index: number) => original[index] * 0.2126 + original[index + 1] * 0.7152 + original[index + 2] * 0.0722;

  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const index = (y * width + x) * 4;
      // Leave translucent edges alone to avoid outlining cutout pictures.
      if (original[index + 3] !== 255 ||
          original[index - horizontal + 3] !== 255 || original[index + horizontal + 3] !== 255 ||
          original[index - vertical + 3] !== 255 || original[index + vertical + 3] !== 255) continue;
      // Keep red areas and their edges soft; never sharpen them back after lightening.
      if ([index, index - horizontal, index + horizontal, index - vertical, index + vertical].some(isRed)) continue;

      const average = (luminance(index - horizontal) + luminance(index + horizontal) +
        luminance(index - vertical) + luminance(index + vertical)) / 4;
      const detail = luminance(index) - average;
      // Ignore faint JPEG noise and adjust brightness equally across channels.
      // Independent RGB sharpening changes the original colors and adds colored halos.
      if (Math.abs(detail) < 2.5) continue;
      const darkest = Math.min(original[index], original[index + 1], original[index + 2]);
      const brightest = Math.max(original[index], original[index + 1], original[index + 2]);
      const adjustment = Math.max(-darkest, Math.min(255 - brightest, Math.max(-14, Math.min(14, detail * 0.8))));
      for (let channel = index; channel < index + 3; channel++) image.data[channel] = original[channel] + adjustment;
    }
  }
  ctx.putImageData(image, 0, 0);
}

/** Whiten an even backdrop only when it covers most of the border. */
function whitenBackground(data: Uint8ClampedArray, width: number, height: number): boolean {
  if (width < 8 || height < 8) return false;
  const count = width * height;
  const corners = [0, width - 1, count - width, count - 1];
  const sample = corners.find((corner) => {
    const offset = corner * 4;
    return data[offset + 3] >= 250 && corners.filter((other) => {
      const index = other * 4;
      return data[index + 3] >= 250 && Math.max(
        Math.abs(data[index] - data[offset]),
        Math.abs(data[index + 1] - data[offset + 1]),
        Math.abs(data[index + 2] - data[offset + 2]),
      ) <= 22;
    }).length >= 3;
  });
  if (sample === undefined) return false;
  const offset = sample * 4;
  const [red, green, blue] = data.subarray(offset, offset + 3);
  if (Math.min(red, green, blue) >= 247) return false;

  const matches = (pixel: number) => {
    const index = pixel * 4;
    return data[index + 3] >= 250 && Math.max(
      Math.abs(data[index] - red), Math.abs(data[index + 1] - green), Math.abs(data[index + 2] - blue),
    ) <= 22;
  };
  const border: number[] = [];
  for (let x = 0; x < width; x++) border.push(x, count - width + x);
  for (let y = 1; y < height - 1; y++) border.push(y * width, (y + 1) * width - 1);
  const seeds = border.filter(matches);
  if (seeds.length < border.length * 0.58) return false;

  const visited = new Uint8Array(count);
  const queue = new Int32Array(count);
  let end = 0;
  const add = (pixel: number) => {
    if (visited[pixel]) return;
    visited[pixel] = 1;
    if (matches(pixel)) queue[end++] = pixel;
  };
  for (const seed of seeds) add(seed);
  for (let start = 0; start < end; start++) {
    const pixel = queue[start];
    const x = pixel % width;
    if (x > 0) add(pixel - 1);
    if (x < width - 1) add(pixel + 1);
    if (pixel >= width) add(pixel - width);
    if (pixel < count - width) add(pixel + width);
  }
  if (end > count * 0.95) return false;
  for (let index = 0; index < end; index++) {
    const pixel = queue[index] * 4;
    data[pixel] = data[pixel + 1] = data[pixel + 2] = 255;
  }
  return true;
}

/** All web word pictures share trimmed margins, regardless of their source. */
export function normalizeWordImage(uri: string, crisp = false, softenRed: boolean | "all" | "health" = false): Promise<string> {
  const cacheKey = `${Number(crisp)}${softenRed}:${uri}`;
  const existing = cache.get(cacheKey);
  if (existing) {
    cache.delete(cacheKey); cache.set(cacheKey, existing);
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
          // Snap the crop outward to whole source pixels to keep edges sharp.
          const scaleX = img.naturalWidth / scan.width;
          const scaleY = img.naturalHeight / scan.height;
          const sourceX = Math.floor(bounds.x * scaleX);
          const sourceY = Math.floor(bounds.y * scaleY);
          const sourceWidth = Math.min(img.naturalWidth, Math.ceil((bounds.x + bounds.width) * scaleX)) - sourceX;
          const sourceHeight = Math.min(img.naturalHeight, Math.ceil((bounds.y + bounds.height) * scaleY)) - sourceY;
          const longestSide = Math.max(sourceWidth, sourceHeight);
          const isVector = /^data:image\/svg\+xml[;,]|\.svg(?:[?#]|$)/i.test(uri);
          const enhance = !isVector && Math.max(img.naturalWidth, img.naturalHeight) <= 320;
          const sharpen = enhance || (crisp && !isVector && longestSide <= 500);
          const unchangedBounds = bounds.width === scan.width && bounds.height === scan.height;
          if (!softenRed && !sharpen && unchangedBounds) return finish(uri);

          // Render small originals at enough resolution for large tiles and high-DPI screens.
          const fit = sharpen ? Math.max(1, Math.min(4, 1024 / longestSide)) : Math.min(1, 2048 / longestSide);
          const output = document.createElement("canvas");
          output.width = Math.max(1, Math.round(sourceWidth * fit));
          output.height = Math.max(1, Math.round(sourceHeight * fit));
          const out = output.getContext("2d");
          if (!out) return finish(uri);
          const width = output.width, height = output.height;
          out.imageSmoothingEnabled = true;
          out.imageSmoothingQuality = "high";
          out.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
          if (softenRed) {
            const pixels = out.getImageData(0, 0, width, height);
            const data = pixels.data;
            let changed = whitenBackground(data, width, height);
            for (let index = 0; index < data.length; index += 4) {
              const red = data[index];
              const green = data[index + 1];
              const blue = data[index + 2];
              const strongest = Math.max(red, green, blue);
              const chroma = strongest - Math.min(red, green, blue);
              const dominance = red - Math.max(green, blue);
              if (!data[index + 3]) continue;
              let amount = 0;
              if (softenRed === "all") {
                amount = Math.min(0.24, Math.max(0, chroma - 55) * 0.0017) *
                  Math.min(1, Math.max(0, strongest - 115) / 65);
              } else if (softenRed === "health") {
                // Include warm coral and dark red alongside bright primary red.
                if (red >= 105 && dominance > 24 && Math.abs(green - blue) <= dominance * 0.7) {
                  amount = Math.min(0.45, (dominance - 24) * 0.007);
                }
              } else if (red >= 130 && dominance >= 34 && Math.abs(green - blue) <= dominance * 0.65) {
                amount = Math.min(0.33, (dominance - 34) * 0.0035);
              }
              if (!amount) continue;
              for (let channel = index; channel < index + 3; channel++) {
                data[channel] += (255 - data[channel]) * amount;
              }
              changed = true;
            }
            if (changed) out.putImageData(pixels, 0, 0);
            else if (!sharpen && unchangedBounds) return finish(uri);
          }
          if (sharpen) sharpenRaster(out, width, height, Math.max(1, Math.round(fit)));
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
  cache.set(cacheKey, pending);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  return pending;
}

