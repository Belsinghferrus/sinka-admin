import { createContext } from 'react';

/**
 * React context instance for Sinka Admin authentication.
 * Separated into a pure JS file for optimal Vite React Fast Refresh compatibility.
 */
export const AuthContext = createContext(null);

export default AuthContext;
