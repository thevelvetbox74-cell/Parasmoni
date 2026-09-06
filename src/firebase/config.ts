/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  enableMultiTabIndexedDbPersistence,
  enableIndexedDbPersistence 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Robust check to see if Firebase environment variables are defined
export const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let app;
let db: any = null;
let auth: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Enable Firestore IndexedDB offline persistence for instant loads & background sync
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch (cacheErr) {
      db = getFirestore(app);
      if (typeof window !== 'undefined') {
        enableMultiTabIndexedDbPersistence(db).catch((err) => {
          if (err.code === 'failed-precondition') {
            enableIndexedDbPersistence(db).catch((singleTabErr) => {
              console.warn('Firestore single tab persistence notice:', singleTabErr);
            });
          } else if (err.code === 'unimplemented') {
            console.warn('Browser does not support Firestore IndexedDB persistence.');
          }
        });
      }
    }

    auth = getAuth(app);
  } catch (error) {
    console.error('Failed to initialize Firebase SDK:', error);
  }
} else {
  if (import.meta.env.DEV) {
    console.warn(
      'Firebase environment variables are missing. Showroom features requiring cloud persistence will be disabled or fallback to mock data.'
    );
  }
}

export { db, auth };
