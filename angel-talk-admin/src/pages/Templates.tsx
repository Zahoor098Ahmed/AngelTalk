import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FolderOpen, Plus, Search, Trash2, Pencil, Save, ImageIcon, X } from "lucide-react";
import { api } from "../api/client";
import { errorMessage } from "../api/errors";
import { SeedTemplate, SeedWord } from "../types";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";
import { ErrorNotice, EmptyState } from "../components/common/ErrorNotice";

/**
 * Board folders of the app. "Built into the app" folders come from the app itself; changes made here
 * (new words, new folders) reach every device the next time it is online.
 */

type WordDraft = { label: string; phrase: string; emoji: string; imageUri: string };
const emptyWord: WordDraft = { label: "", phrase: "", emoji: "", imageUri: "" };

const FORM_LABEL: Record<string, string> = { first: "1st", s_es: "s/es", second: "2nd", third: "3rd", fourth: "4th" };

/** Picture for a word from the app's own ARASAAC dictionary (saved in the database). */
async function findPicture(word: string): Promise<string | null> {
  const res = await api.get(`/admin/content/catalog_pictograms`, { params: { search: word.trim(), limit: 20 } });
  const items: { word: string; url: string }[] = res.data?.data?.items ?? [];
  const exact = items.find((i) => i.word.toLowerCase() === word.trim().toLowerCase());
  return (exact ?? items[0])?.url ?? null;
}

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<SeedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // editing state of the selected folder
  const [name, setName] = useState("");
  const [words, setWords] = useState<SeedWord[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const [wordModal, setWordModal] = useState<{ index: number | null; draft: WordDraft } | null>(null);
  const [pictureBusy, setPictureBusy] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const selected = templates.find((t) => t._id === selectedId) ?? null;

  const load = useCallback(async (keepId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/templates");
      const list: SeedTemplate[] = res.data?.data ?? [];
      setTemplates(list);
      const id = keepId && list.some((t) => t._id === keepId) ? keepId : list[0]?._id ?? null;
      setSelectedId(id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setName(selected?.name ?? "");
    setWords([...(selected?.words ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    setDirty(false);
  }, [selected]);

  const filtered = useMemo(
    () =>
      templates.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          (t.words ?? []).some((w) => w.label.toLowerCase().includes(search.toLowerCase())),
      ),
    [templates, search],
  );

  const choose = (id: string) => {
    if (dirty && !window.confirm("You have unsaved changes in this folder. Leave without saving?")) return;
    setSelectedId(id);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.put(`/admin/templates/${selected._id}`, {
        name: name.trim() || selected.name,
        words: words.map((w, i) => ({ ...w, order: i })),
      });
      await load(selected._id);
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    if (!window.confirm(`Remove the folder "${selected.name}"? It will no longer be sent to the app.`)) return;
    try {
      await api.delete(`/admin/templates/${selected._id}`);
      await load();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  const createFolder = async () => {
    const n = newFolderName.trim();
    if (!n) return;
    try {
      const res = await api.post("/admin/templates", { name: n, words: [], forDiagnoses: [], order: templates.length });
      setNewFolderOpen(false);
      setNewFolderName("");
      await load(res.data?.data?._id);
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  const openWord = (index: number | null) => {
    const w = index === null ? null : words[index];
    setWordModal({ index, draft: w ? { label: w.label, phrase: w.phrase, emoji: w.emoji ?? "", imageUri: w.imageUri ?? "" } : { ...emptyWord } });
  };

  const applyWord = () => {
    if (!wordModal) return;
    const d = wordModal.draft;
    if (!d.label.trim()) return;
    const before = wordModal.index !== null ? words[wordModal.index] : undefined;
    const word: SeedWord = {
      ...(before ?? {}),
      // a new English word gets new Arabic / Urdu from the server when the folder is saved
      ...(before && before.label.trim().toLowerCase() !== d.label.trim().toLowerCase() ? { translations: {} } : {}),
      label: d.label.trim(),
      phrase: d.phrase.trim() || d.label.trim(),
      emoji: d.emoji.trim() || undefined,
      imageUri: d.imageUri.trim() || undefined,
    };
    setWords((prev) => (wordModal.index === null ? [...prev, word] : prev.map((w, i) => (i === wordModal.index ? word : w))));
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Board Folders & Words</h1>
          <p className="text-sm text-slate-500 mt-1">
            The folders and word cards of the app. Words and folders you add here appear in the app on every device.
          </p>
        </div>
        <button
          onClick={() => setNewFolderOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm"
        >
          <Plus className="w-4 h-4" /> New folder
        </button>
      </div>

      {error && <ErrorNotice message={error} onRetry={() => load(selectedId ?? undefined)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Folder list */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search folders or words…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div className="text-xs text-slate-500 px-1">{filtered.length} folders</div>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {loading && templates.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">Loading folders…</div>
            ) : filtered.length === 0 ? (
              <EmptyState title="No folders" hint={templates.length ? "Nothing matches your search." : "Run “npm run seed:catalog” in the backend to load the app's folders."} />
            ) : (
              filtered.map((t) => (
                <button
                  key={t._id}
                  onClick={() => choose(t._id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    t._id === selectedId ? "bg-white border-indigo-600 ring-2 ring-indigo-600/20 shadow-md" : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{t.icon || "📁"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">{t.name}</div>
                      <div className="text-xs text-slate-500">{(t.words ?? []).length} cards</div>
                    </div>
                    {t.source === "app" ? (
                      <Badge variant={t.editedByAdmin ? "warning" : "neutral"}>{t.editedByAdmin ? "Edited" : "App"}</Badge>
                    ) : (
                      <Badge variant="success">Yours</Badge>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Selected folder */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 ring-1 ring-slate-200/80 shadow-sm">
          {!selected ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Select a folder to see its words</div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 pb-4">
                <FolderOpen className="w-5 h-5 text-indigo-600" />
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setDirty(true);
                  }}
                  className="flex-1 min-w-[200px] text-lg font-black text-slate-900 border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded-lg px-2 py-1 focus:outline-none"
                />
                <button
                  onClick={save}
                  disabled={!dirty || saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300"
                >
                  <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save changes"}
                </button>
                <button onClick={remove} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Remove folder">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  {words.length} cards{dirty && <span className="ml-2 font-bold text-amber-600">• unsaved changes</span>}
                </div>
                <button
                  onClick={() => openWord(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                >
                  <Plus className="w-3.5 h-3.5" /> Add word
                </button>
              </div>

              {words.length === 0 ? (
                <EmptyState title="This folder has no words yet" hint="Add the first word card." />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {words.map((w, i) => (
                    <div key={`${w.label}-${i}`} className="group relative rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-center">
                      {w.verbFormTag && (
                        <span className="absolute left-2 top-2 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          {FORM_LABEL[w.verbFormTag] ?? w.verbFormTag}
                        </span>
                      )}
                      <div className="h-16 flex items-center justify-center">
                        {w.imageUri ? (
                          <img src={w.imageUri} alt="" className="max-h-16 max-w-full object-contain" loading="lazy" />
                        ) : (
                          <span className="text-3xl">{w.emoji || "💬"}</span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-1.5 truncate">{w.label}</div>
                      {w.phrase && w.phrase !== w.label && <div className="text-[10px] text-slate-400 truncate">{w.phrase}</div>}
                      {(w.translations?.["ar-SA"] || w.translations?.["ur-PK"]) && (
                        <div className="text-[10px] text-slate-500 truncate" dir="rtl">
                          {[w.translations?.["ar-SA"], w.translations?.["ur-PK"]].filter(Boolean).join(" · ")}
                        </div>
                      )}
                      <div className="absolute right-1.5 top-1.5 hidden gap-1 group-hover:flex">
                        <button onClick={() => openWord(i)} className="p-1 rounded-md bg-white shadow text-slate-500 hover:text-indigo-600" title="Edit">
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
      <Modal isOpen={!!wordModal} onClose={() => setWordModal(null)} title={wordModal?.index === null ? "Add word" : "Edit word"}>
        {wordModal && (
          <div className="space-y-4">
            {(["label", "phrase", "emoji"] as const).map((field) => (
              <label key={field} className="block">
                <span className="text-xs font-bold text-slate-600">
                  {field === "label" ? "Word (shown on the card)" : field === "phrase" ? "Spoken phrase (optional)" : "Emoji (optional)"}
                </span>
                <input
                  value={wordModal.draft[field]}
                  onChange={(e) => setWordModal((m) => (m ? { ...m, draft: { ...m.draft, [field]: e.target.value } } : m))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </label>
            ))}
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Picture URL</span>
              <div className="mt-1 flex gap-2">
                <input
                  value={wordModal.draft.imageUri}
                  onChange={(e) => setWordModal((m) => (m ? { ...m, draft: { ...m.draft, imageUri: e.target.value } } : m))}
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
              <button onClick={() => setWordModal(null)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl">
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
              Write English only: Arabic and Urdu are added automatically when you press “Save changes”, and then it is sent to the app.
            </p>
          </div>
        )}
      </Modal>

      {/* New folder */}
      <Modal isOpen={newFolderOpen} onClose={() => setNewFolderOpen(false)} title="New folder">
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-bold text-slate-600">Folder name</span>
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Vehicles  or  Food / Desserts"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>
          <p className="text-[11px] text-slate-500">Use “Shelf / Folder” to put it inside an existing shelf of the app.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setNewFolderOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl">
              Cancel
            </button>
            <button
              onClick={createFolder}
              disabled={!newFolderName.trim()}
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
