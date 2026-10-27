import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand-primary text-white hover:bg-brand-primary-hover focus-visible:ring-brand-primary',
  secondary: 'bg-brand-secondary text-white hover:bg-brand-secondary-hover focus-visible:ring-brand-secondary',
  outline: 'border border-stone-300 text-stone-700 hover:bg-stone-100 focus-visible:ring-brand-primary',
  ghost: 'text-stone-700 hover:text-brand-primary hover:bg-stone-100 focus-visible:ring-brand-primary',
  subtle: 'bg-stone-100 text-stone-800 hover:bg-stone-200 focus-visible:ring-stone-400',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

/**
 * Reusable polymorphic Button component adhering to Sinka brand tokens.
 * Automatically renders as a React Router <Link> when `to` is passed,
 * an <a> when `href` is passed, or standard <button>.
 */
export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    className = '',
    type = 'button',
    as,
    to,
    href,
    icon,
    rightIcon,
    ...props
  },
  ref
) {
  let Component = 'button';
  if (to || as === 'link' || as === Link) {
    Component = Link;
  } else if (href || as === 'a') {
    Component = 'a';
  } else if (as) {
    Component = as;
  }
  const isButton = Component === 'button';

  const variantClass = VARIANTS[variant] || VARIANTS.primary;
  const sizeClass = SIZES[size] || SIZES.md;
  const trailingIcon = rightIcon || icon;

  return (
    <Component
      ref={ref}
      to={to}
      href={href}
      type={isButton ? type : undefined}
      disabled={isButton ? (disabled || isLoading) : undefined}
      className={`inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
      {children}
      {trailingIcon && <span className="ml-2 inline-flex items-center">{trailingIcon}</span>}
    </Component>
  );
});

export default Button;
