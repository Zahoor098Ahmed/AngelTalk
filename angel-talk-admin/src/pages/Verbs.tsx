import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, Trash2, Edit2, Globe2 } from "lucide-react";
import { api } from "../api/client";
import { keep, peek } from "../api/cache";
import { verbFromApi, verbToApi } from "../api/adapters";
import { ErrorNotice } from "../components/common/ErrorNotice";
import { errorMessage } from "../api/errors";
import { VerbGroup } from "../types";
import { Modal } from "../components/common/Modal";

/** Regular English forms of a verb, as a starting point the admin can correct. */
function suggestForms(raw: string) {
  const b = raw.trim().toLowerCase();
  if (!b) return { first: "", s_es: "", second: "", third: "", fourth: "" };
  const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
  const cvc = /[^aeiou][aeiou][^aeiouwxy]$/.test(b) && b.length <= 4;
  const s = /(s|x|z|ch|sh|o)$/.test(b) ? b + "es" : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + "ies" : b + "s";
  const past = b.endsWith("e") ? b + "d" : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + "ied" : cvc ? b + b.slice(-1) + "ed" : b + "ed";
  const ing = b.endsWith("ie") ? b.slice(0, -2) + "ying" : b.endsWith("ee") ? b + "ing" : b.endsWith("e") ? b.slice(0, -1) + "ing" : cvc ? b + b.slice(-1) + "ing" : b + "ing";
  return { first: cap(b), s_es: cap(s), second: cap(past), third: cap(past), fourth: cap(ing) };
}

export const VerbsPage: React.FC = () => {
  const [verbs, setVerbs] = useState<VerbGroup[]>(() => peek<VerbGroup[]>("verbs") ?? []);
  const [loading, setLoading] = useState(() => !peek("verbs"));
  const [params] = useSearchParams();
  const [search, setSearch] = useState(() => params.get("search") ?? "");
  useEffect(() => {
    const fromUrl = params.get("search");
    if (fromUrl !== null) setSearch(fromUrl);
  }, [params]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formBaseKey, setFormBaseKey] = useState("");
  const [formIcon, setFormIcon] = useState("");

  const [formFirstEn, setFormFirstEn] = useState("");
  const [formFirstUr, setFormFirstUr] = useState("");
  const [formFirstAr, setFormFirstAr] = useState("");

  const [formSesEn, setFormSesEn] = useState("");
  const [formSesUr, setFormSesUr] = useState("");
  const [formSesAr, setFormSesAr] = useState("");

  const [formSecondEn, setFormSecondEn] = useState("");
  const [formSecondUr, setFormSecondUr] = useState("");
  const [formSecondAr, setFormSecondAr] = useState("");

  const [formThirdEn, setFormThirdEn] = useState("");
  const [formThirdUr, setFormThirdUr] = useState("");
  const [formThirdAr, setFormThirdAr] = useState("");

  const [formFourthEn, setFormFourthEn] = useState("");
  const [formFourthUr, setFormFourthUr] = useState("");
  const [formFourthAr, setFormFourthAr] = useState("");

  const fetchVerbs = async () => {
    if (!peek("verbs")) setLoading(true);
    setLoadError(null);
    try {
      const response = await api.get("/admin/verbs");
      if (response.data?.data) {
        setVerbs(keep("verbs", (response.data.data as Parameters<typeof verbFromApi>[0][]).map(verbFromApi)));
      }
    } catch (err) {
      setLoadError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerbs();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormBaseKey("");
    setFormIcon("");
    setFormFirstEn(""); setFormFirstUr(""); setFormFirstAr("");
    setFormSesEn(""); setFormSesUr(""); setFormSesAr("");
    setFormSecondEn(""); setFormSecondUr(""); setFormSecondAr("");
    setFormThirdEn(""); setFormThirdUr(""); setFormThirdAr("");
    setFormFourthEn(""); setFormFourthUr(""); setFormFourthAr("");
    setIsModalOpen(true);
  };

  const openEditModal = (v: VerbGroup) => {
    setIsEditing(true);
    setEditingId(v._id);
    setFormBaseKey(v.baseKey);
    setFormIcon(v.icon || "");
    setFormFirstEn(v.forms.first.en); setFormFirstUr(v.forms.first.ur); setFormFirstAr(v.forms.first.ar);
    setFormSesEn(v.forms.s_es.en); setFormSesUr(v.forms.s_es.ur); setFormSesAr(v.forms.s_es.ar);
    setFormSecondEn(v.forms.second.en); setFormSecondUr(v.forms.second.ur); setFormSecondAr(v.forms.second.ar);
    setFormThirdEn(v.forms.third.en); setFormThirdUr(v.forms.third.ur); setFormThirdAr(v.forms.third.ar);
    setFormFourthEn(v.forms.fourth.en); setFormFourthUr(v.forms.fourth.ur); setFormFourthAr(v.forms.fourth.ar);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      baseKey: formBaseKey.trim().toLowerCase(),
      icon: formIcon.trim() || undefined,
      forms: {
        first: { en: formFirstEn, ur: formFirstUr, ar: formFirstAr },
        s_es: { en: formSesEn, ur: formSesUr, ar: formSesAr },
        second: { en: formSecondEn, ur: formSecondUr, ar: formSecondAr },
        third: { en: formThirdEn, ur: formThirdUr, ar: formThirdAr },
        fourth: { en: formFourthEn, ur: formFourthUr, ar: formFourthAr },
      },
    };

    try {
      if (isEditing && editingId) {
        await api.put(`/admin/verbs/${editingId}`, verbToApi(payload));
      } else {
        await api.post("/admin/verbs", verbToApi(payload));
      }
      setIsModalOpen(false);
      await fetchVerbs();
    } catch (err: unknown) {
      alert(errorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this verb conjugation group?")) return;
    try {
      await api.delete(`/admin/verbs/${id}`);
      await fetchVerbs();
    } catch (err: unknown) {
      alert(errorMessage(err));
    }
  };

  const filteredVerbs = verbs.filter((v) =>
    v.baseKey.toLowerCase().includes(search.toLowerCase()) ||
    v.forms.first.en.toLowerCase().includes(search.toLowerCase()) ||
    v.forms.first.ar.includes(search) ||
    v.forms.first.ur.includes(search)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            5-Form Verb Conjugation Library
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Every verb of the app with its 5 forms. Verbs you add or change here reach the app's Actions folders automatically.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Verb Group</span>
        </button>
      </div>

      {loadError && <ErrorNotice message={loadError} onRetry={fetchVerbs} />}

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl ring-1 ring-slate-200/80 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search across English, Arabic, or Urdu forms..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <Globe2 className="w-4 h-4 text-slate-400" />
          <span>{filteredVerbs.length} verbs loaded</span>
        </div>
      </div>

      {/* Verbs Table */}
      <div className="bg-white rounded-2xl ring-1 ring-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-5">Base Key</th>
                <th className="py-3 px-5">1st (Base)</th>
                <th className="py-3 px-5">s / es (3rd Sing.)</th>
                <th className="py-3 px-5">2nd (Past)</th>
                <th className="py-3 px-5">3rd (Participle)</th>
                <th className="py-3 px-5">4th (Continuous)</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading verb conjugation tables...
                  </td>
                </tr>
              ) : filteredVerbs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {verbs.length ? "No verbs match your search." : "No verbs yet."}
                  </td>
                </tr>
              ) : (
                filteredVerbs.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-5 font-bold text-slate-900 font-mono text-xs">
                      {v.baseKey}
                      <div className="mt-1 font-sans text-[10px] font-semibold text-slate-400">{v.isCustom ? "Added in admin" : "Built into the app"}</div>
                    </td>

                    {/* 1st form */}
                    <td className="py-3 px-5">
                      <div className="font-semibold text-slate-800">{v.forms.first.en}</div>
                      <div className="text-[11px] text-slate-500" dir="rtl">{v.forms.first.ar}</div>
                      <div className="text-[11px] text-slate-400" dir="rtl">{v.forms.first.ur}</div>
                    </td>

                    {/* s/es form */}
                    <td className="py-3 px-5">
                      <div className="font-semibold text-slate-800">{v.forms.s_es.en}</div>
                      <div className="text-[11px] text-slate-500" dir="rtl">{v.forms.s_es.ar}</div>
                      <div className="text-[11px] text-slate-400" dir="rtl">{v.forms.s_es.ur}</div>
                    </td>

                    {/* 2nd form */}
                    <td className="py-3 px-5">
                      <div className="font-semibold text-slate-800">{v.forms.second.en}</div>
                      <div className="text-[11px] text-slate-500" dir="rtl">{v.forms.second.ar}</div>
                      <div className="text-[11px] text-slate-400" dir="rtl">{v.forms.second.ur}</div>
                    </td>

                    {/* 3rd form */}
                    <td className="py-3 px-5">
                      <div className="font-semibold text-slate-800">{v.forms.third.en}</div>
                      <div className="text-[11px] text-slate-500" dir="rtl">{v.forms.third.ar}</div>
                      <div className="text-[11px] text-slate-400" dir="rtl">{v.forms.third.ur}</div>
                    </td>

                    {/* 4th form */}
                    <td className="py-3 px-5">
                      <div className="font-semibold text-slate-800">{v.forms.fourth.en}</div>
                      <div className="text-[11px] text-slate-500" dir="rtl">{v.forms.fourth.ar}</div>
                      <div className="text-[11px] text-slate-400" dir="rtl">{v.forms.fourth.ur}</div>
                    </td>

                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(v)}
                          title="Edit Verb Forms"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(v._id)}
                          title="Delete Verb"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Verb Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? `Edit verb: ${formBaseKey}` : "Add a verb"}
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2 text-indigo-800">
            Write English only. The other English forms are filled in for you (check irregular verbs like go → went), and
            Arabic and Urdu are added automatically when you save. Empty a translation to make it again.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Verb (English)</label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={formBaseKey}
                onChange={(e) => {
                  setFormBaseKey(e.target.value);
                  if (!isEditing) {
                    const f = suggestForms(e.target.value);
                    setFormFirstEn(f.first);
                    setFormSesEn(f.s_es);
                    setFormSecondEn(f.second);
                    setFormThirdEn(f.third);
                    setFormFourthEn(f.fourth);
                  }
                }}
                placeholder="e.g. jump"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Emoji (optional)</label>
              <input
                type="text"
                value={formIcon}
                onChange={(e) => setFormIcon(e.target.value)}
                placeholder="e.g. 🏃"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Form Rows (1 to 5) */}
          {[
            { label: "1. Base Form (First)", en: formFirstEn, setEn: setFormFirstEn, ur: formFirstUr, setUr: setFormFirstUr, ar: formFirstAr, setAr: setFormFirstAr },
            { label: "2. 3rd Person Singular (s/es)", en: formSesEn, setEn: setFormSesEn, ur: formSesUr, setUr: setFormSesUr, ar: formSesAr, setAr: setFormSesAr },
            { label: "3. Past Tense (Second)", en: formSecondEn, setEn: setFormSecondEn, ur: formSecondUr, setUr: setFormSecondUr, ar: formSecondAr, setAr: setFormSecondAr },
            { label: "4. Past Participle (Third)", en: formThirdEn, setEn: setFormThirdEn, ur: formThirdUr, setUr: setFormThirdUr, ar: formThirdAr, setAr: setFormThirdAr },
            { label: "5. Continuous (Fourth -ing)", en: formFourthEn, setEn: setFormFourthEn, ur: formFourthUr, setUr: setFormFourthUr, ar: formFourthAr, setAr: setFormFourthAr },
          ].map((row) => (
            <div key={row.label} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <span className="font-extrabold text-slate-800">{row.label}</span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="English"
                  value={row.en}
                  onChange={(e) => row.setEn(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <input
                  type="text"
                  dir="rtl"
                  placeholder="العربية · automatic"
                  value={row.ar}
                  onChange={(e) => row.setAr(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 bg-white font-tajawal text-right"
                />
                <input
                  type="text"
                  dir="rtl"
                  placeholder="اردو · automatic"
                  value={row.ur}
                  onChange={(e) => row.setUr(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 bg-white font-tajawal text-right"
                />
              </div>
            </div>
          ))}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/30"
            >
              {isEditing ? "Update Verb Forms" : "Create Verb Group"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
