import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Baby,
  Shield,
  Search,
  RefreshCw,
  Volume2,
  Grid,
  FolderOpen,
  User as UserIcon,
  ChevronRight,
  Layers,
  MessageSquare,
} from "lucide-react";
import { api } from "../api/client";
import { keep, peek } from "../api/cache";
import { Child } from "../types";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";
import { ErrorNotice } from "../components/common/ErrorNotice";
import { errorMessage } from "../api/errors";

type BoardWord = {
  _id: string;
  label: string;
  phrase?: string;
  emoji?: string;
  imageUri?: string;
  hidden?: boolean;
  useCount?: number;
  verbFormTag?: string;
  translations?: Record<string, string>;
};

type BoardShelf = {
  _id: string;
  name: string;
  icon?: string;
  color?: string;
  parentId?: string | null;
  hidden?: boolean;
  words: BoardWord[];
};

const FORM_LABEL: Record<string, string> = {
  first: "1st",
  s_es: "s/es",
  second: "2nd",
  third: "3rd",
  fourth: "4th",
};

export const ChildrenPage: React.FC = () => {
  const [children, setChildren] = useState<Child[]>(() => peek<Child[]>("children") ?? []);
  const [loading, setLoading] = useState(() => !peek("children"));
  const [params] = useSearchParams();
  const [search, setSearch] = useState(() => params.get("search") ?? "");
  useEffect(() => {
    const fromUrl = params.get("search");
    if (fromUrl !== null) setSearch(fromUrl);
  }, [params]);
  const [error, setError] = useState<string | null>(null);
  const [board, setBoard] = useState<{
    child: string;
    usingDefaultCatalog?: boolean;
    shelves: BoardShelf[];
  } | null>(null);
  const [boardLoading, setBoardLoading] = useState(false);

  // Drill-down selection inside Child's Board Modal
  const [selectedMainId, setSelectedMainId] = useState<string | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [boardSearch, setBoardSearch] = useState("");

  const openBoard = async (c: Child) => {
    setBoardLoading(true);
    setBoardSearch("");
    setSelectedMainId(null);
    setSelectedSubId(null);
    setBoard({ child: c.name, shelves: [] });
    try {
      const res = await api.get(`/admin/children/${c._id}/board`);
      const shelves: BoardShelf[] = res.data?.data?.shelves ?? [];
      const usingDefaultCatalog = !!res.data?.data?.usingDefaultCatalog;
      setBoard({ child: c.name, usingDefaultCatalog, shelves });
      const topLevel = shelves.filter((s) => !s.parentId);
      if (topLevel.length > 0) {
        const firstMain = topLevel[0];
        setSelectedMainId(firstMain._id);
        const subs = shelves.filter((s) => s.parentId === firstMain._id);
        setSelectedSubId(subs[0]?._id ?? firstMain._id);
      }
    } catch (err) {
      setBoard(null);
      alert(errorMessage(err));
    } finally {
      setBoardLoading(false);
    }
  };

  const fetchChildren = async () => {
    if (!peek("children")) setLoading(true);
    setError(null);
    try {
      const response = await api.get("/admin/children", { params: { limit: 50 } });
      setChildren(keep("children", response.data?.data?.children ?? []));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const filteredChildren = children.filter(
    (c) =>
      (c.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.owner?.fullName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.owner?.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Build 3-level hierarchy: Main Category (Shelf) -> Sub-Categories -> Words
  const hierarchy = useMemo(() => {
    if (!board) return [];
    const shelves = board.shelves;
    const byId = new Map(shelves.map((s) => [s._id, s]));
    const mainShelves = shelves.filter((s) => !s.parentId || !byId.has(s.parentId));

    return mainShelves.map((main) => {
      const subCategories = shelves.filter((s) => s.parentId === main._id);
      const totalWords =
        main.words.length + subCategories.reduce((sum, sub) => sum + sub.words.length, 0);
      return {
        ...main,
        subCategories,
        totalWords,
      };
    });
  }, [board]);

  const activeMain = useMemo(
    () => hierarchy.find((m) => m._id === selectedMainId) ?? hierarchy[0] ?? null,
    [hierarchy, selectedMainId]
  );

  const activeSub = useMemo(() => {
    if (!activeMain) return null;
    if (activeMain.subCategories.length === 0) return activeMain;
    return (
      activeMain.subCategories.find((s) => s._id === selectedSubId) ??
      activeMain.subCategories[0] ??
      null
    );
  }, [activeMain, selectedSubId]);

  const displayedWords = useMemo(() => {
    if (!board) return [];
    const q = boardSearch.trim().toLowerCase();
    if (q) {
      // Search across all shelves and subcategories for this child
      const results: Array<BoardWord & { path: string }> = [];
      for (const main of hierarchy) {
        for (const w of main.words) {
          if (
            w.label.toLowerCase().includes(q) ||
            (w.phrase ?? "").toLowerCase().includes(q) ||
            Object.values(w.translations ?? {}).some((t) => t.toLowerCase().includes(q))
          ) {
            results.push({ ...w, path: main.name });
          }
        }
        for (const sub of main.subCategories) {
          for (const w of sub.words) {
            if (
              w.label.toLowerCase().includes(q) ||
              (w.phrase ?? "").toLowerCase().includes(q) ||
              Object.values(w.translations ?? {}).some((t) => t.toLowerCase().includes(q))
            ) {
              results.push({ ...w, path: `${main.name} › ${sub.name}` });
            }
          }
        }
      }
      return results;
    }
    if (!activeSub) return [];
    const pathLabel =
      activeMain && activeSub._id !== activeMain._id
        ? `${activeMain.name} › ${activeSub.name}`
        : activeMain?.name ?? "";
    return activeSub.words.map((w) => ({ ...w, path: pathLabel }));
  }, [board, boardSearch, hierarchy, activeMain, activeSub]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Children & Board Explorer
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            All enrolled children profiles. Click any child to inspect their Main Categories (Shelves) → Sub-Categories → Words.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
          <Shield className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Clinical Shield: Therapy notes & sensory care logs strictly hidden</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl ring-1 ring-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by child name or family account…"
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={fetchChildren}
          className="flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {error && <ErrorNotice message={error} onRetry={fetchChildren} />}

      {/* Grid of Profiles */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredChildren.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400">
          {children.length
            ? "No child matches your search."
            : "No children yet. They appear here once enrolled in the app."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChildren.map((c) => (
            <div
              key={c._id}
              onClick={() => openBoard(c)}
              className="bg-white rounded-2xl p-6 ring-1 ring-slate-200/80 shadow-sm hover:shadow-lg hover:ring-indigo-300 transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {(c.name ?? "?").charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                        {c.name}
                      </h3>
                      <div className="text-xs text-slate-400 font-medium">
                        Age: {c.age} years old
                      </div>
                    </div>
                  </div>
                  <Badge variant={c.settings?.boardMode === "phrase" ? "primary" : "purple"}>
                    {c.settings?.boardMode === "phrase" ? "Phrase Tap" : "Sentence Strip"}
                  </Badge>
                </div>

                {/* Diagnoses Tags */}
                <div className="mb-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Diagnoses & Support
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(c.diagnoses ?? []).map((diag) => (
                      <span
                        key={diag}
                        className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 capitalize"
                      >
                        {diag.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Settings Matrix */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                      Voice & Dialect:
                    </span>
                    <span className="font-semibold text-slate-900 capitalize">
                      {c.settings?.voiceType} ({c.settings?.language || "en-US"})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Grid className="w-3.5 h-3.5 text-slate-400" />
                      Grid Columns:
                    </span>
                    <span className="font-semibold text-slate-900">
                      {c.settings?.boardColumns || 3} cols •{" "}
                      {c.settings?.simpleMode ? "Simple" : "Full"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Baby className="w-3.5 h-3.5 text-slate-400" />
                      Face AI Enrolled:
                    </span>
                    <span
                      className={`font-semibold ${
                        c.face?.consent ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      {c.face?.consent ? "Yes (On-Device 128d)" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Family, board and use */}
              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {c.owner
                      ? `${c.owner.fullName} · ${c.owner.email}`
                      : "Family account linked"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>
                    📁 {c.boardShelves ?? 0} folders · {c.boardWords ?? 0} words
                  </span>
                  <span>💬 {c.usage?.wordsThisWeek ?? 0} taps this week</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>
                    ⭐ {c.rewards?.stars ?? 0} stars · 🔥 {c.rewards?.consecutiveDays ?? 0} days
                  </span>
                  <span>
                    {c.usage?.lastActive
                      ? `Last used ${new Date(c.usage.lastActive).toLocaleDateString()}`
                      : "Ready"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openBoard(c);
                }}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-50 border border-indigo-100 py-2.5 text-xs font-bold text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors"
              >
                <FolderOpen className="w-4 h-4" /> Explore Categories, Sub-Categories & Words
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 3-Level Hierarchical Child Board Modal */}
      <Modal
        isOpen={!!board}
        onClose={() => setBoard(null)}
        title={
          board
            ? `${board.child}'s AAC Board — Categories › Sub-Categories › Words`
            : ""
        }
        maxWidth="4xl"
      >
        {boardLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Loading child's categories, sub-categories, and words…
          </div>
        ) : !board || hierarchy.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No categories found for this child.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search & Summary Bar inside Modal */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                  <Layers className="w-3.5 h-3.5" /> {hierarchy.length} Main Categories
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg">
                  <FolderOpen className="w-3.5 h-3.5" />{" "}
                  {hierarchy.reduce((s, m) => s + m.subCategories.length, 0)} Sub-Categories
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  <MessageSquare className="w-3.5 h-3.5" />{" "}
                  {hierarchy.reduce((s, m) => s + m.totalWords, 0)} Words
                </span>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={boardSearch}
                  onChange={(e) => setBoardSearch(e.target.value)}
                  placeholder="Search words in board…"
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* 3-Column / Step Hierarchy Explorer (No fixed max-h that causes inner grid overflow) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Column 1: Main Categories (Shelves) */}
              <div className="lg:col-span-4 flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                <div className="px-3.5 py-2.5 bg-slate-100/90 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center justify-between shrink-0">
                  <span>1. Main Categories (Shelves)</span>
                  <span className="font-mono text-slate-400">{hierarchy.length}</span>
                </div>
                <div className="overflow-y-auto max-h-52 lg:max-h-[56vh] divide-y divide-slate-100 p-1.5 space-y-1">
                  {hierarchy.map((main) => {
                    const isSelected = activeMain?._id === main._id && !boardSearch;
                    return (
                      <button
                        key={main._id}
                        type="button"
                        onClick={() => {
                          setBoardSearch("");
                          setSelectedMainId(main._id);
                          setSelectedSubId(main.subCategories[0]?._id ?? main._id);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs transition-all ${
                          isSelected
                            ? "bg-indigo-600 text-white font-bold shadow-sm"
                            : "hover:bg-white text-slate-700 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {main.icon && /^https?:\/\//.test(main.icon) ? (
                            <img src={main.icon} alt="" className="w-6 h-6 object-contain shrink-0" />
                          ) : (
                            <span className="text-lg shrink-0">{main.icon || "📁"}</span>
                          )}
                          <div className="truncate">
                            <div className="truncate">{main.name}</div>
                            <div
                              className={`text-[10px] ${
                                isSelected ? "text-indigo-100" : "text-slate-400"
                              }`}
                            >
                              {main.subCategories.length > 0
                                ? `${main.subCategories.length} sub-categories · ${main.totalWords} words`
                                : `${main.totalWords} direct words`}
                            </div>
                          </div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? "text-white" : "text-slate-400"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column 2 & 3: Sub-Categories + Words */}
              <div className="lg:col-span-8 flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white">
                {/* Step 2: Sub-Categories Pill Bar (when selected Main Category has subcategories) */}
                {!boardSearch && activeMain && activeMain.subCategories.length > 0 && (
                  <div className="p-3 bg-slate-50 border-b border-slate-200">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2.5">
                      <span>2. Sub-Categories inside</span>
                      <span className="text-indigo-600 inline-flex items-center gap-1">
                        {activeMain.icon && /^https?:\/\//.test(activeMain.icon) ? (
                          <img src={activeMain.icon} alt="" className="w-4 h-4 object-contain" />
                        ) : (
                          <span>{activeMain.icon || "📁"}</span>
                        )}
                        <span>{activeMain.name}</span>
                      </span>
                      <span className="text-slate-400 font-mono">
                        ({activeMain.subCategories.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-0.5">
                      {activeMain.subCategories.map((sub) => {
                        const isSubActive = activeSub?._id === sub._id;
                        return (
                          <button
                            key={sub._id}
                            type="button"
                            onClick={() => setSelectedSubId(sub._id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              isSubActive
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                            }`}
                          >
                            {sub.icon && /^https?:\/\//.test(sub.icon) ? (
                              <img src={sub.icon} alt="" className="w-4 h-4 object-contain shrink-0" />
                            ) : (
                              <span>{sub.icon || "📂"}</span>
                            )}
                            <span>{sub.name.replace(" / ", " › ")}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                isSubActive
                                  ? "bg-indigo-700 text-indigo-100"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {sub.words.length}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 3: Words Header */}
                <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between text-xs shrink-0">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
                    {boardSearch ? (
                      <span>
                        Search results for “{boardSearch}” ({displayedWords.length} words)
                      </span>
                    ) : (
                      <>
                        <span className="text-slate-400">3. Words in:</span>
                        <span className="text-indigo-600 truncate">
                          {activeMain?.name}
                          {activeSub && activeSub._id !== activeMain?._id
                            ? ` › ${activeSub.name}`
                            : ""}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-slate-400 font-mono shrink-0 ml-2">
                    {displayedWords.length} cards
                  </span>
                </div>

                {/* Step 3: Words Grid */}
                <div className="p-3 overflow-y-auto max-h-96 lg:max-h-[42vh]">
                  {displayedWords.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No words in this selection.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {displayedWords.map((w) => (
                        <div
                          key={w._id}
                          className={`relative rounded-xl bg-slate-50/70 border border-slate-200/90 p-2.5 text-center hover:border-indigo-300 transition-all ${
                            w.hidden ? "opacity-40" : ""
                          }`}
                        >
                          {w.verbFormTag && (
                            <span className="absolute left-1.5 top-1.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                              {FORM_LABEL[w.verbFormTag] ?? w.verbFormTag}
                            </span>
                          )}
                          <div className="h-12 flex items-center justify-center">
                            {w.imageUri ? (
                              <img
                                src={w.imageUri}
                                alt=""
                                className="max-h-12 object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-2xl">{w.emoji || "💬"}</span>
                            )}
                          </div>
                          <div className="text-xs font-extrabold text-slate-800 mt-1.5 truncate">
                            {w.label}
                          </div>
                          {w.phrase && w.phrase !== w.label && (
                            <div className="text-[10px] text-slate-400 truncate">{w.phrase}</div>
                          )}
                          {(w.translations?.["ar-SA"] || w.translations?.["ur-PK"]) && (
                            <div className="text-[10px] text-slate-500 truncate mt-0.5" dir="rtl">
                              {[w.translations?.["ar-SA"], w.translations?.["ur-PK"]]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          )}
                          {boardSearch && (
                            <div className="mt-1 text-[9px] font-semibold text-indigo-600 truncate">
                              {w.path}
                            </div>
                          )}
                          {!!w.useCount && (
                            <div className="mt-0.5 text-[10px] font-semibold text-emerald-600">
                              {w.useCount} taps
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};


