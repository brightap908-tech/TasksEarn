import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  ClipboardList,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface ApprovedSubmission {
  id: string;
  taskTitle: string;
  category: string;
  reward: number;
  approvedAt?: string;
  submittedAt: string;
  status: string;
}

interface Props {
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

export default function EarnerApprovedTasksPage({ apiFetch }: Props) {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = React.useState<ApprovedSubmission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    window.scrollTo(0, 0);
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch("/api/earner/submissions");
        if (Array.isArray(data)) {
          setSubmissions(data.filter((s: any) => s.status === "Approved"));
        } else {
          setError("Could not load approved tasks. Please try again.");
        }
      } catch {
        setError("Could not load approved tasks. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalEarned = submissions.reduce((sum, s) => sum + (s.reward || 0), 0);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-green-200 border-t-green-500" />
          <p className="text-xs text-gray-400">Loading approved tasks…</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard/my-tasks")}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          My Tasks
        </button>
        <span className="text-xs text-gray-400">›</span>
        <span className="text-xs font-semibold text-green-700">Approved Tasks</span>
      </div>

      {/* Header card */}
      <div className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="shrink-0 h-10 w-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-black text-green-900">Approved Tasks</h1>
            <p className="text-xs text-green-700 mt-0.5 leading-relaxed">
              {submissions.length === 0
                ? "No approved tasks yet. Complete tasks and earn rewards!"
                : `${submissions.length} task${submissions.length !== 1 ? "s" : ""} approved · Total earned: ₦${totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {submissions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center space-y-3">
          <ClipboardList className="mx-auto h-10 w-10 text-gray-300" />
          <h2 className="font-bold text-gray-800 text-sm">No approved tasks yet</h2>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            Once your submissions are reviewed and approved, they'll appear here.
          </p>
          <button
            onClick={() => navigate("/dashboard/tasks")}
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-all"
          >
            Browse Available Tasks
          </button>
        </div>
      )}

      {/* Submission cards */}
      {submissions.map((sub) => (
        <div
          key={sub.id}
          className="rounded-2xl border border-green-100 bg-white shadow-sm overflow-hidden"
        >
          <div className="p-5 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {/* Category + status badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                  {sub.category}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 border border-green-200 px-2.5 py-0.5 text-[10px] font-black text-green-700 uppercase tracking-wide">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Approved
                </span>
              </div>

              {/* Task title */}
              <h2 className="text-sm font-bold text-gray-900 leading-snug">{sub.taskTitle}</h2>

              {/* Dates */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-gray-400 font-medium">
                {sub.approvedAt && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    Approved: {formatDate(sub.approvedAt)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Submitted: {formatDate(sub.submittedAt)}
                </span>
              </div>
            </div>

            {/* Reward */}
            <div className="shrink-0 text-right">
              <p className="font-mono text-xl font-black text-green-600">
                +₦{(sub.reward || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">reward paid</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
