'use client';

import { useState, memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

interface StateData {
  code: string;
  name: string;
  judgeCount: number;
}

interface USMapProps {
  stateData: StateData[];
  onStateClick: (stateCode: string) => void;
}

// FIPS code → state abbreviation
const FIPS_TO_STATE: Record<string, string> = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT',
  '10':'DE','11':'DC','12':'FL','13':'GA','15':'HI','16':'ID','17':'IL',
  '18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME','24':'MD',
  '25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE',
  '32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND',
  '39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD',
  '47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV',
  '55':'WI','56':'WY','72':'PR',
};

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
  if (count === 0) return '#1a1a1a';
  const intensity = Math.min(1, count / Math.max(max * 0.5, 1));
  if (intensity < 0.2) return '#451a03';
  if (intensity < 0.4) return '#7c2d12';
  if (intensity < 0.6) return '#b91c1c';
  if (intensity < 0.8) return '#dc2626';
  return '#ef4444';
}

const MapChart = memo(function MapChart({ stateData, onStateClick }: USMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const dataMap = new Map(stateData.map(s => [s.code, s]));
  const maxCount = Math.max(...stateData.map(s => s.judgeCount), 1);
  const hoveredData = hoveredState ? dataMap.get(hoveredState) : null;

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
            Hover a state to see details · Click to filter
          </div>
        )}
      </div>

      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 1000 }}
        width={800}
        height={500}
        style={{ width: '100%', height: 'auto' }}
      >
        <ZoomableGroup>
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => {
                const fips = geo.id;
                const stateCode = FIPS_TO_STATE[fips] || '';
                const data = dataMap.get(stateCode);
                const count = data?.judgeCount || 0;
                const isHovered = hoveredState === stateCode;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isHovered ? '#ef4444' : getHeatColor(count, maxCount)}
                    stroke={isHovered ? '#ffffff' : '#333333'}
                    strokeWidth={isHovered ? 1.5 : 0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', fill: '#ef4444', stroke: '#ffffff', strokeWidth: 1.5 },
                      pressed: { outline: 'none', fill: '#dc2626' },
                    }}
                    onMouseEnter={() => setHoveredState(stateCode)}
                    onMouseLeave={() => setHoveredState(null)}
                    onClick={() => {
                      if (stateCode) onStateClick(stateCode);
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#1a1a1a', border: '1px solid #333' }} />
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
          <span className="text-xs text-[var(--text-muted)]">8-10</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#ef4444' }} />
          <span className="text-xs text-[var(--text-muted)]">10+</span>
        </div>
      </div>

      {/* Mobile tap hint */}
      <p className="text-center text-xs text-[var(--text-muted)] mt-2 md:hidden">
        Tap a state to filter judges
      </p>
    </div>
  );
});

export default MapChart;
