/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Mobile Bottom Navigation Bar (Image 1 Exact Curved Top Shape & Active Line Indicator)
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  LayoutGrid, 
  User, 
  MessageSquareText, 
  Heart,
  Sparkles
} from 'lucide-react';
import { useWebsiteSettings } from '../context/WebsiteSettingsContext';
import { getWishlist } from '../utils/wishlistHelper';

const CustomerLiveChatModal = React.lazy(() => 
  import('./CustomerLiveChatModal').then(m => ({ default: m.CustomerLiveChatModal }))
);

export function BottomNavigation(): React.JSX.Element | null {
  const location = useLocation();
  const { settings } = useWebsiteSettings();
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Sync wishlist badge count & listen for chat open events in real-time
  useEffect(() => {
    setWishlistCount(getWishlist().length);

    const handleSync = () => {
      setWishlistCount(getWishlist().length);
    };

    const handleOpenChat = () => {
      setIsChatOpen(true);
    };

    window.addEventListener('wishlist-updated', handleSync);
    window.addEventListener('open-parasmoni-chat', handleOpenChat);

    return () => {
      window.removeEventListener('wishlist-updated', handleSync);
      window.removeEventListener('open-parasmoni-chat', handleOpenChat);
    };
  }, []);

  const currentPath = location.pathname;

  // Active state checker
  const isHomeActive = currentPath === '/';
  const isCategoryActive = currentPath.startsWith('/catalog') || currentPath.startsWith('/category') || currentPath.startsWith('/collections');
  const isProfileActive = currentPath.startsWith('/profile');
  const isWishlistActive = currentPath.startsWith('/wishlist');

  // Active brand color (Parasmoni Royal Burgundy)
  const activeTextColor = 'text-[#6B1F2A] font-bold';
  const activeIconColor = 'text-[#6B1F2A] stroke-[2.4]';
  const inactiveTextColor = 'text-stone-500 font-medium';
  const inactiveIconColor = 'text-stone-400 stroke-[1.8] hover:text-[#6B1F2A]';

  // Do not render bottom nav on Admin dashboard layouts
  if (currentPath.startsWith('/admin')) {
    return null;
  }

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-lg border-t border-stone-200/80 rounded-t-[30px] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] px-3 pt-3 pb-[calc(10px+env(safe-area-inset-bottom))] transition-all duration-300"
      id="mobile-bottom-navigation"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        
        {/* 1. HOME TAB */}
        <Link 
          to="/" 
          className="flex flex-col items-center justify-center relative w-16 group cursor-pointer"
          id="nav-tab-home"
        >
          <div className="flex flex-col items-center transition-transform duration-200 active:scale-95">
            <Home className={`w-6 h-6 transition-colors ${isHomeActive ? activeIconColor : inactiveIconColor}`} />
            <span className={`text-[11px] tracking-tight mt-1 transition-colors ${isHomeActive ? activeTextColor : inactiveTextColor}`}>
              Home
            </span>
            
            {/* Active Indicator Line (Exact Match to Image 1) */}
            {isHomeActive ? (
              <span className="w-6 h-1 rounded-full bg-[#6B1F2A] mt-1 shadow-2xs animate-in fade-in zoom-in-50 duration-200" />
            ) : (
              <span className="w-6 h-1 mt-1 opacity-0" />
            )}
          </div>
        </Link>

        {/* 2. CATEGORIES TAB */}
        <Link 
          to="/catalog" 
          className="flex flex-col items-center justify-center relative w-16 group cursor-pointer"
          id="nav-tab-categories"
        >
          <div className="flex flex-col items-center transition-transform duration-200 active:scale-95">
            <LayoutGrid className={`w-6 h-6 transition-colors ${isCategoryActive ? activeIconColor : inactiveIconColor}`} />
            <span className={`text-[11px] tracking-tight mt-1 transition-colors ${isCategoryActive ? activeTextColor : inactiveTextColor}`}>
              Category
            </span>
            
            {/* Active Indicator Line */}
            {isCategoryActive ? (
              <span className="w-6 h-1 rounded-full bg-[#6B1F2A] mt-1 shadow-2xs animate-in fade-in zoom-in-50 duration-200" />
            ) : (
              <span className="w-6 h-1 mt-1 opacity-0" />
            )}
          </div>
        </Link>

        {/* 3. PROFILE TAB */}
        <Link 
          to="/profile" 
          className="flex flex-col items-center justify-center relative w-16 group cursor-pointer"
          id="nav-tab-profile"
        >
          <div className="flex flex-col items-center transition-transform duration-200 active:scale-95">
            <User className={`w-6 h-6 transition-colors ${isProfileActive ? activeIconColor : inactiveIconColor}`} />
            <span className={`text-[11px] tracking-tight mt-1 transition-colors ${isProfileActive ? activeTextColor : inactiveTextColor}`}>
              Profile
            </span>
            
            {/* Active Indicator Line */}
            {isProfileActive ? (
              <span className="w-6 h-1 rounded-full bg-[#6B1F2A] mt-1 shadow-2xs animate-in fade-in zoom-in-50 duration-200" />
            ) : (
              <span className="w-6 h-1 mt-1 opacity-0" />
            )}
          </div>
        </Link>

        {/* 4. MESSAGE TAB (Opens Live Customer Support Modal) */}
        <button 
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="flex flex-col items-center justify-center relative w-16 group cursor-pointer border-none bg-transparent"
          id="nav-tab-message"
        >
          <div className="flex flex-col items-center transition-transform duration-200 active:scale-95">
            <div className="relative">
              <MessageSquareText className={`w-6 h-6 transition-colors ${isChatOpen ? activeIconColor : inactiveIconColor}`} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white animate-pulse" />
            </div>
            <span className={`text-[11px] tracking-tight mt-1 transition-colors ${isChatOpen ? activeTextColor : inactiveTextColor}`}>
              Message
            </span>
            
            {/* Active Indicator Line */}
            {isChatOpen ? (
              <span className="w-6 h-1 rounded-full bg-[#6B1F2A] mt-1 shadow-2xs animate-in fade-in zoom-in-50 duration-200" />
            ) : (
              <span className="w-6 h-1 mt-1 opacity-0" />
            )}
          </div>
        </button>

        {/* 5. WISHLIST TAB */}
        <Link 
          to="/wishlist" 
          className="flex flex-col items-center justify-center relative w-16 group cursor-pointer"
          id="nav-tab-wishlist"
        >
          <div className="flex flex-col items-center transition-transform duration-200 active:scale-95">
            <div className="relative">
              <Heart className={`w-6 h-6 transition-colors ${isWishlistActive ? 'text-[#6B1F2A] fill-[#6B1F2A] stroke-[2.4]' : inactiveIconColor}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-[#6B1F2A] text-white font-sans text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border-2 border-white shadow-xs min-w-[18px] h-[18px] flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className={`text-[11px] tracking-tight mt-1 transition-colors ${isWishlistActive ? activeTextColor : inactiveTextColor}`}>
              Wishlist
            </span>
            
            {/* Active Indicator Line */}
            {isWishlistActive ? (
              <span className="w-6 h-1 rounded-full bg-[#6B1F2A] mt-1 shadow-2xs animate-in fade-in zoom-in-50 duration-200" />
            ) : (
              <span className="w-6 h-1 mt-1 opacity-0" />
            )}
          </div>
        </Link>

      </div>

      {/* Live Customer Chat Modal Drawer (Loaded on-demand to protect initial TBT) */}
      {isChatOpen && (
        <React.Suspense fallback={null}>
          <CustomerLiveChatModal 
            isOpen={isChatOpen} 
            onClose={() => setIsChatOpen(false)} 
          />
        </React.Suspense>
      )}
    </div>
  );
}
