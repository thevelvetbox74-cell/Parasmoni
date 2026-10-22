/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Reusable Zero-CLS Optimized Image Component
 */

import React, { useState } from 'react';
import { getOptimizedShowroomUrl, buildResponsiveSrcSet } from '../imagekit/client';

export interface OptimizedImageProps extends React.HTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  aspectRatio?: string; // e.g. "1/1", "4/3", "16/9", "14/9", "18/7"
  priority?: boolean; // For LCP elements
  quality?: number; // Defaults to 70 for mobile performance (<40KB thumbnails, <100KB hero)
  sizes?: string; // Responsive sizes attribute
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
  quality = 70,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  className = '',
  wrapperClassName = '',
  objectFit = 'cover',
  fallbackSrc = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=70&w=800',
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
  const optimizedPrimaryUrl = getOptimizedShowroomUrl(effectiveSrc, {
    width: numericWidth || 800,
    quality
  });

  // Generate responsive srcset
  const responsiveSrcSet = buildResponsiveSrcSet(effectiveSrc, [400, 800, 1200, 1600], quality);

  // Aspect ratio calculation for style
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
        loading={priority ? 'eager' : 'lazy'}
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
