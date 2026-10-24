/**
 * Dynamic Helper for Firebase Firestore
 * Keeps Firebase imports out of the critical main & Home bundle for instant initial JS parsing.
 */

export async function getLazyFirebase() {
  try {
    const { db, isFirebaseConfigured } = await import('../firebase/config');
    if (!isFirebaseConfigured || !db) return null;
    const firestore = await import('firebase/firestore');
    return { db, firestore, isFirebaseConfigured };
  } catch (err) {
    console.warn('Deferred Firebase initialization notice:', err);
    return null;
  }
}
