#!/usr/bin/env python3
"""Debug: check for Cloudflare Turnstile and wait for it."""

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
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        page.set_default_timeout(15000)

        # Navigate to search
        page.goto("https://www.civitekflorida.com/ocrs/county/42/", timeout=30000)
        page.locator("button:has-text('Public'), input[value='Public'], a:has-text('Public')").first.click()
        page.wait_for_load_state("networkidle", timeout=15000)
        time.sleep(1)
        agree = page.locator("button:has-text('Agree'), input[value*='Agree'], a:has-text('Agree')")
        if agree.count() > 0:
            agree.first.click()
            page.wait_for_load_state("networkidle", timeout=15000)
            time.sleep(1)

        print(f"URL: {page.url}")
        
        # Check for Turnstile
        turnstile_info = page.evaluate("""
            (() => {
                const results = {};
                // Check for turnstile scripts
                const scripts = document.querySelectorAll('script[src*="turnstile"], script[src*="challenges"]');
                results.scripts = Array.from(scripts).map(s => s.src);
                
                // Check for turnstile widgets/iframes
                const iframes = document.querySelectorAll('iframe[src*="turnstile"], iframe[src*="challenges"]');
                results.iframes = Array.from(iframes).map(f => ({src: f.src.substring(0, 200), id: f.id}));
                
                // Check for cf-turnstile div
                const cfDivs = document.querySelectorAll('[class*="cf-turnstile"], .cf-turnstile, [data-sitekey]');
                results.cfDivs = Array.from(cfDivs).map(d => ({
                    tag: d.tagName, 
                    class: d.className, 
                    sitekey: d.dataset.sitekey,
                    innerHTML: d.innerHTML.substring(0, 500)
                }));
                
                // Check for cf-turnstile-response input
                const cfInput = document.querySelector('[name="cf-turnstile-response"]');
                if (cfInput) {
                    results.cfInput = {
                        tag: cfInput.tagName,
                        name: cfInput.name,
                        value: cfInput.value.substring(0, 100),
                        id: cfInput.id,
                        type: cfInput.type
                    };
                }
                
                // Check for any turnstile global
                results.hasTurnstileGlobal = typeof window.turnstile !== 'undefined';
                
                return results;
            })()
        """)
        
        import json
        print("Turnstile info:")
        print(json.dumps(turnstile_info, indent=2))
        
        # Wait for turnstile to possibly complete
        print("\nWaiting 10s for Turnstile to complete...")
        time.sleep(10)
        
        # Check again
        turnstile_after = page.evaluate("""
            (() => {
                const cfInput = document.querySelector('[name="cf-turnstile-response"]');
                return {
                    value: cfInput ? cfInput.value : 'NOT FOUND',
                    length: cfInput ? cfInput.value.length : 0
                };
            })()
        """)
        print(f"Turnstile response after wait: length={turnstile_after['length']}")
        if turnstile_after['value']:
            print(f"  Value (first 100): {turnstile_after['value'][:100]}")
        
        # Check if turnstile rendered
        iframes_after = page.evaluate("""
            Array.from(document.querySelectorAll('iframe')).map(f => ({
                src: f.src.substring(0, 200), 
                id: f.id,
                width: f.width,
                height: f.height
            }))
        """)
        print(f"\nAll iframes: {json.dumps(iframes_after, indent=2)}")
        
        # If turnstile has a value, try the search
        if turnstile_after['length'] > 0:
            print("\n=== TURNSTILE SOLVED - Trying search ===")
            page.locator("input[id$='lastname']").first.fill("Smith")
            page.evaluate("""
                (() => {
                    const cb = document.querySelector('input[type="checkbox"][value="CF"]');
                    const box = cb.closest('.ui-chkbox').querySelector('.ui-chkbox-box');
                    box.click();
                })()
            """)
            time.sleep(0.5)
            
            requests_log = []
            page.on("request", lambda r: requests_log.append({
                "url": r.url, "method": r.method, 
                "post": r.post_data[:500] if r.post_data else None
            }) if r.method == "POST" else None)
            
            page.locator("button:has-text('Search')").first.click()
            time.sleep(5)
            
            body = page.inner_text("body")
            print(f"Body after search ({len(body)} chars):")
            print(body[:3000])
            
            for r in requests_log:
                print(f"\nPOST {r['url']}")
                print(f"  Data: {r['post']}")
        else:
            print("\nTurnstile NOT solved. Trying headless=new mode or other approach...")
            # Try new headless mode
            
        page.screenshot(path="/tmp/civitek-turnstile.png", full_page=True)
        browser.close()

if __name__ == "__main__":
    run()
