import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import { createServer as createHttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { 
  UserRole, 
  TaskStatus, 
  SubmissionStatus, 
  TransactionType, 
  TransactionStatus, 
  TaskCategory,
  AdminNotification
} from "./src/types.js";

const PORT = Number(process.env.PORT) || 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Helper for Sha256 hashing
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// In-Memory DB state representing all database tables
let db: {
  users: any[];
  tasks: any[];
  submissions: any[];
  transactions: any[];
  referrals: any[];
  announcements: any[];
  banners: any[];
  notifications: AdminNotification[];
  pages: { [key: string]: { title: string; content: string } };
  settings: {
    platformName: string;
    referralReward: number;
    withdrawalFee: number;
    minWithdrawal: number;
    minDeposit: number;
    contactEmail: string;
    contactPhone: string;
    telegramChannel?: string;
    whatsappGroup?: string;
  };
} = {
  users: [],
  tasks: [],
  submissions: [],
  transactions: [],
  referrals: [],
  announcements: [],
  banners: [],
  notifications: [],
  pages: {},

  settings: {
    platformName: "TasksEarn",
    referralReward: 200,
    withdrawalFee: 100,
    minWithdrawal: 2000,
    minDeposit: 1000,
    contactEmail: "support@tasksearn.com",
    contactPhone: "09164444315",
    telegramChannel: "https://t.me/tasksearn_ng",
    whatsappGroup: "https://wa.me/2349164444315"
  }
};

// Initialize DB file if not exists, otherwise load it
function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      // Ensure arrays and objects exist
      if (!db.users) db.users = [];
      if (!db.tasks) db.tasks = [];
      if (!db.submissions) db.submissions = [];
      if (!db.transactions) db.transactions = [];
      if (!db.referrals) db.referrals = [];
      if (!db.announcements) db.announcements = [];
      if (!db.banners) db.banners = [];
      if (!db.notifications) db.notifications = [];
      if (!db.pages) db.pages = {};
      if (!db.settings) {
        db.settings = {
          platformName: "TasksEarn",
          referralReward: 200,
          withdrawalFee: 100,
          minWithdrawal: 2000,
          minDeposit: 1000,
          contactEmail: "support@tasksearn.com",
          contactPhone: "09164444315",
          telegramChannel: "https://t.me/tasksearn_ng",
          whatsappGroup: "https://wa.me/2349164444315"
        };
      }
      return;
    } catch (e) {
      console.error("Error reading db.json, generating default database...", e);
    }
  }

  // Generate Seed Data
  const adminId = "u-admin-1";
  const earnerId = "u-earner-1";
  const advertiserId = "u-advertiser-1";

  db.users = [
    {
      id: adminId,
      name: "Super Admin",
      email: "admin@tasksearn.com",
      password: hashPassword("password123"),
      role: UserRole.ADMIN,
      isVerified: true,
      walletBalance: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: earnerId,
      name: "Tunde Bakare",
      email: "earner@tasksearn.com",
      password: hashPassword("password123"),
      role: UserRole.EARNER,
      isVerified: true,
      walletBalance: 2500, // Naira
      referralCode: "TUNDE887",
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() // 10 days ago
    },
    {
      id: advertiserId,
      name: "Chinedu Okafor",
      email: "advertiser@tasksearn.com",
      password: hashPassword("password123"),
      role: UserRole.ADVERTISER,
      isVerified: true,
      walletBalance: 35000, // Naira
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() // 15 days ago
    }
  ];

  db.tasks = [
    {
      id: "task-1",
      title: "YouTube Subscribe - TechNaija Channel",
      description: "Go to the YouTube channel link, click Subscribe, and upload a screenshot proving you subscribed. No unsubscribing later, we audit accounts daily.",
      category: TaskCategory.YT_SUBSCRIBE,
      proofRequirements: "Your YouTube account username and a screenshot showing the Subscribe button clicked.",
      link: "https://youtube.com/c/technaija",
      costPerSlot: 20,
      earningPerSlot: 15,
      totalSlots: 200,
      filledSlots: 87,
      status: TaskStatus.ACTIVE,
      advertiserId: advertiserId,
      advertiserName: "Chinedu Okafor",
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "task-2",
      title: "Instagram Follow @gossipmill_ng",
      description: "Follow GossipMill Nigeria on Instagram, like the latest 3 posts, and submit a screenshot showing the Followed status.",
      category: TaskCategory.IG_FOLLOW,
      proofRequirements: "Your Instagram profile handle (@username) and follow screenshot.",
      link: "https://instagram.com/gossipmill_ng",
      costPerSlot: 15,
      earningPerSlot: 10,
      totalSlots: 150,
      filledSlots: 142,
      status: TaskStatus.ACTIVE,
      advertiserId: advertiserId,
      advertiserName: "Chinedu Okafor",
      createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "task-3",
      title: "Telegram Group Join - Crypto Signals NG",
      description: "Join our active Telegram channel and group. Do not leave, users who leave will be permanently banned.",
      category: TaskCategory.TELEGRAM_JOIN,
      proofRequirements: "Telegram username (e.g. @username) and screenshot showing you joined.",
      link: "https://t.me/cryptosignalsng",
      costPerSlot: 18,
      earningPerSlot: 12,
      totalSlots: 100,
      filledSlots: 98,
      status: TaskStatus.ACTIVE,
      advertiserId: advertiserId,
      advertiserName: "Chinedu Okafor",
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "task-4",
      title: "Facebook Follow - TasksEarn Platform",
      description: "Follow our official Facebook page to stay updated on high-paying campaigns.",
      category: TaskCategory.FB_FOLLOW,
      proofRequirements: "Your Facebook profile link or name, and follow screenshot.",
      link: "https://facebook.com/tasksearn",
      costPerSlot: 15,
      earningPerSlot: 10,
      totalSlots: 500,
      filledSlots: 500,
      status: TaskStatus.COMPLETED,
      advertiserId: "u-admin-1",
      advertiserName: "Super Admin",
      createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString()
    }
  ];

  db.submissions = [
    {
      id: "sub-1",
      taskId: "task-1",
      taskTitle: "YouTube Subscribe - TechNaija Channel",
      category: TaskCategory.YT_SUBSCRIBE,
      earnerId: earnerId,
      earnerName: "Tunde Bakare",
      proofText: "My YouTube username: @tunde_tech_99",
      proofScreenshot: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      status: SubmissionStatus.APPROVED,
      reward: 15,
      submittedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "sub-2",
      taskId: "task-2",
      taskTitle: "Instagram Follow @gossipmill_ng",
      category: TaskCategory.IG_FOLLOW,
      earnerId: earnerId,
      earnerName: "Tunde Bakare",
      proofText: "Username: @tunde_bakare_official",
      proofScreenshot: "https://images.unsplash.com/photo-1611224885990-ab7363d1f2a9?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      status: SubmissionStatus.PENDING,
      reward: 10,
      submittedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString() // 3 hours ago
    }
  ];

  db.transactions = [
    {
      id: "tx-1",
      userId: advertiserId,
      userName: "Chinedu Okafor",
      userRole: UserRole.ADVERTISER,
      amount: 50000,
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.SUCCESS,
      description: "Wallet Funding via Paystack Card Payment",
      reference: "T-PAYSTACK-5884930294",
      gateway: "Paystack",
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "tx-2",
      userId: advertiserId,
      userName: "Chinedu Okafor",
      userRole: UserRole.ADVERTISER,
      amount: 15000,
      type: TransactionType.SPEND,
      status: TransactionStatus.SUCCESS,
      description: "Created Campaign: YouTube Subscribe - TechNaija Channel",
      reference: "T-SPEND-992384910",
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "tx-3",
      userId: earnerId,
      userName: "Tunde Bakare",
      userRole: UserRole.EARNER,
      amount: 2500,
      type: TransactionType.WITHDRAWAL,
      status: TransactionStatus.PENDING,
      description: "Withdrawal request to Guaranty Trust Bank (GTB)",
      reference: "W-GTB-48203949",
      bankDetails: {
        bankName: "Guaranty Trust Bank (GTB)",
        accountNumber: "0123456789",
        accountName: "Tunde Bakare"
      },
      createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    }
  ];

  db.referrals = [
    {
      id: "ref-1",
      referrerId: earnerId,
      refereeId: "u-referee-1",
      refereeName: "Sola Alabi",
      refereeEmail: "sola@example.com",
      rewardEarned: 200,
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    }
  ];

  db.announcements = [
    {
      id: "ann-1",
      title: "Welcome to TasksEarn Platform",
      content: "Welcome Nigerians to the most trusted social media microtask exchange platform! Advertisers can publish tasks, and Earners can complete simple tasks and earn directly in Naira (₦) paid to their local bank accounts.",
      type: "success",
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "ann-2",
      title: "Withdrawal Process Audits",
      content: "Withdrawal requests are processed every Friday at 12:00 PM. Please ensure your submitted bank details are accurate and your name matches your verification profile to avoid rejections.",
      type: "info",
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    }
  ];

  db.banners = [
    {
      id: "ban-1",
      title: "Boost Your Social Media Reach Instantly",
      imageUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&auto=format&fit=crop&q=80",
      link: "/advertiser/dashboard",
      active: true
    },
    {
      id: "ban-2",
      title: "Earn Up to ₦5,000 Daily From Home",
      imageUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&auto=format&fit=crop&q=80",
      link: "/dashboard",
      active: true
    }
  ];

  db.pages = {
    about: {
      title: "About TasksEarn",
      content: `TasksEarn is Nigeria's premier microtask marketplace designed to bridge the gap between digital content advertisers and micro-job earners. Built to support digital marketers, small business owners, and online earners across Nigeria, we enable seamless social media engagements on platforms like Facebook, Instagram, TikTok, YouTube, WhatsApp, and Telegram.

Our mission is to empower thousands of young Nigerians to monetize their spare social media screen-time, while providing advertisers with cost-effective, organic, and highly targeted growth.

Why Choose TasksEarn?
- Instant Wallet Funding: Easily fund your advertising wallet using local cards, bank transfers, OPay, Moniepoint, and PalmPay.
- Quality Auditing: Our advanced screenshot & link proof engine allows advertisers and administrators to verify proof with ultimate precision before release of payouts.
- Swift Withdrawals: Withdraw your earnings straight into any Nigerian bank, with payouts processed seamlessly.
- Robust Referral Network: Earn generous referral bonuses for every friend you introduce to the platform who completes tasks or creates campaigns.`
    },
    contact: {
      title: "Contact Us",
      content: `Have questions, disputes, or looking to discuss custom high-volume ad packages? Our friendly support team is here to assist you 24/7.

- Email Support: support@tasksearn.com
- Phone Contact: 09164444315
- WhatsApp Support: 09164444315
- Telegram Support: @TasksEarnSupport
- Office Address: 12, Herbert Macaulay Way, Yaba, Lagos State, Nigeria.

Alternatively, you can join our Telegram announcements channel and WhatsApp support chat using the quick links on your dashboard.`
    },
    faq: {
      title: "Frequently Asked Questions",
      content: `### 1. What is TasksEarn?
TasksEarn is a digital engagement community where advertisers pay everyday social media users (Earners) to perform small online tasks such as liking a Facebook page, subscribing to a YouTube channel, following an Instagram profile, or joining a Telegram community.

### 2. How much can I earn as an Earner?
There is no fixed limit! Your earnings depend on how many tasks you successfully complete. Tasks are rewarded between ₦10 and ₦500 depending on complexity. Active earners can withdraw thousands of Naira weekly.

### 3. What is the minimum withdrawal and deposit?
- Minimum Withdrawal: ₦2,000 (with a standard flat fee of ₦100 per transaction).
- Minimum Deposit for Advertisers: ₦1,000.

### 4. How long does deposit and withdrawal validation take?
- Deposits via Paystack card payment are credited **instantly**. Bank transfer deposits are confirmed by our system inside 1 hour.
- Withdrawals are processed on our payout cycles every week, usually within 24 to 48 hours of approval.

### 5. Why was my task submission rejected?
A submission is rejected if you did not follow the instructions, if you did not complete the social media action, or if you submitted fake/unrelated screenshots. Submitting fraudulent proofs repeatedly will lead to permanent account suspension.`
    },
    terms: {
      title: "Terms of Service",
      content: `Welcome to TasksEarn ("the Platform"). By registering an account and using our services, you agree to comply with and be bound by the following Terms and Conditions:

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
- TasksEarn reserves the right to charge transaction fees on deposits (payment gateway charge) and withdrawals (₦100 flat fee). Fees are clearly stated at checkout.`
    },
    privacy: {
      title: "Privacy Policy",
      content: `Your privacy is incredibly important to us at TasksEarn. This Privacy Policy outlines the types of personal information we collect and how we safeguard it:

1. Information We Collect
- Contact Details: Name, email address, telephone number, and Nigerian bank details (for withdrawal processing).
- Verification Proofs: Text usernames, social media handle names, and screenshots submitted as proof of task completion.
- Network Data: IP addresses and browser details to protect our community against automated bot attacks and multi-account fraud.

2. How We Use Your Data
- To manage your secure login, calculate referral bonuses, process deposits, and credit bank payouts.
- Verification proofs are made visible ONLY to the advertiser of that specific campaign and the platform administrators for auditing purposes. We do not sell or trade your visual data to third parties.

3. Cookies and Browser Cache
- We use temporary cookies and local session identifiers to keep you logged in securely while navigating the app dashboard.`
    }
  };

  saveDB();
}

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

// Initialize Database on startup
loadDB();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Helper to check Auth headers
// For simplified secure simulation, we will send the User-ID in the Authorization header.
// E.g., 'Bearer <userId>'
function getAuthenticatedUser(req: express.Request): any | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const userId = authHeader.split(" ")[1];
  return db.users.find(u => u.id === userId) || null;
}

// Lazy initialization of Resend client to avoid startup crashes if key is missing
let resendClient: Resend | null = null;
function getResendClient(): Resend | null {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      resendClient = new Resend(apiKey);
    }
  }
  return resendClient;
}

async function sendVerificationEmail(email: string, name: string, code: string) {
  const client = getResendClient();
  if (!client) {
    console.warn(`[Resend Email Simulation] No RESEND_API_KEY. Verification code for ${email} is: ${code}`);
    return { success: true, simulated: true, code };
  }
  
  try {
    const data = await client.emails.send({
      from: "TasksEarn <noreply@tasksearn.com>",
      to: [email],
      subject: "Verify your TasksEarn Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #4f46e5; text-align: center;">Welcome to TasksEarn</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering on TasksEarn. To complete your registration and activate your account, please verify your email address using the 6-digit verification code below:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code is valid for 10 minutes. If you did not request this registration, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="text-align: center; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} TasksEarn Nigeria. All rights reserved.</p>
        </div>
      `
    });
    console.log(`[Resend Email Success] Verification email sent to ${email}`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`[Resend Email Error] Failed to send email to ${email}`, error);
    throw error;
  }
}

// -----------------------------------------------------------------------------
// PUBLIC API ENDPOINTS
// -----------------------------------------------------------------------------
app.get("/api/public/pages", (req, res) => {
  res.json(db.pages);
});

app.get("/api/public/banners", (req, res) => {
  res.json(db.banners.filter(b => b.active));
});

app.get("/api/public/announcements", (req, res) => {
  res.json(db.announcements);
});

app.get("/api/public/settings", (req, res) => {
  res.json(db.settings);
});

// -----------------------------------------------------------------------------
// AUTHENTICATION API ENDPOINTS
// -----------------------------------------------------------------------------
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, role, referralCode } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "Email address already registered" });
  }

  // Create referral code for new earner
  const userReferralCode = role === UserRole.EARNER ? name.substring(0, 4).toUpperCase() + Math.floor(100 + Math.random() * 900) : undefined;
  const userId = "u-" + Math.random().toString(36).substr(2, 9);

  let referredByUserId: string | undefined;
  if (referralCode && role === UserRole.EARNER) {
    const referrer = db.users.find(u => u.referralCode === referralCode && u.role === UserRole.EARNER);
    if (referrer) {
      referredByUserId = referrer.id;
    }
  }

  // Generate 6-digit verification code with 10-minute expiry
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const verificationCodeLastSent = new Date().toISOString();

  const newUser = {
    id: userId,
    name,
    email,
    password: hashPassword(password),
    role,
    isVerified: false, // Starts unverified to enforce email verification
    verificationCode,
    verificationCodeExpires,
    verificationCodeLastSent,
    walletBalance: 0, // Starts at 0
    referralCode: userReferralCode,
    referredBy: referredByUserId,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);

  // If referred, log the referral relation
  if (referredByUserId) {
    const referrer = db.users.find(u => u.id === referredByUserId);
    db.referrals.push({
      id: "ref-" + Math.random().toString(36).substr(2, 9),
      referrerId: referredByUserId,
      refereeId: userId,
      refereeName: name,
      refereeEmail: email,
      rewardEarned: db.settings.referralReward,
      createdAt: new Date().toISOString()
    });
    // Add referral bonus to referrer immediately
    referrer.walletBalance += db.settings.referralReward;

    db.transactions.push({
      id: "tx-" + Math.random().toString(36).substr(2, 9),
      userId: referredByUserId,
      userName: referrer.name,
      userRole: referrer.role,
      amount: db.settings.referralReward,
      type: TransactionType.REFERRAL,
      status: TransactionStatus.SUCCESS,
      description: `Referral bonus for inviting ${name}`,
      reference: "R-REF-" + Math.floor(10000000 + Math.random() * 90000000),
      createdAt: new Date().toISOString()
    });
  }

  saveDB();

  // Send the verification email using Resend
  try {
    await sendVerificationEmail(email, name, verificationCode);
  } catch (err) {
    console.error("Failed to send verification email on registration: ", err);
    // Continue registration so the user is saved; they can retry resending from the verification UI
  }

  // Return the user (omit password)
  const { password: _, verificationCode: __, verificationCodeExpires: ___, ...userWithoutSecrets } = newUser;
  res.json({ user: userWithoutSecrets });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const matchedUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!matchedUser) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const hashedPassword = hashPassword(password);
  if (matchedUser.password !== hashedPassword) {
    // Return specific 'Invalid password' error for the demo accounts
    const isDemo = ["admin@tasksearn.com", "earner@tasksearn.com", "advertiser@tasksearn.com"].includes(matchedUser.email.toLowerCase());
    if (isDemo) {
      return res.status(401).json({ error: "Invalid password" });
    }
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Check email verification gate
  if (!matchedUser.isVerified) {
    return res.status(400).json({ 
      error: "EMAIL_NOT_VERIFIED", 
      userId: matchedUser.id, 
      email: matchedUser.email 
    });
  }

  const { password: _, verificationCode: __, verificationCodeExpires: ___, ...userWithoutSecrets } = matchedUser;
  res.json({ user: userWithoutSecrets });
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email address is required" });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "No account found with this email address." });
  }

  // Simulate sending password recovery instructions
  res.json({
    success: true,
    message: "Password recovery instructions have been successfully sent to " + email + "."
  });
});

app.post("/api/auth/verify-email", (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Email and 6-digit code are required" });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "User account not found" });
  }

  if (user.isVerified) {
    const { password: _, verificationCode: __, verificationCodeExpires: ___, ...userWithoutSecrets } = user;
    return res.json({ success: true, message: "Account already verified", user: userWithoutSecrets });
  }

  if (!user.verificationCode || user.verificationCode !== code) {
    return res.status(400).json({ error: "Invalid 6-digit verification code" });
  }

  const isExpired = new Date(user.verificationCodeExpires).getTime() < Date.now();
  if (isExpired) {
    return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
  }

  // Verification succeeds
  user.isVerified = true;
  delete user.verificationCode;
  delete user.verificationCodeExpires;
  delete user.verificationCodeLastSent;
  
  saveDB();

  const { password: _, ...userWithoutSecrets } = user;
  res.json({ success: true, message: "Email successfully verified!", user: userWithoutSecrets });
});

app.post("/api/auth/resend-code", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email address is required" });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "User account not found" });
  }

  // Rate limit: 60 seconds
  const lastSent = user.verificationCodeLastSent ? new Date(user.verificationCodeLastSent).getTime() : 0;
  const elapsed = Date.now() - lastSent;
  if (elapsed < 60 * 1000) {
    const remainingSeconds = Math.ceil((60 * 1000 - elapsed) / 1000);
    return res.status(429).json({ error: `Please wait ${remainingSeconds} seconds before requesting a new code.` });
  }

  // Generate new code
  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.verificationCode = newCode;
  user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  user.verificationCodeLastSent = new Date().toISOString();

  saveDB();

  try {
    await sendVerificationEmail(user.email, user.name, newCode);
    res.json({ success: true, message: "A new 6-digit verification code has been successfully sent." });
  } catch (err) {
    console.error("Resend verification code failed: ", err);
    res.status(500).json({ error: "Failed to deliver email. Please try again." });
  }
});

app.get("/api/auth/me", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { password: _, verificationCode: __, verificationCodeExpires: ___, ...userWithoutSecrets } = user;
  res.json({ user: userWithoutSecrets });
});

// -----------------------------------------------------------------------------
// EARNER API ENDPOINTS
// -----------------------------------------------------------------------------
app.get("/api/earner/dashboard", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.EARNER) return res.status(403).json({ error: "Access denied" });

  const userSubmissions = db.submissions.filter(s => s.earnerId === user.id);
  const approved = userSubmissions.filter(s => s.status === SubmissionStatus.APPROVED);
  const pending = userSubmissions.filter(s => s.status === SubmissionStatus.PENDING);
  const rejected = userSubmissions.filter(s => s.status === SubmissionStatus.REJECTED);

  const totalEarned = approved.reduce((sum, s) => sum + s.reward, 0);

  // Referral count
  const referralsCount = db.referrals.filter(r => r.referrerId === user.id).length;

  // Let's get active available tasks
  // Filter out tasks already completed or submitted by this earner
  const submittedTaskIds = userSubmissions.map(s => s.taskId);
  const availableTasks = db.tasks.filter(t => t.status === TaskStatus.ACTIVE && !submittedTaskIds.includes(t.id));

  res.json({
    walletBalance: user.walletBalance,
    totalEarned,
    approvedCount: approved.length,
    pendingCount: pending.length,
    rejectedCount: rejected.length,
    referralsCount,
    availableTasksCount: availableTasks.length,
    recentSubmissions: userSubmissions.slice(-5).reverse(),
    referralCode: user.referralCode
  });
});

app.get("/api/earner/tasks", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.EARNER) return res.status(403).json({ error: "Access denied" });

  // Get tasks and mark if already submitted
  const userSubmissions = db.submissions.filter(s => s.earnerId === user.id);
  const submittedMap = new Map(userSubmissions.map(s => [s.taskId, s.status]));

  const tasksWithStatus = db.tasks
    .filter(t => t.status === TaskStatus.ACTIVE)
    .map(t => ({
      ...t,
      submissionStatus: submittedMap.get(t.id) || null
    }));

  res.json(tasksWithStatus);
});

app.post("/api/earner/tasks/:id/submit", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.EARNER) return res.status(403).json({ error: "Access denied" });

  const taskId = req.params.id;
  const { proofText, proofScreenshot } = req.body;

  if (!proofText) {
    return res.status(400).json({ error: "Proof details are required" });
  }

  const task = db.tasks.find(t => t.id === taskId);
  if (!task || task.status !== TaskStatus.ACTIVE) {
    return res.status(404).json({ error: "Task is not active or not found" });
  }

  // Check if already submitted
  const alreadySubmitted = db.submissions.some(s => s.taskId === taskId && s.earnerId === user.id);
  if (alreadySubmitted) {
    return res.status(400).json({ error: "You have already submitted a proof for this task" });
  }

  // Check slot limits
  if (task.filledSlots >= task.totalSlots) {
    return res.status(400).json({ error: "This task has reached its submission limit" });
  }

  const defaultScreenshot = proofScreenshot || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&auto=format&fit=crop&q=60";

  const newSubmission = {
    id: "sub-" + Math.random().toString(36).substr(2, 9),
    taskId: task.id,
    taskTitle: task.title,
    category: task.category,
    earnerId: user.id,
    earnerName: user.name,
    proofText,
    proofScreenshot: defaultScreenshot,
    status: SubmissionStatus.PENDING,
    reward: task.earningPerSlot,
    submittedAt: new Date().toISOString()
  };

  db.submissions.push(newSubmission);
  
  // Note: we do NOT fill slots yet until advertiser or admin APPROVES. 
  // Let's increment filled slots only when APPROVED.

  saveDB();

  // Send real-time notification to Admin Dashboard
  notifyAdmin({
    type: "submission",
    message: `New task submission from ${user.name} for "${task.title}"`,
    referenceId: newSubmission.id
  });

  res.json({ success: true, submission: newSubmission });
});

app.get("/api/earner/submissions", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.EARNER) return res.status(403).json({ error: "Access denied" });

  const submissions = db.submissions.filter(s => s.earnerId === user.id);
  res.json(submissions.reverse());
});

app.get("/api/earner/referrals", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.EARNER) return res.status(403).json({ error: "Access denied" });

  const referrals = db.referrals.filter(r => r.referrerId === user.id);
  res.json({
    referralCode: user.referralCode,
    referralReward: db.settings.referralReward,
    referrals: referrals.reverse()
  });
});

app.post("/api/earner/withdraw", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.EARNER) return res.status(403).json({ error: "Access denied" });

  const { amount, bankName, accountNumber, accountName } = req.body;

  if (!amount || !bankName || !accountNumber || !accountName) {
    return res.status(400).json({ error: "All bank transfer fields are required" });
  }

  const withdrawAmount = parseFloat(amount);
  if (isNaN(withdrawAmount) || withdrawAmount < db.settings.minWithdrawal) {
    return res.status(400).json({ error: `Minimum withdrawal amount is ₦${db.settings.minWithdrawal}` });
  }

  // Calculate sum of all pending withdrawals to get real available balance
  const pendingWithdrawalsTotal = db.transactions
    .filter(t => t.userId === user.id && t.type === TransactionType.WITHDRAWAL && t.status === TransactionStatus.PENDING)
    .reduce((sum, t) => sum + t.amount, 0);

  const availableBalance = user.walletBalance - pendingWithdrawalsTotal;

  if (availableBalance < withdrawAmount) {
    return res.status(400).json({ 
      error: `Insufficient available balance. Your total balance is ₦${user.walletBalance.toLocaleString()}, but you have ₦${pendingWithdrawalsTotal.toLocaleString()} locked in pending withdrawals. Real available balance: ₦${availableBalance.toLocaleString()}` 
    });
  }

  // Record withdrawal request but do NOT deduct from wallet balance yet
  const txId = "tx-" + Math.random().toString(36).substr(2, 9);
  const ref = "W-BANK-" + Math.floor(10000000 + Math.random() * 90000000);

  const newTx = {
    id: txId,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    amount: withdrawAmount,
    type: TransactionType.WITHDRAWAL,
    status: TransactionStatus.PENDING,
    description: `Withdrawal to ${bankName} (${accountNumber})`,
    reference: ref,
    bankDetails: {
      bankName,
      accountNumber,
      accountName
    },
    createdAt: new Date().toISOString()
  };

  db.transactions.push(newTx);
  saveDB();

  // Send real-time notification to Admin Dashboard
  notifyAdmin({
    type: "withdrawal",
    message: `New withdrawal request of ₦${withdrawAmount.toLocaleString()} from ${user.name}`,
    referenceId: newTx.id
  });

  res.json({ 
    success: true, 
    transaction: newTx, 
    walletBalance: user.walletBalance,
    availableBalance: availableBalance - withdrawAmount 
  });
});

// -----------------------------------------------------------------------------
// ADVERTISER API ENDPOINTS
// -----------------------------------------------------------------------------
app.get("/api/advertiser/dashboard", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADVERTISER) return res.status(403).json({ error: "Access denied" });

  const advertiserTasks = db.tasks.filter(t => t.advertiserId === user.id);
  const activeCount = advertiserTasks.filter(t => t.status === TaskStatus.ACTIVE).length;
  const pausedCount = advertiserTasks.filter(t => t.status === TaskStatus.PAUSED).length;
  const completedCount = advertiserTasks.filter(t => t.status === TaskStatus.COMPLETED).length;

  const totalSpent = db.transactions
    .filter(t => t.userId === user.id && t.type === TransactionType.SPEND && t.status === TransactionStatus.SUCCESS)
    .reduce((sum, t) => sum + t.amount, 0);

  // Submissions under advertiser's tasks
  const taskIds = advertiserTasks.map(t => t.id);
  const advertiserSubmissions = db.submissions.filter(s => taskIds.includes(s.taskId));
  const pendingSubmissionsCount = advertiserSubmissions.filter(s => s.status === SubmissionStatus.PENDING).length;

  res.json({
    walletBalance: user.walletBalance,
    totalSpent,
    campaignsCount: advertiserTasks.length,
    activeCount,
    pausedCount,
    completedCount,
    pendingSubmissionsCount,
    recentTasks: advertiserTasks.slice(-5).reverse()
  });
});

app.get("/api/advertiser/tasks", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADVERTISER) return res.status(403).json({ error: "Access denied" });

  const advertiserTasks = db.tasks.filter(t => t.advertiserId === user.id);
  res.json(advertiserTasks.reverse());
});

app.post("/api/advertiser/tasks", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADVERTISER) return res.status(403).json({ error: "Access denied" });

  const { title, description, category, proofRequirements, link, earningPerSlot, totalSlots } = req.body;

  if (!title || !description || !category || !proofRequirements || !link || !earningPerSlot || !totalSlots) {
    return res.status(400).json({ error: "All campaign fields are required" });
  }

  const rewardPerSlot = parseFloat(earningPerSlot);
  const slots = parseInt(totalSlots);
  
  if (isNaN(rewardPerSlot) || rewardPerSlot <= 0 || isNaN(slots) || slots <= 0) {
    return res.status(400).json({ error: "Invalid earning value or slot count" });
  }

  // Calculate costs: TasksEarn platform takes a small commission.
  // Advertiser pays a premium: let's say 25% or flat ₦5 markup.
  const costPerSlot = Math.ceil(rewardPerSlot * 1.35); // 35% margin for platform
  const totalCampaignCost = costPerSlot * slots;

  if (user.walletBalance < totalCampaignCost) {
    return res.status(400).json({ 
      error: `Insufficient balance. This campaign costs ₦${totalCampaignCost.toLocaleString()} (₦${costPerSlot}/slot). Please fund your wallet.` 
    });
  }

  // Deduct from wallet
  user.walletBalance -= totalCampaignCost;

  const newTaskId = "task-" + Math.random().toString(36).substr(2, 9);
  const newTask = {
    id: newTaskId,
    title,
    description,
    category,
    proofRequirements,
    link,
    costPerSlot,
    earningPerSlot: rewardPerSlot,
    totalSlots: slots,
    filledSlots: 0,
    status: TaskStatus.ACTIVE,
    advertiserId: user.id,
    advertiserName: user.name,
    createdAt: new Date().toISOString()
  };

  db.tasks.push(newTask);

  // Add transaction
  db.transactions.push({
    id: "tx-" + Math.random().toString(36).substr(2, 9),
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    amount: totalCampaignCost,
    type: TransactionType.SPEND,
    status: TransactionStatus.SUCCESS,
    description: `Created Campaign: ${title}`,
    reference: "T-SPEND-" + Math.floor(10000000 + Math.random() * 90000000),
    createdAt: new Date().toISOString()
  });

  saveDB();
  res.json({ success: true, task: newTask, remainingBalance: user.walletBalance });
});

app.put("/api/advertiser/tasks/:id/toggle", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADVERTISER) return res.status(403).json({ error: "Access denied" });

  const taskId = req.params.id;
  const task = db.tasks.find(t => t.id === taskId && t.advertiserId === user.id);

  if (!task) return res.status(404).json({ error: "Task not found" });

  if (task.status === TaskStatus.ACTIVE) {
    task.status = TaskStatus.PAUSED;
  } else if (task.status === TaskStatus.PAUSED) {
    task.status = TaskStatus.ACTIVE;
  }

  saveDB();
  res.json({ success: true, task });
});

app.delete("/api/advertiser/tasks/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADVERTISER) return res.status(403).json({ error: "Access denied" });

  const taskId = req.params.id;
  const taskIdx = db.tasks.findIndex(t => t.id === taskId && t.advertiserId === user.id);

  if (taskIdx === -1) return res.status(404).json({ error: "Task not found" });

  const task = db.tasks[taskIdx];
  
  // Refund uncompleted slots
  const remainingSlots = task.totalSlots - task.filledSlots;
  if (remainingSlots > 0) {
    const refundAmount = remainingSlots * task.costPerSlot;
    user.walletBalance += refundAmount;

    db.transactions.push({
      id: "tx-" + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      amount: refundAmount,
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.SUCCESS,
      description: `Refund for deleted campaign: ${task.title} (${remainingSlots} slots)`,
      reference: "T-REFUND-" + Math.floor(10000000 + Math.random() * 90000000),
      createdAt: new Date().toISOString()
    });
  }

  db.tasks.splice(taskIdx, 1);
  saveDB();
  res.json({ success: true, refundedAmount: remainingSlots * task.costPerSlot, remainingBalance: user.walletBalance });
});

app.get("/api/advertiser/submissions", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADVERTISER) return res.status(403).json({ error: "Access denied" });

  // Get advertiser tasks
  const myTaskIds = db.tasks.filter(t => t.advertiserId === user.id).map(t => t.id);
  const submissions = db.submissions.filter(s => myTaskIds.includes(s.taskId));

  res.json(submissions.reverse());
});

app.post("/api/advertiser/submissions/:id/review", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADVERTISER) return res.status(403).json({ error: "Access denied" });

  const subId = req.params.id;
  const { status, feedback } = req.body; // status = Approved or Rejected

  if (!status || (status !== SubmissionStatus.APPROVED && status !== SubmissionStatus.REJECTED)) {
    return res.status(400).json({ error: "Invalid status selection" });
  }

  const submission = db.submissions.find(s => s.id === subId);
  if (!submission) return res.status(404).json({ error: "Submission not found" });

  // Verify this advertiser owns the task
  const task = db.tasks.find(t => t.id === submission.taskId && t.advertiserId === user.id);
  if (!task) return res.status(403).json({ error: "Unauthorized review" });

  if (submission.status !== SubmissionStatus.PENDING) {
    return res.status(400).json({ error: "Submission has already been reviewed" });
  }

  submission.status = status;
  submission.feedback = feedback || "";

  if (status === SubmissionStatus.APPROVED) {
    // 1. Credit the earner
    const earner = db.users.find(u => u.id === submission.earnerId);
    if (earner) {
      earner.walletBalance += submission.reward;
      
      db.transactions.push({
        id: "tx-" + Math.random().toString(36).substr(2, 9),
        userId: earner.id,
        userName: earner.name,
        userRole: earner.role,
        amount: submission.reward,
        type: TransactionType.EARN,
        status: TransactionStatus.SUCCESS,
        description: `Earned from task: ${task.title}`,
        reference: "E-TASK-" + Math.floor(10000000 + Math.random() * 90000000),
        createdAt: new Date().toISOString()
      });
    }

    // 2. Increment filled slots
    task.filledSlots += 1;
    if (task.filledSlots >= task.totalSlots) {
      task.status = TaskStatus.COMPLETED;
    }
  } else {
    // Rejected: advertiser is already charged at task creation time.
    // When a submission is rejected, that slot opens back up so others can do it.
    // Therefore no wallet deduction/refund occurs directly, because the slot can be taken again by another user!
    // If the advertiser wants to close the task and get refunded, they pause or delete the task.
  }

  saveDB();
  res.json({ success: true, submission });
});

app.post("/api/advertiser/deposit/initialize", async (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADVERTISER) return res.status(403).json({ error: "Access denied" });

  const { amount } = req.body;
  const depositAmount = parseFloat(amount);

  if (isNaN(depositAmount) || depositAmount < db.settings.minDeposit) {
    return res.status(400).json({ error: `Minimum deposit amount is ₦${db.settings.minDeposit}` });
  }

  const txId = "tx-" + Math.random().toString(36).substr(2, 9);
  const ref = "DEP-" + Math.floor(10000000 + Math.random() * 90000000);

  const newTx = {
    id: txId,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    amount: depositAmount,
    type: TransactionType.DEPOSIT,
    status: TransactionStatus.PENDING,
    description: "Wallet Funding via Paystack Checkout",
    reference: ref,
    gateway: "Paystack",
    createdAt: new Date().toISOString()
  };

  db.transactions.push(newTx);
  saveDB();

  const paystackKey = process.env.PAYSTACK_SECRET_KEY;
  if (paystackKey) {
    try {
      const origin = req.headers.referer || req.headers.origin || `http://localhost:${PORT}`;
      // Clean up origin trailing slash if any
      const baseOrigin = origin.endsWith("/") ? origin.slice(0, -1) : origin;
      const callbackUrl = `${baseOrigin}/#paystack_ref=${ref}`;

      const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${paystackKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: user.email,
          amount: Math.round(depositAmount * 100), // convert to kobo and ensure integer
          reference: ref,
          callback_url: callbackUrl
        })
      });

      const paystackData: any = await paystackRes.json();
      if (paystackData && paystackData.status && paystackData.data) {
        return res.json({ 
          success: true, 
          authorization_url: paystackData.data.authorization_url, 
          reference: ref 
        });
      } else {
        console.error("Paystack API error: ", paystackData);
        return res.status(500).json({ error: paystackData.message || "Failed to initialize payment gateway" });
      }
    } catch (err) {
      console.error("Paystack Initialize Fetch error: ", err);
      return res.status(500).json({ error: "Failed to connect to Paystack payment gateway" });
    }
  } else {
    // Simulated Mode for development & preview
    return res.json({ 
      success: true, 
      authorization_url: "SIMULATED", 
      reference: ref 
    });
  }
});

app.post("/api/advertiser/deposit/verify", async (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADVERTISER) return res.status(403).json({ error: "Access denied" });

  const { reference } = req.body;
  if (!reference) {
    return res.status(400).json({ error: "Transaction reference is required" });
  }

  const transaction = db.transactions.find(t => t.reference === reference && t.userId === user.id);
  if (!transaction) {
    return res.status(404).json({ error: "Transaction record not found" });
  }

  // Prevent duplicate credit
  if (transaction.status === TransactionStatus.SUCCESS) {
    return res.json({ 
      success: true, 
      alreadyProcessed: true, 
      walletBalance: user.walletBalance,
      transaction 
    });
  }

  if (transaction.status === TransactionStatus.FAILED || transaction.status === TransactionStatus.REJECTED) {
    return res.status(400).json({ error: "This transaction has already been processed as failed" });
  }

  const paystackKey = process.env.PAYSTACK_SECRET_KEY;
  if (paystackKey) {
    try {
      const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${paystackKey}`
        }
      });

      const paystackData: any = await paystackRes.json();
      if (paystackData && paystackData.status && paystackData.data) {
        const paystackStatus = paystackData.data.status;
        const paystackAmount = paystackData.data.amount / 100; // convert back from kobo

        if (paystackStatus === "success") {
          // Double check amount to prevent tampering
          if (Math.abs(paystackAmount - transaction.amount) > 0.01) {
            transaction.status = TransactionStatus.FAILED;
            saveDB();
            return res.status(400).json({ error: "Transaction amount mismatch. Audit flag raised." });
          }

          transaction.status = TransactionStatus.SUCCESS;
          user.walletBalance += transaction.amount;
          saveDB();

          return res.json({ 
            success: true, 
            walletBalance: user.walletBalance, 
            transaction 
          });
        } else {
          transaction.status = TransactionStatus.FAILED;
          saveDB();
          return res.status(400).json({ error: `Payment failed. Paystack status: ${paystackStatus}` });
        }
      } else {
        console.error("Paystack Verification Error: ", paystackData);
        return res.status(500).json({ error: "Could not verify payment status with gateway" });
      }
    } catch (err) {
      console.error("Paystack Verify Fetch error: ", err);
      return res.status(500).json({ error: "Failed to verify transaction with payment gateway" });
    }
  } else {
    // Simulated Mode: Approve deposit instantly for preview convenience
    transaction.status = TransactionStatus.SUCCESS;
    user.walletBalance += transaction.amount;
    saveDB();

    return res.json({ 
      success: true, 
      simulated: true, 
      walletBalance: user.walletBalance, 
      transaction 
    });
  }
});

// -----------------------------------------------------------------------------
// HISTORIC TRANSACTION HISTORY
// -----------------------------------------------------------------------------
app.get("/api/user/transactions", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const transactions = db.transactions.filter(t => t.userId === user.id);
  res.json(transactions.reverse());
});

// -----------------------------------------------------------------------------
// ADMIN PANEL API ENDPOINTS
// -----------------------------------------------------------------------------
app.get("/api/admin/dashboard", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

  const earners = db.users.filter(u => u.role === UserRole.EARNER);
  const advertisers = db.users.filter(u => u.role === UserRole.ADVERTISER);

  const totalEarned = db.submissions
    .filter(s => s.status === SubmissionStatus.APPROVED)
    .reduce((sum, s) => sum + s.reward, 0);

  const pendingWithdrawals = db.transactions
    .filter(t => t.type === TransactionType.WITHDRAWAL && t.status === TransactionStatus.PENDING)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDeposited = db.transactions
    .filter(t => t.type === TransactionType.DEPOSIT && t.status === TransactionStatus.SUCCESS)
    .reduce((sum, t) => sum + t.amount, 0);

  res.json({
    earnersCount: earners.length,
    advertisersCount: advertisers.length,
    tasksCount: db.tasks.length,
    totalEarned,
    pendingWithdrawals,
    totalDeposited,
    recentUsers: db.users.slice(-5).reverse(),
    recentTransactions: db.transactions.slice(-5).reverse(),
    settings: db.settings
  });
});

app.get("/api/admin/users", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

  res.json(db.users.filter(u => u.role !== UserRole.ADMIN).reverse());
});

app.put("/api/admin/users/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

  const targetId = req.params.id;
  const targetUser = db.users.find(u => u.id === targetId);
  if (!targetUser) return res.status(404).json({ error: "User not found" });

  const { walletBalance, isVerified } = req.body;

  if (walletBalance !== undefined) targetUser.walletBalance = parseFloat(walletBalance);
  if (isVerified !== undefined) targetUser.isVerified = !!isVerified;

  saveDB();
  res.json({ success: true, user: targetUser });
});

app.get("/api/admin/tasks", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

  res.json(db.tasks.reverse());
});

app.put("/api/admin/tasks/:id/status", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

  const taskId = req.params.id;
  const { status } = req.body; // Active, Paused, Completed

  const task = db.tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  task.status = status;
  saveDB();
  res.json({ success: true, task });
});

app.delete("/api/admin/tasks/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

  const taskId = req.params.id;
  const idx = db.tasks.findIndex(t => t.id === taskId);
  if (idx === -1) return res.status(404).json({ error: "Task not found" });

  db.tasks.splice(idx, 1);
  saveDB();
  res.json({ success: true });
});

app.get("/api/admin/submissions", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

  res.json(db.submissions.reverse());
});

app.post("/api/admin/submissions/:id/review", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

  const subId = req.params.id;
  const { status, feedback } = req.body;

  const submission = db.submissions.find(s => s.id === subId);
  if (!submission) return res.status(404).json({ error: "Submission not found" });

  if (submission.status !== SubmissionStatus.PENDING) {
    return res.status(400).json({ error: "Submission has already been audited" });
  }

  const task = db.tasks.find(t => t.id === submission.taskId);
  if (!task) return res.status(404).json({ error: "Associated task not found" });

  submission.status = status;
  submission.feedback = feedback || "";

  if (status === SubmissionStatus.APPROVED) {
    const earner = db.users.find(u => u.id === submission.earnerId);
    if (earner) {
      earner.walletBalance += submission.reward;
      
      db.transactions.push({
        id: "tx-" + Math.random().toString(36).substr(2, 9),
        userId: earner.id,
        userName: earner.name,
        userRole: earner.role,
        amount: submission.reward,
        type: TransactionType.EARN,
        status: TransactionStatus.SUCCESS,
        description: `Earned from task (Admin Audited): ${task.title}`,
        reference: "E-TASK-ADM-" + Math.floor(10000000 + Math.random() * 90000000),
        createdAt: new Date().toISOString()
      });
    }

    task.filledSlots += 1;
    if (task.filledSlots >= task.totalSlots) {
      task.status = TaskStatus.COMPLETED;
    }
  }

  saveDB();
  res.json({ success: true, submission });
});

app.get("/api/admin/withdrawals", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

  const withdrawals = db.transactions.filter(t => t.type === TransactionType.WITHDRAWAL);
  res.json(withdrawals.reverse());
});

app.post("/api/admin/withdrawals/:id/review", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

  const txId = req.params.id;
  const { status } = req.body; // SUCCESS or FAILED/REJECTED

  const transaction = db.transactions.find(t => t.id === txId && t.type === TransactionType.WITHDRAWAL);
  if (!transaction) return res.status(404).json({ error: "Withdrawal transaction not found" });

  if (transaction.status !== TransactionStatus.PENDING) {
    return res.status(400).json({ error: "Withdrawal already reviewed" });
  }

  const isApproved = status === TransactionStatus.SUCCESS || status === TransactionStatus.APPROVED || status === "Success" || status === "Approved";

  if (isApproved) {
    // Deduct the wallet balance now that it's approved
    const earner = db.users.find(u => u.id === transaction.userId);
    if (earner) {
      if (earner.walletBalance < transaction.amount) {
        return res.status(400).json({ error: `User has insufficient balance (₦${earner.walletBalance}) to complete this payout of ₦${transaction.amount}.` });
      }
      earner.walletBalance -= transaction.amount;
    }
    transaction.status = TransactionStatus.SUCCESS;
  } else {
    // Rejected/failed: No balance deduction needed as it was never deducted during request
    transaction.status = TransactionStatus.REJECTED;
  }

  saveDB();
  res.json({ success: true, transaction });
});

app.get("/api/admin/deposits", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

  const deposits = db.transactions.filter(t => t.type === TransactionType.DEPOSIT);
  res.json(deposits.reverse());
});

app.get("/api/admin/referrals", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

  res.json(db.referrals.reverse());
});

// Manage Announcements
app.get("/api/admin/announcements", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });
  res.json(db.announcements);
});

app.post("/api/admin/announcements", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

  const { title, content, type } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Title and Content are required" });

  const newAnn = {
    id: "ann-" + Math.random().toString(36).substr(2, 9),
    title,
    content,
    type: type || "info",
    createdAt: new Date().toISOString()
  };

  db.announcements.push(newAnn);
  saveDB();
  res.json({ success: true, announcement: newAnn });
});

app.delete("/api/admin/announcements/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

  const idx = db.announcements.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Announcement not found" });

  db.announcements.splice(idx, 1);
  saveDB();
  res.json({ success: true });
});

// Manage Banners
app.get("/api/admin/banners", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });
  res.json(db.banners);
});

app.post("/api/admin/banners", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

  const { title, imageUrl, link } = req.body;
  if (!title || !imageUrl) return res.status(400).json({ error: "Title and Image URL are required" });

  const newBanner = {
    id: "ban-" + Math.random().toString(36).substr(2, 9),
    title,
    imageUrl,
    link: link || "",
    active: true
  };

  db.banners.push(newBanner);
  saveDB();
  res.json({ success: true, banner: newBanner });
});

app.put("/api/admin/banners/:id/toggle", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

  const banner = db.banners.find(b => b.id === req.params.id);
  if (!banner) return res.status(404).json({ error: "Banner not found" });

  banner.active = !banner.active;
  saveDB();
  res.json({ success: true, banner });
});

app.delete("/api/admin/banners/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

  const idx = db.banners.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Banner not found" });

  db.banners.splice(idx, 1);
  saveDB();
  res.json({ success: true });
});

// Manage Pages Content
app.put("/api/admin/pages/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

  const pageId = req.params.id; // about, contact, faq, terms, privacy
  const { title, content } = req.body;

  if (!db.pages[pageId]) {
    db.pages[pageId] = { title: "", content: "" };
  }

  if (title) db.pages[pageId].title = title;
  if (content) db.pages[pageId].content = content;

  saveDB();
  res.json({ success: true, page: db.pages[pageId] });
});

// Manage Settings
app.get("/api/admin/settings", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });
  res.json(db.settings);
});

app.put("/api/admin/settings", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });

  const { platformName, referralReward, withdrawalFee, minWithdrawal, minDeposit, contactEmail, contactPhone, telegramChannel, whatsappGroup } = req.body;

  if (platformName) db.settings.platformName = platformName;
  if (referralReward !== undefined) db.settings.referralReward = parseFloat(referralReward);
  if (withdrawalFee !== undefined) db.settings.withdrawalFee = parseFloat(withdrawalFee);
  if (minWithdrawal !== undefined) db.settings.minWithdrawal = parseFloat(minWithdrawal);
  if (minDeposit !== undefined) db.settings.minDeposit = parseFloat(minDeposit);
  if (contactEmail) db.settings.contactEmail = contactEmail;
  if (contactPhone) db.settings.contactPhone = contactPhone;
  if (telegramChannel !== undefined) db.settings.telegramChannel = telegramChannel;
  if (whatsappGroup !== undefined) db.settings.whatsappGroup = whatsappGroup;

  saveDB();
  res.json({ success: true, settings: db.settings });
});

// -----------------------------------------------------------------------------
// WEBSOCKET & NOTIFICATION SYSTEM
// -----------------------------------------------------------------------------
const server = createHttpServer(app);
const wss = new WebSocketServer({ noServer: true });
const adminClients = new Set<WebSocket>();

wss.on("connection", (ws) => {
  console.log("[WS] Admin client connected");
  
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === "register-admin") {
        adminClients.add(ws);
        console.log("[WS] Admin client registered");
        // Send initial unread notifications count and list
        const unread = db.notifications ? db.notifications.filter(n => !n.read) : [];
        ws.send(JSON.stringify({ 
          type: "init-unread", 
          count: unread.length, 
          notifications: db.notifications || [] 
        }));
      }
    } catch (e) {
      console.error("[WS] Error parsing message:", e);
    }
  });

  ws.on("close", () => {
    adminClients.delete(ws);
    console.log("[WS] Admin client disconnected");
  });
  
  ws.on("error", (err) => {
    console.error("[WS] Socket error:", err);
    adminClients.delete(ws);
  });
});

server.on("upgrade", (request, socket, head) => {
  const { pathname } = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
  if (pathname === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  }
});

// Helper to notify admin
function notifyAdmin(notification: { type: "submission" | "withdrawal"; message: string; referenceId: string }) {
  if (!db.notifications) db.notifications = [];
  
  const newNotif: AdminNotification = {
    id: "notif-" + Math.random().toString(36).substr(2, 9),
    type: notification.type,
    message: notification.message,
    referenceId: notification.referenceId,
    createdAt: new Date().toISOString(),
    read: false
  };

  db.notifications.unshift(newNotif); // latest first
  // Limit to last 100 notifications for memory efficiency
  if (db.notifications.length > 100) {
    db.notifications = db.notifications.slice(0, 100);
  }
  saveDB();

  // Broadcast to all active admin sockets
  const payload = JSON.stringify({ type: "notification", notification: newNotif });
  adminClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Admin Notifications API Endpoints
app.get("/api/admin/notifications", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });
  
  res.json(db.notifications || []);
});

app.post("/api/admin/notifications/read-all", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });
  
  if (db.notifications) {
    db.notifications.forEach(n => n.read = true);
  }
  saveDB();
  res.json({ success: true });
});

app.post("/api/admin/notifications/:id/read", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== UserRole.ADMIN) return res.status(403).json({ error: "Access denied" });
  
  const notif = db.notifications?.find(n => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    saveDB();
  }
  res.json({ success: true, notification: notif });
});

// -----------------------------------------------------------------------------
// VITE CLIENT DEV SERVER INTEGRATION & SPA FALLBACK
// -----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[TasksEarn Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
