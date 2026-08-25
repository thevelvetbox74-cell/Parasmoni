/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ImageKit Client-Side Integration Configuration
 * 
 * CRITICAL SECURITY ARCHITECTURE WARNING:
 * -------------------------------------------------------------------------
 * This file is bundled into the client browser application. It ONLY imports 
 * public variables prefixed with VITE_ (VITE_IMAGEKIT_PUBLIC_KEY, VITE_IMAGEKIT_URL_ENDPOINT).
 * 
 * Under NO circumstances should the IMAGEKIT_PRIVATE_KEY be imported or used here.
 * If the private key is hardcoded or imported into the frontend:
 * 1. It is visible to anyone inspecting the Javascript bundle via DevTools.
 * 2. Malicious actors could extract it to arbitrarily upload, overwrite, 
 *    or delete assets in your ImageKit media library.
 * 3. It compromises the brand integrity and security of Parasmoni Jewellers.
 * 
 * Secure uploads are achieved by delegating signature authentication to a secure, 
 * isolated server-side environment (like an Express server, Netlify Function, or Cloudflare Worker).
 * -------------------------------------------------------------------------
 */

export const imageKitClientConfig = {
  publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '',
  urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '',
};

export const isImageKitConfigured = !!(
  imageKitClientConfig.publicKey && 
  imageKitClientConfig.urlEndpoint
);

/**
 * ImageKit folder structures as requested
 */
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
 */
export function getOptimizedShowroomUrl(
  path: string,
  transformations: {
    width?: number;
    height?: number;
    quality?: number; // 1 to 100 (e.g. 80 for great balance)
    blur?: number;
    cropMode?: 'pad' | 'force' | 'maintain' | 'extract';
  } = {}
): string {
  if (!path) return '';

  // Return immediately if it's already a fully qualified external URL
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
  if (transformations.quality) {
    trParams.push(`q-${transformations.quality}`);
  } else {
    trParams.push('q-80'); // Standard high-fidelity showroom compression
  }
  if (transformations.blur) trParams.push(`bl-${transformations.blur}`);
  if (transformations.cropMode) trParams.push(`cm-${transformations.cropMode}`);

  // Auto-convert to next-gen formats (WebP/AVIF) and progressive loading
  trParams.push('f-auto');

  const queryParam = trParams.length > 0 ? `?tr=${trParams.join(',')}` : '';
  return `${endpoint}/${cleanPath}${queryParam}`;
}
