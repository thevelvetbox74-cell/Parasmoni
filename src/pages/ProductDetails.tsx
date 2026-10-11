/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Giva & Mia App Style Premium Jewellery Product Details Page
 */

import React, { useState, useEffect, Component } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Phone, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
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
  Heart,
  Truck,
  RotateCcw,
  BadgePercent,
  MapPin,
  Clock,
  Share2,
  Calendar,
  Lock
} from 'lucide-react';
import { db, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs, doc, getDoc, query, where, limit } from 'firebase/firestore';
import { calculateProductPrice } from '../utils/calculateProductPrice';
import { getOptimizedShowroomUrl } from '../imagekit/client';
import { mockWebsiteSettings } from '../data/mockSettings';
import { mockProducts } from '../data/mockData';
import { isProductWishlisted, toggleWishlist } from '../utils/wishlistHelper';

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
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);

  // Accordion state
  const [openAccordion, setOpenAccordion] = useState<'specs' | 'description' | 'certificate' | 'delivery' | null>('specs');
  const [showPriceBreakdown, setShowPriceBreakdown] = useState<boolean>(false);

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
              grossWeight: mockMatch.approxWeight || (mockMatch as any).grossWeight || '24.50g',
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
            wastagePercent: Number(foundProduct.wastagePercent || 0),
            otherChargesName: foundProduct.otherChargesName,
            otherChargesAmount: foundProduct.otherChargesAmount,
            hallmarkCharge: foundProduct.hallmarkCharge,
            gstPercent: foundProduct.gstPercent
          }, metalPrices);

          foundProduct = {
            ...foundProduct,
            sku: foundProduct.sku || foundProduct.productCode || foundProduct.code || 'PM-NH-091',
            grossWeight: weight > 0 ? `${weight}g` : (foundProduct.approxWeight || '24.50g'),
            purity: priceInfo.metalName || foundProduct.purity || foundProduct.metalType || '22k (916 Hallmarked)',
            images: foundProduct.images || (foundProduct.imageUrl ? [foundProduct.imageUrl] : []),
            price: priceInfo.finalPrice > 0 ? priceInfo.finalPrice : Number(foundProduct.price || 142850),
            priceVisibility: foundProduct.priceVisibility !== undefined ? foundProduct.priceVisibility : true
          };
        }

        if (foundProduct) {
          foundProduct.name = foundProduct.productName || foundProduct.name || "Jewellery Masterpiece";
          setProduct(foundProduct);
          setIsWishlisted(isProductWishlisted(foundProduct.id));

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
            grossWeight: '24.50g',
            purity: '22k (916 BIS Hallmarked)',
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

  const handleToggleWishlist = () => {
    if (!product) return;
    const newState = toggleWishlist(product.id);
    setIsWishlisted(newState);
  };

  const getWhatsAppEnquiryUrl = () => {
    if (!product) return '#';
    const currentUrl = window.location.href;
    const cleanPhone = (settings.whatsappNumber || '919051412413').replace(/[^0-9]/g, '');
    const textTemplate = `Hello Parasmoni Jewellers, I am interested in this product on your app.
Product: ${product.name}
Design ID: ${product.sku || 'PM-NH-091'}
Weight: ${product.grossWeight || '24.50g'}
Purity: ${product.purity || '22K Gold'}
Product Link: ${currentUrl}`;
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
              className="inline-flex h-11 px-8 bg-[#6B1F2A] hover:bg-[#521720] text-stone-100 text-xs font-bold tracking-widest uppercase rounded-xl items-center gap-2 transition-colors w-full justify-center"
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

  // Dynamic values
  const productName = product.name || product.productName || "Traditional Filigree Gold Earrings";
  const designId = product.sku || product.productCode || "PM-NH-091";
  const ratingVal = product.rating || 4.9;
  const reviewCount = product.reviewCount || 18;
  const shortDesc = product.shortDescription || product.description || "Exquisitely handcrafted in certified 22K BIS Hallmarked gold featuring traditional Nakashi motifs, delicate drop filigree, and mirror-finished antique detailing.";
  const grossWeight = product.grossWeight || product.approxWeight || "24.50g";
  const purityVal = product.purity || product.metalType || "22K (916 BIS Hallmarked)";
  const craftLegacy = product.collection || product.craftLegacy || "Bespoke Bridal & Nakashi Collection";
  const formattedPrice = product.price ? Number(product.price).toLocaleString('en-IN') : "1,42,850";

  // Specs List for Giva/Mia Style Grid
  const specificationsList = [
    { label: "Net Gold Weight", value: grossWeight, icon: Scale },
    { label: "Metal / Purity", value: purityVal, icon: Gem },
    { label: "Hallmark Certification", value: "BIS 916 Stamped", icon: ShieldCheck },
    { label: "Jewellery Type", value: product.category || "Earrings", icon: Tag },
    { label: "Metal Color", value: "Yellow Gold", icon: Sparkles },
    { label: "Craftsmanship", value: "Handcrafted Nakashi & Filigree", icon: Award },
    { label: "Gender / Occasion", value: "Women • Festive / Bridal", icon: Calendar },
    { label: "Purity Guarantee", value: "100% Lifetime Guarantee", icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-3 sm:py-6 px-3 sm:px-6 lg:px-8 font-sans antialiased pb-28 md:pb-12" id={`product-details-${product.id}`}>
      <div className="w-full max-w-7xl mx-auto">
        
        {/* Core Product Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          
          {/* LEFT COLUMN: Unchanged Image Gallery */}
          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-20 lg:self-start w-full">
            
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 items-start w-full">
              
              {/* Thumbnails */}
              {galleryImages.length > 1 && (
                <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-[520px] w-full sm:w-20 shrink-0 scrollbar-none py-1 sm:py-0">
                  {galleryImages.map((imgUrl: string, idx: number) => {
                    const isActive = idx === activeImageIndex;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative aspect-square w-16 sm:w-full rounded-2xl overflow-hidden border-2 transition-all cursor-pointer bg-stone-100 shrink-0 ${
                          isActive ? 'border-[#6B1F2A] ring-2 ring-[#6B1F2A]/20 shadow-sm' : 'border-stone-200 hover:border-stone-400'
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

              {/* Main Image Showcase */}
              <div className="relative aspect-square w-full bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-xs flex-1">
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
                    src={getOptimizedShowroomUrl(activeMainImage, { width: 1200, quality: 95 })} 
                    alt={productName}
                    className="w-full h-full object-contain p-2"
                    referrerPolicy="no-referrer"
                  />
                )}

                {/* Floating Wishlist Icon on Image */}
                <button
                  onClick={handleToggleWishlist}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-md border border-stone-200 flex items-center justify-center transition-transform active:scale-90 cursor-pointer z-10"
                  aria-label="Wishlist"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-[#6B1F2A] text-[#6B1F2A]' : 'text-stone-500'}`} />
                </button>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: Giva & Mia App Style Optimized Details Section */}
          <div className="lg:col-span-6 space-y-5 w-full">
            
            {/* 1. App-Header Card: Title, Design ID & Rating */}
            <div className="bg-white border border-stone-200/80 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#6B1F2A] bg-[#6B1F2A]/10 px-2.5 py-0.5 rounded-full border border-[#6B1F2A]/20 inline-block mb-1.5">
                    22K BIS Hallmarked
                  </span>
                  <h1 className="font-sans font-bold text-xl sm:text-2xl text-stone-900 tracking-tight leading-snug">
                    {productName}
                  </h1>
                </div>
              </div>

              {/* Design ID & Verified Rating Summary */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
                <div className="flex items-center gap-1.5 font-sans text-stone-600">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">DESIGN ID:</span>
                  <span className="bg-stone-100 text-stone-800 px-2 py-0.5 rounded-md font-semibold border border-stone-200 text-[11px] font-sans">
                    {designId}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-amber-900 text-[11px] font-bold font-sans">
                  <div className="flex items-center text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  </div>
                  <span className="tabular-nums">{ratingVal}</span>
                  <span className="text-amber-700/80 font-normal">({reviewCount} Reviews)</span>
                </div>
              </div>
            </div>

            {/* 2. Transparent Pricing Card (Giva/Mia Style with Live Breakdown Toggle) */}
            <div className="bg-gradient-to-br from-white via-amber-50/30 to-white border border-amber-200/80 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-amber-800">
                  Estimated Showroom Price
                </span>
                
                <button
                  type="button"
                  onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                  className="text-[10px] font-bold text-[#6B1F2A] hover:underline flex items-center gap-1 cursor-pointer font-sans"
                >
                  <BadgePercent className="w-3.5 h-3.5" />
                  <span>{showPriceBreakdown ? 'Hide Price Breakup' : 'View Price Breakup'}</span>
                </button>
              </div>

              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl sm:text-3xl font-sans font-bold text-stone-900 tracking-tight tabular-nums">
                  ₹{formattedPrice}
                </span>
                <span className="text-[10px] text-stone-500 font-sans">
                  (Incl. Tax & Live Gold Bullion Rate)
                </span>
              </div>

              {/* Price Breakup Drawer (Giva/Mia Style) */}
              {showPriceBreakdown && (
                <div className="pt-3 border-t border-amber-200/60 space-y-2 text-xs font-sans animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-700 bg-white p-3 rounded-2xl border border-stone-200/80 shadow-2xs font-sans">
                    <div className="flex justify-between py-0.5">
                      <span className="text-stone-500">Net Gold Weight:</span>
                      <span className="font-bold tabular-nums">{grossWeight}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-stone-500">Gold Rate Purity:</span>
                      <span className="font-bold tabular-nums">22K (916)</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-stone-500">Making Charges:</span>
                      <span className="font-bold text-emerald-700">Artisanal Rate</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-stone-500">GST:</span>
                      <span className="font-bold tabular-nums">3% Included</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Giva & Mia Style 4-Grid Service & Trust Pillars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-white border border-stone-200/80 rounded-2xl p-3 text-center space-y-1 shadow-2xs">
                <ShieldCheck className="w-5 h-5 text-[#6B1F2A] mx-auto" />
                <h4 className="text-[10px] font-sans font-bold text-stone-900 uppercase">100% BIS Hallmarked</h4>
                <p className="text-[9px] text-stone-500 font-sans">Verified Pure Gold</p>
              </div>

              <div className="bg-white border border-stone-200/80 rounded-2xl p-3 text-center space-y-1 shadow-2xs">
                <RotateCcw className="w-5 h-5 text-[#6B1F2A] mx-auto" />
                <h4 className="text-[10px] font-sans font-bold text-stone-900 uppercase">Lifetime Exchange</h4>
                <p className="text-[9px] text-stone-500 font-sans">100% Metal Value</p>
              </div>

              <div className="bg-white border border-stone-200/80 rounded-2xl p-3 text-center space-y-1 shadow-2xs">
                <Truck className="w-5 h-5 text-[#6B1F2A] mx-auto" />
                <h4 className="text-[10px] font-sans font-bold text-stone-900 uppercase">Insured Pick-Up</h4>
                <p className="text-[9px] text-stone-500 font-sans">Safe Showroom Visit</p>
              </div>

              <div className="bg-white border border-stone-200/80 rounded-2xl p-3 text-center space-y-1 shadow-2xs">
                <Award className="w-5 h-5 text-[#6B1F2A] mx-auto" />
                <h4 className="text-[10px] font-sans font-bold text-stone-900 uppercase">Legacy Since 1974</h4>
                <p className="text-[9px] text-stone-500 font-sans">50+ Yrs Trust</p>
              </div>
            </div>

            {/* 4. Giva / Mia Style Interactive Accordion Sections */}
            <div className="bg-white border border-stone-200/80 rounded-3xl divide-y divide-stone-100 overflow-hidden shadow-xs">
              
              {/* Accordion 1: Product Specifications Table */}
              <div>
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === 'specs' ? null : 'specs')}
                  className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 font-sans font-bold text-xs uppercase tracking-wider text-stone-900">
                    <Scale className="w-4 h-4 text-[#6B1F2A]" />
                    <span>PRODUCT SPECIFICATIONS & WEIGHT</span>
                  </div>
                  {openAccordion === 'specs' ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                </button>

                {openAccordion === 'specs' && (
                  <div className="px-5 pb-5 pt-1 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
                      {specificationsList.map((spec, idx) => {
                        const IconComponent = spec.icon;
                        return (
                          <div key={idx} className="flex items-center justify-between py-1.5 border-b border-stone-200/60 last:border-none">
                            <span className="text-stone-500 flex items-center gap-1.5 text-[11px] font-sans">
                              <IconComponent className="w-3.5 h-3.5 text-stone-400" />
                              <span>{spec.label}:</span>
                            </span>
                            <span className="font-bold text-stone-900 text-[11px] font-sans tabular-nums">{spec.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 2: Detailed Description & Story */}
              <div>
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === 'description' ? null : 'description')}
                  className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 font-sans font-bold text-xs uppercase tracking-wider text-stone-900">
                    <Sparkles className="w-4 h-4 text-[#6B1F2A]" />
                    <span>DESCRIPTION & CRAFT STORY</span>
                  </div>
                  {openAccordion === 'description' ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                </button>

                {openAccordion === 'description' && (
                  <div className="px-5 pb-5 pt-1 text-xs text-stone-700 leading-relaxed space-y-3 font-sans animate-in fade-in duration-200">
                    <p>{shortDesc}</p>
                    <p className="text-stone-500 italic text-[11px]">
                      Every ornament in our showroom is meticulously hand-sculpted by master Bengali karigars carrying forward 50+ years of heritage filigree tradition.
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion 3: Hallmark & Certification Guarantee */}
              <div>
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === 'certificate' ? null : 'certificate')}
                  className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 font-sans font-bold text-xs uppercase tracking-wider text-stone-900">
                    <ShieldCheck className="w-4 h-4 text-[#6B1F2A]" />
                    <span>BIS HALLMARK & CERTIFICATION</span>
                  </div>
                  {openAccordion === 'certificate' ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                </button>

                {openAccordion === 'certificate' && (
                  <div className="px-5 pb-5 pt-1 text-xs text-stone-700 leading-relaxed space-y-2 font-sans animate-in fade-in duration-200">
                    <p>
                      This ornament features laser-etched Bureau of Indian Standards (BIS) Hallmark numbers (including BIS Logo, Purity 916 mark, and Karigar identity code).
                    </p>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] font-semibold flex items-center gap-2 font-sans">
                      <Award className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>100% Certified Pure Gold • Free Showroom Purity Testing</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 4: Showroom Visit & Consultation */}
              <div>
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === 'delivery' ? null : 'delivery')}
                  className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 font-sans font-bold text-xs uppercase tracking-wider text-stone-900">
                    <MapPin className="w-4 h-4 text-[#6B1F2A]" />
                    <span>SHOWROOM VISIT & TRY-AT-HOME</span>
                  </div>
                  {openAccordion === 'delivery' ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                </button>

                {openAccordion === 'delivery' && (
                  <div className="px-5 pb-5 pt-1 text-xs text-stone-700 leading-relaxed space-y-2 font-sans animate-in fade-in duration-200">
                    <p>
                      Visit our physical showroom to try this masterpiece in person or schedule a live video call consultation with our jewellery experts.
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-stone-600 font-sans">
                      <Clock className="w-3.5 h-3.5 text-[#6B1F2A]" />
                      <span>Showroom Hours: 10:00 AM - 8:00 PM Daily</span>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* 5. Giva / Mia Style Primary Action Deck (Showroom Enquiry + Call) */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="app-action-deck">
                {/* WHATSAPP / SHOWROOM ENQUIRY BUTTON */}
                <a
                  href={getWhatsAppEnquiryUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#6B1F2A] hover:bg-[#521720] text-white text-xs font-bold uppercase tracking-wider py-3.5 px-5 rounded-2xl shadow-md transition-transform active:scale-98 cursor-pointer"
                  id={`whatsapp-btn-${product.id}`}
                >
                  <MessageCircle className="w-4 h-4 fill-white text-[#6B1F2A]" />
                  <span>INQUIRE / BOOK VISIT</span>
                </a>

                {/* CALL SHOWROOM BUTTON */}
                <a
                  href={`tel:${settings.contactNumber || '+913322419876'}`}
                  className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-wider py-3.5 px-5 rounded-2xl shadow-md transition-transform active:scale-98 cursor-pointer"
                  id={`call-btn-${product.id}`}
                >
                  <Phone className="w-4 h-4 text-white" />
                  <span>CALL SHOWROOM DESK</span>
                </a>
              </div>
            </div>

            {/* 6. Ratings & Reviews Section */}
            <div className="bg-white border border-stone-200/80 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-stone-900">
                  CUSTOMER REVIEWS & RATINGS
                </h3>

                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="text-[11px] font-bold text-[#6B1F2A] hover:underline flex items-center gap-1 cursor-pointer font-sans"
                >
                  <span>Write Review</span>
                  <Sparkles className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200/60 font-sans">
                <div className="text-center shrink-0 pr-4 border-r border-stone-200">
                  <span className="text-3xl font-sans font-extrabold text-stone-900 block leading-none tabular-nums">{ratingVal}</span>
                  <div className="flex items-center justify-center text-amber-500 my-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3 h-3 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <span className="text-[10px] text-stone-500 font-sans">{reviewCount} Verified Ratings</span>
                </div>

                <div className="flex-1 space-y-1.5 text-[10px] font-sans">
                  <div className="flex items-center gap-2">
                    <span className="w-8 text-stone-500">5 ★</span>
                    <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full w-[85%]" />
                    </div>
                    <span className="w-6 text-stone-400 tabular-nums">85%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 text-stone-500">4 ★</span>
                    <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full w-[12%]" />
                    </div>
                    <span className="w-6 text-stone-400 tabular-nums">12%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 text-stone-500">3 ★</span>
                    <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full w-[3%]" />
                    </div>
                    <span className="w-6 text-stone-400 tabular-nums">3%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. Matching Related Products Carousel */}
            {relatedProducts.length > 0 && (
              <div className="space-y-3 pt-2 font-sans">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-stone-900">
                    MATCHING RECOMMENDATIONS
                  </h3>
                  <Link to="/catalog" className="text-[10px] font-bold text-[#6B1F2A] hover:underline">
                    View All →
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {relatedProducts.slice(0, 2).map((relP) => (
                    <Link
                      key={relP.id}
                      to={`/product/${relP.slug || relP.id}`}
                      className="bg-white border border-stone-200/80 rounded-2xl p-2.5 shadow-2xs group hover:shadow-md transition-all block font-sans"
                    >
                      <div className="aspect-square rounded-xl bg-stone-100 overflow-hidden mb-2">
                        <img 
                          src={getOptimizedShowroomUrl(relP.imageUrl, { width: 300, height: 300 })} 
                          alt={relP.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h4 className="font-medium text-stone-900 text-xs truncate">{relP.name}</h4>
                      <p className="text-[10px] text-[#6B1F2A] font-bold font-sans tabular-nums mt-0.5">
                        ₹{Number(relP.price || 125000).toLocaleString('en-IN')}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Write Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-stone-300 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-stone-900">
            <button
              type="button"
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
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 outline-none focus:border-[#6B1F2A]"
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
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 outline-none focus:border-[#6B1F2A] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#6B1F2A] hover:bg-[#521720] text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl shadow-xs transition-colors cursor-pointer"
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
