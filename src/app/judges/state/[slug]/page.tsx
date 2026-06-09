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

// Pre-generate all judge pages at build time
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
  max = 1,
  color,
  count,
}: {
  label: string;
  value: number;
  max?: number;
  color: string;
  count?: number;
}) {
  const pctWidth = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: '0.625rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>
          {pct(value)} {count !== undefined && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({count})</span>}
        </span>
      </div>
      <div style={{ height: '10px', background: '#1a1a1a', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div
          style={{
            width: `${pctWidth}%`,
            height: '100%',
            background: color,
            borderRadius: '5px',
            boxShadow: `0 0 6px ${color}60`,
          }}
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
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
            style={{ filter: `drop-shadow(0 0 8px ${color}60)`, transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{score}</span>
        </div>
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color }}>
        {getLeniencyLabel(score)}
      </span>
      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Leniency Score</span>
    </div>
  );
}

export default async function JudgeProfilePage({ params }: Props) {
  const { slug } = await params;
  const judge = getStateJudgeBySlug(slug);
  if (!judge) notFound();

  const avg = getCourtAverage();
  const meta = getJudgeProfilesMeta();

  // Compute some analysis
  const violentProbHigh = judge.violentCases.total >= 3 && judge.violentCases.probationRate > 0.5;
  const prisonDelta = judge.prisonRate - avg.prisonRate;
  const probationDelta = judge.probationRate - avg.probationRate;
  const violentPrisonDelta = judge.violentCases.prisonRate - avg.violentCases.prisonRate;

  // How many violent offenders walked
  const violentWalked = judge.violentCases.probationCount + (judge.violentCases.total - judge.violentCases.prisonCount - judge.violentCases.probationCount);
  // If sentenced like avg: how many more would be in prison
  const extraInPrison = Math.round((avg.violentCases.prisonRate - judge.violentCases.prisonRate) * judge.violentCases.total);

  // Offense breakdown — show top 10
  const topOffenses = Object.entries(judge.offenseBreakdown)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 12);

  // Find a "strictest" judge for comparison
  const allJudges = getAllStateJudges().filter((j) => j.slug !== slug && j.violentCases.total >= 5);
  const strictest = allJudges.sort((a, b) => a.leniencyScore - b.leniencyScore)[0];

  // Violent offense-specific breakdown
  const VIOLENT_CATS = [
    'UUW - Unlawful Use of Weapon',
    'Homicide',
    'Attempt Homicide',
    'Armed Robbery',
    'Attempt Armed Robbery',
    'Aggravated Battery',
    'Aggravated Battery With A Firearm',
    'Sex Crimes',
    'Attempt Sex Crimes',
    'Vehicular Hijacking',
    'Home Invasion',
    'Robbery',
  ];
  const violentBreakdown = VIOLENT_CATS
    .map((cat) => ({ cat, stats: judge.offenseBreakdown[cat] }))
    .filter((x) => x.stats && x.stats.total > 0);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '0.75rem 1rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
          {' › '}
          <Link href="/judges/state" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>State Judges</Link>
          {' › '}
          <span style={{ color: 'var(--text-primary)' }}>{judge.name}</span>
        </div>
      </div>

      {/* Hero Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          padding: '2rem 1rem',
        }}
      >
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <div className="judge-hero-layout" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Ring */}
            <LeniencyRing score={judge.leniencyScore} />

            {/* Info */}
            <div style={{ flex: 1, minWidth: '260px' }}>
              {/* State / county / label badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.25rem', padding: '0.15rem 0.5rem' }}>
                  {judge.stateCode} · {judge.county}
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: getLeniencyColor(judge.leniencyScore), background: 'rgba(0,0,0,0.3)', border: `1px solid ${getLeniencyColor(judge.leniencyScore)}44`, borderRadius: '0.25rem', padding: '0.15rem 0.5rem' }}>
                  {getLeniencyLabel(judge.leniencyScore)}
                </span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem', letterSpacing: '-0.01em' }}>
                {judge.name}
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                {judge.courtFacility || 'Cook County Circuit Court'} · {judge.totalCases.toLocaleString()} cases sentenced
              </p>
              {/* Violent vs avg callout */}
              {judge.violentCases.total >= 5 && (
                <div style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: `1px solid ${judge.violentCases.prisonRate < avg.violentCases.prisonRate ? 'rgba(220,38,38,0.4)' : 'rgba(34,197,94,0.4)'}`,
                  borderRadius: '0.5rem',
                  padding: '0.625rem 1rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.875rem',
                  lineHeight: 1.5,
                }}>
                  This judge sentences violent offenders to prison{' '}
                  <strong style={{ color: getLeniencyColor(judge.leniencyScore) }}>{pct(judge.violentCases.prisonRate)}</strong>
                  {' '}of the time, vs. county average of{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{pct(avg.violentCases.prisonRate)}</strong>.
                </div>
              )}
              <div className="judge-metric-badges" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {[
                  { label: 'Prison Rate', value: pct(judge.prisonRate), delta: prisonDelta, higherBetter: true },
                  { label: 'Probation Rate', value: pct(judge.probationRate), delta: -probationDelta, higherBetter: true },
                  { label: 'Violent → Prison', value: judge.violentCases.total > 0 ? pct(judge.violentCases.prisonRate) : 'N/A', delta: violentPrisonDelta, higherBetter: true },
                ].map(({ label, value, delta, higherBetter }) => (
                  <div
                    key={label}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 0.875rem',
                    }}
                  >
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>{label}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
                    {delta !== undefined && value !== 'N/A' && (
                      <div style={{
                        fontSize: '0.65rem',
                        color: (higherBetter ? delta > 0 : delta < 0) ? '#22c55e' : '#dc2626',
                      }}>
                        {delta > 0 ? '+' : ''}{Math.round(delta * 100)}pp vs avg
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '72rem', margin: '0 auto', padding: '1.5rem 1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>

        {/* Sentencing Breakdown */}
        <section
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '1.25rem',
          }}
        >
          <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
            Sentencing Breakdown
          </h2>
          <SentenceBar label="Prison" value={judge.prisonRate} color="#dc2626" count={judge.prisonCount} />
          <SentenceBar label="Probation" value={judge.probationRate} color="#22c55e" count={judge.probationCount} />
          <SentenceBar label="Jail" value={judge.jailRate} color="#f97316" count={judge.jailCount} />

          <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#1a1a1a', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>vs. Court Average</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: prisonDelta >= 0 ? '#22c55e' : '#dc2626' }}>
              <span>Prison</span>
              <span>{prisonDelta >= 0 ? '+' : ''}{Math.round(prisonDelta * 100)}pp</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: probationDelta <= 0 ? '#22c55e' : '#dc2626' }}>
              <span>Probation</span>
              <span>{probationDelta >= 0 ? '+' : ''}{Math.round(probationDelta * 100)}pp</span>
            </div>
          </div>

          {judge.avgCommitmentDays && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Avg sentence length: {Math.round(judge.avgCommitmentDays / 365.25 * 10) / 10} years
            </p>
          )}
        </section>

        {/* Violent Crime Record */}
        <section
          style={{
            background: 'var(--bg-card)',
            border: `1px solid ${violentProbHigh ? '#7f1d1d' : 'var(--border)'}`,
            borderRadius: '0.75rem',
            padding: '1.25rem',
          }}
        >
          <h2 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
            Violent Crime Record
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            How does this judge handle violent offenders? ({judge.violentCases.total} violent cases)
          </p>

          {judge.violentCases.total > 0 ? (
            <>
              <SentenceBar label="Violent → Prison" value={judge.violentCases.prisonRate} color="#dc2626" count={judge.violentCases.prisonCount} />
              <SentenceBar label="Violent → Probation" value={judge.violentCases.probationRate} color="#f59e0b" count={judge.violentCases.probationCount} />

              {violentBreakdown.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    By Offense Type
                  </div>
                  {violentBreakdown.map(({ cat, stats }) => (
                    <div key={cat} style={{ marginBottom: '0.625rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                        <span>{cat} <span style={{ color: 'var(--text-muted)' }}>({stats.total})</span></span>
                        <span style={{ fontWeight: 600, color: stats.prisonRate < 0.3 ? '#dc2626' : '#22c55e' }}>
                          {pct(stats.prisonRate)} prison
                        </span>
                      </div>
                      <div style={{ height: '6px', background: '#1a1a1a', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${Math.round(stats.prisonRate * 100)}%`, background: '#dc2626', height: '100%' }} />
                        <div style={{ width: `${Math.round(stats.probationRate * 100)}%`, background: '#22c55e', height: '100%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {violentProbHigh && (
                <div
                  style={{
                    marginTop: '1rem',
                    background: 'rgba(220, 38, 38, 0.08)',
                    border: '1px solid rgba(220, 38, 38, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    fontSize: '0.8rem',
                    color: '#fca5a5',
                  }}
                >
                  <strong>Warning:</strong> This judge gives probation to more than half of violent offenders —
                  {' '}{pct(judge.violentCases.probationRate)} vs. court average of {pct(avg.violentCases.probationRate)}.
                </div>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No violent offense cases in this dataset.</p>
          )}
        </section>

        {/* What This Means for Public Safety */}
        <section
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '1.25rem',
          }}
        >
          <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
            What This Means for Public Safety
          </h2>

          {judge.violentCases.total > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ background: '#1a1a1a', borderRadius: '0.5rem', padding: '0.875rem' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f97316' }}>
                  {violentWalked}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  violent offenders given non-prison sentences by this judge
                </p>
              </div>

              {extraInPrison > 0 && strictest && (
                <div style={{ background: '#1a1a1a', borderRadius: '0.5rem', padding: '0.875rem' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>
                    +{extraInPrison}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    more violent offenders would be in prison if this judge sentenced like the court average
                  </p>
                </div>
              )}

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                These numbers represent real cases with real victims.
                Court average for violent offenders: {pct(avg.violentCases.prisonRate)} to prison, {pct(avg.violentCases.probationRate)} to probation.
              </p>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Insufficient violent case data for this analysis.
            </p>
          )}
        </section>

        {/* Offense Breakdown */}
        <section
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '1.25rem',
          }}
        >
          <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
            Offense Breakdown (Top Cases)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {topOffenses.map(([offense, stats]) => (
              <div key={offense}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{offense}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{stats.total} cases</span>
                </div>
                <div style={{ height: '8px', background: '#1a1a1a', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                  <div
                    title={`Prison: ${pct(stats.prisonRate)}`}
                    style={{ width: `${Math.round(stats.prisonRate * 100)}%`, background: '#dc2626', height: '100%' }}
                  />
                  <div
                    title={`Jail: ${pct(stats.jail / stats.total)}`}
                    style={{ width: `${Math.round((stats.jail / stats.total) * 100)}%`, background: '#f97316', height: '100%' }}
                  />
                  <div
                    title={`Probation: ${pct(stats.probationRate)}`}
                    style={{ width: `${Math.round(stats.probationRate * 100)}%`, background: '#22c55e', height: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  <span style={{ color: '#dc2626' }}>Prison {pct(stats.prisonRate)}</span>
                  <span style={{ color: '#22c55e' }}>Probation {pct(stats.probationRate)}</span>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            Red = prison · Orange = jail · Green = probation
          </p>
        </section>

        {/* Demographics */}
        {(() => {
          const raceEntries = Object.entries(judge.raceBreakdown).filter(([, s]) => s.total >= 1);
          const genderEntries = Object.entries(judge.genderBreakdown).filter(([g, s]) => s.total >= 1 && g !== 'Unknown Gender' && g);
          const hasData = raceEntries.length > 0 || genderEntries.length > 0;
          return (
            <section
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                padding: '1.25rem',
              }}
            >
              <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
                Defendant Demographics
              </h2>
              {!hasData ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Demographics data not yet available for {judge.county}.
                </p>
              ) : (
                <>
                  {raceEntries.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Race Breakdown
                      </div>
                      {raceEntries
                        .sort((a, b) => b[1].total - a[1].total)
                        .slice(0, 8)
                        .map(([race, stats]) => (
                          <div key={race} style={{ marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>
                              <span>{race}</span>
                              <span style={{ color: 'var(--text-muted)' }}>
                                {stats.total} cases · {pct(stats.prisonRate)} prison
                              </span>
                            </div>
                            <div style={{ height: '6px', background: '#1a1a1a', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                              <div style={{ width: `${Math.round(stats.prisonRate * 100)}%`, background: '#dc2626', height: '100%' }} />
                              <div style={{ width: `${Math.round(stats.probationRate * 100)}%`, background: '#22c55e', height: '100%' }} />
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                  {genderEntries.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Gender Breakdown
                      </div>
                      {genderEntries
                        .sort((a, b) => b[1].total - a[1].total)
                        .map(([gender, stats]) => (
                          <div key={gender} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            <span>{gender}</span>
                            <span style={{ color: 'var(--text-muted)' }}>
                              {stats.total} cases · {pct(stats.prisonRate)} prison · {pct(stats.probationRate)} probation
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                Data presented neutrally. Source: {meta.source}.
              </p>
            </section>
          );
        })()}

        {/* Take Action */}
        <section
          style={{
            background: 'rgba(220, 38, 38, 0.06)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
          }}
        >
          <h2 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
            Take Action
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-primary)' }}>{judge.name}</strong> serves in{' '}
            <strong>{judge.courtFacility || (judge.stateCode === 'IL' ? 'Cook County Circuit Court' : `${judge.county} Court`)}</strong>.
            {judge.stateCode === 'IL' ? (
              <> Cook County voters decide judicial retention — a YES/NO vote on whether this judge keeps their seat.
              Your vote is your voice.</>
            ) : (
              <> Florida voters can contact the Florida Judicial Qualifications Commission to report concerns about judicial conduct.
              Share this profile to raise awareness about {judge.name}&apos;s sentencing record.</>
            )}
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
            Leniency score: <strong style={{ color: getLeniencyColor(judge.leniencyScore) }}>{judge.leniencyScore} — {getLeniencyLabel(judge.leniencyScore)}</strong>.
            {judge.violentCases.total > 0 && (
              <> This judge sentenced {pct(judge.violentCases.probationRate)} of violent offenders to probation.</>
            )}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {judge.stateCode === 'IL' ? (
              <a
                href="https://www.cookcountyclerkofcourt.org/services/judicial-elections"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Voter Information
              </a>
            ) : (
              <a
                href="https://jqc.state.fl.us/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                FL Judicial Qualifications Commission
              </a>
            )}
            <Link
              href="/judges/state"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              ← All Judges
            </Link>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
            Knowledge is power. Now you know.
          </p>
        </section>

      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 1rem 3rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Data: {meta.source} · {meta.totalCases.toLocaleString()} total sentencing records
        </p>
      </footer>
    </div>
  );
}
