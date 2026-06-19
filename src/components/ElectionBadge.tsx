'use client';

import { useEffect, useState } from 'react';

export interface ElectionEntry {
  name: string;
  slug?: string;
  county?: string;
  circuit?: string;
  electionYear?: number;
  electionMonth?: string;
  seat?: string;
  type?: 'retention' | 'contested' | 'nonpartisan';
}

// Lazy-load election data client-side so missing file doesn't break SSR
let electionCache: ElectionEntry[] | null = null;
let electionCacheLoaded = false;

async function loadElectionData(): Promise<ElectionEntry[]> {
  if (electionCacheLoaded) return electionCache ?? [];
  try {
    const res = await fetch('/api/elections', { cache: 'force-cache' });
    if (!res.ok) throw new Error('no data');
    const data = await res.json();
    electionCache = Array.isArray(data) ? data : (data.judges ?? []);
  } catch {
    electionCache = [];
  }
  electionCacheLoaded = true;
  return electionCache ?? [];
}

/** Large badge for judge profile pages */
export function ElectionBadgeLarge({ slug, name }: { slug?: string; name?: string }) {
  const [isUpForVote, setIsUpForVote] = useState<boolean | null>(null);
  const [entry, setEntry] = useState<ElectionEntry | null>(null);

  useEffect(() => {
    loadElectionData().then((entries) => {
      const match = entries.find(
        (e) =>
          (slug && e.slug === slug) ||
          (name && e.name?.toLowerCase() === name?.toLowerCase())
      );
      setIsUpForVote(!!match);
      setEntry(match ?? null);
    });
  }, [slug, name]);

  if (isUpForVote === null) return null;
  if (!isUpForVote) return null;

  const year = entry?.electionYear ?? 2026;
  const month = entry?.electionMonth ?? 'November';

  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3 my-4"
      style={{
        background: 'rgba(234,88,12,0.08)',
        borderColor: 'rgba(234,88,12,0.5)',
      }}
    >
      <span className="text-2xl" role="img" aria-label="warning">⚠️</span>
      <div>
        <div
          className="text-sm font-extrabold uppercase tracking-wider"
          style={{ color: '#f97316' }}
        >
          UP FOR VOTE — {month} {year}
        </div>
        <div className="text-xs text-[var(--text-secondary)] mt-0.5">
          {entry?.type === 'retention'
            ? 'This judge faces a retention vote. Your YES or NO decides if they keep their seat.'
            : entry?.type === 'contested'
            ? 'This judge faces a contested election.'
            : 'This judge is on the ballot this election cycle.'}
          {entry?.circuit && (
            <span className="text-[var(--text-muted)]"> · {entry.circuit}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Small icon badge for list/table rows */
export function ElectionBadgeSmall({ slug, name }: { slug?: string; name?: string }) {
  const [isUpForVote, setIsUpForVote] = useState<boolean>(false);

  useEffect(() => {
    loadElectionData().then((entries) => {
      const match = entries.find(
        (e) =>
          (slug && e.slug === slug) ||
          (name && e.name?.toLowerCase() === name?.toLowerCase())
      );
      setIsUpForVote(!!match);
    });
  }, [slug, name]);

  if (!isUpForVote) return null;

  return (
    <span
      title="Up for vote — November 2026"
      className="inline-flex items-center rounded text-[0.6rem] font-bold uppercase tracking-wide px-1.5 py-0.5 ml-1"
      style={{
        background: 'rgba(234,88,12,0.15)',
        border: '1px solid rgba(234,88,12,0.4)',
        color: '#f97316',
      }}
    >
      🗳 VOTE
    </span>
  );
}

/** Server-side version: reads from JSON file at build time via API */
export function ElectionBadgeServer({
  entries,
  slug,
  name,
  size = 'large',
}: {
  entries: ElectionEntry[];
  slug?: string;
  name?: string;
  size?: 'large' | 'small';
}) {
  const entry = entries.find(
    (e) =>
      (slug && e.slug === slug) ||
      (name && e.name?.toLowerCase() === name?.toLowerCase())
  );

  if (!entry) return null;

  const year = entry.electionYear ?? 2026;
  const month = entry.electionMonth ?? 'November';

  if (size === 'small') {
    return (
      <span
        className="inline-flex items-center rounded text-[0.6rem] font-bold uppercase tracking-wide px-1.5 py-0.5 ml-1"
        style={{
          background: 'rgba(234,88,12,0.15)',
          border: '1px solid rgba(234,88,12,0.4)',
          color: '#f97316',
        }}
      >
        🗳 VOTE
      </span>
    );
  }

  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3 my-4"
      style={{
        background: 'rgba(234,88,12,0.08)',
        borderColor: 'rgba(234,88,12,0.5)',
      }}
    >
      <span className="text-2xl" role="img" aria-label="warning">⚠️</span>
      <div>
        <div
          className="text-sm font-extrabold uppercase tracking-wider"
          style={{ color: '#f97316' }}
        >
          UP FOR VOTE — {month} {year}
        </div>
        <div className="text-xs text-[var(--text-secondary)] mt-0.5">
          {entry.type === 'retention'
            ? 'This judge faces a retention vote. Your YES or NO decides if they keep their seat.'
            : entry.type === 'contested'
            ? 'This judge faces a contested election.'
            : 'This judge is on the ballot this election cycle.'}
          {entry.circuit && (
            <span className="text-[var(--text-muted)]"> · {entry.circuit}</span>
          )}
        </div>
      </div>
    </div>
  );
}
