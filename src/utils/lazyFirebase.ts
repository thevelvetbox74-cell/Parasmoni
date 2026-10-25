/**
 * Dynamic Helper for Firebase Firestore
 * Defers Firebase initialization to post-paint idle time to keep the initial boot JS payload light.
 */

let cachedFirebase: { db: any; firestore: any; isFirebaseConfigured: boolean } | null = null;
let firebasePromise: Promise<{ db: any; firestore: any; isFirebaseConfigured: boolean } | null> | null = null;

export function getLazyFirebase(): Promise<{ db: any; firestore: any; isFirebaseConfigured: boolean } | null> {
  if (cachedFirebase) return Promise.resolve(cachedFirebase);
  if (firebasePromise) return firebasePromise;

  firebasePromise = new Promise((resolve) => {
    const loadFirebase = async () => {
      try {
        const { db, isFirebaseConfigured } = await import('../firebase/config');
        if (!isFirebaseConfigured || !db) {
          resolve(null);
          return;
        }
        const firestore = await import('firebase/firestore');
        cachedFirebase = { db, firestore, isFirebaseConfigured };
        resolve(cachedFirebase);
      } catch (err) {
        console.warn('Deferred Firebase initialization notice:', err);
        resolve(null);
      }
    };

    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          loadFirebase();
        }, { timeout: 2500 });
      } else {
        setTimeout(loadFirebase, 800);
      }
    } else {
      loadFirebase();
    }
  });

  return firebasePromise;
}
