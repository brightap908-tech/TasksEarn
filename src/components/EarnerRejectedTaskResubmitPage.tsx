import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  ImageIcon,
  Trash2,
  Eye,
  UploadCloud,
  Send,
  LoaderCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  SquareArrowOutUpRight,
  ArrowRight,
} from "lucide-react";
import { useScreenshotUpload } from "../hooks/useScreenshotUpload";

interface EarnerRejectedTaskResubmitPageProps {
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
  showToast: (message: string, type?: "success" | "error") => void;
}

export default function EarnerRejectedTaskResubmitPage({
  apiFetch,
  showToast,
}: EarnerRejectedTaskResubmitPageProps) {
  // Route uses :submissionId — more precise than :taskId and works even
  // when the task is paused/completed after the initial rejection.
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();

  // Submission + task data
  const [info, setInfo] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  // Form state
  const [proofText, setProofText] = React.useState("");
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const submittingRef = React.useRef(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  // Screenshot upload (hardened cross-browser hook)
  const {
    proofScreenshot,
    setProofScreenshot,
    stagedToken,
    fileName,
    setFileName,
    fileSize,
    setFileSize,
    compressing,
    uploading,
    uploadError,
    fileInputRef,
    handleFileChange,
    clearScreenshot,
  } = useScreenshotUpload(apiFetch);

  // Fetch resubmit info on mount
  React.useEffect(() => {
    window.scrollTo(0, 0);
    const fetchInfo = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const data = await apiFetch(
          `/api/earner/submissions/${submissionId}/resubmit-info`
        );
        if (!data || data.error) {
          setNotFound(true);
        } else {
          setInfo(data);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (submissionId) fetchInfo();
  }, [submissionId]);

  // Drag-and-drop handlers
  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragActive(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragActive(false); };
  const handleDrop      = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      console.log("[Upload] File dropped:", file.name);
      handleFileChange(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!info || submitting || submittingRef.current) return;
    if (!proofText && !proofScreenshot) {
      setSubmitError("Please provide verification notes or upload a screenshot.");
      return;
    }
    if (proofScreenshot && uploading) {
      setSubmitError("Please wait — screenshot is still uploading to the server.");
      return;
    }
    if (proofScreenshot && !stagedToken && !proofScreenshot.startsWith("http")) {
      setSubmitError("Screenshot upload failed. Please remove the image and re-upload it.");
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");

    const finalProofText = proofText.trim()
      ? `📝 Earner Notes (Resubmission):\n${proofText.trim()}`
      : "See uploaded screenshot proof.";

    try {
      const useToken  = !!stagedToken;
      const useInline = !stagedToken && proofScreenshot.startsWith("http");
      console.log(
        "[Resubmit] Sending proof —",
        `stagedToken: ${stagedToken || "(none)"}`,
        `inlineUrl: ${useInline ? proofScreenshot.slice(0, 60) : "(none)"}`,
        `proofText: ${finalProofText.length} chars`,
      );
      const body: Record<string, string> = { proofText: finalProofText };
      if (useToken)  body.stagedToken     = stagedToken;
      if (useInline) body.proofScreenshot = proofScreenshot;
      // Submit against the task endpoint — it already handles the Rejected → Pending
      // transition and does NOT require the task to be Active for resubmissions.
      const res = await apiFetch(`/api/earner/tasks/${info.taskId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res && res.error) {
        console.error("[Resubmit] Server returned error:", res.error);
        setSubmitError(res.error);
      } else {
        console.log("[Resubmit] ✓ Resubmission accepted by server");
        setSubmitSuccess(true);
         showToast("Resubmission sent!", "success");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Resubmit] Network or unexpected error:", err);
      setSubmitError(`Failed to submit. ${msg ? `Error: ${msg}` : "Please check your connection and try again."}`);
    } finally {
       submittingRef.current = false;
       setSubmitting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
          <p className="text-xs text-gray-400">Loading task details…</p>
        </div>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (notFound || !info) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="font-bold text-gray-900">Submission Not Found</h2>
          <p className="text-xs text-gray-400">
            This submission may no longer be in a rejected state — it may have already been resubmitted or approved.
          </p>
          <button
            onClick={() => navigate("/dashboard/my-tasks/rejected")}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-5 py-2.5 text-xs font-bold hover:bg-blue-700 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Rejected Tasks
          </button>
        </div>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (submitSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="font-bold text-gray-900">Resubmission Sent!</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Your corrected proof has been stored and sent for review. You can stay on this page or return to{" "}
            <strong>Rejected Tasks</strong>.
          </p>
          <button
            type="button"
            onClick={() => navigate("/dashboard/my-tasks/rejected")}
            className="inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-green-700 transition-colors"
          >
            View Rejected Tasks
          </button>
        </div>
      </div>
    );
  }

  // ── Main page ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">

      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard/my-tasks/rejected")}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Rejected Tasks
        </button>
        <span className="text-xs text-gray-400">›</span>
        <span className="text-xs font-semibold text-red-600 truncate flex items-center gap-1">
          <RefreshCw className="h-3 w-3" /> Fix &amp; Resubmit
        </span>
      </div>

      {/* Rejection banner */}
      <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="shrink-0 h-9 w-9 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-black text-red-900 uppercase tracking-wide mb-1">
              Why This Task Was Rejected
            </p>
            <p className="text-xs text-red-800 leading-relaxed">
              {info.rejectionReason ||
                "No specific reason provided. Please review the task requirements carefully and upload clearer proof."}
            </p>
          </div>
        </div>
      </div>

      {/* Task detail card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-800">
              {info.category}
            </span>
            <h1 className="font-bold text-gray-900 text-base mt-2 leading-snug">
              {info.taskTitle}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Campaign by: {info.advertiserName}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-2xl font-black text-blue-600">
              ₦{info.earningPerSlot?.toLocaleString?.() ?? info.earningPerSlot}
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs border-t border-gray-50 pt-4">
          <div>
            <p className="font-bold text-gray-500 uppercase text-[10px] mb-1">
              Task Instructions
            </p>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {info.description}
            </p>
          </div>
          {info.proofRequirements && (
            <div>
              <p className="font-bold text-gray-500 uppercase text-[10px] mb-1">
                Proof Requirements
              </p>
              <p className="text-gray-700 leading-relaxed">
                {info.proofRequirements}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Step 1 — Redo the task (only if there is a task link) */}
      {info.link && (
        <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="shrink-0 h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow">
              1
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-blue-900 uppercase tracking-wide mb-0.5">
                Redo the Task First
              </p>
              <p className="text-xs text-blue-700 leading-relaxed mb-4">
                Open the advertiser's page in a <strong>new tab</strong> and complete the action again (follow, like, join, subscribe, etc.) to make sure your new proof is correct. Then come back here for <strong>Step 2</strong>.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={info.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3 text-xs font-bold text-white shadow transition-all"
                >
                  <SquareArrowOutUpRight className="h-4 w-4" />
                  Open Task in New Tab
                </a>
                <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-100/60 text-[10px] font-bold text-blue-700">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  This page stays open — scroll down to upload new proof
                </div>
              </div>
              <p className="text-[10px] text-blue-500 mt-3 break-all">
                🔗 {info.link}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-blue-400">
            <div className="flex-1 border-t border-dashed border-blue-200" />
            <span className="flex items-center gap-1 shrink-0">
              After redoing the task, scroll down to Step 2
              <ArrowRight className="h-3 w-3" />
            </span>
            <div className="flex-1 border-t border-dashed border-blue-200" />
          </div>
        </div>
      )}

      {/* Step 2 (or Step 1 if no link) — Corrected proof form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5"
      >
        <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
          <div className="shrink-0 h-9 w-9 rounded-full bg-red-500 text-white flex items-center justify-center font-black text-sm shadow">
            {info.link ? "2" : <RefreshCw className="h-4 w-4" />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">
              Upload Corrected Proof
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Upload a new screenshot and/or update your notes to address the rejection reason above.
            </p>
          </div>
        </div>

        {/* Form-level errors (validation / API) */}
        {submitError && (
          <div className="rounded-xl bg-red-50 border border-red-100 p-3 flex items-center gap-2 text-xs font-bold text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {submitError}
          </div>
        )}

        {/* Proof text */}
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
            Verification Notes / Username
            <span className="ml-1 text-gray-400 normal-case font-normal">
              (required if no screenshot)
            </span>
          </label>
          <textarea
            rows={3}
            value={proofText}
            onChange={(e) => setProofText(e.target.value)}
            placeholder="Provide your social media handle, username, account details, or any info needed to verify…"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-red-400 focus:outline-none"
          />
        </div>

        {/* Screenshot upload */}
        <div>
          <div className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
            <ImageIcon className="h-3 w-3 text-gray-400" />
            New Screenshot Proof
            <span className="ml-1 text-gray-400 normal-case font-normal">
              (required if no notes)
            </span>
          </div>

          {compressing ? (
            /* ── Compressing spinner ─────────────────────────────────────── */
            <div className="rounded-xl border-2 border-dashed border-red-300 bg-red-50/40 p-6 text-center">
              <div className="mx-auto h-7 w-7 rounded-full border-2 border-red-400 border-t-transparent animate-spin mb-2" />
              <p className="text-[11px] font-bold text-red-600">Processing image…</p>
              <p className="text-[9px] text-gray-400 mt-0.5">Compressing for faster upload</p>
            </div>

          ) : !proofScreenshot ? (
            /* ── Drop zone / file picker ─────────────────────────────────── */
            <>
              {/* Upload error shown inline in the upload area */}
              {uploadError && (
                <div className="mb-2 rounded-xl bg-red-50 border border-red-100 p-3 flex items-center gap-2 text-xs font-bold text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {uploadError}
                </div>
              )}

              {/*
                Use <label htmlFor> so that clicking ANYWHERE inside the box
                opens the native file picker — including on iOS Safari and
                Android Chrome where programmatic .click() can be blocked.
              */}
              <label
                htmlFor="resubmit-file-input"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all select-none ${
                  isDragActive
                    ? "border-red-400 bg-red-50/40"
                    : "border-gray-200 hover:border-red-300 hover:bg-slate-50/50"
                }`}
              >
                {/*
                  Input is hidden via display:none — safe because the label
                  association (not a pointer event) is what opens the picker.
                  Value is reset via ref after every attempt so the same
                  file can be re-selected.
                */}
                <input
                  ref={fileInputRef}
                  id="resubmit-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileChange(file);
                  }}
                  className="hidden"
                />

                <UploadCloud
                  className={`h-7 w-7 transition-transform duration-300 group-hover:-translate-y-0.5 ${
                    isDragActive ? "text-red-500" : "text-gray-400 group-hover:text-red-400"
                  }`}
                />
                <p className="mt-2 text-[11px] font-bold text-gray-700">
                  Drag &amp; drop your new screenshot here
                </p>
                <p className="text-[11px] text-red-500 font-bold mt-0.5 underline underline-offset-2">
                  or tap here to Browse Files
                </p>
                <p className="text-[9px] text-gray-400 mt-1.5">
                  PNG, JPG, JPEG or WEBP · up to 10 MB · auto-compressed
                </p>
              </label>
            </>

          ) : (
            /* ── Preview card ────────────────────────────────────────────── */
            <div className={`rounded-xl border p-3 space-y-3 transition-colors ${uploading ? "border-red-200 bg-red-50/30" : "border-gray-200 bg-slate-50/50"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative h-11 w-11 rounded-lg border border-gray-200 bg-white overflow-hidden shrink-0">
                    <img
                      src={proofScreenshot}
                      alt="Screenshot Preview"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-900/40 rounded-lg">
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-800 truncate">
                      {fileName || "Attached Screenshot"}
                    </p>
                    {uploading ? (
                      <p className="text-[9px] text-red-500 font-bold mt-0.5 flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full border border-red-400 border-t-transparent animate-spin" />
                        Uploading to server…
                      </p>
                    ) : (
                      <p className="text-[9px] text-gray-400 font-mono mt-0.5">
                        {fileSize || "Image ready"}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearScreenshot}
                  disabled={uploading}
                  className="rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 p-2 text-red-600 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Remove screenshot"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {!uploading && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="text-[10px] font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Large Preview
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Paste URL fallback */}
          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={() => {
                const url = prompt(
                  "Paste a direct screenshot image URL:",
                  proofScreenshot.startsWith("http") ? proofScreenshot : ""
                );
                if (url !== null) {
                  setProofScreenshot(url);
                  setFileName(url.split("/").pop() || "screenshot_link");
                  setFileSize("External URL");
                }
              }}
              className="text-[9px] font-bold text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              Or paste a direct screenshot URL instead
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate("/dashboard/my-tasks/rejected")}
            className="flex-none rounded-xl border border-gray-200 px-5 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || compressing || uploading}
            className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 py-3 text-xs font-bold text-white shadow hover:shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {submitting ? "Submitting…" : uploading ? "Uploading screenshot…" : "Submit Corrected Proof"}
          </button>
        </div>
      </form>

      {previewOpen && proofScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Screenshot preview"
          onClick={() => setPreviewOpen(false)}
        >
          <div className="relative max-h-[90vh] max-w-4xl" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="absolute -right-2 -top-2 z-10 rounded-full bg-white px-3 py-1 text-lg font-bold text-gray-700 shadow"
              aria-label="Close screenshot preview"
            >
              ×
            </button>
            <img src={proofScreenshot} alt="Full screenshot preview" className="max-h-[88vh] max-w-full rounded-xl object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
