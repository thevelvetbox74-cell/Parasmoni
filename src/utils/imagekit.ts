import { isImageKitUrl, ikUrl as sharedIkUrl, ikSrcSet as sharedIkSrcSet } from './imagekit.shared.mjs';

export const IMAGEKIT_VIDEO_TRANSFORMS = false;

export { isImageKitUrl };

/**
 * Transforms an ImageKit or Unsplash URL with responsive width, quality, and auto format.
 */
export function ikUrl(url: string | null | undefined, width?: number, quality = 65): string {
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

  return sharedIkUrl(trimmed, width, quality);
}

/**
 * Returns a valid HTML srcset string for ImageKit or Unsplash images.
 */
export function ikSrcSet(url: string | null | undefined, widths: number[], quality = 65): string {
  if (!url || typeof url !== 'string' || !widths || widths.length === 0) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  return widths
    .map((w) => `${ikUrl(trimmed, w, quality)} ${w}w`)
    .join(', ');
}
