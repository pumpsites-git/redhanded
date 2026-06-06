'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { fetchJudges, fetchStats, fetchStates } from '@/lib/judges';
import { Judge } from '@/lib/types';
import JudgeCard from '@/components/JudgeCard';
import SearchBar from '@/components/SearchBar';
import StatsOverview from '@/components/StatsOverview';

const JUDGES_PER_PAGE = 20;

export default function Home() {
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [sortBy, setSortBy] = useState<'years' | 'name' | 'state' | 'score'>('years');
  const [page, setPage] = useState(0);

  const [judges, setJudges] = useState<Judge[]>([]);
  const [total, setTotal] = useState(0);
  const [states, setStates] = useState<string[]>([]);
  const [overview, setOverview] = useState({
    totalJudges: 0, totalStates: 0, totalCourts: 0,
    partyBreakdown: { dem: 0, rep: 0, other: 0 },
  });
  const [loading, setLoading] = useState(true);

  // Load stats and states on mount
  useEffect(() => {
    fetchStats().then(setOverview);
    fetchStates().then(setStates);
  }, []);

  // Load judges on filter/sort/page change
  const loadJudges = useCallback(async () => {
    setLoading(true);
    const result = await fetchJudges({
      query: query || undefined,
      state: stateFilter || undefined,
      party: partyFilter || undefined,
      sortBy,
      limit: JUDGES_PER_PAGE,
      offset: page * JUDGES_PER_PAGE,
    });
    setJudges(result.judges);
    setTotal(result.total);
    setLoading(false);
  }, [query, stateFilter, partyFilter, sortBy, page]);

  useEffect(() => {
    loadJudges();
  }, [loadJudges]);

  const totalPages = Math.ceil(total / JUDGES_PER_PAGE);

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="text-3xl">🔴</div>
            <h1 className="text-3xl font-bold tracking-tight">
              Red<span className="text-[var(--red-primary)]">Handed</span>
            </h1>
          </div>
          <p className="text-[var(--text-secondary)] text-sm ml-12">
            Judicial Accountability — Track, Score, and Hold Judges Accountable
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <StatsOverview {...overview} />

        <SearchBar
          onSearch={(q) => { setQuery(q); setPage(0); }}
          onFilterState={(s) => { setStateFilter(s); setPage(0); }}
          onFilterParty={(p) => { setPartyFilter(p); setPage(0); }}
          states={states}
        />

        <div className="bg-amber-900/10 border border-amber-800/30 rounded-lg p-4">
          <p className="text-sm text-amber-400">
            📊 <strong>Live Database:</strong> {overview.totalJudges} federal judges loaded from CourtListener via Supabase.
            Accountability scores are being calculated as case data is collected.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-muted)]">
            {total} judge{total !== 1 ? 's' : ''} found
            {totalPages > 1 && ` · Page ${page + 1} of ${totalPages}`}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">Sort:</span>
            <select
              className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--red-primary)] cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <option value="years">Most Experience</option>
              <option value="name">Name A-Z</option>
              <option value="state">State</option>
              <option value="score">Accountability Score</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 animate-pulse">⚖️</div>
            <p className="text-[var(--text-secondary)]">Loading judges...</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {judges.map((judge) => (
              <JudgeCard key={judge.id} judge={judge} />
            ))}
          </div>
        )}

        {!loading && judges.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-[var(--text-secondary)]">No judges match your search criteria</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)] disabled:opacity-30 hover:border-[var(--red-primary)] transition-colors"
            >
              ← Previous
            </button>
            <span className="text-sm text-[var(--text-muted)]">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)] disabled:opacity-30 hover:border-[var(--red-primary)] transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        <footer className="border-t border-[var(--border)] pt-8 pb-12 mt-16">
          <div className="text-center space-y-2">
            <p className="text-sm text-[var(--text-muted)]">
              🔴 RedHanded — All data sourced from public court records via CourtListener
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Federal judge data powered by Supabase. Accountability scores calculated from reversal rates, sentencing patterns, and community input.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
