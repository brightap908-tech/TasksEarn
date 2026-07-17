import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ClipboardList, CheckSquare, Megaphone, BarChart2,
  Wallet, ArrowDownCircle, Users, Bell, Settings, LogOut, Menu, X,
  Copy, RefreshCw, Trash2, Play, Pause, ChevronDown, ChevronUp,
  Check, AlertCircle, TrendingUp, TrendingDown, Eye, Plus, ArrowRight,
  PiggyBank, CreditCard, Shield
} from "lucide-react";
import { User, EarnerNotification, WebsiteSettings } from "../types";
import { usePlatforms } from "../lib/platformsStore";

interface Props {
  user: User;
  onRefreshUser: () => Promise<void>;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
  showToast: (message: string, type?: "success" | "error") => void;
  settings: WebsiteSettings;
  earnerNotifications: EarnerNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onOpenDeposit: (amount?: string) => void;
  isDarkMode: boolean;
}

const SIDEBAR_ITEMS = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "tasks", label: "Available Tasks", icon: ClipboardList },
  { id: "my-tasks", label: "My Tasks", icon: CheckSquare },
  { id: "create-campaign", label: "Create Campaign", icon: Megaphone },
  { id: "my-campaigns", label: "My Campaigns", icon: BarChart2 },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "withdraw", label: "Withdraw", icon: ArrowDownCircle },
  { id: "referrals", label: "Referrals", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "profile", label: "Profile & Settings", icon: Settings },
];

const BANKS = [
  "Access Bank","First Bank of Nigeria","Guaranty Trust Bank (GTB)","United Bank for Africa (UBA)",
  "Zenith Bank","Fidelity Bank","Stanbic IBTC Bank","Union Bank","Sterling Bank","Wema Bank",
  "Polaris Bank","Heritage Bank","First City Monument Bank (FCMB)","Ecobank Nigeria",
  "OPay (OPay Microfinance Bank)","PalmPay","Kuda Bank","Moniepoint",
  "Carbon (One Finance)","VFD Microfinance Bank","Providus Bank","Keystone Bank",
];

const ACTIONS = ["Like","Follow","Share","Comment","Subscribe","Watch","Join","Visit","Download","Custom Task"];

function statusColor(status: string) {
  if (status === "Approved" || status === "Active" || status === "Success" || status === "Paid") return "#22c55e";
  if (status === "Rejected" || status === "Failed") return "#ef4444";
  if (status === "Paused") return "#f59e0b";
  return "#94a3b8";
}
function statusBg(status: string) {
  if (status === "Approved" || status === "Active" || status === "Success" || status === "Paid") return "rgba(34,197,94,0.10)";
  if (status === "Rejected" || status === "Failed") return "rgba(239,68,68,0.10)";
  if (status === "Paused") return "rgba(245,158,11,0.10)";
  return "rgba(148,163,184,0.10)";
}

export default function UnifiedDashboard({
  user, onRefreshUser, onNavigate, onLogout, apiFetch, showToast,
  settings, earnerNotifications, onMarkNotificationRead, onMarkAllNotificationsRead,
  onOpenDeposit, isDarkMode
}: Props) {
  const { section = "overview" } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const { platforms } = usePlatforms();

  const [loading, setLoading] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Overview
  const [dashData, setDashData] = React.useState<any>(null);

  // Tasks
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [taskFilter, setTaskFilter] = React.useState("All");

  // My tasks
  const [submissions, setSubmissions] = React.useState<any[]>([]);
  const [subTab, setSubTab] = React.useState<"All"|"Pending"|"Approved"|"Rejected">("All");

  // Create campaign
  const [cp, setCp] = React.useState({ platform:"", action:"", title:"", desc:"", link:"", proof:"", slots:100 });
  const [campaignPricing, setCampaignPricing] = React.useState<any[]>([]);
  const [campaignSubmitting, setCampaignSubmitting] = React.useState(false);

  // My campaigns
  const [campaigns, setCampaigns] = React.useState<any[]>([]);
  const [camTab, setCamTab] = React.useState<"All"|"Active"|"Paused"|"Completed">("All");
  const [expandedCam, setExpandedCam] = React.useState<string|null>(null);
  const [camSubs, setCamSubs] = React.useState<Record<string,any[]>>({});

  // Wallet
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [txTab, setTxTab] = React.useState<"All"|"Deposits"|"Earnings"|"Withdrawals"|"Spending">("All");

  // Withdraw
  const [wd, setWd] = React.useState({ amount:"", bankName:"", bankCode:"", accountNumber:"", accountName:"" });
  const [wdLoading, setWdLoading] = React.useState(false);
  const [wdVerifying, setWdVerifying] = React.useState(false);
  const [wdVerified, setWdVerified] = React.useState(false);
  const [pendingWds, setPendingWds] = React.useState<any[]>([]);

  // Referrals
  const [referrals, setReferrals] = React.useState<any[]>([]);
  const [refStats, setRefStats] = React.useState<any>(null);
  const [copied, setCopied] = React.useState(false);

  // Profile
  const [prof, setProf] = React.useState({ name: user.name, username: user.username||"", phone: user.phone||"", country: user.country||"", business: user.businessName||"" });
  const [profLoading, setProfLoading] = React.useState(false);
  const [pw, setPw] = React.useState({ old:"", new:"", confirm:"" });
  const [pwLoading, setPwLoading] = React.useState(false);

  const unreadCount = earnerNotifications.filter(n => !n.read).length;

  const loadSection = React.useCallback(async (sec: string) => {
    setLoading(true);
    try {
      if (sec === "overview") {
        const d = await apiFetch("/api/user/dashboard");
        if (d && !d.error) setDashData(d);
      } else if (sec === "tasks") {
        const d = await apiFetch("/api/earner/tasks");
        if (Array.isArray(d)) setTasks(d);
      } else if (sec === "my-tasks") {
        const d = await apiFetch("/api/earner/submissions");
        if (Array.isArray(d)) setSubmissions(d);
      } else if (sec === "create-campaign") {
        const d = await apiFetch("/api/advertiser/pricing");
        if (Array.isArray(d)) setCampaignPricing(d);
      } else if (sec === "my-campaigns") {
        const d = await apiFetch("/api/advertiser/tasks");
        if (Array.isArray(d)) setCampaigns(d);
      } else if (sec === "wallet") {
        const d = await apiFetch("/api/user/transactions");
        if (d && Array.isArray(d.transactions)) setTransactions(d.transactions);
      } else if (sec === "withdraw") {
        const d = await apiFetch("/api/user/transactions");
        if (d && Array.isArray(d.transactions)) {
          setPendingWds(d.transactions.filter((t:any) => t.type === "Withdrawal" && t.status === "Pending"));
        }
      } else if (sec === "referrals") {
        const d = await apiFetch("/api/earner/referrals");
        if (d) { if (Array.isArray(d.referrals)) setReferrals(d.referrals); if (d.stats) setRefStats(d.stats); }
      }
    } catch {}
    setLoading(false);
  }, [apiFetch]);

  React.useEffect(() => {
    setDrawerOpen(false);
    loadSection(section);
  }, [section, loadSection]);

  const navTo = (s: string) => navigate(`/dashboard/${s}`);

  const pricingForPlatform = campaignPricing.find(p => p.platform === cp.platform);
  const costPerSlot = pricingForPlatform?.costPerSlot || 0;
  const totalCost = costPerSlot * cp.slots;
  const adBal = user.adBalance ?? 0;

  const fmt = (n: number) => `₦${(n||0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ─── Section Renderers ──────────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a", fontFamily: "var(--font-display)" }}>
          Welcome back, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>Your earnings and campaign overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Earnings Balance", value: fmt(user.walletBalance), color: "#2563EB", icon: <Wallet className="h-5 w-5"/>, action: () => navTo("withdraw"), actionLabel: "Withdraw" },
          { label: "Ad Balance", value: fmt(adBal), color: "#7c3aed", icon: <Megaphone className="h-5 w-5"/>, action: () => onOpenDeposit(), actionLabel: "Fund" },
          { label: "Available Tasks", value: dashData?.availableTasksCount ?? "—", color: "#0891b2", icon: <ClipboardList className="h-5 w-5"/>, action: () => navTo("tasks"), actionLabel: "Browse" },
          { label: "Active Campaigns", value: dashData?.activeCampaigns ?? "—", color: "#059669", icon: <BarChart2 className="h-5 w-5"/>, action: () => navTo("my-campaigns"), actionLabel: "Manage" },
          { label: "Total Earned", value: fmt(dashData?.totalEarned || 0), color: "#16a34a", icon: <TrendingUp className="h-5 w-5"/>, action: () => navTo("my-tasks"), actionLabel: "View" },
          { label: "Total Spent", value: fmt(dashData?.totalSpent || 0), color: "#dc2626", icon: <TrendingDown className="h-5 w-5"/>, action: () => navTo("wallet"), actionLabel: "History" },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-4 space-y-3" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "#fff", border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0", boxShadow: isDarkMode ? "none" : "0 2px 8px rgba(15,23,42,0.04)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>{stat.label}</span>
              <span className="p-1.5 rounded-lg" style={{ background: `${stat.color}20`, color: stat.color }}>{stat.icon}</span>
            </div>
            <p className="text-lg font-black font-mono" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>{stat.value}</p>
            <button onClick={stat.action} className="text-xs font-bold flex items-center gap-1 cursor-pointer" style={{ color: stat.color }}>
              {stat.actionLabel} <ArrowRight className="h-3 w-3"/>
            </button>
          </div>
        ))}
      </div>

      {/* Submission Stats */}
      {dashData && (
        <div className="rounded-2xl p-4" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "#fff", border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: isDarkMode ? "#e2e8f0" : "#0f172a" }}>Task Submissions</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Approved", count: dashData.approvedCount, color: "#22c55e" },
              { label: "Pending", count: dashData.pendingCount, color: "#f59e0b" },
              { label: "Rejected", count: dashData.rejectedCount, color: "#ef4444" },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: `${s.color}10` }}>
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.count}</p>
                <p className="text-xs font-semibold mt-1" style={{ color: "#94a3b8" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {dashData?.recentTransactions?.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "#fff", border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: isDarkMode ? "#e2e8f0" : "#0f172a" }}>Recent Transactions</h3>
            <button onClick={() => navTo("wallet")} className="text-xs font-bold cursor-pointer" style={{ color: "#2563EB" }}>View All</button>
          </div>
          <div className="space-y-2">
            {dashData.recentTransactions.slice(0, 5).map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between py-2" style={{ borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid #F1F5F9" }}>
                <div>
                  <p className="text-xs font-semibold" style={{ color: isDarkMode ? "#e2e8f0" : "#0f172a" }}>{tx.type}</p>
                  <p className="text-[10px]" style={{ color: "#94a3b8" }}>{new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono" style={{ color: tx.type === "Task Earnings" || tx.type === "Referral Bonus" || tx.type === "Deposit" ? "#22c55e" : "#ef4444" }}>
                    {tx.type === "Task Earnings" || tx.type === "Referral Bonus" || tx.type === "Deposit" ? "+" : "-"}{fmt(tx.amount)}
                  </p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: statusColor(tx.status), background: statusBg(tx.status) }}>{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navTo("tasks")} className="rounded-2xl p-4 text-left cursor-pointer transition-all hover:opacity-80" style={{ background: "linear-gradient(135deg,#2563EB,#1d4ed8)", color: "#fff" }}>
          <ClipboardList className="h-5 w-5 mb-2"/>
          <p className="text-sm font-bold">Browse Tasks</p>
          <p className="text-[11px] opacity-70 mt-0.5">Earn money completing tasks</p>
        </button>
        <button onClick={() => navTo("create-campaign")} className="rounded-2xl p-4 text-left cursor-pointer transition-all hover:opacity-80" style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff" }}>
          <Plus className="h-5 w-5 mb-2"/>
          <p className="text-sm font-bold">Create Campaign</p>
          <p className="text-[11px] opacity-70 mt-0.5">Grow your social presence</p>
        </button>
      </div>
    </div>
  );

  const renderTasks = () => {
    const platformOptions = ["All", ...Array.from(new Set(tasks.map((t:any) => t.category?.split(" ")[0]))).filter(Boolean)];
    const filtered = taskFilter === "All" ? tasks : tasks.filter((t:any) => t.category?.startsWith(taskFilter));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>Available Tasks</h2>
          <button onClick={() => loadSection("tasks")} className="p-2 rounded-xl cursor-pointer" style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC", border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
            <RefreshCw className="h-4 w-4" style={{ color: "#94a3b8" }}/>
          </button>
        </div>

        {/* Platform filter */}
        <div className="flex gap-2 flex-wrap">
          {platformOptions.slice(0, 8).map(p => (
            <button key={p} onClick={() => setTaskFilter(p)}
              className="rounded-full px-3 py-1 text-xs font-bold cursor-pointer transition-all"
              style={taskFilter === p ? { background: "#2563EB", color: "#fff" } : { background: isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC", color: isDarkMode ? "#94a3b8" : "#64748b", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.10)" : "#E2E8F0") }}>
              {p}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4" style={{ borderColor: "rgba(37,99,235,0.20)", borderTopColor: "#2563EB" }}/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: "#94a3b8" }}>
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30"/>
            <p className="font-semibold">No tasks available right now</p>
            <p className="text-xs mt-1">Check back soon for new opportunities</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((task:any) => {
              const alreadyDone = task.submissionStatus && task.submissionStatus !== "Rejected";
              return (
                <div key={task.id} className="rounded-2xl p-4" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "#fff", border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(37,99,235,0.10)", color: "#2563EB" }}>{task.category}</span>
                        {task.filledSlots >= task.totalSlots && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444" }}>Full</span>}
                      </div>
                      <h3 className="font-bold text-sm leading-tight" style={{ color: isDarkMode ? "#e2e8f0" : "#0f172a" }}>{task.title}</h3>
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: "#64748b" }}>{task.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs font-semibold" style={{ color: "#64748b" }}>{task.filledSlots}/{task.totalSlots} slots</span>
                        <span className="text-sm font-black" style={{ color: "#22c55e" }}>+₦{(task.earningPerSlot||0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {alreadyDone ? (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: statusBg(task.submissionStatus), color: statusColor(task.submissionStatus) }}>{task.submissionStatus}</span>
                      ) : task.filledSlots >= task.totalSlots ? null : (
                        <button onClick={() => navigate(`/dashboard/tasks/${task.id}/submit`)}
                          className="rounded-xl px-3 py-2 text-xs font-bold text-white cursor-pointer transition-all"
                          style={{ background: "linear-gradient(135deg,#2563EB,#1d4ed8)", boxShadow: "0 2px 8px rgba(37,99,235,0.30)" }}>
                          Start Task
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderMyTasks = () => {
    const filtered = subTab === "All" ? submissions : submissions.filter((s:any) => s.status === subTab);
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>My Tasks</h2>
        <div className="flex gap-2 flex-wrap">
          {(["All","Pending","Approved","Rejected"] as const).map(tab => (
            <button key={tab} onClick={() => setSubTab(tab)}
              className="rounded-full px-3 py-1 text-xs font-bold cursor-pointer"
              style={subTab === tab ? { background: "#2563EB", color: "#fff" } : { background: isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC", color: "#64748b", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.10)" : "#E2E8F0") }}>
              {tab} {tab === "All" ? `(${submissions.length})` : `(${submissions.filter((s:any) => s.status === tab).length})`}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4" style={{ borderColor: "rgba(37,99,235,0.20)", borderTopColor: "#2563EB" }}/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: "#94a3b8" }}>
            <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-30"/>
            <p className="font-semibold">No {subTab !== "All" ? subTab.toLowerCase() : ""} submissions yet</p>
            <button onClick={() => navTo("tasks")} className="mt-4 text-sm font-bold cursor-pointer" style={{ color: "#2563EB" }}>Browse available tasks →</button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((sub:any) => (
              <div key={sub.id} className="rounded-2xl p-4" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "#fff", border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(37,99,235,0.10)", color: "#2563EB" }}>{sub.category}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: statusColor(sub.status), background: statusBg(sub.status) }}>{sub.status}</span>
                    </div>
                    <h3 className="font-bold text-sm" style={{ color: isDarkMode ? "#e2e8f0" : "#0f172a" }}>{sub.taskTitle}</h3>
                    {sub.feedback && (
                      <div className="mt-2 rounded-xl p-2" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                        <p className="text-xs font-semibold" style={{ color: "#ef4444" }}>Feedback: {sub.feedback}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs" style={{ color: "#94a3b8" }}>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                      <span className="text-sm font-black font-mono" style={{ color: "#22c55e" }}>+₦{(sub.reward||0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {sub.status === "Rejected" && (
                      <button onClick={() => navigate(`/dashboard/my-tasks/${sub.id}/resubmit`)}
                        className="rounded-xl px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
                        style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
                        Resubmit
                      </button>
                    )}
                    {sub.status === "Pending" && (
                      <button onClick={() => handleDeleteSubmission(sub.id)}
                        className="rounded-xl p-1.5 cursor-pointer" style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444" }}>
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCreateCampaign = () => {
    const canAfford = adBal >= totalCost;
    return (
      <div className="space-y-4 max-w-2xl">
        <div>
          <h2 className="text-lg font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>Create Campaign</h2>
          <p className="text-xs mt-1" style={{ color: "#64748b" }}>Fund with your Ad Wallet. Current Ad Balance: <span className="font-bold text-purple-500">{fmt(adBal)}</span></p>
        </div>

        {adBal === 0 && (
          <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.20)" }}>
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#7c3aed" }}/>
            <div>
              <p className="text-sm font-bold" style={{ color: "#7c3aed" }}>Fund your Ad Wallet first</p>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>You need funds in your Ad Wallet to create campaigns.</p>
              <button onClick={() => onOpenDeposit()} className="mt-2 text-xs font-bold cursor-pointer" style={{ color: "#7c3aed" }}>+ Fund Ad Wallet →</button>
            </div>
          </div>
        )}

        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#64748b" }}>Platform *</label>
              <select value={cp.platform} onChange={e => setCp(p => ({...p, platform: e.target.value}))} required
                className="w-full rounded-xl px-3 py-2.5 text-sm" style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#fff", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0"), color: isDarkMode ? "#e2e8f0" : "#0f172a" }}>
                <option value="">Select platform</option>
                {campaignPricing.map(p => (
                  <option key={p.platform} value={p.platform}>{p.platform} — ₦{p.costPerSlot}/slot</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#64748b" }}>Action *</label>
              <select value={cp.action} onChange={e => setCp(p => ({...p, action: e.target.value}))} required
                className="w-full rounded-xl px-3 py-2.5 text-sm" style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#fff", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0"), color: isDarkMode ? "#e2e8f0" : "#0f172a" }}>
                <option value="">Select action</option>
                {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {[
            { label: "Campaign Title *", key: "title", ph: "e.g. Follow our Instagram page @brand" },
            { label: "Description", key: "desc", ph: "Describe what users need to do..." },
            { label: "Target Link *", key: "link", ph: "https://..." },
            { label: "Proof Requirements *", key: "proof", ph: "Screenshot of follow confirmation, your username..." },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#64748b" }}>{f.label}</label>
              {f.key === "desc" || f.key === "proof" ? (
                <textarea value={(cp as any)[f.key]} onChange={e => setCp(p => ({...p, [f.key]: e.target.value}))}
                  placeholder={f.ph} rows={2}
                  className="w-full rounded-xl px-3 py-2.5 text-sm resize-none"
                  style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#fff", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0"), color: isDarkMode ? "#e2e8f0" : "#0f172a" }}/>
              ) : (
                <input type={f.key === "link" ? "url" : "text"} value={(cp as any)[f.key]} onChange={e => setCp(p => ({...p, [f.key]: e.target.value}))}
                  placeholder={f.ph} required={f.label.includes("*")}
                  className="w-full rounded-xl px-3 py-2.5 text-sm"
                  style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#fff", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0"), color: isDarkMode ? "#e2e8f0" : "#0f172a" }}/>
              )}
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#64748b" }}>Number of Slots: <span className="text-blue-500">{cp.slots}</span></label>
            <input type="range" min={10} max={1000} step={10} value={cp.slots} onChange={e => setCp(p => ({...p, slots: parseInt(e.target.value)}))} className="w-full"/>
          </div>

          {/* Cost preview */}
          {cp.platform && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.20)" }}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>Cost per slot</p>
                  <p className="font-black" style={{ color: "#7c3aed" }}>₦{costPerSlot}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>Total cost ({cp.slots} slots)</p>
                  <p className="font-black" style={{ color: "#7c3aed" }}>₦{totalCost.toLocaleString()}</p>
                </div>
              </div>
              {!canAfford && adBal > 0 && (
                <p className="text-xs font-semibold mt-2" style={{ color: "#ef4444" }}>⚠️ Insufficient Ad Balance. Need ₦{(totalCost - adBal).toLocaleString()} more. <button type="button" onClick={() => onOpenDeposit(`${totalCost - adBal}`)} className="underline cursor-pointer">Fund wallet</button></p>
              )}
            </div>
          )}

          <button type="submit" disabled={campaignSubmitting || !canAfford}
            className="w-full rounded-xl py-3 text-sm font-bold text-white cursor-pointer transition-all"
            style={{ background: (!canAfford || campaignSubmitting) ? "#94a3b8" : "linear-gradient(135deg,#7c3aed,#6d28d9)", cursor: (!canAfford || campaignSubmitting) ? "not-allowed" : "pointer" }}>
            {campaignSubmitting ? "Creating Campaign..." : !canAfford ? "Insufficient Ad Balance" : `Create Campaign — ₦${totalCost.toLocaleString()}`}
          </button>
        </form>
      </div>
    );
  };

  const renderMyCampaigns = () => {
    const filtered = camTab === "All" ? campaigns : campaigns.filter((c:any) => c.status === camTab);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>My Campaigns</h2>
          <button onClick={() => navTo("create-campaign")} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white cursor-pointer" style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
            <Plus className="h-3.5 w-3.5"/> New Campaign
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["All","Active","Paused","Completed"] as const).map(tab => (
            <button key={tab} onClick={() => setCamTab(tab)}
              className="rounded-full px-3 py-1 text-xs font-bold cursor-pointer"
              style={camTab === tab ? { background: "#7c3aed", color: "#fff" } : { background: isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC", color: "#64748b", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.10)" : "#E2E8F0") }}>
              {tab}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4" style={{ borderColor: "rgba(124,58,237,0.20)", borderTopColor: "#7c3aed" }}/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: "#94a3b8" }}>
            <BarChart2 className="h-12 w-12 mx-auto mb-3 opacity-30"/>
            <p className="font-semibold">No campaigns yet</p>
            <button onClick={() => navTo("create-campaign")} className="mt-4 text-sm font-bold cursor-pointer" style={{ color: "#7c3aed" }}>Create your first campaign →</button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((cam:any) => (
              <div key={cam.id} className="rounded-2xl overflow-hidden" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "#fff", border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: statusColor(cam.status), background: statusBg(cam.status) }}>{cam.status}</span>
                        <span className="text-[10px]" style={{ color: "#94a3b8" }}>{cam.filledSlots}/{cam.totalSlots} slots</span>
                      </div>
                      <h3 className="font-bold text-sm" style={{ color: isDarkMode ? "#e2e8f0" : "#0f172a" }}>{cam.title}</h3>
                      <div className="mt-2 w-full rounded-full h-1.5" style={{ background: isDarkMode ? "rgba(255,255,255,0.08)" : "#F1F5F9" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (cam.filledSlots / cam.totalSlots) * 100)}%`, background: "#2563EB" }}/>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {cam.status !== "Completed" && (
                        <button onClick={() => handleToggleCampaign(cam.id)}
                          className="rounded-xl p-2 cursor-pointer"
                          style={{ background: cam.status === "Active" ? "rgba(245,158,11,0.10)" : "rgba(34,197,94,0.10)", color: cam.status === "Active" ? "#f59e0b" : "#22c55e" }}>
                          {cam.status === "Active" ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4"/>}
                        </button>
                      )}
                      {cam.status !== "Completed" && (
                        <button onClick={() => handleDeleteCampaign(cam.id)} className="rounded-xl p-2 cursor-pointer" style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444" }}>
                          <Trash2 className="h-4 w-4"/>
                        </button>
                      )}
                      <button onClick={async () => {
                        if (expandedCam === cam.id) { setExpandedCam(null); return; }
                        setExpandedCam(cam.id);
                        await loadCampaignSubs(cam.id);
                      }} className="rounded-xl p-2 cursor-pointer" style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC", color: "#64748b" }}>
                        {expandedCam === cam.id ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                      </button>
                    </div>
                  </div>
                </div>
                {expandedCam === cam.id && (
                  <div style={{ borderTop: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #F1F5F9" }}>
                    <div className="p-3">
                      <p className="text-xs font-bold uppercase mb-2" style={{ color: "#94a3b8" }}>Submissions</p>
                      {!camSubs[cam.id] ? (
                        <div className="text-center py-4"><div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500 mx-auto"/></div>
                      ) : camSubs[cam.id].length === 0 ? (
                        <p className="text-xs text-center py-4" style={{ color: "#94a3b8" }}>No submissions yet</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {camSubs[cam.id].map((sub:any) => (
                            <div key={sub.id} className="rounded-xl p-3 flex items-center justify-between gap-3" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "#F8FAFC" }}>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold" style={{ color: isDarkMode ? "#e2e8f0" : "#0f172a" }}>{sub.earnerName}</p>
                                <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: "#94a3b8" }}>{sub.proofText}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: statusColor(sub.status), background: statusBg(sub.status) }}>{sub.status}</span>
                                {sub.status === "Pending" && (
                                  <>
                                    <button onClick={() => handleReviewSub(sub.id, "approve", cam.id)} className="rounded-lg p-1 cursor-pointer" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }} title="Approve"><Check className="h-3.5 w-3.5"/></button>
                                    <button onClick={() => { const f = prompt("Rejection reason:"); if (f !== null) handleReviewSub(sub.id, "reject", cam.id, f); }} className="rounded-lg p-1 cursor-pointer" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }} title="Reject"><X className="h-3.5 w-3.5"/></button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderWallet = () => {
    const filtered = txTab === "All" ? transactions
      : txTab === "Deposits" ? transactions.filter((t:any) => t.type === "Deposit")
      : txTab === "Earnings" ? transactions.filter((t:any) => t.type === "Task Earnings" || t.type === "Referral Bonus")
      : txTab === "Withdrawals" ? transactions.filter((t:any) => t.type === "Withdrawal")
      : transactions.filter((t:any) => t.type === "Campaign Spend");
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>Wallet</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#2563EB,#1d4ed8)" }}>
            <p className="text-xs font-bold text-blue-200 uppercase">Earnings Balance</p>
            <p className="text-lg sm:text-2xl font-black text-white font-mono mt-1 break-all">{fmt(user.walletBalance)}</p>
            <button onClick={() => navTo("withdraw")} className="mt-3 text-xs font-bold text-blue-200 flex items-center gap-1 cursor-pointer">
              Withdraw <ArrowRight className="h-3 w-3"/>
            </button>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
            <p className="text-xs font-bold text-purple-200 uppercase">Ad Balance</p>
            <p className="text-lg sm:text-2xl font-black text-white font-mono mt-1 break-all">{fmt(adBal)}</p>
            <button onClick={() => onOpenDeposit()} className="mt-3 text-xs font-bold text-purple-200 flex items-center gap-1 cursor-pointer">
              Fund Wallet <ArrowRight className="h-3 w-3"/>
            </button>
          </div>
        </div>

        <div>
          <div className="flex gap-2 flex-wrap mb-3">
            {(["All","Deposits","Earnings","Withdrawals","Spending"] as const).map(tab => (
              <button key={tab} onClick={() => setTxTab(tab)}
                className="rounded-full px-3 py-1 text-xs font-bold cursor-pointer"
                style={txTab === tab ? { background: "#2563EB", color: "#fff" } : { background: isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC", color: "#64748b", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.10)" : "#E2E8F0") }}>
                {tab}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-4" style={{ borderColor: "rgba(37,99,235,0.20)", borderTopColor: "#2563EB" }}/></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12" style={{ color: "#94a3b8" }}>
              <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-30"/>
              <p className="text-sm font-semibold">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((tx:any) => {
                const isCredit = tx.type === "Task Earnings" || tx.type === "Referral Bonus" || tx.type === "Deposit";
                return (
                  <div key={tx.id} className="rounded-xl p-3 flex items-center justify-between" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "#F8FAFC" }}>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: isDarkMode ? "#e2e8f0" : "#0f172a" }}>{tx.description || tx.type}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black font-mono" style={{ color: isCredit ? "#22c55e" : "#ef4444" }}>
                        {isCredit ? "+" : "-"}{fmt(tx.amount)}
                      </p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: statusColor(tx.status), background: statusBg(tx.status) }}>{tx.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWithdraw = () => (
    <div className="space-y-4 max-w-lg">
      <div>
        <h2 className="text-lg font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>Withdraw Funds</h2>
        <p className="text-xs mt-1" style={{ color: "#64748b" }}>Earnings balance: <span className="font-bold text-blue-500">{fmt(user.walletBalance)}</span> · Fee: ₦{settings.withdrawalFee} · Min: ₦{settings.minWithdrawal}</p>
      </div>
      <form onSubmit={handleWithdraw} className="space-y-4 rounded-2xl p-5" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "#fff", border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#64748b" }}>Amount (₦)</label>
          <input type="number" min={settings.minWithdrawal} max={user.walletBalance} value={wd.amount} onChange={e => setWd(w => ({...w, amount: e.target.value}))} required placeholder={`Min ₦${settings.minWithdrawal}`}
            className="w-full rounded-xl px-3 py-2.5 text-sm font-mono"
            style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#fff", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0"), color: isDarkMode ? "#e2e8f0" : "#0f172a" }}/>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#64748b" }}>Bank</label>
          <select value={wd.bankName} onChange={e => { setWd(w => ({...w, bankName: e.target.value, accountName: "", bankCode: ""})); setWdVerified(false); }} required
            className="w-full rounded-xl px-3 py-2.5 text-sm"
            style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#fff", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0"), color: isDarkMode ? "#e2e8f0" : "#0f172a" }}>
            <option value="">Select your bank</option>
            {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#64748b" }}>Account Number</label>
          <div className="flex gap-2">
            <input type="text" inputMode="numeric" maxLength={10} value={wd.accountNumber} onChange={e => { setWd(w => ({...w, accountNumber: e.target.value.replace(/\D/g,"")})); setWdVerified(false); }} required placeholder="10-digit account number"
              className="flex-1 rounded-xl px-3 py-2.5 text-sm font-mono"
              style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#fff", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0"), color: isDarkMode ? "#e2e8f0" : "#0f172a" }}/>
            <button type="button" onClick={handleVerifyAccount} disabled={wdVerifying || wd.accountNumber.length !== 10}
              className="rounded-xl px-3 py-2.5 text-xs font-bold cursor-pointer"
              style={{ background: "rgba(37,99,235,0.10)", color: "#2563EB", border: "1px solid rgba(37,99,235,0.20)" }}>
              {wdVerifying ? "..." : "Verify"}
            </button>
          </div>
        </div>
        {wdVerified && wd.accountName && (
          <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.20)" }}>
            <Check className="h-4 w-4 shrink-0" style={{ color: "#22c55e" }}/>
            <p className="text-xs font-bold" style={{ color: "#22c55e" }}>Account verified: {wd.accountName}</p>
          </div>
        )}
        <button type="submit" disabled={wdLoading || !wdVerified}
          className="w-full rounded-xl py-3 text-sm font-bold text-white cursor-pointer"
          style={{ background: (!wdVerified || wdLoading) ? "#94a3b8" : "linear-gradient(135deg,#2563EB,#1d4ed8)", cursor: (!wdVerified || wdLoading) ? "not-allowed" : "pointer" }}>
          {wdLoading ? "Submitting..." : `Withdraw ₦${parseFloat(wd.amount||"0").toLocaleString()}`}
        </button>
      </form>

      {/* Pending withdrawals */}
      {pendingWds.length > 0 && (
        <div>
          <p className="text-sm font-bold mb-2" style={{ color: isDarkMode ? "#e2e8f0" : "#0f172a" }}>Pending Withdrawals</p>
          <div className="space-y-2">
            {pendingWds.map((tx:any) => (
              <div key={tx.id} className="rounded-xl p-3 flex items-center justify-between" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "#FFF7ED", border: "1px solid rgba(245,158,11,0.20)" }}>
                <div>
                  <p className="text-xs font-semibold" style={{ color: isDarkMode ? "#e2e8f0" : "#92400e" }}>{tx.description}</p>
                  <p className="text-[10px]" style={{ color: "#94a3b8" }}>{new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="text-sm font-black font-mono" style={{ color: "#f59e0b" }}>{fmt(tx.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderReferrals = () => {
    const code = user.referralCode || "";
    const link = `${window.location.origin}/?ref=${code}`;
    return (
      <div className="space-y-4 max-w-lg">
        <div>
          <h2 className="text-lg font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>Referral Program</h2>
          <p className="text-xs mt-1" style={{ color: "#64748b" }}>Earn ₦{(settings.referralReward||200).toLocaleString()} for every friend who joins and completes their first task</p>
        </div>

        <div className="rounded-2xl p-5 text-center" style={{ background: "linear-gradient(135deg,#2563EB,#1d4ed8)" }}>
          <p className="text-xs font-bold text-blue-200 uppercase mb-2">Your Referral Code</p>
          <p className="text-3xl font-black text-white tracking-[0.15em] font-mono">{code || "—"}</p>
          <button onClick={handleCopyReferral} className="mt-4 flex items-center gap-2 mx-auto rounded-full px-4 py-2 text-xs font-bold cursor-pointer transition-all" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
            {copied ? <><Check className="h-3.5 w-3.5"/> Copied!</> : <><Copy className="h-3.5 w-3.5"/> Copy Referral Link</>}
          </button>
        </div>

        {refStats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 text-center" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "#fff", border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
              <p className="text-2xl font-black" style={{ color: "#2563EB" }}>{refStats.totalReferrals || referrals.length}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: "#94a3b8" }}>Total Referrals</p>
            </div>
            <div className="rounded-2xl p-4 text-center" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "#fff", border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
              <p className="text-2xl font-black" style={{ color: "#22c55e" }}>{fmt(refStats.totalEarned || 0)}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: "#94a3b8" }}>Total Earned</p>
            </div>
          </div>
        )}

        {referrals.length > 0 && (
          <div>
            <p className="text-sm font-bold mb-2" style={{ color: isDarkMode ? "#e2e8f0" : "#0f172a" }}>Referred Users</p>
            <div className="space-y-2">
              {referrals.map((r:any) => (
                <div key={r.id} className="rounded-xl p-3 flex items-center justify-between" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "#F8FAFC" }}>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: isDarkMode ? "#e2e8f0" : "#0f172a" }}>{r.refereeName}</p>
                    <p className="text-[10px]" style={{ color: "#94a3b8" }}>{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm font-black font-mono" style={{ color: "#22c55e" }}>+{fmt(r.rewardEarned)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNotifications = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>Notifications</h2>
        {unreadCount > 0 && (
          <button onClick={onMarkAllNotificationsRead} className="text-xs font-bold cursor-pointer" style={{ color: "#2563EB" }}>
            Mark all read
          </button>
        )}
      </div>
      {earnerNotifications.length === 0 ? (
        <div className="text-center py-16" style={{ color: "#94a3b8" }}>
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30"/>
          <p className="font-semibold">No notifications yet</p>
          <p className="text-xs mt-1">We'll notify you when new tasks are available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {earnerNotifications.map(notif => (
            <div key={notif.id} onClick={() => { if (!notif.read) onMarkNotificationRead(notif.id); }}
              className="rounded-2xl p-4 cursor-pointer"
              style={{ background: notif.read ? (isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC") : (isDarkMode ? "rgba(37,99,235,0.12)" : "rgba(219,234,254,0.60)"), border: notif.read ? (isDarkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid #E2E8F0") : "1px solid rgba(37,99,235,0.25)" }}>
              <div className="flex items-start gap-3">
                {!notif.read && <div className="h-2 w-2 rounded-full shrink-0 mt-1" style={{ background: "#2563EB" }}/>}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: isDarkMode ? "#e2e8f0" : "#0f172a" }}>{notif.message}</p>
                  <p className="text-[10px] mt-1" style={{ color: "#94a3b8" }}>{new Date(notif.createdAt).toLocaleString()}</p>
                </div>
                <span className="text-xs font-black shrink-0" style={{ color: "#22c55e" }}>+₦{notif.reward}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-lg font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>Profile & Settings</h2>

      {/* Profile info */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "#fff", border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
        <div className="flex items-center gap-3 pb-4" style={{ borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #F1F5F9" }}>
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-lg font-black text-white" style={{ background: "linear-gradient(135deg,#2563EB,#7c3aed)" }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>{user.name}</p>
            <p className="text-xs" style={{ color: "#94a3b8" }}>{user.email}</p>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(37,99,235,0.10)", color: "#2563EB" }}>
              <Shield className="h-2.5 w-2.5 inline mr-1"/>Member
            </span>
          </div>
        </div>
        <form onSubmit={handleSaveProfile} className="space-y-3">
          {[
            { label: "Full Name", key: "name", val: prof.name },
            { label: "Username", key: "username", val: prof.username },
            { label: "Phone", key: "phone", val: prof.phone },
            { label: "Country", key: "country", val: prof.country },
            { label: "Business Name", key: "business", val: prof.business },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold uppercase mb-1" style={{ color: "#64748b" }}>{f.label}</label>
              <input type="text" value={f.val} onChange={e => setProf(p => ({...p, [f.key]: e.target.value}))}
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0"), color: isDarkMode ? "#e2e8f0" : "#0f172a" }}/>
            </div>
          ))}
          <button type="submit" disabled={profLoading}
            className="w-full rounded-xl py-2.5 text-sm font-bold text-white cursor-pointer"
            style={{ background: "linear-gradient(135deg,#2563EB,#1d4ed8)" }}>
            {profLoading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "#fff", border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
        <h3 className="font-bold text-sm" style={{ color: isDarkMode ? "#e2e8f0" : "#0f172a" }}>Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          {[
            { label: "Current Password", key: "old", val: pw.old },
            { label: "New Password", key: "new", val: pw.new },
            { label: "Confirm New Password", key: "confirm", val: pw.confirm },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold uppercase mb-1" style={{ color: "#64748b" }}>{f.label}</label>
              <input type="password" value={f.val} onChange={e => setPw(p => ({...p, [f.key]: e.target.value}))} required
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0"), color: isDarkMode ? "#e2e8f0" : "#0f172a" }}/>
            </div>
          ))}
          <button type="submit" disabled={pwLoading}
            className="w-full rounded-xl py-2.5 text-sm font-bold text-white cursor-pointer"
            style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
            {pwLoading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );

  // ─── Content switch ────────────────────────────────────────────────────────

  const renderContent = () => {
    switch (section) {
      case "overview": return renderOverview();
      case "tasks": return renderTasks();
      case "my-tasks": return renderMyTasks();
      case "create-campaign": return renderCreateCampaign();
      case "my-campaigns": return renderMyCampaigns();
      case "wallet": return renderWallet();
      case "withdraw": return renderWithdraw();
      case "referrals": return renderReferrals();
      case "notifications": return renderNotifications();
      case "profile": return renderProfile();
      default: return renderOverview();
    }
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    setCampaignSubmitting(true);
    try {
      const res = await apiFetch("/api/advertiser/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: cp.platform, action: cp.action, title: cp.title, description: cp.desc, link: cp.link, proofRequirements: cp.proof, totalSlots: cp.slots })
      });
      if (res?.error) { showToast(res.error, "error"); }
      else if (res?.task) {
        showToast("Campaign created!", "success");
        await onRefreshUser();
        setCp({ platform:"", action:"", title:"", desc:"", link:"", proof:"", slots:100 });
        navTo("my-campaigns");
      }
    } catch { showToast("Failed to create campaign.", "error"); }
    setCampaignSubmitting(false);
  }

  async function handleToggleCampaign(id: string) {
    try {
      const res = await apiFetch(`/api/advertiser/tasks/${id}/toggle`, { method: "PUT" });
      if (!res?.error) {
        setCampaigns(prev => prev.map((c:any) => c.id === id ? { ...c, status: c.status === "Active" ? "Paused" : "Active" } : c));
        showToast("Campaign updated.", "success");
      } else showToast(res.error, "error");
    } catch { showToast("Failed.", "error"); }
  }

  async function handleDeleteCampaign(id: string) {
    if (!confirm("Delete this campaign? Unused slots will be refunded to your Ad Wallet.")) return;
    try {
      const res = await apiFetch(`/api/advertiser/tasks/${id}`, { method: "DELETE" });
      if (!res?.error) {
        setCampaigns(prev => prev.filter((c:any) => c.id !== id));
        showToast("Campaign deleted. Balance refunded.", "success");
        await onRefreshUser();
      } else showToast(res.error, "error");
    } catch { showToast("Failed.", "error"); }
  }

  async function loadCampaignSubs(campaignId: string) {
    if (camSubs[campaignId]) return;
    try {
      const d = await apiFetch(`/api/advertiser/submissions?taskId=${campaignId}`);
      if (d && Array.isArray(d.submissions)) setCamSubs(prev => ({ ...prev, [campaignId]: d.submissions }));
    } catch {}
  }

  async function handleReviewSub(subId: string, action: "approve"|"reject", campaignId: string, feedback?: string) {
    try {
      const res = await apiFetch(`/api/advertiser/submissions/${subId}/review`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, feedback })
      });
      if (!res?.error) {
        showToast(`Submission ${action}d.`, "success");
        const d = await apiFetch(`/api/advertiser/submissions?taskId=${campaignId}`);
        if (d && Array.isArray(d.submissions)) setCamSubs(prev => ({ ...prev, [campaignId]: d.submissions }));
      } else showToast(res.error, "error");
    } catch { showToast("Action failed.", "error"); }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setWdLoading(true);
    try {
      const res = await apiFetch("/api/earner/withdraw", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(wd.amount), bankName: wd.bankName, bankCode: wd.bankCode, accountNumber: wd.accountNumber, accountName: wd.accountName })
      });
      if (res?.error) showToast(res.error, "error");
      else if (res?.success) {
        showToast("Withdrawal submitted!", "success");
        setWd({ amount:"", bankName:"", bankCode:"", accountNumber:"", accountName:"" });
        setWdVerified(false);
        await onRefreshUser();
        loadSection("withdraw");
      }
    } catch { showToast("Withdrawal failed.", "error"); }
    setWdLoading(false);
  }

  async function handleVerifyAccount() {
    setWdVerifying(true);
    try {
      const res = await apiFetch("/api/earner/verify-account", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber: wd.accountNumber, bankName: wd.bankName })
      });
      if (res?.accountName) {
        setWd(w => ({ ...w, accountName: res.accountName, bankCode: res.bankCode || "" }));
        setWdVerified(true);
        showToast(`Verified: ${res.accountName}`, "success");
      } else showToast(res?.error || "Verification failed.", "error");
    } catch { showToast("Verification failed.", "error"); }
    setWdVerifying(false);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfLoading(true);
    try {
      const res = await apiFetch("/api/user/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: prof.name, username: prof.username, phone: prof.phone, country: prof.country, businessName: prof.business })
      });
      if (!res?.error) { showToast("Profile updated!", "success"); await onRefreshUser(); }
      else showToast(res.error, "error");
    } catch { showToast("Update failed.", "error"); }
    setProfLoading(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.new !== pw.confirm) { showToast("Passwords don't match.", "error"); return; }
    setPwLoading(true);
    try {
      const res = await apiFetch("/api/user/change-password", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pw.old, newPassword: pw.new })
      });
      if (!res?.error) { showToast("Password changed!", "success"); setPw({ old:"", new:"", confirm:"" }); }
      else showToast(res.error, "error");
    } catch { showToast("Failed.", "error"); }
    setPwLoading(false);
  }

  async function handleDeleteSubmission(subId: string) {
    if (!confirm("Delete this submission?")) return;
    try {
      const res = await apiFetch(`/api/earner/submissions/${subId}`, { method: "DELETE" });
      if (!res?.error) { setSubmissions(prev => prev.filter((s:any) => s.id !== subId)); showToast("Deleted.", "success"); }
      else showToast(res.error, "error");
    } catch { showToast("Delete failed.", "error"); }
  }

  function handleCopyReferral() {
    const link = `${window.location.origin}/?ref=${user.referralCode || ""}`;
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  // ─── Sidebar ───────────────────────────────────────────────────────────────

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* User info */}
      <div className="px-4 py-5 mb-2" style={{ borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0" style={{ background: "linear-gradient(135deg,#2563EB,#7c3aed)" }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>{user.name}</p>
            <p className="text-[10px] font-semibold" style={{ color: "#94a3b8" }}>₦{(user.walletBalance||0).toLocaleString()} earnings</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {SIDEBAR_ITEMS.map(item => {
          const Icon = item.icon;
          const active = section === item.id;
          const badge = item.id === "notifications" ? unreadCount : 0;
          return (
            <button key={item.id} onClick={() => { navTo(item.id); setDrawerOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all relative"
              style={active
                ? { background: isDarkMode ? "rgba(37,99,235,0.20)" : "#DBEAFE", color: "#2563EB" }
                : { color: isDarkMode ? "#94a3b8" : "#64748b" }}>
              <Icon className="h-4.5 w-4.5 shrink-0" style={{ width: "18px", height: "18px" }}/>
              <span className="text-xs font-semibold flex-1">{item.label}</span>
              {badge > 0 && <span className="h-4 min-w-[16px] flex items-center justify-center rounded-full text-[8px] font-black text-white px-1" style={{ background: "#EF4444" }}>{badge}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-4 pt-3 space-y-1" style={{ borderTop: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
        <button onClick={onOpenDeposit} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer" style={{ background: "rgba(124,58,237,0.10)", color: "#7c3aed" }}>
          <PiggyBank style={{ width: "18px", height: "18px" }}/>
          <span className="text-xs font-semibold">Fund Ad Wallet</span>
          <span className="ml-auto text-[10px] font-mono font-bold">{fmt(adBal).replace("₦","₦")}</span>
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer" style={{ color: "#ef4444" }}>
          <LogOut style={{ width: "18px", height: "18px" }}/>
          <span className="text-xs font-semibold">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex gap-0 relative -mx-4 sm:-mx-6 lg:-mx-8 min-h-[calc(100vh-4rem)]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-hidden"
        style={{ width: "220px", background: isDarkMode ? "rgba(10,16,28,0.97)" : "#FFFFFF", borderRight: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
        <SidebarContent/>
      </aside>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)}/>
          <div className="relative w-72 h-full flex flex-col" style={{ background: isDarkMode ? "#0b1220" : "#FFFFFF", borderRight: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
            <button onClick={() => setDrawerOpen(false)} className="absolute top-4 right-4 rounded-full p-1.5 cursor-pointer" style={{ background: isDarkMode ? "rgba(255,255,255,0.08)" : "#F1F5F9", color: "#94a3b8" }}>
              <X className="h-4 w-4"/>
            </button>
            <SidebarContent/>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 py-6">
        {/* Mobile header */}
        <div className="flex items-center gap-3 mb-5 md:hidden">
          <button onClick={() => setDrawerOpen(true)} className="rounded-xl p-2 cursor-pointer" style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC", border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
            <Menu className="h-5 w-5" style={{ color: "#64748b" }}/>
          </button>
          <span className="font-bold text-sm" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
            {SIDEBAR_ITEMS.find(i => i.id === section)?.label || "Dashboard"}
          </span>
          {unreadCount > 0 && section !== "notifications" && (
            <span className="h-5 min-w-[20px] flex items-center justify-center rounded-full text-[9px] font-black text-white px-1.5 ml-auto" style={{ background: "#EF4444" }}>{unreadCount}</span>
          )}
        </div>

        {renderContent()}
      </main>
    </div>
  );
}
