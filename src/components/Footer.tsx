import React from "react";
import { resolvePath } from "../lib/routes";
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
        background: "linear-gradient(160deg, #0f2d6b 0%, #1040a0 60%, #1a52c4 100%)",
        borderTop: "1px solid rgba(255,255,255,0.12)"
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="sm:col-span-2 md:col-span-1 space-y-5">
            <div
              className="flex items-center gap-3 cursor-pointer w-fit"
              onClick={() => onNavigate("home")}
            >
              {/* Logo mark */}
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  boxShadow: "0 0 18px rgba(147,197,253,0.25)",
                  border: "1px solid rgba(255,255,255,0.25)"
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
                  Tasks<span style={{ color: "#93c5fd" }}>Earn</span>
                </div>
                <div
                  className="flex items-center gap-1 mt-1"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.16em", color: "rgba(224,242,254,0.90)", textTransform: "uppercase", fontWeight: 700 }}
                >
                  <Zap style={{ width: "6px", height: "6px" }} />
                  MICRO-EXCHANGE
                </div>
              </div>
            </div>

            <p className="text-xs leading-relaxed font-medium" style={{ color: "rgba(224,242,254,0.92)", maxWidth: "240px" }}>
              Nigeria's premier social media microtask exchange. Connecting advertisers with earners for organic, verified growth.
            </p>

            {/* Security badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.20)" }}
            >
              <ShieldCheck className="h-3 w-3 text-blue-200" />
              <span className="text-[10px] font-semibold text-blue-100">SSL Secured Platform</span>
            </div>
          </div>

          {/* Platform links */}
          <div className="space-y-4">
            <h4
              className="text-xs font-bold uppercase tracking-widest text-blue-100"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "0.1em" }}
            >
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs">
              {[
                { label: "Home", view: "home" },
                { label: "About TasksEarn", view: "about" },
                { label: "FAQ & Help", view: "faq", icon: <HelpCircle className="h-3.5 w-3.5 text-blue-300" /> },
                { label: "Contact Support", view: "contact" },
              ].map(item => (
                <li key={item.view}>
                  <a
                    href={resolvePath(item.view) ?? "/"}
                    onClick={(e) => { e.preventDefault(); onNavigate(item.view); }}
                    className="cursor-pointer transition-colors flex items-center gap-1.5 font-semibold"
                    style={{ color: "rgba(224,242,254,0.96)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#ffffff")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(224,242,254,0.96)")}
                  >
                    {item.icon}
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4
              className="text-xs font-bold uppercase tracking-widest text-blue-100"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "0.1em" }}
            >
              Legal
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href={resolvePath("terms") ?? "/terms"}
                  onClick={(e) => { e.preventDefault(); onNavigate("terms"); }}
                  className="cursor-pointer transition-colors flex items-center gap-1.5 font-semibold"
                  style={{ color: "rgba(224,242,254,0.96)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(224,242,254,0.96)")}
                >
                  <FileText className="h-3.5 w-3.5 text-yellow-300" />
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href={resolvePath("privacy") ?? "/privacy"}
                  onClick={(e) => { e.preventDefault(); onNavigate("privacy"); }}
                  className="cursor-pointer transition-colors flex items-center gap-1.5 font-semibold"
                  style={{ color: "rgba(224,242,254,0.96)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(224,242,254,0.96)")}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-300" />
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4
              className="text-xs font-bold uppercase tracking-widest text-blue-100"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "0.1em" }}
            >
              Support
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center gap-2.5">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
                >
                  <Mail className="h-3.5 w-3.5 text-blue-200" />
                </div>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="transition-colors font-semibold"
                  style={{ color: "rgba(224,242,254,0.96)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(224,242,254,0.96)")}
                >
                  {settings.contactEmail}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
                >
                  <Phone className="h-3.5 w-3.5 text-blue-200" />
                </div>
                <a
                  href={`tel:${settings.contactPhone}`}
                  className="transition-colors font-mono font-semibold"
                  style={{ color: "rgba(224,242,254,0.96)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(224,242,254,0.96)")}
                >
                  {settings.contactPhone}
                </a>
              </li>
              {settings.whatsappGroup && (
                <li className="flex items-center gap-2.5">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                    style={{ background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.25)" }}
                  >
                    <span className="text-xs">💬</span>
                  </div>
                  <a
                    href={settings.whatsappGroup}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold transition-colors"
                    style={{ color: "#86efac" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#ffffff")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#86efac")}
                  >
                    WhatsApp Chat Support
                  </a>
                </li>
              )}
              <li className="flex items-start gap-2.5">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 mt-0.5"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
                >
                  <Landmark className="h-3.5 w-3.5 text-blue-200" />
                </div>
                <span className="font-medium" style={{ color: "rgba(224,242,254,0.90)" }}>12, Herbert Macaulay Way, Yaba, Lagos, Nigeria</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs"
          style={{ borderTop: "1px solid rgba(255,255,255,0.12)", color: "rgba(224,242,254,0.88)" }}
        >
          <p className="font-medium">© {new Date().getFullYear()} {platformName}. Built for Nigerian Earners &amp; Advertisers. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full inline-block"
              style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e", animation: "pulse 2s infinite" }}
            />
            <span className="font-medium" style={{ color: "rgba(224,242,254,0.88)" }}>Secure Payouts via Paystack &amp; Flutterwave</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
