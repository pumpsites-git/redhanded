import { ImageResponse } from 'next/og';
import {
  getStateJudgeBySlug,
  getLeniencyLabel,
  getLeniencyColor,
  getAllStateJudges,
  pct,
} from '@/lib/state-judges';

export const runtime = 'nodejs';
export const revalidate = 86400;

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export async function generateStaticParams() {
  const judges = getAllStateJudges();
  return judges.map((j) => ({ slug: j.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

// All divs in satori MUST have display: flex if they have >1 child.
// Use spans for text-only nodes.

export default async function OGImage({ params }: Props) {
  const { slug } = await params;
  const judge = getStateJudgeBySlug(slug);

  if (!judge) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: '#dc2626', fontSize: 48, fontWeight: 900 }}>
            Judge Not Found
          </span>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const color = getLeniencyColor(judge.leniencyScore);
  const label = getLeniencyLabel(judge.leniencyScore);

  const statItems = [
    { label: 'Prison Rate', value: pct(judge.prisonRate), color: '#dc2626' },
    { label: 'Probation Rate', value: pct(judge.probationRate), color: '#22c55e' },
    ...(judge.violentCases.total >= 5
      ? [{ label: 'Violent → Prison', value: pct(judge.violentCases.prisonRate), color: '#f97316' }]
      : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0d0d0d',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '28px 48px',
            borderBottom: '1px solid #1f1f1f',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#dc2626',
                display: 'flex',
              }}
            />
            <span style={{ fontSize: 22, fontWeight: 900, color: '#ffffff' }}>
              RedHanded
            </span>
          </div>
          <div style={{ display: 'flex', flex: 1 }} />
          <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 600 }}>
            Judicial Accountability
          </span>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, padding: '40px 48px', gap: 40 }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 12 }}>
            {/* County badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: 6,
                padding: '4px 12px',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: '#9ca3af',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                }}
              >
                {judge.stateCode} · {judge.county}
              </span>
            </div>

            {/* Name */}
            <div style={{ display: 'flex' }}>
              <span
                style={{
                  fontSize: 52,
                  fontWeight: 900,
                  color: '#f9fafb',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}
              >
                {judge.name}
              </span>
            </div>

            {/* Court */}
            <div style={{ display: 'flex' }}>
              <span style={{ fontSize: 18, color: '#6b7280' }}>
                {judge.courtFacility || `${judge.county} Court`} · {judge.totalCases.toLocaleString()} cases
              </span>
            </div>

            {/* Leniency label */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: 8,
                background: 'rgba(0,0,0,0.4)',
                border: `1.5px solid ${color}`,
                borderRadius: 8,
                padding: '8px 20px',
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 900, color }}>{label}</span>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              {statItems.map(({ label: l, value, color: c }) => (
                <div
                  key={l}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#161616',
                    border: '1px solid #252525',
                    borderRadius: 10,
                    padding: '12px 20px',
                    minWidth: 100,
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 28, fontWeight: 900, color: c }}>{value}</span>
                  <span style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Score circle */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              minWidth: 180,
            }}
          >
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: '50%',
                border: `8px solid ${color}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.5)',
              }}
            >
              <span style={{ fontSize: 56, fontWeight: 900, color, lineHeight: 1 }}>
                {judge.leniencyScore}
              </span>
            </div>
            <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 600 }}>
              Leniency Score
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            padding: '16px 48px',
            borderTop: '1px solid #1a1a1a',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 13, color: '#374151' }}>redhanded.vercel.app</span>
          <span style={{ fontSize: 13, color: '#374151' }}>
            FL DOC Sentencing Data · Public Record
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
