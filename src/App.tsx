import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { resolvePath, pathToView } from "./lib/routes";
import BackButton from "./components/BackButton";
import { 
  User, 
  UserRole, 
  TaskCategory, 
  Transaction, 
  Announcement, 
  Banner, 
  WebsiteSettings,
  EarnerNotification
} from "./types";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import MobileBottomNav from "./components/MobileBottomNav";
import RouteProgressBar from "./components/RouteProgressBar";
import LoginPopupModal from "./components/LoginPopupModal";
import PublicPages from "./components/PublicPages";
import EarnerDashboard from "./components/EarnerDashboard";
import EarnerTaskSubmitPage from "./components/EarnerTaskSubmitPage";
import EarnerRejectedTasksPage from "./components/EarnerRejectedTasksPage";
import EarnerRejectedTaskResubmitPage from "./components/EarnerRejectedTaskResubmitPage";
import AdvertiserDashboard from "./components/AdvertiserDashboard";
import AdvertiserSubmissionReviewPage from "./components/AdvertiserSubmissionReviewPage";
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
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = pathToView(location.pathname);
  const setCurrentView = (view: string) => {
    const path = resolvePath(view);
    if (path) navigate(path);
  };

  // Always start every new page at the top of the viewport
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  // Public configurations
  const [banners, setBanners] = React.useState<Banner[]>([]);
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [pagesContent, setPagesContent] = React.useState<{ [key: string]: { title: string; content: string } }>({});
  const [publicStats, setPublicStats] = React.useState({
    earnersCount: 12485,
    tasksCount: 346,
    totalPaidOut: 3875560,
    latestWithdrawal: null as { userName: string; bankName: string; amount: number } | null,
    latestCampaign: null as { title: string; cost: number } | null
  });
  
  // Platform settings
  const [settings, setSettings] = React.useState<WebsiteSettings>({
    platformName: "TasksEarn",
    referralReward: 0,
    withdrawalFee: 50,
    minWithdrawal: 250,
    minDeposit: 100,
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

  // Earner notification state
  const [earnerNotifications, setEarnerNotifications] = React.useState<EarnerNotification[]>([]);
  const earnerUnreadCount = earnerNotifications.filter(n => !n.read).length;

  // Earner rejected tasks count (for mobile nav badge)
  const [rejectedTasksCount, setRejectedTasksCount] = React.useState(0);
  const earnerWsRef = React.useRef<WebSocket | null>(null);

  // Email Verification State
  const [verificationEmail, setVerificationEmail] = React.useState("");
  const [verificationCode, setVerificationCode] = React.useState("");
  const [verificationResent, setVerificationResent] = React.useState(false);

  // Admin-controlled login popup shown once per login to Earners/Advertisers
  const [loginPopup, setLoginPopup] = React.useState<Announcement | null>(null);

  const maybeShowLoginPopup = async (loggedInUser: User) => {
    if (loggedInUser.role === UserRole.ADMIN) return;
    try {
      const data = await apiFetch("/api/user/login-popup");
      if (data && data.announcement) setLoginPopup(data.announcement);
    } catch (e) {}
  };

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
  const [depositAmount, setDepositAmount] = React.useState("1000");
  const [depositError, setDepositError] = React.useState("");
  const openDeposit = (amount?: string) => {
    if (amount) setDepositAmount(amount);
    setDepositError("");
    setDepositOpen(true);
  };
  const [depositGateway, setDepositGateway] = React.useState("Paystack");
  const [depositProcessing, setDepositProcessing] = React.useState(false);
  const [depositSuccess, setDepositSuccess] = React.useState(false);

  // Paystack Redirect Verification State
  const [verifyingPayment, setVerifyingPayment] = React.useState(false);
  const [verificationStatus, setVerificationStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [verificationMessage, setVerificationMessage] = React.useState("");

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

      // Get public stats from database
      const s = await apiFetch("/api/public/stats");
      if (s && !s.error) {
        setPublicStats({
          earnersCount: s.earnersCount !== undefined ? s.earnersCount : 12485,
          tasksCount: s.tasksCount !== undefined ? s.tasksCount : 346,
          totalPaidOut: s.totalPaidOut !== undefined ? s.totalPaidOut : 3875560,
          latestWithdrawal: s.latestWithdrawal,
          latestCampaign: s.latestCampaign
        });
      }
    } catch (e) {}
  };

  const checkPaymentCallback = async () => {
    const urlObj = new URL(window.location.href);
    const hashParams = new URLSearchParams(urlObj.hash.replace("#", "?"));
    const queryParams = new URLSearchParams(urlObj.search);
    
    const paystackRef = queryParams.get("reference") || 
                        queryParams.get("trxref") || 
                        hashParams.get("paystack_ref") || 
                        hashParams.get("reference");

    if (paystackRef) {
      setVerifyingPayment(true);
      setVerificationStatus("loading");
      setVerificationMessage("Verifying secure transaction with Paystack... Please keep this page open.");
      
      try {
        const verifyRes = await apiFetch("/api/advertiser/deposit/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: paystackRef })
        });

        if (verifyRes && verifyRes.success) {
          setVerificationStatus("success");
          setVerificationMessage(`Deposit of ₦${(verifyRes.transaction?.amount || 0).toLocaleString()} successfully processed and credited!`);
          
          // Clear query params to prevent re-submitting
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          
          await refreshUserSession();
          setCurrentView("advertiser-dashboard");
          
          setTimeout(() => {
            setVerifyingPayment(false);
            setVerificationStatus("idle");
          }, 4000);
        } else {
          setVerificationStatus("error");
          setVerificationMessage(verifyRes?.error || "Transaction verification failed. Balance not updated.");
          
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } catch (err) {
        setVerificationStatus("error");
        setVerificationMessage("Unable to contact verification server. Please reload to try again.");
      }
    }
  };

  // Fetch unread earner notification count from API
  const fetchEarnerUnreadCount = async () => {
    try {
      const data = await apiFetch("/api/earner/notifications");
      if (Array.isArray(data)) {
        setEarnerNotifications(data as EarnerNotification[]);
      }
    } catch (e) {}
  };

  // Fetch rejected tasks count (for mobile nav badge)
  const fetchRejectedTasksCount = async () => {
    try {
      const data = await apiFetch("/api/earner/rejected-submissions");
      if (Array.isArray(data)) {
        setRejectedTasksCount(data.length);
      }
    } catch (e) {}
  };

  // Set up WebSocket for earner real-time notifications
  React.useEffect(() => {
    if (!user || user.role !== UserRole.EARNER) return;

    // Fetch current notifications and rejected tasks count on mount / login
    fetchEarnerUnreadCount();
    fetchRejectedTasksCount();

    // Register service worker for push notifications
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        console.log("[SW] Registered:", reg.scope);
        // Listen for navigate messages from service worker
        navigator.serviceWorker.addEventListener("message", (e) => {
          if (e.data?.type === "navigate" && e.data?.url) {
            const url: string = e.data.url;
            if (url.includes("/earner/")) {
              const section = url.split("/earner/")[1] || "notifications";
              setCurrentView("earner-" + section);
            }
          }
        });
      }).catch(() => {});

      // Request push notification permission
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }

    // Open WebSocket for real-time task notifications
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    earnerWsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "register-earner", userId: user.id }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "earner-new-task" && msg.notification) {
          const newNotif: EarnerNotification = {
            id: "ws-" + Date.now(),
            ...msg.notification,
            read: false
          };
          setEarnerNotifications(prev => [newNotif, ...prev]);

          // Show in-app toast
          showToast(`🔔 New task: ${msg.notification.taskTitle} — Earn ₦${msg.notification.reward?.toLocaleString()}`, "success");

          // Show browser push notification if permission granted
          if (Notification.permission === "granted") {
            new Notification("🔔 TasksEarn — New Task Available!", {
              body: msg.notification.message || `New task: ${msg.notification.taskTitle}`,
              tag: "te-new-task-" + msg.notification.taskId,
            });
          }
        }
      } catch (e) {}
    };

    ws.onerror = () => {};

    return () => {
      ws.close();
      earnerWsRef.current = null;
    };
  }, [user?.id]);

  React.useEffect(() => {
    const runStartup = async () => {
      // Check if there is a referral code in URL query (?ref=XYZ)
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get("ref");
      if (refCode) {
        setRegReferral(refCode);
        setCurrentView("register");
      }

      await checkSession();
      await loadPublicData();
      await checkPaymentCallback();
    };

    runStartup();
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
        const isAdvertiserView = currentView === "advertiser-login";
        const userRole = data.user.role;

        if (isAdvertiserView && userRole !== UserRole.ADVERTISER) {
          setAuthError("This account is not registered as an Advertiser. Please use the Earner login page.");
          setAuthLoading(false);
          return;
        }

        if (!isAdvertiserView && userRole === UserRole.ADVERTISER) {
          setAuthError("This account is registered as an Advertiser. Please use the Advertiser login page.");
          setAuthLoading(false);
          return;
        }

        localStorage.setItem("tasksearn_uid", data.user.id);
        setUser(data.user);
        maybeShowLoginPopup(data.user);
        
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
        maybeShowLoginPopup(data.user);
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

  // Real Paystack payment gateway billing process
  const triggerDepositPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < settings.minDeposit) {
      setDepositError(`Minimum deposit amount is ₦${settings.minDeposit.toLocaleString()}.`);
      return;
    }
    setDepositError("");

    setDepositProcessing(true);
    try {
      // 1. Initialize Paystack Transaction
      const initRes = await apiFetch("/api/advertiser/deposit/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });

      if (!initRes || initRes.error) {
        setDepositError(initRes?.error || "Failed to initialize payment transaction.");
        setDepositProcessing(false);
        return;
      }

      const { authorization_url } = initRes;

      if (authorization_url) {
        // Real environment: redirect to Paystack Checkout URL
        window.location.href = authorization_url;
      } else {
        setDepositError("Payment gateway did not return a valid checkout URL.");
        setDepositProcessing(false);
      }
    } catch (err) {
      setDepositError("Payment gateway connection failed. Please try again.");
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
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case "X (Twitter) Follow":
        return <Twitter className="h-5 w-5 text-gray-900" />;
      case "Website Visit":
        return <Globe className="h-5 w-5 text-indigo-600" />;
      case "App Download":
        return <Download className="h-5 w-5 text-blue-600" />;
      case "Survey":
        return <ClipboardCheck className="h-5 w-5 text-amber-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-blue-600" />;
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
    <div className="flex min-h-screen flex-col font-sans" style={{ background: isDarkMode ? "#0b1220" : "#FFFFFF", color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>

      {loginPopup && (
        <LoginPopupModal announcement={loginPopup} onClose={() => setLoginPopup(null)} />
      )}

      {/* Navigation Header */}
      <Navbar 
        user={user} 
        currentView={currentView} 
        onNavigate={(view) => setCurrentView(view)} 
        onLogout={handleLogout}
        onOpenDeposit={openDeposit}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        earnerUnreadCount={earnerUnreadCount}
      />

      {/* Route change loading indicator */}
      <RouteProgressBar />

      {/* Main Dynamic Content View Stage */}
      <main className={`flex-grow ${user ? "pb-16 md:pb-0" : ""}`}>

        <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeInOut" }}
        >
        <Routes location={location}>
        {/* PUBLIC HOME LANDING VIEW */}
        <Route path="/" element={
          <div className="space-y-16 pb-16">
            
            {/* Hero Section */}
            <section className="relative overflow-hidden hero-grid" style={{ background: isDarkMode ? "linear-gradient(180deg,#0b1220 0%,#0d1626 100%)" : "linear-gradient(180deg,#FFFFFF 0%,#e8f0ff 100%)", borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.06)" : "1.5px solid #E2E8F0", paddingTop: "5rem", paddingBottom: "6rem" }}>
              {/* Glow orbs */}
              <div className="glow-orb-blue" style={{ width: "500px", height: "500px", top: "-120px", left: "-100px", opacity: 0.6 }} />
              <div className="glow-orb-indigo" style={{ width: "400px", height: "400px", bottom: "-80px", right: "-60px", opacity: 0.5 }} />

              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                {/* Left Pitch */}
                <div className="space-y-7 max-w-xl">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold"
                    style={{ background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.20)", color: "#2563EB" }}
                  >
                    <Zap className="h-3.5 w-3.5" style={{ color: "#2563EB" }} />
                    Nigeria's Most Trusted Micro-Job Exchange
                  </span>

                  <h1
                    className="font-extrabold tracking-tight leading-tight"
                    style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.25rem,5vw,3.5rem)", color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                  >
                    Get Paid Weekly for{" "}
                    <span style={{ background: "linear-gradient(135deg,#2563EB,#2563EB)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                      Simple Tasks
                    </span>
                  </h1>

                  <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
                    Join over 12,000+ active Nigerians working from home. Earn wallet payouts instantly in Nigerian Naira (₦) for likes, subscribes, follows, reviews, and app downloads. Advertisers get 100% organic, verified growth.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <button
                      onClick={() => setCurrentView("register")}
                      className="rounded-full px-7 py-3.5 text-sm font-bold text-white text-center cursor-pointer transition-all active:scale-95"
                      style={{
                        background: "linear-gradient(135deg,#2563EB,#2563eb)",
                        boxShadow: "0 4px 20px rgba(37,99,235,0.40)"
                      }}
                    >
                      Sign Up &amp; Start Earning
                    </button>
                    <button
                      onClick={() => { setAuthRole(UserRole.ADVERTISER); setCurrentView("register"); }}
                      className="rounded-full px-7 py-3.5 text-sm font-bold text-center cursor-pointer transition-all"
                      style={{
                        background: isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,102,255,0.06)",
                        border: isDarkMode ? "1px solid rgba(255,255,255,0.12)" : "1.5px solid #DBEAFE",
                        color: isDarkMode ? "#cbd5e1" : "#1D4ED8"
                      }}
                    >
                      Promote My Business
                    </button>
                  </div>
                </div>

                {/* Right Hero — Live Ticker Card */}
                <div
                  className="relative rounded-2xl p-6 space-y-4"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 24px 60px rgba(37,99,235,0.12)"
                  }}
                >
                  {/* Top glow strip */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 rounded-full" style={{ background: "linear-gradient(90deg,transparent,rgba(37,99,235,0.40),transparent)" }} />

                  <div className="flex justify-between items-center pb-3" style={{ borderBottom: "1px solid #E2E8F0" }}>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#475569", fontFamily: "var(--font-mono)" }}>
                      Active Live Ticker
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full inline-block animate-pulse" style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
                      <span className="text-[10px] font-semibold" style={{ color: "#22c55e" }}>LIVE</span>
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div
                      className="rounded-xl p-3.5 flex justify-between items-center"
                      style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.12)" }}
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          {publicStats.latestWithdrawal
                            ? `${publicStats.latestWithdrawal.userName} (${publicStats.latestWithdrawal.bankName})`
                            : "Tunde Bakare (Guaranty Trust Bank)"}
                        </p>
                        <p className="mt-0.5" style={{ color: "#475569" }}>Withdrawal requested successfully</p>
                      </div>
                      <span className="font-mono font-black" style={{ color: "#2563EB" }}>
                        ₦{publicStats.latestWithdrawal ? publicStats.latestWithdrawal.amount.toLocaleString() : "7,450"}
                      </span>
                    </div>

                    <div
                      className="rounded-xl p-3.5 flex justify-between items-center"
                      style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.12)" }}
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          {publicStats.latestCampaign
                            ? `New Campaign: ${publicStats.latestCampaign.title}`
                            : "New Campaign: Telegram Group Join – Crypto Signals NG"}
                        </p>
                        <p className="mt-0.5" style={{ color: "#475569" }}>
                          {publicStats.latestCampaign
                            ? `Budget: ₦${publicStats.latestCampaign.cost.toLocaleString()} allocated`
                            : "Budget: ₦1,800 allocated"}
                        </p>
                      </div>
                      <span
                        className="rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase"
                        style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}
                      >
                        LIVE NOW
                      </span>
                    </div>
                  </div>

                  <div
                    className="grid grid-cols-3 gap-2 pt-4 text-center"
                    style={{ borderTop: "1px solid #E2E8F0", fontFamily: "var(--font-mono)" }}
                  >
                    {[
                      { val: publicStats.earnersCount > 0 ? publicStats.earnersCount.toLocaleString() : "0", label: "Earners" },
                      { val: publicStats.tasksCount > 0 ? publicStats.tasksCount.toLocaleString() : "0", label: "Campaigns" },
                      { val: `₦${publicStats.totalPaidOut > 0 ? (publicStats.totalPaidOut / 1000000).toFixed(1) + "M" : "0"}`, label: "Paid Out" },
                    ].map((s, i) => (
                      <div key={i}>
                        <p className="text-base font-black text-slate-900">{s.val}</p>
                        <p className="mt-0.5 text-[10px]" style={{ color: "#475569" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </section>

            {/* Banners Slider Carousels */}
            {banners.length > 0 && (
              <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-100 bg-white grid grid-cols-1 md:grid-cols-2">
                  <div className="p-8 sm:p-12 flex flex-col justify-center space-y-6 bg-gradient-to-br from-gray-900 to-indigo-950 text-white">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Active Promotion</span>
                    <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                      {banners[0].title}
                    </h2>
                    <p className="text-xs text-gray-300 leading-relaxed max-w-sm">
                      Work anywhere inside Nigeria. Do small social tasks on YouTube, TikTok, and Instagram and receive bank transfers immediately.
                    </p>
                    <button 
                      onClick={() => setCurrentView("register")}
                      className="rounded-xl bg-blue-500 hover:bg-blue-600 px-5 py-3 text-xs font-bold text-white uppercase self-start shadow-lg shadow-blue-950/50"
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
                <h2
                  className="font-bold tracking-tight text-slate-900 sm:text-3xl"
                  style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem,3vw,1.875rem)" }}
                >
                  Micro-Job Engagement Categories
                </h2>
                <p className="mt-2 text-xs" style={{ color: "#475569" }}>
                  Choose from thousands of fresh daily tasks matching your social media handles.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {getPublicCategories().map((cat, idx) => (
                  <div
                    key={idx}
                    className="group cursor-pointer transition-all"
                    onClick={() => setCurrentView("register")}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "1rem",
                      padding: "1.25rem",
                      boxShadow: "0 2px 12px rgba(37,99,235,0.06)"
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#2563EB";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(37,99,235,0.16)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#E2E8F0";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(37,99,235,0.06)";
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div
                        className="rounded-xl p-2.5"
                        style={{ background: "#DBEAFE", border: "1px solid #DBEAFE" }}
                      >
                        {getCategoryIcon(cat.title.substring(0, cat.title.length - 1))}
                      </div>
                      <span className="text-[10px] font-mono" style={{ color: "#94A3B8" }}>{cat.count}</span>
                    </div>
                    <h3
                      className="font-bold text-slate-900 mt-4"
                      style={{ fontFamily: "var(--font-display)", fontSize: "0.8125rem" }}
                    >
                      {cat.title}
                    </h3>
                    <p className="text-[11px] font-bold mt-1" style={{ fontFamily: "var(--font-mono)", color: "#2563EB" }}>
                      {cat.payout}
                    </p>
                    <div
                      className="mt-3 text-[10px] font-semibold flex items-center gap-1 justify-end transition-colors"
                      style={{ color: "#475569" }}
                    >
                      Claim Task <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* How It Works Timeline */}
            <section style={{ background: "#F8FAFC", borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0", padding: "5rem 0" }}>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="text-center">
                  <h2
                    className="font-bold tracking-tight text-slate-900 sm:text-3xl"
                    style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem,3vw,1.875rem)" }}
                  >
                    How TasksEarn Works
                  </h2>
                  <p className="mt-2 text-xs" style={{ color: "#475569" }}>Three simple steps to start earning Naira on our microtask network.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { n: "1", title: "Register Secure Account", desc: "Sign up as an Earner or Advertiser. Complete email validation in under 1 minute to unlock your dashboard." },
                    { n: "2", title: "Perform Social Actions", desc: "Follow accounts, subscribe to channels, join groups, or download apps. Upload a screenshot as proof." },
                    { n: "3", title: "Withdraw Naira (₦)", desc: "Get paid. Withdraw instantly to OPay, PalmPay, GTBank, Zenith, or any Nigerian bank account." },
                  ].map((step, i) => (
                    <div
                      key={i}
                      className="text-center space-y-4 rounded-2xl p-7"
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        boxShadow: "0 4px 24px rgba(37,99,235,0.08)"
                      }}
                    >
                      <div
                        className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl font-bold text-lg"
                        style={{
                          background: "#DBEAFE",
                          border: "1px solid #DBEAFE",
                          color: "#2563EB",
                          fontFamily: "var(--font-display)",
                          boxShadow: "0 4px 16px rgba(37,99,235,0.12)"
                        }}
                      >
                        {step.n}
                      </div>
                      <h3
                        className="font-bold text-slate-900"
                        style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem" }}
                      >
                        {step.title}
                      </h3>
                      <p className="text-xs max-w-xs mx-auto leading-relaxed" style={{ color: "#475569" }}>{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Bottom Call To Action Banner */}
            <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
              <div
                className="relative rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 overflow-hidden"
                style={{
                  background: "linear-gradient(135deg,#1d4ed8 0%,#1e3a8a 60%,#0f172a 100%)",
                  border: "1px solid rgba(96,165,250,0.25)",
                  boxShadow: "0 20px 60px rgba(29,78,216,0.35)"
                }}
              >
                {/* Decorative glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 rounded-full" style={{ background: "linear-gradient(90deg,transparent,rgba(96,165,250,0.60),transparent)" }} />
                <div className="glow-orb-blue" style={{ width: "300px", height: "300px", top: "-100px", right: "-80px", opacity: 0.4 }} />

                <h2
                  className="relative font-black tracking-tight sm:text-4xl"
                  style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem,4vw,2.5rem)" }}
                >
                  Ready to Monetize Your Spare Time?
                </h2>
                <p className="relative text-sm max-w-lg mx-auto leading-relaxed" style={{ color: "#93c5fd" }}>
                  Join our verified ecosystem of online earners. Advertisers can build custom campaign budgets starting at ₦1,000 only. Let's grow together!
                </p>
                <div className="relative pt-2 flex justify-center">
                  <button
                    onClick={() => setCurrentView("register")}
                    className="rounded-xl px-8 py-4 text-sm font-bold cursor-pointer transition-all active:scale-95"
                    style={{
                      background: "#ffffff",
                      color: "#1d4ed8",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.25)"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#eff6ff")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}
                  >
                    Create Free TasksEarn Account
                  </button>
                </div>
              </div>
            </section>

          </div>
        } />

        {/* AUTHENTICATION SECURE VIEW (LOGIN) */}
        <Route path="/login" element={
          <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
            <BackButton fallback="/" />
            <div className="rounded-2xl p-6 sm:p-8 space-y-6" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 12px 40px rgba(37,99,235,0.10)" }}>
              
              <div className="text-center">
                <h2 className="font-bold text-slate-900" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>Welcome Back to TasksEarn</h2>
                <p className="text-xs mt-1" style={{ color: "#64748b" }}>Sign in to your dashboard to complete tasks or fund campaigns.</p>
              </div>

              {authError && <p className="rounded-xl p-3 text-xs font-bold text-center" style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.20)", color: "#fb7185" }}>{authError}</p>}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email Address</label>
                  <input 
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. earner@tasksearn.com"
                    className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
                      className="text-xs text-blue-500 hover:text-blue-600 hover:underline font-semibold"
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
                    className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full rounded-full bg-blue-500 hover:bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition-all cursor-pointer"
                >
                  {authLoading ? "Decrypting Session..." : "Secure Sign In"}
                </button>
              </form>

              <div className="flex flex-col gap-3 text-center text-xs pt-4" style={{ borderTop: "1px solid #E2E8F0" }}>
                <div style={{ color: "#64748b" }}>
                  Don't have an account?{" "}
                  <button onClick={() => setCurrentView("register")} className="font-bold cursor-pointer" style={{ color: "#2563EB" }}>
                    Create one now
                  </button>
                </div>
                <div style={{ color: "#64748b" }}>
                  Are you an Advertiser?{" "}
                  <button onClick={() => { setAuthError(""); setCurrentView("advertiser-login"); }} className="font-bold cursor-pointer" style={{ color: "#2563EB" }}>
                    Go to Advertiser Portal
                  </button>
                </div>
              </div>

            </div>
          </div>
        } />

        {/* AUTHENTICATION SECURE VIEW (ADVERTISER LOGIN) */}
        <Route path="/advertiser-login" element={
          <div className="mx-auto max-w-md px-4 py-16 sm:py-24 animate-fadeIn">
            <BackButton fallback="/" />
            <div className="rounded-2xl p-6 sm:p-8 space-y-6" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 12px 40px rgba(37,99,235,0.10)" }}>
              
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase" style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.20)", color: "#818cf8" }}>
                  Advertiser Portal
                </span>
                <h2 className="font-bold text-slate-900 mt-2" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>Welcome Back, Advertiser!</h2>
                <p className="text-xs mt-1" style={{ color: "#64748b" }}>Sign in to manage your campaigns, track submissions, and check your ad budget.</p>
              </div>

              {authError && <p className="rounded-xl p-3 text-xs font-bold text-center" style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.20)", color: "#fb7185" }}>{authError}</p>}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Advertiser Email Address</label>
                  <input 
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. advertiser@company.com"
                    className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
                      className="text-xs text-blue-500 hover:text-blue-600 hover:underline font-semibold"
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
                    className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full rounded-full bg-blue-500 hover:bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition-all cursor-pointer"
                >
                  {authLoading ? "Decrypting Session..." : "Secure Sign In to Portal"}
                </button>
              </form>

              <div className="flex flex-col gap-2 text-center text-xs pt-4" style={{ borderTop: "1px solid #E2E8F0" }}>
                <div style={{ color: "#64748b" }}>
                  Not registered as an Advertiser?{" "}
                  <button onClick={() => { setAuthRole(UserRole.ADVERTISER); setCurrentView("register"); }} className="font-bold cursor-pointer" style={{ color: "#2563EB" }}>
                    Register here
                  </button>
                </div>
                <div style={{ color: "#64748b" }}>
                  Are you an Earner?{" "}
                  <button onClick={() => { setAuthError(""); setCurrentView("login"); }} className="font-bold cursor-pointer" style={{ color: "#2563EB" }}>
                    Go to Earner Sign In
                  </button>
                </div>
              </div>

            </div>
          </div>
        } />

        {/* AUTHENTICATION SECURE VIEW (FORGOT PASSWORD) */}
        <Route path="/forgot-password" element={
          <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
            <BackButton fallback="/login" />
            <div className="rounded-2xl p-6 sm:p-8 space-y-6" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 12px 40px rgba(37,99,235,0.10)" }}>
              
              <div className="text-center">
                <h2 className="font-bold text-slate-900" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>Account Recovery</h2>
                <p className="text-xs mt-1" style={{ color: "#64748b" }}>Enter your registered email address to receive password recovery instructions.</p>
              </div>

              {authError && <p className="rounded-xl p-3 text-xs font-bold text-center" style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.20)", color: "#fb7185" }}>{authError}</p>}
              
              {forgotSuccess ? (
                <div className="rounded-xl p-5 text-center space-y-3" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.20)" }}>
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "rgba(59,130,246,0.15)" }}>
                    <CheckCircle className="h-5 w-5" style={{ color: "#2563EB" }} />
                  </div>
                  <h3 className="font-bold text-slate-900" style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem" }}>Instructions Sent</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#1D4ED8" }}>
                    Check your email inbox for instructions to reset your secure credentials.
                  </p>
                  <div className="pt-2">
                    <button onClick={() => { setForgotSuccess(false); setCurrentView("login"); }}
                      className="text-xs font-bold cursor-pointer" style={{ color: "#2563EB" }}>
                      Return to Secure Sign In
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#64748b", letterSpacing: "0.06em" }}>Email Address</label>
                    <input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. yourname@example.com"
                      className="w-full rounded-xl px-4 py-2.5 text-sm"
                      style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#0F172A" }}
                    />
                  </div>
                  <button type="submit" disabled={authLoading}
                    className="w-full rounded-xl py-3 text-sm font-bold text-white cursor-pointer transition-all"
                    style={{ background: "linear-gradient(135deg,#2563EB,#2563eb)", boxShadow: "0 4px 16px rgba(37,99,235,0.30)" }}>
                    {authLoading ? "Verifying Registry..." : "Send Recovery Instructions"}
                  </button>
                </form>
              )}

              <div className="pt-4 text-center text-xs" style={{ borderTop: "1px solid #E2E8F0", color: "#64748b" }}>
                Remember your password?{" "}
                <button onClick={() => { setAuthError(""); setForgotSuccess(false); setCurrentView("login"); }}
                  className="font-bold cursor-pointer" style={{ color: "#2563EB" }}>
                  Sign In
                </button>
              </div>

            </div>
          </div>
        } />

        {/* AUTHENTICATION SECURE VIEW (REGISTER) */}
        <Route path="/register" element={
          <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
            <BackButton fallback="/" />
            <div className="rounded-2xl p-6 sm:p-8 space-y-6" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 12px 40px rgba(37,99,235,0.10)" }}>
              
              <div className="text-center">
                <h2 className="font-bold text-slate-900" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>Create Free Account</h2>
                <p className="text-xs mt-1" style={{ color: "#64748b" }}>Get certified, perform tasks, promote brand awareness.</p>
              </div>

              {/* Role Toggle */}
              <div className="grid grid-cols-2 gap-1.5 rounded-xl p-1" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <button type="button" onClick={() => setAuthRole(UserRole.EARNER)}
                  className="py-2 text-xs font-bold rounded-lg cursor-pointer transition-all"
                  style={authRole === UserRole.EARNER
                    ? { background: "linear-gradient(135deg,#2563EB,#2563eb)", color: "#fff", boxShadow: "0 2px 8px rgba(37,99,235,0.30)" }
                    : { color: "#64748b" }}>
                  Register as Earner
                </button>
                <button type="button" onClick={() => setAuthRole(UserRole.ADVERTISER)}
                  className="py-2 text-xs font-bold rounded-lg cursor-pointer transition-all"
                  style={authRole === UserRole.ADVERTISER
                    ? { background: "linear-gradient(135deg,#2563EB,#2563eb)", color: "#fff", boxShadow: "0 2px 8px rgba(37,99,235,0.30)" }
                    : { color: "#64748b" }}>
                  Register as Advertiser
                </button>
              </div>

              {authError && <p className="rounded-xl p-3 text-xs font-bold text-center" style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.20)", color: "#fb7185" }}>{authError}</p>}

              <form onSubmit={handleRegister} className="space-y-4">
                {[
                  { label: "Full Name (Legal Bank Name)", type: "text", val: regName, set: setRegName, ph: "e.g. Sola Bakare" },
                  { label: "Email Address", type: "email", val: regEmail, set: setRegEmail, ph: "e.g. sola@example.com" },
                  { label: "Security Password", type: "password", val: regPassword, set: setRegPassword, ph: "••••••••" },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#64748b", letterSpacing: "0.06em" }}>{f.label}</label>
                    <input type={f.type} required value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                      className="w-full rounded-xl px-4 py-2.5 text-sm"
                      style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#0F172A" }}
                    />
                  </div>
                ))}

                {authRole === UserRole.EARNER && (
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#64748b", letterSpacing: "0.06em" }}>Referral Code (Optional)</label>
                    <input type="text" value={regReferral} onChange={e => setRegReferral(e.target.value)} placeholder="e.g. TUNDE887"
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-mono text-center uppercase tracking-wider"
                      style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#0F172A" }}
                    />
                  </div>
                )}

                <button type="submit" disabled={authLoading}
                  className="w-full rounded-xl py-3 text-sm font-bold text-white cursor-pointer transition-all"
                  style={{ background: "linear-gradient(135deg,#2563EB,#2563eb)", boxShadow: "0 4px 16px rgba(37,99,235,0.30)" }}>
                  {authLoading ? "Initializing Encrypted Vault..." : "Create Account"}
                </button>
              </form>

              <div className="pt-4 text-center text-xs" style={{ borderTop: "1px solid #E2E8F0", color: "#64748b" }}>
                Already registered?{" "}
                <button onClick={() => setCurrentView("login")} className="font-bold cursor-pointer" style={{ color: "#2563EB" }}>
                  Sign In
                </button>
              </div>

            </div>
          </div>
        } />

        {/* AUTHENTICATION SECURE VIEW (EMAIL VERIFICATION) */}
        <Route path="/verify-email" element={
          <div className="mx-auto max-w-md px-4 py-16 sm:py-24 animate-fadeIn">
            <BackButton fallback="/login" />
            <div className="rounded-2xl p-6 sm:p-8 space-y-6" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 12px 40px rgba(37,99,235,0.10)" }}>
              
              <div className="text-center space-y-3">
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", boxShadow: "0 0 20px rgba(59,130,246,0.15)" }}
                >
                  <ShieldCheck className="h-6 w-6" style={{ color: "#2563EB" }} />
                </div>
                <h2 className="font-bold text-slate-900" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>Email Verification Required</h2>
                <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                  A secure 6-digit code has been sent to{" "}
                  <span className="font-semibold text-slate-900">{verificationEmail}</span>.
                  Enter it below.
                </p>
              </div>

              {authError && (
                <p className="rounded-xl p-3 text-xs font-bold text-center" style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.20)", color: "#fb7185" }}>
                  {authError}
                </p>
              )}

              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1.5 text-center" style={{ color: "#64748b", letterSpacing: "0.06em" }}>6-Digit Verification Code</label>
                  <input
                    type="text" required maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest"
                    style={{ background: "#F8FAFC", border: "1px solid #DBEAFE", color: "#2563EB", letterSpacing: "0.35em" }}
                  />
                </div>
                <button type="submit" disabled={authLoading}
                  className="w-full rounded-xl py-3 text-sm font-bold text-white cursor-pointer transition-all"
                  style={{ background: "linear-gradient(135deg,#2563EB,#2563eb)", boxShadow: "0 4px 16px rgba(37,99,235,0.30)" }}>
                  {authLoading ? "Validating Credentials..." : "Verify Code & Log In"}
                </button>
              </form>

              <div className="flex flex-col gap-3 text-center text-xs pt-4" style={{ borderTop: "1px solid #E2E8F0" }}>
                <p style={{ color: "#64748b" }}>
                  Didn't receive the email?{" "}
                  <button onClick={handleResendCode} disabled={verificationResent}
                    className={`font-bold cursor-pointer ${verificationResent ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={{ color: "#2563EB" }}>
                    {verificationResent ? "Code Resent ✓" : "Resend Verification Code"}
                  </button>
                </p>
                <button
                  onClick={() => { setAuthError(""); setVerificationEmail(""); setVerificationCode(""); setVerificationResent(false); setCurrentView("login"); }}
                  className="font-semibold cursor-pointer transition-colors" style={{ color: "#475569" }}>
                  Return to Secure Sign In
                </button>
              </div>

            </div>
          </div>
        } />

        {/* CMS STATIC AND REGULATORY PAGES */}
        <Route path="/about" element={<><BackButton fallback="/" /><PublicPages view="about" pagesContent={pagesContent} settings={settings} /></>} />
        <Route path="/faq" element={<><BackButton fallback="/" /><PublicPages view="faq" pagesContent={pagesContent} settings={settings} /></>} />
        <Route path="/contact" element={<><BackButton fallback="/" /><PublicPages view="contact" pagesContent={pagesContent} settings={settings} /></>} />
        <Route path="/terms" element={<><BackButton fallback="/" /><PublicPages view="terms" pagesContent={pagesContent} settings={settings} /></>} />
        <Route path="/privacy" element={<><BackButton fallback="/" /><PublicPages view="privacy" pagesContent={pagesContent} settings={settings} /></>} />

        {/* ROLE PROTECTED: EARNER FIX & RESUBMIT PAGE (must be before /earner/:section) */}
        <Route path="/earner/rejected/:submissionId" element={
          user && user.role === UserRole.EARNER ? (
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <EarnerRejectedTaskResubmitPage apiFetch={apiFetch} showToast={showToast} />
            </div>
          ) : (<Navigate to="/login" replace />)
        } />
        {/* NOTE: /earner/rejected (list) is intentionally NOT a separate route.
            It falls through to /earner/:section below so EarnerDashboard renders
            the "rejected" tab within the dashboard layout (sidebar + nav intact).
            The standalone EarnerRejectedTasksPage is kept as a component but is
            no longer routed — all rejected-list UI lives inside the dashboard. */}

        {/* ROLE PROTECTED: EARNER TASK SUBMISSION PAGE (must be before /earner/:section) */}
        <Route path="/earner/tasks/:taskId/submit" element={
          user && user.role === UserRole.EARNER ? (
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <EarnerTaskSubmitPage apiFetch={apiFetch} showToast={showToast} />
            </div>
          ) : (<Navigate to="/login" replace />)
        } />

        {/* ROLE PROTECTED: EARNER DASHBOARD PANELS */}
        <Route path="/earner/:section" element={
          user && user.role === UserRole.EARNER ? (
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <EarnerDashboard 
                user={user} 
                onRefreshUser={refreshUserSession}
                onNavigate={(view) => setCurrentView(view)}
                apiFetch={apiFetch}
                showToast={showToast}
                earnerNotifications={earnerNotifications}
                onMarkNotificationRead={(id) => {
                  apiFetch(`/api/earner/notifications/${id}/read`, { method: "POST" }).catch(() => {});
                  setEarnerNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
                }}
                onMarkAllNotificationsRead={() => {
                  apiFetch("/api/earner/notifications/read-all", { method: "POST" }).catch(() => {});
                  setEarnerNotifications(prev => prev.map(n => ({ ...n, read: true })));
                }}
              />
            </div>
          ) : (<Navigate to="/login" replace />)
        } />
        <Route path="/earner" element={<Navigate to="/earner/overview" replace />} />

        {/* ROLE PROTECTED: ADVERTISER SUBMISSION REVIEW PAGE (must be before /advertiser/:section) */}
        <Route path="/advertiser/audit/:submissionId" element={
          user && user.role === UserRole.ADVERTISER ? (
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <AdvertiserSubmissionReviewPage apiFetch={apiFetch} showToast={showToast} />
            </div>
          ) : (<Navigate to="/advertiser-login" replace />)
        } />

        {/* ROLE PROTECTED: ADVERTISER DASHBOARD PANELS */}
        <Route path="/advertiser/:section" element={
          user && user.role === UserRole.ADVERTISER ? (
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <AdvertiserDashboard 
                user={user} 
                onRefreshUser={refreshUserSession}
                onNavigate={(view) => setCurrentView(view)}
                onOpenDeposit={openDeposit}
                apiFetch={apiFetch}
                settings={settings}
              />
            </div>
          ) : (<Navigate to="/advertiser-login" replace />)
        } />
        <Route path="/advertiser" element={<Navigate to="/advertiser/overview" replace />} />

        {/* ROLE PROTECTED: ADMIN PANEL */}
        <Route path="/admin/:section" element={
          user && user.role === UserRole.ADMIN ? (
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <AdminDashboard 
                user={user} 
                onRefreshUser={refreshUserSession}
                apiFetch={apiFetch}
              />
            </div>
          ) : (<Navigate to="/login" replace />)
        } />
        <Route path="/admin" element={<Navigate to="/admin/stats" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </motion.div>
        </AnimatePresence>

      </main>

      {/* Real Paystack Payment Checkout Popup */}
      {depositOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" style={{ background: "rgba(7,13,26,0.85)", backdropFilter: "blur(12px)" }}>
          <div
            className="w-full max-w-sm rounded-2xl p-6 relative overflow-hidden space-y-5"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              boxShadow: "0 40px 80px rgba(15,23,42,0.25)"
            }}
          >
            {/* Top glow strip */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 rounded-full" style={{ background: "linear-gradient(90deg,transparent,rgba(37,99,235,0.50),transparent)" }} />

            <div className="flex justify-between items-start">
              <div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold"
                  style={{ background: "#DBEAFE", border: "1px solid #DBEAFE", color: "#2563EB" }}
                >
                  Official Gateway
                </span>
                <h3
                  className="font-bold text-slate-900 mt-1"
                  style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}
                >
                  Fund Advertiser Wallet
                </h3>
              </div>
              <button
                onClick={() => { if (!depositProcessing) setDepositOpen(false); }}
                className="rounded-full p-1.5 cursor-pointer transition-colors"
                style={{ background: "#F8FAFC", color: "#64748b", border: "1px solid #E2E8F0" }}
                disabled={depositProcessing}
              >
                ✕
              </button>
            </div>

            {depositProcessing ? (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4" style={{ borderColor: "rgba(37,99,235,0.20)", borderTopColor: "#2563EB" }} />
                <div>
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Contacting Paystack...</p>
                  <p className="text-[10px] mt-1 font-semibold" style={{ color: "#475569" }}>Opening secure Paystack checkout portal...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={triggerDepositPayment} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ color: "#475569", letterSpacing: "0.07em" }}>Payment Method</label>
                  <div
                    className="rounded-xl p-3 text-xs flex items-center gap-2"
                    style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.15)" }}
                  >
                    <span className="text-lg">🇳🇬</span>
                    <div>
                      <p className="font-bold text-slate-900">Paystack Secure Checkout</p>
                      <p className="text-[10px]" style={{ color: "#2563EB" }}>Supports Cards, Bank Transfer, USSD &amp; more</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ color: "#475569", letterSpacing: "0.07em" }}>Fund Amount (Naira ₦)</label>
                  <input
                    type="number" required min={settings.minDeposit}
                    value={depositAmount}
                    onChange={(e) => { setDepositAmount(e.target.value); setDepositError(""); }}
                    placeholder={`Min: ₦${settings.minDeposit.toLocaleString()}`}
                    className="w-full rounded-xl px-3 py-2 text-sm font-mono"
                    style={{
                      background: "#FFFFFF",
                      border: `1px solid ${depositError ? "#EF4444" : "#E2E8F0"}`,
                      color: "#0F172A"
                    }}
                  />
                  {depositError ? (
                    <span className="block text-[10px] mt-1 font-semibold" style={{ color: "#EF4444" }}>
                      {depositError}
                    </span>
                  ) : (
                    <span className="block text-[10px] mt-1" style={{ color: "#374151" }}>
                      Minimum deposit: ₦{settings.minDeposit.toLocaleString()}
                    </span>
                  )}
                </div>

                <div
                  className="text-[10px] leading-relaxed font-medium rounded-lg p-2.5"
                  style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", color: "#fbbf24" }}
                >
                  ⚠️ <strong>Notice:</strong> You will be redirected to Paystack. Do not close the payment window until redirection completes.
                </div>

                <button
                  type="submit"
                  disabled={isNaN(parseFloat(depositAmount)) || parseFloat(depositAmount) < settings.minDeposit}
                  className="w-full rounded-xl py-3 text-xs font-bold text-white transition-all"
                  style={{
                    background: (isNaN(parseFloat(depositAmount)) || parseFloat(depositAmount) < settings.minDeposit)
                      ? "#94A3B8"
                      : "linear-gradient(135deg,#2563EB,#2563eb)",
                    boxShadow: (isNaN(parseFloat(depositAmount)) || parseFloat(depositAmount) < settings.minDeposit)
                      ? "none"
                      : "0 4px 16px rgba(37,99,235,0.30)",
                    cursor: (isNaN(parseFloat(depositAmount)) || parseFloat(depositAmount) < settings.minDeposit)
                      ? "not-allowed"
                      : "pointer"
                  }}
                >
                  Pay ₦{parseFloat(depositAmount || "0").toLocaleString()} via Paystack
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Global Paystack Verification Overlay */}
      {verifyingPayment && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn text-white">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center space-y-6 shadow-2xl">
            {verificationStatus === "loading" ? (
              <div className="space-y-4">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
                <h3 className="font-display text-base font-bold text-slate-100">Verifying Deposit</h3>
                <p className="text-xs text-slate-400">{verificationMessage}</p>
              </div>
            ) : verificationStatus === "success" ? (
              <div className="space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                  <CheckCircle className="h-6 w-6 animate-pulse" />
                </div>
                <h3 className="font-display text-base font-bold text-blue-400">Verification Successful</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">{verificationMessage}</p>
                <button
                  onClick={() => {
                    setVerifyingPayment(false);
                    setVerificationStatus("idle");
                  }}
                  className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 text-slate-950 py-2.5 text-xs font-bold transition-all cursor-pointer"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="font-display text-base font-bold text-rose-400">Verification Failed</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">{verificationMessage}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setVerifyingPayment(false);
                      setVerificationStatus("idle");
                    }}
                    className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      checkPaymentCallback();
                    }}
                    className="flex-1 rounded-xl bg-blue-500 hover:bg-blue-600 text-slate-950 py-2.5 text-xs font-bold transition-all cursor-pointer"
                  >
                    Retry Verification
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification popup */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl bg-slate-900 text-white p-4 shadow-2xl border border-slate-800 flex items-center gap-3 animate-fadeIn">
          <div className={`rounded-full p-1.5 ${toast.type === "success" ? "bg-blue-500/20 text-blue-400" : "bg-rose-500/20 text-rose-400"}`}>
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

      {/* Mobile-only fixed bottom navigation for logged-in dashboards */}
      <MobileBottomNav user={user} isDarkMode={isDarkMode} earnerUnreadCount={earnerUnreadCount} rejectedTasksCount={rejectedTasksCount} />

    </div>
  );
}
