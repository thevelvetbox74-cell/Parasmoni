/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Media Optimization Progress & Status Feedback Component
 */

import React from 'react';
import { Sparkles, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export interface MediaStatusItem {
  fileName: string;
  originalSize: number;
  optimizedSize?: number;
  savedPercent?: number;
  status: 'optimizing' | 'uploading' | 'done' | 'error';
  note?: string;
  errorMsg?: string;
}

interface MediaOptimizeStatusProps {
  items: MediaStatusItem[];
  onRetry?: (index: number) => void;
}

function formatMB(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaOptimizeStatus({ items, onRetry }: MediaOptimizeStatusProps): React.JSX.Element | null {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2.5 my-3 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl font-sans text-xs shadow-2xs">
      <div className="flex items-center gap-2 text-amber-900 font-bold uppercase tracking-wider text-[10px]">
        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Automatic Media Optimization Status</span>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="p-2 bg-white rounded-lg border border-amber-100 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-stone-800 truncate max-w-[200px]" title={item.fileName}>
                {item.fileName}
              </span>

              {item.status === 'optimizing' && (
                <span className="text-amber-700 font-medium flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                  Optimizing...
                </span>
              )}

              {item.status === 'uploading' && (
                <span className="text-amber-700 font-medium flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                  Uploading...
                </span>
              )}

              {item.status === 'done' && (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {item.optimizedSize && item.savedPercent !== undefined ? (
                    <span>Done: {formatMB(item.originalSize)} to {formatMB(item.optimizedSize)} (-{item.savedPercent}%)</span>
                  ) : (
                    <span>Done</span>
                  )}
                </span>
              )}

              {item.status === 'error' && (
                <div className="flex items-center gap-2">
                  <span className="text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Failed
                  </span>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={() => onRetry(idx)}
                      className="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[10px] rounded transition-colors"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>

            {item.note && (
              <p className="text-[10px] text-amber-800/90 font-mono italic leading-tight">
                {item.note}
              </p>
            )}

            {item.errorMsg && (
              <p className="text-[10px] text-rose-600 font-mono leading-tight">
                {item.errorMsg}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
