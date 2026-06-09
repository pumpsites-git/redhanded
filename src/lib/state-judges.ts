import ilProfilesRaw from '../../data/state-courts/illinois/judge-profiles.json';
import flBayProfilesRaw from '../../data/state-courts/florida/bay-judge-profiles.json';
import flIndianRiverProfilesRaw from '../../data/state-courts/florida/indian-river-judge-profiles.json';
import flStJohnsProfilesRaw from '../../data/state-courts/florida/st-johns-judge-profiles.json';

// Registry of all state court data files
// Add new states here as they become available
const STATE_REGISTRY: { code: string; name: string; county: string; data: unknown }[] = [
  { code: 'IL', name: 'Illinois', county: 'Cook County', data: ilProfilesRaw },
  { code: 'FL', name: 'Florida', county: 'Bay County', data: flBayProfilesRaw },
  { code: 'FL', name: 'Florida', county: 'Indian River County', data: flIndianRiverProfilesRaw },
  { code: 'FL', name: 'Florida', county: 'St. Johns County', data: flStJohnsProfilesRaw },
];

export interface ViolentCaseStats {
  total: number;
  prisonRate: number;
  probationRate: number;
  jailRate: number;
  prisonCount: number;
  probationCount: number;
}

export interface OffenseStats {
  total: number;
  prison: number;
  probation: number;
  jail: number;
  prisonRate: number;
  probationRate: number;
}

export interface DemographicStats {
  total: number;
  prison: number;
  probation: number;
  prisonRate: number;
  probationRate: number;
}

export interface StateJudge {
  name: string;
  slug: string;
  state: string;
  stateCode: string;
  county: string;
  totalCases: number;
  prisonRate: number;
  jailRate: number;
  probationRate: number;
  otherRate: number;
  prisonCount: number;
  jailCount: number;
  probationCount: number;
  otherCount: number;
  avgCommitmentDays: number | null;
  courtFacility: string;
  leniencyScore: number;
  violentCases: ViolentCaseStats;
  sentenceTypes: Record<string, number>;
  offenseBreakdown: Record<string, OffenseStats>;
  raceBreakdown: Record<string, DemographicStats>;
  genderBreakdown: Record<string, DemographicStats>;
}

export interface CourtAverage {
  prisonRate: number;
  jailRate: number;
  probationRate: number;
  otherRate: number;
  violentCases: ViolentCaseStats;
  avgCommitmentDays: number | null;
}

export interface JudgeProfilesData {
  generated: string;
  source: string;
  totalJudges: number;
  totalCases: number;
  courtAverage: CourtAverage;
  summary: {
    judgesLowViolentPrisonRate: number;
    minViolentPrisonRate: number;
    maxViolentPrisonRate: number;
    avgLeniencyScore: number;
  };
  judges: Record<string, StateJudge>;
}

// Build unified judge list from all states
const allStateProfiles: JudgeProfilesData[] = STATE_REGISTRY.map(s => s.data as JudgeProfilesData);

const allJudgesCache: StateJudge[] = STATE_REGISTRY.flatMap(({ code, name, county, data }) => {
  const profiles = data as JudgeProfilesData;
  return Object.values(profiles.judges).map(j => ({
    ...j,
    state: name,
    stateCode: code,
    county,
  }));
});

const allStatesCache: string[] = [...new Set(STATE_REGISTRY.map(s => s.code))].sort();

export function getAllStateJudges(): StateJudge[] {
  return allJudgesCache;
}

export function getAvailableStates(): { code: string; name: string; county: string }[] {
  // Deduplicate by state code, listing all counties
  const seen = new Map<string, { code: string; name: string; counties: string[] }>();
  for (const { code, name, county } of STATE_REGISTRY) {
    if (seen.has(code)) {
      seen.get(code)!.counties.push(county);
    } else {
      seen.set(code, { code, name, counties: [county] });
    }
  }
  return [...seen.values()].map(({ code, name, counties }) => ({
    code,
    name,
    county: counties.length <= 2 ? counties.join(' & ') : `${counties.length} counties`,
  }));
}

export function getStateJudgeBySlug(slug: string): StateJudge | null {
  return allJudgesCache.find(j => j.slug === slug) ?? null;
}

export function getJudgeProfilesMeta(): Omit<JudgeProfilesData, 'judges'> {
  // Aggregate meta across all states
  const totalJudges = allStateProfiles.reduce((sum, p) => sum + p.totalJudges, 0);
  const totalCases = allStateProfiles.reduce((sum, p) => sum + p.totalCases, 0);
  // Use first state's court average for now; will need weighted average when multi-state
  const first = allStateProfiles[0];
  return {
    generated: first.generated,
    source: STATE_REGISTRY.length === 1 ? first.source : `${STATE_REGISTRY.length} state court systems`,
    totalJudges,
    totalCases,
    courtAverage: first.courtAverage,
    summary: first.summary,
  };
}

export function getCourtAverage(): CourtAverage {
  return allStateProfiles[0].courtAverage;
}

export function getLeniencyLabel(score: number): string {
  if (score >= 85) return 'Extremely Lenient';
  if (score >= 70) return 'Very Lenient';
  if (score >= 55) return 'Lenient';
  if (score >= 45) return 'Average';
  if (score >= 30) return 'Strict';
  if (score >= 15) return 'Very Strict';
  return 'Extremely Strict';
}

export function getLeniencyColor(score: number): string {
  if (score >= 85) return '#dc2626'; // bright red
  if (score >= 70) return '#f97316'; // orange-red
  if (score >= 55) return '#f59e0b'; // amber
  if (score >= 45) return '#eab308'; // yellow
  if (score >= 30) return '#84cc16'; // lime
  if (score >= 15) return '#22c55e'; // green
  return '#16a34a'; // dark green
}

export function pct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}
