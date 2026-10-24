/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Video Poster Frame Capture Utility for Admin Uploads
 */

import { uploadToImageKit } from "../../imagekit/upload";
import { IMAGEKIT_FOLDERS } from "../../imagekit/client";

/**
 * Captures a poster frame at 0.1s from a video file and uploads it to ImageKit
 */
export async function captureVideoPoster(
  videoFile: File,
  folder: string = IMAGEKIT_FOLDERS.banners
): Promise<string | null> {
  let videoEl: HTMLVideoElement | null = null;
  let objectUrl: string | null = null;

  try {
    objectUrl = URL.createObjectURL(videoFile);
    videoEl = document.createElement("video");
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.preload = "auto";
    videoEl.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      if (!videoEl) return reject(new Error("Video element missing"));

      const handleLoadedData = () => {
        videoEl!.currentTime = 0.1;
      };

      const handleSeeked = () => {
        cleanup();
        resolve();
      };

      const handleError = (e: Event) => {
        cleanup();
        reject(e);
      };

      const cleanup = () => {
        if (videoEl) {
          videoEl.removeEventListener("loadeddata", handleLoadedData);
          videoEl.removeEventListener("seeked", handleSeeked);
          videoEl.removeEventListener("error", handleError);
        }
      };

      videoEl.addEventListener("loadeddata", handleLoadedData);
      videoEl.addEventListener("seeked", handleSeeked);
      videoEl.addEventListener("error", handleError);

      videoEl.load();
    });

    const sourceWidth = videoEl.videoWidth || 1280;
    const sourceHeight = videoEl.videoHeight || 720;

    const maxLongEdge = 1280;
    let targetWidth = sourceWidth;
    let targetHeight = sourceHeight;

    const longEdge = Math.max(sourceWidth, sourceHeight);
    if (longEdge > maxLongEdge) {
      const scale = maxLongEdge / longEdge;
      targetWidth = Math.round(sourceWidth * scale);
      targetHeight = Math.round(sourceHeight * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(videoEl, 0, 0, targetWidth, targetHeight);

    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob(res, "image/webp", 0.8)
    );

    if (!blob) return null;

    const slug = videoFile.name.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const posterFile = new File([blob], `${slug}-poster.webp`, { type: "image/webp" });

    const result = await uploadToImageKit(posterFile, folder as any);
    return result.url || null;
  } catch (err) {
    console.warn("[VIDEO POSTER CAPTURE WARN] Could not capture poster frame:", err);
    return null;
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}
