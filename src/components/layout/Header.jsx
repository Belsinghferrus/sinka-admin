import { Menu, LogOut, ShieldCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { ROUTES } from '../../constants.js';

export function Header({ onOpenSidebar }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case ROUTES.DASHBOARD:
        return 'Dashboard';
      case ROUTES.LOGIN:
        return 'Authentication';
      default:
        return 'Admin Panel';
    }
  };

  const title = getPageTitle(location.pathname);

  return (
    <header className="h-16 bg-white border-b border-stone-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 font-sans">
      <div className="flex items-center space-x-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onOpenSidebar}
          className="md:hidden p-2 rounded-md text-stone-600 hover:text-stone-900 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb / Title */}
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-stone-400 font-medium hidden sm:inline">Sinka Admin</span>
          <span className="text-stone-300 hidden sm:inline">/</span>
          <h1 className="font-heading font-semibold text-stone-900 text-base sm:text-lg">
            {title}
          </h1>
        </div>
      </div>

      {/* Authenticated Admin Account Area */}
      <div className="flex items-center space-x-3">
        {user ? (
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-stone-900 truncate max-w-[180px]">
                {user.displayName || user.email}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium flex items-center justify-end space-x-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
                <span>Verified Administrator</span>
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-md text-stone-500 hover:text-brand-secondary hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary transition-colors"
              title="Sign Out"
              aria-label="Sign out of Sinka Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
            Unauthenticated
          </span>
        )}
      </div>
    </header>
  );
}

export default Header;
