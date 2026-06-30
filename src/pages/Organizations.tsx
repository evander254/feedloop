import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/app-layout";
import {
  Plus,
  Save,
  Trash2,
  Building2,
  Loader2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CheckCircle2,
  Pencil,
  X,
  Upload,
  FileText,
} from "lucide-react";

interface Organization {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  website: string | null;
  created_at: string;
}

export default function Organizations() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchOrgs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login", { replace: true }); return; }

    const { data } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });

    setOrgs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrgs();
  }, [navigate]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setEmail("");
    setPhone("");
    setCountry("");
    setWebsite("");
    setLogoUrl("");
    setLogoFile(null);
    setLogoPreview(null);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const openEdit = (org: Organization) => {
    setName(org.name);
    setDescription(org.description || "");
    setEmail(org.email || "");
    setPhone(org.phone || "");
    setCountry(org.country || "");
    setWebsite(org.website || "");
    setLogoUrl(org.logo_url || "");
    setLogoPreview(org.logo_url || null);
    setEditingId(org.id);
    setShowForm(true);
    setError("");
  };

  const handleLogoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async (orgId: string): Promise<string | null> => {
    if (!logoFile) return logoUrl || null;
    setUploading(true);
    try {
      const ext = logoFile.name.split(".").pop();
      const path = `${orgId}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(path, logoFile, { upsert: true });

      if (uploadError) {
        console.error("Logo upload error:", uploadError);
        return logoUrl || null;
      }

      const { data: publicUrl } = supabase.storage
        .from("logos")
        .getPublicUrl(path);

      return publicUrl?.publicUrl || logoUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Organization name is required"); return; }
    setSaving(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    if (editingId) {
      const finalLogo = await uploadLogo(editingId);
      const { error: updateError } = await supabase
        .from("organizations")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          logo_url: finalLogo,
          email: email.trim() || null,
          phone: phone.trim() || null,
          country: country.trim() || null,
          website: website.trim() || null,
        })
        .eq("id", editingId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { data: org, error: insertError } = await supabase
        .from("organizations")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          country: country.trim() || null,
          website: website.trim() || null,
        })
        .select("id")
        .single();

      if (insertError || !org) {
        setError(insertError?.message || "Failed to create organization");
        setSaving(false);
        return;
      }

      const finalLogo = await uploadLogo(org.id);
      if (finalLogo) {
        await supabase.from("organizations").update({ logo_url: finalLogo }).eq("id", org.id);
      }

      await supabase.from("profiles").upsert(
        { id: user.id, organization_id: org.id },
        { onConflict: "id" }
      );
    }

    setSuccess(editingId ? "Organization updated" : "Organization created");
    setTimeout(() => setSuccess(""), 2500);
    resetForm();
    setSaving(false);
    fetchOrgs();
  };

  const handleDelete = async (id: string) => {
    await supabase.storage.from("logos").remove([`${id}/`]);
    const { error: deleteError } = await supabase
      .from("organizations")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setSuccess("Organization deleted");
      setTimeout(() => setSuccess(""), 2500);
      setOrgs((prev) => prev.filter((o) => o.id !== id));
    }
    setDeleteConfirm(null);
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
      <div className="">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">Organizations</h1>
            <p className="mt-0.5 text-sm text-slate-500">Manage your organizations and teams</p>
          </div>
          <button
            type="button"
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:from-teal-500 hover:to-emerald-500"
          >
            <Plus size={16} />
            New Organization
          </button>
        </div>

        {showForm && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? "Edit Organization" : "New Organization"}
              </h2>
              <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); handleSave(); }}
              className="space-y-4"
            >
              <div className="flex items-center gap-5">
                <label className="relative cursor-pointer group">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoPick}
                    className="hidden"
                  />
                  {logoPreview ? (
                    <div className="relative size-20 overflow-hidden rounded-2xl border-2 border-slate-200">
                      <img src={logoPreview} alt="Logo preview" className="size-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                        <Upload size={18} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex size-20 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 transition group-hover:border-teal-400 group-hover:bg-teal-50">
                      <Upload size={22} className="text-slate-400 group-hover:text-teal-600" />
                    </div>
                  )}
                </label>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Organization Logo</p>
                  <p className="text-xs text-slate-500">PNG, JPG, WebP or SVG. Square recommended.</p>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={() => { setLogoFile(null); setLogoPreview(null); setLogoUrl(""); }}
                      className="mt-1 text-xs font-semibold text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Organization Name *</span>
                <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                  <Building2 size={18} className="shrink-0 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Kenya Red Cross"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Description</span>
                <span className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                  <FileText size={18} className="mt-0.5 shrink-0 text-slate-400" />
                  <textarea
                    placeholder="Brief description of your organization..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full resize-none bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </span>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Email</span>
                  <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                    <Mail size={18} className="shrink-0 text-slate-400" />
                    <input
                      type="email"
                      placeholder="org@example.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
                    />
                  </span>
                </label>
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Country</span>
                  <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                    <MapPin size={18} className="shrink-0 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Kenya"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
                    />
                  </span>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Website</span>
                  <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                    <Globe size={18} className="shrink-0 text-slate-400" />
                    <input
                      type="url"
                      placeholder="https://example.org"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
                    />
                  </span>
                </label>
              </div>

              {error && (
                <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="flex-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50"
                >
                  {saving || uploading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {editingId ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="min-h-11 rounded-xl border border-slate-200 px-6 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-teal-500/10 px-4 py-3 text-sm font-semibold text-teal-700">
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        {orgs.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center">
            <Building2 size={40} className="mx-auto text-slate-300" />
            <h2 className="mt-4 text-lg font-bold text-slate-700">No organizations yet</h2>
            <p className="mt-1 text-sm text-slate-500">
              Create your first organization to start organizing your forms and polls.
            </p>
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(true); }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:from-teal-500 hover:to-emerald-500"
            >
              <Plus size={16} />
              Create Organization
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orgs.map((org) => (
              <div
                key={org.id}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {org.logo_url ? (
                      <img
                        src={org.logo_url}
                        alt={org.name}
                        className="size-10 shrink-0 rounded-xl border border-slate-200 object-cover"
                      />
                    ) : (
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 text-sm font-bold text-white shadow-sm">
                        {org.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{org.name}</h3>
                      {org.description && (
                        <p className="mt-0.5 text-sm text-slate-500 line-clamp-2">{org.description}</p>
                      )}
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        {org.email && <span className="flex items-center gap-1"><Mail size={12} /> {org.email}</span>}
                        {org.phone && <span className="flex items-center gap-1"><Phone size={12} /> {org.phone}</span>}
                        {org.country && <span className="flex items-center gap-1"><MapPin size={12} /> {org.country}</span>}
                        {org.website && <span className="flex items-center gap-1"><Globe size={12} /> {org.website}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(org)}
                      className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Pencil size={15} />
                    </button>
                    {deleteConfirm === org.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(org.id)}
                          className="rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-red-600"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(null)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(org.id)}
                        className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
