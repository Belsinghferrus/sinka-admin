import { REVIEW_STATUS_CONFIG } from '../../constants.js';

/**
 * Accessible Status Badge for Customer Review moderation lifecycle.
 * Pending -> warning (amber)
 * Approved -> success (emerald)
 * Rejected -> error (rose/red)
 *
 * @param {object} props
 * @param {string} props.status - 'PENDING' | 'APPROVED' | 'REJECTED'
 * @param {'sm'|'md'|'lg'} [props.size='sm']
 * @param {string} [props.className='']
 */
export function ReviewStatusBadge({ status, size = 'sm', className = '' }) {
  const normalizedKey = (status || 'PENDING').toUpperCase();
  const config = REVIEW_STATUS_CONFIG[normalizedKey] || {
    label: status || 'Pending',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
    description: 'Awaiting moderation review.',
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
      title={config.description}
    >
      <span className={`rounded-full shrink-0 ${config.dotClass} ${dotSizes[size] || dotSizes.sm}`} />
      <span>{config.label}</span>
    </span>
  );
}

export default ReviewStatusBadge;
