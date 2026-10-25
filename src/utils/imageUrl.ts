import { 
  isImageKitUrl, 
  isUnsplashUrl, 
  resizeImageUrl, 
  resizeSrcSet 
} from './imageUrl.shared.mjs';
import { IMAGE_ROLES, getRoleImageUrl } from './imageRoles.shared.mjs';

export { 
  isImageKitUrl, 
  isUnsplashUrl, 
  resizeImageUrl, 
  resizeSrcSet,
  IMAGE_ROLES,
  getRoleImageUrl
};

/**
 * Convenient wrapper function alias matching ikUrl signature
 */
export function ikUrl(url: string | null | undefined, width?: number, quality = 65): string {
  return resizeImageUrl(url, width, quality);
}

/**
 * Convenient wrapper function alias matching ikSrcSet signature
 */
export function ikSrcSet(url: string | null | undefined, widths: number[], quality = 65): string {
  return resizeSrcSet(url, widths, quality);
}
