import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-xl font-bold text-white shadow-lg shadow-emerald-500/20">
              {(fullName || email).slice(0, 2).toUpperCase()}
            </span>
            <h1 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900">
              {fullName || "Your Profile"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{email}</p>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleSave(); }}
            className="mt-8 space-y-4"
          >
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Full Name</span>
              <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10">
                <User size={16} className="shrink-0 text-slate-400" />
                <input
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Email</span>
              <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Mail size={16} className="shrink-0 text-slate-400" />
                <input type="email" value={email} disabled className="w-full bg-transparent text-sm text-slate-400 outline-none" />
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Phone</span>
                <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10">
                  <Phone size={16} className="shrink-0 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Organization</span>
                <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10">
                  <Building2 size={16} className="shrink-0 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Your organization"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </span>
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Job Title</span>
              <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10">
                <Briefcase size={16} className="shrink-0 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Program Manager, Field Officer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Bio</span>
              <span className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10">
                <FileText size={16} className="mt-0.5 shrink-0 text-slate-400" />
                <textarea
                  placeholder="Tell us a bit about yourself and your work..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full resize-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </span>
            </label>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>
            )}

            {success && (
              <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={16} /> {success}
              </p>
            )}

            <Button type="submit" loading={saving} icon={!saving && <Save size={16} />} className="w-full">
              Save Changes
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <Button
              type="button"
              variant="ghost"
              onClick={handleLogout}
              className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
