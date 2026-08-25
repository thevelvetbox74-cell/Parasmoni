/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Category, Collection } from '../types';
import { db, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs, doc, getDoc, query, where, limit, orderBy } from 'firebase/firestore';

/**
 * Catalogue Data Service
 * Implements clean retrieval of showroom metadata, categories, collections, and products.
 */
export class ProductService {
  /**
   * Retrieves all active jewellery categories, sorted by display order.
   */
  static async getCategories(): Promise<Category[]> {
    if (!isFirebaseConfigured) {
      return this.getMockCategories();
    }

    try {
      const categoriesCol = collection(db, 'categories');
      const q = query(categoriesCol, where('isActive', '==', true), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    } catch (error) {
      console.error('Error fetching categories from Firestore:', error);
      return this.getMockCategories();
    }
  }

  /**
   * Retrieves all active premium design collections.
   */
  static async getCollections(): Promise<Collection[]> {
    if (!isFirebaseConfigured) {
      return this.getMockCollections();
    }

    try {
      const collectionsCol = collection(db, 'collections');
      const q = query(collectionsCol, where('isActive', '==', true), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Collection));
    } catch (error) {
      console.error('Error fetching collections from Firestore:', error);
      return this.getMockCollections();
    }
  }

  /**
   * Retrieves products by category.
   */
  static async getProductsByCategory(categoryId: string): Promise<Product[]> {
    if (!isFirebaseConfigured) {
      return this.getMockProducts().filter(p => p.categoryId === categoryId);
    }

    try {
      const productsCol = collection(db, 'products');
      const q = query(
        productsCol,
        where('categoryId', '==', categoryId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      console.error(`Error fetching products for category ${categoryId}:`, error);
      return this.getMockProducts().filter(p => p.categoryId === categoryId);
    }
  }

  /**
   * Retrieves a specific product by its URL-friendly slug.
   */
  static async getProductBySlug(slug: string): Promise<Product | null> {
    if (!isFirebaseConfigured) {
      const found = this.getMockProducts().find(p => p.slug === slug);
      return found || null;
    }

    try {
      const productsCol = collection(db, 'products');
      const q = query(productsCol, where('slug', '==', slug), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const firstDoc = snapshot.docs[0];
      return { id: firstDoc.id, ...firstDoc.data() } as Product;
    } catch (error) {
      console.error(`Error fetching product with slug ${slug}:`, error);
      return this.getMockProducts().find(p => p.slug === slug) || null;
    }
  }

  // --- Mock Fallbacks for Dev & Offline Review ---

  private static getMockCategories(): Category[] {
    return [
      {
        id: 'cat-necklaces',
        name: 'Necklaces & Chokers',
        slug: 'necklaces',
        description: 'Exquisite bridal necklaces, royal chokers, and heritage haars.',
        coverImageUrl: '',
        isActive: true,
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'cat-bangles',
        name: 'Bangles & Kadas',
        slug: 'bangles-kadas',
        description: 'Traditional and contemporary hand-crafted gold and polki bangles.',
        coverImageUrl: '',
        isActive: true,
        order: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  private static getMockCollections(): Collection[] {
    return [
      {
        id: 'coll-bridal',
        name: 'Bridal Heritage 1974',
        slug: 'bridal-heritage-1974',
        description: 'Signature bridal masterpieces celebrating 50+ years of fine craftsmanship.',
        coverImageUrl: '',
        isFeatured: true,
        isActive: true,
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  private static getMockProducts(): Product[] {
    return [
      {
        id: 'prod-antique-haar',
        sku: 'PM-22K-N001',
        name: 'Antique Gold Heritage Haar',
        slug: 'antique-gold-heritage-haar',
        description: 'Magnificent 22 karat gold necklace embellished with traditional filigree work and kundan accents.',
        categoryId: 'cat-necklaces',
        collectionId: 'coll-bridal',
        metalType: 'gold',
        purity: '22k',
        grossWeight: 48.5,
        netGoldWeight: 48.5,
        gemstones: [],
        images: [],
        thumbnailUrl: '',
        makingChargesPerGram: 450,
        isFeatured: true,
        isActive: true,
        viewCount: 120,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
}
