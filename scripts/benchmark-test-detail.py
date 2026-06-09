#!/usr/bin/env python3
"""Quick test: solve captcha, get results, visit ONE case detail, save HTML."""

import os, sys, time, re
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from twocaptcha import TwoCaptcha

BASE_URL = "https://court.baycoclerk.com/BenchmarkWeb2"
SEARCH_URL = f"{BASE_URL}/Home.aspx/Search"
TWOCAPTCHA_KEY = "0e093189f388cec6262e066729a84346"
SITEKEY = "6LcYD4YeAAAAAAjooR44ItHYYJUJivq8JWVcM0f1"
CHROMIUM_PATH = "/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome"
DEBUG_DIR = "/root/.openclaw/workspace/redhanded/data/state-courts/florida/bay-county-debug"
os.makedirs(DEBUG_DIR, exist_ok=True)

def solve_recaptcha():
    solver = TwoCaptcha(TWOCAPTCHA_KEY)
    print(f"Balance: ${solver.balance()}")
    print("Solving captcha...")
    result = solver.recaptcha(sitekey=SITEKEY, url=SEARCH_URL)
    token = result.get("code") if isinstance(result, dict) else result
    print(f"Token: {str(token)[:60]}...")
    return token

with sync_playwright() as pw:
    browser = pw.chromium.launch(
        executable_path=CHROMIUM_PATH,
        headless=True,
        args=["--no-sandbox", "--disable-dev-shm-usage"]
    )
    ctx = browser.new_context(viewport={"width": 1366, "height": 768})
    page = ctx.new_page()
    
    # Load search page
    print("Loading search page...")
    page.goto(SEARCH_URL, wait_until="networkidle", timeout=30000)
    
    # Fill form: name=Smith
    page.fill("#name", "Smith")
    print("Filled name=Smith")
    
    # Solve captcha
    token = solve_recaptcha()
    
    # Inject token
    page.evaluate(f"""
        () => {{
            const el = document.getElementById('g-recaptcha-response');
            el.innerHTML = '{token}';
            el.value = '{token}';
            el.style.display = 'block';
        }}
    """)
    print("Token injected")
    
    # Submit
    page.click("button:has-text('Search')")
    page.wait_for_load_state("networkidle", timeout=30000)
    print(f"Results URL: {page.url}")
    
    # Save results HTML
    with open(f"{DEBUG_DIR}/results2.html", "w") as f:
        f.write(page.content())
    print("Saved results2.html")
    
    # Find first CF case detail link
    links = page.query_selector_all('a[href*="/Details/"]')
    print(f"Found {len(links)} detail links")
    
    # Get unique links
    hrefs = []
    seen = set()
    for link in links:
        href = link.get_attribute("href") or ""
        if href and href not in seen:
            seen.add(href)
            hrefs.append(href)
    print(f"Unique detail URLs: {len(hrefs)}")
    for h in hrefs[:5]:
        print(f"  {h}")
    
    # Navigate to first CF case (Criminal Felony)
    cf_href = next((h for h in hrefs if "CF" in h.upper() or True), hrefs[0] if hrefs else None)
    if cf_href:
        # Find a CF case specifically
        cf_href = next((h for h in hrefs if re.search(r'/Details/\d+', h)), None)
        if cf_href:
            detail_url = "https://court.baycoclerk.com" + cf_href if cf_href.startswith("/") else cf_href
            print(f"\nNavigating to: {detail_url}")
            page.goto(detail_url, wait_until="networkidle", timeout=30000)
            page.screenshot(path=f"{DEBUG_DIR}/case-detail-test.png")
            
            # Save HTML
            html = page.content()
            with open(f"{DEBUG_DIR}/case-detail-test.html", "w") as f:
                f.write(html)
            print(f"Saved case-detail-test.html ({len(html)} bytes)")
            
            # Print visible text
            body_text = page.inner_text("body")
            print("\n--- CASE DETAIL TEXT ---")
            print(body_text[:3000])
    
    browser.close()
print("\nDone.")
