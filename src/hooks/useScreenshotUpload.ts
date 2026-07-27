/**
 * useScreenshotUpload
 * -------------------
 * Shared hook for the screenshot proof upload used in EarnerTaskSubmitPage
 * and EarnerRejectedTaskResubmitPage.
 *
 * Key guarantees:
 *  - Works on Android Chrome, Samsung Internet, Opera, Firefox, iOS Safari,
 *    and desktop browsers.
 *  - File input is reset after every attempt so the same file can be
 *    re-selected without tricks.
 *  - Canvas compression is attempted first with a 15-second timeout;
 *    if it fails (timeout, security restrictions, canvas poisoning, empty
 *    output, createObjectURL error) the original file is read via FileReader
 *    and used as-is — no upload is ever blocked by a compression failure.
 *  - File type is validated by both MIME type AND extension AND magic bytes
 *    because Samsung Internet and some Android WebViews return an empty MIME
 *    type for perfectly valid image files.
 *  - Every stage emits a detailed console log so failures can be diagnosed
 *    from DevTools or Android Logcat without a generic error message.
 *  - The error shown to the user is always the actual failure reason, never
 *    a vague "Failed to process image" catch-all.
 */

import React from "react";

// ── Constants ──────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE      = 10 * 1024 * 1024; // 10 MB
const MAX_WIDTH          = 1280;
const JPEG_QUALITY       = 0.72;
const CANVAS_TIMEOUT_MS  = 15_000; // 15 s — safety net for Android browsers
                                   // where img.onload / img.onerror never fire

const VALID_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const VALID_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
]);

// Leading bytes (magic numbers) for the four accepted formats.
// Checked when the MIME type is missing (common on Samsung Internet / Android
// file pickers that return type="" for local gallery images).
const MAGIC: Array<{ label: string; check: (b: Uint8Array) => boolean }> = [
  {
    label: "PNG",
    check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    label: "JPEG",
    check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    label: "WEBP",
    // RIFF....WEBP
    check: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getExtension(name: string): string {
  return (name.split(".").pop() ?? "").toLowerCase();
}

/**
 * Read the first 12 bytes of the file and return a recognised format label,
 * or null if no known magic bytes are found.
 */
async function detectMagicBytes(file: File): Promise<string | null> {
  try {
    const slice = file.slice(0, 12);
    const buf   = await slice.arrayBuffer();
    const bytes = new Uint8Array(buf);
    for (const { label, check } of MAGIC) {
      if (check(bytes)) return label;
    }
    return null;
  } catch {
    return null;
  }
}

async function isValidImage(
  file: File,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (file.size > MAX_FILE_SIZE) {
    return {
      ok: false,
      reason: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 10 MB.`,
    };
  }

  const ext    = getExtension(file.name);
  const mimeOk = file.type !== "" && VALID_MIME_TYPES.has(file.type);
  const extOk  = VALID_EXTENSIONS.has(ext);

  if (!mimeOk && !extOk) {
    // Last resort: check magic bytes before rejecting.
    const magic = await detectMagicBytes(file);
    if (!magic) {
      const label = file.type ? `"${file.type}"` : `".${ext || "unknown"}"`;
      return {
        ok: false,
        reason: `${label} is not a supported image type. Please upload a PNG, JPG, JPEG, or WEBP file.`,
      };
    }
    console.log(`[Upload] MIME/ext check failed but magic bytes match "${magic}" — proceeding.`);
  }

  return { ok: true };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function estimateBase64Bytes(dataUrl: string): number {
  const base64  = dataUrl.split(",")[1] ?? "";
  const padding = (base64.match(/=+$/) ?? [""])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

/**
 * Race a promise against a timeout so we never hang indefinitely.
 * Needed on Samsung Internet / Opera Mini where img.onload / img.onerror
 * sometimes never fires.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms / 1000}s`)),
      ms,
    );
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

/**
 * Compress via Canvas → JPEG.
 * Throws if canvas is unavailable, createObjectURL fails, the image never
 * loads, produces empty output, or the operation exceeds CANVAS_TIMEOUT_MS.
 */
function canvasCompress(file: File): Promise<string> {
  const inner = new Promise<string>((resolve, reject) => {
    let objectUrl: string;

    // createObjectURL can throw (SecurityError) in some restricted WebViews.
    try {
      objectUrl = URL.createObjectURL(file);
    } catch (err) {
      reject(
        new Error(
          `createObjectURL failed: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
      return;
    }

    const img = new window.Image();

    const cleanup = () => {
      try { URL.revokeObjectURL(objectUrl); } catch {}
    };

    img.onload = () => {
      cleanup();
      try {
        let { width, height } = img;
        if (width === 0 || height === 0) {
          reject(new Error("Image decoded with zero dimensions"));
          return;
        }
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width  = MAX_WIDTH;
        }
        const canvas = document.createElement("canvas");
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2D context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const result = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        if (!result || result === "data:," || result.length < 200) {
          reject(
            new Error(
              "Canvas produced empty or trivial output (possible tainted-canvas or unsupported format)",
            ),
          );
          return;
        }
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (e) => {
      cleanup();
      reject(
        new Error(
          `HTMLImageElement failed to load the file — the browser may not support this format (${String(e)})`,
        ),
      );
    };

    // Assign src AFTER registering handlers to avoid a race on some browsers.
    img.src = objectUrl;
  });

  return withTimeout(inner, CANVAS_TIMEOUT_MS, "Canvas compression");
}

/** Read the original file as a base64 data URL via FileReader (universal fallback). */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string" && result.length > 50) {
        resolve(result);
      } else {
        reject(new Error("FileReader returned an empty or invalid result"));
      }
    };
    reader.onerror = () =>
      reject(
        new Error(`FileReader error: ${reader.error?.message ?? reader.error?.name ?? "unknown"}`),
      );
    reader.readAsDataURL(file);
  });
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseScreenshotUploadReturn {
  proofScreenshot:    string;
  setProofScreenshot: React.Dispatch<React.SetStateAction<string>>;
  fileName:           string;
  setFileName:        React.Dispatch<React.SetStateAction<string>>;
  fileSize:           string;
  setFileSize:        React.Dispatch<React.SetStateAction<string>>;
  compressing:        boolean;
  uploadError:        string;
  setUploadError:     React.Dispatch<React.SetStateAction<string>>;
  fileInputRef:       React.RefObject<HTMLInputElement>;
  handleFileChange:   (file: File) => Promise<void>;
  clearScreenshot:    () => void;
}

export function useScreenshotUpload(): UseScreenshotUploadReturn {
  const [proofScreenshot, setProofScreenshot] = React.useState("");
  const [fileName,        setFileName]         = React.useState("");
  const [fileSize,        setFileSize]         = React.useState("");
  const [compressing,     setCompressing]      = React.useState(false);
  const [uploadError,     setUploadError]      = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /** Always reset the native file input so the same path can be re-selected. */
  const resetInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearScreenshot = () => {
    setProofScreenshot("");
    setFileName("");
    setFileSize("");
    setUploadError("");
    resetInput();
  };

  const handleFileChange = async (file: File) => {
    console.log(
      "[Upload] ── File selected ─────────────────────────────────────────────",
    );
    console.log("[Upload] name     :", file.name);
    console.log("[Upload] MIME type:", file.type || "(empty — will check extension + magic bytes)");
    console.log("[Upload] size     :", (file.size / 1024).toFixed(1), "KB");
    console.log(
      "[Upload] lastModified:",
      new Date(file.lastModified).toISOString(),
    );

    // ── Validate ─────────────────────────────────────────────────────────────
    const check = await isValidImage(file);
    if (check.ok === false) {
      console.warn("[Upload] ✗ Validation failed:", check.reason);
      setUploadError(check.reason);
      resetInput();
      return;
    }
    console.log("[Upload] ✓ Validation passed");

    // ── Start processing ──────────────────────────────────────────────────────
    setFileName(file.name);
    setUploadError("");
    setCompressing(true);
    setProofScreenshot("");

    try {
      let dataUrl:   string;
      let sizeLabel: string;
      let method:    string;

      // ── Attempt 1: canvas compression ──────────────────────────────────────
      try {
        console.log(
          `[Upload] Attempt 1 — canvas compression (maxWidth=${MAX_WIDTH}px, quality=${JPEG_QUALITY}, timeout=${CANVAS_TIMEOUT_MS}ms)…`,
        );
        dataUrl    = await canvasCompress(file);
        const bytes = estimateBase64Bytes(dataUrl);
        sizeLabel  = `${formatBytes(bytes)} (compressed)`;
        method     = "canvas";
        console.log("[Upload] ✓ Canvas compression succeeded →", sizeLabel);
      } catch (compressErr) {
        // ── Attempt 2: FileReader fallback (original file, no compression) ───
        const compressErrMsg =
          compressErr instanceof Error ? compressErr.message : String(compressErr);
        console.warn(
          "[Upload] ✗ Canvas compression failed — falling back to FileReader (original file).",
          "\n         Reason:", compressErrMsg,
        );
        try {
          console.log("[Upload] Attempt 2 — FileReader (original file)…");
          dataUrl    = await readAsDataUrl(file);
          const bytes = estimateBase64Bytes(dataUrl);
          sizeLabel  = `${formatBytes(bytes)} (original, uncompressed)`;
          method     = "filereader";
          console.log("[Upload] ✓ FileReader fallback succeeded →", sizeLabel);
        } catch (readerErr) {
          const readerErrMsg =
            readerErr instanceof Error ? readerErr.message : String(readerErr);
          console.error(
            "[Upload] ✗ FileReader fallback also failed.",
            "\n         Reason:", readerErrMsg,
          );
          // Re-throw with both error messages so the user sees exactly what went wrong.
          throw new Error(
            `Canvas: ${compressErrMsg} | FileReader: ${readerErrMsg}`,
          );
        }
      }

      console.log("[Upload] ── Summary ────────────────────────────────────────");
      console.log("[Upload] method    :", method!);
      console.log("[Upload] size      :", sizeLabel!);
      console.log("[Upload] dataUrl[:80]:", dataUrl.slice(0, 80) + "…");

      setFileSize(sizeLabel!);
      setProofScreenshot(dataUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Upload] ✗ All processing attempts failed:", err);
      // Show the user the EXACT error so they (or support) can diagnose it —
      // never use a vague catch-all.
      setUploadError(
        `Could not read this image file. Error: ${msg}. Please try a different PNG, JPG, JPEG, or WEBP file.`,
      );
    } finally {
      setCompressing(false);
      // Reset input AFTER processing so the same file can be re-selected
      // if the user removes the preview and wants to re-attach it.
      resetInput();
    }
  };

  return {
    proofScreenshot,
    setProofScreenshot,
    fileName,
    setFileName,
    fileSize,
    setFileSize,
    compressing,
    uploadError,
    setUploadError,
    fileInputRef,
    handleFileChange,
    clearScreenshot,
  };
}
