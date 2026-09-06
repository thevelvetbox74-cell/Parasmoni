/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Dynamic Custom Page Renderer
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Home } from './Home';
import { db, isFirebaseConfigured } from '../firebase/config';
import { collection, doc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { PageSEOHead } from '../components/PageSEOHead';
import { Sparkles, ArrowLeft, ShieldAlert, FileText, Construction } from 'lucide-react';

export function CustomPage(): React.JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const [pageData, setPageData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    // Normalized slug
    const targetSlug = slug.toLowerCase().trim();

    if (!isFirebaseConfigured || !db) {
      // Local storage cache lookup
      const localPagesJson = localStorage.getItem('draft_custom_pages');
      let found = null;
      if (localPagesJson) {
        try {
          const parsed = JSON.parse(localPagesJson);
          found = parsed.find((p: any) => p.slug === targetSlug || p.id === targetSlug);
        } catch (e) {
          console.error("Failed to parse local pages", e);
        }
      }

      // Check default starter demo pages if local storage is empty
      if (!found) {
        if (targetSlug === 'bridal-collection' || targetSlug === 'bridal') {
          found = {
            id: 'p-bridal',
            title: 'Royal Bridal Heritage Collection',
            name: 'Royal Bridal Heritage Collection',
            slug: 'bridal-collection',
            status: 'published',
            sections: [
              {
                id: 'sec-hero-bridal',
                type: 'Hero Banner',
                content: {
                  subtitle: 'ROYAL HERITAGE 22K',
                  title: 'A Legacy of Bengali Bridal Majesty',
                  description: 'Handcrafted wedding chokers, uncut Polki neckpieces, and ornate Nakashi bangles forged with generational gold mastery.',
                  primaryButton: { label: 'Explore Bridal Sets', linkUrl: '/catalog', styleType: 'filled' },
                  secondaryButton: { label: 'Book Private Appointment', linkUrl: '/contact', styleType: 'outlined' },
                  mediaUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200'
                }
              },
              {
                id: 'sec-carousel-bridal',
                type: 'Product Carousel',
                content: { title: 'Signature Bridal Ornaments', productsType: 'featured' }
              },
              {
                id: 'sec-story-bridal',
                type: 'About Collection',
                content: {
                  subtitle: 'BOWBAZAR TRADITION',
                  title: 'Pure 916 Hallmarked Bengali Jewellery',
                  description: 'Every bride deserves generational heirloom jewelry crafted to endure for decades to come.'
                }
              }
            ],
            seo: {
              title: 'Royal Bridal Heritage Jewellery Collection | Parasmoni Jewellers & Brothers',
              slug: 'bridal-collection',
              description: 'Explore the royal wedding bridal jewelry collection in 22K pure hallmarked gold and uncut Polki diamonds at Parasmoni Jewellers & Brothers.',
              ogImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200'
            }
          };
        } else if (targetSlug === 'about-us' || targetSlug === 'about') {
          found = {
            id: 'p-about',
            title: 'Legacy & Craftsmanship (About Us)',
            name: 'Legacy & Craftsmanship',
            slug: 'about-us',
            status: 'published',
            sections: [
              {
                id: 'sec-split-about',
                type: 'Split Media Banner',
                content: {
                  subtitle: 'HERITAGE SINCE 1974',
                  title: 'Over 50 Years of Craftsmanship and Trust',
                  description: 'Parasmoni Jewellers was founded on a simple principle: uncompromising purity and reverence for Kolkata goldsmithing heritage.',
                  primaryButton: { label: 'View Stores', linkUrl: '/stores', styleType: 'filled' },
                  secondaryButton: { label: 'Our Catalog', linkUrl: '/catalog', styleType: 'outlined' }
                }
              },
              {
                id: 'sec-boutiques-about',
                type: 'Our Boutiques',
                content: {}
              }
            ],
            seo: {
              title: 'Legacy & Craftsmanship Since 1974 | Parasmoni Jewellers & Brothers',
              slug: 'about-us',
              description: 'Learn about our 50-year heritage of Kolkata goldsmith craftsmanship, hallmarked purity, and bespoke bridal service.',
              ogImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200'
            }
          };
        }
      }

      if (found) {
        setPageData(found);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
      setLoading(false);
      return;
    }

    // Subscribe to Firestore pageSections collection matching slug or document ID
    const directDocRef = doc(db, 'pageSections', targetSlug);
    
    // First try direct document lookup (if document ID equals slug)
    const unsubscribeDoc = onSnapshot(directDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPageData({ id: snap.id, ...data });
        setNotFound(false);
        setLoading(false);
      } else {
        // Query by slug field in pageSections collection
        const q = query(collection(db, 'pageSections'), where('slug', '==', targetSlug));
        getDocs(q).then((querySnap) => {
          if (!querySnap.empty) {
            const firstDoc = querySnap.docs[0];
            setPageData({ id: firstDoc.id, ...firstDoc.data() });
            setNotFound(false);
          } else {
            setNotFound(true);
          }
          setLoading(false);
        }).catch((err) => {
          console.error("Error querying page by slug:", err);
          setNotFound(true);
          setLoading(false);
        });
      }
    }, (error) => {
      console.error("Error listening to page document:", error);
      setNotFound(true);
      setLoading(false);
    });

    return () => unsubscribeDoc();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-stone-50 text-stone-700" id="custom-page-spinner">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <span className="block text-xs uppercase tracking-widest font-bold text-stone-600">Parasmoni Showroom</span>
            <span className="block text-xs text-stone-400 font-serif">Curating bespoke jewelry layout...</span>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !pageData) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-stone-50 px-4 py-16" id="custom-page-not-found">
        <div className="max-w-md w-full text-center space-y-5 bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
          <div className="w-14 h-14 bg-stone-100 border border-stone-200 rounded-full flex items-center justify-center text-stone-400 mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 font-mono">
              404 • Page Not Found
            </span>
            <h1 className="font-serif text-2xl font-bold text-stone-900">
              Page Under Crafting
            </h1>
            <p className="text-xs text-stone-500 leading-relaxed font-sans">
              The requested page <span className="font-mono text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded">/pages/{slug}</span> does not exist or has been relocated by the showroom administrator.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link 
              to="/" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Home</span>
            </Link>
            <Link 
              to="/catalog" 
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              <span>Explore Catalog</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If page is draft mode
  if (pageData.status === 'draft') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-stone-50 px-4 py-16" id="custom-page-draft">
        <div className="max-w-md w-full text-center space-y-5 bg-white border border-amber-200 rounded-2xl p-8 shadow-sm">
          <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center text-amber-600 mx-auto">
            <Construction className="w-6 h-6" />
          </div>
          
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 font-mono">
              Draft Layout
            </span>
            <h1 className="font-serif text-2xl font-bold text-stone-900">
              {pageData.title || pageData.name || 'Upcoming Collection'}
            </h1>
            <p className="text-xs text-stone-500 leading-relaxed font-sans">
              This page is currently undergoing preview compilation in the administrator draft sandbox. Please check back shortly for the official release.
            </p>
          </div>

          <div className="pt-2">
            <Link 
              to="/" 
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Showroom</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render published custom page with its own sections and SEO tags
  return (
    <div className="w-full relative" id={`custom-page-${pageData.slug || slug}`}>
      {/* Inject Live Head Meta Tags */}
      <PageSEOHead 
        seo={pageData.seo} 
        pageTitle={pageData.title || pageData.name}
      />

      {/* Render all custom page sections using Home dynamic section renderer */}
      <Home 
        pageSections={pageData.sections || []} 
        loadingSections={false}
      />
    </div>
  );
}
