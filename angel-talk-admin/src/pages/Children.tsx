import React, { useState, useEffect } from "react";
import { Baby, Shield, Search, RefreshCw, Volume2, Grid, FolderOpen, User as UserIcon } from "lucide-react";
import { api } from "../api/client";
import { Child } from "../types";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";
import { ErrorNotice } from "../components/common/ErrorNotice";
import { errorMessage } from "../api/errors";

type BoardShelf = {
  _id: string;
  name: string;
  icon?: string;
  parentId?: string | null;
  hidden?: boolean;
  words: { _id: string; label: string; phrase?: string; emoji?: string; imageUri?: string; hidden?: boolean; useCount?: number }[];
};

export const ChildrenPage: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [board, setBoard] = useState<{ child: string; shelves: BoardShelf[] } | null>(null);
  const [boardLoading, setBoardLoading] = useState(false);

  const openBoard = async (c: Child) => {
    setBoardLoading(true);
    setBoard({ child: c.name, shelves: [] });
    try {
      const res = await api.get(`/admin/children/${c._id}/board`);
      setBoard({ child: c.name, shelves: res.data?.data?.shelves ?? [] });
    } catch (err) {
      setBoard(null);
      alert(errorMessage(err));
    } finally {
      setBoardLoading(false);
    }
  };

  const fetchChildren = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/admin/children", { params: { limit: 50 } });
      setChildren(response.data?.data?.children ?? []);
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
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.owner?.fullName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.owner?.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Children</h1>
          <p className="text-sm text-slate-500 mt-1">
            Every child profile the app has sent, with its family account, board and recent use.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
          <Shield className="w-4 h-4 text-amber-600" />
          <span>Clinical Shield: Therapy notes & sensory care logs strictly hidden</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl ring-1 ring-slate-200/80 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by child or family…"
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={fetchChildren}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl"
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
          {children.length ? "No child matches your search." : "No children yet. They appear here once the app has been used online."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChildren.map((c) => (
            <div
              key={c._id}
              className="bg-white rounded-2xl p-6 ring-1 ring-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">{c.name}</h3>
                      <div className="text-xs text-slate-400 font-medium">Age: {c.age} years old</div>
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
                      {c.settings?.voiceType} ({c.settings?.language})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Grid className="w-3.5 h-3.5 text-slate-400" />
                      Grid Columns:
                    </span>
                    <span className="font-semibold text-slate-900">
                      {c.settings?.boardColumns} cols • {c.settings?.simpleMode ? "Simple" : "Full"}
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
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{c.owner ? `${c.owner.fullName} · ${c.owner.email}` : "Family account not found"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>📁 {c.boardShelves ?? 0} folders · {c.boardWords ?? 0} words</span>
                  <span>💬 {c.usage?.wordsThisWeek ?? 0} taps this week</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>⭐ {c.rewards?.stars ?? 0} stars · 🔥 {c.rewards?.consecutiveDays ?? 0} days</span>
                  <span>{c.usage?.lastActive ? `Last used ${new Date(c.usage.lastActive).toLocaleDateString()}` : "Not used yet"}</span>
                </div>
              </div>
              <button
                onClick={() => openBoard(c)}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <FolderOpen className="w-4 h-4" /> View board
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!board} onClose={() => setBoard(null)} title={board ? `${board.child}'s board` : ""} maxWidth="2xl">
        {boardLoading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading board…</div>
        ) : board && board.shelves.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">The app has not sent this board yet.</div>
        ) : (
          <div className="max-h-[65vh] overflow-y-auto space-y-4 pr-1">
            {board?.shelves
              .filter((sh) => sh.words.length > 0)
              .map((sh) => {
                const parent = board.shelves.find((p) => p._id === sh.parentId);
                return (
                  <div key={sh._id} className="rounded-xl border border-slate-200 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-700">
                      <span>{sh.icon || "📁"}</span>
                      <span>{parent ? `${parent.name} / ${sh.name}` : sh.name}</span>
                      <span className="font-normal text-slate-400">({sh.words.length})</span>
                      {sh.hidden && <Badge variant="neutral">hidden</Badge>}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
                      {sh.words.map((w) => (
                        <div key={w._id} className={`rounded-lg bg-slate-50 border border-slate-200 p-1.5 text-center ${w.hidden ? "opacity-40" : ""}`}>
                          <div className="h-10 flex items-center justify-center">
                            {w.imageUri ? <img src={w.imageUri} alt="" className="max-h-10 object-contain" loading="lazy" /> : <span className="text-xl">{w.emoji || "💬"}</span>}
                          </div>
                          <div className="text-[11px] font-bold text-slate-700 truncate">{w.label}</div>
                          {!!w.useCount && <div className="text-[10px] text-slate-400">{w.useCount} taps</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </Modal>
    </div>
  );
};

