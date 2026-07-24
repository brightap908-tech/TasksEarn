import React from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle,
  CircleDollarSign,
  Clock,
  Eye,
  HeadphonesIcon,
  HeartHandshake,
  Landmark,
  Lock,
  Megaphone,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

export interface AboutPageStats {
  earnersCount: number;
  advertisersCount: number;
  tasksCompleted: number;
  successfulWithdrawals: number;
  totalPaidOut: number;
  launchDate: string;
}

interface AboutPageProps {
  onNavigate?: (view: string) => void;
  publicStats: AboutPageStats;
}

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: "opacity 600ms ease, transform 600ms ease",
      }}
    >
      {children}
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  boxShadow: "0 8px 28px rgba(37,99,235,0.07)",
  borderRadius: "1.5rem",
};

export default function AboutPage({ onNavigate, publicStats }: AboutPageProps) {
  const formatNumber = (value: number) => value.toLocaleString("en-NG");
  const formatMoney = (value: number) =>
    `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

  const statCards = [
    { label: "Registered Earners", value: formatNumber(publicStats.earnersCount), icon: <Users className="h-5 w-5" /> },
    { label: "Registered Advertisers", value: formatNumber(publicStats.advertisersCount), icon: <Megaphone className="h-5 w-5" /> },
    { label: "Tasks Completed", value: formatNumber(publicStats.tasksCompleted), icon: <CheckCircle className="h-5 w-5" /> },
    { label: "Successful Withdrawals", value: formatNumber(publicStats.successfulWithdrawals), icon: <Landmark className="h-5 w-5" /> },
    { label: "Total Amount Paid Out", value: formatMoney(publicStats.totalPaidOut), icon: <CircleDollarSign className="h-5 w-5" /> },
    { label: "Platform Launch Date", value: publicStats.launchDate, icon: <CalendarDays className="h-5 w-5" /> },
  ];

  const reasons = [
    { title: "Secure and trusted platform", desc: "Your account, wallet, and task activity are handled with care and clear records.", icon: <Lock /> },
    { title: "Genuine earning opportunities", desc: "Complete real tasks for real advertisers and build income from simple online actions.", icon: <BadgeCheck /> },
    { title: "Transparent task verification", desc: "Proof-based reviews help protect both earners and advertisers from unfair activity.", icon: <CheckCircle /> },
    { title: "Fast withdrawal processing", desc: "Move approved earnings from your TasksEarn wallet to a Nigerian bank account.", icon: <Clock /> },
    { title: "Built for everyday devices", desc: "A responsive experience that works smoothly on smartphones, tablets, and computers.", icon: <Smartphone /> },
    { title: "Reliable customer support", desc: "Get help when you need it from a team focused on a better platform experience.", icon: <HeadphonesIcon /> },
  ];

  const coreValues = [
    { title: "Trust", icon: <ShieldCheck /> },
    { title: "Transparency", icon: <Eye /> },
    { title: "Fairness", icon: <HeartHandshake /> },
    { title: "Innovation", icon: <Sparkles /> },
    { title: "Community Growth", icon: <TrendingUp /> },
    { title: "Customer Satisfaction", icon: <Star /> },
  ];

  const audiences = [
    {
      title: "For advertisers",
      icon: <Megaphone />,
      color: "#1D4ED8",
      background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)",
      items: [
        "Promote your business to real Nigerian users.",
        "Increase followers, subscribers, downloads, website traffic, reviews, and engagement.",
        "Launch campaigns easily and track their performance.",
      ],
    },
    {
      title: "For earners",
      icon: <Wallet />,
      color: "#047857",
      background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)",
      items: [
        "Complete simple online tasks.",
        "Upload proof for verification.",
        "Earn rewards directly into your TasksEarn wallet.",
        "Withdraw to any Nigerian bank account after reaching the minimum withdrawal threshold.",
      ],
    },
  ];

  return (
    <article className="space-y-7">
      <Reveal>
        <section
          className="relative overflow-hidden rounded-[1.75rem] p-6 sm:p-9 lg:p-12"
          style={{ background: "linear-gradient(135deg,#0F3B9D 0%,#1D4ED8 58%,#2563EB 100%)", boxShadow: "0 18px 50px rgba(29,78,216,0.22)" }}
        >
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border-[28px] border-white/10" />
          <div className="absolute -bottom-32 right-20 h-72 w-72 rounded-full border-[40px] border-white/5" />
          <div className="relative max-w-3xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-100">
              <ShieldCheck className="h-3.5 w-3.5" /> Built for trust. Designed for growth.
            </span>
            <h2 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
              Simple tasks. Real opportunities. A stronger digital economy.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
              TasksEarn is a Nigerian microtask marketplace connecting advertisers with real users who complete simple online tasks for rewards.
              We help businesses grow their online presence while giving individuals a genuine way to earn extra income from a smartphone or computer.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => onNavigate?.("register")} className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-lg transition-transform hover:-translate-y-0.5 cursor-pointer">
                Join TasksEarn <ArrowRight className="ml-1 inline h-4 w-4" />
              </button>
              <button onClick={() => onNavigate?.("how-it-works")} className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20 cursor-pointer">
                See how it works
              </button>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal className="grid gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
        <div style={card} className="p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Target className="h-5 w-5" /></div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">About TasksEarn</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>A marketplace built around people</h2>
            </div>
          </div>
          <p className="text-sm leading-7 text-slate-600">
            We believe online work should be accessible, clear, and rewarding. TasksEarn gives businesses a practical way to reach real people and gives earners a dependable place to discover legitimate digital opportunities.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Every campaign, proof submission, wallet credit, and withdrawal is part of a system designed around accountability. Our goal is not just to connect two sides of a marketplace, but to make every interaction feel fair and easy to understand.
          </p>
        </div>
        <div className="flex flex-col justify-between rounded-3xl border border-blue-100 bg-blue-50/70 p-6 sm:p-8">
          <div>
            <div className="mb-5 inline-flex rounded-xl bg-white p-3 text-blue-600 shadow-sm"><CalendarDays className="h-5 w-5" /></div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Our journey begins</p>
            <p className="mt-2 text-3xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>1st July, 2026</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">The day TasksEarn launched with a clear commitment to legitimate earning opportunities and meaningful business growth.</p>
          </div>
          <div className="mt-7 flex items-center gap-3 border-t border-blue-200/70 pt-5 text-xs font-semibold text-blue-800">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600 shadow-[0_0_0_5px_rgba(37,99,235,0.12)]" />
            Launched on 1st July, 2026
          </div>
        </div>
      </Reveal>

      <Reveal>
        <section aria-labelledby="platform-statistics" className="rounded-3xl bg-slate-950 p-6 sm:p-8 lg:p-9">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-400">Live platform data</p>
              <h2 id="platform-statistics" className="mt-2 text-2xl font-bold text-white sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>TasksEarn in numbers</h2>
            </div>
            <p className="max-w-xs text-xs leading-5 text-slate-400">Updated automatically from activity recorded on the TasksEarn platform.</p>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {statCards.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition-colors hover:bg-white/[0.1]">
                <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">{stat.icon}</div>
                <p className="break-words text-xl font-bold text-white sm:text-2xl" style={{ fontFamily: "var(--font-display)" }}>{stat.value}</p>
                <p className="mt-1 text-[11px] font-medium leading-4 text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal className="grid gap-5 md:grid-cols-2">
        <div style={card} className="border-l-4 border-l-blue-600 p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Target className="h-5 w-5" /></div><h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>Our mission</h2></div>
          <p className="text-sm leading-7 text-slate-600">To build Nigeria&apos;s most trusted microtask platform by providing legitimate earning opportunities for users while helping businesses achieve real online engagement. We are committed to transparency, fairness, security, and timely payments.</p>
        </div>
        <div style={card} className="border-l-4 border-l-indigo-500 p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-indigo-50 p-3 text-indigo-600"><Eye className="h-5 w-5" /></div><h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>Our vision</h2></div>
          <p className="text-sm leading-7 text-slate-600">To become Africa&apos;s leading microtask marketplace where businesses connect with real users and individuals earn from legitimate online opportunities.</p>
        </div>
      </Reveal>

      <Reveal>
        <section aria-labelledby="what-we-offer">
          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">One platform, two possibilities</p>
            <h2 id="what-we-offer" className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>What we offer</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {audiences.map((audience) => (
              <div key={audience.title} className="rounded-3xl p-6 sm:p-8" style={{ background: audience.background, border: "1px solid rgba(148,163,184,0.18)" }}>
                <div className="mb-6 flex items-center gap-3"><div className="rounded-xl bg-white p-3 shadow-sm" style={{ color: audience.color }}>{audience.icon}</div><h3 className="text-xl font-bold capitalize text-slate-900" style={{ fontFamily: "var(--font-display)" }}>{audience.title}</h3></div>
                <ul className="space-y-4">{audience.items.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700"><Check className="mt-1 h-4 w-4 shrink-0" style={{ color: audience.color }} />{item}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section aria-labelledby="why-choose-us">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">The TasksEarn standard</p><h2 id="why-choose-us" className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>Why choose TasksEarn?</h2></div>
            <ShieldCheck className="hidden h-10 w-10 text-blue-100 sm:block" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reasons.map((reason) => <div key={reason.title} style={card} className="p-5 transition-all hover:-translate-y-1 hover:shadow-lg"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">{reason.icon}</div><h3 className="text-sm font-bold text-slate-900">{reason.title}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{reason.desc}</p></div>)}
          </div>
        </section>
      </Reveal>

      <Reveal className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl bg-gradient-to-br from-blue-700 to-blue-900 p-6 text-white sm:p-8">
          <div className="mb-5 inline-flex rounded-xl bg-white/15 p-3"><Shield className="h-5 w-5" /></div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Trust &amp; security</h2>
          <p className="mt-4 text-sm leading-7 text-blue-100">TasksEarn is committed to protecting every user&apos;s account and ensuring all campaigns and tasks comply with platform guidelines. We continuously improve our systems to provide a secure, reliable, and rewarding experience for both advertisers and earners.</p>
        </div>
        <div style={card} className="p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-3 text-blue-600"><HeartHandshake className="h-5 w-5" /></div><h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>Our core values</h2></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{coreValues.map((value) => <div key={value.title} className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700"><span className="text-blue-600">{React.cloneElement(value.icon, { className: "h-4 w-4" })}</span>{value.title}</div>)}</div>
        </div>
      </Reveal>

      <Reveal>
        <section className="rounded-3xl border border-blue-100 bg-blue-50/70 p-6 text-center sm:p-8">
          <p className="text-xs font-semibold text-blue-700">Ready to take your next step?</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>Join a platform built for progress.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">Whether you want to grow a business or earn from simple online activities, there is a place for you on TasksEarn.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3"><button onClick={() => onNavigate?.("register")} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-transform hover:-translate-y-0.5 cursor-pointer">Create your account <ArrowRight className="ml-1 inline h-4 w-4" /></button><button onClick={() => onNavigate?.("contact")} className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-50 cursor-pointer">Contact our team</button></div>
        </section>
      </Reveal>
    </article>
  );
}