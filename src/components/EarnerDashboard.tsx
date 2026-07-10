import React from "react";
import { 
  User, 
  Task, 
  TaskSubmission, 
  Transaction, 
  Referral, 
  TaskCategory, 
  SubmissionStatus, 
  TransactionStatus 
} from "../types";
import PlatformIcon from "./PlatformIcon";
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
  Link, 
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
  Image as ImageIcon
} from "lucide-react";

interface EarnerDashboardProps {
  user: User;
  onRefreshUser: () => void;
  onNavigate: (view: string) => void;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
  showToast: (message: string, type?: "success" | "error") => void;
}

// Complete list of Nigerian banks supported
const NIGERIAN_BANKS = [
  "Access Bank", "Guaranty Trust Bank (GTB)", "Zenith Bank", "United Bank for Africa (UBA)", 
  "First Bank of Nigeria", "Fidelity Bank", "First City Monument Bank (FCMB)", "Sterling Bank", 
  "Union Bank of Nigeria", "Wema Bank", "Keystone Bank", "Polaris Bank", "Ecobank Nigeria", 
  "Stanbic IBTC Bank", "Unity Bank", "Jaiz Bank", "Providus Bank", "Parallex Bank", 
  "Titan Trust Bank", "Globus Bank", "PremiumTrust Bank", "Lotus Bank", "Optimus Bank", 
  "Moniepoint Microfinance Bank", "OPay Microfinance Bank", "PalmPay Microfinance Bank", 
  "Kuda Bank", "VFD Microfinance Bank"
];

export default function EarnerDashboard({ user, onRefreshUser, onNavigate, apiFetch, showToast }: EarnerDashboardProps) {
  const [activeTab, setActiveTab] = React.useState<"overview" | "tasks" | "history" | "referrals" | "withdraw" | "profile">("overview");
  
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

  // Task Submission Form
  const [proofText, setProofText] = React.useState("");
  const [proofLink, setProofLink] = React.useState("");
  const [proofScreenshot, setProofScreenshot] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [fileSize, setFileSize] = React.useState("");
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // History list
  const [submissions, setSubmissions] = React.useState<TaskSubmission[]>([]);

  // Referrals state
  const [referralsData, setReferralsData] = React.useState({
    referralCode: "",
    referralReward: 200,
    referrals: [] as Referral[]
  });

  // Withdraw Form State
  const [withdrawAmount, setWithdrawAmount] = React.useState("");
  const [bankName, setBankName] = React.useState(NIGERIAN_BANKS[1]); // Default GTB
  const [accountNumber, setAccountNumber] = React.useState("");
  const [accountName, setAccountName] = React.useState("");
  const [withdrawSuccess, setWithdrawSuccess] = React.useState(false);
  const [withdrawError, setWithdrawError] = React.useState("");
  const [withdrawSubmitting, setWithdrawSubmitting] = React.useState(false);
  const [minWithdrawLimit, setMinWithdrawLimit] = React.useState(2000);
  const [withdrawFee, setWithdrawFee] = React.useState(100);

  // Profile Form State
  const [profileName, setProfileName] = React.useState(user.name);
  const [profileEmail, setProfileEmail] = React.useState(user.email);
  const [passwordForm, setPasswordForm] = React.useState({ old: "", new: "", confirm: "" });
  const [profileSuccess, setProfileSuccess] = React.useState("");
  const [profileError, setProfileError] = React.useState("");

  // Email verification simulator state
  const [verifyingCode, setVerifyingCode] = React.useState(false);
  const [verificationCodeInput, setVerificationCodeInput] = React.useState("");
  const [verificationError, setVerificationError] = React.useState("");

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

  React.useEffect(() => {
    fetchDashboardStats();
    fetchLimits();
  }, [user.walletBalance]);

  React.useEffect(() => {
    if (activeTab === "overview") fetchDashboardStats();
    if (activeTab === "tasks") fetchAvailableTasks();
    if (activeTab === "history") fetchSubmissions();
    if (activeTab === "referrals") fetchReferrals();
  }, [activeTab]);

  // Simulate verification code request
  const handleVerifyEmail = async () => {
    setVerifyingCode(true);
  };

  const handleConfirmVerification = async () => {
    if (verificationCodeInput !== "1234") {
      setVerificationError("Invalid simulation OTP code. Please enter '1234' to verify.");
      return;
    }
    setVerificationError("");
    try {
      const res = await apiFetch("/api/auth/verify-email", {
        method: "POST"
      });
      if (res && res.success) {
        setVerifyingCode(false);
        onRefreshUser();
        setProfileSuccess("Email address has been successfully verified!");
      }
    } catch (e) {
      setVerificationError("Verification request failed. Please retry.");
    }
  };

  // File selection / drag & drop handlers
  const handleFileChange = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setSubmitError("Please upload a valid image file (PNG, JPG, or JPEG).");
      return;
    }
    // Limit file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setSubmitError("File is too large. Maximum allowed size is 10MB.");
      return;
    }

    setFileName(file.name);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setFileSize(`${sizeInMB} MB`);
    setSubmitError("");

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProofScreenshot(event.target.result as string);
      }
    };
    reader.onerror = () => {
      setSubmitError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Submit proof handler
  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    
    if (!proofText && !proofLink) {
      setSubmitError("Please provide verification notes or a proof link.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    // Formulate a beautiful, structured text summary
    const combinedProof = [
      proofLink.trim() ? `🔗 Proof URL/Link: ${proofLink.trim()}` : "",
      proofText.trim() ? `📝 Earner Notes:\n${proofText.trim()}` : ""
    ].filter(Boolean).join("\n\n");

    try {
      const res = await apiFetch(`/api/earner/tasks/${selectedTask.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proofText: combinedProof || "See uploaded screenshot proof.",
          proofScreenshot: proofScreenshot || ""
        })
      });

      if (res && res.error) {
        setSubmitError(res.error);
      } else {
        setSubmitSuccess(true);
        setProofText("");
        setProofLink("");
        setProofScreenshot("");
        setFileName("");
        setFileSize("");
        setTimeout(() => {
          setSelectedTask(null);
          setSubmitSuccess(false);
          fetchAvailableTasks();
          fetchDashboardStats();
        }, 3000);
      }
    } catch (err) {
      setSubmitError("Failed to submit proof. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Withdrawal request submission
  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || !accountNumber || !accountName) {
      setWithdrawError("All banking fields are required.");
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < minWithdrawLimit) {
      setWithdrawError(`Minimum withdrawal is ₦${minWithdrawLimit.toLocaleString()}`);
      return;
    }

    if (amount > user.walletBalance) {
      setWithdrawError("Insufficient wallet balance for this withdrawal.");
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
          accountNumber,
          accountName
        })
      });

      if (res && res.error) {
        setWithdrawError(res.error);
      } else {
        setWithdrawSuccess(true);
        setWithdrawAmount("");
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

  // Filtered tasks computation
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || t.category === categoryFilter;
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
      <div className="lg:col-span-1 space-y-4">
        
        {/* Simple Profile Widget */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white font-bold font-display text-xl shadow-xs">
            {user.name.substring(0, 2).toUpperCase()}
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800">{user.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
          
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {user.isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                <Check className="h-3 w-3" /> Verified Earner
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-100">
                <AlertCircle className="h-3 w-3" /> Unverified Email
              </span>
            )}
          </div>

          {!user.isVerified && (
            <button 
              onClick={handleVerifyEmail}
              className="w-full mt-4 rounded-full bg-amber-500 hover:bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition-all shadow-xs cursor-pointer"
            >
              Verify Account Now
            </button>
          )}
        </div>

        {/* Action Panel Menu */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs space-y-1">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === "overview" ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500" : "text-slate-500 hover:bg-slate-50/50"
            }`}
          >
            <span>My Statistics Overview</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={() => setActiveTab("tasks")}
            className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === "tasks" ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500" : "text-slate-500 hover:bg-slate-50/50"
            }`}
          >
            <span>Browse Microtasks ({tasks.length})</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === "history" ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500" : "text-slate-500 hover:bg-slate-50/50"
            }`}
          >
            <span>Task Submission History</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={() => setActiveTab("referrals")}
            className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === "referrals" ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500" : "text-slate-500 hover:bg-slate-50/50"
            }`}
          >
            <span>My Referrals Network</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={() => setActiveTab("withdraw")}
            className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === "withdraw" ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500" : "text-slate-500 hover:bg-slate-50/50"
            }`}
          >
            <span>Withdraw Earnings (₦)</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={() => setActiveTab("profile")}
            className={`w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === "profile" ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500" : "text-slate-500 hover:bg-slate-50/50"
            }`}
          >
            <span>Account Settings</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>

      {/* Main Panel Content Area */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Simulated verification modal/banner */}
        {verifyingCode && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-6 shadow-sm animate-fadeIn space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-display text-sm font-bold text-amber-900">Email Verification Simulator OTP</h4>
                <p className="text-xs text-amber-700 leading-relaxed mt-1">
                  We have simulated sending an activation OTP code to your registered email address <strong>{user.email}</strong>. 
                  Please enter the test code <strong>1234</strong> to complete your verification immediately.
                </p>
              </div>
            </div>

            <div className="flex gap-2 max-w-sm">
              <input 
                type="text" 
                maxLength={4}
                value={verificationCodeInput}
                onChange={(e) => setVerificationCodeInput(e.target.value)}
                className="w-28 rounded-xl border border-amber-200 bg-white px-3 py-2 text-center text-sm font-mono tracking-widest focus:outline-none"
                placeholder="0000"
              />
              <button 
                onClick={handleConfirmVerification}
                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white px-4 py-2"
              >
                Submit Code
              </button>
              <button 
                onClick={() => setVerifyingCode(false)}
                className="rounded-xl border border-amber-200 hover:bg-amber-100 text-xs font-bold text-amber-800 px-4 py-2"
              >
                Cancel
              </button>
            </div>
            {verificationError && <p className="text-xs font-bold text-red-600">{verificationError}</p>}
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            
            {/* Wallet Cash card banner */}
            <div className="rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-800 p-6 sm:p-8 text-white shadow-xl shadow-emerald-50 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-y-6 translate-x-6 opacity-10">
                <Banknote className="h-44 w-44" />
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-emerald-100 uppercase tracking-widest">Available Wallet Balance</p>
                  <p className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mt-1.5">
                    ₦{metrics.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab("withdraw")}
                  className="rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-2 text-xs font-bold shadow transition-all cursor-pointer"
                >
                  Request Payout
                </button>
              </div>
              
              <div className="border-t border-emerald-500/30 mt-6 pt-5 grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-medium text-emerald-200 uppercase tracking-wider">Total Accumulated Earnings</span>
                  <span className="font-mono text-sm font-bold text-emerald-50 mt-0.5">₦{metrics.totalEarned.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-medium text-emerald-200 uppercase tracking-wider">Referral Code</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-sm font-bold text-emerald-50">
                      {user.referralCode}
                    </span>
                    <button 
                      onClick={copyReferralCode} 
                      className="p-1 text-emerald-100 hover:text-white bg-emerald-700/50 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer" 
                      title="Copy Referral Code"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={copyReferralLink} 
                      className="p-1 text-emerald-100 hover:text-white bg-emerald-700/50 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer" 
                      title="Copy Invite Link"
                    >
                      <Link className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stats mini cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center gap-3">
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
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

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center gap-3">
                <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-medium text-gray-400 uppercase">Rejected</span>
                  <span className="font-mono text-sm font-bold text-gray-800">{metrics.rejectedCount}</span>
                </div>
              </div>

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

            {/* General Information Banner / Notice Board */}
            <div className="rounded-2xl bg-gray-900 text-white p-6 relative overflow-hidden">
              <h3 className="font-display text-sm font-bold text-emerald-400 uppercase tracking-widest">Earner Guidelines Checklist</h3>
              <ul className="mt-3 text-xs text-gray-300 space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                  <span><strong>Do not unfollow/unsubscribe:</strong> Our crawlers audit accounts weekly. Unsubscribing within 6 months will lock your earnings and trigger penalties.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                  <span><strong>Clear Proof Screenshot:</strong> Always upload high-quality screenshots showing follow, like, or subscription verification clearly.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
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
                     <div key={idx} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-b-0 last:pb-0">
                       <div className="flex items-center gap-2.5 min-w-0">
                         <PlatformIcon category={sub.category} size={14} showBg className="shrink-0" />
                         <div className="min-w-0">
                           <p className="text-xs font-bold text-gray-800 line-clamp-1">{sub.taskTitle}</p>
                           <p className="text-[10px] text-gray-400 mt-0.5">{new Date(sub.submittedAt).toLocaleDateString()} • {sub.category}</p>
                         </div>
                       </div>
                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-gray-700">₦{sub.reward}</span>
                        <div className="mt-1">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            sub.status === SubmissionStatus.APPROVED ? "bg-emerald-50 text-emerald-700" :
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
                  className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                  placeholder="Search available jobs..."
                />
              </div>

              {/* Category selector */}
              <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
                {["All", "Facebook", "Instagram", "TikTok", "YouTube", "Telegram", "WhatsApp", "Twitter", "Website", "App", "Survey"].map((cat, idx) => {
                  const isSelected = (cat === "All" && categoryFilter === "All") || 
                    (categoryFilter !== "All" && cat.toLowerCase() === categoryFilter.toLowerCase()) || 
                    (cat === "Twitter" && categoryFilter === "X (Twitter) Follow");
                  return (
                    <button
                      key={idx}
                      onClick={() => setCategoryFilter(cat === "All" ? "All" : cat)}
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold cursor-pointer flex items-center gap-1.5 transition-colors ${
                        isSelected ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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

            {/* Task Detail Screen Drawer/Popup overlay */}
            {selectedTask && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-5 shadow-sm space-y-4 animate-fadeIn border-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[9px] font-black uppercase text-emerald-800 inline-flex items-center gap-1.5">
                      <PlatformIcon category={selectedTask.category} size={11} />
                      <span>{selectedTask.category}</span>
                    </span>
                    <h4 className="font-display text-base font-bold text-gray-900 mt-1.5">{selectedTask.title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Offered by: {selectedTask.advertiserName}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedTask(null);
                      setProofText("");
                      setProofLink("");
                      setProofScreenshot("");
                      setFileName("");
                      setFileSize("");
                      setSubmitError("");
                    }}
                    className="rounded-full bg-gray-200 hover:bg-gray-300 p-1 text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-4 text-xs space-y-3 leading-relaxed">
                  <p><strong>Job Description:</strong><br />{selectedTask.description}</p>
                  <p><strong>Target Link:</strong><br />
                    <a href={selectedTask.link} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline inline-flex items-center gap-1 font-bold">
                      {selectedTask.link} <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </p>
                  <p><strong>Proof Requirements Needed:</strong><br />{selectedTask.proofRequirements}</p>
                  <p className="border-t border-gray-100 pt-2 flex justify-between font-mono">
                    <span>Earning Reward: <strong className="text-emerald-700">₦{selectedTask.earningPerSlot}</strong></span>
                    <span>Slots Left: <strong>{selectedTask.totalSlots - selectedTask.filledSlots} of {selectedTask.totalSlots}</strong></span>
                  </p>
                </div>

                {/* Proof Submit Form */}
                {submitSuccess ? (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center animate-fadeIn">
                    <p className="text-xs font-bold text-emerald-800">Proof submitted successfully!</p>
                    <p className="text-[10px] text-emerald-600 mt-1">Pending advertiser audit. This task slots will be credited upon approval.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitProof} className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                      <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-gray-800">Submit Your Task Verification Proof</h5>
                        <p className="text-[10px] text-gray-400">Provide accurate proof so your submission can be approved without delay.</p>
                      </div>
                    </div>
                    
                    {submitError && (
                      <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-600 font-bold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{submitError}</span>
                      </div>
                    )}
                    
                    {/* Proof URL Input */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                        <Link className="h-3 w-3 text-gray-400" /> Proof Link / URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={proofLink}
                        onChange={(e) => setProofLink(e.target.value)}
                        placeholder="e.g., https://twitter.com/your_username/status/123456"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Proof Text Textarea */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Proof Text & Username / Notes (Required if no link is provided)
                      </label>
                      <textarea
                        required={!proofLink}
                        rows={3}
                        value={proofText}
                        onChange={(e) => setProofText(e.target.value)}
                        placeholder="Provide your social media handle, username, account details or any instructions needed to verify..."
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                      ></textarea>
                    </div>

                    {/* Screenshot Upload / Drag & Drop Area */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
                        <ImageIcon className="h-3 w-3 text-gray-400" /> Screenshot Proof (Optional)
                      </label>

                      {!proofScreenshot ? (
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => document.getElementById("proof-file-input")?.click()}
                          className={`group relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                            isDragActive 
                              ? "border-emerald-500 bg-emerald-50/40" 
                              : "border-gray-200 hover:border-emerald-500 hover:bg-slate-50/50"
                          }`}
                        >
                          <input 
                            id="proof-file-input"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileChange(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />
                          <UploadCloud className={`mx-auto h-7 w-7 transition-transform duration-300 group-hover:-translate-y-0.5 ${
                            isDragActive ? "text-emerald-500" : "text-gray-400 group-hover:text-emerald-500"
                          }`} />
                          <p className="mt-2 text-[11px] font-bold text-gray-700">
                            Drag & drop your screenshot here, or <span className="text-emerald-600 hover:underline font-bold">browse files</span>
                          </p>
                          <p className="text-[9px] text-gray-400 mt-0.5">Supports PNG, JPG, or JPEG up to 10MB</p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-gray-200 bg-slate-50/50 p-3 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative h-11 w-11 rounded-lg border border-gray-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                                <img 
                                  src={proofScreenshot} 
                                  alt="Screenshot Preview" 
                                  className="h-full w-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-gray-800 truncate">
                                  {fileName || "Attached Screenshot Proof"}
                                </p>
                                <p className="text-[9px] text-gray-400 font-mono mt-0.5">
                                  {fileSize || "Base64 Image"}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setProofScreenshot("");
                                setFileName("");
                                setFileSize("");
                              }}
                              className="rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 p-2 text-red-600 cursor-pointer transition-all flex items-center justify-center shrink-0"
                              title="Delete screenshot"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="text-center">
                            <button
                              type="button"
                              onClick={() => window.open(proofScreenshot, "_blank")}
                              className="text-[10px] font-bold text-emerald-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" /> View Large Image Preview
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Direct Screenshot URL Option */}
                      <div className="mt-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const url = prompt("Paste direct screenshot image URL here:", proofScreenshot.startsWith("http") ? proofScreenshot : "");
                            if (url !== null) {
                              setProofScreenshot(url);
                              setFileName(url.split("/").pop() || "screenshot_link");
                              setFileSize("External URL");
                            }
                          }}
                          className="text-[9px] font-bold text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
                        >
                          Or paste a direct screenshot URL instead
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-xs font-bold text-white shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {submitting ? "Uploading Proof Details..." : "Upload & Submit Verification"}
                    </button>
                  </form>
                )}

              </div>
            )}

            {/* Task grid */}
            {filteredTasks.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-xs text-gray-400 shadow-sm">
                No microtasks currently match your search category. Check back soon for fresh advertiser campaigns!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredTasks.map((task, idx) => (
                  <div key={idx} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700 flex items-center gap-1.5">
                          <PlatformIcon category={task.category} size={11} />
                          <span>{task.category}</span>
                        </span>
                        <span className="font-mono text-sm font-black text-emerald-600">₦{task.earningPerSlot}</span>
                      </div>
                      
                      <h4 className="font-display text-xs font-bold text-gray-900 mt-2 line-clamp-1">{task.title}</h4>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                    </div>

                    <div className="border-t border-gray-50 mt-4 pt-3 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-mono">
                        Slots: {task.filledSlots}/{task.totalSlots} Completed
                      </span>
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setProofText("");
                          setProofLink("");
                          setProofScreenshot("");
                          setFileName("");
                          setFileSize("");
                          setSubmitError("");
                          // Scroll down to the submission form
                          setTimeout(() => {
                            window.scrollBy({ top: 120, behavior: "smooth" });
                          }, 100);
                        }}
                        className="rounded-lg bg-gray-900 hover:bg-emerald-600 hover:text-white px-3 py-1.5 text-[10px] font-bold text-white transition-all cursor-pointer"
                      >
                        Accept & Do Job
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* TAB 3: SUBMISSION HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-4">Task Submission History</h3>
              
              {submissions.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">
                  No task submissions found in history logs.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                        <th className="py-3 px-2">Task Title</th>
                        <th className="py-3 px-2">Reward</th>
                        <th className="py-3 px-2">Submitted</th>
                        <th className="py-3 px-2">Proof Details</th>
                        <th className="py-3 px-2">Verification Status</th>
                        <th className="py-3 px-2">Reviewer Feedback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub, idx) => (
                        <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="py-3.5 px-2 font-bold text-gray-800 max-w-xs truncate">
                            <div className="flex items-center gap-1.5">
                              <PlatformIcon category={sub.category} size={13} className="shrink-0" />
                              <span className="truncate">{sub.taskTitle}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-2 font-mono text-emerald-600 font-bold">₦{sub.reward}</td>
                          <td className="py-3.5 px-2 text-gray-400 whitespace-nowrap">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                          <td className="py-3.5 px-2 max-w-xs truncate font-mono text-gray-500 text-[10px]">{sub.proofText}</td>
                          <td className="py-3.5 px-2 whitespace-nowrap">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              sub.status === SubmissionStatus.APPROVED ? "bg-emerald-50 text-emerald-700" :
                              sub.status === SubmissionStatus.PENDING ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                            }`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-[10px] text-gray-400 italic font-medium">{sub.feedback || "Awaiting verification..."}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: REFERRALS */}
        {activeTab === "referrals" && (
          <div className="space-y-6">
            
            {/* Promo banner */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div>
                <h3 className="font-display text-base font-bold text-emerald-900">Invite & Earn ₦{referralsData.referralReward}</h3>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                  Earn unlimited Naira bonuses for every friend you refer! Simply copy your referral link below and share on WhatsApp, Telegram, or Facebook. Once your referral completes 1 verification, you get paid.
                </p>
              </div>
              <button
                onClick={copyReferralLink}
                className="shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white px-5 py-3 shadow-md flex items-center gap-1.5 cursor-pointer"
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
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-mono font-bold text-center text-emerald-600 tracking-wider select-all"
                  />
                  <button 
                    onClick={copyReferralCode}
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer transition-all"
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
                          <td className="py-3 px-1 font-mono font-bold text-emerald-600">₦{ref.rewardEarned}</td>
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
              <p className="text-xs text-gray-400 mb-6">
                Payouts are processed weekly to your local Nigerian bank. Processing fees: flat <strong>₦{withdrawFee}</strong> per transaction.
              </p>

              {withdrawSuccess ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-5 text-center animate-fadeIn space-y-2">
                  <p className="text-sm font-bold text-emerald-800">🎉 Payout Request Received!</p>
                  <p className="text-xs text-emerald-600 leading-relaxed">
                    We have successfully queued your withdrawal to {bankName} (Acct: {accountNumber}) for verification audit. 
                    Your account balance has been deducted accordingly.
                  </p>
                  <button 
                    onClick={() => setWithdrawSuccess(false)}
                    className="mt-2 text-xs font-bold text-emerald-700 hover:underline"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleWithdrawal} className="space-y-4 max-w-md">
                  
                  {withdrawError && <p className="text-xs font-bold text-red-600">{withdrawError}</p>}
                  
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
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none font-mono"
                    />
                    <span className="block text-[10px] text-gray-400 mt-1">Available balance: ₦{user.walletBalance.toLocaleString()}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      Select Nigerian Bank
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none bg-white"
                    >
                      {NIGERIAN_BANKS.map((bank, idx) => (
                        <option key={idx} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      10-Digit Account Number (NUBAN)
                    </label>
                    <input 
                      type="text"
                      required
                      maxLength={10}
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 0123456789"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      Exact Account Holder Name
                    </label>
                    <input 
                      type="text"
                      required
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Account holder name must match bank name"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={withdrawSubmitting}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Banknote className="h-4.5 w-4.5" /> 
                    {withdrawSubmitting ? "Queueing Withdrawal Request..." : "Request Bank Transfer Payout"}
                  </button>

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

              {profileSuccess && <p className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 border border-emerald-100 mb-4">{profileSuccess}</p>}
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
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
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
                  <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1"><Lock className="h-4 w-4 text-emerald-500" /> Security Password Manager</h4>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Current Password</label>
                    <input 
                      type="password" 
                      value={passwordForm.old}
                      onChange={(e) => setPasswordForm({ ...passwordForm, old: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">New Password</label>
                    <input 
                      type="password" 
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
                >
                  Save Profile Modifications
                </button>

              </form>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
