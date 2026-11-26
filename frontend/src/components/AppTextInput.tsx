import { forwardRef, type ElementRef } from "react";
import { StyleSheet, TextInput as NativeTextInput, type TextInputProps } from "react-native";
import { useAppTextScale } from "../context/SettingsContext";
import { scaledTextStyle } from "../modules/textSizing";

export type AppTextInput = NativeTextInput;
// Fixed colours, so a phone in dark mode cannot turn typed text and hints white on a light box.
// A screen's own color / placeholderTextColor still wins.
const DEFAULT_TEXT_COLOR = "#2b2a26";
const DEFAULT_PLACEHOLDER_COLOR = "#8a8475";

export const AppTextInput = forwardRef<ElementRef<typeof NativeTextInput>, TextInputProps>(function AppTextInput({ style, placeholderTextColor, ...props }, ref) {
  const scale = useAppTextScale();
  const scaled = scaledTextStyle(StyleSheet.flatten(style) ?? {}, scale, false);
  return (
    <NativeTextInput
      {...props}
      ref={ref}
      placeholderTextColor={placeholderTextColor ?? DEFAULT_PLACEHOLDER_COLOR}
      style={[{ color: DEFAULT_TEXT_COLOR }, style, scaled]}
    />
  );
});
export { AppTextInput as default };
