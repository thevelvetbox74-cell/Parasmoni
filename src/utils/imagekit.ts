/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - ImageKit Image Optimization Utility for Core Web Vitals
 */

/**
 * Transforms an ImageKit URL with responsive width, quality, and auto format (WebP/AVIF).
 *
 * Rules:
 * - If the URL is empty or undefined, returns empty string.
 * - If the URL is video/blob/data URL, returns pristine source.
 * - Handles Unsplash fallbacks with optimal width & format.
 * - If the URL contains "ik.imagekit.io", strips any existing tr= and appends
 *   tr=w-{width},q-{quality},f-auto using width ONLY (never height or crop mode)
 *   to preserve exact visual aspect ratio.
 */
export function ikUrl(url: string | null | undefined, width?: number, quality = 70): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  const baseUrl = trimmed.split('?')[0];
  const isVideo = baseUrl.toLowerCase().endsWith('.mp4') || 
                  baseUrl.toLowerCase().endsWith('.mov') || 
                  baseUrl.toLowerCase().endsWith('.webm') || 
                  baseUrl.toLowerCase().endsWith('.m4v');
  if (isVideo) return baseUrl;

  // Handle Unsplash images safely
  if (trimmed.includes('images.unsplash.com')) {
    const w = width && width > 0 ? Math.round(width) : 800;
    return `${baseUrl}?auto=format&fit=crop&q=${quality}&w=${w}`;
  }

  // If not ImageKit, return unchanged
  if (!trimmed.includes('ik.imagekit.io')) {
    return trimmed;
  }

  // Strip existing tr parameter to apply exact requested width & quality
  const urlWithoutTr = trimmed
    .replace(/[?&]tr=[^&]*/, '')
    .replace(/\?&/, '?')
    .replace(/\?$/, '');

  const w = width && width > 0 ? Math.round(width) : undefined;
  const q = Math.max(1, Math.min(100, Math.round(quality)));
  const trParts: string[] = [];
  if (w) trParts.push(`w-${w}`);
  trParts.push(`q-${q}`);
  trParts.push('f-auto');

  const separator = urlWithoutTr.includes('?') ? '&' : '?';
  return `${urlWithoutTr}${separator}tr=${trParts.join(',')}`;
}

/**
 * Returns a valid HTML srcset string for ImageKit images.
 * Example output: "url1 480w, url2 800w, url3 1200w"
 */
export function ikSrcSet(url: string | null | undefined, widths: number[], quality = 70): string {
  if (!url || typeof url !== 'string' || !widths || widths.length === 0) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  return widths
    .map((w) => `${ikUrl(trimmed, w, quality)} ${w}w`)
    .join(', ');
}
