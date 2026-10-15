import React, { useState, useEffect } from "react";
import { Baby, Shield, Search, RefreshCw, Volume2, Grid } from "lucide-react";
import { api } from "../api/client";
import { Child } from "../types";
import { Badge } from "../components/common/Badge";

export const ChildrenPage: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchChildren = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/children");
      if (response.data?.data) {
        setChildren(response.data.data);
      }
    } catch {
      // Demo preview profiles
      setChildren([
        {
          _id: "ch-1",
          ownerId: "usr-1",
          name: "Rayan",
          age: 6,
          diagnoses: ["autism", "non_verbal"],
          settings: {
            language: "ar-SA",
            voiceType: "boy",
            boardMode: "phrase",
            bilingualDisplay: true,
            simpleMode: true,
            speechRate: 0.9,
            boardColumns: 3,
            highContrast: false,
            hapticsEnabled: true,
          },
          rewards: { stars: 24, badges: ["first_word", "3_day_streak"], consecutiveDays: 4, lastActiveDate: new Date().toISOString() },
          face: { consent: true, consentAt: new Date().toISOString(), version: 1, enrolledAt: new Date().toISOString() },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: "ch-2",
          ownerId: "usr-1",
          name: "Noura",
          age: 4,
          diagnoses: ["speech_delay"],
          settings: {
            language: "ar-SA",
            voiceType: "girl",
            boardMode: "sentence",
            bilingualDisplay: false,
            simpleMode: false,
            speechRate: 1.0,
            boardColumns: 4,
            highContrast: false,
            hapticsEnabled: true,
          },
          rewards: { stars: 12, badges: ["sentence_builder"], consecutiveDays: 2, lastActiveDate: new Date().toISOString() },
          face: { consent: false, consentAt: null, version: 1, enrolledAt: null },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const filteredChildren = children.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Children AAC Profiles</h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of communication setups and developmental configuration.
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
            placeholder="Search by child name..."
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

      {/* Grid of Profiles */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredChildren.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400">
          No child profiles found.
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
                  <Badge variant={c.settings.boardMode === "phrase" ? "primary" : "purple"}>
                    {c.settings.boardMode === "phrase" ? "Phrase Tap" : "Sentence Strip"}
                  </Badge>
                </div>

                {/* Diagnoses Tags */}
                <div className="mb-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Diagnoses & Support
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.diagnoses.map((diag) => (
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
                      {c.settings.voiceType} ({c.settings.language})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Grid className="w-3.5 h-3.5 text-slate-400" />
                      Grid Columns:
                    </span>
                    <span className="font-semibold text-slate-900">
                      {c.settings.boardColumns} cols • {c.settings.simpleMode ? "Simple" : "Full"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Baby className="w-3.5 h-3.5 text-slate-400" />
                      Face AI Enrolled:
                    </span>
                    <span
                      className={`font-semibold ${
                        c.face.consent ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      {c.face.consent ? "Yes (On-Device 128d)" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reward stats */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>⭐ {c.rewards.stars} Stars Earned</span>
                <span>🔥 {c.rewards.consecutiveDays} Day Streak</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

