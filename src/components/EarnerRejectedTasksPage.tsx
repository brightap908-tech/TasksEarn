import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  XCircle,
  RefreshCw,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
} from "lucide-react";

interface RejectedSubmission {
  submissionId: string;
  taskId: string;
  taskTitle: string;
  category: string;
  reward: number;
  rejectionReason: string;
  rejectedAt: string;
  submittedAt: string;
  status: string;
  taskDescription: string;
  proofRequirements: string;
}

interface EarnerRejectedTasksPageProps {
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
  showToast: (message: string, type?: "success" | "error") => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function EarnerRejectedTasksPage({
  apiFetch,
}: EarnerRejectedTasksPageProps) {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = React.useState<RejectedSubmission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    window.scrollTo(0, 0);
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch("/api/earner/rejected-submissions");
        if (Array.isArray(data)) {
          setSubmissions(data);
        } else {
          setError("Could not load rejected tasks. Please try again.");
        }
      } catch {
        setError("Could not load rejected tasks. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
          <p className="text-xs text-gray-400">Loading rejected tasks…</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="font-bold text-gray-900">Something went wrong</h2>
          <p className="text-xs text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-5 py-2.5 text-xs font-bold hover:bg-blue-700 transition-all"
          >
            <RefreshCw className="h-4 w-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Main page ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">

      {/* Header row */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/earner/overview")}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </button>
        <span className="text-xs text-gray-400">›</span>
        <span className="text-xs font-semibold text-gray-700">Rejected Tasks</span>
      </div>

      {/* Page heading */}
      <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-rose-50 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="shrink-0 h-10 w-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
            <XCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-red-900">Rejected Tasks</h1>
            <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
              {submissions.length === 0
                ? "No rejected tasks — great work! All your submissions have passed review."
                : `${submissions.length} task${submissions.length !== 1 ? "s" : ""} rejected. Review the feedback below and click Fix & Resubmit to correct and resubmit each one.`}
            </p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {submissions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center space-y-3">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-400" />
          <h2 className="font-bold text-gray-800 text-sm">All clear!</h2>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            You have no rejected tasks right now. Keep completing tasks and submitting great proof!
          </p>
          <button
            onClick={() => navigate("/earner/tasks")}
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-all"
          >
            Browse Available Tasks <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Rejected task cards */}
      {submissions.map((sub) => (
        <div
          key={sub.submissionId}
          className="rounded-2xl border border-red-100 bg-white shadow-sm overflow-hidden"
        >
          {/* Card header */}
          <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-50">
            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold text-red-700 mb-2">
                {sub.category}
              </span>
              <h2 className="text-sm font-bold text-gray-900 leading-snug">{sub.taskTitle}</h2>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Rejected: {formatDate(sub.rejectedAt)}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-xl font-black text-blue-600">₦{sub.reward?.toLocaleString?.() ?? sub.reward}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">reward</p>
            </div>
          </div>

          {/* Rejection reason */}
          <div className="p-5 border-b border-gray-50 bg-red-50/40">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-red-700 uppercase tracking-wide mb-1">
                  Rejection Reason
                </p>
                <p className="text-xs text-red-800 leading-relaxed">
                  {sub.rejectionReason || "No specific reason provided. Please review the task requirements and resubmit with clearer proof."}
                </p>
              </div>
            </div>
          </div>

          {/* Task instructions */}
          <div className="p-5 border-b border-gray-50 space-y-3">
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <ClipboardList className="h-3 w-3" />
                Task Instructions
              </p>
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                {sub.taskDescription}
              </p>
            </div>
            {sub.proofRequirements && (
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wide mb-1.5">
                  Proof Requirements
                </p>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {sub.proofRequirements}
                </p>
              </div>
            )}
          </div>

          {/* Fix & Resubmit button */}
          <div className="p-5">
            <button
              onClick={() =>
                navigate(`/earner/rejected-tasks/${sub.submissionId}/resubmit`)
              }
              className="w-full rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 px-6 py-3.5 text-sm font-black text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Fix &amp; Resubmit
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-2">
              Clicking this will open a new page where you can upload corrected proof.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
