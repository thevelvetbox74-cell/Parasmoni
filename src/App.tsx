/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';

function ConditionalFooter(): React.JSX.Element | null {
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  // Hide footer on product details pages and product category / catalog pages
  const isProductPage = path.startsWith('/product/') || path.startsWith('/products/');
  const isCategoryPage = 
    path === '/catalog' || 
    path === '/collections' || 
    path.startsWith('/collections/') || 
    path.startsWith('/category/') || 
    path === '/jewellery';

  if (isProductPage || isCategoryPage) {
    return null;
  }

  return (
    <div className="hidden md:block">
      <Footer />
    </div>
  );
}
import { BottomNavigation } from './components/BottomNavigation';
import { OfflineIndicator } from './components/OfflineIndicator';
import { MetalPriceBar } from './components/ShowroomComponents';
import { mockMetalPrices } from './data/mockData';
import { Home } from './pages/Home';
import { WebsiteSettingsProvider } from './context/WebsiteSettingsContext';
import { getCachedData, setCachedData } from './utils/cacheHelper';

// Route-based code splitting to shrink main bundle and eliminate TBT
const Catalog = React.lazy(() => import('./pages/Catalog').then(m => ({ default: (m as any).default || m.Catalog })));
const ProductDetails = React.lazy(() => import('./pages/ProductDetails').then(m => ({ default: (m as any).default || m.ProductDetails })));
const Stores = React.lazy(() => import('./pages/Stores').then(m => ({ default: (m as any).default || m.Stores })));
const Contact = React.lazy(() => import('./pages/Contact').then(m => ({ default: (m as any).default || m.Contact })));
const CustomPage = React.lazy(() => import('./pages/CustomPage').then(m => ({ default: (m as any).default || m.CustomPage })));
const Wishlist = React.lazy(() => import('./pages/Wishlist').then(m => ({ default: (m as any).default || m.Wishlist })));
const Profile = React.lazy(() => import('./pages/Profile').then(m => ({ default: (m as any).default || m.Profile })));
const AdminLayout = React.lazy(() => import('./admin/AdminLayout').then(m => ({ default: (m as any).default || m.AdminLayout })));

export default function App(): React.JSX.Element {
  const [metalPrices, setMetalPrices] = useState<any[]>(() => getCachedData('home_metal_prices', mockMetalPrices));
  
  useEffect(() => {
    // 1. Initial cached/local metal prices are applied immediately
    const localStored = typeof localStorage !== 'undefined' ? localStorage.getItem('local_metal_prices') : null;
    if (localStored) {
      try {
        const parsed = JSON.parse(localStored);
        const mapped = parsed
          .map((p: any) => {
            const basePrice = Number(p.price || p.pricePerGram || 0);
            return {
              id: p.id,
              metal: p.metalName || p.metal || '',
              pricePerGram: basePrice,
              lowPrice: p.lowPrice !== undefined ? Number(p.lowPrice) : (basePrice > 0 ? Math.floor(basePrice * 0.98) : 0),
              highPrice: p.highPrice !== undefined ? Number(p.highPrice) : (basePrice > 0 ? Math.ceil(basePrice * 1.02) : 0),
              change: Number(p.change || 0),
              unit: p.unit || '1g',
              status: p.status || 'active',
              displayOrder: typeof p.displayOrder === 'number' ? p.displayOrder : 9999
            };
          })
          .filter((p: any) => p.status === 'active');
        mapped.sort((a: any, b: any) => a.displayOrder - b.displayOrder);
        setMetalPrices(mapped);
      } catch (e) {}
    }

    // 2. Defer live Firebase subscription until after first paint & idle
    let unsubscribe: (() => void) | undefined;
    let isCancelled = false;

    const setupLivePrices = async () => {
      // Defer execution until after initial render paint
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        await new Promise(resolve => (window as any).requestIdleCallback(resolve, { timeout: 1500 }));
      } else {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      if (isCancelled) return;

      try {
        const { db, isFirebaseConfigured } = await import('./firebase/config');
        if (!isFirebaseConfigured || !db) return;

        const { collection, onSnapshot } = await import('firebase/firestore');
        if (isCancelled) return;

        const pricesRef = collection(db, 'metalPrices');
        unsubscribe = onSnapshot(pricesRef, (snapshot) => {
          if (snapshot.empty) return;

          const items = snapshot.docs
            .map(doc => {
              const data = doc.data();
              const basePrice = Number(data.price || data.pricePerGram || data.ratePerGram || 0);
              return {
                id: doc.id,
                metal: data.metal || data.metalType || data.metalName || '',
                pricePerGram: basePrice,
                lowPrice: data.lowPrice !== undefined ? Number(data.lowPrice) : (basePrice > 0 ? Math.floor(basePrice * 0.98) : 0),
                highPrice: data.highPrice !== undefined ? Number(data.highPrice) : (basePrice > 0 ? Math.ceil(basePrice * 1.02) : 0),
                change: Number(data.change || 0),
                unit: data.unit || '1g',
                status: data.status || 'active',
                displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 9999
              };
            })
            .filter(p => p.status === 'active');

          items.sort((a, b) => a.displayOrder - b.displayOrder);
          setMetalPrices(items);
          setCachedData('home_metal_prices', items);
        }, (error) => {
          console.error('Error fetching live metal prices for App Bar:', error);
        });
      } catch (err) {
        console.warn('Deferred Firebase initialization notice:', err);
      }
    };

    setupLivePrices();

    return () => {
      isCancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <WebsiteSettingsProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-stone-50 flex flex-col font-sans selection:bg-stone-200 selection:text-stone-900 w-full max-w-full overflow-x-clip" id="showroom-app-root">
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[999999] focus:bg-amber-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:font-semibold focus:shadow-lg"
          >
            Skip to content
          </a>
          <Routes>
            {/* Public Showroom Catalog Routes */}
            <Route
              path="/*"
              element={
                <>
                  <OfflineIndicator />
                  <div className="hidden lg:block min-h-[33px]">
                    <MetalPriceBar prices={metalPrices} />
                  </div>
                  <Navigation />
                  <main id="main-content" tabIndex={-1} className="flex-1 pb-20 md:pb-0 outline-none">
                    <React.Suspense fallback={<div className="min-h-[70vh] bg-stone-50" />}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/catalog" element={<Catalog />} />
                        <Route path="/collections" element={<Catalog />} />
                        <Route path="/collections/:slug" element={<Catalog />} />
                        <Route path="/category/:slug" element={<Catalog />} />
                        <Route path="/jewellery" element={<Catalog />} />
                        <Route path="/product/:slug" element={<ProductDetails />} />
                        <Route path="/products/:slug" element={<ProductDetails />} />
                        <Route path="/stores" element={<Stores />} />
                        <Route path="/our-stores" element={<Stores />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/inquire" element={<Contact />} />
                        <Route path="/wishlist" element={<Wishlist />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/pages/:slug" element={<CustomPage />} />
                        <Route path="/pages" element={<Home />} />
                        {/* Fallback redirection to home */}
                        <Route path="*" element={<Home />} />
                      </Routes>
                    </React.Suspense>
                  </main>
                  <ConditionalFooter />
                  <BottomNavigation />
                </>
              }
            />

            {/* Secure Admin Portal Routes */}
            <Route
              path="/admin/*"
              element={
                <React.Suspense fallback={<div className="min-h-screen bg-stone-900" />}>
                  <AdminLayout>
                  <div className="text-stone-700" id="admin-cms-placeholder">
                    <p className="text-sm font-medium mb-4 text-stone-500 uppercase tracking-wider">
                      Showroom Catalogue Management
                    </p>
                    <p className="text-sm leading-relaxed mb-6">
                      Welcome to the private administration panel. Here you will be able to upload jewellery photography, manage metadata collections, update real-time gold/silver price rates per gram, and answer client showroom enquiries.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      <div className="p-4 bg-stone-50 rounded border border-stone-200">
                        <h4 className="font-semibold text-stone-900 text-xs uppercase tracking-wider mb-1">Products</h4>
                        <p className="text-xs text-stone-500">Add, edit purity/weight, and publish catalog items.</p>
                      </div>
                      <div className="p-4 bg-stone-50 rounded border border-stone-200">
                        <h4 className="font-semibold text-stone-900 text-xs uppercase tracking-wider mb-1">Metal Rates</h4>
                        <p className="text-xs text-stone-500">Live rate updates for 24K, 22K, 18K gold and silver.</p>
                      </div>
                      <div className="p-4 bg-stone-50 rounded border border-stone-200">
                        <h4 className="font-semibold text-stone-900 text-xs uppercase tracking-wider mb-1">Enquiries</h4>
                        <p className="text-xs text-stone-500">Review WhatsApp, email, or telephone call-back leads.</p>
                      </div>
                    </div>
                  </div>
                </AdminLayout>
              </React.Suspense>
            }
          />
          </Routes>
        </div>
      </BrowserRouter>
    </WebsiteSettingsProvider>
  );
}

