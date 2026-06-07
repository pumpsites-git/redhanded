'use client';

import { useState } from 'react';
import Link from 'next/link';
import statePaths from '@/data/us-state-paths.json';
import type { SortMetric } from '@/lib/districts';

interface MapPoint {
  code: string;
  state: string;
  name: string;
  value: number;
}

interface DistrictMapProps {
  mapData: MapPoint[];
  maxVal: number;
  metric: SortMetric;
  hoveredCode: string | null;
  onHover: (code: string | null) => void;
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

// Heat map color: green -> yellow -> orange -> red
function heatColor(ratio: number): string {
  // ratio 0..1
  if (ratio < 0.25) {
    // green to yellow-green
    const t = ratio / 0.25;
    const r = Math.round(22 + t * (202 - 22));
    const g = Math.round(163 + t * (138 - 163));
    const b = Math.round(74 - t * 74);
    return `rgb(${r},${g},${b})`;
  } else if (ratio < 0.5) {
    // yellow-green to orange
    const t = (ratio - 0.25) / 0.25;
    const r = Math.round(202 + t * (234 - 202));
    const g = Math.round(138 - t * (50));
    const b = Math.round(0);
    return `rgb(${r},${g},${b})`;
  } else if (ratio < 0.75) {
    // orange to red
    const t = (ratio - 0.5) / 0.25;
    const r = Math.round(234 + t * (220 - 234));
    const g = Math.round(88 - t * 88);
    const b = 0;
    return `rgb(${r},${g},${b})`;
  } else {
    // deep red
    const t = (ratio - 0.75) / 0.25;
    const r = 220;
    const g = 0;
    const b = Math.round(t * 0);
    return `rgb(${r},${g},${b})`;
  }
}

function formatMetricValue(value: number, metric: SortMetric): string {
  switch (metric) {
    case 'recidivism': return `${value.toFixed(1)}%`;
    case 'sentence': return `${value.toFixed(1)} mo`;
    case 'belowGuidelines': return `${value.toFixed(1)}%`;
    case 'caseVolume': return value.toLocaleString() + ' cases';
    case 'dangerous': return `${value.toFixed(1)}%`;
  }
}

const METRIC_LABELS: Record<SortMetric, string> = {
  recidivism: 'Recidivism Rate',
  sentence: 'Avg Sentence',
  belowGuidelines: 'Below Guidelines',
  caseVolume: 'Case Volume',
  dangerous: 'High-Risk Offenders',
};

export default function DistrictMap({ mapData, maxVal, metric, hoveredCode, onHover }: DistrictMapProps) {
  const [localHovered, setLocalHovered] = useState<string | null>(null);

  // Group districts by state — color the state by the highest-value district in it
  // (since SVG paths are by state, not district)
  const stateToDistricts = new Map<string, MapPoint[]>();
  for (const d of mapData) {
    const arr = stateToDistricts.get(d.state) ?? [];
    arr.push(d);
    stateToDistricts.set(d.state, arr);
  }

  // For each state, compute average value
  const stateValues = new Map<string, { avg: number; districts: MapPoint[] }>();
  stateToDistricts.forEach((districts, state) => {
    const avg = districts.reduce((s, d) => s + d.value, 0) / districts.length;
    stateValues.set(state, { avg, districts });
  });

  const hovered = localHovered ?? hoveredCode;
  const hoveredDistricts = hovered
    ? mapData.filter(d => d.code === hovered || (stateValues.get(hovered)?.districts.some(dd => dd.code === hovered)))
    : null;

  // Find which district is being hovered
  const hoveredDistrict = mapData.find(d => d.code === hovered);
  const paths = statePaths as Record<string, string>;

  return (
    <div>
      {/* Hover info bar */}
      <div
        style={{
          minHeight: '2rem',
          marginBottom: '0.5rem',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        {hoveredDistrict ? (
          <>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{hoveredDistrict.name}</span>
            <span>({hoveredDistrict.state})</span>
            <span>—</span>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>
              {METRIC_LABELS[metric]}: {formatMetricValue(hoveredDistrict.value, metric)}
            </span>
            <Link
              href={`/district/${hoveredDistrict.code}`}
              style={{ color: 'var(--red-primary)', fontSize: '0.78rem', marginLeft: '0.5rem' }}
            >
              View details →
            </Link>
          </>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Hover a state to preview district data</span>
        )}
      </div>

      {/* The map: state-level coloring — color each state by avg of its districts */}
      <svg
        viewBox="0 0 960 600"
        style={{ width: '100%', height: 'auto' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {Object.entries(paths).map(([stateCode, pathD]) => {
          const sv = stateValues.get(stateCode);
          const ratio = sv ? Math.min(sv.avg / maxVal, 1) : 0;
          const fill = sv ? heatColor(ratio) : '#1f1f1f';
          const isHovered = stateCode === hovered || sv?.districts.some(d => d.code === hovered);

          // Find first district for this state to use as hover code
          const firstDistrict = sv?.districts[0];

          return (
            <path
              key={stateCode}
              d={pathD}
              fill={isHovered ? '#ef4444' : fill}
              stroke={isHovered ? '#ffffff' : '#333333'}
              strokeWidth={isHovered ? 2 : 0.75}
              strokeLinejoin="round"
              style={{ cursor: firstDistrict ? 'pointer' : 'default', transition: 'fill 0.15s' }}
              onMouseEnter={() => {
                if (firstDistrict) {
                  setLocalHovered(firstDistrict.code);
                  onHover(firstDistrict.code);
                }
              }}
              onMouseLeave={() => {
                setLocalHovered(null);
                onHover(null);
              }}
            >
              <title>
                {STATE_NAMES[stateCode] ?? stateCode}
                {sv ? ` — ${sv.districts.length} district(s)` : ': No data'}
              </title>
            </path>
          );
        })}
      </svg>

      {/* Multi-district state hint */}
      {hoveredDistrict && stateValues.get(hoveredDistrict.state) && (stateValues.get(hoveredDistrict.state)?.districts.length ?? 0) > 1 && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--bg-secondary)',
            borderRadius: '0.5rem',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{hoveredDistrict.state} districts: </span>
          {stateValues.get(hoveredDistrict.state)?.districts.map((d, i) => (
            <span key={d.code}>
              {i > 0 && ' · '}
              <Link href={`/district/${d.code}`} style={{ color: 'var(--red-primary)' }}>
                {d.name}
              </Link>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
