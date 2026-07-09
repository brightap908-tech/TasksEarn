import React from "react";
import { 
  User, 
  Task, 
  TaskSubmission, 
  Transaction, 
  TaskCategory, 
  TaskStatus, 
  SubmissionStatus,
  TransactionStatus,
  TransactionType,
  getPlatformForCategory
} from "../types";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Briefcase, 
  CheckSquare, 
  History, 
  Wallet, 
  DollarSign, 
  Play, 
  Pause, 
  Trash2, 
  Check, 
  X, 
  ArrowUpRight, 
  Info, 
  Layers, 
  ExternalLink,
  ChevronRight,
  ZoomIn
} from "lucide-react";

interface AdvertiserDashboardProps {
  user: User;
  onRefreshUser: () => void;
  onNavigate: (view: string) => void;
  onOpenDeposit: () => void;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
}

export default function AdvertiserDashboard({ user, onRefreshUser, onNavigate, onOpenDeposit, apiFetch }: AdvertiserDashboardProps) {
  const [activeTab, setActiveTab] = React.useState<"overview" | "create" | "manage" | "audit" | "transactions">("overview");

  // Dashboard Stats State
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

  // Campaigns & Submissions list
  const [campaigns, setCampaigns] = React.useState<Task[]>([]);
  const [submissions, setSubmissions] = React.useState<TaskSubmission[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [pricingList, setPricingList] = React.useState<any[]>([]);

  // Selected Submission for active auditing
  const [auditingSub, setAuditingSub] = React.useState<TaskSubmission | null>(null);
  const [auditFeedback, setAuditFeedback] = React.useState("");
  const [auditSubmitting, setAuditSubmitting] = React.useState(false);

  // New Campaign Form State
  const [campaignForm, setCampaignForm] = React.useState({
    title: "",
    description: "",
    category: TaskCategory.YT_SUBSCRIBE,
    link: "",
    proofRequirements: "",
    earningPerSlot: "15", // Default
    totalSlots: "100"
  });
  const [formError, setFormError] = React.useState("");
  const [formSuccess, setFormSuccess] = React.useState(false);
  const [formSubmitting, setFormSubmitting] = React.useState(false);

  // Auto Calculations
  const platform = getPlatformForCategory(campaignForm.category);
  const matchingPricing = pricingList.find(p => p.platform === platform);
  const earningVal = matchingPricing ? matchingPricing.earningPerSlot : (parseFloat(campaignForm.earningPerSlot) || 0);
  const slotsVal = parseInt(campaignForm.totalSlots) || 0;
  const costPerSlot = matchingPricing ? matchingPricing.costPerSlot : Math.ceil(earningVal * 1.35); // 35% commission markup
  const totalCost = costPerSlot * slotsVal;

  // Fetch stats & data
  const fetchStats = async () => {
    try {
      const data = await apiFetch("/api/advertiser/dashboard");
      if (data && !data.error) {
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const data = await apiFetch("/api/advertiser/tasks");
      if (Array.isArray(data)) {
        setCampaigns(data);
      }
    } catch (e) {}
  };

  const fetchSubmissions = async () => {
    try {
      const data = await apiFetch("/api/advertiser/submissions");
      if (Array.isArray(data)) {
        setSubmissions(data);
      }
    } catch (e) {}
  };

  const fetchTransactions = async () => {
    try {
      const data = await apiFetch("/api/user/transactions");
      if (Array.isArray(data)) {
        setTransactions(data);
      }
    } catch (e) {}
  };

  const fetchPricing = async () => {
    try {
      const data = await apiFetch("/api/pricing");
      if (Array.isArray(data)) {
        setPricingList(data);
      }
    } catch (e) {
      console.error(e);
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
    if (activeTab === "audit") fetchSubmissions();
    if (activeTab === "transactions") fetchTransactions();
  }, [activeTab]);

  // Campaign create handler
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.title || !campaignForm.description || !campaignForm.link || !campaignForm.proofRequirements) {
      setFormError("All campaign builder fields are required.");
      return;
    }

    if (totalCost > user.walletBalance) {
      setFormError(`Insufficient balance. This campaign costs ₦${totalCost.toLocaleString()}. Please fund your advertiser wallet.`);
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
          category: campaignForm.category,
          proofRequirements: campaignForm.proofRequirements,
          link: campaignForm.link,
          costPerSlot: costPerSlot,
          earningPerSlot: earningVal,
          totalSlots: campaignForm.totalSlots
        })
      });

      if (res && res.error) {
        setFormError(res.error);
      } else {
        setFormSuccess(true);
        setCampaignForm({
          title: "",
          description: "",
          category: TaskCategory.YT_SUBSCRIBE,
          link: "",
          proofRequirements: "",
          earningPerSlot: "15",
          totalSlots: "100"
        });
        onRefreshUser();
        setTimeout(() => {
          setFormSuccess(false);
          setActiveTab("manage");
        }, 3000);
      }
    } catch (e) {
      setFormError("Platform error. Failed to create advertiser campaign.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Campaign status Active/Paused
  const handleToggleStatus = async (taskId: string) => {
    try {
      const res = await apiFetch(`/api/advertiser/tasks/${taskId}/toggle`, {
        method: "POST"
      });
      if (res && res.success) {
        fetchCampaigns();
      }
    } catch (e) {}
  };

  // Delete Campaign with refund
  const handleDeleteCampaign = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this campaign? Unused slots will be immediately refunded back to your wallet!")) return;
    try {
      const res = await apiFetch(`/api/advertiser/tasks/${taskId}`, {
        method: "DELETE"
      });
      if (res && res.success) {
        onRefreshUser();
        fetchCampaigns();
        alert(`Campaign deleted! Refund of ₦${res.refundedAmount.toLocaleString()} credited to your wallet.`);
      }
    } catch (e) {}
  };

  // Audit review (Approve / Reject)
  const handleReviewSubmission = async (status: "Approved" | "Rejected") => {
    if (!auditingSub) return;
    setAuditSubmitting(true);

    try {
      const res = await apiFetch(`/api/advertiser/submissions/${auditingSub.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          feedback: auditFeedback
        })
      });

      if (res && res.success) {
        setAuditingSub(null);
        setAuditFeedback("");
        fetchSubmissions();
        fetchStats();
      } else {
        alert(res.error || "Review audit failed");
      }
    } catch (e) {
      alert("Error submitting review audit.");
    } finally {
      setAuditSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      {/* Sidebar Nav Panels */}
      <div className="lg:col-span-1 space-y-4">
        
        {/* Simple Wallet Widget */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white font-bold font-display text-xl shadow-xs">
            {user.name.substring(0, 2).toUpperCase()}
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-800">{user.name}</h3>
          <p className="text-[10px] text-emerald-600 font-semibold tracking-wider uppercase mt-1">Campaign Manager</p>

          <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">My Ad Wallet Balance</span>
            <span className="font-mono text-lg font-black text-slate-800">
              ₦{user.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <button 
            onClick={onOpenDeposit}
            className="w-full mt-4 rounded-full bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
          >
            💳 Fund Wallet (Naira)
          </button>
        </div>

        {/* Navigation buttons */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs space-y-1">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === "overview" ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500" : "text-slate-500 hover:bg-slate-50/50"
            }`}
          >
            <span className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4 text-slate-400" /> Overview & Stats</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={() => setActiveTab("create")}
            className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === "create" ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500" : "text-slate-500 hover:bg-slate-50/50"
            }`}
          >
            <span className="flex items-center gap-2"><PlusCircle className="h-4 w-4 text-slate-400" /> Build Ad Campaign</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={() => setActiveTab("manage")}
            className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === "manage" ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500" : "text-slate-500 hover:bg-slate-50/50"
            }`}
          >
            <span className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-slate-400" /> Manage Campaigns ({campaigns.length || stats.campaignsCount})</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={() => setActiveTab("audit")}
            className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === "audit" ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500" : "text-slate-500 hover:bg-slate-50/50"
            }`}
          >
            <span className="flex items-center gap-2"><CheckSquare className="h-4 w-4 text-slate-400" /> Auditing Desk ({stats.pendingSubmissionsCount})</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={() => setActiveTab("transactions")}
            className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === "transactions" ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500" : "text-slate-500 hover:bg-slate-50/50"
            }`}
          >
            <span className="flex items-center gap-2"><History className="h-4 w-4 text-slate-400" /> Ad Payment Records</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>

      {/* Main Panel Content Area */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Total Campaigns</span>
                <span className="block font-mono text-xl font-extrabold text-gray-800 mt-1">{stats.campaignsCount}</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Active Now</span>
                <span className="block font-mono text-xl font-extrabold text-emerald-600 mt-1">{stats.activeCount}</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Total Ad Spent</span>
                <span className="block font-mono text-xl font-extrabold text-indigo-600 mt-1">₦{stats.totalSpent.toLocaleString()}</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Pending Audits</span>
                <span className={`block font-mono text-xl font-extrabold mt-1 ${stats.pendingSubmissionsCount > 0 ? "text-amber-500 animate-pulse" : "text-gray-500"}`}>
                  {stats.pendingSubmissionsCount}
                </span>
              </div>
            </div>

            {/* Platform announcements / tips */}
            <div className="rounded-2xl bg-indigo-900 text-white p-6 relative overflow-hidden">
              <h3 className="font-display text-sm font-bold text-indigo-200 uppercase tracking-widest flex items-center gap-2">
                <Info className="h-4 w-4" /> Advertiser Payout Guidelines
              </h3>
              <p className="mt-2 text-xs text-indigo-100 leading-relaxed max-w-xl">
                Please audit incoming submission proofs within 48 hours. Submissions not reviewed within 72 hours will be automatically <strong>Approved and credited</strong> to earners by the system.
              </p>
            </div>

            {/* Recent Campaigns Overview */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">My Recent Ad Campaigns</h3>
              
              {stats.recentTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  You haven't built any advertising campaigns yet. Click "Build Ad Campaign" to target organic users!
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentTasks.map((task, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-b-0 last:pb-0">
                      <div>
                        <p className="text-xs font-bold text-gray-800 line-clamp-1">{task.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{task.category} • Cost per action: ₦{task.costPerSlot}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 font-mono">Slots: {task.filledSlots}/{task.totalSlots}</span>
                        <div className="mt-1">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                            task.status === TaskStatus.ACTIVE ? "bg-emerald-50 text-emerald-700" :
                            task.status === TaskStatus.PAUSED ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-700"
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

        {/* TAB 2: CREATE CAMPAIGN */}
        {activeTab === "create" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-2">Build New Social Media Campaign</h3>
              <p className="text-xs text-gray-400 mb-6">Create micro-engagement jobs targetting real Nigerian social media profiles.</p>

              {formSuccess ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-6 text-center animate-fadeIn space-y-2">
                  <p className="text-sm font-bold text-emerald-800">🎉 Campaign Launched Successfully!</p>
                  <p className="text-xs text-emerald-600">The total cost has been deducted from your wallet, and tasks are live on earners dashboards immediately.</p>
                </div>
              ) : (
                <form onSubmit={handleCreateCampaign} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {formError && <div className="md:col-span-2 text-xs font-bold text-red-600">{formError}</div>}
                  
                  {/* Left Column Inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Campaign Title</label>
                      <input 
                        type="text"
                        required
                        value={campaignForm.title}
                        onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                        placeholder="e.g. Subscribe to TechNaija YouTube Channel"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Social Task Category</label>
                      <select
                        value={campaignForm.category}
                        onChange={(e) => {
                          const cat = e.target.value as TaskCategory;
                          const platform = getPlatformForCategory(cat);
                          const matching = pricingList.find(p => p.platform === platform);
                          setCampaignForm({ 
                            ...campaignForm, 
                            category: cat,
                            earningPerSlot: matching ? matching.earningPerSlot.toString() : campaignForm.earningPerSlot
                          });
                        }}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none bg-white"
                      >
                        {Object.values(TaskCategory).map((cat, idx) => (
                          <option key={idx} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Target Account/Content Link</label>
                      <input 
                        type="url"
                        required
                        value={campaignForm.link}
                        onChange={(e) => setCampaignForm({ ...campaignForm, link: e.target.value })}
                        placeholder="https://youtube.com/c/technaija"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Instructions for Earner</label>
                      <textarea
                        required
                        rows={4}
                        value={campaignForm.description}
                        onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                        placeholder="Step 1: Click YouTube link above. Step 2: Click subscribe. Step 3: Do not unsubscribe or your account will be penalised..."
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                      ></textarea>
                    </div>
                  </div>

                  {/* Right Column Estimates & Costs */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Proof Verification Required</label>
                      <textarea
                        required
                        rows={3}
                        value={campaignForm.proofRequirements}
                        onChange={(e) => setCampaignForm({ ...campaignForm, proofRequirements: e.target.value })}
                        placeholder="Specify: your channel name and screenshot showing subscribed status clearly."
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          Earner Payout (₦) {matchingPricing && "(Fixed)"}
                        </label>
                        <input 
                          type="number"
                          required
                          min={5}
                          value={matchingPricing ? matchingPricing.earningPerSlot : campaignForm.earningPerSlot}
                          disabled={!!matchingPricing}
                          onChange={(e) => setCampaignForm({ ...campaignForm, earningPerSlot: e.target.value })}
                          className={`w-full rounded-xl border px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none font-mono ${
                            matchingPricing ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed" : "border-gray-200"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Target Actions Slots</label>
                        <input 
                          type="number"
                          required
                          min={10}
                          value={campaignForm.totalSlots}
                          onChange={(e) => setCampaignForm({ ...campaignForm, totalSlots: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Estimator Card */}
                    <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 space-y-3 font-mono text-xs text-indigo-900">
                      <div className="flex justify-between">
                        <span>Earner Payout per slot:</span>
                        <span>₦{earningVal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform Cost per slot (with ad tax):</span>
                        <span className="font-bold">₦{costPerSlot.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-indigo-200/50 pt-2 flex justify-between font-bold text-sm">
                        <span>Total Campaign Budget:</span>
                        <span className="text-indigo-700">₦{totalCost.toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] text-indigo-500 font-sans leading-relaxed pt-1">
                        *Wallet Balance after launch: <strong>₦{(user.walletBalance - totalCost).toLocaleString()}</strong>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 text-sm font-semibold text-white shadow hover:shadow-lg transition-all"
                    >
                      {formSubmitting ? "Deducting Budget & Loading Tasks..." : `Authorize & Launch Campaign (₦${totalCost.toLocaleString()})`}
                    </button>
                  </div>

                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MANAGE CAMPAIGNS */}
        {activeTab === "manage" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">My Campaigns List</h3>
              
              {campaigns.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">
                  You haven't launched any ad campaigns yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((task, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <span className="rounded bg-indigo-50 text-[9px] font-bold text-indigo-700 px-2 py-0.5 uppercase">
                          {task.category}
                        </span>
                        <h4 className="font-display text-xs font-bold text-gray-800 mt-2">{task.title}</h4>
                        <div className="flex items-center gap-4 text-[10px] text-gray-400 mt-1 font-mono">
                          <span>Cost/Slot: ₦{task.costPerSlot}</span>
                          <span>Earn/Slot: ₦{task.earningPerSlot}</span>
                          <span>Budget: ₦{(task.costPerSlot * task.totalSlots).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        
                        {/* Progress */}
                        <div className="text-right">
                          <span className="block text-[10px] text-gray-400">Progress:</span>
                          <span className="font-mono text-xs font-bold text-gray-800">
                            {task.filledSlots} / {task.totalSlots}
                          </span>
                        </div>

                        {/* Status badge */}
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          task.status === TaskStatus.ACTIVE ? "bg-emerald-50 text-emerald-700" :
                          task.status === TaskStatus.PAUSED ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-700"
                        }`}>
                          {task.status}
                        </span>

                        {/* Action buttons (Pause/Play, Delete) */}
                        {task.status !== TaskStatus.COMPLETED && (
                          <button
                            onClick={() => handleToggleStatus(task.id)}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
                            title={task.status === TaskStatus.ACTIVE ? "Pause Campaign" : "Resume Campaign"}
                          >
                            {task.status === TaskStatus.ACTIVE ? <Pause className="h-4 w-4 text-amber-500" /> : <Play className="h-4 w-4 text-emerald-500" />}
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteCampaign(task.id)}
                          className="p-1.5 rounded-lg border border-gray-200 hover:bg-red-50 text-red-600"
                          title="Delete & Refund Unused Slots"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AUDITING DESK */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            
            {/* Auditing Modal overlay */}
            {auditingSub && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/20 p-5 shadow-sm space-y-4 animate-fadeIn border-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[9px] font-bold text-indigo-800">
                      Verification Auditing Portal
                    </span>
                    <h4 className="font-display text-sm font-bold text-gray-900 mt-1.5">{auditingSub.taskTitle}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Submitted by Earner: <strong>{auditingSub.earnerName}</strong></p>
                  </div>
                  <button 
                    onClick={() => { setAuditingSub(null); setAuditFeedback(""); }}
                    className="rounded-full bg-gray-200 hover:bg-gray-300 p-1 text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column Text proofs */}
                  <div className="bg-white rounded-xl border border-gray-100 p-4 text-xs space-y-3.5">
                    <div>
                      <p className="text-gray-400 uppercase font-bold text-[9px]">Submitted Proof Text Details:</p>
                      <p className="font-mono bg-gray-50 rounded-lg p-3 text-gray-700 font-semibold mt-1">{auditingSub.proofText}</p>
                    </div>

                    <div>
                      <p className="text-gray-400 uppercase font-bold text-[9px]">Proof Actions Reward Payout:</p>
                      <p className="font-mono text-sm font-bold text-emerald-600 mt-0.5">₦{auditingSub.reward}</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">
                        Audit Review Feedback Comment (Optional for rejections)
                      </label>
                      <input 
                        type="text"
                        value={auditFeedback}
                        onChange={(e) => setAuditFeedback(e.target.value)}
                        placeholder="e.g. Follow was verified! / Unsubscribed detected."
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleReviewSubmission("Approved")}
                        disabled={auditSubmitting}
                        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-bold text-white shadow flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="h-4 w-4" /> Approve & Release Cash
                      </button>
                      <button
                        onClick={() => handleReviewSubmission("Rejected")}
                        disabled={auditSubmitting}
                        className="w-full rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-xs font-bold text-white shadow flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <X className="h-4 w-4" /> Reject Proof Slot
                      </button>
                    </div>
                  </div>

                  {/* Right Column Screenshot Proof */}
                  <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col justify-between">
                    <div>
                      <p className="text-gray-400 uppercase font-bold text-[9px] mb-2">Submitted Screenshot Proof Image:</p>
                      <div className="rounded-lg overflow-hidden border border-gray-100 h-44 relative bg-gray-50">
                        <img 
                          src={auditingSub.proofScreenshot} 
                          alt="Screenshot Proof" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-400 leading-relaxed mt-2 italic flex items-center gap-1">
                      <ZoomIn className="h-3 w-3 text-indigo-500" /> Use standard inspection to verify social profile names match handle.
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Submissions queue table */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">Pending Proof Audit Requests</h3>
              
              {submissions.filter(s => s.status === SubmissionStatus.PENDING).length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">
                  Excellent work! No pending earner proofs are awaiting your validation.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase text-[9px] font-bold">
                        <th className="py-2.5 px-1">Campaign Title</th>
                        <th className="py-2.5 px-1">Earner Name</th>
                        <th className="py-2.5 px-1">Submitted Date</th>
                        <th className="py-2.5 px-1">Verification Text</th>
                        <th className="py-2.5 px-1 text-right">Audit Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.filter(s => s.status === SubmissionStatus.PENDING).map((sub, idx) => (
                        <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-3 px-1 font-bold text-gray-800 max-w-xs truncate">{sub.taskTitle}</td>
                          <td className="py-3 px-1 text-gray-600">{sub.earnerName}</td>
                          <td className="py-3 px-1 text-gray-400">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                          <td className="py-3 px-1 font-mono text-gray-500 max-w-xs truncate">{sub.proofText}</td>
                          <td className="py-3 px-1 text-right">
                            <button
                              onClick={() => {
                                setAuditingSub(sub);
                                setTimeout(() => {
                                  window.scrollBy({ top: 120, behavior: "smooth" });
                                }, 100);
                              }}
                              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-[10px] font-bold text-white px-2.5 py-1"
                            >
                              Audit Proof
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Past Audited Submissions */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">Past Audited History Logs</h3>
              
              {submissions.filter(s => s.status !== SubmissionStatus.PENDING).length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  No historical audits are registered.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto">
                  {submissions.filter(s => s.status !== SubmissionStatus.PENDING).map((sub, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs border-b border-gray-50 pb-2">
                      <div>
                        <p className="font-bold text-gray-800 line-clamp-1">{sub.taskTitle}</p>
                        <p className="text-[10px] text-gray-400">Earner: {sub.earnerName} • Reviewed: {new Date(sub.submittedAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        sub.status === SubmissionStatus.APPROVED ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
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

        {/* TAB 5: ADVERTISER TRANSACTIONS */}
        {activeTab === "transactions" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">Wallet Transactions & Payment History</h3>
              
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">
                  No payment deposits or budget spendings registered in transaction logs.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase text-[9px] font-bold">
                        <th className="py-2.5 px-1">Description</th>
                        <th className="py-2.5 px-1">Transaction Ref</th>
                        <th className="py-2.5 px-1">Type</th>
                        <th className="py-2.5 px-1">Amount</th>
                        <th className="py-2.5 px-1">Date</th>
                        <th className="py-2.5 px-1">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, idx) => (
                        <tr key={idx} className="border-b border-gray-50">
                          <td className="py-3 px-1 font-bold text-gray-800">{tx.description}</td>
                          <td className="py-3 px-1 font-mono text-[10px] text-gray-400">{tx.reference}</td>
                          <td className="py-3 px-1 text-gray-500">{tx.type}</td>
                          <td className="py-3 px-1 font-mono font-bold text-gray-800">₦{tx.amount.toLocaleString()}</td>
                          <td className="py-3 px-1 text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-1">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              tx.status === TransactionStatus.SUCCESS || tx.status === TransactionStatus.APPROVED ? "bg-emerald-50 text-emerald-700" :
                              tx.status === TransactionStatus.PENDING ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
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

      </div>

    </div>
  );
}
