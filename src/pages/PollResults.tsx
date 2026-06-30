import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/app-layout";
import {
  Loader2,
  BarChart3,
  Users,
  ArrowLeft,
} from "lucide-react";

interface OptionResult {
  id: string;
  option_text: string;
  image_url: string | null;
  votes: number;
}

export default function PollResults() {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<{ title: string; description: string | null } | null>(null);
  const [results, setResults] = useState<OptionResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pollId) return;
    (async () => {
      const { data: pollData } = await supabase
        .from("polls")
        .select("title, description")
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
    })();
  }, [pollId]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f4f7f5]">
        <Loader2 size={32} className="animate-spin text-teal-600" />
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f4f7f5] px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900">Poll not found</h1>
          <Link to="/polls" className="mt-4 inline-flex rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white">
            Back to Polls
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
        <main className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto max-w-3xl space-y-4">
            <button
              type="button"
              onClick={() => navigate("/polls")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft size={14} />
              Back to Polls
            </button>

            <div className="rounded-xl bg-white p-5 shadow-md ring-1 ring-slate-200/60">
              <h1 className="text-xl font-black text-slate-900">{poll.title}</h1>
              {poll.description && (
                <p className="mt-1 text-sm text-slate-500">{poll.description}</p>
              )}
              <div className="mt-4 flex items-center gap-5 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <BarChart3 size={14} />
                  {results.length} option{results.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={14} />
                  {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {totalVotes === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-md ring-1 ring-slate-200/60">
                <BarChart3 size={48} className="text-slate-300" />
                <h2 className="mt-4 text-lg font-bold text-slate-700">No votes yet</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Share the poll link to start collecting votes.
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-white p-6 shadow-md ring-1 ring-slate-200/60">
                <div className="space-y-4">
                  {results.map((result) => {
                    const percentage = totalVotes > 0 ? Math.round((result.votes / totalVotes) * 100) : 0;
                    return (
                      <div key={result.id}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2.5 font-medium text-slate-800">
                            {result.image_url && (
                              <img
                                src={result.image_url}
                                alt=""
                                className="size-10 shrink-0 rounded-lg border border-[#E5E7EB] bg-slate-50 object-cover"
                              />
                            )}
                            {result.option_text}
                          </span>
                          <span className="text-xs text-slate-500">
                            {result.votes} vote{result.votes !== 1 ? "s" : ""} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
    </AppLayout>
  );
}