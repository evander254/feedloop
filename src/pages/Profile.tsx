import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/app-layout";
import {
  Loader2,
  Save,
  Mail,
  User,
  LogOut,
  Phone,
  Building2,
  Briefcase,
  FileText,
  CheckCircle2,
} from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login", { replace: true }); return; }

      setEmail(user.email || "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setFullName(profile.full_name || "");
        setPhone(profile.phone || "");
        setOrganization(profile.organization || "");
        setJobTitle(profile.job_title || "");
        setBio(profile.bio || "");
      }
      setLoading(false);
    })();
  }, [navigate]);

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email,
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        organization: organization.trim() || null,
        job_title: jobTitle.trim() || null,
        bio: bio.trim() || null,
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      setError(upsertError.message);
    } else {
      setSuccess("Profile saved");
      setTimeout(() => setSuccess(""), 2500);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
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

  return (
    <AppLayout>
      <div className="mx-auto max-w-xl px-4 py-8">
        <div className="rounded-xl bg-white p-6 shadow-md ring-1 ring-slate-200/60 sm:p-8">
          <div className="text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-xl font-bold text-white shadow-lg shadow-emerald-500/20">
              {(fullName || email).slice(0, 2).toUpperCase()}
            </span>
            <h1 className="mt-4 text-xl font-black text-slate-900">
              {fullName || "Your Profile"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{email}</p>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleSave(); }}
            className="mt-8 space-y-5"
          >
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Full Name</span>
              <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                <User size={18} className="shrink-0 text-slate-400" />
                <input
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Email</span>
              <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 shadow-sm">
                <Mail size={18} className="shrink-0 text-slate-400" />
                <input type="email" value={email} disabled className="w-full bg-transparent text-slate-500 outline-none" />
              </span>
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Phone</span>
                <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                  <Phone size={18} className="shrink-0 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Organization</span>
                <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                  <Building2 size={18} className="shrink-0 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Your organization"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
                  />
                </span>
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Job Title</span>
              <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                <Briefcase size={18} className="shrink-0 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Program Manager, Field Officer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Bio</span>
              <span className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                <FileText size={18} className="mt-0.5 shrink-0 text-slate-400" />
                <textarea
                  placeholder="Tell us a bit about yourself and your work..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full resize-none bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
                />
              </span>
            </label>

            {error && (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
            )}

            {success && (
              <p className="flex items-center gap-2 rounded-xl bg-teal-500/10 px-4 py-3 text-sm font-semibold text-teal-700">
                <CheckCircle2 size={16} /> {success}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Changes
            </button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
