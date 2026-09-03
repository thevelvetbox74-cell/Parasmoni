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
  Plus
} from 'lucide-react';
import { ImageUploader } from './ImageUploader';
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
    'Shop The Look'
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

            {/* Shop The Look & Product Carousel */}
            {['Product Carousel', 'Shop The Look'].includes(type) && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-800/40">
                  <List className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Products Selection</span>
                </div>

                {type === 'Product Carousel' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-400 uppercase">Carousel Mode</label>
                    <select
                      value={content.productsType || 'featured'}
                      onChange={(e) => updateProp('productsType', e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs focus:border-amber-500/50 outline-none text-stone-100"
                    >
                      <option value="featured">Featured Masterpieces</option>
                      <option value="new">Fresh Showroom Arrivals</option>
                      <option value="custom">Custom Handpicked Products</option>
                    </select>
                  </div>
                )}

                {(type === 'Shop The Look' || content.productsType === 'custom') && (
                  <div className="space-y-3">
                    <div className="flex items-center bg-stone-950 border border-stone-800 rounded px-3 py-1.5">
                      <Search className="w-3.5 h-3.5 text-stone-500 mr-2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products by SKU or name..."
                        className="bg-transparent border-none outline-none text-xs text-stone-200 placeholder-stone-600 w-full"
                      />
                    </div>

                    <div className="border border-stone-800 bg-stone-950 rounded-xl max-h-56 overflow-y-auto divide-y divide-stone-850">
                      {productsList
                        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((p) => {
                          const isSelected = Array.isArray(content.selectedIds) && content.selectedIds.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => toggleSelectedId('selectedIds', p.id)}
                              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-stone-900 transition-all cursor-pointer"
                            >
                              <div className="w-10 h-10 bg-stone-800 rounded overflow-hidden flex-shrink-0 border border-stone-800">
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-[11px] font-serif font-bold text-stone-200 truncate">{p.name}</h5>
                                <p className="text-[9px] text-stone-500 font-mono tracking-wider">{p.sku} | {p.metalType}</p>
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
                  </div>
                )}
              </div>
            )}

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
                          key={s.id || index}
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
    </div>
  );
}
