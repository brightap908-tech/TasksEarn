import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Task,
  TaskSubmission,
  Transaction,
  TaskStatus,
  SubmissionStatus,
  TransactionStatus,
  TASK_ACTIONS
} from "../types";
import { usePlatforms } from "../lib/platformsStore";
import PlatformIcon from "./PlatformIcon";
import {
  LayoutDashboard,
  PlusCircle,
  Briefcase,
  CheckSquare,
  History,
  Wallet,
  Play,
  Pause,
  Trash2,
  Check,
  X,
  Info,
  ChevronRight,
  ZoomIn,
  UserCircle,
  Camera,
  Bell,
  Shield,
  LogOut,
  Save,
  Eye,
  EyeOff,
  TrendingUp,
  Target,
  ArrowUpRight,
  RefreshCw,
  Tags,
  Coins
} from "lucide-react";

interface AdvertiserDashboardProps {
  user: User;
  onRefreshUser: () => void;
  onNavigate: (view: string) => void;
  onOpenDeposit: (amount?: string) => void;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
  settings?: { minDeposit: number };
}

type Tab = "overview" | "create" | "manage" | "audit" | "transactions" | "price-list" | "profile" | "wallet" | "fund" | "pending-submissions" | "approved" | "rejected" | "notifications" | "settings";

const COUNTRIES = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Uganda", "Tanzania", "Rwanda",
  "Cameroon", "Senegal", "Ivory Coast", "United States", "United Kingdom",
  "Canada", "Australia", "India", "Germany", "France", "Netherlands", "Other"
];

export default function AdvertiserDashboard({
  user,
  onRefreshUser,
  onNavigate,
  onOpenDeposit,
  apiFetch,
  settings
}: AdvertiserDashboardProps) {
  const minDeposit = settings?.minDeposit || 100;
  const [fundAmount, setFundAmount] = React.useState(String(minDeposit));
  const [fundError, setFundError] = React.useState("");
  const VALID_ADVERTISER_TABS: Tab[] = ["overview", "create", "manage", "audit", "transactions", "price-list", "profile", "wallet", "fund", "pending-submissions", "approved", "rejected", "notifications", "settings"];
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const activeTab: Tab = (VALID_ADVERTISER_TABS.includes(section as Tab) ? section : "overview") as Tab;
  const setActiveTab = (tab: Tab) => navigate(`/advertiser/${tab}`);

  // ── Dashboard Stats ──────────────────────────────────────────────────────
  const [stats, setStats] = React.useState({
    walletBalance: 0,
    totalSpent: 0,
    campaignsCount: 0,
    activeCount: 0,
    pausedCount: 0,
    completedCount: 0,
    pendingSubmissionsCount: 0,
    recentTasks: [] as Task[]
  });

  // ── Campaigns, Submissions, Transactions ─────────────────────────────────
  const [campaigns, setCampaigns] = React.useState<Task[]>([]);
  const [submissions, setSubmissions] = React.useState<TaskSubmission[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [pricingList, setPricingList] = React.useState<any[]>([]);

  // ── Advertiser Price List (no earner rewards exposed) ─────────────────────
  const [advertiserPricing, setAdvertiserPricing] = React.useState<{ id: string; platform: string; costPerSlot: number; logoUrl?: string | null }[]>([]);
  const [priceListLoading, setPriceListLoading] = React.useState(false);

  // ── Audit ─────────────────────────────────────────────────────────────────

  // ── Platforms ─────────────────────────────────────────────────────────────
  const { platforms } = usePlatforms();

  // ── Campaign Form ─────────────────────────────────────────────────────────
  const [campaignForm, setCampaignForm] = React.useState({
    title: "",
    description: "",
    platform: "",
    action: TASK_ACTIONS[0] as string,
    link: "",
    proofRequirements: "",
    earningPerSlot: "15",
    totalSlots: "100"
  });
  const [formError, setFormError] = React.useState("");
  const [formSuccess, setFormSuccess] = React.useState(false);
  const [formSubmitting, setFormSubmitting] = React.useState(false);
  const [showPriceGuide, setShowPriceGuide] = React.useState(true);

  // ── Profile Form ──────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = React.useState({
    name: user.name || "",
    username: user.username || "",
    email: user.email || "",
    phone: user.phone || "",
    country: user.country || "",
    businessName: user.businessName || "",
    photoUrl: user.photoUrl || "",
    twoFactorEnabled: user.twoFactorEnabled || false,
    notificationPrefs: user.notificationPrefs || {
      emailNotifications: true,
      campaignUpdates: true,
      transactionAlerts: true
    }
  });
  const [profileSaving, setProfileSaving] = React.useState(false);
  const [profileSuccess, setProfileSuccess] = React.useState("");
  const [profileError, setProfileError] = React.useState("");

  // Password change form
  const [pwForm, setPwForm] = React.useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = React.useState({ current: false, next: false, confirm: false });
  const [pwSaving, setPwSaving] = React.useState(false);
  const [pwError, setPwError] = React.useState("");
  const [pwSuccess, setPwSuccess] = React.useState("");

  // Delete account
  const [deleteConfirmPw, setDeleteConfirmPw] = React.useState("");
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  // Photo preview
  const photoInputRef = React.useRef<HTMLInputElement>(null);

  // ── Calculations ──────────────────────────────────────────────────────────
  // IMPORTANT: All pricing MUST come exclusively from the DB (via /api/pricing).
  // No local fallback formulas — they cause frontend/backend cost mismatches.
  const category = campaignForm.platform
    ? `${campaignForm.platform} ${campaignForm.action}`
    : "";
  const matchingPricing = pricingList.find(
    p => p.platform.toLowerCase() === campaignForm.platform.toLowerCase()
  );
  // Use DB values only; 0 means pricing not yet loaded or unavailable for platform
  const earningVal = matchingPricing ? matchingPricing.earningPerSlot : 0;
  const slotsVal = parseInt(campaignForm.totalSlots) || 0;
  const costPerSlot = matchingPricing ? matchingPricing.costPerSlot : 0;
  const totalCost = costPerSlot * slotsVal;

  // ── Default platform once loaded ──────────────────────────────────────────
  React.useEffect(() => {
    if (!campaignForm.platform && platforms.length > 0) {
      setCampaignForm(f => ({ ...f, platform: platforms[0].name }));
    }
  }, [platforms]);

  // ── Sync profile form when user updates ───────────────────────────────────
  React.useEffect(() => {
    setProfileForm(prev => ({
      ...prev,
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      country: user.country || "",
      businessName: user.businessName || "",
      photoUrl: user.photoUrl || "",
      twoFactorEnabled: user.twoFactorEnabled || false,
      notificationPrefs: user.notificationPrefs || prev.notificationPrefs
    }));
  }, [user]);

  // ── API Fetchers ──────────────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const data = await apiFetch("/api/advertiser/dashboard");
      if (data && !data.error) setStats(data);
    } catch (e) { console.error(e); }
  };

  const fetchCampaigns = async () => {
    try {
      const data = await apiFetch("/api/advertiser/tasks");
      if (Array.isArray(data)) setCampaigns(data);
    } catch (e) {}
  };

  const fetchSubmissions = async () => {
    try {
      const data = await apiFetch("/api/advertiser/submissions");
      if (Array.isArray(data)) setSubmissions(data);
    } catch (e) {}
  };

  const fetchTransactions = async () => {
    try {
      const data = await apiFetch("/api/user/transactions");
      if (Array.isArray(data)) setTransactions(data);
    } catch (e) {}
  };

  const fetchPricing = async () => {
    try {
      const data = await apiFetch("/api/pricing");
      if (Array.isArray(data)) setPricingList(data);
    } catch (e) {}
  };

  const fetchAdvertiserPricing = async () => {
    setPriceListLoading(true);
    try {
      const data = await apiFetch("/api/advertiser/pricing");
      if (Array.isArray(data)) setAdvertiserPricing(data);
    } catch (e) {} finally {
      setPriceListLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStats();
    fetchTransactions();
    fetchPricing();
  }, [user.walletBalance]);

  React.useEffect(() => {
    if (activeTab === "overview") fetchStats();
    if (activeTab === "manage") fetchCampaigns();
    if (activeTab === "audit" || activeTab === "pending-submissions" || activeTab === "approved" || activeTab === "rejected") fetchSubmissions();
    if (activeTab === "transactions" || activeTab === "wallet") fetchTransactions();
    if (activeTab === "price-list") fetchAdvertiserPricing();
  }, [activeTab]);

  // ── Campaign Create ───────────────────────────────────────────────────────
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.title || !campaignForm.description || !campaignForm.link || !campaignForm.proofRequirements) {
      setFormError("All campaign fields are required.");
      return;
    }
    if (!matchingPricing) {
      setFormError("Platform pricing is not available yet. Please try again or contact the administrator.");
      return;
    }
    if (totalCost > user.walletBalance) {
      setFormError(`Insufficient balance. This campaign costs ₦${totalCost.toLocaleString()} (₦${costPerSlot}/slot × ${slotsVal} slots). Please fund your wallet.`);
      return;
    }
    setFormSubmitting(true);
    setFormError("");
    setFormSuccess(false);
    try {
      const res = await apiFetch("/api/advertiser/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: campaignForm.title,
          description: campaignForm.description,
          category,
          platform: campaignForm.platform,
          proofRequirements: campaignForm.proofRequirements,
          link: campaignForm.link,
          totalSlots: campaignForm.totalSlots
        })
      });
      if (res?.error) {
        setFormError(res.error);
      } else {
        setFormSuccess(true);
        setCampaignForm({
          title: "",
          description: "",
          platform: platforms.length > 0 ? platforms[0].name : "",
          action: TASK_ACTIONS[0] as string,
          link: "",
          proofRequirements: "",
          earningPerSlot: "15",
          totalSlots: "100"
        });
        onRefreshUser();
        setTimeout(() => { setFormSuccess(false); setActiveTab("manage"); }, 3000);
      }
    } catch (e) {
      setFormError("Failed to create campaign. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Campaign Toggle & Delete ──────────────────────────────────────────────
  const handleToggleStatus = async (taskId: string) => {
    try {
      const res = await apiFetch(`/api/advertiser/tasks/${taskId}/toggle`, { method: "POST" });
      if (res?.success) fetchCampaigns();
    } catch (e) {}
  };

  const handleDeleteCampaign = async (taskId: string) => {
    if (!window.confirm("Delete this campaign? Unused budget will be refunded to your wallet.")) return;
    try {
      const res = await apiFetch(`/api/advertiser/tasks/${taskId}`, { method: "DELETE" });
      if (res?.success) {
        onRefreshUser();
        fetchCampaigns();
        alert(`Campaign deleted. ₦${res.refundedAmount?.toLocaleString() || 0} refunded to wallet.`);
      }
    } catch (e) {}
  };


  // ── Profile Save ──────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      const res = await apiFetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileForm.name,
          username: profileForm.username || undefined,
          phone: profileForm.phone || undefined,
          country: profileForm.country || undefined,
          businessName: profileForm.businessName || undefined,
          photoUrl: profileForm.photoUrl || undefined,
          twoFactorEnabled: profileForm.twoFactorEnabled,
          notificationPrefs: profileForm.notificationPrefs
        })
      });
      if (res?.error) {
        setProfileError(res.error);
      } else {
        setProfileSuccess("Profile saved successfully.");
        onRefreshUser();
        setTimeout(() => setProfileSuccess(""), 3000);
      }
    } catch (e) {
      setProfileError("Failed to save profile. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Password Change ───────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    setPwError("");
    setPwSuccess("");
    if (!pwForm.current || !pwForm.next) { setPwError("All password fields are required."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("New passwords do not match."); return; }
    if (pwForm.next.length < 6) { setPwError("Password must be at least 6 characters."); return; }
    setPwSaving(true);
    try {
      const res = await apiFetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next })
      });
      if (res?.error) {
        setPwError(res.error);
      } else {
        setPwSuccess("Password changed successfully.");
        setPwForm({ current: "", next: "", confirm: "" });
        setTimeout(() => setPwSuccess(""), 3000);
      }
    } catch (e) {
      setPwError("Failed to change password. Please try again.");
    } finally {
      setPwSaving(false);
    }
  };

  // ── Delete Account ────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!deleteConfirmPw) return;
    setDeleteLoading(true);
    try {
      const res = await apiFetch("/api/user/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deleteConfirmPw })
      });
      if (res?.error) {
        alert(res.error);
      } else {
        alert("Account deleted. You will be logged out.");
        onNavigate("logout");
      }
    } catch (e) {
      alert("Failed to delete account. Please try again.");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  // ── Photo Upload Handler ──────────────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setProfileError("Photo must be under 2MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setProfileForm(prev => ({ ...prev, photoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  // ── Sidebar button helper ─────────────────────────────────────────────────
  const navBtn = (tab: Tab, label: string, icon: React.ReactNode, badge?: string | number) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center justify-between ${
        activeTab === tab
          ? "bg-blue-50 text-blue-600 border-r-4 border-blue-500"
          : "text-slate-500 hover:bg-slate-50/50"
      }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
        {badge != null && Number(badge) > 0 && (
          <span className="ml-1 rounded-full bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5">
            {badge}
          </span>
        )}
      </span>
      <ChevronRight className="h-3.5 w-3.5 opacity-50" />
    </button>
  );

  // ── Input field helper ────────────────────────────────────────────────────
  const inputClass = "w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none";
  const labelClass = "block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

      {/* ── Sidebar ── */}
      <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-20 lg:self-start">

        {/* Profile Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
          {/* Avatar */}
          <div className="relative inline-block">
            {profileForm.photoUrl || user.photoUrl ? (
              <img
                src={profileForm.photoUrl || user.photoUrl}
                alt="Profile"
                className="mx-auto h-16 w-16 rounded-full object-cover border-4 border-blue-100"
              />
            ) : (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-blue-100 font-display text-xl font-black text-white"
                style={{ background: "linear-gradient(135deg,#2563EB,#4f46e5)" }}>
                {user.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-800">{user.name}</h3>
          {user.businessName && (
            <p className="text-[10px] text-slate-400 mt-0.5">{user.businessName}</p>
          )}
          <p className="text-[10px] text-blue-600 font-semibold tracking-wider uppercase mt-1">Campaign Manager</p>

          {/* Wallet Balance */}
          <div className="mt-4 rounded-xl border border-blue-100 p-3"
            style={{ background: "linear-gradient(135deg,#DBEAFE,#FFFFFF)" }}>
            <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
              Ad Wallet Balance
            </span>
            <span className="font-mono text-lg font-black text-blue-600">
              ₦{user.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={onOpenDeposit}
            className="w-full mt-3 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
          >
            💳 Fund Wallet
          </button>
        </div>

        {/* Navigation (desktop only — mobile uses the bottom nav bar + hamburger menu) */}
        <div className="hidden lg:block rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-1">
          {navBtn("overview", "Dashboard", <LayoutDashboard className="h-4 w-4 text-slate-400" />)}
          {navBtn("create", "Create Campaign", <PlusCircle className="h-4 w-4 text-slate-400" />)}
          {navBtn("price-list", "Task Price List", <Tags className="h-4 w-4 text-slate-400" />)}
          {navBtn("manage", `My Campaigns (${campaigns.length || stats.campaignsCount})`, <Briefcase className="h-4 w-4 text-slate-400" />)}
          {navBtn("wallet", "Wallet", <Wallet className="h-4 w-4 text-slate-400" />)}
          {navBtn("fund", "Fund Wallet", <Coins className="h-4 w-4 text-slate-400" />)}
          {navBtn("pending-submissions", "Pending Submissions", <CheckSquare className="h-4 w-4 text-slate-400" />, stats.pendingSubmissionsCount)}
          {navBtn("approved", "Approved Tasks", <Check className="h-4 w-4 text-slate-400" />)}
          {navBtn("rejected", "Rejected Tasks", <X className="h-4 w-4 text-slate-400" />)}
          {navBtn("notifications", "Notifications", <Bell className="h-4 w-4 text-slate-400" />)}
          {navBtn("profile", "Profile", <UserCircle className="h-4 w-4 text-slate-400" />)}
          {navBtn("settings", "Settings", <Shield className="h-4 w-4 text-slate-400" />)}
        </div>

      </div>

      {/* ── Main Content ── */}
      <div className="lg:col-span-3 space-y-6">

        {/* ─── TAB: OVERVIEW ─────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Campaigns", value: stats.campaignsCount, color: "text-slate-800", icon: <Briefcase className="h-5 w-5 text-blue-400" /> },
                { label: "Active Now", value: stats.activeCount, color: "text-blue-600", icon: <Target className="h-5 w-5 text-blue-500" /> },
                { label: "Total Ad Spend", value: `₦${stats.totalSpent.toLocaleString()}`, color: "text-blue-700", icon: <Wallet className="h-5 w-5 text-indigo-500" /> },
                { label: "Pending Audits", value: stats.pendingSubmissionsCount, color: stats.pendingSubmissionsCount > 0 ? "text-amber-500" : "text-slate-400", icon: <CheckSquare className="h-5 w-5 text-amber-400" /> }
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    {s.icon}
                    <TrendingUp className="h-3 w-3 text-slate-300" />
                  </div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">{s.label}</span>
                  <span className={`block font-mono text-xl font-extrabold mt-0.5 ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Advertiser guidelines banner */}
            <div className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg,#2563EB,#4f46e5)" }}>
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(circle at 80% 50%,white 0%,transparent 60%)" }} />
              <div className="relative">
                <h3 className="font-display text-sm font-bold text-white/80 uppercase tracking-widest flex items-center gap-2">
                  <Info className="h-4 w-4" /> Submission Review Guidelines
                </h3>
                <p className="mt-2 text-xs text-white/70 leading-relaxed max-w-xl">
                  Review incoming proofs within <strong className="text-white">48 hours</strong>. Submissions not reviewed within 72 hours are automatically approved and credited to earners by the system.
                </p>
              </div>
            </div>

            {/* Recent Campaigns */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-sm font-bold text-gray-900">Recent Campaigns</h3>
                <button
                  onClick={() => setActiveTab("manage")}
                  className="text-[10px] font-bold text-blue-600 flex items-center gap-1"
                >
                  View all <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
              {stats.recentTasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  No campaigns yet. Click "Build Campaign" to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentTasks.map((task, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <PlatformIcon category={task.category} size={14} showBg className="shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 line-clamp-1">{task.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {task.category} · Budget: ₦{(task.costPerSlot * task.totalSlots).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-gray-400 font-mono">{task.filledSlots}/{task.totalSlots} slots</span>
                        <div className="mt-1">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                            task.status === TaskStatus.ACTIVE ? "bg-blue-50 text-blue-700" :
                            task.status === TaskStatus.PAUSED ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"
                          }`}>
                            {task.status}
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

        {/* ─── TAB: CREATE CAMPAIGN ──────────────────────────────────────── */}
        {activeTab === "create" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-1">Build New Ad Campaign</h3>
              <p className="text-xs text-gray-400 mb-6">Create micro-engagement tasks targeting real Nigerian social media users.</p>

              {formSuccess ? (
                <div className="rounded-xl border border-blue-100 p-6 text-center animate-fadeIn space-y-2"
                  style={{ background: "#DBEAFE" }}>
                  <p className="text-sm font-bold text-blue-800">🎉 Campaign Launched Successfully!</p>
                  <p className="text-xs text-blue-600">Budget deducted from wallet. Tasks are now live on the platform.</p>
                </div>
              ) : (
                <form onSubmit={handleCreateCampaign} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formError && (
                    <div className="md:col-span-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs font-bold text-red-600">
                      {formError}
                    </div>
                  )}

                  {/* ── Platform Price Guide ── */}
                  <div className="md:col-span-2">
                    <div className="rounded-xl border border-blue-100 overflow-hidden"
                      style={{ background: "linear-gradient(135deg,rgba(219,234,254,0.5),rgba(248,250,252,0.6))" }}>
                      {/* Header row */}
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-blue-100/60">
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Tags className="h-3.5 w-3.5 text-blue-500" />
                          Platform Price List — Cost Per Completed Task
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPriceGuide(v => !v)}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {showPriceGuide ? "Collapse" : "Show prices"}
                          <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${showPriceGuide ? "rotate-90" : ""}`} />
                        </button>
                      </div>

                      {showPriceGuide && (
                        <div className="p-3">
                          {pricingList.length === 0 ? (
                            <p className="text-[10px] text-slate-400 text-center py-3 animate-pulse">Loading platform prices…</p>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              {pricingList
                                .filter(p => p.platform !== "Custom" && p.costPerSlot > 0)
                                .map(p => {
                                  const isSelected = campaignForm.platform === p.platform;
                                  return (
                                    <button
                                      key={p.id || p.platform}
                                      type="button"
                                      onClick={() => setCampaignForm(f => ({
                                        ...f,
                                        platform: p.platform,
                                        earningPerSlot: p.earningPerSlot != null
                                          ? p.earningPerSlot.toString()
                                          : f.earningPerSlot
                                      }))}
                                      className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left transition-all cursor-pointer ${
                                        isSelected
                                          ? "border-blue-400 bg-blue-100 ring-1 ring-blue-300 shadow-sm"
                                          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/60"
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <PlatformIcon platform={p.platform} size={12} showBg className="shrink-0" />
                                        <span className="text-[11px] font-bold text-slate-700 truncate">{p.platform}</span>
                                      </div>
                                      <span className={`text-[11px] font-mono font-extrabold shrink-0 ${isSelected ? "text-blue-700" : "text-blue-600"}`}>
                                        ₦{p.costPerSlot.toLocaleString()}
                                      </span>
                                    </button>
                                  );
                                })}
                            </div>
                          )}
                          <p className="text-[9px] text-slate-400 mt-2 leading-relaxed">
                            Click a platform to select it. <strong className="text-slate-500">Total Cost = Price × Slots.</strong> Your wallet is charged only after the campaign is successfully created.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Campaign Title</label>
                      <input type="text" required value={campaignForm.title}
                        onChange={e => setCampaignForm({ ...campaignForm, title: e.target.value })}
                        placeholder="e.g. Subscribe to TechNaija YouTube"
                        className={inputClass} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Platform</label>
                        <select
                          value={campaignForm.platform}
                          onChange={e => {
                            const plat = e.target.value;
                            const match = pricingList.find(p => p.platform === plat);
                            setCampaignForm({
                              ...campaignForm,
                              platform: plat,
                              earningPerSlot: match ? match.earningPerSlot.toString() : campaignForm.earningPerSlot
                            });
                          }}
                          className={inputClass}
                        >
                          {platforms.length === 0 && <option value="">Loading...</option>}
                          {platforms.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Action Type</label>
                        <select value={campaignForm.action}
                          onChange={e => setCampaignForm({ ...campaignForm, action: e.target.value })}
                          className={inputClass}>
                          {TASK_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                      <p className="col-span-2 text-[10px] text-slate-400 -mt-1">
                        Category: <strong className="text-slate-600">{category || "—"}</strong>
                      </p>
                    </div>

                    <div>
                      <label className={labelClass}>Target Link / URL</label>
                      <input type="url" required value={campaignForm.link}
                        onChange={e => setCampaignForm({ ...campaignForm, link: e.target.value })}
                        placeholder="https://youtube.com/c/channelname"
                        className={`${inputClass} font-mono`} />
                    </div>

                    <div>
                      <label className={labelClass}>Task Instructions (for earners)</label>
                      <textarea required rows={4} value={campaignForm.description}
                        onChange={e => setCampaignForm({ ...campaignForm, description: e.target.value })}
                        placeholder="Step 1: Open the link. Step 2: Click Subscribe. Step 3: Take a screenshot..."
                        className={inputClass} />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Proof Requirements</label>
                      <textarea required rows={3} value={campaignForm.proofRequirements}
                        onChange={e => setCampaignForm({ ...campaignForm, proofRequirements: e.target.value })}
                        placeholder="Specify what proof earners must submit (e.g. screenshot showing subscribed status)."
                        className={inputClass} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>
                          Task Reward (₦/slot) {matchingPricing && <span className="text-blue-500">· Fixed</span>}
                        </label>
                        <input type="number" required min={5}
                          value={matchingPricing ? matchingPricing.earningPerSlot : campaignForm.earningPerSlot}
                          disabled={!!matchingPricing}
                          onChange={e => setCampaignForm({ ...campaignForm, earningPerSlot: e.target.value })}
                          className={`${inputClass} font-mono ${matchingPricing ? "opacity-60 cursor-not-allowed" : ""}`} />
                        <p className="text-[9px] text-slate-400 mt-1">Automatically set by platform pricing</p>
                      </div>
                      <div>
                        <label className={labelClass}>Total Slots</label>
                        <input type="number" required min={10} value={campaignForm.totalSlots}
                          onChange={e => setCampaignForm({ ...campaignForm, totalSlots: e.target.value })}
                          className={`${inputClass} font-mono`} />
                        <p className="text-[9px] text-slate-400 mt-1">Min. 10 slots per campaign</p>
                      </div>
                    </div>

                    {/* Budget Estimator — always uses DB pricing; never computes locally */}
                    {matchingPricing ? (
                      <div className="rounded-xl border border-blue-100 p-4 space-y-2.5 font-mono text-xs"
                        style={{ background: "#DBEAFE" }}>
                        <p className="font-sans text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                          Campaign Budget Estimate
                        </p>
                        <div className="flex justify-between text-blue-700">
                          <span>Platform cost per slot:</span>
                          <span className="font-bold">₦{costPerSlot.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-blue-700">
                          <span>Total slots:</span>
                          <span className="font-bold">× {slotsVal.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-blue-200/60 pt-2 flex justify-between font-bold text-sm text-blue-800">
                          <span>Total Campaign Cost:</span>
                          <span>₦{totalCost.toLocaleString()}</span>
                        </div>
                        <div className="text-[10px] text-blue-500 font-sans pt-0.5">
                          Wallet after launch: <strong>₦{(user.walletBalance - totalCost).toLocaleString()}</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-amber-100 p-4 text-xs text-amber-700 font-sans"
                        style={{ background: "#FFFBEB" }}>
                        {pricingList.length === 0
                          ? "Loading platform pricing…"
                          : "Pricing is not configured for this platform yet. Contact the administrator."}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={formSubmitting || !matchingPricing}
                      className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white shadow-sm hover:shadow-md transition-all disabled:opacity-60"
                    >
                      {formSubmitting
                        ? "Launching campaign..."
                        : matchingPricing
                          ? `Launch Campaign — ₦${totalCost.toLocaleString()}`
                          : "Pricing unavailable"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: MANAGE CAMPAIGNS ─────────────────────────────────────── */}
        {activeTab === "manage" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-sm font-bold text-gray-900">My Campaigns</h3>
                <button onClick={fetchCampaigns} className="p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 text-gray-400 transition-colors">
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>

              {campaigns.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">
                  No campaigns yet. Click "Build Campaign" to launch your first ad.
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((task, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-blue-100 transition-colors">
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase"
                          style={{ background: "#DBEAFE", color: "#1D4ED8" }}>
                          <PlatformIcon category={task.category} size={11} />
                          {task.category}
                        </span>
                        <h4 className="font-display text-xs font-bold text-gray-800 mt-2 line-clamp-1">{task.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 mt-1 font-mono">
                          <span>Cost/slot: ₦{task.costPerSlot}</span>
                          <span>Total budget: ₦{(task.costPerSlot * task.totalSlots).toLocaleString()}</span>
                          <span>Slots: {task.filledSlots}/{task.totalSlots}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Progress bar */}
                        <div className="hidden sm:block w-20">
                          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all"
                              style={{ width: `${task.totalSlots > 0 ? Math.min(100, (task.filledSlots / task.totalSlots) * 100) : 0}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-gray-400 text-right mt-0.5">
                            {task.totalSlots > 0 ? Math.round((task.filledSlots / task.totalSlots) * 100) : 0}%
                          </p>
                        </div>

                        <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                          task.status === TaskStatus.ACTIVE ? "bg-blue-50 text-blue-700" :
                          task.status === TaskStatus.PAUSED ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {task.status}
                        </span>

                        {task.status !== TaskStatus.COMPLETED && (
                          <button
                            onClick={() => handleToggleStatus(task.id)}
                            className="p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                            title={task.status === TaskStatus.ACTIVE ? "Pause" : "Resume"}
                          >
                            {task.status === TaskStatus.ACTIVE
                              ? <Pause className="h-3.5 w-3.5 text-amber-500" />
                              : <Play className="h-3.5 w-3.5 text-blue-500" />}
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteCampaign(task.id)}
                          className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition-colors"
                          title="Delete & Refund"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: AUDITING DESK ────────────────────────────────────────── */}
        {activeTab === "audit" && (
          <div className="space-y-6">

            {/* Pending Queue */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">
                Pending Proofs ({submissions.filter(s => s.status === SubmissionStatus.PENDING).length})
              </h3>
              {submissions.filter(s => s.status === SubmissionStatus.PENDING).length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-400">
                  🎉 No pending proofs awaiting review.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase text-[9px] font-bold">
                        <th className="py-2.5 px-1">Campaign</th>
                        <th className="py-2.5 px-1">Submitted By</th>
                        <th className="py-2.5 px-1">Date</th>
                        <th className="py-2.5 px-1">Proof Summary</th>
                        <th className="py-2.5 px-1 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.filter(s => s.status === SubmissionStatus.PENDING).map((sub, idx) => (
                        <tr key={idx} className="border-b border-gray-50 hover:bg-blue-50/30">
                          <td className="py-3 px-1 font-bold text-gray-800 max-w-xs">
                            <div className="flex items-center gap-1.5">
                              <PlatformIcon category={sub.category} size={13} className="shrink-0" />
                              <span className="truncate">{sub.taskTitle}</span>
                            </div>
                          </td>
                          <td className="py-3 px-1 text-gray-600">{sub.earnerName}</td>
                          <td className="py-3 px-1 text-gray-400">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                          <td className="py-3 px-1 font-mono text-gray-500 max-w-xs truncate">{sub.proofText}</td>
                          <td className="py-3 px-1 text-right">
                            <button
                              onClick={() => navigate(`/advertiser/audit/${sub.id}`)}
                              className="rounded-lg px-2.5 py-1 text-[10px] font-bold text-white transition-all"
                              style={{ background: "#2563EB" }}
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Audit History */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">Audit History</h3>
              {submissions.filter(s => s.status !== SubmissionStatus.PENDING).length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">No past audits yet.</div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto">
                  {submissions.filter(s => s.status !== SubmissionStatus.PENDING).map((sub, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs border-b border-gray-50 pb-2 gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <PlatformIcon category={sub.category} size={14} showBg className="shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 line-clamp-1">{sub.taskTitle}</p>
                          <p className="text-[10px] text-gray-400">{sub.earnerName} · {new Date(sub.submittedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                        sub.status === SubmissionStatus.APPROVED ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-600"
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ─── TAB: TRANSACTIONS ─────────────────────────────────────────── */}
        {activeTab === "transactions" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">Payment & Transaction History</h3>
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">
                  No transactions recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase text-[9px] font-bold">
                        <th className="py-2.5 px-1">Description</th>
                        <th className="py-2.5 px-1">Reference</th>
                        <th className="py-2.5 px-1">Type</th>
                        <th className="py-2.5 px-1">Amount</th>
                        <th className="py-2.5 px-1">Date</th>
                        <th className="py-2.5 px-1">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, idx) => (
                        <tr key={idx} className="border-b border-gray-50 hover:bg-blue-50/20">
                          <td className="py-3 px-1 font-bold text-gray-800">{tx.description}</td>
                          <td className="py-3 px-1 font-mono text-[10px] text-gray-400">{tx.reference}</td>
                          <td className="py-3 px-1 text-gray-500">{tx.type}</td>
                          <td className="py-3 px-1 font-mono font-bold text-gray-800">₦{tx.amount.toLocaleString()}</td>
                          <td className="py-3 px-1 text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-1">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                              tx.status === TransactionStatus.SUCCESS || tx.status === TransactionStatus.APPROVED
                                ? "bg-blue-50 text-blue-700"
                                : tx.status === TransactionStatus.PENDING
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-600"
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: TASK PRICE LIST ───────────────────────────────────────── */}
        {activeTab === "price-list" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-black text-slate-800 flex items-center gap-2">
                    <Tags className="h-5 w-5 text-blue-500" /> Task Price List
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    These are the current advertising prices. Your wallet will be charged according to the selected platform and the number of task slots you create.
                  </p>
                </div>
                <button
                  onClick={fetchAdvertiserPricing}
                  disabled={priceListLoading}
                  className="rounded-xl border border-slate-200 hover:bg-slate-50 p-2.5 text-xs font-bold text-slate-600 transition-all flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className={`h-4 w-4 ${priceListLoading ? "animate-spin" : ""}`} /> Refresh
                </button>
              </div>
            </div>

            {priceListLoading ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
                <RefreshCw className="h-8 w-8 text-blue-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400 mt-3 font-semibold animate-pulse">Loading platform prices...</p>
              </div>
            ) : advertiserPricing.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
                <Coins className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400">No pricing available yet.</p>
                <p className="text-xs text-slate-400 mt-1">The administrator hasn't configured platform pricing. Check back later.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                {/* Info banner */}
                <div className="border-b border-blue-100 bg-blue-50/60 px-5 py-3 flex items-center gap-2.5">
                  <Info className="h-4 w-4 text-blue-500 shrink-0" />
                  <p className="text-xs text-blue-700">
                    <strong>How pricing works:</strong> The cost shown is charged per completed and verified task slot. Your total campaign cost = price per slot × number of slots you choose.
                  </p>
                </div>

                {/* Mobile card list (visible below md) */}
                <div className="md:hidden divide-y divide-slate-100">
                  {advertiserPricing.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-4 hover:bg-blue-50/20 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                          {item.logoUrl ? (
                            <img src={item.logoUrl} alt={item.platform} className="h-full w-full object-contain p-1" />
                          ) : (
                            <span className="text-sm font-black text-blue-600">{item.platform.substring(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <span className="font-bold text-slate-800 text-sm truncate">{item.platform}</span>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className="font-mono font-extrabold text-blue-600 text-base">₦{item.costPerSlot.toLocaleString()}</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">per task</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table (hidden below md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/60 text-[10px] text-slate-400 font-extrabold tracking-wider uppercase border-b border-slate-200">
                        <th className="px-5 py-4 w-1/2">Platform</th>
                        <th className="px-5 py-4">Advertiser Price Per Task (₦)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {advertiserPricing.map((item) => (
                        <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                                {item.logoUrl ? (
                                  <img src={item.logoUrl} alt={item.platform} className="h-full w-full object-contain p-1" />
                                ) : (
                                  <span className="text-sm font-black text-blue-600">{item.platform.substring(0, 2).toUpperCase()}</span>
                                )}
                              </div>
                              <span className="font-bold text-slate-800 text-sm">{item.platform}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1 font-mono font-extrabold text-blue-600 text-base">
                              ₦{item.costPerSlot.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans ml-1">/ task</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* CTA footer */}
                <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-400">All prices are in Nigerian Naira (₦) and include platform service fees.</p>
                  <button
                    onClick={() => setActiveTab("create")}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm w-full sm:w-auto justify-center"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Build a Campaign
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: PROFILE SETTINGS ─────────────────────────────────────── */}
        {activeTab === "profile" && (
          <div className="space-y-6">

            {/* Profile Photo & Basic Info */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <UserCircle className="h-5 w-5 text-blue-500" />
                <h3 className="font-display text-sm font-bold text-gray-900">Profile Information</h3>
              </div>

              {profileSuccess && (
                <div className="mb-4 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs font-bold text-blue-700 flex items-center gap-2">
                  <Check className="h-4 w-4" /> {profileSuccess}
                </div>
              )}
              {profileError && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs font-bold text-red-600">
                  {profileError}
                </div>
              )}

              {/* Photo Upload */}
              <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-50">
                <div className="relative shrink-0">
                  {profileForm.photoUrl ? (
                    <img
                      src={profileForm.photoUrl}
                      alt="Profile"
                      className="h-20 w-20 rounded-full object-cover photo-upload-ring"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full flex items-center justify-center text-white font-display text-2xl font-black photo-upload-ring"
                      style={{ background: "linear-gradient(135deg,#2563EB,#4f46e5)" }}>
                      {user.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors"
                    title="Change photo"
                  >
                    <Camera className="h-3.5 w-3.5 text-white" />
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Change profile photo
                  </button>
                  <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG · Max 2MB</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Your full name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Username</label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={e => setProfileForm({ ...profileForm, username: e.target.value })}
                    placeholder="e.g. technaija"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Business / Company Name (optional)</label>
                  <input
                    type="text"
                    value={profileForm.businessName}
                    onChange={e => setProfileForm({ ...profileForm, businessName: e.target.value })}
                    placeholder="e.g. TechNaija Digital"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    className={`${inputClass} opacity-60 cursor-not-allowed`}
                    title="Email cannot be changed directly"
                  />
                  <p className="text-[9px] text-gray-400 mt-1">Contact support to change email</p>
                </div>

                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="e.g. +234 801 234 5678"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Country</label>
                  <select
                    value={profileForm.country}
                    onChange={e => setProfileForm({ ...profileForm, country: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {profileSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>

            {/* Security: 2FA */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Shield className="h-5 w-5 text-blue-500" />
                <h3 className="font-display text-sm font-bold text-gray-900">Security Settings</h3>
              </div>

              {/* 2FA Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 mb-5">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-400 mt-0.5">Add an extra layer of security to your account</p>
                </div>
                <button
                  onClick={() => setProfileForm(p => ({ ...p, twoFactorEnabled: !p.twoFactorEnabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    profileForm.twoFactorEnabled ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    profileForm.twoFactorEnabled ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>

              {/* Password Change */}
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Change Password</h4>

              {pwSuccess && (
                <div className="mb-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-2.5 text-xs font-bold text-blue-700 flex items-center gap-2">
                  <Check className="h-3.5 w-3.5" /> {pwSuccess}
                </div>
              )}
              {pwError && (
                <div className="mb-3 rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-xs font-bold text-red-600">
                  {pwError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {([
                  { key: "current" as const, label: "Current Password", placeholder: "Enter current password" },
                  { key: "next" as const, label: "New Password", placeholder: "Min. 6 characters" },
                  { key: "confirm" as const, label: "Confirm New Password", placeholder: "Repeat new password" }
                ] as const).map(field => (
                  <div key={field.key}>
                    <label className={labelClass}>{field.label}</label>
                    <div className="relative">
                      <input
                        type={showPw[field.key] ? "text" : "password"}
                        value={pwForm[field.key]}
                        onChange={e => setPwForm(p => ({ ...p, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className={`${inputClass} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(p => ({ ...p, [field.key]: !p[field.key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPw[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleChangePassword}
                  disabled={pwSaving}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition-all disabled:opacity-60"
                >
                  <Shield className="h-3.5 w-3.5" />
                  {pwSaving ? "Updating…" : "Update Password"}
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Bell className="h-5 w-5 text-blue-500" />
                <h3 className="font-display text-sm font-bold text-gray-900">Notification Preferences</h3>
              </div>
              <div className="space-y-3">
                {([
                  { key: "emailNotifications" as const, label: "Email Notifications", desc: "Receive important updates by email" },
                  { key: "campaignUpdates" as const, label: "Campaign Updates", desc: "Alerts when your campaigns change status" },
                  { key: "transactionAlerts" as const, label: "Transaction Alerts", desc: "Notifications for deposits and spending" }
                ] as const).map(pref => (
                  <div key={pref.key} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{pref.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{pref.desc}</p>
                    </div>
                    <button
                      onClick={() => setProfileForm(p => ({
                        ...p,
                        notificationPrefs: {
                          ...p.notificationPrefs,
                          [pref.key]: !p.notificationPrefs[pref.key]
                        }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        profileForm.notificationPrefs[pref.key] ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        profileForm.notificationPrefs[pref.key] ? "translate-x-6" : "translate-x-1"
                      }`} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition-all disabled:opacity-60"
                >
                  <Save className="h-3.5 w-3.5" />
                  {profileSaving ? "Saving…" : "Save Preferences"}
                </button>
              </div>
            </div>

            {/* Wallet History (quick view) */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-500" />
                  <h3 className="font-display text-sm font-bold text-gray-900">Wallet Transaction History</h3>
                </div>
                <button
                  onClick={() => setActiveTab("transactions")}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  View all →
                </button>
              </div>
              {transactions.length === 0 ? (
                <p className="text-center py-6 text-xs text-gray-400">No transactions yet.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {transactions.slice(0, 8).map((tx, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-2 border-b border-gray-50">
                      <div>
                        <p className="font-semibold text-gray-700 line-clamp-1">{tx.description}</p>
                        <p className="text-[10px] text-gray-400">{new Date(tx.createdAt).toLocaleDateString()} · {tx.type}</p>
                      </div>
                      <span className={`font-mono font-bold ${
                        tx.type === "Campaign Spend" ? "text-red-500" : "text-blue-600"
                      }`}>
                        {tx.type === "Campaign Spend" ? "-" : "+"}₦{tx.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Danger Zone: Delete Account */}
            <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <LogOut className="h-5 w-5 text-red-500" />
                <h3 className="font-display text-sm font-bold text-red-700">Danger Zone</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Permanently delete your advertiser account and all associated data. This action <strong>cannot be undone</strong>.
                Active campaigns will be stopped and unused budget may be forfeited.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="rounded-xl border border-red-200 px-5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                Delete My Account
              </button>
            </div>

          </div>
        )}

        {/* ─── TAB: WALLET ───────────────────────────────────────────────── */}
        {activeTab === "wallet" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-500" />
                  <h3 className="font-display text-sm font-bold text-gray-900">Ad Wallet</h3>
                </div>
                <span className="font-mono text-xl font-black text-blue-600">₦{user.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setActiveTab("fund")} className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-sm cursor-pointer flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5" /> Fund Wallet
                </button>
                <button onClick={() => setActiveTab("create")} className="rounded-xl border border-blue-100 hover:bg-blue-50 px-5 py-2.5 text-xs font-bold text-blue-600 transition-all cursor-pointer">
                  Create Campaign
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">Transaction History</h3>
              {transactions.length === 0 ? (
                <p className="text-center py-8 text-xs text-gray-400">No transactions yet.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {transactions.map((tx, idx) => (
                    <div key={idx} className="flex justify-between items-center py-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-800 line-clamp-1">{tx.description}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{new Date(tx.createdAt).toLocaleDateString()} · {tx.type}</p>
                      </div>
                      <span className={`font-mono text-sm font-bold ${tx.type === "Campaign Spend" ? "text-red-500" : "text-blue-600"}`}>
                        {tx.type === "Campaign Spend" ? "-" : "+"}₦{tx.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: FUND WALLET ──────────────────────────────────────────── */}
        {activeTab === "fund" && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm max-w-md">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="h-5 w-5 text-blue-500" />
              <h3 className="font-display text-sm font-bold text-gray-900">Fund Your Ad Wallet</h3>
            </div>
            <p className="text-xs text-gray-400 mb-5">Secured by Paystack — cards, bank transfer &amp; USSD.</p>

            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 flex items-center justify-between mb-4">
              <span className="text-xs text-gray-600">Current wallet balance</span>
              <span className="font-mono font-bold text-blue-600">₦{user.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Amount to fund (₦)</label>
            <input
              type="number"
              min={minDeposit}
              value={fundAmount}
              onChange={(e) => { setFundAmount(e.target.value); setFundError(""); }}
              placeholder={`Min: ₦${minDeposit.toLocaleString()}`}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none font-mono mb-1 ${
                fundError ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
              }`}
            />
            {fundError ? (
              <p className="text-[11px] font-semibold text-red-500 mb-3">{fundError}</p>
            ) : (
              <p className="text-[10px] text-gray-400 mb-3">Minimum deposit: ₦{minDeposit.toLocaleString()}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-5">
              {[minDeposit, 500, 1000, 5000, 10000, 20000].filter((v, i, arr) => arr.indexOf(v) === i && v >= minDeposit).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => { setFundAmount(String(v)); setFundError(""); }}
                  className="rounded-full border border-blue-100 bg-blue-50 hover:bg-blue-100 px-3 py-1 text-[11px] font-bold text-blue-700 transition-all cursor-pointer"
                >
                  ₦{v.toLocaleString()}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                const amt = parseFloat(fundAmount);
                if (isNaN(amt) || amt < minDeposit) {
                  setFundError(`Minimum deposit amount is ₦${minDeposit.toLocaleString()}.`);
                  return;
                }
                setFundError("");
                onOpenDeposit(fundAmount);
              }}
              disabled={isNaN(parseFloat(fundAmount)) || parseFloat(fundAmount) < minDeposit}
              className={`w-full rounded-xl py-3 text-sm font-bold text-white shadow-sm transition-all flex items-center justify-center gap-2 ${
                isNaN(parseFloat(fundAmount)) || parseFloat(fundAmount) < minDeposit
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
              }`}
            >
              💳 Continue to Paystack Checkout
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-2">You will be redirected to a secure Paystack payment window.</p>
          </div>
        )}

        {/* ─── TAB: PENDING SUBMISSIONS ──────────────────────────────────── */}
        {activeTab === "pending-submissions" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-amber-50 bg-amber-50/50">
                <CheckSquare className="h-4 w-4 text-amber-500 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-display text-sm font-bold text-amber-900">Pending Submissions</h3>
                  <p className="text-[10px] text-amber-600 mt-0.5">Earner proofs awaiting your review. Please review within 48 hours.</p>
                </div>
                <span className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[10px] font-black text-amber-700">
                  {submissions.filter(s => s.status === "Pending").length} pending
                </span>
              </div>
              {submissions.filter(s => s.status === "Pending").length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">No pending submissions to review.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {submissions.filter(s => s.status === "Pending").map((sub, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{sub.taskTitle}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">By: {sub.earnerName} · {new Date(sub.submittedAt).toLocaleDateString()}</p>
                        {sub.proofText && <p className="text-[10px] text-gray-500 mt-1 line-clamp-1 font-mono">{sub.proofText}</p>}
                      </div>
                      <button onClick={() => navigate(`/advertiser/audit/${sub.id}`)}
                        className="shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer">
                        Review Proof
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: APPROVED TASKS ───────────────────────────────────────── */}
        {activeTab === "approved" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-blue-50 bg-blue-50/50">
                <Check className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-display text-sm font-bold text-blue-900">Approved Tasks</h3>
                  <p className="text-[10px] text-blue-600 mt-0.5">Submissions you have approved — earnings credited to earners.</p>
                </div>
                <span className="rounded-full bg-blue-100 border border-blue-200 px-2.5 py-0.5 text-[10px] font-black text-blue-700">
                  {submissions.filter(s => s.status === "Approved").length} approved
                </span>
              </div>
              {submissions.filter(s => s.status === "Approved").length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">No approved submissions yet.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {submissions.filter(s => s.status === "Approved").map((sub, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{sub.taskTitle}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">By: {sub.earnerName} · {new Date(sub.submittedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-sm font-bold text-blue-600">₦{sub.reward}</span>
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[9px] font-bold text-blue-700">
                            <Check className="h-2.5 w-2.5" /> Approved
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

        {/* ─── TAB: REJECTED TASKS ───────────────────────────────────────── */}
        {activeTab === "rejected" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-red-50 bg-red-50/40">
                <X className="h-4 w-4 text-red-500 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-display text-sm font-bold text-red-900">Rejected Tasks</h3>
                  <p className="text-[10px] text-red-500 mt-0.5">Submissions you have rejected — earners have been notified.</p>
                </div>
                <span className="rounded-full bg-red-100 border border-red-200 px-2.5 py-0.5 text-[10px] font-black text-red-600">
                  {submissions.filter(s => s.status === "Rejected").length} rejected
                </span>
              </div>
              {submissions.filter(s => s.status === "Rejected").length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">No rejected submissions.</div>
              ) : (
                <div className="divide-y divide-red-50">
                  {submissions.filter(s => s.status === "Rejected").map((sub, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{sub.taskTitle}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">By: {sub.earnerName} · {new Date(sub.submittedAt).toLocaleDateString()}</p>
                        {sub.feedback && <p className="text-[10px] text-red-600 mt-1 font-medium">Reason: {sub.feedback}</p>}
                      </div>
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[9px] font-bold text-red-600">
                        <X className="h-2.5 w-2.5" /> Rejected
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: NOTIFICATIONS ────────────────────────────────────────── */}
        {activeTab === "notifications" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-blue-500" />
                <h3 className="font-display text-sm font-bold text-gray-900">Notifications</h3>
              </div>
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 space-y-2">
                <p className="text-sm font-bold text-blue-800">📬 Stay Updated</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Advertiser notifications are delivered via email based on your preferences. You will be notified when:
                </p>
                <ul className="text-xs text-blue-700 space-y-1 mt-2 pl-3">
                  <li>• New earner submissions arrive on your campaigns</li>
                  <li>• Submissions are auto-approved after 72 hours</li>
                  <li>• Your wallet balance is low</li>
                  <li>• A campaign runs out of slots</li>
                </ul>
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-700 mb-3">Notification Preferences</p>
                <div className="space-y-3">
                  {([
                    { key: "emailNotifications" as const, label: "Email Notifications", desc: "Receive important updates by email" },
                    { key: "campaignUpdates" as const, label: "Campaign Updates", desc: "Alerts when your campaigns change status" },
                    { key: "transactionAlerts" as const, label: "Transaction Alerts", desc: "Notifications for deposits and spending" }
                  ] as const).map(pref => (
                    <div key={pref.key} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{pref.label}</p>
                        <p className="text-[10px] text-gray-400">{pref.desc}</p>
                      </div>
                      <button
                        onClick={() => setProfileForm(p => ({ ...p, notificationPrefs: { ...p.notificationPrefs, [pref.key]: !p.notificationPrefs[pref.key] } }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profileForm.notificationPrefs[pref.key] ? "bg-blue-600" : "bg-gray-200"}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${profileForm.notificationPrefs[pref.key] ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button onClick={handleSaveProfile} disabled={profileSaving}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition-all disabled:opacity-60">
                    <Save className="h-3.5 w-3.5" />
                    {profileSaving ? "Saving…" : "Save Preferences"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: SETTINGS ─────────────────────────────────────────────── */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Shield className="h-5 w-5 text-blue-500" />
                <h3 className="font-display text-sm font-bold text-gray-900">Security Settings</h3>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 mb-5">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-400 mt-0.5">Add an extra layer of security to your account</p>
                </div>
                <button
                  onClick={() => setProfileForm(p => ({ ...p, twoFactorEnabled: !p.twoFactorEnabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profileForm.twoFactorEnabled ? "bg-blue-600" : "bg-gray-200"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${profileForm.twoFactorEnabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Change Password</h4>
              {pwSuccess && <div className="mb-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-2.5 text-xs font-bold text-blue-700 flex items-center gap-2"><Check className="h-3.5 w-3.5" /> {pwSuccess}</div>}
              {pwError && <div className="mb-3 rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-xs font-bold text-red-600">{pwError}</div>}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {([
                  { key: "current" as const, label: "Current Password", placeholder: "Enter current password" },
                  { key: "next" as const, label: "New Password", placeholder: "Min. 6 characters" },
                  { key: "confirm" as const, label: "Confirm New Password", placeholder: "Repeat new password" }
                ] as const).map(field => (
                  <div key={field.key}>
                    <label className={labelClass}>{field.label}</label>
                    <div className="relative">
                      <input type={showPw[field.key] ? "text" : "password"} value={pwForm[field.key]}
                        onChange={e => setPwForm(p => ({ ...p, [field.key]: e.target.value }))}
                        placeholder={field.placeholder} className={`${inputClass} pr-10`} />
                      <button type="button" onClick={() => setShowPw(p => ({ ...p, [field.key]: !p[field.key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPw[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={handleChangePassword} disabled={pwSaving}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition-all disabled:opacity-60">
                  <Shield className="h-3.5 w-3.5" />
                  {pwSaving ? "Updating…" : "Update Password"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Delete Account Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-red-100 p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 className="font-display text-base font-bold text-gray-900 mb-1">Delete Account</h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter your password to confirm. This is permanent and cannot be reversed.
            </p>
            <input
              type="password"
              value={deleteConfirmPw}
              onChange={e => setDeleteConfirmPw(e.target.value)}
              placeholder="Confirm your password"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm mb-4 focus:outline-none focus:border-red-400"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmPw(""); }}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || !deleteConfirmPw}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-xs font-bold text-white transition-all disabled:opacity-60"
              >
                {deleteLoading ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
