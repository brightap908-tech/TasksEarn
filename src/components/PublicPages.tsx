import React from "react";
import { Mail, Phone, MapPin, Send, HelpCircle, ArrowRight, Shield, FileText, CheckCircle } from "lucide-react";
import PlatformIcon from "./PlatformIcon";

interface PublicPagesProps {
  view: string;
  pagesContent: { [key: string]: { title: string; content: string } };
  settings: {
    contactEmail: string;
    contactPhone: string;
    telegramChannel?: string;
    whatsappGroup?: string;
  };
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

export default function PublicPages({ view, pagesContent, settings }: PublicPagesProps) {
  const page = pagesContent[view] || {
    title: view.toUpperCase(),
    content: "Content is loading or not yet configured...",
  };

  const [contactForm, setContactForm] = React.useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = React.useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setContactForm({ name: "", email: "", subject: "", message: "" });
    }, 4000);
  };

  const faqs = [
    {
      q: "What is TasksEarn and how does it work?",
      a: "TasksEarn is a digital micro-job marketplace connecting advertisers with earners in Nigeria. Advertisers pay to get actions (follows, subscriptions, likes, shares), and Earners get paid in Nigerian Naira (₦) for completing those social media actions and uploading proof.",
    },
    {
      q: "How can I fund my Advertiser wallet?",
      a: "Advertisers can instantly fund their wallets via Paystack or Flutterwave. We support Naira Debit cards, Bank Transfers, OPay, PalmPay, and Moniepoint. The minimum deposit is ₦100.",
    },
    {
      q: "What is the minimum withdrawal for Earners?",
      a: "Earners can request a withdrawal to any Nigerian bank once their balance reaches ₦2,000. There is a flat ₦100 gateway fee per withdrawal.",
    },
    {
      q: "How does the referral system work?",
      a: "Share your unique referral code. When someone registers with your code and verifies their email, you immediately receive ₦200 in your wallet. There is no referral limit.",
    },
    {
      q: "Why was my task proof rejected?",
      a: "Proofs are audited by advertisers and admins. Rejections occur if the username is wrong, the screenshot is blurred or blank, or the required action wasn't completed. Repeated fake submissions may result in account suspension.",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">

      {/* Page header */}
      <div className="mb-10 text-center">
        <h1
          className="font-bold tracking-tight text-slate-900 sm:text-4xl"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem,4vw,2.5rem)" }}
        >
          {page.title}
        </h1>
        <div
          className="mx-auto mt-3 h-0.5 w-16 rounded-full"
          style={{ background: "linear-gradient(90deg,#2563eb,#2563EB)" }}
        />
        <p className="mt-4 text-sm max-w-xl mx-auto leading-relaxed" style={{ color: "#64748b" }}>
          Learn more about our social media task exchange platform — regulations, contact details, and guidelines.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">

          {view === "faq" ? (
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} style={card} className="p-5">
                  <h3
                    className="flex items-start gap-3 font-bold text-slate-900"
                    style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem" }}
                  >
                    <HelpCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#2563EB" }} />
                    <span>{faq.q}</span>
                  </h3>
                  <p
                    className="mt-3 text-sm leading-relaxed pl-8"
                    style={{
                      color: "#475569",
                      borderLeft: "2px solid rgba(59,130,246,0.20)",
                      paddingLeft: "1rem",
                      marginLeft: "1.25rem",
                    }}
                  >
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
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
                  className="rounded-xl p-5 text-center animate-fadeIn"
                  style={{
                    background: "rgba(59,130,246,0.08)",
                    border: "1px solid rgba(59,130,246,0.20)"
                  }}
                >
                  <CheckCircle className="h-8 w-8 mx-auto mb-3" style={{ color: "#2563EB" }} />
                  <p className="text-sm font-bold text-slate-900">Message Received Successfully!</p>
                  <p className="text-xs mt-1" style={{ color: "#2563EB" }}>
                    Our support team will reply within 12 hours via email.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#64748b", letterSpacing: "0.06em" }}>
                        Your Name
                      </label>
                      <input
                        type="text" required value={contactForm.name}
                        onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                        style={inputStyle} placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#64748b", letterSpacing: "0.06em" }}>
                        Email Address
                      </label>
                      <input
                        type="email" required value={contactForm.email}
                        onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                        style={inputStyle} placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#64748b", letterSpacing: "0.06em" }}>
                      Subject
                    </label>
                    <input
                      type="text" required value={contactForm.subject}
                      onChange={e => setContactForm({ ...contactForm, subject: e.target.value })}
                      style={inputStyle} placeholder="Task Dispute / General Query"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#64748b", letterSpacing: "0.06em" }}>
                      Detailed Message
                    </label>
                    <textarea
                      required rows={5} value={contactForm.message}
                      onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                      style={{ ...inputStyle, resize: "none" }}
                      placeholder="Describe your query in detail..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl py-3 text-sm font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-all"
                    style={{
                      background: "linear-gradient(135deg,#2563EB,#2563eb)",
                      boxShadow: "0 4px 16px rgba(37,99,235,0.30)"
                    }}
                  >
                    <Send className="h-4 w-4" /> Send Message
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div style={card} className="p-6 sm:p-8">
              <div
                className="prose max-w-none text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: "#475569" }}
              >
                {page.content}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-5">

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
                { icon: <Mail className="h-4 w-4" style={{ color: "#2563EB" }} />, label: "Support Email", value: settings.contactEmail },
                { icon: <Phone className="h-4 w-4" style={{ color: "#2563EB" }} />, label: "Hotline", value: settings.contactPhone },
                { icon: <MapPin className="h-4 w-4" style={{ color: "#2563EB" }} />, label: "Headquarters", value: "Yaba Tech Corridor, Lagos, Nigeria" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="rounded-lg p-2 shrink-0"
                    style={{ background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.15)" }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{item.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {(settings.telegramChannel || settings.whatsappGroup) && (
              <div className="mt-6 pt-5 space-y-2.5" style={{ borderTop: "1px solid #E2E8F0" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#475569" }}>Social Chatrooms</p>
                {settings.telegramChannel && (
                  <a
                    href={settings.telegramChannel} target="_blank" rel="noreferrer"
                    className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs transition-colors"
                    style={{ background: "rgba(34,158,217,0.08)", border: "1px solid rgba(34,158,217,0.15)", color: "#7dd3fc" }}
                  >
                    <span className="flex items-center gap-2">
                      <PlatformIcon platform="Telegram" size={14} />
                      <span>Join Official Telegram</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
                {settings.whatsappGroup && (
                  <a
                    href={settings.whatsappGroup} target="_blank" rel="noreferrer"
                    className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs transition-colors"
                    style={{ background: "rgba(37,211,102,0.07)", border: "1px solid rgba(37,211,102,0.15)", color: "#4ade80" }}
                  >
                    <span className="flex items-center gap-2">
                      <PlatformIcon platform="WhatsApp" size={14} />
                      <span>WhatsApp Helpdesk</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Status card */}
          <div
            className="rounded-2xl p-6 text-white"
            style={{
              background: "linear-gradient(135deg,#1d4ed8 0%,#1e3a8a 100%)",
              border: "1px solid rgba(96,165,250,0.20)",
              boxShadow: "0 8px 32px rgba(29,78,216,0.25)"
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4" style={{ color: "#93c5fd" }} />
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

        </div>
      </div>
    </div>
  );
}
