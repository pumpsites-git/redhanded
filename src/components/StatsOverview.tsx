'use client';

function ScalesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M3 7h18" />
      <path d="M3 7l3 6H0l3-6z" />
      <path d="M21 7l3 6h-6l3-6z" />
      <line x1="9" y1="21" x2="15" y2="21" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="10" width="20" height="11" />
      <path d="M2 10l10-7 10 7" />
      <line x1="8" y1="21" x2="8" y2="15" />
      <line x1="16" y1="21" x2="16" y2="15" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

interface StatsOverviewProps {
  totalJudges: number;
  totalStates: number;
  totalCourts: number;
  partyBreakdown: { dem: number; rep: number; other: number };
}

export default function StatsOverview({ totalJudges, totalStates, totalCourts, partyBreakdown }: StatsOverviewProps) {
  const stats = [
    { label: 'Federal Judges', value: totalJudges.toLocaleString(), Icon: ScalesIcon },
    { label: 'States Covered', value: totalStates.toString(), Icon: MapIcon },
    { label: 'Federal Courts', value: totalCourts.toString(), Icon: BuildingIcon },
    { label: 'D / R Split', value: `${partyBreakdown.dem} / ${partyBreakdown.rep}`, Icon: TagIcon },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]">
          <div className="text-[var(--text-muted)] mb-1">
            <stat.Icon />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {stat.value}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
