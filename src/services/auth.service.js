import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase.js';
import apiClient, { setAuthToken } from '../lib/api.js';

/**
 * Authentication Service for Sinka Admin Panel.
 *
 * BACKEND AUTHENTICATION CONTRACT:
 * 1. POST /api/auth/firebase-login with { idToken: string }
 *    - Verifies cryptographic signature via Firebase Admin SDK
 *    - Synchronizes or retrieves customer/admin record from MongoDB
 *    - Returns user profile including `role: 'customer' | 'admin'`
 * 2. GET /api/auth/me with Authorization: Bearer <FIREBASE_ID_TOKEN>
 *    - Retrieves the current authenticated user profile
 * 3. Protected admin endpoints enforce `requireRole('admin')`.
 */

export const authService = {
  /**
   * Performs Google sign-in popup via Firebase client SDK,
   * exchanges token with Sinka backend, and verifies administrator role.
   *
   * @returns {Promise<object>} Authenticated admin profile { id, email, displayName, role }
   */
  async loginWithGoogle() {
    try {
      // 1. Open Firebase Google sign-in popup
      const userCredential = await signInWithPopup(auth, googleProvider);

      // 2. Retrieve Firebase ID token
      const idToken = await userCredential.user.getIdToken();

      // 3. Exchange token with Sinka backend verification endpoint
      const user = await this.loginWithFirebaseToken(idToken);

      return user;
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Authentication cancelled. Google popup was closed before completion.');
      }
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Sign-in popup was blocked by browser. Please allow popups for this domain.');
      }
      throw error;
    }
  },

  /**
   * Exchanges an ID token directly with the Sinka backend verification endpoint.
   * Enforces that the authenticated user strictly possesses the 'admin' role.
   *
   * @param {string} idToken - Cryptographically valid Firebase ID token.
   * @returns {Promise<object>} Authenticated administrator profile
   */
  async loginWithFirebaseToken(idToken) {
    if (!idToken || typeof idToken !== 'string' || !idToken.trim()) {
      throw new Error('A valid Firebase ID token is required.');
    }

    const trimmedToken = idToken.trim();

    // Exchange token with backend synchronization endpoint
    const response = await apiClient.post('/auth/firebase-login', { idToken: trimmedToken });

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Authentication failed on backend.');
    }

    const user = response.data?.data?.user;

    if (!user) {
      throw new Error('Backend response did not contain user profile data.');
    }

    // Strict Role Validation: Customer accounts are rejected from admin panel
    if (user.role !== 'admin') {
      // Sign out from Firebase immediately so unauthorized session does not linger
      try {
        await signOut(auth);
      } catch {
        // Ignore sign-out cleanup errors
      }
      setAuthToken(null);
      throw new Error(
        `Access denied. Your account (${user.email || 'signed in'}) does not have administrator privileges (role: '${user.role}'). Access to the Sinka Admin workspace requires role 'admin' in MongoDB.`
      );
    }

    // Attach verified token to API client
    setAuthToken(trimmedToken);

    return user;
  },

  /**
   * Retrieves the current user profile from GET /api/auth/me.
   *
   * @param {string} [token] - Optional explicit Bearer token override
   * @returns {Promise<object>} Authenticated user profile
   */
  async getCurrentUser(token) {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    const response = await apiClient.get('/auth/me', config);

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Failed to retrieve profile.');
    }

    return response.data?.data?.user || null;
  },

  /**
   * Signs out of Firebase and clears in-memory tokens.
   */
  async logout() {
    setAuthToken(null);
    try {
      await signOut(auth);
    } catch {
      // Ignore cleanup error
    }
  },
};

export default authService;
