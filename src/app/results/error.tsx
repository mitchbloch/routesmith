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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Route generation failed</h1>
        <p className="text-gray-500 mb-6">
          {error.message || 'We couldn\'t generate routes. Please try again.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/wizard')}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Edit Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
