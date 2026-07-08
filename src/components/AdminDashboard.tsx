import React from "react";
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
  Clock
} from "lucide-react";

interface AdminDashboardProps {
  user: User;
  onRefreshUser: () => void;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
}

export default function AdminDashboard({ user, onRefreshUser, apiFetch }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = React.useState<
    "stats" | "users" | "campaigns" | "withdrawals" | "audits" | "announcements" | "cms" | "settings"
  >("stats");

  // Admin states
  const [stats, setStats] = React.useState({
    earnersCount: 0,
    advertisersCount: 0,
    tasksCount: 0,
    totalEarned: 0,
    pendingWithdrawals: 0,
    totalDeposited: 0
  });

  const [usersList, setUsersList] = React.useState<any[]>([]);
  const [campaignsList, setCampaignsList] = React.useState<Task[]>([]);
  const [withdrawalsList, setWithdrawalsList] = React.useState<Transaction[]>([]);
  const [submissionsList, setSubmissionsList] = React.useState<TaskSubmission[]>([]);
  const [depositsList, setDepositsList] = React.useState<Transaction[]>([]);
  const [referralsList, setReferralsList] = React.useState<Referral[]>([]);
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [banners, setBanners] = React.useState<Banner[]>([]);
  
  // Real-Time Notification System States
  const [notifications, setNotifications] = React.useState<AdminNotification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = React.useState(false);
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
    referralReward: 200,
    withdrawalFee: 100,
    minWithdrawal: 2000,
    minDeposit: 1000,
    contactEmail: "support@tasksearn.com",
    contactPhone: "09164444315",
    whatsappGroup: "https://wa.me/2349164444315"
  });
  const [settingsSuccess, setSettingsSuccess] = React.useState("");

  // Adjust Balance Prompt box
  const [selectedUserForBalance, setSelectedUserForBalance] = React.useState<any | null>(null);
  const [adjustBalanceAmount, setAdjustBalanceAmount] = React.useState("");

  // Announcement state
  const [annTitle, setAnnTitle] = React.useState("");
  const [annContent, setAnnContent] = React.useState("");
  const [annType, setAnnType] = React.useState<"info" | "success" | "warning">("info");
  const [annSuccess, setAnnSuccess] = React.useState("");

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
      if (Array.isArray(data)) setCampaignsList(data);
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
    if (activeTab === "withdrawals") fetchWithdrawals();
    if (activeTab === "audits") fetchAudits();
    if (activeTab === "announcements") fetchAnnouncementsAndBanners();
    if (activeTab === "cms") fetchCMSPages();
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
          console.error("[Admin WS] Error:", err);
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

  // Approve / Reject Withdrawals
  const handleReviewWithdrawal = async (txId: string, status: TransactionStatus) => {
    if (!window.confirm(`Are you sure you want to mark this withdrawal as ${status}?`)) return;

    try {
      const res = await apiFetch(`/api/admin/withdrawals/${txId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (res && res.success) {
        fetchWithdrawals();
        fetchStats();
      }
    } catch (e) {}
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

  // Announcement post
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;
    setAnnSuccess("");

    try {
      const res = await apiFetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: annTitle, content: annContent, type: annType })
      });

      if (res && res.success) {
        setAnnSuccess("Announcement published successfully on user boards!");
        setAnnTitle("");
        setAnnContent("");
        fetchAnnouncementsAndBanners();
      }
    } catch (e) {}
  };

  // Announcement delete
  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm("Delete this notice?")) return;
    try {
      const res = await apiFetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
      if (res && res.success) fetchAnnouncementsAndBanners();
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

  return (
    <div className="space-y-6 relative">
      
      {/* Live Real-Time Toast Alert */}
      {activeToast && (
        <div 
          onClick={() => handleNotificationClick(activeToast)}
          className="fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-2xl border-l-4 border-emerald-500 shadow-2xl p-4 flex gap-3.5 items-start animate-bounce hover:shadow-emerald-100/50 transition-all cursor-pointer"
        >
          <div className="rounded-full bg-emerald-50 p-2 text-emerald-600 shrink-0">
            {activeToast.type === "submission" ? <ShieldAlert className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white rounded-3xl p-6 border border-slate-100 shadow-sm gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Admin Control Center
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live WebSocket
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            System administration & real-time transaction clearing desks. Welcome back, <span className="font-bold text-slate-700">{user.name}</span>.
          </p>
        </div>

        {/* Real-time Notification Desk */}
        <div className="relative shrink-0">
          <button 
            id="admin-notification-bell"
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className={`relative rounded-full p-2.5 transition-all outline-none cursor-pointer ${
              showNotifDropdown ? "bg-slate-100 text-slate-800" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {unreadCount > 0 ? (
              <>
                <BellRing className="h-5 w-5 text-emerald-500 animate-bounce" />
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              </>
            ) : (
              <Bell className="h-5 w-5" />
            )}
          </button>

          {/* Notifications Dropdown Card */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-3 z-50 w-80 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl space-y-3 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-slate-50 pb-2.5">
                <div>
                  <h4 className="font-display text-xs font-extrabold text-slate-900">Notifications ({unreadCount})</h4>
                  <p className="text-[9px] text-slate-400 font-medium">Real-time alerts & activities</p>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer"
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
                        notif.read ? "hover:bg-slate-50/50" : "bg-emerald-50/40 hover:bg-emerald-50"
                      }`}
                    >
                      <div className={`rounded-full p-1.5 shrink-0 ${
                        notif.type === "submission" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                      }`}>
                        {notif.type === "submission" ? <ShieldAlert className="h-3.5 w-3.5" /> : <CreditCard className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] leading-tight ${notif.read ? "text-slate-600 font-medium" : "text-slate-900 font-bold"}`}>
                          {notif.message}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" /> 
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-2" />
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
      
      {/* Left Sidebar Menu Rail */}
      <div className="lg:col-span-1 space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2">Admin Dashboard</p>
        
        <button 
          onClick={() => setActiveTab("stats")}
          className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center gap-2.5 ${
            activeTab === "stats" ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500" : "text-slate-500 hover:bg-slate-50/50"
          }`}
        >
          <LayoutGrid className="h-4 w-4 text-slate-400" /> 
          <span>System Status</span>
        </button>

        <button 
          onClick={() => setActiveTab("users")}
          className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center gap-2.5 ${
            activeTab === "users" ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500" : "text-slate-500 hover:bg-slate-50/50"
          }`}
        >
          <Users className="h-4 w-4 text-slate-400" /> 
          <span>Manage Users</span>
        </button>

        <button 
          onClick={() => setActiveTab("campaigns")}
          className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center gap-2.5 ${
            activeTab === "campaigns" ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500" : "text-slate-500 hover:bg-slate-50/50"
          }`}
        >
          <Briefcase className="h-4 w-4 text-slate-400" /> 
          <span>Tasks & Campaigns</span>
        </button>

        <button 
          onClick={() => setActiveTab("withdrawals")}
          className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center gap-2.5 ${
            activeTab === "withdrawals" ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500" : "text-slate-500 hover:bg-slate-50/50"
          }`}
        >
          <CreditCard className="h-4 w-4 text-slate-400" /> 
          <span>Payout requests ({withdrawalsList.filter(w => w.status === TransactionStatus.PENDING).length})</span>
        </button>

        <button 
          onClick={() => setActiveTab("audits")}
          className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center gap-2.5 ${
            activeTab === "audits" ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500" : "text-slate-500 hover:bg-slate-50/50"
          }`}
        >
          <ShieldAlert className="h-4 w-4 text-slate-400" /> 
          <span>Auditing Center ({submissionsList.filter(s => s.status === SubmissionStatus.PENDING).length})</span>
        </button>

        <button 
          onClick={() => setActiveTab("announcements")}
          className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center gap-2.5 ${
            activeTab === "announcements" ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500" : "text-slate-500 hover:bg-slate-50/50"
          }`}
        >
          <Megaphone className="h-4 w-4 text-slate-400" /> 
          <span>CMS Notices & Ads</span>
        </button>

        <button 
          onClick={() => setActiveTab("cms")}
          className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center gap-2.5 ${
            activeTab === "cms" ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500" : "text-slate-500 hover:bg-slate-50/50"
          }`}
        >
          <FileEdit className="h-4 w-4 text-slate-400" /> 
          <span>Static Pages Editor</span>
        </button>

        <button 
          onClick={() => setActiveTab("settings")}
          className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center gap-2.5 ${
            activeTab === "settings" ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500" : "text-slate-500 hover:bg-slate-50/50"
          }`}
        >
          <Settings className="h-4 w-4 text-slate-400" /> 
          <span>Platform Settings</span>
        </button>
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
                <span className="block font-mono text-2xl font-black text-gray-800 mt-1">{stats.earnersCount}</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Advertisers Count</span>
                <span className="block font-mono text-2xl font-black text-gray-800 mt-1">{stats.advertisersCount}</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Platform Campaigns</span>
                <span className="block font-mono text-2xl font-black text-gray-800 mt-1">{stats.tasksCount}</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Total Earner Earnings</span>
                <span className="block font-mono text-2xl font-black text-emerald-600 mt-1">₦{stats.totalEarned.toLocaleString()}</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Pending Withdrawals Queue</span>
                <span className="block font-mono text-2xl font-black text-amber-500 mt-1">₦{stats.pendingWithdrawals.toLocaleString()}</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Total Advertisers Deposits</span>
                <span className="block font-mono text-2xl font-black text-indigo-600 mt-1">₦{stats.totalDeposited.toLocaleString()}</span>
              </div>
            </div>

            {/* Financial Ledger Log Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Deposits ledger */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
                <h3 className="font-display text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <ArrowDownCircle className="h-4 w-4 text-emerald-500" /> Recent Cash Deposits (₦)
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
                        <span className="font-mono font-bold text-emerald-600">+₦{dep.amount.toLocaleString()}</span>
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
                          <span className="font-mono font-bold text-emerald-600">+₦{ref.rewardEarned}</span>
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
        {activeTab === "users" && (
          <div className="space-y-6">
            
            {/* Balance adjuster modal */}
            {selectedUserForBalance && (
              <form onSubmit={handleAdjustBalance} className="rounded-2xl border border-red-100 bg-red-50/10 p-5 shadow-sm space-y-4 animate-fadeIn border-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-display text-sm font-bold text-red-900">Adjust Wallet Balance</h4>
                    <p className="text-xs text-red-600">User: <strong>{selectedUserForBalance.name}</strong> ({selectedUserForBalance.role})</p>
                  </div>
                  <button type="button" onClick={() => setSelectedUserForBalance(null)} className="rounded-full bg-gray-200 p-1 text-gray-700">✕</button>
                </div>

                <div className="flex gap-3 max-w-sm">
                  <input 
                    type="number"
                    required
                    value={adjustBalanceAmount}
                    onChange={(e) => setAdjustBalanceAmount(e.target.value)}
                    placeholder="New Wallet Balance (₦)"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-mono focus:outline-none"
                  />
                  <button type="submit" className="rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white px-5 py-2 whitespace-nowrap">
                    Update Balance
                  </button>
                </div>
              </form>
            )}

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">Platform Users Registry</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase text-[9px] font-bold">
                      <th className="py-2.5 px-1">Name</th>
                      <th className="py-2.5 px-1">Email</th>
                      <th className="py-2.5 px-1">Role</th>
                      <th className="py-2.5 px-1">Wallet Balance</th>
                      <th className="py-2.5 px-1">Verification</th>
                      <th className="py-2.5 px-1 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((usr, idx) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-3 px-1 font-bold text-gray-800">{usr.name}</td>
                        <td className="py-3 px-1 text-gray-500">{usr.email}</td>
                        <td className="py-3 px-1">
                          <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold ${
                            usr.role === UserRole.ADVERTISER ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700"
                          }`}>{usr.role}</span>
                        </td>
                        <td className="py-3 px-1 font-mono font-bold text-gray-800">₦{usr.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-1">
                          <button 
                            onClick={() => handleToggleVerification(usr)}
                            className={`rounded-full px-2.5 py-0.5 text-[9px] font-black cursor-pointer uppercase ${
                              usr.isVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {usr.isVerified ? "Verified" : "Unverified"}
                          </button>
                        </td>
                        <td className="py-3 px-1 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedUserForBalance(usr);
                              setAdjustBalanceAmount(usr.walletBalance.toString());
                              setTimeout(() => {
                                window.scrollBy({ top: -120, behavior: "smooth" });
                              }, 100);
                            }}
                            className="rounded bg-gray-100 hover:bg-red-50 hover:text-red-600 text-[10px] font-bold text-gray-700 px-2 py-1"
                          >
                            Adjust Balance
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: CAMPAIGNS MODERATION */}
        {activeTab === "campaigns" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">Ad Campaigns Moderation</h3>
              
              <div className="space-y-3">
                {campaignsList.map((task, idx) => (
                  <div key={idx} className="rounded-xl border border-gray-50 bg-white p-4 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="rounded bg-red-50 text-[9px] font-bold text-red-700 px-2 py-0.5 uppercase">{task.category}</span>
                      <h4 className="font-display font-bold text-gray-800 mt-1">{task.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-1">Publisher: {task.advertiserName} • Budget: ₦{(task.costPerSlot * task.totalSlots).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <div>
                        <span className="block text-[10px] text-gray-400">Slots Completed</span>
                        <span className="font-mono font-bold text-gray-700">{task.filledSlots} / {task.totalSlots}</span>
                      </div>
                      
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                        task.status === TaskStatus.ACTIVE ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}>{task.status}</span>

                      {task.status !== TaskStatus.COMPLETED && (
                        <button
                          onClick={() => handleAdminToggleCampaign(task.id, task.status)}
                          className="rounded bg-gray-100 hover:bg-red-50 px-2 py-1 font-bold text-[10px]"
                        >
                          {task.status === TaskStatus.ACTIVE ? "Pause" : "Resume"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WITHDRAWAL AUDITS */}
        {activeTab === "withdrawals" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">Pending Bank Withdrawals</h3>
              
              {withdrawalsList.filter(w => w.status === TransactionStatus.PENDING).length === 0 ? (
                <p className="text-center py-10 text-xs text-gray-400">All pending bank transfers have been disbursed!</p>
              ) : (
                <div className="space-y-3">
                  {withdrawalsList.filter(w => w.status === TransactionStatus.PENDING).map((tx, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-100 bg-white p-4 text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <p className="font-bold text-gray-800">Recipient: {tx.userName} ({tx.userRole})</p>
                        <p className="font-mono text-gray-500 font-bold text-[11px]">
                          Bank details: {tx.bankDetails?.bankName} • Account: {tx.bankDetails?.accountNumber} • Name: {tx.bankDetails?.accountName}
                        </p>
                        <p className="text-[10px] text-gray-400">Date requested: {new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                        <span className="font-mono font-bold text-lg text-red-600">₦{tx.amount.toLocaleString()}</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleReviewWithdrawal(tx.id, TransactionStatus.SUCCESS)}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold text-white px-2.5 py-1.5 flex items-center gap-1"
                          >
                            <Check className="h-3.5 w-3.5" /> Confirm Bank Sent
                          </button>
                          <button
                            onClick={() => handleReviewWithdrawal(tx.id, TransactionStatus.REJECTED)}
                            className="rounded-lg bg-red-600 hover:bg-red-700 text-[10px] font-bold text-white px-2.5 py-1.5 flex items-center gap-1"
                          >
                            <X className="h-3.5 w-3.5" /> Decline & Refund
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past withdrawal history */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">Historic Withdrawal Disbursements</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                {withdrawalsList.filter(w => w.status !== TransactionStatus.PENDING).map((tx, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <div>
                      <p className="font-bold text-gray-800">{tx.userName} ({tx.bankDetails?.bankName})</p>
                      <p className="text-[10px] text-gray-400">Disbursed on {new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold block text-gray-700">₦{tx.amount.toLocaleString()}</span>
                      <span className={`text-[9px] font-bold uppercase ${tx.status === TransactionStatus.SUCCESS ? "text-emerald-600" : "text-red-500"}`}>{tx.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

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
                              ? "bg-white text-emerald-600 shadow-sm" 
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
                              <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5">
                                {sub.category}
                              </span>
                              <h4 className="font-display font-bold text-gray-900 text-sm">{sub.taskTitle}</h4>
                              <p className="text-gray-400 text-[10px] mt-0.5">
                                Submitted by: <span className="font-semibold text-gray-700">{sub.earnerName}</span> • {new Date(sub.submittedAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right sm:self-start">
                              <span className="font-mono font-bold text-base text-emerald-600 block">₦{sub.reward}</span>
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase mt-1 ${
                                sub.status === SubmissionStatus.PENDING 
                                  ? "bg-amber-50 text-amber-600 border border-amber-100" 
                                  : sub.status === SubmissionStatus.APPROVED 
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
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
                                  No screenshot proof uploaded
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
                                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
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
            
            {/* Announcement creator */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">Post Global Notice Announcement</h3>
              
              {annSuccess && <p className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-xs font-bold text-emerald-800 mb-4">{annSuccess}</p>}

              <form onSubmit={handlePostAnnouncement} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Notice Title</label>
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
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Detailed Message Content</label>
                  <textarea 
                    required
                    rows={3}
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    placeholder="Provide full details of the notice for earners and advertisers dashboards..."
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-red-500"
                  ></textarea>
                </div>

                <button type="submit" className="rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white px-5 py-2.5">
                  Publish Notice Now
                </button>
              </form>
            </div>

            {/* Notices list */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">Active Notices Bulletin</h3>
              <div className="space-y-3">
                {announcements.map((ann, idx) => (
                  <div key={idx} className="flex justify-between items-start border-b border-gray-50 pb-3 last:border-0">
                    <div>
                      <p className="font-bold text-gray-800">{ann.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{ann.content}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="text-red-600 hover:underline text-[10px] font-bold"
                    >
                      Remove
                    </button>
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

              {cmsSuccess && <p className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-xs font-bold text-emerald-800 mb-4">{cmsSuccess}</p>}

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

              {settingsSuccess && <p className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-xs font-bold text-emerald-800 mb-4">{settingsSuccess}</p>}

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
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Referral Reward (₦)</label>
                    <input 
                      type="number" 
                      value={settings.referralReward}
                      onChange={(e) => setSettings({ ...settings, referralReward: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs focus:outline-none font-mono"
                    />
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

      </div>

    </div>
  </div>
  );
}
