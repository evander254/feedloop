import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useRealtimeSubscription } from "@/lib/realtime";
import {
  Loader2,
  Send,
  CheckCircle,
  Network,
  AlertCircle,
  Mail,
  Phone,
  Globe,
  BadgeCheck,
  Vote,
  ChevronRight,
  Check,
  BarChart3,
} from "lucide-react";
import { sanitize } from "@/lib/sanitize";

interface PollOption {
  id: string;
  option_text: string;
  image_url: string | null;
}

interface OrgInfo {
  name: string;
  logo_url: string | null;
  description?: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
}

interface Poll {
  id: string;
  title: string;
  description: string | null;
  allow_multiple: boolean;
  organization_id: string | null;
  organizations: OrgInfo | null;
}

interface VoteCount {
  option_id: string;
  count: number;
}

function LoadingSkeleton() {
  return (
    <div className="min-h-dvh bg-[#FAFAFA]">
      <div className="mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-28 rounded-2xl bg-white/80 border border-[#E5E7EB] p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-xl bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-56 rounded-full bg-slate-200" />
                <div className="h-3 w-36 rounded-full bg-slate-100" />
                <div className="h-3 w-44 rounded-full bg-slate-100" />
              </div>
            </div>
          </div>
          <div className="space-y-3 text-center">
            <div className="mx-auto size-12 rounded-xl bg-slate-200" />
            <div className="mx-auto h-6 w-72 rounded-full bg-slate-200" />
            <div className="mx-auto h-4 w-96 max-w-full rounded-full bg-slate-100" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-white/80 border border-[#E5E7EB] p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="size-6 rounded-full bg-slate-200" />
                <div className="h-20 w-28 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded-full bg-slate-200" />
                  <div className="h-3 w-20 rounded-full bg-slate-100" />
                </div>
              </div>
            </div>
          ))}
          <div className="h-14 rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function AnimatedCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" className="animate-[draw_0.4s_ease-out]" style={{ strokeDasharray: 20, animation: "draw 0.4s ease-out forwards" }} />
    </svg>
  );
}

function Confetti() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.5}s`,
    duration: `${1.5 + Math.random() * 1.5}s`,
    color: ["#10B981", "#059669", "#34D399", "#FCD34D", "#F97316", "#8B5CF6", "#EC4899"][Math.floor(Math.random() * 7)],
    size: 4 + Math.random() * 6,
  }));
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm opacity-0 animate-[confetti_2s_ease-out_forwards]"
          style={{
            left: p.left,
            top: "-10px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}

function AnimatedBar({ value, label, color, delay = 0, maxValue }: { value: number; label: string; color: string; delay?: number; maxValue: number }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="group transition-all duration-300" style={{ animationDelay: `${delay}s` }}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-800">{label}</span>
        <span className="text-sm font-bold text-slate-900">{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            animation: `barGrow 1s ease-out ${delay}s both`,
          }}
        />
      </div>
    </div>
  );
}

export default function PublicPoll() {
  const { pollId } = useParams<{ pollId: string }>();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [error, setError] = useState("");
  const [voteCounts, setVoteCounts] = useState<VoteCount[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchResults = async () => {
    if (!pollId) return;
    const { data: votes } = await supabase
      .from("poll_votes")
      .select("option_id")
      .eq("poll_id", pollId);

    if (votes) {
      const map: Record<string, number> = {};
      votes.forEach((v) => { map[v.option_id] = (map[v.option_id] || 0) + 1; });
      const entries = Object.entries(map).map(([option_id, count]) => ({ option_id, count }));
      setVoteCounts(entries);
      setTotalVotes(votes.length);
    }
  };

  useRealtimeSubscription("poll_votes", fetchResults, [fetchResults, pollId ?? ""], `poll_id=eq.${pollId}`);

  useEffect(() => {
    if (!pollId) return;
    (async () => {
      const { data: pollData } = await supabase
        .from("polls")
        .select("id, title, description, allow_multiple, organization_id, organizations(name, logo_url, description, email, phone, website)")
        .eq("id", pollId)
        .single();

      if (!pollData) {
        setLoading(false);
        return;
      }

      supabase.rpc("increment_views", { _table: "polls", _id: pollId });

      const { data: optionData } = await supabase
        .from("poll_options")
        .select("id, option_text, image_url")
        .eq("poll_id", pollId);

      setPoll(pollData as unknown as Poll);
      setOptions(optionData || []);
      setLoading(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: existing } = await supabase
          .from("poll_votes")
          .select("id")
          .eq("poll_id", pollId)
          .eq("voter_id", user.id)
          .maybeSingle();
        if (existing) {
          setAlreadyVoted(true);
          await fetchResults();
        }
      }
    })();
  }, [pollId]);

  const toggleOption = (optionId: string) => {
    setSelectedId(optionId);
    if (poll?.allow_multiple) {
      setSelected((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelected([optionId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (selected.length === 0) {
      setError("Please select at least one option");
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const votes = selected.map((optionId) => ({
      poll_id: pollId,
      option_id: optionId,
      voter_id: user?.id || null,
    }));

    const { error: voteError } = await supabase
      .from("poll_votes")
      .insert(votes);

    if (voteError) {
      if (voteError.code === "23505") {
        setError("You have already voted in this poll.");
        setAlreadyVoted(true);
        await fetchResults();
      } else {
        setError(voteError?.message || "Failed to submit vote. Please try again.");
      }
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
    await fetchResults();
  };

  if (loading) return <LoadingSkeleton />;

  if (!poll) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FAFAFA] px-4">
        <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center shadow-sm">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-orange-50 text-orange-500">
            <AlertCircle size={28} />
          </span>
          <h1 className="mt-5 text-xl font-bold text-slate-900">Poll Not Found</h1>
          <p className="mt-2 text-sm text-slate-500">
            This poll may have been deleted or the link is invalid.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-xl hover:shadow-emerald-500/30"
          >
            Go Home <ChevronRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  const org = poll.organizations;
  const maxCount = Math.max(...voteCounts.map((v) => v.count), 1);
  const step = Math.max(1, Math.floor(totalVotes / 4));

  if (submitted || alreadyVoted) {
    return (
      <div className="min-h-dvh bg-[#FAFAFA] py-4">
        {showConfetti && <Confetti />}
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4 rounded-2xl border border-[#E5E7EB] bg-white/90 p-6 text-center shadow-sm backdrop-blur-sm">
            <span className={`mx-auto flex size-16 items-center justify-center rounded-full ${alreadyVoted ? "bg-amber-50 text-amber-500" : "bg-emerald-50 text-emerald-500"} animate-[scaleIn_0.4s_ease-out]`}>
              {alreadyVoted ? <AlertCircle size={32} /> : <CheckCircle size={32} />}
            </span>
            <h1 className="mt-4 text-2xl font-bold text-slate-900 animate-[fadeUp_0.5s_ease-out_0.1s_both]">
              {alreadyVoted ? "Already Voted" : "Vote Submitted!"}
            </h1>
            <p className="mt-2 text-sm text-slate-500 animate-[fadeUp_0.5s_ease-out_0.2s_both]">
              {alreadyVoted
                ? "You have already participated in this poll. Only one vote is allowed."
                : "Thank you for your vote. Your response has been recorded and will help shape our decisions."}
            </p>
          </div>

          {voteCounts.length > 0 && (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm animate-[fadeUp_0.6s_ease-out_0.3s_both]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 size={18} className="text-emerald-500" />
                  Live Results
                </h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-4">
                {options.map((opt, i) => {
                  const vc = voteCounts.find((v) => v.option_id === opt.id);
                  const pct = totalVotes > 0 ? Math.round(((vc?.count || 0) / totalVotes) * 100) : 0;
                  const colors = ["#10B981", "#3B82F6", "#F97316", "#8B5CF6", "#EC4899", "#14B8A6"];
                  return (
                    <AnimatedBar
                      key={opt.id}
                      label={opt.option_text}
                      value={pct}
                      color={colors[i % colors.length]}
                      delay={0.4 + i * 0.1}
                      maxValue={100}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#FAFAFA]">
      <div className="mx-auto px-2 py-2">
        {org && (
          <div className="group mb-3 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-center gap-4">
              {org.logo_url ? (
                <img src={org.logo_url} alt={org.name} className="size-14 shrink-0 rounded-xl border border-[#E5E7EB] object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
              ) : (
                <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-base font-bold text-white shadow-sm">
                  {org.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-slate-900 truncate">{org.name}</h2>
                  <BadgeCheck size={16} className="shrink-0 text-emerald-500" />
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  {org.email && <span className="inline-flex items-center gap-1.5"><Mail size={12} className="text-slate-400" /> {org.email}</span>}
                  {org.phone && <span className="inline-flex items-center gap-1.5"><Phone size={12} className="text-slate-400" /> {org.phone}</span>}
                  {org.website && <span className="inline-flex items-center gap-1.5"><Globe size={12} className="text-slate-400" /> {org.website}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-3 text-center animate-[fadeUp_0.5s_ease-out]">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20">
            <Vote size={24} />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {poll.title}
          </h1>
          {poll.description && (
            <p className="mt-3 max-w-xl mx-auto text-sm leading-relaxed text-slate-500">
              {poll.description}
            </p>
          )}
          {poll.allow_multiple && (
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700">
              <Check size={12} />
              You can select multiple options
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Vote size={13} />
              1 of 1 Question
            </span>
            <span>Please select one option</span>
          </div>

          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500" />
          </div>

          <div className="space-y-4">
            {options.map((option, idx) => {
              const isSelected = selected.includes(option.id);
              return (
                <label
                  key={option.id}
                    className={`group relative flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-3 transition-all duration-200 ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-50/80 shadow-sm shadow-emerald-500/5"
                      : "border-[#E5E7EB] bg-white hover:border-slate-300 hover:shadow-md"
                  }`}
                  style={{ animation: `fadeUp 0.4s ease-out ${idx * 0.08}s both` }}
                >
                  <input
                    type={poll.allow_multiple ? "checkbox" : "radio"}
                    name="poll-option"
                    checked={isSelected}
                    onChange={() => toggleOption(option.id)}
                    className="sr-only"
                    aria-label={option.option_text}
                  />
                  <span
                    className={`mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500 scale-110"
                        : "border-slate-300 bg-white group-hover:border-slate-400"
                    }`}
                  >
                    {isSelected && (
                      <span className="text-white animate-[scaleIn_0.2s_ease-out]">
                        <AnimatedCheck />
                      </span>
                    )}
                  </span>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {option.image_url && (
                      <img
                        src={option.image_url}
                        alt=""
                        loading="lazy"
                        className="size-11 shrink-0 rounded-lg border border-[#E5E7EB] bg-slate-50 object-cover"
                      />
                    )}
                    <span className={`text-sm font-semibold transition-colors duration-200 ${
                      isSelected ? "text-emerald-800" : "text-slate-800"
                    }`}>
                      {option.option_text}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm animate-[scaleIn_0.3s_ease-out]">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          {error && (
            <div className="mt-5 animate-[fadeUp_0.3s_ease-out] rounded-2xl border border-red-200 bg-red-50/80 px-5 py-3.5 text-sm font-semibold text-red-700 backdrop-blur-sm">
              {error}
            </div>
          )}

          <div className="mt-6">
            <button
              type="submit"
              disabled={submitting || selected.length === 0}
              className="group relative inline-flex min-h-14 w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-xl hover:shadow-emerald-500/35 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  Submit Vote
                </>
              )}
            </button>
          </div>
        </form>

        {selected.length > 0 && (
          <p className="mt-4 text-center text-xs text-slate-400 animate-[fadeUp_0.3s_ease-out]">
            {selected.length} option{selected.length !== 1 ? "s" : ""} selected
          </p>
        )}
      </div>

      <style>{`
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes barGrow {
          from { width: 0 !important; }
        }
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
