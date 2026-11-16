/** Browser zoom changes CSS viewport width, while the outer window stays at its unzoomed width. */
export function zoomedBoardColumns(columns: number, viewportWidth: number, windowWidth: number): number {
  if (!Number.isFinite(windowWidth) || windowWidth <= 0 || !Number.isFinite(viewportWidth) || viewportWidth <= 0) return columns;
  // Allow for window borders/scrollbars so 100% zoom keeps the configured column count.
  return Math.max(1, Math.floor(columns * viewportWidth / windowWidth + 0.15));
}
