---
name: TasksEarn URL routing pattern
description: How dashboard navigation was converted from state-based tab switching to real URLs, and the convention to follow for any new dashboard section.
---

TasksEarn originally had no router — `App.tsx` used a single `currentView` string
state and each of the three dashboards (Earner/Advertiser/Admin) used its own
internal `activeTab` state to swap section content in place. This was replaced
with `react-router-dom`.

**Convention:** each dashboard is mounted at `/earner/:section`,
`/advertiser/:section`, `/admin/:section`. Inside each dashboard component,
`activeTab` is *derived* from `useParams().section` (falling back to the
default tab when missing/invalid) and `setActiveTab` is a thin wrapper that
calls `navigate(`/role/${tab}`)` instead of `setState`. The section content
itself is still selected with the original `activeTab === "x" && (...)`
conditional blocks — only the state source changed from local state to the
URL. This was a deliberate minimal-risk choice to give every section a real,
bookmarkable URL without rewriting ~1500-2400 lines of JSX per dashboard.

**Why this matters:** any new dashboard section must be added as a new valid
value in the `VALID_*_TABS` array (in the same dashboard file) and a matching
sidebar entry — not as extra local state — or it won't get its own URL and
will break the back button / browser history expectations already in place.

`src/lib/routes.ts` holds the legacy-view-string ↔ path mapping
(`VIEW_TO_PATH`, `resolvePath`, `pathToView`) used to keep `Navbar.tsx` and
other callers of `onNavigate("some-legacy-view-name")` working unchanged
against the new router. Add new top-level pages there, not as ad-hoc paths.

`src/components/BackButton.tsx` is the shared back-navigation control added to
every non-home route; reuse it rather than adding bespoke back buttons.
