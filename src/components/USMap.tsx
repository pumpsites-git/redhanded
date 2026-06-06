'use client';

import { useState } from 'react';
import statePaths from '@/data/us-state-paths.json';

interface StateData {
  code: string;
  name: string;
  judgeCount: number;
  avgScore: number | null;
}

interface USMapProps {
  stateData: StateData[];
  onStateClick: (stateCode: string) => void;
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

function getScoreColor(avgScore: number | null, judgeCount: number): string {
  if (judgeCount === 0 || avgScore === null) return '#1f1f1f'; // no data
  if (avgScore >= 65) return '#166534'; // dark green — good
  if (avgScore >= 55) return '#15803d'; // green — fair-good
  if (avgScore >= 50) return '#a16207'; // amber — fair
  if (avgScore >= 45) return '#b45309'; // orange — concerning
  if (avgScore >= 40) return '#b91c1c'; // red — poor
  return '#dc2626'; // bright red — critical
}

export default function USMap({ stateData, onStateClick }: USMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  
  const dataMap = new Map(stateData.map(s => [s.code, s]));
  const maxCount = Math.max(...stateData.map(s => s.judgeCount), 1);
  
  const hoveredData = hoveredState ? dataMap.get(hoveredState) : null;

  const paths = statePaths as Record<string, string>;

  return (
    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">🗺️ Federal Judges by State</h2>
        {hoveredData ? (
          <div className="text-sm text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">
              {STATE_NAMES[hoveredState!] || hoveredState}
            </span>
            {' — '}
            <span className="text-[var(--red-primary)] font-semibold">
              {hoveredData.judgeCount}
            </span>
            {' judge'}{hoveredData.judgeCount !== 1 ? 's' : ''}
            {hoveredData.avgScore !== null && (
              <span className={`ml-2 font-semibold ${
                hoveredData.avgScore >= 55 ? 'text-green-400' :
                hoveredData.avgScore >= 45 ? 'text-amber-400' : 'text-red-400'
              }`}>
                Avg Score: {hoveredData.avgScore}
              </span>
            )}
          </div>
        ) : (
          <div className="text-sm text-[var(--text-muted)] hidden md:block">
            Hover a state · Click to filter
          </div>
        )}
      </div>

      <svg 
        viewBox="0 0 960 600" 
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        {Object.entries(paths).map(([code, d]) => {
          const data = dataMap.get(code);
          const count = data?.judgeCount || 0;
          const isHovered = hoveredState === code;
          const avgScore = data?.avgScore ?? null;
          const fill = isHovered ? '#ef4444' : getScoreColor(avgScore, count);
          
          return (
            <path
              key={code}
              d={d}
              fill={fill}
              stroke={isHovered ? '#ffffff' : '#444444'}
              strokeWidth={isHovered ? 2 : 0.75}
              strokeLinejoin="round"
              className="cursor-pointer transition-colors duration-150"
              onMouseEnter={() => setHoveredState(code)}
              onMouseLeave={() => setHoveredState(null)}
              onClick={() => onStateClick(code)}
            >
              <title>{STATE_NAMES[code] || code}: {count} judge{count !== 1 ? 's' : ''}</title>
            </path>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#1f1f1f', border: '1px solid #444' }} />
          <span className="text-xs text-[var(--text-muted)]">No data</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#dc2626' }} />
          <span className="text-xs text-[var(--text-muted)]">Critical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#b45309' }} />
          <span className="text-xs text-[var(--text-muted)]">Concerning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#a16207' }} />
          <span className="text-xs text-[var(--text-muted)]">Fair</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#15803d' }} />
          <span className="text-xs text-[var(--text-muted)]">Good</span>
        </div>
      </div>

      <p className="text-center text-xs text-[var(--text-muted)] mt-2 md:hidden">
        Tap a state to filter judges
      </p>
    </div>
  );
}
