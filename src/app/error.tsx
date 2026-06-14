'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="bg-[var(--bg-card)] border border-red-900 rounded-xl p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-full bg-red-950 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Something went wrong</h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">{error.message || 'An unexpected error occurred'}</p>
        <button
          onClick={reset}
          className="px-6 py-2 bg-[var(--red-primary)] hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
