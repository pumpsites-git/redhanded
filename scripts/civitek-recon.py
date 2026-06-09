#!/usr/bin/env python3
"""Reconnaissance: navigate CiviTek Marion County, fill search, capture results."""

from playwright.sync_api import sync_playwright
import json, time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path="/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome",
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        # Capture network requests for the search
        requests_log = []
        def on_request(req):
            if 'search' in req.url.lower() or 'ocrs' in req.url.lower():
                requests_log.append({
                    'url': req.url,
                    'method': req.method,
                    'post_data': req.post_data[:2000] if req.post_data else None
                })
        page.on("request", on_request)
        
        # Step 1: Go to Marion County
        print("=== Step 1: Loading county page ===")
        page.goto("https://www.civitekflorida.com/ocrs/county/42/", timeout=30000)
        print(f"URL: {page.url}")
        print(f"Title: {page.title()}")
        
        # Step 2: Click "Public" button
        print("\n=== Step 2: Clicking Public button ===")
        public_btn = page.locator("button:has-text('Public'), input[value='Public']")
        if public_btn.count() > 0:
            public_btn.first.click()
            page.wait_for_load_state("networkidle", timeout=15000)
            print(f"URL after Public: {page.url}")
        else:
            # Try finding any button/link with "Public" 
            links = page.locator("a:has-text('Public')")
            if links.count() > 0:
                links.first.click()
                page.wait_for_load_state("networkidle", timeout=15000)
                print(f"URL after Public link: {page.url}")
            else:
                print("No Public button found, dumping page...")
                print(page.content()[:3000])
                browser.close()
                return
        
        # Step 3: Handle disclaimer / "I Agree"
        print("\n=== Step 3: Looking for disclaimer ===")
        time.sleep(1)
        print(f"URL: {page.url}")
        agree_btn = page.locator("button:has-text('Agree'), input[value*='Agree'], a:has-text('Agree')")
        if agree_btn.count() > 0:
            print(f"Found {agree_btn.count()} agree button(s)")
            agree_btn.first.click()
            page.wait_for_load_state("networkidle", timeout=15000)
            print(f"URL after Agree: {page.url}")
        else:
            print("No Agree button, checking page content...")
            text = page.inner_text("body")[:1000]
            print(text)
        
        # Step 4: We should be on search page now
        print("\n=== Step 4: Search page ===")
        time.sleep(1)
        print(f"URL: {page.url}")
        
        # Check if we're on the search page
        if 'search' in page.url.lower():
            print("On search page!")
        else:
            print("Not on search page yet, page text:")
            print(page.inner_text("body")[:1000])
        
        # Look for the last name field
        lastname = page.locator("input[id*='lastname'], input[name*='lastname']")
        print(f"\nLastname fields found: {lastname.count()}")
        
        # Look for court type checkboxes
        checkboxes = page.locator("input[type='checkbox']")
        print(f"Checkboxes found: {checkboxes.count()}")
        for i in range(min(checkboxes.count(), 20)):
            cb = checkboxes.nth(i)
            cb_id = cb.get_attribute("id") or ""
            cb_name = cb.get_attribute("name") or ""
            cb_val = cb.get_attribute("value") or ""
            label = ""
            try:
                label_el = page.locator(f"label[for='{cb_id}']")
                if label_el.count() > 0:
                    label = label_el.first.inner_text()
            except:
                pass
            print(f"  CB: id={cb_id} name={cb_name} value={cb_val} label={label}")
        
        # Look for search button
        buttons = page.locator("button[type='submit'], input[type='submit']")
        print(f"\nSubmit buttons: {buttons.count()}")
        for i in range(buttons.count()):
            btn = buttons.nth(i)
            print(f"  Button: id={btn.get_attribute('id')} value={btn.get_attribute('value')} text={btn.inner_text()[:50] if btn.inner_text() else ''}")
        
        # Also look for any button with "Search" text
        search_btns = page.locator("button:has-text('Search')")
        print(f"Buttons with 'Search' text: {search_btns.count()}")
        for i in range(search_btns.count()):
            btn = search_btns.nth(i)
            print(f"  id={btn.get_attribute('id')} class={btn.get_attribute('class')}")
        
        # Step 5: Fill the form and search
        print("\n=== Step 5: Filling form ===")
        if lastname.count() > 0:
            lastname.first.fill("Smith")
            print("Filled lastname: Smith")
            
            # Check the CF (Criminal Felony) checkbox
            cf_checkbox = page.locator("input[type='checkbox'][value='CF']")
            if cf_checkbox.count() > 0:
                if not cf_checkbox.first.is_checked():
                    cf_checkbox.first.check()
                    print("Checked CF checkbox")
                else:
                    print("CF already checked")
            else:
                print("CF checkbox not found by value, trying label...")
                # Try finding by label text
                felony_label = page.locator("label:has-text('Felony')")
                if felony_label.count() > 0:
                    felony_label.first.click()
                    print("Clicked Felony label")
            
            time.sleep(0.5)
            
            # Click search
            print("\nClicking search...")
            search_btn = page.locator("button:has-text('Search')").first
            
            # Set up response waiter
            with page.expect_response(lambda r: 'search' in r.url.lower(), timeout=30000) as resp_info:
                search_btn.click()
            
            response = resp_info.value
            print(f"Response URL: {response.url}")
            print(f"Response status: {response.status}")
            
            page.wait_for_load_state("networkidle", timeout=15000)
            print(f"\nURL after search: {page.url}")
            
            # Check for results
            time.sleep(2)
            body_text = page.inner_text("body")
            print(f"\nBody text length: {len(body_text)}")
            print(f"First 3000 chars:\n{body_text[:3000]}")
            
            # Look for a results table
            tables = page.locator("table")
            print(f"\nTables found: {tables.count()}")
            
            # Look for data rows
            rows = page.locator("tr")
            print(f"Table rows found: {rows.count()}")
            
            # Check for case links
            case_links = page.locator("a[href*='case'], a[href*='Case']")
            print(f"Case links: {case_links.count()}")
            
            # Also try data tables (PrimeFaces)
            datatables = page.locator(".ui-datatable, [class*='datatable']")
            print(f"Data tables: {datatables.count()}")
            
        print("\n=== Network Requests ===")
        for r in requests_log[-10:]:
            print(f"{r['method']} {r['url']}")
            if r['post_data']:
                print(f"  POST data: {r['post_data'][:500]}")
        
        # Save page HTML for analysis
        html = page.content()
        with open("/tmp/civitek-result.html", "w") as f:
            f.write(html)
        print(f"\nSaved HTML ({len(html)} bytes) to /tmp/civitek-result.html")
        
        browser.close()

if __name__ == "__main__":
    run()
