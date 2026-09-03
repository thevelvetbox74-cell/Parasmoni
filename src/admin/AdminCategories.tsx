/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Category Management
 */

import React, { useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  X, 
  Tag, 
  Link as LinkIcon, 
  AlertCircle, 
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles,
  Sliders
} from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';
import { IMAGEKIT_FOLDERS } from '../imagekit/client';
import { Link } from 'react-router-dom';
import { mockProducts } from '../data/mockData';

// Core default category labels based on catalog filter mappings
const DEFAULT_CATEGORIES = [
  'Rings', 'Earrings', 'Necklaces', 'Chains', 'Bracelets', 'Bangles',
  'Mangalsutra', 'Pendants', 'Nose Pins', 'Anklets', 'Jhumkas'
];

export function AdminCategories(): React.JSX.Element {
  const { user } = useAuth();
  
  // UI View Mode State
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [categories, setCategories] = useState<any[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    displayOrder: 1,
    status: 'active' as 'active' | 'inactive',
    seoTitle: '',
    seoDescription: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    imageAltText: '',
    offerTag: '',
    customTitle: '',
    customSubtitle: '',
    fontStyle: 'serif',
    textColor: '#ffffff',
    subtitleColor: '#fecdd3',
    offerTagColor: '#ffffff',
    offerTagBgColor: '#e11d48',
    overlayShadeColor: '#000000'
  });

  // Global category showcase settings (from websiteSettings)
  const [globalSettingsId, setGlobalSettingsId] = useState<string | null>(null);
  const [globalEyebrow, setGlobalEyebrow] = useState('CURATED SELECTIONS');
  const [globalTitle, setGlobalTitle] = useState('Shop by Category Showcase');
  const [globalSubtitle, setGlobalSubtitle] = useState('Explore our spectacular hand-crafted designs categorized for perfect visual navigation');
  const [globalLayout, setGlobalLayout] = useState<'single' | 'double'>('single');
  const [globalHeaderBgColor, setGlobalHeaderBgColor] = useState('transparent');
  const [globalHeaderTextColor, setGlobalHeaderTextColor] = useState('#1c1917');
  const [globalHeaderBorderColor, setGlobalHeaderBorderColor] = useState('transparent');
  const [globalHeaderFontStyle, setGlobalHeaderFontStyle] = useState('serif');
  const [globalHeaderFontSize, setGlobalHeaderFontSize] = useState('28px');
  const [globalSubtitleColor, setGlobalSubtitleColor] = useState('#78716c');
  const [globalEyebrowColor, setGlobalEyebrowColor] = useState('#e11d48');
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Load Global Category Settings on Mount
  useEffect(() => {
    async function loadGlobalCategorySettings() {
      try {
        if (!isFirebaseConfigured) return;
        const settingsCol = collection(db, 'websiteSettings');
        const snapshot = await getDocs(settingsCol);
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          setGlobalSettingsId(docSnap.id);
          const data = docSnap.data();
          setGlobalEyebrow(data.categoryShowcaseEyebrowTag !== undefined ? data.categoryShowcaseEyebrowTag : 'CURATED SELECTIONS');
          setGlobalTitle(data.categoryShowcaseTitle !== undefined ? data.categoryShowcaseTitle : 'Shop by Category Showcase');
          setGlobalSubtitle(data.categoryShowcaseSubtitle !== undefined ? data.categoryShowcaseSubtitle : 'Explore our spectacular hand-crafted designs categorized for perfect visual navigation');
          setGlobalLayout(data.categoryShowcaseLayout || 'single');
          setGlobalHeaderBgColor(data.categoryShowcaseHeaderBgColor || 'transparent');
          setGlobalHeaderTextColor(data.categoryShowcaseHeaderTextColor || '#1c1917');
          setGlobalHeaderBorderColor(data.categoryShowcaseHeaderBorderColor || 'transparent');
          setGlobalHeaderFontStyle(data.categoryShowcaseHeaderFontStyle || 'serif');
          setGlobalHeaderFontSize(data.categoryShowcaseHeaderFontSize || '28px');
          setGlobalSubtitleColor(data.categoryShowcaseSubtitleColor || '#78716c');
          setGlobalEyebrowColor(data.categoryShowcaseEyebrowColor || '#e11d48');
        }
      } catch (err) {
        console.error('Error fetching global category settings:', err);
      }
    }
    loadGlobalCategorySettings();
  }, []);

  const handleSaveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGlobal(true);
    setGlobalSuccess(null);
    setGlobalError(null);

    const payload = {
      categoryShowcaseEyebrowTag: globalEyebrow,
      categoryShowcaseTitle: globalTitle,
      categoryShowcaseSubtitle: globalSubtitle,
      categoryShowcaseLayout: globalLayout,
      categoryShowcaseHeaderBgColor: 'transparent',
      categoryShowcaseHeaderTextColor: globalHeaderTextColor,
      categoryShowcaseHeaderBorderColor: 'transparent',
      categoryShowcaseHeaderFontStyle: globalHeaderFontStyle,
      categoryShowcaseHeaderFontSize: globalHeaderFontSize,
      categoryShowcaseSubtitleColor: globalSubtitleColor,
      categoryShowcaseEyebrowColor: globalEyebrowColor,
      updatedAt: new Date().toISOString()
    };

    try {
      if (!isFirebaseConfigured) {
        setGlobalSuccess('Global layout settings saved in frontend memory!');
        setSavingGlobal(false);
        return;
      }

      if (globalSettingsId) {
        const docRef = doc(db, 'websiteSettings', globalSettingsId);
        await setDoc(docRef, payload, { merge: true });
        setGlobalSuccess('Homepage Category Showcase banner options saved successfully!');
      } else {
        const settingsCol = collection(db, 'websiteSettings');
        const ref = doc(settingsCol);
        await setDoc(ref, payload);
        setGlobalSettingsId(ref.id);
        setGlobalSuccess('Initial Category Showcase settings created successfully!');
      }
    } catch (err: any) {
      console.error('Error saving global settings:', err);
      setGlobalError(err.message || 'Failed to publish settings changes.');
    } finally {
      setSavingGlobal(false);
    }
  };

  // Load Categories on Mount
  useEffect(() => {
    async function loadCategories() {
      try {
        setLoading(true);
        setError(null);

        if (!isFirebaseConfigured) {
          // Local offline mode
          const normalizedMocks = DEFAULT_CATEGORIES.map((cat, idx) => ({
            id: `cat-${cat.toLowerCase().replace(/\s+/g, '-')}`,
            name: cat,
            slug: cat.toLowerCase().replace(/\s+/g, '-'),
            description: `Exquisite handpicked selection of fine design ${cat.toLowerCase()}.`,
            imageUrl: '',
            displayOrder: idx + 1,
            status: 'active',
            offerTag: '',
            customTitle: '',
            customSubtitle: '',
            fontStyle: 'serif',
            textColor: '#ffffff',
            subtitleColor: '#fecdd3',
            offerTagColor: '#ffffff',
            offerTagBgColor: '#e11d48',
            overlayShadeColor: '#000000'
          }));
          setCategories(normalizedMocks);
          
          const counts: Record<string, number> = {};
          mockProducts.forEach((p: any) => {
            const cat = p.category || '';
            if (cat) {
              counts[cat] = (counts[cat] || 0) + 1;
            }
          });
          setProductCounts(counts);
          setLoading(false);
          return;
        }

        const catRef = collection(db, 'categories');
        const snapshot = await getDocs(catRef);
        
        const counts: Record<string, number> = {};
        try {
          const prodRef = collection(db, 'products');
          const prodSnapshot = await getDocs(prodRef);
          prodSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const cat = data.category || '';
            if (cat) {
              counts[cat] = (counts[cat] || 0) + 1;
            }
          });
        } catch (e) {
          console.warn("Failed to fetch products for count:", e);
        }
        setProductCounts(counts);
        
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            slug: data.slug || '',
            description: data.description || '',
            imageUrl: data.imageUrl || data.coverImageUrl || '',
            displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : (typeof data.order === 'number' ? data.order : 1),
            status: data.status || (data.isActive ? 'active' : 'inactive'),
            seoTitle: data.seoTitle || '',
            seoDescription: data.seoDescription || '',
            ogTitle: data.ogTitle || '',
            ogDescription: data.ogDescription || '',
            ogImage: data.ogImage || '',
            imageAltText: data.imageAltText || '',
            offerTag: data.offerTag || '',
            customTitle: data.customTitle || '',
            customSubtitle: data.customSubtitle || '',
            fontStyle: data.fontStyle || 'serif',
            textColor: data.textColor || '#ffffff',
            subtitleColor: data.subtitleColor || '#fecdd3',
            offerTagColor: data.offerTagColor || '#ffffff',
            offerTagBgColor: data.offerTagBgColor || '#e11d48',
            overlayShadeColor: data.overlayShadeColor || '#000000'
          };
        });

        // Sort by display order asc
        items.sort((a, b) => a.displayOrder - b.displayOrder);
        setCategories(items);
      } catch (err: any) {
        console.error('Error fetching categories:', err);
        setError('Failed to fetch categories: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, [view]);

  // Generate URL friendly slug from name
  const generateSlug = (nameStr: string) => {
    return nameStr
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // remove special chars
      .replace(/\s+/g, '-'); // replace spaces with hyphens
  };

  const getAssignedProductsCount = () => {
    if (!formData.name && !formData.slug) return 0;
    const keyId = formData.id;
    const keyName = formData.name.toLowerCase();
    const keySlug = formData.slug.toLowerCase();
    
    let count = 0;
    Object.keys(productCounts).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (
        (keyId && lowerKey === keyId.toLowerCase()) ||
        lowerKey === keyName ||
        lowerKey === keySlug ||
        lowerKey === `cat-${keySlug}` ||
        lowerKey === keyName.replace(/\s+/g, '-')
      ) {
        count += productCounts[key];
      }
    });
    return count;
  };

  const handleNameChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      name: val,
      slug: generateSlug(val)
    }));
  };

  // Setup Edit Actions
  const startEdit = (cat: any) => {
    setFormData({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.imageUrl,
      displayOrder: cat.displayOrder,
      status: cat.status,
      seoTitle: cat.seoTitle || '',
      seoDescription: cat.seoDescription || '',
      ogTitle: cat.ogTitle || '',
      ogDescription: cat.ogDescription || '',
      ogImage: cat.ogImage || '',
      imageAltText: cat.imageAltText || '',
      offerTag: cat.offerTag || '',
      customTitle: cat.customTitle || '',
      customSubtitle: cat.customSubtitle || '',
      fontStyle: cat.fontStyle || 'serif',
      textColor: cat.textColor || '#ffffff',
      subtitleColor: cat.subtitleColor || '#fecdd3',
      offerTagColor: cat.offerTagColor || '#ffffff',
      offerTagBgColor: cat.offerTagBgColor || '#e11d48',
      overlayShadeColor: cat.overlayShadeColor || '#000000'
    });
    setError(null);
    setSuccess(null);
    setView('edit');
  };

  // Setup Add Action Mode
  const startAdd = (presetName: string = '') => {
    const nextOrder = categories.length > 0 
      ? Math.max(...categories.map(c => c.displayOrder)) + 1 
      : 1;

    setFormData({
      id: '',
      name: presetName,
      slug: generateSlug(presetName),
      description: presetName ? `Explore the finest handcrafted gold and diamond ${presetName.toLowerCase()} collection of Parasmoni.` : '',
      imageUrl: '',
      displayOrder: nextOrder,
      status: 'active',
      seoTitle: '',
      seoDescription: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      imageAltText: '',
      offerTag: '',
      customTitle: '',
      customSubtitle: '',
      fontStyle: 'serif',
      textColor: '#ffffff',
      subtitleColor: '#fecdd3',
      offerTagColor: '#ffffff',
      offerTagBgColor: '#e11d48',
      overlayShadeColor: '#000000'
    });
    setError(null);
    setSuccess(null);
    setView('add');
  };

  // Toggle Publish Status
  const toggleStatus = async (cat: any) => {
    const newStatus = cat.status === 'active' ? 'inactive' : 'active';
    try {
      if (isFirebaseConfigured && db) {
        const docRef = doc(db, 'categories', cat.id);
        await setDoc(docRef, {
          ...cat,
          status: newStatus,
          isActive: newStatus === 'active', // backward compatibility
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email || 'admin'
        }, { merge: true });
      }

      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, status: newStatus } : c));
      setSuccess(`Category state updated successfully.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Failed to toggle status: ${err.message}`);
    }
  };

  // Move Display Sequence Order
  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const currentCat = categories[index];
    const neighborCat = categories[targetIndex];

    const currentOrder = currentCat.displayOrder;
    const neighborOrder = neighborCat.displayOrder;

    // Swap locally
    const updated = [...categories];
    updated[index] = { ...currentCat, displayOrder: neighborOrder };
    updated[targetIndex] = { ...neighborCat, displayOrder: currentOrder };
    updated.sort((a, b) => a.displayOrder - b.displayOrder);
    setCategories(updated);

    // Swap in Firestore
    try {
      if (isFirebaseConfigured && db) {
        const refA = doc(db, 'categories', currentCat.id);
        const refB = doc(db, 'categories', neighborCat.id);

        await Promise.all([
          setDoc(refA, { ...currentCat, displayOrder: neighborOrder, order: neighborOrder }, { merge: true }),
          setDoc(refB, { ...neighborCat, displayOrder: currentOrder, order: currentOrder }, { merge: true })
        ]);
      }
      setSuccess(`Sequence order rearranged.`);
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      setError(`Failed to save reordered sequence: ${err.message}`);
    }
  };

  // Delete Category
  const handleDelete = async (cat: any) => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${cat.name}"? Active catalog pieces bound to this category might lose their structure reference.`)) {
      return;
    }

    try {
      if (isFirebaseConfigured && db) {
        await deleteDoc(doc(db, 'categories', cat.id));
      }

      setCategories(prev => prev.filter(c => c.id !== cat.id));
      setSuccess(`Successfully deleted category.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Failed to delete category: ${err.message}`);
    }
  };

  // Save / Update Category Submission
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name.trim()) {
      setError('Category name is required.');
      return;
    }
    if (!formData.slug.trim()) {
      setError('A URL slug is required.');
      return;
    }
    if (!formData.imageUrl) {
      setError('ImageKit cover image is required.');
      return;
    }

    setSaving(true);
    const targetId = formData.id || 'cat_' + Math.random().toString(36).substr(2, 9);

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim().toLowerCase(),
      description: formData.description.trim(),
      imageUrl: formData.imageUrl,
      coverImageUrl: formData.imageUrl, // dual backward compatibility mapping
      displayOrder: Number(formData.displayOrder || 1),
      order: Number(formData.displayOrder || 1), // dual backward compatibility mapping
      status: formData.status,
      isActive: formData.status === 'active', // dual backward compatibility mapping
      seoTitle: formData.seoTitle.trim() || `${formData.name} Category | Parasmoni Jewellers`,
      seoDescription: formData.seoDescription.trim() || formData.description.trim().substring(0, 150),
      ogTitle: formData.ogTitle.trim() || formData.seoTitle.trim() || formData.name,
      ogDescription: formData.ogDescription.trim() || formData.seoDescription.trim() || formData.description.trim(),
      ogImage: formData.ogImage.trim() || formData.imageUrl || '',
      imageAltText: formData.imageAltText.trim() || formData.name,
      offerTag: formData.offerTag.trim(),
      customTitle: formData.customTitle.trim(),
      customSubtitle: formData.customSubtitle.trim(),
      fontStyle: formData.fontStyle,
      textColor: formData.textColor,
      subtitleColor: formData.subtitleColor,
      offerTagColor: formData.offerTagColor,
      offerTagBgColor: formData.offerTagBgColor,
      overlayShadeColor: formData.overlayShadeColor,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.email || 'admin'
    };

    try {
      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'categories', targetId), payload, { merge: true });
      }

      setSuccess(formData.id ? 'Category updated successfully.' : 'New category registered!');
      setTimeout(() => {
        setView('list');
      }, 1000);
    } catch (err: any) {
      setError(`Failed to save category: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" id="category-management-module">
      
      {/* Messages banner */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 rounded flex items-start gap-3 text-xs" id="categories-error-card">
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 rounded flex items-start gap-3 text-xs animate-pulse" id="categories-success-card">
          <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-emerald-500" />
          <p className="leading-relaxed">{success}</p>
        </div>
      )}

      {/* VIEW: LIST */}
      {view === 'list' && (
        <div className="space-y-6" id="categories-list-view">
          
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-100">Jewellery Categories</h2>
              <p className="text-[10px] text-stone-500 font-sans mt-0.5 font-sans">Define primary catalog sections and filter parameters for customer navigation.</p>
            </div>
            <button
              onClick={() => startAdd()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold uppercase rounded cursor-pointer transition-all tracking-wider"
              id="btn-add-category"
            >
              <Plus className="w-4 h-4" />
              <span>Register Category</span>
            </button>
          </div>

          {/* Quick preset suggestions bar */}
          <div className="p-4 bg-stone-900/30 border border-stone-800 rounded space-y-2" id="categories-presets-box">
            <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest block font-sans">Quick Category Presets Setup</span>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_CATEGORIES.map(preset => {
                const isExisting = categories.some(c => c.name.toLowerCase() === preset.toLowerCase());
                return (
                  <button
                    key={preset}
                    onClick={() => startAdd(preset)}
                    disabled={isExisting}
                    className={`px-2.5 py-1 text-[10px] rounded border transition-all cursor-pointer ${
                      isExisting 
                        ? 'border-stone-800/40 bg-stone-900/20 text-stone-600 cursor-not-allowed' 
                        : 'border-stone-800 bg-stone-950 hover:bg-stone-900 hover:border-stone-700 text-stone-300'
                    }`}
                  >
                    + {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-stone-500 text-xs" id="categories-loader">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Retrieving categories directory...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center bg-stone-900/30 border border-stone-800 rounded p-6 text-stone-500 text-xs space-y-2">
              <Tag className="w-8 h-8 text-stone-600 mx-auto" />
              <p>No jewellery categories registered yet.</p>
              <p className="text-[10px] text-stone-600">Click any category preset above to instantiate catalogs instantly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="categories-cards-grid">
              {categories.map((c, index) => {
                const isInactive = c.status === 'inactive';
                
                return (
                  <div 
                    key={c.id} 
                    className={`bg-stone-900 border transition-all rounded p-4 flex gap-4 items-center justify-between ${
                      isInactive ? 'border-stone-800/50 bg-stone-900/40 opacity-70' : 'border-stone-800 hover:border-stone-700 bg-stone-900/80'
                    }`}
                    id={`category-card-${c.id}`}
                  >
                    {/* Category Cover */}
                    <div className="flex gap-4 items-center flex-1 min-w-0">
                      <div className="relative w-16 h-16 bg-stone-950 border border-stone-800 rounded overflow-hidden shrink-0">
                        {c.imageUrl ? (
                          <img 
                            src={c.imageUrl} 
                            alt={c.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-700">
                            <Tag className="w-6 h-6" />
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[8px] font-mono font-bold text-amber-500 border border-stone-850">
                          #{c.displayOrder}
                        </span>
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif font-bold text-stone-100 text-xs truncate">{c.name}</h4>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                            isInactive 
                              ? 'bg-stone-950 text-stone-500 border-stone-800' 
                              : 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <p className="text-stone-400 text-[10px] leading-relaxed line-clamp-1">{c.description || 'No description provided.'}</p>
                        <span className="text-[9px] text-stone-500 font-mono flex items-center gap-1">
                          <LinkIcon className="w-3 h-3 text-stone-600" />
                          <span>/category/{c.slug}</span>
                        </span>
                      </div>
                    </div>

                    {/* Operational Controls Block */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      
                      {/* Sequencing arrows */}
                      <div className="flex items-center bg-stone-950 border border-stone-800/80 rounded p-0.5">
                        <button
                          onClick={() => moveOrder(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-stone-400 hover:text-amber-500 disabled:opacity-30 disabled:hover:text-stone-400 transition-colors cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <div className="h-4 w-px bg-stone-800" />
                        <button
                          onClick={() => moveOrder(index, 'down')}
                          disabled={index === categories.length - 1}
                          className="p-1 text-stone-400 hover:text-amber-500 disabled:opacity-30 disabled:hover:text-stone-400 transition-colors cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Publish Visibility toggle */}
                      <button
                        onClick={() => toggleStatus(c)}
                        className={`p-1.5 rounded border text-xs transition-colors cursor-pointer ${
                          isInactive 
                            ? 'border-stone-800 hover:border-stone-700 hover:bg-stone-900 text-stone-400 hover:text-stone-100' 
                            : 'border-stone-800 hover:border-stone-700 hover:bg-stone-900 text-amber-500 hover:text-amber-400'
                        }`}
                        title={isInactive ? 'Enable Category' : 'Disable Category'}
                      >
                        {isInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => startEdit(c)}
                        className="p-1.5 bg-stone-950 border border-stone-850 hover:border-amber-500 hover:text-amber-400 rounded text-stone-300 transition-colors cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(c)}
                        className="p-1.5 bg-stone-950 border border-stone-855 hover:border-red-900 hover:text-red-400 rounded text-stone-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* Global Category Showcase Heading & Styling Section */}
          <div className="bg-stone-900/40 border border-stone-800 rounded p-6 mt-8 space-y-6" id="global-category-settings-panel">
            <div className="border-b border-stone-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs uppercase tracking-widest font-bold text-amber-500 flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  <span>Homepage Categories Header & Section Customization</span>
                </h3>
                <p className="text-[10px] text-stone-500 mt-1 font-sans">Configure layout rows, fonts, custom colors, and background buttons of the showcase heading.</p>
              </div>
            </div>

            {globalSuccess && (
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs rounded flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>{globalSuccess}</span>
              </div>
            )}

            {globalError && (
              <div className="p-3 bg-red-950/25 border border-red-500/20 text-red-400 text-xs rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>{globalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveGlobalSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Eyebrow Tag */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Section Eyebrow Tag (e.g. CURATED SELECTIONS)</label>
                  <input
                    type="text"
                    value={globalEyebrow}
                    onChange={(e) => setGlobalEyebrow(e.target.value)}
                    placeholder="Leave empty to hide eyebrow"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-500 focus:outline-hidden text-xs rounded text-stone-200"
                  />
                </div>

                {/* Main Heading title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                    Section Header Text <span className="text-rose-400">* Leave empty to hide title completely</span>
                  </label>
                  <input
                    type="text"
                    value={globalTitle}
                    onChange={(e) => setGlobalTitle(e.target.value)}
                    placeholder="e.g. CATEGORIES"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-500 focus:outline-hidden text-xs rounded text-stone-200 font-sans uppercase font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Heading Subtitle */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Section Subtitle Text</label>
                  <input
                    type="text"
                    value={globalSubtitle}
                    onChange={(e) => setGlobalSubtitle(e.target.value)}
                    placeholder="Leave empty to hide subtitle"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-500 focus:outline-hidden text-xs rounded text-stone-200"
                  />
                </div>

                {/* Showcase layout style */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Showcase Scrolling Layout Grid</label>
                  <select
                    value={globalLayout}
                    onChange={(e) => setGlobalLayout(e.target.value as 'single' | 'double')}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-500 focus:outline-hidden text-xs rounded text-stone-200 cursor-pointer font-sans"
                  >
                    <option value="single">Single Row Horizontal List (Standard)</option>
                    <option value="double">Double Rows (2-Tier Bento Scrolling Grid)</option>
                  </select>
                </div>
              </div>

              {/* Advanced Header Styling Block */}
              <div className="p-4 bg-stone-950/60 border border-stone-850/60 rounded space-y-4">
                <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest block font-sans">Advanced Header Design & Typography Size</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  {/* Header Font style */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Header Font Style</label>
                    <select
                      value={globalHeaderFontStyle}
                      onChange={(e) => setGlobalHeaderFontStyle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 focus:border-amber-500 focus:outline-hidden text-xs rounded text-stone-300 font-sans cursor-pointer"
                    >
                      <option value="serif">Elegant Serif (Playfair Display)</option>
                      <option value="sans">Modern Sans-Serif (Inter)</option>
                      <option value="cursive">Decorative Cursive (Sacramento/Script)</option>
                      <option value="mono">Symmetric Monospace (Courier)</option>
                      <option value="cinzel">Majestic Roman Luxury (Cinzel)</option>
                      <option value="cormorant">Royal Renaissance Serif (Cormorant Garamond)</option>
                      <option value="marcellus">Classic Ancient Trajan (Marcellus)</option>
                      <option value="lobster">Playful Vintage Retro (Lobster)</option>
                      <option value="alex-brush">Premium Script Calligraphy (Alex Brush)</option>
                      <option value="poppins">Sleek Rounded Geometric (Poppins)</option>
                    </select>
                  </div>

                  {/* Header Font Size */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Header Text Size</label>
                    <select
                      value={globalHeaderFontSize}
                      onChange={(e) => setGlobalHeaderFontSize(e.target.value)}
                      className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 focus:border-amber-500 focus:outline-hidden text-xs rounded text-stone-300 font-sans cursor-pointer"
                    >
                      <option value="16px">Tiny (16px)</option>
                      <option value="20px">Small (20px)</option>
                      <option value="24px">Medium (24px)</option>
                      <option value="28px">Regular (28px)</option>
                      <option value="32px">Large (32px)</option>
                      <option value="36px">Extra Large (36px)</option>
                      <option value="42px">Display (42px)</option>
                      <option value="48px">Super Display (48px)</option>
                      <option value="56px">Sovereign Huge (56px)</option>
                    </select>
                  </div>

                  {/* Header Text color */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Header Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={globalHeaderTextColor.startsWith('#') && globalHeaderTextColor.length === 7 ? globalHeaderTextColor : '#1c1917'}
                        onChange={(e) => setGlobalHeaderTextColor(e.target.value)}
                        className="w-8 h-8 rounded border border-stone-850 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={globalHeaderTextColor}
                        onChange={(e) => setGlobalHeaderTextColor(e.target.value)}
                        placeholder="#1c1917"
                        className="w-full px-2 py-1 bg-stone-900 border border-stone-800 focus:border-amber-500 focus:outline-hidden text-xs rounded text-stone-200 font-mono"
                      />
                    </div>
                  </div>

                  {/* Eyebrow tag color */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Eyebrow Tag Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={globalEyebrowColor.startsWith('#') && globalEyebrowColor.length === 7 ? globalEyebrowColor : '#e11d48'}
                        onChange={(e) => setGlobalEyebrowColor(e.target.value)}
                        className="w-8 h-8 rounded border border-stone-850 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={globalEyebrowColor}
                        onChange={(e) => setGlobalEyebrowColor(e.target.value)}
                        placeholder="#e11d48"
                        className="w-full px-2 py-1 bg-stone-900 border border-stone-800 focus:border-amber-500 focus:outline-hidden text-xs rounded text-stone-200 font-mono"
                      />
                    </div>
                  </div>

                  {/* Subtitle color */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Subtitle Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={globalSubtitleColor.startsWith('#') && globalSubtitleColor.length === 7 ? globalSubtitleColor : '#78716c'}
                        onChange={(e) => setGlobalSubtitleColor(e.target.value)}
                        className="w-8 h-8 rounded border border-stone-850 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={globalSubtitleColor}
                        onChange={(e) => setGlobalSubtitleColor(e.target.value)}
                        placeholder="#78716c"
                        className="w-full px-2 py-1 bg-stone-900 border border-stone-800 focus:border-amber-500 focus:outline-hidden text-xs rounded text-stone-200 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingGlobal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all font-sans"
                >
                  {savingGlobal ? 'Publishing Section Settings...' : 'Save Category Showcase Layout & Header'}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* VIEW: ADD / EDIT FORM */}
      {(view === 'add' || view === 'edit') && (
        <form onSubmit={handleSave} className="space-y-6" id="category-form">
          
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-100">
                {view === 'add' ? 'Register Category Casing' : 'Edit Category Casing Properties'}
              </h2>
              <p className="text-[10px] text-stone-500 mt-0.5">Define SEO web routing parameters, sequencing orders, and beautiful covers.</p>
            </div>
            
            <button
              type="button"
              onClick={() => setView('list')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-stone-800 hover:bg-stone-900 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer text-stone-400 hover:text-stone-200"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Content Column - 7/12 */}
            <div className="md:col-span-7 space-y-4">
              
              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Category Title Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Traditional Jhumka Earrings"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-200 placeholder-stone-600 font-sans"
                />
              </div>

              {/* URL Slug */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                  SEO URL Slug (Autogenerated, editable) *
                </label>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-3 py-2 bg-stone-950 border border-r-0 border-stone-800 text-[10px] font-mono text-stone-500 rounded-l select-none">
                    /category/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="jhumka-earrings"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded-r text-stone-300 font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Aesthetic Description Overview</label>
                <textarea
                  rows={4}
                  placeholder="e.g. Gorgeous long-hanging gold earrings with intricate nakashi work designed for grand celebratory events."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-200 placeholder-stone-600 font-sans resize-none"
                />
              </div>

              {/* Product Assignments Info Card */}
              <div className="p-4 bg-stone-900 border border-stone-800 rounded space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Product Assignments Stats</span>
                  <span className="text-xs font-mono font-bold text-amber-500">{getAssignedProductsCount()} products</span>
                </div>
                <p className="text-[10px] text-stone-500 font-sans leading-relaxed">
                  Active stock items matching this category classification name or URL slug.
                </p>
                {getAssignedProductsCount() === 0 ? (
                  <div className="pt-2 border-t border-stone-850">
                    <Link
                      to="/admin/products"
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-wider"
                    >
                      <span>Assign / Add Products to this Category &rarr;</span>
                    </Link>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-stone-850">
                    <Link
                      to="/admin/products"
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-stone-400 hover:text-stone-300 uppercase tracking-wider"
                    >
                      <span>Manage Category Products &rarr;</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Showcase Design Overlay Settings */}
              <div className="p-5 bg-stone-950 border border-stone-800 rounded space-y-4">
                <h3 className="font-serif font-bold text-stone-200 text-xs flex items-center gap-1.5 uppercase tracking-wider border-b border-stone-900 pb-2">
                  <Sliders className="w-4 h-4 text-rose-500" />
                  <span>Showcase Tile Customization & Typography</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Custom Title Override */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Tile Title Override</label>
                    <input
                      type="text"
                      placeholder="e.g. Purple Radiance (Defaults to Name)"
                      value={formData.customTitle}
                      onChange={(e) => setFormData({ ...formData, customTitle: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-rose-500 focus:outline-hidden text-xs rounded text-stone-200 placeholder-stone-600 font-sans"
                    />
                  </div>

                  {/* Font Family Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Text Font Style</label>
                    <select
                      value={formData.fontStyle}
                      onChange={(e) => setFormData({ ...formData, fontStyle: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-rose-500 focus:outline-hidden text-xs rounded text-stone-300 font-sans cursor-pointer"
                    >
                      <option value="serif">Elegant Serif (Playfair / Luxury)</option>
                      <option value="sans">Modern Sans-Serif (Inter / Minimal)</option>
                      <option value="cursive">Decorative Cursive (Signature Style)</option>
                      <option value="mono">Symmetric Monospace (Clean Slate)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title Font Color */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Title Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.textColor && formData.textColor.startsWith('#') && formData.textColor.length === 7 ? formData.textColor : '#ffffff'}
                        onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                        className="w-8 h-8 rounded border border-stone-850 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder="#ffffff"
                        value={formData.textColor}
                        onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                        className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 focus:border-rose-500 focus:outline-hidden text-xs rounded text-stone-200 font-mono"
                      />
                    </div>
                  </div>

                  {/* Custom Subtitle text */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Tile Subtitle Text</label>
                    <input
                      type="text"
                      placeholder="e.g. Gemstone Edit"
                      value={formData.customSubtitle}
                      onChange={(e) => setFormData({ ...formData, customSubtitle: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-rose-500 focus:outline-hidden text-xs rounded text-stone-200 placeholder-stone-600 font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Subtitle Font Color */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Subtitle Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.subtitleColor && formData.subtitleColor.startsWith('#') && formData.subtitleColor.length === 7 ? formData.subtitleColor : '#fecdd3'}
                        onChange={(e) => setFormData({ ...formData, subtitleColor: e.target.value })}
                        className="w-8 h-8 rounded border border-stone-850 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder="#fecdd3"
                        value={formData.subtitleColor}
                        onChange={(e) => setFormData({ ...formData, subtitleColor: e.target.value })}
                        className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 focus:border-rose-500 focus:outline-hidden text-xs rounded text-stone-200 font-mono"
                      />
                    </div>
                  </div>

                  {/* Offer Tag text */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Promotional Offer Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. 15% OFF, BESTSELLER, NEW"
                      value={formData.offerTag}
                      onChange={(e) => setFormData({ ...formData, offerTag: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-rose-500 focus:outline-hidden text-xs rounded text-stone-200 placeholder-stone-600 font-sans font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Offer Tag Text Color */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Offer Tag Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.offerTagColor && formData.offerTagColor.startsWith('#') && formData.offerTagColor.length === 7 ? formData.offerTagColor : '#ffffff'}
                        onChange={(e) => setFormData({ ...formData, offerTagColor: e.target.value })}
                        className="w-8 h-8 rounded border border-stone-850 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder="#ffffff"
                        value={formData.offerTagColor}
                        onChange={(e) => setFormData({ ...formData, offerTagColor: e.target.value })}
                        className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 focus:border-rose-500 focus:outline-hidden text-xs rounded text-stone-200 font-mono"
                      />
                    </div>
                  </div>

                  {/* Offer Tag Background Color */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Offer Tag Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.offerTagBgColor && formData.offerTagBgColor.startsWith('#') && formData.offerTagBgColor.length === 7 ? formData.offerTagBgColor : '#e11d48'}
                        onChange={(e) => setFormData({ ...formData, offerTagBgColor: e.target.value })}
                        className="w-8 h-8 rounded border border-stone-850 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder="#e11d48"
                        value={formData.offerTagBgColor}
                        onChange={(e) => setFormData({ ...formData, offerTagBgColor: e.target.value })}
                        className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 focus:border-rose-500 focus:outline-hidden text-xs rounded text-stone-200 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Bottom Shade Color overlay */}
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block flex items-center justify-between">
                      <span>Bottom Overlay Shade Color</span>
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, overlayShadeColor: 'transparent' })}
                        className="text-[9px] text-rose-400 hover:text-rose-300 transition-colors font-sans lowercase font-medium"
                      >
                        Set Transparent (No Shade)
                      </button>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        disabled={formData.overlayShadeColor === 'transparent'}
                        value={formData.overlayShadeColor && formData.overlayShadeColor.startsWith('#') && formData.overlayShadeColor.length === 7 ? formData.overlayShadeColor : '#000000'}
                        onChange={(e) => setFormData({ ...formData, overlayShadeColor: e.target.value })}
                        className={`w-8 h-8 rounded border border-stone-850 bg-transparent cursor-pointer ${formData.overlayShadeColor === 'transparent' ? 'opacity-40 cursor-not-allowed' : ''}`}
                      />
                      <input
                        type="text"
                        placeholder="#000000 or transparent"
                        value={formData.overlayShadeColor}
                        onChange={(e) => setFormData({ ...formData, overlayShadeColor: e.target.value })}
                        className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 focus:border-rose-500 focus:outline-hidden text-xs rounded text-stone-200 font-mono"
                      />
                    </div>
                    <p className="text-[9px] text-stone-500 leading-normal">
                      Customize the color shade behind category title. Select any color or type 'transparent' to make the background completely see-through.
                    </p>
                  </div>
                </div>
              </div>

              {/* SEO & Meta configurations block */}
              <div className="p-5 bg-stone-950 border border-stone-800 rounded space-y-4">
                <h3 className="font-serif font-bold text-stone-200 text-xs flex items-center gap-1.5 uppercase tracking-wider border-b border-stone-900 pb-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>SEO & Social Open Graph metadata</span>
                </h3>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Meta Title Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Traditional Kolkata Gold Earrings & Jhumkas"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-200 placeholder-stone-600 font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Meta Description Tag</label>
                  <textarea
                    rows={2}
                    placeholder="Describe the ornaments group in 150 characters to increase Google click rates..."
                    value={formData.seoDescription}
                    onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-200 placeholder-stone-600 font-sans resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Image Alt Text tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Elegant Gold Jhumka Earrings Selection Banner"
                    value={formData.imageAltText}
                    onChange={(e) => setFormData({ ...formData, imageAltText: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-200 placeholder-stone-600 font-sans"
                  />
                </div>

                <div className="pt-2 border-t border-stone-900 space-y-3">
                  <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Social Open Graph Properties (OG)</span>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-stone-500 font-bold uppercase tracking-wider block">OG Card Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Kolkata Handcrafted Jhumkas & Chandbalis"
                      value={formData.ogTitle}
                      onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-[11px] rounded text-stone-300 font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-stone-500 font-bold uppercase tracking-wider block">OG Card Description</label>
                    <textarea
                      rows={2}
                      placeholder="Custom summary when sharing category link on social media..."
                      value={formData.ogDescription}
                      onChange={(e) => setFormData({ ...formData, ogDescription: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-[11px] rounded text-stone-300 font-sans resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-stone-500 font-bold uppercase tracking-wider block">OG Cover Image URL</label>
                    <input
                      type="text"
                      placeholder="Defaults to category cover asset if left blank"
                      value={formData.ogImage}
                      onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-[10px] rounded text-stone-300 font-mono"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Images Column - 5/12 */}
            <div className="md:col-span-5 space-y-5">
              
              {/* Display Order & Status Settings block */}
              <div className="p-4 bg-stone-950/60 border border-stone-800 rounded space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Display Order */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Sequence Order Index</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-200 font-mono font-bold text-center"
                    />
                  </div>

                  {/* Status Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Publishing Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-300 font-semibold cursor-pointer"
                    >
                      <option value="active">Active (Visible)</option>
                      <option value="inactive">Inactive (Disabled)</option>
                    </select>
                  </div>

                </div>

              </div>

              {/* Cover image uploader */}
              <div className="space-y-2">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                  Category Showcase Cover Image *
                </label>
                <ImageUploader
                  id="category-image-uploader"
                  multiple={false}
                  value={formData.imageUrl}
                  onChange={(val) => setFormData({ ...formData, imageUrl: val as string })}
                  folder={IMAGEKIT_FOLDERS.categories}
                />
                {formData.imageUrl && (
                  <div className="p-1 border border-stone-800 rounded bg-stone-950">
                    <img 
                      src={formData.imageUrl} 
                      alt="Category cover preview" 
                      className="w-full h-32 object-cover rounded-sm"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Form Actions Footer Bar */}
          <div className="border-t border-stone-800 pt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setView('list')}
              className="px-4 py-2 border border-stone-850 hover:bg-stone-900 text-xs font-bold uppercase tracking-wider rounded text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 disabled:cursor-not-allowed text-stone-950 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
              id="btn-save-category"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Synchronizing with Cloud...' : 'Commit Category'}</span>
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
