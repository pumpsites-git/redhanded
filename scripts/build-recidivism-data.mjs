/**
 * RedHanded — Build Recidivism & Criminal History Data
 * Maps USSC district-level criminal history data to judges via court IDs.
 * Updates Supabase with recidivism rates per judge's district.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://peebgxqrvxafmocatspz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZWJneHFydnhhZm1vY2F0c3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTc2NTgsImV4cCI6MjA5NjMzMzY1OH0.sZjMfYQaW6go3k_ak_zMfs6xG_Dfp4ryZYQm_M5iybw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// USSC District Code → CourtListener court ID mapping
const DISTRICT_MAP = {
  '0': { name: 'Maine', cl: 'med' },
  '1': { name: 'Massachusetts', cl: 'mad' },
  '2': { name: 'New Hampshire', cl: 'nhd' },
  '3': { name: 'Rhode Island', cl: 'rid' },
  '4': { name: 'Puerto Rico', cl: 'prd' },
  '5': { name: 'Connecticut', cl: 'ctd' },
  '6': { name: 'New York North', cl: 'nynd' },
  '7': { name: 'New York East', cl: 'nyed' },
  '8': { name: 'New York South', cl: 'nysd' },
  '9': { name: 'New York West', cl: 'nywb' },
  '10': { name: 'Vermont', cl: 'vtd' },
  '11': { name: 'Delaware', cl: 'ded' },
  '12': { name: 'New Jersey', cl: 'njd' },
  '13': { name: 'Penn. East', cl: 'paed' },
  '14': { name: 'Penn. Mid', cl: 'pamd' },
  '15': { name: 'Penn. West', cl: 'pawd' },
  '16': { name: 'Maryland', cl: 'mdd' },
  '17': { name: 'N Carolina East', cl: 'nced' },
  '18': { name: 'N Carolina Mid', cl: 'ncmd' },
  '19': { name: 'N Carolina West', cl: 'ncwd' },
  '20': { name: 'South Carolina', cl: 'scd' },
  '22': { name: 'Virginia East', cl: 'vaed' },
  '23': { name: 'Virginia West', cl: 'vawd' },
  '24': { name: 'W Virginia North', cl: 'wvnd' },
  '25': { name: 'W Virginia South', cl: 'wvsd' },
  '26': { name: 'Alabama North', cl: 'alnd' },
  '27': { name: 'Alabama Mid', cl: 'almd' },
  '28': { name: 'Alabama South', cl: 'alsd' },
  '29': { name: 'Florida North', cl: 'flnd' },
  '30': { name: 'Florida Mid', cl: 'flmd' },
  '31': { name: 'Florida South', cl: 'flsd' },
  '32': { name: 'Georgia North', cl: 'gand' },
  '33': { name: 'Georgia Mid', cl: 'gamd' },
  '34': { name: 'Georgia South', cl: 'gasd' },
  '35': { name: 'Louisiana East', cl: 'laed' },
  '36': { name: 'Louisiana West', cl: 'lawd' },
  '37': { name: 'Mississippi North', cl: 'msnd' },
  '38': { name: 'Mississippi South', cl: 'mssd' },
  '39': { name: 'Texas North', cl: 'txnd' },
  '40': { name: 'Texas East', cl: 'txed' },
  '41': { name: 'Texas South', cl: 'txsd' },
  '42': { name: 'Texas West', cl: 'txwd' },
  '43': { name: 'Kentucky East', cl: 'kyed' },
  '44': { name: 'Kentucky West', cl: 'kywd' },
  '45': { name: 'Michigan East', cl: 'mied' },
  '46': { name: 'Michigan West', cl: 'miwd' },
  '47': { name: 'Ohio North', cl: 'ohnd' },
  '48': { name: 'Ohio South', cl: 'ohsd' },
  '49': { name: 'Tennessee East', cl: 'tned' },
  '50': { name: 'Tennessee Mid', cl: 'tnmd' },
  '51': { name: 'Tennessee West', cl: 'tnwd' },
  '52': { name: 'Illinois North', cl: 'ilnd' },
  '53': { name: 'Illinois Cent', cl: 'ilcd' },
  '54': { name: 'Illinois South', cl: 'ilsd' },
  '55': { name: 'Indiana North', cl: 'innd' },
  '56': { name: 'Indiana South', cl: 'insd' },
  '57': { name: 'Wisconsin East', cl: 'wied' },
  '58': { name: 'Wisconsin West', cl: 'wiwd' },
  '60': { name: 'Arkansas East', cl: 'ared' },
  '61': { name: 'Arkansas West', cl: 'arwd' },
  '62': { name: 'Iowa North', cl: 'iand' },
  '63': { name: 'Iowa South', cl: 'iasd' },
  '64': { name: 'Minnesota', cl: 'mnd' },
  '65': { name: 'Missouri East', cl: 'moed' },
  '66': { name: 'Missouri West', cl: 'mowd' },
  '67': { name: 'Nebraska', cl: 'ned' },
  '68': { name: 'North Dakota', cl: 'ndd' },
  '69': { name: 'South Dakota', cl: 'sdd' },
  '70': { name: 'Arizona', cl: 'azd' },
  '71': { name: 'California North', cl: 'cand' },
  '72': { name: 'California East', cl: 'caed' },
  '73': { name: 'California Central', cl: 'cacd' },
  '74': { name: 'California South', cl: 'casd' },
  '75': { name: 'Hawaii', cl: 'hid' },
  '76': { name: 'Idaho', cl: 'idd' },
  '77': { name: 'Montana', cl: 'mtd' },
  '78': { name: 'Nevada', cl: 'nvd' },
  '79': { name: 'Oregon', cl: 'ord' },
  '80': { name: 'Washington East', cl: 'waed' },
  '81': { name: 'Washington West', cl: 'wawd' },
  '82': { name: 'Colorado', cl: 'cod' },
  '83': { name: 'Kansas', cl: 'ksd' },
  '84': { name: 'New Mexico', cl: 'nmd' },
  '85': { name: 'Oklahoma North', cl: 'oknd' },
  '86': { name: 'Oklahoma East', cl: 'oked' },
  '87': { name: 'Oklahoma West', cl: 'okwd' },
  '88': { name: 'Utah', cl: 'utd' },
  '89': { name: 'Wyoming', cl: 'wyd' },
  '90': { name: 'Dist of Columbia', cl: 'dcd' },
  '91': { name: 'Virgin Islands', cl: 'vid' },
  '93': { name: 'Guam', cl: 'gud' },
  '94': { name: 'N Mariana Islands', cl: 'nmid' },
  '95': { name: 'Alaska', cl: 'akd' },
  '96': { name: 'Louisiana Middle', cl: 'lamd' },
};

// Build reverse map: CL court ID → USSC district code
const CL_TO_USSC = {};
for (const [code, info] of Object.entries(DISTRICT_MAP)) {
  CL_TO_USSC[info.cl] = code;
}

async function main() {
  console.log('🔴 RedHanded — Building Recidivism Data\n');

  // Load recidivism data
  const recidivism = JSON.parse(
    readFileSync(new URL('../data/ussc/district-recidivism-fy25.json', import.meta.url), 'utf8')
  );
  console.log(`📊 Loaded recidivism data for ${Object.keys(recidivism).length} districts\n`);

  // Get all judges from Supabase
  const { data: judges, error } = await supabase
    .from('judges')
    .select('id, name, court_id, court_full');

  if (error) {
    console.error('❌ DB error:', error.message);
    return;
  }

  console.log(`👥 ${judges.length} judges in database\n`);

  let matched = 0;
  let unmatched = 0;
  let updated = 0;

  for (const judge of judges) {
    const courtId = judge.court_id;
    const usscCode = CL_TO_USSC[courtId];

    if (!usscCode || !recidivism[usscCode]) {
      unmatched++;
      continue;
    }

    matched++;
    const distData = recidivism[usscCode];

    const { error: updateErr } = await supabase
      .from('judges')
      .update({
        recidivism_rate: distData.repeat_rate_pct,
      })
      .eq('id', judge.id);

    if (updateErr) {
      console.error(`  ❌ ${judge.name}: ${updateErr.message}`);
    } else {
      updated++;
    }
  }

  console.log(`\n✅ Results:`);
  console.log(`  Matched to districts: ${matched}`);
  console.log(`  Updated in DB: ${updated}`);
  console.log(`  Unmatched (appellate/other): ${unmatched}`);
  
  // Show some stats
  const { data: topRepeat } = await supabase
    .from('judges')
    .select('name, court_full, recidivism_rate')
    .not('recidivism_rate', 'is', null)
    .order('recidivism_rate', { ascending: false })
    .limit(10);

  if (topRepeat?.length) {
    console.log(`\n🔴 Judges in districts with HIGHEST repeat offender rates:`);
    topRepeat.forEach(j => {
      console.log(`  ${j.recidivism_rate}% — ${j.name} (${j.court_full})`);
    });
  }
}

main().catch(console.error);
