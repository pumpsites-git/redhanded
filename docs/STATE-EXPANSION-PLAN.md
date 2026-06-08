# RedHanded — State Court Data Expansion Plan

## Current Status
- **Illinois (Cook County)** — ✅ COMPLETE — 135 judges, 12,332 sentencing records
  - Source: Cook County State's Attorney Open Data (Socrata API)
  - Data: Sentencing, dispositions, intake, felony cases
  - Judge-level: prison/probation/jail rates, violent crime breakdown, race/gender, leniency scores
- **New York** — 🟡 PARTIAL — bail/pretrial/recidivism data collected, no judge-level sentencing yet
- **Federal** — ✅ 190 judges from CourtListener

## Expansion Strategy

### Tier 1 — Major States with Open Sentencing Data by Judge (Priority)

These have **bulk downloadable data with judge names attached to sentencing records**:

#### 1. 🟢 Florida (FDLE Criminal Justice Data Transparency)
- **Source:** `fdle.state.fl.us/CJAB/CJDT`
- **Data available:** Sentencing details, court case data, defendant info — ALL 67 counties
- **Judge-level:** ✅ Yes — judge names in court case data
- **Format:** Interactive dashboards + downloadable datasets (updated daily)
- **Key endpoint:** FDLE CJDT Sentencing Details report
- **Also:** FDLE CJDT Master download (all Florida convictions)
- **Population:** 22M+ (3rd largest state)
- **Priority:** 🔴 HIGH — Bryan lives in FL, huge dataset, great transparency
- **Effort:** Medium — need to figure out download/API format, build parser

#### 2. 🟢 New York (OCA STAT Act Data)
- **Source:** `nycourts.gov` — Office of Court Administration
- **Data available:** Arraignments, dispositions, sentencing, case outcomes
- **Judge-level:** ✅ Yes — judge assignment in case data
- **Format:** Downloadable extracts + dashboards
- **Key fields:** Disposition type, most severe sentence, fines, court/county
- **Population:** 19M+ (4th largest state)
- **Priority:** 🔴 HIGH — we already have partial NY data, just need sentencing by judge
- **Effort:** Medium — OCA data dictionary exists, need to build extractor

#### 3. 🟡 Texas (Office of Court Administration)
- **Source:** `txcourts.gov/statistics/`
- **Data available:** Annual reports by court, judge demographics, caseload stats
- **Judge-level:** ⚠️ Partial — judge-level stats in annual reports, but NOT case-level sentencing
- **Note:** Texas courts are NOT subject to FOIA/Public Information Act
- **Workaround:** Harris County (Houston) District Clerk has searchable records
- **Population:** 30M+ (2nd largest state)
- **Priority:** 🟡 MEDIUM — large state but data is harder to get in bulk
- **Effort:** High — may need county-by-county scraping (Harris, Dallas, Bexar, Travis, Tarrant)

#### 4. 🟢 California (OpenJustice)
- **Source:** `openjustice.doj.ca.gov`
- **Data available:** Arrests, dispositions, sentencing — statewide
- **Judge-level:** ⚠️ May not include judge names — focused on county-level aggregates
- **Format:** Downloadable CSV datasets
- **Population:** 39M+ (largest state)
- **Priority:** 🟡 MEDIUM — huge state but judge-level data may require FOIA requests
- **Effort:** Medium for county-level, High for judge-level

#### 5. 🟢 Arizona (Maricopa County Attorney's Office)
- **Source:** `maricopacountyattorney.org/419/Data-Dashboard`
- **Data available:** Criminal case referrals, outcomes, sentencing
- **Judge-level:** ✅ Yes — case-level data includes judge assignments
- **Format:** Dashboard with data export
- **Population:** 7M+ (Maricopa alone is 4M+)
- **Priority:** 🟡 MEDIUM — one county but it's massive
- **Effort:** Medium

### Tier 2 — States with Accessible Court Record Systems

#### 6. Pennsylvania (Unified Judicial System)
- **Source:** `ujsportal.pacourts.us`
- **Data:** Individual docket sheets searchable by case, county, judge
- **Judge-level:** ✅ Yes — presiding judge on every docket
- **Challenge:** No bulk download — would need scraping strategy
- **Effort:** High

#### 7. Michigan
- **Source:** Michigan Courts (various county portals)
- **Challenge:** Fragmented county-by-county
- **Effort:** High

#### 8. Ohio
- **Source:** Ohio Supreme Court statistical reports
- **Challenge:** Aggregate data, judge-level requires county portals
- **Effort:** High

### Tier 3 — Future States (require more research)
- Georgia, North Carolina, Virginia, New Jersey, Massachusetts, Washington, Colorado, Minnesota

---

## Recommended Execution Order

### Phase 1 (Now → 2 weeks)
1. **Florida FDLE** — Bryan's home state, great open data, should be straightforward
2. **New York OCA** — Already have partial data, fill in judge-level sentencing

### Phase 2 (2-4 weeks)
3. **Maricopa County, AZ** — Single county but massive, good data dashboard
4. **Cook County v2** — Expand IL data to include more years (currently 2024-2025 only)

### Phase 3 (1-2 months)
5. **Texas** — Start with Harris County, expand to Dallas/Bexar
6. **California** — Start with LA County, expand based on data availability

### Phase 4 (Ongoing)
7. **Pennsylvania** — Build scraper for UJS portal
8. **Remaining Tier 2/3 states**

---

## Technical Architecture

### Data Pipeline (per state)
```
1. fetch-{state}.py — Download raw data from source
2. build-{state}-profiles.py — Parse into judge profiles
3. data/state-courts/{state}/judge-profiles.json — Standardized output
4. src/lib/state-judges.ts — Auto-loads all state profiles
```

### Standardized Judge Profile Schema
Every state should output the same shape as Illinois:
```json
{
  "generated": "YYYY-MM-DD",
  "source": "Human-readable source name",
  "totalJudges": N,
  "totalCases": N,
  "courtAverage": { "prisonRate": 0.XX, ... },
  "judges": {
    "judge-slug": {
      "name": "Full Name",
      "slug": "url-slug",
      "state": "FL",
      "county": "Miami-Dade",
      "totalCases": N,
      "prisonRate": 0.XX,
      "probationRate": 0.XX,
      "jailRate": 0.XX,
      "violentCases": { ... },
      "offenseBreakdown": { ... },
      "raceBreakdown": { ... },
      "genderBreakdown": { ... },
      "leniencyScore": 0-100
    }
  }
}
```

### Multi-State Support Needed
- `src/lib/state-judges.ts` currently hardcoded to Illinois only — needs to aggregate all states
- Homepage map should show state-level coverage and allow drill-down
- Judge search should work across all states

---

## Notes
- Cook County model (Socrata API + JSON) is the gold standard — replicate where possible
- FDLE Florida is the best next target: same open-data philosophy, massive dataset, Bryan's home state
- Always store raw downloaded data separately from processed profiles
- Run data collection as cron jobs (like the existing `run-all-batches.mjs`)
