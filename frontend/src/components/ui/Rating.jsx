import { useState } from 'react';
import { cn } from '../../lib/utils';

const StarIcon = ({ filled, onHover, onClick, disabled, interactive }) => (
  <svg
    className={cn(
      "w-4 h-4 transition-colors",
      filled ? "text-yellow-400 fill-current" : "text-gray-300",
      interactive ? "cursor-pointer hover:text-yellow-400 hover:fill-current" : "cursor-default",
      disabled && "cursor-not-allowed opacity-60"
    )}
    onMouseEnter={interactive ? onHover : undefined}
    onClick={interactive ? onClick : undefined}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  </svg>
);

const Rating = ({ 
  value = 0, 
  onChange, 
  maxRating = 5, 
  size = 'md', 
  disabled = false, 
  readOnly = false,
  showValue = false,
  className 
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };

  const isInteractive = !disabled && !readOnly && onChange;

  const handleClick = (rating) => {
    if (isInteractive) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating) => {
    if (isInteractive) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (isInteractive) {
      setHoverValue(0);
    }
  };

  const displayValue = hoverValue || value;

  return (
    <div 
      className={cn("flex items-center gap-1", className)}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-0.5">
        {[...Array(maxRating)].map((_, index) => {
          const rating = index + 1;
          return (
            <div key={index} className={sizes[size]}>
              <StarIcon
                filled={rating <= displayValue}
                onHover={() => handleMouseEnter(rating)}
                onClick={() => handleClick(rating)}
                disabled={disabled}
                interactive={isInteractive}
              />
            </div>
          );
        })}
      </div>
      {showValue && (
        <span className={cn(
          "ml-2 text-sm font-medium text-gray-600",
          disabled && "opacity-60"
        )}>
          {value > 0 ? `${value}/${maxRating}` : 'Not rated'}
        </span>
      )}
    </div>
  );
};

export default Rating;
