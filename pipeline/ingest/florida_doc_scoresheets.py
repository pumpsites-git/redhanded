#!/usr/bin/env python3
"""
Florida DOC Sentencing Scoresheet ingest module.
Processes 128K+ scoresheet records → FL judge profiles.
Source: data/unified_sentencing_2024.csv
"""

import re
from collections import defaultdict
from pathlib import Path

import pandas as pd


# ── Classification Keywords ───────────────────────────────────────────────────

VIOLENT_KEYWORDS = [
    'murder', 'homicide', 'manslaughter', 'assault', 'battery', 'robbery',
    'carjacking', 'kidnap', 'sex offens', 'sexual', 'rape', 'abuse',
    'weapon', 'firearm', 'armed', 'aggravated', 'domestic violence',
    'stalking', 'threat', 'strangulation', 'resist officer',
    'fleeing', 'arson', 'child abuse', 'dui manslaughter', 'lewd',
    'forcible', 'trafficking human', 'extortion', 'false imprison',
    'shoot', 'shot', 'gun', 'explosive', 'bomb',
]

OFFENSE_CATEGORIES = {
    'Drug Offenses': [
        'possess', 'drug', 'cocaine', 'cannabis', 'marijuana', 'heroin',
        'methamphetamine', 'fentanyl', 'controlled substance', 'paraphernalia',
        'trafficking narc', 'sale', 'purchase', 'deliver',
    ],
    'Violent Crimes': [
        'murder', 'homicide', 'manslaughter', 'assault', 'battery',
        'robbery', 'aggravated', 'kidnap', 'extortion', 'false imprison',
        'shoot', 'arson', 'strangulation', 'domestic violence', 'stalking',
    ],
    'Property Crimes': [
        'theft', 'burglary', 'larceny', 'shoplifting', 'stolen', 'fraud',
        'forgery', 'uttering', 'trespass', 'vandal', 'mischief',
        'worthless check', 'false statement', 'scheming to defraud',
    ],
    'Sex Offenses': [
        'sex offens', 'sexual', 'rape', 'lewd', 'indecent', 'molestation',
        'exploitation', 'obscene', 'solicit', 'prostitut', 'lascivious',
    ],
    'DUI/Traffic': [
        'dui', 'driving under', 'dwi', 'reckless driving', 'no valid license',
        'suspended license', 'fleeing', 'flee', 'flee leo', 'traffic',
        'racing', 'bui', 'boating under',
    ],
    'Weapons': [
        'weapon', 'firearm', 'gun', 'armed', 'concealed weapon',
        'carry concealed', 'possess firearm', 'explosive', 'bomb',
    ],
    'Domestic Violence': ['domestic', 'stalking', 'injunction', 'violation injunction'],
    'Probation/Parole': ['probation', 'parole', 'vop', 'violation of prob', 'community control'],
    'White Collar': [
        'fraud', 'embezzle', 'money launder', 'identity theft', 'forgery',
        'false statement', 'bribery', 'extort', 'schemes to defraud',
    ],
}


# ── Name Normalization ────────────────────────────────────────────────────────

SUFFIXES = {'JR', 'SR', 'II', 'III', 'IV', 'ESQ', 'JR.', 'SR.'}
NAME_REPLACEMENTS = {
    # Common abbreviations / typos seen in this dataset
    'WHITTINGTON': 'WHITTINGTON',
}


def _is_last_first(name: str) -> bool:
    """Detect LAST, FIRST format."""
    return ',' in name and not name.startswith(',')


def _title_word(w: str) -> str:
    """Title-case a single word, handling Mc/Mac prefixes."""
    if not w:
        return w
    if w.upper() in SUFFIXES:
        return w.title()
    if w.lower().startswith('mc') and len(w) > 2:
        return 'Mc' + w[2:].title()
    if w.lower().startswith('mac') and len(w) > 3:
        return 'Mac' + w[3:].title()
    return w.title()


def proper_name(raw: str) -> str:
    """
    Normalize a raw judge name to 'First [Middle] Last [Suffix]' format.
    Handles:
      - 'LAST, FIRST MIDDLE'
      - 'FIRST LAST'
      - 'kallaher' (single lowercase last name)
      - 'T.K. DEES' (initials)
      - 'CLARK, JR. BRANTLEY S.' (suffix before first)
    """
    if not raw or not raw.strip():
        return raw

    name = raw.strip()

    if _is_last_first(name):
        parts = name.split(',', 1)
        last_part = parts[0].strip()
        rest = parts[1].strip()

        # Handle cases like "CLARK, JR. BRANTLEY S."
        rest_words = rest.split()
        suffix_words = []
        first_words = []
        for w in rest_words:
            if w.upper().rstrip('.') in SUFFIXES or w.upper() in SUFFIXES:
                suffix_words.append(w.title())
            else:
                first_words.append(w)

        last_words = last_part.split()
        last_formatted = ' '.join(_title_word(w) for w in last_words)
        first_formatted = ' '.join(_title_word(w) for w in first_words)

        parts_out = []
        if first_formatted:
            parts_out.append(first_formatted)
        parts_out.append(last_formatted)
        if suffix_words:
            parts_out.extend(suffix_words)
        return ' '.join(parts_out)
    else:
        # FIRST LAST or just LAST or initials
        words = name.split()
        if not words:
            return name
        return ' '.join(_title_word(w) for w in words)


def normalize_key(raw: str) -> str:
    """
    Create a canonical key for deduplication.
    Strips punctuation, lowercases, attempts to get 'last first' ordering.
    """
    if not raw or not raw.strip():
        return ''

    name = raw.strip().lower()

    # Remove periods from initials: T.K. → tk
    name = re.sub(r'\.', '', name)

    if ',' in name:
        parts = name.split(',', 1)
        last = re.sub(r'[^a-z0-9 ]', '', parts[0]).strip()
        rest = re.sub(r'[^a-z0-9 ]', '', parts[1]).strip()
        # Remove suffix words
        rest_words = [w for w in rest.split() if w not in {'jr', 'sr', 'ii', 'iii', 'iv'}]
        first = rest_words[0] if rest_words else ''
        return f"{last}_{first}"
    else:
        words = name.split()
        if not words:
            return ''
        # Remove suffix words
        words = [w for w in words if re.sub(r'[^a-z]', '', w) not in {'jr', 'sr', 'ii', 'iii', 'iv'}]
        # Remove non-alpha
        words = [re.sub(r'[^a-z0-9]', '', w) for w in words if re.sub(r'[^a-z0-9]', '', w)]
        if not words:
            return ''
        # If 2+ words: assume last=last word, first=first word
        if len(words) >= 2:
            return f"{words[-1]}_{words[0]}"
        return words[0]


def make_slug(name: str, county: str) -> str:
    """Generate URL-safe slug: first-last-county."""
    s = name.lower().strip()
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    c = county.lower().strip()
    c = re.sub(r'[^a-z0-9]+', '-', c).strip('-')
    return f"{s}-fl"


def safe_rate(count: int, total: int) -> float:
    if total == 0:
        return 0.0
    return round(count / total, 4)


def is_violent(description: str) -> bool:
    if not description:
        return False
    desc = str(description).lower()
    return any(kw in desc for kw in VIOLENT_KEYWORDS)


def categorize_offense(description: str) -> str:
    if not description:
        return 'Other'
    desc = str(description).lower()
    for cat, keywords in OFFENSE_CATEGORIES.items():
        if any(kw in desc for kw in keywords):
            return cat
    return 'Other'


def compute_commitment_days(row: pd.Series) -> float:
    """Convert Prison_Years/Months/Days to total days (for prison sentences only)."""
    try:
        years = float(row.get('Prison_Years') or 0)
        months = float(row.get('Prison_Months') or 0)
        days = float(row.get('Prison_Days') or 0)
        # Sanity cap: max 200 years
        years = min(years, 200)
        total = years * 365.25 + months * 30.44 + days
        return max(0.0, total)
    except (TypeError, ValueError):
        return 0.0


def bool_col(val) -> bool:
    """Convert 1.0/0.0/'True'/'False' to bool."""
    if isinstance(val, float):
        return val == 1.0
    if isinstance(val, int):
        return val == 1
    if isinstance(val, str):
        return val.strip().lower() in ('true', '1', 'yes')
    return False


# ── Core Processing ───────────────────────────────────────────────────────────

def build_judge_profiles(df: pd.DataFrame, min_cases: int = 10) -> dict[str, dict]:
    """
    Group by normalized judge key, build profiles.
    Returns {slug: profile_dict}.
    """

    # Pre-compute per-row values
    df = df.copy()
    df['_is_prison'] = df['Is_State_Prison'].apply(bool_col)
    df['_is_jail'] = df['Is_County_Jail'].apply(bool_col)
    df['_is_probation'] = df['Is_Probation'].apply(bool_col)
    df['_is_plea'] = df['Is_Plea_Bargain'].apply(bool_col)
    df['_is_mitigated'] = df['Is_Mitigated_Departure'].apply(bool_col)
    df['_is_violent'] = df['Primary_Charge_Description'].apply(is_violent)
    df['_offense_cat'] = df['Primary_Charge_Description'].apply(categorize_offense)
    df['_commitment_days'] = df.apply(compute_commitment_days, axis=1)

    # Sentinel: cap extreme points
    df['_points'] = df['Total_Sentence_Points'].clip(upper=999999)

    # Build normalization map: raw name → canonical key
    raw_names = df['Sentencing_Judge'].fillna('').astype(str)
    df['_norm_key'] = raw_names.apply(normalize_key)

    # For each norm_key, pick the "best" display name (most common raw name, prefer comma format)
    key_to_best_raw: dict[str, str] = {}
    for key, group in df.groupby('_norm_key'):
        if not key:
            continue
        counts = group['Sentencing_Judge'].value_counts()
        # Prefer comma-format names (LAST, FIRST)
        comma_names = [n for n in counts.index if ',' in str(n)]
        if comma_names:
            key_to_best_raw[key] = comma_names[0]
        else:
            key_to_best_raw[key] = counts.index[0]

    # Build profiles grouped by (norm_key, county)
    judge_data: dict[tuple, dict] = defaultdict(lambda: {
        'raw_name': '',
        'county': '',
        'total': 0,
        'prison': 0,
        'jail': 0,
        'probation': 0,
        'other': 0,
        'violent_total': 0,
        'violent_prison': 0,
        'violent_jail': 0,
        'violent_probation': 0,
        'plea_count': 0,
        'mitigated_count': 0,
        'commitment_days_sum': 0.0,
        'commitment_days_count': 0,
        'points_sum': 0.0,
        'points_count': 0,
        'offenses': defaultdict(lambda: {'total': 0, 'prison': 0, 'probation': 0, 'jail': 0}),
        'race': defaultdict(lambda: {'total': 0, 'prison': 0, 'probation': 0}),
        'gender': defaultdict(lambda: {'total': 0, 'prison': 0, 'probation': 0}),
        'sentence_types': defaultdict(int),
    })

    for _, row in df.iterrows():
        key = row['_norm_key']
        if not key:
            continue
        raw_county = str(row.get('County', '') or '').strip()
        # Skip blank/junk county values
        if not raw_county or not raw_county.replace('-', '').replace('.', '').replace(' ', '').isalpha():
            continue
        county = raw_county.title()
        group_key = (key, county)

        j = judge_data[group_key]
        if not j['raw_name']:
            j['raw_name'] = key_to_best_raw.get(key, str(row['Sentencing_Judge']))
        if not j['county']:
            j['county'] = county

        j['total'] += 1

        is_prison = row['_is_prison']
        is_jail = row['_is_jail']
        is_probation = row['_is_probation']

        if is_prison:
            j['prison'] += 1
            j['sentence_types']['State Prison'] += 1
        elif is_jail:
            j['jail'] += 1
            j['sentence_types']['County Jail'] += 1
        elif is_probation:
            j['probation'] += 1
            j['sentence_types']['Probation'] += 1
        else:
            j['other'] += 1
            j['sentence_types']['Other'] += 1

        if row['_is_plea']:
            j['plea_count'] += 1
        if row['_is_mitigated']:
            j['mitigated_count'] += 1

        # Commitment days (only for prison)
        if is_prison and row['_commitment_days'] > 0:
            j['commitment_days_sum'] += row['_commitment_days']
            j['commitment_days_count'] += 1

        # Points
        pts = row['_points']
        if pd.notna(pts) and pts > 0:
            j['points_sum'] += pts
            j['points_count'] += 1

        # Violent
        if row['_is_violent']:
            j['violent_total'] += 1
            if is_prison:
                j['violent_prison'] += 1
            elif is_jail:
                j['violent_jail'] += 1
            elif is_probation:
                j['violent_probation'] += 1

        # Offense breakdown
        cat = row['_offense_cat']
        j['offenses'][cat]['total'] += 1
        if is_prison:
            j['offenses'][cat]['prison'] += 1
        elif is_probation:
            j['offenses'][cat]['probation'] += 1
        elif is_jail:
            j['offenses'][cat]['jail'] += 1

        # Race breakdown
        race = str(row.get('Race', '') or '').strip()
        if race:
            j['race'][race]['total'] += 1
            if is_prison:
                j['race'][race]['prison'] += 1
            elif is_probation:
                j['race'][race]['probation'] += 1

        # Gender breakdown
        gender = str(row.get('Sex', '') or '').strip()
        if gender:
            j['gender'][gender]['total'] += 1
            if is_prison:
                j['gender'][gender]['prison'] += 1
            elif is_probation:
                j['gender'][gender]['probation'] += 1

    # Build output profiles
    profiles: dict[str, dict] = {}
    slug_counts: dict[str, int] = {}

    for (key, county), j in judge_data.items():
        if j['total'] < min_cases:
            continue

        raw_name = j['raw_name']
        display_name = proper_name(raw_name)
        total = j['total']

        prison_rate = safe_rate(j['prison'], total)
        jail_rate = safe_rate(j['jail'], total)
        probation_rate = safe_rate(j['probation'], total)
        other_rate = round(max(0.0, 1.0 - prison_rate - jail_rate - probation_rate), 4)

        vt = j['violent_total']
        violent_prison_rate = safe_rate(j['violent_prison'], vt)
        violent_jail_rate = safe_rate(j['violent_jail'], vt)
        violent_probation_rate = safe_rate(j['violent_probation'], vt)

        # Leniency: 40% non-prison + 40% non-violent-prison + 20% probation
        leniency = round(
            (1 - prison_rate) * 40 +
            (1 - violent_prison_rate) * 40 +
            probation_rate * 20
        )
        leniency = max(0, min(100, leniency))

        # Avg commitment days (prison only)
        avg_days = None
        if j['commitment_days_count'] > 0:
            avg_days = round(j['commitment_days_sum'] / j['commitment_days_count'], 1)

        # Avg sentence points
        avg_points = None
        if j['points_count'] > 0:
            avg_points = round(j['points_sum'] / j['points_count'], 2)

        # Rates for DOC-specific fields
        plea_rate = safe_rate(j['plea_count'], total)
        mitigated_rate = safe_rate(j['mitigated_count'], total)

        # Offense breakdown
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

        # Race breakdown
        race_breakdown: dict[str, dict] = {}
        for race, stats in j['race'].items():
            if stats['total'] > 0:
                race_breakdown[race] = {
                    'total': stats['total'],
                    'prison': stats['prison'],
                    'probation': stats['probation'],
                    'prisonRate': safe_rate(stats['prison'], stats['total']),
                    'probationRate': safe_rate(stats['probation'], stats['total']),
                }

        # Gender breakdown
        gender_breakdown: dict[str, dict] = {}
        for gender, stats in j['gender'].items():
            if stats['total'] > 0:
                gender_breakdown[gender] = {
                    'total': stats['total'],
                    'prison': stats['prison'],
                    'probation': stats['probation'],
                    'prisonRate': safe_rate(stats['prison'], stats['total']),
                    'probationRate': safe_rate(stats['probation'], stats['total']),
                }

        # Generate unique slug
        base_slug = make_slug(display_name, county)
        slug = base_slug
        if slug in slug_counts:
            slug_counts[slug] += 1
            slug = f"{base_slug}-{slug_counts[slug]}"
        else:
            slug_counts[slug] = 0

        profile = {
            'name': display_name,
            'slug': slug,
            'state': 'Florida',
            'stateCode': 'FL',
            'county': county,
            'totalCases': total,
            'prisonRate': prison_rate,
            'jailRate': jail_rate,
            'probationRate': probation_rate,
            'otherRate': other_rate,
            'prisonCount': j['prison'],
            'jailCount': j['jail'],
            'probationCount': j['probation'],
            'otherCount': j['other'],
            'avgCommitmentDays': avg_days,
            'courtFacility': f"{county} County, FL",
            'leniencyScore': leniency,
            'violentCases': {
                'total': vt,
                'prisonRate': violent_prison_rate,
                'probationRate': violent_probation_rate,
                'jailRate': violent_jail_rate,
                'prisonCount': j['violent_prison'],
                'probationCount': j['violent_probation'],
            },
            'sentenceTypes': dict(j['sentence_types']),
            'offenseBreakdown': offense_breakdown,
            'raceBreakdown': race_breakdown,
            'genderBreakdown': gender_breakdown,
            # DOC-specific fields (extras beyond base interface)
            'avgSentencePoints': avg_points,
            'pleaBargainRate': plea_rate,
            'mitigatedDepartureRate': mitigated_rate,
            'dataSource': 'FL DOC Sentencing Scoresheets 2024-2025',
        }

        profiles[slug] = profile

    return profiles


# ── County-Level Analysis ─────────────────────────────────────────────────────

def build_county_analysis(df: pd.DataFrame) -> dict[str, dict]:
    """Build county-level aggregates for county-profiles.json."""
    df = df.copy()
    df['_is_prison'] = df['Is_State_Prison'].apply(bool_col)
    df['_is_jail'] = df['Is_County_Jail'].apply(bool_col)
    df['_is_probation'] = df['Is_Probation'].apply(bool_col)
    df['_is_plea'] = df['Is_Plea_Bargain'].apply(bool_col)
    df['_is_mitigated'] = df['Is_Mitigated_Departure'].apply(bool_col)
    df['_commitment_days'] = df.apply(compute_commitment_days, axis=1)
    df['_points'] = df['Total_Sentence_Points'].clip(upper=999999)

    # State-level totals for comparison
    total_all = len(df)
    state_prison_rate = safe_rate(df['_is_prison'].sum(), total_all)
    state_jail_rate = safe_rate(df['_is_jail'].sum(), total_all)
    state_prob_rate = safe_rate(df['_is_probation'].sum(), total_all)
    state_plea_rate = safe_rate(df['_is_plea'].sum(), total_all)
    state_mitigated_rate = safe_rate(df['_is_mitigated'].sum(), total_all)

    prison_df = df[df['_is_prison'] & (df['_commitment_days'] > 0)]
    state_avg_days = round(prison_df['_commitment_days'].mean(), 1) if len(prison_df) > 0 else None
    state_avg_points = round(df[df['_points'] > 0]['_points'].mean(), 2) if df['_points'].gt(0).any() else None

    state_averages = {
        'prisonRate': state_prison_rate,
        'jailRate': state_jail_rate,
        'probationRate': state_prob_rate,
        'pleaBargainRate': state_plea_rate,
        'mitigatedDepartureRate': state_mitigated_rate,
        'avgCommitmentDays': state_avg_days,
        'avgSentencePoints': state_avg_points,
        'totalCases': total_all,
    }

    counties: dict[str, dict] = {}

    for county_raw, grp in df.groupby('County'):
        county = str(county_raw).strip().title()
        # Skip blank/junk county values
        if not county or not county.replace('-', '').replace('.', '').replace(' ', '').isalpha():
            continue
        # Skip very short county names (likely junk)
        if len(county.replace(' ', '')) < 2:
            continue
        total = len(grp)
        if total < 10:
            continue

        prison_count = grp['_is_prison'].sum()
        jail_count = grp['_is_jail'].sum()
        prob_count = grp['_is_probation'].sum()
        plea_count = grp['_is_plea'].sum()
        miti_count = grp['_is_mitigated'].sum()

        prison_rate = safe_rate(prison_count, total)
        jail_rate = safe_rate(jail_count, total)
        prob_rate = safe_rate(prob_count, total)

        prison_grp = grp[grp['_is_prison'] & (grp['_commitment_days'] > 0)]
        avg_days = round(prison_grp['_commitment_days'].mean(), 1) if len(prison_grp) > 0 else None
        pts_grp = grp[grp['_points'] > 0]
        avg_points = round(pts_grp['_points'].mean(), 2) if len(pts_grp) > 0 else None

        slug = re.sub(r'[^a-z0-9]+', '-', county.lower()).strip('-') + '-fl'

        # Leniency score for county: 40% non-prison + 40% + 20% probation
        # (no violent breakdown at county level, so use simpler formula)
        leniency = round((1 - prison_rate) * 60 + prob_rate * 40)
        leniency = max(0, min(100, leniency))

        counties[slug] = {
            'name': county,
            'slug': slug,
            'state': 'Florida',
            'stateCode': 'FL',
            'totalCases': int(total),
            'prisonCount': int(prison_count),
            'jailCount': int(jail_count),
            'probationCount': int(prob_count),
            'prisonRate': prison_rate,
            'jailRate': jail_rate,
            'probationRate': prob_rate,
            'otherRate': round(max(0.0, 1 - prison_rate - jail_rate - prob_rate), 4),
            'pleaBargainRate': safe_rate(plea_count, total),
            'mitigatedDepartureRate': safe_rate(miti_count, total),
            'avgCommitmentDays': avg_days,
            'avgSentencePoints': avg_points,
            'vsStatePrisonRate': round(prison_rate - state_prison_rate, 4),
            'vsStateProbRate': round(prob_rate - state_prob_rate, 4),
            'leniencyScore': float(leniency),
            'leniencyRank': 0,  # computed after all counties processed
            'judicialCircuit': None,
            'dataSource': 'FL DOC Sentencing Scoresheets 2024-2025',
        }

    # Assign leniency ranks
    sorted_by_leniency = sorted(counties.items(), key=lambda x: x[1].get('leniencyScore', 50), reverse=True)
    for rank, (slug, _) in enumerate(sorted_by_leniency, start=1):
        counties[slug]['leniencyRank'] = rank

    return {'counties': counties, 'stateAverage': state_averages}


# ── Entry Point ───────────────────────────────────────────────────────────────

def run(config: dict, project_root: Path) -> dict:
    """
    Process FL DOC scoresheet CSV → judge profiles.
    Returns dict compatible with florida_judges.run() output.
    """
    csv_path = project_root / config['sources']['florida_doc_scoresheets']['csv']

    if not csv_path.exists():
        print(f"  ✗ FL DOC CSV not found: {csv_path}")
        return {}

    print(f"  Loading {csv_path.name}...", end='', flush=True)
    df = pd.read_csv(csv_path, low_memory=False)
    print(f" {len(df):,} rows loaded")

    # Drop rows with no judge name
    df = df[df['Sentencing_Judge'].notna() & (df['Sentencing_Judge'].astype(str).str.strip() != '')]
    print(f"  → {len(df):,} rows with judge names")

    min_cases = config.get('thresholds', {}).get('min_cases_judge', 10)

    print(f"  Building judge profiles (min {min_cases} cases)...", end='', flush=True)
    profiles = build_judge_profiles(df, min_cases=min_cases)
    print(f" {len(profiles)} judge-county profiles")

    # County analysis
    print(f"  Building county analysis...", end='', flush=True)
    county_data = build_county_analysis(df)
    print(f" {len(county_data['counties'])} counties")

    total_cases = sum(p['totalCases'] for p in profiles.values())

    return {
        'judges': profiles,
        'total_judges': len(profiles),
        'total_cases': total_cases,
        'raw_count': len(df),
        'county_data': county_data,
        'source': 'FL DOC Sentencing Scoresheets 2024-2025',
    }
