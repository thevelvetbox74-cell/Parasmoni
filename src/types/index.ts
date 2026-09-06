/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Metal & Jewellery Types ---
export type MetalType = 'gold' | 'silver' | 'platinum' | 'diamond_setting';

export type GoldPurity = '24k' | '22k' | '18k' | '14k';
export type PlatinumPurity = 'pt950';
export type SilverPurity = 'sterling_925' | 'alloy';

// --- Placeholder Interfaces for Premium Showroom & Catalog ---

export interface MetalPrice {
  id: string;
  metalType: MetalType;
  purity: GoldPurity | PlatinumPurity | SilverPurity | string;
  ratePerGram: number; // Current rate in INR (Indian Rupees) or local currency
  lastUpdated: string | Date;
  updatedBy: string; // Admin ID
}

export interface Category {
  id: string;
  name: string; // e.g., "Necklaces", "Bangles", "Rings"
  slug: string;
  description?: string;
  coverImageUrl?: string;
  isActive: boolean;
  order: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Collection {
  id: string;
  name: string; // e.g., "Bridal Heritage", "Royal Polki", "Antara"
  slug: string;
  description?: string;
  coverImageUrl?: string;
  isFeatured: boolean;
  isActive: boolean;
  order: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface GemstoneDetail {
  type: string; // e.g., "Diamond", "Ruby", "Emerald", "Pearl"
  carat?: number;
  clarity?: string; // e.g., "VVS1", "VS2"
  color?: string; // e.g., "G-H", "I-J"
  count?: number;
  weightGrams?: number;
}

export interface Product {
  id: string;
  sku: string; // Stock Keeping Unit / Unique identifier for inventory
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  collectionId?: string; // Optional collection linking
  metalType: MetalType;
  purity: GoldPurity | PlatinumPurity | SilverPurity | string;
  grossWeight: number; // in grams
  netGoldWeight?: number; // gold portion weight in grams
  gemstones: GemstoneDetail[];
  images: string[]; // List of ImageKit keys or URLs
  thumbnailUrl: string;
  makingChargesPerGram?: number;
  makingChargesPercent?: number;
  isFeatured: boolean;
  mrp?: number;
  isActive: boolean;
  viewCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string; // ImageKit key or URL
  linkUrl?: string; // Where the banner navigates to
  order: number;
  isActive: boolean;
  createdAt: string | Date;
}

export interface Store {
  id: string;
  name: string; // e.g., "Kolkata Showroom"
  address: string;
  phone: string;
  email?: string;
  whatsappNumber?: string;
  mapEmbedUrl?: string;
  workingHours: string;
  isActive: boolean;
}

export interface Enquiry {
  id: string;
  enquiryNumber: string; // Readable reference ID like PM-ENQ-1001
  customerName: string;
  email?: string;
  phone: string;
  whatsappPreferred: boolean;
  productId?: string; // Optional link to specific catalog item
  productName?: string; // Cached product name
  message: string;
  status: 'pending' | 'contacted' | 'completed' | 'cancelled';
  notes?: string; // Internal admin notes
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface WebsiteSettings {
  id: string;
  showroomName: string;
  establishedYear: number;
  contactPhone: string;
  contactEmail: string;
  whatsappNumber: string;
  address: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  aboutUsText?: string;
  heroVideoUrl?: string;
}

export interface Admin {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  role: 'super_admin' | 'editor';
  isActive: boolean;
  lastLogin?: string | Date;
  createdAt: string | Date;
}
