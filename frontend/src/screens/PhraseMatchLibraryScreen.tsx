import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Modal, TextInput, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSettings } from "../context/SettingsContext";
import { t, type TKey } from "../modules/i18n";
import { speak } from "../modules/tts";
import {
  ensurePhraseLibraryLoaded,
  listPhraseMatches,
  listCategories,
  filterPhraseMatches,
  createPhraseMatch,
  updatePhraseMatch,
  deletePhraseMatch,
  importImage,
  phraseStats,
  type PhraseLevel,
} from "../modules/phraseMatch";
import type { PhraseMatch } from "../types";
import { colors, radius } from "../theme";
import BigButton from "../components/BigButton";

interface Props {
  onBack: () => void;
}

type LevelFilter = PhraseLevel | 0;

export default function PhraseMatchLibraryScreen({ onBack }: Props) {
  const { settings } = useSettings();
  const lang = settings.language;
  const tt = (k: TKey) => t(k, lang);

  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editing, setEditing] = useState<PhraseMatch | null>(null);

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>(0);

  const [fLabel, setFLabel] = useState("");
  const [fCat, setFCat] = useState("");
  const [fLevel, setFLevel] = useState<PhraseLevel>(1);
  const [fTriggers, setFTriggers] = useState("");
  const [fImage, setFImage] = useState<string>("");
  const [fBook, setFBook] = useState("");
  const [fLicense, setFLicense] = useState("");

  useEffect(() => {
    ensurePhraseLibraryLoaded().then(() => {
      setReady(true);
      setTick((t) => t + 1);
    });
  }, []);

  const all = useMemo(() => (ready ? listPhraseMatches() : []), [ready, tick]);
  const categories = useMemo(() => (ready ? listCategories() : []), [ready, tick]);
  const stats = useMemo(() => (ready ? phraseStats() : { total: 0, perLevel: {} as Record<number, number>, perCategory: {} as Record<string, number>, matched: 0 }), [ready, tick]);

  const filtered = useMemo(() => {
    if (!ready) return [];
    return filterPhraseMatches({
      category: catFilter,
      level: levelFilter === 0 ? null : levelFilter,
      search: search || undefined,
    });
  }, [ready, tick, catFilter, levelFilter, search]);

  function openNew() {
    setEditing(null);
    setFLabel("");
    setFCat("");
    setFLevel(2);
    setFTriggers("");
    setFImage("");
    setFBook("");
    setFLicense("");
    setEditorVisible(true);
  }

  const [deleteTarget, setDeleteTarget] = useState<PhraseMatch | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function openEdit(p: PhraseMatch) {
    setEditing(p);
    setFLabel(p.label);
    setFCat(p.category);
    setFLevel(p.level);
    setFTriggers(p.triggerPhrases.join(", "));
    setFImage(p.imagePath);
    setFBook(p.bookSource ?? "");
    setFLicense(p.licenseRef ?? "");
    setEditorVisible(true);
  }

  async function pickImage() {
    try {
      const r = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!r.granted) return setNotice(tt("pmGalleryPermission"));
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      if (res.canceled) return;
      const asset = res.assets[0];
      setFImage(asset.uri);
    } catch {
      setNotice(tt("pmGalleryPermission"));
    }
  }

  async function takePhoto() {
    try {
      const r = await ImagePicker.requestCameraPermissionsAsync();
      if (!r.granted) return setNotice(tt("pmCameraPermission"));
      const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      if (res.canceled) return;
      const asset = res.assets[0];
      setFImage(asset.uri);
    } catch {
      setNotice(tt("pmCameraPermission"));
    }
  }

  async function save() {
    const label = fLabel.trim();
    const cat = fCat.trim() || tt("pmUncategorized");
    if (!label) return setNotice(tt("pmLabelRequired"));
    const phrases = fTriggers
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (phrases.length === 0 && !label) phrases.push(label);
    if (phrases.length === 0) phrases.push(label);
    const idDraft = editing?.id ?? `ph_${Date.now().toString(36)}_tmp`;
    let img = fImage;
    if (img && !img.startsWith("seed:")) img = await importImage(img, idDraft);
    if (editing) {
      updatePhraseMatch(editing.id, {
        triggerPhrases: phrases,
        label,
        category: cat,
        level: fLevel,
        imagePath: img,
        bookSource: fBook.trim() || null,
        licenseRef: fLicense.trim() || null,
      });
    } else {
      createPhraseMatch({
        triggerPhrases: phrases,
        label,
        category: cat,
        level: fLevel,
        imagePath: img || "",
        bookSource: fBook.trim() || null,
        licenseRef: fLicense.trim() || null,
      });
    }
    setEditorVisible(false);
    setEditing(null);
    setTick((t) => t + 1);
  }

  function executeDelete() {
    if (!deleteTarget) return;
    deletePhraseMatch(deleteTarget.id);
    setDeleteTarget(null);
    setTick((t) => t + 1);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color="white" />
          </Pressable>
          <Text style={styles.headerTitle}>{tt("pmTitle")}</Text>
          <Pressable onPress={openNew} style={styles.addBtn}>
            <Ionicons name="add" size={22} color="white" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.statsRow}>
            <Stat label={tt("pmTotal")} value={`${stats.total}`} />
            <Stat label={tt("pmMatched")} value={`${stats.matched}`} />
            <Stat label={tt("pmCategories")} value={`${categories.length}`} />
          </View>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={tt("pmSearchPlaceholder")}
            placeholderTextColor={colors.textLight}
            style={styles.searchInput}
          />

          <View style={styles.chipRow}>
            <Chip active={catFilter === null} onPress={() => setCatFilter(null)} label={tt("pmAllCategories")} />
            {categories.map((c) => (
              <Chip key={c} active={catFilter === c} onPress={() => setCatFilter(c)} label={c} />
            ))}
          </View>

          <View style={styles.chipRow}>
            {[0, 1, 2, 3, 4, 5].map((l) => (
              <Chip
                key={l}
                active={levelFilter === l}
                onPress={() => setLevelFilter(l as LevelFilter)}
                label={l === 0 ? tt("pmAllLevels") : tt("pmLevelN").replace("{n}", String(l))}
              />
            ))}
          </View>

          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>{tt("pmNoMatch")}</Text>
              <Text style={styles.emptySub}>{tt("pmNoMatchHint")}</Text>
            </View>
          )}

          {filtered.map((p) => (
            <View key={p.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={[styles.thumb, { backgroundColor: colors.cardMuted }]}>
                  {p.imagePath && p.imagePath.startsWith("seed:prep") ? (
                    <Text style={styles.seedThumb}>📘</Text>
                  ) : p.imagePath ? (
                    <Image source={{ uri: p.imagePath }} style={styles.thumbImg} />
                  ) : (
                    <Ionicons name="image-outline" size={28} color={colors.textMid} />
                  )}
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {p.label}
                    </Text>
                    <View style={styles.levelPill}>
                      <Text style={styles.levelPillText}>L{p.level}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardSub}>
                    {tt("pmCardSub").replace("{category}", p.category).replace("{count}", String(p.triggerPhrases.length))}
                    {p.bookSource ? ` · ${p.bookSource}` : ""}
                  </Text>
                  <Text style={styles.cardTriggers} numberOfLines={1}>
                    {p.triggerPhrases.join(" · ")}
                  </Text>
                </View>
                <View style={{ flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  <Pressable onPress={() => openEdit(p)} hitSlop={12} accessibilityLabel={`Edit ${p.label}`}>
                    <Ionicons name="create-outline" size={20} color={colors.forest} />
                  </Pressable>
                  <Pressable onPress={() => setDeleteTarget(p)} hitSlop={12} accessibilityLabel={`Delete ${p.label}`}>
                    <Ionicons name="trash-outline" size={20} color={colors.pinkDeep} />
                  </Pressable>
                  <Pressable onPress={() => speak(p.label, lang, settings.soundEnabled)} hitSlop={12} accessibilityLabel={`Speak ${p.label}`}>
                    <Ionicons name="volume-medium-outline" size={20} color={colors.textMid} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* In-App Delete Confirmation Dialog (Web & Mobile Reliable) */}
      <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={styles.modalTitle}>{tt("pmRemovePhraseTitle")}</Text>
              <Pressable onPress={() => setDeleteTarget(null)} hitSlop={8}>
                <Ionicons name="close" size={20} color="#718096" />
              </Pressable>
            </View>
            <Text style={styles.modalBody}>
              {tt("pmRemovePhraseMsg").replace("{label}", deleteTarget?.label || "")}
            </Text>
            <View style={styles.modalBtnRow}>
              <Pressable onPress={() => setDeleteTarget(null)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>{tt("cancel")}</Text>
              </Pressable>
              <Pressable onPress={executeDelete} style={styles.modalDeleteBtn}>
                <Ionicons name="trash" size={16} color="#FFFFFF" />
                <Text style={styles.modalDeleteText}>{tt("pmRemove")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* In-App Notice Modal */}
      <Modal visible={!!notice} transparent animationType="fade" onRequestClose={() => setNotice(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Notice</Text>
            <Text style={[styles.modalBody, { marginTop: 8 }]}>{notice}</Text>
            <Pressable onPress={() => setNotice(null)} style={[styles.modalDeleteBtn, { backgroundColor: colors.forest, marginTop: 16 }]}>
              <Text style={styles.modalDeleteText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={editorVisible} onRequestClose={() => setEditorVisible(false)} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top", "bottom"]}>
          <View style={styles.header}>
            <Pressable onPress={() => setEditorVisible(false)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={18} color="white" />
            </Pressable>
            <Text style={styles.headerTitle}>{editing ? tt("pmEditPhrase") : tt("pmAddNewPhrase")}</Text>
            <Pressable onPress={save} style={styles.addBtn}>
              <Ionicons name="checkmark" size={22} color="white" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.editorBody}>
            <Pressable onPress={() => (fImage ? undefined : pickImage())} style={styles.imagePicker}>
              {fImage && !fImage.startsWith("seed:prep") ? (
                <Image source={{ uri: fImage }} style={styles.imagePreview} />
              ) : (
                <View style={{ alignItems: "center", gap: 8 }}>
                  <Ionicons name="image" size={44} color={colors.textMid} />
                  <Text style={styles.imageHint}>{fLabel || tt("pmImagePreview")}</Text>
                </View>
              )}
            </Pressable>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <BigButton variant="mint" onPress={takePhoto} style={{ flex: 1 }}>
                <Text style={styles.btnText}>{tt("pmTakePhoto")}</Text>
              </BigButton>
              <BigButton variant="lavender" onPress={pickImage} style={{ flex: 1 }}>
                <Text style={styles.btnText}>{tt("pmGallery")}</Text>
              </BigButton>
            </View>

            <Label>{tt("pmLabelField")}</Label>
            <TextInput value={fLabel} onChangeText={setFLabel} style={styles.input} placeholder={tt("pmLabelPlaceholder")} placeholderTextColor={colors.textLight} />

            <Label>{tt("pmTriggerPhrasesLabel")}</Label>
            <TextInput
              value={fTriggers}
              onChangeText={setFTriggers}
              multiline
              style={[styles.input, { minHeight: 76, textAlignVertical: "top" }]}
              placeholder={tt("pmTriggerPhrasesPlaceholder")}
              placeholderTextColor={colors.textLight}
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Label>{tt("pmCategoryLabel")}</Label>
                <TextInput value={fCat} onChangeText={setFCat} style={styles.input} placeholder={tt("pmCategoryPlaceholder")} placeholderTextColor={colors.textLight} />
              </View>
              <View style={{ width: 96 }}>
                <Label>{tt("pmLevelLabel")}</Label>
                <View style={styles.levelRow}>
                  {[1, 2, 3, 4, 5].map((lv) => (
                    <Pressable key={lv} onPress={() => setFLevel(lv as PhraseLevel)} style={[styles.levelBtn, fLevel === lv && styles.levelBtnOn]}>
                      <Text style={[styles.levelBtnText, fLevel === lv && { color: "white" }]}>{lv}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <Label>{tt("pmSourceBookLabel")}</Label>
            <TextInput value={fBook} onChangeText={setFBook} style={styles.input} placeholder={tt("pmSourceBookPlaceholder")} placeholderTextColor={colors.textLight} />

            <Label>{tt("pmLicenseLabel")}</Label>
            <TextInput value={fLicense} onChangeText={setFLicense} style={styles.input} placeholder={tt("pmLicensePlaceholder")} placeholderTextColor={colors.textLight} />

            <View style={{ height: 24 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipText, active && { color: "white" }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function Label({ children }: { children: string }) {
  return <Text style={{ marginTop: 14, marginBottom: 6, fontSize: 13, fontWeight: "700", color: colors.textMid }}>{children}</Text>;
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.forest, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, flexDirection: "row", alignItems: "center", gap: 14, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "white", fontSize: 20, fontWeight: "800", flex: 1 },
  body: { padding: 20, gap: 12 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14, alignItems: "center", gap: 4 },
  statValue: { fontSize: 22, fontWeight: "800", color: colors.textDark },
  statLabel: { fontSize: 12, fontWeight: "600", color: colors.textMid },
  searchInput: { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, color: colors.textDark, fontSize: 15 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.textMid },
  empty: { padding: 36, alignItems: "center", gap: 10, backgroundColor: colors.card, borderRadius: radius, borderWidth: 1, borderColor: colors.border },
  emptyText: { fontSize: 16, fontWeight: "700", color: colors.textDark },
  emptySub: { fontSize: 13, color: colors.textMid, textAlign: "center" },
  card: { backgroundColor: colors.card, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14 },
  cardRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  thumb: { width: 64, height: 64, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  thumbImg: { width: "100%", height: "100%" },
  seedThumb: { fontSize: 34 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: colors.textDark },
  levelPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.forest + "18" },
  levelPillText: { fontSize: 11, fontWeight: "800", color: colors.forest },
  cardSub: { fontSize: 12, fontWeight: "600", color: colors.textMid },
  cardTriggers: { fontSize: 12, color: colors.textMid, marginTop: 2 },
  editorBody: { padding: 20, gap: 4 },
  imagePicker: { height: 220, borderRadius: 20, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  imagePreview: { width: "100%", height: "100%" },
  imageHint: { fontSize: 14, color: colors.textMid, fontWeight: "600" },
  btnText: { color: colors.textDark, fontSize: 14, fontWeight: "700", textAlign: "center" },
  input: { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, color: colors.textDark, fontSize: 15 },
  levelRow: { flexDirection: "row", gap: 4 },
  levelBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  levelBtnOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  levelBtnText: { fontSize: 13, fontWeight: "800", color: colors.textMid },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 24, width: "100%", maxWidth: 440, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1A202C" },
  modalBody: { fontSize: 14, color: "#4A5568", lineHeight: 22 },
  modalBtnRow: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 20 },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0" },
  modalCancelText: { fontSize: 14, fontWeight: "600", color: "#4A5568" },
  modalDeleteBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.pinkDeep, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  modalDeleteText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
