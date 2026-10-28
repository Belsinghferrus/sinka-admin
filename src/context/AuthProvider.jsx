import { useState, useEffect, useCallback, useRef } from 'react';
import authService from '../services/auth.service.js';
import { AuthContext } from './authContext.js';

/**
 * Authentication Provider for Sinka Admin Workspace.
 *
 * Manages 24-hour administrator JWT sessions:
 * 1. Synchronizes login through POST /api/admin/auth/login.
 * 2. Restores sessions on reload through GET /api/admin/auth/me.
 * 3. Enforces single initialization to prevent duplicate verification requests or redirect loops.
 * 4. Automatically clears invalid/expired tokens and updates application state.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Prevent duplicate initialization calls in React StrictMode
  const hasInitialized = useRef(false);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Primary administrator login using email and password.
   *
   * @param {object} credentials
   * @param {string} credentials.email
   * @param {string} credentials.password
   * @returns {Promise<object>} Authenticated admin profile
   */
  const login = useCallback(async ({ email, password }) => {
    setIsLoading(true);
    setError(null);
    try {
      const adminUser = await authService.login({ email, password });
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
   * Terminate admin session and redirect.
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
   * Restore administrator session on initial page load / refresh.
   */
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    async function initializeSession() {
      // Check if a stored JWT exists
      if (!authService.hasStoredSession()) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await authService.getCurrentUser();
        if (profile && profile.role === 'admin') {
          setUser(profile);
          setError(null);
        } else {
          await authService.logout();
          setUser(null);
          setError('Access denied: Administrator permissions required.');
        }
      } catch (err) {
        // Token is expired, invalid, or server rejected it
        await authService.logout();
        setUser(null);
        if (err.status === 0) {
          setError('Backend server unreachable. Could not synchronize administrator session.');
        } else if (err.status === 401) {
          setError('Administrator session has expired. Please sign in again.');
        } else if (err.status === 403) {
          setError(err.message || 'Access denied: Administrator permissions required.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    initializeSession();
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user && user.role === 'admin'),
    isLoading,
    error,
    clearError,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
