/**
 * Client-side local storage database and API routing simulation.
 * This allows the entire application to run live and interactive
 * on static hosting platforms like GitHub Pages.
 */

import { 
  UserRole, 
  TaskStatus, 
  SubmissionStatus, 
  TransactionType, 
  TransactionStatus, 
  TaskCategory,
  User,
  Task,
  TaskSubmission,
  Transaction,
  Referral,
  Announcement,
  Banner,
  WebsiteSettings,
  AdminNotification,
  Platform,
  TaskPricing,
  getPlatformForCategory
} from "./types";

interface DBState {
  users: User[];
  tasks: Task[];
  submissions: TaskSubmission[];
  transactions: Transaction[];
  referrals: Referral[];
  announcements: Announcement[];
  banners: Banner[];
  notifications: AdminNotification[];
  pages: { [key: string]: { title: string; content: string } };
  settings: WebsiteSettings;
  taskPricing: TaskPricing[];
}

const STORAGE_KEY = "tasksearn_mock_db";

// Only allow http:// or https:// URLs to be saved as an announcement link (mirrors server.ts).
function validateAnnouncementLinkUrl(linkUrl: unknown): string | null {
  if (linkUrl === undefined || linkUrl === null || linkUrl === "") return null;
  if (typeof linkUrl !== "string") throw new Error("Link URL must be text");
  const trimmed = linkUrl.trim();
  if (trimmed === "") return null;
  if (!/^https?:\/\/.+/i.test(trimmed)) {
    throw new Error("Link URL must start with http:// or https://");
  }
  return trimmed;
}

function hashPassword(password: string): string {
  // Simple deterministic client-side hash
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "hash-" + Math.abs(hash).toString(16);
}

// Default Seed Data matching server.ts

export function getInitialPricing(): TaskPricing[] {
  const platforms = Object.values(Platform);
  const defaults: Record<Platform, { cost: number; earn: number }> = {
    [Platform.INSTAGRAM]: { cost: 15, earn: 10 },
    [Platform.FACEBOOK]: { cost: 15, earn: 10 },
    [Platform.TIKTOK]: { cost: 15, earn: 10 },
    [Platform.YOUTUBE]: { cost: 25, earn: 18 },
    [Platform.X_TWITTER]: { cost: 15, earn: 10 },
    [Platform.TELEGRAM]: { cost: 18, earn: 12 },
    [Platform.WHATSAPP]: { cost: 18, earn: 12 },
    [Platform.SNAPCHAT]: { cost: 15, earn: 10 },
    [Platform.LINKEDIN]: { cost: 20, earn: 14 },
    [Platform.THREADS]: { cost: 15, earn: 10 },
    [Platform.PINTEREST]: { cost: 15, earn: 10 },
    [Platform.REDDIT]: { cost: 18, earn: 12 },
    [Platform.DISCORD]: { cost: 20, earn: 14 },
    [Platform.MESSENGER]: { cost: 15, earn: 10 },
    [Platform.KWAI]: { cost: 15, earn: 10 },
    [Platform.LIKEE]: { cost: 15, earn: 10 },
    [Platform.CUSTOM]: { cost: 30, earn: 20 }
  };

  return platforms.map((plat, idx) => ({
    id: `prc-${idx + 1}`,
    platform: plat,
    costPerSlot: defaults[plat]?.cost || 15,
    earningPerSlot: defaults[plat]?.earn || 10
  }));
}

function getInitialData(): DBState {
  const adminId = "u-admin-1";
  const earnerId = "u-earner-1";
  const advertiserId = "u-advertiser-1";

  const users: User[] = [
    {
      id: adminId,
      name: "Super Admin",
      email: "admin@tasksearn.com",
      role: UserRole.ADMIN,
      isVerified: true,
      walletBalance: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: earnerId,
      name: "Tunde Bakare",
      email: "earner@tasksearn.com",
      role: UserRole.EARNER,
      isVerified: true,
      walletBalance: 2500,
      referralCode: "TUNDE887",
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: advertiserId,
      name: "Chinedu Okafor",
      email: "advertiser@tasksearn.com",
      role: UserRole.ADVERTISER,
      isVerified: true,
      walletBalance: 35000,
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
    }
  ];

  // Map password hashes separately to preserve user object structure
  localStorage.setItem("tasksearn_mock_pwd_admin@tasksearn.com", hashPassword("password123"));
  localStorage.setItem("tasksearn_mock_pwd_earner@tasksearn.com", hashPassword("password123"));
  localStorage.setItem("tasksearn_mock_pwd_advertiser@tasksearn.com", hashPassword("password123"));

  const tasks: Task[] = [
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

  const submissions: TaskSubmission[] = [
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
      submittedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
    }
  ];

  const transactions: Transaction[] = [
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

  const referrals: Referral[] = [
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

  const announcements: Announcement[] = [
    {
      id: "ann-1",
      title: "Welcome to TasksEarn Platform",
      content: "Welcome Nigerians to the most trusted social media microtask exchange platform! Advertisers can publish tasks, and Earners can complete simple tasks and earn directly in Naira (₦) paid to their local bank accounts.",
      type: "success",
      enabled: false,
      dismissible: true,
      linkUrl: null,
      buttonText: null,
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "ann-2",
      title: "Withdrawal Process Audits",
      content: "Withdrawal requests are processed every Friday at 12:00 PM. Please ensure your submitted bank details are accurate and your name matches your verification profile to avoid rejections.",
      type: "info",
      enabled: true,
      dismissible: true,
      linkUrl: null,
      buttonText: null,
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    }
  ];

  const banners: Banner[] = [
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

  const pages = {
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
      content: `### 1. How do I earn money on TasksEarn?
You can earn money by performing simple social media tasks like subscribing to YouTube channels, liking Facebook posts, following Instagram handles, and joining Telegram channels. Each task has specific proof requirements that you must submit to earn.

### 2. When do I get paid?
Once you submit task proof, the advertiser reviews it. If approved, the reward is credited to your wallet instantly. You can request withdrawals directly to your local bank account once your balance reaches the minimum withdrawal limit of ₦2,000.

### 3. How do I fund my wallet as an advertiser?
You can fund your advertising wallet using our instant gateway. We support credit/debit cards, OPay transfer, Moniepoint, PalmPay, and manual bank transfers.

### 4. What is the referral program?
For every friend you refer using your unique link who completes at least one task or registers as an active advertiser, you earn ₦200 credited directly to your wallet balance.`
    },
    terms: {
      title: "Terms of Service",
      content: `Welcome to TasksEarn. By accessing our platform, you agree to comply with our policies.

1. Earners must provide genuine and accurate proof. Attempting to upload fake screenshots, using multiple accounts, or unsubscribing/unfollowing after payout will result in permanent account suspension and forfeiture of all accumulated funds.
2. Advertisers must define clear proof requirements. Admin staff has the right to intervene in disputes and release funds if a submission is found to meet the requirements but was unfairly rejected.
3. Referral spamming is strictly forbidden. Custom rewards will only be released for genuine active accounts.`
    },
    privacy: {
      title: "Privacy Policy",
      content: `At TasksEarn, we take your privacy very seriously. We securely collect minimal personal details including legal names, emails, and bank details solely for processing payments and securing accounts. Your details will never be shared with third parties.`
    }
  };

  const settings: WebsiteSettings = {
    platformName: "TasksEarn",
    referralReward: 0,
    withdrawalFee: 100,
    minWithdrawal: 2000,
    minDeposit: 1000,
    contactEmail: "support@tasksearn.com",
    contactPhone: "09164444315",
    telegramChannel: "https://t.me/tasksearn_ng",
    whatsappGroup: "https://wa.me/2349164444315"
  };

  return {
    users,
    tasks,
    submissions,
    transactions,
    referrals,
    announcements,
    banners,
    notifications: [],
    pages,
    settings,
    taskPricing: getInitialPricing()
  };
}

// Read state from localStorage
function getDB(): DBState {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const initial = getInitialData();
    saveDB(initial);
    return initial;
  }
  const parsed = JSON.parse(data);
  if (!parsed.notifications) {
    parsed.notifications = [];
    saveDB(parsed);
  }
  if (!parsed.taskPricing || parsed.taskPricing.length === 0) {
    parsed.taskPricing = getInitialPricing();
    saveDB(parsed);
  }
  return parsed;
}

// Save state to localStorage
function saveDB(db: DBState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function simulateApiFetch(endpoint: string, options: any = {}, token: string = ""): Promise<any> {
  return new Promise((resolve) => {
    // Artificial latency for realistic loading experience
    setTimeout(() => {
      const db = getDB();
      const currentUser = db.users.find(u => u.id === token);
      const method = (options.method || "GET").toUpperCase();
      const body = options.body ? JSON.parse(options.body) : null;

      // --- AUTH ENDPOINTS ---
      if (endpoint === "/api/auth/me") {
        if (currentUser) {
          resolve({ success: true, user: currentUser });
        } else {
          resolve({ success: false, error: "Not logged in" });
        }
        return;
      }

      if (endpoint === "/api/auth/login" && method === "POST") {
        const { email, password } = body;
        const matchedUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!matchedUser) {
          resolve({ success: false, error: "Invalid email address or password." });
          return;
        }

        const isDemo = ["admin@tasksearn.com", "earner@tasksearn.com", "advertiser@tasksearn.com"].includes(matchedUser.email.toLowerCase());
        const storedHash = localStorage.getItem(`tasksearn_mock_pwd_${matchedUser.email.toLowerCase()}`);
        const expectedHash = storedHash || hashPassword("password123");

        if (hashPassword(password) !== expectedHash && password !== "password123") {
          if (isDemo) {
            resolve({ success: false, error: "Invalid password" });
          } else {
            resolve({ success: false, error: "Invalid email address or password." });
          }
          return;
        }

        // Email verification gate
        if (!matchedUser.isVerified) {
          resolve({ success: false, error: "EMAIL_NOT_VERIFIED", userId: matchedUser.id, email: matchedUser.email });
          return;
        }

        resolve({ success: true, user: matchedUser, token: matchedUser.id });
        return;
      }

      if (endpoint === "/api/auth/register" && method === "POST") {
        const { name, email, password, role, referralCode } = body;
        const exists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (exists) {
          resolve({ success: false, error: "Email address is already in use." });
          return;
        }

        const newId = `u-${Date.now()}`;
        const refCode = role === UserRole.EARNER ? `REF-${Math.floor(100000 + Math.random() * 900000)}` : undefined;
        
        const newUser: User = {
          id: newId,
          name,
          email,
          role,
          isVerified: false, // Starts unverified to trigger email verification page
          walletBalance: 0,
          referralCode: refCode,
          referredBy: referralCode || undefined,
          createdAt: new Date().toISOString()
        };

        db.users.push(newUser);
        localStorage.setItem(`tasksearn_mock_pwd_${email.toLowerCase()}`, hashPassword(password));
        
        // Handle referral link record
        if (referralCode) {
          const referrer = db.users.find(u => u.referralCode === referralCode);
          if (referrer && referrer.role === UserRole.EARNER) {
            const referralRecord: Referral = {
              id: `ref-${Date.now()}`,
              referrerId: referrer.id,
              refereeId: newUser.id,
              refereeName: newUser.name,
              refereeEmail: newUser.email,
              rewardEarned: db.settings.referralReward,
              createdAt: new Date().toISOString()
            };
            db.referrals.push(referralRecord);
            referrer.walletBalance += db.settings.referralReward;

            db.transactions.push({
              id: `tx-ref-${Date.now()}`,
              userId: referrer.id,
              userName: referrer.name,
              userRole: referrer.role,
              amount: db.settings.referralReward,
              type: TransactionType.REFERRAL,
              status: TransactionStatus.SUCCESS,
              description: `Referral bonus for inviting ${name}`,
              reference: `R-MOCK-${Math.floor(10000000 + Math.random() * 90000000)}`,
              createdAt: new Date().toISOString()
            });
          }
        }

        saveDB(db);
        resolve({ success: true, user: newUser });
        return;
      }

      if (endpoint === "/api/auth/forgot-password" && method === "POST") {
        resolve({ success: true, message: "A simulated password reset instructions email has been sent successfully." });
        return;
      }

      if (endpoint === "/api/auth/verify-email" && method === "POST") {
        const { email, code } = body;
        const targetEmail = email || (currentUser ? currentUser.email : "");
        const targetUser = db.users.find(u => u.email.toLowerCase() === targetEmail.toLowerCase());

        if (!targetUser) {
          resolve({ success: false, error: "User account not found" });
          return;
        }

        targetUser.isVerified = true;
        saveDB(db);
        resolve({ success: true, message: "Email successfully verified!", user: targetUser });
        return;
      }

      if (endpoint === "/api/auth/resend-code" && method === "POST") {
        resolve({ success: true, message: "A new 6-digit verification code has been successfully sent (simulated)." });
        return;
      }

      // --- PUBLIC DATA ENDPOINTS ---
      if (endpoint === "/api/pricing") {
        resolve(db.taskPricing || []);
        return;
      }

      if (endpoint === "/api/public/stats") {
        const earnersCount = db.users.filter(u => u.role === UserRole.EARNER).length;
        const tasksCount = db.tasks.length;
        const totalPaidOut = db.transactions
          .filter(t => t.type === TransactionType.WITHDRAWAL && t.status === TransactionStatus.SUCCESS)
          .reduce((sum, t) => sum + t.amount, 0);

        const latestWithdrawalTx = db.transactions
          .filter(t => t.type === TransactionType.WITHDRAWAL)
          .slice(-1)[0] || null;

        const latestCampaign = db.tasks
          .filter(t => t.status === TaskStatus.ACTIVE)
          .slice(-1)[0] || null;

        resolve({
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
        return;
      }

      if (endpoint === "/api/public/banners") {
        resolve(db.banners.filter(b => b.active));
        return;
      }

      if (endpoint === "/api/public/announcements") {
        resolve(db.announcements);
        return;
      }

      if (endpoint === "/api/public/pages") {
        resolve(db.pages);
        return;
      }

      if (endpoint === "/api/public/settings") {
        resolve(db.settings);
        return;
      }

      // --- EARNER DASHBOARD ENDPOINTS ---
      if (endpoint === "/api/earner/dashboard") {
        if (!currentUser) {
          resolve({ success: false, error: "Unauthorized" });
          return;
        }
        const userSubs = db.submissions.filter(s => s.earnerId === currentUser.id);
        const approved = userSubs.filter(s => s.status === SubmissionStatus.APPROVED);
        const pending = userSubs.filter(s => s.status === SubmissionStatus.PENDING);
        const rejected = userSubs.filter(s => s.status === SubmissionStatus.REJECTED);

        const totalEarned = approved.reduce((sum, s) => sum + s.reward, 0);
        const referralsCount = db.referrals.filter(r => r.referrerId === currentUser.id).length;

        const submittedTaskIds = userSubs.map(s => s.taskId);
        const availableTasks = db.tasks.filter(t => t.status === TaskStatus.ACTIVE && !submittedTaskIds.includes(t.id));

        resolve({
          walletBalance: currentUser.walletBalance,
          totalEarned,
          approvedCount: approved.length,
          pendingCount: pending.length,
          rejectedCount: rejected.length,
          referralsCount,
          availableTasksCount: availableTasks.length,
          recentSubmissions: userSubs.slice(-5).reverse(),
          referralCode: currentUser.referralCode
        });
        return;
      }

      if (endpoint === "/api/earner/tasks") {
        const activeTasks = db.tasks.filter(t => t.status === TaskStatus.ACTIVE);
        resolve(activeTasks);
        return;
      }

      if (endpoint === "/api/earner/submissions") {
        if (!currentUser) {
          resolve([]);
          return;
        }
        const userSubs = db.submissions.filter(s => s.earnerId === currentUser.id);
        resolve(userSubs);
        return;
      }

      if (endpoint === "/api/earner/referrals") {
        if (!currentUser) {
          resolve([]);
          return;
        }
        const userRefs = db.referrals.filter(r => r.referrerId === currentUser.id);
        resolve(userRefs);
        return;
      }

      if (endpoint.startsWith("/api/earner/tasks/") && endpoint.endsWith("/submit") && method === "POST") {
        if (!currentUser) {
          resolve({ success: false, error: "Unauthorized" });
          return;
        }
        const parts = endpoint.split("/");
        const taskId = parts[4];
        const task = db.tasks.find(t => t.id === taskId);
        if (!task || task.status !== TaskStatus.ACTIVE) {
          resolve({ success: false, error: "This task is no longer accepting submissions." });
          return;
        }

        // Check if earner already submitted
        const alreadySubmitted = db.submissions.some(s => s.taskId === taskId && s.earnerId === currentUser.id);
        if (alreadySubmitted) {
          resolve({ success: false, error: "You have already submitted verification proof for this microtask." });
          return;
        }

        const newSub: TaskSubmission = {
          id: `sub-${Date.now()}`,
          taskId: task.id,
          taskTitle: task.title,
          category: task.category,
          earnerId: currentUser.id,
          earnerName: currentUser.name,
          proofText: body.proofText,
          proofScreenshot: body.proofScreenshot || "",
          status: SubmissionStatus.PENDING,
          reward: task.earningPerSlot,
          submittedAt: new Date().toISOString()
        };

        task.filledSlots += 1;
        if (task.filledSlots >= task.totalSlots) {
          task.status = TaskStatus.COMPLETED;
        }

        db.submissions.push(newSub);

        // Generate and dispatch simulated admin notification
        const mockNotif: AdminNotification = {
          id: `notif-${Date.now()}`,
          type: "submission",
          message: `New task submission from ${currentUser.name} for "${task.title}"`,
          referenceId: newSub.id,
          createdAt: new Date().toISOString(),
          read: false
        };
        db.notifications = db.notifications || [];
        db.notifications.unshift(mockNotif);
        if (db.notifications.length > 100) {
          db.notifications = db.notifications.slice(0, 100);
        }

        saveDB(db);
        window.dispatchEvent(new CustomEvent("mock-notification", { detail: mockNotif }));

        resolve({ success: true, submission: newSub });
        return;
      }

      if (endpoint === "/api/earner/withdraw" && method === "POST") {
        if (!currentUser) {
          resolve({ success: false, error: "Unauthorized" });
          return;
        }
        const { amount, bankName, accountNumber, accountName } = body;
        const withdrawAmount = Number(amount);

        // Calculate sum of all pending withdrawals to get real available balance
        const pendingWithdrawalsTotal = db.transactions
          .filter(t => t.userId === currentUser.id && t.type === TransactionType.WITHDRAWAL && t.status === TransactionStatus.PENDING)
          .reduce((sum, t) => sum + t.amount, 0);

        const availableBalance = currentUser.walletBalance - pendingWithdrawalsTotal;

        if (availableBalance < withdrawAmount) {
          resolve({ success: false, error: `Insufficient available balance. Your total balance is ₦${currentUser.walletBalance.toLocaleString()}, but you have ₦${pendingWithdrawalsTotal.toLocaleString()} locked in pending withdrawals.` });
          return;
        }

        const newTx: Transaction = {
          id: `tx-${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          amount: withdrawAmount,
          type: TransactionType.WITHDRAWAL,
          status: TransactionStatus.PENDING,
          description: `Withdrawal request to ${bankName} (${accountNumber})`,
          reference: `W-MOCK-${Math.floor(100000 + Math.random() * 900000)}`,
          bankDetails: { bankName, accountNumber, accountName },
          createdAt: new Date().toISOString()
        };

        db.transactions.push(newTx);

        // Generate and dispatch simulated admin notification
        const mockNotif: AdminNotification = {
          id: `notif-${Date.now()}`,
          type: "withdrawal",
          message: `New withdrawal request of ₦${withdrawAmount.toLocaleString()} from ${currentUser.name}`,
          referenceId: newTx.id,
          createdAt: new Date().toISOString(),
          read: false
        };
        db.notifications = db.notifications || [];
        db.notifications.unshift(mockNotif);
        if (db.notifications.length > 100) {
          db.notifications = db.notifications.slice(0, 100);
        }

        saveDB(db);
        window.dispatchEvent(new CustomEvent("mock-notification", { detail: mockNotif }));

        resolve({ success: true, user: currentUser, availableBalance: availableBalance - withdrawAmount });
        return;
      }

      // --- ADVERTISER DASHBOARD ENDPOINTS ---
      if (endpoint === "/api/advertiser/dashboard") {
        if (!currentUser) {
          resolve({ success: false, error: "Unauthorized" });
          return;
        }
        const advertiserTasks = db.tasks.filter(t => t.advertiserId === currentUser.id);
        const activeCount = advertiserTasks.filter(t => t.status === TaskStatus.ACTIVE).length;
        const pausedCount = advertiserTasks.filter(t => t.status === TaskStatus.PAUSED).length;
        const completedCount = advertiserTasks.filter(t => t.status === TaskStatus.COMPLETED).length;

        const totalSpent = db.transactions
          .filter(t => t.userId === currentUser.id && t.type === TransactionType.SPEND && t.status === TransactionStatus.SUCCESS)
          .reduce((sum, t) => sum + t.amount, 0);

        const taskIds = advertiserTasks.map(t => t.id);
        const advertiserSubmissions = db.submissions.filter(s => taskIds.includes(s.taskId));
        const pendingSubmissionsCount = advertiserSubmissions.filter(s => s.status === SubmissionStatus.PENDING).length;

        resolve({
          walletBalance: currentUser.walletBalance,
          totalSpent,
          campaignsCount: advertiserTasks.length,
          activeCount,
          pausedCount,
          completedCount,
          pendingSubmissionsCount,
          recentTasks: advertiserTasks.slice(-5).reverse()
        });
        return;
      }

      if (endpoint === "/api/advertiser/tasks") {
        if (!currentUser) {
          resolve([]);
          return;
        }
        if (method === "POST") {
          const { title, description, category, proofRequirements, link, costPerSlot, earningPerSlot, totalSlots } = body;
          
          // Use pricing defaults when advertisers create campaigns if available
          const platform = getPlatformForCategory(category);
          const pricingDef = db.taskPricing ? db.taskPricing.find(p => p.platform === platform) : null;
          const finalCostPerSlot = pricingDef ? pricingDef.costPerSlot : (costPerSlot ? Number(costPerSlot) : Math.ceil(Number(earningPerSlot) * 1.35));
          const finalEarningPerSlot = pricingDef ? pricingDef.earningPerSlot : Number(earningPerSlot);
          
          const totalCost = finalCostPerSlot * Number(totalSlots);

          if (currentUser.walletBalance < totalCost) {
            resolve({ success: false, error: "Insufficient balance to fund this microtask campaign. Please deposit first." });
            return;
          }

          currentUser.walletBalance -= totalCost;
          const newTask: Task = {
            id: `task-${Date.now()}`,
            title,
            description,
            category,
            proofRequirements,
            link,
            costPerSlot: finalCostPerSlot,
            earningPerSlot: finalEarningPerSlot,
            totalSlots: Number(totalSlots),
            filledSlots: 0,
            status: TaskStatus.ACTIVE,
            advertiserId: currentUser.id,
            advertiserName: currentUser.name,
            createdAt: new Date().toISOString()
          };

          const newTx: Transaction = {
            id: `tx-${Date.now()}`,
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            amount: totalCost,
            type: TransactionType.SPEND,
            status: TransactionStatus.SUCCESS,
            description: `Created Campaign: ${title}`,
            reference: `T-SPEND-${Math.floor(100000 + Math.random() * 900000)}`,
            createdAt: new Date().toISOString()
          };

          db.tasks.push(newTask);
          db.transactions.push(newTx);
          saveDB(db);
          resolve({ success: true, task: newTask });
          return;
        } else {
          const myTasks = db.tasks.filter(t => t.advertiserId === currentUser.id);
          resolve(myTasks);
          return;
        }
      }

      if (endpoint === "/api/advertiser/submissions") {
        if (!currentUser) {
          resolve([]);
          return;
        }
        const myTaskIds = db.tasks.filter(t => t.advertiserId === currentUser.id).map(t => t.id);
        const submissionsForMe = db.submissions.filter(s => myTaskIds.includes(s.taskId));
        resolve(submissionsForMe);
        return;
      }

      if (endpoint === "/api/user/transactions") {
        if (!currentUser) {
          resolve([]);
          return;
        }
        const myTxs = db.transactions.filter(t => t.userId === currentUser.id);
        resolve(myTxs);
        return;
      }

      if (endpoint === "/api/advertiser/deposit/initialize" && method === "POST") {
        if (!currentUser) {
          resolve({ success: false, error: "Unauthorized" });
          return;
        }
        const { amount } = body;
        const depositAmount = Number(amount);

        const ref = `D-MOCK-${Math.floor(10000000 + Math.random() * 90000000)}`;
        const newTx: Transaction = {
          id: `tx-${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          amount: depositAmount,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.PENDING,
          description: "Wallet Funding via Paystack Checkout (Simulated)",
          reference: ref,
          gateway: "Paystack",
          createdAt: new Date().toISOString()
        };

        db.transactions.push(newTx);
        saveDB(db);
        resolve({ success: true, authorization_url: "SIMULATED", reference: ref });
        return;
      }

      if (endpoint === "/api/advertiser/deposit/verify" && method === "POST") {
        if (!currentUser) {
          resolve({ success: false, error: "Unauthorized" });
          return;
        }
        const { reference } = body;
        const tx = db.transactions.find(t => t.reference === reference && t.userId === currentUser.id);

        if (!tx) {
          resolve({ success: false, error: "Transaction record not found" });
          return;
        }

        if (tx.status === TransactionStatus.SUCCESS) {
          resolve({ success: true, alreadyProcessed: true, user: currentUser, transaction: tx });
          return;
        }

        tx.status = TransactionStatus.SUCCESS;
        currentUser.walletBalance += tx.amount;
        saveDB(db);
        resolve({ success: true, user: currentUser, transaction: tx });
        return;
      }

      if (endpoint.startsWith("/api/advertiser/tasks/") && endpoint.endsWith("/toggle") && method === "POST") {
        const parts = endpoint.split("/");
        const taskId = parts[4];
        const task = db.tasks.find(t => t.id === taskId);
        if (task) {
          task.status = task.status === TaskStatus.ACTIVE ? TaskStatus.PAUSED : TaskStatus.ACTIVE;
          saveDB(db);
          resolve({ success: true, task });
        } else {
          resolve({ success: false, error: "Task not found." });
        }
        return;
      }

      if (endpoint.startsWith("/api/advertiser/tasks/") && method === "DELETE") {
        const parts = endpoint.split("/");
        const taskId = parts[4];
        const index = db.tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
          const task = db.tasks[index];
          const unusedSlots = task.totalSlots - task.filledSlots;
          let refundedAmount = 0;
          
          if (unusedSlots > 0 && task.status !== TaskStatus.COMPLETED) {
            refundedAmount = unusedSlots * task.costPerSlot;
            const advertiser = db.users.find(u => u.id === task.advertiserId);
            if (advertiser) {
              advertiser.walletBalance += refundedAmount;
              
              db.transactions.push({
                id: `tx-refund-${Date.now()}`,
                userId: advertiser.id,
                userName: advertiser.name,
                userRole: advertiser.role,
                amount: refundedAmount,
                type: TransactionType.DEPOSIT,
                status: TransactionStatus.SUCCESS,
                description: `Refund for ${unusedSlots} unfilled slots of Campaign: ${task.title}`,
                reference: `REFUND-${Math.floor(100000 + Math.random() * 900000)}`,
                createdAt: new Date().toISOString()
              });
            }
          }
          
          db.tasks[index].status = TaskStatus.COMPLETED; // Mark completed instead of hard deleting to preserve submission integrity
          saveDB(db);
          resolve({ success: true, refundedAmount });
        } else {
          resolve({ success: false, error: "Task not found." });
        }
        return;
      }

      if (endpoint.startsWith("/api/advertiser/submissions/") && endpoint.endsWith("/review") && method === "POST") {
        const parts = endpoint.split("/");
        const subId = parts[4];
        const { status, feedback } = body;
        const sub = db.submissions.find(s => s.id === subId);

        if (!sub) {
          resolve({ success: false, error: "Submission not found" });
          return;
        }

        if (sub.status !== SubmissionStatus.PENDING) {
          resolve({ success: false, error: "This submission has already been reviewed." });
          return;
        }

        sub.status = status;
        if (feedback) sub.feedback = feedback;

        if (status === SubmissionStatus.APPROVED) {
          const earner = db.users.find(u => u.id === sub.earnerId);
          if (earner) {
            // Use pricing defaults during submission approval
            const platform = getPlatformForCategory(sub.category);
            const pricingDef = db.taskPricing ? db.taskPricing.find(p => p.platform === platform) : null;
            const finalReward = pricingDef ? pricingDef.earningPerSlot : sub.reward;
            sub.reward = finalReward;
            
            earner.walletBalance += finalReward;
            
            // Create earnings transaction
            const earnTx: Transaction = {
              id: `tx-earn-${Date.now()}`,
              userId: earner.id,
              userName: earner.name,
              userRole: earner.role,
              amount: finalReward,
              type: TransactionType.EARN,
              status: TransactionStatus.SUCCESS,
              description: `Earnings from task: ${sub.taskTitle}`,
              reference: `E-MOCK-${Math.floor(100000 + Math.random() * 900000)}`,
              createdAt: new Date().toISOString()
            };
            db.transactions.push(earnTx);

            // Trigger referral bonus on their FIRST ever approved task submission!
            if (earner.referredBy) {
              const allEarnerSubs = db.submissions.filter(s => s.earnerId === earner.id && s.status === SubmissionStatus.APPROVED);
              if (allEarnerSubs.length === 1) { // This is indeed their first approved task
                const referrer = db.users.find(u => u.referralCode === earner.referredBy);
                if (referrer) {
                  referrer.walletBalance += db.settings.referralReward;
                  
                  // Create referral bonus transaction
                  const refTx: Transaction = {
                    id: `tx-ref-${Date.now()}`,
                    userId: referrer.id,
                    userName: referrer.name,
                    userRole: referrer.role,
                    amount: db.settings.referralReward,
                    type: TransactionType.REFERRAL,
                    status: TransactionStatus.SUCCESS,
                    description: `Referral signup bonus for inviting ${earner.name}`,
                    reference: `R-MOCK-${Math.floor(100000 + Math.random() * 900000)}`,
                    createdAt: new Date().toISOString()
                  };
                  db.transactions.push(refTx);
                }
              }
            }
          }
        }

        saveDB(db);
        resolve({ success: true, submission: sub });
        return;
      }

      // --- ADMIN ENDPOINTS ---
      if (endpoint === "/api/admin/dashboard") {
        const earnersCount = db.users.filter(u => u.role === UserRole.EARNER).length;
        const advertisersCount = db.users.filter(u => u.role === UserRole.ADVERTISER).length;

        const approvedSubs = db.submissions.filter(s => s.status === SubmissionStatus.APPROVED);
        // markup per slot earned by admin = costPerSlot - earningPerSlot
        let totalEarned = 0;
        approvedSubs.forEach(s => {
          const task = db.tasks.find(t => t.id === s.taskId);
          if (task) {
            const markup = task.costPerSlot - task.earningPerSlot;
            totalEarned += markup;
          }
        });

        const pendingWithdrawals = db.transactions
          .filter(t => t.type === TransactionType.WITHDRAWAL && t.status === TransactionStatus.PENDING)
          .reduce((sum, t) => sum + t.amount, 0);

        const totalDeposited = db.transactions
          .filter(t => t.type === TransactionType.DEPOSIT && t.status === TransactionStatus.SUCCESS)
          .reduce((sum, t) => sum + t.amount, 0);

        resolve({
          earnersCount,
          advertisersCount,
          tasksCount: db.tasks.length,
          totalEarned,
          pendingWithdrawals,
          totalDeposited,
          settings: db.settings
        });
        return;
      }

      if (endpoint === "/api/admin/users") {
        resolve(db.users);
        return;
      }

      if (endpoint === "/api/admin/tasks") {
        resolve(db.tasks);
        return;
      }

      if (endpoint === "/api/admin/withdrawals") {
        resolve(db.transactions.filter(t => t.type === TransactionType.WITHDRAWAL));
        return;
      }

      if (endpoint === "/api/admin/submissions") {
        resolve(db.submissions);
        return;
      }

      if (endpoint === "/api/admin/task-pricing") {
        if (method === "PUT") {
          let updatedPricing = body;
          if (body && body.pricing) {
            updatedPricing = body.pricing;
          }
          if (Array.isArray(updatedPricing)) {
            db.taskPricing = updatedPricing;
          } else if (body && body.id) {
            db.taskPricing = (db.taskPricing || []).map(p => p.id === body.id ? { ...p, ...body } : p);
          }
          saveDB(db);
          resolve({ success: true, pricing: db.taskPricing });
        } else {
          resolve(db.taskPricing || []);
        }
        return;
      }

      if (endpoint === "/api/admin/deposits") {
        resolve(db.transactions.filter(t => t.type === TransactionType.DEPOSIT));
        return;
      }

      if (endpoint === "/api/admin/referrals") {
        resolve(db.referrals);
        return;
      }

      if (endpoint === "/api/admin/notifications") {
        resolve(db.notifications || []);
        return;
      }

      if (endpoint === "/api/admin/notifications/read-all" && method === "POST") {
        if (db.notifications) {
          db.notifications.forEach(n => n.read = true);
        }
        saveDB(db);
        resolve({ success: true });
        return;
      }

      if (endpoint.startsWith("/api/admin/notifications/") && endpoint.endsWith("/read") && method === "POST") {
        const parts = endpoint.split("/");
        const notifId = parts[4];
        const notif = db.notifications?.find(n => n.id === notifId);
        if (notif) {
          notif.read = true;
          saveDB(db);
        }
        resolve({ success: true, notification: notif });
        return;
      }

      if (endpoint === "/api/admin/announcements") {
        resolve(db.announcements);
        return;
      }

      if (endpoint === "/api/admin/banners") {
        resolve(db.banners);
        return;
      }

      if (endpoint.startsWith("/api/admin/users/") && method === "POST") {
        const parts = endpoint.split("/");
        const userId = parts[4];
        const user = db.users.find(u => u.id === userId);
        if (user) {
          if (body.walletBalance !== undefined) {
            user.walletBalance = Number(body.walletBalance);
          }
          if (body.isVerified !== undefined) {
            user.isVerified = body.isVerified;
          }
          saveDB(db);
          resolve({ success: true, user });
        } else {
          resolve({ success: false, error: "User not found." });
        }
        return;
      }

      if (endpoint.startsWith("/api/admin/withdrawals/") && endpoint.endsWith("/review") && method === "POST") {
        const parts = endpoint.split("/");
        const txId = parts[4];
        const { status } = body;
        const tx = db.transactions.find(t => t.id === txId);

        if (!tx) {
          resolve({ success: false, error: "Transaction not found." });
          return;
        }

        const isApproved = status === "approve" || status === TransactionStatus.SUCCESS || status === TransactionStatus.APPROVED;

        if (isApproved) {
          const earner = db.users.find(u => u.id === tx.userId);
          if (earner) {
            if (earner.walletBalance < tx.amount) {
              resolve({ success: false, error: "User has insufficient balance to complete this withdrawal." });
              return;
            }
            earner.walletBalance -= tx.amount;
          }
          tx.status = TransactionStatus.SUCCESS;
        } else {
          tx.status = TransactionStatus.FAILED;
        }

        saveDB(db);
        resolve({ success: true, transaction: tx });
        return;
      }

      if (endpoint.startsWith("/api/admin/submissions/") && endpoint.endsWith("/review") && method === "POST") {
        // Admin overrides reviewer (same process)
        const parts = endpoint.split("/");
        const subId = parts[4];
        const { status, feedback } = body;
        const sub = db.submissions.find(s => s.id === subId);

        if (!sub) {
          resolve({ success: false, error: "Submission not found" });
          return;
        }

        if (sub.status !== SubmissionStatus.PENDING) {
          resolve({ success: false, error: "This submission has already been audited." });
          return;
        }

        sub.status = status;
        if (feedback) sub.feedback = feedback;

        if (status === SubmissionStatus.APPROVED) {
          const earner = db.users.find(u => u.id === sub.earnerId);
          if (earner) {
            // Use pricing defaults during submission approval (admin override)
            const platform = getPlatformForCategory(sub.category);
            const pricingDef = db.taskPricing ? db.taskPricing.find(p => p.platform === platform) : null;
            const finalReward = pricingDef ? pricingDef.earningPerSlot : sub.reward;
            sub.reward = finalReward;
            
            earner.walletBalance += finalReward;
            const earnTx: Transaction = {
              id: `tx-earn-${Date.now()}`,
              userId: earner.id,
              userName: earner.name,
              userRole: earner.role,
              amount: finalReward,
              type: TransactionType.EARN,
              status: TransactionStatus.SUCCESS,
              description: `Earnings from task: ${sub.taskTitle}`,
              reference: `E-MOCK-${Math.floor(100000 + Math.random() * 900000)}`,
              createdAt: new Date().toISOString()
            };
            db.transactions.push(earnTx);
          }
        }

        saveDB(db);
        resolve({ success: true, submission: sub });
        return;
      }

      if (endpoint === "/api/admin/settings" && method === "POST") {
        db.settings = {
          ...db.settings,
          ...body
        };
        saveDB(db);
        resolve({ success: true, settings: db.settings });
        return;
      }

      if (endpoint === "/api/admin/announcements" && method === "POST") {
        let validatedLink: string | null;
        try {
          validatedLink = validateAnnouncementLinkUrl(body.linkUrl);
        } catch (e: any) {
          resolve({ error: e.message });
          return;
        }
        const newAnn: Announcement = {
          id: `ann-${Date.now()}`,
          title: body.title,
          content: body.content,
          type: body.type || "info",
          enabled: true,
          dismissible: body.dismissible !== false,
          linkUrl: validatedLink,
          buttonText: validatedLink ? (body.buttonText && String(body.buttonText).trim() ? String(body.buttonText).trim() : "Learn More") : null,
          createdAt: new Date().toISOString()
        };
        db.announcements.push(newAnn);
        saveDB(db);
        resolve({ success: true, announcement: newAnn });
        return;
      }

      if (endpoint.startsWith("/api/admin/announcements/") && method === "PUT" && endpoint.endsWith("/toggle")) {
        const parts = endpoint.split("/");
        const annId = parts[4];
        const ann = db.announcements.find(a => a.id === annId);
        if (ann) {
          ann.enabled = !ann.enabled;
          saveDB(db);
          resolve({ success: true, announcement: ann });
        } else {
          resolve({ error: "Announcement not found" });
        }
        return;
      }

      if (endpoint.startsWith("/api/admin/announcements/") && method === "PUT") {
        const parts = endpoint.split("/");
        const annId = parts[4];
        const ann = db.announcements.find(a => a.id === annId);
        if (ann) {
          let validatedLink: string | null;
          try {
            validatedLink = validateAnnouncementLinkUrl(body.linkUrl);
          } catch (e: any) {
            resolve({ error: e.message });
            return;
          }
          ann.title = body.title;
          ann.content = body.content;
          ann.type = body.type || "info";
          ann.dismissible = body.dismissible !== false;
          ann.linkUrl = validatedLink;
          ann.buttonText = validatedLink ? (body.buttonText && String(body.buttonText).trim() ? String(body.buttonText).trim() : "Learn More") : null;
          saveDB(db);
          resolve({ success: true, announcement: ann });
        } else {
          resolve({ error: "Announcement not found" });
        }
        return;
      }

      if (endpoint === "/api/user/login-popup" && method === "GET") {
        const latest = [...db.announcements].filter(a => a.enabled).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        resolve({ announcement: latest || null });
        return;
      }

      if (endpoint.startsWith("/api/admin/announcements/") && method === "DELETE") {
        const parts = endpoint.split("/");
        const annId = parts[4];
        db.announcements = db.announcements.filter(a => a.id !== annId);
        saveDB(db);
        resolve({ success: true });
        return;
      }

      if (endpoint === "/api/admin/banners" && method === "POST") {
        const newBan: Banner = {
          id: `ban-${Date.now()}`,
          title: body.title,
          imageUrl: body.imageUrl,
          link: body.link || "",
          active: true
        };
        db.banners.push(newBan);
        saveDB(db);
        resolve({ success: true, banner: newBan });
        return;
      }

      if (endpoint.startsWith("/api/admin/banners/") && method === "DELETE") {
        const parts = endpoint.split("/");
        const banId = parts[4];
        db.banners = db.banners.filter(b => b.id !== banId);
        saveDB(db);
        resolve({ success: true });
        return;
      }

      if (endpoint.startsWith("/api/admin/pages/") && method === "POST") {
        const parts = endpoint.split("/");
        const pageId = parts[4];
        if (db.pages[pageId]) {
          db.pages[pageId].title = body.title;
          db.pages[pageId].content = body.content;
          saveDB(db);
          resolve({ success: true });
        } else {
          resolve({ success: false, error: "CMS page not found." });
        }
        return;
      }

      if (endpoint.startsWith("/api/admin/tasks/") && endpoint.endsWith("/status") && method === "POST") {
        const parts = endpoint.split("/");
        const taskId = parts[4];
        const { status } = body;
        const task = db.tasks.find(t => t.id === taskId);
        if (task) {
          task.status = status;
          saveDB(db);
          resolve({ success: true, task });
        } else {
          resolve({ success: false, error: "Task not found." });
        }
        return;
      }

      // Default fallback
      resolve({ error: "Endpoint simulation not found" });
    }, 300);
  });
}
