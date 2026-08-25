/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  AlertCircle,
  Database
} from 'lucide-react';
import { 
  BannerSlider, 
  MetalPriceCard, 
  CollectionCard, 
  ProductGrid, 
  StoreCard, 
  ContactButtons 
} from '../components/ShowroomComponents';
import { 
  mockBanners, 
  mockMetalPrices, 
  mockCollections, 
  mockProducts, 
  mockStores 
} from '../data/mockData';
import { mockWebsiteSettings } from '../data/mockSettings';
import { db, isFirebaseConfigured } from '../firebase/config';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';

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

export function Home(): React.JSX.Element {
  // Real-time & Loaded States
  const [banners, setBanners] = useState<any[]>([]);
  const [metalPrices, setMetalPrices] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [newArrivalProducts, setNewArrivalProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);

  // Load Status tracking
  const [loadingBanners, setLoadingBanners] = useState(isFirebaseConfigured);
  const [loadingPrices, setLoadingPrices] = useState(isFirebaseConfigured);
  const [loadingCollections, setLoadingCollections] = useState(isFirebaseConfigured);
  const [loadingFeatured, setLoadingFeatured] = useState(isFirebaseConfigured);
  const [loadingNewArrivals, setLoadingNewArrivals] = useState(isFirebaseConfigured);
  const [loadingStores, setLoadingStores] = useState(isFirebaseConfigured);

  // Last update tracker
  const [lastUpdatedPrice, setLastUpdatedPrice] = useState<string>('');

  // Fallback state trackers
  const [fallbackActive, setFallbackActive] = useState(!isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Gracefully default to highly realistic mock datasets instantly (Priority Rule 1)
      setBanners(mockBanners);
      setMetalPrices(mockMetalPrices);
      setCollections(mockCollections);
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

        const items = snapshot.docs.map(doc => {
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
            metal: data.metal || data.metalType || '',
            pricePerGram: Number(data.pricePerGram || data.ratePerGram || 0),
            change: Number(data.change || 0),
            unit: data.unit || '1g',
            updateTimeStr
          };
        });

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

    // Clean up streams on unmount
    return () => {
      unsubscribeBanners();
      unsubscribePrices();
    };
  }, []);

  return (
    <div className="bg-stone-50" id="showroom-home-landing">
      
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

      {/* 3. Hero Banner Slider */}
      {loadingBanners ? (
        <div className="h-[460px] md:h-[600px] w-full bg-stone-900 flex items-center justify-center animate-pulse" id="banner-slider-skeleton">
          <div className="text-center space-y-4">
            <div className="h-6 w-48 bg-stone-800 mx-auto rounded"></div>
            <div className="h-4 w-96 bg-stone-800 mx-auto rounded"></div>
          </div>
        </div>
      ) : banners.length === 0 ? (
        <div className="h-[400px] bg-stone-900 flex items-center justify-center text-stone-400 text-xs px-6 text-center" id="banner-empty-state">
          <div>
            <AlertCircle className="w-8 h-8 text-gold-500 mx-auto mb-2" />
            <p className="font-serif italic font-bold">No Promotional Campaigns Active</p>
            <p className="text-[11px] text-stone-500 mt-1">Check back later or contact Bowbazar flagship showroom.</p>
          </div>
        </div>
      ) : (
        <BannerSlider banners={banners} />
      )}

      {/* 4. Today's Metal Prices Section */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto space-y-8" id="todays-rates-section">
        <div className="text-center space-y-2">
          <span className="text-[10px] text-gold-600 font-bold tracking-widest uppercase flex items-center justify-center gap-1.5">
            <Scale className="w-3.5 h-3.5" />
            <span>TRANSPARENT VALUATION</span>
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 tracking-wide">
            Today's Metal Valuation Rates
          </h2>
          <p className="text-stone-500 text-xs max-w-xl mx-auto font-medium">
            Daily rates dynamically calibrated based on Kolkata's bullion market. We maintain absolute transparency on gold purities.
          </p>
          {lastUpdatedPrice && (
            <div className="inline-flex items-center gap-1.5 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-full font-medium">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Rates Synced: {lastUpdatedPrice}</span>
            </div>
          )}
        </div>

        {loadingPrices ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="metal-prices-skeleton">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-28 bg-stone-200 animate-pulse rounded border border-stone-300"></div>
            ))}
          </div>
        ) : metalPrices.length === 0 ? (
          <div className="text-center py-10 bg-white border border-stone-200 rounded" id="prices-empty-state">
            <AlertCircle className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
            <p className="text-stone-600 text-xs font-medium">Pricing indices are currently undergoing market calibration.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {metalPrices.map((price, idx) => (
              <MetalPriceCard key={idx} price={price} />
            ))}
          </div>
        )}

        <div className="text-center">
          <p className="text-[10px] text-stone-400 font-sans italic">
            * Rates are indicative of physical showroom transactions, subject to change with active market updates. GST extra.
          </p>
        </div>
      </section>

      {/* 5. Shop by Collection */}
      <section className="bg-stone-100 py-20 px-4 sm:px-6 border-y border-stone-200" id="collections-showcase-section">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-[10px] text-gold-600 font-bold tracking-widest uppercase block">
                CURATED MASTERPIECES
              </span>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 tracking-wide">
                Shop by Heritage Collection
              </h2>
              <p className="text-stone-500 text-xs max-w-lg font-medium">
                From 22K Nakashi handiwork to modern brilliant-cut diamond solitaires, discover jewellery for every generation.
              </p>
            </div>
            <Link 
              to="/catalog" 
              className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-brand-red-600 hover:text-brand-red-700 transition-colors shrink-0 uppercase"
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
          ) : collections.length === 0 ? (
            <div className="text-center py-12 bg-white border border-stone-200 rounded" id="collections-empty-state">
              <AlertCircle className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
              <p className="text-stone-600 text-xs font-medium">No design collections published at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {collections.map((col) => (
                <CollectionCard key={col.id} collection={col} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. Featured Jewellery */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-12" id="featured-masterpieces-section">
        <div className="text-center space-y-2">
          <span className="text-[10px] text-gold-600 font-bold tracking-widest uppercase flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-500" />
            <span>DESIGN EXCELLENCE</span>
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 tracking-wide">
            Featured Sovereign Jewellery
          </h2>
          <p className="text-stone-500 text-xs max-w-xl mx-auto font-medium">
            Explore signature handcrafted designs renowned for heavy filigree detailing, kundan embellishments, and flawless diamonds.
          </p>
        </div>

        {loadingFeatured ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="featured-products-skeleton">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-96 bg-stone-200 animate-pulse rounded border border-stone-300"></div>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white border border-stone-200 rounded" id="featured-empty-state">
            <AlertCircle className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
            <p className="text-stone-600 text-xs font-medium">No featured vault products are currently on display.</p>
          </div>
        ) : (
          <ProductGrid products={featuredProducts} whatsappNumber={mockWebsiteSettings.whatsappNumber} />
        )}
      </section>

      {/* 7. New Arrivals */}
      <section className="bg-stone-100/50 py-20 px-4 sm:px-6 border-t border-stone-200" id="new-arrivals-section">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-[10px] text-brand-red-600 font-bold tracking-widest uppercase block">
              JUST REVEALED
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 tracking-wide">
              Fresh Showroom Arrivals
            </h2>
            <p className="text-stone-500 text-xs max-w-xl mx-auto font-medium">
              The latest additions straight from our master artisans' benches, capturing contemporary trends without compromising sovereign purity.
            </p>
          </div>

          {loadingNewArrivals ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="new-arrivals-skeleton">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-96 bg-stone-200 animate-pulse rounded border border-stone-300"></div>
              ))}
            </div>
          ) : newArrivalProducts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-stone-200 rounded" id="new-arrivals-empty-state">
              <AlertCircle className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
              <p className="text-stone-600 text-xs font-medium">No newly released assets registered this week.</p>
            </div>
          ) : (
            <ProductGrid products={newArrivalProducts} whatsappNumber={mockWebsiteSettings.whatsappNumber} />
          )}
        </div>
      </section>

      {/* 8. About Parasmoni (Heritage & Story) */}
      <section className="py-24 px-4 sm:px-6 bg-stone-950 text-stone-200 border-y border-gold-500/20 relative overflow-hidden" id="about-heritage-section">
        <div className="absolute inset-0 bg-[radial-gradient(#b58b37_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04]"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 text-gold-400 text-xs font-bold tracking-widest uppercase bg-stone-900 border border-gold-500/30 px-3 py-1 rounded">
                <History className="w-4 h-4 text-gold-400" />
                <span>SINCE 1974</span>
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-stone-100 tracking-wide leading-tight">
                Crafting Elegance for Five Decades
              </h2>
            </div>
            <p className="text-stone-400 text-sm leading-relaxed font-serif italic">
              "For over 50 years, Parasmoni Jewellers & Brothers has remained a sanctuary for families seeking authentic gold wirework, certified solitaires, and antique nakashi designs."
            </p>
            <p className="text-stone-300 text-xs leading-relaxed font-sans">
              Founded on the pillars of transparency and meticulous artisan work in Kolkata's historic Bowbazar, we maintain a legacy where every piece represents physical sovereign value and unparalleled visual poetry.
            </p>
            <div className="pt-2">
              <Link 
                to="/about"
                className="inline-flex h-10 px-6 bg-brand-red-600 hover:bg-brand-red-700 text-stone-100 text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded items-center gap-2"
              >
                <span>OUR FULL HERITAGE</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-12 gap-4">
            <div className="col-span-8 aspect-[4/3] rounded overflow-hidden border border-stone-800">
              <img 
                src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600" 
                alt="Intricate Goldsmith Artisan At Bench" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="col-span-4 aspect-square rounded overflow-hidden border border-stone-800 self-end">
              <img 
                src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=300" 
                alt="Detailed Gold Jewelry Finishing" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 9. Why Choose Parasmoni (Value Props) */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-12" id="why-choose-us-section">
        <div className="text-center space-y-2">
          <span className="text-[10px] text-gold-600 font-bold tracking-widest uppercase block">
            THE PARASMONI PLEDGE
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 tracking-wide">
            Our Quality Benchmarks
          </h2>
          <p className="text-stone-500 text-xs max-w-xl mx-auto font-medium">
            We adhere strictly to certifications and business ethics to safeguard your generational investments.
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

      {/* 10. Our Stores */}
      <section className="bg-stone-100 py-20 px-4 sm:px-6 border-y border-stone-200" id="our-stores-showcase">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-[10px] text-gold-600 font-bold tracking-widest uppercase block">
              VISIT OUR SHOWROOMS
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 tracking-wide">
              Experience the Craftsmanship In Person
            </h2>
            <p className="text-stone-500 text-xs max-w-xl mx-auto font-medium">
              Step into our physical galleries to inspect the intricate weight, lustre, and detail of our traditional jewellery.
            </p>
          </div>

          {loadingStores ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="stores-skeleton">
              {[1, 2].map(n => (
                <div key={n} className="h-64 bg-stone-200 animate-pulse rounded border border-stone-300"></div>
              ))}
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-12 bg-white border border-stone-200 rounded" id="stores-empty-state">
              <AlertCircle className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
              <p className="text-stone-600 text-xs font-medium">No active retail locations registered.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}
        </div>
      </section>

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
