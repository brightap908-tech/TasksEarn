import express from "express";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();
import pg from "pg";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import webpush from "web-push";
import {
  UserRole,
  TaskStatus,
  SubmissionStatus,
  TransactionType,
  TransactionStatus,
  TaskCategory,
  AdminNotification,
  Platform,
  TaskPricing,
  getPlatformForCategory
} from "./src/types.js";

const { Pool } = pg;

const PORT = Number(process.env.PORT) || 5000;

// ─── Web Push / VAPID ─────────────────────────────────────────────────────────
// Keys are NOT stored in environment variables or config files.
// On first boot, the server generates a fresh VAPID keypair and persists
// both keys in the `vapid_keys` database table. Subsequent boots reload
// from the database, so the private key never appears in source or config.
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@tasksearn.com";
let vapidPublicKey = "";   // populated by ensureVapidKeys() at startup
let vapidPrivateKey = "";  // populated by ensureVapidKeys() at startup

// Prefer the externally-hosted Neon database when configured; falls back to
// the platform-provisioned DATABASE_URL only if NEON_DATABASE_URL is absent.
const DB_CONNECTION_STRING = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!DB_CONNECTION_STRING) {
  console.error("FATAL: No database connection string configured. Set NEON_DATABASE_URL (or DATABASE_URL).");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DB_CONNECTION_STRING,
  ssl: DB_CONNECTION_STRING.includes("localhost") || DB_CONNECTION_STRING.includes("127.0.0.1")
    ? false
    : { rejectUnauthorized: false }
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function mapUser(row: any) {
  if (!row) return null;
  const role = row.role;
  // Activation fees have been removed for everyone — Earners register and activate 100% free.
  const isActivated = true;
  let notificationPrefs = row.notification_prefs;
  if (typeof notificationPrefs === "string") {
    try { notificationPrefs = JSON.parse(notificationPrefs); } catch (e) {}
  }
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role,
    isVerified: row.is_verified === true || row.is_verified === "true",
    isActivated,
    walletBalance: parseFloat(row.wallet_balance) || 0,
    adBalance: parseFloat(row.ad_balance) || 0,
    referralCode: row.referral_code || undefined,
    referredBy: row.referred_by || undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    verificationCode: row.verification_code || undefined,
    verificationCodeExpires: row.verification_code_expires
      ? (row.verification_code_expires instanceof Date
          ? row.verification_code_expires.toISOString()
          : row.verification_code_expires)
      : undefined,
    verificationCodeLastSent: row.verification_code_last_sent
      ? (row.verification_code_last_sent instanceof Date
          ? row.verification_code_last_sent.toISOString()
          : row.verification_code_last_sent)
      : undefined,
    // Extended profile fields
    username: row.username || undefined,
    phone: row.phone || undefined,
    country: row.country || undefined,
    businessName: row.business_name || undefined,
    photoUrl: row.photo_url || undefined,
    twoFactorEnabled: row.two_factor_enabled === true || row.two_factor_enabled === "true" || false,
    isBanned: row.is_banned === true || row.is_banned === "true",
    notificationPrefs: notificationPrefs || {
      emailNotifications: true,
      campaignUpdates: true,
      transactionAlerts: true
    },
  };
}

function mapTask(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    proofRequirements: row.proof_requirements,
    link: row.link,
    costPerSlot: parseFloat(row.cost_per_slot) || 0,
    earningPerSlot: parseFloat(row.earning_per_slot) || 0,
    totalSlots: parseInt(row.total_slots) || 0,
    filledSlots: parseInt(row.filled_slots) || 0,
    status: row.status,
    advertiserId: row.advertiser_id,
    advertiserName: row.advertiser_name,
    isAdminTask: row.is_admin_task === true || row.is_admin_task === "true",
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}

function mapSubmission(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    taskId: row.task_id,
    taskTitle: row.task_title,
    category: row.category,
    earnerId: row.earner_id,
    earnerName: row.earner_name,
    proofText: row.proof_text,
    proofScreenshot: row.proof_screenshot,
    status: row.status,
    feedback: row.feedback || undefined,
    reward: parseFloat(row.reward) || 0,
    submittedAt: row.submitted_at instanceof Date ? row.submitted_at.toISOString() : row.submitted_at,
    approvedAt: row.approved_at ? (row.approved_at instanceof Date ? row.approved_at.toISOString() : row.approved_at) : undefined,
    rejectedAt: row.rejected_at ? (row.rejected_at instanceof Date ? row.rejected_at.toISOString() : row.rejected_at) : undefined,
  };
}

function mapTransaction(row: any) {
  if (!row) return null;
  let bankDetails = row.bank_details;
  if (typeof bankDetails === "string") {
    try { bankDetails = JSON.parse(bankDetails); } catch (e) {}
  }
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userRole: row.user_role,
    amount: parseFloat(row.amount) || 0,
    type: row.type,
    status: row.status,
    description: row.description,
    reference: row.reference,
    gateway: row.gateway || undefined,
    bankDetails: bankDetails || undefined,
    paystackTransferRef: row.paystack_transfer_ref || undefined,
    rejectionReason: row.rejection_reason || undefined,
    withdrawalFee: row.withdrawal_fee != null ? parseFloat(row.withdrawal_fee) : undefined,
    completedAt: row.completed_at ? (row.completed_at instanceof Date ? row.completed_at.toISOString() : row.completed_at) : undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}

function mapSettings(row: any) {
  if (!row) return null;
  return {
    platformName: row.platform_name,
    // Note: earner referral commission is hardcoded to ₦0 platform-wide (see /api/auth/register
    // and /api/earner/referrals); this field is kept only as a legacy/admin-configurable value
    // that no longer affects earner payouts.
    referralReward: parseFloat(row.referral_reward) || 0,
    withdrawalFee: parseFloat(row.withdrawal_fee) || 50,
    minWithdrawal: parseFloat(row.min_withdrawal) || 200,
    minDeposit: parseFloat(row.min_deposit) || 100,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    telegramChannel: row.telegram_channel || undefined,
    whatsappGroup: row.whatsapp_group || undefined,
    depositStatOffset: parseFloat(row.deposit_stat_offset) || 0,
  };
}

function mapPricing(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    platform: row.platform,
    costPerSlot: parseFloat(row.cost_per_slot) || 0,
    earningPerSlot: parseFloat(row.earning_per_slot) || 0
  };
}

function mapSocialPlatform(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || "",
    logoUrl: row.logo_url || undefined,
    description: row.description || undefined,
    status: row.status,
    sortOrder: parseInt(row.sort_order) || 0,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}

function mapOwnerBankAccount(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    accountName: row.account_name,
    isDefault: row.is_default === true || row.is_default === "true"
  };
}

function mapOwnerWithdrawal(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    amount: parseFloat(row.amount) || 0,
    bankAccountId: row.bank_account_id,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    accountName: row.account_name,
    reference: row.reference,
    status: row.status,
    submittedAt: row.submitted_at instanceof Date ? row.submitted_at.toISOString() : row.submitted_at
  };
}

function mapNotification(row: any): AdminNotification {
  return {
    id: row.id,
    type: row.type,
    message: row.message,
    referenceId: row.reference_id,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    read: row.read === true || row.read === "true"
  };
}

function mapEarnerNotification(row: any) {
  return {
    id: row.id,
    taskId: row.task_id,
    taskTitle: row.task_title,
    platform: row.platform,
    category: row.category,
    reward: parseFloat(row.reward) || 0,
    message: row.message,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    read: row.read === true || row.read === "true"
  };
}

// ─── Admin Commission Helper ─────────────────────────────────────────────────

async function creditAdminCommission(opts: {
  type: "activation_fee" | "task_commission" | "withdrawal_fee" | "deposit_fee";
  amount: number;
  description: string;
  reference: string;
  userId?: string;
  userName?: string;
  relatedRef?: string;
}, client?: any) {
  if (!opts.amount || opts.amount <= 0) return;
  const id = "com-" + Math.random().toString(36).substr(2, 9);
  const db = client || pool;
  try {
    await db.query(
      `INSERT INTO admin_commissions (id, type, amount, description, reference, user_id, user_name, related_transaction_ref, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (reference) DO NOTHING`,
      [id, opts.type, opts.amount, opts.description, opts.reference,
       opts.userId || null, opts.userName || null, opts.relatedRef || null, new Date()]
    );
  } catch (err) {
    console.error("[Commission] Failed to credit admin commission:", err);
  }
}

// Deletes the proof screenshot/image for a submission after it has been approved.
// This only clears the (potentially large) image data to save storage space; all
// other submission fields (earner, advertiser, task, dates, payment records, etc.)
// are left intact for audit purposes. Must only be called after the approval
// transaction has already committed successfully. Any failure here is logged and
// swallowed so it never affects the approval response already sent to the client.
async function cleanupApprovedSubmissionProof(submissionId: string) {
  try {
    await pool.query(
      "UPDATE submissions SET proof_screenshot = NULL WHERE id = $1 AND status = $2 AND proof_screenshot IS NOT NULL",
      [submissionId, SubmissionStatus.APPROVED]
    );
  } catch (err) {
    console.error(`[ProofCleanup] Failed to delete proof screenshot for submission ${submissionId}:`, err);
  }
}

// Delete the proof screenshot after a rejection has been committed so we don't
// retain unnecessary storage on submissions that will never be approved.
async function cleanupRejectedSubmissionProof(submissionId: string) {
  try {
    await pool.query(
      "UPDATE submissions SET proof_screenshot = NULL WHERE id = $1 AND status = $2 AND proof_screenshot IS NOT NULL",
      [submissionId, SubmissionStatus.REJECTED]
    );
  } catch (err) {
    console.error(`[ProofCleanup] Failed to delete proof screenshot for rejected submission ${submissionId}:`, err);
  }
}

// Nulls out proof_screenshot for every submission belonging to a task.
// Called whenever a task is permanently deleted so no orphaned image data
// lingers in the DB. Runs outside the delete transaction so a failure here
// never blocks the deletion; it is logged and swallowed.
async function cleanupTaskSubmissionProofs(taskId: string) {
  try {
    const result = await pool.query(
      "UPDATE submissions SET proof_screenshot = NULL WHERE task_id = $1 AND proof_screenshot IS NOT NULL",
      [taskId]
    );
    if ((result.rowCount ?? 0) > 0) {
      console.log(`[ProofCleanup] Cleared ${result.rowCount} screenshot(s) for task ${taskId}`);
    }
  } catch (err) {
    console.error(`[ProofCleanup] Failed to clear screenshots for task ${taskId}:`, err);
  }
}

// Startup sweep — nulls any proof_screenshot still set on Approved or Rejected
// submissions. Catches rows that slipped through a prior cleanup gap and ensures
// the DB is fully consistent on every boot. Safe to run multiple times.
async function sweepOrphanedProofScreenshots() {
  try {
    const result = await pool.query(
      "UPDATE submissions SET proof_screenshot = NULL WHERE proof_screenshot IS NOT NULL AND status IN ($1, $2)",
      [SubmissionStatus.APPROVED, SubmissionStatus.REJECTED]
    );
    if ((result.rowCount ?? 0) > 0) {
      console.log(`[ProofCleanup] Startup sweep: cleared ${result.rowCount} orphaned screenshot(s).`);
    }
  } catch (err) {
    console.error("[ProofCleanup] Startup sweep failed:", err);
  }
}

async function getSettings(): Promise<ReturnType<typeof mapSettings>> {
  const res = await pool.query("SELECT * FROM settings ORDER BY id ASC LIMIT 1");
  return res.rows.length > 0 ? mapSettings(res.rows[0]) : {
    platformName: "TasksEarn",
    referralReward: 200,
    withdrawalFee: 50,
    minWithdrawal: 200,
    minDeposit: 100,
    contactEmail: "support@tasksearn.com",
    contactPhone: "09164444315",
    telegramChannel: "https://t.me/tasksearn_ng",
    whatsappGroup: "https://wa.me/2349164444315",
    depositStatOffset: 0,
  };
}

async function getAuthenticatedUser(req: express.Request): Promise<any | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const userId = authHeader.split(" ")[1];
  if (!userId) return null;
  const res = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
  if (res.rows.length === 0) return null;
  const user = mapUser(res.rows[0]);
  // Banned users are treated as unauthenticated — all API calls fail immediately,
  // effectively invalidating their session without needing a session store.
  if (user.isBanned) return null;
  return user;
}

// ─── Schema Bootstrap ───────────────────────────────────────────────────────

async function bootstrapTables() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Earner',
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        wallet_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        referral_code VARCHAR(50) NULL,
        referred_by VARCHAR(50) NULL,
        verification_code VARCHAR(10) NULL,
        verification_code_expires TIMESTAMP NULL,
        verification_code_last_sent TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Tasks
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        proof_requirements TEXT NOT NULL,
        link VARCHAR(255) NOT NULL,
        cost_per_slot DECIMAL(10, 2) NOT NULL,
        earning_per_slot DECIMAL(10, 2) NOT NULL,
        total_slots INT NOT NULL,
        filled_slots INT NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'Active',
        advertiser_id VARCHAR(50) NOT NULL,
        advertiser_name VARCHAR(150) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Submissions
    await client.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id VARCHAR(50) PRIMARY KEY,
        task_id VARCHAR(50) NOT NULL,
        task_title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        earner_id VARCHAR(50) NOT NULL,
        earner_name VARCHAR(150) NOT NULL,
        proof_text TEXT NOT NULL,
        proof_screenshot TEXT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        feedback TEXT NULL,
        reward DECIMAL(10, 2) NOT NULL,
        approved_at TIMESTAMP NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Transactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        user_name VARCHAR(150) NOT NULL,
        user_role VARCHAR(50) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        description VARCHAR(500) NOT NULL,
        reference VARCHAR(100) NOT NULL UNIQUE,
        gateway VARCHAR(50) NULL,
        bank_details JSONB NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Referrals
    await client.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id VARCHAR(50) PRIMARY KEY,
        referrer_id VARCHAR(50) NOT NULL,
        referee_id VARCHAR(50) NOT NULL,
        referee_name VARCHAR(150) NOT NULL,
        referee_email VARCHAR(150) NOT NULL,
        reward_earned DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Announcements
    await client.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'info',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Banners
    await client.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        link VARCHAR(255) NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);

    // 8. Pages
    await client.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL
      )
    `);

    // 9. Settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        platform_name VARCHAR(100) NOT NULL DEFAULT 'TasksEarn',
        referral_reward DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        withdrawal_fee DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
        min_withdrawal DECIMAL(10, 2) NOT NULL DEFAULT 200.00,
        min_deposit DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
        contact_email VARCHAR(150) NOT NULL DEFAULT 'support@tasksearn.com',
        contact_phone VARCHAR(50) NOT NULL DEFAULT '09164444315',
        telegram_channel VARCHAR(255) NULL,
        whatsapp_group VARCHAR(255) NULL,
        deposit_stat_offset DECIMAL(12, 2) NOT NULL DEFAULT 0.00
      )
    `);

    // Backfill column for pre-existing databases created before this field existed.
    await client.query(`
      ALTER TABLE settings ADD COLUMN IF NOT EXISTS deposit_stat_offset DECIMAL(12, 2) NOT NULL DEFAULT 0.00
    `);

    // 10. Task Pricing
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_pricing (
        id VARCHAR(50) PRIMARY KEY,
        platform VARCHAR(100) NOT NULL,
        cost_per_slot DECIMAL(10, 2) NOT NULL,
        earning_per_slot DECIMAL(10, 2) NOT NULL
      )
    `);

    // 10b. Social Media Platforms (admin-managed, dynamic)
    await client.query(`
      CREATE TABLE IF NOT EXISTS social_platforms (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        icon VARCHAR(100) NOT NULL DEFAULT '',
        logo_url TEXT NULL,
        description TEXT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Active',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 11. Owner Bank Accounts
    await client.query(`
      CREATE TABLE IF NOT EXISTS owner_bank_accounts (
        id VARCHAR(50) PRIMARY KEY,
        bank_name VARCHAR(150) NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        account_name VARCHAR(150) NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);

    // 12. Owner Withdrawals (denormalized for simplicity)
    await client.query(`
      CREATE TABLE IF NOT EXISTS owner_withdrawals (
        id VARCHAR(50) PRIMARY KEY,
        amount DECIMAL(15, 2) NOT NULL,
        bank_account_id VARCHAR(50) NOT NULL DEFAULT '',
        bank_name VARCHAR(150) NOT NULL DEFAULT '',
        account_number VARCHAR(50) NOT NULL DEFAULT '',
        account_name VARCHAR(150) NOT NULL DEFAULT '',
        reference VARCHAR(100) NOT NULL DEFAULT '',
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 13. Notifications
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        reference_id VARCHAR(50) NOT NULL,
        read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 14b. Earner Notifications (per-earner new-task alerts)
    await client.query(`
      CREATE TABLE IF NOT EXISTS earner_notifications (
        id VARCHAR(50) PRIMARY KEY,
        earner_id VARCHAR(50) NOT NULL,
        task_id VARCHAR(50) NOT NULL,
        task_title VARCHAR(500) NOT NULL,
        platform VARCHAR(100) NOT NULL,
        category VARCHAR(200) NOT NULL,
        reward DECIMAL(10,2) NOT NULL DEFAULT 0,
        message TEXT NOT NULL,
        read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(earner_id, task_id)
      )
    `);

    // 14. Admin Commissions (persistent, never resets)
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_commissions (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        description VARCHAR(500) NOT NULL,
        reference VARCHAR(150) NOT NULL UNIQUE,
        user_id VARCHAR(50) NULL,
        user_name VARCHAR(150) NULL,
        related_transaction_ref VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 15. Migrate: add is_activated column to users if not present.
    // Activation fees have been removed — everyone defaults to activated, and any
    // existing Earners who had not yet paid are backfilled to active below.
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_activated BOOLEAN NOT NULL DEFAULT TRUE
    `);
    // ADD COLUMN IF NOT EXISTS is a no-op when the column already exists (e.g. from a prior
    // deploy), so explicitly flip the column default and backfill any unpaid accounts too.
    await client.query(`ALTER TABLE users ALTER COLUMN is_activated SET DEFAULT TRUE`);
    await client.query(`UPDATE users SET is_activated = true WHERE is_activated = false`);

    // 16. Migrate: add updated_at to social_platforms if not present
    await client.query(`
      ALTER TABLE social_platforms ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL
    `);

    // 17. Migrate: extended profile columns for users
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) NULL`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30) NULL`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100) NULL`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name VARCHAR(200) NULL`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT NULL`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_prefs JSONB NULL`);

    // 18. Migrate: add is_admin_task flag to tasks table
    await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_admin_task BOOLEAN NOT NULL DEFAULT FALSE`);

    // 19. Migrate: widen proof_screenshot from VARCHAR(1000) to TEXT so that
    //     base64-encoded screenshot data URLs (which can be 100 KB+) are stored
    //     without a "value too long for type character varying(1000)" error.
    //     Casting VARCHAR -> TEXT is always safe in PostgreSQL and is a
    //     near-no-op when the column already is TEXT.
    await client.query(
      "ALTER TABLE submissions ALTER COLUMN proof_screenshot TYPE TEXT"
    );

    // 20. Migrate: admin-controlled login popup fields on announcements.
    //     `enabled` toggles whether the announcement is currently shown; `dismissible`
    //     controls whether users can close it freely (X / click-outside) or must click
    //     the "OK, Got it" button to continue.
    await client.query(`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE`);
    await client.query(`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS dismissible BOOLEAN NOT NULL DEFAULT TRUE`);
    await client.query(`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL`);
    // 21. Migrate: optional clickable link/button on login popup announcements.
    await client.query(`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link_url TEXT NULL`);
    await client.query(`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS button_text TEXT NULL`);

    // 25. Submission History — full audit trail of every rejection and resubmission.
    //     One row per lifecycle event (submitted / rejected / resubmitted / approved).
    //     The submissions table only holds the *current* state; this table holds history.
    await client.query(`
      CREATE TABLE IF NOT EXISTS submission_history (
        id           VARCHAR(50) PRIMARY KEY,
        submission_id VARCHAR(50) NOT NULL,
        task_id      VARCHAR(50) NOT NULL,
        task_title   VARCHAR(255) NOT NULL,
        earner_id    VARCHAR(50) NOT NULL,
        earner_name  VARCHAR(150) NOT NULL,
        event_type   VARCHAR(50) NOT NULL,
        feedback     TEXT NULL,
        reviewed_by  VARCHAR(150) NULL,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 26. Migrate: add rejected_at timestamp to submissions for date-rejected tracking.
    await client.query(`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP NULL`);

    // 22a. VAPID keypair — auto-generated on first boot, never stored in config files.
    //      Only the server (via its DB connection) can read the private key.
    await client.query(`
      CREATE TABLE IF NOT EXISTS vapid_keys (
        key        VARCHAR(20) PRIMARY KEY,
        value      TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // 22b. Browser Push Notification Subscriptions (Web Push / VAPID)
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_subscriptions (
        id           VARCHAR(50) PRIMARY KEY,
        user_id      VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint     TEXT NOT NULL,
        p256dh_key   TEXT NOT NULL,
        auth_key     TEXT NOT NULL,
        active       BOOLEAN NOT NULL DEFAULT TRUE,
        created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, endpoint)
      )
    `);

    // 22. Earner-specific task hide list — tasks dismissed by individual earners.
    //     Deleting a task from this table does NOT affect the task itself or other earners.
    await client.query(`
      CREATE TABLE IF NOT EXISTS hidden_tasks (
        id          TEXT PRIMARY KEY,
        earner_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task_id     TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        hidden_at   TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(earner_id, task_id)
      )
    `);

    // 23. Migrate: update settings to new minimums (₦50 fee, ₦200 min withdrawal, ₦100 min deposit).
    //     Runs on every boot; the WHERE guard makes it a no-op if already updated.
    await client.query(`
      UPDATE settings
      SET withdrawal_fee = 50, min_withdrawal = 200, min_deposit = 100
      WHERE withdrawal_fee IN (100, 200) OR min_withdrawal IN (250, 2000) OR min_deposit IN (200, 500, 1000)
    `);

    // 27. Migrate: lower minimum deposit to ₦100 (previously ₦1000).
    //     Belt-and-suspenders: run unconditionally if any row still has 1000.
    await client.query(`
      UPDATE settings SET min_deposit = 100 WHERE min_deposit = 1000
    `);

    // 24. Update task_pricing to the official advertiser price list.
    //     Each UPDATE is guarded on the OLD default values so any admin-edited
    //     rows are left untouched. Idempotent on every restart.
    const _pricingV2 = [
      { platform: "Instagram",   cost: 20, earn: 13, oldCost: 15, oldEarn: 10 },
      { platform: "Facebook",    cost: 20, earn: 13, oldCost: 15, oldEarn: 10 },
      { platform: "TikTok",      cost: 25, earn: 17, oldCost: 15, oldEarn: 10 },
      { platform: "YouTube",     cost: 30, earn: 20, oldCost: 25, oldEarn: 18 },
      { platform: "X (Twitter)", cost: 20, earn: 13, oldCost: 15, oldEarn: 10 },
      { platform: "Telegram",    cost: 15, earn: 10, oldCost: 18, oldEarn: 12 },
      { platform: "WhatsApp",    cost: 15, earn: 10, oldCost: 18, oldEarn: 12 },
      { platform: "Snapchat",    cost: 25, earn: 17, oldCost: 15, oldEarn: 10 },
      { platform: "LinkedIn",    cost: 30, earn: 20, oldCost: 20, oldEarn: 14 },
      { platform: "Threads",     cost: 20, earn: 13, oldCost: 15, oldEarn: 10 },
      { platform: "Pinterest",   cost: 20, earn: 13, oldCost: 15, oldEarn: 10 },
      { platform: "Reddit",      cost: 25, earn: 17, oldCost: 18, oldEarn: 12 },
      { platform: "Discord",     cost: 20, earn: 13, oldCost: 20, oldEarn: 14 },
      { platform: "Messenger",   cost: 15, earn: 10, oldCost: 15, oldEarn: 10 },
      { platform: "Kwai",        cost: 20, earn: 13, oldCost: 15, oldEarn: 10 },
      { platform: "Likee",       cost: 20, earn: 13, oldCost: 15, oldEarn: 10 },
    ];
    for (const p of _pricingV2) {
      await client.query(
        `UPDATE task_pricing
         SET cost_per_slot = $1, earning_per_slot = $2
         WHERE LOWER(platform) = LOWER($3)
           AND cost_per_slot = $4 AND earning_per_slot = $5`,
        [p.cost, p.earn, p.platform, p.oldCost, p.oldEarn]
      );
    }

    // 28. Migrate: user ban/suspend support
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE`);

    // 30. Paystack transfer reference and rejection reason on withdrawal transactions
    await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paystack_transfer_ref VARCHAR(150) NULL`);
    await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL`);

    // 31. Store the processing fee per withdrawal so rejection refunds are accurate
    //     even if the fee setting changes after the request was submitted.
    await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS withdrawal_fee DECIMAL(10,2) NULL`);

    // 32. Track when a withdrawal is actually completed (Paystack confirms success).
    await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL`);

    // 33. Track which admin manually marked a withdrawal as Paid.
    await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS marked_by_admin_id VARCHAR(50) NULL`);

    // 34. Unified account migration: ad_balance for advertising wallet
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ad_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00`);
    // Migrate existing advertiser wallet balances to ad_balance (idempotent: only if ad_balance is 0)
    await client.query(`UPDATE users SET ad_balance = wallet_balance, wallet_balance = 0 WHERE role = 'Advertiser' AND ad_balance = 0 AND wallet_balance > 0`);
    // Convert all non-admin users to unified 'User' role
    await client.query(`UPDATE users SET role = 'User' WHERE role IN ('Earner', 'Advertiser')`);
    // Ensure all users have a referral code
    await client.query(`UPDATE users SET referral_code = UPPER(SUBSTRING(name, 1, 4)) || (FLOOR(100 + random() * 900))::text WHERE referral_code IS NULL AND role != 'Admin'`);

    // 29. Admin action audit log — records every ban, unban, and delete action
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_action_logs (
        id VARCHAR(50) PRIMARY KEY,
        admin_id VARCHAR(50) NOT NULL,
        admin_name VARCHAR(150) NOT NULL,
        action VARCHAR(50) NOT NULL,
        target_user_id VARCHAR(50) NOT NULL,
        target_user_name VARCHAR(150) NOT NULL,
        target_user_email VARCHAR(150) NOT NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS broadcast_email_logs (
        id SERIAL PRIMARY KEY,
        admin_id VARCHAR(50) NOT NULL,
        subject TEXT NOT NULL,
        target VARCHAR(50) NOT NULL,
        total_recipients INT NOT NULL DEFAULT 0,
        sent_count INT NOT NULL DEFAULT 0,
        failed_count INT NOT NULL DEFAULT 0,
        retried_count INT NOT NULL DEFAULT 0,
        failed_emails JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`ALTER TABLE broadcast_email_logs ADD COLUMN IF NOT EXISTS retried_count INT NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE broadcast_email_logs ADD COLUMN IF NOT EXISTS html_content TEXT NOT NULL DEFAULT ''`);
    await client.query(`ALTER TABLE broadcast_email_logs ADD COLUMN IF NOT EXISTS sent_emails JSONB NOT NULL DEFAULT '[]'`);
    await client.query(`ALTER TABLE broadcast_email_logs ADD COLUMN IF NOT EXISTS viewed BOOLEAN NOT NULL DEFAULT FALSE`);
    await client.query(`ALTER TABLE broadcast_email_logs ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Completed'`);

    await client.query("COMMIT");
    console.log("[DB] Tables bootstrapped successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[DB] Error bootstrapping tables:", err);
    throw err;
  } finally {
    client.release();
  }
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

function getInitialPricing(): TaskPricing[] {
  const platforms = Object.values(Platform);
  const defaults: Record<Platform, { cost: number; earn: number }> = {
    [Platform.INSTAGRAM]: { cost: 20, earn: 13 },
    [Platform.FACEBOOK]: { cost: 20, earn: 13 },
    [Platform.TIKTOK]: { cost: 25, earn: 17 },
    [Platform.YOUTUBE]: { cost: 30, earn: 20 },
    [Platform.X_TWITTER]: { cost: 20, earn: 13 },
    [Platform.TELEGRAM]: { cost: 15, earn: 10 },
    [Platform.WHATSAPP]: { cost: 15, earn: 10 },
    [Platform.SNAPCHAT]: { cost: 25, earn: 17 },
    [Platform.LINKEDIN]: { cost: 30, earn: 20 },
    [Platform.THREADS]: { cost: 20, earn: 13 },
    [Platform.PINTEREST]: { cost: 20, earn: 13 },
    [Platform.REDDIT]: { cost: 25, earn: 17 },
    [Platform.DISCORD]: { cost: 20, earn: 13 },
    [Platform.MESSENGER]: { cost: 15, earn: 10 },
    [Platform.KWAI]: { cost: 20, earn: 13 },
    [Platform.LIKEE]: { cost: 20, earn: 13 },
    [Platform.CUSTOM]: { cost: 30, earn: 20 }
  };
  return platforms.map((plat, idx) => ({
    id: `prc-${idx + 1}`,
    platform: plat,
    costPerSlot: defaults[plat]?.cost || 15,
    earningPerSlot: defaults[plat]?.earn || 10
  }));
}

function slugifyPlatformId(name: string): string {
  return "plat-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function ensurePricingRowForPlatform(platformName: string) {
  const existing = await pool.query("SELECT id FROM task_pricing WHERE platform = $1 LIMIT 1", [platformName]);
  if (existing.rows.length === 0) {
    const idRes = await pool.query("SELECT COUNT(*) FROM task_pricing");
    const newId = `prc-${parseInt(idRes.rows[0].count) + 1}-${Date.now()}`;
    await pool.query(
      "INSERT INTO task_pricing (id, platform, cost_per_slot, earning_per_slot) VALUES ($1, $2, $3, $4)",
      [newId, platformName, 0, 0]
    );
  }
}

// Migrates the legacy hard-coded Platform enum values into the dynamic
// social_platforms table automatically, once, the first time the app boots
// with an empty table. After this, all platform management is DB-driven.
async function ensurePlatformsSeeded() {
  const countRes = await pool.query("SELECT COUNT(*) FROM social_platforms");
  if (parseInt(countRes.rows[0].count) > 0) return;

  const legacyPlatforms = Object.values(Platform);
  let order = 0;
  for (const name of legacyPlatforms) {
    order += 1;
    await pool.query(
      `INSERT INTO social_platforms (id, name, icon, description, status, sort_order)
       VALUES ($1, $2, $3, $4, 'Active', $5)
       ON CONFLICT (name) DO NOTHING`,
      [slugifyPlatformId(name), name, name, "Migrated automatically from default platform list.", order]
    );
    await ensurePricingRowForPlatform(name);
  }
  console.log(`[DB] Migrated ${legacyPlatforms.length} default social media platforms into social_platforms table.`);
}

async function seedDatabase() {
  const usersCount = await pool.query("SELECT COUNT(*) FROM users");
  if (parseInt(usersCount.rows[0].count) > 0) {
    console.log("[DB] Database already seeded, skipping.");
    return;
  }

  console.log("[DB] Seeding initial data...");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const adminId = "u-admin-1";
    const earnerId = "u-earner-1";
    const advertiserId = "u-advertiser-1";
    const now = new Date();
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 3600 * 1000);
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 3600 * 1000);

    // Users
    await client.query(`
      INSERT INTO users (id, name, email, password, role, is_verified, is_activated, wallet_balance, referral_code, created_at)
      VALUES
        ($1, 'Super Admin', 'admin@tasksearn.com', $2, 'Admin', true, true, 0, NULL, $3),
        ($4, 'Tunde Bakare', 'earner@tasksearn.com', $5, 'Earner', true, true, 2500, 'TUNDE887', $6),
        ($7, 'Chinedu Okafor', 'advertiser@tasksearn.com', $8, 'Advertiser', true, true, 35000, NULL, $9)
    `, [
      adminId, hashPassword("password123"), now,
      earnerId, hashPassword("password123"), tenDaysAgo,
      advertiserId, hashPassword("password123"), fifteenDaysAgo
    ]);

    // Tasks
    await client.query(`
      INSERT INTO tasks (id, title, description, category, proof_requirements, link, cost_per_slot, earning_per_slot, total_slots, filled_slots, status, advertiser_id, advertiser_name, created_at)
      VALUES
        ('task-1', 'YouTube Subscribe - TechNaija Channel',
          'Go to the YouTube channel link, click Subscribe, and upload a screenshot proving you subscribed. No unsubscribing later, we audit accounts daily.',
          'YouTube Subscribe', 'Your YouTube account username and a screenshot showing the Subscribe button clicked.',
          'https://youtube.com/c/technaija', 20, 15, 200, 87, 'Active', $1, 'Chinedu Okafor', $2),
        ('task-2', 'Instagram Follow @gossipmill_ng',
          'Follow GossipMill Nigeria on Instagram, like the latest 3 posts, and submit a screenshot showing the Followed status.',
          'Instagram Follow', 'Your Instagram profile handle (@username) and follow screenshot.',
          'https://instagram.com/gossipmill_ng', 15, 10, 150, 142, 'Active', $1, 'Chinedu Okafor', $3),
        ('task-3', 'Telegram Group Join - Crypto Signals NG',
          'Join our active Telegram channel and group. Do not leave, users who leave will be permanently banned.',
          'Telegram Join', 'Telegram username (e.g. @username) and screenshot showing you joined.',
          'https://t.me/cryptosignalsng', 18, 12, 100, 98, 'Active', $1, 'Chinedu Okafor', $4),
        ('task-4', 'Facebook Follow - TasksEarn Platform',
          'Follow our official Facebook page to stay updated on high-paying campaigns.',
          'Facebook Follow', 'Your Facebook profile link or name, and follow screenshot.',
          'https://facebook.com/tasksearn', 15, 10, 500, 500, 'Completed', 'u-admin-1', 'Super Admin', $5)
    `, [
      advertiserId,
      new Date(Date.now() - 3 * 24 * 3600 * 1000),
      new Date(Date.now() - 4 * 24 * 3600 * 1000),
      new Date(Date.now() - 2 * 24 * 3600 * 1000),
      new Date(Date.now() - 8 * 24 * 3600 * 1000)
    ]);

    // Submissions
    await client.query(`
      INSERT INTO submissions (id, task_id, task_title, category, earner_id, earner_name, proof_text, proof_screenshot, status, reward, submitted_at)
      VALUES
        ('sub-1', 'task-1', 'YouTube Subscribe - TechNaija Channel', 'YouTube Subscribe', $1, 'Tunde Bakare',
          'My YouTube username: @tunde_tech_99',
          'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
          'Approved', 15, $2),
        ('sub-2', 'task-2', 'Instagram Follow @gossipmill_ng', 'Instagram Follow', $1, 'Tunde Bakare',
          'Username: @tunde_bakare_official',
          'https://images.unsplash.com/photo-1611224885990-ab7363d1f2a9?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
          'Pending', 10, $3)
    `, [
      earnerId,
      new Date(Date.now() - 2 * 24 * 3600 * 1000),
      new Date(Date.now() - 3 * 3600 * 1000)
    ]);

    // Transactions
    await client.query(`
      INSERT INTO transactions (id, user_id, user_name, user_role, amount, type, status, description, reference, gateway, bank_details, created_at)
      VALUES
        ('tx-1', $1, 'Chinedu Okafor', 'Advertiser', 50000, 'Deposit', 'Success',
          'Wallet Funding via Paystack Card Payment', 'T-PAYSTACK-5884930294', 'Paystack', NULL, $2),
        ('tx-2', $1, 'Chinedu Okafor', 'Advertiser', 15000, 'Campaign Spend', 'Success',
          'Created Campaign: YouTube Subscribe - TechNaija Channel', 'T-SPEND-992384910', NULL, NULL, $3),
        ('tx-3', $4, 'Tunde Bakare', 'Earner', 2500, 'Withdrawal', 'Pending',
          'Withdrawal request to Guaranty Trust Bank (GTB)', 'W-GTB-48203949', NULL,
          '{"bankName":"Guaranty Trust Bank (GTB)","accountNumber":"0123456789","accountName":"Tunde Bakare"}', $5)
    `, [
      advertiserId, fifteenDaysAgo,
      new Date(Date.now() - 3 * 24 * 3600 * 1000),
      earnerId,
      new Date(Date.now() - 1 * 24 * 3600 * 1000)
    ]);

    // Commission record for sub-1 (pre-approved seed submission).
    // sub-1 was approved directly via seed SQL, so it never went through the review API.
    // We insert the commission row here so the platform earnings dashboard starts with the
    // correct opening balance (task-1 cost_per_slot ₦20 − reward ₦15 = ₦5 commission).
    await client.query(`
      INSERT INTO admin_commissions (id, type, amount, description, reference, user_id, user_name, related_transaction_ref, created_at)
      VALUES ('com-seed-sub-1', 'task_commission', 5.00,
              'Task commission: "YouTube Subscribe - TechNaija Channel" — Tunde Bakare',
              'COMM-SEED-sub-1', $1, 'Tunde Bakare', 'sub-1', $2)
      ON CONFLICT (reference) DO NOTHING
    `, [earnerId, new Date(Date.now() - 2 * 24 * 3600 * 1000)]);

    // Referrals (seed demo data — reward is 0 since the earner referral commission is disabled)
    await client.query(`
      INSERT INTO referrals (id, referrer_id, referee_id, referee_name, referee_email, reward_earned, created_at)
      VALUES ('ref-1', $1, 'u-referee-1', 'Sola Alabi', 'sola@example.com', 0, $2)
    `, [earnerId, new Date(Date.now() - 5 * 24 * 3600 * 1000)]);

    // Announcements
    await client.query(`
      INSERT INTO announcements (id, title, content, type, created_at)
      VALUES
        ('ann-1', 'Welcome to TasksEarn Platform',
          'Welcome Nigerians to the most trusted social media microtask exchange platform! Advertisers can publish tasks, and Earners can complete simple tasks and earn directly in Naira (₦) paid to their local bank accounts.',
          'success', $1),
        ('ann-2', 'Withdrawal Process Audits',
          'Withdrawal requests are processed every Friday at 12:00 PM. Please ensure your submitted bank details are accurate and your name matches your verification profile to avoid rejections.',
          'info', $2)
    `, [
      new Date(Date.now() - 10 * 24 * 3600 * 1000),
      new Date(Date.now() - 2 * 24 * 3600 * 1000)
    ]);

    // Banners
    await client.query(`
      INSERT INTO banners (id, title, image_url, link, active) VALUES
        ('ban-1', 'Boost Your Social Media Reach Instantly',
          'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&auto=format&fit=crop&q=80',
          '/advertiser/dashboard', true),
        ('ban-2', 'Earn Up to ₦5,000 Daily From Home',
          'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&auto=format&fit=crop&q=80',
          '/dashboard', true)
    `);

    // Pages
    await client.query(`
      INSERT INTO pages (id, title, content) VALUES
        ('about', 'About TasksEarn', $1),
        ('contact', 'Contact Us', $2),
        ('faq', 'Frequently Asked Questions', $3),
        ('terms', 'Terms of Service', $4),
        ('privacy', 'Privacy Policy', $5)
    `, [
      `TasksEarn is Nigeria's premier microtask marketplace designed to bridge the gap between digital content advertisers and micro-job earners. Built to support digital marketers, small business owners, and online earners across Nigeria, we enable seamless social media engagements on platforms like Facebook, Instagram, TikTok, YouTube, WhatsApp, and Telegram.

Our mission is to empower thousands of young Nigerians to monetize their spare social media screen-time, while providing advertisers with cost-effective, organic, and highly targeted growth.

Why Choose TasksEarn?
- Instant Wallet Funding: Easily fund your advertising wallet using local cards, bank transfers, OPay, Moniepoint, and PalmPay.
- Quality Auditing: Our advanced screenshot & link proof engine allows advertisers and administrators to verify proof with ultimate precision before release of payouts.
- Swift Withdrawals: Withdraw your earnings straight into any Nigerian bank, with payouts processed seamlessly.
- Robust Referral Network: Earn generous referral bonuses for every friend you introduce to the platform who completes tasks or creates campaigns.`,
      `Have questions, disputes, or looking to discuss custom high-volume ad packages? Our friendly support team is here to assist you 24/7.

- Email Support: support@tasksearn.com
- Phone Contact: 09164444315
- WhatsApp Support: 09164444315
- Telegram Support: @TasksEarnSupport
- Office Address: 12, Herbert Macaulay Way, Yaba, Lagos State, Nigeria.

Alternatively, you can join our Telegram announcements channel and WhatsApp support chat using the quick links on your dashboard.`,
      `### 1. What is TasksEarn?
TasksEarn is a digital engagement community where advertisers pay everyday social media users (Earners) to perform small online tasks such as liking a Facebook page, subscribing to a YouTube channel, following an Instagram profile, or joining a Telegram community.

### 2. How much can I earn as an Earner?
There is no fixed limit! Your earnings depend on how many tasks you successfully complete. Tasks are rewarded between ₦10 and ₦500 depending on complexity. Active earners can withdraw thousands of Naira weekly.

### 3. What is the minimum withdrawal and deposit?
- Minimum Withdrawal: ₦2,000 (with a standard flat fee of ₦100 per transaction).
- Minimum Deposit for Advertisers: ₦1,000.

### 4. How long does deposit and withdrawal validation take?
- Deposits via Paystack card payment are credited instantly. Bank transfer deposits are confirmed by our system inside 1 hour.
- Withdrawals are processed on our payout cycles every week, usually within 24 to 48 hours of approval.

### 5. Why was my task submission rejected?
A submission is rejected if you did not follow the instructions, if you did not complete the social media action, or if you submitted fake/unrelated screenshots. Submitting fraudulent proofs repeatedly will lead to permanent account suspension.`,
      `Welcome to TasksEarn ("the Platform"). By registering an account and using our services, you agree to comply with and be bound by the following Terms and Conditions:

1. Account Eligibility & Authenticity
- You must be at least 18 years of age or have parental consent.
- You are strictly prohibited from opening multiple Earner accounts. Users caught using bots, multi-accounts, or automation scripts to complete tasks will have all their accounts permanently terminated and wallets forfeited.

2. Social Media Action Integrity
- Once you complete a task (e.g., following a page or subscribing), you must maintain that follow/subscription for a minimum of 6 months.
- Our automatic auditing crawlers periodically check for drop-offs. If you unsubscribe or unfollow, the system will retract the earnings and apply a penalty fee to your balance.

3. Advertiser Refund Policy
- Advertisers are purchasing real user actions. Once a task slot is completed and approved, payments are final and non-refundable.
- If an advertiser terminates a campaign prematurely, any remaining unallocated funds for uncompleted slots will be instantly returned to their advertiser wallet.

4. Platform Fees
- TasksEarn reserves the right to charge transaction fees on deposits (payment gateway charge) and withdrawals (₦100 flat fee). Fees are clearly stated at checkout.`,
      `Your privacy is incredibly important to us at TasksEarn. This Privacy Policy outlines the types of personal information we collect and how we safeguard it:

1. Information We Collect
- Contact Details: Name, email address, telephone number, and Nigerian bank details (for withdrawal processing).
- Verification Proofs: Text usernames, social media handle names, and screenshots submitted as proof of task completion.
- Network Data: IP addresses and browser details to protect our community against automated bot attacks and multi-account fraud.

2. How We Use Your Data
- To manage your secure login, calculate referral bonuses, process deposits, and credit bank payouts.
- Verification proofs are made visible ONLY to the advertiser of that specific campaign and the platform administrators for auditing purposes. We do not sell or trade your visual data to third parties.

3. Cookies and Browser Cache
- We use temporary cookies and local session identifiers to keep you logged in securely while navigating the app dashboard.`
    ]);

    // Settings
    await client.query(`
      INSERT INTO settings (platform_name, referral_reward, withdrawal_fee, min_withdrawal, min_deposit, contact_email, contact_phone, telegram_channel, whatsapp_group)
      VALUES ('TasksEarn', 0, 50, 200, 100, 'support@tasksearn.com', '09164444315', 'https://t.me/tasksearn_ng', 'https://wa.me/2349164444315')
    `);

    // Task Pricing
    const pricing = getInitialPricing();
    for (const p of pricing) {
      await client.query(
        "INSERT INTO task_pricing (id, platform, cost_per_slot, earning_per_slot) VALUES ($1, $2, $3, $4)",
        [p.id, p.platform, p.costPerSlot, p.earningPerSlot]
      );
    }

    await client.query("COMMIT");
    console.log("[DB] Seed data inserted successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[DB] Error seeding database:", err);
    throw err;
  } finally {
    client.release();
  }
}

// ─── Email Helpers ───────────────────────────────────────────────────────────

let resendClient: Resend | null = null;
function getResendClient(): Resend | null {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

let smtpTransporter: nodemailer.Transporter | null = null;
function getSMTPTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (host && user && pass && !smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  }
  return host && user && pass ? smtpTransporter : null;
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const resend = getResendClient();
  if (resend) {
    const from = process.env.RESEND_FROM || "TasksEarn <onboarding@resend.dev>";
    const response = await resend.emails.send({ from, to: [to], subject, html });
    if (response.error) {
      const resendError = response.error as any;
      const error = new Error(`Resend error: ${resendError.message || "Unknown Resend error"}`);
      (error as any).statusCode = resendError.statusCode ?? resendError.status ?? resendError.code;
      (error as any).provider = "resend";
      throw error;
    }
    return { success: true, provider: "resend" };
  }

  const smtp = getSMTPTransporter();
  if (smtp) {
    const settings = await getSettings();
    const from = process.env.SMTP_FROM || settings?.contactEmail || "TasksEarn <noreply@tasksearn.com>";
    const info = await smtp.sendMail({ from, to, subject, html });
    return { success: true, provider: "smtp", messageId: info.messageId };
  }

  throw new Error("No email provider is configured. Please set RESEND_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASSWORD.");
}

const BROADCAST_BATCH_SIZE = 10;
const BROADCAST_BATCH_DELAY_MS = 2000;
const BROADCAST_MAX_RETRIES = 3;
const BROADCAST_RETRY_DELAYS_MS = [2000, 4000, 8000] as const;

function isResendRateLimitError(error: unknown): boolean {
  const candidate = error as any;
  const statusCode = candidate?.statusCode ?? candidate?.status ?? candidate?.response?.status;
  const message = String(candidate?.message || "").toLowerCase();
  return statusCode === 429
    || statusCode === "429"
    || message.includes("429")
    || message.includes("too many requests")
    || message.includes("rate limit");
}

function wait(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function sendBroadcastRecipientWithRetry({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ email: string; delivered: boolean; retries: number; reason?: string }> {
  let retries = 0;

  while (true) {
    try {
      await sendEmail({ to, subject, html });
      return { email: to, delivered: true, retries };
    } catch (error: any) {
      if (!isResendRateLimitError(error) || retries >= BROADCAST_MAX_RETRIES) {
        return {
          email: to,
          delivered: false,
          retries,
          reason: error?.message || "Unknown error",
        };
      }

      await wait(BROADCAST_RETRY_DELAYS_MS[retries]);
      retries += 1;
    }
  }
}

async function sendVerificationEmail(email: string, name: string, code: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
      <h2 style="color: #10b981; text-align: center;">TasksEarn Nigeria</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Please verify your email using the code below:</p>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 12px; text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #047857; font-family: monospace;">${code}</span>
      </div>
      <p style="color: #ef4444; font-size: 13px; text-align: center;">This code expires in 10 minutes.</p>
    </div>`;
  return sendEmail({ to: email, subject: "Verify your TasksEarn Email Address", html });
}

async function sendPasswordResetEmail(email: string, name: string, tempPassword: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
      <h2 style="color: #10b981; text-align: center;">TasksEarn Nigeria</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your temporary password is:</p>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 12px; text-align: center; margin: 24px 0;">
        <span style="font-size: 28px; font-weight: 800; color: #047857; font-family: monospace;">${tempPassword}</span>
      </div>
      <p style="color: #ef4444; text-align: center;">Do not share this password with anyone.</p>
    </div>`;
  return sendEmail({ to: email, subject: "Your TasksEarn Password Recovery Credentials", html });
}

// ─── Express App ─────────────────────────────────────────────────────────────

const NIGERIAN_BANK_LIST = [
  { name: "Access Bank", code: "044" }, { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" }, { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank (FCMB)", code: "214" }, { name: "Guaranty Trust Bank (GTB)", code: "058" },
  { name: "Keystone Bank", code: "082" }, { name: "Kuda Bank", code: "50211" },
  { name: "Moniepoint Microfinance Bank", code: "50515" }, { name: "OPay Microfinance Bank", code: "999992" },
  { name: "PalmPay Microfinance Bank", code: "999991" }, { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" }, { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Sterling Bank", code: "232" }, { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa (UBA)", code: "033" }, { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" }, { name: "Zenith Bank", code: "057" },
  { name: "Jaiz Bank", code: "301" }, { name: "Parallex Bank", code: "104" },
  { name: "Titan Trust Bank", code: "102" }, { name: "Globus Bank", code: "00103" },
  { name: "PremiumTrust Bank", code: "105" }, { name: "Lotus Bank", code: "303" },
  { name: "Optimus Bank", code: "107" }, { name: "VFD Microfinance Bank", code: "566" }
];

const app = express();

// Paystack webhook MUST receive the raw body so we can verify the HMAC-SHA512 signature.
// Register express.raw() for this route BEFORE the global express.json() middleware so the
// body-parser does not consume the stream first.
app.use("/api/paystack/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ─── Public API ───────────────────────────────────────────────────────────────

app.get("/api/public/pages", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM pages");
    const pages: Record<string, { title: string; content: string }> = {};
    result.rows.forEach(r => { pages[r.id] = { title: r.title, content: r.content }; });
    res.json(pages);
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.get("/api/public/banners", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM banners WHERE active = true");
    res.json(result.rows.map(r => ({
      id: r.id, title: r.title, imageUrl: r.image_url, link: r.link, active: r.active
    })));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.get("/api/public/announcements", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM announcements ORDER BY created_at DESC");
    res.json(result.rows.map(r => ({
      id: r.id, title: r.title, content: r.content, type: r.type,
      enabled: r.enabled, dismissible: r.dismissible,
      linkUrl: r.link_url || null, buttonText: r.button_text || null,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
    })));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// Returns the latest ENABLED announcement to show as a login popup for Earners/Advertisers.
// Admins never see this popup. Returns { announcement: null } when nothing is enabled.
app.get("/api/user/login-popup", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.json({ announcement: null });

    const result = await pool.query(
      "SELECT * FROM announcements WHERE enabled = true ORDER BY created_at DESC LIMIT 1"
    );
    if (result.rows.length === 0) return res.json({ announcement: null });

    const r = result.rows[0];
    res.json({
      announcement: {
        id: r.id, title: r.title, content: r.content, type: r.type,
        dismissible: r.dismissible,
        linkUrl: r.link_url || null, buttonText: r.button_text || null,
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
      }
    });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.get("/api/public/settings", async (_req, res) => {
  try {
    res.json(await getSettings());
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.get("/api/public/stats", async (_req, res) => {
  try {
    const earnersCount = await pool.query("SELECT COUNT(*) FROM users WHERE role != 'Admin'");
    const tasksCount = await pool.query("SELECT COUNT(*) FROM tasks");
    const totalPaidOut = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE type = 'Withdrawal' AND status = 'Success'"
    );
    const latestWithdrawalTx = await pool.query(
      "SELECT * FROM transactions WHERE type = 'Withdrawal' ORDER BY created_at DESC LIMIT 1"
    );
    const latestCampaign = await pool.query(
      "SELECT * FROM tasks WHERE status = 'Active' ORDER BY created_at DESC LIMIT 1"
    );
    const lw = latestWithdrawalTx.rows[0] ? mapTransaction(latestWithdrawalTx.rows[0]) : null;
    const lc = latestCampaign.rows[0] ? mapTask(latestCampaign.rows[0]) : null;

    // Use demo minimum values until real data surpasses them
    const DEMO_MIN_EARNERS   = 12485;
    const DEMO_MIN_TASKS     = 346;
    const DEMO_MIN_PAID_OUT  = 3875560;

    const dbEarners  = parseInt(earnersCount.rows[0].count);
    const dbTasks    = parseInt(tasksCount.rows[0].count);
    const dbPaidOut  = parseFloat(totalPaidOut.rows[0].total);

    res.json({
      earnersCount: Math.max(dbEarners, DEMO_MIN_EARNERS),
      tasksCount:   Math.max(dbTasks, DEMO_MIN_TASKS),
      totalPaidOut: Math.max(dbPaidOut, DEMO_MIN_PAID_OUT),
      latestWithdrawal: lw ? { userName: lw.userName, bankName: lw.bankDetails?.bankName || "Commercial Bank", amount: lw.amount } : null,
      latestCampaign: lc ? { title: lc.title, cost: lc.totalSlots * lc.costPerSlot } : null
    });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// ─── Auth API ─────────────────────────────────────────────────────────────────

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, referralCode } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "All fields are required" });

  try {
    const existing = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: "Email address already registered" });

    const role = "User"; // All new registrations are unified User accounts
    const userReferralCode = name.substring(0, 4).toUpperCase() + Math.floor(100 + Math.random() * 900);
    const userId = "u-" + Math.random().toString(36).substr(2, 9);

    let referredByUserId: string | undefined;
    if (referralCode) {
      const referrer = await pool.query("SELECT id FROM users WHERE referral_code = $1 AND role != 'Admin'", [referralCode]);
      if (referrer.rows.length > 0) referredByUserId = referrer.rows[0].id;
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    const verificationCodeLastSent = new Date();

    try {
      await sendVerificationEmail(email, name, verificationCode);
    } catch (err: any) {
      return res.status(500).json({ error: `Could not send verification email. Details: ${err.message}` });
    }

    await pool.query(`
      INSERT INTO users (id, name, email, password, role, is_verified, wallet_balance, referral_code, referred_by,
        verification_code, verification_code_expires, verification_code_last_sent, created_at)
      VALUES ($1,$2,$3,$4,$5,false,0,$6,$7,$8,$9,$10,$11)
    `, [userId, name, email, hashPassword(password), role, userReferralCode, referredByUserId || null,
        verificationCode, verificationCodeExpires, verificationCodeLastSent, new Date()]);

    if (referredByUserId) {
      const referrer = await pool.query("SELECT * FROM users WHERE id = $1", [referredByUserId]);
      if (referrer.rows.length > 0) {
        // Earner referral commission has been disabled platform-wide: earners no longer receive
        // any wallet reward for referring new users. We still record the referral relationship
        // (for the referrals list / network tracking) with reward_earned = 0, but we do NOT
        // credit the referrer's wallet or create a "Referral Bonus" transaction.
        const reward = 0;

        const refId = "ref-" + Math.random().toString(36).substr(2, 9);
        await pool.query(`
          INSERT INTO referrals (id, referrer_id, referee_id, referee_name, referee_email, reward_earned, created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
        `, [refId, referredByUserId, userId, name, email, reward, new Date()]);
      }
    }

    res.json({ user: { id: userId, name, email, role, isVerified: false, walletBalance: 0, referralCode: userReferralCode, createdAt: new Date().toISOString() } });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: "Invalid email or password" });

    const user = mapUser(result.rows[0]);
    if (user.password !== hashPassword(password)) return res.status(401).json({ error: "Invalid email or password" });

    if (user.isBanned) {
      return res.status(403).json({ error: "Your account has been banned. Please contact support." });
    }

    if (!user.isVerified) {
      return res.status(400).json({ error: "EMAIL_NOT_VERIFIED", userId: user.id, email: user.email });
    }

    const { password: _, verificationCode: __, verificationCodeExpires: ___, verificationCodeLastSent: ____, ...safe } = user;
    res.json({ user: safe });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email address is required" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    if (result.rows.length === 0) return res.status(404).json({ error: "No account found with this email address." });

    const user = mapUser(result.rows[0]);
    const tempPassword = "TE-" + Math.floor(100000 + Math.random() * 900000).toString();

    await sendPasswordResetEmail(user.email, user.name, tempPassword);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashPassword(tempPassword), user.id]);

    res.json({ success: true, message: "Password recovery credentials sent to " + email });
  } catch (err: any) {
    res.status(500).json({ error: `Could not send recovery email. Details: ${err.message}` });
  }
});

app.post("/api/auth/verify-email", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: "Email and 6-digit code are required" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    if (result.rows.length === 0) return res.status(404).json({ error: "User account not found" });

    const user = mapUser(result.rows[0]);

    if (user.isVerified) {
      const { password: _, verificationCode: __, verificationCodeExpires: ___, verificationCodeLastSent: ____, ...safe } = user;
      return res.json({ success: true, message: "Account already verified", user: safe });
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      return res.status(400).json({ error: "Invalid 6-digit verification code" });
    }

    if (user.verificationCodeExpires && new Date(user.verificationCodeExpires).getTime() < Date.now()) {
      return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
    }

    await pool.query(
      "UPDATE users SET is_verified = true, verification_code = NULL, verification_code_expires = NULL, verification_code_last_sent = NULL WHERE id = $1",
      [user.id]
    );

    const { password: _, verificationCode: __, verificationCodeExpires: ___, verificationCodeLastSent: ____, ...safe } = user;
    res.json({ success: true, message: "Email successfully verified!", user: { ...safe, isVerified: true } });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/resend-code", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email address is required" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    if (result.rows.length === 0) return res.status(404).json({ error: "User account not found" });

    const user = mapUser(result.rows[0]);

    const lastSent = user.verificationCodeLastSent ? new Date(user.verificationCodeLastSent).getTime() : 0;
    const elapsed = Date.now() - lastSent;
    if (elapsed < 60 * 1000) {
      const remaining = Math.ceil((60 * 1000 - elapsed) / 1000);
      return res.status(429).json({ error: `Please wait ${remaining} seconds before requesting a new code.` });
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query(
      "UPDATE users SET verification_code=$1, verification_code_expires=$2, verification_code_last_sent=$3 WHERE id=$4",
      [newCode, newExpiry, new Date(), user.id]
    );

    await sendVerificationEmail(user.email, user.name, newCode);
    res.json({ success: true, message: "A new 6-digit verification code has been sent." });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to send code. Details: ${err.message}` });
  }
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { password: _, verificationCode: __, verificationCodeExpires: ___, verificationCodeLastSent: ____, ...safe } = user;
    res.json({ user: safe });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// ─── Pricing API ──────────────────────────────────────────────────────────────

app.get("/api/pricing", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM task_pricing ORDER BY id");
    res.json(result.rows.map(mapPricing));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// Advertiser-only pricing view — returns only advertiser-facing price per slot.
// Earner rewards and commissions are intentionally omitted so they are never
// visible outside the Admin control panel.
app.get("/api/advertiser/pricing", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) {
      return res.status(403).json({ error: "Access denied" });
    }
    const result = await pool.query(
      `SELECT tp.id, tp.platform, tp.cost_per_slot,
              sp.logo_url, sp.icon
       FROM task_pricing tp
       LEFT JOIN social_platforms sp ON LOWER(sp.name) = LOWER(tp.platform)
       WHERE tp.cost_per_slot > 0
       ORDER BY tp.id`
    );
    res.json(result.rows.map(row => ({
      id: row.id,
      platform: row.platform,
      costPerSlot: parseFloat(row.cost_per_slot) || 0,
      logoUrl: row.logo_url || null,
      icon: row.icon || null
    })));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// ─── Social Media Platforms API ────────────────────────────────────────────

// Public: active platforms only, for use across task creation, listings, filters, pricing displays.
app.get("/api/platforms", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM social_platforms WHERE status = 'Active' ORDER BY sort_order, name");
    res.json(result.rows.map(mapSocialPlatform));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.get("/api/admin/platforms", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query("SELECT * FROM social_platforms ORDER BY sort_order, name");
    res.json(result.rows.map(mapSocialPlatform));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/admin/platforms", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { name, icon, logoUrl, description, status, costPerSlot, earningPerSlot } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Platform name is required." });
    }
    const trimmedName = name.trim();

    const existing = await pool.query("SELECT id FROM social_platforms WHERE LOWER(name) = LOWER($1)", [trimmedName]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "A platform with this name already exists." });
    }

    const maxOrderRes = await pool.query("SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM social_platforms");
    const nextOrder = parseInt(maxOrderRes.rows[0].max_order) + 1;

    const id = slugifyPlatformId(trimmedName) + "-" + Date.now();
    await pool.query(
      `INSERT INTO social_platforms (id, name, icon, logo_url, description, status, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, trimmedName, icon || "", logoUrl || null, description || null, status === "Inactive" ? "Inactive" : "Active", nextOrder]
    );

    // Automatically make the new platform available in Task Pricing.
    // If the admin supplied pricing values in the creation form, use them directly.
    const parsedCost = typeof costPerSlot === "number" ? costPerSlot : parseFloat(costPerSlot) || 0;
    const parsedEarning = typeof earningPerSlot === "number" ? earningPerSlot : parseFloat(earningPerSlot) || 0;
    if (parsedCost > 0 || parsedEarning > 0) {
      const idRes = await pool.query("SELECT COUNT(*) FROM task_pricing");
      const prcId = `prc-${parseInt(idRes.rows[0].count) + 1}-${Date.now()}`;
      await pool.query(
        "INSERT INTO task_pricing (id, platform, cost_per_slot, earning_per_slot) VALUES ($1, $2, $3, $4)",
        [prcId, trimmedName, parsedCost, parsedEarning]
      );
    } else {
      await ensurePricingRowForPlatform(trimmedName);
    }

    const result = await pool.query("SELECT * FROM social_platforms WHERE id = $1", [id]);
    res.json({ success: true, platform: mapSocialPlatform(result.rows[0]) });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.put("/api/admin/platforms/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { id } = req.params;
    const { name, icon, logoUrl, description, status } = req.body;

    const existingRes = await pool.query("SELECT * FROM social_platforms WHERE id = $1", [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: "Platform not found." });
    }
    const existing = mapSocialPlatform(existingRes.rows[0]);

    let newName = existing.name;
    if (name && typeof name === "string" && name.trim()) {
      newName = name.trim();
      if (newName.toLowerCase() !== existing.name.toLowerCase()) {
        const dupe = await pool.query("SELECT id FROM social_platforms WHERE LOWER(name) = LOWER($1) AND id != $2", [newName, id]);
        if (dupe.rows.length > 0) {
          return res.status(400).json({ error: "A platform with this name already exists." });
        }
      }
    }

    await pool.query(
      `UPDATE social_platforms SET name=$1, icon=$2, logo_url=$3, description=$4, status=$5 WHERE id=$6`,
      [
        newName,
        icon !== undefined ? icon : existing.icon,
        logoUrl !== undefined ? (logoUrl || null) : (existing.logoUrl || null),
        description !== undefined ? (description || null) : (existing.description || null),
        status === "Inactive" ? "Inactive" : "Active",
        id
      ]
    );

    // Keep Task Pricing in sync: rename the matching pricing row if the
    // platform name changed, or create one if it never existed.
    if (newName !== existing.name) {
      await pool.query("UPDATE task_pricing SET platform=$1 WHERE platform=$2", [newName, existing.name]);
    }
    await ensurePricingRowForPlatform(newName);

    const result = await pool.query("SELECT * FROM social_platforms WHERE id = $1", [id]);
    res.json({ success: true, platform: mapSocialPlatform(result.rows[0]) });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.delete("/api/admin/platforms/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { id } = req.params;
    const existingRes = await pool.query("SELECT * FROM social_platforms WHERE id = $1", [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: "Platform not found." });
    }
    const existing = mapSocialPlatform(existingRes.rows[0]);

    await pool.query("DELETE FROM social_platforms WHERE id = $1", [id]);
    await pool.query("DELETE FROM task_pricing WHERE platform = $1", [existing.name]);

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// ─── Earner API ───────────────────────────────────────────────────────────────

// ─── Unified User Dashboard ────────────────────────────────────────────────────

app.get("/api/user/dashboard", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const subs = await pool.query("SELECT * FROM submissions WHERE earner_id = $1", [user.id]);
    const submissions = subs.rows.map(mapSubmission);
    const approved = submissions.filter((s: any) => s.status === SubmissionStatus.APPROVED);
    const pending = submissions.filter((s: any) => s.status === SubmissionStatus.PENDING);
    const rejected = submissions.filter((s: any) => s.status === SubmissionStatus.REJECTED);
    const totalEarned = approved.reduce((sum: number, s: any) => sum + s.reward, 0);

    const campaignsRes = await pool.query("SELECT * FROM tasks WHERE advertiser_id = $1", [user.id]);
    const campaigns = campaignsRes.rows.map(mapTask);
    const activeCampaigns = campaigns.filter((t: any) => t.status === TaskStatus.ACTIVE).length;
    const totalSpentRes = await pool.query(
      "SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id=$1 AND type='Campaign Spend' AND status='Success'",
      [user.id]
    );

    const submittedTaskIds = submissions.map((s: any) => s.taskId);
    let availableTasksCount = 0;
    if (submittedTaskIds.length > 0) {
      const avail = await pool.query(`SELECT COUNT(*) FROM tasks WHERE status='Active' AND id != ALL($1::varchar[])`, [submittedTaskIds]);
      availableTasksCount = parseInt(avail.rows[0].count);
    } else {
      const avail = await pool.query("SELECT COUNT(*) FROM tasks WHERE status='Active'");
      availableTasksCount = parseInt(avail.rows[0].count);
    }

    const refs = await pool.query("SELECT COUNT(*) FROM referrals WHERE referrer_id = $1", [user.id]);
    const recentSubs = [...submissions]
      .sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 5);
    const recentTxRes = await pool.query("SELECT * FROM transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5", [user.id]);

    res.json({
      walletBalance: user.walletBalance,
      adBalance: user.adBalance || 0,
      totalEarned,
      totalSpent: parseFloat(totalSpentRes.rows[0].total),
      approvedCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      availableTasksCount,
      activeCampaigns,
      campaignsCount: campaigns.length,
      referralsCount: parseInt(refs.rows[0].count),
      referralCode: user.referralCode,
      recentSubmissions: recentSubs,
      recentTransactions: recentTxRes.rows.map(mapTransaction)
    });
  } catch (err) {
    console.error("User dashboard error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/earner/dashboard", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const subs = await pool.query("SELECT * FROM submissions WHERE earner_id = $1", [user.id]);
    const submissions = subs.rows.map(mapSubmission);
    const approved = submissions.filter(s => s.status === SubmissionStatus.APPROVED);
    const pending = submissions.filter(s => s.status === SubmissionStatus.PENDING);
    const rejected = submissions.filter(s => s.status === SubmissionStatus.REJECTED);
    const totalEarned = approved.reduce((sum, s) => sum + s.reward, 0);

    const refs = await pool.query("SELECT COUNT(*) FROM referrals WHERE referrer_id = $1", [user.id]);
    const submittedTaskIds = submissions.map(s => s.taskId);

    let availableTasksCount = 0;
    if (submittedTaskIds.length > 0) {
      const avail = await pool.query(
        `SELECT COUNT(*) FROM tasks WHERE status = 'Active' AND id != ALL($1::varchar[])`,
        [submittedTaskIds]
      );
      availableTasksCount = parseInt(avail.rows[0].count);
    } else {
      const avail = await pool.query("SELECT COUNT(*) FROM tasks WHERE status = 'Active'");
      availableTasksCount = parseInt(avail.rows[0].count);
    }

    const settings = await getSettings();
    const recentSubmissions = [...submissions].sort((a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    ).slice(0, 5);

    res.json({
      walletBalance: user.walletBalance,
      totalEarned,
      approvedCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      referralsCount: parseInt(refs.rows[0].count),
      availableTasksCount,
      recentSubmissions,
      referralCode: user.referralCode
    });
  } catch (err) {
    console.error("Earner dashboard error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/earner/tasks", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    // Return only tasks the earner can still act on:
    //   • Earner has NO prior submission for this task
    //   • AND genuine open capacity exists (not all slots occupied by
    //     pending/rejected submissions from other earners)
    // Tasks with Pending, Approved, or Rejected submissions are excluded:
    //   - Pending / Approved → appear in "My Tasks & History" tab
    //   - Rejected           → appear exclusively in the "Rejected Tasks" tab
    //     where the earner clicks "Fix & Resubmit" to retry
    const tasks = await pool.query(`
      SELECT t.*
      FROM tasks t
      LEFT JOIN submissions s
        ON s.task_id = t.id AND s.earner_id = $1
      LEFT JOIN hidden_tasks ht
        ON ht.task_id = t.id AND ht.earner_id = $1
      WHERE t.status = 'Active'
        AND ht.id IS NULL
        AND s.id IS NULL
        AND t.filled_slots + (
          SELECT COUNT(*) FROM submissions s2
          WHERE s2.task_id = t.id AND s2.status IN ('Pending', 'Rejected')
        ) < t.total_slots
      ORDER BY t.created_at DESC
    `, [user.id]);

    res.json(tasks.rows.map(r => mapTask(r)));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// Earner fetches a single task by ID (for the submit / resubmit pages).
// Returns the task together with this earner's current submission status so the
// client can decide how to render (new submission vs. rejection-retry UI).
app.get("/api/earner/tasks/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });
    const taskId = req.params.id;
    const taskRes = await pool.query(`
      SELECT t.*, s.status AS sub_status, s.feedback AS sub_feedback
      FROM tasks t
      LEFT JOIN submissions s ON s.task_id = t.id AND s.earner_id = $1
      WHERE t.id = $2 AND t.status = 'Active'
    `, [user.id, taskId]);
    if (taskRes.rows.length === 0) return res.status(404).json({ error: "Task not found or not active" });
    const r = taskRes.rows[0];
    res.json({
      ...mapTask(r),
      submissionStatus: r.sub_status || null,
      submissionFeedback: r.sub_feedback || null,
    });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// Earner hides (dismisses) a task — only affects their own view, not the task itself.
app.post("/api/earner/tasks/:id/hide", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });
    const taskId = req.params.id;
    const id = `ht_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await pool.query(
      `INSERT INTO hidden_tasks (id, earner_id, task_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (earner_id, task_id) DO NOTHING`,
      [id, user.id, taskId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error hiding task:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/earner/tasks/:id/submit", async (req, res) => {
  const client = await pool.connect();
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const taskId = req.params.id;
    const { proofText, proofScreenshot } = req.body;

    // Require at least some proof — text, link, or a screenshot
    if (!proofText && !proofScreenshot) {
      return res.status(400).json({ error: "Please provide proof details: notes, a link, or a screenshot." });
    }

    await client.query("BEGIN");

    const screenshot = proofScreenshot || null;
    const finalProofText = proofText || "See uploaded screenshot proof.";

    // ── Check for an existing submission FIRST ──────────────────────────────
    // This determines the path: resubmission (Rejected → Pending) vs new submission.
    // For resubmissions the slot is already reserved, so the task does NOT need
    // to be Active — the earner deserves a chance to correct their proof even
    // if the advertiser paused the campaign after the initial rejection.
    const alreadySub = await client.query(
      "SELECT id, status FROM submissions WHERE task_id = $1 AND earner_id = $2",
      [taskId, user.id]
    );

    if (alreadySub.rows.length > 0) {
      const existing = alreadySub.rows[0];

      if (existing.status === SubmissionStatus.PENDING) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Your submission is already pending review. Please wait for the advertiser's decision." });
      }

      if (existing.status === SubmissionStatus.APPROVED) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "You have already successfully completed this task." });
      }

      // status === 'Rejected' — earner is resubmitting a corrected proof.
      // Fetch the task WITHOUT requiring Active status — the slot is reserved.
      const taskRes = await client.query(
        "SELECT * FROM tasks WHERE id = $1 FOR UPDATE",
        [taskId]
      );
      if (taskRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Task not found" });
      }
      const task = mapTask(taskRes.rows[0]);

      // Update the existing record in-place (one row per earner-task pair).
      // The old screenshot was already nulled by cleanupRejectedSubmissionProof.
      const resubmittedAt = new Date();
      await client.query(
        `UPDATE submissions
            SET proof_text       = $1,
                proof_screenshot = $2,
                status           = 'Pending',
                feedback         = '',
                rejected_at      = NULL,
                submitted_at     = $3
          WHERE id = $4`,
        [finalProofText, screenshot, resubmittedAt, existing.id]
      );

      await client.query(`
        INSERT INTO submission_history (id, submission_id, task_id, task_title, earner_id, earner_name, event_type, feedback, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,'resubmitted','',$7)
      `, [
        "sh-" + Math.random().toString(36).substr(2, 9),
        existing.id, taskId, task.title, user.id, user.name, resubmittedAt
      ]);

      await client.query("COMMIT");
      notifyAdmin({ type: "submission", message: `Task resubmission from ${user.name} for "${task.title}"`, referenceId: existing.id });
      const subRes = await pool.query("SELECT * FROM submissions WHERE id = $1", [existing.id]);
      return res.status(200).json({ success: true, message: "Task resubmitted successfully", submission: mapSubmission(subRes.rows[0]) });
    }

    // ── NEW SUBMISSION PATH ──────────────────────────────────────────────────
    // No prior submission — task must be Active and have remaining capacity.
    const taskRes = await client.query(
      "SELECT * FROM tasks WHERE id = $1 FOR UPDATE",
      [taskId]
    );
    if (taskRes.rows.length === 0 || taskRes.rows[0].status !== TaskStatus.ACTIVE) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Task is not active or not found" });
    }
    const task = mapTask(taskRes.rows[0]);

    // Count occupied slots (Pending + Rejected-reserved) to prevent overbooking.
    const occupiedRes = await client.query(
      "SELECT COUNT(*) FROM submissions WHERE task_id=$1 AND status IN ('Pending','Rejected')",
      [taskId]
    );
    const occupied = parseInt(occupiedRes.rows[0].count, 10) || 0;
    if (task.filledSlots + occupied >= task.totalSlots) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "This task has reached its submission limit" });
    }

    const subId = "sub-" + Math.random().toString(36).substr(2, 9);

    await client.query(`
      INSERT INTO submissions (id, task_id, task_title, category, earner_id, earner_name, proof_text, proof_screenshot, status, reward, submitted_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Pending',$9,$10)
    `, [subId, taskId, task.title, task.category, user.id, user.name, finalProofText, screenshot, task.earningPerSlot, new Date()]);

    await client.query("COMMIT");

    notifyAdmin({ type: "submission", message: `New task submission from ${user.name} for "${task.title}"`, referenceId: subId });

    const subRes = await pool.query("SELECT * FROM submissions WHERE id = $1", [subId]);
    res.status(201).json({ success: true, message: "Task submitted successfully", submission: mapSubmission(subRes.rows[0]) });
  } catch (err: any) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[Submit task] Error:", err);
    const isDev = process.env.NODE_ENV !== "production";
    res.status(500).json({
      error: isDev ? (err?.message || "Server error") : "Server error",
      ...(isDev && err?.detail ? { detail: err.detail } : {})
    });
  } finally {
    client.release();
  }
});

app.get("/api/earner/submissions", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query("SELECT * FROM submissions WHERE earner_id = $1 ORDER BY submitted_at DESC", [user.id]);
    res.json(result.rows.map(mapSubmission));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// Dedicated endpoint for the earner's Rejected Tasks page.
// Returns all currently-rejected submissions joined with task details so the
// frontend can show: title, platform, reward, rejection reason, date rejected.
app.get("/api/earner/rejected-submissions", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query(`
      SELECT
        s.id             AS submission_id,
        s.task_id,
        s.task_title,
        s.category,
        s.reward,
        s.feedback       AS rejection_reason,
        s.rejected_at,
        s.submitted_at,
        s.status,
        s.proof_text,
        t.description    AS task_description,
        t.proof_requirements
      FROM submissions s
      JOIN tasks t ON t.id = s.task_id
      WHERE s.earner_id = $1
        AND s.status    = 'Rejected'
      ORDER BY COALESCE(s.rejected_at, s.submitted_at) DESC
    `, [user.id]);

    res.json(result.rows.map(r => ({
      submissionId:     r.submission_id,
      taskId:           r.task_id,
      taskTitle:        r.task_title,
      category:         r.category,
      reward:           parseFloat(r.reward) || 0,
      rejectionReason:  r.rejection_reason || "",
      rejectedAt:       r.rejected_at ? (r.rejected_at instanceof Date ? r.rejected_at.toISOString() : r.rejected_at) : null,
      submittedAt:      r.submitted_at instanceof Date ? r.submitted_at.toISOString() : r.submitted_at,
      status:           r.status,
      previousProofText: r.proof_text || "",
      taskDescription:  r.task_description,
      proofRequirements: r.proof_requirements || "",
    })));
  } catch (err) {
    console.error("Rejected submissions error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Returns all data needed to render the Fix & Resubmit page for a specific
// rejected submission. Intentionally does NOT require the task to be Active —
// the earner's slot is reserved and they should always be able to fix & retry.
app.get("/api/earner/submissions/:submissionId/resubmit-info", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query(`
      SELECT
        s.id             AS submission_id,
        s.task_id,
        s.task_title,
        s.category,
        s.reward,
        s.feedback       AS rejection_reason,
        s.rejected_at,
        s.status,
        t.description    AS task_description,
        t.proof_requirements,
        t.link           AS task_link,
        t.earning_per_slot,
        t.advertiser_name
      FROM submissions s
      JOIN tasks t ON t.id = s.task_id
      WHERE s.id = $1
        AND s.earner_id = $2
        AND s.status    = 'Rejected'
    `, [req.params.submissionId, user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Rejected submission not found" });
    }
    const r = result.rows[0];
    res.json({
      submissionId:      r.submission_id,
      taskId:            r.task_id,
      taskTitle:         r.task_title,
      category:          r.category,
      reward:            parseFloat(r.reward) || 0,
      rejectionReason:   r.rejection_reason || "",
      rejectedAt:        r.rejected_at ? (r.rejected_at instanceof Date ? r.rejected_at.toISOString() : r.rejected_at) : null,
      status:            r.status,
      description:       r.task_description,
      proofRequirements: r.proof_requirements || "",
      link:              r.task_link || "",
      earningPerSlot:    parseFloat(r.earning_per_slot) || 0,
      advertiserName:    r.advertiser_name,
    });
  } catch (err) {
    console.error("[Resubmit info] Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/earner/submissions/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const subRes = await client.query(
        "SELECT * FROM submissions WHERE id=$1 AND earner_id=$2 FOR UPDATE",
        [req.params.id, user.id]
      );
      if (subRes.rows.length === 0) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Submission not found" }); }

      const submission = mapSubmission(subRes.rows[0]);
      if (submission.status !== SubmissionStatus.PENDING && submission.status !== SubmissionStatus.REJECTED) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Only pending or rejected submissions can be deleted" });
      }

      const delRes = await client.query(
        "DELETE FROM submissions WHERE id=$1 AND earner_id=$2 AND status IN ('Pending', 'Rejected') RETURNING id",
        [submission.id, user.id]
      );
      if (delRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Only pending or rejected submissions can be deleted" });
      }

      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Delete submission error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/earner/referrals", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const refs = await pool.query("SELECT * FROM referrals WHERE referrer_id = $1 ORDER BY created_at DESC", [user.id]);
    res.json({
      referralCode: user.referralCode,
      // Earner referral commission is permanently disabled — always ₦0, regardless of the
      // legacy `referral_reward` platform setting (which now only applies to future non-earner use).
      referralReward: 0,
      referrals: refs.rows.map(r => ({
        id: r.id,
        referrerId: r.referrer_id,
        refereeId: r.referee_id,
        refereeName: r.referee_name,
        refereeEmail: r.referee_email,
        rewardEarned: parseFloat(r.reward_earned),
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
      }))
    });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// ─── Earner Notification API Endpoints ───────────────────────────────────────

app.get("/api/earner/notifications", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query(
      "SELECT * FROM earner_notifications WHERE earner_id=$1 ORDER BY created_at DESC LIMIT 200",
      [user.id]
    );
    res.json(result.rows.map(mapEarnerNotification));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/earner/notifications/read-all", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });
    await pool.query("UPDATE earner_notifications SET read=true WHERE earner_id=$1", [user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/earner/notifications/:id/read", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query(
      "UPDATE earner_notifications SET read=true WHERE id=$1 AND earner_id=$2 RETURNING *",
      [req.params.id, user.id]
    );
    res.json({ success: true, notification: result.rows.length > 0 ? mapEarnerNotification(result.rows[0]) : null });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// ─── Browser Push Notification Endpoints ─────────────────────────────────────

// GET /api/notifications/vapid-public-key — returns the VAPID public key for SW subscription
app.get("/api/notifications/vapid-public-key", (_req, res) => {
  if (!vapidPublicKey) return res.status(503).json({ error: "Push notifications not configured on this server." });
  res.json({ publicKey: vapidPublicKey });
});

// GET /api/notifications/status — check if current earner has an active subscription
app.get("/api/notifications/status", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query(
      "SELECT created_at FROM notification_subscriptions WHERE user_id=$1 AND active=true ORDER BY created_at DESC LIMIT 1",
      [user.id]
    );
    if (result.rows.length > 0) {
      res.json({ subscribed: true, lastSubscribed: result.rows[0].created_at });
    } else {
      res.json({ subscribed: false });
    }
  } catch (err) {
    console.error("[Push] Status check error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/notifications/subscribe — save a browser push subscription for an earner
app.post("/api/notifications/subscribe", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { endpoint, p256dh, auth } = req.body;
    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({ error: "Missing subscription fields: endpoint, p256dh, auth" });
    }

    const id = "psub-" + Math.random().toString(36).substr(2, 9);
    const now = new Date();

    // Upsert: if this (user, endpoint) pair already exists, reactivate it and update keys
    await pool.query(`
      INSERT INTO notification_subscriptions (id, user_id, endpoint, p256dh_key, auth_key, active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, $6, $6)
      ON CONFLICT (user_id, endpoint)
      DO UPDATE SET p256dh_key=$4, auth_key=$5, active=true, updated_at=$6
    `, [id, user.id, endpoint, p256dh, auth, now]);

    res.json({ success: true });
  } catch (err) {
    console.error("[Push] Subscribe error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/notifications/unsubscribe — deactivate an earner's push subscription
app.post("/api/notifications/unsubscribe", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    await pool.query(
      "UPDATE notification_subscriptions SET active=false, updated_at=NOW() WHERE user_id=$1",
      [user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("[Push] Unsubscribe error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/notifications/send — admin endpoint to manually trigger push to all earners
app.post("/api/notifications/send", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { title, body, url } = req.body;
    const pushTitle = title || "🎉 New Task Available";
    const pushBody = body || "A new earning task has been posted. Tap to complete it before it fills up.";
    const pushUrl = url || "/earner/tasks";

    const payload = JSON.stringify({ title: pushTitle, body: pushBody, url: pushUrl });
    const sent = await sendBrowserPushToAllEarners(payload);
    res.json({ success: true, sent });
  } catch (err) {
    console.error("[Push] Send error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Note: Earner account activation fees have been removed. Earners are always
// considered activated (see mapUser) and no payment is required to use the platform.

app.get("/api/banks", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required" });

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (paystackKey) {
      try {
        const response = await fetch("https://api.paystack.co/bank?country=nigeria", {
          headers: { "Authorization": `Bearer ${paystackKey}` }
        });
        const data: any = await response.json();
        if (data?.status && data?.data) {
          return res.json(data.data.map((b: any) => ({ name: b.name, code: b.code })).sort((a: any, b: any) => a.name.localeCompare(b.name)));
        }
      } catch {}
    }

    res.json(NIGERIAN_BANK_LIST);
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// Shared resolver used by both the standalone verify endpoint and server-side
// enforcement inside the withdrawal handler (never trust client-only verification).
type BankResolution =
  | { success: true; accountName: string; bankCode?: string; isSimulated?: boolean }
  | { success: false; error: string };

async function resolveBankAccount(accountNumber: string, bankName?: string, bankCode?: string): Promise<BankResolution> {
  if (!accountNumber || (!bankCode && !bankName)) {
    return { success: false, error: "Account number and bank are required" };
  }
  if (accountNumber.length !== 10 || !/^\d+$/.test(accountNumber)) {
    return { success: false, error: "Account number must be exactly 10 digits" };
  }

  const resolvedCode = bankCode || NIGERIAN_BANK_LIST.find(b => b.name === bankName)?.code;

  const paystackKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackKey) {
    // Simulate: return the resolved bank code so the frontend/withdrawal handler can use it.
    return { success: true, accountName: `Verified Account Holder (${bankName || "Nigerian Bank"})`, bankCode: resolvedCode, isSimulated: true };
  }

  if (!resolvedCode) return { success: false, error: "Could not determine bank code for the selected bank" };

  try {
    const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${resolvedCode}`, {
      headers: { "Authorization": `Bearer ${paystackKey}` }
    });
    const data: any = await response.json();
    if (data?.status && data?.data) {
      return { success: true, accountName: data.data.account_name, bankCode: resolvedCode };
    }
    return { success: false, error: data.message || "Could not resolve bank account. Please check the details and try again." };
  } catch {
    return { success: false, error: "Bank verification service is unavailable. Please try again." };
  }
}

// ─── Paystack Transfer Helpers ────────────────────────────────────────────────

async function createPaystackRecipient(
  name: string,
  accountNumber: string,
  bankCode: string
): Promise<{ success: boolean; recipientCode?: string; error?: string }> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return { success: false, error: "PAYSTACK_SECRET_KEY not configured" };
  try {
    const res = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ type: "nuban", name, account_number: accountNumber, bank_code: bankCode, currency: "NGN" })
    });
    const data: any = await res.json();
    if (data?.status && data?.data?.recipient_code) {
      return { success: true, recipientCode: data.data.recipient_code };
    }
    return { success: false, error: data?.message || "Could not create transfer recipient" };
  } catch (err) {
    return { success: false, error: "Paystack recipient API unreachable" };
  }
}

async function initiatePaystackTransfer(
  amountKobo: number,
  recipientCode: string,
  reference: string,
  reason: string
): Promise<{ success: boolean; transferCode?: string; transferRef?: string; paystackStatus?: string; error?: string }> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return { success: false, error: "PAYSTACK_SECRET_KEY not configured" };
  try {
    const res = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ source: "balance", reason, amount: amountKobo, recipient: recipientCode, reference })
    });
    const data: any = await res.json();
    if (data?.status && data?.data) {
      const pStatus: string = data.data.status || "";
      // "success" and "pending" both mean Paystack accepted the transfer
      const accepted = ["success", "pending", "otp"].includes(pStatus);
      return {
        success: accepted,
        transferCode: data.data.transfer_code,
        transferRef: data.data.reference,
        paystackStatus: pStatus,
        error: accepted ? undefined : (data.message || `Transfer status: ${pStatus}`)
      };
    }
    return { success: false, error: data?.message || "Paystack transfer initiation failed" };
  } catch (err) {
    return { success: false, error: "Paystack transfer API unreachable" };
  }
}

app.post("/api/verify-bank", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required" });

    const { accountNumber, bankCode, bankName } = req.body;
    const result = await resolveBankAccount(accountNumber, bankName, bankCode);
    if ("error" in result) return res.status(400).json({ error: result.error });
    res.json({ success: true, accountName: result.accountName, bankCode: result.bankCode, isSimulated: result.isSimulated });
  } catch (err) {
    console.error("Verify bank error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Alias used by the frontend Withdraw page (/api/earner/verify-account → same logic as /api/verify-bank)
app.post("/api/earner/verify-account", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required" });

    const { accountNumber, bankCode, bankName } = req.body;
    if (!accountNumber || !bankName) {
      return res.status(400).json({ error: "accountNumber and bankName are required" });
    }
    const result = await resolveBankAccount(String(accountNumber), bankName, bankCode ? String(bankCode) : undefined);
    if ("error" in result) return res.status(400).json({ error: result.error });
    res.json({ success: true, accountName: result.accountName, bankCode: result.bankCode, isSimulated: result.isSimulated });
  } catch (err) {
    console.error("Verify account error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/earner/withdraw", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { amount, bankName, bankCode, accountNumber, accountName } = req.body;
    if (!amount || !bankName || !accountNumber || !accountName) {
      return res.status(400).json({ error: "All bank transfer fields are required" });
    }
    if (String(accountNumber).length !== 10 || !/^\d+$/.test(String(accountNumber))) {
      return res.status(400).json({ error: "Account number must be exactly 10 digits" });
    }

    // Never trust client-side verification state — re-resolve the account server-side.
    // Pass bankCode directly so the resolver never falls back to an error-prone name lookup
    // (Paystack bank names like "OPay" differ from hardcoded list names like "OPay Microfinance Bank").
    const verification = await resolveBankAccount(String(accountNumber), bankName, bankCode ? String(bankCode) : undefined);
    if ("error" in verification) {
      return res.status(400).json({ error: `Bank account verification failed: ${verification.error}` });
    }
    if (!verification.isSimulated) {
      // Token-based comparison: require at least two whole-word matches (or the
      // full name for single-word names) so short/common substrings can't slip
      // fraudulent mismatches past a naive substring check.
      const tokenize = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(t => t.length >= 3);
      const resolvedTokens = tokenize(verification.accountName);
      const submittedTokens = tokenize(String(accountName));
      const overlap = resolvedTokens.filter(t => submittedTokens.includes(t));
      const requiredMatches = Math.max(1, Math.min(2, resolvedTokens.length));
      if (overlap.length < requiredMatches) {
        return res.status(400).json({ error: `Account name does not match bank records. Verified name: ${verification.accountName}` });
      }
    }

    const settings = await getSettings();
    const withdrawAmount = parseFloat(amount);
    const fee = typeof settings?.withdrawalFee === "number" ? settings.withdrawalFee : 50;
    const totalDeduction = withdrawAmount + fee;

    if (isNaN(withdrawAmount) || withdrawAmount < (settings?.minWithdrawal || 200)) {
      return res.status(400).json({ error: `Minimum withdrawal amount is ₦${settings?.minWithdrawal || 200}` });
    }

    // All balance checks and writes happen inside a single DB transaction so
    // they either both succeed or both fail — no partial states possible.
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Lock the user row to prevent concurrent withdrawals racing past the balance check.
      const lockedRow = await client.query(
        "SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE",
        [user.id]
      );
      const currentBalance = parseFloat(lockedRow.rows[0].wallet_balance) || 0;

      if (currentBalance < totalDeduction) {
        await client.query("ROLLBACK");
        const shortfall = totalDeduction - currentBalance;
        return res.status(400).json({
          error: `Insufficient balance. You need ₦${totalDeduction.toLocaleString()} (₦${withdrawAmount.toLocaleString()} + ₦${fee.toLocaleString()} fee) but only have ₦${currentBalance.toLocaleString()}. Shortfall: ₦${shortfall.toLocaleString()}`
        });
      }

      // 1. Deduct amount + fee from wallet immediately.
      await client.query(
        "UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2",
        [totalDeduction, user.id]
      );

      // 2. Create the payout request record — only reached if deduction succeeded.
      const txId = "tx-" + Math.random().toString(36).substr(2, 9);
      const ref = "W-BANK-" + Math.floor(10000000 + Math.random() * 90000000);
      // Always persist bankCode — admin approval uses it to create the Paystack recipient.
      const bankDetails = JSON.stringify({ bankName, bankCode: bankCode ? String(bankCode) : null, accountNumber, accountName });

      await client.query(`
        INSERT INTO transactions (id, user_id, user_name, user_role, amount, type, status, description, reference, bank_details, withdrawal_fee, created_at)
        VALUES ($1,$2,$3,$4,$5,'Withdrawal','Pending',$6,$7,$8,$9,$10)
      `, [txId, user.id, user.name, user.role, withdrawAmount, `Withdrawal to ${bankName} (${accountNumber})`, ref, bankDetails, fee, new Date()]);

      // 3. Credit the fee to the Platform Wallet immediately.
      //    Inserting into admin_commissions is the authoritative source for the
      //    platform wallet balance — the dashboard sums this table in real time.
      //    This must happen inside the same DB transaction so the fee is never
      //    credited without the corresponding wallet deduction (and vice versa).
      if (fee > 0) {
        const feeCommId = "ac-wf-" + Math.random().toString(36).substr(2, 9);
        const feeRef    = "WF-" + Math.floor(10000000 + Math.random() * 90000000);
        await client.query(`
          INSERT INTO admin_commissions
            (id, type, amount, description, reference, user_id, user_name, related_transaction_ref, created_at)
          VALUES ($1,'withdrawal_fee',$2,$3,$4,$5,$6,$7,$8)
        `, [feeCommId, fee, `Withdrawal Fee Credit — ${user.name}`, feeRef, user.id, user.name, ref, new Date()]);

        // 4. Record the fee as a visible transaction so it appears in the earner's
        //    history and admin recent-transactions list. Amount is negative so the
        //    earner sees it as a deduction (not a mystery positive credit).
        const feeTxId = "tx-fee-" + Math.random().toString(36).substr(2, 9);
        await client.query(`
          INSERT INTO transactions
            (id, user_id, user_name, user_role, amount, type, status, description, reference, created_at)
          VALUES ($1,$2,$3,$4,$5,'Fee','Success',$6,$7,$8)
        `, [feeTxId, user.id, user.name, user.role, -fee, `Withdrawal Processing Fee`, feeRef, new Date()]);

        console.log(`[Withdraw] Fee ₦${fee} credited to platform wallet for tx ${txId} (earner: ${user.name})`);
      }

      await client.query("COMMIT");

      const newBalance = currentBalance - totalDeduction;

      notifyAdmin({ type: "withdrawal", message: `New withdrawal request of ₦${withdrawAmount.toLocaleString()} from ${user.name}`, referenceId: txId });

      // Return the authoritative post-deduction balance so the frontend can
      // update immediately without waiting for a separate refresh round-trip.
      res.json({
        success: true,
        transaction: { id: txId, amount: withdrawAmount, status: "Pending", reference: ref },
        walletBalance: newBalance,
        fee
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Withdraw error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Advertiser API ───────────────────────────────────────────────────────────

app.get("/api/advertiser/dashboard", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const tasks = await pool.query("SELECT * FROM tasks WHERE advertiser_id = $1 ORDER BY created_at DESC", [user.id]);
    const taskList = tasks.rows.map(mapTask);
    const taskIds = taskList.map(t => t.id);

    const totalSpent = await pool.query(
      "SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id=$1 AND type='Campaign Spend' AND status='Success'",
      [user.id]
    );

    let pendingSubCount = 0;
    if (taskIds.length > 0) {
      const psubs = await pool.query(
        "SELECT COUNT(*) FROM submissions WHERE task_id = ANY($1::varchar[]) AND status = 'Pending'",
        [taskIds]
      );
      pendingSubCount = parseInt(psubs.rows[0].count);
    }

    res.json({
      walletBalance: user.walletBalance,
      totalSpent: parseFloat(totalSpent.rows[0].total),
      campaignsCount: taskList.length,
      activeCount: taskList.filter(t => t.status === TaskStatus.ACTIVE).length,
      pausedCount: taskList.filter(t => t.status === TaskStatus.PAUSED).length,
      completedCount: taskList.filter(t => t.status === TaskStatus.COMPLETED).length,
      pendingSubmissionsCount: pendingSubCount,
      recentTasks: taskList.slice(0, 5)
    });
  } catch (err) {
    console.error("Advertiser dashboard error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/advertiser/tasks", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query("SELECT * FROM tasks WHERE advertiser_id = $1 ORDER BY created_at DESC", [user.id]);
    res.json(result.rows.map(mapTask));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/advertiser/tasks", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    console.log("[Campaign Create] Received body:", JSON.stringify(req.body));

    // Trim all string inputs up-front
    const title = typeof req.body.title === "string" ? req.body.title.trim() : req.body.title;
    const description = typeof req.body.description === "string" ? req.body.description.trim() : req.body.description;
    const category = typeof req.body.category === "string" ? req.body.category.trim() : req.body.category;
    const proofRequirements = typeof req.body.proofRequirements === "string" ? req.body.proofRequirements.trim() : req.body.proofRequirements;
    const link = typeof req.body.link === "string" ? req.body.link.trim() : req.body.link;
    const { totalSlots } = req.body;

    // Validate each field individually so we can name exactly which one is missing
    if (!title) return res.status(400).json({ error: "Missing required field: title" });
    if (!description) return res.status(400).json({ error: "Missing required field: description" });
    if (!category) return res.status(400).json({ error: "Missing required field: category (platform + action)" });
    if (!proofRequirements) return res.status(400).json({ error: "Missing required field: proofRequirements" });
    if (!link) return res.status(400).json({ error: "Missing required field: link (target URL)" });
    if (totalSlots === undefined || totalSlots === null || totalSlots === "") {
      return res.status(400).json({ error: "Missing required field: totalSlots" });
    }

    const slots = typeof totalSlots === "number" ? totalSlots : parseInt(totalSlots);
    if (isNaN(slots) || slots < 1 || slots > 1000000) {
      return res.status(400).json({ error: "Slot count must be between 1 and 1,000,000" });
    }

    // Pricing is ALWAYS sourced from the admin-controlled task_pricing table.
    // The platform is derived server-side from the category string by matching
    // it against active social_platforms names (longest match first to avoid
    // partial matches). The client cannot influence which pricing row is used —
    // no client-submitted platform field is trusted.
    //
    // Accepted category formats:
    //   "Instagram - Follow"  (new dash format, e.g. "Platform - Action")
    //   "Instagram Follow"    (legacy space format kept for backward compat)
    const activePlatformsRes = await pool.query(
      "SELECT * FROM social_platforms WHERE status = 'Active' ORDER BY LENGTH(name) DESC"
    );
    const activePlatforms = activePlatformsRes.rows.map(mapSocialPlatform);
    const catLower = category.toLowerCase();
    const derivedPlatform = activePlatforms.find(p => {
      const nameLower = p.name.toLowerCase();
      return (
        catLower.startsWith(nameLower + " - ") ||   // "Instagram - Follow"
        catLower.startsWith(nameLower + " ") ||     // "Instagram Follow" (legacy)
        catLower === nameLower
      );
    });
    if (!derivedPlatform) {
      return res.status(400).json({ error: `Unknown platform in category "${category}". Please select a valid platform.` });
    }

    const pricingRes = await pool.query(
      "SELECT * FROM task_pricing WHERE LOWER(platform) = LOWER($1) LIMIT 1",
      [derivedPlatform.name]
    );
    if (pricingRes.rows.length === 0 || parseFloat(pricingRes.rows[0].cost_per_slot) <= 0) {
      return res.status(400).json({ error: "No pricing has been configured for this platform yet. Please contact the administrator." });
    }
    const pricing = mapPricing(pricingRes.rows[0]);

    const finalCostPerSlot = pricing.costPerSlot;
    const finalEarningPerSlot = pricing.earningPerSlot;
    const totalCost = finalCostPerSlot * slots;

    if ((user.adBalance || 0) < totalCost) {
      return res.status(400).json({ error: `Insufficient Ad Balance. Campaign costs ₦${totalCost.toLocaleString()} (₦${finalCostPerSlot}/slot). Please fund your Ad Wallet first.` });
    }

    const client = await pool.connect();
    let newTask: any;
    let newBalance: number;
    try {
      await client.query("BEGIN");

      // Lock the user row and re-check balance atomically
      const lockedUser = await client.query("SELECT ad_balance FROM users WHERE id=$1 FOR UPDATE", [user.id]);
      const currentBalance = parseFloat(lockedUser.rows[0].ad_balance);
      if (currentBalance < totalCost) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `Insufficient Ad Balance. Campaign costs ₦${totalCost.toLocaleString()}.` });
      }

      await client.query("UPDATE users SET ad_balance = ad_balance - $1 WHERE id = $2", [totalCost, user.id]);

      const newTaskId = "task-" + Math.random().toString(36).substr(2, 9);
      const taskInsert = await client.query(`
        INSERT INTO tasks (id, title, description, category, proof_requirements, link, cost_per_slot, earning_per_slot, total_slots, filled_slots, status, advertiser_id, advertiser_name, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,'Active',$10,$11,$12) RETURNING *
      `, [newTaskId, title, description, category, proofRequirements, link, finalCostPerSlot, finalEarningPerSlot, slots, user.id, user.name, new Date()]);

      await client.query(`
        INSERT INTO transactions (id, user_id, user_name, user_role, amount, type, status, description, reference, created_at)
        VALUES ($1,$2,$3,$4,$5,'Campaign Spend','Success',$6,$7,$8)
      `, [
        "tx-" + Math.random().toString(36).substr(2, 9),
        user.id, user.name, user.role, totalCost,
        `Created Campaign: ${title}`,
        "T-SPEND-" + Math.floor(10000000 + Math.random() * 90000000),
        new Date()
      ]);

      await client.query("COMMIT");
      newTask = mapTask(taskInsert.rows[0]);
      newBalance = currentBalance - totalCost;
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }

    // Notify all earners about the new task (fire-and-forget, don't fail the request)
    notifyEarners({ id: newTask.id, title: newTask.title, category: newTask.category, earningPerSlot: newTask.earningPerSlot }).catch(() => {});

    res.json({ success: true, task: newTask, remainingBalance: newBalance });
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/advertiser/tasks/:id/toggle", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const taskRes = await pool.query("SELECT * FROM tasks WHERE id = $1 AND advertiser_id = $2", [req.params.id, user.id]);
    if (taskRes.rows.length === 0) return res.status(404).json({ error: "Task not found" });

    const task = mapTask(taskRes.rows[0]);
    let newStatus = task.status;
    if (task.status === TaskStatus.ACTIVE) newStatus = TaskStatus.PAUSED;
    else if (task.status === TaskStatus.PAUSED) newStatus = TaskStatus.ACTIVE;

    await pool.query("UPDATE tasks SET status = $1 WHERE id = $2", [newStatus, task.id]);
    res.json({ success: true, task: { ...task, status: newStatus } });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.delete("/api/advertiser/tasks/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const client = await pool.connect();
    let refundAmount = 0;
    let newBalance = 0;
    try {
      await client.query("BEGIN");

      const taskRes = await client.query("SELECT * FROM tasks WHERE id=$1 AND advertiser_id=$2 FOR UPDATE", [req.params.id, user.id]);
      if (taskRes.rows.length === 0) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Task not found" }); }

      const task = mapTask(taskRes.rows[0]);
      const remainingSlots = task.totalSlots - task.filledSlots;
      refundAmount = remainingSlots * task.costPerSlot;

      if (refundAmount > 0) {
        await client.query("UPDATE users SET ad_balance = ad_balance + $1 WHERE id=$2", [refundAmount, user.id]);
        await client.query(`
          INSERT INTO transactions (id, user_id, user_name, user_role, amount, type, status, description, reference, created_at)
          VALUES ($1,$2,$3,$4,$5,'Deposit','Success',$6,$7,$8)
        `, [
          "tx-" + Math.random().toString(36).substr(2, 9),
          user.id, user.name, user.role, refundAmount,
          `Refund for deleted campaign: ${task.title} (${remainingSlots} slots)`,
          "T-REFUND-" + Math.floor(10000000 + Math.random() * 90000000),
          new Date()
        ]);
      }

      await client.query("DELETE FROM tasks WHERE id=$1", [task.id]);

      const balRes = await client.query("SELECT wallet_balance FROM users WHERE id=$1", [user.id]);
      newBalance = parseFloat(balRes.rows[0].wallet_balance);

      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }

    // Clear proof screenshots for all submissions belonging to the deleted task.
    // Runs outside the transaction so a storage-cleanup failure never rolls back
    // the already-committed deletion or refund.
    await cleanupTaskSubmissionProofs(req.params.id);

    res.json({ success: true, refundedAmount: refundAmount, remainingBalance: newBalance });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Advertiser fetches a single submission by ID (for the dedicated review page).
app.get("/api/advertiser/submissions/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });
    const taskRes = await pool.query("SELECT id FROM tasks WHERE advertiser_id = $1", [user.id]);
    const taskIds = taskRes.rows.map((r: any) => r.id);
    if (taskIds.length === 0) return res.status(404).json({ error: "Submission not found" });
    const subRes = await pool.query(
      "SELECT * FROM submissions WHERE id = $1 AND task_id = ANY($2::varchar[])",
      [req.params.id, taskIds]
    );
    if (subRes.rows.length === 0) return res.status(404).json({ error: "Submission not found" });
    res.json(mapSubmission(subRes.rows[0]));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.get("/api/advertiser/submissions", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const taskRes = await pool.query("SELECT id FROM tasks WHERE advertiser_id = $1", [user.id]);
    const taskIds = taskRes.rows.map(r => r.id);
    if (taskIds.length === 0) return res.json([]);

    const subsRes = await pool.query(
      "SELECT * FROM submissions WHERE task_id = ANY($1::varchar[]) ORDER BY submitted_at DESC",
      [taskIds]
    );
    res.json(subsRes.rows.map(mapSubmission));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/advertiser/submissions/:id/review", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { status, feedback } = req.body;
    if (!status || (status !== SubmissionStatus.APPROVED && status !== SubmissionStatus.REJECTED)) {
      return res.status(400).json({ error: "Invalid status selection" });
    }

    const client = await pool.connect();
    let updatedSubmission: any;
    let commissionData: { amount: number; submissionId: string; taskTitle: string; earnerName: string; costPerSlot: number; earnerReward: number } | null = null;
    try {
      await client.query("BEGIN");

      // Lock submission row
      const subRes = await client.query("SELECT * FROM submissions WHERE id=$1 FOR UPDATE", [req.params.id]);
      if (subRes.rows.length === 0) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Submission not found" }); }

      const submission = mapSubmission(subRes.rows[0]);
      if (submission.status !== SubmissionStatus.PENDING) { await client.query("ROLLBACK"); return res.status(400).json({ error: "Submission has already been reviewed" }); }

      const taskRes = await client.query("SELECT * FROM tasks WHERE id=$1 AND advertiser_id=$2 FOR UPDATE", [submission.taskId, user.id]);
      if (taskRes.rows.length === 0) { await client.query("ROLLBACK"); return res.status(403).json({ error: "Unauthorized review" }); }

      const task = mapTask(taskRes.rows[0]);
      const now = new Date();

      if (status === SubmissionStatus.APPROVED) {
        await client.query("UPDATE submissions SET status=$1, feedback=$2, approved_at=$3 WHERE id=$4", [status, feedback || "", now, submission.id]);

        const earnerRes = await client.query("SELECT name, role FROM users WHERE id=$1", [submission.earnerId]);
        const earnerName = earnerRes.rows[0]?.name || "";
        const earnerRole = earnerRes.rows[0]?.role || "Earner";
        await client.query("UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id=$2", [submission.reward, submission.earnerId]);
        const txRef = "E-TASK-" + Math.floor(10000000 + Math.random() * 90000000);
        await client.query(`
          INSERT INTO transactions (id, user_id, user_name, user_role, amount, type, status, description, reference, created_at)
          VALUES ($1,$2,$3,$4,$5,'Task Earnings','Success',$6,$7,$8)
        `, [
          "tx-" + Math.random().toString(36).substr(2, 9),
          submission.earnerId, earnerName, earnerRole, submission.reward,
          `Earned from task: ${task.title}`, txRef, now
        ]);

        const newFilled = task.filledSlots + 1;
        const newStatus = newFilled >= task.totalSlots ? TaskStatus.COMPLETED : task.status;
        await client.query("UPDATE tasks SET filled_slots=$1, status=$2 WHERE id=$3", [newFilled, newStatus, task.id]);

        // Calculate and credit platform commission inside the transaction so it
        // is atomic with the approval — no commission can be lost if the server
        // crashes between commit and a post-commit credit call.
        const commission = (task.costPerSlot || 0) - submission.reward;
        if (commission > 0) {
          commissionData = { amount: commission, submissionId: submission.id, taskTitle: task.title, earnerName, costPerSlot: task.costPerSlot, earnerReward: submission.reward };
          await creditAdminCommission({
            type: "task_commission",
            amount: commission,
            description: `Task commission: "${task.title}" — ${earnerName}`,
            reference: "COMM-TASK-" + submission.id,
            userId: submission.earnerId,
            userName: earnerName,
            relatedRef: submission.id
          }, client);
        }
      } else {
        const rejectedNow = new Date();
        await client.query("UPDATE submissions SET status=$1, feedback=$2, rejected_at=$3 WHERE id=$4", [status, feedback || "", rejectedNow, submission.id]);
        // Record rejection event in submission history
        await client.query(`
          INSERT INTO submission_history (id, submission_id, task_id, task_title, earner_id, earner_name, event_type, feedback, reviewed_by, created_at)
          VALUES ($1,$2,$3,$4,$5,$6,'rejected',$7,$8,$9)
        `, [
          "sh-" + Math.random().toString(36).substr(2, 9),
          submission.id, submission.taskId, submission.taskTitle,
          submission.earnerId, submission.earnerName,
          feedback || "", user.name, rejectedNow
        ]);
      }

      await client.query("COMMIT");
      const updated = await pool.query("SELECT * FROM submissions WHERE id=$1", [submission.id]);
      updatedSubmission = mapSubmission(updated.rows[0]);
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }

    // Delete the proof screenshot once the decision is final.
    if (updatedSubmission?.status === SubmissionStatus.APPROVED) {
      await cleanupApprovedSubmissionProof(updatedSubmission.id);
      updatedSubmission.proofScreenshot = null;
    }
    if (updatedSubmission?.status === SubmissionStatus.REJECTED) {
      await cleanupRejectedSubmissionProof(updatedSubmission.id);
      updatedSubmission.proofScreenshot = null;
    }

    // Log commission details after commit so the new DB total is accurate
    if (commissionData) {
      const totalRes = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM admin_commissions WHERE type='task_commission'");
      console.log(
        `[Commission] Advertiser Approval | Submission ID: ${commissionData.submissionId} | ` +
        `Advertiser Cost: ₦${commissionData.costPerSlot} | Earner Reward: ₦${commissionData.earnerReward} | ` +
        `Commission Added: ₦${commissionData.amount} | New Task Commission Balance: ₦${parseFloat(totalRes.rows[0].total).toLocaleString()}`
      );
    }

    // Fire-and-forget browser push to the earner about their submission decision
    if (updatedSubmission) {
      const earnerId = updatedSubmission.earnerId;
      const isApproved = updatedSubmission.status === SubmissionStatus.APPROVED;
      const pushPayload = JSON.stringify({
        title: isApproved ? "✅ Task Approved — Reward Credited!" : "❌ Task Submission Rejected",
        body: isApproved
          ? `Your proof for "${updatedSubmission.taskTitle}" was approved. ₦${updatedSubmission.reward.toLocaleString()} added to your wallet.`
          : `Your submission for "${updatedSubmission.taskTitle}" was rejected. Tap to review feedback and resubmit.`,
        url: isApproved ? "/earner/wallet" : "/earner/history",
        tag: "tasksearn-account"
      });
      sendBrowserPushToUser(earnerId, pushPayload).catch(() => {});
    }

    res.json({ success: true, submission: updatedSubmission });
  } catch (err) {
    console.error("Review submission error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/advertiser/deposit/initialize", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const settings = await getSettings();
    const depositAmount = parseFloat(req.body.amount);
    if (isNaN(depositAmount) || depositAmount < (settings?.minDeposit || 100)) {
      return res.status(400).json({ error: `Minimum deposit amount is ₦${(settings?.minDeposit || 100).toLocaleString()}` });
    }

    const txId = "tx-" + Math.random().toString(36).substr(2, 9);
    const ref = "DEP-" + Math.floor(10000000 + Math.random() * 90000000);

    await pool.query(`
      INSERT INTO transactions (id, user_id, user_name, user_role, amount, type, status, description, reference, gateway, created_at)
      VALUES ($1,$2,$3,$4,$5,'Deposit','Pending','Wallet Funding via Paystack Checkout',$6,'Paystack',$7)
    `, [txId, user.id, user.name, user.role, depositAmount, ref, new Date()]);

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) {
      return res.status(400).json({ error: "PAYSTACK_SECRET_KEY environment variable is not configured." });
    }

    // Use the canonical production domain for the Paystack callback URL.
    // Deriving it from req.headers.referer is unreliable behind Replit's reverse proxy.
    // If APP_BASE_URL is set in the environment it takes priority (useful for staging).
    const appBaseUrl = (process.env.APP_BASE_URL || "https://tasksearn.name.ng").replace(/\/$/, "");
    const callbackUrl = `${appBaseUrl}/#paystack_ref=${ref}`;

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { "Authorization": `Bearer ${paystackKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, amount: Math.round(depositAmount * 100), reference: ref, callback_url: callbackUrl })
    });
    const paystackData: any = await paystackRes.json();

    if (paystackData?.status && paystackData?.data) {
      return res.json({ success: true, authorization_url: paystackData.data.authorization_url, reference: ref });
    } else {
      return res.status(500).json({ error: paystackData.message || "Failed to initialize payment gateway" });
    }
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/advertiser/deposit/verify", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role === UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { reference } = req.body;
    if (!reference) return res.status(400).json({ error: "Transaction reference is required" });

    // Verify with Paystack BEFORE acquiring any DB lock
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) return res.status(400).json({ error: "PAYSTACK_SECRET_KEY is not configured." });

    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${paystackKey}` }
    });
    const paystackData: any = await paystackRes.json();
    if (!paystackData?.status || !paystackData?.data) {
      return res.status(500).json({ error: "Could not verify payment status with gateway" });
    }
    const pStatus = paystackData.data.status;
    const pAmount = paystackData.data.amount / 100;

    // Now acquire row lock and apply atomically
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const txRes = await client.query("SELECT * FROM transactions WHERE reference=$1 AND user_id=$2 FOR UPDATE", [reference, user.id]);
      if (txRes.rows.length === 0) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Transaction record not found" }); }

      const transaction = mapTransaction(txRes.rows[0]);

      if (transaction.status === TransactionStatus.SUCCESS) {
        await client.query("ROLLBACK");
        const freshUser = await pool.query("SELECT wallet_balance FROM users WHERE id=$1", [user.id]);
        return res.json({ success: true, alreadyProcessed: true, walletBalance: parseFloat(freshUser.rows[0].wallet_balance), transaction });
      }

      if (transaction.status === TransactionStatus.FAILED || transaction.status === TransactionStatus.REJECTED) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "This transaction has already been processed as failed" });
      }

      if (pStatus === "success") {
        if (Math.abs(pAmount - transaction.amount) > 0.01) {
          await client.query("UPDATE transactions SET status='Failed' WHERE id=$1", [transaction.id]);
          await client.query("COMMIT");
          return res.status(400).json({ error: "Transaction amount mismatch. Audit flag raised." });
        }
        await client.query("UPDATE transactions SET status='Success' WHERE id=$1", [transaction.id]);
        await client.query("UPDATE users SET ad_balance = ad_balance + $1 WHERE id=$2", [transaction.amount, user.id]);
        await client.query("COMMIT");
        const freshUser = await pool.query("SELECT wallet_balance, ad_balance FROM users WHERE id=$1", [user.id]);
        return res.json({ success: true, walletBalance: parseFloat(freshUser.rows[0].wallet_balance), adBalance: parseFloat(freshUser.rows[0].ad_balance), transaction: { ...transaction, status: "Success" } });
      } else {
        await client.query("UPDATE transactions SET status='Failed' WHERE id=$1", [transaction.id]);
        await client.query("COMMIT");
        return res.status(400).json({ error: `Payment failed. Paystack status: ${pStatus}` });
      }
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Deposit verify error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Paystack Webhook ────────────────────────────────────────────────────────
//
// This endpoint receives server-to-server events from Paystack.
// It is the ONLY reliable way to credit wallets — the browser callback can be
// closed or lose connectivity, but Paystack retries webhooks automatically.
//
// ┌─────────────────────────────────────────────────────────────────────┐
// │  Live Webhook URL  →  https://tasksearn.name.ng/api/paystack/webhook │
// │  Live Callback URL →  https://tasksearn.name.ng                       │
// └─────────────────────────────────────────────────────────────────────┘
//
// The route is pre-wired with express.raw() (see top of file) so the raw
// request body is available as a Buffer for HMAC-SHA512 signature verification.

app.post("/api/paystack/webhook", async (req, res) => {
  // Respond 200 immediately — Paystack considers any non-2xx a failure and retries.
  res.status(200).send("OK");

  try {
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) {
      console.error("[Webhook] PAYSTACK_SECRET_KEY not configured — cannot verify signature");
      return;
    }

    // ── 1. Verify HMAC-SHA512 Signature ──────────────────────────────────────
    const signature = req.headers["x-paystack-signature"] as string | undefined;
    if (!signature) {
      console.warn("[Webhook] Request missing x-paystack-signature header — rejected");
      return;
    }

    // express.raw() stores the body as a Buffer; fall back gracefully if not.
    const rawBody: Buffer = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body));

    const expectedSig = crypto
      .createHmac("sha512", paystackKey)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSig) {
      console.warn("[Webhook] Signature mismatch — request rejected");
      return;
    }

    // ── 2. Parse event ────────────────────────────────────────────────────────
    const event = JSON.parse(rawBody.toString("utf8")) as { event: string; data: any };
    console.log(`[Webhook] Event received: ${event.event}`);

    // Only act on successful charge events; acknowledge everything else silently.
    if (event.event !== "charge.success") return;

    const data = event.data;
    if (!data?.reference) {
      console.warn("[Webhook] charge.success missing reference — skipping");
      return;
    }

    const reference: string = data.reference;
    const paystackAmountNaira: number = (data.amount ?? 0) / 100; // kobo → naira
    const paystackStatus: string = data.status ?? "";

    if (paystackStatus !== "success") {
      console.log(`[Webhook] charge.success event but data.status='${paystackStatus}' — skipping`);
      return;
    }

    // ── 3. Atomically credit wallet (duplicate-safe) ──────────────────────────
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // FOR UPDATE locks the row so concurrent webhook retries cannot double-credit.
      const txRes = await client.query(
        "SELECT * FROM transactions WHERE reference=$1 FOR UPDATE",
        [reference]
      );

      if (txRes.rows.length === 0) {
        await client.query("ROLLBACK");
        console.warn(`[Webhook] No transaction found for reference: ${reference} — skipping`);
        return;
      }

      const transaction = mapTransaction(txRes.rows[0])!;

      // Duplicate prevention — already credited by this webhook or by the browser callback.
      if (transaction.status === TransactionStatus.SUCCESS) {
        await client.query("ROLLBACK");
        console.log(`[Webhook] Reference ${reference} already credited — ignoring duplicate webhook`);
        return;
      }

      // Skip if the transaction was already failed/rejected.
      if (
        transaction.status === TransactionStatus.FAILED ||
        transaction.status === TransactionStatus.REJECTED
      ) {
        await client.query("ROLLBACK");
        console.warn(`[Webhook] Reference ${reference} already in terminal state '${transaction.status}' — skipping`);
        return;
      }

      // Sanity check: Paystack amount must match what we recorded at initialization.
      if (Math.abs(paystackAmountNaira - transaction.amount) > 0.01) {
        await client.query(
          "UPDATE transactions SET status='Failed', description = description || ' [WEBHOOK AMOUNT MISMATCH]' WHERE id=$1",
          [transaction.id]
        );
        await client.query("COMMIT");
        console.error(
          `[Webhook] Amount mismatch on ${reference}: expected ₦${transaction.amount}, Paystack sent ₦${paystackAmountNaira} — transaction flagged`
        );
        return;
      }

      // ── 4. Credit wallet and mark transaction successful ──────────────────
      await client.query(
        "UPDATE transactions SET status='Success' WHERE id=$1",
        [transaction.id]
      );
      await client.query(
        "UPDATE users SET ad_balance = ad_balance + $1 WHERE id=$2",
        [transaction.amount, transaction.userId]
      );
      await client.query("COMMIT");

      console.log(
        `[Webhook] ✓ ₦${transaction.amount.toLocaleString()} credited to user ${transaction.userId} (ref: ${reference})`
      );

      // ── 5. Notify admin dashboard in real-time ────────────────────────────
      await notifyAdmin({
        type: "deposit",
        message: `Wallet funded: ₦${transaction.amount.toLocaleString()} credited to ${transaction.userName} via Paystack webhook (ref: ${reference})`,
        referenceId: transaction.id
      });
    } catch (dbErr) {
      await client.query("ROLLBACK");
      console.error("[Webhook] DB error processing charge.success:", dbErr);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("[Webhook] Unexpected error:", err);
  }
});

// ─── Transactions API ─────────────────────────────────────────────────────────

app.get("/api/user/transactions", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const result = await pool.query("SELECT * FROM transactions WHERE user_id=$1 ORDER BY created_at DESC", [user.id]);
    res.json(result.rows.map(mapTransaction));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// ─── User Profile API ──────────────────────────────────────────────────────

app.put("/api/user/profile", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { name, username, phone, country, businessName, photoUrl, twoFactorEnabled, notificationPrefs } = req.body;

    // Validate username uniqueness if provided
    if (username && username !== user.username) {
      const existing = await pool.query("SELECT id FROM users WHERE username=$1 AND id!=$2", [username.trim(), user.id]);
      if (existing.rows.length > 0) return res.status(400).json({ error: "Username is already taken." });
    }

    const notifJson = notificationPrefs ? JSON.stringify(notificationPrefs) : null;

    await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        username = COALESCE($2, username),
        phone = COALESCE($3, phone),
        country = COALESCE($4, country),
        business_name = COALESCE($5, business_name),
        photo_url = COALESCE($6, photo_url),
        two_factor_enabled = COALESCE($7, two_factor_enabled),
        notification_prefs = COALESCE($8::jsonb, notification_prefs)
      WHERE id = $9`,
      [
        name?.trim() || null,
        username?.trim() || null,
        phone?.trim() || null,
        country?.trim() || null,
        businessName?.trim() || null,
        photoUrl?.trim() || null,
        typeof twoFactorEnabled === "boolean" ? twoFactorEnabled : null,
        notifJson,
        user.id,
      ]
    );

    const updated = await pool.query("SELECT * FROM users WHERE id=$1", [user.id]);
    const mappedUser = mapUser(updated.rows[0]);
    const { password: _, verificationCode: __, verificationCodeExpires: ___, verificationCodeLastSent: ____, ...safe } = mappedUser;
    res.json({ success: true, user: safe });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/user/change-password", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Both current and new password are required." });
    if (newPassword.length < 6) return res.status(400).json({ error: "New password must be at least 6 characters." });

    if (user.password !== hashPassword(currentPassword)) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }

    await pool.query("UPDATE users SET password=$1 WHERE id=$2", [hashPassword(newPassword), user.id]);
    res.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/user/account", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (user.role === "Admin") return res.status(403).json({ error: "Admin accounts cannot be deleted." });

    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Password confirmation required." });

    if (user.password !== hashPassword(password)) {
      return res.status(400).json({ error: "Password is incorrect." });
    }

    // Clean up user data
    await pool.query("DELETE FROM submissions WHERE earner_id=$1", [user.id]);
    await pool.query("DELETE FROM transactions WHERE user_id=$1", [user.id]);
    await pool.query("DELETE FROM referrals WHERE referrer_id=$1 OR referee_id=$1", [user.id]);
    if (user.role === "Advertiser") {
      await pool.query("UPDATE tasks SET status='Completed' WHERE advertiser_id=$1 AND status='Active'", [user.id]);
    }
    await pool.query("DELETE FROM users WHERE id=$1", [user.id]);

    res.json({ success: true, message: "Account deleted successfully." });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Admin API ────────────────────────────────────────────────────────────────

app.get("/api/admin/dashboard", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    const [
      earners, advertisers, tasks,
      totalEarned, pendingWd, completedWd, totalDep,
      recentUsers, recentTx,
      todayUsers,
      emailHistoryToday, emailHistoryFailed,
      lastEmailSent,
      settings,
      trendRegs, trendDeps, trendWds,
      earnersCommissionRes
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'User'"),
      pool.query("SELECT COUNT(DISTINCT advertiser_id) FROM tasks WHERE advertiser_id IS NOT NULL"),
      pool.query("SELECT COUNT(*) FROM tasks"),
      pool.query("SELECT COALESCE(SUM(reward),0) AS total FROM submissions WHERE status='Approved'"),
      pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE type='Withdrawal' AND status='Pending'"),
      pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE type='Withdrawal' AND status='Approved'"),
      pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE type='Deposit' AND status='Success'"),
      pool.query("SELECT * FROM users ORDER BY created_at DESC LIMIT 10"),
      pool.query("SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10"),
      pool.query("SELECT COUNT(*) FROM users WHERE created_at >= $1", [todayIso]),
      // Email stats — graceful if table doesn't exist
      pool.query("SELECT COUNT(*) FROM email_logs WHERE created_at >= $1 AND status='sent'", [todayIso]).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query("SELECT COUNT(*) FROM email_logs WHERE status='failed'").catch(() => ({ rows: [{ count: 0 }] })),
      pool.query("SELECT created_at, recipient FROM email_logs WHERE status='sent' ORDER BY created_at DESC LIMIT 1").catch(() => ({ rows: [] })),
      getSettings(),
      // 7-day daily registration trend
      pool.query(`
        SELECT DATE(created_at) AS day, COUNT(*) AS count
        FROM users
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY day ORDER BY day ASC
      `),
      // 7-day daily deposit trend
      pool.query(`
        SELECT DATE(created_at) AS day, COALESCE(SUM(amount),0) AS total
        FROM transactions
        WHERE type='Deposit' AND status='Success' AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY day ORDER BY day ASC
      `),
      // 7-day daily withdrawal trend
      pool.query(`
        SELECT DATE(created_at) AS day, COALESCE(SUM(amount),0) AS total
        FROM transactions
        WHERE type='Withdrawal' AND status='Approved' AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY day ORDER BY day ASC
      `),
      // Total platform commission earned from completed earner tasks
      pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM admin_commissions WHERE type='task_commission'")
    ]);

    const rawTotalDeposited = parseFloat(totalDep.rows[0].total);
    const depositStatOffset = (settings as any)?.depositStatOffset || 0;
    // Reset offset is a pure dashboard-display adjustment — it never touches
    // the underlying transaction rows, advertiser accounts, or wallet balances.
    const displayedTotalDeposited = Math.max(0, rawTotalDeposited - depositStatOffset);

    // Build 7-day trend arrays aligned to date labels
    const buildTrend = (rows: any[], valueKey: string) => {
      const map: Record<string, number> = {};
      for (const r of rows) {
        const d = new Date(r.day);
        const label = d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
        map[label] = parseFloat(r[valueKey]) || 0;
      }
      const labels: string[] = [];
      const values: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
        labels.push(label);
        values.push(map[label] || 0);
      }
      return { labels, values };
    };

    const emailServiceConfigured = !!(process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER));

    res.json({
      earnersCount: parseInt(earners.rows[0].count),
      advertisersCount: parseInt(advertisers.rows[0].count),
      tasksCount: parseInt(tasks.rows[0].count),
      totalEarned: parseFloat(totalEarned.rows[0].total),
      pendingWithdrawals: parseFloat(pendingWd.rows[0].total),
      completedWithdrawals: parseFloat(completedWd.rows[0].total),
      totalDeposited: displayedTotalDeposited,
      todayNewUsers: parseInt(todayUsers.rows[0].count),
      earnersCommission: parseFloat(earnersCommissionRes.rows[0].total) || 0,
      emailService: {
        configured: emailServiceConfigured,
        emailsSentToday: parseInt(emailHistoryToday.rows[0]?.count || "0"),
        failedEmails: parseInt(emailHistoryFailed.rows[0]?.count || "0"),
        lastEmailSent: lastEmailSent.rows[0]?.created_at || null,
        lastEmailRecipient: lastEmailSent.rows[0]?.recipient || null,
      },
      trends: {
        registrations: buildTrend(trendRegs.rows, "count"),
        deposits: buildTrend(trendDeps.rows, "total"),
        withdrawals: buildTrend(trendWds.rows, "total"),
      },
      recentUsers: recentUsers.rows.map(r => {
        const u = mapUser(r);
        const { password: _, verificationCode: __, verificationCodeExpires: ___, verificationCodeLastSent: ____, ...safe } = u as any;
        return safe;
      }),
      recentTransactions: recentTx.rows.map(mapTransaction),
      settings
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/users", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query("SELECT * FROM users WHERE role != 'Admin' ORDER BY created_at DESC");
    res.json(result.rows.map(r => {
      const u = mapUser(r);
      const { password: _, verificationCode: __, verificationCodeExpires: ___, verificationCodeLastSent: ____, ...safe } = u;
      return safe;
    }));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.put("/api/admin/users/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { walletBalance, isVerified } = req.body;
    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (walletBalance !== undefined) { updates.push(`wallet_balance=$${idx++}`); params.push(parseFloat(walletBalance)); }
    if (isVerified !== undefined) { updates.push(`is_verified=$${idx++}`); params.push(!!isVerified); }

    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });

    params.push(req.params.id);
    await pool.query(`UPDATE users SET ${updates.join(",")} WHERE id=$${idx}`, params);

    const updated = await pool.query("SELECT * FROM users WHERE id=$1", [req.params.id]);
    if (updated.rows.length === 0) return res.status(404).json({ error: "User not found" });

    const u = mapUser(updated.rows[0]);
    const { password: _, verificationCode: __, verificationCodeExpires: ___, verificationCodeLastSent: ____, ...safe } = u;
    res.json({ success: true, user: safe });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// ─── Admin User Management — Ban / Unban / Delete ───────────────────────────

app.post("/api/admin/users/:id/ban", async (req, res) => {
  try {
    const admin = await getAuthenticatedUser(req);
    if (!admin || admin.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const targetRes = await pool.query("SELECT * FROM users WHERE id = $1 AND role != 'Admin'", [req.params.id]);
    if (targetRes.rows.length === 0) return res.status(404).json({ error: "User not found" });
    const target = mapUser(targetRes.rows[0]);

    await pool.query("UPDATE users SET is_banned = TRUE WHERE id = $1", [target.id]);
    await pool.query(
      `INSERT INTO admin_action_logs (id, admin_id, admin_name, action, target_user_id, target_user_name, target_user_email, notes, created_at)
       VALUES ($1,$2,$3,'ban',$4,$5,$6,$7,$8)`,
      ["log-" + Math.random().toString(36).substr(2, 9), admin.id, admin.name,
       target.id, target.name, target.email, req.body.notes || null, new Date()]
    );
    console.log(`[Admin] ${admin.name} banned user ${target.name} (${target.id})`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/admin/users/:id/unban", async (req, res) => {
  try {
    const admin = await getAuthenticatedUser(req);
    if (!admin || admin.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const targetRes = await pool.query("SELECT * FROM users WHERE id = $1 AND role != 'Admin'", [req.params.id]);
    if (targetRes.rows.length === 0) return res.status(404).json({ error: "User not found" });
    const target = mapUser(targetRes.rows[0]);

    await pool.query("UPDATE users SET is_banned = FALSE WHERE id = $1", [target.id]);
    await pool.query(
      `INSERT INTO admin_action_logs (id, admin_id, admin_name, action, target_user_id, target_user_name, target_user_email, notes, created_at)
       VALUES ($1,$2,$3,'unban',$4,$5,$6,$7,$8)`,
      ["log-" + Math.random().toString(36).substr(2, 9), admin.id, admin.name,
       target.id, target.name, target.email, req.body.notes || null, new Date()]
    );
    console.log(`[Admin] ${admin.name} unbanned user ${target.name} (${target.id})`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.delete("/api/admin/users/:id", async (req, res) => {
  try {
    const admin = await getAuthenticatedUser(req);
    if (!admin || admin.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const targetRes = await pool.query("SELECT * FROM users WHERE id = $1 AND role != 'Admin'", [req.params.id]);
    if (targetRes.rows.length === 0) return res.status(404).json({ error: "User not found" });
    const target = mapUser(targetRes.rows[0]);
    const uid = target.id;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Log first so the record exists even if later steps fail
      await client.query(
        `INSERT INTO admin_action_logs (id, admin_id, admin_name, action, target_user_id, target_user_name, target_user_email, notes, created_at)
         VALUES ($1,$2,$3,'delete',$4,$5,$6,$7,$8)`,
        ["log-" + Math.random().toString(36).substr(2, 9), admin.id, admin.name,
         uid, target.name, target.email, null, new Date()]
      );

      // 1. Earner notifications
      await client.query("DELETE FROM earner_notifications WHERE earner_id = $1", [uid]);

      // 2. Submission history
      await client.query("DELETE FROM submission_history WHERE earner_id = $1", [uid]);

      // 3. Earner submissions — decrement filled_slots on affected tasks
      const approvedSubs = await client.query(
        "SELECT task_id, COUNT(*) AS cnt FROM submissions WHERE earner_id = $1 AND status = 'Approved' GROUP BY task_id",
        [uid]
      );
      for (const row of approvedSubs.rows) {
        await client.query(
          "UPDATE tasks SET filled_slots = GREATEST(0, filled_slots - $1) WHERE id = $2",
          [parseInt(row.cnt), row.task_id]
        );
      }
      await client.query("DELETE FROM submissions WHERE earner_id = $1", [uid]);

      // 4. Advertiser tasks + their related records
      const ownedTasks = await client.query("SELECT id FROM tasks WHERE advertiser_id = $1", [uid]);
      for (const row of ownedTasks.rows) {
        await client.query("DELETE FROM submission_history WHERE task_id = $1", [row.id]);
        await client.query("DELETE FROM submissions WHERE task_id = $1", [row.id]);
        await client.query("DELETE FROM earner_notifications WHERE task_id = $1", [row.id]);
        await client.query("DELETE FROM hidden_tasks WHERE task_id = $1", [row.id]);
      }
      await client.query("DELETE FROM tasks WHERE advertiser_id = $1", [uid]);

      // 5. Transactions, referrals, commissions
      await client.query("DELETE FROM transactions WHERE user_id = $1", [uid]);
      await client.query("DELETE FROM referrals WHERE referrer_id = $1 OR referee_id = $1", [uid]);
      await client.query("DELETE FROM admin_commissions WHERE user_id = $1", [uid]);

      // 6. Push subscriptions and hidden tasks (foreign key cascades, but be explicit)
      await client.query("DELETE FROM notification_subscriptions WHERE user_id = $1", [uid]);
      await client.query("DELETE FROM hidden_tasks WHERE earner_id = $1", [uid]);

      // 7. Delete the user record
      await client.query("DELETE FROM users WHERE id = $1", [uid]);

      await client.query("COMMIT");
      console.log(`[Admin] ${admin.name} permanently deleted user ${target.name} (${uid})`);
      res.json({ success: true });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// ─── Admin Tasks ─────────────────────────────────────────────────────────────

app.get("/api/admin/tasks", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query("SELECT * FROM tasks ORDER BY created_at DESC");
    res.json(result.rows.map(mapTask));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// ─── Create Admin Task (no payment required) ─────────────────────────────────
app.post("/api/admin/tasks", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { title, description, category, proofRequirements, link, totalSlots, earningPerSlot } = req.body;
    if (!title || !description || !category || !link || !totalSlots || !earningPerSlot) {
      return res.status(400).json({ error: "Title, description, category, link, slots, and reward are required" });
    }

    const slots = parseInt(totalSlots);
    const reward = parseFloat(earningPerSlot);
    if (isNaN(slots) || slots <= 0) return res.status(400).json({ error: "Invalid slot count" });
    if (isNaN(reward) || reward <= 0) return res.status(400).json({ error: "Invalid reward amount" });

    const newTaskId = "task-" + Math.random().toString(36).substr(2, 9);
    const proofReq = proofRequirements || "Submit proof of completion (screenshot or username).";

    const taskInsert = await pool.query(`
      INSERT INTO tasks (id, title, description, category, proof_requirements, link, cost_per_slot, earning_per_slot, total_slots, filled_slots, status, advertiser_id, advertiser_name, is_admin_task, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,0,'Active',$9,$10,true,$11) RETURNING *
    `, [newTaskId, title, description, category, proofReq, link, reward, slots, user.id, user.name, new Date()]);

    const createdTask = mapTask(taskInsert.rows[0]);
    // Notify all earners about the new task (fire-and-forget)
    notifyEarners({ id: createdTask.id, title: createdTask.title, category: createdTask.category, earningPerSlot: createdTask.earningPerSlot }).catch(() => {});

    res.json({ success: true, task: createdTask });
  } catch (err) {
    console.error("Admin create task error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Edit Admin Task ──────────────────────────────────────────────────────────
app.put("/api/admin/tasks/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const taskRes = await pool.query("SELECT * FROM tasks WHERE id=$1 AND is_admin_task=true", [req.params.id]);
    if (taskRes.rows.length === 0) return res.status(404).json({ error: "Admin task not found" });

    const { title, description, category, proofRequirements, link, totalSlots, earningPerSlot } = req.body;
    const slots = parseInt(totalSlots);
    const reward = parseFloat(earningPerSlot);
    if (!title || !description || !category || !link) return res.status(400).json({ error: "Required fields missing" });
    if (isNaN(slots) || slots <= 0) return res.status(400).json({ error: "Invalid slot count" });
    if (isNaN(reward) || reward <= 0) return res.status(400).json({ error: "Invalid reward amount" });

    const proofReq = proofRequirements || "Submit proof of completion (screenshot or username).";
    const result = await pool.query(`
      UPDATE tasks SET title=$1, description=$2, category=$3, proof_requirements=$4, link=$5, total_slots=$6, earning_per_slot=$7, cost_per_slot=$7
      WHERE id=$8 AND is_admin_task=true RETURNING *
    `, [title, description, category, proofReq, link, slots, reward, req.params.id]);

    res.json({ success: true, task: mapTask(result.rows[0]) });
  } catch (err) {
    console.error("Admin edit task error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/admin/tasks/:id/status", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { status } = req.body;
    const result = await pool.query("UPDATE tasks SET status=$1 WHERE id=$2 RETURNING *", [status, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Task not found" });

    res.json({ success: true, task: mapTask(result.rows[0]) });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.delete("/api/admin/tasks/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const client = await pool.connect();
    let refundAmount = 0;
    try {
      await client.query("BEGIN");

      const taskRes = await client.query("SELECT * FROM tasks WHERE id=$1 FOR UPDATE", [req.params.id]);
      if (taskRes.rows.length === 0) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Task not found" }); }

      const task = mapTask(taskRes.rows[0]);
      const remainingSlots = task.totalSlots - task.filledSlots;
      refundAmount = remainingSlots * task.costPerSlot;

      // Only refund to the advertiser if this is NOT an admin-created task
      // (admin tasks require no payment so there is nothing to refund)
      if (refundAmount > 0 && task.advertiserId && !task.isAdminTask) {
        await client.query("UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id=$2", [refundAmount, task.advertiserId]);
        await client.query(`
          INSERT INTO transactions (id, user_id, user_name, user_role, amount, type, status, description, reference, created_at)
          VALUES ($1,$2,$3,$4,$5,'Deposit','Success',$6,$7,$8)
        `, [
          "tx-" + Math.random().toString(36).substr(2, 9),
          task.advertiserId, task.advertiserName, "User", refundAmount,
          `Refund for campaign deleted by admin: ${task.title} (${remainingSlots} slots)`,
          "T-REFUND-ADM-" + Math.floor(10000000 + Math.random() * 90000000),
          new Date()
        ]);
      }
      if (task.isAdminTask) refundAmount = 0; // no refund for admin tasks

      await client.query("DELETE FROM submissions WHERE task_id=$1 AND status='Pending'", [task.id]);
      await client.query("DELETE FROM tasks WHERE id=$1", [task.id]);
      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }

    // Clear proof screenshots for all remaining submissions of the deleted task
    // (approved/rejected ones are kept for history but their screenshots are not needed).
    await cleanupTaskSubmissionProofs(req.params.id);

    res.json({ success: true, refundedAmount: refundAmount });
  } catch (err) {
    console.error("Admin delete task error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/submissions", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query("SELECT * FROM submissions ORDER BY submitted_at DESC");
    res.json(result.rows.map(mapSubmission));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/admin/submissions/:id/review", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { feedback } = req.body;
    // Normalize status: accept both "Approved"/"APPROVED" and "Rejected"/"REJECTED"
    const rawStatus = req.body.status;
    const normalizedStatus = rawStatus
      ? Object.values(SubmissionStatus).find(
          v => v.toLowerCase() === String(rawStatus).toLowerCase()
        ) || rawStatus
      : rawStatus;
    const status = normalizedStatus;
    if (!status || (status !== SubmissionStatus.APPROVED && status !== SubmissionStatus.REJECTED)) {
      return res.status(400).json({ error: "Invalid status. Must be 'Approved' or 'Rejected'." });
    }
    const client = await pool.connect();
    let updatedSubmission: any;
    let adminCommData: { amount: number; submissionId: string; taskTitle: string; earnerName: string; costPerSlot: number } | null = null;
    try {
      await client.query("BEGIN");

      const subRes = await client.query("SELECT * FROM submissions WHERE id=$1 FOR UPDATE", [req.params.id]);
      if (subRes.rows.length === 0) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Submission not found" }); }

      const submission = mapSubmission(subRes.rows[0]);
      if (submission.status !== SubmissionStatus.PENDING) { await client.query("ROLLBACK"); return res.status(400).json({ error: "Submission has already been audited" }); }

      const taskRes = await client.query("SELECT * FROM tasks WHERE id=$1 FOR UPDATE", [submission.taskId]);
      if (taskRes.rows.length === 0) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Associated task not found" }); }

      const task = mapTask(taskRes.rows[0]);
      const now = new Date();

      if (status === SubmissionStatus.APPROVED) {
        await client.query("UPDATE submissions SET status=$1, feedback=$2, approved_at=$3 WHERE id=$4", [status, feedback || "", now, submission.id]);
        const earnerRes = await client.query("SELECT name, role FROM users WHERE id=$1", [submission.earnerId]);
        if (earnerRes.rows.length > 0) {
          const earnerName = earnerRes.rows[0].name;
          await client.query("UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id=$2", [submission.reward, submission.earnerId]);
          await client.query(`
            INSERT INTO transactions (id, user_id, user_name, user_role, amount, type, status, description, reference, created_at)
            VALUES ($1,$2,$3,$4,$5,'Task Earnings','Success',$6,$7,$8)
          `, [
            "tx-" + Math.random().toString(36).substr(2, 9),
            submission.earnerId, earnerName, earnerRes.rows[0].role,
            submission.reward,
            `Earned from task (Admin Audited): ${task.title}`,
            "E-TASK-ADM-" + Math.floor(10000000 + Math.random() * 90000000), now
          ]);

          // Credit commission atomically inside the transaction.
          const commission = (task.costPerSlot || 0) - submission.reward;
          if (commission > 0) {
            adminCommData = { amount: commission, submissionId: submission.id, taskTitle: task.title, earnerName, costPerSlot: task.costPerSlot };
            await creditAdminCommission({
              type: "task_commission",
              amount: commission,
              description: `Task commission (Admin): "${task.title}" — ${earnerName}`,
              reference: "COMM-ADMTASK-" + submission.id,
              userId: submission.earnerId,
              userName: earnerName,
              relatedRef: submission.id
            }, client);
          }
        }
        const newFilled = task.filledSlots + 1;
        const newStatus = newFilled >= task.totalSlots ? TaskStatus.COMPLETED : task.status;
        await client.query("UPDATE tasks SET filled_slots=$1, status=$2 WHERE id=$3", [newFilled, newStatus, task.id]);
      } else {
        const rejectedNow = new Date();
        await client.query("UPDATE submissions SET status=$1, feedback=$2, rejected_at=$3 WHERE id=$4", [status, feedback || "", rejectedNow, submission.id]);
        // Record rejection event in submission history
        await client.query(`
          INSERT INTO submission_history (id, submission_id, task_id, task_title, earner_id, earner_name, event_type, feedback, reviewed_by, created_at)
          VALUES ($1,$2,$3,$4,$5,$6,'rejected',$7,$8,$9)
        `, [
          "sh-" + Math.random().toString(36).substr(2, 9),
          submission.id, submission.taskId, submission.taskTitle,
          submission.earnerId, submission.earnerName,
          feedback || "", user.name, rejectedNow
        ]);
      }

      await client.query("COMMIT");
      const updated = await pool.query("SELECT * FROM submissions WHERE id=$1", [submission.id]);
      updatedSubmission = mapSubmission(updated.rows[0]);
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }

    // Delete the proof screenshot once the decision is final (approved or rejected).
    // Runs after the transaction commits so the decision is durable before we clean up.
    if (updatedSubmission?.status === SubmissionStatus.APPROVED) {
      await cleanupApprovedSubmissionProof(updatedSubmission.id);
      updatedSubmission.proofScreenshot = null;
    }
    if (updatedSubmission?.status === SubmissionStatus.REJECTED) {
      await cleanupRejectedSubmissionProof(updatedSubmission.id);
      updatedSubmission.proofScreenshot = null;
    }

    // Log commission details after commit so the new DB total is accurate
    if (adminCommData) {
      const totalRes = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM admin_commissions WHERE type='task_commission'");
      console.log(
        `[Commission] Admin Approval | Task ID: ${adminCommData.submissionId} | ` +
        `Advertiser Cost: ₦${adminCommData.costPerSlot} | Earner Reward: ₦${updatedSubmission?.reward ?? adminCommData.costPerSlot - adminCommData.amount} | ` +
        `Commission Added: ₦${adminCommData.amount} | New Task Commission Balance: ₦${parseFloat(totalRes.rows[0].total).toLocaleString()}`
      );
    }

    // Fire-and-forget browser push to the earner about their submission decision (admin review)
    if (updatedSubmission) {
      const earnerId = updatedSubmission.earnerId;
      const isApproved = updatedSubmission.status === SubmissionStatus.APPROVED;
      const pushPayload = JSON.stringify({
        title: isApproved ? "✅ Task Approved — Reward Credited!" : "❌ Task Submission Rejected",
        body: isApproved
          ? `Your proof for "${updatedSubmission.taskTitle}" was approved. ₦${updatedSubmission.reward.toLocaleString()} added to your wallet.`
          : `Your submission for "${updatedSubmission.taskTitle}" was rejected. Tap to review feedback and resubmit.`,
        url: isApproved ? "/earner/wallet" : "/earner/history",
        tag: "tasksearn-account"
      });
      sendBrowserPushToUser(earnerId, pushPayload).catch(() => {});
    }

    res.json({ success: true, submission: updatedSubmission });
  } catch (err) {
    console.error("Admin review error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/withdrawals", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query("SELECT * FROM transactions WHERE type='Withdrawal' ORDER BY created_at DESC");
    res.json(result.rows.map(mapTransaction));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/admin/withdrawals/:id/review", async (req, res) => {
  try {
    const admin = await getAuthenticatedUser(req);
    if (!admin || admin.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { action, rejectionReason } = req.body;
    const isApprove = action === "approve";
    const isReject = action === "reject";
    if (!isApprove && !isReject) {
      return res.status(400).json({ error: "action must be 'approve' or 'reject'" });
    }

    // ── Fetch and lock the transaction ────────────────────────────────────────
    const client = await pool.connect();
    let txSnapshot: any;
    try {
      await client.query("BEGIN");
      const txRes = await client.query(
        "SELECT * FROM transactions WHERE id=$1 AND type='Withdrawal' FOR UPDATE",
        [req.params.id]
      );
      if (txRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Withdrawal transaction not found" });
      }
      txSnapshot = mapTransaction(txRes.rows[0]);
      // Pending  → admin can approve (triggers Paystack) or reject (full refund).
      // Approved → Paystack previously failed; admin can retry, mark-paid manually, or reject & refund.
      // All other statuses (Paid, Rejected, Success, Failed) are terminal — block further action.
      const actionableStatuses = [TransactionStatus.PENDING, TransactionStatus.APPROVED];
      if (!actionableStatuses.includes(txSnapshot.status)) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "This withdrawal has already been processed and cannot be modified" });
      }

      if (isReject) {
        // Reject — full refund: return withdrawal amount + fee to the earner and
        // reverse the platform wallet credit that was posted at submission time.
        // Everything runs in the open BEGIN transaction so no partial state can occur.
        const storedFee   = txSnapshot.withdrawalFee != null ? txSnapshot.withdrawalFee : 0;
        const totalRefund = txSnapshot.amount + storedFee;

        // 1. Restore the full deducted amount to the earner's wallet.
        await client.query(
          "UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id=$2",
          [totalRefund, txSnapshot.userId]
        );

        // 2. Mark the withdrawal as Rejected.
        await client.query(
          "UPDATE transactions SET status='Rejected', rejection_reason=$1 WHERE id=$2",
          [rejectionReason || null, txSnapshot.id]
        );

        // 3. Reverse the platform wallet fee credit that was posted at submission.
        //    Find the admin_commissions row via its related_transaction_ref, grab its
        //    reference (which links to the Fee transaction row), then delete both.
        if (storedFee > 0) {
          const feeCommRes = await client.query(
            "SELECT reference FROM admin_commissions WHERE related_transaction_ref=$1 AND type='withdrawal_fee'",
            [txSnapshot.reference]
          );
          if (feeCommRes.rows.length > 0) {
            const feeRef = feeCommRes.rows[0].reference;
            await client.query(
              "DELETE FROM admin_commissions WHERE related_transaction_ref=$1 AND type='withdrawal_fee'",
              [txSnapshot.reference]
            );
            await client.query(
              "DELETE FROM transactions WHERE reference=$1 AND type='Fee'",
              [feeRef]
            );
          }
        }

        // 4. Create a visible Refund transaction so the earner can see the credit
        //    appear in their wallet history immediately.
        const refundTxId = "tx-ref-" + Math.random().toString(36).substr(2, 9);
        const refundRef  = "REF-" + Math.floor(10000000 + Math.random() * 90000000);
        await client.query(`
          INSERT INTO transactions
            (id, user_id, user_name, user_role, amount, type, status, description, reference, created_at)
          VALUES ($1,$2,$3,$4,$5,'Refund','Success',$6,$7,$8)
        `, [
          refundTxId,
          txSnapshot.userId,
          txSnapshot.userName,
          txSnapshot.userRole,
          totalRefund,
          `Withdrawal Refund${rejectionReason ? ` — ${rejectionReason}` : ""}`,
          refundRef,
          new Date()
        ]);

        await client.query("COMMIT");
        console.log(`[Review] Withdrawal ${txSnapshot.id} rejected — full refund ₦${totalRefund} (₦${txSnapshot.amount} + ₦${storedFee} fee) returned to ${txSnapshot.userName}; platform wallet fee credit reversed`);
        const updated = await pool.query("SELECT * FROM transactions WHERE id=$1", [txSnapshot.id]);
        // Push: notify earner their withdrawal was rejected and refunded
        sendBrowserPushToUser(txSnapshot.userId, JSON.stringify({
          title: "❌ Withdrawal Request Rejected",
          body: `Your withdrawal of ₦${txSnapshot.amount.toLocaleString()} was rejected. ₦${totalRefund.toLocaleString()} has been refunded to your wallet.`,
          url: "/earner/wallet",
          tag: "tasksearn-account"
        })).catch(() => {});
        return res.json({ success: true, transaction: mapTransaction(updated.rows[0]) });
      }

      // ── Approve: balance was already deducted at request time — mark as Approved then call Paystack ──
      await client.query("UPDATE transactions SET status='Approved', rejection_reason=NULL WHERE id=$1", [txSnapshot.id]);
      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }

    // ── Call Paystack Transfer API (outside DB transaction) ────────────────────
    const bankDetails: any = txSnapshot.bankDetails || {};
    const resolvedBankCode = bankDetails.bankCode || NIGERIAN_BANK_LIST.find((b: any) => b.name === bankDetails.bankName)?.code;

    let paystackOk = false;
    let transferRef = "";
    let failureNote = "";

    if (!resolvedBankCode) {
      failureNote = `Cannot resolve bank code for "${bankDetails.bankName}". Add it to the bank list.`;
    } else {
      const recipientRes = await createPaystackRecipient(
        bankDetails.accountName || txSnapshot.userName,
        String(bankDetails.accountNumber),
        resolvedBankCode
      );
      if (!recipientRes.success) {
        failureNote = `Recipient creation failed: ${recipientRes.error}`;
      } else {
        const amountKobo = Math.round(txSnapshot.amount * 100);
        const transferRes = await initiatePaystackTransfer(
          amountKobo,
          recipientRes.recipientCode!,
          txSnapshot.reference,
          `TasksEarn payout — ${txSnapshot.userName}`
        );
        if (transferRes.success) {
          paystackOk = true;
          transferRef = transferRes.transferCode || transferRes.transferRef || "";
          console.log(`[Paystack] Transfer initiated for ${txSnapshot.id}: code=${transferRef} status=${transferRes.paystackStatus}`);
        } else {
          failureNote = `Transfer failed: ${transferRes.error}`;
        }
      }
    }

    // ── Update transaction with Paystack outcome ───────────────────────────────
    if (paystackOk) {
      // Paystack succeeded — mark as Paid, stamp completion time, save transfer ref.
      await pool.query(
        "UPDATE transactions SET status='Paid', paystack_transfer_ref=$1, completed_at=NOW(), rejection_reason=NULL WHERE id=$2",
        [transferRef || null, txSnapshot.id]
      );
    } else {
      // Paystack failed — keep status as Approved (awaiting payment).
      // Wallet remains deducted. Admin can: retry Paystack, mark paid manually, or reject & refund.
      console.error(`[Paystack] Transfer failed for tx ${txSnapshot.id}: ${failureNote}`);
      await pool.query(
        "UPDATE transactions SET status='Approved', rejection_reason=$1 WHERE id=$2",
        [failureNote, txSnapshot.id]
      );
    }

    const finalRow = await pool.query("SELECT * FROM transactions WHERE id=$1", [txSnapshot.id]);
    const finalTx = mapTransaction(finalRow.rows[0]);

    if (!paystackOk) {
      return res.status(200).json({
        success: false,
        transaction: finalTx,
        error: `Paystack transfer failed: ${failureNote}. Withdrawal moved to "Approved — Awaiting Payment". Retry, mark paid manually, or reject & refund the earner.`
      });
    }

    // Push: notify earner their withdrawal was paid
    if (paystackOk) {
      sendBrowserPushToUser(txSnapshot.userId, JSON.stringify({
        title: "💸 Withdrawal Payment Sent!",
        body: `Your withdrawal of ₦${txSnapshot.amount.toLocaleString()} has been processed and sent to your bank account.`,
        url: "/earner/wallet",
        tag: "tasksearn-account"
      })).catch(() => {});
    }

    res.json({ success: true, transaction: finalTx });
  } catch (err) {
    console.error("[Review withdrawal] error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Mark an approved withdrawal as Paid after a manual bank transfer (no Paystack call).
app.post("/api/admin/withdrawals/:id/mark-paid", async (req, res) => {
  try {
    const admin = await getAuthenticatedUser(req);
    if (!admin || admin.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const txRes = await pool.query(
      "SELECT * FROM transactions WHERE id=$1 AND type='Withdrawal'",
      [req.params.id]
    );
    if (txRes.rows.length === 0) return res.status(404).json({ error: "Withdrawal not found" });

    const tx = mapTransaction(txRes.rows[0]);
    if (tx.status !== TransactionStatus.APPROVED) {
      return res.status(400).json({ error: "Only withdrawals in Approved (Awaiting Payment) status can be marked as Paid" });
    }

    // Stamp completion time and record which admin confirmed the manual payment.
    await pool.query(
      "UPDATE transactions SET status='Paid', completed_at=NOW(), marked_by_admin_id=$1, rejection_reason=NULL WHERE id=$2",
      [admin.id, req.params.id]
    );

    console.log(`[Mark Paid] Withdrawal ${req.params.id} manually marked Paid by admin ${admin.name} (${admin.id})`);
    const updated = await pool.query("SELECT * FROM transactions WHERE id=$1", [req.params.id]);
    const paidTx = mapTransaction(updated.rows[0]);
    // Push: notify earner their withdrawal was manually marked as paid
    sendBrowserPushToUser(paidTx.userId, JSON.stringify({
      title: "💸 Withdrawal Payment Confirmed!",
      body: `Your withdrawal of ₦${paidTx.amount.toLocaleString()} has been confirmed as paid to your bank account.`,
      url: "/earner/wallet",
      tag: "tasksearn-account"
    })).catch(() => {});
    res.json({ success: true, transaction: paidTx });
  } catch (err) {
    console.error("[Mark paid] error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/deposits", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query("SELECT * FROM transactions WHERE type='Deposit' ORDER BY created_at DESC");
    res.json(result.rows.map(mapTransaction));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.get("/api/admin/referrals", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query("SELECT * FROM referrals ORDER BY created_at DESC");
    res.json(result.rows.map(r => ({
      id: r.id, referrerId: r.referrer_id, refereeId: r.referee_id,
      refereeName: r.referee_name, refereeEmail: r.referee_email,
      rewardEarned: parseFloat(r.reward_earned),
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
    })));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// Announcements
function mapAnnouncement(r: any) {
  return {
    id: r.id, title: r.title, content: r.content, type: r.type,
    enabled: r.enabled, dismissible: r.dismissible,
    linkUrl: r.link_url || null, buttonText: r.button_text || null,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at
  };
}

// Only allow http:// or https:// URLs to be saved as an announcement link.
// Returns the trimmed URL, or null if not provided, or throws if invalid.
function validateAnnouncementLink(linkUrl: unknown): string | null {
  if (linkUrl === undefined || linkUrl === null || linkUrl === "") return null;
  if (typeof linkUrl !== "string") throw new Error("Link URL must be text");
  const trimmed = linkUrl.trim();
  if (trimmed === "") return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Link URL must be a valid http:// or https:// URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Link URL must start with http:// or https://");
  }
  return trimmed;
}

app.get("/api/admin/announcements", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query("SELECT * FROM announcements ORDER BY created_at DESC");
    res.json(result.rows.map(mapAnnouncement));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/admin/announcements", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { title, content, type, dismissible, linkUrl, buttonText } = req.body;
    if (!title || !content) return res.status(400).json({ error: "Title and Content are required" });

    let validatedLink: string | null;
    try {
      validatedLink = validateAnnouncementLink(linkUrl);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
    const finalButtonText = validatedLink ? (buttonText && String(buttonText).trim() ? String(buttonText).trim() : "Learn More") : null;

    const id = "ann-" + Math.random().toString(36).substr(2, 9);
    const result = await pool.query(
      `INSERT INTO announcements (id, title, content, type, enabled, dismissible, link_url, button_text, created_at)
       VALUES ($1,$2,$3,$4,true,$5,$6,$7,$8) RETURNING *`,
      [id, title, content, type || "info", dismissible !== false, validatedLink, finalButtonText, new Date()]
    );
    const ann = mapAnnouncement(result.rows[0]);
    // Fire-and-forget browser push to all earners about the new announcement
    const pushPayload = JSON.stringify({
      title: "📢 New Announcement from TasksEarn",
      body: ann.title,
      url: "/earner/notifications",
      tag: "tasksearn-announcement"
    });
    sendBrowserPushToAllEarners(pushPayload)
      .then((sent) => { if (sent > 0) console.log(`[Push] Announcement push sent to ${sent} subscriber(s): "${ann.title}"`); })
      .catch(() => {});
    res.json({ success: true, announcement: ann });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.put("/api/admin/announcements/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { title, content, type, dismissible, linkUrl, buttonText } = req.body;
    if (!title || !content) return res.status(400).json({ error: "Title and Content are required" });

    let validatedLink: string | null;
    try {
      validatedLink = validateAnnouncementLink(linkUrl);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
    const finalButtonText = validatedLink ? (buttonText && String(buttonText).trim() ? String(buttonText).trim() : "Learn More") : null;

    const result = await pool.query(
      `UPDATE announcements SET title=$1, content=$2, type=$3, dismissible=$4, link_url=$5, button_text=$6, updated_at=$7 WHERE id=$8 RETURNING *`,
      [title, content, type || "info", dismissible !== false, validatedLink, finalButtonText, new Date(), req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Announcement not found" });

    res.json({ success: true, announcement: mapAnnouncement(result.rows[0]) });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.put("/api/admin/announcements/:id/toggle", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query(
      "UPDATE announcements SET enabled = NOT enabled, updated_at = $1 WHERE id=$2 RETURNING *",
      [new Date(), req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Announcement not found" });

    res.json({ success: true, announcement: mapAnnouncement(result.rows[0]) });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.delete("/api/admin/announcements/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query("DELETE FROM announcements WHERE id=$1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Announcement not found" });

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// Banners
app.get("/api/admin/banners", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query("SELECT * FROM banners ORDER BY id");
    res.json(result.rows.map(r => ({ id: r.id, title: r.title, imageUrl: r.image_url, link: r.link, active: r.active })));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/admin/banners", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { title, imageUrl, link } = req.body;
    if (!title || !imageUrl) return res.status(400).json({ error: "Title and Image URL are required" });

    const id = "ban-" + Math.random().toString(36).substr(2, 9);
    await pool.query("INSERT INTO banners (id, title, image_url, link, active) VALUES ($1,$2,$3,$4,true)", [id, title, imageUrl, link || ""]);
    res.json({ success: true, banner: { id, title, imageUrl, link: link || "", active: true } });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.put("/api/admin/banners/:id/toggle", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query("UPDATE banners SET active = NOT active WHERE id=$1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Banner not found" });

    const r = result.rows[0];
    res.json({ success: true, banner: { id: r.id, title: r.title, imageUrl: r.image_url, link: r.link, active: r.active } });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.delete("/api/admin/banners/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query("DELETE FROM banners WHERE id=$1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Banner not found" });

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// Pages
app.put("/api/admin/pages/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const pageId = req.params.id;
    const { title, content } = req.body;

    const existing = await pool.query("SELECT id FROM pages WHERE id=$1", [pageId]);
    if (existing.rows.length === 0) {
      await pool.query("INSERT INTO pages (id, title, content) VALUES ($1,$2,$3)", [pageId, title || "", content || ""]);
    } else {
      const updates: string[] = [];
      const params: any[] = [];
      let idx = 1;
      if (title) { updates.push(`title=$${idx++}`); params.push(title); }
      if (content) { updates.push(`content=$${idx++}`); params.push(content); }
      if (updates.length > 0) {
        params.push(pageId);
        await pool.query(`UPDATE pages SET ${updates.join(",")} WHERE id=$${idx}`, params);
      }
    }

    const updated = await pool.query("SELECT * FROM pages WHERE id=$1", [pageId]);
    res.json({ success: true, page: updated.rows[0] ? { title: updated.rows[0].title, content: updated.rows[0].content } : {} });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// Settings
app.get("/api/admin/settings", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    res.json(await getSettings());
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.put("/api/admin/settings", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { platformName, referralReward, withdrawalFee, minWithdrawal, minDeposit, contactEmail, contactPhone, telegramChannel, whatsappGroup } = req.body;

    await pool.query(`
      UPDATE settings SET
        platform_name = COALESCE($1, platform_name),
        referral_reward = COALESCE($2, referral_reward),
        withdrawal_fee = COALESCE($3, withdrawal_fee),
        min_withdrawal = COALESCE($4, min_withdrawal),
        min_deposit = COALESCE($5, min_deposit),
        contact_email = COALESCE($6, contact_email),
        contact_phone = COALESCE($7, contact_phone),
        telegram_channel = COALESCE($8, telegram_channel),
        whatsapp_group = COALESCE($9, whatsapp_group)
      WHERE id = (SELECT id FROM settings ORDER BY id ASC LIMIT 1)
    `, [
      platformName || null,
      referralReward !== undefined ? parseFloat(referralReward) : null,
      withdrawalFee !== undefined ? parseFloat(withdrawalFee) : null,
      minWithdrawal !== undefined ? parseFloat(minWithdrawal) : null,
      minDeposit !== undefined ? parseFloat(minDeposit) : null,
      contactEmail || null, contactPhone || null,
      telegramChannel !== undefined ? telegramChannel : null,
      whatsappGroup !== undefined ? whatsappGroup : null
    ]);

    res.json({ success: true, settings: await getSettings() });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// Reset the "Total Advertiser Deposits" dashboard statistic back to ₦0.00.
// This is a display-only adjustment: it stores an offset that is subtracted
// from the live SUM(amount) of successful deposit transactions when rendering
// the admin dashboard. It never deletes/modifies transaction rows, advertiser
// accounts, or wallet balances — admin-only.
app.post("/api/admin/reset-deposit-stat", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const totalDep = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE type='Deposit' AND status='Success'");
    const currentLiveTotal = parseFloat(totalDep.rows[0].total) || 0;

    await pool.query(`
      UPDATE settings SET deposit_stat_offset = $1
      WHERE id = (SELECT id FROM settings ORDER BY id ASC LIMIT 1)
    `, [currentLiveTotal]);

    console.log(`[Admin] Total Advertiser Deposits dashboard stat reset to ₦0.00 by admin ${user.id} (${user.email}). Offset set to ₦${currentLiveTotal.toFixed(2)}. No transactions were modified.`);

    res.json({ success: true, totalDeposited: 0 });
  } catch (err) {
    console.error("Reset deposit stat error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Task Pricing
app.get("/api/admin/task-pricing", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query("SELECT * FROM task_pricing ORDER BY id");
    res.json(result.rows.map(mapPricing));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.put("/api/admin/task-pricing", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { pricing } = req.body;
    if (!pricing || !Array.isArray(pricing)) return res.status(400).json({ error: "Invalid pricing array" });

    for (const p of pricing) {
      await pool.query(`
        INSERT INTO task_pricing (id, platform, cost_per_slot, earning_per_slot)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (id) DO UPDATE SET platform=EXCLUDED.platform, cost_per_slot=EXCLUDED.cost_per_slot, earning_per_slot=EXCLUDED.earning_per_slot
      `, [p.id, p.platform, p.costPerSlot, p.earningPerSlot]);
    }

    const result = await pool.query("SELECT * FROM task_pricing ORDER BY id");
    res.json({ success: true, pricing: result.rows.map(mapPricing) });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// ─── Owner Earnings API ───────────────────────────────────────────────────────

async function getPlatformRevenueStats() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  // All commission data sourced from the persistent admin_commissions table
  const commRes = await pool.query("SELECT type, amount, created_at FROM admin_commissions");

  let lifetimeRevenue = 0, todayRevenue = 0, thisMonthRevenue = 0;
  let totalActivationFees = 0, totalTaskCommission = 0, totalWithdrawalFees = 0, activatedEarnersCount = 0;

  for (const row of commRes.rows) {
    const amount = parseFloat(row.amount) || 0;
    lifetimeRevenue += amount;
    const t = new Date(row.created_at).getTime();
    if (t >= startOfToday) todayRevenue += amount;
    if (t >= startOfThisMonth) thisMonthRevenue += amount;

    switch (row.type) {
      case "activation_fee":  totalActivationFees += amount; activatedEarnersCount++; break;
      case "task_commission": totalTaskCommission += amount; break;
      case "withdrawal_fee":  totalWithdrawalFees += amount; break;
    }
  }

  const ownerWds = await pool.query("SELECT amount, status FROM owner_withdrawals");
  let totalWithdrawn = 0, pendingWithdrawalAmount = 0;
  for (const row of ownerWds.rows) {
    if (["Approved", "Success"].includes(row.status)) totalWithdrawn += parseFloat(row.amount);
    if (row.status === "Pending") pendingWithdrawalAmount += parseFloat(row.amount);
  }

  const availableBalance = Math.max(0, lifetimeRevenue - totalWithdrawn - pendingWithdrawalAmount);

  return {
    lifetimeRevenue,
    totalPlatformRevenue: lifetimeRevenue,
    todayRevenue,
    thisMonthRevenue,
    totalWithdrawn,
    pendingWithdrawalAmount,
    availableBalance,
    totalActivationFees,
    totalCommission: totalTaskCommission,
    totalWithdrawalFees,
    activatedEarnersCount
  };
}

app.get("/api/admin/owner-earnings/stats", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    res.json(await getPlatformRevenueStats());
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// ─── Admin Commission Ledger ──────────────────────────────────────────────────

app.get("/api/admin/commissions", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query("SELECT * FROM admin_commissions ORDER BY created_at DESC LIMIT 500");
    res.json(result.rows.map(row => ({
      id: row.id,
      type: row.type,
      amount: parseFloat(row.amount),
      description: row.description,
      reference: row.reference,
      userId: row.user_id,
      userName: row.user_name,
      relatedTransactionRef: row.related_transaction_ref,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
    })));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.get("/api/admin/owner-earnings/bank-accounts", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query("SELECT * FROM owner_bank_accounts ORDER BY id");
    res.json(result.rows.map(mapOwnerBankAccount));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/admin/owner-earnings/bank-accounts", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { bankName, accountNumber, accountName, isDefault } = req.body;
    if (!bankName || !accountNumber || !accountName) return res.status(400).json({ error: "All bank account details are required" });

    const count = await pool.query("SELECT COUNT(*) FROM owner_bank_accounts");
    const shouldBeDefault = isDefault || parseInt(count.rows[0].count) === 0;

    if (shouldBeDefault) {
      await pool.query("UPDATE owner_bank_accounts SET is_default = false");
    }

    const id = "ba-" + Math.random().toString(36).substr(2, 9);
    await pool.query(
      "INSERT INTO owner_bank_accounts (id, bank_name, account_number, account_name, is_default) VALUES ($1,$2,$3,$4,$5)",
      [id, bankName, accountNumber, accountName, shouldBeDefault]
    );

    res.json({ id, bankName, accountNumber, accountName, isDefault: shouldBeDefault });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.put("/api/admin/owner-earnings/bank-accounts/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { bankName, accountNumber, accountName, isDefault } = req.body;
    const { id } = req.params;

    if (isDefault) await pool.query("UPDATE owner_bank_accounts SET is_default = false");

    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (bankName) { updates.push(`bank_name=$${idx++}`); params.push(bankName); }
    if (accountNumber) { updates.push(`account_number=$${idx++}`); params.push(accountNumber); }
    if (accountName) { updates.push(`account_name=$${idx++}`); params.push(accountName); }
    if (isDefault !== undefined) { updates.push(`is_default=$${idx++}`); params.push(isDefault); }

    if (updates.length > 0) {
      params.push(id);
      await pool.query(`UPDATE owner_bank_accounts SET ${updates.join(",")} WHERE id=$${idx}`, params);
    }

    const result = await pool.query("SELECT * FROM owner_bank_accounts WHERE id=$1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Bank account not found" });

    res.json(mapOwnerBankAccount(result.rows[0]));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.delete("/api/admin/owner-earnings/bank-accounts/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { id } = req.params;
    const existing = await pool.query("SELECT * FROM owner_bank_accounts WHERE id=$1", [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: "Bank account not found" });

    const wasDefault = existing.rows[0].is_default;
    await pool.query("DELETE FROM owner_bank_accounts WHERE id=$1", [id]);

    if (wasDefault) {
      await pool.query("UPDATE owner_bank_accounts SET is_default=true WHERE id=(SELECT id FROM owner_bank_accounts LIMIT 1)");
    }

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/admin/owner-earnings/bank-accounts/:id/default", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { id } = req.params;
    await pool.query("UPDATE owner_bank_accounts SET is_default = false");
    const result = await pool.query("UPDATE owner_bank_accounts SET is_default = true WHERE id=$1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Bank account not found" });

    res.json({ success: true, account: mapOwnerBankAccount(result.rows[0]) });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.get("/api/admin/owner-earnings/banks", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (paystackKey) {
      try {
        const response = await fetch("https://api.paystack.co/bank?country=nigeria", {
          headers: { "Authorization": `Bearer ${paystackKey}` }
        });
        const data: any = await response.json();
        if (data?.status && data?.data) {
          return res.json(data.data.map((b: any) => ({ name: b.name, code: b.code })).sort((a: any, b: any) => a.name.localeCompare(b.name)));
        }
      } catch {}
    }

    res.json([
      { name: "Access Bank", code: "044" }, { name: "Ecobank Nigeria", code: "050" },
      { name: "Fidelity Bank", code: "070" }, { name: "First Bank of Nigeria", code: "011" },
      { name: "First City Monument Bank (FCMB)", code: "214" }, { name: "Guaranty Trust Bank (GTB)", code: "058" },
      { name: "Keystone Bank", code: "082" }, { name: "Kuda Bank", code: "50211" },
      { name: "Moniepoint Microfinance Bank", code: "50515" }, { name: "OPay Microfinance Bank", code: "999992" },
      { name: "PalmPay Microfinance Bank", code: "999991" }, { name: "Polaris Bank", code: "076" },
      { name: "Providus Bank", code: "101" }, { name: "Stanbic IBTC Bank", code: "221" },
      { name: "Sterling Bank", code: "232" }, { name: "Union Bank of Nigeria", code: "032" },
      { name: "United Bank for Africa (UBA)", code: "033" }, { name: "Unity Bank", code: "215" },
      { name: "Wema Bank", code: "035" }, { name: "Zenith Bank", code: "057" }
    ]);
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/admin/owner-earnings/resolve-bank", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { accountNumber, bankCode, bankName } = req.body;
    if (!accountNumber || !bankCode) return res.status(400).json({ error: "Account number and bank are required" });
    if (accountNumber.length !== 10 || !/^\d+$/.test(accountNumber)) return res.status(400).json({ error: "Account number must be exactly 10 digits" });

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) {
      return res.json({ success: true, accountName: `Verified Owner Account (${bankName || "Commercial Bank"})`, isSimulated: true });
    }

    const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
      headers: { "Authorization": `Bearer ${paystackKey}` }
    });
    const data: any = await response.json();
    if (data?.status && data?.data) {
      return res.json({ success: true, accountName: data.data.account_name, accountNumber: data.data.account_number, bankCode });
    }
    return res.status(400).json({ error: data.message || "Could not resolve bank account." });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.get("/api/admin/owner-earnings/withdrawals", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query("SELECT * FROM owner_withdrawals ORDER BY submitted_at DESC");
    res.json(result.rows.map(mapOwnerWithdrawal));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/admin/owner-earnings/withdraw", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { amount, bankAccountId } = req.body;
    if (!amount || !bankAccountId) return res.status(400).json({ error: "Amount and bank account selection are required" });

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) return res.status(400).json({ error: "Please enter a valid positive withdrawal amount" });

    const accountRes = await pool.query("SELECT * FROM owner_bank_accounts WHERE id=$1", [bankAccountId]);
    if (accountRes.rows.length === 0) return res.status(400).json({ error: "Selected bank account is invalid" });

    const account = mapOwnerBankAccount(accountRes.rows[0]);
    const stats = await getPlatformRevenueStats();
    if (stats.availableBalance < withdrawAmount) {
      return res.status(400).json({ error: `Insufficient balance. Maximum: ₦${stats.availableBalance.toLocaleString()}` });
    }

    const id = "own-wd-" + Math.random().toString(36).substr(2, 9);
    const reference = "OWN-PAY-" + Math.floor(10000000 + Math.random() * 90000000);

    await pool.query(`
      INSERT INTO owner_withdrawals (id, amount, bank_account_id, bank_name, account_number, account_name, reference, status, submitted_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'Pending',$8)
    `, [id, withdrawAmount, bankAccountId, account.bankName, account.accountNumber, account.accountName, reference, new Date()]);

    const result = await pool.query("SELECT * FROM owner_withdrawals WHERE id=$1", [id]);
    res.json({ success: true, withdrawal: mapOwnerWithdrawal(result.rows[0]) });
  } catch (err) {
    console.error("Owner withdraw error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/admin/owner-earnings/withdrawals/:id/status", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query("UPDATE owner_withdrawals SET status=$1 WHERE id=$2 RETURNING *", [status, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Withdrawal not found" });

    res.json({ success: true, withdrawal: mapOwnerWithdrawal(result.rows[0]) });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// ─── Notifications API ────────────────────────────────────────────────────────

app.get("/api/admin/notifications", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100");
    res.json(result.rows.map(mapNotification));
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/admin/notifications/read-all", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    await pool.query("UPDATE notifications SET read = true");
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/admin/notifications/:id/read", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query("UPDATE notifications SET read=true WHERE id=$1 RETURNING *", [req.params.id]);
    res.json({ success: true, notification: result.rows.length > 0 ? mapNotification(result.rows[0]) : null });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// ─── Broadcast Email ─────────────────────────────────────────────────────────

app.get("/api/admin/broadcast-email/logs", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const result = await pool.query(
      "SELECT * FROM broadcast_email_logs ORDER BY created_at DESC LIMIT 50"
    );
    res.json(result.rows.map(r => ({
      id: r.id,
      adminId: r.admin_id,
      subject: r.subject,
      target: r.target,
      totalRecipients: r.total_recipients,
      sentCount: r.sent_count,
      failedCount: r.failed_count,
      retriedCount: Number(r.retried_count ?? 0),
      failedEmails: r.failed_emails,
      createdAt: r.created_at,
    })));
  } catch (err) {
    console.error("Broadcast logs error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Email History (view-once, auto-clean) ────────────────────────────────────

// GET /api/admin/email-history
// On each call: delete already-viewed records, then return all remaining ones.
app.get("/api/admin/email-history", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    // Only return records that have NOT been viewed yet.
    // Viewed records are excluded from this view on every subsequent load,
    // giving the "auto-disappear after viewing" UX without destroying data.
    const result = await pool.query(
      "SELECT id, admin_id, subject, html_content, target, total_recipients, sent_count, failed_count, retried_count, status, viewed, created_at FROM broadcast_email_logs WHERE viewed = FALSE ORDER BY created_at DESC"
    );
    res.json(result.rows.map(r => ({
      id: r.id,
      adminId: r.admin_id,
      subject: r.subject,
      htmlContent: r.html_content,
      target: r.target,
      totalRecipients: r.total_recipients,
      sentCount: r.sent_count,
      failedCount: r.failed_count,
      retriedCount: Number(r.retried_count ?? 0),
      status: r.status || "Completed",
      viewed: r.viewed,
      createdAt: r.created_at,
    })));
  } catch (err) {
    console.error("Email history error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/email-history/:id
// Returns full detail (sent_emails + failed_emails) and marks the record as viewed.
app.get("/api/admin/email-history/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM broadcast_email_logs WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Record not found" });

    // Mark as viewed
    await pool.query("UPDATE broadcast_email_logs SET viewed = TRUE WHERE id = $1", [id]);

    const r = result.rows[0];
    res.json({
      id: r.id,
      adminId: r.admin_id,
      subject: r.subject,
      htmlContent: r.html_content,
      target: r.target,
      totalRecipients: r.total_recipients,
      sentCount: r.sent_count,
      failedCount: r.failed_count,
      retriedCount: Number(r.retried_count ?? 0),
      status: r.status || "Completed",
      viewed: true,
      createdAt: r.created_at,
      sentEmails: Array.isArray(r.sent_emails) ? r.sent_emails : [],
      failedEmails: Array.isArray(r.failed_emails) ? r.failed_emails : [],
    });
  } catch (err) {
    console.error("Email history detail error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/admin/broadcast-email", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

    const { target, userIds, subject, html } = req.body as {
      target: "earners" | "advertisers" | "all" | "selected";
      userIds?: string[];
      subject: string;
      html: string;
    };

    if (!subject?.trim()) return res.status(400).json({ error: "Subject is required" });
    if (!html?.trim()) return res.status(400).json({ error: "Email body is required" });
    if (!["earners", "advertisers", "all", "selected"].includes(target))
      return res.status(400).json({ error: "Invalid target" });

    // Fetch recipients
    let recipientRows: { id: string; email: string; name: string }[] = [];

    if (target === "selected") {
      if (!userIds || userIds.length === 0) return res.status(400).json({ error: "No users selected" });
      const result = await pool.query(
        "SELECT id, email, name FROM users WHERE id = ANY($1::text[]) AND email IS NOT NULL",
        [userIds]
      );
      recipientRows = result.rows;
    } else if (target === "earners") {
      const result = await pool.query(
        "SELECT id, email, name FROM users WHERE role = 'Earner' AND email IS NOT NULL ORDER BY created_at DESC"
      );
      recipientRows = result.rows;
    } else if (target === "advertisers") {
      const result = await pool.query(
        "SELECT id, email, name FROM users WHERE role = 'Advertiser' AND email IS NOT NULL ORDER BY created_at DESC"
      );
      recipientRows = result.rows;
    } else {
      // all (non-admin)
      const result = await pool.query(
        "SELECT id, email, name FROM users WHERE role != 'Admin' AND email IS NOT NULL ORDER BY created_at DESC"
      );
      recipientRows = result.rows;
    }

    if (recipientRows.length === 0) {
      return res.status(400).json({ error: "No recipients found for the selected target" });
    }

    const sentEmails: string[] = [];
    const failedEmails: { email: string; reason: string }[] = [];
    let retriedCount = 0;

    for (let i = 0; i < recipientRows.length; i += BROADCAST_BATCH_SIZE) {
      const batch = recipientRows.slice(i, i + BROADCAST_BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(recipient => sendBroadcastRecipientWithRetry({
          to: recipient.email,
          subject,
          html,
        }))
      );

      for (const result of batchResults) {
        retriedCount += result.retries;
        if (result.delivered) {
          sentEmails.push(result.email);
        } else {
          failedEmails.push({ email: result.email, reason: result.reason || "Unknown error" });
        }
      }

      // Keep a full two seconds between batches to avoid Resend rate limits.
      if (i + BROADCAST_BATCH_SIZE < recipientRows.length) {
        await wait(BROADCAST_BATCH_DELAY_MS);
      }
    }

    // Log the broadcast
    const broadcastStatus = failedEmails.length === 0 ? "Completed" : sentEmails.length === 0 ? "Failed" : "Partial";
    await pool.query(
      `INSERT INTO broadcast_email_logs (admin_id, subject, html_content, target, total_recipients, sent_count, failed_count, retried_count, sent_emails, failed_emails, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [user.id, subject, html, target, recipientRows.length, sentEmails.length, failedEmails.length, retriedCount, JSON.stringify(sentEmails), JSON.stringify(failedEmails), broadcastStatus]
    );

    res.json({
      success: true,
      totalRecipients: recipientRows.length,
      sentCount: sentEmails.length,
      failedCount: failedEmails.length,
      retriedCount,
      failedEmails,
    });
  } catch (err) {
    console.error("Broadcast email error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── WebSocket & Notification Broadcasting ────────────────────────────────────

const server = createHttpServer(app);
const wss = new WebSocketServer({ noServer: true });
const adminClients = new Set<WebSocket>();
// earnerWsClients maps each connected earner WS to their userId
const earnerWsClients = new Map<WebSocket, string>();

wss.on("connection", (ws) => {
  console.log("[WS] Client connected");

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "register-admin") {
        adminClients.add(ws);
        console.log("[WS] Admin client registered");
        const unread = await pool.query("SELECT * FROM notifications WHERE read=false ORDER BY created_at DESC LIMIT 100");
        const all = await pool.query("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100");
        ws.send(JSON.stringify({
          type: "init-unread",
          count: unread.rows.length,
          notifications: all.rows.map(mapNotification)
        }));
      }

      if (data.type === "register-earner" && data.userId) {
        earnerWsClients.set(ws, data.userId);
        console.log(`[WS] Earner client registered: ${data.userId}`);
        const unread = await pool.query(
          "SELECT COUNT(*) FROM earner_notifications WHERE earner_id=$1 AND read=false",
          [data.userId]
        );
        ws.send(JSON.stringify({
          type: "earner-init",
          unreadCount: parseInt(unread.rows[0].count)
        }));
      }
    } catch (e) {
      console.error("[WS] Error:", e);
    }
  });

  ws.on("close", () => {
    adminClients.delete(ws);
    earnerWsClients.delete(ws);
  });
  ws.on("error", () => {
    adminClients.delete(ws);
    earnerWsClients.delete(ws);
  });
});

server.on("upgrade", (request, socket, head) => {
  const { pathname } = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
  if (pathname === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => wss.emit("connection", ws, request));
  }
});

// ─── Browser Push Helper ──────────────────────────────────────────────────────

/**
 * Sends a Web Push notification to every earner with an active subscription.
 * Returns the count of successful deliveries.
 */
async function sendBrowserPushToAllEarners(payloadJson: string): Promise<number> {
  if (!vapidPublicKey || !vapidPrivateKey) return 0;

  let sent = 0;
  try {
    const result = await pool.query(
      "SELECT id, user_id, endpoint, p256dh_key, auth_key FROM notification_subscriptions WHERE active=true"
    );

    for (const row of result.rows) {
      const pushSubscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh_key, auth: row.auth_key }
      };
      try {
        await webpush.sendNotification(pushSubscription, payloadJson, {
          TTL: 86400 // deliver within 24 hours even if browser is offline
        });
        sent++;
      } catch (pushErr: any) {
        // 410 Gone or 404 means the subscription is no longer valid
        if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
          await pool.query(
            "UPDATE notification_subscriptions SET active=false, updated_at=NOW() WHERE id=$1",
            [row.id]
          );
          console.log(`[Push] Invalidated stale subscription ${row.id} for user ${row.user_id}`);
        } else {
          console.error(`[Push] Failed to send to ${row.user_id}:`, pushErr.message || pushErr);
        }
      }
    }
  } catch (err) {
    console.error("[Push] Error fetching subscriptions:", err);
  }
  return sent;
}

// ─── Per-User Browser Push Helper ─────────────────────────────────────────────

/**
 * Sends a Web Push notification to a single user by userId.
 * Silently invalidates stale subscriptions (410/404).
 */
async function sendBrowserPushToUser(userId: string, payloadJson: string): Promise<void> {
  if (!vapidPublicKey || !vapidPrivateKey) return;
  try {
    const result = await pool.query(
      "SELECT id, endpoint, p256dh_key, auth_key FROM notification_subscriptions WHERE user_id=$1 AND active=true",
      [userId]
    );
    for (const row of result.rows) {
      const pushSubscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh_key, auth: row.auth_key }
      };
      try {
        await webpush.sendNotification(pushSubscription, payloadJson, { TTL: 86400 });
      } catch (pushErr: any) {
        if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
          await pool.query(
            "UPDATE notification_subscriptions SET active=false, updated_at=NOW() WHERE id=$1",
            [row.id]
          );
        }
      }
    }
  } catch (err) {
    console.error("[Push] sendBrowserPushToUser error:", err);
  }
}

// ─── Earner Notification Broadcasting ────────────────────────────────────────

/**
 * Dedup guard — prevents the same task triggering multiple push blasts
 * (e.g. if the publish endpoint is accidentally called twice).
 * Entries are evicted after 24 h to avoid unbounded memory growth.
 */
const _pushedTaskIds = new Map<string, number>(); // taskId → timestamp
function _markTaskPushed(taskId: string): boolean {
  const now = Date.now();
  // Evict entries older than 24 h
  for (const [id, ts] of _pushedTaskIds) {
    if (now - ts > 86_400_000) _pushedTaskIds.delete(id);
  }
  if (_pushedTaskIds.has(taskId)) return false; // already sent
  _pushedTaskIds.set(taskId, now);
  return true;
}

async function notifyEarners(task: { id: string; title: string; category: string; earningPerSlot: number }) {
  try {
    const platform = getPlatformForCategory(task.category as TaskCategory);
    const message = `🔔 New task available! "${task.title}" — Earn ₦${task.earningPerSlot.toLocaleString()} on ${platform}. Complete it now!`;
    const now = new Date();

    // Fetch all non-admin user IDs (unified — all users can earn)
    const earnersRes = await pool.query("SELECT id FROM users WHERE role != 'Admin' AND is_verified = true");
    if (earnersRes.rows.length === 0) return;

    // Bulk-insert notifications (ON CONFLICT DO NOTHING prevents duplicates)
    for (const earner of earnersRes.rows) {
      const nid = "en-" + Math.random().toString(36).substr(2, 9);
      await pool.query(
        `INSERT INTO earner_notifications (id, earner_id, task_id, task_title, platform, category, reward, message, read, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,$9)
         ON CONFLICT (earner_id, task_id) DO NOTHING`,
        [nid, earner.id, task.id, task.title, platform, task.category, task.earningPerSlot, message, now]
      );
    }

    // Broadcast via WebSocket to all connected earner clients
    const broadcastPayload = JSON.stringify({
      type: "earner-new-task",
      notification: {
        taskId: task.id,
        taskTitle: task.title,
        platform,
        category: task.category,
        reward: task.earningPerSlot,
        message,
        createdAt: now.toISOString(),
        read: false
      }
    });

    earnerWsClients.forEach((userId, client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(broadcastPayload);
      }
    });

    // Send browser push notifications — deduped per task ID
    if (_markTaskPushed(task.id)) {
      const pushPayload = JSON.stringify({
        title: "📢 New Task Available",
        body: "A new task has been posted. Tap to start earning now!",
        icon: "/icon-192.png",
        badge: "/icon-72.png",
        url: "https://tasksearn.name.ng/tasks",
        tag: "tasksearn-new-task"
      });
      sendBrowserPushToAllEarners(pushPayload)
        .then((sent) => {
          if (sent > 0) console.log(`[Push] Sent browser push to ${sent} subscriber(s) for task: ${task.title}`);
        })
        .catch(() => {});
    } else {
      console.log(`[Push] Skipping duplicate push for task: ${task.id}`);
    }

    console.log(`[Earner Notify] Notified ${earnersRes.rows.length} earner(s) about task: ${task.title}`);
  } catch (err) {
    console.error("[Earner Notify] Failed:", err);
  }
}

async function notifyAdmin(notification: { type: "submission" | "withdrawal" | "deposit"; message: string; referenceId: string }) {
  const id = "notif-" + Math.random().toString(36).substr(2, 9);
  const now = new Date();

  try {
    await pool.query(
      "INSERT INTO notifications (id, type, message, reference_id, read, created_at) VALUES ($1,$2,$3,$4,false,$5)",
      [id, notification.type, notification.message, notification.referenceId, now]
    );
    // Keep only last 100 notifications
    await pool.query("DELETE FROM notifications WHERE id NOT IN (SELECT id FROM notifications ORDER BY created_at DESC LIMIT 100)");
  } catch (err) {
    console.error("[Notify] Failed to persist notification:", err);
  }

  const newNotif: AdminNotification = {
    id, type: notification.type, message: notification.message,
    referenceId: notification.referenceId, createdAt: now.toISOString(), read: false
  };

  const payload = JSON.stringify({ type: "notification", notification: newNotif });
  adminClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  });
}

// ─── Vite / Static Server ─────────────────────────────────────────────────────

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[TasksEarn Server] PostgreSQL mode — running on http://0.0.0.0:${PORT}`);

    const resendKey = process.env.RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST;
    console.log("=".repeat(60));
    console.log("[Email Config]");
    if (resendKey) console.log("-> Resend: CONFIGURED");
    else if (smtpHost) console.log(`-> SMTP: CONFIGURED (${smtpHost})`);
    else console.log("-> No email provider configured (optional)");
    console.log("=".repeat(60));
  });
}

// ─── VAPID Key Management ─────────────────────────────────────────────────────

/**
 * Loads or auto-generates the VAPID keypair.
 * Keys are stored in the `vapid_keys` database table — never in env vars or config files.
 * The private key is readable only via a direct database connection; it never
 * appears in source code, `.replit`, or any committed file.
 */
async function ensureVapidKeys() {
  const result = await pool.query("SELECT key, value FROM vapid_keys");
  const keyMap: Record<string, string> = {};
  for (const row of result.rows) keyMap[row.key] = row.value;

  if (keyMap["public"] && keyMap["private"]) {
    vapidPublicKey = keyMap["public"];
    vapidPrivateKey = keyMap["private"];
    webpush.setVapidDetails(VAPID_SUBJECT, vapidPublicKey, vapidPrivateKey);
    console.log("[Push] VAPID keys loaded from database — push notifications enabled.");
  } else {
    // First boot: generate a fresh keypair and persist it
    const keys = webpush.generateVAPIDKeys();
    vapidPublicKey = keys.publicKey;
    vapidPrivateKey = keys.privateKey;
    await pool.query(`
      INSERT INTO vapid_keys (key, value) VALUES ('public', $1), ('private', $2)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [vapidPublicKey, vapidPrivateKey]);
    webpush.setVapidDetails(VAPID_SUBJECT, vapidPublicKey, vapidPrivateKey);
    console.log("[Push] Generated new VAPID keypair and stored in database.");
  }
}

// ─── Bootstrap & Start ────────────────────────────────────────────────────────

(async () => {
  try {
    await bootstrapTables();
    await seedDatabase();
    await ensurePlatformsSeeded();
    await ensureVapidKeys();
    await sweepOrphanedProofScreenshots();
    await startServer();
  } catch (err) {
    console.error("FATAL: Failed to start server:", err);
    process.exit(1);
  }
})();
