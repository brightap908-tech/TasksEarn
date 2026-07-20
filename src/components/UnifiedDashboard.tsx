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
import { BrowserPushCard } from "./EarnerNotifications";
import { usePlatforms } from "../lib/platformsStore";
import { PlatformIcon, getPlatformFromCategory } from "../lib/platformIcons";

import { ColorMode } from "../lib/themes";

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
  colorMode?: ColorMode;
}

const SIDEBAR_ITEMS = [
  { id: "overview",         label: "Dashboard",         icon: LayoutDashboard },
  { id: "tasks",            label: "Available Tasks",   icon: ClipboardList },
  { id: "my-tasks",         label: "My Tasks",          icon: CheckSquare },
  { id: "create-campaign",  label: "Create Campaign",   icon: Megaphone },
  { id: "my-campaigns",     label: "My Campaigns",      icon: BarChart2 },
  { id: "wallet",           label: "Wallet",            icon: Wallet },
  { id: "withdraw",         label: "Withdraw",          icon: ArrowDownCircle },
  { id: "referrals",        label: "Referrals",         icon: Users },
  { id: "notifications",    label: "Notifications",     icon: Bell },
  { id: "profile",          label: "Profile & Settings", icon: Settings },
];

// Each entry carries both the display label and the Paystack bank code so the
// server never has to guess the code from an ambiguous name string.
const BANKS: { label: string; code: string }[] = [
  { label: "Access Bank",                     code: "044"    },
  { label: "First Bank of Nigeria",            code: "011"    },
  { label: "Guaranty Trust Bank (GTB)",        code: "058"    },
  { label: "United Bank for Africa (UBA)",     code: "033"    },
  { label: "Zenith Bank",                      code: "057"    },
  { label: "Fidelity Bank",                    code: "070"    },
  { label: "Stanbic IBTC Bank",               code: "221"    },
  { label: "Union Bank",                       code: "032"    },
  { label: "Sterling Bank",                    code: "232"    },
  { label: "Wema Bank",                        code: "035"    },
  { label: "Polaris Bank",                     code: "076"    },
  { label: "Heritage Bank",                    code: "030"    },
  { label: "First City Monument Bank (FCMB)", code: "214"    },
  { label: "Ecobank Nigeria",                  code: "050"    },
  { label: "OPay (OPay Microfinance Bank)",   code: "999992" },
  { label: "PalmPay",                          code: "999991" },
  { label: "Kuda Bank",                        code: "50211"  },
  { label: "Moniepoint",                       code: "50515"  },
  { label: "Carbon (One Finance)",             code: "565"    },
  { label: "VFD Microfinance Bank",            code: "566"    },
  { label: "Providus Bank",                    code: "101"    },
  { label: "Keystone Bank",                    code: "082"    },
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
  onOpenDeposit, isDarkMode,
  colorMode = "light",
}: Props) {
  const { section = "overview" } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const { platforms } = usePlatforms();

  const [loading, setLoading] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerClosing, setDrawerClosing] = React.useState(false);

  const [dashData, setDashData]         = React.useState<any>(null);
  const [tasks, setTasks]               = React.useState<any[]>([]);
  const [taskFilter, setTaskFilter]     = React.useState("All");
  const [submissions, setSubmissions]   = React.useState<any[]>([]);
  const [subTab, setSubTab]             = React.useState<"All"|"Pending"|"Approved"|"Rejected">("All");
  const [cp, setCp]                     = React.useState({ platform:"", action:"", title:"", desc:"", link:"", proof:"", slots:100 });
  const [campaignPricing, setCampaignPricing] = React.useState<any[]>([]);
  const [campaignSubmitting, setCampaignSubmitting] = React.useState(false);
  const [campaigns, setCampaigns]       = React.useState<any[]>([]);
  const [camTab, setCamTab]             = React.useState<"All"|"Active"|"Paused"|"Completed">("All");
  const [expandedCam, setExpandedCam]   = React.useState<string|null>(null);
  const [camSubs, setCamSubs]           = React.useState<Record<string,any[]>>({});
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [txTab, setTxTab]               = React.useState<"All"|"Deposits"|"Earnings"|"Withdrawals"|"Spending">("All");
  const [wd, setWd]                     = React.useState({ amount:"", bankName:"", bankCode:"", accountNumber:"", accountName:"" });
  const [wdLoading, setWdLoading]       = React.useState(false);
  const [wdVerifying, setWdVerifying]   = React.useState(false);
  const [wdVerified, setWdVerified]     = React.useState(false);
  const [pendingWds, setPendingWds]     = React.useState<any[]>([]);
  const [referrals, setReferrals]       = React.useState<any[]>([]);
  const [refStats, setRefStats]         = React.useState<any>(null);
  const [copied, setCopied]             = React.useState(false);
  const [prof, setProf]                 = React.useState({ name: user.name, username: user.username||"", phone: user.phone||"", country: user.country||"", business: user.businessName||"" });
  const [profLoading, setProfLoading]   = React.useState(false);
  const [pw, setPw]                     = React.useState({ old:"", new:"", confirm:"" });
  const [pwLoading, setPwLoading]       = React.useState(false);
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

  const closeDrawer = React.useCallback(() => {
    setDrawerClosing(true);
    setTimeout(() => { setDrawerOpen(false); setDrawerClosing(false); }, 280);
  }, []);

  const pricingForPlatform = campaignPricing.find(p => p.platform === cp.platform);
  const costPerSlot = pricingForPlatform?.costPerSlot || 0;
  const totalCost = costPerSlot * cp.slots;
  const adBal = user.adBalance ?? 0;

  const fmt = (n: number) => `₦${(n||0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ─── Card style helpers ──────────────────────────────────────────────────────
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: isDarkMode ? "rgba(255,255,255,0.04)" : "#ffffff",
    border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
    borderRadius: "1rem",
    boxShadow: isDarkMode ? "none" : "0 2px 12px rgba(15,23,42,0.05)",
    ...extra,
  });

  // ─── Section Renderers ──────────────────────────────────────────────────────

  const renderOverview = () => {
    const firstName = user.name.split(" ")[0];
    const today = new Date().toLocaleDateString("en-NG", { weekday: "long", month: "short", day: "numeric" });

    return (
      <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>

        {/* ── 1. Welcome message ── */}
        <div>
          <p className="text-xs font-semibold" style={{ color: "#94A3B8" }}>{today}</p>
          <h1 className="font-black mt-0.5" style={{ fontSize: "clamp(1.125rem,4vw,1.375rem)", color: isDarkMode ? "#f1f5f9" : "#0F172A", fontFamily: "var(--font-display)", letterSpacing: "-0.025em", lineHeight: 1.2 }}>
            Welcome back, {firstName} 👋
          </h1>
        </div>

        {/* ── 2. Wallet Balance Hero Card ── */}
        <div
          className="rounded-2xl relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1d4ed8 0%, #2563EB 45%, #3b82f6 100%)",
            boxShadow: "0 12px 40px rgba(37,99,235,0.40), 0 3px 10px rgba(29,78,216,0.25)",
            padding: "clamp(1.25rem,5vw,1.75rem)",
          }}
        >
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: "-28px", right: "-28px", width: "130px", height: "130px", borderRadius: "9999px", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }}/>
          <div style={{ position: "absolute", bottom: "-40px", right: "24px", width: "90px", height: "90px", borderRadius: "9999px", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }}/>
          <div style={{ position: "absolute", top: "50%", left: "-20px", width: "60px", height: "60px", borderRadius: "9999px", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }}/>

          <div className="relative" style={{ zIndex: 1 }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(219,234,254,0.80)", letterSpacing: "0.12em" }}>Earnings Balance</p>
            <p
              className="font-black font-mono text-white mt-2 leading-none"
              style={{ fontSize: "clamp(1.875rem,8vw,2.5rem)", letterSpacing: "-0.02em" }}
            >
              ₦{(user.walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {/* ── Ad Wallet sub-section ── */}
            <div style={{ marginTop: "clamp(1rem,4vw,1.375rem)", paddingTop: "clamp(0.875rem,3.5vw,1.125rem)", borderTop: "1px solid rgba(255,255,255,0.18)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <Wallet style={{ width: "0.8125rem", height: "0.8125rem", color: "rgba(219,234,254,0.80)", flexShrink: 0 }}/>
                <span style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(219,234,254,0.80)" }}>Ad Wallet</span>
              </div>
              <p className="font-black font-mono text-white leading-none" style={{ fontSize: "clamp(1.25rem,5.5vw,1.75rem)", marginTop: "0.3125rem", letterSpacing: "-0.015em" }}>
                ₦{adBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="flex items-center gap-1.5 mt-4">
              <span className="h-2 w-2 rounded-full" style={{ background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.60)" }}/>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(219,234,254,0.70)", letterSpacing: "0.10em" }}>Live Balance</span>
            </div>
          </div>
        </div>

        {/* ── 3. Primary Action Buttons ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <button
            onClick={() => navTo("withdraw")}
            className="rounded-2xl cursor-pointer transition-all"
            style={{
              padding: "clamp(0.875rem,3vw,1.125rem) 0.75rem",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
              background: isDarkMode ? "rgba(37,99,235,0.14)" : "#EFF6FF",
              border: "1.5px solid rgba(37,99,235,0.28)",
              boxShadow: "0 2px 8px rgba(37,99,235,0.08)",
            }}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "rgba(37,99,235,0.14)" }}>
              <ArrowDownCircle className="h-5 w-5" style={{ color: "#2563EB" }}/>
            </span>
            <span className="text-sm font-bold" style={{ color: "#2563EB" }}>Withdraw</span>
          </button>

          <button
            onClick={() => onOpenDeposit()}
            className="rounded-2xl cursor-pointer transition-all"
            style={{
              padding: "clamp(0.875rem,3vw,1.125rem) 0.75rem",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
              background: isDarkMode ? "rgba(124,58,237,0.14)" : "#F5F3FF",
              border: "1.5px solid rgba(124,58,237,0.28)",
              boxShadow: "0 2px 8px rgba(124,58,237,0.08)",
            }}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "rgba(124,58,237,0.14)" }}>
              <PiggyBank className="h-5 w-5" style={{ color: "#7C3AED" }}/>
            </span>
            <span className="text-sm font-bold" style={{ color: "#7C3AED" }}>Fund Wallet</span>
          </button>
        </div>

        {/* ── 4. Quick Actions ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
          {([
            { label: "Tasks",      icon: <ClipboardList className="h-5 w-5"/>, action: () => navTo("tasks"),        color: "#0891B2", bg: "rgba(8,145,178,0.11)" },
            { label: "Campaigns",  icon: <BarChart2 className="h-5 w-5"/>,     action: () => navTo("my-campaigns"),  color: "#059669", bg: "rgba(5,150,105,0.11)" },
            { label: "Wallet",     icon: <Wallet className="h-5 w-5"/>,        action: () => navTo("wallet"),        color: "#2563EB", bg: "rgba(37,99,235,0.11)" },
            { label: "Referrals",  icon: <Users className="h-5 w-5"/>,         action: () => navTo("referrals"),     color: "#D97706", bg: "rgba(217,119,6,0.11)" },
          ] as const).map(item => (
            <button
              key={item.label}
              onClick={item.action}
              className="rounded-2xl cursor-pointer transition-all"
              style={{
                padding: "clamp(0.625rem,2.5vw,0.875rem) 0.25rem",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem",
                background: isDarkMode ? "rgba(255,255,255,0.04)" : "#FFFFFF",
                border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
                boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
                minHeight: "auto",
              }}
            >
              <span className="flex items-center justify-center rounded-xl" style={{ height: "36px", width: "36px", background: item.bg, color: item.color, flexShrink: 0 }}>
                {item.icon}
              </span>
              <span className="font-bold leading-tight text-center" style={{ fontSize: "clamp(9px,2.2vw,11px)", color: isDarkMode ? "#94A3B8" : "#64748B" }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* ── 5. Task Submission Summary ── */}
        {dashData && (
          <div
            className="rounded-2xl"
            style={{
              background: isDarkMode ? "rgba(255,255,255,0.04)" : "#FFFFFF",
              border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
              boxShadow: "0 2px 12px rgba(15,23,42,0.05)",
              overflow: "hidden",
            }}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <h3 className="text-sm font-bold" style={{ color: isDarkMode ? "#e2e8f0" : "#0F172A" }}>Task Submissions</h3>
              <button onClick={() => navTo("my-tasks")} className="text-xs font-bold cursor-pointer" style={{ color: "#2563EB", background: "none", border: "none", padding: 0, minHeight: "auto" }}>
                View All →
              </button>
            </div>
            <div className="px-4 pb-4" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.625rem" }}>
              {[
                { label: "Approved", count: dashData.approvedCount ?? 0, color: "#22c55e", bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.18)", path: "approved" },
                { label: "Pending",  count: dashData.pendingCount  ?? 0, color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.18)", path: "pending"  },
                { label: "Rejected", count: dashData.rejectedCount ?? 0, color: "#ef4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.18)", path: "rejected" },
              ].map(s => (
                <button key={s.label}
                  onClick={() => navigate(`/dashboard/my-tasks/${s.path}`)}
                  className="rounded-xl text-center cursor-pointer transition-all hover:opacity-80 active:scale-95"
                  style={{ background: s.bg, border: `1px solid ${s.border}`, padding: "0.75rem 0.25rem", minHeight: "auto" }}>
                  <p className="font-black leading-none" style={{ fontSize: "clamp(1.25rem,6vw,1.625rem)", color: s.color }}>{s.count}</p>
                  <p className="font-semibold mt-1.5 leading-none" style={{ fontSize: "clamp(9px,2.2vw,11px)", color: "#94A3B8" }}>{s.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 6. Recent Transactions ── */}
        {dashData?.recentTransactions?.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: isDarkMode ? "rgba(255,255,255,0.04)" : "#FFFFFF",
              border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
              boxShadow: "0 2px 12px rgba(15,23,42,0.05)",
            }}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <h3 className="text-sm font-bold" style={{ color: isDarkMode ? "#e2e8f0" : "#0F172A" }}>Recent Transactions</h3>
              <button onClick={() => navTo("wallet")} className="text-xs font-bold cursor-pointer" style={{ color: "#2563EB", background: "none", border: "none", padding: 0, minHeight: "auto" }}>
                View All →
              </button>
            </div>
            <div>
              {dashData.recentTransactions.slice(0, 4).map((tx: any, i: number) => {
                const isCredit = tx.type === "Task Earnings" || tx.type === "Referral Bonus" || tx.type === "Deposit";
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: isDarkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid #F1F5F9" }}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0" style={{ background: isCredit ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)" }}>
                      {isCredit
                        ? <TrendingUp className="h-4 w-4" style={{ color: "#22c55e" }}/>
                        : <TrendingDown className="h-4 w-4" style={{ color: "#ef4444" }}/>
                      }
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: isDarkMode ? "#e2e8f0" : "#0F172A" }}>{tx.type}</p>
                      <p className="mt-0.5" style={{ fontSize: "10px", color: "#94A3B8" }}>
                        {new Date(tx.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black font-mono" style={{ color: isCredit ? "#22c55e" : "#ef4444" }}>
                        {isCredit ? "+" : "-"}{fmt(tx.amount)}
                      </p>
                      <span className="font-bold" style={{ fontSize: "9px", color: statusColor(tx.status) }}>{tx.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading skeleton when dashData not yet fetched */}
        {!dashData && loading && (
          <div
            className="rounded-2xl flex flex-col items-center justify-center gap-3"
            style={{
              background: isDarkMode ? "rgba(255,255,255,0.04)" : "#FFFFFF",
              border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
              padding: "2.5rem 1.5rem",
            }}
          >
            <div className="h-7 w-7 animate-spin rounded-full border-4" style={{ borderColor: "rgba(37,99,235,0.18)", borderTopColor: "#2563EB" }}/>
            <p className="text-xs font-semibold" style={{ color: "#94A3B8" }}>Loading your dashboard…</p>
          </div>
        )}
      </div>
    );
  };

  const renderTasks = () => {
    const platformOptions = ["All", ...Array.from(new Set(tasks.map((t:any) => t.category?.split(" ")[0]))).filter(Boolean)];
    const filtered = taskFilter === "All" ? tasks : tasks.filter((t:any) => t.category?.startsWith(taskFilter));

    return (
      <div className="space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0F172A" }}>Available Tasks</h2>
          <button onClick={() => loadSection("tasks")} className="p-2 rounded-xl cursor-pointer" style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC", border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0", minHeight: "auto" }}>
            <RefreshCw className="h-4 w-4" style={{ color: "#94A3B8" }}/>
          </button>
        </div>

        {/* Platform filter chips */}
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {platformOptions.slice(0, 8).map(p => (
            <button key={p} onClick={() => setTaskFilter(p)}
              style={{
                borderRadius: "9999px", padding: "0.25rem 0.75rem", fontSize: "0.75rem", fontWeight: 700,
                cursor: "pointer", minHeight: "auto", border: "1px solid",
                background: taskFilter === p ? "#2563EB" : (isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC"),
                color: taskFilter === p ? "#fff" : (isDarkMode ? "#94A3B8" : "#64748B"),
                borderColor: taskFilter === p ? "#2563EB" : (isDarkMode ? "rgba(255,255,255,0.10)" : "#E2E8F0"),
              }}>
              {p}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-4" style={{ borderColor: "rgba(37,99,235,0.20)", borderTopColor: "#2563EB" }}/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12" style={{ color: "#94A3B8" }}>
            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-25"/>
            <p className="font-semibold text-sm">No tasks available right now</p>
            <p className="text-xs mt-1">Check back soon for new opportunities</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "0.625rem" }}>
            {filtered.map((task:any) => {
              const alreadyDone = task.submissionStatus && task.submissionStatus !== "Rejected";
              return (
                <div key={task.id} className="rounded-2xl p-3.5" style={card()}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: isDarkMode ? "rgba(37,99,235,0.15)" : "rgba(37,99,235,0.08)", color: "#2563EB", lineHeight: 1 }}>
                          <PlatformIcon platform={getPlatformFromCategory(task.category)} size={14} monochrome={false} />
                          {task.category}
                        </span>
                        {task.filledSlots >= task.totalSlots && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444" }}>Full</span>}
                      </div>
                      <h3 className="font-bold text-sm leading-snug" style={{ color: isDarkMode ? "#e2e8f0" : "#0F172A" }}>{task.title}</h3>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: "#64748B" }} dangerouslySetInnerHTML={{ __html: task.description?.substring(0, 80) + (task.description?.length > 80 ? "…" : "") || "" }} />
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs" style={{ color: "#64748B" }}>{task.filledSlots}/{task.totalSlots} slots</span>
                        <span className="text-sm font-black" style={{ color: "#22c55e" }}>+₦{(task.earningPerSlot||0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="shrink-0 mt-0.5">
                      {alreadyDone ? (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: statusBg(task.submissionStatus), color: statusColor(task.submissionStatus) }}>{task.submissionStatus}</span>
                      ) : task.filledSlots >= task.totalSlots ? null : (
                        <button onClick={() => navigate(`/dashboard/tasks/${task.id}/submit`)}
                          className="rounded-xl px-3 py-2 text-xs font-bold text-white cursor-pointer"
                          style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", boxShadow: "0 2px 8px rgba(37,99,235,0.28)", minHeight: "auto" }}>
                          Start
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
      <div className="space-y-4 animate-fadeIn">
        <h2 className="text-base font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0F172A" }}>My Tasks</h2>
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {(["All","Pending","Approved","Rejected"] as const).map(tab => (
            <button key={tab} onClick={() => setSubTab(tab)}
              style={{
                borderRadius: "9999px", padding: "0.25rem 0.75rem", fontSize: "0.75rem", fontWeight: 700,
                cursor: "pointer", minHeight: "auto", border: "1px solid",
                background: subTab === tab ? "#2563EB" : (isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC"),
                color: subTab === tab ? "#fff" : "#64748B",
                borderColor: subTab === tab ? "#2563EB" : (isDarkMode ? "rgba(255,255,255,0.10)" : "#E2E8F0"),
              }}>
              {tab} ({tab === "All" ? submissions.length : submissions.filter((s:any) => s.status === tab).length})
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-4" style={{ borderColor: "rgba(37,99,235,0.20)", borderTopColor: "#2563EB" }}/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12" style={{ color: "#94A3B8" }}>
            <CheckSquare className="h-10 w-10 mx-auto mb-3 opacity-25"/>
            <p className="font-semibold text-sm">No {subTab !== "All" ? subTab.toLowerCase() : ""} submissions yet</p>
            <button onClick={() => navTo("tasks")} className="mt-3 text-sm font-bold cursor-pointer" style={{ color: "#2563EB", background: "none", border: "none", minHeight: "auto" }}>Browse available tasks →</button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "0.625rem" }}>
            {filtered.map((sub:any) => (
              <div key={sub.id} className="rounded-2xl p-3.5" style={card()}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(37,99,235,0.10)", color: "#2563EB" }}>{sub.category}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: statusColor(sub.status), background: statusBg(sub.status) }}>{sub.status}</span>
                    </div>
                    <h3 className="font-bold text-sm" style={{ color: isDarkMode ? "#e2e8f0" : "#0F172A" }}>{sub.taskTitle}</h3>
                    {sub.feedback && (
                      <div className="mt-2 rounded-xl p-2" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                        <p className="text-xs font-semibold" style={{ color: "#ef4444" }}>Feedback: {sub.feedback}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px]" style={{ color: "#94A3B8" }}>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                      <span className="text-sm font-black font-mono" style={{ color: "#22c55e" }}>+₦{(sub.reward||0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {sub.status === "Rejected" && (
                      <button onClick={() => navigate(`/dashboard/my-tasks/${sub.id}/resubmit`)}
                        className="rounded-xl px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
                        style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", minHeight: "auto" }}>
                        Resubmit
                      </button>
                    )}
                    {sub.status === "Pending" && (
                      <button onClick={() => handleDeleteSubmission(sub.id)}
                        className="rounded-xl p-1.5 cursor-pointer" style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444", minHeight: "auto" }}>
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
      <div className="space-y-4 animate-fadeIn" style={{ maxWidth: "640px" }}>
        <div>
          <h2 className="text-base font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0F172A" }}>Create Campaign</h2>
          <p className="text-xs mt-1" style={{ color: "#64748B" }}>
            Ad Wallet: <span className="font-bold" style={{ color: "#7C3AED" }}>{fmt(adBal)}</span>
          </p>
        </div>

        {adBal === 0 && (
          <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.20)" }}>
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#7C3AED" }}/>
            <div>
              <p className="text-sm font-bold" style={{ color: "#7C3AED" }}>Fund your Ad Wallet first</p>
              <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>You need funds to create campaigns.</p>
              <button onClick={() => onOpenDeposit()} className="mt-2 text-xs font-bold cursor-pointer" style={{ color: "#7C3AED", background: "none", border: "none", padding: 0, minHeight: "auto" }}>+ Fund Ad Wallet →</button>
            </div>
          </div>
        )}

        <form onSubmit={handleCreateCampaign} className="space-y-4">
          {/* Platform + Action — stacked on mobile */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.75rem" }}>
            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#64748B", letterSpacing: "0.06em" }}>Platform *</label>
              <select value={cp.platform} onChange={e => setCp(p => ({...p, platform: e.target.value}))} required
                style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#fff", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0"), color: isDarkMode ? "#e2e8f0" : "#0F172A" }}>
                <option value="">Select platform</option>
                {campaignPricing.map(p => (
                  <option key={p.platform} value={p.platform}>{p.platform} — ₦{p.costPerSlot}/slot</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#64748B", letterSpacing: "0.06em" }}>Action *</label>
              <select value={cp.action} onChange={e => setCp(p => ({...p, action: e.target.value}))} required
                style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#fff", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0"), color: isDarkMode ? "#e2e8f0" : "#0F172A" }}>
                <option value="">Select action</option>
                {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {[
            { label: "Campaign Title *", key: "title", ph: "e.g. Follow our Instagram page @brand" },
            { label: "Description", key: "desc", ph: "Describe what users need to do…" },
            { label: "Target Link *", key: "link", ph: "https://…" },
            { label: "Proof Requirements *", key: "proof", ph: "Screenshot of follow confirmation, your username…" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#64748B", letterSpacing: "0.06em" }}>{f.label}</label>
              {f.key === "desc" || f.key === "proof" ? (
                <textarea value={(cp as any)[f.key]} onChange={e => setCp(p => ({...p, [f.key]: e.target.value}))}
                  placeholder={f.ph} rows={3}
                  style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#fff", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0"), color: isDarkMode ? "#e2e8f0" : "#0F172A", resize: "vertical" }}/>
              ) : (
                <input type={f.key === "link" ? "url" : "text"} value={(cp as any)[f.key]} onChange={e => setCp(p => ({...p, [f.key]: e.target.value}))}
                  placeholder={f.ph} required={f.label.includes("*")}
                  style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#fff", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0"), color: isDarkMode ? "#e2e8f0" : "#0F172A" }}/>
              )}
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold uppercase mb-2" style={{ color: "#64748B", letterSpacing: "0.06em" }}>
              Number of Slots
            </label>

            {/* ── Stepper row ── */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {([-100, -1] as const).map(delta => (
                <button key={delta} type="button"
                  onClick={() => setCp(p => ({...p, slots: Math.max(1, p.slots + delta)}))}
                  className="shrink-0 font-black cursor-pointer select-none"
                  style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.625rem", fontSize: "1.125rem", lineHeight: 1,
                    background: isDarkMode ? "rgba(255,255,255,0.08)" : "#F1F5F9",
                    border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.14)" : "#E2E8F0"),
                    color: isDarkMode ? "#e2e8f0" : "#334155", minHeight: "auto" }}>
                  {delta === -1 ? "−" : "−−"}
                </button>
              ))}
              <input
                type="number" min={1} max={1000000} value={cp.slots}
                onChange={e => {
                  const v = parseInt(e.target.value);
                  setCp(p => ({...p, slots: isNaN(v) ? 1 : Math.max(1, Math.min(1000000, v))}));
                }}
                style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: "1rem",
                  background: isDarkMode ? "rgba(255,255,255,0.06)" : "#fff",
                  border: "1.5px solid #2563EB", borderRadius: "0.625rem",
                  color: isDarkMode ? "#e2e8f0" : "#0F172A", padding: "0.5rem 0.25rem" }}
              />
              {([1, 100] as const).map(delta => (
                <button key={delta} type="button"
                  onClick={() => setCp(p => ({...p, slots: Math.min(1000000, p.slots + delta)}))}
                  className="shrink-0 font-black cursor-pointer select-none"
                  style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.625rem", fontSize: "1.125rem", lineHeight: 1,
                    background: isDarkMode ? "rgba(255,255,255,0.08)" : "#F1F5F9",
                    border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.14)" : "#E2E8F0"),
                    color: isDarkMode ? "#e2e8f0" : "#334155", minHeight: "auto" }}>
                  {delta === 1 ? "+" : "++"}
                </button>
              ))}
            </div>

            {/* ── Quick-select chips ── */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginTop: "0.625rem" }}>
              {[100, 500, 1000, 5000, 10000, 50000, 100000].map(n => {
                const active = cp.slots === n;
                return (
                  <button key={n} type="button"
                    onClick={() => setCp(p => ({...p, slots: n}))}
                    className="cursor-pointer font-bold"
                    style={{ borderRadius: "9999px", padding: "0.25rem 0.625rem", fontSize: "0.7rem",
                      minHeight: "auto", border: "1.5px solid",
                      background: active ? "#2563EB" : (isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC"),
                      borderColor: active ? "#2563EB" : (isDarkMode ? "rgba(255,255,255,0.14)" : "#E2E8F0"),
                      color: active ? "#fff" : (isDarkMode ? "#94A3B8" : "#64748B"),
                      transition: "all 0.15s" }}>
                    {n.toLocaleString()}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: "0.625rem", color: "#94A3B8", marginTop: "0.375rem" }}>Min 1 · Max 1,000,000</p>
          </div>

          {cp.platform && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.20)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }} className="text-sm">
                <div>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>Cost per slot</p>
                  <p className="font-black text-base" style={{ color: "#7C3AED" }}>₦{costPerSlot}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>Total ({cp.slots.toLocaleString()} slot{cp.slots !== 1 ? "s" : ""})</p>
                  <p className="font-black text-base" style={{ color: "#7C3AED" }}>₦{totalCost.toLocaleString()}</p>
                </div>
              </div>
              {!canAfford && adBal > 0 && (
                <p className="text-xs font-semibold mt-2" style={{ color: "#ef4444" }}>
                  ⚠️ Need ₦{(totalCost - adBal).toLocaleString()} more.{" "}
                  <button type="button" onClick={() => onOpenDeposit(`${totalCost - adBal}`)} className="underline cursor-pointer" style={{ color: "#ef4444", background: "none", border: "none", padding: 0, minHeight: "auto" }}>Fund wallet</button>
                </p>
              )}
            </div>
          )}

          <button type="submit" disabled={campaignSubmitting || !canAfford}
            className="w-full rounded-xl py-3 text-sm font-bold text-white cursor-pointer"
            style={{ background: (!canAfford || campaignSubmitting) ? "#94A3B8" : "linear-gradient(135deg,#7C3AED,#6D28D9)", cursor: (!canAfford || campaignSubmitting) ? "not-allowed" : "pointer" }}>
            {campaignSubmitting ? "Creating Campaign…" : !canAfford ? "Insufficient Ad Balance" : `Create Campaign — ₦${totalCost.toLocaleString()}`}
          </button>
        </form>
      </div>
    );
  };

  const renderMyCampaigns = () => {
    const filtered = camTab === "All" ? campaigns : campaigns.filter((c:any) => c.status === camTab);
    return (
      <div className="space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-base font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0F172A" }}>My Campaigns</h2>
          <button onClick={() => navTo("create-campaign")} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white cursor-pointer" style={{ background: "linear-gradient(135deg,#7C3AED,#6D28D9)", minHeight: "auto" }}>
            <Plus className="h-3.5 w-3.5"/> New
          </button>
        </div>
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {(["All","Active","Paused","Completed"] as const).map(tab => (
            <button key={tab} onClick={() => setCamTab(tab)}
              style={{
                borderRadius: "9999px", padding: "0.25rem 0.75rem", fontSize: "0.75rem", fontWeight: 700,
                cursor: "pointer", minHeight: "auto", border: "1px solid",
                background: camTab === tab ? "#7C3AED" : (isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC"),
                color: camTab === tab ? "#fff" : "#64748B",
                borderColor: camTab === tab ? "#7C3AED" : (isDarkMode ? "rgba(255,255,255,0.10)" : "#E2E8F0"),
              }}>
              {tab}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-4" style={{ borderColor: "rgba(124,58,237,0.20)", borderTopColor: "#7C3AED" }}/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12" style={{ color: "#94A3B8" }}>
            <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-25"/>
            <p className="font-semibold text-sm">No campaigns yet</p>
            <button onClick={() => navTo("create-campaign")} className="mt-3 text-sm font-bold cursor-pointer" style={{ color: "#7C3AED", background: "none", border: "none", minHeight: "auto" }}>Create your first campaign →</button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((cam:any) => (
              <div key={cam.id} className="rounded-2xl overflow-hidden" style={card()}>
                <div className="p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: statusColor(cam.status), background: statusBg(cam.status) }}>{cam.status}</span>
                        <span className="text-[10px]" style={{ color: "#94A3B8" }}>{cam.filledSlots}/{cam.totalSlots} slots</span>
                      </div>
                      <h3 className="font-bold text-sm leading-snug" style={{ color: isDarkMode ? "#e2e8f0" : "#0F172A" }}>{cam.title}</h3>
                      <div className="mt-2 w-full rounded-full h-1.5" style={{ background: isDarkMode ? "rgba(255,255,255,0.08)" : "#F1F5F9" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (cam.filledSlots / cam.totalSlots) * 100)}%`, background: "#2563EB" }}/>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {cam.status !== "Completed" && (
                        <button onClick={() => handleToggleCampaign(cam.id)}
                          className="rounded-xl p-2 cursor-pointer"
                          style={{ background: cam.status === "Active" ? "rgba(245,158,11,0.10)" : "rgba(34,197,94,0.10)", color: cam.status === "Active" ? "#f59e0b" : "#22c55e", minHeight: "auto" }}>
                          {cam.status === "Active" ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4"/>}
                        </button>
                      )}
                      {cam.status !== "Completed" && (
                        <button onClick={() => handleDeleteCampaign(cam.id)} className="rounded-xl p-2 cursor-pointer" style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444", minHeight: "auto" }}>
                          <Trash2 className="h-4 w-4"/>
                        </button>
                      )}
                      <button onClick={async () => {
                        if (expandedCam === cam.id) { setExpandedCam(null); return; }
                        setExpandedCam(cam.id);
                        await loadCampaignSubs(cam.id);
                      }} className="rounded-xl p-2 cursor-pointer" style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC", color: "#64748B", minHeight: "auto" }}>
                        {expandedCam === cam.id ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                      </button>
                    </div>
                  </div>
                </div>
                {expandedCam === cam.id && (
                  <div style={{ borderTop: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #F1F5F9" }}>
                    <div className="p-3">
                      <p className="text-[10px] font-bold uppercase mb-2" style={{ color: "#94A3B8", letterSpacing: "0.06em" }}>Submissions</p>
                      {!camSubs[cam.id] ? (
                        <div className="text-center py-4"><div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500 mx-auto"/></div>
                      ) : camSubs[cam.id].length === 0 ? (
                        <p className="text-xs text-center py-4" style={{ color: "#94A3B8" }}>No submissions yet</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {camSubs[cam.id].map((sub:any) => (
                            <div key={sub.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "#F8FAFC" }}>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold" style={{ color: isDarkMode ? "#e2e8f0" : "#0F172A" }}>{sub.earnerName}</p>
                                <p className="text-[10px] mt-0.5 truncate" style={{ color: "#94A3B8" }}>{sub.proofText}</p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: statusColor(sub.status), background: statusBg(sub.status) }}>{sub.status}</span>
                                {sub.status === "Pending" && (
                                  <>
                                    <button onClick={() => handleReviewSub(sub.id, "approve", cam.id)} className="rounded-lg p-1 cursor-pointer" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", minHeight: "auto" }} title="Approve"><Check className="h-3.5 w-3.5"/></button>
                                    <button onClick={() => { const f = prompt("Rejection reason:"); if (f !== null) handleReviewSub(sub.id, "reject", cam.id, f); }} className="rounded-lg p-1 cursor-pointer" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", minHeight: "auto" }} title="Reject"><X className="h-3.5 w-3.5"/></button>
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
      <div className="space-y-4 animate-fadeIn">
        <h2 className="text-base font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0F172A" }}>Wallet</h2>

        {/* Balance cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
          <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", boxShadow: "0 6px 20px rgba(37,99,235,0.30)" }}>
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Earnings</p>
            <p className="text-base font-black text-white font-mono mt-1 break-all leading-tight">{fmt(user.walletBalance)}</p>
            <button onClick={() => navTo("withdraw")} className="mt-3 text-[11px] font-bold text-blue-200 flex items-center gap-1 cursor-pointer" style={{ background: "none", border: "none", padding: 0, minHeight: "auto" }}>
              Withdraw <ArrowRight className="h-3 w-3"/>
            </button>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#7C3AED,#6D28D9)", boxShadow: "0 6px 20px rgba(124,58,237,0.25)" }}>
            <p className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Ad Balance</p>
            <p className="text-base font-black text-white font-mono mt-1 break-all leading-tight">{fmt(adBal)}</p>
            <button onClick={() => onOpenDeposit()} className="mt-3 text-[11px] font-bold text-purple-200 flex items-center gap-1 cursor-pointer" style={{ background: "none", border: "none", padding: 0, minHeight: "auto" }}>
              Fund <ArrowRight className="h-3 w-3"/>
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {(["All","Deposits","Earnings","Withdrawals","Spending"] as const).map(tab => (
            <button key={tab} onClick={() => setTxTab(tab)}
              style={{
                borderRadius: "9999px", padding: "0.25rem 0.625rem", fontSize: "0.7rem", fontWeight: 700,
                cursor: "pointer", minHeight: "auto", border: "1px solid",
                background: txTab === tab ? "#2563EB" : (isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC"),
                color: txTab === tab ? "#fff" : "#64748B",
                borderColor: txTab === tab ? "#2563EB" : (isDarkMode ? "rgba(255,255,255,0.10)" : "#E2E8F0"),
              }}>
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-4" style={{ borderColor: "rgba(37,99,235,0.20)", borderTopColor: "#2563EB" }}/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12" style={{ color: "#94A3B8" }}>
            <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-25"/>
            <p className="text-sm font-semibold">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((tx:any) => {
              const isCredit = tx.type === "Task Earnings" || tx.type === "Referral Bonus" || tx.type === "Deposit";
              return (
                <div key={tx.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "#F8FAFC", border: isDarkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid #F1F5F9" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: isDarkMode ? "#e2e8f0" : "#0F172A" }}>{tx.description || tx.type}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#94A3B8" }}>{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black font-mono" style={{ color: isCredit ? "#22c55e" : "#ef4444" }}>
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
    );
  };

  const renderWithdraw = () => (
    <div className="space-y-4 animate-fadeIn" style={{ maxWidth: "520px" }}>
      <div>
        <h2 className="text-base font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0F172A" }}>Withdraw Funds</h2>
        <p className="text-xs mt-1" style={{ color: "#64748B" }}>
          Balance: <span className="font-bold" style={{ color: "#2563EB" }}>{fmt(user.walletBalance)}</span>
          {" · "}Fee: ₦{settings.withdrawalFee}
          {" · "}Min: ₦{settings.minWithdrawal}
        </p>
      </div>
      <form onSubmit={handleWithdraw} className="space-y-4 rounded-2xl p-4" style={card()}>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#64748B", letterSpacing: "0.06em" }}>Amount (₦)</label>
          <input type="number" min={settings.minWithdrawal} max={user.walletBalance} value={wd.amount}
            onChange={e => setWd(w => ({...w, amount: e.target.value}))} required
            placeholder={`Min ₦${settings.minWithdrawal}`}
            style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#fff", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0"), color: isDarkMode ? "#e2e8f0" : "#0F172A" }}/>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#64748B", letterSpacing: "0.06em" }}>Bank</label>
          <select value={wd.bankName} onChange={e => {
              const selected = BANKS.find(b => b.label === e.target.value);
              setWd(w => ({ ...w, bankName: e.target.value, bankCode: selected?.code ?? "", accountName: "" }));
              setWdVerified(false);
            }} required
            style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#fff", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0"), color: isDarkMode ? "#e2e8f0" : "#0F172A" }}>
            <option value="">Select your bank</option>
            {BANKS.map(b => <option key={b.label} value={b.label}>{b.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#64748B", letterSpacing: "0.06em" }}>Account Number</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input type="text" inputMode="numeric" maxLength={10} value={wd.accountNumber}
              onChange={e => { setWd(w => ({...w, accountNumber: e.target.value.replace(/\D/g,"")})); setWdVerified(false); }}
              required placeholder="10-digit account"
              style={{ flex: 1, background: isDarkMode ? "rgba(255,255,255,0.06)" : "#fff", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0"), color: isDarkMode ? "#e2e8f0" : "#0F172A" }}/>
            <button type="button" onClick={handleVerifyAccount} disabled={wdVerifying || wd.accountNumber.length !== 10}
              className="rounded-xl px-3 py-2.5 text-xs font-bold cursor-pointer shrink-0"
              style={{ background: "rgba(37,99,235,0.10)", color: "#2563EB", border: "1px solid rgba(37,99,235,0.20)", minHeight: "auto", width: "auto" }}>
              {wdVerifying ? "…" : "Verify"}
            </button>
          </div>
        </div>
        {wdVerified && wd.accountName && (
          <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.20)" }}>
            <Check className="h-4 w-4 shrink-0" style={{ color: "#22c55e" }}/>
            <p className="text-xs font-bold" style={{ color: "#22c55e" }}>Verified: {wd.accountName}</p>
          </div>
        )}
        <button type="submit" disabled={wdLoading || !wdVerified}
          className="w-full rounded-xl py-3 text-sm font-bold text-white cursor-pointer"
          style={{ background: (!wdVerified || wdLoading) ? "#94A3B8" : "linear-gradient(135deg,#2563EB,#1D4ED8)", cursor: (!wdVerified || wdLoading) ? "not-allowed" : "pointer" }}>
          {wdLoading ? "Submitting…" : `Withdraw ₦${parseFloat(wd.amount||"0").toLocaleString()}`}
        </button>
      </form>

      {pendingWds.length > 0 && (
        <div>
          <p className="text-sm font-bold mb-2" style={{ color: isDarkMode ? "#e2e8f0" : "#0F172A" }}>Pending Withdrawals</p>
          <div className="space-y-2">
            {pendingWds.map((tx:any) => (
              <div key={tx.id} className="rounded-xl p-3 flex items-center justify-between" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "#FFF7ED", border: "1px solid rgba(245,158,11,0.20)" }}>
                <div>
                  <p className="text-xs font-semibold" style={{ color: isDarkMode ? "#e2e8f0" : "#92400E" }}>{tx.description}</p>
                  <p className="text-[10px]" style={{ color: "#94A3B8" }}>{new Date(tx.createdAt).toLocaleDateString()}</p>
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
    return (
      <div className="space-y-4 animate-fadeIn" style={{ maxWidth: "520px" }}>
        <div>
          <h2 className="text-base font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0F172A" }}>Referral Program</h2>
          <p className="text-xs mt-1" style={{ color: "#64748B" }}>
            Earn ₦{(settings.referralReward||200).toLocaleString()} per friend who joins & completes their first task
          </p>
        </div>

        <div className="rounded-2xl p-5 text-center" style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", boxShadow: "0 6px 20px rgba(37,99,235,0.30)" }}>
          <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-2">Your Referral Code</p>
          <p className="text-2xl font-black text-white tracking-widest font-mono">{code || "—"}</p>
          <button onClick={handleCopyReferral}
            className="mt-4 flex items-center gap-2 mx-auto rounded-full px-4 py-2 text-xs font-bold cursor-pointer"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", minHeight: "auto" }}>
            {copied ? <><Check className="h-3.5 w-3.5"/> Copied!</> : <><Copy className="h-3.5 w-3.5"/> Copy Referral Link</>}
          </button>
        </div>

        {refStats && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
            <div className="rounded-2xl p-4 text-center" style={card()}>
              <p className="text-2xl font-black" style={{ color: "#2563EB" }}>{refStats.totalReferrals || referrals.length}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: "#94A3B8" }}>Total Referrals</p>
            </div>
            <div className="rounded-2xl p-4 text-center" style={card()}>
              <p className="text-base font-black font-mono break-all" style={{ color: "#22c55e" }}>{fmt(refStats.totalEarned || 0)}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: "#94A3B8" }}>Total Earned</p>
            </div>
          </div>
        )}

        {referrals.length > 0 && (
          <div>
            <p className="text-sm font-bold mb-2" style={{ color: isDarkMode ? "#e2e8f0" : "#0F172A" }}>Referred Users</p>
            <div className="space-y-2">
              {referrals.map((r:any) => (
                <div key={r.id} className="rounded-xl p-3 flex items-center justify-between" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "#F8FAFC" }}>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: isDarkMode ? "#e2e8f0" : "#0F172A" }}>{r.refereeName}</p>
                    <p className="text-[10px]" style={{ color: "#94A3B8" }}>{new Date(r.createdAt).toLocaleDateString()}</p>
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
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0F172A" }}>Notifications</h2>
        {unreadCount > 0 && (
          <button onClick={onMarkAllNotificationsRead} className="text-xs font-bold cursor-pointer" style={{ color: "#2563EB", background: "none", border: "none", padding: 0, minHeight: "auto" }}>
            Mark all read
          </button>
        )}
      </div>

      {/* Browser push notification subscription card — always shown when not subscribed */}
      <BrowserPushCard apiFetch={apiFetch} showToast={showToast} />
      {earnerNotifications.length === 0 ? (
        <div className="text-center py-12" style={{ color: "#94A3B8" }}>
          <Bell className="h-10 w-10 mx-auto mb-3 opacity-25"/>
          <p className="font-semibold text-sm">No notifications yet</p>
          <p className="text-xs mt-1">We'll notify you when new tasks are available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {earnerNotifications.map(notif => (
            <div key={notif.id}
              onClick={() => { if (!notif.read) onMarkNotificationRead(notif.id); }}
              className="rounded-2xl p-3.5 cursor-pointer"
              style={{
                background: notif.read ? (isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC") : (isDarkMode ? "rgba(37,99,235,0.12)" : "rgba(219,234,254,0.50)"),
                border: notif.read ? (isDarkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid #E2E8F0") : "1px solid rgba(37,99,235,0.25)",
              }}>
              <div className="flex items-start gap-3">
                {!notif.read && <div className="h-2 w-2 rounded-full shrink-0 mt-1.5" style={{ background: "#2563EB" }}/>}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-relaxed" style={{ color: isDarkMode ? "#e2e8f0" : "#0F172A" }}>{notif.message}</p>
                  <p className="text-[10px] mt-1" style={{ color: "#94A3B8" }}>{new Date(notif.createdAt).toLocaleString()}</p>
                </div>
                <span className="text-xs font-black shrink-0" style={{ color: "#22c55e" }}>+₦{notif.reward}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfile = () => {
    return (
    <div className="space-y-4 animate-fadeIn" style={{ maxWidth: "520px" }}>
      <h2 className="text-base font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0F172A" }}>Profile & Settings</h2>

      <div className="rounded-2xl p-4 space-y-4" style={card()}>
        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #F1F5F9" }}>
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-lg font-black text-white shrink-0" style={{ background: "linear-gradient(135deg,var(--theme-primary),#7C3AED)" }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-bold leading-none" style={{ color: isDarkMode ? "#f1f5f9" : "#0F172A" }}>{user.name}</p>
            <p className="text-xs mt-1 truncate" style={{ color: "#94A3B8" }}>{user.email}</p>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 inline-flex items-center gap-1" style={{ background: "var(--theme-primary-bg)", color: "var(--theme-primary)" }}>
              <Shield className="h-2.5 w-2.5"/>Member
            </span>
          </div>
        </div>
        <form onSubmit={handleSaveProfile} className="space-y-3">
          {[
            { label: "Full Name",      key: "name",     val: prof.name },
            { label: "Username",       key: "username", val: prof.username },
            { label: "Phone",          key: "phone",    val: prof.phone },
            { label: "Country",        key: "country",  val: prof.country },
            { label: "Business Name",  key: "business", val: prof.business },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold uppercase mb-1" style={{ color: "#64748B", letterSpacing: "0.06em" }}>{f.label}</label>
              <input type="text" value={f.val} onChange={e => setProf(p => ({...p, [f.key]: e.target.value}))}
                style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0"), color: isDarkMode ? "#e2e8f0" : "#0F172A" }}/>
            </div>
          ))}
          <button type="submit" disabled={profLoading}
            className="w-full rounded-xl py-2.5 text-sm font-bold text-white cursor-pointer"
            style={{ background: "linear-gradient(135deg,var(--theme-primary),var(--theme-primary-dark))", boxShadow: "0 4px 14px var(--theme-primary-glow)" }}>
            {profLoading ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl p-4 space-y-3" style={card()}>
        <h3 className="font-bold text-sm" style={{ color: isDarkMode ? "#e2e8f0" : "#0F172A" }}>Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          {[
            { label: "Current Password",     key: "old",     val: pw.old },
            { label: "New Password",          key: "new",     val: pw.new },
            { label: "Confirm New Password",  key: "confirm", val: pw.confirm },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold uppercase mb-1" style={{ color: "#64748B", letterSpacing: "0.06em" }}>{f.label}</label>
              <input type="password" value={f.val} onChange={e => setPw(p => ({...p, [f.key]: e.target.value}))} required
                style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC", border: "1px solid " + (isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0"), color: isDarkMode ? "#e2e8f0" : "#0F172A" }}/>
            </div>
          ))}
          <button type="submit" disabled={pwLoading}
            className="w-full rounded-xl py-2.5 text-sm font-bold text-white cursor-pointer"
            style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
            {pwLoading ? "Changing…" : "Change Password"}
          </button>
        </form>
      </div>
    </div>
    );
  };

  // ─── Content switch ────────────────────────────────────────────────────────
  const renderContent = () => {
    switch (section) {
      case "overview":         return renderOverview();
      case "tasks":            return renderTasks();
      case "my-tasks":         return renderMyTasks();
      case "create-campaign":  return renderCreateCampaign();
      case "my-campaigns":     return renderMyCampaigns();
      case "wallet":           return renderWallet();
      case "withdraw":         return renderWithdraw();
      case "referrals":        return renderReferrals();
      case "notifications":    return renderNotifications();
      case "profile":          return renderProfile();
      default:                 return renderOverview();
    }
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();

    // Trim every field before validation
    const platform   = cp.platform.trim();
    const action     = cp.action.trim();
    const title      = cp.title.trim();
    const desc       = cp.desc.trim();
    const link       = cp.link.trim();
    const proof      = cp.proof.trim();
    const slots      = cp.slots;

    // Per-field validation — name the exact missing field
    if (!platform)  { showToast("Platform is required. Please select a platform.", "error"); return; }
    if (!action)    { showToast("Action is required. Please select an action type.", "error"); return; }
    if (!title)     { showToast("Campaign Title is required.", "error"); return; }
    if (!link)      { showToast("Target Link / URL is required.", "error"); return; }
    if (!desc)      { showToast("Task Instructions (description) is required.", "error"); return; }
    if (!proof)     { showToast("Proof Requirements is required.", "error"); return; }
    if (!slots || isNaN(slots) || slots < 1) { showToast("Total Slots must be at least 1.", "error"); return; }

    // Build category from validated fields — format: "Platform - Action"
    // e.g. "Instagram - Follow", "TikTok - Share", "YouTube - Subscribe"
    const category = `${platform} - ${action}`;

    // Explicit guard: belt-and-suspenders after the per-field checks above
    if (!category || category.trim() === "-") {
      showToast("Category could not be generated. Please select a platform and action.", "error");
      return;
    }

    // Log full payload before sending — visible in browser DevTools console
    console.log("[Campaign Create] Submitting payload:", {
      platform,
      action,
      category,
      title,
      description: desc,
      targetLink: link,
      proofRequirements: proof,
      slots
    });

    setCampaignSubmitting(true);
    try {
      const res = await apiFetch("/api/advertiser/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: desc,
          category,            // "Platform - Action" e.g. "Instagram - Follow"
          proofRequirements: proof,
          link,
          totalSlots: slots    // number, not string
        })
      });
      console.log("[Campaign Create] Response:", res);
      if (res?.error) { showToast(res.error, "error"); }
      else if (res?.task) {
        showToast("Campaign created!", "success");
        await onRefreshUser();
        setCp({ platform:"", action:"", title:"", desc:"", link:"", proof:"", slots:100 });
        navTo("my-campaigns");
      }
    } catch (err) {
      console.error("[Campaign Create] Network error:", err);
      showToast("Failed to create campaign. Please try again.", "error");
    }
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
      const status = action === "approve" ? "Approved" : "Rejected";
      const res = await apiFetch(`/api/advertiser/submissions/${subId}/review`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, feedback })
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
    if (!wd.bankCode) {
      showToast("Please select a valid bank from the list.", "error");
      return;
    }
    setWdVerifying(true);
    try {
      const res = await apiFetch("/api/earner/verify-account", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber: wd.accountNumber, bankName: wd.bankName, bankCode: wd.bankCode })
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
    <div className="flex flex-col h-full overflow-hidden">
      {/* User info */}
      <div className="px-4 py-4 shrink-0" style={{ borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0" style={{ background: "linear-gradient(135deg,#2563EB,#7C3AED)" }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: isDarkMode ? "#f1f5f9" : "#0F172A" }}>{user.name}</p>
            <p className="text-[10px] font-semibold truncate" style={{ color: "#94A3B8" }}>
              ₦{(user.walletBalance||0).toLocaleString(undefined, { maximumFractionDigits: 0 })} earnings
            </p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2.5 py-2 space-y-0.5 overflow-y-auto">
        {SIDEBAR_ITEMS.map(item => {
          const Icon = item.icon;
          const active = section === item.id;
          const badge = item.id === "notifications" ? unreadCount : 0;
          return (
            <button key={item.id} onClick={() => { navTo(item.id); setDrawerOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left cursor-pointer transition-all"
              style={active
                ? { background: isDarkMode ? "rgba(37,99,235,0.18)" : "#EFF6FF", color: "#2563EB" }
                : { color: isDarkMode ? "#94A3B8" : "#64748B", background: "transparent" }}>
              <Icon style={{ width: "16px", height: "16px", flexShrink: 0 }}/>
              <span className="text-xs font-semibold flex-1 text-left">{item.label}</span>
              {badge > 0 && (
                <span className="h-4 min-w-[16px] flex items-center justify-center rounded-full text-[8px] font-black text-white px-1" style={{ background: "#EF4444" }}>{badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-2.5 pb-4 pt-2 space-y-1 shrink-0" style={{ borderTop: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
        <button onClick={() => onOpenDeposit()} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer" style={{ background: "rgba(124,58,237,0.10)", color: "#7C3AED", border: "none" }}>
          <PiggyBank style={{ width: "16px", height: "16px", flexShrink: 0 }}/>
          <span className="text-xs font-semibold flex-1 text-left">Fund Ad Wallet</span>
          <span className="text-[10px] font-mono font-bold">{fmt(adBal)}</span>
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer" style={{ color: "#ef4444", background: "transparent", border: "none" }}>
          <LogOut style={{ width: "16px", height: "16px", flexShrink: 0 }}/>
          <span className="text-xs font-semibold">Logout</span>
        </button>
      </div>
    </div>
  );

  // ─── Layout ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: "flex",
        minHeight: "calc(100vh - 56px)", // 56px = navbar height
        background: isDarkMode ? "#050d1a" : "#F8FAFC",
      }}
    >
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col shrink-0"
        style={{
          width: "220px",
          position: "sticky",
          top: "56px",
          height: "calc(100vh - 56px)",
          background: isDarkMode ? "rgba(10,16,28,0.98)" : "#FFFFFF",
          borderRight: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
          overflowY: "auto",
        }}
      >
        <SidebarContent/>
      </aside>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="md:hidden" style={{ position: "fixed", inset: 0, zIndex: 50, isolation: "isolate" }}>
          {/* Backdrop */}
          <div
            onClick={closeDrawer}
            className={drawerClosing ? "animate-backdrop-fade-out" : "animate-backdrop-fade-in"}
            style={{ position: "absolute", inset: 0, background: "rgba(2,6,23,0.60)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" }}
          />

          {/* Drawer panel */}
          <div
            className={drawerClosing ? "animate-drawer-slide-out" : "animate-drawer-slide-in"}
            style={{
              position: "absolute", top: 0, left: 0, bottom: 0,
              width: "min(82vw, 340px)",
              background: isDarkMode ? "#0d1526" : "#FFFFFF",
              borderTopRightRadius: "22px",
              borderBottomRightRadius: "22px",
              boxShadow: "8px 0 48px rgba(2,6,23,0.24), 2px 0 14px rgba(2,6,23,0.12)",
              display: "flex", flexDirection: "column",
              overflow: "hidden",
              willChange: "transform",
            }}
          >
            {/* ── Header ── */}
            <div style={{
              padding: "24px 20px 20px",
              background: "linear-gradient(140deg, #1e3a8a 0%, #2563EB 55%, #3b82f6 100%)",
              flexShrink: 0,
              position: "relative",
            }}>
              {/* Close button */}
              <button
                onClick={closeDrawer}
                style={{
                  position: "absolute", top: "16px", right: "16px",
                  background: "rgba(255,255,255,0.18)",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  borderRadius: "10px",
                  width: "34px", height: "34px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#fff",
                  backdropFilter: "blur(4px)",
                  flexShrink: 0,
                  minHeight: "auto",
                }}
              >
                <X style={{ width: "16px", height: "16px" }} />
              </button>

              {/* Avatar + name + balance */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", paddingRight: "44px" }}>
                <div style={{
                  width: "54px", height: "54px", borderRadius: "50%",
                  background: "rgba(255,255,255,0.18)",
                  border: "2.5px solid rgba(255,255,255,0.40)",
                  backdropFilter: "blur(4px)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  padding: "6px",
                  boxSizing: "border-box",
                  overflow: "hidden",
                }}>
                  <img
                    src="/icon-mark.svg"
                    alt="TasksEarn"
                    width={42}
                    height={42}
                    style={{
                      width: "42px", height: "42px",
                      objectFit: "contain",
                      display: "block",
                      flexShrink: 0,
                    }}
                    onError={e => {
                      // Fallback: hide image and show initial
                      const el = e.currentTarget as HTMLImageElement;
                      el.style.display = "none";
                      const parent = el.parentElement;
                      if (parent) {
                        parent.style.fontSize = "22px";
                        parent.style.fontWeight = "900";
                        parent.style.color = "#fff";
                        parent.textContent = user.name.charAt(0).toUpperCase();
                      }
                    }}
                  />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{
                    color: "#fff", fontWeight: 800, fontSize: "16px", margin: 0,
                    lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    letterSpacing: "-0.015em",
                  }}>{user.name}</p>
                  <p style={{
                    color: "rgba(255,255,255,0.90)", fontSize: "15px", fontWeight: 700,
                    margin: "5px 0 2px", lineHeight: 1.2, fontVariantNumeric: "tabular-nums",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    ₦{(user.walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "11px", fontWeight: 500, margin: 0 }}>
                    Available Balance
                  </p>
                </div>
              </div>
            </div>

            {/* ── Main nav ── */}
            <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "14px 14px 6px" }}>
              {SIDEBAR_ITEMS.filter(item => item.id !== "profile").map((item, idx, arr) => {
                const Icon = item.icon;
                const active = section === item.id;
                const badge = item.id === "notifications" ? unreadCount : 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => { navTo(item.id); closeDrawer(); }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: "14px",
                      padding: "13px 16px",
                      marginBottom: idx < arr.length - 1 ? "3px" : 0,
                      borderRadius: "14px", border: "none", cursor: "pointer", textAlign: "left",
                      transition: "background 0.15s",
                      background: active ? (isDarkMode ? "var(--theme-primary-bg)" : "var(--theme-primary-light)") : "transparent",
                      color: active ? "var(--theme-primary)" : (isDarkMode ? "#94A3B8" : "#64748B"),
                    }}
                  >
                    <Icon style={{
                      width: "20px", height: "20px", flexShrink: 0,
                      color: active ? "var(--theme-primary)" : (isDarkMode ? "#64748B" : "#94A3B8"),
                      strokeWidth: active ? 2.2 : 1.7,
                    }}/>
                    <span style={{
                      fontSize: "14px", fontWeight: active ? 700 : 500,
                      flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      letterSpacing: active ? "-0.01em" : "0",
                    }}>{item.label}</span>
                    {badge > 0 && (
                      <span style={{
                        background: "#EF4444", color: "#fff", borderRadius: "999px",
                        fontSize: "10px", fontWeight: 800, padding: "1px 6px", lineHeight: "16px", flexShrink: 0,
                      }}>{badge > 99 ? "99+" : badge}</span>
                    )}
                    {active && !badge && (
                      <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--theme-primary)", flexShrink: 0 }}/>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* ── Divider ── */}
            <div style={{
              height: "1px", margin: "4px 16px 0",
              background: isDarkMode ? "rgba(255,255,255,0.08)" : "#E2E8F0",
              flexShrink: 0,
            }}/>

            {/* ── Bottom section ── */}
            <div style={{ padding: "14px 14px 20px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
              {/* Fund Wallet — full width CTA */}
              <button
                onClick={() => { onOpenDeposit(); closeDrawer(); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  padding: "14px 20px", marginBottom: "8px",
                  borderRadius: "14px", border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-dark) 100%)",
                  color: "#fff", fontSize: "14px", fontWeight: 700,
                  letterSpacing: "-0.01em",
                  boxShadow: "0 4px 16px var(--theme-primary-glow)",
                }}
              >
                <PiggyBank style={{ width: "18px", height: "18px" }} />
                Fund Wallet
              </button>

              {/* Profile & Settings */}
              <button
                onClick={() => { navTo("profile"); closeDrawer(); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "14px",
                  padding: "12px 16px", borderRadius: "14px", border: "none", cursor: "pointer", textAlign: "left",
                  background: section === "profile" ? (isDarkMode ? "var(--theme-primary-bg)" : "var(--theme-primary-light)") : "transparent",
                  color: section === "profile" ? "var(--theme-primary)" : (isDarkMode ? "#94A3B8" : "#64748B"),
                }}
              >
                <Settings style={{
                  width: "20px", height: "20px", flexShrink: 0,
                  color: section === "profile" ? "var(--theme-primary)" : (isDarkMode ? "#64748B" : "#94A3B8"),
                  strokeWidth: section === "profile" ? 2.2 : 1.7,
                }}/>
                <span style={{ fontSize: "14px", fontWeight: section === "profile" ? 700 : 500, flex: 1 }}>
                  Profile & Settings
                </span>
              </button>

              {/* Logout */}
              <button
                onClick={onLogout}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "14px",
                  padding: "12px 16px", borderRadius: "14px", border: "none", cursor: "pointer", textAlign: "left",
                  background: "transparent",
                  color: isDarkMode ? "#f87171" : "#EF4444",
                }}
              >
                <LogOut style={{ width: "20px", height: "20px", flexShrink: 0, color: isDarkMode ? "#f87171" : "#EF4444", strokeWidth: 1.7 }}/>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main
        className="flex-1 min-w-0"
        style={{
          padding: "1rem",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)", // clears mobile nav
        }}
      >
        {/* Mobile header bar */}
        <div
          className="flex items-center gap-3 mb-4 md:hidden"
          style={{ marginTop: "0" }}
        >
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-xl p-2 cursor-pointer shrink-0"
            style={{
              background: isDarkMode ? "rgba(255,255,255,0.06)" : "#FFFFFF",
              border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
              color: "#64748B",
              minHeight: "auto",
              boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
            }}
          >
            <Menu className="h-4 w-4"/>
          </button>
          <span className="font-black text-sm flex-1 truncate" style={{ color: isDarkMode ? "#f1f5f9" : "#0F172A", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
            {section === "overview" ? "Dashboard" : SIDEBAR_ITEMS.find(i => i.id === section)?.label || "Dashboard"}
          </span>
          {unreadCount > 0 && section !== "notifications" && (
            <button
              onClick={() => navTo("notifications")}
              className="relative rounded-xl p-2 cursor-pointer shrink-0"
              style={{ background: isDarkMode ? "rgba(255,255,255,0.06)" : "#FFFFFF", border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0", color: "#64748B", minHeight: "auto" }}
            >
              <Bell className="h-4 w-4" style={{ color: "#2563EB" }}/>
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full text-[8px] font-black text-white px-1" style={{ background: "#EF4444" }}>{unreadCount > 99 ? "99+" : unreadCount}</span>
            </button>
          )}
        </div>

        {/* Desktop top padding */}
        <div className="hidden md:block" style={{ height: "0.5rem" }}/>

        {renderContent()}
      </main>
    </div>
  );
}
