/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Client-Side Admin Video Optimizer & Transcoder
 */

import { captureVideoPoster } from "./captureVideoPoster";

export interface OptimizeVideoResult {
  file: File;
  originalSize: number;
  optimizedSize: number;
  posterUrl: string | null;
  savedPercent: number;
  note?: string;
  isOriginalKept?: boolean;
}

/**
 * Primary Client-Side Video Auto-Optimizer & Transcoder
 */
export async function optimizeVideo(
  videoFile: File,
  folderName: string = "/parasmoni/banners"
): Promise<OptimizeVideoResult> {
  const originalSize = videoFile.size;

  if (originalSize > 200 * 1024 * 1024) {
    throw new Error(`Video file exceeds maximum allowed limit of 200 MB.`);
  }

  // 1. Capture poster frame at 0.1s
  const posterUrl = await captureVideoPoster(videoFile, folderName);

  // Load video metadata to inspect resolution and duration
  let videoEl: HTMLVideoElement | null = null;
  let objectUrl: string | null = null;
  let duration = 0;
  let width = 0;
  let height = 0;

  try {
    objectUrl = URL.createObjectURL(videoFile);
    videoEl = document.createElement("video");
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.preload = "metadata";
    videoEl.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      if (!videoEl) return reject(new Error("Video element missing"));
      videoEl.onloadedmetadata = () => resolve();
      videoEl.onerror = () => reject(new Error("Browser cannot decode video file."));
    });

    duration = videoEl.duration || 0;
    width = videoEl.videoWidth || 0;
    height = videoEl.videoHeight || 0;
  } catch (err) {
    // If video metadata loading fails, return original video + captured poster
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    return {
      file: videoFile,
      originalSize,
      optimizedSize: originalSize,
      posterUrl,
      savedPercent: 0,
      isOriginalKept: true,
      note: "Original video file uploaded. CDN optimization will apply.",
    };
  }

  // Check 30s maximum duration limit
  if (duration > 30.5) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    throw new Error(
      "Banner videos must be 30 seconds or shorter. Please trim the video and upload it again."
    );
  }

  // Determine if browser re-encoding is needed (> 3MB, > 720p, or duration >= 15s)
  const needsEncoding = originalSize > 3 * 1024 * 1024 || Math.max(width, height) > 1280 || duration >= 15;

  if (!needsEncoding || typeof MediaRecorder === "undefined") {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    return {
      file: videoFile,
      originalSize,
      optimizedSize: originalSize,
      posterUrl,
      savedPercent: 0,
      isOriginalKept: true,
    };
  }

  // Pick best supported MIME type
  const mimeTypes = [
    "video/mp4;codecs=avc1.42E01E",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m));

  if (!selectedMime) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    return {
      file: videoFile,
      originalSize,
      optimizedSize: originalSize,
      posterUrl,
      savedPercent: 0,
      isOriginalKept: true,
      note: "Browser encoding type unsupported. Original video preserved.",
    };
  }

  // Calculate target canvas dimensions (max long edge 1280px, even integers)
  const maxLongEdge = 1280;
  let targetW = width;
  let targetH = height;
  const longEdge = Math.max(width, height);
  if (longEdge > maxLongEdge) {
    const scale = maxLongEdge / longEdge;
    targetW = Math.round(width * scale);
    targetH = Math.round(height * scale);
  }
  targetW = targetW % 2 === 0 ? targetW : targetW - 1;
  targetH = targetH % 2 === 0 ? targetH : targetH - 1;

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    return {
      file: videoFile,
      originalSize,
      optimizedSize: originalSize,
      posterUrl,
      savedPercent: 0,
      isOriginalKept: true,
    };
  }

  try {
    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: selectedMime,
      videoBitsPerSecond: 1200000,
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    videoEl.currentTime = 0;
    videoEl.playbackRate = 1.0;

    let animFrameId: number;
    let isDrawing = true;

    const drawFrame = () => {
      if (!isDrawing || !videoEl || !ctx) return;
      ctx.drawImage(videoEl, 0, 0, targetW, targetH);
      if ("requestVideoFrameCallback" in videoEl) {
        (videoEl as any).requestVideoFrameCallback(drawFrame);
      } else {
        animFrameId = requestAnimationFrame(drawFrame);
      }
    };

    const reencodePromise = new Promise<Blob>((resolve, reject) => {
      mediaRecorder.onstop = () => {
        isDrawing = false;
        if (animFrameId) cancelAnimationFrame(animFrameId);
        const compiledBlob = new Blob(chunks, { type: selectedMime.split(";")[0] });
        resolve(compiledBlob);
      };
      mediaRecorder.onerror = (e) => {
        isDrawing = false;
        if (animFrameId) cancelAnimationFrame(animFrameId);
        reject(e);
      };
    });

    mediaRecorder.start(100);
    drawFrame();
    await videoEl.play();

    await new Promise<void>((resolve) => {
      if (!videoEl) return resolve();
      videoEl.onended = () => resolve();
    });

    mediaRecorder.stop();
    const finalBlob = await reencodePromise;

    if (objectUrl) URL.revokeObjectURL(objectUrl);

    if (finalBlob.size >= originalSize) {
      return {
        file: videoFile,
        originalSize,
        optimizedSize: originalSize,
        posterUrl,
        savedPercent: 0,
        isOriginalKept: true,
      };
    }

    const ext = selectedMime.includes("mp4") ? "mp4" : "webm";
    const cleanSlug = videoFile.name.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const optimizedFile = new File([finalBlob], `${cleanSlug}.${ext}`, {
      type: selectedMime.split(";")[0],
    });

    const savedPercent = Math.round(((originalSize - finalBlob.size) / originalSize) * 100);

    return {
      file: optimizedFile,
      originalSize,
      optimizedSize: finalBlob.size,
      posterUrl,
      savedPercent,
    };
  } catch (e) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    return {
      file: videoFile,
      originalSize,
      optimizedSize: originalSize,
      posterUrl,
      savedPercent: 0,
      isOriginalKept: true,
      note: "Encoding interrupted. Original video preserved.",
    };
  }
}
