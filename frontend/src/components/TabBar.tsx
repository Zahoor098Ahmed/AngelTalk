import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { TabScreen } from "../types";
import { colors } from "../theme";
import { useResponsive } from "../modules/responsive";
import { useSettings } from "../context/SettingsContext";
import { t, type TKey } from "../modules/i18n";

interface TabBarProps {
  active: TabScreen;
  onChange: (tab: TabScreen) => void;
  labels?: Record<TabScreen, string>;
}

const TABS: { key: TabScreen; icon: keyof typeof Ionicons.glyphMap; tKey: TKey }[] = [
  { key: "home", icon: "home", tKey: "home" },
  { key: "speak", icon: "chatbubble-ellipses", tKey: "talk" },
  { key: "schedule", icon: "calendar", tKey: "schedule" },
  { key: "games", icon: "game-controller", tKey: "games" },
  { key: "progress", icon: "stats-chart", tKey: "progress" },
];

export default function TabBar({ active, onChange, labels }: TabBarProps) {
  const { isSmallPhone, isTablet } = useResponsive();
  const { settings } = useSettings();
  const lang = settings.language;
  const iconSize = isSmallPhone ? 20 : isTablet ? 24 : 22;
  const labelFontSize = isSmallPhone ? 9.5 : isTablet ? 11.5 : 10.5;

  return (
    <View style={styles.bar}>
      <View style={[styles.innerContainer, isTablet && styles.innerContainerTablet]}>
        {TABS.map((tab) => {
          const isActive = active === tab.key;
          const displayLabel = labels?.[tab.key] || t(tab.tKey, lang);
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              style={styles.item}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <View style={[styles.iconCircle, isActive && styles.iconCircleActive]}>
                <Ionicons
                  name={tab.icon}
                  size={iconSize}
                  color={isActive ? "#ffffff" : "#8c96a0"}
                />
              </View>
              {displayLabel ? (
                <Text
                  style={[
                    styles.label,
                    {
                      color: isActive ? colors.forest : "#8c96a0",
                      fontWeight: isActive ? "800" : "600",
                      fontSize: labelFontSize,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {displayLabel}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e9ee",
    paddingTop: 6,
    paddingBottom: 8,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 4,
  },
  innerContainer: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-around",
  },
  innerContainerTablet: {
    maxWidth: 640,
    alignSelf: "center",
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleActive: {
    backgroundColor: colors.forest,
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 10.5,
    marginTop: 1,
  },
});

