import { Link } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, Layers, Database, Tag, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { ROUTES } from '../../constants.js';

export function DashboardPage() {
  const { user } = useAuth();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

  return (
    <div className="space-y-6 font-sans">
      {/* Welcome Banner */}
      <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-semibold text-stone-900">
            Welcome to Sinka Admin
          </h2>
          <p className="mt-1 text-sm text-stone-600 max-w-2xl leading-relaxed">
            Centralized administrative management workspace for Sinka Home &amp; Living back-office operations.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to={ROUTES.OFFERS_NEW}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-brand-primary text-white text-xs font-semibold rounded-md shadow-xs hover:bg-brand-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Offer</span>
          </Link>
          <Link
            to={ROUTES.OFFERS}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-stone-100 text-stone-700 text-xs font-semibold rounded-md hover:bg-stone-200/80 transition-colors"
          >
            <Tag className="w-4 h-4" />
            <span>Manage Offers</span>
          </Link>
        </div>
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
              <span>Admin Authentication (<code className="font-mono">POST /api/admin/auth/login</code>)</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Admin Session Check (<code className="font-mono">GET /api/admin/auth/me</code>)</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Promotional Offers CRUD (<code className="font-mono">/api/admin/offers/*</code>)</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Promotional Offers Quick Management Panel */}
      <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-md bg-stone-100 text-stone-800">
              <Tag className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <h3 className="text-base font-heading font-semibold text-stone-900">
                Promotional Offer Management
              </h3>
              <p className="text-xs text-stone-500">
                Manage hero banners and active customer promotional campaigns
              </p>
            </div>
          </div>
          <Link
            to={ROUTES.OFFERS}
            className="text-xs font-semibold text-brand-primary hover:text-brand-primary/80 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 flex flex-col justify-between">
            <div>
              <p className="font-semibold text-stone-900">Campaign Management</p>
              <p className="text-stone-500 mt-1 text-[11px] leading-relaxed">
                Create and schedule seasonal sales banners with custom titles, imagery, and call-to-action buttons.
              </p>
            </div>
            <div className="mt-3">
              <Link
                to={ROUTES.OFFERS_NEW}
                className="text-brand-primary font-medium hover:underline inline-flex items-center space-x-1"
              >
                <span>Create new campaign</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 flex flex-col justify-between">
            <div>
              <p className="font-semibold text-stone-900">Priority &amp; Scheduling</p>
              <p className="text-stone-500 mt-1 text-[11px] leading-relaxed">
                Set priority scores and optional date windows. Backend automatically picks the highest priority active offer.
              </p>
            </div>
            <div className="mt-3">
              <Link
                to={ROUTES.OFFERS}
                className="text-brand-primary font-medium hover:underline inline-flex items-center space-x-1"
              >
                <span>Browse priority list</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 flex flex-col justify-between">
            <div>
              <p className="font-semibold text-stone-900">Live Customer Preview</p>
              <p className="text-stone-500 mt-1 text-[11px] leading-relaxed">
                Preview the exact banner currently being served to customer storefront visitors via <code className="font-mono">/active</code>.
              </p>
            </div>
            <div className="mt-3">
              <Link
                to={ROUTES.OFFERS}
                className="text-brand-primary font-medium hover:underline inline-flex items-center space-x-1"
              >
                <span>Launch preview tool</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
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
            <p className="font-semibold text-stone-800">Axios &amp; 24h JWT Auth</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Bearer authorization</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
