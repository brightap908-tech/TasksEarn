import React from "react";
import { Landmark, Mail, Phone, ShieldCheck, HelpCircle, FileText } from "lucide-react";

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
    <footer id="app-footer" className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Main Footer Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Logo & Description */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate("home")}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white font-bold text-lg font-display">
                ₦
              </div>
              <span className="font-display text-lg font-bold text-white tracking-tight">
                {platformName}<span className="text-emerald-500">.ng</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nigeria's premier social media microtask exchange platform. Connecting advertisers looking for organic growth with active earners looking to monetize their social media engagement.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider uppercase">Platform Pages</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span onClick={() => onNavigate("home")} className="hover:text-emerald-400 cursor-pointer transition-colors flex items-center gap-1.5">
                  Home page
                </span>
              </li>
              <li>
                <span onClick={() => onNavigate("about")} className="hover:text-emerald-400 cursor-pointer transition-colors flex items-center gap-1.5">
                  About TasksEarn
                </span>
              </li>
              <li>
                <span onClick={() => onNavigate("faq")} className="hover:text-emerald-400 cursor-pointer transition-colors flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-emerald-500" /> FAQ & Help
                </span>
              </li>
              <li>
                <span onClick={() => onNavigate("contact")} className="hover:text-emerald-400 cursor-pointer transition-colors flex items-center gap-1.5">
                  Contact Support
                </span>
              </li>
            </ul>
          </div>

          {/* Legal Pages */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider uppercase">Legal & Compliance</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span onClick={() => onNavigate("terms")} className="hover:text-emerald-400 cursor-pointer transition-colors flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-amber-500" /> Terms of Service
                </span>
              </li>
              <li>
                <span onClick={() => onNavigate("privacy")} className="hover:text-emerald-400 cursor-pointer transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" /> Privacy Policy
                </span>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider uppercase">Support Desk</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-500 shrink-0" />
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-white transition-colors">{settings.contactEmail}</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-500 shrink-0" />
                <a href={`tel:${settings.contactPhone}`} className="hover:text-white transition-colors font-mono">{settings.contactPhone}</a>
              </li>
              {settings.whatsappGroup && (
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 shrink-0 font-bold text-[14px]">💬</span>
                  <a href={settings.whatsappGroup} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 hover:underline font-semibold flex items-center gap-1">
                    WhatsApp Chat Support
                  </a>
                </li>
              )}
              <li className="flex items-start gap-2">
                <Landmark className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>12, Herbert Macaulay Way, Yaba, Lagos State, Nigeria</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Banner Area */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} {platformName}. Built for Nigerian Earners and Advertisers. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Secure Payouts with Paystack & Flutterwave
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
