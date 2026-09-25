/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Offline Status Banner Component
 */

import React, { useState, useEffect } from 'react';
import { WifiOff, Database } from 'lucide-react';

export function OfflineIndicator(): React.JSX.Element | null {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div 
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 z-[9999] max-w-sm bg-stone-900/95 text-amber-300 border-2 border-amber-500/80 p-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in duration-300"
      id="offline-status-banner"
    >
      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
        <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-200">
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span>Offline Mode Active</span>
        </div>
        <p className="text-[10px] text-stone-300 leading-tight">
          Loaded from local device storage. Storefront & catalogue remain fully available.
        </p>
      </div>
    </div>
  );
}
