import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileText,
  Globe,
  GraduationCap,
  HeartHandshake,
  Layers,
  Lock,
  Map,
  MessageSquare,
  Monitor,
  PenLine,
  Printer,
  QrCode,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import logoSrc from "@/assets/loop.png";

const features = [
  {
    icon: ClipboardList,
    title: "Build Powerful Forms Without Code",
    text: "Design registration forms, assessments, feedback forms, inspections, applications, and monitoring tools using an intuitive drag-and-drop builder.",
  },
  {
    icon: MessageSquare,
    title: "Launch Surveys & Polls in Minutes",
    text: "Create public or private surveys and opinion polls, share them through links or QR codes, and watch responses arrive in real time.",
  },
  {
    icon: Users,
    title: "Collaborate With Your Team",
    text: "Invite administrators, field officers, researchers, and analysts to work together securely with role-based permissions.",
  },
  {
    icon: TrendingUp,
    title: "Turn Responses Into Actionable Insights",
    text: "Automatically visualize responses with interactive dashboards, charts, maps, exports, and reports ready for donors, management, and stakeholders.",
  },
];

const workflowSteps = [
  { number: 1, title: "Create Your Workspace", text: "Register your organization and invite your team members." },
  { number: 2, title: "Build Your Form or Poll", text: "Create surveys using our no-code visual builder." },
  { number: 3, title: "Share Anywhere", text: "Distribute your survey via public link, QR code, email, or WhatsApp." },
  { number: 4, title: "Monitor Results Live", text: "Track submissions, analyze trends, and export reports instantly." },
];

const organizationTypes = [
  "NGOs",
  "Community-Based Organizations",
  "Government Agencies",
  "Universities",
  "Schools",
  "Research Institutions",
  "Healthcare Organizations",
  "Businesses",
  "Consultants",
];

const whyItems = [
  { icon: Zap, title: "Fast to Learn", text: "Create professional forms in minutes without technical skills." },
  { icon: Lock, title: "Secure by Design", text: "Encrypted storage, secure authentication, and role-based access controls." },
  { icon: Monitor, title: "Mobile Friendly", text: "Collect responses anywhere on any device." },
  { icon: BarChart3, title: "Real-Time Analytics", text: "See incoming responses as they happen with live dashboards." },
  { icon: Globe, title: "Works Anywhere", text: "Share via links, QR codes, email, social media, or embed on your website." },
  { icon: Printer, title: "Export Anytime", text: "Download responses as Excel, CSV, or PDF reports whenever you need them." },
];

const useCases = [
  "Beneficiary Registration",
  "Community Needs Assessments",
  "Baseline Surveys",
  "Endline Evaluations",
  "Monitoring & Evaluation (M&E)",
  "Customer Satisfaction Surveys",
  "Employee Feedback",
  "Event Registration",
  "Research Studies",
  "Public Opinion Polls",
  "Health Surveys",
  "Agricultural Data Collection",
  "School Assessments",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden text-slate-950">
      <header className="mx-auto flex w-full items-center justify-between px-3 py-2">
        <Link to="/" className="flex items-center" aria-label="FeedLoop home">
          <img src={logoSrc} alt="FeedLoop" className="h-11 w-auto object-contain" />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-bold text-slate-600 md:flex">
          <a href="#features" className="hover:text-emerald-700">Features</a>
          <a href="#workflow" className="hover:text-emerald-700">Workflow</a>
          <a href="#organizations" className="hover:text-emerald-700">For Teams</a>
          <a href="#security" className="hover:text-emerald-700">Security</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/login" className="rounded-full px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-emerald-500/10">
            Login
          </Link>
          <Link to="/login" className="hidden rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700 sm:inline-flex">
            Start Free
          </Link>
        </div>
      </header>

      <section className="mx-auto grid w-full gap-6 px-3 pb-8 pt-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <Badge><Sparkles size={14} className="mr-1" /> Enterprise data collection platform</Badge>
          <h1 className="mt-5 max-w-4xl text-[clamp(2.5rem,5vw,4.25rem)] font-black leading-[1.05] tracking-tight">
            Collect Better Data.<br />Make Better Decisions.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-7 text-slate-600">
            Create surveys, forms, polls, and field data collection projects that people actually complete.
            FeedLoop helps organizations gather reliable information, understand communities, and turn
            responses into meaningful insights—all from one secure, collaborative workspace.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/login" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 text-sm font-bold text-white shadow-xl shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700">
              Start Free <ArrowRight size={18} />
            </Link>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-emerald-600 px-6 text-sm font-bold text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              Book a Demo
            </a>
          </div>

          <div className="mt-7 grid max-w-xl gap-2.5 sm:grid-cols-2">
            {["No-code Form Builder", "Public & Private Surveys", "Live Analytics & Reports", "Secure Team Workspaces"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-xl border border-emerald-900/10 bg-white/60 px-4 py-2.5 text-sm font-semibold shadow-sm">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" /> {item}
              </div>
            ))}
          </div>
        </div>

        <Card className="relative overflow-hidden p-4 shadow-2xl shadow-black/5 sm:p-6">
          <div className="absolute -right-20 -top-20 size-56 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative rounded-[2rem] bg-slate-950 p-5 text-white shadow-2xl shadow-emerald-950/20">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-bold text-white/50">Dashboard Preview</p>
                <p className="text-lg font-black">Community Needs Assessment</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-400" /> Live Collection
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1.1fr]">
              <div className="rounded-2xl bg-white/[0.07] p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold text-emerald-200"><PenLine size={14} /> Survey Builder</div>
                {["Full Name", "Email Address", "Location", "Rating", "Feedback", "Photo Upload", "GPS Location"].map((field) => (
                  <div key={field} className="mb-2 rounded-xl border border-white/10 bg-white/[0.05] p-2.5">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Field</p>
                    <p className="text-xs font-bold">{field}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl bg-emerald-500 p-4 text-slate-950">
                  <p className="text-[11px] font-black uppercase tracking-[0.15em] text-emerald-950/60">Community Poll</p>
                  <h3 className="mt-2 text-sm font-black leading-snug">Which service should we improve first?</h3>
                  <div className="mt-4 space-y-2">
                    {["Faster response times", "Better communication", "More community outreach", "Additional support programs"].map((opt) => (
                      <div key={opt} className="flex items-center gap-2 rounded-xl bg-white/70 p-2.5 text-xs font-bold">
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-slate-950/30 bg-white" />
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/[0.07] p-3.5">
                    <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Responses</p>
                    <p className="text-xl font-black">12,843</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.07] p-3.5">
                    <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Completion</p>
                    <p className="text-xl font-black">86%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="border-y border-slate-100 bg-slate-50/50">
        <div className="mx-auto px-3 py-6">
          <div className="mx-auto max-w-3xl text-center">
            <Badge>Trusted Data Collection</Badge>
            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">For Every Organization</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Whether you&apos;re conducting community research, beneficiary registration, employee feedback,
              customer satisfaction surveys, or monitoring project impact, FeedLoop provides everything you
              need to collect accurate data and collaborate with your team.
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto px-3 py-6">
        <div className="mb-12 max-w-2xl">
          <Badge>Everything You Need</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">To Collect Meaningful Data</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <div className="mb-5 inline-flex rounded-2xl bg-emerald-500/10 p-3.5 text-emerald-700">
                <Icon size={24} />
              </div>
              <h3 className="text-lg font-black">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="workflow" className="bg-slate-950">
        <div className="mx-auto px-3 py-6 text-white">
          <div className="mb-12 max-w-2xl">
            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">A Simple Workflow</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              From account creation to live data collection in just a few minutes.
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="relative">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500 text-2xl font-black text-slate-950">
                  {step.number}
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-black">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">{step.text}</p>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">
                    <ArrowRight size={14} />
                  </span>
                  <span className="flex flex-wrap gap-1">
                    {"Share via:".split(", ").map((tag) => (
                      <span key={tag} className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/60">
                        {tag}
                      </span>
                    ))}
                  </span>
                </div>
                {index < workflowSteps.length - 1 && (
                  <div className="absolute -right-4 top-7 hidden text-emerald-500/30 md:block">
                    <ArrowRight size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="organizations" className="mx-auto px-3 py-6">
        <div className="mb-10 text-center">
          <Badge>Built for Organizations</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">That Need Reliable Data</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            FeedLoop is trusted by teams that depend on accurate information for decision-making.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {organizationTypes.map((org) => (
            <div key={org} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
              <CheckCircle2 size={16} className="text-emerald-600" />
              {org}
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50/50">
        <div className="mx-auto px-3 py-6">
          <div className="mb-6 text-center">
            <Badge>Why Organizations</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Choose FeedLoop</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {whyItems.map(({ icon: Icon, title, text }) => (
              <Card key={title}>
                <div className="mb-4 inline-flex rounded-xl bg-emerald-500/10 p-3 text-emerald-700">
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto px-3 py-6">
        <div className="mb-6">
          <Badge>Designed for</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Every Stage of Data Collection</h2>
          <p className="mt-3 text-slate-600">
            FeedLoop supports a wide range of projects across sectors and use cases.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {useCases.map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="security" className="bg-slate-950">
        <div className="mx-auto px-3 py-6 text-white">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm font-bold text-emerald-300">
              <ShieldCheck size={16} /> Security You Can Trust
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Your data belongs to you.</h2>
            <p className="mt-4 text-lg leading-relaxed text-white/60">
              FeedLoop protects your information with enterprise-grade security, secure authentication,
              encrypted data storage, automatic backups, and role-based permissions, ensuring only
              authorized users can access your organization&apos;s workspace.
            </p>
            <Link to="/login" className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-emerald-50">
              Start Free Today <ArrowRight size={18} />
            </Link>
            <p className="mt-3 text-xs text-white/40">No credit card required.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto px-3 py-6 text-center">
        <Badge>Get Started</Badge>
        <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
          Ready to Start Collecting Better Data?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
          Create your first survey today and discover how easy it is to collect reliable information,
          engage your audience, and generate reports that drive smarter decisions.
        </p>
        <Link to="/login" className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-600 px-7 text-sm font-bold text-white shadow-xl shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700">
          Start Free Today <ArrowRight size={18} />
        </Link>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex items-center justify-between px-3 py-3 text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="FeedLoop" className="h-7 w-auto object-contain" />
            <span className="font-semibold text-slate-700">FeedLoop</span>
          </div>
          <p>&copy; {new Date().getFullYear()} FeedLoop. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
