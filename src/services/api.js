/**
 * Centralized API Client Export for Sinka Admin Services.
 *
 * Provides single point of access to the configured Axios HTTP client,
 * authorization token management, and error interceptors.
 */
import apiClient, {
  setAuthToken,
  getAuthToken,
  clearAuthToken,
  ADMIN_TOKEN_KEY,
} from '../lib/api.js';

export {
  apiClient,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
  ADMIN_TOKEN_KEY,
};

export default apiClient;

