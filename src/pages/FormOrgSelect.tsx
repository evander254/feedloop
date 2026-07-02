import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Building2, Loader2, ArrowRight } from "lucide-react";

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
      <div className="flex min-h-screen items-center justify-center bg-[#f7faf7]">
        <Loader2 size={32} className="animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7faf7] p-4">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-black text-slate-900 text-center">Select Organization</h1>
        <p className="mt-1 text-sm text-slate-500 text-center">
          Choose which organization this form belongs to
        </p>
        <div className="mt-6 space-y-3">
          {orgs.map((org) => (
            <button
              key={org.id}
              type="button"
              onClick={() => navigate(`/builder?orgId=${org.id}`)}
              className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-teal-300 hover:shadow-md hover:-translate-y-0.5"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                <Building2 size={20} />
              </span>
              <span className="flex-1 text-sm font-semibold text-slate-900">{org.name}</span>
              <ArrowRight size={18} className="text-slate-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
