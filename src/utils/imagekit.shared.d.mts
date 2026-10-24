/**
 * Type declarations for src/utils/imagekit.shared.mjs
 */

export declare function isImageKitUrl(url?: string | null): boolean;

export declare function ikUrl(
  url?: string | null,
  width?: number,
  quality?: number
): string;

export declare function ikSrcSet(
  url?: string | null,
  widths?: number[],
  quality?: number
): string;
