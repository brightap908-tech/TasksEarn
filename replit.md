# TasksEarn — Premium Microtask Platform

A full-stack microtask platform where earners complete social media tasks for ₦ (Nigerian Naira) rewards, advertisers create campaigns, and admins manage the platform.

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS v4 + TypeScript
- **Backend**: Node.js + Express (single unified server in `server.ts`)
- **Database**: PostgreSQL (Replit-managed, auto-injected as `DATABASE_URL`)
- **Dev runtime**: `tsx` (TypeScript execution for the server in dev mode)

## How to Run

```bash
npm install
npm run dev
```

The server starts on port **5000** and serves both the Express API and the Vite dev server in one process.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (tsx server.ts) |
| `npm run build` | Build frontend + bundle server to dist/ |
| `npm start` | Run production build |
| `npm run lint` | TypeScript type-check |

## Database

- All data is stored in **PostgreSQL**. The server picks its connection string via `NEON_DATABASE_URL` (preferred, external Neon Postgres) and falls back to `DATABASE_URL` (Replit-managed) if `NEON_DATABASE_URL` is not set.
- Tables are created automatically on first boot via `bootstrapTables()` in `server.ts` — this runs against whichever database is configured, so pointing at a fresh Neon database creates the full schema automatically.
- Seed data (3 demo users, sample tasks, transactions, etc.) is inserted on first boot when the `users` table is empty.
- **db.json is no longer used** — the file is kept as a reference artifact only.
- To deploy against Neon (e.g. on Render), set `NEON_DATABASE_URL` to the Neon connection string (`postgresql://...sslmode=require`) as an environment variable/secret on the host — never commit it to source.

## Environment Variables

| Key | Required | Notes |
|---|---|---|
| `NEON_DATABASE_URL` | Preferred | External Neon PostgreSQL connection string; takes priority over `DATABASE_URL` when set |
| `DATABASE_URL` | Fallback | Auto-injected by Replit PostgreSQL; used only if `NEON_DATABASE_URL` is absent |
| `SESSION_SECRET` | Yes | Already set as Replit Secret |
| `PORT` | Set to 5000 | Required for Replit webview |
| `RESEND_API_KEY` + `RESEND_FROM` | Optional | Email via Resend (for email verification) |
| `SMTP_HOST/PORT/USER/PASSWORD/FROM` | Optional | Email via SMTP (fallback to Resend) |
| `PAYSTACK_SECRET_KEY` | Optional | Required to accept real deposits |
| `GEMINI_API_KEY` | Optional | AI features |
| `VAPID_PUBLIC_KEY` | Set | Auto-generated VAPID public key for Web Push notifications |
| `VAPID_PRIVATE_KEY` | Set | Auto-generated VAPID private key (store as Replit Secret) |
| `VAPID_SUBJECT` | Set | VAPID contact email for Web Push (e.g. `mailto:admin@tasksearn.com`) |
| `VAPID_PUBLIC_KEY` | Set | Auto-generated VAPID public key for Web Push |
| `VAPID_PRIVATE_KEY` | Set | Auto-generated VAPID private key for Web Push |
| `VAPID_SUBJECT` | Set | VAPID contact email (`mailto:admin@tasksearn.com`) |

## Theme

- **Default**: Blue (#0066FF) and White light theme
- **Dark Mode**: Available via the moon/sun toggle in the navbar; stored in `localStorage` as `"dark"/"light"`.
- Theme is applied via `html.dark` class on the document root (set by `App.tsx`).

## Advertiser Profile API

| Endpoint | Method | Description |
|---|---|---|
| `/api/user/profile` | PUT | Update profile (name, username, phone, country, businessName, photoUrl, twoFactorEnabled, notificationPrefs) |
| `/api/user/change-password` | PUT | Change password with current password verification |
| `/api/user/account` | DELETE | Delete account with password confirmation |

New user profile columns (auto-migrated on boot):
`username`, `phone`, `country`, `business_name`, `photo_url`, `two_factor_enabled`, `notification_prefs` (JSONB)

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@tasksearn.com | password123 |
| Earner | earner@tasksearn.com | password123 |
| Advertiser | advertiser@tasksearn.com | password123 |

## Project Structure

```
server.ts          # Express API + Vite middleware + DB bootstrap/seed
src/
  App.tsx          # Core routing & state
  components/      # Dashboard components (Earner, Advertiser, Admin)
  postgresDb.ts    # Legacy PostgreSQL adapter (no longer used by server.ts)
  mockDb.ts        # localStorage-based fallback (GitHub Pages static mode)
  types.ts         # TypeScript interfaces & enums
database.sql       # MySQL schema reference (for external DB setup)
```

## Architecture Notes

- **Authentication**: Bearer token contains raw user ID (`Authorization: Bearer <userId>`). `getAuthenticatedUser()` in `server.ts` is async and queries the DB on every authenticated request.
- **Financial operations** (campaign creation, submission approval, withdrawal approval, deposit verification) are wrapped in PostgreSQL transactions with `SELECT ... FOR UPDATE` row locking to prevent race conditions and partial writes.
- **Notifications**: Stored in the `notifications` PostgreSQL table. Real-time broadcast to admin via WebSocket on `/ws`.
- **Routing**: `react-router-dom` (`BrowserRouter`, wrapped in `src/main.tsx`). Every page — including every dashboard menu section — has its own URL: `/earner/:section`, `/advertiser/:section`, `/admin/:section` for dashboards, plus `/login`, `/register`, `/about`, etc. `src/lib/routes.ts` maps legacy view-name strings to real paths so existing `onNavigate("view-name")` calls keep working. `src/components/BackButton.tsx` is rendered on every non-home page.

## User Preferences

- Do not change the UI or remove any existing features.
- Keep the existing project structure and stack.
