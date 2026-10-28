import apiClient, { setAuthToken, getAuthToken, clearAuthToken } from '../lib/api.js';

/**
 * Parses the payload of a JSON Web Token without external libraries.
 * Treat this as ADVISORY only; the backend remains the authoritative authority.
 *
 * @param {string} token - Raw JWT string
 * @returns {object|null} Decoded JSON payload or null
 */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Advisory check to determine if a JWT has expired according to its `exp` claim.
 *
 * @param {string} token - Raw JWT string
 * @returns {boolean} True if definitely expired locally; false otherwise
 */
export function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return false;
  // Expired if current epoch is past expiration timestamp (with 10-second skew tolerance)
  return payload.exp * 1000 <= Date.now() + 10000;
}

/**
 * Dedicated Authentication Service for Sinka Admin Back Office.
 *
 * BACKEND ADMIN AUTH CONTRACT:
 * - POST /api/admin/auth/login with { email, password }
 *   Issues a signed 24-hour HS256 JWT containing { adminId, email, role: 'admin' }.
 * - GET /api/admin/auth/me with Authorization: Bearer <token>
 *   Verifies active administrator in MongoDB and returns profile.
 * - POST /api/admin/auth/logout
 *   Stateless logout endpoint.
 */
export const authService = {
  /**
   * Authenticates an administrator with email and password credentials.
   *
   * @param {object} credentials
   * @param {string} credentials.email - Administrator email
   * @param {string} credentials.password - Administrator password
   * @returns {Promise<object>} Authenticated administrator profile
   */
  async login({ email, password }) {
    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new Error('Please enter your administrator email address.');
    }

    if (!password || typeof password !== 'string') {
      throw new Error('Please enter your administrator password.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const response = await apiClient.post('/admin/auth/login', {
        email: normalizedEmail,
        password,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error?.message || 'Authentication failed.');
      }

      const token = response.data?.data?.token || response.data?.token;
      const user = response.data?.data?.user || response.data?.user;

      if (!token || typeof token !== 'string') {
        throw new Error('Backend response did not include a valid administrative session token.');
      }

      if (!user) {
        throw new Error('Backend response did not include administrator profile data.');
      }

      // Defense-in-depth: Ensure role is strictly 'admin'
      if (user.role !== 'admin') {
        clearAuthToken();
        throw new Error(
          'Access denied: Your account does not possess administrator privileges for this workspace.'
        );
      }

      // Safely persist the 24-hour JWT in memory and browser storage
      setAuthToken(token);

      return user;
    } catch (err) {
      clearAuthToken();
      throw err;
    }
  },

  /**
   * Retrieves the current administrator profile from GET /api/admin/auth/me.
   *
   * @param {string} [token] - Optional explicit Bearer token override
   * @returns {Promise<object>} Authenticated administrator profile
   */
  async getCurrentUser(token) {
    const activeToken = token || getAuthToken();
    if (!activeToken) {
      throw new Error('No active session token available.');
    }

    // Advisory check: if the token is already expired according to its exp claim, purge immediately
    if (isTokenExpired(activeToken)) {
      clearAuthToken();
      throw new Error('Administrator session has expired. Please sign in again.');
    }

    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    const response = await apiClient.get('/admin/auth/me', config);

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message || 'Failed to retrieve administrator profile.');
    }

    const user = response.data?.data?.user;
    if (!user || user.role !== 'admin') {
      clearAuthToken();
      throw new Error('Access denied: Administrator permissions required.');
    }

    return user;
  },

  /**
   * Terminates the administrator session:
   * 1. Calls POST /api/admin/auth/logout on the backend (non-blocking).
   * 2. Purges the JWT from in-memory cache and browser storage.
   */
  async logout() {
    try {
      await apiClient.post('/admin/auth/logout');
    } catch {
      // Stateless token logout: failure to reach backend does not block local session clearance
    } finally {
      clearAuthToken();
    }
  },

  /**
   * Checks if an active token currently exists in storage or memory.
   *
   * @returns {boolean}
   */
  hasStoredSession() {
    const token = getAuthToken();
    if (!token) return false;
    if (isTokenExpired(token)) {
      clearAuthToken();
      return false;
    }
    return true;
  },

  isTokenExpired,
  decodeJwtPayload,
};

export default authService;
