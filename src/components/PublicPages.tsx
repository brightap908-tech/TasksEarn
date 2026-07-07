import React from "react";
import { Mail, Phone, MapPin, Send, HelpCircle, ArrowRight, Shield, FileText } from "lucide-react";

interface PublicPagesProps {
  view: string; // "about" | "faq" | "contact" | "terms" | "privacy"
  pagesContent: { [key: string]: { title: string; content: string } };
  settings: {
    contactEmail: string;
    contactPhone: string;
    telegramChannel?: string;
    whatsappGroup?: string;
  };
}

export default function PublicPages({ view, pagesContent, settings }: PublicPagesProps) {
  const page = pagesContent[view] || {
    title: view.toUpperCase(),
    content: "Content is loading or not yet configured..."
  };

  // State for Contact Us form submission
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

  // FAQ List rendering
  const getFaqs = () => {
    return [
      {
        q: "What is TasksEarn and how does it work?",
        a: "TasksEarn is a digital micro-job marketplace connecting advertisers with earners in Nigeria. Advertisers pay to get actions (follows, subscriptions, likes, shares, custom jobs), and Earners get paid in Nigerian Naira (₦) for completing those simple social media actions and uploading proof."
      },
      {
        q: "How can I fund my Advertiser wallet?",
        a: "Advertisers can instantly fund their wallets with secure payment gateways like Paystack or Flutterwave. We support Naira Debit cards, Bank Transfers, OPay, PalmPay, and Moniepoint payments. The minimum deposit is ₦1,000."
      },
      {
        q: "What is the minimum withdrawal for Earners?",
        a: "Earners can request a withdrawal to any Nigerian bank once their balance reaches ₦2,000. There is a standard flat gateway processing fee of ₦100 per withdrawal."
      },
      {
        q: "How does the referral system work?",
        a: "You get a custom referral code on your dashboard. When someone registers with your code and verifies their email, you immediately receive a ₦200 bonus in your wallet! There is no limit to how many referrals you can make."
      },
      {
        q: "Why was my task proof rejected?",
        a: "Task proofs are audited by advertisers and admins. A proof will be rejected if the username provided is wrong, if the screenshot is blurred/blank, or if you didn't complete the required action. Repeated fake submissions will result in account suspension."
      }
    ];
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      
      {/* Visual Header Banner */}
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          {page.title}
        </h1>
        <div className="mx-auto mt-2 h-1 w-16 rounded bg-emerald-500"></div>
        <p className="mt-3 text-sm text-gray-500 max-w-xl mx-auto">
          Learn more about our social media task exchange regulations, contact details, and platforms guidelines.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Detailed View Options */}
          {view === "faq" ? (
            <div className="space-y-4">
              {getFaqs().map((faq, idx) => (
                <div key={idx} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="flex items-start gap-2.5 font-display text-base font-bold text-gray-900">
                    <HelpCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{faq.q}</span>
                  </h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed pl-7 border-l-2 border-emerald-50">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          ) : view === "contact" ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="font-display text-xl font-bold text-gray-900 mb-6">Send Us a Direct Message</h2>
              
              {submitted ? (
                <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100 text-center animate-fadeIn">
                  <p className="text-sm font-bold text-emerald-800">✉ Message Received Successfully!</p>
                  <p className="text-xs text-emerald-600 mt-1">Our support managers will audit your message and reply back within 12 hours via email.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Your Name</label>
                      <input 
                        type="text" 
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" 
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Your Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" 
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Subject</label>
                    <input 
                      type="text" 
                      required
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" 
                      placeholder="Dispute Task / Advertiser Query / General"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Detailed Message</label>
                    <textarea 
                      required
                      rows={5}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" 
                      placeholder="Write your query in details..."
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="h-4 w-4" /> Send Message
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm">
              <div className="prose prose-emerald max-w-none text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {page.content}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info Panel */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Quick Contact Widget */}
          <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
            <h3 className="font-display text-base font-bold text-gray-900 mb-4">Official Channels</h3>
            
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Support Email</p>
                  <p className="text-gray-500 mt-0.5">{settings.contactEmail}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Hotline Center</p>
                  <p className="text-gray-500 mt-0.5">{settings.contactPhone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Headquarters</p>
                  <p className="text-gray-500 mt-0.5">Yaba Tech Corridor, Lagos, Nigeria.</p>
                </div>
              </div>
            </div>

            {/* Social Telegram/WA handles */}
            {(settings.telegramChannel || settings.whatsappGroup) && (
              <div className="border-t border-gray-100 mt-6 pt-5 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Social Chatrooms</p>
                {settings.telegramChannel && (
                  <a 
                    href={settings.telegramChannel} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl bg-blue-50 hover:bg-blue-100 px-3.5 py-2.5 text-xs text-blue-800 transition-colors"
                  >
                    <span>Join Official Telegram Channel</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
                {settings.whatsappGroup && (
                  <a 
                    href={settings.whatsappGroup} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl bg-green-50 hover:bg-green-100 px-3.5 py-2.5 text-xs text-green-800 transition-colors"
                  >
                    <span>Join WhatsApp Helpdesk</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Stats Banner */}
          <div className="rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 p-6 text-white shadow-md">
            <h4 className="font-display text-sm font-semibold text-emerald-100 uppercase tracking-widest">Platform Status</h4>
            <p className="font-display text-2xl font-black mt-2">Active & Secure</p>
            <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
              We verify and audit all deposits, referral clicks, and payouts inside Nigerian Naira instantly.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
