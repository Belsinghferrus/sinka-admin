import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { KeyRound, AlertCircle, ChevronDown, ChevronUp, Server } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { ROUTES } from '../../constants.js';

export function LoginPage() {
  const { user, isAuthenticated, isLoading, loginWithGoogle, loginWithToken, error: authError, clearError } = useAuth();
  const location = useLocation();

  const [tokenInput, setTokenInput] = useState('');
  const [showTokenLogin, setShowTokenLogin] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

  // If already authenticated with 'admin' role, redirect to target or dashboard
  if (isAuthenticated && user?.role === 'admin') {
    const destination = location.state?.from?.pathname || ROUTES.DASHBOARD;
    return <Navigate to={destination} replace />;
  }

  const activeError = localError || authError;

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearError();
    setActionLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setLocalError(err.message || 'Google authentication failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTokenSignIn = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setLocalError('Please enter a Firebase ID token to verify.');
      return;
    }

    setLocalError(null);
    clearError();
    setActionLoading(true);
    try {
      await loginWithToken(tokenInput.trim());
    } catch (err) {
      setLocalError(err.message || 'Failed to authenticate with provided token.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Sinka Emblem */}
        <div className="w-12 h-12 mx-auto rounded-lg bg-brand-primary flex items-center justify-center text-white shadow-xs mb-3">
          <svg className="w-7 h-7" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <path d="M14 34L32 18L50 34" stroke="#B91F2B" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 46V36L32 26L42 36V46" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-xl sm:text-2xl font-heading font-semibold text-stone-900 tracking-tight">
          Sinka Admin Portal
        </h1>
        <p className="mt-1 text-xs text-stone-500">
          Back-Office Workspace Authentication
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-sm rounded-lg sm:px-10 border border-stone-200 space-y-6">
          {/* Error Alert */}
          {activeError && (
            <div
              role="alert"
              className="rounded-md bg-red-50 border border-red-200 p-4 text-xs text-red-800 space-y-1.5"
            >
              <div className="flex items-center space-x-2 font-semibold text-red-900">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
                <span>Authentication Denied</span>
              </div>
              <p className="leading-relaxed pl-6">{activeError}</p>
            </div>
          )}

          {/* Primary Action: Google Authentication via Firebase */}
          <div className="space-y-4">
            <p className="text-xs text-stone-600 leading-relaxed">
              Sign in with your verified Sinka administrator Google account. The backend strictly requires a MongoDB record with <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-stone-800">role: 'admin'</code>.
            </p>

            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full flex items-center justify-center font-medium shadow-xs"
              onClick={handleGoogleSignIn}
              isLoading={actionLoading || isLoading}
              disabled={actionLoading || isLoading}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign In with Google (Administrator)
            </Button>
          </div>

          {/* Secondary Action: Developer / Test Token Verification */}
          <div className="pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setShowTokenLogin(!showTokenLogin)}
              className="flex items-center justify-between w-full text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors"
            >
              <span className="flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-stone-400" />
                <span>Developer / Direct Token Verification</span>
              </span>
              {showTokenLogin ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showTokenLogin && (
              <form onSubmit={handleTokenSignIn} className="mt-3 space-y-3 bg-stone-50 p-3.5 rounded-md border border-stone-200">
                <p className="text-[11px] text-stone-500 leading-normal">
                  Paste a raw Firebase ID token to verify directly against <code className="font-mono">POST /api/auth/firebase-login</code> and validate the returned MongoDB role.
                </p>
                <Input
                  id="admin-token"
                  label="Firebase ID Token"
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="eyJhbGciOiJSUzI1NiIs..."
                  autoComplete="off"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  isLoading={actionLoading}
                  disabled={actionLoading || !tokenInput.trim()}
                >
                  Verify Administrator Token
                </Button>
              </form>
            )}
          </div>

          {/* Backend Architecture & Connectivity Note */}
          <div className="rounded-md bg-stone-50 border border-stone-200/80 p-3.5 text-xs text-stone-600 space-y-2">
            <div className="flex items-center space-x-2 text-stone-800 font-semibold">
              <Server className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Backend Contract Specifications</span>
            </div>
            <div className="text-[11px] text-stone-500 space-y-1">
              <p>Target Backend: <code className="font-mono text-stone-700 bg-white px-1 py-0.5 rounded border border-stone-200">{apiBaseUrl}</code></p>
              <p>Contract: <code className="font-mono text-stone-700 bg-white px-1 py-0.5 rounded border border-stone-200">POST /api/auth/firebase-login</code> &amp; <code className="font-mono text-stone-700 bg-white px-1 py-0.5 rounded border border-stone-200">GET /api/auth/me</code></p>
              <p className="text-amber-800 font-medium pt-1">
                Notice: Backend CORS configuration must permit <code className="font-mono bg-amber-100/70 px-1 py-0.5 rounded">http://localhost:5174</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
