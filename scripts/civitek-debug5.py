#!/usr/bin/env python3
"""Try with Xvfb (headed mode on virtual display) + stealth to beat Turnstile."""

from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth
import time, json, subprocess, os, signal

def run():
    # Start Xvfb
    xvfb = subprocess.Popen(
        ["Xvfb", ":99", "-screen", "0", "1920x1080x24", "-nolisten", "tcp"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    os.environ["DISPLAY"] = ":99"
    time.sleep(1)
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=False,  # headed mode on Xvfb
                executable_path="/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome",
                args=[
                    "--no-sandbox",
                    "--disable-dev-shm-usage", 
                    "--disable-blink-features=AutomationControlled",
                    "--disable-infobars",
                    "--window-size=1920,1080",
                ]
            )
            context = browser.new_context(
                user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={"width": 1920, "height": 1080},
            )
            stealth = Stealth()
            page = context.new_page()
            stealth.apply_stealth_sync(page)
            page.set_default_timeout(20000)

            # Navigate to search
            print("1. Loading county page...")
            page.goto("https://www.civitekflorida.com/ocrs/county/42/", timeout=30000)
            page.wait_for_load_state("networkidle")
            
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

            print(f"URL: {page.url}")
            
            # Wait for Turnstile
            print("4. Waiting for Turnstile (up to 20s)...")
            for i in range(20):
                time.sleep(1)
                val = page.evaluate("""
                    (() => {
                        const inp = document.querySelector('[name="cf-turnstile-response"]');
                        return inp ? inp.value.length : -1;
                    })()
                """)
                if val > 0:
                    print(f"   Turnstile solved after {i+1}s! Token length: {val}")
                    break
                if i % 5 == 4:
                    print(f"   Still waiting... ({i+1}s)")
            else:
                print("   Turnstile NOT solved after 20s")
                # Check what happened
                diag = page.evaluate("""
                    (() => {
                        const iframes = Array.from(document.querySelectorAll('iframe')).map(f => ({src: f.src.substring(0,200), w: f.width, h: f.height}));
                        const inp = document.querySelector('[name="cf-turnstile-response"]');
                        return {
                            iframes,
                            tokenLen: inp ? inp.value.length : -1,
                            hasTurnstile: typeof window.turnstile !== 'undefined',
                            webdriver: navigator.webdriver
                        };
                    })()
                """)
                print(f"   Diagnostics: {json.dumps(diag, indent=2)}")
                
                # Try to manually render Turnstile
                print("   Trying manual turnstile.render()...")
                render_result = page.evaluate("""
                    (() => {
                        try {
                            if (typeof onloadTurnstileCallback === 'function') {
                                onloadTurnstileCallback();
                                return 'callback invoked';
                            }
                            if (typeof turnstile !== 'undefined') {
                                // Find the container
                                const containers = document.querySelectorAll('.cf-turnstile');
                                if (containers.length > 0) {
                                    turnstile.render(containers[0]);
                                    return 'render called on container';
                                }
                                return 'no container found, turnstile exists';
                            }
                            return 'no turnstile global';
                        } catch(e) {
                            return 'error: ' + e.message;
                        }
                    })()
                """)
                print(f"   Render result: {render_result}")
                time.sleep(5)
                
                # Check token again
                val2 = page.evaluate("document.querySelector('[name=\"cf-turnstile-response\"]')?.value?.length || 0")
                print(f"   Token length after manual render: {val2}")
            
            # Check turnstile state  
            token_len = page.evaluate("document.querySelector('[name=\"cf-turnstile-response\"]')?.value?.length || 0")
            
            if token_len > 0:
                print(f"\n=== TURNSTILE SOLVED (token: {token_len} chars) ===")
                
                # Fill form
                print("5. Filling form...")
                page.locator("input[id$='lastname']").first.fill("Smith")
                page.evaluate("""
                    (() => {
                        const cb = document.querySelector('input[type="checkbox"][value="CF"]');
                        const box = cb.closest('.ui-chkbox').querySelector('.ui-chkbox-box');
                        if (!cb.checked) box.click();
                    })()
                """)
                time.sleep(0.5)
                
                # Click search
                print("6. Clicking Search...")
                all_posts = []
                page.on("request", lambda r: all_posts.append({
                    "url": r.url, "post": r.post_data[:1000] if r.post_data else None
                }) if r.method == "POST" else None)
                
                page.locator("button:has-text('Search')").first.click()
                
                # Wait for results
                time.sleep(5)
                page.wait_for_load_state("networkidle", timeout=10000)
                
                body = page.inner_text("body")
                print(f"\nBody ({len(body)} chars):")
                print(body[:5000])
                
                # Check for results
                has_datatable = page.evaluate("!!document.querySelector('.ui-datatable')")
                print(f"\nHas datatable: {has_datatable}")
                
                if has_datatable:
                    rows = page.locator(".ui-datatable-data tr")
                    print(f"Result rows: {rows.count()}")
                
                for r in all_posts:
                    print(f"\nPOST {r['url']}")
                    print(f"  {r['post']}")
            else:
                print("\nTurnstile not solved. Taking screenshot...")
            
            page.screenshot(path="/tmp/civitek-xvfb.png", full_page=True)
            print("Screenshot saved.")
            
            with open("/tmp/civitek-xvfb.html", "w") as f:
                f.write(page.content())
            
            browser.close()
    finally:
        xvfb.terminate()
        xvfb.wait()

if __name__ == "__main__":
    run()
