import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import LoadingIndicator from '../ui/LoadingIndicator.jsx';
import { ROUTES } from '../../constants.js';

/**
 * Route Guard for Sinka Admin Workspace.
 *
 * Enforces:
 * 1. Non-rendering of protected content while auth is resolving (isLoading).
 * 2. Redirection of unauthenticated visitors to /login.
 * 3. Validation of the 'admin' role using trusted backend data from MongoDB.
 * 4. Rejection of customer accounts.
 */
export function ProtectedRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. Never render protected content while authentication is unresolved
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <LoadingIndicator
          message="Verifying administrator authorization..."
          size="lg"
          fullPage={false}
        />
      </div>
    );
  }

  // 2. Redirect unauthenticated users to login page
  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // 3. Reject non-admin roles strictly
  if (user.role !== 'admin') {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location, reason: 'forbidden' }} replace />;
  }

  // 4. Authorized administrator confirmed
  return children ? children : <Outlet />;
}

export default ProtectedRoute;
