/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ImageUploader } from '../components/ImageUploader';
import { IMAGEKIT_FOLDERS } from '../imagekit/client';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Check, 
  Globe, 
  FileText, 
  Image as ImageIcon,
  Mail,
  ChevronRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { mockStores } from '../data/mockData';

interface StoreData {
  id?: string;
  storeName: string;
  name: string; // compatibility duplicate
  address: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  whatsapp: string;
  email: string;
  googleMapsUrl: string;
  mapUrl?: string; // compatibility duplicate
  latitude: number;
  longitude: number;
  openingTime: string;
  closingTime: string;
  weeklyOff: string;
  image: string;
  imageUrl?: string; // compatibility duplicate
  status: 'active' | 'inactive';
  isActive: boolean; // compatibility duplicate
  displayOrder: number;
}

const emptyStore: StoreData = {
  storeName: '',
  name: '',
  address: '',
  area: '',
  city: '',
  state: 'West Bengal',
  pincode: '',
  phone: '',
  whatsapp: '',
  email: '',
  googleMapsUrl: '',
  latitude: 22.5726,
  longitude: 88.3639,
  openingTime: '11:30 AM',
  closingTime: '08:00 PM',
  weeklyOff: 'Sunday',
  image: '',
  status: 'active',
  isActive: true,
  displayOrder: 1
};

export function AdminStores(): React.JSX.Element {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentStore, setCurrentStore] = useState<StoreData>(emptyStore);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load stores from Firestore or mock data
  const loadStores = async () => {
    try {
      setLoading(true);
      if (!isFirebaseConfigured || !db) {
        // Map mockStores to our schema
        const mappedMock = mockStores.map((s: any, idx) => ({
          id: s.id || `mock-store-${idx}`,
          storeName: s.name || 'Showroom Branch',
          name: s.name || 'Showroom Branch',
          address: s.address || '',
          area: s.area || '',
          city: s.city || 'Kolkata',
          state: 'West Bengal',
          pincode: '700012',
          phone: s.phone || '',
          whatsapp: s.whatsapp || '',
          email: 'info@parasmonijewellers.com',
          googleMapsUrl: s.mapUrl || '',
          mapUrl: s.mapUrl || '',
          latitude: s.latitude || 22.5726,
          longitude: s.longitude || 88.3639,
          openingTime: '11:30 AM',
          closingTime: '08:00 PM',
          weeklyOff: s.weeklyOff || 'Sunday',
          image: s.imageUrl || '',
          imageUrl: s.imageUrl || '',
          status: 'active',
          isActive: true,
          displayOrder: idx + 1
        })) as StoreData[];
        setStores(mappedMock);
        setLoading(false);
        return;
      }

      const storesCol = collection(db, 'stores');
      const snapshot = await getDocs(storesCol);
      const fetched = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          storeName: data.storeName || data.name || '',
          name: data.name || data.storeName || '',
          address: data.address || '',
          area: data.area || '',
          city: data.city || '',
          state: data.state || 'West Bengal',
          pincode: data.pincode || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          email: data.email || '',
          googleMapsUrl: data.googleMapsUrl || data.mapUrl || '',
          mapUrl: data.mapUrl || data.googleMapsUrl || '',
          latitude: Number(data.latitude || 0),
          longitude: Number(data.longitude || 0),
          openingTime: data.openingTime || '11:30 AM',
          closingTime: data.closingTime || '08:00 PM',
          weeklyOff: data.weeklyOff || 'Sunday',
          image: data.image || data.imageUrl || '',
          imageUrl: data.imageUrl || data.image || '',
          status: data.status || (data.isActive !== false ? 'active' : 'inactive'),
          isActive: data.isActive !== undefined ? data.isActive : (data.status !== 'inactive'),
          displayOrder: Number(data.displayOrder || 1)
        };
      }) as StoreData[];

      // Sort by display order
      fetched.sort((a, b) => a.displayOrder - b.displayOrder);
      setStores(fetched);
    } catch (err: any) {
      console.error('Error loading stores:', err);
      setErrorMsg('Failed to read showrooms from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const handleEditClick = (store: StoreData) => {
    setCurrentStore({ ...store });
    setIsEditing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleAddNewClick = () => {
    setCurrentStore({ ...emptyStore, displayOrder: stores.length + 1 });
    setIsEditing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentStore(emptyStore);
  };

  const handleFieldChange = (field: keyof StoreData, value: any) => {
    setCurrentStore(prev => {
      const updated = { ...prev, [field]: value };
      
      // Update compatibility fields synchronously
      if (field === 'storeName') {
        updated.name = value;
      }
      if (field === 'googleMapsUrl') {
        updated.mapUrl = value;
      }
      if (field === 'image') {
        updated.imageUrl = value;
      }
      if (field === 'status') {
        updated.isActive = value === 'active';
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore.storeName.trim()) {
      setErrorMsg('Store Name is required.');
      return;
    }
    if (!currentStore.address.trim()) {
      setErrorMsg('Full Showroom Address is required.');
      return;
    }
    if (!currentStore.image) {
      setErrorMsg('Storefront Display Image is required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        storeName: currentStore.storeName,
        name: currentStore.storeName, // duplicate
        address: currentStore.address,
        area: currentStore.area,
        city: currentStore.city,
        state: currentStore.state,
        pincode: currentStore.pincode,
        phone: currentStore.phone,
        whatsapp: currentStore.whatsapp,
        email: currentStore.email,
        googleMapsUrl: currentStore.googleMapsUrl,
        mapUrl: currentStore.googleMapsUrl, // duplicate
        latitude: Number(currentStore.latitude || 0),
        longitude: Number(currentStore.longitude || 0),
        openingTime: currentStore.openingTime,
        closingTime: currentStore.closingTime,
        weeklyOff: currentStore.weeklyOff,
        hours: `${currentStore.openingTime} - ${currentStore.closingTime} (${currentStore.weeklyOff ? 'Off: ' + currentStore.weeklyOff : 'No weekly off'})`,
        workingHours: `${currentStore.openingTime} - ${currentStore.closingTime} (${currentStore.weeklyOff ? 'Off: ' + currentStore.weeklyOff : 'No weekly off'})`, // duplicate
        image: currentStore.image,
        imageUrl: currentStore.image, // duplicate
        status: currentStore.status,
        isActive: currentStore.status === 'active', // duplicate
        displayOrder: Number(currentStore.displayOrder || 1)
      };

      if (!isFirebaseConfigured || !db) {
        // Offline preview emulation
        if (currentStore.id && !currentStore.id.startsWith('mock-')) {
          setStores(prev => prev.map(s => s.id === currentStore.id ? { ...currentStore, ...payload } : s));
        } else {
          const newId = `emulated-store-${Date.now()}`;
          setStores(prev => [...prev, { ...currentStore, id: newId, ...payload }]);
        }
        setSuccessMsg('Showroom saved successfully in offline demo mode!');
        setIsEditing(false);
        return;
      }

      const storesCol = collection(db, 'stores');
      if (currentStore.id) {
        // Update document
        const docRef = doc(db, 'stores', currentStore.id);
        await updateDoc(docRef, payload as any);
        setSuccessMsg(`Showroom branch "${currentStore.storeName}" updated successfully!`);
      } else {
        // Create document
        await addDoc(storesCol, payload);
        setSuccessMsg(`Showroom branch "${currentStore.storeName}" added successfully!`);
      }

      setIsEditing(false);
      await loadStores();
    } catch (err: any) {
      console.error('Error saving showroom:', err);
      setErrorMsg(err.message || 'Failed to save showroom branch to Firestore.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (store: StoreData) => {
    if (!window.confirm(`Are you sure you want to permanently delete showroom branch "${store.storeName}"?`)) {
      return;
    }

    try {
      if (!isFirebaseConfigured || !db) {
        setStores(prev => prev.filter(s => s.id !== store.id));
        setSuccessMsg('Showroom deleted from offline demo state.');
        return;
      }

      const docRef = doc(db, 'stores', store.id!);
      await deleteDoc(docRef);
      setSuccessMsg(`Showroom branch "${store.storeName}" deleted successfully.`);
      await loadStores();
    } catch (err: any) {
      console.error('Error deleting showroom:', err);
      setErrorMsg('Failed to delete store. Ensure correct Firestore write permissions.');
    }
  };

  return (
    <div className="space-y-6" id="admin-stores-management">
      <div className="flex items-center justify-between border-b border-stone-800 pb-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-stone-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-500" />
            <span>Showroom Register</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Configure branches, contact telephone lists, operational timings, and Google Maps GPS coordinates.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={handleAddNewClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-sans text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer shadow-md shadow-amber-600/10"
            id="add-store-btn"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Add Showroom</span>
          </button>
        )}
      </div>

      {/* Messaging Banners */}
      {successMsg && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs rounded flex items-center gap-2" id="store-success-msg">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-950/25 border border-red-500/20 text-red-400 text-xs rounded flex items-center gap-2" id="store-error-msg">
          <X className="w-4 h-4 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading overlay */}
      {loading ? (
        <div className="py-20 text-center space-y-3" id="stores-loader">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-500 tracking-wider">Syncing showroom records...</p>
        </div>
      ) : isEditing ? (
        /* CRUD Form Panel */
        <form onSubmit={handleSubmit} className="space-y-6" id="store-crud-form">
          <div className="bg-stone-900/40 border border-stone-800 rounded p-6 space-y-6">
            <h3 className="text-sm uppercase tracking-widest font-bold text-stone-300 border-b border-stone-800 pb-2">
              {currentStore.id ? 'Edit Showroom Branch' : 'Register New Showroom'}
            </h3>

            {/* Grid 1: Core details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Showroom Name <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bowbazar flagship Showroom"
                  value={currentStore.storeName}
                  onChange={(e) => handleFieldChange('storeName', e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Display Order Sequence <span className="text-stone-500">(1, 2, 3...)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={currentStore.displayOrder}
                  onChange={(e) => handleFieldChange('displayOrder', parseInt(e.target.value) || 1)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Publish Status
                </label>
                <select
                  value={currentStore.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-semibold"
                >
                  <option value="active">Active Showroom</option>
                  <option value="inactive">Temporarily Closed</option>
                </select>
              </div>
            </div>

            {/* Grid 2: Operational Contacts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 33 2241 9876"
                  value={currentStore.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  WhatsApp Direct Line
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 9876543210"
                  value={currentStore.whatsapp}
                  onChange={(e) => handleFieldChange('whatsapp', e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. bowbazar@parasmoni.com"
                  value={currentStore.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Weekly Off Day
                </label>
                <select
                  value={currentStore.weeklyOff}
                  onChange={(e) => handleFieldChange('weeklyOff', e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium"
                >
                  <option value="Sunday">Sunday (Standard)</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="None">No Weekly Off</option>
                </select>
              </div>
            </div>

            {/* Grid 3: Operational Timings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Opening Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 11:30 AM"
                  value={currentStore.openingTime}
                  onChange={(e) => handleFieldChange('openingTime', e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Closing Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 08:00 PM"
                  value={currentStore.closingTime}
                  onChange={(e) => handleFieldChange('closingTime', e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium font-mono"
                />
              </div>
            </div>

            {/* Section: Showroom Location Structure */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-400 border-b border-stone-850 pb-1.5">
                Postal Details & Regional Filters
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                    Showroom Address <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 123, Bowbazar Street, Near Lalbazar"
                    value={currentStore.address}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                    Area / Landmark
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bowbazar"
                    value={currentStore.area}
                    onChange={(e) => handleFieldChange('area', e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                    City <span className="text-stone-500">(dropdown index)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kolkata"
                    value={currentStore.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                    Pincode
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 700012"
                    value={currentStore.pincode}
                    onChange={(e) => handleFieldChange('pincode', e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Grid 4: Google Maps integration */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-400 border-b border-stone-850 pb-1.5">
                Google Maps GPS Link & Coordinates
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                    Google Maps URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://maps.google.com/?q=..."
                    value={currentStore.googleMapsUrl}
                    onChange={(e) => handleFieldChange('googleMapsUrl', e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                    GPS Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 22.5735"
                    value={currentStore.latitude}
                    onChange={(e) => handleFieldChange('latitude', parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                    GPS Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 88.3585"
                    value={currentStore.longitude}
                    onChange={(e) => handleFieldChange('longitude', parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section: Upload Photo */}
            <div className="space-y-2">
              <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                Showroom Exterior Display Photo <span className="text-amber-500">*</span>
              </label>
              <ImageUploader
                id="store-photo-uploader"
                value={currentStore.image}
                onChange={(val) => handleFieldChange('image', val)}
                folder={IMAGEKIT_FOLDERS.stores}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold uppercase tracking-wider rounded transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-stone-950 text-xs font-bold uppercase tracking-wider rounded shadow-md transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 shrink-0" />
                  <span>Save Location</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Showrooms Data Grid Display */
        <div className="space-y-4" id="store-records-grid">
          {stores.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-stone-850 rounded">
              <MapPin className="w-8 h-8 text-stone-600 mx-auto mb-2" />
              <p className="text-xs text-stone-500">No showrooms registered in directory.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stores.map((store) => (
                <div 
                  key={store.id}
                  className={`bg-stone-900/30 border rounded overflow-hidden flex flex-col md:flex-row transition-all ${
                    store.status === 'inactive' ? 'border-stone-850 opacity-65' : 'border-stone-800 hover:border-stone-700'
                  }`}
                  id={`store-card-${store.id}`}
                >
                  {/* Photo cover */}
                  <div className="w-full md:w-40 h-44 bg-stone-950 relative shrink-0">
                    {store.image ? (
                      <img
                        src={store.image}
                        alt={store.storeName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-700">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-stone-950/85 text-amber-500 font-bold font-mono text-[9px] tracking-wider border border-stone-800">
                      Seq #{store.displayOrder}
                    </span>
                  </div>

                  {/* Core copy */}
                  <div className="p-5 flex-1 flex flex-col justify-between min-w-0">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-serif text-sm font-bold text-stone-100 truncate">
                          {store.storeName}
                        </h4>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0 ${
                          store.status === 'active' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-stone-800 text-stone-500'
                        }`}>
                          {store.status === 'active' ? 'Live' : 'Closed'}
                        </span>
                      </div>

                      <p className="text-[11px] text-stone-400 leading-relaxed line-clamp-2">
                        {store.address}
                      </p>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-2 text-[10px] text-stone-400 border-t border-stone-850">
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{store.phone || 'No phone'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{store.openingTime || '11:30 AM'} - {store.closingTime || '08:00 PM'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate col-span-2 text-stone-500">
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">GPS: {store.latitude || 0}, {store.longitude || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action controls */}
                    <div className="flex items-center justify-end gap-2.5 pt-4 mt-auto border-t border-stone-850/60">
                      {store.googleMapsUrl && (
                        <a
                          href={store.googleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mr-auto p-1.5 hover:bg-stone-800 rounded text-stone-400 hover:text-amber-500 transition-colors"
                          title="Open coordinates in maps"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleEditClick(store)}
                        className="p-1.5 bg-stone-800/80 hover:bg-stone-800 rounded text-stone-300 hover:text-amber-500 cursor-pointer transition-colors"
                        title="Edit properties"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(store)}
                        className="p-1.5 bg-stone-800/80 hover:bg-red-950/45 rounded text-stone-400 hover:text-red-400 cursor-pointer transition-colors"
                        title="Delete branch register"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
