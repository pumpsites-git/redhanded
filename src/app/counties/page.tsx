import type { Metadata } from 'next';
import Link from 'next/link';
import countyProfilesRaw from '../../../data/master/county-profiles.json';

export const metadata: Metadata = {
  title: 'Florida County Report Cards — A-F Grades | RedHanded',
  description:
    'County-level sentencing grades for all 66 Florida counties. See which counties are strict or lenient on violent crime, and how your county stacks up.',
  openGraph: {
    title: 'Florida County Report Cards — RedHanded',
    description:
      'A-F grades for all 66 FL counties based on prison rates, mitigated departures, and violent crime sentencing.',
  },
};

interface CountyProfile {
  name: string;
  slug: string;
  state: string;
  stateCode: string;
  totalCases: number;
  prisonCount: number;
  jailCount: number;
  probationCount: number;
  prisonRate: number;
  jailRate: number;
  probationRate: number;
  otherRate: number;
  pleaBargainRate: number;
  mitigatedDepartureRate: number;
  avgCommitmentDays: number | null;
  avgSentencePoints: number;
  vsStatePrisonRate: number;
  vsStateProbRate: number;
  dataSource: string;
}

interface StateAverage {
  prisonRate: number;
  jailRate: number;
  probationRate: number;
  pleaBargainRate: number;
  mitigatedDepartureRate: number;
  avgCommitmentDays: number;
  avgSentencePoints: number;
  totalCases: number;
}

interface CountyProfilesData {
  meta: {
    generated: string;
    sources: string[];
    totalCounties: number;
    totalCases: number;
    pipelineVersion: string;
  };
  stateAverage: StateAverage;
  counties: Record<string, CountyProfile>;
}

const profilesData = countyProfilesRaw as CountyProfilesData;
const stateAvg = profilesData.stateAverage;

/**
 * Grade a county A–F based on:
 * - Prison rate vs state average (higher = stricter = better)
 * - Mitigated departure rate vs state average (lower = fewer departures = stricter)
 * - Probation rate vs state average (lower = stricter = better)
 *
 * Score from 0–100 then map to letter grade.
 */
function gradeCounty(county: CountyProfile): { grade: string; score: number; color: string } {
  // Prison rate component (40%): higher prison rate = stricter
  const prisonDelta = county.prisonRate - stateAvg.prisonRate;
  const prisonScore = 50 + (prisonDelta / 0.15) * 50; // ±15pp maps to ±50 pts

  // Mitigated departure component (35%): lower departure rate = stricter
  const mdrDelta = stateAvg.mitigatedDepartureRate - county.mitigatedDepartureRate;
  const mdrScore = 50 + (mdrDelta / 0.04) * 50; // ±4pp maps to ±50 pts

  // Probation rate component (25%): lower probation = stricter
  const probDelta = stateAvg.probationRate - county.probationRate;
  const probScore = 50 + (probDelta / 0.15) * 50;

  const raw = prisonScore * 0.40 + mdrScore * 0.35 + probScore * 0.25;
  const score = Math.max(0, Math.min(100, raw));

  let grade: string;
  let color: string;
  if (score >= 80) { grade = 'A'; color = '#22c55e'; }
  else if (score >= 65) { grade = 'B'; color = '#84cc16'; }
  else if (score >= 50) { grade = 'C'; color = '#eab308'; }
  else if (score >= 35) { grade = 'D'; color = '#f97316'; }
  else { grade = 'F'; color = '#dc2626'; }

  return { grade, score: Math.round(score), color };
}

function pct(r: number) {
  return `${Math.round(r * 100)}%`;
}

export default function CountiesPage() {
  const counties = Object.values(profilesData.counties as Record<string, CountyProfile>).filter(
    (c) => c.totalCases >= 100
  );

  const graded = counties
    .map((c) => ({ ...c, ...gradeCounty(c) }))
    .sort((a, b) => b.score - a.score);

  const gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  graded.forEach((c) => {
    gradeCounts[c.grade as keyof typeof gradeCounts]++;
  });

  const topStrict = graded.slice(0, 5);
  const topLenient = [...graded].sort((a, b) => a.score - b.score).slice(0, 5);

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-4 py-3">
        <div className="max-w-6xl mx-auto text-xs text-[var(--text-muted)]">
          <Link href="/" className="hover:text-[var(--text-primary)] no-underline">Home</Link>
          {' › '}
          <span className="text-[var(--text-primary)]">County Report Cards</span>
        </div>
      </div>

      {/* Hero */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            Florida County <span className="text-[var(--red-primary)]">Report Cards</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm sm:text-base max-w-xl leading-relaxed mb-6">
            A–F grades for all 66 Florida counties based on prison rates, mitigated sentencing
            departures, and overall leniency — compared to the state average.
          </p>

          {/* Grade distribution */}
          <div className="flex flex-wrap gap-3">
            {Object.entries(gradeCounts).map(([g, count]) => {
              const colors: Record<string, string> = {
                A: '#22c55e', B: '#84cc16', C: '#eab308', D: '#f97316', F: '#dc2626',
              };
              return (
                <div
                  key={g}
                  className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-3 text-center min-w-[70px]"
                >
                  <div className="text-3xl font-black" style={{ color: colors[g] }}>{g}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">{count} counties</div>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Methodology callout */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4 text-sm text-[var(--text-secondary)] leading-relaxed">
          <strong className="text-[var(--text-primary)]">Grading Methodology:</strong>{' '}
          County grades weigh prison rate (40%), mitigated departure rate (35%), and probation rate (25%)
          vs. Florida state averages. State avg: {pct(stateAvg.prisonRate)} prison ·{' '}
          {pct(stateAvg.probationRate)} probation · {pct(stateAvg.mitigatedDepartureRate)} mitigated departures.
          {' '}<Link href="/methodology" className="text-[var(--red-primary)] hover:underline no-underline">Full methodology →</Link>
        </div>

        {/* Spotlight row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strictest counties */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
            <h2 className="font-bold text-base mb-3 text-[var(--text-primary)]">
              ✅ Strictest Counties
            </h2>
            <div className="space-y-2">
              {topStrict.map((c) => (
                <div key={c.slug} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold text-[var(--text-primary)]">{c.name}</span>
                    <span className="text-[var(--text-muted)] ml-2 text-xs">{c.totalCases.toLocaleString()} cases</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">{pct(c.prisonRate)} prison</span>
                    <span
                      className="text-lg font-black w-8 text-right"
                      style={{ color: c.color }}
                    >
                      {c.grade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Most lenient counties */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
            <h2 className="font-bold text-base mb-3 text-[var(--text-primary)]">
              ⚠️ Most Lenient Counties
            </h2>
            <div className="space-y-2">
              {topLenient.map((c) => (
                <div key={c.slug} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold text-[var(--text-primary)]">{c.name}</span>
                    <span className="text-[var(--text-muted)] ml-2 text-xs">{c.totalCases.toLocaleString()} cases</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">{pct(c.prisonRate)} prison</span>
                    <span
                      className="text-lg font-black w-8 text-right"
                      style={{ color: c.color }}
                    >
                      {c.grade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Full table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="font-bold text-[var(--text-primary)]">All Florida Counties</h2>
            <span className="text-xs text-[var(--text-muted)]">{graded.length} counties · {profilesData.meta.totalCases.toLocaleString()} total cases</span>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-[var(--border)]">
            {graded.map((c) => (
              <div key={c.slug} className="px-4 py-4 flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black shrink-0"
                  style={{ background: `${c.color}18`, border: `2px solid ${c.color}55`, color: c.color }}
                >
                  {c.grade}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[var(--text-primary)] text-sm">{c.name} County</div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">{c.totalCases.toLocaleString()} cases</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                    <span className="text-red-400">Prison: {pct(c.prisonRate)}</span>
                    <span className="text-green-400">Probation: {pct(c.probationRate)}</span>
                    <span className="text-orange-400">Departed: {pct(c.mitigatedDepartureRate)}</span>
                  </div>
                </div>
                <div className="text-xs text-right text-[var(--text-muted)] shrink-0">
                  Score: {c.score}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)] font-semibold">
                  <th className="px-4 py-3 text-left">Grade</th>
                  <th className="px-4 py-3 text-left">County</th>
                  <th className="px-4 py-3 text-right">Cases</th>
                  <th className="px-4 py-3 text-right">Prison Rate</th>
                  <th className="px-4 py-3 text-right">Probation Rate</th>
                  <th className="px-4 py-3 text-right">Mitigated Dep.</th>
                  <th className="px-4 py-3 text-right">Avg Points</th>
                  <th className="px-4 py-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {graded.map((c, i) => (
                  <tr
                    key={c.slug}
                    className={`border-b border-[var(--border)] ${i % 2 !== 0 ? 'bg-white/[0.01]' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-xl font-black"
                        style={{ background: `${c.color}18`, border: `1.5px solid ${c.color}55`, color: c.color }}
                      >
                        {c.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-sm text-[var(--text-primary)]">{c.name}</div>
                      <div className="text-[0.65rem] text-[var(--text-muted)]">Florida</div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-[var(--text-secondary)]">
                      {c.totalCases.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold" style={{ color: c.prisonRate >= stateAvg.prisonRate ? '#22c55e' : '#f97316' }}>
                      {pct(c.prisonRate)}
                      <div className="text-[0.6rem] font-normal text-[var(--text-muted)]">
                        {c.prisonRate >= stateAvg.prisonRate ? '+' : ''}{pct(c.prisonRate - stateAvg.prisonRate)} vs avg
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold" style={{ color: c.probationRate <= stateAvg.probationRate ? '#22c55e' : '#dc2626' }}>
                      {pct(c.probationRate)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold" style={{ color: c.mitigatedDepartureRate <= stateAvg.mitigatedDepartureRate ? '#22c55e' : '#f97316' }}>
                      {pct(c.mitigatedDepartureRate)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-[var(--text-secondary)]">
                      {c.avgSentencePoints?.toFixed(0) ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-sm" style={{ color: c.color }}>{c.score}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* State average reference */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4">
          <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-3">Florida State Averages</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Prison Rate', value: pct(stateAvg.prisonRate), color: '#dc2626' },
              { label: 'Probation Rate', value: pct(stateAvg.probationRate), color: '#22c55e' },
              { label: 'Mitigated Dep.', value: pct(stateAvg.mitigatedDepartureRate), color: '#f97316' },
              { label: 'Plea Bargain', value: pct(stateAvg.pleaBargainRate), color: '#6b7280' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[var(--bg-secondary)] rounded-lg p-3">
                <div className="text-lg font-bold" style={{ color }}>{value}</div>
                <div className="text-xs text-[var(--text-muted)]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
