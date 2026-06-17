'use client';

import { useState } from 'react';
import BountyCard from '@/components/BountyCard';
import ContributeUpload from '@/components/ContributeUpload';
import RequestTemplate from '@/components/RequestTemplate';
import { BOUNTIES, getBountyStats, formatBounty, type BountyTier } from '@/lib/bounties';

// ─── State-specific citations ──────────────────────────────────────────────

const STATE_CITATIONS = [
  { state: 'Florida', law: 'Public Records Act', citation: 'Fla. Stat. §119.01 et seq.', color: '#f59e0b' },
  { state: 'California', law: 'California Public Records Act', citation: 'Gov. Code §§7920–7930.170', color: '#22c55e' },
  { state: 'Texas', law: 'Public Information Act', citation: 'Tex. Gov\'t Code Ch. 552', color: '#0ea5e9' },
  { state: 'Illinois', law: 'Freedom of Information Act', citation: '5 ILCS 140/1 et seq.', color: '#6366f1' },
  { state: 'New York', law: 'Freedom of Information Law', citation: 'N.Y. Pub. Off. Law §84 et seq.', color: '#8b5cf6' },
  { state: 'Pennsylvania', law: 'Right-to-Know Law', citation: '65 P.S. §§67.101–67.3104', color: '#ec4899' },
  { state: 'Washington', law: 'Public Records Act', citation: 'RCW 42.56', color: '#14b8a6' },
  { state: 'Georgia', law: 'Open Records Act', citation: 'O.C.G.A. §50-18-70 et seq.', color: '#f97316' },
  { state: 'Arizona', law: 'Public Records Law', citation: 'A.R.S. §39-121 et seq.', color: '#a78bfa' },
  { state: 'Ohio', law: 'Public Records Act', citation: 'Ohio Rev. Code §149.43', color: '#fb923c' },
  { state: 'Michigan', law: 'Freedom of Information Act', citation: 'MCL 15.231 et seq.', color: '#34d399' },
  { state: 'North Carolina', law: 'Public Records Law', citation: 'N.C. Gen. Stat. §§132-1 et seq.', color: '#60a5fa' },
];

// ─── Step card ─────────────────────────────────────────────────────────────

function StepCard({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '1.25rem',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: '2.25rem',
          height: '2.25rem',
          borderRadius: '50%',
          background: 'rgba(220,38,38,0.15)',
          border: '2px solid rgba(220,38,38,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '0.875rem',
          fontWeight: 800,
          color: 'var(--red-primary)',
        }}
      >
        {number}
      </div>
      <div style={{ flex: 1 }}>
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0.2rem 0 0.5rem 0',
          }}
        >
          {title}
        </h3>
        <div
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Section header ────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  subtitle,
  badge,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.6rem' }}>{icon}</span>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h2>
        {badge && (
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              padding: '0.2rem 0.5rem',
              background: 'rgba(220,38,38,0.15)',
              border: '1px solid rgba(220,38,38,0.35)',
              borderRadius: '0.3rem',
              color: 'var(--red-primary)',
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── Tier filter tabs ──────────────────────────────────────────────────────

function TierTabs({
  active,
  onChange,
}: {
  active: 'all' | BountyTier;
  onChange: (tier: 'all' | BountyTier) => void;
}) {
  const tabs: Array<{ key: 'all' | BountyTier; label: string }> = [
    { key: 'all', label: 'All Counties' },
    { key: 1, label: 'Tier 1 — Priority' },
    { key: 2, label: 'Tier 2' },
    { key: 3, label: 'Tier 3' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.375rem',
        flexWrap: 'wrap',
        marginBottom: '1.5rem',
      }}
    >
      {tabs.map(({ key, label }) => (
        <button
          key={String(key)}
          onClick={() => onChange(key)}
          style={{
            padding: '0.375rem 0.875rem',
            borderRadius: '0.5rem',
            border: `1px solid ${active === key ? 'rgba(220,38,38,0.4)' : 'var(--border)'}`,
            background: active === key ? 'rgba(220,38,38,0.12)' : 'transparent',
            color: active === key ? 'var(--red-primary)' : 'var(--text-secondary)',
            fontSize: '0.8rem',
            fontWeight: active === key ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function ContributePage() {
  const [tierFilter, setTierFilter] = useState<'all' | BountyTier>('all');
  const stats = getBountyStats();

  const filteredBounties =
    tierFilter === 'all' ? BOUNTIES : BOUNTIES.filter((b) => b.tier === tierFilter);

  const totalBountyDisplay = formatBounty(stats.totalPayout);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* ═══ HERO HEADER ═══════════════════════════════════════════════ */}
      <header
        style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          padding: '3rem 1rem 2.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background red glow */}
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '72rem', margin: '0 auto', position: 'relative' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.75rem',
              background: 'rgba(220,38,38,0.1)',
              border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--red-primary)',
              letterSpacing: '0.05em',
              marginBottom: '1.25rem',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--red-primary)',
                display: 'inline-block',
                animation: 'pulse 2s infinite',
              }}
            />
            BOUNTY PROGRAM — ACTIVE
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              margin: '0 0 0.875rem 0',
              lineHeight: 1.15,
            }}
          >
            Help Us Hold Judges{' '}
            <span style={{ color: 'var(--red-primary)' }}>Accountable</span>
          </h1>

          <p
            style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              lineHeight: 1.7,
              margin: '0 0 2rem 0',
            }}
          >
            We need criminal case disposition data from every county in America. Request public
            records from your local clerk of courts — and earn a bounty reward when we can
            use your data.
          </p>

          {/* Hero stats */}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {[
              { value: stats.open.toString(), label: 'Open Bounties', color: '#22c55e' },
              { value: totalBountyDisplay + '+', label: 'Total Available', color: 'var(--red-primary)' },
              { value: '3,143', label: 'US Counties Needed', color: '#f59e0b' },
              { value: '5–30', label: 'Days to Get Records', color: '#6366f1' },
            ].map(({ value, label, color }) => (
              <div key={label}>
                <div
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 900,
                    color,
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {value}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '72rem', margin: '0 auto', padding: '3rem 1rem' }}>

        {/* ═══ SECTION 1: MISSION ════════════════════════════════════════ */}
        <section style={{ marginBottom: '4rem' }}>
          <SectionHeader
            icon="🎯"
            title="What We Need — And Why It Matters"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '0.875rem',
                padding: '1.5rem',
              }}
            >
              <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, marginTop: 0, fontSize: '1rem' }}>
                📊 The Data We Need
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                For each criminal case, we need the following fields:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  'Case number',
                  'Presiding judge name',
                  'Charge(s) and statute(s)',
                  'Disposition (guilty, dismissed, etc.)',
                  'Sentence imposed (prison, probation, fine)',
                  'Sentence length',
                  'Date of disposition',
                ].map((item) => (
                  <div key={item} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--red-primary)', fontSize: '0.875rem', flexShrink: 0 }}>→</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(220,38,38,0.2)',
                borderRadius: '0.875rem',
                padding: '1.5rem',
              }}
            >
              <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, marginTop: 0, fontSize: '1rem' }}>
                🔴 Why This Matters
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {[
                  {
                    icon: '⚖️',
                    title: 'Transparency',
                    desc: 'Citizens deserve to know how their elected and appointed judges sentence criminals.',
                  },
                  {
                    icon: '🛡️',
                    title: 'Public Safety',
                    desc: 'Pattern data reveals which judges consistently under-sentence violent and repeat offenders.',
                  },
                  {
                    icon: '🗳️',
                    title: 'Accountability',
                    desc: 'Voters and oversight bodies can only hold judges accountable for what is visible.',
                  },
                  {
                    icon: '📈',
                    title: 'Systemic Analysis',
                    desc: 'Individual cases tell one story. Thousands of cases tell the truth.',
                  },
                ].map(({ icon, title, desc }) => (
                  <div key={title} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{icon}</span>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {title}:{' '}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 2: HOW TO REQUEST ══════════════════════════════════ */}
        <section style={{ marginBottom: '4rem' }}>
          <SectionHeader
            icon="📋"
            title="How to Request Records"
            subtitle="Most states have public records laws requiring clerks to provide court data. Here's how to do it in 4 steps — usually for free or a small fee."
          />

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '0.875rem',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.75rem',
              marginBottom: '1.5rem',
            }}
          >
            <StepCard number={1} title="Find Your County Clerk's Office">
              <p style={{ margin: '0 0 0.5rem 0' }}>
                Search for your county's clerk of courts online. Most counties have a website
                with a contact email or public records request portal.
              </p>
              <a
                href="https://www.google.com/search?q=[county]+clerk+of+courts+public+records"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--red-primary)', fontWeight: 600, fontSize: '0.875rem' }}
              >
                🔍 Search Google: "[Your County] clerk of courts public records" →
              </a>
            </StepCard>

            <div style={{ borderTop: '1px solid var(--border)' }} />

            <StepCard number={2} title="Send a Public Records Request">
              <p style={{ margin: '0 0 0.75rem 0' }}>
                Use the template below — customize with your county and state. Most clerks
                accept requests by email, online form, or mail. Cite your state's specific
                public records law for fastest results.
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  fontSize: '0.8rem',
                  marginBottom: '0.875rem',
                }}
              >
                {[
                  { tip: '✉️', text: 'Always request electronic format (CSV/Excel)' },
                  { tip: '📌', text: 'Cite your state\'s public records law by name' },
                  { tip: '💰', text: 'Electronic format is usually free or minimal cost' },
                ].map(({ tip, text }) => (
                  <div
                    key={text}
                    style={{
                      display: 'flex',
                      gap: '0.4rem',
                      alignItems: 'center',
                      padding: '0.375rem 0.75rem',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>{tip}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </StepCard>

            {/* Template - embedded here */}
            <div style={{ marginLeft: '3.5rem' }}>
              <RequestTemplate />
            </div>

            <div style={{ borderTop: '1px solid var(--border)' }} />

            <StepCard number={3} title="Wait for the Response">
              <p style={{ margin: '0 0 0.5rem 0' }}>
                Typical response times vary by state: <strong style={{ color: 'var(--text-primary)' }}>5–30 business days</strong>.
                Some charge small fees for processing; electronic format minimizes this.
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Follow up after 5 business days</strong> if
                you haven't received an acknowledgment. Clerks are required by law to respond
                promptly — a polite follow-up is appropriate and often necessary.
              </p>
            </StepCard>

            <div style={{ borderTop: '1px solid var(--border)' }} />

            <StepCard number={4} title="Upload & Claim Your Bounty">
              <p style={{ margin: '0 0 0.5rem 0' }}>
                Once you receive the data, upload it using the form in{' '}
                <a href="#upload" style={{ color: 'var(--red-primary)', fontWeight: 600 }}>
                  Section 4
                </a>{' '}
                below. We'll review within 5–10 business days and send your bounty payment.
              </p>
              <p style={{ margin: 0 }}>
                We accept CSV, Excel, and PDF. We can process most formats — even if it's
                not perfectly structured, submit it and we'll clean it up.
              </p>
            </StepCard>
          </div>

          {/* State-specific citations */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '0.875rem',
              padding: '1.5rem',
            }}
          >
            <h3
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 1.25rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              📜 State Public Records Law Citations
            </h3>
            <p
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                margin: '0 0 1rem 0',
                lineHeight: 1.6,
              }}
            >
              Include your state's citation in your request. Most states have a public records law
              — even if it's called something different. All 50 states have some form of public records access law.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '0.625rem',
              }}
            >
              {STATE_CITATIONS.map(({ state, law, citation, color }) => (
                <div
                  key={state}
                  style={{
                    padding: '0.625rem 0.875rem',
                    background: `${color}08`,
                    border: `1px solid ${color}20`,
                    borderRadius: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color,
                      marginBottom: '0.1rem',
                    }}
                  >
                    {state}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{law}</div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'monospace',
                      marginTop: '0.15rem',
                    }}
                  >
                    {citation}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                background: 'rgba(99,102,241,0.07)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
              }}
            >
              <strong style={{ color: '#6366f1' }}>Don't see your state?</strong> Every state has
              public records laws. Search "
              <span style={{ fontStyle: 'italic' }}>[your state] public records law citation</span>"
              for the specific statute to cite.
            </div>
          </div>
        </section>

        {/* ═══ SECTION 3: BOUNTY BOARD ════════════════════════════════════ */}
        <section style={{ marginBottom: '4rem' }}>
          <SectionHeader
            icon="🎯"
            title="Active Bounty Board"
            subtitle="Priority counties where we need data most. Higher-population counties have higher bounties."
            badge="LIVE"
          />

          {/* Tier legend */}
          <div
            style={{
              display: 'flex',
              gap: '0.875rem',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Priority tiers:</span>
            {[
              { tier: 'Tier 1', desc: 'Top 50 counties by population', color: '#dc2626' },
              { tier: 'Tier 2', desc: 'Mid-size counties', color: '#f59e0b' },
              { tier: 'Tier 3', desc: 'Smaller counties', color: '#a3a3a3' },
            ].map(({ tier, desc, color }) => (
              <div key={tier} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: color,
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                <strong style={{ color }}>{tier}</strong>
                <span>— {desc}</span>
              </div>
            ))}
          </div>

          <TierTabs active={tierFilter} onChange={setTierFilter} />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {filteredBounties.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </div>

          {filteredBounties.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem',
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
              }}
            >
              No bounties in this tier yet.
            </div>
          )}

          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem 1.25rem',
              background: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: '0.75rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'flex-start',
            }}
          >
            <span style={{ flexShrink: 0, fontSize: '1rem', marginTop: '-0.05rem' }}>💡</span>
            <span>
              <strong style={{ color: 'var(--text-primary)' }}>Don't see your county?</strong>{' '}
              We accept data from any US county — even those not listed here. Use the upload
              form below and we'll evaluate it for a bounty. Every county matters.
            </span>
          </div>
        </section>

        {/* ═══ SECTION 4: UPLOAD ══════════════════════════════════════════ */}
        <section style={{ marginBottom: '4rem' }}>
          <SectionHeader
            icon="📤"
            title="Upload Your Data"
            subtitle="Submit your public records files here. We'll review within 5–10 business days and send your bounty."
          />

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '0.875rem',
              padding: '2rem',
            }}
          >
            <ContributeUpload />
          </div>
        </section>

        {/* ═══ FAQ ════════════════════════════════════════════════════════ */}
        <section style={{ marginBottom: '4rem' }}>
          <SectionHeader icon="❓" title="Frequently Asked Questions" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              {
                q: 'Is it legal to request this data?',
                a: 'Yes. Criminal court records are public records in all 50 states. Public records laws exist specifically to ensure government transparency. Requesting sentencing data from the clerk of courts is entirely legal and encouraged.',
              },
              {
                q: 'How much do bounties pay?',
                a: 'Bounty amounts range from $25 to $100 depending on county population and data quality. Tier 1 counties (top 50 by population) pay $75–$100. Tier 2 pays $50. Tier 3 pays $25. Bonuses available for especially clean, complete datasets.',
              },
              {
                q: 'How long does it take to get the records?',
                a: 'Most states require clerks to respond within 5–10 business days. Some counties take up to 30 days. Florida, for example, requires "prompt" response with no specific deadline. Follow up after 5 days if you haven\'t heard back.',
              },
              {
                q: 'What if the clerk charges a fee?',
                a: 'Most electronic data is provided for free or at minimal cost (copying charges). If a fee is quoted over $20, contact us at data@redhanded.us and we may be able to reimburse you for the cost in addition to the bounty.',
              },
              {
                q: 'What if the data is incomplete or messy?',
                a: 'Submit it anyway. We can work with partial datasets, PDFs, and non-standard formats. The more raw data we get, the better — include a note explaining what\'s there and what\'s missing.',
              },
              {
                q: 'Will defendant names be published?',
                a: 'No. RedHanded publishes aggregate statistics about judges — not individual case data or defendant information. We only analyze patterns, not individual cases.',
              },
              {
                q: 'Can I submit data I already have?',
                a: 'Yes, if it was obtained legally (public records request, official database access, etc.). Data that was leaked, hacked, or obtained illegally will not be accepted.',
              },
            ].map(({ q, a }) => (
              <FaqItem key={q} question={q} answer={a} />
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <section>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(220,38,38,0.08) 0%, var(--bg-card) 100%)',
              border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: '1rem',
              padding: '2.5rem',
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: '0 0 0.75rem 0',
                letterSpacing: '-0.02em',
              }}
            >
              Ready to make a difference?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 1.5rem 0', lineHeight: 1.6 }}>
              Every dataset you contribute makes judicial accountability more visible.
              Pick your county, send the request, collect your bounty.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="#upload"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.75rem',
                  background: 'var(--red-primary)',
                  border: 'none',
                  borderRadius: '0.625rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'opacity 0.15s ease',
                }}
              >
                Submit Data →
              </a>
              <a
                href="mailto:data@redhanded.us"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.75rem',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '0.625rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                📧 Contact Us
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// ─── FAQ Item ──────────────────────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        transition: 'border-color 0.15s ease',
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
          gap: '1rem',
        }}
      >
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {question}
        </span>
        <span
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            display: 'inline-block',
            flexShrink: 0,
          }}
        >
          ▼
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: '0 1.25rem 1rem',
            borderTop: '1px solid var(--border)',
          }}
        >
          <p
            style={{
              margin: '0.875rem 0 0',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
            }}
          >
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}
