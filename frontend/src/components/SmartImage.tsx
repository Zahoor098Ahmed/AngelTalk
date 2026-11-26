import { useEffect, useMemo, useState } from "react";
import { Image, Platform, StyleSheet, View, type ImageProps } from "react-native";
import { SvgUri, SvgXml } from "react-native-svg";
import { cachedWordImage, normalizeWordImage } from "../modules/normalizeWordImage";
import { cachedSoftRed, softenRedNative } from "../modules/nativeSoftenRed";

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
export default function SmartImage({ source, style, resizeMode = "contain", crisp = true, softenRed = false, transparentBackground = false, ...rest }: ImageProps & { crisp?: boolean | "detail"; softenRed?: boolean | "all" | "health"; transparentBackground?: boolean }) {
  const uri = (source as { uri?: string } | undefined)?.uri;
  const inlineSvg = getInlineSvg(uri);
  // Lighten reds without washing out the other original colors.
  const colorTreatment = softenRed === "all" ? true : softenRed;
  const cached = useMemo(() => Platform.OS === "web" && uri && !inlineSvg
    ? cachedWordImage(uri, crisp, colorTreatment, transparentBackground)
    : undefined, [uri, crisp, colorTreatment, transparentBackground, inlineSvg]);
  const [normalized, setNormalized] = useState<{ original: string; uri: string; crisp: boolean | "detail"; softenRed: boolean | "all" | "health"; transparentBackground: boolean }>();
  useEffect(() => {
    if (Platform.OS !== "web" || !uri || inlineSvg || cached) return;
    let current = true;
    normalizeWordImage(uri, crisp, colorTreatment, transparentBackground).then((next) => {
      if (current) setNormalized({ original: uri, uri: next, crisp, softenRed: colorTreatment, transparentBackground });
    });
    return () => { current = false; };
  }, [uri, crisp, colorTreatment, inlineSvg, transparentBackground, cached]);
  // Phones: the same red softening as the web (Skia), saved once per picture.
  const nativeSoften = Platform.OS !== "web" && !!uri && !inlineSvg && !!colorTreatment && !/\.svg(\?|$)/i.test(uri);
  const nativeMode = colorTreatment === "health" ? "health" : true;
  const [nativeSoft, setNativeSoft] = useState<{ original: string; uri: string | null }>();
  const [nativeGaveUp, setNativeGaveUp] = useState(false);
  useEffect(() => {
    if (!nativeSoften || !uri) return;
    setNativeGaveUp(false);
    const ready = cachedSoftRed(uri, nativeMode);
    if (ready) {
      setNativeSoft({ original: uri, uri: ready });
      return;
    }
    let current = true;
    // never leave a tile empty for long: only a very slow / failed picture shows its original
    const timer = setTimeout(() => current && setNativeGaveUp(true), 6000);
    softenRedNative(uri, nativeMode).then((out) => {
      if (!current) return;
      clearTimeout(timer);
      setNativeSoft({ original: uri, uri: out });
    });
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [uri, nativeSoften, nativeMode]);
  const nativeDone = nativeSoft?.original === uri;
  const nativeUri = nativeSoften && nativeDone ? nativeSoft?.uri ?? undefined : undefined;

  const finalUri = Platform.OS !== "web"
    ? nativeUri
    : normalized?.original === uri && normalized?.crisp === crisp && normalized?.softenRed === colorTreatment && normalized?.transparentBackground === transparentBackground
      ? normalized.uri
      : cached;
  const displaySource = finalUri ? { ...(source as object), uri: finalUri } : source;
  // Keep the frame in place while the image gets its final crop and colors.
  const preparing = Platform.OS === "web"
    ? !!uri && !inlineSvg && !finalUri
    : nativeSoften && !nativeDone && !nativeGaveUp;
  return (
    <View style={[style as object, styles.frame, transparentBackground && styles.transparent]}>
      <View style={[styles.picture, transparentBackground && styles.transparent]}>
        {inlineSvg ? <SvgXml xml={inlineSvg} width="100%" height="100%" /> : uri && Platform.OS !== "web" && /\.svg(\?|$)/i.test(uri) ? (
          <SvgUri uri={uri} width="100%" height="100%" onError={() => rest.onError?.({} as never)} />
        ) : !preparing ? (
          <Image
            resizeMethod={Platform.OS === "android" ? "auto" : undefined}
            {...rest}
            source={displaySource}
            style={StyleSheet.absoluteFill}
            resizeMode={resizeMode}
            fadeDuration={0}
          />
        ) : null}
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
