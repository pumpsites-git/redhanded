import districtCodeMap from '../../data/ussc/district-code-map.json';
import districtOffenseStats from '../../data/ussc/district-offense-stats-fy25.json';
import districtRecidivism from '../../data/ussc/district-recidivism-fy25.json';
import criminalHistorySeverity from '../../data/ussc/criminal-history-severity-fy25.json';

// ─── Raw JSON types ────────────────────────────────────────────────────────────

interface RawDistrictInfo {
  name: string;
  court_listener_id: string;
  state: string;
  circuit: number;
  ussc_code: number;
}

interface RawOffenseStats {
  total_cases: number;
  offense_types: Record<string, number>;
  avg_sentence_months: number;
  avg_guideline_min_months: number;
  below_guidelines_rate: number;
  within_guidelines_rate: number;
  above_guidelines_rate: number;
  below_guidelines_count: number;
  within_guidelines_count: number;
  above_guidelines_count: number;
  crimhist_distribution: Record<string, number>;
  avg_criminal_history_points: number;
  race_distribution: Record<string, number>;
  gender_distribution: Record<string, number>;
  firearm_enhancement_count: number;
  firearm_enhancement_rate: number;
  drug_types: Record<string, number>;
  avg_age: number;
}

interface RawRecidivism {
  total_cases: number;
  repeat_offenders: number;
  repeat_rate_pct: number;
  criminal_history_categories: Record<string, number>;
}

interface RawCriminalHistory {
  total_cases: number;
  crimhist_category_distribution: Record<string, number>;
  high_criminal_history_count: number;
  high_criminal_history_rate: number;
  category_vi_count: number;
  category_vi_rate: number;
  avg_criminal_history_points: number;
  pct_first_offenders_cat_i: number;
}

// ─── Public types ──────────────────────────────────────────────────────────────

export interface District {
  code: string;
  name: string;
  courtListenerId: string;
  state: string;
  circuit: number;
  totalCases: number;
  avgSentenceMonths: number;
  avgGuidelineMinMonths: number;
  belowGuidelinesRate: number;
  withinGuidelinesRate: number;
  aboveGuidelinesRate: number;
  recidivismRate: number;
  highCriminalHistoryRate: number;
  categoryViRate: number;
  avgCriminalHistoryPoints: number;
  pctFirstOffenders: number;
  offenseTypes: Record<string, number>;
  crimhistDistribution: Record<string, number>;
  raceDistribution: Record<string, number>;
  genderDistribution: Record<string, number>;
  drugTypes: Record<string, number>;
  firearmEnhancementRate: number;
  avgAge: number;
}

export interface NationalAverages {
  totalCases: number;
  avgSentenceMonths: number;
  belowGuidelinesRate: number;
  recidivismRate: number;
  highCriminalHistoryRate: number;
  categoryViRate: number;
  avgCriminalHistoryPoints: number;
}

// ─── Build merged district list ────────────────────────────────────────────────

function buildDistricts(): District[] {
  const codeMap = districtCodeMap as Record<string, RawDistrictInfo>;
  const offenseMap = districtOffenseStats as Record<string, RawOffenseStats>;
  const recidivismMap = districtRecidivism as Record<string, RawRecidivism>;
  const crimHistMap = criminalHistorySeverity as Record<string, RawCriminalHistory>;

  return Object.entries(codeMap).map(([code, info]) => {
    const off = offenseMap[code];
    const rec = recidivismMap[code];
    const crim = crimHistMap[code];

    return {
      code,
      name: info.name,
      courtListenerId: info.court_listener_id,
      state: info.state,
      circuit: info.circuit,
      totalCases: off?.total_cases ?? 0,
      avgSentenceMonths: off?.avg_sentence_months ?? 0,
      avgGuidelineMinMonths: off?.avg_guideline_min_months ?? 0,
      belowGuidelinesRate: off?.below_guidelines_rate ?? 0,
      withinGuidelinesRate: off?.within_guidelines_rate ?? 0,
      aboveGuidelinesRate: off?.above_guidelines_rate ?? 0,
      recidivismRate: rec?.repeat_rate_pct ?? 0,
      highCriminalHistoryRate: crim?.high_criminal_history_rate ?? 0,
      categoryViRate: crim?.category_vi_rate ?? 0,
      avgCriminalHistoryPoints: crim?.avg_criminal_history_points ?? 0,
      pctFirstOffenders: crim?.pct_first_offenders_cat_i ?? 0,
      offenseTypes: off?.offense_types ?? {},
      crimhistDistribution: off?.crimhist_distribution ?? {},
      raceDistribution: off?.race_distribution ?? {},
      genderDistribution: off?.gender_distribution ?? {},
      drugTypes: off?.drug_types ?? {},
      firearmEnhancementRate: off?.firearm_enhancement_rate ?? 0,
      avgAge: off?.avg_age ?? 0,
    };
  });
}

// Singleton so we don't rebuild every call
let _districts: District[] | null = null;

export function getAllDistricts(): District[] {
  if (!_districts) {
    _districts = buildDistricts();
  }
  return _districts;
}

export function getDistrictByCode(code: string): District | undefined {
  return getAllDistricts().find(d => d.code === code);
}

export function getDistrictsByState(state: string): District[] {
  return getAllDistricts().filter(d => d.state === state);
}

export function getNationalAverages(): NationalAverages {
  const districts = getAllDistricts().filter(d => d.totalCases > 0);
  const n = districts.length;
  if (n === 0) {
    return { totalCases: 0, avgSentenceMonths: 0, belowGuidelinesRate: 0, recidivismRate: 0, highCriminalHistoryRate: 0, categoryViRate: 0, avgCriminalHistoryPoints: 0 };
  }
  const sum = (fn: (d: District) => number) => districts.reduce((acc, d) => acc + fn(d), 0);
  return {
    totalCases: sum(d => d.totalCases),
    avgSentenceMonths: sum(d => d.avgSentenceMonths) / n,
    belowGuidelinesRate: sum(d => d.belowGuidelinesRate) / n,
    recidivismRate: sum(d => d.recidivismRate) / n,
    highCriminalHistoryRate: sum(d => d.highCriminalHistoryRate) / n,
    categoryViRate: sum(d => d.categoryViRate) / n,
    avgCriminalHistoryPoints: sum(d => d.avgCriminalHistoryPoints) / n,
  };
}

export type SortMetric = 'recidivism' | 'sentence' | 'belowGuidelines' | 'caseVolume' | 'dangerous';

export function sortDistrictsByMetric(districts: District[], metric: SortMetric, asc = false): District[] {
  const getVal = (d: District): number => {
    switch (metric) {
      case 'recidivism': return d.recidivismRate;
      case 'sentence': return d.avgSentenceMonths;
      case 'belowGuidelines': return d.belowGuidelinesRate;
      case 'caseVolume': return d.totalCases;
      case 'dangerous': return d.highCriminalHistoryRate;
    }
  };
  return [...districts].sort((a, b) => asc ? getVal(a) - getVal(b) : getVal(b) - getVal(a));
}

// ─── Offense label helpers ─────────────────────────────────────────────────────

export const OFFENSE_LABELS: Record<string, string> = {
  drug_trafficking: 'Drug Trafficking',
  firearms: 'Firearms',
  fraud_theft_embezzlement: 'Fraud / Theft',
  immigration: 'Immigration',
  child_pornography: 'Child Exploitation',
  robbery: 'Robbery',
  sex_abuse: 'Sex Abuse',
  tax: 'Tax',
  stalking_harassment: 'Stalking / Harassment',
  administration_of_justice: 'Admin of Justice',
  environmental: 'Environmental',
  money_laundering: 'Money Laundering',
  murder: 'Murder',
  assault: 'Assault',
  arson: 'Arson',
  food_and_drug: 'Food & Drug',
  commercialized_vice: 'Commercialized Vice',
  national_defense: 'National Defense',
  obscenity_sex_offenses: 'Obscenity',
  other: 'Other',
  bribery_corruption: 'Bribery / Corruption',
  prison_offenses: 'Prison Offenses',
  individual_rights: 'Individual Rights',
  drug_possession: 'Drug Possession',
  antitrust: 'Antitrust',
  burglary_trespass: 'Burglary',
  extortion_racketeering: 'Extortion / Racketeering',
  forgery_counterfeiting: 'Forgery',
  kidnapping: 'Kidnapping',
  manslaughter: 'Manslaughter',
};

export const OFFENSE_COLORS: Record<string, string> = {
  drug_trafficking: '#ef4444',
  firearms: '#f97316',
  fraud_theft_embezzlement: '#eab308',
  immigration: '#3b82f6',
  child_pornography: '#8b5cf6',
  robbery: '#f43f5e',
  sex_abuse: '#ec4899',
  murder: '#dc2626',
  money_laundering: '#14b8a6',
  assault: '#fb923c',
  other: '#6b7280',
};

export function getOffenseColor(key: string): string {
  return OFFENSE_COLORS[key] ?? '#6b7280';
}

export function getTopOffenses(offenseTypes: Record<string, number>, limit = 8): Array<{ key: string; label: string; count: number; color: string }> {
  return Object.entries(offenseTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({
      key,
      label: OFFENSE_LABELS[key] ?? key,
      count,
      color: getOffenseColor(key),
    }));
}

// ─── Circuit name ──────────────────────────────────────────────────────────────

export function getCircuitName(circuit: number): string {
  const names: Record<number, string> = {
    1: '1st Circuit',
    2: '2nd Circuit',
    3: '3rd Circuit',
    4: '4th Circuit',
    5: '5th Circuit',
    6: '6th Circuit',
    7: '7th Circuit',
    8: '8th Circuit',
    9: '9th Circuit',
    10: '10th Circuit',
    11: '11th Circuit',
    12: 'D.C. Circuit',
    13: 'Federal Circuit',
  };
  return names[circuit] ?? `Circuit ${circuit}`;
}

// ─── Color coding helpers ──────────────────────────────────────────────────────

export function getRecidivismColor(rate: number): string {
  if (rate < 10) return '#16a34a';
  if (rate < 20) return '#ca8a04';
  if (rate < 30) return '#ea580c';
  return '#dc2626';
}

export function getBelowGuidelinesColor(rate: number): string {
  // Higher below-guidelines = more lenient = redder
  if (rate < 0.4) return '#16a34a';
  if (rate < 0.55) return '#ca8a04';
  if (rate < 0.7) return '#ea580c';
  return '#dc2626';
}

export function getSentenceColor(months: number, nationalAvg: number): string {
  const ratio = months / nationalAvg;
  if (ratio < 0.75) return '#16a34a';
  if (ratio < 1.1) return '#ca8a04';
  if (ratio < 1.4) return '#ea580c';
  return '#dc2626';
}

export function getDangerousColor(rate: number): string {
  if (rate < 0.2) return '#16a34a';
  if (rate < 0.3) return '#ca8a04';
  if (rate < 0.4) return '#ea580c';
  return '#dc2626';
}

export function pct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function months(value: number): string {
  return `${value.toFixed(1)} mo`;
}
