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

const ALL_JUDGES = getAllStateJudges();
const META = getJudgeProfilesMeta();
const COURT_AVG = getCourtAverage();

const ALL_FACILITIES = Array.from(
  new Set(ALL_JUDGES.map((j) => j.courtFacility).filter(Boolean))
).sort();

const AVAILABLE_STATES = getAvailableStates();

// Compute per-state stats from the unified judge list
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

function LeniencyBar({ score }: { score: number }) {
  const color = getLeniencyColor(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div
        style={{
          width: '80px',
          height: '8px',
          background: '#2a2a2a',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            background: color,
            borderRadius: '4px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <span style={{ color, fontWeight: 700, fontSize: '0.875rem', minWidth: '2.5rem' }}>
        {score}
      </span>
    </div>
  );
}

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
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--red-primary)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)' }}>
          ⚡ Side-by-Side Comparison
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '0.375rem',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.25rem 0.75rem',
            fontSize: '0.8rem',
          }}
        >
          ✕ Close
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {judges.map((j) => (
          <div key={j.slug}>
            <Link
              href={`/judges/state/${j.slug}`}
              style={{
                fontWeight: 700,
                color: getLeniencyColor(j.leniencyScore),
                fontSize: '0.95rem',
                display: 'block',
                marginBottom: '0.5rem',
                textDecoration: 'none',
              }}
            >
              {j.name}
            </Link>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              {j.courtFacility || 'Unknown Court'} · {j.totalCases} cases
            </p>
            {[
              { label: 'Prison Rate', value: j.prisonRate },
              { label: 'Probation Rate', value: j.probationRate },
              { label: 'Violent → Prison', value: j.violentCases.prisonRate },
              { label: 'Violent → Probation', value: j.violentCases.probationRate },
            ].map(({ label, value }) => (
              <div key={label} style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  <span>{label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{pct(value)}</span>
                </div>
                <div style={{ height: '6px', background: '#2a2a2a', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.round(value * 100)}%`,
                      height: '100%',
                      background: label.includes('Prison') ? '#dc2626' : '#22c55e',
                      borderRadius: '3px',
                    }}
                  />
                </div>
              </div>
            ))}
            <div style={{
              marginTop: '0.75rem',
              padding: '0.5rem',
              background: '#1a1a1a',
              borderRadius: '0.375rem',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Leniency Score</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: getLeniencyColor(j.leniencyScore) }}>
                {j.leniencyScore}
              </div>
              <div style={{ fontSize: '0.7rem', color: getLeniencyColor(j.leniencyScore) }}>
                {getLeniencyLabel(j.leniencyScore)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Platform-wide totals (IL judges + FL Bay + FL 67-county cases)
const TOTAL_JUDGES_TRACKED = META.totalJudges; // 135 IL + 11 FL Bay
const FL_COUNTY_CASES = 3593714;
const TOTAL_CASES_ANALYZED = META.totalCases + FL_COUNTY_CASES;
const STATES_COVERED = 2;

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
      // Lower threshold when filtering by state (smaller counties have fewer cases)
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
        case 'cases':
          aVal = a.totalCases; bVal = b.totalCases; break;
        case 'prison':
          aVal = a.prisonRate; bVal = b.prisonRate; break;
        case 'probation':
          aVal = a.probationRate; bVal = b.probationRate; break;
        case 'violentPrison':
          aVal = a.violentCases.prisonRate; bVal = b.violentCases.prisonRate; break;
        case 'state': {
          const cmp = a.state.localeCompare(b.state);
          return sortDir === 'desc' ? -cmp : cmp;
        }
        default:
          aVal = a.leniencyScore; bVal = b.leniencyScore; break;
      }
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return list;
  }, [stateFilter, facilityFilter, leniencyMin, leniencyMax, sortCol, sortDir]);

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

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Header */}
      <header
        className="hero-gradient"
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          padding: '2.5rem 1rem 2rem',
        }}
      >
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          {/* Headline */}
          <h1
            className="hero-headline"
            style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '0.5rem' }}
          >
            Who&apos;s Letting <span style={{ color: 'var(--red-primary)' }}>Criminals Walk?</span>
          </h1>
          <p
            className="hero-sub"
            style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '540px', lineHeight: 1.5, marginBottom: '1.75rem' }}
          >
            Real sentencing data. Real accountability.
          </p>

          {/* Stat Counters */}
          <div
            className="hero-stats-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              maxWidth: '540px',
            }}
          >
            {[
              { value: TOTAL_JUDGES_TRACKED.toLocaleString() + '+', label: 'Judges Tracked', color: '#dc2626', svg: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="3" x2="12" y2="21"/>
                  <path d="M3 7h18"/><path d="M3 7l3 6H0l3-6z"/><path d="M21 7l3 6h-6l3-6z"/>
                  <line x1="9" y1="21" x2="15" y2="21"/>
                </svg>
              ) },
              { value: TOTAL_CASES_ANALYZED.toLocaleString(), label: 'Cases Analyzed', color: '#f97316', svg: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              ) },
              { value: STATES_COVERED.toString(), label: 'States Covered', color: '#22c55e', svg: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                  <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
                </svg>
              ) },
            ].map(({ value, label, color, svg }, i) => (
              <div
                key={label}
                className="stat-value"
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRight: i < 2 ? '1px solid var(--border)' : undefined,
                  animationDelay: `${i * 0.1}s`,
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>{svg}</div>
                <div style={{ fontSize: '1.625rem', fontWeight: 900, color, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {value}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '72rem', margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Data provenance strip */}
        <div style={{ marginBottom: '1.5rem', paddingTop: '0.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Source: {META.source} · {META.totalCases.toLocaleString()} IL sentencing records + 3.59M FL records · {META.totalJudges} judges · Updated {META.generated}
          </p>
        </div>

        {/* Key Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid #7f1d1d',
              borderRadius: '0.75rem',
              padding: '1.25rem',
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#dc2626' }}>
              {summaryStats.lenient}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              judges send less than 20% of violent offenders to prison
            </p>
          </div>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>
                  {pct(summaryStats.minRate)}
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Most lenient</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{summaryStats.minJudge?.name}</p>
              </div>
              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>
                  {pct(summaryStats.maxRate)}
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Strictest</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{summaryStats.maxJudge?.name}</p>
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
              violent offenders imprisoned (judges w/ ≥5 violent cases)
            </p>
          </div>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '1.25rem',
            }}
          >
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>
              Same courthouse. Same crimes. Wildly different outcomes.
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Court average: {pct(COURT_AVG.prisonRate)} prison · {pct(COURT_AVG.probationRate)} probation
              · {pct(COURT_AVG.violentCases.prisonRate)} violent → prison
            </p>
          </div>
        </div>

        {/* US Map + State Cards */}
        <div style={{ marginBottom: '1.5rem' }}>
          <StateCourtMap
            coveredStates={STATE_COVERAGE}
            onStateClick={(code) => {
              setStateFilter(code);
              document.getElementById('judge-table')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
          {/* State coverage quick-select cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
            {[
              { code: 'IL', name: 'Illinois', detail: 'Cook County', count: IL_JUDGES.length, desc: 'Individual judge profiles' },
              { code: 'FL', name: 'Florida', detail: 'Bay · Indian River · St. Johns', count: FL_JUDGES.length, desc: 'Individual judge profiles' },
              { code: 'NY', name: 'New York', detail: 'Coming soon', count: 0, desc: 'Data collection in progress' },
            ].map(({ code, name, detail, count, desc }) => (
              <button
                key={code}
                onClick={() => count > 0 ? setStateFilter(code) : undefined}
                style={{
                  background: count > 0 && stateFilter === code ? 'rgba(220,38,38,0.1)' : 'var(--bg-card)',
                  border: `1px solid ${count > 0 && stateFilter === code ? 'rgba(220,38,38,0.5)' : 'var(--border)'}`,
                  borderRadius: '0.625rem',
                  padding: '0.875rem 1rem',
                  textAlign: 'left',
                  cursor: count > 0 ? 'pointer' : 'default',
                  opacity: count === 0 ? 0.5 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{name}</span>
                  {count > 0 && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', background: 'rgba(220,38,38,0.1)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem' }}>
                      {count} judges
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>{detail}</div>
                <div style={{ fontSize: '0.7rem', color: count > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Judicial Retention Context */}
        <div
          style={{
            background: 'rgba(220, 38, 38, 0.05)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            borderRadius: '0.75rem',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', flexShrink: 0, marginTop: '0.125rem' }}>VOTE</span>
          <div>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Judicial Retention Elections:</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {' '}Cook County judges face YES/NO retention votes. Illinois voters can remove any judge from the bench.
              These sentencing records are public information. Your vote is your voice.
            </span>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'flex-end',
          }}
        >
          {/* Search box */}
          <div style={{ flex: '1 1 220px', minWidth: '180px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Search
            </label>
            <div style={{ position: 'relative' }}>
              <svg
                width="14" height="14"
                viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search judges by name, county, or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.375rem',
                  color: 'var(--text-primary)',
                  padding: '0.375rem 0.75rem 0.375rem 2rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              State
            </label>
            <select
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value); setFacilityFilter(''); }}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '0.375rem',
                color: 'var(--text-primary)',
                padding: '0.375rem 0.75rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <option value="">All States</option>
              {AVAILABLE_STATES.map((s) => (
                <option key={s.code} value={s.code}>{s.name} ({s.county})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Court Facility
            </label>
            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '0.375rem',
                color: 'var(--text-primary)',
                padding: '0.375rem 0.75rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <option value="">All Courts</option>
              {ALL_FACILITIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Leniency Score: {leniencyMin}–{leniencyMax}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="range"
                min={0}
                max={100}
                value={leniencyMin}
                onChange={(e) => setLeniencyMin(Math.min(Number(e.target.value), leniencyMax))}
                style={{ width: '80px', accentColor: '#dc2626' }}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={leniencyMax}
                onChange={(e) => setLeniencyMax(Math.max(Number(e.target.value), leniencyMin))}
                style={{ width: '80px', accentColor: '#dc2626' }}
              />
            </div>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {filtered.length} of {ALL_JUDGES.length} judges
          </span>
        </div>

        {/* Compare panel */}
        {showCompare && judge1 && judge2 && (
          <ComparePanel judge1={judge1} judge2={judge2} onClose={() => setShowCompare(false)} />
        )}

        {/* Compare selector */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Compare:</span>
          <select
            value={compare1}
            onChange={(e) => setCompare1(e.target.value)}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              color: 'var(--text-primary)',
              padding: '0.375rem 0.75rem',
              fontSize: '0.875rem',
              cursor: 'pointer',
              flex: 1,
              minWidth: '180px',
            }}
          >
            <option value="">Select Judge 1...</option>
            {ALL_JUDGES.sort((a, b) => a.name.localeCompare(b.name)).map((j) => (
              <option key={j.slug} value={j.slug}>{j.name}</option>
            ))}
          </select>
          <span style={{ color: 'var(--text-muted)' }}>vs</span>
          <select
            value={compare2}
            onChange={(e) => setCompare2(e.target.value)}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              color: 'var(--text-primary)',
              padding: '0.375rem 0.75rem',
              fontSize: '0.875rem',
              cursor: 'pointer',
              flex: 1,
              minWidth: '180px',
            }}
          >
            <option value="">Select Judge 2...</option>
            {ALL_JUDGES.sort((a, b) => a.name.localeCompare(b.name)).map((j) => (
              <option key={j.slug} value={j.slug}>{j.name}</option>
            ))}
          </select>
          <button
            disabled={!compare1 || !compare2 || compare1 === compare2}
            onClick={() => setShowCompare(true)}
            style={{
              background: compare1 && compare2 && compare1 !== compare2 ? '#dc2626' : '#2a2a2a',
              border: 'none',
              borderRadius: '0.375rem',
              color: 'var(--text-primary)',
              cursor: compare1 && compare2 && compare1 !== compare2 ? 'pointer' : 'not-allowed',
              padding: '0.375rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              opacity: compare1 && compare2 && compare1 !== compare2 ? 1 : 0.5,
            }}
          >
            Compare →
          </button>
        </div>

        {/* Judge Table */}
        <div
          id="judge-table"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Judge
                  </th>
                  <th
                    onClick={() => toggleSort('state')}
                    style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    State {sortCol === 'state' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th
                    onClick={() => toggleSort('cases')}
                    style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Cases {sortCol === 'cases' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th
                    onClick={() => toggleSort('prison')}
                    style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Prison % {sortCol === 'prison' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th
                    onClick={() => toggleSort('probation')}
                    style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Probation % {sortCol === 'probation' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th
                    onClick={() => toggleSort('violentPrison')}
                    style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Violent → Prison {sortCol === 'violentPrison' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th
                    onClick={() => toggleSort('leniency')}
                    style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Leniency Score {sortCol === 'leniency' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((judge, idx) => {
                  const color = getLeniencyColor(judge.leniencyScore);
                  return (
                    <tr
                      key={judge.slug}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                        transition: 'background 0.1s ease',
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <Link
                          href={`/judges/state/${judge.slug}`}
                          style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}
                        >
                          {judge.name}
                        </Link>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          {judge.courtFacility || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600 }}>{judge.stateCode}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{judge.county}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {judge.totalCases.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: judge.prisonRate > COURT_AVG.prisonRate ? '#22c55e' : '#f97316', fontSize: '0.875rem' }}>
                        {pct(judge.prisonRate)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: judge.probationRate > COURT_AVG.probationRate ? '#dc2626' : '#22c55e', fontSize: '0.875rem' }}>
                        {pct(judge.probationRate)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem' }}>
                        {judge.violentCases.total >= 1 ? (
                          <span style={{ fontWeight: 600, color: judge.violentCases.prisonRate < 0.3 ? '#dc2626' : '#22c55e' }}>
                            {pct(judge.violentCases.prisonRate)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                        {judge.violentCases.total >= 1 && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
                            ({judge.violentCases.total})
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                          <LeniencyBar score={judge.leniencyScore} />
                          <span style={{ fontSize: '0.65rem', color }}>
                            {getLeniencyLabel(judge.leniencyScore)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Federal Judges Link */}
        <div
          style={{
            marginTop: '2rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
              Also on RedHanded
            </p>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
              Federal Judges
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Browse {'>'}900 federal judges with accountability scores from CourtListener
            </p>
          </div>
          <Link
            href="/judges/federal"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              color: 'var(--text-secondary)',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Federal Judges →
          </Link>
        </div>

        {/* Methodology note */}
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem 1.25rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: 'var(--text-secondary)' }}>Methodology:</strong>{' '}
          Leniency Score is a weighted composite: violent-crime probation rate (50%), overall probation rate (30%), non-prison rate (20%).
          Scores are normalized relative to court average (avg ≈ 42). Only judges with ≥30 cases shown by default.
          {' '}<a href="/methodology" style={{ color: 'var(--red-primary)', textDecoration: 'none' }}>Full methodology →</a>
        </div>
      </main>
    </div>
  );
}
