'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import floridaData from '@/data/florida-county-paths.json';
import statePaths from '@/data/us-state-paths.json';
import countyProfilesRaw from '../../data/master/county-profiles.json';
import { getAllStateJudges, getLeniencyLabel, getLeniencyColor, StateJudge } from '@/lib/state-judges';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CountyProfile {
  name: string;
  slug: string;
  state: string;
  stateCode: string;
  totalCases: number;
  prisonRate: number;
  jailRate: number;
  probationRate: number;
  mitigatedDepartureRate: number;
  avgCommitmentDays: number | null;
  vsStatePrisonRate: number;
  pleaBargainRate: number;
  avgSentencePoints: number;
}

interface CountyProfilesData {
  stateAverage: { prisonRate: number };
  counties: Record<string, CountyProfile>;
}

type DrillView = 'national' | 'state' | 'county';

// ── Data ──────────────────────────────────────────────────────────────────────

const countyData = countyProfilesRaw as unknown as CountyProfilesData;
const ALL_JUDGES = getAllStateJudges();
const FL_PATHS = floridaData.paths as Record<string, string>;
const STATE_PATHS = statePaths as Record<string, string>;

// ── Color helpers ─────────────────────────────────────────────────────────────

function getCountyFillColor(vsStatePrisonRate: number, isHovered: boolean): string {
  if (isHovered) return '#ffffff22';
  // vsStatePrisonRate: positive = stricter than state avg, negative = more lenient
  const pct = vsStatePrisonRate * 100;
  if (pct >= 20) return '#166534';   // very strict — dark green
  if (pct >= 10) return '#16a34a';   // strict — green
  if (pct >= 3)  return '#4ade80';   // slightly strict — light green
  if (pct >= -3) return '#eab308';   // average — yellow
  if (pct >= -10) return '#f97316';  // slightly lenient — orange
  if (pct >= -18) return '#ef4444';  // lenient — red
  return '#991b1b';                   // very lenient — dark red
}

function getCountyBorderColor(isHovered: boolean, isSelected: boolean): string {
  if (isSelected) return '#ffffff';
  if (isHovered) return '#e2e8f0';
  return '#374151';
}

function getCountyGrade(vsStatePrisonRate: number): string {
  const pct = vsStatePrisonRate * 100;
  if (pct >= 20) return 'A+';
  if (pct >= 10) return 'A';
  if (pct >= 3)  return 'B';
  if (pct >= -3) return 'C';
  if (pct >= -10) return 'D';
  if (pct >= -18) return 'F';
  return 'F-';
}

function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#22c55e';
  if (grade.startsWith('B')) return '#86efac';
  if (grade === 'C') return '#eab308';
  if (grade === 'D') return '#f97316';
  return '#ef4444';
}

function getStateColor(code: string): string {
  if (code === 'FL') return '#3b82f6'; // blue — data available
  return '#1f2937'; // very dark gray — coming soon
}

// ── State name map ─────────────────────────────────────────────────────────────

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

// ── Sub-components ────────────────────────────────────────────────────────────

function Breadcrumb({
  view,
  selectedState,
  selectedCounty,
  onNational,
  onState,
}: {
  view: DrillView;
  selectedState: string | null;
  selectedCounty: string | null;
  onNational: () => void;
  onState: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm mb-4 flex-wrap">
      <button
        onClick={onNational}
        className={`font-semibold transition-colors ${
          view === 'national'
            ? 'text-white cursor-default'
            : 'text-blue-400 hover:text-blue-300 cursor-pointer'
        }`}
      >
        🇺🇸 United States
      </button>
      {(view === 'state' || view === 'county') && selectedState && (
        <>
          <span className="text-gray-600">›</span>
          <button
            onClick={onState}
            className={`font-semibold transition-colors ${
              view === 'state'
                ? 'text-white cursor-default'
                : 'text-blue-400 hover:text-blue-300 cursor-pointer'
            }`}
          >
            {STATE_NAMES[selectedState] || selectedState}
          </button>
        </>
      )}
      {view === 'county' && selectedCounty && (
        <>
          <span className="text-gray-600">›</span>
          <span className="font-semibold text-white">{selectedCounty} County</span>
        </>
      )}
    </div>
  );
}

function CountyLegend() {
  return (
    <div className="flex items-center gap-3 flex-wrap mt-3 justify-center">
      <span className="text-xs text-gray-500 mr-1">vs. State avg:</span>
      {[
        { color: '#166534', label: 'Very Strict (+20%)' },
        { color: '#16a34a', label: 'Strict (+10%)' },
        { color: '#4ade80', label: 'Avg (+3%)' },
        { color: '#eab308', label: 'Mixed (±3%)' },
        { color: '#f97316', label: 'Lenient (-10%)' },
        { color: '#ef4444', label: 'Very Lenient (-18%)' },
      ].map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: color, border: '1px solid #374151' }}
          />
          <span className="text-xs text-gray-400">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── National View ─────────────────────────────────────────────────────────────

function NationalView({ onStateClick }: { onStateClick: (code: string) => void }) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  return (
    <div>
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white mb-1">Select a State to Explore</h2>
        <p className="text-gray-400 text-sm">
          Click on a state to see county-level sentencing data.{' '}
          <span className="text-blue-400">Florida</span> is currently available.
        </p>
      </div>

      <div className="relative">
        <svg
          viewBox="0 0 960 600"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {Object.entries(STATE_PATHS).map(([code, d]) => {
            const isFL = code === 'FL';
            const isHovered = hoveredState === code;
            const fill = isHovered
              ? isFL ? '#60a5fa' : '#374151'
              : getStateColor(code);
            return (
              <path
                key={code}
                d={d}
                fill={fill}
                stroke={isHovered ? '#e2e8f0' : '#4b5563'}
                strokeWidth={isHovered ? 1.5 : 0.5}
                strokeLinejoin="round"
                className={`transition-colors duration-150 ${isFL ? 'cursor-pointer' : 'cursor-default'}`}
                onMouseEnter={() => setHoveredState(code)}
                onMouseLeave={() => setHoveredState(null)}
                onClick={() => isFL && onStateClick(code)}
              >
                <title>
                  {STATE_NAMES[code] || code}
                  {isFL ? ' — Click to explore counties' : ' — Coming soon'}
                </title>
              </path>
            );
          })}
        </svg>

        {/* Hover tooltip for non-FL states */}
        {hoveredState && hoveredState !== 'FL' && (
          <div
            className="absolute top-4 right-4 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm pointer-events-none"
          >
            <div className="font-semibold text-white">{STATE_NAMES[hoveredState] || hoveredState}</div>
            <div className="text-gray-400 text-xs mt-0.5">Data coming soon</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#3b82f6', border: '1px solid #4b5563' }} />
          <span className="text-xs text-gray-400">Data available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#1f2937', border: '1px solid #4b5563' }} />
          <span className="text-xs text-gray-400">Coming soon</span>
        </div>
      </div>

      <p className="text-center text-xs text-gray-600 mt-2">
        Currently covering Florida state court data (66 counties, 657+ judges)
      </p>
    </div>
  );
}

// ── State View (Florida Counties) ─────────────────────────────────────────────

function FloridaStateView({
  onCountyClick,
}: {
  onCountyClick: (name: string) => void;
}) {
  const [hoveredCounty, setHoveredCounty] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Build county lookup by name
  const countyByName = useMemo(() => {
    const map = new Map<string, CountyProfile>();
    Object.values(countyData.counties).forEach((c) => {
      map.set(c.name.toLowerCase(), c);
    });
    return map;
  }, []);

  const getCountyData = useCallback(
    (name: string) => {
      // Try exact match, then normalized
      return (
        countyByName.get(name.toLowerCase()) ||
        countyByName.get(name.replace('-', ' ').toLowerCase()) ||
        null
      );
    },
    [countyByName]
  );

  const hoveredData = hoveredCounty ? getCountyData(hoveredCounty) : null;
  const stateAvg = countyData.stateAverage.prisonRate;

  return (
    <div>
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white mb-1">🌴 Florida — County Sentencing Map</h2>
        <p className="text-gray-400 text-sm">
          Color shows prison rate vs. state average ({(stateAvg * 100).toFixed(1)}%).
          Click a county to see its judges.
        </p>
      </div>

      <div className="relative">
        <svg
          viewBox="0 0 800 700"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltipPos({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            });
          }}
        >
          {Object.entries(FL_PATHS).map(([name, d]) => {
            const data = getCountyData(name);
            const isHovered = hoveredCounty === name;
            const vsState = data?.vsStatePrisonRate ?? 0;
            const fill = getCountyFillColor(vsState, false);
            const stroke = getCountyBorderColor(isHovered, false);

            return (
              <path
                key={name}
                d={d}
                fill={isHovered ? '#ffffff33' : fill}
                stroke={stroke}
                strokeWidth={isHovered ? 1.5 : 0.75}
                strokeLinejoin="round"
                className="cursor-pointer transition-all duration-100"
                onMouseEnter={() => setHoveredCounty(name)}
                onMouseLeave={() => setHoveredCounty(null)}
                onClick={() => {
                  if (data) onCountyClick(name);
                }}
              />
            );
          })}
        </svg>

        {/* Floating tooltip */}
        {hoveredCounty && hoveredData && (
          <div
            className="absolute pointer-events-none z-20 bg-gray-900 border border-gray-600 rounded-xl shadow-xl px-4 py-3 text-sm min-w-[180px]"
            style={{
              left: Math.min(tooltipPos.x + 12, 600),
              top: Math.max(tooltipPos.y - 60, 4),
            }}
          >
            <div className="font-bold text-white text-base mb-1">{hoveredCounty} County</div>
            <div className="flex items-center justify-between gap-4 mb-1">
              <span className="text-gray-400">Grade</span>
              <span
                className="font-bold text-lg"
                style={{ color: getGradeColor(getCountyGrade(hoveredData.vsStatePrisonRate)) }}
              >
                {getCountyGrade(hoveredData.vsStatePrisonRate)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 mb-1">
              <span className="text-gray-400">Prison rate</span>
              <span className="text-white font-semibold">
                {(hoveredData.prisonRate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 mb-1">
              <span className="text-gray-400">vs state avg</span>
              <span
                className="font-semibold"
                style={{
                  color:
                    hoveredData.vsStatePrisonRate >= 0 ? '#22c55e' : '#f97316',
                }}
              >
                {hoveredData.vsStatePrisonRate >= 0 ? '+' : ''}
                {(hoveredData.vsStatePrisonRate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-400">Cases</span>
              <span className="text-white">{hoveredData.totalCases.toLocaleString()}</span>
            </div>
            <div className="mt-2 text-xs text-blue-400">Click to see judges →</div>
          </div>
        )}

        {/* County with no data tooltip */}
        {hoveredCounty && !hoveredData && (
          <div
            className="absolute pointer-events-none z-20 bg-gray-900 border border-gray-600 rounded-xl shadow-xl px-4 py-3 text-sm"
            style={{
              left: Math.min(tooltipPos.x + 12, 600),
              top: Math.max(tooltipPos.y - 60, 4),
            }}
          >
            <div className="font-bold text-white">{hoveredCounty} County</div>
            <div className="text-gray-400 text-xs mt-1">No data available</div>
          </div>
        )}
      </div>

      <CountyLegend />
    </div>
  );
}

// ── County View (Judges) ──────────────────────────────────────────────────────

function CountyView({ countyName }: { countyName: string }) {
  const [sortBy, setSortBy] = useState<'leniency' | 'cases' | 'prison'>('leniency');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const countyProfile = useMemo(() => {
    const lower = countyName.toLowerCase();
    return (
      Object.values(countyData.counties).find(
        (c) => c.name.toLowerCase() === lower
      ) || null
    );
  }, [countyName]);

  const judges = useMemo(() => {
    return ALL_JUDGES.filter((j) => {
      // Match "Orange County" → "Orange" or "Orange County"
      const cn = countyName.toLowerCase();
      const jc = j.county.toLowerCase().replace(' county', '');
      return jc === cn.replace(' county', '') || j.county.toLowerCase() === cn;
    });
  }, [countyName]);

  const sorted = useMemo(() => {
    const arr = [...judges];
    arr.sort((a, b) => {
      let va: number, vb: number;
      if (sortBy === 'leniency') { va = a.leniencyScore; vb = b.leniencyScore; }
      else if (sortBy === 'cases') { va = a.totalCases; vb = b.totalCases; }
      else { va = a.prisonRate; vb = b.prisonRate; }
      return sortDir === 'desc' ? vb - va : va - vb;
    });
    return arr;
  }, [judges, sortBy, sortDir]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortBy(col); setSortDir('desc'); }
  };

  const grade = countyProfile
    ? getCountyGrade(countyProfile.vsStatePrisonRate)
    : '–';
  const gradeColor = getGradeColor(grade);

  return (
    <div>
      {/* County header */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className="text-4xl font-black rounded-xl w-16 h-16 flex items-center justify-center shrink-0"
          style={{ color: gradeColor, background: `${gradeColor}22`, border: `2px solid ${gradeColor}44` }}
        >
          {grade}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{countyName} County</h2>
          <p className="text-gray-400 text-sm mt-0.5">Florida · State Court</p>
          {countyProfile && (
            <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
              <span className="text-gray-400">
                Prison rate:{' '}
                <span className="text-white font-semibold">
                  {(countyProfile.prisonRate * 100).toFixed(1)}%
                </span>
              </span>
              <span className="text-gray-400">
                vs state:{' '}
                <span
                  className="font-semibold"
                  style={{ color: countyProfile.vsStatePrisonRate >= 0 ? '#22c55e' : '#f97316' }}
                >
                  {countyProfile.vsStatePrisonRate >= 0 ? '+' : ''}
                  {(countyProfile.vsStatePrisonRate * 100).toFixed(1)}%
                </span>
              </span>
              <span className="text-gray-400">
                Cases:{' '}
                <span className="text-white font-semibold">
                  {countyProfile.totalCases.toLocaleString()}
                </span>
              </span>
              {judges.length > 0 && (
                <span className="text-gray-400">
                  Judges:{' '}
                  <span className="text-white font-semibold">{judges.length}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {judges.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-semibold">No individual judge data for {countyName} County</p>
          <p className="text-sm mt-1">County-level aggregate data is available above.</p>
        </div>
      ) : (
        <>
          {/* Sort controls */}
          <div className="flex items-center gap-2 mb-3 text-xs">
            <span className="text-gray-500">Sort by:</span>
            {(
              [
                { key: 'leniency', label: 'Leniency Score' },
                { key: 'cases', label: 'Case Count' },
                { key: 'prison', label: 'Prison Rate' },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleSort(key)}
                className={`px-2 py-1 rounded transition-colors border ${
                  sortBy === key
                    ? 'bg-red-950 border-red-800 text-red-300'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-gray-200'
                }`}
              >
                {label}
                {sortBy === key && (sortDir === 'desc' ? ' ↓' : ' ↑')}
              </button>
            ))}
          </div>

          {/* Judge cards */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {sorted.map((judge) => (
              <JudgeRow key={judge.slug} judge={judge} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function JudgeRow({ judge }: { judge: StateJudge }) {
  const scoreColor = getLeniencyColor(judge.leniencyScore);
  const label = getLeniencyLabel(judge.leniencyScore);

  return (
    <Link
      href={`/judges/state/${judge.slug}`}
      className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-all duration-150 no-underline group"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm group-hover:text-blue-300 transition-colors truncate">
              {judge.name}
            </span>
            <span className="text-xs text-gray-500 shrink-0">{judge.courtFacility}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
            <span>{judge.totalCases.toLocaleString()} cases</span>
            <span>Prison: {(judge.prisonRate * 100).toFixed(0)}%</span>
            <span>Prob: {(judge.probationRate * 100).toFixed(0)}%</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-0.5">Leniency</div>
            <div
              className="text-lg font-black tabular-nums"
              style={{ color: scoreColor }}
            >
              {judge.leniencyScore}
            </div>
          </div>
          <div
            className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
            style={{
              color: scoreColor,
              background: `${scoreColor}22`,
              border: `1px solid ${scoreColor}44`,
            }}
          >
            {label}
          </div>
        </div>
      </div>

      {/* Mini leniency bar */}
      <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-gray-800">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, judge.leniencyScore)}%`,
            background: `linear-gradient(to right, ${scoreColor}88, ${scoreColor})`,
          }}
        />
      </div>
    </Link>
  );
}

// ── Main DrillDownMap Component ───────────────────────────────────────────────

export default function DrillDownMap() {
  const [view, setView] = useState<DrillView>('national');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);

  const handleStateClick = useCallback((code: string) => {
    setSelectedState(code);
    setSelectedCounty(null);
    setView('state');
  }, []);

  const handleCountyClick = useCallback((name: string) => {
    setSelectedCounty(name);
    setView('county');
  }, []);

  const handleNational = useCallback(() => {
    setView('national');
    setSelectedState(null);
    setSelectedCounty(null);
  }, []);

  const handleState = useCallback(() => {
    setView('state');
    setSelectedCounty(null);
  }, []);

  return (
    <div className="min-h-full">
      {/* Breadcrumb nav */}
      <Breadcrumb
        view={view}
        selectedState={selectedState}
        selectedCounty={selectedCounty}
        onNational={handleNational}
        onState={handleState}
      />

      {/* View content with animation wrapper */}
      <div className="transition-all duration-200">
        {view === 'national' && (
          <NationalView onStateClick={handleStateClick} />
        )}
        {view === 'state' && selectedState === 'FL' && (
          <FloridaStateView onCountyClick={handleCountyClick} />
        )}
        {view === 'county' && selectedCounty && (
          <CountyView countyName={selectedCounty} />
        )}
      </div>
    </div>
  );
}
