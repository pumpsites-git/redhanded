import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getAllStateJudges,
  getStateJudgeBySlug,
  getCourtAverage,
  getJudgeProfilesMeta,
  getLeniencyLabel,
  getLeniencyColor,
  pct,
} from '@/lib/state-judges';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const judges = getAllStateJudges();
  return judges.map((j) => ({ slug: j.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const judge = getStateJudgeBySlug(slug);
  if (!judge) return {};
  return {
    title: `${judge.name} — Judicial Profile`,
    description: `${judge.name} (${judge.courtFacility || 'Cook County Circuit Court'}) — Leniency score: ${judge.leniencyScore}. Sentenced ${pct(judge.violentCases.prisonRate)} of violent offenders to prison. ${judge.totalCases.toLocaleString()} cases analyzed.`,
    openGraph: {
      title: `${judge.name} — RedHanded Judicial Profile`,
      description: `Leniency score: ${judge.leniencyScore} (${getLeniencyLabel(judge.leniencyScore)}). Violent offenders to prison: ${pct(judge.violentCases.prisonRate)}. Based on ${judge.totalCases.toLocaleString()} real cases.`,
    },
  };
}

function SentenceBar({
  label,
  value,
  color,
  count,
}: {
  label: string;
  value: number;
  color: string;
  count?: number;
}) {
  const pctWidth = Math.round(value * 100);
  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="font-bold" style={{ color }}>
          {pct(value)}{' '}
          {count !== undefined && (
            <span className="text-[var(--text-muted)] font-normal">({count})</span>
          )}
        </span>
      </div>
      <div className="h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden border border-[var(--border)]">
        <div
          className="h-full rounded-full"
          style={{ width: `${pctWidth}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
        />
      </div>
    </div>
  );
}

function LeniencyRing({ score }: { score: number }) {
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getLeniencyColor(score);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#2a2a2a" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="score-ring"
            style={{ filter: `drop-shadow(0 0 8px ${color}60)`, transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{getLeniencyLabel(score)}</span>
      <span className="text-[0.65rem] text-[var(--text-muted)]">Leniency Score</span>
    </div>
  );
}

export default async function JudgeProfilePage({ params }: Props) {
  const { slug } = await params;
  const judge = getStateJudgeBySlug(slug);
  if (!judge) notFound();

  const avg = getCourtAverage();
  const meta = getJudgeProfilesMeta();

  const violentProbHigh = judge.violentCases.total >= 3 && judge.violentCases.probationRate > 0.5;
  const prisonDelta = judge.prisonRate - avg.prisonRate;
  const probationDelta = judge.probationRate - avg.probationRate;

  const violentWalked = judge.violentCases.probationCount +
    (judge.violentCases.total - judge.violentCases.prisonCount - judge.violentCases.probationCount);
  const extraInPrison = Math.round(
    (avg.violentCases.prisonRate - judge.violentCases.prisonRate) * judge.violentCases.total
  );

  const topOffenses = Object.entries(judge.offenseBreakdown)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 12);

  const VIOLENT_CATS = [
    'UUW - Unlawful Use of Weapon', 'Homicide', 'Attempt Homicide', 'Armed Robbery',
    'Attempt Armed Robbery', 'Aggravated Battery', 'Aggravated Battery With A Firearm',
    'Sex Crimes', 'Attempt Sex Crimes', 'Vehicular Hijacking', 'Home Invasion', 'Robbery',
  ];
  const violentBreakdown = VIOLENT_CATS
    .map((cat) => ({ cat, stats: judge.offenseBreakdown[cat] }))
    .filter((x) => x.stats && x.stats.total > 0);

  const color = getLeniencyColor(judge.leniencyScore);

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-4 py-3">
        <div className="max-w-6xl mx-auto text-xs text-[var(--text-muted)]">
          <Link href="/" className="text-[var(--text-muted)] no-underline hover:text-[var(--text-primary)]">Home</Link>
          {' › '}
          <Link href="/judges/state" className="text-[var(--text-muted)] no-underline hover:text-[var(--text-primary)]">State Judges</Link>
          {' › '}
          <span className="text-[var(--text-primary)]">{judge.name}</span>
        </div>
      </div>

      {/* Hero */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <LeniencyRing score={judge.leniencyScore} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border)] rounded px-2 py-0.5">
                  {judge.stateCode} · {judge.county}
                </span>
                <span
                  className="text-xs font-semibold uppercase tracking-wider rounded px-2 py-0.5 border"
                  style={{ color, background: 'rgba(0,0,0,0.3)', borderColor: `${color}44` }}
                >
                  {getLeniencyLabel(judge.leniencyScore)}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-[var(--text-primary)] mb-1 tracking-tight">
                {judge.name}
              </h1>
              <p className="text-[var(--text-secondary)] mb-4">
                {judge.courtFacility || 'Cook County Circuit Court'} · {judge.totalCases.toLocaleString()} cases sentenced
              </p>

              {/* Quick stat pills */}
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Prison Rate', value: pct(judge.prisonRate), delta: prisonDelta, higherBetter: true },
                  { label: 'Probation Rate', value: pct(judge.probationRate), delta: -probationDelta, higherBetter: true },
                  { label: 'Violent → Prison', value: judge.violentCases.total >= 1 ? pct(judge.violentCases.prisonRate) : '—', delta: judge.violentCases.total >= 1 ? judge.violentCases.prisonRate - avg.violentCases.prisonRate : 0, higherBetter: true },
                ].map(({ label, value, delta, higherBetter }) => (
                  <div key={label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 min-w-[100px]">
                    <div className="text-lg font-bold text-[var(--text-primary)]">{value}</div>
                    <div className="text-xs text-[var(--text-muted)]">{label}</div>
                    {value !== '—' && (
                      <div className={`text-[0.65rem] font-semibold mt-0.5 ${(higherBetter ? delta > 0 : delta < 0) ? 'text-green-500' : 'text-red-500'}`}>
                        {delta > 0 ? '+' : ''}{(delta * 100).toFixed(1)}% vs avg
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Overall Sentencing */}
          <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
            <h2 className="font-bold mb-4 text-base text-[var(--text-primary)]">Overall Sentencing Record</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Prison', value: judge.prisonCount, rate: judge.prisonRate, color: '#dc2626' },
                { label: 'Probation', value: judge.probationCount, rate: judge.probationRate, color: '#22c55e' },
                { label: 'Jail', value: judge.jailCount, rate: judge.jailRate, color: '#f97316' },
                { label: 'Other', value: judge.otherCount, rate: judge.otherRate, color: '#6b7280' },
              ].map(({ label, value, rate, color: c }) => (
                <div key={label} className="bg-[var(--bg-secondary)] rounded-lg p-3 text-center">
                  <div className="text-xl font-bold" style={{ color: c }}>{pct(rate)}</div>
                  <div className="text-xs text-[var(--text-muted)]">{label}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">{value.toLocaleString()}</div>
                </div>
              ))}
            </div>
            <SentenceBar label="Prison" value={judge.prisonRate} color="#dc2626" count={judge.prisonCount} />
            <SentenceBar label="Probation" value={judge.probationRate} color="#22c55e" count={judge.probationCount} />
            <SentenceBar label="Jail" value={judge.jailRate} color="#f97316" count={judge.jailCount} />
            <SentenceBar label="Other" value={judge.otherRate} color="#6b7280" count={judge.otherCount} />
            <p className="text-xs text-[var(--text-muted)] mt-3">
              Court avg: {pct(avg.prisonRate)} prison · {pct(avg.probationRate)} probation · {pct(avg.jailRate)} jail
            </p>
          </section>

          {/* Violent Crimes */}
          <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
            <h2 className="font-bold mb-4 text-base text-[var(--text-primary)]">Violent Crime Sentencing</h2>
            {judge.violentCases.total >= 1 ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[var(--bg-secondary)] rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-red-600">{pct(judge.violentCases.prisonRate)}</div>
                    <div className="text-xs text-[var(--text-muted)]">Violent → Prison</div>
                    <div className="text-[0.65rem] text-[var(--text-muted)] mt-0.5">{judge.violentCases.prisonCount} cases</div>
                  </div>
                  <div className="bg-[var(--bg-secondary)] rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-green-500">{pct(judge.violentCases.probationRate)}</div>
                    <div className="text-xs text-[var(--text-muted)]">Violent → Probation</div>
                    <div className="text-[0.65rem] text-[var(--text-muted)] mt-0.5">{judge.violentCases.probationCount} cases</div>
                  </div>
                </div>
                <SentenceBar label="Violent → Prison" value={judge.violentCases.prisonRate} color="#dc2626" count={judge.violentCases.prisonCount} />
                <SentenceBar label="Violent → Probation" value={judge.violentCases.probationRate} color="#22c55e" count={judge.violentCases.probationCount} />
                <SentenceBar label="Violent → Jail" value={judge.violentCases.jailRate} color="#f97316" />
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Court avg violent → prison: {pct(avg.violentCases.prisonRate)} · probation: {pct(avg.violentCases.probationRate)}
                </p>
                {violentBreakdown.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">By Violent Offense Type</p>
                    {violentBreakdown.map(({ cat, stats }) => (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-[var(--text-secondary)]">{cat}</span>
                          <span className="text-[var(--text-muted)]">{stats.total} cases</span>
                        </div>
                        <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden flex">
                          <div style={{ width: `${Math.round(stats.prisonRate * 100)}%`, background: '#dc2626' }} className="h-full" />
                          <div style={{ width: `${Math.round((stats.jail / stats.total) * 100)}%`, background: '#f97316' }} className="h-full" />
                          <div style={{ width: `${Math.round(stats.probationRate * 100)}%`, background: '#22c55e' }} className="h-full" />
                        </div>
                        <div className="flex gap-3 text-[0.65rem] text-[var(--text-muted)] mt-0.5">
                          <span className="text-red-500">Prison {pct(stats.prisonRate)}</span>
                          <span className="text-green-500">Probation {pct(stats.probationRate)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {violentProbHigh && (
                  <div className="mt-4 bg-red-950/20 border border-red-900/50 rounded-lg p-3 text-sm text-red-300">
                    <strong>Warning:</strong> This judge gives probation to more than half of violent offenders —{' '}
                    {pct(judge.violentCases.probationRate)} vs. court average of {pct(avg.violentCases.probationRate)}.
                  </div>
                )}
              </>
            ) : (
              <p className="text-[var(--text-muted)] text-sm">No violent offense cases in this dataset.</p>
            )}
          </section>

          {/* Offense Breakdown */}
          <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
            <h2 className="font-bold mb-4 text-base text-[var(--text-primary)]">Offense Breakdown (Top Cases)</h2>
            <div className="space-y-2">
              {topOffenses.map(([offense, stats]) => (
                <div key={offense}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-[var(--text-secondary)]">{offense}</span>
                    <span className="text-[var(--text-muted)]">{stats.total} cases</span>
                  </div>
                  <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden flex">
                    <div style={{ width: `${Math.round(stats.prisonRate * 100)}%`, background: '#dc2626' }} className="h-full" />
                    <div style={{ width: `${Math.round((stats.jail / stats.total) * 100)}%`, background: '#f97316' }} className="h-full" />
                    <div style={{ width: `${Math.round(stats.probationRate * 100)}%`, background: '#22c55e' }} className="h-full" />
                  </div>
                  <div className="flex gap-3 text-[0.65rem] mt-0.5">
                    <span className="text-red-500">Prison {pct(stats.prisonRate)}</span>
                    <span className="text-green-500">Probation {pct(stats.probationRate)}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[0.65rem] text-[var(--text-muted)] mt-3">Red = prison · Orange = jail · Green = probation</p>
          </section>

          {/* Demographics */}
          {(() => {
            const raceEntries = Object.entries(judge.raceBreakdown).filter(([, s]) => s.total >= 1);
            const genderEntries = Object.entries(judge.genderBreakdown).filter(
              ([g, s]) => s.total >= 1 && g !== 'Unknown Gender' && g
            );
            const hasData = raceEntries.length > 0 || genderEntries.length > 0;
            return (
              <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
                <h2 className="font-bold mb-4 text-base text-[var(--text-primary)]">Defendant Demographics</h2>
                {!hasData ? (
                  <p className="text-sm text-[var(--text-muted)] italic">
                    Demographics data not yet available for {judge.county}.
                  </p>
                ) : (
                  <>
                    {raceEntries.length > 0 && (
                      <div className="mb-5">
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Race Breakdown</p>
                        {raceEntries
                          .sort((a, b) => b[1].total - a[1].total)
                          .slice(0, 8)
                          .map(([race, stats]) => (
                            <div key={race} className="mb-2">
                              <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-0.5">
                                <span>{race}</span>
                                <span className="text-[var(--text-muted)]">
                                  {stats.total} cases · {pct(stats.prisonRate)} prison
                                </span>
                              </div>
                              <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden flex">
                                <div style={{ width: `${Math.round(stats.prisonRate * 100)}%`, background: '#dc2626' }} className="h-full" />
                                <div style={{ width: `${Math.round(stats.probationRate * 100)}%`, background: '#22c55e' }} className="h-full" />
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                    {genderEntries.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Gender Breakdown</p>
                        {genderEntries
                          .sort((a, b) => b[1].total - a[1].total)
                          .map(([gender, stats]) => (
                            <div key={gender} className="flex justify-between text-sm text-[var(--text-secondary)] mb-1">
                              <span>{gender}</span>
                              <span className="text-[var(--text-muted)] text-xs">
                                {stats.total} cases · {pct(stats.prisonRate)} prison · {pct(stats.probationRate)} probation
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                )}
                <p className="text-[0.7rem] text-[var(--text-muted)] mt-3">Data presented neutrally. Source: {meta.source}.</p>
              </section>
            );
          })()}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Public Safety Impact */}
          <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
            <h2 className="font-bold mb-4 text-base text-[var(--text-primary)]">Public Safety Impact</h2>
            {judge.violentCases.total > 0 ? (
              <div className="space-y-3">
                <div className="bg-[var(--bg-secondary)] rounded-lg p-3">
                  <div className="text-2xl font-extrabold text-orange-500">{violentWalked}</div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    violent offenders given non-prison sentences
                  </p>
                </div>
                {extraInPrison > 0 && (
                  <div className="bg-[var(--bg-secondary)] rounded-lg p-3">
                    <div className="text-2xl font-extrabold text-red-600">+{extraInPrison}</div>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      more violent offenders would be in prison if sentenced at court average
                    </p>
                  </div>
                )}
                <p className="text-xs text-[var(--text-muted)]">
                  Court avg: {pct(avg.violentCases.prisonRate)} prison, {pct(avg.violentCases.probationRate)} probation for violent offenders.
                </p>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Insufficient violent case data.</p>
            )}
          </section>

          {/* Take Action */}
          <section className="bg-red-950/10 border border-red-900/40 rounded-xl p-5">
            <h2 className="font-bold mb-3 text-base text-[var(--text-primary)]">Take Action</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
              <strong className="text-[var(--text-primary)]">{judge.name}</strong> serves in{' '}
              <strong>{judge.courtFacility || (judge.stateCode === 'IL' ? 'Cook County Circuit Court' : `${judge.county} Court`)}</strong>.{' '}
              {judge.stateCode === 'IL'
                ? 'Cook County voters decide judicial retention — a YES/NO vote on whether this judge keeps their seat.'
                : 'Florida voters can contact the Florida Judicial Qualifications Commission to report concerns.'}
            </p>
            <div className="flex flex-col gap-2">
              {judge.stateCode === 'IL' ? (
                <a
                  href="https://www.cookcountyclerkofcourt.org/services/judicial-elections"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 bg-[var(--red-primary)] hover:bg-red-700 text-white rounded-lg px-4 py-2.5 text-sm font-semibold no-underline transition-colors"
                >
                  Voter Information
                </a>
              ) : (
                <a
                  href="https://jqc.state.fl.us/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 bg-[var(--red-primary)] hover:bg-red-700 text-white rounded-lg px-4 py-2.5 text-sm font-semibold no-underline transition-colors"
                >
                  FL Judicial Qualifications
                </a>
              )}
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-1.5 bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--red-primary)] text-[var(--text-secondary)] rounded-lg px-4 py-2.5 text-sm font-semibold no-underline transition-colors"
              >
                ← All Judges
              </Link>
            </div>
          </section>

          {/* Methodology */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-xs text-[var(--text-muted)] leading-relaxed">
            <strong className="text-[var(--text-secondary)]">How scores work:</strong>{' '}
            Leniency Score is a weighted composite of violent-crime probation rate (50%), overall probation rate (30%), and non-prison rate (20%).
            {' '}<Link href="/methodology" className="text-[var(--red-primary)] no-underline hover:underline">Full methodology →</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
