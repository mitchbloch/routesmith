'use client';

import { useRouter } from 'next/navigation';

export default function ResultsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="p-4 pb-20">
      <div className="field-card px-5 py-6 text-center mt-4">
        <p className="text-[12px] text-vermillion font-medium mb-2">Something went wrong</p>
        <p className="text-[16px] font-semibold text-ink mb-2 leading-tight">
          We couldn&apos;t plot your routes.
        </p>
        <p className="text-[13px] text-ink-faded mb-5">
          {error.message || 'An unexpected error stopped the generation.'}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="bg-vermillion text-white px-5 py-2 text-[13px] font-medium hover:bg-vermillion-deep transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => router.push('/wizard')}
            className="border border-hairline px-5 py-2 text-[13px] font-medium text-ink-faded hover:border-ink hover:text-ink transition-colors"
          >
            Adjust preferences
          </button>
        </div>
      </div>
    </div>
  );
}
