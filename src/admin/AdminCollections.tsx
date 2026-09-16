/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Collection Management & Curated Series Hub
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  X, 
  FolderHeart, 
  Link as LinkIcon, 
  AlertCircle, 
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles,
  Search,
  Check,
  Copy,
  Layers,
  Package,
  CheckCircle2,
  HelpCircle,
  Info,
  Filter
} from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';
import { IMAGEKIT_FOLDERS } from '../imagekit/client';
import { mockCollections, mockProducts } from '../data/mockData';

// Suggested premium collection labels
const SUGGESTED_COLLECTIONS = [
  'Rings', 'Earrings', 'Necklaces', 'Chains', 'Bracelets', 'Bangles', 
  'Mangalsutra', 'Pendants', 'Nose Pins', 'Anklets', 'Jhumkas', 
  'Wedding', 'Bridal', 'Daily Wear', 'Party Wear', "Men's", "Kids", 'New Arrivals'
];

interface CollectionRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  productIds: string[];
  imageUrl?: string;
  coverImageUrl?: string;
  displayOrder: number;
  status: 'draft' | 'published' | 'active' | 'inactive';
  isActive?: boolean;
  isFeatured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function AdminCollections(): React.JSX.Element {
  const { user } = useAuth();
  
  // Collections list state
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Products catalog for product picker
  const [productsCatalog, setProductsCatalog] = useState<any[]>(mockProducts);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalStep, setModalStep] = useState<'form' | 'success'>('form');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Form Fields State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    slug: '',
    description: '',
    productIds: [] as string[],
    imageUrl: '',
    displayOrder: 1,
    status: 'draft' as 'draft' | 'published' | 'active' | 'inactive',
    isFeatured: false,
    seoTitle: '',
    seoDescription: '',
  });

  const [isSlugUserModified, setIsSlugUserModified] = useState<boolean>(false);

  // Slide-over Product Picker State & 6 Storefront Filters
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [pickerCategory, setPickerCategory] = useState<string>('All');
  const [pickerCollection, setPickerCollection] = useState<string>('All');
  const [pickerMetal, setPickerMetal] = useState<string>('All');
  const [pickerPurity, setPickerPurity] = useState<string>('All');
  const [pickerWeight, setPickerWeight] = useState<string>('All');
  const [pickerBadging, setPickerBadging] = useState<string>('All');

  // Copy buttons state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Helper to normalize category name from raw ID/string
  const normalizeCategoryName = (catRaw: any): string => {
    if (!catRaw || typeof catRaw !== 'string') return 'Necklaces';
    if (catRaw.startsWith('cat_') || catRaw.startsWith('cat-')) {
      const lower = catRaw.toLowerCase();
      if (lower.includes('neck')) return 'Necklaces';
      if (lower.includes('ear')) return 'Earrings';
      if (lower.includes('ring')) return 'Rings';
      if (lower.includes('bang') || lower.includes('kada')) return 'Bangles';
      if (lower.includes('brid')) return 'Bridal Accessories';
      if (lower.includes('chok')) return 'Chokers';
      if (lower.includes('pend')) return 'Pendants';
      return 'Necklaces';
    }
    return catRaw;
  };

  // Load Collections & Products on Mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Helper to normalize raw product objects
        const normalizeProduct = (p: any, defaultId: string) => {
          const id = p.id || defaultId;
          const rawName = p.name || p.productName || p.title || '';
          const cleanName = rawName && !rawName.startsWith('Product 7WG') && !rawName.startsWith('cat_') 
            ? rawName 
            : `Jewellery Masterpiece ${id.slice(-4).toUpperCase()}`;

          return {
            id,
            name: cleanName,
            sku: p.sku || p.productCode || `PM-${id.slice(-4).toUpperCase()}`,
            description: p.description || '',
            category: normalizeCategoryName(p.category || p.categoryName),
            collection: p.collection || p.collectionName || '',
            metalType: p.metalType || p.metal || (p.purity ? `${p.purity} Gold` : '22K Gold'),
            purity: p.purity || p.purityStandard || '22K Gold (916)',
            approxWeight: p.approxWeight || (p.grossWeight ? `${p.grossWeight}g` : (p.weight ? `${p.weight}g` : '24.50g')),
            imageUrl: p.imageUrl || p.image || p.thumbnailUrl || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600',
            featured: !!(p.featured || p.isFeatured || p.isPopular),
            newArrival: !!(p.newArrival || p.isNew),
            status: p.status || 'published'
          };
        };

        // Load Products for picker
        if (isFirebaseConfigured && db) {
          try {
            const pSnap = await getDocs(collection(db, 'products'));
            if (!pSnap.empty) {
              const loadedProds = pSnap.docs
                .map(doc => normalizeProduct({ id: doc.id, ...doc.data() }, doc.id))
                .filter(p => p.status === 'published');
              setProductsCatalog(loadedProds);
            } else {
              setProductsCatalog(
                mockProducts
                  .map((p, idx) => normalizeProduct(p, `prod-${idx + 1}`))
                  .filter(p => p.status === 'published')
              );
            }
          } catch (pErr) {
            console.warn('Using mock products fallback for picker:', pErr);
            setProductsCatalog(
              mockProducts
                .map((p, idx) => normalizeProduct(p, `prod-${idx + 1}`))
                .filter(p => p.status === 'published')
            );
          }
        } else {
          setProductsCatalog(
            mockProducts
              .map((p, idx) => normalizeProduct(p, `prod-${idx + 1}`))
              .filter(p => p.status === 'published')
          );
        }

        // Load Collections
        if (!isFirebaseConfigured) {
          const normalizedMocks: CollectionRecord[] = mockCollections.map((c, idx) => ({
            id: c.id,
            name: c.name,
            slug: c.slug || '',
            description: c.description || '',
            productIds: mockProducts.filter(p => p.collection === c.name || p.collection === c.id).map(p => p.id),
            imageUrl: c.imageUrl || '',
            displayOrder: idx + 1,
            status: 'published',
            isActive: true,
            isFeatured: c.slug === 'kundan' || c.slug === 'solitaires'
          }));
          setCollections(normalizedMocks);
          setLoading(false);
          return;
        }

        const colRef = collection(db, 'collections');
        const snapshot = await getDocs(colRef);
        
        const items: CollectionRecord[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            slug: data.slug || '',
            description: data.description || '',
            productIds: Array.isArray(data.productIds) ? data.productIds : [],
            imageUrl: data.imageUrl || data.coverImageUrl || '',
            displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : (typeof data.order === 'number' ? data.order : 1),
            status: data.status || (data.isActive ? 'published' : 'draft'),
            isActive: data.isActive ?? (data.status === 'published' || data.status === 'active'),
            isFeatured: !!data.isFeatured,
            seoTitle: data.seoTitle || '',
            seoDescription: data.seoDescription || '',
            createdAt: data.createdAt || ''
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

    loadData();
  }, []);

  // Helper: Slug transformation (lowercase, replace non-alphanumeric with hyphens, strip extra hyphens)
  const generateSlug = (nameStr: string) => {
    return nameStr
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleNameChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      name: val,
      slug: isSlugUserModified ? prev.slug : generateSlug(val)
    }));
  };

  const handleSlugChange = (val: string) => {
    setIsSlugUserModified(true);
    setFormData(prev => ({
      ...prev,
      slug: generateSlug(val)
    }));
  };

  // Open Modal for New Collection
  const openRegisterModal = (presetName: string = '') => {
    const nextOrder = collections.length > 0 
      ? Math.max(...collections.map(c => c.displayOrder)) + 1 
      : 1;

    setFormData({
      id: '',
      name: presetName,
      slug: generateSlug(presetName),
      description: presetName ? `A curated selection of handcrafted ${presetName.toLowerCase()} designed for modern elegance.` : '',
      productIds: [],
      imageUrl: '',
      displayOrder: nextOrder,
      status: 'draft',
      isFeatured: false,
      seoTitle: '',
      seoDescription: '',
    });
    setIsSlugUserModified(false);
    setIsEditing(false);
    setModalStep('form');
    setIsModalOpen(true);
    setError(null);
  };

  // Open Modal for Edit
  const openEditModal = (coll: CollectionRecord) => {
    setFormData({
      id: coll.id,
      name: coll.name,
      slug: coll.slug,
      description: coll.description || '',
      productIds: coll.productIds || [],
      imageUrl: coll.imageUrl || '',
      displayOrder: coll.displayOrder,
      status: coll.status || 'draft',
      isFeatured: !!coll.isFeatured,
      seoTitle: coll.seoTitle || '',
      seoDescription: coll.seoDescription || '',
    });
    setIsSlugUserModified(true);
    setIsEditing(true);
    setModalStep('form');
    setIsModalOpen(true);
    setError(null);
  };

  // Toggle Selection of Product in Picker
  const toggleProductSelection = (prodId: string) => {
    setFormData(prev => {
      const exists = prev.productIds.includes(prodId);
      if (exists) {
        return { ...prev, productIds: prev.productIds.filter(id => id !== prodId) };
      } else {
        return { ...prev, productIds: [...prev.productIds, prodId] };
      }
    });
  };

  // Remove single product card from modal form
  const removeProductFromForm = (prodId: string) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.filter(id => id !== prodId)
    }));
  };

  // Extract unique categories for Product Picker filter chips
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    productsCatalog.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return ['All', ...Array.from(cats)];
  }, [productsCatalog]);

  // Helper: Extract Numeric Weight from String
  const parseWeightNum = (weightStr: string): number => {
    if (!weightStr) return 0;
    const cleanStr = weightStr.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  // Filter products for Product Picker live search across 6 dimensions
  const filteredProducts = useMemo(() => {
    return productsCatalog.filter(p => {
      // 1. Search text
      if (pickerSearch.trim() !== '') {
        const q = pickerSearch.toLowerCase().trim();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesSku = p.sku?.toLowerCase().includes(q);
        const matchesCategory = p.category?.toLowerCase().includes(q);
        const matchesCollection = p.collection?.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesCategory && !matchesCollection) return false;
      }
      
      // 2. Category filter
      if (pickerCategory !== 'All') {
        if (p.category?.toLowerCase() !== pickerCategory.toLowerCase()) return false;
      }

      // 3. Collection filter
      if (pickerCollection !== 'All') {
        if (p.collection?.toLowerCase() !== pickerCollection.toLowerCase()) return false;
      }

      // 4. Metal Type filter
      if (pickerMetal !== 'All') {
        const metalStr = (p.metalType || p.category || '').toLowerCase();
        if (!metalStr.includes(pickerMetal.toLowerCase())) return false;
      }

      // 5. Purity Standard filter
      if (pickerPurity !== 'All') {
        const purityClean = pickerPurity.replace(/\s+/g, '').toLowerCase();
        const productPurity = (p.purity || p.metalType || '').replace(/\s+/g, '').toLowerCase();
        if (!productPurity.includes(purityClean) && !productPurity.includes(purityClean.substring(0, 3))) return false;
      }

      // 6. Weight Profiling filter
      if (pickerWeight !== 'All') {
        const w = parseWeightNum(p.approxWeight);
        if (pickerWeight === 'Under 10g' && w > 10) return false;
        if (pickerWeight === '10g - 30g' && (w < 10 || w > 30)) return false;
        if (pickerWeight === '30g - 50g' && (w < 30 || w > 50)) return false;
        if (pickerWeight === 'Above 50g' && w < 50) return false;
      }

      // 7. Showroom Badging filter
      if (pickerBadging !== 'All') {
        if (pickerBadging === 'Featured Vault' && !p.featured) return false;
        if (pickerBadging === 'New Arrivals' && !p.newArrival) return false;
      }

      return true;
    });
  }, [productsCatalog, pickerSearch, pickerCategory, pickerCollection, pickerMetal, pickerPurity, pickerWeight, pickerBadging]);

  // Handle Copy to Clipboard
  const handleCopy = (textToCopy: string, fieldKey: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedField(fieldKey);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  // Save Collection Handler
  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Collection Name is required.');
      return;
    }
    if (!formData.slug.trim()) {
      setError('A valid URL Slug is required.');
      return;
    }

    setSaving(true);
    setError(null);

    const targetId = formData.id || 'col_' + Math.random().toString(36).substring(2, 10);
    const createdAtIso = new Date().toISOString();

    const payload: CollectionRecord = {
      id: targetId,
      name: formData.name.trim(),
      slug: formData.slug.trim().toLowerCase(),
      description: formData.description.trim(),
      productIds: formData.productIds,
      imageUrl: formData.imageUrl,
      coverImageUrl: formData.imageUrl,
      displayOrder: Number(formData.displayOrder || 1),
      status: formData.status, // defaults to 'draft'
      isActive: formData.status === 'published' || formData.status === 'active',
      isFeatured: formData.isFeatured,
      seoTitle: formData.seoTitle.trim() || `${formData.name} Collection | Parasmoni Jewellers`,
      seoDescription: formData.seoDescription.trim() || formData.description.trim().substring(0, 150),
      createdAt: createdAtIso,
      updatedAt: createdAtIso
    };

    try {
      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'collections', targetId), payload, { merge: true });
      }

      setCollections(prev => {
        const idx = prev.findIndex(c => c.id === targetId);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = payload;
          return copy;
        } else {
          return [...prev, payload];
        }
      });

      // Transition modal to Success view
      setModalStep('success');
    } catch (err: any) {
      setError(`Failed to save collection: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Toggle status in list view
  const toggleStatusInList = async (coll: CollectionRecord) => {
    const newStatus = coll.status === 'published' || coll.status === 'active' ? 'draft' : 'published';
    try {
      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'collections', coll.id), {
          status: newStatus,
          isActive: newStatus === 'published',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      setCollections(prev => prev.map(c => c.id === coll.id ? { ...c, status: newStatus, isActive: newStatus === 'published' } : c));
      setSuccess(`Status changed to ${newStatus}.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Failed to update status: ${err.message}`);
    }
  };

  // Sequence Order Move
  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === collections.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const currentColl = collections[index];
    const neighborColl = collections[targetIndex];

    const currentOrder = currentColl.displayOrder;
    const neighborOrder = neighborColl.displayOrder;

    const updated = [...collections];
    updated[index] = { ...currentColl, displayOrder: neighborOrder };
    updated[targetIndex] = { ...neighborColl, displayOrder: currentOrder };
    updated.sort((a, b) => a.displayOrder - b.displayOrder);
    setCollections(updated);

    try {
      if (isFirebaseConfigured && db) {
        await Promise.all([
          setDoc(doc(db, 'collections', currentColl.id), { displayOrder: neighborOrder, order: neighborOrder }, { merge: true }),
          setDoc(doc(db, 'collections', neighborColl.id), { displayOrder: currentOrder, order: currentOrder }, { merge: true })
        ]);
      }
    } catch (err: any) {
      setError(`Failed to swap order: ${err.message}`);
    }
  };

  // Delete Collection
  const handleDeleteCollection = async (coll: CollectionRecord) => {
    if (!window.confirm(`Are you sure you want to delete "${coll.name}"?`)) return;

    try {
      if (isFirebaseConfigured && db) {
        await deleteDoc(doc(db, 'collections', coll.id));
      }
      setCollections(prev => prev.filter(c => c.id !== coll.id));
      setSuccess(`Collection deleted.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Failed to delete: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 font-sans text-[#EFE7D6]" id="collection-management-module">
      
      {/* Alert Notifications */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl flex items-start gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-start gap-3 text-xs animate-pulse">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
          <p className="leading-relaxed">{success}</p>
        </div>
      )}

      {/* Main List Header & Quick Setup */}
      <div className="flex items-center justify-between border-b border-[#3a2f26] pb-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#EFE7D6]">Collections Center</h2>
          <p className="text-xs text-[#a89a89] font-sans mt-0.5">Bridal, Antique, Temple and modern sets.</p>
        </div>
        <button
          onClick={() => openRegisterModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#D98A20] hover:bg-[#e09429] text-black text-xs font-bold uppercase rounded-lg cursor-pointer transition-all tracking-wider shadow-sm"
          id="btn-register-collection"
        >
          <Plus className="w-4 h-4" />
          <span>Register Collection</span>
        </button>
      </div>

      {/* Main Collections Hub Container */}
      <div className="bg-[#181310] border border-[#3a2f26] rounded-2xl p-6 space-y-6 shadow-xl">
        
        {/* Header Label inside Card */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#D98A20]">Curated Design Collections</h3>
            <p className="text-[11px] text-[#a89a89] mt-0.5">Define high-level series groupings mapped to customer landing shelves.</p>
          </div>
          <button
            onClick={() => openRegisterModal()}
            className="px-3.5 py-1.5 bg-[#D98A20] hover:bg-[#e09429] text-black text-xs font-bold uppercase rounded-lg cursor-pointer transition-all tracking-wider"
          >
            + Register Collection
          </button>
        </div>

        {/* Preset suggestions */}
        <div className="p-4 bg-[#241d17]/60 border border-[#3a2f26] rounded-xl space-y-2">
          <span className="text-[10px] text-[#a89a89] font-bold uppercase tracking-widest block">Quick Setup Preset Suggestions</span>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_COLLECTIONS.map(preset => {
              const isExisting = collections.some(c => c.name.toLowerCase() === preset.toLowerCase());
              return (
                <button
                  key={preset}
                  onClick={() => openRegisterModal(preset)}
                  disabled={isExisting}
                  className={`px-3 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                    isExisting 
                      ? 'border-[#3a2f26]/50 bg-[#181310]/40 text-[#6b5f52] cursor-not-allowed' 
                      : 'border-[#3a2f26] bg-[#181310] hover:bg-[#2e251d] hover:border-[#D98A20] text-[#EFE7D6]'
                  }`}
                >
                  + {preset}
                </button>
              );
            })}
          </div>
        </div>

        {/* Collections Grid / List */}
        {loading ? (
          <div className="py-12 text-center text-[#a89a89] text-xs">
            <div className="w-6 h-6 border-2 border-[#D98A20] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Retrieving curated design collections...</span>
          </div>
        ) : collections.length === 0 ? (
          <div className="py-12 text-center bg-[#241d17]/30 border border-dashed border-[#3a2f26] rounded-xl p-8 text-[#a89a89] text-xs space-y-2">
            <FolderHeart className="w-8 h-8 text-[#6b5f52] mx-auto" />
            <p className="font-semibold text-sm text-[#EFE7D6]">No curated collections registered.</p>
            <p className="text-xs text-[#a89a89]">Click any preset above or "+ Register Collection" to populate showroom slots.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collections.map((c, index) => {
              const isDraft = c.status === 'draft';
              const isInactive = c.status === 'inactive' || !c.isActive;
              
              return (
                <div 
                  key={c.id} 
                  className={`bg-[#241d17] border transition-all rounded-xl p-4 flex gap-4 items-center justify-between ${
                    isDraft 
                      ? 'border-amber-500/30 bg-[#241d17]/80' 
                      : isInactive 
                      ? 'border-[#3a2f26]/60 bg-[#241d17]/40 opacity-75' 
                      : 'border-[#3a2f26] hover:border-[#6b5f52]'
                  }`}
                >
                  {/* Collection Swatch & Info */}
                  <div className="flex gap-3.5 items-center flex-1 min-w-0">
                    <div className="relative w-16 h-16 bg-[#181310] border border-[#3a2f26] rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                      {c.imageUrl ? (
                        <img 
                          src={c.imageUrl} 
                          alt={c.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <FolderHeart className="w-6 h-6 text-[#6b5f52]" />
                      )}
                      <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[8px] font-mono font-bold text-[#D98A20] border border-[#3a2f26]">
                        #{c.displayOrder}
                      </span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-serif font-bold text-[#EFE7D6] text-sm truncate">{c.name}</h4>
                        
                        {/* Status Badge */}
                        {isDraft ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border bg-amber-500/10 text-amber-400 border-amber-500/30">
                            Draft
                          </span>
                        ) : isInactive ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border bg-stone-900 text-[#a89a89] border-[#3a2f26]">
                            Inactive
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            Published
                          </span>
                        )}

                        {c.isFeatured && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#D98A20]/10 text-[#D98A20] border border-[#D98A20]/20 flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Featured</span>
                          </span>
                        )}
                      </div>

                      <p className="text-[#a89a89] text-xs line-clamp-1">{c.description || 'No description provided.'}</p>
                      
                      <div className="flex items-center gap-3 text-[10px] font-mono text-[#a89a89]">
                        <span className="flex items-center gap-1">
                          <LinkIcon className="w-3 h-3 text-[#6b5f52]" />
                          <span>/collection/{c.slug}</span>
                        </span>
                        <span>•</span>
                        <span className="text-[#D98A20] font-semibold">{c.productIds?.length || 0} items</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-[#181310] border border-[#3a2f26] rounded-lg p-0.5">
                      <button
                        onClick={() => moveOrder(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-[#a89a89] hover:text-[#D98A20] disabled:opacity-30 transition-colors cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <div className="h-4 w-px bg-[#3a2f26]" />
                      <button
                        onClick={() => moveOrder(index, 'down')}
                        disabled={index === collections.length - 1}
                        className="p-1 text-[#a89a89] hover:text-[#D98A20] disabled:opacity-30 transition-colors cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => toggleStatusInList(c)}
                      className="p-1.5 bg-[#181310] border border-[#3a2f26] hover:border-[#D98A20] rounded-lg text-[#a89a89] hover:text-[#EFE7D6] transition-colors cursor-pointer"
                      title={isDraft || isInactive ? 'Publish Collection' : 'Unpublish / Draft'}
                    >
                      {isDraft || isInactive ? <Eye className="w-4 h-4 text-amber-400" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 bg-[#181310] border border-[#3a2f26] hover:border-[#D98A20] rounded-lg text-[#EFE7D6] hover:text-[#D98A20] transition-colors cursor-pointer"
                      title="Edit Collection"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteCollection(c)}
                      className="p-1.5 bg-[#181310] border border-[#3a2f26] hover:border-red-500 rounded-lg text-[#a89a89] hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete Collection"
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

      {/* ========================================================= */}
      {/* MODAL DIALOG (Overlay backdrop, max-width ~640px, rounded ~14px) */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          
          {/* Modal Backdrop Click Target */}
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />

          {/* Modal Card Box */}
          <div className="relative bg-[#181310] border border-[#3a2f26] text-[#EFE7D6] rounded-[14px] max-w-[640px] w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden z-10 font-sans my-auto">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#3a2f26] flex items-start justify-between bg-[#181310]">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#EFE7D6]">
                  {modalStep === 'form' 
                    ? (isEditing ? 'Edit Collection' : 'Register Collection')
                    : formData.name}
                </h3>
                <p className="text-xs text-[#a89a89] font-sans mt-0.5">
                  {modalStep === 'form' 
                    ? 'Define a new collection and add products to it.'
                    : `${formData.productIds.length} products · Draft`}
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#241d17] border border-[#3a2f26] text-[#a89a89] hover:text-[#EFE7D6] hover:border-[#D98A20] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
              
              {/* STEP 1: FORM VIEW */}
              {modalStep === 'form' && (
                <form id="collection-register-form" onSubmit={handleSaveCollection} className="space-y-5">
                  
                  {/* Collection Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#D98A20] block">
                      Collection Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Temple Bridal Edit"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full bg-[#241d17] border border-[#3a2f26] text-[#EFE7D6] rounded-lg px-3.5 py-2.5 text-sm focus:border-[#D98A20] focus:outline-hidden placeholder-[#6b5f52] font-sans transition-colors"
                    />
                  </div>

                  {/* Slug (storefront link) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#D98A20] block">
                      Slug (storefront link) *
                    </label>
                    <div className="flex items-center">
                      <div className="bg-[#2e251d] border border-r-0 border-[#3a2f26] text-[#a89a89] px-3.5 py-2.5 text-xs font-mono rounded-l-lg select-none shrink-0 flex items-center">
                        /collection/
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="temple-bridal-edit"
                        value={formData.slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        className="w-full bg-[#241d17] border border-[#3a2f26] text-[#EFE7D6] rounded-r-lg px-3.5 py-2.5 text-xs font-mono focus:border-[#D98A20] focus:outline-hidden placeholder-[#6b5f52] transition-colors"
                      />
                    </div>
                    <p className="text-[10px] text-[#a89a89] leading-relaxed mt-1">
                      This slug is auto-generated from the name — you can edit it. After saving, you'll use this exact slug to link the collection anywhere on the storefront.
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#D98A20] block">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="A short line that tells the customer what this collection is about."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-[#241d17] border border-[#3a2f26] text-[#EFE7D6] rounded-lg px-3.5 py-2.5 text-xs focus:border-[#D98A20] focus:outline-hidden placeholder-[#6b5f52] font-sans resize-none transition-colors"
                    />
                  </div>

                  {/* Products Sub-Panel */}
                  <div className="border border-dashed border-[#3a2f26] bg-[#241d17]/40 rounded-xl p-4 space-y-3">
                    
                    {/* Panel Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#D98A20]">Collection items</span>
                        <span className="bg-[#2e251d] border border-[#3a2f26] text-[#EFE7D6] text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                          {formData.productIds.length} added
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsPickerOpen(true)}
                        className="px-3 py-1.5 bg-[#D98A20] hover:bg-[#e09429] text-black font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Products</span>
                      </button>
                    </div>

                    {/* Products Grid / Empty State */}
                    {formData.productIds.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#a89a89] font-sans">
                        No products added yet. Click "Add Products" to select from the list.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar pt-1">
                        {formData.productIds.map(id => {
                          const prod = productsCatalog.find(p => p.id === id);
                          return (
                            <div 
                              key={id} 
                              className="relative bg-[#241d17] border border-[#3a2f26] rounded-lg p-2 flex items-center gap-2 pr-7 overflow-hidden group hover:border-[#6b5f52] transition-colors"
                            >
                              <div className="w-9 h-9 rounded bg-[#181310] overflow-hidden shrink-0 border border-[#3a2f26]">
                                {prod?.imageUrl ? (
                                  <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <Package className="w-5 h-5 text-[#6b5f52] m-auto" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-[#EFE7D6] truncate">{prod?.name || 'Product ' + id}</p>
                                <p className="text-[10px] text-[#a89a89] truncate">{prod?.category || 'Jewellery'}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeProductFromForm(id)}
                                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#181310] hover:bg-red-950 text-[#a89a89] hover:text-red-400 border border-[#3a2f26] flex items-center justify-center transition-colors cursor-pointer text-[10px]"
                                title="Remove product"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>

                </form>
              )}

              {/* STEP 2: SUCCESS / SUMMARY VIEW */}
              {modalStep === 'success' && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  
                  {/* Success Card */}
                  <div className="p-4 bg-[#241d17]/80 border border-emerald-500/30 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>"{formData.name}" saved as Draft.</span>
                    </div>
                    <p className="text-xs text-[#a89a89] leading-relaxed pl-7">
                      This collection won't show anywhere automatically; use the link below to manually place it in a banner, button, or the navbar.
                    </p>
                  </div>

                  {/* Status Visibility Indicator */}
                  <div className="p-3 bg-[#241d17] border border-[#3a2f26] rounded-lg flex items-center gap-2 text-xs text-[#EFE7D6]">
                    <span className="w-2.5 h-2.5 rounded-full bg-stone-500 shrink-0 animate-pulse" />
                    <span className="font-semibold text-[#a89a89]">Storefront visibility:</span>
                    <span className="text-amber-400 font-bold">Hidden until linked.</span>
                  </div>

                  {/* Copyable Reference Blocks */}
                  <div className="space-y-3 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#D98A20] block">Copyable Link References</span>

                    {/* Reference 1 */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#a89a89] block font-semibold">Storefront path</label>
                      <div className="flex items-center gap-2">
                        <code className="bg-[#241d17] border border-[#3a2f26] text-[#D98A20] px-3 py-2 rounded-lg font-mono text-xs flex-1 truncate select-all">
                          /collection/{formData.slug}
                        </code>
                        <button
                          onClick={() => handleCopy(`/collection/${formData.slug}`, 'path')}
                          className="px-3 py-2 bg-[#2e251d] hover:bg-[#3a2f26] border border-[#3a2f26] text-xs font-bold rounded-lg text-[#EFE7D6] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          {copiedField === 'path' ? (
                            <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Copied</span>
                          ) : (
                            <span className="flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> Copy</span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Reference 2 */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#a89a89] block font-semibold">Short reference (banner / button target)</label>
                      <div className="flex items-center gap-2">
                        <code className="bg-[#241d17] border border-[#3a2f26] text-[#D98A20] px-3 py-2 rounded-lg font-mono text-xs flex-1 truncate select-all">
                          #collection/{formData.slug}
                        </code>
                        <button
                          onClick={() => handleCopy(`#collection/${formData.slug}`, 'short')}
                          className="px-3 py-2 bg-[#2e251d] hover:bg-[#3a2f26] border border-[#3a2f26] text-xs font-bold rounded-lg text-[#EFE7D6] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          {copiedField === 'short' ? (
                            <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Copied</span>
                          ) : (
                            <span className="flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> Copy</span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Reference 3 */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#a89a89] block font-semibold">Navbar sub-category reference</label>
                      <div className="flex items-center gap-2">
                        <code className="bg-[#241d17] border border-[#3a2f26] text-[#D98A20] px-3 py-2 rounded-lg font-mono text-xs flex-1 truncate select-all">
                          @{formData.slug}
                        </code>
                        <button
                          onClick={() => handleCopy(`@${formData.slug}`, 'nav')}
                          className="px-3 py-2 bg-[#2e251d] hover:bg-[#3a2f26] border border-[#3a2f26] text-xs font-bold rounded-lg text-[#EFE7D6] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          {copiedField === 'nav' ? (
                            <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Copied</span>
                          ) : (
                            <span className="flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> Copy</span>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* "Use this here" Numbered List */}
                  <div className="p-4 bg-[#241d17]/50 border border-[#3a2f26] rounded-xl space-y-2.5 text-xs text-[#a89a89]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#EFE7D6] block">Use this here</span>
                    <ol className="space-y-2 list-decimal list-inside leading-relaxed text-[11px]">
                      <li>
                        <strong className="text-[#EFE7D6]">Banners → Link field:</strong> paste the <code className="text-[#D98A20]">#collection/{formData.slug}</code> reference into a banner's Link field so clicking the banner opens this collection.
                      </li>
                      <li>
                        <strong className="text-[#EFE7D6]">Any section's Button → Target:</strong> same reference works in any button/CTA target field sitewide.
                      </li>
                      <li>
                        <strong className="text-[#EFE7D6]">Navbar → Sub-category:</strong> the <code className="text-[#D98A20]">@{formData.slug}</code> format attaches this collection to a navbar sub-menu item.
                      </li>
                    </ol>
                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer Buttons */}
            <div className="p-4 border-t border-[#3a2f26] bg-[#181310] flex items-center justify-between">
              {modalStep === 'form' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-[#3a2f26] hover:bg-[#241d17] text-xs font-semibold text-[#a89a89] hover:text-[#EFE7D6] rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    form="collection-register-form"
                    disabled={saving}
                    className="px-5 py-2.5 bg-[#D98A20] hover:bg-[#e09429] disabled:bg-[#3a2f26] text-black font-bold text-xs rounded-lg transition-all cursor-pointer shadow-sm ml-auto"
                  >
                    {saving ? 'Saving Collection...' : 'Save Collection'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-[#3a2f26] hover:bg-[#241d17] text-xs font-semibold text-[#a89a89] hover:text-[#EFE7D6] rounded-lg transition-colors cursor-pointer"
                  >
                    Done
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-[#D98A20] hover:bg-[#e09429] text-black font-bold text-xs rounded-lg transition-all cursor-pointer shadow-sm"
                  >
                    Go to Collections
                  </button>
                </>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* PRODUCT PICKER — SLIDE-OVER PANEL (~460px width) */}
      {/* ========================================================= */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          
          {/* Slide-over Semi-transparent Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsPickerOpen(false)}
          />

          {/* Panel Drawer */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-[460px] bg-[#181310] border-l border-[#3a2f26] text-[#EFE7D6] shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300">
              
              {/* Panel Header */}
              <div className="p-5 border-b border-[#3a2f26] space-y-3 bg-[#181310]">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#EFE7D6]">Select Products</h3>
                    <p className="text-xs text-[#a89a89] mt-0.5">Click a product to add it to this collection.</p>
                  </div>
                  
                  <button
                    onClick={() => setIsPickerOpen(false)}
                    className="w-8 h-8 rounded-full bg-[#241d17] border border-[#3a2f26] text-[#a89a89] hover:text-[#EFE7D6] hover:border-[#D98A20] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#a89a89] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search products by title, SKU, or category…"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    className="w-full bg-[#241d17] border border-[#3a2f26] text-[#EFE7D6] rounded-lg pl-9 pr-3.5 py-2 text-xs focus:border-[#D98A20] focus:outline-hidden placeholder-[#6b5f52] transition-colors"
                  />
                </div>

                {/* 6 Storefront Matching Filter Dropdowns Grid */}
                <div className="space-y-2 pt-1 border-t border-[#3a2f26]">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#D98A20]">
                    <span className="flex items-center gap-1"><Filter className="w-3 h-3" /> Exact Buyer Catalog Filters</span>
                    {(pickerCategory !== 'All' || pickerCollection !== 'All' || pickerMetal !== 'All' || pickerPurity !== 'All' || pickerWeight !== 'All' || pickerBadging !== 'All' || pickerSearch !== '') && (
                      <button
                        type="button"
                        onClick={() => {
                          setPickerSearch('');
                          setPickerCategory('All');
                          setPickerCollection('All');
                          setPickerMetal('All');
                          setPickerPurity('All');
                          setPickerWeight('All');
                          setPickerBadging('All');
                        }}
                        className="text-[10px] text-[#a89a89] hover:text-[#EFE7D6] underline cursor-pointer lowercase"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Filter 1: Category */}
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#a89a89] font-bold block mb-0.5">Category</label>
                      <select
                        value={pickerCategory}
                        onChange={(e) => setPickerCategory(e.target.value)}
                        className="w-full bg-[#241d17] border border-[#3a2f26] text-[#EFE7D6] text-[11px] rounded-md px-2 py-1.5 focus:border-[#D98A20] outline-hidden cursor-pointer"
                      >
                        <option value="All">All Categories</option>
                        <option value="Necklaces">Necklaces</option>
                        <option value="Earrings">Earrings</option>
                        <option value="Rings">Rings</option>
                        <option value="Bangles">Bangles</option>
                        <option value="Bridal Accessories">Bridal Accessories</option>
                        <option value="Chokers">Chokers</option>
                        <option value="Pendants">Pendants</option>
                      </select>
                    </div>

                    {/* Filter 2: Showroom Collection */}
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#a89a89] font-bold block mb-0.5">Collection</label>
                      <select
                        value={pickerCollection}
                        onChange={(e) => setPickerCollection(e.target.value)}
                        className="w-full bg-[#241d17] border border-[#3a2f26] text-[#EFE7D6] text-[11px] rounded-md px-2 py-1.5 focus:border-[#D98A20] outline-hidden cursor-pointer"
                      >
                        <option value="All">All Collections</option>
                        <option value="Royal Kundan & Polki">Royal Kundan & Polki</option>
                        <option value="Heritage Nakashi Filigree">Heritage Nakashi Filigree</option>
                        <option value="IGI Certified Solitaires">IGI Certified Solitaires</option>
                        <option value="Heavy Bridal Kadas">Heavy Bridal Kadas</option>
                        {collections.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filter 3: Metal Type */}
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#a89a89] font-bold block mb-0.5">Metal Type</label>
                      <select
                        value={pickerMetal}
                        onChange={(e) => setPickerMetal(e.target.value)}
                        className="w-full bg-[#241d17] border border-[#3a2f26] text-[#EFE7D6] text-[11px] rounded-md px-2 py-1.5 focus:border-[#D98A20] outline-hidden cursor-pointer"
                      >
                        <option value="All">All Metals</option>
                        <option value="Gold">Gold</option>
                        <option value="Diamond">Diamond</option>
                        <option value="Silver">Silver</option>
                      </select>
                    </div>

                    {/* Filter 4: Purity Standard */}
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#a89a89] font-bold block mb-0.5">Purity Standard</label>
                      <select
                        value={pickerPurity}
                        onChange={(e) => setPickerPurity(e.target.value)}
                        className="w-full bg-[#241d17] border border-[#3a2f26] text-[#EFE7D6] text-[11px] rounded-md px-2 py-1.5 focus:border-[#D98A20] outline-hidden cursor-pointer"
                      >
                        <option value="All">All Purities</option>
                        <option value="22K Gold (916)">22K Gold (916)</option>
                        <option value="18K Gold">18K Gold</option>
                        <option value="925 Silver">925 Silver</option>
                      </select>
                    </div>

                    {/* Filter 5: Weight Profiling */}
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#a89a89] font-bold block mb-0.5">Weight Profile</label>
                      <select
                        value={pickerWeight}
                        onChange={(e) => setPickerWeight(e.target.value)}
                        className="w-full bg-[#241d17] border border-[#3a2f26] text-[#EFE7D6] text-[11px] rounded-md px-2 py-1.5 focus:border-[#D98A20] outline-hidden cursor-pointer"
                      >
                        <option value="All">All Weights</option>
                        <option value="Under 10g">Under 10g</option>
                        <option value="10g - 30g">10g - 30g</option>
                        <option value="30g - 50g">30g - 50g</option>
                        <option value="Above 50g">Above 50g</option>
                      </select>
                    </div>

                    {/* Filter 6: Showroom Badging */}
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#a89a89] font-bold block mb-0.5">Badging</label>
                      <select
                        value={pickerBadging}
                        onChange={(e) => setPickerBadging(e.target.value)}
                        className="w-full bg-[#241d17] border border-[#3a2f26] text-[#EFE7D6] text-[11px] rounded-md px-2 py-1.5 focus:border-[#D98A20] outline-hidden cursor-pointer"
                      >
                        <option value="All">All Badges</option>
                        <option value="Featured Vault">Featured Vault</option>
                        <option value="New Arrivals">New Arrivals</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel Body: Scrollable Product Rows */}
              <div className="p-4 overflow-y-auto space-y-2 flex-1 custom-scrollbar">
                {filteredProducts.length === 0 ? (
                  <div className="py-16 text-center text-xs text-[#a89a89] font-sans space-y-1">
                    <p className="font-semibold text-[#EFE7D6]">No products found.</p>
                    <p>Try a different filter or search.</p>
                  </div>
                ) : (
                  filteredProducts.map(prod => {
                    const isSelected = formData.productIds.includes(prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => toggleProductSelection(prod.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-[#2e251d] border-[#D98A20] shadow-sm' 
                            : 'bg-[#241d17]/60 border-[#3a2f26] hover:border-[#6b5f52] hover:bg-[#241d17]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="w-11 h-11 rounded-lg bg-[#181310] border border-[#3a2f26] overflow-hidden shrink-0 flex items-center justify-center">
                            {prod.imageUrl ? (
                              <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <Package className="w-5 h-5 text-[#6b5f52]" />
                            )}
                          </div>
                          
                          <div className="min-w-0">
                            <h5 className="text-xs font-semibold text-[#EFE7D6] truncate">{prod.name}</h5>
                            <p className="text-[10px] text-[#a89a89] truncate">
                              {prod.category} {prod.sku ? `• SKU: ${prod.sku}` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Checkbox Indicator */}
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                          isSelected 
                            ? 'bg-[#D98A20] border-[#D98A20] text-black' 
                            : 'border-[#3a2f26] bg-[#181310]'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Panel Sticky Footer */}
              <div className="p-4 border-t border-[#3a2f26] bg-[#181310] flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#D98A20]">
                  {formData.productIds.length} selected
                </span>

                <button
                  onClick={() => setIsPickerOpen(false)}
                  className="px-5 py-2.5 bg-[#D98A20] hover:bg-[#e09429] text-black font-bold text-xs rounded-lg transition-all cursor-pointer shadow-sm"
                >
                  Add Selected
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
