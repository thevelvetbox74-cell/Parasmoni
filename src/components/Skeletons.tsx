/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Zero-CLS Skeleton Placeholders with Radial Flower Spinner
 * Dimensionally identical to rendered cards and components to prevent layout shifts.
 */

import React from 'react';
import { FlowerTickSpinner } from './FlowerTickSpinner';

export function ProductCardSkeleton(): React.JSX.Element {
  return (
    <div className="bg-[#faf8f5] rounded-2xl border border-stone-200/80 p-3 flex flex-col justify-between overflow-hidden shadow-xs h-full relative">
      {/* Square Image Box with Centered Flower Tick Spinner */}
      <div className="aspect-square w-full bg-white rounded-xl mb-3 flex items-center justify-center relative border border-stone-100">
        <FlowerTickSpinner size="md" />
      </div>
      {/* Details Skeleton Lines */}
      <div className="space-y-2 py-1 flex-1">
        <div className="h-4 bg-stone-200/60 rounded-md w-3/4 animate-pulse" />
        <div className="h-3 bg-stone-200/40 rounded-md w-1/2 animate-pulse" />
        <div className="h-5 bg-stone-200/50 rounded-md w-1/3 mt-2 animate-pulse" />
      </div>
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
    <div className="w-full aspect-[14/9] md:aspect-[18/7] max-h-[540px] bg-[#faf8f5] rounded-xl md:rounded-2xl border border-stone-200 relative overflow-hidden flex items-center justify-center">
      <FlowerTickSpinner size="lg" />
    </div>
  );
}

export function CategorySkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center space-y-2 shrink-0 w-20 sm:w-24">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#faf8f5] border border-stone-200/80 flex items-center justify-center">
        <FlowerTickSpinner size="sm" />
      </div>
      <div className="h-3 bg-stone-200/60 rounded w-14 animate-pulse" />
    </div>
  );
}

export function CollectionSkeleton(): React.JSX.Element {
  return (
    <div className="aspect-[4/5] w-full rounded-2xl bg-[#faf8f5] border border-stone-200 p-4 flex items-center justify-center relative">
      <FlowerTickSpinner size="md" />
    </div>
  );
}

export function ProductDetailsSkeleton(): React.JSX.Element {
  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Gallery Skeleton */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square w-full bg-[#faf8f5] rounded-3xl border border-stone-200 flex items-center justify-center">
            <FlowerTickSpinner size="lg" />
          </div>
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-20 h-20 bg-[#faf8f5] rounded-xl border border-stone-200 flex items-center justify-center">
                <FlowerTickSpinner size="sm" />
              </div>
            ))}
          </div>
        </div>
        {/* Right Info Skeleton */}
        <div className="lg:col-span-6 space-y-5 animate-pulse">
          <div className="h-6 bg-stone-200/60 rounded w-1/4" />
          <div className="h-9 bg-stone-200/60 rounded w-3/4" />
          <div className="h-4 bg-stone-200/50 rounded w-1/2" />
          <div className="h-8 bg-stone-200/60 rounded w-1/3" />
          <div className="h-24 bg-stone-200/40 rounded-2xl w-full" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-16 bg-stone-200/40 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
