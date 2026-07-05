import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useRealtimeSubscription } from "@/lib/realtime";
import AppLayout from "@/components/app-layout";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Loader2,
  ClipboardList,
  Eye,
  Share2,
  Trash2,
  BarChart3,
  MessageSquare,
  CalendarDays,
  Check,
  TrendingUp,
  Search,
  X,
  Copy,
  ExternalLink,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
} from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LOCATION_COLORS = ["#10b981", "#f97316", "#3b82f6", "#a855f7", "#94a3b8"];

interface FormSummary {
  id: string;
  title: string;
  description: string | null;
  status: string;
  publish_at: string | null;
  created_at: string;
  field_count: number;
  response_count: number;
  views: number;
  sparkData: number[];
}

function Sparkline({ data, color = "#10b981" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const w = 120, h = 36;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const px = (i: number) => (i / (data.length - 1)) * w;
  const py = (v: number) => h - ((v - min) / range) * (h - 6) - 3;
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  const area = data.map((v, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ") + `L${px(data.length - 1).toFixed(1)},${h}L0,${h}Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <defs>
        <linearGradient id={`spk-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spk-${color.replace("#", "")})`} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Forms() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareFormId, setShareFormId] = useState<string | null>(null);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [dailyBuckets, setDailyBuckets] = useState<{ date: string; responses: number }[]>([]);
  const [locationData, setLocationData] = useState<{ name: string; value: number }[]>([]);

  const fetchForms = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login", { replace: true }); return; }

    await supabase.rpc("publish_scheduled_forms");

    const formResult = await supabase
      .from("forms")
      .select("id, title, description, status, publish_at, created_at, created_by, views")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    const formRows = formResult.data;
    if (!formRows) { setLoading(false); return; }

    const formIds = formRows.map((f) => f.id);

    const { data: allDates } = formIds.length
      ? await supabase.from("form_responses").select("submitted_at").in("form_id", formIds)
      : { data: [] };

    const now = new Date();
    const bucket: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      bucket[d.toISOString().slice(0, 10)] = 0;
    }
    (allDates || []).forEach((r: { submitted_at: string }) => {
      const day = r.submitted_at.slice(0, 10);
      if (day in bucket) bucket[day]++;
    });
    setDailyBuckets(
      Object.entries(bucket).map(([date, count]) => ({ date: date.slice(5), responses: count }))
    );

    const { data: locations } = formIds.length
      ? await supabase.from("form_responses").select("location").in("form_id", formIds).not("location", "is", null)
      : { data: [] };

    const locMap: Record<string, number> = {};
    (locations || []).forEach((r: { location: string }) => {
      locMap[r.location] = (locMap[r.location] || 0) + 1;
    });
    const sorted = Object.entries(locMap).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((s, [, c]) => s + c, 0);
    const top = sorted.slice(0, 3);
    const others = sorted.slice(3).reduce((s, [, c]) => s + c, 0);
    setLocationData([
      ...top.map(([name, count]) => ({
        name,
        value: Math.round((count / total) * 100),
      })),
      ...(others > 0 ? [{ name: "Others", value: Math.round((others / total) * 100) }] : []),
    ]);

    const formsWithCounts = await Promise.all(
      formRows.map(async (f) => {
        const [{ count: fieldCount }, { count: responseCount }, { data: dates }] = await Promise.all([
          supabase.from("form_fields").select("*", { count: "exact", head: true }).eq("form_id", f.id),
          supabase.from("form_responses").select("*", { count: "exact", head: true }).eq("form_id", f.id),
          supabase.from("form_responses").select("submitted_at").eq("form_id", f.id).order("submitted_at"),
        ]);

        const sparkBucket: Record<string, number> = {};
        const refDate = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
          sparkBucket[`${MONTHS[d.getMonth()]} ${d.getFullYear()}`] = 0;
        }
        (dates || []).forEach((r: { submitted_at: string }) => {
          const d = new Date(r.submitted_at);
          const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
          if (key in sparkBucket) sparkBucket[key]++;
        });

        return {
          id: f.id, title: f.title, description: f.description,
          status: f.status, publish_at: f.publish_at, created_at: f.created_at,
          field_count: fieldCount ?? 0, response_count: responseCount ?? 0,
          views: f.views ?? 0,
          sparkData: Object.values(sparkBucket),
        };
      })
    );

    setForms(formsWithCounts);
    setLoading(false);
  }, [navigate]);

  useEffect(() => { fetchForms(); }, [fetchForms]);
  useRealtimeSubscription("forms", fetchForms, [fetchForms]);

  const filtered = useMemo(() => {
    let result = [...forms];
    if (search) {
      result = result.filter((f) =>
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter === "scheduled") {
      result = result.filter((f) => f.status === "draft" && f.publish_at);
    } else if (statusFilter !== "all") {
      result = result.filter((f) => f.status === statusFilter);
    }
    if (dateFilter === "week") {
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      result = result.filter((f) => new Date(f.created_at) >= weekAgo);
    } else if (dateFilter === "month") {
      const monthAgo = new Date(Date.now() - 30 * 86400000);
      result = result.filter((f) => new Date(f.created_at) >= monthAgo);
    }
    return result;
  }, [forms, search, statusFilter, dateFilter]);

  const handleDelete = async (formId: string) => {
    if (!confirm("Are you sure you want to delete this form? All responses and fields will be permanently removed.")) return;
    const { error } = await supabase.from("forms").delete().eq("id", formId);
    if (!error) setForms((prev) => prev.filter((f) => f.id !== formId));
  };

  const totalResponses = forms.reduce((s, f) => s + f.response_count, 0);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 size={28} className="animate-spin text-emerald-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex gap-5">
        {/* Main Content */}
        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search forms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10"
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">Last Month</option>
            </select>

            <span className="ml-auto text-xs text-slate-400">
              {filtered.length} form{filtered.length !== 1 ? "s" : ""}
            </span>

            <button
              type="button"
              onClick={() => navigate("/builder/new")}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-slate-800 hover:shadow-md active:scale-[0.97]"
            >
              <Plus size={15} />
              New Form
            </button>
          </div>

          {/* Form list */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
              <ClipboardList size={48} className="mx-auto text-slate-300" />
              <h2 className="mt-4 text-lg font-bold text-slate-700">No forms yet</h2>
              <p className="mt-1 text-sm text-slate-400">
                {search || statusFilter !== "all" || dateFilter !== "all"
                  ? "No forms match your filters."
                  : "Create your first form to start collecting data."}
              </p>
              {!search && statusFilter === "all" && dateFilter === "all" && (
                <button
                  type="button"
                  onClick={() => navigate("/builder/new")}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-slate-800 hover:shadow-md active:scale-[0.97]"
                >
                  <Plus size={16} />
                  Create Form
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((form, idx) => {
                const colors = ["#10b981", "#f97316", "#3b82f6", "#8b5cf6"];
                const color = colors[idx % colors.length];
                const statusLabel = form.publish_at && form.status === "draft" ? "scheduled" : form.status;
                return (
                  <motion.div
                    key={form.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                            <ClipboardList size={16} className="text-slate-500" />
                          </div>
                          <h3 className="truncate text-sm font-bold text-slate-900">{form.title}</h3>
                          <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider ${
                            statusLabel === "published"
                              ? "bg-emerald-50 text-emerald-700"
                              : statusLabel === "scheduled"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-500"
                          }`}>
                            {statusLabel}
                          </span>
                        </div>
                        {form.description && (
                          <p className="mt-1.5 ml-[42px] text-sm text-slate-500 line-clamp-1">{form.description}</p>
                        )}
                        <div className="mt-2.5 ml-[42px] flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><BarChart3 size={12} /> {form.field_count} field{form.field_count !== 1 ? "s" : ""}</span>
                          <span className="flex items-center gap-1"><MessageSquare size={12} /> {form.response_count} response{form.response_count !== 1 ? "s" : ""}</span>
                          <span className="flex items-center gap-1"><CalendarDays size={12} /> {new Date(form.created_at).toLocaleDateString()}</span>
                          <span>{form.views} view{form.views !== 1 ? "s" : ""}</span>
                          {form.views > 0 && (
                            <span className="font-semibold text-emerald-600">{Math.round((form.response_count / form.views) * 100)}% rate</span>
                          )}
                        </div>
                      </div>
                      <Sparkline data={form.sparkData} color={color} />
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/forms/${form.id}/responses`)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm"
                        >
                          <Eye size={13} />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => setShareFormId(form.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm"
                        >
                          <Share2 size={13} />
                          Share
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(form.id)}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      {form.response_count > 0 && (
                        <button
                          type="button"
                          onClick={() => navigate(`/forms/${form.id}/responses`)}
                          className="text-xs font-semibold text-emerald-600 hover:underline"
                        >
                          View all {form.response_count} response{form.response_count !== 1 ? "s" : ""}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Analytics Panel */}
        <div className="hidden w-[260px] shrink-0 flex-col gap-3 xl:flex">
          {/* Location Pie */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">Responses by Location</p>
            <div className="flex items-center gap-3">
              <div className="h-24 w-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={locationData} cx="50%" cy="50%" innerRadius={22} outerRadius={36} dataKey="value" stroke="none">
                      {locationData.map((_, i) => (
                        <Cell key={i} fill={LOCATION_COLORS[i % LOCATION_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {locationData.map((loc, i) => (
                  <div key={loc.name} className="flex items-center gap-1.5 text-xs">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: LOCATION_COLORS[i] }} />
                    <span className="text-slate-500">{loc.name}</span>
                    <span className="ml-auto font-bold text-slate-700">{loc.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Growth Area Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">Response Growth (Last 30 Days)</p>
            <div className="h-[110px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyBuckets} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#94a3b8" }} interval={4} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#94a3b8" }} />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: 10, border: "1px solid #e2e8f0",
                      backgroundColor: "#fff", fontSize: 11, color: "#334155",
                    }}
                  />
                  <Area type="monotone" dataKey="responses" stroke="#10b981" strokeWidth={2} fill="url(#growthGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-900 p-4 text-white">
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <ClipboardList size={14} />
                Total Forms
              </div>
              <p className="mt-1.5 text-2xl font-extrabold">{forms.length}</p>
            </div>
            <div className="rounded-2xl bg-emerald-600 p-4 text-white">
              <div className="flex items-center gap-1.5 text-xs text-white/70">
                <MessageSquare size={14} />
                Total Responses
              </div>
              <p className="mt-1.5 text-2xl font-extrabold">{totalResponses.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl bg-slate-800 p-4 text-white">
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <TrendingUp size={14} />
                Active Beneficiaries
              </div>
              <p className="mt-1.5 text-2xl font-extrabold">112</p>
            </div>
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <AnimatePresence>
        {shareFormId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm"
              onClick={() => setShareFormId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <h3 className="text-base font-bold text-slate-900">Share Form</h3>
                  <button
                    type="button"
                    onClick={() => setShareFormId(null)}
                    className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="px-6 py-5">
                  {(() => {
                    const url = `${window.location.origin}/form/${shareFormId}`;
                    const text = "Check out this form";
                    return (
                      <div className="space-y-5">
                        {/* Link with copy */}
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Form link</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={url}
                              readOnly
                              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                await navigator.clipboard.writeText(url);
                                setShareLinkCopied(true);
                                setTimeout(() => setShareLinkCopied(false), 2000);
                              }}
                              className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.97]"
                            >
                              {shareLinkCopied ? "Copied!" : "Copy"}
                            </button>
                          </div>
                        </div>

                        <div className="h-px bg-slate-100" />

                        {/* Social share */}
                        <div>
                          <label className="mb-2 block text-xs font-semibold text-slate-500">Share via</label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { name: "Twitter", color: "#1da1f2", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
                              { name: "Facebook", color: "#1877f2", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
                              { name: "LinkedIn", color: "#0a66c2", url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
                              { name: "WhatsApp", color: "#25d366", url: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}` },
                              { name: "Email", color: "#64748b", url: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}` },
                            ].map((s) => (
                              <button
                                key={s.name}
                                type="button"
                                onClick={() => window.open(s.url, "_blank", "noopener")}
                                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all hover:shadow-sm"
                                style={{ color: s.color, borderColor: s.color + "40" }}
                              >
                                <ExternalLink size={12} />
                                {s.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="border-t border-slate-100 px-6 py-3">
                  <button
                    type="button"
                    onClick={() => setShareFormId(null)}
                    className="w-full rounded-lg py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
