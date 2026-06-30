import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/app-layout";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EyeIcon from "@mui/icons-material/Visibility";
import ShareIcon from "@mui/icons-material/Share";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";
import BarChartIcon from "@mui/icons-material/BarChart";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckIcon from "@mui/icons-material/Check";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PeopleIcon from "@mui/icons-material/People";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
} from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LOCATION_COLORS = ["#14b8a6", "#f97316", "#3b82f6", "#a855f7", "#94a3b8"];

interface FormSummary {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  field_count: number;
  response_count: number;
  sparkData: number[];
}

function Sparkline({ data, color = "#14b8a6" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const w = 120, h = 36;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const px = (i: number) => (i / (data.length - 1)) * w;
  const py = (v: number) => h - ((v - min) / range) * (h - 6) - 3;
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  const area = data.map((v, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ") + `L${px(data.length - 1).toFixed(1)},${h}L0,${h}Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={`spk-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spk-${color.replace("#", "")})`} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Forms() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dailyBuckets, setDailyBuckets] = useState<{ date: string; responses: number }[]>([]);
  const [locationData, setLocationData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login", { replace: true }); return; }

      const formResult = await supabase
        .from("forms")
        .select("id, title, description, status, created_at, created_by")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      const formRows = formResult.data;

      if (!formRows) { setLoading(false); return; }

      const formIds = formRows.map((f) => f.id);

      const { data: allDates } = formIds.length
        ? await supabase.from("form_responses").select("submitted_at").in("form_id", formIds)
        : { data: [] };

      const now = new Date();
      const bucket: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        bucket[d.toISOString().slice(0, 10)] = 0;
      }
      (allDates || []).forEach((r: { submitted_at: string }) => {
        const day = r.submitted_at.slice(0, 10);
        if (day in bucket) bucket[day]++;
      });
      setDailyBuckets(
        Object.entries(bucket).map(([date, count]) => ({ date: date.slice(5), responses: count }))
      );

      const { data: locations } = formIds.length
        ? await supabase.from("form_responses").select("location").in("form_id", formIds).not("location", "is", null)
        : { data: [] };

      const locMap: Record<string, number> = {};
      (locations || []).forEach((r: { location: string }) => {
        locMap[r.location] = (locMap[r.location] || 0) + 1;
      });
      const sorted = Object.entries(locMap).sort((a, b) => b[1] - a[1]);
      const total = sorted.reduce((s, [, c]) => s + c, 0);
      const top = sorted.slice(0, 3);
      const others = sorted.slice(3).reduce((s, [, c]) => s + c, 0);
      setLocationData([
        ...top.map(([name, count]) => ({
          name,
          value: Math.round((count / total) * 100),
        })),
        ...(others > 0 ? [{ name: "Others", value: Math.round((others / total) * 100) }] : []),
      ]);

      const formsWithCounts = await Promise.all(
        formRows.map(async (f) => {
          const [{ count: fieldCount }, { count: responseCount }, { data: dates }] = await Promise.all([
            supabase.from("form_fields").select("*", { count: "exact", head: true }).eq("form_id", f.id),
            supabase.from("form_responses").select("*", { count: "exact", head: true }).eq("form_id", f.id),
            supabase.from("form_responses").select("submitted_at").eq("form_id", f.id).order("submitted_at"),
          ]);

          const bucket: Record<string, number> = {};
          const refDate = new Date();
          for (let i = 6; i >= 0; i--) {
            const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
            bucket[`${MONTHS[d.getMonth()]} ${d.getFullYear()}`] = 0;
          }
          (dates || []).forEach((r: { submitted_at: string }) => {
            const d = new Date(r.submitted_at);
            const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
            if (key in bucket) bucket[key]++;
          });

          return {
            id: f.id, title: f.title, description: f.description,
            status: f.status, created_at: f.created_at,
            field_count: fieldCount ?? 0, response_count: responseCount ?? 0,
            sparkData: Object.values(bucket),
          };
        })
      );

      setForms(formsWithCounts);
      setLoading(false);
    })();
  }, [navigate]);

  const filtered = useMemo(() => {
    let result = [...forms];
    if (search) {
      result = result.filter((f) =>
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((f) => f.status === statusFilter);
    }
    if (dateFilter === "week") {
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      result = result.filter((f) => new Date(f.created_at) >= weekAgo);
    } else if (dateFilter === "month") {
      const monthAgo = new Date(Date.now() - 30 * 86400000);
      result = result.filter((f) => new Date(f.created_at) >= monthAgo);
    }
    return result;
  }, [forms, search, statusFilter, dateFilter]);

  const handleCopyLink = async (formId: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/form/${formId}`);
    setCopiedId(formId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (formId: string) => {
    if (!confirm("Are you sure you want to delete this form? All responses and fields will be permanently removed.")) return;
    const { error } = await supabase.from("forms").delete().eq("id", formId);
    if (!error) setForms((prev) => prev.filter((f) => f.id !== formId));
  };

  const totalResponses = forms.reduce((s, f) => s + f.response_count, 0);

  if (loading) {
    return (
      <Box sx={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AppLayout>
      <Box sx={{ display: "flex", gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Toolbar */}
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: "center", flexWrap: "wrap", mb: 2 }}
          >
            <TextField
              placeholder="Search forms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 200, maxWidth: 280 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="small"
              sx={{ minWidth: 140, borderRadius: 2, fontSize: "0.8125rem" }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>

            <Select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              size="small"
              sx={{ minWidth: 130, borderRadius: 2, fontSize: "0.8125rem" }}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
            </Select>

            <Typography variant="caption" sx={{ color: "text.disabled", ml: "auto" }}>
              {filtered.length} form{filtered.length !== 1 ? "s" : ""}
            </Typography>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/builder")}
            >
              New Form
            </Button>

            <IconButton size="small">
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Stack>

          {/* Form list */}
          {filtered.length === 0 ? (
            <Card sx={{ py: 10, textAlign: "center" }}>
              <CardContent>
                <AssignmentIcon sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  No forms yet
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                  {search || statusFilter !== "all" || dateFilter !== "all"
                    ? "No forms match your filters."
                    : "Create your first form to start collecting data."}
                </Typography>
                {!search && statusFilter === "all" && dateFilter === "all" && (
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/builder")}>
                    Create Form
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Stack spacing={2}>
              {filtered.map((form, idx) => {
                const colors = ["#14b8a6", "#f97316", "#3b82f6", "#8b5cf6"];
                const color = colors[idx % colors.length];
                return (
                  <Card key={form.id} sx={{ "&:hover": { boxShadow: 6 } }}>
                    <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            <Box
                              sx={{
                                width: 32, height: 32, borderRadius: 1.5, display: "flex",
                                alignItems: "center", justifyContent: "center",
                                bgcolor: "action.hover", color: "text.secondary", flexShrink: 0,
                              }}
                            >
                              <AssignmentIcon sx={{ fontSize: 16 }} />
                            </Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {form.title}
                            </Typography>
                            <Chip
                              label={form.status}
                              size="small"
                              color={form.status === "published" ? "primary" : "default"}
                              variant={form.status === "published" ? "filled" : "outlined"}
                              sx={{
                                height: 20, fontSize: "0.625rem", fontWeight: 600,
                                textTransform: "uppercase", letterSpacing: "0.05em",
                              }}
                            />
                          </Stack>
                          {form.description && (
                            <Typography variant="body2" sx={{ mt: 1.5, ml: 5, color: "text.secondary" }}>
                              {form.description}
                            </Typography>
                          )}
                          <Stack direction="row" spacing={2} sx={{ mt: 2, ml: 5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <BarChartIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                {form.field_count} field{form.field_count !== 1 ? "s" : ""}
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <ChatBubbleIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                {form.response_count} response{form.response_count !== 1 ? "s" : ""}
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <CalendarTodayIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                {new Date(form.created_at).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                        <Sparkline data={form.sparkData} color={color} />
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Stack direction="row" spacing={0.5}>
                          <Button
                            size="small"
                            startIcon={<EyeIcon fontSize="small" />}
                            onClick={() => navigate(`/forms/${form.id}/responses`)}
                            sx={{ fontSize: "0.75rem", fontWeight: 600 }}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            startIcon={copiedId === form.id ? <CheckIcon fontSize="small" sx={{ color: "primary.main" }} /> : <ShareIcon fontSize="small" />}
                            onClick={() => handleCopyLink(form.id)}
                            sx={{ fontSize: "0.75rem", fontWeight: 600, color: "text.secondary" }}
                          >
                            {copiedId === form.id ? "Copied" : "Share"}
                          </Button>
                          <IconButton size="small" onClick={() => handleDelete(form.id)} sx={{ color: "text.disabled" }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                        {form.response_count > 0 && (
                          <Button
                            size="small"
                            onClick={() => navigate(`/forms/${form.id}/responses`)}
                            sx={{ fontSize: "0.75rem", fontWeight: 600 }}
                          >
                            View all {form.response_count} response{form.response_count !== 1 ? "s" : ""}
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Box>

        {/* Right analytics panel */}
        <Box sx={{ display: { xs: "none", xl: "flex" }, width: 280, flexShrink: 0, flexDirection: "column", gap: 2 }}>
          <Card>
            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
              <Typography variant="overline" sx={{ mb: 2, display: "block" }}>
                Responses by Location
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 96, height: 96, flexShrink: 0, animation: "chart-fade-in 0.5s ease-out both" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={locationData}
                        cx="50%" cy="50%"
                        innerRadius={22} outerRadius={36}
                        dataKey="value"
                        stroke="none"
                        animationBegin={0}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      >
                        {locationData.map((_, i) => (
                          <Cell key={i} fill={LOCATION_COLORS[i % LOCATION_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ flex: 1 }}>
                  {locationData.map((loc, i) => (
                    <Box key={loc.name} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: LOCATION_COLORS[i], flexShrink: 0 }} />
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>{loc.name}</Typography>
                      <Typography variant="caption" sx={{ ml: "auto", fontWeight: 700 }}>{loc.value}%</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
              <Typography variant="overline" sx={{ mb: 2, display: "block" }}>
                Response Growth (Last 30 Days)
              </Typography>
              <Box sx={{ height: 110, animation: "chart-fade-in 0.6s ease-out 0.1s both" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyBuckets} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#64748b" }} interval={4} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#64748b" }} />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: 8, border: "1px solid #334155",
                        backgroundColor: "#0f172a", fontSize: 11, color: "#e2e8f0",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="responses"
                      stroke="#14b8a6"
                      strokeWidth={2}
                      fill="url(#growthGrad)"
                      animationBegin={150}
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          <Stack spacing={1.5}>
            <Card sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}>
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AssignmentIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Total Forms</Typography>
                </Box>
                <Typography variant="h5" sx={{ mt: 1, fontWeight: 800 }}>{forms.length}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ bgcolor: "secondary.main", color: "#ffffff" }}>
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ChatBubbleIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Total Responses</Typography>
                </Box>
                <Typography variant="h5" sx={{ mt: 1, fontWeight: 800 }}>{totalResponses.toLocaleString()}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ bgcolor: "grey.800", color: "#ffffff" }}>
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TrendingUpIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Active Beneficiaries</Typography>
                </Box>
                <Typography variant="h5" sx={{ mt: 1, fontWeight: 800 }}>112</Typography>
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Box>
    </AppLayout>
  );
}
