import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  User, 
  Task, 
  TaskSubmission, 
  Transaction, 
  Referral, 
  TaskCategory, 
  SubmissionStatus, 
  TransactionStatus,
  EarnerNotification
} from "../types";
import { usePlatforms } from "../lib/platformsStore";
import PlatformIcon from "./PlatformIcon";
import EarnerNotifications from "./EarnerNotifications";
import PushNotificationSettings from "./PushNotificationSettings";
import { 
  Briefcase, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Users, 
  ArrowUpRight, 
  Banknote, 
  User as UserIcon, 
  Search, 
  Share2, 
  AlertCircle, 
  Send, 
  Check, 
  ChevronRight, 
  Eye, 
  Lock,
  Copy,
  UploadCloud,
  Trash2,
  FileText,
  Image as ImageIcon,
  Bell,
  RefreshCw
} from "lucide-react";

interface EarnerDashboardProps {
  user: User;
  onRefreshUser: () => void;
  onNavigate: (view: string) => void;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
  showToast: (message: string, type?: "success" | "error") => void;
  earnerNotifications?: EarnerNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
}

interface NigerianBank { name: string; code: string; }
const FALLBACK_BANKS: NigerianBank[] = [
  { name: "Access Bank", code: "044" }, { name: "Guaranty Trust Bank (GTB)", code: "058" },
  { name: "Zenith Bank", code: "057" }, { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "First Bank of Nigeria", code: "011" }, { name: "Fidelity Bank", code: "070" },
  { name: "First City Monument Bank (FCMB)", code: "214" }, { name: "Sterling Bank", code: "232" },
  { name: "Union Bank of Nigeria", code: "032" }, { name: "Wema Bank", code: "035" },
  { name: "Keystone Bank", code: "082" }, { name: "Polaris Bank", code: "076" },
  { name: "Ecobank Nigeria", code: "050" }, { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Unity Bank", code: "215" }, { name: "Jaiz Bank", code: "301" },
  { name: "Providus Bank", code: "101" }, { name: "Parallex Bank", code: "104" },
  { name: "Titan Trust Bank", code: "102" }, { name: "Globus Bank", code: "00103" },
  { name: "PremiumTrust Bank", code: "105" }, { name: "Lotus Bank", code: "303" },
  { name: "Optimus Bank", code: "107" }, { name: "Moniepoint Microfinance Bank", code: "50515" },
  { name: "OPay Microfinance Bank", code: "999992" }, { name: "PalmPay Microfinance Bank", code: "999991" },
  { name: "Kuda Bank", code: "50211" }, { name: "VFD Microfinance Bank", code: "566" }
];

export default function EarnerDashboard({ user, onRefreshUser, onNavigate, apiFetch, showToast, earnerNotifications = [], onMarkNotificationRead, onMarkAllNotificationsRead }: EarnerDashboardProps) {
  type EarnerTab = "overview" | "tasks" | "history" | "pending" | "completed" | "rejected" | "wallet" | "referrals" | "withdraw" | "profile" | "settings" | "notifications";
  const VALID_EARNER_TABS: EarnerTab[] = ["overview", "tasks", "history", "pending", "completed", "rejected", "wallet", "referrals", "withdraw", "profile", "settings", "notifications"];
  const earnerUnreadCount = earnerNotifications.filter(n => !n.read).length;
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab: EarnerTab = (VALID_EARNER_TABS.includes(section as EarnerTab) ? section : "overview") as EarnerTab;
  const setActiveTab = (tab: EarnerTab) => navigate(`/earner/${tab}`);

  // Dynamic, admin-managed social media platforms (DB-driven, no hardcoding)
  const { platforms } = usePlatforms();
  const filterChips = ["All", ...platforms.map(p => p.name), "Website", "App", "Survey"];
  
  // Dashboard Metrics
  const [metrics, setMetrics] = React.useState({
    walletBalance: 0,
    totalEarned: 0,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    referralsCount: 0,
    availableTasksCount: 0,
    recentSubmissions: [] as TaskSubmission[],
    referralCode: ""
  });

  // Task states
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("All");
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);

  // Scroll to top whenever the active tab changes
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  // History list
  const [submissions, setSubmissions] = React.useState<TaskSubmission[]>([]);
  const [transactions, setTransactions] = React.useState<any[]>([]);

  // Rejected submissions (dedicated page — fetched from /api/earner/rejected-submissions)
  const [rejectedSubmissions, setRejectedSubmissions] = React.useState<any[]>([]);

  // Task delete (hide) state
  const [deleteConfirmTask, setDeleteConfirmTask] = React.useState<Task | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Rejected submission delete state (for the rejected tab)
  const [confirmDeleteRejectedId, setConfirmDeleteRejectedId] = React.useState<string | null>(null);
  const [deletingRejected, setDeletingRejected] = React.useState(false);

  // Referrals state
  const [referralsData, setReferralsData] = React.useState({
    referralCode: "",
    referralReward: 0,
    referrals: [] as Referral[]
  });

  // Withdraw Form State
  const [withdrawAmount, setWithdrawAmount] = React.useState("");
  const [bankList, setBankList] = React.useState<NigerianBank[]>(FALLBACK_BANKS);
  const [bankName, setBankName] = React.useState("Guaranty Trust Bank (GTB)");
  const [bankCode, setBankCode] = React.useState("058");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [accountName, setAccountName] = React.useState("");
  const [withdrawSuccess, setWithdrawSuccess] = React.useState(false);
  const [withdrawError, setWithdrawError] = React.useState("");
  const [withdrawSubmitting, setWithdrawSubmitting] = React.useState(false);
  const [minWithdrawLimit, setMinWithdrawLimit] = React.useState(200);
  const [withdrawFee, setWithdrawFee] = React.useState(50);

  // Bank verification state
  const [verifying, setVerifying] = React.useState(false);
  const [isVerified, setIsVerified] = React.useState(false);
  const [verifyError, setVerifyError] = React.useState("");
  const [verifySuccess, setVerifySuccess] = React.useState("");

  // Profile Form State
  const [profileName, setProfileName] = React.useState(user.name);
  const [profileEmail, setProfileEmail] = React.useState(user.email);
  const [passwordForm, setPasswordForm] = React.useState({ old: "", new: "", confirm: "" });
  const [profileSuccess, setProfileSuccess] = React.useState("");
  const [profileError, setProfileError] = React.useState("");

  // Fetch Dashboard Stats
  const fetchDashboardStats = async () => {
    try {
      const data = await apiFetch("/api/earner/dashboard");
      if (data && !data.error) {
        setMetrics(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch available tasks
  const fetchAvailableTasks = async () => {
    try {
      const data = await apiFetch("/api/earner/tasks");
      if (Array.isArray(data)) {
        setTasks(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch earner submissions
  const fetchSubmissions = async () => {
    try {
      const data = await apiFetch("/api/earner/submissions");
      if (Array.isArray(data)) {
        setSubmissions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch rejected submissions for the dedicated Rejected Tasks page
  const fetchRejectedSubmissions = async () => {
    try {
      const data = await apiFetch("/api/earner/rejected-submissions");
      if (Array.isArray(data)) {
        setRejectedSubmissions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete a rejected submission from the rejected tab
  const handleDeleteRejected = async () => {
    if (!confirmDeleteRejectedId) return;
    setDeletingRejected(true);
    try {
      const res = await apiFetch(`/api/earner/submissions/${confirmDeleteRejectedId}`, {
        method: "DELETE",
      });
      if (res && res.error) {
        showToast(res.error, "error");
      } else {
        setRejectedSubmissions(prev => prev.filter(s => s.submissionId !== confirmDeleteRejectedId));
        showToast("Rejected task deleted successfully.", "success");
      }
    } catch {
      showToast("Failed to delete. Please try again.", "error");
    } finally {
      setDeletingRejected(false);
      setConfirmDeleteRejectedId(null);
    }
  };

  // Hide (delete from view) a task for this earner only
  const handleHideTask = async (task: Task) => {
    setDeleting(true);
    try {
      await apiFetch(`/api/earner/tasks/${task.id}/hide`, { method: "POST" });
      // Remove from local state immediately for instant UX
      setTasks(prev => prev.filter(t => t.id !== task.id));
      if (selectedTask?.id === task.id) setSelectedTask(null);
    } catch (e) {
      // Fallback: remove locally even if API fails (task will reappear on refresh if API failed)
      setTasks(prev => prev.filter(t => t.id !== task.id));
    } finally {
      setDeleting(false);
      setDeleteConfirmTask(null);
    }
  };

  // Fetch earner transaction history
  const fetchTransactions = async () => {
    try {
      const data = await apiFetch("/api/user/transactions");
      if (Array.isArray(data)) setTransactions(data);
    } catch (e) {}
  };

  // Fetch referrals information
  const fetchReferrals = async () => {
    try {
      const data = await apiFetch("/api/earner/referrals");
      if (data && !data.error) {
        setReferralsData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Web Settings for withdrawal limits
  const fetchLimits = async () => {
    try {
      const adminData = await apiFetch("/api/admin/dashboard");
      if (adminData && adminData.settings) {
        setMinWithdrawLimit(adminData.settings.minWithdrawal);
        setWithdrawFee(adminData.settings.withdrawalFee);
      }
    } catch (e) {}
  };

  // Fetch live bank list from server (Paystack-powered or fallback)
  const fetchBankList = async () => {
    try {
      const data = await apiFetch("/api/banks");
      if (Array.isArray(data) && data.length > 0) {
        setBankList(data);
        // If current selection isn't in new list, reset to first bank
        const first = data[0] as NigerianBank;
        setBankName(first.name);
        setBankCode(first.code);
      }
    } catch (e) {}
  };

  // Verify bank account via Paystack (server-side, key never exposed)
  const handleVerifyBank = async () => {
    if (accountNumber.length !== 10) {
      setVerifyError("Enter a valid 10-digit account number first.");
      return;
    }
    setVerifying(true);
    setVerifyError("");
    setVerifySuccess("");
    setAccountName("");
    setIsVerified(false);
    try {
      const res = await apiFetch("/api/verify-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber, bankCode, bankName })
      });
      if (res && res.success) {
        setAccountName(res.accountName);
        setIsVerified(true);
        setVerifySuccess(`✓ Verified: ${res.accountName}${res.isSimulated ? " (simulated)" : ""}`);
        setWithdrawError(""); // clear any stale withdrawal submission error
      } else {
        setVerifyError(res?.error || "Verification failed. Please check account details.");
      }
    } catch (e) {
      setVerifyError("Network error during verification. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  React.useEffect(() => {
    fetchDashboardStats();
    fetchLimits();
    fetchBankList();
  }, [user.walletBalance]);

  // Task to highlight from notification click
  const [highlightTaskId, setHighlightTaskId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (activeTab === "overview") { fetchDashboardStats(); fetchRejectedSubmissions(); }
    if (activeTab === "tasks") fetchAvailableTasks();
    if (activeTab === "rejected") fetchRejectedSubmissions();
    if (activeTab === "history" || activeTab === "pending" || activeTab === "completed") fetchSubmissions();
    if (activeTab === "referrals") fetchReferrals();
    if (activeTab === "wallet") { fetchDashboardStats(); fetchTransactions(); }
  }, [activeTab]);

  // Withdrawal request submission
  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || !accountNumber || !accountName) {
      setWithdrawError("All banking fields are required.");
      return;
    }

    if (!isVerified) {
      setWithdrawError("You must verify your bank account before submitting a withdrawal request.");
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < minWithdrawLimit) {
      setWithdrawError(`Minimum withdrawal is ₦${minWithdrawLimit.toLocaleString()}`);
      return;
    }

    if (amount + withdrawFee > user.walletBalance) {
      setWithdrawError(
        `Insufficient balance. You need ₦${(amount + withdrawFee).toLocaleString()} ` +
        `(₦${amount.toLocaleString()} + ₦${withdrawFee.toLocaleString()} fee) ` +
        `but only have ₦${user.walletBalance.toLocaleString()}.`
      );
      return;
    }

    if (accountNumber.length !== 10 || isNaN(Number(accountNumber))) {
      setWithdrawError("Nigerian account numbers must be exactly 10 digits.");
      return;
    }

    setWithdrawSubmitting(true);
    setWithdrawError("");
    setWithdrawSuccess(false);

    try {
      const res = await apiFetch("/api/earner/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          bankName,
          bankCode,
          accountNumber,
          accountName
        })
      });

      if (res && res.error) {
        setWithdrawError(res.error);
      } else {
        setWithdrawSuccess(true);
        setWithdrawAmount("");
        // Immediately apply the authoritative post-deduction balance returned by
        // the server — no cached value, no extra round-trip before the UI updates.
        if (typeof res.walletBalance === "number") {
          setMetrics(m => ({ ...m, walletBalance: res.walletBalance }));
        }
        // Also re-fetch the parent user object so user.walletBalance (shown in
        // the withdraw form's "Available balance" hint) refreshes too.
        onRefreshUser();
      }
    } catch (err) {
      setWithdrawError("Payout request processing failed. Please check internet connection.");
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  // Profile update handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    
    if (passwordForm.new && passwordForm.new !== passwordForm.confirm) {
      setProfileError("New passwords do not match.");
      return;
    }

    setProfileSuccess("Profile settings saved successfully! (Credentials updated in memory)");
    setPasswordForm({ old: "", new: "", confirm: "" });
  };

  // Split tasks into available (no prior submission or non-rejected) vs. rejected.
  const rejectedTasks = tasks.filter(t => (t as any).submissionStatus === "Rejected");
  const availableTasks = tasks.filter(t => (t as any).submissionStatus !== "Rejected");

  // Filtered tasks computation. Category values are composed as
  // "{Platform} {Action}" (e.g. "Instagram Follow"), so a platform-name
  // filter chip matches via substring rather than exact equality.
  const filteredTasks = availableTasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || t.category.toLowerCase().includes(categoryFilter.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  // Share Referral link and code
  const copyReferralCode = () => {
    const code = user.referralCode || "TASKS500";
    navigator.clipboard.writeText(code);
    showToast(`Referral code "${code}" copied to clipboard!`, "success");
  };

  const copyReferralLink = () => {
    const linkText = `${window.location.origin}?ref=${user.referralCode}`;
    navigator.clipboard.writeText(linkText);
    showToast("Referral link copied to clipboard!", "success");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      {/* Sidebar Nav Panels */}
      <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-20 lg:self-start">
        
        {/* Simple Profile Widget */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white font-bold font-display text-xl shadow-xs">
            {user.name.substring(0, 2).toUpperCase()}
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800">{user.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
          
          <div className="mt-4 flex flex-col items-center gap-1.5">
            {!user.isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 border border-amber-100">
                <AlertCircle className="h-3 w-3" /> Email Unverified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                <Check className="h-3 w-3" /> Active Earner
              </span>
            )}
          </div>
        </div>

        {/* Navigation Menu (desktop only — mobile uses the bottom nav bar + hamburger menu) */}
        <div className="hidden lg:block rounded-2xl border border-slate-200 bg-white p-3 shadow-xs space-y-1">
          {([
            { tab: "overview" as EarnerTab, label: "Dashboard" },
            { tab: "tasks" as EarnerTab, label: `Available Tasks (${availableTasks.length})` },
            { tab: "pending" as EarnerTab, label: `Waiting for Approval (${submissions.filter(s => s.status === SubmissionStatus.PENDING).length})` },
            { tab: "completed" as EarnerTab, label: `Completed Tasks (${submissions.filter(s => s.status === SubmissionStatus.APPROVED).length})` },
            { tab: "rejected" as EarnerTab, label: `Rejected Tasks`, badge: rejectedSubmissions.length > 0 ? rejectedSubmissions.length : undefined },
            { tab: "wallet" as EarnerTab, label: "Wallet" },
            { tab: "withdraw" as EarnerTab, label: "Withdraw" },
            { tab: "referrals" as EarnerTab, label: "Referrals" },
            { tab: "notifications" as EarnerTab, label: "Notifications", badge: earnerUnreadCount },
            { tab: "profile" as EarnerTab, label: "Profile" },
            { tab: "settings" as EarnerTab, label: "Settings" },
          ] as { tab: EarnerTab; label: string; badge?: number; externalPath?: string }[]).map(({ tab, label, badge, externalPath }) => (
            <button
              key={tab}
              onClick={() => externalPath ? navigate(externalPath) : setActiveTab(tab)}
              className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center justify-between ${
                (externalPath ? location.pathname === externalPath || location.pathname.startsWith(externalPath + "/") : activeTab === tab)
                  ? "bg-blue-50 text-blue-600 border-r-4 border-blue-500"
                  : "text-slate-500 hover:bg-slate-50/50"
              }`}
            >
              <span className="flex items-center gap-2">
                {tab === "notifications" && <Bell className="h-3.5 w-3.5" />}
                {label}
              </span>
              <div className="flex items-center gap-1.5">
                {badge != null && badge > 0 && (
                  <span className="rounded-full text-[8px] font-black text-white px-1.5 py-0.5" style={{ background: "#EF4444" }}>
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </button>
          ))}
        </div>

      </div>

      {/* Main Panel Content Area */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            
            {/* Wallet Cash card banner */}
            <div className="rounded-3xl bg-gradient-to-tr from-blue-600 to-blue-800 p-6 sm:p-8 text-white shadow-xl shadow-blue-50 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-y-6 translate-x-6 opacity-10">
                <Banknote className="h-44 w-44" />
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-blue-50 uppercase tracking-widest">Available Wallet Balance</p>
                  <p className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mt-1.5">
                    ₦{metrics.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab("withdraw")}
                  className="rounded-xl bg-white text-blue-800 hover:bg-blue-50 px-4 py-2 text-xs font-bold shadow transition-all cursor-pointer"
                >
                  Request Payout
                </button>
              </div>
              
              <div className="border-t border-blue-500/30 mt-6 pt-5 grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-semibold text-blue-50 uppercase tracking-wider">Total Accumulated Earnings</span>
                  <span className="font-mono text-sm font-bold text-blue-50 mt-0.5">₦{metrics.totalEarned.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-blue-50 uppercase tracking-wider">Referral Code</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-sm font-bold text-blue-50">
                      {user.referralCode}
                    </span>
                    <button 
                      onClick={copyReferralCode} 
                      className="p-1 text-blue-50 hover:text-white bg-blue-700/50 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer" 
                      title="Copy Referral Code"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={copyReferralLink} 
                      className="p-1 text-blue-50 hover:text-white bg-blue-700/50 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer" 
                      title="Copy Invite Link"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stats mini cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-medium text-gray-400 uppercase">Approved</span>
                  <span className="font-mono text-sm font-bold text-gray-800">{metrics.approvedCount}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center gap-3">
                <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-medium text-gray-400 uppercase">Pending</span>
                  <span className="font-mono text-sm font-bold text-gray-800">{metrics.pendingCount}</span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab("rejected")}
                className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm flex items-center gap-3 hover:bg-red-50/40 transition-all text-left cursor-pointer w-full"
              >
                <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-medium text-gray-400 uppercase">Rejected</span>
                  <span className="font-mono text-sm font-bold text-gray-800">{metrics.rejectedCount}</span>
                </div>
              </button>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-medium text-gray-400 uppercase">Referrals</span>
                  <span className="font-mono text-sm font-bold text-gray-800">{metrics.referralsCount}</span>
                </div>
              </div>
            </div>

            {/* ── Rejection Alert Banner (shown when earner has rejected tasks) ── */}
            {rejectedSubmissions.length > 0 && (
              <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="shrink-0 h-10 w-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-red-900">
                      {rejectedSubmissions.length === 1
                        ? "1 task needs your attention"
                        : `${rejectedSubmissions.length} tasks need your attention`}
                    </p>
                    <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                      {rejectedSubmissions.length === 1
                        ? "1 submission was rejected. Review the feedback and resubmit corrected proof to earn your reward."
                        : `${rejectedSubmissions.length} submissions were rejected. Review feedback and resubmit corrected proof to earn your rewards.`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("rejected")}
                  className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 text-xs font-black shadow transition-all cursor-pointer w-full sm:w-auto"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  View Rejected Tasks
                </button>
              </div>
            )}

            {/* General Information Banner / Notice Board */}
            <div className="rounded-2xl bg-gray-900 text-white p-6 relative overflow-hidden">
              <h3 className="font-display text-sm font-bold text-blue-300 uppercase tracking-widest">Earner Guidelines Checklist</h3>
              <ul className="mt-3 text-xs text-gray-200 font-medium space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                  <span><strong>Do not unfollow/unsubscribe:</strong> Our crawlers audit accounts weekly. Unsubscribing within 6 months will lock your earnings and trigger penalties.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                  <span><strong>Clear Proof Screenshot:</strong> Always upload high-quality screenshots showing follow, like, or subscription verification clearly.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                  <span><strong>Account limits:</strong> Opening multiple earner accounts is strictly illegal and leads to immediate IP and device ban.</span>
                </li>
              </ul>
            </div>

            {/* Recent submissions list overview */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">My Recent Submissions</h3>
              
              {metrics.recentSubmissions.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  You haven't submitted any task proof yet. Click "Browse Microtasks" to get started!
                </div>
              ) : (
                <div className="space-y-3">
                   {metrics.recentSubmissions.map((sub, idx) => (
                     <div key={idx} className="flex items-center justify-between gap-2 border-b border-gray-50 pb-3 last:border-b-0 last:pb-0">
                         <div className="flex items-center gap-2.5 min-w-0">
                           <PlatformIcon category={sub.category} size={14} showBg className="shrink-0" />
                           <div className="min-w-0">
                             <p className="text-xs font-bold text-gray-800 line-clamp-1">{sub.taskTitle}</p>
                             <p className="text-[10px] text-gray-400 mt-0.5">{new Date(sub.submittedAt).toLocaleDateString()} • {sub.category}</p>
                           </div>
                         </div>
                         <div className="text-right shrink-0">
                           <span className="font-mono text-xs font-bold text-gray-700">₦{sub.reward}</span>
                           <div className="mt-1">
                             <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${
                               sub.status === SubmissionStatus.APPROVED ? "bg-blue-50 text-blue-700" :
                               sub.status === SubmissionStatus.PENDING ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                             }`}>
                               {sub.status}
                             </span>
                           </div>
                         </div>
                     </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: BROWSE TASKS */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            
            {/* Header / Filter bar */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
              
              {/* Search box */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  placeholder="Search available jobs..."
                />
              </div>

              {/* Category selector */}
              <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
                {filterChips.map((cat, idx) => {
                  const isSelected = cat.toLowerCase() === categoryFilter.toLowerCase();
                  return (
                    <button
                      key={idx}
                      onClick={() => setCategoryFilter(cat === "All" ? "All" : cat)}
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold cursor-pointer flex items-center gap-1.5 transition-colors ${
                        isSelected ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat !== "All" && (
                        <PlatformIcon 
                          platform={cat} 
                          size={12} 
                          className={isSelected ? "text-white" : ""} 
                        />
                      )}
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Task grid */}
            {filteredTasks.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-xs text-gray-400 shadow-sm">
                No microtasks currently match your search category. Check back soon for fresh advertiser campaigns!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredTasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="rounded-lg bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-700 flex items-center gap-1.5">
                          <PlatformIcon category={task.category} size={11} />
                          <span>{task.category}</span>
                        </span>
                        <span className="font-mono text-sm font-black text-blue-600">₦{task.earningPerSlot}</span>
                      </div>
                      
                      <h4 className="font-display text-xs font-bold text-gray-900 mt-2 line-clamp-1">{task.title}</h4>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                    </div>

                    <div className="border-t border-gray-50 mt-4 pt-3 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-gray-400 font-mono shrink-0">
                        {task.filledSlots}/{task.totalSlots} slots
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDeleteConfirmTask(task)}
                          title="Remove this task from your list"
                          className="rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                        <button
                          onClick={() => navigate(`/earner/tasks/${task.id}/submit`)}
                          className="rounded-lg px-3 py-1.5 text-[10px] font-bold text-white bg-gray-900 hover:bg-blue-600 transition-all cursor-pointer"
                        >
                          Accept &amp; Do Job
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          {/* ── Delete-task confirmation modal ── */}
          {deleteConfirmTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
              <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
                <div className="mb-1 flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-gray-900">Remove Task</h3>
                </div>
                <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                  Are you sure you want to remove{" "}
                  <span className="font-bold text-gray-800">"{deleteConfirmTask.title}"</span>{" "}
                  from your task list?
                </p>
                <p className="mt-2 text-[10px] text-gray-400 leading-relaxed">
                  This only removes it from <span className="font-semibold">your</span> view. The task remains active for other earners and the advertiser's campaign is unaffected.
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmTask(null)}
                    disabled={deleting}
                    className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleHideTask(deleteConfirmTask)}
                    disabled={deleting}
                    className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {deleting ? (
                      <>
                        <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        Removing…
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-3 w-3" />
                        Yes, Remove Task
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
        )}

        {/* TAB 3: SUBMISSION HISTORY — split into 3 sections */}
        {activeTab === "history" && (
          <div className="space-y-6">

            {/* ── SECTION 1: Waiting for Approval (Pending) ── */}
            {(() => {
              const pending = submissions.filter(s => s.status === SubmissionStatus.PENDING);
              return (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-amber-100 bg-amber-50">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-sm font-bold text-amber-900">Waiting for Approval</h3>
                      <p className="text-[10px] text-amber-600 mt-0.5">These tasks have been submitted and are awaiting advertiser review.</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[10px] font-black text-amber-700">
                      {pending.length} pending
                    </span>
                  </div>

                  {pending.length === 0 ? (
                    <div className="text-center py-10 text-xs text-amber-500">
                      No tasks currently waiting for approval. Submit proof on the Browse Microtasks page to get started!
                    </div>
                  ) : (
                    <div className="divide-y divide-amber-100">
                      {pending.map((sub, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-amber-50/60 transition-colors">
                          <PlatformIcon category={sub.category} size={14} showBg className="shrink-0 hidden sm:block" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">{sub.taskTitle}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{sub.category} · Submitted {new Date(sub.submittedAt).toLocaleDateString()}</p>
                            {sub.proofText && (
                              <p className="text-[10px] text-gray-500 mt-1 line-clamp-1 font-mono">{sub.proofText}</p>
                            )}
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                            <span className="font-mono text-sm font-black text-gray-700">₦{sub.reward}</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-amber-700">
                              <Clock className="h-2.5 w-2.5" /> Pending Approval
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── SECTION 2: Completed Tasks (Approved) ── */}
            {(() => {
              const approved = submissions.filter(s => s.status === SubmissionStatus.APPROVED);
              return (
                <div className="rounded-2xl border border-blue-100 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-blue-50 bg-blue-50/50">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-sm font-bold text-blue-900">Completed Tasks</h3>
                      <p className="text-[10px] text-blue-600 mt-0.5">Approved submissions — earnings have been credited to your wallet.</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-100 border border-blue-200 px-2.5 py-0.5 text-[10px] font-black text-blue-700">
                      {approved.length} completed
                    </span>
                  </div>

                  {approved.length === 0 ? (
                    <div className="text-center py-10 text-xs text-gray-400">
                      No completed tasks yet. Approved submissions will appear here with your credited earnings.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {approved.map((sub, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                          <PlatformIcon category={sub.category} size={14} showBg className="shrink-0 hidden sm:block" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">{sub.taskTitle}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{sub.category} · Submitted {new Date(sub.submittedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                            <span className="font-mono text-sm font-black text-blue-600">+₦{sub.reward}</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-blue-700">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Approved
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── SECTION 3: Rejected Tasks — redirect to dedicated page ── */}
            {(() => {
              const rejectedCount = submissions.filter(s => s.status === SubmissionStatus.REJECTED).length;
              return rejectedCount > 0 ? (
                <div className="rounded-2xl border border-red-100 bg-red-50/40 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 h-9 w-9 rounded-full bg-red-500 text-white flex items-center justify-center">
                      <XCircle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-red-900">
                        {rejectedCount} Rejected Task{rejectedCount !== 1 ? "s" : ""}
                      </p>
                      <p className="text-[10px] text-red-600 mt-0.5">
                        View rejection reasons, fix and resubmit, or delete from your Rejected Tasks page.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/earner/rejected")}
                    className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 text-xs font-bold transition-all cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Go to Rejected Tasks
                  </button>
                </div>
              ) : null;
            })()}

          </div>
        )}

        {/* TAB 4: REFERRALS */}
        {activeTab === "referrals" && (
          <div className="space-y-6">
            
            {/* Promo banner */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div>
                <h3 className="font-display text-base font-bold text-blue-900">Invite Friends to TasksEarn</h3>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  Share your referral link with friends on WhatsApp, Telegram, or Facebook to help grow the community. Referral bonuses for earners are currently ₦0 — check back later for updates.
                </p>
              </div>
              <button
                onClick={copyReferralLink}
                className="shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white px-5 py-3 shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="h-4 w-4" /> Share My Code
              </button>
            </div>

            {/* Codes and Links panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Code copier */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-gray-700">My Referral Code</h4>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={user.referralCode}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-mono font-bold text-center text-blue-600 tracking-wider select-all"
                  />
                  <button 
                    onClick={copyReferralCode}
                    className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Copy className="h-4 w-4" /> Copy Code
                  </button>
                </div>
              </div>

              {/* Link copier */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-gray-700">My Customized Referral URL</h4>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={`${window.location.origin}?ref=${user.referralCode}`}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-500 select-all"
                  />
                  <button 
                    onClick={copyReferralLink}
                    className="rounded-xl border border-gray-200 hover:bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 shrink-0 cursor-pointer"
                  >
                    Copy URL
                  </button>
                </div>
              </div>
            </div>

            {/* Referrals table list */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">My Referrals Network List</h3>
              
              {referralsData.referrals.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  You haven't referred any users yet. Copy your code to start building your passive team!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase text-[9px] font-bold">
                        <th className="py-2 px-1">Friend Name</th>
                        <th className="py-2 px-1">Friend Email</th>
                        <th className="py-2 px-1">Joined Date</th>
                        <th className="py-2 px-1">Bonus Reward Earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referralsData.referrals.map((ref, idx) => (
                        <tr key={idx} className="border-b border-gray-50">
                          <td className="py-3 px-1 font-bold text-gray-800">{ref.refereeName}</td>
                          <td className="py-3 px-1 text-gray-500">{ref.refereeEmail}</td>
                          <td className="py-3 px-1 text-gray-400">{new Date(ref.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-1 font-mono font-bold text-blue-600">₦{ref.rewardEarned}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 5: WITHDRAW */}
        {activeTab === "withdraw" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-2">Request Withdrawal Payout</h3>
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 mb-5 flex flex-wrap items-center gap-3 text-xs">
                <span className="font-bold text-blue-800">Minimum withdrawal: ₦{minWithdrawLimit.toLocaleString()}</span>
                <span className="text-blue-400">•</span>
                <span className="text-blue-700">Fixed processing fee: <strong>₦{withdrawFee}</strong> per request</span>
                <span className="text-blue-400">•</span>
                <span className="text-blue-600 italic">You receive amount minus ₦{withdrawFee} fee</span>
              </div>

              {withdrawSuccess ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 text-center animate-fadeIn space-y-2">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-lg">⏳</span>
                    <p className="text-sm font-bold text-amber-900">Withdrawal Request Submitted</p>
                  </div>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Your withdrawal request is awaiting admin approval. Funds will be sent after verification.
                  </p>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700 mt-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block"></span>
                    Pending Admin Review
                  </div>
                  <div className="pt-1">
                    <button 
                      onClick={() => { setWithdrawSuccess(false); setIsVerified(false); setAccountName(""); setVerifySuccess(""); setVerifyError(""); setAccountNumber(""); }}
                      className="mt-1 text-xs font-bold text-amber-700 hover:underline"
                    >
                      Submit Another Request
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleWithdrawal} className="space-y-4 max-w-md">
                  
                  {withdrawError && (
                    <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs font-bold text-red-700 flex items-center gap-2">
                      <span>⚠</span> {withdrawError}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      Withdrawal Amount in Nigerian Naira (₦)
                    </label>
                    <input 
                      type="number"
                      required
                      min={minWithdrawLimit}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder={`Min limit: ₦${minWithdrawLimit.toLocaleString()}`}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none font-mono"
                    />
                    <span className="block text-[10px] text-gray-400 mt-1">Available balance: ₦{user.walletBalance.toLocaleString()}</span>
                    {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && parseFloat(withdrawAmount) >= minWithdrawLimit && (
                      <div className="mt-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-[11px] font-semibold text-green-800 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Requested: <span className="font-mono">₦{parseFloat(withdrawAmount).toLocaleString()}</span></span>
                        <span className="text-red-600">Fee: <span className="font-mono">−₦{withdrawFee}</span></span>
                        <span className="text-green-700 font-bold">You receive: <span className="font-mono">₦{(parseFloat(withdrawAmount) - withdrawFee).toLocaleString()}</span></span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      Select Nigerian Bank
                    </label>
                    <select
                      value={bankCode}
                      onChange={(e) => {
                        const selected = bankList.find(b => b.code === e.target.value);
                        if (selected) {
                          setBankCode(selected.code);
                          setBankName(selected.name);
                          // Reset verification when bank changes
                          setIsVerified(false);
                          setAccountName("");
                          setVerifySuccess("");
                          setVerifyError("");
                        }
                      }}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none bg-white"
                    >
                      {bankList.map((bank) => (
                        <option key={bank.code} value={bank.code}>{bank.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      10-Digit Account Number (NUBAN)
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        required
                        maxLength={10}
                        value={accountNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setAccountNumber(val);
                          // Reset verification when account number changes
                          setIsVerified(false);
                          setAccountName("");
                          setVerifySuccess("");
                          setVerifyError("");
                        }}
                        placeholder="e.g. 0123456789"
                        className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyBank}
                        disabled={verifying || accountNumber.length !== 10}
                        className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isVerified
                            ? "bg-green-50 border border-green-200 text-green-700"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {verifying ? (
                          <><span className="animate-spin">⟳</span> Checking...</>
                        ) : isVerified ? (
                          <>✓ Verified</>
                        ) : (
                          <>Verify</>
                        )}
                      </button>
                    </div>
                    <span className="block text-[10px] text-gray-400 mt-1">Enter your 10-digit NUBAN number, then click Verify.</span>
                  </div>

                  {/* Verification feedback */}
                  {verifySuccess && (
                    <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-xs font-semibold text-green-800 flex items-center gap-2 animate-fadeIn">
                      <span className="text-green-600">✓</span> {verifySuccess}
                    </div>
                  )}
                  {verifyError && (
                    <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs font-bold text-red-700 flex items-center gap-2 animate-fadeIn">
                      <span>⚠</span> {verifyError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      Account Holder Name
                    </label>
                    <input 
                      type="text"
                      required
                      readOnly={isVerified}
                      value={accountName}
                      onChange={(e) => !isVerified && setAccountName(e.target.value)}
                      placeholder={isVerified ? "" : "Click Verify above to auto-fill account name"}
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none ${
                        isVerified
                          ? "border-green-200 bg-green-50 text-green-800 font-bold cursor-default"
                          : "border-gray-200 focus:border-blue-500"
                      }`}
                    />
                    {isVerified && (
                      <span className="block text-[10px] text-green-600 font-semibold mt-1">✓ Name auto-filled from bank records — cannot be edited.</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={withdrawSubmitting || !isVerified}
                    className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3 text-sm font-semibold text-white shadow hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Banknote className="h-4.5 w-4.5" /> 
                    {withdrawSubmitting ? "Queueing Withdrawal Request..." : "Request Bank Transfer Payout"}
                  </button>

                  {!isVerified && (
                    <p className="text-center text-[10px] text-gray-400">You must verify your bank account before submitting.</p>
                  )}

                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: PROFILE */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-6">Profile Settings</h3>

              {profileSuccess && <p className="rounded-xl bg-blue-50 p-3 text-xs font-bold text-blue-800 border border-blue-100 mb-4">{profileSuccess}</p>}
              {profileError && <p className="text-xs font-bold text-red-600 mb-4">{profileError}</p>}

              <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-md">
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Full Legal Name</label>
                    <input 
                      type="text" 
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Registered Email</label>
                    <input 
                      type="email" 
                      required
                      readOnly
                      value={profileEmail}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none text-gray-400 cursor-not-allowed"
                    />
                    <span className="block text-[10px] text-gray-400 mt-1">Email address cannot be changed to protect verification logs.</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-5 space-y-4">
                  <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1"><Lock className="h-4 w-4 text-blue-500" /> Security Password Manager</h4>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Current Password</label>
                    <input 
                      type="password" 
                      value={passwordForm.old}
                      onChange={(e) => setPasswordForm({ ...passwordForm, old: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">New Password</label>
                    <input 
                      type="password" 
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
                >
                  Save Profile Modifications
                </button>

              </form>
            </div>
          </div>
        )}

        {/* TAB 7: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <EarnerNotifications
            notifications={earnerNotifications}
            onMarkRead={(id) => {
              if (onMarkNotificationRead) onMarkNotificationRead(id);
            }}
            onMarkAllRead={() => {
              if (onMarkAllNotificationsRead) onMarkAllNotificationsRead();
            }}
            onNavigate={onNavigate}
            onTaskClick={(taskId) => {
              setHighlightTaskId(taskId);
              setActiveTab("tasks");
            }}
          />
        )}

        {/* TAB: WALLET */}
        {activeTab === "wallet" && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-gradient-to-tr from-blue-600 to-blue-800 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-y-6 translate-x-6 opacity-10">
                <Banknote className="h-44 w-44" />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-50 uppercase tracking-widest">Available Wallet Balance</p>
                <p className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mt-1.5">
                  ₦{metrics.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="mt-6 flex gap-3 flex-wrap">
                <button onClick={() => setActiveTab("tasks")} className="rounded-xl bg-white text-blue-800 hover:bg-blue-50 px-4 py-2 text-xs font-bold shadow transition-all cursor-pointer">
                  Browse Tasks
                </button>
                <button onClick={() => setActiveTab("withdraw")} className="rounded-xl bg-blue-700 hover:bg-blue-600 text-white border border-blue-500/50 px-4 py-2 text-xs font-bold shadow transition-all cursor-pointer">
                  Withdraw Earnings
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">Transaction History</h3>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">No transactions yet. Complete tasks to start earning!</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {transactions.map((tx: any, idx: number) => {
                    const isWithdrawal = tx.type === "Withdrawal";
                    const isFee       = tx.type === "Fee";
                    const isRefund    = tx.type === "Refund";
                    const wdLabel = isWithdrawal
                      ? tx.status === "Pending"  ? "Withdrawal Request - Pending"
                      : tx.status === "Approved" ? "Approved - Awaiting Payment"
                      : tx.status === "Paid"     ? "Withdrawal Successful"
                      : tx.status === "Success"  ? "Withdrawal Successful"
                      : tx.status === "Rejected" ? "Withdrawal Rejected"
                      : tx.status === "Failed"   ? "Withdrawal Failed"
                      : tx.description
                      : null;
                    const displayLabel = isWithdrawal
                      ? wdLabel
                      : isRefund
                        ? tx.description || "Withdrawal Refund"
                        : isFee
                          ? tx.description || "Withdrawal Processing Fee"
                          : tx.description;

                    const wdBadgeColor = isWithdrawal
                      ? tx.status === "Pending"  ? "bg-amber-100 text-amber-700 border-amber-200"
                      : tx.status === "Approved" ? "bg-orange-100 text-orange-700 border-orange-200"
                      : tx.status === "Paid"     ? "bg-green-100 text-green-700 border-green-200"
                      : tx.status === "Success"  ? "bg-green-100 text-green-700 border-green-200"
                      : tx.status === "Rejected" ? "bg-red-100 text-red-600 border-red-200"
                      : tx.status === "Failed"   ? "bg-red-100 text-red-600 border-red-200"
                      : "bg-gray-100 text-gray-500 border-gray-200"
                      : isRefund ? "bg-green-100 text-green-700 border-green-200"
                      : isFee   ? "bg-orange-100 text-orange-700 border-orange-200"
                      : null;

                    // Friendly badge label — never expose raw DB status values to earners
                    const badgeLabel = isWithdrawal
                      ? tx.status === "Pending"  ? "Pending"
                      : tx.status === "Approved" ? "Awaiting Payment"
                      : tx.status === "Paid"     ? "Successful"
                      : tx.status === "Success"  ? "Successful"
                      : tx.status === "Rejected" ? "Rejected"
                      : tx.status === "Failed"   ? "Failed"
                      : tx.status
                      : isRefund ? "Refunded"
                      : isFee    ? "Fee"
                      : null;

                    // Withdrawals flow OUT of the wallet (to the bank) — display as negative even
                    // though the DB stores the raw payout amount as a positive number.
                    // Fees are already stored negative. Refunds/earnings are positive credits.
                    const displayAmount = isWithdrawal ? -Math.abs(tx.amount) : tx.amount;

                    return (
                      <div key={idx} className="flex justify-between items-start py-3">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-xs font-semibold text-gray-800">{displayLabel}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{new Date(tx.createdAt).toLocaleDateString()} · {tx.type}</p>
                          {wdBadgeColor && badgeLabel && (
                            <span className={`inline-block mt-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${wdBadgeColor}`}>
                              {badgeLabel}
                            </span>
                          )}
                          {isWithdrawal && tx.status === "Rejected" && tx.rejectionReason && (
                            <p className="text-[10px] text-red-500 mt-0.5 italic">Reason: {tx.rejectionReason}</p>
                          )}
                        </div>
                        <span className={`font-mono text-sm font-bold shrink-0 ${displayAmount >= 0 ? "text-blue-600" : "text-red-500"}`}>
                          {displayAmount > 0 ? "+" : ""}₦{Math.abs(displayAmount).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: WAITING FOR APPROVAL */}
        {activeTab === "pending" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-amber-100 bg-amber-50">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-sm font-bold text-amber-900">Waiting for Approval</h3>
                  <p className="text-[10px] text-amber-600 mt-0.5">These tasks have been submitted and are awaiting advertiser review.</p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[10px] font-black text-amber-700">
                  {submissions.filter(s => s.status === SubmissionStatus.PENDING).length} pending
                </span>
              </div>
              {submissions.filter(s => s.status === SubmissionStatus.PENDING).length === 0 ? (
                <div className="text-center py-10 text-xs text-amber-500">No tasks currently waiting for approval. Submit proof on the Browse Tasks page to get started!</div>
              ) : (
                <div className="divide-y divide-amber-100">
                  {submissions.filter(s => s.status === SubmissionStatus.PENDING).map((sub, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-amber-50/60 transition-colors">
                      <PlatformIcon category={sub.category} size={14} showBg className="shrink-0 hidden sm:block" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{sub.taskTitle}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{sub.category} · Submitted {new Date(sub.submittedAt).toLocaleDateString()}</p>
                        {sub.proofText && <p className="text-[10px] text-gray-500 mt-1 line-clamp-1 font-mono">{sub.proofText}</p>}
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                        <span className="font-mono text-sm font-black text-gray-700">₦{sub.reward}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-amber-700">
                          <Clock className="h-2.5 w-2.5" /> Pending
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: COMPLETED TASKS */}
        {activeTab === "completed" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-blue-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-blue-50 bg-blue-50/50">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-sm font-bold text-blue-900">Completed Tasks</h3>
                  <p className="text-[10px] text-blue-600 mt-0.5">Approved submissions — earnings have been credited to your wallet.</p>
                </div>
                <span className="shrink-0 rounded-full bg-blue-100 border border-blue-200 px-2.5 py-0.5 text-[10px] font-black text-blue-700">
                  {submissions.filter(s => s.status === SubmissionStatus.APPROVED).length} completed
                </span>
              </div>
              {submissions.filter(s => s.status === SubmissionStatus.APPROVED).length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-400">No completed tasks yet. Approved submissions appear here.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {submissions.filter(s => s.status === SubmissionStatus.APPROVED).map((sub, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                      <PlatformIcon category={sub.category} size={14} showBg className="shrink-0 hidden sm:block" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{sub.taskTitle}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{sub.category} · {new Date(sub.submittedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                        <span className="font-mono text-sm font-black text-blue-600">+₦{sub.reward}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-blue-700">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Approved
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: REJECTED TASKS — dedicated page with full submission details */}
        {activeTab === "rejected" && (
          <div className="space-y-5">

            {/* Page header */}
            <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-sm">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-sm font-bold text-gray-900">Rejected Tasks</h2>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {rejectedSubmissions.length === 0
                      ? "No rejected submissions — great work!"
                      : `${rejectedSubmissions.length} task${rejectedSubmissions.length !== 1 ? "s" : ""} rejected — click Fix & Resubmit to correct and resubmit`}
                  </p>
                </div>
              </div>
              {rejectedSubmissions.length > 0 && (
                <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-red-100 border border-red-200 px-3 py-1 text-[10px] font-black text-red-700">
                  <XCircle className="h-3 w-3" /> {rejectedSubmissions.length} Rejected
                </span>
              )}
            </div>

            {rejectedSubmissions.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto h-14 w-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-7 w-7 text-green-500" />
                </div>
                <p className="font-bold text-gray-700 text-sm">All clear!</p>
                <p className="text-xs text-gray-400 mt-1">You have no rejected task submissions at the moment.</p>
                <button
                  onClick={() => setActiveTab("tasks")}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-5 py-2.5 text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer"
                >
                  <Briefcase className="h-3.5 w-3.5" /> Browse Available Tasks
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {rejectedSubmissions.map((sub: any) => (
                  <div key={sub.submissionId} className="rounded-2xl border border-red-100 bg-white shadow-sm overflow-hidden">

                    {/* Card header — task identity + status badge */}
                    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <PlatformIcon category={sub.category} size={16} showBg className="shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-1">{sub.taskTitle}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-gray-500">{sub.category}</span>
                            <span>·</span>
                            <span className="font-mono font-bold text-blue-600">₦{sub.reward.toLocaleString()}</span>
                            {sub.rejectedAt && (
                              <>
                                <span>·</span>
                                <span>Rejected {new Date(sub.rejectedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-red-600">
                        <XCircle className="h-2.5 w-2.5" /> Rejected
                      </span>
                    </div>

                    {/* Details grid — reward, platform, date */}
                    <div className="mx-5 mb-3 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 text-center">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Reward</p>
                        <p className="font-mono text-sm font-black text-blue-600 mt-0.5">₦{sub.reward.toLocaleString()}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 text-center">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Platform</p>
                        <p className="text-xs font-bold text-gray-700 mt-0.5 truncate">{sub.category.split(" ")[0]}</p>
                      </div>
                      <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-center">
                        <p className="text-[9px] font-bold text-red-400 uppercase tracking-wide">Status</p>
                        <p className="text-xs font-black text-red-600 mt-0.5">Rejected</p>
                      </div>
                    </div>

                    {/* Rejection reason */}
                    <div className="mx-5 mb-3">
                      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-red-700 uppercase tracking-wide mb-1">Rejection Reason</p>
                          <p className="text-[11px] text-red-700 leading-relaxed">
                            {sub.rejectionReason || "No specific reason was provided. Please review the task instructions carefully and resubmit with clear proof."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Task instructions (collapsible) */}
                    {sub.taskDescription && (
                      <div className="mx-5 mb-3">
                        <details className="group">
                          <summary className="cursor-pointer select-none text-[10px] font-black text-gray-400 uppercase tracking-wide flex items-center gap-1.5 hover:text-gray-600 transition-colors">
                            <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                            Original Task Instructions
                          </summary>
                          <div className="mt-2 rounded-xl bg-white border border-gray-100 px-4 py-3 space-y-2">
                            <p className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-line">{sub.taskDescription}</p>
                            {sub.proofRequirements && (
                              <div className="pt-2 border-t border-gray-50">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Proof Requirements</p>
                                <p className="text-[11px] text-gray-600 leading-relaxed">{sub.proofRequirements}</p>
                              </div>
                            )}
                          </div>
                        </details>
                      </div>
                    )}

                    {/* Action footer */}
                    <div className="border-t border-red-50 px-5 py-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-red-50/30">
                      <button
                        onClick={() => navigate(`/earner/rejected/${sub.submissionId}`)}
                        className="flex-1 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer justify-center"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Fix &amp; Resubmit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteRejectedId(sub.submissionId)}
                        className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer justify-center"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* Delete Rejected Submission Confirmation Modal */}
        {confirmDeleteRejectedId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-red-100 overflow-hidden">
              <div className="bg-red-50 px-6 py-5 border-b border-red-100 flex items-start gap-3">
                <div className="shrink-0 h-9 w-9 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-red-900">Delete Rejected Task?</h3>
                  <p className="text-xs text-red-700 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>
              <div className="px-6 py-4">
                <p className="text-xs text-gray-600 leading-relaxed">
                  Are you sure you want to delete this rejected task? It will be permanently removed from your Rejected Tasks list. No other tasks or records will be affected.
                </p>
              </div>
              <div className="px-6 pb-5 flex gap-3">
                <button
                  onClick={() => setConfirmDeleteRejectedId(null)}
                  disabled={deletingRejected}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRejected}
                  disabled={deletingRejected}
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-xs font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {deletingRejected ? (
                    <>
                      <div className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" /> Yes, Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Push Notification Settings Card */}
            <PushNotificationSettings apiFetch={apiFetch} showToast={showToast} />

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-500" /> Account Settings
              </h3>
              {profileSuccess && <p className="rounded-xl bg-blue-50 p-3 text-xs font-bold text-blue-800 border border-blue-100 mb-4">{profileSuccess}</p>}
              {profileError && <p className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600 border border-red-100 mb-4">{profileError}</p>}
              <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-md">
                <p className="text-xs text-gray-500 border-b border-gray-100 pb-4">Update your password to keep your account secure.</p>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Current Password</label>
                  <input type="password" value={passwordForm.old} onChange={(e) => setPasswordForm({ ...passwordForm, old: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">New Password</label>
                  <input type="password" value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Confirm New Password</label>
                  <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <button type="submit" className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white shadow transition-all">
                  Update Password
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
