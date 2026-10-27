import { forwardRef } from 'react';

/**
 * Reusable accessible Input component for Sinka Admin.
 */
export const Input = forwardRef(function Input(
  { label, error, helperText, id, className = '', type = 'text', ...props },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={`w-full px-3.5 py-2.5 rounded-md border text-sm text-stone-900 bg-white placeholder-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-400'
            : 'border-stone-300 focus:border-stone-800 focus:ring-stone-400'
        } ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
      {!error && helperText && <p className="text-xs text-stone-500 mt-1">{helperText}</p>}
    </div>
  );
});

export default Input;
