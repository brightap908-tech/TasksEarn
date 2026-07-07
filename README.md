# TasksEarn - Premium Microtask Platform

TasksEarn is a highly polished, production-ready full-stack microtask application inspired by the workflow Tasks. Built using a modern, reactive stack, it is optimized for high performance, ease of deployment, and mobile-first responsive interactions.

---

## 🛠️ Technology Stack

*   **Frontend**: React (v19) with Vite, Tailwind CSS, Motion Animations, Lucide Icons, and TypeScript.
*   **Backend Options**:
    1.  **Node.js / Express Server** (Included as primary full-stack engine) — Includes full session persistence inside `db.json`.
    2.  **MySQL Database** — Complete raw schema file (`database.sql`) provided for production database syncing.
*   **Currency**: Nigerian Naira (₦) exclusively.
*   **Simulated Gateways**: Pre-configured secure Paystack / Flutterwave mock integration models.

---

## 🚀 Primary App Features

### 👨‍💻 Earner Portal
*   **Registration & Logins**: Automatic referral code attribution from query handles (e.g., `?ref=TUNDE887`).
*   **Browse Jobs**: Filter by active social media platforms (YouTube, Instagram, Facebook, TikTok, Website visit, etc.).
*   **Job Submissions**: Rich proof submissions containing required screenshot uploads or plain links.
*   **Naira Wallet & Bank Withdrawals**: Standard bank payout desk featuring major local banks (Access, GTB, Zenith, OPay, PalmPay, etc.).
*   **Referral Engine**: Direct link sharing models with automatic reward credits.

### 📢 Advertiser Portal
*   **Campaign Creation Engine**: Category templates with dynamic pricing calculative sliders. Automatically estimates platform fees (35% standard markup).
*   **Job Budget Allocator**: Real-time slots matching balances.
*   **Campaign Control Panel**: Pause, resume, or delete tasks.
*   **Submissions Auditing Desk**: Directly approve or reject earner proof snapshots with admin-level feedback logs.
*   **Mock Wallet Funding**: Simulated secure checkout popups via Paystack and Flutterwave gateway credentials.

### 👑 Admin Control Panel
*   **Overview Dashboard**: Visual analytics counters capturing total earners, advertisers, campaigns, bank withdrawal queues, and deposits.
*   **Users Management**: Verify, unverify, or adjust user balances manually.
*   **Campaign Auditing**: Standard moderation of active advertiser jobs.
*   **Withdrawal Desk**: Review queue, pay to specified accounts, or decline and automatically refund back to earner wallets.
*   **Announcements Bulletin**: Post dynamic banners and information notice widgets directly to dashboards.
*   **CMS Content Editor**: Update About, Contact, FAQ, Terms, and Privacy texts directly from the dashboard.

---

## 📦 File Structures

```
├── /src
│   ├── /components
│   │   ├── Navbar.tsx             # Responsive header navigation
│   │   ├── Footer.tsx             # Standard footer
│   │   ├── PublicPages.tsx        # Dynamic static CMS pages (About, FAQ, Contact...)
│   │   ├── EarnerDashboard.tsx    # Comprehensive tasks & referral panel
│   │   ├── AdvertiserDashboard.tsx# Campaign publisher and auditing workspace
│   │   └── AdminDashboard.tsx     # Platform-wide management dashboard
│   ├── App.tsx                    # Core routing and central state manager
│   ├── types.ts                   # Core data interfaces and strict TS types
│   ├── index.css                  # Tailwinds & Custom fonts configuration
│   └── main.tsx                   # Front-end entry point
├── server.ts                      # Full-stack Node API backend with persistence
├── db.json                        # Auto-generated database file (Initial seeds loaded)
├── database.sql                   # Raw MySQL database schema file for production
└── package.json                   # Dependencies & Build systems
```

---

## 💻 Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Developer Mode Server
```bash
npm run dev
```
The client applet binds automatically to `http://localhost:3000`.

---

## 🌐 Deploying to Production Hosting

To take TasksEarn live on a production cPanel, VPS, or cloud container:

### Step 1: Set Up MySQL Database
1.  Log in to your hosting panel and create a new MySQL database called `tasksearn_db`.
2.  Import the provided `database.sql` file via phpMyAdmin or raw command line.
3.  Add a database user with full privileges.

### Step 2: Build the Frontend
Run the production build script locally to compile the React code:
```bash
npm run build
```
This produces optimized static files in the `/dist` directory. Upload all files from `/dist` directly to your public HTML root folder.

### Step 3: Run Node.js App or Proxy Backend
*   **Option A: VPS/Docker Container**: Deploy the Express server using PM2 or Docker. Specify production environment variables (`NODE_ENV=production`) inside a `.env` file at root.
*   **Option B: PHP API Bridge**: If using standard shared hosting without Node runtime, migrate `/server.ts` endpoints to a simple PHP API controller connecting directly to your MySQL database.

---

## 👤 Test Credentials (Demo Mode)

The system database is pre-seeded with the following accounts:

*   **Super Admin Desk**:
    *   Email: `admin@tasksearn.com`
    *   Password: `admin123`
*   **Sample Earner**:
    *   Email: `earner@tasksearn.com`
    *   Password: `password123`
*   **Sample Advertiser**:
    *   Email: `advertiser@tasksearn.com`
    *   Password: `password123`
