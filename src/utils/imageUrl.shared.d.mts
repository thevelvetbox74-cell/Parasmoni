export declare function isImageKitUrl(url?: string | null): boolean;
export declare function isUnsplashUrl(url?: string | null): boolean;
export declare function resizeImageUrl(url?: string | null, width?: number, quality?: number): string;
export declare function buildSrcSet(url?: string | null, widths?: number[], quality?: number): string;
export declare const resizeSrcSet: typeof buildSrcSet;
