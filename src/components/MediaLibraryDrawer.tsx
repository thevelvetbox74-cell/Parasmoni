/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { uploadToImageKit } from '../imagekit/upload';
import { isSvgFile, convertToWebP } from '../utils/imageConverter';
import { UploadChoiceModal } from './UploadChoiceModal';
import { IMAGEKIT_FOLDERS } from '../imagekit/client';
import { 
  X, 
  Search, 
  Plus, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Check, 
  RefreshCw, 
  Tag, 
  FileCode,
  FolderOpen,
  SlidersHorizontal,
  CloudLightning,
  Video,
  Trash2
} from 'lucide-react';

interface MediaAsset {
  id: string;
  url: string;
  filename: string;
  folder: string;
  uploadDate: string;
  fileId?: string;
  referencedBy: string[];
  type: 'image' | 'video';
  docs?: Array<{ col: string; id: string; field: string }>;
}

interface MediaLibraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  currentValue?: string | string[];
  defaultFolder?: typeof IMAGEKIT_FOLDERS[keyof typeof IMAGEKIT_FOLDERS];
}

export function MediaLibraryDrawer({
  isOpen,
  onClose,
  onSelect,
  currentValue,
  defaultFolder = IMAGEKIT_FOLDERS.products,
}: MediaLibraryDrawerProps): React.JSX.Element | null {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [folderFilter, setFolderFilter] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Image Optimization Choice States
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cast currentValue as flat array for highlight checks
  const selectedUrls = Array.isArray(currentValue) 
    ? currentValue 
    : (currentValue ? [currentValue] : []);

  // Sync / Scan all collections to map active media files
  const fetchAndScanAssets = async () => {
    try {
      setLoading(true);
      setUploadError(null);

      if (!isFirebaseConfigured || !db) {
        // Mock fallback assets when Firebase is offline/unconfigured
        const mockAssets: MediaAsset[] = [
          {
            id: 'mock-1',
            url: 'https://ik.imagekit.io/ugm0ru2xm/parasmoni/products/gold_har_set_1.jpg',
            filename: 'gold_har_set_1.jpg',
            folder: '/parasmoni/products',
            uploadDate: new Date().toISOString(),
            referencedBy: ['Product Detail Page'],
            type: 'image'
          },
          {
            id: 'mock-2',
            url: 'https://ik.imagekit.io/ugm0ru2xm/parasmoni/banners/banner_bridal_kolkata.jpg',
            filename: 'banner_bridal_kolkata.jpg',
            folder: '/parasmoni/banners',
            uploadDate: new Date().toISOString(),
            referencedBy: ['Home Slider Banner'],
            type: 'image'
          },
          {
            id: 'mock-3',
            url: 'https://ik.imagekit.io/ugm0ru2xm/parasmoni/stores/bowbazar_facade.jpg',
            filename: 'bowbazar_facade.jpg',
            folder: '/parasmoni/stores',
            uploadDate: new Date().toISOString(),
            referencedBy: ['Bowbazar Showroom'],
            type: 'image'
          }
        ];
        setAssets(mockAssets);
        setLoading(false);
        return;
      }

      // 1. Fetch direct 'media' uploads collection
      const mediaMap = new Map<string, any>();
      try {
        const mediaSnapshot = await getDocs(collection(db, 'media'));
        mediaSnapshot.docs.forEach(d => {
          const data = d.data();
          if (data.url) {
            mediaMap.set(data.url.split('?')[0], {
              id: d.id,
              fileId: data.fileId || '',
              uploadDate: data.uploadDate || data.createdAt || '',
              folder: data.folder || '/parasmoni/uploads'
            });
          }
        });
      } catch (err) {
        console.warn('Media library log not populated yet.');
      }

      // Track all unique URLs and reference points
      const uniqueUrls = new Map<string, { referencedBy: Set<string>; docs: Array<{ col: string; id: string; field: string }> }>();

      const registerReference = (url: string, sectionLabel: string, col: string, docId: string, field: string) => {
        if (!url || !url.startsWith('http')) return;
        const base = url.split('?')[0];
        if (!uniqueUrls.has(base)) {
          uniqueUrls.set(base, {
            referencedBy: new Set([sectionLabel]),
            docs: [{ col, id: docId, field }]
          });
        } else {
          uniqueUrls.get(base)!.referencedBy.add(sectionLabel);
          uniqueUrls.get(base)!.docs.push({ col, id: docId, field });
        }
      };

      // 2. Scan products
      try {
        const pSnap = await getDocs(collection(db, 'products'));
        pSnap.docs.forEach(d => {
          const data = d.data();
          const label = `Product: ${data.name || d.id}`;
          if (data.imageUrl) registerReference(data.imageUrl, label, 'products', d.id, 'imageUrl');
          if (Array.isArray(data.images)) {
            data.images.forEach((img: string) => {
              if (img) registerReference(img, `${label} (Gallery)`, 'products', d.id, 'images');
            });
          }
        });
      } catch (e) {}

      // 3. Scan banners
      try {
        const bSnap = await getDocs(collection(db, 'banners'));
        bSnap.docs.forEach(d => {
          const data = d.data();
          const label = `Banner: ${data.title || d.id}`;
          if (data.imageUrl) registerReference(data.imageUrl, label, 'banners', d.id, 'imageUrl');
          if (data.image) registerReference(data.image, label, 'banners', d.id, 'image');
        });
      } catch (e) {}

      // 4. Scan categories & collections
      try {
        const cSnap = await getDocs(collection(db, 'collections'));
        cSnap.docs.forEach(d => {
          const data = d.data();
          if (data.imageUrl) registerReference(data.imageUrl, `Collection: ${data.name || d.id}`, 'collections', d.id, 'imageUrl');
        });
      } catch (e) {}

      // 4.1 Scan categories directly
      try {
        const catSnap = await getDocs(collection(db, 'categories'));
        catSnap.docs.forEach(d => {
          const data = d.data();
          if (data.imageUrl) registerReference(data.imageUrl, `Category: ${data.name || d.id}`, 'categories', d.id, 'imageUrl');
        });
      } catch (e) {}

      // 5. Scan showrooms / stores
      try {
        const sSnap = await getDocs(collection(db, 'stores'));
        sSnap.docs.forEach(d => {
          const data = d.data();
          const label = `Store: ${data.storeName || d.id}`;
          if (data.image) registerReference(data.image, label, 'stores', d.id, 'image');
          if (data.imageUrl) registerReference(data.imageUrl, label, 'stores', d.id, 'imageUrl');
        });
      } catch (e) {}

      // 6. Scan website settings
      try {
        const wSnap = await getDocs(collection(db, 'websiteSettings'));
        wSnap.docs.forEach(d => {
          const data = d.data();
          if (data.logoUrl) registerReference(data.logoUrl, 'Branding Logo', 'websiteSettings', d.id, 'logoUrl');
          if (data.logo) registerReference(data.logo, 'Branding Logo', 'websiteSettings', d.id, 'logo');
          if (data.favicon) registerReference(data.favicon, 'Website Favicon', 'websiteSettings', d.id, 'favicon');
          if (data.categoryShowcaseCoverImage) registerReference(data.categoryShowcaseCoverImage, 'Category Showcase Cover', 'websiteSettings', d.id, 'categoryShowcaseCoverImage');
        });
      } catch (e) {}

      // Assemble all compiled assets
      const compiledAssets: MediaAsset[] = [];

      uniqueUrls.forEach((val, url) => {
        let filename = 'untitled_asset';
        let folder = '/parasmoni/orphans';

        try {
          const parts = new URL(url).pathname.split('/');
          filename = parts[parts.length - 1];
          if (parts.length > 2) {
            folder = '/' + parts.slice(1, parts.length - 1).join('/');
          }
        } catch (e) {
          filename = url.split('/').pop() || 'untitled_asset';
        }

        const logRecord = mediaMap.get(url);
        const lowerName = filename.toLowerCase();
        const type: 'image' | 'video' = (lowerName.endsWith('.mp4') || lowerName.endsWith('.mov') || lowerName.endsWith('.webm') || lowerName.endsWith('.m4v')) 
          ? 'video' 
          : 'image';

        compiledAssets.push({
          id: logRecord?.id || `scanned-${Math.random().toString(36).substr(2, 9)}`,
          url,
          filename,
          folder,
          uploadDate: logRecord?.uploadDate || new Date().toISOString(),
          fileId: logRecord?.fileId || '',
          referencedBy: Array.from(val.referencedBy),
          type,
          docs: val.docs
        });
      });

      // Add files from 'media' logs that were uploaded but not linked to any page
      mediaMap.forEach((meta, url) => {
        if (!uniqueUrls.has(url)) {
          let filename = 'uploaded_file';
          try {
            filename = new URL(url).pathname.split('/').pop() || 'uploaded_file';
          } catch (e) {}

          const lowerName = filename.toLowerCase();
          const type: 'image' | 'video' = (lowerName.endsWith('.mp4') || lowerName.endsWith('.mov') || lowerName.endsWith('.webm') || lowerName.endsWith('.m4v')) 
            ? 'video' 
            : 'image';

          compiledAssets.push({
            id: meta.id,
            url,
            filename,
            folder: meta.folder || '/parasmoni/uploads',
            uploadDate: meta.uploadDate || new Date().toISOString(),
            fileId: meta.fileId,
            referencedBy: [],
            type
          });
        }
      });

      // Sort by upload date descending
      compiledAssets.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
      setAssets(compiledAssets);
    } catch (err) {
      console.error('Error compiling asset list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAndScanAssets();
    }
  }, [isOpen]);

  // Handle uploading new file directly inside the side drawer
  const handleUploadNewFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isVideoFile = file.type.startsWith('video/');
    const isImageFile = file.type.startsWith('image/');

    if (!isVideoFile && !isImageFile) {
      setUploadError('Invalid file format. Please upload an image or video file.');
      return;
    }

    // Limit image size to 5MB, video to 15MB for fast serverless handling
    const limitSize = isVideoFile ? 15 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > limitSize) {
      setUploadError(`File is too large. Max allowed is ${isVideoFile ? '15MB' : '5MB'}.`);
      return;
    }

    if (isImageFile) {
      setPendingFiles([file]);
      setIsChoiceModalOpen(true);
    } else {
      executeUploadDirect([file], 'raw');
    }
  };

  const handleChoiceDecision = async (mode: 'raw' | 'webp') => {
    setIsChoiceModalOpen(false);
    const filesToUpload = [...pendingFiles];
    setPendingFiles([]);
    await executeUploadDirect(filesToUpload, mode);
  };

  const handleChoiceCancel = () => {
    setIsChoiceModalOpen(false);
    setPendingFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const executeUploadDirect = async (filesToUpload: File[], mode: 'raw' | 'webp') => {
    if (filesToUpload.length === 0) return;
    let file = filesToUpload[0];
    const isVideoFile = file.type.startsWith('video/');
    const isImageFile = file.type.startsWith('image/');

    try {
      setUploading(true);
      setUploadProgress(20);
      setUploadError(null);

      // Perform conversion if applicable
      if (mode === 'webp' && isImageFile && !isSvgFile(file)) {
        setUploadProgress(40);
        file = await convertToWebP(file);
      }

      // Perform direct ImageKit upload
      const result = await uploadToImageKit(file, defaultFolder);
      setUploadProgress(70);

      // Record to dedicated 'media' collection in Firestore
      if (isFirebaseConfigured && db) {
        const mediaCol = collection(db, 'media');
        const customId = `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const cleanUrl = result.url.split('?')[0];

        await setDoc(doc(mediaCol, customId), {
          url: cleanUrl,
          fileId: result.fileId,
          filename: result.name,
          folder: defaultFolder,
          createdAt: new Date().toISOString(),
          uploadDate: new Date().toISOString(),
          type: isVideoFile ? 'video' : 'image'
        });
      }

      setUploadProgress(100);
      
      // Auto-trigger selection with the newly uploaded url
      setTimeout(() => {
        onSelect(result.url);
        onClose();
        setUploading(false);
      }, 500);

    } catch (err: any) {
      console.error('File upload failed inside drawer:', err);
      setUploadError(err.message || 'Failed to complete media upload.');
      setUploading(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle direct asset deletion with automatic database reference cleanup
  const handleDeleteAsset = async (e: React.MouseEvent, asset: MediaAsset) => {
    e.stopPropagation(); // Stop click from selecting the deleted file
    
    const isReferenced = asset.referencedBy && asset.referencedBy.length > 0;
    let confirmPrompt = `Are you sure you want to delete "${asset.filename}" from the vault?`;
    
    if (isReferenced) {
      confirmPrompt += `\n\nWARNING: This file is actively used by:\n${asset.referencedBy.map(r => '• ' + r).join('\n')}\n\nDeleting will clear this media reference from those pages/documents. Continue anyway?`;
    }

    if (!window.confirm(confirmPrompt)) {
      return;
    }

    try {
      setLoading(true);
      setUploadError(null);

      // 1. Delete from ImageKit CDN via secure server proxy
      if (asset.fileId) {
        try {
          await fetch(`/api/imagekit-delete/${asset.fileId}`, { method: 'DELETE' });
        } catch (err) {
          console.warn('ImageKit API binary deletion failed, proceeding with registry cleanup...', err);
        }
      }

      // 2. Delete Firestore 'media' log document
      if (isFirebaseConfigured && db && asset.id && !asset.id.startsWith('scanned-')) {
        try {
          await deleteDoc(doc(db, 'media', asset.id));
        } catch (err) {
          console.error('Failed to delete media log doc:', err);
        }
      }

      // 3. Update referencing host documents to clear/remove the URL
      if (isFirebaseConfigured && db && asset.docs && asset.docs.length > 0) {
        for (const refDoc of asset.docs) {
          try {
            const docRef = doc(db, refDoc.col, refDoc.id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const currentData = docSnap.data();
              if (refDoc.field === 'images' && Array.isArray(currentData.images)) {
                const updatedImages = currentData.images.filter((img: string) => img.split('?')[0] !== asset.url);
                await updateDoc(docRef, { images: updatedImages });
              } else {
                await updateDoc(docRef, { [refDoc.field]: '' });
              }
            }
          } catch (refErr) {
            console.error(`Failed to clear reference in ${refDoc.col}/${refDoc.id}:`, refErr);
          }
        }
      }

      // 4. Update local state
      setAssets(prev => prev.filter(a => a.url !== asset.url));
    } catch (err: any) {
      console.error('Failed to delete media asset:', err);
      setUploadError(err.message || 'Failed to complete media deletion.');
    } finally {
      setLoading(false);
    }
  };

  // Get distinct folders for filtering
  const folderCategories: string[] = ['all', ...(Array.from(new Set(assets.map(a => a.folder as string))) as string[])];

  const getHumanReadableFolder = (f: string) => {
    if (f === 'all') return 'All Sections';
    const segment = f.split('/').pop() || f;
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  // Filter & Search computation
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.referencedBy.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'all' || asset.type === typeFilter;
    const matchesFolder = folderFilter === 'all' || asset.folder === folderFilter;

    return matchesSearch && matchesType && matchesFolder;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs cursor-pointer"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="relative w-full max-w-md sm:max-w-lg h-full bg-stone-900 border-l border-stone-800 shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            {/* Header section */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/40">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-stone-100 uppercase tracking-wider">Digital Asset Vault</h3>
                  <p className="text-[10px] text-stone-400">Select any image or video previously uploaded</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Plus upload action button inside drawer */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-950 rounded-full transition-colors cursor-pointer"
                  title="Upload New Media File to Vault"
                >
                  <Plus className="w-4 h-4 stroke-[3px]" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Hidden Input field for uploads */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUploadNewFile}
              accept="image/*,video/*"
              className="hidden"
            />

            {/* Filter and control panel */}
            <div className="p-4 bg-stone-950/20 border-b border-stone-800/80 space-y-3.5">
              {/* Search bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by filename or referenced page..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-950/50 border border-stone-800 focus:border-amber-500 rounded pl-9 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden font-medium"
                />
              </div>

              {/* Advanced controls */}
              <div className="flex items-center gap-3">
                {/* Section selection */}
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">Section Origin</label>
                  <select
                    value={folderFilter}
                    onChange={(e) => setFolderFilter(e.target.value)}
                    className="w-full px-2 py-1 bg-stone-900 border border-stone-800 focus:border-amber-500 focus:outline-hidden text-[10px] text-stone-300 rounded cursor-pointer font-medium"
                  >
                    {folderCategories.map(f => (
                      <option key={f} value={f}>{getHumanReadableFolder(f)}</option>
                    ))}
                  </select>
                </div>

                {/* Media Type filter */}
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">Media Format</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="w-full px-2 py-1 bg-stone-900 border border-stone-800 focus:border-amber-500 focus:outline-hidden text-[10px] text-stone-300 rounded cursor-pointer font-medium"
                  >
                    <option value="all">All Formats</option>
                    <option value="image">🖼️ Images Only</option>
                    <option value="video">🎥 Videos Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Media list body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-stone-900/40">
              {/* If active uploading is in progress */}
              {uploading && (
                <div className="p-4 bg-stone-950/60 border border-amber-500/20 rounded flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-amber-500 font-bold">
                    <span className="flex items-center gap-1.5 animate-pulse">
                      <CloudLightning className="w-3.5 h-3.5 animate-bounce" />
                      Uploading to CDN Library...
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-stone-900 h-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error reporting banner */}
              {uploadError && (
                <div className="p-3 bg-red-950/30 border border-red-500/10 text-red-400 text-xs rounded">
                  {uploadError}
                </div>
              )}

              {loading ? (
                <div className="py-24 text-center space-y-3">
                  <RefreshCw className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
                  <p className="text-[10px] text-stone-400 tracking-widest font-mono uppercase">Rebuilding registry...</p>
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="py-24 text-center space-y-2 border border-dashed border-stone-800 rounded-lg p-6 bg-stone-950/10">
                  <ImageIcon className="w-8 h-8 text-stone-600 mx-auto" />
                  <p className="text-xs text-stone-400 font-serif italic">No matching media files found in the vault.</p>
                </div>
              ) : (
                /* The media items list grid */
                <div className="grid grid-cols-2 gap-3.5">
                  {filteredAssets.map(asset => {
                    const isSelected = selectedUrls.includes(asset.url);
                    const isVideo = asset.type === 'video';

                    return (
                      <div
                        key={asset.url}
                        onClick={() => {
                          onSelect(asset.url);
                          onClose();
                        }}
                        className={`group relative aspect-square bg-stone-950 border rounded-md overflow-hidden cursor-pointer flex flex-col justify-between transition-all hover:scale-[1.015] hover:shadow-lg hover:shadow-black/40 ${
                          isSelected 
                            ? 'border-amber-500 ring-1 ring-amber-500' 
                            : 'border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        {/* Display Thumbnail */}
                        <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center bg-stone-950">
                          {isVideo ? (
                            <div className="relative w-full h-full flex items-center justify-center bg-stone-950">
                              <video 
                                src={asset.url} 
                                className="w-full h-full object-cover" 
                                autoPlay
                                loop
                                muted
                                preload="metadata"
                                playsInline
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="p-2 bg-black/60 border border-stone-700 rounded-full text-amber-500 group-hover:scale-110 transition-transform">
                                  <VideoIcon className="w-4 h-4 fill-amber-500 text-amber-500" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={asset.url}
                              alt={asset.filename}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          )}

                          {/* Selected checkmark overlay */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 p-1 bg-amber-500 text-stone-950 rounded-full shadow-md z-10">
                              <Check className="w-3 h-3 stroke-[3px]" />
                            </div>
                          )}

                          {/* Delete Action button */}
                          <button
                            onClick={(e) => handleDeleteAsset(e, asset)}
                            className="absolute top-2 left-2 p-1.5 bg-red-600/90 hover:bg-red-700 active:bg-red-800 text-white rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 cursor-pointer border border-red-500/30"
                            title="Delete this asset from database and clean all references"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Source Label tag on thumbnail bottom */}
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-stone-950/85 text-[8px] font-black tracking-widest text-stone-300 border border-stone-800 uppercase max-w-[85%] truncate">
                            {getHumanReadableFolder(asset.folder)}
                          </span>
                        </div>

                        {/* Filename and reference descriptors footer */}
                        <div className="p-2 bg-stone-950/85 border-t border-stone-800 text-left space-y-0.5 shrink-0">
                          <p className="text-[10px] text-stone-200 font-semibold truncate" title={asset.filename}>
                            {asset.filename}
                          </p>
                          <div className="flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                            <span className="text-[8px] text-stone-400 truncate font-medium">
                              {asset.referencedBy.length > 0 
                                ? asset.referencedBy[0] 
                                : 'Orphan (Not linked)'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer information bar */}
            <div className="p-3.5 border-t border-stone-800 bg-stone-950/60 flex items-center justify-between text-[10px] text-stone-400 font-medium">
              <span>Total Vault Assets: {assets.length}</span>
              <button 
                onClick={fetchAndScanAssets}
                className="flex items-center gap-1 text-amber-500 hover:text-amber-400 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-scan</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Image Optimization Selector Modal for Direct Drawer Uploads */}
      <UploadChoiceModal
        isOpen={isChoiceModalOpen}
        files={pendingFiles}
        onChoose={handleChoiceDecision}
        onCancel={handleChoiceCancel}
      />
    </AnimatePresence>
  );
}
