import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Path, Ellipse, G } from "react-native-svg";

interface LogoProps {
  size?: number;
}

// Same artwork as the app icon (assets/icon.png)
const WING =
  "M30 46 C24 36 14 30 5 31 C8 34 10 36 12 38 C7 39 5 42 5 45 C9 44 12 44 14 45 C10 47 9 51 10 54 C14 52 17 52 19 53 C17 56 17 59 19 62 C23 58 27 56 31 56 Z";

const star = (x: number, y: number, r: number) =>
  `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;

export default function Logo({ size = 88 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="badge" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#6C63FF" />
          <Stop offset="0.55" stopColor="#A45CF0" />
          <Stop offset="1" stopColor="#FF7AB6" />
        </LinearGradient>
        <RadialGradient id="glow" cx="0.3" cy="0.2" r="0.7">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={0.35} />
          <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="heart" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FF5C93" />
          <Stop offset="1" stopColor="#FF8A5B" />
        </LinearGradient>
        <LinearGradient id="halo" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFC94D" />
          <Stop offset="0.5" stopColor="#FFE9A3" />
          <Stop offset="1" stopColor="#FFC94D" />
        </LinearGradient>
      </Defs>

      <Rect x="4" y="4" width="92" height="92" rx="26" fill="url(#badge)" />
      <Rect x="4" y="4" width="92" height="92" rx="26" fill="url(#glow)" />

      <G transform="translate(50 50) scale(0.95) translate(-50 -51)">
        {/* halo */}
        <Ellipse cx="50" cy="25" rx="14" ry="4.6" fill="none" stroke="url(#halo)" strokeWidth={3.4} />

        {/* wings */}
        <Path d={WING} fill="#ffffff" fillOpacity={0.82} />
        <Path d={WING} fill="#ffffff" fillOpacity={0.82} transform="translate(100 0) scale(-1 1)" />

        {/* speech bubble */}
        <Path
          d="M33 36 h34 a10 10 0 0 1 10 10 v14 a10 10 0 0 1 -10 10 h-13 l-9 9 v-9 h-12 a10 10 0 0 1 -10 -10 v-14 a10 10 0 0 1 10 -10 z"
          fill="#ffffff"
        />

        {/* heart inside the bubble, representing care */}
        <Path
          d="M50 50 C48.4 47.2 45.5 45.7 42.8 46.6 C39.7 47.6 38.1 51 39.3 53.9 C40.6 57 44.9 60.2 50 63.7 C55.1 60.2 59.4 57 60.7 53.9 C61.9 51 60.3 47.6 57.2 46.6 C54.5 45.7 51.6 47.2 50 50 Z"
          fill="url(#heart)"
        />

        {/* sparkles */}
        <Path d={star(80, 22, 4.2)} fill="#FFE07A" />
        <Path d={star(19, 78, 3)} fill="#FFE07A" fillOpacity={0.9} />
      </G>
    </Svg>
  );
}
