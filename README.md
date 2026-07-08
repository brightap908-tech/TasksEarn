# TasksEarn - Premium Microtask Platform

TasksEarn is a highly polished, production-ready full-stack microtask application inspired by the workflow of FamsUp Tasks. Built using a modern, reactive stack, it is optimized for high performance, ease of deployment, and mobile-first responsive interactions.

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

## 🌐 Live Deployments

TasksEarn is engineered to deploy seamlessly on both **GitHub Pages** (client-side static mockup) and **Render** (production-ready full-stack application).

### 🚀 Option A: Deploying on Render (Full-Stack Live Database)

Render host is the recommended approach to run the live Node.js / Express backend alongside the React frontend with full database persistence (`db.json`).

1. **Push your code to GitHub**: Create a repository and push all files.
2. **Create a Web Service on Render**:
   - Connect your GitHub repository to Render.
   - **Environment**: Select `Node`.
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. **Environment Variables**:
   - Add `NODE_ENV` = `production`
   - Render automatically handles the `PORT` variable. The server will bind to it dynamically.
4. **Deploy**: Render will build the frontend assets, bundle the Express server into `dist/server.cjs`, and launch your live application at `https://your-app.onrender.com`.

---

### 🎨 Option B: Deploying on GitHub Pages (Static Client-Side Simulation)

The codebase contains a pre-configured automated GitHub Actions workflow (`.github/workflows/deploy.yml`) that deploys the application automatically to GitHub Pages every time you push to the `main` or `master` branch.

1. **Push your code to GitHub**: When pushed, the action triggers automatically.
2. **Vite Base Path handling**: The workflow automatically injects `VITE_BASE_PATH=/TasksEarn/` during compilation to ensure assets load correctly under your repository subfolder, preventing blank-page issues.
3. **Client-Side Simulation DB**: On GitHub Pages, the application automatically detects the static environment and boots up `mockDb.ts` (using `localStorage` for database operations). Users can register, log in, create tasks, and manage dashboards as if a real server was connected.

---

## 👤 Test Credentials (Demo Mode)

The system database is pre-seeded with the following accounts for instant testing:

*   **Super Admin Desk**:
    *   Email: `admin@tasksearn.com`
    *   Password: `password123`
*   **Sample Earner**:
    *   Email: `earner@tasksearn.com`
    *   Password: `password123`
*   **Sample Advertiser**:
    *   Email: `advertiser@tasksearn.com`
    *   Password: `password123`
