/**
 * RedHanded — CourtListener Judge Ingestion Script
 * Fetches federal judges with positions, courts, political affiliations,
 * education, and ABA ratings. Respects 5/min rate limit.
 * 
 * Output: src/data/judges.json
 */

const API_BASE = 'https://www.courtlistener.com/api/rest/v4';
const API_TOKEN = process.env.COURTLISTENER_TOKEN || '30afa00471b5a588781fab533d3fbe8d764daadc';
const RATE_LIMIT_MS = 13000; // 5 requests/min = 12s between requests, +1s buffer
const MAX_PAGES = 10; // ~200 judges for MVP (20 per page)

interface CLPosition {
  id: number;
  position_type: string;
  date_start: string | null;
  date_termination: string | null;
  date_confirmation: string | null;
  how_selected: string;
  court: {
    id: string;
    short_name: string;
    full_name: string;
    jurisdiction: string;
    url: string;
  };
  person: {
    id: number;
    name_first: string;
    name_middle: string;
    name_last: string;
    name_suffix: string;
    slug: string;
    gender: string;
    date_dob: string | null;
    dob_state: string;
    has_photo: boolean;
    race: string[];
    political_affiliations: {
      political_party: string;
      source: string;
      date_start: string | null;
    }[];
    educations: {
      school: {
        name: string;
      };
      degree_level: string;
      degree_detail: string;
      degree_year: number | null;
    }[];
    aba_ratings: {
      year_rated: number;
      rating: string;
    }[];
  };
  appointer: {
    person: {
      name_first: string;
      name_last: string;
    };
  } | null;
  votes_yes: number | null;
  votes_no: number | null;
}

interface ProcessedJudge {
  id: string;
  clId: number;
  name: string;
  slug: string;
  gender: string;
  court: string;
  courtFull: string;
  courtId: string;
  courtType: 'federal_district' | 'federal_appellate' | 'federal_other';
  jurisdiction: string;
  state: string;
  appointedBy: string | null;
  party: string | null;
  yearStarted: number | null;
  yearsServing: number;
  education: string | null;
  abaRating: string | null;
  isActive: boolean;
  confirmationVotesYes: number | null;
  confirmationVotesNo: number | null;
  race: string[];
  hasPhoto: boolean;
  photoUrl: string | null;
}

const ABA_RATING_MAP: Record<string, string> = {
  'ewq': 'Exceptionally Well Qualified',
  'wq': 'Well Qualified',
  'q': 'Qualified',
  'nq': 'Not Qualified',
  'nqa': 'Not Qualified By Reason of Age',
};

const PARTY_MAP: Record<string, string> = {
  'd': 'Democratic',
  'r': 'Republican',
  'i': 'Independent',
  'g': 'Green',
  'l': 'Libertarian',
};

// Map court jurisdiction codes to states (simplified — federal courts span states)
function extractStateFromCourt(courtId: string): string {
  const stateMap: Record<string, string> = {
    'mad': 'MA', 'nyed': 'NY', 'nysd': 'NY', 'nynd': 'NY', 'nywb': 'NY',
    'cacd': 'CA', 'cand': 'CA', 'casd': 'CA', 'caed': 'CA',
    'txnd': 'TX', 'txsd': 'TX', 'txed': 'TX', 'txwd': 'TX',
    'flmd': 'FL', 'flsd': 'FL', 'flnd': 'FL',
    'ilnd': 'IL', 'ilcd': 'IL', 'ilsd': 'IL',
    'paed': 'PA', 'pawd': 'PA', 'pamd': 'PA',
    'ohnd': 'OH', 'ohsd': 'OH',
    'gamd': 'GA', 'gand': 'GA', 'gasd': 'GA',
    'vaed': 'VA', 'vawd': 'VA',
    'njd': 'NJ', 'dcd': 'DC', 'mdd': 'MD',
    'cod': 'CO', 'azd': 'AZ', 'nvd': 'NV', 'ord': 'OR', 'wawd': 'WA', 'waed': 'WA',
    'mied': 'MI', 'miwd': 'MI', 'wied': 'WI', 'wiwd': 'WI',
    'mnd': 'MN', 'mowd': 'MO', 'moed': 'MO',
    'tnmd': 'TN', 'tned': 'TN', 'tnwd': 'TN',
    'laed': 'LA', 'lawd': 'LA', 'lamd': 'LA',
    'alnd': 'AL', 'almd': 'AL', 'alsd': 'AL',
    'scd': 'SC', 'nced': 'NC', 'ncmd': 'NC', 'ncwd': 'NC',
    'ctd': 'CT', 'rid': 'RI', 'nhd': 'NH', 'med': 'ME', 'vtd': 'VT',
    'hid': 'HI', 'akd': 'AK', 'idd': 'ID', 'mtd': 'MT', 'wyd': 'WY',
    'ndd': 'ND', 'sdd': 'SD', 'ned': 'NE', 'ksd': 'KS',
    'oknd': 'OK', 'oked': 'OK', 'okwd': 'OK',
    'arwd': 'AR', 'ared': 'AR', 'msnd': 'MS', 'mssd': 'MS',
    'nmd': 'NM', 'utd': 'UT', 'wvnd': 'WV', 'wvsd': 'WV',
    'iasd': 'IA', 'iand': 'IA', 'innd': 'IN', 'insd': 'IN',
    'kywd': 'KY', 'kyed': 'KY',
    'prd': 'PR', 'vid': 'VI', 'gud': 'GU',
    // Appellate
    'ca1': 'MA', 'ca2': 'NY', 'ca3': 'PA', 'ca4': 'VA', 'ca5': 'TX',
    'ca6': 'OH', 'ca7': 'IL', 'ca8': 'MO', 'ca9': 'CA', 'ca10': 'CO',
    'ca11': 'GA', 'cadc': 'DC', 'cafc': 'DC',
  };
  return stateMap[courtId] || 'US';
}

async function fetchPage(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { 'Authorization': `Token ${API_TOKEN}` },
  });
  if (res.status === 429) {
    console.log('  ⏳ Rate limited, waiting 60s...');
    await new Promise(r => setTimeout(r, 60000));
    return fetchPage(url);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

function processPosition(pos: CLPosition): ProcessedJudge | null {
  const person = pos.person;
  if (!person || !pos.court) return null;

  const name = [person.name_first, person.name_middle, person.name_last, person.name_suffix]
    .filter(Boolean).join(' ');

  const courtJurisdiction = pos.court.jurisdiction;
  let courtType: ProcessedJudge['courtType'] = 'federal_other';
  if (courtJurisdiction === 'FD') courtType = 'federal_district';
  if (['F', 'FB'].includes(courtJurisdiction)) courtType = 'federal_appellate';

  const latestAba = person.aba_ratings?.sort((a, b) => b.year_rated - a.year_rated)[0];
  const latestParty = person.political_affiliations?.[0];

  const startYear = pos.date_start ? new Date(pos.date_start).getFullYear() : null;
  const yearsServing = startYear ? new Date().getFullYear() - startYear : 0;

  const lawSchool = person.educations?.find(e =>
    e.degree_level === 'jd' || e.degree_detail?.toLowerCase().includes('j.d')
  );

  return {
    id: `cl-${person.id}`,
    clId: person.id,
    name: `Hon. ${name}`,
    slug: person.slug,
    gender: person.gender === 'f' ? 'Female' : person.gender === 'm' ? 'Male' : 'Unknown',
    court: pos.court.short_name,
    courtFull: pos.court.full_name,
    courtId: pos.court.id,
    courtType,
    jurisdiction: pos.court.short_name,
    state: extractStateFromCourt(pos.court.id),
    appointedBy: pos.appointer?.person
      ? `${pos.appointer.person.name_first} ${pos.appointer.person.name_last}`
      : null,
    party: latestParty ? (PARTY_MAP[latestParty.political_party] || latestParty.political_party) : null,
    yearStarted: startYear,
    yearsServing,
    education: lawSchool?.school?.name || null,
    abaRating: latestAba ? (ABA_RATING_MAP[latestAba.rating] || latestAba.rating) : null,
    isActive: !pos.date_termination,
    confirmationVotesYes: pos.votes_yes,
    confirmationVotesNo: pos.votes_no,
    race: person.race || [],
    hasPhoto: person.has_photo,
    photoUrl: person.has_photo
      ? `https://www.courtlistener.com/api/rest/v4/people/${person.id}/portrait/`
      : null,
  };
}

async function main() {
  console.log('🔴 RedHanded — Fetching federal judges from CourtListener...\n');

  const judges: ProcessedJudge[] = [];
  let url = `${API_BASE}/positions/?position_type=jud&court__jurisdiction=FD&page_size=20&order_by=-date_start`;
  let page = 0;

  while (url && page < MAX_PAGES) {
    page++;
    console.log(`📄 Page ${page}/${MAX_PAGES}...`);

    const data = await fetchPage(url);
    const results: CLPosition[] = data.results || [];

    for (const pos of results) {
      const judge = processPosition(pos);
      if (judge && judge.isActive) {
        // Dedup by person ID
        if (!judges.find(j => j.clId === judge.clId)) {
          judges.push(judge);
        }
      }
    }

    console.log(`  ✓ Got ${results.length} positions, ${judges.length} unique active judges so far`);

    url = data.next;
    if (url && page < MAX_PAGES) {
      console.log(`  ⏳ Rate limit pause (${RATE_LIMIT_MS / 1000}s)...`);
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
    }
  }

  // Sort by years serving descending
  judges.sort((a, b) => b.yearsServing - a.yearsServing);

  // Write output
  const fs = await import('fs');
  const outDir = new URL('../src/data', import.meta.url).pathname;
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(`${outDir}/judges.json`, JSON.stringify(judges, null, 2));

  console.log(`\n✅ Done! Saved ${judges.length} active federal judges to src/data/judges.json`);

  // Stats
  const states = new Set(judges.map(j => j.state));
  const courts = new Set(judges.map(j => j.court));
  const withParty = judges.filter(j => j.party).length;
  const withAba = judges.filter(j => j.abaRating).length;
  const withEdu = judges.filter(j => j.education).length;
  const withAppointer = judges.filter(j => j.appointedBy).length;

  console.log(`\n📊 Data quality:`);
  console.log(`  States: ${states.size}`);
  console.log(`  Courts: ${courts.size}`);
  console.log(`  With party: ${withParty}/${judges.length} (${Math.round(withParty/judges.length*100)}%)`);
  console.log(`  With ABA rating: ${withAba}/${judges.length} (${Math.round(withAba/judges.length*100)}%)`);
  console.log(`  With education: ${withEdu}/${judges.length} (${Math.round(withEdu/judges.length*100)}%)`);
  console.log(`  With appointer: ${withAppointer}/${judges.length} (${Math.round(withAppointer/judges.length*100)}%)`);
}

main().catch(console.error);
