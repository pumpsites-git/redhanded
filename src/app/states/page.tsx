'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import statePaths from '@/data/us-state-paths.json';
import {
  getAllStates,
  getStateNationalAverages,
  sortStatesByMetric,
  computeStateScore,
  getScoreGrade,
  getStateMetricColor,
  getStateMetricVal,
  STATE_FLAGS,
  pct,
  months,
  type StateStats,
  type StateSortMetric,
} from '@/lib/states';

const METRIC_OPTIONS: { value: StateSortMetric; label: string; desc: string; format: (s: StateStats) => string }[] = [
  {
    value: 'recidivism',
    label: 'Recidivism Rate',
    desc: 'Percentage of offenders who re-offend',
    format: (s) => `${s.recidivismRate.toFixed(1)}%`,
  },
  {
    value: 'sentence',
    label: 'Avg Sentence',
    desc: 'Average sentence length in months',
    format: (s) => months(s.avgSentenceMonths),
  },
  {
    value: 'belowGuidelines',
    label: 'Below Guidelines',
    desc: 'Rate of sentences below USSC guidelines',
    format: (s) => pct(s.belowGuidelinesRate),
  },
  {
    value: 'caseVolume',
    label: 'Case Volume',
    desc: 'Total federal criminal cases',
    format: (s) => s.totalCases.toLocaleString(),
  },
  {
    value: 'dangerous',
    label: 'High-Risk %',
    desc: 'Offenders with high criminal history (Cat IV–VI)',
    format: (s) => pct(s.highCriminalHistoryRate),
  },
];

const ALL_STATE_NAMES: Record<string, string> = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',
  CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',
  FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',
  IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',
  ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',
  MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',
  NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',
  NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',
  PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',
  TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',
  WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
};

export default function StatesPage() {
  const router = useRouter();
  const allStates = useMemo(() => getAllStates(), []);
  const nat = useMemo(() => getStateNationalAverages(), []);
  const [metric, setMetric] = useState<StateSortMetric>('recidivism');
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const sortedStates = useMemo(
    () => sortStatesByMetric(allStates, metric, false),
    [allStates, metric]
  );

  const metricOpt = METRIC_OPTIONS.find(m => m.value === metric)!;

  // Map coloring
  const paths = statePaths as Record<string, string>;
  const stateDataMap = useMemo(() => new Map(allStates.map(s => [s.stateCode, s])), [allStates]);

  const maxVal = useMemo(
    () => Math.max(...allStates.map(s => getStateMetricVal(s, metric)), 1),
    [allStates, metric]
  );

  function getMapColor(code: string): string {
    const s = stateDataMap.get(code);
    if (!s) return '#1f2020';
    const frac = Math.min(getStateMetricVal(s, metric) / maxVal, 1);
    if (frac < 0.2) return '#166534';
    if (frac < 0.4) return '#15803d';
    if (frac < 0.6) return '#a16207';
    if (frac < 0.8) return '#b45309';
    return '#dc2626';
  }

  const hoveredData = hoveredState ? stateDataMap.get(hoveredState) : null;
  const natMetricVal = metric === 'recidivism' ? nat.recidivismRate
    : metric === 'sentence' ? nat.avgSentenceMonths
    : metric === 'belowGuidelines' ? nat.belowGuidelinesRate * 100
    : metric === 'caseVolume' ? nat.totalCases / (nat.stateCount || 1)
    : nat.highCriminalHistoryRate * 100;

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Page header */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', padding: '1.5rem 1rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            🇺🇸 50-State Overview
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            USSC FY2025 federal sentencing data aggregated across {nat.stateCount} jurisdictions · {nat.totalCases.toLocaleString()} total cases
          </p>
        </div>
      </header>

      <main style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* National averages row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <NatCard label="Total Cases" value={nat.totalCases.toLocaleString()} icon="📋" />
          <NatCard label="Avg Sentence" value={months(nat.avgSentenceMonths)} icon="⏱️" />
          <NatCard label="Below Guidelines" value={pct(nat.belowGuidelinesRate)} icon="📉" />
          <NatCard label="Recidivism Rate" value={`${nat.recidivismRate.toFixed(1)}%`} icon="🔄" />
          <NatCard label="High-Risk Offenders" value={pct(nat.highCriminalHistoryRate)} icon="⚠️" />
          <NatCard label="Avg Criminal Hist." value={nat.avgCriminalHistoryPoints.toFixed(1)} icon="📊" />
        </div>

        {/* Map + metric selector */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                State Map
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{metricOpt.desc}</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {METRIC_OPTIONS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMetric(m.value)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: metric === m.value ? 600 : 400,
                    background: metric === m.value ? 'var(--red-primary)' : 'var(--bg-secondary)',
                    color: metric === m.value ? '#fff' : 'var(--text-secondary)',
                    border: `1px solid ${metric === m.value ? 'var(--red-primary)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hovered state tooltip */}
          <div style={{ minHeight: '2rem', marginBottom: '0.5rem' }}>
            {hoveredData ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  {STATE_FLAGS[hoveredData.stateCode] ?? '🗺️'} {hoveredData.stateName}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {metricOpt.label}: <strong style={{ color: getStateMetricColor(hoveredData, metric) }}>
                    {metricOpt.format(hoveredData)}
                  </strong>
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {hoveredData.districtCount} district{hoveredData.districtCount !== 1 ? 's' : ''} · {hoveredData.totalCases.toLocaleString()} cases
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click to view details →</span>
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hover a state to preview · click to view details</p>
            )}
          </div>

          {/* SVG Map */}
          <svg
            viewBox="0 0 960 600"
            style={{ width: '100%', height: 'auto' }}
            xmlns="http://www.w3.org/2000/svg"
          >
            {Object.entries(paths).map(([code, d]) => {
              const isHovered = hoveredState === code;
              const fill = isHovered ? '#ef4444' : getMapColor(code);
              const stData = stateDataMap.get(code);

              return (
                <path
                  key={code}
                  d={d as string}
                  fill={fill}
                  stroke={isHovered ? '#ffffff' : '#333'}
                  strokeWidth={isHovered ? 2 : 0.75}
                  strokeLinejoin="round"
                  style={{ cursor: 'pointer', transition: 'fill 0.15s' }}
                  onMouseEnter={() => setHoveredState(code)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => router.push(`/state/${code}`)}
                >
                  <title>
                    {ALL_STATE_NAMES[code] ?? code}
                    {stData ? `: ${metricOpt.format(stData)}` : ': No data'}
                  </title>
                </path>
              );
            })}
          </svg>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Low</span>
            <div style={{ width: '120px', height: '8px', borderRadius: '4px', background: 'linear-gradient(to right, #166534, #a16207, #dc2626)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>High</span>
          </div>
        </div>

        {/* State cards grid */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            State Rankings
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Sorted by {metricOpt.label} · click any state for full analysis
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {sortedStates.map((state, i) => {
            const score = computeStateScore(state, nat);
            const grade = getScoreGrade(score);
            const metricVal = metricOpt.format(state);
            const metricColor = getStateMetricColor(state, metric);
            const flag = STATE_FLAGS[state.stateCode] ?? '🗺️';

            return (
              <Link
                key={state.stateCode}
                href={`/state/${state.stateCode}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="judge-card"
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Card header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>#{i + 1}</span>
                        <span style={{ fontSize: '1.125rem' }}>{flag}</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {state.stateName}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {state.districtCount} district{state.districtCount !== 1 ? 's' : ''} · {state.totalCases.toLocaleString()} cases
                      </div>
                    </div>
                    {/* Grade badge */}
                    <div style={{
                      width: '2.25rem', height: '2.25rem', borderRadius: '50%',
                      background: grade.color + '22', border: `2px solid ${grade.color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.9rem', color: grade.color,
                      flexShrink: 0,
                    }}>
                      {grade.grade}
                    </div>
                  </div>

                  {/* Selected metric highlight */}
                  <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', borderLeft: `3px solid ${metricColor}` }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{metricOpt.label}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: metricColor }}>{metricVal}</div>
                  </div>

                  {/* Mini stats bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <MiniBar label="Recidivism" value={state.recidivismRate} max={30} suffix="%" color="#ef4444" />
                    <MiniBar label="Below Guide." value={state.belowGuidelinesRate * 100} max={80} suffix="%" color="#f97316" />
                    <MiniBar label="High-Risk %" value={state.highCriminalHistoryRate * 100} max={60} suffix="%" color="#8b5cf6" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Data note */}
        <div style={{ padding: '1rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '0.75rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            📋 <strong>Data Source:</strong> U.S. Sentencing Commission, FY2025 Annual Sourcebook.
            State data is aggregated from individual federal district statistics using weighted averages by case volume.
            Composite grade (A–F) reflects below-guidelines rate, recidivism, and high-risk offender concentration.
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function NatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

function MiniBar({ label, value, max, suffix, color }: { label: string; value: number; max: number; suffix: string; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', width: '68px', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', width: '36px', textAlign: 'right', flexShrink: 0 }}>
        {value.toFixed(1)}{suffix}
      </span>
    </div>
  );
}
