/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - APP FRONT (Web App & Mobile View Customizer & Banner Manager)
 */

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  RotateCcw, 
  Plus, 
  Sparkles,
  Info,
  RefreshCw,
  CheckCircle,
  ExternalLink,
  Eye,
  Tablet,
  Monitor,
  Trash2,
  Upload,
  Image as ImageIcon,
  Code,
  Sliders,
  Save,
  Layers,
  ChevronRight,
  ChevronDown,
  Tag,
  ShoppingBag,
  Sparkle,
  Grid,
  Gift,
  MapPin,
  Heart,
  Search,
  HelpCircle,
  Check
} from 'lucide-react';
import { LivePreviewWindow } from '../components/LivePreviewWindow';
import { db, isFirebaseConfigured } from '../firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Types for Section Banners & Web App Config
export interface SectionBannerItem {
  id: string;
  sectionType: string; // e.g. 'Hero Banner', 'Offer Banner B1', 'Split Media Banner', 'OG Offer Collection', 'Shop The Look', 'Promo Callout Card', 'Category Cards'
  title: string;
  subtitle?: string;
  ctaText?: string;
  imageUrl: string;
  targetLink?: string;
  active: boolean;
  bgGradient?: string;
  discountBadge?: string;
  tagline?: string;
}

export interface CategoryCardBanner {
  slug: string;
  name: string;
  imageUrl: string;
  active: boolean;
}

export interface WebAppSvgIcons {
  logoSvg: string;
  searchSvg: string;
  wishlistSvg: string;
  cartSvg: string;
  homeSvg: string;
  categorySvg: string;
  profileSvg: string;
  messageSvg: string;
}

export interface AppFrontConfig {
  showLiveRateTicker: boolean;
  showSearchBar: boolean;
  showBottomNav: boolean;
  activeSections: string[];
  heroBanners: SectionBannerItem[];
  offerBanners: SectionBannerItem[];
  splitMediaBanners: SectionBannerItem[];
  ogOfferBanners: SectionBannerItem[];
  shopLookBanners: SectionBannerItem[];
  promoCalloutBanners: SectionBannerItem[];
  categoryBanners: CategoryCardBanner[];
  svgIcons: WebAppSvgIcons;
}

export const STOREFRONT_SECTION_TYPES = [
  { id: 'Hero Banner', name: 'Hero Banner Slider', desc: 'Top rotating high-impact promotional slider' },
  { id: 'Offer Banner B1', name: 'Offer Banner (B1)', desc: 'Special discount & campaign banner strip' },
  { id: 'Quick Category Strip', name: 'Quick Category Strip', desc: 'Horizontal circular category bubbles' },
  { id: 'Category Cards', name: 'Our Gold Collections Grid', desc: 'Main category visual cards' },
  { id: 'Product Carousel', name: 'Product Carousel', desc: 'Featured jewelry items horizontal slider' },
  { id: 'Shop The Look', name: 'Shop The Look Showcase', desc: 'Bridal model editorial showcase with tag links' },
  { id: 'OG Offer Collection', name: 'OG Offer Collection Showcase', desc: '3-tile editorial offer grid' },
  { id: 'Split Media Banner', name: 'Split Media Story Banner', desc: 'Side-by-side editorial media & CTA' },
  { id: 'About Collection', name: 'About Bowbazar Legacy', desc: 'Brand heritage & artisan story' },
  { id: 'Our Boutiques', name: 'Showroom Boutiques', desc: 'Physical store cards with map & WhatsApp' },
  { id: 'Promo Callout Card', name: 'Promo Voucher Callout', desc: 'Special voucher code card' },
  { id: 'Testimonials', name: 'Customer Testimonials', desc: 'Verified buyer reviews & photo stories' }
];

export const DEFAULT_APP_FRONT_CONFIG: AppFrontConfig = {
  showLiveRateTicker: true,
  showSearchBar: true,
  showBottomNav: true,
  activeSections: STOREFRONT_SECTION_TYPES.map(s => s.id),
  heroBanners: [
    {
      id: 'hero-1',
      sectionType: 'Hero Banner',
      title: 'Heritage Jewellery 2026',
      subtitle: 'Bridal Royalty Collection',
      ctaText: 'EXPLORE MASTERPIECES',
      imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200',
      targetLink: '/catalog?category=necklaces',
      active: true
    },
    {
      id: 'hero-2',
      sectionType: 'Hero Banner',
      title: 'Crafted 22K Gold Bangles',
      subtitle: 'Hand-carved Kolkata Artistry',
      ctaText: 'VIEW BANGLES',
      imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=1200',
      targetLink: '/catalog?category=bangles',
      active: true
    }
  ],
  offerBanners: [
    {
      id: 'offer-1',
      sectionType: 'Offer Banner B1',
      title: 'FLAT 25% OFF ON MAKING CHARGES',
      subtitle: 'On All Certified Antique Gold & Filigree Ornaments',
      ctaText: 'CLAIM OFFER NOW',
      imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=1200',
      targetLink: '/catalog',
      active: true,
      discountBadge: 'FESTIVE SPECIAL'
    }
  ],
  splitMediaBanners: [
    {
      id: 'split-1',
      sectionType: 'Split Media Banner',
      title: 'The Art of Royal Wirework',
      subtitle: 'BOWBAZAR MASTERS',
      ctaText: 'DISCOVER CRAFTSMANSHIP',
      imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=1200',
      targetLink: '/about',
      active: true
    }
  ],
  ogOfferBanners: [
    {
      id: 'og-main',
      sectionType: 'OG Offer Collection',
      title: 'Royal Bridal Solitaires',
      subtitle: 'Main Feature Showcase',
      ctaText: 'SHOP SOLITAIRES',
      imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800',
      targetLink: '/catalog?category=necklaces',
      active: true,
      tagline: 'Featured Main Tile'
    },
    {
      id: 'og-sub1',
      sectionType: 'OG Offer Collection',
      title: '22K Filigree Bangles',
      subtitle: 'Top Highlight',
      ctaText: 'VIEW BANGLES',
      imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600',
      targetLink: '/catalog?category=bangles',
      active: true,
      tagline: 'Highlight 1'
    },
    {
      id: 'og-sub2',
      sectionType: 'OG Offer Collection',
      title: 'Antique Temple Rings',
      subtitle: 'Bottom Highlight',
      ctaText: 'VIEW RINGS',
      imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=600',
      targetLink: '/catalog?category=rings',
      active: true,
      tagline: 'Highlight 2'
    }
  ],
  shopLookBanners: [
    {
      id: 'look-1',
      sectionType: 'Shop The Look',
      title: 'Royal Bengali Bride Lookbook',
      subtitle: 'Handicrafted Choker, Mayura Bangles & Matha Patti',
      ctaText: 'SHOP THIS LOOK',
      imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1000',
      targetLink: '/catalog?tag=bridal',
      active: true
    }
  ],
  promoCalloutBanners: [
    {
      id: 'promo-1',
      sectionType: 'Promo Callout Card',
      title: 'EXTRA ₹2,000 OFF ON FIRST PURCHASE',
      subtitle: 'Use Code: PARASMONI2026 at Checkout or Showroom',
      ctaText: 'COPY VOUCHER',
      imageUrl: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&q=80&w=1000',
      targetLink: '/catalog',
      active: true
    }
  ],
  categoryBanners: [
    { slug: 'necklaces', name: 'Necklaces', imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600', active: true },
    { slug: 'earrings', name: 'Earrings', imageUrl: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&q=80&w=600', active: true },
    { slug: 'rings', name: 'Rings', imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=600', active: true },
    { slug: 'bangles', name: 'Bangles', imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600', active: true },
    { slug: 'bracelets', name: 'Bracelets', imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=600', active: true },
    { slug: 'mangalsutra', name: 'Mangalsutra', imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600', active: true }
  ],
  svgIcons: {
    logoSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    searchSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    wishlistSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    cartSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
    homeSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    categorySvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    profileSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    messageSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
  }
};

export function AdminAppFront(): React.JSX.Element {
  const [config, setConfig] = useState<AppFrontConfig>(DEFAULT_APP_FRONT_CONFIG);
  const [savedConfig, setSavedConfig] = useState<AppFrontConfig>(DEFAULT_APP_FRONT_CONFIG);
  const [activeTab, setActiveTab] = useState<'banners' | 'sections' | 'icons' | 'toggles'>('banners');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('Hero Banner');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [iframeRefreshKey, setIframeRefreshKey] = useState<number>(Date.now());

  // New Banner Form Modal/Card State
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCta, setNewCta] = useState('EXPLORE NOW');
  const [newImage, setNewImage] = useState('');
  const [newLink, setNewLink] = useState('/catalog');

  // Load configuration from Firestore / LocalStorage
  useEffect(() => {
    let loaded = false;
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, 'appFrontSettings', 'default');
      getDoc(docRef).then((snap) => {
        if (snap.exists()) {
          const data = snap.data() as AppFrontConfig;
          setConfig({ ...DEFAULT_APP_FRONT_CONFIG, ...data });
          setSavedConfig({ ...DEFAULT_APP_FRONT_CONFIG, ...data });
          loaded = true;
        }
      }).catch(err => console.warn('Could not load appFrontSettings:', err));
    }

    if (!loaded) {
      const local = localStorage.getItem('local_appfront_config');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          setConfig({ ...DEFAULT_APP_FRONT_CONFIG, ...parsed });
          setSavedConfig({ ...DEFAULT_APP_FRONT_CONFIG, ...parsed });
        } catch (e) {
          // ignore
        }
      }
    }
  }, []);

  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      if (isFirebaseConfigured && db) {
        const docRef = doc(db, 'appFrontSettings', 'default');
        await setDoc(docRef, config, { merge: true });
      }
      localStorage.setItem('local_appfront_config', JSON.stringify(config));
      setSavedConfig(config);
      setSaveStatus('saved');
      setIframeRefreshKey(Date.now());
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Error saving Web App config:', err);
      setSaveStatus('idle');
    }
  };

  const handleAddBanner = () => {
    if (!newTitle || !newImage) return;
    const bannerItem: SectionBannerItem = {
      id: `banner-${Date.now()}`,
      sectionType: selectedSectionFilter,
      title: newTitle,
      subtitle: newSubtitle || 'Web View Exclusive',
      ctaText: newCta || 'EXPLORE NOW',
      imageUrl: newImage,
      targetLink: newLink || '/catalog',
      active: true
    };

    if (selectedSectionFilter === 'Hero Banner') {
      setConfig(prev => ({ ...prev, heroBanners: [...prev.heroBanners, bannerItem] }));
    } else if (selectedSectionFilter === 'Offer Banner B1') {
      setConfig(prev => ({ ...prev, offerBanners: [...prev.offerBanners, bannerItem] }));
    } else if (selectedSectionFilter === 'Split Media Banner') {
      setConfig(prev => ({ ...prev, splitMediaBanners: [...prev.splitMediaBanners, bannerItem] }));
    } else if (selectedSectionFilter === 'OG Offer Collection') {
      setConfig(prev => ({ ...prev, ogOfferBanners: [...prev.ogOfferBanners, bannerItem] }));
    } else if (selectedSectionFilter === 'Shop The Look') {
      setConfig(prev => ({ ...prev, shopLookBanners: [...prev.shopLookBanners, bannerItem] }));
    } else if (selectedSectionFilter === 'Promo Callout Card') {
      setConfig(prev => ({ ...prev, promoCalloutBanners: [...prev.promoCalloutBanners, bannerItem] }));
    }

    setNewTitle('');
    setNewSubtitle('');
    setNewCta('EXPLORE NOW');
    setNewImage('');
    setNewLink('/catalog');
    setShowAddBanner(false);
  };

  const handleRemoveBanner = (listKey: keyof AppFrontConfig, id: string) => {
    setConfig(prev => {
      const list = prev[listKey] as SectionBannerItem[];
      if (!Array.isArray(list)) return prev;
      return {
        ...prev,
        [listKey]: list.filter(b => b.id !== id)
      };
    });
  };

  const handleToggleBanner = (listKey: keyof AppFrontConfig, id: string) => {
    setConfig(prev => {
      const list = prev[listKey] as SectionBannerItem[];
      if (!Array.isArray(list)) return prev;
      return {
        ...prev,
        [listKey]: list.map(b => b.id === id ? { ...b, active: !b.active } : b)
      };
    });
  };

  const handleUpdateCategoryBanner = (slug: string, newUrl: string) => {
    setConfig(prev => ({
      ...prev,
      categoryBanners: prev.categoryBanners.map(c => c.slug === slug ? { ...c, imageUrl: newUrl } : c)
    }));
  };

  const handleToggleSection = (sectionId: string) => {
    setConfig(prev => {
      const exists = prev.activeSections.includes(sectionId);
      return {
        ...prev,
        activeSections: exists 
          ? prev.activeSections.filter(s => s !== sectionId)
          : [...prev.activeSections, sectionId]
      };
    });
  };

  const handleIconChange = (iconKey: keyof WebAppSvgIcons, svgValue: string) => {
    setConfig(prev => ({
      ...prev,
      svgIcons: {
        ...prev.svgIcons,
        [iconKey]: svgValue
      }
    }));
  };

  // Helper to get active banner list based on selectedSectionFilter
  const getActiveBannerList = () => {
    switch (selectedSectionFilter) {
      case 'Hero Banner': return { key: 'heroBanners' as keyof AppFrontConfig, items: config.heroBanners };
      case 'Offer Banner B1': return { key: 'offerBanners' as keyof AppFrontConfig, items: config.offerBanners };
      case 'Split Media Banner': return { key: 'splitMediaBanners' as keyof AppFrontConfig, items: config.splitMediaBanners };
      case 'OG Offer Collection': return { key: 'ogOfferBanners' as keyof AppFrontConfig, items: config.ogOfferBanners };
      case 'Shop The Look': return { key: 'shopLookBanners' as keyof AppFrontConfig, items: config.shopLookBanners };
      case 'Promo Callout Card': return { key: 'promoCalloutBanners' as keyof AppFrontConfig, items: config.promoCalloutBanners };
      default: return { key: 'heroBanners' as keyof AppFrontConfig, items: config.heroBanners };
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-stone-800">
      
      {/* 1. MODULE TOP HEADER BAR */}
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6B1F2A] flex items-center justify-center text-amber-300 shadow-xs">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-serif font-bold text-stone-900 tracking-wide">APP FRONT MANAGER</h1>
              <span className="bg-amber-100 text-[#6B1F2A] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-300 uppercase">
                Web App & Mobile View
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Upload section banners, manage web app sections, and edit SVG icons. Live preview behaves like a real app user!
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              <span>Unsaved Changes</span>
            </span>
          )}

          <button
            onClick={() => setIframeRefreshKey(Date.now())}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-bold transition-all cursor-pointer"
            title="Reload Preview Window"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Refresh Preview</span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-bold transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
            <span>Open Site</span>
          </a>

          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#6B1F2A] hover:bg-[#581822] text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {saveStatus === 'saving' ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
            ) : saveStatus === 'saved' ? (
              <CheckCircle className="w-4 h-4 text-emerald-300" />
            ) : (
              <Save className="w-4 h-4 text-amber-300" />
            )}
            <span>{saveStatus === 'saved' ? 'Saved!' : 'Save Web App Look'}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE 2-COLUMN SPLIT */}
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
        
        {/* LEFT COLUMN: ADMIN CONTROLS (HIDDEN) */}
        <aside className="hidden">
          
          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-stone-200 bg-stone-100/40 p-2 gap-1 shrink-0">
            <button
              onClick={() => setActiveTab('banners')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'banners' ? 'bg-[#6B1F2A] text-white shadow-2xs' : 'text-stone-600 hover:bg-stone-200/60'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
              <span>Section Banners</span>
            </button>

            <button
              onClick={() => setActiveTab('sections')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sections' ? 'bg-[#6B1F2A] text-white shadow-2xs' : 'text-stone-600 hover:bg-stone-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-300" />
              <span>App Sections</span>
            </button>

            <button
              onClick={() => setActiveTab('icons')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'icons' ? 'bg-[#6B1F2A] text-white shadow-2xs' : 'text-stone-600 hover:bg-stone-200/60'
              }`}
            >
              <Code className="w-3.5 h-3.5 text-amber-300" />
              <span>SVG Icons</span>
            </button>

            <button
              onClick={() => setActiveTab('toggles')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'toggles' ? 'bg-[#6B1F2A] text-white shadow-2xs' : 'text-stone-600 hover:bg-stone-200/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-300" />
              <span>Toggles</span>
            </button>
          </div>

          <div className="p-5 space-y-6 flex-1 overflow-y-auto">
            
            {/* TAB 1: BANNERS BY STOREFRONT SECTION */}
            {activeTab === 'banners' && (
              <div className="space-y-4">
                
                {/* SECTION SELECTOR DROPDOWN */}
                <div className="space-y-1.5 bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
                    <span>Select Storefront Section for Banner Upload:</span>
                    <span className="text-[10px] text-[#6B1F2A] font-bold uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded">
                      {selectedSectionFilter}
                    </span>
                  </label>
                  <select
                    value={selectedSectionFilter}
                    onChange={(e) => setSelectedSectionFilter(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 cursor-pointer focus:ring-2 focus:ring-[#6B1F2A]"
                  >
                    <option value="Hero Banner">📸 Hero Banner Slider (Top Main Banner)</option>
                    <option value="Offer Banner B1">🔥 Offer Banner B1 (Festive Special Strip)</option>
                    <option value="Category Cards">💎 Our Gold Collections (Category Card Covers)</option>
                    <option value="Split Media Banner">🎨 Split Media Story Banner</option>
                    <option value="OG Offer Collection">👑 OG Offer Collection Showcase (3 Tiles)</option>
                    <option value="Shop The Look">✨ Shop The Look Lookbook Banner</option>
                    <option value="Promo Callout Card">🏷️ Promo Callout Voucher Card</option>
                  </select>
                </div>

                {/* BANNER ADD HEADER */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <h3 className="text-xs font-serif font-bold text-stone-900 uppercase tracking-wider">
                      {selectedSectionFilter} Banners
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Upload high-resolution banners specifically for {selectedSectionFilter} in Web View
                    </p>
                  </div>

                  {selectedSectionFilter !== 'Category Cards' && (
                    <button
                      onClick={() => setShowAddBanner(!showAddBanner)}
                      className="flex items-center gap-1 bg-[#B8860B] hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Banner</span>
                    </button>
                  )}
                </div>

                {/* ADD BANNER FORM MODAL/CARD */}
                {showAddBanner && selectedSectionFilter !== 'Category Cards' && (
                  <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3 shadow-sm">
                    <h4 className="text-xs font-bold text-[#6B1F2A] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Upload New {selectedSectionFilter} Banner</span>
                    </h4>
                    
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700">Banner Title / Heading</label>
                      <input
                        type="text"
                        placeholder="e.g. Royal Bengali Bridal Choker 2026"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-[#6B1F2A]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-stone-700">Subtitle / Eyebrow Tag</label>
                        <input
                          type="text"
                          placeholder="e.g. BOWBAZAR TRADITION"
                          value={newSubtitle}
                          onChange={(e) => setNewSubtitle(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-stone-300 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-stone-700">Button CTA Text</label>
                        <input
                          type="text"
                          placeholder="EXPLORE NOW"
                          value={newCta}
                          onChange={(e) => setNewCta(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-stone-300 bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700">Banner Image URL / CDN Link</label>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        value={newImage}
                        onChange={(e) => setNewImage(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-stone-300 bg-white font-mono text-[11px]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700">Target Page Link</label>
                      <input
                        type="text"
                        placeholder="/catalog?category=necklaces"
                        value={newLink}
                        onChange={(e) => setNewLink(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-stone-300 bg-white font-mono text-[11px]"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setShowAddBanner(false)}
                        className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddBanner}
                        className="px-4 py-1.5 rounded-lg bg-[#6B1F2A] text-white text-xs font-bold shadow-xs"
                      >
                        Add Banner
                      </button>
                    </div>
                  </div>
                )}

                {/* SPECIAL HANDLER: CATEGORY CARDS BANNERS */}
                {selectedSectionFilter === 'Category Cards' ? (
                  <div className="space-y-3">
                    <p className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                      Customize cover banners for each gold category on the mobile view:
                    </p>
                    {config.categoryBanners.map((cat) => (
                      <div key={cat.slug} className="p-3 bg-white border border-stone-200 rounded-xl space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">{cat.name}</span>
                          <span className="text-[10px] text-stone-400 font-mono">/catalog?category={cat.slug}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-lg overflow-hidden border border-stone-300 shrink-0 bg-stone-100">
                            <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                          </div>

                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold text-stone-600">Cover Banner Image URL</label>
                            <input
                              type="text"
                              value={cat.imageUrl}
                              onChange={(e) => handleUpdateCategoryBanner(cat.slug, e.target.value)}
                              className="w-full text-xs font-mono p-1.5 rounded-lg border border-stone-300 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* GENERIC SECTION BANNERS LIST */
                  <div className="space-y-3">
                    {getActiveBannerList().items.map((b) => (
                      <div key={b.id} className="p-3 bg-white border border-stone-200 rounded-xl shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={b.active}
                              onChange={() => handleToggleBanner(getActiveBannerList().key, b.id)}
                              className="w-4 h-4 accent-[#6B1F2A] cursor-pointer"
                            />
                            <div>
                              <span className="text-xs font-bold text-stone-900 block">{b.title}</span>
                              {b.subtitle && <span className="text-[10px] text-stone-500 block">{b.subtitle}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveBanner(getActiveBannerList().key, b.id)}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title="Remove Banner"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {b.imageUrl && (
                          <div className="h-24 rounded-lg overflow-hidden relative border border-stone-200 bg-stone-900">
                            <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover opacity-90" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-2.5 flex items-end justify-between">
                              <div>
                                <span className="text-[9px] font-bold text-amber-300 uppercase block tracking-wider">
                                  {b.subtitle || b.sectionType}
                                </span>
                                <span className="text-xs font-bold text-white block">{b.title}</span>
                              </div>
                              <span className="text-[9px] font-bold text-stone-900 bg-amber-400 px-2 py-0.5 rounded uppercase">
                                {b.ctaText || 'VIEW'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: STOREFRONT SECTIONS VISIBILITY & ORDER */}
            {activeTab === 'sections' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-serif font-bold text-stone-900">Web App Sections Stack</h3>
                  <p className="text-[11px] text-stone-500">Enable or disable individual sections on the Web App homepage</p>
                </div>

                <div className="space-y-2">
                  {STOREFRONT_SECTION_TYPES.map((sec) => {
                    const isActive = config.activeSections.includes(sec.id);
                    return (
                      <div
                        key={sec.id}
                        onClick={() => handleToggleSection(sec.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isActive
                            ? 'bg-amber-50/60 border-amber-300 shadow-2xs'
                            : 'bg-stone-50 border-stone-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isActive ? 'bg-[#6B1F2A] text-amber-300' : 'bg-stone-300 text-stone-600'
                          }`}>
                            {isActive ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-stone-900 block">{sec.name}</span>
                            <span className="text-[10px] text-stone-500 block">{sec.desc}</span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                        }`}>
                          {isActive ? 'ACTIVE' : 'HIDDEN'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: SVG ICONS MANAGER */}
            {activeTab === 'icons' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-serif font-bold text-stone-900">Web App SVG Icons</h3>
                  <p className="text-[11px] text-stone-500">Paste custom SVG markup for app icons across Web App header & nav</p>
                </div>

                <div className="space-y-4">
                  {/* LOGO SVG */}
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-800">Brand Logo Icon (SVG)</label>
                      <div className="w-6 h-6 border rounded bg-white flex items-center justify-center p-1 text-[#6B1F2A]"
                        dangerouslySetInnerHTML={{ __html: config.svgIcons.logoSvg || '' }}
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={config.svgIcons.logoSvg}
                      onChange={(e) => handleIconChange('logoSvg', e.target.value)}
                      className="w-full text-[10px] font-mono p-2 rounded-lg border border-stone-300 bg-white"
                      placeholder="<svg ...></svg>"
                    />
                  </div>

                  {/* SEARCH SVG */}
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-800">Top Search Icon (SVG)</label>
                      <div className="w-6 h-6 border rounded bg-white flex items-center justify-center p-1 text-stone-700"
                        dangerouslySetInnerHTML={{ __html: config.svgIcons.searchSvg || '' }}
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={config.svgIcons.searchSvg}
                      onChange={(e) => handleIconChange('searchSvg', e.target.value)}
                      className="w-full text-[10px] font-mono p-2 rounded-lg border border-stone-300 bg-white"
                      placeholder="<svg ...></svg>"
                    />
                  </div>

                  {/* WISHLIST HEART SVG */}
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-800">Wishlist Heart Icon (SVG)</label>
                      <div className="w-6 h-6 border rounded bg-white flex items-center justify-center p-1 text-rose-600"
                        dangerouslySetInnerHTML={{ __html: config.svgIcons.wishlistSvg || '' }}
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={config.svgIcons.wishlistSvg}
                      onChange={(e) => handleIconChange('wishlistSvg', e.target.value)}
                      className="w-full text-[10px] font-mono p-2 rounded-lg border border-stone-300 bg-white"
                      placeholder="<svg ...></svg>"
                    />
                  </div>

                  {/* CART SVG */}
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-800">Shopping Cart Bag Icon (SVG)</label>
                      <div className="w-6 h-6 border rounded bg-white flex items-center justify-center p-1 text-amber-600"
                        dangerouslySetInnerHTML={{ __html: config.svgIcons.cartSvg || '' }}
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={config.svgIcons.cartSvg}
                      onChange={(e) => handleIconChange('cartSvg', e.target.value)}
                      className="w-full text-[10px] font-mono p-2 rounded-lg border border-stone-300 bg-white"
                      placeholder="<svg ...></svg>"
                    />
                  </div>

                  {/* BOTTOM NAV HOME SVG */}
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-800">Bottom Nav Home Icon (SVG)</label>
                      <div className="w-6 h-6 border rounded bg-white flex items-center justify-center p-1 text-[#6B1F2A]"
                        dangerouslySetInnerHTML={{ __html: config.svgIcons.homeSvg || '' }}
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={config.svgIcons.homeSvg}
                      onChange={(e) => handleIconChange('homeSvg', e.target.value)}
                      className="w-full text-[10px] font-mono p-2 rounded-lg border border-stone-300 bg-white"
                      placeholder="<svg ...></svg>"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: APP TOGGLES */}
            {activeTab === 'toggles' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-serif font-bold text-stone-900">App Visibility Toggles</h3>
                  <p className="text-[11px] text-stone-500">Enable or disable core elements on the web app interface</p>
                </div>

                <div className="space-y-3">
                  <label className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">Live Gold & Silver Rate Ticker</span>
                      <span className="text-[10px] text-stone-500 block">Show rate ticker bar above top header</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.showLiveRateTicker}
                      onChange={(e) => setConfig(prev => ({ ...prev, showLiveRateTicker: e.target.checked }))}
                      className="w-4 h-4 accent-[#6B1F2A]"
                    />
                  </label>

                  <label className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">Mobile Quick Search Bar</span>
                      <span className="text-[10px] text-stone-500 block">Show search input below top header</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.showSearchBar}
                      onChange={(e) => setConfig(prev => ({ ...prev, showSearchBar: e.target.checked }))}
                      className="w-4 h-4 accent-[#6B1F2A]"
                    />
                  </label>

                  <label className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">Persistent Bottom Navigation</span>
                      <span className="text-[10px] text-stone-500 block">Show 5-tab mobile navigation bar</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.showBottomNav}
                      onChange={(e) => setConfig(prev => ({ ...prev, showBottomNav: e.target.checked }))}
                      className="w-4 h-4 accent-[#6B1F2A]"
                    />
                  </label>
                </div>
              </div>
            )}

          </div>
        </aside>

        {/* FULL WORKSPACE REAL-TIME INTERACTIVE LIVE PREVIEW WINDOW */}
        <main className="flex-1 bg-[#FAF9F6] p-4 sm:p-8 flex flex-col items-center justify-center overflow-y-auto min-h-0 relative">
          <LivePreviewWindow 
            title="App Front Real-Time Mobile Preview"
            subtitle="Interactive live preview of the web app."
            activeRoute="/"
            liveSettings={config}
            onUpdateConfig={(updated) => {
              setConfig(updated);
              setSavedConfig(updated);
              localStorage.setItem('local_appfront_config', JSON.stringify(updated));
            }}
            onSave={handleSave}
            isDirty={isDirty}
            onRefresh={() => setIframeRefreshKey(Date.now())}
            className="h-full min-h-[680px] w-full"
          />
        </main>

      </div>

    </div>
  );
}
