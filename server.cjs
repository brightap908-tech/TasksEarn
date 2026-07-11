var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_pg = __toESM(require("pg"), 1);
var import_resend = require("resend");
var import_nodemailer = __toESM(require("nodemailer"), 1);
var import_vite = require("vite");
var import_http = require("http");
var import_ws = require("ws");

// src/types.ts
var Platform = /* @__PURE__ */ ((Platform2) => {
  Platform2["INSTAGRAM"] = "Instagram";
  Platform2["FACEBOOK"] = "Facebook";
  Platform2["TIKTOK"] = "TikTok";
  Platform2["YOUTUBE"] = "YouTube";
  Platform2["X_TWITTER"] = "X (Twitter)";
  Platform2["TELEGRAM"] = "Telegram";
  Platform2["WHATSAPP"] = "WhatsApp";
  Platform2["SNAPCHAT"] = "Snapchat";
  Platform2["LINKEDIN"] = "LinkedIn";
  Platform2["THREADS"] = "Threads";
  Platform2["PINTEREST"] = "Pinterest";
  Platform2["REDDIT"] = "Reddit";
  Platform2["DISCORD"] = "Discord";
  Platform2["MESSENGER"] = "Messenger (Facebook Messenger)";
  Platform2["KWAI"] = "Kwai";
  Platform2["LIKEE"] = "Likee";
  Platform2["CUSTOM"] = "Custom Tasks";
  return Platform2;
})(Platform || {});
function getPlatformForCategory(category) {
  switch (category) {
    case "Facebook Like" /* FB_LIKE */:
    case "Facebook Follow" /* FB_FOLLOW */:
    case "Facebook Share" /* FB_SHARE */:
    case "Facebook Comment" /* FB_COMMENT */:
      return "Facebook" /* FACEBOOK */;
    case "Instagram Like" /* IG_LIKE */:
    case "Instagram Follow" /* IG_FOLLOW */:
      return "Instagram" /* INSTAGRAM */;
    case "TikTok Like" /* TIKTOK_LIKE */:
    case "TikTok Follow" /* TIKTOK_FOLLOW */:
    case "TikTok Comment" /* TIKTOK_COMMENT */:
      return "TikTok" /* TIKTOK */;
    case "YouTube Subscribe" /* YT_SUBSCRIBE */:
    case "YouTube Like" /* YT_LIKE */:
    case "YouTube Watch" /* YT_WATCH */:
      return "YouTube" /* YOUTUBE */;
    case "X (Twitter) Follow" /* X_FOLLOW */:
      return "X (Twitter)" /* X_TWITTER */;
    case "Telegram Join" /* TELEGRAM_JOIN */:
      return "Telegram" /* TELEGRAM */;
    case "WhatsApp Join" /* WHATSAPP_JOIN */:
      return "WhatsApp" /* WHATSAPP */;
    case "Snapchat Add/Follow" /* SNAPCHAT_ADD */:
      return "Snapchat" /* SNAPCHAT */;
    case "LinkedIn Follow/Connect" /* LINKEDIN_FOLLOW */:
      return "LinkedIn" /* LINKEDIN */;
    case "Threads Follow" /* THREADS_FOLLOW */:
      return "Threads" /* THREADS */;
    case "Pinterest Follow" /* PINTEREST_FOLLOW */:
      return "Pinterest" /* PINTEREST */;
    case "Reddit Join" /* REDDIT_JOIN */:
      return "Reddit" /* REDDIT */;
    case "Discord Join" /* DISCORD_JOIN */:
      return "Discord" /* DISCORD */;
    case "Messenger Chat" /* MESSENGER_CHAT */:
      return "Messenger (Facebook Messenger)" /* MESSENGER */;
    case "Kwai Follow" /* KWAI_FOLLOW */:
      return "Kwai" /* KWAI */;
    case "Likee Follow" /* LIKEE_FOLLOW */:
      return "Likee" /* LIKEE */;
    default:
      return "Custom Tasks" /* CUSTOM */;
  }
}

// server.ts
import_dotenv.default.config();
var { Pool } = import_pg.default;
var PORT = Number(process.env.PORT) || 5e3;
var DB_CONNECTION_STRING = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!DB_CONNECTION_STRING) {
  console.error("FATAL: No database connection string configured. Set NEON_DATABASE_URL (or DATABASE_URL).");
  process.exit(1);
}
var pool = new Pool({
  connectionString: DB_CONNECTION_STRING,
  ssl: DB_CONNECTION_STRING.includes("localhost") || DB_CONNECTION_STRING.includes("127.0.0.1") ? false : { rejectUnauthorized: false }
});
function hashPassword(password) {
  return import_crypto.default.createHash("sha256").update(password).digest("hex");
}
function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role,
    isVerified: row.is_verified === true || row.is_verified === "true",
    isActive: row.is_active === true || row.is_active === "true",
    activationPaidAt: row.activation_paid_at ? row.activation_paid_at instanceof Date ? row.activation_paid_at.toISOString() : row.activation_paid_at : void 0,
    walletBalance: parseFloat(row.wallet_balance) || 0,
    referralCode: row.referral_code || void 0,
    referredBy: row.referred_by || void 0,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    verificationCode: row.verification_code || void 0,
    verificationCodeExpires: row.verification_code_expires ? row.verification_code_expires instanceof Date ? row.verification_code_expires.toISOString() : row.verification_code_expires : void 0,
    verificationCodeLastSent: row.verification_code_last_sent ? row.verification_code_last_sent instanceof Date ? row.verification_code_last_sent.toISOString() : row.verification_code_last_sent : void 0
  };
}
function mapTask(row) {
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
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}
function mapSubmission(row) {
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
    feedback: row.feedback || void 0,
    reward: parseFloat(row.reward) || 0,
    submittedAt: row.submitted_at instanceof Date ? row.submitted_at.toISOString() : row.submitted_at,
    approvedAt: row.approved_at ? row.approved_at instanceof Date ? row.approved_at.toISOString() : row.approved_at : void 0
  };
}
function mapTransaction(row) {
  if (!row) return null;
  let bankDetails = row.bank_details;
  if (typeof bankDetails === "string") {
    try {
      bankDetails = JSON.parse(bankDetails);
    } catch (e) {
    }
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
    gateway: row.gateway || void 0,
    bankDetails: bankDetails || void 0,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}
function mapSettings(row) {
  if (!row) return null;
  return {
    platformName: row.platform_name,
    referralReward: parseFloat(row.referral_reward) || 200,
    withdrawalFee: parseFloat(row.withdrawal_fee) || 100,
    minWithdrawal: parseFloat(row.min_withdrawal) || 200,
    minDeposit: parseFloat(row.min_deposit) || 200,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    telegramChannel: row.telegram_channel || void 0,
    whatsappGroup: row.whatsapp_group || void 0
  };
}
function mapPricing(row) {
  if (!row) return null;
  return {
    id: row.id,
    platform: row.platform,
    costPerSlot: parseFloat(row.cost_per_slot) || 0,
    earningPerSlot: parseFloat(row.earning_per_slot) || 0
  };
}
function mapSocialPlatform(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || "",
    logoUrl: row.logo_url || void 0,
    description: row.description || void 0,
    status: row.status,
    sortOrder: parseInt(row.sort_order) || 0,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}
function mapOwnerBankAccount(row) {
  if (!row) return null;
  return {
    id: row.id,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    accountName: row.account_name,
    isDefault: row.is_default === true || row.is_default === "true"
  };
}
function mapOwnerWithdrawal(row) {
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
function mapNotification(row) {
  return {
    id: row.id,
    type: row.type,
    message: row.message,
    referenceId: row.reference_id,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    read: row.read === true || row.read === "true"
  };
}
async function getSettings() {
  const res = await pool.query("SELECT * FROM settings ORDER BY id ASC LIMIT 1");
  return res.rows.length > 0 ? mapSettings(res.rows[0]) : {
    platformName: "TasksEarn",
    referralReward: 200,
    withdrawalFee: 100,
    minWithdrawal: 200,
    minDeposit: 200,
    contactEmail: "support@tasksearn.com",
    contactPhone: "09164444315",
    telegramChannel: "https://t.me/tasksearn_ng",
    whatsappGroup: "https://wa.me/2349164444315"
  };
}
async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const userId = authHeader.split(" ")[1];
  if (!userId) return null;
  const res = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
  return res.rows.length > 0 ? mapUser(res.rows[0]) : null;
}
async function bootstrapTables() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Earner',
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT FALSE,
        activation_paid_at TIMESTAMP NULL,
        wallet_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        referral_code VARCHAR(50) NULL,
        referred_by VARCHAR(50) NULL,
        verification_code VARCHAR(10) NULL,
        verification_code_expires TIMESTAMP NULL,
        verification_code_last_sent TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT FALSE
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS activation_paid_at TIMESTAMP NULL
    `);
    await client.query(`
      UPDATE users SET is_active = TRUE WHERE role != 'Earner' AND is_active = FALSE
    `);
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
    await client.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id VARCHAR(50) PRIMARY KEY,
        task_id VARCHAR(50) NOT NULL,
        task_title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        earner_id VARCHAR(50) NOT NULL,
        earner_name VARCHAR(150) NOT NULL,
        proof_text TEXT NOT NULL,
        proof_screenshot VARCHAR(1000) NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        feedback TEXT NULL,
        reward DECIMAL(10, 2) NOT NULL,
        approved_at TIMESTAMP NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
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
    await client.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'info',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        link VARCHAR(255) NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        platform_name VARCHAR(100) NOT NULL DEFAULT 'TasksEarn',
        referral_reward DECIMAL(10, 2) NOT NULL DEFAULT 200.00,
        withdrawal_fee DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
        min_withdrawal DECIMAL(10, 2) NOT NULL DEFAULT 200.00,
        min_deposit DECIMAL(10, 2) NOT NULL DEFAULT 200.00,
        contact_email VARCHAR(150) NOT NULL DEFAULT 'support@tasksearn.com',
        contact_phone VARCHAR(50) NOT NULL DEFAULT '09164444315',
        telegram_channel VARCHAR(255) NULL,
        whatsapp_group VARCHAR(255) NULL
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_pricing (
        id VARCHAR(50) PRIMARY KEY,
        platform VARCHAR(100) NOT NULL,
        cost_per_slot DECIMAL(10, 2) NOT NULL,
        earning_per_slot DECIMAL(10, 2) NOT NULL
      )
    `);
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
    await client.query(`
      CREATE TABLE IF NOT EXISTS owner_bank_accounts (
        id VARCHAR(50) PRIMARY KEY,
        bank_name VARCHAR(150) NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        account_name VARCHAR(150) NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);
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
    await client.query(`
      CREATE TABLE IF NOT EXISTS activation_payments (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL UNIQUE,
        user_name VARCHAR(150) NOT NULL,
        user_email VARCHAR(150) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
        reference VARCHAR(100) NOT NULL UNIQUE,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        paid_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
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
function getInitialPricing() {
  const platforms = Object.values(Platform);
  const defaults = {
    ["Instagram" /* INSTAGRAM */]: { cost: 15, earn: 10 },
    ["Facebook" /* FACEBOOK */]: { cost: 15, earn: 10 },
    ["TikTok" /* TIKTOK */]: { cost: 15, earn: 10 },
    ["YouTube" /* YOUTUBE */]: { cost: 25, earn: 18 },
    ["X (Twitter)" /* X_TWITTER */]: { cost: 15, earn: 10 },
    ["Telegram" /* TELEGRAM */]: { cost: 18, earn: 12 },
    ["WhatsApp" /* WHATSAPP */]: { cost: 18, earn: 12 },
    ["Snapchat" /* SNAPCHAT */]: { cost: 15, earn: 10 },
    ["LinkedIn" /* LINKEDIN */]: { cost: 20, earn: 14 },
    ["Threads" /* THREADS */]: { cost: 15, earn: 10 },
    ["Pinterest" /* PINTEREST */]: { cost: 15, earn: 10 },
    ["Reddit" /* REDDIT */]: { cost: 18, earn: 12 },
    ["Discord" /* DISCORD */]: { cost: 20, earn: 14 },
    ["Messenger (Facebook Messenger)" /* MESSENGER */]: { cost: 15, earn: 10 },
    ["Kwai" /* KWAI */]: { cost: 15, earn: 10 },
    ["Likee" /* LIKEE */]: { cost: 15, earn: 10 },
    ["Custom Tasks" /* CUSTOM */]: { cost: 30, earn: 20 }
  };
  return platforms.map((plat, idx) => ({
    id: `prc-${idx + 1}`,
    platform: plat,
    costPerSlot: defaults[plat]?.cost || 15,
    earningPerSlot: defaults[plat]?.earn || 10
  }));
}
function slugifyPlatformId(name) {
  return "plat-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
async function ensurePricingRowForPlatform(platformName) {
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
    const now = /* @__PURE__ */ new Date();
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 3600 * 1e3);
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 3600 * 1e3);
    await client.query(`
      INSERT INTO users (id, name, email, password, role, is_verified, wallet_balance, referral_code, created_at)
      VALUES
        ($1, 'Super Admin', 'admin@tasksearn.com', $2, 'Admin', true, 0, NULL, $3),
        ($4, 'Tunde Bakare', 'earner@tasksearn.com', $5, 'Earner', true, 2500, 'TUNDE887', $6),
        ($7, 'Chinedu Okafor', 'advertiser@tasksearn.com', $8, 'Advertiser', true, 35000, NULL, $9)
    `, [
      adminId,
      hashPassword("password123"),
      now,
      earnerId,
      hashPassword("password123"),
      tenDaysAgo,
      advertiserId,
      hashPassword("password123"),
      fifteenDaysAgo
    ]);
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
      new Date(Date.now() - 3 * 24 * 3600 * 1e3),
      new Date(Date.now() - 4 * 24 * 3600 * 1e3),
      new Date(Date.now() - 2 * 24 * 3600 * 1e3),
      new Date(Date.now() - 8 * 24 * 3600 * 1e3)
    ]);
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
      new Date(Date.now() - 2 * 24 * 3600 * 1e3),
      new Date(Date.now() - 3 * 3600 * 1e3)
    ]);
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
      advertiserId,
      fifteenDaysAgo,
      new Date(Date.now() - 3 * 24 * 3600 * 1e3),
      earnerId,
      new Date(Date.now() - 1 * 24 * 3600 * 1e3)
    ]);
    await client.query(`
      INSERT INTO referrals (id, referrer_id, referee_id, referee_name, referee_email, reward_earned, created_at)
      VALUES ('ref-1', $1, 'u-referee-1', 'Sola Alabi', 'sola@example.com', 200, $2)
    `, [earnerId, new Date(Date.now() - 5 * 24 * 3600 * 1e3)]);
    await client.query(`
      INSERT INTO announcements (id, title, content, type, created_at)
      VALUES
        ('ann-1', 'Welcome to TasksEarn Platform',
          'Welcome Nigerians to the most trusted social media microtask exchange platform! Advertisers can publish tasks, and Earners can complete simple tasks and earn directly in Naira (\u20A6) paid to their local bank accounts.',
          'success', $1),
        ('ann-2', 'Withdrawal Process Audits',
          'Withdrawal requests are processed every Friday at 12:00 PM. Please ensure your submitted bank details are accurate and your name matches your verification profile to avoid rejections.',
          'info', $2)
    `, [
      new Date(Date.now() - 10 * 24 * 3600 * 1e3),
      new Date(Date.now() - 2 * 24 * 3600 * 1e3)
    ]);
    await client.query(`
      INSERT INTO banners (id, title, image_url, link, active) VALUES
        ('ban-1', 'Boost Your Social Media Reach Instantly',
          'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&auto=format&fit=crop&q=80',
          '/advertiser/dashboard', true),
        ('ban-2', 'Earn Up to \u20A65,000 Daily From Home',
          'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&auto=format&fit=crop&q=80',
          '/dashboard', true)
    `);
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
There is no fixed limit! Your earnings depend on how many tasks you successfully complete. Tasks are rewarded between \u20A610 and \u20A6500 depending on complexity. Active earners can withdraw thousands of Naira weekly.

### 3. What is the minimum withdrawal and deposit?
- Minimum Withdrawal: \u20A62,000 (with a standard flat fee of \u20A6100 per transaction).
- Minimum Deposit for Advertisers: \u20A61,000.

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
- TasksEarn reserves the right to charge transaction fees on deposits (payment gateway charge) and withdrawals (\u20A6100 flat fee). Fees are clearly stated at checkout.`,
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
    await client.query(`
      INSERT INTO settings (platform_name, referral_reward, withdrawal_fee, min_withdrawal, min_deposit, contact_email, contact_phone, telegram_channel, whatsapp_group)
      VALUES ('TasksEarn', 200, 100, 200, 200, 'support@tasksearn.com', '09164444315', 'https://t.me/tasksearn_ng', 'https://wa.me/2349164444315')
    `);
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
var resendClient = null;
function getResendClient() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new import_resend.Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}
var smtpTransporter = null;
function getSMTPTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (host && user && pass && !smtpTransporter) {
    smtpTransporter = import_nodemailer.default.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  }
  return host && user && pass ? smtpTransporter : null;
}
async function sendEmail({ to, subject, html }) {
  const resend = getResendClient();
  if (resend) {
    const from = process.env.RESEND_FROM || "TasksEarn <onboarding@resend.dev>";
    const response = await resend.emails.send({ from, to: [to], subject, html });
    if (response.error) throw new Error(`Resend error: ${response.error.message}`);
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
async function sendVerificationEmail(email, name, code) {
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
async function sendPasswordResetEmail(email, name, tempPassword) {
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
var NIGERIAN_BANK_LIST = [
  { name: "Access Bank", code: "044" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank (FCMB)", code: "214" },
  { name: "Guaranty Trust Bank (GTB)", code: "058" },
  { name: "Keystone Bank", code: "082" },
  { name: "Kuda Bank", code: "50211" },
  { name: "Moniepoint Microfinance Bank", code: "50515" },
  { name: "OPay Microfinance Bank", code: "999992" },
  { name: "PalmPay Microfinance Bank", code: "999991" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Sterling Bank", code: "232" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
  { name: "Jaiz Bank", code: "301" },
  { name: "Parallex Bank", code: "104" },
  { name: "Titan Trust Bank", code: "102" },
  { name: "Globus Bank", code: "00103" },
  { name: "PremiumTrust Bank", code: "105" },
  { name: "Lotus Bank", code: "303" },
  { name: "Optimus Bank", code: "107" },
  { name: "VFD Microfinance Bank", code: "566" }
];
var app = (0, import_express.default)();
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
app.get("/api/public/pages", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM pages");
    const pages = {};
    result.rows.forEach((r) => {
      pages[r.id] = { title: r.title, content: r.content };
    });
    res.json(pages);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/public/banners", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM banners WHERE active = true");
    res.json(result.rows.map((r) => ({
      id: r.id,
      title: r.title,
      imageUrl: r.image_url,
      link: r.link,
      active: r.active
    })));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/public/announcements", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM announcements ORDER BY created_at DESC");
    res.json(result.rows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      type: r.type,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
    })));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/public/settings", async (_req, res) => {
  try {
    res.json(await getSettings());
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/public/stats", async (_req, res) => {
  try {
    const earnersCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'Earner'");
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
    res.json({
      earnersCount: parseInt(earnersCount.rows[0].count),
      tasksCount: parseInt(tasksCount.rows[0].count),
      totalPaidOut: parseFloat(totalPaidOut.rows[0].total),
      latestWithdrawal: lw ? { userName: lw.userName, bankName: lw.bankDetails?.bankName || "Commercial Bank", amount: lw.amount } : null,
      latestCampaign: lc ? { title: lc.title, cost: lc.totalSlots * lc.costPerSlot } : null
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, role, referralCode } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: "All fields are required" });
  try {
    const existing = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: "Email address already registered" });
    const userReferralCode = role === "Earner" /* EARNER */ ? name.substring(0, 4).toUpperCase() + Math.floor(100 + Math.random() * 900) : null;
    const userId = "u-" + Math.random().toString(36).substr(2, 9);
    let referredByUserId;
    if (referralCode && role === "Earner" /* EARNER */) {
      const referrer = await pool.query("SELECT id FROM users WHERE referral_code = $1 AND role = 'Earner'", [referralCode]);
      if (referrer.rows.length > 0) referredByUserId = referrer.rows[0].id;
    }
    const verificationCode = Math.floor(1e5 + Math.random() * 9e5).toString();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1e3);
    const verificationCodeLastSent = /* @__PURE__ */ new Date();
    try {
      await sendVerificationEmail(email, name, verificationCode);
    } catch (err) {
      return res.status(500).json({ error: `Could not send verification email. Details: ${err.message}` });
    }
    const isActiveOnCreate = role !== "Earner" /* EARNER */;
    await pool.query(`
      INSERT INTO users (id, name, email, password, role, is_verified, is_active, wallet_balance, referral_code, referred_by,
        verification_code, verification_code_expires, verification_code_last_sent, created_at)
      VALUES ($1,$2,$3,$4,$5,false,$6,0,$7,$8,$9,$10,$11,$12)
    `, [
      userId,
      name,
      email,
      hashPassword(password),
      role,
      isActiveOnCreate,
      userReferralCode,
      referredByUserId || null,
      verificationCode,
      verificationCodeExpires,
      verificationCodeLastSent,
      /* @__PURE__ */ new Date()
    ]);
    if (referredByUserId) {
      const settings = await getSettings();
      const referrer = await pool.query("SELECT * FROM users WHERE id = $1", [referredByUserId]);
      if (referrer.rows.length > 0) {
        const referrerUser = mapUser(referrer.rows[0]);
        const reward = settings?.referralReward || 200;
        await pool.query("UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2", [reward, referredByUserId]);
        const refId = "ref-" + Math.random().toString(36).substr(2, 9);
        await pool.query(`
          INSERT INTO referrals (id, referrer_id, referee_id, referee_name, referee_email, reward_earned, created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
        `, [refId, referredByUserId, userId, name, email, reward, /* @__PURE__ */ new Date()]);
        await pool.query(`
          INSERT INTO transactions (id, user_id, user_name, user_role, amount, type, status, description, reference, created_at)
          VALUES ($1,$2,$3,$4,$5,'Referral Bonus','Success',$6,$7,$8)
        `, [
          "tx-" + Math.random().toString(36).substr(2, 9),
          referredByUserId,
          referrerUser?.name || "",
          referrerUser?.role || "",
          reward,
          `Referral bonus for inviting ${name}`,
          "R-REF-" + Math.floor(1e7 + Math.random() * 9e7),
          /* @__PURE__ */ new Date()
        ]);
      }
    }
    const isActiveOnResponse = role !== "Earner" /* EARNER */;
    res.json({ user: { id: userId, name, email, role, isVerified: false, isActive: isActiveOnResponse, walletBalance: 0, referralCode: userReferralCode, createdAt: (/* @__PURE__ */ new Date()).toISOString() } });
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
    const tempPassword = "TE-" + Math.floor(1e5 + Math.random() * 9e5).toString();
    await sendPasswordResetEmail(user.email, user.name, tempPassword);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashPassword(tempPassword), user.id]);
    res.json({ success: true, message: "Password recovery credentials sent to " + email });
  } catch (err) {
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
      const { password: _2, verificationCode: __2, verificationCodeExpires: ___2, verificationCodeLastSent: ____2, ...safe2 } = user;
      return res.json({ success: true, message: "Account already verified", user: safe2 });
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
    if (elapsed < 60 * 1e3) {
      const remaining = Math.ceil((60 * 1e3 - elapsed) / 1e3);
      return res.status(429).json({ error: `Please wait ${remaining} seconds before requesting a new code.` });
    }
    const newCode = Math.floor(1e5 + Math.random() * 9e5).toString();
    const newExpiry = new Date(Date.now() + 10 * 60 * 1e3);
    await pool.query(
      "UPDATE users SET verification_code=$1, verification_code_expires=$2, verification_code_last_sent=$3 WHERE id=$4",
      [newCode, newExpiry, /* @__PURE__ */ new Date(), user.id]
    );
    await sendVerificationEmail(user.email, user.name, newCode);
    res.json({ success: true, message: "A new 6-digit verification code has been sent." });
  } catch (err) {
    res.status(500).json({ error: `Failed to send code. Details: ${err.message}` });
  }
});
app.get("/api/auth/me", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { password: _, verificationCode: __, verificationCodeExpires: ___, verificationCodeLastSent: ____, ...safe } = user;
    res.json({ user: safe });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/pricing", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM task_pricing ORDER BY id");
    res.json(result.rows.map(mapPricing));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/platforms", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM social_platforms WHERE status = 'Active' ORDER BY sort_order, name");
    res.json(result.rows.map(mapSocialPlatform));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/admin/platforms", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query("SELECT * FROM social_platforms ORDER BY sort_order, name");
    res.json(result.rows.map(mapSocialPlatform));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/admin/platforms", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const { name, icon, logoUrl, description, status } = req.body;
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
    await ensurePricingRowForPlatform(trimmedName);
    const result = await pool.query("SELECT * FROM social_platforms WHERE id = $1", [id]);
    res.json({ success: true, platform: mapSocialPlatform(result.rows[0]) });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.put("/api/admin/platforms/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
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
        icon !== void 0 ? icon : existing.icon,
        logoUrl !== void 0 ? logoUrl || null : existing.logoUrl || null,
        description !== void 0 ? description || null : existing.description || null,
        status === "Inactive" ? "Inactive" : "Active",
        id
      ]
    );
    if (newName !== existing.name) {
      await pool.query("UPDATE task_pricing SET platform=$1 WHERE platform=$2", [newName, existing.name]);
    }
    await ensurePricingRowForPlatform(newName);
    const result = await pool.query("SELECT * FROM social_platforms WHERE id = $1", [id]);
    res.json({ success: true, platform: mapSocialPlatform(result.rows[0]) });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.delete("/api/admin/platforms/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const { id } = req.params;
    const existingRes = await pool.query("SELECT * FROM social_platforms WHERE id = $1", [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: "Platform not found." });
    }
    const existing = mapSocialPlatform(existingRes.rows[0]);
    await pool.query("DELETE FROM social_platforms WHERE id = $1", [id]);
    await pool.query("DELETE FROM task_pricing WHERE platform = $1", [existing.name]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/earner/dashboard", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Earner" /* EARNER */) return res.status(403).json({ error: "Access denied" });
    const subs = await pool.query("SELECT * FROM submissions WHERE earner_id = $1", [user.id]);
    const submissions = subs.rows.map(mapSubmission);
    const approved = submissions.filter((s) => s.status === "Approved" /* APPROVED */);
    const pending = submissions.filter((s) => s.status === "Pending" /* PENDING */);
    const rejected = submissions.filter((s) => s.status === "Rejected" /* REJECTED */);
    const totalEarned = approved.reduce((sum, s) => sum + s.reward, 0);
    const refs = await pool.query("SELECT COUNT(*) FROM referrals WHERE referrer_id = $1", [user.id]);
    const submittedTaskIds = submissions.map((s) => s.taskId);
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
    const recentSubmissions = [...submissions].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
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
    if (!user || user.role !== "Earner" /* EARNER */) return res.status(403).json({ error: "Access denied" });
    const tasks = await pool.query("SELECT * FROM tasks WHERE status = 'Active' ORDER BY created_at DESC");
    const subs = await pool.query("SELECT task_id, status FROM submissions WHERE earner_id = $1", [user.id]);
    const submittedMap = new Map(subs.rows.map((s) => [s.task_id, s.status]));
    res.json(tasks.rows.map((r) => ({
      ...mapTask(r),
      submissionStatus: submittedMap.get(r.id) || null
    })));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/earner/tasks/:id/submit", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Earner" /* EARNER */) return res.status(403).json({ error: "Access denied" });
    const taskId = req.params.id;
    const { proofText, proofScreenshot } = req.body;
    if (!proofText) return res.status(400).json({ error: "Proof details are required" });
    const taskRes = await pool.query("SELECT * FROM tasks WHERE id = $1", [taskId]);
    if (taskRes.rows.length === 0 || taskRes.rows[0].status !== "Active" /* ACTIVE */) {
      return res.status(404).json({ error: "Task is not active or not found" });
    }
    const task = mapTask(taskRes.rows[0]);
    const alreadySub = await pool.query("SELECT id FROM submissions WHERE task_id = $1 AND earner_id = $2", [taskId, user.id]);
    if (alreadySub.rows.length > 0) return res.status(400).json({ error: "You have already submitted a proof for this task" });
    if (task.filledSlots >= task.totalSlots) return res.status(400).json({ error: "This task has reached its submission limit" });
    const screenshot = proofScreenshot || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&auto=format&fit=crop&q=60";
    const subId = "sub-" + Math.random().toString(36).substr(2, 9);
    await pool.query(`
      INSERT INTO submissions (id, task_id, task_title, category, earner_id, earner_name, proof_text, proof_screenshot, status, reward, submitted_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Pending',$9,$10)
    `, [subId, taskId, task.title, task.category, user.id, user.name, proofText, screenshot, task.earningPerSlot, /* @__PURE__ */ new Date()]);
    notifyAdmin({ type: "submission", message: `New task submission from ${user.name} for "${task.title}"`, referenceId: subId });
    const subRes = await pool.query("SELECT * FROM submissions WHERE id = $1", [subId]);
    res.json({ success: true, submission: mapSubmission(subRes.rows[0]) });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/earner/submissions", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Earner" /* EARNER */) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query("SELECT * FROM submissions WHERE earner_id = $1 ORDER BY submitted_at DESC", [user.id]);
    res.json(result.rows.map(mapSubmission));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.delete("/api/earner/submissions/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Earner" /* EARNER */) return res.status(403).json({ error: "Access denied" });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const subRes = await client.query(
        "SELECT * FROM submissions WHERE id=$1 AND earner_id=$2 FOR UPDATE",
        [req.params.id, user.id]
      );
      if (subRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Submission not found" });
      }
      const submission = mapSubmission(subRes.rows[0]);
      if (submission.status !== "Pending" /* PENDING */) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Only pending submissions can be deleted" });
      }
      const delRes = await client.query(
        "DELETE FROM submissions WHERE id=$1 AND earner_id=$2 AND status='Pending' RETURNING id",
        [submission.id, user.id]
      );
      if (delRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Only pending submissions can be deleted" });
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
    if (!user || user.role !== "Earner" /* EARNER */) return res.status(403).json({ error: "Access denied" });
    const settings = await getSettings();
    const refs = await pool.query("SELECT * FROM referrals WHERE referrer_id = $1 ORDER BY created_at DESC", [user.id]);
    res.json({
      referralCode: user.referralCode,
      referralReward: settings?.referralReward || 200,
      referrals: refs.rows.map((r) => ({
        id: r.id,
        referrerId: r.referrer_id,
        refereeId: r.referee_id,
        refereeName: r.referee_name,
        refereeEmail: r.referee_email,
        rewardEarned: parseFloat(r.reward_earned),
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
      }))
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
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
        const data = await response.json();
        if (data?.status && data?.data) {
          return res.json(data.data.map((b) => ({ name: b.name, code: b.code })).sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch {
      }
    }
    res.json(NIGERIAN_BANK_LIST);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
async function resolveBankAccount(accountNumber, bankName, bankCode) {
  if (!accountNumber || !bankCode && !bankName) {
    return { success: false, error: "Account number and bank are required" };
  }
  if (accountNumber.length !== 10 || !/^\d+$/.test(accountNumber)) {
    return { success: false, error: "Account number must be exactly 10 digits" };
  }
  const resolvedCode = bankCode || NIGERIAN_BANK_LIST.find((b) => b.name === bankName)?.code;
  const paystackKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackKey) {
    return { success: true, accountName: `Verified Account Holder (${bankName || "Nigerian Bank"})`, isSimulated: true };
  }
  if (!resolvedCode) return { success: false, error: "Could not determine bank code for the selected bank" };
  try {
    const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${resolvedCode}`, {
      headers: { "Authorization": `Bearer ${paystackKey}` }
    });
    const data = await response.json();
    if (data?.status && data?.data) {
      return { success: true, accountName: data.data.account_name };
    }
    return { success: false, error: data.message || "Could not resolve bank account. Please check the details and try again." };
  } catch {
    return { success: false, error: "Bank verification service is unavailable. Please try again." };
  }
}
app.post("/api/verify-bank", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required" });
    const { accountNumber, bankCode, bankName } = req.body;
    const result = await resolveBankAccount(accountNumber, bankName, bankCode);
    if ("error" in result) return res.status(400).json({ error: result.error });
    res.json({ success: true, accountName: result.accountName, isSimulated: result.isSimulated });
  } catch (err) {
    console.error("Verify bank error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/earner/withdraw", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Earner" /* EARNER */) return res.status(403).json({ error: "Access denied" });
    const { amount, bankName, accountNumber, accountName } = req.body;
    if (!amount || !bankName || !accountNumber || !accountName) {
      return res.status(400).json({ error: "All bank transfer fields are required" });
    }
    if (String(accountNumber).length !== 10 || !/^\d+$/.test(String(accountNumber))) {
      return res.status(400).json({ error: "Account number must be exactly 10 digits" });
    }
    const verification = await resolveBankAccount(String(accountNumber), bankName);
    if ("error" in verification) {
      return res.status(400).json({ error: `Bank account verification failed: ${verification.error}` });
    }
    if (!verification.isSimulated) {
      const tokenize = (s) => s.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter((t) => t.length >= 3);
      const resolvedTokens = tokenize(verification.accountName);
      const submittedTokens = tokenize(String(accountName));
      const overlap = resolvedTokens.filter((t) => submittedTokens.includes(t));
      const requiredMatches = Math.max(1, Math.min(2, resolvedTokens.length));
      if (overlap.length < requiredMatches) {
        return res.status(400).json({ error: `Account name does not match bank records. Verified name: ${verification.accountName}` });
      }
    }
    const settings = await getSettings();
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < (settings?.minWithdrawal || 200)) {
      return res.status(400).json({ error: `Minimum withdrawal amount is \u20A6${settings?.minWithdrawal}` });
    }
    const pendingRes = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE user_id = $1 AND type = 'Withdrawal' AND status = 'Pending'",
      [user.id]
    );
    const pendingTotal = parseFloat(pendingRes.rows[0].total) || 0;
    const available = user.walletBalance - pendingTotal;
    if (available < withdrawAmount) {
      return res.status(400).json({
        error: `Insufficient available balance. Balance: \u20A6${user.walletBalance.toLocaleString()}, locked in pending: \u20A6${pendingTotal.toLocaleString()}, available: \u20A6${available.toLocaleString()}`
      });
    }
    const txId = "tx-" + Math.random().toString(36).substr(2, 9);
    const ref = "W-BANK-" + Math.floor(1e7 + Math.random() * 9e7);
    const bankDetails = JSON.stringify({ bankName, accountNumber, accountName });
    await pool.query(`
      INSERT INTO transactions (id, user_id, user_name, user_role, amount, type, status, description, reference, bank_details, created_at)
      VALUES ($1,$2,$3,$4,$5,'Withdrawal','Pending',$6,$7,$8,$9)
    `, [txId, user.id, user.name, user.role, withdrawAmount, `Withdrawal to ${bankName} (${accountNumber})`, ref, bankDetails, /* @__PURE__ */ new Date()]);
    notifyAdmin({ type: "withdrawal", message: `New withdrawal request of \u20A6${withdrawAmount.toLocaleString()} from ${user.name}`, referenceId: txId });
    res.json({ success: true, transaction: { id: txId, amount: withdrawAmount, status: "Pending", reference: ref }, walletBalance: user.walletBalance, availableBalance: available - withdrawAmount });
  } catch (err) {
    console.error("Withdraw error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/advertiser/dashboard", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Advertiser" /* ADVERTISER */) return res.status(403).json({ error: "Access denied" });
    const tasks = await pool.query("SELECT * FROM tasks WHERE advertiser_id = $1 ORDER BY created_at DESC", [user.id]);
    const taskList = tasks.rows.map(mapTask);
    const taskIds = taskList.map((t) => t.id);
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
      activeCount: taskList.filter((t) => t.status === "Active" /* ACTIVE */).length,
      pausedCount: taskList.filter((t) => t.status === "Paused" /* PAUSED */).length,
      completedCount: taskList.filter((t) => t.status === "Completed" /* COMPLETED */).length,
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
    if (!user || user.role !== "Advertiser" /* ADVERTISER */) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query("SELECT * FROM tasks WHERE advertiser_id = $1 ORDER BY created_at DESC", [user.id]);
    res.json(result.rows.map(mapTask));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/advertiser/tasks", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Advertiser" /* ADVERTISER */) return res.status(403).json({ error: "Access denied" });
    const { title, description, category, proofRequirements, link, totalSlots } = req.body;
    if (!title || !description || !category || !proofRequirements || !link || !totalSlots) {
      return res.status(400).json({ error: "All campaign fields are required" });
    }
    const slots = parseInt(totalSlots);
    if (isNaN(slots) || slots <= 0) {
      return res.status(400).json({ error: "Invalid slot count" });
    }
    const platform = getPlatformForCategory(category);
    const platformRes = await pool.query("SELECT * FROM social_platforms WHERE LOWER(name) = LOWER($1) LIMIT 1", [platform]);
    if (platformRes.rows.length === 0 || mapSocialPlatform(platformRes.rows[0]).status !== "Active") {
      return res.status(400).json({ error: "This platform is not currently available for new campaigns. Please contact the administrator." });
    }
    const pricingRes = await pool.query("SELECT * FROM task_pricing WHERE platform = $1 LIMIT 1", [platform]);
    if (pricingRes.rows.length === 0 || parseFloat(pricingRes.rows[0].cost_per_slot) <= 0) {
      return res.status(400).json({ error: "No pricing has been configured for this platform yet. Please contact the administrator." });
    }
    const pricing = mapPricing(pricingRes.rows[0]);
    const finalCostPerSlot = pricing.costPerSlot;
    const finalEarningPerSlot = pricing.earningPerSlot;
    const totalCost = finalCostPerSlot * slots;
    if (user.walletBalance < totalCost) {
      return res.status(400).json({ error: `Insufficient balance. Campaign costs \u20A6${totalCost.toLocaleString()} (\u20A6${finalCostPerSlot}/slot).` });
    }
    const client = await pool.connect();
    let newTask;
    let newBalance;
    try {
      await client.query("BEGIN");
      const lockedUser = await client.query("SELECT wallet_balance FROM users WHERE id=$1 FOR UPDATE", [user.id]);
      const currentBalance = parseFloat(lockedUser.rows[0].wallet_balance);
      if (currentBalance < totalCost) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `Insufficient balance. Campaign costs \u20A6${totalCost.toLocaleString()}.` });
      }
      await client.query("UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2", [totalCost, user.id]);
      const newTaskId = "task-" + Math.random().toString(36).substr(2, 9);
      const taskInsert = await client.query(`
        INSERT INTO tasks (id, title, description, category, proof_requirements, link, cost_per_slot, earning_per_slot, total_slots, filled_slots, status, advertiser_id, advertiser_name, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,'Active',$10,$11,$12) RETURNING *
      `, [newTaskId, title, description, category, proofRequirements, link, finalCostPerSlot, finalEarningPerSlot, slots, user.id, user.name, /* @__PURE__ */ new Date()]);
      await client.query(`
        INSERT INTO transactions (id, user_id, user_name, user_role, amount, type, status, description, reference, created_at)
        VALUES ($1,$2,$3,$4,$5,'Campaign Spend','Success',$6,$7,$8)
      `, [
        "tx-" + Math.random().toString(36).substr(2, 9),
        user.id,
        user.name,
        user.role,
        totalCost,
        `Created Campaign: ${title}`,
        "T-SPEND-" + Math.floor(1e7 + Math.random() * 9e7),
        /* @__PURE__ */ new Date()
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
    res.json({ success: true, task: newTask, remainingBalance: newBalance });
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.put("/api/advertiser/tasks/:id/toggle", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Advertiser" /* ADVERTISER */) return res.status(403).json({ error: "Access denied" });
    const taskRes = await pool.query("SELECT * FROM tasks WHERE id = $1 AND advertiser_id = $2", [req.params.id, user.id]);
    if (taskRes.rows.length === 0) return res.status(404).json({ error: "Task not found" });
    const task = mapTask(taskRes.rows[0]);
    let newStatus = task.status;
    if (task.status === "Active" /* ACTIVE */) newStatus = "Paused" /* PAUSED */;
    else if (task.status === "Paused" /* PAUSED */) newStatus = "Active" /* ACTIVE */;
    await pool.query("UPDATE tasks SET status = $1 WHERE id = $2", [newStatus, task.id]);
    res.json({ success: true, task: { ...task, status: newStatus } });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.delete("/api/advertiser/tasks/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Advertiser" /* ADVERTISER */) return res.status(403).json({ error: "Access denied" });
    const client = await pool.connect();
    let refundAmount = 0;
    let newBalance = 0;
    try {
      await client.query("BEGIN");
      const taskRes = await client.query("SELECT * FROM tasks WHERE id=$1 AND advertiser_id=$2 FOR UPDATE", [req.params.id, user.id]);
      if (taskRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Task not found" });
      }
      const task = mapTask(taskRes.rows[0]);
      const remainingSlots = task.totalSlots - task.filledSlots;
      refundAmount = remainingSlots * task.costPerSlot;
      if (refundAmount > 0) {
        await client.query("UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id=$2", [refundAmount, user.id]);
        await client.query(`
          INSERT INTO transactions (id, user_id, user_name, user_role, amount, type, status, description, reference, created_at)
          VALUES ($1,$2,$3,$4,$5,'Deposit','Success',$6,$7,$8)
        `, [
          "tx-" + Math.random().toString(36).substr(2, 9),
          user.id,
          user.name,
          user.role,
          refundAmount,
          `Refund for deleted campaign: ${task.title} (${remainingSlots} slots)`,
          "T-REFUND-" + Math.floor(1e7 + Math.random() * 9e7),
          /* @__PURE__ */ new Date()
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
    res.json({ success: true, refundedAmount: refundAmount, remainingBalance: newBalance });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/advertiser/submissions", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Advertiser" /* ADVERTISER */) return res.status(403).json({ error: "Access denied" });
    const taskRes = await pool.query("SELECT id FROM tasks WHERE advertiser_id = $1", [user.id]);
    const taskIds = taskRes.rows.map((r) => r.id);
    if (taskIds.length === 0) return res.json([]);
    const subsRes = await pool.query(
      "SELECT * FROM submissions WHERE task_id = ANY($1::varchar[]) ORDER BY submitted_at DESC",
      [taskIds]
    );
    res.json(subsRes.rows.map(mapSubmission));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/advertiser/submissions/:id/review", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Advertiser" /* ADVERTISER */) return res.status(403).json({ error: "Access denied" });
    const { status, feedback } = req.body;
    if (!status || status !== "Approved" /* APPROVED */ && status !== "Rejected" /* REJECTED */) {
      return res.status(400).json({ error: "Invalid status selection" });
    }
    const client = await pool.connect();
    let updatedSubmission;
    try {
      await client.query("BEGIN");
      const subRes = await client.query("SELECT * FROM submissions WHERE id=$1 FOR UPDATE", [req.params.id]);
      if (subRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Submission not found" });
      }
      const submission = mapSubmission(subRes.rows[0]);
      if (submission.status !== "Pending" /* PENDING */) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Submission has already been reviewed" });
      }
      const taskRes = await client.query("SELECT * FROM tasks WHERE id=$1 AND advertiser_id=$2 FOR UPDATE", [submission.taskId, user.id]);
      if (taskRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(403).json({ error: "Unauthorized review" });
      }
      const task = mapTask(taskRes.rows[0]);
      const now = /* @__PURE__ */ new Date();
      if (status === "Approved" /* APPROVED */) {
        await client.query("UPDATE submissions SET status=$1, feedback=$2, approved_at=$3 WHERE id=$4", [status, feedback || "", now, submission.id]);
        const earnerRes = await client.query("SELECT name, role FROM users WHERE id=$1", [submission.earnerId]);
        const earnerName = earnerRes.rows[0]?.name || "";
        const earnerRole = earnerRes.rows[0]?.role || "Earner";
        await client.query("UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id=$2", [submission.reward, submission.earnerId]);
        await client.query(`
          INSERT INTO transactions (id, user_id, user_name, user_role, amount, type, status, description, reference, created_at)
          VALUES ($1,$2,$3,$4,$5,'Task Earnings','Success',$6,$7,$8)
        `, [
          "tx-" + Math.random().toString(36).substr(2, 9),
          submission.earnerId,
          earnerName,
          earnerRole,
          submission.reward,
          `Earned from task: ${task.title}`,
          "E-TASK-" + Math.floor(1e7 + Math.random() * 9e7),
          now
        ]);
        const newFilled = task.filledSlots + 1;
        const newStatus = newFilled >= task.totalSlots ? "Completed" /* COMPLETED */ : task.status;
        await client.query("UPDATE tasks SET filled_slots=$1, status=$2 WHERE id=$3", [newFilled, newStatus, task.id]);
      } else {
        await client.query("UPDATE submissions SET status=$1, feedback=$2 WHERE id=$3", [status, feedback || "", submission.id]);
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
    res.json({ success: true, submission: updatedSubmission });
  } catch (err) {
    console.error("Review submission error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/advertiser/deposit/initialize", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Advertiser" /* ADVERTISER */) return res.status(403).json({ error: "Access denied" });
    const settings = await getSettings();
    const depositAmount = parseFloat(req.body.amount);
    if (isNaN(depositAmount) || depositAmount < (settings?.minDeposit || 200)) {
      return res.status(400).json({ error: `Minimum deposit amount is \u20A6${settings?.minDeposit}` });
    }
    const txId = "tx-" + Math.random().toString(36).substr(2, 9);
    const ref = "DEP-" + Math.floor(1e7 + Math.random() * 9e7);
    await pool.query(`
      INSERT INTO transactions (id, user_id, user_name, user_role, amount, type, status, description, reference, gateway, created_at)
      VALUES ($1,$2,$3,$4,$5,'Deposit','Pending','Wallet Funding via Paystack Checkout',$6,'Paystack',$7)
    `, [txId, user.id, user.name, user.role, depositAmount, ref, /* @__PURE__ */ new Date()]);
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) {
      return res.status(400).json({ error: "PAYSTACK_SECRET_KEY environment variable is not configured." });
    }
    const origin = req.headers.referer || req.headers.origin || `http://localhost:${PORT}`;
    const baseOrigin = origin.endsWith("/") ? origin.slice(0, -1) : origin;
    const callbackUrl = `${baseOrigin}/#paystack_ref=${ref}`;
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { "Authorization": `Bearer ${paystackKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, amount: Math.round(depositAmount * 100), reference: ref, callback_url: callbackUrl })
    });
    const paystackData = await paystackRes.json();
    if (paystackData?.status && paystackData?.data) {
      return res.json({ success: true, authorization_url: paystackData.data.authorization_url, reference: ref });
    } else {
      return res.status(500).json({ error: paystackData.message || "Failed to initialize payment gateway" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/advertiser/deposit/verify", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Advertiser" /* ADVERTISER */) return res.status(403).json({ error: "Access denied" });
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ error: "Transaction reference is required" });
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) return res.status(400).json({ error: "PAYSTACK_SECRET_KEY is not configured." });
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${paystackKey}` }
    });
    const paystackData = await paystackRes.json();
    if (!paystackData?.status || !paystackData?.data) {
      return res.status(500).json({ error: "Could not verify payment status with gateway" });
    }
    const pStatus = paystackData.data.status;
    const pAmount = paystackData.data.amount / 100;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const txRes = await client.query("SELECT * FROM transactions WHERE reference=$1 AND user_id=$2 FOR UPDATE", [reference, user.id]);
      if (txRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Transaction record not found" });
      }
      const transaction = mapTransaction(txRes.rows[0]);
      if (transaction.status === "Success" /* SUCCESS */) {
        await client.query("ROLLBACK");
        const freshUser = await pool.query("SELECT wallet_balance FROM users WHERE id=$1", [user.id]);
        return res.json({ success: true, alreadyProcessed: true, walletBalance: parseFloat(freshUser.rows[0].wallet_balance), transaction });
      }
      if (transaction.status === "Failed" /* FAILED */ || transaction.status === "Rejected" /* REJECTED */) {
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
        await client.query("UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id=$2", [transaction.amount, user.id]);
        await client.query("COMMIT");
        const freshUser = await pool.query("SELECT wallet_balance FROM users WHERE id=$1", [user.id]);
        return res.json({ success: true, walletBalance: parseFloat(freshUser.rows[0].wallet_balance), transaction: { ...transaction, status: "Success" } });
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
app.get("/api/user/transactions", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const result = await pool.query("SELECT * FROM transactions WHERE user_id=$1 ORDER BY created_at DESC", [user.id]);
    res.json(result.rows.map(mapTransaction));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/admin/dashboard", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const [earners, advertisers, tasks, totalEarned, pendingWd, totalDep, recentUsers, recentTx, settings] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users WHERE role='Earner'"),
      pool.query("SELECT COUNT(*) FROM users WHERE role='Advertiser'"),
      pool.query("SELECT COUNT(*) FROM tasks"),
      pool.query("SELECT COALESCE(SUM(reward),0) AS total FROM submissions WHERE status='Approved'"),
      pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE type='Withdrawal' AND status='Pending'"),
      pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE type='Deposit' AND status='Success'"),
      pool.query("SELECT * FROM users ORDER BY created_at DESC LIMIT 5"),
      pool.query("SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5"),
      getSettings()
    ]);
    res.json({
      earnersCount: parseInt(earners.rows[0].count),
      advertisersCount: parseInt(advertisers.rows[0].count),
      tasksCount: parseInt(tasks.rows[0].count),
      totalEarned: parseFloat(totalEarned.rows[0].total),
      pendingWithdrawals: parseFloat(pendingWd.rows[0].total),
      totalDeposited: parseFloat(totalDep.rows[0].total),
      recentUsers: recentUsers.rows.map((r) => {
        const u = mapUser(r);
        const { password: _, verificationCode: __, verificationCodeExpires: ___, verificationCodeLastSent: ____, ...safe } = u;
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
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query("SELECT * FROM users WHERE role != 'Admin' ORDER BY created_at DESC");
    res.json(result.rows.map((r) => {
      const u = mapUser(r);
      const { password: _, verificationCode: __, verificationCodeExpires: ___, verificationCodeLastSent: ____, ...safe } = u;
      return safe;
    }));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.put("/api/admin/users/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const { walletBalance, isVerified } = req.body;
    const updates = [];
    const params = [];
    let idx = 1;
    if (walletBalance !== void 0) {
      updates.push(`wallet_balance=$${idx++}`);
      params.push(parseFloat(walletBalance));
    }
    if (isVerified !== void 0) {
      updates.push(`is_verified=$${idx++}`);
      params.push(!!isVerified);
    }
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
    params.push(req.params.id);
    await pool.query(`UPDATE users SET ${updates.join(",")} WHERE id=$${idx}`, params);
    const updated = await pool.query("SELECT * FROM users WHERE id=$1", [req.params.id]);
    if (updated.rows.length === 0) return res.status(404).json({ error: "User not found" });
    const u = mapUser(updated.rows[0]);
    const { password: _, verificationCode: __, verificationCodeExpires: ___, verificationCodeLastSent: ____, ...safe } = u;
    res.json({ success: true, user: safe });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/admin/tasks", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query("SELECT * FROM tasks ORDER BY created_at DESC");
    res.json(result.rows.map(mapTask));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.put("/api/admin/tasks/:id/status", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const { status } = req.body;
    const result = await pool.query("UPDATE tasks SET status=$1 WHERE id=$2 RETURNING *", [status, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Task not found" });
    res.json({ success: true, task: mapTask(result.rows[0]) });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.delete("/api/admin/tasks/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const client = await pool.connect();
    let refundAmount = 0;
    try {
      await client.query("BEGIN");
      const taskRes = await client.query("SELECT * FROM tasks WHERE id=$1 FOR UPDATE", [req.params.id]);
      if (taskRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Task not found" });
      }
      const task = mapTask(taskRes.rows[0]);
      const remainingSlots = task.totalSlots - task.filledSlots;
      refundAmount = remainingSlots * task.costPerSlot;
      if (refundAmount > 0 && task.advertiserId) {
        await client.query("UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id=$2", [refundAmount, task.advertiserId]);
        await client.query(`
          INSERT INTO transactions (id, user_id, user_name, user_role, amount, type, status, description, reference, created_at)
          VALUES ($1,$2,$3,$4,$5,'Deposit','Success',$6,$7,$8)
        `, [
          "tx-" + Math.random().toString(36).substr(2, 9),
          task.advertiserId,
          task.advertiserName,
          "Advertiser" /* ADVERTISER */,
          refundAmount,
          `Refund for campaign deleted by admin: ${task.title} (${remainingSlots} slots)`,
          "T-REFUND-ADM-" + Math.floor(1e7 + Math.random() * 9e7),
          /* @__PURE__ */ new Date()
        ]);
      }
      await client.query("DELETE FROM submissions WHERE task_id=$1 AND status='Pending'", [task.id]);
      await client.query("DELETE FROM tasks WHERE id=$1", [task.id]);
      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }
    res.json({ success: true, refundedAmount: refundAmount });
  } catch (err) {
    console.error("Admin delete task error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/admin/submissions", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query("SELECT * FROM submissions ORDER BY submitted_at DESC");
    res.json(result.rows.map(mapSubmission));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/admin/submissions/:id/review", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const { status, feedback } = req.body;
    const client = await pool.connect();
    let updatedSubmission;
    try {
      await client.query("BEGIN");
      const subRes = await client.query("SELECT * FROM submissions WHERE id=$1 FOR UPDATE", [req.params.id]);
      if (subRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Submission not found" });
      }
      const submission = mapSubmission(subRes.rows[0]);
      if (submission.status !== "Pending" /* PENDING */) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Submission has already been audited" });
      }
      const taskRes = await client.query("SELECT * FROM tasks WHERE id=$1 FOR UPDATE", [submission.taskId]);
      if (taskRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Associated task not found" });
      }
      const task = mapTask(taskRes.rows[0]);
      const now = /* @__PURE__ */ new Date();
      if (status === "Approved" /* APPROVED */) {
        await client.query("UPDATE submissions SET status=$1, feedback=$2, approved_at=$3 WHERE id=$4", [status, feedback || "", now, submission.id]);
        const earnerRes = await client.query("SELECT name, role FROM users WHERE id=$1", [submission.earnerId]);
        if (earnerRes.rows.length > 0) {
          await client.query("UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id=$2", [submission.reward, submission.earnerId]);
          await client.query(`
            INSERT INTO transactions (id, user_id, user_name, user_role, amount, type, status, description, reference, created_at)
            VALUES ($1,$2,$3,$4,$5,'Task Earnings','Success',$6,$7,$8)
          `, [
            "tx-" + Math.random().toString(36).substr(2, 9),
            submission.earnerId,
            earnerRes.rows[0].name,
            earnerRes.rows[0].role,
            submission.reward,
            `Earned from task (Admin Audited): ${task.title}`,
            "E-TASK-ADM-" + Math.floor(1e7 + Math.random() * 9e7),
            now
          ]);
        }
        const newFilled = task.filledSlots + 1;
        const newStatus = newFilled >= task.totalSlots ? "Completed" /* COMPLETED */ : task.status;
        await client.query("UPDATE tasks SET filled_slots=$1, status=$2 WHERE id=$3", [newFilled, newStatus, task.id]);
      } else {
        await client.query("UPDATE submissions SET status=$1, feedback=$2 WHERE id=$3", [status, feedback || "", submission.id]);
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
    res.json({ success: true, submission: updatedSubmission });
  } catch (err) {
    console.error("Admin review error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/admin/withdrawals", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query("SELECT * FROM transactions WHERE type='Withdrawal' ORDER BY created_at DESC");
    res.json(result.rows.map(mapTransaction));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/admin/withdrawals/:id/review", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const { status } = req.body;
    const isApproved = ["Success", "Approved", "success", "approved"].includes(status);
    const client = await pool.connect();
    let updatedTx;
    try {
      await client.query("BEGIN");
      const txRes = await client.query("SELECT * FROM transactions WHERE id=$1 AND type='Withdrawal' FOR UPDATE", [req.params.id]);
      if (txRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Withdrawal transaction not found" });
      }
      const transaction = mapTransaction(txRes.rows[0]);
      if (transaction.status !== "Pending" /* PENDING */) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Withdrawal already reviewed" });
      }
      if (isApproved) {
        const earnerRes = await client.query("SELECT wallet_balance FROM users WHERE id=$1 FOR UPDATE", [transaction.userId]);
        if (earnerRes.rows.length > 0) {
          const bal = parseFloat(earnerRes.rows[0].wallet_balance);
          if (bal < transaction.amount) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: `User has insufficient balance (\u20A6${bal}) for payout of \u20A6${transaction.amount}.` });
          }
          await client.query("UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id=$2", [transaction.amount, transaction.userId]);
        }
        await client.query("UPDATE transactions SET status='Success' WHERE id=$1", [transaction.id]);
      } else {
        await client.query("UPDATE transactions SET status='Rejected' WHERE id=$1", [transaction.id]);
      }
      await client.query("COMMIT");
      const updated = await pool.query("SELECT * FROM transactions WHERE id=$1", [transaction.id]);
      updatedTx = mapTransaction(updated.rows[0]);
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }
    res.json({ success: true, transaction: updatedTx });
  } catch (err) {
    console.error("Review withdrawal error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/admin/deposits", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query("SELECT * FROM transactions WHERE type='Deposit' ORDER BY created_at DESC");
    res.json(result.rows.map(mapTransaction));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/admin/referrals", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query("SELECT * FROM referrals ORDER BY created_at DESC");
    res.json(result.rows.map((r) => ({
      id: r.id,
      referrerId: r.referrer_id,
      refereeId: r.referee_id,
      refereeName: r.referee_name,
      refereeEmail: r.referee_email,
      rewardEarned: parseFloat(r.reward_earned),
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
    })));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/admin/announcements", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query("SELECT * FROM announcements ORDER BY created_at DESC");
    res.json(result.rows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      type: r.type,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
    })));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/admin/announcements", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const { title, content, type } = req.body;
    if (!title || !content) return res.status(400).json({ error: "Title and Content are required" });
    const id = "ann-" + Math.random().toString(36).substr(2, 9);
    await pool.query(
      "INSERT INTO announcements (id, title, content, type, created_at) VALUES ($1,$2,$3,$4,$5)",
      [id, title, content, type || "info", /* @__PURE__ */ new Date()]
    );
    res.json({ success: true, announcement: { id, title, content, type: type || "info", createdAt: (/* @__PURE__ */ new Date()).toISOString() } });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.delete("/api/admin/announcements/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query("DELETE FROM announcements WHERE id=$1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Announcement not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/admin/banners", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query("SELECT * FROM banners ORDER BY id");
    res.json(result.rows.map((r) => ({ id: r.id, title: r.title, imageUrl: r.image_url, link: r.link, active: r.active })));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/admin/banners", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const { title, imageUrl, link } = req.body;
    if (!title || !imageUrl) return res.status(400).json({ error: "Title and Image URL are required" });
    const id = "ban-" + Math.random().toString(36).substr(2, 9);
    await pool.query("INSERT INTO banners (id, title, image_url, link, active) VALUES ($1,$2,$3,$4,true)", [id, title, imageUrl, link || ""]);
    res.json({ success: true, banner: { id, title, imageUrl, link: link || "", active: true } });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.put("/api/admin/banners/:id/toggle", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query("UPDATE banners SET active = NOT active WHERE id=$1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Banner not found" });
    const r = result.rows[0];
    res.json({ success: true, banner: { id: r.id, title: r.title, imageUrl: r.image_url, link: r.link, active: r.active } });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.delete("/api/admin/banners/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query("DELETE FROM banners WHERE id=$1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Banner not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.put("/api/admin/pages/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const pageId = req.params.id;
    const { title, content } = req.body;
    const existing = await pool.query("SELECT id FROM pages WHERE id=$1", [pageId]);
    if (existing.rows.length === 0) {
      await pool.query("INSERT INTO pages (id, title, content) VALUES ($1,$2,$3)", [pageId, title || "", content || ""]);
    } else {
      const updates = [];
      const params = [];
      let idx = 1;
      if (title) {
        updates.push(`title=$${idx++}`);
        params.push(title);
      }
      if (content) {
        updates.push(`content=$${idx++}`);
        params.push(content);
      }
      if (updates.length > 0) {
        params.push(pageId);
        await pool.query(`UPDATE pages SET ${updates.join(",")} WHERE id=$${idx}`, params);
      }
    }
    const updated = await pool.query("SELECT * FROM pages WHERE id=$1", [pageId]);
    res.json({ success: true, page: updated.rows[0] ? { title: updated.rows[0].title, content: updated.rows[0].content } : {} });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/admin/settings", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    res.json(await getSettings());
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.put("/api/admin/settings", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
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
      referralReward !== void 0 ? parseFloat(referralReward) : null,
      withdrawalFee !== void 0 ? parseFloat(withdrawalFee) : null,
      minWithdrawal !== void 0 ? parseFloat(minWithdrawal) : null,
      minDeposit !== void 0 ? parseFloat(minDeposit) : null,
      contactEmail || null,
      contactPhone || null,
      telegramChannel !== void 0 ? telegramChannel : null,
      whatsappGroup !== void 0 ? whatsappGroup : null
    ]);
    res.json({ success: true, settings: await getSettings() });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/admin/task-pricing", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query("SELECT * FROM task_pricing ORDER BY id");
    res.json(result.rows.map(mapPricing));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.put("/api/admin/task-pricing", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
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
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
async function getPlatformRevenueStats() {
  const now = /* @__PURE__ */ new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const approvedSubs = await pool.query(`
    SELECT s.reward, s.approved_at, s.submitted_at, t.cost_per_slot
    FROM submissions s
    LEFT JOIN tasks t ON t.id = s.task_id
    WHERE s.status = 'Approved'
  `);
  let totalCommission = 0, todayCommission = 0, monthCommission = 0;
  for (const row of approvedSubs.rows) {
    const cost = parseFloat(row.cost_per_slot) || parseFloat(row.reward) * 1.35;
    const commission = cost - parseFloat(row.reward);
    totalCommission += commission;
    const approvedTime = row.approved_at ? new Date(row.approved_at).getTime() : new Date(row.submitted_at).getTime();
    if (approvedTime >= startOfToday) todayCommission += commission;
    if (approvedTime >= startOfThisMonth) monthCommission += commission;
  }
  const settings = await getSettings();
  const feePerWd = settings?.withdrawalFee || 100;
  const wdRes = await pool.query("SELECT created_at FROM transactions WHERE type='Withdrawal' AND status IN ('Success','Approved')");
  let totalWdFees = 0, todayWdFees = 0, monthWdFees = 0;
  for (const row of wdRes.rows) {
    totalWdFees += feePerWd;
    const t = new Date(row.created_at).getTime();
    if (t >= startOfToday) todayWdFees += feePerWd;
    if (t >= startOfThisMonth) monthWdFees += feePerWd;
  }
  const lifetimeRevenue = totalCommission + totalWdFees;
  const todayRevenue = todayCommission + todayWdFees;
  const monthRevenue = monthCommission + monthWdFees;
  const ownerWds = await pool.query("SELECT amount, status FROM owner_withdrawals");
  let totalWithdrawn = 0, pendingWithdrawalAmount = 0;
  for (const row of ownerWds.rows) {
    if (["Approved", "Success"].includes(row.status)) totalWithdrawn += parseFloat(row.amount);
    if (row.status === "Pending") pendingWithdrawalAmount += parseFloat(row.amount);
  }
  const availableBalance = Math.max(0, lifetimeRevenue - totalWithdrawn - pendingWithdrawalAmount);
  return { lifetimeRevenue, totalPlatformRevenue: lifetimeRevenue, todayRevenue, thisMonthRevenue: monthRevenue, totalWithdrawn, pendingWithdrawalAmount, availableBalance };
}
app.get("/api/admin/owner-earnings/stats", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    res.json(await getPlatformRevenueStats());
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/admin/owner-earnings/bank-accounts", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query("SELECT * FROM owner_bank_accounts ORDER BY id");
    res.json(result.rows.map(mapOwnerBankAccount));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/admin/owner-earnings/bank-accounts", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
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
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.put("/api/admin/owner-earnings/bank-accounts/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const { bankName, accountNumber, accountName, isDefault } = req.body;
    const { id } = req.params;
    if (isDefault) await pool.query("UPDATE owner_bank_accounts SET is_default = false");
    const updates = [];
    const params = [];
    let idx = 1;
    if (bankName) {
      updates.push(`bank_name=$${idx++}`);
      params.push(bankName);
    }
    if (accountNumber) {
      updates.push(`account_number=$${idx++}`);
      params.push(accountNumber);
    }
    if (accountName) {
      updates.push(`account_name=$${idx++}`);
      params.push(accountName);
    }
    if (isDefault !== void 0) {
      updates.push(`is_default=$${idx++}`);
      params.push(isDefault);
    }
    if (updates.length > 0) {
      params.push(id);
      await pool.query(`UPDATE owner_bank_accounts SET ${updates.join(",")} WHERE id=$${idx}`, params);
    }
    const result = await pool.query("SELECT * FROM owner_bank_accounts WHERE id=$1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Bank account not found" });
    res.json(mapOwnerBankAccount(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.delete("/api/admin/owner-earnings/bank-accounts/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const { id } = req.params;
    const existing = await pool.query("SELECT * FROM owner_bank_accounts WHERE id=$1", [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: "Bank account not found" });
    const wasDefault = existing.rows[0].is_default;
    await pool.query("DELETE FROM owner_bank_accounts WHERE id=$1", [id]);
    if (wasDefault) {
      await pool.query("UPDATE owner_bank_accounts SET is_default=true WHERE id=(SELECT id FROM owner_bank_accounts LIMIT 1)");
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/admin/owner-earnings/bank-accounts/:id/default", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const { id } = req.params;
    await pool.query("UPDATE owner_bank_accounts SET is_default = false");
    const result = await pool.query("UPDATE owner_bank_accounts SET is_default = true WHERE id=$1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Bank account not found" });
    res.json({ success: true, account: mapOwnerBankAccount(result.rows[0]) });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/admin/owner-earnings/banks", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (paystackKey) {
      try {
        const response = await fetch("https://api.paystack.co/bank?country=nigeria", {
          headers: { "Authorization": `Bearer ${paystackKey}` }
        });
        const data = await response.json();
        if (data?.status && data?.data) {
          return res.json(data.data.map((b) => ({ name: b.name, code: b.code })).sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch {
      }
    }
    res.json([
      { name: "Access Bank", code: "044" },
      { name: "Ecobank Nigeria", code: "050" },
      { name: "Fidelity Bank", code: "070" },
      { name: "First Bank of Nigeria", code: "011" },
      { name: "First City Monument Bank (FCMB)", code: "214" },
      { name: "Guaranty Trust Bank (GTB)", code: "058" },
      { name: "Keystone Bank", code: "082" },
      { name: "Kuda Bank", code: "50211" },
      { name: "Moniepoint Microfinance Bank", code: "50515" },
      { name: "OPay Microfinance Bank", code: "999992" },
      { name: "PalmPay Microfinance Bank", code: "999991" },
      { name: "Polaris Bank", code: "076" },
      { name: "Providus Bank", code: "101" },
      { name: "Stanbic IBTC Bank", code: "221" },
      { name: "Sterling Bank", code: "232" },
      { name: "Union Bank of Nigeria", code: "032" },
      { name: "United Bank for Africa (UBA)", code: "033" },
      { name: "Unity Bank", code: "215" },
      { name: "Wema Bank", code: "035" },
      { name: "Zenith Bank", code: "057" }
    ]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/admin/owner-earnings/resolve-bank", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
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
    const data = await response.json();
    if (data?.status && data?.data) {
      return res.json({ success: true, accountName: data.data.account_name, accountNumber: data.data.account_number, bankCode });
    }
    return res.status(400).json({ error: data.message || "Could not resolve bank account." });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/admin/owner-earnings/withdrawals", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query("SELECT * FROM owner_withdrawals ORDER BY submitted_at DESC");
    res.json(result.rows.map(mapOwnerWithdrawal));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/admin/owner-earnings/withdraw", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const { amount, bankAccountId } = req.body;
    if (!amount || !bankAccountId) return res.status(400).json({ error: "Amount and bank account selection are required" });
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) return res.status(400).json({ error: "Please enter a valid positive withdrawal amount" });
    const accountRes = await pool.query("SELECT * FROM owner_bank_accounts WHERE id=$1", [bankAccountId]);
    if (accountRes.rows.length === 0) return res.status(400).json({ error: "Selected bank account is invalid" });
    const account = mapOwnerBankAccount(accountRes.rows[0]);
    const stats = await getPlatformRevenueStats();
    if (stats.availableBalance < withdrawAmount) {
      return res.status(400).json({ error: `Insufficient balance. Maximum: \u20A6${stats.availableBalance.toLocaleString()}` });
    }
    const id = "own-wd-" + Math.random().toString(36).substr(2, 9);
    const reference = "OWN-PAY-" + Math.floor(1e7 + Math.random() * 9e7);
    await pool.query(`
      INSERT INTO owner_withdrawals (id, amount, bank_account_id, bank_name, account_number, account_name, reference, status, submitted_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'Pending',$8)
    `, [id, withdrawAmount, bankAccountId, account.bankName, account.accountNumber, account.accountName, reference, /* @__PURE__ */ new Date()]);
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
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query("UPDATE owner_withdrawals SET status=$1 WHERE id=$2 RETURNING *", [status, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Withdrawal not found" });
    res.json({ success: true, withdrawal: mapOwnerWithdrawal(result.rows[0]) });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/admin/notifications", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100");
    res.json(result.rows.map(mapNotification));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/admin/notifications/read-all", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    await pool.query("UPDATE notifications SET read = true");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/admin/notifications/:id/read", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query("UPDATE notifications SET read=true WHERE id=$1 RETURNING *", [req.params.id]);
    res.json({ success: true, notification: result.rows.length > 0 ? mapNotification(result.rows[0]) : null });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
var server = (0, import_http.createServer)(app);
var wss = new import_ws.WebSocketServer({ noServer: true });
var adminClients = /* @__PURE__ */ new Set();
wss.on("connection", (ws) => {
  console.log("[WS] Admin client connected");
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
    } catch (e) {
      console.error("[WS] Error:", e);
    }
  });
  ws.on("close", () => {
    adminClients.delete(ws);
  });
  ws.on("error", () => {
    adminClients.delete(ws);
  });
});
server.on("upgrade", (request, socket, head) => {
  const { pathname } = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
  if (pathname === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => wss.emit("connection", ws, request));
  }
});
async function notifyAdmin(notification) {
  const id = "notif-" + Math.random().toString(36).substr(2, 9);
  const now = /* @__PURE__ */ new Date();
  try {
    await pool.query(
      "INSERT INTO notifications (id, type, message, reference_id, read, created_at) VALUES ($1,$2,$3,$4,false,$5)",
      [id, notification.type, notification.message, notification.referenceId, now]
    );
    await pool.query("DELETE FROM notifications WHERE id NOT IN (SELECT id FROM notifications ORDER BY created_at DESC LIMIT 100)");
  } catch (err) {
    console.error("[Notify] Failed to persist notification:", err);
  }
  const newNotif = {
    id,
    type: notification.type,
    message: notification.message,
    referenceId: notification.referenceId,
    createdAt: now.toISOString(),
    read: false
  };
  const payload = JSON.stringify({ type: "notification", notification: newNotif });
  adminClients.forEach((client) => {
    if (client.readyState === import_ws.WebSocket.OPEN) client.send(payload);
  });
}
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => res.sendFile(import_path.default.join(distPath, "index.html")));
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[TasksEarn Server] PostgreSQL mode \u2014 running on http://0.0.0.0:${PORT}`);
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
var ACTIVATION_FEE = 500;
app.post("/api/earner/activation/initialize", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Earner" /* EARNER */) return res.status(403).json({ error: "Access denied" });
    if (user.isActive) return res.status(400).json({ error: "Your account is already activated." });
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) return res.status(400).json({ error: "Payment gateway is not configured. Please contact support." });
    const existingPending = await pool.query(
      "SELECT * FROM activation_payments WHERE user_id=$1 AND status='Pending'",
      [user.id]
    );
    let ref;
    if (existingPending.rows.length > 0) {
      ref = existingPending.rows[0].reference;
    } else {
      ref = "ACT-" + Math.floor(1e7 + Math.random() * 9e7);
      const apId = "ap-" + Math.random().toString(36).substr(2, 9);
      await pool.query(`
        INSERT INTO activation_payments (id, user_id, user_name, user_email, amount, reference, status, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,'Pending',$7)
        ON CONFLICT (user_id) DO UPDATE SET reference=EXCLUDED.reference, status='Pending', created_at=EXCLUDED.created_at
      `, [apId, user.id, user.name, user.email, ACTIVATION_FEE, ref, /* @__PURE__ */ new Date()]);
    }
    const origin = req.headers.referer || req.headers.origin || `http://localhost:${PORT}`;
    const baseOrigin = origin.replace(/\/$/, "");
    const callbackUrl = `${baseOrigin}/#activation_ref=${ref}`;
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { "Authorization": `Bearer ${paystackKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(ACTIVATION_FEE * 100),
        reference: ref,
        callback_url: callbackUrl,
        metadata: { custom_fields: [{ display_name: "Purpose", variable_name: "purpose", value: "Earner Account Activation" }] }
      })
    });
    const paystackData = await paystackRes.json();
    if (paystackData?.status && paystackData?.data) {
      return res.json({ success: true, authorization_url: paystackData.data.authorization_url, reference: ref });
    }
    return res.status(500).json({ error: paystackData?.message || "Failed to initialize payment gateway" });
  } catch (err) {
    console.error("Activation initialize error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/earner/activation/verify", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Earner" /* EARNER */) return res.status(403).json({ error: "Access denied" });
    if (user.isActive) return res.json({ success: true, alreadyActive: true });
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ error: "Transaction reference is required" });
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) return res.status(400).json({ error: "Payment gateway is not configured." });
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { "Authorization": `Bearer ${paystackKey}` }
    });
    const paystackData = await paystackRes.json();
    if (!paystackData?.status || !paystackData?.data) {
      return res.status(500).json({ error: "Could not verify payment with gateway" });
    }
    const pStatus = paystackData.data.status;
    const pAmount = paystackData.data.amount / 100;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const apRes = await client.query(
        "SELECT * FROM activation_payments WHERE reference=$1 AND user_id=$2 FOR UPDATE",
        [reference, user.id]
      );
      if (apRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Activation payment record not found" });
      }
      const ap = apRes.rows[0];
      if (ap.status === "Success") {
        await client.query("ROLLBACK");
        const freshUser = await pool.query("SELECT * FROM users WHERE id=$1", [user.id]);
        return res.json({ success: true, alreadyProcessed: true, user: mapUser(freshUser.rows[0]) });
      }
      if (pStatus === "success") {
        if (Math.abs(pAmount - ACTIVATION_FEE) > 0.5) {
          await client.query("UPDATE activation_payments SET status='Failed' WHERE id=$1", [ap.id]);
          await client.query("COMMIT");
          return res.status(400).json({ error: "Payment amount mismatch. Please contact support." });
        }
        const now = /* @__PURE__ */ new Date();
        await client.query(
          "UPDATE users SET is_active=TRUE, activation_paid_at=$1 WHERE id=$2",
          [now, user.id]
        );
        await client.query(
          "UPDATE activation_payments SET status='Success', paid_at=$1 WHERE id=$2",
          [now, ap.id]
        );
        const txId = "tx-" + Math.random().toString(36).substr(2, 9);
        await client.query(`
          INSERT INTO transactions (id, user_id, user_name, user_role, amount, type, status, description, reference, gateway, created_at)
          VALUES ($1,$2,$3,$4,$5,'Deposit','Success','Account Activation Fee Payment',$6,'Paystack',$7)
        `, [txId, user.id, user.name, user.role, ACTIVATION_FEE, reference, now]);
        const adminRes = await client.query("SELECT id, name, role FROM users WHERE role='Admin' LIMIT 1");
        if (adminRes.rows.length > 0) {
          const admin = adminRes.rows[0];
          await client.query("UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id=$2", [ACTIVATION_FEE, admin.id]);
          const adminTxId = "tx-" + Math.random().toString(36).substr(2, 9);
          await client.query(`
            INSERT INTO transactions (id, user_id, user_name, user_role, amount, type, status, description, reference, created_at)
            VALUES ($1,$2,$3,$4,$5,'Deposit','Success',$6,$7,$8)
          `, [
            adminTxId,
            admin.id,
            admin.name,
            admin.role,
            ACTIVATION_FEE,
            `Activation fee from ${user.name} (${user.email})`,
            "ACT-ADM-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
            now
          ]);
        }
        await client.query("COMMIT");
        const freshUser = await pool.query("SELECT * FROM users WHERE id=$1", [user.id]);
        return res.json({ success: true, user: mapUser(freshUser.rows[0]) });
      } else {
        await client.query("UPDATE activation_payments SET status='Failed' WHERE id=$1", [ap.id]);
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
    console.error("Activation verify error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/admin/activations", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const result = await pool.query(`
      SELECT
        u.id, u.name, u.email, u.is_active, u.activation_paid_at, u.created_at,
        ap.id AS ap_id, ap.reference, ap.status AS payment_status, ap.amount AS payment_amount, ap.paid_at
      FROM users u
      LEFT JOIN activation_payments ap ON ap.user_id = u.id
      WHERE u.role = 'Earner'
      ORDER BY u.created_at DESC
    `);
    const rows = result.rows.map((r) => ({
      userId: r.id,
      name: r.name,
      email: r.email,
      isActive: r.is_active === true || r.is_active === "true",
      activationPaidAt: r.activation_paid_at || null,
      createdAt: r.created_at,
      payment: r.ap_id ? {
        id: r.ap_id,
        reference: r.reference,
        status: r.payment_status,
        amount: parseFloat(r.payment_amount) || 0,
        paidAt: r.paid_at || null
      } : null
    }));
    return res.json(rows);
  } catch (err) {
    console.error("Admin activations list error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.put("/api/admin/activations/:userId", async (req, res) => {
  try {
    const admin = await getAuthenticatedUser(req);
    if (!admin || admin.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
    const { userId } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") return res.status(400).json({ error: "isActive (boolean) is required" });
    const userRes = await pool.query("SELECT * FROM users WHERE id=$1 AND role='Earner'", [userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: "Earner not found" });
    const now = /* @__PURE__ */ new Date();
    await pool.query(
      "UPDATE users SET is_active=$1, activation_paid_at=$2 WHERE id=$3",
      [isActive, isActive ? userRes.rows[0].activation_paid_at || now : null, userId]
    );
    if (isActive) {
      await pool.query(`
        INSERT INTO activation_payments (id, user_id, user_name, user_email, amount, reference, status, paid_at, created_at)
        VALUES ($1,$2,$3,$4,0,$5,'ManualActivation',$6,$7)
        ON CONFLICT (user_id) DO UPDATE SET status='ManualActivation', paid_at=$6
      `, [
        "ap-" + Math.random().toString(36).substr(2, 9),
        userId,
        userRes.rows[0].name,
        userRes.rows[0].email,
        "MANUAL-" + Math.random().toString(36).substr(2, 8).toUpperCase(),
        now,
        now
      ]);
    }
    const updated = await pool.query("SELECT * FROM users WHERE id=$1", [userId]);
    return res.json({ success: true, user: mapUser(updated.rows[0]) });
  } catch (err) {
    console.error("Admin activate/deactivate error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
(async () => {
  try {
    await bootstrapTables();
    await seedDatabase();
    await ensurePlatformsSeeded();
    await startServer();
  } catch (err) {
    console.error("FATAL: Failed to start server:", err);
    process.exit(1);
  }
})();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
