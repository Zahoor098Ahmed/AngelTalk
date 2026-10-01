import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export type UrgentActionType = "help" | "water" | "bathroom" | "stop";

interface Props {
  type: UrgentActionType;
  size?: number;
}

export default function UrgentActionIcon({ type, size = 28 }: Props) {
  switch (type) {
    case "help":
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Safety Lifebuoy ring */}
          <Circle cx="16" cy="16" r="13.5" fill="#dc2626" />
          <Circle cx="16" cy="16" r="6" fill="#fee2e2" />
          {/* 4 White safety bands */}
          <Rect x="14" y="2.5" width="4" height="6.5" rx="1.5" fill="white" />
          <Rect x="14" y="23" width="4" height="6.5" rx="1.5" fill="white" />
          <Rect x="2.5" y="14" width="6.5" height="4" rx="1.5" fill="white" />
          <Rect x="23" y="14" width="6.5" height="4" rx="1.5" fill="white" />
          {/* Inner ring accent */}
          <Circle cx="16" cy="16" r="3.2" fill="#dc2626" opacity={0.25} />
        </Svg>
      );

    case "water":
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Smooth curved water droplet */}
          <Path
            d="M16 3.5 C16 3.5 7 14.8 7 21 C7 26 11 29.5 16 29.5 C21 29.5 25 26 25 21 C25 14.8 16 3.5 16 3.5 Z"
            fill="#0284c7"
          />
          {/* Curved gleam highlight */}
          <Path
            d="M11.5 18 C10.8 19.8 11.2 22.8 13.5 25 C14.2 25.6 15 26.2 16 26.5"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity={0.7}
            fill="none"
          />
          <Circle cx="20.5" cy="18.5" r="1.4" fill="white" opacity={0.65} />
        </Svg>
      );

    case "bathroom":
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Male figure */}
          <Circle cx="10" cy="6.5" r="3" fill="#d97706" />
          <Path
            d="M7 11.5 C7 11.2 7.3 11 7.7 11 H12.3 C12.7 11 13 11.2 13 11.5 V18 H11.8 V26.5 C11.8 26.8 11.6 27 11.3 27 H10.3 C10 27 9.8 26.8 9.8 26.5 V18 H8.2 V26.5 C8.2 26.8 8 27 7.7 27 H6.7 C6.4 27 6.2 26.8 6.2 26.5 V18 H7 V11.5 Z"
            fill="#d97706"
          />
          {/* Female figure in dress */}
          <Circle cx="22" cy="6.5" r="3" fill="#d97706" />
          <Path
            d="M18.8 11 C18.3 11 18 11.4 18.2 11.9 L20.2 18.5 H19.2 V26.5 C19.2 26.8 19.4 27 19.7 27 H20.7 C21 27 21.2 26.8 21.2 26.5 V18.5 H22.8 V26.5 C22.8 26.8 23 27 23.3 27 H24.3 C24.6 27 24.8 26.8 24.8 26.5 V18.5 H23.8 L25.8 11.9 C26 11.4 25.7 11 25.2 11 H18.8 Z"
            fill="#d97706"
          />
        </Svg>
      );

    case "stop":
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Rounded octagon stop badge */}
          <Path
            d="M10.2 3.5 H21.8 L28.5 10.2 V21.8 L21.8 28.5 H10.2 L3.5 21.8 V10.2 Z"
            fill="#ea580c"
          />
          {/* Raised hand fingers */}
          <Rect x="12" y="11" width="2.2" height="6.5" rx="1.1" fill="white" />
          <Rect x="15" y="9.5" width="2.2" height="8" rx="1.1" fill="white" />
          <Rect x="18" y="10.5" width="2.2" height="7" rx="1.1" fill="white" />
          <Rect x="21" y="12.5" width="2" height="5" rx="1" fill="white" />
          {/* Palm base & thumb */}
          <Path
            d="M9.8 16.5 C9.8 15.7 10.4 15 11.2 15 C11.8 15 12.3 15.4 12.5 15.9 L13.5 18 H21.5 C22.3 18 23 18.7 23 19.5 C23 23 19.5 25.5 16 25.5 C12.5 25.5 9.8 23 9.8 19.5 V16.5 Z"
            fill="white"
          />
        </Svg>
      );
  }
}
