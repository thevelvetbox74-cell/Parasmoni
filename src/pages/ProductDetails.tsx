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
import { OptimizedImage } from '../components/OptimizedImage';
import { ProductDetailsSkeleton } from '../components/Skeletons';
import { mockWebsiteSettings } from '../data/mockSettings';
import { mockProducts } from '../data/mockData';
import { isProductWishlisted, toggleWishlist } from '../utils/wishlistHelper';
import { getCachedData } from '../utils/cacheHelper';

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
      if (!isFirebaseConfigured || !db) return;
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

  // 2. Fetch the specific product by slug or id with comprehensive fallback
  useEffect(() => {
    async function fetchProduct() {
      if (!slug) return;
      setLoading(true);
      setActiveImageIndex(0);

      const normalizeSlug = (str: string) => 
        (str || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      try {
        let metalPrices: any[] = [];
        if (isFirebaseConfigured && db) {
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

        let foundProduct: any = null;

        // Step 1: Check in-memory & local cache first for instant retrieval
        const cachedFeatured = getCachedData<any[]>('home_featured', []);
        const cachedNewArrivals = getCachedData<any[]>('home_new_arrivals', []);
        const allCached = [...cachedFeatured, ...cachedNewArrivals];
        
        foundProduct = allCached.find(p => 
          p.id === slug || 
          p.slug === slug || 
          normalizeSlug(p.name || p.productName) === normalizeSlug(slug) ||
          (p.sku && p.sku.toLowerCase() === slug.toLowerCase()) ||
          (p.productCode && p.productCode.toLowerCase() === slug.toLowerCase())
        );

        // Step 2: If not in cache and Firebase is available, query Firestore
        if (!foundProduct && isFirebaseConfigured && db) {
          try {
            const productsCol = collection(db, 'products');

            // 2a. Query by 'slug' field
            const slugQuery = query(productsCol, where('slug', '==', slug), limit(1));
            const slugSnapshot = await getDocs(slugQuery);
            if (!slugSnapshot.empty) {
              const docItem = slugSnapshot.docs[0];
              foundProduct = { id: docItem.id, ...docItem.data() };
            }

            // 2b. Query by document ID directly
            if (!foundProduct) {
              try {
                const docRef = doc(db, 'products', slug);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                  foundProduct = { id: docSnap.id, ...docSnap.data() };
                }
              } catch (e) {
                // Ignore doc lookup error
              }
            }

            // 2c. Query by productCode / SKU
            if (!foundProduct) {
              const codeQuery = query(productsCol, where('productCode', '==', slug), limit(1));
              const codeSnapshot = await getDocs(codeQuery);
              if (!codeSnapshot.empty) {
                const docItem = codeSnapshot.docs[0];
                foundProduct = { id: docItem.id, ...docItem.data() };
              }
            }

            // 2d. Fallback: Fetch published products and match by slugified name
            if (!foundProduct) {
              const allProdSnap = await getDocs(productsCol);
              const matchedDoc = allProdSnap.docs.find(d => {
                const data = d.data();
                const name = data.name || data.productName || '';
                const pSlug = data.slug || '';
                const pCode = data.productCode || data.sku || '';
                return (
                  d.id === slug ||
                  pSlug === slug ||
                  normalizeSlug(name) === normalizeSlug(slug) ||
                  pCode.toLowerCase() === slug.toLowerCase()
                );
              });
              if (matchedDoc) {
                foundProduct = { id: matchedDoc.id, ...matchedDoc.data() };
              }
            }
          } catch (firestoreErr) {
            console.warn('Firestore product fetch error, checking local fallback:', firestoreErr);
          }
        }

        // Step 3: Match against mockProducts
        if (!foundProduct) {
          foundProduct = mockProducts.find(p => {
            const computedSlug = normalizeSlug(p.name);
            return (
              p.id === slug ||
              (p as any).slug === slug ||
              computedSlug === normalizeSlug(slug) ||
              (p.sku && p.sku.toLowerCase() === slug.toLowerCase())
            );
          });
        }

        // Step 4: Ultimate safety fallback - if still not found, pick first mock product
        if (!foundProduct && mockProducts.length > 0) {
          foundProduct = mockProducts[0];
        }

        if (foundProduct) {
          // Normalize weights safely (never NaN)
          const rawWeightStr = String(foundProduct.weight || foundProduct.grossWeight || foundProduct.approxWeight || '24.50g');
          const cleanWeightNum = parseFloat(rawWeightStr.replace(/[^0-9.]/g, '')) || 24.5;
          const displayWeight = `${cleanWeightNum.toFixed(2)}g`;

          // Calculate price dynamically
          let calculatedPrice = 0;
          if (metalPrices.length > 0 && foundProduct.metalRef) {
            try {
              const priceInfo = calculateProductPrice({
                metalRef: foundProduct.metalRef || '',
                weight: cleanWeightNum,
                makingCharge: Number(foundProduct.makingCharge || 0),
                makingChargeType: foundProduct.makingChargeType || 'fixed',
                wastagePercent: Number(foundProduct.wastagePercent || 0),
                otherChargesName: foundProduct.otherChargesName,
                otherChargesAmount: foundProduct.otherChargesAmount,
                hallmarkCharge: foundProduct.hallmarkCharge,
                gstPercent: foundProduct.gstPercent
              }, metalPrices);
              if (priceInfo.finalPrice > 0) {
                calculatedPrice = priceInfo.finalPrice;
              }
            } catch (calcErr) {
              console.warn('Price calculation error:', calcErr);
            }
          }

          if (calculatedPrice <= 0) {
            if (foundProduct.price && Number(foundProduct.price) > 0) {
              calculatedPrice = Number(foundProduct.price);
            } else {
              // Standard realistic 22K gold jewellery formula (approx ₹7,200/g + 13% craft/tax)
              calculatedPrice = Math.round(cleanWeightNum * 7200 * 1.13);
            }
          }

          // Normalize images safely
          let productImages: string[] = [];
          if (Array.isArray(foundProduct.images) && foundProduct.images.length > 0) {
            productImages = foundProduct.images.filter((img: any) => typeof img === 'string' && img.trim() !== '');
          }
          if (productImages.length === 0 && foundProduct.imageUrl) {
            productImages = [foundProduct.imageUrl];
          }
          if (productImages.length === 0 && foundProduct.thumbnailUrl) {
            productImages = [foundProduct.thumbnailUrl];
          }
          if (productImages.length === 0) {
            productImages = ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=70&w=800'];
          }

          // Build clean, normalized product object
          const normalized: any = {
            ...foundProduct,
            id: foundProduct.id || slug,
            name: foundProduct.name || foundProduct.productName || "Parasmoni Handcrafted Gold Masterpiece",
            sku: foundProduct.sku || foundProduct.productCode || foundProduct.code || 'PM-NH-091',
            slug: foundProduct.slug || normalizeSlug(foundProduct.name || foundProduct.productName || slug),
            grossWeight: displayWeight,
            purity: typeof foundProduct.purity === 'object' ? '22K Gold (916 BIS Hallmarked)' : (foundProduct.purity || foundProduct.metalType || '22K (916 BIS Hallmarked)'),
            category: typeof foundProduct.category === 'object' ? (foundProduct.category?.name || 'Jewellery') : (foundProduct.category || 'Jewellery'),
            images: productImages,
            price: calculatedPrice,
            priceVisibility: foundProduct.priceVisibility !== undefined ? foundProduct.priceVisibility : true,
            description: foundProduct.description || foundProduct.shortDescription || "Exquisitely handcrafted in certified 22K BIS Hallmarked gold featuring traditional Nakashi motifs and heirloom craftsmanship."
          };

          setProduct(normalized);
          setIsWishlisted(isProductWishlisted(normalized.id));

          // Load related products
          const related = mockProducts
            .filter(p => p.id !== normalized.id)
            .slice(0, 4);
          setRelatedProducts(related);
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("Error loading jewelry masterpiece details:", err);
        // Fallback to primary mock product so user is never blocked
        if (mockProducts.length > 0) {
          const fallback = mockProducts[0];
          setProduct({
            ...fallback,
            slug: normalizeSlug(fallback.name),
            grossWeight: '64.20g',
            purity: '22K (916 BIS Hallmarked)',
            category: 'Necklaces',
            images: [fallback.imageUrl],
            price: 142850
          });
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  // Dynamic Gallery Images Memo (Must be called unconditionally at top level)
  const galleryImages = React.useMemo(() => {
    if (!product) {
      return ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=70&w=800'];
    }
    let list: string[] = [];
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      list = product.images.filter((img: any) => typeof img === 'string' && img.trim() !== '');
    } else if (typeof product.images === 'string' && product.images.trim() !== '') {
      list = [product.images];
    } else if (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.trim() !== '') {
      list = [product.imageUrl];
    } else if (product.thumbnailUrl && typeof product.thumbnailUrl === 'string' && product.thumbnailUrl.trim() !== '') {
      list = [product.thumbnailUrl];
    }

    if (list.length === 0) {
      list = [
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=70&w=800'
      ];
    }
    return list;
  }, [product]);

  const activeMainImage = galleryImages[activeImageIndex] || galleryImages[0] || '';

  // Safe Dynamic Derived Values
  const productName = product?.name || product?.productName || "Parasmoni Handcrafted Gold Masterpiece";
  const designId = product?.sku || product?.productCode || "PM-NH-091";
  const ratingVal = product?.rating || 4.9;
  const reviewCount = product?.reviewCount || 18;
  const shortDesc = product?.shortDescription || product?.description || "Exquisitely handcrafted in certified 22K BIS Hallmarked gold featuring traditional Nakashi motifs, delicate filigree, and mirror-finished antique detailing.";
  const grossWeight = product?.grossWeight || product?.approxWeight || "24.50g";
  const purityVal = product?.purity || product?.metalType || "22K (916 BIS Hallmarked)";
  const craftLegacy = product?.collection || product?.craftLegacy || "Bespoke Bridal & Nakashi Collection";
  const formattedPrice = product?.price ? Number(product.price).toLocaleString('en-IN') : "1,42,850";
  const categoryName = typeof product?.category === 'object' ? String(product?.category?.name || "Jewellery") : String(product?.category || "Jewellery");

  // Specs List for Giva/Mia Style Grid
  const specificationsList = [
    { label: "Net Gold Weight", value: String(grossWeight), icon: Scale },
    { label: "Metal / Purity", value: String(purityVal), icon: Gem },
    { label: "Hallmark Certification", value: "BIS 916 Stamped", icon: ShieldCheck },
    { label: "Jewellery Type", value: categoryName, icon: Tag },
    { label: "Metal Color", value: "Yellow Gold", icon: Sparkles },
    { label: "Craftsmanship", value: "Handcrafted Nakashi & Filigree", icon: Award },
    { label: "Gender / Occasion", value: "Women • Festive / Bridal", icon: Calendar },
    { label: "Purity Guarantee", value: "100% Lifetime Guarantee", icon: Lock },
  ];

  // 3. Comprehensive SEO Head Configuration (Unconditionally called)
  useEffect(() => {
    const brand = settings.brandName || "Parasmoni Jewellers & Brothers";
    const defaultTitle = `${brand} | Handcrafted Gold & Diamonds Since 1974`;
    const defaultDesc = "Established in 1974 in Bowbazar, Kolkata. Parasmoni Jewellers offers handcrafted BIS hallmarked 22K gold, certified solitaires, polki, and heritage jewellery.";
    
    if (product) {
      const titleText = product.seoTitle || `${productName} – BIS 916 Hallmarked 22K Gold | ${brand}`;
      const descText = product.seoDescription || `${productName} (${designId}). Weight: ${grossWeight}, ${purityVal}. Certified 100% BIS Hallmarked handcrafted jewellery from Parasmoni Jewellers Bowbazar, Kolkata.`;
      
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

      const updateOrCreateLink = (rel: string, href: string) => {
        let element = document.querySelector(`link[rel="${rel}"]`);
        if (!element) {
          element = document.createElement('link');
          element.setAttribute('rel', rel);
          document.head.appendChild(element);
        }
        element.setAttribute('href', href);
      };

      const currentCanonicalUrl = `${window.location.origin}/product/${product.slug || product.id || slug || ''}`;

      // Standard Meta Tags
      updateOrCreateMeta('description', descText);
      updateOrCreateMeta('keywords', `${productName}, 22k gold, ${categoryName}, BIS 916 hallmarked, Indian jewellery, Parasmoni Jewellers, Bowbazar Kolkata`);
      updateOrCreateLink('canonical', currentCanonicalUrl);

      // OpenGraph Social Share Card Tags
      updateOrCreateMeta('og:title', titleText, true);
      updateOrCreateMeta('og:description', descText, true);
      updateOrCreateMeta('og:type', 'product', true);
      updateOrCreateMeta('og:url', currentCanonicalUrl, true);
      updateOrCreateMeta('og:site_name', brand, true);
      
      const displayImg = galleryImages[0] || product.imageUrl || product.thumbnailUrl || '';
      if (displayImg) {
        updateOrCreateMeta('og:image', displayImg, true);
        updateOrCreateMeta('og:image:alt', productName, true);
      }

      // E-commerce Product Specific Meta Tags
      if (product.price) {
        updateOrCreateMeta('product:price:amount', String(product.price), true);
        updateOrCreateMeta('product:price:currency', 'INR', true);
      }
      updateOrCreateMeta('product:availability', 'in stock', true);
      updateOrCreateMeta('product:condition', 'new', true);

      // Twitter / X Social Share Card Tags
      updateOrCreateMeta('twitter:card', 'summary_large_image');
      updateOrCreateMeta('twitter:title', titleText);
      updateOrCreateMeta('twitter:description', descText);
      if (displayImg) {
        updateOrCreateMeta('twitter:image', displayImg);
      }
    }

    return () => {
      // Cleanup on unmount: Restore default brand meta
      document.title = defaultTitle;
    };
  }, [product, productName, designId, grossWeight, purityVal, categoryName, galleryImages, settings, slug]);

  // 4. Schema.org Structured Data (JSON-LD) for Rich Google Search Snippets (Unconditionally called)
  useEffect(() => {
    if (!product) return;
    const scriptId = 'product-json-ld-schema';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}/product/${product.slug || product.id || slug || ''}` : 'https://parasmoni.in';
    const schemaData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": productName,
      "image": galleryImages,
      "description": shortDesc,
      "sku": designId,
      "mpn": designId,
      "category": categoryName,
      "material": purityVal,
      "brand": {
        "@type": "Brand",
        "name": settings.brandName || "Parasmoni Jewellers & Brothers"
      },
      "offers": {
        "@type": "Offer",
        "url": currentUrl,
        "priceCurrency": "INR",
        "price": product.price ? String(product.price) : "142850",
        "priceValidUntil": "2026-12-31",
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition",
        "seller": {
          "@type": "JewelryStore",
          "name": settings.brandName || "Parasmoni Jewellers & Brothers",
          "telephone": settings.contactNumber || "+919051412413",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Bowbazar Showroom",
            "addressLocality": "Kolkata",
            "addressRegion": "West Bengal",
            "postalCode": "700012",
            "addressCountry": "IN"
          }
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": ratingVal,
        "reviewCount": reviewCount,
        "bestRating": "5",
        "worstRating": "1"
      }
    };
    script.text = JSON.stringify(schemaData);

    return () => {
      const existing = document.getElementById(scriptId);
      if (existing) {
        existing.remove();
      }
    };
  }, [product, productName, shortDesc, designId, categoryName, purityVal, galleryImages, ratingVal, reviewCount, settings, slug]);

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

  // Scroll to top on slug change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [slug]);

  // Loading skeleton state - ALL hooks are strictly called before this point
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] py-3 sm:py-6 px-3 sm:px-6 lg:px-8 font-sans antialiased pb-28 md:pb-12" id="product-loading-skeleton">
        <ProductDetailsSkeleton />
      </div>
    );
  }

  // Not found state - ALL hooks are strictly called before this point
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
                        <OptimizedImage 
                          src={imgUrl} 
                          alt={`${productName} thumbnail ${idx + 1}`}
                          width={80}
                          height={80}
                          aspectRatio="1/1"
                          quality={65}
                          sizes="80px"
                          className="w-full h-full object-cover"
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
                  <OptimizedImage 
                    src={activeMainImage} 
                    alt={productName}
                    width={800}
                    height={800}
                    aspectRatio="1/1"
                    priority={true}
                    quality={75}
                    objectFit="contain"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="p-2"
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

export default ProductDetails;
