import React from "react";
import { User, UserRole } from "../types";
import { Coins, LogOut, Shield, User as UserIcon, Wallet, Menu, X, Landmark, Users, Sun, Moon } from "lucide-react";

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
    `text-sm font-medium transition-all cursor-pointer ${
      currentView === view 
        ? "text-[#3b82f6] font-semibold" 
        : "text-gray-400 hover:text-white"
    }`;

  const isActive = (view: string) => currentView === view;

  return (
    <header id="app-header" className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#0b1220]/90 backdrop-blur-md shadow-lg shadow-black/10">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <div 
          id="brand-logo" 
          onClick={() => onNavigate("home")} 
          className="flex items-center gap-3 cursor-pointer transition-transform duration-200 active:scale-95"
        >
          <div className="flex h-9.5 w-9.5 items-center justify-center rounded-lg bg-[#3b82f6] text-white shrink-0">
            <span className="font-display text-lg font-bold">₦</span>
          </div>
          <div className="flex flex-col justify-center select-none">
            <span className="font-display text-base font-bold tracking-tight text-white leading-none">
              Tasks<span className="text-[#3b82f6]">Earn</span>
            </span>
            <span className="block text-[8px] font-mono tracking-[0.15em] text-[#3b82f6]/80 font-bold uppercase mt-1 leading-none">
              MICRO-EXCHANGE
            </span>
          </div>
        </div>

        {/* Desktop Main Navigation */}
        <nav className="hidden md:flex items-center gap-6">
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
              <span onClick={() => onNavigate("advertiser-tasks")} className={navLinkClass("advertiser-tasks")}>My Campaigns</span>
              <span onClick={() => onNavigate("advertiser-submissions")} className={navLinkClass("advertiser-submissions")}>Review Submissions</span>
            </>
          )}
          {user && user.role === UserRole.ADMIN && (
            <>
              <span onClick={() => onNavigate("admin-dashboard")} className={navLinkClass("admin-dashboard")}>Admin Panel</span>
            </>
          )}
        </nav>

        {/* Action Controls */}
        <div className="hidden md:flex items-center gap-4">
          {/* Theme Toggle Button */}
          <button 
            onClick={onToggleDarkMode}
            className="rounded-full p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Toggle Theme"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="h-4.5 w-4.5 text-amber-500 animate-pulse" /> : <Moon className="h-4.5 w-4.5 text-gray-400" />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              
              {/* Wallet Info */}
              <div className="flex items-center gap-2 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-3.5 py-1.5 text-[#3b82f6] shadow-sm">
                <Wallet className="h-4 w-4 shrink-0 text-[#3b82f6]/80" />
                <span className="text-xs font-semibold opacity-90 text-[#3b82f6]/90">Balance:</span>
                <span className="font-mono text-sm font-bold text-blue-300">
                  ₦{user.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {user.role === UserRole.ADVERTISER && (
                  <button 
                    onClick={onOpenDeposit}
                    className="ml-2 rounded-full bg-[#3b82f6] text-white hover:bg-blue-600 px-3 py-0.5 text-[10px] font-bold uppercase transition-all shadow-sm"
                  >
                    + Fund
                  </button>
                )}
              </div>

              {/* User Profile Info */}
              <div className="flex items-center gap-3 border-l border-white/[0.08] pl-3.5">
                <div className="text-right">
                  <p className="text-xs font-bold text-white leading-none">{user.name}</p>
                  <p className="text-[9px] font-bold text-gray-400 flex items-center gap-1 justify-end uppercase tracking-wider mt-1.5">
                    {user.role === UserRole.ADMIN ? (
                      <Shield className="h-2.5 w-2.5 text-rose-400" />
                    ) : (
                      <UserIcon className="h-2.5 w-2.5 text-[#3b82f6]" />
                    )}
                    <span>{user.role}</span>
                  </p>
                </div>
                
                {/* Profile/Role Quick Jump */}
                <button 
                  onClick={() => {
                    if (user.role === UserRole.EARNER) onNavigate("earner-dashboard");
                    if (user.role === UserRole.ADVERTISER) onNavigate("advertiser-dashboard");
                    if (user.role === UserRole.ADMIN) onNavigate("admin-dashboard");
                  }}
                  className="rounded-full bg-white/5 text-gray-400 p-2 hover:bg-[#3b82f6]/10 hover:text-[#3b82f6] transition-all cursor-pointer"
                  title="Dashboard"
                >
                  <Coins className="h-4 w-4" />
                </button>

                <button 
                  onClick={onLogout}
                  className="rounded-full bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>

            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => onNavigate("login")}
                className="text-sm font-semibold text-gray-300 hover:text-white cursor-pointer transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => onNavigate("register")}
                className="rounded-full bg-[#3b82f6] px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-600 transition-all cursor-pointer shadow-blue-950/25 active:scale-95"
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center md:hidden gap-3">
          {/* Mobile Theme Toggle Button */}
          <button 
            onClick={onToggleDarkMode}
            className="rounded-full p-2 text-gray-400 hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Toggle Theme"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-gray-400" />}
          </button>

          {user && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-3 py-1 text-[#3b82f6]">
              <span className="font-mono text-xs font-bold text-blue-300">
                ₦{user.walletBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-none transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div id="mobile-nav-drawer" className="md:hidden border-t border-white/5 bg-[#0b1220]/95 backdrop-blur-md px-4 py-4 space-y-2 animate-fadeIn shadow-xl shadow-black/25">
          <span 
            onClick={() => { onNavigate("home"); setMobileMenuOpen(false); }} 
            className={`block py-2 text-base font-semibold rounded-lg px-3 cursor-pointer transition-colors ${
              isActive("home") ? "bg-[#3b82f6]/10 text-[#3b82f6]" : "text-gray-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            Home
          </span>
          <span 
            onClick={() => { onNavigate("about"); setMobileMenuOpen(false); }} 
            className={`block py-2 text-base font-semibold rounded-lg px-3 cursor-pointer transition-colors ${
              isActive("about") ? "bg-[#3b82f6]/10 text-[#3b82f6]" : "text-gray-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            About
          </span>
          <span 
            onClick={() => { onNavigate("faq"); setMobileMenuOpen(false); }} 
            className={`block py-2 text-base font-semibold rounded-lg px-3 cursor-pointer transition-colors ${
              isActive("faq") ? "bg-[#3b82f6]/10 text-[#3b82f6]" : "text-gray-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            FAQ
          </span>
          <span 
            onClick={() => { onNavigate("contact"); setMobileMenuOpen(false); }} 
            className={`block py-2 text-base font-semibold rounded-lg px-3 cursor-pointer transition-colors ${
              isActive("contact") ? "bg-[#3b82f6]/10 text-[#3b82f6]" : "text-gray-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            Contact
          </span>

          {user && (
            <div className="border-t border-white/5 pt-3 mt-3 space-y-1">
              <p className="px-3 text-[10px] font-bold text-[#3b82f6] uppercase tracking-[0.12em] mb-2">
                My Dashboard Menu
              </p>
              
              {user.role === UserRole.EARNER && (
                <>
                  <span 
                    onClick={() => { onNavigate("earner-dashboard"); setMobileMenuOpen(false); }} 
                    className="block py-2 text-sm font-medium text-gray-300 hover:bg-[#3b82f6]/10 hover:text-[#3b82f6] rounded-lg px-3 cursor-pointer transition-colors"
                  >
                    My Stats
                  </span>
                  <span 
                    onClick={() => { onNavigate("earner-tasks"); setMobileMenuOpen(false); }} 
                    className="block py-2 text-sm font-medium text-gray-300 hover:bg-[#3b82f6]/10 hover:text-[#3b82f6] rounded-lg px-3 cursor-pointer transition-colors"
                  >
                    Browse available tasks
                  </span>
                  <span 
                    onClick={() => { onNavigate("earner-submissions"); setMobileMenuOpen(false); }} 
                    className="block py-2 text-sm font-medium text-gray-300 hover:bg-[#3b82f6]/10 hover:text-[#3b82f6] rounded-lg px-3 cursor-pointer transition-colors"
                  >
                    My Submissions History
                  </span>
                  <span 
                    onClick={() => { onNavigate("earner-referrals"); setMobileMenuOpen(false); }} 
                    className="block py-2 text-sm font-medium text-gray-300 hover:bg-[#3b82f6]/10 hover:text-[#3b82f6] rounded-lg px-3 cursor-pointer transition-colors"
                  >
                    Referrals Network
                  </span>
                </>
              )}

              {user.role === UserRole.ADVERTISER && (
                <>
                  <span 
                    onClick={() => { onNavigate("advertiser-dashboard"); setMobileMenuOpen(false); }} 
                    className="block py-2 text-sm font-medium text-gray-300 hover:bg-[#3b82f6]/10 hover:text-[#3b82f6] rounded-lg px-3 cursor-pointer transition-colors"
                  >
                    Campaign Stats
                  </span>
                  <span 
                    onClick={() => { onNavigate("advertiser-tasks"); setMobileMenuOpen(false); }} 
                    className="block py-2 text-sm font-medium text-gray-300 hover:bg-[#3b82f6]/10 hover:text-[#3b82f6] rounded-lg px-3 cursor-pointer transition-colors"
                  >
                    My Campaigns (Pause/Edit)
                  </span>
                  <span 
                    onClick={() => { onNavigate("advertiser-submissions"); setMobileMenuOpen(false); }} 
                    className="block py-2 text-sm font-medium text-gray-300 hover:bg-[#3b82f6]/10 hover:text-[#3b82f6] rounded-lg px-3 cursor-pointer transition-colors"
                  >
                    Review proof submissions
                  </span>
                  <button 
                    onClick={() => { onOpenDeposit(); setMobileMenuOpen(false); }}
                    className="w-full text-left block py-2 text-sm font-semibold text-[#3b82f6] hover:bg-[#3b82f6]/10 rounded-lg px-3 transition-colors"
                  >
                    Fund Wallet (₦)
                  </button>
                </>
              )}

              {user.role === UserRole.ADMIN && (
                <>
                  <span 
                    onClick={() => { onNavigate("admin-dashboard"); setMobileMenuOpen(false); }} 
                    className="block py-2 text-sm font-semibold text-indigo-400 hover:bg-indigo-500/10 rounded-lg px-3 cursor-pointer transition-colors"
                  >
                    Super Admin controls
                  </span>
                </>
              )}

              <button 
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="w-full text-left block py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 rounded-lg px-3 mt-4 transition-colors"
              >
                Logout Account
              </button>
            </div>
          )}

          {!user && (
            <div className="border-t border-white/5 pt-4 flex flex-col gap-2">
              <button 
                onClick={() => { onNavigate("login"); setMobileMenuOpen(false); }}
                className="w-full py-2.5 text-center text-sm font-semibold text-gray-300 border border-white/10 rounded-lg hover:bg-white/5 transition-all"
              >
                Sign In
              </button>
              <button 
                onClick={() => { onNavigate("register"); setMobileMenuOpen(false); }}
                className="w-full py-2.5 text-center text-sm font-semibold text-white bg-[#3b82f6] hover:bg-blue-600 rounded-lg transition-all"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
