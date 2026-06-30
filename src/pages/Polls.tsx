import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useRealtimeSubscription } from "@/lib/realtime";
import AppLayout from "@/components/app-layout";
import {
  Plus,
  Loader2,
  Vote,
  Eye,
  Share2,
  BarChart3,
  Users,
  CalendarDays,
  Check,
  Pencil,
  Trash2,
} from "lucide-react";

interface PollSummary {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  option_count: number;
  vote_count: number;
}

export default function Polls() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState<PollSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPolls = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const { data: pollRows } = await supabase
      .from("polls")
      .select("id, title, description, created_at, created_by")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (!pollRows) {
      setLoading(false);
      return;
    }

    const pollsWithCounts = await Promise.all(
      pollRows.map(async (p) => {
        const { count: optionCount } = await supabase
          .from("poll_options")
          .select("*", { count: "exact", head: true })
          .eq("poll_id", p.id);

        const { count: voteCount } = await supabase
          .from("poll_votes")
          .select("*", { count: "exact", head: true })
          .eq("poll_id", p.id);

        return {
          id: p.id,
          title: p.title,
          description: p.description,
          created_at: p.created_at,
          option_count: optionCount ?? 0,
          vote_count: voteCount ?? 0,
        };
      })
    );

    setPolls(pollsWithCounts);
    setLoading(false);
  }, [navigate]);

  useRealtimeSubscription("polls", fetchPolls, [fetchPolls]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const handleCopyLink = async (pollId: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/poll/${pollId}`);
    setCopiedId(pollId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (pollId: string) => {
    if (!confirm("Are you sure you want to delete this poll? All votes and images will be permanently removed.")) return;
    await supabase.storage.from("polls").remove([`${pollId}/`]);
    await supabase.from("poll_votes").delete().eq("poll_id", pollId);
    const { error } = await supabase.from("polls").delete().eq("id", pollId);
    if (!error) setPolls((prev) => prev.filter((p) => p.id !== pollId));
  };

  const filtered = polls.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
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
                  placeholder="Search polls..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  {filtered.length} poll{filtered.length !== 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => navigate("/polls/new")}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:from-teal-500 hover:to-emerald-500"
                >
                  <Plus size={15} />
                  New Poll
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-white py-6 shadow-md ring-1 ring-slate-200/60">
                <Vote size={48} className="text-slate-300" />
                <h2 className="mt-4 text-lg font-bold text-slate-700">No polls yet</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {search ? "No polls match your search." : "Create your first poll to start collecting votes."}
                </p>
                {!search && (
                  <button
                    type="button"
                    onClick={() => navigate("/polls/new")}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-teal-500 hover:to-emerald-500"
                  >
                    <Plus size={16} />
                    Create Poll
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((poll) => (
                  <div
                    key={poll.id}
                    className="rounded-xl bg-white p-3 shadow-md ring-1 ring-slate-200/60 transition hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <h2 className="text-base font-bold text-slate-900 truncate">
                            {poll.title}
                          </h2>
                        </div>
                        {poll.description && (
                          <p className="mt-1 text-sm text-slate-500 line-clamp-1">
                            {poll.description}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <BarChart3 size={13} />
                            {poll.option_count} option{poll.option_count !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={13} />
                            {poll.vote_count} vote{poll.vote_count !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarDays size={13} />
                            {new Date(poll.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/polls/new?id=${poll.id}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/polls/${poll.id}/results`)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          <Eye size={14} />
                          Results
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(poll.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          {copiedId === poll.id ? (
                            <Check size={14} className="text-teal-600" />
                          ) : (
                            <Share2 size={14} />
                          )}
                          {copiedId === poll.id ? "Copied" : "Share"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(poll.id)}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
    </AppLayout>
  );
}