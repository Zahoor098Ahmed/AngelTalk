import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, Share, TextInput, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSettings } from "../context/SettingsContext";
import { LANGUAGES, t, applyLanguageDirection } from "../modules/i18n";
import type { LanguageCode } from "../types";
import { loadPasscode, hasPasscode, setPasscode, clearPasscode } from "../modules/passcode";
import { loadPixabayKey, hasPixabayKey, setPixabayKey } from "../modules/imageSearch";
import { buildBackup, restoreBackup, retranslateSeedBoard, setSeedLanguage } from "../modules/customCategories";
import { loadChildren } from "../modules/storage";
import { ensureVoicePracticeLoaded, getStorageFootprintBytes, getClipsForChild } from "../learning/voicePractice";
import { previewVoice } from "../modules/tts";
import { colors, radius } from "../theme";

interface Props {
  onBack: () => void;
}

type FontSize = "small" | "medium" | "large" | "xlarge";
const FONT_SIZES: FontSize[] = ["small", "medium", "large", "xlarge"];
const RATES: { key: "setSlow" | "setNormal" | "setFast"; value: number }[] = [
  { key: "setSlow", value: 0.65 },
  { key: "setNormal", value: 0.9 },
  { key: "setFast", value: 1.0 },
];

function ToggleRow({ label, emoji, value, onChange }: { label: string; emoji: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Pressable onPress={() => onChange(!value)} style={[styles.switch, { backgroundColor: value ? colors.greenDeep : colors.border }]}>
        <View style={[styles.knob, { left: value ? 29 : 3 }]} />
      </Pressable>
    </View>
  );
}

export default function AccessibilityScreen({ onBack }: Props) {
  const { settings, update } = useSettings();
  const lang = settings.language;

  const [pinSet, setPinSet] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [keyModal, setKeyModal] = useState(false);
  const [keyValue, setKeyValue] = useState("");
  const [keySet, setKeySet] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [voiceStorageBytes, setVoiceStorageBytes] = useState<number | null>(null);
  const [voiceClipCount, setVoiceClipCount] = useState(0);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    ensureVoicePracticeLoaded().then(async () => {
      const children = loadChildren();
      let totalBytes = 0;
      let totalClips = 0;
      for (const c of children) {
        totalBytes += await getStorageFootprintBytes(c.id);
        totalClips += getClipsForChild(c.id).length;
      }
      setVoiceStorageBytes(totalBytes);
      setVoiceClipCount(totalClips);
    });
  }, []);

  useEffect(() => {
    loadPasscode().then(() => setPinSet(hasPasscode()));
    loadPixabayKey().then(() => setKeySet(hasPixabayKey()));
  }, []);

  async function savePin() {
    if (pinValue === "") {
      await clearPasscode();
      setPinSet(false);
      setPinModal(false);
      return;
    }
    const ok = await setPasscode(pinValue);
    if (!ok) return setNotice({ title: "PIN Error", message: t("accPasscodeInvalid", lang) });
    setPinSet(true);
    setPinModal(false);
    setPinValue("");
  }

  async function saveKey() {
    await setPixabayKey(keyValue);
    setKeySet(hasPixabayKey());
    setKeyModal(false);
    setKeyValue("");
  }

  async function exportBoard() {
    const b = buildBackup();
    if (b.categoryCount === 0) return setNotice({ title: "Backup", message: t("accNothingToBackup", lang) });
    try {
      await Share.share({ title: "Angel Talk board backup", message: JSON.stringify(b) });
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
          <Text style={styles.sectionTitle}>Child Voice & Speech Style</Text>
          <ToggleRow label={t("sound", lang)} emoji="🔊" value={settings.soundEnabled} onChange={(v) => update({ soundEnabled: v })} />
          
          <Text style={styles.subLabel}>Natural Child Voice</Text>
          <View style={styles.segRow}>
            {(
              [
                { key: "boy", label: "Boy", icon: "👦" },
                { key: "girl", label: "Girl", icon: "👧" },
                { key: "woman", label: "Woman", icon: "👩" },
                { key: "man", label: "Man", icon: "👨" },
              ] as const
            ).map((v) => {
              const active = (settings.voiceType || "boy") === v.key;
              return (
                <Pressable
                  key={v.key}
                  onPress={() => {
                    update({ voiceType: v.key });
                    previewVoice(v.key, lang);
                  }}
                  style={[styles.seg, active && styles.segOn]}
                >
                  <Text style={[styles.segText, active && { color: "white" }]}>
                    {v.icon} {v.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.subLabel}>{t("setSpeakingSpeed", lang)}</Text>
          <View style={styles.segRow}>
            {RATES.map((r) => (
              <Pressable
                key={r.key}
                onPress={() => update({ speechRate: r.value })}
                style={[styles.seg, Math.abs(settings.speechRate - r.value) < 0.03 && styles.segOn]}
              >
                <Text style={[styles.segText, Math.abs(settings.speechRate - r.value) < 0.03 && { color: "white" }]}>{t(r.key, lang)}</Text>
              </Pressable>
            ))}
          </View>

          {/* ---- board & GLP mode ---- */}
          <Text style={styles.sectionTitle}>Communication & Board Mode</Text>
          <Text style={styles.subLabel}>Tapping Behavior (Gestalt Language / Whole Phrases)</Text>
          <View style={styles.segRow}>
            {(
              [
                { key: "phrase", label: "⚡ Tap-to-Talk (Whole Phrases)" },
                { key: "sentence", label: "🧩 Sentence Builder Strip" },
              ] as const
            ).map((m) => {
              const active = (settings.boardMode || "phrase") === m.key;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => update({ boardMode: m.key })}
                  style={[styles.seg, active && styles.segOn, { flex: 1 }]}
                >
                  <Text style={[styles.segText, active && { color: "white" }]}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <ToggleRow
            label="Bilingual Dual-Language Cards (English + Arabic)"
            emoji="🌐"
            value={settings.bilingualDisplay}
            onChange={(v) => update({ bilingualDisplay: v })}
          />

          <ToggleRow
            label="Family-First Simple Mode (Clean, uncluttered)"
            emoji="🧸"
            value={settings.simpleMode}
            onChange={(v) => update({ simpleMode: v })}
          />

          <ToggleRow label={t("setHaptics", lang)} emoji="📳" value={settings.hapticsEnabled} onChange={(v) => update({ hapticsEnabled: v })} />
          <Text style={styles.subLabel}>{t("setTilesPerRow", lang)}</Text>
          <View style={styles.segRow}>
            {[2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => update({ boardColumns: n })} style={[styles.seg, settings.boardColumns === n && styles.segOn]}>
                <Text style={[styles.segText, settings.boardColumns === n && { color: "white" }]}>{n}</Text>
              </Pressable>
            ))}
          </View>

          {/* ---- accessibility ---- */}
          <Text style={styles.sectionTitle}>{t("setAccessibility", lang)}</Text>
          <Text style={styles.subLabel}>{t("fontSize", lang)}</Text>
          <View style={styles.segRow}>
            {FONT_SIZES.map((s, i) => (
              <Pressable key={s} onPress={() => update({ fontSize: s })} style={[styles.seg, settings.fontSize === s && styles.segOn]}>
                <Text style={[styles.segText, { fontSize: 14 + i * 3 }, settings.fontSize === s && { color: "white" }]}>A</Text>
              </Pressable>
            ))}
          </View>
          <ToggleRow label={t("highContrast", lang)} emoji="🌗" value={settings.highContrast} onChange={(v) => update({ highContrast: v })} />
          <ToggleRow label={t("reduceMotion", lang)} emoji="🐢" value={settings.reduceMotion} onChange={(v) => update({ reduceMotion: v })} />

          {/* ---- kiosk ---- */}
          <Text style={styles.sectionTitle}>{t("setKiosk", lang)}</Text>
          <ToggleRow label={t("setLockOpen", lang)} emoji="🔒" value={settings.kioskMode} onChange={(v) => update({ kioskMode: v })} />
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{t("setKioskInfo", lang)}</Text>
          </View>
          <View style={[styles.infoBox, { borderColor: colors.forest + "60", backgroundColor: colors.forest + "0f" }]}>
            <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 8 }]}>{t("accKioskOption2Title", lang)}</Text>
            <Text style={[styles.infoText, { fontWeight: "700", color: colors.textDark, marginBottom: 6 }]}>{t("accBestEffortLock", lang)}</Text>
            <Text style={styles.infoBullet}>{t("accBackDisabled", lang)}</Text>
            <Text style={styles.infoBullet}>{t("accScreenAwake", lang)}</Text>
            <Text style={styles.infoBullet}>
              {t("accExitTempBullet", lang)}
            </Text>
            <Text style={[styles.infoText, { fontWeight: "700", color: colors.textDark, marginTop: 12, marginBottom: 6 }]}>
              {t("accAndroidHardenedTitle", lang)}
            </Text>
            <Text style={styles.infoBullet}>
              {t("accInstallApkBullet", lang)}
            </Text>
            <Text style={[styles.infoBullet, { fontFamily: "monospace", fontSize: 12 }]}>
              adb shell dpm set-device-owner com.kiddocare.app/.DeviceAdminReceiver
            </Text>
            <Text style={styles.infoBullet}>
              {t("accToggleKioskBullet", lang)}
            </Text>
            <Text style={styles.infoBullet}>{t("accFactoryResetBullet", lang)}</Text>
            <Text style={[styles.infoText, { fontWeight: "700", color: colors.textDark, marginTop: 12, marginBottom: 6 }]}>{t("accIosGuidedTitle", lang)}</Text>
            <Text style={styles.infoBullet}>{t("accIosSettingsBullet", lang)}</Text>
            <Text style={styles.infoBullet}>{t("accIosPasscodeBullet", lang)}</Text>
            <Text style={styles.infoBullet}>{t("accIosLaunchBullet", lang)}</Text>
            <Text style={styles.infoBullet}>{t("accIosExitBullet", lang)}</Text>
          </View>
          <View style={{ height: 2 }} />

          {/* ---- admin ---- */}
          <Text style={styles.sectionTitle}>{t("setParentControls", lang)}</Text>
          <Pressable onPress={() => setPinModal(true)} style={styles.actionRow}>
            <Text style={{ fontSize: 20 }}>🔑</Text>
            <Text style={styles.actionLabel}>{pinSet ? t("setChangePasscode", lang) : t("setSetPasscode", lang)}</Text>
            <Text style={styles.actionState}>{pinSet ? t("setState", lang) : t("setNotSet", lang)}</Text>
          </Pressable>
          <Pressable onPress={() => setKeyModal(true)} style={styles.actionRow}>
            <Text style={{ fontSize: 20 }}>🖼️</Text>
            <Text style={styles.actionLabel}>{t("setPixabay", lang)}</Text>
            <Text style={styles.actionState}>{keySet ? t("setState", lang) : t("setNotSet", lang)}</Text>
          </Pressable>

          {/* ---- voice practice storage footprint (Feature 4) ---- */}
          {voiceStorageBytes !== null && voiceClipCount > 0 && (
            <View style={styles.actionRow}>
              <Text style={{ fontSize: 20 }}>🎙️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionLabel}>{t("setVoiceStorageLabel", lang)}</Text>
                <Text style={styles.actionState}>{t("setVoiceStorageManageHint", lang)}</Text>
              </View>
              <Text style={styles.actionState}>
                {voiceStorageBytes < 1024 * 1024
                  ? `${(voiceStorageBytes / 1024).toFixed(1)} KB`
                  : `${(voiceStorageBytes / (1024 * 1024)).toFixed(1)} MB`}{" "}
                · {voiceClipCount}
              </Text>
            </View>
          )}

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
            {LANGUAGES.map((l) => {
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
            <TextInput
              value={pinValue}
              onChangeText={(v) => setPinValue(v.replace(/\D/g, "").slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              placeholder={t("accPasscodePlaceholder", lang)}
              placeholderTextColor={colors.textLight}
              style={styles.modalInput}
            />
            <View style={styles.modalRow}>
              <Pressable onPress={() => setPinModal(false)} style={[styles.modalBtn, { backgroundColor: colors.cardMuted }]}>
                <Text style={{ color: colors.textMid, fontWeight: "700" }}>{t("cancel", lang)}</Text>
              </Pressable>
              <Pressable onPress={savePin} style={[styles.modalBtn, { backgroundColor: colors.forest }]}>
                <Text style={{ color: "white", fontWeight: "700" }}>{t("save", lang)}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* pixabay key modal */}
      <Modal visible={keyModal} transparent animationType="fade" onRequestClose={() => setKeyModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("accPixabayModalTitle", lang)}</Text>
            <Text style={styles.modalBody}>
              {t("accPixabayModalBody", lang)}
            </Text>
            <TextInput
              value={keyValue}
              onChangeText={setKeyValue}
              autoCapitalize="none"
              placeholder={t("accPixabayPlaceholder", lang)}
              placeholderTextColor={colors.textLight}
              style={styles.modalInput}
            />
            <View style={styles.modalRow}>
              <Pressable onPress={() => setKeyModal(false)} style={[styles.modalBtn, { backgroundColor: colors.cardMuted }]}>
                <Text style={{ color: colors.textMid, fontWeight: "700" }}>{t("cancel", lang)}</Text>
              </Pressable>
              <Pressable onPress={saveKey} style={[styles.modalBtn, { backgroundColor: colors.forest }]}>
                <Text style={{ color: "white", fontWeight: "700" }}>{t("save", lang)}</Text>
              </Pressable>
            </View>
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
            <Pressable onPress={() => setNotice(null)} style={[styles.modalBtn, { backgroundColor: colors.forest, marginTop: 14 }]}>
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
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.card, borderRadius: radius, paddingVertical: 15, paddingHorizontal: 18, borderWidth: 1, borderColor: colors.border },
  toggleLabel: { flex: 1, fontWeight: "600", fontSize: 15, color: colors.textDark },
  switch: { width: 56, height: 30, borderRadius: 15 },
  knob: { position: "absolute", width: 24, height: 24, borderRadius: 12, backgroundColor: "white", top: 3 },
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
  modalRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  modalBtn: { flex: 1, borderRadius: radius, paddingVertical: 12, alignItems: "center" },
});
