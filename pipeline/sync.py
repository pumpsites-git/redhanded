#!/usr/bin/env python3
"""
RedHanded DB Sync Script
Reads from data/master/*.json and upserts into Supabase.

Usage:
    python pipeline/sync.py [--table state_judges|county_profiles|federal_judges|all]

Requires:
    pip install supabase python-dotenv
"""

import json
import os
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv

# Load .env.local from project root
root_dir = Path(__file__).parent.parent
load_dotenv(root_dir / '.env.local')

try:
    from supabase import create_client, Client
except ImportError:
    print("ERROR: supabase-py not installed. Run: pip install supabase python-dotenv")
    sys.exit(1)

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
MASTER_DIR = root_dir / 'data' / 'master'
BATCH_SIZE = 200


def chunked(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]


def sync_state_judges():
    print("\n=== Syncing state_judges ===")
    path = MASTER_DIR / 'state-judges.json'
    if not path.exists():
        print(f"  SKIP: {path} not found")
        return 0

    with open(path) as f:
        data = json.load(f)

    raw_judges = data.get('judges', {})
    if isinstance(raw_judges, dict):
        judges_list = list(raw_judges.values())
    else:
        judges_list = raw_judges

    print(f"  Found {len(judges_list)} state judges")

    rows = []
    for j in judges_list:
        rows.append({
            'slug': j['slug'],
            'name': j['name'],
            'state': j['state'],
            'state_code': j['stateCode'],
            'county': j['county'],
            'court_facility': j.get('courtFacility') or None,
            'total_cases': j.get('totalCases', 0),
            'prison_rate': j.get('prisonRate', 0),
            'jail_rate': j.get('jailRate', 0),
            'probation_rate': j.get('probationRate', 0),
            'other_rate': j.get('otherRate', 0),
            'prison_count': j.get('prisonCount', 0),
            'jail_count': j.get('jailCount', 0),
            'probation_count': j.get('probationCount', 0),
            'other_count': j.get('otherCount', 0),
            'avg_commitment_days': j.get('avgCommitmentDays'),
            'leniency_score': j.get('leniencyScore', 0),
            'violent_cases': j.get('violentCases', {}),
            'sentence_types': j.get('sentenceTypes', {}),
            'offense_breakdown': j.get('offenseBreakdown', {}),
            'race_breakdown': j.get('raceBreakdown', {}),
            'gender_breakdown': j.get('genderBreakdown', {}),
        })

    synced = 0
    for batch in chunked(rows, BATCH_SIZE):
        result = supabase.table('state_judges').upsert(
            batch,
            on_conflict='slug'
        ).execute()
        synced += len(batch)
        print(f"  Upserted {synced}/{len(rows)}")

    print(f"  ✓ Synced {synced} state judges")
    return synced


def sync_county_profiles():
    print("\n=== Syncing county_profiles ===")
    path = MASTER_DIR / 'county-profiles.json'
    if not path.exists():
        print(f"  SKIP: {path} not found")
        return 0

    with open(path) as f:
        data = json.load(f)

    raw_counties = data.get('counties', {})
    if isinstance(raw_counties, dict):
        counties_list = list(raw_counties.values())
    else:
        counties_list = raw_counties

    print(f"  Found {len(counties_list)} county profiles")

    rows = []
    for c in counties_list:
        rows.append({
            'slug': c['slug'],
            'name': c['name'],
            'state': c['state'],
            'state_name': c.get('stateName', c['state']),
            'judicial_circuit': c.get('judicialCircuit'),
            'total_cases': c.get('totalCases', 0),
            'felony_cases': c.get('felonyCases', 0),
            'misdemeanor_cases': c.get('misdemeanorCases', 0),
            'felony_ratio': c.get('felonyRatio', 0),
            'prison_rate': c.get('prisonRate', 0),
            'jail_rate': c.get('jailRate', 0),
            'probation_rate': c.get('probationRate', 0),
            'comm_ctrl_rate': c.get('commCtrlRate', 0),
            'no_confinement_rate': c.get('noConfinementRate', 0),
            'withheld_adjudication_rate': c.get('withheldAdjudicationRate', 0),
            'avg_felony_sentence_days': c.get('avgFelonySentenceDays'),
            'avg_misd_sentence_days': c.get('avgMisdSentenceDays'),
            'leniency_score': c.get('leniencyScore', 0),
            'leniency_rank': c.get('leniencyRank'),
            'violent_cases': c.get('violentCases', {}),
            'race_breakdown': c.get('raceBreakdown', {}),
        })

    synced = 0
    for batch in chunked(rows, BATCH_SIZE):
        result = supabase.table('county_profiles').upsert(
            batch,
            on_conflict='slug'
        ).execute()
        synced += len(batch)
        print(f"  Upserted {synced}/{len(rows)}")

    print(f"  ✓ Synced {synced} county profiles")
    return synced


def sync_federal_judges():
    print("\n=== Syncing federal_judges ===")
    path = MASTER_DIR / 'federal-judges.json'
    if not path.exists():
        print(f"  SKIP: {path} not found")
        return 0

    with open(path) as f:
        data = json.load(f)

    judges_list = data.get('judges', [])
    print(f"  Found {len(judges_list)} federal judges")

    rows = []
    for j in judges_list:
        cl_id = str(j.get('clId', j.get('id', '')))
        if not cl_id:
            continue
        rows.append({
            'cl_id': cl_id,
            'slug': j.get('slug', cl_id),
            'name': j['name'],
            'gender': j.get('gender'),
            'race': j.get('race', []),
            'court': j.get('court', ''),
            'court_full': j.get('courtFull'),
            'court_id': j.get('courtId'),
            'court_type': j.get('courtType'),
            'jurisdiction': j.get('jurisdiction'),
            'state': j.get('state'),
            'status': j.get('status'),
            'is_active': bool(j.get('isActive', False)),
            'appointed_by': j.get('appointedBy'),
            'party': j.get('party'),
            'year_started': j.get('yearStarted'),
            'years_serving': j.get('yearsServing', 0),
            'education': j.get('education'),
            'aba_rating': j.get('abaRating'),
            'confirmation_votes_yes': j.get('confirmationVotesYes'),
            'confirmation_votes_no': j.get('confirmationVotesNo'),
            'has_photo': bool(j.get('hasPhoto', False)),
            'photo_url': j.get('photoUrl'),
            'accountability_score': j.get('accountabilityScore'),
            'positions': j.get('positions', []),
        })

    synced = 0
    for batch in chunked(rows, BATCH_SIZE):
        result = supabase.table('federal_judges').upsert(
            batch,
            on_conflict='cl_id'
        ).execute()
        synced += len(batch)
        print(f"  Upserted {synced}/{len(rows)}")

    print(f"  ✓ Synced {synced} federal judges")
    return synced


def main():
    parser = argparse.ArgumentParser(description='Sync RedHanded data to Supabase')
    parser.add_argument(
        '--table',
        choices=['state_judges', 'county_profiles', 'federal_judges', 'all'],
        default='all',
        help='Which table to sync (default: all)',
    )
    args = parser.parse_args()

    print(f"RedHanded DB Sync — {SUPABASE_URL}")

    totals = {}
    if args.table in ('state_judges', 'all'):
        totals['state_judges'] = sync_state_judges()
    if args.table in ('county_profiles', 'all'):
        totals['county_profiles'] = sync_county_profiles()
    if args.table in ('federal_judges', 'all'):
        totals['federal_judges'] = sync_federal_judges()

    print("\n=== Sync Complete ===")
    for table, count in totals.items():
        print(f"  {table}: {count} rows synced")


if __name__ == '__main__':
    main()
