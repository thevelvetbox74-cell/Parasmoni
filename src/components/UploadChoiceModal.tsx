/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Sparkles, FileImage, X, AlertTriangle, Eye, Check } from 'lucide-react';
import { isSvgFile } from '../utils/imageConverter';

interface UploadChoiceModalProps {
  isOpen: boolean;
  files: File[];
  onChoose: (mode: 'raw' | 'webp') => void;
  onCancel: () => void;
}

export function UploadChoiceModal({
  isOpen,
  files,
  onChoose,
  onCancel,
}: UploadChoiceModalProps): React.JSX.Element | null {
  const [objectUrls, setObjectUrls] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  const mainFile = files[0];

  // Detect image natural dimensions
  useEffect(() => {
    if (mainFile && mainFile.type.startsWith('image/')) {
      const img = new Image();
      const url = URL.createObjectURL(mainFile);
      img.onload = () => {
        setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } else {
      setDimensions(null);
    }
  }, [mainFile]);
  useEffect(() => {
    if (!isOpen || files.length === 0) {
      setObjectUrls([]);
      return;
    }

    const urls = files.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return '';
    });

    setObjectUrls(urls);

    // Cleanup URLs on unmount/re-run
    return () => {
      urls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [isOpen, files]);

  if (!isOpen || files.length === 0) return null;

  // Analyze files in the current batch
  const hasSvg = files.some(isSvgFile);
  const allSvg = files.every(isSvgFile);
  const totalFiles = files.length;
  const mainPreview = objectUrls[0];

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/80 backdrop-blur-xs animate-fade-in p-4"
      id="upload-choice-modal-overlay"
    >
      <div 
        className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-xl shadow-xl overflow-hidden text-stone-200"
        id="upload-choice-modal-container"
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/50">
          <div className="flex items-center gap-2">
            <FileImage className="w-4.5 h-4.5 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-100">
              Optimize Uploaded Images
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onCancel}
            className="p-1 hover:bg-stone-800 rounded-md text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Main Selected Image Preview & File Info */}
          <div className="bg-stone-950/60 p-3 rounded-lg border border-stone-800/80 flex items-center gap-4">
            {/* Thumbnail */}
            {mainPreview ? (
              <div className="w-16 h-16 rounded-md overflow-hidden bg-stone-900 border border-stone-800 shrink-0 relative group">
                <img 
                  src={mainPreview} 
                  alt="Selected file preview" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-3.5 h-3.5 text-stone-300" />
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-md bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0">
                <FileImage className="w-6 h-6 text-stone-600" />
              </div>
            )}

            {/* File Info */}
            <div className="min-w-0 flex-1 space-y-1 text-xs">
              <div className="font-semibold text-stone-200 truncate leading-snug" title={mainFile.name}>
                {mainFile.name}
              </div>
              <div className="text-[10px] text-stone-500 font-mono flex flex-wrap gap-x-2 items-center">
                <span>{(mainFile.size / 1024).toFixed(1)} KB</span>
                {dimensions && (
                  <>
                    <span className="text-stone-700 font-sans">•</span>
                    <span className="text-amber-400 font-bold">{dimensions.width} x {dimensions.height} px</span>
                  </>
                )}
                <span className="text-stone-700 font-sans">•</span>
                <span className="uppercase text-amber-500/80 font-bold tracking-wide">
                  {mainFile.type.split('/')[1] || 'unknown'}
                </span>
              </div>
              {totalFiles > 1 && (
                <div className="text-[10px] font-semibold text-amber-500 bg-amber-950/30 border border-amber-900/40 rounded px-1.5 py-0.5 inline-block mt-1">
                  + {totalFiles - 1} more image{totalFiles > 2 ? 's' : ''} in this batch
                </div>
              )}
            </div>
          </div>

          {/* SVG Warning / Disclaimer */}
          {hasSvg && (
            <div className="p-3 bg-amber-950/20 border border-amber-500/10 rounded-lg flex items-start gap-2.5 text-[11px] text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div className="leading-relaxed">
                {allSvg ? (
                  <span>
                    <strong>Vector SVG Format:</strong> Converting SVGs to WebP is disabled to prevent loss of scalability and sharpness. SVGs will be uploaded as raw vector files.
                  </span>
                ) : (
                  <span>
                    <strong>Mixed Formats:</strong> Your batch includes SVG vector files. Only standard raster images (PNG/JPG) will be converted to WebP; SVGs will stay vector.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Decision Description */}
          <div className="text-[11px] text-stone-400 leading-relaxed font-sans">
            Choose how to process your image before publishing. Converting to <strong>WebP</strong> offers up to 80% smaller file sizes, resulting in faster storefront page speeds for your customers.
          </div>
        </div>

        {/* Actions / Buttons */}
        <div className="p-4 bg-stone-950/40 border-t border-stone-800 grid grid-cols-2 gap-3">
          {/* Raw Upload Option */}
          <button
            type="button"
            onClick={() => onChoose('raw')}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-stone-600 rounded-lg text-xs font-bold uppercase tracking-wider text-stone-300 hover:text-stone-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            id="choice-raw-upload-btn"
          >
            <FileImage className="w-3.5 h-3.5" />
            <span>Raw File</span>
          </button>

          {/* WebP Upload Option */}
          <button
            type="button"
            disabled={allSvg}
            onClick={() => onChoose('webp')}
            className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              allSvg 
                ? 'bg-stone-800 text-stone-600 border border-stone-850 cursor-not-allowed opacity-50'
                : 'bg-amber-500 hover:bg-amber-400 text-stone-950 hover:shadow-xs hover:shadow-amber-500/10'
            }`}
            id="choice-webp-upload-btn"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Convert to WebP</span>
          </button>
        </div>
      </div>
    </div>
  );
}
