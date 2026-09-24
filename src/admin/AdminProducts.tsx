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
  Settings,
  History,
  RotateCcw
} from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';
import { mockProducts, mockStores, mockCollections, mockMetalPrices } from '../data/mockData';
import { calculateProductPrice } from '../utils/calculateProductPrice';

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
    { id: 'Necklaces', name: 'Necklaces' },
    { id: 'Earrings', name: 'Earrings' },
    { id: 'Rings', name: 'Rings' },
    { id: 'Bangles', name: 'Bangles' },
    { id: 'Bridal Accessories', name: 'Bridal Accessories' },
    { id: 'Chokers', name: 'Chokers' },
    { id: 'Pendants', name: 'Pendants' }
  ]);
  const [collections, setCollections] = useState<any[]>(mockCollections);
  const [stores, setStores] = useState<any[]>(mockStores);
  const [metalPrices, setMetalPrices] = useState<any[]>([]);

  // Form Fields State
  const [formData, setFormData] = useState({
    id: '',
    productCode: '',
    productName: '',
    slug: '',
    shortDescription: '',
    description: '',
    category: 'Necklaces',
    subcategory: '',
    collection: 'col-1',
    metal: 'gold' as 'gold' | 'silver' | 'platinum' | 'diamond_setting',
    purity: '22k',
    weight: '',
    price: '',
    metalRef: '',
    makingCharge: '',
    makingChargeType: 'fixed' as 'fixed' | 'percentage' | 'fixed_per_gram',
    wastagePercent: '',
    otherChargesName: 'Hallmarking & Certification',
    otherChargesAmount: '',
    hallmarkCharge: '',
    gstPercent: '3',
    mrp: '',
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
    imageAltText: '',
    badgeLabel: '',
    badgeColor: '#927230',
    rating: '',
    reviewCount: ''
  });

  // Local Storage Product Listing Draft state
  const DRAFT_STORAGE_KEY = 'jewellery_product_listing_draft';
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [draftRestoredNotice, setDraftRestoredNotice] = useState(false);

  // Check if draft exists on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.formData?.productName || parsed.formData?.images?.length > 0 || parsed.formData?.description || parsed.formData?.weight)) {
          setHasSavedDraft(true);
        }
      }
    } catch (e) {
      console.error('Error reading product draft from localStorage:', e);
    }
  }, []);

  // Auto-save draft to localStorage whenever user edits in 'add' view
  useEffect(() => {
    if (view === 'add') {
      const hasContent = 
        formData.productName.trim() !== '' || 
        formData.description.trim() !== '' ||
        formData.shortDescription.trim() !== '' ||
        formData.images.length > 0 || 
        formData.weight.trim() !== '' ||
        formData.makingCharge.trim() !== '' ||
        formData.tags.trim() !== '';

      if (hasContent) {
        try {
          const draftPayload = {
            formData,
            savedAt: new Date().toISOString()
          };
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
          setHasSavedDraft(true);
        } catch (e) {
          console.error('Error saving product draft to localStorage:', e);
        }
      }
    }
  }, [formData, view]);

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
              category: item.category || 'Necklaces',
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

          // Fetch metalPrices dynamically
          const pricesSnap = await getDocs(collection(db, 'metalPrices'));
          if (!pricesSnap.empty) {
            setMetalPrices(pricesSnap.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                metalName: data.metalName || data.metal || '',
                pricePerGram: Number(data.price || data.pricePerGram || data.ratePerGram || 0),
                status: data.status || 'active'
              };
            }));
          } else {
            setMetalPrices(mockMetalPrices);
          }
        } catch (e) {
          console.warn('Could not load separate CMS master collections:', e);
          setMetalPrices(mockMetalPrices);
        }

      } else {
        // Fallback offline simulation
        const localStoredPrices = localStorage.getItem('local_metal_prices');
        if (localStoredPrices) {
          try {
            setMetalPrices(JSON.parse(localStoredPrices));
          } catch (e) {
            setMetalPrices(mockMetalPrices);
          }
        } else {
          setMetalPrices(mockMetalPrices);
        }

        setProducts((mockProducts as any[]).map(p => ({
          id: p.id,
          productCode: p.sku,
          productName: p.name,
          slug: generateSlug(p.name),
          shortDescription: p.description.substring(0, 100),
          description: p.description,
          category: p.category || 'Necklaces',
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
    // Check if there is an existing draft to restore
    let restored = false;
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.formData && (parsed.formData.productName || parsed.formData.images?.length > 0 || parsed.formData.description || parsed.formData.weight)) {
          setFormData(parsed.formData);
          restored = true;
          setDraftRestoredNotice(true);
        }
      }
    } catch (e) {
      console.error('Error auto-restoring draft:', e);
    }

    if (!restored) {
      setFormData({
        id: '',
        productCode: `PM-GOLD-${Math.floor(100 + Math.random() * 900)}`,
        productName: '',
        slug: '',
        shortDescription: '',
        description: '',
        category: categories[0]?.id || 'Necklaces',
        subcategory: '',
        collection: collections[0]?.id || '',
        metal: 'gold',
        purity: '22K Gold (916)',
        weight: '',
        price: '',
        metalRef: '',
        makingCharge: '',
        makingChargeType: 'fixed',
        wastagePercent: '',
        otherChargesName: 'Hallmarking & Certification',
        otherChargesAmount: '',
        hallmarkCharge: '',
        gstPercent: '3',
        mrp: '',
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
        imageAltText: '',
        badgeLabel: '',
        badgeColor: '#927230',
        rating: '',
        reviewCount: ''
      });
      setDraftRestoredNotice(false);
    }

    setError(null);
    setSuccess(null);
    setView('add');
  };

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasSavedDraft(false);
      setDraftRestoredNotice(false);
      setFormData({
        id: '',
        productCode: `PM-GOLD-${Math.floor(100 + Math.random() * 900)}`,
        productName: '',
        slug: '',
        shortDescription: '',
        description: '',
        category: categories[0]?.id || 'Necklaces',
        subcategory: '',
        collection: collections[0]?.id || '',
        metal: 'gold',
        purity: '22K Gold (916)',
        weight: '',
        price: '',
        metalRef: '',
        makingCharge: '',
        makingChargeType: 'fixed',
        wastagePercent: '',
        otherChargesName: 'Hallmarking & Certification',
        otherChargesAmount: '',
        hallmarkCharge: '',
        gstPercent: '3',
        mrp: '',
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
        imageAltText: '',
        badgeLabel: '',
        badgeColor: '#927230',
        rating: '',
        reviewCount: ''
      });
    } catch (e) {
      console.error('Error clearing draft:', e);
    }
  };

  const openEditForm = (prod: any) => {
    // Normalize purity name for the select input
    let normPurity = prod.purity || '22K Gold (916)';
    if (normPurity.toLowerCase().includes('22k') || normPurity.includes('916')) {
      normPurity = '22K Gold (916)';
    } else if (normPurity.toLowerCase().includes('18k')) {
      normPurity = '18K Gold';
    } else if (normPurity.toLowerCase().includes('925') || normPurity.toLowerCase().includes('silver')) {
      normPurity = '925 Silver';
    }

    setFormData({
      id: prod.id,
      productCode: prod.productCode || '',
      productName: prod.productName || '',
      slug: prod.slug || '',
      shortDescription: prod.shortDescription || '',
      description: prod.description || '',
      category: prod.category || 'Necklaces',
      subcategory: prod.subcategory || '',
      collection: prod.collection || '',
      metal: prod.metal || 'gold',
      purity: normPurity,
      weight: prod.weight || '',
      price: prod.price || '',
      metalRef: prod.metalRef || '',
      makingCharge: prod.makingCharge !== undefined ? String(prod.makingCharge) : '',
      makingChargeType: prod.makingChargeType || 'fixed',
      wastagePercent: prod.wastagePercent !== undefined ? String(prod.wastagePercent) : '',
      otherChargesName: prod.otherChargesName || 'Hallmarking & Certification',
      otherChargesAmount: prod.otherChargesAmount !== undefined ? String(prod.otherChargesAmount) : '',
      hallmarkCharge: prod.hallmarkCharge !== undefined ? String(prod.hallmarkCharge) : '',
      gstPercent: prod.gstPercent !== undefined ? String(prod.gstPercent) : '3',
      mrp: prod.mrp !== undefined && prod.mrp !== null ? String(prod.mrp) : '',
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
      imageAltText: prod.imageAltText || '',
      badgeLabel: prod.badgeLabel || '',
      badgeColor: prod.badgeColor || '#927230',
      rating: prod.rating !== undefined && prod.rating !== null ? String(prod.rating) : '',
      reviewCount: prod.reviewCount !== undefined && prod.reviewCount !== null ? String(prod.reviewCount) : ''
    });
    setError(null);
    setSuccess(null);
    setView('edit');
  };

  // Duplicate Product Action
  const handleDuplicateProduct = (prod: any) => {
    // Normalize purity name for the select input
    let normPurity = prod.purity || '22K Gold (916)';
    if (normPurity.toLowerCase().includes('22k') || normPurity.includes('916')) {
      normPurity = '22K Gold (916)';
    } else if (normPurity.toLowerCase().includes('18k')) {
      normPurity = '18K Gold';
    } else if (normPurity.toLowerCase().includes('925') || normPurity.toLowerCase().includes('silver')) {
      normPurity = '925 Silver';
    }

    setFormData({
      id: '', // Empty ID represents new product creation
      productCode: `${prod.productCode || 'PM'}-COPY`,
      productName: `${prod.productName || 'Product'} (Copy)`,
      slug: `${prod.slug || 'product'}-copy`,
      shortDescription: prod.shortDescription || '',
      description: prod.description || '',
      category: prod.category || 'Necklaces',
      subcategory: prod.subcategory || '',
      collection: prod.collection || '',
      metal: prod.metal || 'gold',
      purity: normPurity,
      weight: prod.weight || '',
      price: prod.price || '',
      metalRef: prod.metalRef || '',
      makingCharge: prod.makingCharge !== undefined ? String(prod.makingCharge) : '',
      makingChargeType: prod.makingChargeType || 'fixed',
      wastagePercent: prod.wastagePercent !== undefined ? String(prod.wastagePercent) : '',
      otherChargesName: prod.otherChargesName || 'Hallmarking & Certification',
      otherChargesAmount: prod.otherChargesAmount !== undefined ? String(prod.otherChargesAmount) : '',
      hallmarkCharge: prod.hallmarkCharge !== undefined ? String(prod.hallmarkCharge) : '',
      gstPercent: prod.gstPercent !== undefined ? String(prod.gstPercent) : '3',
      mrp: prod.mrp !== undefined && prod.mrp !== null ? String(prod.mrp) : '',
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
      imageAltText: prod.imageAltText || '',
      badgeLabel: prod.badgeLabel || '',
      badgeColor: prod.badgeColor || '#927230',
      rating: prod.rating !== undefined && prod.rating !== null ? String(prod.rating) : '',
      reviewCount: prod.reviewCount !== undefined && prod.reviewCount !== null ? String(prod.reviewCount) : ''
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
        metalType: formData.metal === 'gold' ? 'Gold' : formData.metal === 'silver' ? 'Silver' : formData.metal === 'platinum' ? 'Platinum' : formData.metal === 'diamond_setting' ? 'Diamond' : 'Gold',
        purity: formData.purity,
        weight: formData.weight.trim(),
        price: '0', // Exclude frozen price from the document
        metalRef: formData.metalRef,
        makingCharge: Number(formData.makingCharge || 0),
        makingChargeType: formData.makingChargeType,
        wastagePercent: Number(formData.wastagePercent || 0),
        otherChargesName: formData.otherChargesName.trim(),
        otherChargesAmount: Number(formData.otherChargesAmount || 0),
        hallmarkCharge: Number(formData.hallmarkCharge || 0),
        gstPercent: Number(formData.gstPercent !== undefined ? formData.gstPercent : 3),
        mrp: formData.mrp && formData.mrp.trim() !== '' ? Number(formData.mrp) : null,
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
        badgeLabel: formData.badgeLabel.trim(),
        badgeColor: formData.badgeColor.trim(),
        rating: formData.rating && formData.rating.trim() !== '' ? Number(formData.rating) : null,
        reviewCount: formData.reviewCount && formData.reviewCount.trim() !== '' ? Number(formData.reviewCount) : null,
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
        // Successfully published - clear the draft from localStorage
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
          setHasSavedDraft(false);
          setDraftRestoredNotice(false);
        } catch (e) {
          console.error('Error clearing draft on publish:', e);
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
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 border border-stone-200/80 rounded-xl shadow-xs">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by code, title, tags..."
                className="w-full bg-[#f8f7f4] border border-stone-200 text-xs text-stone-900 pl-9 pr-4 py-2.5 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white font-sans placeholder:text-stone-400 transition-all"
              />
            </div>

            <div className="flex flex-wrap w-full sm:w-auto items-center gap-3">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#f8f7f4] border border-stone-200 text-[11px] text-stone-700 font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-lg focus:outline-hidden focus:bg-white cursor-pointer"
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
                className="bg-[#f8f7f4] border border-stone-200 text-[11px] text-stone-700 font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-lg focus:outline-hidden focus:bg-white cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>

              {/* Draft indicator if a draft is pending in browser */}
              {hasSavedDraft && (
                <button
                  onClick={openAddForm}
                  type="button"
                  className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-300 text-amber-800 font-bold uppercase tracking-wider text-[11px] py-2.5 px-3.5 rounded-lg cursor-pointer transition-all shadow-2xs"
                  id="resume-draft-btn"
                  title="A draft listing was auto-saved on this device. Click to resume."
                >
                  <History className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>Resume Saved Draft</span>
                </button>
              )}

              {/* Add Button */}
              <button
                onClick={openAddForm}
                className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-bold uppercase tracking-wider text-[11px] py-2.5 px-4 rounded-lg cursor-pointer transition-colors shadow-xs"
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
                <div key={idx} className="h-20 bg-white border border-stone-200 animate-pulse rounded-xl flex items-center justify-between px-6 shadow-xs">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-stone-100 rounded-lg" />
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-stone-100 rounded" />
                      <div className="h-3 w-20 bg-stone-100 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-12 bg-stone-100 rounded" />
                  <div className="h-8 w-24 bg-stone-100 rounded" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-stone-200/80 rounded-xl p-6 shadow-xs" id="empty-products-state">
              <Gem className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <p className="text-stone-800 font-serif text-lg font-bold">No Products Found</p>
              <p className="text-stone-500 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                We couldn't find any products matching your active search queries or filters. Adjust search keywords or register a new ornament.
              </p>
            </div>
          ) : (
            /* Responsive table grid list */
            <div className="overflow-x-auto bg-white border border-stone-200/80 rounded-xl shadow-xs" id="products-table-box">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-widest font-bold bg-stone-50/80 text-[10px]">
                    <th className="p-4 w-16">Preview</th>
                    <th className="p-4 w-28">Code / SKU</th>
                    <th className="p-4">Name / Category</th>
                    <th className="p-4 w-24">Metal</th>
                    <th className="p-4 w-24 text-right">Weight</th>
                    <th className="p-4 w-28">Price</th>
                    <th className="p-4 w-24 text-center">Featured</th>
                    <th className="p-4 w-24 text-center">Status</th>
                    <th className="p-4 w-32 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans text-stone-700">
                  {filteredProducts.map(prod => {
                    const matchedCat = categories.find(c => c.id === prod.category)?.name || 'Jewellery';
                    const matchedCollection = collections.find(col => col.id === prod.collection)?.name || '';

                    return (
                      <tr key={prod.id} className="hover:bg-stone-50/60 transition-colors group">
                        
                        {/* Thumbnail */}
                        <td className="p-4">
                          <div className="w-11 h-11 rounded-lg border border-stone-200 bg-stone-100 overflow-hidden shrink-0">
                            <img
                              src={prod.thumbnail || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=120'}
                              alt={prod.productName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </td>

                        {/* Product Code */}
                        <td className="p-4 font-mono font-bold text-stone-900 tracking-wider">
                          {prod.productCode}
                        </td>

                        {/* Name and Category / Subcategory / Collection */}
                        <td className="p-4">
                          <span className="block text-stone-900 font-bold truncate max-w-xs">{prod.productName}</span>
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
                                <span className="text-amber-700">{matchedCollection}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Metal Type and Purity */}
                        <td className="p-4">
                          <span className="block text-stone-800 capitalize font-medium">{prod.metal}</span>
                          <span className="block text-[10px] text-stone-500 font-semibold font-mono tracking-wider">{prod.purity.toUpperCase()}</span>
                        </td>

                        {/* Net Weight */}
                        <td className="p-4 text-right font-mono font-semibold text-stone-800">
                          {prod.weight ? `${parseFloat(prod.weight).toFixed(3)}g` : '--'}
                        </td>

                        {/* Price Details and Visibility */}
                        <td className="p-4 font-mono text-stone-800">
                          {(() => {
                            const calculated = calculateProductPrice({
                              metalRef: prod.metalRef,
                              weight: Number(prod.weight || 0),
                              makingCharge: Number(prod.makingCharge || 0),
                              makingChargeType: prod.makingChargeType || 'fixed',
                              wastagePercent: Number(prod.wastagePercent || 0),
                              otherChargesName: prod.otherChargesName,
                              otherChargesAmount: prod.otherChargesAmount,
                              hallmarkCharge: prod.hallmarkCharge,
                              gstPercent: prod.gstPercent
                            }, metalPrices);

                            if (prod.priceVisibility === 'visible') {
                              return <span className="font-bold text-stone-900">₹{calculated.finalPrice.toLocaleString('en-IN')}</span>;
                            } else if (prod.priceVisibility === 'on_enquiry') {
                              return (
                                <div className="space-y-0.5">
                                  <span className="inline-block text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">On Enquiry</span>
                                  {calculated.finalPrice > 0 && (
                                    <span className="block text-[9px] text-stone-400 font-sans">₹{calculated.finalPrice.toLocaleString('en-IN')}</span>
                                  )}
                                </div>
                              );
                            } else {
                              return <span className="text-stone-400 font-sans text-[10px] font-bold uppercase tracking-wider">Hidden</span>;
                            }
                          })()}
                        </td>

                        {/* Featured Or New Badges */}
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            {prod.featured && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[8px] font-bold uppercase tracking-wider">
                                Featured
                              </span>
                            )}
                            {prod.newArrival && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[8px] font-bold uppercase tracking-wider">
                                New
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status (Published vs Draft) */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleTogglePublish(prod)}
                            className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest inline-flex items-center gap-1 transition-all cursor-pointer ${
                              prod.status === 'published' 
                                ? 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800' 
                                : 'bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-600'
                            }`}
                            title="Toggle catalog visibility"
                          >
                            {prod.status === 'published' ? (
                              <>
                                <Eye className="w-3 h-3 text-emerald-600" />
                                <span>Published</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 text-stone-400" />
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
                              className="p-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-600 hover:text-amber-600 transition-colors cursor-pointer shadow-2xs"
                              title="Edit product details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicateProduct(prod)}
                              className="p-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-600 hover:text-amber-600 transition-colors cursor-pointer shadow-2xs"
                              title="Duplicate/Clone item"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.productName)}
                              className="p-1.5 bg-stone-50 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 rounded-lg text-stone-400 hover:text-rose-600 transition-colors cursor-pointer shadow-2xs"
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
        <form onSubmit={handleSaveProduct} className="space-y-6 text-xs text-stone-800" id="product-form-workspace">
          
          {/* Header Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-stone-200/80 rounded-xl shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setView('list')}
                className="inline-flex items-center gap-1.5 text-stone-600 hover:text-stone-900 font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Listing</span>
              </button>

              {view === 'add' && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-[10px] text-stone-600 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Auto-saving draft locally</span>
                </div>
              )}
            </div>
            
            <div className="inline-flex items-center gap-2">
              {view === 'add' && hasSavedDraft && (
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-rose-50 hover:border-rose-300 border border-stone-200 text-stone-600 hover:text-rose-600 font-bold uppercase tracking-wider text-[10px] rounded-lg transition-colors shadow-2xs cursor-pointer"
                  title="Clear auto-saved draft data from this device"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Discard Draft</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setView('list')}
                className="px-4 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold uppercase tracking-wider text-[10px] rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-200 text-white font-bold uppercase tracking-wider text-[10px] px-5 py-2.5 rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

          {/* Draft Restored Banner */}
          {view === 'add' && draftRestoredNotice && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between gap-3 shadow-2xs animate-fade-in" id="draft-restored-banner">
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Draft Restored:</strong> Previously entered text and selected images have been automatically recovered on this device.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDraftRestoredNotice(false)}
                className="text-stone-500 hover:text-stone-800 p-1 rounded"
                title="Dismiss notice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Form Layout Split Blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMN 1 & 2: Main Catalog Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Block A: Core Identity */}
              <div className="bg-white border border-stone-200/80 rounded-xl p-6 space-y-4 shadow-xs">
                <h3 className="font-serif font-bold text-stone-900 text-sm border-b border-stone-100 pb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>Product Metadata Registry</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product SKU/Code */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-productCode" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                      Unique Code / SKU <span className="text-amber-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="form-productCode"
                      name="productCode"
                      required
                      value={formData.productCode}
                      onChange={handleInputChange}
                      placeholder="e.g., PM-GOLD-N204"
                      className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white font-mono text-xs"
                    />
                  </div>

                  {/* Slug */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-slug" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                      URL Slug <span className="text-amber-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="form-slug"
                      name="slug"
                      required
                      value={formData.slug}
                      onChange={handleInputChange}
                      placeholder="e.g., handcrafted-antique-necklace"
                      className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Product Name */}
                <div className="space-y-1.5">
                  <label htmlFor="form-productName" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                    Product Title / Name <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="form-productName"
                    name="productName"
                    required
                    value={formData.productName}
                    onChange={handleInputChange}
                    placeholder="e.g., Antique Gold Peacock Choker Set"
                    className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white text-xs font-semibold"
                  />
                </div>

                {/* Short Description */}
                <div className="space-y-1.5">
                  <label htmlFor="form-shortDescription" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                    Snippet / Short Description
                  </label>
                  <input
                    type="text"
                    id="form-shortDescription"
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleInputChange}
                    placeholder="A brief high-level summary that displays on lists..."
                    className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white text-xs"
                  />
                </div>

                {/* Full Description */}
                <div className="space-y-1.5">
                  <label htmlFor="form-description" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                    Detailed Catalogue Description
                  </label>
                  <textarea
                    id="form-description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Detail the filigree work, kundan sets, back clasp configuration, and weight splits..."
                    className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white leading-relaxed font-sans text-xs"
                  />
                </div>
              </div>

              {/* Block B: Classifications & Categories */}
              <div className="bg-white border border-stone-200/80 rounded-xl p-6 space-y-4 shadow-xs">
                <h3 className="font-serif font-bold text-stone-900 text-sm border-b border-stone-100 pb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-600" />
                  <span>Taxonomy & Grouping</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-category" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                      Main Ornaments Category
                    </label>
                    <select
                      id="form-category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white cursor-pointer text-xs font-semibold"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategory */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-subcategory" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                      Subcategory / Tag Group
                    </label>
                    <input
                      type="text"
                      id="form-subcategory"
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleInputChange}
                      placeholder="e.g., Traditional Jhumka"
                      className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white text-xs"
                    />
                  </div>

                  {/* Collection */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-collection" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                      Curated Master Collection
                    </label>
                    <select
                      id="form-collection"
                      name="collection"
                      value={formData.collection}
                      onChange={handleInputChange}
                      className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white cursor-pointer text-xs font-semibold"
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
              <div className="bg-white border border-stone-200/80 rounded-xl p-6 space-y-4 shadow-xs">
                <h3 className="font-serif font-bold text-stone-900 text-sm border-b border-stone-100 pb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-600" />
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
              <div className="bg-white border border-stone-200/80 rounded-xl p-6 space-y-4 shadow-xs">
                <h3 className="font-serif font-bold text-stone-900 text-sm border-b border-stone-100 pb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Search Engine Optimization (SEO) & Social Graph</span>
                </h3>

                <div className="space-y-1.5">
                  <label htmlFor="form-seoTitle" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                    Meta Title Tag
                  </label>
                  <input
                    type="text"
                    id="form-seoTitle"
                    name="seoTitle"
                    value={formData.seoTitle}
                    onChange={handleInputChange}
                    placeholder="Curate an attractive Title for Google Search Index Cards..."
                    className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="form-seoDescription" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                    Meta Description Tag
                  </label>
                  <textarea
                    id="form-seoDescription"
                    name="seoDescription"
                    value={formData.seoDescription}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Detail the ornament in 150 characters to hook organic traffic..."
                    className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="form-imageAltText" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                    Product Image Alt Text (for screen readers & image search)
                  </label>
                  <input
                    type="text"
                    id="form-imageAltText"
                    name="imageAltText"
                    value={formData.imageAltText}
                    onChange={handleInputChange}
                    placeholder="e.g., Heavy Handcrafted 22K Gold Sita Har Wedding Necklace"
                    className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white text-xs"
                  />
                </div>

                <div className="pt-2 border-t border-stone-100 space-y-4">
                  <span className="text-[9px] text-stone-500 font-bold uppercase tracking-wider block">Social Share Custom Meta (Open Graph)</span>
                  
                  <div className="space-y-1.5">
                    <label htmlFor="form-ogTitle" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                      Social Card Title (og:title)
                    </label>
                    <input
                      type="text"
                      id="form-ogTitle"
                      name="ogTitle"
                      value={formData.ogTitle}
                      onChange={handleInputChange}
                      placeholder="e.g., The Heritage Sita Har - Handcrafted in Pure 22K Gold"
                      className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="form-ogDescription" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                      Social Card Description (og:description)
                    </label>
                    <textarea
                      id="form-ogDescription"
                      name="ogDescription"
                      value={formData.ogDescription}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="e.g., Explore Bengal's finest craftsmanship on Bowbazar Street..."
                      className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="form-ogImage" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                      Social Card Custom Image URL (og:image)
                    </label>
                    <input
                      type="text"
                      id="form-ogImage"
                      name="ogImage"
                      value={formData.ogImage}
                      onChange={handleInputChange}
                      placeholder="e.g., ImageKit URL (Defaults to first product image if empty)"
                      className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white font-mono text-[10px]"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* COLUMN 3: Right Sidebar Controls & Diagnostics */}
            <div className="space-y-6">
              
              {/* Block E: Metal specifications */}
              <div className="bg-white border border-stone-200/80 rounded-xl p-6 space-y-4 shadow-xs">
                <h3 className="font-serif font-bold text-stone-900 text-sm border-b border-stone-100 pb-3 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>Metal specifications</span>
                </h3>

                {/* Dynamic Base Metal Selection */}
                <div className="space-y-1.5">
                  <label htmlFor="form-metalRef" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                    Assigned Showroom Metal Rate
                  </label>
                  <select
                    id="form-metalRef"
                    name="metalRef"
                    value={formData.metalRef}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const matched = metalPrices.find(m => m.id === selectedId);
                      setFormData(prev => {
                        let normPurity = matched ? (matched.purity || '22k') : prev.purity;
                        if (normPurity.toLowerCase().includes('22k') || normPurity.includes('916')) {
                          normPurity = '22K Gold (916)';
                        } else if (normPurity.toLowerCase().includes('18k')) {
                          normPurity = '18K Gold';
                        } else if (normPurity.toLowerCase().includes('925') || normPurity.toLowerCase().includes('silver')) {
                          normPurity = '925 Silver';
                        }

                        return {
                          ...prev,
                          metalRef: selectedId,
                          metal: (matched ? (matched.metalName.toLowerCase().includes('silver') ? 'silver' : matched.metalName.toLowerCase().includes('platinum') ? 'platinum' : 'gold') : prev.metal) as any,
                          purity: normPurity
                        };
                      });
                    }}
                    className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white cursor-pointer text-xs font-semibold"
                  >
                    <option value="">-- Select Bullion Index --</option>
                    {metalPrices.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.metalName} ({m.purity || 'Standard Purity'}) - ₹{m.pricePerGram || m.price}/g {m.status === 'inactive' ? '[INACTIVE]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Storefront Metal Type Filter Mapping */}
                <div className="space-y-1.5">
                  <label htmlFor="form-metal" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                    Storefront Metal Type Filter
                  </label>
                  <select
                    id="form-metal"
                    name="metal"
                    value={formData.metal}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        metal: val as any,
                        purity: val === 'silver' ? '925 Silver' : val === 'diamond_setting' ? '18K Gold' : '22K Gold (916)'
                      }));
                    }}
                    className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white cursor-pointer text-xs font-semibold"
                  >
                    <option value="gold">Gold</option>
                    <option value="diamond_setting">Diamond</option>
                    <option value="silver">Silver</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </div>

                {/* Storefront Purity Standard Filter Mapping */}
                <div className="space-y-1.5">
                  <label htmlFor="form-purity" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                    Storefront Purity Standard Filter
                  </label>
                  <select
                    id="form-purity"
                    name="purity"
                    value={formData.purity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        purity: val
                      }));
                    }}
                    className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white cursor-pointer text-xs font-semibold"
                  >
                    <option value="22K Gold (916)">22K Gold (916)</option>
                    <option value="18K Gold">18K Gold</option>
                    <option value="925 Silver">925 Silver</option>
                  </select>
                </div>

                {/* Active warnings and status badging */}
                {(() => {
                  const matched = metalPrices.find(m => m.id === formData.metalRef);
                  if (formData.metalRef && !matched) {
                    return (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] rounded-lg flex items-center gap-1.5 font-bold uppercase tracking-wider animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                        <span>Warning: Assigned Metal index is missing!</span>
                      </div>
                    );
                  }
                  if (matched && matched.status === 'inactive') {
                    return (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] rounded-lg flex items-center gap-1.5 font-bold uppercase tracking-wider">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>Warning: Assigned Metal is marked INACTIVE!</span>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Net weight */}
                <div className="space-y-1.5">
                  <label htmlFor="form-weight" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                    Net Weight (Grams)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    id="form-weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    placeholder="e.g., 28.450"
                    className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Block F: Price and Tag Config */}
              <div className="bg-white border border-stone-200/80 rounded-xl p-6 space-y-4 shadow-xs">
                <h3 className="font-serif font-bold text-stone-900 text-sm border-b border-stone-100 pb-3 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>Dynamic Pricing Calculator</span>
                </h3>

                {/* Making Charge */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="form-makingCharge" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                      Making Charge Rate
                    </label>
                    <input
                      type="number"
                      id="form-makingCharge"
                      name="makingCharge"
                      value={formData.makingCharge}
                      onChange={handleInputChange}
                      placeholder="e.g. 450"
                      className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="form-makingChargeType" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                      CALCULATION TYPE
                    </label>
                    <select
                      id="form-makingChargeType"
                      name="makingChargeType"
                      value={formData.makingChargeType}
                      onChange={handleInputChange}
                      className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white cursor-pointer text-xs font-semibold"
                    >
                      <option value="fixed_per_gram">Per Gram (₹/g)</option>
                      <option value="percentage">Per Gram Amount Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                </div>

                {/* Other Charges Name & Other Charges Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="form-otherChargesName" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                      Other Charges Name
                    </label>
                    <input
                      type="text"
                      id="form-otherChargesName"
                      name="otherChargesName"
                      value={formData.otherChargesName}
                      onChange={handleInputChange}
                      placeholder="e.g. Hallmarking & Certification"
                      className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="form-otherChargesAmount" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                      Other Charges Amount (₹)
                    </label>
                    <input
                      type="number"
                      id="form-otherChargesAmount"
                      name="otherChargesAmount"
                      value={formData.otherChargesAmount}
                      onChange={handleInputChange}
                      placeholder="e.g. 1500"
                      className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Hallmark Charge */}
                <div className="space-y-1.5">
                  <label htmlFor="form-hallmarkCharge" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                    Hallmark Charge (₹)
                  </label>
                  <input
                    type="number"
                    id="form-hallmarkCharge"
                    name="hallmarkCharge"
                    value={formData.hallmarkCharge}
                    onChange={handleInputChange}
                    placeholder="e.g. 45"
                    className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white font-mono text-xs"
                  />
                </div>

                {/* GST Percentage */}
                <div className="space-y-1.5">
                  <label htmlFor="form-gstPercent" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                    GST (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="form-gstPercent"
                    name="gstPercent"
                    value={formData.gstPercent}
                    onChange={handleInputChange}
                    placeholder="e.g. 3.00"
                    className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white font-mono text-xs"
                  />
                </div>

                {/* Optional MRP */}
                <div className="space-y-1.5">
                  <label htmlFor="form-mrp" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                    Optional MRP / Original Price (₹)
                  </label>
                  <input
                    type="number"
                    id="form-mrp"
                    name="mrp"
                    value={formData.mrp || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. 48000"
                    className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white font-mono text-xs"
                  />
                  <p className="text-[10px] text-stone-500 font-sans leading-tight">
                    If set, the selling price will show with this original MRP slashed out.
                  </p>
                </div>

                {/* Live Calculated Price Preview */}
                {(() => {
                  const weight = Number(formData.weight || 0);
                  const priceInfo = calculateProductPrice({
                    metalRef: formData.metalRef,
                    weight: weight,
                    makingCharge: Number(formData.makingCharge || 0),
                    makingChargeType: formData.makingChargeType,
                    wastagePercent: Number(formData.wastagePercent || 0),
                    otherChargesName: formData.otherChargesName,
                    otherChargesAmount: Number(formData.otherChargesAmount || 0),
                    hallmarkCharge: Number(formData.hallmarkCharge || 0),
                    gstPercent: Number(formData.gstPercent !== undefined ? formData.gstPercent : 3)
                  }, metalPrices);

                  return (
                    <div className="p-4 bg-[#fbf5ee] border border-amber-200/80 rounded-xl space-y-2 shadow-2xs">
                      <div className="flex justify-between items-center text-[10px] text-stone-600 uppercase font-bold tracking-wider">
                        <span>Live Calculated Price</span>
                        <span className="text-amber-700 animate-pulse font-bold">● LIVE PREVIEW</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-2xl font-mono font-bold text-amber-700">
                          ₹{priceInfo.finalPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-stone-500 font-sans italic">All parameters applied</span>
                      </div>
                      
                      {priceInfo.finalPrice > 0 && (
                        <div className="text-[10px] text-stone-600 space-y-1 font-mono pt-2 border-t border-amber-200/60">
                          <div className="flex justify-between">
                            <span>Base Metal Value:</span>
                            <span>₹{priceInfo.rawMetalPrice.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Making Charges:</span>
                            <span>₹{priceInfo.makingChargeValue.toLocaleString('en-IN')}</span>
                          </div>
                          {Number(formData.otherChargesAmount || 0) > 0 && (
                            <div className="flex justify-between">
                              <span>{formData.otherChargesName || 'Other Charges'}:</span>
                              <span>₹{Number(formData.otherChargesAmount).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {Number(formData.hallmarkCharge || 0) > 0 && (
                            <div className="flex justify-between">
                              <span>Hallmark Charge:</span>
                              <span>₹{Number(formData.hallmarkCharge).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {Number(priceInfo.gstValue || 0) > 0 && (
                            <div className="flex justify-between font-semibold text-stone-700">
                              <span>GST ({priceInfo.gstPercent}%):</span>
                              <span>₹{priceInfo.gstValue?.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Price Visibility */}
                <div className="space-y-1.5">
                  <label htmlFor="form-priceVisibility" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                    Store Price Visibility
                  </label>
                  <select
                    id="form-priceVisibility"
                    name="priceVisibility"
                    value={formData.priceVisibility}
                    onChange={handleInputChange}
                    className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white cursor-pointer font-sans text-xs"
                  >
                    <option value="on_enquiry">Ask for Price (WhatsApp lead)</option>
                    <option value="visible">Show price on website</option>
                    <option value="hidden">Hide price completely</option>
                  </select>
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <label htmlFor="form-tags" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                    Product Search Tags
                  </label>
                  <input
                    type="text"
                    id="form-tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="e.g., kundan, antique, bridal"
                    className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white text-xs"
                  />
                  <span className="text-[9px] text-stone-500">Comma separated keywords for internal search engines.</span>
                </div>
              </div>

              {/* Block G: Showroom Stores Sync */}
              <div className="bg-white border border-stone-200/80 rounded-xl p-6 space-y-4 shadow-xs">
                <h3 className="font-serif font-bold text-stone-900 text-sm border-b border-stone-100 pb-3 flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-600" />
                  <span>Available Showrooms</span>
                </h3>

                <div className="space-y-2">
                  {stores.map(st => {
                    const isChecked = formData.availableStores.includes(st.id);
                    return (
                      <label 
                        key={st.id} 
                        className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all cursor-pointer ${
                          isChecked 
                            ? 'bg-amber-50/60 border-amber-300 text-stone-900' 
                            : 'bg-[#f8f7f4] border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleStoreToggle(st.id)}
                          className="mt-0.5 rounded text-amber-600 focus:ring-amber-500/30 border-stone-300 h-3.5 w-3.5 cursor-pointer"
                        />
                        <div>
                          <span className="block font-bold text-[11px] text-stone-900">{st.name}</span>
                          <span className="block text-[9px] text-stone-500 mt-0.5 truncate max-w-[180px]">{st.address}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Block H: Publishing Toggles */}
              <div className="bg-white border border-stone-200/80 rounded-xl p-6 space-y-4 shadow-xs">
                <h3 className="font-serif font-bold text-stone-900 text-sm border-b border-stone-100 pb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-amber-600" />
                  <span>Publishing Controls</span>
                </h3>

                <div className="space-y-4">
                  {/* Status selection */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-status" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                      Moderation Status
                    </label>
                    <select
                      id="form-status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white cursor-pointer font-bold uppercase tracking-wider text-xs"
                    >
                      <option value="draft">Draft (Private Archive)</option>
                      <option value="published">Published (Live Catalogue)</option>
                    </select>
                  </div>

                  {/* Featured Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f7f4] border border-stone-200/80">
                    <div>
                      <span className="block font-bold text-stone-800 text-xs">Featured Masterpiece</span>
                      <span className="block text-[9px] text-stone-500 mt-0.5">Showcase prominently on home carousel.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={formData.featured}
                        onChange={(e) => handleCheckboxChange('featured', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-stone-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-200 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  {/* New Arrival Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f7f4] border border-stone-200/80">
                    <div>
                      <span className="block font-bold text-stone-800 text-xs">New Arrival Banner</span>
                      <span className="block text-[9px] text-stone-500 mt-0.5">Mark item with dynamic visual ribbons.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={formData.newArrival}
                        onChange={(e) => handleCheckboxChange('newArrival', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-stone-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-200 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Block I: Custom Badge & Star Rating Settings */}
              <div className="bg-white border border-stone-200/80 rounded-xl p-6 space-y-4 shadow-xs">
                <h3 className="font-serif font-bold text-stone-900 text-sm border-b border-stone-100 pb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Custom Badge & Star Rating</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Badge Label */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-badgeLabel" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                      Badge Label Text
                    </label>
                    <input
                      type="text"
                      id="form-badgeLabel"
                      name="badgeLabel"
                      value={formData.badgeLabel}
                      onChange={handleInputChange}
                      placeholder="e.g., BEST SELLER"
                      className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white text-xs"
                    />
                    <span className="text-[9px] text-stone-500 block">Leave blank to hide corner badge completely.</span>
                  </div>

                  {/* Badge Color */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-badgeColor" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                      Badge Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id="form-badgeColor-picker"
                        value={formData.badgeColor}
                        onChange={(e) => setFormData(prev => ({ ...prev, badgeColor: e.target.value }))}
                        className="bg-[#f8f7f4] border border-stone-200 w-11 h-11 p-1 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        id="form-badgeColor"
                        name="badgeColor"
                        value={formData.badgeColor}
                        onChange={handleInputChange}
                        className="flex-1 bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Star Rating */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-rating" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                      Star Rating (0 to 5)
                    </label>
                    <input
                      type="number"
                      id="form-rating"
                      name="rating"
                      value={formData.rating}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      max="5"
                      placeholder="e.g., 4.5"
                      className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white text-xs"
                    />
                    <span className="text-[9px] text-stone-500 block">Enter 0 or leave empty to hide star rating row.</span>
                  </div>

                  {/* Review Count */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-reviewCount" className="font-bold text-stone-600 uppercase tracking-wider text-[10px] block">
                      Review Count
                    </label>
                    <input
                      type="number"
                      id="form-reviewCount"
                      name="reviewCount"
                      value={formData.reviewCount}
                      onChange={handleInputChange}
                      step="1"
                      min="0"
                      placeholder="e.g., 256"
                      className="w-full bg-[#f8f7f4] border border-stone-200 text-stone-900 p-3 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white text-xs"
                    />
                    <span className="text-[9px] text-stone-500 block">Displayed in parentheses next to stars.</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Fixed Action Row */}
          <div className="flex justify-end gap-3 bg-white p-4 border border-stone-200/80 rounded-xl shadow-xs">
            <button
              type="button"
              onClick={() => setView('list')}
              className="px-5 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold uppercase tracking-wider text-[10px] rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-200 text-white font-bold uppercase tracking-wider text-[10px] px-6 py-2.5 rounded-lg cursor-pointer transition-colors shadow-xs"
              id="product-form-save-btn"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
