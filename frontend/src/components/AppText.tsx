import { createContext, forwardRef, useContext, type ElementRef } from "react";
import { StyleSheet, Text as NativeText, type TextProps } from "react-native";
import { useAppTextScale } from "../context/SettingsContext";
import { scaledTextStyle } from "../modules/textSizing";

const InsideText = createContext(false);
export type AppText = NativeText;

/** The same native Text API, with the saved app text-size preference applied once. */
export const AppText = forwardRef<ElementRef<typeof NativeText>, TextProps>(function AppText({ style, children, ...props }, ref) {
  const scale = useAppTextScale();
  const nested = useContext(InsideText);
  const scaled = scaledTextStyle(StyleSheet.flatten(style) ?? {}, scale, nested);
  return (
    <NativeText {...props} ref={ref} style={scaled ? [style, scaled] : style}>
      <InsideText.Provider value={true}>{children}</InsideText.Provider>
    </NativeText>
  );
});
export { AppText as default };
