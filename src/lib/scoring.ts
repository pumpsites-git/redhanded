/**
 * RedHanded Accountability Scoring Engine
 * 
 * Core philosophy: Are judges handing out justice that actually changes people,
 * or are they letting offenders off the hook to terrorize society again?
 * 
 * The score answers: "Is this judge's approach making the public SAFER?"
 * 
 * Score: 0-100
 *   0-24  = CRITICAL — Dangerous leniency, high reoffense rates
 *   25-39 = POOR — Pattern of under-sentencing with bad outcomes
 *   40-54 = CONCERNING — Below average, trends toward leniency problems
 *   55-69 = FAIR — Mixed record, room for improvement
 *   70-84 = GOOD — Appropriate sentencing, reasonable outcomes
 *   85-100 = EXCELLENT — Strong record, sentences that protect the public
 * 
 * SCORING FACTORS (weighted by what matters most):
 * 
 * 1. RECIDIVISM IMPACT (35%) — THE BIG ONE
 *    Did people this judge released go on to reoffend?
 *    This is the ultimate measure: did their decisions protect the public?
 *    Lower recidivism = higher score
 * 
 * 2. SENTENCING vs GUIDELINES (30%)
 *    How far do they deviate from recommended sentences?
 *    Consistently sentencing WAY below guidelines = red flag
 *    Moderate deviation is normal. Extreme deviation is the problem.
 * 
 * 3. REVERSAL RATE (20%)
 *    How often are their decisions overturned on appeal?
 *    High reversal = other judges think they got it wrong
 *    This is a peer-review signal for judicial competence
 * 
 * 4. COMMUNITY IMPACT (15%)
 *    Public reviews, victim testimonials, "would you re-elect?" polls
 *    The people affected by these decisions get a voice
 * 
 * IMPORTANT NOTES:
 * - We DO NOT penalize for being tough. Tough but fair = good score.
 * - We DO penalize for leniency that leads to bad outcomes.
 * - A lenient judge with LOW recidivism would still score well —
 *   meaning their leniency actually worked.
 * - The system rewards RESULTS, not ideology.
 */

export interface ScoringInputs {
  // Recidivism data (Phase 2 — most important but hardest to get)
  recidivismRate?: number;        // % of released who reoffended (0-100)
  
  // Sentencing data
  avgSentenceVsGuideline?: number; // deviation from guidelines (-100 to +100)
                                    // negative = below guidelines (lenient)
                                    // positive = above guidelines (harsh)
  
  // Reversal data
  reversalRate?: number;           // % of decisions overturned on appeal (0-100)
  
  // Community data
  communityScore?: number;         // aggregate review score (0-100)
  reviewCount?: number;            // number of reviews (for confidence weighting)
  reelectRate?: number;            // % who would re-elect (0-100)
  
  // Case volume (used for confidence, not scoring)
  totalCases?: number;
  yearsServing?: number;
}

export interface ScoreResult {
  overall: number;                 // 0-100 composite score
  grade: string;                   // CRITICAL | POOR | CONCERNING | FAIR | GOOD | EXCELLENT
  color: string;                   // hex color for display
  factors: {
    recidivism: FactorScore;
    sentencing: FactorScore;
    reversal: FactorScore;
    community: FactorScore;
  };
  confidence: 'low' | 'medium' | 'high';  // how much data we have
  dataStatus: string;              // human-readable data status
}

export interface FactorScore {
  score: number;                   // 0-100 for this factor
  weight: number;                  // how much it contributes
  rawValue: number | null;         // the raw data point
  available: boolean;              // do we have data?
  label: string;                   // human-readable description
}

// ============================================
// MAIN SCORING FUNCTION
// ============================================

export function calculateAccountabilityScore(inputs: ScoringInputs): ScoreResult {
  const factors = {
    recidivism: scoreRecidivism(inputs),
    sentencing: scoreSentencing(inputs),
    reversal: scoreReversal(inputs),
    community: scoreCommunity(inputs),
  };
  
  // Calculate weighted composite
  // If a factor has no data, redistribute its weight proportionally
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const factor of Object.values(factors)) {
    if (factor.available) {
      totalWeight += factor.weight;
      weightedSum += factor.score * factor.weight;
    }
  }
  
  // Need at least ONE factor to produce a score
  const overall = totalWeight > 0 
    ? Math.round(Math.max(0, Math.min(100, weightedSum / totalWeight)))
    : -1; // -1 = insufficient data
  
  // Determine confidence level
  const availableCount = Object.values(factors).filter(f => f.available).length;
  const confidence: ScoreResult['confidence'] = 
    availableCount >= 3 ? 'high' :
    availableCount >= 2 ? 'medium' : 'low';
  
  // Data status message
  const dataStatus = 
    availableCount === 4 ? 'Full data available' :
    availableCount === 3 ? `${4 - availableCount} factor pending` :
    availableCount >= 1 ? `Preliminary — ${availableCount}/4 factors available` :
    'Collecting data...';
  
  return {
    overall: overall >= 0 ? overall : 0,
    grade: getGrade(overall),
    color: getColor(overall),
    factors,
    confidence,
    dataStatus,
  };
}

// ============================================
// INDIVIDUAL FACTOR SCORING
// ============================================

/**
 * RECIDIVISM (35% weight) — THE BIG ONE
 * 
 * "Did the people you released go on to hurt more people?"
 * 
 * National average recidivism ~44% within first year, ~77% within 5 years (DOJ/BJS)
 * For our purposes, we compare against a reasonable baseline.
 * 
 * Scoring curve:
 *   0-10% recidivism → 95-100 (exceptional outcomes)
 *   10-20% → 80-95 (well below average — their approach works)
 *   20-30% → 60-80 (below average — decent)
 *   30-44% → 40-60 (around average — nothing special)
 *   44-60% → 20-40 (above average — concerning)
 *   60%+   → 0-20 (revolving door — dangerous)
 */
function scoreRecidivism(inputs: ScoringInputs): FactorScore {
  if (inputs.recidivismRate === undefined || inputs.recidivismRate === null) {
    return {
      score: 0, weight: 0.35, rawValue: null, available: false,
      label: 'Recidivism data not yet available',
    };
  }
  
  const rate = inputs.recidivismRate;
  let score: number;
  
  if (rate <= 10) score = 95 + (10 - rate) * 0.5;           // 95-100
  else if (rate <= 20) score = 80 + (20 - rate) * 1.5;      // 80-95
  else if (rate <= 30) score = 60 + (30 - rate) * 2;        // 60-80
  else if (rate <= 44) score = 40 + (44 - rate) * 1.43;     // 40-60
  else if (rate <= 60) score = 20 + (60 - rate) * 1.25;     // 20-40
  else score = Math.max(0, 20 - (rate - 60) * 0.5);         // 0-20
  
  const label = rate <= 20 ? 'Low reoffense rate — approach is working' :
                rate <= 35 ? 'Moderate reoffense rate' :
                rate <= 50 ? 'High reoffense rate — leniency not working' :
                'Extremely high reoffense — revolving door';
  
  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    weight: 0.35,
    rawValue: rate,
    available: true,
    label,
  };
}

/**
 * SENTENCING vs GUIDELINES (30% weight)
 * 
 * "Are you following the guidelines, or making up your own rules?"
 * 
 * We care most about EXTREME below-guideline sentencing.
 * Moderate deviation is normal (judges have discretion).
 * Consistent, extreme leniency is the problem.
 * 
 * Scoring curve (deviation from guidelines):
 *   -5% to +10% → 85-100 (within normal range)
 *   -10% to -5% → 70-85 (slightly lenient — watch it)
 *   -20% to -10% → 50-70 (moderately below — concerning pattern)
 *   -30% to -20% → 30-50 (significantly below — serious issue)
 *   -30%+ below → 0-30 (way off guidelines — why even have them?)
 *   +10% to +20% above → 70-85 (tough but within reason)
 *   +20%+ above → 60-70 (excessively harsh — also a problem)
 */
function scoreSentencing(inputs: ScoringInputs): FactorScore {
  if (inputs.avgSentenceVsGuideline === undefined || inputs.avgSentenceVsGuideline === null) {
    return {
      score: 0, weight: 0.30, rawValue: null, available: false,
      label: 'Sentencing data not yet available',
    };
  }
  
  const dev = inputs.avgSentenceVsGuideline;
  let score: number;
  
  if (dev >= -5 && dev <= 10) {
    // Sweet spot — following guidelines
    score = 85 + (1 - Math.abs(dev - 2.5) / 7.5) * 15;
  } else if (dev < -5 && dev >= -10) {
    score = 70 + (dev + 10) * 3;         // 70-85
  } else if (dev < -10 && dev >= -20) {
    score = 50 + (dev + 20) * 2;         // 50-70
  } else if (dev < -20 && dev >= -30) {
    score = 30 + (dev + 30) * 2;         // 30-50
  } else if (dev < -30) {
    score = Math.max(0, 30 + (dev + 30) * 1); // 0-30
  } else if (dev > 10 && dev <= 20) {
    score = 85 - (dev - 10) * 1.5;       // 70-85 (tough)
  } else {
    score = Math.max(60, 70 - (dev - 20) * 0.5); // 60-70 (too harsh)
  }
  
  const label = dev >= -5 && dev <= 10 ? 'Within sentencing guidelines' :
                dev < -20 ? 'Significantly below guidelines — pattern of leniency' :
                dev < -10 ? 'Below guidelines — trending lenient' :
                dev > 20 ? 'Above guidelines — excessively harsh' :
                dev > 10 ? 'Slightly above guidelines' :
                'Slightly below guidelines';
  
  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    weight: 0.30,
    rawValue: dev,
    available: true,
    label,
  };
}

/**
 * REVERSAL RATE (20% weight)
 * 
 * "How often do other judges look at your decisions and say 'you got this wrong'?"
 * 
 * Federal district court reversal rate averages ~7-10%.
 * 
 * Scoring:
 *   0-3% → 90-100 (rarely overturned — solid judgment)
 *   3-7% → 75-90 (below average reversal — good)
 *   7-10% → 55-75 (around average)
 *   10-15% → 35-55 (above average — concerning)
 *   15%+ → 0-35 (frequently overturned — bad judgment)
 */
function scoreReversal(inputs: ScoringInputs): FactorScore {
  if (inputs.reversalRate === undefined || inputs.reversalRate === null) {
    return {
      score: 0, weight: 0.20, rawValue: null, available: false,
      label: 'Reversal rate data not yet available',
    };
  }
  
  const rate = inputs.reversalRate;
  let score: number;
  
  if (rate <= 3) score = 90 + (3 - rate) * 3.33;           // 90-100
  else if (rate <= 7) score = 75 + (7 - rate) * 3.75;      // 75-90
  else if (rate <= 10) score = 55 + (10 - rate) * 6.67;    // 55-75
  else if (rate <= 15) score = 35 + (15 - rate) * 4;       // 35-55
  else score = Math.max(0, 35 - (rate - 15) * 2.33);       // 0-35
  
  const label = rate <= 5 ? 'Rarely overturned — strong judicial judgment' :
                rate <= 10 ? 'Average reversal rate' :
                rate <= 15 ? 'Frequently overturned — questionable decisions' :
                'Very high reversal rate — serious competence concerns';
  
  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    weight: 0.20,
    rawValue: rate,
    available: true,
    label,
  };
}

/**
 * COMMUNITY IMPACT (15% weight)
 * 
 * "What do the people who've been in your courtroom say?"
 * 
 * Weighted by number of reviews (more reviews = more confident).
 * Minimum 5 reviews to count as "available".
 */
function scoreCommunity(inputs: ScoringInputs): FactorScore {
  const hasReviews = inputs.communityScore !== undefined && 
                     inputs.reviewCount !== undefined && 
                     inputs.reviewCount >= 5;
  
  if (!hasReviews) {
    return {
      score: 0, weight: 0.15, rawValue: null, available: false,
      label: inputs.reviewCount 
        ? `${inputs.reviewCount} review${inputs.reviewCount !== 1 ? 's' : ''} — need 5+ for scoring`
        : 'No community reviews yet',
    };
  }
  
  // Community score is already 0-100
  let score = inputs.communityScore!;
  
  // Factor in re-election sentiment if available
  if (inputs.reelectRate !== undefined) {
    score = score * 0.7 + inputs.reelectRate * 0.3;
  }
  
  // Confidence boost: more reviews = more weight to community score
  const reviewConfidence = Math.min(1, inputs.reviewCount! / 50); // caps at 50 reviews
  score = 50 + (score - 50) * reviewConfidence; // regression toward mean with few reviews
  
  const label = score >= 70 ? 'Positive community sentiment' :
                score >= 50 ? 'Mixed community reviews' :
                score >= 30 ? 'Negative community sentiment' :
                'Strongly negative community sentiment';
  
  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    weight: 0.15,
    rawValue: inputs.communityScore ?? null,
    available: true,
    label,
  };
}

// ============================================
// HELPERS
// ============================================

function getGrade(score: number): string {
  if (score < 0) return 'PENDING';
  if (score >= 85) return 'EXCELLENT';
  if (score >= 70) return 'GOOD';
  if (score >= 55) return 'FAIR';
  if (score >= 40) return 'CONCERNING';
  if (score >= 25) return 'POOR';
  return 'CRITICAL';
}

function getColor(score: number): string {
  if (score < 0) return '#737373';   // gray — no data
  if (score >= 85) return '#22c55e'; // green
  if (score >= 70) return '#22c55e'; // green
  if (score >= 55) return '#eab308'; // yellow
  if (score >= 40) return '#f97316'; // orange
  if (score >= 25) return '#dc2626'; // red
  return '#dc2626';                  // red
}

/**
 * Get a human-readable explanation of why a judge got their score
 */
export function getScoreExplanation(result: ScoreResult): string {
  const parts: string[] = [];
  
  if (result.factors.recidivism.available) {
    parts.push(`Recidivism: ${result.factors.recidivism.rawValue}% reoffense rate — ${result.factors.recidivism.label}`);
  }
  if (result.factors.sentencing.available) {
    const dev = result.factors.sentencing.rawValue!;
    parts.push(`Sentencing: ${dev > 0 ? '+' : ''}${dev}% vs guidelines — ${result.factors.sentencing.label}`);
  }
  if (result.factors.reversal.available) {
    parts.push(`Reversals: ${result.factors.reversal.rawValue}% overturned — ${result.factors.reversal.label}`);
  }
  if (result.factors.community.available) {
    parts.push(`Community: ${result.factors.community.label}`);
  }
  
  return parts.join('\n');
}
