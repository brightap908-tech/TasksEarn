# TasksEarn — Premium Microtask Platform

A full-stack microtask platform where earners complete social media tasks for ₦ (Nigerian Naira) rewards, advertisers create campaigns, and admins manage the platform.

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS v4 + TypeScript
- **Backend**: Node.js + Express (single unified server)
- **Database**: PostgreSQL (Replit-managed, auto-injected as `DATABASE_URL`) with `db.json` fallback
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

- In dev: Replit auto-injects `DATABASE_URL` for the built-in PostgreSQL database. Tables are auto-created on first boot via `bootstrapTables()` in `src/postgresDb.ts`.
- Without `DATABASE_URL`, the app falls back to `db.json` (file-based persistence).

## Environment Variables

| Key | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Recommended | Auto-injected by Replit PostgreSQL |
| `SESSION_SECRET` | Yes | Already set as Replit Secret |
| `PORT` | Set to 5000 | Required for Replit webview |
| `RESEND_API_KEY` + `RESEND_FROM` | Optional | Email via Resend |
| `SMTP_*` | Optional | Email via SMTP |
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` | Optional | Payment gateway |
| `GEMINI_API_KEY` | Optional | AI features |

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@tasksearn.com | password123 |
| Earner | earner@tasksearn.com | password123 |
| Advertiser | advertiser@tasksearn.com | password123 |

## Project Structure

```
server.ts          # Express API + Vite middleware integration
src/
  App.tsx          # Core routing & state
  components/      # Dashboard components (Earner, Advertiser, Admin)
  postgresDb.ts    # PostgreSQL adapter (bootstrap, load, save)
  mockDb.ts        # localStorage-based fallback (GitHub Pages)
  types.ts         # TypeScript interfaces
db.json            # Auto-generated file-based DB (fallback)
database.sql       # MySQL schema reference (for external DB setup)
```

## User Preferences

- Do not change the UI or remove any existing features.
- Keep the existing project structure and stack.
