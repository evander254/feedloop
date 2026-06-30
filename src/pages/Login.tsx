import { Card } from "@/components/ui/card";
import { AuthForm } from "@/components/auth-form";
import logoSrc from "@/assets/loop.png";

export default function Login() {
  return (
    <main className="relative flex min-h-dvh overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80)",
        }}
      />
      <div className="absolute inset-0 bg-white/55 backdrop-blur-sm" />

      <div className="relative mx-auto flex w-full items-center gap-6 px-3 py-2 max-lg:flex-col max-lg:justify-center max-lg:py-2">
        <div className="hidden max-w-xl flex-1 lg:block">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="FeedLoop" className="h-10 w-auto object-contain" />
          </div>

          <h1 className="mt-8 text-[clamp(2rem,4vw,3.25rem)] font-black leading-[1.1] tracking-tight text-slate-900">
            Your data, one dashboard away.
          </h1>

          <p className="mt-4 max-w-lg text-lg leading-relaxed text-slate-600">
            Build surveys, publish polls, and track responses — all from a
            single secure workspace.
          </p>
        </div>

        <div className="w-[420px] shrink-0 max-lg:w-full max-lg:max-w-sm">
          <Card className="p-4 shadow-2xl shadow-black/5">
            <AuthForm />
          </Card>
        </div>
      </div>
    </main>
  );
}
