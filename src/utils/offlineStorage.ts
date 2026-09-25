/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Offline Storage & Cache Manager Utility
 */

export const OFFLINE_STORAGE_KEYS = {
  CATALOG_PRODUCTS: 'parasmoni_offline_catalog_products',
  CATEGORIES: 'parasmoni_offline_categories',
  METAL_PRICES: 'parasmoni_offline_metal_prices',
  APP_FRONT_SETTINGS: 'parasmoni_offline_appfront_settings',
  WEBSITE_SETTINGS: 'parasmoni_offline_website_settings'
};

/**
 * Save data to device localStorage for offline availability
 */
export function cacheDataOffline<T>(key: string, data: T): void {
  try {
    if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (err) {
    console.warn('Failed to cache data for offline use:', err);
  }
}

/**
 * Retrieve cached offline data from localStorage
 */
export function getCachedOfflineData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) return parsed as T;
    }
  } catch (err) {
    console.warn('Failed to load offline cached data:', err);
  }
  return fallback;
}
