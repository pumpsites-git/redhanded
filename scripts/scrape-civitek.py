#!/usr/bin/env python3
"""
CiviTek Florida Court Records Scraper
Scrapes 33 Florida counties for criminal case data with judge names.
Uses Playwright + 2Captcha for Cloudflare Turnstile bypass.
"""

import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import unquote, parse_qs

from playwright.sync_api import sync_playwright
from twocaptcha import TwoCaptcha

# Config
TWOCAPTCHA_KEY = os.getenv('TWOCAPTCHA_API_KEY', '')
if not TWOCAPTCHA_KEY:
    env_path = Path(__file__).parent.parent / 'integrations' / '2captcha' / '.env'
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith('TWOCAPTCHA_API_KEY='):
                TWOCAPTCHA_KEY = line.split('=', 1)[1].strip()

CHROMIUM = '/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome'
BASE_URL = 'https://www.civitekflorida.com'
TURNSTILE_SITEKEY = '0x4AAAAAAAR0Af-5MfzdbO3p'

OUT_DIR = Path(__file__).parent.parent / 'data' / 'state-courts' / 'florida'
OUT_DIR.mkdir(parents=True, exist_ok=True)

# All 33 CiviTek counties with their IDs
CIVITEK_COUNTIES = {
    'baker': 2, 'bradford': 4, 'calhoun': 7, 'columbia': 12,
    'desoto': 14, 'dixie': 15, 'franklin': 19, 'gilchrist': 20,
    'glades': 22, 'gulf': 23, 'hamilton': 24, 'hardee': 25,
    'hendry': 26, 'hernando': 27, 'highlands': 28, 'holmes': 29,
    'jackson': 32, 'jefferson': 33, 'lafayette': 35, 'levy': 37,
    'liberty': 38, 'madison': 40, 'marion': 42, 'nassau': 45,
    'okeechobee': 47, 'pasco': 51, 'putnam': 54, 'santa-rosa': 57,
    'sumter': 60, 'union': 62, 'wakulla': 65, 'walton': 66,
    'washington': 67,
}


def solve_turnstile(page_url):
    """Solve Cloudflare Turnstile via 2Captcha."""
    solver = TwoCaptcha(TWOCAPTCHA_KEY)
    print(f'  Solving Turnstile for {page_url}...')
    try:
        result = solver.turnstile(
            sitekey=TURNSTILE_SITEKEY,
            url=page_url,
        )
        token = result.get('code', '') if isinstance(result, dict) else str(result)
        print(f'  Turnstile solved! Token: {token[:40]}...')
        return token
    except Exception as e:
        print(f'  Turnstile solve FAILED: {e}')
        return None


def scrape_county(county_name, county_id, max_pages=10):
    """Scrape felony cases for one county."""
    print(f'\n=== Scraping {county_name.upper()} (ID: {county_id}) ===')
    
    cases = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROMIUM,
            headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage']
        )
        ctx = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 1200}
        )
        page = ctx.new_page()
        page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        try:
            # Navigate: Access → Public → Disclaimer → Search
            page.goto(f'{BASE_URL}/ocrs/county/{county_id}/', timeout=30000)
            time.sleep(3)
            
            with page.expect_navigation(timeout=15000):
                page.locator('button span:text("Public")').click()
            time.sleep(2)
            
            with page.expect_navigation(timeout=15000):
                page.locator('button span:text("I Agree")').click()
            time.sleep(2)
            
            if 'search' not in page.url:
                print(f'  ERROR: Not on search page. URL: {page.url}')
                browser.close()
                return cases
            
            print(f'  On search page: {page.url}')
            
            # Search for ALL felony cases (no name filter — search by court type + date)
            # Actually, name is required. Search common last names to cover many cases.
            common_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 
                          'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas',
                          'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia',
                          'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee',
                          'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright']
            
            for name in common_names[:5]:  # Start with top 5 names
                print(f'\n  Searching: {name} (felonies)...')
                
                # Fill name
                lastname_input = page.locator('#form\\:search_tab\\:lastname')
                lastname_input.fill('')
                lastname_input.fill(name)
                
                # Check Felony checkbox via PrimeFaces UI
                page.evaluate("""() => {
                    var table = document.getElementById('form:search_tab:ps_court');
                    // First uncheck all
                    table.querySelectorAll('.ui-chkbox-box').forEach(b => {
                        if (b.classList.contains('ui-state-active')) b.click();
                    });
                }""")
                time.sleep(0.5)
                page.evaluate("""() => {
                    var table = document.getElementById('form:search_tab:ps_court');
                    var boxes = table.querySelectorAll('.ui-chkbox-box');
                    boxes[6].click();  // CF = Felony
                }""")
                time.sleep(1)
                
                # Solve Turnstile
                token = solve_turnstile(page.url)
                if token:
                    # Inject the token
                    page.evaluate(f"""() => {{
                        var input = document.querySelector('[name="cf-turnstile-response"]');
                        if (input) input.value = '{token}';
                    }}""")
                    time.sleep(0.5)
                
                # Submit search
                page.locator('button span:text("Search")').click()
                time.sleep(8)
                
                # Check for results
                content = page.content()
                trs = re.findall(r'data-ri="\d+"', content)
                print(f'  Results: {len(trs)} rows')
                
                if trs:
                    # Extract table headers
                    ths = re.findall(r'<th[^>]*>(.*?)</th>', content, re.DOTALL)
                    headers = [re.sub(r'<[^>]+>', '', h).strip() for h in ths if re.sub(r'<[^>]+>', '', h).strip()]
                    print(f'  Headers: {headers}')
                    
                    # Extract rows
                    for m in re.finditer(r'<tr[^>]*data-ri="(\d+)"[^>]*>(.*?)</tr>', content, re.DOTALL):
                        tds = re.findall(r'<td[^>]*>(.*?)</td>', m.group(2), re.DOTALL)
                        clean = [re.sub(r'<[^>]+>', '', d).strip() for d in tds]
                        cases.append({
                            'county': county_name,
                            'search_name': name,
                            'row_index': m.group(1),
                            'cells': clean,
                        })
                        if len(cases) <= 3:
                            print(f'    [{m.group(1)}] {clean}')
                    
                    print(f'  Total cases so far: {len(cases)}')
                else:
                    # Check for "No records" message
                    text = page.inner_text('body')
                    if 'No records' in text:
                        print(f'  No records for {name}')
                    else:
                        print(f'  No results (possible Turnstile rejection)')
                
                time.sleep(2)  # Rate limit
                
        except Exception as e:
            print(f'  ERROR: {e}')
        finally:
            browser.close()
    
    return cases


def main():
    if not TWOCAPTCHA_KEY:
        print('ERROR: No 2Captcha API key. Set TWOCAPTCHA_API_KEY or add to integrations/2captcha/.env')
        sys.exit(1)
    
    print('=== CiviTek Florida Court Records Scraper ===')
    print(f'2Captcha key: {TWOCAPTCHA_KEY[:8]}...')
    print(f'Counties: {len(CIVITEK_COUNTIES)}')
    print(f'Turnstile sitekey: {TURNSTILE_SITEKEY}')
    print()
    
    # Start with Marion County as test
    test_county = 'marion'
    test_id = CIVITEK_COUNTIES[test_county]
    
    cases = scrape_county(test_county, test_id)
    
    if cases:
        print(f'\n=== SUCCESS: {len(cases)} cases from {test_county} ===')
        # Save results
        out_file = OUT_DIR / f'civitek-{test_county}-cases.json'
        with open(out_file, 'w') as f:
            json.dump(cases, f, indent=2)
        print(f'Saved to {out_file}')
    else:
        print(f'\n=== No cases retrieved from {test_county} ===')
    
    return cases


if __name__ == '__main__':
    main()
