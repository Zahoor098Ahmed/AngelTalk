import { useEffect, useRef, useState, type ComponentRef } from "react";
import { View, Pressable, StyleSheet, ScrollView, Alert, Share, Modal, Platform, useWindowDimensions } from "react-native";
import Text from "../components/AppText";
import TextInput from "../components/AppTextInput";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSettings } from "../context/SettingsContext";
import { LANGUAGES, t, applyLanguageDirection } from "../modules/i18n";
import { ALL_VERB_FORMS, ALL_NOUN_FORMS, type LanguageCode, type NounFormKey, type VerbFormKey } from "../types";
import { loadPasscode, hasPasscode, setPasscode, clearPasscode, checkPasscode } from "../modules/passcode";
import { buildBackup, ensureCategoriesLoaded, restoreBackup, retranslateSeedBoard, setSeedLanguage, bottomTabCategories, getCategory, categoryPictureFor } from "../modules/customCategories";
import { playWord } from "../modules/audio";
import { colors, radius } from "../theme";
import { Ionicons } from "@expo/vector-icons";
import SmartImage from "../components/SmartImage";
import BackupSettings from "../components/BackupSettings";

interface Props {
  onBack: () => void;
}

/** Settings offers the two languages the app is made for. */
const SETTINGS_LANGUAGES = LANGUAGES.filter((l) => l.code === "en-US" || l.code === "ar-SA");
/** 0 = automatic (fits the screen). */
const TILES_PER_ROW = [0, 1, 2, 3, 4, 5, 6, 7];
/** Home page categories per row; 0 = automatic. */
const HOME_PER_ROW = [0, 2, 3, 4, 5, 6, 7];
/** Colours a parent can give a category name on the Home page. */
const NAME_COLORS = ["#1F2937", "#0F766E", "#2563EB", "#7C3AED", "#DB2777", "#DC2626", "#EA580C", "#CA8A04", "#16A34A", "#0891B2", "#6B7280", "#92400E"];
const RATES: { key: "setSlow" | "setNormal" | "setFast"; value: number }[] = [
  { key: "setSlow", value: 0.6 },
  { key: "setNormal", value: 0.9 },
  { key: "setFast", value: 1.3 },
];

export default function AccessibilityScreen({ onBack }: Props) {
  const { settings, update } = useSettings();
  const lang = settings.language;
  const closestRate = RATES.reduce((best, r) => (Math.abs(r.value - settings.speechRate) < Math.abs(best - settings.speechRate) ? r.value : best), RATES[1].value);

  const [pinSet, setPinSet] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinCurrent, setPinCurrent] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const ar = lang === "ar-SA";
  const [importModal, setImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const [colorCats, setColorCats] = useState<{ id: string; name: string; color?: string }[]>([]);
  const [colorOpen, setColorOpen] = useState<string | null>(null);
  const [colorModal, setColorModal] = useState(false);
  const win = useWindowDimensions();
  /** phone-size screen: tighter picker */
  const cmSmall = win.width < 560;
  const cmScroll = useRef<ComponentRef<typeof ScrollView>>(null);
  /** pick a category: show its colours at the top right away */
  function pickColorCat(id: string) {
    setColorOpen(id);
    cmScroll.current?.scrollTo({ y: 0, animated: true });
  }
  const [colorSearch, setColorSearch] = useState("");
  useEffect(() => {
    ensureCategoriesLoaded().then(() =>
      setColorCats(
        bottomTabCategories(lang)
          .map((x) => ({ x, c: getCategory(x.id) }))
          .filter((y) => y.c && !y.c.hidden)
          .map(({ x, c }) => ({ id: c!.id, name: x.name, color: c!.color })),
      ),
    );
  }, [lang]);
  function setNameColor(id: string, color?: string) {
    const next = { ...(settings.categoryNameColors || {}) };
    if (color) next[id] = color;
    else delete next[id];
    update({ categoryNameColors: next });
  }

  useEffect(() => {
    loadPasscode().then(() => setPinSet(hasPasscode()));
  }, []);

  function openPin() {
    setPinCurrent("");
    setPinValue("");
    setPinConfirm("");
    setPinError(null);
    setPinModal(true);
  }

  /** Changing the parent password needs the current one first, then the new one twice. */
  async function savePin() {
    if (pinSet && !checkPasscode(pinCurrent)) return setPinError(ar ? "كلمة المرور الحالية غير صحيحة." : "The current password is not correct.");
    if (!/^\d{4}$/.test(pinValue)) return setPinError(t("accPasscodeInvalid", lang));
    if (pinValue !== pinConfirm) return setPinError(ar ? "كلمتا المرور الجديدتان غير متطابقتين." : "The two new passwords do not match.");
    await setPasscode(pinValue);
    setPinSet(true);
    setPinModal(false);
    setNotice({ title: t("accPasscodeModalTitle", lang), message: ar ? "تم حفظ كلمة المرور الجديدة." : "The new password is saved." });
  }

  async function removePin() {
    if (!checkPasscode(pinCurrent)) return setPinError(ar ? "أدخل كلمة المرور الحالية أولاً." : "Enter the current password first.");
    await clearPasscode();
    setPinSet(false);
    setPinModal(false);
    setNotice({ title: t("accPasscodeModalTitle", lang), message: ar ? "تمت إزالة كلمة المرور." : "The password is removed. Settings open without a password now." });
  }

  async function exportBoard() {
    await ensureCategoriesLoaded();
    const b = buildBackup();
    if (b.categoryCount === 0) return setNotice({ title: "Backup", message: t("accNothingToBackup", lang) });
    const json = JSON.stringify(b);
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `angel-talk-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    }
    try {
      await Share.share({ title: "Angel Talk board backup", message: json });
    } catch {
      /* dismissed */
    }
  }

  function runImport() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(importText);
    } catch {
      return setNotice({ title: "Import Error", message: t("accInvalidBackupText", lang) });
    }
    const r = restoreBackup(parsed, "replace");
    setImportModal(false);
    setImportText("");
    setNotice({
      title: r.ok ? t("accRestoreCompleteTitle", lang) : t("accRestoreWarningsTitle", lang),
      message:
        t("accRestoreSummary", lang)
          .replace("{cats}", String(r.restoredCategories))
          .replace("{words}", String(r.restoredWords))
          .replace("{images}", String(r.restoredImages)) +
        (r.issues.length ? `\n\n${r.issues.join("\n")}` : ""),
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← {t("back", lang)}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{t("settings", lang)}</Text>
        </View>

        <ScrollView contentContainerStyle={[styles.body, win.width < 375 && styles.bodyCompact]}>
          {/* ---- speech & natural voices ---- */}
          <Text style={styles.sectionTitle}>{lang === "ar-SA" ? "الصوت" : "Voice"}</Text>
          
          <Text style={styles.subLabel}>{t("setSpeakingSpeed", lang)}</Text>
          <View style={styles.segRow}>
            {RATES.map((r) => (
              <Pressable
                key={r.key}
                onPress={() => {
                  update({ speechRate: r.value });
                  void playWord({ label: lang === "ar-SA" ? "أريد أن ألعب" : "I want to play", useTextToSpeech: true }, lang, r.value, settings.voiceType || "boy");
                }}
                style={[styles.seg, closestRate === r.value && styles.segOn]}
              >
                <Text style={[styles.segText, closestRate === r.value && { color: "white" }]}>{t(r.key, lang)}</Text>
              </Pressable>
            ))}
          </View>

          {/* ---- board & GLP mode ---- */}
          <Text style={styles.sectionTitle}>{lang === "ar-SA" ? "حجم النص" : "App text size"}</Text>
          <Text style={styles.subLabel}>{lang === "ar-SA" ? "غيّر حجم أسماء الكلمات والقوائم والنصوص في التطبيق." : "Choose the size of words, menus and reading text across the app."}</Text>
          <View style={[styles.segRow, { flexWrap: "wrap" }]}>
            {([
              { value: "small", label: lang === "ar-SA" ? "صغير" : "Small" },
              { value: "medium", label: lang === "ar-SA" ? "متوسط" : "Medium" },
              { value: "large", label: lang === "ar-SA" ? "كبير" : "Large" },
              { value: "xlarge", label: lang === "ar-SA" ? "أكبر" : "Extra large" },
            ] as const).map(({ value, label }) => (
              <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: settings.fontSize === value }} onPress={() => update({ fontSize: value })} style={[styles.seg, settings.fontSize === value && styles.segOn]}>
                <Text style={[styles.segText, settings.fontSize === value && { color: "white" }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.sectionTitle}>{lang === "ar-SA" ? "لوحة الكلام" : "Talk board"}</Text>
          <Text style={styles.subLabel}>{t("setTilesPerRow", lang)}</Text>
          <View style={styles.segRow}>
            {TILES_PER_ROW.map((n) => {
              const on = (settings.tilesPerRow ?? 0) === n;
              return (
                <Pressable key={n} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => update({ tilesPerRow: n })} style={[styles.seg, on && styles.segOn]}>
                  <Text style={[styles.segText, on && { color: "white" }]}>{n === 0 ? (lang === "ar-SA" ? "تلقائي" : "Auto") : n}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* ---- Home page: category name colours (opens a searchable picker, so a long list stays short here) ---- */}
          <Text style={styles.sectionTitle}>{ar ? "ألوان أسماء الفئات" : "Category name colours"}</Text>
          <Pressable onPress={() => { setColorSearch(""); setColorOpen(null); setColorModal(true); }} style={styles.colorEntry}>
            <View style={{ flex: 1 }}>
              <Text style={styles.colorEntryTitle}>{ar ? "تغيير لون أسماء الفئات" : "Change category name colours"}</Text>
              <Text style={styles.colorState}>
                {(Object.keys(settings.categoryNameColors || {}).length) === 0 ? (ar ? "كل الأسماء بلونها الافتراضي" : "All names use their default colour") : ar ? `${(Object.keys(settings.categoryNameColors || {}).length)} فئة بلون مخصص` : `${(Object.keys(settings.categoryNameColors || {}).length)} with a custom colour`}
              </Text>
            </View>
            <Text style={styles.colorEntryArrow}>›</Text>
          </Pressable>

          {/* ---- Home page: categories per row ---- */}
          <Text style={styles.subLabel}>{ar ? "عدد الفئات في كل صف (الصفحة الرئيسية)" : "Categories per row (Home page)"}</Text>
          <View style={styles.segRow}>
            {HOME_PER_ROW.map((n) => {
              const on = (settings.homeTilesPerRow ?? 0) === n;
              return (
                <Pressable key={n} onPress={() => update({ homeTilesPerRow: n })} style={[styles.seg, on && styles.segOn]}>
                  <Text style={[styles.segText, on && { color: "white" }]}>{n === 0 ? (ar ? "تلقائي" : "Auto") : n}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* ---- verb forms ---- */}
          <Text style={styles.sectionTitle}>
            {lang === "ar-SA" ? "تصريفات الأفعال المعروضة" : lang === "ur-PK" ? "دکھائی جانے والی فعل کی فارمز" : "Verb forms to show"}
          </Text>
          <Text style={styles.subLabel}>
            {lang === "ar-SA"
              ? "اختر التصريفات التي تظهر في التطبيق. الباقي يُخفى."
              : lang === "ur-PK"
                ? "جو فارمز ایپ میں دکھانی ہیں وہ چنیں، باقی چھپ جائیں گی۔"
                : "Pick the forms the app shows. The others are hidden everywhere on the Talk board."}
          </Text>
          <View style={[styles.segRow, { flexWrap: "wrap" }]}>
            {([
              { key: "1st", label: "1st", example: "Agree" },
              { key: "s", label: "s / es", example: "Agrees" },
              { key: "2nd", label: "2nd", example: "Agreed" },
              { key: "3rd", label: "3rd", example: "Agreed" },
              { key: "4th", label: "4th", example: "Agreeing" },
            ] as { key: VerbFormKey; label: string; example: string }[]).map((f) => {
              const shown = settings.visibleVerbForms?.length ? settings.visibleVerbForms : ALL_VERB_FORMS;
              const on = shown.includes(f.key);
              return (
                <Pressable
                  key={f.key}
                  onPress={() => {
                    const next = on ? shown.filter((k) => k !== f.key) : [...shown, f.key];
                    if (next.length === 0) {
                      Alert.alert("", lang === "ar-SA" ? "اختر تصريفاً واحداً على الأقل." : lang === "ur-PK" ? "کم از کم ایک فارم چنیں۔" : "Keep at least one form.");
                      return;
                    }
                    update({ visibleVerbForms: ALL_VERB_FORMS.filter((k) => next.includes(k)) });
                  }}
                  style={[styles.seg, on && styles.segOn, { minWidth: 96 }]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                >
                  <Text style={[styles.segText, on && { color: "white" }]}>
                    {on ? "✓ " : ""}
                    {f.label}
                  </Text>
                  <Text style={[{ fontSize: 11, fontWeight: "600", color: colors.textLight }, on && { color: "rgba(255,255,255,0.85)" }]}>{f.example}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* ---- noun forms (off: forms are shown only for verbs) ---- */}
          {false && (<>
          {/* ---- noun forms ---- */}
          <Text style={styles.sectionTitle}>
            {lang === "ar-SA" ? "صيغ الأسماء المعروضة" : lang === "ur-PK" ? "دکھائی جانے والی اسم کی فارمز" : "Noun forms to show"}
          </Text>
          <Text style={styles.subLabel}>
            {lang === "ar-SA"
              ? "عند لمس اسم تظهر صيغه. اختر الصيغ المعروضة."
              : lang === "ur-PK"
                ? "اسم پر ٹیپ کرنے سے اس کی فارمز کھلتی ہیں۔ جو دکھانی ہیں وہ چنیں۔"
                : "Tapping a noun opens its forms. Pick the forms the popup shows."}
          </Text>
          <View style={[styles.segRow, { flexWrap: "wrap" }]}>
            {([
              { key: "one", label: lang === "ar-SA" ? "مفرد" : "One", example: "Apple" },
              { key: "many", label: lang === "ar-SA" ? "جمع" : "Many", example: "Apples" },
              { key: "ones", label: "'s", example: "Apple's" },
              { key: "manys", label: "s'", example: "Apples'" },
            ] as { key: NounFormKey; label: string; example: string }[]).map((f) => {
              const shown = settings.visibleNounForms?.length ? settings.visibleNounForms : ALL_NOUN_FORMS;
              const on = shown.includes(f.key);
              return (
                <Pressable
                  key={f.key}
                  onPress={() => {
                    const next = on ? shown.filter((k) => k !== f.key) : [...shown, f.key];
                    if (next.length === 0) {
                      Alert.alert("", lang === "ar-SA" ? "اختر صيغة واحدة على الأقل." : lang === "ur-PK" ? "کم از کم ایک فارم چنیں۔" : "Keep at least one form.");
                      return;
                    }
                    update({ visibleNounForms: ALL_NOUN_FORMS.filter((k) => next.includes(k)) });
                  }}
                  style={[styles.seg, on && styles.segOn, { minWidth: 96 }]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                >
                  <Text style={[styles.segText, on && { color: "white" }]}>
                    {on ? "✓ " : ""}
                    {f.label}
                  </Text>
                  <Text style={[{ fontSize: 11, fontWeight: "600", color: colors.textLight }, on && { color: "rgba(255,255,255,0.85)" }]}>{f.example}</Text>
                </Pressable>
              );
            })}
          </View>

          </>)}

          {/* ---- admin ---- */}
          <Text style={styles.sectionTitle}>{t("setParentControls", lang)}</Text>
          <Pressable onPress={openPin} style={styles.actionRow}>
            <Text style={{ fontSize: 20 }}>🔑</Text>
            <Text style={styles.actionLabel}>{pinSet ? t("setChangePasscode", lang) : t("setSetPasscode", lang)}</Text>
            <Text style={styles.actionState}>{pinSet ? t("setState", lang) : t("setNotSet", lang)}</Text>
          </Pressable>
          {/* ---- backup ---- */}
          <Text style={styles.sectionTitle}>{t("setBackup", lang)}</Text>
          <BackupSettings />
          <View style={styles.segRow}>
            <Pressable onPress={exportBoard} style={[styles.seg, { backgroundColor: colors.forestLight }]}>
              <Text style={[styles.segText, { color: colors.forestDark }]}>{t("setExport", lang)}</Text>
            </Pressable>
            <Pressable onPress={() => setImportModal(true)} style={[styles.seg, { backgroundColor: colors.forestLight }]}>
              <Text style={[styles.segText, { color: colors.forestDark }]}>{t("setRestore", lang)}</Text>
            </Pressable>
          </View>

          {/* ---- language ---- */}
          <Text style={styles.sectionTitle}>{t("language", lang)}</Text>
          <View style={styles.langGrid}>
            {SETTINGS_LANGUAGES.map((l) => {
              const active = settings.language === l.code;
              return (
                <Pressable
                  key={l.code}
                  onPress={() => {
                    const code = l.code as LanguageCode;
                    update({ language: code });
                    setSeedLanguage(code);
                    retranslateSeedBoard(code);
                    const flipped = applyLanguageDirection(code);
                    if (flipped) Alert.alert(l.nativeName, t("reopenForLanguage", code));
                  }}
                  style={[styles.langBtn, active ? styles.langBtnActive : styles.langBtnInactive]}
                >
                  <Text style={{ fontSize: 22 }}>{l.flag}</Text>
                  <View>
                    <Text style={styles.langNative}>{l.nativeName}</Text>
                    <Text style={styles.langName}>{l.name}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* category name colours: search, tap a name, pick a colour */}
      <Modal visible={colorModal} transparent animationType="fade" onRequestClose={() => setColorModal(false)}>
        <View style={[styles.modalBackdrop, { padding: cmSmall ? 10 : 24 }]}>
          <View style={[styles.cmCard, { maxHeight: win.height * 0.94, padding: cmSmall ? 14 : 22, borderRadius: cmSmall ? 20 : 26 }]}>
            <View style={styles.cmHeader}>
              <View style={[styles.cmIcon, cmSmall && { width: 38, height: 38, borderRadius: 12 }]}><Ionicons name="color-palette" size={cmSmall ? 20 : 24} color="white" /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cmTitle, cmSmall && { fontSize: 16 }]} numberOfLines={1}>{ar ? "ألوان أسماء الفئات" : "Category name colours"}</Text>
                <Text style={[styles.cmSub, cmSmall && { fontSize: 12 }]} numberOfLines={2}>{ar ? "اختر فئة ثم لوناً لاسمها في الصفحة الرئيسية" : "Choose a category, then a colour for its name on Home"}</Text>
              </View>
              <Pressable onPress={() => setColorModal(false)} style={styles.cmClose} accessibilityLabel="Close">
                <Ionicons name="close" size={22} color={colors.textDark} />
              </Pressable>
            </View>

            <ScrollView ref={cmScroll} style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 4 }} keyboardShouldPersistTaps="handled">
            {(() => {
              const sel = colorCats.find((c) => c.id === colorOpen);
              if (!sel)
                return (
                  <View style={styles.cmEmpty}>
                    <Ionicons name="hand-left-outline" size={20} color={colors.textLight} />
                    <Text style={styles.cmEmptyText}>{ar ? "اضغط على اسم فئة بالأسفل لتغيير لونه" : "Tap a category below to change its name colour"}</Text>
                  </View>
                );
              const mine = settings.categoryNameColors?.[sel.id];
              const shown = mine || sel.color || colors.textDark;
              const cat = getCategory(sel.id);
              const pic = cat ? categoryPictureFor(cat) : {};
              return (
                <View style={[styles.cmPicker, cmSmall && { flexDirection: "column", alignItems: "stretch", gap: 12, padding: 12 }]}>
                  <View style={[styles.cmPreview, cmSmall && { width: "100%", flexDirection: "row", gap: 12, padding: 8 }]}>
                    <View style={[styles.cmPreviewPic, cmSmall && { width: 92 }]}>
                      {pic.uri ? <SmartImage source={{ uri: pic.uri }} style={{ width: "100%", height: "100%", resizeMode: "contain" } as any} /> : <Ionicons name="folder" size={30} color={shown} />}
                    </View>
                    <Text style={[styles.cmPreviewName, { color: shown }, cmSmall && { flex: 1, textAlign: "left", fontSize: 15 }]} numberOfLines={2}>{sel.name}</Text>
                  </View>
                  <View style={cmSmall ? { gap: 10 } : { flex: 1, minWidth: 240, gap: 10 }}>
                    <Text style={styles.cmLabel}>{ar ? "لون الاسم" : "Name colour"}</Text>
                    <View style={styles.swatchRow}>
                      {NAME_COLORS.map((col) => (
                        <Pressable key={col} onPress={() => setNameColor(sel.id, col)} style={[styles.cmSwatch, cmSmall && { width: 34, height: 34, borderRadius: 17 }, { backgroundColor: col }, mine === col && styles.cmSwatchOn]} accessibilityLabel={col}>
                          {mine === col ? <Ionicons name="checkmark" size={20} color="white" /> : null}
                        </Pressable>
                      ))}
                    </View>
                    <Pressable onPress={() => setNameColor(sel.id)} style={[styles.cmDefault, !mine && styles.cmDefaultOn]}>
                      <Ionicons name="refresh" size={16} color={!mine ? "white" : colors.forest} />
                      <Text style={[styles.cmDefaultText, !mine && { color: "white" }]}>{ar ? "اللون الافتراضي" : "Default colour"}</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })()}

            <View style={styles.cmSearch}>
              <Ionicons name="search" size={18} color={colors.textLight} />
              <TextInput
                value={colorSearch}
                onChangeText={setColorSearch}
                placeholder={ar ? "ابحث عن فئة..." : "Search a category..."}
                placeholderTextColor={colors.textLight}
                style={styles.cmSearchInput}
              />
            </View>

            <View style={styles.chipWrap}>
              {colorCats
                .filter((c) => c.name.toLowerCase().includes(colorSearch.trim().toLowerCase()))
                .map((c) => {
                  const mine = settings.categoryNameColors?.[c.id];
                  const shown = mine || c.color || colors.textDark;
                  const on = colorOpen === c.id;
                  return (
                    <Pressable key={c.id} onPress={() => pickColorCat(c.id)} style={[styles.chip, cmSmall && { maxWidth: "100%" }, { backgroundColor: shown + "14", borderColor: on ? shown : "transparent" }]}>
                      <View style={[styles.colorDot, { backgroundColor: shown }]} />
                      <Text style={[styles.chipText, { color: shown }]} numberOfLines={1}>{c.name}</Text>
                      {mine ? <Ionicons name="brush" size={12} color={shown} /> : null}
                    </Pressable>
                  );
                })}
            </View>
            </ScrollView>

            <Pressable onPress={() => setColorModal(false)} style={[styles.cmDone, cmSmall && { alignSelf: "stretch", justifyContent: "center", marginTop: 12 }]}>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.cmDoneText}>{ar ? "تم" : "Done"}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* passcode modal */}
      <Modal visible={pinModal} transparent animationType="fade" onRequestClose={() => setPinModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("accPasscodeModalTitle", lang)}</Text>
            <Text style={styles.modalBody}>{t("accPasscodeModalBody", lang)}</Text>
            {pinSet && (
              <>
                <Text style={styles.pinLabel}>{ar ? "كلمة المرور الحالية" : "Current password"}</Text>
                <TextInput
                  value={pinCurrent}
                  onChangeText={(v) => setPinCurrent(v.replace(/\D/g, "").slice(0, 4))}
                  keyboardType="number-pad"
                  secureTextEntry
                  placeholder={t("accPasscodePlaceholder", lang)}
                  placeholderTextColor={colors.textLight}
                  style={styles.modalInput}
                />
              </>
            )}
            <Text style={styles.pinLabel}>{ar ? "كلمة المرور الجديدة" : "New password"}</Text>
            <TextInput
              value={pinValue}
              onChangeText={(v) => setPinValue(v.replace(/\D/g, "").slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              placeholder={t("accPasscodePlaceholder", lang)}
              placeholderTextColor={colors.textLight}
              style={styles.modalInput}
            />
            <Text style={styles.pinLabel}>{ar ? "أعد كتابة كلمة المرور الجديدة" : "Type the new password again"}</Text>
            <TextInput
              value={pinConfirm}
              onChangeText={(v) => setPinConfirm(v.replace(/\D/g, "").slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              placeholder={t("accPasscodePlaceholder", lang)}
              placeholderTextColor={colors.textLight}
              style={styles.modalInput}
            />
            {pinError && <Text style={styles.pinError}>{pinError}</Text>}
            <View style={styles.modalRow}>
              <Pressable onPress={() => setPinModal(false)} style={[styles.modalBtn, { backgroundColor: colors.cardMuted }]}>
                <Text style={{ color: colors.textMid, fontWeight: "700" }}>{t("cancel", lang)}</Text>
              </Pressable>
              <Pressable onPress={savePin} style={[styles.modalBtn, { backgroundColor: colors.forest }]}>
                <Text style={{ color: "white", fontWeight: "700" }}>{t("save", lang)}</Text>
              </Pressable>
            </View>
            {pinSet && (
              <Pressable onPress={removePin} style={{ marginTop: 12, alignSelf: "center" }}>
                <Text style={{ color: "#b91c1c", fontWeight: "700", fontSize: 13 }}>{ar ? "إزالة كلمة المرور" : "Remove password"}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      {/* restore modal */}
      <Modal visible={importModal} transparent animationType="fade" onRequestClose={() => setImportModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("accRestoreModalTitle", lang)}</Text>
            <Text style={styles.modalBody}>{t("accRestoreModalBody", lang)}</Text>
            <TextInput
              value={importText}
              onChangeText={setImportText}
              multiline
              placeholder={t("accRestorePlaceholder", lang)}
              placeholderTextColor={colors.textLight}
              style={[styles.modalInput, { minHeight: 120, textAlignVertical: "top", fontSize: 12 }]}
            />
            <View style={styles.modalRow}>
              <Pressable onPress={() => setImportModal(false)} style={[styles.modalBtn, { backgroundColor: colors.cardMuted }]}>
                <Text style={{ color: colors.textMid, fontWeight: "700" }}>{t("cancel", lang)}</Text>
              </Pressable>
              <Pressable onPress={runImport} style={[styles.modalBtn, { backgroundColor: colors.forest }]}>
                <Text style={{ color: "white", fontWeight: "700" }}>{t("accRestoreBtn", lang)}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* In-App Notice Modal */}
      <Modal visible={!!notice} transparent animationType="fade" onRequestClose={() => setNotice(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{notice?.title || "Notice"}</Text>
            <Text style={styles.modalBody}>{notice?.message}</Text>
            <Pressable onPress={() => setNotice(null)} style={[styles.modalBtn, { flexGrow: 0, flexBasis: "auto", backgroundColor: colors.forest, marginTop: 14 }]}>
              <Text style={{ color: "white", fontWeight: "700", textAlign: "center" }}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cmCard: { width: "94%", maxWidth: 780, backgroundColor: "white", borderRadius: 26, padding: 22, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  cmHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  cmIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.forest, alignItems: "center", justifyContent: "center" },
  cmTitle: { fontSize: 19, fontWeight: "900", color: colors.textDark },
  cmSub: { fontSize: 13, color: colors.textLight, marginTop: 2 },
  cmClose: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#f3efe8", alignItems: "center", justifyContent: "center" },
  cmEmpty: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, padding: 16, borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.border, backgroundColor: "#fcfaf6" },
  cmEmptyText: { fontSize: 14, color: colors.textLight, fontWeight: "600" },
  cmPicker: { flexDirection: "row", gap: 16, marginTop: 16, padding: 14, borderRadius: 18, backgroundColor: "#f8f5ef", alignItems: "center", flexWrap: "wrap" },
  cmPreview: { width: 132, backgroundColor: "white", borderRadius: 18, padding: 8, alignItems: "center", gap: 6, shadowColor: "#7a5c3e", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  cmPreviewPic: { width: "100%", aspectRatio: 1.295, borderRadius: 12, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  cmPreviewName: { fontSize: 14, lineHeight: 18, fontWeight: "800", textAlign: "center" },
  cmLabel: { fontSize: 12, fontWeight: "800", color: colors.textLight, letterSpacing: 0.8, textTransform: "uppercase" },
  cmSwatch: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "white", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  cmSwatchOn: { transform: [{ scale: 1.15 }], borderColor: colors.textDark },
  cmDefault: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1.5, borderColor: colors.forest, backgroundColor: "white" },
  cmDefaultOn: { backgroundColor: colors.forest },
  cmDefaultText: { fontSize: 13, fontWeight: "800", color: colors.forest },
  cmSearch: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "#f3efe8" },
  cmSearchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: colors.textDark, borderWidth: 0, backgroundColor: "transparent", outlineStyle: "none" } as any,
  cmDone: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-end", marginTop: 16, paddingHorizontal: 26, paddingVertical: 12, borderRadius: 24, backgroundColor: colors.forest },
  cmDoneText: { fontSize: 16, fontWeight: "900", color: "white" },
  colorEntry: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, marginTop: 8 },
  colorEntryTitle: { fontSize: 15, fontWeight: "800", color: colors.textDark },
  colorEntryArrow: { fontSize: 26, fontWeight: "700", color: colors.textLight },
  colorCard: { width: "92%", maxWidth: 760 },
  colorSearch: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginTop: 10, color: colors.textDark },
  colorHint: { fontSize: 13, color: colors.textLight, marginTop: 10 },
  colorPicker: { marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: "#faf7f2", gap: 8 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingTop: 12 },
  chip: { flexDirection: "row", alignItems: "center", gap: 7, maxWidth: 260, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 2 },
  chipText: { fontSize: 13, fontWeight: "800", flexShrink: 1 },
  colorRow: { backgroundColor: "white", borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginTop: 8, overflow: "hidden" },
  colorHead: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  colorName: { flex: 1, fontSize: 15, fontWeight: "800" },
  colorState: { fontSize: 12, fontWeight: "700", color: colors.textLight },
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center" },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 3, borderColor: "white" },
  swatchOn: { borderColor: colors.textDark },
  defaultBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: "white" },
  header: { backgroundColor: colors.forest, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, paddingVertical: 6, paddingHorizontal: 14, marginBottom: 12, alignSelf: "flex-start" },
  backText: { color: "white", fontWeight: "700" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "white" },
  body: { padding: 20, gap: 10, paddingBottom: 50 },
  bodyCompact: { paddingHorizontal: 12 },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: colors.textLight, letterSpacing: 1, marginTop: 18, textTransform: "uppercase" },
  subLabel: { fontSize: 13, color: colors.textMid, fontWeight: "600", marginTop: 6 },
  segRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  seg: { flexGrow: 1, flexShrink: 1, flexBasis: 74, minHeight: 44, paddingVertical: 10, paddingHorizontal: 6, borderRadius: radius, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  segOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  segText: { fontWeight: "800", fontSize: 14, color: colors.textMid, textAlign: "center" },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.card, borderRadius: radius, paddingVertical: 15, paddingHorizontal: 18, borderWidth: 1, borderColor: colors.border },
  actionLabel: { flex: 1, fontWeight: "600", fontSize: 15, color: colors.textDark },
  actionState: { maxWidth: "45%", flexShrink: 1, textAlign: "right", fontSize: 12, fontWeight: "700", color: colors.forest },
  infoBox: { backgroundColor: colors.forestLight, borderRadius: radius, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: "transparent" },
  infoText: { color: colors.forestDark, fontSize: 12.5, lineHeight: 19 },
  infoBullet: { color: colors.forestDark, fontSize: 12.5, lineHeight: 19, marginBottom: 4 },
  langGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  langBtn: { width: "47%", paddingVertical: 12, paddingHorizontal: 10, borderRadius: radius, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  langBtnActive: { borderColor: colors.forest, backgroundColor: colors.forestLight },
  langBtnInactive: { borderColor: colors.border, backgroundColor: colors.card },
  langNative: { fontSize: 13, color: colors.textDark, fontWeight: "700" },
  langName: { fontSize: 11, color: colors.textLight },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", backgroundColor: colors.bg, borderRadius: radius, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: "800", color: colors.textDark, marginBottom: 6 },
  modalBody: { fontSize: 12.5, color: colors.textMid, lineHeight: 18, marginBottom: 12 },
  modalInput: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: radius, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.textDark, letterSpacing: 2 },
  pinLabel: { fontSize: 13, fontWeight: "700", color: colors.textMid, marginTop: 10, marginBottom: 4 },
  pinError: { color: "#b91c1c", fontWeight: "700", fontSize: 13, marginTop: 10 },
  modalRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  modalBtn: { flex: 1, borderRadius: radius, paddingVertical: 12, alignItems: "center" },
});
