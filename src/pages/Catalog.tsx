/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useLocation, Link } from 'react-router-dom';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  ChevronDown, 
  Grid3X3, 
  Sparkles, 
  Scale, 
  Check, 
  Trash2,
  AlertCircle,
  Clock,
  MapPin,
  ArrowUpDown,
  Database
} from 'lucide-react';
import { ProductGrid } from '../components/ShowroomComponents';
import { mockProducts, mockCollections } from '../data/mockData';
import { mockWebsiteSettings } from '../data/mockSettings';
import { db, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { calculateProductPrice } from '../utils/calculateProductPrice';

// Unique design categories
const PRODUCT_CATEGORIES = [
  "Necklaces",
  "Earrings",
  "Rings",
  "Bangles",
  "Bridal Accessories",
  "Chokers",
  "Pendants"
];

// Purity standards
const PURITY_STANDARDS = [
  "22K Gold (916)",
  "18K Gold",
  "925 Silver"
];

// Metal types
const METAL_TYPES = [
  "Gold",
  "Diamond",
  "Silver"
];

// Weight filters helper
const WEIGHT_RANGES = [
  { id: "all", label: "All Weights" },
  { id: "light", label: "Under 10g", max: 10 },
  { id: "medium", label: "10g - 30g", min: 10, max: 30 },
  { id: "heavy", label: "30g - 50g", min: 30, max: 50 },
  { id: "sovereign", label: "Above 50g", min: 50 }
];

export function Catalog(): React.JSX.Element {
  // Read params for SEO friendly sub-paths or query params
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Unified Products State
  const [products, setProducts] = useState<any[]>([]);
  const [collectionsList, setCollectionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fallbackActive, setFallbackActive] = useState(!isFirebaseConfigured);

  // Filter Drawer States
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Filter States
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [selectedMetal, setSelectedMetal] = useState<string>('all');
  const [selectedPurity, setSelectedPurity] = useState<string>('all');
  const [selectedWeightRange, setSelectedWeightRange] = useState<string>('all');
  
  // Boolean filters
  const [filterFeatured, setFilterFeatured] = useState<boolean>(false);
  const [filterNewArrival, setFilterNewArrival] = useState<boolean>(false);

  // Sorting
  const [sortBy, setSortBy] = useState<string>('featured'); // 'featured', 'weight-asc', 'weight-desc', 'name-asc'

  // Dynamic search syncer
  useEffect(() => {
    const searchVal = searchParams.get('search');
    if (searchVal !== null) {
      setSearchText(searchVal);
    }
    
    const focusVal = searchParams.get('focus');
    if (focusVal === 'collections') {
      // Auto scroll to collection focus or pre-set if needed
    }
  }, [searchParams]);

  // Read route parameters (SEO-friendly slugs e.g. /collections/heritage or /category/rings)
  useEffect(() => {
    if (location.pathname.startsWith('/collections/') && slug) {
      // Find the corresponding collection name from slug
      const foundCol = mockCollections.find(c => c.slug === slug);
      if (foundCol) {
        setSelectedCollection(foundCol.name);
      } else {
        // Try mapping directly or capitalized
        const capitalized = slug.charAt(0).toUpperCase() + slug.slice(1);
        setSelectedCollection(capitalized);
      }
    } else if (location.pathname.startsWith('/category/') && slug) {
      // Find corresponding category
      const matchedCat = PRODUCT_CATEGORIES.find(c => c.toLowerCase() === slug.toLowerCase() || c.toLowerCase().includes(slug.toLowerCase()));
      if (matchedCat) {
        setSelectedCategory(matchedCat);
      } else {
        const capitalized = slug.charAt(0).toUpperCase() + slug.slice(1);
        setSelectedCategory(capitalized);
      }
    }
  }, [location.pathname, slug]);

  // Firestore Fetching Core
  useEffect(() => {
    const fetchCatalogData = async () => {
      if (!isFirebaseConfigured) {
        setProducts(mockProducts);
        setCollectionsList(mockCollections);
        setLoading(false);
        setFallbackActive(true);
        return;
      }

      try {
        setLoading(true);

        // 1a. Fetch Metal Prices for dynamic on-the-fly price calculations
        const pricesRef = collection(db, 'metalPrices');
        const pricesSnap = await getDocs(pricesRef);
        const metalPrices = pricesSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            metalName: data.metalName || data.metal || '',
            pricePerGram: Number(data.price || data.pricePerGram || data.ratePerGram || 0),
            status: data.status || 'active'
          };
        });

        // 1b. Fetch Published Products
        const productsRef = collection(db, 'products');
        const productsQuery = query(productsRef, where('status', '==', 'published'));
        const productsSnapshot = await getDocs(productsQuery);

        const fetchedProducts = productsSnapshot.docs.map(doc => {
          const data = doc.data();
          const weight = Number(data.weight || data.grossWeight || 0);
          
          // Calculate dynamic price
          const priceInfo = calculateProductPrice({
            metalRef: data.metalRef || '',
            weight: weight,
            makingCharge: Number(data.makingCharge || 0),
            makingChargeType: data.makingChargeType || 'fixed',
            wastagePercent: Number(data.wastagePercent || 0)
          }, metalPrices);

          return {
            id: doc.id,
            name: data.name || data.productName || '',
            sku: data.sku || data.productCode || '',
            description: data.description || '',
            category: data.category || '',
            collection: data.collection || '',
            metalType: priceInfo.metalName || data.metalType || data.purity || '',
            approxWeight: weight > 0 ? `${weight}g` : (data.approxWeight || ''),
            imageUrl: data.imageUrl || data.thumbnailUrl || (data.images && data.images[0]) || '',
            featured: !!data.featured,
            newArrival: !!data.newArrival,
            tags: data.tags || [],
            price: priceInfo.finalPrice > 0 ? priceInfo.finalPrice : Number(data.price || 0),
            mrp: data.mrp !== undefined && data.mrp !== null ? Number(data.mrp) : null,
            priceVisibility: data.priceVisibility !== undefined ? data.priceVisibility : true,
            badgeLabel: data.badgeLabel || '',
            badgeColor: data.badgeColor || '#927230',
            rating: data.rating !== undefined && data.rating !== null ? Number(data.rating) : null,
            reviewCount: data.reviewCount !== undefined && data.reviewCount !== null ? Number(data.reviewCount) : null
          };
        });

        // 2. Fetch Active Collections
        const collectionsRef = collection(db, 'collections');
        const collectionsSnapshot = await getDocs(collectionsRef);
        const fetchedCollections = collectionsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            slug: data.slug || '',
            status: data.status || 'active'
          };
        }).filter(c => c.status === 'active');

        // Update states
        setProducts(fetchedProducts.length > 0 ? fetchedProducts : mockProducts);
        setCollectionsList(fetchedCollections.length > 0 ? fetchedCollections : mockCollections);
        setLoading(false);
      } catch (err) {
        console.error('Firestore Catalog Read Failed. Reverting to Offline Cache:', err);
        setProducts(mockProducts);
        setCollectionsList(mockCollections);
        setLoading(false);
        setFallbackActive(true);
      }
    };

    fetchCatalogData();
  }, []);

  // Sync Search Query to URL
  const handleSearchChange = (val: string) => {
    setSearchText(val);
    if (val.trim()) {
      setSearchParams({ search: val.trim() });
    } else {
      searchParams.delete('search');
      setSearchParams(searchParams);
    }
  };

  // Helper: Extract Numeric Weight from String (e.g. "48.10g" -> 48.1)
  const parseNumericWeight = (weightStr: string): number => {
    if (!weightStr) return 0;
    const cleanStr = weightStr.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  // High-Performance Dynamic Search & Filter Logic (useMemo)
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // 1. Sitewide Full-Text Search
      if (searchText.trim()) {
        const queryClean = searchText.toLowerCase().trim();
        const tags = Array.isArray(product.tags) ? product.tags.join(' ').toLowerCase() : '';
        const matchesName = product.name.toLowerCase().includes(queryClean);
        const matchesSku = product.sku.toLowerCase().includes(queryClean);
        const matchesCategory = product.category.toLowerCase().includes(queryClean);
        const matchesCollection = product.collection.toLowerCase().includes(queryClean);
        const matchesMetal = product.metalType.toLowerCase().includes(queryClean);
        const matchesTags = tags.includes(queryClean);
        const matchesDesc = product.description.toLowerCase().includes(queryClean);

        if (!matchesName && !matchesSku && !matchesCategory && !matchesCollection && !matchesMetal && !matchesTags && !matchesDesc) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'all') {
        if (product.category !== selectedCategory) return false;
      }

      // 3. Collection Filter
      if (selectedCollection !== 'all') {
        if (product.collection !== selectedCollection) return false;
      }

      // 4. Metal Filter
      if (selectedMetal !== 'all') {
        const match = product.metalType.toLowerCase().includes(selectedMetal.toLowerCase()) || 
                      product.category.toLowerCase().includes(selectedMetal.toLowerCase());
        if (!match) return false;
      }

      // 5. Purity Filter
      if (selectedPurity !== 'all') {
        // e.g. "22K Gold (916)"
        const purityClean = selectedPurity.replace(/\s+/g, '').toLowerCase();
        const metalClean = product.metalType.replace(/\s+/g, '').toLowerCase();
        if (!metalClean.includes(purityClean) && !metalClean.includes(purityClean.substring(0, 3))) return false;
      }

      // 6. Weight Range Filter
      if (selectedWeightRange !== 'all') {
        const numWeight = parseNumericWeight(product.approxWeight);
        const rangeObj = WEIGHT_RANGES.find(r => r.id === selectedWeightRange);
        if (rangeObj) {
          if (rangeObj.min !== undefined && numWeight < rangeObj.min) return false;
          if (rangeObj.max !== undefined && numWeight > rangeObj.max) return false;
        }
      }

      // 7. Featured & New Arrivals Switches
      if (filterFeatured && !product.featured && !product.isPopular) return false;
      if (filterNewArrival && !product.newArrival) return false;

      return true;
    })
    // 8. Sorting application
    .sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'weight-asc') {
        return parseNumericWeight(a.approxWeight) - parseNumericWeight(b.approxWeight);
      }
      if (sortBy === 'weight-desc') {
        return parseNumericWeight(b.approxWeight) - parseNumericWeight(a.approxWeight);
      }
      // 'featured' sorting: puts featured items first
      const aFeatured = a.featured || a.isPopular ? 1 : 0;
      const bFeatured = b.featured || b.isPopular ? 1 : 0;
      return bFeatured - aFeatured;
    });
  }, [
    products, 
    searchText, 
    selectedCategory, 
    selectedCollection, 
    selectedMetal, 
    selectedPurity, 
    selectedWeightRange, 
    filterFeatured, 
    filterNewArrival, 
    sortBy
  ]);

  // Reset all filters helper
  const handleClearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedCollection('all');
    setSelectedMetal('all');
    setSelectedPurity('all');
    setSelectedWeightRange('all');
    setFilterFeatured(false);
    setFilterNewArrival(false);
    setSearchText('');
    setSearchParams({});
    // Remove slugs on clear
    if (slug) {
      // Re-navigate to clean catalog
    }
  };

  // Helper: count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedCollection !== 'all') count++;
    if (selectedMetal !== 'all') count++;
    if (selectedPurity !== 'all') count++;
    if (selectedWeightRange !== 'all') count++;
    if (filterFeatured) count++;
    if (filterNewArrival) count++;
    if (searchText.trim()) count++;
    return count;
  }, [selectedCategory, selectedCollection, selectedMetal, selectedPurity, selectedWeightRange, filterFeatured, filterNewArrival, searchText]);

  return (
    <div className="bg-stone-50 min-h-screen lg:h-[calc(100vh-92px)] lg:overflow-hidden flex flex-col" id="catalogue-browser-root">
      
      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
          -ms-overflow-style: none !important;  /* IE and Edge */
          scrollbar-width: none !important;  /* Firefox */
        }
      `}</style>
      
      {/* Dev preview header */}
      {fallbackActive && !loading && (
        <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-4 shrink-0" id="fallback-notification-bar">
          <div className="w-full mx-auto flex items-center justify-between gap-3 text-xs text-amber-800">
            <span className="flex items-center gap-2 font-medium">
              <Database className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Catalogue Live Sync</strong>: Currently displaying cached designs. Connect private database to reflect live CMS.
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Main Filter & Grid Container */}
      <div className="flex-1 min-h-0 flex flex-col" id="main-catalog-container">
        
        {/* Dynamic Search & Top Action Row (Fluid/Full-Width with proper padding) */}
        <div className="bg-white border-b border-stone-200 px-4 sm:px-8 py-4 flex-none" id="top-search-row-container">
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4" id="top-search-row">
            {/* Real-time search */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input 
                type="text"
                placeholder="Search product code, name, category or purity..."
                value={searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 focus:border-gold-500 rounded text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden transition-colors"
              />
              {searchText && (
                <button 
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between w-full md:w-auto gap-4 shrink-0">
              {/* Active filters summary */}
              <button 
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 h-9 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-brand-red-600 text-stone-100 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Sorting */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider hidden sm:inline">Sort By:</span>
                <div className="relative">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 h-9 bg-white border border-stone-200 text-xs text-stone-700 font-medium rounded focus:outline-hidden focus:border-gold-500 cursor-pointer"
                  >
                    <option value="featured">Featured First</option>
                    <option value="weight-asc">Weight: Light to Heavy</option>
                    <option value="weight-desc">Weight: Heavy to Light</option>
                    <option value="name-asc">Alphabetical (A-Z)</option>
                  </select>
                  <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters Pill Row */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3" id="active-filters-chips">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mr-1">Active Filters:</span>
              
              {searchText && (
                <span className="inline-flex items-center gap-1 bg-stone-200 text-stone-700 text-[10px] font-semibold px-2.5 py-1 rounded">
                  <span>Search: "{searchText}"</span>
                  <button onClick={() => handleSearchChange('')}><X className="w-3 h-3 hover:text-brand-red-600" /></button>
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-gold-500/10 text-gold-800 border border-gold-500/25 text-[10px] font-semibold px-2.5 py-1 rounded">
                  <span>Cat: {selectedCategory}</span>
                  <button onClick={() => setSelectedCategory('all')}><X className="w-3 h-3 hover:text-brand-red-600" /></button>
                </span>
              )}
              {selectedCollection !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-gold-500/10 text-gold-800 border border-gold-500/25 text-[10px] font-semibold px-2.5 py-1 rounded">
                  <span>Col: {selectedCollection}</span>
                  <button onClick={() => setSelectedCollection('all')}><X className="w-3 h-3 hover:text-brand-red-600" /></button>
                </span>
              )}
              {selectedMetal !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-gold-500/10 text-gold-800 border border-gold-500/25 text-[10px] font-semibold px-2.5 py-1 rounded">
                  <span>Metal: {selectedMetal}</span>
                  <button onClick={() => setSelectedMetal('all')}><X className="w-3 h-3 hover:text-brand-red-600" /></button>
                </span>
              )}
              {selectedPurity !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-gold-500/10 text-gold-800 border border-gold-500/25 text-[10px] font-semibold px-2.5 py-1 rounded">
                  <span>Purity: {selectedPurity}</span>
                  <button onClick={() => setSelectedPurity('all')}><X className="w-3 h-3 hover:text-brand-red-600" /></button>
                </span>
              )}
              {selectedWeightRange !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-gold-500/10 text-gold-800 border border-gold-500/25 text-[10px] font-semibold px-2.5 py-1 rounded">
                  <span>Weight: {WEIGHT_RANGES.find(r => r.id === selectedWeightRange)?.label}</span>
                  <button onClick={() => setSelectedWeightRange('all')}><X className="w-3 h-3 hover:text-brand-red-600" /></button>
                </span>
              )}
              {filterFeatured && (
                <span className="inline-flex items-center gap-1 bg-gold-500/10 text-gold-800 border border-gold-500/25 text-[10px] font-semibold px-2.5 py-1 rounded">
                  <span>Featured Only</span>
                  <button onClick={() => setFilterFeatured(false)}><X className="w-3 h-3 hover:text-brand-red-600" /></button>
                </span>
              )}
              {filterNewArrival && (
                <span className="inline-flex items-center gap-1 bg-gold-500/10 text-gold-800 border border-gold-500/25 text-[10px] font-semibold px-2.5 py-1 rounded">
                  <span>New Arrivals</span>
                  <button onClick={() => setFilterNewArrival(false)}><X className="w-3 h-3 hover:text-brand-red-600" /></button>
                </span>
              )}

              <button 
                onClick={handleClearAllFilters}
                className="inline-flex items-center gap-1 text-[10px] text-brand-red-600 hover:text-brand-red-700 font-bold uppercase tracking-wider ml-2"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>

        {/* Fluid Outer Dual-Scroll Panel Layout */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-8 px-4 sm:px-8 py-6 overflow-y-auto lg:overflow-hidden" id="catalog-dual-pane-grid">
          
          {/* --- LEFT: DESKTOP FILTERS SIDEBAR (Fixed/sticky on the left side, narrower column, independent scroll, clean style) --- */}
          <aside className="hidden lg:flex lg:col-span-1 bg-transparent py-2 h-full min-h-0 flex-col overflow-y-auto space-y-8 no-scrollbar pr-2" id="desktop-filters-sidebar">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 shrink-0">
              <h3 className="font-serif font-bold text-stone-900 text-sm tracking-wide">Refine Selection</h3>
              {activeFiltersCount > 0 && (
                <button 
                  onClick={handleClearAllFilters} 
                  className="text-[10px] text-stone-400 hover:text-brand-red-600 font-bold uppercase tracking-widest"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Category Filter Group */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-900 tracking-wider font-sans uppercase">Category</h4>
              <div className="space-y-2 flex flex-col items-start">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`text-left text-xs py-0.5 transition-colors flex items-center gap-2 font-sans ${selectedCategory === 'all' ? 'text-gold-700 font-bold' : 'text-stone-500 hover:text-stone-900'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${selectedCategory === 'all' ? 'bg-gold-600 scale-100' : 'bg-transparent scale-0'}`} />
                  <span>All Categories</span>
                </button>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-left text-xs py-0.5 transition-colors flex items-center gap-2 font-sans ${selectedCategory === cat ? 'text-gold-700 font-bold' : 'text-stone-500 hover:text-stone-900'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${selectedCategory === cat ? 'bg-gold-600 scale-100' : 'bg-transparent scale-0'}`} />
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Collection Filter Group */}
            <div className="space-y-3 pt-4 border-t border-stone-200/60">
              <h4 className="text-xs font-bold text-stone-900 tracking-wider font-sans uppercase">Showroom Collection</h4>
              <div className="space-y-2 flex flex-col items-start">
                <button
                  onClick={() => setSelectedCollection('all')}
                  className={`text-left text-xs py-0.5 transition-colors flex items-center gap-2 font-sans ${selectedCollection === 'all' ? 'text-gold-700 font-bold' : 'text-stone-500 hover:text-stone-900'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${selectedCollection === 'all' ? 'bg-gold-600 scale-100' : 'bg-transparent scale-0'}`} />
                  <span>All Collections</span>
                </button>
                {collectionsList.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => setSelectedCollection(col.name)}
                    className={`text-left text-xs py-0.5 transition-colors flex items-center gap-2 font-sans ${selectedCollection === col.name ? 'text-gold-700 font-bold' : 'text-stone-500 hover:text-stone-900'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${selectedCollection === col.name ? 'bg-gold-600 scale-100' : 'bg-transparent scale-0'}`} />
                    <span>{col.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Metal Type Group */}
            <div className="space-y-3 pt-4 border-t border-stone-200/60">
              <h4 className="text-xs font-bold text-stone-900 tracking-wider font-sans uppercase">Metal Type</h4>
              <div className="space-y-2 flex flex-col items-start">
                <button
                  onClick={() => setSelectedMetal('all')}
                  className={`text-left text-xs py-0.5 transition-colors flex items-center gap-2 font-sans ${selectedMetal === 'all' ? 'text-gold-700 font-bold' : 'text-stone-500 hover:text-stone-900'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${selectedMetal === 'all' ? 'bg-gold-600 scale-100' : 'bg-transparent scale-0'}`} />
                  <span>All Metals</span>
                </button>
                {METAL_TYPES.map((metal) => (
                  <button
                    key={metal}
                    onClick={() => setSelectedMetal(metal)}
                    className={`text-left text-xs py-0.5 transition-colors flex items-center gap-2 font-sans ${selectedMetal === metal ? 'text-gold-700 font-bold' : 'text-stone-500 hover:text-stone-900'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${selectedMetal === metal ? 'bg-gold-600 scale-100' : 'bg-transparent scale-0'}`} />
                    <span>{metal}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gold/Silver Purity Standards (Pill Presentation per Image 2) */}
            <div className="space-y-3 pt-4 border-t border-stone-200/60">
              <h4 className="text-xs font-bold text-stone-900 tracking-wider font-sans uppercase">Purity Standard</h4>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => setSelectedPurity('all')}
                  className={`text-[11px] px-3 py-1.5 rounded-full transition-all border font-medium ${selectedPurity === 'all' ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-100 text-stone-600 border-transparent hover:bg-stone-200'}`}
                >
                  All Purities
                </button>
                {PURITY_STANDARDS.map((purity) => (
                  <button
                    key={purity}
                    onClick={() => setSelectedPurity(purity)}
                    className={`text-[11px] px-3 py-1.5 rounded-full transition-all border font-medium ${selectedPurity === purity ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-100 text-stone-600 border-transparent hover:bg-stone-200'}`}
                  >
                    {purity}
                  </button>
                ))}
              </div>
            </div>

            {/* Weight ranges segment (Pill Presentation per Image 2) */}
            <div className="space-y-3 pt-4 border-t border-stone-200/60">
              <h4 className="text-xs font-bold text-stone-900 tracking-wider font-sans uppercase">Weight Profiling</h4>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => setSelectedWeightRange('all')}
                  className={`text-[11px] px-3 py-1.5 rounded-full transition-all border font-medium ${selectedWeightRange === 'all' ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-100 text-stone-600 border-transparent hover:bg-stone-200'}`}
                >
                  All Weights
                </button>
                {WEIGHT_RANGES.filter(r => r.id !== 'all').map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setSelectedWeightRange(range.id)}
                    className={`text-[11px] px-3 py-1.5 rounded-full transition-all border font-medium ${selectedWeightRange === range.id ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-100 text-stone-600 border-transparent hover:bg-stone-200'}`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured & New Arrival Badging (Pill Presentation per Image 2) */}
            <div className="space-y-3 pt-4 border-t border-stone-200/60">
              <h4 className="text-xs font-bold text-stone-900 tracking-wider font-sans uppercase">Showroom Badging</h4>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => setFilterFeatured(!filterFeatured)}
                  className={`text-[11px] px-3 py-1.5 rounded-full transition-all border font-medium ${filterFeatured ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-100 text-stone-600 border-transparent hover:bg-stone-200'}`}
                >
                  Featured Vault
                </button>
                <button
                  onClick={() => setFilterNewArrival(!filterNewArrival)}
                  className={`text-[11px] px-3 py-1.5 rounded-full transition-all border font-medium ${filterNewArrival ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-100 text-stone-600 border-transparent hover:bg-stone-200'}`}
                >
                  New Arrivals
                </button>
              </div>
            </div>
          </aside>

          {/* --- RIGHT: PRODUCT GRID (Larger portion of horizontal screen, independent scroll, visually hidden scrollbar) --- */}
          <main className="lg:col-span-3 h-full flex flex-col min-h-0 lg:overflow-y-auto pr-0 lg:pr-4 no-scrollbar" id="catalog-results-grid">
            
            {/* Search results metrics */}
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium mb-4 shrink-0">
              <p>Showing {filteredProducts.length} unique masterpieces</p>
              {activeFiltersCount > 0 && (
                <p className="font-sans italic">Filtered display</p>
              )}
            </div>

            {/* Main states */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="catalog-loading-skeleton">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="h-96 bg-stone-200 animate-pulse rounded-2xl border border-stone-200"></div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white border border-stone-200 rounded-2xl p-8" id="catalog-empty-state">
                <AlertCircle className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                <h3 className="font-serif font-bold text-stone-900 text-lg">No Handcrafted Jewellery Found</h3>
                <p className="text-stone-500 text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
                  We could not find matching physical gold or solitaire diamond products for your active query. Try loosening search terms or clearing active refine toggles.
                </p>
                <button 
                  onClick={handleClearAllFilters}
                  className="mt-5 h-9 px-6 bg-brand-red-600 hover:bg-brand-red-700 text-stone-100 text-xs font-semibold uppercase tracking-widest rounded transition-all duration-300 cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <ProductGrid 
                products={filteredProducts} 
                whatsappNumber={mockWebsiteSettings.whatsappNumber}
                gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 sm:gap-8"
              />
            )}
          </main>

        </div>
      </div>

      {/* --- MOBILE FILTERS DRAWER / OVERLAY --- */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 bg-stone-950/60 z-50 flex justify-end animate-fade-in" id="mobile-filter-overlay">
          <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl animate-slide-left" id="mobile-drawer-body">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <span className="font-serif font-bold text-stone-900 text-sm">Refine Showroom Assets</span>
              <button 
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer scrollable content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Category */}
              <div className="space-y-2">
                <h4 className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Category</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`text-xs py-2 px-3 rounded border text-center transition-all ${selectedCategory === 'all' ? 'border-gold-500 bg-gold-500/10 text-gold-800 font-bold' : 'border-stone-200 text-stone-600'}`}
                  >
                    All Categories
                  </button>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs py-2 px-3 rounded border text-center transition-all truncate ${selectedCategory === cat ? 'border-gold-500 bg-gold-500/10 text-gold-800 font-bold' : 'border-stone-200 text-stone-600'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Collections */}
              <div className="space-y-2">
                <h4 className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Collection</h4>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => setSelectedCollection('all')}
                    className={`text-xs py-2 px-3 rounded border text-left transition-all ${selectedCollection === 'all' ? 'border-gold-500 bg-gold-500/10 text-gold-800 font-bold' : 'border-stone-200 text-stone-600'}`}
                  >
                    All Collections
                  </button>
                  {collectionsList.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => setSelectedCollection(col.name)}
                      className={`text-xs py-2 px-3 rounded border text-left transition-all truncate ${selectedCollection === col.name ? 'border-gold-500 bg-gold-500/10 text-gold-800 font-bold' : 'border-stone-200 text-stone-600'}`}
                    >
                      {col.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metal */}
              <div className="space-y-2">
                <h4 className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Metal</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedMetal('all')}
                    className={`text-xs py-2 rounded border text-center transition-all ${selectedMetal === 'all' ? 'border-gold-500 bg-gold-500/10 text-gold-800 font-bold' : 'border-stone-200 text-stone-600'}`}
                  >
                    All
                  </button>
                  {METAL_TYPES.map((metal) => (
                    <button
                      key={metal}
                      onClick={() => setSelectedMetal(metal)}
                      className={`text-xs py-2 rounded border text-center transition-all ${selectedMetal === metal ? 'border-gold-500 bg-gold-500/10 text-gold-800 font-bold' : 'border-stone-200 text-stone-600'}`}
                    >
                      {metal}
                    </button>
                  ))}
                </div>
              </div>

              {/* Purities */}
              <div className="space-y-2">
                <h4 className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Purity Standard</h4>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setSelectedPurity('all')}
                    className={`w-full text-xs py-2 px-3 rounded border text-left transition-all ${selectedPurity === 'all' ? 'border-gold-500 bg-gold-500/10 text-gold-800 font-bold' : 'border-stone-200 text-stone-600'}`}
                  >
                    All Purities
                  </button>
                  {PURITY_STANDARDS.map((purity) => (
                    <button
                      key={purity}
                      onClick={() => setSelectedPurity(purity)}
                      className={`w-full text-xs py-2 px-3 rounded border text-left transition-all ${selectedPurity === purity ? 'border-gold-500 bg-gold-500/10 text-gold-800 font-bold' : 'border-stone-200 text-stone-600'}`}
                    >
                      {purity}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <h4 className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Weight Profile</h4>
                <div className="grid grid-cols-2 gap-2">
                  {WEIGHT_RANGES.map((range) => (
                    <button
                      key={range.id}
                      onClick={() => setSelectedWeightRange(range.id)}
                      className={`text-xs py-2 px-2 rounded border text-center transition-all ${selectedWeightRange === range.id ? 'border-gold-500 bg-gold-500/10 text-gold-800 font-bold' : 'border-stone-200 text-stone-600'}`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Badges */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Showroom badging</h4>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={filterFeatured}
                      onChange={(e) => setFilterFeatured(e.target.checked)}
                      className="w-4 h-4 accent-gold-600"
                    />
                    <span>Featured Vault Items</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={filterNewArrival}
                      onChange={(e) => setFilterNewArrival(e.target.checked)}
                      className="w-4 h-4 accent-gold-600"
                    />
                    <span>Newly Released Bench-work</span>
                  </label>
                </div>
              </div>

            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center gap-3">
              <button
                onClick={handleClearAllFilters}
                className="w-1/3 py-2.5 border border-stone-300 text-stone-700 text-xs font-semibold uppercase tracking-wider rounded"
              >
                Clear
              </button>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="w-2/3 py-2.5 bg-brand-red-600 hover:bg-brand-red-700 text-stone-100 text-xs font-semibold uppercase tracking-wider rounded"
              >
                Apply ({filteredProducts.length})
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
