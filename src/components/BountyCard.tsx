'use client';

import { Bounty, formatBounty, formatPopulation } from '@/lib/bounties';

interface BountyCardProps {
  bounty: Bounty;
}

const STATUS_CONFIG: Record<
  Bounty['status'],
  { label: string; color: string; bgColor: string; borderColor: string; dot: string }
> = {
  open: {
    label: 'Open',
    color: '#22c55e',
    bgColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.25)',
    dot: '#22c55e',
  },
  claimed: {
    label: 'Claimed',
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.1)',
    borderColor: 'rgba(245,158,11,0.25)',
    dot: '#f59e0b',
  },
  submitted: {
    label: 'Under Review',
    color: '#6366f1',
    bgColor: 'rgba(99,102,241,0.1)',
    borderColor: 'rgba(99,102,241,0.25)',
    dot: '#6366f1',
  },
  verified: {
    label: 'Verified',
    color: '#0ea5e9',
    bgColor: 'rgba(14,165,233,0.1)',
    borderColor: 'rgba(14,165,233,0.25)',
    dot: '#0ea5e9',
  },
  paid: {
    label: 'Paid ✓',
    color: '#a3a3a3',
    bgColor: 'rgba(163,163,163,0.08)',
    borderColor: 'rgba(163,163,163,0.2)',
    dot: '#a3a3a3',
  },
};

const TIER_CONFIG: Record<
  Bounty['tier'],
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  1: {
    label: 'TIER 1',
    color: '#dc2626',
    bgColor: 'rgba(220,38,38,0.12)',
    borderColor: 'rgba(220,38,38,0.3)',
  },
  2: {
    label: 'TIER 2',
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.1)',
    borderColor: 'rgba(245,158,11,0.25)',
  },
  3: {
    label: 'TIER 3',
    color: '#a3a3a3',
    bgColor: 'rgba(163,163,163,0.08)',
    borderColor: 'rgba(163,163,163,0.2)',
  },
};

export default function BountyCard({ bounty }: BountyCardProps) {
  const status = STATUS_CONFIG[bounty.status];
  const tier = TIER_CONFIG[bounty.tier];
  const isOpen = bounty.status === 'open';

  return (
    <div
      className="judge-card rounded-xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--bg-card)' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: tier.color,
                background: tier.bgColor,
                border: `1px solid ${tier.borderColor}`,
                borderRadius: '0.3rem',
                padding: '0.15rem 0.45rem',
              }}
            >
              {tier.label}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: status.color,
                background: status.bgColor,
                border: `1px solid ${status.borderColor}`,
                borderRadius: '0.3rem',
                padding: '0.15rem 0.45rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: status.dot,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              {status.label}
            </span>
          </div>
          <h3
            className="text-base font-bold truncate"
            style={{ color: 'var(--text-primary)', margin: 0 }}
          >
            {bounty.county} County
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)', margin: '0.1rem 0 0 0' }}>
            {bounty.state}
          </p>
        </div>

        {/* Bounty amount */}
        <div className="text-right shrink-0">
          <div
            className="text-2xl font-extrabold"
            style={{ color: isOpen ? '#22c55e' : 'var(--text-secondary)', lineHeight: 1 }}
          >
            {formatBounty(bounty.bountyAmountCents)}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            bounty
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div
        className="grid grid-cols-2 gap-3 pt-3"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatPopulation(bounty.population)}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Population
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            ~{formatPopulation(bounty.estimatedCases)}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Est. Cases/Year
          </div>
        </div>
      </div>

      {/* Notes */}
      {bounty.notes && (
        <p
          className="text-xs leading-relaxed"
          style={{ color: 'var(--text-muted)', margin: 0 }}
        >
          💡 {bounty.notes}
        </p>
      )}

      {/* CTA */}
      {isOpen && (
        <a
          href="#upload"
          className="block text-center text-sm font-semibold rounded-lg py-2 px-4 transition-all duration-150 no-underline"
          style={{
            background: 'rgba(220,38,38,0.12)',
            border: '1px solid rgba(220,38,38,0.3)',
            color: 'var(--red-primary)',
            marginTop: 'auto',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(220,38,38,0.2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(220,38,38,0.12)';
          }}
        >
          Claim This Bounty →
        </a>
      )}
    </div>
  );
}
