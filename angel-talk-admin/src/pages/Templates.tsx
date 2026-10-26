import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FolderOpen,
  Plus,
  Search,
  Trash2,
  Pencil,
  Save,
  ImageIcon,
  X,
  ChevronRight,
  ChevronDown,
  Layers,
  MessageSquare,
} from "lucide-react";
import { api } from "../api/client";
import { keep, peek } from "../api/cache";
import { errorMessage } from "../api/errors";
import { SeedTemplate, SeedWord } from "../types";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";
import { ErrorNotice, EmptyState } from "../components/common/ErrorNotice";

/**
 * Categories, Sub-Categories & Words of the app.
 * Groups templates by Main Category (Shelf) -> Sub-Categories -> Words so the Admin Panel
 * matches the exact 3-level hierarchy of the mobile app.
 */

type WordDraft = { label: string; phrase: string; emoji: string; imageUri: string };
const emptyWord: WordDraft = { label: "", phrase: "", emoji: "", imageUri: "" };

const FORM_LABEL: Record<string, string> = {
  first: "1st",
  s_es: "s/es",
  second: "2nd",
  third: "3rd",
  fourth: "4th",
};

const MAIN_ICONS: Record<string, string> = {
  "Alphabets and Numerals": "🔤",
  Animals: "🐾",
  Attributes: "🎨",
  Body: "🖐️",
  Calendar: "📅",
  "Clothing and Accessories": "👕",
  "Computer Electronics and Accessories": "💻",
  Emotions: "😊",
  "Food and Drinks": "🍎",
  "Holidays and Celebrations": "🎉",
  "Hygiene and Personal Care": "🧼",
  "Money and Finance": "💰",
  "Music, Instruments and Equipment": "🎵",
  "Nature and Outdoor": "🌳",
  "Objects In": "🏠",
  "People and Characters": "👨‍👩‍👧‍👦",
  Places: "📍",
  Preposition: "🧭",
  "Sentence Starters, Phrases and Questions": "💬",
  "Songs and Stories": "📖",
  "Sports and Fitness": "⚽",
  "Tools and Supplies": "🛠️",
  "Toys and Leisure Items": "🧸",
  "Transportation and Travel": "🚗",
  Verbs: "⚡",
};

/** Picture for a word from the app's own ARASAAC dictionary (saved in the database). */
async function findPicture(word: string): Promise<string | null> {
  const res = await api.get(`/admin/content/catalog_pictograms`, {
    params: { search: word.trim(), limit: 20 },
  });
  const items: { word: string; url: string }[] = res.data?.data?.items ?? [];
  const exact = items.find((i) => i.word.toLowerCase() === word.trim().toLowerCase());
  return (exact ?? items[0])?.url ?? null;
}

type MainCategoryGroup = {
  mainName: string;
  icon: string;
  directTemplate: SeedTemplate | null;
  subTemplates: Array<{ subName: string; template: SeedTemplate }>;
  totalWords: number;
};

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<SeedTemplate[]>(
    () => peek<SeedTemplate[]>("templates") ?? []
  );
  const [loading, setLoading] = useState(() => !peek("templates"));
  const [error, setError] = useState<string | null>(null);
  const [params] = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    () => peek<SeedTemplate[]>("templates")?.[0]?._id ?? null
  );
  const [expandedMains, setExpandedMains] = useState<Record<string, boolean>>({});

  // editing state of the selected folder
  const [name, setName] = useState("");
  const [words, setWords] = useState<SeedWord[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const [wordModal, setWordModal] = useState<{ index: number | null; draft: WordDraft } | null>(
    null
  );
  const [pictureBusy, setPictureBusy] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newMainName, setNewMainName] = useState("");
  const [newSubName, setNewSubName] = useState("");

  const selected = templates.find((t) => t._id === selectedId) ?? null;

  // ?open=<folder id> from the global search box
  useEffect(() => {
    const open = params.get("open");
    if (open) setSelectedId(open);
  }, [params]);

  const [folderLoading, setFolderLoading] = useState(false);
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  const load = useCallback(async (keepId?: string) => {
    if (!peek("templates")) setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/templates");
      const list: SeedTemplate[] = keep("templates", res.data?.data ?? []);
      setTemplates(list);
      setSelectedId((cur) => {
        const want = keepId ?? cur;
        return want && list.some((t) => t._id === want) ? want : list[0]?._id ?? null;
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const showFolder = (t: SeedTemplate) => {
    setName(t.name);
    setWords([...(t.words ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    setDirty(false);
  };

  // the words of a folder are loaded only when it is opened (the list itself stays small)
  useEffect(() => {
    if (!selectedId) {
      setName("");
      setWords([]);
      return;
    }
    let alive = true;
    const before = peek<SeedTemplate>(`tpl:${selectedId}`);
    if (before) showFolder(before);
    else {
      setWords([]);
      setDirty(false);
      setFolderLoading(true);
    }
    api
      .get(`/admin/templates/${selectedId}`)
      .then((res) => {
        const t = keep<SeedTemplate>(`tpl:${selectedId}`, res.data?.data);
        if (alive && t && !dirtyRef.current) showFolder(t);
      })
      .catch((err) => alive && setError(errorMessage(err)))
      .finally(() => alive && setFolderLoading(false));
    return () => {
      alive = false;
    };
  }, [selectedId]);

  useEffect(() => {
    if (selected && !dirtyRef.current && !peek(`tpl:${selected._id}`)) setName(selected.name);
  }, [selected]);

  // Auto-expand the Main Category of the currently selected template
  useEffect(() => {
    if (selected) {
      const mainName = selected.name.split(" / ")[0].trim();
      setExpandedMains((prev) => ({ ...prev, [mainName]: true }));
    }
  }, [selected]);

  const filtered = useMemo(
    () =>
      templates.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          (t.wordLabels ?? t.words?.map((w) => w.label) ?? []).some((w) =>
            w.toLowerCase().includes(search.toLowerCase())
          )
      ),
    [templates, search]
  );

  // Build 3-level hierarchy: Main Category -> Sub-Categories -> Words
  const mainGroups = useMemo<MainCategoryGroup[]>(() => {
    const groups = new Map<string, MainCategoryGroup>();
    for (const t of filtered) {
      const parts = t.name
        .split(" / ")
        .map((p) => p.trim())
        .filter(Boolean);
      const mainName = parts[0] || t.name;
      const subName = parts.slice(1).join(" / ");
      const count = t.wordCount ?? t.words?.length ?? 0;

      let g = groups.get(mainName);
      if (!g) {
        g = {
          mainName,
          icon: MAIN_ICONS[mainName] || t.icon || "📁",
          directTemplate: null,
          subTemplates: [],
          totalWords: 0,
        };
        groups.set(mainName, g);
      }
      g.totalWords += count;
      if (!subName) {
        g.directTemplate = t;
        if (t.icon) g.icon = t.icon;
      } else {
        g.subTemplates.push({ subName, template: t });
      }
    }
    return [...groups.values()];
  }, [filtered]);

  const choose = (id: string) => {
    if (dirty && !window.confirm("You have unsaved changes in this folder. Leave without saving?"))
      return;
    setSelectedId(id);
  };

  const toggleMain = (group: MainCategoryGroup) => {
    const isExpanded = !!expandedMains[group.mainName];
    setExpandedMains((prev) => ({ ...prev, [group.mainName]: !isExpanded }));
    if (group.directTemplate && group.subTemplates.length === 0) {
      choose(group.directTemplate._id);
    } else if (!isExpanded && group.subTemplates.length > 0) {
      const hasCurrentInside = group.subTemplates.some((s) => s.template._id === selectedId);
      if (!hasCurrentInside) {
        choose(group.subTemplates[0].template._id);
      }
    }
  };

  const activeGroup = useMemo(() => {
    if (!selected) return null;
    const mainName = selected.name.split(" / ")[0].trim();
    return mainGroups.find((g) => g.mainName === mainName) ?? null;
  }, [selected, mainGroups]);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await api.put(`/admin/templates/${selected._id}`, {
        name: name.trim() || selected.name,
        words: words.map((w, i) => ({ ...w, order: i })),
      });
      const saved = keep<SeedTemplate>(`tpl:${selected._id}`, res.data?.data);
      if (saved) showFolder(saved); // now with the Arabic / Urdu made by the server
      await load(selected._id);
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    if (
      !window.confirm(
        `Remove the folder "${selected.name}"? It will no longer be sent to the app.`
      )
    )
      return;
    try {
      await api.delete(`/admin/templates/${selected._id}`);
      await load();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  const createFolder = async () => {
    const m = newMainName.trim();
    const s = newSubName.trim();
    const fullName = m && s ? `${m} / ${s}` : m || s;
    if (!fullName) return;
    try {
      const res = await api.post("/admin/templates", {
        name: fullName,
        words: [],
        forDiagnoses: [],
        order: templates.length,
      });
      setNewFolderOpen(false);
      setNewMainName("");
      setNewSubName("");
      await load(res.data?.data?._id);
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  const openWord = (index: number | null) => {
    const w = index === null ? null : words[index];
    setWordModal({
      index,
      draft: w
        ? { label: w.label, phrase: w.phrase, emoji: w.emoji ?? "", imageUri: w.imageUri ?? "" }
        : { ...emptyWord },
    });
  };

  const applyWord = () => {
    if (!wordModal) return;
    const d = wordModal.draft;
    if (!d.label.trim()) return;
    const before = wordModal.index !== null ? words[wordModal.index] : undefined;
    const word: SeedWord = {
      ...(before ?? {}),
      // a new English word gets new Arabic / Urdu from the server when the folder is saved
      ...(before && before.label.trim().toLowerCase() !== d.label.trim().toLowerCase()
        ? { translations: {} }
        : {}),
      label: d.label.trim(),
      phrase: d.phrase.trim() || d.label.trim(),
      emoji: d.emoji.trim() || undefined,
      imageUri: d.imageUri.trim() || undefined,
    };
    setWords((prev) =>
      wordModal.index === null
        ? [...prev, word]
        : prev.map((w, i) => (i === wordModal.index ? word : w))
    );
    setDirty(true);
    setWordModal(null);
  };

  const autoPicture = async () => {
    if (!wordModal?.draft.label.trim()) return;
    setPictureBusy(true);
    try {
      const url = await findPicture(wordModal.draft.label);
      if (url) setWordModal((m) => (m ? { ...m, draft: { ...m.draft, imageUri: url } } : m));
      else alert("No picture found for this word in the app's picture library.");
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setPictureBusy(false);
    }
  };

  const totalWordsAcrossAll = useMemo(
    () => templates.reduce((acc, t) => acc + (t.wordCount ?? t.words?.length ?? 0), 0),
    [templates]
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Categories, Sub-Categories & Words
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Structured like the mobile app: click a <strong>Main Category (Shelf)</strong> to see
            its <strong>Sub-Categories</strong>, and click a Sub-Category to view or edit its{" "}
            <strong>Words</strong>.
          </p>
        </div>
        <button
          onClick={() => {
            setNewMainName(activeGroup?.mainName ?? "");
            setNewSubName("");
            setNewFolderOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> New Category / Sub-Category
        </button>
      </div>

      {/* Summary Badges */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
          <Layers className="w-3.5 h-3.5" /> {mainGroups.length} Main Categories (Shelves)
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">
          <FolderOpen className="w-3.5 h-3.5" /> {templates.length} Total Folders / Sub-Categories
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
          <MessageSquare className="w-3.5 h-3.5" /> {totalWordsAcrossAll.toLocaleString()} Total
          Words
        </span>
      </div>

      {error && <ErrorNotice message={error} onRetry={() => load(selectedId ?? undefined)} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Tree: Main Categories -> Sub-Categories */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search main categories, sub-categories, or words…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="space-y-2 max-h-[72vh] overflow-y-auto pr-1">
            {loading && templates.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">Loading hierarchy…</div>
            ) : mainGroups.length === 0 ? (
              <EmptyState
                title="No categories"
                hint={
                  templates.length
                    ? "Nothing matches your search."
                    : "Run “npm run seed:catalog” in the backend to load the app's categories."
                }
              />
            ) : (
              mainGroups.map((group) => {
                const hasSubs = group.subTemplates.length > 0;
                const isMainSelected = activeGroup?.mainName === group.mainName;
                const isOpen = !!expandedMains[group.mainName] || !!search.trim();

                return (
                  <div
                    key={group.mainName}
                    className={`rounded-2xl border transition-all overflow-hidden bg-white ${
                      isMainSelected
                        ? "border-indigo-500 ring-2 ring-indigo-500/15 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {/* Level 1: Main Category Header */}
                    <button
                      type="button"
                      onClick={() => toggleMain(group)}
                      className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors ${
                        isMainSelected ? "bg-indigo-50/60" : "hover:bg-slate-50"
                      }`}
                    >
                      {group.icon && /^https?:\/\//.test(group.icon) ? (
                        <img src={group.icon} alt="" className="w-7 h-7 object-contain shrink-0" />
                      ) : (
                        <span className="text-xl shrink-0">{group.icon}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-slate-900 text-sm truncate">
                          {group.mainName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {hasSubs
                            ? `${group.subTemplates.length} sub-categories • ${group.totalWords} words`
                            : `Direct shelf • ${group.totalWords} words`}
                        </div>
                      </div>
                      {hasSubs ? (
                        isOpen ? (
                          <ChevronDown className="w-4 h-4 text-indigo-600 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        )
                      ) : (
                        <Badge
                          variant={
                            group.directTemplate?.source === "app"
                              ? group.directTemplate?.editedByAdmin
                                ? "warning"
                                : "neutral"
                              : "success"
                          }
                        >
                          {group.directTemplate?.source === "app"
                            ? group.directTemplate?.editedByAdmin
                              ? "Edited"
                              : "App"
                            : "Custom"}
                        </Badge>
                      )}
                    </button>

                    {/* Level 2: Nested Sub-Categories */}
                    {hasSubs && isOpen && (
                      <div className="border-t border-slate-100 bg-slate-50/70 p-2 space-y-1">
                        {group.directTemplate && (
                          <button
                            type="button"
                            onClick={() => choose(group.directTemplate!._id)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-all ${
                              selectedId === group.directTemplate._id
                                ? "bg-indigo-600 text-white font-bold shadow-sm"
                                : "text-slate-700 hover:bg-white font-medium"
                            }`}
                          >
                            <span className="truncate">
                              📁 {group.mainName} (General Words)
                            </span>
                            <span className="font-mono text-[10px] opacity-80">
                              {group.directTemplate.wordCount ??
                                group.directTemplate.words?.length ??
                                0}
                            </span>
                          </button>
                        )}
                        {group.subTemplates.map(({ subName, template: subTpl }) => {
                          const isSubSelected = subTpl._id === selectedId;
                          const count = subTpl.wordCount ?? subTpl.words?.length ?? 0;
                          const isNestedSub = subName.includes(" / ");
                          const displaySubName = isNestedSub
                            ? `↳ ${subName.split(" / ").pop()}`
                            : subName;
                          return (
                            <button
                              key={subTpl._id}
                              type="button"
                              onClick={() => choose(subTpl._id)}
                              className={`w-full text-left py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-all ${
                                isNestedSub ? "pl-7 pr-3" : "px-3"
                              } ${
                                isSubSelected
                                  ? "bg-indigo-600 text-white font-bold shadow-sm"
                                  : "text-slate-700 hover:bg-white font-medium"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {subTpl.icon && /^https?:\/\//.test(subTpl.icon) ? (
                                  <img src={subTpl.icon} alt="" className="w-4 h-4 object-contain shrink-0" />
                                ) : (
                                  <span className="text-sm shrink-0">{subTpl.icon || "📂"}</span>
                                )}
                                <span className="truncate">{displaySubName}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                                    isSubSelected
                                      ? "bg-indigo-700 text-indigo-100"
                                      : "bg-slate-200/70 text-slate-600"
                                  }`}
                                >
                                  {count}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Sub-Categories Bar + Level 3 Words Grid */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 ring-1 ring-slate-200/80 shadow-sm">
          {!selected ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              Select a Main Category or Sub-Category to view and edit its words
            </div>
          ) : (
            <div className="space-y-5">
              {/* Sub-Categories Quick Switcher when inside a Main Category with multiple Sub-Categories */}
              {activeGroup && activeGroup.subTemplates.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                      {activeGroup.icon && /^https?:\/\//.test(activeGroup.icon) ? (
                        <img src={activeGroup.icon} alt="" className="w-4 h-4 object-contain" />
                      ) : (
                        <span>{activeGroup.icon}</span>
                      )}
                      <span>{activeGroup.mainName}</span>
                      <span className="text-slate-400 font-normal">
                        — Sub-Categories ({activeGroup.subTemplates.length})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewMainName(activeGroup.mainName);
                        setNewSubName("");
                        setNewFolderOpen(true);
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Sub-Category to {activeGroup.mainName}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {activeGroup.subTemplates.map(({ subName, template: subTpl }) => {
                      const isSubActive = subTpl._id === selected._id;
                      const count = subTpl.wordCount ?? subTpl.words?.length ?? 0;
                      return (
                        <button
                          key={subTpl._id}
                          type="button"
                          onClick={() => choose(subTpl._id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            isSubActive
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                          }`}
                        >
                          {subTpl.icon && /^https?:\/\//.test(subTpl.icon) ? (
                            <img src={subTpl.icon} alt="" className="w-4 h-4 object-contain shrink-0" />
                          ) : (
                            <span>{subTpl.icon || "📂"}</span>
                          )}
                          <span>{subName}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded ${
                              isSubActive
                                ? "bg-indigo-700 text-indigo-100"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Folder / Sub-Category Title & Save Bar */}
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 pb-4">
                <FolderOpen className="w-5 h-5 text-indigo-600 shrink-0" />
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setDirty(true);
                  }}
                  className="flex-1 min-w-[180px] text-lg font-black text-slate-900 border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded-lg px-2 py-1 focus:outline-none"
                />
                <button
                  onClick={save}
                  disabled={!dirty || saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300"
                >
                  <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  onClick={remove}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  title="Remove folder"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  <span className="font-bold text-slate-700">{words.length}</span> word cards in{" "}
                  <span className="font-semibold text-indigo-600">{selected.name}</span>
                  {dirty && (
                    <span className="ml-2 font-bold text-amber-600">• unsaved changes</span>
                  )}
                </div>
                <button
                  onClick={() => openWord(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                >
                  <Plus className="w-3.5 h-3.5" /> Add word
                </button>
              </div>

              {/* Level 3: Words inside the selected Sub-Category / Category */}
              {folderLoading && words.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">Loading words…</div>
              ) : words.length === 0 ? (
                <EmptyState
                  title="This category has no words yet"
                  hint="Click “Add word” to create the first word card."
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[58vh] overflow-y-auto pr-1">
                  {words.map((w, i) => (
                    <div
                      key={`${w.label}-${i}`}
                      className="group relative rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-center hover:border-indigo-300 transition-all"
                    >
                      {w.verbFormTag && (
                        <span className="absolute left-2 top-2 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          {FORM_LABEL[w.verbFormTag] ?? w.verbFormTag}
                        </span>
                      )}
                      <div className="h-16 flex items-center justify-center">
                        {w.imageUri ? (
                          <img
                            src={w.imageUri}
                            alt=""
                            className="max-h-16 max-w-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-3xl">{w.emoji || "💬"}</span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-1.5 truncate">
                        {w.label}
                      </div>
                      {w.phrase && w.phrase !== w.label && (
                        <div className="text-[10px] text-slate-400 truncate">{w.phrase}</div>
                      )}
                      {(w.translations?.["ar-SA"] || w.translations?.["ur-PK"]) && (
                        <div className="text-[10px] text-slate-500 truncate" dir="rtl">
                          {[w.translations?.["ar-SA"], w.translations?.["ur-PK"]]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      )}
                      <div className="absolute right-1.5 top-1.5 hidden gap-1 group-hover:flex">
                        <button
                          onClick={() => openWord(i)}
                          className="p-1 rounded-md bg-white shadow text-slate-500 hover:text-indigo-600"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setWords((prev) => prev.filter((_, j) => j !== i));
                            setDirty(true);
                          }}
                          className="p-1 rounded-md bg-white shadow text-slate-500 hover:text-rose-600"
                          title="Remove"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add / edit word */}
      <Modal
        isOpen={!!wordModal}
        onClose={() => setWordModal(null)}
        title={wordModal?.index === null ? "Add word" : "Edit word"}
      >
        {wordModal && (
          <div className="space-y-4">
            {(["label", "phrase", "emoji"] as const).map((field) => (
              <label key={field} className="block">
                <span className="text-xs font-bold text-slate-600">
                  {field === "label"
                    ? "Word (shown on the card)"
                    : field === "phrase"
                    ? "Spoken phrase (optional)"
                    : "Emoji (optional)"}
                </span>
                <input
                  value={wordModal.draft[field]}
                  onChange={(e) =>
                    setWordModal((m) =>
                      m ? { ...m, draft: { ...m.draft, [field]: e.target.value } } : m
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </label>
            ))}
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Picture URL</span>
              <div className="mt-1 flex gap-2">
                <input
                  value={wordModal.draft.imageUri}
                  onChange={(e) =>
                    setWordModal((m) =>
                      m ? { ...m, draft: { ...m.draft, imageUri: e.target.value } } : m
                    )
                  }
                  placeholder="https://…"
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <button
                  onClick={autoPicture}
                  disabled={pictureBusy || !wordModal.draft.label.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                >
                  <ImageIcon className="w-4 h-4" /> {pictureBusy ? "Finding…" : "Find picture"}
                </button>
              </div>
            </label>
            {wordModal.draft.imageUri && (
              <div className="flex justify-center rounded-xl bg-slate-50 p-3">
                <img src={wordModal.draft.imageUri} alt="" className="h-24 object-contain" />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setWordModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={applyWord}
                disabled={!wordModal.draft.label.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-xl"
              >
                {wordModal.index === null ? "Add" : "Update"}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Write English only: Arabic and Urdu are added automatically when you press “Save
              changes”, and then it is sent to the app.
            </p>
          </div>
        )}
      </Modal>

      {/* New Category / Sub-Category Modal */}
      <Modal
        isOpen={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        title="New Category or Sub-Category"
      >
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-bold text-slate-600">Main Category (Shelf) Name</span>
            <input
              value={newMainName}
              onChange={(e) => setNewMainName(e.target.value)}
              placeholder="e.g. Food, People, Actions, or Vehicles"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-600">
              Sub-Category Name (optional — leave blank for a direct category)
            </span>
            <input
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              placeholder="e.g. Desserts, Drinks, Family"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>
          <p className="text-[11px] text-slate-500">
            Preview:{" "}
            <strong className="text-indigo-700">
              {newMainName.trim() && newSubName.trim()
                ? `${newMainName.trim()} / ${newSubName.trim()}`
                : newMainName.trim() || newSubName.trim() || "—"}
            </strong>
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setNewFolderOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={createFolder}
              disabled={!newMainName.trim() && !newSubName.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-xl"
            >
              Create
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

