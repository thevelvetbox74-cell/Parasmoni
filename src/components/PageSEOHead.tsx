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
  defaultDescription = 'Parasmoni Jewellers & Brothers – a trusted West Bengal gold jewellery showroom established in 1974. Discover handcrafted gold jewellery, bridal collections, and traditional Bengali designs crafted with authenticity and heritage craftsmanship.',
  defaultOgImage = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200'
}: PageSEOHeadProps): null {
  useEffect(() => {
    const title = seo?.title?.trim() || (pageTitle ? `${pageTitle} | Parasmoni Jewellers & Brothers` : 'Parasmoni Jewellers & Brothers | Premium Gold Jewellery Showroom Since 1974');
    const description = seo?.description?.trim() || defaultDescription;
    const ogImage = seo?.ogImage?.trim() || defaultOgImage;
    
    let url = 'https://parasmoni.in';
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      url = `https://parasmoni.in${pathname === '/' ? '' : pathname}`;
    }

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
    setMetaTag('property', 'og:site_name', 'Parasmoni Jewellers & Brothers');

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
