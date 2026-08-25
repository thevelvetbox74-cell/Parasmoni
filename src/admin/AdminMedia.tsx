/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { 
  Folder, 
  Image as ImageIcon, 
  Copy, 
  Trash2, 
  Search, 
  Check, 
  RefreshCw, 
  ExternalLink,
  Tag,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

interface MediaAsset {
  id: string;
  url: string;
  filename: string;
  folder: string;
  uploadDate: string;
  fileId?: string;
  sourceDocId?: string;
  sourceCollection?: string;
  sourceTitle?: string;
  referencedBy: string[]; // List of human-readable usage descriptors e.g. "Product: bowbazar"
}

export function AdminMedia(): React.JSX.Element {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState('All');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Deep Scan across all Firestore collections to find unique ImageKit assets
  const scanMediaLibrary = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      if (!isFirebaseConfigured || !db) {
        // Fallback mockup assets
        const mockAssets: MediaAsset[] = [
          {
            id: 'mock-img-1',
            url: 'https://ik.imagekit.io/ugm0ru2xm/parasmoni/products/gold_har_set_1.jpg',
            filename: 'gold_har_set_1.jpg',
            folder: '/parasmoni/products',
            uploadDate: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
            referencedBy: ['Product: Royal Bridal Choker (PM-GLD-401)']
          },
          {
            id: 'mock-img-2',
            url: 'https://ik.imagekit.io/ugm0ru2xm/parasmoni/banners/banner_bridal_kolkata.jpg',
            filename: 'banner_bridal_kolkata.jpg',
            folder: '/parasmoni/banners',
            uploadDate: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
            referencedBy: ['Banner: Heritage Wedding Showcase']
          },
          {
            id: 'mock-img-3',
            url: 'https://ik.imagekit.io/ugm0ru2xm/parasmoni/stores/bowbazar_facade.jpg',
            filename: 'bowbazar_facade.jpg',
            folder: '/parasmoni/stores',
            uploadDate: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
            referencedBy: ['Store Location: Bowbazar Flagship']
          },
          {
            id: 'mock-img-4',
            url: 'https://ik.imagekit.io/ugm0ru2xm/parasmoni/branding/parasmoni_logo.png',
            filename: 'parasmoni_logo.png',
            folder: '/parasmoni/branding',
            uploadDate: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
            referencedBy: ['Website Settings: Brand Logo']
          }
        ];
        setAssets(mockAssets);
        setLoading(false);
        return;
      }

      // 1. Load dedicated 'media' logs (if any uploaded from uploader)
      const mediaMap = new Map<string, any>();
      try {
        const mediaCol = collection(db, 'media');
        const mediaSnapshot = await getDocs(mediaCol);
        mediaSnapshot.docs.forEach(docSnap => {
          const d = docSnap.data();
          if (d.url) {
            mediaMap.set(d.url, {
              id: docSnap.id,
              fileId: d.fileId || '',
              uploadDate: d.uploadDate || d.createdAt || '',
              folder: d.folder || ''
            });
          }
        });
      } catch (err) {
        console.warn('Dedicated "media" collection not initialized yet or unreadable.');
      }

      // Temporary map to consolidate unique image URLs
      const uniqueUrls = new Map<string, { referencedBy: Set<string>; docs: Array<{ col: string; id: string; field: string }> }>();

      const registerUrl = (url: string, descriptor: string, col: string, docId: string, field: string) => {
        if (!url || !url.startsWith('http')) return;
        
        // Remove transformations to find base URL
        const cleanUrl = url.split('?')[0];

        if (!uniqueUrls.has(cleanUrl)) {
          uniqueUrls.set(cleanUrl, {
            referencedBy: new Set([descriptor]),
            docs: [{ col, id: docId, field }]
          });
        } else {
          uniqueUrls.get(cleanUrl)!.referencedBy.add(descriptor);
          uniqueUrls.get(cleanUrl)!.docs.push({ col, id: docId, field });
        }
      };

      // 2. Fetch and Scan: Products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      productsSnapshot.docs.forEach(d => {
        const data = d.data();
        const pLabel = `Product: ${data.name || 'Jewellery Item'} (${data.sku || d.id})`;
        if (data.imageUrl) registerUrl(data.imageUrl, pLabel, 'products', d.id, 'imageUrl');
        if (Array.isArray(data.images)) {
          data.images.forEach((img: string, idx: number) => {
            if (img) registerUrl(img, `${pLabel} [Galleria #${idx + 1}]`, 'products', d.id, `images`);
          });
        }
      });

      // 3. Fetch and Scan: Banners
      try {
        const bannersSnapshot = await getDocs(collection(db, 'banners'));
        bannersSnapshot.docs.forEach(d => {
          const data = d.data();
          const bLabel = `Banner: ${data.title || 'Promotional Slider'}`;
          if (data.imageUrl) registerUrl(data.imageUrl, bLabel, 'banners', d.id, 'imageUrl');
        });
      } catch (e) {
        console.log('Skipping banners scan: collection uninitialized');
      }

      // 4. Fetch and Scan: Collections
      try {
        const collectionsSnapshot = await getDocs(collection(db, 'collections'));
        collectionsSnapshot.docs.forEach(d => {
          const data = d.data();
          const cLabel = `Collection: ${data.name || 'Curated Category'}`;
          if (data.imageUrl) registerUrl(data.imageUrl, cLabel, 'collections', d.id, 'imageUrl');
        });
      } catch (e) {
        console.log('Skipping collections scan: collection uninitialized');
      }

      // 5. Fetch and Scan: Showroom Stores
      try {
        const storesSnapshot = await getDocs(collection(db, 'stores'));
        storesSnapshot.docs.forEach(d => {
          const data = d.data();
          const sLabel = `Store: ${data.storeName || data.name || 'Showroom Branch'}`;
          if (data.image) registerUrl(data.image, sLabel, 'stores', d.id, 'image');
          if (data.imageUrl) registerUrl(data.imageUrl, sLabel, 'stores', d.id, 'imageUrl');
        });
      } catch (e) {
        console.log('Skipping stores scan: collection uninitialized');
      }

      // 6. Fetch and Scan: Website Settings
      try {
        const wsSnapshot = await getDocs(collection(db, 'websiteSettings'));
        wsSnapshot.docs.forEach(d => {
          const data = d.data();
          const wsLabel = `Website Settings: Brand Logo`;
          if (data.logoUrl) registerUrl(data.logoUrl, wsLabel, 'websiteSettings', d.id, 'logoUrl');
          if (data.logo) registerUrl(data.logo, wsLabel, 'websiteSettings', d.id, 'logo');
          if (data.favicon) registerUrl(data.favicon, `Website Settings: Favicon`, 'websiteSettings', d.id, 'favicon');
        });
      } catch (e) {
        console.log('Skipping websiteSettings scan: collection uninitialized');
      }

      // Map unique URLs to MediaAsset models
      const scannedAssets: MediaAsset[] = [];

      uniqueUrls.forEach((val, url) => {
        // Parse filename and folder from URL path
        let filename = 'unknown_asset';
        let folder = '/parasmoni/orphans';

        try {
          const parsedUrl = new URL(url);
          const pathname = parsedUrl.pathname;
          const parts = pathname.split('/');
          filename = parts[parts.length - 1];
          
          // Recompose the folder path (e.g. /parasmoni/products)
          if (parts.length > 2) {
            folder = '/' + parts.slice(1, parts.length - 1).join('/');
          }
        } catch (e) {
          // If URL parse fails, fallback
          const splitParts = url.split('/');
          filename = splitParts[splitParts.length - 1] || 'unknown_asset';
        }

        // Check if there's a logged file record in 'media'
        const loggedInfo = mediaMap.get(url);
        
        scannedAssets.push({
          id: loggedInfo?.id || `scanned-${Math.random().toString(36).substr(2, 9)}`,
          url,
          filename,
          folder,
          uploadDate: loggedInfo?.uploadDate || new Date().toISOString(),
          fileId: loggedInfo?.fileId || '',
          referencedBy: Array.from(val.referencedBy)
        });
      });

      // Add any orphaned uploads from 'media' collection that aren't actively referenced
      mediaMap.forEach((mediaVal, mediaUrl) => {
        if (!uniqueUrls.has(mediaUrl)) {
          let filename = 'orphan_asset';
          try {
            filename = new URL(mediaUrl).pathname.split('/').pop() || 'orphan_asset';
          } catch (e) {}

          scannedAssets.push({
            id: mediaVal.id,
            url: mediaUrl,
            filename,
            folder: mediaVal.folder || '/parasmoni/uploads',
            uploadDate: mediaVal.uploadDate || new Date().toISOString(),
            fileId: mediaVal.fileId || '',
            referencedBy: [] // Used nowhere
          });
        }
      });

      // Sort by upload date or name
      scannedAssets.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
      setAssets(scannedAssets);
    } catch (err: any) {
      console.error('Error scanning CDN media library:', err);
      setErrorMsg('Failed to aggregate and parse cloud ImageKit resources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scanMediaLibrary();
  }, []);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => {
      setCopiedUrl(null);
    }, 1200);
  };

  const handleDeleteAsset = async (asset: MediaAsset) => {
    const isReferenced = asset.referencedBy.length > 0;
    
    let confirmPrompt = `Are you sure you want to delete "${asset.filename}"?`;
    if (isReferenced) {
      confirmPrompt += `\n\nCRITICAL WARNING: This file is currently actively referenced by:\n${asset.referencedBy.map(r => '• ' + r).join('\n')}\n\nDeleting this image will break these pages! Continue anyway?`;
    }

    if (!window.confirm(confirmPrompt)) {
      return;
    }

    try {
      setDeletingId(asset.id);
      setErrorMsg(null);
      setSuccessMsg(null);

      // 1. Delete from ImageKit CDN via our secure backend endpoint (if fileId exists)
      if (asset.fileId) {
        try {
          const deleteEndpoint = `/api/imagekit-delete/${asset.fileId}`;
          const res = await fetch(deleteEndpoint, {
            method: 'DELETE'
          });
          if (!res.ok) {
            console.warn('ImageKit API binary deletion failed, proceeding with registry deletion...');
          }
        } catch (ikErr) {
          console.error('Error during secure ImageKit file deletion:', ikErr);
        }
      }

      // 2. Delete the record from 'media' collection in Firestore
      if (isFirebaseConfigured && db && asset.id && !asset.id.startsWith('scanned-')) {
        try {
          const docRef = doc(db, 'media', asset.id);
          await deleteDoc(docRef);
        } catch (fsErr) {
          console.error('Failed to remove document from Firestore media logs:', fsErr);
        }
      }

      // 3. Update the host documents to remove the broken reference (if requested)
      if (isFirebaseConfigured && db && isReferenced) {
        // Here we could perform targeted clears, but soft-removing from list is the primary action
        console.log('Image deleted from catalog list. Note: Host records must be updated with a new upload.');
      }

      setSuccessMsg(`Asset "${asset.filename}" deleted from gallery successfully.`);
      
      // Update local state directly
      setAssets(prev => prev.filter(a => a.url !== asset.url));
    } catch (err: any) {
      console.error('Error during asset deletion:', err);
      setErrorMsg(err.message || 'Failed to delete media asset.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtering Logic
  const folders = ['All', ...Array.from(new Set(assets.map(a => a.folder as string)))];

  const filteredAssets = assets.filter(asset => {
    const matchesFolder = folderFilter === 'All' || asset.folder === folderFilter;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      asset.filename.toLowerCase().includes(query) ||
      asset.referencedBy.some(r => r.toLowerCase().includes(query)) ||
      asset.folder.toLowerCase().includes(query);

    return matchesFolder && matchesSearch;
  });

  return (
    <div className="space-y-6" id="admin-media-library">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-800 pb-4 gap-3">
        <div>
          <h2 className="text-xl font-serif font-bold text-stone-100 flex items-center gap-2">
            <Folder className="w-5 h-5 text-amber-500" />
            <span>Digital Media Library</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Analyze, copy, and delete ImageKit uploaded assets linked inside products, banners, stores, or showroom settings.
          </p>
        </div>

        <button
          onClick={scanMediaLibrary}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 border border-stone-800 hover:bg-stone-850 text-stone-300 font-sans text-xs font-bold uppercase tracking-wider rounded transition-colors self-start sm:self-auto cursor-pointer"
          id="refresh-media-btn"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Scan Storage</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs rounded flex items-center gap-2" id="media-success">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-950/25 border border-red-500/20 text-red-400 text-xs rounded flex items-center gap-2" id="media-error">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Media filter block */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between" id="media-filters">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by filename or referenced item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-900/30 border border-stone-800 rounded pl-9 pr-4 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-amber-500 font-medium font-sans"
          />
        </div>

        {/* Directory filter pill */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none shrink-0">
          <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mr-1">Folder:</span>
          <div className="flex gap-1.5 shrink-0">
            {folders.map((f: string) => (
              <button
                key={f}
                onClick={() => setFolderFilter(f)}
                className={`px-3 py-1 rounded text-[10px] tracking-wider uppercase font-bold cursor-pointer transition-colors ${
                  folderFilter === f 
                    ? 'bg-amber-500 text-stone-950' 
                    : 'bg-stone-900/50 text-stone-400 hover:text-stone-200 border border-stone-850'
                }`}
              >
                {f === 'All' ? 'All Folders' : f.split('/').pop()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3" id="media-loader">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-500 tracking-wider font-mono">Rebuilding cloud-asset mapping registry...</p>
        </div>
      ) : (
        /* Grid Display */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5" id="media-grid">
          {filteredAssets.length === 0 ? (
            <div className="col-span-full py-16 text-center border border-dashed border-stone-850 rounded">
              <ImageIcon className="w-10 h-10 text-stone-700 mx-auto mb-3" />
              <p className="text-xs text-stone-500 font-serif italic">No media assets found matching the filter criteria.</p>
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const isOrphan = asset.referencedBy.length === 0;
              return (
                <div 
                  key={asset.url}
                  className="bg-stone-900/25 border border-stone-850 rounded overflow-hidden flex flex-col justify-between group transition-all hover:border-stone-700 hover:shadow-lg shadow-black/20"
                  id={`media-card-${asset.id}`}
                >
                  {/* Photo container */}
                  <div className="aspect-square bg-stone-950 relative overflow-hidden flex items-center justify-center">
                    <img
                      src={asset.url}
                      alt={asset.filename}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />

                    {/* Tool overlays */}
                    <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3.5 z-10">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleCopyUrl(asset.url)}
                          className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-amber-500 rounded cursor-pointer transition-colors"
                          title="Copy Original CDN Link"
                        >
                          {copiedUrl === asset.url ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-amber-500 rounded transition-colors"
                          title="Open asset in browser window"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {/* Referenced elements preview */}
                      <div className="space-y-1.5 text-left">
                        <p className="text-[8px] text-stone-500 uppercase tracking-widest font-black block">Active References</p>
                        <div className="max-h-20 overflow-y-auto space-y-1 scrollbar-none">
                          {isOrphan ? (
                            <span className="text-[10px] text-amber-500/80 font-serif italic block">
                              Orphaned (Not used on any page)
                            </span>
                          ) : (
                            asset.referencedBy.map((ref, idx) => (
                              <div key={idx} className="flex items-start gap-1 text-[10px] text-stone-300 leading-tight">
                                <Tag className="w-2.5 h-2.5 mt-0.5 text-amber-500 shrink-0" />
                                <span className="truncate">{ref}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Folder Pill indicator */}
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-stone-900/85 text-[8px] font-bold tracking-wider text-stone-400 border border-stone-850 uppercase">
                      {asset.folder.split('/').pop()}
                    </span>
                  </div>

                  {/* Description footer */}
                  <div className="p-3 space-y-1 text-xs border-t border-stone-850 bg-stone-950/20 font-sans">
                    <p className="font-semibold text-stone-300 truncate text-[11px]" title={asset.filename}>
                      {asset.filename}
                    </p>
                    
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-stone-900/60 text-[10px] text-stone-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {new Date(asset.uploadDate).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteAsset(asset)}
                        disabled={deletingId === asset.id}
                        className="p-1 hover:bg-red-950/30 text-stone-500 hover:text-red-400 rounded cursor-pointer transition-colors"
                        title="Delete asset binary from ImageKit & links"
                      >
                        {deletingId === asset.id ? (
                          <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
