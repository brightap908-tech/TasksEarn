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
    `text-sm font-medium transition-all hover:text-emerald-500 cursor-pointer ${
      currentView === view ? "text-emerald-500 font-semibold" : "text-slate-500"
    }`;

  const isActive = (view: string) => currentView === view;

  return (
    <header id="app-header" className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <div 
          id="brand-logo" 
          onClick={() => onNavigate("home")} 
          className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-102"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
            <span className="font-display text-xl font-bold">₦</span>
          </div>
          <div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Tasks<span className="text-emerald-500">Earn</span>
            </span>
            <span className="block text-[9px] font-mono tracking-widest text-emerald-500 uppercase leading-none">
              Micro-Exchange
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
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Toggle Theme"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="h-4.5 w-4.5 text-amber-500 animate-pulse" /> : <Moon className="h-4.5 w-4.5 text-slate-600" />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              
              {/* Wallet Info */}
              <div className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-white shadow-sm">
                <Wallet className="h-4 w-4" />
                <span className="text-xs font-medium opacity-90">Balance:</span>
                <span className="font-mono text-sm font-bold">
                  ₦{user.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {user.role === UserRole.ADVERTISER && (
                  <button 
                    onClick={onOpenDeposit}
                    className="ml-1.5 rounded-full bg-white hover:bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 uppercase transition-all"
                  >
                    + Fund
                  </button>
                )}
              </div>

              {/* User Profile Info */}
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-800 leading-none">{user.name}</p>
                  <p className="text-[10px] font-medium text-slate-400 flex items-center gap-0.5 justify-end uppercase tracking-wider">
                    {user.role === UserRole.ADMIN ? (
                      <Shield className="h-2.5 w-2.5 text-rose-500" />
                    ) : (
                      <UserIcon className="h-2.5 w-2.5 text-emerald-500" />
                    )}
                    {user.role}
                  </p>
                </div>
                
                {/* Profile/Role Quick Jump */}
                <button 
                  onClick={() => {
                    if (user.role === UserRole.EARNER) onNavigate("earner-dashboard");
                    if (user.role === UserRole.ADVERTISER) onNavigate("advertiser-dashboard");
                    if (user.role === UserRole.ADMIN) onNavigate("admin-dashboard");
                  }}
                  className="rounded-full bg-slate-100 p-2 hover:bg-emerald-50 hover:text-emerald-500 transition-colors"
                  title="Dashboard"
                >
                  <Coins className="h-4 w-4 text-slate-600" />
                </button>

                <button 
                  onClick={onLogout}
                  className="rounded-full bg-rose-50 p-2 text-rose-500 hover:bg-rose-100 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>

            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onNavigate("login")}
                className="text-sm font-semibold text-slate-600 hover:text-emerald-500 cursor-pointer transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => onNavigate("register")}
                className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 transition-all cursor-pointer"
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center md:hidden gap-2">
          {/* Mobile Theme Toggle Button */}
          <button 
            onClick={onToggleDarkMode}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Toggle Theme"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-slate-600" />}
          </button>

          {user && (
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-800">
              <span className="font-mono text-xs font-bold">
                ₦{user.walletBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div id="mobile-nav-drawer" className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2 animate-fadeIn">
          <span 
            onClick={() => { onNavigate("home"); setMobileMenuOpen(false); }} 
            className="block py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg px-2 cursor-pointer"
          >
            Home
          </span>
          <span 
            onClick={() => { onNavigate("about"); setMobileMenuOpen(false); }} 
            className="block py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg px-2 cursor-pointer"
          >
            About
          </span>
          <span 
            onClick={() => { onNavigate("faq"); setMobileMenuOpen(false); }} 
            className="block py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg px-2 cursor-pointer"
          >
            FAQ
          </span>
          <span 
            onClick={() => { onNavigate("contact"); setMobileMenuOpen(false); }} 
            className="block py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg px-2 cursor-pointer"
          >
            Contact
          </span>

          {user && (
            <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
              <p className="px-2 text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">
                My Dashboard Menu
              </p>
              
              {user.role === UserRole.EARNER && (
                <>
                  <span 
                    onClick={() => { onNavigate("earner-dashboard"); setMobileMenuOpen(false); }} 
                    className="block py-2 text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg px-2 cursor-pointer"
                  >
                    My Stats
                  </span>
                  <span 
                    onClick={() => { onNavigate("earner-tasks"); setMobileMenuOpen(false); }} 
                    className="block py-2 text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg px-2 cursor-pointer"
                  >
                    Browse available tasks
                  </span>
                  <span 
                    onClick={() => { onNavigate("earner-submissions"); setMobileMenuOpen(false); }} 
                    className="block py-2 text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg px-2 cursor-pointer"
                  >
                    My Submissions History
                  </span>
                  <span 
                    onClick={() => { onNavigate("earner-referrals"); setMobileMenuOpen(false); }} 
                    className="block py-2 text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg px-2 cursor-pointer"
                  >
                    Referrals Network
                  </span>
                </>
              )}

              {user.role === UserRole.ADVERTISER && (
                <>
                  <span 
                    onClick={() => { onNavigate("advertiser-dashboard"); setMobileMenuOpen(false); }} 
                    className="block py-2 text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg px-2 cursor-pointer"
                  >
                    Campaign Stats
                  </span>
                  <span 
                    onClick={() => { onNavigate("advertiser-tasks"); setMobileMenuOpen(false); }} 
                    className="block py-2 text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg px-2 cursor-pointer"
                  >
                    My Campaigns (Pause/Edit)
                  </span>
                  <span 
                    onClick={() => { onNavigate("advertiser-submissions"); setMobileMenuOpen(false); }} 
                    className="block py-2 text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg px-2 cursor-pointer"
                  >
                    Review proof submissions
                  </span>
                  <button 
                    onClick={() => { onOpenDeposit(); setMobileMenuOpen(false); }}
                    className="w-full text-left block py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 rounded-lg px-2"
                  >
                    💳 Fund Wallet (₦)
                  </button>
                </>
              )}

              {user.role === UserRole.ADMIN && (
                <>
                  <span 
                    onClick={() => { onNavigate("admin-dashboard"); setMobileMenuOpen(false); }} 
                    className="block py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 rounded-lg px-2 cursor-pointer"
                  >
                    Super Admin controls
                  </span>
                </>
              )}

              <button 
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="w-full text-left block py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg px-2 mt-4"
              >
                Logout Account
              </button>
            </div>
          )}

          {!user && (
            <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
              <button 
                onClick={() => { onNavigate("login"); setMobileMenuOpen(false); }}
                className="w-full py-2 text-center text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg"
              >
                Sign In
              </button>
              <button 
                onClick={() => { onNavigate("register"); setMobileMenuOpen(false); }}
                className="w-full py-2 text-center text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg"
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
