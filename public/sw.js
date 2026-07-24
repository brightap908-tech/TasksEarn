// TasksEarn Service Worker — Browser Push Notification Support
// Version: 5.0 — Admin + Earner push support

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ─── Push Handler ─────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "📢 New Notification", body: event.data.text() };
  }

  const isAdmin = data.role === "admin";

  // Default fallback URLs by role
  const defaultUrl = isAdmin ? "/admin/audits" : "/earner/tasks";

  const title = data.title || (isAdmin ? "📥 New Task Submission" : "📢 New Task Available");
  const tag   = data.tag  || (isAdmin ? "tasksearn-admin-notification" : "tasksearn-general");
  const url   = data.url  || defaultUrl;

  // Action label
  let viewLabel = "View";
  if (isAdmin) {
    viewLabel = "Review Now";
  } else if (tag === "tasksearn-new-task") {
    viewLabel = "View Tasks";
  } else if (tag === "tasksearn-announcement") {
    viewLabel = "View Announcement";
  } else if (tag === "tasksearn-account") {
    viewLabel = "View Account";
  }

  const options = {
    body:    data.body  || (isAdmin ? "A new task submission awaits your review." : "You have a new notification from TasksEarn."),
    icon:    data.icon  || "/icon-192.png",
    badge:   data.badge || "/icon-72.png",
    tag,
    renotify: true,
    requireInteraction: isAdmin, // Keep admin notifications visible until dismissed
    silent: false,
    vibrate: [200, 100, 200],
    data: { url, role: data.role || "earner" },
    actions: [
      { action: "open",    title: viewLabel },
      { action: "dismiss", title: "Dismiss"  }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification Click Handler ───────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const notifData = event.notification.data || {};
  const role = notifData.role || "earner";

  // Resolve target URL from notification data, fall back by role
  const targetUrl = notifData.url ||
    (role === "admin" ? "/admin/audits" : "/earner/tasks");

  // Build absolute target URL using the service worker's own origin
  const absoluteTarget = targetUrl.startsWith("http")
    ? targetUrl
    : self.location.origin + targetUrl;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus an existing tab that belongs to this origin
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            // Navigate existing tab to target and focus it
            client.navigate(absoluteTarget);
            return client.focus();
          }
        }
        // No existing tab — open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(absoluteTarget);
        }
      })
  );
});
