/**
 * Shared Image URL Transformation Utility (ESM)
 * Robust URL manipulation for ImageKit, Unsplash, and generic hosts.
 * Always rewrites ImageKit and Unsplash URLs with exact role dimensions and quality.
 * Preserves percent-encoded filenames (e.g., Bengali characters) and extra query parameters.
 */

export function isImageKitUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('ik.imagekit.io') || url.includes('imagekit.io');
}

export function isUnsplashUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('images.unsplash.com');
}

/**
 * Transforms an image URL with exact width, quality, and host-correct parameter rules.
 * @param {string} [url]
 * @param {number} [width=800]
 * @param {number} [quality=65]
 * @returns {string}
 */
export function resizeImageUrl(url, width = 800, quality = 65) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  const baseUrl = trimmed.split('?')[0];
  const lowerBase = baseUrl.toLowerCase();
  const isVideo = lowerBase.endsWith('.mp4') || 
                  lowerBase.endsWith('.mov') || 
                  lowerBase.endsWith('.webm') || 
                  lowerBase.endsWith('.m4v');
  if (isVideo) return baseUrl;

  const w = width && width > 0 ? Math.round(width) : 800;
  const q = quality && quality > 0 ? Math.round(quality) : 65;

  // Unsplash Host Rule: auto=format, fit=crop, q=Q, w=W
  if (isUnsplashUrl(trimmed)) {
    try {
      const urlObj = new URL(trimmed);
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fit', 'crop');
      urlObj.searchParams.set('q', String(q));
      urlObj.searchParams.set('w', String(w));
      urlObj.searchParams.delete('tr');
      return urlObj.toString();
    } catch (e) {
      return `${baseUrl}?auto=format&fit=crop&q=${q}&w=${w}`;
    }
  }

  // ImageKit Host Rule: tr=w-W,q-Q,f-auto
  if (isImageKitUrl(trimmed)) {
    try {
      const cleanUrl = trimmed.replace(/\/tr:[^/]+\//g, '/');
      const urlObj = new URL(cleanUrl);
      urlObj.searchParams.delete('tr');
      urlObj.searchParams.set('tr', `w-${w},q-${q},f-auto`);
      return urlObj.toString();
    } catch (e) {
      const cleanBase = baseUrl.replace(/\/tr:[^/]+\//g, '/');
      return `${cleanBase}?tr=w-${w},q-${q},f-auto`;
    }
  }

  return trimmed;
}

/**
 * Builds responsive srcset string using domain-correct rules.
 * @param {string} [url]
 * @param {number[]} [widths=[480, 720, 1080]]
 * @param {number} [quality=65]
 * @returns {string}
 */
export function buildSrcSet(url, widths = [480, 720, 1080], quality = 65) {
  if (!url || typeof url !== 'string' || !widths || widths.length === 0) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  return widths
    .map((w) => `${resizeImageUrl(trimmed, w, quality)} ${w}w`)
    .join(', ');
}

export const resizeSrcSet = buildSrcSet;
