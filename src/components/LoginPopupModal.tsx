import React from "react";
import { X, Info, CheckCircle2, AlertTriangle, Megaphone, ExternalLink } from "lucide-react";
import { Announcement } from "../types";

interface LoginPopupModalProps {
  announcement: Announcement;
  onClose: () => void;
}

const TYPE_STYLES: Record<Announcement["type"], { icon: React.ReactNode; accent: string; badge: string }> = {
  info: { icon: <Info className="h-5 w-5" />, accent: "from-blue-600 to-blue-800", badge: "bg-blue-50 text-blue-600 border-blue-200" },
  success: { icon: <CheckCircle2 className="h-5 w-5" />, accent: "from-emerald-600 to-emerald-800", badge: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  warning: { icon: <AlertTriangle className="h-5 w-5" />, accent: "from-amber-500 to-amber-700", badge: "bg-amber-50 text-amber-700 border-amber-200" }
};

export default function LoginPopupModal({ announcement, onClose }: LoginPopupModalProps) {
  const style = TYPE_STYLES[announcement.type] || TYPE_STYLES.info;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)" }}
      onClick={() => { if (announcement.dismissible) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-popup-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden animate-fadeIn"
      >
        <div className={`bg-gradient-to-tr ${style.accent} p-6 relative`}>
          {announcement.dismissible && (
            <button
              onClick={onClose}
              aria-label="Dismiss announcement"
              className="absolute top-4 right-4 rounded-full p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white shrink-0 border border-white/25">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Announcement</span>
              <h2 id="login-popup-title" className="text-base font-extrabold text-white leading-tight mt-0.5">
                {announcement.title}
              </h2>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${style.badge}`}>
            {style.icon}
            {announcement.type}
          </span>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
            {announcement.content}
          </p>

          <div className="space-y-2.5">
            {announcement.linkUrl && (
              <a
                href={announcement.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-sm font-bold text-white py-3 px-4 shadow-md hover:shadow-lg transition-all cursor-pointer text-center break-words"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span>{announcement.buttonText || "Learn More"}</span>
              </a>
            )}
            <button
              onClick={onClose}
              className={
                announcement.linkUrl
                  ? "w-full rounded-xl bg-blue-50 hover:bg-blue-100 text-sm font-bold text-blue-700 py-3 border border-blue-200 transition-all cursor-pointer"
                  : "w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-bold text-white py-3 shadow-md transition-all cursor-pointer"
              }
            >
              OK, Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
