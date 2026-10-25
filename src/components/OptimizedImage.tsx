/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Reusable Zero-CLS Optimized Image Component
 */

import React, { useState } from 'react';
import { ikUrl, ikSrcSet } from '../utils/imagekit';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  aspectRatio?: string; // e.g. "1/1", "4/3", "16/9", "14/9", "18/7"
  priority?: boolean; // For LCP elements
  loading?: 'lazy' | 'eager';
  quality?: number; // Defaults to 75 for products, 80 for hero
  sizes?: string; // Responsive sizes attribute
  widths?: number[]; // Custom responsive widths array
  className?: string;
  wrapperClassName?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  fallbackSrc?: string;
  draggable?: boolean;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  style?: React.CSSProperties;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  aspectRatio,
  priority = false,
  loading: customLoading,
  quality = 75,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  widths,
  className = '',
  wrapperClassName = '',
  objectFit = 'cover',
  fallbackSrc = 'https://ik.imagekit.io/ugm0ru2xm/parasmoni/branding/JEWLLERS___GRAND_BROTHERS__6__5ekGzNryJ.png?tr=w-800,q-75,f-auto',
  style,
  referrerPolicy = 'no-referrer',
  draggable,
  ...rest
}: OptimizedImageProps): React.JSX.Element {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const effectiveSrc = imgError ? fallbackSrc : (src || fallbackSrc);

  // Derive target primary width
  const numericWidth = typeof width === 'number' ? width : (width ? parseInt(width, 10) : 800);
  
  // Transform primary URL with ImageKit helper
  const optimizedPrimaryUrl = ikUrl(effectiveSrc, numericWidth || 800, quality) || effectiveSrc;

  // Responsive srcset calculation
  const targetWidths = widths || (priority ? [480, 768, 1200, 1920] : [320, 480, 640]);
  const responsiveSrcSet = ikSrcSet(effectiveSrc, targetWidths, quality);

  // Aspect ratio wrapper calculation to prevent CLS
  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    ...(aspectRatio ? { aspectRatio } : {})
  };

  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none'
  }[objectFit];

  return (
    <div 
      className={`overflow-hidden bg-stone-100 ${wrapperClassName}`} 
      style={wrapperStyle}
    >
      <img
        src={optimizedPrimaryUrl}
        srcSet={responsiveSrcSet || undefined}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={customLoading || (priority ? 'eager' : 'lazy')}
        fetchPriority={priority ? 'high' : 'low'}
        decoding="async"
        referrerPolicy={referrerPolicy}
        draggable={draggable}
        onLoad={() => setHasLoaded(true)}
        onError={() => setImgError(true)}
        className={`w-full h-full ${objectFitClass} transition-opacity duration-300 ${
          hasLoaded || priority ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        style={style}
        {...rest}
      />
    </div>
  );
}

export default OptimizedImage;
