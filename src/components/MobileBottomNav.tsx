import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Briefcase, Wallet, Bell, UserCircle, CreditCard, Users, XCircle } from "lucide-react";
import { User, UserRole } from "../types";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface MobileBottomNavProps {
  user: User | null;
  isDarkMode: boolean;
  earnerUnreadCount?: number;
  rejectedTasksCount?: number;
}

/**
 * Fixed bottom navigation bar shown on mobile screens only, for logged-in
 * users. Gives each role quick access to their most important pages without
 * scrolling to sections — every tap navigates to a real routed page.
 */
export default function MobileBottomNav({ user, isDarkMode, earnerUnreadCount = 0, rejectedTasksCount = 0 }: MobileBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const iconCls = "h-[22px] w-[22px]";

  let items: NavItem[] = [];

  if (user.role === UserRole.EARNER) {
    items = [
      { path: "/earner/overview", label: "Dashboard", icon: <LayoutGrid className={iconCls} />, badge: rejectedTasksCount },
      { path: "/earner/tasks", label: "Tasks", icon: <Briefcase className={iconCls} /> },
      { path: "/earner/wallet", label: "Wallet", icon: <Wallet className={iconCls} /> },
      { path: "/earner/notifications", label: "Alerts", icon: <Bell className={iconCls} />, badge: earnerUnreadCount },
      { path: "/earner/rejected", label: "Rejected", icon: <XCircle className={iconCls} />, badge: rejectedTasksCount },
    ];
  } else if (user.role === UserRole.ADVERTISER) {
    items = [
      { path: "/advertiser/overview", label: "Dashboard", icon: <LayoutGrid className={iconCls} /> },
      { path: "/advertiser/manage", label: "Campaigns", icon: <Briefcase className={iconCls} /> },
      { path: "/advertiser/wallet", label: "Wallet", icon: <Wallet className={iconCls} /> },
      { path: "/advertiser/notifications", label: "Alerts", icon: <Bell className={iconCls} /> },
      { path: "/advertiser/profile", label: "Profile", icon: <UserCircle className={iconCls} /> },
    ];
  } else if (user.role === UserRole.ADMIN) {
    items = [
      { path: "/admin/stats", label: "Dashboard", icon: <LayoutGrid className={iconCls} /> },
      { path: "/admin/withdrawals", label: "Payouts", icon: <CreditCard className={iconCls} /> },
      { path: "/admin/users", label: "Users", icon: <Users className={iconCls} /> },
      { path: "/admin/notifications", label: "Alerts", icon: <Bell className={iconCls} /> },
      { path: "/admin/profile", label: "Profile", icon: <UserCircle className={iconCls} /> },
    ];
  } else {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      id="mobile-bottom-nav"
      role="navigation"
      aria-label="Primary"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5"
      style={{
        background: isDarkMode ? "rgba(10,16,28,0.97)" : "rgba(255,255,255,0.98)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
        boxShadow: "0 -4px 24px rgba(15,23,42,0.08)",
        paddingBottom: "env(safe-area-inset-bottom)"
      }}
    >
      {items.map((item) => {
        const active = isActive(item.path);
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            aria-current={active ? "page" : undefined}
            className="relative flex flex-col items-center justify-center gap-1 py-2 cursor-pointer transition-colors"
            style={{ minHeight: "56px" }}
          >
            <span
              className="relative flex items-center justify-center"
              style={{ color: active ? "#2563EB" : isDarkMode ? "#94a3b8" : "#94a3b8" }}
            >
              {item.icon}
              {item.badge != null && item.badge > 0 && (
                <span
                  className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[8px] font-black text-white"
                  style={{ background: "#EF4444" }}
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </span>
            <span
              className="text-[10px] font-bold leading-none"
              style={{ color: active ? "#2563EB" : isDarkMode ? "#94a3b8" : "#94a3b8" }}
            >
              {item.label}
            </span>
            {active && (
              <span
                className="absolute top-0 h-0.5 w-8 rounded-full"
                style={{ background: "#2563EB" }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
