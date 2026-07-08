import React from "react";
import { 
  User, 
  UserRole, 
  TaskCategory, 
  Transaction, 
  Announcement, 
  Banner, 
  WebsiteSettings 
} from "./types";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PublicPages from "./components/PublicPages";
import EarnerDashboard from "./components/EarnerDashboard";
import AdvertiserDashboard from "./components/AdvertiserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { simulateApiFetch } from "./mockDb";
import { 
  Landmark, 
  ShieldCheck, 
  Rocket, 
  Zap, 
  CheckCircle, 
  Sparkles, 
  Facebook, 
  Instagram, 
  Tv, 
  MessageSquare, 
  Twitter, 
  Globe, 
  Download, 
  ClipboardCheck, 
  HelpCircle,
  CreditCard,
  Building,
  UserCheck,
  Megaphone,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";

export default function App() {
  const [user, setUser] = React.useState<User | null>(null);
  const [currentView, setCurrentView] = React.useState<string>("home");
  
  // Public configurations
  const [banners, setBanners] = React.useState<Banner[]>([]);
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [pagesContent, setPagesContent] = React.useState<{ [key: string]: { title: string; content: string } }>({});
  
  // Platform settings
  const [settings, setSettings] = React.useState<WebsiteSettings>({
    platformName: "TasksEarn",
    referralReward: 200,
    withdrawalFee: 100,
    minWithdrawal: 2000,
    minDeposit: 1000,
    contactEmail: "support@tasksearn.com",
    contactPhone: "09164444315",
    whatsappGroup: "https://wa.me/2349164444315"
  });

  // Auth Forms State
  const [authRole, setAuthRole] = React.useState<UserRole>(UserRole.EARNER);
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");
  const [regName, setRegName] = React.useState("");
  const [regEmail, setRegEmail] = React.useState("");
  const [regPassword, setRegPassword] = React.useState("");
  const [regReferral, setRegReferral] = React.useState("");
  const [authError, setAuthError] = React.useState("");
  const [authLoading, setAuthLoading] = React.useState(false);

  // Forgot Password State & Toasts
  const [forgotEmail, setForgotEmail] = React.useState("");
  const [forgotSuccess, setForgotSuccess] = React.useState(false);
  const [toast, setToast] = React.useState<{ message: string; type: "success" | "error" } | null>(null);

  // Email Verification State
  const [verificationEmail, setVerificationEmail] = React.useState("");
  const [verificationCode, setVerificationCode] = React.useState("");
  const [verificationResent, setVerificationResent] = React.useState(false);

  // Admin and Demo password verification states
  const [showAdminPasswordPrompt, setShowAdminPasswordPrompt] = React.useState(false);
  const [adminPasswordPromptValue, setAdminPasswordPromptValue] = React.useState("");

  const [showEarnerPasswordPrompt, setShowEarnerPasswordPrompt] = React.useState(false);
  const [earnerPasswordPromptValue, setEarnerPasswordPromptValue] = React.useState("");

  const [showAdvertiserPasswordPrompt, setShowAdvertiserPasswordPrompt] = React.useState(false);
  const [advertiserPasswordPromptValue, setAdvertiserPasswordPromptValue] = React.useState("");

  // Dark Theme State
  const [isDarkMode, setIsDarkMode] = React.useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark";
  });

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  };

  // Paystack Deposit Modal State
  const [depositOpen, setDepositOpen] = React.useState(false);
  const [depositAmount, setDepositAmount] = React.useState("5000");
  const [depositGateway, setDepositGateway] = React.useState("Paystack");
  const [depositChannel, setDepositChannel] = React.useState("card"); // card, opay, moniepoint, palmpay, bank_transfer
  const [depositProcessing, setDepositProcessing] = React.useState(false);
  const [depositSuccess, setDepositSuccess] = React.useState(false);

  // Token helper
  const getAuthToken = () => localStorage.getItem("tasksearn_uid") || "";

  // Dynamic API Fetch proxy
  const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    
    // Automatically detect static GitHub Pages or client-only environments
    const isStaticEnv = window.location.hostname.includes("github.io") || 
                        window.location.hash.includes("static") ||
                        window.location.search.includes("static");
                        
    if (isStaticEnv) {
      return simulateApiFetch(endpoint, options, token);
    }

    const headers = {
      ...(options.headers || {}),
      "Authorization": `Bearer ${token}`
    };

    try {
      const res = await fetch(endpoint, { ...options, headers });
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await res.json();
      }
      return { error: `Server responded with status ${res.status}` };
    } catch (e) {
      console.warn("Express backend connection failed, falling back to client-side Simulation Database: " + endpoint, e);
      return simulateApiFetch(endpoint, options, token);
    }
  };

  // Check login on startup
  const checkSession = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const data = await apiFetch("/api/auth/me");
      if (data && data.user) {
        setUser(data.user);
        // Automatically route to their respective dashboard on startup
        if (data.user.role === UserRole.EARNER) setCurrentView("earner-dashboard");
        if (data.user.role === UserRole.ADVERTISER) setCurrentView("advertiser-dashboard");
        if (data.user.role === UserRole.ADMIN) setCurrentView("admin-dashboard");
      } else {
        localStorage.removeItem("tasksearn_uid");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Refresh user balance / verification
  const refreshUserSession = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const data = await apiFetch("/api/auth/me");
      if (data && data.user) {
        setUser(data.user);
      }
    } catch (e) {}
  };

  // Fetch static content
  const loadPublicData = async () => {
    try {
      const b = await apiFetch("/api/public/banners");
      if (Array.isArray(b)) setBanners(b);

      const a = await apiFetch("/api/public/announcements");
      if (Array.isArray(a)) setAnnouncements(a);

      const p = await apiFetch("/api/public/pages");
      if (p && !p.error) setPagesContent(p);

      // Get settings from public settings endpoint
      const d = await apiFetch("/api/public/settings");
      if (d && !d.error) {
        setSettings(d);
      }
    } catch (e) {}
  };

  React.useEffect(() => {
    // Check if there is a referral code in URL query (?ref=XYZ)
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");
    if (refCode) {
      setRegReferral(refCode);
      setCurrentView("register");
    }

    checkSession();
    loadPublicData();
  }, []);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setAuthLoading(true);
    setAuthError("");

    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      if (data && data.error) {
        if (data.error === "EMAIL_NOT_VERIFIED") {
          setVerificationEmail(data.email || loginEmail);
          setAuthError("");
          setCurrentView("verify-email");
        } else {
          setAuthError(data.error);
        }
      } else if (data && data.user) {
        localStorage.setItem("tasksearn_uid", data.user.id);
        setUser(data.user);
        
        // Navigation depending on role
        if (data.user.role === UserRole.EARNER) {
          setCurrentView("earner-dashboard");
        } else if (data.user.role === UserRole.ADVERTISER) {
          setCurrentView("advertiser-dashboard");
        } else if (data.user.role === UserRole.ADMIN) {
          setCurrentView("admin-dashboard");
        }
        
        // Reset forms
        setLoginEmail("");
        setLoginPassword("");
      }
    } catch (err) {
      setAuthError("Failed to verify secure credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Forgot Password handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setAuthLoading(true);
    setAuthError("");
    setForgotSuccess(false);

    try {
      const data = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail })
      });

      if (data && data.error) {
        setAuthError(data.error);
      } else if (data && data.success) {
        setForgotSuccess(true);
        showToast(data.message, "success");
        setForgotEmail("");
      }
    } catch (err) {
      setAuthError("Failed to complete password recovery request.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Email Verification Handlers
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) return;

    setAuthLoading(true);
    setAuthError("");

    try {
      const data = await apiFetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail, code: verificationCode })
      });

      if (data && data.error) {
        setAuthError(data.error);
      } else if (data && data.user) {
        localStorage.setItem("tasksearn_uid", data.user.id);
        setUser(data.user);
        showToast("Email address successfully verified!", "success");

        if (data.user.role === UserRole.EARNER) {
          setCurrentView("earner-dashboard");
        } else if (data.user.role === UserRole.ADVERTISER) {
          setCurrentView("advertiser-dashboard");
        } else {
          setCurrentView("admin-dashboard");
        }
        
        setVerificationEmail("");
        setVerificationCode("");
      }
    } catch (err) {
      setAuthError("Failed to complete email verification.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResendCode = async () => {
    setAuthError("");
    setVerificationResent(false);
    try {
      const data = await apiFetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail })
      });

      if (data && data.error) {
        setAuthError(data.error);
      } else {
        setVerificationResent(true);
        showToast("A new 6-digit verification code has been sent successfully.", "success");
      }
    } catch (err) {
      setAuthError("Failed to resend verification code.");
    }
  };

  // One-click Demo Login handler
  const handleDemoLogin = async (email: string, customPassword?: string) => {
    setAuthLoading(true);
    setAuthError("");
    setLoginEmail(email);
    const pwd = customPassword || "password123";
    setLoginPassword(pwd);

    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pwd })
      });

      if (data && data.error) {
        if (data.error === "EMAIL_NOT_VERIFIED") {
          setVerificationEmail(data.email || email);
          setAuthError("");
          setCurrentView("verify-email");
        } else {
          setAuthError(data.error);
        }
      } else if (data && data.user) {
        localStorage.setItem("tasksearn_uid", data.user.id);
        setUser(data.user);
        
        // Navigation depending on role
        if (data.user.role === UserRole.EARNER) {
          setCurrentView("earner-dashboard");
        } else if (data.user.role === UserRole.ADVERTISER) {
          setCurrentView("advertiser-dashboard");
        } else if (data.user.role === UserRole.ADMIN) {
          setCurrentView("admin-dashboard");
        }
        
        // Reset forms
        setLoginEmail("");
        setLoginPassword("");
        setShowAdminPasswordPrompt(false);
        setAdminPasswordPromptValue("");
        setShowEarnerPasswordPrompt(false);
        setEarnerPasswordPromptValue("");
        setShowAdvertiserPasswordPrompt(false);
        setAdvertiserPasswordPromptValue("");
      }
    } catch (err) {
      setAuthError("Failed to verify secure credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Register handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) return;

    setAuthLoading(true);
    setAuthError("");

    try {
      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: authRole,
          referralCode: regReferral
        })
      });

      if (data && data.error) {
        setAuthError(data.error);
      } else if (data && data.user) {
        // Register starts unverified, so direct them to verify-email view
        setVerificationEmail(regEmail);
        setAuthError("");
        setCurrentView("verify-email");

        // Reset forms
        setRegName("");
        setRegEmail("");
        setRegPassword("");
        setRegReferral("");
      }
    } catch (err) {
      setAuthError("Registration failed. Please try a different email address.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("tasksearn_uid");
    setUser(null);
    setCurrentView("home");
  };

  // Real & Simulated Paystack payment gateway billing process
  const triggerDepositPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < settings.minDeposit) {
      alert(`Minimum deposit is ₦${settings.minDeposit.toLocaleString()}`);
      return;
    }

    setDepositProcessing(true);
    try {
      // 1. Initialize Paystack Transaction
      const initRes = await apiFetch("/api/advertiser/deposit/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });

      if (!initRes || initRes.error) {
        alert(initRes?.error || "Failed to initialize payment transaction.");
        setDepositProcessing(false);
        return;
      }

      const { authorization_url, reference } = initRes;

      if (authorization_url === "SIMULATED") {
        // Simulated mock environment
        setTimeout(async () => {
          try {
            const verifyRes = await apiFetch("/api/advertiser/deposit/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference })
            });

            if (verifyRes && verifyRes.success) {
              setDepositSuccess(true);
              refreshUserSession();
              setTimeout(() => {
                setDepositSuccess(false);
                setDepositOpen(false);
                setDepositProcessing(false);
              }, 2000);
            } else {
              alert(verifyRes?.error || "Simulated payment verification failed.");
              setDepositProcessing(false);
            }
          } catch (err) {
            alert("Payment simulation gateway failed to verify callback.");
            setDepositProcessing(false);
          }
        }, 2500);
      } else {
        // Real environment: redirect to Paystack Checkout URL
        window.location.href = authorization_url;
      }
    } catch (err) {
      alert("Payment gateway connection failed.");
      setDepositProcessing(false);
    }
  };

  // Categorical details for Home Page
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Facebook Like":
      case "Facebook Follow":
      case "Facebook Share":
      case "Facebook Comment":
        return <Facebook className="h-5 w-5 text-blue-600" />;
      case "Instagram Like":
      case "Instagram Follow":
        return <Instagram className="h-5 w-5 text-pink-600" />;
      case "YouTube Subscribe":
      case "YouTube Like":
      case "YouTube Watch":
        return <Tv className="h-5 w-5 text-red-600" />;
      case "Telegram Join":
        return <MessageSquare className="h-5 w-5 text-sky-500" />;
      case "WhatsApp Join":
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case "X (Twitter) Follow":
        return <Twitter className="h-5 w-5 text-gray-900" />;
      case "Website Visit":
        return <Globe className="h-5 w-5 text-indigo-600" />;
      case "App Download":
        return <Download className="h-5 w-5 text-emerald-600" />;
      case "Survey":
        return <ClipboardCheck className="h-5 w-5 text-amber-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-teal-600" />;
    }
  };

  const getPublicCategories = () => [
    { title: "Facebook Follows", count: "12,402 Completed", payout: "₦10.00 - ₦25.00/Follow" },
    { title: "Instagram Likes", count: "18,940 Completed", payout: "₦8.00 - ₦15.00/Like" },
    { title: "YouTube Subscribes", count: "9,820 Completed", payout: "₦15.00 - ₦35.00/Sub" },
    { title: "TikTok Comments", count: "7,540 Completed", payout: "₦10.00 - ₦20.00/Comment" },
    { title: "Telegram Joins", count: "21,480 Completed", payout: "₦12.00 - ₦25.00/Join" },
    { title: "Website Visits", count: "15,300 Completed", payout: "₦15.00 - ₦50.00/Click" },
    { title: "App Downloads", count: "4,210 Completed", payout: "₦150.00 - ₦500.00/Install" },
    { title: "Surveys & Reviews", count: "3,110 Completed", payout: "₦200.00 - ₦800.00/Task" }
  ];

  return (
    <div className={`flex min-h-screen flex-col font-sans transition-colors duration-300 ${isDarkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      
      {/* Navigation Header */}
      <Navbar 
        user={user} 
        currentView={currentView} 
        onNavigate={(view) => setCurrentView(view)} 
        onLogout={handleLogout}
        onOpenDeposit={() => setDepositOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Dynamic Content View Stage */}
      <main className="flex-grow">
        
        {/* PUBLIC HOME LANDING VIEW */}
        {currentView === "home" && (
          <div className="space-y-16 pb-16">
            
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-white py-16 sm:py-24 border-b border-slate-200">
              <div className="absolute inset-0 bg-slate-50/50" />
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                
                {/* Left Pitch */}
                <div className="space-y-6 max-w-xl">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                    <Zap className="h-3.5 w-3.5 text-emerald-500" /> Nigeria's Most Trusted Micro-Job Exchange
                  </span>
                  
                  <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-tight">
                    Get Paid Weekly for <span className="text-emerald-500">Simple Tasks</span>
                  </h1>

                  <p className="text-sm text-slate-500 leading-relaxed">
                    Join over 45,000+ active Nigerians working from home. Earn wallet payouts instantly in Nigerian Naira (₦) for likes, subscribes, follows, reviews, and app downloads. Advertisers get 100% organic, verified growth.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button 
                      onClick={() => setCurrentView("register")}
                      className="rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 transition-all text-center cursor-pointer"
                    >
                      Sign Up & Start Earning
                    </button>
                    <button 
                      onClick={() => {
                        setAuthRole(UserRole.ADVERTISER);
                        setCurrentView("register");
                      }}
                      className="rounded-full border border-slate-200 hover:bg-slate-50 px-6 py-3.5 text-sm font-semibold text-slate-700 bg-white shadow-xs text-center cursor-pointer transition-colors"
                    >
                      Promote My Business
                    </button>
                  </div>
                </div>

                {/* Right Hero Graphics Display */}
                <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Live Ticker</span>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="rounded-xl bg-emerald-50/50 border border-emerald-50 p-3.5 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-800">Tunde B. (Guaranty Trust Bank)</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Withdrawal requested successfully</p>
                      </div>
                      <span className="font-mono font-black text-emerald-700">₦7,450.00</span>
                    </div>

                    <div className="rounded-xl bg-indigo-50/50 border border-indigo-50 p-3.5 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-800">New Campaign: IG Follow GossipMill</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Budget: ₦15,000 allocated</p>
                      </div>
                      <span className="rounded-lg bg-indigo-100 px-2.5 py-1 text-[9px] font-bold text-indigo-700">LIVE NOW</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-gray-50 pt-4 text-center font-mono text-[10px] text-gray-400">
                    <div>
                      <p className="text-base font-black text-gray-800">45K+</p>
                      <p className="mt-0.5">Earners</p>
                    </div>
                    <div>
                      <p className="text-base font-black text-gray-800">1.2M+</p>
                      <p className="mt-0.5">Tasks Done</p>
                    </div>
                    <div>
                      <p className="text-base font-black text-gray-800">₦24M+</p>
                      <p className="mt-0.5">Paid Out</p>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* Banners Slider Carousels */}
            {banners.length > 0 && (
              <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-100 bg-white grid grid-cols-1 md:grid-cols-2">
                  <div className="p-8 sm:p-12 flex flex-col justify-center space-y-6 bg-gradient-to-br from-gray-900 to-indigo-950 text-white">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Active Promotion</span>
                    <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                      {banners[0].title}
                    </h2>
                    <p className="text-xs text-gray-300 leading-relaxed max-w-sm">
                      Work anywhere inside Nigeria. Do small social tasks on YouTube, TikTok, and Instagram and receive bank transfers immediately.
                    </p>
                    <button 
                      onClick={() => setCurrentView("register")}
                      className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-5 py-3 text-xs font-bold text-white uppercase self-start shadow-lg shadow-emerald-950/50"
                    >
                      Start Earning
                    </button>
                  </div>
                  <div className="h-64 md:h-auto overflow-hidden relative">
                    <img 
                      src={banners[0].imageUrl} 
                      alt="Promotion Banner" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Microtask Category List Grid */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="text-center">
                <h2 className="font-display text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Micro-Job Engagement Categories
                </h2>
                <p className="mt-2 text-xs text-gray-400">Choose from thousands of fresh daily tasks matching your active social media handles.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {getPublicCategories().map((cat, idx) => (
                  <div key={idx} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all group cursor-pointer" onClick={() => setCurrentView("register")}>
                    <div className="flex justify-between items-start">
                      <div className="rounded-xl bg-gray-50 group-hover:bg-emerald-50 p-2.5 transition-colors">
                        {getCategoryIcon(cat.title.substring(0, cat.title.length - 1))}
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">{cat.count}</span>
                    </div>
                    <h3 className="font-display text-xs font-bold text-gray-800 mt-4">{cat.title}</h3>
                    <p className="text-[11px] font-mono text-emerald-600 mt-1 font-bold">{cat.payout}</p>
                    <div className="mt-3 text-[10px] text-gray-400 font-semibold group-hover:text-emerald-600 flex items-center gap-1 transition-colors justify-end">
                      Claim Task <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* How It Works Timeline */}
            <section className="bg-white py-16 border-t border-b border-gray-100">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="text-center">
                  <h2 className="font-display text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">How TasksEarn Works</h2>
                  <p className="mt-2 text-xs text-gray-400">Three simple steps to start earning Naira on our decentralized microtask network.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center space-y-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 font-bold text-lg border border-emerald-100">1</div>
                    <h3 className="font-display text-sm font-bold text-gray-800">Register Secure Account</h3>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">Sign up as an Earner or Advertiser. Complete email validation inside 1 minute to lock verification code logs.</p>
                  </div>
                  <div className="text-center space-y-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 font-bold text-lg border border-emerald-100">2</div>
                    <h3 className="font-display text-sm font-bold text-gray-800">Perform Social Actions</h3>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">Follow accounts, subscribe channels, join groups, or download apps. Take a snapshot proving your action.</p>
                  </div>
                  <div className="text-center space-y-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 font-bold text-lg border border-emerald-100">3</div>
                    <h3 className="font-display text-sm font-bold text-gray-800">Withdraw Naira (₦)</h3>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">Get accredited. Withdraw immediately to OPay, PalmPay, GTBank, Zenith, or any local Nigerian bank instantly!</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Call To Action Banner */}
            <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
              <div className="rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-800 p-8 sm:p-12 text-white text-center space-y-6 shadow-xl shadow-emerald-50">
                <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">Ready to Monetize Your Spare Time?</h2>
                <p className="text-xs text-emerald-100 max-w-lg mx-auto leading-relaxed">
                  Join our verified ecosystem of online earners. Advertisers can build custom campaign budgets starting at ₦1,000 only. Let's grow together!
                </p>
                <div className="pt-2 flex justify-center">
                  <button 
                    onClick={() => setCurrentView("register")}
                    className="rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 px-8 py-4 text-sm font-bold shadow-lg transition-all cursor-pointer"
                  >
                    Create Free TasksEarn Account
                  </button>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* AUTHENTICATION SECURE VIEW (LOGIN) */}
        {currentView === "login" && (
          <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              
              <div className="text-center">
                <h2 className="font-display text-xl font-bold text-slate-900">Welcome Back to TasksEarn</h2>
                <p className="text-xs text-slate-400 mt-1">Sign in to your dashboard to complete tasks or fund campaigns.</p>
              </div>

              {authError && <p className="rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-600 border border-rose-100 text-center">{authError}</p>}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email Address</label>
                  <input 
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. earner@tasksearn.com"
                    className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-500 uppercase">Password</label>
                    <button 
                      type="button" 
                      onClick={() => {
                        setAuthError("");
                        setCurrentView("forgot-password");
                      }}
                      className="text-xs text-emerald-500 hover:text-emerald-600 hover:underline font-semibold"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input 
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition-all cursor-pointer"
                >
                  {authLoading ? "Decrypting Session..." : "Secure Sign In"}
                </button>
              </form>

              <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-400">
                Don't have an account?{" "}
                <button 
                  onClick={() => setCurrentView("register")}
                  className="font-bold text-emerald-500 hover:text-emerald-600 hover:underline"
                >
                  Create one now
                </button>
              </div>

              {/* Demo accounts quick helper */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-[11px] text-slate-500 space-y-2">
                <p className="font-bold text-slate-700">🔑 Secure Demo Accounts Password Gates:</p>
                <div className="flex flex-col gap-1.5 mt-1">
                  
                  {/* Demo Earner Password Gate */}
                  {!showEarnerPasswordPrompt ? (
                    <button
                      type="button"
                      onClick={() => setShowEarnerPasswordPrompt(true)}
                      className="flex justify-between items-center bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-xl px-3 py-1.5 transition-all text-left cursor-pointer"
                    >
                      <span>👥 Demo Earner</span>
                      <span className="font-semibold text-emerald-600 font-mono text-[9px] bg-emerald-50 px-2 py-0.5 rounded-full">Enter Password</span>
                    </button>
                  ) : (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-[10px] text-emerald-950 flex items-center gap-1">👥 Demo Earner Password Check</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            setShowEarnerPasswordPrompt(false);
                            setEarnerPasswordPromptValue("");
                          }}
                          className="text-[9px] text-gray-400 hover:text-emerald-600 font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <input 
                          type="password"
                          required
                          value={earnerPasswordPromptValue}
                          onChange={(e) => setEarnerPasswordPromptValue(e.target.value)}
                          placeholder="Enter earner password..."
                          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!earnerPasswordPromptValue) return;
                            handleDemoLogin("earner@tasksearn.com", earnerPasswordPromptValue);
                          }}
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 text-[10px] transition-all cursor-pointer shrink-0"
                        >
                          Verify & Login
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Demo Advertiser Password Gate */}
                  {!showAdvertiserPasswordPrompt ? (
                    <button
                      type="button"
                      onClick={() => setShowAdvertiserPasswordPrompt(true)}
                      className="flex justify-between items-center bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-xl px-3 py-1.5 transition-all text-left cursor-pointer"
                    >
                      <span>📢 Demo Advertiser</span>
                      <span className="font-semibold text-emerald-600 font-mono text-[9px] bg-emerald-50 px-2 py-0.5 rounded-full">Enter Password</span>
                    </button>
                  ) : (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-[10px] text-emerald-950 flex items-center gap-1">📢 Demo Advertiser Password Check</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            setShowAdvertiserPasswordPrompt(false);
                            setAdvertiserPasswordPromptValue("");
                          }}
                          className="text-[9px] text-gray-400 hover:text-emerald-600 font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <input 
                          type="password"
                          required
                          value={advertiserPasswordPromptValue}
                          onChange={(e) => setAdvertiserPasswordPromptValue(e.target.value)}
                          placeholder="Enter advertiser password..."
                          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!advertiserPasswordPromptValue) return;
                            handleDemoLogin("advertiser@tasksearn.com", advertiserPasswordPromptValue);
                          }}
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 text-[10px] transition-all cursor-pointer shrink-0"
                        >
                          Verify & Login
                        </button>
                      </div>
                    </div>
                  )}

                  {!showAdminPasswordPrompt ? (
                    <button
                      type="button"
                      onClick={() => setShowAdminPasswordPrompt(true)}
                      className="flex justify-between items-center bg-white border border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50 rounded-xl px-3 py-1.5 transition-all text-left cursor-pointer w-full"
                      id="admin-demo-login-btn"
                    >
                      <span className="font-medium text-indigo-950">🛡️ Super Admin Portal</span>
                      <span className="font-semibold text-indigo-600 font-mono text-[9px] bg-indigo-50 px-2 py-0.5 rounded-full">Enter Password</span>
                    </button>
                  ) : (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-3 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-[10px] text-indigo-950 flex items-center gap-1">🛡️ Super Admin Password Check</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            setShowAdminPasswordPrompt(false);
                            setAdminPasswordPromptValue("");
                          }}
                          className="text-[9px] text-gray-400 hover:text-indigo-600 font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <input 
                          type="password"
                          required
                          value={adminPasswordPromptValue}
                          onChange={(e) => setAdminPasswordPromptValue(e.target.value)}
                          placeholder="Enter admin password..."
                          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!adminPasswordPromptValue) return;
                            handleDemoLogin("admin@tasksearn.com", adminPasswordPromptValue);
                          }}
                          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 text-[10px] transition-all cursor-pointer shrink-0"
                        >
                          Verify & Login
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* AUTHENTICATION SECURE VIEW (FORGOT PASSWORD) */}
        {currentView === "forgot-password" && (
          <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              
              <div className="text-center">
                <h2 className="font-display text-xl font-bold text-slate-900">Account Recovery</h2>
                <p className="text-xs text-slate-400 mt-1">Enter your registered email address below to receive password recovery instructions.</p>
              </div>

              {authError && <p className="rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-600 border border-rose-100 text-center">{authError}</p>}
              
              {forgotSuccess ? (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5 text-center space-y-3">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-emerald-950">Instructions Sent</h3>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Check your email inbox for instructions to reset your secure credentials.
                  </p>
                  <div className="pt-2">
                    <button 
                      onClick={() => {
                        setForgotSuccess(false);
                        setCurrentView("login");
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                      Return to Secure Sign In
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email Address</label>
                    <input 
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. yourname@example.com"
                      className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={authLoading}
                    className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition-all cursor-pointer"
                  >
                    {authLoading ? "Verifying Registry..." : "Send Recovery Instructions"}
                  </button>
                </form>
              )}

              <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-400">
                Remember your password?{" "}
                <button 
                  onClick={() => {
                    setAuthError("");
                    setForgotSuccess(false);
                    setCurrentView("login");
                  }}
                  className="font-bold text-emerald-500 hover:text-emerald-600 hover:underline"
                >
                  Sign In
                </button>
              </div>

            </div>
          </div>
        )}

        {/* AUTHENTICATION SECURE VIEW (REGISTER) */}
        {currentView === "register" && (
          <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              
              <div className="text-center">
                <h2 className="font-display text-xl font-bold text-slate-900">Create Free Account</h2>
                <p className="text-xs text-slate-400 mt-1">Get certified, perform tasks, promote brand awareness.</p>
              </div>

              {/* Role Toggle Selector */}
              <div className="grid grid-cols-2 gap-2 border border-slate-200 rounded-full p-1 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setAuthRole(UserRole.EARNER)}
                  className={`py-2 text-xs font-bold rounded-full cursor-pointer transition-all ${authRole === UserRole.EARNER ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Register as Earner
                </button>
                <button
                  type="button"
                  onClick={() => setAuthRole(UserRole.ADVERTISER)}
                  className={`py-2 text-xs font-bold rounded-full cursor-pointer transition-all ${authRole === UserRole.ADVERTISER ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Register as Advertiser
                </button>
              </div>

              {authError && <p className="rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-600 border border-rose-100 text-center">{authError}</p>}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name (Legal Bank Name)</label>
                  <input 
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Sola Bakare"
                    className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email Address</label>
                  <input 
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. sola@example.com"
                    className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Security Password</label>
                  <input 
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {authRole === UserRole.EARNER && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Referral Code (Optional)</label>
                    <input 
                      type="text"
                      value={regReferral}
                      onChange={(e) => setRegReferral(e.target.value)}
                      placeholder="e.g. TUNDE887"
                      className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono text-center uppercase tracking-wider"
                    />
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition-all cursor-pointer"
                >
                  {authLoading ? "Initializing Encrypted Vault..." : "Create Account"}
                </button>
              </form>

              <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-400">
                Already registered?{" "}
                <button 
                  onClick={() => setCurrentView("login")}
                  className="font-bold text-emerald-500 hover:text-emerald-600 hover:underline"
                >
                  Sign In
                </button>
              </div>

            </div>
          </div>
        )}

        {/* AUTHENTICATION SECURE VIEW (EMAIL VERIFICATION) */}
        {currentView === "verify-email" && (
          <div className="mx-auto max-w-md px-4 py-16 sm:py-24 animate-fadeIn">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h2 className="font-display text-xl font-bold text-slate-900">Email Verification Required</h2>
                <p className="text-xs text-slate-400">
                  A secure 6-digit verification code has been generated. Please enter the code sent to your email <span className="font-semibold text-slate-700">{verificationEmail}</span>.
                </p>
              </div>

              {authError && (
                <p className="rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-600 border border-rose-100 text-center">
                  {authError}
                </p>
              )}

              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 text-center">6-Digit Verification Code</label>
                  <input 
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 123456"
                    className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-center text-lg font-bold tracking-widest focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition-all cursor-pointer"
                >
                  {authLoading ? "Validating Credentials..." : "Verify Code & Log In"}
                </button>
              </form>

              <div className="flex flex-col gap-3 pt-2 text-center text-xs border-t border-slate-100 pt-4">
                <p className="text-slate-400">
                  Didn't receive the email?{" "}
                  <button 
                    onClick={handleResendCode}
                    disabled={verificationResent}
                    className={`font-bold text-emerald-500 hover:text-emerald-600 hover:underline ${verificationResent ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {verificationResent ? "Code Resent Successfully" : "Resend Verification Code"}
                  </button>
                </p>
                
                <button 
                  onClick={() => {
                    setAuthError("");
                    setVerificationEmail("");
                    setVerificationCode("");
                    setVerificationResent(false);
                    setCurrentView("login");
                  }}
                  className="font-semibold text-slate-400 hover:text-slate-600"
                >
                  Return to Secure Sign In
                </button>
              </div>

            </div>
          </div>
        )}

        {/* CMS STATIC AND REGULATORY PAGES */}
        {["about", "faq", "contact", "terms", "privacy"].includes(currentView) && (
          <PublicPages 
            view={currentView} 
            pagesContent={pagesContent} 
            settings={settings}
          />
        )}

        {/* ROLE PROTECTED: EARNER DASHBOARD PANELS */}
        {user && user.role === UserRole.EARNER && ["earner-dashboard", "earner-tasks", "earner-submissions", "earner-referrals"].includes(currentView) && (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <EarnerDashboard 
              user={user} 
              onRefreshUser={refreshUserSession}
              onNavigate={(view) => setCurrentView(view)}
              apiFetch={apiFetch}
              showToast={showToast}
            />
          </div>
        )}

        {/* ROLE PROTECTED: ADVERTISER DASHBOARD PANELS */}
        {user && user.role === UserRole.ADVERTISER && ["advertiser-dashboard", "advertiser-tasks", "advertiser-submissions"].includes(currentView) && (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <AdvertiserDashboard 
              user={user} 
              onRefreshUser={refreshUserSession}
              onNavigate={(view) => setCurrentView(view)}
              onOpenDeposit={() => setDepositOpen(true)}
              apiFetch={apiFetch}
            />
          </div>
        )}

        {/* ROLE PROTECTED: ADMIN PANEL */}
        {user && user.role === UserRole.ADMIN && currentView === "admin-dashboard" && (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <AdminDashboard 
              user={user} 
              onRefreshUser={refreshUserSession}
              apiFetch={apiFetch}
            />
          </div>
        )}

      </main>

      {/* Paystack Payment Simulated billing popup */}
      {depositOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl relative overflow-hidden space-y-5">
            
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                  Secure Checkout
                </span>
                <h3 className="font-display text-base font-bold text-gray-900 mt-1">Fund Advertiser Wallet</h3>
              </div>
              <button 
                onClick={() => { if (!depositProcessing) setDepositOpen(false); }}
                className="rounded-full bg-gray-100 p-1 hover:bg-gray-200 text-gray-500"
                disabled={depositProcessing}
              >
                ✕
              </button>
            </div>

            {depositSuccess ? (
              <div className="text-center py-6 space-y-3 animate-fadeIn">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h4 className="font-display text-sm font-bold text-emerald-950">Payment Complete!</h4>
                <p className="text-[11px] text-emerald-600">₦{parseFloat(depositAmount).toLocaleString()} added to wallet.</p>
              </div>
            ) : depositProcessing ? (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
                <div>
                  <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">Contacting {depositGateway}...</p>
                  <p className="text-[10px] text-gray-400 mt-1">Processing simulated card/bank transfer checkout securely.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={triggerDepositPayment} className="space-y-4">
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Select deposit Gateway</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDepositGateway("Paystack")}
                      className={`py-2 rounded-lg border text-xs font-semibold ${depositGateway === "Paystack" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-gray-200 bg-white"}`}
                    >
                      Paystack
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepositGateway("Flutterwave")}
                      className={`py-2 rounded-lg border text-xs font-semibold ${depositGateway === "Flutterwave" ? "border-teal-500 bg-teal-50 text-teal-800" : "border-gray-200 bg-white"}`}
                    >
                      Flutterwave
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Fund Amount (Naira ₦)</label>
                  <input 
                    type="number"
                    required
                    min={settings.minDeposit}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="Min: 1000"
                  />
                  <span className="block text-[10px] text-gray-400 mt-1">Min deposit: ₦{settings.minDeposit.toLocaleString()}</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Simulate payment method</label>
                  <select
                    value={depositChannel}
                    onChange={(e) => setDepositChannel(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white focus:outline-none"
                  >
                    <option value="card">💳 MasterCard / Visa Credit Card</option>
                    <option value="opay">📱 OPay Mobile Checkout</option>
                    <option value="moniepoint">🏦 Moniepoint Bank Account</option>
                    <option value="palmpay">💎 PalmPay Mobile Wallet</option>
                    <option value="bank">🏛 Direct Bank Transfer (Access, GTB, Zenith)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all"
                >
                  Pay ₦{parseFloat(depositAmount || "0").toLocaleString()} via {depositGateway}
                </button>

              </form>
            )}

          </div>
        </div>
      )}

      {/* Toast Notification popup */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl bg-slate-900 text-white p-4 shadow-2xl border border-slate-800 flex items-center gap-3 animate-fadeIn">
          <div className={`rounded-full p-1.5 ${toast.type === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
            {toast.type === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 text-xs font-semibold leading-relaxed">
            {toast.message}
          </div>
          <button 
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white text-xs px-1 cursor-pointer animate-pulse"
          >
            ✕
          </button>
        </div>
      )}

      {/* Persistent Footer */}
      <Footer 
        onNavigate={(view) => setCurrentView(view)} 
        platformName={settings.platformName}
        settings={settings}
      />

    </div>
  );
}
