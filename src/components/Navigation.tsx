/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Search, 
  Phone, 
  ChevronRight, 
  Sparkles,
  Store,
  MapPin,
  Clock,
  Calendar,
  Compass,
  MessageCircle,
  Heart
} from 'lucide-react';
import { useWebsiteSettings } from '../context/WebsiteSettingsContext';
import { db } from '../firebase/config';
import { collection, getDocs, query } from 'firebase/firestore';
import { mockWebsiteSettings } from '../data/mockSettings';
import { getWishlist } from '../utils/wishlistHelper';

export function Navigation({ 
  customNavItems, 
  customGlobalTextColor, 
  customGlobalFontSize, 
  customGlobalFontWeight 
}: { 
  customNavItems?: any[]; 
  customGlobalTextColor?: string; 
  customGlobalFontSize?: string; 
  customGlobalFontWeight?: string; 
} = {}): React.JSX.Element {
  const { settings } = useWebsiteSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchBarOpen, setSearchBarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [storePanelOpen, setStorePanelOpen] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [loadingStores, setLoadingStores] = useState(true);
  const [activeMobileAccordion, setActiveMobileAccordion] = useState<string | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const navigate = useNavigate();

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

  // Listen to escape key to close store locator panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setStorePanelOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch store details live from Firestore
  useEffect(() => {
    async function loadStores() {
      try {
        const storesRef = collection(db, 'stores');
        const qStores = query(storesRef);
        const snapshot = await getDocs(qStores);
        let fetchedStores = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            address: data.address || '',
            phone: data.phone || '',
            whatsapp: data.whatsapp || data.whatsappNumber || '',
            hours: data.hours || data.workingHours || '',
            workingHours: data.workingHours || data.hours || '',
            mapUrl: data.mapUrl || data.googleMapsUrl || '',
            googleMapsUrl: data.googleMapsUrl || data.mapUrl || '',
            imageUrl: data.imageUrl || '',
            city: data.city || '',
            area: data.area || '',
            weeklyOff: data.weeklyOff || '',
            latitude: data.latitude !== undefined ? Number(data.latitude) : (data.lat !== undefined ? Number(data.lat) : undefined),
            longitude: data.longitude !== undefined ? Number(data.longitude) : (data.lng !== undefined ? Number(data.lng) : undefined),
            lat: data.lat !== undefined ? Number(data.lat) : undefined,
            lng: data.lng !== undefined ? Number(data.lng) : undefined,
            displayOrder: data.displayOrder !== undefined ? Number(data.displayOrder) : (data.order !== undefined ? Number(data.order) : 999),
            isActive: data.isActive !== undefined ? data.isActive : (data.status !== 'inactive')
          };
        });

        // Filter active showrooms
        fetchedStores = fetchedStores.filter((s: any) => s.isActive !== false);

        // Sort by display order
        fetchedStores.sort((a, b) => {
          const orderA = a.displayOrder ?? 999;
          const orderB = b.displayOrder ?? 999;
          return orderA - orderB;
        });

        if (fetchedStores.length > 0) {
          setStores(fetchedStores);
        } else {
          setStores(getFallbackStores());
        }
      } catch (err) {
        console.warn("Could not retrieve active store registries for header popover, applying fallbacks", err);
        setStores(getFallbackStores());
      } finally {
        setLoadingStores(false);
      }
    }
    loadStores();
  }, []);

  function getFallbackStores() {
    return [
      {
        id: "store-1",
        name: "Flagship Showroom — Bowbazar",
        address: "123, Bowbazar Street, Near Lalbazar Crossing, Kolkata, West Bengal 700012, India",
        phone: "+91 33 2241 9876",
        whatsapp: "+91 9876543210",
        hours: "Mon - Sat: 11:30 AM - 8:00 PM",
        weeklyOff: "Sunday",
        mapUrl: "https://maps.google.com/?q=22.5694,88.3582",
        googleMapsUrl: "https://maps.google.com/?q=22.5694,88.3582",
        imageUrl: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&q=80&w=600",
        city: "Kolkata",
        area: "Bowbazar",
        latitude: 22.5694,
        longitude: 88.3582,
        displayOrder: 1
      },
      {
        id: "store-2",
        name: "Heritage Galleria — Gariahat",
        address: "45/A, Rashbehari Avenue, Opposite Gariahat Mall, Kolkata, West Bengal 700029, India",
        phone: "+91 33 2464 5432",
        whatsapp: "+91 9876543211",
        hours: "Mon - Sat: 11:30 AM - 8:00 PM",
        weeklyOff: "Sunday",
        mapUrl: "https://maps.google.com/?q=22.5186,88.3678",
        googleMapsUrl: "https://maps.google.com/?q=22.5186,88.3678",
        imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600",
        city: "Kolkata",
        area: "Gariahat",
        latitude: 22.5186,
        longitude: 88.3678,
        displayOrder: 2
      }
    ];
  }

  const getLinkUrl = (link?: any) => {
    if (!link) return '/';
    if (typeof link === 'string') return link;
    if (link.url) return link.url;
    if (link.mode === 'collection') {
      return `/collections/${link.value}`;
    }
    if (link.mode === 'category') {
      return `/category/${link.value}`;
    }
    if (link.mode === 'page') {
      return `/pages/${link.value}`;
    }
    return link.value || '/';
  };

  const dynamicNavItems = customNavItems || settings.navigation || mockWebsiteSettings.navigation || [];

  const getNavTextStyle = (item: any) => {
    const textColor = item.textColor || customGlobalTextColor || settings.navGlobalTextColor || '#ffffff';
    const fontSize = customGlobalFontSize || settings.navGlobalFontSize || '11px';
    return {
      color: textColor,
      fontSize: fontSize,
    };
  };

  const getNavFontClass = () => {
    return customGlobalFontWeight || settings.navGlobalFontWeight || 'font-semibold';
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchBarOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="bg-brand-red-600 border-b border-brand-red-700/50 font-sans sticky top-0 z-50 shadow-sm text-white w-full max-w-full" id="main-navigation">
      {/* Search Dropdown / Overlay */}
      {searchBarOpen && (
        <div className="bg-stone-50 border-b border-stone-200 py-4 px-6 animate-fade-in-up" id="header-search-bar">
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex items-center gap-3">
            <Search className="w-5 h-5 text-stone-400 shrink-0" />
            <input 
              type="text"
              placeholder="Search handcrafted gold, solitaire diamonds, kundan, jhumkas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-stone-800 placeholder-stone-400 focus:outline-hidden py-1"
              autoFocus
            />
            <button 
              type="button" 
              onClick={() => setSearchBarOpen(false)}
              className="text-stone-400 hover:text-stone-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Main Bar */}
      <div className="w-full px-4 md:px-6 h-14 flex items-center justify-between relative">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-95 transition-opacity shrink-0" onClick={() => setMobileMenuOpen(false)}>
          <img 
            src={settings.logoUrl || undefined} 
            alt={`${settings.brandName} Logo`} 
            className="h-10 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <span className="font-display text-[11px] md:text-xs tracking-wider text-white font-bold leading-tight uppercase">
              {settings.brandName.split('&')[0].trim()}
            </span>
            <span className="text-[7px] md:text-[8px] text-stone-200 tracking-widest uppercase font-bold">
              {settings.brandName.includes('&') ? '& ' + settings.brandName.split('&').slice(1).join('&').trim() : 'JEWELLERS'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-6 text-[11px] tracking-widest uppercase text-white/95" style={{ zIndex: 100 }}>
          {dynamicNavItems.map((item: any) => {
            const fontClass = getNavFontClass();
            const textStyle = getNavTextStyle(item);
            
            if (item.type === 'dropdown') {
              return (
                <div key={item.id} className="relative group py-2" id={`nav-item-dropdown-${item.id}`}>
                  <button 
                    className={`hover:opacity-80 transition-opacity flex items-center uppercase tracking-widest cursor-pointer focus:outline-none ${fontClass}`}
                    style={textStyle}
                  >
                    <span>{item.label}</span>
                  </button>
                  {/* Dropdown panel */}
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-2xl border border-stone-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-250 z-50">
                    {item.dropdownItems && item.dropdownItems.map((sub: any) => (
                      <Link
                        key={sub.id}
                        to={getLinkUrl(sub.link)}
                        className="block px-4 py-2.5 text-[11px] hover:bg-stone-50 hover:text-brand-red-600 font-bold transition-colors border-l-2 border-transparent hover:border-brand-red-600 uppercase tracking-wider text-stone-700"
                        style={sub.color ? { color: sub.color } : undefined}
                      >
                        {sub.title}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            if (item.type === 'mega') {
              const megaCols = item.megaColumns || [];
              const colCount = megaCols.length;
              const dynamicLayoutClass = 
                colCount === 1 ? 'grid-cols-1 w-72' :
                colCount === 2 ? 'grid-cols-2 w-[480px]' :
                colCount === 3 ? 'grid-cols-3 w-[720px]' :
                'grid-cols-4 w-[80vw] max-w-5xl';

              return (
                <div key={item.id} className="relative group py-2" id={`nav-item-mega-${item.id}`}>
                   <button 
                    className={`hover:opacity-80 transition-opacity flex items-center uppercase tracking-widest cursor-pointer focus:outline-none ${fontClass}`}
                    style={textStyle}
                  >
                    <span>{item.label}</span>
                  </button>
                  {/* Mega Menu panel */}
                  <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-stone-100 rounded-lg shadow-2xl py-5 px-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 text-stone-800 grid ${dynamicLayoutClass} gap-6`}>
                    {megaCols.map((col: any) => (
                      <div key={col.id} className="flex flex-col h-auto justify-start gap-4">
                        <div className="space-y-3 flex-1">
                          <h5 
                            className="font-serif font-bold text-brand-red-600 text-[11px] tracking-wider uppercase border-b border-stone-100 pb-2"
                            style={col.titleColor ? { color: col.titleColor } : undefined}
                          >
                            {col.subtitle}
                          </h5>
                          <div className="space-y-2 flex flex-col mb-1">
                            {col.links && col.links.map((subLink: any) => (
                              <Link
                                key={subLink.id}
                                to={getLinkUrl(subLink.link)}
                                className="text-stone-600 hover:text-brand-red-600 text-[11px] font-semibold uppercase tracking-wider transition-colors hover:translate-x-0.5 duration-150 transform"
                                style={subLink.color ? { color: subLink.color } : undefined}
                              >
                                {subLink.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                        {col.image && (
                          <div className="rounded overflow-hidden aspect-video border border-stone-200 shadow-sm">
                            <img 
                              src={col.image} 
                              alt={col.subtitle} 
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            // Default - Direct Link
            return (
              <Link 
                key={item.id} 
                to={getLinkUrl(item.link)} 
                className={`hover:opacity-80 transition-opacity relative py-2 group ${fontClass}`}
                style={textStyle}
                id={`nav-item-direct-${item.id}`}
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search Button */}
          <button 
            onClick={() => setSearchBarOpen(!searchBarOpen)}
            className="p-2 text-white/90 hover:text-white transition-colors cursor-pointer"
            aria-label="Search Catalog"
            id="search-btn-toggle"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Desktop/Tablet Wishlist Heart Icon */}
          <Link 
            to="/wishlist"
            className="p-2 text-white/90 hover:text-white transition-colors cursor-pointer relative"
            aria-label="Wishlist"
            id="header-wishlist-btn"
          >
            <Heart className={`w-5 h-5 transition-all ${wishlistCount > 0 ? 'fill-white text-white scale-110' : ''}`} />
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white font-sans text-[8px] font-extrabold w-4 h-4 rounded-full border border-brand-red-600 flex items-center justify-center shadow-xs">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Store Locator Icon replacing Shopping Bag */}
          <button 
            onClick={() => setStorePanelOpen(!storePanelOpen)}
            className="p-2 text-white/90 hover:text-white transition-colors cursor-pointer relative"
            aria-label="Find Our Stores"
            id="store-locator-btn-toggle"
          >
            <Store className="w-5 h-5" />
          </button>

          {/* Desktop Contact CTA Button with Inverted Colors */}
          <Link 
            to="/contact" 
            className="hidden md:flex h-8 px-3.5 bg-white hover:scale-[1.02] hover:shadow-md text-brand-red-600 border border-white text-[10px] font-bold tracking-widest uppercase transition-all duration-300 rounded items-center justify-center gap-1.5 cursor-pointer"
          >
            <Phone className="w-3 h-3 text-brand-red-600" />
            <span>CONTACT US</span>
          </Link>

          {/* Mobile Phone/Contact Quick CTA */}
          <a 
            href={`tel:${settings.contactNumber}`}
            className="md:hidden p-2 text-white/90 hover:text-white transition-colors"
            aria-label="Call Us"
          >
            <Phone className="w-5 h-5" />
          </a>

          {/* Mobile Hamburger Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-white/90 hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle Menu"
            id="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Responsive Store Detail Popover/Modal */}
        {storePanelOpen && (
          <>
            {/* Click outside backdrop */}
            <div 
              className="fixed inset-0 bg-stone-950/60 z-40 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setStorePanelOpen(false)}
            />

            {/* Panel Container (Pop-over on desktop, modal on mobile) */}
            <div className="fixed inset-x-0 bottom-0 max-h-[85vh] md:max-h-none md:absolute md:top-full md:bottom-auto md:right-8 md:left-auto md:w-96 md:mt-2 bg-white rounded-t-2xl md:rounded-lg shadow-2xl border border-stone-200 z-50 flex flex-col overflow-hidden text-stone-800 animate-fade-in-up" id="store-locator-popover">
              {/* Header */}
              <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-brand-red-600" />
                  <span className="font-serif font-bold text-stone-900 text-sm tracking-wide">
                    {stores.length === 1 || selectedStore ? "Showroom Details" : "Our Showrooms"}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    if (selectedStore && stores.length > 1) {
                      setSelectedStore(null);
                    } else {
                      setStorePanelOpen(false);
                    }
                  }}
                  className="p-1 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                >
                  {selectedStore && stores.length > 1 ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-red-600">Back</span>
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Content Area */}
              <div className="overflow-y-auto p-4 space-y-4 max-h-[60vh] md:max-h-[420px]">
                {loadingStores ? (
                  <div className="py-12 text-center">
                    <div className="w-6 h-6 border-2 border-brand-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-stone-400 text-[10px] tracking-wider uppercase mt-3">Loading Showrooms...</p>
                  </div>
                ) : (stores.length === 1 || selectedStore) ? (
                  /* SINGLE STORE DETAILS OR SELECTED STORE */
                  (() => {
                    const s = selectedStore || stores[0];
                    const displayImg = s.imageUrl || "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&q=80&w=600";
                    const resolvedHours = s.hours || s.workingHours || "11:30 AM - 8:00 PM";
                    const resolvedWeeklyOff = s.weeklyOff || "Sunday";

                    // Formulate call & wa URLs
                    const cleanPhone = s.phone.replace(/[^0-9+]/g, '');
                    const cleanWhatsapp = (s.whatsapp || '').replace(/[^0-9]/g, '');
                    const directionUrl = s.googleMapsUrl || s.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name + ' ' + s.address)}`;

                    return (
                      <div className="space-y-4 text-stone-700">
                        {/* Image Panel */}
                        <div className="relative aspect-video rounded overflow-hidden bg-stone-100 border border-stone-250 shadow-2xs">
                          <img 
                            src={displayImg} 
                            alt={s.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {s.city && (
                            <span className="absolute top-2 left-2 bg-stone-950/80 backdrop-blur-xs text-stone-100 text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded">
                              {s.city}
                            </span>
                          )}
                        </div>

                        {/* Name & Address */}
                        <div className="space-y-1">
                          <h4 className="font-serif font-bold text-stone-900 text-sm md:text-base leading-tight">
                            {s.name}
                          </h4>
                          <div className="flex gap-2 items-start text-xs text-stone-600">
                            <MapPin className="w-3.5 h-3.5 text-brand-red-600 shrink-0 mt-0.5" />
                            <span className="font-sans leading-relaxed text-[11px]">{s.address}</span>
                          </div>
                        </div>

                        {/* Timing Schedule */}
                        <div className="bg-stone-50 p-3 rounded border border-stone-200/60 space-y-1.5 text-[11px] text-stone-600 font-sans">
                          <div className="flex gap-2 items-center">
                            <Clock className="w-3.5 h-3.5 text-brand-red-600 shrink-0" />
                            <span>Timings: {resolvedHours}</span>
                          </div>
                          {resolvedWeeklyOff && (
                            <div className="flex gap-2 items-center">
                              <Calendar className="w-3.5 h-3.5 text-brand-red-600 shrink-0" />
                              <span>Weekly Off: <strong className="text-brand-red-700">{resolvedWeeklyOff}</strong></span>
                            </div>
                          )}
                        </div>

                        {/* CTA Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <a
                            href={`tel:${cleanPhone}`}
                            className="flex items-center justify-center gap-1.5 h-9 border border-stone-200 hover:bg-stone-50 text-stone-700 text-[10px] font-bold tracking-widest uppercase rounded transition-colors"
                          >
                            <Phone className="w-3 h-3 text-brand-red-600" />
                            <span>Call Now</span>
                          </a>

                          {cleanWhatsapp && (
                            <a
                              href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Hello Parasmoni Jewellers, I'm interested in visiting your ${s.name} branch.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1.5 h-9 border border-stone-200 hover:bg-stone-50 text-stone-700 text-[10px] font-bold tracking-widest uppercase rounded transition-colors"
                            >
                              <MessageCircle className="w-3 h-3 text-emerald-600" />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          <a
                            href={directionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="col-span-2 flex items-center justify-center gap-1.5 h-9.5 bg-stone-900 hover:bg-stone-800 text-stone-50 text-[10px] font-bold tracking-widest uppercase rounded transition-colors mt-0.5"
                          >
                            <Compass className="w-3.5 h-3.5 text-amber-400" />
                            <span>Get Directions</span>
                          </a>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  /* MULTIPLE ACTIVE SHOWROOMS SELECTOR */
                  <div className="space-y-2">
                    <p className="text-[9px] text-stone-400 uppercase tracking-widest font-bold pb-1">
                      Select a Showroom to View Details
                    </p>
                    {stores.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStore(s)}
                        className="w-full text-left p-3 rounded border border-stone-200 hover:border-brand-red-600/30 hover:bg-stone-50/50 transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <h4 className="font-serif font-bold text-stone-800 text-xs group-hover:text-brand-red-600 transition-colors">
                            {s.name}
                          </h4>
                          <p className="text-[10px] text-stone-500 font-sans">
                            {s.city || "Kolkata"}, {s.area || "West Bengal"}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile Drawer Navigation (Slide down/fade) */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-t border-stone-200 shadow-lg absolute left-0 right-0 py-6 px-6 max-h-[80vh] overflow-y-auto space-y-6 z-40 text-stone-800 animate-fade-in-up" id="mobile-navigation-drawer">
          <div className="space-y-3">
            {dynamicNavItems.map((item: any) => {
              const isAccordion = item.type === 'dropdown' || item.type === 'mega';
              const isExpanded = activeMobileAccordion === item.id;
              
              if (!isAccordion) {
                return (
                  <Link 
                    key={item.id} 
                    to={getLinkUrl(item.link)} 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-xs font-bold text-stone-700 hover:text-brand-red-600 transition-colors tracking-widest uppercase py-2.5 border-b border-stone-100 flex items-center justify-between"
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </Link>
                );
              }
              
              return (
                <div key={item.id} className="border-b border-stone-100 py-2.5">
                  <button
                    onClick={() => setActiveMobileAccordion(isExpanded ? null : item.id)}
                    className="w-full text-left text-xs font-bold text-stone-700 hover:text-brand-red-600 transition-colors tracking-widest uppercase flex items-center justify-between focus:outline-none"
                  >
                    <span>{item.label}</span>
                    <span 
                      className="text-stone-400 transition-transform duration-200 block" 
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    >
                      <ChevronRight className="w-4.5 h-4.5" />
                    </span>
                  </button>
                  
                  {isExpanded && (
                    <div className="pl-4 pt-2.5 pb-1 space-y-2.5 animate-fade-in">
                      {item.type === 'dropdown' && item.dropdownItems && item.dropdownItems.map((sub: any) => (
                        <Link
                          key={sub.id}
                          to={getLinkUrl(sub.link)}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block text-[11px] font-bold tracking-wider uppercase text-stone-500 hover:text-brand-red-600 py-1"
                        >
                          {sub.title}
                        </Link>
                      ))}
                      
                      {item.type === 'mega' && item.megaColumns && item.megaColumns.map((col: any) => (
                        <div key={col.id} className="space-y-1.5 pt-1 border-t border-stone-50/50 first:border-0 first:pt-0">
                          <span className="block text-[9px] font-bold text-brand-red-600 uppercase tracking-widest">{col.subtitle}</span>
                          <div className="pl-2.5 space-y-1.5">
                            {col.links && col.links.map((subLink: any) => (
                              <Link
                                key={subLink.id}
                                to={getLinkUrl(subLink.link)}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block text-[11px] font-semibold text-stone-500 hover:text-brand-red-600 py-0.5 uppercase tracking-wide"
                              >
                                {subLink.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-stone-100 space-y-4">
            <Link 
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full h-11 bg-brand-red-600 hover:bg-brand-red-700 text-stone-100 text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Contact Us</span>
            </Link>
            
            <a 
              href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(settings.whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 bg-transparent hover:bg-stone-50 text-stone-700 border border-stone-300 text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold-500" />
              <span>Inquire via WhatsApp</span>
            </a>
          </div>

          <div className="text-center text-[10px] text-stone-400 font-sans">
            {settings.workingHours}
          </div>
        </div>
      )}
    </header>
  );
}

