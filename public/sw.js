// TasksEarn Service Worker — Browser Push Notification Support
// Version: 4.0

const PRODUCTION_TASKS_URL = "https://tasksearn.name.ng/tasks";

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
    data = { title: "📢 New Task Available", body: event.data.text() };
  }

  const title = data.title || "📢 New Task Available";
  const tag   = data.tag  || "tasksearn-general";
  const url   = data.url  || PRODUCTION_TASKS_URL;

  // Action label based on notification type
  let viewLabel = "View";
  if (tag === "tasksearn-new-task")    viewLabel = "View Tasks";
  else if (tag === "tasksearn-announcement") viewLabel = "View Announcement";
  else if (tag === "tasksearn-account")      viewLabel = "View Account";

  const options = {
    body:    data.body  || "You have a new notification from TasksEarn.",
    icon:    data.icon  || "/icon-192.png",   // full-size icon shown beside notification
    badge:   data.badge || "/icon-72.png",    // small monochrome badge (Android status bar)
    tag,
    renotify: true,             // play sound/vibrate even if same tag replaces old notification
    requireInteraction: false,
    silent: false,              // use device default notification sound
    vibrate: [200, 100, 200],
    data: { url },
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

  // Prefer the URL carried in the notification data; fall back to production tasks page
  const targetUrl =
    (event.notification.data && event.notification.data.url) ||
    PRODUCTION_TASKS_URL;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus and navigate an existing app tab if available
        for (const client of clientList) {
          const isSameOrigin =
            client.url.startsWith(self.location.origin) ||
            client.url.includes("tasksearn");
          if (isSameOrigin && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // No existing tab — open a new window at the target URL
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
