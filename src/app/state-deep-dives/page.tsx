import Link from 'next/link';
import { getILStats, getNYStats, fmt, pct } from '@/lib/state-deep-dive';

export default function StateDeepDivesIndexPage() {
  const ilStats = getILStats();
  const nyStats = getNYStats();

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', padding: '1.5rem 1rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem' }}>🔬</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              State Deep Dives — Real Court Data Analysis
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, maxWidth: '56rem', lineHeight: 1.6 }}>
            Unlike the federal USSC data on other pages, these deep dives use actual <strong style={{ color: 'var(--text-primary)' }}>state court records</strong> —
            the courts where 95%+ of criminal cases are decided. Prosecutorial decisions, bail outcomes, sentencing patterns, and recidivism
            sourced directly from official state open-data portals. Data covers 2024–2025.
          </p>
        </div>
      </header>

      <main style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* Explainer banner */}
        <div style={{ padding: '1rem 1.25rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '0.75rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>ℹ️</span>
            <div>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Why state courts matter</strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0', lineHeight: 1.6 }}>
                The federal system (covered elsewhere on this site) handles ~80,000 cases per year. State courts handle over 20 million cases annually —
                including virtually all murders, assaults, robberies, drug offenses, and weapons charges.
                Federal statistics tell you nothing about how your local prosecutor handles felonies.
                These deep dives fill that gap with actual state-level data.
              </p>
            </div>
          </div>
        </div>

        {/* Available states */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Available Now
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Click any card for the full analysis
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>

          {/* Illinois card */}
          <Link href="/state-deep-dive/il" style={{ textDecoration: 'none' }}>
            <div className="judge-card" style={{
              background: 'var(--bg-card)',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              cursor: 'pointer',
              minHeight: '260px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🏙️</span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Illinois</h3>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Cook County State Court Analysis</p>
                </div>
                <div style={{ padding: '0.25rem 0.625rem', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '0.375rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 600 }}>LIVE DATA</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', flex: 1 }}>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--red-primary)', lineHeight: 1 }}>{pct(ilStats.nollePct, 0)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Charges Dropped</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ca8a04', lineHeight: 1 }}>{fmt(ilStats.totalCases)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Felony Cases</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8b5cf6', lineHeight: 1 }}>{pct(ilStats.probationPct, 0)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Got Probation</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f97316', lineHeight: 1 }}>{fmt(ilStats.totalSentenced)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Sentenced</div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Source: Cook County State's Attorney Open Data</span>
                <span style={{ color: 'var(--red-primary)', fontWeight: 600 }}>View →</span>
              </div>
            </div>
          </Link>

          {/* New York card */}
          <Link href="/state-deep-dive/ny" style={{ textDecoration: 'none' }}>
            <div className="judge-card" style={{
              background: 'var(--bg-card)',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              cursor: 'pointer',
              minHeight: '260px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🗽</span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>New York</h3>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Statewide Court & Bail Analysis</p>
                </div>
                <div style={{ padding: '0.25rem 0.625rem', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '0.375rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 600 }}>LIVE DATA</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', flex: 1 }}>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--red-primary)', lineHeight: 1 }}>{nyStats.totalReleasedPct}%</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Released Pre-Trial</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ca8a04', lineHeight: 1 }}>{fmt(nyStats.totalArraignments)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Arraignments</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f97316', lineHeight: 1 }}>{fmt(nyStats.vfoCount)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Violent Felony Cases</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', lineHeight: 1 }}>{fmt(nyStats.reArrestVFO)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Re-arrested VFO</div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Source: NY Division of Criminal Justice Services</span>
                <span style={{ color: 'var(--red-primary)', fontWeight: 600 }}>View →</span>
              </div>
            </div>
          </Link>

        </div>

        {/* Coming Soon states */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Coming Soon
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Data collection and processing in progress
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { code: 'ca', flag: '🌴', name: 'California', note: 'LA & SF prosecution data' },
            { code: 'tx', flag: '⭐', name: 'Texas', note: 'Harris County court records' },
            { code: 'fl', flag: '☀️', name: 'Florida', note: 'Statewide clerk data' },
          ].map(({ code, flag, name, note }) => (
            <Link key={code} href={`/state-deep-dive/${code}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                opacity: 0.7,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{flag}</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{name}</h3>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>{note}</p>
                <div style={{ display: 'inline-block', padding: '0.2rem 0.5rem', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '0.25rem' }}>
                  <span style={{ fontSize: '0.68rem', color: '#818cf8', fontWeight: 600 }}>DATA COLLECTION IN PROGRESS</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Methodology note */}
        <div style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.75rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>📐 Methodology</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {[
              { icon: '🏛️', label: 'State vs. Federal', text: 'All data on this page comes from state court systems, not the federal USSC data used in Judge/District/State profiles.' },
              { icon: '📥', label: 'Direct from Source', text: 'Records pulled directly from official open-data portals (Socrata, NY DCJS). No third-party aggregators.' },
              { icon: '📅', label: 'Date Coverage', text: 'Illinois data covers 2024–2025 activity. New York data primarily covers calendar year 2024.' },
              { icon: '⚠️', label: 'Limitations', text: 'Cook County ≠ all of Illinois. Correlation between datasets (e.g., VFO release rates) requires estimation where cross-tables are unavailable.' },
            ].map(({ icon, label, text }) => (
              <div key={label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                  <span>{icon}</span>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{label}</strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
