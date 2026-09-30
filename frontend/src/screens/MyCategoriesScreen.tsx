import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Image,
  Alert,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { CustomCategory, CustomWord, TileSize } from "../types";
import { useSettings } from "../context/SettingsContext";
import { t, type TKey, wordLabel, canonicalWordEn } from "../modules/i18n";
import { playWord } from "../modules/audio";
import {
  ensureCategoriesLoaded,
  topLevelCategories,
  childCategories,
  getCategory,
  deleteCategoryDeep,
  createBlankCategory,
  createBlankCategoriesBulk,
  updateCategory,
  addWord,
  addWordsBulk,
  updateWord,
  removeWord,
  setCategoryHidden,
  setWordHidden,
  cleanAndDeduplicateCategories,
  retranslateSeedBoard,
  setSeedLanguage,
} from "../modules/customCategories";
import { getPictogramUrl } from "../modules/aacPictograms";
import { generateAllVerbForms, isLikelyVerb, detectVerbForm } from "../modules/verbForms";
import WordEditor from "../components/WordEditor";
import UniversalImagePickerModal from "../components/UniversalImagePickerModal";
import { startListening, stopListening, isListening } from "../modules/voice";
import { parseVoiceCategoryCommand, cleanVoiceSpeechName, getCategoryIconForName, getCategoryColorForName, type ParsedVoiceResult } from "../modules/voiceCategories";

const PASTEL_PALETTE = [
  "#D5E8DF", // mint
  "#FCE7D6", // peach
  "#E8E0F4", // lavender
  "#FFF0B8", // yellow
  "#D6ECFA", // sky
  "#FCD6D6", // pink
];

const SHELF_ICONS = ["💬", "♡", "😊", "⚡", "🍴", "🏛️", "✨", "🎨", "📁", "🏫", "⚽", "🛁", "🎸"];

function capWord(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatLastUsed(ts: number | undefined): string {
  if (!ts) return "Not yet";
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return "Today";
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface Props {
  onBack: () => void;
  onCreate?: () => void;
  initialCategoryId?: string;
}

export default function MyCategoriesScreen({ onBack, onCreate, initialCategoryId }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const { settings } = useSettings();
  const lang = settings.language;
  const tt = (k: TKey) => t(k, lang);

  const [ready, setReady] = useState(false);
  const [cats, setCats] = useState<CustomCategory[]>([]);
  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null);
  const [selectedSubCatId, setSelectedSubCatId] = useState<string | null>(null);
  const [wordSearch, setWordSearch] = useState("");
  const [tick, setTick] = useState(0);

  // Modals
  const [addWordOpen, setAddWordOpen] = useState(false);
  const [newWordText, setNewWordText] = useState("");
  const [newWordColor, setNewWordColor] = useState(PASTEL_PALETTE[0]);
  const [autoAddVerbForms, setAutoAddVerbForms] = useState(true);

  const [bulkWordsOpen, setBulkWordsOpen] = useState(false);
  const [bulkWordsText, setBulkWordsText] = useState("");
  const [bulkAutoVerbs, setBulkAutoVerbs] = useState(true);
  const [bulkWordColor, setBulkWordColor] = useState(PASTEL_PALETTE[0]);

  // Target category / sub-category for Add Word & Bulk Add modals
  const [modalTargetCatId, setModalTargetCatId] = useState<string | null>(null);

  const [subCatOpen, setSubCatOpen] = useState(false);
  const [subCatName, setSubCatName] = useState("");

  const [newShelfOpen, setNewShelfOpen] = useState(false);
  const [newShelfName, setNewShelfName] = useState("");
  const [newShelfIcon, setNewShelfIcon] = useState("💬");
  const [newShelfImageUri, setNewShelfImageUri] = useState<string | undefined>();
  const [newWordImageUri, setNewWordImageUri] = useState<string | undefined>();

  // Category / Shelf Edit Modal (Parent editing)
  const [editCatOpen, setEditCatOpen] = useState(false);
  const [catToEdit, setCatToEdit] = useState<CustomCategory | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatIcon, setEditCatIcon] = useState("💬");
  const [editCatColor, setEditCatColor] = useState(PASTEL_PALETTE[0]);
  const [editCatImageUri, setEditCatImageUri] = useState<string | undefined>();

  // Voice Category & Word Creator Modal (Caregiver Space)
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceRawTranscript, setVoiceRawTranscript] = useState("");
  const [voiceTargetType, setVoiceTargetType] = useState<"category" | "subcategory" | "word">("category");
  const [voiceName, setVoiceName] = useState("");
  const [voiceIcon, setVoiceIcon] = useState("📁");
  const [voiceColor, setVoiceColor] = useState(PASTEL_PALETTE[0]);
  const [voiceImageUri, setVoiceImageUri] = useState<string | undefined>();
  const [voiceItems, setVoiceItems] = useState<string[]>([]);
  const [voiceSubItems, setVoiceSubItems] = useState<string[]>([]);
  const [voiceShelfId, setVoiceShelfId] = useState<string | null>(null);
  const [voiceSubCatId, setVoiceSubCatId] = useState<string | null>(null);
  const [bulkVoiceActive, setBulkVoiceActive] = useState<"words" | "shelves" | "subcats" | null>(null);

  // Unified Bulk Creator Modal (Words | Shelves | Sub-categories)
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkModalTab, setBulkModalTab] = useState<"words" | "shelves" | "subcats">("words");
  const [bulkShelvesText, setBulkShelvesText] = useState("");
  const [bulkSubCatsText, setBulkSubCatsText] = useState("");
  const [bulkTargetShelfId, setBulkTargetShelfId] = useState<string | null>(null);
  const [bulkWordsShelfId, setBulkWordsShelfId] = useState<string | null>(null);

  // Universal 3-Option Image Picker Target (Gallery, App Library, Chrome Search)
  const [imagePickerTarget, setImagePickerTarget] = useState<{
    type: "word" | "shelf" | "tableWord" | "bulkWord" | "bulkShelf" | "bulkSubCat" | "editCat" | "voiceCat";
    wordId?: string;
    label: string;
    currentUri?: string;
  } | null>(null);

  // Bulk Custom Images Mapping: name -> imageUri
  const [bulkWordsImages, setBulkWordsImages] = useState<Record<string, string>>({});
  const [bulkShelvesImages, setBulkShelvesImages] = useState<Record<string, string>>({});
  const [bulkSubCatsImages, setBulkSubCatsImages] = useState<Record<string, string>>({});

  // Working Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "shelf" | "word";
    id: string;
    name: string;
  } | null>(null);

  const [editorWord, setEditorWord] = useState<CustomWord | null>(null);

  const refresh = () => {
    cleanAndDeduplicateCategories();
    const list = topLevelCategories();
    setCats(list);
    setTick((t) => t + 1);
    if (!selectedShelfId && list.length > 0) {
      const core = list.find((c) => {
        const en = (canonicalWordEn(c.name) || c.name).toLowerCase();
        return en === "core" || c.name === "أساسي" || c.name === "بنیادی";
      });
      const chosen = core ? core : list[0];
      setSelectedShelfId(chosen.id);
      const subs = childCategories(chosen.id);
      setSelectedSubCatId(subs.length > 0 ? subs[0].id : null);
    }
  };

  useEffect(() => {
    ensureCategoriesLoaded().then(() => {
      setSeedLanguage(lang);
      retranslateSeedBoard(lang);
      refresh();
      setReady(true);
    });
  }, [lang]);

  // Jump to initial category if opened directly from AAC Board "Edit"
  useEffect(() => {
    if (!initialCategoryId || cats.length === 0) return;
    const topMatch = cats.find((c) => c.id === initialCategoryId);
    if (topMatch) {
      setSelectedShelfId(topMatch.id);
      setSelectedSubCatId(null);
      return;
    }
    for (const top of cats) {
      const subs = childCategories(top.id);
      const subMatch = subs.find((sc) => sc.id === initialCategoryId);
      if (subMatch) {
        setSelectedShelfId(top.id);
        setSelectedSubCatId(subMatch.id);
        return;
      }
    }
  }, [initialCategoryId, cats]);

  // Selected shelf
  const currentShelf = useMemo(() => {
    if (!selectedShelfId && cats.length > 0) return cats[0];
    return cats.find((c) => c.id === selectedShelfId) || cats[0] || null;
  }, [cats, selectedShelfId, tick]);

  // Subcategories of selected shelf
  const subCats = useMemo(() => {
    if (!currentShelf) return [];
    return childCategories(currentShelf.id);
  }, [currentShelf, tick]);

  // Selected shelf for Bulk Words tab
  const targetWordsShelf = useMemo(() => {
    if (bulkWordsShelfId) {
      const found = cats.find((c) => c.id === bulkWordsShelfId);
      if (found) return found;
    }
    return currentShelf || cats[0] || null;
  }, [bulkWordsShelfId, cats, currentShelf]);

  // Sub-categories of selected shelf for Bulk Words tab
  const targetWordsSubCats = useMemo(() => {
    if (!targetWordsShelf) return [];
    return childCategories(targetWordsShelf.id);
  }, [targetWordsShelf, tick]);

  // Selected shelf for Voice Add modal
  const voiceTargetShelf = useMemo(() => {
    if (voiceShelfId) {
      const found = cats.find((c) => c.id === voiceShelfId);
      if (found) return found;
    }
    return currentShelf || cats[0] || null;
  }, [voiceShelfId, cats, currentShelf]);

  // Sub-categories of selected shelf for Voice Add modal
  const voiceTargetSubCats = useMemo(() => {
    if (!voiceTargetShelf) return [];
    return childCategories(voiceTargetShelf.id);
  }, [voiceTargetShelf, tick]);

  // Active category being viewed/edited (either a selected sub-category or the main shelf)
  const activeCategory = useMemo(() => {
    if (selectedSubCatId) {
      const found = subCats.find((sc) => sc.id === selectedSubCatId);
      if (found) return found;
    }
    return currentShelf;
  }, [currentShelf, subCats, selectedSubCatId]);

  // Filtered words in active category
  const displayWords = useMemo(() => {
    if (!activeCategory) return [];
    const q = wordSearch.trim().toLowerCase();
    if (!q) return activeCategory.words;
    return activeCategory.words.filter(
      (w) =>
        w.label.toLowerCase().includes(q) ||
        (w.phrase && w.phrase.toLowerCase().includes(q))
    );
  }, [activeCategory, wordSearch, tick]);

  // Auto-detect verb forms for single word modal
  const detectedVerbForms = useMemo(() => {
    const text = newWordText.trim();
    if (!text || (text.includes(" ") && text.split(" ").length > 2)) return null;
    return generateAllVerbForms(text);
  }, [newWordText]);

  // Parsed words for bulk modal
  const parsedBulkWords = useMemo(() => {
    if (!bulkWordsText.trim()) return [];
    return bulkWordsText
      .split(/[\n,;]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
  }, [bulkWordsText]);

  // Compute expected tiles count based on automatic noun vs verb detection
  const totalExpectedTiles = useMemo(() => {
    let count = 0;
    for (const pw of parsedBulkWords) {
      const vForms = generateAllVerbForms(pw);
      if (vForms) count += 4;
      else count += 1;
    }
    return count;
  }, [parsedBulkWords]);

  interface ParsedBulkShelf {
    name: string;
    subcats: string[];
    icon: string;
    color: string;
  }

  const parsedBulkShelves = useMemo<ParsedBulkShelf[]>(() => {
    if (!bulkShelvesText.trim()) return [];
    const lines = bulkShelvesText.split(/\n+/);
    const results: ParsedBulkShelf[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.includes(":") || line.includes(">")) {
        const parts = line.split(/[:>]/);
        const parentName = capWord(parts[0].trim());
        const subList = parts.slice(1).join(":")
          .split(/[,;]+/)
          .map((s) => capWord(s.trim()))
          .filter(Boolean);

        if (parentName) {
          results.push({
            name: parentName,
            subcats: subList,
            icon: getCategoryIconForName(parentName),
            color: getCategoryColorForName(parentName),
          });
        }
      } else {
        const items = line.split(/[,;]+/).map((s) => capWord(s.trim())).filter(Boolean);
        for (const item of items) {
          results.push({
            name: item,
            subcats: [],
            icon: getCategoryIconForName(item),
            color: getCategoryColorForName(item),
          });
        }
      }
    }
    return results;
  }, [bulkShelvesText]);

  const parsedBulkSubCats = useMemo<string[]>(() => {
    if (!bulkSubCatsText.trim()) return [];
    return bulkSubCatsText
      .split(/[\n,;]+/)
      .map((s) => capWord(s.trim()))
      .filter(Boolean);
  }, [bulkSubCatsText]);

  function handleCreateBulkShelves() {
    if (parsedBulkShelves.length === 0) return;

    let firstCreatedId: string | null = null;
    for (const shelf of parsedBulkShelves) {
      const shelfImg = bulkShelvesImages[shelf.name] || getPictogramUrl(shelf.name) || undefined;
      const createdShelf = createBlankCategory({
        name: shelf.name,
        icon: shelf.icon,
        color: shelf.color,
        imageUri: shelfImg,
      });
      if (!firstCreatedId) firstCreatedId = createdShelf.id;

      if (shelf.subcats.length > 0) {
        createBlankCategoriesBulk(
          shelf.subcats.map((scName) => ({
            name: scName,
            parentCategoryId: createdShelf.id,
            icon: getCategoryIconForName(scName),
            color: shelf.color,
            imageUri: bulkSubCatsImages[scName] || getPictogramUrl(scName) || undefined,
          }))
        );
      }
    }

    if (firstCreatedId) {
      setSelectedShelfId(firstCreatedId);
      setSelectedSubCatId(null);
    }
    setBulkShelvesText("");
    setBulkShelvesImages({});
    setBulkSubCatsImages({});
    setBulkModalOpen(false);
    refresh();
  }

  function handleCreateBulkSubCats() {
    const targetShelf = (bulkTargetShelfId ? cats.find((c) => c.id === bulkTargetShelfId) : null) || currentShelf;
    if (!targetShelf || parsedBulkSubCats.length === 0) return;

    const createdList = createBlankCategoriesBulk(
      parsedBulkSubCats.map((scName) => ({
        name: scName,
        parentCategoryId: targetShelf.id,
        icon: getCategoryIconForName(scName),
        color: targetShelf.color,
        imageUri: bulkSubCatsImages[scName] || getPictogramUrl(scName) || undefined,
      }))
    );

    if (createdList.length > 0) {
      setSelectedShelfId(targetShelf.id);
      setSelectedSubCatId(createdList[0].id);
    }
    setBulkSubCatsText("");
    setBulkSubCatsImages({});
    setBulkModalOpen(false);
    setBulkWordsOpen(false);
    refresh();
  }

  function openBulkModal(tab: "words" | "shelves" | "subcats" = "words") {
    setBulkModalTab(tab);
    if (tab === "words") {
      const initialShelf = currentShelf || cats[0] || null;
      const initialShelfId = initialShelf?.id || null;
      setBulkWordsShelfId(initialShelfId);
      const subs = initialShelf ? childCategories(initialShelf.id) : [];
      if (selectedSubCatId && subs.some((s) => s.id === selectedSubCatId)) {
        setModalTargetCatId(selectedSubCatId);
      } else if (subs.length > 0) {
        setModalTargetCatId(subs[0].id);
      } else {
        setModalTargetCatId(null);
      }
    } else if (tab === "subcats") {
      setBulkTargetShelfId(currentShelf?.id || (cats[0] ? cats[0].id : null));
    }
    setBulkWordsOpen(true);
    setBulkModalOpen(true);
  }

  function executeDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === "shelf") {
      deleteCategoryDeep(deleteTarget.id);
      if (selectedShelfId === deleteTarget.id) {
        const remaining = cats.filter((c) => c.id !== deleteTarget.id);
        setSelectedShelfId(remaining[0]?.id || null);
        setSelectedSubCatId(null);
      } else if (selectedSubCatId === deleteTarget.id) {
        setSelectedSubCatId(null);
      }
    } else {
      if (activeCategory) {
        removeWord(activeCategory.id, deleteTarget.id);
      }
    }
    setDeleteTarget(null);
    refresh();
  }

  function handleCreateShelf() {
    const raw = newShelfName.trim();
    if (!raw) return;
    const names = raw
      .split(/[\n,;]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (names.length === 0) return;

    if (names.length === 1) {
      const cat = createBlankCategory({
        name: names[0],
        icon: newShelfIcon,
        color: "#235E50",
        imageUri: newShelfImageUri || getPictogramUrl(names[0]) || undefined,
      });
      setSelectedShelfId(cat.id);
    } else {
      const created = createBlankCategoriesBulk(
        names.map((n) => ({
          name: n,
          icon: newShelfIcon,
          color: "#235E50",
          imageUri: getPictogramUrl(n) || undefined,
        }))
      );
      if (created.length > 0) {
        setSelectedShelfId(created[0].id);
      }
    }

    setNewShelfOpen(false);
    setNewShelfName("");
    setNewShelfImageUri(undefined);
    refresh();
  }

  function handleCreateSubCategory() {
    const raw = subCatName.trim();
    if (!raw || !currentShelf) return;
    const names = raw
      .split(/[\n,;]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (names.length === 0) return;

    let createdId: string | null = null;
    if (names.length === 1) {
      const cat = createBlankCategory({
        name: names[0],
        parentCategoryId: currentShelf.id,
        icon: currentShelf.icon,
        color: currentShelf.color,
      });
      createdId = cat.id;
    } else {
      const createdList = createBlankCategoriesBulk(
        names.map((n) => ({
          name: n,
          parentCategoryId: currentShelf.id,
          icon: currentShelf.icon,
          color: currentShelf.color,
        }))
      );
      if (createdList.length > 0) {
        createdId = createdList[0].id;
      }
    }

    setSubCatOpen(false);
    setSubCatName("");
    if (createdId) {
      setSelectedSubCatId(createdId);
    }
    refresh();
  }

  function handleCreateWord() {
    const text = newWordText.trim();
    let targetCat =
      (modalTargetCatId ? subCats.find((s) => s.id === modalTargetCatId) : null) ||
      (selectedSubCatId ? subCats.find((s) => s.id === selectedSubCatId) : null) ||
      (subCats.length > 0 ? subCats[0] : null);

    if (!text || !targetCat) {
      if (!targetCat) {
        Alert.alert("Sub-category Required", "Words must be added to a sub-category. Please create a sub-category first.");
      }
      return;
    }

    const imgUri = newWordImageUri || getPictogramUrl(text) || undefined;

    if (detectedVerbForms && autoAddVerbForms) {
      const form1 = capWord(detectedVerbForms.base);
      const form2 = capWord(detectedVerbForms.past);
      const form3 = capWord(detectedVerbForms.participle);
      const form4 = capWord(detectedVerbForms.continuous);

      const formsToAdd: {
        label: string;
        phrase: string;
        verbFormTag: "1st" | "2nd" | "3rd" | "4th";
      }[] = [
        { label: form1, phrase: form1, verbFormTag: "1st" },
        { label: form2, phrase: form2, verbFormTag: "2nd" },
        { label: form3, phrase: form3, verbFormTag: "3rd" },
        { label: form4, phrase: form4, verbFormTag: "4th" },
      ];

      // Route destination:
      // If currentShelf or target is Actions, route into Verbs A-Z subcategory
      let actualTargetCatId = targetCat.id;
      const isActionsShelf =
        (canonicalWordEn(targetCat.name) || targetCat.name).toLowerCase().includes("action") ||
        (canonicalWordEn(currentShelf?.name || "") || currentShelf?.name || "").toLowerCase().includes("action");

      if (isActionsShelf) {
        const letter = (detectedVerbForms.base[0] || "A").toUpperCase();
        const subName = `Verbs ${letter}`;
        const existingSub = subCats.find((sc) => sc.name.toLowerCase() === subName.toLowerCase());
        if (existingSub) {
          actualTargetCatId = existingSub.id;
        } else {
          const actionsShelf = (canonicalWordEn(currentShelf?.name || "") || currentShelf?.name || "").toLowerCase().includes("action") ? currentShelf : targetCat;
          const allSubs = childCategories(actionsShelf.id);
          const found = allSubs.find((sc) => sc.name.toLowerCase() === subName.toLowerCase());
          if (found) {
            actualTargetCatId = found.id;
          } else {
            const created = createBlankCategory({
              name: subName,
              parentCategoryId: actionsShelf.id,
              icon: "⚡",
              color: actionsShelf.color || "#c98a3d",
            });
            actualTargetCatId = created.id;
          }
        }
      }

      addWordsBulk(
        actualTargetCatId,
        formsToAdd.map((f) => ({
          label: f.label,
          phrase: f.phrase,
          color: newWordColor,
          emoji: detectedVerbForms.emoji || "⚡",
          imageUri: imgUri || getPictogramUrl(f.label) || getPictogramUrl(form1) || undefined,
          size: "md" as TileSize,
          useTextToSpeech: true,
          verbFormTag: f.verbFormTag,
          verbForms: detectedVerbForms,
        }))
      );
      setSelectedSubCatId(actualTargetCatId);
    } else {
      const cLabel = capWord(text);
      addWord(targetCat.id, {
        label: cLabel,
        phrase: cLabel,
        color: newWordColor,
        emoji: detectedVerbForms?.emoji || "🔹",
        imageUri: imgUri,
        size: "md" as TileSize,
        useTextToSpeech: true,
        verbForms: detectedVerbForms || undefined,
        verbFormTag: detectedVerbForms ? detectVerbForm(text) || undefined : undefined,
      });
      setSelectedSubCatId(targetCat.id);
    }

    setAddWordOpen(false);
    setNewWordText("");
    setNewWordImageUri(undefined);
    setNewWordColor(PASTEL_PALETTE[0]);
    refresh();
  }

  function handleBulkAddWords() {
    let targetCat: CustomCategory | undefined = undefined;
    if (modalTargetCatId) {
      targetCat = getCategory(modalTargetCatId);
    }
    // Prevent adding to main shelf - words must belong to a sub-category
    if (!targetCat || !targetCat.parentCategoryId || targetCat.id === targetWordsShelf?.id) {
      if (targetWordsSubCats.length > 0) {
        targetCat = targetWordsSubCats[0];
      } else {
        Alert.alert("Sub-category Required", "Words must be added to a sub-category. Please create a sub-category first.");
        return;
      }
    }
    if (!bulkWordsText.trim() || !targetCat) return;

    const items = bulkWordsText
      .split(/[\n,;]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    if (items.length === 0) return;

    const wordsToInsert: {
      label: string;
      phrase: string;
      color: string;
      emoji: string;
      imageUri?: string;
      size: TileSize;
      useTextToSpeech: boolean;
      verbForms?: CustomWord["verbForms"];
      verbFormTag?: "1st" | "2nd" | "3rd" | "4th";
    }[] = [];

    const seenLabels = new Set<string>();

    for (const item of items) {
      const customImg = bulkWordsImages[item] || bulkWordsImages[item.toLowerCase()];
      const vForms = generateAllVerbForms(item);
      if (vForms) {
        const form1 = capWord(vForms.base);
        const form2 = capWord(vForms.past);
        const form3 = capWord(vForms.participle);
        const form4 = capWord(vForms.continuous);

        const forms: { label: string; verbFormTag: "1st" | "2nd" | "3rd" | "4th" }[] = [
          { label: form1, verbFormTag: "1st" },
          { label: form2, verbFormTag: "2nd" },
          { label: form3, verbFormTag: "3rd" },
          { label: form4, verbFormTag: "4th" },
        ];
        for (const f of forms) {
          const lower = f.label.toLowerCase();
          if (!seenLabels.has(lower)) {
            seenLabels.add(lower);
            wordsToInsert.push({
              label: f.label,
              phrase: f.label,
              color: bulkWordColor,
              emoji: vForms.emoji || "⚡",
              imageUri: customImg || getPictogramUrl(f.label) || getPictogramUrl(form1) || undefined,
              size: "md" as TileSize,
              useTextToSpeech: true,
              verbForms: vForms,
              verbFormTag: f.verbFormTag,
            });
          }
        }
      } else {
        const cLabel = capWord(item);
        const lower = cLabel.toLowerCase();
        if (!seenLabels.has(lower)) {
          seenLabels.add(lower);
          wordsToInsert.push({
            label: cLabel,
            phrase: cLabel,
            color: bulkWordColor,
            emoji: "🔹",
            imageUri: customImg || getPictogramUrl(cLabel) || undefined,
            size: "md" as TileSize,
            useTextToSpeech: true,
          });
        }
      }
    }

    addWordsBulk(targetCat.id, wordsToInsert);
    if (targetWordsShelf) {
      setSelectedShelfId(targetWordsShelf.id);
      setSelectedSubCatId(targetCat.id === targetWordsShelf.id ? null : targetCat.id);
    }

    setBulkWordsOpen(false);
    setBulkWordsText("");
    setBulkWordsImages({});
    refresh();
  }

  function openEditCategory(cat: CustomCategory) {
    setCatToEdit(cat);
    setEditCatName(cat.name);
    setEditCatIcon(cat.icon || "📁");
    setEditCatColor(cat.color || PASTEL_PALETTE[0]);
    setEditCatImageUri(cat.imageUri);
    setEditCatOpen(true);
  }

  function handleSaveEditCategory() {
    if (!catToEdit) return;
    const trimmed = editCatName.trim();
    if (!trimmed) return;
    updateCategory(catToEdit.id, {
      name: trimmed,
      icon: editCatIcon,
      color: editCatColor,
      imageUri: editCatImageUri,
    });
    setEditCatOpen(false);
    setCatToEdit(null);
    refresh();
  }

  function handleImageSelected(uri: string) {
    if (!imagePickerTarget) return;
    if (imagePickerTarget.type === "word") {
      setNewWordImageUri(uri);
    } else if (imagePickerTarget.type === "shelf") {
      setNewShelfImageUri(uri);
    } else if (imagePickerTarget.type === "editCat") {
      setEditCatImageUri(uri);
    } else if (imagePickerTarget.type === "voiceCat") {
      setVoiceImageUri(uri);
    } else if (imagePickerTarget.type === "tableWord" && imagePickerTarget.wordId && activeCategory) {
      updateWord(activeCategory.id, imagePickerTarget.wordId, { imageUri: uri });
      refresh();
    } else if (imagePickerTarget.type === "bulkWord") {
      setBulkWordsImages((prev) => ({ ...prev, [imagePickerTarget.label]: uri }));
    } else if (imagePickerTarget.type === "bulkShelf") {
      setBulkShelvesImages((prev) => ({ ...prev, [imagePickerTarget.label]: uri }));
    } else if (imagePickerTarget.type === "bulkSubCat") {
      setBulkSubCatsImages((prev) => ({ ...prev, [imagePickerTarget.label]: uri }));
    }
  }

  function handleImageRemoved() {
    if (!imagePickerTarget) return;
    if (imagePickerTarget.type === "word") {
      setNewWordImageUri(undefined);
    } else if (imagePickerTarget.type === "shelf") {
      setNewShelfImageUri(undefined);
    } else if (imagePickerTarget.type === "editCat") {
      setEditCatImageUri(undefined);
    } else if (imagePickerTarget.type === "voiceCat") {
      setVoiceImageUri(undefined);
    } else if (imagePickerTarget.type === "tableWord" && imagePickerTarget.wordId && activeCategory) {
      updateWord(activeCategory.id, imagePickerTarget.wordId, { imageUri: undefined });
      refresh();
    } else if (imagePickerTarget.type === "bulkWord") {
      setBulkWordsImages((prev) => {
        const next = { ...prev };
        delete next[imagePickerTarget.label];
        return next;
      });
    } else if (imagePickerTarget.type === "bulkShelf") {
      setBulkShelvesImages((prev) => {
        const next = { ...prev };
        delete next[imagePickerTarget.label];
        return next;
      });
    } else if (imagePickerTarget.type === "bulkSubCat") {
      setBulkSubCatsImages((prev) => {
        const next = { ...prev };
        delete next[imagePickerTarget.label];
        return next;
      });
    }
  }

  function openVoiceAdd() {
    setVoiceRawTranscript("");
    setVoiceName("");
    setVoiceIcon("📁");
    setVoiceColor(PASTEL_PALETTE[0]);
    setVoiceImageUri(undefined);
    setVoiceItems([]);
    setVoiceSubItems([]);
    setVoiceTargetType("category");
    const initialShelf = currentShelf || cats[0] || null;
    setVoiceShelfId(initialShelf?.id || null);
    const subs = initialShelf ? childCategories(initialShelf.id) : [];
    if (selectedSubCatId && subs.some((s) => s.id === selectedSubCatId)) {
      setVoiceSubCatId(selectedSubCatId);
    } else if (subs.length > 0) {
      setVoiceSubCatId(subs[0].id);
    } else {
      setVoiceSubCatId(null);
    }
    setVoiceOpen(true);
    startVoiceCapture();
  }

  function startVoiceCapture() {
    setVoiceListening(true);
    const recognitionLang = lang.startsWith("ur") ? "ur-PK" : lang.startsWith("ar") ? "ar-SA" : lang;
    startListening({
      lang: recognitionLang,
      onPartial: (text) => {
        setVoiceRawTranscript(text);
        applyVoiceText(text);
      },
      onFinal: (text) => {
        setVoiceRawTranscript(text);
        applyVoiceText(text);
        setVoiceListening(false);
      },
      onError: () => setVoiceListening(false),
      onEnd: () => setVoiceListening(false),
    });
  }

  function applyVoiceText(text: string) {
    const parsed = parseVoiceCategoryCommand(text);
    setVoiceName(parsed.cleanName);
    setVoiceIcon(parsed.icon);
    setVoiceColor(parsed.color);
    setVoiceImageUri(parsed.imageUri);
    setVoiceItems(parsed.items);
    setVoiceSubItems(parsed.subItems || []);
    if (parsed.intent === "words") {
      setVoiceTargetType("word");
    } else if (parsed.intent === "subcategory") {
      setVoiceTargetType("subcategory");
    } else {
      setVoiceTargetType("category");
    }
  }

  function stopVoiceCapture() {
    stopListening();
    setVoiceListening(false);
  }

  function toggleBulkVoice(target: "words" | "shelves" | "subcats") {
    if (bulkVoiceActive) {
      stopListening();
      setBulkVoiceActive(null);
      return;
    }
    setBulkVoiceActive(target);
    const recognitionLang = lang.startsWith("ur") ? "ur-PK" : lang.startsWith("ar") ? "ar-SA" : lang;
    startListening({
      lang: recognitionLang,
      onPartial: (text) => {
        handleBulkVoiceInput(text, target);
      },
      onFinal: (text) => {
        handleBulkVoiceInput(text, target);
        setBulkVoiceActive(null);
      },
      onError: () => setBulkVoiceActive(null),
      onEnd: () => setBulkVoiceActive(null),
    });
  }

  function handleBulkVoiceInput(rawText: string, target: "words" | "shelves" | "subcats") {
    if (!rawText.trim()) return;
    const parsed = parseVoiceCategoryCommand(rawText);
    const items = parsed.items.length > 0 ? parsed.items : [parsed.cleanName];
    const formatted = items.join(", ");
    if (target === "words") {
      setBulkWordsText(formatted);
    } else if (target === "shelves") {
      if (parsed.subItems && parsed.subItems.length > 0) {
        setBulkShelvesText(`${parsed.cleanName}: ${parsed.subItems.join(", ")}`);
      } else {
        setBulkShelvesText(formatted);
      }
    } else if (target === "subcats") {
      setBulkSubCatsText(formatted);
    }
  }

  function handleSaveVoice() {
    stopVoiceCapture();
    const fallback = voiceName.trim() || cleanVoiceSpeechName(voiceRawTranscript) || "New Category";
    const finalItems = voiceItems.length > 0 ? voiceItems : [fallback];

    if (voiceTargetType === "category") {
      if (finalItems.length === 1 && voiceSubItems.length === 0) {
        const singleName = capWord(finalItems[0]);
        const created = createBlankCategory({
          name: singleName,
          icon: voiceIcon || getCategoryIconForName(singleName),
          color: voiceColor || getCategoryColorForName(singleName),
          imageUri: voiceImageUri || getPictogramUrl(singleName) || undefined,
        });
        setSelectedShelfId(created.id);
        setSelectedSubCatId(null);
      } else {
        // Bulk categories creation or Category + Subcategories
        const createdList = createBlankCategoriesBulk(
          finalItems.map((n) => {
            const clean = capWord(n);
            return {
              name: clean,
              icon: getCategoryIconForName(clean),
              color: getCategoryColorForName(clean),
              imageUri: getPictogramUrl(clean) || undefined,
            };
          })
        );
        // If hierarchical sub-items were provided:
        if (createdList.length > 0 && voiceSubItems.length > 0) {
          const parentCat = createdList[0];
          createBlankCategoriesBulk(
            voiceSubItems.map((s) => {
              const cleanSub = capWord(s);
              return {
                name: cleanSub,
                parentCategoryId: parentCat.id,
                icon: getCategoryIconForName(cleanSub),
                color: parentCat.color,
                imageUri: getPictogramUrl(cleanSub) || undefined,
              };
            })
          );
        }
        if (createdList.length > 0) {
          setSelectedShelfId(createdList[0].id);
          setSelectedSubCatId(null);
        }
      }
    } else if (voiceTargetType === "subcategory") {
      const targetShelf = voiceTargetShelf || currentShelf;
      if (!targetShelf) {
        Alert.alert("Parent Shelf Required", "Please select a parent shelf for sub-categories.");
        return;
      }
      if (finalItems.length === 1) {
        const singleName = capWord(finalItems[0]);
        const created = createBlankCategory({
          name: singleName,
          parentCategoryId: targetShelf.id,
          icon: voiceIcon || getCategoryIconForName(singleName),
          color: voiceColor || targetShelf.color || "#235E50",
          imageUri: voiceImageUri || getPictogramUrl(singleName) || undefined,
        });
        setSelectedShelfId(targetShelf.id);
        setSelectedSubCatId(created.id);
      } else {
        const createdList = createBlankCategoriesBulk(
          finalItems.map((n) => {
            const clean = capWord(n);
            return {
              name: clean,
              parentCategoryId: targetShelf.id,
              icon: getCategoryIconForName(clean),
              color: targetShelf.color || "#235E50",
              imageUri: getPictogramUrl(clean) || undefined,
            };
          })
        );
        if (createdList.length > 0) {
          setSelectedShelfId(targetShelf.id);
          setSelectedSubCatId(createdList[0].id);
        }
      }
    } else if (voiceTargetType === "word") {
      let targetCat: CustomCategory | undefined = undefined;
      if (voiceSubCatId) {
        targetCat = getCategory(voiceSubCatId);
      }
      if (!targetCat || !targetCat.parentCategoryId) {
        if (voiceTargetSubCats.length > 0) {
          targetCat = voiceTargetSubCats[0];
        } else {
          Alert.alert("Sub-category Required", "Words must be added to a sub-category. Please select or create a sub-category first.");
          return;
        }
      }

      const wordsToAdd = finalItems;
      const toInsert: {
        label: string;
        phrase: string;
        color: string;
        emoji: string;
        imageUri?: string;
        size: TileSize;
        useTextToSpeech: boolean;
        verbForms?: CustomWord["verbForms"];
        verbFormTag?: "1st" | "2nd" | "3rd" | "4th";
      }[] = [];

      for (const item of wordsToAdd) {
        const cName = cleanVoiceSpeechName(item);
        if (!cName) continue;
        const vForms = generateAllVerbForms(cName);
        if (vForms) {
          const form1 = capWord(vForms.base);
          const form2 = capWord(vForms.past);
          const form3 = capWord(vForms.participle);
          const form4 = capWord(vForms.continuous);
          const forms = [
            { label: form1, tag: "1st" as const },
            { label: form2, tag: "2nd" as const },
            { label: form3, tag: "3rd" as const },
            { label: form4, tag: "4th" as const },
          ];
          for (const f of forms) {
            toInsert.push({
              label: f.label,
              phrase: f.label,
              color: voiceColor || PASTEL_PALETTE[0],
              emoji: vForms.emoji || "⚡",
              imageUri: getPictogramUrl(f.label) || getPictogramUrl(form1) || undefined,
              size: "md",
              useTextToSpeech: true,
              verbForms: vForms,
              verbFormTag: f.tag,
            });
          }
        } else {
          const cLabel = capWord(cName);
          toInsert.push({
            label: cLabel,
            phrase: cLabel,
            color: voiceColor || PASTEL_PALETTE[0],
            emoji: voiceIcon || "🔹",
            imageUri: getPictogramUrl(cLabel) || undefined,
            size: "md",
            useTextToSpeech: true,
          });
        }
      }
      if (toInsert.length > 0) {
        addWordsBulk(targetCat.id, toInsert);
        if (voiceTargetShelf) setSelectedShelfId(voiceTargetShelf.id);
        setSelectedSubCatId(targetCat.id);
      }
    }

    setVoiceOpen(false);
    refresh();
  }

  function toggleShelfHidden(cat: CustomCategory) {
    setCategoryHidden(cat.id, !cat.hidden);
    refresh();
  }

  function toggleSubCatHidden(sc: CustomCategory) {
    setCategoryHidden(sc.id, !sc.hidden);
    refresh();
  }

  function toggleWordHidden(wordId: string, hidden: boolean) {
    if (!activeCategory) return;
    setWordHidden(activeCategory.id, wordId, hidden);
    refresh();
  }

  function getWordSymbol(label: string, emoji?: string) {
    const l = label.toLowerCase();
    if (l === "i want" || l === "more") return { symbol: "+", bg: "#E2EFE9", color: "#1F594A" };
    if (l === "help") return { symbol: "?", bg: "#E0EEF7", color: "#2A648C" };
    if (l === "no") return { symbol: "—", bg: "#FCEBEB", color: "#B83A3A" };
    if (l === "yes") return { symbol: "✓", bg: "#E2EFE9", color: "#1F594A" };
    if (l === "all done") return { symbol: "⭐", bg: "#FDF6E2", color: "#B88714" };
    return { symbol: emoji || "+", bg: "#F4EEE4", color: "#544E43" };
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Top Header - Fully Responsive */}
        <View style={[styles.header, !isWide && styles.headerMobile]}>
          <View style={[styles.headerLeft, !isWide && styles.headerLeftMobile]}>
            <Pressable
              onPress={onBack}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Back"
            >
              <Ionicons name="arrow-back" size={20} color="#1A3830" />
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text style={styles.superBadge}>CAREGIVER SPACE</Text>
              <Text style={[styles.mainTitle, !isWide && styles.mainTitleMobile]} numberOfLines={isWide ? undefined : 1}>
                Shape their vocabulary
              </Text>
              {isWide && (
                <Text style={styles.mainSubtitle}>
                  Keep everyday words close, add new shelves, and notice what helps communication flow.
                </Text>
              )}
            </View>
          </View>

          <View style={[styles.headerActionsRow, !isWide && styles.headerActionsRowMobile]}>
            <Pressable
              onPress={openVoiceAdd}
              style={[styles.voiceAddTopBtn, !isWide && styles.voiceAddTopBtnMobile]}
              accessibilityLabel="Voice add category or words"
            >
              <Ionicons name="mic" size={16} color="#235E50" />
              <Text style={styles.voiceAddTopBtnText}>🎙️ Voice add</Text>
            </Pressable>

            <Pressable
              onPress={() => openBulkModal("words")}
              style={[styles.bulkWordTopBtn, !isWide && styles.bulkWordTopBtnMobile]}
              accessibilityLabel="Bulk add words or categories"
            >
              <Ionicons name="flash-outline" size={16} color="#235E50" />
              <Text style={styles.bulkWordTopBtnText}>⚡ Bulk add</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (subCats.length === 0) {
                  setSubCatName("");
                  setSubCatOpen(true);
                  return;
                }
                const defaultSubId = (selectedSubCatId && subCats.some((s) => s.id === selectedSubCatId))
                  ? selectedSubCatId
                  : subCats[0].id;
                setModalTargetCatId(defaultSubId);
                setNewWordText("");
                setNewWordColor(PASTEL_PALETTE[0]);
                setAutoAddVerbForms(true);
                setAddWordOpen(true);
              }}
              style={[styles.addWordTopBtn, !isWide && styles.addWordTopBtnMobile]}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addWordTopBtnText}>Add word</Text>
            </Pressable>
          </View>
        </View>

        {/* Responsive Layout: Desktop/Tablet side-by-side vs Mobile stacked */}
        {isWide ? (
          /* WIDE DESKTOP/TABLET LAYOUT */
          <View style={styles.mainLayoutWide}>
            {/* Left Column: Shelves */}
            <View style={styles.sidebarCard}>
              <View style={styles.sidebarHeader}>
                <Text style={styles.sidebarTitle}>Shelves</Text>
                <Text style={styles.sidebarSub}>
                  Organize words in a way that feels familiar.
                </Text>
              </View>

              <ScrollView
                style={styles.shelfListScroll}
                contentContainerStyle={styles.shelfList}
                showsVerticalScrollIndicator={false}
              >
                {cats.map((cat) => {
                  const isActive = currentShelf?.id === cat.id;
                  return (
                    <View key={cat.id}>
                      <Pressable
                        onPress={() => {
                          setSelectedShelfId(cat.id);
                          const subs = childCategories(cat.id);
                          setSelectedSubCatId(subs.length > 0 ? subs[0].id : null);
                        }}
                        style={[
                          styles.shelfRow,
                          isActive && !selectedSubCatId && styles.shelfRowActive,
                          cat.hidden && styles.shelfRowHidden,
                        ]}
                      >
                        <View style={styles.shelfRowLeft}>
                          <View
                            style={[
                              styles.shelfDot,
                              { backgroundColor: cat.color || "#4A7FE6" },
                            ]}
                          />
                          {cat.imageUri ? (
                            <Image
                              source={{ uri: cat.imageUri }}
                              style={{ width: 22, height: 22, borderRadius: 4, marginRight: 6 }}
                              resizeMode="contain"
                            />
                          ) : (
                            <Text style={styles.shelfIcon}>{cat.icon || "📁"}</Text>
                          )}
                          <Text
                            style={[
                              styles.shelfName,
                              isActive && !selectedSubCatId && styles.shelfNameActive,
                              cat.hidden && styles.textHiddenDim,
                            ]}
                            numberOfLines={1}
                          >
                            {wordLabel(cat.name, lang)}
                          </Text>
                          {cat.hidden && (
                            <Text style={styles.hiddenTag}>(Hidden)</Text>
                          )}
                        </View>

                        <View style={styles.rowActions}>
                          {/* Pencil Edit Button */}
                          <Pressable
                            onPress={() => openEditCategory(cat)}
                            style={styles.shelfActionBtn}
                            hitSlop={6}
                            accessibilityLabel={`Edit ${cat.name}`}
                          >
                            <Ionicons name="pencil" size={15} color="#235E50" />
                          </Pressable>

                          {/* Eye Show/Hide Toggle */}
                          <Pressable
                            onPress={() => toggleShelfHidden(cat)}
                            style={styles.shelfActionBtn}
                            hitSlop={6}
                            accessibilityLabel={cat.hidden ? "Show to child" : "Hide from child"}
                          >
                            <Ionicons
                              name={cat.hidden ? "eye-off" : "eye-outline"}
                              size={16}
                              color={cat.hidden ? "#B8AFA2" : "#235E50"}
                            />
                          </Pressable>

                          {/* Working Delete Button */}
                          <Pressable
                            onPress={() =>
                              setDeleteTarget({
                                type: "shelf",
                                id: cat.id,
                                name: cat.name,
                              })
                            }
                            style={styles.shelfActionBtn}
                            hitSlop={6}
                            accessibilityLabel={`Delete ${cat.name}`}
                          >
                            <Ionicons name="trash-outline" size={16} color="#A39D90" />
                          </Pressable>
                        </View>
                      </Pressable>

                      {/* Nested Sub-Categories under active shelf in sidebar */}
                      {isActive && (
                        <View style={styles.sidebarSubCatList}>
                          {subCats.map((sc) => {
                            const isSubActive = selectedSubCatId === sc.id;
                            return (
                              <Pressable
                                key={sc.id}
                                onPress={() => setSelectedSubCatId(sc.id)}
                                style={[
                                  styles.sidebarSubCatRow,
                                  isSubActive && styles.sidebarSubCatRowActive,
                                  sc.hidden && styles.shelfRowHidden,
                                ]}
                              >
                                <View style={styles.sidebarSubCatLeft}>
                                  <Text style={styles.sidebarSubCatIndent}>↳</Text>
                                  <Text style={styles.sidebarSubCatIcon}>{sc.icon || "📁"}</Text>
                                  <Text
                                    style={[
                                      styles.sidebarSubCatName,
                                      isSubActive && styles.sidebarSubCatNameActive,
                                      sc.hidden && styles.textHiddenDim,
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {wordLabel(sc.name, lang)}
                                  </Text>
                                  <Text style={styles.sidebarSubCatCount}>({sc.words.length})</Text>
                                </View>

                                <View style={styles.rowActions}>
                                  {/* Pencil Edit Button */}
                                  <Pressable
                                    onPress={() => openEditCategory(sc)}
                                    style={styles.shelfActionBtn}
                                    hitSlop={4}
                                    accessibilityLabel={`Edit ${sc.name}`}
                                  >
                                    <Ionicons name="pencil" size={13} color="#235E50" />
                                  </Pressable>

                                  <Pressable
                                    onPress={() => toggleSubCatHidden(sc)}
                                    style={styles.shelfActionBtn}
                                    hitSlop={4}
                                  >
                                    <Ionicons
                                      name={sc.hidden ? "eye-off" : "eye-outline"}
                                      size={14}
                                      color={sc.hidden ? "#B8AFA2" : "#235E50"}
                                    />
                                  </Pressable>
                                  <Pressable
                                    onPress={() =>
                                      setDeleteTarget({
                                        type: "shelf",
                                        id: sc.id,
                                        name: sc.name,
                                      })
                                    }
                                    style={styles.shelfActionBtn}
                                    hitSlop={4}
                                  >
                                    <Ionicons name="trash-outline" size={14} color="#A39D90" />
                                  </Pressable>
                                </View>
                              </Pressable>
                            );
                          })}

                          <Pressable
                            onPress={() => {
                              setSubCatName("");
                              setSubCatOpen(true);
                            }}
                            style={styles.sidebarAddSubCatRow}
                          >
                            <Ionicons name="add" size={13} color="#235E50" />
                            <Text style={styles.sidebarAddSubCatText}>Add sub-category</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              <Pressable
                onPress={() => {
                  setNewShelfName("");
                  setNewShelfOpen(true);
                }}
                style={styles.newShelfBtn}
              >
                <Ionicons name="add" size={16} color="#1A3830" />
                <Text style={styles.newShelfBtnText}>New shelf</Text>
              </Pressable>
            </View>

            {/* Right Column: Words Table for Selected Shelf / Sub-Category */}
            <View style={styles.contentCard}>
              <View style={styles.tableHeaderRow}>
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Pressable onPress={() => setSelectedSubCatId(null)}>
                      <Text style={[styles.selectedShelfTitle, selectedSubCatId ? { color: "#235E50" } : null]}>
                        {currentShelf ? wordLabel(currentShelf.name, lang) : wordLabel("Core", lang)}
                      </Text>
                    </Pressable>
                    {selectedSubCatId && (
                      <>
                        <Ionicons name="chevron-forward" size={16} color="#8A9590" />
                        <Text style={styles.selectedShelfTitle}>
                          {wordLabel(activeCategory?.name || "", lang)}
                        </Text>
                      </>
                    )}
                    <Pressable
                      onPress={() => activeCategory && openEditCategory(activeCategory)}
                      style={styles.editCategoryTopPill}
                      accessibilityLabel="Edit category settings"
                    >
                      <Ionicons name="pencil" size={12} color="#235E50" />
                      <Text style={styles.editCategoryTopPillText}>
                        Edit {selectedSubCatId ? "sub-category" : "shelf"}
                      </Text>
                    </Pressable>
                  </View>
                  <Text style={styles.selectedShelfMeta}>
                    {displayWords.length} words · {selectedSubCatId ? `in sub-category "${activeCategory?.name}"` : "used on this device"}
                    {activeCategory?.hidden ? " · (Hidden from child)" : ""}
                  </Text>
                </View>

                <View style={styles.searchBarWrap}>
                  <Ionicons name="search" size={16} color="#8A9590" />
                  <TextInput
                    value={wordSearch}
                    onChangeText={setWordSearch}
                    placeholder="Find a word"
                    placeholderTextColor="#8A9590"
                    style={styles.searchInput}
                  />
                </View>
              </View>

              <View style={styles.tableHead}>
                <Text style={[styles.colHead, styles.colHeadWord]}>WORD</Text>
                <Text style={[styles.colHead, styles.colHeadCount]}>USE COUNT</Text>
                <Text style={[styles.colHead, styles.colHeadDate]}>LAST USED</Text>
                <Text style={[styles.colHead, styles.colHeadAction]}>ACTIONS</Text>
              </View>

              <ScrollView
                style={styles.tableBodyScroll}
                contentContainerStyle={styles.tableBody}
                showsVerticalScrollIndicator={false}
              >
                {displayWords.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyIcon}>📝</Text>
                    <Text style={styles.emptyTitle}>No words in this shelf</Text>
                    <Text style={styles.emptySub}>
                      Tap "+ Add word" above to add vocabulary to {currentShelf?.name}.
                    </Text>
                  </View>
                ) : (
                  displayWords.map((w) => {
                    const sym = getWordSymbol(w.label, w.emoji);
                    return (
                      <View
                        key={w.id}
                        style={[styles.tableRow, w.hidden && styles.wordRowHidden]}
                      >
                        <Pressable
                          onPress={() => {
                            playWord(
                              {
                                label: wordLabel(w.phrase || w.label, lang),
                                audioUri: w.audioUri,
                                useTextToSpeech: w.useTextToSpeech,
                              },
                              lang,
                              settings.speechRate
                            );
                          }}
                          style={[styles.colCell, styles.colHeadWord]}
                        >
                          <View style={[styles.wordBadgeIcon, { backgroundColor: sym.bg, overflow: "hidden" }]}>
                            {w.imageUri ? (
                              <Image
                                source={{ uri: w.imageUri }}
                                style={{ width: 28, height: 28, borderRadius: 6 }}
                                resizeMode="contain"
                              />
                            ) : (
                              <Text style={[styles.wordBadgeIconText, { color: sym.color }]}>
                                {sym.symbol}
                              </Text>
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.wordLabelText,
                                w.hidden && styles.textHiddenDim,
                              ]}
                              numberOfLines={1}
                            >
                              {wordLabel(w.label, lang)}
                            </Text>
                            {w.hidden && (
                              <Text style={styles.wordHiddenNote}>Hidden from child</Text>
                            )}
                          </View>
                        </Pressable>

                        <View style={[styles.colCell, styles.colHeadCount]}>
                          <View style={styles.useCountPill}>
                            <Text style={styles.useCountPillText}>
                              {w.useCount ? `${w.useCount} times` : "0 times"}
                            </Text>
                          </View>
                        </View>

                        <View style={[styles.colCell, styles.colHeadDate]}>
                          <Text style={styles.lastUsedDateText}>
                            {formatLastUsed(w.lastUsedAt)}
                          </Text>
                        </View>

                        <View style={[styles.colCell, styles.colHeadAction, styles.actionsCell]}>
                          {/* Edit Word Button */}
                          <Pressable
                            onPress={() => setEditorWord(w)}
                            style={styles.rowActionBtn}
                            hitSlop={6}
                            accessibilityLabel={`Edit ${w.label}`}
                          >
                            <Ionicons name="pencil-outline" size={17} color="#235E50" />
                          </Pressable>

                          {/* Eye Show/Hide Toggle */}
                          <Pressable
                            onPress={() => toggleWordHidden(w.id, !w.hidden)}
                            style={styles.rowActionBtn}
                            hitSlop={6}
                            accessibilityLabel={w.hidden ? "Show word" : "Hide word"}
                          >
                            <Ionicons
                              name={w.hidden ? "eye-off" : "eye-outline"}
                              size={17}
                              color={w.hidden ? "#B8AFA2" : "#235E50"}
                            />
                          </Pressable>

                          {/* Working Delete Button */}
                          <Pressable
                            onPress={() =>
                              setDeleteTarget({
                                type: "word",
                                id: w.id,
                                name: w.label,
                              })
                            }
                            style={styles.rowActionBtn}
                            hitSlop={6}
                            accessibilityLabel={`Delete ${w.label}`}
                          >
                            <Ionicons name="trash-outline" size={17} color="#A39D90" />
                          </Pressable>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </View>
        ) : (
          /* MOBILE OPTIMIZED LAYOUT (Zero cut-off, responsive shelves bar & clean card) */
          <ScrollView
            style={styles.mobileContainer}
            contentContainerStyle={styles.mobileContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Shelves Horizontal Scroll Selector */}
            <View style={styles.mobileShelvesCard}>
              <View style={styles.mobileShelvesHeader}>
                <Text style={styles.mobileShelvesTitle}>Shelves</Text>
                <Pressable
                  onPress={() => {
                    setNewShelfName("");
                    setNewShelfOpen(true);
                  }}
                  style={styles.mobileNewShelfSmallBtn}
                >
                  <Ionicons name="add" size={14} color="#1A3830" />
                  <Text style={styles.mobileNewShelfSmallText}>New shelf</Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mobileShelvesRow}
              >
                {cats.map((cat) => {
                  const isActive = currentShelf?.id === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => {
                        setSelectedShelfId(cat.id);
                        const subs = childCategories(cat.id);
                        setSelectedSubCatId(subs.length > 0 ? subs[0].id : null);
                      }}
                      style={[
                        styles.mobileShelfPill,
                        isActive && styles.mobileShelfPillActive,
                        cat.hidden && styles.shelfRowHidden,
                      ]}
                    >
                      <View
                        style={[
                          styles.shelfDot,
                          { backgroundColor: cat.color || "#4A7FE6" },
                        ]}
                      />
                      {cat.imageUri ? (
                        <Image
                          source={{ uri: cat.imageUri }}
                          style={{ width: 20, height: 20, borderRadius: 4, marginRight: 4 }}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={styles.shelfIcon}>{cat.icon || "📁"}</Text>
                      )}
                      <Text
                        style={[
                          styles.mobileShelfPillText,
                          isActive && styles.mobileShelfPillTextActive,
                          cat.hidden && styles.textHiddenDim,
                        ]}
                      >
                        {wordLabel(cat.name, lang)}
                      </Text>

                      {/* Pencil Edit button */}
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation?.();
                          openEditCategory(cat);
                        }}
                        hitSlop={4}
                        style={{ marginLeft: 2 }}
                        accessibilityLabel={`Edit ${cat.name}`}
                      >
                        <Ionicons name="pencil" size={13} color="#235E50" />
                      </Pressable>

                      {/* Eye button */}
                      <Pressable
                        onPress={() => toggleShelfHidden(cat)}
                        hitSlop={4}
                        style={{ marginLeft: 2 }}
                      >
                        <Ionicons
                          name={cat.hidden ? "eye-off" : "eye-outline"}
                          size={14}
                          color={cat.hidden ? "#B8AFA2" : "#235E50"}
                        />
                      </Pressable>

                      {/* Delete button */}
                      <Pressable
                        onPress={() =>
                          setDeleteTarget({
                            type: "shelf",
                            id: cat.id,
                            name: cat.name,
                          })
                        }
                        hitSlop={4}
                        style={{ marginLeft: 2 }}
                      >
                        <Ionicons name="trash-outline" size={14} color="#A39D90" />
                      </Pressable>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Selected Shelf Words Card */}
            <View style={styles.mobileTableCard}>
              <View style={styles.mobileTableHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectedShelfTitle}>
                    {selectedSubCatId
                      ? `${currentShelf ? wordLabel(currentShelf.name, lang) : wordLabel("Core", lang)} › ${wordLabel(activeCategory?.name || "", lang)}`
                      : (currentShelf ? wordLabel(currentShelf.name, lang) : wordLabel("Core", lang))}
                  </Text>
                  <Text style={styles.selectedShelfMeta}>
                    {displayWords.length} words · {selectedSubCatId ? `sub-category "${activeCategory?.name}"` : "on device"}
                    {activeCategory?.hidden ? " · (Hidden)" : ""}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Pressable
                    onPress={() => activeCategory && openEditCategory(activeCategory)}
                    style={styles.mobileEditCategoryBtn}
                    accessibilityLabel="Edit category"
                  >
                    <Ionicons name="pencil" size={12} color="#1A3830" />
                    <Text style={styles.mobileEditCategoryBtnText}>Edit</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setSubCatName("");
                      setSubCatOpen(true);
                    }}
                    style={styles.mobileAddSubBtn}
                  >
                    <Ionicons name="add" size={13} color="#1A3830" />
                    <Text style={styles.mobileAddSubBtnText}>Sub-category</Text>
                  </Pressable>
                </View>
              </View>

              {/* Search Bar */}
              <View style={styles.mobileSearchWrap}>
                <Ionicons name="search" size={15} color="#8A9590" />
                <TextInput
                  value={wordSearch}
                  onChangeText={setWordSearch}
                  placeholder="Find a word"
                  placeholderTextColor="#8A9590"
                  style={styles.searchInput}
                />
              </View>

              {/* Mobile Interactive Sub-Categories Tabs */}
              {subCats.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.subCatPillRow, { marginBottom: 12 }]}
                >
                  <Pressable
                    onPress={() => setSelectedSubCatId(null)}
                    style={[
                      styles.subCatTabPill,
                      !selectedSubCatId && styles.subCatTabPillActive,
                    ]}
                  >
                    <Ionicons
                      name="home-outline"
                      size={12}
                      color={!selectedSubCatId ? "#FFFFFF" : "#235E50"}
                    />
                    <Text
                      style={[
                        styles.subCatTabPillText,
                        !selectedSubCatId && styles.subCatTabPillTextActive,
                      ]}
                    >
                      {currentShelf ? wordLabel(currentShelf.name, lang) : wordLabel("Core", lang)} (All)
                    </Text>
                    <View
                      style={[
                        styles.subCatTabCountBadge,
                        !selectedSubCatId && styles.subCatTabCountBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.subCatTabCountText,
                          !selectedSubCatId && styles.subCatTabCountTextActive,
                        ]}
                      >
                        {currentShelf?.words.length || 0}
                      </Text>
                    </View>
                  </Pressable>

                  {subCats.map((sc) => {
                    const isSubActive = selectedSubCatId === sc.id;
                    return (
                      <Pressable
                        key={sc.id}
                        onPress={() => setSelectedSubCatId(sc.id)}
                        style={[
                          styles.subCatTabPill,
                          isSubActive && styles.subCatTabPillActive,
                          sc.hidden && styles.shelfRowHidden,
                        ]}
                      >
                        <Text style={styles.subCatTabIcon}>{sc.icon || "📁"}</Text>
                        <Text
                          style={[
                            styles.subCatTabPillText,
                            isSubActive && styles.subCatTabPillTextActive,
                            sc.hidden && styles.textHiddenDim,
                          ]}
                        >
                          {wordLabel(sc.name, lang)}
                        </Text>
                        <View
                          style={[
                            styles.subCatTabCountBadge,
                            isSubActive && styles.subCatTabCountBadgeActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.subCatTabCountText,
                              isSubActive && styles.subCatTabCountTextActive,
                            ]}
                          >
                            {sc.words.length}
                          </Text>
                        </View>

                        {/* Edit button */}
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation?.();
                            openEditCategory(sc);
                          }}
                          hitSlop={4}
                          style={styles.subCatPillActionBtn}
                          accessibilityLabel={`Edit ${sc.name}`}
                        >
                          <Ionicons
                            name="pencil"
                            size={11}
                            color={isSubActive ? "#FFFFFF" : "#235E50"}
                          />
                        </Pressable>

                        {/* Eye toggle */}
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation?.();
                            toggleSubCatHidden(sc);
                          }}
                          hitSlop={4}
                          style={styles.subCatPillActionBtn}
                        >
                          <Ionicons
                            name={sc.hidden ? "eye-off" : "eye-outline"}
                            size={12}
                            color={isSubActive ? "#FFFFFF" : "#547A70"}
                          />
                        </Pressable>

                        {/* Delete button */}
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation?.();
                            setDeleteTarget({
                              type: "shelf",
                              id: sc.id,
                              name: sc.name,
                            });
                          }}
                          hitSlop={4}
                          style={styles.subCatPillActionBtn}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={12}
                            color={isSubActive ? "#FFD0D0" : "#8A9590"}
                          />
                        </Pressable>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              {/* Table Header */}
              <View style={styles.tableHead}>
                <Text style={[styles.colHead, { flex: 1.8 }]}>WORD</Text>
                <Text style={[styles.colHead, { flex: 1, textAlign: "center" }]}>USE</Text>
                <Text style={[styles.colHead, { flex: 1, textAlign: "center" }]}>LAST</Text>
                <View style={{ width: 56 }} />
              </View>

              {displayWords.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyIcon}>📝</Text>
                  <Text style={styles.emptyTitle}>No words in this shelf</Text>
                </View>
              ) : (
                displayWords.map((w) => {
                  const sym = getWordSymbol(w.label, w.emoji);
                  return (
                    <View
                      key={w.id}
                      style={[styles.tableRow, w.hidden && styles.wordRowHidden]}
                    >
                      <Pressable
                        onPress={() => {
                          playWord(
                            {
                              label: wordLabel(w.phrase || w.label, lang),
                              audioUri: w.audioUri,
                              useTextToSpeech: w.useTextToSpeech,
                            },
                            lang,
                            settings.speechRate
                          );
                        }}
                        style={[styles.colCell, { flex: 1.8, flexDirection: "row", alignItems: "center", gap: 8 }]}
                      >
                        <View style={[styles.wordBadgeIcon, { backgroundColor: sym.bg, overflow: "hidden" }]}>
                          {w.imageUri ? (
                            <Image
                              source={{ uri: w.imageUri }}
                              style={{ width: 28, height: 28, borderRadius: 6 }}
                              resizeMode="contain"
                            />
                          ) : (
                            <Text style={[styles.wordBadgeIconText, { color: sym.color }]}>
                              {sym.symbol}
                            </Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.wordLabelText,
                              w.hidden && styles.textHiddenDim,
                            ]}
                            numberOfLines={1}
                          >
                            {wordLabel(w.label, lang)}
                          </Text>
                          {w.hidden && (
                            <Text style={styles.wordHiddenNote}>Hidden</Text>
                          )}
                        </View>
                      </Pressable>

                      <View style={[styles.colCell, { flex: 1, alignItems: "center" }]}>
                        <View style={styles.useCountPill}>
                          <Text style={styles.useCountPillText}>
                            {w.useCount ? `${w.useCount}x` : "0x"}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.colCell, { flex: 1, alignItems: "center" }]}>
                        <Text style={styles.lastUsedDateText} numberOfLines={1}>
                          {formatLastUsed(w.lastUsedAt)}
                        </Text>
                      </View>

                      <View style={[styles.colCell, { width: 88, flexDirection: "row", justifyContent: "flex-end", gap: 8 }]}>
                        {/* Edit Word Button */}
                        <Pressable
                          onPress={() => setEditorWord(w)}
                          hitSlop={6}
                          accessibilityLabel={`Edit ${w.label}`}
                        >
                          <Ionicons name="pencil-outline" size={16} color="#235E50" />
                        </Pressable>

                        {/* Eye Toggle */}
                        <Pressable
                          onPress={() => toggleWordHidden(w.id, !w.hidden)}
                          hitSlop={6}
                        >
                          <Ionicons
                            name={w.hidden ? "eye-off" : "eye-outline"}
                            size={16}
                            color={w.hidden ? "#B8AFA2" : "#235E50"}
                          />
                        </Pressable>

                        {/* Working Delete */}
                        <Pressable
                          onPress={() =>
                            setDeleteTarget({
                              type: "word",
                              id: w.id,
                              name: w.label,
                            })
                          }
                          hitSlop={6}
                        >
                          <Ionicons name="trash-outline" size={16} color="#A39D90" />
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      {/* MODAL: Working Delete Confirmation Dialog (Reliable on Web + Mobile) */}
      <Modal
        visible={deleteTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Delete {deleteTarget?.type === "shelf" ? "Shelf" : "Word"}?
              </Text>
              <Pressable
                onPress={() => setDeleteTarget(null)}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#777777" />
              </Pressable>
            </View>

            <Text style={styles.deleteConfirmMessage}>
              Are you sure you want to delete{" "}
              <Text style={{ fontWeight: "800", color: "#1A3830" }}>
                "{deleteTarget?.name}"
              </Text>
              ? This action cannot be undone.
            </Text>

            <View style={styles.modalFooter}>
              <Pressable onPress={() => setDeleteTarget(null)} style={styles.cancelTextBtn}>
                <Text style={styles.cancelTextBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={executeDelete}
                style={[styles.actionPillBtn, { backgroundColor: "#C44545" }]}
              >
                <Ionicons name="trash" size={16} color="#FFFFFF" />
                <Text style={styles.actionPillBtnText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: Edit Category / Shelf (Parent Editing) */}
      <Modal
        visible={editCatOpen && catToEdit !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setEditCatOpen(false);
          setCatToEdit(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: "90%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {catToEdit?.parentCategoryId ? "Edit Sub-Category" : "Edit Shelf / Category"}
              </Text>
              <Pressable
                onPress={() => {
                  setEditCatOpen(false);
                  setCatToEdit(null);
                }}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#777777" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Category Name */}
              <Text style={styles.fieldLabel}>Category name</Text>
              <TextInput
                value={editCatName}
                onChangeText={setEditCatName}
                placeholder="e.g. Food, Actions, Drinks, Toys"
                placeholderTextColor="#9E9E9E"
                style={styles.inputBoxCoral}
              />

              {/* Category Icon / Emoji */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Icon / Emoji</Text>
              <View style={styles.editCatIconWrap}>
                <TextInput
                  value={editCatIcon}
                  onChangeText={setEditCatIcon}
                  style={styles.editCatCustomIconInput}
                  maxLength={4}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.editCatIconRow}>
                  {["💬", "🍽️", "⚡", "😊", "♡", "🧸", "🎨", "🏫", "⚽", "🛁", "🎸", "🚗", "🍎", "💧", "👗", "💊", "🛏️", "💻", "🐶", "⭐", "📁"].map((ic) => (
                    <Pressable
                      key={ic}
                      onPress={() => setEditCatIcon(ic)}
                      style={[
                        styles.editCatIconChip,
                        editCatIcon === ic && styles.editCatIconChipActive,
                      ]}
                    >
                      <Text style={styles.editCatIconText}>{ic}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Theme Color */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Theme color</Text>
              <View style={styles.colorSwatchesRow}>
                {[
                  "#235E50",
                  "#4A7FE6",
                  "#E67E22",
                  "#8A6BC9",
                  "#5C9A58",
                  "#C96B6B",
                  "#D46CAE",
                  "#D5E8DF",
                  "#FCE7D6",
                  "#D6ECFA",
                ].map((c) => {
                  const isSelected = editCatColor === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setEditCatColor(c)}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c },
                        isSelected && styles.colorSwatchSelected,
                      ]}
                    />
                  );
                })}
              </View>

              {/* Category Picture / Pictogram */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Category Picture (Optional)</Text>
              <View style={styles.editCatPicRow}>
                {editCatImageUri ? (
                  <View style={styles.editCatPicPreviewWrap}>
                    <Image source={{ uri: editCatImageUri }} style={styles.editCatPicPreview} resizeMode="contain" />
                    <Pressable
                      onPress={() => setEditCatImageUri(undefined)}
                      style={styles.editCatPicRemoveBtn}
                      hitSlop={6}
                    >
                      <Ionicons name="close-circle" size={20} color="#C44545" />
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.editCatPicEmptyWrap}>
                    <Text style={{ fontSize: 24 }}>{editCatIcon || "📁"}</Text>
                  </View>
                )}

                <Pressable
                  onPress={() =>
                    setImagePickerTarget({
                      type: "editCat",
                      label: editCatName.trim() || catToEdit?.name || "Category",
                      currentUri: editCatImageUri,
                    })
                  }
                  style={styles.editCatPickPicBtn}
                >
                  <Ionicons name="images-outline" size={16} color="#235E50" />
                  <Text style={styles.editCatPickPicBtnText}>
                    {editCatImageUri ? "Change Picture" : "Choose Picture"}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => {
                  setEditCatOpen(false);
                  setCatToEdit(null);
                }}
                style={styles.cancelTextBtn}
              >
                <Text style={styles.cancelTextBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveEditCategory}
                style={styles.actionPillBtn}
                disabled={!editCatName.trim()}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.actionPillBtnText}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: Voice Category & Word Creator (Caregiver Space) */}
      <Modal
        visible={voiceOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          stopVoiceCapture();
          setVoiceOpen(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: "90%" }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={styles.voiceModalIconBubble}>
                  <Ionicons name="mic" size={18} color="#235E50" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Voice Add</Text>
                  <Text style={styles.modalSubHeader}>Create shelf, sub-category, or words by voice</Text>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  stopVoiceCapture();
                  setVoiceOpen(false);
                }}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#777777" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Live Microphone Box */}
              <View style={[styles.voiceMicLiveBox, voiceListening ? styles.voiceMicLiveBoxActive : null]}>
                <Pressable
                  onPress={() => (voiceListening ? stopVoiceCapture() : startVoiceCapture())}
                  style={[styles.voiceMicCircleBtn, voiceListening ? styles.voiceMicCircleBtnActive : null]}
                >
                  <Ionicons name={voiceListening ? "mic" : "mic-outline"} size={32} color="#FFFFFF" />
                </Pressable>

                <Text style={styles.voiceMicStatusText}>
                  {voiceListening ? "Listening... Speak now!" : "Tap microphone to speak"}
                </Text>
                <Text style={styles.voiceExampleHint}>
                  Try: "create category of name of apple" or "fruits" or "add word pizza"
                </Text>

                {/* Spoken Transcript Bubble */}
                <View style={styles.voiceTranscriptWrap}>
                  <Text style={styles.voiceTranscriptLabel}>What you said:</Text>
                  <Text style={styles.voiceTranscriptText}>
                    "{voiceRawTranscript || (voiceListening ? "Listening..." : "Waiting for voice...")}"
                  </Text>
                </View>

                {/* Quick Simulation / Test Voice Chips */}
                <View style={{ marginTop: 10, width: "100%" }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#6A7B76", marginBottom: 6, textTransform: "uppercase" }}>
                    Quick Voice Test Samples:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {[
                      "categories fruits, animals, vehicles",
                      "fruits with subcategories berries, citrus, melons",
                      "subcategories breakfast, lunch, dinner, drinks",
                      "add words pizza, burger, pasta, fries",
                      "eat, run, sleep, walk",
                    ].map((sample) => (
                      <Pressable
                        key={sample}
                        onPress={() => {
                          setVoiceRawTranscript(sample);
                          applyVoiceText(sample);
                        }}
                        style={{
                          backgroundColor: "#FFFFFF",
                          borderWidth: 1,
                          borderColor: "#CCDCD5",
                          borderRadius: 14,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: "#1F594A", fontWeight: "600" }}>
                          🎤 "{sample}"
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Target Type Selector (Auto-detected, user can toggle) */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>What would you like to create?</Text>
              <View style={styles.voiceTypeRow}>
                <Pressable
                  onPress={() => setVoiceTargetType("category")}
                  style={[styles.voiceTypePill, voiceTargetType === "category" && styles.voiceTypePillActive]}
                >
                  <Ionicons
                    name="folder-outline"
                    size={14}
                    color={voiceTargetType === "category" ? "#FFFFFF" : "#235E50"}
                  />
                  <Text
                    style={[
                      styles.voiceTypePillText,
                      voiceTargetType === "category" && styles.voiceTypePillTextActive,
                    ]}
                  >
                    Main Shelf
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setVoiceTargetType("subcategory")}
                  style={[styles.voiceTypePill, voiceTargetType === "subcategory" && styles.voiceTypePillActive]}
                >
                  <Ionicons
                    name="file-tray-stacked-outline"
                    size={14}
                    color={voiceTargetType === "subcategory" ? "#FFFFFF" : "#235E50"}
                  />
                  <Text
                    style={[
                      styles.voiceTypePillText,
                      voiceTargetType === "subcategory" && styles.voiceTypePillTextActive,
                    ]}
                  >
                    Sub-category
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setVoiceTargetType("word")}
                  style={[styles.voiceTypePill, voiceTargetType === "word" && styles.voiceTypePillActive]}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={14}
                    color={voiceTargetType === "word" ? "#FFFFFF" : "#235E50"}
                  />
                  <Text
                    style={[
                      styles.voiceTypePillText,
                      voiceTargetType === "word" && styles.voiceTypePillTextActive,
                    ]}
                  >
                    Word(s)
                  </Text>
                </Pressable>
              </View>

              {/* If Sub-category chosen: Target Parent Shelf Selector */}
              {voiceTargetType === "subcategory" && (
                <View style={{ marginTop: 10, marginBottom: 4 }}>
                  <Text style={styles.fieldLabel}>Choose Parent Shelf</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modalTargetRow}>
                    {cats.map((c) => {
                      const isSelected = (voiceShelfId || currentShelf?.id) === c.id;
                      return (
                        <Pressable
                          key={c.id}
                          onPress={() => setVoiceShelfId(c.id)}
                          style={[styles.modalTargetPill, isSelected && styles.modalTargetPillActive]}
                        >
                          <Text style={[styles.modalTargetPillText, isSelected && styles.modalTargetPillTextActive]}>
                            {c.icon || "📁"} {c.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* If Word(s) chosen: 2-Step Category & Sub-category Selector */}
              {voiceTargetType === "word" && (
                <View style={{ marginTop: 10, marginBottom: 4 }}>
                  <Text style={styles.fieldLabel}>1. Choose Shelf (Category)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.modalTargetRow, { marginBottom: 6 }]}>
                    {cats.map((c) => {
                      const isSelected = (voiceShelfId || currentShelf?.id) === c.id;
                      return (
                        <Pressable
                          key={c.id}
                          onPress={() => {
                            setVoiceShelfId(c.id);
                            const subs = childCategories(c.id);
                            setVoiceSubCatId(subs.length > 0 ? subs[0].id : null);
                          }}
                          style={[styles.modalTargetPill, isSelected && styles.modalTargetPillActive]}
                        >
                          <Text style={[styles.modalTargetPillText, isSelected && styles.modalTargetPillTextActive]}>
                            {c.icon || "📁"} {c.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                    <Text style={styles.fieldLabel}>
                      2. Choose Sub-category in "{voiceTargetShelf?.name || "Shelf"}"
                    </Text>
                    {voiceSubCatId && voiceTargetSubCats.some((s) => s.id === voiceSubCatId) && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#E7F3EE", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                        <Ionicons name="checkmark-circle" size={11} color="#235E50" />
                        <Text style={{ fontSize: 10, color: "#235E50", fontWeight: "700" }}>
                          Target: {getCategory(voiceSubCatId)?.name}
                        </Text>
                      </View>
                    )}
                  </View>
                  {voiceTargetSubCats.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modalTargetRow}>
                      {voiceTargetSubCats.map((sc) => (
                        <Pressable
                          key={sc.id}
                          onPress={() => setVoiceSubCatId(sc.id)}
                          style={[styles.modalTargetPill, voiceSubCatId === sc.id && styles.modalTargetPillActive]}
                        >
                          <Text style={[styles.modalTargetPillText, voiceSubCatId === sc.id && styles.modalTargetPillTextActive]}>
                            {sc.icon || "📁"} {sc.name}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.noSubCatsBox}>
                      <Ionicons name="alert-circle-outline" size={16} color="#D97706" />
                      <Text style={styles.noSubCatsText}>
                        "{voiceTargetShelf?.name}" has no sub-categories yet. Words can only be added to sub-categories.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Clean Output Preview (Filtered of Noise) */}
              <View style={styles.voiceSmartFilterBanner}>
                <Ionicons name="sparkles" size={16} color="#1F594A" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.voiceSmartFilterTitle}>
                    Noise & Boilerplate Filtered
                  </Text>
                  <Text style={styles.voiceSmartFilterSub}>
                    Commands like "create category of name of apple" or lists like "fruits, animals, vehicles" are cleanly parsed with picture & emoji matched.
                  </Text>
                </View>
              </View>

              {/* Detected Bulk Items Tag Cloud / Chips */}
              {voiceItems.length > 1 && (
                <View style={styles.voiceBulkItemsBox}>
                  <View style={styles.voiceBulkItemsHeader}>
                    <Ionicons name="flash" size={14} color="#1F594A" />
                    <Text style={styles.voiceBulkItemsTitle}>
                      ⚡ Detected {voiceItems.length} {voiceTargetType === "category" ? "Shelves" : voiceTargetType === "subcategory" ? "Sub-categories" : "Words"} in Bulk:
                    </Text>
                  </View>
                  <View style={styles.voiceBulkChipsWrap}>
                    {voiceItems.map((item, idx) => (
                      <View key={`${item}-${idx}`} style={styles.voiceBulkChip}>
                        <Text style={{ fontSize: 13 }}>{getCategoryIconForName(item)}</Text>
                        <Text style={styles.voiceBulkChipText}>{item}</Text>
                        <Pressable
                          onPress={() => {
                            const next = voiceItems.filter((_, i) => i !== idx);
                            setVoiceItems(next);
                            if (next.length > 0) setVoiceName(next[0]);
                          }}
                          hitSlop={6}
                        >
                          <Ionicons name="close-circle" size={14} color="#777777" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                  <Text style={{ fontSize: 11, color: "#235E50", marginTop: 6, fontWeight: "500" }}>
                    ✨ All {voiceItems.length} items will be created together with matching icons & colors.
                  </Text>
                </View>
              )}

              {/* Detected Sub-categories if hierarchical */}
              {voiceSubItems.length > 0 && (
                <View style={[styles.voiceBulkItemsBox, { backgroundColor: "#EBF5F1", borderColor: "#A2CEC0" }]}>
                  <View style={styles.voiceBulkItemsHeader}>
                    <Ionicons name="file-tray-stacked-outline" size={14} color="#1F594A" />
                    <Text style={styles.voiceBulkItemsTitle}>
                      📑 Sub-categories under "{voiceName || voiceItems[0]}":
                    </Text>
                  </View>
                  <View style={styles.voiceBulkChipsWrap}>
                    {voiceSubItems.map((sub, idx) => (
                      <View key={`${sub}-${idx}`} style={styles.voiceBulkChip}>
                        <Text style={{ fontSize: 13 }}>{getCategoryIconForName(sub)}</Text>
                        <Text style={styles.voiceBulkChipText}>{sub}</Text>
                        <Pressable
                          onPress={() => {
                            setVoiceSubItems((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          hitSlop={6}
                        >
                          <Ionicons name="close-circle" size={14} color="#777777" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Clean Name Input (Parent can edit if needed) */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                {voiceTargetType === "word" ? "Word / Items to add" : "Category name"}
              </Text>
              <TextInput
                value={voiceName}
                onChangeText={(txt) => {
                  setVoiceName(txt);
                  const parsed = parseVoiceCategoryCommand(txt);
                  setVoiceIcon(parsed.icon);
                  if (parsed.imageUri) setVoiceImageUri(parsed.imageUri);
                }}
                placeholder="e.g. Apple"
                placeholderTextColor="#9E9E9E"
                style={styles.inputBoxCoral}
              />

              {/* Icon & Picture */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Icon & Picture</Text>
              <View style={styles.editCatPicRow}>
                {voiceImageUri ? (
                  <View style={styles.editCatPicPreviewWrap}>
                    <Image source={{ uri: voiceImageUri }} style={styles.editCatPicPreview} resizeMode="contain" />
                    <Pressable
                      onPress={() => setVoiceImageUri(undefined)}
                      style={styles.editCatPicRemoveBtn}
                      hitSlop={6}
                    >
                      <Ionicons name="close-circle" size={20} color="#C44545" />
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.editCatPicEmptyWrap}>
                    <Text style={{ fontSize: 24 }}>{voiceIcon || "📁"}</Text>
                  </View>
                )}

                <Pressable
                  onPress={() =>
                    setImagePickerTarget({
                      type: "voiceCat",
                      label: voiceName.trim() || "Item",
                      currentUri: voiceImageUri,
                    })
                  }
                  style={styles.editCatPickPicBtn}
                >
                  <Ionicons name="images-outline" size={16} color="#235E50" />
                  <Text style={styles.editCatPickPicBtnText}>
                    {voiceImageUri ? "Change Picture" : "Choose Picture"}
                  </Text>
                </Pressable>
              </View>

              {/* Color Swatches */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Theme color</Text>
              <View style={styles.colorSwatchesRow}>
                {PASTEL_PALETTE.map((c) => {
                  const isSelected = voiceColor === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setVoiceColor(c)}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c },
                        isSelected && styles.colorSwatchSelected,
                      ]}
                    />
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => {
                  stopVoiceCapture();
                  setVoiceOpen(false);
                }}
                style={styles.cancelTextBtn}
              >
                <Text style={styles.cancelTextBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveVoice}
                style={styles.actionPillBtn}
                disabled={!voiceName.trim() && voiceItems.length === 0}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.actionPillBtnText}>
                  {voiceTargetType === "category"
                    ? voiceItems.length > 1
                      ? `Add ${voiceItems.length} Shelves in Bulk`
                      : voiceSubItems.length > 0
                      ? `Add Shelf + ${voiceSubItems.length} Sub-categories`
                      : "Add Shelf"
                    : voiceTargetType === "subcategory"
                    ? voiceItems.length > 1
                      ? `Add ${voiceItems.length} Sub-categories in Bulk`
                      : "Add Sub-category"
                    : voiceItems.length > 1
                    ? `Add ${voiceItems.length} Words in Bulk`
                    : "Add Word"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 1: Add Sub-Category (Matches Screenshot 2) */}
      <Modal
        visible={subCatOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSubCatOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add to {currentShelf ? currentShelf.name : "Core"}
              </Text>
              <Pressable
                onPress={() => setSubCatOpen(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#777777" />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Sub–category name(s)</Text>
            <TextInput
              value={subCatName}
              onChangeText={setSubCatName}
              placeholder="e.g. Breakfast, Lunch, Dinner, Snack"
              placeholderTextColor="#9E9E9E"
              style={styles.inputBoxCoral}
              autoFocus
            />
            <Text style={styles.fieldHint}>
              Separate multiple sub-categories with commas or new lines.
            </Text>

            <View style={styles.modalFooter}>
              <Pressable onPress={() => setSubCatOpen(false)} style={styles.cancelTextBtn}>
                <Text style={styles.cancelTextBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleCreateSubCategory} style={styles.actionPillBtn}>
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.actionPillBtnText}>Add sub-category</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Add a Word (Matches Screenshot 3) */}
      <Modal
        visible={addWordOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddWordOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add a word</Text>
              <Pressable
                onPress={() => setAddWordOpen(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#777777" />
              </Pressable>
            </View>

            {/* Target Category / Sub-Category Selector */}
            {subCats.length > 0 ? (
              <View style={{ marginBottom: 14 }}>
                <Text style={styles.fieldLabel}>Save word to sub-category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.modalTargetRow}
                >
                  {subCats.map((sc) => (
                    <Pressable
                      key={sc.id}
                      onPress={() => setModalTargetCatId(sc.id)}
                      style={[
                        styles.modalTargetPill,
                        modalTargetCatId === sc.id && styles.modalTargetPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalTargetPillText,
                          modalTargetCatId === sc.id && styles.modalTargetPillTextActive,
                        ]}
                      >
                        {sc.icon || "📁"} {sc.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View style={{ marginBottom: 14 }}>
                <Text style={styles.fieldLabel}>Save word to sub-category</Text>
                <View style={styles.noSubCatsBox}>
                  <Ionicons name="alert-circle-outline" size={16} color="#D97706" />
                  <Text style={styles.noSubCatsText}>
                    Please create a sub-category in "{currentShelf?.name}" first. Words cannot be added to main shelf.
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.fieldLabel}>Word or phrase</Text>
            <TextInput
              value={newWordText}
              onChangeText={setNewWordText}
              placeholder="e.g. Cook, Eat, Walk, Happy"
              placeholderTextColor="#9E9E9E"
              style={styles.inputBoxCoral}
              autoFocus
            />

            {/* Live 4-Form Auto-Generated Verb Card */}
            {detectedVerbForms && (
              <View style={styles.verbFormsCard}>
                <View style={styles.verbFormsHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                    <Ionicons name="sparkles" size={15} color="#235E50" />
                    <Text style={styles.verbFormsTitle}>Verb Forms (1st, 2nd, 3rd, 4th)</Text>
                  </View>
                  <Pressable
                    onPress={() => setAutoAddVerbForms(!autoAddVerbForms)}
                    style={styles.verbCheckboxRow}
                    accessibilityLabel="Toggle auto-add all 4 verb forms"
                  >
                    <Ionicons
                      name={autoAddVerbForms ? "checkbox" : "square-outline"}
                      size={18}
                      color="#235E50"
                    />
                    <Text style={styles.verbCheckboxLabel}>Auto-add 4 forms</Text>
                  </Pressable>
                </View>

                <View style={styles.verbGrid}>
                  <View style={styles.verbTilePreview}>
                    <Text style={styles.verbFormBadge}>1st · Base</Text>
                    <Text style={styles.verbTileWord}>{detectedVerbForms.base}</Text>
                  </View>
                  <View style={styles.verbTilePreview}>
                    <Text style={styles.verbFormBadge}>2nd · Past</Text>
                    <Text style={styles.verbTileWord}>{detectedVerbForms.past}</Text>
                  </View>
                  <View style={styles.verbTilePreview}>
                    <Text style={styles.verbFormBadge}>3rd · Participle</Text>
                    <Text style={styles.verbTileWord}>{detectedVerbForms.participle}</Text>
                  </View>
                  <View style={styles.verbTilePreview}>
                    <Text style={styles.verbFormBadge}>4th · Continuous</Text>
                    <Text style={styles.verbTileWord}>{detectedVerbForms.continuous}</Text>
                  </View>
                </View>
                <Text style={styles.verbHintText}>
                  {autoAddVerbForms
                    ? "✨ All 4 forms will automatically be added as individual shelf tiles."
                    : "Only this single word will be added."}
                </Text>
              </View>
            )}

            {/* Image Selection (1. Gallery, 2. App Library, 3. Chrome Search) */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Picture (3 Options)</Text>
            <View style={styles.imagePickerRow}>
              {newWordImageUri ? (
                <View style={styles.imagePreviewBox}>
                  <Image source={{ uri: newWordImageUri }} style={styles.imagePreviewThumb} resizeMode="contain" />
                  <Pressable
                    onPress={() => setNewWordImageUri(undefined)}
                    style={styles.imagePreviewRemove}
                    hitSlop={6}
                    accessibilityLabel="Remove image"
                  >
                    <Ionicons name="close" size={12} color="#ffffff" />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.imagePlaceholderBox}>
                  <Ionicons name="image-outline" size={24} color="#8A9590" />
                </View>
              )}
              <View style={{ flex: 1, gap: 3 }}>
                <Pressable
                  onPress={() =>
                    setImagePickerTarget({
                      type: "word",
                      label: newWordText || "Word",
                      currentUri: newWordImageUri,
                    })
                  }
                  style={styles.pickImageBtn}
                >
                  <Ionicons name="sparkles" size={14} color="#ffffff" />
                  <Text style={styles.pickImageBtnText}>
                    {newWordImageUri ? "Change Picture" : "Choose Picture"}
                  </Text>
                </Pressable>
                <Text style={styles.imagePickerHint}>
                  1. Gallery • 2. App Library • 3. Chrome Search
                </Text>
              </View>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Tile color</Text>
            <View style={styles.colorSwatchesRow}>
              {PASTEL_PALETTE.map((c) => {
                const isSelected = newWordColor === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setNewWordColor(c)}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c },
                      isSelected && styles.colorSwatchSelected,
                    ]}
                  />
                );
              })}
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => {
                  setAddWordOpen(false);
                  setNewWordImageUri(undefined);
                }}
                style={styles.cancelTextBtn}
              >
                <Text style={styles.cancelTextBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleCreateWord} style={styles.actionPillBtn}>
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.actionPillBtnText}>Add word</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: New Shelf */}
      <Modal
        visible={newShelfOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setNewShelfOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New shelf</Text>
              <Pressable
                onPress={() => setNewShelfOpen(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#777777" />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Shelf name(s)</Text>
            <TextInput
              value={newShelfName}
              onChangeText={setNewShelfName}
              placeholder="e.g. Daily Routine, School, Emotions, Food"
              placeholderTextColor="#9E9E9E"
              style={styles.inputBoxCoral}
              autoFocus
            />
            <Text style={styles.fieldHint}>
              Separate multiple shelves with commas or new lines to create in bulk.
            </Text>

            {/* Shelf Image Selection (1. Gallery, 2. App Library, 3. Chrome Search) */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Shelf Picture (3 Options)</Text>
            <View style={styles.imagePickerRow}>
              {newShelfImageUri ? (
                <View style={styles.imagePreviewBox}>
                  <Image source={{ uri: newShelfImageUri }} style={styles.imagePreviewThumb} resizeMode="contain" />
                  <Pressable
                    onPress={() => setNewShelfImageUri(undefined)}
                    style={styles.imagePreviewRemove}
                    hitSlop={6}
                    accessibilityLabel="Remove image"
                  >
                    <Ionicons name="close" size={12} color="#ffffff" />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.imagePlaceholderBox}>
                  <Text style={{ fontSize: 22 }}>{newShelfIcon || "📁"}</Text>
                </View>
              )}
              <View style={{ flex: 1, gap: 3 }}>
                <Pressable
                  onPress={() =>
                    setImagePickerTarget({
                      type: "shelf",
                      label: newShelfName || "Shelf",
                      currentUri: newShelfImageUri,
                    })
                  }
                  style={styles.pickImageBtn}
                >
                  <Ionicons name="sparkles" size={14} color="#ffffff" />
                  <Text style={styles.pickImageBtnText}>
                    {newShelfImageUri ? "Change Picture" : "Choose Picture"}
                  </Text>
                </Pressable>
                <Text style={styles.imagePickerHint}>
                  1. Gallery • 2. App Library • 3. Chrome Search
                </Text>
              </View>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Shelf icon</Text>
            <View style={styles.shelfIconsRow}>
              {SHELF_ICONS.map((ic) => (
                <Pressable
                  key={ic}
                  onPress={() => setNewShelfIcon(ic)}
                  style={[
                    styles.shelfIconPickBtn,
                    newShelfIcon === ic && styles.shelfIconPickBtnActive,
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>{ic}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => {
                  setNewShelfOpen(false);
                  setNewShelfImageUri(undefined);
                }}
                style={styles.cancelTextBtn}
              >
                <Text style={styles.cancelTextBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleCreateShelf} style={styles.actionPillBtn}>
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.actionPillBtnText}>Create shelf</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: Unified Bulk Creator (Words | Main Shelves | Sub-categories) */}
      <Modal
        visible={bulkModalOpen || bulkWordsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setBulkModalOpen(false);
          setBulkWordsOpen(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxWidth: 540, height: "86%", maxHeight: 660, display: "flex", flexDirection: "column" }]}>
            <View style={[styles.modalHeader, { flexShrink: 0 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={styles.bulkModalIconBadge}>
                  <Ionicons name="flash" size={18} color="#235E50" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Bulk Creator Center</Text>
                  <Text style={styles.modalSubtitle}>
                    {bulkModalTab === "words"
                      ? `Add words to sub-category: ${modalTargetCatId && targetWordsSubCats.some((s) => s.id === modalTargetCatId) ? getCategory(modalTargetCatId)?.name : targetWordsSubCats[0]?.name || "Select sub-category"}`
                      : bulkModalTab === "shelves"
                      ? "Create multiple main shelves and sub-categories"
                      : `Add sub-categories to ${(bulkTargetShelfId ? cats.find((c) => c.id === bulkTargetShelfId)?.name : null) || currentShelf?.name || "Shelf"}`}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  setBulkModalOpen(false);
                  setBulkWordsOpen(false);
                }}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#777777" />
              </Pressable>
            </View>

            {/* Segmented Control Tabs */}
            <View style={[styles.bulkSegmentRow, { flexShrink: 0 }]}>
              <Pressable
                onPress={() => setBulkModalTab("words")}
                style={[styles.bulkSegmentBtn, bulkModalTab === "words" && styles.bulkSegmentBtnActive]}
              >
                <Ionicons
                  name="chatbubbles-outline"
                  size={15}
                  color={bulkModalTab === "words" ? "#FFFFFF" : "#235E50"}
                />
                <Text
                  style={[
                    styles.bulkSegmentBtnText,
                    bulkModalTab === "words" && styles.bulkSegmentBtnTextActive,
                  ]}
                >
                  Words
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setBulkModalTab("shelves")}
                style={[styles.bulkSegmentBtn, bulkModalTab === "shelves" && styles.bulkSegmentBtnActive]}
              >
                <Ionicons
                  name="folder-outline"
                  size={15}
                  color={bulkModalTab === "shelves" ? "#FFFFFF" : "#235E50"}
                />
                <Text
                  style={[
                    styles.bulkSegmentBtnText,
                    bulkModalTab === "shelves" && styles.bulkSegmentBtnTextActive,
                  ]}
                >
                  Main Shelves
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setBulkModalTab("subcats");
                  if (!bulkTargetShelfId) {
                    setBulkTargetShelfId(currentShelf?.id || cats[0]?.id || null);
                  }
                }}
                style={[styles.bulkSegmentBtn, bulkModalTab === "subcats" && styles.bulkSegmentBtnActive]}
              >
                <Ionicons
                  name="file-tray-stacked-outline"
                  size={15}
                  color={bulkModalTab === "subcats" ? "#FFFFFF" : "#235E50"}
                />
                <Text
                  style={[
                    styles.bulkSegmentBtnText,
                    bulkModalTab === "subcats" && styles.bulkSegmentBtnTextActive,
                  ]}
                >
                  Sub-categories
                </Text>
              </Pressable>
            </View>

            {/* TAB 1: BULK WORDS */}
            {bulkModalTab === "words" && (
              <View style={{ flex: 1, flexDirection: "column", minHeight: 0 }}>
                {/* Fixed Top Controls */}
                <View style={{ flexShrink: 0 }}>
                  {/* Step 1: Choose Main Category / Shelf */}
                  <View style={{ marginBottom: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                      <Text style={styles.fieldLabel}>1. Choose Shelf (Category)</Text>
                      <Text style={{ fontSize: 11, color: "#235E50", fontWeight: "700" }}>
                        Active: {targetWordsShelf?.icon || "📁"} {targetWordsShelf?.name || "Shelf"}
                      </Text>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.modalTargetRow}
                    >
                      {cats.map((c) => {
                        const isSelected = (bulkWordsShelfId || currentShelf?.id) === c.id;
                        return (
                          <Pressable
                            key={c.id}
                            onPress={() => {
                              setBulkWordsShelfId(c.id);
                              const subs = childCategories(c.id);
                              setModalTargetCatId(subs.length > 0 ? subs[0].id : null);
                            }}
                            style={[
                              styles.modalTargetPill,
                              isSelected && styles.modalTargetPillActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.modalTargetPillText,
                                isSelected && styles.modalTargetPillTextActive,
                              ]}
                            >
                              {c.icon || "📁"} {c.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Step 2: Choose Sub-category in this Shelf */}
                  <View style={{ marginBottom: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                      <Text style={styles.fieldLabel}>
                        2. Choose Sub-category in "{targetWordsShelf?.name || "Shelf"}"
                      </Text>
                      {modalTargetCatId && targetWordsSubCats.some((s) => s.id === modalTargetCatId) && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#E7F3EE", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                          <Ionicons name="checkmark-circle" size={11} color="#235E50" />
                          <Text style={{ fontSize: 10, color: "#235E50", fontWeight: "700" }}>
                            Target: {getCategory(modalTargetCatId)?.name}
                          </Text>
                        </View>
                      )}
                    </View>
                    {targetWordsSubCats.length > 0 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.modalTargetRow}
                      >
                        {targetWordsSubCats.map((sc) => (
                          <Pressable
                            key={sc.id}
                            onPress={() => setModalTargetCatId(sc.id)}
                            style={[
                              styles.modalTargetPill,
                              modalTargetCatId === sc.id && styles.modalTargetPillActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.modalTargetPillText,
                                modalTargetCatId === sc.id && styles.modalTargetPillTextActive,
                              ]}
                            >
                              {sc.icon || "📁"} {sc.name}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    ) : (
                      <View style={styles.noSubCatsBox}>
                        <Ionicons name="alert-circle-outline" size={16} color="#D97706" />
                        <Text style={styles.noSubCatsText}>
                          "{targetWordsShelf?.name}" has no sub-categories yet. Words can only be added to sub-categories.
                        </Text>
                        <Pressable
                          onPress={() => {
                            setBulkTargetShelfId(targetWordsShelf?.id || null);
                            setBulkModalTab("subcats");
                          }}
                          style={styles.quickCreateSubCatBtn}
                        >
                          <Text style={styles.quickCreateSubCatBtnText}>+ Create sub-categories</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={styles.fieldLabel}>Type or paste words</Text>
                    <Pressable
                      onPress={() => toggleBulkVoice("words")}
                      style={[styles.bulkVoiceMicBtn, bulkVoiceActive === "words" && styles.bulkVoiceMicBtnActive]}
                      accessibilityLabel="Speak words with microphone"
                    >
                      <Ionicons
                        name={bulkVoiceActive === "words" ? "mic" : "mic-outline"}
                        size={13}
                        color={bulkVoiceActive === "words" ? "#FFFFFF" : "#235E50"}
                      />
                      <Text style={[styles.bulkVoiceMicBtnText, bulkVoiceActive === "words" && styles.bulkVoiceMicBtnTextActive]}>
                        {bulkVoiceActive === "words" ? "Listening..." : "🎙️ Speak words"}
                      </Text>
                    </Pressable>
                  </View>
                  <TextInput
                    value={bulkWordsText}
                    onChangeText={setBulkWordsText}
                    placeholder={"e.g. apple, banana, milk, bread, eat, sleep\nor paste one word per line"}
                    placeholderTextColor="#9E9E9E"
                    style={[styles.inputBoxCoral, { height: 60, textAlignVertical: "top", paddingTop: 6 }]}
                    multiline
                  />
                  <Text style={[styles.fieldHint, { marginBottom: 4 }]}>
                    Separate words with commas, semicolons, or new lines. A picture is matched automatically.
                  </Text>
                </View>

                {/* The Scrolling List Area (ONLY this list scrolls) */}
                {parsedBulkWords.length > 0 ? (
                  <View style={{ flex: 1, minHeight: 0, marginTop: 4 }}>
                    <View style={styles.bulkPreviewHeaderRow}>
                      <Text style={styles.bulkPreviewTitle}>
                        Words ({parsedBulkWords.length} items · {totalExpectedTiles} tiles)
                      </Text>
                      <Text style={styles.bulkImageTip}>
                        Tap 🖼️ to pick custom photo
                      </Text>
                    </View>

                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 6 }} showsVerticalScrollIndicator={true}>
                      <View style={styles.bulkItemsList}>
                        {parsedBulkWords.map((pw, i) => {
                          const vForms = generateAllVerbForms(pw);
                          const isV = !!vForms;
                          const customImg = bulkWordsImages[pw] || bulkWordsImages[pw.toLowerCase()];
                          const autoImg = getPictogramUrl(pw);
                          const displayImg = customImg || autoImg || undefined;

                          return (
                            <View key={`${pw}-${i}`} style={[styles.bulkWordItemCard, isV && styles.bulkWordItemCardVerb]}>
                              <Pressable
                                onPress={() =>
                                  setImagePickerTarget({
                                    type: "bulkWord",
                                    label: pw,
                                    currentUri: displayImg,
                                  })
                                }
                                style={styles.bulkWordItemThumbWrap}
                                accessibilityLabel={`Choose picture for ${pw}`}
                              >
                                {displayImg ? (
                                  <Image source={{ uri: displayImg }} style={styles.bulkWordItemThumb} resizeMode="contain" />
                                ) : (
                                  <Ionicons name="image-outline" size={20} color="#8A9590" />
                                )}
                                <View style={styles.bulkWordThumbBadge}>
                                  <Ionicons name="camera" size={9} color="#FFFFFF" />
                                </View>
                              </Pressable>

                              <View style={{ flex: 1 }}>
                                <Text style={styles.bulkWordItemName}>{pw}</Text>
                                <Text style={[styles.bulkWordItemType, isV ? styles.bulkWordItemTypeVerb : styles.bulkWordItemTypeNoun]}>
                                  {isV ? "✨ Verb (4 forms: base, past, participle, -ing)" : "🔹 Noun (1 single tile)"}
                                </Text>
                              </View>

                              <Pressable
                                onPress={() =>
                                  setImagePickerTarget({
                                    type: "bulkWord",
                                    label: pw,
                                    currentUri: displayImg,
                                  })
                                }
                                style={[styles.bulkPickImgBtn, customImg ? styles.bulkPickImgBtnActive : null]}
                              >
                                <Ionicons name={customImg ? "checkmark-circle" : "image"} size={13} color={customImg ? "#1F594A" : "#FFFFFF"} />
                                <Text style={[styles.bulkPickImgBtnText, customImg ? styles.bulkPickImgBtnTextActive : null]}>
                                  {customImg ? "Photo set" : "Picture"}
                                </Text>
                              </Pressable>
                            </View>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                ) : (
                  <View style={[styles.bulkPicHintBox, { flex: 1, justifyContent: "center", marginVertical: 8 }]}>
                    <Ionicons name="images-outline" size={20} color="#1F594A" />
                    <Text style={styles.bulkPicHintText}>
                      Start typing words above — each one will show up here with its own picture, which you can customize from Gallery, App Library, or Chrome Search.
                    </Text>
                  </View>
                )}

                {/* Fixed Footer at the bottom */}
                <View style={[styles.modalFooter, { marginTop: "auto", paddingTop: 10, borderTopWidth: 1, borderTopColor: "#EAE5D8", flexShrink: 0 }]}>
                  <Pressable
                    onPress={() => {
                      setBulkModalOpen(false);
                      setBulkWordsOpen(false);
                    }}
                    style={styles.cancelTextBtn}
                  >
                    <Text style={styles.cancelTextBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleBulkAddWords}
                    style={[
                      styles.actionPillBtn,
                      (parsedBulkWords.length === 0 || targetWordsSubCats.length === 0 || !modalTargetCatId) && { opacity: 0.5 },
                    ]}
                    disabled={parsedBulkWords.length === 0 || targetWordsSubCats.length === 0 || !modalTargetCatId}
                  >
                    <Ionicons name="flash" size={16} color="#FFFFFF" />
                    <Text style={styles.actionPillBtnText}>
                      Add {parsedBulkWords.length > 0 ? `${totalExpectedTiles} tiles` : "words"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* TAB 2: BULK MAIN SHELVES */}
            {bulkModalTab === "shelves" && (
              <View style={{ flex: 1, flexDirection: "column", minHeight: 0 }}>
                {/* Fixed Top Controls */}
                <View style={{ flexShrink: 0 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={styles.fieldLabel}>Type or paste shelf names</Text>
                    <Pressable
                      onPress={() => toggleBulkVoice("shelves")}
                      style={[styles.bulkVoiceMicBtn, bulkVoiceActive === "shelves" && styles.bulkVoiceMicBtnActive]}
                      accessibilityLabel="Speak shelf names with microphone"
                    >
                      <Ionicons
                        name={bulkVoiceActive === "shelves" ? "mic" : "mic-outline"}
                        size={13}
                        color={bulkVoiceActive === "shelves" ? "#FFFFFF" : "#235E50"}
                      />
                      <Text style={[styles.bulkVoiceMicBtnText, bulkVoiceActive === "shelves" && styles.bulkVoiceMicBtnTextActive]}>
                        {bulkVoiceActive === "shelves" ? "Listening..." : "🎙️ Speak shelves"}
                      </Text>
                    </Pressable>
                  </View>
                  <TextInput
                    value={bulkShelvesText}
                    onChangeText={setBulkShelvesText}
                    placeholder={"e.g. Animals, Vehicles, Food, Places\nOr: Food: Breakfast, Lunch, Dinner"}
                    placeholderTextColor="#9E9E9E"
                    style={[styles.inputBoxCoral, { height: 70, textAlignVertical: "top", paddingTop: 8 }]}
                    multiline
                  />
                  <Text style={[styles.fieldHint, { marginBottom: 6 }]}>
                    Separate shelves with commas or new lines. You can also use "Category: Sub1, Sub2" syntax to create main shelves with sub-categories together!
                  </Text>

                  {/* Quick Shelf Presets */}
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#6A7B76", marginBottom: 4, textTransform: "uppercase" }}>
                      Quick Templates (Tap to add):
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {[
                        "Food: Breakfast, Lunch, Dinner, Snacks",
                        "Places: Home, School, Park, Store",
                        "Feelings: Happy, Sad, Tired, Excited",
                        "Animals, Toys, Clothes, Vehicles",
                      ].map((tmpl) => (
                        <Pressable
                          key={tmpl}
                          onPress={() => {
                            setBulkShelvesText((prev) => (prev ? `${prev}\n${tmpl}` : tmpl));
                          }}
                          style={styles.templateChip}
                        >
                          <Text style={styles.templateChipText}>+ {tmpl}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* The Scrolling List Area (ONLY this list scrolls) */}
                {parsedBulkShelves.length > 0 ? (
                  <View style={{ flex: 1, minHeight: 0, marginTop: 4 }}>
                    <View style={styles.bulkPreviewHeaderRow}>
                      <Text style={styles.bulkPreviewTitle}>
                        Ready to create {parsedBulkShelves.length} Shelves in Bulk:
                      </Text>
                      <Text style={styles.bulkImageTip}>
                        Tap 🖼️ to pick custom photo
                      </Text>
                    </View>
                    <ScrollView
                      style={{ flex: 1 }}
                      contentContainerStyle={{ paddingBottom: 6 }}
                      showsVerticalScrollIndicator={true}
                    >
                      <View style={styles.bulkItemsList}>
                        {parsedBulkShelves.map((sh, idx) => {
                          const customImg = bulkShelvesImages[sh.name];
                          const autoImg = getPictogramUrl(sh.name);
                          const displayImg = customImg || autoImg || undefined;

                          return (
                            <View key={`${sh.name}-${idx}`} style={styles.bulkWordItemCard}>
                              <Pressable
                                onPress={() =>
                                  setImagePickerTarget({
                                    type: "bulkShelf",
                                    label: sh.name,
                                    currentUri: displayImg,
                                  })
                                }
                                style={styles.bulkWordItemThumbWrap}
                                accessibilityLabel={`Choose picture for ${sh.name}`}
                              >
                                {displayImg ? (
                                  <Image source={{ uri: displayImg }} style={styles.bulkWordItemThumb} resizeMode="contain" />
                                ) : (
                                  <Text style={{ fontSize: 20 }}>{sh.icon}</Text>
                                )}
                                <View style={styles.bulkWordThumbBadge}>
                                  <Ionicons name="camera" size={9} color="#FFFFFF" />
                                </View>
                              </Pressable>

                              <View style={{ flex: 1 }}>
                                <Text style={styles.bulkWordItemName}>{sh.name}</Text>
                                {sh.subcats.length > 0 ? (
                                  <Text style={styles.bulkShelfSubList}>
                                    Includes {sh.subcats.length} sub-categories: {sh.subcats.join(", ")}
                                  </Text>
                                ) : (
                                  <Text style={styles.bulkShelfSubListEmpty}>
                                    Main shelf (ready to hold words or sub-categories)
                                  </Text>
                                )}
                              </View>

                              <Pressable
                                onPress={() =>
                                  setImagePickerTarget({
                                    type: "bulkShelf",
                                    label: sh.name,
                                    currentUri: displayImg,
                                  })
                                }
                                style={[styles.bulkPickImgBtn, customImg ? styles.bulkPickImgBtnActive : null]}
                              >
                                <Ionicons
                                  name={customImg ? "checkmark-circle" : "image"}
                                  size={13}
                                  color={customImg ? "#1F594A" : "#FFFFFF"}
                                />
                                <Text style={[styles.bulkPickImgBtnText, customImg ? styles.bulkPickImgBtnTextActive : null]}>
                                  {customImg ? "Photo set" : "Picture"}
                                </Text>
                              </Pressable>
                            </View>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                ) : (
                  <View style={[styles.bulkPicHintBox, { flex: 1, justifyContent: "center", marginVertical: 8 }]}>
                    <Ionicons name="folder-outline" size={20} color="#1F594A" />
                    <Text style={styles.bulkPicHintText}>
                      Type shelf names above. Icons and pictures are automatically detected for each shelf!
                    </Text>
                  </View>
                )}

                {/* Fixed Footer at the bottom */}
                <View style={[styles.modalFooter, { marginTop: "auto", paddingTop: 10, borderTopWidth: 1, borderTopColor: "#EAE5D8", flexShrink: 0 }]}>
                  <Pressable
                    onPress={() => {
                      setBulkModalOpen(false);
                      setBulkWordsOpen(false);
                    }}
                    style={styles.cancelTextBtn}
                  >
                    <Text style={styles.cancelTextBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCreateBulkShelves}
                    style={[styles.actionPillBtn, parsedBulkShelves.length === 0 && { opacity: 0.5 }]}
                    disabled={parsedBulkShelves.length === 0}
                  >
                    <Ionicons name="folder-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.actionPillBtnText}>
                      Create {parsedBulkShelves.length > 0 ? `${parsedBulkShelves.length} Shelves` : "Shelves"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* TAB 3: BULK SUB-CATEGORIES */}
            {bulkModalTab === "subcats" && (
              <View style={{ flex: 1, flexDirection: "column", minHeight: 0 }}>
                {/* Fixed Top Controls */}
                <View style={{ flexShrink: 0 }}>
                  <Text style={styles.fieldLabel}>Choose Parent Shelf</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[styles.modalTargetRow, { marginBottom: 6 }]}
                  >
                    {cats.map((c) => {
                      const isSelected = (bulkTargetShelfId || currentShelf?.id) === c.id;
                      return (
                        <Pressable
                          key={c.id}
                          onPress={() => setBulkTargetShelfId(c.id)}
                          style={[
                            styles.modalTargetPill,
                            isSelected && styles.modalTargetPillActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.modalTargetPillText,
                              isSelected && styles.modalTargetPillTextActive,
                            ]}
                          >
                            {c.icon || "📁"} {c.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4, marginBottom: 4 }}>
                    <Text style={styles.fieldLabel}>Type or paste sub-categories</Text>
                    <Pressable
                      onPress={() => toggleBulkVoice("subcats")}
                      style={[styles.bulkVoiceMicBtn, bulkVoiceActive === "subcats" && styles.bulkVoiceMicBtnActive]}
                      accessibilityLabel="Speak sub-categories with microphone"
                    >
                      <Ionicons
                        name={bulkVoiceActive === "subcats" ? "mic" : "mic-outline"}
                        size={13}
                        color={bulkVoiceActive === "subcats" ? "#FFFFFF" : "#235E50"}
                      />
                      <Text style={[styles.bulkVoiceMicBtnText, bulkVoiceActive === "subcats" && styles.bulkVoiceMicBtnTextActive]}>
                        {bulkVoiceActive === "subcats" ? "Listening..." : "🎙️ Speak sub-categories"}
                      </Text>
                    </Pressable>
                  </View>
                  <TextInput
                    value={bulkSubCatsText}
                    onChangeText={setBulkSubCatsText}
                    placeholder={"e.g. Breakfast, Lunch, Dinner, Snack, Drinks\nor one sub-category per line"}
                    placeholderTextColor="#9E9E9E"
                    style={[styles.inputBoxCoral, { height: 70, textAlignVertical: "top", paddingTop: 8 }]}
                    multiline
                  />
                  <Text style={[styles.fieldHint, { marginBottom: 6 }]}>
                    Separate sub-categories with commas or new lines. They will all be added under the chosen parent shelf with matching icons & colors.
                  </Text>

                  {/* Quick Sub-category Presets */}
                  <View style={{ marginBottom: 8 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {[
                        "Breakfast, Lunch, Dinner, Snacks",
                        "Drinks, Desserts, Fruit, Veggies",
                        "Morning Routine, Evening Routine",
                        "Indoor, Outdoor, School, Park",
                      ].map((tmpl) => (
                        <Pressable
                          key={tmpl}
                          onPress={() => {
                            setBulkSubCatsText((prev) => (prev ? `${prev}\n${tmpl}` : tmpl));
                          }}
                          style={styles.templateChip}
                        >
                          <Text style={styles.templateChipText}>+ {tmpl}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* The Scrolling List Area (ONLY this list scrolls) */}
                {parsedBulkSubCats.length > 0 ? (
                  <View style={{ flex: 1, minHeight: 0, marginTop: 4 }}>
                    <View style={styles.bulkPreviewHeaderRow}>
                      <Text style={styles.bulkPreviewTitle}>
                        Ready to add {parsedBulkSubCats.length} Sub-categories in Bulk:
                      </Text>
                      <Text style={styles.bulkImageTip}>
                        Tap 🖼️ to pick custom photo
                      </Text>
                    </View>
                    <ScrollView
                      style={{ flex: 1 }}
                      contentContainerStyle={{ paddingBottom: 6 }}
                      showsVerticalScrollIndicator={true}
                    >
                      <View style={styles.bulkItemsList}>
                        {parsedBulkSubCats.map((sc, idx) => {
                          const customImg = bulkSubCatsImages[sc];
                          const autoImg = getPictogramUrl(sc);
                          const displayImg = customImg || autoImg || undefined;
                          const icon = getCategoryIconForName(sc);
                          const parentShelf = (bulkTargetShelfId ? cats.find((c) => c.id === bulkTargetShelfId) : null) || currentShelf;

                          return (
                            <View key={`${sc}-${idx}`} style={styles.bulkWordItemCard}>
                              <Pressable
                                onPress={() =>
                                  setImagePickerTarget({
                                    type: "bulkSubCat",
                                    label: sc,
                                    currentUri: displayImg,
                                  })
                                }
                                style={styles.bulkWordItemThumbWrap}
                                accessibilityLabel={`Choose picture for ${sc}`}
                              >
                                {displayImg ? (
                                  <Image source={{ uri: displayImg }} style={styles.bulkWordItemThumb} resizeMode="contain" />
                                ) : (
                                  <Text style={{ fontSize: 20 }}>{icon}</Text>
                                )}
                                <View style={styles.bulkWordThumbBadge}>
                                  <Ionicons name="camera" size={9} color="#FFFFFF" />
                                </View>
                              </Pressable>

                              <View style={{ flex: 1 }}>
                                <Text style={styles.bulkWordItemName}>{sc}</Text>
                                <Text style={styles.bulkShelfSubListEmpty}>
                                  Under parent shelf: {parentShelf?.name || "Shelf"}
                                </Text>
                              </View>

                              <Pressable
                                onPress={() =>
                                  setImagePickerTarget({
                                    type: "bulkSubCat",
                                    label: sc,
                                    currentUri: displayImg,
                                  })
                                }
                                style={[styles.bulkPickImgBtn, customImg ? styles.bulkPickImgBtnActive : null]}
                              >
                                <Ionicons
                                  name={customImg ? "checkmark-circle" : "image"}
                                  size={13}
                                  color={customImg ? "#1F594A" : "#FFFFFF"}
                                />
                                <Text style={[styles.bulkPickImgBtnText, customImg ? styles.bulkPickImgBtnTextActive : null]}>
                                  {customImg ? "Photo set" : "Picture"}
                                </Text>
                              </Pressable>
                            </View>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                ) : (
                  <View style={[styles.bulkPicHintBox, { flex: 1, justifyContent: "center", marginVertical: 8 }]}>
                    <Ionicons name="file-tray-stacked-outline" size={20} color="#1F594A" />
                    <Text style={styles.bulkPicHintText}>
                      Type sub-categories above — each one will be created under the selected shelf with its own icon.
                    </Text>
                  </View>
                )}

                {/* Fixed Footer at the bottom */}
                <View style={[styles.modalFooter, { marginTop: "auto", paddingTop: 10, borderTopWidth: 1, borderTopColor: "#EAE5D8", flexShrink: 0 }]}>
                  <Pressable
                    onPress={() => {
                      setBulkModalOpen(false);
                      setBulkWordsOpen(false);
                    }}
                    style={styles.cancelTextBtn}
                  >
                    <Text style={styles.cancelTextBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCreateBulkSubCats}
                    style={[styles.actionPillBtn, parsedBulkSubCats.length === 0 && { opacity: 0.5 }]}
                    disabled={parsedBulkSubCats.length === 0}
                  >
                    <Ionicons name="file-tray-stacked-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.actionPillBtnText}>
                      Add {parsedBulkSubCats.length > 0 ? `${parsedBulkSubCats.length} Sub-categories` : "Sub-categories"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Universal 3-Option Image Picker Modal */}
      <UniversalImagePickerModal
        visible={imagePickerTarget !== null}
        title={
          imagePickerTarget?.type === "shelf" || imagePickerTarget?.type === "bulkShelf"
            ? `Choose Shelf Picture for "${imagePickerTarget?.label || "Shelf"}"`
            : imagePickerTarget?.type === "bulkSubCat"
            ? `Choose Picture for Sub-category "${imagePickerTarget?.label || "Sub-category"}"`
            : `Picture for "${imagePickerTarget?.label || "Word"}"`
        }
        currentImageUri={imagePickerTarget?.currentUri}
        defaultSearchTerm={imagePickerTarget?.label}
        onSelectImage={handleImageSelected}
        onRemoveImage={handleImageRemoved}
        onClose={() => setImagePickerTarget(null)}
      />

      {/* Word Editor component for deeper edits */}
      <WordEditor
        visible={editorWord !== null}
        catId={activeCategory?.id || currentShelf?.id || ""}
        word={editorWord}
        onClose={() => setEditorWord(null)}
        onSaved={refresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F5EE",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerMobile: {
    flexDirection: "column",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    flex: 1,
  },
  headerLeftMobile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  headerActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerActionsRowMobile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    width: "100%",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EAE5D9",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  superBadge: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#4A6B62",
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1A3830",
    fontFamily: "serif",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  mainTitleMobile: {
    fontSize: 20,
    lineHeight: 26,
    marginBottom: 0,
  },
  mainSubtitle: {
    fontSize: 14,
    color: "#5C6B66",
    maxWidth: 620,
    lineHeight: 20,
  },
  mainSubtitleMobile: {
    fontSize: 12,
    lineHeight: 16,
  },
  addWordTopBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#235E50",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
    shadowColor: "#235E50",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  addWordTopBtnMobile: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 2,
  },
  addWordTopBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  // WIDE DESKTOP/TABLET LAYOUT
  mainLayoutWide: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 28,
    paddingBottom: 24,
    gap: 20,
  },
  sidebarCard: {
    width: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#EBE5D8",
    shadowColor: "#000000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  sidebarHeader: {
    marginBottom: 12,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A3830",
    fontFamily: "serif",
  },
  sidebarSub: {
    fontSize: 12,
    color: "#7A8580",
    marginTop: 4,
    lineHeight: 16,
  },
  shelfListScroll: {
    flex: 1,
  },
  shelfList: {
    gap: 6,
    paddingVertical: 4,
  },
  shelfRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  shelfRowActive: {
    backgroundColor: "#F6EFE6",
    borderWidth: 1,
    borderColor: "#E5DACE",
  },
  shelfRowHidden: {
    opacity: 0.6,
  },
  shelfRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  shelfDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  shelfIcon: {
    fontSize: 15,
  },
  shelfName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E38",
    flex: 1,
  },
  shelfNameActive: {
    color: "#1A3830",
    fontWeight: "800",
  },
  textHiddenDim: {
    color: "#8A9590",
    textDecorationLine: "line-through",
  },
  hiddenTag: {
    fontSize: 10,
    color: "#A39D90",
    fontStyle: "italic",
    marginLeft: 4,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shelfActionBtn: {
    padding: 4,
  },
  newShelfBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F6EFE6",
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 12,
  },
  newShelfBtnText: {
    color: "#1A3830",
    fontWeight: "700",
    fontSize: 13,
  },
  // Right Column (Words table)
  contentCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#EBE5D8",
    shadowColor: "#000000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 8,
  },
  selectedShelfTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A3830",
    fontFamily: "serif",
  },
  selectedShelfMeta: {
    fontSize: 13,
    color: "#7A8580",
    marginTop: 2,
  },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#DDD8CD",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 240,
    backgroundColor: "#FCFCF9",
  },
  searchInput: {
    fontSize: 13,
    color: "#1A3830",
    flex: 1,
    paddingVertical: 0,
  },
  addSubCatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#DDD8CD",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: "flex-start",
    marginTop: 10,
    marginBottom: 16,
    backgroundColor: "#FAFAF7",
  },
  addSubCatBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A3830",
  },
  sidebarSubCatList: {
    paddingLeft: 18,
    paddingTop: 4,
    paddingBottom: 6,
    gap: 4,
  },
  sidebarSubCatRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  sidebarSubCatRowActive: {
    backgroundColor: "#E2EFE9",
  },
  sidebarSubCatLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  sidebarSubCatIndent: {
    fontSize: 12,
    color: "#8A9590",
    fontWeight: "700",
  },
  sidebarSubCatIcon: {
    fontSize: 13,
  },
  sidebarSubCatName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A5A52",
    flex: 1,
  },
  sidebarSubCatNameActive: {
    fontWeight: "800",
    color: "#1A3830",
  },
  sidebarSubCatCount: {
    fontSize: 11,
    color: "#8A9590",
  },
  sidebarAddSubCatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: "#F2ECE1",
  },
  sidebarAddSubCatText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#235E50",
  },
  subCatPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  subCatTabPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F2EDE4",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5DEC9",
  },
  subCatTabPillActive: {
    backgroundColor: "#235E50",
    borderColor: "#235E50",
  },
  subCatTabIcon: {
    fontSize: 13,
  },
  subCatTabPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2C3E38",
  },
  subCatTabPillTextActive: {
    color: "#FFFFFF",
  },
  subCatTabCountBadge: {
    backgroundColor: "#E0D8CB",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  subCatTabCountBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  subCatTabCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4A5A52",
  },
  subCatTabCountTextActive: {
    color: "#FFFFFF",
  },
  subCatPillActionBtn: {
    padding: 3,
    marginLeft: 2,
  },
  modalTargetRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  modalTargetPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F4EFE6",
    borderWidth: 1.5,
    borderColor: "#DDD7CA",
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 18,
  },
  modalTargetPillActive: {
    backgroundColor: "#E2EFE9",
    borderColor: "#235E50",
  },
  modalTargetPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#544E43",
  },
  modalTargetPillTextActive: {
    color: "#1A3830",
    fontWeight: "800",
  },
  subCatPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F6EFE6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  subCatPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A3830",
  },
  subCatPillCount: {
    fontSize: 11,
    color: "#7A8580",
  },
  tableHead: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ECE7DD",
    paddingBottom: 10,
    marginBottom: 6,
  },
  colHead: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8A9590",
    letterSpacing: 0.8,
  },
  colHeadWord: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  colHeadCount: {
    flex: 1.2,
    alignItems: "center",
  },
  colHeadDate: {
    flex: 1.2,
    alignItems: "center",
  },
  colHeadAction: {
    width: 96,
    alignItems: "flex-end",
  },
  tableBodyScroll: {
    flex: 1,
  },
  tableBody: {
    paddingBottom: 20,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3EFE8",
    paddingVertical: 12,
  },
  wordRowHidden: {
    opacity: 0.55,
  },
  colCell: {
    justifyContent: "center",
  },
  wordBadgeIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  wordBadgeIconText: {
    fontSize: 13,
    fontWeight: "800",
  },
  wordLabelText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A3830",
  },
  wordHiddenNote: {
    fontSize: 10,
    color: "#A39D90",
    fontStyle: "italic",
    marginTop: 2,
  },
  useCountPill: {
    backgroundColor: "#F6EFE6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "center",
  },
  useCountPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2C3E38",
  },
  lastUsedDateText: {
    fontSize: 13,
    color: "#7A8580",
    textAlign: "center",
  },
  actionsCell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  rowActionBtn: {
    padding: 5,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyIcon: {
    fontSize: 38,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A3830",
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: "#7A8580",
    textAlign: "center",
    maxWidth: 320,
  },

  // MOBILE SPECIFIC STYLES
  mobileContainer: {
    flex: 1,
  },
  mobileContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  mobileShelvesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EBE5D8",
  },
  mobileShelvesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  mobileShelvesTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A3830",
    fontFamily: "serif",
  },
  mobileNewShelfSmallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F6EFE6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  mobileNewShelfSmallText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A3830",
  },
  mobileShelvesRow: {
    gap: 8,
    paddingVertical: 2,
  },
  mobileShelfPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#FAF7F0",
    borderWidth: 1,
    borderColor: "#EFEBE1",
  },
  mobileShelfPillActive: {
    backgroundColor: "#F6EFE6",
    borderColor: "#E5DACE",
  },
  mobileShelfPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2C3E38",
  },
  mobileShelfPillTextActive: {
    color: "#1A3830",
    fontWeight: "800",
  },
  mobileTableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EBE5D8",
  },
  mobileTableHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  mobileAddSubBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#DDD8CD",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FAFAF7",
  },
  mobileAddSubBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1A3830",
  },
  mobileSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#DDD8CD",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FCFCF9",
    marginBottom: 14,
  },

  // Modal Common Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(22, 38, 33, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A3830",
    fontFamily: "serif",
  },
  modalCloseBtn: {
    padding: 4,
  },
  deleteConfirmMessage: {
    fontSize: 14,
    color: "#5C6B66",
    lineHeight: 22,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2C3E38",
    marginBottom: 8,
  },
  inputBoxCoral: {
    borderWidth: 1.5,
    borderColor: "#E59688",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1A3830",
    backgroundColor: "#FFFFFF",
  },
  colorSwatchesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  colorSwatchSelected: {
    borderWidth: 2.5,
    borderColor: "#235E50",
  },
  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 14,
    marginTop: 24,
  },
  cancelTextBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cancelTextBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A3830",
  },
  actionPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#235E50",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionPillBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  shelfIconsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  shelfIconPickBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F6EFE6",
    alignItems: "center",
    justifyContent: "center",
  },
  shelfIconPickBtnActive: {
    borderWidth: 2,
    borderColor: "#235E50",
  },
  imagePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f7faf8",
    borderWidth: 1,
    borderColor: "#e3ebe7",
    borderRadius: 10,
    padding: 10,
  },
  imagePlaceholderBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#e8efeb",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePreviewBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d2ded8",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  imagePreviewThumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  imagePreviewRemove: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#c44545",
    alignItems: "center",
    justifyContent: "center",
  },
  pickImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#235E50",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  pickImageBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  imagePickerHint: {
    fontSize: 10,
    color: "#778880",
    fontWeight: "600",
  },
  // Bulk Add Word Top Button
  bulkWordTopBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E2EFE9",
    borderWidth: 1,
    borderColor: "#B8D9CC",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    marginTop: 4,
  },
  bulkWordTopBtnMobile: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 2,
  },
  bulkWordTopBtnText: {
    color: "#1F594A",
    fontSize: 13,
    fontWeight: "700",
  },
  // Verb Forms Preview Card in Add Word Modal
  verbFormsCard: {
    marginTop: 14,
    backgroundColor: "#F2F8F5",
    borderWidth: 1,
    borderColor: "#C5E2D6",
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  verbFormsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  verbFormsTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1F594A",
  },
  verbCheckboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  verbCheckboxLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F594A",
  },
  verbGrid: {
    flexDirection: "row",
    gap: 8,
  },
  verbTilePreview: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D3E7DE",
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  verbFormBadge: {
    fontSize: 9,
    fontWeight: "800",
    color: "#3F7C6B",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  verbTileWord: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A3830",
  },
  noSubCatsBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
    flexWrap: "wrap",
  },
  noSubCatsText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "500",
    flex: 1,
  },
  quickCreateSubCatBtn: {
    backgroundColor: "#235E50",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  quickCreateSubCatBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  bulkVoiceMicBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E2EFE9",
    borderWidth: 1,
    borderColor: "#A9D5C3",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  bulkVoiceMicBtnActive: {
    backgroundColor: "#C44545",
    borderColor: "#C44545",
  },
  bulkVoiceMicBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1F594A",
  },
  bulkVoiceMicBtnTextActive: {
    color: "#FFFFFF",
  },
  verbHintText: {
    fontSize: 11,
    color: "#4A6B62",
    lineHeight: 15,
  },
  // Bulk Words Modal Styles
  bulkModalIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#E2EFE9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#7A8580",
    marginTop: 2,
  },
  fieldHint: {
    fontSize: 11,
    color: "#7A8580",
    marginTop: 6,
    lineHeight: 16,
  },
  verbCheckboxRowBulk: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    backgroundColor: "#F7FAF8",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E3EBE7",
  },
  verbSmartBannerBulk: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 12,
    backgroundColor: "#F2F8F5",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C5E2D6",
  },
  verbSmartIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E2EFE9",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  verbSmartTitleBulk: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1F594A",
  },
  verbSmartSubBulk: {
    fontSize: 11,
    color: "#4A6B62",
    lineHeight: 15,
    marginTop: 2,
  },
  bulkPreviewArea: {
    marginTop: 12,
    gap: 6,
  },
  bulkPreviewTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3D4F48",
  },
  bulkChipRow: {
    gap: 6,
    paddingVertical: 4,
  },
  bulkChip: {
    backgroundColor: "#EAF3EF",
    borderWidth: 1,
    borderColor: "#C5DFD3",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  bulkChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F594A",
  },
  bulkItemsScroll: {
    maxHeight: 220,
    marginTop: 6,
  },
  bulkItemsList: {
    gap: 8,
    paddingVertical: 4,
  },
  bulkWordItemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F7FAF8",
    borderWidth: 1,
    borderColor: "#E3EBE7",
    borderRadius: 12,
    padding: 8,
  },
  bulkWordItemCardVerb: {
    backgroundColor: "#FDFBF4",
    borderColor: "#F4E5BD",
  },
  bulkWordItemThumbWrap: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D3E7DE",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bulkWordItemThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  bulkWordThumbBadge: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#235E50",
    alignItems: "center",
    justifyContent: "center",
  },
  bulkWordItemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A3830",
  },
  bulkWordItemType: {
    fontSize: 11,
    marginTop: 2,
  },
  bulkWordItemTypeNoun: {
    color: "#4A6B62",
  },
  bulkWordItemTypeVerb: {
    color: "#8C5E0A",
    fontWeight: "600",
  },
  bulkPickImgBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#235E50",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bulkPickImgBtnActive: {
    backgroundColor: "#E2EFE9",
    borderWidth: 1,
    borderColor: "#A9D5C3",
  },
  bulkPickImgBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  bulkPickImgBtnTextActive: {
    color: "#1F594A",
    fontSize: 11,
    fontWeight: "700",
  },
  bulkImageTip: {
    fontSize: 11,
    color: "#5C6B66",
    fontStyle: "italic",
  },
  bulkPicHintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#EAF5F1",
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  bulkPicHintText: {
    flex: 1,
    fontSize: 12.5,
    color: "#1F594A",
    lineHeight: 18,
  },
  bulkPreviewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  editCategoryTopPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#E2EFE9",
    borderWidth: 1,
    borderColor: "#A9D5C3",
  },
  editCategoryTopPillText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#235E50",
  },
  mobileEditCategoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F6EFE6",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5DACE",
  },
  mobileEditCategoryBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A3830",
  },
  editCatIconWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editCatCustomIconInput: {
    width: 48,
    height: 40,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EBE5D8",
    borderRadius: 12,
    fontSize: 20,
    textAlign: "center",
  },
  editCatIconRow: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 2,
  },
  editCatIconChip: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F7F5EE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EBE5D8",
  },
  editCatIconChipActive: {
    backgroundColor: "#D5E8DF",
    borderColor: "#235E50",
    borderWidth: 1.5,
  },
  editCatIconText: {
    fontSize: 18,
  },
  editCatPicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  editCatPicPreviewWrap: {
    position: "relative",
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#F7F5EE",
    borderWidth: 1,
    borderColor: "#EBE5D8",
    alignItems: "center",
    justifyContent: "center",
  },
  editCatPicPreview: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  editCatPicRemoveBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
  },
  editCatPicEmptyWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#F7F5EE",
    borderWidth: 1,
    borderColor: "#EBE5D8",
    alignItems: "center",
    justifyContent: "center",
  },
  editCatPickPicBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E2EFE9",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A9D5C3",
  },
  editCatPickPicBtnText: {
    color: "#235E50",
    fontSize: 12.5,
    fontWeight: "700",
  },
  voiceAddTopBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E2EFE9",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#A9D5C3",
  },
  voiceAddTopBtnMobile: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 2,
  },
  voiceAddTopBtnText: {
    color: "#235E50",
    fontSize: 12.5,
    fontWeight: "700",
  },
  voiceModalIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E2EFE9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubHeader: {
    fontSize: 12,
    color: "#7A8580",
    marginTop: 1,
  },
  voiceMicLiveBox: {
    alignItems: "center",
    backgroundColor: "#F7F5EE",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#EBE5D8",
    marginBottom: 8,
  },
  voiceMicLiveBoxActive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#22C55E",
  },
  voiceMicCircleBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#235E50",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#235E50",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 10,
  },
  voiceMicCircleBtnActive: {
    backgroundColor: "#16A34A",
    transform: [{ scale: 1.05 }],
  },
  voiceMicStatusText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1A3830",
    marginBottom: 4,
  },
  voiceExampleHint: {
    fontSize: 11.5,
    color: "#7A8580",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 10,
  },
  voiceTranscriptWrap: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#EBE5D8",
  },
  voiceTranscriptLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#8A9590",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  voiceTranscriptText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F594A",
    fontStyle: "italic",
  },
  voiceTypeRow: {
    flexDirection: "row",
    gap: 8,
  },
  voiceTypePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F7F5EE",
    borderWidth: 1,
    borderColor: "#EBE5D8",
  },
  voiceTypePillActive: {
    backgroundColor: "#235E50",
    borderColor: "#235E50",
  },
  voiceTypePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#235E50",
  },
  voiceTypePillTextActive: {
    color: "#FFFFFF",
  },
  voiceSmartFilterBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#EAF5F1",
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#A9D5C3",
  },
  voiceSmartFilterTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1F594A",
    marginBottom: 2,
  },
  voiceSmartFilterSub: {
    fontSize: 11,
    color: "#4A6B62",
    lineHeight: 15,
  },
  voiceBulkItemsBox: {
    backgroundColor: "#F3FAF6",
    borderWidth: 1,
    borderColor: "#B2D8CA",
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
  },
  voiceBulkItemsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  voiceBulkItemsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F594A",
  },
  voiceBulkChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  voiceBulkChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CCDCD5",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  voiceBulkChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A3830",
  },
  bulkSegmentRow: {
    flexDirection: "row",
    backgroundColor: "#EAE6DB",
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    gap: 4,
  },
  bulkSegmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  bulkSegmentBtnActive: {
    backgroundColor: "#235E50",
  },
  bulkSegmentBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#235E50",
  },
  bulkSegmentBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  templateChip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CCDCD5",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  templateChipText: {
    fontSize: 12,
    color: "#1F594A",
    fontWeight: "600",
  },
  bulkShelfPreviewCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4DFD3",
    borderRadius: 10,
    padding: 10,
  },
  bulkShelfPreviewName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A3830",
  },
  bulkShelfSubList: {
    fontSize: 12,
    color: "#235E50",
    marginTop: 2,
  },
  bulkShelfSubListEmpty: {
    fontSize: 12,
    color: "#777777",
    marginTop: 2,
  },
  newShelfBulkBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CCDCD5",
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  newShelfBulkBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#235E50",
  },
  sidebarAddSubCatBulkBtn: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#EAE5DA",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  sidebarAddSubCatBulkText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#235E50",
  },
  mobileBulkSmallBtn: {
    backgroundColor: "#E5F2ED",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  mobileBulkSmallText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F594A",
  },
});
