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

export default function FloridaCountyHeatmap({ counties }: Props) {
  const [hovered, setHovered] = useState<FLCounty | null>(null);

  // Sort by leniency descending (most lenient first = red tiles first)
  const sorted = [...counties].sort((a, b) => b.leniencyScore - a.leniencyScore);

  return (
    <div>
      {/* Tooltip / hover info */}
      <div style={{
        minHeight: '3.5rem',
        marginBottom: '0.75rem',
        padding: '0.625rem 0.875rem',
        background: hovered ? leniencyBg(hovered.leniencyScore) : 'var(--bg-secondary)',
        border: `1px solid ${hovered ? leniencyColor(hovered.leniencyScore) + '55' : 'var(--border)'}`,
        borderRadius: '0.5rem',
        transition: 'all 0.15s',
      }}>
        {hovered ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: leniencyColor(hovered.leniencyScore) }}>{hovered.name} County</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Circuit {hovered.judicialCircuit} · Rank #{hovered.leniencyRank} of 67</div>
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              <Stat label="Leniency" val={hovered.leniencyScore.toFixed(1)} color={leniencyColor(hovered.leniencyScore)} />
              <Stat label="Prison Rate" val={`${(hovered.prisonRate * 100).toFixed(1)}%`} />
              <Stat label="Jail Rate" val={`${(hovered.jailRate * 100).toFixed(1)}%`} />
              <Stat label="Total Cases" val={hovered.totalCases.toLocaleString()} />
              <Stat label="Avg Felony Sentence" val={hovered.avgFelonySentenceDays ? `${Math.round(hovered.avgFelonySentenceDays)} days` : '—'} />
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Hover a county tile to see details · Red = most lenient · Green = toughest sentencing
          </p>
        )}
      </div>

      {/* Tile grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {sorted.map(c => {
          const color = leniencyColor(c.leniencyScore);
          const bg = leniencyBg(c.leniencyScore);

          return (
            <div
              key={c.slug}
              onMouseEnter={() => setHovered(c)}
              onMouseLeave={() => setHovered(null)}
              style={{
                width: '56px',
                height: '44px',
                background: bg,
                border: `1.5px solid ${color}55`,
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'default',
                transition: 'transform 0.1s, box-shadow 0.1s',
                boxShadow: hovered?.slug === c.slug ? `0 0 0 2px ${color}` : 'none',
                transform: hovered?.slug === c.slug ? 'scale(1.08)' : 'scale(1)',
                position: 'relative',
              }}
              title={`${c.name}: Leniency ${c.leniencyScore}`}
            >
              <div style={{
                fontSize: '0.58rem',
                fontWeight: 700,
                color,
                lineHeight: 1.1,
                textAlign: 'center',
                padding: '0 2px',
                overflow: 'hidden',
                maxWidth: '52px',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}>
                {c.name.split(' ')[0]}
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color, lineHeight: 1 }}>
                {c.leniencyScore.toFixed(0)}
              </div>

            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '32px', height: '10px', borderRadius: '3px', background: 'linear-gradient(to right, hsl(120,70%,42%), hsl(60,70%,42%), hsl(0,70%,42%))' }} />
          <span>Strict → Lenient</span>
        </div>

        <span>· Sorted most lenient → strictest (left to right)</span>
      </div>
    </div>
  );
}

function Stat({ label, val, color }: { label: string; val: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '1px' }}>{label}</div>
      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: color ?? 'var(--text-primary)' }}>{val}</div>
    </div>
  );
}
