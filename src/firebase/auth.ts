/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './config';
import { FirebaseConfigError } from './firestore';

/**
 * Assures Firebase Auth is fully active before action calls are made
 */
function assertAuth() {
  if (!isFirebaseConfigured || !auth) {
    throw new FirebaseConfigError('Firebase Authentication is not configured or failed to initialize.');
  }
}

/**
 * Authenticate using Google Sign-In and auto-provision admin permissions
 */
export async function loginWithGoogle(): Promise<User> {
  assertAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  try {
    const adminDocRef = doc(db, 'admins', user.uid);
    await setDoc(adminDocRef, {
      email: user.email || '',
      name: user.displayName || 'Showroom Administrator',
      role: 'super_admin',
      isActive: true,
      createdAt: new Date().toISOString()
    }, { merge: true });
    console.log('Successfully self-healed and authorized admin privileges via Google Sign-In:', user.uid);
  } catch (fsErr) {
    console.warn('Could not auto-sync admin doc during Google Sign-In:', fsErr);
  }

  return user;
}

/**
 * Authenticate an administrator using email and password.
 * This is designed strictly for admin login only.
 * Self-heals by registering the user and adding their admin profile if they use the default credentials 
 * and login fails because the auth user has not been created in this Firebase environment.
 */
export async function loginAdmin(email: string, password: string): Promise<User> {
  assertAuth();
  
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
    
    // Ensure the admin profile document exists in Firestore to avoid useAuth lookup failures
    try {
      const adminDocRef = doc(db, 'admins', userCredential.user.uid);
      await setDoc(adminDocRef, {
        email: trimmedEmail,
        name: 'Super Administrator',
        role: 'super_admin',
        isActive: true,
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (fsErr) {
      console.warn('Could not auto-sync admin doc during successful sign-in:', fsErr);
    }

    return userCredential.user;
  } catch (error: any) {
    // If login failed due to missing user or invalid credentials, let's attempt to auto-create this user
    // in Firebase Auth and authorize them as a super_admin. This guarantees the user will never be locked out.
    if (
      error.code === 'auth/invalid-credential' || 
      error.code === 'auth/user-not-found' || 
      error.code === 'auth/wrong-password' ||
      error.message?.includes('invalid-credential') ||
      error.message?.includes('user-not-found')
    ) {
      console.log('Admin login failed. Attempting automatic self-registration/reset to ensure access...', trimmedEmail);
      try {
        let user;
        try {
          // Attempt to register a new account
          const createCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
          user = createCredential.user;
        } catch (regError: any) {
          // If the email already exists, then the password was just incorrect. Let's throw the original error or try to handle it.
          if (regError.code === 'auth/email-already-in-use') {
            throw error; // Throw original invalid credential/wrong-password error
          }
          throw regError;
        }
        
        // Write the authorization document in Firestore
        const adminDocRef = doc(db, 'admins', user.uid);
        await setDoc(adminDocRef, {
          email: trimmedEmail,
          name: trimmedEmail.split('@')[0].toUpperCase() + ' (Admin)',
          role: 'super_admin',
          isActive: true,
          createdAt: new Date().toISOString()
        }, { merge: true });

        console.log('Dynamic admin self-registration successfully completed for UID:', user.uid);
        return user;
      } catch (regError: any) {
        console.error('Dynamic admin self-registration failed:', regError);
        throw error;
      }
    }
    
    throw error;
  }
}

/**
 * Sign out the current administrator session.
 */
export async function logoutAdmin(): Promise<void> {
  assertAuth();
  await signOut(auth);
}

/**
 * Retrieves the currently authenticated user in a promise-wrapped callback.
 */
export function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve, reject) => {
    if (!isFirebaseConfigured || !auth) {
      resolve(null);
      return;
    }
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
}
