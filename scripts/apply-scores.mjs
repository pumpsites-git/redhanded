/**
 * Apply preliminary accountability scores to judges who have case data.
 * Uses available data points to generate initial scores.
 * Scores will refine as more data (reversal rates, sentencing, recidivism) comes in.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://peebgxqrvxafmocatspz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZWJneHFydnhhZm1vY2F0c3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTc2NTgsImV4cCI6MjA5NjMzMzY1OH0.sZjMfYQaW6go3k_ak_zMfs6xG_Dfp4ryZYQm_M5iybw'
);

/**
 * Preliminary scoring using available case data.
 * 
 * What we have now:
 * - total_cases: raw case volume
 * - caseload_per_year: cases per year serving
 * - citation_count: opinion clusters (how often cited)
 * - years_serving: tenure
 * 
 * What this tells us:
 * - Caseload efficiency: Are they handling a reasonable volume?
 * - Federal avg is ~400-500 cases/year for district judges
 * - Very low caseload could indicate issues
 * - Very high caseload could indicate rubber-stamping
 * 
 * This is a PRELIMINARY score. Will be refined with:
 * - Reversal rates (Phase 2)
 * - Sentencing vs guidelines (Phase 2)
 * - Recidivism data (Phase 2)
 * - Community reviews (ongoing)
 */
function calculatePreliminaryScore(judge) {
  const { total_cases, caseload_per_year, years_serving, citation_count } = judge;
  
  if (!total_cases || total_cases === 0) return null;
  
  let score = 50; // Start at neutral
  
  // Factor 1: Caseload reasonableness (0-30 points)
  // Federal district judges average ~400-500 cases/year
  // Too low = possible issue, too high = possible rubber-stamping
  const cpy = caseload_per_year || 0;
  let caseloadScore;
  if (cpy >= 200 && cpy <= 700) {
    // Sweet spot — reasonable caseload
    caseloadScore = 25 + (1 - Math.abs(cpy - 400) / 300) * 5;
  } else if (cpy < 200) {
    // Low caseload
    caseloadScore = 15 + (cpy / 200) * 10;
  } else {
    // Very high — over 700/yr
    caseloadScore = Math.max(10, 25 - (cpy - 700) / 100 * 3);
  }
  
  // Factor 2: Experience (0-20 points)
  // More experience generally means more established record
  const yrs = years_serving || 0;
  let experienceScore;
  if (yrs >= 10) experienceScore = 20;
  else if (yrs >= 5) experienceScore = 15 + (yrs - 5) * 1;
  else experienceScore = 10 + yrs;
  
  // Factor 3: Case volume confidence (0-10 points)
  // More total cases = more confident in the data
  let volumeScore;
  if (total_cases >= 5000) volumeScore = 10;
  else if (total_cases >= 2000) volumeScore = 7 + (total_cases - 2000) / 1000;
  else if (total_cases >= 500) volumeScore = 4 + (total_cases - 500) / 500;
  else volumeScore = total_cases / 500 * 4;
  
  // Composite (preliminary — max 60 out of 100 until we get reversal/sentencing/recidivism data)
  // We cap preliminary scores because we're missing the most important factors
  score = Math.round(caseloadScore + experienceScore + volumeScore);
  
  // Cap between 30-70 for preliminary scores
  // We don't want to give anyone an "Excellent" or "Critical" without the real data
  score = Math.max(30, Math.min(70, score));
  
  return score;
}

async function main() {
  console.log('🔴 RedHanded — Applying Preliminary Scores\n');
  
  // Get judges with case data but no score
  const { data: judges, error } = await supabase
    .from('judges')
    .select('*')
    .not('total_cases', 'is', null)
    .gt('total_cases', 0);
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log(`Found ${judges.length} judges with case data\n`);
  
  let scored = 0;
  for (const judge of judges) {
    const score = calculatePreliminaryScore(judge);
    if (score === null) continue;
    
    const { error: updateError } = await supabase
      .from('judges')
      .update({
        accountability_score: score,
        score_updated_at: new Date().toISOString(),
      })
      .eq('id', judge.id);
    
    if (updateError) {
      console.error(`❌ ${judge.name}: ${updateError.message}`);
    } else {
      scored++;
      const grade = score >= 55 ? '🟢' : score >= 40 ? '🟡' : '🔴';
      console.log(`${grade} ${judge.name}: ${score}/100 (${judge.total_cases} cases, ${judge.caseload_per_year}/yr)`);
    }
  }
  
  console.log(`\n✅ Scored ${scored} judges with preliminary scores`);
  console.log(`\n⚠️  These are PRELIMINARY scores (capped 30-70).`);
  console.log(`   Full scores require: reversal rates, sentencing data, recidivism data.`);
  console.log(`   Scores will refine as more data comes in.`);
}

main().catch(console.error);
