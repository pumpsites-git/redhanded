'use client';

import { useState, useMemo } from 'react';
import type { FLCounty } from '@/lib/state-deep-dive';

type SortKey = 'leniencyScore' | 'prisonRate' | 'totalCases' | 'avgFelonySentenceDays';
type SortDir = 'asc' | 'desc';

function leniencyColor(score: number): string {
  const hue = 120 - (score / 100) * 120;
  return `hsl(${hue}, 70%, 42%)`;
}

function pct(n: number, d = 1): string {
  return `${(n * 100).toFixed(d)}%`;
}

interface Props {
  counties: FLCounty[];
}

export default function FloridaCountyTable({ counties }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('leniencyScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');

  const sorted = useMemo(() => {
    let list = [...counties];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const av = sortKey === 'avgFelonySentenceDays' ? (a[sortKey] ?? 0) : a[sortKey];
      const bv = sortKey === 'avgFelonySentenceDays' ? (b[sortKey] ?? 0) : b[sortKey];
      const diff = (av as number) - (bv as number);
      return sortDir === 'asc' ? diff : -diff;
    });
    return list;
  }, [counties, sortKey, sortDir, search]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey) return <span className="opacity-30 ml-1">↕</span>;
    return <span className="text-red-600 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  const thBase = "px-3 py-2.5 text-left text-[0.72rem] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)] bg-[var(--bg-secondary)] cursor-pointer whitespace-nowrap select-none hover:text-[var(--text-primary)] transition-colors";

  return (
    <div>
      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Filter counties…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--red-primary)] transition-colors"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={thBase}>County</th>
              <th className={thBase} onClick={() => handleSort('leniencyScore')}>
                Leniency <SortIcon col="leniencyScore" />
              </th>
              <th className={thBase} onClick={() => handleSort('prisonRate')}>
                Prison Rate <SortIcon col="prisonRate" />
              </th>
              <th className={thBase + ' hidden sm:table-cell'}>Jail Rate</th>
              <th className={thBase} onClick={() => handleSort('totalCases')}>
                Total Cases <SortIcon col="totalCases" />
              </th>
              <th className={thBase} onClick={() => handleSort('avgFelonySentenceDays')}>
                Avg Felony Sentence <SortIcon col="avgFelonySentenceDays" />
              </th>
              <th className={thBase}>Violent Rate</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => {
              const bg = i % 2 === 0 ? 'bg-[var(--bg-card)]' : 'bg-[var(--bg-secondary)]';
              const color = leniencyColor(c.leniencyScore);
              const prisonColor = c.prisonRate > 0.2 ? '#22c55e' : c.prisonRate < 0.1 ? '#dc2626' : 'var(--text-primary)';

              return (
                <tr key={c.slug} className={`${bg} border-l-2 border-transparent transition-colors hover:bg-[var(--bg-card-hover)]`}>
                  <td className="px-3 py-2 text-[var(--text-primary)] font-medium">{c.name}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden shrink-0">
                        <div className="h-full rounded-full" style={{ width: `${c.leniencyScore}%`, background: color }} />
                      </div>
                      <span className="font-bold text-xs min-w-[2.5rem]" style={{ color }}>
                        {c.leniencyScore.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-semibold" style={{ color: prisonColor }}>
                    {pct(c.prisonRate)}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-secondary)] hidden sm:table-cell">
                    {pct(c.jailRate)}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">
                    {c.totalCases.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">
                    {c.avgFelonySentenceDays ? `${Math.round(c.avgFelonySentenceDays).toLocaleString()} days` : '—'}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">
                    {pct(c.violentCases.rate)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[0.7rem] text-[var(--text-muted)] mt-2">
        {sorted.length} of {counties.length} counties shown · Click column headers to sort
      </p>
    </div>
  );
}
