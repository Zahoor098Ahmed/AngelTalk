import { Image, Platform, StyleSheet, View, type ImageProps } from "react-native";
import { SvgUri } from "react-native-svg";
import { pictureFit } from "../modules/pictureFit";

/**
 * Word picture that always shows the WHOLE image while still filling its box:
 * - AAC symbols / logos: shown whole on their plain background.
 * - Real photos: shown whole, with a blurred copy of the same photo filling the space
 *   around it (no white bands, nothing cropped) — like a phone gallery.
 * Drop-in for <Image>; `resizeMode` is decided here.
 */
export default function SmartImage({ source, style, resizeMode: _ignored, ...rest }: ImageProps) {
  const uri = (source as { uri?: string } | undefined)?.uri;
  // symbol sets such as Mulberry only come as SVG: the browser shows them as an image, phones need react-native-svg
  if (uri && Platform.OS !== "web" && /\.svg(\?|$)/i.test(uri)) {
    return (
      <View style={style as object}>
        <SvgUri uri={uri} width="100%" height="100%" onError={() => rest.onError?.({} as never)} />
      </View>
    );
  }
  if (pictureFit(uri) === "contain") {
    return <Image source={source} style={style} resizeMode="contain" {...rest} />;
  }
  return (
    <View style={[style as object, styles.frame]}>
      <Image source={source} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={18} />
      <View style={[StyleSheet.absoluteFill, styles.dim]} />
      <Image source={source} style={StyleSheet.absoluteFill} resizeMode="contain" {...rest} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: "hidden", backgroundColor: "#f1f5f9" },
  dim: { backgroundColor: "rgba(255,255,255,0.15)" },
});
