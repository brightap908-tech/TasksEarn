import React from "react";
import { Landmark, Mail, Phone, ShieldCheck, HelpCircle, FileText, Zap } from "lucide-react";

interface FooterProps {
  onNavigate: (view: string) => void;
  platformName: string;
  settings: {
    contactEmail: string;
    contactPhone: string;
    whatsappGroup?: string;
    telegramChannel?: string;
  };
}

export default function Footer({ onNavigate, platformName, settings }: FooterProps) {
  return (
    <footer
      id="app-footer"
      style={{
        background: "#070d1a",
        borderTop: "1px solid rgba(255,255,255,0.06)"
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="md:col-span-1 space-y-5">
            <div
              className="flex items-center gap-3 cursor-pointer w-fit"
              onClick={() => onNavigate("home")}
            >
              {/* Logo mark */}
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
                style={{
                  background: "linear-gradient(135deg,#2563EB,#1d4ed8)",
                  boxShadow: "0 0 16px rgba(59,130,246,0.35)",
                  border: "1px solid rgba(96,165,250,0.25)"
                }}
              >
                <span
                  className="font-bold text-white"
                  style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", lineHeight: 1 }}
                >
                  ₦
                </span>
              </div>
              <div>
                <div
                  className="font-bold text-white"
                  style={{ fontFamily: "var(--font-display)", fontSize: "1rem", letterSpacing: "-0.03em", lineHeight: 1 }}
                >
                  Tasks<span style={{ color: "#2563EB" }}>Earn</span>
                </div>
                <div
                  className="flex items-center gap-1 mt-1"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.16em", color: "rgba(96,165,250,0.60)", textTransform: "uppercase", fontWeight: 700 }}
                >
                  <Zap style={{ width: "6px", height: "6px" }} />
                  MICRO-EXCHANGE
                </div>
              </div>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: "#475569", maxWidth: "240px" }}>
              Nigeria's premier social media microtask exchange. Connecting advertisers with earners for organic, verified growth.
            </p>

            {/* Security badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.15)" }}
            >
              <ShieldCheck className="h-3 w-3" style={{ color: "#2563EB" }} />
              <span className="text-[10px] font-semibold" style={{ color: "#2563EB" }}>SSL Secured Platform</span>
            </div>
          </div>

          {/* Platform links */}
          <div className="space-y-4">
            <h4
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#e2e8f0", fontFamily: "var(--font-display)", letterSpacing: "0.1em" }}
            >
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs" style={{ color: "#475569" }}>
              {[
                { label: "Home", view: "home" },
                { label: "About TasksEarn", view: "about" },
                { label: "FAQ & Help", view: "faq", icon: <HelpCircle className="h-3.5 w-3.5" style={{ color: "#2563EB" }} /> },
                { label: "Contact Support", view: "contact" },
              ].map(item => (
                <li key={item.view}>
                  <span
                    onClick={() => onNavigate(item.view)}
                    className="cursor-pointer transition-colors flex items-center gap-1.5"
                    style={{ color: "#475569" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#2563EB")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
                  >
                    {item.icon}
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#e2e8f0", fontFamily: "var(--font-display)", letterSpacing: "0.1em" }}
            >
              Legal
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <span
                  onClick={() => onNavigate("terms")}
                  className="cursor-pointer transition-colors flex items-center gap-1.5"
                  style={{ color: "#475569" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#2563EB")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
                >
                  <FileText className="h-3.5 w-3.5" style={{ color: "#fbbf24" }} />
                  Terms of Service
                </span>
              </li>
              <li>
                <span
                  onClick={() => onNavigate("privacy")}
                  className="cursor-pointer transition-colors flex items-center gap-1.5"
                  style={{ color: "#475569" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#2563EB")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
                >
                  <ShieldCheck className="h-3.5 w-3.5" style={{ color: "#2563EB" }} />
                  Privacy Policy
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#e2e8f0", fontFamily: "var(--font-display)", letterSpacing: "0.1em" }}
            >
              Support
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center gap-2.5">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                  style={{ background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.15)" }}
                >
                  <Mail className="h-3.5 w-3.5" style={{ color: "#2563EB" }} />
                </div>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="transition-colors"
                  style={{ color: "#475569" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#e2e8f0")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
                >
                  {settings.contactEmail}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                  style={{ background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.15)" }}
                >
                  <Phone className="h-3.5 w-3.5" style={{ color: "#2563EB" }} />
                </div>
                <a
                  href={`tel:${settings.contactPhone}`}
                  className="transition-colors font-mono"
                  style={{ color: "#475569" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#e2e8f0")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
                >
                  {settings.contactPhone}
                </a>
              </li>
              {settings.whatsappGroup && (
                <li className="flex items-center gap-2.5">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                    style={{ background: "rgba(37,211,102,0.10)", border: "1px solid rgba(37,211,102,0.15)" }}
                  >
                    <span className="text-xs">💬</span>
                  </div>
                  <a
                    href={settings.whatsappGroup}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold transition-colors"
                    style={{ color: "#4ade80" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#86efac")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#4ade80")}
                  >
                    WhatsApp Chat Support
                  </a>
                </li>
              )}
              <li className="flex items-start gap-2.5">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 mt-0.5"
                  style={{ background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.15)" }}
                >
                  <Landmark className="h-3.5 w-3.5" style={{ color: "#2563EB" }} />
                </div>
                <span style={{ color: "#374151" }}>12, Herbert Macaulay Way, Yaba, Lagos, Nigeria</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-xs"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)", color: "#374151" }}
        >
          <p>© {new Date().getFullYear()} {platformName}. Built for Nigerian Earners & Advertisers. All rights reserved.</p>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <span
              className="h-1.5 w-1.5 rounded-full inline-block"
              style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e", animation: "pulse 2s infinite" }}
            />
            <span style={{ color: "#374151" }}>Secure Payouts via Paystack &amp; Flutterwave</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
