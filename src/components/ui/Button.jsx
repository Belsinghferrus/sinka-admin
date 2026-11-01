import { forwardRef, isValidElement } from 'react';
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
 * Safely render an icon whether it was passed as:
 * - A React component function/forwardRef (e.g. `icon={Save}` or `icon={Plus}`)
 * - A pre-rendered JSX element (e.g. `icon={<Save className="..." />}`)
 */
const renderIcon = (iconItem, defaultMarginClass = 'mr-2') => {
  if (!iconItem) return null;
  if (isValidElement(iconItem)) {
    return iconItem;
  }
  const IconComponent = iconItem;
  return <IconComponent className={`w-4 h-4 ${defaultMarginClass} shrink-0`} aria-hidden="true" />;
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
    loading = false,
    fullWidth = false,
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
  const widthClass = fullWidth ? 'w-full' : '';
  const showLoading = Boolean(isLoading || loading);
  const isDisabled = disabled || showLoading;

  return (
    <Component
      ref={ref}
      to={to}
      href={href}
      type={isButton ? type : undefined}
      disabled={isButton ? isDisabled : undefined}
      aria-disabled={!isButton && isDisabled ? true : undefined}
      className={`inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim()}
      {...props}
    >
      {showLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" aria-hidden="true" />}
      {!showLoading && icon && renderIcon(icon, 'mr-2')}
      {children}
      {rightIcon && renderIcon(rightIcon, 'ml-2')}
    </Component>
  );
});

export default Button;
