import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

/**
 * Public Firebase Web App Configuration for Sinka Admin.
 * Reuses the verified Sinka Firebase project credentials.
 *
 * NOTE: Never expose Firebase Admin SDK credentials or service account
 * private keys in frontend browser client code.
 */
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyCeBi4gl7JLn1NWU6jFoSugV_Mj22PG7do',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'sinka-project.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'sinka-project',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'sinka-project.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '621333774949',
  appId: env.VITE_FIREBASE_APP_ID || '1:621333774949:web:45aaae937c2f43f5ba7c8c',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-87718TM9BM',
};

// Initialize or reuse existing Firebase App instance
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Always prompt account selection so admins can select their work/admin account
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export default app;
