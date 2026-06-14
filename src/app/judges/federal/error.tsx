'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center">
      <h2 className="text-xl font-bold text-red-500 mb-2">Failed to load federal judges</h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">{error.message}</p>
      <button
        onClick={reset}
        className="px-6 py-2 bg-[var(--red-primary)] text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
