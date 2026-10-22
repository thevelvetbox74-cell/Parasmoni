/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - In-Memory & LocalStorage High-Speed Data Cache
 * Implements Stale-While-Revalidate caching to eliminate CLS and delay on first paint.
 */

const memoryCache = new Map<string, { data: any; timestamp: number }>();
const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes

export function getCachedData<T>(key: string, fallback: T, ttl: number = DEFAULT_TTL): T {
  // 1. Check in-memory cache first
  const inMem = memoryCache.get(key);
  if (inMem && Date.now() - inMem.timestamp < ttl) {
    return inMem.data as T;
  }

  // 2. Check localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(`pm_cache_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.data !== undefined) {
          memoryCache.set(key, { data: parsed.data, timestamp: parsed.timestamp || Date.now() });
          return parsed.data as T;
        }
      }
    } catch {
      // Ignore JSON parse or storage errors
    }
  }

  return fallback;
}

export function setCachedData<T>(key: string, data: T): void {
  const payload = { data, timestamp: Date.now() };
  memoryCache.set(key, payload);

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(`pm_cache_${key}`, JSON.stringify(payload));
    } catch {
      // Storage quota exceeded or disabled
    }
  }
}
