import React from "react";
import { User, UserRole } from "../types";
import { Coins, LogOut, Shield, User as UserIcon, Wallet, Menu, X, Sun, Moon, Zap } from "lucide-react";

interface NavbarProps {
  user: User | null;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onOpenDeposit: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Navbar({ user, currentView, onNavigate, onLogout, onOpenDeposit, isDarkMode, onToggleDarkMode }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinkClass = (view: string) =>
    `text-sm font-medium transition-all cursor-pointer px-1 py-0.5 ${
      currentView === view
        ? "text-[#60a5fa] font-semibold"
        : "text-slate-400 hover:text-white"
    }`;

  const isActive = (view: string) => currentView === view;

  return (
    <header
      id="app-header"
      className="sticky top-0 z-50 w-full"
      style={{
        background: "rgba(11,18,32,0.94)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 1px 40px rgba(0,0,0,0.50)"
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
          {/* Icon mark */}
          <div
            className="relative flex h-10 w-10 items-center justify-center rounded-xl shrink-0 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              boxShadow: "0 0 20px rgba(59,130,246,0.45), 0 4px 12px rgba(29,78,216,0.35)",
              border: "1px solid rgba(96,165,250,0.30)"
            }}
          >
            {/* inner glow */}
            <div
              className="absolute inset-0 rounded-xl"
              style={{ background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.18) 0%, transparent 60%)" }}
            />
            <span
              className="relative z-10 font-bold text-white"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", lineHeight: 1, letterSpacing: "-0.02em" }}
            >
              ₦
            </span>
          </div>

          {/* Word-mark */}
          <div className="flex flex-col justify-center">
            <div className="flex items-baseline gap-0">
              <span
                className="font-bold text-white"
                style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", letterSpacing: "-0.03em", lineHeight: 1 }}
              >
                Tasks
              </span>
              <span
                className="font-bold"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.0625rem",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  background: "linear-gradient(135deg,#60a5fa,#3b82f6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}
              >
                Earn
              </span>
            </div>
            <span
              className="flex items-center gap-1"
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.18em", color: "rgba(96,165,250,0.70)", marginTop: "3px", textTransform: "uppercase", fontWeight: 700 }}
            >
              <Zap style={{ width: "7px", height: "7px", color: "#60a5fa" }} />
              MICRO-EXCHANGE
            </span>
          </div>
        </div>

        {/* ── Desktop Nav Links ── */}
        <nav className="hidden md:flex items-center gap-5">
          <span onClick={() => onNavigate("home")} className={navLinkClass("home")}>Home</span>
          <span onClick={() => onNavigate("about")} className={navLinkClass("about")}>About</span>
          <span onClick={() => onNavigate("faq")} className={navLinkClass("faq")}>FAQ</span>
          <span onClick={() => onNavigate("contact")} className={navLinkClass("contact")}>Contact</span>

          {user && user.role === UserRole.EARNER && (
            <>
              <span onClick={() => onNavigate("earner-tasks")} className={navLinkClass("earner-tasks")}>Browse Tasks</span>
              <span onClick={() => onNavigate("earner-submissions")} className={navLinkClass("earner-submissions")}>My Proofs</span>
              <span onClick={() => onNavigate("earner-referrals")} className={navLinkClass("earner-referrals")}>Referrals</span>
            </>
          )}
          {user && user.role === UserRole.ADVERTISER && (
            <>
              <span onClick={() => onNavigate("advertiser-tasks")} className={navLinkClass("advertiser-tasks")}>Campaigns</span>
              <span onClick={() => onNavigate("advertiser-submissions")} className={navLinkClass("advertiser-submissions")}>Submissions</span>
            </>
          )}
          {user && user.role === UserRole.ADMIN && (
            <span onClick={() => onNavigate("admin-dashboard")} className={navLinkClass("admin-dashboard")}>Admin Panel</span>
          )}
        </nav>

        {/* ── Desktop Controls ── */}
        <div className="hidden md:flex items-center gap-3">

          {/* Theme toggle */}
          <button
            onClick={onToggleDarkMode}
            className="rounded-full p-2 transition-colors cursor-pointer flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            aria-label="Toggle Theme"
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode
              ? <Sun className="h-4 w-4" style={{ color: "#fbbf24" }} />
              : <Moon className="h-4 w-4" style={{ color: "#94a3b8" }} />
            }
          </button>

          {user ? (
            <div className="flex items-center gap-3">

              {/* Wallet chip */}
              <div
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full"
                style={{
                  background: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.20)"
                }}
              >
                <Wallet className="h-3.5 w-3.5 shrink-0" style={{ color: "#60a5fa" }} />
                <span className="text-[10px] font-semibold" style={{ color: "#94a3b8" }}>Balance</span>
                <span className="font-mono text-sm font-bold" style={{ color: "#93c5fd" }}>
                  ₦{user.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {user.role === UserRole.ADVERTISER && (
                  <button
                    onClick={onOpenDeposit}
                    className="ml-1 rounded-full text-white text-[9px] font-bold uppercase px-2.5 py-0.5 transition-all cursor-pointer"
                    style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)" }}
                  >
                    + Fund
                  </button>
                )}
              </div>

              {/* Profile */}
              <div
                className="flex items-center gap-3 pl-3"
                style={{ borderLeft: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="text-right">
                  <p className="text-xs font-bold text-white leading-none">{user.name}</p>
                  <p className="text-[9px] font-bold flex items-center gap-1 justify-end uppercase tracking-wider mt-1.5" style={{ color: "#64748b" }}>
                    {user.role === UserRole.ADMIN
                      ? <Shield className="h-2.5 w-2.5" style={{ color: "#fb7185" }} />
                      : <UserIcon className="h-2.5 w-2.5" style={{ color: "#60a5fa" }} />
                    }
                    <span>{user.role}</span>
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (user.role === UserRole.EARNER) onNavigate("earner-dashboard");
                    if (user.role === UserRole.ADVERTISER) onNavigate("advertiser-dashboard");
                    if (user.role === UserRole.ADMIN) onNavigate("admin-dashboard");
                  }}
                  className="rounded-full p-2 transition-all cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  title="Dashboard"
                >
                  <Coins className="h-4 w-4" style={{ color: "#60a5fa" }} />
                </button>

                <button
                  onClick={onLogout}
                  className="rounded-full p-2 transition-all cursor-pointer"
                  style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.15)" }}
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" style={{ color: "#fb7185" }} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate("login")}
                className="text-sm font-semibold cursor-pointer transition-colors"
                style={{ color: "#94a3b8" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#f1f5f9")}
                onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate("register")}
                className="rounded-full px-5 py-2 text-sm font-bold text-white cursor-pointer transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg,#3b82f6 0%,#2563eb 100%)",
                  boxShadow: "0 4px 16px rgba(37,99,235,0.35)"
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(37,99,235,0.50)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(37,99,235,0.35)"; }}
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* ── Mobile Controls ── */}
        <div className="flex items-center md:hidden gap-2">
          <button
            onClick={onToggleDarkMode}
            className="rounded-full p-2 transition-colors cursor-pointer flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.04)" }}
            aria-label="Toggle Theme"
          >
            {isDarkMode
              ? <Sun className="h-4 w-4" style={{ color: "#fbbf24" }} />
              : <Moon className="h-4 w-4" style={{ color: "#94a3b8" }} />
            }
          </button>

          {user && (
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1"
              style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.20)" }}
            >
              <span className="font-mono text-xs font-bold" style={{ color: "#93c5fd" }}>
                ₦{user.walletBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1.5 transition-colors cursor-pointer"
            style={{ color: "#94a3b8" }}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          className="md:hidden px-4 py-4 space-y-1.5 animate-fadeIn"
          style={{
            background: "rgba(10,16,28,0.97)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)"
          }}
        >
          {["home","about","faq","contact"].map(v => (
            <span
              key={v}
              onClick={() => { onNavigate(v); setMobileMenuOpen(false); }}
              className="block py-2.5 text-sm font-semibold rounded-xl px-3 cursor-pointer transition-colors"
              style={isActive(v)
                ? { background: "rgba(59,130,246,0.12)", color: "#60a5fa" }
                : { color: "#94a3b8" }
              }
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </span>
          ))}

          {user && (
            <div className="pt-3 mt-2 space-y-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: "#3b82f6" }}>
                My Dashboard
              </p>

              {user.role === UserRole.EARNER && (
                <>
                  {[
                    ["earner-dashboard","My Stats"],
                    ["earner-tasks","Browse Tasks"],
                    ["earner-submissions","Submission History"],
                    ["earner-referrals","Referrals Network"]
                  ].map(([v, label]) => (
                    <span key={v} onClick={() => { onNavigate(v); setMobileMenuOpen(false); }}
                      className="block py-2.5 text-sm font-medium rounded-xl px-3 cursor-pointer transition-colors"
                      style={{ color: "#94a3b8" }}
                    >{label}</span>
                  ))}
                </>
              )}

              {user.role === UserRole.ADVERTISER && (
                <>
                  {[
                    ["advertiser-dashboard","Campaign Stats"],
                    ["advertiser-tasks","My Campaigns"],
                    ["advertiser-submissions","Review Proofs"]
                  ].map(([v, label]) => (
                    <span key={v} onClick={() => { onNavigate(v); setMobileMenuOpen(false); }}
                      className="block py-2.5 text-sm font-medium rounded-xl px-3 cursor-pointer transition-colors"
                      style={{ color: "#94a3b8" }}
                    >{label}</span>
                  ))}
                  <button
                    onClick={() => { onOpenDeposit(); setMobileMenuOpen(false); }}
                    className="w-full text-left block py-2.5 text-sm font-semibold rounded-xl px-3 transition-colors"
                    style={{ color: "#60a5fa" }}
                  >
                    Fund Wallet (₦)
                  </button>
                </>
              )}

              {user.role === UserRole.ADMIN && (
                <span onClick={() => { onNavigate("admin-dashboard"); setMobileMenuOpen(false); }}
                  className="block py-2.5 text-sm font-semibold rounded-xl px-3 cursor-pointer transition-colors"
                  style={{ color: "#818cf8" }}
                >
                  Super Admin Controls
                </span>
              )}

              <button
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="w-full text-left block py-2.5 text-sm font-semibold rounded-xl px-3 mt-4 transition-colors"
                style={{ color: "#fb7185" }}
              >
                Logout Account
              </button>
            </div>
          )}

          {!user && (
            <div className="pt-4 flex flex-col gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                onClick={() => { onNavigate("login"); setMobileMenuOpen(false); }}
                className="w-full py-2.5 text-center text-sm font-semibold rounded-xl transition-all"
                style={{ color: "#94a3b8", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)" }}
              >
                Sign In
              </button>
              <button
                onClick={() => { onNavigate("register"); setMobileMenuOpen(false); }}
                className="w-full py-2.5 text-center text-sm font-bold text-white rounded-xl transition-all"
                style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)", boxShadow: "0 4px 16px rgba(37,99,235,0.30)" }}
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
