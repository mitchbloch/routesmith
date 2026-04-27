'use client';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({ rating, onChange, size = 'md' }: StarRatingProps) {
  const sizeClass = { sm: 'text-[16px]', md: 'text-[22px]', lg: 'text-[28px]' }[size];

  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= rating;
        return (
          <button
            key={star}
            onClick={() => onChange?.(star)}
            disabled={!onChange}
            className={`${sizeClass} leading-none transition-all ${
              onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            } ${filled ? 'text-vermillion' : 'text-hairline'}`}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
          >
            {filled ? '★' : '☆'}
          </button>
        );
      })}
    </div>
  );
}
