'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { allJudges } from '@/lib/judges';

export default function JudgeProfile() {
  const params = useParams();
  const judge = allJudges.find(j => j.clId === Number(params.id));

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
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-[var(--bg-secondary)] border-2 border-[var(--border)] flex items-center justify-center text-3xl shrink-0">
              ⚖️
            </div>

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
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-muted)]">Court</span>
                <span className="text-sm text-[var(--text-primary)] text-right max-w-[60%]">{judge.courtFull}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-muted)]">Jurisdiction</span>
                <span className="text-sm text-[var(--text-primary)]">{judge.jurisdiction}</span>
              </div>
              {judge.education && (
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Law School</span>
                  <span className="text-sm text-[var(--text-primary)]">{judge.education}</span>
                </div>
              )}
              {judge.yearStarted && (
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Appointed</span>
                  <span className="text-sm text-[var(--text-primary)]">{judge.yearStarted}</span>
                </div>
              )}
              {judge.appointedBy && (
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Appointed By</span>
                  <span className="text-sm text-[var(--text-primary)]">{judge.appointedBy}</span>
                </div>
              )}
              {judge.party && (
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Party</span>
                  <span className={`text-sm font-medium ${
                    judge.party === 'Republican' ? 'text-red-400' : 'text-blue-400'
                  }`}>{judge.party}</span>
                </div>
              )}
              {judge.confirmationVotesYes !== null && (
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Confirmation Vote</span>
                  <span className="text-sm text-[var(--text-primary)]">
                    {judge.confirmationVotesYes}-{judge.confirmationVotesNo}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Accountability Score */}
          <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">📊 Accountability Score</h2>

            <div className="p-6 rounded-lg bg-[var(--bg-secondary)] text-center">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-xl font-bold text-amber-400">Data Collection In Progress</div>
              <p className="text-sm text-[var(--text-muted)] mt-2">
                We&apos;re collecting case outcome data from PACER and the US Sentencing Commission to calculate
                this judge&apos;s accountability score. Check back soon.
              </p>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-[var(--bg-secondary)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Score Components (coming soon):</h3>
              <div className="space-y-2 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Reversal Rate (25%) — How often decisions are overturned</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Guideline Adherence (25%) — Sentencing vs. recommended guidelines</span>
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

        {/* Community Reviews placeholder */}
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
