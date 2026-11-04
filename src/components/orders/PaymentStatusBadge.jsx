import { PAYMENT_STATUS_CONFIG } from '../../constants.js';

/**
 * Status badge for Order payment status.
 *
 * @param {object} props
 * @param {string} props.status - Payment status string ('PAID', 'PENDING', 'FAILED', 'REFUND_PENDING', 'REFUNDED')
 * @param {'sm'|'md'|'lg'} [props.size='sm']
 * @param {string} [props.className='']
 */
export function PaymentStatusBadge({ status, size = 'sm', className = '' }) {
  const config = PAYMENT_STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
    dotClass: 'bg-stone-400',
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5 mr-1.5',
    md: 'w-2 h-2 mr-2',
    lg: 'w-2.5 h-2.5 mr-2',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.badgeClass} ${
        sizeClasses[size] || sizeClasses.sm
      } ${className}`}
    >
      <span className={`rounded-full shrink-0 ${config.dotClass} ${dotSizes[size] || dotSizes.sm}`} />
      <span>{config.label}</span>
    </span>
  );
}

export default PaymentStatusBadge;

