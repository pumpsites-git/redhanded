/**
 * RedHanded — Defendant Data Pipeline
 * Pulls actual criminal case details from CourtListener dockets.
 * Identifies repeat offenders by matching defendant names across cases.
 * 
 * Strategy: For each judge, pull their dockets and extract:
 * - Defendant names
 * - Case details (charges, dates, outcomes)
 * - Cross-reference defendants across multiple cases = repeat offenders
 * 
 * Rate limit: 5/min, 50/hr, 125/day
 * Run daily via cron alongside judge case data collection.
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';

const CL_TOKEN = '30afa00471b5a588781fab533d3fbe8d764daadc';
const CL_BASE = 'https://www.courtlistener.com/api/rest/v4';
const SUPABASE_URL = 'https://peebgxqrvxafmocatspz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZWJneHFydnhhZm1vY2F0c3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTc2NTgsImV4cCI6MjA5NjMzMzY1OH0.sZjMfYQaW6go3k_ak_zMfs6xG_Dfp4ryZYQm_M5iybw';
const RATE_LIMIT_MS = 13000;
const MAX_DOCKETS_PER_RUN = 20; // 20 dockets = ~20 API calls

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Local cache for defendants
const CACHE_DIR = new URL('../data/defendants', import.meta.url).pathname;
const DEFENDANT_FILE = `${CACHE_DIR}/defendants.json`;
const PROGRESS_FILE = `${CACHE_DIR}/fetch-progress.json`;

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

async function clFetch(url) {
  const res = await fetch(url, {
    headers: { 'Authorization': `Token ${CL_TOKEN}` },
  });
  if (res.status === 429) {
    console.log('  ⏳ Rate limited, waiting 65s...');
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

/**
 * Fetch recent criminal dockets for a judge.
 * We filter for criminal cases using nature_of_suit codes.
 */
async function fetchJudgeDockets(personId, limit = 5) {
  // Get dockets assigned to this judge — we'll filter for criminal cases client-side
  const url = `${CL_BASE}/dockets/?assigned_to=${personId}&order_by=-date_filed&page_size=${limit}&fields=id,case_name,date_filed,date_terminated,court,nature_of_suit`;
  const data = await clFetch(url);
  return data.results || [];
}

/**
 * Fetch parties (defendants) from a docket
 */
async function fetchDocketParties(docketId) {
  const url = `${CL_BASE}/parties/?docket=${docketId}&page_size=20&fields=id,name,type,extra_info,date_termination`;
  try {
    const data = await clFetch(url);
    return (data.results || []).filter(p => {
      const type = (p.type || '').toLowerCase();
      return type.includes('defendant') || type.includes('respondent');
    });
  } catch {
    return [];
  }
}

async function main() {
  console.log('🔴 RedHanded — Defendant Data Pipeline\n');
  ensureDir(CACHE_DIR);

  // Load existing data
  let defendants = {};
  if (existsSync(DEFENDANT_FILE)) {
    defendants = JSON.parse(readFileSync(DEFENDANT_FILE, 'utf8'));
  }

  let progress = { lastJudgeIndex: 0, totalDocketsFetched: 0, totalDefendants: 0 };
  if (existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
  }

  // Get judges with case data (we know their CL IDs)
  const { data: judges, error } = await supabase
    .from('judges')
    .select('id, cl_id, name, court_id')
    .not('total_cases', 'is', null)
    .order('total_cases', { ascending: false })
    .range(progress.lastJudgeIndex, progress.lastJudgeIndex + 4); // 5 judges per run

  if (error) {
    console.error('❌ DB error:', error.message);
    return;
  }

  if (!judges || judges.length === 0) {
    console.log('✅ All judges processed for defendants!');
    progress.lastJudgeIndex = 0; // Reset for next cycle
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    return;
  }

  let apiCalls = 0;
  let newDefendants = 0;

  for (const judge of judges) {
    console.log(`\n👤 ${judge.name} (CL: ${judge.cl_id})`);

    try {
      // Fetch recent dockets for this judge
      const dockets = await fetchJudgeDockets(judge.cl_id, 20);
      apiCalls++;
      console.log(`  📁 ${dockets.length} dockets fetched`);
      await sleep(RATE_LIMIT_MS);

      // Filter for criminal cases ("United States v." or "USA v.")
      const crimDockets = dockets.filter(d => {
        const name = (d.case_name || '').toLowerCase();
        return name.includes('united states v') || name.includes('usa v') || name.includes('u.s. v');
      });
      console.log(`  ⚖️ ${crimDockets.length} criminal dockets (of ${dockets.length})`);

      for (const docket of crimDockets) {
        // Fetch defendants from this docket
        const parties = await fetchDocketParties(docket.id);
        apiCalls++;
        progress.totalDocketsFetched++;

        for (const party of parties) {
          const name = party.name?.trim();
          if (!name || name.length < 3) continue;

          // Normalize name for matching
          const nameKey = name.toLowerCase().replace(/[^a-z\s]/g, '').trim();

          if (!defendants[nameKey]) {
            defendants[nameKey] = {
              name: name,
              cases: [],
              judges: [],
              courts: [],
              firstSeen: docket.date_filed,
              lastSeen: docket.date_filed,
            };
            newDefendants++;
          }

          // Add this case if not already tracked
          const caseId = `cl-${docket.id}`;
          if (!defendants[nameKey].cases.find(c => c.id === caseId)) {
            defendants[nameKey].cases.push({
              id: caseId,
              caseName: docket.case_name,
              dateFiled: docket.date_filed,
              dateTerminated: docket.date_terminated,
              court: docket.court,
              natureOfSuit: docket.nature_of_suit,
            });

            // Track judges
            if (!defendants[nameKey].judges.includes(judge.id)) {
              defendants[nameKey].judges.push(judge.id);
            }
            if (!defendants[nameKey].courts.includes(judge.court_id)) {
              defendants[nameKey].courts.push(judge.court_id);
            }

            // Update date range
            if (docket.date_filed < defendants[nameKey].firstSeen) {
              defendants[nameKey].firstSeen = docket.date_filed;
            }
            if (docket.date_filed > defendants[nameKey].lastSeen) {
              defendants[nameKey].lastSeen = docket.date_filed;
            }
          }
        }

        console.log(`  📋 ${docket.case_name?.substring(0, 50)} — ${parties.length} defendants`);
        await sleep(RATE_LIMIT_MS);

        if (apiCalls >= MAX_DOCKETS_PER_RUN) break;
      }
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
      if (err.message.includes('429')) {
        console.log('  🛑 Rate limit hit — stopping.');
        break;
      }
    }

    if (apiCalls >= MAX_DOCKETS_PER_RUN) break;
  }

  // Update progress
  progress.lastJudgeIndex += judges.length;
  progress.totalDefendants = Object.keys(defendants).length;

  // Find repeat offenders
  const repeatOffenders = Object.values(defendants)
    .filter(d => d.cases.length >= 2)
    .sort((a, b) => b.cases.length - a.cases.length);

  // Save everything
  writeFileSync(DEFENDANT_FILE, JSON.stringify(defendants, null, 2));
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

  // Summary
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`✅ API calls: ${apiCalls}`);
  console.log(`👥 New defendants found: ${newDefendants}`);
  console.log(`📊 Total defendants tracked: ${progress.totalDefendants}`);
  console.log(`🔄 Repeat offenders (2+ cases): ${repeatOffenders.length}`);

  if (repeatOffenders.length > 0) {
    console.log(`\n🔴 Top repeat offenders:`);
    repeatOffenders.slice(0, 10).forEach(d => {
      console.log(`  ${d.name}: ${d.cases.length} cases, ${d.judges.length} judges`);
    });
  }

  console.log(`\n📍 Progress: processed judges ${progress.lastJudgeIndex - judges.length + 1}-${progress.lastJudgeIndex}`);
  console.log(`⏳ Run again to continue from judge #${progress.lastJudgeIndex + 1}`);
}

main().catch(console.error);
