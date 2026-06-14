'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  getAllStateJudges,
  getJudgeProfilesMeta,
  getCourtAverage,
  getAvailableStates,
  getLeniencyLabel,
  getLeniencyColor,
  pct,
  StateJudge,
} from '@/lib/state-judges';
import StateCourtMap from '@/components/StateCourtMap';
import { LeniencyBar } from '@/components/LeniencyBar';

const ALL_JUDGES = getAllStateJudges();
const META = getJudgeProfilesMeta();
const COURT_AVG = getCourtAverage();

const ALL_FACILITIES = Array.from(
  new Set(ALL_JUDGES.map((j) => j.courtFacility).filter(Boolean))
).sort();

const AVAILABLE_STATES = getAvailableStates();

const IL_JUDGES = ALL_JUDGES.filter(j => j.stateCode === 'IL');
const FL_JUDGES = ALL_JUDGES.filter(j => j.stateCode === 'FL');

const STATE_COVERAGE = [
  {
    code: 'IL',
    judgeCount: IL_JUDGES.length,
    avgLeniency: IL_JUDGES.length
      ? Math.round(IL_JUDGES.reduce((s, j) => s + j.leniencyScore, 0) / IL_JUDGES.length)
      : null,
    dataType: 'judge' as const,
  },
  {
    code: 'NY',
    judgeCount: 0,
    avgLeniency: null,
    dataType: 'judge' as const,
  },
  {
    code: 'FL',
    judgeCount: FL_JUDGES.length,
    avgLeniency: FL_JUDGES.length
      ? Math.round(FL_JUDGES.reduce((s, j) => s + j.leniencyScore, 0) / FL_JUDGES.length)
      : null,
    dataType: 'judge' as const,
    countyCount: 3,
  },
];

const FL_COUNTY_CASES = 3599352;
const TOTAL_CASES_ANALYZED = META.totalCases + FL_COUNTY_CASES;
const STATES_COVERED = 2;

function ComparePanel({
  judge1,
  judge2,
  onClose,
}: {
  judge1: StateJudge;
  judge2: StateJudge;
  onClose: () => void;
}) {
  const judges = [judge1, judge2];
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--red-primary)] rounded-xl p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-[var(--text-primary)]">⚡ Side-by-Side Comparison</h3>
        <button
          onClick={onClose}
          className="bg-transparent border border-[var(--border)] rounded text-[var(--text-muted)] cursor-pointer px-3 py-1 text-xs hover:border-[var(--red-primary)] transition-colors"
        >
          ✕ Close
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {judges.map((j) => (
          <div key={j.slug}>
            <Link
              href={`/judges/state/${j.slug}`}
              className="font-bold text-sm block mb-1 no-underline hover:underline"
              style={{ color: getLeniencyColor(j.leniencyScore) }}
            >
              {j.name}
            </Link>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              {j.courtFacility || 'Unknown Court'} · {j.totalCases} cases
            </p>
            {[
              { label: 'Prison Rate', value: j.prisonRate },
              { label: 'Probation Rate', value: j.probationRate },
              { label: 'Violent → Prison', value: j.violentCases.prisonRate },
              { label: 'Violent → Probation', value: j.violentCases.probationRate },
            ].map(({ label, value }) => (
              <div key={label} className="mb-2">
                <div className="flex justify-between text-xs text-[var(--text-muted)] mb-0.5">
                  <span>{label}</span>
                  <span className="text-[var(--text-primary)] font-semibold">{pct(value)}</span>
                </div>
                <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round(value * 100)}%`,
                      background: label.includes('Prison') ? '#dc2626' : '#22c55e',
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="mt-3 p-2 bg-[var(--bg-primary)] rounded text-center">
              <span className="text-xs text-[var(--text-muted)]">Leniency Score</span>
              <div className="text-2xl font-extrabold" style={{ color: getLeniencyColor(j.leniencyScore) }}>
                {j.leniencyScore}
              </div>
              <div className="text-xs" style={{ color: getLeniencyColor(j.leniencyScore) }}>
                {getLeniencyLabel(j.leniencyScore)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('');
  const [leniencyMin, setLeniencyMin] = useState(0);
  const [leniencyMax, setLeniencyMax] = useState(100);
  const [sortCol, setSortCol] = useState<'leniency' | 'cases' | 'prison' | 'probation' | 'violentPrison' | 'state'>('leniency');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [compare1, setCompare1] = useState<string>('');
  const [compare2, setCompare2] = useState<string>('');
  const [showCompare, setShowCompare] = useState(false);

  const filtered = useMemo(() => {
    let list = ALL_JUDGES.filter((j) => {
      const minCases = stateFilter || searchQuery ? 3 : 30;
      if (j.totalCases < minCases) return false;
      if (stateFilter && j.stateCode !== stateFilter) return false;
      if (facilityFilter && j.courtFacility !== facilityFilter) return false;
      if (j.leniencyScore < leniencyMin || j.leniencyScore > leniencyMax) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = j.name.toLowerCase().includes(q);
        const countyMatch = j.county.toLowerCase().includes(q);
        const stateMatch = j.state.toLowerCase().includes(q) || j.stateCode.toLowerCase().includes(q);
        const courtMatch = (j.courtFacility || '').toLowerCase().includes(q);
        if (!nameMatch && !countyMatch && !stateMatch && !courtMatch) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortCol) {
        case 'cases': aVal = a.totalCases; bVal = b.totalCases; break;
        case 'prison': aVal = a.prisonRate; bVal = b.prisonRate; break;
        case 'probation': aVal = a.probationRate; bVal = b.probationRate; break;
        case 'violentPrison': aVal = a.violentCases.prisonRate; bVal = b.violentCases.prisonRate; break;
        case 'state': {
          const cmp = a.state.localeCompare(b.state);
          return sortDir === 'desc' ? -cmp : cmp;
        }
        default: aVal = a.leniencyScore; bVal = b.leniencyScore; break;
      }
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return list;
  }, [stateFilter, facilityFilter, leniencyMin, leniencyMax, sortCol, sortDir, searchQuery]);

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  const judge1 = ALL_JUDGES.find((j) => j.slug === compare1) ?? null;
  const judge2 = ALL_JUDGES.find((j) => j.slug === compare2) ?? null;

  const summaryStats = useMemo(() => {
    const withViolent = ALL_JUDGES.filter((j) => j.violentCases.total >= 5);
    const lenient = withViolent.filter((j) => j.violentCases.prisonRate < 0.20).length;
    const prisonRates = withViolent.map((j) => j.violentCases.prisonRate);
    const minRate = Math.min(...prisonRates);
    const maxRate = Math.max(...prisonRates);
    const minJudge = withViolent.find((j) => j.violentCases.prisonRate === minRate);
    const maxJudge = withViolent.find((j) => j.violentCases.prisonRate === maxRate);
    return { lenient, minRate, maxRate, minJudge, maxJudge };
  }, []);

  const sortedForCompare = useMemo(
    () => [...ALL_JUDGES].sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const SortTh = ({
    col,
    children,
    align = 'right',
  }: {
    col: typeof sortCol;
    children: React.ReactNode;
    align?: 'left' | 'right';
  }) => (
    <th
      onClick={() => toggleSort(col)}
      className={`px-4 py-3 text-xs text-[var(--text-muted)] font-semibold cursor-pointer whitespace-nowrap select-none hover:text-[var(--text-primary)] transition-colors text-${align}`}
    >
      {children} {sortCol === col ? (sortDir === 'desc' ? '↓' : '↑') : ''}
    </th>
  );

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <header className="hero-gradient border-b border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="hero-headline text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-2">
            Who&apos;s Letting <span className="text-[var(--red-primary)]">Criminals Walk?</span>
          </h1>
          <p className="hero-sub text-[var(--text-secondary)] text-sm sm:text-base max-w-lg leading-relaxed mb-6">
            Real sentencing data. Real accountability.
          </p>

          {/* Stat Counters */}
          <div className="hero-stats-grid grid grid-cols-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden max-w-lg">
            {[
              {
                value: META.totalJudges.toLocaleString() + '+',
                label: 'Judges Tracked',
                color: '#dc2626',
                svg: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="3" x2="12" y2="21"/>
                    <path d="M3 7h18"/><path d="M3 7l3 6H0l3-6z"/><path d="M21 7l3 6h-6l3-6z"/>
                    <line x1="9" y1="21" x2="15" y2="21"/>
                  </svg>
                ),
              },
              {
                value: TOTAL_CASES_ANALYZED.toLocaleString(),
                label: 'Cases Analyzed',
                color: '#f97316',
                svg: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                ),
              },
              {
                value: STATES_COVERED.toString(),
                label: 'States Covered',
                color: '#22c55e',
                svg: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                    <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
                  </svg>
                ),
              },
            ].map(({ value, label, color, svg }, i) => (
              <div
                key={label}
                className={`stat-value px-3 py-4 sm:px-5 text-center ${i < 2 ? 'border-r border-[var(--border)]' : ''}`}
              >
                <div className="flex justify-center mb-1">{svg}</div>
                <div className="text-xl sm:text-2xl font-black leading-none tracking-tight" style={{ color }}>
                  {value}
                </div>
                <div className="text-[0.65rem] text-[var(--text-muted)] mt-1 uppercase tracking-wider">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">

        {/* Data provenance strip */}
        <p className="text-xs text-[var(--text-muted)] mb-6">
          Source: {META.source} · {META.totalCases.toLocaleString()} IL sentencing records + 3.6M FL records · {META.totalJudges} judges · Updated {META.generated}
        </p>

        {/* Key Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-[var(--bg-card)] border border-red-900 rounded-xl p-5">
            <div className="text-3xl font-extrabold text-red-600">{summaryStats.lenient}</div>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              judges send less than 20% of violent offenders to prison
            </p>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex gap-6">
              <div>
                <div className="text-2xl font-extrabold text-red-600">{pct(summaryStats.minRate)}</div>
                <p className="text-[0.7rem] text-[var(--text-muted)]">Most lenient</p>
                <p className="text-xs text-[var(--text-secondary)]">{summaryStats.minJudge?.name}</p>
              </div>
              <div className="border-l border-[var(--border)] pl-6">
                <div className="text-2xl font-extrabold text-green-500">{pct(summaryStats.maxRate)}</div>
                <p className="text-[0.7rem] text-[var(--text-muted)]">Strictest</p>
                <p className="text-xs text-[var(--text-secondary)]">{summaryStats.maxJudge?.name}</p>
              </div>
            </div>
            <p className="text-[var(--text-muted)] text-xs mt-3">
              violent offenders imprisoned (judges w/ ≥5 violent cases)
            </p>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 sm:col-span-2 lg:col-span-1">
            <div className="text-lg font-bold text-amber-400">
              Same courthouse. Same crimes. Wildly different outcomes.
            </div>
            <p className="text-[var(--text-muted)] text-xs mt-2">
              Court average: {pct(COURT_AVG.prisonRate)} prison · {pct(COURT_AVG.probationRate)} probation
              · {pct(COURT_AVG.violentCases.prisonRate)} violent → prison
            </p>
          </div>
        </div>

        {/* US Map + State Cards */}
        <div className="mb-6">
          <StateCourtMap
            coveredStates={STATE_COVERAGE}
            onStateClick={(code) => {
              setStateFilter(code);
              document.getElementById('judge-table')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            {[
              { code: 'IL', name: 'Illinois', detail: 'Cook County', count: IL_JUDGES.length, desc: 'Individual judge profiles' },
              { code: 'FL', name: 'Florida', detail: 'Bay · Indian River · St. Johns', count: FL_JUDGES.length, desc: 'Individual judge profiles' },
              { code: 'NY', name: 'New York', detail: 'Coming soon', count: 0, desc: 'Data collection in progress' },
            ].map(({ code, name, detail, count, desc }) => (
              <button
                key={code}
                onClick={() => count > 0 ? setStateFilter(code) : undefined}
                className={`bg-[var(--bg-card)] rounded-xl p-3.5 text-left transition-all duration-150
                  ${count > 0 ? 'cursor-pointer hover:border-red-700' : 'cursor-default opacity-50'}
                  ${count > 0 && stateFilter === code
                    ? 'border border-red-700 bg-red-950/20'
                    : 'border border-[var(--border)]'
                  }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-[0.95rem] text-[var(--text-primary)]">{name}</span>
                  {count > 0 && (
                    <span className="text-xs font-bold text-red-500 bg-red-950/40 px-1.5 py-0.5 rounded">
                      {count} judges
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--text-muted)]">{detail}</div>
                <div className={`text-xs mt-0.5 ${count > 0 ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'}`}>{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Judicial Retention Context */}
        <div className="flex gap-3 items-start bg-red-950/10 border border-red-900/40 rounded-xl px-5 py-4 mb-6">
          <span className="text-red-500 text-xs font-bold uppercase tracking-wider shrink-0 mt-0.5">VOTE</span>
          <div>
            <strong className="text-[var(--text-primary)] text-sm">Judicial Retention Elections:</strong>
            <span className="text-[var(--text-secondary)] text-sm">
              {' '}Cook County judges face YES/NO retention votes. Illinois voters can remove any judge from the bench.
              These sentencing records are public information. Your vote is your voice.
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4 mb-6 flex flex-wrap gap-4 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-[var(--text-muted)] block mb-1">Search</label>
            <div className="relative">
              <svg
                width="14" height="14"
                viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Name, county, or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded text-[var(--text-primary)] pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-[var(--red-primary)] transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">State</label>
            <select
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value); setFacilityFilter(''); }}
              className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded text-[var(--text-primary)] px-3 py-1.5 text-sm cursor-pointer focus:outline-none"
            >
              <option value="">All States</option>
              {AVAILABLE_STATES.map((s) => (
                <option key={s.code} value={s.code}>{s.name} ({s.county})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Court Facility</label>
            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded text-[var(--text-primary)] px-3 py-1.5 text-sm cursor-pointer focus:outline-none"
            >
              <option value="">All Courts</option>
              {ALL_FACILITIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">
              Leniency: {leniencyMin}–{leniencyMax}
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="range" min={0} max={100} value={leniencyMin}
                onChange={(e) => setLeniencyMin(Math.min(Number(e.target.value), leniencyMax))}
                className="w-20 accent-red-600"
              />
              <input
                type="range" min={0} max={100} value={leniencyMax}
                onChange={(e) => setLeniencyMax(Math.max(Number(e.target.value), leniencyMin))}
                className="w-20 accent-red-600"
              />
            </div>
          </div>
          <span className="text-xs text-[var(--text-muted)] ml-auto">
            {filtered.length} of {ALL_JUDGES.length} judges
          </span>
        </div>

        {/* Compare panel */}
        {showCompare && judge1 && judge2 && (
          <ComparePanel judge1={judge1} judge2={judge2} onClose={() => setShowCompare(false)} />
        )}

        {/* Compare selector */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4 mb-6 flex flex-wrap gap-3 items-center">
          <span className="text-sm text-[var(--text-secondary)] font-semibold">Compare:</span>
          <select
            value={compare1}
            onChange={(e) => setCompare1(e.target.value)}
            className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded text-[var(--text-primary)] px-3 py-1.5 text-sm cursor-pointer focus:outline-none flex-1 min-w-[180px]"
          >
            <option value="">Select Judge 1...</option>
            {sortedForCompare.map((j) => (
              <option key={j.slug} value={j.slug}>{j.name}</option>
            ))}
          </select>
          <span className="text-[var(--text-muted)]">vs</span>
          <select
            value={compare2}
            onChange={(e) => setCompare2(e.target.value)}
            className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded text-[var(--text-primary)] px-3 py-1.5 text-sm cursor-pointer focus:outline-none flex-1 min-w-[180px]"
          >
            <option value="">Select Judge 2...</option>
            {sortedForCompare.map((j) => (
              <option key={j.slug} value={j.slug}>{j.name}</option>
            ))}
          </select>
          <button
            disabled={!compare1 || !compare2 || compare1 === compare2}
            onClick={() => setShowCompare(true)}
            className={`rounded text-[var(--text-primary)] px-4 py-1.5 text-sm font-semibold transition-all
              ${compare1 && compare2 && compare1 !== compare2
                ? 'bg-[var(--red-primary)] cursor-pointer hover:bg-red-700'
                : 'bg-[#2a2a2a] cursor-not-allowed opacity-50'
              }`}
          >
            Compare →
          </button>
        </div>

        {/* Judge Table */}
        <div
          id="judge-table"
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden"
        >
          {/* Mobile card view */}
          <div className="md:hidden">
            {filtered.length === 0 ? (
              <p className="text-center text-[var(--text-muted)] py-12 text-sm">No judges match your filters.</p>
            ) : (
              filtered.map((judge) => {
                const color = getLeniencyColor(judge.leniencyScore);
                return (
                  <div key={judge.slug} className="border-b border-[var(--border)] p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Link
                          href={`/judges/state/${judge.slug}`}
                          className="font-semibold text-sm text-[var(--text-primary)] no-underline hover:text-[var(--red-primary)] transition-colors"
                        >
                          {judge.name}
                        </Link>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">
                          {judge.stateCode} · {judge.county}
                        </div>
                      </div>
                      <LeniencyBar score={judge.leniencyScore} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[var(--text-muted)]">Cases</span>
                        <div className="font-semibold text-[var(--text-secondary)]">{judge.totalCases.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Prison</span>
                        <div className="font-semibold" style={{ color: judge.prisonRate > COURT_AVG.prisonRate ? '#22c55e' : '#f97316' }}>
                          {pct(judge.prisonRate)}
                        </div>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">V→Prison</span>
                        <div className="font-semibold" style={{ color: judge.violentCases.prisonRate < 0.3 ? '#dc2626' : '#22c55e' }}>
                          {judge.violentCases.total >= 1 ? pct(judge.violentCases.prisonRate) : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                  <th className="px-4 py-3 text-left text-xs text-[var(--text-muted)] font-semibold whitespace-nowrap">Judge</th>
                  <SortTh col="state" align="left">State</SortTh>
                  <SortTh col="cases">Cases</SortTh>
                  <SortTh col="prison">Prison %</SortTh>
                  <SortTh col="probation">Probation %</SortTh>
                  <SortTh col="violentPrison">Violent → Prison</SortTh>
                  <SortTh col="leniency" align="left">Leniency Score</SortTh>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-[var(--text-muted)] py-12 text-sm">
                      No judges match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((judge, idx) => {
                    const color = getLeniencyColor(judge.leniencyScore);
                    return (
                      <tr
                        key={judge.slug}
                        className={`border-b border-[var(--border)] table-row ${idx % 2 !== 0 ? 'bg-white/[0.01]' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/judges/state/${judge.slug}`}
                            className="text-[var(--text-primary)] no-underline font-semibold text-sm hover:text-[var(--red-primary)] transition-colors"
                          >
                            {judge.name}
                          </Link>
                          <div className="text-[0.7rem] text-[var(--text-muted)] mt-0.5">
                            {judge.courtFacility || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)] whitespace-nowrap">
                          <div className="font-semibold">{judge.stateCode}</div>
                          <div className="text-[0.65rem] text-[var(--text-muted)]">{judge.county}</div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-[var(--text-secondary)]">
                          {judge.totalCases.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-sm" style={{ color: judge.prisonRate > COURT_AVG.prisonRate ? '#22c55e' : '#f97316' }}>
                          {pct(judge.prisonRate)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-sm" style={{ color: judge.probationRate > COURT_AVG.probationRate ? '#dc2626' : '#22c55e' }}>
                          {pct(judge.probationRate)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          {judge.violentCases.total >= 1 ? (
                            <span className="font-semibold" style={{ color: judge.violentCases.prisonRate < 0.3 ? '#dc2626' : '#22c55e' }}>
                              {pct(judge.violentCases.prisonRate)}
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)]">—</span>
                          )}
                          {judge.violentCases.total >= 1 && (
                            <span className="text-[0.65rem] text-[var(--text-muted)] ml-1">
                              ({judge.violentCases.total})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <LeniencyBar score={judge.leniencyScore} showLabel />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Federal Judges Link */}
        <div className="mt-8 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-6 py-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Also on RedHanded</p>
            <h3 className="font-bold text-[var(--text-primary)]">Federal Judges</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Browse {'>'}900 federal judges with accountability scores from CourtListener
            </p>
          </div>
          <Link
            href="/judges/federal"
            className="inline-flex items-center gap-1.5 bg-transparent border border-[var(--border)] rounded-lg text-[var(--text-secondary)] px-4 py-2 text-sm font-semibold no-underline whitespace-nowrap hover:border-[var(--red-primary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Federal Judges →
          </Link>
        </div>

        {/* Methodology note */}
        <div className="mt-8 px-5 py-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-muted)] leading-relaxed">
          <strong className="text-[var(--text-secondary)]">Methodology:</strong>{' '}
          Leniency Score is a weighted composite: violent-crime probation rate (50%), overall probation rate (30%), non-prison rate (20%).
          Scores are normalized relative to court average (avg ≈ 42). Only judges with ≥30 cases shown by default.
          {' '}<Link href="/methodology" className="text-[var(--red-primary)] no-underline hover:underline">Full methodology →</Link>
        </div>
      </main>
    </div>
  );
}
