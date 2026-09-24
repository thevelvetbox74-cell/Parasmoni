/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Real-Time Live Preview Window Component
 * Features an interactive draggable device frame (Phone to Tablet view)
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Wifi, 
  Battery, 
  Signal,
  GripHorizontal,
  Plus,
  X,
  Layers,
  Sparkles,
  CheckCircle,
  Eye,
  Tag,
  Grid,
  ShoppingBag,
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon,
  Save,
  Check
} from 'lucide-react';
import { db, isFirebaseConfigured } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';

export type DeviceViewportMode = 'desktop' | 'tablet' | 'iphone';
export type PreviewRenderMode = 'blank' | 'iframe';

export interface LivePreviewWindowProps {
  title?: string;
  subtitle?: string;
  activeRoute?: string;
  onRouteSelect?: (route: string) => void;
  liveSettings?: any;
  onUpdateConfig?: (newConfig: any) => void;
  onSave?: () => void;
  sections?: any[];
  isDirty?: boolean;
  onRefresh?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function LivePreviewWindow({
  activeRoute = "/",
  liveSettings,
  className = "",
  children
}: LivePreviewWindowProps): React.JSX.Element {
  // Device Frame Resizing State
  const [frameWidth, setFrameWidth] = useState<number>(380); // Default Phone width 380px
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<string>(activeRoute);
  
  // Right Drawer State for Live Sections
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const dragStartX = useRef<number>(0);
  const dragStartWidth = useRef<number>(380);

  useEffect(() => {
    setCurrentPath(activeRoute);
  }, [activeRoute]);

  // Derive active live storefront sections
  const getLiveSections = () => {
    if (!liveSettings) {
      return [
        { id: 'hero', name: 'Hero Banner Slider', desc: 'Top rotating high-impact promotional slider', countStr: '2 Banners Active', live: true },
        { id: 'category', name: 'Our Gold Collections Grid', desc: 'Main category visual cards grid', countStr: '8 Categories Active', live: true },
        { id: 'products', name: 'Product Carousel', desc: 'Featured jewelry items horizontal slider', countStr: '12 Items Live', live: true },
        { id: 'ticker', name: 'Live Bullion Rate Ticker', desc: 'Real-time 22K & 24K Gold Rate Header Strip', countStr: 'Stream Active', live: true }
      ];
    }

    const list: Array<{ id: string; name: string; desc: string; countStr: string; live: boolean }> = [];

    if (liveSettings.showLiveRateTicker) {
      list.push({
        id: 'ticker',
        name: 'Live Bullion Rate Ticker',
        desc: 'Real-time 22K & 24K Gold Rate Header Strip',
        countStr: 'Live Rate Stream Active',
        live: true
      });
    }

    const activeHero = (liveSettings.heroBanners || []).filter((b: any) => b.active);
    if (activeHero.length > 0) {
      list.push({
        id: 'hero',
        name: 'Hero Banner Slider',
        desc: 'Top rotating high-impact promotional slider',
        countStr: `${activeHero.length} Banner${activeHero.length > 1 ? 's' : ''} Active`,
        live: true
      });
    }

    const activeCat = (liveSettings.categoryBanners || []).filter((c: any) => c.active);
    if (activeCat.length > 0) {
      list.push({
        id: 'category',
        name: 'Our Gold Collections Grid',
        desc: 'Main category visual cards grid',
        countStr: `${activeCat.length} Categories Active`,
        live: true
      });
    }

    const activeOffer = (liveSettings.offerBanners || []).filter((b: any) => b.active);
    if (activeOffer.length > 0) {
      list.push({
        id: 'offer',
        name: 'Offer Banner Strip (B1)',
        desc: 'Special discount & campaign banner strip',
        countStr: `${activeOffer.length} Banner${activeOffer.length > 1 ? 's' : ''} Active`,
        live: true
      });
    }

    const activeLook = (liveSettings.shopLookBanners || []).filter((b: any) => b.active);
    if (activeLook.length > 0) {
      list.push({
        id: 'shoplook',
        name: 'Shop The Look Showcase',
        desc: 'Bridal model editorial showcase with tag links',
        countStr: `${activeLook.length} Look${activeLook.length > 1 ? 's' : ''} Active`,
        live: true
      });
    }

    const activeOg = (liveSettings.ogOfferBanners || []).filter((b: any) => b.active);
    if (activeOg.length > 0) {
      list.push({
        id: 'ogoffer',
        name: 'OG Offer Collection Showcase',
        desc: '3-tile editorial offer grid',
        countStr: `${activeOg.length} Tile${activeOg.length > 1 ? 's' : ''} Active`,
        live: true
      });
    }

    const activeSplit = (liveSettings.splitMediaBanners || []).filter((b: any) => b.active);
    if (activeSplit.length > 0) {
      list.push({
        id: 'splitmedia',
        name: 'Split Media Story Banner',
        desc: 'Side-by-side editorial media & CTA banner',
        countStr: `${activeSplit.length} Banner${activeSplit.length > 1 ? 's' : ''} Active`,
        live: true
      });
    }

    const activePromo = (liveSettings.promoCalloutBanners || []).filter((b: any) => b.active);
    if (activePromo.length > 0) {
      list.push({
        id: 'promocallout',
        name: 'Promo Callout Cards',
        desc: 'Highlighted feature promo cards',
        countStr: `${activePromo.length} Card${activePromo.length > 1 ? 's' : ''} Active`,
        live: true
      });
    }

    if (list.length === 0) {
      list.push(
        { id: 'hero', name: 'Hero Banner Slider', desc: 'Top rotating high-impact promotional slider', countStr: '2 Banners Active', live: true },
        { id: 'category', name: 'Our Gold Collections Grid', desc: 'Main category visual cards grid', countStr: '8 Categories Active', live: true },
        { id: 'products', name: 'Product Carousel', desc: 'Featured jewelry items horizontal slider', countStr: 'Live Items Active', live: true }
      );
    }

    return list;
  };

  const liveSections = getLiveSections();

  // Mode selection: 'cursor' (pointer/inspect) vs 'hand' (interactive web app user mode)
  const [interactionMode, setInteractionMode] = useState<'cursor' | 'hand'>('hand');

  // Selected Section State for Editing in Drawer
  const [activeEditingSectionId, setActiveEditingSectionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [editingSubline, setEditingSubline] = useState<string>('');
  const [editingEnabled, setEditingEnabled] = useState<boolean>(true);
  const [editingBanners, setEditingBanners] = useState<any[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const sectionMetadata: Record<string, { name: string; sectionTypeId: string; defaultTitle: string; defaultSubline: string; desc: string; bannerKey?: string }> = {
    hero: {
      name: 'Hero Banner Slider',
      sectionTypeId: 'Hero Banner',
      defaultTitle: 'ELEGANT BRIDAL COLLECTION',
      defaultSubline: 'Crafted with passion, designed for eternity.',
      desc: 'Top rotating high-impact promotional slider',
      bannerKey: 'heroBanners'
    },
    category: {
      name: 'Our Gold Collections Grid',
      sectionTypeId: 'Category Cards',
      defaultTitle: 'OUR GOLD COLLECTIONS',
      defaultSubline: 'From traditional to contemporary find the perfect ornament for every occasion',
      desc: 'Main category visual cards grid',
      bannerKey: 'categoryBanners'
    },
    offer: {
      name: 'Offer Banner Strip (B1)',
      sectionTypeId: 'Offer Banner B1',
      defaultTitle: 'SPECIAL FESTIVE OFFER',
      defaultSubline: 'Get up to 25% off making charges on hallmark gold jewelry',
      desc: 'Special discount & campaign banner strip',
      bannerKey: 'offerBanners'
    },
    shoplook: {
      name: 'Shop The Look Showcase',
      sectionTypeId: 'Shop The Look',
      defaultTitle: 'EDITORIAL BRIDAL LOOKS',
      defaultSubline: 'Explore curated bridal sets matched with matching necklaces & bangles',
      desc: 'Bridal model editorial showcase with tag links',
      bannerKey: 'shopLookBanners'
    },
    ogoffer: {
      name: 'OG Offer Collection Showcase',
      sectionTypeId: 'OG Offer Collection',
      defaultTitle: 'EXCLUSIVE JEWELRY HIGHLIGHTS',
      defaultSubline: 'Handpicked handcrafted designs for weddings & celebrations',
      desc: '3-tile editorial offer grid',
      bannerKey: 'ogOfferBanners'
    },
    splitmedia: {
      name: 'Split Media Story Banner',
      sectionTypeId: 'Split Media Banner',
      defaultTitle: 'ROYAL WEDDING COLLECTION',
      defaultSubline: 'Discover our finest bridal heritage craftsmanship',
      desc: 'Side-by-side editorial media & CTA',
      bannerKey: 'splitMediaBanners'
    },
    promo: {
      name: 'Promo Voucher Callout',
      sectionTypeId: 'Promo Callout Card',
      defaultTitle: 'SPECIAL VOUCHER DISCOUNT',
      defaultSubline: 'Extra ₹2,000 off on first purchase',
      desc: 'Special voucher code card',
      bannerKey: 'promoCalloutBanners'
    },
    ticker: {
      name: 'Live Bullion Rate Ticker',
      sectionTypeId: 'Live Bullion Rate Ticker',
      defaultTitle: 'LIVE BULLION RATES',
      defaultSubline: 'Real-time 22K & 24K Gold Rate Header Strip',
      desc: 'Real-time 22K & 24K Gold Rate Header Strip'
    },
    products: {
      name: 'Product Carousel',
      sectionTypeId: 'Product Carousel',
      defaultTitle: 'FEATURED MASTERPIECES',
      defaultSubline: 'Handcrafted certified 22k gold & solitaire jewelry',
      desc: 'Featured jewelry items horizontal slider'
    },
    about: {
      name: 'About Bowbazar Legacy',
      sectionTypeId: 'About Collection',
      defaultTitle: 'BOWBAZAR HERITAGE LEGACY',
      defaultSubline: 'Over 50 years of trust in Kolkata\'s Bowbazar',
      desc: 'Brand heritage & artisan story'
    },
    boutiques: {
      name: 'Showroom Boutiques',
      sectionTypeId: 'Our Boutiques',
      defaultTitle: 'OUR SHOWROOM BOUTIQUES',
      defaultSubline: 'Visit our physical boutiques or chat with us on WhatsApp',
      desc: 'Physical store cards with map & WhatsApp'
    },
    testimonials: {
      name: 'Customer Testimonials',
      sectionTypeId: 'Testimonials',
      defaultTitle: 'CUSTOMER TESTIMONIALS & REVIEWS',
      defaultSubline: 'Real customer experiences from three generations of buyers',
      desc: 'Verified buyer reviews & photo stories'
    }
  };

  const openSectionEditor = (secId: string) => {
    const meta = sectionMetadata[secId] || {
      name: 'Storefront Section',
      sectionTypeId: secId,
      defaultTitle: 'FEATURED SECTION',
      defaultSubline: 'Custom section configured for web app',
      desc: 'Web App storefront section'
    };

    let currentSettings = liveSettings;
    if (!currentSettings) {
      try {
        const raw = localStorage.getItem('local_appfront_config');
        if (raw) currentSettings = JSON.parse(raw);
      } catch (e) {
        // ignore
      }
    }

    const title = currentSettings?.sectionTitles?.[secId] || meta.defaultTitle;
    const subline = currentSettings?.sectionSublines?.[secId] || meta.defaultSubline;

    let isEnabled = true;
    if (secId === 'ticker') {
      isEnabled = currentSettings?.showLiveRateTicker !== false;
    } else if (currentSettings?.activeSections) {
      isEnabled = currentSettings.activeSections.includes(meta.sectionTypeId);
    }

    let banners: any[] = [];
    if (meta.bannerKey && currentSettings?.[meta.bannerKey]) {
      banners = JSON.parse(JSON.stringify(currentSettings[meta.bannerKey]));
    }

    setActiveEditingSectionId(secId);
    setEditingTitle(title);
    setEditingSubline(subline);
    setEditingEnabled(isEnabled);
    setEditingBanners(banners);
    setSaveSuccessMsg('');
  };

  const handleUpdateBannerItem = (index: number, field: string, value: any) => {
    setEditingBanners(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddBannerItem = () => {
    const meta = sectionMetadata[activeEditingSectionId || ''];
    const newItem = {
      id: `banner-${Date.now()}`,
      sectionType: meta?.sectionTypeId || 'Hero Banner',
      title: 'New Heritage Showcase',
      subtitle: 'Handcrafted Bowbazar Design',
      ctaText: 'EXPLORE NOW',
      imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800',
      targetLink: '/catalog',
      active: true
    };
    setEditingBanners(prev => [...prev, newItem]);
  };

  const handleDeleteBannerItem = (index: number) => {
    setEditingBanners(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveSectionChanges = async () => {
    if (!activeEditingSectionId) return;
    setIsSaving(true);

    const meta = sectionMetadata[activeEditingSectionId] || {
      name: 'Storefront Section',
      sectionTypeId: activeEditingSectionId,
      defaultTitle: '',
      defaultSubline: '',
      desc: ''
    };

    let currentConfig = liveSettings;
    if (!currentConfig) {
      try {
        const raw = localStorage.getItem('local_appfront_config');
        if (raw) currentConfig = JSON.parse(raw);
      } catch (e) {
        currentConfig = {};
      }
    }
    currentConfig = currentConfig || {};

    const updatedTitles = { ...(currentConfig.sectionTitles || {}), [activeEditingSectionId]: editingTitle };
    const updatedSublines = { ...(currentConfig.sectionSublines || {}), [activeEditingSectionId]: editingSubline };

    let updatedActiveSections = Array.isArray(currentConfig.activeSections)
      ? [...currentConfig.activeSections]
      : Object.values(sectionMetadata).map(s => s.sectionTypeId);

    if (activeEditingSectionId === 'ticker') {
      currentConfig.showLiveRateTicker = editingEnabled;
    } else {
      if (editingEnabled && !updatedActiveSections.includes(meta.sectionTypeId)) {
        updatedActiveSections.push(meta.sectionTypeId);
      } else if (!editingEnabled && updatedActiveSections.includes(meta.sectionTypeId)) {
        updatedActiveSections = updatedActiveSections.filter(s => s !== meta.sectionTypeId);
      }
    }

    const updatedConfig = {
      ...currentConfig,
      showLiveRateTicker: activeEditingSectionId === 'ticker' ? editingEnabled : (currentConfig.showLiveRateTicker ?? true),
      activeSections: updatedActiveSections,
      sectionTitles: updatedTitles,
      sectionSublines: updatedSublines,
      ...(meta.bannerKey ? { [meta.bannerKey]: editingBanners } : {})
    };

    try {
      localStorage.setItem('local_appfront_config', JSON.stringify(updatedConfig));
    } catch (err) {
      console.warn('LocalStorage save warning:', err);
    }

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'appFrontSettings', 'default');
        await setDoc(docRef, updatedConfig, { merge: true });
      } catch (err) {
        console.warn('Firestore save error:', err);
      }
    }

    if (onUpdateConfig) {
      onUpdateConfig(updatedConfig);
    }

    if (onSave) {
      onSave();
    }

    if (onRefresh) {
      onRefresh();
    }

    setIsSaving(false);
    setSaveSuccessMsg('Section saved live! Applied to Web App & Tablet View.');
    setTimeout(() => {
      setSaveSuccessMsg('');
    }, 2800);
  };

  // Handle Drag Resizing from Bottom-Right Corner
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartWidth.current = frameWidth;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      // Multiplying delta by 2 because frame is centered in viewport
      const deltaX = e.clientX - dragStartX.current;
      const newWidth = Math.min(Math.max(320, dragStartWidth.current + deltaX * 2), 980);
      setFrameWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className={`flex flex-col bg-[#FAF9F6] items-center justify-center min-h-[620px] p-4 sm:p-8 relative select-none w-full ${className}`}>
      
      {/* TOP RIGHT CORNER VISUAL ICONS BADGE (Clickable Mode Selection) */}
      <div className="absolute top-3 right-2 sm:top-4 sm:right-3 bg-[#EFE5DC] border border-[#E3D8CC] rounded-2xl p-1.5 sm:p-2 flex flex-col items-center justify-center gap-2 shadow-md z-20 select-none">
        {/* Top Icon: Cursor Click Pointer */}
        <button
          type="button"
          onClick={() => setInteractionMode('cursor')}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            interactionMode === 'cursor'
              ? 'bg-stone-900 text-amber-400 shadow-sm scale-105'
              : 'text-stone-700 hover:bg-stone-300/50'
          }`}
          title="Pointer / Inspection Mode"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 4.1 12 6" />
            <path d="m5.1 8-1.9-2" />
            <path d="m6 12-2 1.9" />
            <path d="M7.2 2.2 2.2 7.2" />
            <path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z" />
          </svg>
        </button>

        {/* Bottom Icon: Hand Click / Touch Gesture Pointer (User Mode) */}
        <button
          type="button"
          onClick={() => setInteractionMode('hand')}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
            interactionMode === 'hand'
              ? 'bg-stone-900 text-amber-400 shadow-md scale-105 ring-2 ring-amber-500/60'
              : 'text-stone-700 hover:bg-stone-300/50'
          }`}
          title="Interactive User Mode (Click & Scroll Web App like a Customer)"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
            <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
            <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
            <path d="M18 8a2 2 0 0 1 2 2v4a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
          </svg>
          {interactionMode === 'hand' && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </button>
      </div>

      {/* FLOATING + BUTTON IN BOTTOM-RIGHT CORNER OF WORKSPACE */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-stone-900 hover:bg-black text-amber-400 border-2 border-amber-500/80 p-3.5 rounded-full shadow-2xl z-30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer group"
        title="View Live Storefront Sections"
      >
        <Plus className="w-6 h-6 stroke-[2.8] transition-transform duration-300 group-hover:rotate-90" />
      </button>

      {/* RIGHT SLIDE-OVER DRAWER FOR LIVE STOREFRONT SECTIONS */}
      {isDrawerOpen && (
        <>
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs z-40 transition-opacity"
          />

          {/* Right Side Drawer Panel */}
          <div className="fixed top-0 right-0 h-full w-80 sm:w-96 bg-stone-900 text-stone-100 shadow-2xl z-50 flex flex-col border-l border-stone-800 animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-stone-800 flex items-center justify-between shrink-0 bg-stone-950/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#6B1F2A] border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-100 uppercase tracking-wider">Live Storefront Sections</h3>
                  <p className="text-[11px] text-stone-400">Sections currently active in storefront</p>
                </div>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Badge Summary */}
            <div className="px-5 py-3 bg-stone-900/90 border-b border-stone-800/80 flex items-center justify-between text-xs">
              <span className="text-stone-400">Active Live Sections</span>
              <span className="bg-emerald-950 text-emerald-400 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-800/80 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {liveSections.length} Live
              </span>
            </div>

            {/* Drawer Body - Live Sections List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {liveSections.map((sec, idx) => (
                <div 
                  key={sec.id || idx}
                  className="bg-stone-800/80 border border-stone-700/80 rounded-xl p-4 flex flex-col gap-3 hover:border-amber-500/50 transition-all shadow-xs group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-700 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-xs font-bold text-stone-100 truncate">{sec.name}</h4>
                        <span className="bg-emerald-950/80 text-emerald-400 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border border-emerald-800/60 shrink-0">
                          Live
                        </span>
                      </div>

                      <p className="text-[11px] text-stone-400 mb-2 leading-tight">{sec.desc}</p>
                      
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-300/90 font-mono font-medium">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{sec.countStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Edit Section Button for Web App View */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      openSectionEditor(sec.id);
                    }}
                    className="w-full py-2 bg-stone-900 hover:bg-black text-amber-400 hover:text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Edit Section (Web App View)</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-stone-800 bg-stone-950/90 text-center text-[11px] text-stone-400">
              Only active storefront sections are displayed here.
            </div>

          </div>
        </>
      )}

      {/* RIGHT SLIDE-OVER SECTION EDITOR DRAWER (WEB APP & TABLET VIEW ONLY) */}
      {activeEditingSectionId && (
        <>
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setActiveEditingSectionId(null)}
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 transition-opacity"
          />

          {/* Editor Drawer Panel */}
          <div className="fixed top-0 right-0 h-full w-85 sm:w-[420px] bg-stone-900 text-stone-100 shadow-2xl z-50 flex flex-col border-l border-stone-800 animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-stone-800 flex items-center justify-between shrink-0 bg-stone-950">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-100 uppercase tracking-wider">Web App Section Editor</h3>
                  <span className="inline-block bg-amber-950 text-amber-300 border border-amber-800/80 text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5">
                    Web App & Tablet View Only
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveEditingSectionId(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Notice Banner */}
            <div className="p-3.5 bg-amber-950/40 border-b border-amber-800/40 text-amber-200/90 text-[11px] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span>Modifications made here apply <strong>strictly to Web App & Tablet View</strong>.</span>
            </div>

            {/* Drawer Form Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* Section ID Badge */}
              <div className="bg-stone-800/60 border border-stone-700/60 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-stone-400 font-medium">Target Section</span>
                <span className="text-xs font-bold text-amber-400 font-mono uppercase bg-stone-900 px-2.5 py-1 rounded-lg border border-stone-700">
                  {sectionMetadata[activeEditingSectionId]?.name || activeEditingSectionId}
                </span>
              </div>

              {/* Enable / Disable Toggle */}
              <div className="bg-stone-800/80 border border-stone-700/80 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-200">Section Visibility</h4>
                  <p className="text-[11px] text-stone-400">Show or hide this section in Web App View</p>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingEnabled(!editingEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer ${
                    editingEnabled ? 'bg-emerald-600 justify-end' : 'bg-stone-700 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Section Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Section Title</span>
                  <span className="text-[10px] text-stone-400 font-normal">Web App Display</span>
                </label>
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  placeholder="Enter Section Title..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Section Subline Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Section Subline / Subtitle</span>
                  <span className="text-[10px] text-stone-400 font-normal">Web App Display</span>
                </label>
                <textarea
                  rows={3}
                  value={editingSubline}
                  onChange={(e) => setEditingSubline(e.target.value)}
                  placeholder="Enter Section Subline description..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl p-3 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>

              {/* Banners & Cards Section Editor */}
              {sectionMetadata[activeEditingSectionId]?.bannerKey && (
                <div className="space-y-3 pt-2 border-t border-stone-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                        Section Banners & Media Cards
                      </h4>
                      <p className="text-[10px] text-stone-400">
                        Manage slides & banners for Web App View
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddBannerItem}
                      className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/50 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Banner</span>
                    </button>
                  </div>

                  {editingBanners.length === 0 ? (
                    <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl text-center text-xs text-stone-500 font-mono">
                      No banners configured. Click "Add Banner" to create one.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {editingBanners.map((banner, bIdx) => (
                        <div
                          key={banner.id || bIdx}
                          className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-2 relative group hover:border-stone-700 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold font-mono text-amber-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                              Item #{bIdx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteBannerItem(bIdx)}
                              className="p-1 text-stone-500 hover:text-red-400 transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-stone-400 font-medium">Title</label>
                            <input
                              type="text"
                              value={banner.title || ''}
                              onChange={(e) => handleUpdateBannerItem(bIdx, 'title', e.target.value)}
                              className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                              placeholder="Banner Title"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-stone-400 font-medium">Subtitle / Tagline</label>
                            <input
                              type="text"
                              value={banner.subtitle || ''}
                              onChange={(e) => handleUpdateBannerItem(bIdx, 'subtitle', e.target.value)}
                              className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                              placeholder="Subtitle or Tagline"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                              <ImageIcon className="w-3 h-3 text-amber-400" />
                              <span>Image URL</span>
                            </label>
                            <input
                              type="text"
                              value={banner.imageUrl || ''}
                              onChange={(e) => handleUpdateBannerItem(bIdx, 'imageUrl', e.target.value)}
                              className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                              placeholder="https://..."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-stone-400 font-medium">CTA Button Text</label>
                              <input
                                type="text"
                                value={banner.ctaText || ''}
                                onChange={(e) => handleUpdateBannerItem(bIdx, 'ctaText', e.target.value)}
                                className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                                placeholder="EXPLORE"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                                <LinkIcon className="w-3 h-3 text-amber-400" />
                                <span>Target Link</span>
                              </label>
                              <input
                                type="text"
                                value={banner.targetLink || ''}
                                onChange={(e) => handleUpdateBannerItem(bIdx, 'targetLink', e.target.value)}
                                className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                                placeholder="/catalog"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Success Feedback Alert */}
              {saveSuccessMsg && (
                <div className="bg-emerald-950/90 border border-emerald-700/80 rounded-xl p-3.5 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

            </div>

            {/* Drawer Action Footer */}
            <div className="p-4 border-t border-stone-800 bg-stone-950 flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveEditingSectionId(null)}
                className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveSectionChanges}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 text-xs font-bold rounded-xl transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save Web App Changes'}</span>
              </button>
            </div>

          </div>
        </>
      )}

      {/* DRAGGABLE DEVICE FRAME CONTAINER */}
      <div 
        className="relative group shrink-0 my-auto"
        style={{ width: `${frameWidth}px`, maxWidth: '100%' }}
      >
        {/* DEVICE OUTER BLACK BORDER FRAME (Matches exact 1st Uploaded Image) */}
        <div 
          className={`bg-white rounded-[32px] border-[3.5px] border-black shadow-2xl overflow-hidden flex flex-col h-[680px] max-h-[780px] relative ${
            isDragging ? 'transition-none' : 'transition-all duration-200 ease-out'
          }`}
        >
          {/* A. STATUS BAR (Top inside phone/tablet) */}
          <div className="bg-white text-stone-900 px-6 py-2.5 flex items-center justify-between text-[11px] font-mono font-semibold shrink-0 select-none border-b border-stone-100">
            <span>9:41</span>
            <div className="flex items-center gap-2 text-stone-900">
              <Signal className="w-3.5 h-3.5 text-stone-900 fill-stone-900" />
              <Wifi className="w-3.5 h-3.5 text-stone-900" />
              <Battery className="w-4 h-4 text-stone-900" />
            </div>
          </div>

          {/* B. MAIN BODY AREA (Real-time Website Live Preview) */}
          <div className="flex-1 bg-white overflow-y-auto flex flex-col relative">
            
            {/* CURSOR INSPECTION MODE OVERLAY (When Cursor Icon is selected) */}
            {interactionMode === 'cursor' && (
              <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-[2px] z-30 overflow-y-auto p-4 flex flex-col gap-3 animate-in fade-in duration-200">
                
                {/* Inspection Header Badge */}
                <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 text-center shrink-0">
                  <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider mb-0.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Cursor Section Inspector</span>
                  </div>
                  <p className="text-[11px] text-stone-300">
                    Click any section below to open its <strong>Web App Editor Drawer</strong> on the right
                  </p>
                </div>

                {/* Section Cards List */}
                <div className="space-y-2.5 my-auto">
                  {Object.entries(sectionMetadata).map(([secId, meta]) => (
                    <button
                      key={secId}
                      type="button"
                      onClick={() => openSectionEditor(secId)}
                      className="w-full bg-stone-900/90 hover:bg-black border border-stone-700/80 hover:border-amber-500 rounded-xl p-3 text-left transition-all hover:scale-[1.02] shadow-lg flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider font-mono">
                          Web App Section
                        </span>
                        <h4 className="text-xs font-bold text-stone-100 group-hover:text-amber-300 transition-colors">
                          {meta.name}
                        </h4>
                        <p className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">
                          {meta.desc}
                        </p>
                      </div>

                      <div className="bg-amber-500/20 text-amber-400 p-2 rounded-lg border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-stone-950 transition-colors shrink-0">
                        <Eye className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="text-center text-[10px] text-stone-400 shrink-0 pt-2">
                  Changes apply specifically to Web App & Tablet View
                </div>

              </div>
            )}

            {children ? (
              <div className="flex-1 bg-white w-full h-full flex flex-col justify-start">
                {children}
              </div>
            ) : (
              <iframe
                src={currentPath || "/"}
                title="Parasmoni Live Website Preview"
                className={`w-full h-full border-0 bg-white flex-1 ${
                  isDragging ? 'pointer-events-none select-none' : interactionMode === 'hand' ? 'pointer-events-auto cursor-pointer' : 'pointer-events-auto'
                }`}
              />
            )}
          </div>

        </div>

        {/* D. INTERACTIVE BOTTOM-RIGHT DRAG HANDLE FOR RESIZING TO TABLET VIEW */}
        <div
          onMouseDown={handleMouseDown}
          className={`absolute -bottom-3 -right-3 z-30 cursor-ew-resize bg-black text-amber-400 p-2 rounded-full shadow-2xl border-2 border-white flex items-center justify-center hover:scale-115 active:scale-95 transition-transform ${
            isDragging ? 'ring-4 ring-amber-500/50 scale-110' : ''
          }`}
          title="Drag horizontally to resize view (Phone ↔ Tablet)"
        >
          <GripHorizontal className="w-4 h-4 stroke-[2.5]" />
        </div>

      </div>
    </div>
  );
}

