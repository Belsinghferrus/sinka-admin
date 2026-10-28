import axios from 'axios';
import { DEFAULT_API_TIMEOUT } from '../constants.js';

/**
 * Centralized Axios HTTP client for Sinka Admin Panel.
 * Configured with environment-driven base URL, dedicated Admin JWT handling,
 * and standardized error formatting.
 */
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

const rawBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:5001/api';
const normalizedBaseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

export const apiClient = axios.create({
  baseURL: normalizedBaseUrl,
  timeout: DEFAULT_API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

/**
 * Safe Browser Token Storage Strategy for 24-Hour Administrator JWTs:
 * - In-memory caching for zero-latency interceptor access.
 * - Browser localStorage persistence under key `sinka_admin_token` to support
 *   graceful session restoration across page reloads.
 */
export const ADMIN_TOKEN_KEY = 'sinka_admin_token';

let inMemoryToken = null;

// Initialize in-memory cache from browser storage if present
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    inMemoryToken = window.localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    inMemoryToken = null;
  }
}

/**
 * Stores or clears the administrative JWT in memory and browser storage.
 *
 * @param {string|null} token - 24-hour administrator JWT or null to purge
 */
export function setAuthToken(token) {
  inMemoryToken = token || null;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      if (token) {
        window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
      } else {
        window.localStorage.removeItem(ADMIN_TOKEN_KEY);
      }
    } catch {
      // Storage access might fail in privacy-restricted browser modes
    }
  }
}

/**
 * Retrieves the currently active administrative JWT.
 *
 * @returns {string|null} Active JWT or null
 */
export function getAuthToken() {
  if (inMemoryToken) return inMemoryToken;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(ADMIN_TOKEN_KEY);
      if (stored) {
        inMemoryToken = stored;
        return stored;
      }
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Purges the administrative JWT from both in-memory cache and browser storage.
 */
export function clearAuthToken() {
  setAuthToken(null);
}

/**
 * Request interceptor: attaches Authorization: Bearer <ADMIN_JWT> to all outgoing requests.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor: standardizes error objects without exposing server internals.
 * Automatically clears expired tokens on HTTP 401 Unauthorized.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      const isNetworkError = error.code === 'ERR_NETWORK' || error.message?.includes('Network Error');
      return Promise.reject({
        status: 0,
        code: 'NETWORK_ERROR',
        message: isNetworkError
          ? 'Unable to reach the Sinka backend server. Please verify the backend service is running on http://localhost:5001 and CORS permits http://localhost:5174.'
          : 'Network request failed. Please check your network connection.',
        data: null,
      });
    }

    const { status, data } = error.response;
    const backendMessage = data?.error?.message || data?.message;
    const backendCode = data?.error?.code || (data?.success === false ? 'API_ERROR' : undefined);

    let fallbackMessage = 'An unexpected error occurred. Please try again.';
    if (status === 400) fallbackMessage = 'Invalid request parameters.';
    if (status === 401) {
      clearAuthToken();
      fallbackMessage = 'Authentication required or administrator session expired. Please sign in again.';
    }
    if (status === 403) fallbackMessage = 'Access denied. You do not possess administrator permissions for this resource.';
    if (status === 404) fallbackMessage = 'Requested resource not found.';
    if (status === 409) fallbackMessage = 'A conflict occurred with the current state of the resource.';
    if (status === 429) fallbackMessage = 'Too many requests. Please slow down and try again later.';
    if (status >= 500) fallbackMessage = 'The server encountered an internal error. Please try again later.';

    const standardizedError = {
      status,
      code: backendCode || `HTTP_${status}`,
      message: backendMessage || fallbackMessage,
      data: data?.data || null,
      details: data?.error?.details || null,
    };

    return Promise.reject(standardizedError);
  }
);

export default apiClient;
