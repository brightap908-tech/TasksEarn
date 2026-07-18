import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Calendar,
  ClipboardList,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface PendingSubmission {
  id: string;
  taskTitle: string;
  category: string;
  reward: number;
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

export default function EarnerPendingTasksPage({ apiFetch, showToast }: Props) {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = React.useState<PendingSubmission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    window.scrollTo(0, 0);
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch("/api/earner/submissions");
        if (Array.isArray(data)) {
          setSubmissions(data.filter((s: any) => s.status === "Pending"));
        } else {
          setError("Could not load pending tasks. Please try again.");
        }
      } catch {
        setError("Could not load pending tasks. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/earner/submissions/${confirmDeleteId}`, { method: "DELETE" });
      if (res?.error) {
        showToast(res.error, "error");
      } else {
        setSubmissions(prev => prev.filter(s => s.id !== confirmDeleteId));
        showToast("Submission deleted.", "success");
      }
    } catch {
      showToast("Failed to delete. Please try again.", "error");
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-amber-200 border-t-amber-500" />
          <p className="text-xs text-gray-400">Loading pending tasks…</p>
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
      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-red-100 overflow-hidden">
            <div className="bg-red-50 px-6 py-5 border-b border-red-100 flex items-start gap-3">
              <div className="shrink-0 h-9 w-9 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-red-900">Delete Submission?</h3>
                <p className="text-xs text-red-700 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                Are you sure you want to delete this pending submission? It will be permanently removed.
              </p>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-xs font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleting ? (
                  <><div className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Deleting…</>
                ) : (
                  <><Trash2 className="h-3.5 w-3.5" /> Yes, Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
        <span className="text-xs font-semibold text-amber-700">Pending Tasks</span>
      </div>

      {/* Header card */}
      <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="shrink-0 h-10 w-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-black text-amber-900">Pending Tasks</h1>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              {submissions.length === 0
                ? "No pending tasks. Your submissions are all reviewed!"
                : `${submissions.length} submission${submissions.length !== 1 ? "s" : ""} awaiting admin review.`}
            </p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {submissions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center space-y-3">
          <ClipboardList className="mx-auto h-10 w-10 text-gray-300" />
          <h2 className="font-bold text-gray-800 text-sm">No pending submissions</h2>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            Complete and submit tasks — they'll appear here while awaiting review.
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
          className="rounded-2xl border border-amber-100 bg-white shadow-sm overflow-hidden"
        >
          <div className="p-5 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {/* Category + status badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                  {sub.category}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[10px] font-black text-amber-700 uppercase tracking-wide">
                  <Clock className="h-2.5 w-2.5" /> Pending
                </span>
              </div>

              {/* Task title */}
              <h2 className="text-sm font-bold text-gray-900 leading-snug">{sub.taskTitle}</h2>

              {/* Date */}
              <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Submitted: {formatDate(sub.submittedAt)}
                </span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-3">
              {/* Reward */}
              <div className="text-right">
                <p className="font-mono text-xl font-black text-blue-600">
                  ₦{(sub.reward || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">reward</p>
              </div>
              {/* Delete */}
              <button
                onClick={() => setConfirmDeleteId(sub.id)}
                className="rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 p-2 text-red-500 cursor-pointer transition-all"
                title="Delete submission"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
