/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Centralized Metal Price Management
 */

import React, { useState, useEffect } from 'react';
import { db, isFirebaseConfigured, auth } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  Timestamp 
} from 'firebase/firestore';
import { 
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  Edit,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  Layers,
  Sparkles,
  RotateCcw,
  Plus,
  Trash2
} from 'lucide-react';

// Default metals array to seed or fallback to in local mode
const DEFAULT_METALS = [
  { id: 'gold-24k', metalName: 'Gold 24K', purity: '99.9% Pure', price: 7470, unit: '1g', currency: 'INR', status: 'active' },
  { id: 'gold-22k', metalName: 'Gold 22K', purity: '91.6% Hallmark (916)', price: 6850, unit: '1g', currency: 'INR', status: 'active' },
  { id: 'gold-18k', metalName: 'Gold 18K', purity: '75.0% Hallmark (750)', price: 5630, unit: '1g', currency: 'INR', status: 'active' },
  { id: 'silver-sterling', metalName: 'Sterling Silver', purity: '92.5% Pure Silver', price: 89, unit: '1g', currency: 'INR', status: 'active' },
  { id: 'platinum-950', metalName: 'Platinum 950', purity: '95.0% Pure Platinum', price: 3450, unit: '1g', currency: 'INR', status: 'active' }
];

export function AdminMetalPrices(): React.JSX.Element {
  const { user } = useAuth();
  
  // App States
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form View Modes
  const [view, setView] = useState<'list' | 'edit' | 'add'>('list');
  const [lastUpdatedGlobal, setLastUpdatedGlobal] = useState<string>('Never');

  // Form Field States
  const [formData, setFormData] = useState({
    id: '',
    metalName: '',
    purity: '',
    price: 0,
    unit: '1g',
    currency: 'INR',
    effectiveDate: '',
    status: 'active' as 'active' | 'inactive',
    change: 0
  });

  // Load prices on mount or view change
  useEffect(() => {
    async function fetchRates() {
      try {
        setLoading(true);
        setError(null);

        if (!isFirebaseConfigured) {
          // Offline local mode
          const localStored = localStorage.getItem('local_metal_prices');
          if (localStored) {
            const parsed = JSON.parse(localStored);
            setPrices(parsed);
            updateGlobalTimestamp(parsed);
          } else {
            const normalized = DEFAULT_METALS.map((m, idx) => ({
              ...m,
              effectiveDate: new Date().toISOString().substring(0, 16),
              updatedAt: new Date().toISOString(),
              updatedBy: 'System Pre-seed',
              change: 0
            }));
            localStorage.setItem('local_metal_prices', JSON.stringify(normalized));
            setPrices(normalized);
            updateGlobalTimestamp(normalized);
          }
          setLoading(false);
          return;
        }

        // Live Firestore load
        const ref = collection(db, 'metalPrices');
        const snapshot = await getDocs(ref);
        
        if (snapshot.empty) {
          // Seed initial default rates in DB for instant beautiful user experience
          const batchPromises = DEFAULT_METALS.map(async (m) => {
            const docId = m.id;
            const seedPayload = {
              metalName: m.metalName,
              metal: m.metalName, // compatible field
              purity: m.purity,
              price: m.price,
              pricePerGram: m.price, // compatible field
              unit: m.unit,
              currency: m.currency,
              status: m.status,
              change: 0,
              effectiveDate: new Date().toISOString().substring(0, 16),
              updatedAt: Timestamp.now(),
              updatedBy: 'System Seed'
            };
            await setDoc(doc(db, 'metalPrices', docId), seedPayload);
            return { id: docId, ...seedPayload, updatedAt: new Date().toISOString() };
          });
          
          const seeded = await Promise.all(batchPromises);
          setPrices(seeded);
          updateGlobalTimestamp(seeded);
        } else {
          const items = snapshot.docs.map(docSnapshot => {
            const data = docSnapshot.data();
            let updateDateStr = '';
            
            if (data.updatedAt) {
              if (data.updatedAt instanceof Timestamp) {
                updateDateStr = data.updatedAt.toDate().toISOString();
              } else {
                updateDateStr = new Date(data.updatedAt).toISOString();
              }
            } else {
              updateDateStr = new Date().toISOString();
            }

            return {
              id: docSnapshot.id,
              metalName: data.metalName || data.metal || '',
              purity: data.purity || '',
              price: Number(data.price || data.pricePerGram || 0),
              unit: data.unit || '1g',
              currency: data.currency || 'INR',
              effectiveDate: data.effectiveDate || new Date().toISOString().substring(0, 16),
              status: data.status || 'active',
              change: Number(data.change || 0),
              updatedAt: updateDateStr,
              updatedBy: data.updatedBy || 'Administrator'
            };
          });

          setPrices(items);
          updateGlobalTimestamp(items);
        }
      } catch (err: any) {
        console.error('Failed to load metal prices:', err);
        setError('Database read failed: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRates();
  }, [view]);

  // Derive most recent update time from all metals
  const updateGlobalTimestamp = (items: any[]) => {
    if (!items || items.length === 0) return;
    const timestamps = items
      .map(item => item.updatedAt)
      .filter(Boolean)
      .map(t => new Date(t).getTime());
      
    if (timestamps.length > 0) {
      const maxTime = Math.max(...timestamps);
      const targetDate = new Date(maxTime);
      setLastUpdatedGlobal(
        targetDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + 
        ', ' + 
        targetDate.toLocaleDateString('en-IN')
      );
    } else {
      setLastUpdatedGlobal(new Date().toLocaleTimeString('en-IN') + ', ' + new Date().toLocaleDateString('en-IN'));
    }
  };

  // Open Form in Edit mode
  const handleStartEdit = (item: any) => {
    setFormData({
      id: item.id,
      metalName: item.metalName,
      purity: item.purity,
      price: item.price,
      unit: item.unit,
      currency: item.currency,
      effectiveDate: item.effectiveDate || new Date().toISOString().substring(0, 16),
      status: item.status as 'active' | 'inactive',
      change: item.change
    });
    setError(null);
    setSuccess(null);
    setView('edit');
  };

  // Open Form in Add mode
  const handleStartAdd = () => {
    setFormData({
      id: '',
      metalName: '',
      purity: '',
      price: 0,
      unit: '1g',
      currency: 'INR',
      effectiveDate: new Date().toISOString().substring(0, 16),
      status: 'active',
      change: 0
    });
    setError(null);
    setSuccess(null);
    setView('add');
  };

  // Reset standard seed rates if admin ever wants a clean slate
  const handleRestoreDefaults = async () => {
    if (!window.confirm('Are you sure you want to restore all standard live rates to default seed values?')) return;
    
    try {
      setSaving(true);
      setError(null);

      if (!isFirebaseConfigured) {
        const restored = DEFAULT_METALS.map((m, idx) => ({
          ...m,
          effectiveDate: new Date().toISOString().substring(0, 16),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Restore Defaults Trigger',
          change: 0
        }));
        localStorage.setItem('local_metal_prices', JSON.stringify(restored));
        setPrices(restored);
        updateGlobalTimestamp(restored);
        setSuccess('Restored default metal rates locally!');
        setView('list');
        return;
      }

      // Restore to Firestore
      for (const m of DEFAULT_METALS) {
        const docId = m.id;
        const seedPayload = {
          metalName: m.metalName,
          metal: m.metalName,
          purity: m.purity,
          price: m.price,
          pricePerGram: m.price,
          unit: m.unit,
          currency: m.currency,
          status: m.status,
          change: 0,
          effectiveDate: new Date().toISOString().substring(0, 16),
          updatedAt: Timestamp.now(),
          updatedBy: auth.currentUser?.email || 'System Default Restore'
        };
        await setDoc(doc(db, 'metalPrices', docId), seedPayload);
      }

      setSuccess('Restored standard metal rates successfully in Live Cloud Database!');
      setView('list');
    } catch (err: any) {
      console.error('Restore failed:', err);
      setError('Restore failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Submit Rate Edits / Add Custom Metals
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.metalName || formData.price <= 0 || !formData.purity) {
      setError('Please provide a valid metal name, purity rating, and positive price.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const targetId = formData.id || 'metal-' + formData.metalName.toLowerCase().replace(/\s+/g, '-');
      const currentUserEmail = auth.currentUser?.email || user?.email || 'Authorized Administrator';

      // 1. Calculate dynamic percentage rate changes compared to the previous state
      const matchingPrev = prices.find(p => p.id === targetId);
      let calculatedChange = 0;
      if (matchingPrev && matchingPrev.price > 0) {
        calculatedChange = Number((((formData.price - matchingPrev.price) / matchingPrev.price) * 100).toFixed(2));
      }

      // 2. Format precise payload satisfying both custom parameters and home page component models
      const payload: any = {
        metalName: formData.metalName,
        metal: formData.metalName, // homepage mapping compatibility
        purity: formData.purity,
        price: Number(formData.price),
        pricePerGram: Number(formData.price), // homepage mapping compatibility
        unit: formData.unit,
        currency: formData.currency,
        effectiveDate: formData.effectiveDate,
        status: formData.status,
        change: calculatedChange,
        updatedBy: currentUserEmail
      };

      if (!isFirebaseConfigured) {
        // Offline persistence fallback
        payload.id = targetId;
        payload.updatedAt = new Date().toISOString();
        
        let newPricesList = [...prices];
        const existingIndex = prices.findIndex(p => p.id === targetId);
        if (existingIndex >= 0) {
          newPricesList[existingIndex] = payload;
        } else {
          newPricesList.push(payload);
        }

        localStorage.setItem('local_metal_prices', JSON.stringify(newPricesList));
        setPrices(newPricesList);
        updateGlobalTimestamp(newPricesList);
        setSuccess(`Local configuration for "${formData.metalName}" committed successfully!`);
        setView('list');
        return;
      }

      // Live Firestore Sync
      payload.updatedAt = Timestamp.now();
      await setDoc(doc(db, 'metalPrices', targetId), payload);

      setSuccess(`Bullion exchange rates for "${formData.metalName}" updated on Live Showroom Screens instantly!`);
      setView('list');
    } catch (err: any) {
      console.error('Commit failed:', err);
      setError('Failed to update live rates: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" id="metal-prices-cms">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-stone-950 border border-stone-850 rounded">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 rounded flex items-center justify-center text-amber-500">
            <CircleDollarSign className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold text-stone-100 uppercase tracking-wide">
              Metal Exchange CMS
            </h1>
            <p className="text-stone-400 text-xs">
              Configure centralized retail rates served sitewide.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {view === 'list' && (
            <>
              <button
                onClick={handleRestoreDefaults}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-stone-800 hover:bg-stone-900 text-[10px] text-stone-400 hover:text-stone-200 uppercase tracking-wider font-bold rounded transition-all cursor-pointer"
                title="Restore default parameters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Standard Metals</span>
              </button>

              <button
                onClick={handleStartAdd}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-[10px] uppercase tracking-wider font-bold rounded transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Metal</span>
              </button>
            </>
          )}

          {view !== 'list' && (
            <button
              onClick={() => setView('list')}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-stone-800 hover:bg-stone-900 text-[10px] text-stone-400 uppercase tracking-wider font-bold rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Back to Index</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-stone-950/40 border border-stone-800 p-4 rounded flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-stone-500 uppercase tracking-wider font-semibold block">
              Market Stream Active
            </span>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-stone-300">
                Firestore Listener Connected
              </span>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded font-bold uppercase tracking-widest">
            LIVE
          </span>
        </div>

        <div className="bg-stone-950/40 border border-stone-800 p-4 rounded flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-stone-500 uppercase tracking-wider font-semibold block">
              Global Price Sync
            </span>
            <div className="flex items-center gap-1.5 text-stone-300">
              <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-xs font-mono font-bold">{lastUpdatedGlobal}</span>
            </div>
          </div>
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">
            Last Sync
          </span>
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="p-3 bg-red-950/40 border border-red-900/60 rounded text-xs text-red-400 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded text-xs text-emerald-400 flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Primary Workspace View Switch */}
      {loading ? (
        <div className="p-12 text-center bg-stone-950 rounded border border-stone-850">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">Loading Exchange Registers...</p>
        </div>
      ) : view === 'list' ? (
        /* Prices Listing Table */
        <div className="bg-stone-950 rounded border border-stone-850 overflow-hidden" id="rates-registry-table">
          <div className="p-4 border-b border-stone-850 bg-stone-950 flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold text-stone-300">Registered Bullion Tiers</h3>
            <span className="text-[10px] text-stone-500 font-mono font-bold uppercase">Total: {prices.length} items</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-850 text-[10px] font-bold text-stone-500 uppercase tracking-wider bg-stone-950">
                  <th className="p-4 font-semibold">Metal / Tier</th>
                  <th className="p-4 font-semibold">Purity Rating</th>
                  <th className="p-4 font-semibold text-center">Price Rate</th>
                  <th className="p-4 font-semibold text-center">Daily Change</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Modified Details</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-850/60">
                {prices.map((item) => {
                  const isUp = item.change >= 0;
                  const formattedDate = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-IN') : 'N/A';
                  
                  return (
                    <tr key={item.id} className="hover:bg-stone-900/40 text-stone-200 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-500/80" />
                          <span className="font-bold text-stone-100 text-xs">{item.metalName}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-stone-300 font-sans">{item.purity}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-mono text-xs text-amber-500 font-bold">
                          {item.currency === 'INR' ? '₹' : item.currency}{item.price.toLocaleString('en-IN')}
                          <span className="text-[10px] text-stone-500 font-normal">/{item.unit}</span>
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-0.5 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isUp ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/30' : 'bg-red-950/60 text-red-400 border border-red-900/30'
                        }`}>
                          {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                          <span>{isUp ? '+' : ''}{item.change}%</span>
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          item.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-stone-900 text-stone-500 border border-stone-800'
                        }`}>
                          {item.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-[10px] space-y-0.5">
                          <div className="text-stone-400 flex items-center gap-1">
                            <User className="w-2.5 h-2.5 text-stone-600" />
                            <span>{item.updatedBy || 'System'}</span>
                          </div>
                          <div className="text-stone-500 font-mono">{formattedDate}</div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 border border-stone-800 hover:border-amber-500/40 hover:bg-stone-900 text-stone-400 hover:text-amber-500 rounded transition-all cursor-pointer"
                          title="Modify current rates"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Edit or Add Metal rate entry Form */
        <div className="bg-stone-950 border border-stone-850 rounded overflow-hidden" id="rates-editor-panel">
          <div className="p-4 border-b border-stone-850 bg-stone-950 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <h3 className="font-serif text-sm font-bold text-stone-300">
              {view === 'edit' ? `Revise Exchange Rates: ${formData.metalName}` : 'Add New Ornaments Metal Registry'}
            </h3>
          </div>

          <form onSubmit={handleSubmitForm} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Metal Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                  Metal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gold 24K, Sterling Silver, Platinum"
                  value={formData.metalName}
                  onChange={(e) => setFormData({ ...formData, metalName: e.target.value })}
                  disabled={view === 'edit'} // Standard IDs locked to prevent layout breaks
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-200"
                />
                {view === 'edit' && (
                  <span className="text-[9px] text-stone-500 block">Identifier locked to preserve client integrations.</span>
                )}
              </div>

              {/* Purity Level */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                  Purity Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 91.6% Hallmark (916)"
                  value={formData.purity}
                  onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-200"
                />
              </div>

              {/* Price rate */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                  Current Exchange Valuation Rate *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-500 text-xs font-bold font-mono">
                    {formData.currency === 'INR' ? '₹' : formData.currency}
                  </span>
                  <input
                    type="number"
                    required
                    min={0.01}
                    step={0.01}
                    placeholder="7470"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-3 py-2 bg-stone-900 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-200 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Measure Unit */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                  Priced Unit Rating *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-300 font-semibold cursor-pointer"
                >
                  <option value="1g">Per Gram (1g)</option>
                  <option value="8g">Per Sovereign (8g)</option>
                  <option value="10g">Per Tola (10g)</option>
                  <option value="1kg">Per Kilogram (1kg)</option>
                </select>
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                  Currency Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="INR"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-200 font-mono"
                />
              </div>

              {/* Effective Start Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                  Effective Start Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-300 font-mono"
                />
              </div>

              {/* Publishing Status */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                  CMS Visibility Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-300 font-semibold cursor-pointer"
                >
                  <option value="active">Active (Served on website)</option>
                  <option value="inactive">Inactive (Suspended temporarily)</option>
                </select>
              </div>
            </div>

            {/* Form Action Controls */}
            <div className="border-t border-stone-850 pt-5 flex items-center justify-end gap-3">
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
                id="btn-save-metal-rate"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Committed in Sync...' : 'Publish Rates'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
