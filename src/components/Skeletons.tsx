/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Zero-CLS Skeleton Placeholders
 * Dimensionally identical to rendered cards and components to prevent layout shifts.
 */

import React from 'react';

export function ProductCardSkeleton(): React.JSX.Element {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-3 flex flex-col justify-between overflow-hidden shadow-xs h-full animate-pulse">
      {/* Square Image Box */}
      <div className="aspect-square w-full bg-stone-200/70 rounded-xl mb-3" />
      {/* Product Details Lines */}
      <div className="space-y-2 py-1 flex-1">
        <div className="h-4 bg-stone-200/70 rounded-md w-3/4" />
        <div className="h-3 bg-stone-200/50 rounded-md w-1/2" />
        <div className="h-3 bg-stone-200/40 rounded-md w-2/3" />
        <div className="h-5 bg-stone-200/60 rounded-md w-1/3 mt-2" />
      </div>
      {/* Action Button */}
      <div className="h-9 bg-stone-200/60 rounded-lg w-full mt-3" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={`skeleton-card-${i}`} />
      ))}
    </div>
  );
}

export function BannerSkeleton(): React.JSX.Element {
  return (
    <div className="w-full aspect-[14/9] md:aspect-[18/7] max-h-[540px] bg-stone-900 rounded-xl md:rounded-2xl border border-stone-800 animate-pulse relative overflow-hidden flex items-center px-6 md:px-16">
      <div className="space-y-3 max-w-lg">
        <div className="h-6 md:h-10 bg-stone-800 rounded-lg w-3/4" />
        <div className="h-3 md:h-4 bg-stone-800/80 rounded w-full" />
        <div className="h-8 md:h-11 bg-stone-800 rounded-md w-1/3 mt-4" />
      </div>
    </div>
  );
}

export function CategorySkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center space-y-2 shrink-0 animate-pulse w-24 sm:w-28">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-stone-200/80 border border-stone-200" />
      <div className="h-3 bg-stone-200/70 rounded w-16" />
    </div>
  );
}

export function CollectionSkeleton(): React.JSX.Element {
  return (
    <div className="aspect-[4/5] w-full rounded-2xl bg-stone-200/70 border border-stone-200 animate-pulse p-4 flex flex-col justify-end">
      <div className="h-5 bg-stone-300 rounded w-2/3 mb-2" />
      <div className="h-3 bg-stone-300/80 rounded w-1/2" />
    </div>
  );
}

export function ProductDetailsSkeleton(): React.JSX.Element {
  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Gallery Skeleton */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square w-full bg-stone-200/80 rounded-3xl" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-20 h-20 bg-stone-200/60 rounded-xl" />
            ))}
          </div>
        </div>
        {/* Right Info Skeleton */}
        <div className="lg:col-span-6 space-y-5">
          <div className="h-6 bg-stone-200 rounded w-1/4" />
          <div className="h-9 bg-stone-200 rounded w-3/4" />
          <div className="h-4 bg-stone-200 rounded w-1/2" />
          <div className="h-8 bg-stone-200 rounded w-1/3" />
          <div className="h-24 bg-stone-200/60 rounded-2xl w-full" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-16 bg-stone-200/50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
