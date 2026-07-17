import React from "react";
import {
  Mail, Phone, MapPin, Send, HelpCircle, ArrowRight, Shield, FileText,
  CheckCircle, Users, Megaphone, Wallet, Zap, Star, Lock, Smartphone,
  Clock, HeadphonesIcon, BadgeCheck, TrendingUp, ChevronDown, ChevronUp
} from "lucide-react";
import PlatformIcon from "./PlatformIcon";
import SEO from "./SEO";

interface PublicPagesProps {
  view: string;
  pagesContent: { [key: string]: { title: string; content: string } };
  settings: {
    contactEmail: string;
    contactPhone: string;
    telegramChannel?: string;
    whatsappGroup?: string;
  };
  onNavigate?: (view: string) => void;
}

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  boxShadow: "0 4px 24px rgba(37,99,235,0.08)",
  borderRadius: "1rem",
};

const inputStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: "0.75rem",
  color: "#0F172A",
  padding: "0.625rem 1rem",
  fontSize: "0.875rem",
  width: "100%",
  outline: "none",
};

/* ─── SEO metadata per view ─────────────────────────────────── */
const PAGE_SEO: Record<string, { title: string; description: string; path: string }> = {
  about: {
    title: "About Us | TasksEarn - Online Task Marketplace",
    description:
      "Learn about TasksEarn — Nigeria's trusted online task marketplace connecting advertisers and earners through simple, secure, and transparent micro-tasks.",
    path: "/about",
  },
  faq: {
    title: "FAQ | TasksEarn - Frequently Asked Questions",
    description:
      "Find answers to common questions about TasksEarn — how to earn money, how advertisers create campaigns, withdrawal processes, security, and more.",
    path: "/faq",
  },
  contact: {
    title: "Contact Us | TasksEarn - Get Support",
    description:
      "Get in touch with the TasksEarn support team. We respond within 12 hours via email, phone, or WhatsApp.",
    path: "/contact",
  },
  "how-it-works": {
    title: "How It Works | TasksEarn - Complete Tasks & Earn Money",
    description:
      "Discover how TasksEarn works. Earners complete simple online tasks and get paid. Advertisers create campaigns and get real organic engagement.",
    path: "/how-it-works",
  },
  terms: {
    title: "Terms of Service | TasksEarn",
    description:
      "Read the TasksEarn Terms of Service. These terms govern your use of the TasksEarn platform and all related services.",
    path: "/terms",
  },
  privacy: {
    title: "Privacy Policy | TasksEarn",
    description:
      "Read the TasksEarn Privacy Policy to understand how we collect, use, and protect your personal data.",
    path: "/privacy",
  },
};

/* ─── About Page ─────────────────────────────────────────────── */
function AboutPage({ onNavigate }: { onNavigate?: (v: string) => void }) {
  const features = [
    {
      icon: <Lock className="h-5 w-5" style={{ color: "#2563EB" }} />,
      title: "Secure Wallet System",
      desc: "Your earnings are held in a protected digital wallet. Withdraw anytime to any Nigerian bank account securely.",
    },
    {
      icon: <BadgeCheck className="h-5 w-5" style={{ color: "#2563EB" }} />,
      title: "Transparent Payments",
      desc: "Every transaction is logged and visible. You always know exactly what you earned, when you earned it, and why.",
    },
    {
      icon: <Smartphone className="h-5 w-5" style={{ color: "#2563EB" }} />,
      title: "Mobile-Friendly Platform",
      desc: "Designed from the ground up to work perfectly on any smartphone. Earn on the go, anywhere in Nigeria.",
    },
    {
      icon: <Clock className="h-5 w-5" style={{ color: "#2563EB" }} />,
      title: "Fast Approval Process",
      desc: "Task submissions are reviewed quickly — typically within hours. Get paid without waiting days.",
    },
    {
      icon: <HeadphonesIcon className="h-5 w-5" style={{ color: "#2563EB" }} />,
      title: "Professional Customer Support",
      desc: "Our dedicated team is available via email, phone, and WhatsApp to resolve any issue promptly.",
    },
    {
      icon: <TrendingUp className="h-5 w-5" style={{ color: "#2563EB" }} />,
      title: "Real Organic Growth",
      desc: "Advertisers get genuine engagement from verified Nigerian users — not bots or fake traffic.",
    },
  ];

  const stats = [
    { label: "Active Earners", value: "12,000+" },
    { label: "Tasks Completed", value: "250,000+" },
    { label: "Campaigns Launched", value: "3,800+" },
    { label: "Total Paid Out", value: "₦45M+" },
  ];

  return (
    <article>
      {/* What is TasksEarn */}
      <section aria-labelledby="about-heading">
        <div style={card} className="p-6 sm:p-8 mb-6">
          <h2
            id="about-heading"
            className="font-bold text-slate-900 mb-4"
            style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}
          >
            What is TasksEarn?
          </h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "#475569" }}>
            <strong>TasksEarn</strong> is Nigeria's premier online task marketplace — a secure platform
            that connects <strong>Advertisers</strong> who want to grow their businesses with{" "}
            <strong>Earners</strong> who want to make money from simple online activities.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>
            Whether you are a business owner looking for real organic reach or an individual looking to
            earn extra income from your smartphone, TasksEarn provides a transparent, reliable, and
            fast-paying environment for both sides.
          </p>
        </div>

        {/* Advertiser + Earner split */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          <div
            className="rounded-2xl p-6"
            style={{
              background: "linear-gradient(135deg,#1d4ed8 0%,#1e3a8a 100%)",
              border: "1px solid rgba(96,165,250,0.20)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.15)" }}>
                <Megaphone className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                For Advertisers
              </h3>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#bfdbfe" }}>
              Create promotional campaigns on TasksEarn and connect with thousands of real Nigerian users.
              Earners follow your pages, subscribe to your channels, download your apps, leave reviews,
              and complete other social actions — delivering genuine, verified engagement to your brand.
            </p>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{
              background: "linear-gradient(135deg,#065f46 0%,#064e3b 100%)",
              border: "1px solid rgba(52,211,153,0.20)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.15)" }}>
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                For Earners
              </h3>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#a7f3d0" }}>
              Browse available tasks, complete the required action (follow, subscribe, like, share, review),
              upload proof, and get paid directly into your TasksEarn wallet. Withdraw to any Nigerian bank
              account once you reach the minimum threshold.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section aria-label="Platform statistics" className="mb-6">
        <div
          className="rounded-2xl p-6"
          style={{ background: "linear-gradient(135deg,#EFF6FF 0%,#DBEAFE 100%)", border: "1px solid #BFDBFE" }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p
                  className="font-extrabold"
                  style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#1D4ED8" }}
                >
                  {s.value}
                </p>
                <p className="text-xs font-semibold mt-1" style={{ color: "#475569" }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section aria-labelledby="features-heading">
        <h2
          id="features-heading"
          className="font-bold text-slate-900 mb-4"
          style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}
        >
          Why Choose TasksEarn?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <div key={f.title} style={card} className="p-5 flex gap-4">
              <div
                className="rounded-xl p-2.5 shrink-0 h-fit"
                style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.15)" }}
              >
                {f.icon}
              </div>
              <div>
                <h3
                  className="font-bold text-slate-900 mb-1"
                  style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem" }}
                >
                  {f.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {onNavigate && (
        <section aria-label="Call to action" className="mt-8">
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "linear-gradient(135deg,#2563EB 0%,#1E40AF 100%)" }}
          >
            <h2
              className="font-bold text-white mb-2"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}
            >
              Ready to Get Started?
            </h2>
            <p className="text-sm mb-6" style={{ color: "#BFDBFE" }}>
              Join thousands of earners and advertisers on TasksEarn today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => onNavigate("register")}
                className="rounded-full px-6 py-3 text-sm font-bold text-blue-700 cursor-pointer transition-all active:scale-95"
                style={{ background: "#FFFFFF" }}
              >
                Start Earning Now
              </button>
              <button
                onClick={() => onNavigate("how-it-works")}
                className="rounded-full px-6 py-3 text-sm font-bold text-white cursor-pointer border transition-all"
                style={{ borderColor: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.10)" }}
              >
                How It Works →
              </button>
            </div>
          </div>
        </section>
      )}
    </article>
  );
}

/* ─── How It Works Page ──────────────────────────────────────── */
function HowItWorksPage({ onNavigate }: { onNavigate?: (v: string) => void }) {
  const [tab, setTab] = React.useState<"earner" | "advertiser">("earner");

  const earnerSteps = [
    {
      step: "1",
      icon: <Users className="h-6 w-6 text-white" />,
      title: "Create Your Free Account",
      desc: "Register in under two minutes using your email address. Verify your email and your account is ready. No fees required.",
    },
    {
      step: "2",
      icon: <Star className="h-6 w-6 text-white" />,
      title: "Browse Available Tasks",
      desc: "Explore hundreds of tasks from advertisers — follows, subscriptions, likes, app downloads, reviews, and more. Pick tasks that match your social accounts.",
    },
    {
      step: "3",
      icon: <CheckCircle className="h-6 w-6 text-white" />,
      title: "Complete & Upload Proof",
      desc: "Complete the required action on the platform (Instagram, YouTube, TikTok, etc.), take a screenshot as proof, and upload it through TasksEarn.",
    },
    {
      step: "4",
      icon: <Wallet className="h-6 w-6 text-white" />,
      title: "Get Paid to Your Wallet",
      desc: "Once your proof is approved, the task reward is instantly credited to your TasksEarn wallet. Withdraw to any Nigerian bank once you reach ₦2,000.",
    },
  ];

  const advertiserSteps = [
    {
      step: "1",
      icon: <Users className="h-6 w-6 text-white" />,
      title: "Register as an Advertiser",
      desc: "Create your advertiser account with your business email. It takes less than two minutes to get set up.",
    },
    {
      step: "2",
      icon: <Wallet className="h-6 w-6 text-white" />,
      title: "Fund Your Campaign Wallet",
      desc: "Deposit funds into your TasksEarn advertiser wallet via Paystack or bank transfer. Minimum deposit is ₦100.",
    },
    {
      step: "3",
      icon: <Megaphone className="h-6 w-6 text-white" />,
      title: "Create Your Campaign",
      desc: "Define your campaign — specify the platform (Instagram, YouTube, TikTok, etc.), the action required, proof criteria, reward per task, and how many earners you need.",
    },
    {
      step: "4",
      icon: <BadgeCheck className="h-6 w-6 text-white" />,
      title: "Review & Approve Submissions",
      desc: "Earners submit proof of completion. Review each submission and approve genuine ones. Rejected submissions refund your campaign balance automatically.",
    },
  ];

  const steps = tab === "earner" ? earnerSteps : advertiserSteps;

  return (
    <article>
      {/* Tab toggle */}
      <div
        className="flex rounded-2xl p-1 mb-8"
        style={{ background: "#F1F5F9", border: "1px solid #E2E8F0" }}
        role="tablist"
        aria-label="Choose your role"
      >
        {(["earner", "advertiser"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold transition-all cursor-pointer"
            style={
              tab === t
                ? {
                    background: "linear-gradient(135deg,#2563EB,#1D4ED8)",
                    color: "#FFFFFF",
                    boxShadow: "0 2px 8px rgba(37,99,235,0.30)",
                  }
                : { color: "#64748b" }
            }
          >
            {t === "earner" ? "I Want to Earn" : "I Want to Advertise"}
          </button>
        ))}
      </div>

      {/* Steps */}
      <div className="space-y-4" role="tabpanel">
        {steps.map((s, idx) => (
          <div key={idx} style={card} className="p-5 flex gap-5 items-start">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
              style={{
                background: "linear-gradient(135deg,#2563EB,#1D4ED8)",
                boxShadow: "0 4px 12px rgba(37,99,235,0.30)",
              }}
            >
              {s.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "#2563EB" }}
                >
                  Step {s.step}
                </span>
              </div>
              <h3
                className="font-bold text-slate-900 mb-1.5"
                style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem" }}
              >
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Supported platforms */}
      <section aria-label="Supported platforms" className="mt-8">
        <div style={card} className="p-6">
          <h3
            className="font-bold text-slate-900 mb-4 text-center"
            style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}
          >
            Supported Platforms
          </h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              "Instagram", "YouTube", "TikTok", "Facebook", "Twitter",
              "Telegram", "WhatsApp", "Spotify",
            ].map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", color: "#475569" }}
              >
                <PlatformIcon platform={p} size={14} />
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {onNavigate && (
        <section aria-label="Get started" className="mt-8">
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "linear-gradient(135deg,#2563EB 0%,#1E40AF 100%)" }}
          >
            <h2
              className="font-bold text-white mb-2"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}
            >
              {tab === "earner" ? "Start Earning Today" : "Launch Your Campaign"}
            </h2>
            <p className="text-sm mb-6" style={{ color: "#BFDBFE" }}>
              {tab === "earner"
                ? "Join 12,000+ earners making money on TasksEarn."
                : "Reach thousands of real Nigerian users with your campaign."}
            </p>
            <button
              onClick={() => onNavigate("register")}
              className="rounded-full px-8 py-3 text-sm font-bold text-blue-700 cursor-pointer transition-all active:scale-95"
              style={{ background: "#FFFFFF" }}
            >
              {tab === "earner" ? "Create Free Earner Account" : "Register as Advertiser"}
            </button>
          </div>
        </section>
      )}
    </article>
  );
}

/* ─── FAQ Page ───────────────────────────────────────────────── */
function FAQPage() {
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);

  const faqs = [
    {
      q: "What is TasksEarn?",
      a: "TasksEarn is an online task marketplace based in Nigeria. It connects Advertisers — businesses that want to grow their social media presence — with Earners — individuals who complete simple online tasks and receive payments in Nigerian Naira (₦) directly into their TasksEarn wallet.",
    },
    {
      q: "How do I earn money on TasksEarn?",
      a: "Earning on TasksEarn is simple: (1) Register a free earner account. (2) Browse available tasks — follows, subscribes, likes, reviews, app downloads. (3) Complete the task on the specified platform. (4) Upload a screenshot as proof of completion. (5) Once your proof is approved, the reward is instantly added to your wallet. Withdraw to any Nigerian bank account when your balance reaches ₦2,000.",
    },
    {
      q: "How do advertisers create campaigns?",
      a: "Advertisers register an account, fund their wallet via Paystack or bank transfer, then create a campaign by specifying: the social media platform, the action required (e.g., follow on Instagram), proof requirements, the reward per task, and how many earners they want. Campaigns go live immediately after creation.",
    },
    {
      q: "How do withdrawals work?",
      a: "Once your TasksEarn wallet balance reaches ₦2,000, you can request a withdrawal to any Nigerian bank account. Enter your bank details, confirm the request, and our team processes the payment. There is a flat ₦100 gateway processing fee per withdrawal. Payments are typically processed within 24 hours on business days.",
    },
    {
      q: "Is TasksEarn secure?",
      a: "Yes. TasksEarn uses SSL encryption for all connections. Your wallet funds are protected and payments are processed through verified gateways (Paystack). We do not store card details. Our admin team reviews submissions to ensure both earners and advertisers are protected from fraudulent activity.",
    },
    {
      q: "How long do approvals take?",
      a: "Task submission reviews are typically completed within a few hours. In busy periods, it may take up to 24 hours. You will receive a notification once your submission is approved or rejected. Approved submissions are paid instantly to your wallet.",
    },
    {
      q: "Can anyone register on TasksEarn?",
      a: "Yes — TasksEarn is open to anyone in Nigeria. You need a valid email address to register. Earners must be at least 18 years of age. Advertisers may be individuals or businesses. Both earner and advertiser accounts are free to create.",
    },
    {
      q: "What is the minimum withdrawal amount?",
      a: "Earners can request a withdrawal to any Nigerian bank once their balance reaches ₦2,000. There is a flat ₦100 gateway processing fee deducted per withdrawal request.",
    },
    {
      q: "How does the referral program work?",
      a: "Share your unique referral code with friends. When someone registers using your code and verifies their email address, you receive a referral reward directly in your wallet. There is no limit to how many people you can refer.",
    },
    {
      q: "Why was my task proof rejected?",
      a: "Task proofs are reviewed by advertisers and our admin team. Common rejection reasons include: the wrong username was shown, the screenshot was blurry or unclear, the required action was not visibly completed, or the deadline had passed. You will receive a rejection reason, and in many cases you can resubmit with corrected proof.",
    },
    {
      q: "How can advertisers fund their wallet?",
      a: "Advertisers can instantly fund their wallets via Paystack or Flutterwave. We support Naira debit cards, bank transfers, OPay, PalmPay, and Moniepoint. The minimum deposit is ₦100.",
    },
  ];

  // JSON-LD for FAQ schema — passed up via meta
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  // Inject FAQ JSON-LD directly
  React.useEffect(() => {
    const id = "faq-jsonld";
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(faqJsonLd);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  return (
    <div className="space-y-2.5" role="list" aria-label="Frequently Asked Questions">
      {faqs.map((faq, idx) => {
        const open = openIdx === idx;
        return (
          <div key={idx} style={card} className="overflow-hidden" role="listitem">
            <button
              className="w-full flex items-start justify-between gap-3 p-5 text-left cursor-pointer"
              onClick={() => setOpenIdx(open ? null : idx)}
              aria-expanded={open}
            >
              <span className="flex items-start gap-3">
                <HelpCircle
                  className="h-5 w-5 shrink-0 mt-0.5"
                  style={{ color: "#2563EB" }}
                  aria-hidden="true"
                />
                <span
                  className="font-bold text-slate-900"
                  style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem" }}
                >
                  {faq.q}
                </span>
              </span>
              {open ? (
                <ChevronUp className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#94A3B8" }} />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#94A3B8" }} />
              )}
            </button>
            {open && (
              <div
                className="px-5 pb-5 text-sm leading-relaxed"
                style={{
                  color: "#475569",
                  borderTop: "1px solid #F1F5F9",
                  paddingTop: "1rem",
                  marginLeft: "2rem",
                }}
              >
                {faq.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function PublicPages({ view, pagesContent, settings, onNavigate }: PublicPagesProps) {
  const page = pagesContent[view] || {
    title: view.toUpperCase(),
    content: "Content is loading or not yet configured...",
  };

  const [contactForm, setContactForm] = React.useState({
    name: "", email: "", subject: "", message: "",
  });
  const [submitted, setSubmitted] = React.useState(false);
  const [contactLoading, setContactLoading] = React.useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setContactLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setContactLoading(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setContactForm({ name: "", email: "", subject: "", message: "" });
    }, 5000);
  };

  const seoData = PAGE_SEO[view];

  /* page-level JSON-LD for WebPage + BreadcrumbList */
  const webPageJsonLd = seoData
    ? [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `https://tasksearn.name.ng${seoData.path}`,
          url: `https://tasksearn.name.ng${seoData.path}`,
          name: seoData.title,
          description: seoData.description,
          isPartOf: { "@id": "https://tasksearn.name.ng/#website" },
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://tasksearn.name.ng/",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: seoData.title.split("|")[0].trim(),
                item: `https://tasksearn.name.ng${seoData.path}`,
              },
            ],
          },
        },
      ]
    : undefined;

  /* Wide-layout views (no sidebar) */
  const isWide = view === "about" || view === "how-it-works";

  /* Page titles shown in the hero header */
  const pageDisplayTitles: Record<string, string> = {
    about: "About TasksEarn",
    faq: "Frequently Asked Questions",
    contact: "Contact & Support",
    "how-it-works": "How It Works",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
  };

  const pageDisplaySubs: Record<string, string> = {
    about: "Nigeria's trusted online task marketplace connecting advertisers and earners.",
    faq: "Find answers to common questions about earning, advertising, payments, and security.",
    contact: "Our support team is ready to help you. Reach us via any of the channels below.",
    "how-it-works": "Complete simple online tasks and earn money — or advertise and grow your business.",
    terms: "Please read these terms carefully before using the TasksEarn platform.",
    privacy: "We take your privacy seriously. Here is how we handle your data.",
  };

  return (
    <div>
      {/* Dynamic SEO per page */}
      {seoData && (
        <SEO
          title={seoData.title}
          description={seoData.description}
          path={seoData.path}
          jsonLd={webPageJsonLd}
        />
      )}

      <div className={`mx-auto px-4 py-12 sm:px-6 lg:px-8 ${isWide ? "max-w-5xl" : "max-w-5xl"}`}>

        {/* Page header */}
        <header className="mb-10 text-center">
          <h1
            className="font-bold tracking-tight text-slate-900"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem,4vw,2.5rem)" }}
          >
            {pageDisplayTitles[view] || page.title}
          </h1>
          <div
            className="mx-auto mt-3 h-0.5 w-16 rounded-full"
            style={{ background: "linear-gradient(90deg,#2563eb,#1D4ED8)" }}
          />
          <p
            className="mt-4 text-sm max-w-xl mx-auto leading-relaxed"
            style={{ color: "#64748b" }}
          >
            {pageDisplaySubs[view] || "Learn more about our platform — regulations, contact details, and guidelines."}
          </p>
        </header>

        {/* Layout */}
        {isWide ? (
          /* ── Full-width layout for About / How It Works ── */
          <div>
            {view === "about" && <AboutPage onNavigate={onNavigate} />}
            {view === "how-it-works" && <HowItWorksPage onNavigate={onNavigate} />}
          </div>
        ) : (
          /* ── Sidebar layout for FAQ / Contact / Terms / Privacy ── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main content */}
            <main className="lg:col-span-2 space-y-5">

              {view === "faq" ? (
                <FAQPage />
              ) : view === "contact" ? (
                <div style={card} className="p-6 sm:p-8">
                  <h2
                    className="font-bold text-slate-900 mb-6"
                    style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}
                  >
                    Send Us a Direct Message
                  </h2>

                  {submitted ? (
                    <div
                      className="rounded-xl p-5 text-center"
                      style={{
                        background: "rgba(59,130,246,0.08)",
                        border: "1px solid rgba(59,130,246,0.20)",
                      }}
                    >
                      <CheckCircle className="h-8 w-8 mx-auto mb-3" style={{ color: "#2563EB" }} />
                      <p className="text-sm font-bold text-slate-900">Message Received Successfully!</p>
                      <p className="text-xs mt-1" style={{ color: "#2563EB" }}>
                        Our support team will reply within 12 hours via email.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4" noValidate>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="contact-name"
                            className="block text-xs font-semibold uppercase mb-1.5"
                            style={{ color: "#64748b", letterSpacing: "0.06em" }}
                          >
                            Your Name
                          </label>
                          <input
                            id="contact-name"
                            type="text"
                            required
                            autoComplete="name"
                            value={contactForm.name}
                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                            style={inputStyle}
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="contact-email"
                            className="block text-xs font-semibold uppercase mb-1.5"
                            style={{ color: "#64748b", letterSpacing: "0.06em" }}
                          >
                            Email Address
                          </label>
                          <input
                            id="contact-email"
                            type="email"
                            required
                            autoComplete="email"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            style={inputStyle}
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="contact-subject"
                          className="block text-xs font-semibold uppercase mb-1.5"
                          style={{ color: "#64748b", letterSpacing: "0.06em" }}
                        >
                          Subject
                        </label>
                        <input
                          id="contact-subject"
                          type="text"
                          required
                          value={contactForm.subject}
                          onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                          style={inputStyle}
                          placeholder="Task Dispute / General Query"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="contact-message"
                          className="block text-xs font-semibold uppercase mb-1.5"
                          style={{ color: "#64748b", letterSpacing: "0.06em" }}
                        >
                          Detailed Message
                        </label>
                        <textarea
                          id="contact-message"
                          required
                          rows={5}
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          style={{ ...inputStyle, resize: "none" }}
                          placeholder="Describe your query in detail..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={contactLoading}
                        className="w-full rounded-xl py-3 text-sm font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-70"
                        style={{
                          background: "linear-gradient(135deg,#2563EB,#1D4ED8)",
                          boxShadow: "0 4px 16px rgba(37,99,235,0.30)",
                        }}
                      >
                        {contactLoading ? (
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <Send className="h-4 w-4" aria-hidden="true" />
                        )}
                        {contactLoading ? "Sending…" : "Send Message"}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                /* Terms / Privacy — plain text from DB or fallback */
                <div style={card} className="p-6 sm:p-8">
                  <div
                    className="prose max-w-none text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: "#475569" }}
                  >
                    {page.content || "Content will be available shortly."}
                  </div>
                </div>
              )}
            </main>

            {/* Sidebar */}
            <aside className="lg:col-span-1 space-y-5" aria-label="Contact information">

              {/* Contact widget */}
              <div style={card} className="p-6">
                <h3
                  className="font-bold text-slate-900 mb-5"
                  style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem" }}
                >
                  Official Channels
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      icon: <Mail className="h-4 w-4" style={{ color: "#2563EB" }} aria-hidden="true" />,
                      label: "Support Email",
                      value: settings.contactEmail,
                      href: `mailto:${settings.contactEmail}`,
                    },
                    {
                      icon: <Phone className="h-4 w-4" style={{ color: "#2563EB" }} aria-hidden="true" />,
                      label: "Hotline",
                      value: settings.contactPhone,
                      href: `tel:${settings.contactPhone}`,
                    },
                    {
                      icon: <MapPin className="h-4 w-4" style={{ color: "#2563EB" }} aria-hidden="true" />,
                      label: "Headquarters",
                      value: "Yaba Tech Corridor, Lagos, Nigeria",
                      href: null,
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className="rounded-lg p-2 shrink-0"
                        style={{
                          background: "rgba(59,130,246,0.10)",
                          border: "1px solid rgba(59,130,246,0.15)",
                        }}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{item.label}</p>
                        {item.href ? (
                          <a
                            href={item.href}
                            className="text-xs mt-0.5 hover:underline"
                            style={{ color: "#64748b" }}
                          >
                            {item.value}
                          </a>
                        ) : (
                          <address
                            className="text-xs mt-0.5 not-italic"
                            style={{ color: "#64748b" }}
                          >
                            {item.value}
                          </address>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {(settings.telegramChannel || settings.whatsappGroup) && (
                  <div
                    className="mt-6 pt-5 space-y-2.5"
                    style={{ borderTop: "1px solid #E2E8F0" }}
                  >
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: "#475569" }}
                    >
                      Social Chatrooms
                    </p>
                    {settings.telegramChannel && (
                      <a
                        href={settings.telegramChannel}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label="Join TasksEarn on Telegram"
                        className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs transition-colors"
                        style={{
                          background: "rgba(34,158,217,0.08)",
                          border: "1px solid rgba(34,158,217,0.15)",
                          color: "#7dd3fc",
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <PlatformIcon platform="Telegram" size={14} />
                          <span>Join Official Telegram</span>
                        </span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    )}
                    {settings.whatsappGroup && (
                      <a
                        href={settings.whatsappGroup}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label="Join TasksEarn WhatsApp support group"
                        className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs transition-colors"
                        style={{
                          background: "rgba(37,211,102,0.07)",
                          border: "1px solid rgba(37,211,102,0.15)",
                          color: "#4ade80",
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <PlatformIcon platform="WhatsApp" size={14} />
                          <span>WhatsApp Helpdesk</span>
                        </span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Quick links */}
              <div style={card} className="p-6">
                <h3
                  className="font-bold text-slate-900 mb-4"
                  style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem" }}
                >
                  Quick Links
                </h3>
                <nav aria-label="Quick navigation">
                  <ul className="space-y-2">
                    {[
                      { label: "About TasksEarn", view: "about", path: "/about" },
                      { label: "How It Works", view: "how-it-works", path: "/how-it-works" },
                      { label: "FAQ & Help", view: "faq", path: "/faq" },
                      { label: "Terms of Service", view: "terms", path: "/terms" },
                      { label: "Privacy Policy", view: "privacy", path: "/privacy" },
                    ].map((item) => (
                      <li key={item.view}>
                        <a
                          href={item.path}
                          onClick={(e) => {
                            if (onNavigate) {
                              e.preventDefault();
                              onNavigate(item.view);
                            }
                          }}
                          className="flex items-center justify-between text-xs font-semibold py-1.5 transition-colors"
                          style={{ color: "#475569" }}
                        >
                          {item.label}
                          <ArrowRight className="h-3 w-3" aria-hidden="true" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>

              {/* Status card */}
              <div
                className="rounded-2xl p-6 text-white"
                style={{
                  background: "linear-gradient(135deg,#1d4ed8 0%,#1e3a8a 100%)",
                  border: "1px solid rgba(96,165,250,0.20)",
                  boxShadow: "0 8px 32px rgba(29,78,216,0.25)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4" style={{ color: "#93c5fd" }} aria-hidden="true" />
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "#93c5fd", fontFamily: "var(--font-display)" }}
                  >
                    Platform Status
                  </span>
                </div>
                <p
                  className="font-bold text-white"
                  style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem" }}
                >
                  Active &amp; Secure
                </p>
                <p className="text-xs mt-2 leading-relaxed" style={{ color: "#93c5fd" }}>
                  All deposits, referral clicks, and payouts verified inside Nigerian Naira instantly.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
