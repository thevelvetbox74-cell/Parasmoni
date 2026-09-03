/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Banner Management
 */

import React, { useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  X, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Calendar, 
  AlertCircle, 
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';
import { IMAGEKIT_FOLDERS } from '../imagekit/client';
import { SmartLinkPicker } from '../components/SmartLinkPicker';
import { mockBanners } from '../data/mockData';

export function AdminBanners(): React.JSX.Element {
  const { user } = useAuth();
  
  // UI View Mode State
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    subtitle: '',
    desktopImage: '',
    mobileImage: '',
    mediaType: 'image' as 'image' | 'video',
    desktopVideo: '',
    mobileVideo: '',
    buttonText: 'EXPLORE MASTERPIECES',
    buttonLink: '/catalog',
    displayOrder: 1,
    status: 'active' as 'active' | 'inactive',
    startDate: '',
    endDate: ''
  });

  // Load Banners on Mount
  useEffect(() => {
    async function loadBanners() {
      try {
        setLoading(true);
        setError(null);

        if (!isFirebaseConfigured) {
          // Convert Mock Banners to include schema properties
          const normalizedMocks = mockBanners.map((b, idx) => ({
            id: b.id,
            title: b.title,
            subtitle: b.subtitle || '',
            desktopImage: b.image,
            mobileImage: b.image, // fallback
            mediaType: b.mediaType || 'image',
            desktopVideo: b.desktopVideo || '',
            mobileVideo: b.mobileVideo || '',
            buttonText: b.buttonText || 'EXPLORE MASTERPIECES',
            buttonLink: b.buttonLink || '/catalog',
            displayOrder: idx + 1,
            status: 'active',
            startDate: '',
            endDate: ''
          }));
          setBanners(normalizedMocks);
          setLoading(false);
          return;
        }

        const bannersCol = collection(db, 'banners');
        const snapshot = await getDocs(bannersCol);
        
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || '',
            subtitle: data.subtitle || '',
            desktopImage: data.imageUrl || data.desktopImage || data.image || '',
            mobileImage: data.mobileImage || data.imageUrl || data.desktopImage || data.image || '',
            mediaType: data.mediaType || 'image',
            desktopVideo: data.desktopVideo || '',
            mobileVideo: data.mobileVideo || '',
            buttonText: data.buttonText || 'EXPLORE MASTERPIECES',
            buttonLink: data.linkUrl || data.buttonLink || '/catalog',
            displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 1,
            status: data.status || 'active',
            startDate: data.startDate || '',
            endDate: data.endDate || ''
          };
        });

        // Sort by display order asc
        items.sort((a, b) => a.displayOrder - b.displayOrder);
        setBanners(items);
      } catch (err: any) {
        console.error('Error fetching banners:', err);
        setError('Failed to fetch banners: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    loadBanners();
  }, [view]);

  // Handle Edit Action Setup
  const startEdit = (banner: any) => {
    setFormData({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      desktopImage: banner.desktopImage || '',
      mobileImage: banner.mobileImage || '',
      mediaType: banner.mediaType || 'image',
      desktopVideo: banner.desktopVideo || '',
      mobileVideo: banner.mobileVideo || '',
      buttonText: banner.buttonText,
      buttonLink: banner.buttonLink,
      displayOrder: banner.displayOrder,
      status: banner.status,
      startDate: banner.startDate || '',
      endDate: banner.endDate || ''
    });
    setError(null);
    setSuccess(null);
    setView('edit');
  };

  // Setup Add Action Mode
  const startAdd = () => {
    const nextOrder = banners.length > 0 
      ? Math.max(...banners.map(b => b.displayOrder)) + 1 
      : 1;

    setFormData({
      id: '',
      title: '',
      subtitle: '',
      desktopImage: '',
      mobileImage: '',
      mediaType: 'image',
      desktopVideo: '',
      mobileVideo: '',
      buttonText: 'EXPLORE MASTERPIECES',
      buttonLink: '/catalog',
      displayOrder: nextOrder,
      status: 'active',
      startDate: '',
      endDate: ''
    });
    setError(null);
    setSuccess(null);
    setView('add');
  };

  // Toggle Publish Status
  const toggleStatus = async (banner: any) => {
    const newStatus = banner.status === 'active' ? 'inactive' : 'active';
    try {
      if (isFirebaseConfigured && db) {
        const docRef = doc(db, 'banners', banner.id);
        await setDoc(docRef, {
          ...banner,
          status: newStatus,
          imageUrl: banner.desktopImage, // backward compatibility
          linkUrl: banner.buttonLink, // backward compatibility
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email || 'admin'
        }, { merge: true });
      }

      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, status: newStatus } : b));
      setSuccess(`Banner updated successfully.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Failed to toggle status: ${err.message}`);
    }
  };

  // Shift Display Order up or down
  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === banners.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const currentBanner = banners[index];
    const neighborBanner = banners[targetIndex];

    // Swap orders
    const currentOrder = currentBanner.displayOrder;
    const neighborOrder = neighborBanner.displayOrder;

    // Local update first
    const updatedBanners = [...banners];
    updatedBanners[index] = { ...currentBanner, displayOrder: neighborOrder };
    updatedBanners[targetIndex] = { ...neighborBanner, displayOrder: currentOrder };
    updatedBanners.sort((a, b) => a.displayOrder - b.displayOrder);
    setBanners(updatedBanners);

    // Save to Firestore
    try {
      if (isFirebaseConfigured && db) {
        // We write individual updates to ensure compatibility with standard Firestore setups
        const refA = doc(db, 'banners', currentBanner.id);
        const refB = doc(db, 'banners', neighborBanner.id);

        await Promise.all([
          setDoc(refA, { ...currentBanner, displayOrder: neighborOrder, imageUrl: currentBanner.desktopImage }, { merge: true }),
          setDoc(refB, { ...neighborBanner, displayOrder: currentOrder, imageUrl: neighborBanner.desktopImage }, { merge: true })
        ]);
      }
      setSuccess(`Sequence reordered successfully.`);
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      setError(`Failed to save reordered sequence: ${err.message}`);
    }
  };

  // Delete Banner
  const handleDelete = async (banner: any) => {
    if (!window.confirm(`Are you sure you want to delete banner: "${banner.title || 'Untitled'}"?`)) {
      return;
    }

    try {
      if (isFirebaseConfigured && db) {
        await deleteDoc(doc(db, 'banners', banner.id));
      }

      setBanners(prev => prev.filter(b => b.id !== banner.id));
      setSuccess(`Successfully deleted banner.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Failed to delete banner: ${err.message}`);
    }
  };

  // Form Submit (Save / Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.desktopImage) {
      setError('Desktop ImageKit asset is required.');
      return;
    }

    setSaving(true);
    const targetId = formData.id || 'banner_' + Math.random().toString(36).substr(2, 9);
    
    // Formulate legacy and new properties for full safety
    const payload = {
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim(),
      desktopImage: formData.desktopImage,
      mobileImage: formData.mobileImage || formData.desktopImage,
      mediaType: formData.mediaType,
      desktopVideo: formData.desktopVideo,
      mobileVideo: formData.mobileVideo,
      imageUrl: formData.desktopImage, // legacy mapping
      image: formData.desktopImage, // legacy mapping
      buttonText: formData.buttonText.trim(),
      buttonLink: formData.buttonLink.trim(),
      linkUrl: formData.buttonLink.trim(), // legacy mapping
      displayOrder: Number(formData.displayOrder || 1),
      status: formData.status,
      startDate: formData.startDate,
      endDate: formData.endDate,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.email || 'admin'
    };

    try {
      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'banners', targetId), payload, { merge: true });
      }

      setSuccess(formData.id ? 'Banner updated successfully.' : 'New banner registered successfully!');
      setTimeout(() => {
        setView('list');
      }, 1000);
    } catch (err: any) {
      setError(`Failed to save banner: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" id="banner-management-module">
      
      {/* Alert Notification Cards */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 rounded flex items-start gap-3 text-xs" id="banners-error-card">
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 rounded flex items-start gap-3 text-xs animate-pulse" id="banners-success-card">
          <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-emerald-500" />
          <p className="leading-relaxed">{success}</p>
        </div>
      )}

      {/* VIEW: LIST (Show dynamic reorderable billboard catalog) */}
      {view === 'list' && (
        <div className="space-y-4" id="banners-list-view">
          
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-100">Showcase Billboards</h2>
              <p className="text-[10px] text-stone-500 font-sans mt-0.5">Define landing slider highlights and temporal bridal announcements.</p>
            </div>
            <button
              onClick={startAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold uppercase rounded cursor-pointer transition-all tracking-wider"
              id="btn-add-banner"
            >
              <Plus className="w-4 h-4" />
              <span>Register Banner</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-stone-500 text-xs" id="banners-loader">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Retrieving billboards sequence...</span>
            </div>
          ) : banners.length === 0 ? (
            <div className="py-12 text-center bg-stone-900/30 border border-stone-800 rounded p-6 text-stone-500 text-xs space-y-2">
              <ImageIcon className="w-8 h-8 text-stone-600 mx-auto" />
              <p>No promotional billboards registered in showroom.</p>
              <button onClick={startAdd} className="text-amber-500 font-bold hover:underline">Add the first banner now →</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4" id="banners-cards-deck">
              {banners.map((b, index) => {
                const isInactive = b.status === 'inactive';
                
                return (
                  <div 
                    key={b.id} 
                    className={`bg-stone-900 border transition-all rounded p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isInactive ? 'border-stone-800/50 bg-stone-900/40 opacity-70' : 'border-stone-800 hover:border-stone-700/80 bg-stone-900/80'
                    }`}
                    id={`banner-row-${b.id}`}
                  >
                    {/* Cover Art and Info */}
                    <div className="flex gap-4 items-center flex-1 min-w-0">
                      <div className="relative w-24 h-14 bg-stone-950 border border-stone-800 rounded overflow-hidden shrink-0">
                        {b.desktopImage ? (
                          <img 
                            src={b.desktopImage} 
                            alt="Banner Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-700">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[8px] font-mono font-bold text-amber-500 border border-stone-800/50">
                          #{b.displayOrder}
                        </span>
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-serif font-bold text-stone-100 text-sm truncate">{b.title || 'Untitled Banner'}</h4>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase font-sans border ${
                            isInactive 
                              ? 'bg-stone-950 text-stone-500 border-stone-800' 
                              : 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                        {b.subtitle && <p className="text-stone-400 text-[10px] leading-relaxed line-clamp-1">{b.subtitle}</p>}
                        <div className="flex gap-4 text-[9px] text-stone-500 font-mono">
                          <span className="flex items-center gap-1">
                            <LinkIcon className="w-3 h-3 text-stone-600" />
                            <span className="truncate max-w-xs">{b.buttonLink}</span>
                          </span>
                          {(b.startDate || b.endDate) && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-stone-600" />
                              <span>{b.startDate || 'Anytime'} to {b.endDate || 'Forever'}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Controls & Sequence Ordering arrows */}
                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      
                      {/* Arrows */}
                      <div className="flex items-center bg-stone-950 border border-stone-800/80 rounded p-0.5">
                        <button
                          onClick={() => moveOrder(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-stone-400 hover:text-amber-500 disabled:opacity-30 disabled:hover:text-stone-400 transition-colors cursor-pointer"
                          title="Shift Sequence Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <div className="h-4 w-px bg-stone-800" />
                        <button
                          onClick={() => moveOrder(index, 'down')}
                          disabled={index === banners.length - 1}
                          className="p-1 text-stone-400 hover:text-amber-500 disabled:opacity-30 disabled:hover:text-stone-400 transition-colors cursor-pointer"
                          title="Shift Sequence Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Publish / Draft Inline toggler */}
                      <button
                        onClick={() => toggleStatus(b)}
                        className={`p-1.5 rounded border text-xs transition-colors cursor-pointer ${
                          isInactive 
                            ? 'border-stone-800 hover:border-stone-700 hover:bg-stone-900 text-stone-400 hover:text-stone-100' 
                            : 'border-stone-800 hover:border-stone-700 hover:bg-stone-900 text-amber-500 hover:text-amber-400'
                        }`}
                        title={isInactive ? 'Enable Banner' : 'Disable Banner'}
                      >
                        {isInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => startEdit(b)}
                        className="p-1.5 bg-stone-950 border border-stone-800 hover:border-amber-500 hover:text-amber-400 rounded text-stone-300 transition-colors cursor-pointer"
                        title="Edit Banner Properties"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(b)}
                        className="p-1.5 bg-stone-950 border border-stone-850 hover:border-red-900 hover:text-red-400 rounded text-stone-400 transition-colors cursor-pointer"
                        title="Delete Banner Permanently"
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

      {/* VIEW: ADD / EDIT FORM (Detailed slide parameters) */}
      {(view === 'add' || view === 'edit') && (
        <form onSubmit={handleSave} className="space-y-6" id="banner-form">
          
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-100">
                {view === 'add' ? 'Register New Billboard' : 'Edit Billboard Parameters'}
              </h2>
              <p className="text-[10px] text-stone-500 mt-0.5"> handcraft display layouts and targeting anchors for seasonal promotional grids.</p>
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
              
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Banner Headline Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Filigree Kundan Set"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-200 placeholder-stone-600 font-sans"
                />
              </div>

              {/* Subtitle / Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Secondary Tagline Copy</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Handmade Kolkata filigree work passed down since 1974."
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-200 placeholder-stone-600 font-sans resize-none"
                />
              </div>

              {/* Button Customization Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Button Text */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Button Text Call-To-Action</label>
                  <input
                    type="text"
                    placeholder="e.g. EXPLORE BRIDAL MASTERPIECES"
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-200 font-sans"
                  />
                </div>

                {/* Button Link */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Button Redirection Route Link</label>
                  <SmartLinkPicker
                    value={formData.buttonLink}
                    onChange={(newUrl) => setFormData({ ...formData, buttonLink: newUrl })}
                  />
                </div>

              </div>

              {/* Campaign Schedule Period */}
              <div className="p-4 bg-stone-950/40 border border-stone-850 rounded space-y-4">
                <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest block border-b border-stone-850 pb-1.5">Target Campaign Schedule (Optional)</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Campaign Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-300 font-sans"
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Campaign Expiry Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-600 focus:outline-hidden text-xs rounded text-stone-300 font-sans"
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
                    <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Display Order Index</label>
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
                      <option value="inactive">Inactive (Draft)</option>
                    </select>
                  </div>

                </div>

              </div>

              {/* Media Type Selector */}
              <div className="space-y-2 border border-stone-800 p-4 rounded bg-stone-950/40">
                <label className="text-[10px] text-stone-300 font-bold uppercase tracking-wider block">
                  Banner Media Format
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                    <input
                      type="radio"
                      name="mediaType"
                      value="image"
                      checked={formData.mediaType === 'image'}
                      onChange={() => setFormData({ ...formData, mediaType: 'image' })}
                      className="text-amber-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Standard Image</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                    <input
                      type="radio"
                      name="mediaType"
                      value="video"
                      checked={formData.mediaType === 'video'}
                      onChange={() => setFormData({ ...formData, mediaType: 'video' })}
                      className="text-amber-600 focus:ring-0 cursor-pointer"
                    />
                    <span>High-Definition Video</span>
                  </label>
                </div>
              </div>

              {formData.mediaType === 'image' ? (
                <>
                  {/* Desktop Billboard Image */}
                  <div className="space-y-2 border border-stone-800 p-4 rounded bg-stone-950/40">
                    <label className="text-[10px] text-stone-300 font-bold uppercase tracking-wider block">
                      Desktop Banner Image (recommended size: e.g. 1600x600px or similar wide aspect ratio) *
                    </label>
                    <p className="text-[10px] text-stone-500 font-sans leading-normal">
                      💡 This image will be shown to visitors browsing on desktop/laptop screens.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="flex-1 w-full">
                        <ImageUploader
                          id="desktop-image-uploader"
                          multiple={false}
                          value={formData.desktopImage}
                          onChange={(val) => setFormData({ ...formData, desktopImage: val as string })}
                          folder={IMAGEKIT_FOLDERS.banners}
                        />
                      </div>
                      {formData.desktopImage && (
                        <div className="p-1 border border-stone-800 rounded bg-stone-950 shrink-0 w-32">
                          <img 
                            src={formData.desktopImage} 
                            alt="Desktop slide preview" 
                            className="w-full h-16 object-cover rounded-sm"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Portrait Image */}
                  <div className="space-y-2 border border-stone-800 p-4 rounded bg-stone-950/40">
                    <label className="text-[10px] text-stone-300 font-bold uppercase tracking-wider block">
                      Mobile Banner Image (recommended size: e.g. 800x1000px or a taller/portrait-friendly aspect ratio suited for phone screens)
                    </label>
                    <p className="text-[10px] text-stone-500 font-sans leading-normal">
                      💡 This image will be shown to visitors browsing on mobile phones.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="flex-1 w-full">
                        <ImageUploader
                          id="mobile-image-uploader"
                          multiple={false}
                          value={formData.mobileImage}
                          onChange={(val) => setFormData({ ...formData, mobileImage: val as string })}
                          folder={IMAGEKIT_FOLDERS.banners}
                        />
                      </div>
                      {formData.mobileImage ? (
                        <div className="p-1 border border-stone-800 rounded bg-stone-950 shrink-0 w-32">
                          <img 
                            src={formData.mobileImage} 
                            alt="Mobile portrait preview" 
                            className="w-full h-16 object-cover rounded-sm"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="p-2 border border-amber-900/40 rounded bg-amber-950/20 shrink-0 w-full sm:w-44 text-[10px] text-amber-500 font-sans">
                          ⚠️ No mobile image set — desktop image will be used as fallback on phones.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Desktop Banner Video */}
                  <div className="space-y-2 border border-stone-800 p-4 rounded bg-stone-950/40">
                    <label className="text-[10px] text-stone-300 font-bold uppercase tracking-wider block">
                      Desktop Banner Video (recommended format: MP4 with wide aspect ratio) *
                    </label>
                    <p className="text-[10px] text-stone-500 font-sans leading-normal">
                      💡 This video will be shown to visitors browsing on desktop/laptop screens.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="flex-1 w-full">
                        <ImageUploader
                          id="desktop-video-uploader"
                          multiple={false}
                          value={formData.desktopVideo}
                          onChange={(val) => setFormData({ ...formData, desktopVideo: val as string })}
                          folder={IMAGEKIT_FOLDERS.banners}
                        />
                      </div>
                      {formData.desktopVideo && (
                        <div className="p-1 border border-stone-800 rounded bg-stone-950 shrink-0 w-32">
                          <video 
                            src={formData.desktopVideo} 
                            className="w-full h-16 object-cover rounded-sm"
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                            onEnded={(e) => {
                              e.currentTarget.currentTime = 0;
                              e.currentTarget.play().catch(() => {});
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Portrait Video */}
                  <div className="space-y-2 border border-stone-800 p-4 rounded bg-stone-950/40">
                    <label className="text-[10px] text-stone-300 font-bold uppercase tracking-wider block">
                      Mobile Banner Video (optional: portrait aspect ratio for mobile screens)
                    </label>
                    <p className="text-[10px] text-stone-500 font-sans leading-normal">
                      💡 This video will be shown to visitors browsing on mobile phones.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="flex-1 w-full">
                        <ImageUploader
                          id="mobile-video-uploader"
                          multiple={false}
                          value={formData.mobileVideo}
                          onChange={(val) => setFormData({ ...formData, mobileVideo: val as string })}
                          folder={IMAGEKIT_FOLDERS.banners}
                        />
                      </div>
                      {formData.mobileVideo ? (
                        <div className="p-1 border border-stone-800 rounded bg-stone-950 shrink-0 w-32">
                          <video 
                            src={formData.mobileVideo} 
                            className="w-full h-16 object-cover rounded-sm"
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                            onEnded={(e) => {
                              e.currentTarget.currentTime = 0;
                              e.currentTarget.play().catch(() => {});
                            }}
                          />
                        </div>
                      ) : (
                        <div className="p-2 border border-amber-900/40 rounded bg-amber-950/20 shrink-0 w-full sm:w-44 text-[10px] text-amber-500 font-sans">
                          ⚠️ No mobile video set — desktop video will be used as fallback on phones.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Optional Poster Image upload for fast first-frame rendering fallback */}
                  <div className="space-y-2 border border-stone-800 p-4 rounded bg-stone-950/40">
                    <label className="text-[10px] text-stone-300 font-bold uppercase tracking-wider block">
                      Fallback Poster Image (Required for list views) *
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="flex-1 w-full">
                        <ImageUploader
                          id="desktop-poster-uploader"
                          multiple={false}
                          value={formData.desktopImage}
                          onChange={(val) => setFormData({ ...formData, desktopImage: val as string })}
                          folder={IMAGEKIT_FOLDERS.banners}
                        />
                      </div>
                      {formData.desktopImage && (
                        <div className="p-1 border border-stone-800 rounded bg-stone-950 shrink-0 w-32">
                          <img 
                            src={formData.desktopImage} 
                            alt="Poster preview" 
                            className="w-full h-16 object-cover rounded-sm"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

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
              id="btn-save-banner"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Synchronizing with Cloud...' : 'Commit Billboard'}</span>
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
