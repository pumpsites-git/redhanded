'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchJudgeById } from '@/lib/judges';
import { Judge } from '@/lib/types';
import ScoreRing from '@/components/ScoreRing';
import districtOffenseStats from '../../../../data/ussc/district-offense-stats-fy25.json';
import districtCodeMap from '../../../../data/ussc/district-code-map.json';
import criminalHistorySeverity from '../../../../data/ussc/criminal-history-severity-fy25.json';

export default function JudgeProfile() {
  const params = useParams();
  const [judge, setJudge] = useState<Judge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = Number(params.id);
    if (!isNaN(id)) {
      fetchJudgeById(id).then(j => {
        setJudge(j);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse">⚖️</div>
      </div>
    );
  }

  if (!judge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚖️</div>
          <p className="text-[var(--text-secondary)]">Judge not found</p>
          <Link href="/" className="text-[var(--red-primary)] hover:underline mt-2 inline-block">
            ← Back to search
          </Link>
        </div>
      </div>
    );
  }

  const clProfileUrl = `https://www.courtlistener.com/person/${judge.slug}/`;
  const hasScore = judge.accountabilityScore !== null && judge.accountabilityScore !== undefined;

  // Find district data for this judge's court
  const districtEntry = Object.entries(districtCodeMap as Record<string, any>).find(
    ([, info]) => info.clCourtId === judge.courtId
  );
  const districtCode = districtEntry?.[0];
  const districtInfo = districtEntry?.[1] as any;
  const districtStats = districtCode ? (districtOffenseStats as any)[districtCode] : null;
  const districtSeverity = districtCode ? (criminalHistorySeverity as any)[districtCode] : null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--red-primary)] transition-colors">
            ← Back to all judges
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Judge Header */}
        <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border)] red-glow">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {hasScore ? (
              <ScoreRing score={judge.accountabilityScore!} size={120} strokeWidth={8} />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[var(--bg-secondary)] border-2 border-[var(--border)] flex items-center justify-center text-3xl shrink-0">
                ⚖️
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{judge.name}</h1>
              <p className="text-[var(--text-secondary)] mt-1">{judge.courtFull}</p>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                  {judge.state}
                </span>
                {judge.party && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    judge.party === 'Republican'
                      ? 'bg-red-900/30 text-red-400'
                      : 'bg-blue-900/30 text-blue-400'
                  }`}>
                    {judge.party}
                  </span>
                )}
                {judge.abaRating && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-900/20 text-green-400">
                    ABA: {judge.abaRating}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                  {judge.yearsServing} years on bench
                </span>
                {judge.gender && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                    {judge.gender}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Background */}
          <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">📋 Background</h2>
            <div className="space-y-3">
              <DetailRow label="Court" value={judge.courtFull} />
              <DetailRow label="Jurisdiction" value={judge.jurisdiction} />
              {judge.education && <DetailRow label="Law School" value={judge.education} />}
              {judge.yearStarted && <DetailRow label="Appointed" value={String(judge.yearStarted)} />}
              {judge.appointedBy && <DetailRow label="Appointed By" value={judge.appointedBy} />}
              {judge.party && (
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Party</span>
                  <span className={`text-sm font-medium ${
                    judge.party === 'Republican' ? 'text-red-400' : 'text-blue-400'
                  }`}>{judge.party}</span>
                </div>
              )}
            </div>
          </div>

          {/* Accountability Score */}
          <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">📊 Accountability Score</h2>

            {hasScore && judge.stats ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <ScoreRing score={judge.accountabilityScore!} size={100} strokeWidth={8} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <StatBox label="Total Cases" value={judge.stats.totalCases.toLocaleString()} />
                  <StatBox label="Reversal Rate" value={`${judge.stats.reversalRate}%`}
                    color={judge.stats.reversalRate > 5 ? 'text-red-400' : 'text-green-400'} />
                  <StatBox label="vs Guidelines" value={`${judge.stats.avgSentenceVsGuideline > 0 ? '+' : ''}${judge.stats.avgSentenceVsGuideline}%`} />
                  <StatBox label="Cases/Year" value={String(judge.stats.caseloadPerYear)} />
                  {judge.stats.recidivismRate != null && (
                    <StatBox label="Recidivism Rate" value={`${judge.stats.recidivismRate}%`}
                      color={judge.stats.recidivismRate > 20 ? 'text-red-400' : judge.stats.recidivismRate > 10 ? 'text-amber-400' : 'text-green-400'} />
                  )}
                  {districtStats?.offense_types?.firearms != null && (
                    <StatBox label="Violent Cases" value={`${Math.round(((districtStats.offense_types.firearms || 0) + (districtStats.offense_types.sex_offenses || 0) + (districtStats.offense_types.assault_robbery || 0)) / districtStats.total_cases * 100)}%`}
                      color="text-red-400" />
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-[var(--bg-secondary)] text-center">
                <div className="text-4xl mb-2">📊</div>
                <div className="text-xl font-bold text-amber-400">Data Collection In Progress</div>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  We&apos;re collecting case outcome data to calculate this judge&apos;s accountability score.
                </p>
              </div>
            )}

            <div className="mt-4 p-4 rounded-lg bg-[var(--bg-secondary)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Score Components:</h3>
              <div className="space-y-2 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Reversal Rate (25%) — How often decisions are overturned</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Guideline Adherence (25%) — Sentencing vs. recommended</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>Recidivism Impact (30%) — Reoffense rates after release</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Community Sentiment (20%) — Public reviews and polls</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recidivism & Public Safety */}
        {(judge.stats?.recidivismRate != null || districtSeverity) && (
          <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">🔴 Recidivism & Public Safety</h2>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              District-level data showing repeat offender rates and violent crime patterns in this judge&apos;s jurisdiction.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {judge.stats?.recidivismRate != null && (
                <div className="p-4 rounded-lg bg-[var(--bg-secondary)] text-center">
                  <div className={`text-2xl font-bold ${judge.stats.recidivismRate > 20 ? 'text-red-400' : judge.stats.recidivismRate > 10 ? 'text-amber-400' : 'text-green-400'}`}>
                    {judge.stats.recidivismRate}%
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">Repeat Offender Rate</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">National avg: 11.8%</div>
                </div>
              )}
              {districtSeverity && (
                <>
                  <div className="p-4 rounded-lg bg-[var(--bg-secondary)] text-center">
                    <div className={`text-2xl font-bold ${districtSeverity.high_criminal_history_pct > 15 ? 'text-red-400' : 'text-amber-400'}`}>
                      {districtSeverity.high_criminal_history_pct?.toFixed(1)}%
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">High-Risk Offenders (Cat IV-VI)</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">Career criminals in district</div>
                  </div>
                  <div className="p-4 rounded-lg bg-[var(--bg-secondary)] text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {districtSeverity.category_vi_count || 0}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">Category VI Offenders</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">Most dangerous criminals</div>
                  </div>
                </>
              )}
            </div>

            {/* Below-guidelines warning for violent crimes */}
            {districtStats && (
              <div className="p-4 rounded-lg border border-red-900/30 bg-red-950/20">
                <h3 className="text-sm font-semibold text-red-400 mb-3">⚠️ Sentencing Below Guidelines</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-400">
                      {(districtStats.below_guidelines_rate * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">Overall Below-Guidelines</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-[var(--text-primary)]">
                      {districtStats.offense_types?.firearms || 0}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">Weapons Cases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-[var(--text-primary)]">
                      {districtStats.offense_types?.sex_offenses || 0}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">Sex Offense Cases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-[var(--text-primary)]">
                      {(districtStats.offense_types?.assault_robbery || 0) + (districtStats.offense_types?.murder || 0)}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">Violent Crime Cases</div>
                  </div>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-3">
                  When judges sentence below federal guidelines — especially for violent crimes — offenders may return to communities sooner. 
                  A {(districtStats.below_guidelines_rate * 100).toFixed(0)}% below-guidelines rate means roughly {Math.round(districtStats.below_guidelines_count || districtStats.total_cases * districtStats.below_guidelines_rate)} defendants in this district received lighter sentences than recommended.
                </p>
              </div>
            )}

            {/* Offense breakdown */}
            {districtStats?.offense_types && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Case Types in This District</h3>
                <div className="space-y-2">
                  {Object.entries(districtStats.offense_types as Record<string, number>)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 8)
                    .map(([type, count]) => {
                      const pct = ((count as number) / districtStats.total_cases * 100);
                      const isViolent = ['firearms', 'sex_offenses', 'assault_robbery', 'murder'].includes(type);
                      return (
                        <div key={type} className="flex items-center gap-3">
                          <span className={`text-xs w-32 truncate ${isViolent ? 'text-red-400 font-medium' : 'text-[var(--text-muted)]'}`}>
                            {isViolent ? '⚠️ ' : ''}{type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <div className="flex-1 h-3 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isViolent ? 'bg-red-500' : 'bg-[var(--red-primary)]'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--text-muted)] w-16 text-right">
                            {(count as number).toLocaleString()} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Community Reviews */}
        <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">💬 Community Reviews</h2>
          <div className="text-center py-8">
            <div className="text-3xl mb-2">📝</div>
            <p className="text-sm text-[var(--text-muted)]">
              No community reviews yet. Be the first to share your experience with this judge.
            </p>
          </div>
          <button className="w-full mt-4 py-3 rounded-lg bg-[var(--red-primary)] hover:bg-[var(--red-dark)] text-white font-medium transition-colors">
            Submit a Review
          </button>
        </div>

        {/* External links */}
        <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">🔗 External Sources</h2>
          <div className="flex flex-wrap gap-3">
            <a href={clProfileUrl} target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:border-[var(--red-primary)] transition-colors">
              CourtListener Profile →
            </a>
            <a href={`https://www.google.com/search?q=${encodeURIComponent(judge.name + ' judge')}`}
              target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:border-[var(--red-primary)] transition-colors">
              Google Search →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between">
      <span className="text-sm text-[var(--text-muted)]">{label}</span>
      <span className="text-sm text-[var(--text-primary)] text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-3 rounded-lg bg-[var(--bg-secondary)] text-center">
      <div className={`text-lg font-bold ${color || 'text-[var(--text-primary)]'}`}>{value}</div>
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
    </div>
  );
}
