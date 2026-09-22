import type { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "../theme";

interface BracketFrameProps {
  size?: number;
  children: ReactNode;
}

const BRACKET = 26;

export default function BracketFrame({ size = 220, children }: BracketFrameProps) {
  return (
    <View style={{ width: size + 40, height: size + 40, alignItems: "center", justifyContent: "center" }}>
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>{children}</View>
      <View style={[styles.bracket, styles.topLeft]} />
      <View style={[styles.bracket, styles.topRight]} />
      <View style={[styles.bracket, styles.bottomLeft]} />
      <View style={[styles.bracket, styles.bottomRight]} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { backgroundColor: colors.cardMuted, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  bracket: { position: "absolute", width: BRACKET, height: BRACKET, borderColor: colors.forest },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 },
});
