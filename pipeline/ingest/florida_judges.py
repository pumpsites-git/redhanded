#!/usr/bin/env python3
"""
Florida BenchmarkWeb judges ingest module.
Processes case JSONs from county court scrapers → FL judge profiles.
Ports logic from scripts/build-county-judge-profiles.py.
"""

import json
import re
from collections import defaultdict
from pathlib import Path


# ── Classification ────────────────────────────────────────────────────────────

VIOLENT_KEYWORDS = [
    'murder', 'homicide', 'manslaughter', 'assault', 'battery', 'robbery',
    'carjacking', 'kidnap', 'sex offens', 'sexual', 'rape', 'abuse',
    'weapon', 'firearm', 'armed', 'aggravated', 'domestic violence',
    'stalking', 'threat', 'strangulation', 'resist officer',
    'fleeing', 'burglary', 'arson', 'child abuse', 'dui manslaughter',
]

SENTENCED_DISPOSITIONS = {
    'adjudicated guilty', 'adjudication withheld', 'guilty',
    'adj w/h judge', 'adj w/h proof', 'adj w/h 322.34',
}

OFFENSE_CATEGORIES = {
    'Drug Offenses': ['possess', 'drug', 'cocaine', 'cannabis', 'marijuana', 'heroin',
                      'methamphetamine', 'fentanyl', 'controlled substance', 'paraphernalia'],
    'Violent Crimes': ['murder', 'homicide', 'manslaughter', 'assault', 'battery', 'robbery', 'aggravated'],
    'Property Crimes': ['theft', 'burglary', 'larceny', 'shoplifting', 'stolen', 'fraud', 'forgery', 'uttering'],
    'Sex Offenses': ['sex offens', 'sexual', 'rape', 'lewd', 'indecent', 'molestation'],
    'DUI/Traffic': ['dui', 'driving under', 'dwi', 'reckless driving', 'no valid license', 'suspended license'],
    'Weapons': ['weapon', 'firearm', 'gun', 'armed', 'concealed weapon'],
    'Domestic Violence': ['domestic', 'stalking', 'injunction'],
    'Probation/Parole': ['probation', 'parole', 'vop', 'violation of'],
}


def make_slug(name: str) -> str:
    s = name.lower().strip()
    parts = [p.strip() for p in s.split(',')]
    if len(parts) >= 2:
        last = parts[0]
        first = parts[1].split()[0] if parts[1].strip() else ''
        s = f"{last}-{first}" if first else last
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s


def proper_name(raw: str) -> str:
    """LAST, FIRST MIDDLE → First Middle Last (Jr/Sr handled)."""
    parts = [p.strip() for p in raw.split(',')]
    if len(parts) >= 2:
        last = parts[0].strip()
        rest = parts[1].strip()
        suffixes = {'JR', 'SR', 'II', 'III', 'IV'}
        rest_words = rest.split()
        suffix = ''
        first_parts = []
        for w in rest_words:
            if w.upper() in suffixes:
                suffix = w.title()
            else:
                first_parts.append(w.title())
        last = last.title()
        name = ' '.join(first_parts) + ' ' + last
        if suffix:
            name += ' ' + suffix
        return name.strip()
    return raw.title()


def is_violent(description: str) -> bool:
    desc = description.lower()
    return any(kw in desc for kw in VIOLENT_KEYWORDS)


def categorize_offense(description: str) -> str:
    desc = description.lower()
    for cat, keywords in OFFENSE_CATEGORIES.items():
        if any(kw in desc for kw in keywords):
            return cat
    return 'Other'


def determine_sentence_type(disposition: str, court_type: str) -> str | None:
    """Infer sentence type from disposition and court type."""
    disp = disposition.lower()
    ct = court_type.lower()
    if disp in SENTENCED_DISPOSITIONS:
        if 'felony' in ct:
            return 'prison'
        elif 'misdemeanor' in ct:
            return 'probation'
        elif 'traffic' in ct:
            return 'other'
        else:
            return 'probation'
    return None


def safe_rate(count: int, total: int) -> float:
    if total == 0:
        return 0.0
    return round(count / total, 4)


def build_profiles_for_county(county_file: Path, county_name: str, county_slug: str,
                               min_cases: int = 5) -> dict | None:
    """Build judge profiles for a single county's case file."""
    if not county_file.exists():
        print(f"    ⚠️  Missing case file: {county_file}")
        return None

    with open(county_file) as f:
        data = json.load(f)

    cases = data.get('cases', [])
    if not cases:
        print(f"    ⚠️  No cases in {county_file.name}")
        return None

    judges: dict[str, dict] = defaultdict(lambda: {
        'name': '',
        'total': 0,
        'sentenced': 0,
        'prison': 0,
        'jail': 0,
        'probation': 0,
        'other': 0,
        'violent_total': 0,
        'violent_prison': 0,
        'violent_probation': 0,
        'violent_jail': 0,
        'court_types': defaultdict(int),
        'offenses': defaultdict(lambda: {'total': 0, 'prison': 0, 'probation': 0, 'jail': 0}),
    })

    for case in cases:
        judge_name = case.get('judge', '').strip()
        if not judge_name or 'nojudge' in judge_name.lower():
            continue

        court_type = case.get('court_type', '')
        charges = case.get('charges', [])

        j = judges[judge_name]
        j['name'] = judge_name
        j['total'] += 1

        ct_norm = court_type.strip().title()
        if 'felony' in ct_norm.lower():
            ct_norm = 'Criminal Felony'
        elif 'misdemeanor' in ct_norm.lower():
            ct_norm = 'Misdemeanor'
        elif 'traffic' in ct_norm.lower():
            ct_norm = 'Criminal Traffic'
        j['court_types'][ct_norm] += 1

        case_sentenced = False
        case_violent = False
        case_sentence = None

        for charge in charges:
            desc = charge.get('description', '')
            disp = charge.get('disposition', '')

            if is_violent(desc):
                case_violent = True

            cat = categorize_offense(desc)
            sentence = determine_sentence_type(disp, court_type)

            if sentence:
                case_sentenced = True
                if case_sentence is None or sentence == 'prison':
                    case_sentence = sentence

            j['offenses'][cat]['total'] += 1
            if sentence == 'prison':
                j['offenses'][cat]['prison'] += 1
            elif sentence == 'probation':
                j['offenses'][cat]['probation'] += 1
            elif sentence == 'jail':
                j['offenses'][cat]['jail'] += 1

        if case_sentenced and case_sentence:
            j['sentenced'] += 1
            if case_sentence == 'prison':
                j['prison'] += 1
            elif case_sentence == 'jail':
                j['jail'] += 1
            elif case_sentence == 'probation':
                j['probation'] += 1
            else:
                j['other'] += 1
        elif not case_sentenced:
            j['other'] += 1

        if case_violent:
            j['violent_total'] += 1
            if case_sentence == 'prison':
                j['violent_prison'] += 1
            elif case_sentence == 'probation':
                j['violent_probation'] += 1
            elif case_sentence == 'jail':
                j['violent_jail'] += 1

    # Build output profiles
    total_cases = total_prison = total_probation = total_jail = 0
    total_violent = total_violent_prison = total_violent_probation = 0
    judge_profiles: dict[str, dict] = {}
    leniency_scores: list[float] = []
    violent_prison_rates: list[float] = []

    for judge_name, j in judges.items():
        if j['total'] < min_cases:
            continue

        total = j['total']
        prison_rate = j['prison'] / total if total else 0
        jail_rate = j['jail'] / total if total else 0
        probation_rate = j['probation'] / total if total else 0
        other_rate = max(0, 1 - prison_rate - jail_rate - probation_rate)

        violent_prison_rate = j['violent_prison'] / j['violent_total'] if j['violent_total'] else 0
        violent_prob_rate = j['violent_probation'] / j['violent_total'] if j['violent_total'] else 0
        violent_jail_rate = j['violent_jail'] / j['violent_total'] if j['violent_total'] else 0

        # Leniency: 40% non-prison + 40% non-violent-prison + 20% probation
        leniency = round(
            (1 - prison_rate) * 40 +
            (1 - violent_prison_rate) * 40 +
            probation_rate * 20
        )
        leniency = max(0, min(100, leniency))

        s = make_slug(judge_name)

        offense_breakdown: dict[str, dict] = {}
        for cat, stats in j['offenses'].items():
            if stats['total'] > 0:
                offense_breakdown[cat] = {
                    'total': stats['total'],
                    'prison': stats['prison'],
                    'probation': stats['probation'],
                    'jail': stats['jail'],
                    'prisonRate': safe_rate(stats['prison'], stats['total']),
                    'probationRate': safe_rate(stats['probation'], stats['total']),
                }

        profile = {
            'name': proper_name(judge_name),
            'slug': s,
            'state': 'Florida',
            'stateCode': 'FL',
            'county': county_name,
            'totalCases': total,
            'prisonRate': round(prison_rate, 4),
            'jailRate': round(jail_rate, 4),
            'probationRate': round(probation_rate, 4),
            'otherRate': round(other_rate, 4),
            'prisonCount': j['prison'],
            'jailCount': j['jail'],
            'probationCount': j['probation'],
            'otherCount': j['other'] + (total - j['sentenced'] - j['other']),
            'avgCommitmentDays': None,
            'courtFacility': f'{county_name}, FL',
            'leniencyScore': leniency,
            'violentCases': {
                'total': j['violent_total'],
                'prisonRate': round(violent_prison_rate, 4),
                'probationRate': round(violent_prob_rate, 4),
                'jailRate': round(violent_jail_rate, 4),
                'prisonCount': j['violent_prison'],
                'probationCount': j['violent_probation'],
            },
            'sentenceTypes': dict(j['court_types']),
            'offenseBreakdown': offense_breakdown,
            'raceBreakdown': {},
            'genderBreakdown': {},
        }

        judge_profiles[s] = profile
        leniency_scores.append(leniency)
        if j['violent_total'] > 0:
            violent_prison_rates.append(violent_prison_rate)

        total_cases += total
        total_prison += j['prison']
        total_probation += j['probation']
        total_jail += j['jail']
        total_violent += j['violent_total']
        total_violent_prison += j['violent_prison']
        total_violent_probation += j['violent_probation']

    if not judge_profiles:
        return None

    avg_prison_rate = total_prison / total_cases if total_cases else 0
    avg_probation_rate = total_probation / total_cases if total_cases else 0
    avg_jail_rate = total_jail / total_cases if total_cases else 0
    avg_other_rate = max(0, 1 - avg_prison_rate - avg_probation_rate - avg_jail_rate)
    avg_violent_prison_rate = total_violent_prison / total_violent if total_violent else 0
    avg_violent_prob_rate = total_violent_probation / total_violent if total_violent else 0

    return {
        "generated": None,
        "source": f"Civitek Clerk Case Data — {county_name}, FL",
        "totalJudges": len(judge_profiles),
        "totalCases": total_cases,
        "courtAverage": {
            "prisonRate": round(avg_prison_rate, 4),
            "jailRate": round(avg_jail_rate, 4),
            "probationRate": round(avg_probation_rate, 4),
            "otherRate": round(avg_other_rate, 4),
            "violentCases": {
                "total": total_violent,
                "prisonRate": round(avg_violent_prison_rate, 4),
                "probationRate": round(avg_violent_prob_rate, 4),
                "jailRate": 0,
                "prisonCount": total_violent_prison,
                "probationCount": total_violent_probation,
            },
            "avgCommitmentDays": None,
        },
        "summary": {
            "judgesLowViolentPrisonRate": sum(1 for r in violent_prison_rates if r < 0.3),
            "minViolentPrisonRate": round(min(violent_prison_rates), 4) if violent_prison_rates else 0,
            "maxViolentPrisonRate": round(max(violent_prison_rates), 4) if violent_prison_rates else 0,
            "avgLeniencyScore": round(sum(leniency_scores) / len(leniency_scores), 1) if leniency_scores else 0,
        },
        "judges": judge_profiles,
    }


def run(config: dict, project_root: Path) -> dict:
    """
    Process BenchmarkWeb case JSONs → FL judge profiles.
    Returns dict with all FL judges merged.
    """
    cases_dir = project_root / config["sources"]["florida_benchmark"]["cases_dir"]
    counties_cfg = config["sources"]["florida_benchmark"]["counties"]
    min_cases = config["thresholds"]["min_cases_fl_judge"]

    all_judges: dict[str, dict] = {}
    all_profiles = []
    total_cases = 0
    total_judges = 0

    for county_cfg in counties_cfg:
        county_file = cases_dir / county_cfg["file"]
        county_name = county_cfg["name"]
        county_slug = county_cfg["slug"]

        print(f"  Processing {county_name}...", end="", flush=True)
        profiles = build_profiles_for_county(county_file, county_name, county_slug, min_cases)

        if profiles is None:
            print(f" ⚠️  skipped (no data)")
            continue

        all_profiles.append(profiles)
        all_judges.update(profiles["judges"])
        total_cases += profiles["totalCases"]
        total_judges += profiles["totalJudges"]
        print(f" {profiles['totalJudges']} judges, {profiles['totalCases']} cases")

    print(f"  ✓ FL BenchmarkWeb: {total_judges} judges across {len(all_profiles)} counties, {total_cases:,} cases")

    return {
        "profiles_by_county": all_profiles,
        "judges": all_judges,
        "total_judges": total_judges,
        "total_cases": total_cases,
    }
