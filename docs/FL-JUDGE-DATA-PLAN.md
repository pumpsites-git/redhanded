# Florida Judge Data Acquisition Plan

## Problem
Florida state data (FDLE) contains 12.6M convictions and 4.25M clerk case records but **no judge names**. 
Judge names exist only in individual county clerk portals.

## Proven Approaches

### 1. CiviTek Florida Portal (33 counties)
- URL: `civitekflorida.com/ocrs/county/{id}/`
- Counties: Baker, Bradford, Calhoun, Columbia, DeSoto, Dixie, Franklin, Gilchrist, Glades, Gulf, Hamilton, Hardee, Hendry, Hernando, Highlands, Holmes, Jackson, Jefferson, Lafayette, Levy, Liberty, Madison, Marion, Nassau, Okeechobee, Pasco, Putnam, Santa Rosa, Sumter, Union, Wakulla, Walton, Washington
- Tech: PrimeFaces JSF — requires proper ViewState + AJAX handling
- Has: Felony/Misdemeanor search, case details with judge/division
- **Need:** Build a proper JSF-aware scraper that maintains ViewState across requests

### 2. Broward County API (paid, 2nd largest FL county)
- URL: `api.browardclerk.org`
- Cost: Unit-based pricing (TBD — requires registration)
- Has: Felony, Misdemeanor, Traffic — pleas, dispositions, sentencing, judge
- **Need:** Register account, get notarized agreement, subscribe

### 3. Major County Clerk Portals (individual)
- **Palm Beach (15th Circuit)**: `appsgp.mypalmbeachclerk.com/eCaseView` — blocks headless browsers
- **Miami-Dade (11th Circuit)**: `www2.miamidadeclerk.gov/cjis/` — has CAPTCHA
- **Orange (9th Circuit)**: `myeclerk.myorangeclerk.com` — CAPTCHA for anonymous
- **Hillsborough (13th Circuit)**: `www.hillsclerk.com` — has online search
- **Duval/Jacksonville (4th Circuit)**: CORE system — searchable by division

### 4. FSS 907.043 Public Records Requests
- Florida law **requires** every county to publish annual pretrial release reports
- Reports include defendant names + case numbers
- Cross-reference case numbers with clerk portals to get judge assignments
- This is how CourtWatch.live bootstrapped their data

## Execution Order

### Phase 1: CiviTek Scraper (33 counties at once)
Build a proper scraper for the CiviTek JSF portal:
1. Use `requests` + proper JSF ViewState management (not browser automation)
2. For each county: search all felony cases by year
3. Extract case number, judge/division, charges, disposition, sentence
4. Covers 33 counties including several of the toughest (Union, Bradford, Dixie)

### Phase 2: Broward API (immediate)
Register for the commercial API — structured data, no scraping headaches.

### Phase 3: Major County Portals
For the big counties (Palm Beach, Miami-Dade, Orange, Hillsborough):
- Register as users on each portal (bypasses CAPTCHA)
- Build per-portal scrapers
- OR: File public records requests for bulk case data exports

### Phase 4: FSS 907.043 Requests
File public records requests to all 67 county clerks for their annual reports.
Florida law requires they provide this data.

## County Coverage Map
- CiviTek: 33 counties
- Broward API: 1 county  
- Individual portals: ~10 major counties
- Remaining: FSS 907.043 public records requests
- Total: All 67 counties achievable
