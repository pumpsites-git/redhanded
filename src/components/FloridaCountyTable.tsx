'use client';

import { useState, useMemo } from 'react';
import type { FLCounty } from '@/lib/state-deep-dive';

type SortKey = 'leniencyScore' | 'prisonRate' | 'totalCases' | 'avgFelonySentenceDays';
type SortDir = 'asc' | 'desc';

function leniencyColor(score: number): string {
  // Green (strict, low score) → Yellow → Red (lenient, high score)
  const hue = 120 - (score / 100) * 120;
  return `hsl(${hue}, 70%, 42%)`;
}

function pct(n: number, d = 1): string {
  return `${(n * 100).toFixed(d)}%`;
}

function fmt(n: number): string {
  return n.toLocaleString();
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
    if (col !== sortKey) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
    return <span style={{ color: '#dc2626', marginLeft: '4px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  const thStyle: React.CSSProperties = {
    padding: '0.625rem 0.75rem',
    textAlign: 'left',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  };

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: '0.75rem' }}>
        <input
          type="text"
          placeholder="Filter counties…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem 0.875rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '0.375rem',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ overflowX: 'auto', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr>
              <th style={thStyle}>County</th>
              <th style={thStyle} onClick={() => handleSort('leniencyScore')}>
                Leniency <SortIcon col="leniencyScore" />
              </th>
              <th style={thStyle} onClick={() => handleSort('prisonRate')}>
                Prison Rate <SortIcon col="prisonRate" />
              </th>
              <th style={{ ...thStyle, display: 'none' } as React.CSSProperties} className="hide-sm">
                Jail Rate
              </th>
              <th style={thStyle} onClick={() => handleSort('totalCases')}>
                Total Cases <SortIcon col="totalCases" />
              </th>
              <th style={thStyle} onClick={() => handleSort('avgFelonySentenceDays')}>
                Avg Felony Sentence <SortIcon col="avgFelonySentenceDays" />
              </th>
              <th style={thStyle}>Violent Case Rate</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => {
              const isPalmBeach = false;
              const bg = isPalmBeach
                ? 'rgba(59,130,246,0.07)'
                : i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)';
              const color = leniencyColor(c.leniencyScore);

              return (
                <tr
                  key={c.slug}
                  style={{
                    background: bg,
                    borderLeft: '3px solid transparent',
                    transition: 'background 0.1s',
                  }}
                >
                  <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {c.name}
                    
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '48px', height: '7px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ width: `${c.leniencyScore}%`, height: '100%', background: color, borderRadius: '3px' }} />
                      </div>
                      <span style={{ color, fontWeight: 700, fontSize: '0.82rem', minWidth: '2.5rem' }}>{c.leniencyScore.toFixed(1)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: c.prisonRate > 0.2 ? '#22c55e' : c.prisonRate < 0.1 ? '#dc2626' : 'var(--text-primary)', fontWeight: 600 }}>
                    {pct(c.prisonRate)}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>
                    {fmt(c.totalCases)}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>
                    {c.avgFelonySentenceDays ? `${Math.round(c.avgFelonySentenceDays).toLocaleString()} days` : '—'}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>
                    {pct(c.violentCases.rate)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        {sorted.length} of {counties.length} counties shown · Click column headers to sort
      </p>
    </div>
  );
}
