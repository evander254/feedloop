"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/app-layout";
import {
  FolderKanban,
  ClipboardList,
  ChevronDown,
  Vote,
  BarChart3,
  Check,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const w = 80;
  const h = 28;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const px = (i: number) => (i / (data.length - 1)) * w;
  const py = (v: number) => h - ((v - min) / range) * (h - 4) - 2;
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"}${px(i)},${py(v)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GlowChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.04] px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className="flex size-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}20`, color, boxShadow: `0 0 16px ${color}30` }}
        >
          <div className="size-3.5 rounded-sm" style={{ backgroundColor: color }} />
        </span>
        <span className="text-sm font-medium text-slate-300">{label}</span>
      </div>
      <span className="text-lg font-bold text-white">{value}</span>
    </div>
  );
}

const TIME_RANGES = [
  { value: "1y", label: "1 Year" },
  { value: "6m", label: "6 Months" },
  { value: "3m", label: "3 Months" },
  { value: "1m", label: "1 Month" },
  { value: "2w", label: "2 Weeks" },
  { value: "1w", label: "1 Week" },
] as const;

export function FeedLoopDashboard() {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("6m");
  const [showDropdown, setShowDropdown] = useState(false);
  const [data, setData] = useState({
    totalResponses: 0,
    totalResponsesTrend: 0,
    activeProjects: 0,
    activeProjectsDelta: 0,
    totalBeneficiaries: 0,
    totalBeneficiariesTrend: 0,
    pollParticipation: 0,
    pollParticipationTrend: 0,
    monthlyResponses: [] as { month: string; responses: number }[],
    dailyResponses: [] as { day: string; responses: number }[],
    projectTypes: [] as { type: string; count: number }[],
    totalForms: 0,
    totalPolls: 0,
    loading: true,
    lastUpdated: null as string | null,
  });

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      const { data: userForms } = await supabase
        .from("forms")
        .select("id")
        .eq("created_by", user.id);
      const formIds = (userForms || []).map((f) => f.id);

      const [
        { count: totalResponses },
        { count: monthResponses },
        { count: lastMonthResponses },
        { count: activeProjects },
        { count: monthProjects },
        { count: lastMonthProjects },
        { data: responseDates },
        { data: projectTypeRows },
        { count: totalForms },
        { count: totalPolls },
      ] = await Promise.all([
        formIds.length
          ? supabase.from("form_responses").select("*", { count: "exact", head: true }).in("form_id", formIds)
          : { count: 0 },
        formIds.length
          ? supabase.from("form_responses").select("*", { count: "exact", head: true }).in("form_id", formIds).gte("submitted_at", thisMonthStart)
          : { count: 0 },
        formIds.length
          ? supabase.from("form_responses").select("*", { count: "exact", head: true }).in("form_id", formIds).gte("submitted_at", lastMonthStart).lt("submitted_at", thisMonthStart)
          : { count: 0 },
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("created_by", user.id).eq("status", "active"),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("created_by", user.id).eq("status", "active").gte("created_at", thisMonthStart),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("created_by", user.id).eq("status", "active").gte("created_at", lastMonthStart).lt("created_at", thisMonthStart),
        formIds.length
          ? supabase.from("form_responses").select("submitted_at").in("form_id", formIds)
          : { data: [] },
        supabase.from("projects").select("project_type").eq("created_by", user.id),
        supabase.from("forms").select("*", { count: "exact", head: true }).eq("created_by", user.id),
        supabase.from("polls").select("*", { count: "exact", head: true }).eq("created_by", user.id),
      ]);

      const monthlyBuckets: Record<string, number> = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthlyBuckets[`${MONTHS[d.getMonth()]} ${d.getFullYear()}`] = 0;
      }

      const dailyBuckets: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        dailyBuckets[`${MONTHS[d.getMonth()]} ${d.getDate()}`] = 0;
      }

      responseDates?.forEach((r: { submitted_at: string }) => {
        const d = new Date(r.submitted_at);
        const monthKey = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
        if (monthKey in monthlyBuckets) monthlyBuckets[monthKey]++;

        const dayKey = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
        if (dayKey in dailyBuckets) dailyBuckets[dayKey]++;
      });

      const typeMap: Record<string, number> = {};
      projectTypeRows?.forEach((p: { project_type: string | null }) => {
        const t = p.project_type || "Other";
        typeMap[t] = (typeMap[t] || 0) + 1;
      });

      const participation = totalForms > 0 ? Math.round((totalResponses ?? 0) / totalForms * 100) : 0;

      setData({
        totalResponses: totalResponses ?? 0,
        totalResponsesTrend: calcTrend(monthResponses ?? 0, lastMonthResponses ?? 0),
        activeProjects: activeProjects ?? 0,
        activeProjectsDelta: (monthProjects ?? 0) - (lastMonthProjects ?? 0),
        totalBeneficiaries: 0,
        totalBeneficiariesTrend: 0,
        pollParticipation: participation,
        pollParticipationTrend: 0,
        monthlyResponses: Object.entries(monthlyBuckets).map(([month, responses]) => ({ month, responses })),
        dailyResponses: Object.entries(dailyBuckets).map(([day, responses]) => ({ day, responses })),
        projectTypes: Object.entries(typeMap).map(([type, count]) => ({ type, count })),
        totalForms: totalForms ?? 0,
        totalPolls: totalPolls ?? 0,
        loading: false,
        lastUpdated: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setData((prev) => ({ ...prev, loading: false }));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isDaily = timeRange === "1m" || timeRange === "2w" || timeRange === "1w";

  const rawMonthlyData = data.monthlyResponses.length > 0
    ? data.monthlyResponses.map((r) => ({
        month: r.month.split(" ")[0],
        responses: r.responses,
        fullLabel: r.month,
      }))
    : MONTHS.slice(0, 12).map((m, i) => ({
        month: m,
        responses: [20, 45, 30, 80, 55, 90, 70, 95, 60, 85, 50, 75][i],
        fullLabel: m,
      }));

  const rawDailyData = data.dailyResponses.length > 0
    ? data.dailyResponses.map((r) => ({ month: r.day, responses: r.responses }))
    : [];

  const dailyRange: Record<string, number> = { "1m": 30, "2w": 14, "1w": 7 };
  const monthlyRange: Record<string, number> = { "1y": 12, "6m": 6, "3m": 3 };

  const chartData = isDaily
    ? rawDailyData.slice(-(dailyRange[timeRange] ?? 30))
    : rawMonthlyData.slice(-(monthlyRange[timeRange] ?? 6));

  const responseValues = chartData.map((d) => d.responses);
  const sparkValues = responseValues.length >= 2 ? responseValues : [0, 1];

  const kpiCards = [
    {
      label: "Total Responses",
      value: formatCount(data.totalResponses),
      trend: data.totalResponsesTrend,
      sparkline: sparkValues,
      accent: "#14b8a6",
      gradient: "from-teal-500/10 to-transparent",
      borderGlow: "shadow-teal-500/10",
    },
    {
      label: "Active Projects",
      value: formatCount(data.activeProjects),
      trend: data.activeProjectsDelta,
      sparkline: sparkValues,
      accent: "#22c55e",
      gradient: "from-green-500/10 to-transparent",
      borderGlow: "shadow-green-500/10",
    },
    {
      label: "Overall Response Rate",
      value: `${data.pollParticipation}%`,
      trend: data.pollParticipationTrend,
      sparkline: sparkValues,
      accent: "#f97316",
      gradient: "from-orange-500/10 to-transparent",
      borderGlow: "shadow-orange-500/10",
    },
    {
      label: "New Beneficiaries",
      value: formatCount(data.totalBeneficiaries),
      trend: data.totalBeneficiariesTrend,
      sparkline: sparkValues,
      accent: "#a855f7",
      gradient: "from-purple-500/10 to-transparent",
      borderGlow: "shadow-purple-500/10",
    },
  ];

  const quickStats = [
    { label: "Total Forms", value: formatCount(data.totalForms), color: "#22c55e", icon: ClipboardList, path: "/forms" },
    { label: "Total Projects", value: formatCount(data.projectTypes.reduce((a, b) => a + b.count, 0)), color: "#3b82f6", icon: FolderKanban },
    { label: "Total Polls", value: formatCount(data.totalPolls), color: "#f97316", icon: Vote },
    { label: "Project Types", value: String(data.projectTypes.length), color: "#a855f7", icon: BarChart3 },
  ];

  if (data.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7faf7]">
        <div className="size-10 animate-spin rounded-full border-[3px] border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {kpiCards.map((kpi) => (
                <div
                  key={kpi.label}
                  className={`group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-4 shadow-xl shadow-black/15 ${kpi.borderGlow}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[0.7rem] font-medium tracking-wide text-slate-400">{kpi.label}</div>
                      <div className="mt-0.5 text-xl font-black tracking-tight text-white">{kpi.value}</div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold ${
                        kpi.trend >= 0
                          ? "bg-teal-500/15 text-teal-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {kpi.trend >= 0 ? "+" : ""}{kpi.trend}%
                    </span>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <span className="text-[0.6rem] text-slate-500">this month</span>
                    <Sparkline data={kpi.sparkline} color={kpi.accent} />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="rounded-xl bg-white p-4 shadow-md shadow-black/[0.02] ring-1 ring-slate-200/60 lg:col-span-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Response Trend</h2>
                    <p className="mt-0.5 text-[0.7rem] text-slate-400">
                      {isDaily
                        ? `Daily submissions over the last ${TIME_RANGES.find((r) => r.value === timeRange)?.label.toLowerCase()}`
                        : `Monthly submissions over the last ${TIME_RANGES.find((r) => r.value === timeRange)?.label.toLowerCase()}`}
                    </p>
                  </div>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowDropdown((v) => !v)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[0.65rem] font-medium text-slate-600 transition hover:bg-slate-100"
                    >
                      {TIME_RANGES.find((r) => r.value === timeRange)?.label || "6 Months"}
                      <ChevronDown size={11} className={`transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                    </button>
                    {showDropdown && (
                      <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg shadow-black/5">
                        {TIME_RANGES.map((r) => (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => { setTimeRange(r.value); setShowDropdown(false); }}
                            className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium transition hover:bg-slate-50 ${
                              timeRange === r.value ? "text-teal-700" : "text-slate-600"
                            }`}
                          >
                            {r.label}
                            {timeRange === r.value && <Check size={12} className="shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 chart-enter" style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <defs>
                        {[
                          { id: "teal", color: "#14b8a6" },
                          { id: "green", color: "#22c55e" },
                          { id: "orange", color: "#f97316" },
                          { id: "purple", color: "#a855f7" },
                        ].map(({ id, color }) => (
                          <linearGradient key={id} id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        interval={isDaily ? Math.max(Math.floor(chartData.length / 7) - 1, 0) : 0}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        domain={[0, "auto"]}
                        tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                          fontSize: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="responses"
                        stroke="#14b8a6"
                        strokeWidth={2}
                        fill="url(#gradient-teal)"
                        dot={false}
                        activeDot={{ r: 3, fill: "#14b8a6", stroke: "#fff", strokeWidth: 2 }}
                        animationBegin={0}
                        animationDuration={900}
                        animationEasing="ease-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => navigate("/builder")}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-teal-600/20 transition hover:from-teal-500 hover:to-emerald-500"
                  >
                    <ClipboardList size={14} />
                    Create a Form
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-md shadow-black/[0.02] ring-1 ring-slate-200/60">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Quick Stats</h2>
                  <p className="mt-0.5 text-[0.7rem] text-slate-400">Platform at a glance</p>
                </div>
                <div className="mt-3 space-y-1">
                  {quickStats.map((stat) => {
                    const Icon = stat.icon;
                    const content = (
                      <div className="flex items-center justify-between rounded-lg px-2.5 py-2 transition hover:bg-slate-50">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex size-9 items-center justify-center rounded-lg transition-all"
                            style={{
                              backgroundColor: `${stat.color}12`,
                              color: stat.color,
                              boxShadow: `0 0 16px ${stat.color}12`,
                            }}
                          >
                            <Icon size={16} />
                          </span>
                          <span className="text-xs font-medium text-slate-700">{stat.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkline data={sparkValues} color={stat.color} />
                          <span className="text-base font-bold text-slate-900">{stat.value}</span>
                        </div>
                      </div>
                    );
                    if (stat.path) {
                      return (
                        <button key={stat.label} type="button" onClick={() => navigate(stat.path!)} className="w-full text-left">
                          {content}
                        </button>
                      );
                    }
                    return <div key={stat.label}>{content}</div>;
                  })}
                </div>
              </div>
            </div>
          </div>
    </AppLayout>
  );
}
