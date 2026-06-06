'use client';

import { Judge } from '@/lib/types';

interface StatsOverviewProps {
  totalJudges: number;
  totalStates: number;
  totalCourts: number;
  partyBreakdown: { dem: number; rep: number; other: number };
}

export default function StatsOverview({ totalJudges, totalStates, totalCourts, partyBreakdown }: StatsOverviewProps) {
  const stats = [
    { label: 'Federal Judges', value: totalJudges.toLocaleString(), icon: '⚖️' },
    { label: 'States Covered', value: totalStates.toString(), icon: '🗺️' },
    { label: 'Federal Courts', value: totalCourts.toString(), icon: '🏛️' },
    { label: 'D / R Split', value: `${partyBreakdown.dem} / ${partyBreakdown.rep}`, icon: '🏷️',
      color: 'text-[var(--text-primary)]' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]">
          <div className="text-2xl mb-1">{stat.icon}</div>
          <div className={`text-2xl font-bold ${stat.color || 'text-[var(--text-primary)]'}`}>
            {stat.value}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
