/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Section Content Editor Sidebar Panel
 */

import React, { useState } from 'react';
import { 
  X, 
  Check, 
  RotateCcw, 
  Palette, 
  Type, 
  Link as LinkIcon, 
  Plus, 
  ImageIcon, 
  FileText, 
  Trash2, 
  Layout,
  MousePointer,
  ChevronRight,
  Eye,
  Sliders,
  Sparkles
} from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { IMAGEKIT_FOLDERS } from '../imagekit/client';
import { SmartLinkPicker } from './SmartLinkPicker';

interface SectionEditorProps {
  section: { id: string; type: string; content: any };
  onUpdateContent: (content: any) => void;
  onClose: () => void;
  categories: any[];
  products: any[];
  collections: any[];
  stores: any[];
}

export function SectionEditor({
  section,
  onUpdateContent,
  onClose,
  categories = [],
  products = [],
  collections = [],
  stores = []
}: SectionEditorProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'content' | 'styles' | 'actions'>('content');
  const content = section.content || {};

  // Resolve current Link settings for Primary Button
  const primaryBtn = content.primaryButton || {};
  const [primaryLinkMode, setPrimaryLinkMode] = useState<'category_collection' | 'custom'>(
    primaryBtn.linkUrl && (primaryBtn.linkUrl.startsWith('/category/') || primaryBtn.linkUrl.startsWith('/collections/'))
      ? 'category_collection'
      : 'custom'
  );

  // Resolve current Link settings for Secondary Button
  const secondaryBtn = content.secondaryButton || {};
  const [secondaryLinkMode, setSecondaryLinkMode] = useState<'category_collection' | 'custom'>(
    secondaryBtn.linkUrl && (secondaryBtn.linkUrl.startsWith('/category/') || secondaryBtn.linkUrl.startsWith('/collections/'))
      ? 'category_collection'
      : 'custom'
  );

  // Style updater helper
  const handleStyleChange = (styleKey: string, key: string, val: any) => {
    const existingStyle = content[styleKey] || {};
    onUpdateContent({
      [styleKey]: {
        ...existingStyle,
        [key]: val
      }
    });
  };

  // Button updater helper
  const handleButtonChange = (btnKey: 'primaryButton' | 'secondaryButton', key: string, val: any) => {
    const existingBtn = content[btnKey] || {};
    onUpdateContent({
      [btnKey]: {
        ...existingBtn,
        [key]: val
      }
    });
  };

  // Multi-select toggle helper for Grid components
  const handleToggleSelectedId = (id: string) => {
    const currentIds = content.selectedIds || [];
    let updated;
    if (currentIds.includes(id)) {
      updated = currentIds.filter((item: string) => item !== id);
    } else {
      updated = [...currentIds, id];
    }
    onUpdateContent({ selectedIds: updated });
  };

  const isBannerStyle = ['Hero Banner', 'Split Media Banner', 'About Collection', 'Story Collage', 'Media Slider'].includes(section.type);
  const isGridStyle = ['Category Cards', 'Product Carousel', 'Shop The Look', 'Our Boutiques'].includes(section.type);

  return (
    <div className="flex flex-col h-full bg-stone-900 text-stone-200 border-l border-stone-800" id={`editor-panel-${section.id}`}>
      
      {/* 1. Header Row */}
      <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/45">
        <div className="space-y-0.5">
          <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
            Active Editor
          </span>
          <h3 className="text-xs font-serif font-bold text-stone-100 tracking-wider uppercase mt-1">
            {section.type}
          </h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 text-stone-400 hover:text-stone-100 rounded hover:bg-stone-850 cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Secondary Tab Switcher */}
      <div className="flex border-b border-stone-850 bg-stone-900/60 p-1 gap-1" id="editor-tab-switcher">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'content' ? 'bg-stone-800 text-amber-400 border border-stone-700/50' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850/50'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Layout Content</span>
        </button>
        {isBannerStyle && (
          <button
            onClick={() => setActiveTab('styles')}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'styles' ? 'bg-stone-800 text-amber-400 border border-stone-700/50' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Typography & Color</span>
          </button>
        )}
        {isBannerStyle && (
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'actions' ? 'bg-stone-800 text-amber-400 border border-stone-700/50' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850/50'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Action Buttons</span>
          </button>
        )}
      </div>

      {/* 3. Fields Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6" id="editor-fields-scroller">
        
        {activeTab === 'content' && (
          <div className="space-y-6 animate-fade-in">
            {/* TEXT FIELDS (If not Marquee) */}
            {section.type !== 'Infinite Marquee' && (
              <div className="space-y-4">
                <h4 className="text-[10px] text-amber-500 font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>Scribe Copy Sement</span>
                </h4>
                
                {section.type !== 'Our Boutiques' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Subtitle Label</label>
                    <input 
                      type="text"
                      value={content.subtitle || ''}
                      onChange={(e) => onUpdateContent({ subtitle: e.target.value })}
                      placeholder="SUBTITLE OVERVIEW..."
                      className="w-full bg-stone-950 border border-stone-800 focus:border-amber-600/50 text-stone-200 text-xs px-3.5 py-2.5 rounded-lg font-mono focus:outline-none placeholder:text-stone-600 transition-colors"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Large Title Header</label>
                  <input 
                    type="text"
                    value={content.title || ''}
                    onChange={(e) => onUpdateContent({ title: e.target.value })}
                    placeholder="Title..."
                    className="w-full bg-stone-950 border border-stone-800 focus:border-amber-600/50 text-stone-100 text-sm font-serif font-bold px-3.5 py-3 rounded-lg focus:outline-none placeholder:text-stone-600 transition-colors"
                  />
                </div>

                {section.type !== 'Category Cards' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Narrative Description</label>
                    <textarea 
                      value={content.description || ''}
                      onChange={(e) => onUpdateContent({ description: e.target.value })}
                      placeholder="Description..."
                      rows={4}
                      className="w-full bg-stone-950 border border-stone-800 focus:border-amber-600/50 text-stone-300 text-xs px-3.5 py-2.5 rounded-lg leading-relaxed focus:outline-none placeholder:text-stone-600 transition-colors"
                    />
                  </div>
                )}
              </div>
            )}

            {/* MARQUEE SPECIFIC CONTENT */}
            {section.type === 'Infinite Marquee' && (
              <div className="space-y-4">
                <h4 className="text-[10px] text-amber-500 font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Slogan Stream</span>
                </h4>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Marquee Slogans Text</label>
                  <textarea 
                    value={content.text || ''}
                    onChange={(e) => onUpdateContent({ text: e.target.value })}
                    placeholder="Slogans text..."
                    rows={4}
                    className="w-full bg-stone-950 border border-stone-800 focus:border-amber-600/50 text-stone-200 text-xs px-3.5 py-2.5 rounded-lg leading-relaxed font-mono focus:outline-none transition-colors"
                  />
                  <p className="text-[9px] text-stone-500 font-medium font-sans">Separate slogans with bullet markers like • to format elegantly in the live view.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Background Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color"
                        value={content.bgColor || '#0c0a09'}
                        onChange={(e) => onUpdateContent({ bgColor: e.target.value })}
                        className="w-10 h-10 rounded border border-stone-800 cursor-pointer bg-transparent"
                      />
                      <input 
                        type="text"
                        value={content.bgColor || '#0c0a09'}
                        onChange={(e) => onUpdateContent({ bgColor: e.target.value })}
                        className="flex-1 bg-stone-950 border border-stone-800 text-stone-300 text-[11px] font-mono rounded px-2.5"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Slogans Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color"
                        value={content.textColor || '#d97706'}
                        onChange={(e) => onUpdateContent({ textColor: e.target.value })}
                        className="w-10 h-10 rounded border border-stone-800 cursor-pointer bg-transparent"
                      />
                      <input 
                        type="text"
                        value={content.textColor || '#d97706'}
                        onChange={(e) => onUpdateContent({ textColor: e.target.value })}
                        className="flex-1 bg-stone-950 border border-stone-800 text-stone-300 text-[11px] font-mono rounded px-2.5"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MEDIA ASSET CONFIGURATION */}
            {['Hero Banner', 'Split Media Banner', 'Shop The Look'].includes(section.type) && (
              <div className="space-y-4">
                <h4 className="text-[10px] text-amber-500 font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Media Upload (ImageKit)</span>
                </h4>
                
                <div className="space-y-2">
                  <ImageUploader 
                    id="banner-image"
                    value={content.mediaUrl || ''}
                    onChange={(url) => onUpdateContent({ mediaUrl: url })}
                    folder={IMAGEKIT_FOLDERS.banners}
                  />
                </div>
              </div>
            )}

            {/* SPLIT MEDIA CONFIGS */}
            {section.type === 'Split Media Banner' && (
              <div className="space-y-4 border-t border-stone-850 pt-4">
                <h4 className="text-[10px] text-stone-400 font-bold tracking-wider uppercase">Media Placement</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onUpdateContent({ alignMedia: 'left' })}
                    className={`py-2 text-[10px] font-bold uppercase rounded border transition-all cursor-pointer ${
                      content.alignMedia === 'left' ? 'bg-amber-600 text-stone-950 border-amber-600' : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                    }`}
                  >
                    Left Align
                  </button>
                  <button
                    onClick={() => onUpdateContent({ alignMedia: 'right' })}
                    className={`py-2 text-[10px] font-bold uppercase rounded border transition-all cursor-pointer ${
                      content.alignMedia !== 'left' ? 'bg-amber-600 text-stone-950 border-amber-600' : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                    }`}
                  >
                    Right Align
                  </button>
                </div>
              </div>
            )}

            {/* HERITAGE COLLAGE DOUBLE IMAGES */}
            {(section.type === 'Story Collage' || section.type === 'About Collection') && (
              <div className="space-y-4 border-t border-stone-850 pt-4">
                <h4 className="text-[10px] text-amber-500 font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Collage Elements (ImageKit)</span>
                </h4>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Image 1 (Main Portrait)</label>
                    <ImageUploader 
                      id="collage-image-1"
                      value={content.image1 || content.mediaUrl || ''}
                      onChange={(url) => onUpdateContent({ image1: url, mediaUrl: url })}
                      folder={IMAGEKIT_FOLDERS.banners}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Image 2 (Supporting Square)</label>
                    <ImageUploader 
                      id="collage-image-2"
                      value={content.image2 || content.mediaUrl2 || ''}
                      onChange={(url) => onUpdateContent({ image2: url, mediaUrl2: url })}
                      folder={IMAGEKIT_FOLDERS.banners}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* COLLECTION/CATEGORY SELECTORS FOR GRID LAYOUTS */}
            {section.type === 'Category Cards' && (
              <div className="space-y-4 border-t border-stone-850 pt-4">
                <h4 className="text-[10px] text-amber-500 font-bold tracking-wider uppercase">Select Showroom Categories</h4>
                <p className="text-[9px] text-stone-500 font-medium">Toggle categories below to select which ones appear on the homepage list (leave empty to show all):</p>
                
                <div className="grid grid-cols-1 gap-2 bg-stone-950 p-3 rounded-lg border border-stone-850 max-h-60 overflow-y-auto">
                  {categories.map((cat) => {
                    const isChecked = (content.selectedIds || []).includes(cat.id);
                    return (
                      <label 
                        key={cat.id} 
                        className="flex items-center gap-3 py-1.5 px-2 hover:bg-stone-900 rounded cursor-pointer select-none text-xs"
                      >
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectedId(cat.id)}
                          className="accent-amber-500 w-4 h-4 rounded border-stone-850 bg-stone-950 shrink-0"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-stone-200">{cat.name}</p>
                          <p className="text-[9px] text-stone-500 font-mono font-bold">slug: {cat.slug}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PRODUCT CAROUSEL SELECTORS */}
            {section.type === 'Product Carousel' && (
              <div className="space-y-4 border-t border-stone-850 pt-4">
                <h4 className="text-[10px] text-amber-500 font-bold tracking-wider uppercase">Carousel Settings</h4>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Products Segment Mode</label>
                  <select
                    value={content.productsType || 'featured'}
                    onChange={(e) => onUpdateContent({ productsType: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 focus:border-amber-600/50 text-stone-200 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="featured">Featured Showroom Assets</option>
                    <option value="new">Fresh Showroom Arrivals</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">Select Custom Products</label>
                  <p className="text-[9px] text-stone-500 font-medium">Optionally override default catalog lists by selecting specific gold and solitaire items below:</p>
                  
                  <div className="grid grid-cols-1 gap-2 bg-stone-950 p-3 rounded-lg border border-stone-850 max-h-60 overflow-y-auto">
                    {products.map((p) => {
                      const isChecked = (content.selectedIds || []).includes(p.id);
                      return (
                        <label 
                          key={p.id} 
                          className="flex items-center gap-3 py-1.5 px-2 hover:bg-stone-900 rounded cursor-pointer select-none text-xs"
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectedId(p.id)}
                            className="accent-amber-500 w-4 h-4 rounded border-stone-850 bg-stone-950 shrink-0"
                          />
                          <div className="flex-1 flex gap-2 items-center">
                            <div className="w-8 h-8 rounded bg-stone-900 border border-stone-800 overflow-hidden shrink-0">
                              <img src={p.imageUrl} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div>
                              <p className="font-semibold text-stone-200 line-clamp-1">{p.name}</p>
                              <p className="text-[9px] text-stone-500 font-mono font-bold">Weight: {p.approxWeight} | SKU: {p.sku}</p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SHOP THE LOOK PRODUCT SELECTORS */}
            {section.type === 'Shop The Look' && (
              <div className="space-y-4 border-t border-stone-850 pt-4">
                <h4 className="text-[10px] text-amber-500 font-bold tracking-wider uppercase">Select Lookboard Products</h4>
                <p className="text-[9px] text-stone-500 font-medium">Select the products that are showcased together in this editorial lookboard layout (select up to 2):</p>
                
                <div className="grid grid-cols-1 gap-2 bg-stone-950 p-3 rounded-lg border border-stone-850 max-h-60 overflow-y-auto">
                  {products.map((p) => {
                    const isChecked = (content.selectedIds || []).includes(p.id);
                    return (
                      <label 
                        key={p.id} 
                        className="flex items-center gap-3 py-1.5 px-2 hover:bg-stone-900 rounded cursor-pointer select-none text-xs"
                      >
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectedId(p.id)}
                          className="accent-amber-500 w-4 h-4 rounded border-stone-850 bg-stone-950 shrink-0"
                        />
                        <div className="flex-1 flex gap-2 items-center">
                          <div className="w-8 h-8 rounded bg-stone-900 border border-stone-800 overflow-hidden shrink-0">
                            <img src={p.imageUrl} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div>
                            <p className="font-semibold text-stone-200 line-clamp-1">{p.name}</p>
                            <p className="text-[9px] text-stone-500 font-mono font-bold">Weight: {p.approxWeight}</p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BOUTIQUES SELECTOR LIST */}
            {section.type === 'Our Boutiques' && (
              <div className="space-y-4 border-t border-stone-850 pt-4">
                <h4 className="text-[10px] text-amber-500 font-bold tracking-wider uppercase">Select Active Galleries</h4>
                <p className="text-[9px] text-stone-500 font-medium">Toggle locations below to choose which physical showrooms appear in the directory layout (leave empty to show all):</p>
                
                <div className="grid grid-cols-1 gap-2 bg-stone-950 p-3 rounded-lg border border-stone-850 max-h-48 overflow-y-auto">
                  {stores.map((st) => {
                    const isChecked = (content.selectedIds || []).includes(st.id);
                    return (
                      <label 
                        key={st.id} 
                        className="flex items-center gap-3 py-2 px-2.5 hover:bg-stone-900 rounded cursor-pointer select-none text-xs animate-fade-in"
                      >
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectedId(st.id)}
                          className="accent-amber-500 w-4 h-4 rounded border-stone-850 bg-stone-950 shrink-0"
                        />
                        <div className="flex-1 flex gap-2.5 items-center">
                          <div className="w-8 h-8 rounded bg-stone-900 border border-stone-800 overflow-hidden shrink-0">
                            <img src={st.imageUrl} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-stone-200 truncate">{st.name}</p>
                            <p className="text-[9px] text-stone-500 truncate">{st.address}</p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TYPOGRAPHY AND STYLING ACCORDION */}
        {activeTab === 'styles' && isBannerStyle && (
          <div className="space-y-6 animate-fade-in">
            {/* HEADINGS STYLING BLOCK */}
            <div className="space-y-4">
              <h4 className="text-[10px] text-amber-500 font-bold tracking-wider uppercase flex items-center gap-1.5 border-b border-stone-850 pb-2">
                <Type className="w-3.5 h-3.5" />
                <span>Heading Typography & Color</span>
              </h4>

              {/* Title Style Override */}
              <div className="space-y-3 bg-stone-950/30 p-3.5 rounded-lg border border-stone-850">
                <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-widest font-mono">Title Element overrides</p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">Font Family</label>
                    <select
                      value={content.titleStyle?.fontFamily || 'serif'}
                      onChange={(e) => handleStyleChange('titleStyle', 'fontFamily', e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 focus:border-amber-600/50 text-stone-200 text-xs px-2.5 py-2 rounded focus:outline-none transition-colors"
                    >
                      <option value="serif">Playfair Display (Premium Serifs)</option>
                      <option value="sans">Plus Jakarta Sans (Sleek Sans-Serif)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">Text Color Hex</label>
                    <div className="flex gap-2">
                      <input 
                        type="color"
                        value={content.titleStyle?.color || '#1c1917'}
                        onChange={(e) => handleStyleChange('titleStyle', 'color', e.target.value)}
                        className="w-8 h-8 rounded border border-stone-800 cursor-pointer bg-transparent"
                      />
                      <input 
                        type="text"
                        value={content.titleStyle?.color || '#1c1917'}
                        onChange={(e) => handleStyleChange('titleStyle', 'color', e.target.value)}
                        className="flex-1 bg-stone-950 border border-stone-800 text-stone-300 text-[11px] font-mono rounded px-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">Font Size (CSS value)</label>
                    <input 
                      type="text"
                      value={content.titleStyle?.fontSize || ''}
                      onChange={(e) => handleStyleChange('titleStyle', 'fontSize', e.target.value)}
                      placeholder="e.g. 3rem, 42px, 3.5vw"
                      className="w-full bg-stone-950 border border-stone-800 focus:border-amber-600/50 text-stone-300 text-[11px] font-mono px-2.5 py-1.5 rounded focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Subtitle Style Override */}
              <div className="space-y-3 bg-stone-950/30 p-3.5 rounded-lg border border-stone-850">
                <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-widest font-mono">Subtitle Eyebrow overrides</p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">Font Family</label>
                    <select
                      value={content.subtitleStyle?.fontFamily || 'sans'}
                      onChange={(e) => handleStyleChange('subtitleStyle', 'fontFamily', e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 focus:border-amber-600/50 text-stone-200 text-xs px-2.5 py-2 rounded focus:outline-none transition-colors"
                    >
                      <option value="sans">Plus Jakarta Sans (Sleek Sans-Serif)</option>
                      <option value="serif">Playfair Display (Premium Serifs)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">Text Color Hex</label>
                    <div className="flex gap-2">
                      <input 
                        type="color"
                        value={content.subtitleStyle?.color || '#d97706'}
                        onChange={(e) => handleStyleChange('subtitleStyle', 'color', e.target.value)}
                        className="w-8 h-8 rounded border border-stone-800 cursor-pointer bg-transparent"
                      />
                      <input 
                        type="text"
                        value={content.subtitleStyle?.color || '#d97706'}
                        onChange={(e) => handleStyleChange('subtitleStyle', 'color', e.target.value)}
                        className="flex-1 bg-stone-950 border border-stone-800 text-stone-300 text-[11px] font-mono rounded px-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">Font Size (CSS value)</label>
                    <input 
                      type="text"
                      value={content.subtitleStyle?.fontSize || ''}
                      onChange={(e) => handleStyleChange('subtitleStyle', 'fontSize', e.target.value)}
                      placeholder="e.g. 0.8rem, 12px"
                      className="w-full bg-stone-950 border border-stone-800 focus:border-amber-600/50 text-stone-300 text-[11px] font-mono px-2.5 py-1.5 rounded focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Description Style Override */}
              <div className="space-y-3 bg-stone-950/30 p-3.5 rounded-lg border border-stone-850">
                <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-widest font-mono">Description block overrides</p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">Font Family</label>
                    <select
                      value={content.descriptionStyle?.fontFamily || 'sans'}
                      onChange={(e) => handleStyleChange('descriptionStyle', 'fontFamily', e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 focus:border-amber-600/50 text-stone-200 text-xs px-2.5 py-2 rounded focus:outline-none transition-colors"
                    >
                      <option value="sans">Plus Jakarta Sans (Sleek Sans-Serif)</option>
                      <option value="serif">Playfair Display (Premium Serifs)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">Text Color Hex</label>
                    <div className="flex gap-2">
                      <input 
                        type="color"
                        value={content.descriptionStyle?.color || '#78716c'}
                        onChange={(e) => handleStyleChange('descriptionStyle', 'color', e.target.value)}
                        className="w-8 h-8 rounded border border-stone-800 cursor-pointer bg-transparent"
                      />
                      <input 
                        type="text"
                        value={content.descriptionStyle?.color || '#78716c'}
                        onChange={(e) => handleStyleChange('descriptionStyle', 'color', e.target.value)}
                        className="flex-1 bg-stone-950 border border-stone-800 text-stone-300 text-[11px] font-mono rounded px-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* BUTTON ACTION ROUTING CONTROLS */}
        {activeTab === 'actions' && isBannerStyle && (
          <div className="space-y-6 animate-fade-in">
            {/* PRIMARY BUTTON CARD */}
            <div className="space-y-4">
              <h4 className="text-[10px] text-amber-500 font-bold tracking-wider uppercase flex items-center gap-1.5 border-b border-stone-850 pb-2">
                <MousePointer className="w-3.5 h-3.5" />
                <span>Primary Action Button</span>
              </h4>

              <div className="space-y-4 bg-stone-950/40 p-4 rounded-xl border border-stone-850">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Button Text Label</label>
                  <input 
                    type="text"
                    value={primaryBtn.label || ''}
                    onChange={(e) => handleButtonChange('primaryButton', 'label', e.target.value)}
                    placeholder="e.g. SHOP NOW..."
                    className="w-full bg-stone-950 border border-stone-800 focus:border-amber-600/50 text-stone-100 text-xs px-3 py-2 rounded focus:outline-none placeholder:text-stone-700 font-bold tracking-wider uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Button Style Layout</label>
                  <select
                    value={primaryBtn.styleType || 'solid'}
                    onChange={(e) => handleButtonChange('primaryButton', 'styleType', e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 text-stone-200 text-xs px-2.5 py-2 rounded focus:outline-none"
                  >
                    <option value="solid">Solid Filled Background</option>
                    <option value="outlined">Minimalist Outline Border</option>
                  </select>
                </div>

                {/* Primary Button Custom Colors */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[8px] text-stone-500 uppercase tracking-widest font-bold">Bg/Accent Color</label>
                    <input 
                      type="color"
                      value={primaryBtn.bgColor || '#b45309'}
                      onChange={(e) => handleButtonChange('primaryButton', 'bgColor', e.target.value)}
                      className="w-full h-8 rounded border border-stone-800 cursor-pointer bg-transparent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] text-stone-500 uppercase tracking-widest font-bold">Text Color</label>
                    <input 
                      type="color"
                      value={primaryBtn.textColor || '#ffffff'}
                      onChange={(e) => handleButtonChange('primaryButton', 'textColor', e.target.value)}
                      className="w-full h-8 rounded border border-stone-800 cursor-pointer bg-transparent"
                    />
                  </div>
                </div>

                 {/* Link Config Mode */}
                <div className="space-y-2 border-t border-stone-850 pt-3">
                  <label className="text-[9px] text-stone-400 uppercase tracking-widest font-bold block">Destination Routing ("Link To")</label>
                  <SmartLinkPicker
                    value={primaryBtn.linkUrl || ''}
                    onChange={(newUrl) => handleButtonChange('primaryButton', 'linkUrl', newUrl)}
                  />
                </div>
              </div>
            </div>

            {/* SECONDARY BUTTON CARD */}
            {section.type !== 'Story Collage' && (
              <div className="space-y-4 border-t border-stone-850 pt-4">
                <h4 className="text-[10px] text-amber-500 font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <MousePointer className="w-3.5 h-3.5" />
                  <span>Secondary Action Button</span>
                </h4>

                <div className="space-y-4 bg-stone-950/40 p-4 rounded-xl border border-stone-850">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Button Text Label</label>
                    <input 
                      type="text"
                      value={secondaryBtn.label || ''}
                      onChange={(e) => handleButtonChange('secondaryButton', 'label', e.target.value)}
                      placeholder="e.g. BOOK SHOWROOM..."
                      className="w-full bg-stone-950 border border-stone-800 focus:border-amber-600/50 text-stone-100 text-xs px-3 py-2 rounded focus:outline-none placeholder:text-stone-700 font-bold tracking-wider uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Button Style Layout</label>
                    <select
                      value={secondaryBtn.styleType || 'outlined'}
                      onChange={(e) => handleButtonChange('secondaryButton', 'styleType', e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 text-stone-200 text-xs px-2.5 py-2 rounded focus:outline-none cursor-pointer"
                    >
                      <option value="solid">Solid Filled Background</option>
                      <option value="outlined">Minimalist Outline Border</option>
                    </select>
                  </div>

                  {/* Secondary Button Custom Colors */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[8px] text-stone-500 uppercase tracking-widest font-bold">Bg/Accent Color</label>
                      <input 
                        type="color"
                        value={secondaryBtn.bgColor || '#1c1917'}
                        onChange={(e) => handleButtonChange('secondaryButton', 'bgColor', e.target.value)}
                        className="w-full h-8 rounded border border-stone-800 cursor-pointer bg-transparent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-stone-500 uppercase tracking-widest font-bold">Text Color</label>
                      <input 
                        type="color"
                        value={secondaryBtn.textColor || '#ffffff'}
                        onChange={(e) => handleButtonChange('secondaryButton', 'textColor', e.target.value)}
                        className="w-full h-8 rounded border border-stone-800 cursor-pointer bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Link Config Mode */}
                  <div className="space-y-2 border-t border-stone-850 pt-3">
                    <label className="text-[9px] text-stone-400 uppercase tracking-widest font-bold block">Destination Routing ("Link To")</label>
                    <SmartLinkPicker
                      value={secondaryBtn.linkUrl || ''}
                      onChange={(newUrl) => handleButtonChange('secondaryButton', 'linkUrl', newUrl)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 4. Footer Controls (Rounded Capsule Floating Bar - Matches reference 5/5) */}
      <div className="p-4 border-t border-stone-800 bg-stone-950/40 flex items-center justify-center shrink-0">
        <div className="flex items-center bg-stone-900 border border-stone-800 rounded-full shadow-lg p-1 px-1.5 gap-2" id="panel-floating-action-deck">
          <button 
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold bg-stone-950 hover:bg-stone-850 text-stone-300 px-4 py-2 rounded-full cursor-pointer transition-colors border border-stone-800"
            title="Complete editing"
          >
            <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
            <span>Finish Edits</span>
          </button>
        </div>
      </div>

    </div>
  );
}
