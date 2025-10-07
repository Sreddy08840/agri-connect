import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  interactive = false,
  onRatingChange,
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= Math.floor(displayRating);
          const isPartial = starValue === Math.ceil(displayRating) && displayRating % 1 !== 0;
          const partialPercent = isPartial ? (displayRating % 1) * 100 : 0;

          return (
            <div
              key={index}
              className={`relative ${interactive ? 'cursor-pointer' : ''}`}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(0)}
            >
              {isPartial ? (
                <div className="relative">
                  <Star className={`${sizeClasses[size]} text-gray-300`} />
                  <div
                    className="absolute top-0 left-0 overflow-hidden"
                    style={{ width: `${partialPercent}%` }}
                  >
                    <Star className={`${sizeClasses[size]} text-farmer-yellow-500 fill-current`} />
                  </div>
                </div>
              ) : (
                <Star
                  className={`${sizeClasses[size]} ${
                    isFilled
                      ? 'text-farmer-yellow-500 fill-current'
                      : 'text-gray-300'
                  } ${interactive ? 'transition-colors hover:text-farmer-yellow-400' : ''}`}
                />
              )}
            </div>
          );
        })}
      </div>
      {showValue && (
        <span className={`${textSizeClasses[size]} font-medium text-gray-700 ml-1`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
