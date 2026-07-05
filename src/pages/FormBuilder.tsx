import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/app-layout";
import {
  Plus, Trash2, GripVertical, Type, AlignLeft, Hash, Mail, List, CheckSquare,
  Circle, Star, Copy, Check, Loader2, Share2, Send, Clock, Calendar, FileText,
  Eye, Smartphone, Monitor, Settings, Globe, Lock, Bell, MessageSquare,
  Link, CreditCard, Layout, Webhook, Search, ChevronDown, ChevronUp,
  Phone, CalendarDays, Upload, PenLine, PanelRightOpen, PanelRightClose,
  Save,
} from "lucide-react";
import { sanitize, sanitizeObject } from "@/lib/sanitize";

/* ── Types ──────────────────────────────────────────── */

type FieldType =
  | "text" | "textarea" | "number" | "email" | "phone" | "select"
  | "checkbox" | "radio" | "date" | "rating" | "file_upload" | "signature";

interface Field {
  id: string; field_label: string; field_type: FieldType;
  placeholder: string; options: string[]; is_required: boolean; sort_order: number;
}

interface FieldMeta { type: FieldType; label: string; icon: typeof Type; category: string; }

const FIELD_META: FieldMeta[] = [
  { type: "text", label: "Short Text", icon: Type, category: "text" },
  { type: "textarea", label: "Long Text", icon: AlignLeft, category: "text" },
  { type: "email", label: "Email", icon: Mail, category: "text" },
  { type: "number", label: "Number", icon: Hash, category: "text" },
  { type: "phone", label: "Phone", icon: Phone, category: "text" },
  { type: "select", label: "Dropdown", icon: List, category: "choice" },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare, category: "choice" },
  { type: "radio", label: "Radio", icon: Circle, category: "choice" },
  { type: "date", label: "Date", icon: CalendarDays, category: "text" },
  { type: "rating", label: "Rating", icon: Star, category: "choice" },
  { type: "file_upload", label: "File Upload", icon: Upload, category: "advanced" },
  { type: "signature", label: "Signature", icon: PenLine, category: "advanced" },
];

const CHOICE_TYPES = new Set(["select", "checkbox", "radio"]);

let fieldCounter = 0;
function createField(type: FieldType = "text"): Field {
  fieldCounter++;
  return {
    id: `field_${Date.now()}_${fieldCounter}`, field_label: "", field_type: type,
    placeholder: "", options: [""], is_required: false, sort_order: fieldCounter,
  };
}

function toLocalDatetime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso); const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ── Template data ──────────────────────────────────── */

const TEMPLATES = [
  { name: "Customer Feedback", desc: "Collect feedback on products or services", icon: MessageSquare },
  { name: "Contact Form", desc: "Standard contact information form", icon: Mail },
  { name: "Survey", desc: "General purpose survey", icon: FileText },
  { name: "Event Registration", desc: "Register attendees for an event", icon: Calendar },
  { name: "Job Application", desc: "Collect applicant information", icon: Search },
  { name: "Lead Capture", desc: "Capture potential customer leads", icon: Plus },
  { name: "Order Form", desc: "Simple product order form", icon: List },
  { name: "RSVP", desc: "Invitation response form", icon: CheckSquare },
  { name: "Employee Feedback", desc: "Gather anonymous employee feedback", icon: MessageSquare },
];

/* ── Helper components ─────────────────────────────── */

function IconTag({ icon: Icon, label, color }: { icon: React.ComponentType<{ size?: number }>; label: string; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      <Icon size={12} />
      {label}
    </span>
  );
}

/* ── Live Preview ───────────────────────────────────── */

function FormPreview({ title, description, fields, mobile }: { title: string; description: string; fields: Field[]; mobile: boolean }) {
  const renderField = (f: Field) => {
    switch (f.field_type) {
      case "text":
        return <input type="text" placeholder={f.placeholder || "Short text answer..."} disabled className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500" />;
      case "textarea":
        return <textarea placeholder={f.placeholder || "Long text answer..."} rows={2} disabled className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500" />;
      case "email":
        return <input type="email" placeholder={f.placeholder || "email@example.com"} disabled className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500" />;
      case "number":
        return <input type="number" placeholder={f.placeholder || "0"} disabled className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500" />;
      case "phone":
        return <input type="tel" placeholder="+1 (555) 000-0000" disabled className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500" />;
      case "date":
        return <input type="date" disabled className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500" />;
      case "select":
        return (
          <span className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400">
            <List size={14} /> Select an option
          </span>
        );
      case "checkbox":
        return (
          <div className="space-y-1.5">
            {f.options.map((o, i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-slate-500"><input type="checkbox" disabled className="rounded border-slate-300" />{o || `Option ${i + 1}`}</label>
            ))}
          </div>
        );
      case "radio":
        return (
          <div className="space-y-1.5">
            {f.options.map((o, i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-slate-500"><input type="radio" disabled name={`preview_${f.id}`} className="border-slate-300" />{o || `Option ${i + 1}`}</label>
            ))}
          </div>
        );
      case "rating":
        return <div className="flex gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={20} className="text-slate-200" />)}</div>;
      case "file_upload":
        return <span className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-400"><Upload size={14} /> Click to upload</span>;
      case "signature":
        return <span className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-sm text-slate-400"><PenLine size={18} /></span>;
      default:
        return <input type="text" disabled className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500" />;
    }
  };

  return (
    <div className={`overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60 ${mobile ? "mx-auto max-w-[280px]" : "w-full"}`}>
      <div className="border-b border-slate-100 bg-gradient-to-br from-teal-500 to-emerald-600 px-4 py-5 text-white">
        <h3 className="text-sm font-bold">{title || "Untitled Form"}</h3>
        {description && <p className="mt-1 text-[11px] opacity-80">{description}</p>}
      </div>
      <div className="space-y-3 p-4">
        {fields.filter((f) => f.field_label).map((f) => (
          <div key={f.id}>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              {f.field_label} {f.is_required && <span className="text-red-500">*</span>}
            </label>
            {renderField(f)}
          </div>
        ))}
        {fields.filter((f) => f.field_label).length === 0 && (
          <p className="py-6 text-center text-xs text-slate-400">Add fields to see a preview</p>
        )}
        <button type="button" disabled className="w-full rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white opacity-60">
          Submit
        </button>
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────── */

export default function FormBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const isEditing = !!editId;
  const orgIdFromParams = searchParams.get("orgId") || "";

  /* state */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<Field[]>([createField()]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [savedFormId, setSavedFormId] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [error, setError] = useState("");
  const [organizationId, setOrganizationId] = useState(orgIdFromParams);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [schedule, setSchedule] = useState(false);
  const [publishAt, setPublishAt] = useState("");
  const [isTimed, setIsTimed] = useState(false);
  const [closesAt, setClosesAt] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [tab, setTab] = useState<"build" | "settings">("build");
  const [previewMobile, setPreviewMobile] = useState(false);
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [savedIndicator, setSavedIndicator] = useState<"saving" | "saved" | "">("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const lastSavedSnapshot = useRef("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (isEditing) return;
    const template = searchParams.get("template");
    if (!template) return;

    const nowVal = Date.now();
    if (template === "quiz") {
      setTitle("General Knowledge Quiz");
      setDescription("Test your knowledge with these fun trivia questions.");
      setFields([
        {
          id: `field_${nowVal}_1`,
          field_label: "What is your name?",
          field_type: "text",
          placeholder: "Type your name...",
          options: [""],
          is_required: true,
          sort_order: 1,
        },
        {
          id: `field_${nowVal}_2`,
          field_label: "Which of the following is NOT a programming language?",
          field_type: "radio",
          placeholder: "",
          options: ["Python", "HTML", "Go", "Rust"],
          is_required: true,
          sort_order: 2,
        },
        {
          id: `field_${nowVal}_3`,
          field_label: "Which features does FeedLoop provide? (Select all that apply)",
          field_type: "checkbox",
          placeholder: "",
          options: ["Form Builder", "Live Analytics", "Offline Support", "Custom Branding"],
          is_required: false,
          sort_order: 3,
        },
        {
          id: `field_${nowVal}_4`,
          field_label: "Select the capital of France:",
          field_type: "select",
          placeholder: "",
          options: ["London", "Paris", "Berlin", "Rome"],
          is_required: true,
          sort_order: 4,
        }
      ]);
    } else if (template === "invitation") {
      setTitle("Summer Party RSVP");
      setDescription("You're invited! Please let us know if you can make it.");
      setFields([
        {
          id: `field_${nowVal}_1`,
          field_label: "Will you attend the event?",
          field_type: "radio",
          placeholder: "",
          options: ["Yes, I will attend!", "No, sorry I can't make it."],
          is_required: true,
          sort_order: 1,
        },
        {
          id: `field_${nowVal}_2`,
          field_label: "Number of guests (including yourself)",
          field_type: "number",
          placeholder: "1",
          options: [""],
          is_required: true,
          sort_order: 2,
        },
        {
          id: `field_${nowVal}_3`,
          field_label: "Preferred meal option",
          field_type: "radio",
          placeholder: "",
          options: ["Standard (Meat)", "Vegetarian", "Vegan", "Gluten-Free"],
          is_required: false,
          sort_order: 3,
        },
        {
          id: `field_${nowVal}_4`,
          field_label: "Any dietary restrictions or requests?",
          field_type: "textarea",
          placeholder: "Specify here...",
          options: [""],
          is_required: false,
          sort_order: 4,
        }
      ]);
    } else if (template === "registration") {
      setTitle("Tech Conference Registration");
      setDescription("Sign up for FeedLoop DevCon 2026.");
      setFields([
        {
          id: `field_${nowVal}_1`,
          field_label: "Full Name",
          field_type: "text",
          placeholder: "Enter your full name",
          options: [""],
          is_required: true,
          sort_order: 1,
        },
        {
          id: `field_${nowVal}_2`,
          field_label: "Email Address",
          field_type: "email",
          placeholder: "yourname@example.com",
          options: [""],
          is_required: true,
          sort_order: 2,
        },
        {
          id: `field_${nowVal}_3`,
          field_label: "Phone Number",
          field_type: "phone",
          placeholder: "+1 (555) 000-0000",
          options: [""],
          is_required: true,
          sort_order: 3,
        },
        {
          id: `field_${nowVal}_4`,
          field_label: "Select Ticket Type",
          field_type: "select",
          placeholder: "",
          options: ["General Pass ($99)", "VIP Access ($299)", "Student Discount ($19)"],
          is_required: true,
          sort_order: 4,
        },
        {
          id: `field_${nowVal}_5`,
          field_label: "Which tracks are you interested in?",
          field_type: "checkbox",
          placeholder: "",
          options: ["AI & Data Science", "Web Development", "DevOps & Cloud", "UX Design"],
          is_required: false,
          sort_order: 5,
        }
      ]);
    }
  }, [isEditing, searchParams]);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data: form } = await supabase.from("forms").select("*").eq("id", editId).single();
      if (!form) { setLoading(false); return; }
      setTitle(form.title); setDescription(form.description || "");
      setOrganizationId(form.organization_id || "");
      setStatus(form.status || "draft");
      setUpdatedAt(form.updated_at || null);
      setIsTimed(form.is_timed || false);
      setClosesAt(toLocalDatetime(form.closes_at));
      if (form.publish_at) { setSchedule(true); setPublishAt(toLocalDatetime(form.publish_at)); }
      const { data: fieldRows } = await supabase.from("form_fields").select("*").eq("form_id", editId).order("sort_order");
      if (fieldRows && fieldRows.length > 0) {
        fieldCounter = fieldRows.length;
        setFields(fieldRows.map((f) => ({
          id: `field_${f.id}`, field_label: f.field_label, field_type: f.field_type as FieldType,
          placeholder: f.placeholder || "", options: (f.options as string[])?.length ? (f.options as string[]) : [""],
          is_required: f.is_required, sort_order: f.sort_order,
        })));
      }
      lastSavedSnapshot.current = JSON.stringify({
        title: form.title, description: form.description || "",
        fields: (fieldRows && fieldRows.length > 0)
          ? fieldRows.map((f) => ({
              id: `field_${f.id}`, field_label: f.field_label, field_type: f.field_type,
              placeholder: f.placeholder || "", options: (f.options as string[])?.length ? (f.options as string[]) : [""],
              is_required: f.is_required, sort_order: f.sort_order,
            }))
          : [createField()],
        status: form.status, schedule: !!form.publish_at,
        publishAt: form.publish_at || "", isTimed: form.is_timed || false,
        closesAt: form.closes_at || "",
      });
      setLoading(false);
    })();
  }, [editId]);

  /* track unsaved changes */
  useEffect(() => {
    const snap = JSON.stringify({ title, description, fields, status, schedule, publishAt, isTimed, closesAt });
    if (snap !== lastSavedSnapshot.current) {
      setDirty(true);
    } else {
      setDirty(false);
    }
  }, [title, description, fields, status, schedule, publishAt, isTimed, closesAt]);

  /* field operations */
  const addField = (type: FieldType) => { setFields((p) => [...p, createField(type)]); };
  const removeField = (id: string) => { setFields((p) => p.filter((f) => f.id !== id)); };
  const updateField = (id: string, u: Partial<Field>) => { setFields((p) => p.map((f) => (f.id === id ? { ...f, ...u } : f))); };
  const addOption = (fid: string) => { setFields((p) => p.map((f) => (f.id === fid ? { ...f, options: [...f.options, ""] } : f))); };
  const updateOption = (fid: string, oi: number, v: string) => { setFields((p) => p.map((f) => f.id === fid ? { ...f, options: f.options.map((o, i) => (i === oi ? v : o)) } : f)); };
  const removeOption = (fid: string, oi: number) => { setFields((p) => p.map((f) => f.id === fid ? { ...f, options: f.options.filter((_, i) => i !== oi) } : f)); };
  const duplicateField = (id: string) => {
    const f = fields.find((x) => x.id === id); if (!f) return;
    fieldCounter++; const copy = { ...f, id: `field_${Date.now()}_${fieldCounter}`, sort_order: fieldCounter };
    setFields((p) => [...p, copy]);
  };
  const moveField = (id: string, dir: "up" | "down") => {
    const idx = fields.findIndex((f) => f.id === id);
    if ((dir === "up" && idx === 0) || (dir === "down" && idx === fields.length - 1)) return;
    const n = idx + (dir === "up" ? -1 : 1); const c = [...fields]; [c[idx], c[n]] = [c[n], c[idx]]; setFields(c);
  };
  const moveFieldTo = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= fields.length) return;
    const c = [...fields]; c.splice(toIdx, 0, c.splice(fromIdx, 1)[0]); setFields(c);
  };

  /* save / delete */
  const handleSave = useCallback(async (saveStatus: "draft" | "published", showSuccess: boolean = true) => {
    if (!title.trim()) { setError("Form title is required"); return; }
    setSaving(true); setError(""); setSavedIndicator("saving");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const payload: Record<string, unknown> = {
      title: sanitize(title.trim()), description: sanitize(description.trim()) || null,
      organization_id: organizationId || null, status: saveStatus,
      is_timed: isTimed, closes_at: isTimed && closesAt ? new Date(closesAt).toISOString() : null,
      publish_at: schedule && publishAt ? new Date(publishAt).toISOString() : null,
    };
    let formId: string;
    if (isEditing && editId) {
      const { error: upErr } = await supabase.from("forms").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editId);
      if (upErr) { setError(upErr.message); setSaving(false); return; }
      await supabase.from("form_fields").delete().eq("form_id", editId);
      formId = editId;
    } else {
      const { data: form, error: insErr } = await supabase.from("forms").insert({ ...payload, is_public: true, created_by: user.id }).select("id").single();
      if (insErr || !form) { setError(insErr?.message || "Failed to save"); setSaving(false); return; }
      formId = form.id;
    }
    const fieldInserts = fields.filter((f) => f.field_label.trim()).map((f, i) => ({
      form_id: formId,
      field_label: sanitize(f.field_label.trim()),
      field_type: f.field_type,
      placeholder: f.placeholder ? sanitize(f.placeholder) : null,
      options: CHOICE_TYPES.has(f.field_type) && f.options.some((o) => o.trim())
        ? f.options.filter((o) => o.trim()).map((o) => sanitize(o))
        : null,
      is_required: f.is_required,
      sort_order: i,
    }));
    if (fieldInserts.length > 0) {
      const { error: fErr } = await supabase.from("form_fields").insert(fieldInserts);
      if (fErr) console.error("Fields insert error:", fErr);
    }
    setUpdatedAt(new Date().toISOString());
    setDirty(false);
    lastSavedSnapshot.current = JSON.stringify({ title, description, fields, status, schedule, publishAt, isTimed, closesAt });
    if (showSuccess) {
      setSavedFormId(formId);
    } else {
      if (!isEditing) {
        navigate(`/builder?id=${formId}${orgIdFromParams ? `&orgId=${orgIdFromParams}` : ""}`, { replace: true });
      }
    }
    setSaving(false); setSavedIndicator("saved");
    setTimeout(() => setSavedIndicator(""), 3000);
  }, [title, description, fields, organizationId, status, isTimed, closesAt, schedule, publishAt, isEditing, editId, navigate, orgIdFromParams]);

  const handleDelete = async () => {
    if (!editId) return; setSaving(true);
    await supabase.from("form_fields").delete().eq("form_id", editId);
    await supabase.from("form_responses").delete().eq("form_id", editId);
    await supabase.from("forms").delete().eq("id", editId);
    navigate("/forms");
  };

  const shareUrl = savedFormId ? `${window.location.origin}/form/${savedFormId}` : "";
  const handleCopyLink = async () => { await navigator.clipboard.writeText(shareUrl); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); };

  /* loading */
  if (loading) return <AppLayout ><div className="flex min-h-[60vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-teal-600" /></div></AppLayout>;

  /* success screen */
  if (savedFormId) return (
    <AppLayout >
      <div className="flex items-center justify-center py-6"><div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-200/60">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-teal-100 text-teal-600"><Share2 size={28} /></span>
        <h1 className="mt-4 text-xl font-black text-slate-900">{isEditing ? "Form updated!" : "Form created!"}</h1>
        <p className="mt-1 text-sm text-slate-500">{isEditing ? "Your changes have been saved." : "Share this link with people to collect responses."}</p>
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 break-all">
          <span className="flex-1 truncate">{shareUrl}</span>
          <button type="button" onClick={handleCopyLink} className="flex shrink-0 size-9 items-center justify-center rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition">{shareCopied ? <Check size={16} /> : <Copy size={16} />}</button>
        </div>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={() => navigate(`/forms/${savedFormId}/responses`)} className="flex-1 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-teal-500 hover:to-emerald-500">View Responses</button>
          <button type="button" onClick={() => navigate("/forms")} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">All Forms</button>
        </div>
      </div></div>
    </AppLayout>
  );

  /* filed count */
  const fieldCount = fields.filter((f) => f.field_label.trim()).length;

  return (
    <AppLayout >
      <div className="flex h-screen flex-col bg-slate-50">
        {/* ── Top bar ─────────────────────────────────── */}
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(isEditing ? `/forms` : "/dashboard")} className="rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 transition">← Back</button>
            <span className="h-5 w-px bg-slate-200" />
            <h1 className="text-sm font-bold text-slate-900">{isEditing ? "Edit Form" : "New Form"}</h1>
            {schedule && publishAt ? (
              <span className="rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Scheduled</span>
            ) : status === "draft" ? (
              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Draft</span>
            ) : status === "published" ? (
              <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">Published</span>
            ) : null}
            {savedIndicator === "saving" && <span className="text-[11px] text-slate-400">Saving…</span>}
            {savedIndicator === "saved" && <span className="text-[11px] text-teal-600 font-medium">All changes saved</span>}
            {updatedAt && !savedIndicator && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock size={11} />
                {schedule && publishAt ? `Publishing ${new Date(publishAt).toLocaleDateString()}` : `Saved ${new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
              </span>
            )}
            {dirty && <span className="size-1.5 rounded-full bg-amber-400" title="Unsaved changes" />}
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button type="button" onClick={() => setDeleteConfirm(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"><Trash2 size={13} /> Delete</button>
            )}
            <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"><Eye size={13} /> Preview</button>
            <button type="button" onClick={handleCopyLink} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"><Share2 size={13} /> Share</button>
            <button type="button" onClick={() => handleSave("draft", false)} disabled={saving || !title.trim()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"><Save size={13} /> Save Draft</button>
            <button type="button" onClick={() => handleSave("published", true)} disabled={saving || !title.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-500 disabled:opacity-50"><Send size={13} /> Publish</button>
          </div>
        </header>

        {/* ── Main 3-col grid ─────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar — Settings */}
          <aside className="hidden w-[260px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4 lg:block">
            <div className="space-y-5">
              {/* Publishing */}
              <div>
                <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Publishing</h4>
                <div className="space-y-2">
                  <button type="button" onClick={() => { setStatus("draft"); handleSave("draft", false); }} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${!schedule && status === "draft" ? "border-teal-300 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}>
                    <span className="flex size-8 items-center justify-center rounded-lg bg-white shadow-sm"><FileText size={15} /></span>
                    <div><div className="font-bold">Save as Draft</div><div className="text-[10px] font-normal text-slate-400">Keep editing later</div></div>
                  </button>
                  <button type="button" onClick={() => { setStatus("published"); handleSave("published", true); }} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${!schedule && status === "published" ? "border-teal-300 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}>
                    <span className="flex size-8 items-center justify-center rounded-lg bg-white shadow-sm"><Send size={15} /></span>
                    <div><div className="font-bold">Publish Now</div><div className="text-[10px] font-normal text-slate-400">Make form live</div></div>
                  </button>
                  <button type="button" onClick={() => setSchedule(!schedule)} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${schedule ? "border-teal-300 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}>
                    <span className="flex size-8 items-center justify-center rounded-lg bg-white shadow-sm"><Calendar size={15} /></span>
                    <div><div className="font-bold">Schedule</div><div className="text-[10px] font-normal text-slate-400">Set publish date</div></div>
                  </button>
                </div>
                {schedule && (
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                      <Calendar size={14} className="text-slate-400" />
                      <input type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} className="w-full bg-transparent outline-none text-slate-900" />
                    </label>
                    <button type="button" onClick={() => handleSave("draft", false)} disabled={saving || !title.trim() || !publishAt} className="w-full rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50">
                      {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Schedule Publish"}
                    </button>
                  </div>
                )}
              </div>

              {/* Timed Form */}
              <div>
                <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Timed Form</h4>
                <div className="rounded-xl border border-slate-200 p-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-slate-400" />
                      <div><div className="text-xs font-semibold text-slate-800">Enable Timed Form</div><p className="text-[10px] text-slate-400">Automatically close this form on a specified date and time.</p></div>
                    </div>
                    <div className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors ${isTimed ? "bg-teal-600" : "bg-slate-300"}`} onClick={() => setIsTimed(!isTimed)}>
                      <span className={`inline-block size-4 transform rounded-full bg-white shadow-sm transition-transform ${isTimed ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
                    </div>
                  </label>
                  {isTimed && (
                    <div className="mt-3 space-y-2">
                      <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                        <Clock size={14} className="text-slate-400 shrink-0" />
                        <input type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} className="w-full bg-transparent outline-none text-slate-900" />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Settings */}
              <div>
                <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Form Settings</h4>
                <div className="space-y-2">
                  {[
                    { icon: Settings, label: "General Settings", desc: "Update title, description and metadata" },
                    { icon: Globe, label: "Form Access", desc: "Control who can submit this form" },
                    { icon: Bell, label: "Notifications", desc: "Get notified on new submissions" },
                    { icon: MessageSquare, label: "Thank You Message", desc: "Customize post-submission message" },
                  ].map((s) => (
                    <button key={s.label} type="button" className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left transition hover:border-slate-300 hover:bg-slate-50">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><s.icon size={15} /></span>
                      <div className="min-w-0"><div className="text-xs font-semibold text-slate-800">{s.label}</div><p className="truncate text-[10px] text-slate-400">{s.desc}</p></div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced */}
              <div>
                <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Advanced</h4>
                <div className="space-y-2">
                  {[
                    { icon: Link, label: "Integrations" },
                    { icon: CreditCard, label: "Payments" },
                    { icon: Layout, label: "Custom Domain" },
                    { icon: Webhook, label: "Webhooks" },
                  ].map((s) => (
                    <button key={s.label} type="button" className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left transition hover:border-slate-300 hover:bg-slate-50 opacity-60">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><s.icon size={15} /></span>
                      <div className="text-xs font-semibold text-slate-600">{s.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Center — Builder */}
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-2xl px-4 py-6">
              {/* Tabs */}
              <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-0.5">
                {(["build", "settings"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setTab(t)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >{t === "build" ? "Build" : "Settings"}</button>
                ))}
              </div>

              {tab === "build" && (
                <div className="space-y-4">
                  {/* Form Info */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <input type="text" placeholder="Form Title" value={title} onChange={(e) => setTitle(e.target.value)}
                      className="w-full border-0 bg-transparent text-lg font-bold text-slate-900 outline-none placeholder:text-slate-300" />
                    <textarea placeholder="Form description (optional)…" value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                      className="mt-2 w-full resize-none border-0 bg-transparent text-sm text-slate-500 outline-none placeholder:text-slate-300" />
                  </div>

                  {/* Fields */}
                  {fields.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-12 text-center">
                      <FileText size={32} className="text-slate-300" />
                      <p className="mt-3 text-sm font-medium text-slate-500">No fields yet</p>
                      <p className="text-xs text-slate-400">Click a field type below to add your first field.</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {fields.map((field, index) => {
                      const meta = FIELD_META.find((m) => m.type === field.field_type);
                      const Icon = meta?.icon || Type;
                      const isOpen = expandedField === field.id;
                      return (
                        <div key={field.id}
                          className="group rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300"
                        >
                          {/* Field header (always visible) */}
                          <div className="flex items-center gap-2 px-3 py-2.5">
                            <span className="cursor-grab text-slate-300 hover:text-slate-500"><GripVertical size={15} /></span>
                            <span className="flex size-7 items-center justify-center rounded-md bg-slate-100 text-slate-500"><Icon size={14} /></span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                              {field.field_label || <span className="text-slate-300 italic">{meta?.label || "Field"}</span>}
                            </span>
                            <IconTag icon={meta?.icon || Type} label={meta?.label || field.field_type} />
                            {field.is_required && <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">Required</span>}
                            <button type="button" onClick={() => setExpandedField(isOpen ? null : field.id)}
                              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                              {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <button type="button" onClick={() => duplicateField(field.id)}
                              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                              <Copy size={14} />
                            </button>
                            <button type="button" onClick={() => removeField(field.id)}
                              className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition">
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Inline editor */}
                          {isOpen && (
                            <div className="border-t border-slate-100 px-4 py-3 space-y-3">
                              <label className="block">
                                <span className="text-[11px] font-semibold text-slate-500">Label</span>
                                <input type="text" placeholder="Field label" value={field.field_label}
                                  onChange={(e) => updateField(field.id, { field_label: e.target.value })}
                                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-300" />
                              </label>
                              <div className="flex gap-3">
                                <label className="flex-1">
                                  <span className="text-[11px] font-semibold text-slate-500">Type</span>
                                  <select value={field.field_type} onChange={(e) => updateField(field.id, { field_type: e.target.value as FieldType })}
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-teal-300">
                                    {FIELD_META.map((m) => <option key={m.type} value={m.type}>{m.label}</option>)}
                                  </select>
                                </label>
                                <label className="flex items-center gap-2 pt-5 text-xs text-slate-600">
                                  <input type="checkbox" checked={field.is_required} onChange={(e) => updateField(field.id, { is_required: e.target.checked })}
                                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                                  Required
                                </label>
                              </div>
                              {CHOICE_TYPES.has(field.field_type) && (
                                <div className="space-y-1.5">
                                  <span className="text-[11px] font-semibold text-slate-500">Options</span>
                                  {field.options.map((opt, oi) => (
                                    <div key={oi} className="flex items-center gap-2">
                                      <input type="text" placeholder={`Option ${oi + 1}`} value={opt}
                                        onChange={(e) => updateOption(field.id, oi, e.target.value)}
                                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-teal-300" />
                                      {field.options.length > 1 && <button type="button" onClick={() => removeOption(field.id, oi)} className="text-slate-300 hover:text-red-500"><Trash2 size={13} /></button>}
                                    </div>
                                  ))}
                                  <button type="button" onClick={() => addOption(field.id)} className="text-xs font-medium text-teal-600 hover:text-teal-700">+ Add option</button>
                                </div>
                              )}
                              {!CHOICE_TYPES.has(field.field_type) && field.field_type !== "rating" && field.field_type !== "file_upload" && field.field_type !== "signature" && (
                                <label className="block">
                                  <span className="text-[11px] font-semibold text-slate-500">Placeholder</span>
                                  <input type="text" placeholder="Placeholder text" value={field.placeholder}
                                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 outline-none focus:border-teal-300" />
                                </label>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Field picker */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="mb-2 text-[11px] font-semibold text-slate-500">Add Field</p>
                    <div className="flex flex-wrap gap-1.5">
                      {FIELD_META.map((m) => {
                        const Icon = m.icon;
                        return (
                          <button key={m.type} type="button" onClick={() => addField(m.type)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-teal-300 hover:text-teal-700 hover:shadow">
                            <Icon size={13} /> {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Error */}
                  {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 text-center">{error}</p>}

                  {/* Bottom save actions */}
                  <div className="flex items-center justify-center gap-3 pb-6 pt-2">
                    <button type="button" onClick={() => handleSave("draft", false)} disabled={saving || !title.trim()}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50">
                      {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                      Save Draft
                    </button>
                    <button type="button" onClick={() => handleSave("published", true)} disabled={saving || !title.trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50">
                      {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                      Publish
                    </button>
                  </div>

                  {/* Delete confirm */}
                  {deleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                        <p className="text-sm font-semibold text-slate-800">Delete this form?</p>
                        <p className="mt-1 text-xs text-slate-500">All responses will be permanently removed.</p>
                        <div className="mt-5 flex gap-2">
                          <button type="button" onClick={handleDelete} disabled={saving}
                            className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-600">{saving ? <Loader2 size={14} className="animate-spin" /> : "Yes, delete"}</button>
                          <button type="button" onClick={() => setDeleteConfirm(false)}
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === "settings" && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center py-12">
                  <Settings size={28} className="mx-auto text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-500">Form Settings</p>
                  <p className="text-xs text-slate-400">Advanced form settings coming soon.</p>
                </div>
              )}
            </div>
          </main>

          {/* Right Sidebar — Preview + Templates */}
          <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-l border-slate-200 bg-white xl:block">
            <div className="p-4">
              {/* Preview toggle */}
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700">Preview</h4>
                <button type="button" onClick={() => setPreviewMobile(!previewMobile)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50">
                  {previewMobile ? <Monitor size={12} /> : <Smartphone size={12} />}
                  {previewMobile ? "Desktop" : "Mobile"}
                </button>
              </div>

              {/* Preview */}
              <div className="sticky top-4">
                <FormPreview title={title} description={description} fields={fields} mobile={previewMobile} />

                {/* Templates */}
                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700">Templates</h4>
                    <button type="button" className="text-[11px] font-medium text-teal-600 hover:text-teal-700">View all</button>
                  </div>
                  <div className="space-y-2">
                    {TEMPLATES.map((t) => {
                      const Icon = t.icon;
                      return (
                        <button key={t.name} type="button"
                          className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left transition hover:border-teal-300 hover:shadow-sm">
                          <span className="flex size-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600"><Icon size={15} /></span>
                          <div className="min-w-0"><div className="text-xs font-semibold text-slate-800">{t.name}</div><p className="truncate text-[10px] text-slate-400">{t.desc}</p></div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
