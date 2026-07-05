import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/app-layout";
import {
  Loader2,
  Download,
  BarChart3,
  Users,
  CalendarDays,
} from "lucide-react";

interface FormField {
  id: string;
  field_label: string;
  field_type: string;
}

interface Answer {
  field_id: string;
  answer: string;
}

interface ResponseRow {
  id: string;
  submitted_at: string;
  response_answers: Answer[];
}

export default function FormResponses() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<{ title: string; description: string | null; views: number } | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!formId) return;
    (async () => {
      const { data: formData } = await supabase
        .from("forms")
        .select("title, description, views")
        .eq("id", formId)
        .single();

      const { data: fieldData } = await supabase
        .from("form_fields")
        .select("id, field_label, field_type")
        .eq("form_id", formId)
        .order("sort_order");

      const { data: responseData } = await supabase
        .from("form_responses")
        .select("id, submitted_at, response_answers(field_id, answer)")
        .eq("form_id", formId)
        .order("submitted_at", { ascending: false });

      setForm(formData);
      setFields(fieldData || []);
      setResponses((responseData as unknown as ResponseRow[]) || []);
      setLoading(false);
    })();
  }, [formId]);

  const exportCsv = () => {
    const headers = ["Submitted At", ...fields.map((f) => f.field_label)];
    const rows = responses.map((r) => {
      const answerMap: Record<string, string> = {};
      r.response_answers?.forEach((a) => {
        answerMap[a.field_id] = a.answer;
      });
      return [
        new Date(r.submitted_at).toLocaleString(),
        ...fields.map((f) => `"${(answerMap[f.id] || "").replace(/"/g, '""')}"`),
      ];
    });

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form?.title || "form"}_responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 size={28} className="animate-spin text-emerald-600" />
        </div>
      </AppLayout>
    );
  }

  if (!form) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900">Form not found</h1>
            <Link to="/dashboard" className="mt-4 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-slate-800 hover:shadow-md">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
        <main className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{form.title}</h1>
                {form.description && (
                  <p className="mt-1 text-sm text-slate-500">{form.description}</p>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <BarChart3 size={13} />
                    {fields.length} field{fields.length !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={13} />
                    {responses.length} response{responses.length !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {form?.views} view{form?.views !== 1 ? "s" : ""}
                  </span>
                  {form && form.views > 0 && (
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                      {Math.round((responses.length / form.views) * 100)}% rate
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={exportCsv}
                disabled={responses.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-slate-800 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <Download size={15} />
                Export CSV
              </button>
            </div>

            {responses.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-12">
                <BarChart3 size={48} className="text-slate-300" />
                <h2 className="mt-4 text-lg font-bold text-slate-700">No responses yet</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Share the form link to start collecting responses.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="sticky top-0 bg-white px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                        #
                      </th>
                      <th className="sticky top-0 bg-white px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                        <CalendarDays size={12} className="inline mr-1" />
                        Submitted
                      </th>
                      {fields.map((f) => (
                        <th
                          key={f.id}
                          className="sticky top-0 bg-white px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap"
                        >
                          {f.field_label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((r, ri) => {
                      const answerMap: Record<string, string> = {};
                      r.response_answers?.forEach((a) => {
                        answerMap[a.field_id] = a.answer;
                      });
                      return (
                        <tr
                          key={r.id}
                          className="border-b border-slate-50 transition-colors hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 text-xs text-slate-400">{ri + 1}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                            {new Date(r.submitted_at).toLocaleString()}
                          </td>
                          {fields.map((f) => (
                            <td key={f.id} className="px-4 py-3 text-sm text-slate-700 max-w-[200px] truncate">
                              {answerMap[f.id] || "\u2014"}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {responses.length > 0 && (
              <div className="text-center text-xs text-slate-400">
                Showing {responses.length} response{responses.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </main>
    </AppLayout>
  );
}
