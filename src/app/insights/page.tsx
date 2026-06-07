'use client';

import {
  getAnalytics,
  getCategoryStats,
  getTopOffenses,
  formatSentenceMonths,
  fmtNum,
  pct,
  RACE_COLORS,
  GENDER_COLORS,
  RACE_LABELS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  EDUCATION_ORDER,
  getOffenseIcon,
  getOffenseColor,
} from '@/lib/offenders';

const analytics = getAnalytics();
const catStats = getCategoryStats();
const topOffenses = getTopOffenses(10);

const {
  summary,
  criminalHistoryAnalysis,
  sentencingPatterns,
  disparityAnalysis,
  totalCases,
} = analytics;

// ─── Helpers ───────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  subtitle,
  accentColor,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  accentColor?: string;
}) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h2
        style={{
          fontSize: '1.35rem',
          fontWeight: 700,
          color: accentColor ?? 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.375rem',
        }}
      >
        <span>{icon}</span> {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function BarRow({
  label,
  value,
  maxValue,
  displayValue,
  color,
  subLabel,
  height = 8,
}: {
  label: string;
  value: number;
  maxValue: number;
  displayValue: string;
  color: string;
  subLabel?: string;
  height?: number;
}) {
  const pctWidth = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '0.3rem',
        }}
      >
        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
          {label}
        </span>
        <span style={{ fontSize: '0.875rem', color, fontWeight: 600 }}>{displayValue}</span>
      </div>
      <div
        style={{
          height: `${height}px`,
          background: 'var(--border)',
          borderRadius: `${height / 2}px`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pctWidth}%`,
            background: color,
            borderRadius: `${height / 2}px`,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      {subLabel && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          {subLabel}
        </div>
      )}
    </div>
  );
}

function InfoCard({
  title,
  children,
  accent,
}: {
  title?: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${accent ?? 'var(--border)'}`,
        borderRadius: '0.875rem',
        padding: '1.25rem',
      }}
    >
      {title && (
        <div
          style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '0.875rem',
            paddingBottom: '0.625rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Derived data ──────────────────────────────────────────────────────────

// For "is the system working" — higher cat = more repeat offenders
// Use belowGuidelinesByCategory as a proxy for leniency
const belowByCat = criminalHistoryAnalysis.belowGuidelinesByCategory;
const avgSentByCat = criminalHistoryAnalysis.avgSentenceByCategory;

// Category recidivism proxy: % who are Cat 3+ is the "repeat offender pool"
// True recidivism isn't directly in data, but we can show criminal history escalation
const catDistTotal = Object.values(criminalHistoryAnalysis.categoryDistribution).reduce(
  (a, b) => a + b,
  0
);
const repeatOffenders = Object.entries(criminalHistoryAnalysis.categoryDistribution)
  .filter(([k]) => Number(k) >= 2)
  .reduce((a, [, v]) => a + v, 0);
const repeatRate = catDistTotal > 0 ? (repeatOffenders / catDistTotal) * 100 : 0;

// Top offense sentences for "sentencing effectiveness"
const sentByOffense = sentencingPatterns.avgSentenceByOffenseType;
const maxOffenseSent = Math.max(...Object.values(sentByOffense));

// Education sentence data  
const eduSents = disparityAnalysis.sentenceByEducation;
const maxEduSent = Math.max(...Object.values(eduSents));

// Below-guidelines rates for offense types
const belowByOffense = sentencingPatterns.belowGuidelines.byOffenseType;
const sortedBelowByOffense = Object.entries(belowByOffense).sort((a, b) => b[1] - a[1]);

// Key findings
const keyFindings = [
  {
    icon: '📈',
    title: 'Sentences scale with criminal history',
    text: `Average sentences increase from ${formatSentenceMonths(Number(avgSentByCat['1']))} (Cat I) to ${formatSentenceMonths(Number(avgSentByCat['6']))} (Cat VI) — a ${Math.round(Number(avgSentByCat['6']) / Number(avgSentByCat['1']) * 10) / 10}× difference.`,
    color: '#16a34a',
  },
  {
    icon: '⚠️',
    title: 'Most sentences fall below guidelines',
    text: `Across all cases, the majority of sentences are below the USSC recommended range. Career criminals (Cat VI) receive below-guidelines sentences ${pct(Number(belowByCat['6']))} of the time.`,
    color: '#f59e0b',
  },
  {
    icon: '👥',
    title: `${pct(repeatRate)} are repeat offenders`,
    text: `${fmtNum(repeatOffenders)} of ${fmtNum(catDistTotal)} offenders have prior criminal records (Category II or higher), indicating prior system contact.`,
    color: '#f97316',
  },
  {
    icon: '🔫',
    title: 'Firearm enhancements dramatically increase sentences',
    text: `Cases with 18 U.S.C. § 924(c) enhancements receive sentences averaging ${formatSentenceMonths(analytics.sentencingPatterns.firearmEnhancement.avgSentenceWith)} — vs ${formatSentenceMonths(analytics.sentencingPatterns.firearmEnhancement.avgSentenceWithout)} without.`,
    color: '#ef4444',
  },
  {
    icon: '🌐',
    title: 'Immigration dominates federal criminal dockets',
    text: `Immigration offenses account for ${pct((25290 / totalCases) * 100)} of all federal criminal cases, with an average sentence of just ${formatSentenceMonths(10.2)}.`,
    color: '#6366f1',
  },
  {
    icon: '⚖️',
    title: 'Gender gap in sentencing is substantial',
    text: `Female defendants receive significantly shorter sentences on average and are sentenced below guidelines ${pct(disparityAnalysis.belowGuidelinesByGender['Female'] ?? 0)} of the time, vs ${pct(disparityAnalysis.belowGuidelinesByGender['Male'] ?? 0)} for males.`,
    color: '#ec4899',
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Hero */}
      <header
        style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          padding: '2rem 1rem',
        }}
      >
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem' }}>💡</span>
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              System Insights &amp; Analytics
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
            What the data reveals about federal sentencing effectiveness, recidivism patterns,
            and demographic outcomes. Data is objective; interpretation requires context.
          </p>
        </div>
      </header>

      <main style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Attribution */}
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '0.75rem',
            padding: '0.875rem 1.25rem',
            marginBottom: '2rem',
            fontSize: '0.825rem',
            color: 'var(--text-secondary)',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>📊 Source: </strong>
          U.S. Sentencing Commission, FY2025 Annual Datafile — {fmtNum(totalCases)} federal criminal
          cases, fully anonymized. Analysis reflects raw data patterns; causation requires additional
          research.
        </div>

        {/* ═══ SECTION 1: Is the System Working? ═══════════════════════ */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionHeader
            icon="🤔"
            title="Is the System Working?"
            subtitle='Key question: Are sentences proportional to risk, and do lenient sentences correlate with repeat offending? The data shows that higher criminal history categories receive both longer sentences AND more below-guidelines departures — raising the question of whether leniency is applied where it matters most.'
          />

          {/* Overview boxes */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}
          >
            {[
              {
                label: 'Cases w/ Prior Record',
                value: pct(repeatRate),
                sub: `${fmtNum(repeatOffenders)} offenders`,
                color: '#f97316',
              },
              {
                label: 'First-Time Offenders (Cat I)',
                value: pct((Number(criminalHistoryAnalysis.categoryDistribution['1']) / catDistTotal) * 100),
                sub: fmtNum(Number(criminalHistoryAnalysis.categoryDistribution['1'])),
                color: '#16a34a',
              },
              {
                label: 'Career Criminals (Cat VI)',
                value: pct((Number(criminalHistoryAnalysis.categoryDistribution['6']) / catDistTotal) * 100),
                sub: fmtNum(Number(criminalHistoryAnalysis.categoryDistribution['6'])),
                color: 'var(--red-primary)',
              },
              {
                label: 'Avg Below-Guidelines Rate',
                value: pct(
                  Object.values(sentencingPatterns.belowGuidelines.byCriminalHistory).reduce(
                    (a, b) => a + Number(b),
                    0
                  ) / Object.values(sentencingPatterns.belowGuidelines.byCriminalHistory).length
                ),
                sub: 'All categories combined',
                color: '#f59e0b',
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                }}
              >
                <div
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: item.color,
                    lineHeight: 1.1,
                  }}
                >
                  {item.value}
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    marginTop: '0.25rem',
                  }}
                >
                  {item.label}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {item.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Leniency vs recidivism analysis */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <InfoCard title="Below-Guidelines Rate by Criminal History">
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.875rem',
                }}
              >
                ⚠️ Counterintuitively, judges grant more below-guidelines departures to higher
                criminal history categories — often for substantial assistance to prosecutors.
              </div>
              {catStats.map((cat) => (
                <BarRow
                  key={cat.category}
                  label={cat.label}
                  value={cat.belowGuidelinesPct}
                  maxValue={100}
                  displayValue={pct(cat.belowGuidelinesPct)}
                  color={cat.color}
                  subLabel={`${fmtNum(cat.count)} cases`}
                />
              ))}
            </InfoCard>

            <InfoCard title="Avg Sentence vs Criminal History — Proportional?">
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.875rem',
                }}
              >
                Sentences do increase with criminal history, but is the escalation steep enough?
                Cat VI offenders receive sentences {Math.round(Number(avgSentByCat['6']) / Number(avgSentByCat['1']) * 10) / 10}×
                longer than Cat I — but commit crimes repeatedly.
              </div>
              {catStats.map((cat) => (
                <BarRow
                  key={cat.category}
                  label={cat.label}
                  value={cat.avgSentence}
                  maxValue={catStats[5].avgSentence}
                  displayValue={formatSentenceMonths(cat.avgSentence)}
                  color={cat.color}
                />
              ))}
            </InfoCard>
          </div>

          {/* Key tension box */}
          <div
            style={{
              marginTop: '1.25rem',
              background: 'rgba(245, 158, 11, 0.07)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '0.875rem',
              padding: '1.25rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.25rem',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#16a34a',
                  marginBottom: '0.5rem',
                }}
              >
                ✅ Evidence the system works
              </div>
              <ul
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  paddingLeft: '1rem',
                  margin: 0,
                  lineHeight: 1.8,
                }}
              >
                <li>Sentences escalate with criminal history (Cat I avg {formatSentenceMonths(catStats[0].avgSentence)} → Cat VI avg {formatSentenceMonths(catStats[5].avgSentence)})</li>
                <li>Firearm enhancements dramatically increase sentences for violent recidivists</li>
                <li>51.4% of federal offenders are first-time (Cat I) — most federal cases are serious but non-repeat</li>
                <li>Guidelines create a structured, predictable framework nationwide</li>
              </ul>
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#f59e0b',
                  marginBottom: '0.5rem',
                }}
              >
                ⚠️ Questions worth asking
              </div>
              <ul
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  paddingLeft: '1rem',
                  margin: 0,
                  lineHeight: 1.8,
                }}
              >
                <li>Career criminals (Cat VI) receive below-guidelines sentences {pct(Number(belowByCat['6']))} of the time — the highest rate of any category</li>
                <li>Drug trafficking has a {pct(Number(belowByOffense['Drug Trafficking'] ?? 67))} below-guidelines rate — are cooperation deals too generous?</li>
                <li>7.5% of federal cases involve career criminals with 13+ prior criminal history points</li>
                <li>Average sentence varies widely by district for the same offense types</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 2: Sentencing Effectiveness ════════════════════ */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionHeader
            icon="📊"
            title="Sentencing Effectiveness by Offense Type"
            subtitle="How long are federal sentences for each offense category, and how often do judges depart below the recommended range? High below-guidelines rates may indicate prosecutorial cooperation deals or judicial discretion patterns."
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <InfoCard title="Longest Average Sentences (by Offense Type)">
              {Object.entries(sentByOffense)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([offense, months]) => (
                  <BarRow
                    key={offense}
                    label={`${getOffenseIcon(offense)} ${offense}`}
                    value={months}
                    maxValue={maxOffenseSent}
                    displayValue={formatSentenceMonths(months)}
                    color={getOffenseColor(offense)}
                  />
                ))}
            </InfoCard>

            <InfoCard title="Below-Guidelines Rate by Offense Type">
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.875rem',
                }}
              >
                Higher rates often indicate substantial assistance agreements (cooperating with
                prosecutors). Not all below-guidelines departures are problematic.
              </div>
              {sortedBelowByOffense.slice(0, 8).map(([offense, pctVal]) => (
                <BarRow
                  key={offense}
                  label={`${getOffenseIcon(offense)} ${offense}`}
                  value={pctVal}
                  maxValue={100}
                  displayValue={pct(pctVal)}
                  color={pctVal > 60 ? '#f59e0b' : pctVal > 40 ? '#6366f1' : '#16a34a'}
                />
              ))}
            </InfoCard>
          </div>

          {/* Offense detail grid */}
          <div
            style={{
              marginTop: '1.25rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {topOffenses.map((offense) => {
              const color = getOffenseColor(offense.name);
              return (
                <div
                  key={offense.name}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span>{getOffenseIcon(offense.name)}</span>
                    <span
                      style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}
                    >
                      {offense.name}
                    </span>
                  </div>
                  <div
                    style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}
                  >
                    {fmtNum(offense.count)} cases · {pct(offense.pctOfTotal)} of total
                  </div>
                  <div
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color,
                    }}
                  >
                    {formatSentenceMonths(offense.avgSentence)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>avg sentence</div>
                  <div
                    style={{
                      marginTop: '0.5rem',
                      fontSize: '0.8rem',
                      color:
                        offense.belowGuidelinesPct > 60
                          ? '#f59e0b'
                          : offense.belowGuidelinesPct > 40
                          ? '#6366f1'
                          : '#16a34a',
                      fontWeight: 600,
                    }}
                  >
                    {pct(offense.belowGuidelinesPct)} below guidelines
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══ SECTION 3: Demographic Patterns ═══════════════════════ */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionHeader
            icon="👥"
            title="Demographic Patterns"
            subtitle="Sentencing outcomes vary significantly across demographic groups. Important: these are raw averages without controlling for offense type, criminal history, or cooperation with prosecutors. Context is essential for interpretation."
          />

          <div
            style={{
              background: 'rgba(99, 102, 241, 0.07)',
              border: '1px solid rgba(99, 102, 241, 0.18)',
              borderRadius: '0.75rem',
              padding: '0.875rem 1.25rem',
              marginBottom: '1.5rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>⚠️ Important context: </strong>
            Racial and gender differences in raw sentencing averages are heavily influenced by
            differences in offense mix. Hispanic defendants are predominantly immigration cases
            (short sentences). White defendants skew toward fraud. Black defendants are more
            concentrated in drug and weapons cases. Without controlling for these factors,
            direct comparisons can be misleading.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Race breakdown */}
            <InfoCard title="Case Distribution by Race">
              {Object.entries(summary.raceCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([race, count]) => (
                  <BarRow
                    key={race}
                    label={RACE_LABELS[race] ?? race}
                    value={count}
                    maxValue={Math.max(...Object.values(summary.raceCounts))}
                    displayValue={`${fmtNum(count)} (${pct(summary.raceBreakdown[race] ?? 0)})`}
                    color={RACE_COLORS[race] ?? '#6b7280'}
                  />
                ))}
            </InfoCard>

            {/* Sentence by race with context */}
            <InfoCard title="Avg Sentence by Race — With Context">
              <div style={{ marginBottom: '1rem' }}>
                {Object.entries(disparityAnalysis.sentenceByRace)
                  .sort((a, b) => b[1] - a[1])
                  .map(([race, months]) => (
                    <BarRow
                      key={race}
                      label={RACE_LABELS[race] ?? race}
                      value={months}
                      maxValue={Math.max(...Object.values(disparityAnalysis.sentenceByRace))}
                      displayValue={formatSentenceMonths(months)}
                      color={RACE_COLORS[race] ?? '#6b7280'}
                    />
                  ))}
              </div>
              <div
                style={{
                  padding: '0.75rem',
                  background: 'rgba(99, 102, 241, 0.07)',
                  borderRadius: '0.5rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                📌 Hispanic defendants have the lowest raw average sentence because{' '}
                {pct(summary.citizenshipBreakdown['Illegal Alien'] ?? 0)} of federal defendants
                are undocumented — and immigration offenses (§2L) average just{' '}
                {formatSentenceMonths(10.2)} per case.
              </div>
            </InfoCard>

            {/* Education analysis */}
            <InfoCard title="Sentence by Education Level">
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.875rem',
                }}
              >
                Higher education correlates with longer sentences — reflecting the nature of
                white-collar crimes (fraud, tax offenses) which require education to commit.
              </div>
              {EDUCATION_ORDER.filter((edu) => edu in eduSents).map((edu) => (
                <BarRow
                  key={edu}
                  label={edu}
                  value={eduSents[edu]}
                  maxValue={maxEduSent}
                  displayValue={formatSentenceMonths(eduSents[edu])}
                  color="#6366f1"
                />
              ))}
            </InfoCard>

            {/* Citizenship breakdown */}
            <InfoCard title="Federal Case Citizenship Breakdown">
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.875rem',
                }}
              >
                Nearly 40% of federal criminal defendants are non-citizens — largely due to
                the federal jurisdiction over immigration enforcement.
              </div>
              {Object.entries(summary.citizenshipBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([cit, pctVal]) => {
                  const colors: Record<string, string> = {
                    'US Citizen': '#16a34a',
                    'Illegal Alien': '#ef4444',
                    'Legal Resident': '#6366f1',
                    'Other Alien': '#f59e0b',
                    'Unknown Alien': '#64748b',
                  };
                  return (
                    <BarRow
                      key={cit}
                      label={cit}
                      value={pctVal}
                      maxValue={100}
                      displayValue={pct(pctVal)}
                      color={colors[cit] ?? '#6b7280'}
                    />
                  );
                })}
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: 'rgba(239, 68, 68, 0.07)',
                  borderRadius: '0.5rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                📌 The federal court system handles immigration enforcement. Of {fmtNum(totalCases)}{' '}
                cases, ~{pct(39.7)} involve undocumented individuals — primarily for illegal
                reentry (§2L1.2) which carries much shorter sentences than other federal crimes.
              </div>
            </InfoCard>
          </div>

          {/* Gender deep dive */}
          <div
            style={{
              marginTop: '1.25rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '0.875rem',
              padding: '1.25rem',
            }}
          >
            <div
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.875rem',
                paddingBottom: '0.625rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              Gender Sentencing Gap — What the Data Reveals
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.875rem' }}>
              {[
                {
                  label: 'Male defendants',
                  value: pct(summary.genderBreakdown['Male'] ?? 0),
                  sub: `${fmtNum(summary.genderCounts['Male'] ?? 0)} cases`,
                  color: GENDER_COLORS['Male'],
                },
                {
                  label: 'Female defendants',
                  value: pct(summary.genderBreakdown['Female'] ?? 0),
                  sub: `${fmtNum(summary.genderCounts['Female'] ?? 0)} cases`,
                  color: GENDER_COLORS['Female'],
                },
                {
                  label: 'Male avg sentence',
                  value: formatSentenceMonths(disparityAnalysis.sentenceByGender['Male'] ?? 0),
                  sub: 'unadjusted',
                  color: GENDER_COLORS['Male'],
                },
                {
                  label: 'Female avg sentence',
                  value: formatSentenceMonths(disparityAnalysis.sentenceByGender['Female'] ?? 0),
                  sub: 'unadjusted',
                  color: GENDER_COLORS['Female'],
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '0.5rem',
                    padding: '0.875rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 700,
                      color: item.color,
                      lineHeight: 1.1,
                    }}
                  >
                    {item.value}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION 4: Key Takeaways ═══════════════════════════════ */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionHeader
            icon="🎯"
            title="Key Takeaways from FY2025 Data"
            subtitle="Data-driven findings from 66,662 federal criminal cases. These observations are descriptive, not prescriptive."
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            {keyFindings.map((finding) => (
              <div
                key={finding.title}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.875rem',
                  padding: '1.125rem 1.25rem',
                  display: 'flex',
                  gap: '0.875rem',
                }}
              >
                <div style={{ fontSize: '1.4rem', flexShrink: 0, marginTop: '0.1rem' }}>
                  {finding.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: finding.color,
                      marginBottom: '0.3rem',
                    }}
                  >
                    {finding.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {finding.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actionable questions */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '0.875rem',
              padding: '1.25rem',
            }}
          >
            <div
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.875rem',
                paddingBottom: '0.625rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              💬 Questions for Public Accountability
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.875rem',
              }}
            >
              {[
                `Why do Career Criminal (Cat VI) offenders receive below-guidelines sentences ${pct(Number(belowByCat['6']))} of the time — the highest rate of any criminal history category?`,
                `Drug trafficking has a ${pct(Number(belowByOffense['Drug Trafficking'] ?? 67))} below-guidelines rate. Are substantial assistance deals proportionate to public safety costs?`,
                `With 7.5% of federal cases involving career criminals (Cat VI), what rehabilitation programs are available and what is their recidivism impact?`,
                `Given the ${formatSentenceMonths(disparityAnalysis.sentenceByGender['Male'] ?? 0)} vs ${formatSentenceMonths(disparityAnalysis.sentenceByGender['Female'] ?? 0)} gender sentencing gap, how much is explained by offense differences vs judicial discretion?`,
                `Do districts with higher below-guidelines rates for violent offenders see higher rates of repeat offense? Cross-district analysis is needed.`,
                `With immigration comprising ${pct((25290 / totalCases) * 100)} of federal criminal cases, does federal court capacity affect outcomes in other offense categories?`,
              ].map((q, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    padding: '0.875rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Q{i + 1}. </span>
                  {q}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '1.5rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          Source: U.S. Sentencing Commission, FY2025 Annual Datafile · All cases anonymized ·
          Analysis by RedHanded ·{' '}
          <a
            href="https://www.ussc.gov"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-secondary)' }}
          >
            ussc.gov
          </a>
        </footer>
      </main>
    </div>
  );
}
