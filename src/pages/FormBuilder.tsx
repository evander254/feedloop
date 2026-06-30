import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/app-layout";
import {
  Plus,
  Save,
  Trash2,
  GripVertical,
  Type,
  AlignLeft,
  Hash,
  Mail,
  List,
  CheckSquare,
  Circle,
  Star,
  Copy,
  Check,
  Loader2,
  Share2,
  Building2,
  Send,
  Clock,
  Calendar,
  FileText,
} from "lucide-react";

type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "select"
  | "checkbox"
  | "radio"
  | "rating";

interface Field {
  id: string;
  field_label: string;
  field_type: FieldType;
  placeholder: string;
  options: string[];
  is_required: boolean;
  sort_order: number;
}

const FIELD_TYPES: { type: FieldType; label: string; icon: typeof Type }[] = [
  { type: "text", label: "Text", icon: Type },
  { type: "textarea", label: "Textarea", icon: AlignLeft },
  { type: "number", label: "Number", icon: Hash },
  { type: "email", label: "Email", icon: Mail },
  { type: "select", label: "Select", icon: List },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare },
  { type: "radio", label: "Radio", icon: Circle },
  { type: "rating", label: "Rating", icon: Star },
];

let fieldCounter = 0;
function createField(type: FieldType = "text"): Field {
  fieldCounter++;
  return {
    id: `field_${Date.now()}_${fieldCounter}`,
    field_label: "",
    field_type: type,
    placeholder: "",
    options: [""],
    is_required: false,
    sort_order: fieldCounter,
  };
}

function toLocalDatetime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function FormBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const isEditing = !!editId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<Field[]>([createField()]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [savedFormId, setSavedFormId] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [error, setError] = useState("");
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [organizationId, setOrganizationId] = useState("");

  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [schedule, setSchedule] = useState(false);
  const [publishAt, setPublishAt] = useState("");
  const [isTimed, setIsTimed] = useState(false);
  const [closesAt, setClosesAt] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    supabase.from("organizations").select("id, name").order("name").then(({ data }) => {
      if (data) setOrgs(data);
    });
  }, []);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data: form } = await supabase
        .from("forms")
        .select("*")
        .eq("id", editId)
        .single();
      if (!form) { setLoading(false); return; }

      setTitle(form.title);
      setDescription(form.description || "");
      setOrganizationId(form.organization_id || "");
      setStatus(form.status || "draft");
      setIsTimed(form.is_timed || false);
      setClosesAt(toLocalDatetime(form.closes_at));
      if (form.publish_at) {
        setSchedule(true);
        setPublishAt(toLocalDatetime(form.publish_at));
      }

      const { data: fieldRows } = await supabase
        .from("form_fields")
        .select("*")
        .eq("form_id", editId)
        .order("sort_order");

      if (fieldRows && fieldRows.length > 0) {
        fieldCounter = fieldRows.length;
        setFields(
          fieldRows.map((f) => ({
            id: `field_${f.id}`,
            field_label: f.field_label,
            field_type: f.field_type as FieldType,
            placeholder: f.placeholder || "",
            options: (f.options as string[])?.length ? (f.options as string[]) : [""],
            is_required: f.is_required,
            sort_order: f.sort_order,
          }))
        );
      }
      setLoading(false);
    })();
  }, [editId]);

  const addField = (type: FieldType) => {
    setFields((prev) => [...prev, createField(type)]);
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<Field>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const addOption = (fieldId: string) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId ? { ...f, options: [...f.options, ""] } : f
      )
    );
  };

  const updateOption = (fieldId: string, optionIndex: number, value: string) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId
          ? { ...f, options: f.options.map((o, i) => (i === optionIndex ? value : o)) }
          : f
      )
    );
  };

  const removeOption = (fieldId: string, optionIndex: number) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId
          ? { ...f, options: f.options.filter((_, i) => i !== optionIndex) }
          : f
      )
    );
  };

  const moveField = (id: string, direction: "up" | "down") => {
    const idx = fields.findIndex((f) => f.id === id);
    if ((direction === "up" && idx === 0) || (direction === "down" && idx === fields.length - 1)) return;
    const next = idx + (direction === "up" ? -1 : 1);
    const copy = [...fields];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    setFields(copy);
  };

  const handleSave = async (saveStatus: "draft" | "published") => {
    if (!title.trim()) { setError("Form title is required"); return; }
    setSaving(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim() || null,
      organization_id: organizationId || null,
      status: saveStatus,
      is_timed: isTimed,
      closes_at: isTimed && closesAt ? new Date(closesAt).toISOString() : null,
      publish_at: schedule && publishAt ? new Date(publishAt).toISOString() : null,
    };

    let formId: string;

    if (isEditing && editId) {
      const { error: updateError } = await supabase
        .from("forms")
        .update(payload)
        .eq("id", editId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      await supabase.from("form_fields").delete().eq("form_id", editId);
      formId = editId;
    } else {
      const { data: form, error: insertError } = await supabase
        .from("forms")
        .insert({ ...payload, is_public: true, created_by: user.id })
        .select("id")
        .single();

      if (insertError || !form) {
        setError(insertError?.message || "Failed to save form");
        setSaving(false);
        return;
      }
      formId = form.id;
    }

    const fieldInserts = fields
      .filter((f) => f.field_label.trim())
      .map((f, i) => ({
        form_id: formId,
        field_label: f.field_label.trim(),
        field_type: f.field_type,
        placeholder: f.placeholder || null,
        options: ["select", "checkbox", "radio"].includes(f.field_type) && f.options.some((o) => o.trim())
          ? f.options.filter((o) => o.trim())
          : null,
        is_required: f.is_required,
        sort_order: i,
      }));

    if (fieldInserts.length > 0) {
      const { error: fieldsError } = await supabase
        .from("form_fields")
        .insert(fieldInserts);
      if (fieldsError) {
        console.error("Fields insert error:", fieldsError);
      }
    }

    setSavedFormId(formId);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!editId) return;
    setSaving(true);
    await supabase.from("form_fields").delete().eq("form_id", editId);
    await supabase.from("form_responses").delete().eq("form_id", editId);
    await supabase.from("forms").delete().eq("id", editId);
    navigate("/forms");
  };

  const shareUrl = savedFormId
    ? `${window.location.origin}/form/${savedFormId}`
    : "";

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 size={28} className="animate-spin text-teal-600" />
        </div>
      </AppLayout>
    );
  }

  if (savedFormId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-200/60">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-teal-100 text-teal-600">
              <Share2 size={28} />
            </span>
            <h1 className="mt-4 text-xl font-black text-slate-900">
              {isEditing ? "Form updated!" : "Form created!"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isEditing ? "Your changes have been saved." : "Share this link with people to collect responses."}
            </p>
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 break-all">
              <span className="flex-1 truncate">{shareUrl}</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex shrink-0 size-9 items-center justify-center rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition"
              >
                {shareCopied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => navigate(`/forms/${savedFormId}/responses`)}
                className="flex-1 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-teal-500 hover:to-emerald-500"
              >
                View Responses
              </button>
              <button
                type="button"
                onClick={() => navigate("/forms")}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                All Forms
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto">
        <div className="flex w-full flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                {isEditing ? "Edit Form" : "Form Builder"}
              </h1>
              {isEditing && (
                <p className="text-xs text-slate-500">Editing: {title || "untitled"}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              )}
            </div>
          </div>

          {deleteConfirm && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">
                Are you sure you want to delete this form? All responses will be permanently removed.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-600"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : "Yes, delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-white p-3 shadow-md shadow-black/[0.02] ring-1 ring-slate-200/60">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-800">Form Title</span>
              <input
                type="text"
                placeholder="e.g. Customer Feedback Survey"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300"
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-bold text-slate-800">Description</span>
              <textarea
                placeholder="Optional description or instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300"
              />
            </label>
            {orgs.length > 0 && (
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-bold text-slate-800">Organization</span>
                <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                  <Building2 size={18} className="shrink-0 text-slate-400" />
                  <select
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm text-slate-900"
                  >
                    <option value="">No organization</option>
                    {orgs.map((org) => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </span>
              </label>
            )}
          </div>

          <div className="rounded-xl bg-white p-3 shadow-md shadow-black/[0.02] ring-1 ring-slate-200/60">
            <h2 className="text-sm font-bold text-slate-800 mb-2">Publishing</h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStatus("draft"); setSchedule(false); }}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold transition ${
                  !schedule && status === "draft"
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <FileText size={18} className="mx-auto mb-1" />
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => { setStatus("published"); setSchedule(false); }}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold transition ${
                  !schedule && status === "published"
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <Send size={18} className="mx-auto mb-1" />
                Publish Now
              </button>
              <button
                type="button"
                onClick={() => setSchedule(!schedule)}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold transition ${
                  schedule
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <Calendar size={18} className="mx-auto mb-1" />
                Schedule
              </button>
            </div>

            {schedule && (
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Publish At</span>
                <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                  <Clock size={18} className="shrink-0 text-slate-400" />
                  <input
                    type="datetime-local"
                    value={publishAt}
                    onChange={(e) => setPublishAt(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm text-slate-900"
                  />
                </span>
              </label>
            )}
          </div>

          <div className="rounded-xl bg-white p-3 shadow-md shadow-black/[0.02] ring-1 ring-slate-200/60">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isTimed}
                onChange={(e) => setIsTimed(e.target.checked)}
                className="size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <div>
                <span className="text-sm font-bold text-slate-800">Timed form</span>
                <p className="text-xs text-slate-500">Set a closing date and time for this form</p>
              </div>
            </label>

            {isTimed && (
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Closes At</span>
                <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                  <Clock size={18} className="shrink-0 text-slate-400" />
                  <input
                    type="datetime-local"
                    value={closesAt}
                    onChange={(e) => setClosesAt(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm text-slate-900"
                  />
                </span>
              </label>
            )}
          </div>

          <div className="rounded-xl bg-white shadow-md shadow-black/[0.02] ring-1 ring-slate-200/60">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <h2 className="text-sm font-bold text-slate-800">Form Fields</h2>
              <span className="text-xs text-slate-400">
                {fields.filter((f) => f.field_label.trim()).length} field
                {fields.filter((f) => f.field_label.trim()).length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-3 px-3 py-2">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="group rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:border-slate-300"
                >
                  <div className="flex items-start gap-3">
                    <button type="button" className="mt-2 cursor-grab text-slate-300 hover:text-slate-500">
                      <GripVertical size={16} />
                    </button>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Field label"
                          value={field.field_label}
                          onChange={(e) => updateField(field.id, { field_label: e.target.value })}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300"
                        />
                        <select
                          value={field.field_type}
                          onChange={(e) => updateField(field.id, { field_type: e.target.value as FieldType })}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-teal-300"
                        >
                          {FIELD_TYPES.map((ft) => (
                            <option key={ft.type} value={ft.type}>{ft.label}</option>
                          ))}
                        </select>
                      </div>

                      {["select", "checkbox", "radio"].includes(field.field_type) && (
                        <div className="space-y-1.5 pl-2">
                          {field.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder={`Option ${oi + 1}`}
                                value={opt}
                                onChange={(e) => updateOption(field.id, oi, e.target.value)}
                                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300"
                              />
                              {field.options.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(field.id, oi)}
                                  className="text-slate-300 hover:text-red-500"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOption(field.id)}
                            className="text-xs font-medium text-teal-600 hover:text-teal-700"
                          >
                            + Add option
                          </button>
                        </div>
                      )}

                      {field.field_type === "text" && (
                        <input
                          type="text"
                          placeholder="Placeholder text"
                          value={field.placeholder}
                          onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 outline-none placeholder:text-slate-400 focus:border-teal-300"
                        />
                      )}

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs text-slate-500">
                          <input
                            type="checkbox"
                            checked={field.is_required}
                            onChange={(e) => updateField(field.id, { is_required: e.target.checked })}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                          Required
                        </label>
                        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => moveField(field.id, "up")}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="18 15 12 9 6 15" />
                              </svg>
                            </button>
                          )}
                          {index < fields.length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveField(field.id, "down")}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeField(field.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 px-3 py-2">
              <p className="mb-2 text-xs font-semibold text-slate-500">Add Field</p>
              <div className="flex flex-wrap gap-2">
                {FIELD_TYPES.map((ft) => {
                  const Icon = ft.icon;
                  return (
                    <button
                      key={ft.type}
                      type="button"
                      onClick={() => addField(ft.type)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-teal-300 hover:text-teal-700"
                    >
                      <Icon size={14} />
                      {ft.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 text-center">{error}</p>
          )}

          <div className="flex justify-center gap-3 pb-6">
            {schedule ? (
              <button
                type="button"
                onClick={() => handleSave("draft")}
                disabled={saving || !title.trim() || !publishAt}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Calendar size={18} />}
                Schedule Publish
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSave("draft")}
                  disabled={saving || !title.trim()}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 px-8 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSave("published")}
                  disabled={saving || !title.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  Publish
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
