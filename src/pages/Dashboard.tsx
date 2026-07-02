import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/app-layout";
import {
  Loader2,
  ClipboardList,
  FileText,
  Vote,
  Building2,
  ArrowRight,
  Plus,
} from "lucide-react";

type CardMeta = {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  path: string;
  newPath: string;
  newLabel: string;
  table: string;
  chartPct: number;
};

const cards: CardMeta[] = [
  {
    key: "forms",
    label: "Forms",
    description: "Build data collection forms with drag-and-drop fields, share them, and track responses instantly.",
    icon: ClipboardList,
    color: "#10b981",
    path: "/forms",
    newPath: "/builder",
    newLabel: "New Form",
    table: "forms",
    chartPct: 75,
  },
  {
    key: "surveys",
    label: "Surveys",
    description: "Create public or private surveys, gather target feedback, and analyse results in real time.",
    icon: FileText,
    color: "#3b82f6",
    path: "/surveys",
    newPath: "/surveys/new",
    newLabel: "New Survey",
    table: "surveys",
    chartPct: 40,
  },
  {
    key: "polls",
    label: "Polls",
    description: "Launch quick opinion polls with live interactive results, multiple options, and image support.",
    icon: Vote,
    color: "#f97316",
    path: "/polls",
    newPath: "/polls/new",
    newLabel: "New Poll",
    table: "polls",
    chartPct: 90,
  },
  {
    key: "organizations",
    label: "Organizations",
    description: "Manage your workspaces, invite team members, and configure global settings from one place.",
    icon: Building2,
    color: "#a855f7",
    path: "/organizations",
    newPath: "/organizations",
    newLabel: "New Org",
    table: "organizations",
    chartPct: 60,
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [userName, setUserName] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});

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
      setChecking(false);
    });
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7faf7]">
        <Loader2 size={32} className="animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Welcome back, {userName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            What would you like to work on today?
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const count = counts[card.key] ?? 0;
            return (
              <div
                key={card.key}
                className="card-enter group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-200/60"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Accent bar */}
                <div className="h-[6px] shrink-0 transition-all duration-300 group-hover:h-[7px]" style={{ background: card.color }} />

                <div className="flex flex-1 flex-col p-6">
                  {/* Header with icon + count */}
                  <div className="flex items-center justify-between">
                    <span
                      className="flex size-11 items-center justify-center rounded-xl text-lg font-bold transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: `${card.color}1a`,
                        color: card.color,
                      }}
                    >
                      <Icon size={22} />
                    </span>
                    <span className="text-2xl font-black text-slate-900 transition-all duration-300 group-hover:scale-110">
                      {count}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mt-4 text-lg font-bold text-slate-900 transition-colors duration-300"
                    style={{ color: card.color }}
                  >
                    {card.label}
                  </h3>

                  {/* Description */}
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    {card.description}
                  </p>

                  {/* Visual preview (mock chart bar) */}
                  <div className="mt-4 flex h-[72px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60">
                    <div className="relative h-2.5 w-4/5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 group-hover:shadow-lg"
                        style={{
                          width: `${card.chartPct}%`,
                          background: card.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex items-center gap-2 pt-5">
                    <button
                      type="button"
                      onClick={() => navigate(card.path)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:border-slate-400 group-hover:shadow-md"
                    >
                      Open <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(card.newPath)}
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
          })}
        </div>
      </div>
    </AppLayout>
  );
}
