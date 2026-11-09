/**
 * Centralized Environment Configuration for Sinka Admin Frontend.
 *
 * Automatically resolves the backend server origin and REST API base URL
 * based on Vite environment variables (VITE_API_BASE_URL).
 *
 * Environment resolution precedence:
 * 1. import.meta.env.VITE_API_BASE_URL (injected by Vite per mode / Netlify)
 * 2. process.env.VITE_API_BASE_URL (fallback for Node.js test runners)
 * 3. Default fallback: http://localhost:5001
 */

const getRawBaseUrl = () => {
  // In production build, Vite replaces import.meta.env.PROD with true,
  // enabling Rollup to dead-code eliminate the development fallback branch.
  if (import.meta.env?.PROD) {
    return import.meta.env.VITE_API_BASE_URL || 'https://sinka-backend-xxgb.onrender.com';
  }
  const proc = typeof globalThis !== 'undefined' ? globalThis.process : undefined;
  if (proc?.env?.VITE_API_BASE_URL) {
    return proc.env.VITE_API_BASE_URL;
  }
  return import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5001';
};

const rawBaseUrl = getRawBaseUrl().trim();

// Strip any trailing slash for consistent route concatenation
const normalizedUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

/**
 * Backend server root origin (e.g. "http://localhost:5001" or "https://sinka-backend-xxgb.onrender.com").
 * Strips any trailing "/api" if present.
 */
export const BACKEND_URL = normalizedUrl.endsWith('/api')
  ? normalizedUrl.slice(0, -4)
  : normalizedUrl;

/**
 * Centralized REST API Base URL for Axios and all API service requests.
 * Ensures the "/api" prefix is present so existing service paths (/admin/products, /admin/orders, etc.)
 * route to the backend's mounted /api/admin/* endpoints.
 *
 * Development: "http://localhost:5001/api"
 * Production:  "https://sinka-backend-xxgb.onrender.com/api"
 */
export const API_BASE_URL = normalizedUrl.endsWith('/api')
  ? normalizedUrl
  : `${normalizedUrl}/api`;

export const IS_PRODUCTION =
  typeof import.meta !== 'undefined' && import.meta.env
    ? Boolean(import.meta.env.PROD)
    : Boolean(typeof globalThis !== 'undefined' && globalThis.process?.env?.NODE_ENV === 'production');

export const IS_DEVELOPMENT = !IS_PRODUCTION;

export default API_BASE_URL;
