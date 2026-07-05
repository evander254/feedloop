import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ArrowRight, KeyRound, Loader2, Lock } from "lucide-react";
import logoSrc from "@/assets/loop.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) setReady(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) { setError(updateError.message); setLoading(false); return; }
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="text-center">
          <Loader2 size={28} className="mx-auto animate-spin text-emerald-600" />
          <p className="mt-4 text-sm text-slate-500">Verifying your reset link...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src={logoSrc} alt="FeedLoop" className="h-9 w-auto object-contain" />
            <span className="text-xl font-extrabold tracking-tight text-slate-900">FeedLoop</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
          <div className="text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50">
              <Lock size={24} className="text-emerald-600" />
            </span>
            <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">Set new password</h1>
            <p className="mt-1.5 text-sm text-slate-500">Enter your new password below.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">New password</span>
              <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10">
                <KeyRound size={16} className="shrink-0 text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Confirm new password</span>
              <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10">
                <KeyRound size={16} className="shrink-0 text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  type="password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </span>
            </label>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all duration-200 hover:-translate-y-px hover:bg-slate-800 hover:shadow-xl disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              Update password
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
