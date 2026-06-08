import { use } from 'react';
import Link from 'next/link';
import {
  isStateAvailable,
  AVAILABLE_STATES,
  getILStats,
  getNYStats,
  fmt,
  pct,
  dollars,
  share,
  topN,
  IL_DATA,
  NY_DATA,
} from '@/lib/state-deep-dive';

// ─── Shared sub-components ────────────────────────────────────────────────────

function BigStat({ value, label, color = 'var(--red-primary)', sub }: { value: string; label: string; color?: string; sub?: string }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${color}44`,
      borderRadius: '0.75rem',
      padding: '1.25rem',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '2.5rem', fontWeight: 800, color, lineHeight: 1, marginBottom: '0.5rem' }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h2>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
      {children}
    </div>
  );
}

function HBar({ label, value, max, color = 'var(--red-primary)', suffix = '' }: { label: string; value: number; max: number; color?: string; suffix?: string }) {
  const width = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{fmt(value)}{suffix}</span>
      </div>
      <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${width}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function SourceNote({ text }: { text: string }) {
  return (
    <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '0.5rem' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>📋 <strong>Source:</strong> {text}</p>
    </div>
  );
}

// ─── Illinois Page ─────────────────────────────────────────────────────────────

function IllinoisPage() {
  const stats = getILStats();

  // Top offense categories for disposition comparison
  const topOffenses = stats.topOffenses.slice(0, 8);
  const maxOffenseCount = topOffenses[0]?.[1] ?? 1;

  // Sentence breakdown
  const totalPrisonProbationJail = stats.prison + stats.probation + stats.jail;

  return (
    <div>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', padding: '1.5rem 1rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <Link href="/state-deep-dives" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>← State Deep Dives</Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem' }}>🏙️</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Illinois — Cook County State Court Analysis
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            {fmt(stats.totalCases)} felony cases analyzed · State court data (not federal) · Data covers 2024–2025
          </p>
          <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: '0.375rem', display: 'inline-block' }}>
            <span style={{ fontSize: '0.75rem', color: '#f87171' }}>⚠️ Cook County = Chicago metro area only — does not represent all of Illinois</span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* Section A: Catch-and-Release */}
        <Section>
          <SectionHeader title="The Catch-and-Release Problem" icon="🔄" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Of {fmt(stats.totalCases)} felony cases brought before Cook County courts, the overwhelming majority never resulted in a conviction.
            Prosecutors dropped charges — via <em>Nolle Prosequi</em> — in <strong style={{ color: 'var(--red-primary)' }}>3 out of 4 cases</strong>.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <BigStat value={pct(stats.nollePct, 0)} label="Charges DROPPED (Nolle)" color="#dc2626" sub={`${fmt(stats.nolleTotal)} cases`} />
            <BigStat value={pct(stats.guiltyPct, 0)} label="Resulted in Conviction" color="#ca8a04" sub={`${fmt(stats.guiltyPleas)} cases`} />
            <BigStat value={pct(share(stats.notGuilty, stats.totalCases), 1)} label="Not Guilty Verdicts" color="#737373" sub={`${fmt(stats.notGuilty)} cases`} />
          </div>

          <div style={{ padding: '1rem', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '0.5rem' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              <strong style={{ color: '#f87171' }}>What this means:</strong> For every 10 people charged with a felony in Cook County,
              roughly 7 walked free because the State's Attorney chose not to prosecute. This includes cases involving weapons, homicides, and sex crimes.
              A <em>Nolle Prosequi</em> is not an acquittal — it means prosecutors declined to pursue the case, often without a court determination of guilt or innocence.
            </p>
          </div>

          <SourceNote text="Cook County State's Attorney Office — Socrata Open Data Portal. Disposition records 2024–2025." />
        </Section>

        {/* Section B: Offense Categories */}
        <Section>
          <SectionHeader title="What Crimes Are Being Dropped?" icon="📂" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
            Weapons charges dominate Cook County felony dockets — yet they carry the highest nolle rate.
            Below are the most common offense categories by case volume.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem' }}>CHARGES FILED (Top Offenses)</h3>
              {topOffenses.map(([name, count]) => (
                <HBar
                  key={name}
                  label={name}
                  value={count}
                  max={maxOffenseCount}
                  color={
                    name.includes('Weapon') || name.includes('UUW') ? '#dc2626' :
                    name.includes('Homicide') || name.includes('Sex') || name.includes('Armed') ? '#ef4444' :
                    '#8b5cf6'
                  }
                />
              ))}
            </div>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem' }}>CASES THAT REACHED SENTENCING</h3>
              {stats.topSentencedOffenses.slice(0, 8).map(([name, count]) => (
                <HBar
                  key={name}
                  label={name}
                  value={count}
                  max={stats.topSentencedOffenses[0]?.[1] ?? 1}
                  color="#16a34a"
                />
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: '0.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              🔴 <strong style={{ color: '#f87171' }}>Red flag:</strong> Unlawful Use of Weapons (UUW) is the single most charged felony — {fmt(IL_DATA.dispositions.offense_categories['UUW - Unlawful Use of Weapon'] ?? 0)} cases.
              Yet only {fmt(IL_DATA.sentencing.offense_categories['UUW - Unlawful Use of Weapon'] ?? 0)} reached sentencing.
              That means {pct(share((IL_DATA.dispositions.offense_categories['UUW - Unlawful Use of Weapon'] ?? 0) - (IL_DATA.sentencing.offense_categories['UUW - Unlawful Use of Weapon'] ?? 0), IL_DATA.dispositions.offense_categories['UUW - Unlawful Use of Weapon'] ?? 1), 0)} of weapons cases were dropped or dismissed before conviction.
            </p>
          </div>

          <SourceNote text="Cook County State's Attorney Office — Dispositions and Sentencing datasets. Categories are as labeled in source data." />
        </Section>

        {/* Section C: Sentencing Breakdown */}
        <Section>
          <SectionHeader title="Sentencing Breakdown" icon="⚖️" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Of the {fmt(stats.totalSentenced)} cases that reached sentencing, nearly half received probation rather than incarceration.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <BigStat value={fmt(stats.prison)} label="Prison" color="#dc2626" sub={`${pct(stats.prisonPct, 0)} of sentences`} />
            <BigStat value={fmt(stats.probation)} label="Probation" color="#ca8a04" sub={`${pct(stats.probationPct, 0)} of sentences`} />
            <BigStat value={fmt(stats.jail)} label="County Jail" color="#8b5cf6" sub={`${pct(stats.jailPct, 0)} of sentences`} />
          </div>

          <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>SENTENCE TYPE DISTRIBUTION</h3>
            <HBar label="Prison (IDOC)" value={stats.prison} max={stats.prison} color="#dc2626" />
            <HBar label="Probation (all types)" value={stats.probation} max={stats.prison} color="#ca8a04" />
            <HBar label="County Jail" value={stats.jail} max={stats.prison} color="#8b5cf6" />
            {Object.entries(IL_DATA.sentencing.sentence_types)
              .filter(([k]) => !['Prison', 'Probation', 'Jail', '2nd Chance Probation'].includes(k))
              .filter(([, v]) => v > 5)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([name, count]) => (
                <HBar key={name} label={name} value={count} max={stats.prison} color="#4b5563" />
              ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Median Prison Term</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--red-primary)' }}>{stats.medianPrisonYears} yrs</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Mean Prison Term</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ca8a04' }}>{stats.meanPrisonYears} yrs</div>
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '0.5rem' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              <strong style={{ color: '#f87171' }}>Nearly half of convicted felons got probation, not prison.</strong>{' '}
              {pct(stats.probationPct, 0)} of sentenced defendants received probation or supervised release instead of incarceration —
              meaning most convicted felons in Cook County remain in the community.
            </p>
          </div>

          <SourceNote text="Cook County State's Attorney Office — Sentencing dataset 2024–2025. Includes Illinois Department of Corrections commitments." />
        </Section>

        {/* Section D: Felony Review */}
        <Section>
          <SectionHeader title="Felony Review: Who Gets Through?" icon="🔍" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Before a case reaches court, Cook County prosecutors conduct a felony review — evaluating whether arrests warrant prosecution.
            Of {fmt(stats.intakeTotal)} intake cases reviewed:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <BigStat value={fmt(stats.intakeApproved)} label="Approved for Prosecution" color="#16a34a" sub={`${pct(share(stats.intakeApproved, stats.intakeTotal), 0)} of intake`} />
            <BigStat value={fmt(stats.intakeRejected)} label="Rejected at Intake" color="#dc2626" sub={`${pct(share(stats.intakeRejected, stats.intakeTotal), 0)} of intake`} />
            <BigStat value={fmt(stats.intakeTotal)} label="Total Intake Cases" color="#8b5cf6" sub="Felony review 2024–2025" />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>TOP INTAKE OFFENSE CATEGORIES</h3>
            {stats.topIntakeOffenses.slice(0, 8).map(([name, count]) => (
              <HBar
                key={name}
                label={name}
                value={count}
                max={stats.topIntakeOffenses[0]?.[1] ?? 1}
                color={name.includes('Weapon') || name.includes('UUW') ? '#dc2626' : name.includes('Narc') ? '#ca8a04' : '#6b7280'}
              />
            ))}
          </div>

          <SourceNote text="Cook County State's Attorney Office — Intake dataset 2024–2025. Felony review results represent initial screening by ASAs (Assistant State's Attorneys)." />
        </Section>

        {/* Section E: Key Findings */}
        <Section>
          <SectionHeader title="Key Findings" icon="🚨" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {[
              {
                icon: '❌',
                color: '#dc2626',
                title: '73% Nolle Prosecution Rate',
                body: `Of ${fmt(stats.totalCases)} felony cases, ${fmt(stats.nolleTotal)} were dropped by prosecutors — the highest-volume outcome in Cook County courts.`,
              },
              {
                icon: '🔫',
                color: '#dc2626',
                title: 'Weapons Charges #1 — Rarely Punished',
                body: `UUW is the most common felony charged (${fmt(IL_DATA.dispositions.offense_categories['UUW - Unlawful Use of Weapon'] ?? 0)} cases), yet the majority never result in conviction.`,
              },
              {
                icon: '🏠',
                color: '#ca8a04',
                title: 'Probation Dominates Sentencing',
                body: `${pct(stats.probationPct, 0)} of convicted felons received probation instead of prison. The median prison sentence for those incarcerated was ${stats.medianPrisonYears} years.`,
              },
              {
                icon: '📋',
                color: '#8b5cf6',
                title: 'Intake Filter Is Limited',
                body: `Only ${fmt(stats.intakeRejected)} of ${fmt(stats.intakeTotal)} intake cases (${pct(share(stats.intakeRejected, stats.intakeTotal), 0)}) were rejected at the felony review stage. Most arrests proceed to court.`,
              },
              {
                icon: '⚠️',
                color: '#f97316',
                title: 'Public Safety Implication',
                body: 'When 3 in 4 felony defendants—including those charged with homicide, weapons, and sex crimes—are not prosecuted to conviction, deterrence effects are severely diminished.',
              },
              {
                icon: '📍',
                color: '#6b7280',
                title: 'Geographic Scope',
                body: `This data covers Cook County only — home to Chicago and 5.2 million residents. It represents state court proceedings, not the separate federal court system.`,
              },
            ].map(({ icon, color, title, body }) => (
              <div key={title} style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '1rem', borderLeft: `3px solid ${color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{title}</strong>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0, lineHeight: 1.6 }}>{body}</p>
              </div>
            ))}
          </div>

          <SourceNote text="Cook County State's Attorney Office — Open Data Portal. All figures from dispositions, sentencing, and intake datasets. Data covers 2024–2025 case activity." />
        </Section>

      </main>
    </div>
  );
}

// ─── New York Page ─────────────────────────────────────────────────────────────

function NewYorkPage() {
  const stats = getNYStats();

  return (
    <div>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', padding: '1.5rem 1rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <Link href="/state-deep-dives" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>← State Deep Dives</Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem' }}>🗽</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              New York — Statewide Court & Bail Analysis
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            {fmt(stats.totalArraignments)} arraignments in 2024 · Statewide data · State court only (not federal) · Data covers 2024–2025
          </p>
          <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '0.375rem', display: 'inline-block' }}>
            <span style={{ fontSize: '0.75rem', color: '#93c5fd' }}>ℹ️ NY bail reform laws (2020, amended 2022 & 2023) govern pretrial release decisions</span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* Section A: The Bail Crisis */}
        <Section>
          <SectionHeader title="The Bail Crisis — Who Goes Home?" icon="🔓" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Following New York's 2020 bail reform, most defendants are released without monetary bail.
            Of {fmt(stats.totalArraignments)} arraignments statewide in 2024:
          </p>

          {/* Release decision visual */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <BigStat value={`${stats.rorPct}%`} label="Released Own Recognizance" color="#dc2626" sub={`${fmt(stats.rorCount)} people`} />
            <BigStat value={`${stats.nmrPct}%`} label="Non-Monetary Release" color="#f97316" sub={`${fmt(stats.nmrCount)} people`} />
            <BigStat value={`${stats.bailSetPct}%`} label="Bail Set" color="#ca8a04" sub={`${fmt(stats.bailSetCount)} people`} />
            <BigStat value={`${stats.remandedPct}%`} label="Remanded (Held)" color="#16a34a" sub={`${fmt(stats.remandedCount)} people`} />
          </div>

          {/* CSS donut-style bar chart */}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>RELEASE DECISION BREAKDOWN</h3>
            <div style={{ display: 'flex', height: '32px', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.75rem' }}>
              <div style={{ width: `${stats.rorPct}%`, background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', padding: '0 2px' }}>ROR {stats.rorPct}%</span>
              </div>
              <div style={{ width: `${stats.nmrPct}%`, background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', padding: '0 2px' }}>NMR {stats.nmrPct}%</span>
              </div>
              <div style={{ width: `${stats.bailSetPct}%`, background: '#ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', padding: '0 2px' }}>Bail {stats.bailSetPct}%</span>
              </div>
              <div style={{ width: `${stats.remandedPct}%`, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', padding: '0 2px' }}>Held {stats.remandedPct}%</span>
              </div>
              <div style={{ flex: 1, background: '#374151' }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#dc2626', borderRadius: '2px', marginRight: '4px' }} />ROR — Released Own Recognizance</span>
              <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#f97316', borderRadius: '2px', marginRight: '4px' }} />NMR — Non-Monetary Release (conditions)</span>
              <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#ca8a04', borderRadius: '2px', marginRight: '4px' }} />Bail Set</span>
              <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#16a34a', borderRadius: '2px', marginRight: '4px' }} />Remanded (held without bail)</span>
              <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#374151', borderRadius: '2px', marginRight: '4px' }} />Disposed at arraignment / Unknown</span>
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '0.5rem' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              <strong style={{ color: '#f87171' }}>{stats.totalReleasedPct}% of all defendants — including violent felons — are released before trial.</strong>{' '}
              Only {stats.remandedPct}% are held (remanded). The remaining {stats.bailSetPct}% have bail set, but many cannot or do not make bail.
            </p>
          </div>

          <SourceNote text="NY Division of Criminal Justice Services (DCJS) — Supplemental Pretrial Release Data File 2024." />
        </Section>

        {/* Section B: Violent Felons Walking Free */}
        <Section>
          <SectionHeader title="Violent Felons Walking Free" icon="🚨" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            New York law designates certain charges as Violent Felony Offenses (VFOs). These are the most serious crimes —
            yet the majority of VFO defendants are released before trial.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <BigStat value={fmt(stats.vfoCount)} label="Violent Felony Offense Arraignments" color="#dc2626" sub="VFO designations in 2024" />
            <BigStat value={`~${fmt(stats.vfoReleasedEst)}`} label="Est. VFOs Released Pre-Trial" color="#f97316" sub="Based on overall release rate" />
            <BigStat value={`~${fmt(stats.vfoRemandedEst)}`} label="Est. VFOs Remanded" color="#16a34a" sub="Held without bail" />
          </div>

          <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>RE-ARREST INDICATORS (while on pretrial release)</h3>
            <HBar label="Re-arrested for VFO" value={stats.reArrestVFO} max={stats.reArrestMisd} color="#dc2626" />
            <HBar label="Re-arrested Non-VFO Felony" value={stats.reArrestNonVFO} max={stats.reArrestMisd} color="#f97316" />
            <HBar label="Re-arrested for Misdemeanor" value={stats.reArrestMisd} max={stats.reArrestMisd} color="#ca8a04" />
            <HBar label="Re-arrested Firearms Offense" value={stats.reArrestFirearms} max={stats.reArrestMisd} color="#7f1d1d" />
          </div>

          <div style={{ padding: '1rem', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '0.5rem' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              <strong style={{ color: '#f87171' }}>The money stat:</strong> {fmt(stats.reArrestVFO)} defendants were re-arrested for a new Violent Felony Offense
              while already awaiting trial on another charge. {fmt(stats.reArrestFirearms)} were re-arrested specifically for firearms offenses.
              These are crimes committed by people who should have been detained.
            </p>
          </div>

          <SourceNote text="NY DCJS — Pretrial Release Data 2024. VFO = Violent Felony Offense per NY Penal Law. Re-arrest figures represent new charges filed during the pretrial period." />
        </Section>

        {/* Section C: Bail by the Numbers */}
        <Section>
          <SectionHeader title="Bail by the Numbers" icon="💰" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            For the minority of defendants who have bail set, these are the amounts:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <BigStat value={dollars(stats.medianBail)} label="Median Bail Amount" color="#ca8a04" sub="Half set below this" />
            <BigStat value={dollars(Math.round(stats.meanBail))} label="Mean Bail Amount" color="#f97316" sub="Pulled up by high outliers" />
            <BigStat value={dollars(stats.maxBail)} label="Maximum Bail Set" color="#dc2626" sub="Highest single case" />
            <BigStat value={fmt(NY_DATA.pretrial_data_2024.bail_statistics.cases_with_bail_amount)} label="Cases with Bail Amount" color="#8b5cf6" sub={`of ${fmt(stats.bailSetCount)} bail-set cases`} />
          </div>

          <div style={{ padding: '1rem', background: 'rgba(202,138,4,0.08)', border: '1px solid rgba(202,138,4,0.2)', borderRadius: '0.5rem' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              The median bail of {dollars(stats.medianBail)} means half of defendants who have bail set face amounts of $5,000 or less.
              The large gap between median and mean ({dollars(Math.round(stats.meanBail))}) reflects a small number of very high-bail cases
              pulling the average up — for most defendants, bail is a relatively low bar.
            </p>
          </div>

          <SourceNote text="NY DCJS — Pretrial Release Data 2024. Bail statistics exclude cases where bail amount was not recorded." />
        </Section>

        {/* Section D: Crime Scale */}
        <Section>
          <SectionHeader title="Crime at Scale — New York 2024" icon="📊" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            New York State crime index and arrest data for 2024, from DCJS and the FBI-UCR compatible reporting system:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <BigStat value={fmt(stats.totalIndexCrimes)} label="Total Index Crimes" color="#dc2626" sub="Reported 2024" />
            <BigStat value={fmt(stats.violentCrimes)} label="Violent Crimes" color="#ef4444" sub="17% of index crimes" />
            <BigStat value={fmt(stats.murder)} label="Murders" color="#7f1d1d" sub="Including non-negligent manslaughter" />
            <BigStat value={fmt(stats.totalArrests)} label="Total Arrests" color="#8b5cf6" sub="Adult arrests statewide" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>VIOLENT CRIME BREAKDOWN</h3>
              <HBar label="Aggravated Assault" value={stats.aggAssault} max={stats.aggAssault} color="#dc2626" />
              <HBar label="Robbery" value={stats.robbery} max={stats.aggAssault} color="#f97316" />
              <HBar label="Forcible Rape" value={NY_DATA.crime_index_2024.forcible_rape} max={stats.aggAssault} color="#7f1d1d" />
              <HBar label="Murder" value={stats.murder} max={stats.aggAssault} color="#450a0a" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>ARREST BREAKDOWN</h3>
              <HBar label="Felony Arrests" value={stats.felonyArrests} max={stats.misdArrests} color="#dc2626" />
              <HBar label="Misdemeanor Arrests" value={stats.misdArrests} max={stats.misdArrests} color="#ca8a04" />
              <HBar label="Violent Felony Arrests" value={stats.violentFelonyArrests} max={stats.misdArrests} color="#f97316" />
              <HBar label="Drug Felony Arrests" value={NY_DATA.adult_arrests_2024.drug_felony} max={stats.misdArrests} color="#8b5cf6" />
            </div>
          </div>

          <SourceNote text="NY Division of Criminal Justice Services — Crime Index 2024; Adult Arrests by County 2024. Index crimes follow FBI UCR definitions." />
        </Section>

        {/* Section E: Jail Population */}
        <Section>
          <SectionHeader title="Jail Population — The Unconvicted Majority" icon="🏛️" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            New York's jail population reveals a paradox: most people behind bars haven't been convicted of anything.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <BigStat value={fmt(stats.jailCensus)} label="Total Jail Population" color="#dc2626" sub={`${fmt(NY_DATA.jail_population_2024.total_facilities)} facilities`} />
            <BigStat value={fmt(stats.jailUnsentenced)} label="Unsentenced (Pretrial)" color="#f97316" sub={`${pct(stats.jailUnsentencedPct, 0)} of jail population`} />
            <BigStat value={fmt(stats.jailSentenced)} label="Sentenced" color="#16a34a" sub={`${pct(share(stats.jailSentenced, stats.jailCensus), 0)} of jail population`} />
          </div>

          <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>JAIL POPULATION COMPOSITION</h3>
            <div style={{ display: 'flex', height: '28px', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
              <div style={{ width: `${stats.jailUnsentencedPct}%`, background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 700 }}>Unsentenced {pct(stats.jailUnsentencedPct, 0)}</span>
              </div>
              <div style={{ width: `${share(stats.jailSentenced, stats.jailCensus)}%`, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 700 }}>Sentenced {pct(share(stats.jailSentenced, stats.jailCensus), 0)}</span>
              </div>
              <div style={{ flex: 1, background: '#374151' }} />
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '0.5rem' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              <strong style={{ color: '#f87171' }}>Most people in NY jails haven't even been convicted.</strong>{' '}
              {pct(stats.jailUnsentencedPct, 0)} — {fmt(stats.jailUnsentenced)} people — are held pretrial, awaiting trial or disposition.
              This reflects the tension between NY's expansive bail reform (which releases most defendants) and those the courts do decide to hold.
            </p>
          </div>

          <SourceNote text="NY Division of Criminal Justice Services / NY DOCCS — Jail Population by County 2024–2025. Technical parole violators excluded from sentenced/unsentenced counts." />
        </Section>

        {/* Section F: Recidivism */}
        <Section>
          <SectionHeader title="Recidivism — Who Comes Back?" icon="🔄" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            3-year recidivism tracking for New York State prison releases (latest available data: 2019–2021 cohorts):
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <BigStat value={`${stats.recidivism2019}%`} label="2019 Cohort Return Rate" color="#dc2626" sub="3-yr return to prison" />
            <BigStat value={`${stats.recidivism2020}%`} label="2020 Cohort Return Rate" color="#ca8a04" sub="3-yr return to prison" />
            <BigStat value={`${stats.recidivism2021}%`} label="2021 Cohort Return Rate" color="#16a34a" sub="3-yr return to prison" />
          </div>

          <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>RECIDIVISM TREND</h3>
            <HBar label="2019: 24.8%" value={stats.recidivism2019} max={30} color="#dc2626" suffix="%" />
            <HBar label="2020: 19.1%" value={stats.recidivism2020} max={30} color="#ca8a04" suffix="%" />
            <HBar label="2021: 18.7%" value={stats.recidivism2021} max={30} color="#16a34a" suffix="%" />
          </div>

          <div style={{ padding: '1rem', background: 'rgba(202,138,4,0.08)', border: '1px solid rgba(202,138,4,0.2)', borderRadius: '0.5rem' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              <strong style={{ color: '#fbbf24' }}>Trending down — but with an asterisk.</strong>{' '}
              The apparent improvement from 24.8% (2019) to 18.7% (2021) coincides with the COVID-19 pandemic, which suppressed both crime rates
              and law enforcement activity during the tracking period. The true improvement may be less dramatic than these figures suggest.
              Regardless, nearly 1-in-5 released prisoners return within 3 years.
            </p>
          </div>

          <SourceNote text="NY DCJS / DOCCS — Recidivism Tracking 2019–2021 Cohorts. 'Return' defined as re-incarceration in NY state prison within 3 years of release. 2021 is the most recent available cohort." />
        </Section>

        {/* Section G: Key Findings */}
        <Section>
          <SectionHeader title="Key Findings" icon="🚨" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {[
              {
                icon: '🔓',
                color: '#dc2626',
                title: `${stats.totalReleasedPct}% Release Rate`,
                body: `Two-thirds of all defendants arraigned in New York — ${fmt(stats.rorCount + stats.nmrCount)} people — are released before trial, the vast majority without monetary bail.`,
              },
              {
                icon: '🔫',
                color: '#dc2626',
                title: 'Violent Felons Re-Arrested',
                body: `${fmt(stats.reArrestVFO)} defendants were re-arrested for a new violent felony while awaiting trial. ${fmt(stats.reArrestFirearms)} faced new firearms charges.`,
              },
              {
                icon: '⚖️',
                color: '#f97316',
                title: `${fmt(stats.vfoCount)} Violent Felony Cases`,
                body: `There were ${fmt(stats.vfoCount)} Violent Felony Offense arraignments in 2024. Based on overall release rates, an estimated ${fmt(stats.vfoReleasedEst)} were released pretrial.`,
              },
              {
                icon: '🏛️',
                color: '#ca8a04',
                title: `${pct(stats.jailUnsentencedPct, 0)} of Jail Population Unconvicted`,
                body: `${fmt(stats.jailUnsentenced)} of ${fmt(stats.jailCensus)} jail inmates are awaiting trial, not serving a sentence. Most people behind bars in NY haven't been convicted.`,
              },
              {
                icon: '📈',
                color: '#8b5cf6',
                title: `${fmt(stats.totalIndexCrimes)} Index Crimes in 2024`,
                body: `New York recorded ${fmt(stats.violentCrimes)} violent crimes including ${fmt(stats.murder)} murders, ${fmt(stats.robbery)} robberies, and ${fmt(stats.aggAssault)} aggravated assaults.`,
              },
              {
                icon: '🔄',
                color: '#6b7280',
                title: 'Recidivism Still ~1-in-5',
                body: `Despite a downward trend (possibly COVID-influenced), 18.7% of released prisoners return to state prison within 3 years — nearly 1 in 5.`,
              },
            ].map(({ icon, color, title, body }) => (
              <div key={title} style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '1rem', borderLeft: `3px solid ${color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{title}</strong>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0, lineHeight: 1.6 }}>{body}</p>
              </div>
            ))}
          </div>

          <SourceNote text="NY Division of Criminal Justice Services — Pretrial Release Data, Jail Population, Adult Arrests, Crime Index 2024. Recidivism 2019–2021 Cohorts." />
        </Section>

      </main>
    </div>
  );
}

// ─── Coming Soon ───────────────────────────────────────────────────────────────

function ComingSoonPage({ stateCode }: { stateCode: string }) {
  const info = AVAILABLE_STATES[stateCode];
  const name = info?.name ?? stateCode.toUpperCase();

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', padding: '1.5rem 1rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <Link href="/state-deep-dives" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>← State Deep Dives</Link>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {name} — Deep Dive
          </h1>
        </div>
      </header>
      <main style={{ maxWidth: '72rem', margin: '0 auto', padding: '4rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔬</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
          Coming Soon — Data Collection in Progress
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '40rem', margin: '0 auto 2rem', lineHeight: 1.6 }}>
          We're actively pulling and processing {name} state court data. This page will show prosecutorial decisions,
          sentencing patterns, bail statistics, and recidivism trends — sourced directly from official state records.
        </p>
        <Link
          href="/state-deep-dives"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: 'var(--red-primary)',
            color: '#fff',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          ← View Available States
        </Link>
      </main>
    </div>
  );
}

// ─── Main route ────────────────────────────────────────────────────────────────

export default function StateDeepDivePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = use(params);
  const code = state.toLowerCase();

  if (code === 'il') return <IllinoisPage />;
  if (code === 'ny') return <NewYorkPage />;
  return <ComingSoonPage stateCode={code} />;
}

export function generateStaticParams() {
  return [
    { state: 'il' },
    { state: 'ny' },
    { state: 'ca' },
    { state: 'tx' },
    { state: 'fl' },
  ];
}
