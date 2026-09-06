/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  RotateCcw, 
  Type, 
  Link2, 
  Image as ImageIcon, 
  Layout, 
  Sliders, 
  Palette, 
  List, 
  Check, 
  Search,
  Eye,
  ListPlus,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  MessageSquare,
  MapPin,
  FileText
} from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { UniversalStyleControl } from './UniversalStyleControl';
import { IMAGEKIT_FOLDERS } from '../imagekit/client';
import { SmartLinkPicker } from './SmartLinkPicker';
import { mockProducts, mockCollections, mockStores, mockBanners } from '../data/mockData';
import { db } from '../firebase/config';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

interface SectionEditorPanelProps {
  section: {
    id: string;
    type: string;
    content: any;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onChange: (updatedContent: any) => void;
  onSave: () => void;
  onReset: () => void;
}

interface LinkToControlProps {
  label: string;
  value: string;
  onChange: (newUrl: string) => void;
  categories: any[];
  collections: any[];
}

function LinkToControl({ label, value, onChange }: LinkToControlProps) {
  return (
    <div className="space-y-1.5 p-3 bg-stone-950/40 rounded-xl border border-stone-800/40">
      <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide block">{label}</label>
      <SmartLinkPicker
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export function SectionEditorPanel({
  section,
  isOpen,
  onClose,
  onChange,
  onSave,
  onReset
}: SectionEditorPanelProps): React.JSX.Element | null {
  if (!section || !isOpen) return null;

  const { type, content } = section;

  // Local state for searchable items
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbCollections, setDbCollections] = useState<any[]>([]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbStores, setDbStores] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'style'>('content');

  const [dbBanners, setDbBanners] = useState<any[]>([]);
  const [editingSlideIndex, setEditingSlideIndex] = useState<number | null>(null);

  // States for dynamic product picker modal
  const [isBrowseModalOpen, setIsBrowseModalOpen] = useState(false);
  const [browseSearchQuery, setBrowseSearchQuery] = useState('');
  const [browseSelectedCategory, setBrowseSelectedCategory] = useState('all');
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);

  const openBrowseModal = () => {
    const currentIds = Array.isArray(content?.selectedIds) ? content.selectedIds : [];
    setTempSelectedIds(currentIds);
    setBrowseSearchQuery('');
    setBrowseSelectedCategory('all');
    setIsBrowseModalOpen(true);
  };

  const toggleTempSelectedId = (id: string) => {
    setTempSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const saveBrowseSelection = () => {
    updateProp('selectedIds', tempSelectedIds);
    if (content.productsType !== 'custom') {
      updateProp('productsType', 'custom');
    }
    setIsBrowseModalOpen(false);
  };

  // Load actual dynamic data from database
  useEffect(() => {
    async function loadDbData() {
      if (!db) return;
      try {
        const catSnap = await getDocs(collection(db, 'categories'));
        const cats = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDbCategories(cats);

        const colSnap = await getDocs(collection(db, 'collections'));
        const cols = colSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDbCollections(cols);

        const prodSnap = await getDocs(collection(db, 'products'));
        const prods = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDbProducts(prods);

        const storeSnap = await getDocs(collection(db, 'stores'));
        const strs = storeSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDbStores(strs);

        const bannersSnap = await getDocs(collection(db, 'banners'));
        const bans = bannersSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title || '',
            subtitle: data.subtitle || '',
            desktopImage: data.desktopImage || data.imageUrl || data.image || '',
            mobileImage: data.mobileImage || data.desktopImage || data.imageUrl || data.image || '',
            mediaType: data.mediaType || 'image',
            desktopVideo: data.desktopVideo || '',
            mobileVideo: data.mobileVideo || '',
            buttonText: data.buttonText || 'EXPLORE MASTERPIECES',
            buttonLink: data.buttonLink || data.linkUrl || '/catalog',
            displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 1,
            status: data.status || 'active',
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            titleColor: data.titleColor || '#ffffff',
            titleFont: data.titleFont || 'serif',
            subtitleColor: data.subtitleColor || '#f5f5f4',
            subtitleFont: data.subtitleFont || 'sans',
            buttonColor: data.buttonColor || '#ffffff',
            buttonTextColor: data.buttonTextColor || '#991b1b'
          };
        });
        bans.sort((a, b) => a.displayOrder - b.displayOrder);
        setDbBanners(bans);
      } catch (err) {
        console.error('Error loading dynamic editor lists:', err);
      }
    }
    loadDbData();
  }, []);

  const mockBannersList = mockBanners.map((b, idx) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle || '',
    desktopImage: b.image,
    mobileImage: b.image,
    mediaType: 'image' as const,
    desktopVideo: '',
    mobileVideo: '',
    buttonText: b.buttonText || 'EXPLORE MASTERPIECES',
    buttonLink: b.buttonLink || '/catalog',
    displayOrder: idx + 1,
    status: 'active',
    startDate: '',
    endDate: '',
    titleColor: '#ffffff',
    titleFont: 'serif',
    subtitleColor: '#f5f5f4',
    subtitleFont: 'sans',
    buttonColor: '#ffffff',
    buttonTextColor: '#991b1b'
  }));

  // Initialize banners in content if not present
  useEffect(() => {
    if (type === 'Hero Banner' && !content?.banners) {
      const initialBanners = dbBanners.length > 0 ? dbBanners : mockBannersList;
      updateProp('banners', initialBanners);
    }
  }, [type, dbBanners, content]);

  // Fallbacks to mock lists if DB is empty/fails
  const categoriesList = dbCategories.length > 0 ? dbCategories : [
    { id: 'cat-necklaces', name: 'Necklaces' },
    { id: 'cat-earrings', name: 'Earrings' },
    { id: 'cat-rings', name: 'Rings' },
    { id: 'cat-bangles', name: 'Bangles' },
    { id: 'cat-bracelets', name: 'Bracelets' },
    { id: 'cat-mangalsutra', name: 'Mangalsutra' },
  ];

  const collectionsList = dbCollections.length > 0 ? dbCollections : mockCollections;
  const productsList = dbProducts.length > 0 ? dbProducts : mockProducts;
  const storesList = dbStores.length > 0 ? dbStores : mockStores;

  // Helper to update a single property in the content object
  const updateProp = (key: string, value: any) => {
    onChange({
      ...content,
      [key]: value
    });
  };

  // Helper to update nested properties safely (like buttons or text styles)
  const updateNestedProp = (parentKey: string, key: string, value: any) => {
    onChange({
      ...content,
      [parentKey]: {
        ...(content[parentKey] || {}),
        [key]: value
      }
    });
  };

  // Helper to toggle multi-select item ID list
  const toggleSelectedId = (key: string, id: string) => {
    const currentList = Array.isArray(content[key]) ? content[key] : [];
    if (currentList.includes(id)) {
      updateProp(key, currentList.filter((item: string) => item !== id));
    } else {
      updateProp(key, [...currentList, id]);
    }
  };

  // Checks if a section type includes text copy
  const isTextBannerLayout = [
    'Split Media Banner',
    'About Collection',
    'Story Collage',
    'Shop The Look',
    'Product Carousel'
  ].includes(type);

  return (
    <div className="absolute inset-y-0 right-0 w-[450px] bg-stone-900 border-l border-stone-800 flex flex-col shadow-2xl z-50 animate-slide-left text-stone-200 font-sans" id="section-content-editor-sidebar">
      {/* Drawer Header */}
      <div className="p-5 border-b border-stone-850 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Edit Section Content</span>
          </h3>
          <p className="text-[10px] text-amber-500 font-bold tracking-wider uppercase mt-1">
            {type}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 text-stone-400 hover:text-stone-100 rounded hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-850 bg-stone-900 shrink-0">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-3 text-center text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'content' 
              ? 'border-amber-500 text-stone-100 bg-stone-850/30' 
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          Content & Media
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 py-3 text-center text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'style' 
              ? 'border-amber-500 text-stone-100 bg-stone-850/30' 
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          Layout & Styling
        </button>
      </div>

      {/* Scrollable Fields Workspace */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {activeTab === 'content' ? (
          <>
            {/* 1. TEXT COPY FIELDS (If layout supports text) */}
            {isTextBannerLayout && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-800/40">
                  <Type className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Copywriting</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Subtitle / Eyebrow Tag</label>
                  <input
                    type="text"
                    value={content.subtitle || ''}
                    onChange={(e) => updateProp('subtitle', e.target.value)}
                    placeholder="e.g. SINCE 1974 or EXCLUSIVE DESIGN"
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs focus:border-amber-500/50 outline-none text-stone-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Title / Heading</label>
                  <input
                    type="text"
                    value={content.title || ''}
                    onChange={(e) => updateProp('title', e.target.value)}
                    placeholder="Title..."
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs focus:border-amber-500/50 outline-none text-stone-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Description / Body text</label>
                  <textarea
                    rows={4}
                    value={content.description || ''}
                    onChange={(e) => updateProp('description', e.target.value)}
                    placeholder="Description..."
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs focus:border-amber-500/50 outline-none text-stone-100 resize-none leading-relaxed"
                  />
                </div>

                {(type === 'About Collection' || type === 'Story Collage') && (
                  <>
                    <div className="space-y-1.5 pt-2">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Narrative Quote Paragraph (Italic)</label>
                      <textarea
                        rows={3}
                        value={content.quoteText || ''}
                        onChange={(e) => updateProp('quoteText', e.target.value)}
                        placeholder="Italic quote text..."
                        className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs focus:border-amber-500/50 outline-none text-stone-100 resize-none leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Eyebrow Badge Icon</label>
                        <select
                          value={content.subtitleStyle?.icon || 'History'}
                          onChange={(e) => updateNestedProp('subtitleStyle', 'icon', e.target.value)}
                          className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100 cursor-pointer"
                        >
                          <option value="History">History (Clockwise arrow)</option>
                          <option value="Sparkles">Sparkles</option>
                          <option value="Gem">Jewellery Gem</option>
                          <option value="Crown">Imperial Crown</option>
                          <option value="Award">Award Badge</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Badge Bg Color</label>
                        <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1.5">
                          <input
                            type="color"
                            value={content.subtitleStyle?.bgColor || '#1c1917'}
                            onChange={(e) => updateNestedProp('subtitleStyle', 'bgColor', e.target.value)}
                            className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                          />
                          <span className="text-[10px] font-mono text-stone-300 uppercase truncate">{content.subtitleStyle?.bgColor || '#1C1917'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-stone-800/40">
                      <div className="flex items-center gap-2">
                        <ListPlus className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Dynamic Bullet Points</span>
                      </div>
                      <p className="text-[9px] text-stone-500">Add highlighting bullet points (e.g., certification, delivery, craftsmanship guarantees):</p>
                      
                      <div className="space-y-2">
                        {(content.bullets || []).map((bullet: any, idx: number) => (
                          <div key={bullet.id || idx} className="flex gap-2 items-center bg-stone-950 p-2 rounded border border-stone-850">
                            <input
                              type="text"
                              value={bullet.text || ''}
                              onChange={(e) => {
                                const list = [...(content.bullets || [])];
                                list[idx] = { ...list[idx], text: e.target.value };
                                updateProp('bullets', list);
                              }}
                              placeholder="e.g. 100% BIS Hallmarked Pure Gold"
                              className="flex-1 bg-stone-900 border border-stone-800 rounded px-2 py-1 text-xs text-stone-200 focus:border-amber-500/50 outline-none"
                            />
                            <div className="flex gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  if (idx > 0) {
                                    const list = [...(content.bullets || [])];
                                    const temp = list[idx];
                                    list[idx] = list[idx - 1];
                                    list[idx - 1] = temp;
                                    updateProp('bullets', list);
                                  }
                                }}
                                disabled={idx === 0}
                                className="p-1 hover:bg-stone-800 text-stone-400 rounded disabled:opacity-30 cursor-pointer"
                                title="Move Up"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const list = [...(content.bullets || [])];
                                  if (idx < list.length - 1) {
                                    const temp = list[idx];
                                    list[idx] = list[idx + 1];
                                    list[idx + 1] = temp;
                                    updateProp('bullets', list);
                                  }
                                }}
                                disabled={idx === (content.bullets || []).length - 1}
                                className="p-1 hover:bg-stone-800 text-stone-400 rounded disabled:opacity-30 cursor-pointer"
                                title="Move Down"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const list = (content.bullets || []).filter((_: any, bIdx: number) => bIdx !== idx);
                                  updateProp('bullets', list);
                                }}
                                className="p-1 hover:bg-rose-950 text-rose-400 hover:text-rose-300 rounded cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={() => {
                            const list = [...(content.bullets || [])];
                            list.push({ id: `bullet-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, text: 'New feature bullet description' });
                            updateProp('bullets', list);
                          }}
                          className="w-full py-1.5 border border-dashed border-stone-800 hover:border-amber-600/50 hover:bg-stone-950/40 text-stone-400 hover:text-stone-300 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Highlight Bullet</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {type === 'OG Offer Collection' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-800/40">
                  <Type className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Heading & Subtitle Copy</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Title / Heading</label>
                  <input
                    type="text"
                    value={content.title || ''}
                    onChange={(e) => updateProp('title', e.target.value)}
                    placeholder="Title..."
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs focus:border-amber-500/50 outline-none text-stone-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Subtitle / Description</label>
                  <input
                    type="text"
                    value={content.subtitle || ''}
                    onChange={(e) => updateProp('subtitle', e.target.value)}
                    placeholder="Subtitle..."
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs focus:border-amber-500/50 outline-none text-stone-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Subtitle Highlight Word/Phrase (Optional)</label>
                  <input
                    type="text"
                    value={content.subtitleAccent || ''}
                    onChange={(e) => updateProp('subtitleAccent', e.target.value)}
                    placeholder="e.g. newly launched"
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs focus:border-amber-500/50 outline-none text-stone-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Highlight Word Color</label>
                  <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                    <input
                      type="color"
                      value={content.subtitleAccentColor || '#be123c'}
                      onChange={(e) => updateProp('subtitleAccentColor', e.target.value)}
                      className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                    />
                    <span className="text-[10px] font-mono text-stone-300 uppercase truncate">{content.subtitleAccentColor || '#be123c'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. INFINITE MARQUEE TEXT */}
            {type === 'Infinite Marquee' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-800/40">
                  <Type className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Marquee Copy</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Banner Text</label>
                  <textarea
                    rows={3}
                    value={content.text || ''}
                    onChange={(e) => updateProp('text', e.target.value)}
                    placeholder="e.g. BIS 22K HALLMARKED • HANDCRAFTED HERITAGE • HEAVY FILIGREE DESIGNERS"
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs focus:border-amber-500/50 outline-none text-stone-100 resize-none"
                  />
                </div>
              </div>
            )}

            {/* 3. CTA BUTTON CONFIGURATION */}
            {isTextBannerLayout && (
              <div className="space-y-6 pt-2">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-800/40">
                  <Link2 className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Call-to-Action Buttons</span>
                </div>

                {/* Primary Button */}
                <div className="bg-stone-850/40 p-3.5 rounded-xl border border-stone-800/50 space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Primary CTA Button</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Label</label>
                      <input
                        type="text"
                        value={content.primaryButton?.label || ''}
                        onChange={(e) => updateNestedProp('primaryButton', 'label', e.target.value)}
                        placeholder="e.g. Shop Collection"
                        className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Style</label>
                      <select
                        value={content.primaryButton?.styleType || 'filled'}
                        onChange={(e) => updateNestedProp('primaryButton', 'styleType', e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100 cursor-pointer"
                      >
                        <option value="filled">Filled Button</option>
                        <option value="outlined">Outlined Button</option>
                      </select>
                    </div>
                  </div>

                  <LinkToControl
                    label="Link Destination"
                    value={content.primaryButton?.linkUrl || ''}
                    onChange={(newUrl) => updateNestedProp('primaryButton', 'linkUrl', newUrl)}
                    categories={categoriesList}
                    collections={collectionsList}
                  />
                </div>

                {/* Secondary Button */}
                <div className="bg-stone-850/40 p-3.5 rounded-xl border border-stone-800/50 space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Secondary CTA Button</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Label</label>
                      <input
                        type="text"
                        value={content.secondaryButton?.label || ''}
                        onChange={(e) => updateNestedProp('secondaryButton', 'label', e.target.value)}
                        placeholder="e.g. Explore Heritage"
                        className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Style</label>
                      <select
                        value={content.secondaryButton?.styleType || 'outlined'}
                        onChange={(e) => updateNestedProp('secondaryButton', 'styleType', e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100 cursor-pointer"
                      >
                        <option value="filled">Filled Button</option>
                        <option value="outlined">Outlined Button</option>
                      </select>
                    </div>
                  </div>

                  <LinkToControl
                    label="Link Destination"
                    value={content.secondaryButton?.linkUrl || ''}
                    onChange={(newUrl) => updateNestedProp('secondaryButton', 'linkUrl', newUrl)}
                    categories={categoriesList}
                    collections={collectionsList}
                  />
                </div>
              </div>
            )}

             {/* 4. MEDIA UPLOAD (Banners, story collages, looks, sliders) */}
            {['Split Media Banner', 'About Collection', 'Story Collage', 'Shop The Look', 'Media Slider'].includes(type) && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-800/40">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Media Resources</span>
                </div>

                {type !== 'Media Slider' ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">
                        {(type === 'Story Collage' || type === 'About Collection') ? 'Primary Tall Arch Media' : 'Cover Media (Image/Video)'}
                      </label>
                      <ImageUploader
                        id={`${section.id}-media-cover`}
                        value={content.mediaUrl || content.image1 || ''}
                        onChange={(url) => {
                          updateProp('mediaUrl', url);
                          updateProp('image1', url);
                        }}
                        folder={IMAGEKIT_FOLDERS.banners}
                      />
                    </div>

                    {(type === 'Story Collage' || type === 'About Collection') && (
                      <div className="space-y-1.5 pt-2">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">Secondary Overlapping Media</label>
                        <ImageUploader
                          id={`${section.id}-media-story-2`}
                          value={content.mediaUrl2 || content.image2 || ''}
                          onChange={(url) => {
                            updateProp('mediaUrl2', url);
                            updateProp('image2', url);
                          }}
                          folder={IMAGEKIT_FOLDERS.banners}
                        />
                      </div>
                    )}

                    {(type === 'Story Collage' || type === 'About Collection') && (
                      <div className="space-y-2 pt-3 border-t border-stone-800/20">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">Arch Border Color</label>
                        <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5">
                          <input
                            type="color"
                            value={content.archBorderColor || '#b58b37'}
                            onChange={(e) => updateProp('archBorderColor', e.target.value)}
                            className="w-6 h-6 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                          />
                          <input
                            type="text"
                            value={content.archBorderColor || '#b58b37'}
                            onChange={(e) => updateProp('archBorderColor', e.target.value)}
                            placeholder="#b58b37"
                            className="bg-transparent border-none text-stone-100 text-xs font-mono w-full focus:outline-none focus:ring-0"
                          />
                        </div>
                        <p className="text-[9px] text-stone-500 font-sans">Sets the border color around the decorative arch-shaped imagery frames.</p>
                      </div>
                    )}

                    {isTextBannerLayout && (
                      <div className="pt-2">
                        <LinkToControl
                          label="Cover Media Click Link"
                          value={content.linkUrl || ''}
                          onChange={(newUrl) => updateProp('linkUrl', newUrl)}
                          categories={categoriesList}
                          collections={collectionsList}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">Slider Images & Videos</label>
                      <ImageUploader
                        id={`${section.id}-media-slider`}
                        multiple={true}
                        value={content.mediaUrls || []}
                        onChange={(urls) => updateProp('mediaUrls', urls)}
                        folder={IMAGEKIT_FOLDERS.banners}
                      />
                    </div>

                    <div className="pt-2">
                      <LinkToControl
                        label="Slider Media Main Link"
                        value={content.linkUrl || ''}
                        onChange={(newUrl) => updateProp('linkUrl', newUrl)}
                        categories={categoriesList}
                        collections={collectionsList}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {type === 'OG Offer Collection' && (
              <div className="space-y-6 pt-2">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-800/40">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Asymmetric Image Grid (3 Tiles)</span>
                </div>

                {/* Tile 1 */}
                <div className="bg-stone-850/40 p-4 rounded-xl border border-stone-800/50 space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Tile 1: Large Left Feature</h4>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-stone-400 uppercase">Image</label>
                    <ImageUploader
                      id={`${section.id}-tile1-image`}
                      value={content.tile1?.image || ''}
                      onChange={(url) => {
                        const current = content.tile1 || {};
                        updateProp('tile1', { ...current, image: url });
                      }}
                      folder={IMAGEKIT_FOLDERS.banners}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-stone-400 uppercase">Title Overlay (Optional)</label>
                    <input
                      type="text"
                      value={content.tile1?.title || ''}
                      onChange={(e) => {
                        const current = content.tile1 || {};
                        updateProp('tile1', { ...current, title: e.target.value });
                      }}
                      placeholder="e.g. Under 50k"
                      className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100"
                    />
                  </div>
                  <LinkToControl
                    label="Link Destination"
                    value={content.tile1?.linkUrl || ''}
                    onChange={(newUrl) => {
                      const current = content.tile1 || {};
                      updateProp('tile1', { ...current, linkUrl: newUrl });
                    }}
                    categories={categoriesList}
                    collections={collectionsList}
                  />
                </div>

                {/* Tile 2 */}
                <div className="bg-stone-850/40 p-4 rounded-xl border border-stone-800/50 space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Tile 2: Top Right Highlight</h4>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-stone-400 uppercase">Image</label>
                    <ImageUploader
                      id={`${section.id}-tile2-image`}
                      value={content.tile2?.image || ''}
                      onChange={(url) => {
                        const current = content.tile2 || {};
                        updateProp('tile2', { ...current, image: url });
                      }}
                      folder={IMAGEKIT_FOLDERS.banners}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-stone-400 uppercase">Title Overlay (Optional)</label>
                    <input
                      type="text"
                      value={content.tile2?.title || ''}
                      onChange={(e) => {
                        const current = content.tile2 || {};
                        updateProp('tile2', { ...current, title: e.target.value });
                      }}
                      placeholder="e.g. Stunning every Ear"
                      className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100"
                    />
                  </div>
                  <LinkToControl
                    label="Link Destination"
                    value={content.tile2?.linkUrl || ''}
                    onChange={(newUrl) => {
                      const current = content.tile2 || {};
                      updateProp('tile2', { ...current, linkUrl: newUrl });
                    }}
                    categories={categoriesList}
                    collections={collectionsList}
                  />
                </div>

                {/* Tile 3 */}
                <div className="bg-stone-850/40 p-4 rounded-xl border border-stone-800/50 space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Tile 3: Bottom Right Highlight</h4>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-stone-400 uppercase">Image</label>
                    <ImageUploader
                      id={`${section.id}-tile3-image`}
                      value={content.tile3?.image || ''}
                      onChange={(url) => {
                        const current = content.tile3 || {};
                        updateProp('tile3', { ...current, image: url });
                      }}
                      folder={IMAGEKIT_FOLDERS.banners}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-stone-400 uppercase">Title Overlay (Optional)</label>
                    <input
                      type="text"
                      value={content.tile3?.title || ''}
                      onChange={(e) => {
                        const current = content.tile3 || {};
                        updateProp('tile3', { ...current, title: e.target.value });
                      }}
                      placeholder="e.g. Gold Coins"
                      className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100"
                    />
                  </div>
                  <LinkToControl
                    label="Link Destination"
                    value={content.tile3?.linkUrl || ''}
                    onChange={(newUrl) => {
                      const current = content.tile3 || {};
                      updateProp('tile3', { ...current, linkUrl: newUrl });
                    }}
                    categories={categoriesList}
                    collections={collectionsList}
                  />
                </div>
              </div>
            )}

            {/* 5. MULTI-SELECT/FILTER WORKSPACES (Dropdown & grid layouts) */}
            {/* Category Cards */}
            {type === 'Category Cards' && (
              <div className="space-y-4">
                {/* Header Copy & Color Settings */}
                <div className="space-y-3 bg-stone-900/40 p-3 rounded-xl border border-stone-800/40">
                  <div className="flex items-center gap-2 pb-1 border-b border-stone-800/20">
                    <Type className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Header Content & Styling</span>
                  </div>

                  {/* Eyebrow Tag */}
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-8 space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Eyebrow Tag Text</label>
                      <input
                        type="text"
                        value={content.eyebrow !== undefined ? content.eyebrow : ''}
                        onChange={(e) => updateProp('eyebrow', e.target.value)}
                        placeholder="e.g. OUR CATEGORIES (Leave empty to hide)"
                        className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div className="col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Tag Color</label>
                      <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1.5 h-8">
                        <input
                          type="color"
                          value={content.eyebrowColor || '#e11d48'}
                          onChange={(e) => updateProp('eyebrowColor', e.target.value)}
                          className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                        />
                        <span className="text-[9px] font-mono text-stone-300 uppercase truncate">{content.eyebrowColor || '#E11D48'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-8 space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Title Text</label>
                      <input
                        type="text"
                        value={content.title !== undefined ? content.title : 'Shop by Category'}
                        onChange={(e) => updateProp('title', e.target.value)}
                        placeholder="e.g. Shop by Category"
                        className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div className="col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Title Color</label>
                      <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1.5 h-8">
                        <input
                          type="color"
                          value={content.titleColor || '#1c1917'}
                          onChange={(e) => updateProp('titleColor', e.target.value)}
                          className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                        />
                        <span className="text-[9px] font-mono text-stone-300 uppercase truncate">{content.titleColor || '#1C1917'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Subtitle */}
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-8 space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Subtitle Text</label>
                      <textarea
                        rows={2}
                        value={content.subtitle !== undefined ? content.subtitle : ''}
                        onChange={(e) => updateProp('subtitle', e.target.value)}
                        placeholder="e.g. Explore our spectacular designs..."
                        className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50 resize-none"
                      />
                    </div>
                    <div className="col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Subtitle Color</label>
                      <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1.5 h-8">
                        <input
                          type="color"
                          value={content.subtitleColor || '#78716c'}
                          onChange={(e) => updateProp('subtitleColor', e.target.value)}
                          className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                        />
                        <span className="text-[9px] font-mono text-stone-300 uppercase truncate">{content.subtitleColor || '#78716C'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pb-1 border-b border-stone-800/40">
                  <List className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Filter Categories</span>
                </div>

                <p className="text-[10px] text-stone-400 leading-relaxed font-medium bg-stone-850/20 p-2.5 rounded border border-stone-800/40">
                  Filter which specific gold or diamond categories display in this homepage section. Select none to show all published categories automatically.
                </p>

                <div className="border border-stone-800 bg-stone-950 rounded-xl max-h-60 overflow-y-auto divide-y divide-stone-850">
                  {categoriesList.map((cat) => {
                    const isSelected = Array.isArray(content.selectedIds) && content.selectedIds.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleSelectedId('selectedIds', cat.id)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left text-xs text-stone-300 hover:bg-stone-900 hover:text-white transition-all cursor-pointer"
                      >
                        <span className="font-serif font-bold">{cat.name}</span>
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                          isSelected ? 'bg-amber-500 border-amber-600 text-stone-950' : 'border-stone-700'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Category Strip */}
            {type === 'Quick Category Strip' && (
              <div className="space-y-4">
                {/* Header Copy Settings */}
                <div className="space-y-3 bg-stone-900/40 p-3 rounded-xl border border-stone-800/40">
                  <div className="flex items-center gap-2 pb-1 border-b border-stone-800/20">
                    <Type className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Strip Header Settings</span>
                  </div>

                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-8 space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Strip Title Text</label>
                      <input
                        type="text"
                        value={content.title !== undefined ? content.title : ''}
                        onChange={(e) => updateProp('title', e.target.value)}
                        placeholder="e.g. Browse Popular Categories"
                        className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div className="col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Title Color</label>
                      <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1.5 h-8">
                        <input
                          type="color"
                          value={content.titleColor || '#1c1917'}
                          onChange={(e) => updateProp('titleColor', e.target.value)}
                          className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                        />
                        <span className="text-[9px] font-mono text-stone-300 uppercase truncate">{content.titleColor || '#1C1917'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pb-1 border-b border-stone-800/40">
                  <List className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Filter Strip Categories</span>
                </div>

                <p className="text-[10px] text-stone-400 leading-relaxed font-medium bg-stone-850/20 p-2.5 rounded border border-stone-800/40">
                  Select which specific gold or diamond categories display in this quick-scrolling strip. Select none to show all published categories automatically.
                </p>

                <div className="border border-stone-800 bg-stone-950 rounded-xl max-h-60 overflow-y-auto divide-y divide-stone-850">
                  {categoriesList.map((cat) => {
                    const isSelected = Array.isArray(content.selectedIds) && content.selectedIds.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleSelectedId('selectedIds', cat.id)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left text-xs text-stone-300 hover:bg-stone-900 hover:text-white transition-all cursor-pointer"
                      >
                        <span className="font-serif font-bold">{cat.name}</span>
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                          isSelected ? 'bg-amber-500 border-amber-600 text-stone-950' : 'border-stone-700'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Testimonials */}
            {type === 'Testimonials' && (
              <div className="space-y-4">
                <div className="space-y-3 bg-stone-900/40 p-3 rounded-xl border border-stone-800/40">
                  <div className="flex items-center gap-2 pb-1 border-b border-stone-800/20">
                    <Type className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Header Content Settings</span>
                  </div>

                  {/* Title */}
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-8 space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Section Title</label>
                      <input
                        type="text"
                        value={content.title !== undefined ? content.title : 'What Our Customers Say'}
                        onChange={(e) => updateProp('title', e.target.value)}
                        placeholder="e.g. What Our Customers Say"
                        className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div className="col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Title Color</label>
                      <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1.5 h-8">
                        <input
                          type="color"
                          value={content.titleColor || '#1c1917'}
                          onChange={(e) => updateProp('titleColor', e.target.value)}
                          className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                        />
                        <span className="text-[9px] font-mono text-stone-300 uppercase truncate">{content.titleColor || '#1C1917'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Subtitle */}
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-8 space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Section Subtitle</label>
                      <textarea
                        rows={2}
                        value={content.subtitle !== undefined ? content.subtitle : ''}
                        onChange={(e) => updateProp('subtitle', e.target.value)}
                        placeholder="e.g. Discover why generations of families trust us..."
                        className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50 resize-none"
                      />
                    </div>
                    <div className="col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Subtitle Color</label>
                      <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1.5 h-8">
                        <input
                          type="color"
                          value={content.subtitleColor || '#78716c'}
                          onChange={(e) => updateProp('subtitleColor', e.target.value)}
                          className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                        />
                        <span className="text-[9px] font-mono text-stone-300 uppercase truncate">{content.subtitleColor || '#78716C'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quote Card Style Settings */}
                  <div className="pt-2 border-t border-stone-800/20 grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Quote Card Background</label>
                      <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 h-8">
                        <input
                          type="color"
                          value={content.quoteCardBg || '#ffffff'}
                          onChange={(e) => updateProp('quoteCardBg', e.target.value)}
                          className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                        />
                        <input
                          type="text"
                          value={content.quoteCardBg || '#ffffff'}
                          onChange={(e) => updateProp('quoteCardBg', e.target.value)}
                          className="bg-transparent text-stone-300 font-mono text-[10px] uppercase w-full outline-none"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">patron management</span>
                  <p className="text-[10px] text-stone-400 leading-relaxed">
                    Customer review cards are managed in the main <strong>Testimonials</strong> admin dashboard. You can add, edit, reorder, or toggle verified badges from the side-navigation dashboard.
                  </p>
                </div>
              </div>
            )}

            {/* Product Carousel */}
            {type === 'Product Carousel' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-800/40">
                  <List className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Products Selection</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase">Carousel Mode</label>
                  <select
                    value={content.productsType || 'featured'}
                    onChange={(e) => updateProp('productsType', e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs focus:border-amber-500/50 outline-none text-stone-100 font-medium"
                  >
                    <option value="featured">Featured Masterpieces</option>
                    <option value="new">Fresh Showroom Arrivals</option>
                    <option value="custom">Custom Handpicked Products</option>
                  </select>
                </div>

                {/* Always show the custom list editor, but with a warning if they are in featured/new mode */}
                <div className="space-y-3 bg-stone-950/40 p-3.5 rounded-xl border border-stone-800/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Handpicked Products List</span>
                    <span className="text-[10px] font-mono text-stone-500 bg-stone-900 px-2 py-0.5 rounded border border-stone-800/50">
                      Total: {Array.isArray(content.selectedIds) ? content.selectedIds.length : 0}
                    </span>
                  </div>

                  {content.productsType !== 'custom' && (
                    <div className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded leading-relaxed">
                      💡 <strong>Note:</strong> You have selected <em>"{content.productsType === 'featured' ? 'Featured Masterpieces' : 'Fresh Showroom Arrivals'}"</em> mode. To display these custom handpicked products on the website, set <strong>Carousel Mode</strong> above to <strong>"Custom Handpicked Products"</strong>.
                    </div>
                  )}

                  {/* Selected Products List */}
                  <div className="space-y-2">
                    {(() => {
                      const selectedIds = Array.isArray(content.selectedIds) ? content.selectedIds : [];
                      const selectedProducts = productsList.filter(p => selectedIds.includes(p.id));

                      if (selectedProducts.length === 0) {
                        return (
                          <div className="text-center py-6 px-4 border border-dashed border-stone-800 rounded bg-stone-950/20">
                            <p className="text-[10px] text-stone-500 italic">No custom products added to this carousel section yet.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {selectedProducts.map((p) => (
                            <div 
                              key={p.id} 
                              className="flex items-center justify-between gap-3 bg-stone-950 border border-stone-850 p-2 rounded-lg"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 bg-stone-900 rounded overflow-hidden border border-stone-800 shrink-0">
                                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-[10px] font-serif font-bold text-stone-200 truncate">{p.name}</h5>
                                  <p className="text-[8px] text-stone-500 font-mono">{p.sku}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => toggleSelectedId('selectedIds', p.id)}
                                className="text-stone-500 hover:text-red-500 p-1 rounded hover:bg-stone-900 transition-colors cursor-pointer shrink-0"
                                title="Remove Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Search Bar & Results to ADD products */}
                  <div className="space-y-2 pt-2 border-t border-stone-900">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block">Search & Add More Products</span>
                      <button
                        type="button"
                        onClick={openBrowseModal}
                        className="text-[9px] font-bold uppercase tracking-wider text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/25 px-2.5 py-1 rounded-lg border border-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <ListPlus className="w-3.5 h-3.5" />
                        <span>Browse All</span>
                      </button>
                    </div>
                    <div className="flex items-center bg-stone-950 border border-stone-800 rounded px-3 py-1.5">
                      <Search className="w-3.5 h-3.5 text-stone-500 mr-2 shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Type product name or SKU..."
                        className="bg-transparent border-none outline-none text-xs text-stone-200 placeholder-stone-600 w-full"
                      />
                    </div>

                    {/* Search Results list of products that are NOT yet selected */}
                    {searchQuery.trim() !== '' && (
                      <div className="border border-stone-800 bg-stone-950 rounded-xl max-h-48 overflow-y-auto divide-y divide-stone-850">
                        {(() => {
                          const selectedIds = Array.isArray(content.selectedIds) ? content.selectedIds : [];
                          const filtered = productsList
                            .filter(p => !selectedIds.includes(p.id))
                            .filter(p => (p.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || (p.sku || '').toLowerCase().includes((searchQuery || '').toLowerCase()));

                          if (filtered.length === 0) {
                            return (
                              <div className="p-3 text-center text-[10px] text-stone-500">
                                No matching available products.
                              </div>
                            );
                          }

                          return filtered.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-stone-900 transition-all"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 bg-stone-800 rounded overflow-hidden shrink-0 border border-stone-800">
                                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-[10px] font-serif font-bold text-stone-200 truncate">{p.name}</h5>
                                  <p className="text-[8px] text-stone-500 font-mono">{p.sku} | {p.metalType}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  toggleSelectedId('selectedIds', p.id);
                                  // Automatically switch mode to 'custom' to give immediate feedback
                                  if (content.productsType !== 'custom') {
                                    updateProp('productsType', 'custom');
                                  }
                                  setSearchQuery('');
                                }}
                                className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-stone-950 text-[9px] font-bold px-2 py-1 rounded transition-all cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add</span>
                              </button>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Shop The Look (High-density model image row editor) */}
            {type === 'Shop The Look' && (() => {
              const items = Array.isArray(content.images) ? content.images : [];
              return (
                <div className="space-y-4">
                  {/* Title & Style settings */}
                  <div className="space-y-3 bg-stone-900/40 p-3 rounded-xl border border-stone-800/40">
                    <div className="flex items-center gap-2 pb-1 border-b border-stone-800/20">
                      <Type className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Header Settings</span>
                    </div>

                    <div className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-8 space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Section Title (Optional)</label>
                        <input
                          type="text"
                          value={content.title !== undefined ? content.title : ''}
                          onChange={(e) => updateProp('title', e.target.value)}
                          placeholder="e.g. Curated Bridal Looks"
                          className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50"
                        />
                      </div>
                      <div className="col-span-4 space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Title Color</label>
                        <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1.5 h-8">
                          <input
                            type="color"
                            value={content.titleColor || '#1c1917'}
                            onChange={(e) => updateProp('titleColor', e.target.value)}
                            className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                          />
                          <span className="text-[9px] font-mono text-stone-300 uppercase truncate">{content.titleColor || '#1C1917'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-1 border-b border-stone-800/40">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Model Look Images ({items.length}/4)</span>
                    </div>
                    {items.length < 4 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newList = [...items, { url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=600', linkUrl: '/catalog' }];
                          updateProp('images', newList);
                        }}
                        className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-stone-950 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Image
                      </button>
                    )}
                  </div>

                  <p className="text-[10px] text-stone-400 leading-relaxed font-medium bg-stone-850/20 p-2.5 rounded border border-stone-800/40">
                    Add between 2 to 4 lifestyle/model portrait photos. Each image is independently uploadable and linkable. If they exceed screen width, they will scroll horizontally.
                  </p>

                  <div className="space-y-4">
                    {items.map((item: any, idx: number) => (
                      <div key={idx} className="bg-stone-900/40 p-3 rounded-xl border border-stone-800/40 space-y-3 relative group">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Image #{idx + 1}</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (idx > 0) {
                                  const list = [...items];
                                  const temp = list[idx];
                                  list[idx] = list[idx - 1];
                                  list[idx - 1] = temp;
                                  updateProp('images', list);
                                }
                              }}
                              disabled={idx === 0}
                              className="p-1 hover:bg-stone-800 text-stone-400 rounded disabled:opacity-30 cursor-pointer"
                              title="Move Up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (idx < items.length - 1) {
                                  const list = [...items];
                                  const temp = list[idx];
                                  list[idx] = list[idx + 1];
                                  list[idx + 1] = temp;
                                  updateProp('images', list);
                                }
                              }}
                              disabled={idx === items.length - 1}
                              className="p-1 hover:bg-stone-800 text-stone-400 rounded disabled:opacity-30 cursor-pointer"
                              title="Move Down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            {items.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const list = items.filter((_, i) => i !== idx);
                                  updateProp('images', list);
                                }}
                                className="p-1 hover:bg-red-950 text-red-400 rounded cursor-pointer"
                                title="Delete Image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-1 space-y-1">
                            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Image File</label>
                            <ImageUploader
                              id={`${section.id}-look-img-${idx}`}
                              value={item.url}
                              onChange={(newUrl) => {
                                const list = [...items];
                                list[idx] = { ...list[idx], url: newUrl };
                                updateProp('images', list);
                              }}
                              folder={IMAGEKIT_FOLDERS.banners}
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Link Destination</label>
                            <SmartLinkPicker
                              value={item.linkUrl || ''}
                              onChange={(newUrl) => {
                                const list = [...items];
                                list[idx] = { ...list[idx], linkUrl: newUrl };
                                updateProp('images', list);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Promo Callout Card */}
            {type === 'Promo Callout Card' && (
              <div className="space-y-4">
                <div className="space-y-3 bg-stone-900/40 p-3 rounded-xl border border-stone-800/40">
                  <div className="flex items-center gap-2 pb-1 border-b border-stone-800/20">
                    <Type className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Content Fields</span>
                  </div>

                  {/* Heading */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">Promo Heading</label>
                    <input
                      type="text"
                      value={content.heading || ''}
                      onChange={(e) => updateProp('heading', e.target.value)}
                      placeholder="e.g. We've got you a birthday surprise!"
                      className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50"
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">Description / Subtext</label>
                    <textarea
                      rows={2}
                      value={content.subtitle || ''}
                      onChange={(e) => updateProp('subtitle', e.target.value)}
                      placeholder="e.g. Add your birthday & unlock a coupon!"
                      className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50 resize-none"
                    />
                  </div>

                  {/* Icon/Image */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">Promo Icon / Small Image</label>
                    <ImageUploader
                      id={`${section.id}-promo-icon`}
                      value={content.image || ''}
                      onChange={(url) => updateProp('image', url)}
                      folder={IMAGEKIT_FOLDERS.banners}
                    />
                    <p className="text-[9px] text-amber-500 font-medium leading-normal mt-1 bg-amber-500/5 p-2 rounded border border-amber-500/15">
                      ⚠️ <strong>Browser-Supported Formats Only</strong>: Please upload SVG (preferred for crisp scaling) or PNG/JPG. Raw PSD (Photoshop) files are design sources and cannot be directly rendered by web browsers; they must be exported to PNG or SVG before uploading.
                    </p>
                  </div>
                </div>

                {/* Background & Colors */}
                <div className="space-y-3 bg-stone-900/40 p-3 rounded-xl border border-stone-800/40">
                  <div className="flex items-center gap-2 pb-1 border-b border-stone-800/20">
                    <Palette className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Background & Layout Colors</span>
                  </div>

                  {/* Card Background Image */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">Card Background Image (Optional)</label>
                    <ImageUploader
                      id={`${section.id}-promo-bg`}
                      value={content.bgImage || ''}
                      onChange={(url) => updateProp('bgImage', url)}
                      folder={IMAGEKIT_FOLDERS.banners}
                    />
                    <p className="text-[8px] text-stone-500 italic mt-1 leading-normal">
                      Set a custom background photo. If left unset, falls back gracefully to the Background Color below.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">Default Text Color</label>
                      <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1.5 h-8">
                        <input
                          type="color"
                          value={content.textColor || '#6B1F2A'}
                          onChange={(e) => updateProp('textColor', e.target.value)}
                          className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                        />
                        <span className="text-[9px] font-mono text-stone-300 uppercase truncate">{content.textColor || '#6B1F2A'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">Background Color</label>
                      <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1.5 h-8">
                        <input
                          type="color"
                          value={content.bgColor && !content.bgColor.includes('gradient') ? content.bgColor : '#FAF7F2'}
                          onChange={(e) => updateProp('bgColor', e.target.value)}
                          className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                        />
                        <span className="text-[9px] font-mono text-stone-300 uppercase truncate">{content.bgColor || '#FAF7F2'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Gradient Backdoor Input */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide block">Advanced Background CSS (supports gradients)</label>
                    <input
                      type="text"
                      value={content.bgColor || ''}
                      onChange={(e) => updateProp('bgColor', e.target.value)}
                      placeholder="e.g. linear-gradient(135deg, #FAF7F2 0%, #F5EFEB 100%)"
                      className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1 text-[10px] font-mono text-stone-300 outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                {/* Heading Styling Controls */}
                <div className="bg-stone-900/40 p-3 rounded-xl border border-stone-800/40 space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-stone-800/20">
                    <Type className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Heading Typography</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Font Family</label>
                      <select
                        value={content.headingStyle?.fontFamily || 'serif'}
                        onChange={(e) => updateNestedProp('headingStyle', 'fontFamily', e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs text-stone-100 outline-none cursor-pointer"
                      >
                        <option value="serif">Heritage Serif</option>
                        <option value="sans">Modern Sans-serif</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Text Color</label>
                      <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                        <input
                          type="color"
                          value={content.headingStyle?.color || content.textColor || '#1c1917'}
                          onChange={(e) => updateNestedProp('headingStyle', 'color', e.target.value)}
                          className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                        />
                        <span className="text-[9px] font-mono text-stone-300 uppercase truncate">
                          {content.headingStyle?.color || content.textColor || '#1c1917'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-bold text-stone-400 uppercase">
                      <span>Font Size Override</span>
                      <span className="font-mono text-amber-500">{content.headingStyle?.fontSize || 'Default (22)'} px</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={40}
                      value={content.headingStyle?.fontSize || 22}
                      onChange={(e) => updateNestedProp('headingStyle', 'fontSize', parseInt(e.target.value))}
                      className="w-full h-1 bg-stone-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>

                {/* Subtext Styling Controls */}
                <div className="bg-stone-900/40 p-3 rounded-xl border border-stone-800/40 space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-stone-800/20">
                    <Type className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Subtext Typography</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Font Family</label>
                      <select
                        value={content.subtitleStyle?.fontFamily || 'sans'}
                        onChange={(e) => updateNestedProp('subtitleStyle', 'fontFamily', e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs text-stone-100 outline-none cursor-pointer"
                      >
                        <option value="serif">Heritage Serif</option>
                        <option value="sans">Modern Sans-serif</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Text Color</label>
                      <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                        <input
                          type="color"
                          value={content.subtitleStyle?.color || content.textColor || '#6b7280'}
                          onChange={(e) => updateNestedProp('subtitleStyle', 'color', e.target.value)}
                          className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                        />
                        <span className="text-[9px] font-mono text-stone-300 uppercase truncate">
                          {content.subtitleStyle?.color || content.textColor || '#6b7280'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-bold text-stone-400 uppercase">
                      <span>Font Size Override</span>
                      <span className="font-mono text-amber-500">{content.subtitleStyle?.fontSize || 'Default (12)'} px</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={24}
                      value={content.subtitleStyle?.fontSize || 12}
                      onChange={(e) => updateNestedProp('subtitleStyle', 'fontSize', parseInt(e.target.value))}
                      className="w-full h-1 bg-stone-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>

                {/* Button Settings & Styling */}
                <div className="bg-stone-900/40 p-3 rounded-xl border border-stone-800/40 space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-stone-800/20">
                    <Link2 className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Action Button</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">Button Label (Optional)</label>
                    <input
                      type="text"
                      value={content.buttonLabel !== undefined ? content.buttonLabel : 'Unlock Surprise'}
                      onChange={(e) => updateProp('buttonLabel', e.target.value)}
                      placeholder="e.g. Unlock Surprise"
                      className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">Button Action Link</label>
                    <SmartLinkPicker
                      value={content.buttonLink || ''}
                      onChange={(url) => updateProp('buttonLink', url)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Button Bg Color</label>
                      <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                        <input
                          type="color"
                          value={content.buttonStyle?.bgColor || '#d97706'}
                          onChange={(e) => updateNestedProp('buttonStyle', 'bgColor', e.target.value)}
                          className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                        />
                        <span className="text-[9px] font-mono text-stone-300 uppercase truncate">
                          {content.buttonStyle?.bgColor || '#d97706'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Button Text Color</label>
                      <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                        <input
                          type="color"
                          value={content.buttonStyle?.textColor || '#ffffff'}
                          onChange={(e) => updateNestedProp('buttonStyle', 'textColor', e.target.value)}
                          className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                        />
                        <span className="text-[9px] font-mono text-stone-300 uppercase truncate">
                          {content.buttonStyle?.textColor || '#ffffff'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Button Font</label>
                      <select
                        value={content.buttonStyle?.fontFamily || 'sans'}
                        onChange={(e) => updateNestedProp('buttonStyle', 'fontFamily', e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs text-stone-100 outline-none cursor-pointer"
                      >
                        <option value="serif">Heritage Serif</option>
                        <option value="sans">Modern Sans-serif</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-bold text-stone-400 uppercase">
                        <span>Font Size</span>
                        <span className="font-mono text-amber-500">{content.buttonStyle?.fontSize || '12'} px</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={20}
                        value={content.buttonStyle?.fontSize || 12}
                        onChange={(e) => updateNestedProp('buttonStyle', 'fontSize', parseInt(e.target.value))}
                        className="w-full h-1 bg-stone-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* In-Store Redemption Code */}
            {type === 'In-Store Redemption Code' && (() => {
              const offers = Array.isArray(content.offers) ? content.offers : [];
              return (
                <div className="space-y-4">
                  {/* Background Media Settings */}
                  <div className="space-y-3 bg-stone-900/40 p-3 rounded-xl border border-stone-800/40">
                    <div className="flex items-center gap-2 pb-1 border-b border-stone-800/20">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Section Background Media (Optional)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-stone-400 uppercase font-bold">Background Image</label>
                        <ImageUploader
                          id="redemption-bg-image-uploader"
                          value={content.bgImage || ''}
                          onChange={(url) => updateProp('bgImage', url)}
                          folder={IMAGEKIT_FOLDERS.banners}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-stone-400 uppercase font-bold">Background Video</label>
                        <ImageUploader
                          id="redemption-bg-video-uploader"
                          value={content.bgVideo || ''}
                          onChange={(url) => updateProp('bgVideo', url)}
                          folder={IMAGEKIT_FOLDERS.banners}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mobile Consolidated Card Image Settings */}
                  <div className="space-y-3 bg-stone-900/40 p-3 rounded-xl border border-stone-800/40">
                    <div className="flex items-center gap-2 pb-1 border-b border-stone-800/20">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Mobile Consolidated Card</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-stone-400 uppercase font-bold block leading-relaxed">
                        Mobile Card Image — used as the photo at the top of the consolidated mobile card
                      </label>
                      <ImageUploader
                        id="redemption-mobile-card-image-uploader"
                        value={content.mobileCardImage || ''}
                        onChange={(url) => updateProp('mobileCardImage', url)}
                        folder={IMAGEKIT_FOLDERS.banners}
                      />
                      <p className="text-[8px] text-stone-500 italic mt-1 leading-normal">
                        If left unset, mobile consolidated card falls back gracefully to the desktop background image.
                      </p>
                    </div>
                  </div>

                  {/* Header Settings */}
                  <div className="space-y-3 bg-stone-900/40 p-3 rounded-xl border border-stone-800/40">
                    <div className="flex items-center gap-2 pb-1 border-b border-stone-800/20">
                      <Type className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Section Header & Texts</span>
                    </div>

                    {/* Eyebrow / Tag */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Eyebrow / Tag (Optional)</label>
                      <input
                        type="text"
                        value={content.eyebrow !== undefined ? content.eyebrow : 'VISIT SHOWROOM TO REDEEM'}
                        onChange={(e) => updateProp('eyebrow', e.target.value)}
                        placeholder="e.g. VISIT SHOWROOM TO REDEEM"
                        className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50"
                      />
                      {/* Eyebrow Style */}
                      <div className="grid grid-cols-2 gap-2 mt-1 bg-stone-950/40 p-2 rounded border border-stone-800/20">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[8px] font-bold text-stone-400 uppercase">
                            <span>Tag Size</span>
                            <span className="font-mono text-amber-500">{content.eyebrowStyle?.fontSize || 10}px</span>
                          </div>
                          <input
                            type="range"
                            min={8}
                            max={24}
                            value={content.eyebrowStyle?.fontSize || 10}
                            onChange={(e) => updateNestedProp('eyebrowStyle', 'fontSize', parseInt(e.target.value))}
                            className="w-full h-1 bg-stone-900 rounded appearance-none cursor-pointer accent-amber-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-stone-400 uppercase block">Tag Color</label>
                          <div className="flex gap-1.5 items-center bg-stone-950 border border-stone-800 rounded px-1.5 py-0.5 h-6">
                            <input
                              type="color"
                              value={content.eyebrowStyle?.color || '#d97706'}
                              onChange={(e) => updateNestedProp('eyebrowStyle', 'color', e.target.value)}
                              className="w-4 h-4 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                            />
                            <span className="text-[8px] font-mono text-stone-300 uppercase truncate">{content.eyebrowStyle?.color || '#D97706'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section Title */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Section Title (Optional)</label>
                      <input
                        type="text"
                        value={content.title !== undefined ? content.title : ''}
                        onChange={(e) => updateProp('title', e.target.value)}
                        placeholder="e.g. New Launch Exclusive Offers"
                        className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50"
                      />
                      {/* Title Style */}
                      <div className="grid grid-cols-2 gap-2 mt-1 bg-stone-950/40 p-2 rounded border border-stone-800/20">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[8px] font-bold text-stone-400 uppercase">
                            <span>Title Size</span>
                            <span className="font-mono text-amber-500">{content.titleStyle?.fontSize || 24}px</span>
                          </div>
                          <input
                            type="range"
                            min={16}
                            max={64}
                            value={content.titleStyle?.fontSize || 24}
                            onChange={(e) => updateNestedProp('titleStyle', 'fontSize', parseInt(e.target.value))}
                            className="w-full h-1 bg-stone-900 rounded appearance-none cursor-pointer accent-amber-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-stone-400 uppercase block">Title Color</label>
                          <div className="flex gap-1.5 items-center bg-stone-950 border border-stone-800 rounded px-1.5 py-0.5 h-6">
                            <input
                              type="color"
                              value={content.titleStyle?.color || content.titleColor || '#1c1917'}
                              onChange={(e) => {
                                updateNestedProp('titleStyle', 'color', e.target.value);
                                updateProp('titleColor', e.target.value);
                              }}
                              className="w-4 h-4 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                            />
                            <span className="text-[8px] font-mono text-stone-300 uppercase truncate">{content.titleStyle?.color || content.titleColor || '#1C1917'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section Description */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">In-Store Notice Description</label>
                      <textarea
                        rows={2}
                        value={content.description || ''}
                        onChange={(e) => updateProp('description', e.target.value)}
                        placeholder="Explain that these codes must be presented at the physical showroom."
                        className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50 resize-none"
                      />
                      {/* Description Style */}
                      <div className="grid grid-cols-2 gap-2 mt-1 bg-stone-950/40 p-2 rounded border border-stone-800/20">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[8px] font-bold text-stone-400 uppercase">
                            <span>Desc Size</span>
                            <span className="font-mono text-amber-500">{content.descriptionStyle?.fontSize || 12}px</span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={32}
                            value={content.descriptionStyle?.fontSize || 12}
                            onChange={(e) => updateNestedProp('descriptionStyle', 'fontSize', parseInt(e.target.value))}
                            className="w-full h-1 bg-stone-900 rounded appearance-none cursor-pointer accent-amber-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-stone-400 uppercase block">Desc Color</label>
                          <div className="flex gap-1.5 items-center bg-stone-950 border border-stone-800 rounded px-1.5 py-0.5 h-6">
                            <input
                              type="color"
                              value={content.descriptionStyle?.color || '#6b7280'}
                              onChange={(e) => updateNestedProp('descriptionStyle', 'color', e.target.value)}
                              className="w-4 h-4 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                            />
                            <span className="text-[8px] font-mono text-stone-300 uppercase truncate">{content.descriptionStyle?.color || '#6B7280'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Disclaimer */}
                    <div className="space-y-1 pt-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Bottom Disclaimer Notice</label>
                      <textarea
                        rows={2}
                        value={content.disclaimer !== undefined ? content.disclaimer : '💡 In-Store Notice: These offers are valid only for transactions completed in our physical showroom. We do not support online checkouts or direct digital shipping.'}
                        onChange={(e) => updateProp('disclaimer', e.target.value)}
                        placeholder="Write the terms or physical store requirements disclaimer text."
                        className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50 resize-none"
                      />
                      {/* Disclaimer Style */}
                      <div className="grid grid-cols-2 gap-2 mt-1 bg-stone-950/40 p-2 rounded border border-stone-800/20">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[8px] font-bold text-stone-400 uppercase">
                            <span>Notice Size</span>
                            <span className="font-mono text-amber-500">{content.disclaimerStyle?.fontSize || 10}px</span>
                          </div>
                          <input
                            type="range"
                            min={8}
                            max={24}
                            value={content.disclaimerStyle?.fontSize || 10}
                            onChange={(e) => updateNestedProp('disclaimerStyle', 'fontSize', parseInt(e.target.value))}
                            className="w-full h-1 bg-stone-900 rounded appearance-none cursor-pointer accent-amber-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-stone-400 uppercase block">Notice Color</label>
                          <div className="flex gap-1.5 items-center bg-stone-950 border border-stone-800 rounded px-1.5 py-0.5 h-6">
                            <input
                              type="color"
                              value={content.disclaimerStyle?.color || '#4b5563'}
                              onChange={(e) => updateNestedProp('disclaimerStyle', 'color', e.target.value)}
                              className="w-4 h-4 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                            />
                            <span className="text-[8px] font-mono text-stone-300 uppercase truncate">{content.disclaimerStyle?.color || '#4B5563'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* List of Coupon Codes */}
                  <div className="flex items-center justify-between pb-1 border-b border-stone-800/40">
                    <div className="flex items-center gap-2">
                      <List className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Offer Tiles ({offers.length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newList = [...offers, { discount: '10% OFF', promoText: '10% ON MAKING CHARGES', linkUrl: '/catalog', terms: '*Valid in-store only. T&C Apply.', label: 'SHOWROOM EXCLUSIVE' }];
                        updateProp('offers', newList);
                      }}
                      className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-stone-950 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Tile
                    </button>
                  </div>

                  <p className="text-[10px] text-stone-400 leading-relaxed font-medium bg-stone-850/20 p-2.5 rounded border border-stone-800/40">
                    Redesign complete: Offers are presented as realistic tickets with side notch punches and dashed outer borders. Configure detailed colors, font-sizes, links, and conditions below.
                  </p>

                  <div className="space-y-4">
                    {offers.map((offer: any, idx: number) => (
                      <div key={idx} className="bg-stone-900/40 p-3 rounded-xl border border-stone-800/40 space-y-3 relative group">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Tile #{idx + 1}</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (idx > 0) {
                                  const list = [...offers];
                                  const temp = list[idx];
                                  list[idx] = list[idx - 1];
                                  list[idx - 1] = temp;
                                  updateProp('offers', list);
                                }
                              }}
                              disabled={idx === 0}
                              className="p-1 hover:bg-stone-800 text-stone-400 rounded disabled:opacity-30 cursor-pointer"
                              title="Move Up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (idx < offers.length - 1) {
                                  const list = [...offers];
                                  const temp = list[idx];
                                  list[idx] = list[idx + 1];
                                  list[idx + 1] = temp;
                                  updateProp('offers', list);
                                }
                              }}
                              disabled={idx === offers.length - 1}
                              className="p-1 hover:bg-stone-800 text-stone-400 rounded disabled:opacity-30 cursor-pointer"
                              title="Move Down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            {offers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const list = offers.filter((_, i) => i !== idx);
                                  updateProp('offers', list);
                                }}
                                className="p-1 hover:bg-red-950 text-red-400 rounded cursor-pointer"
                                title="Delete Tile"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Eyebrow Label Text and Style */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Tile Top Label</label>
                          <input
                            type="text"
                            value={offer.label !== undefined ? offer.label : 'SHOWROOM EXCLUSIVE'}
                            onChange={(e) => {
                              const list = [...offers];
                              list[idx] = { ...list[idx], label: e.target.value };
                              updateProp('offers', list);
                            }}
                            placeholder="e.g. SHOWROOM EXCLUSIVE"
                            className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none"
                          />
                          <div className="grid grid-cols-2 gap-2 mt-1 bg-stone-950/20 p-2 rounded border border-stone-850">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[8px] font-bold text-stone-400 uppercase">
                                <span>Label Size</span>
                                <span className="font-mono text-amber-500">{offer.labelStyle?.fontSize || 9}px</span>
                              </div>
                              <input
                                type="range"
                                min={8}
                                max={20}
                                value={offer.labelStyle?.fontSize || 9}
                                onChange={(e) => {
                                  const list = [...offers];
                                  list[idx] = { ...list[idx], labelStyle: { ...(list[idx].labelStyle || {}), fontSize: parseInt(e.target.value) } };
                                  updateProp('offers', list);
                                }}
                                className="w-full h-1 bg-stone-900 rounded appearance-none cursor-pointer accent-amber-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-bold text-stone-400 uppercase block">Label Color</label>
                              <div className="flex gap-1.5 items-center bg-stone-950 border border-stone-800 rounded px-1.5 py-0.5 h-6">
                                <input
                                  type="color"
                                  value={offer.labelStyle?.color || '#6b7280'}
                                  onChange={(e) => {
                                    const list = [...offers];
                                    list[idx] = { ...list[idx], labelStyle: { ...(list[idx].labelStyle || {}), color: e.target.value } };
                                    updateProp('offers', list);
                                  }}
                                  className="w-4 h-4 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                                />
                                <span className="text-[8px] font-mono text-stone-300 uppercase truncate">{offer.labelStyle?.color || '#6B7280'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Headline Discount / Offer Text and Style */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Discount/Offer Label</label>
                            <input
                              type="text"
                              value={offer.discount || ''}
                              onChange={(e) => {
                                const list = [...offers];
                                list[idx] = { ...list[idx], discount: e.target.value };
                                updateProp('offers', list);
                              }}
                              placeholder="e.g. 10% OFF"
                              className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Promo Text Line</label>
                            <input
                              type="text"
                              value={offer.promoText !== undefined ? offer.promoText : (offer.code || '')}
                              onChange={(e) => {
                                const list = [...offers];
                                list[idx] = { ...list[idx], promoText: e.target.value, code: e.target.value };
                                updateProp('offers', list);
                              }}
                              placeholder="e.g. 10% ON MAKING CHARGES"
                              className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none"
                            />
                          </div>
                        </div>

                        {/* Discount Style Override & Promo Style Override */}
                        <div className="grid grid-cols-2 gap-3 bg-stone-950/20 p-2 rounded border border-stone-850">
                          {/* Discount style */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[8px] font-bold text-stone-400 uppercase">
                              <span>Discount Size</span>
                              <span className="font-mono text-amber-500">{offer.discountStyle?.fontSize || 30}px</span>
                            </div>
                            <input
                              type="range"
                              min={16}
                              max={64}
                              value={offer.discountStyle?.fontSize || 30}
                              onChange={(e) => {
                                const list = [...offers];
                                list[idx] = { ...list[idx], discountStyle: { ...(list[idx].discountStyle || {}), fontSize: parseInt(e.target.value) } };
                                updateProp('offers', list);
                              }}
                              className="w-full h-1 bg-stone-900 rounded appearance-none cursor-pointer accent-amber-500"
                            />
                            <div className="flex gap-1 items-center mt-1">
                              <input
                                type="color"
                                value={offer.discountStyle?.color || '#d97706'}
                                onChange={(e) => {
                                  const list = [...offers];
                                  list[idx] = { ...list[idx], discountStyle: { ...(list[idx].discountStyle || {}), color: e.target.value } };
                                  updateProp('offers', list);
                                }}
                                className="w-3.5 h-3.5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer shrink-0"
                              />
                              <span className="text-[8px] font-mono text-stone-400 truncate uppercase">{offer.discountStyle?.color || '#D97706'}</span>
                            </div>
                          </div>

                          {/* Promo style */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[8px] font-bold text-stone-400 uppercase">
                              <span>Promo Size</span>
                              <span className="font-mono text-amber-500">{offer.promoStyle?.fontSize || 12}px</span>
                            </div>
                            <input
                              type="range"
                              min={8}
                              max={24}
                              value={offer.promoStyle?.fontSize || 12}
                              onChange={(e) => {
                                const list = [...offers];
                                list[idx] = { ...list[idx], promoStyle: { ...(list[idx].promoStyle || {}), fontSize: parseInt(e.target.value) } };
                                updateProp('offers', list);
                              }}
                              className="w-full h-1 bg-stone-900 rounded appearance-none cursor-pointer accent-amber-500"
                            />
                            <div className="flex gap-1 items-center mt-1">
                              <input
                                type="color"
                                value={offer.promoStyle?.color || '#1c1917'}
                                onChange={(e) => {
                                  const list = [...offers];
                                  list[idx] = { ...list[idx], promoStyle: { ...(list[idx].promoStyle || {}), color: e.target.value } };
                                  updateProp('offers', list);
                                }}
                                className="w-3.5 h-3.5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer shrink-0"
                              />
                              <span className="text-[8px] font-mono text-stone-400 truncate uppercase">{offer.promoStyle?.color || '#1C1917'}</span>
                            </div>
                          </div>
                        </div>

                        <LinkToControl
                          label="Tile Link Destination"
                          value={offer.linkUrl || ''}
                          onChange={(newUrl) => {
                            const list = [...offers];
                            list[idx] = { ...list[idx], linkUrl: newUrl };
                            updateProp('offers', list);
                          }}
                          categories={categoriesList}
                          collections={collectionsList}
                        />

                        {/* Conditions and Style */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Coupon Conditions / Terms</label>
                          <input
                            type="text"
                            value={offer.terms || ''}
                            onChange={(e) => {
                              const list = [...offers];
                              list[idx] = { ...list[idx], terms: e.target.value };
                              updateProp('offers', list);
                            }}
                            placeholder="e.g. *Valid on Men's silver jewelry only. T&C Apply."
                            className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none"
                          />
                          <div className="grid grid-cols-2 gap-2 mt-1 bg-stone-950/20 p-2 rounded border border-stone-850">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[8px] font-bold text-stone-400 uppercase">
                                <span>Terms Size</span>
                                <span className="font-mono text-amber-500">{offer.termsStyle?.fontSize || 10}px</span>
                              </div>
                              <input
                                type="range"
                                min={8}
                                max={20}
                                value={offer.termsStyle?.fontSize || 10}
                                onChange={(e) => {
                                  const list = [...offers];
                                  list[idx] = { ...list[idx], termsStyle: { ...(list[idx].termsStyle || {}), fontSize: parseInt(e.target.value) } };
                                  updateProp('offers', list);
                                }}
                                className="w-full h-1 bg-stone-900 rounded appearance-none cursor-pointer accent-amber-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-bold text-stone-400 uppercase block">Terms Color</label>
                              <div className="flex gap-1.5 items-center bg-stone-950 border border-stone-800 rounded px-1.5 py-0.5 h-6">
                                <input
                                  type="color"
                                  value={offer.termsStyle?.color || '#6b7280'}
                                  onChange={(e) => {
                                    const list = [...offers];
                                    list[idx] = { ...list[idx], termsStyle: { ...(list[idx].termsStyle || {}), color: e.target.value } };
                                    updateProp('offers', list);
                                  }}
                                  className="w-4 h-4 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                                />
                                <span className="text-[8px] font-mono text-stone-300 uppercase truncate">{offer.termsStyle?.color || '#6B7280'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {type === 'Offer Banner B1' && (() => {
              const tiles = Array.isArray(content.tiles) ? content.tiles : [];
              const badges = Array.isArray(content.badges) ? content.badges : [];

              return (
                <div className="space-y-6">
                  {/* Part 1: Banners Header */}
                  <div className="flex items-center justify-between pb-1 border-b border-stone-800/40">
                    <div className="flex items-center gap-2">
                      <Layout className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Offer Banners ({tiles.length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newTiles = [
                          ...tiles,
                          {
                            id: `tile-${Date.now()}`,
                            eyebrow: 'NEW PROMO',
                            eyebrowColor: '#f1f5f9',
                            eyebrowFont: 'sans',
                            heading: 'Offer Headline Goes Here',
                            headingColor: '#ffffff',
                            headingFont: 'serif',
                            headingSize: 'text-lg',
                            buttonLabel: 'SHOP NOW',
                            buttonLink: '/catalog',
                            buttonBgColor: '#be9023',
                            buttonTextColor: '#ffffff',
                            desktopImage: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=600',
                            mobileImage: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400',
                            overlayColor: 'rgba(2, 43, 27, 0.75)'
                          }
                        ];
                        updateProp('tiles', newTiles);
                      }}
                      className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-stone-950 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Tile
                    </button>
                  </div>

                  {/* Banners List */}
                  <div className="space-y-4">
                    {tiles.map((tile: any, idx: number) => (
                      <div key={tile.id || idx} className="bg-stone-900/40 p-4 rounded-xl border border-stone-800/40 space-y-4 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Banner Tile #{idx + 1}</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (idx > 0) {
                                  const list = [...tiles];
                                  const temp = list[idx];
                                  list[idx] = list[idx - 1];
                                  list[idx - 1] = temp;
                                  updateProp('tiles', list);
                                }
                              }}
                              disabled={idx === 0}
                              className="p-1 hover:bg-stone-800 text-stone-400 rounded disabled:opacity-30 cursor-pointer"
                              title="Move Up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (idx < tiles.length - 1) {
                                  const list = [...tiles];
                                  const temp = list[idx];
                                  list[idx] = list[idx + 1];
                                  list[idx + 1] = temp;
                                  updateProp('tiles', list);
                                }
                              }}
                              disabled={idx === tiles.length - 1}
                              className="p-1 hover:bg-stone-800 text-stone-400 rounded disabled:opacity-30 cursor-pointer"
                              title="Move Down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const list = tiles.filter((_, i) => i !== idx);
                                updateProp('tiles', list);
                              }}
                              className="p-1 hover:bg-red-950 text-red-400 rounded cursor-pointer"
                              title="Delete Tile"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Eyebrow properties */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2 space-y-1">
                            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Eyebrow Tag</label>
                            <input
                              type="text"
                              value={tile.eyebrow || ''}
                              onChange={(e) => {
                                const list = [...tiles];
                                list[idx] = { ...list[idx], eyebrow: e.target.value };
                                updateProp('tiles', list);
                              }}
                              className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs text-stone-100 outline-none focus:border-amber-500/50"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Tag Color</label>
                            <input
                              type="color"
                              value={tile.eyebrowColor || '#ffffff'}
                              onChange={(e) => {
                                const list = [...tiles];
                                list[idx] = { ...list[idx], eyebrowColor: e.target.value };
                                updateProp('tiles', list);
                              }}
                              className="w-full h-7 rounded border border-stone-800 bg-stone-950 cursor-pointer outline-none p-0.5"
                            />
                          </div>
                        </div>

                        {/* Heading properties */}
                        <div className="space-y-3 p-3 bg-stone-950/20 rounded-lg border border-stone-800/30">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Heading Text</label>
                            <input
                              type="text"
                              value={tile.heading || ''}
                              onChange={(e) => {
                                const list = [...tiles];
                                list[idx] = { ...list[idx], heading: e.target.value };
                                updateProp('tiles', list);
                              }}
                              className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1 text-xs text-stone-100 outline-none focus:border-amber-500/50"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Font Style</label>
                              <select
                                value={tile.headingFont || 'serif'}
                                onChange={(e) => {
                                  const list = [...tiles];
                                  list[idx] = { ...list[idx], headingFont: e.target.value };
                                  updateProp('tiles', list);
                                }}
                                className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs text-stone-100 outline-none focus:border-amber-500/50"
                              >
                                <option value="serif">Serif</option>
                                <option value="sans">Sans-Serif</option>
                                <option value="cinzel">Cinzel</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Font Size</label>
                              <select
                                value={tile.headingSize || 'text-lg'}
                                onChange={(e) => {
                                  const list = [...tiles];
                                  list[idx] = { ...list[idx], headingSize: e.target.value };
                                  updateProp('tiles', list);
                                }}
                                className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs text-stone-100 outline-none focus:border-amber-500/50"
                              >
                                <option value="text-sm">Small</option>
                                <option value="text-base">Medium</option>
                                <option value="text-lg">Large</option>
                                <option value="text-xl">Extra Large</option>
                                <option value="text-2xl">Display</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Text Color</label>
                              <input
                                type="color"
                                value={tile.headingColor || '#ffffff'}
                                onChange={(e) => {
                                  const list = [...tiles];
                                  list[idx] = { ...list[idx], headingColor: e.target.value };
                                  updateProp('tiles', list);
                                }}
                                className="w-full h-7 rounded border border-stone-800 bg-stone-950 cursor-pointer outline-none p-0.5"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Button properties */}
                        <div className="space-y-3 p-3 bg-stone-950/20 rounded-lg border border-stone-800/30">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Button Text</label>
                              <input
                                type="text"
                                value={tile.buttonLabel || ''}
                                onChange={(e) => {
                                  const list = [...tiles];
                                  list[idx] = { ...list[idx], buttonLabel: e.target.value };
                                  updateProp('tiles', list);
                                }}
                                className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs text-stone-100 outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Btn Bg Color</label>
                              <input
                                type="color"
                                value={tile.buttonBgColor || '#be9023'}
                                onChange={(e) => {
                                  const list = [...tiles];
                                  list[idx] = { ...list[idx], buttonBgColor: e.target.value };
                                  updateProp('tiles', list);
                                }}
                                className="w-full h-7 rounded border border-stone-800 bg-stone-950 cursor-pointer outline-none p-0.5"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Btn Text Color</label>
                              <input
                                type="color"
                                value={tile.buttonTextColor || '#ffffff'}
                                onChange={(e) => {
                                  const list = [...tiles];
                                  list[idx] = { ...list[idx], buttonTextColor: e.target.value };
                                  updateProp('tiles', list);
                                }}
                                className="w-full h-7 rounded border border-stone-800 bg-stone-950 cursor-pointer outline-none p-0.5"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Btn Border Color</label>
                              <input
                                type="color"
                                value={tile.buttonBorderColor || 'transparent'}
                                onChange={(e) => {
                                  const list = [...tiles];
                                  list[idx] = { ...list[idx], buttonBorderColor: e.target.value };
                                  updateProp('tiles', list);
                                }}
                                className="w-full h-7 rounded border border-stone-800 bg-stone-950 cursor-pointer outline-none p-0.5"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Button Link</label>
                            <SmartLinkPicker
                              value={tile.buttonLink || '#'}
                              onChange={(url) => {
                                const list = [...tiles];
                                list[idx] = { ...list[idx], buttonLink: url };
                                updateProp('tiles', list);
                              }}
                            />
                          </div>
                        </div>

                        {/* Card Styling Properties */}
                        <div className="grid grid-cols-2 gap-3 p-3 bg-stone-950/20 rounded-lg border border-stone-800/30">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Tile Card Background</label>
                            <input
                              type="color"
                              value={tile.bgColor || '#022b17'}
                              onChange={(e) => {
                                const list = [...tiles];
                                list[idx] = { ...list[idx], bgColor: e.target.value };
                                updateProp('tiles', list);
                              }}
                              className="w-full h-7 rounded border border-stone-800 bg-stone-950 cursor-pointer outline-none p-0.5"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Image Alignment</label>
                            <select
                              value={tile.imagePosition || 'right'}
                              onChange={(e) => {
                                const list = [...tiles];
                                list[idx] = { ...list[idx], imagePosition: e.target.value };
                                updateProp('tiles', list);
                              }}
                              className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs text-stone-100 outline-none"
                            >
                              <option value="right">Right Side (Mockup Style)</option>
                              <option value="cover">Full Background Image</option>
                            </select>
                          </div>
                        </div>

                        {/* Images properties */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide block">Desktop Image</label>
                            <ImageUploader
                              id={`tile-desk-${idx}`}
                              value={tile.desktopImage || ''}
                              onChange={(url) => {
                                const list = [...tiles];
                                list[idx] = { ...list[idx], desktopImage: url };
                                updateProp('tiles', list);
                              }}
                              folder={IMAGEKIT_FOLDERS.banners}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide block">Mobile Image</label>
                            <ImageUploader
                              id={`tile-mob-${idx}`}
                              value={tile.mobileImage || ''}
                              onChange={(url) => {
                                const list = [...tiles];
                                list[idx] = { ...list[idx], mobileImage: url };
                                updateProp('tiles', list);
                              }}
                              folder={IMAGEKIT_FOLDERS.banners}
                            />
                          </div>
                        </div>

                        {/* Background tint overlay */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Image Tint Overlay (Optional)</label>
                          <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                            <input
                              type="color"
                              value={tile.overlayColor && tile.overlayColor.startsWith('#') ? tile.overlayColor : '#000000'}
                              onChange={(e) => {
                                const list = [...tiles];
                                list[idx] = { ...list[idx], overlayColor: e.target.value };
                                updateProp('tiles', list);
                              }}
                              className="w-5 h-5 rounded border border-stone-700 bg-transparent cursor-pointer overflow-hidden shrink-0 p-0"
                            />
                            <input
                              type="text"
                              value={tile.overlayColor || ''}
                              onChange={(e) => {
                                const list = [...tiles];
                                list[idx] = { ...list[idx], overlayColor: e.target.value };
                                updateProp('tiles', list);
                              }}
                              placeholder="rgba(0,0,0,0.5) or HEX"
                              className="bg-transparent border-none text-[10px] text-stone-100 outline-none flex-1 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Part 2: Trust-Badges Header */}
                  <div className="flex items-center justify-between pb-1 pt-6 border-b border-stone-800/40">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Trust Badges ({badges.length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newBadges = [
                          ...badges,
                          {
                            id: `badge-${Date.now()}`,
                            icon: 'truck',
                            title: 'NEW BADGE',
                            subtitle: 'Details here',
                            useCustomIcon: false,
                            customIconSvg: ''
                          }
                        ];
                        updateProp('badges', newBadges);
                      }}
                      className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-stone-950 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Badge
                    </button>
                  </div>

                  {/* Badges List */}
                  <div className="space-y-4">
                    {badges.map((badge: any, idx: number) => (
                      <div key={badge.id || idx} className="bg-stone-900/40 p-4 rounded-xl border border-stone-800/40 space-y-3 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Badge #{idx + 1}</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (idx > 0) {
                                  const list = [...badges];
                                  const temp = list[idx];
                                  list[idx] = list[idx - 1];
                                  list[idx - 1] = temp;
                                  updateProp('badges', list);
                                }
                              }}
                              disabled={idx === 0}
                              className="p-1 hover:bg-stone-800 text-stone-400 rounded disabled:opacity-30 cursor-pointer"
                              title="Move Up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (idx < badges.length - 1) {
                                  const list = [...badges];
                                  const temp = list[idx];
                                  list[idx] = list[idx + 1];
                                  list[idx + 1] = temp;
                                  updateProp('badges', list);
                                }
                              }}
                              disabled={idx === badges.length - 1}
                              className="p-1 hover:bg-stone-800 text-stone-400 rounded disabled:opacity-30 cursor-pointer"
                              title="Move Down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const list = badges.filter((_, i) => i !== idx);
                                updateProp('badges', list);
                              }}
                              className="p-1 hover:bg-red-950 text-red-400 rounded cursor-pointer"
                              title="Delete Badge"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title properties */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Badge Title</label>
                          <input
                            type="text"
                            value={badge.title || ''}
                            onChange={(e) => {
                              const list = [...badges];
                              list[idx] = { ...list[idx], title: e.target.value };
                              updateProp('badges', list);
                            }}
                            className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1 text-xs text-stone-100 outline-none"
                          />
                        </div>

                        {/* Subtitle properties */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Badge Subtitle</label>
                          <input
                            type="text"
                            value={badge.subtitle || ''}
                            onChange={(e) => {
                              const list = [...badges];
                              list[idx] = { ...list[idx], subtitle: e.target.value };
                              updateProp('badges', list);
                            }}
                            className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1 text-xs text-stone-100 outline-none"
                          />
                        </div>

                        {/* Icon Choice Row */}
                        <div className="space-y-3 p-3 bg-stone-950/20 rounded-lg border border-stone-800/30">
                          <label className="flex items-center gap-2.5 text-xs text-stone-300 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={!!badge.useCustomIcon}
                              onChange={(e) => {
                                const list = [...badges];
                                list[idx] = { ...list[idx], useCustomIcon: e.target.checked };
                                updateProp('badges', list);
                              }}
                              className="w-4 h-4 accent-amber-500 border-stone-800 rounded focus:ring-0 bg-stone-950"
                            />
                            <span className="font-semibold text-[10px] uppercase">Use Custom SVG Code</span>
                          </label>

                          {badge.useCustomIcon ? (
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Custom SVG XML</label>
                              <textarea
                                value={badge.customIconSvg || ''}
                                onChange={(e) => {
                                  const list = [...badges];
                                  list[idx] = { ...list[idx], customIconSvg: e.target.value };
                                  updateProp('badges', list);
                                }}
                                placeholder='<svg viewBox="0 0 24 24" ...>...</svg>'
                                className="w-full h-16 bg-stone-950 border border-stone-800 rounded px-2.5 py-1 text-[10px] font-mono text-stone-100 outline-none"
                              />
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Preset Icon</label>
                              <select
                                value={badge.icon || 'truck'}
                                onChange={(e) => {
                                  const list = [...badges];
                                  list[idx] = { ...list[idx], icon: e.target.value };
                                  updateProp('badges', list);
                                }}
                                className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs text-stone-100 outline-none"
                              >
                                <option value="truck">Truck (Free Shipping)</option>
                                <option value="rotate-ccw">Rotate CCW (Returns)</option>
                                <option value="lock">Lock (Secure Payment)</option>
                                <option value="shield">Shield (Warranty)</option>
                                <option value="award">Award (Certified)</option>
                                <option value="headphones">Headphones (Support)</option>
                                <option value="sparkles">Sparkles (Hallmark)</option>
                                <option value="star">Star (Trust)</option>
                                <option value="check">Check (Verified)</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Our Boutiques */}
            {type === 'Our Boutiques' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-800/40">
                  <List className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Stores Selection</span>
                </div>

                <p className="text-[10px] text-stone-400 leading-relaxed font-medium bg-stone-850/20 p-2.5 rounded border border-stone-800/40">
                  Toggle which physical showrooms display inside this block on the landing page.
                </p>

                <div className="border border-stone-800 bg-stone-950 rounded-xl divide-y divide-stone-850">
                  {storesList.map((store) => {
                    const isSelected = Array.isArray(content.selectedIds) && content.selectedIds.includes(store.id);
                    return (
                      <button
                        key={store.id}
                        onClick={() => toggleSelectedId('selectedIds', store.id)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left text-xs hover:bg-stone-900 transition-all cursor-pointer"
                      >
                        <div>
                          <span className="font-serif font-bold text-stone-200 block">{store.name}</span>
                          <span className="text-[9px] text-stone-500 font-medium block mt-0.5">{store.address}</span>
                        </div>
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                          isSelected ? 'bg-amber-500 border-amber-600 text-stone-950' : 'border-stone-700'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Button 1 (WhatsApp / Appointment) */}
                <div className="space-y-3 bg-stone-900/40 p-3 rounded-xl border border-stone-800/40 mt-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-stone-800/20">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Appointment Button Styling</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Button Text</label>
                    <input
                      type="text"
                      value={content.appointmentBtnText !== undefined ? content.appointmentBtnText : 'BOOK APPOINTMENT'}
                      onChange={(e) => updateProp('appointmentBtnText', e.target.value)}
                      placeholder="BOOK APPOINTMENT"
                      className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Background</label>
                      <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1 h-8">
                        <input
                          type="color"
                          value={content.appointmentBtnBg || '#059669'}
                          onChange={(e) => updateProp('appointmentBtnBg', e.target.value)}
                          className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                        />
                        <span className="text-[9px] font-mono text-stone-300 uppercase truncate">{content.appointmentBtnBg || '#059669'}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Text Color</label>
                      <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1 h-8">
                        <input
                          type="color"
                          value={content.appointmentBtnColor || '#ffffff'}
                          onChange={(e) => updateProp('appointmentBtnColor', e.target.value)}
                          className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                        />
                        <span className="text-[9px] font-mono text-stone-300 uppercase truncate">{content.appointmentBtnColor || '#FFFFFF'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase">Font Family</label>
                    <select
                      value={content.appointmentBtnFont || 'sans'}
                      onChange={(e) => updateProp('appointmentBtnFont', e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100 cursor-pointer"
                    >
                      <option value="serif">Heritage Serif</option>
                      <option value="sans">Modern Sans-serif</option>
                    </select>
                  </div>
                </div>

                {/* Button 2 (Google Maps) */}
                <div className="space-y-3 bg-stone-900/40 p-3 rounded-xl border border-stone-800/40 mt-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-stone-800/20">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Maps Button Styling</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Button Text</label>
                    <input
                      type="text"
                      value={content.mapsBtnText !== undefined ? content.mapsBtnText : 'GOOGLE MAPS'}
                      onChange={(e) => updateProp('mapsBtnText', e.target.value)}
                      placeholder="GOOGLE MAPS"
                      className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Background</label>
                      <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1 h-8">
                        <input
                          type="color"
                          value={content.mapsBtnBg || '#000000'}
                          onChange={(e) => updateProp('mapsBtnBg', e.target.value)}
                          className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                        />
                        <span className="text-[9px] font-mono text-stone-300 uppercase truncate">{content.mapsBtnBg || '#000000'}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Text Color</label>
                      <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1 h-8">
                        <input
                          type="color"
                          value={content.mapsBtnColor || '#ffffff'}
                          onChange={(e) => updateProp('mapsBtnColor', e.target.value)}
                          className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                        />
                        <span className="text-[9px] font-mono text-stone-300 uppercase truncate">{content.mapsBtnColor || '#FFFFFF'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase">Font Family</label>
                    <select
                      value={content.mapsBtnFont || 'sans'}
                      onChange={(e) => updateProp('mapsBtnFont', e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100 cursor-pointer"
                    >
                      <option value="serif">Heritage Serif</option>
                      <option value="sans">Modern Sans-serif</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Paragraph Document Form Controls */}
            {type === 'Paragraph Document' && (() => {
              const docSections = Array.isArray(content.sections) ? content.sections : [];

              const handleUpdateSection = (sIdx: number, field: string, val: any) => {
                const updated = [...docSections];
                updated[sIdx] = { ...updated[sIdx], [field]: val };
                updateProp('sections', updated);
              };

              const handleAddSection = () => {
                const newSec = {
                  heading: `${docSections.length + 1}. New Policy / Guideline`,
                  paragraphs: ['Enter document policy text here...'],
                  bulletPoints: ['Key clause point 1']
                };
                updateProp('sections', [...docSections, newSec]);
              };

              const handleRemoveSection = (sIdx: number) => {
                const updated = docSections.filter((_: any, i: number) => i !== sIdx);
                updateProp('sections', updated);
              };

              return (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-1 border-b border-stone-800/40">
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Document Settings</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wide">Document Title</label>
                    <input
                      type="text"
                      value={content.title || ''}
                      onChange={(e) => updateProp('title', e.target.value)}
                      placeholder="e.g. Privacy Policy, About Us..."
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wide">Document Subtitle / Category Badge</label>
                    <input
                      type="text"
                      value={content.subtitle || ''}
                      onChange={(e) => updateProp('subtitle', e.target.value)}
                      placeholder="e.g. PARASMONI SHOWROOM • LEGAL DOCUMENTATION"
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wide">Last Updated Badge</label>
                    <input
                      type="text"
                      value={content.lastUpdated || ''}
                      onChange={(e) => updateProp('lastUpdated', e.target.value)}
                      placeholder="e.g. Updated September 2026"
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wide">Grievance / Contact Notice Bar</label>
                    <textarea
                      rows={2}
                      value={content.contactNotice || ''}
                      onChange={(e) => updateProp('contactNotice', e.target.value)}
                      placeholder="e.g. For questions, contact support@parasmoni.in..."
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 focus:border-amber-500 outline-none resize-y"
                    />
                  </div>

                  {/* Document Sections List */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between border-b border-stone-800/40 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        Document Sections ({docSections.length})
                      </span>
                      <button
                        onClick={handleAddSection}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 hover:text-amber-400 bg-stone-900 border border-stone-800 px-2.5 py-1 rounded-md cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Section</span>
                      </button>
                    </div>

                    {docSections.map((sec: any, sIdx: number) => (
                      <div key={sIdx} className="bg-stone-950 border border-stone-800 rounded-xl p-3.5 space-y-3 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wide font-mono text-amber-500">
                            Section {sIdx + 1}
                          </span>
                          <button
                            onClick={() => handleRemoveSection(sIdx)}
                            className="p-1 text-stone-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                            title="Remove section"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase">Heading</label>
                          <input
                            type="text"
                            value={sec.heading || ''}
                            onChange={(e) => handleUpdateSection(sIdx, 'heading', e.target.value)}
                            placeholder="Section heading..."
                            className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 focus:border-amber-500 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase">Paragraphs (Separate by new line)</label>
                          <textarea
                            rows={3}
                            value={Array.isArray(sec.paragraphs) ? sec.paragraphs.join('\n\n') : (sec.paragraphs || '')}
                            onChange={(e) => handleUpdateSection(sIdx, 'paragraphs', e.target.value.split('\n\n').filter(Boolean))}
                            placeholder="Enter paragraph text..."
                            className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 focus:border-amber-500 outline-none resize-y"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase">Bullet Points (Separate by line break)</label>
                          <textarea
                            rows={2}
                            value={Array.isArray(sec.bulletPoints) ? sec.bulletPoints.join('\n') : (sec.bulletPoints || '')}
                            onChange={(e) => handleUpdateSection(sIdx, 'bulletPoints', e.target.value.split('\n').filter(Boolean))}
                            placeholder="Line 1 bullet point..."
                            className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 focus:border-amber-500 outline-none resize-y"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Blog Article Form Controls */}
            {type === 'Blog Article' && (() => {
              const blocks = Array.isArray(content.blocks) ? content.blocks : [];

              const handleUpdateBlock = (bIdx: number, field: string, val: any) => {
                const updated = [...blocks];
                updated[bIdx] = { ...updated[bIdx], [field]: val };
                updateProp('blocks', updated);
              };

              const handleAddBlock = (blockType: 'paragraph' | 'quote' | 'image_paragraph') => {
                let newBlk: any = { type: blockType };
                if (blockType === 'paragraph') {
                  newBlk = { type: 'paragraph', heading: 'New Subheading', text: 'Enter article story paragraph text here...' };
                } else if (blockType === 'quote') {
                  newBlk = { type: 'quote', text: 'Enter inspirational goldsmithing quote here...' };
                } else if (blockType === 'image_paragraph') {
                  newBlk = {
                    type: 'image_paragraph',
                    heading: 'Heritage Process Highlight',
                    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=1200',
                    caption: 'Master artisan detailing 22K gold pendant.',
                    text: 'Paragraph text describing the craftsmanship photo...'
                  };
                }
                updateProp('blocks', [...blocks, newBlk]);
              };

              const handleRemoveBlock = (bIdx: number) => {
                const updated = blocks.filter((_: any, i: number) => i !== bIdx);
                updateProp('blocks', updated);
              };

              return (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-1 border-b border-stone-800/40">
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Article Settings</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wide">Article Headline Title</label>
                    <input
                      type="text"
                      value={content.title || ''}
                      onChange={(e) => updateProp('title', e.target.value)}
                      placeholder="e.g. The Timeless Art of Nakashi..."
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wide">Journal Subtitle / Category Badge</label>
                    <input
                      type="text"
                      value={content.subtitle || ''}
                      onChange={(e) => updateProp('subtitle', e.target.value)}
                      placeholder="e.g. PARASMONI HERITAGE JOURNAL"
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wide">Article Lead Excerpt</label>
                    <textarea
                      rows={2}
                      value={content.excerpt || ''}
                      onChange={(e) => updateProp('excerpt', e.target.value)}
                      placeholder="Short summary paragraph..."
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 focus:border-amber-500 outline-none resize-y"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wide">Cover Image URL</label>
                    <input
                      type="text"
                      value={content.coverImage || ''}
                      onChange={(e) => updateProp('coverImage', e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  {/* Author Meta */}
                  <div className="grid grid-cols-2 gap-2.5 p-3 bg-stone-950 border border-stone-800 rounded-xl">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Author Name</label>
                      <input
                        type="text"
                        value={content.authorName || ''}
                        onChange={(e) => updateProp('authorName', e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-xs text-stone-100 focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Author Role</label>
                      <input
                        type="text"
                        value={content.authorRole || ''}
                        onChange={(e) => updateProp('authorRole', e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-xs text-stone-100 focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Publish Date</label>
                      <input
                        type="text"
                        value={content.publishDate || ''}
                        onChange={(e) => updateProp('publishDate', e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-xs text-stone-100 focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Read Time</label>
                      <input
                        type="text"
                        value={content.readTime || ''}
                        onChange={(e) => updateProp('readTime', e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-xs text-stone-100 focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Article Story Blocks */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between border-b border-stone-800/40 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        Story Blocks ({blocks.length})
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleAddBlock('paragraph')}
                        className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-stone-900 border border-stone-800 px-2.5 py-1.5 rounded hover:bg-stone-850 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Text Block</span>
                      </button>
                      <button
                        onClick={() => handleAddBlock('quote')}
                        className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-stone-900 border border-stone-800 px-2.5 py-1.5 rounded hover:bg-stone-850 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Quote Block</span>
                      </button>
                      <button
                        onClick={() => handleAddBlock('image_paragraph')}
                        className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-stone-900 border border-stone-800 px-2.5 py-1.5 rounded hover:bg-stone-850 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Image Block</span>
                      </button>
                    </div>

                    {blocks.map((blk: any, bIdx: number) => (
                      <div key={bIdx} className="bg-stone-950 border border-stone-800 rounded-xl p-3.5 space-y-2.5 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-wide font-mono text-amber-500">
                            Block {bIdx + 1} ({blk.type})
                          </span>
                          <button
                            onClick={() => handleRemoveBlock(bIdx)}
                            className="p-1 text-stone-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {blk.type === 'paragraph' && (
                          <>
                            <input
                              type="text"
                              value={blk.heading || ''}
                              onChange={(e) => handleUpdateBlock(bIdx, 'heading', e.target.value)}
                              placeholder="Subheading (optional)..."
                              className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 focus:border-amber-500 outline-none"
                            />
                            <textarea
                              rows={3}
                              value={blk.text || ''}
                              onChange={(e) => handleUpdateBlock(bIdx, 'text', e.target.value)}
                              placeholder="Paragraph story content..."
                              className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 focus:border-amber-500 outline-none resize-y"
                            />
                          </>
                        )}

                        {blk.type === 'quote' && (
                          <textarea
                            rows={2}
                            value={blk.text || ''}
                            onChange={(e) => handleUpdateBlock(bIdx, 'text', e.target.value)}
                            placeholder="Inspirational blockquote..."
                            className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 focus:border-amber-500 outline-none resize-y"
                          />
                        )}

                        {blk.type === 'image_paragraph' && (
                          <>
                            <input
                              type="text"
                              value={blk.heading || ''}
                              onChange={(e) => handleUpdateBlock(bIdx, 'heading', e.target.value)}
                              placeholder="Section heading..."
                              className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 focus:border-amber-500 outline-none"
                            />
                            <input
                              type="text"
                              value={blk.imageUrl || ''}
                              onChange={(e) => handleUpdateBlock(bIdx, 'imageUrl', e.target.value)}
                              placeholder="Image URL (https://...)..."
                              className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 focus:border-amber-500 outline-none"
                            />
                            <input
                              type="text"
                              value={blk.caption || ''}
                              onChange={(e) => handleUpdateBlock(bIdx, 'caption', e.target.value)}
                              placeholder="Photo caption..."
                              className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 focus:border-amber-500 outline-none"
                            />
                            <textarea
                              rows={3}
                              value={blk.text || ''}
                              onChange={(e) => handleUpdateBlock(bIdx, 'text', e.target.value)}
                              placeholder="Accompanying story paragraph..."
                              className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 focus:border-amber-500 outline-none resize-y"
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Inquiries & Commissions Form Controls */}
            {type === 'Inquiries & Commissions' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-800/40">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Inquiries & Commissions Settings</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wide">Category Tag / Eyebrow</label>
                  <input
                    type="text"
                    value={content.tag || 'INQUIRIES & COMMISSIONS'}
                    onChange={(e) => updateProp('tag', e.target.value)}
                    placeholder="e.g. INQUIRIES & COMMISSIONS"
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wide">Main Title</label>
                  <input
                    type="text"
                    value={content.title || 'Commission a Custom Legacy Piece'}
                    onChange={(e) => updateProp('title', e.target.value)}
                    placeholder="e.g. Commission a Custom Legacy Piece"
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wide">Description Subtitle</label>
                  <textarea
                    rows={3}
                    value={content.subtitle || ''}
                    onChange={(e) => updateProp('subtitle', e.target.value)}
                    placeholder="Connect directly with our showroom team..."
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 focus:border-amber-500 outline-none resize-y"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wide">Working Hours</label>
                    <input
                      type="text"
                      value={content.openHours || 'Open Mon - Sat'}
                      onChange={(e) => updateProp('openHours', e.target.value)}
                      placeholder="e.g. Open Mon - Sat"
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wide">Showroom Location</label>
                    <input
                      type="text"
                      value={content.location || 'Kolkata Bowbazar & Gariahat'}
                      onChange={(e) => updateProp('location', e.target.value)}
                      placeholder="e.g. Kolkata Bowbazar & Gariahat"
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. HERO BANNER SLIDES MANAGER */}
            {type === 'Hero Banner' && (() => {
              const slides: any[] = Array.isArray(content.banners) ? content.banners : (dbBanners.length > 0 ? dbBanners : mockBannersList);
              
              if (editingSlideIndex !== null) {
                const slide = slides[editingSlideIndex] || {
                  id: '',
                  title: '',
                  subtitle: '',
                  desktopImage: '',
                  mobileImage: '',
                  mediaType: 'image',
                  desktopVideo: '',
                  mobileVideo: '',
                  buttonText: 'EXPLORE MASTERPIECES',
                  buttonLink: '/catalog',
                  displayOrder: slides.length + 1,
                  status: 'active',
                  startDate: '',
                  endDate: '',
                  titleColor: '#ffffff',
                  titleFont: 'serif',
                  subtitleColor: '#f5f5f4',
                  subtitleFont: 'sans',
                  buttonColor: '#ffffff',
                  buttonTextColor: '#991b1b'
                };

                const updateSlideField = (field: string, value: any) => {
                  const updatedSlides = [...slides];
                  updatedSlides[editingSlideIndex] = {
                    ...slide,
                    [field]: value
                  };
                  updateProp('banners', updatedSlides);
                };

                const saveSlideToDb = async () => {
                  let slideId = slide.id;
                  if (!slideId) {
                    slideId = 'banner_' + Math.random().toString(36).substr(2, 9);
                    updateSlideField('id', slideId);
                  }
                  
                  // Keep in sync with Firestore
                  if (db) {
                    try {
                      const docRef = doc(db, 'banners', slideId);
                      const payload = {
                        title: (slide.title || '').trim(),
                        subtitle: (slide.subtitle || '').trim(),
                        desktopImage: slide.desktopImage || '',
                        mobileImage: slide.mobileImage || slide.desktopImage || '',
                        imageUrl: slide.desktopImage || '', // legacy compatibility
                        image: slide.desktopImage || '', // legacy compatibility
                        mediaType: slide.mediaType || 'image',
                        desktopVideo: slide.desktopVideo || '',
                        mobileVideo: slide.mobileVideo || '',
                        buttonText: (slide.buttonText || '').trim(),
                        buttonLink: (slide.buttonLink || '').trim(),
                        linkUrl: (slide.buttonLink || '').trim(), // legacy compatibility
                        displayOrder: Number(slide.displayOrder || 1),
                        status: slide.status || 'active',
                        startDate: slide.startDate || '',
                        endDate: slide.endDate || '',
                        titleColor: slide.titleColor || '#ffffff',
                        titleFont: slide.titleFont || 'serif',
                        subtitleColor: slide.subtitleColor || '#f5f5f4',
                        subtitleFont: slide.subtitleFont || 'sans',
                        buttonColor: slide.buttonColor || '#ffffff',
                        buttonTextColor: slide.buttonTextColor || '#991b1b',
                        updatedAt: new Date().toISOString()
                      };
                      await setDoc(docRef, payload, { merge: true });
                    } catch (e) {
                      console.error("Error saving banner to Firestore:", e);
                    }
                  }
                  setEditingSlideIndex(null);
                };

                return (
                  <div className="space-y-4" id="slide-form-editor">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                        {slide.id ? 'Edit Slide Details' : 'Add New Slide'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingSlideIndex(null)}
                        className="text-[10px] text-stone-400 hover:text-stone-200 uppercase font-bold"
                      >
                        ← Back to List
                      </button>
                    </div>

                    {/* Desktop & Mobile Images */}
                    <div className="space-y-3 p-3.5 bg-stone-950/40 border border-stone-850 rounded-xl">
                      <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest block">Media Assets</span>
                      
                      {/* Media Format */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-stone-400 uppercase font-bold">Media Type</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                            <input
                              type="radio"
                              name="slideMediaType"
                              value="image"
                              checked={slide.mediaType === 'image'}
                              onChange={() => updateSlideField('mediaType', 'image')}
                              className="text-amber-600 focus:ring-0 cursor-pointer"
                            />
                            <span>Image</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                            <input
                              type="radio"
                              name="slideMediaType"
                              value="video"
                              checked={slide.mediaType === 'video'}
                              onChange={() => updateSlideField('mediaType', 'video')}
                              className="text-amber-600 focus:ring-0 cursor-pointer"
                            />
                            <span>Video</span>
                          </label>
                        </div>
                      </div>

                      {slide.mediaType === 'image' ? (
                        <>
                          <div className="space-y-1">
                            <label className="text-[9px] text-stone-400 uppercase font-bold">Desktop Image</label>
                            <ImageUploader
                              id="slide-desktop-uploader"
                              value={slide.desktopImage || ''}
                              onChange={(url) => updateSlideField('desktopImage', url)}
                              folder={IMAGEKIT_FOLDERS.banners}
                            />
                          </div>
                          <div className="space-y-1 pt-1">
                            <label className="text-[9px] text-stone-400 uppercase font-bold">Mobile Image</label>
                            <ImageUploader
                              id="slide-mobile-uploader"
                              value={slide.mobileImage || ''}
                              onChange={(url) => updateSlideField('mobileImage', url)}
                              folder={IMAGEKIT_FOLDERS.banners}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1">
                            <label className="text-[9px] text-stone-400 uppercase font-bold">Desktop Video</label>
                            <ImageUploader
                              id="slide-desktop-video-uploader"
                              value={slide.desktopVideo || ''}
                              onChange={(url) => updateSlideField('desktopVideo', url)}
                              folder={IMAGEKIT_FOLDERS.banners}
                            />
                          </div>
                          <div className="space-y-1 pt-1">
                            <label className="text-[9px] text-stone-400 uppercase font-bold">Mobile Video</label>
                            <ImageUploader
                              id="slide-mobile-video-uploader"
                              value={slide.mobileVideo || ''}
                              onChange={(url) => updateSlideField('mobileVideo', url)}
                              folder={IMAGEKIT_FOLDERS.banners}
                            />
                          </div>
                          <div className="space-y-1 pt-1">
                            <label className="text-[9px] text-stone-400 uppercase font-bold">Poster/Fallback Image</label>
                            <ImageUploader
                              id="slide-poster-uploader"
                              value={slide.desktopImage || ''}
                              onChange={(url) => updateSlideField('desktopImage', url)}
                              folder={IMAGEKIT_FOLDERS.banners}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Headline and styling */}
                    <div className="space-y-3 p-3.5 bg-stone-950/40 border border-stone-850 rounded-xl">
                      <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest block">Title Text & Styling</span>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-stone-400 uppercase">Title Text</label>
                        <input
                          type="text"
                          value={slide.title || ''}
                          onChange={(e) => updateSlideField('title', e.target.value)}
                          placeholder="Headline..."
                          className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] text-stone-400 uppercase">Font Family</label>
                          <select
                            value={slide.titleFont || 'serif'}
                            onChange={(e) => updateSlideField('titleFont', e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs text-stone-100 outline-none"
                          >
                            <option value="serif">Playfair (Serif)</option>
                            <option value="sans">Jakarta (Sans)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-stone-400 uppercase block">Text Color</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={slide.titleColor || '#ffffff'}
                              onChange={(e) => updateSlideField('titleColor', e.target.value)}
                              className="w-6 h-6 rounded border border-stone-800 bg-transparent outline-none cursor-pointer overflow-hidden"
                            />
                            <span className="text-[10px] font-mono text-stone-300 uppercase">{slide.titleColor || '#ffffff'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Subtitle and styling */}
                    <div className="space-y-3 p-3.5 bg-stone-950/40 border border-stone-850 rounded-xl">
                      <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest block">Subtitle Text & Styling</span>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-stone-400 uppercase">Subtitle / Copy Text</label>
                        <textarea
                          rows={2}
                          value={slide.subtitle || ''}
                          onChange={(e) => updateSlideField('subtitle', e.target.value)}
                          placeholder="Subtitle details..."
                          className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100 resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] text-stone-400 uppercase">Font Family</label>
                          <select
                            value={slide.subtitleFont || 'sans'}
                            onChange={(e) => updateSlideField('subtitleFont', e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs text-stone-100 outline-none"
                          >
                            <option value="serif">Playfair (Serif)</option>
                            <option value="sans">Jakarta (Sans)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-stone-400 uppercase block">Text Color</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={slide.subtitleColor || '#f5f5f4'}
                              onChange={(e) => updateSlideField('subtitleColor', e.target.value)}
                              className="w-6 h-6 rounded border border-stone-800 bg-transparent outline-none cursor-pointer overflow-hidden"
                            />
                            <span className="text-[10px] font-mono text-stone-300 uppercase">{slide.subtitleColor || '#f5f5f4'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Button Text & Link */}
                    <div className="space-y-3 p-3.5 bg-stone-950/40 border border-stone-850 rounded-xl">
                      <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest block">Button CTA & Colors</span>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-stone-400 uppercase">Button Text</label>
                        <input
                          type="text"
                          value={slide.buttonText || ''}
                          onChange={(e) => updateSlideField('buttonText', e.target.value)}
                          placeholder="Button label..."
                          className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] text-stone-400 uppercase block">BG Color</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={slide.buttonColor || '#ffffff'}
                              onChange={(e) => updateSlideField('buttonColor', e.target.value)}
                              className="w-6 h-6 rounded border border-stone-800 bg-transparent outline-none cursor-pointer overflow-hidden"
                            />
                            <span className="text-[10px] font-mono text-stone-300 uppercase">{slide.buttonColor || '#ffffff'}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-stone-400 uppercase block">Text Color</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={slide.buttonTextColor || '#991b1b'}
                              onChange={(e) => updateSlideField('buttonTextColor', e.target.value)}
                              className="w-6 h-6 rounded border border-stone-800 bg-transparent outline-none cursor-pointer overflow-hidden"
                            />
                            <span className="text-[10px] font-mono text-stone-300 uppercase">{slide.buttonTextColor || '#991b1b'}</span>
                          </div>
                        </div>
                      </div>

                      <LinkToControl
                        label="Button Redirection Link"
                        value={slide.buttonLink || ''}
                        onChange={(newUrl) => updateSlideField('buttonLink', newUrl)}
                        categories={categoriesList}
                        collections={collectionsList}
                      />
                    </div>

                    {/* Metadata: status, displayOrder, dates */}
                    <div className="space-y-3 p-3.5 bg-stone-950/40 border border-stone-850 rounded-xl">
                      <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest block">Metadata & Schedule</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] text-stone-400 uppercase font-bold">Display Order</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={slide.displayOrder || 1}
                            onChange={(e) => updateSlideField('displayOrder', parseInt(e.target.value) || 1)}
                            className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1 text-xs text-stone-100 font-mono text-center"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-stone-400 uppercase font-bold">Status</label>
                          <select
                            value={slide.status || 'active'}
                            onChange={(e) => updateSlideField('status', e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs text-stone-100"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Draft</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] text-stone-400 uppercase">Start Date</label>
                          <input
                            type="date"
                            value={slide.startDate || ''}
                            onChange={(e) => updateSlideField('startDate', e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs text-stone-300"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-stone-400 uppercase">Expiry Date</label>
                          <input
                            type="date"
                            value={slide.endDate || ''}
                            onChange={(e) => updateSlideField('endDate', e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs text-stone-300"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={saveSlideToDb}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold uppercase text-xs rounded transition-all"
                    >
                      Save Slide Settings
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Promotional Slides List</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newSlideIndex = slides.length;
                        const newSlide = {
                          id: 'banner_' + Math.random().toString(36).substr(2, 9),
                          title: '',
                          subtitle: '',
                          desktopImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200',
                          mobileImage: '',
                          mediaType: 'image',
                          desktopVideo: '',
                          mobileVideo: '',
                          buttonText: 'EXPLORE MASTERPIECES',
                          buttonLink: '/catalog',
                          displayOrder: slides.length + 1,
                          status: 'active',
                          startDate: '',
                          endDate: '',
                          titleColor: '#ffffff',
                          titleFont: 'serif',
                          subtitleColor: '#f5f5f4',
                          subtitleFont: 'sans',
                          buttonColor: '#ffffff',
                          buttonTextColor: '#991b1b'
                        };
                        const updated = [...slides, newSlide];
                        updateProp('banners', updated);
                        setEditingSlideIndex(newSlideIndex);
                      }}
                      className="text-[10px] text-amber-500 hover:text-amber-400 uppercase font-bold"
                    >
                      + Add New Slide
                    </button>
                  </div>

                  <p className="text-[9px] text-stone-500 leading-normal">
                    💡 This slider loops infinitely. Edit slide details, reorder sequences, or draft temporary seasonal promotions. Saving changes propagates across both the page template and the database catalog.
                  </p>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {slides.map((s, index) => {
                      const isInactive = s.status === 'inactive';
                      return (
                        <div 
                          key={s.id ? `${s.id}-${index}` : `slide-${index}`}
                          className={`flex items-center gap-3 p-2 bg-stone-950 border rounded-lg transition-all ${
                            isInactive ? 'border-stone-900 opacity-60' : 'border-stone-850 hover:border-stone-800'
                          }`}
                        >
                          <div className="w-12 h-8 rounded overflow-hidden shrink-0 bg-stone-900">
                            {s.desktopImage ? (
                              <img src={s.desktopImage} alt={s.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-700">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h5 className="text-[11px] font-bold text-stone-200 truncate">{s.title || 'Untitled Slide'}</h5>
                            <p className="text-[9px] text-stone-500 font-mono">Order #{s.displayOrder || (index + 1)} | {s.status}</p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingSlideIndex(index)}
                              className="px-2 py-1 bg-stone-850 hover:bg-stone-800 text-[10px] text-amber-500 hover:text-amber-400 font-bold uppercase rounded"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm("Are you sure you want to delete this slide?")) {
                                  const updated = slides.filter((_, idx) => idx !== index);
                                  updateProp('banners', updated);
                                  if (s.id && db) {
                                    try {
                                      await deleteDoc(doc(db, 'banners', s.id));
                                    } catch (err) {
                                      console.error("Error deleting slide from db:", err);
                                    }
                                  }
                                }
                              }}
                              className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900/40 text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase rounded"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </>
        ) : (
          /* ==================== STYLE TAB ==================== */
          <div className="space-y-6">
            {/* 1. LAYOUT & CONFIGS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-stone-800/40">
                <Layout className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Layout Configurations</span>
              </div>

              {type === 'Split Media Banner' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase">Media Alignment</label>
                  <div className="grid grid-cols-2 gap-2 bg-stone-950 p-1 rounded border border-stone-850">
                    <button
                      onClick={() => updateProp('alignMedia', 'left')}
                      className={`py-1.5 text-[10px] font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
                        content.alignMedia === 'left' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Media Left
                    </button>
                    <button
                      onClick={() => updateProp('alignMedia', 'right')}
                      className={`py-1.5 text-[10px] font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
                        content.alignMedia !== 'left' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Media Right
                    </button>
                  </div>
                </div>
              )}

              {type === 'Infinite Marquee' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-400 uppercase block">Background Color</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={content.bgColor || '#0c0a09'}
                        onChange={(e) => updateProp('bgColor', e.target.value)}
                        className="w-8 h-8 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden"
                      />
                      <span className="text-xs font-mono text-stone-300 uppercase">{content.bgColor || '#0C0A09'}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-400 uppercase block">Text Accent Color</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={content.textColor || '#d97706'}
                        onChange={(e) => updateProp('textColor', e.target.value)}
                        className="w-8 h-8 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden"
                      />
                      <span className="text-xs font-mono text-stone-300 uppercase">{content.textColor || '#D97706'}</span>
                    </div>
                  </div>
                </div>
              )}

              {(type === 'About Collection' || type === 'Story Collage') && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase block">Section Background Color</label>
                  <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5">
                    <input
                      type="color"
                      value={content.backgroundColor || '#0c0a09'}
                      onChange={(e) => updateProp('backgroundColor', e.target.value)}
                      className="w-8 h-8 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                    />
                    <span className="text-xs font-mono text-stone-300 uppercase">{content.backgroundColor || '#0C0A09'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. TEXT TYPOGRAPHY STYLING (For banner layouts) */}
            {(isTextBannerLayout || type === 'OG Offer Collection') && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-800/40">
                  <Palette className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Typography & CTA Styles</span>
                </div>

                {/* Subtitle Style Panel */}
                <div className="bg-stone-850/40 p-4 rounded-xl border border-stone-800/50 space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Subtitle Eyebrow Styling</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Font Family</label>
                      <select
                        value={content.subtitleStyle?.fontFamily || 'sans'}
                        onChange={(e) => updateNestedProp('subtitleStyle', 'fontFamily', e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100 cursor-pointer"
                      >
                        <option value="serif">Heritage Serif</option>
                        <option value="sans">Modern Sans-serif</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Text Color</label>
                      <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                        <input
                          type="color"
                          value={content.subtitleStyle?.color || '#d97706'}
                          onChange={(e) => updateNestedProp('subtitleStyle', 'color', e.target.value)}
                          className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                        />
                        <span className="text-[10px] font-mono text-stone-300 uppercase truncate">{content.subtitleStyle?.color || '#D97706'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-bold text-stone-400 uppercase">
                      <span>Font Size Override</span>
                      <span className="font-mono text-amber-500">{content.subtitleStyle?.fontSize || 'Default'} px</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={24}
                      value={content.subtitleStyle?.fontSize || 12}
                      onChange={(e) => updateNestedProp('subtitleStyle', 'fontSize', parseInt(e.target.value))}
                      className="w-full h-1 bg-stone-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>

                {/* Title Style Panel */}
                <div className="bg-stone-850/40 p-4 rounded-xl border border-stone-800/50 space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Header Title Styling</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Font Family</label>
                      <select
                        value={content.titleStyle?.fontFamily || 'serif'}
                        onChange={(e) => updateNestedProp('titleStyle', 'fontFamily', e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100 cursor-pointer"
                      >
                        <option value="serif">Heritage Serif</option>
                        <option value="sans">Modern Sans-serif</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Text Color</label>
                      <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                        <input
                          type="color"
                          value={content.titleStyle?.color || '#1c1917'}
                          onChange={(e) => updateNestedProp('titleStyle', 'color', e.target.value)}
                          className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                        />
                        <span className="text-[10px] font-mono text-stone-300 uppercase truncate">{content.titleStyle?.color || '#1C1917'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-bold text-stone-400 uppercase">
                      <span>Font Size Override</span>
                      <span className="font-mono text-amber-500">{content.titleStyle?.fontSize || 'Default'} px</span>
                    </div>
                    <input
                      type="range"
                      min={16}
                      max={96}
                      value={content.titleStyle?.fontSize || 36}
                      onChange={(e) => updateNestedProp('titleStyle', 'fontSize', parseInt(e.target.value))}
                      className="w-full h-1 bg-stone-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>

                {/* Description Style Panel */}
                {type !== 'OG Offer Collection' && (
                  <div className="bg-stone-850/40 p-4 rounded-xl border border-stone-800/50 space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Description Body Styling</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Font Family</label>
                        <select
                          value={content.descriptionStyle?.fontFamily || 'sans'}
                          onChange={(e) => updateNestedProp('descriptionStyle', 'fontFamily', e.target.value)}
                          className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100 cursor-pointer"
                        >
                          <option value="serif">Heritage Serif</option>
                          <option value="sans">Modern Sans-serif</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Text Color</label>
                        <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                          <input
                            type="color"
                            value={content.descriptionStyle?.color || '#78716c'}
                            onChange={(e) => updateNestedProp('descriptionStyle', 'color', e.target.value)}
                            className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                          />
                          <span className="text-[10px] font-mono text-stone-300 uppercase truncate">{content.descriptionStyle?.color || '#78716C'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-bold text-stone-400 uppercase">
                        <span>Font Size Override</span>
                        <span className="font-mono text-amber-500">{content.descriptionStyle?.fontSize || 'Default'} px</span>
                      </div>
                      <input
                        type="range"
                        min={12}
                        max={32}
                        value={content.descriptionStyle?.fontSize || 14}
                        onChange={(e) => updateNestedProp('descriptionStyle', 'fontSize', parseInt(e.target.value))}
                        className="w-full h-1 bg-stone-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  </div>
                )}

                {/* Narrative Quote Style Panel */}
                {(type === 'About Collection' || type === 'Story Collage') && (
                  <div className="bg-stone-850/40 p-4 rounded-xl border border-stone-800/50 space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Narrative Quote Styling (Italic)</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Font Family</label>
                        <select
                          value={content.quoteStyle?.fontFamily || 'serif'}
                          onChange={(e) => updateNestedProp('quoteStyle', 'fontFamily', e.target.value)}
                          className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100 cursor-pointer"
                        >
                          <option value="serif">Heritage Serif</option>
                          <option value="sans">Modern Sans-serif</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Text Color</label>
                        <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                          <input
                            type="color"
                            value={content.quoteStyle?.color || '#a8a29e'}
                            onChange={(e) => updateNestedProp('quoteStyle', 'color', e.target.value)}
                            className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                          />
                          <span className="text-[10px] font-mono text-stone-300 uppercase truncate">{content.quoteStyle?.color || '#A8A29E'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-bold text-stone-400 uppercase">
                        <span>Font Size Override</span>
                        <span className="font-mono text-amber-500">{content.quoteStyle?.fontSize || 'Default'} px</span>
                      </div>
                      <input
                        type="range"
                        min={12}
                        max={32}
                        value={content.quoteStyle?.fontSize || 14}
                        onChange={(e) => updateNestedProp('quoteStyle', 'fontSize', parseInt(e.target.value))}
                        className="w-full h-1 bg-stone-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  </div>
                )}

                {/* Bullets Style Panel */}
                {(type === 'About Collection' || type === 'Story Collage') && (
                  <div className="bg-stone-850/40 p-4 rounded-xl border border-stone-800/50 space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Bullet Points Styling</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Font Family</label>
                        <select
                          value={content.bulletStyle?.fontFamily || 'sans'}
                          onChange={(e) => updateNestedProp('bulletStyle', 'fontFamily', e.target.value)}
                          className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100 cursor-pointer"
                        >
                          <option value="serif">Heritage Serif</option>
                          <option value="sans">Modern Sans-serif</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Text Color</label>
                        <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                          <input
                            type="color"
                            value={content.bulletStyle?.color || '#a8a29e'}
                            onChange={(e) => updateNestedProp('bulletStyle', 'color', e.target.value)}
                            className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                          />
                          <span className="text-[10px] font-mono text-stone-300 uppercase truncate">{content.bulletStyle?.color || '#A8A29E'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-bold text-stone-400 uppercase">
                        <span>Font Size Override</span>
                        <span className="font-mono text-amber-500">{content.bulletStyle?.fontSize || 'Default'} px</span>
                      </div>
                      <input
                        type="range"
                        min={11}
                        max={24}
                        value={content.bulletStyle?.fontSize || 13}
                        onChange={(e) => updateNestedProp('bulletStyle', 'fontSize', parseInt(e.target.value))}
                        className="w-full h-1 bg-stone-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-stone-800/30">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Marker Icon</label>
                        <select
                          value={content.bulletStyle?.iconName || 'sparkle'}
                          onChange={(e) => updateNestedProp('bulletStyle', 'iconName', e.target.value)}
                          className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100 cursor-pointer"
                        >
                          <option value="sparkle">Sparkle Star</option>
                          <option value="check">Checkmark</option>
                          <option value="gem">Diamond Gem</option>
                          <option value="chevron">Chevron Arrow</option>
                          <option value="circle">Clock Icon</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Marker Color</label>
                        <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                          <input
                            type="color"
                            value={content.bulletStyle?.iconColor || '#d4af37'}
                            onChange={(e) => updateNestedProp('bulletStyle', 'iconColor', e.target.value)}
                            className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                          />
                          <span className="text-[10px] font-mono text-stone-300 uppercase truncate">{content.bulletStyle?.iconColor || '#D4AF37'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Button Style Panel */}
                {type !== 'OG Offer Collection' && (
                  <div className="bg-stone-850/40 p-4 rounded-xl border border-stone-800/50 space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Primary Button Styling</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Bg Color</label>
                        <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                          <input
                            type="color"
                            value={content.primaryButton?.bgColor || '#b45309'}
                            onChange={(e) => updateNestedProp('primaryButton', 'bgColor', e.target.value)}
                            className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                          />
                          <span className="text-[10px] font-mono text-stone-300 uppercase truncate">{content.primaryButton?.bgColor || '#B45309'}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Text Color</label>
                        <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                          <input
                            type="color"
                            value={content.primaryButton?.textColor || '#ffffff'}
                            onChange={(e) => updateNestedProp('primaryButton', 'textColor', e.target.value)}
                            className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                          />
                          <span className="text-[10px] font-mono text-stone-300 uppercase truncate">{content.primaryButton?.textColor || '#FFFFFF'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Font Family</label>
                        <select
                          value={content.primaryButton?.fontFamily || 'sans'}
                          onChange={(e) => updateNestedProp('primaryButton', 'fontFamily', e.target.value)}
                          className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100 cursor-pointer"
                        >
                          <option value="serif">Heritage Serif</option>
                          <option value="sans">Modern Sans-serif</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase block">Font Size px</label>
                        <input
                          type="number"
                          min={10}
                          max={30}
                          value={content.primaryButton?.fontSize || 12}
                          onChange={(e) => updateNestedProp('primaryButton', 'fontSize', parseInt(e.target.value) || 12)}
                          className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs focus:border-amber-500/50 outline-none text-stone-100 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Secondary Button Style Panel */}
                {type !== 'OG Offer Collection' && (
                  <div className="bg-stone-850/40 p-4 rounded-xl border border-stone-800/50 space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Secondary Button Styling</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Bg Color</label>
                        <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                          <input
                            type="color"
                            value={content.secondaryButton?.bgColor || '#1c1917'}
                            onChange={(e) => updateNestedProp('secondaryButton', 'bgColor', e.target.value)}
                            className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                          />
                          <span className="text-[10px] font-mono text-stone-300 uppercase truncate">{content.secondaryButton?.bgColor || '#1C1917'}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Text Color</label>
                        <div className="flex gap-2 items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                          <input
                            type="color"
                            value={content.secondaryButton?.textColor || '#ffffff'}
                            onChange={(e) => updateNestedProp('secondaryButton', 'textColor', e.target.value)}
                            className="w-5 h-5 rounded border border-stone-700 bg-transparent outline-none cursor-pointer overflow-hidden shrink-0"
                          />
                          <span className="text-[10px] font-mono text-stone-300 uppercase truncate">{content.secondaryButton?.textColor || '#FFFFFF'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Font Family</label>
                        <select
                          value={content.secondaryButton?.fontFamily || 'sans'}
                          onChange={(e) => updateNestedProp('secondaryButton', 'fontFamily', e.target.value)}
                          className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs focus:border-amber-500/50 outline-none text-stone-100 cursor-pointer"
                        >
                          <option value="serif">Heritage Serif</option>
                          <option value="sans">Modern Sans-serif</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase block">Font Size px</label>
                        <input
                          type="number"
                          min={10}
                          max={30}
                          value={content.secondaryButton?.fontSize || 12}
                          onChange={(e) => updateNestedProp('secondaryButton', 'fontSize', parseInt(e.target.value) || 12)}
                          className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs focus:border-amber-500/50 outline-none text-stone-100 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer Action Controls at Bottom (Matching reference style exactly) */}
      <div className="p-4 border-t border-stone-850 bg-stone-950 flex flex-col gap-2 shrink-0">
        <div className="grid grid-cols-2 gap-3">
          {/* Save Button */}
          <button
            onClick={onSave}
            className="h-11 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-stone-950 text-xs font-bold tracking-widest uppercase transition-all rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-950/20"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>Commit Section</span>
          </button>

          {/* Reset button */}
          <button
            onClick={onReset}
            className="h-11 border border-stone-800 text-stone-300 hover:bg-stone-900 active:scale-[0.98] text-xs font-bold tracking-widest uppercase transition-all rounded-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>Discard Changes</span>
          </button>
        </div>
      </div>

      {/* Dynamic Product Browse & Selection Modal Overlay */}
      {isBrowseModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 font-sans text-stone-200">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative animate-scale-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950 shrink-0">
              <div>
                <h3 className="font-serif text-lg font-bold text-amber-500 flex items-center gap-2">
                  <List className="w-5 h-5 text-amber-500 animate-pulse" />
                  <span>Browse & Select Products</span>
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  Touch products in the list below to toggle selection. Click "Apply & Save Selection" when finished.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBrowseModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-850 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Filter and Search Bar */}
            <div className="p-4 border-b border-stone-800 bg-stone-900/60 flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
              {/* Search Bar */}
              <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 w-full md:max-w-md shrink-0">
                <Search className="w-4 h-4 text-stone-500 mr-2.5 shrink-0" />
                <input
                  type="text"
                  value={browseSearchQuery}
                  onChange={(e) => setBrowseSearchQuery(e.target.value)}
                  placeholder="Search products by SKU, name, or metal..."
                  className="bg-transparent border-none outline-none text-sm text-stone-200 placeholder-stone-600 w-full"
                />
                {browseSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setBrowseSearchQuery('')}
                    className="text-stone-500 hover:text-stone-300 text-xs font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Categories Pills */}
              <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                {['all', ...categoriesList.map(c => c.name)].map((cat) => {
                  const label = cat === 'all' ? 'All Products' : cat;
                  const isSelected = browseSelectedCategory.toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setBrowseSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        isSelected
                          ? 'bg-amber-500 border-amber-600 text-stone-950 font-extrabold'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 font-semibold'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Product Grid */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-stone-950/20">
              {(() => {
                const filteredProducts = productsList.filter(p => {
                  // Search query filter
                  const matchesSearch = (p.name || '').toLowerCase().includes(browseSearchQuery.toLowerCase()) || 
                                        (p.sku || '').toLowerCase().includes(browseSearchQuery.toLowerCase()) ||
                                        (p.metalType || '').toLowerCase().includes(browseSearchQuery.toLowerCase()) ||
                                        (p.category || '').toLowerCase().includes(browseSearchQuery.toLowerCase());
                  
                  // Category filter
                  const matchesCategory = browseSelectedCategory === 'all' || 
                                          (p.category || '').toLowerCase() === browseSelectedCategory.toLowerCase();
                  
                  return matchesSearch && matchesCategory;
                });

                if (filteredProducts.length === 0) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                      <p className="text-sm text-stone-500 italic">No products found matching your search or category selection.</p>
                      <button
                        type="button"
                        onClick={() => { setBrowseSearchQuery(''); setBrowseSelectedCategory('all'); }}
                        className="mt-4 px-4 py-2 bg-stone-900 border border-stone-800 hover:bg-stone-850 text-stone-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((p) => {
                      const isSelected = tempSelectedIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleTempSelectedId(p.id)}
                          className={`group border rounded-2xl bg-stone-900/60 p-3 flex flex-col transition-all cursor-pointer relative select-none ${
                            isSelected 
                              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-lg shadow-amber-950/15' 
                              : 'border-stone-800/80 hover:border-stone-700 hover:bg-stone-850/50'
                          }`}
                        >
                          {/* Image Box */}
                          <div className="aspect-square w-full bg-stone-950 rounded-xl overflow-hidden border border-stone-850 relative shrink-0">
                            <img 
                              src={p.imageUrl} 
                              alt={p.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                              referrerPolicy="no-referrer" 
                            />
                            {/* Checkmark indicator badge */}
                            <div className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                              isSelected 
                                ? 'bg-amber-500 border-amber-600 text-stone-950 scale-110 shadow' 
                                : 'bg-black/50 border-white/20 text-transparent'
                            }`}>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>

                            {/* Badge label overlay */}
                            {p.badgeLabel && (
                              <div 
                                className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-white"
                                style={{ backgroundColor: p.badgeColor || '#927230' }}
                              >
                                {p.badgeLabel}
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="mt-3 flex-1 flex flex-col justify-between min-w-0">
                            <div className="min-w-0">
                              <h4 className="font-serif text-xs font-bold text-stone-100 truncate group-hover:text-amber-500 transition-colors">{p.name}</h4>
                              <p className="text-[9px] text-stone-500 font-mono mt-0.5 truncate">{p.sku}</p>
                              <div className="flex gap-1.5 items-center mt-1">
                                <span className="text-[9px] bg-stone-950 text-stone-400 px-1.5 py-0.5 rounded border border-stone-850 capitalize">
                                  {p.metalType || 'Gold'}
                                </span>
                                {p.approxWeight && (
                                  <span className="text-[9px] bg-stone-950 text-stone-400 px-1.5 py-0.5 rounded border border-stone-850">
                                    {p.approxWeight}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Price / Selection State */}
                            <div className="mt-3.5 pt-2.5 border-t border-stone-850 flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-500/90">
                                {p.priceVisibility !== false && p.price > 0 ? `₹${p.price.toLocaleString('en-IN')}` : 'Contact Price'}
                              </span>
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                isSelected ? 'text-amber-500' : 'text-stone-500'
                              }`}>
                                {isSelected ? 'Selected' : 'Deselected'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Modal Sticky Footer Controls */}
            <div className="p-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between shrink-0 font-sans">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-stone-400">
                  Selected Count:
                </span>
                <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-500 font-mono text-sm font-bold rounded-xl">
                  {tempSelectedIds.length} Products
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsBrowseModalOpen(false)}
                  className="px-5 h-11 border border-stone-800 text-stone-400 hover:bg-stone-900 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveBrowseSelection}
                  className="px-6 h-11 bg-amber-600 hover:bg-amber-700 text-stone-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-950/20 active:scale-95"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>Apply & Save Selection</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
