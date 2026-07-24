import {
  Bell,
  Briefcase,
  Coins,
  CreditCard,
  FolderSync,
  LayoutGrid,
  ListTodo,
  Mail,
  Megaphone,
  Percent,
  Settings,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminTab =
  | "stats"
  | "users"
  | "advertisers"
  | "campaigns"
  | "admin-tasks"
  | "withdrawals"
  | "audits"
  | "announcements"
  | "cms"
  | "settings"
  | "pricing"
  | "platforms"
  | "platform-earnings"
  | "commissions"
  | "notifications"
  | "reports"
  | "profile"
  | "demo-accounts"
  | "broadcast";

export interface AdminNavigationItem {
  tab: AdminTab;
  label: string;
  icon: LucideIcon;
  accent?: boolean;
}

/**
 * The single source of truth for admin navigation.
 *
 * Keep every admin section here so desktop and mobile navigation cannot drift
 * apart when a new section is added.
 */
export const ADMIN_NAV_ITEMS: readonly AdminNavigationItem[] = [
  { tab: "stats", icon: LayoutGrid, label: "Dashboard" },
  { tab: "users", icon: Users, label: "User Management" },
  { tab: "advertisers", icon: Megaphone, label: "Advertiser Management" },
  { tab: "campaigns", icon: Briefcase, label: "Campaign Management" },
  { tab: "admin-tasks", icon: ListTodo, label: "Task Management" },
  { tab: "pricing", icon: Coins, label: "Pricing Settings" },
  { tab: "platform-earnings", icon: TrendingUp, label: "Wallet & Commission" },
  { tab: "commissions", icon: Percent, label: "Commission Ledger" },
  { tab: "withdrawals", icon: CreditCard, label: "Withdrawals" },
  { tab: "audits", icon: ShieldAlert, label: "Submission Audits" },
  { tab: "announcements", icon: Megaphone, label: "Popup Messages" },
  { tab: "broadcast", icon: Mail, label: "Broadcast Email", accent: true },
  { tab: "notifications", icon: Bell, label: "Notifications" },
  { tab: "reports", icon: TrendingUp, label: "Reports" },
  { tab: "cms", icon: FolderSync, label: "Content Editor" },
  { tab: "platforms", icon: Settings, label: "Social Platforms" },
  { tab: "settings", icon: Settings, label: "Site Settings" },
  { tab: "profile", icon: FolderSync, label: "Profile" },
  { tab: "demo-accounts", icon: ShieldAlert, label: "Demo Accounts" },
];

export const ADMIN_NAV_TABS = ADMIN_NAV_ITEMS.map(({ tab }) => tab);