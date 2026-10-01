import React from "react";
import Svg, { Circle, Path, Ellipse } from "react-native-svg";

export type MoodType = "Happy" | "Calm" | "Excited" | "Sad" | "Tired";

interface MoodFaceProps {
  mood: MoodType;
  size?: number;
}

export default function MoodFace({ mood, size = 36 }: MoodFaceProps) {
  switch (mood) {
    case "Happy":
      return (
        <Svg width={size} height={size} viewBox="0 0 44 44">
          {/* Warm soft face */}
          <Circle cx="22" cy="22" r="19" fill="#fef08a" />
          {/* Rosy blush */}
          <Circle cx="11.5" cy="25" r="3.2" fill="#f43f5e" opacity={0.28} />
          <Circle cx="32.5" cy="25" r="3.2" fill="#f43f5e" opacity={0.28} />
          {/* Smiling eyes */}
          <Path
            d="M13 19 C15 15.5 19 15.5 21 19"
            stroke="#5c3818"
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M23 19 C25 15.5 29 15.5 31 19"
            stroke="#5c3818"
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="none"
          />
          {/* Cheerful open smile */}
          <Path d="M15 24 C15 32 29 32 29 24 Z" fill="#5c3818" />
          <Path
            d="M18 28.5 C20 31.2 24 31.2 26 28.5"
            fill="#f43f5e"
            opacity={0.8}
          />
        </Svg>
      );

    case "Calm":
      return (
        <Svg width={size} height={size} viewBox="0 0 44 44">
          {/* Peaceful sky-tinted face */}
          <Circle cx="22" cy="22" r="19" fill="#e0f2fe" />
          {/* Soft calm cheeks */}
          <Circle cx="11.5" cy="25.5" r="2.8" fill="#38bdf8" opacity={0.3} />
          <Circle cx="32.5" cy="25.5" r="2.8" fill="#38bdf8" opacity={0.3} />
          {/* Serene brow hints */}
          <Path
            d="M14 15.5 C16 14.5 19 15 20.5 16"
            stroke="#0284c7"
            strokeWidth={1.3}
            strokeLinecap="round"
            fill="none"
            opacity={0.65}
          />
          <Path
            d="M30 15.5 C28 14.5 25 15 23.5 16"
            stroke="#0284c7"
            strokeWidth={1.3}
            strokeLinecap="round"
            fill="none"
            opacity={0.65}
          />
          {/* Peaceful closed eyes */}
          <Path
            d="M13 20 C15 22.5 19 22.5 21 20"
            stroke="#0369a1"
            strokeWidth={2.3}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M23 20 C25 22.5 29 22.5 31 20"
            stroke="#0369a1"
            strokeWidth={2.3}
            strokeLinecap="round"
            fill="none"
          />
          {/* Gentle sweet closed smile */}
          <Path
            d="M17 26.5 C19.5 29 24.5 29 27 26.5"
            stroke="#0369a1"
            strokeWidth={2.3}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      );

    case "Excited":
      return (
        <Svg width={size} height={size} viewBox="0 0 44 44">
          {/* Radiant golden face */}
          <Circle cx="22" cy="22" r="19" fill="#fef3c7" />
          {/* Radiant rosy blush */}
          <Circle cx="11" cy="25.5" r="3.5" fill="#f59e0b" opacity={0.35} />
          <Circle cx="33" cy="25.5" r="3.5" fill="#f59e0b" opacity={0.35} />
          {/* Sparkling 4-point stars in eyes */}
          <Path
            d="M16.5 14.5 L17.5 17.5 L20.5 18.5 L17.5 19.5 L16.5 22.5 L15.5 19.5 L12.5 18.5 L15.5 17.5 Z"
            fill="#b45309"
          />
          <Path
            d="M27.5 14.5 L28.5 17.5 L31.5 18.5 L28.5 19.5 L27.5 22.5 L26.5 19.5 L23.5 18.5 L26.5 17.5 Z"
            fill="#b45309"
          />
          {/* Big enthusiastic joyful smile */}
          <Path d="M14 24 C14 33.5 30 33.5 30 24 Z" fill="#b45309" />
          <Path
            d="M17 29.5 C20 32.5 24 32.5 27 29.5"
            fill="#f87171"
          />
          {/* Little energy sparkle top right */}
          <Path
            d="M36 6 L36.8 8.2 L39 9 L36.8 9.8 L36 12 L35.2 9.8 L33 9 L35.2 8.2 Z"
            fill="#f59e0b"
          />
        </Svg>
      );

    case "Sad":
      return (
        <Svg width={size} height={size} viewBox="0 0 44 44">
          {/* Tender lavender face */}
          <Circle cx="22" cy="22" r="19" fill="#ede9fe" />
          {/* Sympathetic eyebrows */}
          <Path
            d="M13 16 C15.5 14.5 18.5 16.5 19.5 17"
            stroke="#6b21a8"
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M31 16 C28.5 14.5 25.5 16.5 24.5 17"
            stroke="#6b21a8"
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
          {/* Gentle droopy caring eyes with light highlights */}
          <Circle cx="16.5" cy="20" r="2.8" fill="#6b21a8" />
          <Circle cx="15.8" cy="19.2" r="0.9" fill="white" />
          <Circle cx="27.5" cy="20" r="2.8" fill="#6b21a8" />
          <Circle cx="26.8" cy="19.2" r="0.9" fill="white" />
          {/* Soft empathetic pout */}
          <Path
            d="M17 28 C19.5 25.5 24.5 25.5 27 28"
            stroke="#6b21a8"
            strokeWidth={2.2}
            strokeLinecap="round"
            fill="none"
          />
          {/* Gentle single teardrop */}
          <Path
            d="M12.5 23.5 C12.5 22 14 20.5 14 20.5 C14 20.5 15.5 22 15.5 23.5 C15.5 24.8 14.7 25.5 14 25.5 C13.3 25.5 12.5 24.8 12.5 23.5 Z"
            fill="#38bdf8"
          />
        </Svg>
      );

    case "Tired":
      return (
        <Svg width={size} height={size} viewBox="0 0 44 44">
          {/* Soft sleepy slate-tinted face */}
          <Circle cx="22" cy="22" r="19" fill="#f1f5f9" />
          {/* Drowsy closed eyes */}
          <Path
            d="M13 21 C15 23 19 23 21 21"
            stroke="#475569"
            strokeWidth={2.2}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M23 21 C25 23 29 23 31 21"
            stroke="#475569"
            strokeWidth={2.2}
            strokeLinecap="round"
            fill="none"
          />
          {/* Cute relaxed yawn / sleepy mouth */}
          <Ellipse cx="22" cy="27" rx="2.5" ry="3.2" fill="#475569" />
          {/* Peaceful pastel "z Z" */}
          <Path
            d="M31 10 H35 L31 14 H35"
            stroke="#3b82f6"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M27 7 H30 L27 9.5 H30"
            stroke="#93c5fd"
            strokeWidth={1.3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      );
  }
}
