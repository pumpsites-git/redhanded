#!/usr/bin/env python3
"""
Florida Court Records Scraper — BenchmarkWeb/Tyler Technology portals
Scrapes criminal cases with judge names via pure HTTP + 2Captcha reCAPTCHA solving.

Usage: python3 scrape-benchmark-fl.py [county_key] [--all]
"""

import requests, re, json, time, sys, os
from pathlib import Path
from twocaptcha import TwoCaptcha

API_KEY = os.environ.get('TWOCAPTCHA_API_KEY', '0e093189f388cec6262e066729a84346')
solver = TwoCaptcha(API_KEY)

OUT_DIR = Path(__file__).parent.parent / 'data' / 'state-courts' / 'florida' / 'judges'
OUT_DIR.mkdir(parents=True, exist_ok=True)

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36'

# BenchmarkWeb/Tyler counties with reCAPTCHA/hCaptcha (confirmed working)
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
        'captcha_type': 'image',  # Uses image CAPTCHA, not reCAPTCHA/hCaptcha
    },
}


def scrape_county(key, config):
    """Scrape all criminal cases from a BenchmarkWeb county."""
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
    
    csrf = re.findall(r'name="__RequestVerificationToken"[^>]*value="([^"]*)"', r.text)
    sitekey = re.findall(r'data-sitekey="([^"]+)"', r.text)
    courts = re.findall(r'name="courtTypes"[^>]*value="([^"]*)"', r.text)
    cases = re.findall(r'name="caseTypes"[^>]*value="([^"]*)"', r.text)
    
    if not csrf:
        print('ERROR: Missing CSRF token')
        return None
    
    # Step 2: Solve CAPTCHA (auto-detect reCAPTCHA vs hCaptcha vs image)
    captcha_type = config.get('captcha_type', 'auto')
    hcaptcha_key = re.findall(r'data-sitekey="([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"', r.text)
    captcha_answer = ''
    
    if captcha_type == 'image' or (not hcaptcha_key and not sitekey and '/CaptchaImage' in r.text):
        # Image-based CAPTCHA — download and solve via 2Captcha normal method
        print(f'Solving image CAPTCHA...')
        try:
            import base64
            img_r = s.get(f'{base}/CourtCase.aspx/CaptchaImage', timeout=10)
            if img_r.status_code == 200:
                img_b64 = base64.b64encode(img_r.content).decode('ascii')
                result = solver.normal(img_b64)
                captcha_answer = result.get('code', '') if isinstance(result, dict) else str(result)
                print(f'Image CAPTCHA solved ✅: {captcha_answer}')
                token = ''
            else:
                print(f'Could not load CAPTCHA image ({img_r.status_code}), trying without')
                token = ''
        except Exception as e:
            print(f'Image CAPTCHA FAILED: {e}')
            return None
    elif hcaptcha_key:
        print(f'Solving hCaptcha...')
        try:
            result = solver.hcaptcha(sitekey=hcaptcha_key[0], url=f'{base}/Home.aspx/Search')
            token = result.get('code', '') if isinstance(result, dict) else str(result)
            print(f'hCaptcha solved ✅')
        except Exception as e:
            print(f'hCaptcha FAILED: {e}')
            return None
    elif sitekey:
        print(f'Solving reCAPTCHA...')
        try:
            result = solver.recaptcha(sitekey=sitekey[0], url=f'{base}/Home.aspx/Search')
            token = result.get('code', '') if isinstance(result, dict) else str(result)
            print(f'reCAPTCHA solved ✅')
        except Exception as e:
            print(f'reCAPTCHA FAILED: {e}')
            return None
    else:
        print('No CAPTCHA found, submitting without token')
        token = ''
    
    # Step 3: Submit search — CRIMINAL ONLY (felony + misdemeanor + criminal traffic)
    data = {
        '__RequestVerificationToken': csrf[0],
        'type': 'name', 'search': '%',  # Wildcard to get ALL cases
        'courtTypes': '2',  # Criminal court type only
        'caseTypes': '5,15,9',  # Criminal Felony, Misdemeanor, Criminal Traffic
        'openedFrom': '01/01/2020', 'openedTo': '12/31/2026',
        'closedFrom': '', 'closedTo': '',
        'partyTypes': '1,2,3,4,5',
        'divisions': '', 'statutes': '',
        'partyBirthYear': '', 'partyDOB': '',
        'captcha': captcha_answer, 'g-recaptcha-response': token, 'h-captcha-response': token,
    }
    r2 = s.post(f'{base}/CourtCase.aspx/CaseSearch', data=data, timeout=30, allow_redirects=True)
    print(f'Search submitted: {r2.status_code}')
    
    # Step 4: Get DataTables results (paginated)
    all_cases = {}
    page = 0
    page_size = 100
    
    while True:
        dt = s.post(f'{base}/Search.aspx/CaseSearch', data={
            'draw': str(page + 1), 'start': str(page * page_size), 
            'length': str(page_size), 'search[value]': '',
        }, headers={'X-Requested-With': 'XMLHttpRequest'}, timeout=15)
        
        try:
            jdata = dt.json()
        except:
            print(f'ERROR: Invalid JSON response on page {page}')
            break
        
        total = jdata.get('recordsTotal', 0)
        rows = jdata.get('data', [])
        
        if page == 0:
            print(f'Total records: {total}')
        
        if not rows:
            break
        
        # Extract case IDs and digests
        for row in rows:
            for m in re.finditer(r'Details/(\d+)\?digest=([^"&]+)', str(row)):
                cid, dig = m.group(1), m.group(2)
                if cid not in all_cases:
                    # Extract defendant name from row
                    name_match = re.findall(r'title="View Party Details for ([^"]+)"', str(row))
                    case_num = re.findall(r'title="View Case Details for ([^"]+)"', str(row))
                    all_cases[cid] = {
                        'digest': dig,
                        'defendant': name_match[0] if name_match else '',
                        'case_number': case_num[0] if case_num else '',
                    }
        
        print(f'  Page {page}: {len(rows)} rows, {len(all_cases)} unique cases so far')
        
        if (page + 1) * page_size >= total:
            break
        page += 1
        time.sleep(0.5)
    
    print(f'\nTotal unique cases: {len(all_cases)}')
    
    # Step 5: Fetch CaseThumbnail for each case to get judge + charges
    results = []
    for i, (cid, info) in enumerate(all_cases.items()):
        try:
            tr = s.get(f'{base}/CourtCase.aspx/CaseThumbnail/{cid}?digest={info["digest"]}', timeout=10)
            text = re.sub(r'<[^>]+>', '\n', tr.text)
            
            # Parse fields
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
            
            # Extract charges from table
            charges = []
            charge_rows = re.findall(r'<tr[^>]*>\s*<td[^>]*>(\d+)</td>\s*<td[^>]*>(.*?)</td>\s*<td[^>]*>(.*?)</td>', tr.text, re.DOTALL)
            for count, desc, disp in charge_rows:
                charges.append({
                    'count': count.strip(),
                    'description': re.sub(r'<[^>]+>', '', desc).strip(),
                    'disposition': re.sub(r'<[^>]+>', '', disp).strip(),
                })
            
            # Skip non-judge entries (SAO Case # parsing errors)
            if judge and judge != 'SAO Case #:' and judge != '':
                case_data = {
                    'case_id': cid,
                    'case_number': info['case_number'],
                    'defendant': info['defendant'],
                    'judge': judge,
                    'court_type': court_type,
                    'agency': agency,
                    'status_date': status_date,
                    'charges': charges,
                    'county': key,
                }
                results.append(case_data)
            
            if (i + 1) % 20 == 0:
                print(f'  Processed {i+1}/{len(all_cases)} cases, {len(results)} with judges')
            
        except Exception as e:
            print(f'  ERROR case {cid}: {e}')
        
        time.sleep(0.2)  # Rate limit
    
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


def search_common_names(base, s, csrf, sitekey, courts, cases):
    """Search using common last names to cover more cases."""
    common = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Miller',
              'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White',
              'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson',
              'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen',
              'Young', 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green',
              'Adams', 'Baker', 'Nelson', 'Carter', 'Mitchell', 'Perez']
    
    all_case_ids = set()
    
    for name in common:
        print(f'\n  Searching: {name}...')
        try:
            result = solver.recaptcha(sitekey=sitekey, url=f'{base}/Home.aspx/Search')
            token = result.get('code', '') if isinstance(result, dict) else str(result)
        except:
            print(f'  reCAPTCHA failed for {name}, skipping')
            continue
        
        data = {
            '__RequestVerificationToken': csrf,
            'type': 'name', 'search': name,
            'courtTypes': '2', 'caseTypes': '5,15,9',  # Criminal Felony + Misdemeanor + Criminal Traffic
            'openedFrom': '01/01/2024', 'openedTo': '12/31/2026',
            'closedFrom': '', 'closedTo': '',
            'partyTypes': '', 'divisions': '', 'statutes': '',
            'partyBirthYear': '', 'partyDOB': '',
            'captcha': '', 'g-recaptcha-response': token, 'h-captcha-response': token,
        }
        s.post(f'{base}/CourtCase.aspx/CaseSearch', data=data, timeout=30, allow_redirects=True)
        
        dt = s.post(f'{base}/Search.aspx/CaseSearch', data={
            'draw': '1', 'start': '0', 'length': '500',
        }, headers={'X-Requested-With': 'XMLHttpRequest'}, timeout=15)
        
        try:
            jdata = dt.json()
            total = jdata.get('recordsTotal', 0)
            print(f'  {name}: {total} results')
            
            for row in jdata.get('data', []):
                for m in re.finditer(r'Details/(\d+)', str(row)):
                    all_case_ids.add(m.group(1))
        except:
            pass
        
        time.sleep(1)
    
    return all_case_ids


if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else 'bay'
    
    if target == '--all':
        for key, config in COUNTIES.items():
            scrape_county(key, config)
    elif target in COUNTIES:
        scrape_county(target, COUNTIES[target])
    else:
        print(f'Unknown county: {target}')
        print(f'Available: {", ".join(COUNTIES.keys())}')
        print(f'Use --all to scrape all counties')
