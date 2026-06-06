'use client';

import { useState } from 'react';
import statePaths from '@/data/us-state-paths.json';

interface StateData {
  code: string;
  name: string;
  judgeCount: number;
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

function getHeatColor(count: number, max: number): string {
  if (count === 0) return '#1f1f1f';
  const intensity = Math.min(1, count / Math.max(max * 0.5, 1));
  if (intensity < 0.2) return '#451a03';
  if (intensity < 0.4) return '#7c2d12';
  if (intensity < 0.6) return '#b91c1c';
  if (intensity < 0.8) return '#dc2626';
  return '#ef4444';
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
          const fill = isHovered ? '#ef4444' : getHeatColor(count, maxCount);
          
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
          <span className="text-xs text-[var(--text-muted)]">0</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#451a03' }} />
          <span className="text-xs text-[var(--text-muted)]">1-2</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#7c2d12' }} />
          <span className="text-xs text-[var(--text-muted)]">3-4</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#b91c1c' }} />
          <span className="text-xs text-[var(--text-muted)]">5-7</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#dc2626' }} />
          <span className="text-xs text-[var(--text-muted)]">8+</span>
        </div>
      </div>

      <p className="text-center text-xs text-[var(--text-muted)] mt-2 md:hidden">
        Tap a state to filter judges
      </p>
    </div>
  );
}
