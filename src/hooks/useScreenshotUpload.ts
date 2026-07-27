/**
 * useScreenshotUpload
 * -------------------
 * Shared hook for screenshot proof upload used in EarnerTaskSubmitPage
 * and EarnerRejectedTaskResubmitPage.
 *
 * Architecture (in order):
 *
 *  1. VALIDATE  — size + MIME + extension + magic-byte fallback.
 *  2. READ      — FileReader.readAsDataURL (onloadend, not onload).
 *                 If that throws NotReadableError (Google Photos / cloud files
 *                 not yet materialised), fall back to:
 *                 fetch(URL.createObjectURL(file)) → blob → FileReader.
 *                 Object URL is always revoked in a finally block.
 *  3. PREPARE   — The original image data URL is made available immediately.
 *                 Canvas recompression is intentionally not part of the
 *                 submit path: decoding/drawing a small screenshot can take
 *                 longer than sending it.
 *
 * Guarantees:
 *  - Revokes every object URL in a finally block.
 *  - Works on Android Chrome, Samsung Internet, Opera, Firefox, iOS Safari,
 *    Google Photos, Samsung Gallery, Files by Google, Mi File Manager.
 *  - Shows the exact error reason — never a generic catch-all message.
 *  - File input is always reset so the same file can be re-selected.
 */

import React from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE     = 10 * 1024 * 1024; // 10 MB
const VALID_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const VALID_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

// Magic-byte signatures for the four accepted formats.
// Used when the browser (Samsung Internet, Android WebView) returns type="".
const MAGIC_CHECKS: Array<{ label: string; test: (b: Uint8Array) => boolean }> = [
  {
    label: "JPEG",
    test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    label: "PNG",
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    label: "WEBP",
    // RIFF????WEBP
    test: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function ext(name: string): string {
  return (name.split(".").pop() ?? "").toLowerCase();
}

async function sniffMagicBytes(file: File): Promise<string | null> {
  try {
    const buf   = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buf);
    for (const { label, test } of MAGIC_CHECKS) {
      if (test(bytes)) return label;
    }
    return null;
  } catch {
    return null;
  }
}

async function validate(
  file: File,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (file.size > MAX_FILE_SIZE) {
    return {
      ok: false,
      reason: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`,
    };
  }

  const mimeOk = VALID_MIME_TYPES.has(file.type);
  const extOk  = VALID_EXTENSIONS.has(ext(file.name));

  if (!mimeOk && !extOk) {
    // Last resort — inspect raw bytes before rejecting.
    const magic = await sniffMagicBytes(file);
    if (!magic) {
      const label = file.type
        ? `"${file.type}"`
        : `".${ext(file.name) || "unknown"}"`;
      return {
        ok: false,
        reason: `${label} is not supported. Please upload a PNG, JPG, JPEG, or WEBP file.`,
      };
    }
    console.log(`[Upload] MIME/ext missing but magic bytes = "${magic}" — accepted.`);
  }

  return { ok: true };
}

function fmtBytes(n: number): string {
  return n < 1_048_576
    ? `${(n / 1024).toFixed(0)} KB`
    : `${(n / 1_048_576).toFixed(2)} MB`;
}

function base64Bytes(dataUrl: string): number {
  const b64     = dataUrl.split(",")[1] ?? "";
  const padding = (b64.match(/=+$/) ?? [""])[0].length;
  return Math.floor((b64.length * 3) / 4) - padding;
}

// ── Step 2: Read the file reliably ────────────────────────────────────────────

/**
 * Read a File/Blob as a base64 data URL using FileReader.
 *
 * Uses `onloadend` (not `onload`) so we wait until readyState === DONE before
 * inspecting the result — avoids the partial-read race seen on some Android
 * builds.
 */
function readerToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (reader.readyState !== FileReader.DONE) {
        reject(new Error("FileReader did not reach DONE state"));
        return;
      }
      if (reader.error) {
        reject(
          new Error(
            `FileReader error: ${reader.error.message || reader.error.name || "unknown"}`,
          ),
        );
        return;
      }
      const result = reader.result;
      if (typeof result === "string" && result.startsWith("data:") && result.length > 100) {
        resolve(result);
      } else {
        reject(
          new Error(
            `FileReader produced an invalid result (length=${
              typeof result === "string" ? result.length : typeof result
            })`,
          ),
        );
      }
    };

    reader.onerror = () => {
      reject(
        new Error(
          `FileReader error: ${reader.error?.message || reader.error?.name || "unknown"}`,
        ),
      );
    };

    reader.readAsDataURL(blob);
  });
}

/**
 * Materialise a cloud-backed file (Google Photos, iCloud, OneDrive) that
 * FileReader cannot read directly.  Creates an object URL, fetches the
 * content into a local Blob, then runs FileReader on that Blob.
 * The object URL is always revoked in a finally block.
 */
async function materializeViaFetch(file: File): Promise<string> {
  let objectUrl: string | null = null;
  try {
    objectUrl = URL.createObjectURL(file);
    console.log("[Upload] fetch-materialise: objectUrl created", objectUrl.slice(0, 60));
    const response = await fetch(objectUrl);
    if (!response.ok) {
      throw new Error(`fetch failed: HTTP ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    console.log(`[Upload] fetch-materialise: got blob size=${blob.size} type="${blob.type}"`);
    return await readerToDataUrl(blob);
  } finally {
    if (objectUrl) {
      try { URL.revokeObjectURL(objectUrl); } catch {}
    }
  }
}

/**
 * Read the file to a base64 data URL using the most reliable path available.
 *
 * Path A: FileReader directly on the File (works for all local files).
 * Path B: fetch(objectURL) → Blob → FileReader
 *         (needed for Google Photos / cloud files not yet downloaded).
 */
async function readFileToDataUrl(file: File): Promise<string> {
  // Path A — direct FileReader
  try {
    console.log("[Upload] Path A — FileReader.readAsDataURL …");
    const dataUrl = await readerToDataUrl(file);
    console.log(`[Upload] Path A succeeded (${fmtBytes(base64Bytes(dataUrl))})`);
    return dataUrl;
  } catch (errA) {
    const msgA = errA instanceof Error ? errA.message : String(errA);
    console.warn("[Upload] Path A failed:", msgA);
    console.log("[Upload] Path B — fetch materialise + FileReader …");

    // Path B — materialise then read
    try {
      const dataUrl = await materializeViaFetch(file);
      console.log(`[Upload] Path B succeeded (${fmtBytes(base64Bytes(dataUrl))})`);
      return dataUrl;
    } catch (errB) {
      const msgB = errB instanceof Error ? errB.message : String(errB);
      console.error("[Upload] Path B also failed:", msgB);
      // Surface both reasons so there is no ambiguity about what went wrong.
      throw new Error(`Direct read: ${msgA} | Fetch fallback: ${msgB}`);
    }
  }
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

  const resetInput = () => {
    // Resetting value lets the user pick the same file again without tricks.
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
    console.log("─────────────────────────────────────────────────────────");
    console.log("[Upload] File selected");
    console.log(`[Upload]   name    : ${file.name}`);
    console.log(`[Upload]   type    : "${file.type || "(empty)"}" — ext: ".${ext(file.name)}"`);
    console.log(`[Upload]   size    : ${fmtBytes(file.size)}`);
    console.log(`[Upload]   modified: ${new Date(file.lastModified).toISOString()}`);

    // ── 1. Validate ──────────────────────────────────────────────────────────
    const check = await validate(file);
    if (check.ok === false) {
      console.warn("[Upload] Validation failed:", check.reason);
      setUploadError(check.reason);
      resetInput();
      return;
    }
    console.log("[Upload] Validation passed ✓");

    setFileName(file.name);
    setUploadError("");
    setCompressing(true);
    setProofScreenshot("");

    try {
      // ── 2. Read file to data URL ──────────────────────────────────────────
      console.log("[Upload] Reading file …");
      const rawDataUrl   = await readFileToDataUrl(file);
      const rawBytes     = base64Bytes(rawDataUrl);
      console.log(`[Upload] File read OK — ${fmtBytes(rawBytes)} as base64`);
      console.log(`[Upload] Data URL prefix: "${rawDataUrl.slice(0, 60)}…"`);

      // ── 3. Make the original bytes available immediately ──────────────────
      // Re-encoding through canvas can block the browser event loop and offers
      // no benefit for the small proof images this endpoint accepts.
      const sizeLabel = `${fmtBytes(rawBytes)} (original)`;
      setFileSize(sizeLabel);
      setProofScreenshot(rawDataUrl);
      console.log("[Upload] Ready immediately ✓", sizeLabel);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Upload] Failed:", err);
      setUploadError(
        `Could not read this image. ${msg}. Please try a different PNG, JPG, JPEG, or WEBP file.`,
      );
    } finally {
      setCompressing(false);
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
