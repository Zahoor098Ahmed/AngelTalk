import { useWindowDimensions } from "react-native";

export interface ResponsiveInfo {
  width: number;
  height: number;
  isSmallPhone: boolean; // width < 375 (e.g. iPhone SE 1st gen, small Androids)
  isPhone: boolean;      // width < 600 (phones portrait)
  isTablet: boolean;     // width >= 600 (iPads, Galaxy Tabs, foldable unfolded)
  isLargeTablet: boolean;// width >= 900 (iPad Pro 11"/12.9", desktop/web landscape)
  isLandscape: boolean;  // width > height
  containerMaxWidth: number | "100%";
  contentPadding: number;
  scaleFactor: number;
}

/**
 * Responsive layout hook that dynamically adapts to mobile screens, tablets,
 * and device orientation changes in real time.
 */
export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = width < 375;
  const isPhone = width < 600;
  const isTablet = width >= 600;
  const isLargeTablet = width >= 900;
  const isLandscape = width > height;

  const containerMaxWidth = isLargeTablet ? 980 : isTablet ? 760 : "100%";
  const contentPadding = isSmallPhone ? 12 : isTablet ? 24 : 18;
  const scaleFactor = isSmallPhone ? 0.9 : isLargeTablet ? 1.15 : isTablet ? 1.05 : 1.0;

  return {
    width,
    height,
    isSmallPhone,
    isPhone,
    isTablet,
    isLargeTablet,
    isLandscape,
    containerMaxWidth,
    contentPadding,
    scaleFactor,
  };
}
