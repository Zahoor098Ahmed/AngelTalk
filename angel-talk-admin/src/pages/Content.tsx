import React, { useCallback, useEffect, useState } from "react";
import { Database, Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { api } from "../api/client";
import { errorMessage } from "../api/errors";
import { Modal } from "../components/common/Modal";
import { ErrorNotice, EmptyState } from "../components/common/ErrorNotice";

/** The app's built-in content as saved in the database by "npm run seed:catalog" (read-only). */

const LABELS: Record<string, { title: string; hint: string }> = {
  catalog_pictograms: { title: "Pictures", hint: "ARASAAC picture for every word the app knows" },
  catalog_translations: { title: "Translations", hint: "Arabic / Urdu words, folder names and screen texts" },
  catalog_image_library: { title: "Picture library", hint: "Pictures offered in the picture picker" },
  catalog_word_prediction: { title: "Word suggestions", hint: "Next-word and phrase suggestions on the Talk board" },
  catalog_games: { title: "Games", hint: "Rounds and items of the learning games" },
  catalog_bottom_tabs: { title: "Talk board tabs", hint: "Tabs along the bottom of the Talk board" },
  catalog_languages: { title: "Languages", hint: "Languages the app speaks" },
  catalog_starter_words: { title: "Starter words", hint: "First words per language" },
  catalog_sentence_grammar: { title: "Sentence rules", hint: "Rules used to build correct sentences" },
  catalog_verb_rules: { title: "Verb rules", hint: "Lists used to recognise verbs and their forms" },
  catalog_app_constants: { title: "App settings & lists", hint: "Default settings, colours, icons, moods…" },
};

type Item = Record<string, unknown> & { _id: string };

const mainText = (it: Item) =>
  String(it.word ?? it.name ?? it.label ?? it.title ?? it.en ?? it.key ?? it.after ?? it._id);
const subText = (it: Item) => {
  if (typeof it.text === "string") return `${it.lang ?? ""} ${it.text}`.trim();
  if (Array.isArray(it.next)) return `→ ${(it.next as string[]).join(", ")}`;
  if (Array.isArray(it.words)) return `${(it.words as unknown[]).length} entries`;
  if (Array.isArray(it.items)) return `${(it.items as unknown[]).length} items`;
  if (typeof it.category === "string") return it.category;
  if (it.module) return String(it.module);
  return "";
};
const picture = (it: Item) => (typeof it.url === "string" ? it.url : typeof it.imageUri === "string" ? it.imageUri : null);

export const ContentPage: React.FC = () => {
  const [collections, setCollections] = useState<{ name: string; count: number }[]>([]);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Item | null>(null);

  const loadCollections = useCallback(async () => {
    setError(null);
    try {
      const res = await api.get("/admin/content");
      const list = res.data?.data?.collections ?? [];
      setCollections(list);
      setSyncedAt(res.data?.data?.syncedAt ?? null);
      setActive((a) => a ?? list[0]?.name ?? null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  const loadItems = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      const res = await api.get(`/admin/content/${active}`, { params: { page, limit: 48, search: query || undefined } });
      setItems(res.data?.data?.items ?? []);
      setTotal(res.data?.data?.total ?? 0);
      setTotalPages(res.data?.data?.totalPages || 1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [active, page, query]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">App Content</h1>
        <p className="text-sm text-slate-500 mt-1">
          Everything built into the app, as saved in the database
          {syncedAt ? ` (last updated ${new Date(syncedAt).toLocaleString()})` : ""}. Board folders and verbs are edited on their own pages.
        </p>
      </div>

      {error && <ErrorNotice message={error} onRetry={() => { loadCollections(); loadItems(); }} />}

      {collections.length === 0 && !error ? (
        <EmptyState title="No app content in the database yet" hint="Run “npm run seed:catalog” in angel-talk-backend." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            {collections.map((c) => (
              <button
                key={c.name}
                onClick={() => {
                  setActive(c.name);
                  setPage(1);
                  setSearch("");
                  setQuery("");
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  active === c.name ? "bg-white border-indigo-600 ring-2 ring-indigo-600/20" : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-slate-900">{LABELS[c.name]?.title ?? c.name}</span>
                  <span className="text-xs font-mono text-slate-500">{c.count.toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{LABELS[c.name]?.hint ?? c.name}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-3 bg-white rounded-2xl p-5 ring-1 ring-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Database className="w-5 h-5 text-indigo-600" />
              <div className="font-black text-slate-900">{active ? LABELS[active]?.title ?? active : ""}</div>
              <div className="text-xs text-slate-500">{total.toLocaleString()} entries</div>
              <form
                className="relative ml-auto w-full sm:w-72"
                onSubmit={(e) => {
                  e.preventDefault();
                  setPage(1);
                  setQuery(search.trim());
                }}
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search and press Enter…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </form>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-400 text-sm">Loading…</div>
            ) : items.length === 0 ? (
              <EmptyState title="Nothing found" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {items.map((it) => {
                  const pic = picture(it);
                  return (
                    <button
                      key={it._id}
                      onClick={() => setDetail(it)}
                      className="group text-left rounded-xl border border-slate-200 bg-slate-50/60 p-3 hover:border-indigo-300"
                    >
                      {pic && (
                        <div className="h-16 mb-2 flex items-center justify-center">
                          <img src={pic} alt="" className="max-h-16 object-contain" loading="lazy" />
                        </div>
                      )}
                      <div className="text-sm font-bold text-slate-800 truncate" dir="auto">{mainText(it)}</div>
                      <div className="text-[11px] text-slate-500 truncate" dir="auto">{subText(it)}</div>
                      <Eye className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 mt-1" />
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={detail ? mainText(detail) : ""} maxWidth="lg">
        {detail && (
          <pre className="max-h-[60vh] overflow-auto p-4 bg-slate-900 text-indigo-200 rounded-xl text-xs font-mono" dir="auto">
            {JSON.stringify(detail, null, 2)}
          </pre>
        )}
      </Modal>
    </div>
  );
};
