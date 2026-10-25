/**
 * Shared Image Role Definitions (ESM)
 * Standardized roles for image viewport targets across Parasmoni store.
 */

import { resizeImageUrl } from './imageUrl.shared.mjs';

export const IMAGE_ROLES = {
  HERO_MOBILE: { width: 720, quality: 60 },
  HERO_DESKTOP: { width: 1200, quality: 70 },
  CATEGORY_TILE: { width: 240, quality: 55 },
  DESKTOP_PEEKING: { width: 480, quality: 60 },
  PRODUCT_CARD: { width: 360, quality: 60 },
  THUMBNAIL: { width: 160, quality: 50 },
};

/**
 * Resizes an image URL based on predefined role.
 * @param {string} url
 * @param {keyof typeof IMAGE_ROLES} roleName
 * @returns {string}
 */
export function getRoleImageUrl(url, roleName) {
  const config = IMAGE_ROLES[roleName] || IMAGE_ROLES.PRODUCT_CARD;
  return resizeImageUrl(url, config.width, config.quality);
}
