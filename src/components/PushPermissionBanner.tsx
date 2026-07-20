/**
 * PushPermissionBanner
 *
 * A non-intrusive sticky banner shown to logged-in earners when push
 * notification permission has not been granted (or was denied).
 *
 * - "default"     → shows "Enable Notifications" CTA that triggers the full
 *                   subscribe flow (request permission → SW subscribe → save to DB)
 * - "denied"      → shows browser-settings instructions
 * - "granted"+sub → renders nothing
 *
 * The banner can be dismissed by the user; the preference is stored in
 * localStorage so it does not re-appear in the same session.
 */
import React, { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, X, Loader2 } from "lucide-react";

interface Props {
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
  showToast: (message: string, type?: "success" | "error") => void;
}

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

const DISMISS_KEY = "te_push_banner_dismissed_v1";

export default function PushPermissionBanner({ apiFetch, showToast }: Props) {
  type BannerState = "hidden" | "prompt" | "denied" | "loading" | "success";
  const [state, setState] = useState<BannerState>("hidden");

  // Determine initial state once on mount
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const perm = Notification.permission;

    if (perm === "denied") {
      setState("denied");
      return;
    }

    if (perm === "granted") {
      // Check if there's already an active subscription — if so stay hidden
      apiFetch("/api/notifications/status")
        .then(res => { if (!res.subscribed) setState("prompt"); })
        .catch(() => setState("prompt"));
      return;
    }

    // "default" — not yet asked (or silently dismissed)
    setState("prompt");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = useCallback(() => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setState("hidden");
  }, []);

  const handleEnable = useCallback(async () => {
    setState("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      const { publicKey } = await apiFetch("/api/notifications/vapid-public-key");
      if (!publicKey) throw new Error("Missing VAPID key");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      const subJson = subscription.toJSON();
      const p256dh = subJson.keys?.p256dh;
      const auth = subJson.keys?.auth;
      if (!p256dh || !auth) throw new Error("Missing subscription keys");

      const result = await apiFetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subJson.endpoint, p256dh, auth })
      });

      if (!result.success) throw new Error(result.error || "Save failed");

      setState("success");
      showToast("🔔 Push notifications enabled! You'll be notified when new tasks arrive.", "success");
      // Auto-hide after 3 s
      setTimeout(() => setState("hidden"), 3000);
    } catch (err: any) {
      console.error("[PushBanner] subscribe error:", err);
      showToast("Could not enable notifications. Try again from Settings.", "error");
      setState("prompt");
    }
  }, [apiFetch, showToast]);

  if (state === "hidden") return null;

  /* ── Success flash ── */
  if (state === "success") {
    return (
      <div className="mx-auto mb-4 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-sm">
        <Bell className="h-4 w-4 shrink-0 text-green-600" />
        <span className="font-semibold">Notifications enabled! You'll be alerted when new tasks are posted.</span>
      </div>
    );
  }

  /* ── Browser denied — show instructions ── */
  if (state === "denied") {
    return (
      <div className="mx-auto mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
        <BellOff className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-amber-800 mb-0.5">Notifications are blocked by your browser</p>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            To re-enable: open your browser <strong>Settings → Site settings → Notifications</strong>, find this site, and set it to <strong>Allow</strong>. Then reload the page.
          </p>
        </div>
        <button onClick={dismiss} className="shrink-0 text-amber-400 hover:text-amber-600 cursor-pointer" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  /* ── Default / prompt ── */
  return (
    <div className="mx-auto mb-4 flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
      <Bell className="h-4 w-4 shrink-0 text-blue-500" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-blue-900 mb-0.5">Get notified about new tasks</p>
        <p className="text-[11px] text-blue-700">Receive instant alerts when a new earning task is posted — even when your browser is closed.</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleEnable}
          disabled={state === "loading"}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-3 py-1.5 text-xs font-bold text-white transition-all cursor-pointer"
        >
          {state === "loading"
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Bell className="h-3.5 w-3.5" />
          }
          {state === "loading" ? "Enabling…" : "Enable Notifications"}
        </button>
        <button onClick={dismiss} className="text-blue-300 hover:text-blue-500 cursor-pointer" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
