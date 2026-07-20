// TasksEarn Service Worker — Browser Push Notification Support
// Version: 3.0

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
    data = { title: "🔔 TasksEarn Alert", body: event.data.text() };
  }

  const title = data.title || "🔔 TasksEarn Alert";
  const tag = data.tag || "tasksearn-general";
  const url = data.url || "/earner/tasks";

  // Choose action labels based on notification type
  let viewLabel = "View";
  if (tag === "tasksearn-new-task") viewLabel = "View Tasks";
  else if (tag === "tasksearn-announcement") viewLabel = "View Announcement";
  else if (tag === "tasksearn-account") viewLabel = "View Account";

  const options = {
    body: data.body || "You have a new notification from TasksEarn.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag,
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: { url },
    actions: [
      { action: "open", title: viewLabel },
      { action: "dismiss", title: "Dismiss" }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification Click Handler ───────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl = (event.notification.data && event.notification.data.url) || "/earner/tasks";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus an existing tab if it belongs to the same origin
        for (const client of clientList) {
          if (
            (client.url.startsWith(self.location.origin) ||
              client.url.includes("tasksearn")) &&
            "focus" in client
          ) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // No existing tab — open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
