/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Collection Management
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
  FolderHeart, 
  Link as LinkIcon, 
  AlertCircle, 
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';
import { IMAGEKIT_FOLDERS } from '../imagekit/client';
import { mockCollections } from '../data/mockData';

// Suggested premium collection labels
const SUGGESTED_COLLECTIONS = [
  'Rings', 'Earrings', 'Necklaces', 'Chains', 'Bracelets', 'Bangles', 
  'Mangalsutra', 'Pendants', 'Nose Pins', 'Anklets', 'Jhumkas', 
  'Wedding', 'Bridal', 'Daily Wear', 'Party Wear', "Men's", "Kids", 'New Arrivals'
];

export function AdminCollections(): React.JSX.Element {
  const { user } = useAuth();
  
  // UI View Mode State
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [collections, setCollections] = useState<any[]>([]);
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
    isFeatured: false,
    seoTitle: '',
    seoDescription: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    imageAltText: ''
  });

  // Load Collections on Mount
  useEffect(() => {
    async function loadCollections() {
      try {
        setLoading(true);
        setError(null);

        if (!isFirebaseConfigured) {
          const normalizedMocks = mockCollections.map((c, idx) => ({
            id: c.id,
            name: c.name,
            slug: c.slug || '',
            description: c.description || '',
            imageUrl: c.imageUrl || '',
            displayOrder: idx + 1,
            status: 'active',
            isFeatured: c.slug === 'kundan' || c.slug === 'solitaires'
          }));
          setCollections(normalizedMocks);
          setLoading(false);
          return;
        }

        const colRef = collection(db, 'collections');
        const snapshot = await getDocs(colRef);
        
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
            isFeatured: !!data.isFeatured,
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
        setCollections(items);
      } catch (err: any) {
        console.error('Error fetching collections:', err);
        setError('Failed to fetch collections: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCollections();
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
  const startEdit = (coll: any) => {
    setFormData({
      id: coll.id,
      name: coll.name,
      slug: coll.slug,
      description: coll.description,
      imageUrl: coll.imageUrl,
      displayOrder: coll.displayOrder,
      status: coll.status,
      isFeatured: coll.isFeatured,
      seoTitle: coll.seoTitle || '',
      seoDescription: coll.seoDescription || '',
      ogTitle: coll.ogTitle || '',
      ogDescription: coll.ogDescription || '',
      ogImage: coll.ogImage || '',
      imageAltText: coll.imageAltText || ''
    });
    setError(null);
    setSuccess(null);
    setView('edit');
  };

  // Setup Add Action Mode
  const startAdd = (presetName: string = '') => {
    const nextOrder = collections.length > 0 
      ? Math.max(...collections.map(c => c.displayOrder)) + 1 
      : 1;

    setFormData({
      id: '',
      name: presetName,
      slug: generateSlug(presetName),
      description: presetName ? `Curated selection of fine ${presetName.toLowerCase()} handcrafted with unmatched precision.` : '',
      imageUrl: '',
      displayOrder: nextOrder,
      status: 'active',
      isFeatured: false,
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
  const toggleStatus = async (coll: any) => {
    const newStatus = coll.status === 'active' ? 'inactive' : 'active';
    try {
      if (isFirebaseConfigured && db) {
        const docRef = doc(db, 'collections', coll.id);
        await setDoc(docRef, {
          ...coll,
          status: newStatus,
          isActive: newStatus === 'active', // full backward compatibility
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email || 'admin'
        }, { merge: true });
      }

      setCollections(prev => prev.map(c => c.id === coll.id ? { ...c, status: newStatus } : c));
      setSuccess(`Collection state updated.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Failed to update status: ${err.message}`);
    }
  };

  // Move Display Sequence Order
  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === collections.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const currentColl = collections[index];
    const neighborColl = collections[targetIndex];

    const currentOrder = currentColl.displayOrder;
    const neighborOrder = neighborColl.displayOrder;

    // Swap locally
    const updated = [...collections];
    updated[index] = { ...currentColl, displayOrder: neighborOrder };
    updated[targetIndex] = { ...neighborColl, displayOrder: currentOrder };
    updated.sort((a, b) => a.displayOrder - b.displayOrder);
    setCollections(updated);

    // Swap in Firestore
    try {
      if (isFirebaseConfigured && db) {
        const refA = doc(db, 'collections', currentColl.id);
        const refB = doc(db, 'collections', neighborColl.id);

        await Promise.all([
          setDoc(refA, { ...currentColl, displayOrder: neighborOrder, order: neighborOrder }, { merge: true }),
          setDoc(refB, { ...neighborColl, displayOrder: currentOrder, order: currentOrder }, { merge: true })
        ]);
      }
      setSuccess(`Sequence order rearranged.`);
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      setError(`Failed to reorder: ${err.message}`);
    }
  };

  // Delete Collection
  const handleDelete = async (coll: any) => {
    if (!window.confirm(`Are you sure you want to delete "${coll.name}"? Existing products associated with this collection may lose their filter reference.`)) {
      return;
    }

    try {
      if (isFirebaseConfigured && db) {
        await deleteDoc(doc(db, 'collections', coll.id));
      }

      setCollections(prev => prev.filter(c => c.id !== coll.id));
      setSuccess(`Successfully deleted collection.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Failed to delete collection: ${err.message}`);
    }
  };

  // Save / Update Collection Submission
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name.trim()) {
      setError('Collection name is required.');
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
    const targetId = formData.id || 'col_' + Math.random().toString(36).substr(2, 9);

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
      isFeatured: formData.isFeatured,
      seoTitle: formData.seoTitle.trim() || `${formData.name} Collection | Parasmoni Jewellers`,
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
        await setDoc(doc(db, 'collections', targetId), payload, { merge: true });
      }

      setSuccess(formData.id ? 'Collection updated successfully.' : 'New curated collection saved!');
      setTimeout(() => {
        setView('list');
      }, 1000);
    } catch (err: any) {
      setError(`Failed to save collection: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" id="collection-management-module">
      
      {/* Messages banner */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 rounded flex items-start gap-3 text-xs" id="collections-error-card">
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 rounded flex items-start gap-3 text-xs animate-pulse" id="collections-success-card">
          <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-emerald-500" />
          <p className="leading-relaxed">{success}</p>
        </div>
      )}

      {/* VIEW: LIST (Standard grid layout with reordering & creation helper suggestions) */}
      {view === 'list' && (
        <div className="space-y-6" id="collections-list-view">
          
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-100">Curated Design Collections</h2>
              <p className="text-[10px] text-stone-500 font-sans mt-0.5">Define high-level series groupings mapped to customer landing shelves.</p>
            </div>
            <button
              onClick={() => startAdd()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold uppercase rounded cursor-pointer transition-all tracking-wider"
              id="btn-add-collection"
            >
              <Plus className="w-4 h-4" />
              <span>Register Collection</span>
            </button>
          </div>

          {/* Quick preset suggestions bar */}
          <div className="p-4 bg-stone-900/30 border border-stone-800 rounded space-y-2" id="collections-presets-box">
            <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest block">Quick Setup Preset Suggestions</span>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_COLLECTIONS.map(preset => {
                const isExisting = collections.some(c => c.name.toLowerCase() === preset.toLowerCase());
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
            <div className="py-12 text-center text-stone-500 text-xs" id="collections-loader">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Retrieving curated categories...</span>
            </div>
          ) : collections.length === 0 ? (
            <div className="py-12 text-center bg-stone-900/30 border border-stone-800 rounded p-6 text-stone-500 text-xs space-y-2">
              <FolderHeart className="w-8 h-8 text-stone-600 mx-auto" />
              <p>No curated collections registered.</p>
              <p className="text-[10px] text-stone-600">Click any preset above or "Register Collection" to populate showroom slots.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="collections-cards-grid">
              {collections.map((c, index) => {
                const isInactive = c.status === 'inactive';
                
                return (
                  <div 
                    key={c.id} 
                    className={`bg-stone-900 border transition-all rounded p-4 flex gap-4 items-center justify-between ${
                      isInactive ? 'border-stone-800/50 bg-stone-900/40 opacity-70' : 'border-stone-800 hover:border-stone-700 bg-stone-900/80'
                    }`}
                    id={`collection-card-${c.id}`}
                  >
                    {/* Collection Cover Art */}
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
                            <FolderHeart className="w-6 h-6" />
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[8px] font-mono font-bold text-amber-500 border border-stone-850">
                          #{c.displayOrder}
                        </span>
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-serif font-bold text-stone-100 text-xs truncate">{c.name}</h4>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                            isInactive 
                              ? 'bg-stone-950 text-stone-500 border-stone-800' 
                              : 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'
                          }`}>
                            {c.status}
                          </span>
                          {c.isFeatured && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/10 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>Featured</span>
                            </span>
                          )}
                        </div>
                        <p className="text-stone-400 text-[10px] leading-relaxed line-clamp-1">{c.description || 'No description provided.'}</p>
                        <span className="text-[9px] text-stone-500 font-mono flex items-center gap-1">
                          <LinkIcon className="w-3 h-3 text-stone-600" />
                          <span>/collections/{c.slug}</span>
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
                          disabled={index === collections.length - 1}
                          className="p-1 text-stone-400 hover:text-amber-500 disabled:opacity-30 disabled:hover:text-stone-400 transition-colors cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Publish Visibility status trigger */}
                      <button
                        onClick={() => toggleStatus(c)}
                        className={`p-1.5 rounded border text-xs transition-colors cursor-pointer ${
                          isInactive 
                            ? 'border-stone-800 hover:border-stone-700 hover:bg-stone-900 text-stone-400 hover:text-stone-100' 
                            : 'border-stone-800 hover:border-stone-700 hover:bg-stone-900 text-amber-500 hover:text-amber-400'
                        }`}
                        title={isInactive ? 'Enable Collection' : 'Disable Collection'}
                      >
                        {isInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      {/* Edit click */}
                      <button
                        onClick={() => startEdit(c)}
                        className="p-1.5 bg-stone-950 border border-stone-850 hover:border-amber-500 hover:text-amber-400 rounded text-stone-300 transition-colors cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Delete click */}
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

      {/* VIEW: ADD / EDIT FORM (Detailed parameters editing) */}
      {(view === 'add' || view === 'edit') && (
        <form onSubmit={handleSave} className="space-y-6" id="collection-form">
          
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-100">
                {view === 'add' ? 'Register Curated Series' : 'Edit Curated Series Properties'}
              </h2>
              <p className="text-[10px] text-stone-500 mt-0.5">Fine-tune SEO-friendly web routing configurations and cover images.</p>
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
              
              {/* Collection Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Collection Title Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Kundan & Polki"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-200 placeholder-stone-600 font-sans"
                />
              </div>

              {/* URL Slug (Auto-generated with manual override) */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                  SEO URL Slug (Autogenerated, editable) *
                </label>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-3 py-2 bg-stone-950 border border-r-0 border-stone-800 text-[10px] font-mono text-stone-500 rounded-l select-none">
                    /collections/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="royal-kundan"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded-r text-stone-300 font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Aesthetic Curatorial Description</label>
                <textarea
                  rows={4}
                  placeholder="e.g. Rare hand-cut diamonds placed strictly in high-grade 22 karat gold foil, mapping Mughal dynasty lineage."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-200 placeholder-stone-600 font-sans resize-none"
                />
              </div>

              {/* Featured toggle */}
              <div className="p-4 bg-stone-950/40 border border-stone-850 rounded flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-300 font-bold uppercase tracking-wider block">Feature on Homepage Curations?</span>
                  <p className="text-[9px] text-stone-500 font-sans mt-0.5">Showcase this collection prominently in homepage carousel grids.</p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}
                  className={`px-3 py-1.5 border text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all ${
                    formData.isFeatured 
                      ? 'bg-amber-600 border-amber-500 text-stone-950 font-bold' 
                      : 'border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {formData.isFeatured ? 'Featured ON' : 'Off'}
                </button>
              </div>

              {/* SEO Configurations Block */}
              <div className="p-5 bg-stone-950 border border-stone-800 rounded space-y-4">
                <h3 className="font-serif font-bold text-stone-200 text-xs flex items-center gap-1.5 uppercase tracking-wider border-b border-stone-900 pb-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>SEO & Social Open Graph metadata</span>
                </h3>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Meta Title Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Traditional Kolkata Bridal Gold Collections"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-200 placeholder-stone-600 font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Meta Description Tag</label>
                  <textarea
                    rows={2}
                    placeholder="Provide a search-result snippet to maximize organic visitor clicks..."
                    value={formData.seoDescription}
                    onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-200 placeholder-stone-600 font-sans resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Image Alt Text tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Parasmoni Royal Kundan & Polki Bridal Set Banner"
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
                      placeholder="e.g. Bridal Heritage - Pure 22K Kolkata Ornaments"
                      value={formData.ogTitle}
                      onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-[11px] rounded text-stone-300 font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-stone-500 font-bold uppercase tracking-wider block">OG Card Description</label>
                    <textarea
                      rows={2}
                      placeholder="Custom summary when sharing collection link on social media..."
                      value={formData.ogDescription}
                      onChange={(e) => setFormData({ ...formData, ogDescription: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-[11px] rounded text-stone-300 font-sans resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-stone-500 font-bold uppercase tracking-wider block">OG Cover Image URL</label>
                    <input
                      type="text"
                      placeholder="Defaults to collection cover asset if left blank"
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
                  Curated Cover Image Asset *
                </label>
                <ImageUploader
                  id="collection-image-uploader"
                  multiple={false}
                  value={formData.imageUrl}
                  onChange={(val) => setFormData({ ...formData, imageUrl: val as string })}
                  folder={IMAGEKIT_FOLDERS.collections}
                />
                {formData.imageUrl && (
                  <div className="p-1 border border-stone-800 rounded bg-stone-950">
                    <img 
                      src={formData.imageUrl} 
                      alt="Collection cover preview" 
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
              id="btn-save-collection"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Synchronizing with Cloud...' : 'Commit Collection'}</span>
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
