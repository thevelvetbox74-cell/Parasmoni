import React, { useState, useEffect, useRef } from 'react';
import { Search, Link2, X, ChevronDown, FileText, Layers, ShoppingBag } from 'lucide-react';
import { db, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { mockProducts, mockCollections } from '../data/mockData';

export interface SmartLink {
  type: 'product' | 'page' | 'collection' | 'category' | 'custom';
  label: string;
  url: string;
  image?: string;
  code?: string;
}

interface SmartLinkPickerProps {
  value: string | { mode?: string; value?: string; url?: string; label?: string; type?: string } | null | undefined;
  onChange: (value: any) => void;
  placeholder?: string;
  className?: string;
}

export function SmartLinkPicker({
  value,
  onChange,
  placeholder = "Type # for products, @ for pages, / for collections/categories, or paste URL...",
  className = ""
}: SmartLinkPickerProps) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [trigger, setTrigger] = useState<'#' | '@' | '/' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  // Loaded database items
  const [products, setProducts] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load all search sources
  useEffect(() => {
    let active = true;
    async function fetchData() {
      setLoading(true);
      
      // 1. Fallbacks first
      const fallbackProducts = mockProducts || [];
      const fallbackCollections = mockCollections || [];
      const fallbackCategories = [
        { id: 'rings', name: 'Rings', slug: 'rings' },
        { id: 'necklaces', name: 'Necklaces', slug: 'necklaces' },
        { id: 'earrings', name: 'Earrings', slug: 'earrings' },
        { id: 'bangles', name: 'Bangles', slug: 'bangles' },
        { id: 'chains', name: 'Chains', slug: 'chains' }
      ];

      const defaultPages = [{ id: 'home', name: 'Home Page', slug: 'home' }];
      let fallbackPages = [...defaultPages];
      try {
        const cachedPages = localStorage.getItem('draft_custom_pages');
        if (cachedPages) {
          const parsed = JSON.parse(cachedPages);
          if (Array.isArray(parsed)) {
            fallbackPages = [...defaultPages, ...parsed];
          }
        }
      } catch (e) {
        console.error('Error loading fallback pages in SmartLinkPicker:', e);
      }

      if (!active) return;
      setProducts(fallbackProducts);
      setPages(fallbackPages);
      setCollections(fallbackCollections);
      setCategories(fallbackCategories);

      // 2. Fetch from Firebase if connected
      if (isFirebaseConfigured && db) {
        try {
          const prodSnap = await getDocs(collection(db, 'products'));
          if (active && !prodSnap.empty) {
            setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }

          const pageSnap = await getDocs(collection(db, 'pageSections'));
          if (active && !pageSnap.empty) {
            const fbPages = pageSnap.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.pageName || data.name || doc.id,
                slug: data.slug || doc.id
              };
            });
            // Ensure home is included
            const mergedPages = [...defaultPages];
            fbPages.forEach(p => {
              if (p.slug !== 'home' && !mergedPages.some(x => x.slug === p.slug)) {
                mergedPages.push(p);
              }
            });
            setPages(mergedPages);
          }

          const colSnap = await getDocs(collection(db, 'collections'));
          if (active && !colSnap.empty) {
            setCollections(colSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }

          const catSnap = await getDocs(collection(db, 'categories'));
          if (active && !catSnap.empty) {
            setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
        } catch (err) {
          console.warn('SmartLinkPicker failed fetching live Firestore collections, using fallbacks:', err);
        }
      }
      if (active) setLoading(false);
    }
    fetchData();
    return () => {
      active = false;
    };
  }, []);

  // Determine current active selection from value prop
  const getSelectedLink = (): SmartLink | null => {
    if (!value) return null;

    let url = '';
    let mode = 'custom';
    let label = '';
    let type: SmartLink['type'] = 'custom';

    // Parse legacy { mode, value } objects
    if (typeof value === 'object' && value !== null) {
      if ('url' in value && value.url) {
        url = value.url;
        label = value.label || value.url;
        type = (value.type as SmartLink['type']) || 'custom';
      } else {
        const legacyMode = value.mode || 'custom';
        const legacyVal = value.value || '';
        if (legacyMode === 'collection') {
          url = `/collections/${legacyVal}`;
          type = 'collection';
        } else if (legacyMode === 'category') {
          url = `/category/${legacyVal}`;
          type = 'category';
        } else if (legacyMode === 'page') {
          url = legacyVal === 'home' || legacyVal === '/' ? '/' : `/pages/${legacyVal}`;
          type = 'page';
        } else {
          url = legacyVal;
          type = 'custom';
        }
      }
    } else if (typeof value === 'string') {
      url = value;
    }

    if (!url) return null;

    // Resolve details using local collections to make a rich chip
    if (url === '/' || url === 'home') {
      return { type: 'page', label: 'Home Page', url: '/' };
    }

    // Is it a product?
    const prodMatch = url.match(/^\/products\/([^/]+)/);
    if (prodMatch) {
      const slug = prodMatch[1];
      const prod = products.find(p => p.slug === slug || p.id === slug);
      return {
        type: 'product',
        label: prod ? prod.name : slug.replace(/-/g, ' '),
        url,
        image: prod?.images?.[0] || prod?.imageUrl,
        code: prod?.productCode || prod?.code
      };
    }

    // Is it a collection?
    const colMatch = url.match(/^\/collections\/([^/]+)/);
    if (colMatch) {
      const slug = colMatch[1];
      const col = collections.find(c => c.slug === slug || c.id === slug);
      return {
        type: 'collection',
        label: col ? col.name : slug.replace(/-/g, ' '),
        url
      };
    }

    // Is it a category?
    const catMatch = url.match(/^\/category\/([^/]+)/);
    if (catMatch) {
      const slug = catMatch[1];
      const cat = categories.find(c => c.slug === slug || c.id === slug);
      return {
        type: 'category',
        label: cat ? cat.name : slug.replace(/-/g, ' '),
        url
      };
    }

    // Is it a custom page?
    const pageMatch = url.match(/^\/pages\/([^/]+)/);
    if (pageMatch) {
      const slug = pageMatch[1];
      const pg = pages.find(p => p.slug === slug);
      return {
        type: 'page',
        label: pg ? pg.name : slug.replace(/-/g, ' '),
        url
      };
    }

    // Fallback as Custom link
    return {
      type: 'custom',
      label: label || url,
      url
    };
  };

  const selectedLink = getSelectedLink();

  // Filter list of items based on active trigger character
  const getFilteredItems = () => {
    const query = searchQuery.toLowerCase().trim();

    if (trigger === '#') {
      // Products
      return products
        .filter(p => 
          (p.name || '').toLowerCase().includes(query) || 
          (p.productCode || p.code || '').toLowerCase().includes(query)
        )
        .map(p => ({
          type: 'product' as const,
          id: p.slug || p.id,
          name: p.name,
          subtitle: p.productCode || p.code || 'Product',
          image: p.images?.[0] || p.imageUrl,
          url: `/products/${p.slug || p.id}`
        }));
    }

    if (trigger === '@') {
      // Pages
      return pages
        .filter(p => (p.name || '').toLowerCase().includes(query) || (p.slug || '').toLowerCase().includes(query))
        .map(p => ({
          type: 'page' as const,
          id: p.slug,
          name: p.name,
          subtitle: p.slug === 'home' ? 'Main Site Entry' : `/pages/${p.slug}`,
          url: p.slug === 'home' ? '/' : `/pages/${p.slug}`
        }));
    }

    if (trigger === '/') {
      // Collections + Categories
      const filteredCols = collections
        .filter(c => (c.name || '').toLowerCase().includes(query))
        .map(c => ({
          type: 'collection' as const,
          id: c.slug || c.id,
          name: c.name,
          subtitle: 'Collection',
          url: `/collections/${c.slug || c.id}`
        }));

      const filteredCats = categories
        .filter(c => (c.name || '').toLowerCase().includes(query))
        .map(c => ({
          type: 'category' as const,
          id: c.slug || c.id,
          name: c.name,
          subtitle: 'Category',
          url: `/category/${c.slug || c.id}`
        }));

      return [...filteredCols, ...filteredCats];
    }

    return [];
  };

  const filteredItems = getFilteredItems();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update selection
  const handleSelect = (item: { name: string; url: string; type: SmartLink['type']; image?: string; code?: string }) => {
    const isObjectValue = typeof value === 'object' && value !== null;
    
    const outputLink = {
      type: item.type,
      label: item.name,
      url: item.url,
      image: item.image,
      code: item.code
    };

    if (isObjectValue) {
      // Return custom mode with full URL inside legacy value to keep it completely backwards compatible
      onChange({
        mode: 'custom',
        value: item.url,
        type: item.type,
        label: item.name,
        url: item.url
      });
    } else {
      onChange(item.url);
    }

    setInputValue('');
    setTrigger(null);
    setSearchQuery('');
    setShowDropdown(false);
  };

  // Raw custom URL submission
  const handleRawSubmit = (rawUrl: string) => {
    if (!rawUrl.trim()) return;
    const isObjectValue = typeof value === 'object' && value !== null;

    if (isObjectValue) {
      onChange({
        mode: 'custom',
        value: rawUrl.trim(),
        type: 'custom',
        label: rawUrl.trim(),
        url: rawUrl.trim()
      });
    } else {
      onChange(rawUrl.trim());
    }

    setInputValue('');
    setTrigger(null);
    setSearchQuery('');
    setShowDropdown(false);
  };

  // Keyboard Navigation & Interaction handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || filteredItems.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleRawSubmit(inputValue);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(filteredItems[activeIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowDropdown(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // Detect triggers
    const hashIdx = val.lastIndexOf('#');
    const atIdx = val.lastIndexOf('@');
    const slashIdx = val.lastIndexOf('/');

    // Find the latest trigger character
    const lastTriggerIdx = Math.max(hashIdx, atIdx, slashIdx);

    if (lastTriggerIdx !== -1) {
      const char = val[lastTriggerIdx] as '#' | '@' | '/';
      // Make sure it is either start of input or preceded by whitespace
      if (lastTriggerIdx === 0 || /\s/.test(val[lastTriggerIdx - 1])) {
        setTrigger(char);
        setSearchQuery(val.substring(lastTriggerIdx + 1));
        setShowDropdown(true);
        setActiveIndex(0);
        return;
      }
    }

    setTrigger(null);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isObjectValue = typeof value === 'object' && value !== null;

    if (isObjectValue) {
      onChange({ mode: 'custom', value: '' });
    } else {
      onChange('');
    }

    setInputValue('');
    setTrigger(null);
    setSearchQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div ref={containerRef} className={`relative w-full text-left font-sans ${className}`} id="smart-link-picker-container">
      {selectedLink ? (
        // Selected Badge view
        <div className="flex items-center justify-between w-full bg-stone-950 border border-amber-500/40 rounded px-2.5 py-1.5 text-xs text-stone-100 shadow-sm" id="smart-link-selected-badge">
          <div className="flex items-center gap-2 overflow-hidden mr-2">
            {selectedLink.type === 'product' && <ShoppingBag className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
            {selectedLink.type === 'page' && <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
            {(selectedLink.type === 'collection' || selectedLink.type === 'category') && <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            {selectedLink.type === 'custom' && <Link2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />}

            {selectedLink.image && (
              <img 
                src={selectedLink.image} 
                alt={selectedLink.label} 
                className="w-5 h-5 rounded object-cover border border-stone-800 shrink-0"
                referrerPolicy="no-referrer"
              />
            )}

            <span className="truncate font-semibold text-stone-200">{selectedLink.label}</span>
            {selectedLink.code && (
              <span className="text-[10px] bg-stone-900 border border-stone-800 text-stone-400 px-1 py-0.5 rounded uppercase font-mono tracking-wider shrink-0">
                {selectedLink.code}
              </span>
            )}
            <span className="text-[10px] text-stone-500 truncate max-w-[120px]">({selectedLink.url})</span>
          </div>

          <button
            type="button"
            onClick={clearSelection}
            className="p-1 hover:bg-stone-900 rounded text-stone-400 hover:text-stone-100 transition-colors shrink-0"
            title="Clear and choose a new link"
            id="smart-link-clear-btn"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        // Input text view
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (trigger) setShowDropdown(true);
            }}
            placeholder={placeholder}
            className="w-full bg-stone-950 border border-stone-800 rounded pl-2.5 pr-8 py-2 text-xs text-stone-100 outline-none focus:border-amber-500/50 transition-colors"
            id="smart-link-picker-input"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center text-stone-500 pointer-events-none">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Dropdown Suggestions Panel */}
      {showDropdown && filteredItems.length > 0 && (
        <div 
          className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-stone-900 border border-stone-800 rounded-lg shadow-2xl z-50 py-1"
          id="smart-link-autocomplete-dropdown"
        >
          <div className="px-3 py-1.5 text-[9px] font-bold text-stone-500 uppercase tracking-widest border-b border-stone-850 bg-stone-950/40">
            {trigger === '#' && 'Products matched'}
            {trigger === '@' && 'Active pages matched'}
            {trigger === '/' && 'Collections & Categories matched'}
          </div>

          {filteredItems.map((item, index) => (
            <div
              key={item.id + '-' + item.type}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                index === activeIndex 
                  ? 'bg-amber-600/10 text-stone-100 border-l-2 border-amber-500 pl-[10px]' 
                  : 'text-stone-300 hover:bg-stone-850 border-l-2 border-transparent'
              }`}
            >
              {item.image && (
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-7 h-7 rounded object-cover border border-stone-800 shrink-0"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{item.name}</div>
                <div className="text-[10px] text-stone-500 truncate">{item.subtitle}</div>
              </div>
              <div className="text-[10px] text-stone-400 bg-stone-950 px-2 py-0.5 rounded text-right font-mono font-bold">
                {item.type.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty autocomplete helper placeholder */}
      {showDropdown && filteredItems.length === 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-stone-900 border border-stone-800 rounded-lg shadow-2xl z-50 p-4 text-center text-xs text-stone-500">
          No matches found for "{searchQuery}". Press Enter to use as raw link.
        </div>
      )}
    </div>
  );
}
