"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, ArrowRight, KeyRound, Loader2, Mail, Network } from "lucide-react";

export function AuthForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard", { replace: true });
    });
  }, [navigate]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "forgot") {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/reset-password`,
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      setSent(true);
      setLoading(false);
      return;
    }

    if (mode === "login") {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      if (data.user) await ensureProfile(data.user, email);
      navigate("/dashboard");
    } else {
      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      if (data.user) await ensureProfile(data.user, email);
      setMode("login");
      setError("Account created! Check your email to confirm, then log in.");
      setLoading(false);
    }
  };

  async function ensureProfile(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }, userEmail: string) {
    const meta = user.user_metadata || {};
    const { data: existing } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, phone, organization, job_title, bio")
      .eq("id", user.id)
      .maybeSingle();

    await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: userEmail,
        full_name: existing?.full_name || (meta.full_name as string) || (meta.name as string) || null,
        avatar_url: existing?.avatar_url || (meta.avatar_url as string) || (meta.picture as string) || null,
        phone: existing?.phone || null,
        organization: existing?.organization || null,
        job_title: existing?.job_title || null,
        bio: existing?.bio || null,
      },
      { onConflict: "id" }
    );
  }

  const handleOAuth = async (provider: "google" | "azure") => {
    setError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/dashboard` },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  };

  if (mode === "forgot") {
    return (
      <div className="space-y-5">
        <button type="button" onClick={() => { setMode("login"); setError(""); setSent(false); }} className="mb-1 inline-flex items-center gap-1 text-sm font-bold text-teal-700 hover:text-teal-800 dark:text-teal-300">
          <ArrowLeft size={16} /> Back to login
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!sent ? (
            <>
              <h2 className="text-xl font-black tracking-tight text-slate-900">Reset your password</h2>
              <p className="text-sm text-slate-500">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Email address</span>
                <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                  <Mail size={18} className="text-slate-400 shrink-0" />
                  <input
                    className="w-full bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
                    type="email"
                    placeholder="you@organization.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </span>
              </label>

              {error && (
                <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 text-sm font-bold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 disabled:opacity-60"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                Send reset link
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-teal-500/10 px-4 py-6 text-center">
                <h2 className="text-xl font-black tracking-tight text-teal-700">Check your email</h2>
                <p className="mt-2 text-sm text-teal-600">
                  We&apos;ve sent a password reset link to <strong>{email}</strong>. Click the link to set a new password.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white disabled:opacity-60"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                Resend reset link
              </button>
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/25">
          <Network size={22} />
        </span>
        <span className="mt-3 block text-lg font-black tracking-tight text-slate-900">FeedLoop</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Email address</span>
          <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
            <Mail size={18} className="text-slate-400 shrink-0" />
            <input
              className="w-full bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
              type="email"
              placeholder="you@organization.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
          <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
            <KeyRound size={18} className="text-slate-400 shrink-0" />
            <input
              className="w-full bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
              type="password"
              placeholder={mode === "login" ? "Enter your password" : "Create a password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </span>
          {mode === "login" && (
            <button type="button" onClick={() => { setMode("forgot"); setError(""); }} className="mt-1.5 text-xs font-semibold text-teal-600 underline underline-offset-2 hover:text-teal-700">
              Forgot password?
            </button>
          )}
        </label>

        {error && (
          <p className={`rounded-xl px-4 py-3 text-sm font-semibold ${error.includes("check your email") ? "bg-teal-500/10 text-teal-700" : "bg-red-500/10 text-red-700"}`}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 text-sm font-bold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
          {mode === "login" ? "Continue to dashboard" : "Create account"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>

        <button
          type="button"
          onClick={() => handleOAuth("azure")}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true">
            <rect x="2" y="2" width="9" height="9" rx="1.2" fill="#F25022" />
            <rect x="13" y="2" width="9" height="9" rx="1.2" fill="#7FBA00" />
            <rect x="2" y="13" width="9" height="9" rx="1.2" fill="#00A4EF" />
            <rect x="13" y="13" width="9" height="9" rx="1.2" fill="#FFB900" />
          </svg>
          Microsoft
        </button>
      </div>

      <p className="text-center text-sm text-slate-500">
        {mode === "login" ? (
          <>Don&apos;t have an account? <button type="button" onClick={() => { setMode("signup"); setError(""); }} className="font-semibold text-teal-600 underline underline-offset-2 hover:text-teal-700">Sign up</button></>
        ) : (
          <>Already have an account? <button type="button" onClick={() => { setMode("login"); setError(""); }} className="font-semibold text-teal-600 underline underline-offset-2 hover:text-teal-700">Log in</button></>
        )}
      </p>
    </div>
  );
}
