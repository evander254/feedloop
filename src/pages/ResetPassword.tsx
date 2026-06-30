import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowRight, KeyRound, Loader2, Lock, Network } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setReady(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    navigate("/login");
  };

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf7] px-5">
        <div className="text-center">
          <Loader2 size={32} className="mx-auto animate-spin text-emerald-600" />
          <p className="mt-4 text-sm text-slate-600">Verifying your reset link...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-6 text-slate-950 dark:text-white sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
            <Network size={22} />
          </span>
          <span className="text-lg font-black tracking-tight">FeedLoop</span>
        </Link>
      </div>

      <section className="mx-auto flex w-full max-w-md items-center py-20">
        <Card className="w-full p-5 sm:p-7">
          <div className="space-y-5">
            <div className="text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Lock size={24} className="text-emerald-600" />
              </span>
              <h1 className="mt-4 text-2xl font-black tracking-tight">Set new password</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Enter your new password below.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold">New password</span>
                <span className="flex items-center gap-3 rounded-2xl border border-emerald-900/10 bg-white/70 px-4 py-3 shadow-sm dark:bg-white/5">
                  <KeyRound size={18} className="text-slate-400 shrink-0" />
                  <input
                    className="w-full bg-transparent outline-none"
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
                <span className="mb-2 block text-sm font-bold">Confirm new password</span>
                <span className="flex items-center gap-3 rounded-2xl border border-emerald-900/10 bg-white/70 px-4 py-3 shadow-sm dark:bg-white/5">
                  <KeyRound size={18} className="text-slate-400 shrink-0" />
                  <input
                    className="w-full bg-transparent outline-none"
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
                <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 text-sm font-black text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                Update password
              </button>
            </form>
          </div>
        </Card>
      </section>
    </main>
  );
}
