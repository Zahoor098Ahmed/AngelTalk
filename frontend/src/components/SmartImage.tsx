import { useEffect, useState } from "react";
import { Image, Platform, StyleSheet, View, type ImageProps } from "react-native";
import { SvgUri, SvgXml } from "react-native-svg";
import { normalizeWordImage } from "../modules/normalizeWordImage";

function getInlineSvg(uri?: string): string | undefined {
  const prefix = "data:image/svg+xml,";
  if (!uri?.startsWith(prefix)) return undefined;
  try {
    return decodeURIComponent(uri.slice(prefix.length));
  } catch {
    return undefined;
  }
}

/** Shared, shadow-free picture frame for word images throughout the app. */
export default function SmartImage({ source, style, resizeMode = "contain", crisp = true, softenRed = false, transparentBackground = false, ...rest }: ImageProps & { crisp?: boolean; softenRed?: boolean | "all" | "health"; transparentBackground?: boolean }) {
  const uri = (source as { uri?: string } | undefined)?.uri;
  const inlineSvg = getInlineSvg(uri);
  // Lighten reds without washing out the other original colors.
  const colorTreatment = softenRed === "all" ? true : softenRed;
  const [normalized, setNormalized] = useState<{ original: string; uri: string; crisp: boolean; softenRed: boolean | "all" | "health"; transparentBackground: boolean }>();
  useEffect(() => {
    if (Platform.OS !== "web" || !uri || inlineSvg) return;
    let current = true;
    normalizeWordImage(uri, crisp, colorTreatment, transparentBackground).then((next) => {
      if (current) setNormalized({ original: uri, uri: next, crisp, softenRed: colorTreatment, transparentBackground });
    });
    return () => { current = false; };
  }, [uri, crisp, colorTreatment, inlineSvg, transparentBackground]);
  const finalUri = normalized?.original === uri && normalized?.crisp === crisp && normalized?.softenRed === colorTreatment && normalized?.transparentBackground === transparentBackground
    ? normalized.uri
    : undefined;
  const displaySource = finalUri ? { ...(source as object), uri: finalUri } : source;
  return (
    <View style={[style as object, styles.frame, transparentBackground && styles.transparent]}>
      <View style={[styles.picture, transparentBackground && styles.transparent]}>
        {inlineSvg ? <SvgXml xml={inlineSvg} width="100%" height="100%" /> : uri && Platform.OS !== "web" && /\.svg(\?|$)/i.test(uri) ? (
          <SvgUri uri={uri} width="100%" height="100%" onError={() => rest.onError?.({} as never)} />
        ) : (
          <Image
            resizeMethod={Platform.OS === "android" ? "scale" : undefined}
            {...rest}
            source={displaySource}
            style={StyleSheet.absoluteFill}
            resizeMode={resizeMode}
            fadeDuration={0}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  transparent: { backgroundColor: "transparent" },
  frame: { backgroundColor: "#ffffff", shadowOpacity: 0, shadowRadius: 0, elevation: 0, boxShadow: "none", overflow: "hidden", alignItems: "center", justifyContent: "center" },
  // Keep subject edges inside the frame even after the white margins are trimmed.
  picture: { width: "96%", height: "96%", backgroundColor: "#ffffff" },
});
