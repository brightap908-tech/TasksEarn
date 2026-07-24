import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Briefcase, Wallet, Bell, Megaphone, Menu, X } from "lucide-react";
import { User, UserRole, isRegularUser } from "../types";
import { ADMIN_NAV_ITEMS, AdminTab } from "../lib/adminNavigation";

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
  const [adminMenuOpen, setAdminMenuOpen] = React.useState(false);

  if (!user) return null;

  const iconSize = "h-5 w-5";
  let items: NavItem[] = [];
  const isAdmin = user.role === UserRole.ADMIN;

  if (isRegularUser(user.role)) {
    items = [
      { path: "/dashboard/overview",       label: "Home",      icon: <LayoutGrid className={iconSize} /> },
      { path: "/dashboard/tasks",          label: "Tasks",     icon: <Briefcase className={iconSize} /> },
      { path: "/dashboard/my-campaigns",   label: "Campaigns", icon: <Megaphone className={iconSize} /> },
      { path: "/dashboard/wallet",         label: "Wallet",    icon: <Wallet className={iconSize} /> },
      { path: "/dashboard/notifications",  label: "Alerts",    icon: <Bell className={iconSize} />, badge: earnerUnreadCount },
    ];
  } else if (isAdmin) {
    const quickTabs: AdminTab[] = ["stats", "withdrawals", "users", "notifications", "profile"];
    items = quickTabs.map(tab => {
      const item = ADMIN_NAV_ITEMS.find(navItem => navItem.tab === tab)!;
      return {
        path: `/admin/${item.tab}`,
        label: tab === "withdrawals" ? "Payouts" : tab === "notifications" ? "Alerts" : item.label.replace(" Management", ""),
        icon: <item.icon className={iconSize} />,
      };
    });
    items.push({
      path: "#admin-menu",
      label: "More",
      icon: adminMenuOpen ? <X className={iconSize} /> : <Menu className={iconSize} />,
    });
  } else {
    return null;
  }

  const isActive = (path: string) =>
    path !== "#admin-menu" && (location.pathname === path || location.pathname.startsWith(path + "/"));

  const navigateTo = (path: string) => {
    if (path === "#admin-menu") {
      setAdminMenuOpen(open => !open);
      return;
    }
    setAdminMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      {isAdmin && adminMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close admin menu"
            onClick={() => setAdminMenuOpen(false)}
            className="fixed inset-0 z-[39] bg-slate-950/20 lg:hidden"
          />
          <div
            role="dialog"
            aria-label="Admin menu"
            className="fixed left-3 right-3 bottom-[calc(60px+env(safe-area-inset-bottom))] z-40 max-h-[calc(100vh-88px)] overflow-y-auto rounded-2xl border p-3 shadow-2xl lg:hidden"
            style={{
              background: isDarkMode ? "rgba(10,16,28,0.99)" : "rgba(255,255,255,0.99)",
              borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "#E2E8F0",
            }}
          >
            <div className="mb-2 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Admin Dashboard</div>
            <div className="grid grid-cols-2 gap-1.5">
              {ADMIN_NAV_ITEMS.map(({ tab, label, icon: Icon, accent }) => {
                const active = isActive(`/admin/${tab}`);
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => navigateTo(`/admin/${tab}`)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 items-center gap-2 rounded-xl px-3 py-2 text-left text-[11px] font-bold transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-600"
                        : isDarkMode
                        ? "text-slate-300 hover:bg-white/5"
                        : "text-slate-600 hover:bg-blue-50/60"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${accent ? "text-blue-500" : active ? "text-blue-600" : "text-slate-400"}`} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
      <nav
        id="mobile-bottom-nav"
        role="navigation"
        aria-label="Primary navigation"
        className="lg:hidden"
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
              onClick={() => navigateTo(item.path)}
              aria-current={active ? "page" : undefined}
              aria-expanded={item.path === "#admin-menu" ? adminMenuOpen : undefined}
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
    </>
  );
}
