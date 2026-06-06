/**
 * Update judge accountability scores with real USSC sentencing data.
 * Maps district-level sentencing patterns to individual judges.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://peebgxqrvxafmocatspz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZWJneHFydnhhZm1vY2F0c3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTc2NTgsImV4cCI6MjA5NjMzMzY1OH0.sZjMfYQaW6go3k_ak_zMfs6xG_Dfp4ryZYQm_M5iybw'
);

// Load court sentencing data
const courtSentencing = JSON.parse(
  readFileSync(new URL('../data/ussc/court-sentencing-fy25.json', import.meta.url), 'utf8')
);

// National averages for comparison
const allDistricts = Object.values(courtSentencing);
const nationalAvgBelowPct = allDistricts.reduce((sum, d) => sum + d.below_range_pct, 0) / allDistricts.length;
const nationalAvgSentence = allDistricts.reduce((sum, d) => sum + d.avg_sentence_months, 0) / allDistricts.length;

console.log(`National avg below-guidelines rate: ${nationalAvgBelowPct.toFixed(1)}%`);
console.log(`National avg sentence: ${nationalAvgSentence.toFixed(1)} months\n`);

/**
 * Score a judge using real sentencing data + case volume
 * 
 * Factors:
 * 1. District below-guidelines rate (30%) — how often their court sentences below guidelines
 * 2. Case volume reasonableness (20%) — rubber-stamping vs reasonable
 * 3. District avg sentence vs national (20%) — are sentences lighter than average?
 * 4. Experience/tenure (10%) — more data = more confidence
 * 5. Reserved for reversal rate (20%) — will be filled when API data comes in
 */
function calculateScore(judge, districtData) {
  let score = 0;
  let totalWeight = 0;
  const factors = {};

  // Factor 1: Below-guidelines rate (30%)
  // National avg is ~17-18%. Higher = more lenient = lower score
  if (districtData) {
    const belowPct = districtData.below_range_pct;
    let belowScore;
    
    if (belowPct <= 10) belowScore = 90;       // Very adherent to guidelines
    else if (belowPct <= 15) belowScore = 75;   // Slightly below avg
    else if (belowPct <= 20) belowScore = 60;   // Average
    else if (belowPct <= 25) belowScore = 45;   // Above avg leniency
    else if (belowPct <= 30) belowScore = 35;   // Concerning
    else belowScore = 20;                        // Extreme leniency
    
    score += belowScore * 0.30;
    totalWeight += 0.30;
    factors.sentencing = { score: belowScore, belowPct, label: `${belowPct}% below guidelines` };
  }

  // Factor 2: Case volume (20%)
  if (judge.total_cases && judge.caseload_per_year) {
    const cpy = judge.caseload_per_year;
    let volScore;
    if (cpy >= 200 && cpy <= 600) volScore = 80;      // Healthy range
    else if (cpy >= 100 && cpy <= 800) volScore = 65;  // Acceptable
    else if (cpy < 100) volScore = 50;                  // Low
    else volScore = 40;                                  // Very high - rubber stamp?
    
    score += volScore * 0.20;
    totalWeight += 0.20;
    factors.caseload = { score: volScore, cpy, label: `${cpy} cases/yr` };
  }

  // Factor 3: Avg sentence vs national (20%)
  if (districtData) {
    const sentDiff = districtData.avg_sentence_months - nationalAvgSentence;
    const sentPctDiff = (sentDiff / nationalAvgSentence) * 100;
    let sentScore;
    
    if (sentPctDiff >= 0) sentScore = 70 + Math.min(20, sentPctDiff);    // At or above national
    else if (sentPctDiff >= -20) sentScore = 50 + sentPctDiff * 1;       // Slightly below
    else sentScore = Math.max(20, 50 + sentPctDiff * 0.5);              // Well below
    
    score += sentScore * 0.20;
    totalWeight += 0.20;
    factors.avgSentence = { 
      score: Math.round(sentScore), 
      months: districtData.avg_sentence_months,
      vsNational: `${sentDiff > 0 ? '+' : ''}${sentDiff.toFixed(0)} months vs national avg`,
    };
  }

  // Factor 4: Experience (10%)
  if (judge.years_serving) {
    const expScore = Math.min(80, 40 + judge.years_serving * 4);
    score += expScore * 0.10;
    totalWeight += 0.10;
    factors.experience = { score: expScore, years: judge.years_serving };
  }

  // Factor 5: Reversal rate (20%) — RESERVED for CourtListener data
  // Will be filled when API rate limit resets
  factors.reversalRate = { score: null, label: 'Pending — collecting appeals data' };

  // Normalize to 0-100 based on available factors
  const finalScore = totalWeight > 0 ? Math.round(score / totalWeight) : null;
  
  return { score: finalScore, factors };
}

async function main() {
  console.log('🔴 RedHanded — Updating Scores with USSC Sentencing Data\n');

  const { data: judges, error } = await supabase
    .from('judges')
    .select('*');

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`Processing ${judges.length} judges...\n`);

  let updated = 0;
  let noData = 0;

  for (const judge of judges) {
    const districtData = courtSentencing[judge.court_id];
    const result = calculateScore(judge, districtData);

    if (result.score === null) {
      noData++;
      continue;
    }

    const { error: updateError } = await supabase
      .from('judges')
      .update({
        accountability_score: result.score,
        avg_sentence_vs_guideline: districtData ? -districtData.below_range_pct : null,
        score_updated_at: new Date().toISOString(),
      })
      .eq('id', judge.id);

    if (updateError) {
      console.error(`❌ ${judge.name}: ${updateError.message}`);
    } else {
      updated++;
      const grade = result.score >= 65 ? '🟢' : result.score >= 50 ? '🟡' : '🔴';
      const sentInfo = result.factors.sentencing 
        ? ` | ${result.factors.sentencing.belowPct}% below guidelines` 
        : '';
      console.log(`${grade} ${judge.name}: ${result.score}/100${sentInfo}`);
    }
  }

  console.log(`\n✅ Updated ${updated} judges with USSC sentencing data`);
  console.log(`⚠️  ${noData} judges had no matching district data`);
  console.log(`\nScores now include REAL sentencing-vs-guidelines data from the US Sentencing Commission.`);
  console.log(`Reversal rates will be added once CourtListener API rate limit resets.`);
}

main().catch(console.error);
