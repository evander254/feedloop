import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useRealtimeSubscription } from "@/lib/realtime";
import AppLayout from "@/components/app-layout";
import {
  Plus,
  Loader2,
  FileText,
  Eye,
  Share2,
  BarChart3,
  Users,
  CalendarDays,
  Check,
  Trash2,
  Search,
} from "lucide-react";

interface SurveySummary {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  field_count: number;
  response_count: number;
  views: number;
}

export default function Surveys() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<SurveySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchSurveys = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login", { replace: true }); return; }

    const { data: surveyRows } = await supabase
      .from("surveys")
      .select("id, title, description, status, created_at, created_by, views")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (!surveyRows) { setLoading(false); return; }

    const surveysWithCounts = await Promise.all(
      surveyRows.map(async (s) => {
        const { count: fieldCount } = await supabase
          .from("survey_fields")
          .select("*", { count: "exact", head: true })
          .eq("survey_id", s.id);

        const { count: responseCount } = await supabase
          .from("survey_responses")
          .select("*", { count: "exact", head: true })
          .eq("survey_id", s.id);

        return {
          id: s.id,
          title: s.title,
          description: s.description,
          status: s.status,
          created_at: s.created_at,
          field_count: fieldCount ?? 0,
          response_count: responseCount ?? 0,
          views: s.views ?? 0,
        };
      })
    );

    setSurveys(surveysWithCounts);
    setLoading(false);
  }, [navigate]);

  useEffect(() => { fetchSurveys(); }, [fetchSurveys]);

  useRealtimeSubscription("surveys", fetchSurveys, [fetchSurveys]);

  const handleCopyLink = async (surveyId: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/survey/${surveyId}`);
    setCopiedId(surveyId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (surveyId: string) => {
    if (!confirm("Are you sure you want to delete this survey? All responses will be permanently removed.")) return;
    const { error } = await supabase.from("surveys").delete().eq("id", surveyId);
    if (!error) setSurveys((prev) => prev.filter((s) => s.id !== surveyId));
  };

  const filtered = surveys.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search surveys..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  {filtered.length} survey{filtered.length !== 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => navigate("/surveys/new")}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-slate-800 hover:shadow-md active:scale-[0.97]"
                >
                  <Plus size={15} />
                  New Survey
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
                <FileText size={48} className="text-slate-300" />
                <h2 className="mt-4 text-lg font-bold text-slate-700">No surveys yet</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {search ? "No surveys match your search." : "Create your first survey to start collecting data."}
                </p>
                {!search && (
                  <button
                    type="button"
                    onClick={() => navigate("/surveys/new")}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-slate-800 hover:shadow-md active:scale-[0.97]"
                  >
                    <Plus size={16} />
                    Create Survey
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((survey) => (
                  <div
                    key={survey.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <h2 className="truncate text-base font-bold text-slate-900">
                            {survey.title}
                          </h2>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider ${
                              survey.status === "published"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {survey.status}
                          </span>
                        </div>
                        {survey.description && (
                          <p className="mt-1 text-sm text-slate-500 line-clamp-1">
                            {survey.description}
                          </p>
                        )}
                        <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <BarChart3 size={12} />
                            {survey.field_count} field{survey.field_count !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            {survey.response_count} response{survey.response_count !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarDays size={12} />
                            {new Date(survey.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-slate-500">
                            {survey.views} view{survey.views !== 1 ? "s" : ""}
                          </span>
                          {survey.views > 0 && (
                            <span className="font-semibold text-emerald-600">
                              {Math.round((survey.response_count / survey.views) * 100)}% rate
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/surveys/${survey.id}/responses`)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-sm"
                        >
                          <Eye size={13} />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(survey.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-sm"
                        >
                          {copiedId === survey.id ? (
                            <Check size={13} className="text-emerald-600" />
                          ) : (
                            <Share2 size={13} />
                          )}
                          {copiedId === survey.id ? "Copied" : "Share"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(survey.id)}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition-all hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {survey.response_count > 0 && (
                      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                        <span className="text-xs font-medium text-slate-500">Latest responses:</span>
                        <button
                          type="button"
                          onClick={() => navigate(`/surveys/${survey.id}/responses`)}
                          className="text-xs font-semibold text-emerald-600 underline underline-offset-2 hover:text-emerald-700"
                        >
                          View all {survey.response_count} response{survey.response_count !== 1 ? "s" : ""}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
    </AppLayout>
  );
}