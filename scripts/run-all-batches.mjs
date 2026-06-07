/**
 * RedHanded — Run case data collection in back-to-back batches
 * until daily API limit is approached or all judges are done.
 * Max 6 batches (120 API calls out of 125 daily limit).
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://peebgxqrvxafmocatspz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZWJneHFydnhhZm1vY2F0c3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTc2NTgsImV4cCI6MjA5NjMzMzY1OH0.sZjMfYQaW6go3k_ak_zMfs6xG_Dfp4ryZYQm_M5iybw';
const CL_TOKEN = '30afa00471b5a588781fab533d3fbe8d764daadc';
const CL_BASE = 'https://www.courtlistener.com/api/rest/v4';
const RATE_LIMIT_MS = 13000;
const JUDGES_PER_BATCH = 10;
const MAX_BATCHES = 5; // 5 more batches after the one already running = ~60 judges

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function clFetch(url) {
  const res = await fetch(url, {
    headers: { 'Authorization': `Token ${CL_TOKEN}` },
  });
  if (res.status === 429) {
    console.log('  ⏳ Rate limited! Waiting 65s...');
    await new Promise(r => setTimeout(r, 65000));
    return clFetch(url);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getCaseCount(personId) {
  const url = `${CL_BASE}/dockets/?assigned_to=${personId}&count=on&page_size=1`;
  const data = await clFetch(url);
  return data.count || 0;
}

async function getOpinionCount(personId) {
  const url = `${CL_BASE}/clusters/?panel=${personId}&count=on&page_size=1`;
  const data = await clFetch(url);
  return data.count || 0;
}

async function processBatch(batchNum) {
  const { data: judges, error } = await supabase
    .from('judges')
    .select('id, cl_id, name, years_serving')
    .is('total_cases', null)
    .order('years_serving', { ascending: false })
    .limit(JUDGES_PER_BATCH);

  if (error) {
    console.error(`❌ Batch ${batchNum}: DB error — ${error.message}`);
    return { processed: 0, remaining: -1, hitLimit: false };
  }

  if (!judges || judges.length === 0) {
    console.log(`🎉 Batch ${batchNum}: All judges have case data!`);
    return { processed: 0, remaining: 0, hitLimit: false };
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`📦 BATCH ${batchNum} — Processing ${judges.length} judges`);
  console.log(`${'═'.repeat(50)}`);

  let processed = 0;

  for (const judge of judges) {
    console.log(`\n👤 ${judge.name} (CL ID: ${judge.cl_id})`);
    try {
      const totalCases = await getCaseCount(judge.cl_id);
      console.log(`  📁 ${totalCases} cases`);
      await sleep(RATE_LIMIT_MS);

      const opinionCount = await getOpinionCount(judge.cl_id);
      console.log(`  📝 ${opinionCount} opinions`);
      await sleep(RATE_LIMIT_MS);

      const yearsServing = judge.years_serving || 1;
      const caseloadPerYear = Math.round(totalCases / yearsServing);

      const { error: updateError } = await supabase
        .from('judges')
        .update({
          total_cases: totalCases,
          caseload_per_year: caseloadPerYear,
          citation_count: opinionCount,
          score_updated_at: new Date().toISOString(),
        })
        .eq('id', judge.id);

      if (updateError) {
        console.error(`  ❌ Update failed: ${updateError.message}`);
      } else {
        processed++;
        console.log(`  ✅ ${totalCases} cases, ${caseloadPerYear}/yr, ${opinionCount} opinions`);
      }
    } catch (err) {
      if (err.message.includes('429')) {
        console.log(`  🛑 Hit hard rate limit — stopping.`);
        return { processed, remaining: -1, hitLimit: true };
      }
      console.error(`  ❌ Error: ${err.message}`);
    }
  }

  const { count: remaining } = await supabase
    .from('judges')
    .select('*', { count: 'exact', head: true })
    .is('total_cases', null);

  console.log(`\n✅ Batch ${batchNum} done: ${processed}/${judges.length} processed, ${remaining} remaining`);
  return { processed, remaining, hitLimit: false };
}

async function main() {
  console.log('🔴 RedHanded — Multi-Batch Case Data Collection\n');

  let totalProcessed = 0;

  for (let batch = 1; batch <= MAX_BATCHES; batch++) {
    const result = await processBatch(batch);
    totalProcessed += result.processed;

    if (result.remaining === 0) {
      console.log(`\n🎉 ALL DONE! ${totalProcessed} judges processed across ${batch} batches.`);
      break;
    }
    if (result.hitLimit) {
      console.log(`\n🛑 Rate limit hit after ${batch} batches. ${totalProcessed} judges processed. Run again tomorrow.`);
      break;
    }
    if (batch < MAX_BATCHES) {
      console.log(`\n⏳ Brief pause before next batch...`);
      await sleep(5000);
    }
  }

  // Final status
  const { count: withData } = await supabase.from('judges').select('*', { count: 'exact', head: true }).not('total_cases', 'is', null);
  const { count: total } = await supabase.from('judges').select('*', { count: 'exact', head: true });
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`📊 FINAL STATUS: ${withData}/${total} judges have case data`);
  console.log(`${'═'.repeat(50)}`);
}

main().catch(console.error);
