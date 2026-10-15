import React, { useState, useEffect } from "react";
import { Plus, Search, Folder, Trash2 } from "lucide-react";
import { api } from "../api/client";
import { SeedTemplate } from "../types";
import { Badge } from "../components/common/Badge";

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<SeedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<SeedTemplate | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/templates");
      if (response.data?.data) {
        setTemplates(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedTemplate(response.data.data[0]);
        }
      }
    } catch {
      // Demo templates fallback
      const demo: SeedTemplate[] = [
        {
          _id: "tpl-1",
          name: "Starter 36 Core AAC",
          description: "Essential core words for early functional communication and requesting.",
          targetDiagnosis: "general",
          shelves: [
            {
              name: "Needs & Wants",
              color: "#4CAF50",
              words: [
                { label: "Water", phrase: "I want water", emoji: "💧" },
                { label: "Food", phrase: "I want to eat", emoji: "🍎" },
                { label: "Help", phrase: "Please help me", emoji: "🙋" },
                { label: "More", phrase: "I want more", emoji: "➕" },
              ],
            },
            {
              name: "Feelings",
              color: "#FF9800",
              words: [
                { label: "Happy", phrase: "I feel happy", emoji: "😊" },
                { label: "Tired", phrase: "I am tired", emoji: "😴" },
                { label: "Pain", phrase: "Something hurts", emoji: "🤕" },
              ],
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: "tpl-2",
          name: "Saudi Cultural Daily Life",
          description: "Culturally adapted vocabulary for Saudi homes, mosques, family gatherings, and customs.",
          targetDiagnosis: "autism",
          shelves: [
            {
              name: "Family & Hospitality",
              color: "#3F51B5",
              words: [
                { label: "Gahwa", phrase: "I want Saudi coffee", emoji: "☕" },
                { label: "Dates", phrase: "I want dates", emoji: "🌴" },
                { label: "Salam", phrase: "Peace be upon you", emoji: "🤝" },
              ],
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      setTemplates(demo);
      setSelectedTemplate(demo[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this seed template?")) return;
    try {
      await api.delete(`/admin/templates/${id}`);
      await fetchTemplates();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete template");
    }
  };

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">AAC Starter Templates</h1>
          <p className="text-sm text-slate-500 mt-1">
            Standardized vocabulary packages applied during child onboarding.
          </p>
        </div>
        <button
          onClick={() => alert("Starter templates are seeded automatically from backend/scripts/seed.ts")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl ring-1 ring-slate-200/80 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Two-column layout: List on left, details preview on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-400">Loading...</div>
          ) : (
            filteredTemplates.map((t) => {
              const isSelected = selectedTemplate?._id === t._id;
              return (
                <div
                  key={t._id}
                  onClick={() => setSelectedTemplate(t)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-indigo-600 ring-2 ring-indigo-600/20 shadow-md"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{t.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0 mt-1"></span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <Badge variant="neutral">{t.shelves.length} Shelves</Badge>
                    <span className="text-slate-400 text-[11px] capitalize">{t.targetDiagnosis || "General"}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Template Details */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 ring-1 ring-slate-200/80 shadow-sm">
          {selectedTemplate ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{selectedTemplate.name}</h2>
                  <p className="text-xs text-slate-500 mt-1">{selectedTemplate.description}</p>
                </div>
                <button
                  onClick={() => handleDelete(selectedTemplate._id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Template"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Shelves & Cards Preview */}
              <div className="space-y-6">
                {selectedTemplate.shelves.map((shelf) => (
                  <div key={shelf.name} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Folder className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                        {shelf.name} ({shelf.words.length} cards)
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {shelf.words.map((w) => (
                        <div
                          key={w.label}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-center"
                        >
                          <div className="text-lg">{w.emoji || "💬"}</div>
                          <div className="text-xs font-bold text-slate-800 mt-1">{w.label}</div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">{w.phrase}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              Select a template to view vocabulary breakdown
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
