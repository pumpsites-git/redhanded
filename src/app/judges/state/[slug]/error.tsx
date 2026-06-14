'use client';

import Link from 'next/link';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center">
      <h2 className="text-xl font-bold text-red-500 mb-2">Failed to load judge profile</h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">{error.message}</p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="px-6 py-2 bg-[var(--red-primary)] text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
        >
          Try again
        </button>
        <Link href="/" className="px-6 py-2 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] rounded-lg text-sm font-semibold no-underline hover:border-[var(--red-primary)] transition-colors">
          ← All Judges
        </Link>
      </div>
    </div>
  );
}
