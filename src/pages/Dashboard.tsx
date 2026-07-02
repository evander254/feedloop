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

const cards = [
  {
    key: "forms",
    label: "Forms",
    description: "Build data collection forms with drag-and-drop fields, share them, and track responses.",
    icon: ClipboardList,
    color: "from-teal-500 to-emerald-600",
    bgColor: "bg-teal-50",
    iconBg: "bg-gradient-to-br from-teal-400 to-emerald-500",
    path: "/forms",
    newPath: "/builder",
    table: "forms",
  },
  {
    key: "surveys",
    label: "Surveys",
    description: "Create public or private surveys, gather feedback, and analyse results in real time.",
    icon: FileText,
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50",
    iconBg: "bg-gradient-to-br from-blue-400 to-indigo-500",
    path: "/surveys",
    newPath: "/surveys/new",
    table: "surveys",
  },
  {
    key: "polls",
    label: "Polls",
    description: "Launch quick opinion polls with live results, multiple options, and image support.",
    icon: Vote,
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50",
    iconBg: "bg-gradient-to-br from-orange-400 to-red-500",
    path: "/polls",
    newPath: "/polls/new",
    table: "polls",
  },
  {
    key: "organizations",
    label: "Organizations",
    description: "Manage your teams, members, and organisational settings from one place.",
    icon: Building2,
    color: "from-purple-500 to-pink-600",
    bgColor: "bg-purple-50",
    iconBg: "bg-gradient-to-br from-purple-400 to-pink-500",
    path: "/organizations",
    newPath: "/organizations",
    table: "organizations",
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
            What would you like to work on?
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const count = counts[card.key] ?? 0;
            const accentColor = card.key === "forms" ? "#14b8a6"
              : card.key === "surveys" ? "#3b82f6"
              : card.key === "polls" ? "#f97316" : "#a855f7";
            const accentColor2 = card.key === "forms" ? "#059669"
              : card.key === "surveys" ? "#6366f1"
              : card.key === "polls" ? "#ef4444" : "#ec4899";
            return (
              <div
                key={card.key}
                className="card-enter group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <span
                      className={`flex size-12 items-center justify-center rounded-xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110 ${card.iconBg}`}
                    >
                      <Icon size={24} />
                    </span>
                    <span className="text-2xl font-black text-slate-900 transition-all duration-300 group-hover:scale-110">
                      {count}
                    </span>
                  </div>

                  <h2 className="mt-4 text-lg font-bold text-slate-900 transition-colors duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${accentColor}, ${accentColor2})`,
                    }}
                  >
                    {card.label}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    {card.description}
                  </p>

                  <div className="mt-5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(card.path)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 group-hover:shadow-md"
                    >
                      Open <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                    {card.newPath && (
                      <button
                        type="button"
                        onClick={() => navigate(card.newPath)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md"
                        style={{
                          background: `linear-gradient(135deg, ${accentColor}, ${accentColor2})`,
                        }}
                      >
                        <Plus size={13} />
                        New
                      </button>
                    )}
                  </div>
                </div>

                <div
                  className="absolute right-0 top-0 h-1 transition-all duration-500 ease-out group-hover:h-1.5"
                  style={{
                    width: "100%",
                    background: `linear-gradient(90deg, ${accentColor}, ${accentColor2})`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
