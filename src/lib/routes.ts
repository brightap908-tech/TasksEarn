export const VIEW_TO_PATH: Record<string, string> = {
  "home": "/",
  "login": "/login",
  "advertiser-login": "/advertiser-login",
  "forgot-password": "/forgot-password",
  "register": "/register",
  "verify-email": "/verify-email",
  "about": "/about",
  "faq": "/faq",
  "contact": "/contact",
  "terms": "/terms",
  "privacy": "/privacy",
  // Earner pages
  "earner-dashboard": "/earner/overview",
  "earner-tasks": "/earner/tasks",
  "earner-pending": "/earner/pending",
  "earner-completed": "/earner/completed",
  "earner-wallet": "/earner/wallet",
  "earner-submissions": "/earner/history",
  "earner-referrals": "/earner/referrals",
  "earner-notifications": "/earner/notifications",
  "earner-withdraw": "/earner/withdraw",
  "earner-profile": "/earner/profile",
  "earner-settings": "/earner/settings",
  "earner-rejected": "/earner/rejected",
  // Advertiser pages
  "advertiser-dashboard": "/advertiser/overview",
  "advertiser-create": "/advertiser/create",
  "advertiser-campaigns": "/advertiser/manage",
  "advertiser-wallet": "/advertiser/wallet",
  "advertiser-fund": "/advertiser/fund",
  "advertiser-pending-submissions": "/advertiser/pending-submissions",
  "advertiser-approved": "/advertiser/approved",
  "advertiser-rejected": "/advertiser/rejected",
  "advertiser-tasks": "/advertiser/manage",
  "advertiser-submissions": "/advertiser/audit",
  "advertiser-notifications": "/advertiser/notifications",
  "advertiser-profile": "/advertiser/profile",
  "advertiser-settings": "/advertiser/settings",
  // Admin pages
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
  // Earner
  if (pathname === "/earner/tasks") return "earner-tasks";
  if (pathname === "/earner/pending") return "earner-pending";
  if (pathname === "/earner/completed") return "earner-completed";
  if (pathname === "/earner/wallet") return "earner-wallet";
  if (pathname === "/earner/history") return "earner-submissions";
  if (pathname === "/earner/referrals") return "earner-referrals";
  if (pathname === "/earner/notifications") return "earner-notifications";
  if (pathname === "/earner/withdraw") return "earner-withdraw";
  if (pathname === "/earner/profile") return "earner-profile";
  if (pathname === "/earner/settings") return "earner-settings";
  if (pathname === "/earner/rejected") return "earner-rejected";
  if (pathname.startsWith("/earner/")) return "earner-dashboard";
  // Advertiser
  if (pathname === "/advertiser/manage") return "advertiser-tasks";
  if (pathname === "/advertiser/audit") return "advertiser-submissions";
  if (pathname === "/advertiser/wallet") return "advertiser-wallet";
  if (pathname === "/advertiser/fund") return "advertiser-fund";
  if (pathname === "/advertiser/pending-submissions") return "advertiser-pending-submissions";
  if (pathname === "/advertiser/approved") return "advertiser-approved";
  if (pathname === "/advertiser/rejected") return "advertiser-rejected";
  if (pathname === "/advertiser/notifications") return "advertiser-notifications";
  if (pathname === "/advertiser/profile") return "advertiser-profile";
  if (pathname === "/advertiser/settings") return "advertiser-settings";
  if (pathname.startsWith("/advertiser/")) return "advertiser-dashboard";
  // Admin
  if (pathname === "/admin/advertisers") return "admin-advertisers";
  if (pathname === "/admin/notifications") return "admin-notifications";
  if (pathname === "/admin/reports") return "admin-reports";
  if (pathname === "/admin/profile") return "admin-profile";
  if (pathname.startsWith("/admin/")) return "admin-dashboard";
  return pathname.replace(/^\//, "") || "home";
}
