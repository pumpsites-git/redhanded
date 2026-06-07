/**
 * RedHanded — Build State Aggregate Data
 * Aggregates district-level USSC data up to state level.
 * Writes data/ussc/state-stats-fy25.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '../data/ussc');

// ─── Load source files ─────────────────────────────────────────────────────────

const districtCodeMap = JSON.parse(readFileSync(join(DATA_DIR, 'district-code-map.json'), 'utf8'));
const districtOffenseStats = JSON.parse(readFileSync(join(DATA_DIR, 'district-offense-stats-fy25.json'), 'utf8'));
const districtRecidivism = JSON.parse(readFileSync(join(DATA_DIR, 'district-recidivism-fy25.json'), 'utf8'));
const criminalHistorySeverity = JSON.parse(readFileSync(join(DATA_DIR, 'criminal-history-severity-fy25.json'), 'utf8'));

// ─── State name mapping ────────────────────────────────────────────────────────

const STATE_NAMES = {
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

// ─── Aggregate ────────────────────────────────────────────────────────────────

function mergeRecord(target, source) {
  for (const [k, v] of Object.entries(source)) {
    target[k] = (target[k] ?? 0) + v;
  }
}

const stateAccumulators = {};

for (const [code, info] of Object.entries(districtCodeMap)) {
  const state = info.state;
  const off = districtOffenseStats[code];
  const rec = districtRecidivism[code];
  const crim = criminalHistorySeverity[code];

  if (!off) continue; // skip districts with no data

  if (!stateAccumulators[state]) {
    stateAccumulators[state] = {
      stateCode: state,
      stateName: STATE_NAMES[state] ?? state,
      districts: [],
      totalCases: 0,
      // weighted accumulators (multiply by cases, divide at end)
      _sentenceWeightedSum: 0,
      _belowGuideWeightedSum: 0,
      _recidivismWeightedSum: 0,
      _highCrimhistWeightedSum: 0,
      _catViWeightedSum: 0,
      _avgCrimhistPtsWeightedSum: 0,
      _avgAgeWeightedSum: 0,
      _firearmEnhWeightedSum: 0,
      // summed distributions
      offenseTypes: {},
      crimhistDistribution: {},
      raceDistribution: {},
      genderDistribution: {},
      drugTypes: {},
      // raw counts
      totalRepeatOffenders: 0,
      totalHighCrimhist: 0,
      totalCatVi: 0,
      totalBelowGuidelines: 0,
      totalWithinGuidelines: 0,
      totalAboveGuidelines: 0,
      totalFirearmEnhancements: 0,
    };
  }

  const acc = stateAccumulators[state];
  const cases = off.total_cases ?? 0;

  acc.districts.push({
    code,
    name: info.name,
    courtListenerId: info.court_listener_id,
    circuit: info.circuit,
    totalCases: cases,
  });

  acc.totalCases += cases;

  // Weighted sums
  acc._sentenceWeightedSum += (off.avg_sentence_months ?? 0) * cases;
  acc._belowGuideWeightedSum += (off.below_guidelines_rate ?? 0) * cases;
  acc._avgAgeWeightedSum += (off.avg_age ?? 0) * cases;
  acc._firearmEnhWeightedSum += (off.firearm_enhancement_rate ?? 0) * cases;

  // Raw counts
  acc.totalBelowGuidelines += off.below_guidelines_count ?? 0;
  acc.totalWithinGuidelines += off.within_guidelines_count ?? 0;
  acc.totalAboveGuidelines += off.above_guidelines_count ?? 0;
  acc.totalFirearmEnhancements += off.firearm_enhancement_count ?? 0;

  // Recidivism
  if (rec) {
    acc._recidivismWeightedSum += (rec.repeat_rate_pct ?? 0) * cases;
    acc.totalRepeatOffenders += rec.repeat_offenders ?? 0;
  }

  // Criminal history
  if (crim) {
    acc._highCrimhistWeightedSum += (crim.high_criminal_history_rate ?? 0) * cases;
    acc._catViWeightedSum += (crim.category_vi_rate ?? 0) * cases;
    acc._avgCrimhistPtsWeightedSum += (crim.avg_criminal_history_points ?? 0) * cases;
    acc.totalHighCrimhist += crim.high_criminal_history_count ?? 0;
    acc.totalCatVi += crim.category_vi_count ?? 0;
    mergeRecord(acc.crimhistDistribution, crim.crimhist_category_distribution ?? {});
  }

  // Distributions
  mergeRecord(acc.offenseTypes, off.offense_types ?? {});
  mergeRecord(acc.raceDistribution, off.race_distribution ?? {});
  mergeRecord(acc.genderDistribution, off.gender_distribution ?? {});
  mergeRecord(acc.drugTypes, off.drug_types ?? {});
}

// ─── Finalize state records ────────────────────────────────────────────────────

const stateStats = {};

for (const [state, acc] of Object.entries(stateAccumulators)) {
  const n = acc.totalCases || 1;

  stateStats[state] = {
    stateCode: acc.stateCode,
    stateName: acc.stateName,
    districtCount: acc.districts.length,
    districts: acc.districts,

    totalCases: acc.totalCases,
    avgSentenceMonths: +(acc._sentenceWeightedSum / n).toFixed(2),
    belowGuidelinesRate: +(acc._belowGuideWeightedSum / n).toFixed(4),
    recidivismRate: +(acc._recidivismWeightedSum / n).toFixed(2),
    highCriminalHistoryRate: +(acc._highCrimhistWeightedSum / n).toFixed(4),
    categoryViRate: +(acc._catViWeightedSum / n).toFixed(4),
    avgCriminalHistoryPoints: +(acc._avgCrimhistPtsWeightedSum / n).toFixed(2),
    avgAge: +(acc._avgAgeWeightedSum / n).toFixed(1),
    firearmEnhancementRate: +(acc._firearmEnhWeightedSum / n).toFixed(4),

    totalRepeatOffenders: acc.totalRepeatOffenders,
    totalHighCrimhist: acc.totalHighCrimhist,
    totalCatVi: acc.totalCatVi,
    totalBelowGuidelines: acc.totalBelowGuidelines,
    totalWithinGuidelines: acc.totalWithinGuidelines,
    totalAboveGuidelines: acc.totalAboveGuidelines,
    totalFirearmEnhancements: acc.totalFirearmEnhancements,

    offenseTypes: acc.offenseTypes,
    crimhistDistribution: acc.crimhistDistribution,
    raceDistribution: acc.raceDistribution,
    genderDistribution: acc.genderDistribution,
    drugTypes: acc.drugTypes,
  };
}

// ─── Compute national averages ─────────────────────────────────────────────────

const allStates = Object.values(stateStats);
const totalNationalCases = allStates.reduce((s, st) => s + st.totalCases, 0);

function weightedAvg(field) {
  return allStates.reduce((s, st) => s + st[field] * st.totalCases, 0) / (totalNationalCases || 1);
}

const nationalAverages = {
  totalCases: totalNationalCases,
  avgSentenceMonths: +weightedAvg('avgSentenceMonths').toFixed(2),
  belowGuidelinesRate: +weightedAvg('belowGuidelinesRate').toFixed(4),
  recidivismRate: +weightedAvg('recidivismRate').toFixed(2),
  highCriminalHistoryRate: +weightedAvg('highCriminalHistoryRate').toFixed(4),
  categoryViRate: +weightedAvg('categoryViRate').toFixed(4),
  avgCriminalHistoryPoints: +weightedAvg('avgCriminalHistoryPoints').toFixed(2),
  avgAge: +weightedAvg('avgAge').toFixed(1),
  stateCount: allStates.length,
};

// ─── Write output ──────────────────────────────────────────────────────────────

const output = {
  generatedAt: new Date().toISOString(),
  nationalAverages,
  states: stateStats,
};

const outPath = join(DATA_DIR, 'state-stats-fy25.json');
writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

console.log(`✅ Written: ${outPath}`);
console.log(`   States: ${Object.keys(stateStats).length}`);
console.log(`   National cases: ${totalNationalCases.toLocaleString()}`);
console.log(`   National avg sentence: ${nationalAverages.avgSentenceMonths} months`);
console.log(`   National below-guidelines: ${(nationalAverages.belowGuidelinesRate * 100).toFixed(1)}%`);
console.log(`   National recidivism: ${nationalAverages.recidivismRate.toFixed(1)}%`);
