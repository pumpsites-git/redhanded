# Data Date Alignment — CRITICAL

## Target Timeframe: 2025 (matching our USSC FY2025 data)

ALL datasets should be 2025 whenever possible. 2024 is acceptable ONLY if 2025 hasn't been published yet. 2023 is absolute last resort and must be flagged.

**Priority:** 2025 > 2024 > 2023 (reject anything older)

## Current Data Alignment Status

| Dataset | Timeframe | Format | Status | Aligned? |
|---------|-----------|--------|--------|----------|
| USSC Individual Offender | FY2025 (Oct 2024-Sep 2025) | CSV | ✅ Loaded | ✅ PRIMARY |
| USSC Criminal History | FY2025 | CSV | ✅ Loaded | ✅ |
| USSC Sentencing Stats by Geography | FY2024 | JSON | ✅ Loaded | ⚠️ 1yr behind |
| CourtListener Judge Data | Current (live) | API | 🔄 106/190 | ✅ |
| CourtListener Case Counts | All time (cumulative) | API | 🔄 106/190 | ✅ |

## State Data — MUST Match These Years

When pulling state data for CA, TX, FL, NY, IL, use:
- **Primary target: FY2025 or CY2025** (match our federal data)
- **Acceptable: FY2024 or CY2024** (only if 2025 not published yet)
- **Last resort: 2023** (flag prominently on site)
- **REJECT anything older than 2023** — too stale

### FBI Crime Data
- Target: **2023 or 2024** NIBRS data (latest available)
- UCR transition to NIBRS happened 2021 — only use post-transition data

### BJS State Prison/Recidivism
- Latest: **Prisoners in 2023** (published 2024)
- Recidivism studies use release cohorts — check year of release cohort

### State Court Statistics
- FL Courts: target **FY2023-2024** annual report
- TX OCA: target **FY2024** annual statistical report  
- CA Courts: target **FY2023-2024** Judicial Council report
- NY Courts: target **CY2023-2024** annual report
- IL Courts: target **FY2024** annual report

### State DOC Recidivism
- FL DOC: latest recidivism report (usually 3-year release cohort)
- TX TDCJ: latest statistical report
- CA CDCR: recidivism report
- NY DOCCS: latest data
- IL DOC: latest data

## Rules
1. NEVER mix 2019 data with 2024 data in the same analysis
2. Always note the exact timeframe in the data source attribution
3. If two datasets are >2 years apart, flag it prominently on the page
4. Federal FY runs Oct-Sep; most state FYs run Jul-Jun; some are calendar year
5. When comparing federal to state, note the timeframe difference

## Why This Matters
If we show federal sentencing data from FY2025 next to state crime data from 2019, the comparison is meaningless. COVID, policy changes, and crime trends shifted dramatically 2020-2024. Everything must be post-pandemic to be credible.
