import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

/**
 * Computes a clean 1-to-2 letter uppercase initial monogram for the administrator.
 *
 * @param {string} [name]
 * @param {string} [email]
 * @returns {string} 1-2 character monogram (e.g. "SH", "AR", "AD")
 */
function getInitials(name, email) {
  if (name && typeof name === 'string' && name.trim().length > 0 && name.includes(' ') && !name.includes('@')) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
  }

  const source = (email || name || '').trim();
  if (source.length > 0) {
    const localPart = source.split('@')[0];
    const cleaned = localPart.replace(/[^a-zA-Z0-9]/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2).toUpperCase();
    }
    return (cleaned[0] || 'S').toUpperCase();
  }

  return 'SI';
}

/**
 * Professional Admin Profile Capsule for the Sinka Admin top navigation header.
 *
 * Replaces the duplicate standalone logout buttons with a unified, polished
 * account dropdown adhering to Sinka's brand styling tokens.
 */
export function AdminProfileCapsule() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard accessibility (Escape to close and return focus)
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  if (!user) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
        Unauthenticated
      </span>
    );
  }

  const initials = getInitials(user.displayName, user.email);
  const displayName = user.displayName || user.email;

  return (
    <div ref={containerRef} className="relative font-sans">
      {/* Interactive Profile Capsule Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="admin-profile-dropdown"
        aria-label="Administrator profile and account menu"
        className={`group flex items-center space-x-2.5 pl-1.5 pr-2.5 py-1 rounded-full border transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 ${
          isOpen
            ? 'bg-stone-100/90 border-stone-300 shadow-xs'
            : 'bg-white border-stone-200/90 hover:border-stone-300 hover:bg-stone-50/80 shadow-2xs'
        }`}
      >
        {/* Monogram Avatar Circle */}
        <div className="w-7 h-7 rounded-full bg-brand-primary text-white flex items-center justify-center text-[11px] font-semibold tracking-wider shrink-0 shadow-2xs group-hover:bg-brand-primary-hover transition-colors">
          {initials}
        </div>

        {/* Identity & Role Text (compact on mobile, expanded on desktop) */}
        <div className="hidden sm:flex flex-col text-left leading-tight min-w-0 pr-0.5">
          <span className="text-xs font-semibold text-stone-900 truncate max-w-48">
            {user.email || displayName}
          </span>
          <span className="text-[10px] text-stone-500 font-medium tracking-wide">
            Administrator
          </span>
        </div>

        {/* Dropdown Chevron */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 group-hover:text-stone-600 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-stone-700' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          id="admin-profile-dropdown"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby={triggerRef.current?.id}
          className="absolute right-0 top-full mt-2 w-68 bg-white rounded-xl border border-stone-200 shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right overflow-hidden"
        >
          {/* Identity Header */}
          <div className="px-4 py-3 bg-stone-50/80 border-b border-stone-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1.5 select-none">
              Account
            </p>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-semibold shrink-0 shadow-xs">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-stone-900 truncate" title={user.email || displayName}>
                  {user.email || displayName}
                </p>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-[11px] text-stone-500 font-medium">
                    Administrator
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="p-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="w-full group flex items-center px-3 py-2 text-xs font-medium text-stone-700 hover:text-red-700 hover:bg-red-50/80 rounded-lg transition-colors duration-150 text-left focus:outline-none focus-visible:bg-red-50 focus-visible:text-red-700"
            >
              <LogOut className="w-4 h-4 mr-2.5 text-stone-400 group-hover:text-red-600 transition-colors shrink-0" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProfileCapsule;

