import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
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

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: surveyRows } = await supabase
        .from("surveys")
        .select("id, title, description, status, created_at, created_by, views")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (!surveyRows) {
        setLoading(false);
        return;
      }

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
    })();
  }, [navigate]);

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
      <div className="flex min-h-dvh items-center justify-center bg-[#f4f7f5]">
        <Loader2 size={32} className="animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <svg className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  placeholder="Search surveys..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  {filtered.length} survey{filtered.length !== 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => navigate("/surveys/new")}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:from-teal-500 hover:to-emerald-500"
                >
                  <Plus size={15} />
                  New Survey
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-white py-6 shadow-md ring-1 ring-slate-200/60">
                <FileText size={48} className="text-slate-300" />
                <h2 className="mt-4 text-lg font-bold text-slate-700">No surveys yet</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {search ? "No surveys match your search." : "Create your first survey to start collecting data."}
                </p>
                {!search && (
                  <button
                    type="button"
                    onClick={() => navigate("/surveys/new")}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-teal-500 hover:to-emerald-500"
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
                    className="rounded-xl bg-white p-3 shadow-md ring-1 ring-slate-200/60 transition hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <h2 className="text-base font-bold text-slate-900 truncate">
                            {survey.title}
                          </h2>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider ${
                              survey.status === "published"
                                ? "bg-teal-500/10 text-teal-700"
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
                        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <BarChart3 size={13} />
                            {survey.field_count} field{survey.field_count !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={13} />
                            {survey.response_count} response{survey.response_count !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarDays size={13} />
                            {new Date(survey.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1 text-slate-500">
                            {survey.views} view{survey.views !== 1 ? "s" : ""}
                          </span>
                          {survey.views > 0 && (
                            <span className="flex items-center gap-1 font-semibold text-emerald-600">
                              {Math.round((survey.response_count / survey.views) * 100)}% rate
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/surveys/${survey.id}/responses`)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(survey.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          {copiedId === survey.id ? (
                            <Check size={14} className="text-teal-600" />
                          ) : (
                            <Share2 size={14} />
                          )}
                          {copiedId === survey.id ? "Copied" : "Share"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(survey.id)}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {survey.response_count > 0 && (
                      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                        <span className="text-xs font-medium text-slate-500">Latest responses:</span>
                        <button
                          type="button"
                          onClick={() => navigate(`/surveys/${survey.id}/responses`)}
                          className="text-xs font-semibold text-teal-600 underline underline-offset-2 hover:text-teal-700"
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