import { View, StyleSheet } from "react-native";

/**
 * Warm, calm decorative background shapes — the same muted, low-saturation
 * "soft blobs in the corners" pattern already used on LandingScreen, pulled
 * out here so it can be reused consistently across child-facing screens
 * (Home, Talk board, Games, Daily Lesson) without duplicating the shape
 * list everywhere.
 *
 * Deliberately NOT bright/saturated/animated/flashing — the goal is a
 * warmer, friendlier feel without the sensory overload a typical "kids app"
 * background would add. Renders behind content (absolute, non-interactive).
 */

export interface SoftBackdropShape {
  size: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  color: string;
}

const DEFAULT_SHAPES: SoftBackdropShape[] = [
  { size: 70, top: 10, right: -20, color: "rgba(74,127,230,0.05)" },
  { size: 46, top: 90, left: -14, color: "rgba(201,138,61,0.05)" },
  { size: 38, bottom: 40, right: 24, color: "rgba(92,154,88,0.05)" },
];

export default function SoftBackdrop({ shapes = DEFAULT_SHAPES }: { shapes?: SoftBackdropShape[] }) {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {shapes.map((s, i) => (
        <View
          key={i}
          style={[
            styles.shape,
            {
              width: s.size,
              height: s.size,
              borderRadius: s.size / 2,
              top: s.top,
              bottom: s.bottom,
              left: s.left,
              right: s.right,
              backgroundColor: s.color,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  shape: { position: "absolute" },
});
