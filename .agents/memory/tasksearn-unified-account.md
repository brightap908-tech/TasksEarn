---
name: TasksEarn unified account migration
description: Covers the full migration from dual Earner/Advertiser roles to a single User role with two wallets (walletBalance=earnings, adBalance=campaign spend), new UnifiedDashboard, and App.tsx wiring.
---

## The Rule
All regular users are now `role = 'User'`. Legacy `Earner`/`Advertiser` rows are migrated at DB bootstrap. Admin stays `Admin`. Never create a new Earner or Advertiser role.

## Two Wallets
- `wallet_balance` → earnings (task rewards + withdrawals)
- `ad_balance` → advertising only (deposits → campaign spend)
- `mapUser` in server.ts exposes both as `walletBalance` and `adBalance`
- Campaign creation and delete-refund use `ad_balance`, NOT `wallet_balance`
- Deposits (Paystack webhook + browser callback) credit `ad_balance`

## API Guards Pattern
All earner/advertiser endpoints guard with `user.role === UserRole.ADMIN` (reject only admin, allow any user). Never use `user.role !== UserRole.EARNER`.

## Frontend Routing
- `/dashboard/:section` → `UnifiedDashboard` (10 sections: overview, tasks, my-tasks, create-campaign, my-campaigns, wallet, withdraw, referrals, notifications, profile)
- `/dashboard/tasks/:taskId/submit` → `EarnerTaskSubmitPage`
- `/dashboard/my-tasks/:submissionId/resubmit` → `EarnerRejectedTaskResubmitPage`
- `/earner/*` and `/advertiser/*` redirect to `/dashboard/overview`
- `/advertiser-login` redirects to `/login`
- Admin still uses `/admin/:section`

## Auth Flow
- `checkSession`, `handleLogin`, `handleVerifyEmail` all route non-admin to `dashboard-overview`
- Registration: no `role` field in body; server always assigns `'User'`; referral code shown for all users
- WebSocket guard: `user.role === UserRole.ADMIN` (skip admin, connect everyone else)

## UnifiedDashboard Props
`user, onRefreshUser, onNavigate, onLogout, apiFetch, showToast, settings, earnerNotifications, onMarkNotificationRead, onMarkAllNotificationsRead, onOpenDeposit, isDarkMode`

**Why:** Dual-role UX was confusing and blocked cross-selling. Single account with two balance types is simpler and allows any user to earn and advertise.
