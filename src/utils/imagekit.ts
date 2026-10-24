/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - ImageKit Image Optimization Utility for Core Web Vitals
 */

/**
 * Transforms an ImageKit URL with responsive width, quality, and auto format (WebP/AVIF).
 *
 * Rules:
 * - If the URL does not contain "ik.imagekit.io", returns it unchanged.
 * - If the URL already contains a "tr=" parameter, returns it unchanged.
 * - Otherwise appends tr=w-{width},q-{quality},f-auto correctly using ? or &.
 * - Uses ONLY width (never height or crop mode) to preserve exact visual aspect ratio.
 */
export function ikUrl(url: string | null | undefined, width: number, quality = 75): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // If the URL does not contain "ik.imagekit.io", return it unchanged
  if (!trimmed.includes('ik.imagekit.io')) {
    return trimmed;
  }

  // If the URL already contains a tr= parameter, return it unchanged
  if (trimmed.includes('tr=')) {
    return trimmed;
  }

  // Append tr=w-{width},q-{quality},f-auto correctly
  const separator = trimmed.includes('?') ? '&' : '?';
  return `${trimmed}${separator}tr=w-${width},q-${quality},f-auto`;
}

/**
 * Returns a valid HTML srcset string for ImageKit images.
 * Example output: "url1 480w, url2 800w, url3 1200w"
 */
export function ikSrcSet(url: string | null | undefined, widths: number[], quality = 75): string {
  if (!url || typeof url !== 'string' || !widths || widths.length === 0) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  return widths
    .map((w) => `${ikUrl(trimmed, w, quality)} ${w}w`)
    .join(', ');
}
