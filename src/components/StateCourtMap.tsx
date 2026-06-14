'use client';

import { useState } from 'react';
import statePaths from '@/data/us-state-paths.json';

interface StateCoverage {
  code: string;
  judgeCount: number;
  avgLeniency: number | null;
  dataType?: 'judge' | 'county';
  countyCount?: number;
}

interface StateCourtMapProps {
  coveredStates: StateCoverage[];
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
  const hoveredIsCounty = hoveredData?.dataType === 'county';

  return (
    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] px-5 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">🗺️ State Court Coverage</h2>
        <div className="text-sm text-[var(--text-muted)]">
          {hoveredState ? (
            isCovered ? (
              hoveredIsCounty ? (
                <span>
                  <span className="font-bold text-[var(--text-primary)]">{STATE_NAMES[hoveredState] || hoveredState}</span>
                  {' — '}
                  <span className="font-bold text-orange-500">{hoveredData!.countyCount ?? 67} counties</span>
                  <span className="text-[var(--text-secondary)] ml-2">county-level data</span>
                </span>
              ) : (
                <span>
                  <span className="font-bold text-[var(--text-primary)]">{STATE_NAMES[hoveredState] || hoveredState}</span>
                  {' — '}
                  <span className="font-bold text-red-600">{hoveredData!.judgeCount} judges</span>
                  {hoveredData!.avgLeniency !== null && (
                    <span className="text-[var(--text-secondary)] ml-2">avg leniency {hoveredData!.avgLeniency}</span>
                  )}
                </span>
              )
            ) : (
              <span>
                <span className="font-bold text-[var(--text-primary)]">{STATE_NAMES[hoveredState] || hoveredState}</span>
                {' — '}
                <span className="italic text-[var(--text-muted)]">Coming Soon</span>
              </span>
            )
          ) : (
            <span className="hidden md:inline">Hover a state to preview · Click to filter</span>
          )}
        </div>
      </div>

      <svg
        viewBox="0 0 960 600"
        className="w-full h-auto block"
        xmlns="http://www.w3.org/2000/svg"
      >
        {Object.entries(paths).map(([code, d]) => {
          const covered = coveredMap.has(code);
          const isHovered = hoveredState === code;
          const isCounty = coveredMap.get(code)?.dataType === 'county';

          let fill: string;
          if (isHovered && covered && isCounty) fill = '#fb923c';
          else if (covered && isCounty) fill = '#f97316';
          else if (isHovered && covered) fill = '#ef4444';
          else if (covered) fill = '#dc2626';
          else if (isHovered) fill = '#3a3a3a';
          else fill = '#1f1f1f';

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
                {covered ? `: ${coveredMap.get(code)!.judgeCount} judges — click to filter` : ': Coming Soon'}
              </title>
            </path>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-600" />
          <span className="text-xs text-[var(--text-muted)]">Judge-Level Data</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-orange-500" />
          <span className="text-xs text-[var(--text-muted)]">County Data Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#1f1f1f] border border-[#3a3a3a]" />
          <span className="text-xs text-[var(--text-muted)]">Coming Soon</span>
        </div>
      </div>

      <p className="text-center text-[0.7rem] text-[var(--text-muted)] mt-2">
        IL/NY: judge-level data · FL: 67-county sentencing data · More states being added
      </p>
    </div>
  );
}
