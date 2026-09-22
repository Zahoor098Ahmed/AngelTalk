import type { ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import { colors, radius } from "../theme";

export default function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View
      style={[
        {
          backgroundColor: "white",
          borderRadius: radius,
          borderWidth: 2,
          borderColor: colors.border,
          padding: 20,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
