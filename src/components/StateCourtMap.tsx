'use client';

import { useState } from 'react';
import statePaths from '@/data/us-state-paths.json';

interface StateCoverage {
  code: string;
  judgeCount: number;
  avgLeniency: number | null;
}

interface StateCourtMapProps {
  /** States that have data (will be highlighted red) */
  coveredStates: StateCoverage[];
  /** Optional callback when a covered state is clicked */
  onStateClick?: (code: string) => void;
}

const STATE_NAMES: Record<string, string> = {
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

export default function StateCourtMap({ coveredStates, onStateClick }: StateCourtMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const coveredMap = new Map(coveredStates.map(s => [s.code, s]));
  const paths = statePaths as Record<string, string>;

  const hoveredData = hoveredState ? coveredMap.get(hoveredState) : null;
  const isCovered = hoveredState ? coveredMap.has(hoveredState) : false;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: '0.875rem',
        border: '1px solid var(--border)',
        padding: '1.25rem 1.5rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          🗺️ State Court Coverage
        </h2>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {hoveredState ? (
            isCovered ? (
              <span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {STATE_NAMES[hoveredState] || hoveredState}
                </span>
                {' — '}
                <span style={{ color: '#dc2626', fontWeight: 700 }}>
                  {hoveredData!.judgeCount} judges
                </span>
                {hoveredData!.avgLeniency !== null && (
                  <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                    avg leniency {hoveredData!.avgLeniency}
                  </span>
                )}
              </span>
            ) : (
              <span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {STATE_NAMES[hoveredState] || hoveredState}
                </span>
                {' — '}
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Coming Soon</span>
              </span>
            )
          ) : (
            <span className="hidden md:inline">Hover a state to preview · Click to filter</span>
          )}
        </div>
      </div>

      <svg
        viewBox="0 0 960 600"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {Object.entries(paths).map(([code, d]) => {
          const covered = coveredMap.has(code);
          const isHovered = hoveredState === code;

          let fill: string;
          if (isHovered && covered) {
            fill = '#ef4444'; // brighter red on hover
          } else if (covered) {
            fill = '#dc2626'; // red — has data
          } else if (isHovered) {
            fill = '#3a3a3a'; // lighter dark on hover
          } else {
            fill = '#1f1f1f'; // dark grey — no data
          }

          return (
            <path
              key={code}
              d={d}
              fill={fill}
              stroke={isHovered ? '#ffffff' : '#3a3a3a'}
              strokeWidth={isHovered ? 1.5 : 0.75}
              strokeLinejoin="round"
              style={{ cursor: covered ? 'pointer' : 'default', transition: 'fill 0.1s ease' }}
              onMouseEnter={() => setHoveredState(code)}
              onMouseLeave={() => setHoveredState(null)}
              onClick={() => covered && onStateClick?.(code)}
            >
              <title>
                {STATE_NAMES[code] || code}
                {covered
                  ? `: ${coveredMap.get(code)!.judgeCount} judges — click to filter`
                  : ': Coming Soon'}
              </title>
            </path>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#dc2626' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Data Available</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#1f1f1f', border: '1px solid #3a3a3a' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Coming Soon</span>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        Currently covering Cook County, Illinois · More states being added
      </p>
    </div>
  );
}
