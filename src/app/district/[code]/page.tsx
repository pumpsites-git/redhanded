'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  getDistrictByCode,
  getNationalAverages,
  getTopOffenses,
  getCircuitName,
  pct,
  months,
  getRecidivismColor,
  getBelowGuidelinesColor,
  getDangerousColor,
} from '@/lib/districts';

const CRIMHIST_LABELS: Record<string, string> = {
  '1': 'Cat. I (0–1 pts)',
  '2': 'Cat. II (2–3 pts)',
  '3': 'Cat. III (4–6 pts)',
  '4': 'Cat. IV (7–9 pts)',
  '5': 'Cat. V (10–12 pts)',
  '6': 'Cat. VI (13+ pts)',
};

const CRIMHIST_COLORS = ['#16a34a', '#65a30d', '#ca8a04', '#ea580c', '#dc2626', '#7f1d1d'];

export default function DistrictPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const district = getDistrictByCode(code);
  const nationalAvg = getNationalAverages();

  if (!district) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</div>
          <p style={{ color: 'var(--text-secondary)' }}>District not found</p>
          <Link href="/districts" style={{ color: 'var(--red-primary)', marginTop: '0.5rem', display: 'inline-block' }}>
            ← Back to Districts
          </Link>
        </div>
      </div>
    );
  }

  const topOffenses = getTopOffenses(district.offenseTypes, 10);
  const maxOffenseCount = topOffenses[0]?.count ?? 1;

  // Criminal history totals
  const crimHistTotal = Object.values(district.crimhistDistribution).reduce((s, v) => s + v, 0) || 1;
  const crimHistEntries = Object.entries(district.crimhistDistribution).sort((a, b) => Number(a[0]) - Number(b[0]));

  // Race totals
  const raceTotal = Object.values(district.raceDistribution).reduce((s, v) => s + v, 0) || 1;
  const raceEntries = Object.entries(district.raceDistribution).sort((a, b) => b[1] - a[1]);

  // Gender totals
  const genderTotal = Object.values(district.genderDistribution).reduce((s, v) => s + v, 0) || 1;

  // Deltas vs national avg
  const sentenceDelta = district.avgSentenceMonths - nationalAvg.avgSentenceMonths;
  const belowGuideDelta = district.belowGuidelinesRate - nationalAvg.belowGuidelinesRate;
  const recidivismDelta = district.recidivismRate - nationalAvg.recidivismRate;
  const highRiskDelta = district.highCriminalHistoryRate - nationalAvg.highCriminalHistoryRate;

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '1rem 1rem' }}>
          <Link
            href="/districts"
            style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            ← Districts
          </Link>
        </div>
        <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '0.75rem 1rem 1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '1rem', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
                🏛️ {district.name}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Badge text={district.state} />
                <Badge text={getCircuitName(district.circuit)} />
                <Badge text={`USSC Code ${district.code}`} dim />
                <Badge text={`CourtListener: ${district.courtListenerId}`} dim />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {district.totalCases.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>FY2025 Cases</div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Stat cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <StatCard
            label="Avg Sentence"
            value={months(district.avgSentenceMonths)}
            sub={`National: ${months(nationalAvg.avgSentenceMonths)}`}
            delta={sentenceDelta}
            deltaUnit="mo"
            icon="⏱️"
          />
          <StatCard
            label="Below Guidelines"
            value={pct(district.belowGuidelinesRate)}
            sub={`National: ${pct(nationalAvg.belowGuidelinesRate)}`}
            delta={belowGuideDelta * 100}
            deltaUnit="%"
            icon="📉"
            valueColor={getBelowGuidelinesColor(district.belowGuidelinesRate)}
            higherIsBad
          />
          <StatCard
            label="Recidivism Rate"
            value={`${district.recidivismRate.toFixed(1)}%`}
            sub={`National: ${nationalAvg.recidivismRate.toFixed(1)}%`}
            delta={recidivismDelta}
            deltaUnit="%"
            icon="🔄"
            valueColor={getRecidivismColor(district.recidivismRate)}
            higherIsBad
          />
          <StatCard
            label="High-Risk Offenders"
            value={pct(district.highCriminalHistoryRate)}
            sub={`National: ${pct(nationalAvg.highCriminalHistoryRate)}`}
            delta={highRiskDelta * 100}
            deltaUnit="%"
            icon="⚠️"
            valueColor={getDangerousColor(district.highCriminalHistoryRate)}
            higherIsBad
          />
          <StatCard
            label="Avg Crim History"
            value={district.avgCriminalHistoryPoints.toFixed(1) + ' pts'}
            sub={`National: ${nationalAvg.avgCriminalHistoryPoints.toFixed(1)} pts`}
            delta={district.avgCriminalHistoryPoints - nationalAvg.avgCriminalHistoryPoints}
            deltaUnit=" pts"
            icon="📊"
            higherIsBad
          />
          <StatCard
            label="First Offenders"
            value={pct(district.pctFirstOffenders)}
            sub="Category I (0–1 pts)"
            icon="🟢"
            valueColor="#16a34a"
          />
        </div>

        {/* Comparison to national */}
        <Section title="📊 vs. National Averages">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            <CompareBar
              label="Below Guidelines"
              districtVal={district.belowGuidelinesRate * 100}
              nationalVal={nationalAvg.belowGuidelinesRate * 100}
              unit="%"
              higherIsBad
            />
            <CompareBar
              label="Recidivism Rate"
              districtVal={district.recidivismRate}
              nationalVal={nationalAvg.recidivismRate}
              unit="%"
              higherIsBad
            />
            <CompareBar
              label="High-Risk Offenders"
              districtVal={district.highCriminalHistoryRate * 100}
              nationalVal={nationalAvg.highCriminalHistoryRate * 100}
              unit="%"
              higherIsBad
            />
            <CompareBar
              label="Avg Sentence"
              districtVal={district.avgSentenceMonths}
              nationalVal={nationalAvg.avgSentenceMonths}
              unit=" mo"
              higherIsBad={false}
            />
          </div>
        </Section>

        {/* Offense types */}
        <Section title="⚖️ Offense Type Breakdown">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {topOffenses.map(off => (
              <div key={off.key}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    marginBottom: '0.25rem',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>{off.label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {off.count} ({((off.count / district.totalCases) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div
                  style={{
                    height: '8px',
                    borderRadius: '4px',
                    background: 'var(--bg-secondary)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(off.count / maxOffenseCount) * 100}%`,
                      background: off.color,
                      borderRadius: '4px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Criminal history distribution */}
        <Section title="🗂️ Criminal History Distribution">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {crimHistEntries.map(([cat, count], i) => {
              const pctVal = (count / crimHistTotal) * 100;
              return (
                <div key={cat}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {CRIMHIST_LABELS[cat] ?? `Category ${cat}`}
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {count} ({pctVal.toFixed(1)}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      borderRadius: '4px',
                      background: 'var(--bg-secondary)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pctVal}%`,
                        background: CRIMHIST_COLORS[i] ?? '#6b7280',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              marginTop: '1rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
            }}
          >
            <InfoBox
              label="High Criminal History (Cat IV–VI)"
              value={pct(district.highCriminalHistoryRate)}
              color={getDangerousColor(district.highCriminalHistoryRate)}
            />
            <InfoBox
              label="Category VI (Most Severe)"
              value={pct(district.categoryViRate)}
              color="#dc2626"
            />
          </div>
        </Section>

        {/* Demographics */}
        <Section title="👥 Demographics">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Race / Ethnicity
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {raceEntries.map(([race, count]) => {
                  const pctVal = (count / raceTotal) * 100;
                  const label = race.charAt(0).toUpperCase() + race.slice(1).replace('_', ' ');
                  return (
                    <div key={race}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.8rem',
                          marginBottom: '0.2rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <span>{label}</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {pctVal.toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pctVal}%`,
                            background: '#6b7280',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Gender
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(district.genderDistribution)
                  .filter(([k]) => k !== 'unknown')
                  .sort((a, b) => b[1] - a[1])
                  .map(([gender, count]) => {
                    const pctVal = (count / genderTotal) * 100;
                    const label = gender.charAt(0).toUpperCase() + gender.slice(1);
                    return (
                      <div key={gender}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.8rem',
                            marginBottom: '0.2rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <span>{label}</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            {pctVal.toFixed(1)}%
                          </span>
                        </div>
                        <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${pctVal}%`,
                              background: gender === 'male' ? '#3b82f6' : '#ec4899',
                              borderRadius: '3px',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Avg Offender Age
                </h3>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {district.avgAge.toFixed(1)}
                  <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.3rem' }}>yrs</span>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Judges in district */}
        <Section title="⚖️ Judges in This District">
          <div
            style={{
              padding: '1.5rem',
              background: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              textAlign: 'center',
            }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Search for judges in <strong>{district.name}</strong> on the main judge database.
            </p>
            <Link
              href={`/?state=${district.state}`}
              style={{
                display: 'inline-block',
                marginTop: '0.75rem',
                padding: '0.6rem 1.25rem',
                background: 'var(--red-primary)',
                color: '#fff',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              Browse {district.state} Judges →
            </Link>
          </div>
        </Section>

        {/* Data note */}
        <div
          style={{
            padding: '1rem',
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '0.75rem',
            marginTop: '1rem',
          }}
        >
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            📋 <strong>Data Source:</strong> U.S. Sentencing Commission FY2025 Annual Sourcebook.
            Sentencing guidelines data reflects primary offense categories. Recidivism tracking covers 8-year follow-up periods.
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Badge({ text, dim }: { text: string; dim?: boolean }) {
  return (
    <span
      style={{
        padding: '0.25rem 0.625rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 500,
        background: 'var(--bg-card)',
        color: dim ? 'var(--text-muted)' : 'var(--text-secondary)',
        border: '1px solid var(--border)',
      }}
    >
      {text}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        marginBottom: '1.25rem',
      }}
    >
      <h2
        style={{
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '1rem',
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function StatCard({
  label, value, sub, delta, deltaUnit, icon, valueColor, higherIsBad,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  deltaUnit?: string;
  icon: string;
  valueColor?: string;
  higherIsBad?: boolean;
}) {
  const showDelta = delta !== undefined && !isNaN(delta);
  const isPositive = (delta ?? 0) > 0;
  const isBad = higherIsBad ? isPositive : !isPositive;
  const deltaColor = isBad ? '#ef4444' : '#22c55e';
  const sign = isPositive ? '+' : '';

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1rem',
      }}
    >
      <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: valueColor ?? 'var(--text-primary)',
          marginBottom: '0.25rem',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sub}</div>}
      {showDelta && (
        <div style={{ fontSize: '0.7rem', color: deltaColor, marginTop: '0.25rem', fontWeight: 600 }}>
          {sign}{(delta ?? 0).toFixed(1)}{deltaUnit} vs national
        </div>
      )}
    </div>
  );
}

function CompareBar({
  label, districtVal, nationalVal, unit, higherIsBad,
}: {
  label: string;
  districtVal: number;
  nationalVal: number;
  unit: string;
  higherIsBad: boolean;
}) {
  const maxVal = Math.max(districtVal, nationalVal) * 1.2 || 1;
  const delta = districtVal - nationalVal;
  const isBad = higherIsBad ? delta > 0 : delta < 0;
  const deltaColor = isBad ? '#ef4444' : '#22c55e';
  const sign = delta > 0 ? '+' : '';

  return (
    <div
      style={{
        padding: '0.75rem',
        background: 'var(--bg-secondary)',
        borderRadius: '0.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          marginBottom: '0.5rem',
        }}
      >
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ color: deltaColor, fontWeight: 600 }}>
          {sign}{delta.toFixed(1)}{unit}
        </span>
      </div>
      {/* District bar */}
      <div style={{ marginBottom: '0.35rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
          <span>This District</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{districtVal.toFixed(1)}{unit}</span>
        </div>
        <div style={{ height: '7px', borderRadius: '4px', background: 'var(--border)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${(districtVal / maxVal) * 100}%`,
              background: isBad ? '#ef4444' : '#22c55e',
              borderRadius: '4px',
              transition: 'width 0.4s',
            }}
          />
        </div>
      </div>
      {/* National bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
          <span>National Avg</span>
          <span>{nationalVal.toFixed(1)}{unit}</span>
        </div>
        <div style={{ height: '7px', borderRadius: '4px', background: 'var(--border)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${(nationalVal / maxVal) * 100}%`,
              background: '#6b7280',
              borderRadius: '4px',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        padding: '0.75rem',
        background: 'var(--bg-secondary)',
        borderRadius: '0.5rem',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{label}</div>
    </div>
  );
}
