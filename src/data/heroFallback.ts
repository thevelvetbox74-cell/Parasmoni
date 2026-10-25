/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - LCP Hero Slide Fallback & Cache Helper
 */

import { ikUrl, ikSrcSet } from '../utils/imagekit';

export interface HeroSlideData {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  desktopImage?: string;
  mobileImage?: string;
  alt: string;
  buttonText: string;
  buttonLink: string;
}

export const HERO_FALLBACK_IMAGE = 'https://ik.imagekit.io/ugm0ru2xm/parasmoni/branding/JEWLLERS___GRAND_BROTHERS__6__5ekGzNryJ.png';

export const defaultHeroSlide: HeroSlideData = {
  id: 'hero-slide-default',
  title: 'Heritage Sovereign Bridal Gold',
  subtitle: 'Purity unmatched since 1974. Explore traditional Kolkata filigree and heavy bridal chokers handcrafted by master artisans.',
  image: HERO_FALLBACK_IMAGE,
  desktopImage: HERO_FALLBACK_IMAGE,
  mobileImage: HERO_FALLBACK_IMAGE,
  alt: 'Parasmoni Jewellers Heritage Sovereign Bridal Gold Masterpiece',
  buttonText: 'EXPLORE BRIDAL MASTERPIECES',
  buttonLink: '/catalog'
};

export const HERO_SRCSET_WIDTHS = [480, 768, 1080, 1440, 1920];
export const HERO_SIZES = '100vw';

/**
 * Returns optimized primary URL and responsive srcset for the initial hero LCP image
 */
export function getHeroPreloadAttrs(customUrl?: string) {
  const url = customUrl || defaultHeroSlide.image;
  return {
    src: ikUrl(url, 1200, 75) || url,
    srcSet: ikSrcSet(url, HERO_SRCSET_WIDTHS, 75) || undefined,
    sizes: HERO_SIZES
  };
}

/**
 * Safely cache the latest hero slide data to localStorage for instant subsequent paints
 */
export function cacheHeroSlide(data: Partial<HeroSlideData>): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('pm_hero_banner_data', JSON.stringify(data));
      if (data.image) {
        window.localStorage.setItem('pm_hero_banner_url', data.image);
      }
    }
  } catch {
    // Graceful noop if localStorage is restricted
  }
}

/**
 * Retrieve cached hero slide data with fallback
 */
export function getCachedHeroSlide(): HeroSlideData {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('pm_hero_banner_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.image || parsed.desktopImage)) {
          return {
            ...defaultHeroSlide,
            ...parsed
          };
        }
      }
    }
  } catch {
    // Ignore read errors
  }
  return defaultHeroSlide;
}
