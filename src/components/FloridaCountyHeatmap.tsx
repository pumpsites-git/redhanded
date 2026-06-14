'use client';

import { useState } from 'react';
import type { FLCounty } from '@/lib/state-deep-dive';

function leniencyColor(score: number): string {
  const hue = 120 - (score / 100) * 120;
  return `hsl(${hue}, 70%, 42%)`;
}

function leniencyBg(score: number): string {
  const hue = 120 - (score / 100) * 120;
  return `hsla(${hue}, 70%, 42%, 0.18)`;
}

interface Props {
  counties: FLCounty[];
}

function Stat({ label, val, color }: { label: string; val: string; color?: string }) {
  return (
    <div>
      <div className="text-[0.65rem] text-[var(--text-muted)] mb-0.5">{label}</div>
      <div className="text-sm font-bold" style={{ color: color ?? 'var(--text-primary)' }}>{val}</div>
    </div>
  );
}

export default function FloridaCountyHeatmap({ counties }: Props) {
  const [hovered, setHovered] = useState<FLCounty | null>(null);

  const sorted = [...counties].sort((a, b) => b.leniencyScore - a.leniencyScore);

  return (
    <div>
      {/* Tooltip / hover info */}
      <div
        className="min-h-[3.5rem] mb-3 px-3.5 py-2.5 rounded-lg border transition-all duration-150"
        style={{
          background: hovered ? leniencyBg(hovered.leniencyScore) : 'var(--bg-secondary)',
          borderColor: hovered ? `${leniencyColor(hovered.leniencyScore)}55` : 'var(--border)',
        }}
      >
        {hovered ? (
          <div className="flex flex-wrap gap-5 items-center">
            <div>
              <div className="text-base font-bold" style={{ color: leniencyColor(hovered.leniencyScore) }}>
                {hovered.name} County
              </div>
              <div className="text-[0.72rem] text-[var(--text-muted)]">
                Circuit {hovered.judicialCircuit} · Rank #{hovered.leniencyRank} of 67
              </div>
            </div>
            <div className="flex gap-5 flex-wrap">
              <Stat label="Leniency" val={hovered.leniencyScore.toFixed(1)} color={leniencyColor(hovered.leniencyScore)} />
              <Stat label="Prison Rate" val={`${(hovered.prisonRate * 100).toFixed(1)}%`} />
              <Stat label="Jail Rate" val={`${(hovered.jailRate * 100).toFixed(1)}%`} />
              <Stat label="Total Cases" val={hovered.totalCases.toLocaleString()} />
              <Stat label="Avg Felony Sentence" val={hovered.avgFelonySentenceDays ? `${Math.round(hovered.avgFelonySentenceDays)} days` : '—'} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Hover a county tile to see details · Red = most lenient · Green = toughest sentencing
          </p>
        )}
      </div>

      {/* Tile grid */}
      <div className="flex flex-wrap gap-1">
        {sorted.map(c => {
          const color = leniencyColor(c.leniencyScore);
          const bg = leniencyBg(c.leniencyScore);
          const isHovered = hovered?.slug === c.slug;

          return (
            <div
              key={c.slug}
              onMouseEnter={() => setHovered(c)}
              onMouseLeave={() => setHovered(null)}
              className="flex flex-col items-center justify-center rounded cursor-default transition-all duration-100 overflow-hidden"
              style={{
                width: '56px',
                height: '44px',
                background: bg,
                border: `1.5px solid ${color}55`,
                boxShadow: isHovered ? `0 0 0 2px ${color}` : 'none',
                transform: isHovered ? 'scale(1.08)' : 'scale(1)',
              }}
              title={`${c.name}: Leniency ${c.leniencyScore}`}
            >
              <div
                className="font-bold leading-tight text-center px-0.5 overflow-hidden max-w-full whitespace-nowrap text-ellipsis"
                style={{ fontSize: '0.58rem', color }}
              >
                {c.name.split(' ')[0]}
              </div>
              <div className="font-extrabold leading-none" style={{ fontSize: '0.65rem', color }}>
                {c.leniencyScore.toFixed(0)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 flex-wrap text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-1.5">
          <div
            className="w-8 h-2.5 rounded"
            style={{ background: 'linear-gradient(to right, hsl(120,70%,42%), hsl(60,70%,42%), hsl(0,70%,42%))' }}
          />
          <span>Strict → Lenient</span>
        </div>
        <span>· Sorted most lenient → strictest (left to right)</span>
      </div>
    </div>
  );
}
