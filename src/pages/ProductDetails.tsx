/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Component } from 'react';
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
  Tag,
  Star,
  X,
  Check,
  Edit3
} from 'lucide-react';
import { db, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs, doc, getDoc, query, where, limit } from 'firebase/firestore';
import { calculateProductPrice } from '../utils/calculateProductPrice';
import { getOptimizedShowroomUrl } from '../imagekit/client';
import { mockWebsiteSettings } from '../data/mockSettings';
import { mockProducts } from '../data/mockData';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class DetailsErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Product Details Error Boundary caught an exception:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-6 shadow-xs">
            <Info className="w-12 h-12 text-stone-400 mx-auto" />
            <div className="space-y-2">
              <h2 className="font-serif text-2xl text-stone-900 font-bold">Something Went Wrong</h2>
              <p className="text-sm text-stone-500 font-sans leading-relaxed">
                An error occurred while loading this masterpiece's specifications.
              </p>
              {this.state.error && (
                <pre className="mt-2 p-3 bg-red-50 text-red-700 text-left text-[10px] font-mono rounded overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              )}
            </div>
            <div className="pt-2">
              <Link 
                to="/catalog"
                className="inline-flex h-11 px-8 bg-[#6B1F2A] hover:bg-[#521720] text-stone-100 text-xs font-bold tracking-widest uppercase rounded-xl items-center gap-2 transition-colors w-full justify-center"
              >
                <span>Return to Showroom</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ProductDetails(): React.JSX.Element {
  return (
    <DetailsErrorBoundary>
      <ProductDetailsInner />
    </DetailsErrorBoundary>
  );
}

function ProductDetailsInner(): React.JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  // State variables
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [settings, setSettings] = useState<any>(mockWebsiteSettings);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewAuthor, setReviewAuthor] = useState<string>('');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);

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

        const productsCol = collection(db, 'products');
        const slugQuery = query(productsCol, where('slug', '==', slug), limit(1));
        const slugSnapshot = await getDocs(slugQuery);
        
        let foundProduct: any = null;

        if (!slugSnapshot.empty) {
          const firstDoc = slugSnapshot.docs[0];
          foundProduct = { id: firstDoc.id, ...firstDoc.data() };
        } else {
          try {
            const docRef = doc(db, 'products', slug);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              foundProduct = { id: docSnap.id, ...docSnap.data() };
            }
          } catch (e) {
            // Document reference query fallback
          }
        }

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
              grossWeight: mockMatch.approxWeight || (mockMatch as any).grossWeight || '64.2g',
              purity: (mockMatch as any).purity || '22k',
              images: (mockMatch as any).images || [mockMatch.imageUrl]
            };
          }
        } else {
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
            sku: foundProduct.sku || foundProduct.productCode || foundProduct.code || 'PM-NH-091',
            grossWeight: weight > 0 ? `${weight}g` : (foundProduct.approxWeight || '64.2g'),
            purity: priceInfo.metalName || foundProduct.purity || foundProduct.metalType || '22k',
            images: foundProduct.images || (foundProduct.imageUrl ? [foundProduct.imageUrl] : []),
            price: priceInfo.finalPrice > 0 ? priceInfo.finalPrice : Number(foundProduct.price || 125000),
            priceVisibility: foundProduct.priceVisibility !== undefined ? foundProduct.priceVisibility : true
          };
        }

        if (foundProduct) {
          setProduct(foundProduct);
          
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
        const mockMatch = mockProducts.find(p => {
          const computedSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          return computedSlug === slug || p.id === slug;
        });
        if (mockMatch) {
          const computedSlug = mockMatch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          setProduct({
            ...mockMatch,
            slug: computedSlug,
            grossWeight: '64.2g',
            purity: '22k',
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

  const getWhatsAppEnquiryUrl = () => {
    if (!product) return '#';
    const currentUrl = window.location.href;
    const cleanPhone = (settings.whatsappNumber || '919051412413').replace(/[^0-9]/g, '');
    const textTemplate = `Hello Parasmoni Jewellers, I am interested in this jewellery product. Product: ${product.name}, Design ID: ${product.sku || 'PM-NH-091'}. Please share availability and customization options. Product Link: ${currentUrl}`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textTemplate)}`;
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setReviewSubmitted(true);
    setTimeout(() => {
      setShowReviewModal(false);
      setReviewSubmitted(false);
      setReviewComment('');
      setReviewAuthor('');
    }, 1800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6" id="product-loading-skeleton">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-500 uppercase tracking-widest font-sans font-medium">Unveiling Masterpiece Details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6" id="product-not-found">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-6 shadow-xs">
          <Info className="w-12 h-12 text-stone-400 mx-auto" />
          <div className="space-y-2">
            <h2 className="font-serif text-2xl text-stone-900 font-bold">Masterpiece Not Found</h2>
            <p className="text-sm text-stone-500 font-sans leading-relaxed">
              The premium jewellery selection you are seeking is either restricted, archived, or undergoing valuation updates.
            </p>
          </div>
          <div className="pt-2">
            <Link 
              to="/catalog"
              className="inline-flex h-11 px-8 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-bold tracking-widest uppercase rounded-xl items-center gap-2 transition-colors w-full justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Return to Showroom</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Normalize image gallery items from uploaded product data
  let galleryImages: string[] = [];
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    galleryImages = product.images.filter((img: any) => typeof img === 'string' && img.trim() !== '');
  } else if (typeof product.images === 'string' && product.images.trim() !== '') {
    galleryImages = [product.images];
  } else if (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.trim() !== '') {
    galleryImages = [product.imageUrl];
  }

  if (galleryImages.length === 0) {
    galleryImages = [
      product.thumbnailUrl || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600'
    ];
  }

  const activeMainImage = galleryImages[activeImageIndex] || galleryImages[0];

  // Dynamic values or image.png fallbacks
  const productName = product.name || "Laxmi Pendant Sita-Har Necklace";
  const designId = product.sku || product.productCode || "PM-NH-091";
  
  // Dynamic rating & reviews calculation - strictly from data entered during product listing or customer reviews
  const rawRating = product.rating !== undefined && product.rating !== null && product.rating !== '' ? Number(product.rating) : 0;
  const rawReviewsCount = product.reviewsCount !== undefined && product.reviewsCount !== null && product.reviewsCount !== '' 
    ? Number(product.reviewsCount) 
    : (Array.isArray(product.reviews) ? product.reviews.length : 0);

  const ratingVal = !isNaN(rawRating) && rawRating > 0 ? rawRating : 0;
  const reviewCount = !isNaN(rawReviewsCount) && rawReviewsCount > 0 ? rawReviewsCount : 0;

  const shortDesc = product.shortDescription || product.description || "A breathtaking long Sita-Har necklace handcrafted in pure 22K gold, featuring a central Laxmi pendant, delicate chain linkages, and intricate nakashi work.";
  const grossWeight = product.grossWeight || product.approxWeight || "64.2g";
  const purityVal = product.purity || product.metalType || "22k";
  const craftLegacy = product.collection || product.craftLegacy || "col-2";
  const formattedPrice = product.price ? Number(product.price).toLocaleString('en-IN') : "1,25,000";

  // Parse tags
  let tagsArray: string[] = [];
  if (product.tags && Array.isArray(product.tags)) {
    tagsArray = product.tags.filter((t: any) => typeof t === 'string' && t.trim() !== '');
  } else if (typeof product.tags === 'string' && product.tags.trim() !== '') {
    tagsArray = product.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '');
  }
  if (tagsArray.length === 0) {
    tagsArray = ["Parasmoni", "22KGold", "SitaHar", "NakashiWork"];
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-6 sm:py-8 px-4 sm:px-8 lg:px-12 font-sans" id={`product-details-${product.id}`}>
      <div className="w-full max-w-[1536px] mx-auto space-y-6 sm:space-y-8">
        
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-stone-500 tracking-wide font-medium overflow-x-auto whitespace-nowrap pb-1" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-stone-900 transition-colors">Home</Link>
          <span className="text-stone-300">/</span>
          <Link to="/catalog" className="hover:text-stone-900 transition-colors">Catalogue</Link>
          <span className="text-stone-300">/</span>
          <span className="text-stone-800 font-semibold truncate max-w-[200px] sm:max-w-md">{productName}</span>
        </nav>

        {/* Core Product Grid (2 Column Split with Locked Sticky Left Image Section & Expanded Right Column) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* LEFT COLUMN: Completely Fixed/Sticky Image Gallery (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-20 lg:self-start z-10">
            
            {/* Gallery Flex Row: Thumbnails on the LEFT, Main Image on the RIGHT */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 items-start w-full">
              
              {/* Thumbnail List (LEFT SIDE on Desktop) */}
              {galleryImages.length > 1 && (
                <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-[620px] w-full sm:w-20 lg:w-24 shrink-0 no-scrollbar py-1 sm:py-0">
                  {galleryImages.map((imgUrl: string, idx: number) => {
                    const isActive = idx === activeImageIndex;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative aspect-square w-16 sm:w-full rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-stone-100 shrink-0 ${
                          isActive ? 'border-amber-700 ring-2 ring-amber-700/20 shadow-sm' : 'border-stone-300 hover:border-stone-400'
                        }`}
                      >
                        <img 
                          src={getOptimizedShowroomUrl(imgUrl, { width: 250, height: 250 })} 
                          alt={`${productName} thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Main Showcase Image (Enlarged) */}
              <div className="relative aspect-square w-full max-h-[620px] bg-stone-200/60 rounded-2xl overflow-hidden border border-stone-300/80 shadow-xs flex-1">
                {activeMainImage && (activeMainImage.toLowerCase().split('?')[0].endsWith('.mp4') || activeMainImage.toLowerCase().split('?')[0].endsWith('.mov') || activeMainImage.toLowerCase().split('?')[0].endsWith('.webm')) ? (
                  <video 
                    src={activeMainImage} 
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img 
                    src={getOptimizedShowroomUrl(activeMainImage, { width: 1200, quality: 92 })} 
                    alt={productName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

            </div>

            {/* Hallmarked & Certified Ornaments Card (Matching image.png) */}
            <div className="bg-[#F5EFE6] border border-[#E3D9C9] rounded-xl p-4 sm:p-4.5 flex items-start gap-3.5 shadow-xs w-full">
              <div className="w-9 h-9 rounded-full bg-amber-600/10 border border-amber-600/30 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-amber-800" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-900">
                  HALLMARKED & CERTIFIED ORNAMENTS
                </h4>
                <p className="text-[11px] text-stone-600 leading-relaxed font-sans font-medium">
                  All Parasmoni gold products undergo rigorous Bureau of Indian Standards (BIS) Hallmark testing ensuring verified purity and genuine metal density.
                </p>
              </div>
            </div>

          </div>


          {/* RIGHT COLUMN: Scrollable Metadata & Action Deck (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-5 sm:space-y-6 w-full">
            
            {/* 1. Product Title */}
            <div>
              <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 tracking-wide leading-snug">
                {productName}
              </h1>

              {/* Design ID & Rating Row */}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/60 pb-3">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span className="uppercase text-[10px] font-bold text-stone-700 tracking-widest font-sans">
                    DESIGN ID:
                  </span>
                  <span className="font-mono bg-[#F5EFE6] text-stone-800 px-2 py-0.5 rounded text-[11px] font-semibold border border-[#E3D9C9]">
                    {designId}
                  </span>
                </div>

                {/* Dynamic Star Ratings (Shows exact listing rating or 0 if unrated) */}
                <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold">
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-3.5 h-3.5 ${
                          ratingVal > 0 && star <= Math.round(ratingVal) 
                            ? 'fill-amber-500 text-amber-500' 
                            : 'text-stone-300 fill-stone-200'
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="text-stone-800 font-bold">[{ratingVal}]</span>
                  <span className="text-stone-500 font-medium">({reviewCount})</span>
                </div>
              </div>
            </div>

            {/* 2. Italic Highlight Quote Box */}
            <div className="bg-[#F8F4EE] border border-[#E8DFC0] rounded-xl p-3.5 text-stone-700 font-serif italic text-xs leading-relaxed w-full">
              "{shortDesc}"
            </div>

            {/* 3. Estimated Showroom Price Box (Matching 2nd Uploaded Image Number Font) */}
            <div className="bg-[#F5EFE6] border border-[#E5DDD0] rounded-xl p-4 space-y-1 w-full">
              <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block font-sans">
                ESTIMATED SHOWROOM PRICE
              </span>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold font-sans text-stone-900 tracking-tight">
                  ₹{formattedPrice}
                </span>
                <span className="text-[10px] text-stone-500 font-medium italic font-sans">
                  (Tax and dynamic making charges apply)
                </span>
              </div>
            </div>

            {/* 4. Artisan Specifications Section */}
            <div className="space-y-3 pt-1">
              <div className="border-t border-b border-stone-200/80 py-2">
                <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-900">
                  ARTISAN SPECIFICATIONS
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500 flex items-center gap-1.5 font-medium">
                    <Scale className="w-3.5 h-3.5 text-stone-400" />
                    <span>Gross Weight</span>
                  </span>
                  <span className="font-bold text-stone-900 font-mono">{grossWeight}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500 flex items-center gap-1.5 font-medium">
                    <Gem className="w-3.5 h-3.5 text-stone-400" />
                    <span>Metal / Purity</span>
                  </span>
                  <span className="font-bold text-stone-900">{purityVal}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-stone-100 col-span-2 sm:col-span-1">
                  <span className="text-stone-500 flex items-center gap-1.5 font-medium">
                    <Award className="w-3.5 h-3.5 text-stone-400" />
                    <span>Craft Legacy</span>
                  </span>
                  <span className="font-bold text-stone-900">{craftLegacy}</span>
                </div>
              </div>
            </div>

            {/* 5. Heritage & Craft Story Section */}
            <div className="space-y-2 pt-1">
              <div className="border-t border-b border-stone-200/80 py-2">
                <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-900">
                  HERITAGE & CRAFT STORY
                </h3>
              </div>

              <p className="text-xs text-stone-700 leading-relaxed font-sans">
                {shortDesc}
              </p>

              {/* Hashtags Line */}
              <div className="flex items-center gap-1.5 pt-1 text-xs text-stone-500">
                <Tag className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="font-mono text-[11px] text-stone-600 uppercase font-medium">
                  {tagsArray.map(t => `#${t.replace(/^#/, '')}`).join(' ')}
                </span>
              </div>
            </div>

            {/* 6. Order or Customize from Showroom Section */}
            <div className="space-y-3 pt-2">
              <div className="border-t border-stone-200/80 pt-3">
                <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-900 mb-3">
                  ORDER OR CUSTOMIZE FROM SHOWROOM
                </h3>
              </div>

              {/* Action Buttons: WhatsApp Enquiry (Red) + Call Now (Outline/Dark) */}
              <div className="space-y-2.5" id="enquiry-actions">
                {/* WHATSAPP ENQUIRY BUTTON */}
                <a
                  href={getWhatsAppEnquiryUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2.5 bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-xs transition-all cursor-pointer active:scale-[0.99]"
                  id={`whatsapp-btn-${product.id}`}
                >
                  <MessageCircle className="w-4 h-4 fill-white text-[#b91c1c]" />
                  <span>WHATSAPP ENQUIRY</span>
                </a>

                {/* CALL NOW BUTTON */}
                <a
                  href={`tel:${settings.contactNumber || '+913322419876'}`}
                  className="w-full flex items-center justify-center gap-2.5 bg-[#FAF7F2] hover:bg-stone-200/60 border-2 border-stone-800 text-stone-900 text-xs font-bold uppercase tracking-wider py-3 px-6 rounded-xl transition-all cursor-pointer active:scale-[0.99]"
                  id={`call-btn-${product.id}`}
                >
                  <Phone className="w-4 h-4 text-stone-800" />
                  <span>CALL NOW</span>
                </a>
              </div>
            </div>

            {/* 7. Ratings & Reviews Section */}
            <div className="space-y-3 pt-2">
              <div className="border-t border-stone-200/80 pt-3">
                <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-900 mb-3">
                  RATINGS & REVIEWS
                </h3>
              </div>

              {/* Write A Review Button */}
              <button
                onClick={() => setShowReviewModal(true)}
                className="w-full relative flex items-center justify-center bg-[#F8F4EE] hover:bg-[#F2ECE2] border border-stone-800 rounded-xl py-3 px-6 text-stone-900 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer group shadow-xs"
              >
                <span>WRITE A REVIEW</span>
                <div className="absolute right-3.5 bottom-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600 transition-colors" />
                </div>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Interactive Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-stone-300 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {reviewSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-lg text-stone-900">Review Submitted!</h3>
                <p className="text-xs text-stone-600">
                  Thank you for sharing your experience with Parasmoni Jewellers.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="font-serif font-bold text-lg text-stone-900">Write a Review</h3>
                  <p className="text-xs text-stone-500 font-sans">
                    Rate your experience with {productName}
                  </p>
                </div>

                {/* Rating Stars Selection */}
                <div className="flex justify-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`w-6 h-6 ${
                          star <= reviewRating 
                            ? 'fill-amber-500 text-amber-500' 
                            : 'text-stone-300'
                        }`} 
                      />
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">Your Name</label>
                  <input
                    type="text"
                    required
                    value={reviewAuthor}
                    onChange={(e) => setReviewAuthor(e.target.value)}
                    placeholder="e.g. Smt. Sunita Das"
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 outline-none focus:border-amber-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">Your Feedback</label>
                  <textarea
                    required
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your thoughts on the craftsmanship, purity, and finish..."
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 outline-none focus:border-amber-600 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#991b1b] hover:bg-[#801616] text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Submit Review
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
