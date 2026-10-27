import { Loader2 } from 'lucide-react';

/**
 * Reusable LoadingIndicator for views, cards, and async actions.
 */
export function LoadingIndicator({
  message = 'Loading Sinka Admin...',
  size = 'md',
  fullPage = false,
  className = '',
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const spinner = (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-4 text-center ${className}`}
    >
      <Loader2
        className={`${sizeClasses[size] || sizeClasses.md} text-brand-primary animate-spin mb-2`}
        aria-hidden="true"
      />
      {message && <p className="text-sm font-medium text-stone-600">{message}</p>}
      <span className="sr-only">Loading content</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export default LoadingIndicator;
