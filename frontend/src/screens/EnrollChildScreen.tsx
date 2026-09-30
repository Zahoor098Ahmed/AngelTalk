import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import type { ChildProfile, DiagnosisType, ContentTag } from "../types";
import { DIAGNOSIS_LABELS } from "../types";
import { captureEmbedding } from "../modules/faceEngine";
import { addChild, defaultTags } from "../modules/storage";
import { useSettings } from "../context/SettingsContext";
import { t, diagnosisLabel } from "../modules/i18n";
import { speak } from "../modules/tts";
import Mascot from "../components/Mascot";
import BigButton from "../components/BigButton";
import { colors, radius } from "../theme";

interface Props {
  onDone: (child?: ChildProfile) => void;
  onBack: () => void;
}

type Step = "info" | "camera" | "done";

const ALL_DIAGNOSES = Object.keys(DIAGNOSIS_LABELS) as DiagnosisType[];

export default function EnrollChildScreen({ onDone, onBack }: Props) {
  const { settings } = useSettings();
  const lang = settings.language;
  const [step, setStep] = useState<Step>("info");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [diagnoses, setDiagnoses] = useState<DiagnosisType[]>([]);
  const [embedding, setEmbedding] = useState<number[]>([]);
  const [capturePhase, setCapturePhase] = useState(0);
  const [captured, setCaptured] = useState(false);
  const [newChild, setNewChild] = useState<ChildProfile | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [streaming, setStreaming] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState(false);

  useEffect(() => {
    if (step === "camera" && permission?.granted === false) {
      requestPermission();
    }
  }, [step, permission?.granted]);

  function toggleDiagnosis(d: DiagnosisType) {
    setDiagnoses((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  async function capture() {
    if (captured || isCapturing) return;
    if (!permission?.granted) {
      await requestPermission();
      return;
    }
    if (!cameraRef.current || !streaming) return;

    setIsCapturing(true);
    setCaptureError(false);
    try {
      speak(t("capturingFace", lang), lang, settings.soundEnabled);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: true });
      if (!photo?.uri) {
        setCaptureError(true);
        return;
      }
      const dims = photo.width && photo.height ? { width: photo.width, height: photo.height } : undefined;
      const emb = await captureEmbedding(photo.uri, dims);
      if (emb.length === 0) {
        setCaptureError(true);
        return;
      }

      if (capturePhase < 2) {
        setEmbedding((prev) => (prev.length ? prev.map((v, i) => (v + emb[i]) / 2) : emb));
        setCapturePhase((p) => p + 1);
      } else {
        const finalEmb = embedding.map((v, i) => (v + emb[i]) / 2);
        setCaptured(true);

        const allowedTags: ContentTag[] = defaultTags;
        const child: ChildProfile = {
          id: Date.now().toString(),
          name: name.trim(),
          age: parseInt(age, 10) || 5,
          diagnoses,
          allowedTags,
          embedding: finalEmb,
          photoUrl: photo.uri,
          enrolledAt: Date.now(),
          stars: 0,
          badges: [],
          faceConsent: true,
          generalConsent: true,
        };
        addChild(child);
        setNewChild(child);
        speak(t("childAdded", lang), lang, settings.soundEnabled);
        setStep("done");
      }
    } catch (err) {
      console.warn("Face capture failed:", err);
      setCaptureError(true);
    } finally {
      setIsCapturing(false);
    }
  }

  function finishWithoutCamera() {
    const allowedTags: ContentTag[] = defaultTags;
    const child: ChildProfile = {
      id: Date.now().toString(),
      name: name.trim(),
      age: parseInt(age, 10) || 5,
      diagnoses,
      allowedTags,
      embedding: [],
      enrolledAt: Date.now(),
      stars: 0,
      badges: [],
      faceConsent: true,
      generalConsent: true,
    };
    addChild(child);
    setNewChild(child);
    setCaptured(true);
    speak(t("childAdded", lang), lang, settings.soundEnabled);
    setStep("done");
  }

  function handleAddAnother() {
    setStep("info");
    setName("");
    setAge("");
    setDiagnoses([]);
    setEmbedding([]);
    setCapturePhase(0);
    setCaptured(false);
    setNewChild(null);
  }

  const stepLabels = [t("enrollStep1", lang), t("enrollStep2", lang), t("enrollStep3", lang)];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={{ width: "100%", maxWidth: 440 }}>
            <Pressable
              onPress={() => {
                if (step === "camera") {
                  setStep("info");
                } else {
                  onBack();
                }
              }}
            >
              <Text style={styles.backText}>← {t("back", lang)}</Text>
            </Pressable>
          </View>

          <Mascot mood={step === "done" ? "love" : "happy"} size={70} />
          <Text style={styles.title}>{step === "info" ? t("addChild", lang) : step === "camera" ? t("enrollFace", lang) : t("childAdded", lang)}</Text>

          {step === "info" && (
            <View style={styles.form}>
              <View>
                <Text style={styles.label}>{t("childName", lang)}</Text>
                <TextInput value={name} onChangeText={setName} placeholder={t("namePlaceholder", lang)} style={styles.input} />
              </View>
              <View>
                <Text style={styles.label}>{t("childAge", lang)}</Text>
                <TextInput
                  value={age}
                  onChangeText={setAge}
                  keyboardType="number-pad"
                  placeholder={t("agePlaceholder", lang)}
                  style={styles.input}
                />
              </View>
              <View>
                <Text style={[styles.label, { marginBottom: 10 }]}>{t("diagnosis", lang)} {t("selectAllThatApply", lang)}</Text>
                <View style={styles.tagWrap}>
                  {ALL_DIAGNOSES.map((d) => {
                    const active = diagnoses.includes(d);
                    return (
                      <Pressable key={d} onPress={() => toggleDiagnosis(d)} style={[styles.tag, active && styles.tagActive]}>
                        <Text style={[styles.tagText, active && { color: "white" }]}>{diagnosisLabel(d, DIAGNOSIS_LABELS[d], lang)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <BigButton variant="primary" disabled={!name.trim() || !age} onPress={() => setStep("camera")} style={{ width: "100%", marginTop: 8 }}>
                {t("next", lang)} →
              </BigButton>
            </View>
          )}

          {step === "camera" && (
            <View style={styles.cameraStep}>
              <Text style={styles.stepLabel}>{stepLabels[capturePhase]}</Text>

              <View style={{ flexDirection: "row", gap: 8 }}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={[styles.dot, { backgroundColor: i <= capturePhase ? colors.forest : colors.border }]} />
                ))}
              </View>

              <View style={styles.cameraCircle}>
                {permission?.granted ? (
                  <CameraView
                    ref={cameraRef}
                    style={{ width: "100%", height: "100%" }}
                    facing="front"
                    onCameraReady={() => setStreaming(true)}
                  />
                ) : (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#1e293b" }}>
                    <Ionicons name="camera-outline" size={48} color="#94a3b8" />
                  </View>
                )}
              </View>

              {captureError && (
                <View style={{ alignItems: "center", gap: 6 }}>
                  <Text style={styles.errorText}>{t("faceCaptureFailed", lang)}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMid, textAlign: "center" }}>
                    Position face in good lighting, or skip this step to finish enrollment.
                  </Text>
                </View>
              )}

              <View style={{ width: "100%", gap: 10, marginTop: 4 }}>
                <BigButton variant="primary" onPress={capture} disabled={!permission?.granted || !streaming || isCapturing} style={{ width: "100%" }}>
                  📸 {isCapturing ? t("capturingEllipsis", lang) : capturePhase < 2 ? t("captureBtn", lang) : t("finishBtn", lang)}
                </BigButton>

                <BigButton variant="ghost" onPress={finishWithoutCamera} style={{ width: "100%" }}>
                  <Text style={{ color: colors.forest, fontWeight: "700" }}>{t("continueWithoutCamera", lang)}</Text>
                </BigButton>
              </View>
            </View>
          )}

          {step === "done" && (
            <View style={styles.doneStep}>
              <Text style={{ fontSize: 56 }}>🎉</Text>
              <Text style={styles.doneText}>
                <Text style={{ fontWeight: "800" }}>{name}</Text> {t("hasBeenAdded", lang)}
              </Text>
              <Text style={styles.doneSub}>{t("faceUnlockHint", lang)}</Text>
              <BigButton variant="mint" onPress={() => onDone(newChild ?? undefined)} style={{ width: "100%", maxWidth: 320 }}>
                {newChild ? `${t("startWithChild", lang)} ${newChild.name} →` : t("doneCheck", lang)}
              </BigButton>
              <Pressable onPress={handleAddAnother} style={{ paddingVertical: 10 }}>
                <Text style={{ color: colors.textMid, fontSize: 14 }}>{t("addAnotherChild", lang)}</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", padding: 20, paddingTop: 28, gap: 20 },
  backText: { color: colors.textMid, fontSize: 16 },
  title: { fontSize: 24, fontWeight: "800", color: colors.textDark, textAlign: "center" },
  form: { width: "100%", maxWidth: 440, gap: 16 },
  label: { fontWeight: "700", fontSize: 15, color: colors.textMid, marginBottom: 6 },
  input: { width: "100%", paddingVertical: 14, paddingHorizontal: 16, borderRadius: radius, borderWidth: 2, borderColor: colors.border, fontSize: 17 },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderColor: colors.border, backgroundColor: "white" },
  tagActive: { borderColor: colors.forest, backgroundColor: colors.forest },
  tagText: { fontSize: 13, fontWeight: "600", color: colors.textMid },
  cameraStep: { alignItems: "center", gap: 16, width: "100%", maxWidth: 380 },
  stepLabel: { color: colors.textMid, textAlign: "center", fontSize: 16 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  cameraCircle: { width: 240, height: 240, borderRadius: 120, overflow: "hidden", borderWidth: 4, borderColor: colors.forest, backgroundColor: "#222" },
  doneStep: { alignItems: "center", gap: 20 },
  doneText: { fontSize: 20, color: colors.textDark, textAlign: "center" },
  doneSub: { color: colors.textMid, textAlign: "center" },
  errorText: { color: "#c45", fontSize: 13, textAlign: "center" },
});
