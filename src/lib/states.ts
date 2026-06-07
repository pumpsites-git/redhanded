import stateStatsRaw from '../../data/ussc/state-stats-fy25.json';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface StateDistrict {
  code: string;
  name: string;
  courtListenerId: string;
  circuit: number;
  totalCases: number;
}

export interface StateStats {
  stateCode: string;
  stateName: string;
  districtCount: number;
  districts: StateDistrict[];

  totalCases: number;
  avgSentenceMonths: number;
  belowGuidelinesRate: number;
  recidivismRate: number;
  highCriminalHistoryRate: number;
  categoryViRate: number;
  avgCriminalHistoryPoints: number;
  avgAge: number;
  firearmEnhancementRate: number;

  totalRepeatOffenders: number;
  totalHighCrimhist: number;
  totalCatVi: number;
  totalBelowGuidelines: number;
  totalWithinGuidelines: number;
  totalAboveGuidelines: number;
  totalFirearmEnhancements: number;

  offenseTypes: Record<string, number>;
  crimhistDistribution: Record<string, number>;
  raceDistribution: Record<string, number>;
  genderDistribution: Record<string, number>;
  drugTypes: Record<string, number>;
}

export interface StateNationalAverages {
  totalCases: number;
  avgSentenceMonths: number;
  belowGuidelinesRate: number;
  recidivismRate: number;
  highCriminalHistoryRate: number;
  categoryViRate: number;
  avgCriminalHistoryPoints: number;
  avgAge: number;
  stateCount: number;
}

export type StateSortMetric =
  | 'recidivism'
  | 'sentence'
  | 'belowGuidelines'
  | 'caseVolume'
  | 'dangerous';

// ─── State name mapping ────────────────────────────────────────────────────────

export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', GU: 'Guam', HI: 'Hawaii', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky',
  LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
  MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina',
  ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', PR: 'Puerto Rico', RI: 'Rhode Island',
  SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas',
  UT: 'Utah', VT: 'Vermont', VA: 'Virginia', VI: 'Virgin Islands',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  MP: 'Northern Mariana Islands',
};

// State flag emojis (regional indicator symbols)
export const STATE_FLAGS: Record<string, string> = {
  AL: '🏴', AK: '🏔️', AZ: '🌵', AR: '🌾', CA: '🌴',
  CO: '⛰️', CT: '🦃', DE: '🔵', DC: '🏛️', FL: '🌞',
  GA: '🍑', GU: '🏝️', HI: '🌺', ID: '🥔', IL: '🌽',
  IN: '🏎️', IA: '🌽', KS: '🌾', KY: '🏇', LA: '🎷',
  ME: '🦞', MD: '🦀', MA: '🦞', MI: '🚗', MN: '🌲',
  MS: '🎸', MO: '🏞️', MT: '🦌', NE: '🌽', NV: '🎰',
  NH: '🍁', NJ: '🌆', NM: '🌵', NY: '🗽', NC: '🏔️',
  ND: '🌾', OH: '🔔', OK: '🌾', OR: '🌲', PA: '🔔',
  PR: '🏝️', RI: '⚓', SC: '🌴', SD: '🦅', TN: '🎸',
  TX: '⭐', UT: '🧂', VT: '🍁', VA: '🏛️', VI: '🏝️',
  WA: '🌲', WV: '⛏️', WI: '🧀', WY: '🤠', MP: '🏝️',
};

// ─── Load data ─────────────────────────────────────────────────────────────────

const raw = stateStatsRaw as {
  generatedAt: string;
  nationalAverages: StateNationalAverages;
  states: Record<string, StateStats>;
};

let _states: StateStats[] | null = null;

export function getAllStates(): StateStats[] {
  if (!_states) {
    _states = Object.values(raw.states).filter(s => s.totalCases > 0);
  }
  return _states;
}

export function getStateByCode(code: string): StateStats | undefined {
  return raw.states[code.toUpperCase()];
}

export function getStateNationalAverages(): StateNationalAverages {
  return raw.nationalAverages;
}

// ─── Sorting / ranking ─────────────────────────────────────────────────────────

export function sortStatesByMetric(
  states: StateStats[],
  metric: StateSortMetric,
  asc = false
): StateStats[] {
  const getVal = (s: StateStats): number => {
    switch (metric) {
      case 'recidivism': return s.recidivismRate;
      case 'sentence': return s.avgSentenceMonths;
      case 'belowGuidelines': return s.belowGuidelinesRate;
      case 'caseVolume': return s.totalCases;
      case 'dangerous': return s.highCriminalHistoryRate;
    }
  };
  return [...states].sort((a, b) =>
    asc ? getVal(a) - getVal(b) : getVal(b) - getVal(a)
  );
}

// ─── Composite score (0–100, lower = worse judicial outcomes) ──────────────────

export function computeStateScore(state: StateStats, nat: StateNationalAverages): number {
  // Higher below-guidelines → more lenient → worse (lower score)
  // Higher recidivism → worse
  // Higher high-risk % → worse (though not judge-controlled)
  const belowFactor = 1 - (state.belowGuidelinesRate / 0.8); // 0=good, 1=bad
  const recidFactor = Math.min(state.recidivismRate / 30, 1); // 0=good, 1=bad
  const dangFactor = Math.min(state.highCriminalHistoryRate / 0.5, 1);

  const rawScore = 100 - (belowFactor * 40 + recidFactor * 40 + dangFactor * 20);
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

export function getScoreGrade(score: number): { grade: string; color: string; label: string } {
  if (score >= 80) return { grade: 'A', color: '#16a34a', label: 'Strong' };
  if (score >= 65) return { grade: 'B', color: '#65a30d', label: 'Above Avg' };
  if (score >= 50) return { grade: 'C', color: '#ca8a04', label: 'Average' };
  if (score >= 35) return { grade: 'D', color: '#ea580c', label: 'Below Avg' };
  return { grade: 'F', color: '#dc2626', label: 'Critical' };
}

// ─── Color helpers ─────────────────────────────────────────────────────────────

export function getStateMetricColor(state: StateStats, metric: StateSortMetric): string {
  switch (metric) {
    case 'recidivism': {
      const r = state.recidivismRate;
      if (r < 8) return '#16a34a';
      if (r < 12) return '#ca8a04';
      if (r < 18) return '#ea580c';
      return '#dc2626';
    }
    case 'belowGuidelines': {
      const r = state.belowGuidelinesRate;
      if (r < 0.35) return '#16a34a';
      if (r < 0.5) return '#ca8a04';
      if (r < 0.65) return '#ea580c';
      return '#dc2626';
    }
    case 'sentence': {
      const r = state.avgSentenceMonths;
      if (r < 35) return '#16a34a';
      if (r < 55) return '#ca8a04';
      if (r < 80) return '#ea580c';
      return '#dc2626';
    }
    case 'caseVolume': {
      const r = state.totalCases;
      if (r < 500) return '#16a34a';
      if (r < 2000) return '#ca8a04';
      if (r < 5000) return '#ea580c';
      return '#dc2626';
    }
    case 'dangerous': {
      const r = state.highCriminalHistoryRate;
      if (r < 0.2) return '#16a34a';
      if (r < 0.3) return '#ca8a04';
      if (r < 0.4) return '#ea580c';
      return '#dc2626';
    }
  }
}

export function getStateMapColor(state: StateStats, metric: StateSortMetric, maxVal: number): string {
  const val = getStateMetricVal(state, metric);
  const frac = maxVal > 0 ? Math.min(val / maxVal, 1) : 0;
  // Linear interpolation from dark-green to red
  // We'll use discrete buckets
  if (frac < 0.2) return '#166534';
  if (frac < 0.4) return '#15803d';
  if (frac < 0.6) return '#a16207';
  if (frac < 0.8) return '#b45309';
  return '#dc2626';
}

export function getStateMetricVal(state: StateStats, metric: StateSortMetric): number {
  switch (metric) {
    case 'recidivism': return state.recidivismRate;
    case 'sentence': return state.avgSentenceMonths;
    case 'belowGuidelines': return state.belowGuidelinesRate * 100;
    case 'caseVolume': return state.totalCases;
    case 'dangerous': return state.highCriminalHistoryRate * 100;
  }
}

// ─── Formatting ────────────────────────────────────────────────────────────────

export function pct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function months(value: number): string {
  return `${value.toFixed(1)} mo`;
}

export function formatDelta(value: number, invert = false): { text: string; color: string } {
  const isPositive = value >= 0;
  const isBad = invert ? isPositive : !isPositive;
  return {
    text: `${isPositive ? '+' : ''}${value.toFixed(1)}`,
    color: isBad ? '#dc2626' : '#16a34a',
  };
}

export function formatPctDelta(value: number, invert = false): { text: string; color: string } {
  const isPositive = value >= 0;
  const isBad = invert ? isPositive : !isPositive;
  return {
    text: `${isPositive ? '+' : ''}${(value * 100).toFixed(1)}pp`,
    color: isBad ? '#dc2626' : '#16a34a',
  };
}
