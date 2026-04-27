'use client';

import Link from 'next/link';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-paper">
      <div className="field-card max-w-md w-full px-7 py-7 text-center relative">
        <span className="absolute -top-px -left-px w-3 h-3 border-l border-t border-ink" aria-hidden />
        <span className="absolute -top-px -right-px w-3 h-3 border-r border-t border-ink" aria-hidden />
        <span className="absolute -bottom-px -left-px w-3 h-3 border-l border-b border-ink" aria-hidden />
        <span className="absolute -bottom-px -right-px w-3 h-3 border-r border-b border-ink" aria-hidden />

        <p className="label-mono-sm !text-vermillion mb-2">— Survey suspended</p>
        <h1
          className="font-display text-[28px] font-semibold text-ink leading-tight mb-2"
          style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 48' }}
        >
          Something went wrong.
        </h1>
        <p className="text-[13px] text-ink-faded mb-5 font-mono">
          {error.message || 'An unexpected error has interrupted the survey.'}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="bg-vermillion text-paper px-5 py-2 label-mono-sm !text-paper hover:bg-vermillion-deep transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border border-hairline px-5 py-2 label-mono-sm hover:border-ink hover:text-ink transition-colors"
          >
            Back to start
          </Link>
        </div>
      </div>
    </div>
  );
}
