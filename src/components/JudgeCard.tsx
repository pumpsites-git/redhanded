'use client';

import { Judge } from '@/lib/types';
import Link from 'next/link';
import ScoreRing from './ScoreRing';

interface JudgeCardProps {
  judge: Judge;
}

export default function JudgeCard({ judge }: JudgeCardProps) {
  const hasScore = judge.accountabilityScore !== null && judge.accountabilityScore !== undefined;
  const hasCaseData = judge.stats?.totalCases != null;

  return (
    <Link href={`/judge/${judge.clId}`}>
      <div className="judge-card rounded-xl bg-[var(--bg-card)] p-5 cursor-pointer">
        <div className="flex items-start gap-4">
          {/* Score or icon */}
          {hasScore ? (
            <ScoreRing score={judge.accountabilityScore!} size={72} />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-xl shrink-0">
              ⚖️
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] truncate">
              {judge.name}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] truncate">
              {judge.courtFull || judge.court}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
                {judge.state}
              </span>
              {judge.party && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                  judge.party === 'Republican'
                    ? 'bg-red-900/20 text-red-400 border-red-800/50'
                    : 'bg-blue-900/20 text-blue-400 border-blue-800/50'
                }`}>
                  {judge.party}
                </span>
              )}
              {judge.abaRating && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900/20 text-green-400 border border-green-800/50">
                  ABA: {judge.abaRating}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className={`grid ${hasCaseData ? 'grid-cols-4' : 'grid-cols-3'} gap-3 mt-4 pt-4 border-t border-[var(--border)]`}>
          <div className="text-center">
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              {judge.yearsServing}
            </div>
            <div className="text-xs text-[var(--text-muted)]">Years</div>
          </div>
          {hasCaseData && (
            <div className="text-center">
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                {judge.stats!.totalCases.toLocaleString()}
              </div>
              <div className="text-xs text-[var(--text-muted)]">Cases</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {judge.education || 'N/A'}
            </div>
            <div className="text-xs text-[var(--text-muted)]">Law School</div>
          </div>
          <div className="text-center">
            <div className={`text-sm font-semibold ${hasScore ? '' : 'text-amber-400'}`}>
              {hasScore ? judge.accountabilityScore : hasCaseData ? '⏳ Scoring' : '📊 Pending'}
            </div>
            <div className="text-xs text-[var(--text-muted)]">Score</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
