---
name: Admin submission notifications
description: Delivery and persistence decisions for real-time admin alerts when earners submit tasks.
---

Admin task-submission alerts should be persisted before broadcast, keyed by a unique submission event, and delivered to every active admin client over the existing WebSocket channel. The browser client must deduplicate by persisted notification ID and poll only while the socket is unavailable.

**Why:** Multiple browser tabs/devices and reconnects can otherwise replay the same alert or inflate the unread badge; persistence also makes alerts survive refresh and logout.

**How to apply:** Extend the existing notifications table/API and `/ws` registration flow rather than adding a second transport. Keep browser permission, sound, in-app read state, and review navigation in the admin dashboard client.