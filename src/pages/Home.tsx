import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Globe,
  Layers,
  Lock,
  MessageSquare,
  PenLine,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import logoSrc from "@/assets/loop.png";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#workflow" },
  { label: "FAQ", href: "#faq" },
];

const features = [
  {
    icon: ClipboardList,
    title: "No-Code Form Builder",
    description:
      "Design registration forms, assessments, feedback forms, inspections, and applications with an intuitive drag-and-drop builder. No technical skills required.",
  },
  {
    icon: MessageSquare,
    title: "Surveys & Polls",
    description:
      "Launch public or private surveys and opinion polls in minutes. Share via links, QR codes, email, or embed them directly on your website.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Invite administrators, field officers, researchers, and analysts. Work together securely with role-based permissions and shared workspaces.",
  },
  {
    icon: BarChart3,
    title: "Live Analytics",
    description:
      "Visualize responses with interactive dashboards, charts, maps, and exports. See incoming data as it happens and generate reports instantly.",
  },
  {
    icon: Globe,
    title: "Works Anywhere",
    description:
      "Collect responses on any device, anywhere. Mobile-friendly forms ensure high completion rates even in low-connectivity environments.",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description:
      "Encrypted storage, secure authentication, automatic backups, and role-based access controls protect your organization's data at every level.",
  },
];

const faqs = [
  {
    question: "Is FeedLoop free to use?",
    answer:
      "Yes. FeedLoop offers a generous free tier that includes unlimited forms, surveys, and polls for small teams. Paid plans unlock advanced analytics, larger team seats, and priority support for growing organizations.",
  },
  {
    question: "Do I need technical skills to create forms?",
    answer:
      "Not at all. FeedLoop's visual builder lets anyone create professional forms and surveys using drag-and-drop. No coding, no complicated setup—just build, share, and collect.",
  },
  {
    question: "Can I collect data offline?",
    answer:
      "Yes. FeedLoop supports offline data collection on mobile devices. Responses are stored locally and automatically sync when connectivity is restored, ensuring no data is lost in the field.",
  },
  {
    question: "How secure is my data?",
    answer:
      "FeedLoop uses enterprise-grade encryption for data at rest and in transit. We support secure authentication, role-based access controls, automatic backups, and compliance with data protection regulations.",
  },
  {
    question: "Can I export my responses?",
    answer:
      "Absolutely. Export your data anytime as Excel, CSV, or PDF reports. Raw data and formatted reports are both available, making it easy to share insights with stakeholders and donors.",
  },
  {
    question: "What types of organizations use FeedLoop?",
    answer:
      "FeedLoop is trusted by NGOs, government agencies, universities, healthcare organizations, research institutions, businesses, and community-based organizations across 40+ countries.",
  },
];

const trustedLogos = [
  { name: "Acme Corp", width: 96 },
  { name: "Globex", width: 80 },
  { name: "Initech", width: 88 },
  { name: "Umbrella", width: 104 },
  { name: "Stark Ind", width: 92 },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleFaq = useCallback((index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      {/* ─── Sticky Header ─── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2" aria-label="FeedLoop home">
            <img src={logoSrc} alt="FeedLoop" className="h-8 w-auto object-contain" />
            <span className="text-lg font-bold tracking-tight text-slate-900">FeedLoop</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-500 transition-colors duration-200 hover:text-slate-900"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-slate-900 sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              to="/login"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:bg-slate-800 hover:shadow-lg active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
            >
              Get Started
            </Link>

            {/* Mobile menu button */}
            <button
              className="inline-flex size-11 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                {mobileMenuOpen ? (
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                ) : (
                  <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden border-t border-slate-100 md:hidden"
            >
              <nav className="flex flex-col gap-1 px-6 py-4" aria-label="Mobile navigation">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    {link.label}
                  </a>
                ))}
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 sm:hidden"
                >
                  Log in
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── Hero Section ─── */}
      <section className="landing-section">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            {/* Left: Copy */}
            <div className="stagger-children max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700">
                <Sparkles size={14} />
                Enterprise data collection platform
              </div>

              <h1 className="mt-8 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 text-balance sm:text-5xl lg:text-[3.5rem]">
                Collect Better Data.
                <br />
                Make Better Decisions.
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-slate-500">
                Create surveys, forms, polls, and field data collection projects that people actually complete. FeedLoop helps organizations gather reliable information, understand communities, and turn responses into meaningful insights.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/login"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-7 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all duration-200 hover:-translate-y-px hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                >
                  Start Free <ArrowRight size={16} />
                </Link>
                <a
                  href="#features"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-7 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-px hover:border-slate-300 hover:shadow-md active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
                >
                  See How It Works
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  Free forever for small teams
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  Setup in under 2 minutes
                </span>
              </div>
            </div>

            {/* Right: Product Mockup */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-50 to-slate-50 opacity-60" />
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/5">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="size-2.5 rounded-full bg-slate-200" />
                    <span className="size-2.5 rounded-full bg-slate-200" />
                    <span className="size-2.5 rounded-full bg-slate-200" />
                  </div>
                  <div className="ml-3 flex-1 rounded-md bg-slate-100 px-3 py-1 text-xs text-slate-400">
                    app.feedloop.io/dashboard
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Dashboard
                      </p>
                      <p className="mt-0.5 text-base font-bold text-slate-900">
                        Community Needs Assessment
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Live
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="mb-4 grid grid-cols-3 gap-3">
                    {[
                      { label: "Responses", value: "12,843", change: "+18%" },
                      { label: "Completion", value: "86%", change: "+4%" },
                      { label: "Avg. Time", value: "3.2m", change: "-12%" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-slate-100 p-3"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          {stat.label}
                        </p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {stat.value}
                        </p>
                        <p className="text-[10px] font-semibold text-emerald-600">
                          {stat.change}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Chart placeholder */}
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Responses Over Time
                    </p>
                    <div className="flex items-end gap-1.5" style={{ height: 80 }}>
                      {[40, 55, 45, 70, 60, 85, 75, 90, 80, 95, 88, 100].map(
                        (h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t bg-emerald-500/20 transition-all duration-300 hover:bg-emerald-500/40"
                            style={{ height: `${h}%` }}
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Social Proof ─── */}
      <section className="border-y border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
            Trusted by organizations worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {trustedLogos.map((logo) => (
              <div
                key={logo.name}
                className="flex items-center gap-2 opacity-40 grayscale transition-all duration-200 hover:opacity-70 hover:grayscale-0"
              >
                <svg
                  width={logo.width}
                  height="28"
                  viewBox={`0 0 ${logo.width} 28`}
                  fill="none"
                >
                  <rect
                    x="0"
                    y="4"
                    width="20"
                    height="20"
                    rx="4"
                    fill="currentColor"
                    className="text-slate-900"
                  />
                  <text
                    x="26"
                    y="19"
                    className="fill-current text-slate-900"
                    fontSize="12"
                    fontWeight="700"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    {logo.name}
                  </text>
                </svg>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section id="features" className="landing-section">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700">
              <Layers size={14} />
              Everything You Need
            </div>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 text-balance sm:text-4xl">
              Built for teams that depend on reliable data
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-500">
              From field data collection to stakeholder reporting, FeedLoop gives your organization the tools to gather, analyze, and act on information that matters.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div className="group relative h-full rounded-2xl border border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/5 focus-within:ring-2 focus-within:ring-emerald-500/20">
                  <div className="mb-5 inline-flex rounded-xl bg-slate-900 p-3 text-white transition-colors duration-300 group-hover:bg-emerald-600">
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-500">
                    {description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="workflow" className="border-y border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-16 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700">
              <Zap size={14} />
              Simple Workflow
            </div>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 text-balance sm:text-4xl">
              From sign-up to live data collection in minutes
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create Your Workspace",
                text: "Register your organization and invite your team members with a single link.",
                icon: Users,
              },
              {
                step: "02",
                title: "Build Your Form or Survey",
                text: "Use our no-code visual builder to design forms, surveys, and polls in minutes.",
                icon: PenLine,
              },
              {
                step: "03",
                title: "Share & Collect Responses",
                text: "Distribute via public link, QR code, email, or embed. Responses arrive in real time.",
                icon: Globe,
              },
            ].map(({ step, title, text, icon: Icon }, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative"
              >
                <div className="mb-5 flex items-center gap-4">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                    {step}
                  </span>
                  {index < 2 && (
                    <div className="hidden h-px flex-1 bg-slate-200 md:block" />
                  )}
                </div>
                <div className="inline-flex rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
                  <Icon size={18} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ─── */}
      <section id="faq" className="landing-section">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700">
              <MessageSquare size={14} />
              Frequently Asked Questions
            </div>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 text-balance sm:text-4xl">
              Everything you need to know
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className={`rounded-xl border transition-all duration-200 ${
                    isOpen
                      ? "border-emerald-200 bg-emerald-50/30 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="flex min-h-[56px] w-full items-center justify-between gap-4 px-6 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-semibold text-slate-900">
                      {faq.question}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="shrink-0 text-slate-400"
                    >
                      <ChevronDown size={18} />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 text-sm leading-relaxed text-slate-500">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="border-t border-slate-100 bg-slate-950">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <ShieldCheck size={32} className="mx-auto mb-6 text-emerald-400" />
          <h2 className="text-3xl font-extrabold tracking-tight text-white text-balance sm:text-4xl">
            Ready to start collecting better data?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-400">
            Join hundreds of organizations using FeedLoop to gather reliable information, engage communities, and drive smarter decisions.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-white px-7 text-sm font-semibold text-slate-900 shadow-xl transition-all duration-200 hover:-translate-y-px hover:bg-emerald-50 hover:shadow-2xl active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Get Started Free <ArrowRight size={16} />
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            No credit card required. Free forever for small teams.
          </p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <img src={logoSrc} alt="FeedLoop" className="h-6 w-auto object-contain" />
              <span className="text-sm font-semibold text-slate-700">FeedLoop</span>
            </div>
            <nav className="flex items-center gap-6" aria-label="Footer navigation">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-slate-400 transition-colors hover:text-slate-600"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} FeedLoop. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
