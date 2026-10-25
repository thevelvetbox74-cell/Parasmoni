/**
 * Shared Image URL Transformation Utility (ESM)
 * Correctly transforms URLs based on domain host:
 * - ik.imagekit.io / imagekit.io -> tr=w-X,q-Y,f-auto
 * - images.unsplash.com -> ?auto=format&fit=crop&q=Y&w=X (NO f-auto)
 * - data:, blob:, videos -> unchanged
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
 * Cleanly resizes an image URL for ImageKit or Unsplash with correct domain-specific query parameters.
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

  // Unsplash handling: strictly use auto=format&fit=crop&q=Y&w=X
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

  // ImageKit handling: strictly use tr=w-X,q-Y,f-auto
  if (isImageKitUrl(trimmed)) {
    try {
      const urlObj = new URL(trimmed);
      urlObj.searchParams.delete('tr');
      let pathname = urlObj.pathname.replace(/\/tr:[^/]+\//g, '/');
      urlObj.pathname = pathname;
      urlObj.searchParams.set('tr', `w-${w},q-${q},f-auto`);
      return urlObj.toString();
    } catch (e) {
      const cleanUrl = baseUrl.replace(/\/tr:[^/]+\//g, '/');
      return `${cleanUrl}?tr=w-${w},q-${q},f-auto`;
    }
  }

  return trimmed;
}

/**
 * Generates responsive srcset string with domain-aware parameters.
 * @param {string} [url]
 * @param {number[]} [widths=[480, 720, 1080]]
 * @param {number} [quality=65]
 * @returns {string}
 */
export function resizeSrcSet(url, widths = [480, 720, 1080], quality = 65) {
  if (!url || typeof url !== 'string' || !widths || widths.length === 0) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  return widths
    .map((w) => `${resizeImageUrl(trimmed, w, quality)} ${w}w`)
    .join(', ');
}
