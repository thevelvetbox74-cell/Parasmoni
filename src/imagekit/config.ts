/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface ImageKitConfig {
  publicKey: string;
  urlEndpoint: string;
}

export const imageKitConfig: ImageKitConfig = {
  publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '',
  urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '',
};

export const isImageKitConfigured = !!(imageKitConfig.publicKey && imageKitConfig.urlEndpoint);

/**
 * Generates an optimized ImageKit URL with specified transformations.
 * Since high-quality photography is vital for a premium showroom,
 * this function automatically applies optimization and quality formatting.
 */
export function getOptimizedImageUrl(
  path: string,
  transformations: {
    width?: number;
    height?: number;
    quality?: number; // 1-100
    blur?: number;
    cropMode?: 'pad' | 'force' | 'maintain' | 'extract';
  } = {}
): string {
  if (!path) return '';

  // If path is a full URL, return it as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // If ImageKit is not configured, fallback to absolute path or placeholder
  if (!isImageKitConfigured) {
    return path;
  }

  // Clean path trailing/leading slashes
  const cleanEndpoint = imageKitConfig.urlEndpoint.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');

  const transformParams: string[] = [];

  if (transformations.width) {
    transformParams.push(`w-${transformations.width}`);
  }
  if (transformations.height) {
    transformParams.push(`h-${transformations.height}`);
  }
  if (transformations.quality) {
    transformParams.push(`q-${transformations.quality}`);
  } else {
    // Default high-quality but compressed standard for showroom
    transformParams.push('q-80');
  }
  if (transformations.blur) {
    transformParams.push(`bl-${transformations.blur}`);
  }
  if (transformations.cropMode) {
    transformParams.push(`cm-${transformations.cropMode}`);
  }

  // Always enable auto webp/progressive image format transformation for speed
  transformParams.push('f-auto');

  const transformationString = transformParams.length > 0 ? `?tr=${transformParams.join(',')}` : '';

  return `${cleanEndpoint}/${cleanPath}${transformationString}`;
}
