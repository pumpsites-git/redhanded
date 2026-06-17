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
    
    # Step 3: Search by common names (wildcard % no longer works on BenchmarkWeb)
    # Each name search requires a fresh CAPTCHA solve
    common_names = [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Miller',
        'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White',
        'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson',
        'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen',
        'Young', 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green',
        'Adams', 'Baker', 'Nelson', 'Carter', 'Mitchell', 'Perez',
        'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans',
        'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris', 'Rogers',
        'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera',
        'Cooper', 'Richardson', 'Cox', 'Howard', 'Ward', 'Torres', 'Peterson',
        'Gray', 'Ramirez', 'James', 'Watson', 'Brooks', 'Kelly', 'Sanders',
        'Price', 'Bennett', 'Wood', 'Barnes', 'Ross', 'Henderson', 'Coleman',
        'Jenkins', 'Perry', 'Powell', 'Long', 'Patterson', 'Hughes', 'Flores',
        'Washington', 'Butler', 'Simmons', 'Foster', 'Gonzales', 'Bryant',
        'Alexander', 'Russell', 'Griffin', 'Diaz', 'Hayes',
    ]
    
    all_cases = {}
    
    for name_idx, search_name in enumerate(common_names):
        # Solve fresh CAPTCHA for each name search
        try:
            r_fresh = s.get(f'{base}/Home.aspx/Search', timeout=15)
            csrf_fresh = re.findall(r'name="__RequestVerificationToken"[^>]*value="([^"]*)"', r_fresh.text)
            sitekey_fresh = re.findall(r'data-sitekey="([^"]+)"', r_fresh.text)
            
            if captcha_type == 'image' or (not sitekey_fresh and '/CaptchaImage' in r_fresh.text):
                import base64
                img_r = s.get(f'{base}/CourtCase.aspx/CaptchaImage', timeout=10)
                img_b64 = base64.b64encode(img_r.content).decode('ascii')
                result = solver.normal(img_b64)
                captcha_answer = result.get('code', '') if isinstance(result, dict) else str(result)
                fresh_token = ''
            elif sitekey_fresh:
                hcaptcha = re.findall(r'data-sitekey="([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"', r_fresh.text)
                if hcaptcha:
                    result = solver.hcaptcha(sitekey=hcaptcha[0], url=f'{base}/Home.aspx/Search')
                else:
                    result = solver.recaptcha(sitekey=sitekey_fresh[0], url=f'{base}/Home.aspx/Search')
                fresh_token = result.get('code', '') if isinstance(result, dict) else str(result)
                captcha_answer = ''
            else:
                fresh_token = ''
                captcha_answer = ''
        except Exception as e:
            print(f'  CAPTCHA failed for {search_name}: {e}')
            continue
        
        data = {
            '__RequestVerificationToken': csrf_fresh[0] if csrf_fresh else csrf[0],
            'type': 'Name', 'search': search_name,
            'courtTypes': '2', 'caseTypes': '',
            'openedFrom': '01/01/2018', 'openedTo': '12/31/2026',
            'closedFrom': '', 'closedTo': '',
            'partyTypes': '1,2,3,4,5',
            'divisions': '', 'statutes': '',
            'partyBirthYear': '', 'partyDOB': '',
            'captcha': captcha_answer, 'g-recaptcha-response': fresh_token, 'h-captcha-response': fresh_token,
        }
        r2 = s.post(f'{base}/CourtCase.aspx/CaseSearch', data=data, timeout=30, allow_redirects=True)
        
        # Check if single result redirected to detail
        if 'Details' in r2.url:
            cid_match = re.search(r'Details/(\d+)', r2.url)
            if cid_match:
                cid = cid_match.group(1)
                all_cases[cid] = {'digest': '', 'defendant': search_name, 'case_number': ''}
            total = 1
        else:
            # Get DataTables results (paginated)
            page = 0
            page_size = 500
            total = 0
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
                    row_str = str(row)
                    # NEW format: imgExpand_{cid}
                    for m in re.finditer(r'imgExpand_(\d+)', row_str):
                        cid = m.group(1)
                        if cid not in all_cases:
                            name_match = re.findall(r'View Party Details for ([^"]+)', row_str)
                            case_match = re.findall(r'View Case Details for ([^"]+)', row_str)
                            all_cases[cid] = {
                                'digest': '',
                                'defendant': name_match[0] if name_match else search_name,
                                'case_number': case_match[0] if case_match else '',
                            }
                    # OLD format: Details/{cid}?digest={dig}
                    for m in re.finditer(r'Details/(\d+)\?digest=([^"&]+)', row_str):
                        cid, dig = m.group(1), m.group(2)
                        if cid not in all_cases:
                            name_match = re.findall(r'View Party Details for ([^"]+)', row_str)
                            case_match = re.findall(r'View Case Details for ([^"]+)', row_str)
                            all_cases[cid] = {
                                'digest': dig,
                                'defendant': name_match[0] if name_match else search_name,
                                'case_number': case_match[0] if case_match else '',
                            }
                if (page + 1) * page_size >= total:
                    break
                page += 1
                time.sleep(0.3)
        
        print(f'  [{name_idx+1}/{len(common_names)}] {search_name}: {total} results, {len(all_cases)} total unique cases')
        time.sleep(0.5)
    
    print(f'\nTotal unique cases: {len(all_cases)}')
    
    # Step 5: Fetch CaseThumbnail for each case to get judge + charges
    results = []
    for i, (cid, info) in enumerate(all_cases.items()):
        try:
            digest_param = f'?digest={info["digest"]}' if info.get('digest') else ''
            tr = s.get(f'{base}/CourtCase.aspx/CaseThumbnail/{cid}{digest_param}', timeout=10)
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
