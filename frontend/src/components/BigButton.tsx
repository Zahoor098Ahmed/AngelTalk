import { isValidElement, type ReactNode } from "react";
import { Pressable, Text, StyleSheet, type ViewStyle } from "react-native";
import { colors, radius } from "../theme";

type Variant = "primary" | "mint" | "lavender" | "sky" | "ghost";

interface BigButtonProps {
  children: ReactNode;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: object;
}

const VARIANTS: Record<Variant, { bg: string; color: string; shadow: string; border?: string }> = {
  primary: { bg: colors.forest, color: "white", shadow: colors.forestDark },
  mint: { bg: colors.greenDeep, color: "white", shadow: "#3f6b3c" },
  lavender: { bg: colors.purpleDeep, color: "white", shadow: "#6a4fa3" },
  sky: { bg: colors.blueDeep, color: "white", shadow: "#4a7590" },
  ghost: { bg: colors.card, color: colors.textMid, shadow: colors.border, border: colors.border },
};

export default function BigButton({ children, onPress, variant = "primary", disabled, style, textStyle }: BigButtonProps) {
  const v = VARIANTS[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border ?? "transparent",
          borderWidth: v.border ? 2 : 0,
          shadowColor: v.shadow,
          transform: pressed ? [{ translateY: 2 }] : [{ translateY: 0 }],
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {isValidElement(children) ? children : <Text style={[styles.text, { color: v.color }, textStyle]}>{children}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 64,
    minWidth: 64,
    borderRadius: radius,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  text: {
    fontWeight: "700",
    fontSize: 18,
  },
});
