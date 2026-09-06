/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Global Search Engine Optimization (SEO) Configurator
 */

import React, { useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { 
  Globe, 
  Sparkles, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  Search, 
  HelpCircle, 
  Share2,
  FileText,
  Tag,
  FolderHeart
} from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';
import { IMAGEKIT_FOLDERS } from '../imagekit/client';

export function AdminSeo(): React.JSX.Element {
  const { adminProfile } = useAuth();
  
  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    siteTitle: 'Parasmoni Jewellers & Brothers | Premium Gold Jewellery Showroom Since 1974',
    metaDescription: 'Parasmoni Jewellers & Brothers – a trusted West Bengal gold jewellery showroom established in 1974. Discover handcrafted gold jewellery, bridal collections, and traditional Bengali designs crafted with authenticity and heritage craftsmanship.',
    defaultOgImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200',
    metaKeywords: 'gold jewellery, kolkata goldsmith, bridal neck set, royal polki, certified solitaires, bowbazar jewellers, 22k gold rate, parasmoni jewellers',
    author: 'Parasmoni Jewellers & Brothers',
    googleVerificationId: '',
    enableSitemap: true,
    enableIndex: true,
    siteUrl: 'https://parasmoni.in'
  });

  // Load defaults on mount
  useEffect(() => {
    async function fetchSeoSettings() {
      try {
        setLoading(true);
        setErrorMsg(null);

        const correctDefaults = {
          siteTitle: 'Parasmoni Jewellers & Brothers | Premium Gold Jewellery Showroom Since 1974',
          metaDescription: 'Parasmoni Jewellers & Brothers – a trusted West Bengal gold jewellery showroom established in 1974. Discover handcrafted gold jewellery, bridal collections, and traditional Bengali designs crafted with authenticity and heritage craftsmanship.',
          defaultOgImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200',
          metaKeywords: 'gold jewellery, kolkata goldsmith, bridal neck set, royal polki, certified solitaires, bowbazar jewellers, 22k gold rate, parasmoni jewellers',
          author: 'Parasmoni Jewellers & Brothers',
          googleVerificationId: '',
          enableSitemap: true,
          enableIndex: true,
          siteUrl: 'https://parasmoni.in'
        };

        if (!isFirebaseConfigured || !db) {
          // Local storage fallback
          const localSeo = localStorage.getItem('parasmoni_global_seo');
          if (localSeo) {
            const parsed = JSON.parse(localSeo);
            // Self-heal local storage
            if (/velvetbox/i.test(parsed.siteTitle || '') || /velvetbox/i.test(parsed.metaDescription || '') || /parasmoni\.com/i.test(parsed.siteTitle || '')) {
              localStorage.setItem('parasmoni_global_seo', JSON.stringify(correctDefaults));
              setFormData(correctDefaults);
            } else {
              setFormData(parsed);
            }
          } else {
            localStorage.setItem('parasmoni_global_seo', JSON.stringify(correctDefaults));
            setFormData(correctDefaults);
          }
          setLoading(false);
          return;
        }

        const docRef = doc(db, 'seoSettings', 'globalDefaults');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Self-heal Firestore database: Reset if containing old VelvetBox references or wrong domains
          const needsReset = 
            /velvetbox/i.test(data.siteTitle || '') || 
            /velvetbox/i.test(data.metaDescription || '') ||
            /velvetbox/i.test(data.canonicalUrl || '') ||
            /parasmoni\.com/i.test(data.siteTitle || '') ||
            /parasmoni\.com/i.test(data.metaDescription || '');

          if (needsReset) {
            console.log('Detected stale VelvetBox/parasmoni.com SEO records in DB. Executing automatic healing sync...');
            await setDoc(docRef, {
              ...correctDefaults,
              updatedAt: new Date().toISOString(),
              updatedBy: 'system-healing'
            });
            setFormData(correctDefaults);
          } else {
            setFormData(prev => ({
              ...prev,
              ...data
            }));
          }
        } else {
          // Provision initial seed document
          console.log('SEO config not found. Seeding initial defaults...');
          await setDoc(docRef, correctDefaults);
          setFormData(correctDefaults);
        }
      } catch (err: any) {
        console.error('Error fetching global SEO settings:', err);
        setErrorMsg('Failed to fetch SEO config from cloud database.');
      } finally {
        setLoading(false);
      }
    }

    fetchSeoSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (name: 'enableSitemap' | 'enableIndex', value: boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (!isFirebaseConfigured || !db) {
        // Mock save
        localStorage.setItem('parasmoni_global_seo', JSON.stringify(formData));
        setSuccessMsg('Global SEO default values saved to emulated frontend browser context!');
        setTimeout(() => setSuccessMsg(null), 3000);
        setSaving(false);
        return;
      }

      const docRef = doc(db, 'seoSettings', 'globalDefaults');
      await setDoc(docRef, {
        ...formData,
        updatedAt: new Date().toISOString(),
        updatedBy: adminProfile?.email || 'admin'
      });

      setSuccessMsg('Sitewide global SEO default values saved and pushed live successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error saving SEO settings:', err);
      setErrorMsg('Failed to update SEO settings inside Cloud Database: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" id="admin-seo-module">
      
      {/* Alert banners */}
      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 rounded flex items-start gap-3 text-xs" id="seo-error-card">
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
          <p className="leading-relaxed">{errorMsg}</p>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 rounded flex items-start gap-3 text-xs" id="seo-success-card">
          <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-emerald-500" />
          <p className="leading-relaxed">{successMsg}</p>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-100 flex items-center gap-2">
            <Globe className="w-4.5 h-4.5 text-amber-500" />
            <span>Search Engine Optimization (SEO) Configurator</span>
          </h2>
          <p className="text-[10px] text-stone-500 font-sans mt-0.5">Control indexing parameters, default metadata descriptors, and OG share cards globally.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT 2 COLUMNS: Config Form */}
        <form onSubmit={handleSaveSeo} className="lg:col-span-2 space-y-6 text-xs text-stone-300" id="global-seo-form">
          
          {/* Section 1: Core Search Metadata defaults */}
          <div className="bg-stone-950 border border-stone-800 rounded p-6 space-y-4">
            <h3 className="font-serif font-bold text-stone-100 text-sm border-b border-stone-900 pb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Sitewide Metadata & Descriptions</span>
            </h3>

            {/* Site Title Default */}
            <div className="space-y-1.5">
              <label htmlFor="seo-siteTitle" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                Default Site Title Tag <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                id="seo-siteTitle"
                name="siteTitle"
                required
                value={formData.siteTitle}
                onChange={handleInputChange}
                placeholder="e.g., Parasmoni Jewellers | Gold Showroom"
                className="w-full bg-stone-900 border border-stone-800 text-stone-100 p-3 rounded focus:outline-hidden focus:border-amber-500"
              />
              <span className="text-[9px] text-stone-500 block mt-1">Recommended length: under 60 characters to avoid search truncation.</span>
            </div>

            {/* Site Description Default */}
            <div className="space-y-1.5">
              <label htmlFor="seo-metaDescription" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                Default Meta Description <span className="text-amber-500">*</span>
              </label>
              <textarea
                id="seo-metaDescription"
                name="metaDescription"
                required
                rows={4}
                value={formData.metaDescription}
                onChange={handleInputChange}
                placeholder="Provide a clear, rich, engaging summary of your showroom to display on search results..."
                className="w-full bg-stone-900 border border-stone-800 text-stone-100 p-3 rounded focus:outline-hidden focus:border-amber-500 leading-relaxed font-sans"
              />
              <span className="text-[9px] text-stone-500 block mt-1">Recommended length: 140 - 160 characters to optimize organic click-through rates.</span>
            </div>

            {/* Default Meta Keywords */}
            <div className="space-y-1.5">
              <label htmlFor="seo-metaKeywords" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                Default Meta Keywords
              </label>
              <input
                type="text"
                id="seo-metaKeywords"
                name="metaKeywords"
                value={formData.metaKeywords}
                onChange={handleInputChange}
                placeholder="e.g. gold, kolkata jewelry, chokers, bangles"
                className="w-full bg-stone-900 border border-stone-800 text-stone-100 p-3 rounded focus:outline-hidden focus:border-amber-500"
              />
              <span className="text-[9px] text-stone-500 block mt-1">Comma-separated keywords defining core search concepts.</span>
            </div>
          </div>

          {/* Section 2: Social Open Graph Cards */}
          <div className="bg-stone-950 border border-stone-800 rounded p-6 space-y-4">
            <h3 className="font-serif font-bold text-stone-100 text-sm border-b border-stone-900 pb-2 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-amber-500" />
              <span>Social Open Graph (OG) Branding Defaults</span>
            </h3>

            <p className="text-[10px] text-stone-500 leading-relaxed">
              Open Graph meta variables control how the showroom portal displays when shared across social channels like WhatsApp, Facebook, iMessage, and X.
            </p>

            {/* OG Image Uploader */}
            <div className="space-y-2">
              <label className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                Default Social Sharing Cover Art (1200 x 630 pixels) *
              </label>
              <ImageUploader
                id="seo-og-uploader"
                multiple={false}
                value={formData.defaultOgImage}
                onChange={(url) => setFormData(prev => ({ ...prev, defaultOgImage: url as string }))}
                folder={IMAGEKIT_FOLDERS.banners}
              />
              {formData.defaultOgImage && (
                <div className="p-1 border border-stone-800 rounded bg-stone-950">
                  <img 
                    src={formData.defaultOgImage} 
                    alt="SEO default open graph social card preview" 
                    className="w-full h-40 object-cover rounded-sm"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Crawler Directives */}
          <div className="bg-stone-950 border border-stone-800 rounded p-6 space-y-4">
            <h3 className="font-serif font-bold text-stone-100 text-sm border-b border-stone-900 pb-2 flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-500" />
              <span>Search Crawler & Verification Directives</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Google Verification ID */}
              <div className="space-y-1.5">
                <label htmlFor="seo-googleVerificationId" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                  Google Search Console Verification Key
                </label>
                <input
                  type="text"
                  id="seo-googleVerificationId"
                  name="googleVerificationId"
                  value={formData.googleVerificationId}
                  onChange={handleInputChange}
                  placeholder="e.g., google-site-verification=abc..."
                  className="w-full bg-stone-900 border border-stone-800 text-stone-100 p-3 rounded focus:outline-hidden focus:border-amber-500 font-mono"
                />
              </div>

              {/* Author Tag */}
              <div className="space-y-1.5">
                <label htmlFor="seo-author" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                  Meta Author Tag
                </label>
                <input
                  type="text"
                  id="seo-author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  placeholder="Parasmoni Jewellers"
                  className="w-full bg-stone-900 border border-stone-800 text-stone-100 p-3 rounded focus:outline-hidden focus:border-amber-500"
                />
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              {/* Crawler Indexing Toggle */}
              <div className="p-3 bg-stone-900/30 border border-stone-850 rounded flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-200">Search Indexing (robots.txt)</span>
                  <span className="block text-[9px] text-stone-500 mt-0.5">Instruct bots to crawl and index site content.</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleChange('enableIndex', !formData.enableIndex)}
                  className={`px-3 py-1 border text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                    formData.enableIndex 
                      ? 'bg-amber-600 border-amber-500 text-stone-950' 
                      : 'border-stone-800 text-stone-500'
                  }`}
                >
                  {formData.enableIndex ? 'INDEX ON' : 'NOINDEX'}
                </button>
              </div>

              {/* Sitemap Generation Toggle */}
              <div className="p-3 bg-stone-900/30 border border-stone-850 rounded flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-200">Dynamic sitemap.xml</span>
                  <span className="block text-[9px] text-stone-500 mt-0.5">Generate dynamic sitemap endpoints automatically.</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleChange('enableSitemap', !formData.enableSitemap)}
                  className={`px-3 py-1 border text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                    formData.enableSitemap 
                      ? 'bg-amber-600 border-amber-500 text-stone-950' 
                      : 'border-stone-800 text-stone-500'
                  }`}
                >
                  {formData.enableSitemap ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

            </div>
          </div>

          {/* Form Actions Footer Bar */}
          <div className="flex items-center justify-end gap-3 border-t border-stone-800 pt-5">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 text-stone-950 font-bold uppercase tracking-wider text-[10px] px-6 py-2.5 rounded cursor-pointer transition-all"
              id="seo-save-btn"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Global Defaults</span>
                </>
              )}
            </button>
          </div>

        </form>

        {/* RIGHT COLUMN: Diagnosis Checklist */}
        <div className="space-y-6">
          
          {/* Live Indexing Card Simulation */}
          <div className="bg-stone-950 border border-stone-800 rounded p-6 space-y-4">
            <h4 className="font-serif font-bold text-stone-300 text-xs flex items-center gap-1.5 uppercase tracking-wider border-b border-stone-900 pb-2">
              <Search className="w-4 h-4 text-amber-500" />
              <span>Google Search Index Card Preview</span>
            </h4>
            <div className="bg-stone-900 border border-stone-850 p-4 rounded font-sans text-xs space-y-1">
              <span className="text-[10px] text-stone-500 block truncate font-mono">
                https://parasmoni.in/
              </span>
              <h4 className="text-sky-400 font-serif font-bold text-sm hover:underline cursor-pointer line-clamp-1">
                {formData.siteTitle}
              </h4>
              <p className="text-stone-400 text-[11px] leading-relaxed line-clamp-3">
                {formData.metaDescription}
              </p>
            </div>
            <p className="text-[9px] text-stone-500 leading-relaxed italic">
              * Note: Search card changes can take up to 24-72 hours to reflect inside Google Indexing Console after publishing.
            </p>
          </div>

          {/* Catalog Modules Diagnostic Checker */}
          <div className="bg-stone-950 border border-stone-800 rounded p-6 space-y-4">
            <h4 className="font-serif font-bold text-stone-300 text-xs flex items-center gap-1.5 uppercase tracking-wider border-b border-stone-900 pb-2">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <span>Fine-tuning Content SEO</span>
            </h4>
            <p className="text-[10px] text-stone-500 leading-relaxed font-sans">
              To guarantee optimal organic results, avoid thin content. Per-item SEO parameters must be configured individually when creating or modifying catalog cards:
            </p>

            <div className="space-y-3 pt-1 text-[10px] leading-relaxed">
              
              {/* Product Cards */}
              <div className="flex gap-3 items-start">
                <div className="p-1 rounded bg-stone-900 border border-stone-800 text-amber-500 mt-0.5 shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="block font-bold text-stone-300">Catalog Ornaments Forms</span>
                  <span className="text-stone-500 block mt-0.5">Customize per-product URL slugs, meta titles, meta description, OG cards, and image ALT tags in the **Products Manager** tab.</span>
                </div>
              </div>

              {/* Collections Cards */}
              <div className="flex gap-3 items-start">
                <div className="p-1 rounded bg-stone-900 border border-stone-800 text-amber-500 mt-0.5 shrink-0">
                  <FolderHeart className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="block font-bold text-stone-300">Design Collections Series</span>
                  <span className="text-stone-500 block mt-0.5">Define distinct URL slugs, meta cards, and alt parameters directly in the **Collections Manager** tab to claim bridal/antique keyword traffic.</span>
                </div>
              </div>

              {/* Categories Cards */}
              <div className="flex gap-3 items-start">
                <div className="p-1 rounded bg-stone-900 border border-stone-800 text-amber-500 mt-0.5 shrink-0">
                  <Tag className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="block font-bold text-stone-300">Ornaments Classifications</span>
                  <span className="text-stone-500 block mt-0.5">Edit category URL slugs and search cards directly inside the **Categories Manager** tab to rank for high-volume keywords like "Necklaces", "Bangles", and "Solitaires".</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
