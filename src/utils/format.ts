/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a number as Indian Rupees (INR) currency.
 * e.g., 150000 -> ₹1,50,000.00 or ₹1,50,000
 */
export function formatINR(amount: number, includeDecimals = false): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a gold or gemstone weight in grams or carats.
 * e.g., 12.345 -> 12.345 g
 */
export function formatWeight(grams: number, decimals = 3): string {
  if (grams === undefined || grams === null) return '0 g';
  return `${Number(grams).toFixed(decimals)} g`;
}

/**
 * Formats carat weight for diamonds.
 * e.g., 0.5 -> 0.50 ct
 */
export function formatCarat(carats: number): string {
  if (carats === undefined || carats === null) return '0.00 ct';
  return `${Number(carats).toFixed(2)} ct`;
}

/**
 * Normalizes slug strings for SEO-friendly URLs.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
}
