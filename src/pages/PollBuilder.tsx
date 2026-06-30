import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/app-layout";
import {
  Plus,
  Save,
  Trash2,
  Copy,
  Check,
  Loader2,
  Share2,
  Building2,
  Send,
  Clock,
  Calendar,
  FileText,
  Image,
  X,
  Upload,
} from "lucide-react";

function toLocalDatetime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface OptionItem {
  id: string | null;
  text: string;
  file: File | null;
  preview: string;
  existingImageUrl: string;
}

function createOption(text = ""): OptionItem {
  return { id: null, text, file: null, preview: "", existingImageUrl: "" };
}

export default function PollBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const isEditing = !!editId;
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<OptionItem[]>([createOption()]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [savedPollId, setSavedPollId] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [error, setError] = useState("");
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [organizationId, setOrganizationId] = useState("");

  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [schedule, setSchedule] = useState(false);
  const [publishAt, setPublishAt] = useState("");
  const [isTimed, setIsTimed] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    supabase.from("organizations").select("id, name").order("name").then(({ data }) => {
      if (data) setOrgs(data);
    });
  }, []);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data: poll } = await supabase
        .from("polls")
        .select("*")
        .eq("id", editId)
        .single();
      if (!poll) { setLoading(false); return; }

      setTitle(poll.title);
      setDescription(poll.description || "");
      setOrganizationId(poll.organization_id || "");
      setStatus(poll.is_public ? "published" : "draft");
      setIsTimed(poll.is_timed || false);
      setStartDate(toLocalDatetime(poll.start_date));
      setEndDate(toLocalDatetime(poll.end_date));
      if (poll.publish_at) {
        setSchedule(true);
        setPublishAt(toLocalDatetime(poll.publish_at));
      }

      const { data: optRows } = await supabase
        .from("poll_options")
        .select("id, option_text, image_url")
        .eq("poll_id", editId)
        .order("id");

      if (optRows && optRows.length > 0) {
        setOptions(
          optRows.map((o) => ({
            id: o.id,
            text: o.option_text,
            file: null,
            preview: o.image_url || "",
            existingImageUrl: o.image_url || "",
          }))
        );
      }
      setLoading(false);
    })();
  }, [editId]);

  const addOption = () => {
    setOptions((prev) => [...prev, createOption()]);
  };

  const updateOptionText = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, text: value } : o)));
  };

  const handleImagePick = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOptions((prev) =>
      prev.map((o, i) =>
        i === index ? { ...o, file, preview: URL.createObjectURL(file), existingImageUrl: "" } : o
      )
    );
  };

  const removeImage = (index: number) => {
    setOptions((prev) =>
      prev.map((o, i) => (i === index ? { ...o, file: null, preview: "", existingImageUrl: "" } : o))
    );
  };

  const removeOption = (index: number) => {
    if (options.length <= 1) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadOptionImage = async (pollId: string, index: number, file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${pollId}/${index}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("polls")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      throw new Error(`Image upload failed: ${uploadError.message}`);
    }

    const { data: publicUrl } = supabase.storage
      .from("polls")
      .getPublicUrl(path);

    return publicUrl?.publicUrl || null;
  };

  const handleSave = async () => {
    if (!title.trim()) { setError("Poll title is required"); return; }
    const validOptions = options.filter((o) => o.text.trim());
    if (validOptions.length < 2) { setError("Add at least 2 options"); return; }
    setSaving(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim() || null,
      organization_id: organizationId || null,
      is_public: status === "published",
      is_timed: isTimed,
      start_date: isTimed && startDate ? new Date(startDate).toISOString() : null,
      end_date: isTimed && endDate ? new Date(endDate).toISOString() : null,
      publish_at: schedule && publishAt ? new Date(publishAt).toISOString() : null,
    };

    let pollId: string;

    try {
      if (isEditing && editId) {
        const { error: updateError } = await supabase
          .from("polls")
          .update(payload)
          .eq("id", editId);

        if (updateError) throw new Error(updateError.message);
        pollId = editId;

        for (let i = 0; i < validOptions.length; i++) {
          const opt = validOptions[i];

          if (opt.id) {
            let imageUrl = opt.existingImageUrl || null;
            if (opt.file) {
              const uploaded = await uploadOptionImage(pollId, i, opt.file);
              if (uploaded) imageUrl = uploaded;
            }
            const { error: upError } = await supabase
              .from("poll_options")
              .update({ option_text: opt.text, image_url: imageUrl })
              .eq("id", opt.id);
            if (upError) throw new Error(`Failed to update option: ${upError.message}`);
          } else {
            let imageUrl = null;
            if (opt.file) {
              const uploaded = await uploadOptionImage(pollId, i, opt.file);
              if (uploaded) imageUrl = uploaded;
            }
            const { error: insError } = await supabase
              .from("poll_options")
              .insert({ poll_id: pollId, option_text: opt.text, image_url: imageUrl });
            if (insError) throw new Error(`Failed to insert option: ${insError.message}`);
          }
        }

        const deletedIds = options
          .filter((o) => o.id && !validOptions.some((v) => v.id === o.id))
          .map((o) => o.id as string);

        for (const did of deletedIds) {
          await supabase.from("poll_options").delete().eq("id", did);
        }
      } else {
        const { data: poll, error: insertError } = await supabase
          .from("polls")
          .insert({ ...payload, created_by: user.id })
          .select("id")
          .single();

        if (insertError || !poll) throw new Error(insertError?.message || "Failed to create poll");
        pollId = poll.id;

        const optionRows = await Promise.all(
          validOptions.map(async (opt, i) => {
            let imageUrl = null;
            if (opt.file) {
              const uploaded = await uploadOptionImage(pollId, i, opt.file);
              if (uploaded) imageUrl = uploaded;
            }
            return { poll_id: pollId, option_text: opt.text, image_url: imageUrl };
          })
        );

        const { error: optionsError } = await supabase
          .from("poll_options")
          .insert(optionRows);

        if (optionsError) throw new Error(`Failed to save options: ${optionsError.message}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setSaving(false);
      return;
    }

    setSavedPollId(pollId);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!editId) return;
    setSaving(true);
    await supabase.storage.from("polls").remove([`${editId}/`]);
    await supabase.from("poll_options").delete().eq("poll_id", editId);
    await supabase.from("poll_votes").delete().eq("poll_id", editId);
    await supabase.from("polls").delete().eq("id", editId);
    navigate("/polls");
  };

  const shareUrl = savedPollId
    ? `${window.location.origin}/poll/${savedPollId}`
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

  if (savedPollId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-200/60">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-teal-100 text-teal-600">
              <Share2 size={28} />
            </span>
            <h1 className="mt-4 text-xl font-black text-slate-900">
              {isEditing ? "Poll updated!" : "Poll created!"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isEditing ? "Your changes have been saved." : "Share this link with people to collect votes."}
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
                onClick={() => navigate(`/polls/${savedPollId}/results`)}
                className="flex-1 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-teal-500 hover:to-emerald-500"
              >
                View Results
              </button>
              <button
                type="button"
                onClick={() => navigate("/polls")}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                All Polls
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
                {isEditing ? "Edit Poll" : "Poll Builder"}
              </h1>
              {isEditing && (
                <p className="text-xs text-slate-500">Editing: {title || "untitled"}</p>
              )}
            </div>
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

          {deleteConfirm && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">
                Are you sure you want to delete this poll? All votes and images will be permanently removed.
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
              <span className="mb-1.5 block text-sm font-bold text-slate-800">Poll Title</span>
              <input
                type="text"
                placeholder="e.g. Preferred Meeting Time"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300"
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-bold text-slate-800">Description</span>
              <textarea
                placeholder="Optional description..."
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
                <span className="text-sm font-bold text-slate-800">Timed poll</span>
                <p className="text-xs text-slate-500">Set a start and end date for this poll</p>
              </div>
            </label>

            {isTimed && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Start Date</span>
                  <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                    <Clock size={18} className="shrink-0 text-slate-400" />
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-transparent outline-none text-sm text-slate-900"
                    />
                  </span>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">End Date</span>
                  <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                    <Clock size={18} className="shrink-0 text-slate-400" />
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-transparent outline-none text-sm text-slate-900"
                    />
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white shadow-md shadow-black/[0.02] ring-1 ring-slate-200/60">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <h2 className="text-sm font-bold text-slate-800">Poll Options</h2>
              <span className="text-xs text-slate-400">
                {options.filter((o) => o.text.trim()).length} option
                {options.filter((o) => o.text.trim()).length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-3 px-3 py-2">
              {options.map((opt, index) => (
                <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/30 p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      value={opt.text}
                      onChange={(e) => updateOptionText(index, e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300"
                    />
                    {options.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="flex size-8 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <input
                      ref={(el) => { fileInputRefs.current[index] = el; }}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                      onChange={(e) => handleImagePick(index, e)}
                      className="hidden"
                    />
                    {opt.preview ? (
                      <div className="relative shrink-0">
                        <img
                          src={opt.preview}
                          alt=""
                          className="size-16 rounded-lg border border-slate-200 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[index]?.click()}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-teal-400 hover:text-teal-600"
                      >
                        <Image size={14} />
                        Add Image
                      </button>
                    )}
                    {opt.preview && (
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[index]?.click()}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                      >
                        Change
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 px-3 py-2">
              <button
                type="button"
                onClick={addOption}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-teal-300 hover:text-teal-700"
              >
                <Plus size={14} />
                Add Option
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 text-center">{error}</p>
          )}

          <div className="flex justify-center gap-3 pb-6">
            {schedule ? (
              <button
                type="button"
                onClick={handleSave}
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
                  onClick={handleSave}
                  disabled={saving || !title.trim()}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 px-8 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={handleSave}
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
