import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import Button from '../../components/ui/Button.jsx';
import { ROUTES } from '../../constants.js';

export function LoginPage() {
  const { user, isAuthenticated, login, error: authError, clearError } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // If already authenticated with 'admin' role, redirect to target page or dashboard
  if (isAuthenticated && user?.role === 'admin') {
    const destination = location.state?.from?.pathname || ROUTES.DASHBOARD;
    return <Navigate to={destination} replace />;
  }

  const activeError = localError || authError;

  const validate = () => {
    const errors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      setLocalError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Sinka Brand Emblem */}
        <div className="w-12 h-12 mx-auto rounded-lg bg-brand-primary flex items-center justify-center text-white shadow-xs mb-3">
          <svg className="w-7 h-7" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <path d="M14 34L32 18L50 34" stroke="#B91F2B" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 46V36L32 26L42 36V46" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p className="text-xs uppercase font-semibold tracking-wider text-stone-500">
          Sinka Home &amp; Living
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-heading font-bold text-stone-900 tracking-tight">
          Admin Login
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-stone-600">
          Sign in with your administrator credentials to access the back office.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-lg sm:px-10 border border-stone-200">
          {/* Inline Error Alert */}
          {activeError && (
            <div
              role="alert"
              className="mb-6 rounded-md bg-red-50 border border-red-200 p-4 text-xs text-red-800 space-y-1.5"
            >
              <div className="flex items-center space-x-2 font-semibold text-red-900">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
                <span>Authentication Failed</span>
              </div>
              <p className="leading-relaxed pl-6">{activeError}</p>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5"
              >
                Administrator Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: null }));
                    }
                  }}
                  placeholder="admin@sinka.com"
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-md border text-sm text-stone-900 bg-white placeholder-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                    fieldErrors.email
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-400'
                      : 'border-stone-300 focus:border-stone-800 focus:ring-stone-400'
                  }`}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'admin-email-error' : undefined}
                />
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" aria-hidden="true" />
              </div>
              {fieldErrors.email && (
                <p id="admin-email-error" className="text-xs text-red-600 mt-1">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: null }));
                    }
                  }}
                  placeholder="Enter your password"
                  className={`w-full pl-9 pr-10 py-2.5 rounded-md border text-sm text-stone-900 bg-white placeholder-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                    fieldErrors.password
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-400'
                      : 'border-stone-300 focus:border-stone-800 focus:ring-stone-400'
                  }`}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'admin-password-error' : undefined}
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-1 text-stone-400 hover:text-stone-700 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="admin-password-error" className="text-xs text-red-600 mt-1">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-semibold shadow-xs"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Sign In
              </Button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-stone-100 text-center">
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Protected administrative area. All access attempts are logged and monitored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
