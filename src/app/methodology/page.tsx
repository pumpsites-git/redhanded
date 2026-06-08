'use client';

import { useState } from 'react';

// ─── Helpers ───────────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <header
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '2rem 1rem',
      }}
    >
      <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.5rem',
          }}
        >
          <span style={{ fontSize: '1.75rem' }}>📐</span>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Methodology &amp; Data Sources
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0 0 0.75rem 0' }}>
          Full transparency on how RedHanded collects, processes, and presents judicial
          accountability data.
        </p>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.75rem',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '999px',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
          }}
        >
          <span>🕐</span> Last Updated: June 2026
        </div>
      </div>
    </header>
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

function Card({
  children,
  accent,
  style: extraStyle,
}: {
  children: React.ReactNode;
  accent?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${accent ?? 'var(--border)'}`,
        borderRadius: '0.875rem',
        padding: '1.25rem',
        ...extraStyle,
      }}
    >
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </div>
  );
}

function Collapsible({
  title,
  icon,
  children,
  defaultOpen = false,
  accentColor,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '0.875rem',
        overflow: 'hidden',
        marginBottom: '0.75rem',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.1rem' }}>{icon}</span>
          <span
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: accentColor ?? 'var(--text-primary)',
            }}
          >
            {title}
          </span>
        </div>
        <span
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            display: 'inline-block',
          }}
        >
          ▼
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: '0 1.25rem 1.25rem',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{ paddingTop: '1rem' }}>{children}</div>
        </div>
      )}
    </div>
  );
}

function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.15rem 0.5rem',
        background: color ? `${color}18` : 'rgba(99,102,241,0.1)',
        border: `1px solid ${color ? `${color}30` : 'rgba(99,102,241,0.2)'}`,
        borderRadius: '0.35rem',
        fontSize: '0.72rem',
        fontWeight: 600,
        color: color ?? '#6366f1',
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </span>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '0.6rem',
        alignItems: 'flex-start',
      }}
    >
      <span
        style={{
          fontSize: '0.78rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          minWidth: '100px',
          flexShrink: 0,
          paddingTop: '0.05rem',
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {value}
      </span>
    </div>
  );
}

function InfoNote({
  children,
  type = 'info',
}: {
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'success';
}) {
  const colors = {
    info: { bg: 'rgba(99,102,241,0.07)', border: 'rgba(99,102,241,0.2)', icon: 'ℹ️' },
    warning: { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.25)', icon: '⚠️' },
    success: { bg: 'rgba(22,163,74,0.07)', border: 'rgba(22,163,74,0.2)', icon: '✅' },
  };
  const c = colors[type];
  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '0.625rem',
        padding: '0.875rem 1rem',
        fontSize: '0.82rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        marginTop: '0.875rem',
      }}
    >
      {children}
    </div>
  );
}

function ScoreRow({
  label,
  weight,
  description,
  color,
}: {
  label: string;
  weight: string;
  description: string;
  color: string;
}) {
  const pct = parseInt(weight);
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.3rem',
        }}
      >
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {label}
        </span>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color }}>{weight}</span>
      </div>
      <div
        style={{
          height: '6px',
          background: 'var(--border)',
          borderRadius: '3px',
          overflow: 'hidden',
          marginBottom: '0.3rem',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: '3px',
          }}
        />
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{description}</p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function MethodologyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <PageHeader />

      <main style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* ═══ SECTION 1: DATA SOURCES ══════════════════════════════════ */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionHeader
            icon="🗄️"
            title="Data Sources"
            subtitle="RedHanded pulls from official government and nonprofit legal databases. All underlying data is publicly available."
          />

          {/* USSC Primary */}
          <Collapsible
            icon="🏛️"
            title="U.S. Sentencing Commission (USSC) — Primary Source"
            defaultOpen={true}
            accentColor="#6366f1"
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.25rem',
              }}
            >
              <div>
                <KV label="What it is" value="Federal Sentencing Guidelines Manual and annual case-level datafiles published by the USSC." />
                <KV
                  label="Dataset"
                  value={
                    <span>
                      FY2025 Individual Offender Datafile —{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>66,662 cases</strong>
                    </span>
                  }
                />
                <KV
                  label="Fields used"
                  value="Offense type, sentence length, guideline range (GLMIN/GLMAX), criminal history category (I–VI), demographics, district, departure type (BOOTEFLT)"
                />
                <KV
                  label="How we use it"
                  value="Calculate below-guidelines rates, offense breakdowns, criminal history severity, and sentencing disparities across districts and judges."
                />
              </div>
              <div>
                <KV
                  label="About the USSC"
                  value="An independent, bipartisan agency of the judicial branch created by Congress under the Sentencing Reform Act of 1984. It establishes sentencing policies and practices for federal courts."
                />
                <KV
                  label="URL"
                  value={
                    <a
                      href="https://www.ussc.gov/research/datafiles/commission-datafiles"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#6366f1', wordBreak: 'break-all' }}
                    >
                      ussc.gov/research/datafiles/commission-datafiles
                    </a>
                  }
                />
                <KV
                  label="Update cadence"
                  value="Annual datafile released ~6 months after fiscal year end. FY2025 covers Oct 1, 2024 – Sep 30, 2025."
                />
                <div style={{ marginTop: '0.5rem' }}>
                  <Badge color="#6366f1">Primary Source</Badge>{' '}
                  <Badge color="#16a34a">Anonymized</Badge>{' '}
                  <Badge color="#f59e0b">FY2025</Badge>
                </div>
              </div>
            </div>
          </Collapsible>

          {/* USSC Criminal History */}
          <Collapsible
            icon="📋"
            title="USSC Criminal History Datafile"
            defaultOpen={false}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.25rem',
              }}
            >
              <div>
                <KV
                  label="What it is"
                  value="Detailed prior offense records for federal defendants, cross-referenced with the individual offender datafile."
                />
                <KV
                  label="How we use it"
                  value="Calculate recidivism and repeat-offender rates per judicial district. Defendants with Criminal History Category > I have at least one documented prior conviction."
                />
              </div>
              <div>
                <KV
                  label="Methodology"
                  value="We count the percentage of defendants per district with Criminal History Category II or higher, indicating prior system contact. This is a district-level metric, not judge-specific."
                />
                <InfoNote type="warning">
                  <strong>Limitation:</strong> This measures repeat offenders entering the system,
                  not re-offense rates after a specific judge's sentencing decision.
                </InfoNote>
              </div>
            </div>
          </Collapsible>

          {/* CourtListener */}
          <Collapsible
            icon="⚖️"
            title="CourtListener / Free Law Project"
            defaultOpen={false}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.25rem',
              }}
            >
              <div>
                <KV
                  label="What it is"
                  value="Open-source legal data platform with comprehensive judge biographies, case dockets, and published opinions."
                />
                <KV
                  label="Data pulled"
                  value="Judge profiles (190 active federal judges), career history, case counts, and opinion counts."
                />
                <KV
                  label="API"
                  value="REST API v4 with rate limiting (5 requests/min, 125 requests/day on the free tier)."
                />
              </div>
              <div>
                <KV
                  label="About Free Law Project"
                  value="A 501(c)(3) nonprofit dedicated to free access to the law. They maintain PACER-alternative data and the largest free collection of US court opinions."
                />
                <KV
                  label="URL"
                  value={
                    <a
                      href="https://www.courtlistener.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#6366f1' }}
                    >
                      courtlistener.com
                    </a>
                  }
                />
                <InfoNote type="warning">
                  CourtListener data may have profile gaps for judges appointed after 2023.
                  We supplement missing bios with official court websites.
                </InfoNote>
              </div>
            </div>
          </Collapsible>

          {/* USSC Geography */}
          <Collapsible
            icon="🗺️"
            title="USSC Sentencing Statistics by Geography"
            defaultOpen={false}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.25rem',
              }}
            >
              <div>
                <KV
                  label="What it is"
                  value="Published USSC reports on per-district sentencing patterns, updated annually."
                />
                <KV
                  label="Data"
                  value="Below-guidelines rates, average sentence lengths, and offense distributions for each of the 94 federal judicial districts."
                />
              </div>
              <div>
                <KV
                  label="URL"
                  value={
                    <a
                      href="https://www.ussc.gov/research/data-reports/geography"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#6366f1' }}
                    >
                      ussc.gov/research/data-reports/geography
                    </a>
                  }
                />
                <InfoNote type="success">
                  Geography data allows us to calculate district-level accountability
                  metrics that feed into individual judge scores.
                </InfoNote>
              </div>
            </div>
          </Collapsible>
        </section>

        {/* ═══ SECTION 2: HOW WE CALCULATE SCORES ══════════════════════ */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionHeader
            icon="🧮"
            title="How We Calculate Scores"
            subtitle="Detailed methodology behind every metric displayed on RedHanded. All calculations are reproducible from publicly available data."
          />

          {/* Below-Guidelines Rate */}
          <Collapsible
            icon="📉"
            title="Below-Guidelines Rate"
            defaultOpen={true}
            accentColor="#f59e0b"
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.25rem',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    marginTop: 0,
                  }}
                >
                  The USSC Individual Offender Datafile includes a departure field called{' '}
                  <code
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '0.3rem',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                    }}
                  >
                    BOOTEFLT
                  </code>{' '}
                  which indicates the sentencing outcome relative to the guideline range:
                </p>
                <div style={{ marginBottom: '1rem' }}>
                  {[
                    { val: '1', label: 'Below the guideline range', color: '#f59e0b' },
                    { val: '2', label: 'Within the guideline range', color: '#16a34a' },
                    { val: '3', label: 'Above the guideline range', color: '#ef4444' },
                  ].map(({ val, label, color }) => (
                    <div
                      key={val}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        marginBottom: '0.4rem',
                      }}
                    >
                      <span
                        style={{
                          display: 'flex',
                          width: '1.5rem',
                          height: '1.5rem',
                          background: `${color}20`,
                          border: `1px solid ${color}50`,
                          borderRadius: '0.25rem',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color,
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {val}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    marginTop: 0,
                  }}
                >
                  We calculate the percentage of cases with{' '}
                  <code
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '0.3rem',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                    }}
                  >
                    BOOTEFLT = 1
                  </code>{' '}
                  for each judge and district.
                </p>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '0.5rem',
                    padding: '0.875rem',
                    marginBottom: '0.875rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.4rem',
                    }}
                  >
                    National Average
                  </div>
                  <div
                    style={{
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: '#f59e0b',
                      lineHeight: 1,
                    }}
                  >
                    ~43.7%
                  </div>
                  <div
                    style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}
                  >
                    of all FY2025 cases sentenced below range
                  </div>
                </div>
                <InfoNote type="warning">
                  <strong>Why it matters:</strong> When judges consistently sentence below
                  guidelines — especially for violent offenses — it raises legitimate public safety
                  questions. Below-guidelines departures can be appropriate (substantial
                  cooperation, mitigating circumstances) but patterns warrant scrutiny.
                </InfoNote>
              </div>
            </div>
          </Collapsible>

          {/* Recidivism Rate */}
          <Collapsible
            icon="🔄"
            title="Recidivism / Repeat Offender Rate"
            defaultOpen={false}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.25rem',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    marginTop: 0,
                  }}
                >
                  Criminal History Category II or higher indicates prior convictions under the
                  Federal Sentencing Guidelines. We calculate the percentage of defendants
                  in each district with a prior record.
                </p>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '0.5rem',
                    padding: '0.875rem',
                    marginBottom: '0.875rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.4rem',
                    }}
                  >
                    National Average
                  </div>
                  <div
                    style={{
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: '#ef4444',
                      lineHeight: 1,
                    }}
                  >
                    ~11.8%
                  </div>
                  <div
                    style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}
                  >
                    of defendants are Category II+ per district
                  </div>
                </div>
              </div>
              <div>
                <InfoNote type="info">
                  <strong>District-level metric:</strong> This rate is computed at the district
                  level and applied to judges within that district. It reflects the criminal
                  environment a judge operates in, not their individual decisions.
                </InfoNote>
                <InfoNote type="warning">
                  <strong>Important limitation:</strong> This measures repeat offenders entering
                  the system — not re-offense rates after a specific judge's sentencing. True
                  post-sentencing recidivism data is not publicly available at the judge level.
                </InfoNote>
              </div>
            </div>
          </Collapsible>

          {/* Accountability Score */}
          <Collapsible
            icon="🏆"
            title="Accountability Score (0–100)"
            defaultOpen={true}
            accentColor="#dc2626"
          >
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginTop: 0,
                marginBottom: '1.25rem',
              }}
            >
              The Accountability Score is a composite metric designed to surface judges and
              districts that may warrant closer public scrutiny. Higher scores indicate
              closer adherence to federal sentencing guidelines and lower district-level
              recidivism. This is an algorithmic assessment — not a legal judgment.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.875rem',
                  }}
                >
                  Score Components
                </div>
                <ScoreRow
                  label="Sentencing Guideline Adherence"
                  weight="30%"
                  description="How closely individual sentences match the USSC guideline range (GLMIN–GLMAX)."
                  color="#6366f1"
                />
                <ScoreRow
                  label="District Below-Guidelines Rate"
                  weight="30%"
                  description="District-level rate of below-guidelines departures. Lower rate → higher contribution to score."
                  color="#f59e0b"
                />
                <ScoreRow
                  label="Recidivism Impact"
                  weight="20%"
                  description="District repeat-offender rate (Criminal History Category II+). Lower rate → higher score."
                  color="#ef4444"
                />
                <ScoreRow
                  label="Case Volume & Experience"
                  weight="10%"
                  description="Reasonable caseload size relative to district norms. Extreme outliers are flagged."
                  color="#16a34a"
                />
                <ScoreRow
                  label="Community Input (Reserved)"
                  weight="10%"
                  description="Reserved for future public feedback integration. Currently weighted at 0."
                  color="#64748b"
                />
              </div>

              <div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.875rem',
                  }}
                >
                  Score Interpretation
                </div>
                {[
                  { range: '80–100', label: 'Strong Adherence', color: '#16a34a', desc: 'Consistent guideline compliance, low district recidivism.' },
                  { range: '60–79', label: 'Moderate Adherence', color: '#6366f1', desc: 'Near average guideline adherence with some departures.' },
                  { range: '40–59', label: 'Below Average', color: '#f59e0b', desc: 'Notable below-guidelines departure rate or higher recidivism.' },
                  { range: '0–39', label: 'Significant Concern', color: '#ef4444', desc: 'High departure rates, especially for serious offenses.' },
                ].map((item) => (
                  <div
                    key={item.range}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      marginBottom: '0.75rem',
                      padding: '0.625rem',
                      background: `${item.color}0d`,
                      border: `1px solid ${item.color}25`,
                      borderRadius: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: item.color,
                        minWidth: '60px',
                        flexShrink: 0,
                      }}
                    >
                      {item.range}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: item.color,
                          marginBottom: '0.15rem',
                        }}
                      >
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Collapsible>

          {/* Criminal History Categories */}
          <Collapsible
            icon="📊"
            title="Criminal History Categories Explained"
            defaultOpen={false}
          >
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginTop: 0,
                marginBottom: '1rem',
              }}
            >
              The Federal Sentencing Guidelines assign criminal history points based on prior
              convictions. More points are given for violent offenses, recent offenses, and
              offenses committed while under criminal justice supervision.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {[
                {
                  cat: 'Category I',
                  points: '0–1 points',
                  label: 'No or minimal criminal history',
                  desc: 'First-time or near-first-time offenders. ~51% of federal defendants.',
                  color: '#16a34a',
                },
                {
                  cat: 'Category II',
                  points: '2–3 points',
                  label: 'Prior contact with the system',
                  desc: 'One or two minor prior convictions.',
                  color: '#84cc16',
                },
                {
                  cat: 'Category III',
                  points: '4–6 points',
                  label: 'Moderate criminal history',
                  desc: 'Multiple prior convictions or one serious prior offense.',
                  color: '#f59e0b',
                },
                {
                  cat: 'Category IV',
                  points: '7–9 points',
                  label: 'High risk',
                  desc: 'Significant prior criminal record. Judges should take note.',
                  color: '#f97316',
                },
                {
                  cat: 'Category V',
                  points: '10–12 points',
                  label: 'Very high risk',
                  desc: 'Extensive prior record including serious offenses.',
                  color: '#dc2626',
                },
                {
                  cat: 'Category VI',
                  points: '13+ points',
                  label: 'Career criminals',
                  desc: 'Most dangerous category. Often used for habitual offender enhancements. ~7.5% of federal defendants.',
                  color: '#991b1b',
                },
              ].map((item) => (
                <div
                  key={item.cat}
                  style={{
                    background: `${item.color}0d`,
                    border: `1px solid ${item.color}25`,
                    borderRadius: '0.75rem',
                    padding: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <span
                      style={{ fontSize: '0.9rem', fontWeight: 700, color: item.color }}
                    >
                      {item.cat}
                    </span>
                    <Badge color={item.color}>{item.points}</Badge>
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '0.3rem',
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>

            <InfoNote type="info">
              Criminal history points are assigned under U.S.S.G. §4A1.1. Points are added for
              each prior sentence of imprisonment, with additional points for offenses committed
              while under criminal justice supervision or within a certain number of years.
            </InfoNote>
          </Collapsible>
        </section>

        {/* ═══ SECTION 3: LIMITATIONS & DISCLAIMERS ════════════════════ */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionHeader
            icon="⚠️"
            title="Data Limitations & Disclaimers"
            subtitle="Transparency requires acknowledging what our data cannot tell us. Please read before drawing conclusions."
          />

          <Card>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem',
              }}
            >
              {[
                {
                  icon: '🔒',
                  title: 'Anonymized Data',
                  desc: 'USSC data contains no defendant names or personally identifying information. Individual cases cannot be traced back to specific individuals.',
                  color: '#6366f1',
                },
                {
                  icon: '🗺️',
                  title: 'District-Level Recidivism',
                  desc: 'Recidivism/repeat offender rates are computed at the district level and assigned to judges in that district — not calculated from a specific judge\'s decisions.',
                  color: '#f59e0b',
                },
                {
                  icon: '🤝',
                  title: 'Departures Can Be Appropriate',
                  desc: 'Below-guidelines sentences are often the result of substantial assistance agreements (cooperating witnesses), mandatory minimum waivers, or compelling mitigating circumstances.',
                  color: '#16a34a',
                },
                {
                  icon: '📅',
                  title: 'FY2025 Data Only',
                  desc: 'All USSC case data covers the fiscal year October 1, 2024 – September 30, 2025. Historical trend analysis is limited without multi-year datasets.',
                  color: '#64748b',
                },
                {
                  icon: '🏛️',
                  title: 'Federal Courts Only',
                  desc: 'Federal courts handle approximately 5% of all criminal cases in the US. State courts, which handle the vast majority, are not included in this dataset.',
                  color: '#f97316',
                },
                {
                  icon: '🤖',
                  title: 'Algorithmic Assessments',
                  desc: 'Accountability scores are algorithmic assessments based on public data. They are not legal judgments, character assessments, or endorsements of any political position.',
                  color: '#dc2626',
                },
                {
                  icon: '👤',
                  title: 'Judge Profile Gaps',
                  desc: 'CourtListener data may be incomplete for judges appointed recently or for courts with limited digital records. We supplement with official court sources where possible.',
                  color: '#84cc16',
                },
                {
                  icon: '⚖️',
                  title: 'Context Matters',
                  desc: 'Raw statistics without legal context can be misleading. Sentencing outcomes are influenced by prosecution strategy, defense quality, plea agreements, and many factors outside a judge\'s control.',
                  color: '#6366f1',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    padding: '0.875rem',
                    background: `${item.color}08`,
                    border: `1px solid ${item.color}20`,
                    borderRadius: '0.75rem',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: item.color,
                        marginBottom: '0.25rem',
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}
                    >
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ═══ SECTION 4: OUR MISSION ═══════════════════════════════════ */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionHeader
            icon="🎯"
            title="Our Mission"
            subtitle="Why RedHanded exists and the principles behind how we present data."
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <Card accent="rgba(220,38,38,0.2)">
              <CardTitle>🔴 Why We Built This</CardTitle>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.75,
                  margin: '0 0 1rem 0',
                }}
              >
                RedHanded exists to bring transparency to the federal justice system. We believe
                that public institutions — including federal courts — must be accountable to the
                people they serve.
              </p>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.75,
                  margin: '0 0 1rem 0',
                }}
              >
                The data we present comes entirely from public government sources. We do not
                collect private data, we do not publish information about defendants, and we
                do not advocate for specific sentencing outcomes.
              </p>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.75,
                  margin: 0,
                }}
              >
                We present facts. Citizens draw their own conclusions.
              </p>
            </Card>

            <Card>
              <CardTitle>📜 Our Principles</CardTitle>
              <div>
                {[
                  {
                    icon: '🔍',
                    title: 'Transparency',
                    desc: 'Every metric is documented. Every data source is cited. Every limitation is disclosed.',
                  },
                  {
                    icon: '⚖️',
                    title: 'Fairness',
                    desc: 'We present data without partisan framing. Context is provided alongside statistics.',
                  },
                  {
                    icon: '🛡️',
                    title: 'Public Safety Focus',
                    desc: 'This is a public safety tool. We are not a vigilante platform, and we do not condone harassment of judges or officials.',
                  },
                  {
                    icon: '📖',
                    title: 'Open Data',
                    desc: 'All underlying data comes from public sources. We believe this analysis should be replicable by anyone.',
                  },
                  {
                    icon: '🔄',
                    title: 'Accountability Requires Visibility',
                    desc: 'You cannot hold institutions accountable for what you cannot see. We make the invisible visible.',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{
                      display: 'flex',
                      gap: '0.6rem',
                      marginBottom: '0.75rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '0.1rem' }}>
                      {item.icon}
                    </span>
                    <div>
                      <span
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {item.title}:{' '}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {item.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* ═══ SECTION 5: CONTACT & CORRECTIONS ════════════════════════ */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionHeader
            icon="✉️"
            title="Contact & Corrections"
            subtitle="Data accuracy is our highest priority. If you believe something is wrong, tell us."
          />

          <Card>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                alignItems: 'start',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    marginTop: 0,
                  }}
                >
                  If you believe any data displayed on RedHanded is inaccurate — whether a
                  judge's profile, a sentencing statistic, or a calculated score — we want to
                  know about it.
                </p>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                  }}
                >
                  We review all correction requests and update the data as quickly as possible.
                  If you are a court official or judicial administrator with access to official
                  records, please include supporting documentation.
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginTop: '1rem',
                    padding: '0.875rem 1.1rem',
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: '0.625rem',
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>📧</span>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>
                      Corrections &amp; Data Issues
                    </div>
                    <div
                      style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6366f1' }}
                    >
                      corrections@redhanded.us
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.75rem',
                  }}
                >
                  When contacting us, please include:
                </div>
                {[
                  'The specific judge, district, or data point in question',
                  'What you believe is incorrect and why',
                  'Any official sources or documentation supporting your correction',
                  'Your contact information (optional, for follow-up)',
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '0.6rem',
                      marginBottom: '0.5rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#6366f1',
                        minWidth: '1.25rem',
                        height: '1.25rem',
                        background: 'rgba(99,102,241,0.12)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '0.05rem',
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}
                    >
                      {item}
                    </span>
                  </div>
                ))}

                <InfoNote type="success">
                  <strong>Response time:</strong> We aim to review all correction requests
                  within 5 business days. Confirmed corrections are reflected in the next
                  data refresh.
                </InfoNote>
              </div>
            </div>
          </Card>
        </section>

        {/* Footer */}
        <footer
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>
            Data sources: U.S. Sentencing Commission · CourtListener / Free Law Project ·
            All federal case data anonymized
          </span>
          <span style={{ color: 'var(--text-muted)' }}>Last Updated: June 2026</span>
        </footer>
      </main>
    </div>
  );
}
