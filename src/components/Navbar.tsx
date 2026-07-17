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

export default function Navbar({ user, currentView, onNavigate, onLogout, onOpenDeposit, isDarkMode, onToggleDarkMode, earnerUnreadCount = 0 }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinkClass = (view: string) =>
    `text-sm font-semibold transition-all cursor-pointer px-1 py-0.5 ${
      currentView === view
        ? isDarkMode ? "text-[#60a5fa]" : "text-[#2563EB]"
        : isDarkMode ? "text-slate-200 hover:text-white" : "text-slate-600 hover:text-[#2563EB]"
    }`;

  const isActive = (view: string) => currentView === view;

  return (
    <header
      id="app-header"
      className="sticky top-0 z-50 w-full"
      style={{
        background: isDarkMode ? "rgba(11,18,32,0.94)" : "rgba(255,255,255,0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.06)" : "1.5px solid #E2E8F0",
        boxShadow: isDarkMode ? "0 1px 40px rgba(0,0,0,0.50)" : "0 1px 20px rgba(0,102,255,0.08)"
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* ── Logo ── */}
        <div
          id="brand-logo"
          onClick={() => onNavigate("home")}
          className="flex items-center gap-3 cursor-pointer select-none"
          style={{ transition: "opacity 0.15s ease" }}
        >
          <div
            className="relative flex h-10 w-10 items-center justify-center rounded-xl shrink-0 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)",
              boxShadow: "0 0 20px rgba(59,130,246,0.45), 0 4px 12px rgba(29,78,216,0.35)",
              border: "1px solid rgba(96,165,250,0.30)"
            }}
          >
            <div className="absolute inset-0 rounded-xl" style={{ background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.18) 0%, transparent 60%)" }} />
            <span className="relative z-10 font-bold text-white" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", lineHeight: 1, letterSpacing: "-0.02em" }}>₦</span>
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-baseline gap-0">
              <span className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", letterSpacing: "-0.03em", lineHeight: 1, color: isDarkMode ? "#ffffff" : "#0f172a" }}>Tasks</span>
              <span className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", letterSpacing: "-0.03em", lineHeight: 1, background: "linear-gradient(135deg,#2563EB,#2563EB)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Earn</span>
            </div>
            <span className="flex items-center gap-1" style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.18em", color: "rgba(96,165,250,0.70)", marginTop: "3px", textTransform: "uppercase", fontWeight: 700 }}>
              <Zap style={{ width: "7px", height: "7px", color: "#2563EB" }} />MICRO-EXCHANGE
            </span>
          </div>
        </div>

        {/* ── Desktop Nav Links ── */}
        <nav className="hidden md:flex items-center gap-5">
          {(["home","about","how-it-works","faq","contact"] as const).map(v => (
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
        <div className="hidden md:flex items-center gap-3">
          <button onClick={onToggleDarkMode} className="rounded-full p-2 transition-colors cursor-pointer flex items-center justify-center shrink-0"
            style={isDarkMode ? { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" } : { background: "#F8FAFC", border: "1px solid #E2E8F0" }}
            aria-label="Toggle Theme" title={isDarkMode ? "Light Mode" : "Dark Mode"}>
            {isDarkMode ? <Sun className="h-4 w-4" style={{ color: "#fbbf24" }} /> : <Moon className="h-4 w-4" style={{ color: "#94a3b8" }} />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              {/* Earnings balance chip */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.20)" }}>
                <Wallet className="h-3.5 w-3.5 shrink-0" style={{ color: "#2563EB" }} />
                <span className="text-[10px] font-semibold" style={{ color: "#94a3b8" }}>Earnings</span>
                <span className="font-mono text-sm font-bold" style={{ color: "#2563EB" }}>
                  ₦{(user.walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {isRegularUser(user.role) && (user.adBalance ?? 0) > 0 && (
                  <>
                    <span className="text-[10px]" style={{ color: "#94a3b8" }}>| Ad:</span>
                    <span className="font-mono text-sm font-bold" style={{ color: "#7c3aed" }}>
                      ₦{(user.adBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </>
                )}
                {isRegularUser(user.role) && (
                  <button onClick={onOpenDeposit} className="ml-1 rounded-full text-white text-[9px] font-bold uppercase px-2.5 py-0.5 transition-all cursor-pointer" style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                    + Fund
                  </button>
                )}
              </div>

              {/* Notification bell for regular users */}
              {isRegularUser(user.role) && (
                <button onClick={() => onNavigate("dashboard-notifications")} className="relative rounded-full p-2 transition-all cursor-pointer"
                  style={isDarkMode ? { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" } : { background: "#F8FAFC", border: "1px solid #E2E8F0" }}
                  title="Notifications" aria-label="View Notifications">
                  <Bell className="h-4 w-4" style={{ color: earnerUnreadCount > 0 ? "#2563EB" : "#94a3b8" }} />
                  {earnerUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black text-white" style={{ background: "#EF4444", minWidth: "1rem" }}>
                      {earnerUnreadCount > 99 ? "99+" : earnerUnreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* Profile */}
              <div className="flex items-center gap-3 pl-3" style={{ borderLeft: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
                <div className="text-right">
                  <p className="text-xs font-bold leading-none" style={{ color: isDarkMode ? "#ffffff" : "#0F172A" }}>{user.name}</p>
                  <p className="text-[9px] font-bold flex items-center gap-1 justify-end uppercase tracking-wider mt-1.5" style={{ color: "#64748b" }}>
                    {user.role === UserRole.ADMIN ? <Shield className="h-2.5 w-2.5" style={{ color: "#fb7185" }} /> : <UserIcon className="h-2.5 w-2.5" style={{ color: "#2563EB" }} />}
                    <span>{isRegularUser(user.role) ? "Member" : user.role}</span>
                  </p>
                </div>
                <button onClick={() => { if (isRegularUser(user.role)) onNavigate("dashboard-overview"); else onNavigate("admin-dashboard"); }}
                  className="rounded-full p-2 transition-all cursor-pointer"
                  style={isDarkMode ? { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" } : { background: "#F8FAFC", border: "1px solid #E2E8F0" }}
                  title="Dashboard">
                  <Coins className="h-4 w-4" style={{ color: "#2563EB" }} />
                </button>
                <button onClick={onLogout} className="rounded-full p-2 transition-all cursor-pointer" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }} title="Logout">
                  <LogOut className="h-4 w-4" style={{ color: "#EF4444" }} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => onNavigate("login")} className="text-sm font-semibold cursor-pointer transition-colors" style={{ color: isDarkMode ? "#94a3b8" : "#475569" }}
                onMouseEnter={e => (e.currentTarget.style.color = isDarkMode ? "#f1f5f9" : "#2563EB")}
                onMouseLeave={e => (e.currentTarget.style.color = isDarkMode ? "#94a3b8" : "#475569")}>Sign In</button>
              <button onClick={() => onNavigate("register")} className="rounded-full px-5 py-2 text-sm font-bold text-white cursor-pointer transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg,#2563EB 0%,#2563eb 100%)", boxShadow: "0 4px 16px rgba(37,99,235,0.35)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(37,99,235,0.50)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(37,99,235,0.35)"; }}>
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* ── Mobile Controls ── */}
        <div className="flex items-center md:hidden gap-2">
          <button onClick={onToggleDarkMode} className="rounded-full p-2 transition-colors cursor-pointer flex items-center justify-center shrink-0"
            style={isDarkMode ? { background: "rgba(255,255,255,0.04)" } : { background: "#F8FAFC" }} aria-label="Toggle Theme">
            {isDarkMode ? <Sun className="h-4 w-4" style={{ color: "#fbbf24" }} /> : <Moon className="h-4 w-4" style={{ color: "#94a3b8" }} />}
          </button>
          {user && (
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.20)" }}>
              <span className="font-mono text-xs font-bold" style={{ color: "#93c5fd" }}>₦{(user.walletBalance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          )}
          {user && isRegularUser(user.role) && (
            <button onClick={() => onNavigate("dashboard-notifications")} className="relative rounded-full p-2 transition-colors cursor-pointer"
              style={isDarkMode ? { background: "rgba(255,255,255,0.04)" } : { background: "#F8FAFC" }} aria-label="Notifications">
              <Bell className="h-4 w-4" style={{ color: earnerUnreadCount > 0 ? "#2563EB" : "#94a3b8" }} />
              {earnerUnreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-black text-white" style={{ background: "#EF4444" }}>
                  {earnerUnreadCount > 9 ? "9+" : earnerUnreadCount}
                </span>
              )}
            </button>
          )}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-lg p-1.5 transition-colors cursor-pointer" style={{ color: "#94a3b8" }}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <div id="mobile-nav-drawer" className="md:hidden px-4 py-4 space-y-1.5 animate-fadeIn"
          style={{ background: isDarkMode ? "rgba(10,16,28,0.97)" : "#FFFFFF", borderTop: isDarkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid #E2E8F0", backdropFilter: "blur(20px)" }}>
          {["home","about","how-it-works","faq","contact"].map(v => (
            <a key={v} href={resolvePath(v) ?? "/"} onClick={(e) => { e.preventDefault(); onNavigate(v); setMobileMenuOpen(false); }}
              className="block py-2.5 text-sm font-semibold rounded-xl px-3 cursor-pointer transition-colors"
              style={isActive(v) ? { background: "#DBEAFE", color: "#2563EB" } : { color: isDarkMode ? "#e2e8f0" : "#475569" }}>
              {v === "how-it-works" ? "How It Works" : v.charAt(0).toUpperCase() + v.slice(1)}
            </a>
          ))}

          {user && (
            <div className="pt-3 mt-2 space-y-1" style={{ borderTop: isDarkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid #E2E8F0" }}>
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: "#2563EB" }}>My Account</p>
              {isRegularUser(user.role) && (
                <>
                  {[
                    ["dashboard-overview","Dashboard"],
                    ["dashboard-tasks","Available Tasks"],
                    ["dashboard-my-tasks","My Tasks"],
                    ["dashboard-create-campaign","Create Campaign"],
                    ["dashboard-my-campaigns","My Campaigns"],
                    ["dashboard-wallet","Wallet"],
                    ["dashboard-withdraw","Withdraw Funds"],
                    ["dashboard-referrals","Referrals"],
                    ["dashboard-notifications","Notifications"],
                    ["dashboard-profile","Profile & Settings"],
                  ].map(([v, label]) => (
                    <a key={v} href={resolvePath(v) ?? "/"} onClick={(e) => { e.preventDefault(); onNavigate(v); setMobileMenuOpen(false); }}
                      className="block py-2.5 text-sm font-semibold rounded-xl px-3 cursor-pointer transition-colors"
                      style={{ color: isDarkMode ? "#e2e8f0" : "#475569" }}>{label}</a>
                  ))}
                </>
              )}
              {user.role === UserRole.ADMIN && (
                <>
                  {[
                    ["admin-dashboard","Overview"],["admin-users","Users"],["admin-campaigns","Campaigns"],
                    ["admin-tasks","Tasks"],["admin-pricing","Pricing"],["admin-wallet","Platform Earnings"],
                    ["admin-withdrawals","Withdrawals"],["admin-announcements","Announcements"],
                    ["admin-reports","Reports"],["admin-settings","Settings"]
                  ].map(([v, label]) => (
                    <a key={v} href={resolvePath(v) ?? "/"} onClick={(e) => { e.preventDefault(); onNavigate(v); setMobileMenuOpen(false); }}
                      className="block py-2.5 text-sm font-semibold rounded-xl px-3 cursor-pointer transition-colors"
                      style={{ color: isDarkMode ? "#e2e8f0" : "#475569" }}>{label}</a>
                  ))}
                </>
              )}
              <button onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="w-full text-left block py-2.5 text-sm font-semibold rounded-xl px-3 mt-4 transition-colors" style={{ color: "#EF4444" }}>
                Logout Account
              </button>
            </div>
          )}

          {!user && (
            <div className="pt-4 flex flex-col gap-2" style={{ borderTop: isDarkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid #E2E8F0" }}>
              <button onClick={() => { onNavigate("login"); setMobileMenuOpen(false); }}
                className="w-full py-2.5 text-center text-sm font-semibold rounded-xl transition-all"
                style={isDarkMode ? { color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)" } : { color: "#475569", border: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                Sign In
              </button>
              <button onClick={() => { onNavigate("register"); setMobileMenuOpen(false); }}
                className="w-full py-2.5 text-center text-sm font-bold text-white rounded-xl transition-all"
                style={{ background: "linear-gradient(135deg,#2563EB,#2563eb)", boxShadow: "0 4px 16px rgba(37,99,235,0.30)" }}>
                Sign Up Free
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
