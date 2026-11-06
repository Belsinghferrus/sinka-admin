import { Menu } from 'lucide-react';
import AdminProfileCapsule from './AdminProfileCapsule.jsx';

export function Header({ onOpenSidebar }) {
  return (
    <header className="h-16 shrink-0 bg-white border-b border-stone-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 font-sans">
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

        {/* Global Branding & Context (Static across all pages) */}
        <div className="flex items-center space-x-2.5">
          <span className="font-heading font-semibold text-stone-900 text-sm sm:text-base tracking-tight">
            Sinka Admin
          </span>
          <span className="text-stone-300 font-light select-none" aria-hidden="true">/</span>
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-stone-500 select-none">
            Back Office
          </span>
        </div>
      </div>

      {/* Authenticated Admin Account Capsule */}
      <div className="flex items-center">
        <AdminProfileCapsule />
      </div>
    </header>
  );
}

export default Header;

