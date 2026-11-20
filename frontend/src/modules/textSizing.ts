import type { AppSettings } from "../types";

const SCALES = { small: 0.85, medium: 1, large: 1.15, xlarge: 1.3 } as const;
export function appTextScale(size: AppSettings["fontSize"]): number {
  const scale = SCALES[size];
  return typeof scale === "number" ? scale : 1;
}

/** Nested text without an explicit size inherits its parent's already scaled size. */
export function scaledTextStyle(style: { fontSize?: unknown; lineHeight?: unknown }, scale: number, nested: boolean): { fontSize?: number; lineHeight?: number } | undefined {
  if (scale === 1) return undefined;
  const result: { fontSize?: number; lineHeight?: number } = {};
  if (typeof style.fontSize === "number") result.fontSize = style.fontSize * scale;
  else if (!nested && style.fontSize == null) result.fontSize = 14 * scale;
  if (typeof style.lineHeight === "number") result.lineHeight = style.lineHeight * scale;
  return Object.keys(result).length ? result : undefined;
}
