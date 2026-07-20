import React, { useState, useEffect, useCallback } from "react";
import {
  Bell, BellOff, X, CheckCircle2, XCircle, Loader2, AlertTriangle,
  Megaphone, Wallet, Briefcase, Shield
} from "lucide-react";

interface NotificationManageModalProps {
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
  showToast: (message: string, type?: "success" | "error") => void;
  onClose: () => void;
  onStatusChange?: (subscribed: boolean) => void;
}

type PushStatus = "loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const NOTIFICATION_TYPES = [
  {
    icon: <Briefcase className="h-4 w-4 text-blue-600" />,
    bg: "bg-blue-50",
    label: "New Tasks Posted",
    desc: "Instant alert the moment new earning tasks go live — never miss a slot.",
    url: "/earner/tasks",
  },
  {
    icon: <Megaphone className="h-4 w-4 text-purple-600" />,
    bg: "bg-purple-50",
    label: "Admin Announcements",
    desc: "Important platform news, bonus campaigns, and policy updates from the team.",
    url: "/earner/notifications",
  },
  {
    icon: <Wallet className="h-4 w-4 text-emerald-600" />,
    bg: "bg-emerald-50",
    label: "Account & Wallet Events",
    desc: "Task approval / rejection results and withdrawal payment confirmations.",
    url: "/earner/wallet",
  },
];

export default function NotificationManageModal({
  apiFetch,
  showToast,
  onClose,
  onStatusChange,
}: NotificationManageModalProps) {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [lastSubscribed, setLastSubscribed] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const checkStatus = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    try {
      const res = await apiFetch("/api/notifications/status");
      if (res.subscribed) {
        setStatus("subscribed");
        setLastSubscribed(res.lastSubscribed || null);
      } else {
        setStatus("unsubscribed");
      }
    } catch {
      setStatus("unsubscribed");
    }
  }, [apiFetch]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubscribe = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setMessage({ text: "Your browser does not support push notifications.", type: "error" });
      return;
    }
    setActionLoading(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setMessage({
          text: "Notifications blocked. Go to your browser settings → Site settings → Notifications → Allow this site, then try again.",
          type: "info",
        });
        setActionLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      const { publicKey } = await apiFetch("/api/notifications/vapid-public-key");
      if (!publicKey) throw new Error("Push service not configured on this server.");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subJson = subscription.toJSON();
      const p256dh = subJson.keys?.p256dh;
      const auth = subJson.keys?.auth;
      if (!p256dh || !auth) throw new Error("Missing subscription keys — please try again.");

      const result = await apiFetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subJson.endpoint, p256dh, auth }),
      });

      if (result.success) {
        setStatus("subscribed");
        setLastSubscribed(new Date().toISOString());
        setMessage({ text: "You're all set! You'll now receive push notifications for new tasks, announcements, and account events.", type: "success" });
        showToast("Push notifications enabled!", "success");
        onStatusChange?.(true);
      } else {
        throw new Error(result.error || "Failed to save subscription.");
      }
    } catch (err: any) {
      console.error("Subscribe error:", err);
      setMessage({ text: err.message || "Failed to subscribe. Please try again.", type: "error" });
      showToast("Failed to enable notifications", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      if (registration) {
        const sub = await registration.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
      await apiFetch("/api/notifications/unsubscribe", { method: "POST" });
      setStatus("unsubscribed");
      setLastSubscribed(null);
      setMessage({ text: "You've been unsubscribed. You can re-enable notifications anytime.", type: "info" });
      showToast("Push notifications disabled", "success");
      onStatusChange?.(false);
    } catch (err: any) {
      console.error("Unsubscribe error:", err);
      setMessage({ text: err.message || "Failed to unsubscribe. Please try again.", type: "error" });
      showToast("Failed to disable notifications", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const isSubscribed = status === "subscribed";
  const isBlocked = status === "denied" || status === "unsupported";
  const isLoading = status === "loading";

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal card */}
      <div className="w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">

        {/* ── Header ── */}
        <div className="relative flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shadow-sm ${isSubscribed ? "bg-gradient-to-br from-blue-500 to-blue-700" : "bg-gray-100"}`}>
              {isSubscribed
                ? <Bell className="h-5 w-5 text-white" />
                : <BellOff className="h-5 w-5 text-gray-400" />}
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-gray-900">Manage Notifications</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">TasksEarn Push Alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-5 flex-1">

          {/* Status message */}
          {message && (
            <div className={`rounded-2xl p-3.5 text-xs font-medium border flex items-start gap-2.5 ${
              message.type === "success"
                ? "bg-green-50 border-green-100 text-green-800"
                : message.type === "error"
                ? "bg-red-50 border-red-100 text-red-700"
                : "bg-blue-50 border-blue-100 text-blue-800"
            }`}>
              {message.type === "success" && <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />}
              {message.type === "error" && <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />}
              {message.type === "info" && <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Current status pill */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Current Status</p>
              {isLoading && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="text-xs font-medium">Checking…</span>
                </div>
              )}
              {isSubscribed && (
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 shadow shadow-green-200 ring-2 ring-green-100" />
                  <span className="text-sm font-black text-green-700">Active — Notifications On</span>
                </div>
              )}
              {status === "unsubscribed" && (
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-gray-300" />
                  <span className="text-sm font-black text-gray-500">Not Subscribed</span>
                </div>
              )}
              {status === "denied" && (
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="text-sm font-black text-red-600">Blocked by Browser</span>
                </div>
              )}
              {status === "unsupported" && (
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="text-sm font-black text-amber-600">Not Supported</span>
                </div>
              )}
              {lastSubscribed && isSubscribed && (
                <p className="text-[10px] text-gray-400 mt-1">
                  Since {new Date(lastSubscribed).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
            </div>
            {isSubscribed && (
              <div className="h-10 w-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
            )}
          </div>

          {/* Browser denied guidance */}
          {status === "denied" && (
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-xs text-amber-800 leading-relaxed">
              <p className="font-bold mb-1">How to re-enable notifications:</p>
              <ol className="list-decimal ml-4 space-y-1 text-amber-700">
                <li>Click the 🔒 lock icon in your browser address bar</li>
                <li>Find <strong>Notifications</strong> and set it to <strong>Allow</strong></li>
                <li>Reload the page and tap Subscribe below</li>
              </ol>
            </div>
          )}
          {status === "unsupported" && (
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-xs text-amber-800 leading-relaxed">
              Push notifications work on <strong>Chrome, Edge, Firefox, Brave, Opera, Samsung Internet</strong>, and <strong>Android Chrome</strong>. Switch to a supported browser to enable alerts.
            </div>
          )}

          {/* What you'll receive */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">You'll be notified about</p>
            <div className="space-y-2.5">
              {NOTIFICATION_TYPES.map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
                  <div className={`h-8 w-8 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800">{item.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                  {isSubscribed && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Extra info */}
          {!isBlocked && !isLoading && (
            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              Notifications are delivered even when the app is closed.{" "}
              {isSubscribed ? "Tap the button below to unsubscribe at any time." : "Tap Subscribe to start receiving alerts."}
            </p>
          )}
        </div>

        {/* ── Footer / CTA ── */}
        {!isLoading && !isBlocked && (
          <div className="px-6 pb-6 pt-2">
            {!isSubscribed ? (
              <button
                onClick={handleSubscribe}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-100 transition-all cursor-pointer"
              >
                {actionLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Enabling…</>
                ) : (
                  <><Bell className="h-4 w-4" /> Subscribe — Get Notified Instantly</>
                )}
              </button>
            ) : (
              <button
                onClick={handleUnsubscribe}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-60 py-3 text-sm font-bold text-red-600 transition-all cursor-pointer"
              >
                {actionLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Unsubscribing…</>
                ) : (
                  <><BellOff className="h-4 w-4" /> Turn Off Notifications</>
                )}
              </button>
            )}
          </div>
        )}

        {/* Unsupported/denied close */}
        {isBlocked && (
          <div className="px-6 pb-6 pt-2">
            <button
              onClick={onClose}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 hover:bg-gray-100 py-3 text-sm font-bold text-gray-600 transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
