import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  Send,
  CheckCircle,
  Network,
  Star,
  AlertCircle,
} from "lucide-react";
import { validateFields } from "@/lib/validation";
import { sanitizeAnswers } from "@/lib/sanitize";

interface SurveyField {
  id: string;
  field_label: string;
  field_type: string;
  placeholder: string | null;
  options: string[] | null;
  is_required: boolean;
  sort_order: number;
}

interface Survey {
  id: string;
  title: string;
  description: string | null;
}

export default function PublicSurvey() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [fields, setFields] = useState<SurveyField[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!surveyId) return;
    (async () => {
      const { data: surveyData } = await supabase
        .from("surveys")
        .select("id, title, description")
        .eq("id", surveyId)
        .single();

      if (!surveyData) {
        setLoading(false);
        return;
      }

      supabase.rpc("increment_views", { _table: "surveys", _id: surveyId });

      const { data: fieldData } = await supabase
        .from("survey_fields")
        .select("*")
        .eq("survey_id", surveyId)
        .order("sort_order");

      setSurvey(surveyData);
      setFields(fieldData || []);
      setLoading(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: existing } = await supabase
          .from("survey_responses")
          .select("id")
          .eq("survey_id", surveyId)
          .eq("submitted_by", user.id)
          .maybeSingle();
        if (existing) setAlreadySubmitted(true);
      }
    })();
  }, [surveyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const fieldErrors = validateFields(fields, answers);
    if (Object.keys(fieldErrors).length > 0) {
      const first = fields.find((f) => fieldErrors[f.id]);
      setError(first ? `"${first.field_label}" is required` : "Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: response, error: responseError } = await supabase
      .from("survey_responses")
      .insert({ survey_id: surveyId, submitted_by: user?.id || null })
      .select("id")
      .single();

    if (responseError || !response) {
      console.error("Response insert error:", responseError);
      if (responseError?.code === "23505") {
        setError("You have already submitted a response to this survey.");
        setAlreadySubmitted(true);
      } else {
        setError(responseError?.message || "Failed to submit. Please try again.");
      }
      setSubmitting(false);
      return;
    }

    const cleanAnswers = sanitizeAnswers(answers, fields);
    const answerInserts = Object.entries(cleanAnswers)
      .filter(([, value]) => value.trim())
      .map(([fieldId, value]) => ({
        response_id: response.id,
        field_id: fieldId,
        answer: value,
      }));

    if (answerInserts.length > 0) {
      const { error: answersError } = await supabase
        .from("survey_response_answers")
        .insert(answerInserts);
      if (answersError) {
        console.error("Answers insert error:", answersError);
      }
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f4f7f5]">
        <Loader2 size={32} className="animate-spin text-teal-600" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f4f7f5] px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900">Survey not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            This survey may have been deleted or the link is invalid.
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (submitted || alreadySubmitted) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f4f7f5] px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-4 text-center shadow-xl ring-1 ring-slate-200/60">
          <span className={`mx-auto flex size-14 items-center justify-center rounded-full ${alreadySubmitted ? "bg-amber-100 text-amber-600" : "bg-teal-100 text-teal-600"}`}>
            {alreadySubmitted ? <AlertCircle size={28} /> : <CheckCircle size={28} />}
          </span>
          <h1 className="mt-4 text-xl font-black text-slate-900">
            {alreadySubmitted ? "Already submitted" : "Response submitted!"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {alreadySubmitted ? "You have already submitted a response to this survey. Only one submission is allowed." : "Thank you for your response. Your feedback has been recorded."}
          </p>
        </div>
      </div>
    );
  }

  const renderField = (field: SurveyField) => {
    const value = answers[field.id] || "";
    const setValue = (val: string) =>
      setAnswers((prev) => ({ ...prev, [field.id]: val }));

    switch (field.field_type) {
      case "textarea":
        return (
          <textarea
            placeholder={field.placeholder || ""}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300"
          />
        );
      case "number":
        return (
          <input
            type="number"
            placeholder={field.placeholder || ""}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300"
          />
        );
      case "email":
        return (
          <input
            type="email"
            placeholder={field.placeholder || ""}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300"
          />
        );
      case "select":
        return (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-teal-300"
          >
            <option value="">Select an option</option>
            {(field.options || []).map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      case "checkbox":
        return (
          <div className="space-y-2">
            {(field.options || []).map((opt, i) => (
              <label key={i} className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={value.split(",").includes(opt)}
                  onChange={(e) => {
                    const current = value ? value.split(",") : [];
                    const next = e.target.checked
                      ? [...current, opt]
                      : current.filter((v) => v !== opt);
                    setValue(next.join(","));
                  }}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                {opt}
              </label>
            ))}
          </div>
        );
      case "radio":
        return (
          <div className="space-y-2">
            {(field.options || []).map((opt, i) => (
              <label key={i} className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={value === opt}
                  onChange={(e) => setValue(e.target.value)}
                  className="border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                {opt}
              </label>
            ))}
          </div>
        );
      case "rating":
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setValue(String(star))}
                className={`p-1 transition ${
                  parseInt(value) >= star
                    ? "text-amber-400"
                    : "text-slate-300 hover:text-amber-300"
                }`}
              >
                <Star size={28} fill={parseInt(value) >= star ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        );
      default:
        return (
          <input
            type="text"
            placeholder={field.placeholder || ""}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300"
          />
        );
    }
  };

  return (
    <div className="min-h-dvh bg-[#f4f7f5] py-2">
      <div className="mx-auto px-2">
        <div className="rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-200/60">
          <div className="mb-4 text-center">
            <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20">
              <Network size={22} />
            </span>
            <h1 className="mt-4 text-2xl font-black text-slate-900">
              {survey.title}
            </h1>
            {survey.description && (
              <p className="mt-2 text-sm text-slate-500">{survey.description}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {fields.map((field) => (
              <div key={field.id}>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  {field.field_label}
                  {field.is_required && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </label>
                {renderField(field)}
              </div>
            ))}

            {error && (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
              Submit Response
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}