import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Modal,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import type { ChildProfile } from "../types";
import { loadChildren, deleteChild } from "../modules/storage";
import { captureEmbedding, findMatch, normalize, EMBEDDING_DIMENSION } from "../modules/faceEngine";
import { useSettings } from "../context/SettingsContext";
import { t } from "../modules/i18n";
import { speak } from "../modules/tts";
import Mascot from "../components/Mascot";
import BigButton from "../components/BigButton";
import { colors, radius, radiusSm } from "../theme";

interface Props {
  onMatch: (child: ChildProfile) => void;
  onNoMatch: () => void;
  onParentArea: () => void;
  onAdminPortal?: () => void;
  onEnrollChild?: () => void;
}

type Phase = "scanning" | "found" | "nomatch" | "error";

export default function FaceScanScreen({ onMatch, onNoMatch, onParentArea, onAdminPortal, onEnrollChild }: Props) {
  const { settings } = useSettings();
  const lang = settings.language;
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [phase, setPhase] = useState<Phase>("scanning");
  const [statusMsg, setStatusMsg] = useState<string>(() => t("positionFaceHint", lang));
  const [foundName, setFoundName] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [facing, setFacing] = useState<"front" | "back">("front");
  const [childSelectModal, setChildSelectModal] = useState(false);
  const [childrenList, setChildrenList] = useState<ChildProfile[]>([]);
  const [scanAttempt, setScanAttempt] = useState(1);

  // Scan line animation
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setChildrenList(loadChildren());
  }, []);

  useEffect(() => {
    if (phase === "scanning" && !settings.reduceMotion) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanAnim.stopAnimation();
    }
  }, [phase, settings.reduceMotion]);

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) {
      requestPermission();
      return;
    }
    if (!streaming) return;

    let cancelled = false;

    async function runMultiPassScan() {
      setPhase("scanning");
      setStatusMsg(t("holdSteadyHint", lang));
      speak(t("scanning", lang), lang, settings.soundEnabled);

      await new Promise((r) => setTimeout(r, 1000));
      if (cancelled || !cameraRef.current) return;

      const children = loadChildren();
      setChildrenList(children);
      if (children.length === 0) {
        // No enrolled children yet
        setPhase("nomatch");
        setStatusMsg(t("noChildEnrolled", lang));
        return;
      }

      const hasCompatibleEmbeddings = children.some(
        (c) => c.embedding && c.embedding.length === EMBEDDING_DIMENSION
      );
      if (!hasCompatibleEmbeddings) {
        console.warn("[FaceScan] Enrolled profiles have legacy face embeddings. Re-enrollment required.");
        setPhase("nomatch");
        setStatusMsg("Face profile update required. Tap Add Child to re-enroll face.");
        speak("Please re-enroll face to continue", lang, settings.soundEnabled);
        return;
      }

      // Perform up to 3 scanning passes (total ~5-6 seconds)
      for (let pass = 1; pass <= 3; pass++) {
        if (cancelled || !cameraRef.current) return;
        setScanAttempt(pass);
        setStatusMsg(pass === 1 ? t("checkingFaceEllipsis", lang) : t("adjustingLighting", lang).replace("{n}", String(pass)));

        try {
          // Take 2 quick shots per pass and merge embeddings
          let embedding: number[] | null = null;
          for (let shot = 0; shot < 2; shot++) {
            if (cancelled || !cameraRef.current) return;
            const photo = await cameraRef.current.takePictureAsync({
              quality: 0.6,
              skipProcessing: true,
            });
            if (cancelled) return;
            if (!photo?.uri) continue;

            const dims = photo.width && photo.height ? { width: photo.width, height: photo.height } : undefined;
            const emb = await captureEmbedding(photo.uri, dims);
            if (emb.length === 0) continue;
            embedding = embedding ? embedding.map((v, i) => (v + emb[i]) / 2) : emb;
            if (shot < 1) await new Promise((r) => setTimeout(r, 180));
          }

          if (embedding) {
            const normalized = normalize(embedding);
            const match = findMatch(normalized, children);
            if (match) {
              setFoundName(match.child.name);
              setPhase("found");
              setStatusMsg(t("welcomeBack", lang).replace("{name}", match.child.name));
              speak(`${t("hello", lang)}, ${match.child.name}!`, lang, settings.soundEnabled);
              await new Promise((r) => setTimeout(r, 1100));
              if (!cancelled) onMatch(match.child);
              return;
            }
          }
        } catch (err) {
          console.warn("[FaceScan] pass error:", err);
        }

        // Brief pause before next pass
        if (pass < 3) await new Promise((r) => setTimeout(r, 600));
      }

      if (!cancelled) {
        setPhase("nomatch");
        setStatusMsg(t("noMatch", lang));
        speak(t("noMatch", lang), lang, settings.soundEnabled);
      }
    }

    runMultiPassScan();

    return () => {
      cancelled = true;
    };
  }, [permission?.granted, streaming, facing]);

  function restartScan() {
    setChildrenList(loadChildren());
    setPhase("scanning");
    setStreaming(false);
    setTimeout(() => setStreaming(true), 200);
  }

  function handleManualSelect(child: ChildProfile) {
    setChildSelectModal(false);
    speak(`${t("hello", lang)}, ${child.name}!`, lang, settings.soundEnabled);
    onMatch(child);
  }

  function handleDeleteChild(e: any, childId: string) {
    e?.stopPropagation?.();
    deleteChild(childId);
    setChildrenList(loadChildren());
  }

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t("morning", lang)
      : hour < 17
      ? t("afternoon", lang)
      : hour < 21
      ? t("evening", lang)
      : t("night", lang);

  const cameraReady = permission?.granted === true;
  const cameraUnavailable = permission?.granted === false;

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-110, 110],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ alignItems: "center" }}>
        <Text style={styles.greeting}>{greeting} 👋</Text>
        <Text style={styles.title}>{t("appName", lang)}</Text>
      </View>

      {/* Camera circular frame */}
      <View style={[styles.cameraWrap, phase === "found" && { borderColor: colors.greenDeep }]}>
        {cameraReady ? (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            onCameraReady={() => setStreaming(true)}
          />
        ) : (
          <View style={[styles.camera, { backgroundColor: "#1e293b", alignItems: "center", justifyContent: "center" }]}>
            <Ionicons name="camera-outline" size={48} color="#94a3b8" />
          </View>
        )}

        {/* Dynamic scanning laser / reticle */}
        {phase === "scanning" && !settings.reduceMotion && (
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [{ translateY: scanTranslateY }],
              },
            ]}
          />
        )}

        {/* Circular reticle guide */}
        <View style={styles.reticleGuide} pointerEvents="none" />

        {phase === "found" && (
          <View style={[styles.overlay, { backgroundColor: "rgba(45,95,79,0.88)" }]}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={38} color="white" />
            </View>
            <Text style={styles.overlayName}>{foundName}</Text>
          </View>
        )}

        {phase === "nomatch" && (
          <View style={[styles.overlay, { backgroundColor: "rgba(30,41,59,0.85)" }]}>
            <Text style={{ fontSize: 42 }}>😊</Text>
            <Text style={styles.overlayText}>{t("didntCatchFace", lang)}</Text>
          </View>
        )}

        {(phase === "error" || cameraUnavailable) && (
          <View style={[styles.overlay, { backgroundColor: "rgba(239,68,68,0.85)" }]}>
            <Ionicons name="alert-circle-outline" size={38} color="white" />
            <Text style={styles.overlayText}>{t("cameraNotAvailable", lang)}</Text>
          </View>
        )}

        {/* Flip camera button */}
        {cameraReady && phase === "scanning" && (
          <Pressable
            onPress={() => setFacing((prev) => (prev === "front" ? "back" : "front"))}
            style={styles.flipBtn}
            hitSlop={8}
          >
            <Ionicons name="camera-reverse-outline" size={20} color="white" />
          </Pressable>
        )}
      </View>

      <Mascot mood={phase === "found" ? "excited" : phase === "nomatch" ? "love" : "thinking"} size={84} />

      <View style={{ alignItems: "center", paddingHorizontal: 20 }}>
        <Text style={styles.statusText}>
          {phase === "scanning"
            ? t("scanningFaceEllipsis", lang)
            : phase === "found"
            ? `${t("matchFound", lang)} 🎉`
            : phase === "nomatch"
            ? t("lookedEverywhere", lang)
            : t("cameraUnavailableMsg", lang)}
        </Text>
        <Text style={styles.statusSub}>{statusMsg}</Text>

        {phase === "scanning" && (
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10, flexWrap: "wrap", justifyContent: "center" }}>
            {/* {childrenList.length > 0 && (
              <Pressable
                onPress={() => {
                  setChildrenList(loadChildren());
                  setChildSelectModal(true);
                }}
                style={styles.pillBtn}
              >
                <Ionicons name="people-circle" size={18} color={colors.forest} />
                <Text style={{ color: colors.forest, fontSize: 13, fontWeight: "700" }}>
                  {t("selectChildProfileBtn", lang)}
                </Text>
              </Pressable>
            )} */}
            <Pressable
              onPress={() => (onEnrollChild ? onEnrollChild() : onParentArea())}
              style={styles.pillBtnPrimary}
            >
              <Ionicons name="person-add" size={16} color="white" />
              <Text style={{ color: "white", fontSize: 13, fontWeight: "700" }}>
                {t("addChild", lang)}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Action buttons on nomatch or error */}
      {phase === "nomatch" && (
        <View style={{ width: "100%", maxWidth: 360, gap: 10, paddingHorizontal: 20 }}>
          {childrenList.length === 0 ? (
            <>
              <BigButton variant="mint" onPress={onEnrollChild ?? onParentArea} style={{ width: "100%" }}>
                <Ionicons name="person-add" size={18} color="white" style={{ marginRight: 6 }} />
                <Text style={styles.btnText}>{t("addChild", lang)}</Text>
              </BigButton>
              <BigButton variant="ghost" onPress={restartScan} style={{ width: "100%" }}>
                <Ionicons name="refresh" size={16} color={colors.forest} style={{ marginRight: 6 }} />
                <Text style={{ color: colors.forest, fontWeight: "700" }}>{t("scanAgainBtn", lang)}</Text>
              </BigButton>
            </>
          ) : (
            <>
              <BigButton variant="mint" onPress={restartScan} style={{ width: "100%" }}>
                <Ionicons name="refresh" size={18} color="white" style={{ marginRight: 6 }} />
                <Text style={styles.btnText}>{t("scanAgainBtn", lang)}</Text>
              </BigButton>
              {/* <BigButton
                variant="primary"
                onPress={() => {
                  setChildrenList(loadChildren());
                  setChildSelectModal(true);
                }}
                style={{ flex: 1 }}
              >
                <Ionicons name="person" size={18} color="white" style={{ marginRight: 6 }} />
                <Text style={styles.btnText}>{t("selectChildBtn", lang)}</Text>
              </BigButton> */}
              <BigButton
                variant="ghost"
                onPress={onEnrollChild ?? onParentArea}
                style={{ width: "100%", borderWidth: 1.5, borderColor: colors.forest }}
              >
                <Ionicons name="person-add" size={18} color={colors.forest} style={{ marginRight: 6 }} />
                <Text style={{ color: colors.forest, fontWeight: "700", fontSize: 15 }}>{t("addChild", lang)}</Text>
              </BigButton>
            </>
          )}
        </View>
      )}

      {(phase === "error" || cameraUnavailable) && (
        <View style={{ width: "100%", maxWidth: 360, gap: 10, paddingHorizontal: 20 }}>
          {/* {childrenList.length > 0 && (
            <BigButton
              variant="primary"
              onPress={() => {
                setChildrenList(loadChildren());
                setChildSelectModal(true);
              }}
              style={{ width: "100%" }}
            >
              <Ionicons name="person" size={18} color="white" style={{ marginRight: 6 }} />
              <Text style={styles.btnText}>{t("selectChildBtn", lang)}</Text>
            </BigButton>
          )} */}
          <BigButton variant="mint" onPress={onEnrollChild ?? onParentArea} style={{ width: "100%" }}>
            <Ionicons name="person-add" size={18} color="white" style={{ marginRight: 6 }} />
            <Text style={styles.btnText}>{t("addChild", lang)}</Text>
          </BigButton>
          <BigButton variant="ghost" onPress={onNoMatch} style={{ width: "100%" }}>
            <Text style={{ color: colors.forest, fontWeight: "700" }}>{t("continueWithoutCamera", lang)}</Text>
          </BigButton>
        </View>
      )}

      {/* Footer controls */}
      <View style={styles.footer}>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          <Pressable onPress={onEnrollChild ?? onParentArea} style={styles.parentBtn}>
            <Text style={styles.parentBtnText}>➕ {t("addChild", lang)}</Text>
          </Pressable>
          {/* {childrenList.length > 0 && (
            <Pressable
              onPress={() => {
                setChildrenList(loadChildren());
                setChildSelectModal(true);
              }}
              style={styles.parentBtn}
            >
              <Text style={styles.parentBtnText}>👤 {t("selectChildProfileBtn", lang)}</Text>
            </Pressable>
          )} */}
          <Pressable onPress={onParentArea} style={styles.parentBtn}>
            <Text style={styles.parentBtnText}>🔒 {t("parentPin", lang)}</Text>
          </Pressable>
          {onAdminPortal && (
            <Pressable
              onPress={onAdminPortal}
              style={[
                styles.parentBtn,
                { backgroundColor: "#0f172a", borderWidth: 1, borderColor: "#334155" },
              ]}
            >
              <Text style={[styles.parentBtnText, { color: "#10b981", fontWeight: "800" }]}>
                {t("adminPortalBtn", lang)}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Manual Child Profile Selection Modal */}
      {/*
      <Modal visible={childSelectModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("chooseChildProfileTitle", lang)}</Text>
              <Pressable onPress={() => setChildSelectModal(false)} hitSlop={10}>
                <Ionicons name="close-circle" size={26} color={colors.textLight} />
              </Pressable>
            </View>
            <Text style={styles.modalSub}>{t("tapChildProfileHint", lang)}</Text>

            <ScrollView contentContainerStyle={styles.childGrid} showsVerticalScrollIndicator={false}>
              {childrenList.map((child) => (
                <View key={child.id} style={styles.childCard}>
                  <Pressable
                    style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 14 }}
                    onPress={() => handleManualSelect(child)}
                  >
                    {child.photoUrl ? (
                      <Image source={{ uri: child.photoUrl }} style={styles.childAvatar} />
                    ) : (
                      <View style={[styles.childAvatar, styles.avatarPlaceholder]}>
                        <Text style={{ fontSize: 28 }}>👦</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.childName}>{child.name}</Text>
                      <Text style={styles.childMeta}>
                        {t("ageLabel", lang)} {child.age} · ⭐ {child.stars ?? 0}
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={(e) => handleDeleteChild(e, child.id)}
                    hitSlop={10}
                    style={{ padding: 8, borderRadius: 8, backgroundColor: "rgba(239, 68, 68, 0.08)" }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </Pressable>
                </View>
              ))}
              {childrenList.length === 0 && (
                <View style={{ alignItems: "center", paddingVertical: 18, gap: 8 }}>
                  <Text style={{ fontSize: 32 }}>👶</Text>
                  <Text style={{ color: colors.textLight, fontSize: 14 }}>{t("noChildEnrolled", lang)}</Text>
                </View>
              )}
            </ScrollView>

            <View style={{ marginTop: 14, gap: 8 }}>
              <BigButton
                variant="mint"
                onPress={() => {
                  setChildSelectModal(false);
                  if (onEnrollChild) {
                    onEnrollChild();
                  } else {
                    onParentArea();
                  }
                }}
                style={{ width: "100%" }}
              >
                <Ionicons name="person-add" size={18} color="white" style={{ marginRight: 6 }} />
                <Text style={styles.btnText}>+ {t("addChild", lang)}</Text>
              </BigButton>

              <BigButton variant="ghost" onPress={() => setChildSelectModal(false)} style={{ width: "100%" }}>
                <Text style={{ color: colors.textLight, fontWeight: "700" }}>{t("cancel", lang)}</Text>
              </BigButton>
            </View>
          </View>
        </View>
      </Modal>
      */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    padding: 24,
    paddingTop: 36,
    gap: 20,
  },
  greeting: { fontSize: 15, color: colors.textLight },
  title: { fontSize: 32, fontWeight: "800", color: colors.textDark, marginTop: 4 },
  cameraWrap: {
    width: 260,
    height: 260,
    borderRadius: 130,
    overflow: "hidden",
    borderWidth: 5,
    borderColor: colors.forest,
    backgroundColor: "#1e293b",
    position: "relative",
  },
  camera: { width: "100%", height: "100%" },
  scanLine: {
    position: "absolute",
    left: 10,
    right: 10,
    top: "50%",
    height: 3,
    backgroundColor: "#10b981",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    borderRadius: 2,
    zIndex: 10,
  },
  reticleGuide: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderRadius: 110,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    borderStyle: "dashed",
  },
  flipBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
    zIndex: 12,
  },
  checkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    zIndex: 20,
  },
  overlayName: { color: "white", fontSize: 22, fontWeight: "800" },
  overlayText: { color: "white", fontSize: 14, textAlign: "center", paddingHorizontal: 16 },
  statusText: { fontSize: 20, color: colors.textDark, fontWeight: "800", textAlign: "center" },
  statusSub: { color: colors.textLight, fontSize: 14, marginTop: 4, textAlign: "center" },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    maxWidth: 340,
    marginTop: 8,
  },
  btnText: { color: "white", fontWeight: "700", fontSize: 15 },
  footer: { marginTop: "auto", paddingBottom: 16 },
  parentBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.04)" },
  parentBtnText: { color: colors.textLight, fontSize: 13, fontWeight: "600" },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "white",
    borderRadius: radius,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: colors.textDark },
  modalSub: { fontSize: 13, color: colors.textLight, marginTop: 4, marginBottom: 16 },
  childGrid: { gap: 12 },
  childCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: radiusSm,
    padding: 12,
    gap: 14,
  },
  childAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#e2e8f0",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  childName: { fontSize: 17, fontWeight: "800", color: colors.textDark, flex: 1 },
  childMeta: { fontSize: 13, color: colors.textLight, fontWeight: "600" },
  pillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(45,95,79,0.1)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  pillBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.forest,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
});
