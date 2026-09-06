/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Per-Page SEO & Social Metadata Drawer
 */

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  X, 
  Check, 
  Share2, 
  Search, 
  Sparkles, 
  ImageIcon, 
  Link as LinkIcon,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { IMAGEKIT_FOLDERS } from '../imagekit/client';

export interface PageSeoObject {
  title?: string;
  slug?: string;
  description?: string;
  ogImage?: string;
}

interface PageSeoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  pageName?: string;
  initialSeo?: PageSeoObject;
  onSaveSeo: (seo: PageSeoObject) => void;
}

export function PageSeoDrawer({
  isOpen,
  onClose,
  pageId,
  pageName = 'Home Page',
  initialSeo = {},
  onSaveSeo,
}: PageSeoDrawerProps): React.JSX.Element | null {
  const isHome = pageId === 'home' || initialSeo?.slug === 'home' || pageName.toLowerCase() === 'home page';

  const defaultTitle = isHome 
    ? 'Parasmoni Jewellers & Brothers | Premium Gold Jewellery Showroom Since 1974'
    : `${pageName} | Parasmoni Jewellers & Brothers`;

  const defaultSlug = isHome 
    ? 'home' 
    : (pageName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'page');

  const defaultDesc = isHome
    ? 'Parasmoni Jewellers & Brothers – a trusted West Bengal gold jewellery showroom established in 1974. Discover handcrafted gold jewellery, bridal collections, and traditional Bengali designs crafted with authenticity and heritage craftsmanship.'
    : `Explore exclusive ${pageName} jewellery collection at Parasmoni Jewellers & Brothers. Handcrafted designs in pure 22K gold, bridal diamond settings, and heritage Bengali craftsmanship.`;

  const defaultOgImage = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200';

  // Form state
  const [title, setTitle] = useState(initialSeo?.title || defaultTitle);
  const [slug, setSlug] = useState(initialSeo?.slug || defaultSlug);
  const [description, setDescription] = useState(initialSeo?.description || defaultDesc);
  const [ogImage, setOgImage] = useState(initialSeo?.ogImage || defaultOgImage);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(initialSeo?.slug));
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state whenever initialSeo or pageId changes
  useEffect(() => {
    setTitle(initialSeo?.title || defaultTitle);
    setSlug(initialSeo?.slug || defaultSlug);
    setDescription(initialSeo?.description || defaultDesc);
    setOgImage(initialSeo?.ogImage || defaultOgImage);
    setSlugManuallyEdited(Boolean(initialSeo?.slug));
  }, [initialSeo, pageId, pageName]);

  // Auto-generate slug from title if not manually edited and not home page
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!isHome && !slugManuallyEdited) {
      const generated = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(generated || 'custom-page');
    }
  };

  const handleSlugChange = (newSlug: string) => {
    setSlugManuallyEdited(true);
    setSlug(newSlug.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  const handleSave = () => {
    const finalSeo: PageSeoObject = {
      title: title.trim() || defaultTitle,
      slug: isHome ? 'home' : (slug.trim() || defaultSlug),
      description: description.trim() || defaultDesc,
      ogImage: ogImage.trim() || defaultOgImage
    };
    onSaveSeo(finalSeo);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  // Compute live URL for preview
  const displayUrl = isHome
    ? 'https://parasmoni.in'
    : `https://parasmoni.in/pages/${slug || 'your-page-slug'}`;

  // Character thresholds
  const titleCharCount = title.length;
  const descCharCount = description.length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/75 backdrop-blur-xs animate-fade-in" id="page-seo-drawer-overlay">
      {/* Click outside backdrop */}
      <div className="flex-1 cursor-pointer" onClick={onClose} />

      {/* Drawer Container */}
      <div 
        className="w-full max-w-xl bg-stone-900 border-l border-stone-800 h-full flex flex-col shadow-2xl relative animate-slide-left z-10 overflow-hidden"
        id="page-seo-settings-drawer"
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-800 bg-stone-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-100">Page SEO & Metadata</h3>
                <span className="text-[9px] px-2 py-0.5 rounded bg-stone-800 text-amber-400 font-mono font-medium border border-stone-700">
                  {pageName}
                </span>
              </div>
              <p className="text-[10px] text-stone-400 mt-0.5">
                Google Search listing & Social OpenGraph live cards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer shadow-md active:scale-95"
              id="save-page-seo-btn"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Save SEO</span>
                </>
              )}
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* 1. LIVE PREVIEWS SECTION (Matches user reference images 3 & 4) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3 h-3" />
                <span>Search & Social Live Preview</span>
              </span>
              <span className="text-[9px] text-stone-500 font-mono">Updates in real time</span>
            </div>

            {/* Google Search Result Card (Exact visual style from user reference screenshot) */}
            <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 space-y-1.5 shadow-md relative group hover:border-stone-700 transition-colors">
              {/* URL */}
              <div className="text-[11px] text-stone-400 font-mono truncate max-w-full flex items-center gap-1">
                <span>{displayUrl}</span>
              </div>

              {/* Blue clickable Title Link */}
              <div className="text-base font-semibold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer leading-snug line-clamp-1">
                {title || 'Page Title Placeholder | Parasmoni Jewellers & Brothers'}
              </div>

              {/* Snippet Description */}
              <div className="text-xs text-stone-400 leading-relaxed line-clamp-2">
                {description || 'Page description will appear here as a snippet below the title in search engine results.'}
              </div>

              {/* Character counters footer */}
              <div className="pt-2 flex justify-end items-center gap-3 text-[10px] font-mono text-stone-500 border-t border-stone-900">
                <span className={titleCharCount > 65 || titleCharCount < 30 ? 'text-amber-400' : 'text-emerald-400'}>
                  {titleCharCount}/70
                </span>
                <span className={descCharCount > 160 || descCharCount < 60 ? 'text-amber-400' : 'text-emerald-400'}>
                  {descCharCount}/320
                </span>
              </div>
            </div>

            {/* Social / OpenGraph Card Preview (Matching bottom card in screenshot) */}
            <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 flex gap-3.5 items-center shadow-md overflow-hidden">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-stone-900 border border-stone-800 shrink-0 relative flex items-center justify-center">
                {ogImage ? (
                  <img 
                    src={ogImage} 
                    alt="OG Social Card Preview" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-stone-600" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-stone-500 font-mono">
                  PARASMONI.IN
                </span>
                <h4 className="text-xs font-bold text-stone-200 line-clamp-1 leading-snug">
                  {title || 'Page Title'}
                </h4>
                <p className="text-[11px] text-stone-400 line-clamp-2 leading-tight">
                  {description || 'Social media post description preview...'}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-stone-800" />

          {/* 2. FORM FIELDS CONFIGURATION */}
          <div className="space-y-4">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
              Metadata Configuration
            </span>

            {/* Field 1: SEO Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                  SEO Title
                </label>
                <span className={`text-[10px] font-mono ${titleCharCount > 60 ? 'text-amber-400 font-bold' : 'text-stone-500'}`}>
                  {titleCharCount} characters (Rec: 50-60)
                </span>
              </div>
              <input 
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Parasmoni Jewellers & Brothers | Premium Gold Jewellery Showroom Since 1974"
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
                id="input-seo-title"
              />
              <p className="text-[10px] text-stone-500">
                Appears in browser tabs and search engine headlines.
              </p>
            </div>

            {/* Field 2: Slug */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1">
                  <LinkIcon className="w-3 h-3 text-stone-400" />
                  <span>Page Slug / URL Path</span>
                </label>
                {isHome && (
                  <span className="text-[10px] text-amber-500 font-medium">
                    Root Home (/)
                  </span>
                )}
              </div>
              <div className="flex rounded-lg overflow-hidden border border-stone-800 bg-stone-950 focus-within:border-amber-500 transition-colors">
                <span className="px-3 py-2.5 bg-stone-900 text-stone-400 text-xs font-mono select-none border-r border-stone-800 shrink-0">
                  parasmoni.in/{isHome ? '' : 'pages/'}
                </span>
                <input 
                  type="text"
                  value={slug}
                  disabled={isHome}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder={isHome ? 'home' : 'e.g. bridal-collection-landing'}
                  className={`w-full px-3 py-2.5 bg-transparent text-xs text-stone-100 font-mono placeholder-stone-600 focus:outline-none ${isHome ? 'opacity-60 cursor-not-allowed' : ''}`}
                  id="input-seo-slug"
                />
              </div>
              <p className="text-[10px] text-stone-500">
                {isHome 
                  ? 'Homepage is locked to the primary root web address.' 
                  : 'The clean web address for this custom landing page.'}
              </p>
            </div>

            {/* Field 3: Meta Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                  Meta Description
                </label>
                <span className={`text-[10px] font-mono ${descCharCount > 160 ? 'text-amber-400 font-bold' : 'text-stone-500'}`}>
                  {descCharCount} characters (Rec: 120-160)
                </span>
              </div>
              <textarea 
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a clear, concise summary of this page to entice clicks from search engines..."
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors leading-relaxed"
                id="input-seo-description"
              />
              <p className="text-[10px] text-stone-500">
                Search engines often display this text under your page title in search results.
              </p>
            </div>

            {/* Field 4: Social / OG Image */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-stone-200 uppercase tracking-wider block">
                Social / OpenGraph Preview Image
              </label>
              <div className="bg-stone-950 border border-stone-800 rounded-xl p-3">
                <ImageUploader 
                  id="seo-og-image-uploader"
                  value={ogImage}
                  onChange={(val) => setOgImage(typeof val === 'string' ? val : (val[0] || ''))}
                  folder={IMAGEKIT_FOLDERS.banners}
                />
              </div>
              <p className="text-[10px] text-stone-500">
                Recommended dimension: 1200 × 630px for high-resolution WhatsApp, Facebook, and Twitter link previews.
              </p>
            </div>

          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Apply SEO Changes</span>
          </button>
        </div>

      </div>
    </div>
  );
}
