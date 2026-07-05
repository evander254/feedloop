import { AuthForm } from "@/components/auth-form";
import logoSrc from "@/assets/loop.png";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <main className="relative flex min-h-dvh overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-teal-900/30 to-emerald-800/40 backdrop-blur-sm" />

      <div className="relative mx-auto flex w-full max-w-6xl items-center gap-12 px-6 py-8 max-lg:flex-col max-lg:justify-center max-lg:gap-8">
        {/* Left: Copy */}
        <div className="hidden max-w-xl flex-1 lg:block">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoSrc} alt="FeedLoop" className="h-9 w-auto object-contain" />
            <span className="text-xl font-extrabold tracking-tight text-white">FeedLoop</span>
          </Link>

          <h1 className="mt-10 text-[clamp(2rem,4vw,3.25rem)] font-extrabold leading-[1.1] tracking-tight text-white">
            Your data, one dashboard away.
          </h1>

          <p className="mt-5 max-w-lg text-lg leading-relaxed text-emerald-100/60">
            Build surveys, publish polls, and track responses — all from a
            single secure workspace.
          </p>

          <div className="mt-8 space-y-3">
            {["No-code form builder", "Real-time analytics", "Enterprise security"].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-emerald-100/70">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 backdrop-blur-sm">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Auth Card */}
        <div className="w-full max-w-[420px] max-lg:max-w-sm">
          <div className="rounded-2xl border border-white/20 bg-white/30 backdrop-blur-xl p-6 shadow-2xl shadow-emerald-900/10">
            <AuthForm />
          </div>
        </div>
      </div>
    </main>
  );
}
