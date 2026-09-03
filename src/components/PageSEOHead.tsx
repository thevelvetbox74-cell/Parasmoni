/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Dynamic Page SEO Head Manager
 */

import { useEffect } from 'react';

export interface PageSEOData {
  title?: string;
  slug?: string;
  description?: string;
  ogImage?: string;
}

interface PageSEOHeadProps {
  seo?: PageSEOData;
  pageTitle?: string;
  defaultDescription?: string;
  defaultOgImage?: string;
}

export function PageSEOHead({
  seo,
  pageTitle,
  defaultDescription = 'Discover handcrafted 925 sterling silver and hallmarked gold jewellery at VelvetBox / Parasmoni Jewellers. Shop bridal sets, polki, bangles, and diamond settings.',
  defaultOgImage = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200'
}: PageSEOHeadProps): null {
  useEffect(() => {
    const title = seo?.title?.trim() || (pageTitle ? `${pageTitle} | VelvetBox Parasmoni Jewellers` : 'VelvetBox | Premium Sterling Silver & Gold Jewellery');
    const description = seo?.description?.trim() || defaultDescription;
    const ogImage = seo?.ogImage?.trim() || defaultOgImage;
    const url = typeof window !== 'undefined' ? window.location.href : 'https://velvetbox.in';

    // 1. Update document title
    document.title = title;

    // Helper to safely create or update meta tags
    const setMetaTag = (attrName: string, attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to update link tag
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Standard Meta Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'title', title);

    // 3. OpenGraph Social Meta Tags
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:url', url);
    setMetaTag('property', 'og:site_name', 'VelvetBox Jewellers');

    // 4. Twitter Card Meta Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage);

    // 5. Canonical Link
    setLinkTag('canonical', url);

  }, [seo?.title, seo?.description, seo?.ogImage, pageTitle, defaultDescription, defaultOgImage]);

  return null;
}
