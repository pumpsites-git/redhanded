'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  getAllDistricts,
  getNationalAverages,
  sortDistrictsByMetric,
  type District,
  pct,
  months,
  getRecidivismColor,
  getBelowGuidelinesColor,
  getDangerousColor,
} from '@/lib/districts';

type Tab = 'worst' | 'lenient' | 'recidivism' | 'dangerous';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'worst', label: 'Worst Districts', icon: '🔴' },
  { id: 'lenient', label: 'Most Lenient', icon: '📉' },
  { id: 'recidivism', label: 'Highest Recidivism', icon: '🔄' },
  { id: 'dangerous', label: 'Most Dangerous', icon: '⚠️' },
];

const EXPLAINERS: Record<Tab, { title: string; body: string; metric: string }> = {
  worst: {
    title: 'How we define "Worst Districts"',
    body: 'This composite ranking weighs below-guidelines sentencing rate (40%), recidivism rate (35%), and high-criminal-history offender rate (25%). Districts scoring high across all three metrics represent the most systemic accountability failures.',
    metric: 'Composite Score',
  },
  lenient: {
    title: 'Why below-guidelines sentencing matters',
    body: 'When judges sentence below the USSC guidelines, defendants often serve far less time than the law recommends. While downward departures are sometimes appropriate, consistently high rates may signal leniency that fails crime victims and undermines deterrence. The national average is shown for comparison.',
    metric: 'Below-Guidelines Rate',
  },
  recidivism: {
    title: 'The recidivism crisis in federal courts',
    body: 'Recidivism—reoffending after release—is a direct measure of whether the justice system is protecting communities. Districts with high recidivism rates may be sentencing too lightly, failing to address root causes, or releasing individuals before rehabilitation is complete.',
    metric: 'Recidivism Rate (%)',
  },
  dangerous: {
    title: 'Criminal history & community safety',
    body: 'Category IV–VI offenders have extensive criminal histories (7+ prior points). A high concentration of such offenders signals that a district handles a disproportionate share of serious repeat criminals. Combined with sentencing leniency, this creates compounding public safety risks.',
    metric: 'High-Risk Offender Rate',
  },
};

function computeCompositeScore(d: District, nationalAvg: ReturnType<typeof getNationalAverages>): number {
  // Normalize each metric 0-100 (higher = worse)
  const belowScore = Math.min(d.belowGuidelinesRate * 100, 100) * 0.4;
  const recidScore = Math.min(d.recidivismRate / 50 * 100, 100) * 0.35;
  const dangerScore = Math.min(d.highCriminalHistoryRate * 100 / 0.5, 100) * 0.25;
  return belowScore + recidScore + dangerScore;
}

export default function RankingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('worst');
  const allDistricts = useMemo(() => getAllDistricts().filter(d => d.totalCases > 0), []);
  const nationalAvg = useMemo(() => getNationalAverages(), []);

  const ranked = useMemo(() => {
    switch (activeTab) {
      case 'worst':
        return [...allDistricts]
          .map(d => ({ district: d, score: computeCompositeScore(d, nationalAvg) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 25);
      case 'lenient':
        return sortDistrictsByMetric(allDistricts, 'belowGuidelines')
          .slice(0, 25)
          .map(d => ({ district: d, score: d.belowGuidelinesRate * 100 }));
      case 'recidivism':
        return sortDistrictsByMetric(allDistricts, 'recidivism')
          .slice(0, 25)
          .map(d => ({ district: d, score: d.recidivismRate }));
      case 'dangerous':
        return sortDistrictsByMetric(allDistricts, 'dangerous')
          .slice(0, 25)
          .map(d => ({ district: d, score: d.highCriminalHistoryRate * 100 }));
    }
  }, [activeTab, allDistricts, nationalAvg]);

  const explainer = EXPLAINERS[activeTab];
  const maxScore = ranked[0]?.score ?? 1;

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          padding: '1.5rem 1rem',
        }}
      >
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            📊 Accountability Rankings
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Federal districts ranked by judicial accountability metrics — USSC FY2025 data
          </p>
        </div>
      </header>

      <main style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginBottom: '1.5rem',
          }}
        >
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: activeTab === tab.id ? 700 : 500,
                background: activeTab === tab.id ? 'var(--red-primary)' : 'var(--bg-card)',
                color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${activeTab === tab.id ? 'var(--red-primary)' : 'var(--border)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Explainer box */}
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'rgba(220,38,38,0.06)',
            border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--red-primary)', marginBottom: '0.5rem' }}>
            ⚠️ Why This Matters: {explainer.title}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {explainer.body}
          </p>
        </div>

        {/* National context bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
          }}
        >
          <ContextStat label="National Below-Guide Avg" value={pct(nationalAvg.belowGuidelinesRate)} />
          <ContextStat label="National Recidivism Avg" value={`${nationalAvg.recidivismRate.toFixed(1)}%`} />
          <ContextStat label="National High-Risk Avg" value={pct(nationalAvg.highCriminalHistoryRate)} />
          <ContextStat label="National Avg Sentence" value={months(nationalAvg.avgSentenceMonths)} />
        </div>

        {/* Ranked list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {ranked.map(({ district: d, score }, i) => (
            <RankCard
              key={d.code}
              rank={i + 1}
              district={d}
              score={score}
              maxScore={maxScore}
              tab={activeTab}
              nationalAvg={nationalAvg}
            />
          ))}
        </div>

        {/* Footer note */}
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '0.75rem',
          }}
        >
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            📋 <strong>Methodology:</strong> Rankings derived from U.S. Sentencing Commission FY2025 data.
            Composite scores use weighted averages of sentencing leniency, recidivism, and offender risk profiles.
            This tool is for public accountability research only — it does not constitute legal advice.
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ContextStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{label}</div>
    </div>
  );
}

function RankCard({
  rank, district: d, score, maxScore, tab, nationalAvg,
}: {
  rank: number;
  district: District;
  score: number;
  maxScore: number;
  tab: Tab;
  nationalAvg: ReturnType<typeof getNationalAverages>;
}) {
  const barPct = (score / maxScore) * 100;

  // Determine badge colour
  const rankColor =
    rank <= 3 ? '#dc2626' :
    rank <= 10 ? '#ea580c' :
    rank <= 20 ? '#ca8a04' :
    '#6b7280';

  // Pick metric display
  const metricDisplay = (() => {
    switch (tab) {
      case 'worst': return { label: 'Composite Score', value: score.toFixed(1), color: '#dc2626' };
      case 'lenient': return { label: 'Below Guidelines', value: `${score.toFixed(1)}%`, color: getBelowGuidelinesColor(score / 100) };
      case 'recidivism': return { label: 'Recidivism Rate', value: `${score.toFixed(1)}%`, color: getRecidivismColor(score) };
      case 'dangerous': return { label: 'High-Risk Rate', value: `${score.toFixed(1)}%`, color: getDangerousColor(score / 100) };
    }
  })();

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--red-primary)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        {/* Rank badge */}
        <div
          style={{
            minWidth: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.5rem',
            background: rankColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1rem',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          #{rank}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            <div>
              <Link
                href={`/district/${d.code}`}
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                }}
              >
                {d.name}
              </Link>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                {d.state} · Circuit {d.circuit} · {d.totalCases.toLocaleString()} cases
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: metricDisplay.color }}>
                {metricDisplay.value}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{metricDisplay.label}</div>
            </div>
          </div>

          {/* Score bar */}
          <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-secondary)', overflow: 'hidden', marginBottom: '0.75rem' }}>
            <div
              style={{
                height: '100%',
                width: `${barPct}%`,
                background: rankColor,
                borderRadius: '3px',
                transition: 'width 0.4s',
              }}
            />
          </div>

          {/* Mini stats */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <MiniStat
              label="Below Guide."
              value={pct(d.belowGuidelinesRate)}
              color={getBelowGuidelinesColor(d.belowGuidelinesRate)}
              nationalVal={`${(nationalAvg.belowGuidelinesRate * 100).toFixed(1)}%`}
            />
            <MiniStat
              label="Recidivism"
              value={`${d.recidivismRate.toFixed(1)}%`}
              color={getRecidivismColor(d.recidivismRate)}
              nationalVal={`${nationalAvg.recidivismRate.toFixed(1)}%`}
            />
            <MiniStat
              label="High-Risk"
              value={pct(d.highCriminalHistoryRate)}
              color={getDangerousColor(d.highCriminalHistoryRate)}
              nationalVal={`${(nationalAvg.highCriminalHistoryRate * 100).toFixed(1)}%`}
            />
            <MiniStat
              label="Avg Sent."
              value={months(d.avgSentenceMonths)}
              nationalVal={months(nationalAvg.avgSentenceMonths)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label, value, color, nationalVal,
}: {
  label: string;
  value: string;
  color?: string;
  nationalVal?: string;
}) {
  return (
    <div
      style={{
        padding: '0.3rem 0.6rem',
        background: 'var(--bg-secondary)',
        borderRadius: '0.375rem',
        fontSize: '0.75rem',
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{label}: </span>
      <span style={{ color: color ?? 'var(--text-primary)', fontWeight: 700 }}>{value}</span>
      {nationalVal && (
        <span style={{ color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
          (nat: {nationalVal})
        </span>
      )}
    </div>
  );
}
