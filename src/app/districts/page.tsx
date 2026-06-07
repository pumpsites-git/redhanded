'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  getAllDistricts,
  getNationalAverages,
  sortDistrictsByMetric,
  type District,
  type SortMetric,
  pct,
  months,
  getRecidivismColor,
  getBelowGuidelinesColor,
  getDangerousColor,
} from '@/lib/districts';
import DistrictMap from '@/components/DistrictMap';

const METRIC_OPTIONS: { value: SortMetric; label: string; desc: string }[] = [
  { value: 'recidivism', label: 'Recidivism Rate', desc: 'How often offenders re-offend after release' },
  { value: 'sentence', label: 'Avg Sentence', desc: 'Average sentence length in months' },
  { value: 'belowGuidelines', label: 'Below-Guidelines Rate', desc: 'How often judges sentence below USSC guidelines' },
  { value: 'caseVolume', label: 'Case Volume', desc: 'Total federal criminal cases filed' },
  { value: 'dangerous', label: 'High-Risk Offenders', desc: 'Proportion of offenders with high criminal history (Cat IV-VI)' },
];

type SortCol = SortMetric | 'name' | 'state' | 'circuit';
type SortDir = 'asc' | 'desc';

export default function DistrictsPage() {
  const allDistricts = useMemo(() => getAllDistricts().filter(d => d.totalCases > 0), []);
  const nationalAvg = useMemo(() => getNationalAverages(), []);

  const [colorMetric, setColorMetric] = useState<SortMetric>('recidivism');
  const [sortCol, setSortCol] = useState<SortCol>('recidivism');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  const sortedDistricts = useMemo(() => {
    return [...allDistricts].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      switch (sortCol) {
        case 'name': return mul * a.name.localeCompare(b.name);
        case 'state': return mul * a.state.localeCompare(b.state);
        case 'circuit': return mul * (a.circuit - b.circuit);
        case 'recidivism': return mul * (a.recidivismRate - b.recidivismRate);
        case 'sentence': return mul * (a.avgSentenceMonths - b.avgSentenceMonths);
        case 'belowGuidelines': return mul * (a.belowGuidelinesRate - b.belowGuidelinesRate);
        case 'caseVolume': return mul * (a.totalCases - b.totalCases);
        case 'dangerous': return mul * (a.highCriminalHistoryRate - b.highCriminalHistoryRate);
        default: return 0;
      }
    });
  }, [allDistricts, sortCol, sortDir]);

  function handleSort(col: SortCol) {
    if (col === sortCol) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  }

  const metricObj = METRIC_OPTIONS.find(m => m.value === colorMetric)!;

  // Map data for DistrictMap
  const mapData = useMemo(() => {
    return allDistricts.map(d => ({
      code: d.code,
      state: d.state,
      name: d.name,
      value: colorMetric === 'recidivism' ? d.recidivismRate
        : colorMetric === 'sentence' ? d.avgSentenceMonths
        : colorMetric === 'belowGuidelines' ? d.belowGuidelinesRate * 100
        : colorMetric === 'caseVolume' ? d.totalCases
        : d.highCriminalHistoryRate * 100,
    }));
  }, [allDistricts, colorMetric]);

  const maxVal = useMemo(() => Math.max(...mapData.map(d => d.value), 1), [mapData]);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Page header */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          padding: '1.5rem 1rem',
        }}
      >
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.25rem',
            }}
          >
            🗺️ Federal District Analysis
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            USSC FY2025 sentencing data across {allDistricts.length} federal districts
          </p>
        </div>
      </header>

      <main style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* National stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <StatCard label="Total Cases" value={nationalAvg.totalCases.toLocaleString()} icon="📋" />
          <StatCard label="Avg Sentence" value={months(nationalAvg.avgSentenceMonths)} icon="⏱️" />
          <StatCard
            label="Below Guidelines"
            value={pct(nationalAvg.belowGuidelinesRate)}
            icon="📉"
            valueColor={getBelowGuidelinesColor(nationalAvg.belowGuidelinesRate)}
          />
          <StatCard
            label="Recidivism Rate"
            value={`${nationalAvg.recidivismRate.toFixed(1)}%`}
            icon="🔄"
            valueColor={getRecidivismColor(nationalAvg.recidivismRate)}
          />
          <StatCard
            label="High-Risk Offenders"
            value={pct(nationalAvg.highCriminalHistoryRate)}
            icon="⚠️"
            valueColor={getDangerousColor(nationalAvg.highCriminalHistoryRate)}
          />
          <StatCard label="Avg Crim History Pts" value={nationalAvg.avgCriminalHistoryPoints.toFixed(1)} icon="📊" />
        </div>

        {/* Map section */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.25rem',
                }}
              >
                District Map
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {metricObj.desc}
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {METRIC_OPTIONS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setColorMetric(m.value)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: colorMetric === m.value ? 600 : 400,
                    background: colorMetric === m.value ? 'var(--red-primary)' : 'var(--bg-secondary)',
                    color: colorMetric === m.value ? '#fff' : 'var(--text-secondary)',
                    border: `1px solid ${colorMetric === m.value ? 'var(--red-primary)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <DistrictMap
            mapData={mapData}
            maxVal={maxVal}
            metric={colorMetric}
            hoveredCode={hoveredCode}
            onHover={setHoveredCode}
          />

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.75rem',
              justifyContent: 'flex-end',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Low</span>
            <div
              style={{
                width: '120px',
                height: '8px',
                borderRadius: '4px',
                background: 'linear-gradient(to right, #16a34a, #ca8a04, #ea580c, #dc2626)',
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>High</span>
          </div>
        </div>

        {/* Rankings table */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              District Rankings
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Click column headers to sort. Click a district name to view details.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <Th label="#" />
                  <Th label="District" col="name" sort={sortCol} dir={sortDir} onSort={handleSort} />
                  <Th label="State" col="state" sort={sortCol} dir={sortDir} onSort={handleSort} />
                  <Th label="Circuit" col="circuit" sort={sortCol} dir={sortDir} onSort={handleSort} />
                  <Th label="Cases" col="caseVolume" sort={sortCol} dir={sortDir} onSort={handleSort} />
                  <Th label="Avg Sent." col="sentence" sort={sortCol} dir={sortDir} onSort={handleSort} />
                  <Th label="Below Guide." col="belowGuidelines" sort={sortCol} dir={sortDir} onSort={handleSort} />
                  <Th label="Recidivism" col="recidivism" sort={sortCol} dir={sortDir} onSort={handleSort} />
                  <Th label="High-Risk" col="dangerous" sort={sortCol} dir={sortDir} onSort={handleSort} />
                </tr>
              </thead>
              <tbody>
                {sortedDistricts.map((d, i) => (
                  <tr
                    key={d.code}
                    onMouseEnter={() => setHoveredCode(d.code)}
                    onMouseLeave={() => setHoveredCode(null)}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: hoveredCode === d.code ? 'var(--bg-card-hover)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <td style={{ padding: '0.6rem 1rem', color: 'var(--text-muted)', width: '3rem' }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', fontWeight: 500 }}>
                      <Link
                        href={`/district/${d.code}`}
                        style={{ color: 'var(--red-primary)', textDecoration: 'none' }}
                      >
                        {d.name}
                      </Link>
                    </td>
                    <td style={{ padding: '0.6rem 1rem', color: 'var(--text-secondary)' }}>{d.state}</td>
                    <td style={{ padding: '0.6rem 1rem', color: 'var(--text-secondary)' }}>{d.circuit}th</td>
                    <td style={{ padding: '0.6rem 1rem', color: 'var(--text-primary)' }}>
                      {d.totalCases.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', color: 'var(--text-primary)' }}>
                      {d.avgSentenceMonths.toFixed(1)} mo
                    </td>
                    <td style={{ padding: '0.6rem 1rem' }}>
                      <span style={{ color: getBelowGuidelinesColor(d.belowGuidelinesRate), fontWeight: 600 }}>
                        {pct(d.belowGuidelinesRate)}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 1rem' }}>
                      <span style={{ color: getRecidivismColor(d.recidivismRate), fontWeight: 600 }}>
                        {d.recidivismRate.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 1rem' }}>
                      <span style={{ color: getDangerousColor(d.highCriminalHistoryRate), fontWeight: 600 }}>
                        {pct(d.highCriminalHistoryRate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer note */}
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '0.75rem',
          }}
        >
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            📋 <strong>Data Source:</strong> U.S. Sentencing Commission, FY2025 Annual Sourcebook. District codes correspond to USSC district identifiers.
            &quot;Below guidelines&quot; includes downward departures and variances. Recidivism defined as re-arrest within 8 years.
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, valueColor,
}: {
  label: string;
  value: string;
  icon: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1rem',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: valueColor ?? 'var(--text-primary)',
          marginBottom: '0.25rem',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

function Th({
  label,
  col,
  sort,
  dir,
  onSort,
}: {
  label: string;
  col?: SortCol;
  sort?: SortCol;
  dir?: SortDir;
  onSort?: (col: SortCol) => void;
}) {
  const isActive = col && col === sort;
  return (
    <th
      onClick={() => col && onSort && onSort(col)}
      style={{
        padding: '0.75rem 1rem',
        textAlign: 'left',
        fontWeight: 600,
        fontSize: '0.78rem',
        color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
        cursor: col ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        background: 'var(--bg-secondary)',
      }}
    >
      {label}
      {isActive && <span style={{ marginLeft: '0.3rem' }}>{dir === 'asc' ? '↑' : '↓'}</span>}
    </th>
  );
}
