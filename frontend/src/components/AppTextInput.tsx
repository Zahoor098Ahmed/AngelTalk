import { forwardRef, type ElementRef } from "react";
import { StyleSheet, TextInput as NativeTextInput, type TextInputProps } from "react-native";
import { useAppTextScale } from "../context/SettingsContext";
import { scaledTextStyle } from "../modules/textSizing";

export type AppTextInput = NativeTextInput;
export const AppTextInput = forwardRef<ElementRef<typeof NativeTextInput>, TextInputProps>(function AppTextInput({ style, ...props }, ref) {
  const scale = useAppTextScale();
  const scaled = scaledTextStyle(StyleSheet.flatten(style) ?? {}, scale, false);
  return <NativeTextInput {...props} ref={ref} style={scaled ? [style, scaled] : style} />;
});
export { AppTextInput as default };
