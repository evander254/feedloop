import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useThemeMode } from "@/lib/ThemeContext";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import logoSrc from "@/assets/loop.png";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BusinessIcon from "@mui/icons-material/Business";
import FolderIcon from "@mui/icons-material/Folder";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DescriptionIcon from "@mui/icons-material/Description";
import PollIcon from "@mui/icons-material/Poll";
import PeopleIcon from "@mui/icons-material/People";
import BarChartIcon from "@mui/icons-material/BarChart";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  entity_type: string | null;
  entity_id: string | null;
}

const navItems = [
  { label: "Dashboard", icon: DashboardIcon, path: "/dashboard" },
  { label: "Organizations", icon: BusinessIcon, path: "/organizations" },
  { label: "Projects", icon: FolderIcon, path: "#" },
  { label: "Forms", icon: AssignmentIcon, path: "/forms" },
  { label: "Surveys", icon: DescriptionIcon, path: "/surveys" },
  { label: "Polls", icon: PollIcon, path: "/polls" },
  { label: "Beneficiaries", icon: PeopleIcon, path: "#" },
  { label: "Analytics", icon: BarChartIcon, path: "#" },
  { label: "Exports", icon: FileDownloadIcon, path: "#" },
  { label: "Subscriptions", icon: AccountBalanceWalletIcon, path: "#" },
];

const DRAWER_WIDTH = 240;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleMode } = useThemeMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [userInitials, setUserInitials] = useState("U");
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => fetchNotifications(userId), 15000);
    return () => clearInterval(interval);
  }, [userId, fetchNotifications]);

  const handleNotifClick = (n: Notification) => {
    setNotifAnchor(null);
    if (!n.is_read) markAsRead(n.id);
    if (n.entity_type === "form" && n.entity_id) {
      navigate(`/forms/${n.entity_id}/responses`);
    } else if (n.entity_type === "survey" && n.entity_id) {
      navigate(`/surveys/${n.entity_id}/responses`);
    } else if (n.entity_type === "poll" && n.entity_id) {
      navigate(`/polls/${n.entity_id}/results`);
    }
  };

  const markAsRead = async (notifId: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", notifId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    if (!userId) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleLogout = async () => {
    setProfileAnchor(null);
    await supabase.auth.signOut();
    navigate("/login");
  };

  const navContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ px: 2.5, pt: 3, pb: 3 }}>
        <Box
          component="img"
          src={logoSrc}
          alt="FeedLoop"
          sx={{ height: 32, width: "auto", display: "block" }}
        />
      </Box>

      <List sx={{ flex: 1, px: 1, py: 0 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
              <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => {
                  if (item.path !== "#") {
                    navigate(item.path);
                    setMobileOpen(false);
                  }
                }}
                sx={{
                  borderRadius: 2,
                  py: 1.25,
                  "& .MuiListItemIcon-root": { minWidth: 36 },
                  "& .MuiListItemText-primary": { fontSize: "0.875rem", fontWeight: 500 },
                }}
              >
                <ListItemIcon>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ mx: 1.5, mb: 2, p: 2, borderRadius: 3, bgcolor: "action.hover" }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary" }}>
          Upgrade
        </Typography>
        <Typography variant="caption" sx={{ display: "block", mt: 0.25, color: "text.secondary", lineHeight: 1.4 }}>
          Stripe &amp; M-Pesa billing for growing teams.
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", lg: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
        }}
      >
        {navContent}
      </Drawer>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
        }}
      >
        {navContent}
      </Drawer>

      <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <Box
          component="header"
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 1.5,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: mode === "dark" ? "rgba(13,17,31,0.85)" : "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
          }}
        >
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ display: { lg: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: "auto" }}>
            <Box
              component="label"
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
                bgcolor: mode === "dark" ? "rgba(255,255,255,0.04)" : "action.hover",
                "&:focus-within": { borderColor: "primary.main" },
              }}
            >
              <SearchIcon sx={{ fontSize: 16, color: "text.disabled" }} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search..."
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "0.8125rem",
                  width: 160,
                  color: "inherit",
                  fontFamily: "inherit",
                }}
              />
            </Box>

            <Tooltip title={mode === "dark" ? "Light mode" : "Dark mode"}>
              <IconButton onClick={toggleMode} size="small">
                {mode === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Notifications">
              <IconButton size="small" onClick={(e) => setNotifAnchor(e.currentTarget)}>
                <Badge badgeContent={unreadCount > 9 ? "9+" : unreadCount} color="primary">
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={notifAnchor}
              open={Boolean(notifAnchor)}
              onClose={() => setNotifAnchor(null)}
              slotProps={{
                paper: {
                  sx: {
                    width: 320,
                    maxHeight: 360,
                    mt: 1,
                    borderRadius: 3,
                  },
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5 }}>
                <Typography variant="subtitle2">Notifications</Typography>
                {unreadCount > 0 && (
                  <Typography
                    variant="caption"
                    onClick={markAllRead}
                    sx={{ color: "primary.main", fontWeight: 600, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                  >
                    Mark all read
                  </Typography>
                )}
              </Box>
              <Divider />
              {notifications.length === 0 ? (
                <Typography variant="body2" sx={{ textAlign: "center", py: 4, color: "text.disabled" }}>
                  No notifications yet
                </Typography>
              ) : (
                notifications.map((n) => (
                  <MenuItem
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    sx={{
                      whiteSpace: "normal",
                      py: 1.5,
                      px: 2,
                      bgcolor: !n.is_read ? "action.selected" : "transparent",
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {n.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25 }}>
                        {n.message}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.disabled", mt: 0.25, display: "block" }}>
                        {new Date(n.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
            </Menu>

            <Tooltip title="Profile">
              <IconButton size="small" onClick={(e) => setProfileAnchor(e.currentTarget)}>
                <Avatar sx={{ width: 28, height: 28, fontSize: 11, fontWeight: 700, bgcolor: "primary.main" }}>
                  {userInitials}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={profileAnchor}
              open={Boolean(profileAnchor)}
              onClose={() => setProfileAnchor(null)}
              slotProps={{
                paper: { sx: { width: 220, mt: 1, borderRadius: 3 } },
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider", mb: 0.5 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {userFullName}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {userEmail}
                </Typography>
              </Box>
              <MenuItem onClick={() => { setProfileAnchor(null); navigate("/profile"); }} sx={{ borderRadius: 2, mx: 0.5 }}>
                <PersonIcon fontSize="small" sx={{ mr: 1.5 }} />
                View Profile
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ borderRadius: 2, mx: 0.5, color: "error.main" }}>
                <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                Sign out
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        <Box component="main" sx={{ flex: 1, overflow: "auto", px: 4, py: 4 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
