/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, User, MessageCircle, Heart } from 'lucide-react';
import { useWebsiteSettings } from '../context/WebsiteSettingsContext';
import { getWishlist } from '../utils/wishlistHelper';

export function BottomNavigation(): React.JSX.Element | null {
  const location = useLocation();
  const { settings } = useWebsiteSettings();
  const [wishlistCount, setWishlistCount] = useState(0);

  // Sync wishlist badge count in real-time
  useEffect(() => {
    setWishlistCount(getWishlist().length);

    const handleSync = () => {
      setWishlistCount(getWishlist().length);
    };

    window.addEventListener('wishlist-updated', handleSync);
    return () => {
      window.removeEventListener('wishlist-updated', handleSync);
    };
  }, []);

  const currentPath = location.pathname;

  // Active state checker
  const isHomeActive = currentPath === '/';
  const isCategoryActive = currentPath.startsWith('/catalog') || currentPath.startsWith('/category') || currentPath.startsWith('/collections');
  const isProfileActive = currentPath.startsWith('/profile');
  const isWishlistActive = currentPath.startsWith('/wishlist');

  const whatsappNumber = (settings?.whatsappNumber || '919051412413').replace(/[^0-9]/g, '');
  const whatsappMessage = settings?.whatsappMessage || 'Hello Parasmoni Jewellers, I am interested in exploring your signature showroom masterpieces.';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  // Active state colors from Parasmoni brand guidelines
  // Deep Red matches #6B1F2A (brand CTA button red)
  const activeColor = 'text-[#6B1F2A]';
  const activeDotBg = 'bg-[#6B1F2A]';
  const inactiveColor = 'text-stone-400';

  // Do not render bottom nav on Admin dashboard layouts
  if (currentPath.startsWith('/admin')) {
    return null;
  }

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-stone-200/60 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] px-2 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2.5 transition-all duration-300"
      id="mobile-bottom-navigation"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        
        {/* 1. HOME TAB */}
        <Link 
          to="/" 
          className="flex flex-col items-center justify-center relative w-16 group cursor-pointer"
          id="nav-tab-home"
        >
          <div className="flex flex-col items-center transition-all duration-200 active:scale-90">
            <Home className={`w-5.5 h-5.5 mb-1 stroke-[2.2] transition-colors ${isHomeActive ? activeColor : inactiveColor}`} />
            <span className={`text-[10px] font-sans font-semibold tracking-wide transition-colors ${isHomeActive ? activeColor : 'text-stone-500'}`}>
              Home
            </span>
            {isHomeActive && (
              <span className={`w-1 h-1 rounded-full mt-0.5 ${activeDotBg}`} />
            )}
          </div>
        </Link>

        {/* 2. CATEGORIES TAB */}
        <Link 
          to="/catalog" 
          className="flex flex-col items-center justify-center relative w-16 group cursor-pointer"
          id="nav-tab-categories"
        >
          <div className="flex flex-col items-center transition-all duration-200 active:scale-90">
            <Grid className={`w-5.5 h-5.5 mb-1 stroke-[2.2] transition-colors ${isCategoryActive ? activeColor : inactiveColor}`} />
            <span className={`text-[10px] font-sans font-semibold tracking-wide transition-colors ${isCategoryActive ? activeColor : 'text-stone-500'}`}>
              Category
            </span>
            {isCategoryActive && (
              <span className={`w-1 h-1 rounded-full mt-0.5 ${activeDotBg}`} />
            )}
          </div>
        </Link>

        {/* 3. PROFILE TAB */}
        <Link 
          to="/profile" 
          className="flex flex-col items-center justify-center relative w-16 group cursor-pointer"
          id="nav-tab-profile"
        >
          <div className="flex flex-col items-center transition-all duration-200 active:scale-90">
            <User className={`w-5.5 h-5.5 mb-1 stroke-[2.2] transition-colors ${isProfileActive ? activeColor : inactiveColor}`} />
            <span className={`text-[10px] font-sans font-semibold tracking-wide transition-colors ${isProfileActive ? activeColor : 'text-stone-500'}`}>
              Profile
            </span>
            {isProfileActive && (
              <span className={`w-1 h-1 rounded-full mt-0.5 ${activeDotBg}`} />
            )}
          </div>
        </Link>

        {/* 4. MESSAGE TAB (Existing WhatsApp contact flow) */}
        <a 
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center relative w-16 group cursor-pointer"
          id="nav-tab-message"
        >
          <div className="flex flex-col items-center transition-all duration-200 active:scale-90">
            <MessageCircle className={`w-5.5 h-5.5 mb-1 stroke-[2.2] transition-colors ${inactiveColor} group-hover:text-emerald-500`} />
            <span className="text-[10px] font-sans font-semibold tracking-wide text-stone-500 group-hover:text-emerald-500 transition-colors">
              Message
            </span>
          </div>
        </a>

        {/* 5. WISHLIST TAB */}
        <Link 
          to="/wishlist" 
          className="flex flex-col items-center justify-center relative w-16 group cursor-pointer"
          id="nav-tab-wishlist"
        >
          <div className="flex flex-col items-center transition-all duration-200 active:scale-90">
            <div className="relative">
              <Heart className={`w-5.5 h-5.5 mb-1 stroke-[2.2] transition-colors ${isWishlistActive ? 'text-red-500 fill-red-500' : inactiveColor}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white font-sans text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-white shadow-xs min-w-[16px] h-[16px] flex items-center justify-center animate-bounce-short">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-sans font-semibold tracking-wide transition-colors ${isWishlistActive ? 'text-red-500' : 'text-stone-500'}`}>
              Wishlist
            </span>
            {isWishlistActive && (
              <span className="w-1 h-1 rounded-full mt-0.5 bg-red-500" />
            )}
          </div>
        </Link>

      </div>
    </div>
  );
}
