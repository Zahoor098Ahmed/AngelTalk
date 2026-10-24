import { useMemo, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { ChildProfile, TabScreen } from "../types";
import { useSettings } from "../context/SettingsContext";
import { t } from "../modules/i18n";
import { getUsage, getChild, awardChildStars } from "../modules/storage";
import { getPictogramUrl } from "../modules/aacPictograms";
import { tapFeedback } from "../modules/haptics";
import SmartImage from "../components/SmartImage";
import { useResponsive } from "../modules/responsive";
import LangBadge from "../components/LangBadge";
import SoftBackdrop from "../components/SoftBackdrop";
import TabBar from "../components/TabBar";
import { colors } from "../theme";
import { ensureCategoriesLoaded, bottomTabCategories, getCategory, folderPictureFor, folderEnglishName, subscribeCategories } from "../modules/customCategories";
import HOME_PICTURES from "../modules/homeCategoryPictures.json";
import Mascot from "../components/Mascot";

/** Hand-drawn 3D pictures (Microsoft Fluent Emoji, MIT) for the main categories on the Home screen. */
const homePictures: Record<string, string> = HOME_PICTURES as Record<string, string>;

interface Props {
  child: ChildProfile;
  tab: TabScreen;
  onTabChange: (tab: TabScreen) => void;
  onOpenMore: () => void;
  onOpenSocialStories?: () => void;
  labels: Record<TabScreen, string>;
  onUpdateChild?: (child: ChildProfile) => void;
  /** Opens the Talk board inside this category. */
  onOpenCategory?: (categoryId: string) => void;
}

export default function HomeScreen(props: Props) {
  const { child: propChild, tab, onTabChange, onOpenMore, labels, onUpdateChild, onOpenCategory } = props;
  const { settings } = useSettings();
  // the main categories of the Talk board; tapping one opens the board inside it
  const [catTick, setCatTick] = useState(0);
  useEffect(() => {
    let alive = true;
    ensureCategoriesLoaded().then(() => alive && setCatTick((n) => n + 1));
    const unsub = subscribeCategories(() => setCatTick((n) => n + 1));
    return () => {
      alive = false;
      unsub();
    };
  }, []);
  // exactly the Talk board's list: same names and order, and a category the parent hides or deletes leaves both
  const categories = useMemo(
    () =>
      bottomTabCategories(settings.language)
        .map((t) => ({ tab: t, cat: getCategory(t.id) }))
        .filter((x): x is { tab: typeof x.tab; cat: NonNullable<typeof x.cat> } => !!x.cat && !x.cat.hidden),
    [catTick, settings.language],
  );
  const child = getChild(propChild.id) ?? propChild;
  const { isTablet } = useResponsive();
  const lang = settings.language;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("morning", lang) : hour < 17 ? t("afternoon", lang) : t("evening", lang);
  const tr = (en: string, ar: string, ur: string) => (lang === "ar-SA" ? ar : lang === "ur-PK" ? ur : en);

  const usage = useMemo(() => getUsage(child.id), [child.id]);
  const weekWords = usage.wordsByDay.reduce((sum, v) => sum + v, 0);

  // If child has 0 stars but has already played games, restore baseline stars right away
  useEffect(() => {
    if ((!child.stars || child.stars === 0) && ((usage.consecutiveDays ?? 0) > 0 || (usage.gameStreak ?? 0) > 0 || usage.lastPlayedDate)) {
      const updated = awardChildStars(child.id, 8);
      if (updated && onUpdateChild) {
        onUpdateChild(updated);
      }
    }
  }, [child.id, child.stars, usage.consecutiveDays, usage.gameStreak, usage.lastPlayedDate, onUpdateChild]);

  const STATS: { icon: keyof typeof Ionicons.glyphMap; tint: string; bg: string; value: number; label: string }[] = [
    // Stars card: hidden for now
    // { icon: "star", tint: "#d97706", bg: "#fef3c7", value: child.stars ?? 0, label: tr("Stars", "نجوم", "ستارے") },
    { icon: "chatbubbles", tint: "#2563eb", bg: "#dbeafe", value: weekWords, label: tr("Words this week", "كلمات هذا الأسبوع", "اس ہفتے کے الفاظ") },
    { icon: "flame", tint: "#ea580c", bg: "#ffedd5", value: usage.consecutiveDays ?? 0, label: tr("Days in a row", "أيام متتالية", "لگاتار دن") },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <SoftBackdrop
          shapes={[
            { size: 90, top: -20, right: -20, color: "rgba(45,95,79,0.06)" },
            { size: 60, top: 120, left: -20, color: "rgba(201,138,61,0.05)" },
          ]}
        />

        {/* 1. Header Banner */}
        <View style={styles.header}>
          <View style={[styles.headerInner, isTablet && styles.headerInnerTablet]}>
            <View style={styles.headerTop}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Mascot mood="happy" size={58} animate={!settings.reduceMotion} />
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <Ionicons
                      name={hour < 12 ? "sunny-outline" : hour < 17 ? "partly-sunny-outline" : "moon-outline"}
                      size={16}
                      color="rgba(255,255,255,0.8)"
                    />
                    <Text style={styles.greeting}>{greeting}</Text>
                  </View>
                  <Text style={styles.name}>{child.name}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {/* star count badge: hidden for now
                <View style={styles.starBadgeHeader}>
                  <Ionicons name="star" size={17} color="#fbbf24" />
                  <Text style={styles.starBadgeHeaderText}>{child.stars ?? 0}</Text>
                </View>
                */}
                <LangBadge dark />
                <Pressable
                  onPress={onOpenMore}
                  style={styles.settingsBtn}
                  hitSlop={8}
                  accessibilityLabel="Settings and Menu"
                >
                  <Ionicons name="grid-outline" size={23} color="white" />
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.body, isTablet && styles.bodyTablet]}
          showsVerticalScrollIndicator={false}
        >
          {/* Start talking — the main thing a child comes here to do */}
          {/* Talk Board card (Start Talking): hidden for now */}
          {false && (
          <Pressable
            onPress={() => {
              tapFeedback();
              onTabChange("speak");
            }}
            style={({ pressed }) => [styles.heroCard, pressed && { transform: [{ scale: 0.99 }] }]}
            accessibilityLabel="Start talking"
          >
            <View style={styles.heroAccent} />
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={styles.heroKicker}>{tr("TALK BOARD", "لوحة الكلام", "بات چیت بورڈ")}</Text>
              <Text style={[styles.heroTitle, isTablet && { fontSize: 24, lineHeight: 31 }]}>
                {tr("What do you want to say today?", "ماذا تريد أن تقول اليوم؟", "آج آپ کیا کہنا چاہتے ہیں؟")}
              </Text>
              <View style={styles.heroBtn}>
                <Ionicons name="chatbubble-ellipses" size={18} color="#ffffff" />
                <Text style={styles.heroBtnText}>{tr("Start Talking", "ابدأ الكلام", "بات شروع کریں")}</Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" />
              </View>
            </View>
            <View style={[styles.heroPicBox, isTablet && styles.heroPicBoxTablet]}>
              {getPictogramUrl("talk") ? (
                <SmartImage source={{ uri: getPictogramUrl("talk")! }} style={styles.heroPic} />
              ) : (
                <Ionicons name="chatbubbles" size={48} color={colors.forest} />
              )}
            </View>
          </Pressable>
          )}

          {/* Little progress strip: hidden for now */}
          {false && <View style={styles.statsRow}>
            {STATS.map((st) => (
              <View key={st.icon} style={[styles.statCard, isTablet && styles.statCardTablet]}>
                <View style={[styles.statIcon, { backgroundColor: st.bg }]}>
                  <Ionicons name={st.icon} size={20} color={st.tint} />
                </View>
                <View style={{ flexShrink: 1 }}>
                  <Text style={styles.statValue}>{st.value}</Text>
                  <Text style={styles.statLabel} numberOfLines={2}>{st.label}</Text>
                </View>
              </View>
            ))}
          </View>}

          {/* Main categories: tap one to open it on the Talk board */}
          {categories.length > 0 && (
            <>
              <Text style={styles.catTitle}>{tr("Categories", "الفئات", "زمرے")}</Text>
              <View style={styles.catGrid}>
                {categories.map(({ tab, cat: c }) => {
                  const en = folderEnglishName(c).toLowerCase();
                  const home = homePictures[en === "actions" ? "verbs" : en];
                  const pic = home ? { uri: home } : folderPictureFor(c);
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => {
                        tapFeedback();
                        if (onOpenCategory) onOpenCategory(c.id);
                        else onTabChange("speak");
                      }}
                      style={({ pressed }) => [styles.catCard, isTablet && styles.catCardTablet, pressed && { transform: [{ scale: 0.97 }] }]}
                      accessibilityLabel={tab.name}
                    >
                      <View style={[styles.catPicBox, { backgroundColor: (c.color || colors.forest) + "18" }]}>
                        {pic.uri ? (
                          <SmartImage source={{ uri: pic.uri }} style={styles.catPic} />
                        ) : pic.text ? (
                          <Text style={[styles.catPicText, { color: c.color || colors.forest }]}>{pic.text}</Text>
                        ) : (
                          <Text style={{ fontSize: 34 }}>{tab.icon || "📁"}</Text>
                        )}
                      </View>
                      <Text style={[styles.catName, { color: c.color || colors.textDark }]} numberOfLines={2}>
                        {tab.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Main 5-Tab Navigation Bar: hidden on Home for now
      <TabBar active={tab} onChange={onTabChange} labels={labels} />
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.forest,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerInner: {
    width: "100%",
  },
  headerInnerTablet: {
    maxWidth: 860,
    alignSelf: "center",
  },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { color: "rgba(255,255,255,0.85)", fontSize: 16, fontWeight: "600" },
  name: { color: "white", fontSize: 28, fontWeight: "900", marginTop: 2 },
  settingsBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  starBadgeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  starBadgeHeaderText: { color: "white", fontSize: 16, fontWeight: "800" },

  body: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 28, gap: 14 },
  bodyTablet: { maxWidth: 860, alignSelf: "center", width: "100%", paddingHorizontal: 28 },

  /* Start Talking card */
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingVertical: 20,
    paddingLeft: 24,
    paddingRight: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e8edf2",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  heroAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 6, backgroundColor: colors.forest },
  heroKicker: { color: colors.forest, fontSize: 12, fontWeight: "900", letterSpacing: 1.2 },
  heroTitle: { color: colors.textDark, fontSize: 20, fontWeight: "900", lineHeight: 26 },
  heroBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.forest,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  heroBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  heroPicBox: {
    width: 96,
    height: 96,
    borderRadius: 22,
    backgroundColor: "#eef6f1",
    alignItems: "center",
    justifyContent: "center",
  },
  heroPicBoxTablet: { width: 124, height: 124, borderRadius: 26 },
  heroPic: { width: "78%", height: "78%" },

  /* stats strip */
  statsRow: { flexDirection: "row", gap: 12 },
  logoWrap: {
    width: 60, height: 60, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
  },
  catTitle: { fontSize: 18, fontWeight: "800", color: colors.textDark, marginTop: 18, marginBottom: 10 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catCard: {
    width: "31%", flexGrow: 1, maxWidth: "32%", minWidth: 96, backgroundColor: "#ffffff", borderRadius: 20,
    borderWidth: 1, borderColor: "#efe9e1", padding: 10, alignItems: "center", gap: 8,
    shadowColor: "#7a5c3e", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 2,
  },
  catCardTablet: { width: "18%", maxWidth: "19.2%" },
  catPicBox: { width: "100%", aspectRatio: 1.2, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  catPic: { width: "78%", height: "84%", resizeMode: "contain" },
  catPicText: { fontSize: 26, fontWeight: "800" },
  catName: { fontSize: 13, fontWeight: "800", textAlign: "center" },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e8edf2",
  },
  statCardTablet: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  statIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 22, fontWeight: "900", color: colors.textDark },
  statLabel: { fontSize: 12, fontWeight: "600", color: colors.textMid },
});
