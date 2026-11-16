import { useEffect, useState } from "react";
import { Image, Platform, StyleSheet, View, type ImageProps } from "react-native";
import { SvgUri } from "react-native-svg";
import { normalizeWordImage } from "../modules/normalizeWordImage";

/** Shared image frame; word cards request cover to fill their entire picture area. */
export default function SmartImage({ source, style, resizeMode = "contain", ...rest }: ImageProps) {
  const uri = (source as { uri?: string } | undefined)?.uri;
  const [normalized, setNormalized] = useState<{ original: string; uri: string }>();
  useEffect(() => {
    if (Platform.OS !== "web" || !uri) return;
    let current = true;
    normalizeWordImage(uri).then((next) => {
      if (current) setNormalized({ original: uri, uri: next });
    });
    return () => { current = false; };
  }, [uri]);
  const displaySource = uri && normalized?.original === uri
    ? { ...(source as object), uri: normalized.uri }
    : source;
  return (
    <View style={[style as object, styles.frame]}>
      <View style={styles.picture}>
        {uri && Platform.OS !== "web" && /\.svg(\?|$)/i.test(uri) ? (
          <SvgUri uri={uri} width="100%" height="100%" onError={() => rest.onError?.({} as never)} />
        ) : (
          <Image {...rest} source={displaySource} style={StyleSheet.absoluteFill} resizeMode={resizeMode} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: "hidden", alignItems: "center", justifyContent: "center" },
  picture: { width: "100%", height: "100%" },
});
