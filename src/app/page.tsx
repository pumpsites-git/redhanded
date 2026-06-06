'use client';

import { useState, useMemo } from 'react';
import { allJudges, getStates } from '@/lib/judges';
import JudgeCard from '@/components/JudgeCard';
import SearchBar from '@/components/SearchBar';
import StatsOverview from '@/components/StatsOverview';

const JUDGES_PER_PAGE = 20;

export default function Home() {
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [sortBy, setSortBy] = useState<'years' | 'name' | 'state'>('years');
  const [page, setPage] = useState(0);

  const states = useMemo(() => getStates(), []);

  const overview = useMemo(() => {
    const dem = allJudges.filter(j => j.party === 'Democratic').length;
    const rep = allJudges.filter(j => j.party === 'Republican').length;
    return {
      totalJudges: allJudges.length,
      totalStates: new Set(allJudges.map(j => j.state)).size,
      totalCourts: new Set(allJudges.map(j => j.court)).size,
      partyBreakdown: { dem, rep, other: allJudges.length - dem - rep },
    };
  }, []);

  const filtered = useMemo(() => {
    let judges = [...allJudges];

    if (query) {
      const q = query.toLowerCase();
      judges = judges.filter(j =>
        j.name.toLowerCase().includes(q) ||
        j.court.toLowerCase().includes(q) ||
        j.courtFull.toLowerCase().includes(q) ||
        j.state.toLowerCase().includes(q) ||
        (j.education && j.education.toLowerCase().includes(q)) ||
        (j.party && j.party.toLowerCase().includes(q))
      );
    }

    if (stateFilter) judges = judges.filter(j => j.state === stateFilter);
    if (partyFilter) judges = judges.filter(j => j.party === partyFilter);

    switch (sortBy) {
      case 'name': judges.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'state': judges.sort((a, b) => a.state.localeCompare(b.state) || a.name.localeCompare(b.name)); break;
      case 'years': default: judges.sort((a, b) => b.yearsServing - a.yearsServing); break;
    }

    return judges;
  }, [query, stateFilter, partyFilter, sortBy]);

  const paginated = filtered.slice(page * JUDGES_PER_PAGE, (page + 1) * JUDGES_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / JUDGES_PER_PAGE);

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

        {/* Data notice */}
        <div className="bg-amber-900/10 border border-amber-800/30 rounded-lg p-4">
          <p className="text-sm text-amber-400">
            📊 <strong>Live Data:</strong> {allJudges.length} federal judges loaded from CourtListener.
            Accountability scores are pending — case outcome data (reversal rates, sentencing patterns)
            is being collected from PACER and the US Sentencing Commission.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-muted)]">
            {filtered.length} judge{filtered.length !== 1 ? 's' : ''} found
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
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {paginated.map((judge) => (
            <JudgeCard key={judge.id} judge={judge} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-[var(--text-secondary)]">No judges match your search criteria</p>
          </div>
        )}

        {/* Pagination */}
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
              Federal judge data updated from CourtListener API. Accountability scores pending case outcome data collection.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
