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
var import_fs = __toESM(require("fs"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
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
var PORT = Number(process.env.PORT) || 3e3;
var DB_FILE = import_path.default.join(process.cwd(), "db.json");
function hashPassword(password) {
  return import_crypto.default.createHash("sha256").update(password).digest("hex");
}
var db = {
  users: [],
  tasks: [],
  submissions: [],
  transactions: [],
  referrals: [],
  announcements: [],
  banners: [],
  notifications: [],
  pages: {},
  ownerEarnings: {
    bankAccounts: [],
    withdrawals: []
  },
  settings: {
    platformName: "TasksEarn",
    referralReward: 200,
    withdrawalFee: 100,
    minWithdrawal: 2e3,
    minDeposit: 1e3,
    contactEmail: "support@tasksearn.com",
    contactPhone: "09164444315",
    telegramChannel: "https://t.me/tasksearn_ng",
    whatsappGroup: "https://wa.me/2349164444315"
  },
  taskPricing: []
};
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
function loadDB() {
  if (import_fs.default.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(import_fs.default.readFileSync(DB_FILE, "utf-8"));
      if (!db.users) db.users = [];
      if (!db.tasks) db.tasks = [];
      if (!db.submissions) db.submissions = [];
      if (!db.transactions) db.transactions = [];
      if (!db.referrals) db.referrals = [];
      if (!db.announcements) db.announcements = [];
      if (!db.banners) db.banners = [];
      if (!db.notifications) db.notifications = [];
      if (!db.pages) db.pages = {};
      if (!db.taskPricing || db.taskPricing.length === 0) db.taskPricing = getInitialPricing();
      if (!db.ownerEarnings) {
        db.ownerEarnings = {
          bankAccounts: [],
          withdrawals: []
        };
      }
      if (!db.settings) {
        db.settings = {
          platformName: "TasksEarn",
          referralReward: 200,
          withdrawalFee: 100,
          minWithdrawal: 2e3,
          minDeposit: 1e3,
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
  const adminId = "u-admin-1";
  const earnerId = "u-earner-1";
  const advertiserId = "u-advertiser-1";
  db.users = [
    {
      id: adminId,
      name: "Super Admin",
      email: "admin@tasksearn.com",
      password: hashPassword("password123"),
      role: "Admin" /* ADMIN */,
      isVerified: true,
      walletBalance: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: earnerId,
      name: "Tunde Bakare",
      email: "earner@tasksearn.com",
      password: hashPassword("password123"),
      role: "Earner" /* EARNER */,
      isVerified: true,
      walletBalance: 2500,
      // Naira
      referralCode: "TUNDE887",
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1e3).toISOString()
      // 10 days ago
    },
    {
      id: advertiserId,
      name: "Chinedu Okafor",
      email: "advertiser@tasksearn.com",
      password: hashPassword("password123"),
      role: "Advertiser" /* ADVERTISER */,
      isVerified: true,
      walletBalance: 35e3,
      // Naira
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1e3).toISOString()
      // 15 days ago
    }
  ];
  db.tasks = [
    {
      id: "task-1",
      title: "YouTube Subscribe - TechNaija Channel",
      description: "Go to the YouTube channel link, click Subscribe, and upload a screenshot proving you subscribed. No unsubscribing later, we audit accounts daily.",
      category: "YouTube Subscribe" /* YT_SUBSCRIBE */,
      proofRequirements: "Your YouTube account username and a screenshot showing the Subscribe button clicked.",
      link: "https://youtube.com/c/technaija",
      costPerSlot: 20,
      earningPerSlot: 15,
      totalSlots: 200,
      filledSlots: 87,
      status: "Active" /* ACTIVE */,
      advertiserId,
      advertiserName: "Chinedu Okafor",
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1e3).toISOString()
    },
    {
      id: "task-2",
      title: "Instagram Follow @gossipmill_ng",
      description: "Follow GossipMill Nigeria on Instagram, like the latest 3 posts, and submit a screenshot showing the Followed status.",
      category: "Instagram Follow" /* IG_FOLLOW */,
      proofRequirements: "Your Instagram profile handle (@username) and follow screenshot.",
      link: "https://instagram.com/gossipmill_ng",
      costPerSlot: 15,
      earningPerSlot: 10,
      totalSlots: 150,
      filledSlots: 142,
      status: "Active" /* ACTIVE */,
      advertiserId,
      advertiserName: "Chinedu Okafor",
      createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1e3).toISOString()
    },
    {
      id: "task-3",
      title: "Telegram Group Join - Crypto Signals NG",
      description: "Join our active Telegram channel and group. Do not leave, users who leave will be permanently banned.",
      category: "Telegram Join" /* TELEGRAM_JOIN */,
      proofRequirements: "Telegram username (e.g. @username) and screenshot showing you joined.",
      link: "https://t.me/cryptosignalsng",
      costPerSlot: 18,
      earningPerSlot: 12,
      totalSlots: 100,
      filledSlots: 98,
      status: "Active" /* ACTIVE */,
      advertiserId,
      advertiserName: "Chinedu Okafor",
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1e3).toISOString()
    },
    {
      id: "task-4",
      title: "Facebook Follow - TasksEarn Platform",
      description: "Follow our official Facebook page to stay updated on high-paying campaigns.",
      category: "Facebook Follow" /* FB_FOLLOW */,
      proofRequirements: "Your Facebook profile link or name, and follow screenshot.",
      link: "https://facebook.com/tasksearn",
      costPerSlot: 15,
      earningPerSlot: 10,
      totalSlots: 500,
      filledSlots: 500,
      status: "Completed" /* COMPLETED */,
      advertiserId: "u-admin-1",
      advertiserName: "Super Admin",
      createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1e3).toISOString()
    }
  ];
  db.submissions = [
    {
      id: "sub-1",
      taskId: "task-1",
      taskTitle: "YouTube Subscribe - TechNaija Channel",
      category: "YouTube Subscribe" /* YT_SUBSCRIBE */,
      earnerId,
      earnerName: "Tunde Bakare",
      proofText: "My YouTube username: @tunde_tech_99",
      proofScreenshot: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      status: "Approved" /* APPROVED */,
      reward: 15,
      submittedAt: new Date(Date.now() - 2 * 24 * 3600 * 1e3).toISOString()
    },
    {
      id: "sub-2",
      taskId: "task-2",
      taskTitle: "Instagram Follow @gossipmill_ng",
      category: "Instagram Follow" /* IG_FOLLOW */,
      earnerId,
      earnerName: "Tunde Bakare",
      proofText: "Username: @tunde_bakare_official",
      proofScreenshot: "https://images.unsplash.com/photo-1611224885990-ab7363d1f2a9?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      status: "Pending" /* PENDING */,
      reward: 10,
      submittedAt: new Date(Date.now() - 3 * 3600 * 1e3).toISOString()
      // 3 hours ago
    }
  ];
  db.transactions = [
    {
      id: "tx-1",
      userId: advertiserId,
      userName: "Chinedu Okafor",
      userRole: "Advertiser" /* ADVERTISER */,
      amount: 5e4,
      type: "Deposit" /* DEPOSIT */,
      status: "Success" /* SUCCESS */,
      description: "Wallet Funding via Paystack Card Payment",
      reference: "T-PAYSTACK-5884930294",
      gateway: "Paystack",
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1e3).toISOString()
    },
    {
      id: "tx-2",
      userId: advertiserId,
      userName: "Chinedu Okafor",
      userRole: "Advertiser" /* ADVERTISER */,
      amount: 15e3,
      type: "Campaign Spend" /* SPEND */,
      status: "Success" /* SUCCESS */,
      description: "Created Campaign: YouTube Subscribe - TechNaija Channel",
      reference: "T-SPEND-992384910",
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1e3).toISOString()
    },
    {
      id: "tx-3",
      userId: earnerId,
      userName: "Tunde Bakare",
      userRole: "Earner" /* EARNER */,
      amount: 2500,
      type: "Withdrawal" /* WITHDRAWAL */,
      status: "Pending" /* PENDING */,
      description: "Withdrawal request to Guaranty Trust Bank (GTB)",
      reference: "W-GTB-48203949",
      bankDetails: {
        bankName: "Guaranty Trust Bank (GTB)",
        accountNumber: "0123456789",
        accountName: "Tunde Bakare"
      },
      createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1e3).toISOString()
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
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1e3).toISOString()
    }
  ];
  db.announcements = [
    {
      id: "ann-1",
      title: "Welcome to TasksEarn Platform",
      content: "Welcome Nigerians to the most trusted social media microtask exchange platform! Advertisers can publish tasks, and Earners can complete simple tasks and earn directly in Naira (\u20A6) paid to their local bank accounts.",
      type: "success",
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1e3).toISOString()
    },
    {
      id: "ann-2",
      title: "Withdrawal Process Audits",
      content: "Withdrawal requests are processed every Friday at 12:00 PM. Please ensure your submitted bank details are accurate and your name matches your verification profile to avoid rejections.",
      type: "info",
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1e3).toISOString()
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
      title: "Earn Up to \u20A65,000 Daily From Home",
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
There is no fixed limit! Your earnings depend on how many tasks you successfully complete. Tasks are rewarded between \u20A610 and \u20A6500 depending on complexity. Active earners can withdraw thousands of Naira weekly.

### 3. What is the minimum withdrawal and deposit?
- Minimum Withdrawal: \u20A62,000 (with a standard flat fee of \u20A6100 per transaction).
- Minimum Deposit for Advertisers: \u20A61,000.

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
- TasksEarn reserves the right to charge transaction fees on deposits (payment gateway charge) and withdrawals (\u20A6100 flat fee). Fees are clearly stated at checkout.`
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
  db.taskPricing = getInitialPricing();
  saveDB();
}
function saveDB() {
  import_fs.default.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}
loadDB();
var app = (0, import_express.default)();
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const userId = authHeader.split(" ")[1];
  return db.users.find((u) => u.id === userId) || null;
}
var resendClient = null;
function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      console.log(`[Resend Mailer] Initializing Resend client`);
      resendClient = new import_resend.Resend(apiKey);
    }
  }
  return resendClient;
}
var smtpTransporter = null;
function getSMTPTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (host && user && pass) {
    if (!smtpTransporter) {
      console.log(`[SMTP Mailer] Initializing nodemailer transporter with ${host}:${port} as ${user}`);
      smtpTransporter = import_nodemailer.default.createTransport({
        host,
        port,
        secure: port === 465,
        // true for 465, false for 587 or other ports
        auth: {
          user,
          pass
        }
      });
    }
    return smtpTransporter;
  }
  return null;
}
async function sendEmail({ to, subject, html }) {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const resend = getResendClient();
    if (resend) {
      const fromAddress = process.env.RESEND_FROM || "TasksEarn <onboarding@resend.dev>";
      try {
        console.log(`[Resend Mailer] Initiating email delivery to ${to}`);
        const response = await resend.emails.send({
          from: fromAddress,
          to: [to],
          subject,
          html
        });
        if (response.error) {
          console.error(`[Resend Mailer Error]`, response.error);
          throw new Error(`Resend Delivery Failed: ${response.error.message || JSON.stringify(response.error)}`);
        }
        console.log(`[Resend Mailer Success] Email delivered to ${to}. Message ID: ${response.data?.id}`);
        return { success: true, provider: "resend", data: response.data };
      } catch (error) {
        console.error(`[Resend Mailer Error] Failed to send email to ${to}:`, error);
        throw new Error(`Resend Delivery Failed: ${error.message || error}`);
      }
    }
  }
  const smtp = getSMTPTransporter();
  if (smtp) {
    const fromAddress = process.env.SMTP_FROM || db.settings.contactEmail || "TasksEarn <noreply@tasksearn.com>";
    try {
      console.log(`[SMTP Mailer] Initiating email delivery to ${to} via ${process.env.SMTP_HOST}`);
      const info = await smtp.sendMail({
        from: fromAddress,
        to,
        subject,
        html
      });
      console.log(`[SMTP Mailer Success] Email delivered to ${to}. Message ID: ${info.messageId}`);
      return { success: true, provider: "smtp", messageId: info.messageId };
    } catch (error) {
      console.error(`[SMTP Mailer Error] Failed to send email to ${to}:`, error);
      throw new Error(`SMTP Delivery Failed: ${error.message || error}`);
    }
  }
  const errMsg = "No email provider is configured. Please configure either Resend (set RESEND_API_KEY, RESEND_FROM) or SMTP variables (set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM) on your Google Cloud Run settings to enable real email verification and recovery.";
  console.error(`[Email Configuration Missing] ${errMsg}`);
  throw new Error(errMsg);
}
async function sendVerificationEmail(email, name, code) {
  const subject = "Verify your TasksEarn Email Address";
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #10b981; font-size: 24px; font-weight: bold; margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">TasksEarn Nigeria</h2>
        <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">Social Media Microtask Exchange</p>
      </div>
      <p style="color: #374151; font-size: 15px; line-height: 1.5;">Hello <strong>${name}</strong>,</p>
      <p style="color: #374151; font-size: 15px; line-height: 1.5;">Thank you for registering on TasksEarn. To complete your registration and activate your secure earner or advertiser account, please verify your email address using the 6-digit verification code below:</p>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 12px; text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #047857; font-family: monospace;">${code}</span>
      </div>
      <p style="color: #ef4444; font-size: 13px; font-weight: 600; text-align: center; margin-bottom: 12px;">This verification code is valid for exactly 10 minutes.</p>
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">If you did not sign up or request this verification code, please ignore this email or reach out to our platform support team.</p>
      <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
      <p style="text-align: center; color: #9ca3af; font-size: 11px; margin: 0;">
        \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} TasksEarn Nigeria. All rights reserved.<br />
        12, Herbert Macaulay Way, Yaba, Lagos State, Nigeria.
      </p>
    </div>
  `;
  return sendEmail({ to: email, subject, html: htmlContent });
}
async function sendPasswordResetEmail(email, name, tempPassword) {
  const subject = "Your TasksEarn Password Recovery Credentials";
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #10b981; font-size: 24px; font-weight: bold; margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">TasksEarn Nigeria</h2>
        <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">Social Media Microtask Exchange</p>
      </div>
      <p style="color: #374151; font-size: 15px; line-height: 1.5;">Hello <strong>${name}</strong>,</p>
      <p style="color: #374151; font-size: 15px; line-height: 1.5;">We received a request to recover your secure login password. We have generated a new secure temporary password for your account:</p>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 12px; text-align: center; margin: 24px 0;">
        <span style="font-size: 28px; font-weight: 800; letter-spacing: 2px; color: #047857; font-family: monospace;">${tempPassword}</span>
      </div>
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">Please use this temporary password to sign in immediately. Once logged in, you can update your security password under your Profile settings to keep your earnings and campaigns fully secure.</p>
      <p style="color: #ef4444; font-size: 13px; font-weight: 600; text-align: center;">For security reasons, do not share this password with anyone.</p>
      <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
      <p style="text-align: center; color: #9ca3af; font-size: 11px; margin: 0;">
        \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} TasksEarn Nigeria. All rights reserved.<br />
        12, Herbert Macaulay Way, Yaba, Lagos State, Nigeria.
      </p>
    </div>
  `;
  return sendEmail({ to: email, subject, html: htmlContent });
}
app.get("/api/public/pages", (req, res) => {
  res.json(db.pages);
});
app.get("/api/public/banners", (req, res) => {
  res.json(db.banners.filter((b) => b.active));
});
app.get("/api/public/announcements", (req, res) => {
  res.json(db.announcements);
});
app.get("/api/public/settings", (req, res) => {
  res.json(db.settings);
});
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, role, referralCode } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "Email address already registered" });
  }
  const userReferralCode = role === "Earner" /* EARNER */ ? name.substring(0, 4).toUpperCase() + Math.floor(100 + Math.random() * 900) : void 0;
  const userId = "u-" + Math.random().toString(36).substr(2, 9);
  let referredByUserId;
  if (referralCode && role === "Earner" /* EARNER */) {
    const referrer = db.users.find((u) => u.referralCode === referralCode && u.role === "Earner" /* EARNER */);
    if (referrer) {
      referredByUserId = referrer.id;
    }
  }
  const verificationCode = Math.floor(1e5 + Math.random() * 9e5).toString();
  const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1e3).toISOString();
  const verificationCodeLastSent = (/* @__PURE__ */ new Date()).toISOString();
  const newUser = {
    id: userId,
    name,
    email,
    password: hashPassword(password),
    role,
    isVerified: false,
    // Starts unverified to enforce email verification
    verificationCode,
    verificationCodeExpires,
    verificationCodeLastSent,
    walletBalance: 0,
    // Starts at 0
    referralCode: userReferralCode,
    referredBy: referredByUserId,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  try {
    await sendVerificationEmail(email, name, verificationCode);
  } catch (err) {
    console.error("Failed to send verification email on registration: ", err);
    return res.status(500).json({
      error: `Could not send verification email. Please check your SMTP or Resend settings. Details: ${err.message || err}`
    });
  }
  db.users.push(newUser);
  if (referredByUserId) {
    const referrer = db.users.find((u) => u.id === referredByUserId);
    db.referrals.push({
      id: "ref-" + Math.random().toString(36).substr(2, 9),
      referrerId: referredByUserId,
      refereeId: userId,
      refereeName: name,
      refereeEmail: email,
      rewardEarned: db.settings.referralReward,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (referrer) {
      referrer.walletBalance += db.settings.referralReward;
      db.transactions.push({
        id: "tx-" + Math.random().toString(36).substr(2, 9),
        userId: referredByUserId,
        userName: referrer.name,
        userRole: referrer.role,
        amount: db.settings.referralReward,
        type: "Referral Bonus" /* REFERRAL */,
        status: "Success" /* SUCCESS */,
        description: `Referral bonus for inviting ${name}`,
        reference: "R-REF-" + Math.floor(1e7 + Math.random() * 9e7),
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  saveDB();
  const { password: _, verificationCode: __, verificationCodeExpires: ___, ...userWithoutSecrets } = newUser;
  res.json({ user: userWithoutSecrets });
});
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const matchedUser = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!matchedUser) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const hashedPassword = hashPassword(password);
  if (matchedUser.password !== hashedPassword) {
    const isDemo = ["admin@tasksearn.com", "earner@tasksearn.com", "advertiser@tasksearn.com"].includes(matchedUser.email.toLowerCase());
    if (isDemo) {
      return res.status(401).json({ error: "Invalid password" });
    }
    return res.status(401).json({ error: "Invalid email or password" });
  }
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
app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email address is required" });
  }
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "No account found with this email address." });
  }
  const tempPassword = "TE-" + Math.floor(1e5 + Math.random() * 9e5).toString();
  try {
    await sendPasswordResetEmail(user.email, user.name, tempPassword);
    user.password = hashPassword(tempPassword);
    saveDB();
    res.json({
      success: true,
      message: "Password recovery credentials have been successfully sent to " + email + "."
    });
  } catch (err) {
    console.error("Failed to send password recovery email: ", err);
    res.status(500).json({ error: `Could not send password recovery email. Please check your SMTP settings. Details: ${err.message || err}` });
  }
});
app.post("/api/auth/verify-email", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Email and 6-digit code are required" });
  }
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "User account not found" });
  }
  if (user.isVerified) {
    const { password: _2, verificationCode: __, verificationCodeExpires: ___, ...userWithoutSecrets2 } = user;
    return res.json({ success: true, message: "Account already verified", user: userWithoutSecrets2 });
  }
  if (!user.verificationCode || user.verificationCode !== code) {
    return res.status(400).json({ error: "Invalid 6-digit verification code" });
  }
  const isExpired = new Date(user.verificationCodeExpires).getTime() < Date.now();
  if (isExpired) {
    return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
  }
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
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "User account not found" });
  }
  const lastSent = user.verificationCodeLastSent ? new Date(user.verificationCodeLastSent).getTime() : 0;
  const elapsed = Date.now() - lastSent;
  if (elapsed < 60 * 1e3) {
    const remainingSeconds = Math.ceil((60 * 1e3 - elapsed) / 1e3);
    return res.status(429).json({ error: `Please wait ${remainingSeconds} seconds before requesting a new code.` });
  }
  const newCode = Math.floor(1e5 + Math.random() * 9e5).toString();
  user.verificationCode = newCode;
  user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1e3).toISOString();
  user.verificationCodeLastSent = (/* @__PURE__ */ new Date()).toISOString();
  saveDB();
  try {
    await sendVerificationEmail(user.email, user.name, newCode);
    res.json({ success: true, message: "A new 6-digit verification code has been successfully sent." });
  } catch (err) {
    console.error("Resend verification code failed: ", err);
    res.status(500).json({ error: `Failed to deliver email. Details: ${err.message || err}` });
  }
});
app.get("/api/auth/me", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { password: _, verificationCode: __, verificationCodeExpires: ___, ...userWithoutSecrets } = user;
  res.json({ user: userWithoutSecrets });
});
app.get("/api/earner/dashboard", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Earner" /* EARNER */) return res.status(403).json({ error: "Access denied" });
  const userSubmissions = db.submissions.filter((s) => s.earnerId === user.id);
  const approved = userSubmissions.filter((s) => s.status === "Approved" /* APPROVED */);
  const pending = userSubmissions.filter((s) => s.status === "Pending" /* PENDING */);
  const rejected = userSubmissions.filter((s) => s.status === "Rejected" /* REJECTED */);
  const totalEarned = approved.reduce((sum, s) => sum + s.reward, 0);
  const referralsCount = db.referrals.filter((r) => r.referrerId === user.id).length;
  const submittedTaskIds = userSubmissions.map((s) => s.taskId);
  const availableTasks = db.tasks.filter((t) => t.status === "Active" /* ACTIVE */ && !submittedTaskIds.includes(t.id));
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
  if (!user || user.role !== "Earner" /* EARNER */) return res.status(403).json({ error: "Access denied" });
  const userSubmissions = db.submissions.filter((s) => s.earnerId === user.id);
  const submittedMap = new Map(userSubmissions.map((s) => [s.taskId, s.status]));
  const tasksWithStatus = db.tasks.filter((t) => t.status === "Active" /* ACTIVE */).map((t) => ({
    ...t,
    submissionStatus: submittedMap.get(t.id) || null
  }));
  res.json(tasksWithStatus);
});
app.post("/api/earner/tasks/:id/submit", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Earner" /* EARNER */) return res.status(403).json({ error: "Access denied" });
  const taskId = req.params.id;
  const { proofText, proofScreenshot } = req.body;
  if (!proofText) {
    return res.status(400).json({ error: "Proof details are required" });
  }
  const task = db.tasks.find((t) => t.id === taskId);
  if (!task || task.status !== "Active" /* ACTIVE */) {
    return res.status(404).json({ error: "Task is not active or not found" });
  }
  const alreadySubmitted = db.submissions.some((s) => s.taskId === taskId && s.earnerId === user.id);
  if (alreadySubmitted) {
    return res.status(400).json({ error: "You have already submitted a proof for this task" });
  }
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
    status: "Pending" /* PENDING */,
    reward: task.earningPerSlot,
    submittedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.submissions.push(newSubmission);
  saveDB();
  notifyAdmin({
    type: "submission",
    message: `New task submission from ${user.name} for "${task.title}"`,
    referenceId: newSubmission.id
  });
  res.json({ success: true, submission: newSubmission });
});
app.get("/api/earner/submissions", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Earner" /* EARNER */) return res.status(403).json({ error: "Access denied" });
  const submissions = db.submissions.filter((s) => s.earnerId === user.id);
  res.json(submissions.reverse());
});
app.get("/api/earner/referrals", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Earner" /* EARNER */) return res.status(403).json({ error: "Access denied" });
  const referrals = db.referrals.filter((r) => r.referrerId === user.id);
  res.json({
    referralCode: user.referralCode,
    referralReward: db.settings.referralReward,
    referrals: referrals.reverse()
  });
});
app.post("/api/earner/withdraw", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Earner" /* EARNER */) return res.status(403).json({ error: "Access denied" });
  const { amount, bankName, accountNumber, accountName } = req.body;
  if (!amount || !bankName || !accountNumber || !accountName) {
    return res.status(400).json({ error: "All bank transfer fields are required" });
  }
  const withdrawAmount = parseFloat(amount);
  if (isNaN(withdrawAmount) || withdrawAmount < db.settings.minWithdrawal) {
    return res.status(400).json({ error: `Minimum withdrawal amount is \u20A6${db.settings.minWithdrawal}` });
  }
  const pendingWithdrawalsTotal = db.transactions.filter((t) => t.userId === user.id && t.type === "Withdrawal" /* WITHDRAWAL */ && t.status === "Pending" /* PENDING */).reduce((sum, t) => sum + t.amount, 0);
  const availableBalance = user.walletBalance - pendingWithdrawalsTotal;
  if (availableBalance < withdrawAmount) {
    return res.status(400).json({
      error: `Insufficient available balance. Your total balance is \u20A6${user.walletBalance.toLocaleString()}, but you have \u20A6${pendingWithdrawalsTotal.toLocaleString()} locked in pending withdrawals. Real available balance: \u20A6${availableBalance.toLocaleString()}`
    });
  }
  const txId = "tx-" + Math.random().toString(36).substr(2, 9);
  const ref = "W-BANK-" + Math.floor(1e7 + Math.random() * 9e7);
  const newTx = {
    id: txId,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    amount: withdrawAmount,
    type: "Withdrawal" /* WITHDRAWAL */,
    status: "Pending" /* PENDING */,
    description: `Withdrawal to ${bankName} (${accountNumber})`,
    reference: ref,
    bankDetails: {
      bankName,
      accountNumber,
      accountName
    },
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.transactions.push(newTx);
  saveDB();
  notifyAdmin({
    type: "withdrawal",
    message: `New withdrawal request of \u20A6${withdrawAmount.toLocaleString()} from ${user.name}`,
    referenceId: newTx.id
  });
  res.json({
    success: true,
    transaction: newTx,
    walletBalance: user.walletBalance,
    availableBalance: availableBalance - withdrawAmount
  });
});
app.get("/api/pricing", (req, res) => {
  res.json(db.taskPricing || []);
});
app.get("/api/public/stats", (req, res) => {
  const earnersCount = db.users.filter((u) => u.role === "Earner" /* EARNER */).length;
  const tasksCount = db.tasks.length;
  const totalPaidOut = db.transactions.filter((t) => t.type === "Withdrawal" /* WITHDRAWAL */ && t.status === "Success" /* SUCCESS */).reduce((sum, t) => sum + t.amount, 0);
  const latestWithdrawalTx = db.transactions.filter((t) => t.type === "Withdrawal" /* WITHDRAWAL */).slice(-1)[0] || null;
  const latestCampaign = db.tasks.filter((t) => t.status === "Active" /* ACTIVE */).slice(-1)[0] || null;
  res.json({
    earnersCount,
    tasksCount,
    totalPaidOut,
    latestWithdrawal: latestWithdrawalTx ? {
      userName: latestWithdrawalTx.userName,
      bankName: latestWithdrawalTx.bankDetails?.bankName || "Commercial Bank",
      amount: latestWithdrawalTx.amount
    } : null,
    latestCampaign: latestCampaign ? {
      title: latestCampaign.title,
      cost: latestCampaign.totalSlots * latestCampaign.costPerSlot
    } : null
  });
});
app.get("/api/advertiser/dashboard", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Advertiser" /* ADVERTISER */) return res.status(403).json({ error: "Access denied" });
  const advertiserTasks = db.tasks.filter((t) => t.advertiserId === user.id);
  const activeCount = advertiserTasks.filter((t) => t.status === "Active" /* ACTIVE */).length;
  const pausedCount = advertiserTasks.filter((t) => t.status === "Paused" /* PAUSED */).length;
  const completedCount = advertiserTasks.filter((t) => t.status === "Completed" /* COMPLETED */).length;
  const totalSpent = db.transactions.filter((t) => t.userId === user.id && t.type === "Campaign Spend" /* SPEND */ && t.status === "Success" /* SUCCESS */).reduce((sum, t) => sum + t.amount, 0);
  const taskIds = advertiserTasks.map((t) => t.id);
  const advertiserSubmissions = db.submissions.filter((s) => taskIds.includes(s.taskId));
  const pendingSubmissionsCount = advertiserSubmissions.filter((s) => s.status === "Pending" /* PENDING */).length;
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
  if (!user || user.role !== "Advertiser" /* ADVERTISER */) return res.status(403).json({ error: "Access denied" });
  const advertiserTasks = db.tasks.filter((t) => t.advertiserId === user.id);
  res.json(advertiserTasks.reverse());
});
app.post("/api/advertiser/tasks", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Advertiser" /* ADVERTISER */) return res.status(403).json({ error: "Access denied" });
  const { title, description, category, proofRequirements, link, earningPerSlot, totalSlots } = req.body;
  if (!title || !description || !category || !proofRequirements || !link || !earningPerSlot || !totalSlots) {
    return res.status(400).json({ error: "All campaign fields are required" });
  }
  const rewardPerSlot = parseFloat(earningPerSlot);
  const slots = parseInt(totalSlots);
  if (isNaN(rewardPerSlot) || rewardPerSlot <= 0 || isNaN(slots) || slots <= 0) {
    return res.status(400).json({ error: "Invalid earning value or slot count" });
  }
  const platform = getPlatformForCategory(category);
  const pricing = db.taskPricing ? db.taskPricing.find((p) => p.platform === platform) : null;
  const finalCostPerSlot = pricing ? pricing.costPerSlot : Math.ceil(rewardPerSlot * 1.35);
  const finalEarningPerSlot = pricing ? pricing.earningPerSlot : rewardPerSlot;
  const totalCampaignCost = finalCostPerSlot * slots;
  if (user.walletBalance < totalCampaignCost) {
    return res.status(400).json({
      error: `Insufficient balance. This campaign costs \u20A6${totalCampaignCost.toLocaleString()} (\u20A6${finalCostPerSlot}/slot). Please fund your wallet.`
    });
  }
  user.walletBalance -= totalCampaignCost;
  const newTaskId = "task-" + Math.random().toString(36).substr(2, 9);
  const newTask = {
    id: newTaskId,
    title,
    description,
    category,
    proofRequirements,
    link,
    costPerSlot: finalCostPerSlot,
    earningPerSlot: finalEarningPerSlot,
    totalSlots: slots,
    filledSlots: 0,
    status: "Active" /* ACTIVE */,
    advertiserId: user.id,
    advertiserName: user.name,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.tasks.push(newTask);
  db.transactions.push({
    id: "tx-" + Math.random().toString(36).substr(2, 9),
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    amount: totalCampaignCost,
    type: "Campaign Spend" /* SPEND */,
    status: "Success" /* SUCCESS */,
    description: `Created Campaign: ${title}`,
    reference: "T-SPEND-" + Math.floor(1e7 + Math.random() * 9e7),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  saveDB();
  res.json({ success: true, task: newTask, remainingBalance: user.walletBalance });
});
app.put("/api/advertiser/tasks/:id/toggle", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Advertiser" /* ADVERTISER */) return res.status(403).json({ error: "Access denied" });
  const taskId = req.params.id;
  const task = db.tasks.find((t) => t.id === taskId && t.advertiserId === user.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  if (task.status === "Active" /* ACTIVE */) {
    task.status = "Paused" /* PAUSED */;
  } else if (task.status === "Paused" /* PAUSED */) {
    task.status = "Active" /* ACTIVE */;
  }
  saveDB();
  res.json({ success: true, task });
});
app.delete("/api/advertiser/tasks/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Advertiser" /* ADVERTISER */) return res.status(403).json({ error: "Access denied" });
  const taskId = req.params.id;
  const taskIdx = db.tasks.findIndex((t) => t.id === taskId && t.advertiserId === user.id);
  if (taskIdx === -1) return res.status(404).json({ error: "Task not found" });
  const task = db.tasks[taskIdx];
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
      type: "Deposit" /* DEPOSIT */,
      status: "Success" /* SUCCESS */,
      description: `Refund for deleted campaign: ${task.title} (${remainingSlots} slots)`,
      reference: "T-REFUND-" + Math.floor(1e7 + Math.random() * 9e7),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  db.tasks.splice(taskIdx, 1);
  saveDB();
  res.json({ success: true, refundedAmount: remainingSlots * task.costPerSlot, remainingBalance: user.walletBalance });
});
app.get("/api/advertiser/submissions", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Advertiser" /* ADVERTISER */) return res.status(403).json({ error: "Access denied" });
  const myTaskIds = db.tasks.filter((t) => t.advertiserId === user.id).map((t) => t.id);
  const submissions = db.submissions.filter((s) => myTaskIds.includes(s.taskId));
  res.json(submissions.reverse());
});
app.post("/api/advertiser/submissions/:id/review", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Advertiser" /* ADVERTISER */) return res.status(403).json({ error: "Access denied" });
  const subId = req.params.id;
  const { status, feedback } = req.body;
  if (!status || status !== "Approved" /* APPROVED */ && status !== "Rejected" /* REJECTED */) {
    return res.status(400).json({ error: "Invalid status selection" });
  }
  const submission = db.submissions.find((s) => s.id === subId);
  if (!submission) return res.status(404).json({ error: "Submission not found" });
  const task = db.tasks.find((t) => t.id === submission.taskId && t.advertiserId === user.id);
  if (!task) return res.status(403).json({ error: "Unauthorized review" });
  if (submission.status !== "Pending" /* PENDING */) {
    return res.status(400).json({ error: "Submission has already been reviewed" });
  }
  submission.status = status;
  submission.feedback = feedback || "";
  if (status === "Approved" /* APPROVED */) {
    submission.approvedAt = (/* @__PURE__ */ new Date()).toISOString();
    const earner = db.users.find((u) => u.id === submission.earnerId);
    if (earner) {
      earner.walletBalance += submission.reward;
      db.transactions.push({
        id: "tx-" + Math.random().toString(36).substr(2, 9),
        userId: earner.id,
        userName: earner.name,
        userRole: earner.role,
        amount: submission.reward,
        type: "Task Earnings" /* EARN */,
        status: "Success" /* SUCCESS */,
        description: `Earned from task: ${task.title}`,
        reference: "E-TASK-" + Math.floor(1e7 + Math.random() * 9e7),
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    task.filledSlots += 1;
    if (task.filledSlots >= task.totalSlots) {
      task.status = "Completed" /* COMPLETED */;
    }
  } else {
  }
  saveDB();
  res.json({ success: true, submission });
});
app.post("/api/advertiser/deposit/initialize", async (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Advertiser" /* ADVERTISER */) return res.status(403).json({ error: "Access denied" });
  const { amount } = req.body;
  const depositAmount = parseFloat(amount);
  if (isNaN(depositAmount) || depositAmount < db.settings.minDeposit) {
    return res.status(400).json({ error: `Minimum deposit amount is \u20A6${db.settings.minDeposit}` });
  }
  const txId = "tx-" + Math.random().toString(36).substr(2, 9);
  const ref = "DEP-" + Math.floor(1e7 + Math.random() * 9e7);
  const newTx = {
    id: txId,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    amount: depositAmount,
    type: "Deposit" /* DEPOSIT */,
    status: "Pending" /* PENDING */,
    description: "Wallet Funding via Paystack Checkout",
    reference: ref,
    gateway: "Paystack",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.transactions.push(newTx);
  saveDB();
  const paystackKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackKey) {
    return res.status(400).json({ error: "PAYSTACK_SECRET_KEY environment variable is not configured on the server. Please set it in the Secrets/Settings menu." });
  }
  try {
    const origin = req.headers.referer || req.headers.origin || `http://localhost:${PORT}`;
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
        amount: Math.round(depositAmount * 100),
        // convert to kobo and ensure integer
        reference: ref,
        callback_url: callbackUrl
      })
    });
    const paystackData = await paystackRes.json();
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
});
app.post("/api/advertiser/deposit/verify", async (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Advertiser" /* ADVERTISER */) return res.status(403).json({ error: "Access denied" });
  const { reference } = req.body;
  if (!reference) {
    return res.status(400).json({ error: "Transaction reference is required" });
  }
  const transaction = db.transactions.find((t) => t.reference === reference && t.userId === user.id);
  if (!transaction) {
    return res.status(404).json({ error: "Transaction record not found" });
  }
  if (transaction.status === "Success" /* SUCCESS */) {
    return res.json({
      success: true,
      alreadyProcessed: true,
      walletBalance: user.walletBalance,
      transaction
    });
  }
  if (transaction.status === "Failed" /* FAILED */ || transaction.status === "Rejected" /* REJECTED */) {
    return res.status(400).json({ error: "This transaction has already been processed as failed" });
  }
  const paystackKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackKey) {
    return res.status(400).json({ error: "PAYSTACK_SECRET_KEY environment variable is not configured on the server. Please set it in the Secrets/Settings menu." });
  }
  try {
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${paystackKey}`
      }
    });
    const paystackData = await paystackRes.json();
    if (paystackData && paystackData.status && paystackData.data) {
      const paystackStatus = paystackData.data.status;
      const paystackAmount = paystackData.data.amount / 100;
      if (paystackStatus === "success") {
        if (Math.abs(paystackAmount - transaction.amount) > 0.01) {
          transaction.status = "Failed" /* FAILED */;
          saveDB();
          return res.status(400).json({ error: "Transaction amount mismatch. Audit flag raised." });
        }
        transaction.status = "Success" /* SUCCESS */;
        user.walletBalance += transaction.amount;
        saveDB();
        return res.json({
          success: true,
          walletBalance: user.walletBalance,
          transaction
        });
      } else {
        transaction.status = "Failed" /* FAILED */;
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
});
app.get("/api/user/transactions", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const transactions = db.transactions.filter((t) => t.userId === user.id);
  res.json(transactions.reverse());
});
app.get("/api/admin/dashboard", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const earners = db.users.filter((u) => u.role === "Earner" /* EARNER */);
  const advertisers = db.users.filter((u) => u.role === "Advertiser" /* ADVERTISER */);
  const totalEarned = db.submissions.filter((s) => s.status === "Approved" /* APPROVED */).reduce((sum, s) => sum + s.reward, 0);
  const pendingWithdrawals = db.transactions.filter((t) => t.type === "Withdrawal" /* WITHDRAWAL */ && t.status === "Pending" /* PENDING */).reduce((sum, t) => sum + t.amount, 0);
  const totalDeposited = db.transactions.filter((t) => t.type === "Deposit" /* DEPOSIT */ && t.status === "Success" /* SUCCESS */).reduce((sum, t) => sum + t.amount, 0);
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
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  res.json(db.users.filter((u) => u.role !== "Admin" /* ADMIN */).reverse());
});
app.put("/api/admin/users/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const targetId = req.params.id;
  const targetUser = db.users.find((u) => u.id === targetId);
  if (!targetUser) return res.status(404).json({ error: "User not found" });
  const { walletBalance, isVerified } = req.body;
  if (walletBalance !== void 0) targetUser.walletBalance = parseFloat(walletBalance);
  if (isVerified !== void 0) targetUser.isVerified = !!isVerified;
  saveDB();
  res.json({ success: true, user: targetUser });
});
app.get("/api/admin/tasks", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  res.json(db.tasks.reverse());
});
app.put("/api/admin/tasks/:id/status", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const taskId = req.params.id;
  const { status } = req.body;
  const task = db.tasks.find((t) => t.id === taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });
  task.status = status;
  saveDB();
  res.json({ success: true, task });
});
app.delete("/api/admin/tasks/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const taskId = req.params.id;
  const idx = db.tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) return res.status(404).json({ error: "Task not found" });
  db.tasks.splice(idx, 1);
  saveDB();
  res.json({ success: true });
});
app.get("/api/admin/submissions", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  res.json(db.submissions.reverse());
});
app.post("/api/admin/submissions/:id/review", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const subId = req.params.id;
  const { status, feedback } = req.body;
  const submission = db.submissions.find((s) => s.id === subId);
  if (!submission) return res.status(404).json({ error: "Submission not found" });
  if (submission.status !== "Pending" /* PENDING */) {
    return res.status(400).json({ error: "Submission has already been audited" });
  }
  const task = db.tasks.find((t) => t.id === submission.taskId);
  if (!task) return res.status(404).json({ error: "Associated task not found" });
  submission.status = status;
  submission.feedback = feedback || "";
  if (status === "Approved" /* APPROVED */) {
    submission.approvedAt = (/* @__PURE__ */ new Date()).toISOString();
    const earner = db.users.find((u) => u.id === submission.earnerId);
    if (earner) {
      earner.walletBalance += submission.reward;
      db.transactions.push({
        id: "tx-" + Math.random().toString(36).substr(2, 9),
        userId: earner.id,
        userName: earner.name,
        userRole: earner.role,
        amount: submission.reward,
        type: "Task Earnings" /* EARN */,
        status: "Success" /* SUCCESS */,
        description: `Earned from task (Admin Audited): ${task.title}`,
        reference: "E-TASK-ADM-" + Math.floor(1e7 + Math.random() * 9e7),
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    task.filledSlots += 1;
    if (task.filledSlots >= task.totalSlots) {
      task.status = "Completed" /* COMPLETED */;
    }
  }
  saveDB();
  res.json({ success: true, submission });
});
function getPlatformRevenueStats() {
  let totalCommission = 0;
  let todayCommission = 0;
  let monthCommission = 0;
  const now = /* @__PURE__ */ new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const submissions = db.submissions || [];
  submissions.forEach((s) => {
    if (s.status === "Approved" /* APPROVED */ || s.status === "Approved") {
      const task = (db.tasks || []).find((t) => t.id === s.taskId);
      const cost = task ? task.costPerSlot : s.reward * 1.35;
      const commission = cost - s.reward;
      totalCommission += commission;
      const approvedTime = s.approvedAt ? new Date(s.approvedAt).getTime() : new Date(s.submittedAt).getTime();
      if (approvedTime >= startOfToday) {
        todayCommission += commission;
      }
      if (approvedTime >= startOfThisMonth) {
        monthCommission += commission;
      }
    }
  });
  let totalWithdrawalFees = 0;
  let todayWithdrawalFees = 0;
  let monthWithdrawalFees = 0;
  const userWithdrawals = (db.transactions || []).filter(
    (t) => t.type === "Withdrawal" /* WITHDRAWAL */ && (t.status === "Success" /* SUCCESS */ || t.status === "Success" || t.status === "Approved")
  );
  userWithdrawals.forEach((t) => {
    const fee = db.settings?.withdrawalFee || 100;
    totalWithdrawalFees += fee;
    const time = new Date(t.createdAt).getTime();
    if (time >= startOfToday) {
      todayWithdrawalFees += fee;
    }
    if (time >= startOfThisMonth) {
      monthWithdrawalFees += fee;
    }
  });
  const lifetimeRevenue = totalCommission + totalWithdrawalFees;
  const todayRevenue = todayCommission + todayWithdrawalFees;
  const monthRevenue = monthCommission + monthWithdrawalFees;
  const ownerWithdrawals = db.ownerEarnings?.withdrawals || [];
  const totalWithdrawn = ownerWithdrawals.filter((w) => w.status === "Approved" || w.status === "Success").reduce((sum, w) => sum + w.amount, 0);
  const pendingWithdrawalAmount = ownerWithdrawals.filter((w) => w.status === "Pending").reduce((sum, w) => sum + w.amount, 0);
  const availableBalance = Math.max(0, lifetimeRevenue - totalWithdrawn - pendingWithdrawalAmount);
  return {
    lifetimeRevenue,
    totalPlatformRevenue: lifetimeRevenue,
    todayRevenue,
    thisMonthRevenue: monthRevenue,
    totalWithdrawn,
    pendingWithdrawalAmount,
    availableBalance
  };
}
app.get("/api/admin/owner-earnings/stats", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  if (!db.ownerEarnings) {
    db.ownerEarnings = { bankAccounts: [], withdrawals: [] };
  }
  const stats = getPlatformRevenueStats();
  res.json(stats);
});
app.get("/api/admin/owner-earnings/bank-accounts", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  if (!db.ownerEarnings) {
    db.ownerEarnings = { bankAccounts: [], withdrawals: [] };
  }
  if (!db.ownerEarnings.bankAccounts) {
    db.ownerEarnings.bankAccounts = [];
    saveDB();
  }
  res.json(db.ownerEarnings.bankAccounts);
});
app.post("/api/admin/owner-earnings/bank-accounts", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const { bankName, accountNumber, accountName, isDefault } = req.body;
  if (!bankName || !accountNumber || !accountName) {
    return res.status(400).json({ error: "All bank account details are required" });
  }
  if (!db.ownerEarnings) {
    db.ownerEarnings = { bankAccounts: [], withdrawals: [] };
  }
  if (!db.ownerEarnings.bankAccounts) {
    db.ownerEarnings.bankAccounts = [];
  }
  if (isDefault) {
    db.ownerEarnings.bankAccounts.forEach((ba) => ba.isDefault = false);
  }
  const newAccount = {
    id: "ba-" + Math.random().toString(36).substr(2, 9),
    bankName,
    accountNumber,
    accountName,
    isDefault: isDefault || db.ownerEarnings.bankAccounts.length === 0
  };
  db.ownerEarnings.bankAccounts.push(newAccount);
  saveDB();
  res.json(newAccount);
});
app.put("/api/admin/owner-earnings/bank-accounts/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const { id } = req.params;
  const { bankName, accountNumber, accountName, isDefault } = req.body;
  if (!db.ownerEarnings || !db.ownerEarnings.bankAccounts) {
    return res.status(404).json({ error: "Bank account database not found" });
  }
  const account = db.ownerEarnings.bankAccounts.find((ba) => ba.id === id);
  if (!account) return res.status(404).json({ error: "Bank account not found" });
  if (bankName) account.bankName = bankName;
  if (accountNumber) account.accountNumber = accountNumber;
  if (accountName) account.accountName = accountName;
  if (isDefault !== void 0) {
    account.isDefault = isDefault;
    if (isDefault) {
      db.ownerEarnings.bankAccounts.forEach((ba) => {
        if (ba.id !== id) ba.isDefault = false;
      });
    }
  }
  saveDB();
  res.json(account);
});
app.delete("/api/admin/owner-earnings/bank-accounts/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const { id } = req.params;
  if (!db.ownerEarnings || !db.ownerEarnings.bankAccounts) {
    return res.status(404).json({ error: "Bank account database not found" });
  }
  const index = db.ownerEarnings.bankAccounts.findIndex((ba) => ba.id === id);
  if (index === -1) return res.status(404).json({ error: "Bank account not found" });
  const wasDefault = db.ownerEarnings.bankAccounts[index].isDefault;
  db.ownerEarnings.bankAccounts.splice(index, 1);
  if (wasDefault && db.ownerEarnings.bankAccounts.length > 0) {
    db.ownerEarnings.bankAccounts[0].isDefault = true;
  }
  saveDB();
  res.json({ success: true });
});
app.post("/api/admin/owner-earnings/bank-accounts/:id/default", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const { id } = req.params;
  if (!db.ownerEarnings || !db.ownerEarnings.bankAccounts) {
    return res.status(404).json({ error: "Bank account database not found" });
  }
  const account = db.ownerEarnings.bankAccounts.find((ba) => ba.id === id);
  if (!account) return res.status(404).json({ error: "Bank account not found" });
  db.ownerEarnings.bankAccounts.forEach((ba) => ba.isDefault = false);
  account.isDefault = true;
  saveDB();
  res.json({ success: true, account });
});
app.get("/api/admin/owner-earnings/banks", async (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const paystackKey = process.env.PAYSTACK_SECRET_KEY;
  if (paystackKey) {
    try {
      const response = await fetch("https://api.paystack.co/bank?country=nigeria", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${paystackKey}`
        }
      });
      const data = await response.json();
      if (data && data.status && data.data) {
        const banks = data.data.map((b) => ({
          name: b.name,
          code: b.code
        })).sort((a, b) => a.name.localeCompare(b.name));
        return res.json(banks);
      }
    } catch (err) {
      console.error("Failed to fetch banks from Paystack, falling back to static list.", err);
    }
  }
  const staticBanks = [
    { name: "Access Bank", code: "044" },
    { name: "Accion Microfinance Bank", code: "090134" },
    { name: "Carbon", code: "565" },
    { name: "Ecobank Nigeria", code: "050" },
    { name: "Fidelity Bank", code: "070" },
    { name: "First Bank of Nigeria", code: "011" },
    { name: "First City Monument Bank (FCMB)", code: "214" },
    { name: "Globus Bank", code: "00103" },
    { name: "Guaranty Trust Bank (GTB)", code: "058" },
    { name: "Heritage Bank", code: "030" },
    { name: "Jaiz Bank", code: "301" },
    { name: "Keystone Bank", code: "082" },
    { name: "Kuda Bank", code: "50211" },
    { name: "Moniepoint Microfinance Bank", code: "50515" },
    { name: "OPay Microfinance Bank", code: "999992" },
    { name: "Optimus Bank", code: "107" },
    { name: "PalmPay Microfinance Bank", code: "999991" },
    { name: "Parallex Bank", code: "502" },
    { name: "Polaris Bank", code: "076" },
    { name: "PremiumTrust Bank", code: "105" },
    { name: "Providus Bank", code: "101" },
    { name: "Rubies MFB", code: "125" },
    { name: "Stanbic IBTC Bank", code: "221" },
    { name: "Standard Chartered Bank", code: "023" },
    { name: "Sterling Bank", code: "232" },
    { name: "Taj Bank", code: "302" },
    { name: "Titan Trust Bank", code: "102" },
    { name: "Union Bank of Nigeria", code: "032" },
    { name: "United Bank for Africa (UBA)", code: "033" },
    { name: "Unity Bank", code: "215" },
    { name: "VFD Microfinance Bank", code: "566" },
    { name: "Wema Bank", code: "035" },
    { name: "Zenith Bank", code: "057" }
  ];
  res.json(staticBanks);
});
app.post("/api/admin/owner-earnings/resolve-bank", async (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const { accountNumber, bankCode, bankName } = req.body;
  if (!accountNumber || !bankCode) {
    return res.status(400).json({ error: "Account number and bank are required" });
  }
  if (accountNumber.length !== 10 || !/^\d+$/.test(accountNumber)) {
    return res.status(400).json({ error: "Account number must be exactly 10 digits" });
  }
  const paystackKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackKey) {
    return res.json({
      success: true,
      accountName: `Verified Owner Account (${bankName || "Commercial Bank"})`,
      isSimulated: true
    });
  }
  try {
    const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${paystackKey}`
      }
    });
    const data = await response.json();
    if (data && data.status && data.data) {
      return res.json({
        success: true,
        accountName: data.data.account_name,
        accountNumber: data.data.account_number,
        bankCode
      });
    } else {
      return res.status(400).json({ error: data.message || "Could not resolve bank account. Please check details." });
    }
  } catch (err) {
    console.error("Paystack resolve-bank error: ", err);
    return res.status(500).json({ error: "Failed to connect to bank verification service." });
  }
});
app.get("/api/admin/owner-earnings/withdrawals", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  if (!db.ownerEarnings) {
    db.ownerEarnings = { bankAccounts: [], withdrawals: [] };
  }
  if (!db.ownerEarnings.withdrawals) {
    db.ownerEarnings.withdrawals = [];
  }
  res.json(db.ownerEarnings.withdrawals.reverse());
});
app.post("/api/admin/owner-earnings/withdraw", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const { amount, bankAccountId } = req.body;
  if (!amount || !bankAccountId) {
    return res.status(400).json({ error: "Amount and bank account selection are required" });
  }
  const withdrawAmount = parseFloat(amount);
  if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
    return res.status(400).json({ error: "Please enter a valid positive withdrawal amount" });
  }
  if (!db.ownerEarnings || !db.ownerEarnings.bankAccounts) {
    return res.status(400).json({ error: "No bank accounts set up" });
  }
  const account = db.ownerEarnings.bankAccounts.find((ba) => ba.id === bankAccountId);
  if (!account) {
    return res.status(400).json({ error: "Selected bank account is invalid" });
  }
  const stats = getPlatformRevenueStats();
  if (stats.availableBalance < withdrawAmount) {
    return res.status(400).json({ error: `Insufficient platform available balance. Maximum you can withdraw is \u20A6${stats.availableBalance.toLocaleString()}` });
  }
  if (!db.ownerEarnings.withdrawals) {
    db.ownerEarnings.withdrawals = [];
  }
  const newWithdrawal = {
    id: "own-wd-" + Math.random().toString(36).substr(2, 9),
    amount: withdrawAmount,
    submittedAt: (/* @__PURE__ */ new Date()).toISOString(),
    status: "Pending",
    // Owner can complete it to record actual disbursement
    bankName: account.bankName,
    accountNumber: account.accountNumber,
    accountName: account.accountName,
    reference: "OWN-PAY-" + Math.floor(1e7 + Math.random() * 9e7)
  };
  db.ownerEarnings.withdrawals.push(newWithdrawal);
  saveDB();
  res.json({ success: true, withdrawal: newWithdrawal });
});
app.post("/api/admin/owner-earnings/withdrawals/:id/status", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const { id } = req.params;
  const { status } = req.body;
  if (!db.ownerEarnings || !db.ownerEarnings.withdrawals) {
    return res.status(404).json({ error: "Withdrawal not found" });
  }
  const withdrawal = db.ownerEarnings.withdrawals.find((w) => w.id === id);
  if (!withdrawal) return res.status(404).json({ error: "Withdrawal not found" });
  withdrawal.status = status;
  saveDB();
  res.json({ success: true, withdrawal });
});
app.get("/api/admin/withdrawals", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const withdrawals = db.transactions.filter((t) => t.type === "Withdrawal" /* WITHDRAWAL */);
  res.json(withdrawals.reverse());
});
app.post("/api/admin/withdrawals/:id/review", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const txId = req.params.id;
  const { status } = req.body;
  const transaction = db.transactions.find((t) => t.id === txId && t.type === "Withdrawal" /* WITHDRAWAL */);
  if (!transaction) return res.status(404).json({ error: "Withdrawal transaction not found" });
  if (transaction.status !== "Pending" /* PENDING */) {
    return res.status(400).json({ error: "Withdrawal already reviewed" });
  }
  const isApproved = status === "Success" /* SUCCESS */ || status === "Approved" /* APPROVED */ || status === "Success" || status === "Approved";
  if (isApproved) {
    const earner = db.users.find((u) => u.id === transaction.userId);
    if (earner) {
      if (earner.walletBalance < transaction.amount) {
        return res.status(400).json({ error: `User has insufficient balance (\u20A6${earner.walletBalance}) to complete this payout of \u20A6${transaction.amount}.` });
      }
      earner.walletBalance -= transaction.amount;
    }
    transaction.status = "Success" /* SUCCESS */;
  } else {
    transaction.status = "Rejected" /* REJECTED */;
  }
  saveDB();
  res.json({ success: true, transaction });
});
app.get("/api/admin/deposits", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const deposits = db.transactions.filter((t) => t.type === "Deposit" /* DEPOSIT */);
  res.json(deposits.reverse());
});
app.get("/api/admin/referrals", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  res.json(db.referrals.reverse());
});
app.get("/api/admin/announcements", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  res.json(db.announcements);
});
app.post("/api/admin/announcements", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const { title, content, type } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Title and Content are required" });
  const newAnn = {
    id: "ann-" + Math.random().toString(36).substr(2, 9),
    title,
    content,
    type: type || "info",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.announcements.push(newAnn);
  saveDB();
  res.json({ success: true, announcement: newAnn });
});
app.delete("/api/admin/announcements/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const idx = db.announcements.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Announcement not found" });
  db.announcements.splice(idx, 1);
  saveDB();
  res.json({ success: true });
});
app.get("/api/admin/banners", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  res.json(db.banners);
});
app.post("/api/admin/banners", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
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
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const banner = db.banners.find((b) => b.id === req.params.id);
  if (!banner) return res.status(404).json({ error: "Banner not found" });
  banner.active = !banner.active;
  saveDB();
  res.json({ success: true, banner });
});
app.delete("/api/admin/banners/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const idx = db.banners.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Banner not found" });
  db.banners.splice(idx, 1);
  saveDB();
  res.json({ success: true });
});
app.put("/api/admin/pages/:id", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const pageId = req.params.id;
  const { title, content } = req.body;
  if (!db.pages[pageId]) {
    db.pages[pageId] = { title: "", content: "" };
  }
  if (title) db.pages[pageId].title = title;
  if (content) db.pages[pageId].content = content;
  saveDB();
  res.json({ success: true, page: db.pages[pageId] });
});
app.get("/api/admin/settings", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  res.json(db.settings);
});
app.put("/api/admin/settings", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const { platformName, referralReward, withdrawalFee, minWithdrawal, minDeposit, contactEmail, contactPhone, telegramChannel, whatsappGroup } = req.body;
  if (platformName) db.settings.platformName = platformName;
  if (referralReward !== void 0) db.settings.referralReward = parseFloat(referralReward);
  if (withdrawalFee !== void 0) db.settings.withdrawalFee = parseFloat(withdrawalFee);
  if (minWithdrawal !== void 0) db.settings.minWithdrawal = parseFloat(minWithdrawal);
  if (minDeposit !== void 0) db.settings.minDeposit = parseFloat(minDeposit);
  if (contactEmail) db.settings.contactEmail = contactEmail;
  if (contactPhone) db.settings.contactPhone = contactPhone;
  if (telegramChannel !== void 0) db.settings.telegramChannel = telegramChannel;
  if (whatsappGroup !== void 0) db.settings.whatsappGroup = whatsappGroup;
  saveDB();
  res.json({ success: true, settings: db.settings });
});
app.get("/api/admin/task-pricing", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  res.json(db.taskPricing || []);
});
app.put("/api/admin/task-pricing", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const { pricing } = req.body;
  if (!pricing || !Array.isArray(pricing)) {
    return res.status(400).json({ error: "Invalid pricing array data" });
  }
  db.taskPricing = pricing;
  saveDB();
  res.json({ success: true, pricing: db.taskPricing });
});
var server = (0, import_http.createServer)(app);
var wss = new import_ws.WebSocketServer({ noServer: true });
var adminClients = /* @__PURE__ */ new Set();
wss.on("connection", (ws) => {
  console.log("[WS] Admin client connected");
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === "register-admin") {
        adminClients.add(ws);
        console.log("[WS] Admin client registered");
        const unread = db.notifications ? db.notifications.filter((n) => !n.read) : [];
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
function notifyAdmin(notification) {
  if (!db.notifications) db.notifications = [];
  const newNotif = {
    id: "notif-" + Math.random().toString(36).substr(2, 9),
    type: notification.type,
    message: notification.message,
    referenceId: notification.referenceId,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    read: false
  };
  db.notifications.unshift(newNotif);
  if (db.notifications.length > 100) {
    db.notifications = db.notifications.slice(0, 100);
  }
  saveDB();
  const payload = JSON.stringify({ type: "notification", notification: newNotif });
  adminClients.forEach((client) => {
    if (client.readyState === import_ws.WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
app.get("/api/admin/notifications", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  res.json(db.notifications || []);
});
app.post("/api/admin/notifications/read-all", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  if (db.notifications) {
    db.notifications.forEach((n) => n.read = true);
  }
  saveDB();
  res.json({ success: true });
});
app.post("/api/admin/notifications/:id/read", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== "Admin" /* ADMIN */) return res.status(403).json({ error: "Access denied" });
  const notif = db.notifications?.find((n) => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    saveDB();
  }
  res.json({ success: true, notification: notif });
});
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
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[TasksEarn Server] running on http://0.0.0.0:${PORT}`);
    console.log("====================================================================");
    console.log("[SMTP Mailer Diagnostics] Checking Mail Configuration on Startup...");
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    const from = process.env.SMTP_FROM;
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      console.log(`-> Resend Provider Detected (RESEND_API_KEY is configured)`);
    }
    console.log(`-> SMTP_HOST:      ${host ? host : "\u274C [MISSING]"}`);
    console.log(`-> SMTP_PORT:      ${port ? port : "\u274C [MISSING] (Defaults to 587 if omitted)"}`);
    console.log(`-> SMTP_USER:      ${user ? user : "\u274C [MISSING]"}`);
    console.log(`-> SMTP_FROM:      ${from ? from : "\u274C [MISSING]"}`);
    console.log(`-> SMTP_PASSWORD:  ${pass ? "\u2714 [CONFIGURED] (Masked for Security)" : "\u274C [MISSING]"}`);
    if (host && user && pass) {
      console.log(`[SMTP Mailer Startup] SUCCESS: Mail delivery system is READY using ${user}`);
    } else if (!resendKey) {
      console.error(`[SMTP Mailer Startup] ERROR: No valid email provider is configured.`);
      console.error(`Please verify that SMTP_HOST, SMTP_USER, and SMTP_PASSWORD are set in your environment variables.`);
    }
    console.log("====================================================================");
  });
}
startServer();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
