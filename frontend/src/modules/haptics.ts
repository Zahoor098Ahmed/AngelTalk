import * as Haptics from "expo-haptics";

/**
 * Short physical confirmation for a tile / category tap. Respects a global
 * enable flag (Settings → Haptic feedback). Never throws on devices without
 * a vibrator.
 */
let enabled = true;

export function setHapticsEnabled(v: boolean) {
  enabled = v;
}

export function tapFeedback() {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function selectFeedback() {
  if (!enabled) return;
  Haptics.selectionAsync().catch(() => {});
}

export function successFeedback() {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
