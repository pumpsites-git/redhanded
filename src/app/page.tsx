'use client';

import { useState, useMemo } from 'react';
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

// Illinois state court coverage data for the map
const STATE_COVERAGE = [
  {
    code: 'IL',
    judgeCount: META.totalJudges,
    avgLeniency: Math.round(META.summary.avgLeniencyScore),
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
    judgeCount: 0,
    avgLeniency: null,
    dataType: 'county' as const,
    countyCount: 67,
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

export default function Home() {
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
      if (j.totalCases < 30) return false;
      if (stateFilter && j.stateCode !== stateFilter) return false;
      if (facilityFilter && j.courtFacility !== facilityFilter) return false;
      if (j.leniencyScore < leniencyMin || j.leniencyScore > leniencyMax) return false;
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
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          padding: '1.5rem 1rem',
        }}
      >
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '2rem' }}>🔴</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Red<span style={{ color: 'var(--red-primary)' }}>Handed</span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginLeft: '2.75rem' }}>
            Judicial Accountability — Track, Score, and Hold Judges Accountable
          </p>
        </div>
      </header>

      <main style={{ maxWidth: '72rem', margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Hero sub-header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.2 }}>
            Who&apos;s Letting Criminals Walk?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.375rem' }}>
            State court judges ranked by their actual sentencing decisions — Cook County, Illinois
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
            Source: {META.source} · {META.totalCases.toLocaleString()} cases · {META.totalJudges} judges · Generated {META.generated}
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

        {/* US Map */}
        <div style={{ marginBottom: '1.5rem' }}>
          <StateCourtMap
            coveredStates={STATE_COVERAGE}
            onStateClick={() => {
              // Scroll down to the judge table
              document.getElementById('judge-table')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
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
          <span style={{ fontSize: '1.25rem' }}>🗳️</span>
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
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>⚡ Compare:</span>
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
          <div style={{ overflowX: 'auto' }}>
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

        {/* Footer */}
        <footer style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem', paddingBottom: '3rem', marginTop: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            🔴 RedHanded — All data sourced from public court records
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Data: {META.source} · {META.totalCases.toLocaleString()} sentencing records · {META.totalJudges} judges
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Leniency Score: weighted composite of violent-crime probation rate (50%), overall probation rate (30%), non-prison rate (20%).
            Scores are relative to court average (avg ≈ 42).
          </p>
        </footer>
      </main>
    </div>
  );
}
