import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, Share, TextInput, Modal, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSettings } from "../context/SettingsContext";
import { LANGUAGES, t, applyLanguageDirection } from "../modules/i18n";
import { ALL_VERB_FORMS, ALL_NOUN_FORMS, type LanguageCode, type NounFormKey, type VerbFormKey } from "../types";
import { loadPasscode, hasPasscode, setPasscode, clearPasscode, checkPasscode } from "../modules/passcode";
import { buildBackup, ensureCategoriesLoaded, restoreBackup, retranslateSeedBoard, setSeedLanguage } from "../modules/customCategories";
import { playWord } from "../modules/audio";
import { colors, radius } from "../theme";

interface Props {
  onBack: () => void;
}

/** Settings offers the two languages the app is made for. */
const SETTINGS_LANGUAGES = LANGUAGES.filter((l) => l.code === "en-US" || l.code === "ar-SA");
/** 0 = automatic (fits the screen). */
const TILES_PER_ROW = [0, 3, 4, 5, 6, 7];
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

        <ScrollView contentContainerStyle={styles.body}>
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
          <Text style={styles.sectionTitle}>{lang === "ar-SA" ? "لوحة الكلام" : "Talk board"}</Text>
          <Text style={styles.subLabel}>{t("setTilesPerRow", lang)}</Text>
          <View style={styles.segRow}>
            {TILES_PER_ROW.map((n) => {
              const on = (settings.tilesPerRow ?? 0) === n;
              return (
                <Pressable key={n} onPress={() => update({ tilesPerRow: n })} style={[styles.seg, on && styles.segOn]}>
                  <Text style={[styles.segText, on && { color: "white" }]}>{n === 0 ? (lang === "ar-SA" ? "تلقائي" : "Auto") : n}</Text>
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
  header: { backgroundColor: colors.forest, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, paddingVertical: 6, paddingHorizontal: 14, marginBottom: 12, alignSelf: "flex-start" },
  backText: { color: "white", fontWeight: "700" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "white" },
  body: { padding: 20, gap: 10, paddingBottom: 50 },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: colors.textLight, letterSpacing: 1, marginTop: 18, textTransform: "uppercase" },
  subLabel: { fontSize: 13, color: colors.textMid, fontWeight: "600", marginTop: 6 },
  segRow: { flexDirection: "row", gap: 8 },
  seg: { flex: 1, paddingVertical: 12, borderRadius: radius, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: "center" },
  segOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  segText: { fontWeight: "800", fontSize: 14, color: colors.textMid },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.card, borderRadius: radius, paddingVertical: 15, paddingHorizontal: 18, borderWidth: 1, borderColor: colors.border },
  actionLabel: { flex: 1, fontWeight: "600", fontSize: 15, color: colors.textDark },
  actionState: { fontSize: 12, fontWeight: "700", color: colors.forest },
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
