---
name: Social Follow Protection
description: Batch-capped earner delivery for follow campaigns — how it works end-to-end.
---

## Rule
Follow campaigns (any `category` containing "follow", case-insensitive) are delivered to earners in batches of `FOLLOW_PROTECTION_BATCH_SIZE` (25) at a time. A new batch opens automatically once all slots in the previous batch are reviewed by the advertiser.

**Why:** Sudden follower spikes can trigger platform trust-and-safety flags. Gradual drip delivery looks organic.

## How to apply

### Server (`server.ts`)
- `isFollowProtectedTask(category: string): boolean` — case-insensitive `includes("follow")` check.
- `FOLLOW_PROTECTION_BATCH_SIZE = 25` constant.
- `GET /api/earner/tasks` SQL uses a `CASE WHEN LOWER(t.category) LIKE '%follow%'` branch to compare against `LEAST((FLOOR(filled_slots/$2) * $2 + $2)::int, total_slots)` instead of `total_slots`.
- `POST /api/earner/tasks/:id/submit` — follow tasks check `filledSlots + occupied >= batchCap` (same math) and return `{ error: "…", batchFull: true }` 400.

### Frontend (`AdvertiserDashboard.tsx`)
- `isFollowTask(cat)` helper — same `toLowerCase().includes("follow")`.
- `FOLLOW_BATCH_SIZE = 25`.
- `getFollowBatchInfo(task)` — computes currentBatch, totalBatches, batchDone, batchSize, batchPct, overallPct from `task.filledSlots` and `task.totalSlots`. No API call needed; all derivable client-side.
- Create form: shows a `<Shield>` notice when action = Follow.
- Create form submission: if follow task, saves payload to `pendingCampaignPayload` state and opens `showFollowProtectionModal` before the API call.
- Manage tab: shows "🛡️ Protected" badge + dual progress bars (current batch + overall) for every follow campaign.

## Key decision
`batchCap = Math.min(Math.floor(filledSlots / BATCH) * BATCH + BATCH, totalSlots)` — this formula must be identical in the SQL, the submit handler, and the frontend display. If the batch size ever changes, update all three.
