import { Star } from 'lucide-react';

/**
 * Consistent Accessible Star Rating Display for Sinka Reviews.
 *
 * @param {object} props
 * @param {number} props.rating - Numerical rating between 1 and 5
 * @param {number} [props.maxRating=5]
 * @param {'sm'|'md'|'lg'} [props.size='sm']
 * @param {boolean} [props.showScore=true]
 * @param {string} [props.className='']
 */
export function StarRating({
  rating = 5,
  maxRating = 5,
  size = 'sm',
  showScore = true,
  className = '',
}) {
  const numericRating = Math.max(0, Math.min(maxRating, Number(rating) || 0));

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base font-semibold',
  };

  const starSize = sizeClasses[size] || sizeClasses.sm;
  const textSize = textSizes[size] || textSizes.sm;

  return (
    <div
      className={`inline-flex items-center space-x-1.5 ${className}`}
      aria-label={`${numericRating} out of ${maxRating} stars`}
      title={`${numericRating} out of ${maxRating} stars`}
    >
      <div className="flex items-center space-x-0.5">
        {Array.from({ length: maxRating }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= Math.round(numericRating);

          return (
            <Star
              key={index}
              className={`${starSize} transition-colors ${
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-stone-100 text-stone-300'
              }`}
              aria-hidden="true"
            />
          );
        })}
      </div>
      {showScore && (
        <span className={`font-semibold text-stone-800 ${textSize}`}>
          {numericRating}
        </span>
      )}
    </div>
  );
}

export default StarRating;
