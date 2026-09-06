/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, Sparkles } from 'lucide-react';
import { ProductCard } from '../components/ShowroomComponents';
import { mockProducts } from '../data/mockData';
import { db, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { getWishlist } from '../utils/wishlistHelper';

export function Wishlist(): React.JSX.Element {
  const [products, setProducts] = useState<any[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>(getWishlist());
  const [loading, setLoading] = useState(true);

  // Synchronize wishlist state when updated globally
  useEffect(() => {
    const handleSync = () => {
      setWishlistIds(getWishlist());
    };
    window.addEventListener('wishlist-updated', handleSync);
    return () => {
      window.removeEventListener('wishlist-updated', handleSync);
    };
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!isFirebaseConfigured) {
        setProducts(mockProducts);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data
          };
        });
        setProducts(items);
      } catch (err) {
        console.error('Error fetching products for wishlist:', err);
        setProducts(mockProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Clean up deleted or unpublished product IDs from localStorage
  useEffect(() => {
    if (loading || products.length === 0) return;
    
    const validIds = new Set(
      products.map(p => p.id).concat(products.map(p => p.slug)).filter(Boolean)
    );
    
    const currentWishlist = getWishlist();
    const cleanedWishlist = currentWishlist.filter(id => validIds.has(id));
    
    if (cleanedWishlist.length !== currentWishlist.length) {
      localStorage.setItem('parasmoni_wishlist', JSON.stringify(cleanedWishlist));
      setWishlistIds(cleanedWishlist);
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
    }
  }, [loading, products]);

  // Filter products matching wishlistIds
  const savedItems = products.filter(p => wishlistIds.includes(p.id) || wishlistIds.includes(p.slug));

  const whatsappNumber = "919051412413"; // Master craftsman's WhatsApp phone number

  return (
    <div className="min-h-screen bg-stone-50 pb-28 md:pb-16 pt-6 sm:pt-10" id="wishlist-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Back Button */}
        <div className="mb-6 sm:mb-10">
          <Link 
            to="/catalog" 
            className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors text-xs sm:text-sm font-semibold tracking-wide uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Collection</span>
          </Link>
        </div>

        {/* Title Block */}
        <div className="border-b border-stone-200 pb-5 sm:pb-8 mb-8 sm:mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-brand-red-600 fill-brand-red-600" />
            <h1 className="font-serif font-bold text-2xl sm:text-4xl text-stone-900 tracking-wide">
              Saved Masterpieces
            </h1>
          </div>
          <p className="text-stone-500 text-xs sm:text-sm font-sans max-w-2xl">
            A private curatorial selection of your favorite Parasmoni designs. Bring these references with you on your next showroom appointment or enquire instantly.
          </p>
        </div>

        {/* Wishlist Content Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-2 border-brand-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-stone-500 text-xs sm:text-sm">Retrieving your collection...</p>
          </div>
        ) : savedItems.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-3xl p-8 sm:p-16 text-center max-w-xl mx-auto shadow-sm mt-4">
            <div className="w-16 h-16 bg-red-50 text-brand-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-brand-red-600" />
            </div>
            <h3 className="font-serif font-bold text-lg sm:text-2xl text-stone-900 mb-3">
              Your Selection is Empty
            </h3>
            <p className="text-stone-500 text-xs sm:text-sm leading-relaxed mb-8 font-sans">
              No signature pieces have been saved to your list yet. Browse our legendary design catalog and click the heart icon on any masterpiece to start your collection.
            </p>
            <Link
              to="/catalog"
              className="inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-6 sm:px-8 text-xs sm:text-sm font-bold tracking-widest uppercase bg-brand-red-600 text-stone-100 hover:bg-brand-red-700 rounded-lg shadow-md transition-all active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explore Masterpieces</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {savedItems.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                whatsappNumber={whatsappNumber}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
