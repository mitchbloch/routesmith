'use client';

import Link from 'next/link';

export default function RouteDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="px-5 sm:px-7 py-10 text-center">
      <p className="text-[12px] text-vermillion font-medium mb-2">Something went wrong</p>
      <p className="text-[18px] font-semibold text-ink mb-2 leading-tight">
        We couldn&apos;t load this route.
      </p>
      <p className="text-[13px] text-ink-faded mb-5">
        {error.message || 'This route could not be loaded.'}
      </p>
      <div className="flex gap-2 justify-center">
        <button
          onClick={reset}
          className="bg-vermillion text-white px-5 py-2 text-[13px] font-medium hover:bg-vermillion-deep transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border border-hairline px-5 py-2 text-[13px] font-medium text-ink-faded hover:border-ink hover:text-ink transition-colors"
        >
          Back to start
        </Link>
      </div>
    </div>
  );
}
