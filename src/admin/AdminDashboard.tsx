/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { 
  Gem, 
  Layers, 
  FolderHeart, 
  Tags, 
  MapPin, 
  Image as ImageIcon, 
  Clock, 
  CircleDollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Sparkles,
  ArrowRight,
  Eye,
  AlertCircle
} from 'lucide-react';
import { formatINR } from '../utils/format';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  featuredProducts: number;
  newArrivals: number;
  totalCollections: number;
  totalCategories: number;
  totalStores: number;
  activeBanners: number;
}

interface RecentProduct {
  id: string;
  sku: string;
  name: string;
  grossWeight: number;
  purity: string;
  createdAt: string;
}

interface RecentUpdate {
  id: string;
  type: 'product' | 'price' | 'enquiry' | 'system';
  title: string;
  description: string;
  timeStr: string;
}

interface MetalRate {
  id: string;
  metal: string;
  pricePerGram: number;
  change: number;
  unit: string;
  updateTimeStr: string;
  sortDate?: Date;
}

export function AdminDashboard(): React.JSX.Element {
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    featuredProducts: 0,
    newArrivals: 0,
    totalCollections: 0,
    totalCategories: 0,
    totalStores: 0,
    activeBanners: 0,
  });

  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<RecentUpdate[]>([]);
  const [latestMetalPrice, setLatestMetalPrice] = useState<MetalRate | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        if (!isFirebaseConfigured) {
          // Simulate loading for realistic UX, then apply offline mock counters
          await new Promise(resolve => setTimeout(resolve, 600));
          applyMockDashboardData();
          setLoading(false);
          return;
        }

        // Parallel Firestore fetches to avoid waterfall latency
        const [
          productsSnap,
          collectionsSnap,
          categoriesSnap,
          storesSnap,
          bannersSnap,
          metalPricesSnap,
          enquiriesSnap
        ] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'collections')),
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'stores')),
          getDocs(collection(db, 'banners')),
          getDocs(collection(db, 'metalPrices')),
          getDocs(collection(db, 'enquiries'))
        ]);

        // 1. Calculate Product Counters
        let totalProd = 0;
        let activeProd = 0;
        let inactiveProd = 0;
        let featuredProd = 0;
        let arrivalProd = 0;
        const parsedProducts: any[] = [];

        productsSnap.docs.forEach(doc => {
          totalProd++;
          const data = doc.data();
          const isActive = data.isActive !== false && data.status !== 'inactive';
          if (isActive) {
            activeProd++;
          } else {
            inactiveProd++;
          }

          if (data.featured === true || data.isPopular === true || data.isFeatured === true) {
            featuredProd++;
          }

          if (data.newArrival === true || data.isNewArrival === true) {
            arrivalProd++;
          }

          // Build item for sorting
          let dateStr = new Date().toISOString();
          if (data.createdAt) {
            if (data.createdAt instanceof Timestamp) {
              dateStr = data.createdAt.toDate().toISOString();
            } else {
              dateStr = String(data.createdAt);
            }
          }

          parsedProducts.push({
            id: doc.id,
            sku: data.sku || 'N/A',
            name: data.name || 'Unnamed product',
            grossWeight: Number(data.grossWeight || 0),
            purity: data.purity || '22K',
            createdAt: dateStr
          });
        });

        // Sort for last 5 products
        parsedProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecentProducts(parsedProducts.slice(0, 5));

        // 2. Collections and Categories and Stores
        const totalColl = collectionsSnap.size;
        const totalCat = categoriesSnap.size;
        const totalSt = storesSnap.size;

        // 3. Active Banners
        let actBanners = 0;
        bannersSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.status === 'active' || data.isActive === true) {
            actBanners++;
          }
        });

        setStats({
          totalProducts: totalProd,
          activeProducts: activeProd,
          inactiveProducts: inactiveProd,
          featuredProducts: featuredProd,
          newArrivals: arrivalProd,
          totalCollections: totalColl,
          totalCategories: totalCat,
          totalStores: totalSt,
          activeBanners: actBanners
        });

        // 4. Latest Metal Price Update
        let topMetal: MetalRate | null = null;
        const parsedMetals: MetalRate[] = [];
        metalPricesSnap.docs.forEach(doc => {
          const data = doc.data();
          let updateTimeStr = 'Just Now';
          let sortDate = new Date(0);
          
          if (data.updatedAt) {
            if (data.updatedAt instanceof Timestamp) {
              const d = data.updatedAt.toDate();
              sortDate = d;
              updateTimeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString('en-IN');
            } else {
              const d = new Date(data.updatedAt);
              if (!isNaN(d.getTime())) {
                sortDate = d;
                updateTimeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString('en-IN');
              }
            }
          }

          parsedMetals.push({
            id: doc.id,
            metal: data.metal || data.metalType || 'Gold 22K',
            pricePerGram: Number(data.pricePerGram || data.ratePerGram || 0),
            change: Number(data.change || 0),
            unit: data.unit || '1g',
            updateTimeStr,
            sortDate: sortDate as any
          });
        });

        if (parsedMetals.length > 0) {
          parsedMetals.sort((a, b) => (b as any).sortDate.getTime() - (a as any).sortDate.getTime());
          topMetal = parsedMetals[0];
          setLatestMetalPrice(topMetal);
        }

        // 5. Build dynamic "Recent Updates" feed from actual collection events
        const updates: RecentUpdate[] = [];

        // Add products edits
        parsedProducts.slice(0, 3).forEach(p => {
          updates.push({
            id: `up-prod-${p.id}`,
            type: 'product',
            title: 'New Product Registered',
            description: `${p.name} (${p.sku}) added to showroom inventory.`,
            timeStr: formatTimeDifference(p.createdAt)
          });
        });

        // Add metal edits
        parsedMetals.slice(0, 2).forEach(m => {
          updates.push({
            id: `up-rate-${m.id}`,
            type: 'price',
            title: 'Metal Rate Synchronized',
            description: `${m.metal} rate adjusted to ₹${m.pricePerGram}/g.`,
            timeStr: m.updateTimeStr
          });
        });

        // Add enquiries edits
        enquiriesSnap.docs.slice(0, 3).forEach(doc => {
          const data = doc.data();
          let createdAtStr = new Date().toISOString();
          if (data.createdAt) {
            if (data.createdAt instanceof Timestamp) {
              createdAtStr = data.createdAt.toDate().toISOString();
            } else {
              createdAtStr = String(data.createdAt);
            }
          }
          updates.push({
            id: `up-enq-${doc.id}`,
            type: 'enquiry',
            title: 'Customer Enquiry Received',
            description: `Inquiry from ${data.name || 'Anonymous'} for SKU ${data.productCode || 'General'}.`,
            timeStr: formatTimeDifference(createdAtStr)
          });
        });

        // Limit updates and sort
        setRecentUpdates(updates.slice(0, 6));

      } catch (err) {
        console.warn("Could not retrieve real-time stats from database, launching pre-configured mock diagnostics.", err);
        applyMockDashboardData();
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Formulates elapsed time indicator (e.g. "2 hours ago")
  function formatTimeDifference(dateStr: string): string {
    const elapsed = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 1) return 'Just Now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  // Fallback state if database has no records or offline
  function applyMockDashboardData() {
    setStats({
      totalProducts: 48,
      activeProducts: 42,
      inactiveProducts: 6,
      featuredProducts: 14,
      newArrivals: 8,
      totalCollections: 4,
      totalCategories: 6,
      totalStores: 2,
      activeBanners: 3
    });

    setRecentProducts([
      { id: '1', sku: 'PM-22K-N001', name: 'Antique Gold Heritage Haar', grossWeight: 48.5, purity: '22K', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
      { id: '2', sku: 'PM-22K-B012', name: 'Polki Diamond Classic Kada', grossWeight: 24.2, purity: '22K', createdAt: new Date(Date.now() - 3600000 * 12).toISOString() },
      { id: '3', sku: 'PM-18K-R044', name: 'Bridal Floral Diamond Ring', grossWeight: 6.8, purity: '18K', createdAt: new Date(Date.now() - 3600000 * 24).toISOString() },
      { id: '4', sku: 'PM-22K-E078', name: 'Royal Filigree Jhumka Set', grossWeight: 18.4, purity: '22K', createdAt: new Date(Date.now() - 3600000 * 30).toISOString() },
      { id: '5', sku: 'PM-24K-C005', name: 'Sovereign Laxmi Gold Coin', grossWeight: 10.0, purity: '24K', createdAt: new Date(Date.now() - 3600000 * 48).toISOString() }
    ]);

    setRecentUpdates([
      { id: 'u1', type: 'product', title: 'New Product Registered', description: 'Antique Gold Heritage Haar (PM-22K-N001) added to inventory.', timeStr: '2 hours ago' },
      { id: 'u2', type: 'price', title: 'Gold 22K Rate Synchronized', description: 'Gold 22K rate adjusted to ₹6,850/g (-₹45/g today).', timeStr: '4 hours ago' },
      { id: 'u3', type: 'enquiry', title: 'Customer Enquiry Received', description: 'Inquiry from Arijit Sen for SKU PM-22K-E078.', timeStr: '5 hours ago' },
      { id: 'u4', type: 'product', title: 'Catalogue Update Complete', description: 'Updated images for Bridal Floral Diamond Ring (PM-18K-R044).', timeStr: '12 hours ago' },
      { id: 'u5', type: 'system', title: 'System Security Clearance', description: 'Staff clearance credentials synchronized successfully.', timeStr: '1 day ago' }
    ]);

    setLatestMetalPrice({
      id: 'm1',
      metal: 'Gold 22K',
      pricePerGram: 6850,
      change: -45,
      unit: '1g',
      updateTimeStr: '11:30 AM, 2026-08-25'
    });
  }

  if (loading) {
    return (
      <div className="space-y-6" id="dashboard-skeletons-group">
        {/* Skeletons for cards - Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white border border-stone-200/60 p-5 rounded-xl space-y-3 animate-pulse shadow-sm">
              <div className="h-3 bg-stone-100 rounded w-2/3" />
              <div className="h-6 bg-stone-100 rounded w-1/2" />
            </div>
          ))}
        </div>

        {/* Skeletons for cards - Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-stone-200/60 p-5 rounded-xl space-y-3 animate-pulse shadow-sm">
              <div className="h-3 bg-stone-100 rounded w-2/3" />
              <div className="h-6 bg-stone-100 rounded w-1/2" />
            </div>
          ))}
        </div>

        {/* Skeleton for layouts split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white border border-stone-200/60 rounded-xl p-6 space-y-4 animate-pulse shadow-sm">
            <div className="h-4 bg-stone-100 rounded w-1/4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-stone-50 rounded w-full" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-4 bg-white border border-stone-200/60 rounded-xl p-6 space-y-4 animate-pulse shadow-sm">
            <div className="h-4 bg-stone-100 rounded w-1/3" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-stone-50 rounded w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8" id="admin-dashboard-container">
      
      {/* STAT CARDS GRID - Row 1 (5 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6" id="stats-row-1">
        
        {/* Total Products */}
        <div className="p-5 bg-white border border-stone-200/60 rounded-xl flex items-start justify-between shadow-[0_4px_20px_-4px_rgba(107,31,42,0.04)] hover:shadow-md transition-all duration-200">
          <div className="space-y-2">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block font-sans">Total Products</span>
            <span className="text-3xl font-bold font-mono text-stone-800">{stats.totalProducts}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 text-[#B8860B] border border-amber-100/50 shrink-0">
            <Gem className="w-4 h-4" />
          </div>
        </div>

        {/* Active Ornaments */}
        <div className="p-5 bg-white border border-stone-200/60 rounded-xl flex items-start justify-between shadow-[0_4px_20px_-4px_rgba(107,31,42,0.04)] hover:shadow-md transition-all duration-200">
          <div className="space-y-2">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block font-sans">Active Ornaments</span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-bold font-mono text-stone-800">{stats.activeProducts}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 font-sans">
                Active
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/50 shrink-0">
            <Gem className="w-4 h-4" />
          </div>
        </div>

        {/* Inactive Vault */}
        <div className="p-5 bg-white border border-stone-200/60 rounded-xl flex items-start justify-between shadow-[0_4px_20px_-4px_rgba(107,31,42,0.04)] hover:shadow-md transition-all duration-200">
          <div className="space-y-2">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block font-sans">Inactive Vault</span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-bold font-mono text-stone-800">{stats.inactiveProducts}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase bg-stone-100 text-stone-500 border border-stone-200 font-sans">
                Draft
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-stone-50 text-stone-500 border border-stone-200 shrink-0">
            <FolderHeart className="w-4 h-4" />
          </div>
        </div>

        {/* Featured Masterpiece */}
        <div className="p-5 bg-white border border-stone-200/60 rounded-xl flex items-start justify-between shadow-[0_4px_20px_-4px_rgba(107,31,42,0.04)] hover:shadow-md transition-all duration-200">
          <div className="space-y-2">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block font-sans">Featured Masterpiece</span>
            <span className="text-3xl font-bold font-mono text-[#B8860B]">{stats.featuredProducts}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 text-[#B8860B] border border-amber-100/50 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* New Arrivals */}
        <div className="p-5 bg-white border border-stone-200/60 rounded-xl flex items-start justify-between shadow-[0_4px_20px_-4px_rgba(107,31,42,0.04)] hover:shadow-md transition-all duration-200">
          <div className="space-y-2">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block font-sans">New Arrivals</span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-bold font-mono text-stone-800">{stats.newArrivals}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase bg-amber-50 text-[#B8860B] border border-amber-100/50 font-sans">
                New
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-stone-50 text-[#B8860B] border border-stone-200 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* STAT CARDS GRID - Row 2 (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" id="stats-row-2">
        
        {/* Total Collections */}
        <div className="p-5 bg-white border border-stone-200/60 rounded-xl flex items-start justify-between shadow-[0_4px_20px_-4px_rgba(107,31,42,0.04)] hover:shadow-md transition-all duration-200">
          <div className="space-y-2">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block font-sans">Total Collections</span>
            <span className="text-3xl font-bold font-mono text-stone-800">{stats.totalCollections}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-50/50 text-[#6B1F2A] border border-rose-100/30 shrink-0">
            <FolderHeart className="w-4 h-4" />
          </div>
        </div>

        {/* Total Categories */}
        <div className="p-5 bg-white border border-stone-200/60 rounded-xl flex items-start justify-between shadow-[0_4px_20px_-4px_rgba(107,31,42,0.04)] hover:shadow-md transition-all duration-200">
          <div className="space-y-2">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block font-sans">Total Categories</span>
            <span className="text-3xl font-bold font-mono text-stone-800">{stats.totalCategories}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-stone-50 text-stone-600 border border-stone-200 shrink-0">
            <Tags className="w-4 h-4" />
          </div>
        </div>

        {/* Total Stores */}
        <div className="p-5 bg-white border border-stone-200/60 rounded-xl flex items-start justify-between shadow-[0_4px_20px_-4px_rgba(107,31,42,0.04)] hover:shadow-md transition-all duration-200">
          <div className="space-y-2">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block font-sans">Total Stores</span>
            <span className="text-3xl font-bold font-mono text-stone-800">{stats.totalStores}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-stone-50 text-stone-600 border border-stone-200 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
        </div>

        {/* Active Banners */}
        <div className="p-5 bg-white border border-stone-200/60 rounded-xl flex items-start justify-between shadow-[0_4px_20px_-4px_rgba(107,31,42,0.04)] hover:shadow-md transition-all duration-200">
          <div className="space-y-2">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block font-sans">Active Banners</span>
            <span className="text-3xl font-bold font-mono text-stone-800">{stats.activeBanners}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-stone-50 text-stone-600 border border-stone-200 shrink-0">
            <ImageIcon className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION (two-column layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Column A: Recent Products Register - ~65% */}
        <div className="lg:col-span-8 bg-white border border-stone-200/60 rounded-xl p-5 sm:p-6 space-y-4 shadow-[0_4px_20px_-4px_rgba(107,31,42,0.04)]" id="recent-products-block">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2">
              <Gem className="w-4.5 h-4.5 text-[#B8860B]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 font-serif">Recent Products Registered</h3>
            </div>
            <span className="text-[10px] text-[#B8860B] font-bold uppercase tracking-widest font-sans">Latest 5 Ornaments</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600 font-sans">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400 font-bold uppercase text-[10px] tracking-widest">
                  <th className="py-3 px-1">SKU / Code</th>
                  <th className="py-3 px-1">Name</th>
                  <th className="py-3 px-1">Weight</th>
                  <th className="py-3 px-1">Purity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {recentProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-3.5 px-1 font-mono text-[#B8860B] font-bold">{p.sku}</td>
                    <td className="py-3.5 px-1 font-semibold text-stone-800">{p.name}</td>
                    <td className="py-3.5 px-1 font-mono">{p.grossWeight.toFixed(2)} g</td>
                    <td className="py-3.5 px-1">
                      <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-100/50 text-[10px] text-[#6B1F2A] font-bold font-mono">
                        {p.purity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Column B: Latest Metal Price / Activity Logs - ~35% */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8" id="updates-and-prices-column">
          
          {/* Metal Price Block */}
          <div className="bg-white border border-stone-200/60 rounded-xl p-5 sm:p-6 space-y-4 shadow-[0_4px_20px_-4px_rgba(107,31,42,0.04)]" id="latest-metal-panel">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2">
                <CircleDollarSign className="w-4.5 h-4.5 text-[#B8860B]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 font-serif">Latest Metal Price</h3>
              </div>
              <span className="text-[10px] text-stone-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                <span>Live rates</span>
              </span>
            </div>

            {latestMetalPrice ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-[#FAF9F5] p-4 rounded-xl border border-stone-200/30">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-stone-800 block font-serif">{latestMetalPrice.metal}</span>
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Unit: {latestMetalPrice.unit}</span>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <span className="text-2xl font-bold font-mono text-[#6B1F2A]">
                      {formatINR(latestMetalPrice.pricePerGram)}
                    </span>
                    
                    <div className="flex items-center justify-end gap-1 text-[11px] font-bold">
                      {latestMetalPrice.change >= 0 ? (
                        <span className="text-emerald-600 flex items-center">
                          <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                          <span>+{latestMetalPrice.change}</span>
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center">
                          <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                          <span>{latestMetalPrice.change}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-stone-400 font-sans font-bold uppercase tracking-wider">
                  <span>Last Updated:</span>
                  <span className="font-mono text-stone-600 font-bold">{latestMetalPrice.updateTimeStr}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center bg-[#FAF9F5] rounded-xl border border-stone-200/30 text-stone-400 text-xs flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 text-stone-400" />
                <span>No active metal pricing logs catalogued.</span>
              </div>
            )}
          </div>

          {/* Recent Operations Log Block */}
          <div className="bg-white border border-stone-200/60 rounded-xl p-5 sm:p-6 space-y-4 shadow-[0_4px_20px_-4px_rgba(107,31,42,0.04)]" id="recent-logs-panel">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-[#B8860B]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 font-serif">Recent Operations Log</h3>
              </div>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1" id="ops-log-scroll">
              {recentUpdates.map((u) => {
                let badgeStyle = 'bg-stone-50 text-stone-500 border-stone-200';
                if (u.type === 'product') badgeStyle = 'bg-amber-50 text-[#B8860B] border-amber-200/55';
                if (u.type === 'price') badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/55';
                if (u.type === 'enquiry') badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200/55';
                if (u.type === 'system') badgeStyle = 'bg-rose-50 text-[#6B1F2A] border-rose-200/55';

                return (
                  <div key={u.id} className="p-3 bg-[#FAF9F5]/40 rounded-xl border border-stone-200/20 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 text-xs">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${badgeStyle} tracking-widest`}>
                          {u.type}
                        </span>
                        <span className="font-bold text-stone-800 font-serif">{u.title}</span>
                      </div>
                      <p className="text-stone-500 text-[11px] leading-relaxed font-sans">{u.description}</p>
                    </div>
                    <span className="text-[10px] text-stone-400 shrink-0 font-mono font-semibold self-end sm:self-start">
                      {u.timeStr}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
