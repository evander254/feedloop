import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useRealtimeSubscription } from "@/lib/realtime";
import AppLayout from "@/components/app-layout";
import {
  Loader2,
  ClipboardList,
  FileText,
  Vote,
  Building2,
  ArrowRight,
  Plus,
  Sparkles,
  Clock,
  Pencil,
  MousePointerClick,
  BarChart3,
  Share2,
  Globe,
} from "lucide-react";

type CardMeta = {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  colorDark: string;
  path: string;
  newPath: string;
  newLabel: string;
  table: string;
};

const cards: CardMeta[] = [
  {
    key: "forms",
    label: "Forms",
    description: "Build data collection forms with drag-and-drop fields, share them, and track responses instantly.",
    icon: ClipboardList,
    color: "#10b981",
    colorDark: "#34d399",
    path: "/forms",
    newPath: "/builder/new",
    newLabel: "New Form",
    table: "forms",
  },
  {
    key: "surveys",
    label: "Surveys",
    description: "Create public or private surveys, gather target feedback, and analyse results in real time.",
    icon: FileText,
    color: "#3b82f6",
    colorDark: "#60a5fa",
    path: "/surveys",
    newPath: "/surveys/new",
    newLabel: "New Survey",
    table: "surveys",
  },
  {
    key: "polls",
    label: "Polls",
    description: "Launch quick opinion polls with live interactive results, multiple options, and image support.",
    icon: Vote,
    color: "#f97316",
    colorDark: "#fb923c",
    path: "/polls",
    newPath: "/polls/new",
    newLabel: "New Poll",
    table: "polls",
  },
  {
    key: "organizations",
    label: "Organizations",
    description: "Manage your workspaces, invite team members, and configure global settings from one place.",
    icon: Building2,
    color: "#a855f7",
    colorDark: "#c084fc",
    path: "/organizations",
    newPath: "/organizations",
    newLabel: "New Org",
    table: "organizations",
  },
];

/* ── Mini‑charts ──────────────────────────────────── */

function FormsChart() {
  const data = [12, 19, 15, 27, 22, 31, 28];
  const w = 160; const h = 48;
  const max = Math.max(...data, 1);
  const x = (i: number) => (i / (data.length - 1)) * w;
  const y = (v: number) => h - (v / max) * (h - 6) - 3;
  const d = data.map((v, i) => (i === 0 ? "M" : "L") + x(i) + "," + y(v)).join(" ");
  const vb = "0 0 " + w + " " + h;
  return (
    <svg viewBox={vb} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={d + "L" + w + "," + h + "L0," + h + "Z"} fill="url(#fg)" />
      <path d={d} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill="#10b981" className="transition-all duration-300 group-hover:r-[3.5]" />
      ))}
    </svg>
  );
}

function SurveysChart() {
  const stars = 4; const total = 5;
  return (
    <div className="flex items-center justify-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="size-5 transition-all duration-300" style={{ opacity: i < stars ? 1 : 0.2 }}>
          <polygon points="10,1 12.5,7.5 19,8 14,12.5 15.5,19 10,15.5 4.5,19 6,12.5 1,8 7.5,7.5" fill={i < stars ? "#3b82f6" : "#cbd5e1"} />
        </svg>
      ))}
      <span className="ml-1 text-xs font-bold text-blue-500">4.0</span>
    </div>
  );
}

function PollsChart() {
  return (
    <div className="flex w-full flex-col gap-2 px-2">
      {[
        { label: "Option A", pct: 65, color: "#f97316" },
        { label: "Option B", pct: 35, color: "#fb923c" },
      ].map((opt) => (
        <div key={opt.label} className="flex items-center gap-2 text-[11px]">
          <span className="w-14 shrink-0 font-medium text-slate-500 dark:text-slate-400">{opt.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out group-hover:opacity-90"
              style={{ width: `${opt.pct}%`, background: opt.color }}
            />
          </div>
          <span className="w-8 text-right font-bold text-slate-700 dark:text-slate-300">{opt.pct}%</span>
        </div>
      ))}
    </div>
  );
}

function OrgsChart() {
  return (
    <svg viewBox="0 0 120 48" className="w-full" preserveAspectRatio="xMidYMid meet">
      <circle cx="60" cy="16" r="6" fill="#a855f7" opacity="0.8" />
      <circle cx="36" cy="38" r="5" fill="#a855f7" opacity="0.5" />
      <circle cx="84" cy="38" r="5" fill="#a855f7" opacity="0.5" />
      <circle cx="24" cy="10" r="3" fill="#c084fc" opacity="0.4" />
      <circle cx="96" cy="10" r="3" fill="#c084fc" opacity="0.4" />
      <line x1="60" y1="22" x2="36" y2="33" stroke="#a855f7" strokeWidth="1.5" opacity="0.3" />
      <line x1="60" y1="22" x2="84" y2="33" stroke="#a855f7" strokeWidth="1.5" opacity="0.3" />
      <line x1="36" y1="38" x2="84" y2="38" stroke="#a855f7" strokeWidth="1" opacity="0.2" strokeDasharray="3" />
    </svg>
  );
}

const chartComponents: Record<string, React.ComponentType> = {
  forms: FormsChart,
  surveys: SurveysChart,
  polls: PollsChart,
  organizations: OrgsChart,
};

/* ── Skeleton ─────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="h-[6px] skeleton-shimmer" />
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="size-11 rounded-xl skeleton-shimmer" />
          <div className="h-7 w-8 rounded skeleton-shimmer" />
        </div>
        <div className="mt-4 h-5 w-24 rounded skeleton-shimmer" />
        <div className="mt-2 space-y-1.5">
          <div className="h-3 w-full rounded skeleton-shimmer" />
          <div className="h-3 w-3/4 rounded skeleton-shimmer" />
        </div>
        <div className="mt-4 h-[72px] rounded-lg skeleton-shimmer" />
        <div className="mt-5 flex gap-2">
          <div className="h-10 flex-1 rounded-lg skeleton-shimmer" />
          <div className="h-10 flex-[1.2] rounded-lg skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

/* ── Empty state ───────────────────────────────────── */

function EmptyState({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/60 dark:bg-slate-800/40 px-3 text-center">
      <div>
        <Sparkles size={18} className="mx-auto" style={{ color }} />
        <p className="mt-1 text-[11px] font-medium leading-tight text-slate-400 dark:text-slate-500">
          No {label.toLowerCase()} yet.<br />Create your first one!
        </p>
      </div>
    </div>
  );
}

/* ── Card component with 3D tilt ──────────────────── */

function DashboardCard({
  card,
  count,
  index,
  onNavigate,
}: {
  card: CardMeta;
  count: number;
  index: number;
  onNavigate: (path: string) => void;
}) {
  const Icon = card.icon;
  const Chart = chartComponents[card.key];

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    el.style.setProperty("--rx", `${((y - cy) / cy) * -8}deg`);
    el.style.setProperty("--ry", `${((x - cx) / cx) * 8}deg`);
    el.style.setProperty("--gx", `${(x / rect.width) * 100}%`);
    el.style.setProperty("--gy", `${(y / rect.height) * 100}%`);
  }, []);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--gx", "50%");
    el.style.setProperty("--gy", "50%");
  }, []);

  return (
    <div
      className="card-enter tilt-card group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow duration-300 hover:shadow-2xl hover:shadow-slate-200/60 dark:border-slate-700/60 dark:bg-slate-900 dark:hover:shadow-black/30"
      style={{ animationDelay: `${index * 0.1}s` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="h-[6px] shrink-0" style={{ background: card.color }} />

      <div className="relative z-10 flex flex-1 flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span
            className="flex size-11 items-center justify-center rounded-xl text-lg font-bold transition-transform duration-300 group-hover:scale-110"
            style={{ background: `${card.color}1a`, color: card.color }}
          >
            <Icon size={22} />
          </span>
          <span className="text-2xl font-black text-slate-900 transition-all duration-300 group-hover:scale-110 dark:text-white">
            {count}
          </span>
        </div>

        {/* Title */}
        <h3 className="mt-4 text-lg font-bold transition-colors duration-300" style={{ color: card.color }}>
          {card.label}
        </h3>

        {/* Description */}
        <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {card.description}
        </p>

        {/* Visual preview */}
        <div className="mt-4 flex h-[72px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/40">
          {count === 0 ? (
            <EmptyState label={card.label} color={card.color} />
          ) : (
            Chart && <Chart />
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 pt-5">
          <button
            type="button"
            onClick={() => onNavigate(card.path)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:border-slate-400 group-hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Open <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate(card.newPath)}
            className="inline-flex flex-[1.2] items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
            style={{ background: card.color }}
          >
            <Plus size={14} />
            {card.newLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard page ────────────────────────────────── */

export default function Dashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [userName, setUserName] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [drafts, setDrafts] = useState<{ id: string; title: string; updated_at: string; field_count: number }[]>([]);

  const fetchDashboardData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login", { replace: true }); return; }

    const countPromises = cards.map(async (card) => {
      if (card.table === "organizations") {
        const { count } = await supabase
          .from("organizations")
          .select("*", { count: "exact", head: true });
        return { key: card.key, count: count ?? 0 };
      }
      const { count } = await supabase
        .from(card.table)
        .select("*", { count: "exact", head: true })
        .eq("created_by", user.id);
      return { key: card.key, count: count ?? 0 };
    });

    const results = await Promise.all(countPromises);
    const countMap: Record<string, number> = {};
    results.forEach((r) => { countMap[r.key] = r.count; });
    setCounts(countMap);

    await supabase.rpc("publish_scheduled_forms");

    const { data: draftForms } = await supabase
      .from("forms")
      .select("id, title, updated_at, created_at")
      .eq("created_by", user.id)
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(5);
    if (draftForms) {
      const draftCounts = await Promise.all(
        draftForms.map(async (f) => {
          const { count } = await supabase.from("form_fields").select("*", { count: "exact", head: true }).eq("form_id", f.id);
          return { id: f.id, title: f.title, updated_at: f.updated_at || f.created_at, field_count: count ?? 0 };
        })
      );
      setDrafts(draftCounts);
    }
  }, [navigate]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }

      const user = session.user;
      const name =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        user.email?.split("@")[0] ||
        "User";
      setUserName(name);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.full_name) setUserName(profile.full_name);

      await fetchDashboardData();
      setChecking(false);
    });
  }, [navigate, fetchDashboardData]);

  useRealtimeSubscription("forms", fetchDashboardData, [fetchDashboardData]);
  useRealtimeSubscription("surveys", fetchDashboardData, [fetchDashboardData]);
  useRealtimeSubscription("polls", fetchDashboardData, [fetchDashboardData]);
  useRealtimeSubscription("organizations", fetchDashboardData, [fetchDashboardData]);

  useEffect(() => {
    const el = document.querySelector(".quick-slider");
    if (!el) return;
    const onLeft = () => el.scrollBy({ left: -200, behavior: "smooth" });
    const onRight = () => el.scrollBy({ left: 200, behavior: "smooth" });
    const leftBtn = document.querySelector(".quick-scroll-left");
    const rightBtn = document.querySelector(".quick-scroll-right");
    leftBtn?.addEventListener("click", onLeft);
    rightBtn?.addEventListener("click", onRight);
    return () => {
      leftBtn?.removeEventListener("click", onLeft);
      rightBtn?.removeEventListener("click", onRight);
    };
  }, [checking]);

  return (
    <AppLayout noSidebar>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200">
            Welcome back, {userName}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            What would you like to work on today?
          </p>
        </div>

        {checking ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            {/* Quick Actions Slider */}
            <div className="relative">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">Quick Actions</h2>
                <div className="flex gap-1">
                  <button type="button" className="quick-scroll-left flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 transition dark:border-slate-700 dark:hover:bg-slate-800">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button type="button" className="quick-scroll-right flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 transition dark:border-slate-700 dark:hover:bg-slate-800">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
              </div>
              <div className="quick-slider flex gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {[
                  { icon: ClipboardList, label: "New Form", desc: "Drag-and-drop form builder", color: "#10b981", onClick: () => navigate("/builder/new") },
                  { icon: FileText, label: "New Survey", desc: "Create a targeted survey", color: "#3b82f6", onClick: () => navigate("/surveys/new") },
                  { icon: Vote, label: "New Poll", desc: "Launch a quick poll", color: "#f97316", onClick: () => navigate("/polls/new") },
                  { icon: Building2, label: "Organization", desc: "Manage your workspace", color: "#a855f7", onClick: () => navigate("/organizations") },
                  { icon: BarChart3, label: "Analytics", desc: "View insights & reports", color: "#14b8a6", onClick: () => {} },
                  { icon: Share2, label: "Share Feedback", desc: "Tell us what you think", color: "#64748b", onClick: () => {} },
                  { icon: Globe, label: "Quick Export", desc: "Export your data", color: "#0ea5e9", onClick: () => {} },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.onClick}
                      className="snap-start flex shrink-0 flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900 w-[170px]"
                    >
                      <span className="flex size-12 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-200 group-hover:scale-110" style={{ background: item.color }}>
                        <Icon size={22} />
                      </span>
                      <div className="text-center">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</div>
                        <div className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500 leading-tight">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((card, index) => (
                <DashboardCard
                  key={card.key}
                  card={card}
                  count={counts[card.key] ?? 0}
                  index={index}
                  onNavigate={navigate}
                />
              ))}
            </div>

            {drafts.length > 0 && (
              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-[var(--text-primary)]">Resume Drafts</h2>
                  <button
                    type="button"
                    onClick={() => navigate("/forms")}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition"
                  >
                    View all forms →
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                        <Pencil size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {draft.title || "Untitled Form"}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                          <span>{draft.field_count} field{draft.field_count !== 1 ? "s" : ""}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(draft.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/builder?id=${draft.id}`)}
                        className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
