import { useContext } from 'react';
import { AuthContext } from '../context/authContext.js';

/**
 * Custom hook to consume the Sinka Admin AuthContext.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
