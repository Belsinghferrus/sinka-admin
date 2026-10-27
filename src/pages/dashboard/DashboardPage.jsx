import { CheckCircle2, ShieldCheck, Layers, Database } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

export function DashboardPage() {
  const { user } = useAuth();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

  return (
    <div className="space-y-6 font-sans">
      {/* Welcome Banner */}
      <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-xs">
        <h2 className="text-xl sm:text-2xl font-heading font-semibold text-stone-900">
          Welcome to Sinka Admin
        </h2>
        <p className="mt-2 text-sm text-stone-600 max-w-2xl leading-relaxed">
          Centralized administrative management workspace for Sinka Home &amp; Living back-office operations.
        </p>
      </div>

      {/* Admin Session & Foundation Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Administrator Profile Card */}
        <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center space-x-2.5 mb-3">
            <div className="p-2 rounded-md bg-stone-100 text-stone-800">
              <ShieldCheck className="w-5 h-5 text-brand-primary" />
            </div>
            <h3 className="text-base font-heading font-semibold text-stone-900">
              Administrator Profile
            </h3>
          </div>
          <div className="space-y-2 text-xs text-stone-600">
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500 font-medium">Account:</span>
              <span className="font-semibold text-stone-800">{user?.displayName || user?.email || 'Administrator'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500 font-medium">Email:</span>
              <span className="font-mono text-stone-800">{user?.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500 font-medium">Role:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                {user?.role || 'admin'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-500 font-medium">Authorization:</span>
              <span className="text-emerald-700 font-medium">Verified via MongoDB RBAC</span>
            </div>
          </div>
        </div>

        {/* Backend & API Connectivity */}
        <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center space-x-2.5 mb-3">
            <div className="p-2 rounded-md bg-stone-100 text-stone-800">
              <Database className="w-5 h-5 text-brand-primary" />
            </div>
            <h3 className="text-base font-heading font-semibold text-stone-900">
              Backend Integration
            </h3>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed mb-3">
            Active REST API endpoint: <code className="font-mono text-stone-800 bg-stone-100 px-1 py-0.5 rounded">{apiBaseUrl}</code>
          </p>
          <ul className="space-y-2 text-xs text-stone-600">
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Identity verification via Firebase Token Exchange (<code className="font-mono">POST /api/auth/firebase-login</code>)</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Session verification via Bearer token (<code className="font-mono">GET /api/auth/me</code>)</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Protected routes guarded against non-admin roles</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Application Architecture Overview */}
      <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-xs">
        <div className="flex items-center space-x-2.5 mb-3">
          <div className="p-2 rounded-md bg-stone-100 text-stone-800">
            <Layers className="w-5 h-5 text-brand-primary" />
          </div>
          <h3 className="text-base font-heading font-semibold text-stone-900">
            Core Foundation Stack
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-stone-50 rounded-md border border-stone-100">
            <p className="font-semibold text-stone-800">React 18 &amp; Vite 6</p>
            <p className="text-[11px] text-stone-500 mt-0.5">ES Modules &amp; Fast Refresh</p>
          </div>
          <div className="p-3 bg-stone-50 rounded-md border border-stone-100">
            <p className="font-semibold text-stone-800">Tailwind CSS v4</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Custom Sinka Theme Tokens</p>
          </div>
          <div className="p-3 bg-stone-50 rounded-md border border-stone-100">
            <p className="font-semibold text-stone-800">React Router DOM v7</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Protected route architecture</p>
          </div>
          <div className="p-3 bg-stone-50 rounded-md border border-stone-100">
            <p className="font-semibold text-stone-800">Axios &amp; Firebase Auth</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Automatic token refresh</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
