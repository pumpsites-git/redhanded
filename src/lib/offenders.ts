import analytics from '../../data/ussc/offender-analytics-fy25.json';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface OffenderAnalytics {
  meta: {
    source: string;
    note: string;
    totalCases: number;
    fiscalYear: string;
  };
  totalCases: number;
  summary: {
    avgAge: number;
    avgSentenceMonths: number;
    genderBreakdown: Record<string, number>;
    genderCounts: Record<string, number>;
    raceBreakdown: Record<string, number>;
    raceCounts: Record<string, number>;
    educationBreakdown: Record<string, number>;
    citizenshipBreakdown: Record<string, number>;
  };
  criminalHistoryAnalysis: {
    categoryDistribution: Record<string, number>;
    avgSentenceByCategory: Record<string, number>;
    avgAgeByCategory: Record<string, number>;
    offenseTypeByCategory: Record<string, Record<string, number>>;
    belowGuidelinesByCategory: Record<string, number>;
  };
  worstOffenders: {
    highestCriminalHistory: CaseRecord[];
    longestSentences: CaseRecord[];
    categoryVI: {
      count: number;
      avgSentence: number;
      topOffenseTypes: Record<string, number>;
      byDistrict: Record<string, number>;
    };
  };
  sentencingPatterns: {
    belowGuidelines: {
      byCriminalHistory: Record<string, number>;
      byOffenseType: Record<string, number>;
      byRace: Record<string, number>;
      byGender: Record<string, number>;
    };
    avgSentenceByOffenseType: Record<string, number>;
    offenseSummary: Record<string, OffenseSummaryItem>;
    firearmEnhancement: {
      count: number;
      avgSentenceWith: number;
      avgSentenceWithout: number;
      pctOfCases: number;
    };
  };
  disparityAnalysis: {
    sentenceByRace: Record<string, number>;
    sentenceByGender: Record<string, number>;
    sentenceByEducation: Record<string, number>;
    belowGuidelinesByRace: Record<string, number>;
    belowGuidelinesByGender: Record<string, number>;
    casesbyRace: Record<string, number>;
    casesByGender: Record<string, number>;
  };
}

export interface CaseRecord {
  id: string;
  district: string;
  criminalHistoryCategory: number | null;
  totalCriminalHistoryPoints: number;
  sentenceMonths: number;
  offenseGuideline: string;
  age: number | null;
  race: string;
  gender: string;
  firesarmEnhancement: boolean;
}

export interface OffenseSummaryItem {
  count: number;
  avgSentence: number;
  belowGuidelinesPct: number;
  pctOfTotal: number;
}

// ─── Data Access ───────────────────────────────────────────────────────────

export function getAnalytics(): OffenderAnalytics {
  return analytics as OffenderAnalytics;
}

export function getSummary() {
  return analytics.summary;
}

export function getCriminalHistoryAnalysis() {
  return analytics.criminalHistoryAnalysis;
}

export function getWorstOffenders() {
  return analytics.worstOffenders;
}

export function getSentencingPatterns() {
  return analytics.sentencingPatterns;
}

export function getDisparityAnalysis() {
  return analytics.disparityAnalysis;
}

export function getCategoryVI() {
  return analytics.worstOffenders.categoryVI;
}

export function getOffenseSummary(): Record<string, OffenseSummaryItem> {
  return analytics.sentencingPatterns.offenseSummary as Record<string, OffenseSummaryItem>;
}

// ─── Formatting Helpers ────────────────────────────────────────────────────

/** Convert months to human-readable duration, e.g. "4 years, 3 months" */
export function formatSentenceMonths(months: number): string {
  if (months === 0) return 'Time served / probation';
  const years = Math.floor(months / 12);
  const remaining = Math.round(months % 12);
  if (years === 0) return `${remaining} month${remaining !== 1 ? 's' : ''}`;
  if (remaining === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years} yr${years !== 1 ? 's' : ''}, ${remaining} mo`;
}

/** Format a percentage with one decimal place */
export function pct(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Format a number with commas */
export function fmtNum(n: number): string {
  return n.toLocaleString('en-US');
}

// ─── Category Labels & Colors ──────────────────────────────────────────────

export const CATEGORY_LABELS: Record<string, string> = {
  '1': 'Category I',
  '2': 'Category II',
  '3': 'Category III',
  '4': 'Category IV',
  '5': 'Category V',
  '6': 'Category VI',
};

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  '1': 'First-time or minimal prior record',
  '2': '1–2 minor prior convictions',
  '3': 'Moderate prior criminal record',
  '4': 'Significant prior criminal record',
  '5': 'Extensive prior criminal record',
  '6': 'Career criminal — most serious history',
};

export const CATEGORY_COLORS: Record<string, string> = {
  '1': '#16a34a',   // green
  '2': '#65a30d',   // lime
  '3': '#ca8a04',   // amber
  '4': '#ea580c',   // orange
  '5': '#dc2626',   // red
  '6': '#7f1d1d',   // deep red / crimson
};

export const CATEGORY_BG: Record<string, string> = {
  '1': 'rgba(22, 163, 74, 0.1)',
  '2': 'rgba(101, 163, 13, 0.1)',
  '3': 'rgba(202, 138, 4, 0.12)',
  '4': 'rgba(234, 88, 12, 0.12)',
  '5': 'rgba(220, 38, 38, 0.12)',
  '6': 'rgba(127, 29, 29, 0.2)',
};

export const CATEGORY_BORDER: Record<string, string> = {
  '1': 'rgba(22, 163, 74, 0.3)',
  '2': 'rgba(101, 163, 13, 0.3)',
  '3': 'rgba(202, 138, 4, 0.35)',
  '4': 'rgba(234, 88, 12, 0.35)',
  '5': 'rgba(220, 38, 38, 0.35)',
  '6': 'rgba(220, 38, 38, 0.6)',
};

// ─── Offense Type Labels & Icons ───────────────────────────────────────────

export const OFFENSE_ICONS: Record<string, string> = {
  'Immigration': '🛃',
  'Immigration (Other)': '🛃',
  'Drug Trafficking': '💊',
  'Sex Offense': '⚠️',
  'Child Exploitation': '🚨',
  'Fraud/Theft': '💳',
  'Extortion/Racketeering': '🔒',
  'Weapons/Firearms': '🔫',
  'Money Laundering': '💰',
  'Murder/Manslaughter': '⚰️',
  'Assault/Homicide': '⚠️',
  'Terrorism/Nat. Security': '💥',
  'Obstruction/Perjury': '📋',
  'Tax Offense': '📊',
  'Bribery/Corruption': '🤝',
  'Civil Rights': '⚖️',
  'Civil Rights/Other': '⚖️',
  'Violent Crime': '⚠️',
  'Assault': '⚠️',
};

export const OFFENSE_COLORS: Record<string, string> = {
  'Immigration': '#6366f1',
  'Immigration (Other)': '#818cf8',
  'Drug Trafficking': '#f59e0b',
  'Sex Offense': '#ef4444',
  'Child Exploitation': '#7f1d1d',
  'Fraud/Theft': '#3b82f6',
  'Extortion/Racketeering': '#8b5cf6',
  'Weapons/Firearms': '#f97316',
  'Money Laundering': '#10b981',
  'Murder/Manslaughter': '#dc2626',
  'Assault/Homicide': '#dc2626',
  'Terrorism/Nat. Security': '#dc2626',
  'Obstruction/Perjury': '#64748b',
  'Tax Offense': '#94a3b8',
  'Bribery/Corruption': '#a78bfa',
  'Civil Rights': '#2dd4bf',
  'Civil Rights/Other': '#2dd4bf',
  'Violent Crime': '#ef4444',
  'Assault': '#ef4444',
};

export function getOffenseIcon(name: string): string {
  return OFFENSE_ICONS[name] ?? '📁';
}

export function getOffenseColor(name: string): string {
  return OFFENSE_COLORS[name] ?? '#6b7280';
}

// ─── Race / Gender / Education Labels ─────────────────────────────────────

export const RACE_LABELS: Record<string, string> = {
  'White': 'White (Non-Hispanic)',
  'Black': 'Black (Non-Hispanic)',
  'Hispanic': 'Hispanic',
  'Other': 'Other / Multiracial',
};

export const RACE_COLORS: Record<string, string> = {
  'White': '#6366f1',
  'Black': '#f59e0b',
  'Hispanic': '#10b981',
  'Other': '#64748b',
};

export const GENDER_COLORS: Record<string, string> = {
  'Male': '#3b82f6',
  'Female': '#ec4899',
};

export const EDUCATION_ORDER = [
  'Less than HS',
  'Some High School',
  'HS Diploma/GED',
  'Some College',
  "Associate's Degree",
  "Bachelor's Degree",
  'Graduate Degree',
];

// ─── Insight Helpers ───────────────────────────────────────────────────────

/** Returns sorted criminal history categories (1–6) with full stats */
export function getCategoryStats() {
  const cha = analytics.criminalHistoryAnalysis;
  return [1, 2, 3, 4, 5, 6].map((cat) => {
    const key = String(cat);
    const dist = cha.categoryDistribution as Record<string, number>;
    const sentByCat = cha.avgSentenceByCategory as Record<string, number>;
    const ageByCat = cha.avgAgeByCategory as Record<string, number>;
    const belowByCat = cha.belowGuidelinesByCategory as Record<string, number>;
    const ogByCat = cha.offenseTypeByCategory as Record<string, Record<string, number>>;
    const count = dist[key] ?? 0;
    const total = analytics.totalCases;
    return {
      category: cat,
      label: CATEGORY_LABELS[key],
      description: CATEGORY_DESCRIPTIONS[key],
      count,
      pctOfTotal: total > 0 ? (count / total) * 100 : 0,
      avgSentence: sentByCat[key] ?? 0,
      avgAge: ageByCat[key] ?? 0,
      belowGuidelinesPct: belowByCat[key] ?? 0,
      topOffenses: Object.entries(ogByCat[key] ?? {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      color: CATEGORY_COLORS[key],
      bg: CATEGORY_BG[key],
      border: CATEGORY_BORDER[key],
    };
  });
}

/** Returns offense summary sorted by case count */
export function getTopOffenses(limit = 10): Array<{ name: string } & OffenseSummaryItem> {
  return Object.entries(getOffenseSummary())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([name, stats]) => ({ name, ...stats }));
}
