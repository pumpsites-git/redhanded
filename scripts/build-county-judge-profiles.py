#!/usr/bin/env python3
"""
Build judge profile JSONs from Civitek case data for FL counties.
Matches the JudgeProfilesData interface in state-judges.ts.
"""
import json
import math
import re
import sys
from collections import defaultdict
from datetime import datetime

# Violent offense keywords
VIOLENT_KEYWORDS = [
    'murder', 'homicide', 'manslaughter', 'assault', 'battery', 'robbery',
    'carjacking', 'kidnap', 'sex offens', 'sexual', 'rape', 'abuse',
    'weapon', 'firearm', 'armed', 'aggravated', 'domestic violence',
    'stalking', 'threat', 'strangulation', 'resist officer',
    'fleeing', 'burglary', 'arson', 'child abuse', 'dui manslaughter',
]

# Sentenced dispositions (case resolved with a conviction)
SENTENCED_DISPOSITIONS = {
    'adjudicated guilty', 'adjudication withheld', 'guilty',
    'adj w/h judge', 'adj w/h proof', 'adj w/h 322.34',
}

def slug(name):
    s = name.lower().strip()
    # "LAST, FIRST MIDDLE" -> "last-first"
    parts = [p.strip() for p in s.split(',')]
    if len(parts) >= 2:
        last = parts[0]
        first = parts[1].split()[0] if parts[1].strip() else ''
        s = f"{last}-{first}" if first else last
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s

def proper_name(raw):
    """LAST, FIRST MIDDLE -> First Middle Last (Jr/Sr handled)"""
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

def is_violent(description):
    desc = description.lower()
    return any(kw in desc for kw in VIOLENT_KEYWORDS)

def categorize_offense(description):
    desc = description.lower()
    categories = {
        'Drug Offenses': ['possess', 'drug', 'cocaine', 'cannabis', 'marijuana', 'heroin', 'methamphetamine', 'fentanyl', 'controlled substance', 'paraphernalia'],
        'Violent Crimes': ['murder', 'homicide', 'manslaughter', 'assault', 'battery', 'robbery', 'aggravated'],
        'Property Crimes': ['theft', 'burglary', 'larceny', 'shoplifting', 'stolen', 'fraud', 'forgery', 'uttering'],
        'Sex Offenses': ['sex offens', 'sexual', 'rape', 'lewd', 'indecent', 'molestation'],
        'DUI/Traffic': ['dui', 'driving under', 'dwi', 'reckless driving', 'no valid license', 'suspended license'],
        'Weapons': ['weapon', 'firearm', 'gun', 'armed', 'concealed weapon'],
        'Domestic Violence': ['domestic', 'stalking', 'injunction'],
        'Probation/Parole': ['probation', 'parole', 'vop', 'violation of'],
    }
    for cat, keywords in categories.items():
        if any(kw in desc for kw in keywords):
            return cat
    return 'Other'

def determine_sentence_type(disposition, court_type):
    """Infer sentence type from disposition and court type."""
    disp = disposition.lower()
    ct = court_type.lower()
    
    if disp in SENTENCED_DISPOSITIONS:
        if 'felony' in ct:
            return 'prison'  # Felony convictions -> prison
        elif 'misdemeanor' in ct:
            return 'probation'  # Misdemeanors -> probation
        elif 'traffic' in ct:
            return 'other'  # Traffic -> other
        else:
            return 'probation'
    return None  # Not sentenced

def build_profiles(county_file, county_name, county_slug):
    with open(county_file) as f:
        data = json.load(f)
    
    cases = data['cases']
    
    # Accumulate per-judge stats
    judges = defaultdict(lambda: {
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
        
        # Normalize court type for counting
        ct_norm = court_type.strip().title()
        if 'felony' in ct_norm.lower():
            ct_norm = 'Criminal Felony'
        elif 'misdemeanor' in ct_norm.lower():
            ct_norm = 'Misdemeanor'
        elif 'traffic' in ct_norm.lower():
            ct_norm = 'Criminal Traffic'
        j['court_types'][ct_norm] += 1
        
        # Process charges
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
                    case_sentence = sentence  # Most severe wins
            
            # Track offense category
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
    
    # Build output
    total_cases = 0
    total_prison = 0
    total_probation = 0
    total_jail = 0
    total_other = 0
    total_violent = 0
    total_violent_prison = 0
    total_violent_probation = 0
    
    judge_profiles = {}
    leniency_scores = []
    violent_prison_rates = []
    
    for judge_name, j in judges.items():
        if j['total'] < 5:  # Skip judges with very few cases
            continue
        
        total = j['total']
        sentenced = j['sentenced']
        
        prison_rate = j['prison'] / total if total else 0
        jail_rate = j['jail'] / total if total else 0
        probation_rate = j['probation'] / total if total else 0
        other_rate = 1 - prison_rate - jail_rate - probation_rate
        if other_rate < 0:
            other_rate = 0
        
        violent_prison_rate = j['violent_prison'] / j['violent_total'] if j['violent_total'] else 0
        violent_prob_rate = j['violent_probation'] / j['violent_total'] if j['violent_total'] else 0
        violent_jail_rate = j['violent_jail'] / j['violent_total'] if j['violent_total'] else 0
        
        # Leniency score: higher = more lenient
        # Based on: low prison rate, low violent prison rate, high probation rate
        leniency = round(
            (1 - prison_rate) * 40 +
            (1 - violent_prison_rate) * 40 +
            probation_rate * 20
        )
        leniency = max(0, min(100, leniency))
        
        s = slug(judge_name)
        
        # Build offense breakdown
        offense_breakdown = {}
        for cat, stats in j['offenses'].items():
            if stats['total'] > 0:
                offense_breakdown[cat] = {
                    'total': stats['total'],
                    'prison': stats['prison'],
                    'probation': stats['probation'],
                    'jail': stats['jail'],
                    'prisonRate': round(stats['prison'] / stats['total'], 4) if stats['total'] else 0,
                    'probationRate': round(stats['probation'] / stats['total'], 4) if stats['total'] else 0,
                }
        
        profile = {
            'name': proper_name(judge_name),
            'slug': s,
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
        total_other += j['other']
        total_violent += j['violent_total']
        total_violent_prison += j['violent_prison']
        total_violent_probation += j['violent_probation']
    
    avg_prison_rate = total_prison / total_cases if total_cases else 0
    avg_probation_rate = total_probation / total_cases if total_cases else 0
    avg_jail_rate = total_jail / total_cases if total_cases else 0
    avg_other_rate = 1 - avg_prison_rate - avg_probation_rate - avg_jail_rate
    if avg_other_rate < 0:
        avg_other_rate = 0
    
    avg_violent_prison_rate = total_violent_prison / total_violent if total_violent else 0
    avg_violent_prob_rate = total_violent_probation / total_violent if total_violent else 0
    
    output = {
        'generated': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
        'source': f'Civitek Clerk Case Data — {county_name}, FL',
        'totalJudges': len(judge_profiles),
        'totalCases': total_cases,
        'courtAverage': {
            'prisonRate': round(avg_prison_rate, 4),
            'jailRate': round(avg_jail_rate, 4),
            'probationRate': round(avg_probation_rate, 4),
            'otherRate': round(avg_other_rate, 4),
            'violentCases': {
                'total': total_violent,
                'prisonRate': round(avg_violent_prison_rate, 4),
                'probationRate': round(avg_violent_prob_rate, 4),
                'jailRate': 0,
                'prisonCount': total_violent_prison,
                'probationCount': total_violent_probation,
            },
            'avgCommitmentDays': None,
        },
        'summary': {
            'judgesLowViolentPrisonRate': sum(1 for r in violent_prison_rates if r < 0.3),
            'minViolentPrisonRate': round(min(violent_prison_rates), 4) if violent_prison_rates else 0,
            'maxViolentPrisonRate': round(max(violent_prison_rates), 4) if violent_prison_rates else 0,
            'avgLeniencyScore': round(sum(leniency_scores) / len(leniency_scores), 1) if leniency_scores else 0,
        },
        'judges': judge_profiles,
    }
    
    return output

if __name__ == '__main__':
    base = '/root/.openclaw/workspace/redhanded/data/state-courts/florida'
    
    counties = [
        ('judges/bay-cases.json', 'Bay County', 'bay'),
        ('judges/indian-river-cases.json', 'Indian River County', 'indian-river'),
        ('judges/st-johns-cases.json', 'St. Johns County', 'st-johns'),
    ]
    
    for case_file, county_name, county_slug in counties:
        full_path = f'{base}/{case_file}'
        output = build_profiles(full_path, county_name, county_slug)
        out_path = f'{base}/{county_slug}-judge-profiles.json'
        with open(out_path, 'w') as f:
            json.dump(output, f, indent=2)
        print(f'✓ {county_name}: {output["totalJudges"]} judges, {output["totalCases"]} cases -> {out_path}')
