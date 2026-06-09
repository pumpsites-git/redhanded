// State Deep Dive data library
// Uses REAL state court data — fundamentally different from federal USSC data on other pages

import ilRaw from '../../data/state-courts/illinois/cook-county-summary.json';
import nyRaw from '../../data/state-courts/new-york/ny-summary.json';
import flRaw from '../../data/state-courts/florida/county-profiles.json';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ILData {
  dispositions: {
    total_records: number;
    offense_categories: Record<string, number>;
    charge_dispositions: Record<string, number>;
    plea_breakdown: { guilty_plea: number; nolle: number; not_guilty: number; conviction: number; other: number };
    charge_classes: Record<string, number>;
    race_breakdown: Record<string, number>;
    gender_breakdown: Record<string, number>;
  };
  sentencing: {
    total_records: number;
    sentence_types: Record<string, number>;
    commitment_types: Record<string, number>;
    prison_term_years: { count: number; min: number; max: number; median: number; mean: number };
    offense_categories: Record<string, number>;
    case_length_days: { count: number; min: number; max: number; median: number; mean: number };
  };
  intake: {
    total_records: number;
    participant_statuses: Record<string, number>;
    felony_review_results: Record<string, number>;
    offense_categories: Record<string, number>;
  };
  generated_at: string;
  date_range: string;
  source: string;
}

export interface NYData {
  source: string;
  data_sources: string[];
  primary_year: number;
  pretrial_data_2024: {
    total_arraignments: number;
    release_decisions: {
      ROR_released_own_recognizance: number;
      NMR_non_monetary_release: number;
      bail_set: number;
      remanded: number;
      disposed_at_arraignment: number;
      unknown: number;
    };
    release_rates: { ror_pct: number; nmr_pct: number; bail_set_pct: number; remanded_pct: number; total_released_pct: number };
    bail_statistics: { cases_with_bail_amount: number; median_bail_amount: number; mean_bail_amount: number; min_bail_amount: number; max_bail_amount: number };
    offense_breakdown: {
      by_class: Record<string, number>;
      violent_felony_offense: { 'Not VFO': number; VFO: number; 'Underlying VFO Charge': number; 'VFO-like class A-1 offenses': number };
      vfo_count: number;
      non_vfo_count: number;
    };
    dispositions: Record<string, number>;
    sentences: Record<string, number>;
    demographics: { by_sex: Record<string, number>; by_race: Record<string, number> };
    regions: Record<string, number>;
    rearrest_indicators: { rearr_vfo: number; rearr_nonvfo: number; rearr_misd: number; rearr_fire: number };
    top_counties_by_cases: Record<string, number>;
  };
  jail_population_2024: {
    total_facilities: number;
    total_census: number;
    total_sentenced: number;
    total_unsentenced: number;
    technical_parole_violators: number;
    state_readies: number;
  };
  adult_arrests_2024: {
    total_arrests: number;
    felony_total: number;
    misdemeanor_total: number;
    violent_felony: number;
    drug_felony: number;
    dwi_felony: number;
    other_felony: number;
  };
  crime_index_2024: {
    total_index_crimes: number;
    violent_crimes: number;
    property_crimes: number;
    murder: number;
    forcible_rape: number;
    robbery: number;
    aggravated_assault: number;
    burglary: number;
    larceny: number;
    motor_vehicle_theft: number;
  };
  recidivism_data: {
    note: string;
    data: Record<string, { total: number; returned: number; not_returned: number; return_rate_pct: number }>;
  };
}

// ─── FL Types ─────────────────────────────────────────────────────────────────

export interface FLCounty {
  name: string;
  slug: string;
  judicialCircuit: string;
  totalCases: number;
  felonyCases: number;
  misdemeanorCases: number;
  felonyRatio: number;
  prisonRate: number;
  jailRate: number;
  probationRate: number;
  commCtrlRate: number;
  noConfinementRate: number;
  withheldAdjudicationRate: number;
  avgFelonySentenceDays: number | null;
  avgMisdSentenceDays: number | null;
  violentCases: {
    total: number;
    rate: number;
    prisonRate: number;
    jailRate: number;
    otherRate: number;
  };
  raceBreakdown: Record<string, number>;
  leniencyScore: number;
  leniencyRank: number;
}

export interface FLData {
  generated: string;
  source: string;
  totalCounties: number;
  totalCases: number;
  stateAverage: {
    prisonRate: number;
    jailRate: number;
    probationRate: number;
    commCtrlRate: number;
    withheldAdjudicationRate: number;
    avgFelonySentenceDays: number;
    violentCaseRate: number;
  };
  counties: Record<string, FLCounty>;
}

// ─── Data exports ─────────────────────────────────────────────────────────────

export const IL_DATA: ILData = ilRaw as ILData;
export const NY_DATA: NYData = nyRaw as NYData;
export const FL_DATA: FLData = flRaw as FLData;

// ─── Available states registry ────────────────────────────────────────────────

export const AVAILABLE_STATES: Record<string, { name: string; subtitle: string; available: boolean }> = {
  il: { name: 'Illinois', subtitle: 'Cook County State Court Analysis', available: true },
  ny: { name: 'New York', subtitle: 'Statewide Court & Bail Analysis', available: true },
  ca: { name: 'California', subtitle: 'Data collection in progress', available: false },
  tx: { name: 'Texas', subtitle: 'Data collection in progress', available: false },
  fl: { name: 'Florida', subtitle: '67-County Sentencing Analysis', available: true },
};

export function isStateAvailable(state: string): boolean {
  return AVAILABLE_STATES[state.toLowerCase()]?.available ?? false;
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function fmt(n: number): string {
  return n.toLocaleString();
}

export function pct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

export function dollars(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

/** Compute percentage of total */
export function share(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0;
}

/** Top N entries from a Record<string, number>, sorted descending */
export function topN(obj: Record<string, number>, n: number): Array<[string, number]> {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
}

// ─── FL computed stats ────────────────────────────────────────────────────────

export function getFLStats() {
  const d = FL_DATA;
  const counties = Object.values(d.counties);

  const sorted = [...counties].sort((a, b) => b.leniencyScore - a.leniencyScore);
  const sortedByPrison = [...counties].sort((a, b) => a.prisonRate - b.prisonRate);
  const mostLenient = sorted.slice(0, 5);
  const toughest = [...counties].sort((a, b) => a.leniencyScore - b.leniencyScore).slice(0, 5);

  return {
    totalCases: d.totalCases,
    totalCounties: d.totalCounties,
    stateAvgPrisonRate: d.stateAverage.prisonRate,
    stateAvgJailRate: d.stateAverage.jailRate,
    stateAvgProbationRate: d.stateAverage.probationRate,
    avgFelonySentenceDays: d.stateAverage.avgFelonySentenceDays,
    violentCaseRate: d.stateAverage.violentCaseRate,
    counties,
    sorted,
    mostLenient,
    toughest,
    palmBeach: d.counties['palm-beach'],
    broward: d.counties['broward'],
    miamiDade: d.counties['miami-dade'],
    gadsden: d.counties['gadsden'],
  };
}

// ─── IL computed stats ────────────────────────────────────────────────────────

export function getILStats() {
  const d = IL_DATA;
  const totalDisp = d.dispositions.total_records;
  const pb = d.dispositions.plea_breakdown;
  const nolleTotal = pb.nolle;
  const guiltyPleas = pb.guilty_plea;
  const convictions = pb.conviction;
  const notGuilty = pb.not_guilty;

  const nollePct = share(nolleTotal, totalDisp);
  const guiltyPct = share(guiltyPleas + convictions, totalDisp);

  const totalSentenced = d.sentencing.total_records;
  const prison = d.sentencing.sentence_types['Prison'] ?? 0;
  const probation = (d.sentencing.sentence_types['Probation'] ?? 0) + (d.sentencing.sentence_types['2nd Chance Probation'] ?? 0);
  const jail = d.sentencing.sentence_types['Jail'] ?? 0;

  const approved = d.intake.felony_review_results['Approved'] ?? 0;
  const rejected = d.intake.felony_review_results['Rejected'] ?? 0;

  return {
    totalCases: totalDisp,
    nolleTotal,
    nollePct,
    guiltyPleas: guiltyPleas + convictions,
    guiltyPct,
    notGuilty,
    totalSentenced,
    prison,
    probation,
    jail,
    probationPct: share(probation, prison + probation + jail),
    prisonPct: share(prison, prison + probation + jail),
    jailPct: share(jail, prison + probation + jail),
    medianPrisonYears: d.sentencing.prison_term_years.median,
    meanPrisonYears: d.sentencing.prison_term_years.mean,
    intakeTotal: d.intake.total_records,
    intakeApproved: approved,
    intakeRejected: rejected,
    topOffenses: topN(d.dispositions.offense_categories, 10),
    topSentencedOffenses: topN(d.sentencing.offense_categories, 10),
    topIntakeOffenses: topN(d.intake.offense_categories, 10),
  };
}

// ─── NY computed stats ────────────────────────────────────────────────────────

export function getNYStats() {
  const d = NY_DATA;
  const p = d.pretrial_data_2024;
  const jail = d.jail_population_2024;
  const arrests = d.adult_arrests_2024;
  const crime = d.crime_index_2024;

  const totalReleased = p.release_decisions.ROR_released_own_recognizance + p.release_decisions.NMR_non_monetary_release;
  const vfoCount = p.offense_breakdown.vfo_count;

  // Estimate VFO release rate: use the overall release rate as a proxy
  // (pretrial data doesn't break out VFO by release decision directly)
  const vfoRemandedEst = Math.round(vfoCount * (p.release_rates.remanded_pct / 100));
  const vfoReleasedEst = vfoCount - vfoRemandedEst;

  const recid = d.recidivism_data.data;

  return {
    totalArraignments: p.total_arraignments,
    rorCount: p.release_decisions.ROR_released_own_recognizance,
    rorPct: p.release_rates.ror_pct,
    nmrCount: p.release_decisions.NMR_non_monetary_release,
    nmrPct: p.release_rates.nmr_pct,
    bailSetCount: p.release_decisions.bail_set,
    bailSetPct: p.release_rates.bail_set_pct,
    remandedCount: p.release_decisions.remanded,
    remandedPct: p.release_rates.remanded_pct,
    totalReleasedPct: p.release_rates.total_released_pct,
    disposedAtArraignment: p.release_decisions.disposed_at_arraignment,
    medianBail: p.bail_statistics.median_bail_amount,
    meanBail: p.bail_statistics.mean_bail_amount,
    maxBail: p.bail_statistics.max_bail_amount,
    vfoCount,
    vfoReleasedEst,
    vfoRemandedEst,
    reArrestVFO: p.rearrest_indicators.rearr_vfo,
    reArrestNonVFO: p.rearrest_indicators.rearr_nonvfo,
    reArrestMisd: p.rearrest_indicators.rearr_misd,
    reArrestFirearms: p.rearrest_indicators.rearr_fire,
    totalIndexCrimes: crime.total_index_crimes,
    violentCrimes: crime.violent_crimes,
    murder: crime.murder,
    robbery: crime.robbery,
    aggAssault: crime.aggravated_assault,
    totalArrests: arrests.total_arrests,
    felonyArrests: arrests.felony_total,
    misdArrests: arrests.misdemeanor_total,
    violentFelonyArrests: arrests.violent_felony,
    jailCensus: jail.total_census,
    jailSentenced: jail.total_sentenced,
    jailUnsentenced: jail.total_unsentenced,
    jailUnsentencedPct: share(jail.total_unsentenced, jail.total_census),
    recidivism2019: recid['2019'].return_rate_pct,
    recidivism2020: recid['2020'].return_rate_pct,
    recidivism2021: recid['2021'].return_rate_pct,
    recidivismNote: d.recidivism_data.note,
  };
}
