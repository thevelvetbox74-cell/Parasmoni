/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Pages Management & Multi-Page Controller Module
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Settings, 
  Trash2, 
  Edit,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Lock,
  Globe,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Check
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db, isFirebaseConfigured } from '../firebase/config';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { PageSeoDrawer, PageSeoObject } from '../components/PageSeoDrawer';
import { DEFAULT_PAGE_SECTIONS } from '../pages/Home';

export interface PageDocument {
  id: string;
  name: string;
  title?: string;
  slug: string;
  status: 'published' | 'draft';
  sections?: any[];
  seo?: PageSeoObject;
  updatedAt?: string;
  author?: string;
}

const DEFAULT_PAGES_SEED: PageDocument[] = [
  {
    id: 'home',
    name: 'Home Page',
    title: 'Home Page',
    slug: 'home',
    status: 'published',
    sections: DEFAULT_PAGE_SECTIONS,
    seo: {
      title: 'Parasmoni Jewellers & Brothers | Premium Gold Jewellery Showroom Since 1974',
      slug: 'home',
      description: 'Parasmoni Jewellers & Brothers – a trusted West Bengal gold jewellery showroom established in 1974. Discover handcrafted gold jewellery, bridal collections, and traditional Bengali designs crafted with authenticity and heritage craftsmanship.',
      ogImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200'
    },
    updatedAt: new Date().toISOString(),
    author: 'Super Admin'
  },
  {
    id: 'bridal-collection',
    name: 'Royal Bridal Heritage Collection',
    title: 'Royal Bridal Heritage Collection',
    slug: 'bridal-collection',
    status: 'published',
    sections: [
      {
        id: 'sec-hero-bridal',
        type: 'Hero Banner',
        content: {
          subtitle: 'ROYAL HERITAGE 22K',
          title: 'A Legacy of Bengali Bridal Majesty',
          description: 'Handcrafted wedding chokers, uncut Polki neckpieces, and ornate Nakashi bangles forged with generational gold mastery.',
          primaryButton: { label: 'Explore Bridal Sets', linkUrl: '/catalog', styleType: 'filled' },
          secondaryButton: { label: 'Book Private Appointment', linkUrl: '/contact', styleType: 'outlined' },
          mediaUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200'
        }
      },
      {
        id: 'sec-carousel-bridal',
        type: 'Product Carousel',
        content: { title: 'Signature Bridal Ornaments', productsType: 'featured' }
      },
      {
        id: 'sec-story-bridal',
        type: 'About Collection',
        content: {
          subtitle: 'BOWBAZAR TRADITION',
          title: 'Pure 916 Hallmarked Bengali Jewellery',
          description: 'Every bride deserves generational heirloom jewelry crafted to endure for decades to come.'
        }
      }
    ],
    seo: {
      title: 'Royal Bridal Heritage Jewellery Collection | Parasmoni Jewellers & Brothers',
      slug: 'bridal-collection',
      description: 'Explore the royal wedding bridal jewelry collection in 22K pure hallmarked gold and uncut Polki diamonds at Parasmoni Jewellers & Brothers.',
      ogImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200'
    },
    updatedAt: new Date().toISOString(),
    author: 'Super Admin'
  },
  {
    id: 'about-us',
    name: 'Legacy & Craftsmanship (About Us)',
    title: 'Legacy & Craftsmanship',
    slug: 'about-us',
    status: 'published',
    sections: [
      {
        id: 'sec-split-about',
        type: 'Split Media Banner',
        content: {
          subtitle: 'HERITAGE SINCE 1974',
          title: 'Over 50 Years of Craftsmanship and Trust',
          description: 'Parasmoni Jewellers was founded on a simple principle: uncompromising purity and reverence for Kolkata goldsmithing heritage.',
          primaryButton: { label: 'View Stores', linkUrl: '/stores', styleType: 'filled' },
          secondaryButton: { label: 'Our Catalog', linkUrl: '/catalog', styleType: 'outlined' },
          mediaUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=1200'
        }
      },
      {
        id: 'sec-boutiques-about',
        type: 'Our Boutiques',
        content: {}
      }
    ],
    seo: {
      title: 'Legacy & Craftsmanship Since 1974 | Parasmoni Jewellers & Brothers',
      slug: 'about-us',
      description: 'Learn about our 50-year heritage of Kolkata goldsmith craftsmanship, hallmarked purity, and bespoke bridal service.',
      ogImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200'
    },
    updatedAt: new Date().toISOString(),
    author: 'Super Admin'
  }
];

export function AdminPages(): React.JSX.Element {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [pages, setPages] = useState<PageDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // New Page Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageStatus, setNewPageStatus] = useState<'published' | 'draft'>('published');
  const [newPageTemplate, setNewPageTemplate] = useState<'empty' | 'showcase' | 'editorial' | 'paragraph' | 'article'>('showcase');
  const [creating, setCreating] = useState(false);

  // SEO Drawer State
  const [selectedSeoPage, setSelectedSeoPage] = useState<PageDocument | null>(null);

  // Delete confirmation state
  const [pageToDelete, setPageToDelete] = useState<PageDocument | null>(null);

  // Load pages from Firestore or cache
  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      const cached = localStorage.getItem('draft_custom_pages');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPages(parsed);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Failed to parse cached pages:', e);
        }
      }

      setPages(DEFAULT_PAGES_SEED);
      localStorage.setItem('draft_custom_pages', JSON.stringify(DEFAULT_PAGES_SEED));
      setLoading(false);
      return;
    }

    const pagesCol = collection(db, 'pageSections');
    const unsubscribe = onSnapshot(pagesCol, (snapshot) => {
      if (snapshot.empty) {
        // Seed default initial pages into database
        console.log('Seeding initial pages into Firestore pageSections...');
        DEFAULT_PAGES_SEED.forEach(async (p) => {
          try {
            await setDoc(doc(db, 'pageSections', p.id), p);
          } catch (e) {
            console.error('Error seeding page:', p.id, e);
          }
        });
        setPages(DEFAULT_PAGES_SEED);
      } else {
        const loaded: PageDocument[] = [];
        let hasHome = false;
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (docSnap.id === 'home') hasHome = true;
          loaded.push({
            id: docSnap.id,
            name: d.name || d.title || (docSnap.id === 'home' ? 'Home Page' : docSnap.id),
            title: d.title || d.name,
            slug: d.slug || (docSnap.id === 'home' ? 'home' : docSnap.id),
            status: d.status || 'published',
            sections: d.sections || [],
            seo: d.seo || {},
            updatedAt: d.updatedAt || new Date().toISOString(),
            author: d.author || 'Super Admin'
          });
        });

        // Ensure home is always in list
        if (!hasHome) {
          loaded.unshift(DEFAULT_PAGES_SEED[0]);
        }

        // Sort so Home is always first, then by updatedAt descending
        loaded.sort((a, b) => {
          if (a.id === 'home') return -1;
          if (b.id === 'home') return 1;
          return (b.updatedAt || '').localeCompare(a.updatedAt || '');
        });

        setPages(loaded);
      }
      setLoading(false);
    }, (err) => {
      console.error('Error loading pages from Firestore:', err);
      setPages(DEFAULT_PAGES_SEED);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle page name change in modal and auto-suggest slug
  const handlePageNameChange = (name: string) => {
    setNewPageName(name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    setNewPageSlug(slug);
  };

  // Create new page in Firestore and navigate directly to visual builder
  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageName.trim() || !newPageSlug.trim()) return;

    setCreating(true);

    const safeSlug = newPageSlug.toLowerCase().replace(/[^a-z0-9-]/g, '').trim() || `page-${Date.now()}`;
    const pageId = safeSlug;

    // Build initial sections based on selected template
    let initialSections: any[] = [];
    if (newPageTemplate === 'showcase') {
      initialSections = [
        {
          id: `sec-hero-${pageId}`,
          type: 'Hero Banner',
          content: {
            subtitle: 'NEW EXCLUSIVE CURATION',
            title: newPageName,
            description: `Discover handcrafted bridal and royal jewellery designs in our exclusive ${newPageName} collection.`,
            primaryButton: { label: 'Explore Catalog', linkUrl: '/catalog', styleType: 'filled' },
            secondaryButton: { label: 'Inquire on WhatsApp', linkUrl: '/contact', styleType: 'outlined' }
          }
        },
        {
          id: `sec-products-${pageId}`,
          type: 'Product Carousel',
          content: { title: 'Featured Creations', productsType: 'featured' }
        },
        {
          id: `sec-boutiques-${pageId}`,
          type: 'Our Boutiques',
          content: {}
        }
      ];
    } else if (newPageTemplate === 'editorial') {
      initialSections = [
        {
          id: `sec-split-${pageId}`,
          type: 'Split Media Banner',
          content: {
            subtitle: 'TIMELESS HERITAGE',
            title: newPageName,
            description: 'Goldsmithing legacy crafted with pure 22K gold, uncut Polki, and certified solitaires.',
            primaryButton: { label: 'View Stores', linkUrl: '/stores', styleType: 'filled' },
            secondaryButton: { label: 'Our Story', linkUrl: '/catalog', styleType: 'outlined' }
          }
        },
        {
          id: `sec-story-${pageId}`,
          type: 'About Collection',
          content: {
            subtitle: 'KOLKATA GOLDSMITHS',
            title: 'Master Bengali Craftsmanship',
            description: 'Preserving decades of royal jewelry heritage.'
          }
        }
      ];
    } else if (newPageTemplate === 'paragraph') {
      initialSections = [
        {
          id: `sec-hero-doc-${pageId}`,
          type: 'Hero Banner',
          content: {
            subtitle: 'PARASMONI SHOWROOM • OFFICIAL DOCUMENT',
            title: newPageName,
            description: `Official guidelines, policy framework, and transparency documentation for ${newPageName}.`,
            primaryButton: { label: 'Contact Showroom', linkUrl: '/contact', styleType: 'filled' },
            secondaryButton: { label: 'Explore Collections', linkUrl: '/catalog', styleType: 'outlined' }
          }
        },
        {
          id: `sec-doc-${pageId}`,
          type: 'Paragraph Document',
          content: {
            title: newPageName,
            subtitle: 'PARASMONI JEWELLERS & BROTHERS • LEGAL & INFORMATION DOCUMENTATION',
            lastUpdated: 'Updated September 2026',
            sections: [
              {
                heading: '1. Overview & Heritage Commitment',
                paragraphs: [
                  `Parasmoni Jewellers & Brothers ("we", "our", or "us") is dedicated to establishing absolute trust, transparency, and uncompromising hallmark purity across all our jewelry creations.`,
                  `This ${newPageName} outlines our operational principles, customer protections, and commitment to master Bengali goldsmithing standards established in 1974.`
                ],
                bulletPoints: [
                  '100% BIS Hallmarked 22K (916) and 18K gold with unique HUID laser code',
                  'Itemized digital valuation certificates for gold weight, gemstone carat, and making charges',
                  'Direct showroom support across Bowbazar and regional heritage boutiques'
                ]
              },
              {
                heading: '2. Customer Assurance & Security Standards',
                paragraphs: [
                  'Every ornament delivered or collected from our boutiques undergoes strict ultrasonic inspection, caratometer purity testing, and certified security sealing.',
                  'We maintain full confidentiality for all custom bridal consultations, private viewing appointments, and bespoke ornament blueprints.'
                ],
                bulletPoints: [
                  'Secure doorstep delivery with insured courier transit for online showroom reservations',
                  'Complimentary lifetime ultrasonic cleaning and prongs inspection at all Parasmoni boutiques'
                ]
              }
            ],
            contactNotice: 'For questions regarding this document or custom order verification, please reach out to our Customer Relations team at support@parasmoni.in or visit our Bowbazar main showroom.'
          }
        }
      ];
    } else if (newPageTemplate === 'article') {
      initialSections = [
        {
          id: `sec-article-${pageId}`,
          type: 'Blog Article',
          content: {
            title: newPageName,
            subtitle: 'PARASMONI HERITAGE JOURNAL • GOLDSMITHING CHRONICLES',
            authorName: 'Parasmoni Master Craftsman',
            authorRole: 'Chief Artisan & Goldsmith',
            authorAvatar: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=200',
            publishDate: 'September 2026',
            readTime: '5 min read',
            coverImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200',
            excerpt: `An in-depth exploration into the art, symbolism, and timeless craftsmanship behind ${newPageName}.`,
            blocks: [
              {
                type: 'paragraph',
                heading: 'Generational Artistry in Every Curve',
                text: 'Centuries of royal Bengali heritage live on in Kolkata’s historic Bowbazar lanes. Handcrafting fine gold jewelry is not merely a manufacturing process—it is an act of devotion where master goldsmiths shape pure 22K gold sheets into sacred motifs using hand chisels and traditional lac moulding.'
              },
              {
                type: 'quote',
                text: 'True luxury lies in the unseen details—the delicate engraving on the back of a pendant, the rhythm of hand-hammered beads, and the warmth of genuine 22K hallmarked gold.'
              },
              {
                type: 'image_paragraph',
                heading: 'The Sacred Precision of Nakashi & Filigree',
                imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=1200',
                caption: 'A Parasmoni master goldsmith meticulously hand-engraving a bridal Nakashi choker.',
                text: 'Each ornament requires upwards of 40 to 60 hours of focused labor. From selecting certified solitaires and uncut Polki diamonds to executing microscopic wirework, our artisans blend ancestral techniques with modern HUID purity standards.'
              }
            ]
          }
        },
        {
          id: `sec-carousel-art-${pageId}`,
          type: 'Product Carousel',
          content: { title: 'Featured Heirloom Creations', productsType: 'featured' }
        }
      ];
    }

    const newPageObj: PageDocument = {
      id: pageId,
      name: newPageName.trim(),
      title: newPageName.trim(),
      slug: safeSlug,
      status: newPageStatus,
      sections: initialSections,
      seo: {
        title: `${newPageName.trim()} | Parasmoni Jewellers & Brothers`,
        slug: safeSlug,
        description: `Explore exclusive ${newPageName.trim()} jewellery designs at Parasmoni Jewellers & Brothers. Handcrafted in pure 22K hallmarked gold.`,
        ogImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200'
      },
      updatedAt: new Date().toISOString(),
      author: 'Super Admin'
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'pageSections', pageId), newPageObj);
      } catch (err) {
        console.error('Error creating page in Firestore:', err);
      }
    }

    // Update local cache
    const updatedPages = [...pages.filter(p => p.id !== pageId), newPageObj];
    setPages(updatedPages);
    localStorage.setItem('draft_custom_pages', JSON.stringify(updatedPages));
    localStorage.setItem(`draft_page_sections_${pageId}`, JSON.stringify(newPageObj));

    setCreating(false);
    setIsAddModalOpen(false);
    setNewPageName('');
    setNewPageSlug('');

    // Open immediately in Storefront visual builder scoped to this page!
    navigate(`/admin/storefront?pageId=${pageId}`);
  };

  // Toggle published/draft status
  const handleToggleStatus = async (page: PageDocument) => {
    const nextStatus = page.status === 'published' ? 'draft' : 'published';
    const updated = { ...page, status: nextStatus, updatedAt: new Date().toISOString() };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'pageSections', page.id), { status: nextStatus, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.error('Error toggling status in Firestore:', err);
      }
    }

    const updatedList = pages.map(p => p.id === page.id ? updated : p);
    setPages(updatedList);
    localStorage.setItem('draft_custom_pages', JSON.stringify(updatedList));
  };

  // Delete page
  const handleDeleteConfirm = async () => {
    if (!pageToDelete || pageToDelete.id === 'home' || pageToDelete.slug === 'home') {
      setPageToDelete(null);
      return;
    }

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'pageSections', pageToDelete.id));
      } catch (err) {
        console.error('Error deleting page from Firestore:', err);
      }
    }

    const updatedList = pages.filter(p => p.id !== pageToDelete.id);
    setPages(updatedList);
    localStorage.setItem('draft_custom_pages', JSON.stringify(updatedList));
    localStorage.removeItem(`draft_page_sections_${pageToDelete.id}`);
    setPageToDelete(null);
  };

  // Save SEO from Drawer
  const handleSaveSeoFromDrawer = async (updatedSeo: PageSeoObject) => {
    if (!selectedSeoPage) return;

    const pageId = selectedSeoPage.id;
    const isHome = pageId === 'home' || selectedSeoPage.slug === 'home';
    const finalSlug = isHome ? 'home' : (updatedSeo.slug || selectedSeoPage.slug);

    const updatedPage: PageDocument = {
      ...selectedSeoPage,
      slug: finalSlug,
      seo: updatedSeo,
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'pageSections', pageId), {
          slug: finalSlug,
          seo: updatedSeo,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error('Error saving SEO to Firestore:', err);
      }
    }

    const updatedList = pages.map(p => p.id === pageId ? updatedPage : p);
    setPages(updatedList);
    localStorage.setItem('draft_custom_pages', JSON.stringify(updatedList));
    localStorage.setItem(`draft_page_sections_${pageId}`, JSON.stringify(updatedPage));
  };

  const filteredPages = pages.filter(p => 
    (p.name || p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.slug || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" id="admin-pages-manager">
      {/* 1. Statistics Header Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" id="pages-stats-grid">
        <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl shadow-xs">
          <span className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider">Total Storefront Pages</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-stone-100">{pages.length}</span>
            <span className="text-xs text-stone-400">custom layouts</span>
          </div>
        </div>
        <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl shadow-xs">
          <span className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider">Published Live</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-500">{pages.filter(p => p.status === 'published').length}</span>
            <span className="text-xs text-stone-400">active online</span>
          </div>
        </div>
        <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl shadow-xs">
          <span className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider">Pending Drafts</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-500">{pages.filter(p => p.status === 'draft').length}</span>
            <span className="text-xs text-stone-500">in builder sandbox</span>
          </div>
        </div>
        <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl shadow-xs">
          <span className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider">SEO Cards Configured</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-400">
              {pages.filter(p => p.seo?.title && p.seo?.description).length} / {pages.length}
            </span>
            <span className="text-xs text-stone-400">with Google snippets</span>
          </div>
        </div>
      </div>

      {/* 2. Page List Actions Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-stone-900 p-4 border border-stone-800 rounded-xl">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 w-4 h-4" />
          <input 
            type="text"
            placeholder="Search pages by name, slug, or id..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-all font-mono"
          />
        </div>

        {/* Create Page Button */}
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-all shadow-md active:scale-95 shrink-0"
          id="btn-add-new-page"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Page</span>
        </button>
      </div>

      {/* 3. Pages Listing Table */}
      <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-900/70 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                <th className="p-4 pl-6">Page Name & Identifier</th>
                <th className="p-4">Route Path</th>
                <th className="p-4">Sections</th>
                <th className="p-4">SEO Snippet Status</th>
                <th className="p-4">Visibility</th>
                <th className="p-4 text-right pr-6">Visual Builder & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 text-xs text-stone-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-stone-500">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Synchronizing showroom pages...</span>
                  </td>
                </tr>
              ) : filteredPages.length > 0 ? (
                filteredPages.map((page) => {
                  const isHome = page.id === 'home' || page.slug === 'home';
                  const publicUrl = isHome ? '/' : `/pages/${page.slug || page.id}`;
                  const hasSeo = Boolean(page.seo?.title && page.seo?.description);
                  const sectionCount = page.sections?.length || 0;

                  return (
                    <tr key={page.id} className="hover:bg-stone-900/30 transition-colors group">
                      {/* Title & info */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 ${
                            isHome 
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                              : 'bg-stone-900 border-stone-800 text-stone-400'
                          }`}>
                            {isHome ? <Sparkles className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-100 text-sm">
                                {page.name || page.title}
                              </span>
                              {isHome && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold uppercase">
                                  <Lock className="w-2.5 h-2.5" />
                                  Core Root
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-stone-500 font-mono block mt-0.5">
                              ID: {page.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Route Path */}
                      <td className="p-4">
                        <a 
                          href={publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-mono bg-stone-900 hover:bg-stone-850 px-2.5 py-1 rounded text-stone-300 hover:text-amber-400 border border-stone-800 text-[11px] transition-colors group/link"
                        >
                          <span>{publicUrl}</span>
                          <ExternalLink className="w-3 h-3 text-stone-500 group-hover/link:text-amber-400" />
                        </a>
                      </td>

                      {/* Sections Count */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-900 border border-stone-800 text-stone-300 font-mono text-[11px]">
                          <Layers className="w-3 h-3 text-stone-500" />
                          <span>{sectionCount} {sectionCount === 1 ? 'Section' : 'Sections'}</span>
                        </span>
                      </td>

                      {/* SEO Snippet */}
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedSeoPage(page)}
                          className="text-left group/seo cursor-pointer"
                        >
                          {hasSeo ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 group-hover/seo:underline">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>Configured</span>
                              </span>
                              <span className="block text-[10px] text-stone-500 line-clamp-1 max-w-[200px]">
                                {page.seo?.title}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded group-hover/seo:bg-amber-500/20 transition-colors">
                              <Globe className="w-3 h-3" />
                              <span>Edit Google SEO</span>
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Visibility Toggle */}
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleStatus(page)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            page.status === 'published'
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                              : 'bg-stone-800 border border-stone-700 text-stone-400 hover:bg-stone-750'
                          }`}
                          title="Click to toggle Published / Draft state"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${page.status === 'published' ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`} />
                          <span>{page.status === 'published' ? 'Published' : 'Draft'}</span>
                        </button>
                      </td>

                      {/* Operations Actions */}
                      <td className="p-4 text-right pr-6 space-x-1.5">
                        {/* 1. Open Storefront visual builder scoped to this specific page */}
                        <Link 
                          to={`/admin/storefront?pageId=${page.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
                          title="Open Storefront Visual Editor"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit Layout</span>
                        </Link>

                        {/* 2. SEO drawer button */}
                        <button 
                          onClick={() => setSelectedSeoPage(page)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-amber-400 bg-stone-900 border border-stone-800 transition-colors cursor-pointer"
                          title="Configure Page SEO & Social Card"
                        >
                          <Globe className="w-4 h-4" />
                        </button>

                        {/* 3. View Live link */}
                        <a 
                          href={publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 bg-stone-900 border border-stone-800 transition-colors"
                          title="View Live Web Page"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </a>

                        {/* 4. Delete button (Protected for home) */}
                        {isHome ? (
                          <button
                            disabled
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-stone-700 bg-stone-900 border border-stone-800/40 cursor-not-allowed opacity-40"
                            title="Home page cannot be deleted (required core root)"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => setPageToDelete(page)}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-red-950 hover:text-red-400 text-stone-500 bg-stone-900 border border-stone-800 hover:border-red-900 transition-colors cursor-pointer"
                            title="Delete custom page"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-500">
                    No custom pages matched your query. Click "Add New Page" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Add New Page Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-xs p-4 animate-fade-in" id="add-page-modal-overlay">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-up" id="add-page-modal">
            {/* Header */}
            <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-100">Create New Showroom Page</h3>
                  <p className="text-[10px] text-stone-400">Launches into the Visual Storefront Builder</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreatePage} className="p-6 space-y-5">
              {/* Page Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-200 block">
                  Page Name / Title *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Royal Bridal Showcase, Solitaire Guide..."
                  value={newPageName}
                  onChange={(e) => handlePageNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* URL Slug */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-200 block">
                  URL Route Path *
                </label>
                <div className="flex rounded-lg overflow-hidden border border-stone-800 bg-stone-950 focus-within:border-amber-500 transition-colors">
                  <span className="px-3 py-2.5 bg-stone-900 text-stone-500 text-xs font-mono select-none border-r border-stone-800">
                    parasmoni.in/pages/
                  </span>
                  <input 
                    type="text"
                    required
                    placeholder="bridal-showcase"
                    value={newPageSlug}
                    onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full px-3 py-2.5 bg-transparent text-xs text-stone-100 font-mono placeholder-stone-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Initial Starter Template */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-200 block">
                  Initial Section Template
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNewPageTemplate('showcase')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      newPageTemplate === 'showcase'
                        ? 'bg-amber-500/10 border-amber-500 text-stone-100 shadow-sm'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <span className="block text-xs font-bold text-stone-200 mb-1">Showcase</span>
                    <span className="block text-[10px] text-stone-400 leading-tight">Hero Banner + Carousel + Boutiques</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewPageTemplate('editorial')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      newPageTemplate === 'editorial'
                        ? 'bg-amber-500/10 border-amber-500 text-stone-100 shadow-sm'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <span className="block text-xs font-bold text-stone-200 mb-1">Editorial</span>
                    <span className="block text-[10px] text-stone-400 leading-tight">Split Media + Heritage Story</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewPageTemplate('paragraph')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      newPageTemplate === 'paragraph'
                        ? 'bg-amber-500/10 border-amber-500 text-stone-100 shadow-sm'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <span className="block text-xs font-bold text-stone-200 mb-1">Paragraph Document</span>
                    <span className="block text-[10px] text-stone-400 leading-tight">About Us / Privacy Policy Formatted Text</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewPageTemplate('article')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      newPageTemplate === 'article'
                        ? 'bg-amber-500/10 border-amber-500 text-stone-100 shadow-sm'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <span className="block text-xs font-bold text-stone-200 mb-1">Blog Article</span>
                    <span className="block text-[10px] text-stone-400 leading-tight">Image + Article Story + Quotes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewPageTemplate('empty')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      newPageTemplate === 'empty'
                        ? 'bg-amber-500/10 border-amber-500 text-stone-100 shadow-sm'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <span className="block text-xs font-bold text-stone-200 mb-1">Blank Slate</span>
                    <span className="block text-[10px] text-stone-400 leading-tight">Empty canvas to pick sections</span>
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-200 block">
                  Initial Visibility
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status" 
                      checked={newPageStatus === 'published'} 
                      onChange={() => setNewPageStatus('published')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>Published (Immediate Public Access)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status" 
                      checked={newPageStatus === 'draft'} 
                      onChange={() => setNewPageStatus('draft')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>Draft (Admin Builder Sandbox)</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newPageName.trim() || !newPageSlug.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{creating ? 'Creating...' : 'Create & Open Builder'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {pageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-stone-100 text-sm">Delete Custom Page?</h3>
                <p className="text-[11px] text-stone-400">This action cannot be reversed.</p>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed font-sans bg-stone-950 p-3 rounded-lg border border-stone-800">
              Are you sure you want to permanently delete <strong className="text-stone-100">{pageToDelete.name}</strong> (<span className="font-mono text-amber-400">/pages/{pageToDelete.slug}</span>)? All custom sections and SEO data will be removed.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setPageToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-md"
              >
                Delete Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Per-Page SEO Settings Drawer */}
      {selectedSeoPage && (
        <PageSeoDrawer 
          isOpen={Boolean(selectedSeoPage)}
          onClose={() => setSelectedSeoPage(null)}
          pageId={selectedSeoPage.id}
          pageName={selectedSeoPage.name}
          initialSeo={selectedSeoPage.seo}
          onSaveSeo={handleSaveSeoFromDrawer}
        />
      )}
    </div>
  );
}
