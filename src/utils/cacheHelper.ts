/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - In-Memory, SessionStorage & LocalStorage Data Cache
 * Implements Stale-While-Revalidate caching to eliminate CLS and delay on first paint.
 */

const memoryCache = new Map<string, { data: any; timestamp: number }>();
export const FIVE_MINUTES_TTL = 5 * 60 * 1000; // 5 minutes default expiry

export function getCachedData<T>(key: string, fallback: T, ttl: number = FIVE_MINUTES_TTL): T {
  // 1. Check in-memory cache first
  const inMem = memoryCache.get(key);
  if (inMem && Date.now() - inMem.timestamp < ttl) {
    return inMem.data as T;
  }

  // 2. Check sessionStorage
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = sessionStorage.getItem(`pm_cache_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.data !== undefined && Date.now() - (parsed.timestamp || 0) < ttl) {
          memoryCache.set(key, { data: parsed.data, timestamp: parsed.timestamp || Date.now() });
          return parsed.data as T;
        }
      }
    } catch {
      // Ignore sessionStorage errors
    }
  }

  // 3. Check localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(`pm_cache_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.data !== undefined && Date.now() - (parsed.timestamp || 0) < ttl) {
          memoryCache.set(key, { data: parsed.data, timestamp: parsed.timestamp || Date.now() });
          return parsed.data as T;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  return fallback;
}

export function setCachedData<T>(key: string, data: T): void {
  const payload = { data, timestamp: Date.now() };
  memoryCache.set(key, payload);

  if (typeof window !== 'undefined') {
    const serialized = JSON.stringify(payload);
    
    // Save to sessionStorage for fast back/forward navigation
    if (window.sessionStorage) {
      try {
        sessionStorage.setItem(`pm_cache_${key}`, serialized);
      } catch {
        // Storage quota exceeded or disabled
      }
    }

    // Save to localStorage for return visits across tabs
    if (window.localStorage) {
      try {
        localStorage.setItem(`pm_cache_${key}`, serialized);
      } catch {
        // Storage quota exceeded or disabled
      }
    }
  }
}

/**
 * Saves and preloads the hero banner URL for instant paint on return visits.
 */
export function cacheHeroBannerUrl(url: string): void {
  if (!url || typeof window === 'undefined') return;
  try {
    localStorage.setItem('pm_hero_banner_url', url);
  } catch {
    // Ignore storage quota
  }
}

export function getCachedHeroBannerUrl(fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  try {
    return localStorage.getItem('pm_hero_banner_url') || fallback;
  } catch {
    return fallback;
  }
}
