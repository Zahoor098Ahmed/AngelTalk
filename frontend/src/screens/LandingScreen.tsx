import { useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions, ScrollView, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../context/SettingsContext";
import { applyLanguageDirection } from "../modules/i18n";
import { retranslateSeedBoard, setSeedLanguage } from "../modules/customCategories";
import Logo from "../components/Logo";
import { colors, radius } from "../theme";

interface Props {
  onGetStarted: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Slide {
  icon: keyof typeof Ionicons.glyphMap;
  title: { en: string; ar: string };
  subtitle: { en: string; ar: string };
}

const SLIDES: Slide[] = [
  {
    icon: "heart",
    title: { en: "Angel Talk", ar: "ملاك توك (Angel Talk)" },
    subtitle: {
      en: "A gentle, modern AAC communication companion for children with autism and speech delays — designed for families, built with love",
      ar: "رفيق تواصل لطيف وحديث للأطفال ذوي التوحد وتأخر النطق — مصمم للعائلات بكل حب",
    },
  },
  {
    icon: "flash",
    title: { en: "Whole Phrases & Tap-to-Talk", ar: "جمل كاملة وتحدث بنقرة واحدة" },
    subtitle: {
      en: "Supports Gestalt Language Processors (GLP) — one tap speaks full natural sentences like 'I want pizza' or 'Can I play iPad?'",
      ar: "يدعم معالجي اللغة الكلية — نقرة واحدة تنطق جملاً طبيعية كاملة مثل 'أريد بيتزا' أو 'هل يمكنني اللعب؟'",
    },
  },
  {
    icon: "sparkles",
    title: { en: "90-Second Personalized Board", ar: "لوحة مخصصة في 90 ثانية" },
    subtitle: {
      en: "Built around your child's favorite foods, real family, and toys — not just a generic starter board",
      ar: "مبنية حول أطعمة طفلك المفضلة، أفراد العائلة، وألعابه الحقيقية — وليست مجرد لوحة عامة",
    },
  },
  {
    icon: "book",
    title: { en: "Visual Social Stories", ar: "قصص اجتماعية بصرية" },
    subtitle: {
      en: "Illustrated step-by-step guides for dentist visits, haircuts, school routines, and emotional calming with read-aloud voice",
      ar: "إرشادات بصرية مصورة لزيارة طبيب الأسنان، الحلاقة، المدرسة، والهدوء النفسي مع نطق صوتي",
    },
  },
  {
    icon: "shield-checkmark",
    title: { en: "100% Private & Offline", ar: "خصوصية وأمان تام بدون إنترنت" },
    subtitle: {
      en: "Everything stays on your device — no subscriptions required, no data selling, completely safe",
      ar: "كل شيء يبقى على جهازك — بدون اشتراكات إجبارية، بدون بيع للبيانات، آمن تماماً",
    },
  },
];

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; en: string; ar: string }[] = [
  { icon: "chatbubbles", en: "AAC Board", ar: "لوحة تواصل" },
  { icon: "flash-outline", en: "Tap-to-Talk", ar: "نطق فوري" },
  { icon: "book-outline", en: "Social Stories", ar: "قصص بصرية" },
  { icon: "sparkles-outline", en: "90s Setup", ar: "إعداد سريع" },
];

// Muted, low-saturation blue/green palette — calmer and less overstimulating
// for autistic users than bright or high-contrast colors.
const SHAPES = [
  { size: 90, top: 20, left: -20, color: "rgba(255,255,255,0.06)" },
  { size: 60, top: 90, right: -10, color: "rgba(255,255,255,0.05)" },
  { size: 50, bottom: 210, left: -16, color: "rgba(255,255,255,0.05)" },
  { size: 34, bottom: 260, right: 30, color: "rgba(255,255,255,0.06)" },
];

export default function LandingScreen({ onGetStarted }: Props) {
  const { settings, update } = useSettings();
  const isEnglish = settings.language === "en-US";
  const [slideIdx, setSlideIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setSlideIdx(idx);
  }

  function selectLanguage(en: boolean) {
    const nextLang = en ? "en-US" : "ar-SA";
    update({ language: nextLang });
    setSeedLanguage(nextLang);
    retranslateSeedBoard(nextLang);
    applyLanguageDirection(nextLang);
  }

  function getStarted() {
    update({ language: settings.language, languageSelected: true });
    onGetStarted();
  }

  return (
    <View style={styles.container}>
      {SHAPES.map((s, i) => (
        <View
          key={i}
          style={[
            styles.shapeBase,
            {
              width: s.size,
              height: s.size,
              borderRadius: s.size / 2,
              top: s.top,
              bottom: s.bottom,
              left: s.left,
              right: s.right,
              backgroundColor: s.color,
            },
          ]}
        />
      ))}

      <SafeAreaView style={styles.safe}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          style={styles.carousel}
        >
          {SLIDES.map((slide, i) => (
            <View key={i} style={[styles.slide, { width: SCREEN_WIDTH }]}>
              {i === 0 ? (
                <Logo size={84} />
              ) : (
                <View style={styles.iconBox}>
                  <Ionicons name={slide.icon} size={30} color="white" />
                </View>
              )}
              <Text style={styles.title}>{isEnglish ? slide.title.en : slide.title.ar}</Text>
              <Text style={styles.subtitle}>{isEnglish ? slide.subtitle.en : slide.subtitle.ar}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === slideIdx && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.featureRow}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={16} color="white" />
              </View>
              <Text style={styles.featureLabel}>{isEnglish ? f.en : f.ar}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.trustText}>{isEnglish ? "Designed with input from parents & therapists" : "صُمم بالتعاون مع الأهل والمختصين"}</Text>

          <View style={styles.langRow}>
            <Pressable onPress={() => selectLanguage(true)} style={[styles.langBtn, isEnglish && styles.langBtnActive]}>
              <Text style={[styles.langText, isEnglish && styles.langTextActive]}>English</Text>
            </Pressable>
            <Pressable onPress={() => selectLanguage(false)} style={[styles.langBtn, !isEnglish && styles.langBtnActive]}>
              <Text style={[styles.langText, !isEnglish && styles.langTextActive]}>عربي</Text>
            </Pressable>
          </View>

          <Pressable onPress={getStarted} style={styles.getStartedBtn}>
            <Text style={styles.getStartedText}>{isEnglish ? "Get Started" : "ابدأ الآن"}</Text>
            <Ionicons name={isEnglish ? "arrow-forward" : "arrow-back"} size={18} color={colors.forest} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.forest, overflow: "hidden" },
  shapeBase: { position: "absolute" },
  safe: { flex: 1, paddingBottom: 20 },
  carousel: { flexGrow: 0, marginTop: 36 },
  slide: { alignItems: "center", justifyContent: "flex-start", paddingHorizontal: 36, height: 220 },
  iconBox: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: { color: "white", fontSize: 23, fontWeight: "800", textAlign: "center" },
  subtitle: { color: "rgba(255,255,255,0.78)", fontSize: 13.5, textAlign: "center", marginTop: 10, lineHeight: 20 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.3)" },
  dotActive: { backgroundColor: "white", width: 20 },
  featureRow: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 20, marginTop: 24 },
  featureItem: { alignItems: "center", gap: 6, width: 76 },
  featureIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  featureLabel: { color: "rgba(255,255,255,0.75)", fontSize: 10.5, textAlign: "center" },
  footer: { paddingHorizontal: 28, marginTop: "auto", gap: 14 },
  trustText: { color: "rgba(255,255,255,0.6)", fontSize: 11.5, textAlign: "center" },
  langRow: { flexDirection: "row", gap: 10, justifyContent: "center" },
  langBtn: { paddingVertical: 8, paddingHorizontal: 22, borderRadius: 20, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" },
  langBtnActive: { backgroundColor: "white", borderColor: "white" },
  langText: { color: "white", fontWeight: "700", fontSize: 13 },
  langTextActive: { color: colors.forest },
  getStartedBtn: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "white",
    borderRadius: radius,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  getStartedText: { color: colors.forest, fontWeight: "800", fontSize: 16 },
});
