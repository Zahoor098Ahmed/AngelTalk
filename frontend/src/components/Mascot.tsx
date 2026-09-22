import { useEffect, useRef, type ReactElement } from "react";
import { Animated, Easing } from "react-native";
import Svg, { Ellipse, Circle, Path } from "react-native-svg";

type MascotMood = "happy" | "excited" | "calm" | "thinking" | "love";

interface MascotProps {
  mood?: MascotMood;
  size?: number;
  animate?: boolean;
}

export default function Mascot({ mood = "happy", size = 120, animate = true }: MascotProps) {
  const bodyColor = "#ffc89a";
  const earColor = "#ffb07c";
  const faceColor = "#fff3e8";
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(rotation, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(rotation, { toValue: -1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(rotation, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animate]);

  const rotate = rotation.interpolate({ inputRange: [-1, 1], outputRange: ["-3deg", "3deg"] });

  const eyes: Record<MascotMood, ReactElement> = {
    happy: (
      <>
        <Ellipse cx={38} cy={52} rx={5} ry={6} fill="#3d3047" />
        <Ellipse cx={62} cy={52} rx={5} ry={6} fill="#3d3047" />
        <Ellipse cx={40} cy={50} rx={2} ry={2} fill="white" />
        <Ellipse cx={64} cy={50} rx={2} ry={2} fill="white" />
      </>
    ),
    excited: (
      <>
        <Circle cx={38} cy={52} r={6} fill="#3d3047" />
        <Circle cx={62} cy={52} r={6} fill="#3d3047" />
        <Ellipse cx={40} cy={50} rx={2} ry={2} fill="white" />
        <Ellipse cx={64} cy={50} rx={2} ry={2} fill="white" />
      </>
    ),
    calm: (
      <>
        <Path d="M33 52 Q38 48 43 52" stroke="#3d3047" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <Path d="M57 52 Q62 48 67 52" stroke="#3d3047" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      </>
    ),
    thinking: (
      <>
        <Ellipse cx={38} cy={52} rx={5} ry={6} fill="#3d3047" />
        <Ellipse cx={62} cy={50} rx={5} ry={4} fill="#3d3047" />
        <Ellipse cx={40} cy={50} rx={2} ry={2} fill="white" />
      </>
    ),
    love: (
      <>
        <Path d="M33 49 Q35 44 38 47 Q41 44 43 49 Q43 54 38 58 Q33 54 33 49Z" fill="#ff8f6b" />
        <Path d="M57 49 Q59 44 62 47 Q65 44 67 49 Q67 54 62 58 Q57 54 57 49Z" fill="#ff8f6b" />
      </>
    ),
  };

  const mouths: Record<MascotMood, ReactElement> = {
    happy: <Path d="M38 70 Q50 80 62 70" stroke="#3d3047" strokeWidth={2.5} fill="none" strokeLinecap="round" />,
    excited: <Path d="M35 68 Q50 82 65 68" stroke="#3d3047" strokeWidth={2.5} fill="none" strokeLinecap="round" />,
    calm: <Path d="M42 72 Q50 76 58 72" stroke="#3d3047" strokeWidth={2.5} fill="none" strokeLinecap="round" />,
    thinking: <Path d="M40 72 Q48 74 56 70" stroke="#3d3047" strokeWidth={2.5} fill="none" strokeLinecap="round" />,
    love: <Path d="M38 70 Q50 82 62 70" stroke="#3d3047" strokeWidth={2.5} fill="none" strokeLinecap="round" />,
  };

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ rotate: animate ? rotate : "0deg" }] }}>
      <Svg width={size} height={size} viewBox="0 0 100 110">
        <Circle cx={20} cy={28} r={16} fill={earColor} />
        <Circle cx={80} cy={28} r={16} fill={earColor} />
        <Circle cx={20} cy={28} r={10} fill={bodyColor} />
        <Circle cx={80} cy={28} r={10} fill={bodyColor} />

        <Ellipse cx={50} cy={60} rx={40} ry={45} fill={bodyColor} />
        <Ellipse cx={50} cy={65} rx={26} ry={30} fill={faceColor} />

        {eyes[mood]}

        <Ellipse cx={50} cy={64} rx={5} ry={3.5} fill="#c87950" />

        {mouths[mood]}

        <Ellipse cx={28} cy={68} rx={8} ry={5} fill="#ffb3ba" opacity={0.6} />
        <Ellipse cx={72} cy={68} rx={8} ry={5} fill="#ffb3ba" opacity={0.6} />
      </Svg>
    </Animated.View>
  );
}
