/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Phone, 
  MessageCircle, 
  ChevronLeft, 
  Sparkles, 
  Info, 
  ShieldCheck, 
  Award, 
  Gem, 
  Scale, 
  Layers, 
  Tag,
  ArrowRight,
  MapPin,
  Clock,
  ExternalLink
} from 'lucide-react';
import { db, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs, doc, getDoc, query, where, limit } from 'firebase/firestore';
import { calculateProductPrice } from '../utils/calculateProductPrice';
import { getOptimizedShowroomUrl } from '../imagekit/client';
import { mockWebsiteSettings } from '../data/mockSettings';
import { mockProducts } from '../data/mockData';

export function ProductDetails(): React.JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  // State variables
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [settings, setSettings] = useState<any>(mockWebsiteSettings);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  // 1. Fetch contact info from websiteSettings in Firestore
  useEffect(() => {
    async function fetchSettings() {
      try {
        const settingsCol = collection(db, 'websiteSettings');
        const settingsSnapshot = await getDocs(settingsCol);
        if (!settingsSnapshot.empty) {
          const docData = settingsSnapshot.docs[0].data();
          setSettings({
            ...mockWebsiteSettings,
            ...docData,
            contactNumber: docData.contactPhone || docData.contactNumber || docData.phone || mockWebsiteSettings.contactNumber,
            whatsappNumber: docData.whatsappNumber || mockWebsiteSettings.whatsappNumber,
            brandName: docData.showroomName || docData.brandName || mockWebsiteSettings.brandName
          });
        }
      } catch (err) {
        console.warn("Could not load database settings, utilizing local fallback configuration", err);
      }
    }
    fetchSettings();
  }, []);

  // 2. Fetch the specific product by slug or id
  useEffect(() => {
    async function fetchProduct() {
      if (!slug) return;
      setLoading(true);
      setActiveImageIndex(0);

      try {
        // Fetch metalPrices
        let metalPrices: any[] = [];
        if (isFirebaseConfigured) {
          try {
            const pricesSnap = await getDocs(collection(db, 'metalPrices'));
            metalPrices = pricesSnap.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                metalName: data.metalName || data.metal || '',
                pricePerGram: Number(data.price || data.pricePerGram || data.ratePerGram || 0),
                status: data.status || 'active'
              };
            });
          } catch (e) {
            console.warn('Could not load live metal prices for detail calculation:', e);
          }
        }

        // A. Check Firestore first if database configured
        const productsCol = collection(db, 'products');
        
        // Try query by slug field
        const slugQuery = query(productsCol, where('slug', '==', slug), limit(1));
        const slugSnapshot = await getDocs(slugQuery);
        
        let foundProduct: any = null;

        if (!slugSnapshot.empty) {
          const firstDoc = slugSnapshot.docs[0];
          foundProduct = { id: firstDoc.id, ...firstDoc.data() };
        } else {
          // Try fetching directly as doc id
          try {
            const docRef = doc(db, 'products', slug);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              foundProduct = { id: docSnap.id, ...docSnap.data() };
            }
          } catch (e) {
            // Document reference query may throw error if slug contains special characters
          }
        }

        // B. If not found in Firestore, check our comprehensive mock dataset
        if (!foundProduct) {
          const mockMatch = mockProducts.find(p => {
            const computedSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return computedSlug === slug || p.id === slug || p.sku === slug;
          });
          if (mockMatch) {
            const computedSlug = mockMatch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            foundProduct = {
              ...mockMatch,
              slug: computedSlug,
              // Normalize mock field variants
              grossWeight: mockMatch.approxWeight || (mockMatch as any).grossWeight || '0g',
              purity: (mockMatch as any).purity || '22K (916) Hallmark',
              images: (mockMatch as any).images || [mockMatch.imageUrl]
            };
          }
        } else {
          // Normalize Firestore data fields using dynamic pricing parameters
          const weight = Number(foundProduct.weight || foundProduct.grossWeight || 0);
          const priceInfo = calculateProductPrice({
            metalRef: foundProduct.metalRef || '',
            weight: weight,
            makingCharge: Number(foundProduct.makingCharge || 0),
            makingChargeType: foundProduct.makingChargeType || 'fixed',
            wastagePercent: Number(foundProduct.wastagePercent || 0)
          }, metalPrices);

          foundProduct = {
            ...foundProduct,
            sku: foundProduct.sku || foundProduct.productCode || foundProduct.code || 'PM-GEN-01',
            grossWeight: weight > 0 ? `${weight}g` : (foundProduct.approxWeight || ''),
            purity: priceInfo.metalName || foundProduct.purity || foundProduct.metalType || '22K (916) Hallmark',
            images: foundProduct.images || (foundProduct.imageUrl ? [foundProduct.imageUrl] : []),
            price: priceInfo.finalPrice > 0 ? priceInfo.finalPrice : Number(foundProduct.price || 0),
            priceVisibility: foundProduct.priceVisibility !== undefined ? foundProduct.priceVisibility : true
          };
        }

        if (foundProduct) {
          setProduct(foundProduct);
          
          // Fetch related products (same category/collection)
          if (foundProduct.category) {
            const related = mockProducts
              .filter(p => p.category === foundProduct.category && p.id !== foundProduct.id)
              .slice(0, 4);
            setRelatedProducts(related);
          }
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("Error loading jewelry masterpiece details", err);
        // Resilient fallback to mock matching
        const mockMatch = mockProducts.find(p => {
          const computedSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          return computedSlug === slug || p.id === slug;
        });
        if (mockMatch) {
          const computedSlug = mockMatch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          setProduct({
            ...mockMatch,
            slug: computedSlug,
            grossWeight: mockMatch.approxWeight,
            purity: '22K (916) Hallmark',
            images: [mockMatch.imageUrl]
          });
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  // 3. SEO Head Configuration
  useEffect(() => {
    if (product) {
      const titleText = product.seoTitle || `${product.name} | ${settings.brandName || "Parasmoni Jewellers"}`;
      const descText = product.seoDescription || product.description || `Explore the handcrafted details of ${product.name} gold ornaments.`;
      
      document.title = titleText;
      
      const updateOrCreateMeta = (nameOrProperty: string, content: string, isProperty = false) => {
        const selector = isProperty ? `meta[property="${nameOrProperty}"]` : `meta[name="${nameOrProperty}"]`;
        let element = document.querySelector(selector);
        if (!element) {
          element = document.createElement('meta');
          if (isProperty) {
            element.setAttribute('property', nameOrProperty);
          } else {
            element.setAttribute('name', nameOrProperty);
          }
          document.head.appendChild(element);
        }
        element.setAttribute('content', content);
      };

      updateOrCreateMeta('description', descText);
      updateOrCreateMeta('og:title', titleText, true);
      updateOrCreateMeta('og:description', descText, true);
      updateOrCreateMeta('og:type', 'product', true);
      updateOrCreateMeta('og:url', window.location.href, true);
      
      const displayImg = product.images?.[0] || product.imageUrl || product.thumbnailUrl || '';
      if (displayImg) {
        updateOrCreateMeta('og:image', displayImg, true);
      }
    }
  }, [product, settings]);

  // Handle WhatsApp Link formulation
  const getWhatsAppEnquiryUrl = () => {
    if (!product) return '#';
    const currentUrl = window.location.href;
    const cleanPhone = settings.whatsappNumber.replace(/[^0-9]/g, '');
    const textTemplate = `Hello Parasmoni Jewellers, I am interested in this jewellery product. Product: ${product.name}, Product Code: ${product.sku || product.sku}. Please share availability, price and details. Product URL: ${currentUrl}`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textTemplate)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6" id="product-loading-skeleton">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-500 uppercase tracking-widest font-sans font-medium">Unveiling Masterpiece Details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6" id="product-not-found">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded p-8 text-center space-y-6">
          <Info className="w-12 h-12 text-stone-400 mx-auto" />
          <div className="space-y-2">
            <h2 className="font-serif text-2xl text-stone-900">Masterpiece Not Found</h2>
            <p className="text-sm text-stone-500 font-sans leading-relaxed">
              The premium jewellery selection you are seeking is either restricted, archived, or undergoing valuation updates.
            </p>
          </div>
          <div className="pt-2">
            <Link 
              to="/catalog"
              className="inline-flex h-11 px-8 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-bold tracking-widest uppercase rounded items-center gap-2 transition-colors w-full justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Return to Showroom</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Normalize image gallery items
  const galleryImages = (product.images && product.images.length > 0)
    ? product.images
    : [product.imageUrl || product.thumbnailUrl || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600'];

  const activeMainImage = galleryImages[activeImageIndex];

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8 font-sans" id={`showroom-product-detail-${product.id}`}>
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Dynamic Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-stone-500 tracking-wide font-medium" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-stone-900 transition-colors">Home</Link>
          <span className="text-stone-300">/</span>
          <Link to="/catalog" className="hover:text-stone-900 transition-colors">Catalogue</Link>
          <span className="text-stone-300">/</span>
          <span className="text-stone-800 font-semibold truncate max-w-[200px] sm:max-w-sm">{product.name}</span>
        </nav>

        {/* Core Product Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white border border-stone-200/80 rounded overflow-hidden p-4 sm:p-8">
          
          {/* Column A: Gallery Component (5/12 grid span) */}
          <div className="lg:col-span-5 space-y-4" id="gallery-split-pane">
            <div className="relative aspect-square bg-stone-100 border border-stone-100 rounded overflow-hidden group">
              {product.isPopular && (
                <span className="absolute top-4 left-4 z-10 bg-amber-600 text-stone-100 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-200" />
                  <span>SIGNATURE WORK</span>
                </span>
              )}
              
              {activeMainImage && (activeMainImage.toLowerCase().split('?')[0].endsWith('.mp4') || activeMainImage.toLowerCase().split('?')[0].endsWith('.mov') || activeMainImage.toLowerCase().split('?')[0].endsWith('.webm') || activeMainImage.toLowerCase().split('?')[0].endsWith('.m4v')) ? (
                <video 
                  src={activeMainImage} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  onEnded={(e) => {
                    e.currentTarget.currentTime = 0;
                    e.currentTarget.play().catch(() => {});
                  }}
                />
              ) : (
                <img 
                  src={getOptimizedShowroomUrl(activeMainImage, { width: 800, quality: 90 })} 
                  alt={`${product.name} main view`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="absolute inset-0 bg-stone-950/5 pointer-events-none" />
            </div>

            {/* Thumbnail Strip */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1" id="gallery-thumb-track">
                {galleryImages.map((imgUrl: string, idx: number) => {
                  const isActive = idx === activeImageIndex;
                  const isThumbVideo = imgUrl.toLowerCase().split('?')[0].endsWith('.mp4') || imgUrl.toLowerCase().split('?')[0].endsWith('.mov') || imgUrl.toLowerCase().split('?')[0].endsWith('.webm') || imgUrl.toLowerCase().split('?')[0].endsWith('.m4v');
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-20 aspect-square bg-stone-50 border-2 rounded overflow-hidden shrink-0 transition-all duration-300 cursor-pointer ${
                        isActive ? 'border-amber-600 bg-white shadow-sm' : 'border-stone-200 hover:border-stone-400'
                      }`}
                      aria-label={`View gallery image ${idx + 1}`}
                    >
                      {isThumbVideo ? (
                        <video 
                          src={imgUrl} 
                          className="w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="auto"
                          onEnded={(e) => {
                            e.currentTarget.currentTime = 0;
                            e.currentTarget.play().catch(() => {});
                          }}
                        />
                      ) : (
                        <img 
                          src={getOptimizedShowroomUrl(imgUrl, { width: 150, height: 150 })} 
                          alt={`${product.name} thumb ${idx + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Quality Seal Block */}
            <div className="p-4 bg-stone-50 border border-stone-200/60 rounded flex items-start gap-3 mt-2">
              <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Hallmarked & Certified Ornaments</h4>
                <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                  All Parasmoni gold products undergo rigorous Bureau of Indian Standards (BIS) Hallmark testing ensuring verified purity and genuine metal density.
                </p>
              </div>
            </div>
          </div>

          {/* Column B: Product Details Panel (7/12 grid span) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6" id="product-meta-panel">
            
            <div className="space-y-4">
              {/* Category, Collection, & Design Indicators */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] text-stone-500 font-bold uppercase tracking-widest bg-stone-100 px-2 py-0.5 rounded border border-stone-200/50">
                  <Layers className="w-3 h-3 text-stone-400" />
                  <span>{product.category || "Jewellery"}</span>
                </span>
                {product.collection && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 font-bold uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded border border-amber-200/30">
                    <Award className="w-3 h-3 text-amber-600" />
                    <span>{product.collection}</span>
                  </span>
                )}
              </div>

              {/* Title & SKU block */}
              <div>
                <h1 className="font-serif font-bold text-stone-900 text-2xl sm:text-3xl tracking-wide leading-tight">
                  {product.name}
                </h1>
                <div className="mt-1.5 flex items-center gap-2 text-xs font-medium text-stone-500">
                  <span className="uppercase text-[10px] tracking-widest text-stone-400">Design ID:</span>
                  <span className="font-mono bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded text-[11px]">{product.sku}</span>
                </div>
              </div>

              {/* Short description */}
              <p className="text-stone-600 text-sm leading-relaxed font-serif italic border-l-2 border-stone-300 pl-4 py-0.5">
                {product.shortDescription || product.description?.slice(0, 180) + '...'}
              </p>

              {/* Price section (ONLY shown if priceVisibility allows it) */}
              {(product.priceVisibility === true || product.priceVisibility === 'visible' || (product.price && product.priceVisibility !== false)) ? (
                <div className="bg-stone-50 border border-stone-200/70 rounded p-4 flex flex-col justify-center space-y-1 mt-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Estimated Showroom Price</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-stone-900">
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-stone-400 font-medium italic">(Tax and dynamic making charges apply)</span>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/50 border border-amber-500/10 rounded p-4 flex flex-col space-y-1 mt-2">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">Rate & Price Enquiry</span>
                  <p className="text-xs text-amber-900/80 leading-relaxed font-sans">
                    Price fluctuates daily based on certified gold bullion market indices. Click below to receive a personalized quote directly on WhatsApp.
                  </p>
                </div>
              )}

              {/* Spec Grid */}
              <div className="space-y-3" id="jeweller-specifications-table">
                <h3 className="text-xs font-bold text-stone-700 uppercase tracking-widest border-b border-stone-100 pb-1.5">Artisan Specifications</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                    <span className="text-stone-500 flex items-center gap-1.5 font-medium">
                      <Scale className="w-3.5 h-3.5 text-stone-400" />
                      <span>Gross Weight</span>
                    </span>
                    <span className="font-semibold text-stone-800">{product.grossWeight || "Available upon request"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                    <span className="text-stone-500 flex items-center gap-1.5 font-medium">
                      <Gem className="w-3.5 h-3.5 text-stone-400" />
                      <span>Metal / Purity</span>
                    </span>
                    <span className="font-semibold text-stone-800">{product.purity || product.metalType || "22K Gold"}</span>
                  </div>
                  {product.netGoldWeight && (
                    <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                      <span className="text-stone-500 flex items-center gap-1.5 font-medium">
                        <Scale className="w-3.5 h-3.5 text-stone-400" />
                        <span>Net Gold Portion</span>
                      </span>
                      <span className="font-semibold text-stone-800">{product.netGoldWeight}g</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                    <span className="text-stone-500 flex items-center gap-1.5 font-medium">
                      <Award className="w-3.5 h-3.5 text-stone-400" />
                      <span>Craft Legacy</span>
                    </span>
                    <span className="font-semibold text-stone-800">{product.collection || "Kolkata Traditional"}</span>
                  </div>
                </div>
              </div>

              {/* Long description text block */}
              {product.description && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-widest">Heritage & Craft Story</h4>
                  <p className="text-xs text-stone-600 leading-relaxed font-sans whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Tags Section */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <Tag className="w-3 h-3 text-stone-400 shrink-0 mr-1" />
                  {product.tags.map((tag: string, index: number) => (
                    <span 
                      key={index}
                      className="inline-block text-[10px] font-semibold text-stone-500 bg-stone-100 rounded-full px-2.5 py-0.5"
                    >
                      #{tag.replace(/^\s*#?/, '')}
                    </span>
                  ))}
                </div>
              )}

            </div>

            {/* NO BUY NOW BUTTON - Contact Us section */}
            <div className="pt-6 border-t border-stone-100 space-y-4" id="action-inquiry-deck">
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">Contact Showroom to Order or Customize</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* WhatsApp Enquiry Button */}
                <a
                  href={getWhatsAppEnquiryUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-stone-50 text-xs font-bold tracking-widest uppercase transition-colors rounded px-6 py-3.5 shadow-xs cursor-pointer w-full text-center"
                  id={`whatsapp-enquiry-${product.id}`}
                >
                  <MessageCircle className="w-4 h-4 shrink-0 text-white" />
                  <span>WhatsApp Enquiry</span>
                </a>

                {/* Call Now Button */}
                <a
                  href={`tel:${settings.contactNumber}`}
                  className="inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-bold tracking-widest uppercase transition-colors rounded px-6 py-3.5 cursor-pointer w-full text-center"
                  id={`phone-call-${product.id}`}
                >
                  <Phone className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>Call Now</span>
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* Section 2: Related Ornaments Showcase */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6 pt-6" id="showroom-related-curations">
            <div className="flex justify-between items-end border-b border-stone-200 pb-3">
              <div>
                <span className="text-[10px] text-amber-700 font-bold uppercase tracking-widest block">Artisan Collection</span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-950">Matching Signature Masterpieces</h2>
              </div>
              <Link 
                to="/catalog"
                className="text-stone-600 hover:text-amber-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                <span>Browse All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((p) => {
                const optimizedRelatedUrl = getOptimizedShowroomUrl(p.imageUrl, { width: 400, height: 400 });
                return (
                  <div 
                    key={p.id}
                    className="bg-white rounded border border-stone-200 overflow-hidden flex flex-col group hover:shadow-xs transition-shadow duration-300 relative"
                  >
                    <div className="relative aspect-square overflow-hidden bg-stone-50 border-b border-stone-100">
                      <img 
                        src={optimizedRelatedUrl} 
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">
                          {p.category}
                        </span>
                        <h4 className="font-serif font-bold text-stone-800 text-xs sm:text-sm tracking-wide leading-tight group-hover:text-amber-700 transition-colors line-clamp-1">
                          {p.name}
                        </h4>
                        <span className="text-[10px] font-mono text-stone-500">
                          SKU: {p.sku || 'PM-GEN'}
                        </span>
                      </div>
                      <Link 
                        to={`/products/${p.id}`}
                        className="w-full block text-center border border-stone-200 text-stone-700 hover:bg-stone-50 text-[10px] font-bold tracking-widest uppercase transition-colors rounded py-2"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
