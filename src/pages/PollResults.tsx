import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useRealtimeSubscription } from "@/lib/realtime";
import AppLayout from "@/components/app-layout";
import {
  Loader2,
  BarChart3,
  Users,
  ArrowLeft,
  PieChart as PieIcon,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";

interface OptionResult {
  id: string;
  option_text: string;
  image_url: string | null;
  votes: number;
}

const PIE_COLORS = ["#14b8a6", "#3b82f6", "#f97316", "#8b5cf6", "#ec4899", "#22c55e", "#eab308", "#06b6d4"];

export default function PollResults() {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<{ title: string; description: string | null; views: number } | null>(null);
  const [results, setResults] = useState<OptionResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!pollId) return;
    const { data: pollData } = await supabase
      .from("polls")
      .select("title, description, views")
      .eq("id", pollId)
      .single();

    if (!pollData) {
      setLoading(false);
      return;
    }
    setPoll(pollData);

    const { data: optionData } = await supabase
      .from("poll_options")
      .select("id, option_text, image_url")
      .eq("poll_id", pollId);

    if (optionData) {
      const resultsWithVotes = await Promise.all(
        optionData.map(async (opt) => {
          const { count } = await supabase
            .from("poll_votes")
            .select("*", { count: "exact", head: true })
            .eq("option_id", opt.id);
          return { id: opt.id, option_text: opt.option_text, image_url: opt.image_url, votes: count ?? 0 };
        })
      );
      setResults(resultsWithVotes);
      setTotalVotes(resultsWithVotes.reduce((sum, r) => sum + r.votes, 0));
    }

    setLoading(false);
  }, [pollId]);

  useRealtimeSubscription("poll_votes", fetchData, [fetchData], `poll_id=eq.${pollId}`);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 size={28} className="animate-spin text-emerald-600" />
        </div>
      </AppLayout>
    );
  }

  if (!poll) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900">Poll not found</h1>
            <Link to="/polls" className="mt-4 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-slate-800 hover:shadow-md">
              Back to Polls
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
        <main className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => navigate("/polls")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to Polls
            </button>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{poll.title}</h1>
              {poll.description && (
                <p className="mt-1 text-sm text-slate-500">{poll.description}</p>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <BarChart3 size={13} />
                  {results.length} option{results.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={13} />
                  {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  {poll.views} view{poll.views !== 1 ? "s" : ""}
                </span>
                {poll.views > 0 && (
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                    {Math.round((totalVotes / poll.views) * 100)}% rate
                  </span>
                )}
              </div>
            </div>

            {totalVotes === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-12">
                <BarChart3 size={48} className="text-slate-300" />
                <h2 className="mt-4 text-lg font-bold text-slate-700">No votes yet</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Share the poll link to start collecting votes.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                      <PieIcon size={16} className="text-emerald-600" />
                      Distribution
                    </h3>
                    <div className="flex justify-center" style={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={results}
                            dataKey="votes"
                            nameKey="option_text"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={100}
                            paddingAngle={3}
                            strokeWidth={0}
                          >
                            {results.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => [`${value} vote${value !== 1 ? "s" : ""}`, "Votes"]}
                            contentStyle={{
                              borderRadius: 12,
                              border: "1px solid #e2e8f0",
                              fontSize: 12,
                              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                      {results.map((r, i) => (
                        <div key={r.id} className="flex items-center gap-1.5 text-xs">
                          <span
                            className="size-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <span className="text-slate-600">{r.option_text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                      <BarChart3 size={16} className="text-emerald-600" />
                      Breakdown
                    </h3>
                    <div className="space-y-4">
                      {results.map((result) => {
                        const percentage = totalVotes > 0 ? Math.round((result.votes / totalVotes) * 100) : 0;
                        return (
                          <div key={result.id}>
                            <div className="mb-1.5 flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2.5 font-medium text-slate-800">
                                {result.image_url && (
                                  <img
                                    src={result.image_url}
                                    alt=""
                                    className="size-10 shrink-0 rounded-lg border border-slate-200 bg-slate-50 object-cover"
                                  />
                                )}
                                {result.option_text}
                              </span>
                              <span className="text-xs text-slate-500">
                                {result.votes} vote{result.votes !== 1 ? "s" : ""} ({percentage}%)
                              </span>
                            </div>
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
    </AppLayout>
  );
}