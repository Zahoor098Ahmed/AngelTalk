import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, Baby, FolderOpen, BookOpen, Image as ImageIcon, Languages, Loader2 } from "lucide-react";
import { api } from "../../api/client";

/** One search box for the whole admin panel; the server answers from memory in milliseconds. */

type Group<T> = { total: number; items: T[] };
type Results = {
  query: string;
  users: Group<{ _id: string; email: string; fullName: string; role: string }>;
  children: Group<{ _id: string; name: string; age?: number; ownerEmail?: string }>;
  folders: Group<{ _id: string; name: string; icon?: string; matchingWords: { label: string; imageUri?: string; emoji?: string; translations?: Record<string, string> }[] }>;
  verbs: Group<{ _id: string; base: string; emoji?: string; forms?: Record<string, { text?: string }> }>;
  pictures: Group<{ _id: string; word: string; url: string }>;
  translations: Group<{ _id: string; en?: string; key?: string; text: string; lang: string; type: string }>;
  tookMs: number;
};

export const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  useEffect(() => {
    const query = q.trim();
    if (!query) {
      setResults(null);
      return;
    }
    const mine = ++seq.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/admin/search", { params: { q: query } });
        if (mine === seq.current) setResults(res.data?.data ?? null);
      } catch {
        if (mine === seq.current) setResults(null);
      } finally {
        if (mine === seq.current) setLoading(false);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };
  const enc = encodeURIComponent;
  const r = results;
  const empty =
    r && !r.users.total && !r.children.total && !r.folders.total && !r.verbs.total && !r.pictures.total && !r.translations.total;

  const Section: React.FC<{ icon: React.ElementType; title: string; total: number; children: React.ReactNode }> = ({ icon: Icon, title, total, children }) =>
    total ? (
      <div className="py-2">
        <div className="flex items-center gap-2 px-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <Icon className="h-3.5 w-3.5" /> {title} <span className="font-mono normal-case">{total}</span>
        </div>
        {children}
      </div>
    ) : null;
  const Row: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-1.5 text-left text-sm hover:bg-indigo-50">
      {children}
    </button>
  );

  return (
    <div ref={boxRef} className="relative w-full max-w-xl">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder="Search families, children, words, verbs, pictures…"
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-9 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      />
      {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}

      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
          {!r ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400">{loading ? "Searching…" : "No results"}</div>
          ) : empty ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400">Nothing found for “{r.query}”</div>
          ) : (
            <>
              <Section icon={Users} title="Families" total={r.users.total}>
                {r.users.items.map((u) => (
                  <Row key={u._id} onClick={() => go(`/users?search=${enc(u.email)}`)}>
                    <span className="font-semibold text-slate-800">{u.fullName}</span>
                    <span className="truncate text-xs text-slate-500">{u.email}</span>
                  </Row>
                ))}
              </Section>
              <Section icon={Baby} title="Children" total={r.children.total}>
                {r.children.items.map((c) => (
                  <Row key={c._id} onClick={() => go(`/children?search=${enc(c.name)}`)}>
                    <span className="font-semibold text-slate-800">{c.name}</span>
                    <span className="truncate text-xs text-slate-500">{c.ownerEmail}</span>
                  </Row>
                ))}
              </Section>
              <Section icon={FolderOpen} title="Folders & words" total={r.folders.total}>
                {r.folders.items.map((f) => (
                  <Row key={f._id} onClick={() => go(`/templates?open=${enc(f._id)}`)}>
                    <span>{f.icon || "📁"}</span>
                    <span className="font-semibold text-slate-800">{f.name}</span>
                    <span className="truncate text-xs text-slate-500">{f.matchingWords.map((w) => w.label).join(", ")}</span>
                  </Row>
                ))}
              </Section>
              <Section icon={BookOpen} title="Verbs" total={r.verbs.total}>
                {r.verbs.items.map((v) => (
                  <Row key={v._id} onClick={() => go(`/verbs?search=${enc(v.base)}`)}>
                    <span>{v.emoji || "⚡"}</span>
                    <span className="font-semibold text-slate-800">{v.base}</span>
                    <span className="truncate text-xs text-slate-500">
                      {Object.values(v.forms ?? {}).map((f) => f.text).filter(Boolean).join(" · ")}
                    </span>
                  </Row>
                ))}
              </Section>
              <Section icon={ImageIcon} title="Pictures" total={r.pictures.total}>
                <div className="grid grid-cols-6 gap-2 px-4 py-1">
                  {r.pictures.items.map((p) => (
                    <button key={p._id} onClick={() => go(`/content?c=catalog_pictograms&search=${enc(p.word)}`)} className="rounded-lg border border-slate-200 p-1 hover:border-indigo-300" title={p.word}>
                      <img src={p.url} alt={p.word} className="mx-auto h-10 object-contain" loading="lazy" />
                      <div className="truncate text-[10px] text-slate-600">{p.word}</div>
                    </button>
                  ))}
                </div>
              </Section>
              <Section icon={Languages} title="Translations" total={r.translations.total}>
                {r.translations.items.map((t) => (
                  <Row key={t._id} onClick={() => go(`/content?c=catalog_translations&search=${enc(t.en ?? t.key ?? "")}`)}>
                    <span className="font-semibold text-slate-800">{t.en ?? t.key}</span>
                    <span className="text-xs text-slate-500" dir="auto">{t.text}</span>
                    <span className="ml-auto text-[10px] text-slate-400">{t.lang}</span>
                  </Row>
                ))}
              </Section>
              <div className="border-t border-slate-100 px-4 py-1.5 text-right text-[10px] text-slate-400">found in {r.tookMs} ms</div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
