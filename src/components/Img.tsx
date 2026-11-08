import React, { useState } from 'react';
import { resizeImageUrl, buildSrcSet } from '../utils/imageUrl.shared.mjs';

export type ImgRole = 'hero' | 'peek' | 'tile' | 'card' | 'detail' | 'thumb' | 'logo';

export interface ImgProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> {
  src: string;
  alt: string;
  role?: ImgRole;
  priority?: boolean;
  className?: string;
  wrapperClassName?: string;
  sizes?: string;
  width?: number | string;
  height?: number | string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  style?: React.CSSProperties;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

interface RolePreset {
  width: number;
  quality: number;
  widths?: number[];
  defaultSizes?: string;
  defaultAspect?: string;
  defaultWidth?: number;
  defaultHeight?: number;
}

const ROLE_PRESETS: Record<ImgRole, RolePreset> = {
  hero: {
    width: 1200,
    quality: 65,
    widths: [480, 720, 1080, 1200, 1600],
    defaultSizes: '100vw',
    defaultAspect: '18/7',
    defaultWidth: 1200,
    defaultHeight: 467,
  },
  peek: {
    width: 400,
    quality: 45,
    widths: [320, 400, 480],
    defaultSizes: '(max-width: 768px) 50vw, 30vw',
    defaultAspect: '18/7',
    defaultWidth: 400,
    defaultHeight: 156,
  },
  tile: {
    width: 240,
    quality: 55,
    widths: [240, 360],
    defaultSizes: '(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 120px',
    defaultAspect: '1/1',
    defaultWidth: 240,
    defaultHeight: 240,
  },
  card: {
    width: 480,
    quality: 60,
    widths: [240, 360, 480, 640],
    defaultSizes: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
    defaultAspect: '1/1',
    defaultWidth: 480,
    defaultHeight: 480,
  },
  detail: {
    width: 960,
    quality: 70,
    widths: [480, 720, 960, 1200],
    defaultSizes: '(max-width: 768px) 100vw, 50vw',
    defaultAspect: '1/1',
    defaultWidth: 960,
    defaultHeight: 960,
  },
  thumb: {
    width: 160,
    quality: 55,
    widths: [120, 160, 240],
    defaultSizes: '80px',
    defaultAspect: '1/1',
    defaultWidth: 160,
    defaultHeight: 160,
  },
  logo: {
    width: 160,
    quality: 70,
    widths: [80, 120, 160],
    defaultSizes: '40px',
    defaultAspect: '1/1',
    defaultWidth: 160,
    defaultHeight: 160,
  },
};

export const Img: React.FC<ImgProps> = ({
  src,
  alt,
  role = 'card',
  priority = false,
  className = '',
  wrapperClassName = '',
  sizes,
  width,
  height,
  aspectRatio,
  objectFit = 'cover',
  style,
  onLoad,
  onError,
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);

  const preset = ROLE_PRESETS[role] || ROLE_PRESETS.card;

  // Primary image URL
  const primaryUrl = hasError 
    ? src 
    : resizeImageUrl(src, preset.width, preset.quality);

  // SrcSet computation
  const srcSetString = (!hasError && preset.widths) 
    ? buildSrcSet(src, preset.widths, preset.quality) 
    : undefined;

  const finalSizes = sizes || preset.defaultSizes;
  const finalAspect = aspectRatio || preset.defaultAspect;
  const finalWidth = width ?? preset.defaultWidth;
  const finalHeight = height ?? preset.defaultHeight;

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      setHasError(true);
    }
    if (onError) {
      onError(e);
    }
  };

  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
  }[objectFit];

  return (
    <img
      src={primaryUrl || src}
      srcSet={srcSetString}
      sizes={finalSizes}
      alt={alt}
      width={finalWidth}
      height={finalHeight}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      onError={handleImgError}
      onLoad={onLoad}
      className={`w-full h-full ${objectFitClass} ${className}`}
      style={{
        aspectRatio: finalAspect,
        ...style,
      }}
      {...rest}
    />
  );
};

export default Img;
