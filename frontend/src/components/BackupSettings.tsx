import { useEffect, useState } from "react";
import { View, Pressable, Switch, Share, Platform } from "react-native";
import Text from "./AppText";
import TextInput from "./AppTextInput";
import { useSettings } from "../context/SettingsContext";
import { loadSettings } from "../modules/storage";
import { backupNow, getRecoveryCode, setAutomaticBackup, subscribeBackups, findRecoveryBackup, restoreRecoveryBackup, type BackupStatus } from "../modules/automaticBackup";
import type { AppBackupSnapshot } from "../modules/backupSnapshot";

export default function BackupSettings() {
  const { settings, update } = useSettings();
  const ar = settings.language === "ar-SA";
  const [status, setStatus] = useState<BackupStatus>();
  const [code, setCode] = useState("");
  const [restoreCode, setRestoreCode] = useState("");
  const [preview, setPreview] = useState<AppBackupSnapshot>();
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => subscribeBackups(setStatus), []);
  const text = (english: string, arabic: string) => ar ? arabic : english;
  async function run(task: () => Promise<void>) {
    setWorking(true); setMessage("");
    try { await task(); } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setWorking(false); }
  }
  async function saveRecoveryCode() {
    const recovery = await getRecoveryCode(); setCode(recovery);
    const content = `Angel Talk recovery code\n\n${recovery}\n\nKeep this outside the app. You need it to restore your encrypted backup after reinstalling.\n`;
    if (Platform.OS === "web") {
      const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
      const link = document.createElement("a"); link.href = url; link.download = "angel-talk-recovery-code.txt"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else await Share.share({ title: "Angel Talk recovery code", message: content });
  }
  const disabled = working || status?.busy;
  const button = { borderRadius: 10, padding: 12, backgroundColor: "#0f766e", opacity: disabled ? 0.55 : 1 };
  return <View style={{ marginBottom: 16, padding: 14, borderRadius: 14, backgroundColor: "#f0fdfa", gap: 12 }}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
      <Text style={{ flex: 1, fontWeight: "700", color: "#134e4a" }}>{text("Automatic daily backup", "نسخ احتياطي يومي تلقائي")}</Text>
      <Switch value={status?.enabled ?? true} disabled={!!disabled} onValueChange={enabled => void run(() => setAutomaticBackup(enabled))} accessibilityLabel="Automatic daily backup" />
    </View>
    <Text style={{ color: "#475569", fontSize: 13 }}>{text("Encrypted backup every day at midnight in your device's time zone. Changes are saved while the app is in use; offline changes retry when you return online.", "نسخة مشفرة كل يوم عند منتصف الليل حسب المنطقة الزمنية لجهازك. تُحفظ التغييرات أثناء الاستخدام ويُعاد المحاولة عند عودة الاتصال.")}</Text>
    <Text style={{ color: "#334155", fontSize: 13 }}>{status?.lastSavedAt ? `${text("Last saved", "آخر حفظ")}: ${new Date(status.lastSavedAt).toLocaleString()}` : text("No successful online backup yet.", "لا توجد نسخة احتياطية ناجحة عبر الإنترنت حتى الآن.")}</Text>
    {status?.busy && <Text>{text("Saving backup…", "جارٍ حفظ النسخة…")}</Text>}
    {!!status?.error && <Text style={{ color: "#b45309" }}>{status.error}</Text>}
    <Pressable style={button} disabled={!!disabled} onPress={() => void run(async () => { await backupNow(); setMessage(text("Backup saved.", "تم حفظ النسخة الاحتياطية.")); })}><Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>{text("Back up now", "نسخ احتياطي الآن")}</Text></Pressable>
    <Text style={{ fontWeight: "700", color: "#134e4a" }}>{text("Save your recovery code", "احفظ رمز الاسترداد")}</Text>
    <Text style={{ color: "#475569", fontSize: 13 }}>{text("Keep the code outside this app. After deleting or reinstalling the app, this code is required to get your words, categories, pictures and settings back.", "احتفظ بالرمز خارج التطبيق. ستحتاج إليه لاستعادة الكلمات والفئات والصور والإعدادات بعد إعادة التثبيت.")}</Text>
    {!!code && <Text selectable style={{ padding: 10, backgroundColor: "white", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", color: "#134e4a", fontSize: 13 }}>{code}</Text>}
    <Pressable style={[button, { opacity: working ? 0.55 : 1 }]} disabled={working} onPress={() => void run(saveRecoveryCode)}><Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>{text("Save recovery code", "حفظ رمز الاسترداد")}</Text></Pressable>
    <Text style={{ fontWeight: "700", color: "#134e4a" }}>{text("Restore after reinstalling", "الاستعادة بعد إعادة التثبيت")}</Text>
    <TextInput value={restoreCode} onChangeText={value => { setRestoreCode(value); setPreview(undefined); }} autoCapitalize="none" autoCorrect={false} multiline placeholder={text("Paste your saved recovery code", "ألصق رمز الاسترداد المحفوظ")} style={{ minHeight: 58, padding: 10, borderWidth: 1, borderColor: "#99f6e4", borderRadius: 10, backgroundColor: "white", color: "#0f172a" }} accessibilityLabel="Recovery code" />
    <Pressable style={button} disabled={!!disabled || !restoreCode.trim()} onPress={() => void run(async () => { setPreview(await findRecoveryBackup(restoreCode)); })}><Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>{text("Find my backup", "العثور على نسختي الاحتياطية")}</Text></Pressable>
    {!!preview && <View style={{ gap: 10 }}>
      <Text>{`${new Date(preview.createdAt).toLocaleString()} · ${preview.categoryCount} ${text("categories", "فئة")} · ${preview.wordCount} ${text("words", "كلمة")}`}</Text>
      <Text style={{ color: "#92400e" }}>{text("Restoring will replace the data currently on this device with this backup.", "ستستبدل الاستعادة بيانات هذا الجهاز بمحتويات هذه النسخة.")}</Text>
      <Pressable style={button} disabled={!!disabled} onPress={() => void run(async () => {
        await restoreRecoveryBackup(restoreCode, preview); update(loadSettings()); setPreview(undefined); setRestoreCode(""); setCode("");
        setMessage(text("Your data is restored. Reopen the app to use the restored profiles.", "تمت استعادة بياناتك. أعد فتح التطبيق لاستخدام الملفات المستعادة."));
      })}><Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>{text("Restore this backup", "استعادة هذه النسخة")}</Text></Pressable>
    </View>}
    {!!message && <Text style={{ color: "#134e4a" }} accessibilityLiveRegion="polite">{message}</Text>}
  </View>;
}
