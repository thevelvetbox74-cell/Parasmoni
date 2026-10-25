export interface ImageRoleConfig {
  width: number;
  quality: number;
}

export declare const IMAGE_ROLES: {
  HERO_MOBILE: ImageRoleConfig;
  HERO_DESKTOP: ImageRoleConfig;
  CATEGORY_TILE: ImageRoleConfig;
  DESKTOP_PEEKING: ImageRoleConfig;
  PRODUCT_CARD: ImageRoleConfig;
  THUMBNAIL: ImageRoleConfig;
};

export declare function getRoleImageUrl(url?: string | null, roleName?: keyof typeof IMAGE_ROLES): string;
