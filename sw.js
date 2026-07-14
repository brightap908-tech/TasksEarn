// TasksEarn Service Worker — Browser Push Notification Support
// Version: 2.0

const CACHE_NAME = "tasksearn-v1";

self.addEventListener("install", (event) => {
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
    data = { title: "🎉 New Task Available", body: event.data.text() };
  }

  const title = data.title || "🎉 New Task Available";
  const options = {
    body: data.body || "A new earning task has been posted. Tap to complete it before it fills up.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "tasksearn-new-task",
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { url: data.url || "/earner/tasks" },
    actions: [
      { action: "open", title: "View Tasks" },
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
