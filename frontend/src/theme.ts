export const colors = {
  // Base
  bg: "#f5f0e6",
  card: "#ffffff",
  cardMuted: "#efe9dd",
  border: "#e7e0d2",

  // Brand
  forest: "#2d5f4f",
  forestDark: "#1f4437",
  forestLight: "#e3ede8",

  // Text
  textDark: "#2b2a26",
  textMid: "#6f6a5e",
  textLight: "#a39d8c",

  // Pastel tiles (Quick Access / word tiles / stats)
  blue: "#cfe0ec",
  blueDeep: "#6699bb",
  yellow: "#f3e3bd",
  yellowDeep: "#c99a2e",
  green: "#d9e8d3",
  greenDeep: "#5c9a58",
  pink: "#f3d9d9",
  pinkDeep: "#c96b6b",
  orange: "#f0ddc4",
  orangeDeep: "#c98a3d",
  purple: "#e3d9ef",
  purpleDeep: "#8a6bc9",

  // Parent Dashboard accent — unified with the app-wide forest theme so every
  // screen shares one color language. (Kept as separate token names so screens
  // that opt into an "accent" still read clearly.)
  indigo: "#2d5f4f",
  indigoDeep: "#1f4437",
  indigoLight: "#e3ede8",
  indigoAccent: "#2d5f4f",
  blueAccent: "#2d5f4f",

  white: "#ffffff",
  danger: "#c45",
};

export const radius = 20;
export const radiusSm = 14;
export const radiusLg = 28;

export const fontSizeScale: Record<"small" | "medium" | "large" | "xlarge", number> = {
  small: 0.85,
  medium: 1,
  large: 1.15,
  xlarge: 1.3,
};
