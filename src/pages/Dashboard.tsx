import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useRealtimeSubscription } from "@/lib/realtime";
import {
  ClipboardList,
  FileText,
  Vote,
  Building2,
  Plus,
  Clock,
  Pencil,
  LogOut,
  User,
  Sparkles,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  HelpCircle,
  ThumbsUp,
  X
} from "lucide-react";
import logoSrc from "@/assets/loop.png";

type CardMeta = {
  key: string;
  label: string;
  table: string;
};

const cards: CardMeta[] = [
  { key: "forms", label: "Forms", table: "forms" },
  { key: "surveys", label: "Surveys", table: "surveys" },
  { key: "polls", label: "Polls", table: "polls" },
  { key: "organizations", label: "Organizations", table: "organizations" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userInitials, setUserInitials] = useState("U");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recentForms, setRecentForms] = useState<any[]>([]);
  const [recentSurveys, setRecentSurveys] = useState<any[]>([]);
  const [recentPolls, setRecentPolls] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<"forms" | "surveys" | "polls" | "drafts">("forms");
  
  // Feedback popup state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    setUserEmail(user.email || "");
    const name =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split("@")[0] ||
      "User";
    setUserName(name);

    const parts = name.split(" ");
    setUserInitials(
      parts.length > 1
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase()
    );

    // Fetch profile if exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.full_name) {
      setUserName(profile.full_name);
      const profileParts = profile.full_name.split(" ");
      setUserInitials(
        profileParts.length > 1
          ? (profileParts[0][0] + profileParts[1][0]).toUpperCase()
          : profile.full_name.slice(0, 2).toUpperCase()
      );
    }

    // Fetch lists and counts in parallel
    const [formsRes, surveysRes, pollsRes, countsRes] = await Promise.all([
      supabase
        .from("forms")
        .select("id, title, description, updated_at, created_at, status")
        .eq("created_by", user.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("surveys")
        .select("id, title, description, updated_at, created_at")
        .eq("created_by", user.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("polls")
        .select("id, question, description, updated_at, created_at")
        .eq("created_by", user.id)
        .order("updated_at", { ascending: false }),
      Promise.all(
        cards.map(async (card) => {
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
        })
      ),
    ]);

    if (formsRes.data) setRecentForms(formsRes.data);
    if (surveysRes.data) setRecentSurveys(surveysRes.data);
    if (pollsRes.data) setRecentPolls(pollsRes.data);

    const countMap: Record<string, number> = {};
    countsRes.forEach((r) => {
      countMap[r.key] = r.count;
    });
    setCounts(countMap);

    try {
      await supabase.rpc("publish_scheduled_forms");
    } catch (err) {
      console.warn("publish_scheduled_forms RPC failed:", err);
    }
    setChecking(false);
  }, [navigate]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login", { replace: true });
      } else {
        fetchDashboardData();
      }
    });
  }, [navigate, fetchDashboardData]);

  // Realtime subscriptions
  useRealtimeSubscription("forms", fetchDashboardData, [fetchDashboardData]);
  useRealtimeSubscription("surveys", fetchDashboardData, [fetchDashboardData]);
  useRealtimeSubscription("polls", fetchDashboardData, [fetchDashboardData]);
  useRealtimeSubscription("organizations", fetchDashboardData, [fetchDashboardData]);

  // Click outside listener for profile dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setProfileOpen(false);
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackText("");
      setFeedbackSent(false);
      setFeedbackOpen(false);
    }, 2000);
  };

  const drafts = recentForms.filter((f) => f.status === "draft");

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 animate-spin rounded-full border-[3px] border-[#2575fc] border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Loading FeedLoop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#eef2ff] via-[#fae8ff] to-[#f1f5f9] text-slate-800 font-sans flex flex-col overflow-x-hidden">
      
      {/* CSS Float Animations */}
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(6deg); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(15px) rotate(-6deg); }
        }
        .animate-float-slow {
          animation: floatSlow 8s ease-in-out infinite;
        }
        .animate-float-reverse {
          animation: floatReverse 9s ease-in-out infinite;
        }
      `}</style>

      {/* Floating 3D Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
        {/* Cyan Cone (Left) */}
        <div className="absolute top-[25%] left-[8%] w-24 h-24 sm:w-32 sm:h-32 opacity-20 blur-[3px] animate-float-slow">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="cyanConeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#0891b2" />
              </linearGradient>
            </defs>
            <polygon points="50,10 15,80 85,80" fill="url(#cyanConeGrad)" />
            <ellipse cx="50" cy="80" rx="35" ry="10" fill="#0e7490" opacity="0.6" />
          </svg>
        </div>

        {/* Blue Ring (Right) */}
        <div className="absolute top-[18%] right-[10%] w-28 h-28 sm:w-36 sm:h-36 opacity-25 blur-[1px] animate-float-reverse">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="blueRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="30" stroke="url(#blueRingGrad)" strokeWidth="12" fill="none" />
          </svg>
        </div>

        {/* Blue Sphere (Bottom Left) */}
        <div className="absolute bottom-[35%] left-[5%] w-20 h-20 sm:w-28 sm:h-28 opacity-15 blur-[5px] animate-float-reverse">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="blueSphereGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="40" fill="url(#blueSphereGrad)" />
          </svg>
        </div>

        {/* Purple Triangle (Bottom Right) */}
        <div className="absolute bottom-[10%] right-[6%] w-32 h-32 sm:w-44 sm:h-44 opacity-20 blur-[2px] animate-float-slow">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="purpleConeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#6b21a8" />
              </linearGradient>
            </defs>
            <polygon points="50,15 20,85 80,85" fill="url(#purpleConeGrad)" />
            <ellipse cx="50" cy="85" rx="30" ry="8" fill="#581c87" opacity="0.6" />
          </svg>
        </div>
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        {/* Product Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
          <img src={logoSrc} alt="FeedLoop Logo" className="h-8 w-auto object-contain" />
          <span className="text-lg font-black tracking-tight text-slate-800 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">FeedLoop</span>
        </div>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-md ring-2 ring-white hover:scale-105 transition duration-200"
          >
            {userInitials}
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                <p className="text-xs text-slate-500 truncate">{userEmail}</p>
              </div>
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => { setProfileOpen(false); navigate("/profile"); }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <User size={14} className="text-slate-400" />
                  View Profile
                </button>
                <button
                  type="button"
                  onClick={() => { setProfileOpen(false); navigate("/organizations"); }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Building2 size={14} className="text-slate-400" />
                  Workspaces
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col justify-start items-center max-w-6xl w-full mx-auto px-4 mt-6">
        
        {/* Welcome Text Section */}
        <section className="text-center mb-8 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            Welcome to FeedLoop, {userName}!
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium mb-8">
            Collect better data and make better decisions.
          </p>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mb-2">
            Choose a scenario and start with well-crafted templates.
          </p>
        </section>

        {/* Template Quickstart Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full mb-16">
          
          {/* Card 1: Survey */}
          <div
            onClick={() => navigate("/surveys/new")}
            className="bg-gradient-to-b from-[#3ba2de] to-[#1d6b9c] text-white rounded-[24px] p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col justify-between h-[280px] text-center cursor-pointer group relative overflow-hidden"
          >
            <div>
              <h3 className="text-xl font-bold tracking-wide mt-2">Survey</h3>
              <p className="text-[11px] opacity-85 mt-1 px-4 leading-normal">
                Gather comprehensive feedback or conduct academic studies.
              </p>
            </div>
            
            {/* SVG Clipboard Stack Illustration */}
            <div className="w-full mt-auto">
              <svg viewBox="0 0 160 120" className="w-full h-28 select-none transition-transform duration-300 group-hover:scale-105">
                <path d="M 10 90 Q 50 70 150 100 L 150 120 L 10 120 Z" fill="#1b5a84" opacity="0.3" />
                <rect x="28" y="42" width="96" height="85" rx="6" fill="#15557d" transform="rotate(-8 76 84)" />
                <rect x="42" y="32" width="88" height="95" rx="6" fill="#ffffff" transform="rotate(5 86 79)" />
                <rect x="42" y="32" width="88" height="18" rx="2" fill="#bae6fd" transform="rotate(5 86 79)" />
                <rect x="52" y="60" width="35" height="4" rx="2" fill="#cbd5e1" transform="rotate(5 86 79)" />
                <rect x="52" y="72" width="55" height="3" rx="1.5" fill="#f1f5f9" transform="rotate(5 86 79)" />
                <rect x="52" y="80" width="45" height="3" rx="1.5" fill="#f1f5f9" transform="rotate(5 86 79)" />
                <rect x="52" y="88" width="55" height="3" rx="1.5" fill="#f1f5f9" transform="rotate(5 86 79)" />
                <rect x="52" y="96" width="25" height="3" rx="1.5" fill="#f1f5f9" transform="rotate(5 86 79)" />
              </svg>
            </div>
          </div>

          {/* Card 2: Quiz */}
          <div
            onClick={() => navigate("/builder?template=quiz")}
            className="bg-gradient-to-b from-[#df79ae] to-[#a33f70] text-white rounded-[24px] p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col justify-between h-[280px] text-center cursor-pointer group relative overflow-hidden"
          >
            <div>
              <h3 className="text-xl font-bold tracking-wide mt-2">Quiz</h3>
              <p className="text-[11px] opacity-85 mt-1 px-4 leading-normal">
                Test knowledge, run trivia contests, and grade outcomes.
              </p>
            </div>
            
            {/* SVG Quiz Illustration */}
            <div className="w-full mt-auto">
              <svg viewBox="0 0 160 120" className="w-full h-28 select-none transition-transform duration-300 group-hover:scale-105">
                <rect x="22" y="47" width="85" height="80" rx="6" fill="#70224d" transform="rotate(-15 64 87)" />
                <rect x="26" y="47" width="12" height="80" fill="#facc15" transform="rotate(-15 64 87)" />
                <rect x="45" y="27" width="90" height="100" rx="6" fill="#ffffff" transform="rotate(6 90 77)" />
                <rect x="45" y="27" width="90" height="15" rx="2" fill="#ffedd5" transform="rotate(6 90 77)" />
                
                <rect x="55" y="52" width="45" height="4" rx="2" fill="#e2e8f0" transform="rotate(6 90 77)" />
                <circle cx="58" cy="70" r="5.5" fill="#4ade80" transform="rotate(6 90 77)" />
                <path d="M 56 70 L 58 72 L 61 68" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(6 90 77)" />
                
                <rect x="55" y="84" width="50" height="4" rx="2" fill="#e2e8f0" transform="rotate(6 90 77)" />
                <circle cx="58" cy="102" r="5.5" fill="#f87171" transform="rotate(6 90 77)" />
                <path d="M 56 100 L 60 104 M 60 100 L 56 104" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(6 90 77)" />
              </svg>
            </div>
          </div>

          {/* Card 3: Invitation */}
          <div
            onClick={() => navigate("/builder?template=invitation")}
            className="bg-gradient-to-b from-[#d5786c] to-[#973f34] text-white rounded-[24px] p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col justify-between h-[280px] text-center cursor-pointer group relative overflow-hidden"
          >
            <div>
              <h3 className="text-xl font-bold tracking-wide mt-2">Invitation</h3>
              <p className="text-[11px] opacity-85 mt-1 px-4 leading-normal">
                Organize events, collect RSVPs, and coordinate details.
              </p>
            </div>
            
            {/* SVG Envelope & Photo Illustration */}
            <div className="w-full mt-auto">
              <svg viewBox="0 0 160 120" className="w-full h-28 select-none transition-transform duration-300 group-hover:scale-105">
                <rect x="15" y="48" width="105" height="75" rx="4" fill="#fae8ff" transform="rotate(-10 67 85)" />
                <path d="M 15 48 L 67 82 L 120 48" fill="none" stroke="#f0abfc" strokeWidth="2" transform="rotate(-10 67 85)" />
                
                <g transform="rotate(8 95 62)">
                  <rect x="68" y="12" width="70" height="95" rx="4" fill="#ffffff" />
                  <rect x="73" y="17" width="60" height="50" rx="2" fill="#cbd5e1" />
                  <circle cx="93" cy="38" r="10" fill="#f472b6" />
                  <circle cx="113" cy="35" r="8" fill="#38bdf8" />
                  <path d="M 76 67 Q 100 45 130 67 Z" fill="#64748b" />
                  <rect x="75" y="76" width="45" height="3" rx="1.5" fill="#cbd5e1" />
                  <rect x="75" y="84" width="30" height="3" rx="1.5" fill="#cbd5e1" />
                </g>
                
                <path d="M 15 123 L 67 83 L 120 123 Z" fill="#fdf4ff" opacity="0.9" transform="rotate(-10 67 85)" />
              </svg>
            </div>
          </div>

          {/* Card 4: Registration */}
          <div
            onClick={() => navigate("/builder?template=registration")}
            className="bg-gradient-to-b from-[#e39a67] to-[#aa5424] text-white rounded-[24px] p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col justify-between h-[280px] text-center cursor-pointer group relative overflow-hidden"
          >
            <div>
              <h3 className="text-xl font-bold tracking-wide mt-2">Registration</h3>
              <p className="text-[11px] opacity-85 mt-1 px-4 leading-normal">
                Accept sign-ups for workshops, conferences, or clubs.
              </p>
            </div>
            
            {/* SVG Registration Illustration */}
            <div className="w-full mt-auto">
              <svg viewBox="0 0 160 120" className="w-full h-28 select-none transition-transform duration-300 group-hover:scale-105">
                <rect x="38" y="28" width="84" height="105" rx="6" fill="#ffffff" transform="rotate(4 80 80)" />
                
                <g transform="rotate(4 80 80)">
                  <circle cx="80" cy="45" r="11" fill="#e2e8f0" />
                  <circle cx="80" cy="42" r="4" fill="#94a3b8" />
                  <path d="M 73 52 A 7 7 0 0 1 87 52 Z" fill="#94a3b8" />
                  
                  <rect x="48" y="65" width="64" height="2" rx="1" fill="#cbd5e1" />
                  
                  <rect x="48" y="75" width="8" height="8" rx="1.5" stroke="#f97316" strokeWidth="1.5" fill="#ffedd5" />
                  <path d="M 50 79 L 52 81 L 55 77" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="60" y="78" width="40" height="3" rx="1.5" fill="#cbd5e1" />
                  
                  <rect x="48" y="90" width="8" height="8" rx="1.5" stroke="#f97316" strokeWidth="1.5" fill="#ffedd5" />
                  <path d="M 50 94 L 52 96 L 55 92" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="60" y="93" width="45" height="3" rx="1.5" fill="#cbd5e1" />
                </g>
              </svg>
            </div>
          </div>

        </section>

        {/* Recent Work / My Forms Tabbed Area */}
        <section className="w-full bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-16 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              My Files &amp; Workspace
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {counts.forms + counts.surveys + counts.polls} total
              </span>
            </h2>

            {/* Tab Controls */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("forms")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "forms" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                Forms ({counts.forms || 0})
              </button>
              <button
                onClick={() => setActiveTab("drafts")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "drafts" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                Drafts ({drafts.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("surveys")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "surveys" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                Surveys ({counts.surveys || 0})
              </button>
              <button
                onClick={() => setActiveTab("polls")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "polls" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                Polls ({counts.polls || 0})
              </button>
            </div>
          </div>

          {/* Tab Content Rendering */}
          <div className="space-y-3">
            
            {/* Forms Tab */}
            {activeTab === "forms" && (
              recentForms.length === 0 ? (
                <EmptyState label="Forms" actionPath="/builder/new" btnText="Create new Form" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {recentForms.map((form) => (
                    <FileCard
                      key={form.id}
                      title={form.title}
                      desc={form.description}
                      date={form.updated_at || form.created_at}
                      badge={form.status === "published" ? "Published" : "Draft"}
                      badgeColor={form.status === "published" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"}
                      onEdit={() => navigate(`/builder?id=${form.id}`)}
                      onView={() => navigate(`/form/${form.id}`)}
                      icon={ClipboardList}
                      iconBg="bg-teal-50 text-teal-600"
                    />
                  ))}
                </div>
              )
            )}

            {/* Drafts Tab */}
            {activeTab === "drafts" && (
              drafts.length === 0 ? (
                <EmptyState label="Drafts" actionPath="/builder/new" btnText="Start a draft" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {drafts.map((draft) => (
                    <FileCard
                      key={draft.id}
                      title={draft.title}
                      desc={draft.description}
                      date={draft.updated_at || draft.created_at}
                      onEdit={() => navigate(`/builder?id=${draft.id}`)}
                      onView={() => navigate(`/form/${draft.id}`)}
                      icon={Pencil}
                      iconBg="bg-amber-50 text-amber-600"
                    />
                  ))}
                </div>
              )
            )}

            {/* Surveys Tab */}
            {activeTab === "surveys" && (
              recentSurveys.length === 0 ? (
                <EmptyState label="Surveys" actionPath="/surveys/new" btnText="Create new Survey" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {recentSurveys.map((survey) => (
                    <FileCard
                      key={survey.id}
                      title={survey.title}
                      desc={survey.description}
                      date={survey.updated_at || survey.created_at}
                      onEdit={() => navigate(`/surveys/new?id=${survey.id}`)}
                      onView={() => navigate(`/survey/${survey.id}`)}
                      icon={FileText}
                      iconBg="bg-blue-50 text-blue-600"
                    />
                  ))}
                </div>
              )
            )}

            {/* Polls Tab */}
            {activeTab === "polls" && (
              recentPolls.length === 0 ? (
                <EmptyState label="Polls" actionPath="/polls/new" btnText="Create new Poll" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {recentPolls.map((poll) => (
                    <FileCard
                      key={poll.id}
                      title={poll.question || "Untitled Poll"}
                      desc={poll.description}
                      date={poll.updated_at || poll.created_at}
                      onEdit={() => navigate(`/polls/new?id=${poll.id}`)}
                      onView={() => navigate(`/poll/${poll.id}`)}
                      icon={Vote}
                      iconBg="bg-purple-50 text-purple-600"
                    />
                  ))}
                </div>
              )
            )}

          </div>
        </section>

      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 text-center py-6 text-xs text-slate-400 border-t border-slate-100 bg-white/20 backdrop-blur-md">
        &copy; {new Date().getFullYear()} FeedLoop. All rights reserved. Powered by Advanced Agentic Systems.
      </footer>

      {/* MS Forms-style floating feedback button */}
      <button
        type="button"
        onClick={() => setFeedbackOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-full shadow-lg text-xs font-bold flex items-center gap-1.5 border border-slate-700/50 hover:scale-105 active:scale-95 transition"
      >
        <MessageSquare size={13} />
        Feedback
      </button>

      {/* Feedback Modal Popup */}
      {feedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/50 max-w-md w-full p-6 relative">
            <button
              onClick={() => { setFeedbackOpen(false); setFeedbackSent(false); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50 transition"
            >
              <X size={16} />
            </button>
            
            {feedbackSent ? (
              <div className="text-center py-6">
                <div className="size-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ThumbsUp size={22} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Thank You!</h3>
                <p className="text-xs text-slate-500 mt-1">Your feedback helps us make FeedLoop better.</p>
              </div>
            ) : (
              <form onSubmit={handleSendFeedback} className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles size={16} className="text-[#df79ae]" />
                    Share Feedback
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Let us know how we can improve your experience.</p>
                </div>
                
                <textarea
                  required
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us what you like or what we can improve..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#2575fc] placeholder:text-slate-300 resize-none"
                />
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackOpen(false)}
                    className="flex-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl py-2.5 text-xs font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-slate-900 text-white rounded-xl py-2.5 text-xs font-bold hover:bg-slate-800 transition"
                  >
                    Submit
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// Subcomponent: File Listing Card
function FileCard({
  title,
  desc,
  date,
  badge,
  badgeColor = "",
  onEdit,
  onView,
  icon: Icon,
  iconBg,
}: {
  title: string;
  desc?: string;
  date: string;
  badge?: string;
  badgeColor?: string;
  onEdit: () => void;
  onView: () => void;
  icon: any;
  iconBg: string;
}) {
  return (
    <div className="group flex flex-col justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-md transition duration-200">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`flex size-9 items-center justify-center rounded-xl shrink-0 ${iconBg}`}>
            <Icon size={16} />
          </span>
          {badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        
        <h4 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-slate-950">
          {title}
        </h4>
        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-normal">
          {desc || "No description provided."}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] text-slate-400">
          <Clock size={11} />
          {new Date(date).toLocaleDateString()}
        </span>

        <div className="flex gap-1.5 opacity-90 group-hover:opacity-100 transition">
          <button
            type="button"
            onClick={onView}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-200 transition"
          >
            Open <ExternalLink size={10} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 text-white text-[10px] font-bold hover:bg-slate-800 transition"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// Subcomponent: Empty State
function EmptyState({
  label,
  actionPath,
  btnText,
}: {
  label: string;
  actionPath: string;
  btnText: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="size-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-3">
        <Sparkles size={20} />
      </div>
      <h3 className="text-sm font-bold text-slate-700">No {label} Found</h3>
      <p className="text-xs text-slate-400 max-w-xs mt-1">
        You haven't created any {label.toLowerCase()} in this workspace yet. Create one to get started.
      </p>
      <button
        type="button"
        onClick={() => navigate(actionPath)}
        className="mt-4 flex items-center gap-1 bg-slate-950 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition"
      >
        <Plus size={13} />
        {btnText}
      </button>
    </div>
  );
}
