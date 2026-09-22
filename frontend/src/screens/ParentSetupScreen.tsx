import React, { useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { AppScreen } from "../types";
import { useSettings } from "../context/SettingsContext";
import { useResponsive } from "../modules/responsive";
import { loadChildren } from "../modules/storage";
import { t, TKey } from "../modules/i18n";
import { tapFeedback } from "../modules/haptics";
import Mascot from "../components/Mascot";
import LangBadge from "../components/LangBadge";
import { colors } from "../theme";

interface Props {
  onNavigate: (screen: AppScreen) => void;
  onBack: () => void;
}

interface PortalItem {
  screen: AppScreen;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  badge?: string;
}

export default function ParentSetupScreen({ onNavigate, onBack }: Props) {
  const { isTablet } = useResponsive();
  const { settings } = useSettings();
  const lang = settings.language;
  const tt = (k: TKey) => t(k, lang);
  const children = useMemo(() => loadChildren(), []);
  const totalStars = children.reduce((s, c) => s + (c.stars ?? 0), 0);

  // BloomSpeech only wires up the screens the Talk Board actually has —
  // Parent Hub / Doctor Panel / Admin Panel / Sentence Picture belong to
  // other apps (or the original combined project) and are not reachable
  // here, so they are deliberately not listed as options on this screen.
  const sections: { title: string; items: PortalItem[] }[] = [
    {
      title: tt("psFamilySection"),
      items: [
        {
          screen: "enroll-child",
          icon: "person-add",
          title: t("addChild", lang),
          subtitle: tt("psEnrollSubtitle"),
          color: colors.forest,
        },
      ],
    },
    {
      title: tt("psContentSection"),
      items: [
        {
          screen: "my-categories",
          icon: "albums",
          title: tt("psCategoryBuilderTitle"),
          subtitle: tt("psCategoryBuilderSub"),
          color: "#10b981",
        },
        {
          screen: "phrase-library",
          icon: "chatbubbles",
          title: t("rowPhraseLibrary", lang),
          subtitle: lang === "ar-SA" ? "إدارة العبارات التي يمكن مطابقتها بالصوت" : "Manage phrases the child can match by voice",
          color: "#8b5cf6",
        },
        {
          screen: "review-queue",
          icon: "checkmark-done-circle",
          title: t("rowContentReviewQueue", lang),
          subtitle: lang === "ar-SA" ? "مراجعة الصور المعلّقة قبل إضافتها للوحة" : "Approve or reject pending pictures before they reach the board",
          color: "#c98a3d",
        },
      ],
    },
    {
      title: tt("psSystemSection"),
      items: [
        {
          screen: "accessibility",
          icon: "settings",
          title: t("settings", lang),
          subtitle: tt("psAccessibilitySub"),
          color: "#64748b",
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={[styles.headerInner, isTablet && styles.headerInnerTablet]}>
            <Pressable
              onPress={() => {
                tapFeedback();
                onBack();
              }}
              style={styles.backBtn}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={20} color="#0f172a" />
            </Pressable>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.headerTitle}>{t("parentSetup", lang)}</Text>
                <View style={styles.secureBadge}>
                  <Ionicons name="lock-closed" size={10} color="#166534" />
                  <Text style={styles.secureBadgeText}>{tt("psParentAreaBadge")}</Text>
                </View>
              </View>
              <Text style={styles.headerSub}>{tt("psHeaderSub")}</Text>
            </View>
            <LangBadge />
          </View>
        </View>

        <ScrollView contentContainerStyle={[styles.body, isTablet && styles.bodyTablet]} showsVerticalScrollIndicator={false}>
          {/* Overview Status Banner */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewLeft}>
              <Mascot mood="happy" size={54} animate={false} />
              <View style={{ flex: 1 }}>
                <Text style={styles.overviewTitle}>{tt("psWelcomeCaregiver")}</Text>
                <Text style={styles.overviewSub}>
                  {tt("psChildrenConfigured").replace("{count}", String(children.length)).replace("{stars}", String(totalStars))}
                </Text>
              </View>
            </View>
            <View style={styles.overviewStatsRow}>
              <View style={styles.miniStatBox}>
                <Text style={styles.miniStatNum}>{children.length}</Text>
                <Text style={styles.miniStatLabel}>{tt("psChildrenLabel")}</Text>
              </View>
              <View style={styles.miniStatBox}>
                <Text style={[styles.miniStatNum, { color: colors.greenDeep }]}>{tt("psActiveStatus")}</Text>
                <Text style={styles.miniStatLabel}>{tt("psOfflineAac")}</Text>
              </View>
              <View style={styles.miniStatBox}>
                <Text style={[styles.miniStatNum, { color: colors.blueDeep }]}>{tt("psIepReady")}</Text>
                <Text style={styles.miniStatLabel}>{tt("psClinicalBadge")}</Text>
              </View>
            </View>
          </View>

          {/* Categorized Sections */}
          {sections.map((sec) => (
            <View key={sec.title} style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>{sec.title}</Text>
              <View style={[styles.itemsList, isTablet && styles.itemsListTablet]}>
                {sec.items.map((item) => (
                  <Pressable
                    key={item.screen}
                    onPress={() => {
                      tapFeedback();
                      onNavigate(item.screen);
                    }}
                    style={[styles.itemCard, isTablet && styles.itemCardTablet]}
                  >
                    <View style={[styles.itemIconCircle, { backgroundColor: item.color + "18" }]}>
                      <Ionicons name={item.icon} size={22} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        {item.badge && (
                          <View style={styles.itemBadge}>
                            <Text style={styles.itemBadgeText}>{item.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.itemSub}>{item.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          {/* Return button */}
          <Pressable
            onPress={() => {
              tapFeedback();
              onBack();
            }}
            style={styles.returnBtn}
          >
            <Ionicons name="scan-outline" size={18} color="#64748b" />
            <Text style={styles.returnBtnText}>{tt("psReturnToScanner")}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerInner: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  headerInnerTablet: {
    maxWidth: 860,
    alignSelf: "center",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  headerSub: { fontSize: 11.5, color: "#64748b", marginTop: 1 },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  secureBadgeText: { fontSize: 10, fontWeight: "800", color: "#166534" },

  body: { padding: 16, gap: 18, paddingBottom: 40 },
  bodyTablet: {
    maxWidth: 860,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 28,
  },

  /* Overview Card */
  overviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  overviewLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  overviewTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  overviewSub: { fontSize: 12, color: "#64748b", marginTop: 2, lineHeight: 17 },
  overviewStatsRow: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  miniStatBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  miniStatNum: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  miniStatLabel: { fontSize: 10, color: "#64748b", marginTop: 1, fontWeight: "600" },

  /* Sections */
  sectionWrap: { gap: 8 },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  itemsList: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  itemsListTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    backgroundColor: "transparent",
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
    gap: 12,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  itemCardTablet: {
    width: "48.8%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  itemIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  itemSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  itemBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemBadgeText: { fontSize: 10, fontWeight: "700", color: "#475569" },

  /* Return Button */
  returnBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6,
  },
  returnBtnText: { color: "#475569", fontSize: 13, fontWeight: "700" },
});
