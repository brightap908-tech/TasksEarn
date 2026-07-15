import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  Check,
  X,
  ZoomIn,
  Clock,
  CheckCircle2,
  XCircle,
  User
} from "lucide-react";

interface AdvertiserSubmissionReviewPageProps {
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
  showToast: (message: string, type?: "success" | "error") => void;
}

export default function AdvertiserSubmissionReviewPage({ apiFetch, showToast }: AdvertiserSubmissionReviewPageProps) {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();

  const [submission, setSubmission] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  const [feedback, setFeedback] = React.useState("");
  const [reviewing, setReviewing] = React.useState(false);
  const [reviewed, setReviewed] = React.useState<"Approved" | "Rejected" | null>(null);

  React.useEffect(() => {
    window.scrollTo(0, 0);
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/api/advertiser/submissions/${submissionId}`);
        if (data && data.error) {
          setNotFound(true);
        } else if (data && data.id) {
          setSubmission(data);
          if (data.status !== "Pending") {
            setReviewed(data.status as "Approved" | "Rejected");
          }
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (submissionId) load();
  }, [submissionId]);

  const handleReview = async (status: "Approved" | "Rejected") => {
    if (!submission) return;
    setReviewing(true);
    try {
      const res = await apiFetch(`/api/advertiser/submissions/${submission.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, feedback })
      });
      if (res?.success) {
        showToast(
          status === "Approved"
            ? `Submission approved — ₦${submission.reward} credited to earner.`
            : "Submission rejected with feedback.",
          "success"
        );
        setReviewed(status);
        setTimeout(() => navigate("/advertiser/audit"), 1600);
      } else {
        showToast(res?.error || "Review action failed. Please try again.", "error");
      }
    } catch {
      showToast("Error submitting review. Please try again.", "error");
    } finally {
      setReviewing(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <p className="text-xs text-gray-400">Loading submission…</p>
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound || !submission) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="font-bold text-gray-900">Submission Not Found</h2>
          <p className="text-xs text-gray-400">This submission may have already been reviewed or doesn't belong to your campaigns.</p>
          <button
            onClick={() => navigate("/advertiser/audit")}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-5 py-2.5 text-xs font-bold hover:bg-blue-700 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Auditing Desk
          </button>
        </div>
      </div>
    );
  }

  // ── Already reviewed ──────────────────────────────────────────────────────
  if (reviewed) {
    const isApproved = reviewed === "Approved";
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center ${isApproved ? "bg-blue-100" : "bg-red-100"}`}>
            {isApproved
              ? <CheckCircle2 className="h-7 w-7 text-blue-600" />
              : <XCircle className="h-7 w-7 text-red-500" />
            }
          </div>
          <h2 className="font-bold text-gray-900">
            {isApproved ? "Submission Approved!" : "Submission Rejected"}
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            {isApproved
              ? `₦${submission.reward} has been credited to the earner's wallet.`
              : "The earner has been notified of the rejection."}
          </p>
          <p className="text-[10px] text-gray-400">Redirecting back to audit desk…</p>
          <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        </div>
      </div>
    );
  }

  // ── Main review page ──────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">

      {/* Back + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/advertiser/audit")}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Auditing Desk
        </button>
        <span className="text-xs text-gray-400">›</span>
        <span className="text-xs font-semibold text-gray-600 truncate">Review Submission</span>
      </div>

      {/* Header card */}
      <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-blue-700">
              <Clock className="h-2.5 w-2.5" /> Pending Review
            </span>
            <h1 className="font-bold text-gray-900 text-sm mt-1.5 leading-snug">{submission.taskTitle}</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Submitted by <strong className="text-gray-600">{submission.earnerName}</strong> on{" "}
              {new Date(submission.submittedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] text-gray-400">Earner Reward</p>
            <p className="font-mono text-lg font-black text-blue-600">₦{submission.reward}</p>
          </div>
        </div>
      </div>

      {/* Proof content grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Text proof + review controls */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Submitted Proof Text</h2>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 min-h-[80px]">
            <p className="text-xs font-mono text-gray-700 leading-relaxed whitespace-pre-wrap">
              {submission.proofText || <span className="text-gray-400 italic">No proof text provided.</span>}
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-500 uppercase">
              Feedback / Rejection Reason <span className="text-gray-400 normal-case font-normal">(optional for approval)</span>
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="e.g. Proof verified! / Username doesn't match task link."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => handleReview("Approved")}
              disabled={reviewing}
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Check className="h-3.5 w-3.5" />
              {reviewing ? "Processing…" : "Approve"}
            </button>
            <button
              onClick={() => handleReview("Rejected")}
              disabled={reviewing}
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 py-3 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <X className="h-3.5 w-3.5" />
              {reviewing ? "Processing…" : "Reject"}
            </button>
          </div>

          <p className="text-[9px] text-gray-400 leading-relaxed text-center">
            Approving credits ₦{submission.reward} to the earner's wallet immediately.
          </p>
        </div>

        {/* Screenshot proof */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Screenshot Proof</h2>
          {submission.proofScreenshot ? (
            <div className="space-y-2">
              <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                <img
                  src={submission.proofScreenshot}
                  alt="Submitted proof screenshot"
                  referrerPolicy="no-referrer"
                  className="w-full object-contain max-h-80"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <button
                onClick={() => window.open(submission.proofScreenshot, "_blank")}
                className="w-full rounded-xl border border-gray-100 hover:bg-gray-50 py-2 text-[10px] font-bold text-gray-600 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ZoomIn className="h-3.5 w-3.5" />
                Open Full Size
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
              <div className="text-center">
                <AlertCircle className="h-6 w-6 mx-auto mb-1 text-gray-300" />
                <p className="text-[10px]">No screenshot provided</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel link */}
      <div className="text-center">
        <button
          onClick={() => navigate("/advertiser/audit")}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Cancel and return to audit desk
        </button>
      </div>

    </div>
  );
}
