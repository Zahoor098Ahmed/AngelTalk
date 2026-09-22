import Svg, { Defs, LinearGradient, Stop, Rect, Path, Circle } from "react-native-svg";

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 88 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="badge" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#4d8a75" />
          <Stop offset="1" stopColor="#2d5f4f" />
        </LinearGradient>
      </Defs>

      <Rect x="4" y="4" width="92" height="92" rx="26" fill="url(#badge)" />

      {/* speech bubble */}
      <Path
        d="M28 34 h44 a8 8 0 0 1 8 8 v16 a8 8 0 0 1 -8 8 h-20 l-10 10 v-10 h-14 a8 8 0 0 1 -8 -8 v-16 a8 8 0 0 1 8 -8 z"
        fill="white"
        opacity={0.96}
      />

      {/* heart inside the bubble, representing care */}
      <Path
        d="M50 48.5 C48.3 45.6 45.2 44 42.3 44.9 C39 45.9 37.3 49.5 38.6 52.6 C40 55.9 44.6 59.3 50 63 C55.4 59.3 60 55.9 61.4 52.6 C62.7 49.5 61 45.9 57.7 44.9 C54.8 44 51.7 45.6 50 48.5 Z"
        fill="#2d5f4f"
      />

      {/* soft sparkle accents */}
      <Circle cx="76" cy="26" r="3.2" fill="#f3e3bd" opacity={0.9} />
      <Circle cx="24" cy="72" r="2.4" fill="#f3e3bd" opacity={0.7} />
    </Svg>
  );
}
