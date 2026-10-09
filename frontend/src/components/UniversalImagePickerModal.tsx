import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors, radius } from "../theme";
import {
  BUILT_IN_SYMBOLS,
  SYMBOL_CATEGORIES,
  searchBuiltInSymbols,
  type BuiltInSymbol,
} from "../modules/builtInImageLibrary";
import { compressImageForTile, saveLocalTileImage } from "../modules/imageSearch";
import { ensureUsedPicturesLoaded, rememberPicture } from "../modules/usedPictures";

interface Props {
  visible: boolean;
  title?: string;
  currentImageUri?: string;
  defaultSearchTerm?: string;
  onSelectImage: (uri: string) => void;
  onRemoveImage?: () => void;
  onClose: () => void;
}

type TabKey = "gallery" | "library" | "web";

interface WebResult {
  id: string;
  name: string;
  url: string;
}

export default function UniversalImagePickerModal({
  visible,
  title = "Select Picture",
  currentImageUri,
  defaultSearchTerm = "",
  onSelectImage,
  onRemoveImage,
  onClose,
}: Props) {
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<TabKey>("library");
  const [usedTick, setUsedTick] = useState(0); // re-read the "Used" pictures once loaded
  useEffect(() => {
    if (visible) ensureUsedPicturesLoaded().then(() => setUsedTick((n) => n + 1));
  }, [visible]);
  /** Every picture picked here is remembered for the library's "⭐ Used" section. */
  const choosePicture = (uri: string, name?: string) => {
    rememberPicture(uri, name || defaultSearchTerm || title.replace(/^Picture for\s*/i, "").replace(/["“”]/g, ""));
    setUsedTick((n) => n + 1);
    onSelectImage(uri);
  };
  const [previewUri, setPreviewUri] = useState<string | undefined>(currentImageUri);

  // App Library Tab state
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryCategory, setLibraryCategory] = useState<string>("all");

  // Chrome / Web Search Tab state
  const [webQuery, setWebQuery] = useState(defaultSearchTerm);
  const [webUrlInput, setWebUrlInput] = useState("");
  const [webSearching, setWebSearching] = useState(false);
  const [webResults, setWebResults] = useState<WebResult[]>([]);
  const [webError, setWebError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setPreviewUri(currentImageUri);
      const cleanTerm = (defaultSearchTerm || "").trim();
      const isPlaceholder =
        !cleanTerm ||
        cleanTerm.toLowerCase().includes("word") ||
        cleanTerm.toLowerCase().includes("shelf") ||
        cleanTerm.toLowerCase().includes("category") ||
        cleanTerm.toLowerCase().startsWith("untitled");
      const initialTerm = isPlaceholder ? "" : cleanTerm;
      setWebQuery(initialTerm);
      setLibraryQuery(""); // Start library clean with all symbols visible
      if (initialTerm) {
        void performWebSearch(initialTerm);
      }
    }
  }, [visible, currentImageUri, defaultSearchTerm]);

  // Option 1: Gallery / Device Upload
  async function pickFromGallery() {
    if (Platform.OS === "web") {
      try {
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!res.canceled && res.assets && res.assets[0]?.uri) {
          const uri = res.assets[0].uri;
          const compressed = await compressImageForTile(uri);
          setPreviewUri(compressed);
          choosePicture(compressed);
          onClose();
          return;
        }
      } catch (err) {
        console.warn("Image picker error on web, using file input fallback:", err);
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
              setPreviewUri(compressed);
              choosePicture(compressed);
              onClose();
            }
          };
          reader.readAsDataURL(file);
        };
        input.click();
      }
      return;
    }

    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets[0]?.uri) {
        // Copy out of the picker's cache into permanent app storage
        const saved = (await saveLocalTileImage(res.assets[0].uri, `pick_${Date.now()}`)) || res.assets[0].uri;
        setPreviewUri(saved);
        choosePicture(saved);
        onClose();
      }
    } catch (err) {
      console.warn("Image picker error:", err);
    }
  }

  async function takePhoto() {
    try {
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets[0]?.uri) {
        const saved = (await saveLocalTileImage(res.assets[0].uri, `photo_${Date.now()}`)) || res.assets[0].uri;
        setPreviewUri(saved);
        choosePicture(saved);
        onClose();
      }
    } catch (err) {
      console.warn("Camera error:", err);
    }
  }

  // Option 2: App Library Selection
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  usedTick; // recompute when the "Used" list changes
  const filteredSymbols = searchBuiltInSymbols(libraryQuery, libraryCategory);

  function handleSelectSymbol(symbol: BuiltInSymbol) {
    setPreviewUri(symbol.url);
    choosePicture(symbol.url, symbol.name);
    onClose();
  }

  // Option 3: Chrome / Web Search
  // All sources run at once (each capped at a few seconds) and pictures show as soon as any arrive,
  // so one slow site can't keep the spinner going.
  const webSearchId = useRef(0);
  async function performWebSearch(searchTerm?: string) {
    const q = (searchTerm ?? webQuery).trim();
    if (!q) return;
    const id = ++webSearchId.current;
    setWebSearching(true);
    setWebError(null);
    setWebResults([]);

    const getJson = async <T,>(url: string): Promise<T | null> => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      try {
        const res = await fetch(url, { signal: ctrl.signal });
        return res.ok ? ((await res.json()) as T) : null;
      } catch {
        return null;
      } finally {
        clearTimeout(timer);
      }
    };
    let found = 0;
    const add = (items: WebResult[]) => {
      if (id !== webSearchId.current || items.length === 0) return;
      found += items.length;
      setWebResults((prev) => {
        const seen = new Set(prev.map((r) => r.url));
        return [...prev, ...items.filter((r) => r.url && !seen.has(r.url))];
      });
    };
    const term = encodeURIComponent(q);

    // AAC symbols (child-friendly drawings) first in the grid, real photos after
    const arasaac = getJson<{ _id: number; keywords?: { keyword?: string }[] }[]>(`https://api.arasaac.org/api/pictograms/en/search/${term}`).then((json) =>
      add((Array.isArray(json) ? json : []).slice(0, 24).map((p) => ({
        id: `ara_${p._id}`,
        name: p.keywords?.[0]?.keyword || q,
        url: `https://static.arasaac.org/pictograms/${p._id}/${p._id}_500.png`,
      }))),
    );
    const openSymbols = getJson<{ id: number; name: string; image_url: string }[]>(`https://www.opensymbols.org/api/v1/symbols/search?q=${term}`).then((json) =>
      add((Array.isArray(json) ? json : []).slice(0, 16).map((item) => ({ id: `os_${item.id}`, name: item.name, url: item.image_url }))),
    );
    // Wikipedia: real photos/logos for anything (cars, brands, places) from matching articles, no key needed
    const wikipedia = getJson<{ query?: { pages?: Record<string, { pageid: number; title: string; thumbnail?: { source?: string } }> } }>(
      `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${term}&gsrlimit=20&prop=pageimages&piprop=thumbnail&pithumbsize=300&format=json&origin=*`,
    ).then((json) =>
      add(Object.values(json?.query?.pages ?? {})
        .filter((pg) => pg.thumbnail?.source)
        .map((pg) => ({ id: `wp_${pg.pageid}`, name: pg.title, url: pg.thumbnail!.source! }))),
    );

    await Promise.allSettled([arasaac, openSymbols, wikipedia]);
    if (id !== webSearchId.current) return;
    setWebSearching(false);
    if (found === 0) setWebError("No online images found for this term. Try another word or paste a Chrome link below.");
  }

  function handleUseWebUrl() {
    const trimmed = webUrlInput.trim();
    if (!trimmed) return;
    setPreviewUri(trimmed);
    choosePicture(trimmed);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { width: Math.min(width - 32, 540) }]}>
          {/* Top Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSubtitle}>
                Select an image from Gallery, App Library, or Chrome Search
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={20} color="#666666" />
            </Pressable>
          </View>

          {/* Current Selection Preview Bar */}
          {previewUri ? (
            <View style={styles.selectedBanner}>
              <Image source={{ uri: previewUri }} style={styles.selectedThumb} resizeMode="contain" />
              <View style={{ flex: 1, paddingHorizontal: 10 }}>
                <Text style={styles.selectedBannerText} numberOfLines={1}>
                  Current picture selected
                </Text>
              </View>
              {onRemoveImage && (
                <Pressable
                  onPress={() => {
                    setPreviewUri(undefined);
                    onRemoveImage();
                  }}
                  style={styles.removeBtn}
                >
                  <Ionicons name="trash-outline" size={14} color="#c44545" />
                  <Text style={styles.removeBtnText}>Remove</Text>
                </Pressable>
              )}
            </View>
          ) : null}

          {/* 3 Option Selector Tabs */}
          <View style={styles.tabsRow}>
            <Pressable
              onPress={() => setActiveTab("gallery")}
              style={[styles.tabBtn, activeTab === "gallery" && styles.tabBtnActive]}
              accessibilityLabel="Tab-Gallery"
            >
              <Ionicons
                name="images-outline"
                size={16}
                color={activeTab === "gallery" ? colors.forest : "#666666"}
              />
              <Text style={[styles.tabBtnText, activeTab === "gallery" && styles.tabBtnTextActive]}>
                1. Gallery
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab("library")}
              style={[styles.tabBtn, activeTab === "library" && styles.tabBtnActive]}
              accessibilityLabel="Tab-App-Library"
            >
              <Ionicons
                name="library-outline"
                size={16}
                color={activeTab === "library" ? colors.forest : "#666666"}
              />
              <Text style={[styles.tabBtnText, activeTab === "library" && styles.tabBtnTextActive]}>
                2. App Library
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab("web")}
              style={[styles.tabBtn, activeTab === "web" && styles.tabBtnActive]}
              accessibilityLabel="Tab-Chrome-Search"
            >
              <Ionicons
                name="globe-outline"
                size={16}
                color={activeTab === "web" ? colors.forest : "#666666"}
              />
              <Text style={[styles.tabBtnText, activeTab === "web" && styles.tabBtnTextActive]}>
                3. Chrome Search
              </Text>
            </Pressable>
          </View>

          {/* Tab Content Container */}
          <View style={styles.tabContent}>
            {/* OPTION 1: GALLERY */}
            {activeTab === "gallery" && (
              <View style={styles.galleryContent}>
                <Pressable onPress={pickFromGallery} style={styles.uploadBigCard}>
                  <View style={styles.uploadIconWrap}>
                    <Ionicons name="folder-open" size={36} color={colors.forest} />
                  </View>
                  <Text style={styles.uploadCardTitle}>Choose from Device Gallery</Text>
                  <Text style={styles.uploadCardSub}>
                    Browse photos, camera roll, or image files on your phone/tablet/computer
                  </Text>
                  <View style={styles.chooseFilePill}>
                    <Ionicons name="cloud-upload" size={16} color="#ffffff" />
                    <Text style={styles.chooseFilePillText}>Select File / Photo</Text>
                  </View>
                </Pressable>

                <Pressable onPress={takePhoto} style={styles.cameraRowBtn}>
                  <Ionicons name="camera-outline" size={18} color={colors.forest} />
                  <Text style={styles.cameraRowBtnText}>Take picture with Camera</Text>
                </Pressable>
              </View>
            )}

            {/* OPTION 2: APP LIBRARY */}
            {activeTab === "library" && (
              <View style={{ flex: 1 }}>
                {/* Search in App Library */}
                <View style={styles.searchBarWrap}>
                  <Ionicons name="search" size={15} color="#888888" />
                  <TextInput
                    value={libraryQuery}
                    onChangeText={setLibraryQuery}
                    placeholder="Search 15,000 pictures (e.g. apple, car, happy)..."
                    placeholderTextColor="#999999"
                    style={styles.searchInput}
                  />
                  {libraryQuery.length > 0 && (
                    <Pressable onPress={() => setLibraryQuery("")} hitSlop={6}>
                      <Ionicons name="close-circle" size={16} color="#999999" />
                    </Pressable>
                  )}
                </View>

                {/* Categories Filter Horizontal Scroll */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryPillsScroll}
                  contentContainerStyle={styles.categoryPillsRow}
                >
                  {SYMBOL_CATEGORIES.map((cat) => {
                    const active = libraryCategory === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => setLibraryCategory(cat.id)}
                        style={[styles.categoryPill, active && styles.categoryPillActive]}
                      >
                        <Text style={{ fontSize: 13 }}>{cat.icon}</Text>
                        <Text
                          style={[
                            styles.categoryPillText,
                            active && styles.categoryPillTextActive,
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Symbols Grid */}
                <ScrollView style={styles.symbolsScroll} contentContainerStyle={styles.symbolsGrid}>
                  {filteredSymbols.length === 0 ? (
                    <View style={styles.emptyWrap}>
                      <Text style={{ fontSize: 32 }}>🔍</Text>
                      <Text style={styles.emptyText}>No symbols matching "{libraryQuery}"</Text>
                    </View>
                  ) : (
                    filteredSymbols.map((item) => {
                      const isSelected = previewUri === item.url;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => handleSelectSymbol(item)}
                          style={[styles.symbolCard, isSelected && styles.symbolCardSelected]}
                          accessibilityLabel={`symbol-${item.id}`}
                        >
                          <Image source={{ uri: item.url }} style={styles.symbolImg} resizeMode="contain" />
                          <Text style={styles.symbolName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          {isSelected && (
                            <View style={styles.checkBadge}>
                              <Ionicons name="checkmark" size={11} color="#ffffff" />
                            </View>
                          )}
                        </Pressable>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}

            {/* OPTION 3: CHROME / WEB SEARCH */}
            {activeTab === "web" && (
              <View style={{ flex: 1 }}>
                {/* Search Bar with button */}
                <View style={styles.searchBarWrap}>
                  <Ionicons name="globe-outline" size={15} color="#888888" />
                  <TextInput
                    value={webQuery}
                    onChangeText={setWebQuery}
                    placeholder="Search online via Chrome/Web..."
                    placeholderTextColor="#999999"
                    style={styles.searchInput}
                    onSubmitEditing={() => performWebSearch()}
                  />
                  <Pressable
                    onPress={() => performWebSearch()}
                    disabled={webSearching || !webQuery.trim()}
                    style={[styles.searchActionBtn, !webQuery.trim() && { opacity: 0.5 }]}
                  >
                    <Text style={styles.searchActionBtnText}>Search</Text>
                  </Pressable>
                </View>

                {/* Direct Image URL input */}
                <View style={styles.pasteUrlBar}>
                  <TextInput
                    value={webUrlInput}
                    onChangeText={setWebUrlInput}
                    placeholder="Or paste any Chrome image link (https://...)"
                    placeholderTextColor="#999999"
                    style={[styles.searchInput, { fontSize: 11 }]}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={handleUseWebUrl}
                    disabled={!webUrlInput.trim()}
                    style={[styles.pasteUrlBtn, !webUrlInput.trim() && { opacity: 0.5 }]}
                  >
                    <Text style={styles.pasteUrlBtnText}>Use Link</Text>
                  </Pressable>
                </View>

                {/* Web Results */}
                {webSearching && webResults.length === 0 ? (
                  <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color={colors.forest} />
                    <Text style={styles.loadingText}>Searching online images...</Text>
                  </View>
                ) : webError && webResults.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <Ionicons name="alert-circle-outline" size={32} color="#c44545" />
                    <Text style={styles.emptyText}>{webError}</Text>
                  </View>
                ) : (
                  <ScrollView style={styles.symbolsScroll} contentContainerStyle={styles.symbolsGrid}>
                    {webResults.map((item) => {
                      const isSelected = previewUri === item.url;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => {
                            setPreviewUri(item.url);
                            choosePicture(item.url, item.name);
                            onClose();
                          }}
                          style={[styles.symbolCard, isSelected && styles.symbolCardSelected]}
                        >
                          <Image source={{ uri: item.url }} style={styles.symbolImg} resizeMode="contain" />
                          <Text style={styles.symbolName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          {isSelected && (
                            <View style={styles.checkBadge}>
                              <Ionicons name="checkmark" size={11} color="#ffffff" />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          {/* Modal Footer */}
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.closeFooterBtn}>
              <Text style={styles.closeFooterBtnText}>Done / Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: radius * 1.3,
    maxHeight: "88%",
    minHeight: 460,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 8,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A3830",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#777777",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f4f0",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#d5ebe4",
  },
  selectedThumb: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: "#ffffff",
  },
  selectedBannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.forest,
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fde8e8",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#c44545",
  },
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    backgroundColor: "#fafafa",
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomColor: colors.forest,
    backgroundColor: "#ffffff",
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666666",
  },
  tabBtnTextActive: {
    color: colors.forest,
    fontWeight: "800",
  },
  tabContent: {
    flex: 1,
    padding: 14,
  },

  // Gallery Option
  galleryContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 16,
  },
  uploadBigCard: {
    width: "100%",
    borderWidth: 2,
    borderColor: "#d9e5e0",
    borderStyle: "dashed",
    borderRadius: 14,
    backgroundColor: "#f8fbf9",
    alignItems: "center",
    padding: 24,
    gap: 8,
  },
  uploadIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e8f4f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  uploadCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A3830",
    textAlign: "center",
  },
  uploadCardSub: {
    fontSize: 12,
    color: "#777777",
    textAlign: "center",
    maxWidth: 320,
    lineHeight: 16,
  },
  chooseFilePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.forest,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    marginTop: 8,
  },
  chooseFilePillText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  cameraRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#f0f6f3",
  },
  cameraRowBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.forest,
  },

  // Library & Web Option
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#fcfcfc",
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#222222",
    padding: 0,
  },
  searchActionBtn: {
    backgroundColor: colors.forest,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  searchActionBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  pasteUrlBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "#f8f8f8",
    marginBottom: 10,
  },
  pasteUrlBtn: {
    backgroundColor: "#333333",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  pasteUrlBtnText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  categoryPillsScroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 40,
    marginBottom: 8,
  },
  categoryPillsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
  },
  categoryPillActive: {
    backgroundColor: colors.forest,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#555555",
  },
  categoryPillTextActive: {
    color: "#ffffff",
  },
  symbolsScroll: {
    flex: 1,
  },
  symbolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 16,
  },
  symbolCard: {
    width: "23%",
    minWidth: 70,
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ebebeb",
    backgroundColor: "#fbfbfb",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    position: "relative",
  },
  symbolCardSelected: {
    borderColor: colors.forest,
    borderWidth: 2,
    backgroundColor: "#e8f4f0",
  },
  symbolImg: {
    width: "72%",
    height: "72%",
  },
  symbolName: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#333333",
    textAlign: "center",
    marginTop: 2,
  },
  checkBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 12,
    color: "#666666",
    fontWeight: "600",
  },
  emptyWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 36,
  },
  emptyText: {
    fontSize: 12,
    color: "#888888",
    textAlign: "center",
    maxWidth: 320,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "flex-end",
  },
  closeFooterBtn: {
    backgroundColor: "#e8f4f0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeFooterBtnText: {
    color: colors.forest,
    fontSize: 12,
    fontWeight: "800",
  },
});
