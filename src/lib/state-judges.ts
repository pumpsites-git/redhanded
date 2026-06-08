import judgeProfilesRaw from '../../data/state-courts/illinois/judge-profiles.json';

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

// Cast the JSON import
const judgeProfiles = judgeProfilesRaw as JudgeProfilesData;

export function getAllStateJudges(): StateJudge[] {
  return Object.values(judgeProfiles.judges);
}

export function getStateJudgeBySlug(slug: string): StateJudge | null {
  return judgeProfiles.judges[slug] ?? null;
}

export function getJudgeProfilesMeta(): Omit<JudgeProfilesData, 'judges'> {
  const { judges: _judges, ...meta } = judgeProfiles;
  return meta;
}

export function getCourtAverage(): CourtAverage {
  return judgeProfiles.courtAverage;
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
