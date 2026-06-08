#!/usr/bin/env python3
"""
Scrape Palm Beach County eCaseView for criminal case data with judge names.
Uses Playwright to navigate the clerk portal like a real browser.

Strategy:
1. Go to eCaseView search
2. Search for criminal felony cases by division (each division = 1 judge)
3. Collect case details: case number, judge, charges, disposition, sentence
"""

import json
import os
import sys
import time
import re
from datetime import datetime
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

OUT_DIR = "/root/.openclaw/workspace/redhanded/data/state-courts/florida"
os.makedirs(OUT_DIR, exist_ok=True)

# PBC criminal divisions and their judges (from 15thcircuit.com)
PBC_CRIMINAL_JUDGES = {
    "W": "James Nutt",
    "Z": "Sarah Willis",
    "S": "Vacant",
    "RA": "Sara Alijewicz",
    "L": "April Bristow",
    "P": "Frank S. Castor",
    "V": "Howard Coates, Jr.",
    "D": "Paul A. Damico",
    "T": "Donald W. Hafele",
    "AN": "Scott Ryan Kerner",
    "AA": "Gregory M. Keyser",
    "AH": "Reid P. Scott II",
    "AK": "James Sherman",
    "AO": "Danielle Sherriff",
    "AE": "Darren Dunifon Shull",
    "X": "Scott Suskauer",
    "E": "Stephanie F. Tew",
    "R": "John J. Parnofiello",
}

ECASEVIEW_URL = "https://appsgp.mypalmbeachclerk.com/eCaseView"


def scrape_cases(page, max_cases=50):
    """Scrape case details from search results."""
    cases = []
    
    try:
        # Wait for results to load
        page.wait_for_selector("table, .search-results, .no-results, #results", timeout=15000)
    except PlaywrightTimeout:
        print("  No results table found")
        return cases
    
    # Get all case links
    case_links = page.query_selector_all('a[href*="CaseDetail"], a[href*="caseDetail"], tr[onclick]')
    print(f"  Found {len(case_links)} case links")
    
    return cases


def main():
    print("=== Palm Beach County eCaseView Scraper ===")
    print(f"Target: {ECASEVIEW_URL}")
    print()
    
    # Use the already-running OpenClaw browser via CDP
    chromium_path = "/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome"
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=chromium_path,
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        print("Navigating to eCaseView...")
        try:
            page.goto(ECASEVIEW_URL, timeout=30000, wait_until="networkidle")
            print(f"Page title: {page.title()}")
            print(f"URL: {page.url}")
            
            # Take screenshot for debugging
            page.screenshot(path=f"{OUT_DIR}/ecaseview-home.png")
            print(f"Screenshot saved to {OUT_DIR}/ecaseview-home.png")
            
            # Get page content to understand structure
            content = page.content()
            print(f"Page content length: {len(content)}")
            
            # Look for guest/login buttons
            guest_btn = page.query_selector('text=Guest, text=Continue as Guest, button:has-text("Guest")')
            if guest_btn:
                print("Found guest button, clicking...")
                guest_btn.click()
                page.wait_for_load_state("networkidle")
                print(f"After guest: {page.url}")
                page.screenshot(path=f"{OUT_DIR}/ecaseview-after-guest.png")
            
            # Check for search form
            time.sleep(2)
            content = page.content()
            
            # Look for case search fields
            search_inputs = page.query_selector_all('input[type="text"], select, input[type="search"]')
            print(f"Search inputs found: {len(search_inputs)}")
            for inp in search_inputs[:10]:
                name = inp.get_attribute("name") or inp.get_attribute("id") or inp.get_attribute("placeholder") or "unknown"
                print(f"  Input: {name}")
            
            # Try to find and use case number search
            case_input = page.query_selector('input[name*="case" i], input[id*="case" i], input[placeholder*="case" i]')
            if case_input:
                print(f"\nFound case number input: {case_input.get_attribute('name') or case_input.get_attribute('id')}")
                
                # Try a known PBC case number format: 50-2024-CF-000100
                test_case = "50-2024-CF-000100"
                print(f"Testing case search: {test_case}")
                case_input.fill(test_case)
                
                # Find and click search button
                search_btn = page.query_selector('button[type="submit"], input[type="submit"], button:has-text("Search")')
                if search_btn:
                    search_btn.click()
                    page.wait_for_load_state("networkidle")
                    page.screenshot(path=f"{OUT_DIR}/ecaseview-search-result.png")
                    
                    # Check results for judge info
                    result_content = page.content()
                    if 'judge' in result_content.lower():
                        print("JUDGE DATA FOUND IN RESULTS!")
                        # Extract judge info
                        judge_matches = re.findall(r'(?i)judge[:\s]*([^<\n]{2,50})', result_content)
                        for jm in judge_matches[:5]:
                            print(f"  Judge: {jm.strip()}")
                    
                    # Look for division info
                    div_matches = re.findall(r'(?i)division[:\s]*([^<\n]{1,20})', result_content)
                    for dm in div_matches[:5]:
                        print(f"  Division: {dm.strip()}")
            
            # Try alternative: search by division letter
            print("\n=== Trying division-based search ===")
            # Navigate to search page
            page.goto(ECASEVIEW_URL, timeout=30000, wait_until="networkidle")
            time.sleep(2)
            
            # Snapshot the full page text for analysis
            text = page.inner_text("body")
            print(f"\nPage visible text (first 2000 chars):")
            print(text[:2000])
            
        except PlaywrightTimeout as e:
            print(f"Timeout: {e}")
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            browser.close()


if __name__ == "__main__":
    main()
