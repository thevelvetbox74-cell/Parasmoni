/**
 * Shared ImageKit & Unsplash URL transformation utility (ESM)
 * Delegates to domain-aware resizeImageUrl to guarantee zero f-auto errors on Unsplash.
 */

import { 
  isImageKitUrl, 
  resizeImageUrl, 
  resizeSrcSet 
} from './imageUrl.shared.mjs';

export { isImageKitUrl };

export function ikUrl(url, width = 800, quality = 65) {
  return resizeImageUrl(url, width, quality);
}

export function ikSrcSet(url, widths = [480, 720, 1080, 1440, 1920], quality = 65) {
  return resizeSrcSet(url, widths, quality);
}
