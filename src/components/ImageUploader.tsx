/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { uploadToImageKit } from '../imagekit/upload';
import { IMAGEKIT_FOLDERS } from '../imagekit/client';
import { UploadCloud, X, ImageIcon, AlertCircle, CheckCircle, FolderOpen } from 'lucide-react';
import { MediaLibraryDrawer } from './MediaLibraryDrawer';
import { isSvgFile, convertToWebP } from '../utils/imageConverter';
import { UploadChoiceModal } from './UploadChoiceModal';

interface ImageUploaderProps {
  id: string;
  multiple?: boolean;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  folder?: typeof IMAGEKIT_FOLDERS[keyof typeof IMAGEKIT_FOLDERS];
  recommendedDimensions?: string;
  autoWebP?: boolean;
}

export function ImageUploader({
  id,
  multiple = false,
  value,
  onChange,
  folder = IMAGEKIT_FOLDERS.products,
  recommendedDimensions,
  autoWebP = false,
}: ImageUploaderProps): React.JSX.Element {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute recommended resolution hints if not explicitly passed
  const getDimensionHint = () => {
    if (recommendedDimensions) return recommendedDimensions;
    if (folder === IMAGEKIT_FOLDERS.banners) {
      return "Desktop: 2560 x 1080 px (21:9 HD) | Mobile: 1080 x 1350 px (4:5 HD) | Video: 1080p MP4";
    }
    if (folder === IMAGEKIT_FOLDERS.products) {
      return "1200 x 1200 px (1:1 HD Square) or 1500 x 1500 px";
    }
    if (folder === IMAGEKIT_FOLDERS.categories) {
      return "1080 x 1080 px (1:1 HD)";
    }
    if (folder === IMAGEKIT_FOLDERS.collections) {
      return "1200 x 800 px (3:2 HD)";
    }
    if (folder === IMAGEKIT_FOLDERS.stores) {
      return "1200 x 800 px (3:2 HD)";
    }
    if (folder === IMAGEKIT_FOLDERS.branding) {
      return "500 x 200 px (Transparent PNG/SVG)";
    }
    return "1920 x 1080 px or 1200 x 1200 px HD";
  };

  const effectiveDimensions = getDimensionHint();

  // Optimization Prompt States
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);

  // Cast values correctly
  const images = multiple 
    ? (Array.isArray(value) ? value : (value ? [value] : [])) 
    : (typeof value === 'string' ? (value ? [value] : []) : []);

  const handleFiles = (files: FileList) => {
    if (files.length === 0) return;
    
    const filesArray = Array.from(files);
    const filesToProcess = multiple ? filesArray : [filesArray[0]];

    // Check if there are any images in the selection
    const hasImages = filesToProcess.some(f => f.type.startsWith('image/'));

    if (hasImages) {
      if (autoWebP || folder === IMAGEKIT_FOLDERS.banners) {
        executeUpload(filesToProcess, 'webp');
      } else {
        setPendingFiles(filesToProcess);
        setIsChoiceModalOpen(true);
      }
    } else {
      // Direct upload (e.g. for videos)
      executeUpload(filesToProcess, 'raw');
    }
  };

  const handleChoiceDecision = async (mode: 'raw' | 'webp') => {
    setIsChoiceModalOpen(false);
    const filesToUpload = [...pendingFiles];
    setPendingFiles([]);
    await executeUpload(filesToUpload, mode);
  };

  const handleChoiceCancel = () => {
    setIsChoiceModalOpen(false);
    setPendingFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const executeUpload = async (filesToUpload: File[], mode: 'raw' | 'webp') => {
    setUploading(true);
    setError(null);
    setSuccessMsg(null);
    setProgress(10); // Start progress bar

    const uploadedUrls: string[] = [];

    try {
      const stepValue = Math.floor(80 / filesToUpload.length);
      
      for (let i = 0; i < filesToUpload.length; i++) {
        let file = filesToUpload[i];
        
        // Validate file type
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        
        if (!isImage && !isVideo) {
          throw new Error(`File "${file.name}" is not a supported format.`);
        }

        // Validate size (allow high-definition images up to 25MB and HD videos up to 100MB)
        const limitSize = isVideo ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
        if (file.size > limitSize) {
          throw new Error(`File "${file.name}" exceeds the allowed size limit (${isVideo ? '100MB for videos' : '25MB for images'}).`);
        }

        // Apply WebP conversion on client-side if selected & convertible
        if (mode === 'webp' && isImage && !isSvgFile(file)) {
          setProgress(prev => Math.min(prev + 5, 95));
          file = await convertToWebP(file);
        }

        const result = await uploadToImageKit(file, folder);
        uploadedUrls.push(result.url);
        
        setProgress(prev => Math.min(prev + stepValue, 90));
      }

      setProgress(100);
      setSuccessMsg(`Successfully uploaded ${uploadedUrls.length} asset(s).`);

      if (multiple) {
        onChange([...images, ...uploadedUrls]);
      } else {
        onChange(uploadedUrls[0]);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('ImageKit Upload error:', err);
      setError(err.message || 'Failed to upload image assets. Please try again.');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 800);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (uploading) return;
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent, indexToRemove: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (multiple) {
      const currentList = Array.isArray(value) ? value : (value ? [value] : []);
      const updated = currentList.filter((_, idx) => idx !== indexToRemove);
      onChange(updated);
    } else {
      onChange('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSuccessMsg(null);
    setError(null);
  };

  return (
    <div className="space-y-4" id={`imagekit-uploader-${id}`}>
      
      {/* Visual upload dropzone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !uploading && setIsDrawerOpen(true)}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 select-none ${
          uploading 
            ? 'bg-amber-50/50 border-amber-400 cursor-not-allowed' 
            : 'bg-[#f9f8f6] border-stone-300 hover:border-amber-500 hover:bg-amber-50/20'
        }`}
        id={`dropzone-${id}`}
      >
        <input
          type="file"
          id={`input-file-${id}`}
          ref={fileInputRef}
          multiple={multiple}
          accept="image/*,video/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="p-3 bg-white border border-stone-200 rounded-full text-amber-600 shadow-xs">
            <UploadCloud className="w-6 h-6 text-amber-600 animate-pulse" />
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-semibold text-stone-800">
              {uploading ? 'Processing & uploading...' : 'Click to choose from Media Library / Drag & Drop'}
            </p>
            <p className="text-[10px] text-stone-500">
              Select existing media (Images/Videos) or drag & drop to upload new
            </p>
          </div>

          {/* Explicit Recommended Dimension Badge */}
          <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-mono rounded-full tracking-wide shadow-2xs">
            <span className="font-bold uppercase text-amber-700">RECOMMENDED HD SIZE:</span>
            <span className="text-stone-800 font-semibold">{effectiveDimensions}</span>
          </div>
        </div>

        {/* Live Upload Progress */}
        {uploading && (
          <div className="mt-4 max-w-xs mx-auto space-y-1.5" id={`progress-wrapper-${id}`}>
            <div className="flex items-center justify-between text-[10px] text-stone-600 font-mono">
              <span>Uploading assets...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden border border-stone-300">
              <div 
                className="bg-amber-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Notifications banner */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] rounded-lg flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] rounded-lg flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <p className="leading-relaxed">{successMsg}</p>
        </div>
      )}

      {/* Previews Grid & Side-by-Side Remove Card */}
      {images.length > 0 && (
        <div className="space-y-2 mt-3" id={`previews-grid-${id}`}>
          <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            <span>Selected Media ({images.length})</span>
            <span className="text-[9px] text-amber-500 font-mono">Click 'X Remove' to delete banner</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {images.map((url, idx) => {
              const isVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.mov') || url.toLowerCase().endsWith('.webm') || url.toLowerCase().endsWith('.m4v');
              
              return (
                <div 
                  key={idx} 
                  className="flex items-center gap-3 p-2.5 bg-stone-900 border-2 border-stone-700 hover:border-amber-500/50 rounded-xl shadow-md transition-all group relative overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Image Thumbnail Box */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-stone-700 bg-stone-950 shrink-0">
                    {isVideo ? (
                      <video
                        src={url}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={url}
                        alt={`Preview asset ${idx + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-amber-600 text-white font-sans text-[8px] font-bold uppercase tracking-wider shadow-xs z-10">
                        Cover
                      </span>
                    )}
                  </div>

                  {/* Side-by-side Details & Red Remove X Button */}
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                      <span className="text-[10px] font-bold text-amber-400 uppercase block font-mono">
                        {isVideo ? 'Video Media' : 'Image Banner'} #{idx + 1}
                      </span>
                      <p className="text-[10px] text-stone-400 truncate font-mono max-w-[120px] sm:max-w-[150px]" title={url}>
                        {url.split('/').pop() || url}
                      </p>
                    </div>

                    {/* Distinct Side-by-side Red Remove Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveImage(e, idx);
                      }}
                      className="px-3 py-2 bg-rose-600 hover:bg-rose-500 active:scale-90 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg border border-rose-400 transition-all cursor-pointer shrink-0"
                      title="Remove selected image"
                    >
                      <X className="w-4 h-4 stroke-[3]" />
                      <span className="text-[11px] font-bold">Remove</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Media Vault Side Panel / Drawer */}
      <MediaLibraryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelect={(url) => {
          if (multiple) {
            onChange([...images, url]);
          } else {
            onChange(url);
          }
        }}
        currentValue={value}
        defaultFolder={folder}
      />

      {/* Image Optimization Selector Modal */}
      <UploadChoiceModal
        isOpen={isChoiceModalOpen}
        files={pendingFiles}
        onChoose={handleChoiceDecision}
        onCancel={handleChoiceCancel}
      />
    </div>
  );
}
