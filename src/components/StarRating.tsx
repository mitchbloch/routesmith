'use client';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({ rating, onChange, size = 'md' }: StarRatingProps) {
  const sizeClass = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }[size];

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange?.(star)}
          disabled={!onChange}
          className={`${sizeClass} transition-colors ${
            onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'
          } ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
