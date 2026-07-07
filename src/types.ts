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
  WEB_VISIT = "Website Visit",
  APP_DOWNLOAD = "App Download",
  SURVEY = "Survey",
  CUSTOM = "Custom Tasks"
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
  REFERRAL = "Referral Bonus"
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
  walletBalance: number;
  referralCode?: string;
  referredBy?: string;
  createdAt: string;
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
