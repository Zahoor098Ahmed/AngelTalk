/** Ignore only empty white/transparent margins, keeping every visible part of a picture. */
export function imageContentBounds(pixels: ArrayLike<number>, width: number, height: number) {
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const alpha = pixels[i + 3] / 255;
      // Compare against white after alpha compositing, so transparent RGB noise is ignored.
      const darkness = alpha * (255 - Math.min(pixels[i], pixels[i + 1], pixels[i + 2]));
      if (darkness < 10) continue;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
  }
  if (right < left || bottom < top) return { x: 0, y: 0, width, height };
  // One pixel of breathing room preserves antialiased edges.
  left = Math.max(0, left - 1); top = Math.max(0, top - 1);
  right = Math.min(width - 1, right + 1); bottom = Math.min(height - 1, bottom + 1);
  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}
