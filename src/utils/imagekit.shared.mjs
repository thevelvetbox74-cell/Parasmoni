/**
 * Shared ImageKit URL transformation utility (ESM)
 * Used across Vite plugins, Node snapshot scripts, and React client code.
 */

/**
 * Check if a URL points to an ImageKit origin
 * @param {string} [url]
 * @returns {boolean}
 */
export function isImageKitUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('ik.imagekit.io') || url.includes('imagekit.io');
}

/**
 * Cleans and transforms an ImageKit URL with explicit width, quality, and auto-format (f-auto).
 * @param {string} [url] - Raw or partially transformed image URL
 * @param {number} [width=800] - Targeted width in pixels
 * @param {number} [quality=65] - Image quality (1-100)
 * @returns {string} Fully transformed ImageKit URL or original non-ImageKit URL
 */
export function ikUrl(url, width = 800, quality = 65) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (!isImageKitUrl(trimmed)) {
    return trimmed;
  }

  // Development warning tracker for untransformed ImageKit URLs
  if (typeof process !== 'undefined' && process?.env?.NODE_ENV === 'development') {
    if (!trimmed.includes('tr=') && !trimmed.includes('/tr:')) {
      console.warn('[ImageKit Optimizer Warning] Untransformed raw ImageKit URL detected:', trimmed);
    }
  }

  try {
    const urlObj = new URL(trimmed);
    const searchParams = urlObj.searchParams;

    // Remove old 'tr' parameter if present in query string
    searchParams.delete('tr');

    // Remove path-based /tr:.../ segment if present
    let pathname = urlObj.pathname;
    pathname = pathname.replace(/\/tr:[^/]+\//g, '/');
    urlObj.pathname = pathname;

    // Construct fresh tr parameter with width, quality, and auto format
    const newTr = `w-${Math.round(width)},q-${Math.round(quality)},f-auto`;
    searchParams.set('tr', newTr);

    return urlObj.toString();
  } catch (e) {
    // String manipulation fallback if URL constructor fails
    const cleanUrl = trimmed.split('?')[0].replace(/\/tr:[^/]+\//g, '/');
    return `${cleanUrl}?tr=w-${Math.round(width)},q-${Math.round(quality)},f-auto`;
  }
}

/**
 * Generate a standard responsive srcset string for ImageKit URLs
 * @param {string} [url]
 * @param {number[]} [widths=[480, 720, 1080, 1440, 1920]]
 * @param {number} [quality=65]
 * @returns {string}
 */
export function ikSrcSet(url, widths = [480, 720, 1080, 1440, 1920], quality = 65) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  return widths
    .map((w) => `${ikUrl(trimmed, w, quality)} ${w}w`)
    .join(', ');
}
