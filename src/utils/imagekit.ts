import { 
  isImageKitUrl, 
  resizeImageUrl, 
  resizeSrcSet 
} from './imageUrl.shared.mjs';

export const IMAGEKIT_VIDEO_TRANSFORMS = false;

export { isImageKitUrl };

/**
 * Transforms an ImageKit or Unsplash URL with responsive width, quality, and domain-correct format.
 */
export function ikUrl(url: string | null | undefined, width?: number, quality = 65): string {
  return resizeImageUrl(url, width, quality);
}

/**
 * Returns a valid HTML srcset string for ImageKit or Unsplash images.
 */
export function ikSrcSet(url: string | null | undefined, widths: number[], quality = 65): string {
  return resizeSrcSet(url, widths, quality);
}
