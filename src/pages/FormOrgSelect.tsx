import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Building2, Loader2, ArrowRight } from "lucide-react";
import logoSrc from "@/assets/loop.png";

export default function FormOrgSelect() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login", { replace: true }); return; }

      const { data } = await supabase
        .from("organizations")
        .select("id, name")
        .order("name");

      if (!data || data.length <= 1) {
        const orgId = data?.[0]?.id || "";
        navigate(`/builder${orgId ? `?orgId=${orgId}` : ""}`, { replace: true });
        return;
      }

      setOrgs(data);
      setLoading(false);
    })();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 size={28} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src={logoSrc} alt="FeedLoop" className="h-8 w-auto object-contain" />
            <span className="text-lg font-extrabold tracking-tight text-slate-900">FeedLoop</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
          <h1 className="text-center text-xl font-extrabold text-slate-900">Select Organization</h1>
          <p className="mt-1.5 text-center text-sm text-slate-500">
            Choose which organization this form belongs to
          </p>

          <div className="mt-6 space-y-3">
            {orgs.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => navigate(`/builder?orgId=${org.id}`)}
                className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 text-left transition-all duration-200 hover:-translate-y-px hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-600">
                  <Building2 size={20} />
                </span>
                <span className="flex-1 text-sm font-semibold text-slate-900">{org.name}</span>
                <ArrowRight size={16} className="text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-500" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
