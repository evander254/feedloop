import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function SurveyBuilder() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<Field[]>([createField()]);
  const [saving, setSaving] = useState(false);
  const [savedSurveyId, setSavedSurveyId] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [error, setError] = useState("");

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
          ? {
              ...f,
              options: f.options.map((o, i) => (i === optionIndex ? value : o)),
            }
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
    if (
      (direction === "up" && idx === 0) ||
      (direction === "down" && idx === fields.length - 1)
    )
      return;
    const next = idx + (direction === "up" ? -1 : 1);
    const copy = [...fields];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    setFields(copy);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    await supabase.from("profiles").upsert(
      { id: user.id, email: user.email },
      { onConflict: "id" }
    );

    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        is_public: true,
        status: "published",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (surveyError || !survey) {
      console.error("Survey insert error:", surveyError);
      setError(surveyError?.message || "Failed to save survey");
      setSaving(false);
      return;
    }

    const fieldInserts = fields
      .filter((f) => f.field_label.trim())
      .map((f, i) => ({
        survey_id: survey.id,
        field_label: f.field_label.trim(),
        field_type: f.field_type,
        placeholder: f.placeholder || null,
        options:
          ["select", "checkbox", "radio"].includes(f.field_type) && f.options.some((o) => o.trim())
            ? f.options.filter((o) => o.trim())
            : null,
        is_required: f.is_required,
        sort_order: i,
      }));

    if (fieldInserts.length > 0) {
      const { error: fieldsError } = await supabase
        .from("survey_fields")
        .insert(fieldInserts);
      if (fieldsError) {
        console.error("Fields insert error:", fieldsError);
        setError(fieldsError.message);
        setSaving(false);
        return;
      }
    }

    setSavedSurveyId(survey.id);
    setSaving(false);
  };

  const shareUrl = savedSurveyId
    ? `${window.location.origin}/survey/${savedSurveyId}`
    : "";

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  if (savedSurveyId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-200/60">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-teal-100 text-teal-600">
            <Share2 size={28} />
          </span>
          <h1 className="mt-4 text-xl font-black text-slate-900">Survey created!</h1>
          <p className="mt-1 text-sm text-slate-500">
            Share this link with people to collect responses.
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
              onClick={() => navigate(`/surveys/${savedSurveyId}/responses`)}
              className="flex-1 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-teal-500 hover:to-emerald-500"
            >
              View Responses
            </button>
            <button
              type="button"
              onClick={() => navigate("/surveys")}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              All Surveys
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
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-slate-900">Survey Builder</h1>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Save Survey
              </button>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-md shadow-black/[0.02] ring-1 ring-slate-200/60">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-800">
                  Survey Title
                </span>
                <input
                  type="text"
                  placeholder="e.g. Customer Satisfaction Survey"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300"
                />
              </label>
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-bold text-slate-800">
                  Description
                </span>
                <textarea
                  placeholder="Optional description or instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300"
                />
              </label>
            </div>

            <div className="rounded-xl bg-white shadow-md shadow-black/[0.02] ring-1 ring-slate-200/60">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h2 className="text-sm font-bold text-slate-800">Survey Fields</h2>
                <span className="text-xs text-slate-400">
                  {fields.filter((f) => f.field_label.trim()).length} field
                  {fields.filter((f) => f.field_label.trim()).length !== 1
                    ? "s"
                    : ""}
                </span>
              </div>

              <div className="space-y-3 px-6 py-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="group rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:border-slate-300"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        className="mt-2 cursor-grab text-slate-300 hover:text-slate-500"
                      >
                        <GripVertical size={16} />
                      </button>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Field label"
                            value={field.field_label}
                            onChange={(e) =>
                              updateField(field.id, {
                                field_label: e.target.value,
                              })
                            }
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300"
                          />
                          <select
                            value={field.field_type}
                            onChange={(e) =>
                              updateField(field.id, {
                                field_type: e.target.value as FieldType,
                              })
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-teal-300"
                          >
                            {FIELD_TYPES.map((ft) => (
                              <option key={ft.type} value={ft.type}>
                                {ft.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {["select", "checkbox", "radio"].includes(
                          field.field_type
                        ) && (
                          <div className="space-y-1.5 pl-2">
                            {field.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder={`Option ${oi + 1}`}
                                  value={opt}
                                  onChange={(e) =>
                                    updateOption(field.id, oi, e.target.value)
                                  }
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
                            onChange={(e) =>
                              updateField(field.id, {
                                placeholder: e.target.value,
                              })
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 outline-none placeholder:text-slate-400 focus:border-teal-300"
                          />
                        )}

                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-slate-500">
                            <input
                              type="checkbox"
                              checked={field.is_required}
                              onChange={(e) =>
                                updateField(field.id, {
                                  is_required: e.target.checked,
                                })
                              }
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
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
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
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
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

              <div className="border-t border-slate-100 px-6 py-4">
                <p className="mb-3 text-xs font-semibold text-slate-500">
                  Add Field
                </p>
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
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 text-center">
                {error}
              </p>
            )}

            <div className="flex justify-center pb-6">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Save & Publish Survey
              </button>
            </div>
          </div>
        </main>
    </AppLayout>
  );
}