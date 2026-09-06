/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function getWishlist(): string[] {
  try {
    const data = localStorage.getItem('parasmoni_wishlist');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function isProductWishlisted(productId: string): boolean {
  if (!productId) return false;
  const list = getWishlist();
  return list.includes(productId);
}

export function toggleWishlist(productId: string): boolean {
  if (!productId) return false;
  try {
    const wishlist = getWishlist();
    const index = wishlist.indexOf(productId);
    let isFavorited = false;
    if (index > -1) {
      wishlist.splice(index, 1);
    } else {
      wishlist.push(productId);
      isFavorited = true;
    }
    localStorage.setItem('parasmoni_wishlist', JSON.stringify(wishlist));
    window.dispatchEvent(new CustomEvent('wishlist-updated'));
    return isFavorited;
  } catch (e) {
    return false;
  }
}
