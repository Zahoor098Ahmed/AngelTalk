import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { Ionicons } from "@expo/vector-icons";
import type { ChildProfile, DiagnosisType, ContentTag } from "../types";
import { DIAGNOSIS_LABELS } from "../types";
import { describeFace, ensureFaceAI, FACE_AI_VERSION, type FaceIssue } from "../modules/faceAI";
import { addChild, defaultTags } from "../modules/storage";
import { useSettings } from "../context/SettingsContext";
import { t, diagnosisLabel } from "../modules/i18n";
import { speak } from "../modules/tts";
import Mascot from "../components/Mascot";
import BigButton from "../components/BigButton";
import { colors, radius } from "../theme";
import { useScreenScale } from "../modules/responsive";

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
  const shotsRef = useRef<number[][]>([]);
  const [faceIssue, setFaceIssue] = useState<FaceIssue | null>(null);

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
      const result = await describeFace(photo.uri);
      if (!("descriptor" in result)) {
        setFaceIssue(result.issue);
        setCaptureError(true);
        return;
      }
      setFaceIssue(null);

      shotsRef.current.push(result.descriptor);

      if (capturePhase < 2) {
        setCapturePhase((p) => p + 1);
      } else {
        const shots = shotsRef.current;
        setCaptured(true);

        // Generate a tiny 96x96 avatar thumbnail (~3KB) to prevent storage quota exhaustion
        let avatarUri: string | undefined = photo.uri;
        try {
          const thumb = await ImageManipulator.manipulateAsync(
            photo.uri,
            [{ resize: { width: 96, height: 96 } }],
            { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
          );
          if (thumb?.uri) avatarUri = thumb.uri;
        } catch {
          // fallback to photo.uri
        }

        const allowedTags: ContentTag[] = defaultTags;
        const child: ChildProfile = {
          id: Date.now().toString(),
          name: name.trim(),
          age: parseInt(age, 10) || 5,
          diagnoses,
          allowedTags,
          embedding: [],
          faceDescriptors: shots,
          faceVersion: FACE_AI_VERSION,
          photoUrl: avatarUri,
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
    shotsRef.current = [];
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

  // Start loading the face AI before the first Capture tap
  useEffect(() => {
    if (step === "camera") ensureFaceAI().catch(() => {});
  }, [step]);
  const { s, camSize } = useScreenScale();
  const contentMax = Math.min(680, 440 * s);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={{ width: "100%", maxWidth: contentMax }}>
            <Pressable
              onPress={() => {
                if (step === "camera") {
                  setStep("info");
                } else {
                  onBack();
                }
              }}
            >
              <Text style={[styles.backText, { fontSize: 16 * s }]}>← {t("back", lang)}</Text>
            </Pressable>
          </View>

          {/* Centred body fills the screen height */}
          <View style={[styles.body, { gap: 20 * s }]}>
          <Mascot mood={step === "done" ? "love" : "happy"} size={Math.round(70 * s)} />
          <Text style={[styles.title, { fontSize: 24 * s }]}>{step === "info" ? t("addChild", lang) : step === "camera" ? t("enrollFace", lang) : t("childAdded", lang)}</Text>

          {step === "info" && (
            <View style={[styles.form, { maxWidth: contentMax, gap: 16 * s }]}>
              <View>
                <Text style={[styles.label, { fontSize: 15 * s }]}>{t("childName", lang)}</Text>
                <TextInput value={name} onChangeText={setName} placeholder={t("namePlaceholder", lang)} style={[styles.input, { fontSize: 17 * s, paddingVertical: 14 * s }]} />
              </View>
              <View>
                <Text style={[styles.label, { fontSize: 15 * s }]}>{t("childAge", lang)}</Text>
                <TextInput
                  value={age}
                  onChangeText={setAge}
                  keyboardType="number-pad"
                  placeholder={t("agePlaceholder", lang)}
                  style={[styles.input, { fontSize: 17 * s, paddingVertical: 14 * s }]}
                />
              </View>
              <View>
                <Text style={[styles.label, { marginBottom: 10, fontSize: 15 * s }]}>{t("diagnosis", lang)} {t("selectAllThatApply", lang)}</Text>
                <View style={styles.tagWrap}>
                  {ALL_DIAGNOSES.map((d) => {
                    const active = diagnoses.includes(d);
                    return (
                      <Pressable
                        key={d}
                        onPress={() => toggleDiagnosis(d)}
                        style={[styles.tag, { paddingVertical: 8 * s, paddingHorizontal: 14 * s }, active && styles.tagActive]}
                      >
                        <Text style={[styles.tagText, { fontSize: 13 * s }, active && { color: "white" }]}>{diagnosisLabel(d, DIAGNOSIS_LABELS[d], lang)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <BigButton variant="primary" disabled={!name.trim() || !age} onPress={() => setStep("camera")} style={{ width: "100%", marginTop: 8, minHeight: 64 * s }} textStyle={{ fontSize: 18 * s }}>
                {t("next", lang)} →
              </BigButton>
            </View>
          )}

          {step === "camera" && (
            <View style={[styles.cameraStep, { maxWidth: Math.max(380 * s, camSize + 40), gap: 16 * s }]}>
              <Text style={[styles.stepLabel, { fontSize: 16 * s }]}>{stepLabels[capturePhase]}</Text>

              <View style={{ flexDirection: "row", gap: 8 }}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={[styles.dot, { backgroundColor: i <= capturePhase ? colors.forest : colors.border }]} />
                ))}
              </View>

              <View style={[styles.cameraCircle, { width: camSize, height: camSize, borderRadius: camSize / 2 }]}>
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
                <View style={[styles.errorBox, { padding: 12 * s, gap: 6 * s }]}>
                  <Text style={[styles.errorText, { fontSize: 16 * s }]}>⚠️ {t("faceCaptureFailed", lang)}</Text>
                  <Text style={{ fontSize: 14 * s, color: colors.textMid, textAlign: "center", lineHeight: 20 * s }}>
                    {faceIssue === "noFace"
                      ? lang === "ar-SA"
                        ? "لم يتم العثور على وجه. ضع الوجه في منتصف الدائرة واقترب قليلاً."
                        : lang === "ur-PK"
                        ? "چہرہ نہیں ملا۔ چہرہ دائرے کے بیچ میں لائیں اور تھوڑا قریب آئیں۔"
                        : "No face found. Bring the face to the middle of the circle and come a little closer."
                      : faceIssue === "notReady"
                      ? lang === "ar-SA"
                        ? "نظام التعرف على الوجه لم يجهز بعد. انتظر لحظة وحاول مرة أخرى."
                        : lang === "ur-PK"
                        ? "چہرہ پہچاننے کا نظام ابھی تیار نہیں۔ ایک لمحہ رکیں اور دوبارہ کوشش کریں۔"
                        : "Face recognition is still getting ready. Wait a moment and try again."
                      : lang === "ar-SA"
                      ? "انظر مباشرة إلى الكاميرا مع إضاءة جيدة على الوجه، أو تخطَّ هذه الخطوة."
                      : lang === "ur-PK"
                      ? "سیدھا کیمرے کی طرف دیکھیں اور چہرے پر اچھی روشنی ہو، یا یہ مرحلہ چھوڑ دیں۔"
                      : "Look straight at the camera with good light on the face, or skip this step to finish enrollment."}
                  </Text>
                </View>
              )}

              <View style={{ width: "100%", gap: 10, marginTop: 4 }}>
                <BigButton variant="primary" onPress={capture} disabled={!permission?.granted || !streaming || isCapturing} style={{ width: "100%", minHeight: 64 * s }} textStyle={{ fontSize: 18 * s }}>
                  📸 {isCapturing ? t("capturingEllipsis", lang) : capturePhase < 2 ? t("captureBtn", lang) : t("finishBtn", lang)}
                </BigButton>

                <BigButton variant="ghost" onPress={finishWithoutCamera} style={{ width: "100%", minHeight: 56 * s }}>
                  <Text style={{ color: colors.forest, fontWeight: "700", fontSize: 15 * s }}>{t("continueWithoutCamera", lang)}</Text>
                </BigButton>
              </View>
            </View>
          )}

          {step === "done" && (
            <View style={[styles.doneStep, { gap: 20 * s, width: "100%", maxWidth: contentMax }]}>
              <Text style={{ fontSize: 56 * s }}>🎉</Text>
              <Text style={[styles.doneText, { fontSize: 20 * s }]}>
                <Text style={{ fontWeight: "800" }}>{name}</Text> {t("hasBeenAdded", lang)}
              </Text>
              <Text style={[styles.doneSub, { fontSize: 14 * s }]}>{t("faceUnlockHint", lang)}</Text>
              <BigButton
                variant="mint"
                onPress={() => onDone(newChild ?? undefined)}
                style={{ width: "100%", maxWidth: 320 * s, minHeight: 64 * s }}
                textStyle={{ fontSize: 18 * s }}
              >
                {newChild ? `${t("startWithChild", lang)} ${newChild.name} →` : t("doneCheck", lang)}
              </BigButton>
              <Pressable onPress={handleAddAnother} style={{ paddingVertical: 10 }}>
                <Text style={{ color: colors.textMid, fontSize: 14 * s }}>{t("addAnotherChild", lang)}</Text>
              </Pressable>
            </View>
          )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: "center", padding: 20, paddingTop: 20 },
  body: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center", paddingVertical: 12 },
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
  errorText: { color: "#c45", fontSize: 13, fontWeight: "800", textAlign: "center" },
  errorBox: {
    width: "100%",
    alignItems: "center",
    borderRadius: radius,
    borderWidth: 1.5,
    borderColor: "#f3c4c4",
    backgroundColor: "#fff5f5",
  },
});
