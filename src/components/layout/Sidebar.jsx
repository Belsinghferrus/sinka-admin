import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LogOut, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { ROUTES } from '../../constants.js';

export function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  const navItems = [
    {
      name: 'Dashboard',
      path: ROUTES.DASHBOARD,
      icon: LayoutDashboard,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-stone-200 flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Admin Navigation"
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-stone-200">
          <div className="flex items-center space-x-3">
            {/* Sinka Emblem */}
            <div className="w-8 h-8 rounded-md bg-brand-primary flex items-center justify-center text-white shrink-0 shadow-xs">
              <svg className="w-5 h-5" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <path d="M14 34L32 18L50 34" stroke="#B91F2B" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 46V36L32 26L42 36V46" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <span className="font-heading font-semibold text-stone-900 text-sm tracking-tight block">
                Sinka Admin
              </span>
              <span className="text-[10px] text-stone-500 font-medium tracking-wide block uppercase">
                Back Office
              </span>
            </div>
          </div>

          {/* Close Button on Mobile */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items (Only genuinely implemented routes) */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-stone-700 hover:text-brand-primary hover:bg-stone-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 mr-3 shrink-0" aria-hidden="true" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Authenticated Admin User Panel in Footer */}
        {user && (
          <div className="p-3 border-t border-stone-200 bg-stone-50">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-2">
                <p className="text-xs font-semibold text-stone-900 truncate">
                  {user.displayName || user.email}
                </p>
                <div className="flex items-center space-x-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="text-[10px] text-stone-500 uppercase font-medium">
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-md text-stone-500 hover:text-brand-secondary hover:bg-stone-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary"
                title="Sign Out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;
