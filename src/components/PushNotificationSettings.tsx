import React, { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";

interface PushNotificationSettingsProps {
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
  showToast: (message: string, type?: "success" | "error") => void;
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

export default function PushNotificationSettings({ apiFetch, showToast }: PushNotificationSettingsProps) {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [lastSubscribed, setLastSubscribed] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const checkStatus = useCallback(async () => {
    // Check browser support first
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }

    // Check permission
    const perm = Notification.permission;
    if (perm === "denied") {
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

  const handleSubscribe = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setMessage({ text: "Your browser does not support push notifications.", type: "error" });
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setMessage({
          text: "Notifications are currently disabled. You can enable them anytime from your browser settings and click Subscribe again.",
          type: "info"
        });
        setActionLoading(false);
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      // Get VAPID public key
      const { publicKey } = await apiFetch("/api/notifications/vapid-public-key");
      if (!publicKey) throw new Error("Missing VAPID public key");

      // Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      const subJson = subscription.toJSON();
      const p256dh = subJson.keys?.p256dh;
      const auth = subJson.keys?.auth;

      if (!p256dh || !auth) throw new Error("Missing subscription keys");

      // Save to backend
      const result = await apiFetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          p256dh,
          auth
        })
      });

      if (result.success) {
        setStatus("subscribed");
        setLastSubscribed(new Date().toISOString());
        setMessage({ text: "Notifications enabled successfully.", type: "success" });
        showToast("Push notifications enabled!", "success");
      } else {
        throw new Error(result.error || "Failed to save subscription");
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
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      await apiFetch("/api/notifications/unsubscribe", { method: "POST" });

      setStatus("unsubscribed");
      setLastSubscribed(null);
      setMessage({ text: "You have been unsubscribed from push notifications.", type: "info" });
      showToast("Push notifications disabled", "success");
    } catch (err: any) {
      console.error("Unsubscribe error:", err);
      setMessage({ text: err.message || "Failed to unsubscribe. Please try again.", type: "error" });
      showToast("Failed to disable notifications", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="font-display text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
        <Bell className="h-4 w-4 text-blue-500" />
        Notification Settings
      </h3>
      <p className="text-xs text-gray-500 mb-5">
        Get notified instantly when new tasks are posted. Never miss an earning opportunity.
      </p>

      {/* Status Banner */}
      {message && (
        <div className={`mb-4 rounded-xl p-3 text-xs font-medium border flex items-start gap-2 ${
          message.type === "success"
            ? "bg-green-50 border-green-100 text-green-800"
            : message.type === "error"
            ? "bg-red-50 border-red-100 text-red-700"
            : "bg-blue-50 border-blue-100 text-blue-800"
        }`}>
          {message.type === "success" && <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
          {message.type === "error" && <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
          {message.type === "info" && <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Status Card */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Notification Status</p>
            {status === "loading" && (
              <div className="flex items-center gap-1.5 text-gray-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-xs">Checking status…</span>
              </div>
            )}
            {status === "subscribed" && (
              <div className="flex items-center gap-1.5 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-bold">✅ Subscribed</span>
              </div>
            )}
            {(status === "unsubscribed") && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <BellOff className="h-4 w-4" />
                <span className="text-sm font-bold">❌ Not Subscribed</span>
              </div>
            )}
            {status === "denied" && (
              <div className="flex items-center gap-1.5 text-red-500">
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-bold">Blocked by Browser</span>
              </div>
            )}
            {status === "unsupported" && (
              <div className="flex items-center gap-1.5 text-amber-500">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-bold">Not Supported</span>
              </div>
            )}
          </div>

          <div className={`h-3 w-3 rounded-full ${
            status === "subscribed" ? "bg-green-500 shadow-sm shadow-green-200" :
            status === "denied" || status === "unsupported" ? "bg-red-400" :
            status === "loading" ? "bg-gray-300 animate-pulse" :
            "bg-gray-300"
          }`} />
        </div>

        {lastSubscribed && status === "subscribed" && (
          <p className="text-[10px] text-gray-400 mt-2">
            Last subscribed: {new Date(lastSubscribed).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}

        {status === "denied" && (
          <p className="text-[10px] text-amber-600 mt-2">
            To re-enable, go to your browser settings → Site settings → Notifications → Allow for this site.
          </p>
        )}

        {status === "unsupported" && (
          <p className="text-[10px] text-gray-500 mt-2">
            Push notifications are supported on Chrome, Edge, Firefox, Brave, Opera, Samsung Internet, and Android Chrome.
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {status !== "loading" && status !== "unsupported" && (
        <div className="flex gap-3">
          {status !== "subscribed" && status !== "denied" && (
            <button
              onClick={handleSubscribe}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 py-2.5 text-sm font-bold text-white shadow transition-all cursor-pointer"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              Subscribe to Notifications
            </button>
          )}

          {status === "subscribed" && (
            <button
              onClick={handleUnsubscribe}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-60 py-2.5 text-sm font-bold text-red-600 transition-all cursor-pointer"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
              Unsubscribe
            </button>
          )}

          {status === "denied" && (
            <button
              onClick={handleSubscribe}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 disabled:opacity-60 py-2.5 text-sm font-bold text-gray-600 transition-all cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              Try Again
            </button>
          )}
        </div>
      )}

      {/* Feature List */}
      <div className="mt-5 pt-4 border-t border-gray-100">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">What you'll get</p>
        <ul className="space-y-2">
          {[
            "Instant alerts when new tasks are posted",
            "Notifications even when browser is closed",
            "Works on Android & Desktop browsers",
            "One tap to go directly to available tasks"
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
