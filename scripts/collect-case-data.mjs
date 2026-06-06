/**
 * RedHanded — Case Data Collection Pipeline
 * Pulls docket counts per judge from CourtListener API.
 * Respects 5/min rate limit. Updates Supabase with case stats.
 * 
 * Run: node scripts/collect-case-data.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const CL_TOKEN = '30afa00471b5a588781fab533d3fbe8d764daadc';
const CL_BASE = 'https://www.courtlistener.com/api/rest/v4';
const SUPABASE_URL = 'https://peebgxqrvxafmocatspz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZWJneHFydnhhZm1vY2F0c3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTc2NTgsImV4cCI6MjA5NjMzMzY1OH0.sZjMfYQaW6go3k_ak_zMfs6xG_Dfp4ryZYQm_M5iybw';
const RATE_LIMIT_MS = 13000; // 5 req/min = 12s + 1s buffer
const MAX_JUDGES_PER_RUN = 10; // Process 10 judges per run to stay within daily limits

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function clFetch(url) {
  const res = await fetch(url, {
    headers: { 'Authorization': `Token ${CL_TOKEN}` },
  });
  if (res.status === 429) {
    console.log('  ⏳ Rate limited, waiting 60s...');
    await new Promise(r => setTimeout(r, 60000));
    return clFetch(url);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Get case count for a judge by looking up dockets assigned to them
 */
async function getCaseCount(personId) {
  const url = `${CL_BASE}/dockets/?assigned_to=${personId}&count=on&page_size=1`;
  const data = await clFetch(url);
  return data.count || 0;
}

/**
 * Get opinion cluster count for a judge (cases they authored opinions on)
 */
async function getOpinionCount(personId) {
  const url = `${CL_BASE}/clusters/?panel=${personId}&count=on&page_size=1`;
  const data = await clFetch(url);
  return data.count || 0;
}

/**
 * Get citation count — how often this judge's opinions are cited
 * (proxy for opinion quality/influence)
 */
async function getCitationCount(personId) {
  // Search for opinions by this judge and get cite counts
  const url = `${CL_BASE}/search/?type=o&assigned_to=${personId}&order_by=-citeCount&page_size=1`;
  try {
    const data = await clFetch(url);
    // Sum up citation counts from results
    if (data.results && data.results.length > 0) {
      return data.count || 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

async function main() {
  console.log('🔴 RedHanded — Case Data Collection Pipeline\n');

  // Get judges that haven't been scored yet
  const { data: judges, error } = await supabase
    .from('judges')
    .select('id, cl_id, name, years_serving')
    .is('total_cases', null)
    .order('years_serving', { ascending: false })
    .limit(MAX_JUDGES_PER_RUN);

  if (error) {
    console.error('❌ Failed to fetch judges:', error.message);
    return;
  }

  if (!judges || judges.length === 0) {
    console.log('✅ All judges have case data! Nothing to do.');
    return;
  }

  console.log(`📊 Processing ${judges.length} judges (${MAX_JUDGES_PER_RUN} per run)...\n`);

  let processed = 0;
  let apiCalls = 0;

  for (const judge of judges) {
    console.log(`\n👤 ${judge.name} (CL ID: ${judge.cl_id})`);

    try {
      // 1. Get case count
      console.log('  📁 Fetching case count...');
      const totalCases = await getCaseCount(judge.cl_id);
      apiCalls++;
      console.log(`  ✓ ${totalCases} cases`);
      await sleep(RATE_LIMIT_MS);

      // 2. Get opinion count
      console.log('  📝 Fetching opinion count...');
      const opinionCount = await getOpinionCount(judge.cl_id);
      apiCalls++;
      console.log(`  ✓ ${opinionCount} opinion clusters`);
      await sleep(RATE_LIMIT_MS);

      // Calculate caseload per year
      const yearsServing = judge.years_serving || 1;
      const caseloadPerYear = Math.round(totalCases / yearsServing);

      // Update judge in Supabase
      const { error: updateError } = await supabase
        .from('judges')
        .update({
          total_cases: totalCases,
          caseload_per_year: caseloadPerYear,
          citation_count: opinionCount, // using opinion count as proxy for now
          score_updated_at: new Date().toISOString(),
        })
        .eq('id', judge.id);

      if (updateError) {
        console.error(`  ❌ Update failed: ${updateError.message}`);
      } else {
        processed++;
        console.log(`  ✅ Updated: ${totalCases} cases, ${caseloadPerYear}/yr, ${opinionCount} opinions`);
      }

      // Log the collection
      await supabase.from('data_collection_log').insert({
        judge_id: judge.id,
        data_type: 'cases',
        status: 'complete',
        records_fetched: totalCases,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });

    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
      
      await supabase.from('data_collection_log').insert({
        judge_id: judge.id,
        data_type: 'cases',
        status: 'error',
        error_message: err.message,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
    }
  }

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Processed: ${processed}/${judges.length} judges`);
  console.log(`📡 API calls used: ${apiCalls}`);
  
  // Check remaining
  const { count: remaining } = await supabase
    .from('judges')
    .select('*', { count: 'exact', head: true })
    .is('total_cases', null);
  
  console.log(`📊 Remaining judges without case data: ${remaining}`);
  
  if (remaining > 0) {
    console.log(`\n⏳ Run this script again to process the next batch.`);
    console.log(`   Estimated runs needed: ${Math.ceil(remaining / MAX_JUDGES_PER_RUN)}`);
  } else {
    console.log(`\n🎉 All judges have case data!`);
  }
}

main().catch(console.error);
