import pg from "pg";
import { 
  UserRole, 
  TaskStatus, 
  SubmissionStatus, 
  TransactionType, 
  TransactionStatus, 
  TaskCategory,
  Platform
} from "./types.js";

const { Pool } = pg;

let pool: pg.Pool | null = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Necessary for connection to Railway/hosted Postgres instances
    }
  });
  console.log("PostgreSQL Pool initialized with DATABASE_URL");
}

export function isPostgresEnabled(): boolean {
  return !!pool;
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function mapRowToCamel(row: any): any {
  if (!row) return row;
  const result: any = {};
  for (const key of Object.keys(row)) {
    let val = row[key];
    if (typeof val === "string" && !isNaN(Number(val)) && (
      key.includes("balance") || 
      key.includes("reward") || 
      key.includes("fee") || 
      key.includes("min_") || 
      key.includes("cost_") || 
      key.includes("_slot") ||
      key.includes("amount")
    )) {
      val = Number(val);
    }
    if (key === "is_verified" || key === "active" || key === "is_default" || key === "is_activated") {
      val = val === true || val === 1 || val === "1";
    }
    result[snakeToCamel(key)] = val;
  }
  return result;
}

export async function bootstrapTables() {
  if (!pool) return;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Earner',
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        is_activated BOOLEAN NOT NULL DEFAULT FALSE,
        wallet_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        referral_code VARCHAR(50) NULL,
        referred_by VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Safe migration: add is_activated to existing tables that predate this column
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_activated BOOLEAN NOT NULL DEFAULT FALSE
    `);

    // 2. Tasks table
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
        advertiser_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        advertiser_name VARCHAR(150) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Submissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id VARCHAR(50) PRIMARY KEY,
        task_id VARCHAR(50) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        task_title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        earner_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        earner_name VARCHAR(150) NOT NULL,
        proof_text TEXT NOT NULL,
        proof_screenshot VARCHAR(255) NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        feedback TEXT NULL,
        reward DECIMAL(10, 2) NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_name VARCHAR(150) NOT NULL,
        user_role VARCHAR(50) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        description VARCHAR(255) NOT NULL,
        reference VARCHAR(100) NOT NULL UNIQUE,
        gateway VARCHAR(50) NULL,
        bank_details JSONB NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Referrals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id VARCHAR(50) PRIMARY KEY,
        referrer_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referee_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referee_name VARCHAR(150) NOT NULL,
        referee_email VARCHAR(150) NOT NULL,
        reward_earned DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Announcements table
    await client.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'info',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Banners table
    await client.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        link VARCHAR(255) NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);

    // 8. Pages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL
      )
    `);

    // 9. Settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        platform_name VARCHAR(100) NOT NULL DEFAULT 'TasksEarn',
        referral_reward DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        withdrawal_fee DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
        min_withdrawal DECIMAL(10, 2) NOT NULL DEFAULT 2000.00,
        min_deposit DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
        contact_email VARCHAR(150) NOT NULL DEFAULT 'support@tasksearn.com',
        contact_phone VARCHAR(50) NOT NULL DEFAULT '+234 812 345 6789',
        telegram_channel VARCHAR(255) NULL,
        whatsapp_group VARCHAR(255) NULL
      )
    `);

    // 10. Task Pricing table
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_pricing (
        id VARCHAR(50) PRIMARY KEY,
        platform VARCHAR(100) NOT NULL,
        cost_per_slot DECIMAL(10, 2) NOT NULL,
        earning_per_slot DECIMAL(10, 2) NOT NULL
      )
    `);

    // 11. Owner Bank Accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS owner_bank_accounts (
        id VARCHAR(50) PRIMARY KEY,
        bank_name VARCHAR(150) NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        account_name VARCHAR(150) NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);

    // 12. Owner Withdrawals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS owner_withdrawals (
        id VARCHAR(50) PRIMARY KEY,
        amount DECIMAL(15, 2) NOT NULL,
        bank_account_id VARCHAR(50) NOT NULL REFERENCES owner_bank_accounts(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query("COMMIT");
    console.log("PostgreSQL database tables verified & bootstrapped successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error bootstrapping database tables:", err);
  } finally {
    client.release();
  }
}

export async function loadFromPostgres(defaultDb: any): Promise<any> {
  if (!pool) return defaultDb;

  await bootstrapTables();

  const client = await pool.connect();
  try {
    const usersRes = await client.query("SELECT * FROM users");
    const tasksRes = await client.query("SELECT * FROM tasks");
    const submissionsRes = await client.query("SELECT * FROM submissions");
    const transactionsRes = await client.query("SELECT * FROM transactions");
    const referralsRes = await client.query("SELECT * FROM referrals");
    const announcementsRes = await client.query("SELECT * FROM announcements");
    const bannersRes = await client.query("SELECT * FROM banners");
    const pagesRes = await client.query("SELECT * FROM pages");
    const settingsRes = await client.query("SELECT * FROM settings ORDER BY id ASC LIMIT 1");
    const pricingRes = await client.query("SELECT * FROM task_pricing");
    const ownerBankAccountsRes = await client.query("SELECT * FROM owner_bank_accounts");
    const ownerWithdrawalsRes = await client.query("SELECT * FROM owner_withdrawals");

    // Map rows to camelCase JS objects
    const users = usersRes.rows.map(mapRowToCamel);
    const tasks = tasksRes.rows.map(mapRowToCamel);
    const submissions = submissionsRes.rows.map(mapRowToCamel);
    
    const transactions = transactionsRes.rows.map(row => {
      const camel = mapRowToCamel(row);
      if (typeof camel.bankDetails === "string") {
        try {
          camel.bankDetails = JSON.parse(camel.bankDetails);
        } catch (e) {}
      }
      return camel;
    });

    const referrals = referralsRes.rows.map(mapRowToCamel);
    const announcements = announcementsRes.rows.map(mapRowToCamel);
    const banners = bannersRes.rows.map(mapRowToCamel);
    const taskPricing = pricingRes.rows.map(mapRowToCamel);

    const pages: { [key: string]: { title: string; content: string } } = {};
    pagesRes.rows.forEach(row => {
      pages[row.id] = { title: row.title, content: row.content };
    });

    let settings = defaultDb.settings;
    if (settingsRes.rows.length > 0) {
      settings = mapRowToCamel(settingsRes.rows[0]);
    } else {
      // Seed default settings into Postgres
      await client.query(`
        INSERT INTO settings (id, platform_name, referral_reward, withdrawal_fee, min_withdrawal, min_deposit, contact_email, contact_phone, telegram_channel, whatsapp_group)
        VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [
        defaultDb.settings.platformName,
        defaultDb.settings.referralReward,
        defaultDb.settings.withdrawalFee,
        defaultDb.settings.minWithdrawal,
        defaultDb.settings.minDeposit,
        defaultDb.settings.contactEmail,
        defaultDb.settings.contactPhone,
        defaultDb.settings.telegramChannel,
        defaultDb.settings.whatsappGroup
      ]);
    }

    const bankAccounts = ownerBankAccountsRes.rows.map(mapRowToCamel);
    const withdrawals = ownerWithdrawalsRes.rows.map(mapRowToCamel);

    console.log(`Successfully loaded database state from PostgreSQL:
      - Users: ${users.length}
      - Tasks: ${tasks.length}
      - Submissions: ${submissions.length}
      - Transactions: ${transactions.length}
      - Settings loaded from DB
    `);

    return {
      users,
      tasks,
      submissions,
      transactions,
      referrals,
      announcements,
      banners,
      pages,
      settings,
      taskPricing: taskPricing.length > 0 ? taskPricing : defaultDb.taskPricing,
      ownerEarnings: {
        bankAccounts,
        withdrawals
      },
      notifications: defaultDb.notifications || [] // Keep transient UI notifications in memory
    };
  } catch (err) {
    console.error("Failed to load state from PostgreSQL, falling back to db.json", err);
    return defaultDb;
  } finally {
    client.release();
  }
}

export async function saveToPostgres(db: any) {
  if (!pool) return;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Sync Users
    for (const u of db.users) {
      await client.query(`
        INSERT INTO users (id, name, email, password, role, is_verified, is_activated, wallet_balance, referral_code, referred_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          password = EXCLUDED.password,
          role = EXCLUDED.role,
          is_verified = EXCLUDED.is_verified,
          is_activated = EXCLUDED.is_activated,
          wallet_balance = EXCLUDED.wallet_balance,
          referral_code = EXCLUDED.referral_code,
          referred_by = EXCLUDED.referred_by,
          created_at = EXCLUDED.created_at
      `, [u.id, u.name, u.email, u.password, u.role, u.isVerified, u.isActivated ?? false, u.walletBalance, u.referralCode, u.referredBy, u.createdAt]);
    }

    // 2. Sync Tasks
    for (const t of db.tasks) {
      await client.query(`
        INSERT INTO tasks (id, title, description, category, proof_requirements, link, cost_per_slot, earning_per_slot, total_slots, filled_slots, status, advertiser_id, advertiser_name, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          proof_requirements = EXCLUDED.proof_requirements,
          link = EXCLUDED.link,
          cost_per_slot = EXCLUDED.cost_per_slot,
          earning_per_slot = EXCLUDED.earning_per_slot,
          total_slots = EXCLUDED.total_slots,
          filled_slots = EXCLUDED.filled_slots,
          status = EXCLUDED.status,
          advertiser_id = EXCLUDED.advertiser_id,
          advertiser_name = EXCLUDED.advertiser_name,
          created_at = EXCLUDED.created_at
      `, [t.id, t.title, t.description, t.category, t.proofRequirements, t.link, t.costPerSlot, t.earningPerSlot, t.totalSlots, t.filledSlots, t.status, t.advertiserId, t.advertiserName, t.createdAt]);
    }

    // 3. Sync Submissions
    for (const s of db.submissions) {
      await client.query(`
        INSERT INTO submissions (id, task_id, task_title, category, earner_id, earner_name, proof_text, proof_screenshot, status, feedback, reward, submitted_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          task_id = EXCLUDED.task_id,
          task_title = EXCLUDED.task_title,
          category = EXCLUDED.category,
          earner_id = EXCLUDED.earner_id,
          earner_name = EXCLUDED.earner_name,
          proof_text = EXCLUDED.proof_text,
          proof_screenshot = EXCLUDED.proof_screenshot,
          status = EXCLUDED.status,
          feedback = EXCLUDED.feedback,
          reward = EXCLUDED.reward,
          submitted_at = EXCLUDED.submitted_at
      `, [s.id, s.taskId, s.taskTitle, s.category, s.earnerId, s.earnerName, s.proofText, s.proofScreenshot, s.status, s.feedback, s.reward, s.submittedAt]);
    }

    // 4. Sync Transactions
    for (const tx of db.transactions) {
      const bankDetailsJson = tx.bankDetails ? JSON.stringify(tx.bankDetails) : null;
      await client.query(`
        INSERT INTO transactions (id, user_id, user_name, user_role, amount, type, status, description, reference, gateway, bank_details, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          user_name = EXCLUDED.user_name,
          user_role = EXCLUDED.user_role,
          amount = EXCLUDED.amount,
          type = EXCLUDED.type,
          status = EXCLUDED.status,
          description = EXCLUDED.description,
          reference = EXCLUDED.reference,
          gateway = EXCLUDED.gateway,
          bank_details = EXCLUDED.bank_details,
          created_at = EXCLUDED.created_at
      `, [tx.id, tx.userId, tx.userName, tx.userRole, tx.amount, tx.type, tx.status, tx.description, tx.reference, tx.gateway, bankDetailsJson, tx.createdAt]);
    }

    // 5. Sync Referrals
    for (const r of db.referrals) {
      await client.query(`
        INSERT INTO referrals (id, referrer_id, referee_id, referee_name, referee_email, reward_earned, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          referrer_id = EXCLUDED.referrer_id,
          referee_id = EXCLUDED.referee_id,
          referee_name = EXCLUDED.referee_name,
          referee_email = EXCLUDED.referee_email,
          reward_earned = EXCLUDED.reward_earned,
          created_at = EXCLUDED.created_at
      `, [r.id, r.referrerId, r.refereeId, r.refereeName, r.refereeEmail, r.rewardEarned, r.createdAt]);
    }

    // 6. Sync Announcements
    const annIds = db.announcements.map((a: any) => a.id);
    if (annIds.length > 0) {
      await client.query("DELETE FROM announcements WHERE id NOT IN (" + annIds.map((_: any, i: number) => `$${i + 1}`).join(", ") + ")", annIds);
    } else {
      await client.query("DELETE FROM announcements");
    }
    for (const a of db.announcements) {
      await client.query(`
        INSERT INTO announcements (id, title, content, type, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          type = EXCLUDED.type,
          created_at = EXCLUDED.created_at
      `, [a.id, a.title, a.content, a.type, a.createdAt]);
    }

    // 7. Sync Banners
    const bannerIds = db.banners.map((b: any) => b.id);
    if (bannerIds.length > 0) {
      await client.query("DELETE FROM banners WHERE id NOT IN (" + bannerIds.map((_: any, i: number) => `$${i + 1}`).join(", ") + ")", bannerIds);
    } else {
      await client.query("DELETE FROM banners");
    }
    for (const b of db.banners) {
      await client.query(`
        INSERT INTO banners (id, title, image_url, link, active)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          image_url = EXCLUDED.image_url,
          link = EXCLUDED.link,
          active = EXCLUDED.active
      `, [b.id, b.title, b.imageUrl, b.link, b.active]);
    }

    // 8. Sync Pages
    for (const id of Object.keys(db.pages)) {
      const p = db.pages[id];
      await client.query(`
        INSERT INTO pages (id, title, content)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content
      `, [id, p.title, p.content]);
    }

    // 9. Sync Settings
    if (db.settings) {
      await client.query(`
        INSERT INTO settings (id, platform_name, referral_reward, withdrawal_fee, min_withdrawal, min_deposit, contact_email, contact_phone, telegram_channel, whatsapp_group)
        VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          platform_name = EXCLUDED.platform_name,
          referral_reward = EXCLUDED.referral_reward,
          withdrawal_fee = EXCLUDED.withdrawal_fee,
          min_withdrawal = EXCLUDED.min_withdrawal,
          min_deposit = EXCLUDED.min_deposit,
          contact_email = EXCLUDED.contact_email,
          contact_phone = EXCLUDED.contact_phone,
          telegram_channel = EXCLUDED.telegram_channel,
          whatsapp_group = EXCLUDED.whatsapp_group
      `, [
        db.settings.platformName,
        db.settings.referralReward,
        db.settings.withdrawalFee,
        db.settings.minWithdrawal,
        db.settings.minDeposit,
        db.settings.contactEmail,
        db.settings.contactPhone,
        db.settings.telegramChannel,
        db.settings.whatsappGroup
      ]);
    }

    // 10. Sync Task Pricing
    if (db.taskPricing) {
      for (const p of db.taskPricing) {
        await client.query(`
          INSERT INTO task_pricing (id, platform, cost_per_slot, earning_per_slot)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO UPDATE SET
            platform = EXCLUDED.platform,
            cost_per_slot = EXCLUDED.cost_per_slot,
            earning_per_slot = EXCLUDED.earning_per_slot
        `, [p.id, p.platform, p.costPerSlot, p.earningPerSlot]);
      }
    }

    // 11. Sync Owner Earnings Bank Accounts
    if (db.ownerEarnings?.bankAccounts) {
      const ownerBankIds = db.ownerEarnings.bankAccounts.map((ba: any) => ba.id);
      if (ownerBankIds.length > 0) {
        await client.query("DELETE FROM owner_bank_accounts WHERE id NOT IN (" + ownerBankIds.map((_: any, i: number) => `$${i + 1}`).join(", ") + ")", ownerBankIds);
      } else {
        await client.query("DELETE FROM owner_bank_accounts");
      }
      for (const ba of db.ownerEarnings.bankAccounts) {
        await client.query(`
          INSERT INTO owner_bank_accounts (id, bank_name, account_number, account_name, is_default)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE SET
            bank_name = EXCLUDED.bank_name,
            account_number = EXCLUDED.account_number,
            account_name = EXCLUDED.account_name,
            is_default = EXCLUDED.is_default
        `, [ba.id, ba.bankName, ba.accountNumber, ba.accountName, ba.isDefault]);
      }
    }

    // 12. Sync Owner Earnings Withdrawals
    if (db.ownerEarnings?.withdrawals) {
      for (const w of db.ownerEarnings.withdrawals) {
        await client.query(`
          INSERT INTO owner_withdrawals (id, amount, bank_account_id, status, created_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE SET
            amount = EXCLUDED.amount,
            bank_account_id = EXCLUDED.bank_account_id,
            status = EXCLUDED.status,
            created_at = EXCLUDED.created_at
        `, [w.id, w.amount, w.bankAccountId, w.status, w.createdAt]);
      }
    }

    await client.query("COMMIT");
    console.log("PostgreSQL database state synchronized successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error synchronizing state to PostgreSQL:", err);
  } finally {
    client.release();
  }
}
