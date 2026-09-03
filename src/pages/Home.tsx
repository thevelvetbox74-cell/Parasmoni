/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  MapPin, 
  ShieldCheck, 
  Award, 
  History, 
  Scale, 
  Clock, 
  ChevronRight,
  ChevronLeft,
  Tags,
  RefreshCw,
  AlertCircle,
  Database,
  GripVertical,
  Plus,
  X,
  MessageCircle,
  Gem,
  Crown,
  Check
} from 'lucide-react';
import { 
  BannerSlider, 
  MetalPriceCard, 
  CollectionCard, 
  ProductGrid, 
  StoreCard, 
  ContactButtons,
  WhatsAppButton
} from '../components/ShowroomComponents';
import { getOptimizedShowroomUrl } from '../imagekit/client';
import { 
  mockBanners, 
  mockMetalPrices, 
  mockCollections, 
  mockProducts, 
  mockStores 
} from '../data/mockData';
import { mockWebsiteSettings } from '../data/mockSettings';
import { useWebsiteSettings } from '../context/WebsiteSettingsContext';
import { PageSEOHead } from '../components/PageSEOHead';
import { db, isFirebaseConfigured } from '../firebase/config';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp,
  doc,
  setDoc
} from 'firebase/firestore';

const DEFAULT_CATEGORIES_MOCK = [
  {
    id: 'cat-necklaces',
    name: 'Necklaces',
    slug: 'necklaces',
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600',
    displayOrder: 1,
    status: 'active'
  },
  {
    id: 'cat-earrings',
    name: 'Earrings',
    slug: 'earrings',
    imageUrl: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&q=80&w=600',
    displayOrder: 2,
    status: 'active'
  },
  {
    id: 'cat-rings',
    name: 'Rings',
    slug: 'rings',
    imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=600',
    displayOrder: 3,
    status: 'active'
  },
  {
    id: 'cat-bangles',
    name: 'Bangles',
    slug: 'bangles',
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600',
    displayOrder: 4,
    status: 'active'
  },
  {
    id: 'cat-bracelets',
    name: 'Bracelets',
    slug: 'bracelets',
    imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=600',
    displayOrder: 5,
    status: 'active'
  },
  {
    id: 'cat-mangalsutra',
    name: 'Mangalsutra',
    slug: 'mangalsutra',
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600',
    displayOrder: 6,
    status: 'active'
  }
];

// --- Error Handling & Metrics conforme to fire-integration instructions ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
    },
    operationType,
    path
  };
  console.error('Firestore Error Captured:', JSON.stringify(errInfo));
}

export interface HomeProps {
  pageId?: string;
  isBuilder?: boolean;
  sectionsOverride?: any[];
  pageSections?: any[];
  loadingSections?: boolean;
  onAddSectionClick?: (index: number) => void;
  onDeleteSectionClick?: (index: number) => void;
  onReorderSections?: (newSections: any[]) => void;
  onSectionClick?: (id: string) => void;
  selectedSectionId?: string;
  seoData?: any;
}

export const DEFAULT_PAGE_SECTIONS = [
  { id: 'sec-hero', type: 'Hero Banner', content: {} },
  { id: 'sec-categories', type: 'Category Cards', content: {} },
  { id: 'sec-products-featured', type: 'Product Carousel', content: { title: 'Featured Sovereign Jewellery', productsType: 'featured' } },
  { id: 'sec-story', type: 'About Collection', content: {} },
  { id: 'sec-products-new', type: 'Product Carousel', content: { title: 'Fresh Showroom Arrivals', productsType: 'new' } },
  { id: 'sec-split', type: 'Split Media Banner', content: {} },
  { id: 'sec-boutiques', type: 'Our Boutiques', content: {} }
];

export function Home({
  pageId = 'home',
  isBuilder = false,
  sectionsOverride,
  pageSections: pageSectionsProp,
  loadingSections: loadingSectionsProp,
  onAddSectionClick,
  onDeleteSectionClick,
  onReorderSections,
  onSectionClick,
  selectedSectionId,
  seoData
}: HomeProps = {}): React.JSX.Element {
  const { settings } = useWebsiteSettings();
  
  // Dynamic Section & SEO State
  const [pageSections, setPageSections] = useState<any[]>([]);
  const [pageSeo, setPageSeo] = useState<any>(null);
  const [loadingSections, setLoadingSections] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const currentSections = pageSectionsProp || sectionsOverride || pageSections;
  const currentLoadingSections = pageSectionsProp !== undefined ? (loadingSectionsProp ?? false) : loadingSections;

  // Real-time & Loaded States
  const [banners, setBanners] = useState<any[]>([]);
  const [metalPrices, setMetalPrices] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [newArrivalProducts, setNewArrivalProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);

  // Load Status tracking
  const [loadingBanners, setLoadingBanners] = useState(isFirebaseConfigured);
  const [loadingPrices, setLoadingPrices] = useState(isFirebaseConfigured);
  const [loadingCollections, setLoadingCollections] = useState(isFirebaseConfigured);
  const [loadingCategories, setLoadingCategories] = useState(isFirebaseConfigured);
  const [loadingFeatured, setLoadingFeatured] = useState(isFirebaseConfigured);
  const [loadingNewArrivals, setLoadingNewArrivals] = useState(isFirebaseConfigured);
  const [loadingStores, setLoadingStores] = useState(isFirebaseConfigured);

  // Last update tracker
  const [lastUpdatedPrice, setLastUpdatedPrice] = useState<string>('');

  // Fallback state trackers
  const [fallbackActive, setFallbackActive] = useState(!isFirebaseConfigured);

  // Load page sections (builder vs viewer)
  useEffect(() => {
    if (isBuilder && sectionsOverride) {
      setPageSections(sectionsOverride);
      setLoadingSections(false);
      return;
    }

    if (!isFirebaseConfigured || !db) {
      setPageSections(DEFAULT_PAGE_SECTIONS);
      setLoadingSections(false);
      return;
    }

    // Subscribe to page sections for the home page (or specific pageId)
    const targetDocId = pageId || 'home';
    const docRef = doc(db, 'pageSections', targetDocId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.sections) && data.sections.length > 0) {
          setPageSections(data.sections);
        } else {
          setPageSections(DEFAULT_PAGE_SECTIONS);
        }
        if (data && data.seo) {
          setPageSeo(data.seo);
        }
      } else {
        setPageSections(DEFAULT_PAGE_SECTIONS);
      }
      setLoadingSections(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `pageSections/${targetDocId}`);
      setPageSections(DEFAULT_PAGE_SECTIONS);
      setLoadingSections(false);
    });

    return () => unsubscribe();
  }, [isBuilder, sectionsOverride, pageId]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Gracefully default to highly realistic mock datasets instantly (Priority Rule 1)
      setBanners(mockBanners);
      setMetalPrices(mockMetalPrices);
      setCollections(mockCollections);
      setCategories(DEFAULT_CATEGORIES_MOCK);
      setFeaturedProducts(mockProducts.filter(p => p.isPopular));
      setNewArrivalProducts(mockProducts.filter(p => !p.isPopular));
      setStores(mockStores);
      setLastUpdatedPrice('Live Demo Backup');
      setFallbackActive(true);
      return;
    }

    // 1. Live Banner Real-time Stream
    // status=active, ordered by displayOrder (client sorted to protect against missing compound indexes)
    const bannersRef = collection(db, 'banners');
    const bannersQuery = query(bannersRef, where('status', '==', 'active'));
    
    const unsubscribeBanners = onSnapshot(bannersQuery, (snapshot) => {
      try {
        const now = new Date();
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || '',
            subtitle: data.subtitle || '',
            image: data.imageUrl || data.image || '',
            buttonText: data.buttonText || 'EXPLORE MASTERPIECES',
            buttonLink: data.linkUrl || data.buttonLink || '/catalog',
            displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 99,
            startDate: data.startDate ? new Date(data.startDate) : null,
            endDate: data.endDate ? new Date(data.endDate) : null,
          };
        })
        // Filter campaign dates locally for safety
        .filter(b => {
          if (b.startDate && b.startDate > now) return false;
          if (b.endDate && b.endDate < now) return false;
          return true;
        })
        // Sort by displayOrder
        .sort((a, b) => a.displayOrder - b.displayOrder);

        if (items.length > 0) {
          setBanners(items);
        } else {
          setBanners(mockBanners); // Fallback if database is active but empty
        }
        setLoadingBanners(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'banners');
        setBanners(mockBanners);
        setLoadingBanners(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'banners');
      setBanners(mockBanners);
      setLoadingBanners(false);
    });

    // 2. Live Metal Rates Real-time Stream
    const pricesRef = collection(db, 'metalPrices');
    const unsubscribePrices = onSnapshot(pricesRef, (snapshot) => {
      try {
        if (snapshot.empty) {
          setMetalPrices(mockMetalPrices);
          setLastUpdatedPrice('Pre-loaded Market Rates');
          setLoadingPrices(false);
          return;
        }

        const items = snapshot.docs
          .map(doc => {
            const data = doc.data();
            // Extract dynamic updated timestamp
            let updateTimeStr = '';
            if (data.updatedAt) {
              const upVal = data.updatedAt;
              if (upVal instanceof Timestamp) {
                updateTimeStr = upVal.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ', ' + upVal.toDate().toLocaleDateString('en-IN');
              } else {
                const parsedDate = new Date(upVal);
                updateTimeStr = isNaN(parsedDate.getTime()) ? '' : parsedDate.toLocaleTimeString('en-IN') + ', ' + parsedDate.toLocaleDateString('en-IN');
              }
            }
            return {
              id: doc.id,
              metal: data.metal || data.metalType || data.metalName || '',
              pricePerGram: Number(data.pricePerGram || data.ratePerGram || data.price || 0),
              change: Number(data.change || 0),
              unit: data.unit || '1g',
              status: data.status || 'active',
              displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 9999,
              updateTimeStr
            };
          })
          .filter(p => p.status === 'active');

        items.sort((a, b) => a.displayOrder - b.displayOrder);

        // Set last updated tracker
        const timestamps = items.map(item => item.updateTimeStr).filter(Boolean);
        if (timestamps.length > 0) {
          setLastUpdatedPrice(timestamps[0]);
        } else {
          setLastUpdatedPrice(new Date().toLocaleTimeString('en-IN') + ', ' + new Date().toLocaleDateString('en-IN'));
        }

        setMetalPrices(items);
        setLoadingPrices(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'metalPrices');
        setMetalPrices(mockMetalPrices);
        setLoadingPrices(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'metalPrices');
      setMetalPrices(mockMetalPrices);
      setLoadingPrices(false);
    });

    // 3. Fetch Active Collections (getDocs)
    const fetchCollections = async () => {
      try {
        const collectionsRef = collection(db, 'collections');
        // Accept either isActive or status active for maximum resilience
        const snapshot = await getDocs(collectionsRef);
        
        let items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            description: data.description || '',
            imageUrl: data.imageUrl || data.coverImageUrl || '',
            slug: data.slug || '',
            displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : (typeof data.order === 'number' ? data.order : 99),
            status: data.status || (data.isActive ? 'active' : 'inactive')
          };
        })
        .filter(c => c.status === 'active')
        .sort((a, b) => a.displayOrder - b.displayOrder);

        if (items.length > 0) {
          setCollections(items);
        } else {
          setCollections(mockCollections);
        }
        setLoadingCollections(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'collections');
        setCollections(mockCollections);
        setLoadingCollections(false);
      }
    };
    fetchCollections();

    // 4. Fetch Featured Products (featured=true, status=published)
    const fetchFeatured = async () => {
      try {
        const productsRef = collection(db, 'products');
        const q = query(
          productsRef, 
          where('featured', '==', true), 
          where('status', '==', 'published')
        );
        const snapshot = await getDocs(q);
        
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            sku: data.sku || '',
            description: data.description || '',
            category: data.category || data.categoryId || '',
            collection: data.collection || data.collectionId || '',
            metalType: data.metalType || data.purity || '',
            approxWeight: data.approxWeight || (data.grossWeight ? `${data.grossWeight}g` : ''),
            imageUrl: data.imageUrl || data.thumbnailUrl || (data.images && data.images[0]) || '',
            isPopular: true
          };
        });

        if (items.length > 0) {
          setFeaturedProducts(items);
        } else {
          // If Firestore exists but is unpopulated, fallback to mock data (Priority Rule 1)
          setFeaturedProducts(mockProducts.filter(p => p.isPopular));
        }
        setLoadingFeatured(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'products');
        setFeaturedProducts(mockProducts.filter(p => p.isPopular));
        setLoadingFeatured(false);
      }
    };
    fetchFeatured();

    // 5. Fetch New Arrivals (newArrival=true, status=published)
    const fetchNewArrivals = async () => {
      try {
        const productsRef = collection(db, 'products');
        const q = query(
          productsRef, 
          where('newArrival', '==', true), 
          where('status', '==', 'published')
        );
        const snapshot = await getDocs(q);
        
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            sku: data.sku || '',
            description: data.description || '',
            category: data.category || data.categoryId || '',
            collection: data.collection || data.collectionId || '',
            metalType: data.metalType || data.purity || '',
            approxWeight: data.approxWeight || (data.grossWeight ? `${data.grossWeight}g` : ''),
            imageUrl: data.imageUrl || data.thumbnailUrl || (data.images && data.images[0]) || '',
            isPopular: false
          };
        });

        if (items.length > 0) {
          setNewArrivalProducts(items);
        } else {
          setNewArrivalProducts(mockProducts.filter(p => !p.isPopular));
        }
        setLoadingNewArrivals(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'products');
        setNewArrivalProducts(mockProducts.filter(p => !p.isPopular));
        setLoadingNewArrivals(false);
      }
    };
    fetchNewArrivals();

    // 6. Fetch Active Stores
    const fetchStores = async () => {
      try {
        const storesRef = collection(db, 'stores');
        const snapshot = await getDocs(storesRef);
        
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            address: data.address || '',
            phone: data.phone || '',
            whatsapp: data.whatsapp || data.whatsappNumber || '',
            hours: data.hours || data.workingHours || '',
            mapUrl: data.mapUrl || data.mapEmbedUrl || '',
            imageUrl: data.imageUrl || '',
            status: data.status || (data.isActive ? 'active' : 'inactive')
          };
        })
        .filter(s => s.status === 'active');

        if (items.length > 0) {
          setStores(items);
        } else {
          setStores(mockStores);
        }
        setLoadingStores(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'stores');
        setStores(mockStores);
        setLoadingStores(false);
      }
    };
    fetchStores();

    // 7. Live Categories Real-time Stream
    const categoriesRef = collection(db, 'categories');
    const unsubscribeCategories = onSnapshot(categoriesRef, (snapshot) => {
      try {
        if (snapshot.empty) {
          setCategories(DEFAULT_CATEGORIES_MOCK);
          setLoadingCategories(false);
          return;
        }
        
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            slug: data.slug || '',
            imageUrl: data.imageUrl || data.coverImageUrl || '',
            displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : (typeof data.order === 'number' ? data.order : 99),
            status: data.status || (data.isActive ? 'active' : 'inactive'),
            offerTag: data.offerTag || '',
            customTitle: data.customTitle || '',
            customSubtitle: data.customSubtitle || '',
            fontStyle: data.fontStyle || 'serif',
            textColor: data.textColor || '#ffffff',
            subtitleColor: data.subtitleColor || '#fecdd3',
            offerTagColor: data.offerTagColor || '#ffffff',
            offerTagBgColor: data.offerTagBgColor || '#e11d48',
            overlayShadeColor: data.overlayShadeColor || '#000000'
          };
        })
        .filter(c => c.status === 'active')
        .sort((a, b) => a.displayOrder - b.displayOrder);

        if (items.length > 0) {
          setCategories(items);
        } else {
          setCategories(DEFAULT_CATEGORIES_MOCK);
        }
        setLoadingCategories(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'categories');
        setCategories(DEFAULT_CATEGORIES_MOCK);
        setLoadingCategories(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
      setCategories(DEFAULT_CATEGORIES_MOCK);
      setLoadingCategories(false);
    });

    // Clean up streams on unmount
    return () => {
      unsubscribeBanners();
      unsubscribePrices();
      unsubscribeCategories();
    };
  }, []);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  const getCategoryFontStyle = (style?: string) => {
    switch (style) {
      case 'sans':
        return { fontFamily: "'Inter', sans-serif" };
      case 'cursive':
        return { fontFamily: "'Dancing Script', 'Brush Script MT', cursive", fontStyle: 'italic' };
      case 'mono':
        return { fontFamily: "Courier New, monospace" };
      case 'serif':
      default:
        return { fontFamily: "'Playfair Display', Georgia, serif" };
    }
  };

  const getHeaderFontStyle = (style?: string) => {
    switch (style) {
      case 'sans':
        return { fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" };
      case 'cursive':
        return { fontFamily: "'Sacramento', 'Dancing Script', cursive" };
      case 'mono':
        return { fontFamily: "'Courier Prime', 'Courier New', monospace" };
      case 'cinzel':
        return { fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" };
      case 'cormorant':
        return { fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" };
      case 'marcellus':
        return { fontFamily: "'Marcellus', 'Playfair Display', Georgia, serif" };
      case 'lobster':
        return { fontFamily: "'Lobster', cursive" };
      case 'alex-brush':
        return { fontFamily: "'Alex Brush', 'Dancing Script', cursive" };
      case 'poppins':
        return { fontFamily: "'Poppins', 'Inter', sans-serif" };
      case 'serif':
      default:
        return { fontFamily: "'Playfair Display', Georgia, serif" };
    }
  };

  const getTextStyle = (styles: any, defaultColor: string, defaultFontFamily: 'serif' | 'sans') => {
    const familyStyle = styles?.fontFamily === 'serif' 
      ? { fontFamily: "'Playfair Display', Georgia, serif" }
      : styles?.fontFamily === 'sans'
        ? { fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }
        : defaultFontFamily === 'serif'
          ? { fontFamily: "'Playfair Display', Georgia, serif" }
          : { fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" };
    return {
      color: styles?.color || defaultColor,
      fontSize: styles?.fontSize ? (typeof styles.fontSize === 'number' ? `${styles.fontSize}px` : styles.fontSize) : undefined,
      ...familyStyle
    };
  };

  const getButtonStyle = (btn: any, defaultStyleType: 'filled' | 'outlined') => {
    if (!btn) return undefined;
    const styleType = btn.styleType || defaultStyleType;
    const styleObj: any = {};
    if (btn.bgColor) {
      if (styleType !== 'outlined') {
        styleObj.backgroundColor = btn.bgColor;
      } else {
        styleObj.borderColor = btn.bgColor;
        styleObj.borderWidth = '1px';
        styleObj.borderStyle = 'solid';
      }
    }
    if (btn.textColor) {
      styleObj.color = btn.textColor;
    }
    if (btn.fontSize) {
      styleObj.fontSize = typeof btn.fontSize === 'number' ? `${btn.fontSize}px` : btn.fontSize;
    }
    if (btn.fontFamily) {
      styleObj.fontFamily = btn.fontFamily === 'serif'
        ? "'Playfair Display', Georgia, serif"
        : "'Inter', 'Plus Jakarta Sans', sans-serif";
    }
    return styleObj;
  };

  // --- Section Sub-renders for Visual Page Builder ---

  const renderHeroBanner = (content: any = {}) => {
    // Determine the list of banners to display.
    // If specific banners are configured in the section content (e.g. customized for a custom page), use them.
    // Otherwise, default to the live global banners loaded from the Firestore collection / mock data.
    const activeBanners = (content && Array.isArray(content.banners) && content.banners.length > 0)
      ? content.banners
      : banners;

    return (
      <div id="home-hero-banner-carousel" className="w-full relative py-4">
        <BannerSlider banners={activeBanners} />
      </div>
    );
  };

  const renderCategoryCards = (content: any = {}) => {
    const title = content.title !== undefined ? content.title : (settings.categoryShowcaseTitle || 'Shop by Category');
    const subtitle = content.subtitle !== undefined ? content.subtitle : settings.categoryShowcaseSubtitle;
    const titleStyle = getTextStyle(content.titleStyle, '#1c1917', 'serif');
    const subtitleStyle = getTextStyle(content.subtitleStyle, '#78716c', 'sans');

    const displayCategories = (content.selectedIds && Array.isArray(content.selectedIds) && content.selectedIds.length > 0)
      ? categories.filter(cat => content.selectedIds.includes(cat.id))
      : categories;

    return (
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto space-y-8" id="category-showcase-section">
        {/* Conditional Header Rendering */}
        {title?.trim() ? (
          <div className="text-center space-y-3">
            {settings.categoryShowcaseEyebrowTag?.trim() && (
              <span 
                className="text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-1.5 font-sans"
                style={{ color: settings.categoryShowcaseEyebrowColor || '#e11d48' }}
              >
                <Tags className="w-3.5 h-3.5 animate-pulse" style={{ color: settings.categoryShowcaseEyebrowColor || '#e11d48' }} />
                <span>{settings.categoryShowcaseEyebrowTag}</span>
              </span>
            )}
            <div className="inline-block">
              <h2 
                className="font-bold tracking-wide transition-all text-2xl md:text-3xl"
                style={{
                  ...getHeaderFontStyle(settings.categoryShowcaseHeaderFontStyle),
                  ...titleStyle,
                  lineHeight: '1.2'
                }}
              >
                {title}
              </h2>
            </div>
            {subtitle?.trim() && (
              <p 
                className="text-xs max-w-xl mx-auto font-medium leading-relaxed font-sans mt-1"
                style={subtitleStyle}
              >
                {subtitle}
              </p>
            )}
          </div>
        ) : null}

        {/* Categories Scroller Container with pink accents */}
        <div className="relative group/scroller">
          {/* Arrow Left (Desktop) */}
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-white/95 text-rose-950 rounded-full shadow-lg border border-rose-100 hover:bg-rose-50 hover:text-rose-600 opacity-0 group-hover/scroller:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center cursor-pointer"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Arrow Right (Desktop) */}
          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-white/95 text-rose-950 rounded-full shadow-lg border border-rose-100 hover:bg-rose-50 hover:text-rose-600 opacity-0 group-hover/scroller:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center cursor-pointer"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Scrolling Grid */}
          {loadingCategories ? (
            <div className="flex gap-4 overflow-x-auto scrollbar-none pb-4" id="categories-skeleton">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="flex-shrink-0 w-44 md:w-56 aspect-[3/4] bg-stone-200 animate-pulse rounded-xl border border-stone-300" />
              ))}
            </div>
          ) : displayCategories.length === 0 ? (
            <div className="text-center py-10 bg-white border border-stone-200 rounded-xl" id="categories-empty-state">
              <Tags className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
              <p className="text-stone-600 text-xs font-medium">No design categories currently configured.</p>
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              className={`
                scrollbar-none overflow-x-auto gap-4 pb-4 select-none scroll-smooth
                ${settings.categoryShowcaseLayout === 'double' 
                  ? 'grid grid-rows-2 grid-flow-col auto-cols-[11rem] md:auto-cols-[14rem]' 
                  : 'flex auto-cols-max'
                }
              `}
            >
              {displayCategories.map((cat) => {
                const itemLink = `/category/${cat.slug || cat.id}`;
                return (
                  <Link
                    key={cat.id}
                    to={itemLink}
                    className={`
                      snap-start flex-shrink-0 relative rounded-xl overflow-hidden group/tile
                      shadow-xs hover:shadow-lg hover:shadow-rose-100/50 border border-rose-100/40 transition-all duration-300
                      ${settings.categoryShowcaseLayout === 'double'
                        ? 'w-full aspect-[4/3] h-28 md:h-36'
                        : 'w-44 md:w-56 aspect-[3/4]'
                      }
                    `}
                  >
                    {/* Offer Tag Badge */}
                    {cat.offerTag && (
                      <div 
                        className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 text-[8px] md:text-[9px] font-sans font-bold uppercase tracking-wider rounded-md shadow-sm border border-black/5"
                        style={{
                          color: cat.offerTagColor || '#ffffff',
                          backgroundColor: cat.offerTagBgColor || '#e11d48'
                        }}
                      >
                        {cat.offerTag}
                      </div>
                    )}

                    {/* Category Image */}
                    <div className="w-full h-full bg-rose-50/50 relative overflow-hidden">
                      {cat.imageUrl ? (
                        (() => {
                          const isVideo = cat.imageUrl.toLowerCase().endsWith('.mp4') || 
                                          cat.imageUrl.toLowerCase().endsWith('.mov') || 
                                          cat.imageUrl.toLowerCase().endsWith('.webm') || 
                                          cat.imageUrl.toLowerCase().endsWith('.m4v');
                          if (isVideo) {
                            return (
                              <video
                                src={cat.imageUrl}
                                className="w-full h-full object-cover group-hover/tile:scale-105 transition-transform duration-500"
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
                            );
                          }
                          return (
                            <img
                              src={cat.imageUrl}
                              alt={cat.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover/tile:scale-105 transition-transform duration-500"
                            />
                          );
                        })()
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-rose-50/20 text-rose-300">
                          <Tags className="w-8 h-8 opacity-40 mb-1" />
                          <span className="text-[10px] font-medium tracking-wider uppercase">Parasmoni</span>
                        </div>
                      )}

                      {/* Customizable Overlay Gradient / Seeds */}
                      <div 
                        className="absolute inset-0 transition-all duration-300" 
                        style={
                          cat.overlayShadeColor === 'transparent'
                            ? { background: 'transparent' }
                            : {
                                background: `linear-gradient(to top, ${cat.overlayShadeColor || '#4c0519'}ec, ${cat.overlayShadeColor || '#4c0519'}70, transparent)`
                              }
                        }
                      />
                    </div>

                    {/* Category Name Overlay at bottom */}
                    <div className="absolute bottom-0 inset-x-0 p-3 md:p-4 text-center z-10 flex flex-col items-center justify-end pb-4 md:pb-5">
                      <span 
                        className="block text-xs md:text-sm font-bold tracking-wide transition-colors line-clamp-1 drop-shadow-xs"
                        style={{
                          ...getCategoryFontStyle(cat.fontStyle),
                          color: cat.textColor || '#ffffff'
                        }}
                      >
                        {cat.customTitle || cat.name}
                      </span>
                      {cat.customSubtitle && (
                        <span 
                          className="block mt-0.5 text-[10px] md:text-xs tracking-wide transition-colors line-clamp-1 opacity-90"
                          style={{
                            ...getCategoryFontStyle(cat.fontStyle),
                            color: cat.subtitleColor || '#fecdd3'
                          }}
                        >
                          {cat.customSubtitle}
                        </span>
                      )}
                      <span className="inline-block mt-1 text-[9px] uppercase tracking-wider font-bold text-rose-200 opacity-0 group-hover/tile:opacity-100 transform translate-y-1 group-hover/tile:translate-y-0 transition-all duration-300">
                        Explore Now &rarr;
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderCollectionsShowcase = (content: any = {}) => {
    const title = content.title || 'Shop by Heritage Collection';
    const subtitle = content.subtitle || 'From 22K Nakashi handiwork to modern brilliant-cut diamond solitaires, discover jewellery for every generation.';
    
    const titleStyle = getTextStyle(content.titleStyle, '#1c1917', 'serif');
    const subtitleStyle = getTextStyle(content.subtitleStyle, '#78716c', 'sans');

    const displayCollections = (content.selectedIds && Array.isArray(content.selectedIds) && content.selectedIds.length > 0)
      ? collections.filter(col => content.selectedIds.includes(col.id))
      : collections;

    return (
      <section className="bg-stone-100 py-20 px-4 sm:px-6 border-y border-stone-200" id="collections-showcase-section">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-[10px] text-gold-600 font-bold tracking-widest uppercase block">
                CURATED MASTERPIECES
              </span>
              <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-wide" style={titleStyle}>
                {title}
              </h2>
              <p className="text-xs max-w-lg font-medium" style={subtitleStyle}>
                {subtitle}
              </p>
            </div>
            <Link 
              to="/catalog" 
              className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-brand-red-600 hover:text-brand-red-700 transition-colors shrink-0 uppercase whitespace-nowrap"
            >
              <span>Browse Full Catalogue</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingCollections ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="collections-skeleton">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="aspect-[4/3] bg-stone-200 animate-pulse rounded border border-stone-300"></div>
              ))}
            </div>
          ) : displayCollections.length === 0 ? (
            <div className="text-center py-12 bg-white border border-stone-200 rounded" id="collections-empty-state">
              <AlertCircle className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
              <p className="text-stone-600 text-xs font-medium">No design collections published at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayCollections.map((col) => (
                <CollectionCard key={col.id} collection={col} />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderProductCarousel = (content: any = {}) => {
    const isNewArrivals = content?.productsType === 'new';
    const isCustom = content?.productsType === 'custom';
    const title = content?.title || (isNewArrivals ? 'Fresh Showroom Arrivals' : (isCustom ? 'Curated Masterpieces' : 'Featured Sovereign Jewellery'));
    const subtitle = content?.subtitle || (isNewArrivals 
      ? "The latest additions straight from our master artisans' benches, capturing contemporary trends without compromising sovereign purity."
      : "Explore signature handcrafted designs renowned for heavy filigree detailing, kundan embellishments, and flawless diamonds.");
    
    const titleStyle = getTextStyle(content?.titleStyle, '#1c1917', 'serif');
    const subtitleStyle = getTextStyle(content?.subtitleStyle, '#78716c', 'sans');

    let products = isNewArrivals ? newArrivalProducts : featuredProducts;
    
    if (isCustom && content.selectedIds && Array.isArray(content.selectedIds) && content.selectedIds.length > 0) {
      products = mockProducts.filter(p => content.selectedIds.includes(p.id));
    }

    const loading = isNewArrivals ? loadingNewArrivals : loadingFeatured;

    return (
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-12" id={isNewArrivals ? "new-arrivals-section" : "featured-masterpieces-section"}>
        <div className="text-center space-y-2">
          <span className="text-[10px] text-gold-600 font-bold tracking-widest uppercase flex items-center justify-center gap-1.5 font-sans">
            <Sparkles className="w-3.5 h-3.5 text-gold-500 animate-pulse" />
            <span>{isNewArrivals ? 'JUST REVEALED' : 'DESIGN EXCELLENCE'}</span>
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-wide" style={titleStyle}>
            {title}
          </h2>
          <p className="text-xs max-w-xl mx-auto font-medium" style={subtitleStyle}>
            {subtitle}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-96 bg-stone-200 animate-pulse rounded border border-stone-300"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white border border-stone-200 rounded">
            <AlertCircle className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
            <p className="text-stone-600 text-xs font-medium">No products on display currently.</p>
          </div>
        ) : (
          <ProductGrid products={products} whatsappNumber={mockWebsiteSettings.whatsappNumber} />
        )}
      </section>
    );
  };

  const renderAboutCollection = (content: any = {}) => {
    const title = content.title || 'Crafting Elegance for Five Decades';
    const subtitle = content.subtitle || 'BOWBAZAR TRADITION';
    const quoteText = content.quoteText || '"For over 50 years, Parasmoni Jewellers & Brothers has remained a sanctuary for families seeking authentic gold wirework, certified solitaires, and antique nakashi designs."';
    const description = content.description || 'Founded on the pillars of transparency and meticulous artisan work in Kolkata\'s historic Bowbazar, we maintain a legacy where every piece represents physical sovereign value and unparalleled visual poetry.';
    
    const titleStyle = getTextStyle(content.titleStyle, '#f5f5f4', 'serif');
    const subtitleStyle = getTextStyle(content.subtitleStyle, '#fbbf24', 'sans');
    const descStyle = getTextStyle(content.descriptionStyle, '#a8a29e', 'sans');
    const quoteStyle = getTextStyle(content.quoteStyle, '#a8a29e', 'serif');
    const bulletTextStyle = getTextStyle(content.bulletStyle, '#a8a29e', 'sans');

    const badgeBg = content.subtitleStyle?.bgColor || '#1c1917';
    const badgeBorder = content.subtitleStyle?.borderColor || 'rgba(181, 139, 55, 0.3)';

    const image1 = content.mediaUrl || content.image1 || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600";
    const image2 = content.mediaUrl2 || content.image2 || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=300";

    const bullets = content.bullets || [];
    const bulletIconColor = content.bulletStyle?.iconColor || '#d4af37';
    const bulletIconName = content.bulletStyle?.iconName || 'sparkle';

    const BulletIcon = (() => {
      switch (bulletIconName.toLowerCase()) {
        case 'check': return Check;
        case 'gem': return Gem;
        case 'chevron': return ChevronRight;
        case 'circle': return Clock;
        default: return Sparkles;
      }
    })();

    const SubtitleIcon = (() => {
      const iconName = content.subtitleStyle?.icon || 'History';
      switch (iconName.toLowerCase()) {
        case 'sparkles': return Sparkles;
        case 'gem': return Gem;
        case 'crown': return Crown;
        case 'award': return Award;
        default: return History;
      }
    })();

    const primaryBtn = content.primaryButton || { label: 'OUR FULL HERITAGE', linkUrl: '/about', styleType: 'filled' };
    const secondaryBtn = content.secondaryButton || { label: '', linkUrl: '', styleType: 'outlined' };

    return (
      <section 
        className="py-12 md:py-16 px-4 sm:px-6 text-stone-200 border-y border-gold-500/20 relative overflow-hidden transition-colors duration-500" 
        id="about-collection-section"
        style={{ backgroundColor: content.backgroundColor || '#0c0a09' }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(#b58b37_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04]"></div>
 
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-5 space-y-6 animate-fade-in relative z-20">
            <div className="space-y-3">
              <span 
                className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase border px-3 py-1 rounded"
                style={{ 
                  ...subtitleStyle, 
                  backgroundColor: badgeBg, 
                  borderColor: badgeBorder 
                }}
              >
                <SubtitleIcon className="w-4 h-4 text-gold-400" style={{ color: subtitleStyle.color }} />
                <span>{subtitle}</span>
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-wide leading-tight" style={titleStyle}>
                {title}
              </h2>
            </div>
            
            <p className="text-stone-400 text-sm leading-relaxed font-serif italic" style={quoteStyle}>
              {quoteText}
            </p>
            
            <p className="text-xs leading-relaxed font-sans" style={descStyle}>
              {description}
            </p>

            {bullets.length > 0 && (
              <ul className="space-y-3 pt-2">
                {bullets.map((bullet: any, idx: number) => (
                  <li key={bullet.id || idx} className="flex items-start gap-2.5">
                    <BulletIcon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: bulletIconColor }} />
                    <span style={bulletTextStyle}>{bullet.text}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="pt-4 flex flex-wrap gap-4 relative z-30 pointer-events-auto">
              {primaryBtn.label && (
                <Link 
                  to={primaryBtn.linkUrl || '/about'}
                  className={`inline-flex h-11 px-6 text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded items-center gap-2 cursor-pointer z-30 ${
                    primaryBtn.styleType === 'outlined' 
                      ? 'border border-gold-500/40 hover:bg-gold-500/10 text-gold-400' 
                      : 'bg-brand-red-600 hover:bg-brand-red-700 text-stone-100 shadow-lg'
                  }`}
                  style={getButtonStyle(primaryBtn, 'filled')}
                >
                  <span>{primaryBtn.label}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
              {secondaryBtn.label && (
                <Link 
                  to={secondaryBtn.linkUrl || '/contact'}
                  className={`inline-flex h-11 px-6 text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded items-center gap-2 cursor-pointer z-30 ${
                    secondaryBtn.styleType === 'filled' 
                      ? 'bg-brand-red-600 hover:bg-brand-red-700 text-stone-100 shadow-lg' 
                      : 'border border-stone-750 hover:bg-stone-900 text-stone-300'
                  }`}
                  style={getButtonStyle(secondaryBtn, 'outlined')}
                >
                  <span>{secondaryBtn.label}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 flex justify-center lg:justify-end items-center lg:pr-10 py-6 relative">
            {/* Decorative backdrop glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gold-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

            {/* Main Tall Arch Image */}
            <div className="relative w-[65%] aspect-[3/4.2] rounded-t-full border-2 border-[#b58b37]/60 p-1 bg-stone-900/50 shadow-2xl overflow-visible group">
              <div className="w-full h-full rounded-t-full overflow-hidden relative">
                <img 
                  src={getOptimizedShowroomUrl(image1) || image1} 
                  alt="About Collection Main" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Overlapping Small Arch Image (Bottom-Left) */}
              <div className="absolute bottom-[-1%] left-[-22%] w-[50%] aspect-[3/4] rounded-t-full border-2 border-[#b58b37]/70 p-0.5 bg-stone-900/95 shadow-2xl z-20 hover:scale-110 hover:-translate-y-2 transition-all duration-500 ease-out group/sub">
                <div className="w-full h-full rounded-t-full overflow-hidden relative">
                  <img 
                    src={getOptimizedShowroomUrl(image2) || image2} 
                    alt="About Collection Sub" 
                    className="w-full h-full object-cover group-hover/sub:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderWhyChooseUs = (content: any = {}) => {
    const title = content.title || 'Our Quality Benchmarks';
    const subtitle = content.subtitle || 'We adhere strictly to certifications and business ethics to safeguard your generational investments.';
    
    const titleStyle = getTextStyle(content.titleStyle, '#1c1917', 'serif');
    const subtitleStyle = getTextStyle(content.subtitleStyle, '#78716c', 'sans');

    return (
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-12" id="why-choose-us-section">
        <div className="text-center space-y-2">
          <span className="text-[10px] text-gold-600 font-bold tracking-widest uppercase block font-sans">
            THE PARASMONI PLEDGE
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-wide" style={titleStyle}>
            {title}
          </h2>
          <p className="text-stone-500 text-xs max-w-xl mx-auto font-medium" style={subtitleStyle}>
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded border border-stone-200 p-8 space-y-4 hover:shadow-sm transition-shadow">
            <div className="w-12 h-12 rounded bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-stone-900 text-base">
              100% BIS Hallmarked 22K (916)
            </h4>
            <p className="text-stone-500 text-xs leading-relaxed">
              Every gold asset is laser-engraved with the Bureau of Indian Standards HUID code, confirming exact, untarnished metal weight and purity.
            </p>
          </div>

          <div className="bg-white rounded border border-stone-200 p-8 space-y-4 hover:shadow-sm transition-shadow">
            <div className="w-12 h-12 rounded bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-600">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-stone-900 text-base">
              IGI Certified Diamonds & Solitaires
            </h4>
            <p className="text-stone-500 text-xs leading-relaxed">
              Our diamond selections come backed by certificates from the International Gemological Institute, verifying clarity, color, cut, and carat.
            </p>
          </div>

          <div className="bg-white rounded border border-stone-200 p-8 space-y-4 hover:shadow-sm transition-shadow">
            <div className="w-12 h-12 rounded bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-600">
              <Scale className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-stone-900 text-base">
              Live Bullion-Linked Valuation
            </h4>
            <p className="text-stone-500 text-xs leading-relaxed">
              We charge strictly on live market bullion rates, providing fully itemized estimates with clear separating columns for metal and making charges.
            </p>
          </div>
        </div>
      </section>
    );
  };

  const renderOurBoutiques = (content: any = {}) => {
    const title = content.title || 'Experience the Craftsmanship In Person';
    const subtitle = content.subtitle || 'Step into our physical galleries to inspect the intricate weight, lustre, and detail of our traditional jewellery.';
    
    const titleStyle = getTextStyle(content.titleStyle, '#1c1917', 'serif');
    const subtitleStyle = getTextStyle(content.subtitleStyle, '#78716c', 'sans');

    const displayStores = (content.selectedIds && Array.isArray(content.selectedIds) && content.selectedIds.length > 0)
      ? stores.filter(st => content.selectedIds.includes(st.id))
      : stores;

    return (
      <section className="bg-stone-100 py-20 px-4 sm:px-6 border-y border-stone-200" id="our-stores-showcase">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-[10px] text-gold-600 font-bold tracking-widest uppercase block font-sans">
              VISIT OUR SHOWROOMS
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-wide" style={titleStyle}>
              {title}
            </h2>
            <p className="text-stone-500 text-xs max-w-xl mx-auto font-medium" style={subtitleStyle}>
              {subtitle}
            </p>
          </div>

          {loadingStores ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="stores-skeleton">
              {[1, 2].map(n => (
                <div key={n} className="h-64 bg-stone-200 animate-pulse rounded border border-stone-300"></div>
              ))}
            </div>
          ) : displayStores.length === 0 ? (
            <div className="text-center py-12 bg-white border border-stone-200 rounded" id="stores-empty-state">
              <AlertCircle className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
              <p className="text-stone-600 text-xs font-medium">No active retail locations registered.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {displayStores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderSplitMediaBanner = (content: any = {}) => {
    const title = content.title || 'Sovereign Heavy Filigree Collection';
    const subtitle = content.subtitle || 'EXCLUSIVE ARTISTRY';
    const description = content.description || 'Discover hand-finished heavy bridal chokers, necklaces, and bangles forged by award-winning goldsmiths. Every item represents untarnished 22K purity.';
    const mediaUrl = content.mediaUrl || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600';
    const isVideo = mediaUrl.toLowerCase().endsWith('.mp4') || mediaUrl.toLowerCase().endsWith('.mov') || mediaUrl.toLowerCase().endsWith('.webm');
    
    const titleStyle = getTextStyle(content.titleStyle, '#1c1917', 'serif');
    const subtitleStyle = getTextStyle(content.subtitleStyle, '#d97706', 'sans');
    const descStyle = getTextStyle(content.descriptionStyle, '#78716c', 'sans');

    const alignRight = content.alignMedia !== 'left';
    
    const pBtnStyle = content.primaryButton?.styleType === 'outlined'
      ? "border border-brand-red-600 text-brand-red-600 hover:bg-brand-red-50"
      : "bg-brand-red-600 hover:bg-brand-red-700 text-white shadow-md hover:scale-[1.02]";

    const sBtnStyle = content.secondaryButton?.styleType === 'outlined'
      ? "border border-stone-400 text-stone-700 hover:bg-stone-50"
      : "bg-stone-900 hover:bg-stone-800 text-white shadow-md hover:scale-[1.02]";

    return (
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto" id="split-media-banner-section">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className={`lg:col-span-6 space-y-6 ${alignRight ? 'lg:order-1' : 'lg:order-2'}`}>
            <div className="space-y-3">
              {subtitle && (
                <span className="text-gold-600 text-xs font-bold tracking-widest uppercase block" style={subtitleStyle}>
                  {subtitle}
                </span>
              )}
              <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-wide" style={titleStyle}>
                {title}
              </h2>
            </div>
            <p className="text-stone-600 text-sm leading-relaxed" style={descStyle}>
              {description}
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              {content.primaryButton?.label && (
                <Link
                  to={content.primaryButton.linkUrl || '/catalog'}
                  className={`h-10 px-6 text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded flex items-center justify-center cursor-pointer ${pBtnStyle}`}
                  style={getButtonStyle(content.primaryButton, 'filled')}
                >
                  {content.primaryButton.label}
                </Link>
              )}
              {content.secondaryButton?.label && (
                <Link
                  to={content.secondaryButton.linkUrl || '/catalog'}
                  className={`h-10 px-6 text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded flex items-center justify-center cursor-pointer ${sBtnStyle}`}
                  style={getButtonStyle(content.secondaryButton, 'outlined')}
                >
                  {content.secondaryButton.label}
                </Link>
              )}
            </div>
          </div>
          
          <div className={`lg:col-span-6 aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden shadow-md border border-stone-200/80 bg-stone-950 ${alignRight ? 'lg:order-2' : 'lg:order-1'}`}>
            {isVideo ? (
              <video src={getOptimizedShowroomUrl(mediaUrl) || mediaUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
            ) : (
              <img src={getOptimizedShowroomUrl(mediaUrl) || mediaUrl} alt={title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            )}
          </div>
        </div>
      </section>
    );
  };

  const renderInfiniteMarquee = (content: any = {}) => {
    const text = content.text || 'BIS 22K HALLMARKED • HANDCRAFTED HERITAGE • HEAVY FILIGREE DESIGNERS • CERTIFIED SOLITAIRES';
    const bgColor = content.bgColor || '#0c0a09';
    const textColor = content.textColor || '#d97706';
    
    return (
      <div className="py-4 overflow-hidden border-y border-gold-500/30 whitespace-nowrap flex relative" style={{ backgroundColor: bgColor }} id="infinite-marquee-section">
        <style>{`
          @keyframes marquee {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          .animate-marquee-custom {
            display: flex;
            width: max-content;
            animation: marquee 25s linear infinite;
          }
        `}</style>
        <div className="animate-marquee-custom flex gap-8 text-xs tracking-widest font-bold uppercase" style={{ color: textColor }}>
          {Array(6).fill(text).map((txt, i) => (
            <span key={i} className="mx-4 block flex-shrink-0">{txt}</span>
          ))}
        </div>
      </div>
    );
  };

  const renderMediaSlider = (content: any = {}) => {
    const mediaUrls = (content.mediaUrls && Array.isArray(content.mediaUrls) && content.mediaUrls.length > 0)
      ? content.mediaUrls
      : ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800'];
      
    const virtualBanners = mediaUrls.map((url: string, index: number) => ({
      id: `media-slide-${index}`,
      title: index === 0 ? (content.title || '') : '',
      subtitle: index === 0 ? (content.subtitle || '') : '',
      image: url,
      buttonText: index === 0 ? (content.primaryButton?.label || '') : '',
      buttonLink: index === 0 ? (content.primaryButton?.linkUrl || '') : '',
    }));
    
    return <BannerSlider banners={virtualBanners} />;
  };

  const renderShopTheLook = (content: any = {}) => {
    const title = content.title || 'Curated Royal Ensemble';
    const subtitle = content.subtitle || 'SHOP THE LOOK';
    const description = content.description || 'Pair our heavy Nakashi bridal necklace with antique finish gold bangles and traditional jhumkas for an authentic sovereign royal look.';
    const mediaUrl = content.mediaUrl || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600';
    
    const titleStyle = getTextStyle(content.titleStyle, '#1c1917', 'serif');
    const subtitleStyle = getTextStyle(content.subtitleStyle, '#d97706', 'sans');
    const descStyle = getTextStyle(content.descriptionStyle, '#78716c', 'sans');

    const displayProducts = (content.selectedIds && Array.isArray(content.selectedIds) && content.selectedIds.length > 0)
      ? mockProducts.filter(p => content.selectedIds.includes(p.id))
      : mockProducts.slice(0, 2);
      
    return (
      <section className="py-20 px-4 sm:px-6 bg-stone-50 border-y border-stone-200" id="shop-the-look-section">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-stone-200/80 bg-stone-100">
            <img src={getOptimizedShowroomUrl(mediaUrl) || mediaUrl} alt={title} className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
          </div>
          
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-3">
              {subtitle && (
                <span className="text-[10px] text-gold-600 font-bold tracking-widest uppercase block font-sans" style={subtitleStyle}>
                  {subtitle}
                </span>
              )}
              <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-wide" style={titleStyle}>
                {title}
              </h2>
              <p className="text-stone-500 text-xs leading-relaxed max-w-xl font-medium font-sans" style={descStyle}>
                {description}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {displayProducts.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-stone-200 p-4 flex gap-4 hover:shadow-md transition-all">
                  <div className="w-20 h-20 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0 border border-stone-100">
                    <img src={getOptimizedShowroomUrl(p.imageUrl) || p.imageUrl} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-stone-900 text-xs line-clamp-1">{p.name}</h4>
                      <span className="text-[9px] bg-gold-500/10 text-gold-800 px-1.5 py-0.5 rounded font-mono mt-1 inline-block">{p.metalType}</span>
                    </div>
                    <WhatsAppButton 
                      phoneNumber={mockWebsiteSettings.whatsappNumber}
                      message={`Hello Parasmoni Jewellers, I am interested in the featured item from the Look Collection:\n\n*Name*: ${p.name}\n*SKU*: ${p.sku}`}
                      className="w-full py-1 text-[9px] font-bold"
                      label="Inquire Item"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderOGOfferCollection = (content: any = {}) => {
    const title = content.title || '';
    const subtitle = content.subtitle || '';
    const subtitleAccent = content.subtitleAccent || '';
    const subtitleAccentColor = content.subtitleAccentColor || '';

    const titleStyle = getTextStyle(content.titleStyle, '#1c1917', 'serif');
    const subtitleStyle = getTextStyle(content.subtitleStyle, '#78716c', 'sans');

    const showHeader = title.trim() !== '' || subtitle.trim() !== '';

    // Tiles default configuration if not uploaded yet
    const tile1 = content.tile1 || {
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600",
      linkUrl: "#"
    };
    const tile2 = content.tile2 || {
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400",
      linkUrl: "#"
    };
    const tile3 = content.tile3 || {
      image: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&q=80&w=400",
      linkUrl: "#"
    };

    const renderSubtitleWithAccent = (text: string, accent?: string, accentColor?: string) => {
      if (!text) return null;
      if (!accent) return <span>{text}</span>;

      const index = text.toLowerCase().indexOf(accent.toLowerCase());
      if (index === -1) return <span>{text}</span>;

      const before = text.substring(0, index);
      const matched = text.substring(index, index + accent.length);
      const after = text.substring(index + accent.length);

      return (
        <span>
          {before}
          <span style={accentColor ? { color: accentColor } : { color: '#be123c' }} className="font-semibold">
            {matched}
          </span>
          {after}
        </span>
      );
    };

    return (
      <section className="py-6 md:py-8 px-4 sm:px-6 bg-white text-stone-900 border-y border-stone-100" id={`og-offer-section-${content.id || 'default'}`}>
        <div className="max-w-7xl mx-auto space-y-5 md:space-y-6">
          
          {/* Conditional Header Rendering */}
          {showHeader && (
            <div className="text-center space-y-1 max-w-2xl mx-auto">
              {title && (
                <h2 
                  className="font-serif text-xl md:text-2xl lg:text-3xl font-bold tracking-wide leading-tight" 
                  style={titleStyle}
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p 
                  className="text-stone-500 text-xs md:text-sm leading-normal" 
                  style={subtitleStyle}
                >
                  {renderSubtitleWithAccent(subtitle, subtitleAccent, subtitleAccentColor)}
                </p>
              )}
            </div>
          )}

          {/* Asymmetric 3-Tile Image Grid Layout */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:gap-5 items-stretch h-[220px] sm:h-[320px] md:h-[450px] lg:h-[500px]">
            {/* Tile 1: Left Large Tile */}
            <div className="w-full h-full min-h-0 min-w-0">
              {tile1.image ? (
                <Link 
                  to={tile1.linkUrl || '#'} 
                  className="block relative rounded-2xl overflow-hidden shadow-sm border border-stone-200/60 group w-full h-full transition-all hover:shadow-md cursor-pointer"
                >
                  <img 
                    src={tile1.image} 
                    alt={tile1.title || "Collection Highlight 1"} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle Elegant Title Overlay at the bottom */}
                  {tile1.title && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pt-8 pb-3 px-3 flex items-end justify-center transition-opacity duration-300">
                      <span 
                        className="text-white font-serif text-[11px] sm:text-base md:text-xl lg:text-2xl font-normal tracking-wide text-center"
                        style={{ textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}
                      >
                        {tile1.title}
                      </span>
                    </div>
                  )}
                </Link>
              ) : (
                <div className="w-full h-full rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-stone-400 font-medium text-xs">
                  Upload Left Highlight Image
                </div>
              )}
            </div>

            {/* Right Stack Column (Tile 2 & Tile 3) */}
            <div className="grid grid-cols-1 grid-rows-2 gap-2 sm:gap-4 md:gap-5 h-full min-h-0 min-w-0">
              {/* Tile 2: Top Right Small Tile */}
              <div className="w-full h-full min-h-0 min-w-0">
                {tile2.image ? (
                  <Link 
                    to={tile2.linkUrl || '#'} 
                    className="block relative rounded-2xl overflow-hidden shadow-sm border border-stone-200/60 group w-full h-full transition-all hover:shadow-md cursor-pointer"
                  >
                    <img 
                      src={tile2.image} 
                      alt={tile2.title || "Collection Highlight 2"} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    {/* Subtle Elegant Title Overlay at the bottom */}
                    {tile2.title && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pt-8 pb-3 px-3 flex items-end justify-center transition-opacity duration-300">
                        <span 
                          className="text-white font-serif text-[11px] sm:text-base md:text-xl lg:text-2xl font-normal tracking-wide text-center"
                          style={{ textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}
                        >
                          {tile2.title}
                        </span>
                      </div>
                    )}
                  </Link>
                ) : (
                  <div className="w-full h-full rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-stone-400 font-medium text-xs">
                    Upload Top Right Highlight Image
                  </div>
                )}
              </div>

              {/* Tile 3: Bottom Right Small Tile */}
              <div className="w-full h-full min-h-0 min-w-0">
                {tile3.image ? (
                  <Link 
                    to={tile3.linkUrl || '#'} 
                    className="block relative rounded-2xl overflow-hidden shadow-sm border border-stone-200/60 group w-full h-full transition-all hover:shadow-md cursor-pointer"
                  >
                    <img 
                      src={tile3.image} 
                      alt={tile3.title || "Collection Highlight 3"} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    {/* Subtle Elegant Title Overlay at the bottom */}
                    {tile3.title && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pt-8 pb-3 px-3 flex items-end justify-center transition-opacity duration-300">
                        <span 
                          className="text-white font-serif text-[11px] sm:text-base md:text-xl lg:text-2xl font-normal tracking-wide text-center"
                          style={{ textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}
                        >
                          {tile3.title}
                        </span>
                      </div>
                    )}
                  </Link>
                ) : (
                  <div className="w-full h-full rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-stone-400 font-medium text-xs">
                    Upload Bottom Right Highlight Image
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </section>
    );
  };

  const renderSectionContent = (type: string, content?: any) => {
    switch (type) {
      case 'Hero Banner':
        return renderHeroBanner(content);
      case 'Category Cards':
        return renderCategoryCards(content);
      case 'Shop by Collection':
      case 'Shop By Collection':
        return renderCollectionsShowcase(content);
      case 'Product Carousel':
        return renderProductCarousel(content);
      case 'About Collection':
      case 'Story Collage':
        return renderAboutCollection(content);
      case 'Why Choose Parasmoni':
        return renderWhyChooseUs(content);
      case 'Our Boutiques':
        return renderOurBoutiques(content);
      case 'Split Media Banner':
        return renderSplitMediaBanner(content);
      case 'Infinite Marquee':
        return renderInfiniteMarquee(content);
      case 'Media Slider':
        return renderMediaSlider(content);
      case 'OG Offer Collection':
        return renderOGOfferCollection(content);
      case 'Shop The Look':
        return renderShopTheLook(content);
      default:
        return (
          <div className="py-12 bg-stone-100 text-stone-500 text-center text-xs font-mono rounded border border-dashed border-stone-300">
            Unknown Section Type: {type}
          </div>
        );
    }
  };

  // Drag-and-drop mechanics
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const updated = [...currentSections];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    if (onReorderSections) {
      onReorderSections(updated);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="bg-stone-50" id="showroom-home-landing">
      {/* Inject Live Head Meta Tags */}
      {!isBuilder && (
        <PageSEOHead 
          seo={seoData || pageSeo} 
          pageTitle="VelvetBox | Premium Sterling Silver & Gold Jewellery"
        />
      )}

      {/* Informative Environment Status Banner */}
      {fallbackActive && (
        <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-4" id="fallback-notification-bar">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs text-amber-800">
            <span className="flex items-center gap-2 font-medium">
              <Database className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Developer Preview Mode</strong>: Showroom is seamlessly operating on fallback cache. Firestore initialization will hook automatically upon credentials load.
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Dynamic Sections Stack */}
      <div className="space-y-0" id="dynamic-sections-container">
        {currentLoadingSections ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-500 font-bold tracking-wider uppercase">Loading custom layout...</p>
          </div>
        ) : currentSections.length === 0 ? (
          <div className="py-24 text-center max-w-md mx-auto space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
            <h3 className="font-serif font-bold text-stone-800 text-lg">Empty Storefront Canvas</h3>
            <p className="text-stone-500 text-xs">There are no active storefront sections on the canvas. Add sections via the editor panel.</p>
          </div>
        ) : (
          currentSections.map((section, index) => {
            const isDragged = draggedIndex === index;
            const isSelected = selectedSectionId === section.id;
            return (
              <div 
                key={section.id || index}
                onClick={(e) => {
                  if (isBuilder) {
                    e.preventDefault();
                    e.stopPropagation();
                    onSectionClick && onSectionClick(section.id);
                  }
                }}
                className={`relative group/section transition-all duration-300 ${
                  isBuilder ? 'hover:ring-2 hover:ring-amber-500/50 cursor-pointer' : ''
                } ${
                  isBuilder && isSelected ? 'ring-4 ring-amber-500 bg-amber-500/5' : ''
                } ${isDragged ? 'opacity-40 scale-[0.99] ring-2 ring-amber-600 bg-stone-100' : ''}`}
                onDragOver={(e) => isBuilder && handleDragOver(e, index)}
              >
                {/* Floating control column on left edge (White pill, matching reference exactly) */}
                {isBuilder && (
                  <div 
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white border border-stone-200 shadow-xl rounded-full py-2.5 px-1.5 flex flex-col items-center gap-2.5 opacity-0 group-hover/section:opacity-100 transition-opacity duration-300 pointer-events-auto"
                    style={{ minWidth: '38px' }}
                  >
                    {/* Drag Handle */}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      className="text-stone-400 hover:text-stone-800 p-1.5 rounded hover:bg-stone-100 cursor-grab active:cursor-grabbing transition-colors flex items-center justify-center shrink-0"
                      title="Drag to reorder"
                    >
                      <div className="grid grid-cols-2 gap-0.5 w-3 h-4 items-center justify-center">
                        <div className="w-1 h-1 bg-current rounded-full"></div>
                        <div className="w-1 h-1 bg-current rounded-full"></div>
                        <div className="w-1 h-1 bg-current rounded-full"></div>
                        <div className="w-1 h-1 bg-current rounded-full"></div>
                        <div className="w-1 h-1 bg-current rounded-full"></div>
                        <div className="w-1 h-1 bg-current rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="w-5 h-[1px] bg-stone-100" />
                    
                    {/* Plus Icon (Adds section below) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddSectionClick && onAddSectionClick(index);
                      }}
                      className="text-stone-500 hover:text-amber-600 p-1.5 rounded hover:bg-stone-100 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                      title="Insert section below"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    
                    <div className="w-5 h-[1px] bg-stone-100" />
                    
                    {/* × Icon (Deletes section) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSectionClick && onDeleteSectionClick(index);
                      }}
                      className="text-stone-400 hover:text-red-600 p-1.5 rounded hover:bg-stone-100 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                      title="Delete section"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Real rendered section content */}
                <div className={isBuilder ? 'pointer-events-none select-none' : ''}>
                  {renderSectionContent(section.type, section.content)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 11. Contact CTA Segment */}
      <section className="py-20 px-4 sm:px-6 max-w-3xl mx-auto text-center space-y-8" id="contact-cta-section">
        <div className="space-y-3">
          <span className="text-[10px] text-brand-red-600 font-bold tracking-widest uppercase block">
            INQUIRIES & COMMISSIONS
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 tracking-wide">
            Commission a Custom Legacy Piece
          </h2>
          <p className="text-stone-500 text-xs leading-relaxed max-w-lg mx-auto font-medium">
            Have a specific weight, profile, or design layout in mind? Connect directly with our showroom team on phone or WhatsApp. We build bespoke masterpieces customized to your budget.
          </p>
        </div>

        <div className="max-w-md mx-auto pt-2">
          <ContactButtons 
            phoneNumber={mockWebsiteSettings.contactNumber}
            whatsappNumber={mockWebsiteSettings.whatsappNumber}
            whatsappMessage={mockWebsiteSettings.whatsappMessage}
          />
        </div>

        <div className="flex justify-center gap-6 text-stone-400 text-[11px] font-medium font-sans">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-gold-500" />
            <span>Open Mon - Sat</span>
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-gold-500" />
            <span>Kolkata Bowbazar & Gariahat</span>
          </span>
        </div>
      </section>
    </div>
  );
}
