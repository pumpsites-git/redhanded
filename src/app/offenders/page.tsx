'use client';

import { useState } from 'react';
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
  getOffenseIcon,
  getOffenseColor,
} from '@/lib/offenders';

const analytics = getAnalytics();
const catStats = getCategoryStats();
const topOffenses = getTopOffenses(12);
const { summary, worstOffenders, sentencingPatterns, disparityAnalysis } = analytics;
const cat6 = worstOffenders.categoryVI;
const firearm = sentencingPatterns.firearmEnhancement;

// ─── Sub-components ────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1.25rem 1.5rem',
        flex: '1 1 160px',
      }}
    >
      <div
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: accent ?? 'var(--text-primary)',
          lineHeight: 1.1,
          marginBottom: '0.25rem',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h2
        style={{
          fontSize: '1.35rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
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
}: {
  label: string;
  value: number;
  maxValue: number;
  displayValue: string;
  color: string;
  subLabel?: string;
}) {
  const pctWidth = maxValue > 0 ? (value / maxValue) * 100 : 0;
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
          height: '8px',
          background: 'var(--border)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pctWidth}%`,
            background: color,
            borderRadius: '4px',
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

// ─── Page ──────────────────────────────────────────────────────────────────

export default function OffendersPage() {
  const [expandedOffense, setExpandedOffense] = useState<string | null>(null);

  const totalCases = analytics.totalCases;
  const maxSentByRace = Math.max(...Object.values(disparityAnalysis.sentenceByRace));
  const maxSentByGender = Math.max(...Object.values(disparityAnalysis.sentenceByGender));
  const maxBelowByRace = Math.max(...Object.values(disparityAnalysis.belowGuidelinesByRace));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <header
        style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          padding: '2rem 1rem',
        }}
      >
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🔍</span>
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Federal Criminal Analytics
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0 0 1.5rem 0' }}>
            Understanding federal crime patterns — who is sentenced, for what, and how.
            All cases are <strong style={{ color: 'var(--text-primary)' }}>fully anonymized</strong>.
            No names, addresses, or identifying details are included.
          </p>

          {/* Top stat boxes */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <StatBox
              label="Cases Analyzed"
              value={fmtNum(totalCases)}
              sub="FY2025 federal criminal cases"
            />
            <StatBox
              label="Avg Sentence"
              value={formatSentenceMonths(summary.avgSentenceMonths)}
              sub="Across all offense types"
            />
            <StatBox
              label="Avg Age at Sentencing"
              value={`${summary.avgAge} yrs`}
              sub="Federal offenders"
            />
            <StatBox
              label="Career Criminals (Cat VI)"
              value={fmtNum(cat6.count)}
              sub={`${pct(cat6.count / totalCases * 100)} of all federal cases`}
              accent="var(--red-primary)"
            />
            <StatBox
              label="Firearm Enhancement"
              value={fmtNum(firearm.count)}
              sub={`${pct(firearm.pctOfCases)} of all cases`}
              accent="#f97316"
            />
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* ── Data disclaimer ─────────────────────────────────────────── */}
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
          U.S. Sentencing Commission, FY2025 Annual Datafile — 66,662 federal criminal cases.
          Data is fully anonymized per USSC policy. This analysis is for transparency and public accountability.
        </div>

        {/* ═══ SECTION 1: Criminal History Deep Dive ═══════════════════ */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionHeader
            icon="📋"
            title="Criminal History Deep Dive"
            subtitle="Federal courts classify offenders into six Criminal History Categories (I–VI) based on prior convictions and their severity. Category I represents first-time or minimal-history offenders; Category VI represents career criminals with the most extensive records."
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {catStats.map((cat) => {
              const isVI = cat.category === 6;
              return (
                <div
                  key={cat.category}
                  className={isVI ? 'red-glow' : ''}
                  style={{
                    background: cat.bg,
                    border: `1px solid ${cat.border}`,
                    borderRadius: '0.875rem',
                    padding: isVI ? '1.5rem' : '1.25rem',
                    position: 'relative',
                    ...(isVI
                      ? {
                          gridColumn: 'span 2',
                          borderWidth: '2px',
                        }
                      : {}),
                  }}
                >
                  {isVI && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.875rem',
                        right: '1rem',
                        background: 'var(--red-primary)',
                        color: '#fff',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Career Criminal
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: isVI ? '1.1rem' : '0.95rem',
                      fontWeight: 700,
                      color: cat.color,
                      marginBottom: '0.375rem',
                    }}
                  >
                    {cat.label}
                  </div>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.875rem',
                    }}
                  >
                    {cat.description}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: isVI ? '1.6rem' : '1.4rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {fmtNum(cat.count)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        cases ({pct(cat.pctOfTotal)})
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: isVI ? '1.6rem' : '1.4rem',
                          fontWeight: 700,
                          color: cat.color,
                        }}
                      >
                        {formatSentenceMonths(cat.avgSentence)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        avg sentence
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {cat.avgAge} yrs
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>avg age</div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          color: cat.belowGuidelinesPct > 50 ? '#f59e0b' : 'var(--text-primary)',
                        }}
                      >
                        {pct(cat.belowGuidelinesPct)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        below guidelines
                      </div>
                    </div>
                  </div>

                  {/* Top offenses */}
                  <div
                    style={{
                      borderTop: `1px solid ${cat.border}`,
                      paddingTop: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        marginBottom: '0.4rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Top Offense Types
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.35rem',
                      }}
                    >
                      {cat.topOffenses.slice(0, isVI ? 6 : 4).map(([offense, count]) => (
                        <span
                          key={offense}
                          style={{
                            fontSize: '0.72rem',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid var(--border)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '999px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {getOffenseIcon(offense)} {offense}{' '}
                          <span style={{ color: 'var(--text-muted)' }}>({fmtNum(count as number)})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Category progression bar */}
          <div
            style={{
              marginTop: '1.5rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '0.875rem',
              padding: '1.25rem',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Average Sentence by Criminal History Category
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
          </div>
        </section>

        {/* ═══ SECTION 2: Career Criminal Spotlight ════════════════════ */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionHeader
            icon="🚨"
            title="Career Criminals: Category VI Spotlight"
            subtitle="Offenders in Criminal History Category VI have accumulated the most severe prior criminal records in the federal system. These are individuals with 13+ criminal history points."
          />

          <div
            className="red-glow"
            style={{
              background: 'rgba(127, 29, 29, 0.15)',
              border: '2px solid rgba(220, 38, 38, 0.4)',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '1rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    color: 'var(--red-primary)',
                    lineHeight: 1,
                  }}
                >
                  {fmtNum(cat6.count)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Category VI offenders
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    color: '#f97316',
                    lineHeight: 1,
                  }}
                >
                  {formatSentenceMonths(cat6.avgSentence)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  avg sentence
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                  }}
                >
                  {pct((cat6.count / totalCases) * 100)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  of all federal cases
                </div>
              </div>
            </div>

            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                margin: '0 0 1.25rem',
                lineHeight: 1.6,
              }}
            >
              These individuals have extensive criminal histories and represent the highest-risk
              offenders in the federal system. Category VI requires 13 or more criminal history
              points, reflecting a pattern of serious, repeated criminal behavior.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Top offense types */}
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.75rem',
                  }}
                >
                  What They&apos;re Charged With
                </div>
                {Object.entries(cat6.topOffenseTypes)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([offense, count]) => (
                    <BarRow
                      key={offense}
                      label={`${getOffenseIcon(offense)} ${offense}`}
                      value={count}
                      maxValue={Object.values(cat6.topOffenseTypes)[0]}
                      displayValue={fmtNum(count)}
                      color={getOffenseColor(offense)}
                    />
                  ))}
              </div>

              {/* By district */}
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.75rem',
                  }}
                >
                  Concentrated in These Districts
                </div>
                {Object.entries(cat6.byDistrict)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([districtCode, count]) => (
                    <BarRow
                      key={districtCode}
                      label={`District ${districtCode}`}
                      value={count}
                      maxValue={Object.values(cat6.byDistrict)[0]}
                      displayValue={fmtNum(count)}
                      color="var(--red-primary)"
                    />
                  ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 3: Sentencing Disparity ════════════════════════ */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionHeader
            icon="⚖️"
            title="Sentencing Disparity Analysis"
            subtitle="This section presents objective differences in sentencing outcomes across demographic groups. Data shows patterns, not intent — disparities can reflect differences in offense type, criminal history, and other legally relevant factors."
          />

          <div
            style={{
              background: 'rgba(99, 102, 241, 0.07)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '0.75rem',
              padding: '0.875rem 1.25rem',
              marginBottom: '1.5rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}
          >
            ⚠️ <strong style={{ color: 'var(--text-primary)' }}>Important context:</strong> Raw
            sentence averages do not control for offense severity, criminal history, or cooperation
            with prosecutors. These figures reflect the full dataset without adjustments. Researchers
            studying disparities typically use regression analysis to isolate demographic effects.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Sentence by race */}
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
                  marginBottom: '0.25rem',
                }}
              >
                Avg Sentence by Race
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem',
                }}
              >
                Unadjusted average sentence in months
              </div>
              {Object.entries(disparityAnalysis.sentenceByRace)
                .sort((a, b) => b[1] - a[1])
                .map(([race, months]) => (
                  <BarRow
                    key={race}
                    label={RACE_LABELS[race] ?? race}
                    value={months}
                    maxValue={maxSentByRace}
                    displayValue={formatSentenceMonths(months)}
                    color={RACE_COLORS[race] ?? '#6b7280'}
                    subLabel={`${fmtNum(disparityAnalysis.casesbyRace[race] ?? 0)} cases`}
                  />
                ))}
            </div>

            {/* Sentence by gender */}
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
                  marginBottom: '0.25rem',
                }}
              >
                Avg Sentence by Gender
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem',
                }}
              >
                Unadjusted average sentence in months
              </div>
              {Object.entries(disparityAnalysis.sentenceByGender)
                .sort((a, b) => b[1] - a[1])
                .map(([gender, months]) => (
                  <BarRow
                    key={gender}
                    label={gender}
                    value={months}
                    maxValue={maxSentByGender}
                    displayValue={formatSentenceMonths(months)}
                    color={GENDER_COLORS[gender] ?? '#6b7280'}
                    subLabel={`${fmtNum(disparityAnalysis.casesByGender[gender] ?? 0)} cases`}
                  />
                ))}

              <div
                style={{
                  marginTop: '1.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.25rem',
                }}
              >
                Gender Breakdown of Cases
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                {Object.entries(summary.genderBreakdown).map(([gender, pctVal]) => (
                  <div
                    key={gender}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: GENDER_COLORS[gender] ?? 'var(--text-primary)',
                      }}
                    >
                      {pct(pctVal)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{gender}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Below guidelines by race */}
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
                  marginBottom: '0.25rem',
                }}
              >
                Below-Guidelines Rate by Race
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem',
                }}
              >
                % of sentences below the USSC recommended range
              </div>
              {Object.entries(disparityAnalysis.belowGuidelinesByRace)
                .sort((a, b) => b[1] - a[1])
                .map(([race, pctVal]) => (
                  <BarRow
                    key={race}
                    label={RACE_LABELS[race] ?? race}
                    value={pctVal}
                    maxValue={maxBelowByRace}
                    displayValue={pct(pctVal)}
                    color={RACE_COLORS[race] ?? '#6b7280'}
                  />
                ))}
            </div>

            {/* Below guidelines by gender */}
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
                  marginBottom: '0.25rem',
                }}
              >
                Below-Guidelines Rate by Gender
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem',
                }}
              >
                % of sentences below the USSC recommended range
              </div>
              {Object.entries(disparityAnalysis.belowGuidelinesByGender)
                .sort((a, b) => b[1] - a[1])
                .map(([gender, pctVal]) => (
                  <BarRow
                    key={gender}
                    label={gender}
                    value={pctVal}
                    maxValue={Math.max(...Object.values(disparityAnalysis.belowGuidelinesByGender))}
                    displayValue={pct(pctVal)}
                    color={GENDER_COLORS[gender] ?? '#6b7280'}
                  />
                ))}

              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.875rem',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '0.5rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                📌 Research consistently finds women receive below-guidelines sentences at higher
                rates. Factors include primary caregiver status, cooperation rates, and
                prosecutorial discretion.
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 4: Firearm Enhancement ═════════════════════════ */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionHeader
            icon="🔫"
            title="Firearm Enhancement (18 U.S.C. § 924(c))"
            subtitle="Cases where defendants faced mandatory sentencing enhancements for using or possessing a firearm in connection with a crime of violence or drug trafficking offense."
          />

          <div
            style={{
              background: 'rgba(249, 115, 22, 0.08)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              borderRadius: '1rem',
              padding: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: '1 1 200px' }}>
              <div
                style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f97316', lineHeight: 1 }}
              >
                {fmtNum(firearm.count)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                cases with firearm enhancement ({pct(firearm.pctOfCases)})
              </div>
            </div>

            <div style={{ flex: '2 1 350px' }}>
              <div style={{ marginBottom: '0.875rem' }}>
                <BarRow
                  label="With Firearm Enhancement"
                  value={firearm.avgSentenceWith}
                  maxValue={firearm.avgSentenceWith}
                  displayValue={formatSentenceMonths(firearm.avgSentenceWith)}
                  color="#f97316"
                />
                <BarRow
                  label="Without Firearm Enhancement"
                  value={firearm.avgSentenceWithout}
                  maxValue={firearm.avgSentenceWith}
                  displayValue={formatSentenceMonths(firearm.avgSentenceWithout)}
                  color="#6366f1"
                />
              </div>
              <div
                style={{
                  padding: '0.75rem',
                  background: 'rgba(249, 115, 22, 0.08)',
                  borderRadius: '0.5rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                🎯 Firearm enhancement cases receive sentences{' '}
                <strong style={{ color: '#f97316' }}>
                  {(firearm.avgSentenceWith / firearm.avgSentenceWithout).toFixed(1)}×
                </strong>{' '}
                longer on average than non-enhancement cases.
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 5: Offense Type Breakdown ══════════════════════ */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionHeader
            icon="📁"
            title="Offense Type Analysis"
            subtitle="Breakdown of all federal criminal cases by primary offense category. Click any offense to see detailed statistics."
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {topOffenses.map((offense) => {
              const isExpanded = expandedOffense === offense.name;
              const color = getOffenseColor(offense.name);
              const icon = getOffenseIcon(offense.name);
              return (
                <div
                  key={offense.name}
                  onClick={() => setExpandedOffense(isExpanded ? null : offense.name)}
                  style={{
                    background: isExpanded ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                    border: `1px solid ${isExpanded ? color : 'var(--border)'}`,
                    borderRadius: '0.75rem',
                    padding: '1rem 1.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Header row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: isExpanded ? '0.75rem' : 0,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                      <span
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {offense.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          color,
                        }}
                      >
                        {pct(offense.pctOfTotal)}
                      </span>
                      <span
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--text-muted)',
                          transform: isExpanded ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                          display: 'inline-block',
                        }}
                      >
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      height: '4px',
                      background: 'var(--border)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      margin: '0.5rem 0',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${offense.pctOfTotal}%`,
                        background: color,
                        borderRadius: '2px',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>{fmtNum(offense.count)} cases</span>
                    <span>Avg: {formatSentenceMonths(offense.avgSentence)}</span>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: '0.875rem',
                        paddingTop: '0.875rem',
                        borderTop: '1px solid var(--border)',
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '0.75rem',
                        }}
                      >
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            borderRadius: '0.5rem',
                            padding: '0.75rem',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '1.25rem',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {formatSentenceMonths(offense.avgSentence)}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            avg sentence
                          </div>
                        </div>
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            borderRadius: '0.5rem',
                            padding: '0.75rem',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '1.25rem',
                              fontWeight: 700,
                              color: offense.belowGuidelinesPct > 50 ? '#f59e0b' : 'var(--text-primary)',
                            }}
                          >
                            {pct(offense.belowGuidelinesPct)}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            below guidelines
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer attribution */}
        <footer
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '1.5rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          Source: U.S. Sentencing Commission, FY2025 Annual Datafile · All cases anonymized ·{' '}
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
