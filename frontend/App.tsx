import { useState, useEffect } from "react";
import { Asset } from "expo-asset";
import type { ReactNode } from "react";
import { View, Pressable, ActivityIndicator, StyleSheet, ScrollView, Platform, useWindowDimensions } from "react-native";
import Text from "./src/components/AppText";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { SettingsProvider, useSettings } from "./src/context/SettingsContext";
import { t, isRTL } from "./src/modules/i18n";
import type { ChildProfile, TabScreen, LanguageCode } from "./src/types";
import { colors, radius } from "./src/theme";
import PinGate from "./src/components/PinGate";
import LangBadge from "./src/components/LangBadge";
import Logo from "./src/components/Logo";

import LandingScreen from "./src/screens/LandingScreen";
import FaceScanScreen from "./src/screens/FaceScanScreen";
import HomeScreen from "./src/screens/HomeScreen";
import FaceAIHost from "./src/components/FaceAIHost";
import ParentSetupScreen from "./src/screens/ParentSetupScreen";
import EnrollChildScreen from "./src/screens/EnrollChildScreen";
import AccessibilityScreen from "./src/screens/AccessibilityScreen";
import AACBoardScreen from "./src/screens/AACBoardScreen";
import VisualScheduleScreen from "./src/screens/VisualScheduleScreen";
import GamesScreen from "./src/screens/GamesScreen";
import ParentDashboardScreen from "./src/screens/ParentDashboardScreen";
import MyCategoriesScreen from "./src/screens/MyCategoriesScreen";
import CategoryBuilderScreen from "./src/screens/CategoryBuilderScreen";
import PhraseMatchLibraryScreen from "./src/screens/PhraseMatchLibraryScreen";
import ContentReviewQueueScreen from "./src/screens/ContentReviewQueueScreen";
import VoiceCommandMatchScreen from "./src/screens/VoiceCommandMatchScreen";
import SocialStoriesScreen from "./src/screens/SocialStoriesScreen";
import { startAutomaticBackups } from "./src/modules/automaticBackup";
import { startCloudConnect } from "./src/modules/cloudConnect";
import { ensureCategoriesLoaded } from "./src/modules/customCategories";

// web: no browser focus outline (black box) around text boxes; every app box already shows its own border
// Use the bundled asset's hashed URL so localhost tabs do not retain an older cached icon.
if (Platform.OS === "web" && typeof document !== "undefined") {
  const href = Asset.fromModule(require("./assets/favicon.png")).uri;
  for (const rel of ["icon", "shortcut icon", "apple-touch-icon"]) {
    const link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`) ?? document.createElement("link");
    link.rel = rel;
    link.type = "image/png";
    link.href = href;
    if (!link.parentNode) document.head.appendChild(link);
  }
}
if (Platform.OS === "web" && typeof document !== "undefined" && !document.getElementById("no-focus-outline")) {
  const s = document.createElement("style");
  s.id = "no-focus-outline";
  s.textContent = "input:focus, textarea:focus, input:focus-visible, textarea:focus-visible { outline: none !important; box-shadow: none !important; }";
  document.head.appendChild(s);
}

type Screen =
  | "landing"
  | "onboarding-quick"
  | "face-scan"
  | "parent-setup"
  | "enroll-child"
  | "main"
  | "more"
  | "social-stories"
  | "my-categories"
  | "category-builder"
  | "phrase-library"
  | "review-queue"
  | "voice-command"
  | "accessibility"
  | "pin-progress"
  | "pin-face";

const TAB_LABEL: Record<TabScreen, string> = {
  home: "Home",
  speak: "Talk",
  schedule: "Schedule",
  games: "Games",
  progress: "Progress",
};

function AppInner() {
  const { ready, settings } = useSettings();
  const { width, height } = useWindowDimensions();
  const [introDone, setIntroDone] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIntroDone(true), 3000);
    return () => clearTimeout(timer);
  }, []);
  // Connect to the Angel Talk server / admin panel in the background once local data is loaded
  useEffect(() => {
    if (ready) {
      void ensureCategoriesLoaded().catch((error) => console.warn("Unable to preload Talk categories", error));
      startCloudConnect();
      startAutomaticBackups();
    }
  }, [ready]);

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined" && document.head) {
      let meta = document.querySelector('meta[name="referrer"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "referrer");
        meta.setAttribute("content", "no-referrer");
        document.head.appendChild(meta);
      }
    }
  }, []);
  const [screen, setScreen] = useState<Screen>("face-scan");
  const [currentTab, setCurrentTab] = useState<TabScreen>("home");
  const [currentChild, setCurrentChild] = useState<ChildProfile | null>(null);
  const [categoryReturnScreen, setCategoryReturnScreen] = useState<"speak" | "more">("more");
  const [categoryInitialId, setCategoryInitialId] = useState<string | null>(null);
  // the category picked on the Home screen; the Talk board opens inside it
  const [talkCategoryId, setTalkCategoryId] = useState<string | null>(null);
  const [enrollReturnScreen, setEnrollReturnScreen] = useState<Screen>("face-scan");
  const lang = settings.language;
  const tabLabels: Record<TabScreen, string> = {
    home: t("home", lang),
    speak: t("talk", lang),
    schedule: t("schedule", lang),
    games: t("games", lang),
    progress: t("progress", lang),
  };
  const go = (s: Screen) => setScreen(s);

  let body: ReactNode;

  if (!introDone || !ready) {
    body = (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FDF8E4", alignItems: "center", justifyContent: "center" }}>
        <View accessible accessibilityLabel="Angel Talk">
          <Logo size={Math.min(320, width * 0.8, height * 0.7)} />
        </View>
        <View style={{ alignItems: "center", marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: "#E5F3EC", borderWidth: 1, borderColor: "#C7E5D8" }}>
          <Text style={{ color: "#36635A", fontSize: 11, fontWeight: "700", letterSpacing: 1.6 }}>PRESENTED BY</Text>
          <Text style={{ color: "#075E55", fontSize: 19, fontWeight: "800", textAlign: "center" }}>Hope Bridge Digital</Text>
        </View>
        {introDone && <ActivityIndicator size="small" color={colors.forest} />}
      </SafeAreaView>
    );
  } else if (screen === "landing") {
    body = <LandingScreen onGetStarted={() => go("face-scan")} />;
  /* Commented out per user request (Onboarding steps 1, 2, 3)
  } else if (screen === "onboarding-quick") {
    body = (
      <QuickOnboardingScreen
        onComplete={(child) => {
          setCurrentChild(child);
          setCurrentTab("speak");
          go("main");
        }}
        onSkipToNormal={() => go("face-scan")}
      />
    );
  */
  } else if (screen === "face-scan") {
    body = (
      <FaceScanScreen
        onMatch={(child) => {
          setCurrentChild(child);
          setCurrentTab("home");
          go("main");
        }}
        onNoMatch={() => go("parent-setup")}
        onParentArea={() => go("parent-setup")}
        onEnrollChild={() => {
          setEnrollReturnScreen("face-scan");
          go("enroll-child");
        }}
      />
    );
  } else if (screen === "parent-setup") {
    body = (
      <ParentSetupScreen
        onNavigate={(s) => {
          if (s === "enroll-child") {
            setEnrollReturnScreen("parent-setup");
            go("enroll-child");
            return;
          }
          go(
            s === "my-categories"
              ? "my-categories"
              : s === "phrase-library"
              ? "phrase-library"
              : s === "review-queue"
              ? "review-queue"
              : s === "accessibility"
              ? "accessibility"
              : "face-scan"
          );
        }}
        onBack={() => go(currentChild ? "main" : "face-scan")}
      />
    );
  } else if (screen === "enroll-child") {
    body = (
      <EnrollChildScreen
        onDone={(child) => {
          if (child) {
            setCurrentChild(child);
            setCurrentTab("home");
            go("main");
          } else {
            go(enrollReturnScreen);
          }
        }}
        onBack={() => go(enrollReturnScreen)}
      />
    );
  } else if (screen === "main" && currentChild) {
    // 5 Main Working Tabs
    if (currentTab === "home") {
      body = (
        <HomeScreen
          child={currentChild}
          tab={currentTab}
          onTabChange={(t) => { setTalkCategoryId(null); setCurrentTab(t); }}
          onOpenMore={() => go("more")}
          onOpenSocialStories={() => go("social-stories")}
          onUpdateChild={setCurrentChild}
          labels={tabLabels}
          onOpenCategory={(catId) => {
            setTalkCategoryId(catId);
            setCurrentTab("speak");
          }}
        />
      );
    } else if (currentTab === "speak") {
      body = (
        <AACBoardScreen
          child={currentChild}
          tab={currentTab}
          onTabChange={(t) => setCurrentTab(t)}
          labels={tabLabels}
          initialCategoryId={talkCategoryId}
          onOpenCategories={(catId) => {
            setCategoryReturnScreen("speak");
            setCategoryInitialId(catId ?? null);
            go("my-categories");
          }}
        />
      );
    } else if (currentTab === "schedule") {
      body = (
        <VisualScheduleScreen
          child={currentChild}
          tab={currentTab}
          onTabChange={(t) => setCurrentTab(t)}
          labels={tabLabels}
        />
      );
    } else if (currentTab === "games") {
      body = (
        <GamesScreen
          child={currentChild}
          tab={currentTab}
          onTabChange={(t) => setCurrentTab(t)}
          onUpdateChild={setCurrentChild}
          labels={tabLabels}
        />
      );
    } else {
      body = (
        <ParentDashboardScreen
          child={currentChild}
          tab={currentTab}
          onTabChange={(t) => setCurrentTab(t)}
          onUpdateChild={setCurrentChild}
          labels={tabLabels}
        />
      );
    }
  } else if (screen === "social-stories") {
    body = <SocialStoriesScreen onBack={() => go(currentChild ? "main" : "more")} />;
  } else if (screen === "more") {
    body = (
      <MoreMenu
        childName={currentChild?.name}
        lang={lang}
        onSelectTab={(t) => {
          // Doctor & Progress Reports asks for the parent password first, like Settings
          if (t === "progress") return go("pin-progress");
          setCurrentTab(t);
          go("main");
        }}
        onNavigate={(targetScreen) => {
          if (targetScreen === "my-categories") {
            setCategoryReturnScreen("more");
            setCategoryInitialId(null);
          }
          if (targetScreen === "enroll-child") {
            setEnrollReturnScreen("more");
          }
          // Switch Child / Face Login asks for the parent password first, like Settings
          if (targetScreen === "face-scan") return go("pin-face");
          go(targetScreen);
        }}
        onBack={() => go(currentChild ? "main" : "face-scan")}
      />
    );
  } else if (screen === "my-categories") {
    const handleCategoryBack = () => {
      if (categoryReturnScreen === "speak") {
        setCurrentTab("speak");
        go("main");
      } else {
        go("more");
      }
    };
    body = (
      <PinGate title={t("pgBoardEditorTitle", lang)} onCancel={handleCategoryBack}>
        <MyCategoriesScreen
          initialCategoryId={categoryInitialId ?? undefined}
          onBack={handleCategoryBack}
          onCreate={() => go("category-builder")}
        />
      </PinGate>
    );
  } else if (screen === "category-builder") {
    body = (
      <PinGate title={t("pgBoardEditorTitle", lang)} onCancel={() => go("more")}>
        <CategoryBuilderScreen onBack={() => go("more")} onSaved={() => go("my-categories")} />
      </PinGate>
    );
  } else if (screen === "phrase-library") {
    body = (
      <PinGate title={t("rowPhraseLibrary", lang)} onCancel={() => go("more")}>
        <PhraseMatchLibraryScreen onBack={() => go("more")} />
      </PinGate>
    );
  } else if (screen === "review-queue") {
    body = (
      <PinGate title={t("rowContentReviewQueue", lang)} onCancel={() => go("more")}>
        <ContentReviewQueueScreen onBack={() => go("more")} />
      </PinGate>
    );
  } else if (screen === "voice-command") {
    body = <VoiceCommandMatchScreen onBack={() => go("more")} />;
  } else if (screen === "pin-progress") {
    body = (
      <PinGate title={t("doctorProgressReports", lang)} onCancel={() => go("more")}>
        <AfterPin
          run={() => {
            setCurrentTab("progress");
            go("main");
          }}
        />
      </PinGate>
    );
  } else if (screen === "pin-face") {
    body = (
      <PinGate title={t("switchChildFaceTitle", lang)} onCancel={() => go("more")}>
        <AfterPin run={() => go("face-scan")} />
      </PinGate>
    );
  } else if (screen === "accessibility") {
    body = (
      <PinGate title={t("settings", lang)} onCancel={() => go("more")}>
        <AccessibilityScreen onBack={() => go("more")} />
      </PinGate>
    );
  } else {
    body = (
      <FaceScanScreen
        onMatch={(child) => {
          setCurrentChild(child);
          setCurrentTab("home");
          go("main");
        }}
        onNoMatch={() => go("parent-setup")}
        onParentArea={() => go("parent-setup")}
        onEnrollChild={() => go("enroll-child")}
      />
    );
  }

  return <View style={{ flex: 1 }}>{body}</View>;
}

/** Runs once the password gate opens (then the app moves on to the screen behind it). */
function AfterPin({ run }: { run: () => void }) {
  useEffect(() => {
    run();
  }, []);
  return null;
}

function MoreMenu({
  childName,
  lang,
  onSelectTab,
  onNavigate,
  onBack,
}: {
  childName?: string;
  lang: LanguageCode;
  onSelectTab: (t: TabScreen) => void;
  onNavigate: (s: Screen) => void;
  onBack: () => void;
}) {
  // Layout never mirrors for Arabic/Urdu — only text changes
  const isRtl = false && isRTL(lang);
  const rightAlignedText = isRTL(lang) && styles.moreRtlText;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 560;
  const englishTitle = t("hubTitle", "en-US");
  const localizedTitle = t("hubTitle", lang).replace(` (${englishTitle})`, "");

  const tabShortcuts: { tab: TabScreen; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
    // Home Hub and AAC Talk Board: hidden for now (Home opens the Talk board itself)
    // { tab: "home", label: t("homeHub", lang), icon: "home", color: colors.forest },
    // { tab: "speak", label: t("aacTalkBoard", lang), icon: "chatbubble-ellipses", color: "#0284c7" },
    { tab: "progress", label: t("doctorProgressReports", lang), icon: "stats-chart", color: "#7c3aed" },
  ];

  const adminRows: { key: Screen; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; desc: string }[] = [
    { key: "my-categories", label: t("myCategoriesWordsTitle", lang), icon: "folder-open", color: "#10b981", desc: t("myCategoriesWordsDesc", lang) },
    { key: "accessibility", label: t("settingsAccessibilityTitle", lang), icon: "settings", color: "#64748b", desc: t("settingsAccessibilityDesc", lang) },
    { key: "face-scan", label: t("switchChildFaceTitle", lang), icon: "scan-circle", color: colors.forest, desc: t("switchChildFaceDesc", lang) },
  ];

  return (
    <View style={styles.moreShell}>
      <SafeAreaView style={styles.moreShell} edges={["top"]}>
        <View style={[styles.moreHeader, compact && styles.moreHeaderCompact, isRtl && { flexDirection: "row-reverse" }]}>
          <Pressable onPress={onBack} hitSlop={8} style={{ padding: 4 }}>
            <Ionicons name={isRtl ? "arrow-forward" : "arrow-back"} size={22} color={colors.textDark} />
          </Pressable>
          <View style={styles.moreHeaderText}>
            <Text style={[styles.moreTitle, compact && styles.moreTitleCompact]}>{localizedTitle}</Text>
            {localizedTitle !== englishTitle && <Text style={styles.moreEnglishTitle}>{englishTitle}</Text>}
            {childName ? (
              <Text style={styles.moreChildName}>
                {t("activeChildLabel", lang).replace("{name}", childName)}
              </Text>
            ) : null}
          </View>
          <LangBadge />
        </View>

        <ScrollView style={styles.moreScroll} contentContainerStyle={{ paddingVertical: 12 }}>
          <View style={[styles.moreMenuContent, { marginHorizontal: compact ? 12 : 16, paddingBottom: 12 + insets.bottom }]}>
            {/* Main App Tabs */}
            <Text style={[styles.menuSectionHeader, rightAlignedText]}>
              {t("mainAppsSection", lang)}
            </Text>
            <View style={{ gap: 8 }}>
              {tabShortcuts.map((t) => (
                <Pressable
                  key={t.tab}
                  onPress={() => onSelectTab(t.tab)}
                  style={[styles.moreRow, compact && styles.moreRowCompact, isRtl && { flexDirection: "row-reverse" }]}
                >
                  <View
                    style={{
                      width: compact ? 44 : 52,
                      height: compact ? 44 : 52,
                      borderRadius: 16,
                      backgroundColor: `${t.color}15`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name={t.icon} size={27} color={t.color} />
                  </View>
                  <Text style={[styles.moreRowText, styles.moreRowContent, rightAlignedText]}>{t.label}</Text>
                  <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={22} color={colors.textLight} />
                </Pressable>
              ))}
            </View>

            {/* Management & Settings */}
            <Text style={[styles.menuSectionHeader, { marginTop: 8 }, rightAlignedText]}>
              {t("parentClinicalToolsSection", lang)}
            </Text>
            <View style={{ gap: 8 }}>
              {adminRows.map((r) => (
                <Pressable
                  key={r.key}
                  onPress={() => onNavigate(r.key)}
                  style={[styles.moreRow, compact && styles.moreRowCompact, isRtl && { flexDirection: "row-reverse" }]}
                >
                  <View
                    style={{
                      width: compact ? 44 : 52,
                      height: compact ? 44 : 52,
                      borderRadius: 16,
                      backgroundColor: `${r.color}15`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name={r.icon} size={27} color={r.color} />
                  </View>
                  <View style={styles.moreRowContent}>
                    <Text style={[styles.moreRowText, rightAlignedText]}>{r.label}</Text>
                    <Text style={[{ fontSize: 14, color: colors.textMid, marginTop: 3 }, rightAlignedText]}>
                      {r.desc}
                    </Text>
                  </View>
                  <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={22} color={colors.textLight} />
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <StatusBar style="dark" />
        <AppInner />
        <FaceAIHost />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  moreShell: { flex: 1, minWidth: 0, alignSelf: "stretch", backgroundColor: colors.bg },
  moreHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  moreHeaderCompact: { marginHorizontal: 10, gap: 6 },
  moreHeaderText: { flex: 1, minWidth: 0, paddingHorizontal: 4 },
  moreTitle: { fontSize: 21, fontWeight: "800", color: colors.textDark, textAlign: "center" },
  moreTitleCompact: { fontSize: 17 },
  moreEnglishTitle: { fontSize: 12, fontWeight: "700", color: colors.textMid, textAlign: "center" },
  moreChildName: { fontSize: 12, color: colors.textMid, fontWeight: "600", textAlign: "center" },
  moreScroll: { flex: 1, alignSelf: "stretch", minWidth: 0 },
  moreMenuContent: { minWidth: 0, gap: 14 },
  moreRtlText: { textAlign: "right" },
  menuSectionHeader: { fontSize: 13, fontWeight: "800", color: colors.textLight, letterSpacing: 0.8 },
  moreRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  moreRowCompact: { gap: 8, paddingHorizontal: 10 },
  moreRowContent: { flex: 1, minWidth: 0 },
  moreRowText: { fontSize: 17, fontWeight: "700", color: colors.textDark },
});
