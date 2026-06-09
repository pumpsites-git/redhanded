#!/usr/bin/env python3
"""
Florida Court Records Scraper — BenchmarkWeb/Tyler Technology portals
Uses common-name iteration for higher case coverage.

Usage: python3 scrape-benchmark-names.py [county_key] [--all] [--new-only]
"""

import requests, re, json, time, sys, os
from pathlib import Path
from twocaptcha import TwoCaptcha

API_KEY = os.environ.get('TWOCAPTCHA_API_KEY', '0e093189f388cec6262e066729a84346')
solver = TwoCaptcha(API_KEY)

OUT_DIR = Path(__file__).parent.parent / 'data' / 'state-courts' / 'florida' / 'judges'
OUT_DIR.mkdir(parents=True, exist_ok=True)

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36'

COUNTIES = {
    'bay': {
        'base': 'https://court.baycoclerk.com/BenchmarkWeb2',
        'pop': 185000, 'circuit': 14,
    },
    'indian-river': {
        'base': 'https://court.indian-river.org/BenchmarkWeb',
        'pop': 159000, 'circuit': 19,
    },
    'st-johns': {
        'base': 'https://apps.stjohnsclerk.com/Benchmark',
        'pop': 273000, 'circuit': 7,
    },
    'charlotte': {
        'base': 'https://courts.charlotteclerk.com/Benchmark',
        'pop': 186000, 'circuit': 20,
    },
    'flagler': {
        'base': 'https://cases.flaglerclerk.gov',
        'pop': 115000, 'circuit': 7,
    },
    'martin': {
        'base': 'https://court.martinclerk.com',
        'pop': 161000, 'circuit': 19,
        'captcha_type': 'image',
    },
}

# Top 50 most common US last names for broad coverage
COMMON_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
    'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
    'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
    'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
    'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
    'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
    'Carter', 'Roberts',
]

# Letters for single-letter search (some portals support this)
LETTERS = list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')


def solve_captcha(s, base, html, config):
    """Solve the CAPTCHA on the search page. Returns (token, captcha_answer)."""
    sitekey = re.findall(r'data-sitekey="([^"]+)"', html)
    hcaptcha_key = re.findall(r'data-sitekey="([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"', html)
    captcha_type = config.get('captcha_type', 'auto')

    if captcha_type == 'image' or (not hcaptcha_key and not sitekey and '/CaptchaImage' in html):
        import base64
        img_r = s.get(f'{base}/CourtCase.aspx/CaptchaImage', timeout=10)
        if img_r.status_code == 200:
            img_b64 = base64.b64encode(img_r.content).decode('ascii')
            result = solver.normal(img_b64)
            answer = result.get('code', '') if isinstance(result, dict) else str(result)
            return '', answer
        return '', ''
    elif hcaptcha_key:
        result = solver.hcaptcha(sitekey=hcaptcha_key[0], url=f'{base}/Home.aspx/Search')
        token = result.get('code', '') if isinstance(result, dict) else str(result)
        return token, ''
    elif sitekey:
        result = solver.recaptcha(sitekey=sitekey[0], url=f'{base}/Home.aspx/Search')
        token = result.get('code', '') if isinstance(result, dict) else str(result)
        return token, ''
    return '', ''


def do_search(s, base, csrf, token, captcha_answer, search_term):
    """Submit a search and return all case IDs with digests."""
    data = {
        '__RequestVerificationToken': csrf,
        'type': 'name', 'search': search_term,
        'courtTypes': '2',
        'caseTypes': '5,15,9',
        'openedFrom': '01/01/2020', 'openedTo': '12/31/2026',
        'closedFrom': '', 'closedTo': '',
        'partyTypes': '1,2,3,4,5',
        'divisions': '', 'statutes': '',
        'partyBirthYear': '', 'partyDOB': '',
        'captcha': captcha_answer, 'g-recaptcha-response': token, 'h-captcha-response': token,
    }
    r = s.post(f'{base}/CourtCase.aspx/CaseSearch', data=data, timeout=30, allow_redirects=True)

    cases = {}
    page = 0
    page_size = 500

    while True:
        dt = s.post(f'{base}/Search.aspx/CaseSearch', data={
            'draw': str(page + 1), 'start': str(page * page_size),
            'length': str(page_size), 'search[value]': '',
        }, headers={'X-Requested-With': 'XMLHttpRequest'}, timeout=15)

        try:
            jdata = dt.json()
        except:
            break

        total = jdata.get('recordsTotal', 0)
        rows = jdata.get('data', [])
        if not rows:
            break

        for row in rows:
            for m in re.finditer(r'Details/(\d+)\?digest=([^"&]+)', str(row)):
                cid, dig = m.group(1), m.group(2)
                if cid not in cases:
                    name_match = re.findall(r'title="View Party Details for ([^"]+)"', str(row))
                    case_num = re.findall(r'title="View Case Details for ([^"]+)"', str(row))
                    cases[cid] = {
                        'digest': dig,
                        'defendant': name_match[0] if name_match else '',
                        'case_number': case_num[0] if case_num else '',
                    }

        if (page + 1) * page_size >= total:
            break
        page += 1
        time.sleep(0.3)

    return cases, total


def fetch_case_details(s, base, all_cases):
    """Fetch judge and charge details for all cases."""
    results = []
    for i, (cid, info) in enumerate(all_cases.items()):
        try:
            tr = s.get(f'{base}/CourtCase.aspx/CaseThumbnail/{cid}?digest={info["digest"]}', timeout=10)
            text = re.sub(r'<[^>]+>', '\n', tr.text)

            judge = ''
            court_type = ''
            agency = ''
            status_date = ''

            for match in re.finditer(r'(Judge|Court Type|Agency|Status Date|SAO Case #):\s*\n\s*(.+)', text):
                field, value = match.group(1), match.group(2).strip()
                if field == 'Judge':
                    judge = value
                elif field == 'Court Type':
                    court_type = value
                elif field == 'Agency':
                    agency = value
                elif field == 'Status Date':
                    status_date = value

            charges = []
            charge_rows = re.findall(r'<tr[^>]*>\s*<td[^>]*>(\d+)</td>\s*<td[^>]*>(.*?)</td>\s*<td[^>]*>(.*?)</td>', tr.text, re.DOTALL)
            for count, desc, disp in charge_rows:
                charges.append({
                    'count': count.strip(),
                    'description': re.sub(r'<[^>]+>', '', desc).strip(),
                    'disposition': re.sub(r'<[^>]+>', '', disp).strip(),
                })

            if judge and judge != 'SAO Case #:':
                results.append({
                    'case_id': cid,
                    'case_number': info['case_number'],
                    'defendant': info['defendant'],
                    'judge': judge,
                    'court_type': court_type,
                    'agency': agency,
                    'status_date': status_date,
                    'charges': charges,
                })

            if (i + 1) % 50 == 0:
                print(f'  Fetched {i+1}/{len(all_cases)} case details, {len(results)} with judges')

        except Exception as e:
            print(f'  ERROR case {cid}: {e}')

        time.sleep(0.15)

    return results


def scrape_county(key, config):
    """Scrape all criminal cases from a BenchmarkWeb county using name iteration."""
    base = config['base']
    s = requests.Session()
    s.headers.update({'User-Agent': UA})

    print(f'\n{"="*60}')
    print(f'SCRAPING: {key.upper()} COUNTY')
    print(f'Base: {base}')
    print(f'{"="*60}')

    # Step 1: Load search page
    r = s.get(f'{base}/Home.aspx/Search', timeout=15)
    if r.status_code != 200:
        print(f'ERROR: Could not load search page ({r.status_code})')
        return None

    csrf_list = re.findall(r'name="__RequestVerificationToken"[^>]*value="([^"]*)"', r.text)
    if not csrf_list:
        print('ERROR: Missing CSRF token')
        return None
    csrf = csrf_list[0]

    # Step 2: Try wildcard first
    print('Solving CAPTCHA for wildcard search...')
    try:
        token, captcha_answer = solve_captcha(s, base, r.text, config)
        print('CAPTCHA solved ✅')
    except Exception as e:
        print(f'CAPTCHA FAILED: {e}')
        return None

    all_cases = {}
    wildcard_cases, wildcard_total = do_search(s, base, csrf, token, captcha_answer, '%')
    all_cases.update(wildcard_cases)
    print(f'Wildcard search: {wildcard_total} records, {len(wildcard_cases)} unique cases')

    # Step 3: If wildcard gave < 100 cases, iterate common names
    if len(all_cases) < 100:
        print(f'\nLow wildcard results ({len(all_cases)}). Searching by common names...')
        for i, name in enumerate(COMMON_NAMES):
            # Need fresh page + CAPTCHA for each search
            try:
                r = s.get(f'{base}/Home.aspx/Search', timeout=15)
                csrf_list = re.findall(r'name="__RequestVerificationToken"[^>]*value="([^"]*)"', r.text)
                if not csrf_list:
                    continue
                csrf = csrf_list[0]

                token, captcha_answer = solve_captcha(s, base, r.text, config)
                cases, total = do_search(s, base, csrf, token, captcha_answer, name)
                new = sum(1 for cid in cases if cid not in all_cases)
                all_cases.update(cases)
                print(f'  [{i+1}/{len(COMMON_NAMES)}] {name}: {total} records, {new} new cases (total: {len(all_cases)})')
            except Exception as e:
                print(f'  [{i+1}] {name}: ERROR - {e}')

            time.sleep(0.5)

    print(f'\nTotal unique cases found: {len(all_cases)}')

    # Step 4: Fetch case details
    print(f'\nFetching case details...')
    results = fetch_case_details(s, base, all_cases)

    # Add county to each result
    for r_item in results:
        r_item['county'] = key

    print(f'\n✅ {key.upper()}: {len(results)} cases with judge data')

    # Save results
    out_file = OUT_DIR / f'{key}-cases.json'
    with open(out_file, 'w') as f:
        json.dump({
            'county': key,
            'circuit': config.get('circuit'),
            'population': config.get('pop'),
            'total_searched': len(all_cases),
            'cases_with_judges': len(results),
            'scraped_at': time.strftime('%Y-%m-%d %H:%M:%S'),
            'cases': results,
        }, f, indent=2)
    print(f'Saved to {out_file}')

    # Print judge summary
    judge_counts = {}
    for case in results:
        j = case['judge']
        judge_counts[j] = judge_counts.get(j, 0) + 1

    print(f'\nJudges ({len(judge_counts)}):')
    for j, count in sorted(judge_counts.items(), key=lambda x: -x[1]):
        print(f'  {j}: {count} cases')

    return results


if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else None

    # New counties only
    new_counties = ['charlotte', 'flagler', 'martin']

    if target == '--all':
        for key, config in COUNTIES.items():
            scrape_county(key, config)
    elif target == '--new-only':
        for key in new_counties:
            scrape_county(key, COUNTIES[key])
    elif target and target in COUNTIES:
        scrape_county(target, COUNTIES[target])
    else:
        print(f'Usage: python3 {sys.argv[0]} [county|--all|--new-only]')
        print(f'Counties: {", ".join(COUNTIES.keys())}')
        print(f'New counties: {", ".join(new_counties)}')
