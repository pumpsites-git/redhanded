#!/usr/bin/env python3
"""Debug: step through the CiviTek flow with detailed logging."""

from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path="/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome",
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page = context.new_page()
        page.set_default_timeout(15000)

        # Navigate to search
        print("1. Loading county page...")
        page.goto("https://www.civitekflorida.com/ocrs/county/42/", timeout=30000)
        
        print("2. Clicking Public...")
        page.locator("button:has-text('Public'), input[value='Public'], a:has-text('Public')").first.click()
        page.wait_for_load_state("networkidle", timeout=15000)
        
        print("3. Clicking Agree...")
        time.sleep(1)
        agree = page.locator("button:has-text('Agree'), input[value*='Agree'], a:has-text('Agree')")
        if agree.count() > 0:
            agree.first.click()
            page.wait_for_load_state("networkidle", timeout=15000)
            time.sleep(1)
        
        print(f"URL now: {page.url}")
        
        # Verify we have the search form
        has_lastname = page.evaluate("!!document.querySelector('input[id*=\"lastname\"]')")
        print(f"Has lastname field: {has_lastname}")
        
        # Fill form using JS
        print("4. Filling form via JS...")
        page.evaluate("""
            document.querySelector('input[id*="lastname"]').value = 'Smith';
            // Trigger change event for JSF
            document.querySelector('input[id*="lastname"]').dispatchEvent(new Event('change', {bubbles: true}));
        """)
        
        # Check checkbox via JS - find the PrimeFaces checkbox box div and click it
        print("5. Checking CF checkbox...")
        
        # First, let's see the checkbox structure
        structure = page.evaluate("""
            (() => {
                const cb = document.querySelector('input[type="checkbox"][value="CF"]');
                if (!cb) return 'No CF checkbox found';
                const parent = cb.parentElement;
                const grandparent = parent ? parent.parentElement : null;
                return {
                    id: cb.id,
                    parentTag: parent ? parent.tagName : null,
                    parentClass: parent ? parent.className : null,
                    grandparentTag: grandparent ? grandparent.tagName : null,
                    grandparentClass: grandparent ? grandparent.className : null,
                    siblingHTML: parent ? parent.innerHTML.substring(0, 500) : null,
                    outerHTML: grandparent ? grandparent.outerHTML.substring(0, 800) : null
                };
            })()
        """)
        print(f"Checkbox structure: {structure}")
        
        # Click the PrimeFaces checkbox-box div
        clicked = page.evaluate("""
            (() => {
                const cb = document.querySelector('input[type="checkbox"][value="CF"]');
                if (!cb) return 'no checkbox';
                // PrimeFaces SelectManyCheckbox: the clickable box is .ui-chkbox-box
                const chkbox = cb.closest('.ui-chkbox') || cb.parentElement;
                const box = chkbox ? chkbox.querySelector('.ui-chkbox-box') : null;
                if (box) {
                    box.click();
                    return 'clicked box: ' + box.className;
                }
                // Try clicking label
                const label = document.querySelector('label[for="' + cb.id + '"]');
                if (label) {
                    label.click();
                    return 'clicked label';
                }
                return 'no clickable element found';
            })()
        """)
        print(f"Click result: {clicked}")
        time.sleep(1)
        
        # Verify checkbox state
        is_checked = page.evaluate("""
            document.querySelector('input[type="checkbox"][value="CF"]').checked
        """)
        print(f"CF is checked: {is_checked}")
        
        # Find and log the search button
        btn_info = page.evaluate("""
            (() => {
                const btns = document.querySelectorAll('button[type="submit"]');
                const result = [];
                btns.forEach(b => result.push({id: b.id, text: b.textContent.trim(), onclick: b.getAttribute('onclick')}));
                return result;
            })()
        """)
        print(f"Submit buttons: {btn_info}")
        
        # Click search using Playwright click (simulates real user click)
        print("6. Clicking Search button...")
        search_btn = page.locator("button:has-text('Search')").first
        
        # Listen for navigation/response
        responses = []
        page.on("response", lambda r: responses.append({"url": r.url, "status": r.status}) if 'ocrs' in r.url else None)
        
        search_btn.click()
        print("Clicked! Waiting...")
        
        # Wait for AJAX response
        time.sleep(5)
        
        print(f"\nResponses received: {len(responses)}")
        for r in responses:
            print(f"  {r['status']} {r['url'][:100]}")
        
        print(f"\nURL: {page.url}")
        
        # Get page text
        body_text = page.inner_text("body")
        print(f"\nBody text ({len(body_text)} chars):")
        print(body_text[:5000])
        
        # Check for results table
        tables = page.evaluate("""
            (() => {
                const tables = document.querySelectorAll('table');
                const result = [];
                tables.forEach(t => {
                    const rows = t.querySelectorAll('tr');
                    result.push({
                        id: t.id,
                        className: t.className.substring(0, 100),
                        rows: rows.length,
                        firstRowText: rows.length > 0 ? rows[0].textContent.trim().substring(0, 200) : ''
                    });
                });
                return result;
            })()
        """)
        print(f"\nTables: {len(tables)}")
        for t in tables:
            print(f"  id={t['id'][:50]} class={t['className'][:50]} rows={t['rows']}")
            if t['firstRowText']:
                print(f"    first row: {t['firstRowText'][:150]}")
        
        # Save screenshot
        page.screenshot(path="/tmp/civitek-after-search.png", full_page=True)
        print("\nScreenshot saved to /tmp/civitek-after-search.png")
        
        # Save HTML
        with open("/tmp/civitek-after-search.html", "w") as f:
            f.write(page.content())
        
        browser.close()

if __name__ == "__main__":
    run()
