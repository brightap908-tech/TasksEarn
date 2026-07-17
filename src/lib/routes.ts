export const VIEW_TO_PATH: Record<string, string> = {
  "home": "/",
  "login": "/login",
  "forgot-password": "/forgot-password",
  "register": "/register",
  "verify-email": "/verify-email",
  "about": "/about",
  "faq": "/faq",
  "contact": "/contact",
  "how-it-works": "/how-it-works",
  "terms": "/terms",
  "privacy": "/privacy",
  // Unified user dashboard pages
  "dashboard": "/dashboard/overview",
  "dashboard-overview": "/dashboard/overview",
  "dashboard-tasks": "/dashboard/tasks",
  "dashboard-my-tasks": "/dashboard/my-tasks",
  "dashboard-create-campaign": "/dashboard/create-campaign",
  "dashboard-my-campaigns": "/dashboard/my-campaigns",
  "dashboard-wallet": "/dashboard/wallet",
  "dashboard-withdraw": "/dashboard/withdraw",
  "dashboard-referrals": "/dashboard/referrals",
  "dashboard-notifications": "/dashboard/notifications",
  "dashboard-profile": "/dashboard/profile",
  // Admin pages (kept separate)
  "admin-dashboard": "/admin/stats",
  "admin-users": "/admin/users",
  "admin-advertisers": "/admin/advertisers",
  "admin-campaigns": "/admin/campaigns",
  "admin-tasks": "/admin/admin-tasks",
  "admin-pricing": "/admin/pricing",
  "admin-wallet": "/admin/platform-earnings",
  "admin-withdrawals": "/admin/withdrawals",
  "admin-announcements": "/admin/announcements",
  "admin-notifications": "/admin/notifications",
  "admin-reports": "/admin/reports",
  "admin-settings": "/admin/settings",
  "admin-profile": "/admin/profile",
};

export function resolvePath(view: string): string | null {
  if (view === "logout") return "/";
  if (VIEW_TO_PATH[view] !== undefined) return VIEW_TO_PATH[view];
  return "/" + view;
}

export function pathToView(pathname: string): string {
  if (!pathname || pathname === "/") return "home";
  // Dashboard
  if (pathname === "/dashboard/tasks") return "dashboard-tasks";
  if (pathname === "/dashboard/my-tasks") return "dashboard-my-tasks";
  if (pathname === "/dashboard/create-campaign") return "dashboard-create-campaign";
  if (pathname === "/dashboard/my-campaigns") return "dashboard-my-campaigns";
  if (pathname === "/dashboard/wallet") return "dashboard-wallet";
  if (pathname === "/dashboard/withdraw") return "dashboard-withdraw";
  if (pathname === "/dashboard/referrals") return "dashboard-referrals";
  if (pathname === "/dashboard/notifications") return "dashboard-notifications";
  if (pathname === "/dashboard/profile") return "dashboard-profile";
  if (pathname.startsWith("/dashboard/")) return "dashboard-overview";
  // Admin
  if (pathname === "/admin/advertisers") return "admin-advertisers";
  if (pathname === "/admin/notifications") return "admin-notifications";
  if (pathname === "/admin/reports") return "admin-reports";
  if (pathname === "/admin/profile") return "admin-profile";
  if (pathname.startsWith("/admin/")) return "admin-dashboard";
  return pathname.replace(/^\//, "") || "home";
}
