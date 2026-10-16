import React, { useCallback, useEffect, useState } from "react";
import {
  Users,
  Baby,
  Volume2,
  Activity,
  FolderOpen,
  Layers,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { api } from "../api/client";
import { DashboardStats } from "../types";
import { ErrorNotice, EmptyState } from "../components/common/ErrorNotice";
import { errorMessage } from "../api/errors";

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/admin/stats");
      setStats(response.data?.data ?? null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="max-w-7xl mx-auto">
        <ErrorNotice message={error} onRetry={load} />
      </div>
    );
  }

  const roles = stats?.usersByRole ?? {};
  const kpis = [
    {
      title: "Registered Users",
      value: stats?.usersCount ?? 0,
      sub: "Parents, SLPs & Educators",
      icon: Users,
      color: "from-blue-500 to-indigo-600",
      change: `${roles.parent ?? 0} parents · ${roles.slp ?? 0} SLPs · ${roles.educator ?? 0} educators`,
    },
    {
      title: "Active Children Profiles",
      value: stats?.childrenCount ?? 0,
      sub: "Autism & Speech Support",
      icon: Baby,
      color: "from-purple-500 to-pink-600",
      change: `${stats?.activeTodayCount ?? 0} used the app today`,
    },
    {
      title: "AAC Words Spoken Today",
      value: stats?.wordsSpokenToday ?? 0,
      sub: "Zero-latency vocalizations",
      icon: Volume2,
      color: "from-emerald-500 to-teal-600",
      change: "Sent by the app when online",
    },
    {
      title: "Meltdowns Logged (7d)",
      value: stats?.meltdownsThisWeek ?? 0,
      sub: "Sensory & Emotional Care",
      icon: Activity,
      color: "from-amber-500 to-rose-600",
      change: "Frustrated / overwhelmed entries",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Live numbers from the Angel Talk app: families, children, and how the board is used.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>PDPL Compliant • Anonymized Clinical Data</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="bg-white rounded-2xl p-6 ring-1 ring-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {kpi.title}
                </span>
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${kpi.color} flex items-center justify-center text-white shadow-md`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {kpi.value.toLocaleString()}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                <span>{kpi.sub}</span>
                <span className="text-slate-600 font-semibold text-right">{kpi.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* App content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { title: "Board folders", value: stats?.totalTemplates ?? 0, sub: "Templates (app folders + your own)", icon: FolderOpen },
          { title: "Verbs", value: stats?.totalVerbs ?? 0, sub: "Each with all 5 forms", icon: Layers },
          { title: "Words on children's boards", value: stats?.totalWords ?? 0, sub: "As last sent by the app", icon: MessageSquare },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className="bg-white rounded-2xl p-5 ring-1 ring-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{c.title}</div>
                <div className="text-2xl font-extrabold text-slate-900">{c.value.toLocaleString()}</div>
                <div className="text-xs text-slate-500">{c.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-2xl p-6 ring-1 ring-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Families over the last 30 days</h3>
              <p className="text-xs text-slate-500">Accounts registered (running total)</p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.userGrowth || []}>
                <defs>
                  <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#userGrowthGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Meltdown Weekly Frequency */}
        <div className="bg-white rounded-2xl p-6 ring-1 ring-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Hard moments (care journal)</h3>
              <p className="text-xs text-slate-500">Frustrated or overwhelmed entries, last 7 days</p>
            </div>
            <Activity className="w-5 h-5 text-rose-500" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.meltdownTrends || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top AAC Vocabulary Utterances */}
      <div className="bg-white rounded-2xl p-6 ring-1 ring-slate-200/80 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900">
            Most Frequently Spoken AAC Words
          </h3>
          <p className="text-xs text-slate-500">
            Taps added up across all children (no names shown)
          </p>
        </div>
        {!stats?.topWords?.length && (
          <EmptyState title="No words spoken yet" hint="Words appear here once children use the app while it is online." />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {stats?.topWords?.map((item, idx) => (
            <div
              key={item.word}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center"
            >
              <div className="text-xs font-bold text-indigo-600 mb-1">#{idx + 1} Spoken</div>
              <div className="font-extrabold text-slate-800 text-sm">{item.word}</div>
              <div className="text-xs text-slate-400 mt-1">{item.count.toLocaleString()} taps</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

