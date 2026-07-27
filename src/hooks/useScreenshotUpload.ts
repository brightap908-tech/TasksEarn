/**
 * useScreenshotUpload
 * -------------------
 * Shared hook for the screenshot proof upload used in EarnerTaskSubmitPage
 * and EarnerRejectedTaskResubmitPage.
 *
 * Key guarantees:
 *  - Works on Android Chrome, Samsung Internet, iOS Safari, and desktop.
 *  - File input is reset after every attempt so the same file can be
 *    re-selected without tricks.
 *  - Canvas compression is attempted first; if it fails (e.g. security
 *    restrictions, canvas poisoning, empty output) the original file is read
 *    via FileReader and used as-is.
 *  - File type is validated by both MIME type AND extension because Samsung
 *    Internet and some Android WebViews sometimes return an empty MIME type
 *    for perfectly valid image files.
 *  - Detailed console logs for every stage so issues can be diagnosed from
 *    DevTools or Logcat.
 */

import React from "react";

// ── Constants ──────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_WIDTH = 1280;
const JPEG_QUALITY = 0.72;

const VALID_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/heic",
  "image/heif",
]);

const VALID_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "bmp",
  "heic",
  "heif",
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function getExtension(name: string): string {
  return (name.split(".").pop() ?? "").toLowerCase();
}

function isValidImage(file: File): { ok: true } | { ok: false; reason: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      ok: false,
      reason: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 10 MB.`,
    };
  }

  const mimeOk = file.type !== "" && VALID_MIME_TYPES.has(file.type);
  const extOk  = VALID_EXTENSIONS.has(getExtension(file.name));

  if (!mimeOk && !extOk) {
    const label = file.type ? `"${file.type}"` : `".${getExtension(file.name)}"`;
    return {
      ok: false,
      reason: `${label} is not a supported image type. Please upload a PNG, JPG, or JPEG file.`,
    };
  }

  return { ok: true };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function estimateBase64Bytes(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  const padding = (base64.match(/=+$/) ?? [""])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

/** Compress via Canvas → JPEG. Throws if canvas is unavailable or produces empty output. */
function canvasCompress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
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
          width = MAX_WIDTH;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2D context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const result = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        if (!result || result === "data:," || result.length < 200) {
          reject(new Error("Canvas produced empty or trivial output (possible tainted-canvas)"));
          return;
        }
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (e) => {
      cleanup();
      reject(new Error(`HTMLImageElement load error: ${String(e)}`));
    };

    // Setting src after registering handlers avoids a race on some browsers.
    img.src = objectUrl;
  });
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
    reader.onerror = () => reject(new Error(`FileReader error: ${reader.error?.message ?? "unknown"}`));
    reader.readAsDataURL(file);
  });
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseScreenshotUploadReturn {
  proofScreenshot: string;
  setProofScreenshot: React.Dispatch<React.SetStateAction<string>>;
  fileName: string;
  setFileName: React.Dispatch<React.SetStateAction<string>>;
  fileSize: string;
  setFileSize: React.Dispatch<React.SetStateAction<string>>;
  compressing: boolean;
  uploadError: string;
  setUploadError: React.Dispatch<React.SetStateAction<string>>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (file: File) => Promise<void>;
  clearScreenshot: () => void;
}

export function useScreenshotUpload(): UseScreenshotUploadReturn {
  const [proofScreenshot, setProofScreenshot] = React.useState("");
  const [fileName, setFileName]               = React.useState("");
  const [fileSize, setFileSize]               = React.useState("");
  const [compressing, setCompressing]         = React.useState(false);
  const [uploadError, setUploadError]         = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /** Always reset the native file input so the same path can be re-selected. */
  const resetInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
      "[Upload] File selected —",
      `name: "${file.name}"`,
      `type: "${file.type || "(empty)"}"`,
      `size: ${(file.size / 1024).toFixed(1)} KB`,
    );

    // ── Validate ────────────────────────────────────────────────────────────
    const check = isValidImage(file);
    if (!check.ok) {
      console.warn("[Upload] Validation failed:", check.reason);
      setUploadError(check.reason);
      resetInput();
      return;
    }

    // ── Start processing ────────────────────────────────────────────────────
    setFileName(file.name);
    setUploadError("");
    setCompressing(true);
    setProofScreenshot("");

    try {
      let dataUrl: string;
      let sizeLabel: string;

      // ── Attempt 1: canvas compression ──────────────────────────────────
      try {
        console.log("[Upload] Attempting canvas compression (max width:", MAX_WIDTH, ", quality:", JPEG_QUALITY, ")…");
        dataUrl = await canvasCompress(file);
        const bytes = estimateBase64Bytes(dataUrl);
        sizeLabel = `${formatBytes(bytes)} (compressed)`;
        console.log("[Upload] ✓ Canvas compression succeeded →", sizeLabel);
      } catch (compressErr) {
        // ── Attempt 2: FileReader fallback (original file) ───────────────
        console.warn("[Upload] Canvas compression failed, falling back to FileReader:", compressErr);
        try {
          dataUrl = await readAsDataUrl(file);
          const bytes = estimateBase64Bytes(dataUrl);
          sizeLabel = `${formatBytes(bytes)} (original)`;
          console.log("[Upload] ✓ FileReader fallback succeeded →", sizeLabel);
        } catch (readerErr) {
          console.error("[Upload] FileReader fallback also failed:", readerErr);
          throw readerErr; // propagate to outer catch
        }
      }

      setFileSize(sizeLabel);
      setProofScreenshot(dataUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Upload] All processing attempts failed:", err);
      setUploadError(
        `Could not read this image file (${msg}). Please try a different PNG, JPG, or JPEG file.`,
      );
    } finally {
      setCompressing(false);
      // Reset input AFTER processing so the same file can be selected again
      // (e.g. if the user removes the preview and wants to re-add the same image).
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
