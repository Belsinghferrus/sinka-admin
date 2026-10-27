import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase.js';
import authService from '../services/auth.service.js';
import { setAuthToken } from '../lib/api.js';
import { AuthContext } from './authContext.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Google OAuth login via Firebase with backend admin role validation.
   */
  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const adminUser = await authService.loginWithGoogle();
      setUser(adminUser);
      return adminUser;
    } catch (err) {
      const message = err.message || 'Authentication failed.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Direct token verification for testing, headless environments, or token paste.
   */
  const loginWithToken = useCallback(async (token) => {
    setIsLoading(true);
    setError(null);
    try {
      const adminUser = await authService.loginWithFirebaseToken(token);
      setUser(adminUser);
      return adminUser;
    } catch (err) {
      const message = err.message || 'Token verification failed.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Terminate admin session.
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Automatic session restoration across page reloads via Firebase onAuthStateChanged.
   * Securely validates with backend GET /api/auth/me and rejects non-admin users.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          setAuthToken(token);
          const profile = await authService.getCurrentUser(token);

          if (profile && profile.role === 'admin') {
            setUser(profile);
            setError(null);
          } else {
            // User does not possess administrator role in MongoDB
            await authService.logout();
            setUser(null);
            setError(
              `Access denied: Account ${firebaseUser.email || ''} does not have administrator privileges.`
            );
          }
        } catch (err) {
          // If backend is unreachable or session expired
          setAuthToken(null);
          setUser(null);
          if (err.status === 0) {
            setError('Backend server unreachable. Could not synchronize administrator session.');
          }
        }
      } else {
        setAuthToken(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user && user.role === 'admin'),
    isLoading,
    error,
    clearError,
    loginWithGoogle,
    loginWithToken,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
