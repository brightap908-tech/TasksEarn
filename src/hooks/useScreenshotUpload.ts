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
 *  3. COMPRESS  — Optional, best-effort only.  The image element is loaded
 *                 from the data: URL already in memory (never from a blob:
 *                 URL), so this path is fully reliable on Android.  If canvas
 *                 is unavailable, produces empty output, or the compressed
 *                 result is larger than the original, the original is used
 *                 transparently.  The upload is NEVER blocked by compression.
 *
 * Guarantees:
 *  - Never calls canvas.drawImage before img.onload fires.
 *  - Revokes every object URL in a finally block.
 *  - Works on Android Chrome, Samsung Internet, Opera, Firefox, iOS Safari,
 *    Google Photos, Samsung Gallery, Files by Google, Mi File Manager.
 *  - Shows the exact error reason — never a generic catch-all message.
 *  - File input is always reset so the same file can be re-selected.
 */

import React from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE     = 10 * 1024 * 1024; // 10 MB
const MAX_WIDTH         = 1280;
const JPEG_QUALITY      = 0.72;
const COMPRESS_TIMEOUT  = 10_000; // ms – canvas img.onload safety net

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

// ── Step 3: Optional canvas compression (post-read) ───────────────────────────

/**
 * Attempt to compress a data URL by drawing it onto a canvas.
 *
 * The image element is loaded from the data: URL that is already in memory —
 * NOT from a blob: URL — so this path never touches the file system or
 * content:// URIs and is fully reliable on Android.
 *
 * Returns the compressed data URL, or null if compression fails for any
 * reason (canvas unavailable, timeout, tainted canvas, output larger than
 * input, etc.).  The caller always falls back to the original data URL.
 */
function compressDataUrl(
  dataUrl: string,
  originalBytes: number,
): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    const img = new window.Image();
    let settled = false;
    let timer: ReturnType<typeof setTimeout>;

    const finish = (result: string | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    // Safety net — some browsers never fire onload/onerror for large images.
    timer = setTimeout(() => {
      console.warn(`[Upload] Canvas compression timed out after ${COMPRESS_TIMEOUT}ms — using original.`);
      finish(null);
    }, COMPRESS_TIMEOUT);

    img.onload = () => {
      try {
        let { width, height } = img;
        if (width === 0 || height === 0) {
          console.warn("[Upload] Canvas: image decoded with zero dimensions.");
          finish(null);
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
          console.warn("[Upload] Canvas: 2D context unavailable.");
          finish(null);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        if (!compressed || compressed === "data:," || compressed.length < 100) {
          console.warn("[Upload] Canvas: produced empty output (tainted canvas?).");
          finish(null);
          return;
        }

        const compressedBytes = base64Bytes(compressed);
        if (compressedBytes >= originalBytes) {
          // Compressed is not actually smaller — skip it.
          console.log(
            `[Upload] Canvas: compressed (${fmtBytes(compressedBytes)}) ≥ original ` +
            `(${fmtBytes(originalBytes)}) — keeping original.`,
          );
          finish(null);
          return;
        }

        console.log(
          `[Upload] Canvas: ${fmtBytes(originalBytes)} → ${fmtBytes(compressedBytes)} ` +
          `(saved ${fmtBytes(originalBytes - compressedBytes)}).`,
        );
        finish(compressed);
      } catch (err) {
        console.warn("[Upload] Canvas: drawImage / toDataURL threw:", err);
        finish(null);
      }
    };

    img.onerror = (e) => {
      // This can only happen if the data: URL itself is malformed — should
      // never occur in practice since we just read it with FileReader.
      console.warn("[Upload] Canvas: img.onerror on data: URL:", e);
      finish(null);
    };

    // Load from the in-memory data: URL — never from a blob: URL.
    img.src = dataUrl;
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

      // ── 3. Optional compression (best-effort, never blocks upload) ────────
      console.log("[Upload] Attempting optional canvas compression …");
      const compressed = await compressDataUrl(rawDataUrl, rawBytes);

      let finalDataUrl: string;
      let sizeLabel:    string;

      if (compressed) {
        finalDataUrl = compressed;
        sizeLabel    = `${fmtBytes(base64Bytes(compressed))} (compressed)`;
        console.log("[Upload] Using compressed version →", sizeLabel);
      } else {
        finalDataUrl = rawDataUrl;
        sizeLabel    = `${fmtBytes(rawBytes)} (original)`;
        console.log("[Upload] Using original (compression skipped or not beneficial) →", sizeLabel);
      }

      setFileSize(sizeLabel);
      setProofScreenshot(finalDataUrl);
      console.log("[Upload] Done ✓");
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
