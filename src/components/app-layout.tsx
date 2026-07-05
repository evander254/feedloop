import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useRealtimeSubscription } from "@/lib/realtime";
import { useThemeMode } from "@/lib/ThemeContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  Folder,
  ClipboardList,
  FileText,
  Vote,
  Users,
  BarChart3,
  Download,
  CreditCard,
  Sun,
  Moon,
  Bell,
  Search,
  LogOut,
  User,
  Settings,
  BellOff,
  X,
} from "lucide-react";
import logoSrc from "@/assets/loop.png";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  entity_type: string | null;
  entity_id: string | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function notifIcon(entity_type: string | null) {
  switch (entity_type) {
    case "form": return <ClipboardList size={16} />;
    case "survey": return <FileText size={16} />;
    case "poll": return <Vote size={16} />;
    default: return <Bell size={16} />;
  }
}

function notifColor(entity_type: string | null): string {
  switch (entity_type) {
    case "form": return "bg-emerald-500";
    case "survey": return "bg-teal-500";
    case "poll": return "bg-green-500";
    default: return "bg-emerald-400";
  }
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Organizations", icon: Building2, path: "/organizations" },
  { label: "Projects", icon: Folder, path: "#" },
  { label: "Forms", icon: ClipboardList, path: "/forms" },
  { label: "Surveys", icon: FileText, path: "/surveys" },
  { label: "Polls", icon: Vote, path: "/polls" },
  { label: "Beneficiaries", icon: Users, path: "#" },
  { label: "Analytics", icon: BarChart3, path: "#" },
  { label: "Exports", icon: Download, path: "#" },
  { label: "Subscriptions", icon: CreditCard, path: "#" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleMode } = useThemeMode();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [userInitials, setUserInitials] = useState("U");
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifTab, setNotifTab] = useState<"all" | "unread" | "archived">("all");

  const fetchNotifications = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("notifications")
      .select("id, title, message, is_read, created_at, entity_type, entity_id")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || "");
        supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              email: user.email,
              full_name: (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || null,
            },
            { onConflict: "id" }
          )
          .then(() => {
            supabase
              .from("profiles")
              .select("full_name")
              .eq("id", user.id)
              .maybeSingle()
              .then(({ data: profile }) => {
                const name = profile?.full_name || user.email?.split("@")[0] || "User";
                setUserFullName(name);
                const parts = name.split(" ");
                setUserInitials(
                  parts.length > 1
                    ? (parts[0][0] + parts[1][0]).toUpperCase()
                    : name.slice(0, 2).toUpperCase()
                );
              });
          });
        fetchNotifications(user.id);
      }
    });
  }, [fetchNotifications]);

  useRealtimeSubscription("notifications", () => {
    if (userId) fetchNotifications(userId);
  }, [userId, fetchNotifications], `user_id=eq.${userId}`);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotifClick = (n: Notification) => {
    setNotifOpen(false);
    if (!n.is_read) markAsRead(n.id);
    if (n.entity_type === "form" && n.entity_id) navigate(`/forms/${n.entity_id}/responses`);
    else if (n.entity_type === "survey" && n.entity_id) navigate(`/surveys/${n.entity_id}/responses`);
    else if (n.entity_type === "poll" && n.entity_id) navigate(`/polls/${n.entity_id}/results`);
  };

  const markAsRead = async (notifId: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", notifId);
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    if (!userId) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await supabase.auth.signOut();
    navigate("/login");
  };

  const filteredNotifs = notifTab === "all"
    ? notifications
    : notifTab === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications.filter((n) => n.is_read);

  /* ── Global Theme Background ────────────────────── */
  function ThemeBackground() {
    return (
      <>
        <style>{`
          @keyframes organicFloat1 {
            0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg) scale(1); }
            25% { transform: translateY(-20px) translateX(8px) rotate(12deg) scale(1.05); }
            50% { transform: translateY(-8px) translateX(-5px) rotate(-6deg) scale(0.97); }
            75% { transform: translateY(-25px) translateX(3px) rotate(8deg) scale(1.02); }
          }
          @keyframes organicFloat2 {
            0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
            33% { transform: translateY(18px) translateX(-10px) rotate(-10deg); }
            66% { transform: translateY(-12px) translateX(6px) rotate(7deg); }
          }
          @keyframes organicFloat3 {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-18px) scale(1.08); }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.15; }
            50% { opacity: 0.3; }
          }
          .animate-organic-1 { animation: organicFloat1 10s ease-in-out infinite; }
          .animate-organic-2 { animation: organicFloat2 12s ease-in-out infinite; }
          .animate-organic-3 { animation: organicFloat3 8s ease-in-out infinite; }
          .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        `}</style>
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
          <div className="absolute -top-[10%] -left-[5%] w-[340px] h-[340px] opacity-30 blur-[60px] animate-organic-1">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <radialGradient id="blob1" cx="40%" cy="40%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="60%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                </radialGradient>
              </defs>
              <path d="M45,-55C58,-45,70,-30,75,-12C80,6,78,27,68,43C58,59,40,70,22,76C4,82,-14,83,-30,76C-46,69,-60,54,-70,37C-80,20,-86,0,-82,-18C-78,-36,-64,-52,-48,-60C-32,-68,-14,-68,2,-70C18,-72,32,-65,45,-55Z" fill="url(#blob1)" transform="translate(100,100)" />
            </svg>
          </div>

          <div className="absolute top-[8%] right-[5%] w-48 h-48 sm:w-64 sm:h-64 opacity-20 animate-organic-2">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#5eead4" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r="60" stroke="url(#ringGrad)" strokeWidth="14" fill="none" opacity="0.7" />
              <circle cx="100" cy="100" r="40" stroke="url(#ringGrad)" strokeWidth="4" fill="none" opacity="0.3" />
            </svg>
          </div>

          <div className="absolute bottom-[15%] left-[3%] w-40 h-40 sm:w-56 sm:h-56 opacity-20 blur-[2px] animate-organic-3">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#86efac" />
                  <stop offset="50%" stopColor="#4ade80" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
              </defs>
              <path d="M100,20 C140,20 180,60 180,100 C180,150 140,180 100,180 C60,180 20,150 20,100 C20,60 60,20 100,20 Z" fill="url(#leafGrad)" opacity="0.6" />
              <path d="M100,40 Q120,80 100,160" stroke="white" strokeWidth="2" fill="none" opacity="0.4" />
              <path d="M100,70 Q130,80 150,60" stroke="white" strokeWidth="1.5" fill="none" opacity="0.3" />
              <path d="M100,100 Q70,110 50,90" stroke="white" strokeWidth="1.5" fill="none" opacity="0.3" />
            </svg>
          </div>

          <div className="absolute top-[45%] right-[2%] w-28 h-28 sm:w-36 sm:h-36 opacity-15 animate-organic-1" style={{ animationDelay: "2s" }}>
            <svg viewBox="0 0 100 130" className="w-full h-full">
              <defs>
                <linearGradient id="dropGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6ee7b7" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              <path d="M50,10 C50,10 85,55 85,80 C85,100 69,115 50,115 C31,115 15,100 15,80 C15,55 50,10 50,10 Z" fill="url(#dropGrad)" />
              <ellipse cx="38" cy="70" rx="8" ry="12" fill="white" opacity="0.25" transform="rotate(-15 38 70)" />
            </svg>
          </div>

          <div className="absolute top-[60%] left-[20%] w-3 h-3 rounded-full bg-emerald-400 opacity-40 animate-pulse-glow" />
          <div className="absolute top-[30%] left-[45%] w-2 h-2 rounded-full bg-teal-400 opacity-30 animate-pulse-glow" style={{ animationDelay: "1s" }} />
          <div className="absolute top-[75%] right-[25%] w-4 h-4 rounded-full bg-green-300 opacity-25 animate-pulse-glow" style={{ animationDelay: "2s" }} />
          <div className="absolute top-[15%] left-[35%] w-2.5 h-2.5 rounded-full bg-emerald-300 opacity-35 animate-pulse-glow" style={{ animationDelay: "3s" }} />
          <div className="absolute bottom-[25%] right-[40%] w-2 h-2 rounded-full bg-teal-300 opacity-30 animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
        </div>
      </>
    );
  }

  /* ── Header ────────────────────────────────────── */
  function Header() {
    return (
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-emerald-200/30 bg-white/40 backdrop-blur-xl px-4 py-2.5 lg:px-6">
        {/* Logo — always visible */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/dashboard")}>
          <img src={logoSrc} alt="FeedLoop Logo" className="h-7 w-auto object-contain" />
          <span className="text-sm font-black tracking-tight text-emerald-900">FeedLoop</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <label className="hidden items-center gap-2 rounded-xl border border-emerald-200/30 bg-white/30 backdrop-blur-sm px-3 py-1.5 transition-colors focus-within:border-emerald-400 focus-within:bg-white/50 md:flex">
            <Search size={14} className="text-emerald-600/50" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search..."
              className="w-40 bg-transparent text-xs text-emerald-900 outline-none placeholder:text-emerald-600/30"
            />
          </label>

          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={toggleMode}
            title={mode === "dark" ? "Light mode" : "Dark mode"}
            className="flex size-9 items-center justify-center rounded-xl text-emerald-700/50 transition-colors hover:bg-white/50 hover:text-emerald-700"
          >
            {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => { setNotifOpen(!notifOpen); setNotifTab("all"); setProfileOpen(false); }}
              className="relative flex size-9 items-center justify-center rounded-xl text-emerald-700/50 transition-colors hover:bg-white/50 hover:text-emerald-700"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white shadow-sm shadow-emerald-500/30">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-50 mt-2 w-[380px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-emerald-200/40 bg-white/80 backdrop-blur-2xl shadow-2xl shadow-emerald-900/15"
                >
                  <div className="flex items-center justify-between border-b border-emerald-100/60 px-5 py-3 bg-emerald-50/30">
                    <span className="text-sm font-bold text-emerald-950">Notifications</span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button type="button" onClick={markAllRead} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
                          Mark all read
                        </button>
                      )}
                      <button type="button" className="rounded-lg p-1 text-emerald-600/60 transition-colors hover:bg-emerald-100/50 hover:text-emerald-700">
                        <Settings size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-1 border-b border-emerald-100/60 px-5 py-2 bg-emerald-50/20">
                    {(["all", "unread", "archived"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setNotifTab(tab)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all",
                          notifTab === tab
                            ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                            : "text-emerald-700/60 hover:bg-emerald-100/50 hover:text-emerald-800"
                        )}
                      >
                        {tab}
                        {tab === "unread" && unreadCount > 0 && (
                          <span className={cn(
                            "ml-1.5 inline-flex size-4 items-center justify-center rounded-full text-[9px] font-bold",
                            notifTab === tab ? "bg-white/25 text-white" : "bg-emerald-500 text-white"
                          )}>
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="max-h-[400px] overflow-y-auto">
                    {filteredNotifs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <BellOff size={32} className="text-emerald-300" />
                        <p className="mt-3 text-sm font-semibold text-emerald-700">All caught up!</p>
                        <p className="mt-0.5 text-xs text-emerald-500/60">No new notifications</p>
                      </div>
                    ) : (
                      filteredNotifs.map((n) => {
                        const isUnread = !n.is_read;
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => handleNotifClick(n)}
                            className={cn(
                              "flex w-full gap-3 border-b border-emerald-100/40 px-5 py-3.5 text-left transition-all hover:bg-emerald-50/60",
                              isUnread && "bg-emerald-50/50"
                            )}
                          >
                            <div className="relative shrink-0">
                              <div className={cn("flex size-9 items-center justify-center rounded-full text-white shadow-sm", notifColor(n.entity_type))}>
                                {notifIcon(n.entity_type)}
                              </div>
                              {isUnread && (
                                <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={cn("text-xs leading-relaxed", isUnread ? "font-bold text-emerald-950" : "font-medium text-emerald-800")}>
                                <span className="font-bold">{n.title}</span>
                                {n.message && <span className="text-emerald-600/60"> — {n.message}</span>}
                              </p>
                              <p className="mt-0.5 text-[10px] text-emerald-500/50">{timeAgo(n.created_at)}</p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-emerald-100/60 px-5 py-2.5 bg-emerald-50/20">
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="w-full rounded-lg py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100/50 hover:text-emerald-800"
                    >
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile + Nav Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
              className="flex size-9 items-center justify-center rounded-xl transition-all hover:ring-2 hover:ring-emerald-300/40"
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] font-bold text-white shadow-md shadow-emerald-500/20">
                {userInitials}
              </div>
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-emerald-200/40 bg-white/80 backdrop-blur-2xl shadow-2xl shadow-emerald-900/15"
                >
                  {/* User Info */}
                  <div className="border-b border-emerald-100/60 px-4 py-3 bg-emerald-50/30">
                    <p className="text-sm font-bold text-emerald-950">{userFullName}</p>
                    <p className="text-xs text-emerald-600/60">{userEmail}</p>
                  </div>

                  {/* Navigation Links */}
                  <div className="p-1.5 border-b border-emerald-100/40">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            if (item.path !== "#") {
                              navigate(item.path);
                              setProfileOpen(false);
                            }
                          }}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-all",
                            isActive
                              ? "bg-emerald-100/60 text-emerald-950 font-semibold"
                              : "text-emerald-700/70 hover:bg-emerald-50/60 hover:text-emerald-950"
                          )}
                        >
                          <Icon size={15} className={cn(isActive ? "text-emerald-600" : "text-emerald-500/50")} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Account Actions */}
                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); navigate("/profile"); }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-emerald-800 transition-all hover:bg-emerald-50/60 hover:text-emerald-950"
                    >
                      <User size={16} className="text-emerald-500" />
                      View Profile
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50/60 hover:text-red-700"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-br from-[#ecfdf5] via-[#d1fae5] to-[#f0fdf4] relative overflow-hidden">
      <ThemeBackground />
      <Header />
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 lg:px-6 lg:py-5 relative z-10">
        {children}
      </main>
    </div>
  );
}
