import { useEffect, useState } from "react";
import { Image, Platform, StyleSheet, View, type ImageProps } from "react-native";
import { SvgUri } from "react-native-svg";
import { normalizeWordImage } from "../modules/normalizeWordImage";

/** Shared, shadow-free picture frame for word images throughout the app. */
export default function SmartImage({ source, style, resizeMode = "contain", crisp = false, softenRed = false, ...rest }: ImageProps & { crisp?: boolean; softenRed?: boolean | "all" | "health" }) {
  const uri = (source as { uri?: string } | undefined)?.uri;
  const [normalized, setNormalized] = useState<{ original: string; uri: string; crisp: boolean; softenRed: boolean | "all" | "health" }>();
  useEffect(() => {
    if (Platform.OS !== "web" || !uri) return;
    let current = true;
    normalizeWordImage(uri, crisp, softenRed).then((next) => {
      if (current) setNormalized({ original: uri, uri: next, crisp, softenRed });
    });
    return () => { current = false; };
  }, [uri, crisp, softenRed]);
  const finalUri = normalized?.original === uri && normalized?.crisp === crisp && normalized?.softenRed === softenRed
    ? normalized.uri
    : undefined;
  const processing = Platform.OS === "web" && !!uri && !finalUri;
  const displaySource = finalUri ? { ...(source as object), uri: finalUri } : source;
  return (
    <View style={[style as object, styles.frame]}>
      <View style={[styles.picture, softenRed && styles.whiteBackdrop]}>
        {processing ? null : uri && Platform.OS !== "web" && /\.svg(\?|$)/i.test(uri) ? (
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
  frame: { shadowOpacity: 0, shadowRadius: 0, elevation: 0, boxShadow: "none", overflow: "hidden", alignItems: "center", justifyContent: "center" },
  whiteBackdrop: { backgroundColor: "#ffffff" },
  picture: { width: "100%", height: "100%" },
});
