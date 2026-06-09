#!/usr/bin/env python3
"""Debug: use Playwright fill/type + intercept POST data."""

from playwright.sync_api import sync_playwright
import time, json

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

        # Intercept requests to see POST data
        all_requests = []
        def on_request(req):
            if req.method == "POST":
                all_requests.append({
                    "url": req.url,
                    "method": req.method,
                    "post_data": req.post_data,
                    "headers": dict(req.headers),
                })
        page.on("request", on_request)

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
        
        # Use Playwright's fill() to properly type into the field
        print("4. Filling lastname with Playwright fill()...")
        lastname_input = page.locator("input[id$='lastname']").first
        lastname_input.click()
        lastname_input.fill("Smith")
        time.sleep(0.5)
        
        # Verify it's set
        val = lastname_input.input_value()
        print(f"   Lastname value: '{val}'")
        
        # Click the CF checkbox using the PrimeFaces box
        print("5. Clicking CF checkbox box...")
        page.evaluate("""
            (() => {
                const cb = document.querySelector('input[type="checkbox"][value="CF"]');
                const chkbox = cb.closest('.ui-chkbox');
                const box = chkbox.querySelector('.ui-chkbox-box');
                box.click();
            })()
        """)
        time.sleep(0.5)
        
        checked = page.evaluate('document.querySelector(\'input[type="checkbox"][value="CF"]\').checked')
        print(f"   CF checked: {checked}")
        
        # Check what form elements exist and their values before submit
        print("6. Pre-submit form state:")
        form_state = page.evaluate("""
            (() => {
                const form = document.getElementById('form');
                if (!form) return 'No form found';
                const inputs = form.querySelectorAll('input, select, textarea');
                const state = [];
                inputs.forEach(inp => {
                    if (inp.type === 'checkbox') {
                        state.push({name: inp.name, value: inp.value, type: 'checkbox', checked: inp.checked});
                    } else if (inp.name && inp.value) {
                        state.push({name: inp.name, value: inp.value.substring(0, 100), type: inp.type});
                    }
                });
                return state;
            })()
        """)
        for item in form_state:
            if item.get('checked') or (item.get('type') != 'checkbox' and item.get('value')):
                print(f"   {item['name']}: {item.get('value', '')[:80]} (type={item['type']}, checked={item.get('checked', '')})")
        
        # Clear request log before search
        all_requests.clear()
        
        # Click search
        print("\n7. Clicking Search...")
        search_btn = page.locator("button:has-text('Search')").first
        search_btn.click()
        
        # Wait for page load
        page.wait_for_load_state("load", timeout=20000)
        time.sleep(3)
        
        print(f"\n=== POST Requests ===")
        for req in all_requests:
            print(f"POST {req['url']}")
            if req['post_data']:
                # Parse form data
                print(f"Content-Type: {req['headers'].get('content-type', 'N/A')}")
                pd = req['post_data']
                if len(pd) > 2000:
                    print(f"POST data ({len(pd)} chars): {pd[:2000]}...")
                else:
                    print(f"POST data: {pd}")
                print()
        
        print(f"\nURL after search: {page.url}")
        body = page.inner_text("body")
        print(f"Body ({len(body)} chars):")
        print(body[:3000])
        
        # Check if there's a datatable
        has_datatable = page.evaluate("!!document.querySelector('.ui-datatable')")
        print(f"\nHas datatable: {has_datatable}")
        
        # Check for any result indicators
        result_panel = page.locator("[id*='result'], [id*='Result'], [class*='result']")
        print(f"Result panels: {result_panel.count()}")
        
        page.screenshot(path="/tmp/civitek-debug3.png", full_page=True)
        browser.close()

if __name__ == "__main__":
    run()
