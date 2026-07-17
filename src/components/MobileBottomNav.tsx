import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Briefcase, Wallet, Bell, UserCircle, CreditCard, Users, Megaphone } from "lucide-react";
import { User, UserRole, isRegularUser } from "../types";

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

export default function MobileBottomNav({
  user,
  isDarkMode,
  earnerUnreadCount = 0,
}: MobileBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const iconSize = "h-5 w-5";
  let items: NavItem[] = [];

  if (isRegularUser(user.role)) {
    items = [
      { path: "/dashboard/overview",       label: "Home",      icon: <LayoutGrid className={iconSize} /> },
      { path: "/dashboard/tasks",          label: "Tasks",     icon: <Briefcase className={iconSize} /> },
      { path: "/dashboard/my-campaigns",   label: "Campaigns", icon: <Megaphone className={iconSize} /> },
      { path: "/dashboard/wallet",         label: "Wallet",    icon: <Wallet className={iconSize} /> },
      { path: "/dashboard/notifications",  label: "Alerts",    icon: <Bell className={iconSize} />, badge: earnerUnreadCount },
    ];
  } else if (user.role === UserRole.ADMIN) {
    items = [
      { path: "/admin/stats",         label: "Dashboard", icon: <LayoutGrid className={iconSize} /> },
      { path: "/admin/withdrawals",   label: "Payouts",   icon: <CreditCard className={iconSize} /> },
      { path: "/admin/users",         label: "Users",     icon: <Users className={iconSize} /> },
      { path: "/admin/notifications", label: "Alerts",    icon: <Bell className={iconSize} /> },
      { path: "/admin/profile",       label: "Profile",   icon: <UserCircle className={iconSize} /> },
    ];
  } else {
    return null;
  }

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <nav
      id="mobile-bottom-nav"
      role="navigation"
      aria-label="Primary navigation"
      className="md:hidden"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: "grid",
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        background: isDarkMode ? "rgba(10,16,28,0.98)" : "rgba(255,255,255,0.99)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
        boxShadow: "0 -4px 20px rgba(15,23,42,0.08)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {items.map((item) => {
        const active = isActive(item.path);
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            aria-current={active ? "page" : undefined}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              padding: "10px 4px",
              minHeight: "60px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.2s",
              borderRadius: 0,
            }}
          >
            {/* Blue top indicator for active */}
            {active && (
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "32px",
                  height: "3px",
                  borderRadius: "0 0 4px 4px",
                  background: "#2563EB",
                }}
              />
            )}

            {/* Icon with badge */}
            <span
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "28px",
                borderRadius: "8px",
                background: active ? "rgba(37,99,235,0.10)" : "transparent",
                color: active ? "#2563EB" : isDarkMode ? "#64748B" : "#94A3B8",
                transition: "all 0.2s",
              }}
            >
              {item.icon}
              {item.badge != null && item.badge > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "16px",
                    height: "16px",
                    borderRadius: "9999px",
                    padding: "0 4px",
                    fontSize: "9px",
                    fontWeight: 800,
                    color: "#fff",
                    background: "#EF4444",
                    lineHeight: 1,
                  }}
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </span>

            {/* Label */}
            <span
              style={{
                fontSize: "10px",
                fontWeight: active ? 700 : 500,
                lineHeight: 1,
                color: active ? "#2563EB" : isDarkMode ? "#64748B" : "#94A3B8",
                transition: "all 0.2s",
                letterSpacing: "0.01em",
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
