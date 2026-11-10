/**
 * Centralized Environment Configuration for Sinka Admin Frontend.
 *
 * Exposes the REST API base URL strictly resolved from Vite environment variables (VITE_API_BASE_URL).
 * - Local development: loaded by Vite from local .env
 * - Production: loaded by Vite from Netlify Environment Variables
 */

const getRawBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  const proc = typeof globalThis !== 'undefined' ? globalThis.process : undefined;
  if (proc?.env?.VITE_API_BASE_URL) {
    return proc.env.VITE_API_BASE_URL;
  }
  // In Node.js environments (such as unit test runners), read from local .env if present
  if (typeof window === 'undefined' && proc) {
    try {
      const fs = proc.getBuiltinModule ? proc.getBuiltinModule('node:fs') : undefined;
      if (fs && fs.existsSync('.env')) {
        const content = fs.readFileSync('.env', 'utf8');
        const match = content.match(/^VITE_API_BASE_URL=(.+)$/m);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    } catch {
      // Fallback to empty string if filesystem cannot be read
    }
  }
  return '';
};

const rawBaseUrl = getRawBaseUrl().trim();

if (!rawBaseUrl && typeof window !== 'undefined' && typeof console !== 'undefined' && console.warn) {
  console.warn(
    '[sinka-admin:config] VITE_API_BASE_URL is not set. Please configure it in your .env or Netlify environment.'
  );
}

// Strip any trailing slash for consistent route concatenation
const normalizedUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

/**
 * Backend server root origin. Strips any trailing "/api" if present.
 */
export const BACKEND_URL = normalizedUrl.endsWith('/api')
  ? normalizedUrl.slice(0, -4)
  : normalizedUrl;

/**
 * Centralized REST API Base URL for Axios and all API service requests.
 * Ensures the "/api" prefix is present so existing service paths (/admin/products, /admin/orders, etc.)
 * route to the backend's mounted /api/admin/* endpoints.
 */
export const API_BASE_URL = normalizedUrl.endsWith('/api')
  ? normalizedUrl
  : (normalizedUrl ? `${normalizedUrl}/api` : '/api');

export const IS_PRODUCTION =
  typeof import.meta !== 'undefined' && import.meta.env
    ? Boolean(import.meta.env.PROD)
    : Boolean(typeof globalThis !== 'undefined' && globalThis.process?.env?.NODE_ENV === 'production');

export const IS_DEVELOPMENT = !IS_PRODUCTION;

export default API_BASE_URL;
