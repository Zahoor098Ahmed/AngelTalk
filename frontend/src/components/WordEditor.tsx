import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, Image, Modal, Alert, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import type { CustomWord, TileSize } from "../types";
import { addWord, updateWord, removeWord } from "../modules/customCategories";
import { startRecording, stopRecording, previewClip, deleteClip } from "../modules/audio";
import {
  searchImages,
  downloadTileImage,
  saveLocalTileImage,
  compressImageForTile,
  hasPixabayKey,
  type ImageHit,
  type ImageSource,
} from "../modules/imageSearch";
import { colors, radius, radiusSm } from "../theme";
import { useSettings } from "../context/SettingsContext";
import { t, canonicalWordEn } from "../modules/i18n";
import UniversalImagePickerModal from "./UniversalImagePickerModal";

interface Props {
  visible: boolean;
  catId: string;
  word: CustomWord | null; // null = adding
  onClose: () => void;
  onSaved: () => void;
}

const SIZES: TileSize[] = ["sm", "md", "lg"];
const TILE_COLORS = ["#2f6d62", "#e8b06a", "#b79ce0", "#e3d15b", "#9cc7ec", "#f0a8ad"];

export default function WordEditor({ visible, catId, word, onClose, onSaved }: Props) {
  const { settings } = useSettings();
  const lang = settings.language;
  const editing = !!word;
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("🔹");
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [audioUri, setAudioUri] = useState<string | undefined>();
  const [useTts, setUseTts] = useState(true);
  const [size, setSize] = useState<TileSize>("md");
  const [color, setColor] = useState<string>(TILE_COLORS[0]);
  const [hidden, setHidden] = useState(word?.hidden || false);

  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [universalPickerOpen, setUniversalPickerOpen] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (recording) {
      setRecSeconds(0);
      interval = setInterval(() => {
        setRecSeconds((s) => s + 1);
      }, 1000);
    } else {
      setRecSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recording]);

  useEffect(() => {
    if (!visible) return;
    setLabel(word?.label ?? "");
    setEmoji(word?.emoji ?? "🔹");
    setImageUri(word?.imageUri);
    setAudioUri(word?.audioUri);
    setUseTts(word?.useTextToSpeech ?? !word?.audioUri);
    setSize(word?.size ?? "md");
    setColor(word?.color ?? TILE_COLORS[0]);
    setHidden(word?.hidden || false);
    setRecording(false);
    setBusy(null);
  }, [visible, word]);

  const tempId = word?.id ?? `new_${Date.now()}`;

  async function pickFromCamera() {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return Alert.alert(t("weCameraPermission", lang) || "Camera permission is required");
      const res = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
      if (res.canceled || !res.assets || !res.assets[0]?.uri) return;
      const rawUri = res.assets[0].uri;
      setBusy(t("weSavingPhoto", lang) || "Saving photo…");
      const saved = await saveLocalTileImage(rawUri, tempId);
      setBusy(null);
      setImageUri(saved || rawUri);
    } catch (e) {
      setBusy(null);
      console.warn("Camera error:", e);
    }
  }

  async function pickFromGallery() {
    if (Platform.OS === "web") {
      try {
        const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
        if (!res.canceled && res.assets && res.assets[0]?.uri) {
          const compressed = await compressImageForTile(res.assets[0].uri);
          setImageUri(compressed);
          return;
        }
      } catch {
        // fallback
      }
      if (typeof document !== "undefined") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e: any) => {
          const file = e.target?.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = async () => {
            const result = reader.result as string;
            if (result) {
              const compressed = await compressImageForTile(result);
              setImageUri(compressed);
            }
          };
          reader.readAsDataURL(file);
        };
        input.click();
      }
      return;
    }

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return Alert.alert(t("weGalleryPermission", lang) || "Photo library permission is required");
      const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
      if (res.canceled || !res.assets || !res.assets[0]?.uri) return;
      const rawUri = res.assets[0].uri;
      setBusy(t("weSavingPicture", lang) || "Saving picture…");
      const saved = await saveLocalTileImage(rawUri, tempId);
      setBusy(null);
      setImageUri(saved || rawUri);
    } catch (e) {
      setBusy(null);
      console.warn("Gallery error:", e);
    }
  }

  async function chooseSearchImage(hit: ImageHit) {
    setSearchOpen(false);
    setBusy(t("weDownloading", lang) || "Downloading picture…");
    const saved = await downloadTileImage(hit.full, tempId);
    setBusy(null);
    setImageUri(saved || hit.full);
  }

  async function toggleRecord() {
    if (recording) {
      setBusy("Saving recorded voice…");
      const uri = await stopRecording(tempId);
      setBusy(null);
      setRecording(false);
      if (uri) {
        setAudioUri(uri);
        setUseTts(false);
      }
      return;
    }
    const ok = await startRecording();
    if (!ok) {
      return Alert.alert(
        "Microphone Access Needed",
        "Microphone permission is required to record voice. Please enable microphone permissions in your browser or device settings, or use 'Upload audio file'."
      );
    }
    setRecording(true);
  }

  function pickAudioFileWeb() {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (result) {
          setAudioUri(result);
          setUseTts(false);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  async function removeVoice() {
    await deleteClip(audioUri);
    setAudioUri(undefined);
    setUseTts(true);
  }

  function save() {
    const l = label.trim();
    if (!l) return Alert.alert(t("weTypeWordFirst", lang));
    const patch = {
      label: l,
      phrase: l,
      emoji,
      imageUri: imageUri || undefined,
      color,
      audioUri,
      useTextToSpeech: audioUri ? useTts : true,
      size,
      hidden,
      isCustom: true,
    };
    if (editing && word) updateWord(catId, word.id, patch);
    else addWord(catId, patch);
    onSaved();
    onClose();
  }

  function del() {
    if (!word) return;
    const confirmDelete = () => {
      deleteClip(word.audioUri);
      removeWord(catId, word.id);
      onSaved();
      onClose();
    };

    if (Platform.OS === "web") {
      const ok = typeof window !== "undefined" ? window.confirm(`Are you sure you want to delete "${word.label}"?`) : true;
      if (ok) confirmDelete();
      return;
    }

    Alert.alert(t("weDeleteWordTitle", lang).replace("{word}", word.label), undefined, [
      { text: t("cancel", lang), style: "cancel" },
      {
        text: t("weDelete", lang),
        style: "destructive",
        onPress: confirmDelete,
      },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.hbtn}>
              <Ionicons name="close" size={20} color="white" />
            </Pressable>
            <Text style={styles.htitle}>{editing ? t("weEditWord", lang) : t("weAddWord", lang)}</Text>
            {editing ? (
              <Pressable onPress={del} style={styles.hbtn}>
                <Ionicons name="trash-outline" size={18} color="white" />
              </Pressable>
            ) : (
              <View style={styles.hbtn} />
            )}
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>{t("weWordPhrase", lang)}</Text>
            <TextInput value={label} onChangeText={setLabel} placeholder={t("wePlaceholderWord", lang)} placeholderTextColor={colors.textLight} style={styles.input} />

            <Text style={styles.label}>{t("weTileColor", lang)}</Text>
            <View style={styles.colorRow}>
              {TILE_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[styles.colorSwatch, { backgroundColor: c }, color === c && styles.colorSwatchOn]}
                />
              ))}
            </View>

            <Text style={styles.label}>{t("wePicture", lang)}</Text>
            <View style={styles.previewRow}>
              <Pressable
                onPress={() => setUniversalPickerOpen(true)}
                style={styles.preview}
                accessibilityLabel="Choose picture"
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.previewImg} resizeMode="contain" />
                ) : (
                  <Text style={{ fontSize: 40 }}>{emoji}</Text>
                )}
                <View style={styles.previewBadge}>
                  <Ionicons name="camera" size={12} color="#FFFFFF" />
                </View>
              </Pressable>
              <View style={{ flex: 1, gap: 8 }}>
                <View style={styles.srcRow}>
                  <SrcBtn icon="images" label={t("weGallery", lang) || "Gallery"} onPress={pickFromGallery} />
                  <SrcBtn icon="camera" label={t("weCamera", lang) || "Camera"} onPress={pickFromCamera} />
                </View>
                <View style={styles.srcRow}>
                  <SrcBtn
                    icon="search"
                    label={t("weSearch", lang) || "Search / Library"}
                    onPress={() => setUniversalPickerOpen(true)}
                  />
                  {imageUri ? (
                    <SrcBtn icon="close-circle" label={t("weRemove", lang) || "Remove"} onPress={() => setImageUri(undefined)} />
                  ) : (
                    <View style={{ flex: 1 }} />
                  )}
                </View>
              </View>
            </View>
            {!imageUri && (
              <TextInput
                value={emoji}
                onChangeText={(v) => setEmoji(v.slice(0, 2) || "🔹")}
                placeholder={t("wePlaceholderEmoji", lang)}
                placeholderTextColor={colors.textLight}
                style={[styles.input, { marginTop: 8 }]}
              />
            )}

            <Text style={styles.label}>{t("weVoice", lang) || "Voice"}</Text>
            {recording ? (
              <View style={styles.recordingActiveContainer}>
                <View style={styles.recordingHeader}>
                  <View style={styles.pulsingRedDot} />
                  <Text style={styles.recordingTimerText}>
                    Recording... {Math.floor(recSeconds / 60)}:{(recSeconds % 60).toString().padStart(2, "0")}
                  </Text>
                </View>
                <Pressable onPress={toggleRecord} style={styles.stopRecordBtn}>
                  <Ionicons name="stop" size={18} color="#FFFFFF" />
                  <Text style={styles.stopRecordBtnText}>Stop & Save Voice</Text>
                </Pressable>
              </View>
            ) : audioUri ? (
              <View style={styles.recordedVoiceCard}>
                <View style={styles.recordedVoiceInfo}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.forest} />
                  <Text style={styles.recordedVoiceTitle}>Custom Voice Recorded</Text>
                </View>
                <View style={styles.voiceRow}>
                  <Pressable onPress={() => previewClip(audioUri)} style={styles.voiceBtn}>
                    <Ionicons name="volume-high" size={16} color={colors.forestDark} />
                    <Text style={styles.voiceBtnText}>{t("wePreview", lang) || "Preview"}</Text>
                  </Pressable>
                  <Pressable onPress={toggleRecord} style={styles.voiceBtn}>
                    <Ionicons name="mic" size={16} color={colors.forestDark} />
                    <Text style={styles.voiceBtnText}>{t("weReRecord", lang) || "Re-record"}</Text>
                  </Pressable>
                  <Pressable onPress={removeVoice} style={styles.voiceBtn}>
                    <Ionicons name="trash-outline" size={16} color={colors.pinkDeep} />
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                <Pressable onPress={toggleRecord} style={styles.recordBtn}>
                  <Ionicons name="mic" size={18} color="white" />
                  <Text style={styles.recordBtnText}>{t("weRecordVoice", lang) || "Record a voice"}</Text>
                </Pressable>
                {Platform.OS === "web" && (
                  <Pressable onPress={pickAudioFileWeb} style={styles.uploadAudioBtn}>
                    <Ionicons name="cloud-upload-outline" size={15} color={colors.forestDark} />
                    <Text style={styles.uploadAudioBtnText}>Upload audio file (.mp3, .wav, .m4a)</Text>
                  </Pressable>
                )}
              </View>
            )}
            <Text style={styles.voiceNote}>
              {audioUri && !useTts
                ? "The child hears your custom recorded voice clip."
                : "The child hears the built-in speaking voice."}
            </Text>
            {audioUri && (
              <Pressable onPress={() => setUseTts((v) => !v)} style={styles.ttsToggle}>
                <Ionicons name={useTts ? "checkbox" : "square-outline"} size={18} color={colors.forest} />
                <Text style={styles.ttsToggleText}>{t("weUseTtsInstead", lang) || "Use text-to-speech voice instead"}</Text>
              </Pressable>
            )}

            <Text style={styles.label}>{t("weTileSize", lang)}</Text>
            <View style={styles.sizeRow}>
              {SIZES.map((s) => (
                <Pressable key={s} onPress={() => setSize(s)} style={[styles.sizeBtn, size === s && styles.sizeBtnOn]}>
                  <Text style={[styles.sizeBtnText, size === s && { color: "white" }]}>{s.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>

            {/* Parent Control: Hide from child board */}
            <Pressable
              onPress={() => setHidden((v) => !v)}
              style={[
                styles.ttsToggle,
                {
                  marginTop: 14,
                  marginBottom: 10,
                  padding: 12,
                  backgroundColor: hidden ? "#FEF2F2" : "#F0FDF4",
                  borderRadius: radiusSm,
                  borderWidth: 1,
                  borderColor: hidden ? "#FCA5A5" : "#BBF7D0",
                },
              ]}
            >
              <Ionicons
                name={hidden ? "eye-off" : "eye-outline"}
                size={20}
                color={hidden ? "#DC2626" : colors.forest}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.ttsToggleText,
                    { color: hidden ? "#991B1B" : colors.textDark, fontWeight: "700" },
                  ]}
                >
                  {hidden ? "Hidden from Child Board" : "Visible on Child Board"}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>
                  {hidden
                    ? "This word tile will not show on the child's AAC Talk screen."
                    : "Tap to hide this word tile from the child's AAC Talk screen."}
                </Text>
              </View>
            </Pressable>

            <Pressable onPress={save} style={styles.saveBtn}>
              <Ionicons name="checkmark" size={18} color="white" />
              <Text style={styles.saveBtnText}>{editing ? t("weSaveChanges", lang) : t("weAddToBoard", lang)}</Text>
            </Pressable>
          </ScrollView>

          {busy && (
            <View style={styles.busyOverlay}>
              <ActivityIndicator color="white" />
              <Text style={styles.busyText}>{busy}</Text>
            </View>
          )}
        </SafeAreaView>

        <UniversalImagePickerModal
          visible={universalPickerOpen}
          title={`Picture for "${label || "Word"}"`}
          currentImageUri={imageUri}
          defaultSearchTerm={label}
          onSelectImage={(uri) => {
            setImageUri(uri);
            setUniversalPickerOpen(false);
          }}
          onRemoveImage={() => {
            setImageUri(undefined);
            setUniversalPickerOpen(false);
          }}
          onClose={() => setUniversalPickerOpen(false)}
        />

        <ImageSearchModal
          visible={searchOpen}
          seed={label}
          onClose={() => setSearchOpen(false)}
          onPick={chooseSearchImage}
        />
      </View>
    </Modal>
  );
}

function SrcBtn({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.srcBtn}>
      <Ionicons name={icon} size={16} color={colors.forestDark} />
      <Text style={styles.srcBtnText}>{label}</Text>
    </Pressable>
  );
}

function ImageSearchModal({
  visible,
  seed,
  onClose,
  onPick,
}: {
  visible: boolean;
  seed: string;
  onClose: () => void;
  onPick: (h: ImageHit) => void;
}) {
  const { settings } = useSettings();
  const lang = settings.language;
  const [term, setTerm] = useState("");
  const [source, setSource] = useState<ImageSource>("arasaac");
  const [hits, setHits] = useState<ImageHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      const q = (seed || "").trim();
      setTerm(q);
      setHits([]);
      setErr(null);
      if (q) {
        const enQuery = canonicalWordEn(q) || q;
        run("arasaac", enQuery);
      }
    }
  }, [visible, seed]);

  async function run(src: ImageSource, q?: string) {
    setSource(src);
    const query = (q !== undefined ? q : term).trim();
    if (!query) {
      setHits([]);
      return;
    }
    setLoading(true);
    setErr(null);
    const enQuery = canonicalWordEn(query) || query;
    const res = await searchImages(enQuery, src);
    setLoading(false);
    setHits(res.hits);
    setErr(res.error ?? null);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.hbtn}>
              <Ionicons name="arrow-back" size={20} color="white" />
            </Pressable>
            <Text style={styles.htitle}>{t("weFindPicture", lang)}</Text>
            <View style={styles.hbtn} />
          </View>

          <View style={styles.searchBar}>
            <TextInput
              value={term}
              onChangeText={setTerm}
              placeholder={t("wePlaceholderSearch", lang)}
              placeholderTextColor={colors.textLight}
              style={styles.searchInput}
              onSubmitEditing={() => run(source, term)}
              returnKeyType="search"
            />
            <Pressable onPress={() => run(source, term)} style={styles.searchGo}>
              <Ionicons name="search" size={18} color="white" />
            </Pressable>
          </View>

          <View style={styles.tabContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabRow}
            >
              <Pressable onPress={() => run("arasaac", term)} style={[styles.tab, source === "arasaac" && styles.tabOn]}>
                <Text style={[styles.tabText, source === "arasaac" && styles.tabTextOn]}>ARASAAC</Text>
              </Pressable>
              <Pressable onPress={() => run("opensymbols", term)} style={[styles.tab, source === "opensymbols" && styles.tabOn]}>
                <Text style={[styles.tabText, source === "opensymbols" && styles.tabTextOn]}>{t("weSourceOpenSymbols", lang)}</Text>
              </Pressable>
              <Pressable onPress={() => run("mulberry", term)} style={[styles.tab, source === "mulberry" && styles.tabOn]}>
                <Text style={[styles.tabText, source === "mulberry" && styles.tabTextOn]}>Mulberry</Text>
              </Pressable>
              <Pressable onPress={() => run("pixabay", term)} style={[styles.tab, source === "pixabay" && styles.tabOn]}>
                <Text style={[styles.tabText, source === "pixabay" && styles.tabTextOn]}>{hasPixabayKey() ? t("photos", lang) : t("weSourcePhotosKey", lang)}</Text>
              </Pressable>
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.hitGrid}>
            {loading && (
              <View style={{ width: "100%", alignItems: "center", marginTop: 36, gap: 8 }}>
                <ActivityIndicator size="large" color={colors.forest} />
                <Text style={{ fontSize: 13, color: colors.textMid, fontWeight: "600" }}>Searching images...</Text>
              </View>
            )}
            {err && <Text style={styles.hitErr}>{err}</Text>}
            {!loading && !err && hits.length === 0 && (
              <View style={{ width: "100%", alignItems: "center", marginTop: 45, paddingHorizontal: 20 }}>
                <Ionicons name="images-outline" size={46} color={colors.textLight} />
                <Text style={{ fontSize: 14, color: colors.textMid, fontWeight: "700", marginTop: 10 }}>
                  No pictures found for "{term}"
                </Text>
                <Text style={{ fontSize: 12.5, color: colors.textLight, marginTop: 4, textAlign: "center" }}>
                  Try switching to ARASAAC, OpenSymbols, or Mulberry tab above.
                </Text>
              </View>
            )}
            {hits.map((h) => (
              <Pressable key={h.id} onPress={() => onPick(h)} style={styles.hit}>
                <Image source={{ uri: h.thumb }} style={styles.hitImg} resizeMode="contain" />
                {h.repo && (
                  <View style={styles.hitBadge}>
                    <Text style={styles.hitBadgeText} numberOfLines={1}>{h.repo}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.forest,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hbtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  htitle: { color: "white", fontSize: 17, fontWeight: "800" },
  body: { padding: 20, gap: 8, paddingBottom: 50 },
  label: { fontSize: 13, fontWeight: "800", color: colors.textMid, marginTop: 14, letterSpacing: 0.5 },
  input: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: radius, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textDark },
  colorRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  colorSwatch: { width: 32, height: 32, borderRadius: 8, borderWidth: 2, borderColor: "transparent" },
  colorSwatchOn: { borderColor: colors.textDark },
  previewRow: { flexDirection: "row", gap: 12, marginTop: 6 },
  preview: { width: 92, height: 92, borderRadius: radius, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" },
  previewBadge: { position: "absolute", bottom: 4, right: 4, backgroundColor: "rgba(35, 94, 80, 0.88)", width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  previewImg: { width: "100%", height: "100%" },
  srcRow: { flexDirection: "row", gap: 8 },
  srcBtn: { flex: 1, flexDirection: "row", gap: 5, alignItems: "center", justifyContent: "center", backgroundColor: colors.forestLight, borderRadius: 12, paddingVertical: 10 },
  srcBtnText: { color: colors.forestDark, fontWeight: "700", fontSize: 12 },
  voiceRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  voiceBtn: { flexDirection: "row", gap: 5, alignItems: "center", backgroundColor: colors.forestLight, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  voiceBtnText: { color: colors.forestDark, fontWeight: "700", fontSize: 12 },
  recordBtn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.forest, borderRadius: radius, paddingVertical: 13, marginTop: 6 },
  recordBtnOn: { backgroundColor: colors.pinkDeep },
  recordBtnText: { color: "white", fontWeight: "800", fontSize: 14 },
  uploadAudioBtn: { flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", backgroundColor: "#EAF3EF", borderRadius: radius, paddingVertical: 10, borderWidth: 1, borderColor: "#B2D7C8" },
  uploadAudioBtnText: { color: colors.forestDark, fontWeight: "700", fontSize: 12.5 },
  recordingActiveContainer: { backgroundColor: "#FFF0F2", borderWidth: 2, borderColor: colors.pinkDeep, borderRadius: radius, padding: 14, marginTop: 6, gap: 10 },
  recordingHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  pulsingRedDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.pinkDeep },
  recordingTimerText: { color: colors.pinkDeep, fontWeight: "800", fontSize: 14 },
  stopRecordBtn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.pinkDeep, borderRadius: 10, paddingVertical: 12 },
  stopRecordBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  recordedVoiceCard: { backgroundColor: "#EBF5F0", borderWidth: 1.5, borderColor: "#A5D6B7", borderRadius: radius, padding: 12, marginTop: 6, gap: 8 },
  recordedVoiceInfo: { flexDirection: "row", alignItems: "center", gap: 6 },
  recordedVoiceTitle: { color: colors.forestDark, fontWeight: "800", fontSize: 13 },
  voiceNote: { fontSize: 11.5, color: colors.textLight, marginTop: 6 },
  ttsToggle: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 8 },
  ttsToggleText: { fontSize: 12.5, color: colors.textMid },
  sizeRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  sizeBtn: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  sizeBtnOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  sizeBtnText: { fontWeight: "800", fontSize: 13, color: colors.textMid },
  saveBtn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.forest, borderRadius: radius, paddingVertical: 16, marginTop: 24 },
  saveBtnText: { color: "white", fontWeight: "800", fontSize: 15 },
  busyOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, top: 0, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", gap: 10 },
  busyText: { color: "white", fontWeight: "600" },
  searchBar: { flexDirection: "row", gap: 8, padding: 16 },
  searchInput: { flex: 1, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: radius, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.textDark },
  searchGo: { width: 46, borderRadius: radius, backgroundColor: colors.forest, alignItems: "center", justifyContent: "center" },
  tabContainer: {
    height: 48,
    marginBottom: 8,
  },
  tabRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    height: 48,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cardMuted,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tabOn: {
    backgroundColor: colors.forest,
  },
  tabText: {
    fontWeight: "700",
    fontSize: 13,
    color: colors.textMid,
  },
  tabTextOn: {
    color: "#FFFFFF",
  },
  hitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    padding: 16,
  },
  hit: {
    width: "31%",
    aspectRatio: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  hitImg: {
    width: "88%",
    height: "88%",
  },
  hitBadge: {
    position: "absolute",
    bottom: 3,
    right: 3,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  hitBadgeText: {
    color: "#ffffff",
    fontSize: 8.5,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  hitErr: {
    color: colors.textMid,
    fontSize: 13,
    padding: 20,
    width: "100%",
    textAlign: "center",
  },
});
