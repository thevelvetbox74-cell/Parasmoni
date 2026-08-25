/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc as firestoreAddDoc, 
  updateDoc as firestoreUpdateDoc, 
  deleteDoc as firestoreDeleteDoc,
  query,
  QueryConstraint
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

/**
 * Custom Error for Firebase configuration issues
 */
export class FirebaseConfigError extends Error {
  constructor(message = 'Firebase is not configured or failed to initialize.') {
    super(message);
    this.name = 'FirebaseConfigError';
  }
}

/**
 * Assures Firebase is fully active before firestore calls are made
 */
function assertFirestore() {
  if (!isFirebaseConfigured || !db) {
    throw new FirebaseConfigError();
  }
}

/**
 * Retrieves all documents from a specific Firestore collection, with optional filters.
 */
export async function getCollectionDocs<T>(
  collectionName: string, 
  queryConstraints: QueryConstraint[] = []
): Promise<T[]> {
  assertFirestore();
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, ...queryConstraints);
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as unknown as T));
}

/**
 * Retrieves a single document by its Firestore Document ID.
 */
export async function getDocById<T>(collectionName: string, id: string): Promise<T | null> {
  assertFirestore();
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return {
    id: docSnap.id,
    ...docSnap.data()
  } as unknown as T;
}

/**
 * Adds a new document to a specified Firestore collection.
 */
export async function addDocToCollection<T extends Record<string, any>>(
  collectionName: string, 
  data: T
): Promise<string> {
  assertFirestore();
  const collectionRef = collection(db, collectionName);
  const docRef = await firestoreAddDoc(collectionRef, {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return docRef.id;
}

/**
 * Updates an existing document in a specified Firestore collection.
 */
export async function updateDocInCollection<T extends Record<string, any>>(
  collectionName: string, 
  id: string, 
  data: Partial<T>
): Promise<void> {
  assertFirestore();
  const docRef = doc(db, collectionName, id);
  await firestoreUpdateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Deletes a document from a specified Firestore collection.
 */
export async function deleteDocFromCollection(collectionName: string, id: string): Promise<void> {
  assertFirestore();
  const docRef = doc(db, collectionName, id);
  await firestoreDeleteDoc(docRef);
}
