'use client';

import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getStateByCode,
  getStateNationalAverages,
  computeStateScore,
  getScoreGrade,
  STATE_FLAGS,
  pct,
  months,
  type StateStats,
} from '@/lib/states';
import {
  getTopOffenses,
  getOffenseColor,
  OFFENSE_LABELS,
  getCircuitName,
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

export default function StatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const state = getStateByCode(code);
  const nat = getStateNationalAverages();

  if (!state || state.totalCases === 0) {
    notFound();
  }

  const score = computeStateScore(state, nat);
  const grade = getScoreGrade(score);
  const flag = STATE_FLAGS[state.stateCode] ?? '🗺️';

  const topOffenses = getTopOffenses(state.offenseTypes, 10);
  const maxOffenseCount = topOffenses[0]?.count ?? 1;

  // Criminal history
  const crimHistTotal = Object.values(state.crimhistDistribution).reduce((s, v) => s + v, 0) || 1;
  const crimHistEntries = Object.entries(state.crimhistDistribution).sort((a, b) => Number(a[0]) - Number(b[0]));

  // Race
  const raceTotal = Object.values(state.raceDistribution).reduce((s, v) => s + v, 0) || 1;
  const raceEntries = Object.entries(state.raceDistribution).sort((a, b) => b[1] - a[1]);

  // Gender
  const genderTotal = Object.values(state.genderDistribution).reduce((s, v) => s + v, 0) || 1;

  // Deltas vs national
  const sentenceDelta = state.avgSentenceMonths - nat.avgSentenceMonths;
  const belowGuideDelta = state.belowGuidelinesRate - nat.belowGuidelinesRate;
  const recidivismDelta = state.recidivismRate - nat.recidivismRate;
  const highRiskDelta = state.highCriminalHistoryRate - nat.highCriminalHistoryRate;

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '1rem 1rem 0' }}>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <Link href="/states" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>← States</Link>
          </div>
        </div>
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '1rem 1rem 1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '1rem', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '2rem' }}>{flag}</span>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {state.stateName}
                </h1>
                {/* Grade circle */}
                <div style={{
                  width: '2.75rem', height: '2.75rem', borderRadius: '50%',
                  background: grade.color + '22', border: `2px solid ${grade.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '1.1rem', color: grade.color,
                }}>
                  {grade.grade}
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <Badge text={`${state.districtCount} Federal District${state.districtCount !== 1 ? 's' : ''}`} />
                <Badge text={`${state.totalCases.toLocaleString()} Cases`} />
                <Badge text={state.stateCode} dim />
                <Badge text={grade.label} color={grade.color} />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {state.totalCases.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>FY2025 Cases</div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '64rem', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* Key stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard
            label="Avg Sentence"
            value={months(state.avgSentenceMonths)}
            icon="⏱️"
            delta={sentenceDelta}
            deltaUnit=" mo"
            higherIsBad={false}
          />
          <StatCard
            label="Below Guidelines"
            value={pct(state.belowGuidelinesRate)}
            icon="📉"
            delta={belowGuideDelta * 100}
            deltaUnit="pp"
            higherIsBad={true}
            valueColor={state.belowGuidelinesRate > 0.55 ? '#ef4444' : state.belowGuidelinesRate > 0.4 ? '#ca8a04' : '#16a34a'}
          />
          <StatCard
            label="Recidivism Rate"
            value={`${state.recidivismRate.toFixed(1)}%`}
            icon="🔄"
            delta={recidivismDelta}
            deltaUnit="%"
            higherIsBad={true}
            valueColor={state.recidivismRate > 18 ? '#ef4444' : state.recidivismRate > 12 ? '#ca8a04' : '#16a34a'}
          />
          <StatCard
            label="High-Risk Offenders"
            value={pct(state.highCriminalHistoryRate)}
            icon="⚠️"
            delta={highRiskDelta * 100}
            deltaUnit="pp"
            higherIsBad={true}
            valueColor={state.highCriminalHistoryRate > 0.35 ? '#ef4444' : state.highCriminalHistoryRate > 0.25 ? '#ca8a04' : '#16a34a'}
          />
          <StatCard
            label="Avg Criminal Hist. Pts"
            value={state.avgCriminalHistoryPoints.toFixed(1)}
            icon="📊"
          />
          <StatCard
            label="Avg Offender Age"
            value={`${state.avgAge.toFixed(0)} yrs`}
            icon="👤"
          />
        </div>

        {/* Districts in this state */}
        <Section title={`🏛️ Federal Districts in ${state.stateName}`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {state.districts.map(dist => (
              <Link
                key={dist.code}
                href={`/district/${dist.code}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="judge-card"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: '0.625rem',
                    padding: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--red-primary)', marginBottom: '0.375rem' }}>
                    {dist.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cases</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {dist.totalCases.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Circuit</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {getCircuitName(dist.circuit)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CourtListener</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {dist.courtListenerId}
                    </span>
                  </div>
                  {/* Case share bar */}
                  <div style={{ marginTop: '0.6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                      <span>Share of state cases</span>
                      <span>{state.totalCases > 0 ? ((dist.totalCases / state.totalCases) * 100).toFixed(0) : 0}%</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${state.totalCases > 0 ? (dist.totalCases / state.totalCases) * 100 : 0}%`,
                        background: 'var(--red-primary)',
                        borderRadius: '2px',
                      }} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Section>

        {/* Side-by-side district comparison (if multiple) */}
        {state.districts.length > 1 && (
          <Section title="📊 District Comparison">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '520px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <Th>District</Th>
                    <Th>Cases</Th>
                    <Th>Share</Th>
                    <Th>Crim. Hist.</Th>
                    <Th>CourtListener</Th>
                  </tr>
                </thead>
                <tbody>
                  {[...state.districts].sort((a, b) => b.totalCases - a.totalCases).map(dist => (
                    <tr key={dist.code} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <Link href={`/district/${dist.code}`} style={{ color: 'var(--red-primary)', textDecoration: 'none', fontWeight: 500 }}>
                          {dist.name}
                        </Link>
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-primary)' }}>
                        {dist.totalCases.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', minWidth: '100px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${state.totalCases > 0 ? (dist.totalCases / state.totalCases) * 100 : 0}%`,
                              background: 'var(--red-primary)',
                              borderRadius: '3px',
                            }} />
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '32px' }}>
                            {state.totalCases > 0 ? ((dist.totalCases / state.totalCases) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)' }}>
                        {getCircuitName(dist.circuit)}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {dist.courtListenerId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* National comparison */}
        <Section title="📈 Comparison to National Average">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
            <CompareBar
              label="Avg Sentence (months)"
              stateVal={state.avgSentenceMonths}
              nationalVal={nat.avgSentenceMonths}
              unit=" mo"
              higherIsBad={false}
            />
            <CompareBar
              label="Below Guidelines Rate"
              stateVal={state.belowGuidelinesRate * 100}
              nationalVal={nat.belowGuidelinesRate * 100}
              unit="%"
              higherIsBad={true}
            />
            <CompareBar
              label="Recidivism Rate"
              stateVal={state.recidivismRate}
              nationalVal={nat.recidivismRate}
              unit="%"
              higherIsBad={true}
            />
            <CompareBar
              label="High-Risk Offenders"
              stateVal={state.highCriminalHistoryRate * 100}
              nationalVal={nat.highCriminalHistoryRate * 100}
              unit="%"
              higherIsBad={true}
            />
          </div>
        </Section>

        {/* Offense breakdown */}
        {topOffenses.length > 0 && (
          <Section title="⚖️ Offense Type Breakdown">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {topOffenses.map(({ key, label, count, color }) => {
                const barPct = (count / maxOffenseCount) * 100;
                const totalPct = ((count / state.totalCases) * 100).toFixed(1);
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ width: '160px', fontSize: '0.8rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                      {label}
                    </span>
                    <div style={{ flex: 1, height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${barPct}%`,
                          background: color,
                          borderRadius: '4px',
                          transition: 'width 0.4s',
                        }}
                      />
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {count.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>
                        ({totalPct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Criminal history distribution */}
        {crimHistEntries.length > 0 && (
          <Section title="📋 Criminal History Distribution">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
              {crimHistEntries.map(([cat, count], i) => {
                const catNum = Number(cat) - 1;
                const share = (count / crimHistTotal) * 100;
                const color = CRIMHIST_COLORS[Math.min(catNum, CRIMHIST_COLORS.length - 1)];
                return (
                  <div key={cat} style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {CRIMHIST_LABELS[cat] ?? `Category ${cat}`}
                      </span>
                      <span style={{ fontSize: '0.8rem', color, fontWeight: 600 }}>
                        {share.toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${share}%`, background: color, borderRadius: '3px' }} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {count.toLocaleString()} offenders
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>High Crim. History (IV–VI)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: state.highCriminalHistoryRate > 0.3 ? '#ef4444' : '#ca8a04' }}>
                  {pct(state.highCriminalHistoryRate)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Category VI</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#dc2626' }}>
                  {pct(state.categoryViRate)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Avg Crim. History Points</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {state.avgCriminalHistoryPoints.toFixed(1)}
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* Demographics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
          {/* Race */}
          {raceEntries.length > 0 && (
            <Section title="👥 Race / Ethnicity">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {raceEntries.map(([race, count]) => {
                  const share = (count / raceTotal) * 100;
                  const label = race.charAt(0).toUpperCase() + race.slice(1).replace(/_/g, ' ');
                  return (
                    <div key={race}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {count.toLocaleString()} ({share.toFixed(1)}%)
                        </span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${share}%`, background: '#3b82f6', borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Gender */}
          {Object.keys(state.genderDistribution).length > 0 && (
            <Section title="⚤ Gender Distribution">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                {Object.entries(state.genderDistribution).map(([gender, count]) => {
                  const share = (count / genderTotal) * 100;
                  const label = gender.charAt(0).toUpperCase() + gender.slice(1);
                  const color = gender === 'male' ? '#3b82f6' : '#ec4899';
                  return (
                    <div key={gender} style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{share.toFixed(0)}%</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{count.toLocaleString()} cases</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ height: '12px', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                {Object.entries(state.genderDistribution).map(([gender, count]) => {
                  const share = (count / genderTotal) * 100;
                  const color = gender === 'male' ? '#3b82f6' : '#ec4899';
                  return (
                    <div key={gender} style={{ width: `${share}%`, background: color }} />
                  );
                })}
              </div>
            </Section>
          )}
        </div>

        {/* Recidivism summary */}
        <Section title="🔄 Repeat Offenders">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <InfoBox label="Repeat Offenders" value={state.totalRepeatOffenders.toLocaleString()}
              color={state.recidivismRate > 15 ? '#ef4444' : '#ca8a04'} />
            <InfoBox label="Recidivism Rate" value={`${state.recidivismRate.toFixed(1)}%`}
              color={state.recidivismRate > 18 ? '#ef4444' : state.recidivismRate > 12 ? '#ca8a04' : '#16a34a'} />
            <InfoBox label="vs National Avg" value={`${recidivismDelta >= 0 ? '+' : ''}${recidivismDelta.toFixed(1)}%`}
              color={recidivismDelta > 0 ? '#ef4444' : '#16a34a'} />
            <InfoBox label="Total Cases" value={state.totalCases.toLocaleString()} color="var(--text-primary)" />
          </div>
        </Section>

        {/* Data note */}
        <div style={{ padding: '1rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '0.75rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            📋 <strong>Data Source:</strong> U.S. Sentencing Commission, FY2025 Annual Sourcebook.
            State data is aggregated from {state.districtCount} federal district{state.districtCount !== 1 ? 's' : ''} using weighted averages by case volume.
            Composite grade reflects below-guidelines rate, recidivism, and high-risk offender concentration.
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Badge({ text, dim, color }: { text: string; dim?: boolean; color?: string }) {
  return (
    <span style={{
      padding: '0.25rem 0.625rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 500,
      background: color ? color + '22' : 'var(--bg-card)',
      color: color ?? (dim ? 'var(--text-muted)' : 'var(--text-secondary)'),
      border: `1px solid ${color ? color + '44' : 'var(--border)'}`,
    }}>
      {text}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.25rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function StatCard({
  label, value, icon, delta, deltaUnit, valueColor, higherIsBad,
}: {
  label: string;
  value: string;
  icon: string;
  delta?: number;
  deltaUnit?: string;
  valueColor?: string;
  higherIsBad?: boolean;
}) {
  const showDelta = delta !== undefined && !isNaN(delta);
  const isPositive = (delta ?? 0) > 0;
  const isBad = higherIsBad ? isPositive : !isPositive;
  const deltaColor = isBad ? '#ef4444' : '#22c55e';
  const sign = isPositive ? '+' : '';

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem' }}>
      <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: valueColor ?? 'var(--text-primary)', marginBottom: '0.25rem' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{label}</div>
      {showDelta && (
        <div style={{ fontSize: '0.7rem', color: deltaColor, fontWeight: 600 }}>
          {sign}{(delta ?? 0).toFixed(1)}{deltaUnit} vs national
        </div>
      )}
    </div>
  );
}

function CompareBar({
  label, stateVal, nationalVal, unit, higherIsBad,
}: {
  label: string;
  stateVal: number;
  nationalVal: number;
  unit: string;
  higherIsBad: boolean;
}) {
  const maxVal = Math.max(stateVal, nationalVal) * 1.25 || 1;
  const delta = stateVal - nationalVal;
  const isBad = higherIsBad ? delta > 0 : delta < 0;
  const deltaColor = isBad ? '#ef4444' : '#22c55e';
  const sign = delta > 0 ? '+' : '';

  return (
    <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ color: deltaColor, fontWeight: 600 }}>
          {sign}{Math.abs(delta).toFixed(1)}{unit}
        </span>
      </div>
      {[
        { name: 'This State', val: stateVal, color: isBad ? '#ef4444' : '#22c55e' },
        { name: 'National Avg', val: nationalVal, color: '#6b7280' },
      ].map(({ name, val, color }) => (
        <div key={name} style={{ marginBottom: '0.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            <span>{name}</span>
            <span style={{ color: name === 'This State' ? 'var(--text-primary)' : undefined, fontWeight: name === 'This State' ? 600 : 400 }}>
              {val.toFixed(1)}{unit}
            </span>
          </div>
          <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(val / maxVal) * 100}%`, background: color, borderRadius: '3px', transition: 'width 0.4s' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', textAlign: 'center' }}>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{label}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, background: 'var(--bg-secondary)', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  );
}
