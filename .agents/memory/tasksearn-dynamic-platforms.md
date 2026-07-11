---
name: TasksEarn dynamic social media platforms
description: How platform management became DB-driven in TasksEarn, and what to check before assuming something is still hardcoded.
---

The `social_platforms` table, its migration/seed logic, and the full admin CRUD REST API
(`/api/platforms`, `/api/admin/platforms`) already existed in `server.ts` before the frontend
used any of it — a prior session built the backend but never wired the UI. When a backend
feature looks "done" but has no visible UI for it, grep the frontend for the endpoint path
before assuming it needs building from scratch on both ends.

**Why this matters:** Task categories are composed as free-text strings `"{Platform} {Action}"`
(e.g. "Instagram Follow") rather than being tied to a fixed enum in the DB — the legacy
`TaskCategory`/`Platform` enums in `types.ts` are kept only for backward compatibility with
old seed data and simple lookups (icon fallback, `getPlatformForCategory`). Any new
platform-aware UI should read platforms from `/api/platforms` (via `src/lib/platformsStore.ts`'s
`usePlatforms()` hook) and match by platform *name* substring, not by extending the enum.

**How to apply:** When adding new platform-driven features (task creation, filters, pricing),
match/filter by the platform name string against composed category text
(`category.toLowerCase().includes(platformName.toLowerCase())`), not exact equality — exact
equality against a bare platform name will never match a composed category.
