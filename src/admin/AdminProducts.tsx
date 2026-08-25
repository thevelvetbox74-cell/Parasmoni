/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  getDoc
} from 'firebase/firestore';
import { 
  Search, 
  Plus, 
  Edit, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ArrowLeft, 
  Save, 
  X, 
  FileText, 
  Tag, 
  Store, 
  Gem, 
  Coins, 
  AlertCircle,
  CheckCircle,
  HelpCircle,
  BadgeAlert,
  Image as ImageIcon,
  Settings
} from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';
import { mockProducts, mockStores, mockCollections } from '../data/mockData';

// Purity Lists for options
const PURITY_OPTIONS = {
  gold: ['24k', '22k', '18k', '14k'],
  silver: ['sterling_925', 'alloy'],
  platinum: ['pt950'],
  diamond_setting: ['18k_white_gold', '18k_yellow_gold', 'platinum_pt950']
};

export function AdminProducts(): React.JSX.Element {
  const { user } = useAuth();
  
  // UI Views State
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Static Metadata Dropdowns (Populated dynamically or from fallback lists)
  const [categories, setCategories] = useState<any[]>([
    { id: 'cat-necklaces', name: 'Necklaces & Chokers' },
    { id: 'cat-bangles', name: 'Bangles & Kadas' },
    { id: 'cat-rings', name: 'Rings & Solitaires' },
    { id: 'cat-earrings', name: 'Premium Jhumkas & Earrings' },
    { id: 'cat-pendants', name: 'Pendants & Chains' }
  ]);
  const [collections, setCollections] = useState<any[]>(mockCollections);
  const [stores, setStores] = useState<any[]>(mockStores);

  // Form Fields State
  const [formData, setFormData] = useState({
    id: '',
    productCode: '',
    productName: '',
    slug: '',
    shortDescription: '',
    description: '',
    category: 'cat-necklaces',
    subcategory: '',
    collection: 'col-1',
    metal: 'gold' as 'gold' | 'silver' | 'platinum' | 'diamond_setting',
    purity: '22k',
    weight: '',
    price: '',
    priceVisibility: 'on_enquiry' as 'visible' | 'hidden' | 'on_enquiry',
    images: [] as string[],
    thumbnail: '',
    featured: false,
    newArrival: false,
    status: 'draft' as 'draft' | 'published',
    availableStores: [] as string[],
    tags: '',
    seoTitle: '',
    seoDescription: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    imageAltText: ''
  });

  // Fetch products and list metadata on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isFirebaseConfigured && db) {
        // 1. Fetch products
        const productsColRef = collection(db, 'products');
        const productsSnap = await getDocs(productsColRef);
        
        let loadedProducts = productsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort client-side by createdAt descending to avoid missing index errors completely
        loadedProducts.sort((a: any, b: any) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });

        // If Firestore is empty, let's pre-populate with mock products so it is not completely empty
        if (loadedProducts.length === 0) {
          console.log('Firestore products collection empty. Seeding with showroom mock items...');
          for (const item of mockProducts as any[]) {
            // Write each mock product to Firestore
            const seedRef = doc(db, 'products', item.id);
            const seedData = {
              productCode: item.sku || `PM-GOLD-${Math.floor(100 + Math.random() * 900)}`,
              productName: item.name,
              slug: generateSlug(item.name),
              shortDescription: item.description.substring(0, 100) + '...',
              description: item.description,
              category: item.category === 'Necklaces' ? 'cat-necklaces' : (item.category === 'Bangles' ? 'cat-bangles' : 'cat-rings'),
              subcategory: 'Traditional',
              collection: item.collection === 'Royal Kundan & Polki' ? 'col-1' : 'col-2',
              metal: 'gold',
              purity: '22k',
              weight: item.approxWeight ? item.approxWeight.replace(/[^\d.]/g, '') : '10.0',
              price: '125000',
              priceVisibility: 'on_enquiry' as any,
              images: item.imageUrl ? [item.imageUrl] : ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600'],
              thumbnail: item.imageUrl || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600',
              featured: item.isPopular || false,
              newArrival: true,
              status: 'published' as const,
              availableStores: ['store-1', 'store-2'],
              tags: 'heritage, classic, hand-crafted',
              seoTitle: `${item.name} | Parasmoni Jewellers`,
              seoDescription: item.description.substring(0, 150),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              updatedBy: 'system'
            };
            await setDoc(seedRef, seedData);
            loadedProducts.push({ id: item.id, ...seedData });
          }
        }
        
        setProducts(loadedProducts);

        // 2. Try fetching custom categories and collections from Firestore
        try {
          const catSnap = await getDocs(collection(db, 'categories'));
          if (!catSnap.empty) {
            setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
          const colSnap = await getDocs(collection(db, 'collections'));
          if (!colSnap.empty) {
            setCollections(colSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
          const storeSnap = await getDocs(collection(db, 'stores'));
          if (!storeSnap.empty) {
            setStores(storeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
        } catch (e) {
          console.warn('Could not load separate CMS master collections:', e);
        }

      } else {
        // Fallback offline simulation
        setProducts((mockProducts as any[]).map(p => ({
          id: p.id,
          productCode: p.sku,
          productName: p.name,
          slug: generateSlug(p.name),
          shortDescription: p.description.substring(0, 100),
          description: p.description,
          category: p.category === 'Necklaces' ? 'cat-necklaces' : (p.category === 'Bangles' ? 'cat-bangles' : 'cat-rings'),
          subcategory: 'Classic',
          collection: p.collection === 'Royal Kundan & Polki' ? 'col-1' : 'col-2',
          metal: 'gold',
          purity: '22k',
          weight: p.approxWeight ? p.approxWeight.replace(/[^\d.]/g, '') : '10.0',
          price: '145000',
          priceVisibility: 'on_enquiry',
          images: p.imageUrl ? [p.imageUrl] : ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600'],
          thumbnail: p.imageUrl || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600',
          featured: p.isPopular || false,
          newArrival: true,
          status: 'published',
          availableStores: ['store-1', 'store-2'],
          tags: 'heritage, local, pure',
          seoTitle: p.name,
          seoDescription: p.description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })));
      }
    } catch (err: any) {
      console.error('Error fetching inventory products:', err);
      setError('Could not establish persistent catalog feed: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Helper: auto-generate slug
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // remove special characters
      .replace(/\s+/g, '-') // replace spaces with hyphens
      .replace(/-+/g, '-'); // trim consecutive hyphens
  };

  // Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let parsedValue: any = value;
    if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    }

    setFormData(prev => {
      const updated = { ...prev, [name]: parsedValue };
      
      // Auto-set slug when product name is written
      if (name === 'productName' && !formData.slug) {
        updated.slug = generateSlug(value);
      }
      
      // Reset purity option if metal type changes
      if (name === 'metal') {
        const defaultPurity = PURITY_OPTIONS[value as keyof typeof PURITY_OPTIONS]?.[0] || '22k';
        updated.purity = defaultPurity;
      }

      return updated;
    });
  };

  const handleCheckboxChange = (name: 'featured' | 'newArrival', checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleStoreToggle = (storeId: string) => {
    setFormData(prev => {
      const current = prev.availableStores;
      if (current.includes(storeId)) {
        return { ...prev, availableStores: current.filter(id => id !== storeId) };
      } else {
        return { ...prev, availableStores: [...current, storeId] };
      }
    });
  };

  // Switch to Form Modes
  const openAddForm = () => {
    setFormData({
      id: '',
      productCode: `PM-GOLD-${Math.floor(100 + Math.random() * 900)}`,
      productName: '',
      slug: '',
      shortDescription: '',
      description: '',
      category: categories[0]?.id || 'cat-necklaces',
      subcategory: '',
      collection: collections[0]?.id || 'col-1',
      metal: 'gold',
      purity: '22k',
      weight: '',
      price: '',
      priceVisibility: 'on_enquiry',
      images: [],
      thumbnail: '',
      featured: false,
      newArrival: false,
      status: 'draft',
      availableStores: ['store-1', 'store-2'],
      tags: '',
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

  const openEditForm = (prod: any) => {
    setFormData({
      id: prod.id,
      productCode: prod.productCode || '',
      productName: prod.productName || '',
      slug: prod.slug || '',
      shortDescription: prod.shortDescription || '',
      description: prod.description || '',
      category: prod.category || 'cat-necklaces',
      subcategory: prod.subcategory || '',
      collection: prod.collection || 'col-1',
      metal: prod.metal || 'gold',
      purity: prod.purity || '22k',
      weight: prod.weight || '',
      price: prod.price || '',
      priceVisibility: prod.priceVisibility || 'on_enquiry',
      images: prod.images || [],
      thumbnail: prod.thumbnail || '',
      featured: prod.featured || false,
      newArrival: prod.newArrival || false,
      status: prod.status || 'draft',
      availableStores: prod.availableStores || [],
      tags: prod.tags || '',
      seoTitle: prod.seoTitle || '',
      seoDescription: prod.seoDescription || '',
      ogTitle: prod.ogTitle || '',
      ogDescription: prod.ogDescription || '',
      ogImage: prod.ogImage || '',
      imageAltText: prod.imageAltText || ''
    });
    setError(null);
    setSuccess(null);
    setView('edit');
  };

  // Duplicate Product Action
  const handleDuplicateProduct = (prod: any) => {
    setFormData({
      id: '', // Empty ID represents new product creation
      productCode: `${prod.productCode || 'PM'}-COPY`,
      productName: `${prod.productName || 'Product'} (Copy)`,
      slug: `${prod.slug || 'product'}-copy`,
      shortDescription: prod.shortDescription || '',
      description: prod.description || '',
      category: prod.category || 'cat-necklaces',
      subcategory: prod.subcategory || '',
      collection: prod.collection || 'col-1',
      metal: prod.metal || 'gold',
      purity: prod.purity || '22k',
      weight: prod.weight || '',
      price: prod.price || '',
      priceVisibility: prod.priceVisibility || 'on_enquiry',
      images: [...(prod.images || [])],
      thumbnail: prod.thumbnail || '',
      featured: prod.featured || false,
      newArrival: prod.newArrival || false,
      status: 'draft', // Duplicate starts as a draft
      availableStores: [...(prod.availableStores || [])],
      tags: prod.tags || '',
      seoTitle: prod.seoTitle ? `${prod.seoTitle} Copy` : '',
      seoDescription: prod.seoDescription || '',
      ogTitle: prod.ogTitle || '',
      ogDescription: prod.ogDescription || '',
      ogImage: prod.ogImage || '',
      imageAltText: prod.imageAltText || ''
    });
    setError(null);
    setSuccess(`Duplicated properties of "${prod.productName}". Please verify code, slug, and save.`);
    setView('add');
  };

  // Toggle Publish Inline in list view
  const handleTogglePublish = async (prod: any) => {
    const newStatus = prod.status === 'published' ? 'draft' : 'published';
    try {
      if (isFirebaseConfigured && db) {
        const prodRef = doc(db, 'products', prod.id);
        await setDoc(prodRef, {
          ...prod,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email || 'admin'
        }, { merge: true });
      }

      setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, status: newStatus } : p));
      setSuccess(`Product "${prod.productName}" status successfully set to ${newStatus}.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Failed to update status: ` + (err.message || err));
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${name}" from Parasmoni catalogue? This action is irreversible.`)) {
      return;
    }

    try {
      if (isFirebaseConfigured && db) {
        await deleteDoc(doc(db, 'products', id));
      }
      setProducts(prev => prev.filter(p => p.id !== id));
      setSuccess(`Successfully deleted "${name}" from catalogue records.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Failed to delete ornament record: ` + (err.message || err));
    }
  };

  // Save product (handles both ADD and EDIT)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Simple validations
    if (!formData.productCode.trim()) {
      setError('Unique Product Code is required.');
      return;
    }
    if (!formData.productName.trim()) {
      setError('Product Name is required.');
      return;
    }
    if (!formData.slug.trim()) {
      setError('URL slug is required.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        productCode: formData.productCode.trim(),
        productName: formData.productName.trim(),
        slug: formData.slug.trim().toLowerCase(),
        shortDescription: formData.shortDescription.trim(),
        description: formData.description.trim(),
        category: formData.category,
        subcategory: formData.subcategory.trim(),
        collection: formData.collection,
        metal: formData.metal,
        purity: formData.purity,
        weight: formData.weight.trim(),
        price: formData.price.trim(),
        priceVisibility: formData.priceVisibility,
        images: formData.images,
        thumbnail: formData.images[0] || formData.thumbnail || '',
        featured: formData.featured,
        newArrival: formData.newArrival,
        status: formData.status,
        availableStores: formData.availableStores,
        tags: formData.tags.trim(),
        seoTitle: formData.seoTitle.trim() || `${formData.productName} | Parasmoni Jewellers`,
        seoDescription: formData.seoDescription.trim() || formData.shortDescription.trim() || formData.description.trim().substring(0, 150),
        ogTitle: formData.ogTitle.trim() || formData.seoTitle.trim() || formData.productName,
        ogDescription: formData.ogDescription.trim() || formData.seoDescription.trim() || formData.shortDescription.trim(),
        ogImage: formData.ogImage.trim() || formData.images[0] || '',
        imageAltText: formData.imageAltText.trim() || formData.productName,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || 'admin'
      } as any;

      if (view === 'add') {
        payload.createdAt = new Date().toISOString();
        if (isFirebaseConfigured && db) {
          const docRef = await addDoc(collection(db, 'products'), payload);
          setProducts(prev => [{ id: docRef.id, ...payload }, ...prev]);
        } else {
          // Offline mock add
          const id = `mock-prod-${Math.floor(Math.random() * 10000)}`;
          setProducts(prev => [{ id, ...payload }, ...prev]);
        }
        setSuccess(`Successfully added and catalogued "${payload.productName}".`);
      } else {
        // Edit mode
        payload.createdAt = products.find(p => p.id === formData.id)?.createdAt || new Date().toISOString();
        if (isFirebaseConfigured && db) {
          await setDoc(doc(db, 'products', formData.id), payload, { merge: true });
        }
        setProducts(prev => prev.map(p => p.id === formData.id ? { id: p.id, ...payload } : p));
        setSuccess(`Successfully updated details for "${payload.productName}".`);
      }

      setView('list');
    } catch (err: any) {
      console.error('Save product error:', err);
      setError('Failed to save product catalogue details: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Filter logic
  const filteredProducts = products.filter(prod => {
    const codeMatch = prod.productCode?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const nameMatch = prod.productName?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const descMatch = prod.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const searchMatch = codeMatch || nameMatch || descMatch;

    const statusMatch = statusFilter === 'all' || prod.status === statusFilter;
    const categoryMatch = categoryFilter === 'all' || prod.category === categoryFilter;

    return searchMatch && statusMatch && categoryMatch;
  });

  return (
    <div className="space-y-6 font-sans" id="admin-product-manager">
      
      {/* Visual Response Cards */}
      {error && (
        <div className="p-4 bg-red-950/30 border border-red-500/20 text-red-400 rounded-md text-xs flex items-start gap-3" id="product-error-banner">
          <BadgeAlert className="w-5 h-5 shrink-0 text-red-500" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider block">CMS Operation Interrupted</span>
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 rounded-md text-xs flex items-start gap-3 animate-pulse" id="product-success-banner">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider block">Inventory Register Updated</span>
            <p className="leading-relaxed">{success}</p>
          </div>
        </div>
      )}

      {/* VIEW 1: PRODUCTS TABLE LISTING */}
      {view === 'list' && (
        <div className="space-y-4" id="products-list-wrapper">
          
          {/* List action headers */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-stone-950 p-4 border border-stone-800 rounded">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by code, title, tags..."
                className="w-full bg-stone-900 border border-stone-800 text-xs text-stone-200 pl-9 pr-4 py-2 rounded focus:outline-hidden focus:border-amber-500 font-mono"
              />
            </div>

            <div className="flex flex-wrap w-full sm:w-auto items-center gap-3">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-stone-900 border border-stone-800 text-[11px] text-stone-300 font-bold uppercase tracking-wider px-3 py-2 rounded focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-stone-900 border border-stone-800 text-[11px] text-stone-300 font-bold uppercase tracking-wider px-3 py-2 rounded focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>

              {/* Add Button */}
              <button
                onClick={openAddForm}
                className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-stone-950 font-bold uppercase tracking-wider text-[11px] py-2 px-4 rounded cursor-pointer transition-colors"
                id="add-product-btn"
              >
                <Plus className="w-4 h-4" />
                <span>Add Ornament</span>
              </button>
            </div>
          </div>

          {/* Skeletons/Loading State */}
          {loading ? (
            <div className="space-y-3" id="products-loading-skeleton">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="h-20 bg-stone-950 border border-stone-800 animate-pulse rounded flex items-center justify-between px-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-stone-900 rounded" />
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-stone-900 rounded" />
                      <div className="h-3 w-20 bg-stone-900 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-12 bg-stone-900 rounded" />
                  <div className="h-8 w-24 bg-stone-900 rounded" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-stone-950 border border-stone-800 rounded p-6" id="empty-products-state">
              <Gem className="w-12 h-12 text-stone-600 mx-auto mb-3" />
              <p className="text-stone-300 font-serif text-lg font-bold">No Products Found</p>
              <p className="text-stone-500 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                We couldn't find any products matching your active search queries or filters. Adjust search keywords or register a new ornament.
              </p>
            </div>
          ) : (
            /* Responsive table grid list */
            <div className="overflow-x-auto bg-stone-950 border border-stone-800 rounded" id="products-table-box">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 uppercase tracking-widest font-bold bg-stone-950">
                    <th className="p-4 w-16">Preview</th>
                    <th className="p-4 w-28">Code / SKU</th>
                    <th className="p-4">Name / Category</th>
                    <th className="p-4 w-24">Metal</th>
                    <th className="p-4 w-24 text-right">Weight</th>
                    <th className="p-4 w-28">Price Mode</th>
                    <th className="p-4 w-24 text-center">Featured</th>
                    <th className="p-4 w-24 text-center">Status</th>
                    <th className="p-4 w-32 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-850/60 font-sans text-stone-300">
                  {filteredProducts.map(prod => {
                    const matchedCat = categories.find(c => c.id === prod.category)?.name || 'Jewellery';
                    const matchedCollection = collections.find(col => col.id === prod.collection)?.name || '';

                    return (
                      <tr key={prod.id} className="hover:bg-stone-900/35 transition-colors group">
                        
                        {/* Thumbnail */}
                        <td className="p-4">
                          <div className="w-11 h-11 rounded border border-stone-800 bg-stone-900 overflow-hidden shrink-0">
                            <img
                              src={prod.thumbnail || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=120'}
                              alt={prod.productName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </td>

                        {/* Product Code */}
                        <td className="p-4 font-mono font-bold text-amber-500/90 tracking-wider">
                          {prod.productCode}
                        </td>

                        {/* Name and Category / Subcategory / Collection */}
                        <td className="p-4">
                          <span className="block text-stone-100 font-bold truncate max-w-xs">{prod.productName}</span>
                          <div className="flex flex-wrap gap-1.5 mt-1 text-[9px] text-stone-500 font-semibold tracking-wider uppercase">
                            <span>{matchedCat}</span>
                            {prod.subcategory && (
                              <>
                                <span>•</span>
                                <span>{prod.subcategory}</span>
                              </>
                            )}
                            {matchedCollection && (
                              <>
                                <span>•</span>
                                <span className="text-amber-600/80">{matchedCollection}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Metal Type and Purity */}
                        <td className="p-4">
                          <span className="block text-stone-200 capitalize font-medium">{prod.metal}</span>
                          <span className="block text-[10px] text-stone-500 font-semibold font-mono tracking-wider">{prod.purity.toUpperCase()}</span>
                        </td>

                        {/* Gross Weight */}
                        <td className="p-4 text-right font-mono font-semibold text-stone-200">
                          {prod.weight ? `${parseFloat(prod.weight).toFixed(3)}g` : '--'}
                        </td>

                        {/* Price Details and Visibility */}
                        <td className="p-4 font-mono text-stone-300">
                          {prod.priceVisibility === 'visible' && prod.price ? (
                            <span>₹{parseInt(prod.price).toLocaleString('en-IN')}</span>
                          ) : prod.priceVisibility === 'on_enquiry' ? (
                            <span className="text-amber-500/80 font-sans text-[10px] font-bold uppercase tracking-wider">On Enquiry</span>
                          ) : (
                            <span className="text-stone-500 font-sans text-[10px] font-bold uppercase tracking-wider">Hidden</span>
                          )}
                        </td>

                        {/* Featured Or New Badges */}
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            {prod.featured && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-bold uppercase tracking-wider">
                                Featured
                              </span>
                            )}
                            {prod.newArrival && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-bold uppercase tracking-wider">
                                New
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status (Published vs Draft) */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleTogglePublish(prod)}
                            className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest inline-flex items-center gap-1 transition-all ${
                              prod.status === 'published' 
                                ? 'bg-emerald-950/40 hover:bg-emerald-900/30 border border-emerald-500/20 text-emerald-400' 
                                : 'bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400'
                            }`}
                            title="Toggle catalog visibility"
                          >
                            {prod.status === 'published' ? (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>Published</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>Draft</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Action controls */}
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => openEditForm(prod)}
                              className="p-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded text-stone-300 hover:text-amber-500 transition-colors cursor-pointer"
                              title="Edit product details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicateProduct(prod)}
                              className="p-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded text-stone-300 hover:text-amber-500 transition-colors cursor-pointer"
                              title="Duplicate/Clone item"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.productName)}
                              className="p-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-red-900 hover:bg-red-950/10 rounded text-stone-400 hover:text-red-400 transition-colors cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* VIEW 2 & 3: FORM WORKSPACE (ADD / EDIT) */}
      {(view === 'add' || view === 'edit') && (
        <form onSubmit={handleSaveProduct} className="space-y-6 text-xs text-stone-300" id="product-form-workspace">
          
          {/* Header Action Row */}
          <div className="flex items-center justify-between border-b border-stone-800 pb-4">
            <button
              type="button"
              onClick={() => setView('list')}
              className="inline-flex items-center gap-1.5 text-stone-400 hover:text-stone-100 font-bold uppercase tracking-wider text-[10px] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Listing</span>
            </button>
            
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={() => setView('list')}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 font-bold uppercase tracking-wider text-[10px] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-800 text-stone-950 font-bold uppercase tracking-wider text-[10px] px-5 py-2 rounded cursor-pointer transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Ornament</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Form Layout Split Blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMN 1 & 2: Main Catalog Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Block A: Core Identity */}
              <div className="bg-stone-950 border border-stone-800 rounded p-6 space-y-4">
                <h3 className="font-serif font-bold text-stone-100 text-sm border-b border-stone-900 pb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>Product Metadata Registry</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product SKU/Code */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-productCode" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                      Unique Code / SKU <span className="text-amber-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="form-productCode"
                      name="productCode"
                      required
                      value={formData.productCode}
                      onChange={handleInputChange}
                      placeholder="e.g., PM-GOLD-N204"
                      className="w-full bg-stone-900 border border-stone-800 text-stone-100 p-3 rounded focus:outline-hidden focus:border-amber-500 font-mono"
                    />
                  </div>

                  {/* Slug */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-slug" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                      URL Slug <span className="text-amber-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="form-slug"
                      name="slug"
                      required
                      value={formData.slug}
                      onChange={handleInputChange}
                      placeholder="e.g., handcrafted-antique-necklace"
                      className="w-full bg-stone-900 border border-stone-800 text-stone-100 p-3 rounded focus:outline-hidden focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* Product Name */}
                <div className="space-y-1.5">
                  <label htmlFor="form-productName" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                    Product Title / Name <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="form-productName"
                    name="productName"
                    required
                    value={formData.productName}
                    onChange={handleInputChange}
                    placeholder="e.g., Antique Gold Peacock Choker Set"
                    className="w-full bg-stone-900 border border-stone-800 text-stone-100 p-3 rounded focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                {/* Short Description */}
                <div className="space-y-1.5">
                  <label htmlFor="form-shortDescription" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                    Snippet / Short Description
                  </label>
                  <input
                    type="text"
                    id="form-shortDescription"
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleInputChange}
                    placeholder="A brief high-level summary that displays on lists..."
                    className="w-full bg-stone-900 border border-stone-800 text-stone-100 p-3 rounded focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                {/* Full Description */}
                <div className="space-y-1.5">
                  <label htmlFor="form-description" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                    Detailed Catalogue Description
                  </label>
                  <textarea
                    id="form-description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Detail the filigree work, kundan sets, back clasp configuration, and weight splits..."
                    className="w-full bg-stone-900 border border-stone-800 text-stone-100 p-3 rounded focus:outline-hidden focus:border-amber-500 leading-relaxed font-sans"
                  />
                </div>
              </div>

              {/* Block B: Classifications & Categories */}
              <div className="bg-stone-950 border border-stone-800 rounded p-6 space-y-4">
                <h3 className="font-serif font-bold text-stone-100 text-sm border-b border-stone-900 pb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-500" />
                  <span>Taxonomy & Grouping</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-category" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                      Main Ornaments Category
                    </label>
                    <select
                      id="form-category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full bg-stone-900 border border-stone-800 text-stone-200 p-3 rounded focus:outline-hidden focus:border-amber-500 cursor-pointer"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategory */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-subcategory" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                      Subcategory / Tag Group
                    </label>
                    <input
                      type="text"
                      id="form-subcategory"
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleInputChange}
                      placeholder="e.g., Traditional Jhumka"
                      className="w-full bg-stone-900 border border-stone-800 text-stone-100 p-3 rounded focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  {/* Collection */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-collection" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                      Curated Master Collection
                    </label>
                    <select
                      id="form-collection"
                      name="collection"
                      value={formData.collection}
                      onChange={handleInputChange}
                      className="w-full bg-stone-900 border border-stone-800 text-stone-200 p-3 rounded focus:outline-hidden focus:border-amber-500 cursor-pointer"
                    >
                      <option value="">No curated collection</option>
                      {collections.map(col => (
                        <option key={col.id} value={col.id}>{col.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Block C: ImageKit Multi-uploader */}
              <div className="bg-stone-950 border border-stone-800 rounded p-6 space-y-4">
                <h3 className="font-serif font-bold text-stone-100 text-sm border-b border-stone-900 pb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  <span>Jewellery Ornaments Media Library</span>
                </h3>
                <p className="text-[10px] text-stone-500 leading-relaxed">
                  First image uploaded acts as the cover thumbnail in catalogues. Leverage the direct ImageKit pipeline to upload high-fidelity transparent renders or lifestyle layouts.
                </p>

                <ImageUploader
                  id="product-uploader"
                  multiple={true}
                  value={formData.images}
                  onChange={(urls) => setFormData(prev => ({ ...prev, images: urls as string[] }))}
                />
              </div>

              {/* Block D: SEO Configurations */}
              <div className="bg-stone-950 border border-stone-800 rounded p-6 space-y-4">
                <h3 className="font-serif font-bold text-stone-100 text-sm border-b border-stone-900 pb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Search Engine Optimization (SEO) & Social Graph</span>
                </h3>

                <div className="space-y-1.5">
                  <label htmlFor="form-seoTitle" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                    Meta Title Tag
                  </label>
                  <input
                    type="text"
                    id="form-seoTitle"
                    name="seoTitle"
                    value={formData.seoTitle}
                    onChange={handleInputChange}
                    placeholder="Curate an attractive Title for Google Search Index Cards..."
                    className="w-full bg-stone-900 border border-stone-800 text-stone-100 p-3 rounded focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="form-seoDescription" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                    Meta Description Tag
                  </label>
                  <textarea
                    id="form-seoDescription"
                    name="seoDescription"
                    value={formData.seoDescription}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Detail the ornament in 150 characters to hook organic traffic..."
                    className="w-full bg-stone-900 border border-stone-800 text-stone-100 p-3 rounded focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="form-imageAltText" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                    Product Image Alt Text (for screen readers & image search)
                  </label>
                  <input
                    type="text"
                    id="form-imageAltText"
                    name="imageAltText"
                    value={formData.imageAltText}
                    onChange={handleInputChange}
                    placeholder="e.g., Heavy Handcrafted 22K Gold Sita Har Wedding Necklace"
                    className="w-full bg-stone-900 border border-stone-800 text-stone-100 p-3 rounded focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 border-t border-stone-900 space-y-4">
                  <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Social Share Custom Meta (Open Graph)</span>
                  
                  <div className="space-y-1.5">
                    <label htmlFor="form-ogTitle" className="font-bold text-stone-500 uppercase tracking-wider text-[10px] block">
                      Social Card Title (og:title)
                    </label>
                    <input
                      type="text"
                      id="form-ogTitle"
                      name="ogTitle"
                      value={formData.ogTitle}
                      onChange={handleInputChange}
                      placeholder="e.g., The Heritage Sita Har - Handcrafted in Pure 22K Gold"
                      className="w-full bg-stone-900 border border-stone-850 text-stone-300 p-3 rounded focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="form-ogDescription" className="font-bold text-stone-500 uppercase tracking-wider text-[10px] block">
                      Social Card Description (og:description)
                    </label>
                    <textarea
                      id="form-ogDescription"
                      name="ogDescription"
                      value={formData.ogDescription}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="e.g., Explore Bengal's finest craftsmanship on Bowbazar Street..."
                      className="w-full bg-stone-900 border border-stone-850 text-stone-300 p-3 rounded focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="form-ogImage" className="font-bold text-stone-500 uppercase tracking-wider text-[10px] block">
                      Social Card Custom Image URL (og:image)
                    </label>
                    <input
                      type="text"
                      id="form-ogImage"
                      name="ogImage"
                      value={formData.ogImage}
                      onChange={handleInputChange}
                      placeholder="e.g., ImageKit URL (Defaults to first product image if empty)"
                      className="w-full bg-stone-900 border border-stone-850 text-stone-300 p-3 rounded focus:outline-hidden focus:border-amber-500 font-mono text-[10px]"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* COLUMN 3: Right Sidebar Controls & Diagnostics */}
            <div className="space-y-6">
              
              {/* Block E: Metal specifications */}
              <div className="bg-stone-950 border border-stone-800 rounded p-6 space-y-4">
                <h3 className="font-serif font-bold text-stone-100 text-sm border-b border-stone-900 pb-2 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>Metal & Purity Specifications</span>
                </h3>

                {/* Metal Type */}
                <div className="space-y-1.5">
                  <label htmlFor="form-metal" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                    Base Precious Metal
                  </label>
                  <select
                    id="form-metal"
                    name="metal"
                    value={formData.metal}
                    onChange={handleInputChange}
                    className="w-full bg-stone-900 border border-stone-800 text-stone-200 p-3 rounded focus:outline-hidden focus:border-amber-500 cursor-pointer capitalize"
                  >
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="platinum">Platinum</option>
                    <option value="diamond_setting">Diamond Setting</option>
                  </select>
                </div>

                {/* Purity Option */}
                <div className="space-y-1.5">
                  <label htmlFor="form-purity" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                    Fine Purity Grade
                  </label>
                  <select
                    id="form-purity"
                    name="purity"
                    value={formData.purity}
                    onChange={handleInputChange}
                    className="w-full bg-stone-900 border border-stone-800 text-stone-200 p-3 rounded focus:outline-hidden focus:border-amber-500 cursor-pointer uppercase font-mono"
                  >
                    {PURITY_OPTIONS[formData.metal as keyof typeof PURITY_OPTIONS]?.map(pur => (
                      <option key={pur} value={pur}>{pur}</option>
                    )) || <option value="22k">22K</option>}
                  </select>
                </div>

                {/* Gross weight */}
                <div className="space-y-1.5">
                  <label htmlFor="form-weight" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                    Gross Weight (Grams)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    id="form-weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    placeholder="e.g., 28.450"
                    className="w-full bg-stone-900 border border-stone-800 text-stone-100 p-3 rounded focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Block F: Price and Tag Config */}
              <div className="bg-stone-950 border border-stone-800 rounded p-6 space-y-4">
                <h3 className="font-serif font-bold text-stone-100 text-sm border-b border-stone-900 pb-2 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>Price Config & Showroom Access</span>
                </h3>

                {/* Price (In INR) */}
                <div className="space-y-1.5">
                  <label htmlFor="form-price" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                    Showroom Estimate Price (INR)
                  </label>
                  <input
                    type="number"
                    id="form-price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g., 185000"
                    className="w-full bg-stone-900 border border-stone-800 text-stone-100 p-3 rounded focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Price Visibility */}
                <div className="space-y-1.5">
                  <label htmlFor="form-priceVisibility" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                    Store Price Visibility
                  </label>
                  <select
                    id="form-priceVisibility"
                    name="priceVisibility"
                    value={formData.priceVisibility}
                    onChange={handleInputChange}
                    className="w-full bg-stone-900 border border-stone-800 text-stone-200 p-3 rounded focus:outline-hidden focus:border-amber-500 cursor-pointer font-sans"
                  >
                    <option value="on_enquiry">Ask for Price (WhatsApp lead)</option>
                    <option value="visible">Show price on website</option>
                    <option value="hidden">Hide price completely</option>
                  </select>
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <label htmlFor="form-tags" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                    Product Search Tags
                  </label>
                  <input
                    type="text"
                    id="form-tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="e.g., kundan, antique, bridal"
                    className="w-full bg-stone-900 border border-stone-800 text-stone-100 p-3 rounded focus:outline-hidden focus:border-amber-500"
                  />
                  <span className="text-[9px] text-stone-500">Comma separated keywords for internal search engines.</span>
                </div>
              </div>

              {/* Block G: Showroom Stores Sync */}
              <div className="bg-stone-950 border border-stone-800 rounded p-6 space-y-4">
                <h3 className="font-serif font-bold text-stone-100 text-sm border-b border-stone-900 pb-2 flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-500" />
                  <span>Available Showrooms</span>
                </h3>

                <div className="space-y-2">
                  {stores.map(st => {
                    const isChecked = formData.availableStores.includes(st.id);
                    return (
                      <label 
                        key={st.id} 
                        className={`flex items-start gap-3 p-3 rounded border transition-all cursor-pointer ${
                          isChecked 
                            ? 'bg-amber-600/5 border-amber-600/30 text-stone-100' 
                            : 'bg-stone-900/50 border-stone-850 text-stone-400 hover:text-stone-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleStoreToggle(st.id)}
                          className="mt-0.5 rounded text-amber-600 focus:ring-amber-500/30 bg-stone-900 border-stone-800 h-3.5 w-3.5 cursor-pointer"
                        />
                        <div>
                          <span className="block font-bold text-[11px]">{st.name}</span>
                          <span className="block text-[9px] text-stone-500 mt-0.5 truncate max-w-[180px]">{st.address}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Block H: Publishing Toggles */}
              <div className="bg-stone-950 border border-stone-800 rounded p-6 space-y-4">
                <h3 className="font-serif font-bold text-stone-100 text-sm border-b border-stone-900 pb-2 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-amber-500" />
                  <span>Publishing Controls</span>
                </h3>

                <div className="space-y-4">
                  {/* Status selection */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-status" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] block">
                      Moderation Status
                    </label>
                    <select
                      id="form-status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full bg-stone-900 border border-stone-800 text-stone-200 p-3 rounded focus:outline-hidden focus:border-amber-500 cursor-pointer font-bold uppercase tracking-wider"
                    >
                      <option value="draft">Draft (Private Archive)</option>
                      <option value="published">Published (Live Catalogue)</option>
                    </select>
                  </div>

                  {/* Featured Toggle */}
                  <div className="flex items-center justify-between p-3 rounded bg-stone-900/40 border border-stone-850">
                    <div>
                      <span className="block font-bold text-stone-200">Featured Masterpiece</span>
                      <span className="block text-[9px] text-stone-500 mt-0.5">Showcase prominently on home carousel.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={formData.featured}
                        onChange={(e) => handleCheckboxChange('featured', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-stone-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-400 after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600 peer-checked:after:bg-stone-950 peer-checked:after:border-stone-950"></div>
                    </label>
                  </div>

                  {/* New Arrival Toggle */}
                  <div className="flex items-center justify-between p-3 rounded bg-stone-900/40 border border-stone-850">
                    <div>
                      <span className="block font-bold text-stone-200">New Arrival Banner</span>
                      <span className="block text-[9px] text-stone-500 mt-0.5">Mark item with dynamic visual ribbons.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={formData.newArrival}
                        onChange={(e) => handleCheckboxChange('newArrival', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-stone-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-400 after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600 peer-checked:after:bg-stone-950 peer-checked:after:border-stone-950"></div>
                    </label>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Fixed Action Row */}
          <div className="flex justify-end gap-3 border-t border-stone-800 pt-5">
            <button
              type="button"
              onClick={() => setView('list')}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 font-bold uppercase tracking-wider text-[10px] rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-800 text-stone-950 font-bold uppercase tracking-wider text-[10px] px-6 py-2.5 rounded cursor-pointer transition-colors"
              id="product-form-save-btn"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Catalogue Item</span>
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
