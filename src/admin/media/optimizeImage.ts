/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Client-Side Admin Image Auto-Optimizer for Core Web Vitals
 */

export interface OptimizeImageResult {
  file: File;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
  savedPercent: number;
  note?: string;
  isOriginalKept?: boolean;
}

export interface OptimizeImageOptions {
  isBanner?: boolean;
  maxSizeMB?: number;
}

/**
 * Creates a clean URL slug from filename
 */
function slugifyFileName(fileName: string): string {
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
  const cleanName = nameWithoutExt
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return cleanName || "image";
}

/**
 * Helper to decode file via <img> element as fallback for createImageBitmap
 */
function decodeImageViaElement(file: File): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }
      URL.revokeObjectURL(url);
      resolve({ canvas, width, height });
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err || new Error("Failed to decode image element"));
    };
    img.src = url;
  });
}

/**
 * Primary Client-Side Image Optimizer
 */
export async function optimizeImage(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<OptimizeImageResult> {
  const originalSize = file.size;
  const isBanner = options.isBanner || false;
  const maxInputMB = options.maxSizeMB || 50;

  if (originalSize > maxInputMB * 1024 * 1024) {
    throw new Error(
      `File "${file.name}" exceeds the maximum input size of ${maxInputMB} MB.`
    );
  }

  const fileNameLower = file.name.toLowerCase();
  const fileTypeLower = (file.type || "").toLowerCase();

  const isSvg = fileTypeLower.includes("svg") || fileNameLower.endsWith(".svg");
  const isGif = fileTypeLower.includes("gif") || fileNameLower.endsWith(".gif");
  const isHeic =
    fileTypeLower.includes("heic") ||
    fileTypeLower.includes("heif") ||
    fileNameLower.endsWith(".heic") ||
    fileNameLower.endsWith(".heif");

  // Keep originals for formats browser canvas cannot re-encode natively
  if (isSvg || isGif || isHeic) {
    return {
      file,
      originalSize,
      optimizedSize: originalSize,
      width: 0,
      height: 0,
      savedPercent: 0,
      isOriginalKept: true,
      note: "This format will be optimised by the CDN when displayed.",
    };
  }

  let sourceWidth = 0;
  let sourceHeight = 0;
  let canvas: HTMLCanvasElement;

  try {
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      sourceWidth = bitmap.width;
      sourceHeight = bitmap.height;

      canvas = document.createElement("canvas");
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
    } else {
      const decoded = await decodeImageViaElement(file);
      canvas = decoded.canvas;
      sourceWidth = decoded.width;
      sourceHeight = decoded.height;
    }
  } catch (e) {
    // If decoding fails, return original unchanged
    return {
      file,
      originalSize,
      optimizedSize: originalSize,
      width: sourceWidth,
      height: sourceHeight,
      savedPercent: 0,
      isOriginalKept: true,
      note: "This format will be optimised by the CDN when displayed.",
    };
  }

  // Calculate target long-edge dimension (1600px listing, 2400px banner)
  const maxLongEdge = isBanner ? 2400 : 1600;
  let targetWidth = sourceWidth;
  let targetHeight = sourceHeight;

  const longEdge = Math.max(sourceWidth, sourceHeight);
  if (longEdge > maxLongEdge) {
    const scale = maxLongEdge / longEdge;
    targetWidth = Math.round(sourceWidth * scale);
    targetHeight = Math.round(sourceHeight * scale);
  }

  // Draw onto target resized canvas if scaling required
  let outputCanvas = canvas;
  if (targetWidth !== sourceWidth || targetHeight !== sourceHeight) {
    outputCanvas = document.createElement("canvas");
    outputCanvas.width = targetWidth;
    outputCanvas.height = targetHeight;
    const ctx = outputCanvas.getContext("2d");
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
    }
  }

  // File size limit threshold (250 KB for listing, 400 KB for banner)
  const targetMaxBytes = (isBanner ? 400 : 250) * 1024;
  const qualities = [0.82, 0.72, 0.62, 0.52];

  let selectedBlob: Blob | null = null;
  let usedMime = "image/webp";
  let fallbackNote: string | undefined = undefined;

  for (const q of qualities) {
    const blob: Blob | null = await new Promise((res) =>
      outputCanvas.toBlob(res, "image/webp", q)
    );

    if (blob) {
      selectedBlob = blob;
      if (blob.size <= targetMaxBytes) break;
    }
  }

  // Fallback to JPEG if WebP blob generation is unsupported
  if (!selectedBlob || !selectedBlob.type.includes("webp")) {
    usedMime = "image/jpeg";
    fallbackNote = "WebP conversion fallback to JPEG.";
    for (const q of qualities) {
      const jpegBlob: Blob | null = await new Promise((res) =>
        outputCanvas.toBlob(res, "image/jpeg", q)
      );
      if (jpegBlob) {
        selectedBlob = jpegBlob;
        if (jpegBlob.size <= targetMaxBytes) break;
      }
    }
  }

  // If conversion yielded no blob or larger file, retain original
  if (!selectedBlob || selectedBlob.size >= originalSize) {
    return {
      file,
      originalSize,
      optimizedSize: originalSize,
      width: sourceWidth,
      height: sourceHeight,
      savedPercent: 0,
      isOriginalKept: true,
      note: "Original file retained for optimal fidelity.",
    };
  }

  const extension = usedMime.includes("webp") ? "webp" : "jpg";
  const newFileName = `${slugifyFileName(file.name)}.${extension}`;
  const optimizedFile = new File([selectedBlob], newFileName, { type: usedMime });

  const savedBytes = originalSize - selectedBlob.size;
  const savedPercent = Math.round((savedBytes / originalSize) * 100);

  return {
    file: optimizedFile,
    originalSize,
    optimizedSize: selectedBlob.size,
    width: targetWidth,
    height: targetHeight,
    savedPercent,
    note: fallbackNote,
  };
}

/**
 * Process multiple files in parallel with a concurrency cap of 2
 */
export async function optimizeImageBatch(
  files: File[],
  options: OptimizeImageOptions = {},
  onProgress?: (index: number, total: number, result: OptimizeImageResult) => void
): Promise<OptimizeImageResult[]> {
  const results: OptimizeImageResult[] = new Array(files.length);
  const concurrency = 2;
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < files.length) {
      const idx = currentIndex++;
      try {
        const res = await optimizeImage(files[idx], options);
        results[idx] = res;
        if (onProgress) onProgress(idx, files.length, res);
      } catch (err) {
        // Fallback to original file on error
        const orig = files[idx];
        const res: OptimizeImageResult = {
          file: orig,
          originalSize: orig.size,
          optimizedSize: orig.size,
          width: 0,
          height: 0,
          savedPercent: 0,
          isOriginalKept: true,
          note: (err as Error).message || "Error optimizing file.",
        };
        results[idx] = res;
        if (onProgress) onProgress(idx, files.length, res);
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, files.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
