/**
 * RedHanded — Setup database and seed with CourtListener judge data
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://peebgxqrvxafmocatspz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZWJneHFydnhhZm1vY2F0c3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTc2NTgsImV4cCI6MjA5NjMzMzY1OH0.sZjMfYQaW6go3k_ak_zMfs6xG_Dfp4ryZYQm_M5iybw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Load judge data
const judges = JSON.parse(readFileSync(new URL('../src/data/judges.json', import.meta.url), 'utf8'));

async function setupDatabase() {
  console.log('🔴 RedHanded — Setting up Supabase database\n');

  // Run SQL setup via Supabase's SQL endpoint
  const sql = readFileSync(new URL('./setup-db.sql', import.meta.url), 'utf8');

  // We'll use the REST API to run SQL
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  // The SQL needs to be run via the Supabase dashboard SQL editor
  // Let's just try inserting data and see if tables exist
  console.log('⚠️  Run scripts/setup-db.sql in Supabase SQL Editor first!\n');
  console.log('   Dashboard → SQL Editor → New Query → Paste & Run\n');
}

async function seedJudges() {
  console.log(`📊 Seeding ${judges.length} judges...\n`);

  // Transform to DB format
  const rows = judges.map(j => ({
    id: j.id,
    cl_id: j.clId,
    name: j.name,
    slug: j.slug,
    gender: j.gender,
    court: j.court,
    court_full: j.courtFull,
    court_id: j.courtId,
    court_type: j.courtType,
    jurisdiction: j.jurisdiction,
    state: j.state,
    appointed_by: j.appointedBy,
    party: j.party,
    year_started: j.yearStarted,
    years_serving: j.yearsServing,
    education: j.education,
    aba_rating: j.abaRating,
    is_active: j.isActive,
    confirmation_votes_yes: j.confirmationVotesYes,
    confirmation_votes_no: j.confirmationVotesNo,
    race: j.race || [],
    has_photo: j.hasPhoto,
    photo_url: j.photoUrl,
  }));

  // Insert in batches of 50
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('judges')
      .upsert(batch, { onConflict: 'cl_id' });

    if (error) {
      console.error(`❌ Batch ${i / batchSize + 1} error:`, error.message);
      // If table doesn't exist, remind to run SQL
      if (error.message.includes('relation') || error.code === '42P01') {
        console.error('\n⚠️  Tables don\'t exist yet! Run setup-db.sql in Supabase SQL Editor first.');
        console.error('   Dashboard → SQL Editor → New Query → Paste contents of scripts/setup-db.sql → Run\n');
        return false;
      }
    } else {
      inserted += batch.length;
      console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} judges inserted (${inserted}/${rows.length})`);
    }
  }

  console.log(`\n✅ Seeded ${inserted} judges into Supabase!\n`);
  return true;
}

async function verifyData() {
  const { data, error, count } = await supabase
    .from('judges')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Verification failed:', error.message);
    return;
  }

  console.log(`📊 Verification: ${count} judges in database`);

  // Sample query
  const { data: sample } = await supabase
    .from('judges')
    .select('name, court, state, party, aba_rating')
    .limit(5);

  if (sample) {
    console.log('\n📋 Sample judges:');
    sample.forEach(j => {
      console.log(`  ${j.name} | ${j.court} | ${j.state} | ${j.party || 'N/A'} | ABA: ${j.aba_rating || 'N/A'}`);
    });
  }
}

// Main
await setupDatabase();
const success = await seedJudges();
if (success) await verifyData();
