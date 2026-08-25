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
  Sparkles
} from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';
import { IMAGEKIT_FOLDERS } from '../imagekit/client';

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
    imageAltText: ''
  });

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
            status: 'active'
          }));
          setCategories(normalizedMocks);
          setLoading(false);
          return;
        }

        const catRef = collection(db, 'categories');
        const snapshot = await getDocs(catRef);
        
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
            imageAltText: data.imageAltText || ''
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
      imageAltText: cat.imageAltText || ''
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
      imageAltText: ''
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
