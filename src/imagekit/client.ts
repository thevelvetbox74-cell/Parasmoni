/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ImageKit Client-Side Integration Configuration & Optimization Utility
 * 
 * Configured for maximum Core Web Vitals speed:
 * - ImageKit URL transformations: f-auto (WebP/AVIF), q-70, w-XXX
 * - Responsive srcset generation for 400, 800, 1200, 1600px widths
 * - Mobile hero < 100KB, thumbnails < 40KB
 */

export const imageKitClientConfig = {
  publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '',
  urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '',
};

export const isImageKitConfigured = !!(
  imageKitClientConfig.publicKey && 
  imageKitClientConfig.urlEndpoint
);

export const IMAGEKIT_FOLDERS = {
  products: '/parasmoni/products',
  banners: '/parasmoni/banners',
  categories: '/parasmoni/categories',
  collections: '/parasmoni/collections',
  stores: '/parasmoni/stores',
  branding: '/parasmoni/branding',
} as const;

export type ImageKitFolder = keyof typeof IMAGEKIT_FOLDERS;

/**
 * Generates an optimized, cached, and responsive URL for premium display.
 * Quality defaults to 70 (or 75 for hero) to ensure small payloads without visual loss.
 */
export function getOptimizedShowroomUrl(
  path: string,
  transformations: {
    width?: number;
    height?: number;
    quality?: number; // 1 to 100 (defaults to 70 for performance budget)
    blur?: number;
    cropMode?: 'pad' | 'force' | 'maintain' | 'extract';
    format?: string;
  } = {}
): string {
  if (!path) return '';

  // Return base64 data URLs or local object blob URLs unmodified
  if (path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }

  const lowerPath = path.toLowerCase().split('?')[0];
  const isVideo = lowerPath.endsWith('.mp4') || lowerPath.endsWith('.mov') || lowerPath.endsWith('.webm') || lowerPath.endsWith('.m4v');

  // If video asset, return pristine raw source without query strings
  if (isVideo) {
    return path.split('?')[0];
  }

  const quality = transformations.quality || 70;

  // Enhance Unsplash image URLs with appropriate target widths and WebP auto formatting
  if (path.includes('images.unsplash.com')) {
    const baseUrl = path.split('?')[0];
    const targetWidth = transformations.width || 800;
    return `${baseUrl}?auto=format&fit=crop&q=${quality}&w=${targetWidth}`;
  }

  // Handle full ImageKit URLs (e.g. https://ik.imagekit.io/...)
  if (path.includes('ik.imagekit.io')) {
    const baseUrl = path.split('?')[0];
    const trParams: string[] = [];
    if (transformations.width) trParams.push(`w-${transformations.width}`);
    if (transformations.height) trParams.push(`h-${transformations.height}`);
    trParams.push(`q-${quality}`);
    if (transformations.blur) trParams.push(`bl-${transformations.blur}`);
    if (transformations.cropMode) trParams.push(`cm-${transformations.cropMode}`);
    trParams.push('f-auto');
    return `${baseUrl}?tr=${trParams.join(',')}`;
  }

  // Other full URLs (e.g. cdn-icons, flaticon, external CDNs)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  if (!isImageKitConfigured) {
    return path;
  }

  const endpoint = imageKitClientConfig.urlEndpoint.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');

  const trParams: string[] = [];
  if (transformations.width) trParams.push(`w-${transformations.width}`);
  if (transformations.height) trParams.push(`h-${transformations.height}`);
  trParams.push(`q-${quality}`);
  if (transformations.blur) trParams.push(`bl-${transformations.blur}`);
  if (transformations.cropMode) trParams.push(`cm-${transformations.cropMode}`);
  trParams.push('f-auto');

  const queryParam = trParams.length > 0 ? `?tr=${trParams.join(',')}` : '';
  return `${endpoint}/${cleanPath}${queryParam}`;
}

/**
 * Builds a responsive srcset string across standard breakpoints [400, 800, 1200, 1600]
 */
export function buildResponsiveSrcSet(
  url: string,
  widths: number[] = [400, 800, 1200, 1600],
  quality: number = 70
): string {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return '';

  return widths
    .map((w) => `${getOptimizedShowroomUrl(url, { width: w, quality })} ${w}w`)
    .join(', ');
}
