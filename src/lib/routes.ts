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
  "earner-dashboard": "/earner/overview",
  "earner-tasks": "/earner/tasks",
  "earner-submissions": "/earner/history",
  "earner-referrals": "/earner/referrals",
  "advertiser-dashboard": "/advertiser/overview",
  "advertiser-tasks": "/advertiser/manage",
  "advertiser-submissions": "/advertiser/audit",
  "admin-dashboard": "/admin/stats",
};

export function resolvePath(view: string): string | null {
  if (view === "logout") return "/";
  if (VIEW_TO_PATH[view] !== undefined) return VIEW_TO_PATH[view];
  return "/" + view;
}

export function pathToView(pathname: string): string {
  if (!pathname || pathname === "/") return "home";
  if (pathname === "/earner/tasks") return "earner-tasks";
  if (pathname === "/earner/history") return "earner-submissions";
  if (pathname === "/earner/referrals") return "earner-referrals";
  if (pathname.startsWith("/earner/")) return "earner-dashboard";
  if (pathname === "/advertiser/manage") return "advertiser-tasks";
  if (pathname === "/advertiser/audit") return "advertiser-submissions";
  if (pathname.startsWith("/advertiser/")) return "advertiser-dashboard";
  if (pathname.startsWith("/admin/")) return "admin-dashboard";
  return pathname.replace(/^\//, "") || "home";
}
