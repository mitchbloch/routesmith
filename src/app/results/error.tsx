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
    <div className="min-h-screen flex items-center justify-center p-4 bg-paper">
      <div className="field-card max-w-md w-full px-7 py-7 text-center">
        <p className="label-mono-sm !text-vermillion mb-2">— Survey failed</p>
        <h1
          className="font-display text-[26px] font-semibold text-ink leading-tight mb-2"
          style={{ fontVariationSettings: '"SOFT" 100, "opsz" 48' }}
        >
          We couldn&apos;t plot your routes.
        </h1>
        <p className="text-[13px] text-ink-faded mb-5 font-mono">
          {error.message || 'An unexpected error stopped the survey.'}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="bg-vermillion text-paper px-5 py-2 label-mono-sm !text-paper hover:bg-vermillion-deep transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => router.push('/wizard')}
            className="border border-hairline px-5 py-2 label-mono-sm hover:border-ink hover:text-ink transition-colors"
          >
            Adjust survey
          </button>
        </div>
      </div>
    </div>
  );
}
