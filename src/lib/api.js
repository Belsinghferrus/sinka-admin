import axios from 'axios';
import { auth } from '../config/firebase.js';
import { DEFAULT_API_TIMEOUT } from '../constants.js';

/**
 * Centralized Axios HTTP client for Sinka Admin Panel.
 * Configured with environment-driven base URL and standard error formatting.
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
 * Request interceptor: attaches Bearer token from in-memory state or Firebase session.
 */
let inMemoryToken = null;

export function setAuthToken(token) {
  inMemoryToken = token;
}

export function getAuthToken() {
  return inMemoryToken;
}

apiClient.interceptors.request.use(
  async (config) => {
    if (inMemoryToken) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
    } else if (!config.headers.Authorization && auth?.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Fail closed without crashing interceptor
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor: standardizes error objects without exposing server internals.
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
      inMemoryToken = null;
      fallbackMessage = 'Authentication required or session expired. Please sign in again.';
    }
    if (status === 403) fallbackMessage = 'Access denied. You do not have administrator permissions for this workspace.';
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
