/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Storefront Live Visual Page Builder Module
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Store, 
  Settings, 
  Check, 
  RotateCcw, 
  Plus, 
  Sparkles,
  Info,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  Globe,
  FileText,
  Eye,
  Laptop,
  Tablet,
  Smartphone,
  X, 
  GripVertical,
  Edit
} from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { Home, DEFAULT_PAGE_SECTIONS } from '../pages/Home';
import { SectionEditorPanel } from '../components/SectionEditorPanel';
import { PageSeoDrawer, PageSeoObject } from '../components/PageSeoDrawer';
import { NavEditorPanel } from '../components/NavEditorPanel';
import { MetalPriceBar } from '../components/ShowroomComponents';
import { mockMetalPrices, mockProducts, mockCollections, mockStores } from '../data/mockData';
import { db, isFirebaseConfigured } from '../firebase/config';
import { collection, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';

// Template library layouts
const TEMPLATE_SECTIONS = [
  {
    type: 'Hero Banner',
    description: 'Vibrant slider banner with headings, descriptions, and CTA goal buttons',
    wireframe: (
      <div className="w-16 h-12 bg-stone-800 border border-stone-700 rounded flex flex-col justify-between p-1.5 gap-1 shrink-0">
        <div className="h-1 w-6 bg-stone-500 rounded"></div>
        <div className="flex-1 bg-stone-700 rounded flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-stone-500"></div>
        </div>
      </div>
    )
  },
  {
    type: 'Category Cards',
    description: 'Grid layout of collections or categories to navigate store routes',
    wireframe: (
      <div className="w-16 h-12 bg-stone-800 border border-stone-700 rounded flex gap-1 p-1 items-center shrink-0">
        <div className="flex-1 h-8 bg-stone-700 rounded-xs"></div>
        <div className="flex-1 h-8 bg-stone-700 rounded-xs"></div>
        <div className="flex-1 h-8 bg-stone-700 rounded-xs"></div>
      </div>
    )
  },
  {
    type: 'Product Carousel',
    description: 'Horizontal slider displaying selected premium products',
    wireframe: (
      <div className="w-16 h-12 bg-stone-800 border border-stone-700 rounded flex flex-col gap-1 p-1 shrink-0">
        <div className="h-1.5 w-8 bg-stone-600 rounded"></div>
        <div className="flex gap-1">
          <div className="w-4 h-6 bg-stone-700 rounded-xs"></div>
          <div className="w-4 h-6 bg-stone-700 rounded-xs"></div>
          <div className="w-4 h-6 bg-stone-700 rounded-xs"></div>
        </div>
      </div>
    )
  },
  {
    type: 'Shop The Look',
    description: 'Interactive editorial image with clickable gold hotspots',
    wireframe: (
      <div className="w-16 h-12 bg-stone-800 border border-stone-700 rounded p-1 flex items-center justify-center relative shrink-0">
        <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-300"></div>
        <div className="w-2 h-2 rounded-full bg-amber-500/50 absolute top-2 right-3"></div>
      </div>
    )
  },
  {
    type: 'About Collection',
    description: 'Editorial storytelling layout with asymmetrical image gallery & rich typography',
    wireframe: (
      <div className="w-16 h-12 bg-stone-800 border border-stone-700 rounded p-1 grid grid-cols-2 gap-1 shrink-0">
        <div className="bg-stone-700 rounded-xs"></div>
        <div className="flex flex-col gap-1">
          <div className="bg-stone-700 flex-1 rounded-xs"></div>
          <div className="bg-stone-700 flex-1 rounded-xs"></div>
        </div>
      </div>
    )
  },
  {
    type: 'Our Boutiques',
    description: 'Physical showroom address cards with direct directions & WhatsApp links',
    wireframe: (
      <div className="w-16 h-12 bg-stone-800 border border-stone-700 rounded flex flex-col justify-center gap-1 p-1 shrink-0">
        <div className="h-1.5 w-full bg-stone-600 rounded"></div>
        <div className="h-1.5 w-3/4 bg-stone-600 rounded"></div>
      </div>
    )
  },
  {
    type: 'Split Media Banner',
    description: 'Left/right swappable image with editorial copy, bullet points, and dual buttons',
    wireframe: (
      <div className="w-16 h-12 bg-stone-800 border border-stone-700 rounded flex gap-1.5 p-1 shrink-0">
        <div className="w-6 h-full bg-stone-700 rounded-xs"></div>
        <div className="flex-1 flex flex-col gap-1 justify-center">
          <div className="h-1.5 w-full bg-stone-600 rounded"></div>
          <div className="h-1 w-2/3 bg-stone-700"></div>
        </div>
      </div>
    )
  },
  {
    type: 'OG Offer Collection',
    description: 'Editorial 3-image showcase with a large feature tile and two linked highlights',
    wireframe: (
      <div className="w-16 h-12 bg-stone-800 border border-stone-700 rounded p-1 flex gap-1 shrink-0">
        <div className="w-6 h-full bg-stone-700 rounded-xs"></div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="h-4.5 bg-stone-700 rounded-xs"></div>
          <div className="h-4.5 bg-stone-700 rounded-xs"></div>
        </div>
      </div>
    )
  }
];

export function AdminStorefront(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active page selection
  const pageIdParam = searchParams.get('pageId') || searchParams.get('page') || 'home';
  const [activePageId, setActivePageId] = useState<string>(pageIdParam);
  const [activePageName, setActivePageName] = useState<string>('Home Page');
  const [activePageSlug, setActivePageSlug] = useState<string>('home');
  const [activePageStatus, setActivePageStatus] = useState<'published' | 'draft'>('published');
  const [pageSeo, setPageSeo] = useState<PageSeoObject>({
    title: 'Premium Sterling Silver Jewelry | VelvetBox Official',
    slug: 'home',
    description: 'Shop premium sterling silver jewelry at VelvetBox. Discover rings, necklaces, earrings, and bracelets with timeless designs, brilliant finish, and pure hallmark silver.',
    ogImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200'
  });

  // Saved state companions to track isDirty / hasChanges
  const [savedPageName, setSavedPageName] = useState<string>('Home Page');
  const [savedPageSlug, setSavedPageSlug] = useState<string>('home');
  const [savedPageStatus, setSavedPageStatus] = useState<'published' | 'draft'>('published');
  const [savedPageSeo, setSavedPageSeo] = useState<PageSeoObject>({
    title: 'Premium Sterling Silver Jewelry | VelvetBox Official',
    slug: 'home',
    description: 'Shop premium sterling silver jewelry at VelvetBox. Discover rings, necklaces, earrings, and bracelets with timeless designs, brilliant finish, and pure hallmark silver.',
    ogImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200'
  });

  const [savedNavigationList, setSavedNavigationList] = useState<any[]>([]);
  const [savedNavGlobalTextColor, setSavedNavGlobalTextColor] = useState<string>('#ffffff');
  const [savedNavGlobalFontSize, setSavedNavGlobalFontSize] = useState<string>('11px');
  const [savedNavGlobalFontWeight, setSavedNavGlobalFontWeight] = useState<string>('font-semibold');

  // Pages list for page selector dropdown
  const [availablePages, setAvailablePages] = useState<any[]>([
    { id: 'home', name: 'Home Page', slug: 'home', status: 'published' }
  ]);

  const [metalPrices, setMetalPrices] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [resetStatus, setResetStatus] = useState<'idle' | 'resetting' | 'done'>('idle');
  const [editorMode, setEditorMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Visual builder dynamic state
  const [pageSections, setPageSections] = useState<any[]>([]);
  const [savedPageSections, setSavedPageSections] = useState<any[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  // SEO Settings drawer state
  const [seoDrawerOpen, setSeoDrawerOpen] = useState(false);

  // Navigation / Header dynamic state
  const [navEditorOpen, setNavEditorOpen] = useState(false);
  const [navigationList, setNavigationList] = useState<any[]>([]);
  const [navGlobalTextColor, setNavGlobalTextColor] = useState<string>('#ffffff');
  const [navGlobalFontSize, setNavGlobalFontSize] = useState<string>('11px');
  const [navGlobalFontWeight, setNavGlobalFontWeight] = useState<string>('font-semibold');
  const [settingsDocId, setSettingsDocId] = useState<string>('general');

  // Section Content Editor State
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [originalSectionBackup, setOriginalSectionBackup] = useState<any | null>(null);

  // Keep activePageId in sync with URL searchParams
  useEffect(() => {
    const p = searchParams.get('pageId') || searchParams.get('page') || 'home';
    if (p !== activePageId) {
      setActivePageId(p);
    }
  }, [searchParams]);

  // Load all available pages for the switcher dropdown
  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      const cached = localStorage.getItem('draft_custom_pages');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAvailablePages(parsed);
          }
        } catch (e) {
          console.error('Error parsing local pages:', e);
        }
      }
      return;
    }

    const pagesCollectionRef = collection(db, 'pageSections');
    const unsubscribe = onSnapshot(pagesCollectionRef, (snapshot) => {
      const loaded: any[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        loaded.push({
          id: docSnap.id,
          name: data.name || data.title || (docSnap.id === 'home' ? 'Home Page' : docSnap.id),
          slug: data.slug || docSnap.id,
          status: data.status || 'published',
          sections: data.sections || [],
          seo: data.seo || {}
        });
      });

      if (loaded.length > 0) {
        setAvailablePages(loaded);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch dynamic website settings for header editing
  useEffect(() => {
    // Populate default fallback mock settings
    import('../data/mockSettings').then(({ mockWebsiteSettings }) => {
      setNavigationList(mockWebsiteSettings.navigation || []);
      setNavGlobalTextColor(mockWebsiteSettings.navGlobalTextColor || '#ffffff');
      setNavGlobalFontSize(mockWebsiteSettings.navGlobalFontSize || '11px');
      setNavGlobalFontWeight(mockWebsiteSettings.navGlobalFontWeight || 'font-semibold');

      setSavedNavigationList(mockWebsiteSettings.navigation || []);
      setSavedNavGlobalTextColor(mockWebsiteSettings.navGlobalTextColor || '#ffffff');
      setSavedNavGlobalFontSize(mockWebsiteSettings.navGlobalFontSize || '11px');
      setSavedNavGlobalFontWeight(mockWebsiteSettings.navGlobalFontWeight || 'font-semibold');
    });

    if (!isFirebaseConfigured || !db) {
      const cached = localStorage.getItem('draft_website_settings');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.navigation) {
            setNavigationList(parsed.navigation);
            setSavedNavigationList(parsed.navigation);
          }
          if (parsed.navGlobalTextColor) {
            setNavGlobalTextColor(parsed.navGlobalTextColor);
            setSavedNavGlobalTextColor(parsed.navGlobalTextColor);
          }
          if (parsed.navGlobalFontSize) {
            setNavGlobalFontSize(parsed.navGlobalFontSize);
            setSavedNavGlobalFontSize(parsed.navGlobalFontSize);
          }
          if (parsed.navGlobalFontWeight) {
            setNavGlobalFontWeight(parsed.navGlobalFontWeight);
            setSavedNavGlobalFontWeight(parsed.navGlobalFontWeight);
          }
        } catch (e) {
          console.error('Error loading settings from local cache:', e);
        }
      }
      return;
    }

    const settingsCollectionRef = collection(db, 'websiteSettings');
    const unsubscribe = onSnapshot(settingsCollectionRef, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setSettingsDocId(docSnap.id);
        const data = docSnap.data();
        if (data.navigation) {
          setNavigationList(data.navigation);
          setSavedNavigationList(data.navigation);
        }
        if (data.navGlobalTextColor) {
          setNavGlobalTextColor(data.navGlobalTextColor);
          setSavedNavGlobalTextColor(data.navGlobalTextColor);
        }
        if (data.navGlobalFontSize) {
          setNavGlobalFontSize(data.navGlobalFontSize);
          setSavedNavGlobalFontSize(data.navGlobalFontSize);
        }
        if (data.navGlobalFontWeight) {
          setNavGlobalFontWeight(data.navGlobalFontWeight);
          setSavedNavGlobalFontWeight(data.navGlobalFontWeight);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle section content modification
  const handleSectionContentChange = (updatedContent: any) => {
    if (!editingSectionId) return;
    setPageSections(prev => prev.map(sec => {
      if (sec.id === editingSectionId) {
        return { 
          ...sec, 
          content: {
            ...(sec.content || {}),
            ...updatedContent
          }
        };
      }
      return sec;
    }));
  };

  const handleSectionContentReset = () => {
    if (!editingSectionId) {
      setEditingSectionId(null);
      return;
    }
    
    // Revert content of this specific section to the original backup
    if (originalSectionBackup) {
      setPageSections(prev => prev.map(sec => {
        if (sec.id === editingSectionId) {
          return { ...sec, content: originalSectionBackup };
        }
        return sec;
      }));
    }
    
    setEditingSectionId(null);
    setOriginalSectionBackup(null);
  };

  // Load live metal prices to display in the real MetalPriceBar
  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setMetalPrices(mockMetalPrices);
      return;
    }

    const pricesRef = collection(db, 'metalPrices');
    const unsubscribe = onSnapshot(pricesRef, (snapshot) => {
      if (snapshot.empty) {
        setMetalPrices(mockMetalPrices);
        return;
      }
      const loadedPrices: any[] = [];
      snapshot.forEach((doc) => {
        loadedPrices.push({ id: doc.id, ...doc.data() });
      });
      setMetalPrices(loadedPrices);
    });

    return () => unsubscribe();
  }, []);

  // Load pageSections and SEO for activePageId from Firestore or cache
  useEffect(() => {
    setLoadingSections(true);

    if (!isFirebaseConfigured || !db) {
      // Local storage fallback for this specific page
      const cached = localStorage.getItem(`draft_page_sections_${activePageId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const sections = parsed.sections || DEFAULT_PAGE_SECTIONS;
          setPageSections(sections);
          setSavedPageSections(sections);
          if (parsed.seo) {
            setPageSeo(parsed.seo);
            setSavedPageSeo(parsed.seo);
          }
          if (parsed.name) {
            setActivePageName(parsed.name);
            setSavedPageName(parsed.name);
          }
          if (parsed.slug) {
            setActivePageSlug(parsed.slug);
            setSavedPageSlug(parsed.slug);
          }
          if (parsed.status) {
            setActivePageStatus(parsed.status);
            setSavedPageStatus(parsed.status);
          }
          setLoadingSections(false);
          return;
        } catch (e) {
          console.error('Failed to parse cached page:', e);
        }
      }

      // Default fallback
      const defSections = activePageId === 'home' ? DEFAULT_PAGE_SECTIONS : [
        { id: `sec-hero-${activePageId}`, type: 'Hero Banner', content: { title: `${activePageName} Showcase` } },
        { id: `sec-products-${activePageId}`, type: 'Product Carousel', content: { title: 'Featured Collection' } }
      ];
      setPageSections(defSections);
      setSavedPageSections(defSections);
      setLoadingSections(false);
      return;
    }

    const docRef = doc(db, 'pageSections', activePageId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const loadedSections = (data && Array.isArray(data.sections) && data.sections.length > 0)
          ? data.sections 
          : (activePageId === 'home' ? DEFAULT_PAGE_SECTIONS : []);
        
        setPageSections(loadedSections);
        setSavedPageSections(loadedSections);

        if (data.seo) {
          setPageSeo(data.seo);
          setSavedPageSeo(data.seo);
        }
        if (data.name || data.title) {
          setActivePageName(data.name || data.title);
          setSavedPageName(data.name || data.title);
        }
        if (data.slug) {
          setActivePageSlug(data.slug);
          setSavedPageSlug(data.slug);
        }
        if (data.status) {
          setActivePageStatus(data.status);
          setSavedPageStatus(data.status);
        }
      } else {
        const defSections = activePageId === 'home' ? DEFAULT_PAGE_SECTIONS : [];
        setPageSections(defSections);
        setSavedPageSections(defSections);
      }
      setLoadingSections(false);
    }, (error) => {
      console.error('Error loading page sections:', error);
      setPageSections(DEFAULT_PAGE_SECTIONS);
      setSavedPageSections(DEFAULT_PAGE_SECTIONS);
      setLoadingSections(false);
    });

    return () => unsubscribe();
  }, [activePageId]);

  const handlePageSwitch = (newPageId: string) => {
    setActivePageId(newPageId);
    setSearchParams({ pageId: newPageId });
    setEditingSectionId(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Intercept standard click routing to safely keep visual page-builder in editor mode
    e.preventDefault();
    e.stopPropagation();
  };

  const getTemplateDefaultContent = (type: string) => {
    switch (type) {
      case 'Hero Banner':
        return {
          subtitle: 'KOLKATA HERITAGE 22K',
          title: 'Royal Bengali Bridal Jewellery',
          description: 'Handcrafted master chokers, certified Polki, and Nakashi bangles forged with generational gold excellence.',
          primaryButton: { label: 'Explore Catalog', linkUrl: '/catalog', styleType: 'filled' },
          secondaryButton: { label: 'Book Appointment', linkUrl: '/contact', styleType: 'outlined' },
          mediaUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200'
        };
      case 'Split Media Banner':
        return {
          subtitle: 'HERITAGE SINCE 1974',
          title: '50 Years of Goldsmith Trust',
          description: 'Traditional Bowbazar craftsmanship meets modern hallmarked purity and bespoke bridal consultation.',
          primaryButton: { label: 'View Stores', linkUrl: '/stores', styleType: 'filled' },
          secondaryButton: { label: 'Explore Products', linkUrl: '/catalog', styleType: 'outlined' },
          mediaUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=1200'
        };
      case 'About Collection':
      case 'Story Collage':
        return {
          subtitle: 'BOWBAZAR TRADITION',
          title: 'Preserving the Art of Bengali Goldsmiths',
          description: 'Every bride deserves generational heirloom jewelry crafted to endure for decades.'
        };
      case 'Product Carousel':
        return {
          title: 'Curated Royal Arrivals',
          productsType: 'featured'
        };
      case 'OG Offer Collection':
        return {
          title: 'Tanishq Collections',
          subtitle: 'Explore our newly launched collection',
          subtitleAccent: 'newly launched',
          subtitleAccentColor: '#be123c',
          titleStyle: { fontFamily: 'serif', color: '#1c1917', fontSize: 36 },
          subtitleStyle: { fontFamily: 'sans', color: '#78716c', fontSize: 14 },
          tile1: {
            image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600',
            linkUrl: '#'
          },
          tile2: {
            image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400',
            linkUrl: '#'
          },
          tile3: {
            image: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&q=80&w=400',
            linkUrl: '#'
          }
        };
      case 'Category Cards':
      case 'Our Boutiques':
      case 'Shop The Look':
      default:
        return {};
    }
  };

  const handleSelectTemplate = (type: string) => {
    const defaultContent = getTemplateDefaultContent(type);

    const newSec = {
      id: `sec-${Date.now()}`,
      type: type,
      content: defaultContent
    };

    let updated: any[] = [];
    if (insertIndex !== null) {
      updated = [...pageSections];
      updated.splice(insertIndex + 1, 0, newSec);
    } else {
      updated = [...pageSections, newSec];
    }
    
    setPageSections(updated);
    setPickerOpen(false);
    setInsertIndex(null);
    setEditingSectionId(newSec.id);
    setOriginalSectionBackup(JSON.parse(JSON.stringify(defaultContent)));
  };

  // Immediate persistence to Firestore / LocalStorage
  const triggerSave = async () => {
    setSaveStatus('saving');
    
    const pagePayload = {
      id: activePageId,
      name: activePageName,
      slug: activePageSlug,
      status: activePageStatus,
      sections: pageSections,
      seo: pageSeo,
      updatedAt: new Date().toISOString()
    };

    if (!isFirebaseConfigured || !db) {
      localStorage.setItem(`draft_page_sections_${activePageId}`, JSON.stringify(pagePayload));
      localStorage.setItem('draft_page_sections', JSON.stringify(pageSections));
      localStorage.setItem('draft_website_settings', JSON.stringify({
        navigation: navigationList,
        navGlobalTextColor,
        navGlobalFontSize,
        navGlobalFontWeight
      }));
      
      // Update custom pages list cache
      const cachedPages = localStorage.getItem('draft_custom_pages');
      let pagesList = cachedPages ? JSON.parse(cachedPages) : [];
      const idx = pagesList.findIndex((p: any) => p.id === activePageId);
      if (idx >= 0) {
        pagesList[idx] = { ...pagesList[idx], ...pagePayload };
      } else {
        pagesList.push(pagePayload);
      }
      localStorage.setItem('draft_custom_pages', JSON.stringify(pagesList));

      setSavedPageSections(pageSections);
      setSavedPageName(activePageName);
      setSavedPageSlug(activePageSlug);
      setSavedPageStatus(activePageStatus);
      setSavedPageSeo(pageSeo);

      setSavedNavigationList(navigationList);
      setSavedNavGlobalTextColor(navGlobalTextColor);
      setSavedNavGlobalFontSize(navGlobalFontSize);
      setSavedNavGlobalFontWeight(navGlobalFontWeight);

      setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      }, 600);
      return;
    }

    try {
      const docRef = doc(db, 'pageSections', activePageId);
      await setDoc(docRef, pagePayload, { merge: true });

      const settingsRef = doc(db, 'websiteSettings', settingsDocId);
      await setDoc(settingsRef, {
        navigation: navigationList,
        navGlobalTextColor,
        navGlobalFontSize,
        navGlobalFontWeight
      }, { merge: true });
      
      setSavedPageSections(pageSections);
      setSavedPageName(activePageName);
      setSavedPageSlug(activePageSlug);
      setSavedPageStatus(activePageStatus);
      setSavedPageSeo(pageSeo);

      setSavedNavigationList(navigationList);
      setSavedNavGlobalTextColor(navGlobalTextColor);
      setSavedNavGlobalFontSize(navGlobalFontSize);
      setSavedNavGlobalFontWeight(navGlobalFontWeight);

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Error saving page sections:', err);
      setSaveStatus('idle');
      alert('Failed to save to cloud database. Changes stored in temporary preview cache.');
    }
  };

  const triggerReset = () => {
    setResetStatus('resetting');
    setTimeout(() => {
      setPageSections([...savedPageSections]);
      setResetStatus('done');
      setTimeout(() => setResetStatus('idle'), 2000);
    }, 600);
  };

  // Handler for saving SEO from drawer
  const handleSaveSeo = async (updatedSeo: PageSeoObject) => {
    setPageSeo(updatedSeo);
    if (updatedSeo.slug && activePageId !== 'home') {
      setActivePageSlug(updatedSeo.slug);
    }

    // Auto-persist immediately
    const docRef = isFirebaseConfigured && db ? doc(db, 'pageSections', activePageId) : null;
    const pagePayload = {
      id: activePageId,
      name: activePageName,
      slug: activePageId === 'home' ? 'home' : (updatedSeo.slug || activePageSlug),
      status: activePageStatus,
      sections: pageSections,
      seo: updatedSeo,
      updatedAt: new Date().toISOString()
    };

    if (docRef) {
      try {
        await setDoc(docRef, pagePayload, { merge: true });
        setSavedPageSeo(updatedSeo);
        if (updatedSeo.slug && activePageId !== 'home') {
          setSavedPageSlug(updatedSeo.slug);
        }
      } catch (err) {
        console.error('Error saving SEO to Firestore:', err);
      }
    } else {
      localStorage.setItem(`draft_page_sections_${activePageId}`, JSON.stringify(pagePayload));
      setSavedPageSeo(updatedSeo);
      if (updatedSeo.slug && activePageId !== 'home') {
        setSavedPageSlug(updatedSeo.slug);
      }
    }
  };

  const liveUrl = activePageId === 'home' || activePageSlug === 'home'
    ? '/'
    : `/pages/${activePageSlug || activePageId}`;

  // Robust deep comparison helper to prevent false positive dirtiness due to undefined/null mapping or field key reordering
  const isEquivalent = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (!a || !b) {
      const isEmptyObjOrArr = (val: any) => {
        if (!val) return true;
        if (Array.isArray(val) && val.length === 0) return true;
        if (typeof val === 'object' && Object.keys(val).length === 0) return true;
        return false;
      };
      return isEmptyObjOrArr(a) && isEmptyObjOrArr(b);
    }
    if (typeof a !== typeof b) return false;
    if (Array.isArray(a)) {
      if (!Array.isArray(b)) return false;
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!isEquivalent(a[i], b[i])) return false;
      }
      return true;
    }
    if (typeof a === 'object') {
      const getKeys = (obj: any) => Object.keys(obj).filter(k => obj[k] !== undefined && obj[k] !== null);
      const keysA = getKeys(a);
      const keysB = getKeys(b);
      if (keysA.length !== keysB.length) return false;
      for (const key of keysA) {
        if (!isEquivalent(a[key], b[key])) return false;
      }
      return true;
    }
    return false;
  };

  const hasChanges = 
    !isEquivalent(pageSections, savedPageSections) ||
    activePageName !== savedPageName ||
    activePageSlug !== savedPageSlug ||
    activePageStatus !== savedPageStatus ||
    !isEquivalent(pageSeo, savedPageSeo) ||
    !isEquivalent(navigationList, savedNavigationList) ||
    navGlobalTextColor !== savedNavGlobalTextColor ||
    navGlobalFontSize !== savedNavGlobalFontSize ||
    navGlobalFontWeight !== savedNavGlobalFontWeight;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-stone-900 text-stone-100 font-sans" id="storefront-page-builder">
      {/* 1. Control Top-Bar */}
      <div className="h-14 bg-stone-950 border-b border-stone-800/80 px-6 flex items-center justify-between z-20 shrink-0" id="storefront-editor-topbar">
        
        {/* Left: App Identity & Page Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-amber-600/10 border border-amber-600/30 rounded flex items-center justify-center text-amber-500">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs font-bold uppercase tracking-widest text-stone-100 leading-tight">Storefront Builder</h1>
              <p className="text-[9px] text-amber-500/90 font-mono font-medium">LIVE VISUAL CANVAS</p>
            </div>
          </div>

          <div className="w-px h-6 bg-stone-800" />

          {/* Page Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-bold hidden sm:inline">Page:</span>
            <div className="relative">
              <select
                value={activePageId}
                onChange={(e) => handlePageSwitch(e.target.value)}
                className="bg-stone-900 border border-stone-700 hover:border-amber-500/80 text-stone-100 text-xs font-semibold py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:border-amber-500 transition-colors cursor-pointer appearance-none"
                id="select-page-dropdown"
              >
                {availablePages.map((p) => (
                  <option key={p.id} value={p.id} className="bg-stone-900 text-stone-100">
                    {p.name || p.title || p.id} ({p.id === 'home' ? '/' : `/pages/${p.slug || p.id}`})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Center: Device Viewport Simulation Switcher */}
        <div className="hidden md:flex items-center bg-stone-900 border border-stone-800 rounded-lg p-1">
          <button 
            onClick={() => setEditorMode('desktop')}
            className={`p-1.5 rounded transition-all cursor-pointer ${editorMode === 'desktop' ? 'bg-amber-600 text-stone-950 shadow-sm' : 'text-stone-400 hover:text-stone-200'}`}
            title="Desktop 100% Canvas"
          >
            <Laptop className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setEditorMode('tablet')}
            className={`p-1.5 rounded transition-all cursor-pointer ${editorMode === 'tablet' ? 'bg-amber-600 text-stone-950 shadow-sm' : 'text-stone-400 hover:text-stone-200'}`}
            title="Tablet 768px View"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setEditorMode('mobile')}
            className={`p-1.5 rounded transition-all cursor-pointer ${editorMode === 'mobile' ? 'bg-amber-600 text-stone-950 shadow-sm' : 'text-stone-400 hover:text-stone-200'}`}
            title="Mobile 375px View"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* SEO Modal Trigger Button */}
          <button
            onClick={() => setSeoDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 border border-stone-700 hover:border-amber-500/70 text-stone-200 hover:text-amber-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            id="topbar-seo-settings-btn"
            title="Configure Search Engine & Social OG Cards"
          >
            <Globe className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">SEO Settings</span>
          </button>

          {/* View Live Page Link */}
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-stone-100 text-xs font-medium rounded-lg transition-colors"
            title="Open Live Public Page in New Tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden sm:inline">View Live</span>
          </a>

          {/* Direct Save Button */}
          <button 
            onClick={triggerSave}
            disabled={saveStatus === 'saving'}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            id="topbar-save-btn"
          >
            {saveStatus === 'saving' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Saved Live!</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Interactive Workspace & Section Canvas Area */}
      <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden bg-stone-950" id="storefront-canvas-layout">
        
        {/* Main Canvas Scroll Area */}
        <div 
          className={`flex-1 min-h-0 overflow-y-auto bg-stone-950 flex flex-col relative z-10 transition-all duration-300 ${
            editorMode === 'desktop' 
              ? 'p-0 items-stretch' 
              : 'p-4 sm:p-6 items-center'
          }`} 
          id="storefront-interactive-canvas"
        >
          
          {/* Framed Canvas Container */}
          <div 
            className={`transition-all duration-300 bg-white ${
              editorMode === 'mobile' 
                ? 'w-[375px] max-w-full my-4 min-h-[667px] rounded-lg border border-stone-700/60 shadow-2xl shrink-0' 
                : editorMode === 'tablet' 
                  ? 'w-[768px] max-w-full my-4 min-h-[800px] rounded-lg border border-stone-700/60 shadow-2xl shrink-0' 
                  : 'w-full min-h-full flex flex-col'
            }`}
            onClick={handleCanvasClick}
          >
            {/* Header & Navbar Simulation Frame */}
            <div 
              className="relative group/nav cursor-pointer border-2 border-transparent hover:border-amber-500/80 transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setNavEditorOpen(true);
              }}
              title="Click to edit Header & Navigation"
              id="builder-navigation-editor-trigger"
            >
              {/* Highlight Overlay */}
              <div className="absolute inset-0 bg-amber-500/0 group-hover/nav:bg-amber-500/5 pointer-events-none z-30 transition-colors" />
              
              {/* Hover Edit Button overlay */}
              <div className="absolute top-1/2 right-6 -translate-y-1/2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[10px] tracking-wider px-3 py-1.5 rounded-md shadow-xl opacity-0 group-hover/nav:opacity-100 transition-opacity z-40 flex items-center gap-1.5 select-none">
                <Edit className="w-3.5 h-3.5" />
                <span>EDIT HEADER & NAV</span>
              </div>
              
              <div className="pointer-events-none select-none">
                <MetalPriceBar prices={metalPrices} />
                <Navigation 
                  customNavItems={navigationList}
                  customGlobalTextColor={navGlobalTextColor}
                  customGlobalFontSize={navGlobalFontSize}
                  customGlobalFontWeight={navGlobalFontWeight}
                />
              </div>
            </div>

            {/* Live Interactive Page Canvas */}
            <div className="w-full relative min-h-[400px]" id="storefront-page-sections-wrapper">
              <Home 
                isBuilder={true}
                pageSections={pageSections}
                loadingSections={loadingSections}
                selectedSectionId={editingSectionId || undefined}
                onSectionClick={(sectionId) => {
                  const sec = pageSections.find(s => s.id === sectionId);
                  if (sec) {
                    setEditingSectionId(sectionId);
                    setOriginalSectionBackup(JSON.parse(JSON.stringify(sec.content || {})));
                  }
                }}
                onAddSectionClick={(index) => {
                  setInsertIndex(index);
                  setPickerOpen(true);
                }}
                onDeleteSectionClick={(index) => {
                  const updated = [...pageSections];
                  updated.splice(index, 1);
                  setPageSections(updated);
                  if (editingSectionId === pageSections[index]?.id) {
                    setEditingSectionId(null);
                  }
                }}
                onReorderSections={(newSections) => {
                  setPageSections(newSections);
                }}
              />
            </div>
          </div>
        </div>

        {/* 3. Sliding Section Library Picker Panel Drawer */}
        {pickerOpen && (
          <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex justify-end animate-fade-in" id="section-library-overlay">
            {/* Click outside to close */}
            <div className="flex-1 cursor-pointer" onClick={() => { setPickerOpen(false); setInsertIndex(null); }} />
            
            {/* Drawer */}
            <div className="w-96 bg-stone-900 border-l border-stone-800 h-full flex flex-col shadow-2xl relative animate-slide-left" id="section-library-picker">
              <div className="p-5 border-b border-stone-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-stone-100">Section Library</h3>
                  <p className="text-[10px] text-stone-400 mt-1">
                    {insertIndex !== null ? `INSERTING BELOW SECTION ${insertIndex + 1}` : 'ADD NEW CANVAS SECTION'}
                  </p>
                </div>
                <button 
                  onClick={() => { setPickerOpen(false); setInsertIndex(null); }}
                  className="p-1 text-stone-400 hover:text-stone-100 rounded hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {TEMPLATE_SECTIONS.map((tpl) => (
                  <button
                    key={tpl.type}
                    onClick={() => handleSelectTemplate(tpl.type)}
                    className="w-full text-left bg-stone-850/60 border border-stone-800/80 hover:border-amber-500/60 rounded-xl p-3.5 flex gap-4 hover:bg-stone-800/50 transition-all duration-300 group cursor-pointer"
                  >
                    {/* Visual schematic preview */}
                    {tpl.wireframe}
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-100 group-hover:text-amber-400 transition-colors">
                          {tpl.type}
                        </span>
                        <span className="text-[8px] bg-stone-800 text-stone-400 px-1 py-0.5 rounded font-mono">
                          Layout
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 leading-relaxed font-medium">
                        {tpl.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Floating Settings & Actions Deck (Bottom Left) */}
        <div className="absolute bottom-8 left-8 z-40 flex items-center gap-3 pointer-events-auto" id="editor-left-floating-panel">
          {/* SEO Settings Gear Trigger Button */}
          <button 
            onClick={() => setSeoDrawerOpen(true)}
            className="w-11 h-11 bg-stone-900 border border-stone-800 hover:border-amber-500 text-stone-200 hover:text-amber-400 rounded-full flex items-center justify-center shadow-lg hover:bg-stone-800 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer group"
            title="Page SEO & Social Metadata"
            id="bottom-left-gear-seo-btn"
          >
            <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
          </button>

          {/* Unified Save and Reset/Undo Actions Pill */}
          {hasChanges && (
            <div className="flex items-center bg-stone-900 border border-stone-800 hover:border-stone-700 rounded-full shadow-lg p-1 animate-fade-in">
              <button 
                onClick={triggerSave}
                disabled={saveStatus === 'saving'}
                className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  saveStatus === 'saved' 
                    ? 'bg-emerald-500 text-stone-950 font-bold' 
                    : saveStatus === 'saving'
                      ? 'bg-stone-800 text-amber-500 animate-pulse'
                      : 'text-stone-300 hover:text-emerald-400 hover:bg-stone-800'
                }`}
                title={saveStatus === 'saved' ? 'Saved successfully!' : 'Save Storefront Layout'}
              >
                {saveStatus === 'saved' ? (
                  <Check className="w-5 h-5 stroke-[3]" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <div className="w-px h-5 bg-stone-800 mx-1.5" />
              <button 
                onClick={triggerReset}
                disabled={resetStatus === 'resetting'}
                className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  resetStatus === 'resetting'
                    ? 'bg-amber-600 text-stone-950 animate-spin'
                    : 'text-stone-300 hover:text-amber-400 hover:bg-stone-800'
                }`}
                title={resetStatus === 'resetting' ? 'Resetting template...' : 'Reset draft layout'}
              >
                <RotateCcw className={`w-4 h-4 ${resetStatus === 'resetting' ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}

          {/* Temporary Interactive Tooltips based on state triggers */}
          {saveStatus === 'saved' && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider animate-fade-in flex items-center gap-1.5 shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved successfully!</span>
            </div>
          )}

          {resetStatus === 'done' && (
            <div className="bg-amber-500/15 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider animate-fade-in flex items-center gap-1.5 shadow-md">
              <Info className="w-3.5 h-3.5 animate-pulse" />
              <span>Reset to saved state</span>
            </div>
          )}
        </div>

        {/* Floating Add Section Button (Bottom Right) */}
        <div className="absolute bottom-8 right-8 z-40 animate-bounce hover:animate-none pointer-events-auto" id="editor-right-floating-panel">
          <button 
            onClick={() => { setInsertIndex(null); setPickerOpen(true); }}
            className="w-14 h-14 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer group border border-amber-500/25"
            title="Add Page Section"
          >
            <Plus className="w-7 h-7 stroke-[2.5] group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

      </div>

      {/* Section Content Editor Sidebar Panel */}
      {editingSectionId !== null && (() => {
        const activeSec = pageSections.find(s => s.id === editingSectionId);
        if (!activeSec) return null;
        return (
          <SectionEditorPanel 
            section={activeSec}
            isOpen={editingSectionId !== null}
            onClose={handleSectionContentReset}
            onChange={handleSectionContentChange}
            onSave={() => {
              setEditingSectionId(null);
              setOriginalSectionBackup(null);
            }}
            onReset={handleSectionContentReset}
          />
        );
      })()}

      {/* Per-Page SEO Settings Drawer */}
      <PageSeoDrawer 
        isOpen={seoDrawerOpen}
        onClose={() => setSeoDrawerOpen(false)}
        pageId={activePageId}
        pageName={activePageName}
        initialSeo={pageSeo}
        onSaveSeo={handleSaveSeo}
      />

      {/* Dynamic Header & Navigation Editor Panel */}
      <NavEditorPanel 
        isOpen={navEditorOpen}
        onClose={() => setNavEditorOpen(false)}
        navigationList={navigationList}
        onNavigationListChange={setNavigationList}
        navGlobalTextColor={navGlobalTextColor}
        onNavGlobalTextColorChange={setNavGlobalTextColor}
        navGlobalFontSize={navGlobalFontSize}
        onNavGlobalFontSizeChange={setNavGlobalFontSize}
        navGlobalFontWeight={navGlobalFontWeight}
        onNavGlobalFontWeightChange={setNavGlobalFontWeight}
        availablePages={availablePages}
      />

    </div>
  );
}
