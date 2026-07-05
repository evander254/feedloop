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
  Menu,
  LogOut,
  User,
  ChevronLeft,
  Settings,
  BellOff,
  X,
  Check,
  Plus,
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
    case "survey": return "bg-blue-500";
    case "poll": return "bg-purple-500";
    default: return "bg-slate-400";
  }
}

function notifTextColor(entity_type: string | null): string {
  switch (entity_type) {
    case "form": return "text-emerald-600";
    case "survey": return "text-blue-600";
    case "poll": return "text-purple-600";
    default: return "text-slate-600";
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

const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH = 240;

export default function AppLayout({ children, noSidebar }: { children: React.ReactNode; noSidebar?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleMode } = useThemeMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const drawerWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
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

  /* ── Sidebar Nav Content ──────────────────────── */
  function NavContent({ dense, isMobile = false }: { dense: boolean; isMobile?: boolean }) {
    return (
      <div className="flex h-full flex-col" style={{ width: isMobile ? EXPANDED_WIDTH : (dense ? COLLAPSED_WIDTH : EXPANDED_WIDTH) }}>
        {/* Logo */}
        <div className={cn("flex pt-6 pb-4", dense && !isMobile ? "justify-center px-2" : "justify-start px-5")}>
          {dense && !isMobile ? (
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-sm font-extrabold text-white">
              F
            </div>
          ) : (
            <img src={logoSrc} alt="FeedLoop" className="h-7 w-auto object-contain" />
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-1 px-2 py-2">
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
                    setMobileOpen(false);
                  }
                }}
                title={dense && !isMobile ? item.label : undefined}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150",
                  dense && !isMobile ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon size={18} className={cn(isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
                {!dense || isMobile ? <span>{item.label}</span> : null}
              </button>
            );
          })}
        </nav>

        {/* Upgrade Banner */}
        {!dense || isMobile ? (
          <div className="mx-3 mb-3 rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-bold text-slate-900">Upgrade</p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
              Stripe &amp; M-Pesa billing for growing teams.
            </p>
          </div>
        ) : null}

        {/* Collapse Toggle */}
        {!isMobile && (
          <div className="flex justify-center py-2">
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <ChevronLeft size={16} className={cn("transition-transform duration-300", collapsed && "rotate-180")} />
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Header ────────────────────────────────────── */
  function Header() {
    return (
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-2.5 backdrop-blur-xl lg:px-5">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <label className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 transition-colors focus-within:border-emerald-400 focus-within:bg-white md:flex">
            <Search size={14} className="text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search..."
              className="w-40 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>

          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={toggleMode}
            title={mode === "dark" ? "Light mode" : "Dark mode"}
            className="flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => { setNotifOpen(!notifOpen); setNotifTab("all"); setProfileOpen(false); }}
              className="relative flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
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
                  className="absolute right-0 top-full z-50 mt-2 w-[380px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                    <span className="text-sm font-bold text-slate-900">Notifications</span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button type="button" onClick={markAllRead} className="text-xs font-semibold text-emerald-600 hover:underline">
                          Mark all read
                        </button>
                      )}
                      <button type="button" className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                        <Settings size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1 border-b border-slate-100 px-5 py-2">
                    {(["all", "unread", "archived"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setNotifTab(tab)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all",
                          notifTab === tab
                            ? "bg-slate-900 text-white"
                            : "text-slate-500 hover:bg-slate-100"
                        )}
                      >
                        {tab}
                        {tab === "unread" && unreadCount > 0 && (
                          <span className={cn(
                            "ml-1.5 inline-flex size-4 items-center justify-center rounded-full text-[9px] font-bold",
                            notifTab === tab ? "bg-white/20 text-white" : "bg-emerald-500 text-white"
                          )}>
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* List */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {filteredNotifs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <BellOff size={32} className="text-slate-300" />
                        <p className="mt-3 text-sm font-semibold text-slate-500">All caught up!</p>
                        <p className="mt-0.5 text-xs text-slate-400">No new notifications</p>
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
                              "flex w-full gap-3 border-b border-slate-50 px-5 py-3.5 text-left transition-colors hover:bg-slate-50",
                              isUnread && "bg-emerald-50/30"
                            )}
                          >
                            <div className="relative shrink-0">
                              <div className={cn("flex size-9 items-center justify-center rounded-full text-white", notifColor(n.entity_type))}>
                                {notifIcon(n.entity_type)}
                              </div>
                              {isUnread && (
                                <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-white bg-blue-500" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={cn("text-xs leading-relaxed", isUnread ? "font-semibold text-slate-900" : "text-slate-700")}>
                                <span className="font-bold">{n.title}</span>
                                {n.message && <span className="text-slate-500"> — {n.message}</span>}
                              </p>
                              <p className="mt-0.5 text-[10px] text-slate-400">{timeAgo(n.created_at)}</p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-slate-100 px-5 py-2.5">
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="w-full rounded-lg py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                    >
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
              className="flex size-9 items-center justify-center rounded-lg transition-all hover:ring-2 hover:ring-slate-200"
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
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
                  className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10"
                >
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{userFullName}</p>
                    <p className="text-xs text-slate-500">{userEmail}</p>
                  </div>
                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); navigate("/profile"); }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      <User size={16} className="text-slate-400" />
                      View Profile
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
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

  /* ── noSidebar mode ────────────────────────────── */
  if (noSidebar) {
    return (
      <div className="flex min-h-dvh flex-col bg-slate-50/50">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 lg:px-6 lg:py-5">
          {children}
        </main>
      </div>
    );
  }

  /* ── Full sidebar layout ──────────────────────── */
  return (
    <div className="flex min-h-dvh bg-slate-50/50">
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white lg:transition-all lg:duration-300"
        style={{ width: drawerWidth }}
      >
        <NavContent dense={collapsed} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -EXPANDED_WIDTH }}
              animate={{ x: 0 }}
              exit={{ x: -EXPANDED_WIDTH }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-[240px] border-r border-slate-200 bg-white lg:hidden"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
              <NavContent dense={false} isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[var(--sidebar-w)]" style={{ "--sidebar-w": `${drawerWidth}px` } as React.CSSProperties}>
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 lg:px-6 lg:py-5">
          {children}
        </main>
      </div>
    </div>
  );
}
