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
}

export function ImageUploader({
  id,
  multiple = false,
  value,
  onChange,
  folder = IMAGEKIT_FOLDERS.products,
}: ImageUploaderProps): React.JSX.Element {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setPendingFiles(filesToProcess);
      setIsChoiceModalOpen(true);
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

        // Validate size (limit image to 5MB, video to 15MB)
        const limitSize = isVideo ? 15 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > limitSize) {
          throw new Error(`File "${file.name}" exceeds the allowed size limit.`);
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

  const handleRemoveImage = (indexToRemove: number) => {
    if (multiple) {
      const updated = images.filter((_, idx) => idx !== indexToRemove);
      onChange(updated);
    } else {
      onChange('');
    }
  };

  return (
    <div className="space-y-4" id={`imagekit-uploader-${id}`}>
      
      {/* Visual upload dropzone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !uploading && setIsDrawerOpen(true)}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 select-none ${
          uploading 
            ? 'bg-stone-900/30 border-amber-600/50 cursor-not-allowed' 
            : 'bg-stone-950/40 border-stone-800 hover:border-stone-700 hover:bg-stone-900/40'
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
          <div className="p-3 bg-stone-900 border border-stone-800 rounded-full text-stone-400">
            <UploadCloud className="w-6 h-6 text-amber-500 animate-pulse" />
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-semibold text-stone-200">
              {uploading ? 'Processing & uploading...' : 'Click to choose from Media Library / Drag & Drop'}
            </p>
            <p className="text-[10px] text-stone-500">
              Select existing media (Images/Videos) or drag & drop to upload new
            </p>
          </div>
        </div>

        {/* Live Upload Progress */}
        {uploading && (
          <div className="mt-4 max-w-xs mx-auto space-y-1.5" id={`progress-wrapper-${id}`}>
            <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
              <span>Uploading assets...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden border border-stone-800">
              <div 
                className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Notifications banner */}
      {error && (
        <div className="p-3 bg-red-950/35 border border-red-500/20 text-red-400 text-[11px] rounded flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/10 text-emerald-400 text-[11px] rounded flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
          <p className="leading-relaxed">{successMsg}</p>
        </div>
      )}

      {/* Previews Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-3" id={`previews-grid-${id}`}>
          {images.map((url, idx) => {
            const isVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.mov') || url.toLowerCase().endsWith('.webm') || url.toLowerCase().endsWith('.m4v');
            
            return (
              <div key={idx} className="relative group aspect-square rounded-md border border-stone-800 bg-stone-950 overflow-hidden shadow-xs">
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
                
                {/* Overlay tools */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="p-1.5 bg-red-600 hover:bg-red-700 rounded text-stone-100 cursor-pointer transition-colors"
                    title="Remove asset"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Tag for thumbnail */}
                {idx === 0 && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-amber-500 text-stone-950 font-sans text-[8px] font-bold uppercase tracking-wider shadow-xs">
                    Cover
                  </span>
                )}
              </div>
            );
          })}
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
