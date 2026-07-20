import React, { useState, useEffect, useCallback } from "react";
import { EarnerNotification } from "../types";
import PlatformIcon from "./PlatformIcon";
import { Bell, BellOff, CheckCheck, Clock, ChevronRight, Inbox, Loader2, CheckCircle2 } from "lucide-react";

// ─── VAPID helper ─────────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type PushStatus = "checking" | "unsupported" | "subscribed" | "unsubscribed" | "denied" | "loading";

interface EarnerNotificationsProps {
  notifications: EarnerNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (view: string) => void;
  onTaskClick: (taskId: string) => void;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
  showToast: (message: string, type?: "success" | "error") => void;
}

// ─── Push subscription card ───────────────────────────────────────────────────
function BrowserPushCard({
  apiFetch,
  showToast,
}: Pick<EarnerNotificationsProps, "apiFetch" | "showToast">) {
  const [status, setStatus] = useState<PushStatus>("checking");

  // Determine initial status once
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    const perm = Notification.permission;
    if (perm === "denied") { setStatus("denied"); return; }
    apiFetch("/api/notifications/status")
      .then(res => setStatus(res.subscribed ? "subscribed" : "unsubscribed"))
      .catch(() => setStatus("unsubscribed"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubscribe = useCallback(async () => {
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      const { publicKey } = await apiFetch("/api/notifications/vapid-public-key");
      if (!publicKey) throw new Error("VAPID key missing");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subJson = sub.toJSON();
      if (!subJson.keys?.p256dh || !subJson.keys?.auth) throw new Error("Subscription keys missing");

      const result = await apiFetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        }),
      });

      if (!result.success) throw new Error(result.error || "Failed to save subscription");

      setStatus("subscribed");
      showToast("🔔 Browser notifications enabled! You'll be alerted when new tasks arrive.", "success");
    } catch (err: any) {
      console.error("[PushCard] subscribe error:", err);
      showToast("Could not enable notifications. Please try again.", "error");
      setStatus(Notification.permission === "denied" ? "denied" : "unsubscribed");
    }
  }, [apiFetch, showToast]);

  // Don't render anything while checking or if unsupported
  if (status === "checking" || status === "unsupported") return null;

  return (
    <div className={`rounded-2xl border p-4 mb-1 flex items-center gap-4 ${
      status === "subscribed"
        ? "border-green-200 bg-green-50"
        : status === "denied"
        ? "border-amber-200 bg-amber-50"
        : "border-blue-200 bg-blue-50"
    }`}>
      {/* Icon */}
      <div className={`shrink-0 flex items-center justify-center rounded-xl h-10 w-10 ${
        status === "subscribed" ? "bg-green-100" : status === "denied" ? "bg-amber-100" : "bg-blue-100"
      }`}>
        {status === "subscribed"
          ? <CheckCircle2 className="h-5 w-5 text-green-600" />
          : status === "denied"
          ? <BellOff className="h-5 w-5 text-amber-500" />
          : <Bell className="h-5 w-5 text-blue-600" />}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        {status === "subscribed" && (
          <>
            <p className="text-xs font-bold text-green-800">Browser notifications enabled ✅</p>
            <p className="text-[11px] text-green-700 mt-0.5">
              You'll receive an alert on your device whenever a new task is posted — even when the browser is closed.
            </p>
          </>
        )}
        {status === "denied" && (
          <>
            <p className="text-xs font-bold text-amber-800">Notifications are blocked</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Go to <strong>Browser Settings → Site Settings → Notifications</strong>, allow this site, then tap Retry below.
            </p>
          </>
        )}
        {(status === "unsubscribed" || status === "loading") && (
          <>
            <p className="text-xs font-bold text-blue-900">Enable Browser Notifications</p>
            <p className="text-[11px] text-blue-700 mt-0.5">
              Get instant alerts when new tasks are posted — even when the website is closed.
            </p>
          </>
        )}
      </div>

      {/* CTA */}
      {status !== "subscribed" && (
        <button
          onClick={handleSubscribe}
          disabled={status === "loading"}
          className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
            status === "denied"
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {status === "loading"
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Enabling…</>
            : status === "denied"
            ? <><Bell className="h-3.5 w-3.5" />Retry</>
            : <><Bell className="h-3.5 w-3.5" />Enable Browser Notifications</>
          }
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function EarnerNotifications({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
  onTaskClick,
  apiFetch,
  showToast,
}: EarnerNotificationsProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  };

  const handleNotifClick = (n: EarnerNotification) => {
    if (!n.read) onMarkRead(n.id);
    onTaskClick(n.taskId);
    onNavigate("earner-tasks");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-gray-900">Notifications</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* ── Browser push subscription card ── */}
      <BrowserPushCard apiFetch={apiFetch} showToast={showToast} />

      {/* Notification list */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="rounded-2xl bg-gray-50 p-5 mb-4">
              <Inbox className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-xs font-bold text-gray-500">No notifications yet</p>
            <p className="text-[10px] text-gray-400 mt-1 max-w-xs">
              When advertisers post new tasks matching your account, you'll be notified here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotifClick(n)}
                className={`w-full text-left px-5 py-4 hover:bg-gray-50/70 transition-colors flex items-start gap-4 ${
                  !n.read ? "bg-blue-50/40" : ""
                }`}
              >
                {/* Platform Icon */}
                <div className="shrink-0 mt-0.5">
                  <PlatformIcon platform={n.platform} size={28} showBg />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs font-bold leading-snug line-clamp-2 ${!n.read ? "text-gray-900" : "text-gray-700"}`}>
                      {n.message}
                    </p>
                    {!n.read && (
                      <span className="shrink-0 mt-1 h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>

                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                      {n.platform}
                    </span>
                    <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                      ₦{n.reward.toLocaleString()} reward
                    </span>
                    <span className="flex items-center gap-0.5 text-[9px] text-gray-400 font-medium">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDate(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{n.taskTitle}</p>
                </div>

                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 mt-1" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
