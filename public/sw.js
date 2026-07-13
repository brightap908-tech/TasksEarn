// TasksEarn Service Worker — Push Notification Support
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "TasksEarn", body: event.data.text() };
  }

  const title = data.title || "🔔 TasksEarn";
  const options = {
    body: data.body || "New task available! Complete it now and earn money.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "tasksearn-notif",
    renotify: true,
    data: { url: data.url || "/earner/notifications" },
    actions: [
      { action: "open", title: "View Task" },
      { action: "dismiss", title: "Dismiss" }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl = (event.notification.data && event.notification.data.url) || "/earner/notifications";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.postMessage({ type: "navigate", url: targetUrl });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
