import { useState } from "react";
import type { ReactNode } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet, ScrollView } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { SettingsProvider, useSettings } from "./src/context/SettingsContext";
import { t, isRTL } from "./src/modules/i18n";
import type { ChildProfile, TabScreen, LanguageCode } from "./src/types";
import { colors, radius } from "./src/theme";
import PinGate from "./src/components/PinGate";
import LangBadge from "./src/components/LangBadge";

import LandingScreen from "./src/screens/LandingScreen";
import FaceScanScreen from "./src/screens/FaceScanScreen";
import ParentSetupScreen from "./src/screens/ParentSetupScreen";
import EnrollChildScreen from "./src/screens/EnrollChildScreen";
import AccessibilityScreen from "./src/screens/AccessibilityScreen";
import HomeScreen from "./src/screens/HomeScreen";
import AACBoardScreen from "./src/screens/AACBoardScreen";
import VisualScheduleScreen from "./src/screens/VisualScheduleScreen";
import GamesScreen from "./src/screens/GamesScreen";
import ParentDashboardScreen from "./src/screens/ParentDashboardScreen";
import MyCategoriesScreen from "./src/screens/MyCategoriesScreen";
import CategoryBuilderScreen from "./src/screens/CategoryBuilderScreen";
import PhraseMatchLibraryScreen from "./src/screens/PhraseMatchLibraryScreen";
import ContentReviewQueueScreen from "./src/screens/ContentReviewQueueScreen";
import VoiceCommandMatchScreen from "./src/screens/VoiceCommandMatchScreen";
import QuickOnboardingScreen from "./src/screens/QuickOnboardingScreen";
import SocialStoriesScreen from "./src/screens/SocialStoriesScreen";

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
  | "accessibility";

const TAB_LABEL: Record<TabScreen, string> = {
  home: "Home",
  speak: "Talk",
  schedule: "Schedule",
  games: "Games",
  progress: "Progress",
};

function AppInner() {
  const { ready, settings } = useSettings();
  const [screen, setScreen] = useState<Screen>("face-scan");
  const [currentTab, setCurrentTab] = useState<TabScreen>("home");
  const [currentChild, setCurrentChild] = useState<ChildProfile | null>(null);
  const [categoryReturnScreen, setCategoryReturnScreen] = useState<"speak" | "more">("more");
  const [categoryInitialId, setCategoryInitialId] = useState<string | null>(null);
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

  if (!ready) {
    body = (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.forest} />
      </View>
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
          onTabChange={(t) => setCurrentTab(t)}
          onOpenMore={() => go("more")}
          onOpenSocialStories={() => go("social-stories")}
          labels={tabLabels}
        />
      );
    } else if (currentTab === "speak") {
      body = (
        <AACBoardScreen
          child={currentChild}
          tab={currentTab}
          onTabChange={(t) => setCurrentTab(t)}
          labels={tabLabels}
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
  const isRtl = isRTL(lang);

  const tabShortcuts: { tab: TabScreen; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
    { tab: "home", label: t("homeHub", lang), icon: "home", color: colors.forest },
    { tab: "speak", label: t("aacTalkBoard", lang), icon: "chatbubble-ellipses", color: "#0284c7" },
    { tab: "schedule", label: t("dailyRoutineSchedule", lang), icon: "calendar", color: "#d97706" },
    { tab: "games", label: t("speechLearningGames", lang), icon: "game-controller", color: "#059669" },
    { tab: "progress", label: t("doctorProgressReports", lang), icon: "stats-chart", color: "#7c3aed" },
  ];

  const adminRows: { key: Screen; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; desc: string }[] = [
    { key: "social-stories", label: t("visualSocialStoriesTitle", lang), icon: "book", color: "#f59e0b", desc: t("visualSocialStoriesDesc", lang) },
    { key: "enroll-child", label: t("addChildProfileTitle", lang), icon: "person-add", color: colors.forest, desc: t("addChildProfileDesc", lang) },
    { key: "my-categories", label: t("myCategoriesWordsTitle", lang), icon: "folder-open", color: "#10b981", desc: t("myCategoriesWordsDesc", lang) },
    { key: "category-builder", label: t("categoryBuilderGenTitle", lang), icon: "sparkles-outline", color: "#0ea5e9", desc: t("categoryBuilderGenDesc", lang) },
    { key: "voice-command", label: t("voiceCommandMatchTitle", lang), icon: "mic-circle", color: "#6366f1", desc: t("voiceCommandMatchDesc", lang) },
    { key: "phrase-library", label: t("phraseLibraryTitle", lang), icon: "chatbubble-ellipses", color: "#8b5cf6", desc: t("phraseLibraryDesc", lang) },
    { key: "review-queue", label: t("contentReviewQueueTitle", lang), icon: "checkmark-done-circle", color: "#f59e0b", desc: t("contentReviewQueueDesc", lang) },
    { key: "parent-setup", label: t("parentPortalAddTitle", lang), icon: "people", color: "#ec4899", desc: t("parentPortalAddDesc", lang) },
    { key: "accessibility", label: t("settingsAccessibilityTitle", lang), icon: "settings", color: "#64748b", desc: t("settingsAccessibilityDesc", lang) },
    { key: "face-scan", label: t("switchChildFaceTitle", lang), icon: "scan-circle", color: colors.forest, desc: t("switchChildFaceDesc", lang) },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={[styles.moreHeader, isRtl && { flexDirection: "row-reverse" }]}>
          <Pressable onPress={onBack} hitSlop={8} style={{ padding: 4 }}>
            <Ionicons name={isRtl ? "arrow-forward" : "arrow-back"} size={22} color={colors.textDark} />
          </Pressable>
          <View style={{ alignItems: "center" }}>
            <Text style={styles.moreTitle}>{t("hubTitle", lang)}</Text>
            {childName ? (
              <Text style={{ fontSize: 12, color: colors.textMid, fontWeight: "600" }}>
                {t("activeChildLabel", lang).replace("{name}", childName)}
              </Text>
            ) : null}
          </View>
          <LangBadge />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
          {/* Main App Tabs */}
          <Text style={[styles.menuSectionHeader, isRtl && { textAlign: "right" }]}>
            {t("mainAppsSection", lang)}
          </Text>
          <View style={{ gap: 8 }}>
            {tabShortcuts.map((t) => (
              <Pressable
                key={t.tab}
                onPress={() => onSelectTab(t.tab)}
                style={[styles.moreRow, isRtl && { flexDirection: "row-reverse" }]}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: `${t.color}15`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name={t.icon} size={20} color={t.color} />
                </View>
                <Text style={[styles.moreRowText, isRtl && { textAlign: "right" }]}>{t.label}</Text>
                <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={18} color={colors.textLight} />
              </Pressable>
            ))}
          </View>

          {/* Management & Settings */}
          <Text style={[styles.menuSectionHeader, { marginTop: 8 }, isRtl && { textAlign: "right" }]}>
            {t("parentClinicalToolsSection", lang)}
          </Text>
          <View style={{ gap: 8 }}>
            {adminRows.map((r) => (
              <Pressable
                key={r.key}
                onPress={() => onNavigate(r.key)}
                style={[styles.moreRow, isRtl && { flexDirection: "row-reverse" }]}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: `${r.color}15`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name={r.icon} size={20} color={r.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.moreRowText, isRtl && { textAlign: "right" }]}>{r.label}</Text>
                  <Text style={[{ fontSize: 12, color: colors.textMid, marginTop: 2 }, isRtl && { textAlign: "right" }]}>
                    {r.desc}
                  </Text>
                </View>
                <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={18} color={colors.textLight} />
              </Pressable>
            ))}
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
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  moreHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  moreTitle: { fontSize: 18, fontWeight: "800", color: colors.textDark },
  menuSectionHeader: { fontSize: 11, fontWeight: "800", color: colors.textLight, letterSpacing: 0.8 },
  moreRow: {
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
  moreRowText: { flex: 1, fontSize: 14.5, fontWeight: "700", color: colors.textDark },
});
