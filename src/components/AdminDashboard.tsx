import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  User, 
  Task, 
  TaskSubmission, 
  Transaction, 
  Referral, 
  Announcement, 
  Banner, 
  WebsiteSettings, 
  UserRole, 
  SubmissionStatus, 
  TransactionStatus, 
  TaskStatus,
  AdminNotification
} from "../types";
import PlatformIcon from "./PlatformIcon";
import { 
  LayoutGrid, 
  Users, 
  Briefcase, 
  CreditCard, 
  Megaphone, 
  Image as ImageIcon, 
  FileEdit, 
  Settings, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Check, 
  X, 
  ShieldAlert, 
  BadgePercent, 
  FolderSync, 
  Eye, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Percent,
  Bell,
  BellRing,
  CheckCheck,
  Clock,
  Coins,
  Share2,
  Trash2,
  PlusCircle,
  Pencil,
  ListTodo,
  Search,
  Ban,
  ShieldCheck,
  UserX,
  UserCircle2,
  ChevronDown,
  Mail,
  Send,
  MailCheck,
  MailX,
  RefreshCw,
  History
} from "lucide-react";
import AdminTaskPricing from "./AdminTaskPricing";
import AdminSocialPlatforms from "./AdminSocialPlatforms";
import { ColorMode } from "../lib/themes";


interface AdminDashboardProps {
  user: User;
  onRefreshUser: () => void;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
  isDarkMode?: boolean;
  colorMode?: ColorMode;
}

export default function AdminDashboard({ user, onRefreshUser, apiFetch, isDarkMode = false, colorMode = "light" }: AdminDashboardProps) {
  type AdminTab = "stats" | "users" | "advertisers" | "campaigns" | "admin-tasks" | "withdrawals" | "audits" | "announcements" | "cms" | "settings" | "pricing" | "platforms" | "platform-earnings" | "commissions" | "notifications" | "reports" | "profile" | "demo-accounts" | "broadcast";
  const VALID_ADMIN_TABS: AdminTab[] = ["stats", "users", "advertisers", "campaigns", "admin-tasks", "withdrawals", "audits", "announcements", "cms", "settings", "pricing", "platforms", "platform-earnings", "commissions", "notifications", "reports", "profile", "demo-accounts", "broadcast"];
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const activeTab: AdminTab = (VALID_ADMIN_TABS.includes(section as AdminTab) ? section : "stats") as AdminTab;
  const setActiveTab = (tab: AdminTab) => navigate(`/admin/${tab}`);

  // Demo account state (admin-only)
  const [demoError, setDemoError] = React.useState("");
  const [demoLoading, setDemoLoading] = React.useState(false);
  const [showEarnerPwd, setShowEarnerPwd] = React.useState(false);
  const [earnerPwd, setEarnerPwd] = React.useState("");
  const [showAdvertiserPwd, setShowAdvertiserPwd] = React.useState(false);
  const [advertiserPwd, setAdvertiserPwd] = React.useState("");
  const [showAdminPwd, setShowAdminPwd] = React.useState(false);
  const [adminPwd, setAdminPwd] = React.useState("");

  const handleAdminDemoLogin = async (email: string, password: string) => {
    if (!password.trim()) return;
    setDemoLoading(true);
    setDemoError("");
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (data && data.error) {
        setDemoError(data.error === "INVALID_CREDENTIALS" ? "Incorrect password." : data.error);
      } else if (data && data.user) {
        localStorage.setItem("tasksearn_uid", data.user.id);
        // Navigate to the appropriate dashboard and reload so App.tsx re-reads the session
        const dest = data.user.role === "Advertiser" ? "/advertiser/overview"
                   : data.user.role === "Admin" ? "/admin/stats"
                   : "/earner/dashboard";
        window.location.href = dest;
      }
    } catch {
      setDemoError("Login failed. Please try again.");
    } finally {
      setDemoLoading(false);
    }
  };

  // Admin states
  const [stats, setStats] = React.useState({
    earnersCount: 0,
    advertisersCount: 0,
    tasksCount: 0,
    totalEarned: 0,
    pendingWithdrawals: 0,
    totalDeposited: 0
  });

  // Owner earnings states
  const [platformStats, setPlatformStats] = React.useState({
    lifetimeRevenue: 0,
    totalPlatformRevenue: 0,
    todayRevenue: 0,
    thisMonthRevenue: 0,
    totalWithdrawn: 0,
    pendingWithdrawalAmount: 0,
    availableBalance: 0,
    // Commission breakdown
    totalActivationFees: 0,
    totalCommission: 0,
    totalWithdrawalFees: 0,
    activatedEarnersCount: 0
  });
  const [ownerBankAccounts, setOwnerBankAccounts] = React.useState<any[]>([]);
  const [ownerWithdrawals, setOwnerWithdrawals] = React.useState<any[]>([]);
  
  // Bank Form State
  const [showBankForm, setShowBankForm] = React.useState(false);
  const [editingBankAccount, setEditingBankAccount] = React.useState<any | null>(null);
  const [bankNameInput, setBankNameInput] = React.useState("");
  const [bankAccountNumberInput, setBankAccountNumberInput] = React.useState("");
  const [bankAccountNameInput, setBankAccountNameInput] = React.useState("");
  const [bankIsDefaultInput, setBankIsDefaultInput] = React.useState(false);
  const [bankFormError, setBankFormError] = React.useState("");
  const [bankFormSuccess, setBankFormSuccess] = React.useState("");

  // Withdrawal Form State
  const [showWithdrawForm, setShowWithdrawForm] = React.useState(false);
  const [withdrawAmountInput, setWithdrawAmountInput] = React.useState("");
  const [selectedBankId, setSelectedBankId] = React.useState("");
  const [withdrawError, setWithdrawError] = React.useState("");
  const [withdrawSuccess, setWithdrawSuccess] = React.useState("");

  // Bank dropdown and verification states
  const [banksList, setBanksList] = React.useState<{ name: string; code: string }[]>([]);
  const [withdrawBankCode, setWithdrawBankCode] = React.useState("");
  const [withdrawBankName, setWithdrawBankName] = React.useState("");
  const [withdrawAccountNumber, setWithdrawAccountNumber] = React.useState("");
  const [withdrawAccountName, setWithdrawAccountName] = React.useState("");
  const [isVerifyingBank, setIsVerifyingBank] = React.useState(false);
  const [isBankVerified, setIsBankVerified] = React.useState(false);
  const [bankVerificationError, setBankVerificationError] = React.useState("");

  const [usersList, setUsersList] = React.useState<any[]>([]);
  const [campaignsList, setCampaignsList] = React.useState<Task[]>([]);
  const [withdrawalsList, setWithdrawalsList] = React.useState<Transaction[]>([]);

  // Withdrawal management state
  const [rejectingWithdrawal, setRejectingWithdrawal] = React.useState<Transaction | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [withdrawalActionLoading, setWithdrawalActionLoading] = React.useState<string | null>(null);
  const [withdrawalActionMsg, setWithdrawalActionMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submissionsList, setSubmissionsList] = React.useState<TaskSubmission[]>([]);
  const [depositsList, setDepositsList] = React.useState<Transaction[]>([]);
  const [referralsList, setReferralsList] = React.useState<Referral[]>([]);
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [banners, setBanners] = React.useState<Banner[]>([]);
  
  // Real-Time Notification System States
  const [notifications, setNotifications] = React.useState<AdminNotification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = React.useState(false);
  const notifContainerRef = React.useRef<HTMLDivElement>(null);
  const [activeToast, setActiveToast] = React.useState<AdminNotification | null>(null);
  
  // CMS Content State
  const [pagesCMS, setPagesCMS] = React.useState<{ [key: string]: { title: string; content: string } }>({});
  const [selectedCMSPage, setSelectedCMSPage] = React.useState<string>("about");
  const [cmsPageTitle, setCmsPageTitle] = React.useState("");
  const [cmsPageContent, setCmsPageContent] = React.useState("");
  const [cmsSuccess, setCmsSuccess] = React.useState("");

  // Platform settings
  const [settings, setSettings] = React.useState<WebsiteSettings>({
    platformName: "TasksEarn",
    referralReward: 0,
    withdrawalFee: 50,
    minWithdrawal: 200,
    minDeposit: 100,
    contactEmail: "support@tasksearn.com",
    contactPhone: "09164444315",
    whatsappGroup: "https://wa.me/2349164444315"
  });
  const [settingsSuccess, setSettingsSuccess] = React.useState("");

  // Adjust Balance Prompt box
  const [selectedUserForBalance, setSelectedUserForBalance] = React.useState<any | null>(null);
  const [adjustBalanceAmount, setAdjustBalanceAmount] = React.useState("");

  // User Management — search, filter, profile view, delete confirm
  const [userSearch, setUserSearch] = React.useState("");
  const [userRoleFilter, setUserRoleFilter] = React.useState<"All" | "Earner" | "Advertiser">("All");
  const [userStatusFilter, setUserStatusFilter] = React.useState<"All" | "Active" | "Banned">("All");
  const [viewingUser, setViewingUser] = React.useState<any | null>(null);
  const [deletingUser, setDeletingUser] = React.useState<any | null>(null);
  const [userActionLoading, setUserActionLoading] = React.useState<string | null>(null);
  const [userActionMsg, setUserActionMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Announcement state
  const [annTitle, setAnnTitle] = React.useState("");
  const [annContent, setAnnContent] = React.useState("");
  const [annType, setAnnType] = React.useState<"info" | "success" | "warning">("info");
  const [annDismissible, setAnnDismissible] = React.useState(true);
  const [annLinkUrl, setAnnLinkUrl] = React.useState("");
  const [annButtonText, setAnnButtonText] = React.useState("");
  const [annEditingId, setAnnEditingId] = React.useState<string | null>(null);
  const [annSuccess, setAnnSuccess] = React.useState("");
  const [annError, setAnnError] = React.useState("");

  // Banner state
  const [banTitle, setBanTitle] = React.useState("");
  const [banImage, setBanImage] = React.useState("");
  const [banLink, setBanLink] = React.useState("");
  const [banSuccess, setBanSuccess] = React.useState("");

  // Audit Center Filters & Interaction state
  const [auditFilter, setAuditFilter] = React.useState<string>("All"); // "All", "Pending", "Approved", "Rejected"
  const [auditSearch, setAuditSearch] = React.useState<string>("");
  const [rejectingSubId, setRejectingSubId] = React.useState<string | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = React.useState<string>("");

  // Commission ledger state
  const [commissionsList, setCommissionsList] = React.useState<any[]>([]);
  const [commissionFilter, setCommissionFilter] = React.useState<string>("all");

  // Admin Tasks state
  const [adminTasksList, setAdminTasksList] = React.useState<Task[]>([]);
  const [showAdminTaskForm, setShowAdminTaskForm] = React.useState(false);
  const [editingAdminTask, setEditingAdminTask] = React.useState<Task | null>(null);
  const [adminTaskTitle, setAdminTaskTitle] = React.useState("");
  const [adminTaskDescription, setAdminTaskDescription] = React.useState("");
  const [adminTaskCategory, setAdminTaskCategory] = React.useState("");
  const [adminTaskProofReq, setAdminTaskProofReq] = React.useState("");
  const [adminTaskLink, setAdminTaskLink] = React.useState("");
  const [adminTaskSlots, setAdminTaskSlots] = React.useState("");
  const [adminTaskReward, setAdminTaskReward] = React.useState("");
  const [adminTaskFormError, setAdminTaskFormError] = React.useState("");
  const [adminTaskFormSuccess, setAdminTaskFormSuccess] = React.useState("");
  const [adminTaskSubmitting, setAdminTaskSubmitting] = React.useState(false);

  // Broadcast Email state
  const [broadcastTarget, setBroadcastTarget] = React.useState<"earners" | "advertisers" | "all" | "selected">("earners");
  const [broadcastSubject, setBroadcastSubject] = React.useState("");
  const [broadcastHtml, setBroadcastHtml] = React.useState("");
  const [broadcastSending, setBroadcastSending] = React.useState(false);
  const [broadcastResult, setBroadcastResult] = React.useState<{ totalRecipients: number; sentCount: number; failedCount: number; failedEmails: { email: string; reason: string }[] } | null>(null);
  const [broadcastError, setBroadcastError] = React.useState("");
  const [broadcastLogs, setBroadcastLogs] = React.useState<any[]>([]);
  const [broadcastLogsLoading, setBroadcastLogsLoading] = React.useState(false);
  const [broadcastSelectedUsers, setBroadcastSelectedUsers] = React.useState<string[]>([]);
  const [broadcastUserSearch, setBroadcastUserSearch] = React.useState("");
  const [showBroadcastHistory, setShowBroadcastHistory] = React.useState(false);

  const fetchBroadcastLogs = async () => {
    setBroadcastLogsLoading(true);
    try {
      const data = await apiFetch("/api/admin/broadcast-email/logs");
      if (Array.isArray(data)) setBroadcastLogs(data);
    } catch (e) {} finally {
      setBroadcastLogsLoading(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastHtml.trim()) {
      setBroadcastError("Subject and email body are required.");
      return;
    }
    if (broadcastTarget === "selected" && broadcastSelectedUsers.length === 0) {
      setBroadcastError("Please select at least one user.");
      return;
    }
    setBroadcastSending(true);
    setBroadcastError("");
    setBroadcastResult(null);
    try {
      const data = await apiFetch("/api/admin/broadcast-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: broadcastTarget,
          userIds: broadcastTarget === "selected" ? broadcastSelectedUsers : undefined,
          subject: broadcastSubject,
          html: broadcastHtml,
        }),
      });
      if (data.error) {
        setBroadcastError(data.error);
      } else {
        setBroadcastResult(data);
        fetchBroadcastLogs();
      }
    } catch {
      setBroadcastError("Failed to send broadcast. Please try again.");
    } finally {
      setBroadcastSending(false);
    }
  };

  const fetchPlatformStats = async () => {
    try {
      const data = await apiFetch("/api/admin/owner-earnings/stats");
      if (data && !data.error) {
        setPlatformStats(data);
      }
    } catch (e) {}
  };

  const fetchCommissions = async () => {
    try {
      const data = await apiFetch("/api/admin/commissions");
      if (Array.isArray(data)) setCommissionsList(data);
    } catch (e) {}
  };

  const fetchOwnerBankAccounts = async () => {
    try {
      const data = await apiFetch("/api/admin/owner-earnings/bank-accounts");
      if (data && !data.error) {
        setOwnerBankAccounts(data);
        const defaultAcc = data.find((ba: any) => ba.isDefault);
        if (defaultAcc) {
          setSelectedBankId(defaultAcc.id);
        } else if (data.length > 0) {
          setSelectedBankId(data[0].id);
        }
      }
    } catch (e) {}
  };

  const fetchOwnerWithdrawals = async () => {
    try {
      const data = await apiFetch("/api/admin/owner-earnings/withdrawals");
      if (data && !data.error) {
        setOwnerWithdrawals(data);
      }
    } catch (e) {}
  };

  const fetchBanksList = async () => {
    try {
      const data = await apiFetch("/api/admin/owner-earnings/banks");
      if (data && !data.error) {
        setBanksList(data);
      }
    } catch (e) {}
  };

  const handleVerifyBankAccount = async () => {
    setBankVerificationError("");
    setWithdrawAccountName("");
    setIsBankVerified(false);

    if (!withdrawBankCode) {
      setBankVerificationError("Please select a bank from the list.");
      return;
    }
    if (!withdrawAccountNumber || withdrawAccountNumber.length !== 10 || !/^\d+$/.test(withdrawAccountNumber)) {
      setBankVerificationError("Please enter a valid 10-digit account number.");
      return;
    }

    setIsVerifyingBank(true);
    try {
      const res = await apiFetch("/api/admin/owner-earnings/resolve-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNumber: withdrawAccountNumber,
          bankCode: withdrawBankCode,
          bankName: withdrawBankName
        })
      });

      if (res && res.success) {
        setWithdrawAccountName(res.accountName);
        setIsBankVerified(true);
      } else {
        setBankVerificationError(res?.error || "Account verification failed. Please check details.");
      }
    } catch (err) {
      setBankVerificationError("Failed to connect to verification service.");
    } finally {
      setIsVerifyingBank(false);
    }
  };

  // Fetch admin dashboard details
  const fetchStats = async () => {
    try {
      const data = await apiFetch("/api/admin/dashboard");
      if (data && !data.error) {
        setStats({
          earnersCount: data.earnersCount,
          advertisersCount: data.advertisersCount,
          tasksCount: data.tasksCount,
          totalEarned: data.totalEarned,
          pendingWithdrawals: data.pendingWithdrawals,
          totalDeposited: data.totalDeposited
        });
        if (data.settings) setSettings(data.settings);
      }
    } catch (e) {}
    fetchPlatformStats();
  };

  const [resettingDepositStat, setResettingDepositStat] = React.useState(false);
  const [depositStatResetMsg, setDepositStatResetMsg] = React.useState("");
  const handleResetDepositStat = async () => {
    if (!window.confirm("Reset the Total Advertiser Deposits dashboard figure to ₦0.00?\n\nThis only clears the displayed statistic — it does NOT delete deposit transaction history, modify advertiser accounts, or change any wallet balances.")) {
      return;
    }
    setResettingDepositStat(true);
    setDepositStatResetMsg("");
    try {
      const data = await apiFetch("/api/admin/reset-deposit-stat", { method: "POST" });
      if (data && !data.error) {
        setStats((prev) => ({ ...prev, totalDeposited: 0 }));
        setDepositStatResetMsg("Total Advertiser Deposits reset to ₦0.00.");
      } else {
        setDepositStatResetMsg(data?.error || "Failed to reset.");
      }
    } catch (e) {
      setDepositStatResetMsg("Failed to reset.");
    } finally {
      setResettingDepositStat(false);
      setTimeout(() => setDepositStatResetMsg(""), 4000);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await apiFetch("/api/admin/users");
      if (Array.isArray(data)) setUsersList(data);
    } catch (e) {}
  };

  const fetchCampaigns = async () => {
    try {
      const data = await apiFetch("/api/admin/tasks");
      if (Array.isArray(data)) {
        setCampaignsList(data.filter((t: any) => !t.isAdminTask));
        setAdminTasksList(data.filter((t: any) => t.isAdminTask));
      }
    } catch (e) {}
  };

  const fetchAdminTasks = async () => {
    try {
      const data = await apiFetch("/api/admin/tasks");
      if (Array.isArray(data)) {
        setAdminTasksList(data.filter((t: any) => t.isAdminTask));
        setCampaignsList(data.filter((t: any) => !t.isAdminTask));
      }
    } catch (e) {}
  };

  const fetchWithdrawals = async () => {
    try {
      const data = await apiFetch("/api/admin/withdrawals");
      if (Array.isArray(data)) setWithdrawalsList(data);
    } catch (e) {}
  };

  const fetchAudits = async () => {
    try {
      const data = await apiFetch("/api/admin/submissions");
      if (Array.isArray(data)) setSubmissionsList(data);
    } catch (e) {}
  };

  const fetchDepositsAndReferrals = async () => {
    try {
      const deposits = await apiFetch("/api/admin/deposits");
      if (Array.isArray(deposits)) setDepositsList(deposits);

      const referrals = await apiFetch("/api/admin/referrals");
      if (Array.isArray(referrals)) setReferralsList(referrals);
    } catch (e) {}
  };

  const fetchAnnouncementsAndBanners = async () => {
    try {
      const ann = await apiFetch("/api/admin/announcements");
      if (Array.isArray(ann)) setAnnouncements(ann);

      const ban = await apiFetch("/api/admin/banners");
      if (Array.isArray(ban)) setBanners(ban);
    } catch (e) {}
  };

  const fetchCMSPages = async () => {
    try {
      const pages = await apiFetch("/api/public/pages");
      if (pages && !pages.error) {
        setPagesCMS(pages);
        if (pages[selectedCMSPage]) {
          setCmsPageTitle(pages[selectedCMSPage].title);
          setCmsPageContent(pages[selectedCMSPage].content);
        }
      }
    } catch (e) {}
  };

  React.useEffect(() => {
    fetchStats();
  }, []);

  React.useEffect(() => {
    if (activeTab === "stats") { fetchStats(); fetchDepositsAndReferrals(); }
    if (activeTab === "users") fetchUsers();
    if (activeTab === "campaigns") fetchCampaigns();
    if (activeTab === "admin-tasks") fetchAdminTasks();
    if (activeTab === "withdrawals") fetchWithdrawals();
    if (activeTab === "audits") fetchAudits();
    if (activeTab === "announcements") fetchAnnouncementsAndBanners();
    if (activeTab === "cms") fetchCMSPages();
    if (activeTab === "platform-earnings") {
      fetchPlatformStats();
      fetchOwnerBankAccounts();
      fetchOwnerWithdrawals();
      fetchBanksList();
    }
    if (activeTab === "commissions") {
      fetchPlatformStats();
      fetchCommissions();
    }
    if (activeTab === "advertisers") fetchUsers();
    if (activeTab === "notifications") { /* notifications already fetched on mount */ }
    if (activeTab === "reports") { fetchStats(); fetchDepositsAndReferrals(); fetchAudits(); }
    if (activeTab === "broadcast") fetchBroadcastLogs();
  }, [activeTab]);

  React.useEffect(() => {
    if (pagesCMS[selectedCMSPage]) {
      setCmsPageTitle(pagesCMS[selectedCMSPage].title);
      setCmsPageContent(pagesCMS[selectedCMSPage].content);
    }
  }, [selectedCMSPage, pagesCMS]);

  // Real-Time Notification Stream Hook & Helpers
  const unreadCount = notifications.filter(n => !n.read).length;

  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const list = await apiFetch("/api/admin/notifications");
        if (Array.isArray(list)) {
          setNotifications(list);
        }
      } catch (e) {
        console.warn("Failed to fetch notifications list", e);
      }
    };
    fetchNotifications();

    let socket: WebSocket | null = null;
    let isConnected = false;

    const connectWS = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host;
        socket = new WebSocket(`${protocol}//${host}/ws`);

        socket.onopen = () => {
          isConnected = true;
          console.log("[Admin WS] Connected to notification server");
          socket?.send(JSON.stringify({ type: "register-admin" }));
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "init-unread") {
              setNotifications(data.notifications);
            } else if (data.type === "notification") {
              const newNotif = data.notification;
              setNotifications(prev => [newNotif, ...prev.slice(0, 99)]);
              setActiveToast(newNotif);
              
              // Refreshes Stats and Tables
              fetchStats();
              if (activeTab === "stats") fetchDepositsAndReferrals();
              if (activeTab === "withdrawals") fetchWithdrawals();
              if (activeTab === "audits") fetchAudits();
            }
          } catch (e) {
            console.error("[Admin WS] Error parsing message", e);
          }
        };

        socket.onclose = () => {
          isConnected = false;
          console.log("[Admin WS] Connection closed, retrying in 5s...");
          setTimeout(() => {
            if (!isConnected) connectWS();
          }, 5000);
        };

        socket.onerror = (err) => {
          console.warn("[Admin WS] Connection status check:", err);
          socket?.close();
        };
      } catch (err) {
        console.warn("WS setup failed, using simulated fallback event listener", err);
      }
    };

    connectWS();

    const handleMockNotification = (e: Event) => {
      const customEvent = e as CustomEvent<AdminNotification>;
      if (customEvent.detail) {
        const newNotif = customEvent.detail;
        setNotifications(prev => [newNotif, ...prev.slice(0, 99)]);
        setActiveToast(newNotif);
        
        fetchStats();
        if (activeTab === "stats") fetchDepositsAndReferrals();
        if (activeTab === "withdrawals") fetchWithdrawals();
        if (activeTab === "audits") fetchAudits();
      }
    };

    window.addEventListener("mock-notification", handleMockNotification);

    return () => {
      if (socket) {
        socket.close();
      }
      window.removeEventListener("mock-notification", handleMockNotification);
    };
  }, [activeTab]);

  React.useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  // Close notification dropdown when clicking outside the bell container
  React.useEffect(() => {
    if (!showNotifDropdown) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showNotifDropdown]);

  const handleMarkAllRead = async () => {
    try {
      await apiFetch("/api/admin/notifications/read-all", {
        method: "POST"
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.warn("Failed to mark all notifications as read", e);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await apiFetch(`/api/admin/notifications/${id}/read`, {
        method: "POST"
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.warn("Failed to mark notification as read", e);
    }
  };

  const handleNotificationClick = async (notif: AdminNotification) => {
    await handleMarkRead(notif.id);
    setShowNotifDropdown(false);
    
    // Direct routing to the target panel
    if (notif.type === "submission") {
      setActiveTab("audits");
    } else if (notif.type === "withdrawal") {
      setActiveTab("withdrawals");
    }
  };

  // Adjust balance
  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForBalance || !adjustBalanceAmount) return;

    try {
      const res = await apiFetch(`/api/admin/users/${selectedUserForBalance.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletBalance: parseFloat(adjustBalanceAmount)
        })
      });

      if (res && res.success) {
        fetchUsers();
        setSelectedUserForBalance(null);
        setAdjustBalanceAmount("");
        onRefreshUser();
        alert("User balance adjusted successfully!");
      }
    } catch (e) {
      alert("Adjustment request failed.");
    }
  };

  // Toggle Verification status of user
  const handleToggleVerification = async (targetUser: any) => {
    try {
      const res = await apiFetch(`/api/admin/users/${targetUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isVerified: !targetUser.isVerified
        })
      });
      if (res && res.success) {
        fetchUsers();
      }
    } catch (e) {}
  };

  // ── User Management Actions ─────────────────────────────────────────────────
  const showUserMsg = (type: "success" | "error", text: string) => {
    setUserActionMsg({ type, text });
    setTimeout(() => setUserActionMsg(null), 4000);
  };

  const handleBanUser = async (targetUser: any) => {
    if (!window.confirm(`Ban ${targetUser.name}? They will be immediately logged out and unable to sign in.`)) return;
    setUserActionLoading(targetUser.id);
    try {
      const res = await apiFetch(`/api/admin/users/${targetUser.id}/ban`, { method: "POST" });
      if (res?.success) {
        showUserMsg("success", `${targetUser.name} has been banned.`);
        fetchUsers();
      } else {
        showUserMsg("error", res?.error || "Failed to ban user.");
      }
    } catch (e) { showUserMsg("error", "Request failed."); }
    finally { setUserActionLoading(null); }
  };

  const handleUnbanUser = async (targetUser: any) => {
    setUserActionLoading(targetUser.id);
    try {
      const res = await apiFetch(`/api/admin/users/${targetUser.id}/unban`, { method: "POST" });
      if (res?.success) {
        showUserMsg("success", `${targetUser.name} has been unbanned and can log in again.`);
        fetchUsers();
      } else {
        showUserMsg("error", res?.error || "Failed to unban user.");
      }
    } catch (e) { showUserMsg("error", "Request failed."); }
    finally { setUserActionLoading(null); }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setUserActionLoading(deletingUser.id);
    try {
      const res = await apiFetch(`/api/admin/users/${deletingUser.id}`, { method: "DELETE" });
      if (res?.success) {
        showUserMsg("success", `${deletingUser.name} has been permanently deleted.`);
        setDeletingUser(null);
        fetchUsers();
      } else {
        showUserMsg("error", res?.error || "Failed to delete user.");
      }
    } catch (e) { showUserMsg("error", "Request failed."); }
    finally { setUserActionLoading(null); }
  };

  // ── Withdrawal Management Actions ──────────────────────────────────────────
  const showWdMsg = (type: "success" | "error", text: string) => {
    setWithdrawalActionMsg({ type, text });
    setTimeout(() => setWithdrawalActionMsg(null), 6000);
  };

  const handleApproveWithdrawal = async (tx: Transaction) => {
    const isRetry = tx.status === TransactionStatus.APPROVED;
    const label = tx.bankDetails?.accountName || tx.userName;
    if (!window.confirm(
      `${isRetry ? "Retry Paystack transfer" : "Approve & send"} ₦${tx.amount.toLocaleString()} to ${label} via Paystack?\n\nBank: ${tx.bankDetails?.bankName}\nAccount: ${tx.bankDetails?.accountNumber}\n\nThis will initiate a real bank transfer. Only confirm after verifying the details.`
    )) return;

    setWithdrawalActionLoading(tx.id);
    try {
      const res = await apiFetch(`/api/admin/withdrawals/${tx.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" })
      });
      if (res?.success) {
        const ref = res.transaction?.paystackTransferRef;
        showWdMsg("success", `✓ Transfer to ${label} completed. Paystack ref: ${ref || "N/A"}`);
      } else {
        showWdMsg("error", res?.error || "Paystack transfer failed — withdrawal moved to Approved (Awaiting Payment). Retry, mark paid manually, or reject & refund.");
      }
      fetchWithdrawals();
      fetchStats();
    } catch (e) {
      showWdMsg("error", "Network error — please check connection and retry.");
    } finally {
      setWithdrawalActionLoading(null);
    }
  };

  const handleMarkPaid = async (tx: Transaction) => {
    if (!window.confirm(`Mark ₦${tx.amount.toLocaleString()} withdrawal for ${tx.bankDetails?.accountName || tx.userName} as Paid?\n\nOnly do this after you have successfully sent the funds to their bank account.`)) return;

    setWithdrawalActionLoading(tx.id);
    try {
      const res = await apiFetch(`/api/admin/withdrawals/${tx.id}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res?.success) {
        showWdMsg("success", `✓ Withdrawal for ${tx.bankDetails?.accountName || tx.userName} marked as Paid.`);
      } else {
        showWdMsg("error", res?.error || "Failed to mark as paid.");
      }
      fetchWithdrawals();
      fetchStats();
    } catch (e) {
      showWdMsg("error", "Network error — please retry.");
    } finally {
      setWithdrawalActionLoading(null);
    }
  };

  const handleRejectWithdrawal = async () => {
    if (!rejectingWithdrawal) return;
    if (!rejectionReason.trim()) { alert("Please enter a rejection reason."); return; }

    setWithdrawalActionLoading(rejectingWithdrawal.id);
    try {
      const res = await apiFetch(`/api/admin/withdrawals/${rejectingWithdrawal.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejectionReason: rejectionReason.trim() })
      });
      if (res?.success) {
        showWdMsg("success", `Withdrawal from ${rejectingWithdrawal.userName} rejected. Reason saved.`);
        setRejectingWithdrawal(null);
        setRejectionReason("");
      } else {
        showWdMsg("error", res?.error || "Rejection failed.");
      }
      fetchWithdrawals();
      fetchStats();
    } catch (e) {
      showWdMsg("error", "Network error — please retry.");
    } finally {
      setWithdrawalActionLoading(null);
    }
  };

  // Legacy alias kept so any other code that still calls it continues to compile
  const handleReviewWithdrawal = async (txId: string, _status: TransactionStatus) => {
    const tx = withdrawalsList.find(w => w.id === txId);
    if (tx) await handleApproveWithdrawal(tx);
  };

  // Approve / Reject Earners Tasks Manually
  const handleReviewSubmission = async (subId: string, status: SubmissionStatus, feedback: string = "") => {
    const actionText = status === SubmissionStatus.APPROVED ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${actionText} this task submission?`)) return;

    try {
      const res = await apiFetch(`/api/admin/submissions/${subId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, feedback })
      });

      if (res && res.success) {
        fetchAudits();
        fetchStats();
      }
    } catch (e) {}
  };

  const handleAddOrEditBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankFormError("");
    setBankFormSuccess("");

    if (!bankNameInput || !bankAccountNumberInput || !bankAccountNameInput) {
      setBankFormError("Please fill out all bank account fields.");
      return;
    }

    try {
      const endpoint = editingBankAccount 
        ? `/api/admin/owner-earnings/bank-accounts/${editingBankAccount.id}`
        : `/api/admin/owner-earnings/bank-accounts`;
      const method = editingBankAccount ? "PUT" : "POST";

      const res = await apiFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: bankNameInput,
          accountNumber: bankAccountNumberInput,
          accountName: bankAccountNameInput,
          isDefault: bankIsDefaultInput
        })
      });

      if (res && !res.error) {
        setBankFormSuccess(editingBankAccount ? "Bank account modified successfully." : "Bank account added successfully.");
        setBankNameInput("");
        setBankAccountNumberInput("");
        setBankAccountNameInput("");
        setBankIsDefaultInput(false);
        setEditingBankAccount(null);
        setShowBankForm(false);
        fetchOwnerBankAccounts();
      } else {
        setBankFormError(res?.error || "An error occurred while saving the bank account.");
      }
    } catch (e) {
      setBankFormError("Failed to synchronize bank account.");
    }
  };

  const handleEditBankClick = (account: any) => {
    setEditingBankAccount(account);
    setBankNameInput(account.bankName);
    setBankAccountNumberInput(account.accountNumber);
    setBankAccountNameInput(account.accountName);
    setBankIsDefaultInput(account.isDefault);
    setShowBankForm(true);
    setBankFormError("");
    setBankFormSuccess("");
  };

  const handleDeleteBankAccount = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this bank account?")) return;
    try {
      const res = await apiFetch(`/api/admin/owner-earnings/bank-accounts/${id}`, {
        method: "DELETE"
      });
      if (res && res.success) {
        fetchOwnerBankAccounts();
      }
    } catch (e) {}
  };

  const handleSetDefaultBank = async (id: string) => {
    try {
      const res = await apiFetch(`/api/admin/owner-earnings/bank-accounts/${id}/default`, {
        method: "POST"
      });
      if (res && !res.error) {
        fetchOwnerBankAccounts();
      }
    } catch (e) {}
  };

  const handleWithdrawEarnings = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError("");
    setWithdrawSuccess("");

    if (!withdrawAmountInput) {
      setWithdrawError("Please provide an amount.");
      return;
    }

    if (!withdrawBankName || !withdrawAccountNumber || !withdrawAccountName || !isBankVerified) {
      setWithdrawError("Please complete bank verification first.");
      return;
    }

    const amount = parseFloat(withdrawAmountInput);
    if (isNaN(amount) || amount <= 0) {
      setWithdrawError("Please enter a valid positive withdrawal amount.");
      return;
    }

    try {
      // 1. Register/save the verified bank account to get a bankAccountId
      const bankRes = await apiFetch("/api/admin/owner-earnings/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: withdrawBankName,
          accountNumber: withdrawAccountNumber,
          accountName: withdrawAccountName,
          isDefault: false
        })
      });

      if (bankRes && bankRes.error) {
        setWithdrawError(bankRes.error);
        return;
      }

      const bankAccountId = bankRes.id;

      // 2. Complete the withdrawal using the registered bankAccountId
      const res = await apiFetch("/api/admin/owner-earnings/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          bankAccountId: bankAccountId
        })
      });

      if (res && !res.error) {
        setWithdrawSuccess("Withdrawal request created successfully!");
        setWithdrawAmountInput("");
        setWithdrawAccountNumber("");
        setWithdrawAccountName("");
        setWithdrawBankCode("");
        setWithdrawBankName("");
        setIsBankVerified(false);
        fetchPlatformStats();
        fetchOwnerWithdrawals();
        fetchOwnerBankAccounts(); // Refresh list on UI
        setShowWithdrawForm(false);
      } else {
        setWithdrawError(res?.error || "Insufficient platform balance or invalid request.");
      }
    } catch (err) {
      setWithdrawError("Failed to record withdrawal.");
    }
  };

  const handleUpdateOwnerWithdrawalStatus = async (id: string, status: string) => {
    if (!window.confirm(`Are you sure you want to mark this withdrawal as ${status}?`)) return;
    try {
      const res = await apiFetch(`/api/admin/owner-earnings/withdrawals/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res && !res.error) {
        fetchPlatformStats();
        fetchOwnerWithdrawals();
      }
    } catch (e) {}
  };

  // Submit CMS update
  const handleUpdateCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setCmsSuccess("");

    try {
      const res = await apiFetch(`/api/admin/pages/${selectedCMSPage}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cmsPageTitle,
          content: cmsPageContent
        })
      });

      if (res && res.success) {
        setCmsSuccess("CMS static page content published successfully!");
        fetchCMSPages();
      }
    } catch (e) {
      alert("Error updating static pages.");
    }
  };

  // Submit Website settings
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess("");

    try {
      const res = await apiFetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });

      if (res && res.success) {
        setSettingsSuccess("Core website configuration settings synchronized!");
        fetchStats();
      }
    } catch (e) {}
  };

  // Announcement create / edit (login popup)
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;
    setAnnSuccess("");
    setAnnError("");

    // Client-side validation mirrors the server: only allow http(s) links.
    const trimmedLink = annLinkUrl.trim();
    if (trimmedLink && !/^https?:\/\/.+/i.test(trimmedLink)) {
      setAnnError("Link URL must start with http:// or https://");
      return;
    }

    try {
      const isEditing = !!annEditingId;
      const res = await apiFetch(isEditing ? `/api/admin/announcements/${annEditingId}` : "/api/admin/announcements", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: annTitle, content: annContent, type: annType, dismissible: annDismissible,
          linkUrl: trimmedLink || null, buttonText: annButtonText.trim() || null
        })
      });

      if (res && res.success) {
        setAnnSuccess(isEditing ? "Announcement updated successfully!" : "Announcement published — it will pop up for Earners & Advertisers on next login!");
        setAnnTitle("");
        setAnnContent("");
        setAnnType("info");
        setAnnDismissible(true);
        setAnnLinkUrl("");
        setAnnButtonText("");
        setAnnEditingId(null);
        fetchAnnouncementsAndBanners();
      } else if (res && res.error) {
        setAnnError(res.error);
      }
    } catch (e) {}
  };

  // Load an existing announcement into the form for editing
  const handleEditAnnouncement = (ann: Announcement) => {
    setAnnEditingId(ann.id);
    setAnnTitle(ann.title);
    setAnnContent(ann.content);
    setAnnType(ann.type);
    setAnnDismissible(ann.dismissible);
    setAnnLinkUrl(ann.linkUrl || "");
    setAnnButtonText(ann.buttonText || "");
    setAnnSuccess("");
    setAnnError("");
  };

  const handleCancelEditAnnouncement = () => {
    setAnnEditingId(null);
    setAnnTitle("");
    setAnnContent("");
    setAnnType("info");
    setAnnDismissible(true);
    setAnnLinkUrl("");
    setAnnButtonText("");
    setAnnError("");
  };

  // Enable / disable the login popup announcement
  const handleToggleAnnouncement = async (id: string) => {
    try {
      const res = await apiFetch(`/api/admin/announcements/${id}/toggle`, { method: "PUT" });
      if (res && res.success) fetchAnnouncementsAndBanners();
    } catch (e) {}
  };

  // Announcement delete
  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm("Delete this notice?")) return;
    try {
      const res = await apiFetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
      if (res && res.success) {
        if (annEditingId === id) handleCancelEditAnnouncement();
        fetchAnnouncementsAndBanners();
      }
    } catch (e) {}
  };

  // Banner post
  const handlePostBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banTitle || !banImage) return;
    setBanSuccess("");

    try {
      const res = await apiFetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: banTitle, imageUrl: banImage, link: banLink })
      });

      if (res && res.success) {
        setBanSuccess("Dashboard advertising banner uploaded!");
        setBanTitle("");
        setBanImage("");
        setBanLink("");
        fetchAnnouncementsAndBanners();
      }
    } catch (e) {}
  };

  // Banner delete
  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm("Remove this banner?")) return;
    try {
      const res = await apiFetch(`/api/admin/banners/${id}`, { method: "DELETE" });
      if (res && res.success) fetchAnnouncementsAndBanners();
    } catch (e) {}
  };

  // Toggle Campaign from admin desk
  const handleAdminToggleCampaign = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === TaskStatus.ACTIVE ? TaskStatus.PAUSED : TaskStatus.ACTIVE;
    try {
      const res = await apiFetch(`/api/admin/tasks/${taskId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res && res.success) fetchCampaigns();
    } catch (e) {}
  };

  // Delete any campaign (advertiser or admin) from admin desk
  const handleDeleteCampaign = async (taskId: string, taskTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete this campaign?\n\n"${taskTitle}"\n\nThis action cannot be undone.`)) return;
    try {
      const res = await apiFetch(`/api/admin/tasks/${taskId}`, { method: "DELETE" });
      if (res && res.success) fetchCampaigns();
    } catch (e) {}
  };

  // Admin task form helpers
  const resetAdminTaskForm = () => {
    setAdminTaskTitle("");
    setAdminTaskDescription("");
    setAdminTaskCategory("");
    setAdminTaskProofReq("");
    setAdminTaskLink("");
    setAdminTaskSlots("");
    setAdminTaskReward("");
    setAdminTaskFormError("");
    setAdminTaskFormSuccess("");
    setEditingAdminTask(null);
    setShowAdminTaskForm(false);
  };

  const handleOpenEditAdminTask = (task: Task) => {
    setEditingAdminTask(task);
    setAdminTaskTitle(task.title);
    setAdminTaskDescription(task.description);
    setAdminTaskCategory(task.category as string);
    setAdminTaskProofReq(task.proofRequirements || "");
    setAdminTaskLink(task.link);
    setAdminTaskSlots(String(task.totalSlots));
    setAdminTaskReward(String(task.earningPerSlot));
    setAdminTaskFormError("");
    setAdminTaskFormSuccess("");
    setShowAdminTaskForm(true);
  };

  const handleSubmitAdminTask = async () => {
    setAdminTaskFormError("");
    setAdminTaskFormSuccess("");
    if (!adminTaskTitle || !adminTaskDescription || !adminTaskCategory || !adminTaskLink || !adminTaskSlots || !adminTaskReward) {
      setAdminTaskFormError("All fields are required.");
      return;
    }
    setAdminTaskSubmitting(true);
    try {
      const payload = {
        title: adminTaskTitle,
        description: adminTaskDescription,
        category: adminTaskCategory,
        proofRequirements: adminTaskProofReq || "Submit a screenshot or username as proof.",
        link: adminTaskLink,
        totalSlots: adminTaskSlots,
        earningPerSlot: adminTaskReward
      };
      const endpoint = editingAdminTask ? `/api/admin/tasks/${editingAdminTask.id}` : "/api/admin/tasks";
      const method = editingAdminTask ? "PUT" : "POST";
      const res = await apiFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res && res.success) {
        setAdminTaskFormSuccess(editingAdminTask ? "Task updated successfully!" : "Task published successfully!");
        resetAdminTaskForm();
        fetchAdminTasks();
      } else {
        setAdminTaskFormError(res?.error || "Failed to save task.");
      }
    } catch (e) {
      setAdminTaskFormError("Server error. Please try again.");
    } finally {
      setAdminTaskSubmitting(false);
    }
  };

  const handleDeleteAdminTask = async (taskId: string, taskTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete this admin task?\n\n"${taskTitle}"\n\nThis action cannot be undone.`)) return;
    try {
      const res = await apiFetch(`/api/admin/tasks/${taskId}`, { method: "DELETE" });
      if (res && res.success) fetchAdminTasks();
    } catch (e) {}
  };

  const handleToggleAdminTask = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === TaskStatus.ACTIVE ? TaskStatus.PAUSED : TaskStatus.ACTIVE;
    try {
      const res = await apiFetch(`/api/admin/tasks/${taskId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res && res.success) fetchAdminTasks();
    } catch (e) {}
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Live Real-Time Toast Alert */}
      {activeToast && (
        <div 
          onClick={() => handleNotificationClick(activeToast)}
          className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 max-w-sm bg-white rounded-2xl border-l-4 border-blue-500 shadow-2xl p-4 flex gap-3.5 items-start animate-bounce hover:shadow-blue-100/50 transition-all cursor-pointer"
        >
          <div className="rounded-full bg-blue-50 p-2 text-blue-600 shrink-0">
            {activeToast.type === "submission" ? <ShieldAlert className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {activeToast.type === "submission" ? "Submission Pending" : "Withdrawal Requested"}
              </span>
              <button 
                className="text-gray-400 hover:text-gray-600 text-xs font-bold" 
                onClick={(e) => { e.stopPropagation(); setActiveToast(null); }}
              >
                ✕
              </button>
            </div>
            <p className="text-xs font-semibold text-gray-800 leading-snug">{activeToast.message}</p>
            <p className="text-[9px] text-gray-400 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Just now
            </p>
          </div>
        </div>
      )}

      {/* Top Admin Header with Notification Bell */}
      <div className="flex flex-row items-center justify-between bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm gap-3">
        {/* Left: title + Live WebSocket badge + subtitle */}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2 leading-tight">
            Admin Control Center
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100 whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" /> Live WebSocket
            </span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1 leading-snug">
            System administration & real-time transaction clearing. Welcome back, <span className="font-bold text-slate-700">{user.name}</span>.
          </p>
        </div>

        {/* Right: Notification Bell — always pinned to far right */}
        <div className="relative shrink-0" ref={notifContainerRef}>
          <button
            id="admin-notification-bell"
            onClick={() => setShowNotifDropdown(prev => !prev)}
            className={`relative rounded-full p-2.5 transition-all outline-none cursor-pointer ${
              showNotifDropdown ? "bg-slate-100 text-slate-800" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
            aria-label="Notifications"
          >
            {unreadCount > 0 ? (
              <>
                <BellRing className="h-5 w-5 text-blue-500 animate-bounce" />
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </>
            ) : (
              <Bell className="h-5 w-5" />
            )}
          </button>

          {/* Notifications Dropdown — opens below bell, clamped to viewport */}
          {showNotifDropdown && (
            <div
              className="absolute right-0 top-full mt-2 z-50 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl space-y-3"
              style={{ width: "18rem", maxWidth: "calc(100vw - 1.5rem)" }}
            >
              <div className="flex justify-between items-center border-b border-slate-50 pb-2.5">
                <div>
                  <h4 className="font-display text-xs font-extrabold text-slate-900">Notifications ({unreadCount})</h4>
                  <p className="text-[9px] text-slate-400 font-medium">Real-time alerts & activities</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-700 hover:bg-blue-100 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <CheckCheck className="h-3 w-3" /> Mark all read
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 pr-1 space-y-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Bell className="h-8 w-8 mx-auto stroke-1 mb-2 opacity-40" />
                    <p className="text-xs font-semibold">All quiet for now</p>
                    <p className="text-[10px] mt-0.5">No new notifications received.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`py-2.5 px-2 rounded-xl transition-all flex gap-2.5 cursor-pointer text-left items-start ${
                        notif.read ? "hover:bg-slate-50/50" : "bg-blue-50/40 hover:bg-blue-50"
                      }`}
                    >
                      <div className={`rounded-full p-1.5 shrink-0 ${
                        notif.type === "submission" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                      }`}>
                        {notif.type === "submission" ? <ShieldAlert className="h-3.5 w-3.5" /> : <CreditCard className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] leading-tight ${notif.read ? "text-slate-600 font-medium" : "text-slate-900 font-bold"}`}>
                          {notif.message}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      
      {/* Left Sidebar Menu Rail (desktop only — mobile uses the bottom nav bar + hamburger menu) */}
      <div className="hidden lg:block lg:col-span-1 space-y-1 lg:sticky lg:top-20 lg:self-start">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2">Admin Dashboard</p>

        {([
          { tab: "stats" as AdminTab, icon: <LayoutGrid className="h-4 w-4 text-slate-400" />, label: "Dashboard" },
          { tab: "users" as AdminTab, icon: <Users className="h-4 w-4 text-slate-400" />, label: "User Management" },
          { tab: "advertisers" as AdminTab, icon: <Megaphone className="h-4 w-4 text-slate-400" />, label: "Advertiser Management" },
          { tab: "campaigns" as AdminTab, icon: <Briefcase className="h-4 w-4 text-slate-400" />, label: "Campaign Management" },
          { tab: "admin-tasks" as AdminTab, icon: <ListTodo className="h-4 w-4 text-slate-400" />, label: `Task Management (${adminTasksList.filter(t => t.status === TaskStatus.ACTIVE).length})` },
          { tab: "pricing" as AdminTab, icon: <Coins className="h-4 w-4 text-slate-400" />, label: "Pricing Settings" },
          { tab: "platform-earnings" as AdminTab, icon: <TrendingUp className="h-4 w-4 text-slate-400" />, label: "Wallet & Commission" },
          { tab: "withdrawals" as AdminTab, icon: <CreditCard className="h-4 w-4 text-slate-400" />, label: `Withdrawals (${withdrawalsList.filter(w => w.status === TransactionStatus.PENDING || w.status === TransactionStatus.APPROVED).length})` },
          { tab: "announcements" as AdminTab, icon: <Megaphone className="h-4 w-4 text-slate-400" />, label: "Popup Messages" },
          { tab: "notifications" as AdminTab, icon: <Bell className="h-4 w-4 text-slate-400" />, label: `Notifications (${unreadCount})` },
          { tab: "reports" as AdminTab, icon: <TrendingUp className="h-4 w-4 text-slate-400" />, label: "Reports" },
          { tab: "settings" as AdminTab, icon: <Settings className="h-4 w-4 text-slate-400" />, label: "Site Settings" },
          { tab: "broadcast" as AdminTab, icon: <Mail className="h-4 w-4 text-slate-400" />, label: "Broadcast Email" },
          { tab: "profile" as AdminTab, icon: <FolderSync className="h-4 w-4 text-slate-400" />, label: "Profile" },
          { tab: "demo-accounts" as AdminTab, icon: <ShieldAlert className="h-4 w-4 text-slate-400" />, label: "Demo Accounts" },
        ] as { tab: AdminTab; icon: React.ReactNode; label: string }[]).map(({ tab, icon, label }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center gap-2.5 ${
              activeTab === tab ? "bg-blue-50 text-blue-600 border-r-4 border-blue-500" : "text-slate-500 hover:bg-slate-50/50"
            }`}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Pane */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* TAB 1: SYSTEM STATS OVERVIEW */}
        {activeTab === "stats" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Top Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Earners Count</span>
                <span className="block font-mono text-xl sm:text-2xl font-black text-gray-800 mt-1">{stats.earnersCount}</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Advertisers Count</span>
                <span className="block font-mono text-xl sm:text-2xl font-black text-gray-800 mt-1">{stats.advertisersCount}</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Platform Campaigns</span>
                <span className="block font-mono text-xl sm:text-2xl font-black text-gray-800 mt-1">{stats.tasksCount}</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Total Earner Earnings</span>
                <span className="block font-mono text-xl sm:text-2xl font-black text-blue-600 mt-1">₦{stats.totalEarned.toLocaleString()}</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Pending Withdrawals Queue</span>
                <span className="block font-mono text-xl sm:text-2xl font-black text-amber-500 mt-1">₦{stats.pendingWithdrawals.toLocaleString()}</span>
              </div>
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <ArrowDownCircle className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Total Advertiser Deposits</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetDepositStat}
                    disabled={resettingDepositStat}
                    title="Reset this dashboard statistic to ₦0.00 (does not affect transaction history, accounts, or wallet balances)"
                    className="text-[9px] font-bold text-indigo-400 hover:text-indigo-600 uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resettingDepositStat ? "Resetting…" : "Reset"}
                  </button>
                </div>
                <span className="block font-mono text-xl sm:text-2xl font-black text-indigo-700">
                  ₦{stats.totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="block text-[10px] text-indigo-400 mt-1">All-time successful deposits</span>
                {depositStatResetMsg && (
                  <span className="block text-[10px] font-semibold text-emerald-600 mt-1">{depositStatResetMsg}</span>
                )}
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50/5 p-5 shadow-sm hover:bg-blue-50/20 transition-all cursor-pointer flex flex-col justify-between" onClick={() => setActiveTab("platform-earnings")}>
                <div>
                  <span className="block text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5" /> Available Platform Earnings
                  </span>
                  <span className="block font-mono text-xl sm:text-2xl font-black text-blue-600 mt-1">₦{platformStats.availableBalance.toLocaleString()}</span>
                </div>
                <span className="text-[10px] text-blue-600 font-bold hover:underline mt-2 block">Withdraw Wallet ➔</span>
              </div>
            </div>

            {/* Financial Ledger Log Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Deposits ledger */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
                <h3 className="font-display text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <ArrowDownCircle className="h-4 w-4 text-blue-500" /> Recent Cash Deposits (₦)
                </h3>
                {depositsList.length === 0 ? (
                  <p className="text-center py-4 text-xs text-gray-400">No deposits registered.</p>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto">
                    {depositsList.slice(0, 10).map((dep, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-gray-50 pb-2">
                        <div>
                          <p className="font-bold text-gray-800">{dep.userName}</p>
                          <p className="text-[10px] text-gray-400">{dep.reference} • {new Date(dep.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="font-mono font-bold text-blue-600">+₦{dep.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Referrals tracker */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
                <h3 className="font-display text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <BadgePercent className="h-4 w-4 text-indigo-500" /> Recent Referral Connections
                </h3>
                {referralsList.length === 0 ? (
                  <p className="text-center py-4 text-xs text-gray-400">No referrals recorded.</p>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto">
                    {referralsList.slice(0, 10).map((ref, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-gray-50 pb-2">
                        <div>
                          <p className="font-bold text-gray-800">Invited: {ref.refereeName}</p>
                          <p className="text-[10px] text-gray-400">{ref.refereeEmail}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-blue-600">+₦{ref.rewardEarned}</span>
                          <span className="block text-[9px] text-gray-400 mt-0.5">Credited to Referrer</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: MANAGE USERS */}
        {activeTab === "users" && (() => {
          // Derived filtered list — computed inline so it reacts to state without extra effects
          const filteredUsers = usersList.filter(usr => {
            const q = userSearch.toLowerCase();
            const matchSearch = !q ||
              usr.name?.toLowerCase().includes(q) ||
              usr.email?.toLowerCase().includes(q) ||
              usr.username?.toLowerCase().includes(q);
            const matchRole = userRoleFilter === "All" || usr.role === userRoleFilter;
            const matchStatus = userStatusFilter === "All" ||
              (userStatusFilter === "Banned" ? usr.isBanned : !usr.isBanned);
            return matchSearch && matchRole && matchStatus;
          });

          return (
            <div className="space-y-4">

              {/* ── Feedback banner ───────────────────────────────────────── */}
              {userActionMsg && (
                <div className={`rounded-xl px-4 py-3 text-xs font-medium flex items-center gap-2 ${
                  userActionMsg.type === "success"
                    ? "bg-green-50 border border-green-100 text-green-700"
                    : "bg-red-50 border border-red-100 text-red-700"
                }`}>
                  {userActionMsg.type === "success" ? <CheckCircle className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}
                  {userActionMsg.text}
                </div>
              )}

              {/* ── Balance adjuster modal ─────────────────────────────────── */}
              {selectedUserForBalance && (
                <form onSubmit={handleAdjustBalance} className="rounded-2xl border-2 border-amber-100 bg-amber-50/30 p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display text-sm font-bold text-amber-900">Adjust Wallet Balance</h4>
                      <p className="text-xs text-amber-700">User: <strong>{selectedUserForBalance.name}</strong> ({selectedUserForBalance.role})</p>
                    </div>
                    <button type="button" onClick={() => setSelectedUserForBalance(null)} className="rounded-full bg-gray-200 p-1 text-gray-700"><X className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="flex gap-3 max-w-sm">
                    <input type="number" required value={adjustBalanceAmount}
                      onChange={e => setAdjustBalanceAmount(e.target.value)}
                      placeholder="New Wallet Balance (₦)"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-mono focus:outline-none" />
                    <button type="submit" className="rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white px-5 py-2 whitespace-nowrap">
                      Update Balance
                    </button>
                  </div>
                </form>
              )}

              {/* ── Profile view modal ────────────────────────────────────── */}
              {viewingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setViewingUser(null)}>
                  <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center">
                      <h3 className="font-display text-sm font-bold text-gray-900">User Profile</h3>
                      <button onClick={() => setViewingUser(null)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        {viewingUser.photoUrl
                          ? <img src={viewingUser.photoUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
                          : <UserCircle2 className="h-7 w-7 text-blue-300" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{viewingUser.name}</p>
                        <p className="text-xs text-gray-400">{viewingUser.email}</p>
                      </div>
                      <span className={`ml-auto shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${viewingUser.isBanned ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                        {viewingUser.isBanned ? "Banned" : "Active"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {[
                        ["Username", viewingUser.username || "—"],
                        ["Account Type", viewingUser.role],
                        ["Wallet Balance", `₦${(viewingUser.walletBalance || 0).toLocaleString()}`],
                        ["Phone", viewingUser.phone || "—"],
                        ["Country", viewingUser.country || "—"],
                        ["Business Name", viewingUser.businessName || "—"],
                        ["Verification", viewingUser.isVerified ? "Verified" : "Unverified"],
                        ["Registered", viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleDateString() : "—"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                          <p className="font-medium text-gray-800 truncate">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      {viewingUser.isBanned
                        ? <button onClick={() => { setViewingUser(null); handleUnbanUser(viewingUser); }}
                            className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 flex items-center justify-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5" /> Unban User
                          </button>
                        : <button onClick={() => { setViewingUser(null); handleBanUser(viewingUser); }}
                            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 flex items-center justify-center gap-1.5">
                            <Ban className="h-3.5 w-3.5" /> Ban User
                          </button>}
                      <button onClick={() => { setViewingUser(null); setDeletingUser(viewingUser); }}
                        className="flex-1 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 text-xs font-bold py-2.5 flex items-center justify-center gap-1.5">
                        <UserX className="h-3.5 w-3.5" /> Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Delete confirmation dialog ─────────────────────────────── */}
              {deletingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDeletingUser(null)}>
                  <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                        <UserX className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-display text-sm font-bold text-gray-900">Delete User</h3>
                        <p className="text-xs text-gray-500 mt-0.5">This action is permanent and cannot be undone.</p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-700">
                      Are you sure you want to permanently delete <strong>{deletingUser.name}</strong>? All their data — submissions, transactions, campaigns, and notifications — will be erased.
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setDeletingUser(null)}
                        className="flex-1 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold py-2.5 hover:bg-gray-50">
                        Cancel
                      </button>
                      <button onClick={handleDeleteUser} disabled={userActionLoading === deletingUser.id}
                        className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 disabled:opacity-60 flex items-center justify-center gap-1.5">
                        <Trash2 className="h-3.5 w-3.5" />
                        {userActionLoading === deletingUser.id ? "Deleting…" : "Yes, Delete Permanently"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Main card ─────────────────────────────────────────────── */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="font-display text-sm font-bold text-gray-900">
                    All Users
                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">{filteredUsers.length}</span>
                  </h3>
                  {/* Search */}
                  <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search name, email, username…"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  {(["All", "Earner", "Advertiser"] as const).map(f => (
                    <button key={f} onClick={() => setUserRoleFilter(f)}
                      className={`rounded-full px-3 py-1 text-[10px] font-bold transition-colors ${userRoleFilter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                      {f}
                    </button>
                  ))}
                  <div className="w-px bg-gray-200 mx-1" />
                  {(["All", "Active", "Banned"] as const).map(f => (
                    <button key={f} onClick={() => setUserStatusFilter(f)}
                      className={`rounded-full px-3 py-1 text-[10px] font-bold transition-colors ${userStatusFilter === f ? (f === "Banned" ? "bg-red-600 text-white" : "bg-blue-600 text-white") : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                      {f}
                    </button>
                  ))}
                </div>

                {/* Table */}
                {filteredUsers.length === 0 ? (
                  <p className="text-center py-12 text-xs text-gray-400">No users match your filters.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 uppercase text-[9px] font-bold tracking-wide">
                          <th className="py-2.5 px-2">User</th>
                          <th className="py-2.5 px-2">Username</th>
                          <th className="py-2.5 px-2">Type</th>
                          <th className="py-2.5 px-2">Wallet</th>
                          <th className="py-2.5 px-2">Registered</th>
                          <th className="py-2.5 px-2">Status</th>
                          <th className="py-2.5 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((usr, idx) => {
                          const isLoading = userActionLoading === usr.id;
                          return (
                            <tr key={idx} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${usr.isBanned ? "opacity-60" : ""}`}>
                              <td className="py-3 px-2">
                                <p className="font-bold text-gray-800 leading-tight">{usr.name}</p>
                                <p className="text-gray-400 text-[10px] mt-0.5 truncate max-w-[160px]">{usr.email}</p>
                              </td>
                              <td className="py-3 px-2 text-gray-500 font-mono">{usr.username || <span className="text-gray-300">—</span>}</td>
                              <td className="py-3 px-2">
                                <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                  usr.role === UserRole.ADVERTISER ? "bg-indigo-50 text-indigo-700" : "bg-blue-50 text-blue-700"
                                }`}>{usr.role}</span>
                              </td>
                              <td className="py-3 px-2 font-mono font-bold text-gray-800">
                                ₦{(usr.walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-2 text-gray-400 whitespace-nowrap">
                                {usr.createdAt ? new Date(usr.createdAt).toLocaleDateString() : "—"}
                              </td>
                              <td className="py-3 px-2">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                                  usr.isBanned ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                                }`}>
                                  {usr.isBanned ? <Ban className="h-2.5 w-2.5" /> : <ShieldCheck className="h-2.5 w-2.5" />}
                                  {usr.isBanned ? "Banned" : "Active"}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  <button onClick={() => setViewingUser(usr)}
                                    className="rounded bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-[10px] font-bold text-gray-600 px-2 py-1 flex items-center gap-1">
                                    <Eye className="h-3 w-3" /> View
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedUserForBalance(usr);
                                      setAdjustBalanceAmount(usr.walletBalance.toString());
                                      window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    className="rounded bg-gray-100 hover:bg-amber-50 hover:text-amber-700 text-[10px] font-bold text-gray-600 px-2 py-1">
                                    ₦ Balance
                                  </button>
                                  {usr.isBanned ? (
                                    <button onClick={() => handleUnbanUser(usr)} disabled={isLoading}
                                      className="rounded bg-green-50 hover:bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 flex items-center gap-1 disabled:opacity-50">
                                      <ShieldCheck className="h-3 w-3" /> {isLoading ? "…" : "Unban"}
                                    </button>
                                  ) : (
                                    <button onClick={() => handleBanUser(usr)} disabled={isLoading}
                                      className="rounded bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 flex items-center gap-1 disabled:opacity-50">
                                      <Ban className="h-3 w-3" /> {isLoading ? "…" : "Ban"}
                                    </button>
                                  )}
                                  <button onClick={() => setDeletingUser(usr)} disabled={isLoading}
                                    className="rounded bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 flex items-center gap-1 disabled:opacity-50">
                                    <Trash2 className="h-3 w-3" /> Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB 3: CAMPAIGNS MODERATION */}
        {activeTab === "campaigns" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">Advertiser Campaigns Moderation</h3>
              
              {campaignsList.length === 0 ? (
                <p className="text-center py-10 text-xs text-gray-400">No advertiser campaigns found.</p>
              ) : (
                <div className="space-y-3">
                  {campaignsList.map((task, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-50 bg-white p-4 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <span className="rounded bg-red-50 text-[9px] font-bold text-red-700 px-2 py-1 uppercase inline-flex items-center gap-1.5">
                          <PlatformIcon category={task.category} size={11} />
                          <span>{task.category}</span>
                        </span>
                        <h4 className="font-display font-bold text-gray-800 mt-1">{task.title}</h4>
                        <p className="text-[10px] text-gray-400 mt-1">Publisher: {task.advertiserName} • Budget: ₦{(task.costPerSlot * task.totalSlots).toLocaleString()}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <div>
                          <span className="block text-[10px] text-gray-400">Slots Completed</span>
                          <span className="font-mono font-bold text-gray-700">{task.filledSlots} / {task.totalSlots}</span>
                        </div>
                        
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          task.status === TaskStatus.ACTIVE ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                        }`}>{task.status}</span>

                        {task.status !== TaskStatus.COMPLETED && (
                          <button
                            onClick={() => handleAdminToggleCampaign(task.id, task.status)}
                            className="rounded bg-gray-100 hover:bg-amber-50 hover:text-amber-700 px-2 py-1 font-bold text-[10px]"
                          >
                            {task.status === TaskStatus.ACTIVE ? "Pause" : "Resume"}
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteCampaign(task.id, task.title)}
                          className="rounded bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 font-bold text-[10px] flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: ADMIN TASKS */}
        {activeTab === "admin-tasks" && (
          <div className="space-y-6">
            {/* Create / Edit Form */}
            {!showAdminTaskForm ? (
              <div className="flex justify-end">
                <button
                  onClick={() => { resetAdminTaskForm(); setShowAdminTaskForm(true); }}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" /> Create New Admin Task
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-display text-sm font-bold text-gray-900">
                    {editingAdminTask ? "Edit Admin Task" : "Create Admin Task"}
                  </h3>
                  <button onClick={resetAdminTaskForm} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {adminTaskFormError && (
                  <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs font-medium px-4 py-2.5">{adminTaskFormError}</div>
                )}
                {adminTaskFormSuccess && (
                  <div className="rounded-lg bg-green-50 border border-green-100 text-green-700 text-xs font-medium px-4 py-2.5">{adminTaskFormSuccess}</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide">Task Title *</label>
                    <input
                      type="text"
                      value={adminTaskTitle}
                      onChange={e => setAdminTaskTitle(e.target.value)}
                      placeholder="e.g. Follow our Instagram page"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide">Category / Platform *</label>
                    <select
                      value={adminTaskCategory}
                      onChange={e => setAdminTaskCategory(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400 bg-white"
                    >
                      <option value="">Select category...</option>
                      <option value="Instagram Follow">Instagram Follow</option>
                      <option value="Instagram Like">Instagram Like</option>
                      <option value="Facebook Follow">Facebook Follow</option>
                      <option value="Facebook Like">Facebook Like</option>
                      <option value="Facebook Share">Facebook Share</option>
                      <option value="Facebook Comment">Facebook Comment</option>
                      <option value="TikTok Follow">TikTok Follow</option>
                      <option value="TikTok Like">TikTok Like</option>
                      <option value="TikTok Comment">TikTok Comment</option>
                      <option value="YouTube Subscribe">YouTube Subscribe</option>
                      <option value="YouTube Like">YouTube Like</option>
                      <option value="YouTube Watch">YouTube Watch</option>
                      <option value="Telegram Join">Telegram Join</option>
                      <option value="WhatsApp Join">WhatsApp Join</option>
                      <option value="X (Twitter) Follow">X (Twitter) Follow</option>
                      <option value="Snapchat Add/Follow">Snapchat Add/Follow</option>
                      <option value="LinkedIn Follow/Connect">LinkedIn Follow/Connect</option>
                      <option value="Threads Follow">Threads Follow</option>
                      <option value="Pinterest Follow">Pinterest Follow</option>
                      <option value="Reddit Join">Reddit Join</option>
                      <option value="Discord Join">Discord Join</option>
                      <option value="Website Visit">Website Visit</option>
                      <option value="App Download">App Download</option>
                      <option value="App Registration">App Registration</option>
                      <option value="Email Signup">Email Signup</option>
                      <option value="Survey Completion">Survey Completion</option>
                      <option value="Review Submission">Review Submission</option>
                      <option value="Other Custom Task">Other Custom Task</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide">Task Description *</label>
                    <textarea
                      value={adminTaskDescription}
                      onChange={e => setAdminTaskDescription(e.target.value)}
                      placeholder="Explain what earners need to do step by step..."
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide">Task Link / URL *</label>
                    <input
                      type="url"
                      value={adminTaskLink}
                      onChange={e => setAdminTaskLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide">Proof Requirements (optional)</label>
                    <input
                      type="text"
                      value={adminTaskProofReq}
                      onChange={e => setAdminTaskProofReq(e.target.value)}
                      placeholder="e.g. Submit a screenshot showing you followed the account."
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide">Total Slots *</label>
                    <input
                      type="number"
                      min={1}
                      value={adminTaskSlots}
                      onChange={e => setAdminTaskSlots(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide">Reward per Slot (₦) *</label>
                    <input
                      type="number"
                      min={1}
                      value={adminTaskReward}
                      onChange={e => setAdminTaskReward(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={resetAdminTaskForm} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitAdminTask}
                    disabled={adminTaskSubmitting}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold px-5 py-2 flex items-center gap-2"
                  >
                    {adminTaskSubmitting ? "Saving..." : editingAdminTask ? "Save Changes" : "Publish Task"}
                  </button>
                </div>
              </div>
            )}

            {/* Admin Tasks List */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display text-sm font-bold text-gray-900">Published Admin Tasks</h3>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                  {adminTasksList.length} total
                </span>
              </div>

              {adminTasksList.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-3">
                    <ListTodo className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-gray-500">No admin tasks yet</p>
                  <p className="text-[10px] text-gray-400 mt-1">Create your first admin task using the button above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {adminTasksList.map((task) => (
                    <div key={task.id} className="rounded-xl border border-gray-100 bg-white p-4 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-sm transition-shadow">
                      <div className="flex-1 min-w-0">
                        <span className="rounded bg-blue-50 text-[9px] font-bold text-blue-700 px-2 py-1 uppercase inline-flex items-center gap-1.5 mb-1">
                          <PlatformIcon category={task.category} size={11} />
                          <span>{task.category}</span>
                        </span>
                        <h4 className="font-display font-bold text-gray-800 mt-1 truncate">{task.title}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Slots: {task.filledSlots}/{task.totalSlots} completed • Reward: ₦{task.earningPerSlot}/slot
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          task.status === TaskStatus.ACTIVE ? "bg-blue-50 text-blue-700" :
                          task.status === TaskStatus.PAUSED ? "bg-amber-50 text-amber-700" :
                          "bg-gray-100 text-gray-500"
                        }`}>{task.status}</span>

                        {task.status !== TaskStatus.COMPLETED && (
                          <button
                            onClick={() => handleToggleAdminTask(task.id, task.status)}
                            className="rounded bg-gray-100 hover:bg-amber-50 hover:text-amber-700 px-2 py-1 font-bold text-[10px]"
                          >
                            {task.status === TaskStatus.ACTIVE ? "Pause" : "Resume"}
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEditAdminTask(task)}
                          className="rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 font-bold text-[10px] flex items-center gap-1"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>

                        <button
                          onClick={() => handleDeleteAdminTask(task.id, task.title)}
                          className="rounded bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 font-bold text-[10px] flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: WITHDRAWAL AUDITS */}
        {activeTab === "withdrawals" && (() => {
          // Pending = awaiting admin first action.
          // Approved = Paystack failed after admin approved; needs retry / mark-paid / reject.
          // History = terminal states (Paid, Rejected, Success, Failed legacy records).
          const pending  = withdrawalsList.filter(w => w.status === TransactionStatus.PENDING);
          const approved = withdrawalsList.filter(w => w.status === TransactionStatus.APPROVED);
          const history  = withdrawalsList.filter(w =>
            w.status !== TransactionStatus.PENDING &&
            w.status !== TransactionStatus.APPROVED
          );

          const statusBadge = (tx: Transaction) => {
            const map: Record<string, { cls: string; label: string }> = {
              Pending:  { cls: "bg-amber-50 text-amber-700",   label: "Pending" },
              Approved: { cls: "bg-orange-100 text-orange-700", label: "Awaiting Payment" },
              Paid:     { cls: "bg-green-100 text-green-800",  label: "Paid" },
              Success:  { cls: "bg-green-50 text-green-700",   label: "Paid" },
              Rejected: { cls: "bg-red-50 text-red-600",       label: "Rejected" },
              Failed:   { cls: "bg-red-100 text-red-700",      label: "Failed" },
            };
            const entry = map[tx.status] || { cls: "bg-gray-100 text-gray-500", label: tx.status };
            return (
              <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${entry.cls}`}>
                {entry.label}
              </span>
            );
          };

          return (
            <div className="space-y-5">

              {/* Feedback banner */}
              {withdrawalActionMsg && (
                <div className={`rounded-xl px-4 py-3 text-xs font-medium flex items-center gap-2 ${
                  withdrawalActionMsg.type === "success"
                    ? "bg-green-50 border border-green-100 text-green-700"
                    : "bg-red-50 border border-red-100 text-red-700"
                }`}>
                  {withdrawalActionMsg.type === "success" ? <CheckCircle className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}
                  <span>{withdrawalActionMsg.text}</span>
                </div>
              )}

              {/* ── Rejection reason modal ─────────────────────────────────── */}
              {rejectingWithdrawal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { setRejectingWithdrawal(null); setRejectionReason(""); }}>
                  <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                        <X className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-display text-sm font-bold text-gray-900">Reject Withdrawal</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{rejectingWithdrawal.userName} · ₦{rejectingWithdrawal.amount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-800">
                      The earner's deducted funds will be <strong>refunded</strong> to their wallet automatically. Provide a clear reason.
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Rejection Reason <span className="text-red-500">*</span></label>
                      <textarea
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        placeholder="e.g. Account details could not be verified, duplicate request, etc."
                        rows={3}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-red-400 resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setRejectingWithdrawal(null); setRejectionReason(""); }}
                        className="flex-1 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold py-2.5 hover:bg-gray-50">
                        Cancel
                      </button>
                      <button onClick={handleRejectWithdrawal} disabled={!rejectionReason.trim() || withdrawalActionLoading === rejectingWithdrawal.id}
                        className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 disabled:opacity-60 flex items-center justify-center gap-1.5">
                        <X className="h-3.5 w-3.5" />
                        {withdrawalActionLoading === rejectingWithdrawal.id ? "Rejecting…" : "Confirm Reject"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Pending requests ──────────────────────────────────────── */}
              <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-sm font-bold text-gray-900">
                    Pending Withdrawal Requests
                    {pending.length > 0 && (
                      <span className="ml-2 rounded-full bg-amber-500 text-white text-[9px] font-black px-2 py-0.5">{pending.length}</span>
                    )}
                  </h3>
                  <p className="text-[10px] text-gray-400">Approve sends funds via Paystack instantly. Reject refunds the earner's wallet in full.</p>
                </div>

                {pending.length === 0 ? (
                  <p className="text-center py-10 text-xs text-gray-400">No pending withdrawal requests — all clear!</p>
                ) : (
                  <div className="space-y-3">
                    {pending.map((tx, idx) => {
                      const isLoading = withdrawalActionLoading === tx.id;
                      return (
                        <div key={idx} className="rounded-xl border border-amber-100 bg-amber-50/30 p-4 text-xs space-y-3">
                          {/* Header row */}
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{tx.userName}</p>
                              <p className="text-gray-400 text-[10px]">Requested {new Date(tx.createdAt).toLocaleString()}</p>
                            </div>
                            <span className="font-mono font-black text-xl text-gray-900">₦{tx.amount.toLocaleString()}</span>
                          </div>

                          {/* Bank details grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                              ["Bank", tx.bankDetails?.bankName || "—"],
                              ["Account No.", tx.bankDetails?.accountNumber || "—"],
                              ["Account Name", tx.bankDetails?.accountName || "—"],
                            ].map(([label, value]) => (
                              <div key={label} className="rounded-lg bg-white border border-gray-100 px-3 py-2">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                                <p className="font-mono font-semibold text-gray-800 text-[11px]">{value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleApproveWithdrawal(tx)}
                              disabled={isLoading}
                              className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-60"
                            >
                              <Check className="h-3.5 w-3.5" />
                              {isLoading ? "Sending via Paystack…" : "Approve & Send via Paystack"}
                            </button>
                            <button
                              onClick={() => { setRejectingWithdrawal(tx); setRejectionReason(""); }}
                              disabled={isLoading}
                              className="flex-1 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-60 border border-red-100"
                            >
                              <X className="h-3.5 w-3.5" /> Reject Request
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Approved — Awaiting Payment (Paystack failed; needs action) ─── */}
              {approved.length > 0 && (
                <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display text-sm font-bold text-gray-900">
                      Approved — Awaiting Payment
                      <span className="ml-2 rounded-full bg-orange-500 text-white text-[9px] font-black px-2 py-0.5">{approved.length}</span>
                    </h3>
                  </div>
                  <p className="text-[10px] text-orange-600 mb-4">Paystack transfer failed. Retry via Paystack, mark as paid manually after a direct transfer, or reject &amp; refund the earner.</p>
                  <div className="space-y-4">
                    {approved.map((tx, idx) => {
                      const isLoading = withdrawalActionLoading === tx.id;
                      return (
                        <div key={idx} className="rounded-xl border border-orange-100 bg-orange-50/20 p-4 text-xs space-y-3">
                          {/* Header */}
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{tx.userName}</p>
                              <p className="text-gray-400 text-[10px] mt-0.5">Requested {new Date(tx.createdAt).toLocaleString()}</p>
                            </div>
                            <span className="font-mono font-black text-xl text-gray-900">₦{tx.amount.toLocaleString()}</span>
                          </div>

                          {/* Paystack error (stored in rejectionReason) */}
                          {tx.rejectionReason && (
                            <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-[10px] text-red-700">
                              <span className="font-bold">Last Paystack error: </span>{tx.rejectionReason}
                            </div>
                          )}

                          {/* Bank details */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                              ["Bank", tx.bankDetails?.bankName || "—"],
                              ["Account No.", tx.bankDetails?.accountNumber || "—"],
                              ["Account Name", tx.bankDetails?.accountName || "—"],
                            ].map(([label, value]) => (
                              <div key={label} className="rounded-lg bg-white border border-gray-100 px-3 py-2">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                                <p className="font-mono font-semibold text-gray-800 text-[11px]">{value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              onClick={() => handleApproveWithdrawal(tx)}
                              disabled={isLoading}
                              className="flex-1 min-w-[140px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-60"
                            >
                              <Check className="h-3.5 w-3.5" />
                              {isLoading ? "Sending…" : "Retry Paystack Transfer"}
                            </button>
                            <button
                              onClick={() => handleMarkPaid(tx)}
                              disabled={isLoading}
                              className="flex-1 min-w-[120px] rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-60"
                            >
                              <Check className="h-3.5 w-3.5" />
                              {isLoading ? "Updating…" : "Mark as Paid"}
                            </button>
                            <button
                              onClick={() => { setRejectingWithdrawal(tx); setRejectionReason(""); }}
                              disabled={isLoading}
                              className="flex-1 min-w-[120px] rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-60 border border-red-100"
                            >
                              <X className="h-3.5 w-3.5" /> Reject &amp; Refund
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── History ───────────────────────────────────────────────── */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="font-display text-sm font-bold text-gray-900 mb-4">
                  Withdrawal History
                  <span className="ml-2 text-[10px] font-normal text-gray-400">({history.length} records)</span>
                </h3>
                {history.length === 0 ? (
                  <p className="text-center py-8 text-xs text-gray-400">No completed withdrawals yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 uppercase text-[9px] font-bold tracking-wide">
                          <th className="py-2.5 px-2">Earner</th>
                          <th className="py-2.5 px-2">Amount</th>
                          <th className="py-2.5 px-2">Bank</th>
                          <th className="py-2.5 px-2">Account No.</th>
                          <th className="py-2.5 px-2">Account Name</th>
                          <th className="py-2.5 px-2">Date</th>
                          <th className="py-2.5 px-2">Status</th>
                          <th className="py-2.5 px-2">Paystack Ref / Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((tx, idx) => (
                          <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 text-xs">
                            <td className="py-3 px-2 font-bold text-gray-800 whitespace-nowrap">{tx.userName}</td>
                            <td className="py-3 px-2 font-mono font-bold text-gray-900 whitespace-nowrap">₦{tx.amount.toLocaleString()}</td>
                            <td className="py-3 px-2 text-gray-600">{tx.bankDetails?.bankName || "—"}</td>
                            <td className="py-3 px-2 font-mono text-gray-600">{tx.bankDetails?.accountNumber || "—"}</td>
                            <td className="py-3 px-2 text-gray-600">{tx.bankDetails?.accountName || "—"}</td>
                            <td className="py-3 px-2 text-gray-400 whitespace-nowrap">{new Date(tx.createdAt).toLocaleDateString()}</td>
                            <td className="py-3 px-2">{statusBadge(tx)}</td>
                            <td className="py-3 px-2 max-w-[180px]">
                              {tx.paystackTransferRef ? (
                                <span className="font-mono text-[10px] text-blue-600">{tx.paystackTransferRef}</span>
                              ) : tx.rejectionReason ? (
                                <span className="text-red-500 italic text-[10px]">{tx.rejectionReason}</span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          );
        })()}

        {/* TAB: AUDITING CENTER (MANUALLY APPROVE/REJECT EARNER TASK SUBMISSIONS) */}
        {activeTab === "audits" && (() => {
          const filteredAudits = submissionsList.filter(sub => {
            const matchesFilter = 
              auditFilter === "All" ||
              (auditFilter === "Pending" && sub.status === SubmissionStatus.PENDING) ||
              (auditFilter === "Approved" && sub.status === SubmissionStatus.APPROVED) ||
              (auditFilter === "Rejected" && sub.status === SubmissionStatus.REJECTED);
            const matchesSearch = 
              !auditSearch ||
              sub.taskTitle.toLowerCase().includes(auditSearch.toLowerCase()) ||
              sub.earnerName.toLowerCase().includes(auditSearch.toLowerCase());
            return matchesFilter && matchesSearch;
          });

          return (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h3 className="font-display text-sm font-bold text-gray-900">Task Submission Audits Center</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Manually review, approve, or reject earner task submissions and proof screenshots.</p>
                  </div>

                  {/* Filter & Search */}
                  <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    <div className="relative w-full sm:w-48">
                      <input 
                        type="text" 
                        placeholder="Search title/earner..."
                        value={auditSearch}
                        onChange={(e) => setAuditSearch(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="flex rounded-xl border border-gray-100 bg-gray-50 p-1 text-xs font-bold">
                      {["All", "Pending", "Approved", "Rejected"].map((f) => (
                        <button
                          key={f}
                          onClick={() => setAuditFilter(f)}
                          className={`rounded-lg px-3 py-1 transition-all cursor-pointer ${
                            auditFilter === f 
                              ? "bg-white text-blue-600 shadow-sm" 
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {filteredAudits.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-3">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-gray-500">No matching task submissions found</p>
                    <p className="text-[10px] text-gray-400 mt-1">Try resetting your filters or search query.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredAudits.map((sub) => {
                      const isPending = sub.status === SubmissionStatus.PENDING;
                      const isRejectionInputOpen = rejectingSubId === sub.id;

                      return (
                        <div key={sub.id} className="rounded-xl border border-gray-100 bg-white p-5 text-xs space-y-4 hover:shadow-md transition-shadow duration-300">
                          {/* Top Row: General Metadata */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-50 pb-3">
                            <div>
                              <span className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-700 uppercase tracking-wider mb-1.5 items-center gap-1.5">
                                <PlatformIcon category={sub.category} size={11} />
                                <span>{sub.category}</span>
                              </span>
                              <h4 className="font-display font-bold text-gray-900 text-sm">{sub.taskTitle}</h4>
                              <p className="text-gray-400 text-[10px] mt-0.5">
                                Submitted by: <span className="font-semibold text-gray-700">{sub.earnerName}</span> • {new Date(sub.submittedAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right sm:self-start">
                              <span className="font-mono font-bold text-base text-blue-600 block">₦{sub.reward}</span>
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase mt-1 ${
                                sub.status === SubmissionStatus.PENDING 
                                  ? "bg-amber-50 text-amber-600 border border-amber-100" 
                                  : sub.status === SubmissionStatus.APPROVED 
                                  ? "bg-blue-50 text-blue-600 border border-blue-100" 
                                  : "bg-red-50 text-red-600 border border-red-100"
                              }`}>
                                {sub.status}
                              </span>
                            </div>
                          </div>

                          {/* Middle Section: Submission Proofs */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                            <div className="space-y-2">
                              <p className="font-bold text-gray-600 uppercase tracking-wide text-[9px]">Proof Text/Username Provided:</p>
                              <div className="rounded-xl border border-gray-100 bg-slate-50/50 p-3.5 font-mono text-[11px] text-gray-700 whitespace-pre-wrap select-all">
                                {sub.proofText || "No text proof provided."}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="font-bold text-gray-600 uppercase tracking-wide text-[9px]">Uploaded Screenshot Proof:</p>
                              {sub.proofScreenshot ? (
                                <div className="relative group rounded-xl border border-gray-100 overflow-hidden bg-slate-50 max-h-48 flex justify-center items-center">
                                  <img 
                                    src={sub.proofScreenshot} 
                                    alt="Task Proof" 
                                    className="max-h-48 max-w-full object-contain cursor-pointer hover:scale-105 transition-transform duration-300"
                                    onClick={() => window.open(sub.proofScreenshot, "_blank")}
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                                    <span className="bg-white rounded-full px-3 py-1.5 text-[10px] font-bold text-gray-800 flex items-center gap-1 shadow-md">
                                      <Eye className="h-3.5 w-3.5" /> View Full Image
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="rounded-xl border border-dashed border-gray-200 bg-slate-50/50 py-10 text-center text-gray-400">
                                  No proof available
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Audit Feedback / Controls */}
                          {sub.feedback && (
                            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-gray-600">
                              <span className="font-bold">Auditor Note:</span> {sub.feedback}
                            </div>
                          )}

                          {isPending && (
                            <div className="border-t border-gray-50 pt-3 space-y-3">
                              {!isRejectionInputOpen ? (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleReviewSubmission(sub.id, SubmissionStatus.APPROVED)}
                                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                                  >
                                    <Check className="h-4 w-4" /> Approve & Credit Earner
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRejectingSubId(sub.id);
                                      setRejectionFeedback("");
                                    }}
                                    className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                                  >
                                    <X className="h-4 w-4" /> Reject Proof
                                  </button>
                                </div>
                              ) : (
                                <div className="bg-red-50/50 rounded-xl border border-red-100 p-3.5 space-y-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-red-700 uppercase tracking-wide mb-1">
                                      Provide Reason for Rejection
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={rejectionFeedback}
                                      onChange={(e) => setRejectionFeedback(e.target.value)}
                                      placeholder="e.g. Submitting fake screenshot. Please complete task correctly."
                                      className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-xs focus:outline-none"
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setRejectingSubId(null);
                                        setRejectionFeedback("");
                                      }}
                                      className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 font-bold transition-all cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (!rejectionFeedback.trim()) {
                                          alert("Please provide a rejection reason/feedback.");
                                          return;
                                        }
                                        handleReviewSubmission(sub.id, SubmissionStatus.REJECTED, rejectionFeedback);
                                        setRejectingSubId(null);
                                        setRejectionFeedback("");
                                      }}
                                      className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                                    >
                                      Confirm Rejection
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB 5: CMS NOTICES & BANNERS */}
        {activeTab === "announcements" && (
          <div className="space-y-6">

            {/* Login popup creator / editor */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-1">{annEditingId ? "Edit Login Popup" : "Create Login Popup Announcement"}</h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                The latest <strong>enabled</strong> announcement below is automatically shown as a popup to every Earner and Advertiser the moment they log in, before they can use their dashboard.
              </p>

              {annSuccess && <p className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs font-bold text-blue-800 mb-4">{annSuccess}</p>}
              {annError && <p className="rounded-lg bg-red-50 border border-red-100 p-3 text-xs font-bold text-red-700 mb-4">{annError}</p>}

              <form onSubmit={handlePostAnnouncement} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Popup Title</label>
                    <input 
                      type="text" 
                      required
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="e.g. Weekly Payment Audit Complete"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Alert Category Type</label>
                    <select
                      value={annType}
                      onChange={(e) => setAnnType(e.target.value as any)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none bg-white"
                    >
                      <option value="info">Info (Blue)</option>
                      <option value="success">Success (Emerald)</option>
                      <option value="warning">Warning (Amber)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Popup Message Body</label>
                  <textarea 
                    required
                    rows={3}
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    placeholder="Provide the full message shown to earners and advertisers when they log in..."
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-red-500"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Link URL (optional)</label>
                    <input
                      type="url"
                      value={annLinkUrl}
                      onChange={(e) => setAnnLinkUrl(e.target.value)}
                      placeholder="https://chat.whatsapp.com/..."
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Must start with http:// or https:// — e.g. a WhatsApp group, Telegram channel, or website link.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Button Text (optional)</label>
                    <input
                      type="text"
                      value={annButtonText}
                      onChange={(e) => setAnnButtonText(e.target.value)}
                      placeholder="e.g. Join WhatsApp Group"
                      disabled={!annLinkUrl.trim()}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Defaults to "Learn More" if left blank. Only used when a Link URL is set.</p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={annDismissible}
                    onChange={(e) => setAnnDismissible(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-gray-600">
                    Dismissible (users can close it anytime). Uncheck to require users to click "OK, Got It" before continuing.
                  </span>
                </label>

                <div className="flex items-center gap-3">
                  <button type="submit" className="rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white px-5 py-2.5">
                    {annEditingId ? "Save Changes" : "Publish Login Popup"}
                  </button>
                  {annEditingId && (
                    <button type="button" onClick={handleCancelEditAnnouncement} className="rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-600 px-5 py-2.5">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Notices list */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">All Announcements</h3>
              <div className="space-y-3">
                {announcements.length === 0 && <p className="text-xs text-gray-400">No announcements created yet.</p>}
                {announcements.map((ann) => (
                  <div key={ann.id} className="flex justify-between items-start gap-4 border-b border-gray-50 pb-3 last:border-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-800">{ann.title}</p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${ann.enabled ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-gray-100 text-gray-400 border border-gray-200"}`}>
                          {ann.enabled ? "Live Popup" : "Disabled"}
                        </span>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200">
                          {ann.dismissible ? "Dismissible" : "Requires OK"}
                        </span>
                        {ann.linkUrl && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200">
                            🔗 {ann.buttonText || "Learn More"}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{ann.content}</p>
                      {ann.linkUrl && (
                        <p className="text-[10px] text-blue-500 mt-0.5 truncate max-w-xs">{ann.linkUrl}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => handleToggleAnnouncement(ann.id)}
                        className={`text-[10px] font-bold hover:underline ${ann.enabled ? "text-amber-600" : "text-emerald-600"}`}
                      >
                        {ann.enabled ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => handleEditAnnouncement(ann)}
                        className="text-blue-600 hover:underline text-[10px] font-bold"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="text-red-600 hover:underline text-[10px] font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 6: STATIC PAGES CMS */}
        {activeTab === "cms" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-2">Static Web Pages CMS Editor</h3>
              <p className="text-xs text-gray-400 mb-6">Modify about pages, contact guidelines, FAQ lists, and legal policy texts.</p>

              <div className="flex gap-2 border-b border-gray-100 pb-4 mb-4 overflow-x-auto no-scrollbar">
                {["about", "contact", "faq", "terms", "privacy"].map((pageId, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedCMSPage(pageId)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold shrink-0 capitalize ${
                      selectedCMSPage === pageId ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {pageId} Content
                  </button>
                ))}
              </div>

              {cmsSuccess && <p className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs font-bold text-blue-800 mb-4">{cmsSuccess}</p>}

              <form onSubmit={handleUpdateCMS} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Page Headline Title</label>
                  <input 
                    type="text" 
                    required
                    value={cmsPageTitle}
                    onChange={(e) => setCmsPageTitle(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Body Text Content (Plain/Markdown support)</label>
                  <textarea 
                    required
                    rows={12}
                    value={cmsPageContent}
                    onChange={(e) => setCmsPageContent(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none font-mono"
                  ></textarea>
                </div>

                <button type="submit" className="rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white px-5 py-2.5">
                  Publish CMS Modifications
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 7: CORE SYSTEM SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-6">Global Wallet & Fee Configuration Settings</h3>

              {settingsSuccess && <p className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs font-bold text-blue-800 mb-4">{settingsSuccess}</p>}

              <form onSubmit={handleUpdateSettings} className="space-y-4 max-w-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Platform Brand Name</label>
                    <input 
                      type="text" 
                      value={settings.platformName}
                      onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs focus:outline-none font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Earner Referral Reward (₦)</label>
                    <input 
                      type="number" 
                      value={0}
                      disabled
                      readOnly
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs focus:outline-none font-mono text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">Disabled platform-wide — earners no longer receive a commission for referrals.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Min Payout Limit (₦)</label>
                    <input 
                      type="number" 
                      value={settings.minWithdrawal}
                      onChange={(e) => setSettings({ ...settings, minWithdrawal: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Flat Payout Fee (₦)</label>
                    <input 
                      type="number" 
                      value={settings.withdrawalFee}
                      onChange={(e) => setSettings({ ...settings, withdrawalFee: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Min Deposit Limit (₦)</label>
                    <input 
                      type="number" 
                      value={settings.minDeposit}
                      onChange={(e) => setSettings({ ...settings, minDeposit: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Support Email Desk</label>
                    <input 
                      type="email" 
                      value={settings.contactEmail}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Support Phone</label>
                    <input 
                      type="text" 
                      value={settings.contactPhone}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">WhatsApp Chat/Group Link</label>
                    <input 
                      type="text" 
                      value={settings.whatsappGroup || ""}
                      onChange={(e) => setSettings({ ...settings, whatsappGroup: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs focus:outline-none"
                      placeholder="e.g. https://wa.me/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Telegram Support Link</label>
                    <input 
                      type="text" 
                      value={settings.telegramChannel || ""}
                      onChange={(e) => setSettings({ ...settings, telegramChannel: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs focus:outline-none"
                      placeholder="e.g. https://t.me/..."
                    />
                  </div>
                </div>

                <button type="submit" className="rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white px-5 py-3 shadow transition-all">
                  Save Core System Rules
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "platforms" && (
          <div className="space-y-6 animate-fadeIn">
            <AdminSocialPlatforms apiFetch={apiFetch} />
          </div>
        )}

        {activeTab === "pricing" && (
          <div className="space-y-6 animate-fadeIn">
            <AdminTaskPricing apiFetch={apiFetch} onAddPlatform={() => setActiveTab("platforms")} />
          </div>
        )}

        {activeTab === "platform-earnings" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="font-display text-lg font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" /> Platform Earnings & Wallet
                </h2>
                <p className="text-xs text-slate-500">Manage owner withdrawal settings, view platform revenues, and transfer commissions.</p>
              </div>
              <button
                onClick={() => {
                  setShowWithdrawForm(true);
                  setWithdrawError("");
                  setWithdrawSuccess("");
                }}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white px-5 py-2.5 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <CreditCard className="h-4 w-4" /> Withdraw Earnings
              </button>
            </div>

            {/* Withdrawal form inline card */}
            {showWithdrawForm && (
              <form onSubmit={handleWithdrawEarnings} className="rounded-2xl border border-blue-100 bg-blue-50/10 p-5 shadow-sm space-y-4 border-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-display text-sm font-bold text-blue-900">Owner Wallet Withdrawal</h4>
                    <p className="text-xs text-blue-600">Withdraw platform commission and service fees directly to your bank account.</p>
                  </div>
                  <button type="button" onClick={() => setShowWithdrawForm(false)} className="rounded-full bg-gray-200 p-1 text-gray-700">✕</button>
                </div>

                {withdrawError && (
                  <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-lg">{withdrawError}</p>
                )}
                {withdrawSuccess && (
                  <p className="text-xs font-bold text-blue-600 bg-blue-50 p-2.5 rounded-lg">{withdrawSuccess}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Select Bank</label>
                    <select
                      value={withdrawBankCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setWithdrawBankCode(code);
                        const found = banksList.find(b => b.code === code);
                        setWithdrawBankName(found ? found.name : "");
                        setIsBankVerified(false);
                        setWithdrawAccountName("");
                        setBankVerificationError("");
                      }}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
                      required
                    >
                      <option value="">-- Choose Nigerian Bank --</option>
                      {banksList.map((b) => (
                        <option key={b.code} value={b.code}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Account Number</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={10}
                        value={withdrawAccountNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setWithdrawAccountNumber(val);
                          setIsBankVerified(false);
                          setWithdrawAccountName("");
                          setBankVerificationError("");
                        }}
                        placeholder="10-digit NUBAN"
                        className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-mono focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleVerifyBankAccount}
                        disabled={isVerifyingBank || withdrawAccountNumber.length !== 10 || !withdrawBankCode}
                        className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold px-4 py-2 disabled:bg-gray-200 disabled:text-gray-400 transition-colors cursor-pointer"
                      >
                        {isVerifyingBank ? "Verifying..." : "Verify"}
                      </button>
                    </div>
                    {bankVerificationError && (
                      <p className="text-[10px] text-red-600 font-semibold">{bankVerificationError}</p>
                    )}
                  </div>

                  {withdrawAccountName && (
                    <div className="col-span-1 md:col-span-2 bg-blue-500/5 border border-blue-100 rounded-xl p-3 flex items-center justify-between animate-fadeIn">
                      <div>
                        <span className="block text-[9px] font-bold text-blue-600 uppercase">Verified Account Holder</span>
                        <span className="font-bold text-xs text-blue-800 uppercase tracking-wide">{withdrawAccountName}</span>
                      </div>
                      <span className="bg-blue-500 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                        ✓ Verified
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Withdrawal Amount (₦)</label>
                    <input
                      type="number"
                      required
                      value={withdrawAmountInput}
                      onChange={(e) => setWithdrawAmountInput(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-mono focus:outline-none"
                    />
                    <p className="text-[10px] text-gray-400">Available Balance: ₦{platformStats.availableBalance.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWithdrawForm(false);
                      setWithdrawAccountNumber("");
                      setWithdrawAccountName("");
                      setWithdrawBankCode("");
                      setWithdrawBankName("");
                      setIsBankVerified(false);
                      setBankVerificationError("");
                    }}
                    className="rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-600 px-4 py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    disabled={!isBankVerified || !withdrawAmountInput || isVerifyingBank}
                  >
                    Confirm & Record Withdrawal
                  </button>
                </div>
              </form>
            )}

            {/* Metric grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Available Balance</span>
                <span className="block font-mono text-xl sm:text-2xl font-black text-blue-600 mt-1">₦{platformStats.availableBalance.toLocaleString()}</span>
                <p className="text-[10px] text-gray-400 mt-1">Ready for withdrawal</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Total Platform Revenue</span>
                <span className="block font-mono text-xl sm:text-2xl font-black text-gray-800 mt-1">₦{platformStats.totalPlatformRevenue.toLocaleString()}</span>
                <p className="text-[10px] text-gray-400 mt-1">All commission + service fees</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Total Withdrawn</span>
                <span className="block font-mono text-xl sm:text-2xl font-black text-blue-600 mt-1">₦{platformStats.totalWithdrawn.toLocaleString()}</span>
                <p className="text-[10px] text-gray-400 mt-1">Disbursed to bank accounts</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Pending Withdrawals</span>
                <span className="block font-mono text-xl sm:text-2xl font-black text-amber-500 mt-1">₦{platformStats.pendingWithdrawalAmount.toLocaleString()}</span>
                <p className="text-[10px] text-gray-400 mt-1">Awaiting bank settlement</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Lifetime Revenue</span>
                <span className="block font-mono text-xl font-bold text-slate-700 mt-1">₦{platformStats.lifetimeRevenue.toLocaleString()}</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Today's Revenue</span>
                <span className="block font-mono text-xl font-bold text-slate-700 mt-1">₦{platformStats.todayRevenue.toLocaleString()}</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">This Month's Revenue</span>
                <span className="block font-mono text-xl font-bold text-slate-700 mt-1">₦{platformStats.thisMonthRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* Commission source breakdown */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/20 p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5" /> Admin Balance Breakdown (All Commission Sources)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-white border border-blue-100 p-4 space-y-1">
                  <span className="block text-[10px] font-bold text-blue-600 uppercase">Earner Activation Fees</span>
                  <span className="block font-mono text-lg font-black text-blue-700">₦{(platformStats.totalActivationFees || 0).toLocaleString()}</span>
                  <span className="block text-[10px] text-gray-400">{platformStats.activatedEarnersCount || 0} earners × ₦500</span>
                </div>
                <div className="rounded-xl bg-white border border-green-100 p-4 space-y-1">
                  <span className="block text-[10px] font-bold text-green-700 uppercase">Task Commission</span>
                  <span className="block font-mono text-lg font-black text-green-700">₦{(platformStats.totalCommission || 0).toLocaleString()}</span>
                  <span className="block text-[10px] text-gray-400">Cost-per-slot minus earner reward</span>
                </div>
                <div className="rounded-xl bg-white border border-amber-100 p-4 space-y-1">
                  <span className="block text-[10px] font-bold text-amber-700 uppercase">Withdrawal Fees</span>
                  <span className="block font-mono text-lg font-black text-amber-600">₦{(platformStats.totalWithdrawalFees || 0).toLocaleString()}</span>
                  <span className="block text-[10px] text-gray-400">₦{100} flat fee per approved withdrawal</span>
                </div>
              </div>
            </div>

            {/* Split screen for Bank accounts and Withdrawal history */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Withdrawal history - 2 cols on lg screens */}
              <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
                <h3 className="font-display text-sm font-bold text-slate-900">Owner Withdrawal History</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase text-[9px] font-bold">
                        <th className="py-2.5 px-1">Withdrawal ID</th>
                        <th className="py-2.5 px-1">Bank Info</th>
                        <th className="py-2.5 px-1">Ref</th>
                        <th className="py-2.5 px-1">Date</th>
                        <th className="py-2.5 px-1">Amount</th>
                        <th className="py-2.5 px-1">Status</th>
                        <th className="py-2.5 px-1 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {ownerWithdrawals.map((wd) => (
                        <tr key={wd.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-1 font-mono font-bold text-[10px]">{wd.id}</td>
                          <td className="py-3 px-1">
                            <p className="font-semibold text-slate-800">{wd.bankName}</p>
                            <p className="text-[10px] text-gray-400">{wd.accountNumber} ({wd.accountName})</p>
                          </td>
                          <td className="py-3 px-1 font-mono text-[10px] text-gray-500">{wd.reference}</td>
                          <td className="py-3 px-1 text-gray-400">{new Date(wd.submittedAt).toLocaleDateString()}</td>
                          <td className="py-3 px-1 font-mono font-bold text-gray-900">₦{wd.amount.toLocaleString()}</td>
                          <td className="py-3 px-1">
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              wd.status === "Success" || wd.status === "Approved" 
                                ? "bg-blue-50 text-blue-600" 
                                : wd.status === "Pending" 
                                ? "bg-amber-50 text-amber-600" 
                                : "bg-red-50 text-red-600"
                            }`}>
                              {wd.status}
                            </span>
                          </td>
                          <td className="py-3 px-1 text-right">
                            {wd.status === "Pending" && (
                              <div className="flex gap-1 justify-end">
                                <button
                                  onClick={() => handleUpdateOwnerWithdrawalStatus(wd.id, "Success")}
                                  className="rounded bg-blue-50 hover:bg-blue-100 text-[10px] text-blue-700 font-bold px-1.5 py-0.5 cursor-pointer"
                                >
                                  Mark Sent
                                </button>
                                <button
                                  onClick={() => handleUpdateOwnerWithdrawalStatus(wd.id, "Rejected")}
                                  className="rounded bg-red-50 hover:bg-red-100 text-[10px] text-red-700 font-bold px-1.5 py-0.5 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {ownerWithdrawals.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-gray-400">No withdrawal records.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bank Settings - 1 col on lg screens */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-display text-sm font-bold text-slate-900">Bank Accounts</h3>
                  <button
                    onClick={() => {
                      setShowBankForm(!showBankForm);
                      setEditingBankAccount(null);
                      setBankNameInput("");
                      setBankAccountNumberInput("");
                      setBankAccountNameInput("");
                      setBankIsDefaultInput(false);
                      setBankFormError("");
                      setBankFormSuccess("");
                    }}
                    className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    {showBankForm ? "Close Form" : "+ Add Account"}
                  </button>
                </div>

                {showBankForm && (
                  <form onSubmit={handleAddOrEditBankAccount} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 animate-fadeIn">
                    <h4 className="text-xs font-bold text-slate-800">{editingBankAccount ? "Modify Account" : "Add Bank Account"}</h4>
                    
                    {bankFormError && (
                      <p className="text-[10px] font-semibold text-red-600">{bankFormError}</p>
                    )}
                    {bankFormSuccess && (
                      <p className="text-[10px] font-semibold text-blue-600">{bankFormSuccess}</p>
                    )}

                    <div className="space-y-2">
                      <input
                        type="text"
                        required
                        placeholder="Bank Name (e.g. GTBank)"
                        value={bankNameInput}
                        onChange={(e) => setBankNameInput(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Account Number (10 digits)"
                        value={bankAccountNumberInput}
                        onChange={(e) => setBankAccountNumberInput(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-mono focus:outline-none"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Account Name"
                        value={bankAccountNameInput}
                        onChange={(e) => setBankAccountNameInput(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none"
                      />
                      <label className="flex items-center gap-2 text-xs text-gray-600 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bankIsDefaultInput}
                          onChange={(e) => setBankIsDefaultInput(e.target.checked)}
                          className="rounded text-blue-500 cursor-pointer"
                        />
                        <span>Set as Default account</span>
                      </label>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowBankForm(false)}
                        className="rounded-lg bg-gray-200 text-gray-600 px-3 py-1 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 text-xs font-bold cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3 max-h-[30rem] overflow-y-auto">
                  {ownerBankAccounts.map((ba) => (
                    <div key={ba.id} className="border border-gray-100 rounded-xl p-3 bg-slate-50/50 space-y-2 relative">
                      <div className="flex justify-between items-start pr-12">
                        <div>
                          <p className="font-bold text-xs text-slate-800">{ba.bankName}</p>
                          <p className="font-mono text-xs text-slate-500">{ba.accountNumber}</p>
                          <p className="text-[10px] text-slate-400">{ba.accountName}</p>
                        </div>
                        {ba.isDefault && (
                          <span className="bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded absolute top-3 right-3">Default</span>
                        )}
                      </div>

                      <div className="flex gap-2 text-[10px] font-bold">
                        {!ba.isDefault && (
                          <button
                            onClick={() => handleSetDefaultBank(ba.id)}
                            className="text-blue-600 hover:underline cursor-pointer"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleEditBankClick(ba)}
                          className="text-slate-500 hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBankAccount(ba.id)}
                          className="text-red-600 hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {ownerBankAccounts.length === 0 && (
                    <p className="text-center text-xs text-gray-400 py-6">No saved bank accounts.</p>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* COMMISSION LEDGER TAB */}
        {activeTab === "commissions" && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="font-display text-lg font-black text-slate-900 flex items-center gap-2">
                <BadgePercent className="h-5 w-5 text-blue-500" /> Admin Commission Ledger
              </h2>
              <p className="text-xs text-slate-500">All platform commissions auto-credited on every verified transaction. Permanently stored.</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Total Earned (Lifetime)</span>
                <span className="block font-mono text-xl sm:text-2xl font-black text-blue-600 mt-1">₦{platformStats.lifetimeRevenue.toLocaleString()}</span>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-emerald-600 uppercase">Available Balance</span>
                <span className="block font-mono text-xl sm:text-2xl font-black text-emerald-600 mt-1">₦{platformStats.availableBalance.toLocaleString()}</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Total Withdrawn</span>
                <span className="block font-mono text-xl sm:text-2xl font-black text-slate-700 mt-1">₦{platformStats.totalWithdrawn.toLocaleString()}</span>
              </div>
              <div className="rounded-2xl border border-orange-100 bg-orange-50/20 p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-orange-600 uppercase">Activation Fees</span>
                <span className="block font-mono text-xl sm:text-2xl font-black text-orange-600 mt-1">₦{platformStats.totalActivationFees.toLocaleString()}</span>
                <span className="block text-[10px] text-orange-400 mt-0.5">{platformStats.activatedEarnersCount} earners activated</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Task Commissions</span>
                <span className="block font-mono text-xl sm:text-2xl font-black text-indigo-600 mt-1">₦{(platformStats.totalCommission || 0).toLocaleString()}</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Withdrawal Fees</span>
                <span className="block font-mono text-xl sm:text-2xl font-black text-purple-600 mt-1">₦{(platformStats.totalWithdrawalFees || 0).toLocaleString()}</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Today's Earnings</span>
                <span className="block font-mono text-xl sm:text-2xl font-black text-slate-700 mt-1">₦{platformStats.todayRevenue.toLocaleString()}</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">This Month</span>
                <span className="block font-mono text-xl sm:text-2xl font-black text-slate-700 mt-1">₦{platformStats.thisMonthRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* Commission Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {["all", "activation_fee", "task_commission", "withdrawal_fee"].map((f) => (
                <button
                  key={f}
                  onClick={() => setCommissionFilter(f)}
                  className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    commissionFilter === f ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {f === "all" ? "All Entries" : f === "activation_fee" ? "Activation Fees" : f === "task_commission" ? "Task Commissions" : "Withdrawal Fees"}
                </button>
              ))}
              <button
                onClick={() => fetchCommissions()}
                className="ml-auto rounded-full px-3 py-1.5 text-[10px] font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer transition-all"
              >
                ↻ Refresh
              </button>
            </div>

            {/* Commission History Table */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              {commissionsList.filter(c => commissionFilter === "all" || c.type === commissionFilter).length === 0 ? (
                <div className="py-12 text-center">
                  <BadgePercent className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">No commission records yet.</p>
                  <p className="text-xs text-slate-300 mt-1">Commissions are auto-credited when transactions are verified.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table>
                    <thead>
                      <tr>
                        <th className="text-left">Type</th>
                        <th className="text-left">Description</th>
                        <th className="text-left">User</th>
                        <th className="text-right">Amount</th>
                        <th className="text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissionsList
                        .filter(c => commissionFilter === "all" || c.type === commissionFilter)
                        .map((c) => (
                          <tr key={c.id}>
                            <td>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                c.type === "activation_fee" ? "bg-orange-50 text-orange-700 border border-orange-100" :
                                c.type === "task_commission" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                                "bg-purple-50 text-purple-700 border border-purple-100"
                              }`}>
                                {c.type === "activation_fee" ? "Activation" : c.type === "task_commission" ? "Task" : "Withdrawal"}
                              </span>
                            </td>
                            <td className="max-w-xs truncate">{c.description}</td>
                            <td>{c.userName || <span className="text-slate-300">—</span>}</td>
                            <td className="text-right font-mono font-bold text-emerald-600">+₦{c.amount.toLocaleString()}</td>
                            <td className="text-slate-400">{new Date(c.createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: ADVERTISER MANAGEMENT */}
        {activeTab === "advertisers" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-sm font-bold text-gray-900">Advertiser Management</h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  {usersList.filter((u: any) => u.role === "Advertiser").length} advertisers
                </span>
              </div>
              {usersList.filter((u: any) => u.role === "Advertiser").length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">No advertisers registered yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase text-[9px] font-bold">
                        <th className="py-3 px-2">Name</th>
                        <th className="py-3 px-2">Email</th>
                        <th className="py-3 px-2">Business</th>
                        <th className="py-3 px-2">Wallet</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.filter((u: any) => u.role === "Advertiser").map((u: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-3 px-2 font-bold text-gray-800">{u.name}</td>
                          <td className="py-3 px-2 text-gray-500">{u.email}</td>
                          <td className="py-3 px-2 text-gray-500">{u.businessName || "—"}</td>
                          <td className="py-3 px-2 font-mono font-bold text-blue-600">₦{(u.walletBalance || 0).toLocaleString()}</td>
                          <td className="py-3 px-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              u.isVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                            }`}>
                              {u.isVerified ? "Verified" : "Unverified"}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleToggleVerification(u)}
                                className="rounded-lg border border-gray-200 px-2 py-1 text-[10px] font-bold hover:bg-gray-50 transition-colors cursor-pointer">
                                {u.isVerified ? "Unverify" : "Verify"}
                              </button>
                              <button onClick={() => setSelectedUserForBalance(u)}
                                className="rounded-lg border border-blue-100 px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer">
                                Adjust
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {selectedUserForBalance && (
              <form onSubmit={handleAdjustBalance} className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm space-y-3">
                <h4 className="text-sm font-bold text-blue-900">Adjust Balance for {selectedUserForBalance.name}</h4>
                <input type="number" required value={adjustBalanceAmount} onChange={e => setAdjustBalanceAmount(e.target.value)}
                  placeholder="New wallet balance (₦)" className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm focus:outline-none bg-white" />
                <div className="flex gap-3">
                  <button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-bold text-white transition-all">Apply</button>
                  <button type="button" onClick={() => setSelectedUserForBalance(null)} className="rounded-xl border border-gray-200 px-5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB: NOTIFICATIONS PAGE */}
        {activeTab === "notifications" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-500" />
                  <h3 className="font-display text-sm font-bold text-gray-900">Notifications ({unreadCount} unread)</h3>
                </div>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead}
                    className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-700 hover:bg-blue-100 transition-all cursor-pointer">
                    <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-10 w-10 mx-auto stroke-1 mb-3 opacity-20 text-slate-400" />
                  <p className="text-sm font-bold text-slate-400">All quiet — no notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 space-y-0">
                  {notifications.map((notif) => (
                    <div key={notif.id} onClick={() => handleNotificationClick(notif)}
                      className={`py-4 px-3 rounded-xl transition-all flex gap-3 cursor-pointer items-start ${
                        notif.read ? "hover:bg-slate-50/50" : "bg-blue-50/40 hover:bg-blue-50"
                      }`}>
                      <div className={`rounded-full p-2 shrink-0 ${notif.type === "submission" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}`}>
                        {notif.type === "submission" ? <ShieldAlert className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-tight ${notif.read ? "text-slate-600 font-medium" : "text-slate-900 font-bold"}`}>{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(notif.createdAt).toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {!notif.read && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-2" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: REPORTS */}
        {activeTab === "reports" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Earners", value: stats.earnersCount, color: "text-slate-800" },
                { label: "Total Advertisers", value: stats.advertisersCount, color: "text-slate-800" },
                { label: "Active Campaigns", value: stats.tasksCount, color: "text-blue-600" },
                { label: "Pending Withdrawals", value: `₦${stats.pendingWithdrawals.toLocaleString()}`, color: "text-amber-600" },
                { label: "Total Earner Payouts", value: `₦${stats.totalEarned.toLocaleString()}`, color: "text-blue-600" },
                { label: "Total Ad Deposits", value: `₦${stats.totalDeposited.toLocaleString()}`, color: "text-indigo-600" },
                { label: "Platform Revenue", value: `₦${platformStats.totalPlatformRevenue.toLocaleString()}`, color: "text-emerald-600" },
                { label: "Pending Audits", value: submissionsList.filter(s => s.status === SubmissionStatus.PENDING).length, color: "text-rose-600" },
              ].map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">{item.label}</span>
                  <span className={`block font-mono text-lg font-black mt-1 ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="font-display text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider mb-4">
                  <ArrowDownCircle className="h-4 w-4 text-blue-500" /> Recent Deposits
                </h3>
                {depositsList.length === 0 ? (
                  <p className="text-center py-4 text-xs text-gray-400">No deposits.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {depositsList.slice(0, 10).map((dep, idx) => (
                      <div key={idx} className="flex justify-between text-xs border-b border-gray-50 pb-2">
                        <div>
                          <p className="font-bold text-gray-800">{dep.userName}</p>
                          <p className="text-[10px] text-gray-400">{new Date(dep.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="font-mono font-bold text-blue-600">+₦{dep.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="font-display text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider mb-4">
                  <Share2 className="h-4 w-4 text-blue-500" /> Recent Referrals
                </h3>
                {referralsList.length === 0 ? (
                  <p className="text-center py-4 text-xs text-gray-400">No referrals yet.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {referralsList.slice(0, 10).map((ref: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs border-b border-gray-50 pb-2">
                        <div>
                          <p className="font-bold text-gray-800">{ref.refereeName}</p>
                          <p className="text-[10px] text-gray-400">Referred by: {ref.referrerName}</p>
                        </div>
                        <span className="font-mono font-bold text-indigo-600">₦{ref.rewardEarned}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: PROFILE */}
        {activeTab === "demo-accounts" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-1">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase" style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.20)", color: "#818cf8" }}>
                  Super Admin Only
                </span>
              </div>
              <h3 className="font-display text-sm font-bold text-gray-900 mt-2 mb-1">🔑 Demo Account Access</h3>
              <p className="text-xs text-slate-400 mb-6">Log in as a demo user to test the platform experience. These controls are hidden from all public pages — visible only to you.</p>

              {demoError && (
                <div className="rounded-xl p-3 text-xs font-bold mb-4" style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.20)", color: "#fb7185" }}>
                  {demoError}
                </div>
              )}

              <div className="space-y-4">

                {/* Demo Earner */}
                <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(59,130,246,0.04)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-700">👥 Demo Earner</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">earner@tasksearn.com</p>
                    </div>
                    {!showEarnerPwd && (
                      <button type="button" onClick={() => { setShowEarnerPwd(true); setDemoError(""); }}
                        className="rounded-full px-4 py-1.5 text-xs font-bold cursor-pointer transition-all"
                        style={{ background: "rgba(37,99,235,0.10)", color: "#2563EB", border: "1px solid rgba(37,99,235,0.20)" }}>
                        Sign In As Earner
                      </button>
                    )}
                  </div>
                  {showEarnerPwd && (
                    <div className="flex gap-2 items-center">
                      <input type="password" value={earnerPwd} onChange={(e) => setEarnerPwd(e.target.value)}
                        placeholder="Enter earner password..." autoFocus
                        className="flex-1 rounded-lg px-3 py-2 text-xs border border-slate-200 focus:border-blue-400 focus:outline-none"
                        onKeyDown={(e) => { if (e.key === "Enter") handleAdminDemoLogin("earner@tasksearn.com", earnerPwd); }}
                      />
                      <button type="button" onClick={() => handleAdminDemoLogin("earner@tasksearn.com", earnerPwd)}
                        disabled={demoLoading || !earnerPwd.trim()}
                        className="rounded-lg px-4 py-2 text-xs font-bold text-white cursor-pointer shrink-0 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#2563EB,#1d4ed8)" }}>
                        {demoLoading ? "..." : "Verify"}
                      </button>
                      <button type="button" onClick={() => { setShowEarnerPwd(false); setEarnerPwd(""); setDemoError(""); }}
                        className="rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer text-slate-400 hover:text-slate-600">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Demo Advertiser */}
                <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-700">📢 Demo Advertiser</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">advertiser@tasksearn.com</p>
                    </div>
                    {!showAdvertiserPwd && (
                      <button type="button" onClick={() => { setShowAdvertiserPwd(true); setDemoError(""); }}
                        className="rounded-full px-4 py-1.5 text-xs font-bold cursor-pointer transition-all"
                        style={{ background: "rgba(99,102,241,0.10)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.20)" }}>
                        Sign In As Advertiser
                      </button>
                    )}
                  </div>
                  {showAdvertiserPwd && (
                    <div className="flex gap-2 items-center">
                      <input type="password" value={advertiserPwd} onChange={(e) => setAdvertiserPwd(e.target.value)}
                        placeholder="Enter advertiser password..." autoFocus
                        className="flex-1 rounded-lg px-3 py-2 text-xs border border-slate-200 focus:border-indigo-400 focus:outline-none"
                        onKeyDown={(e) => { if (e.key === "Enter") handleAdminDemoLogin("advertiser@tasksearn.com", advertiserPwd); }}
                      />
                      <button type="button" onClick={() => handleAdminDemoLogin("advertiser@tasksearn.com", advertiserPwd)}
                        disabled={demoLoading || !advertiserPwd.trim()}
                        className="rounded-lg px-4 py-2 text-xs font-bold text-white cursor-pointer shrink-0 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
                        {demoLoading ? "..." : "Verify"}
                      </button>
                      <button type="button" onClick={() => { setShowAdvertiserPwd(false); setAdvertiserPwd(""); setDemoError(""); }}
                        className="rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer text-slate-400 hover:text-slate-600">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Demo Admin */}
                <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-700">🛡️ Super Admin</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">admin@tasksearn.com</p>
                    </div>
                    {!showAdminPwd && (
                      <button type="button" onClick={() => { setShowAdminPwd(true); setDemoError(""); }}
                        className="rounded-full px-4 py-1.5 text-xs font-bold cursor-pointer transition-all"
                        style={{ background: "rgba(16,185,129,0.10)", color: "#059669", border: "1px solid rgba(16,185,129,0.20)" }}>
                        Sign In As Admin
                      </button>
                    )}
                  </div>
                  {showAdminPwd && (
                    <div className="flex gap-2 items-center">
                      <input type="password" value={adminPwd} onChange={(e) => setAdminPwd(e.target.value)}
                        placeholder="Enter admin password..." autoFocus
                        className="flex-1 rounded-lg px-3 py-2 text-xs border border-slate-200 focus:border-emerald-400 focus:outline-none"
                        onKeyDown={(e) => { if (e.key === "Enter") handleAdminDemoLogin("admin@tasksearn.com", adminPwd); }}
                      />
                      <button type="button" onClick={() => handleAdminDemoLogin("admin@tasksearn.com", adminPwd)}
                        disabled={demoLoading || !adminPwd.trim()}
                        className="rounded-lg px-4 py-2 text-xs font-bold text-white cursor-pointer shrink-0 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                        {demoLoading ? "..." : "Verify"}
                      </button>
                      <button type="button" onClick={() => { setShowAdminPwd(false); setAdminPwd(""); setDemoError(""); }}
                        className="rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer text-slate-400 hover:text-slate-600">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* BROADCAST EMAIL TAB */}
        {activeTab === "broadcast" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="font-display text-lg font-black text-slate-900 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-500" /> Broadcast Email
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Send emails to earners, advertisers, or selected users in batches via Resend.</p>
              </div>
              <button
                onClick={() => { setShowBroadcastHistory(v => !v); if (!showBroadcastHistory) fetchBroadcastLogs(); }}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              >
                <History className="h-4 w-4" /> {showBroadcastHistory ? "Hide" : "Show"} History
              </button>
            </div>

            {/* History panel */}
            {showBroadcastHistory && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display text-sm font-bold text-slate-800 flex items-center gap-2"><History className="h-4 w-4 text-slate-400" /> Past Broadcasts</h3>
                  <button onClick={fetchBroadcastLogs} disabled={broadcastLogsLoading} className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 disabled:opacity-40">
                    <RefreshCw className={`h-3.5 w-3.5 ${broadcastLogsLoading ? "animate-spin" : ""}`} /> Refresh
                  </button>
                </div>
                {broadcastLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No broadcasts sent yet.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {broadcastLogs.map(log => (
                      <div key={log.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{log.subject}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Target: <span className="capitalize font-semibold text-slate-600">{log.target}</span>
                            {" · "}{new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <MailCheck className="h-3.5 w-3.5" /> {log.sentCount} sent
                          </span>
                          {log.failedCount > 0 && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-red-500">
                              <MailX className="h-3.5 w-3.5" /> {log.failedCount} failed
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">{log.totalRecipients} total</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Compose form */}
            <form onSubmit={handleSendBroadcast} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
              <h3 className="font-display text-sm font-bold text-slate-800 flex items-center gap-2"><Send className="h-4 w-4 text-blue-500" /> Compose Broadcast</h3>

              {/* Target selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recipients</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(["earners", "advertisers", "all", "selected"] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setBroadcastTarget(t); setBroadcastSelectedUsers([]); setBroadcastUserSearch(""); }}
                      className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-all capitalize ${
                        broadcastTarget === t
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {t === "all" ? "All Users" : t === "selected" ? "Select Users" : `All ${t.charAt(0).toUpperCase() + t.slice(1)}s`}
                    </button>
                  ))}
                </div>
              </div>

              {/* User picker for "selected" target */}
              {broadcastTarget === "selected" && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Search & Select Users</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search name or email…"
                      value={broadcastUserSearch}
                      onChange={e => setBroadcastUserSearch(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
                    {usersList
                      .filter(u => u.role !== "Admin" && (
                        u.name?.toLowerCase().includes(broadcastUserSearch.toLowerCase()) ||
                        u.email?.toLowerCase().includes(broadcastUserSearch.toLowerCase())
                      ))
                      .slice(0, 30)
                      .map(u => (
                        <label key={u.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-blue-50/50 transition-colors">
                          <input
                            type="checkbox"
                            checked={broadcastSelectedUsers.includes(u.id)}
                            onChange={e => {
                              if (e.target.checked) setBroadcastSelectedUsers(prev => [...prev, u.id]);
                              else setBroadcastSelectedUsers(prev => prev.filter(id => id !== u.id));
                            }}
                            className="rounded accent-blue-600"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{u.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${u.role === "Earner" ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-purple-600"}`}>{u.role}</span>
                        </label>
                      ))}
                    {usersList.filter(u => u.role !== "Admin").length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">No users found. Load the Users tab first.</p>
                    )}
                  </div>
                  {broadcastSelectedUsers.length > 0 && (
                    <p className="text-[11px] font-bold text-blue-600">{broadcastSelectedUsers.length} user{broadcastSelectedUsers.length !== 1 ? "s" : ""} selected</p>
                  )}
                </div>
              )}

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subject</label>
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={e => setBroadcastSubject(e.target.value)}
                  placeholder="e.g. Important update from TasksEarn"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  required
                />
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Body <span className="normal-case text-slate-300">(HTML supported)</span></label>
                <textarea
                  value={broadcastHtml}
                  onChange={e => setBroadcastHtml(e.target.value)}
                  rows={8}
                  placeholder={`<p>Hello,</p>\n<p>We have an exciting update for you...</p>`}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-blue-400 resize-y"
                  required
                />
              </div>

              {/* Preview strip */}
              {broadcastHtml.trim() && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preview</label>
                  <div
                    className="rounded-xl border border-dashed border-blue-200 bg-blue-50/30 p-4 text-sm overflow-auto max-h-48"
                    dangerouslySetInnerHTML={{ __html: broadcastHtml }}
                  />
                </div>
              )}

              {/* Error */}
              {broadcastError && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs font-bold text-red-600">{broadcastError}</div>
              )}

              {/* Result */}
              {broadcastResult && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-4 space-y-2">
                  <p className="text-xs font-black text-emerald-700 flex items-center gap-2"><MailCheck className="h-4 w-4" /> Broadcast sent successfully!</p>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <span className="font-semibold text-slate-600">Total recipients: <strong>{broadcastResult.totalRecipients}</strong></span>
                    <span className="font-semibold text-emerald-600">Delivered: <strong>{broadcastResult.sentCount}</strong></span>
                    {broadcastResult.failedCount > 0 && (
                      <span className="font-semibold text-red-500">Failed: <strong>{broadcastResult.failedCount}</strong></span>
                    )}
                  </div>
                  {broadcastResult.failedEmails.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-[10px] font-bold text-red-500 cursor-pointer">View failed deliveries ({broadcastResult.failedEmails.length})</summary>
                      <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                        {broadcastResult.failedEmails.map((f, i) => (
                          <div key={i} className="text-[10px] text-red-600 bg-red-50 rounded px-2 py-1">
                            <span className="font-mono">{f.email}</span> — {f.reason}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <p className="text-[10px] text-slate-400">Emails are sent in batches of 10 via Resend. The admin panel stays responsive throughout.</p>
                <button
                  type="submit"
                  disabled={broadcastSending}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold px-6 py-2.5 shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {broadcastSending ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Sending…</>
                  ) : (
                    <><Send className="h-4 w-4" /> Send Broadcast</>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Admin Profile Card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-6">Admin Profile</h3>
              <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
                <div className="h-16 w-16 rounded-full flex items-center justify-center text-white font-display text-2xl font-black shadow-sm"
                  style={{ background: "linear-gradient(135deg,#1e3a8a,#2563EB)" }}>
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                  <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                    ⚡ Super Admin
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Total Earners", value: stats.earnersCount },
                  { label: "Total Advertisers", value: stats.advertisersCount },
                  { label: "Active Campaigns", value: stats.tasksCount },
                  { label: "Platform Revenue", value: `₦${platformStats.totalPlatformRevenue.toLocaleString()}` },
                  { label: "Available Balance", value: `₦${platformStats.availableBalance.toLocaleString()}` },
                  { label: "Pending Withdrawals", value: `₦${stats.pendingWithdrawals.toLocaleString()}` },
                ].map((item, idx) => (
                  <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">{item.label}</span>
                    <span className="block font-mono text-sm font-black text-gray-800 mt-1">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  </div>
  );
}
