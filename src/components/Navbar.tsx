import React from "react";
import { User, UserRole, isRegularUser } from "../types";
import { resolvePath } from "../lib/routes";
import { Coins, LogOut, Shield, User as UserIcon, Wallet, Menu, X, Sun, Moon, Zap, Bell } from "lucide-react";

interface NavbarProps {
  user: User | null;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onOpenDeposit: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  earnerUnreadCount?: number;
}

export default function Navbar({
  user, currentView, onNavigate, onLogout, onOpenDeposit,
  isDarkMode, onToggleDarkMode, earnerUnreadCount = 0,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinkClass = (view: string) =>
    `text-sm font-semibold transition-all cursor-pointer px-2 py-1 rounded-lg ${
      currentView === view
        ? isDarkMode ? "text-blue-400 bg-blue-500/10" : "text-blue-600 bg-blue-50"
        : isDarkMode ? "text-slate-300 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
    }`;

  const isActive = (view: string) => currentView === view;

  return (
    <header
      id="app-header"
      className="sticky top-0 z-50 w-full"
      style={{
        background: isDarkMode ? "rgba(11,18,32,0.97)" : "rgba(255,255,255,0.98)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid #E2E8F0",
        boxShadow: isDarkMode ? "0 1px 24px rgba(0,0,0,0.40)" : "0 1px 12px rgba(15,23,42,0.06)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* ── Logo ── */}
        <div
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
        >
          <div
            className="relative flex h-8 w-8 items-center justify-center rounded-xl shrink-0 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)",
              boxShadow: "0 0 16px rgba(37,99,235,0.40), 0 3px 10px rgba(29,78,216,0.30)",
            }}
          >
            <div className="absolute inset-0 rounded-xl" style={{ background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.20) 0%, transparent 60%)" }} />
            <span className="relative z-10 font-black text-white" style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", lineHeight: 1 }}>₦</span>
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-baseline gap-0 leading-none">
              <span className="font-black" style={{ fontFamily: "var(--font-display)", fontSize: "1rem", letterSpacing: "-0.03em", color: isDarkMode ? "#fff" : "#0F172A" }}>Tasks</span>
              <span className="font-black" style={{ fontFamily: "var(--font-display)", fontSize: "1rem", letterSpacing: "-0.03em", background: "linear-gradient(135deg,#2563EB,#3B82F6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Earn</span>
            </div>
            <span className="flex items-center gap-0.5" style={{ fontFamily: "var(--font-mono)", fontSize: "0.45rem", letterSpacing: "0.16em", color: "rgba(96,165,250,0.65)", marginTop: "2px", textTransform: "uppercase", fontWeight: 700 }}>
              <Zap style={{ width: "6px", height: "6px", color: "#2563EB" }} />MICRO-EXCHANGE
            </span>
          </div>
        </div>

        {/* ── Desktop Nav Links ── */}
        <nav className="hidden md:flex items-center gap-1">
          {(["home", "about", "how-it-works", "faq", "contact"] as const).map(v => (
            <a key={v} href={resolvePath(v) ?? "/"} onClick={(e) => { e.preventDefault(); onNavigate(v); }} className={navLinkClass(v)}>
              {v === "how-it-works" ? "How It Works" : v.charAt(0).toUpperCase() + v.slice(1)}
            </a>
          ))}
          {user && isRegularUser(user.role) && (
            <a href="/dashboard/overview" onClick={(e) => { e.preventDefault(); onNavigate("dashboard-overview"); }} className={navLinkClass("dashboard-overview")}>Dashboard</a>
          )}
          {user && user.role === UserRole.ADMIN && (
            <a href="/admin/stats" onClick={(e) => { e.preventDefault(); onNavigate("admin-dashboard"); }} className={navLinkClass("admin-dashboard")}>Admin Panel</a>
          )}
        </nav>

        {/* ── Desktop Controls ── */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={onToggleDarkMode}
            className="rounded-full p-2 transition-colors cursor-pointer flex items-center justify-center"
            style={isDarkMode ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" } : { background: "#F8FAFC", border: "1px solid #E2E8F0" }}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="h-3.5 w-3.5" style={{ color: "#FBBF24" }} /> : <Moon className="h-3.5 w-3.5" style={{ color: "#94A3B8" }} />}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              {/* Balance chip */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.18)" }}>
                <Wallet className="h-3 w-3 shrink-0" style={{ color: "#2563EB" }} />
                <span className="text-[10px] font-semibold" style={{ color: "#94A3B8" }}>Earn:</span>
                <span className="font-mono text-xs font-bold" style={{ color: "#2563EB" }}>
                  ₦{(user.walletBalance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                {isRegularUser(user.role) && (user.adBalance ?? 0) > 0 && (
                  <>
                    <span className="text-[10px]" style={{ color: "#94A3B8" }}>| Ad:</span>
                    <span className="font-mono text-xs font-bold" style={{ color: "#7C3AED" }}>
                      ₦{(user.adBalance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </>
                )}
                {isRegularUser(user.role) && (
                  <button onClick={onOpenDeposit} className="ml-1 rounded-full text-white text-[9px] font-bold uppercase px-2 py-0.5 cursor-pointer" style={{ background: "linear-gradient(135deg,#7C3AED,#6D28D9)" }}>
                    + Fund
                  </button>
                )}
              </div>

              {/* Notification bell */}
              {isRegularUser(user.role) && (
                <button
                  onClick={() => onNavigate("dashboard-notifications")}
                  className="relative rounded-full p-2 transition-all cursor-pointer"
                  style={isDarkMode ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" } : { background: "#F8FAFC", border: "1px solid #E2E8F0" }}
                  aria-label="Notifications"
                >
                  <Bell className="h-3.5 w-3.5" style={{ color: earnerUnreadCount > 0 ? "#2563EB" : "#94A3B8" }} />
                  {earnerUnreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black text-white" style={{ background: "#EF4444" }}>
                      {earnerUnreadCount > 99 ? "99+" : earnerUnreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* Profile section */}
              <div className="flex items-center gap-2 pl-2" style={{ borderLeft: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
                <div className="text-right hidden lg:block">
                  <p className="text-xs font-bold leading-none" style={{ color: isDarkMode ? "#fff" : "#0F172A" }}>{user.name}</p>
                  <p className="text-[9px] font-semibold flex items-center gap-1 justify-end uppercase tracking-wider mt-1" style={{ color: "#64748B" }}>
                    {user.role === UserRole.ADMIN ? <Shield className="h-2 w-2" style={{ color: "#FB7185" }} /> : <UserIcon className="h-2 w-2" style={{ color: "#2563EB" }} />}
                    <span>{isRegularUser(user.role) ? "Member" : user.role}</span>
                  </p>
                </div>
                <button
                  onClick={() => { if (isRegularUser(user.role)) onNavigate("dashboard-overview"); else onNavigate("admin-dashboard"); }}
                  className="rounded-full p-2 cursor-pointer transition-all"
                  style={isDarkMode ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" } : { background: "#F8FAFC", border: "1px solid #E2E8F0" }}
                >
                  <Coins className="h-3.5 w-3.5" style={{ color: "#2563EB" }} />
                </button>
                <button
                  onClick={onLogout}
                  className="rounded-full p-2 cursor-pointer transition-all"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
                  title="Logout"
                >
                  <LogOut className="h-3.5 w-3.5" style={{ color: "#EF4444" }} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate("login")}
                className="text-sm font-semibold cursor-pointer px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: isDarkMode ? "#94A3B8" : "#475569" }}
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate("register")}
                className="rounded-full px-4 py-2 text-sm font-bold text-white cursor-pointer transition-all"
                style={{ background: "linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%)", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* ── Mobile Controls ── */}
        <div className="flex items-center md:hidden gap-1.5">
          <button
            onClick={onToggleDarkMode}
            className="rounded-full p-1.5 cursor-pointer flex items-center justify-center"
            style={isDarkMode ? { background: "rgba(255,255,255,0.06)" } : { background: "#F8FAFC" }}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="h-4 w-4" style={{ color: "#FBBF24" }} /> : <Moon className="h-4 w-4" style={{ color: "#94A3B8" }} />}
          </button>

          {user && isRegularUser(user.role) && (
            <button
              onClick={() => onNavigate("dashboard-notifications")}
              className="relative rounded-full p-1.5 cursor-pointer"
              style={isDarkMode ? { background: "rgba(255,255,255,0.06)" } : { background: "#F8FAFC" }}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" style={{ color: earnerUnreadCount > 0 ? "#2563EB" : "#94A3B8" }} />
              {earnerUnreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-black text-white" style={{ background: "#EF4444" }}>
                  {earnerUnreadCount > 9 ? "9+" : earnerUnreadCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-1.5 cursor-pointer transition-colors"
            style={{ color: "#94A3B8" }}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          className="md:hidden px-4 py-3 space-y-1 animate-fadeIn"
          style={{
            background: isDarkMode ? "rgba(10,16,28,0.99)" : "#FFFFFF",
            borderTop: isDarkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid #E2E8F0",
            maxHeight: "calc(100vh - 56px)",
            overflowY: "auto",
          }}
        >
          {["home", "about", "how-it-works", "faq", "contact"].map(v => (
            <a
              key={v}
              href={resolvePath(v) ?? "/"}
              onClick={(e) => { e.preventDefault(); onNavigate(v); setMobileMenuOpen(false); }}
              className="block py-2.5 text-sm font-semibold rounded-xl px-3 cursor-pointer transition-colors"
              style={isActive(v) ? { background: "#EFF6FF", color: "#2563EB" } : { color: isDarkMode ? "#CBD5E1" : "#475569" }}
            >
              {v === "how-it-works" ? "How It Works" : v.charAt(0).toUpperCase() + v.slice(1)}
            </a>
          ))}

          {user && (
            <div className="pt-2 mt-1 space-y-0.5" style={{ borderTop: isDarkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid #E2E8F0" }}>
              <p className="px-3 pt-1 text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "#2563EB" }}>My Account</p>
              {isRegularUser(user.role) && ([
                ["dashboard-overview", "Dashboard"],
                ["dashboard-tasks", "Available Tasks"],
                ["dashboard-my-tasks", "My Tasks"],
                ["dashboard-create-campaign", "Create Campaign"],
                ["dashboard-my-campaigns", "My Campaigns"],
                ["dashboard-wallet", "Wallet"],
                ["dashboard-withdraw", "Withdraw Funds"],
                ["dashboard-referrals", "Referrals"],
                ["dashboard-notifications", "Notifications"],
                ["dashboard-profile", "Profile & Settings"],
              ] as [string, string][]).map(([v, label]) => (
                <a key={v} href={resolvePath(v) ?? "/"} onClick={(e) => { e.preventDefault(); onNavigate(v); setMobileMenuOpen(false); }}
                  className="block py-2 text-sm font-semibold rounded-xl px-3 cursor-pointer transition-colors"
                  style={{ color: isDarkMode ? "#CBD5E1" : "#475569" }}>{label}</a>
              ))}
              {user.role === UserRole.ADMIN && ([
                ["admin-dashboard", "Overview"], ["admin-users", "Users"], ["admin-campaigns", "Campaigns"],
                ["admin-tasks", "Tasks"], ["admin-pricing", "Pricing"], ["admin-wallet", "Platform Earnings"],
                ["admin-withdrawals", "Withdrawals"], ["admin-announcements", "Announcements"],
                ["admin-reports", "Reports"], ["admin-settings", "Settings"],
              ] as [string, string][]).map(([v, label]) => (
                <a key={v} href={resolvePath(v) ?? "/"} onClick={(e) => { e.preventDefault(); onNavigate(v); setMobileMenuOpen(false); }}
                  className="block py-2 text-sm font-semibold rounded-xl px-3 cursor-pointer"
                  style={{ color: isDarkMode ? "#CBD5E1" : "#475569" }}>{label}</a>
              ))}
              <button
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="w-full text-left block py-2.5 text-sm font-bold rounded-xl px-3 mt-2 cursor-pointer"
                style={{ color: "#EF4444" }}
              >
                Logout
              </button>
            </div>
          )}

          {!user && (
            <div className="pt-3 flex flex-col gap-2" style={{ borderTop: isDarkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid #E2E8F0" }}>
              <button
                onClick={() => { onNavigate("login"); setMobileMenuOpen(false); }}
                className="w-full py-2.5 text-center text-sm font-semibold rounded-xl transition-all"
                style={isDarkMode ? { color: "#CBD5E1", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.03)" } : { color: "#475569", border: "1px solid #E2E8F0", background: "#F8FAFC" }}
              >
                Sign In
              </button>
              <button
                onClick={() => { onNavigate("register"); setMobileMenuOpen(false); }}
                className="w-full py-2.5 text-center text-sm font-bold text-white rounded-xl transition-all"
                style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", boxShadow: "0 4px 14px rgba(37,99,235,0.30)" }}
              >
                Sign Up Free
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
