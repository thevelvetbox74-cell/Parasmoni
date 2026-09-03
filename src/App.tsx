/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { MetalPriceBar } from './components/ShowroomComponents';
import { mockMetalPrices } from './data/mockData';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { ProductDetails } from './pages/ProductDetails';
import { Stores } from './pages/Stores';
import { Contact } from './pages/Contact';
import { CustomPage } from './pages/CustomPage';
import { AdminLayout } from './admin/AdminLayout';
import { db, isFirebaseConfigured } from './firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { WebsiteSettingsProvider } from './context/WebsiteSettingsContext';

export default function App(): React.JSX.Element {
  const [metalPrices, setMetalPrices] = useState<any[]>([]);
  
  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Local storage fallback for seamless developer/offline experience
      const localStored = localStorage.getItem('local_metal_prices');
      if (localStored) {
        try {
          const parsed = JSON.parse(localStored);
          const mapped = parsed
            .map((p: any) => ({
              id: p.id,
              metal: p.metalName || p.metal || '',
              pricePerGram: Number(p.price || p.pricePerGram || 0),
              change: Number(p.change || 0),
              unit: p.unit || '1g',
              status: p.status || 'active',
              displayOrder: typeof p.displayOrder === 'number' ? p.displayOrder : 9999
            }))
            .filter((p: any) => p.status === 'active');
          mapped.sort((a: any, b: any) => a.displayOrder - b.displayOrder);
          setMetalPrices(mapped);
        } catch (e) {
          setMetalPrices(mockMetalPrices);
        }
      } else {
        setMetalPrices(mockMetalPrices);
      }
      return;
    }

    const pricesRef = collection(db, 'metalPrices');
    const unsubscribe = onSnapshot(pricesRef, (snapshot) => {
      if (snapshot.empty) {
        setMetalPrices(mockMetalPrices);
        return;
      }

      const items = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            metal: data.metal || data.metalType || data.metalName || '',
            pricePerGram: Number(data.price || data.pricePerGram || data.ratePerGram || 0),
            change: Number(data.change || 0),
            unit: data.unit || '1g',
            status: data.status || 'active',
            displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 9999
          };
        })
        .filter(p => p.status === 'active');
      
      items.sort((a, b) => a.displayOrder - b.displayOrder);
      setMetalPrices(items);
    }, (error) => {
      console.error('Error fetching live metal prices for App Bar:', error);
      setMetalPrices(mockMetalPrices);
    });

    return () => unsubscribe();
  }, []);

  return (
    <WebsiteSettingsProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-stone-50 flex flex-col font-sans selection:bg-stone-200 selection:text-stone-900" id="showroom-app-root">
          <Routes>
            {/* Public Showroom Catalog Routes */}
            <Route
              path="/*"
              element={
                <>
                  <MetalPriceBar prices={metalPrices} />
                  <Navigation />
                  <div className="flex-1">
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
                      <Route path="/pages/:slug" element={<CustomPage />} />
                      <Route path="/pages" element={<Home />} />
                      {/* Fallback redirection to home */}
                      <Route path="*" element={<Home />} />
                    </Routes>
                  </div>
                  <Footer />
                </>
              }
            />

            {/* Secure Admin Portal Routes */}
            <Route
              path="/admin/*"
              element={
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
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    </WebsiteSettingsProvider>
  );
}

