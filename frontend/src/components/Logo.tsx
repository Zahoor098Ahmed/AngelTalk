import { Image } from "react-native";

export default function Logo({ size = 88 }: { size?: number }) {
  return (
    <Image
      source={require("../../assets/icon.png")}
      style={{ width: size, height: size }}
      resizeMethod="scale"
      resizeMode="contain"
      fadeDuration={0}
    />
  );
}
