'use client';

import { useState } from 'react';

interface StateData {
  code: string;
  name: string;
  judgeCount: number;
}

interface USMapProps {
  stateData: StateData[];
  onStateClick: (stateCode: string) => void;
}

// Simplified US state paths for SVG map
const STATE_PATHS: Record<string, { d: string; label: [number, number] }> = {
  AL: { d: "M628,396 L628,440 L620,450 L625,458 L640,458 L640,396Z", label: [632, 428] },
  AK: { d: "M110,490 L160,490 L170,470 L130,460 L100,470Z", label: [135, 478] },
  AZ: { d: "M200,370 L200,430 L250,430 L255,370Z", label: [225, 400] },
  AR: { d: "M560,390 L560,430 L610,430 L610,390Z", label: [585, 410] },
  CA: { d: "M120,260 L115,310 L110,360 L130,410 L160,400 L170,350 L170,310 L155,260Z", label: [138, 340] },
  CO: { d: "M280,290 L280,340 L350,340 L350,290Z", label: [315, 315] },
  CT: { d: "M810,210 L810,230 L830,230 L835,210Z", label: [820, 220] },
  DE: { d: "M770,280 L770,300 L780,300 L782,280Z", label: [775, 290] },
  FL: { d: "M640,460 L660,445 L700,440 L720,465 L710,500 L690,510 L670,490 L640,470Z", label: [685, 472] },
  GA: { d: "M660,380 L660,440 L700,440 L700,380Z", label: [680, 410] },
  HI: { d: "M250,480 L270,475 L280,485 L260,495Z", label: [265, 485] },
  ID: { d: "M210,160 L200,230 L230,250 L250,230 L240,160Z", label: [225, 205] },
  IL: { d: "M580,260 L575,330 L595,340 L610,320 L608,260Z", label: [590, 300] },
  IN: { d: "M610,260 L610,330 L640,330 L640,260Z", label: [625, 295] },
  IA: { d: "M500,240 L500,285 L560,285 L560,240Z", label: [530, 262] },
  KS: { d: "M400,310 L400,355 L490,355 L490,310Z", label: [445, 332] },
  KY: { d: "M610,330 L610,360 L690,350 L700,330Z", label: [650, 345] },
  LA: { d: "M560,430 L560,470 L600,475 L610,455 L610,430Z", label: [580, 450] },
  ME: { d: "M830,120 L825,160 L845,170 L850,140Z", label: [838, 145] },
  MD: { d: "M730,280 L730,300 L770,295 L775,275Z", label: [750, 288] },
  MA: { d: "M815,195 L815,208 L845,205 L845,192Z", label: [830, 200] },
  MI: { d: "M590,180 L585,230 L620,245 L640,230 L635,190 L615,175Z", label: [610, 215] },
  MN: { d: "M480,140 L475,220 L530,225 L535,140Z", label: [505, 180] },
  MS: { d: "M590,390 L590,450 L625,455 L628,396Z", label: [608, 420] },
  MO: { d: "M520,300 L515,370 L575,375 L580,300Z", label: [545, 338] },
  MT: { d: "M250,120 L245,180 L350,185 L355,120Z", label: [300, 152] },
  NE: { d: "M370,260 L370,305 L490,310 L490,260Z", label: [430, 282] },
  NV: { d: "M170,240 L165,340 L210,360 L220,260Z", label: [192, 300] },
  NH: { d: "M822,155 L818,190 L830,192 L834,157Z", label: [826, 175] },
  NJ: { d: "M785,240 L780,275 L790,280 L795,245Z", label: [787, 258] },
  NM: { d: "M260,370 L260,435 L330,440 L330,370Z", label: [295, 405] },
  NY: { d: "M750,170 L740,220 L800,230 L810,210 L800,175Z", label: [770, 200] },
  NC: { d: "M660,350 L660,380 L750,370 L760,345Z", label: [705, 362] },
  ND: { d: "M380,130 L378,180 L460,182 L462,130Z", label: [420, 155] },
  OH: { d: "M645,250 L640,310 L680,315 L690,260Z", label: [662, 280] },
  OK: { d: "M400,360 L400,400 L520,405 L520,360Z", label: [460, 380] },
  OR: { d: "M120,160 L120,220 L200,230 L210,165Z", label: [162, 192] },
  PA: { d: "M700,230 L695,270 L780,275 L785,235Z", label: [740, 252] },
  RI: { d: "M825,215 L822,225 L832,228 L835,218Z", label: [828, 222] },
  SC: { d: "M680,370 L670,400 L720,405 L725,375Z", label: [698, 388] },
  SD: { d: "M380,185 L378,240 L460,242 L462,185Z", label: [420, 212] },
  TN: { d: "M590,350 L590,380 L680,370 L690,345Z", label: [635, 362] },
  TX: { d: "M340,400 L330,470 L380,510 L470,490 L520,450 L520,400Z", label: [425, 445] },
  UT: { d: "M230,260 L225,340 L280,345 L285,260Z", label: [255, 300] },
  VT: { d: "M805,155 L800,190 L815,195 L820,158Z", label: [810, 175] },
  VA: { d: "M690,300 L680,345 L760,340 L770,295Z", label: [722, 320] },
  WA: { d: "M140,100 L135,160 L210,168 L215,108Z", label: [175, 135] },
  WV: { d: "M690,290 L680,330 L710,335 L715,295Z", label: [698, 312] },
  WI: { d: "M530,160 L525,230 L585,235 L590,165Z", label: [555, 195] },
  WY: { d: "M270,200 L268,260 L350,262 L352,200Z", label: [310, 230] },
  DC: { d: "M755,290 L755,298 L763,298 L763,290Z", label: [759, 294] },
};

const STATE_NAMES: Record<string, string> = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',
  CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',
  HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',
  KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',
  MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',
  MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
  NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',
  OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
  SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',
  VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
  DC:'District of Columbia',
};

function getHeatColor(count: number, max: number): string {
  if (count === 0) return '#1a1a1a';
  const intensity = Math.min(1, count / Math.max(max * 0.6, 1));
  if (intensity < 0.25) return '#451a03';
  if (intensity < 0.5) return '#7c2d12';
  if (intensity < 0.75) return '#b91c1c';
  return '#dc2626';
}

export default function USMap({ stateData, onStateClick }: USMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  
  const dataMap = new Map(stateData.map(s => [s.code, s]));
  const maxCount = Math.max(...stateData.map(s => s.judgeCount), 1);
  
  const hoveredData = hoveredState ? dataMap.get(hoveredState) : null;

  return (
    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">🗺️ Judges by State</h2>
        {hoveredData && (
          <div className="text-sm text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">{STATE_NAMES[hoveredState!] || hoveredState}</span>
            {' — '}
            <span className="text-[var(--red-primary)] font-semibold">{hoveredData.judgeCount}</span> judge{hoveredData.judgeCount !== 1 ? 's' : ''}
          </div>
        )}
        {!hoveredData && (
          <div className="text-sm text-[var(--text-muted)]">Hover a state to see details • Click to filter</div>
        )}
      </div>
      
      <svg viewBox="80 80 800 460" className="w-full h-auto">
        {/* Draw states */}
        {Object.entries(STATE_PATHS).map(([code, { d, label }]) => {
          const data = dataMap.get(code);
          const count = data?.judgeCount || 0;
          const isHovered = hoveredState === code;
          const fill = getHeatColor(count, maxCount);
          
          return (
            <g key={code}>
              <path
                d={d}
                fill={isHovered ? '#dc2626' : fill}
                stroke={isHovered ? '#fff' : '#333'}
                strokeWidth={isHovered ? 2 : 0.5}
                className="cursor-pointer transition-colors duration-150"
                onMouseEnter={() => setHoveredState(code)}
                onMouseLeave={() => setHoveredState(null)}
                onClick={() => onStateClick(code)}
              />
              {count > 0 && (
                <text
                  x={label[0]}
                  y={label[1]}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none select-none"
                  fill={isHovered ? '#fff' : '#999'}
                  fontSize={count > 9 ? 9 : 10}
                  fontWeight={isHovered ? 700 : 500}
                >
                  {count}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#1a1a1a', border: '1px solid #333' }} />
          <span className="text-xs text-[var(--text-muted)]">0</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#451a03' }} />
          <span className="text-xs text-[var(--text-muted)]">1-3</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#7c2d12' }} />
          <span className="text-xs text-[var(--text-muted)]">4-6</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#b91c1c' }} />
          <span className="text-xs text-[var(--text-muted)]">7-9</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#dc2626' }} />
          <span className="text-xs text-[var(--text-muted)]">10+</span>
        </div>
      </div>
    </div>
  );
}
