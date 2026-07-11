/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  EARNER = "Earner",
  ADVERTISER = "Advertiser",
  ADMIN = "Admin"
}

export enum TaskCategory {
  FB_LIKE = "Facebook Like",
  FB_FOLLOW = "Facebook Follow",
  FB_SHARE = "Facebook Share",
  FB_COMMENT = "Facebook Comment",
  IG_LIKE = "Instagram Like",
  IG_FOLLOW = "Instagram Follow",
  TIKTOK_LIKE = "TikTok Like",
  TIKTOK_FOLLOW = "TikTok Follow",
  TIKTOK_COMMENT = "TikTok Comment",
  YT_SUBSCRIBE = "YouTube Subscribe",
  YT_LIKE = "YouTube Like",
  YT_WATCH = "YouTube Watch",
  TELEGRAM_JOIN = "Telegram Join",
  WHATSAPP_JOIN = "WhatsApp Join",
  X_FOLLOW = "X (Twitter) Follow",
  
  // Custom non-social media tasks
  WEB_VISIT = "Website Visit",
  APP_DOWNLOAD = "App Download",
  APP_REGISTRATION = "App Registration",
  EMAIL_SIGNUP = "Email Signup",
  SURVEY = "Survey Completion",
  REVIEW_SUBMISSION = "Review Submission",
  REFERRAL_TASK = "Referral Task",
  QR_CODE_SCAN = "QR Code Scan",
  DOCUMENT_DOWNLOAD = "Document Download",
  
  // Additional social platforms
  SNAPCHAT_ADD = "Snapchat Add/Follow",
  LINKEDIN_FOLLOW = "LinkedIn Follow/Connect",
  THREADS_FOLLOW = "Threads Follow",
  PINTEREST_FOLLOW = "Pinterest Follow",
  REDDIT_JOIN = "Reddit Join",
  DISCORD_JOIN = "Discord Join",
  MESSENGER_CHAT = "Messenger Chat",
  KWAI_FOLLOW = "Kwai Follow",
  LIKEE_FOLLOW = "Likee Follow",
  CUSTOM = "Other Custom Task"
}

export enum TaskStatus {
  ACTIVE = "Active",
  PAUSED = "Paused",
  COMPLETED = "Completed",
  PENDING_APPROVAL = "Pending Approval" // for tasks created by advertiser that admin might need to review (optional, but we support auto-active as configured)
}

export enum SubmissionStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected"
}

export enum TransactionType {
  DEPOSIT = "Deposit",
  WITHDRAWAL = "Withdrawal",
  EARN = "Task Earnings",
  SPEND = "Campaign Spend",
  REFERRAL = "Referral Bonus",
  ACTIVATION = "Activation Fee"
}

export enum TransactionStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  SUCCESS = "Success",
  FAILED = "Failed"
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  isActivated?: boolean; // Earners must pay ₦500 activation fee; Admins/Advertisers are pre-activated
  walletBalance: number;
  referralCode?: string;
  referredBy?: string;
  createdAt: string;
  // Extended profile fields
  username?: string;
  phone?: string;
  country?: string;
  businessName?: string;
  photoUrl?: string;
  twoFactorEnabled?: boolean;
  notificationPrefs?: {
    emailNotifications: boolean;
    campaignUpdates: boolean;
    transactionAlerts: boolean;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  proofRequirements: string;
  link: string;
  costPerSlot: number; // What the advertiser pays
  earningPerSlot: number; // What the earner receives
  totalSlots: number;
  filledSlots: number;
  status: TaskStatus;
  advertiserId: string;
  advertiserName: string;
  createdAt: string;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  category: TaskCategory;
  earnerId: string;
  earnerName: string;
  proofText: string;
  proofScreenshot: string; // URL or Base64 string
  status: SubmissionStatus;
  feedback?: string;
  reward: number;
  submittedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  reference: string;
  gateway?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  refereeName: string;
  refereeEmail: string;
  rewardEarned: number;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "info" | "success" | "warning";
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  link?: string;
  active: boolean;
}

export interface PageContent {
  id: string; // "about", "contact", "faq", "terms", "privacy"
  title: string;
  content: string;
}

export interface WebsiteSettings {
  platformName: string;
  referralReward: number; // Naira reward per active referral
  withdrawalFee: number; // Percentage or flat fee in Naira
  minWithdrawal: number; // Naira
  minDeposit: number; // Naira
  contactEmail: string;
  contactPhone: string;
  telegramChannel?: string;
  whatsappGroup?: string;
}

export interface AdminNotification {
  id: string;
  type: "submission" | "withdrawal";
  message: string;
  referenceId: string;
  createdAt: string;
  read: boolean;
}

export enum Platform {
  INSTAGRAM = "Instagram",
  FACEBOOK = "Facebook",
  TIKTOK = "TikTok",
  YOUTUBE = "YouTube",
  X_TWITTER = "X (Twitter)",
  TELEGRAM = "Telegram",
  WHATSAPP = "WhatsApp",
  SNAPCHAT = "Snapchat",
  LINKEDIN = "LinkedIn",
  THREADS = "Threads",
  PINTEREST = "Pinterest",
  REDDIT = "Reddit",
  DISCORD = "Discord",
  MESSENGER = "Messenger (Facebook Messenger)",
  KWAI = "Kwai",
  LIKEE = "Likee",
  CUSTOM = "Custom Tasks"
}

export interface TaskPricing {
  id: string;
  platform: Platform;
  costPerSlot: number; // What the advertiser pays
  earningPerSlot: number; // What the earner receives
}

// Dynamic, admin-managed social media platform (replaces the hardcoded
// Platform enum as the source of truth across the app). Stored in the
// `social_platforms` table and served via /api/platforms & /api/admin/platforms.
export interface SocialPlatform {
  id: string;
  name: string;
  icon: string; // free-text hint (e.g. matching name) used for icon lookup fallback
  logoUrl?: string | null; // optional uploaded logo (data URL) or external image URL
  description?: string | null;
  status: "Active" | "Inactive";
  sortOrder: number;
  createdAt?: string;
}

// Generic actions an earner can perform on a social media platform. Combined
// with a dynamic platform name (e.g. "Instagram" + "Follow") to build a
// task's category string, so new platforms never require code changes.
export const TASK_ACTIONS = [
  "Like",
  "Follow",
  "Share",
  "Comment",
  "Subscribe",
  "Watch",
  "Join",
  "Add/Follow",
  "Visit",
  "Chat",
  "Custom Task"
] as const;
export type TaskAction = typeof TASK_ACTIONS[number];

export function getPlatformForCategory(category: TaskCategory): Platform {
  switch (category) {
    case TaskCategory.FB_LIKE:
    case TaskCategory.FB_FOLLOW:
    case TaskCategory.FB_SHARE:
    case TaskCategory.FB_COMMENT:
      return Platform.FACEBOOK;
    case TaskCategory.IG_LIKE:
    case TaskCategory.IG_FOLLOW:
      return Platform.INSTAGRAM;
    case TaskCategory.TIKTOK_LIKE:
    case TaskCategory.TIKTOK_FOLLOW:
    case TaskCategory.TIKTOK_COMMENT:
      return Platform.TIKTOK;
    case TaskCategory.YT_SUBSCRIBE:
    case TaskCategory.YT_LIKE:
    case TaskCategory.YT_WATCH:
      return Platform.YOUTUBE;
    case TaskCategory.X_FOLLOW:
      return Platform.X_TWITTER;
    case TaskCategory.TELEGRAM_JOIN:
      return Platform.TELEGRAM;
    case TaskCategory.WHATSAPP_JOIN:
      return Platform.WHATSAPP;
    case TaskCategory.SNAPCHAT_ADD:
      return Platform.SNAPCHAT;
    case TaskCategory.LINKEDIN_FOLLOW:
      return Platform.LINKEDIN;
    case TaskCategory.THREADS_FOLLOW:
      return Platform.THREADS;
    case TaskCategory.PINTEREST_FOLLOW:
      return Platform.PINTEREST;
    case TaskCategory.REDDIT_JOIN:
      return Platform.REDDIT;
    case TaskCategory.DISCORD_JOIN:
      return Platform.DISCORD;
    case TaskCategory.MESSENGER_CHAT:
      return Platform.MESSENGER;
    case TaskCategory.KWAI_FOLLOW:
      return Platform.KWAI;
    case TaskCategory.LIKEE_FOLLOW:
      return Platform.LIKEE;
    default:
      return Platform.CUSTOM;
  }
}

